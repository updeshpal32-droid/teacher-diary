import {
  StaffDetailRecord,
  LeaveType,
  LeaveBalance,
  LeaveApplication
} from '../types/academic';

/**
 * Complete KVS Leave Engine
 * Provides calculation, validation, debit, and strict Contractual rules.
 */

export interface LeaveValidationResult {
  canApply: boolean;
  reason?: string;
  isContractualBreach?: boolean;
  requiresPrincipalOverride?: boolean;
  recommendedLeaveType?: LeaveType;
}

/**
 * Calculate total days between two YYYY-MM-DD dates inclusive
 */
export function calculateLeaveDays(fromDate: string, toDate: string): number {
  if (!fromDate || !toDate) return 0;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return 0;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Compute continuous service months for Contractual staff
 */
export function getContractualCompletedMonths(staff: StaffDetailRecord, referenceDateStr: string = new Date().toISOString()): number {
  const joinDateStr = staff.contractualJoiningDate || staff.joiningDatePresentKVWithDesignation || staff.joiningDateKVSWithDesignation;
  if (!joinDateStr) return 0;

  // Handle DD/MM/YYYY or YYYY-MM-DD
  let joinDate: Date;
  if (joinDateStr.includes('/')) {
    const parts = joinDateStr.split('/');
    joinDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  } else {
    joinDate = new Date(joinDateStr);
  }

  const refDate = new Date(referenceDateStr);
  if (isNaN(joinDate.getTime()) || isNaN(refDate.getTime())) return 0;

  let months = (refDate.getFullYear() - joinDate.getFullYear()) * 12 + (refDate.getMonth() - joinDate.getMonth());
  if (refDate.getDate() < joinDate.getDate()) {
    months--;
  }
  return Math.max(0, months);
}

/**
 * Check if the staff has vacation/break duty assigned in the target month (which reduces contractual CL to 0)
 */
export function hasVacationRemedialDutyInMonth(staff: StaffDetailRecord, targetYearMonthStr: string): boolean {
  if (!staff.vacationRemedialDutyAssignedMonths || staff.vacationRemedialDutyAssignedMonths.length === 0) {
    return false;
  }
  return staff.vacationRemedialDutyAssignedMonths.includes(targetYearMonthStr);
}

/**
 * Compute real-time Leave Balance for a Staff Member
 */
export function getLeaveBalance(
  staff: StaffDetailRecord,
  sanctionedLeaves: LeaveApplication[] = [],
  referenceDateStr: string = new Date().toISOString()
): LeaveBalance {
  const isContractual = staff.employmentType === 'Contractual';
  const refDate = new Date(referenceDateStr);
  const currentCalYear = refDate.getFullYear();
  const currentMonthStr = `${currentCalYear}-${String(refDate.getMonth() + 1).padStart(2, '0')}`;

  // Filter leaves sanctioned in this calendar year
  const staffLeaves = sanctionedLeaves.filter(
    l => l.employeeCode === staff.employeeCode && (l.status === 'Sanctioned' || l.status === 'Recommended')
  );

  let clAvailed = 0;
  let elAvailed = 0;
  let hplAvailed = 0;
  let commutedAvailed = 0;
  let specialClAvailed = 0;
  let cclAvailed = 0;

  const history = staffLeaves.map(l => {
    const days = l.totalDays || calculateLeaveDays(l.fromDate, l.toDate);
    if (l.leaveType === 'CL') clAvailed += days;
    else if (l.leaveType === 'EL') elAvailed += days;
    else if (l.leaveType === 'HPL') hplAvailed += days;
    else if (l.leaveType === 'Comm') {
      commutedAvailed += days;
      hplAvailed += days * 2; // Commuted is debited at 2x against HPL
    } else if (l.leaveType === 'SpCL') specialClAvailed += days;
    else if (l.leaveType === 'CCL') cclAvailed += days;

    return {
      leaveId: l.id,
      leaveType: l.leaveType,
      fromDate: l.fromDate,
      toDate: l.toDate,
      days,
      sanctionedAt: l.sanctionedAt || l.appliedAt,
      remarks: l.reason
    };
  });

  if (isContractual) {
    const completedMonths = getContractualCompletedMonths(staff, referenceDateStr);
    const hasVacationDuty = hasVacationRemedialDutyInMonth(staff, currentMonthStr);

    // Rule: Must complete 1 full month before first CL. Max 1 per completed month.
    let creditedCl = completedMonths >= 1 ? completedMonths : 0;
    if (hasVacationDuty) {
      creditedCl = Math.max(0, creditedCl - 1);
    }

    if (staff.leaveEntitlementOverride?.clBalance !== undefined) {
      creditedCl = staff.leaveEntitlementOverride.clBalance;
    }

    const contractualClBalance = Math.max(0, creditedCl - clAvailed);

    return {
      employeeCode: staff.employeeCode,
      teacherName: staff.name,
      employmentType: 'Contractual',
      academicYear: `${currentCalYear}-${currentCalYear + 1}`,
      calendarYear: currentCalYear,
      clTotal: creditedCl,
      clAvailed,
      clRemaining: contractualClBalance,
      elTotal: 0,
      elAvailed: 0,
      elRemaining: 0,
      hplTotal: 0,
      hplAvailed: 0,
      hplRemaining: 0,
      commutedAvailed: 0,
      specialClAvailed: 0,
      contractualMonthlyClCredited: creditedCl,
      contractualMonthlyClAvailed: clAvailed,
      contractualMonthlyClBalance: contractualClBalance,
      contractualVacationDutyExclusionActive: hasVacationDuty,
      leavesHistory: history,
      lastCalculatedAt: new Date().toISOString()
    };
  }

  // Regular Teachers Default Statutory Entitlements
  const clTotal = staff.leaveEntitlementOverride?.clBalance ?? 8;
  const elTotal = staff.leaveEntitlementOverride?.elBalance ?? 10;
  const hplTotal = staff.leaveEntitlementOverride?.hplBalance ?? 20;
  const cclTotal = staff.leaveEntitlementOverride?.cclBalance ?? 730;

  return {
    employeeCode: staff.employeeCode,
    teacherName: staff.name,
    employmentType: 'Regular',
    academicYear: `${currentCalYear}-${currentCalYear + 1}`,
    calendarYear: currentCalYear,
    clTotal,
    clAvailed,
    clRemaining: Math.max(0, clTotal - clAvailed),
    elTotal,
    elAvailed,
    elRemaining: Math.max(0, elTotal - elAvailed),
    hplTotal,
    hplAvailed,
    hplRemaining: Math.max(0, hplTotal - hplAvailed),
    commutedAvailed,
    specialClAvailed,
    cclTotal,
    cclAvailed,
    cclRemaining: Math.max(0, cclTotal - cclAvailed),
    contractualMonthlyClCredited: 0,
    contractualMonthlyClAvailed: 0,
    contractualMonthlyClBalance: 0,
    leavesHistory: history,
    lastCalculatedAt: new Date().toISOString()
  };
}

/**
 * Validate whether a teacher can apply for a given leave type and dates
 * Incorporates all Central Government & KVS Contractual safeguard rules.
 */
export function canApplyLeave(
  staff: StaffDetailRecord,
  leaveType: LeaveType,
  fromDate: string,
  toDate: string,
  existingSanctionedLeaves: LeaveApplication[] = [],
  halfDay?: boolean
): LeaveValidationResult {
  const isContractual = staff.employmentType === 'Contractual';
  const requestedDays = halfDay ? 0.5 : calculateLeaveDays(fromDate, toDate);

  if (requestedDays <= 0) {
    return { canApply: false, reason: 'To-Date must be on or after From-Date.' };
  }

  // Overlap check
  const hasOverlap = existingSanctionedLeaves.some(l => {
    if (l.employeeCode !== staff.employeeCode || l.status === 'Rejected' || l.status === 'Cancelled') {
      return false;
    }
    const lFrom = new Date(l.fromDate).getTime();
    const lTo = new Date(l.toDate).getTime();
    const reqFrom = new Date(fromDate).getTime();
    const reqTo = new Date(toDate).getTime();
    return reqFrom <= lTo && reqTo >= lFrom;
  });

  if (hasOverlap) {
    return { canApply: false, reason: 'You already have an existing leave applied or sanctioned during these dates.' };
  }

  // -------------------------------------------------------------
  // CONTRACTUAL TEACHER STRICT SAFEGUARDS
  // -------------------------------------------------------------
  if (isContractual) {
    // 1. Any leave other than CL or OD is strictly disallowed for Contractual (treated as Absent/Loss of Pay)
    if (leaveType !== 'CL' && leaveType !== 'OD') {
      return {
        canApply: false,
        isContractualBreach: true,
        requiresPrincipalOverride: true,
        recommendedLeaveType: 'Absent',
        reason: `Contractual staff are only entitled to Casual Leave (CL). Applying for ${leaveType} will be treated as Unpaid Absence (Loss of Pay) unless specifically sanctioned by the Principal.`
      };
    }

    if (leaveType === 'CL') {
      const fromD = new Date(fromDate);
      const targetMonthStr = `${fromD.getFullYear()}-${String(fromD.getMonth() + 1).padStart(2, '0')}`;

      // Rule: Must complete one full month of continuous service before first CL
      const completedMonths = getContractualCompletedMonths(staff, fromDate);
      if (completedMonths < 1) {
        return {
          canApply: false,
          isContractualBreach: true,
          reason: 'Contractual teachers must complete at least one full month of continuous service after joining before availing their first Casual Leave (CL).'
        };
      }

      // Rule: If assigned remedial/duty during vacation/break that month -> CL entitlement = 0
      if (hasVacationRemedialDutyInMonth(staff, targetMonthStr)) {
        return {
          canApply: false,
          isContractualBreach: true,
          reason: 'You have been assigned remedial / institutional duties during this vacation period. As per KVS contractual guidelines, CL entitlement for this month is 0.'
        };
      }

      // Rule: Max 1 CL per calendar month
      const currentMonthCls = existingSanctionedLeaves.filter(l => {
        if (l.employeeCode !== staff.employeeCode || l.leaveType !== 'CL' || l.status === 'Rejected' || l.status === 'Cancelled') {
          return false;
        }
        return l.fromDate.startsWith(targetMonthStr) || l.toDate.startsWith(targetMonthStr);
      });

      const alreadyTakenThisMonth = currentMonthCls.reduce((acc, l) => acc + (l.totalDays || calculateLeaveDays(l.fromDate, l.toDate)), 0);

      if (alreadyTakenThisMonth + requestedDays > 1) {
        return {
          canApply: false,
          isContractualBreach: true,
          reason: `Contractual staff are strictly limited to a maximum of 1 day Casual Leave per calendar month (Already availed: ${alreadyTakenThisMonth} day(s) in ${targetMonthStr}).`
        };
      }
    }

    return { canApply: true };
  }

  // -------------------------------------------------------------
  // REGULAR TEACHERS STATUTORY RULES
  // -------------------------------------------------------------
  const balance = getLeaveBalance(staff, existingSanctionedLeaves, fromDate);

  if (leaveType === 'CL') {
    if (balance.clRemaining < requestedDays) {
      return {
        canApply: false,
        reason: `Insufficient Casual Leave (CL) balance. Available: ${balance.clRemaining} day(s), Requested: ${requestedDays} day(s).`
      };
    }
  } else if (leaveType === 'EL') {
    if (balance.elRemaining < requestedDays) {
      return {
        canApply: false,
        reason: `Insufficient Earned Leave (EL) balance. Available: ${balance.elRemaining} day(s), Requested: ${requestedDays} day(s).`
      };
    }
  } else if (leaveType === 'HPL') {
    if (balance.hplRemaining < requestedDays) {
      return {
        canApply: false,
        reason: `Insufficient Half Pay Leave (HPL) balance. Available: ${balance.hplRemaining} day(s), Requested: ${requestedDays} day(s).`
      };
    }
  } else if (leaveType === 'Comm') {
    // Commuted leave requires 2x HPL
    if (balance.hplRemaining < requestedDays * 2) {
      return {
        canApply: false,
        reason: `Insufficient HPL balance for Commuted Leave. Commuting ${requestedDays} day(s) requires ${requestedDays * 2} HPL (Available: ${balance.hplRemaining} HPL).`
      };
    }
  } else if (leaveType === 'CCL') {
    if ((balance.cclRemaining || 0) < requestedDays) {
      return {
        canApply: false,
        reason: `Insufficient Child Care Leave (CCL) balance. Available: ${balance.cclRemaining || 0} day(s).`
      };
    }
  }

  return { canApply: true };
}

/**
 * Debit Leave from staff balance upon Principal Sanction
 */
export function debitLeave(
  staff: StaffDetailRecord,
  leave: LeaveApplication,
  existingSanctionedLeaves: LeaveApplication[] = []
): { updatedStaff: StaffDetailRecord; updatedLeaves: LeaveApplication[]; newBalance: LeaveBalance } {
  const updatedLeaves = [
    ...existingSanctionedLeaves.filter(l => l.id !== leave.id),
    { ...leave, status: 'Sanctioned' as const, sanctionedAt: new Date().toISOString() }
  ];

  const newBalance = getLeaveBalance(staff, updatedLeaves);

  const updatedStaff: StaffDetailRecord = {
    ...staff,
    leaveEntitlementOverride: {
      clBalance: newBalance.clRemaining,
      elBalance: newBalance.elRemaining,
      hplBalance: newBalance.hplRemaining,
      cclBalance: newBalance.cclRemaining
    },
    updatedAt: new Date().toISOString()
  };

  return { updatedStaff, updatedLeaves, newBalance };
}