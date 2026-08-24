import {
  StaffDetailRecord,
  TeacherAttendanceRecord,
  LeaveApplication,
  OnDutyRecord,
  AttendanceStatus,
  LeaveType,
  TimetableSlot,
  PortfolioAssignment,
  PortfolioTemplate,
  TeacherTask
} from '../types/academic';
import { getLeaveBalance, calculateLeaveDays } from './leaveEngine';

export interface ResolvedTeacherAttendance {
  staff: StaffDetailRecord;
  status: AttendanceStatus;
  isAutoPresent: boolean;
  leaveType?: LeaveType;
  remarks?: string;
  leaveFrom?: string;
  leaveTo?: string;
  halfDay?: boolean;
  halfDaySession?: 'First Half' | 'Second Half';
}

export interface AbsenceInfo {
  isAbsent: boolean;
  status?: AttendanceStatus;
  leaveType?: LeaveType;
  fromDate?: string;
  toDate?: string;
  reason?: string;
  halfDay?: boolean;
  halfDaySession?: 'First Half' | 'Second Half';
}

export interface ActingInchargeResult {
  primaryIncharge?: { employeeCode: string; name: string; role: string };
  actingIncharge?: { employeeCode: string; name: string; role: string };
  isShifted: boolean;
  reason?: string;
}

export interface AdminAbsenceAlert {
  teacher: StaffDetailRecord;
  absence: AbsenceInfo;
  proxyPeriodsRequired: TimetableSlot[];
  shiftedRoles: { committeeName: string; actingInchargeName: string; roleLevel: string }[];
  pendingTasksDue: TeacherTask[];
}

/**
 * Normalizes faculty name key for comparison (strips honorifics and punctuation)
 */
export const normalizeFacultyKey = (name?: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^(mr|mrs|ms|dr|smt|shri|sh)\.?\s+/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

/**
 * Checks whether a specific targetDate falls on or between fromDate and toDate
 */
export const isDateInRange = (targetDate: string, fromDate: string, toDate: string): boolean => {
  return targetDate >= fromDate && targetDate <= toDate;
};

/**
 * Cancels or supersedes active sanctioned leave records for a specific teacher on a specific date.
 * If single-day: marks status as 'Cancelled' with audit fields.
 * If multi-day: trims the date or splits the application without deleting historical records.
 * Automatically recalculates leave balance and updates the staff record.
 */
export function cancelOrSupersedeLeaveForStaffDate(
  staff: StaffDetailRecord,
  targetDate: string,
  leaveApplications: LeaveApplication[],
  cancelledBy: string = 'Principal',
  remarks: string = 'Attendance corrected to Present by Principal'
): { updatedLeaves: LeaveApplication[]; updatedStaff: StaffDetailRecord; affectedLeaveCount: number } {
  const codeMatch = (code?: string) =>
    Boolean(code && staff.employeeCode && String(code).trim().toLowerCase() === String(staff.employeeCode).trim().toLowerCase());
  const nameMatch = (name?: string) => {
    if (!staff.name || !name) return false;
    const k1 = normalizeFacultyKey(staff.name);
    const k2 = normalizeFacultyKey(name);
    return Boolean(k1 && k2 && k1 === k2);
  };

  let affectedLeaveCount = 0;
  const updatedLeaves: LeaveApplication[] = [];

  for (const leave of leaveApplications) {
    const isTargetTeacher = codeMatch(leave.employeeCode) || nameMatch(leave.teacherName);
    const isTargetDateSpanned = isDateInRange(targetDate, leave.fromDate, leave.toDate);
    const isActiveStatus = leave.status === 'Sanctioned' || (leave.status as string) === 'Approved' || (leave.status as string) === 'Pending';

    if (isTargetTeacher && isTargetDateSpanned && isActiveStatus) {
      affectedLeaveCount++;
      if (leave.fromDate === targetDate && leave.toDate === targetDate) {
        // Single day leave - mark as Cancelled
        updatedLeaves.push({
          ...leave,
          status: 'Cancelled',
          cancelledAt: new Date().toISOString(),
          cancelledBy,
          principalRemarks: `${leave.principalRemarks ? leave.principalRemarks + ' | ' : ''}Cancelled on ${targetDate}: ${remarks}`
        });
      } else if (leave.fromDate === targetDate) {
        // Shift fromDate +1 day
        const [y, m, d] = targetDate.split('-').map(Number);
        const nextDate = new Date(y, m - 1, d + 1).toISOString().split('T')[0];
        const newDays = calculateLeaveDays(nextDate, leave.toDate);
        updatedLeaves.push({
          ...leave,
          fromDate: nextDate,
          totalDays: newDays,
          principalRemarks: `${leave.principalRemarks ? leave.principalRemarks + ' | ' : ''}Excluded ${targetDate}: ${remarks}`
        });
      } else if (leave.toDate === targetDate) {
        // Shift toDate -1 day
        const [y, m, d] = targetDate.split('-').map(Number);
        const prevDate = new Date(y, m - 1, d - 1).toISOString().split('T')[0];
        const newDays = calculateLeaveDays(leave.fromDate, prevDate);
        updatedLeaves.push({
          ...leave,
          toDate: prevDate,
          totalDays: newDays,
          principalRemarks: `${leave.principalRemarks ? leave.principalRemarks + ' | ' : ''}Excluded ${targetDate}: ${remarks}`
        });
      } else {
        // Multi-day middle split
        const [y, m, d] = targetDate.split('-').map(Number);
        const prevDate = new Date(y, m - 1, d - 1).toISOString().split('T')[0];
        const nextDate = new Date(y, m - 1, d + 1).toISOString().split('T')[0];
        
        updatedLeaves.push({
          ...leave,
          toDate: prevDate,
          totalDays: calculateLeaveDays(leave.fromDate, prevDate),
          principalRemarks: `${leave.principalRemarks ? leave.principalRemarks + ' | ' : ''}Split: excluded ${targetDate}`
        });
        updatedLeaves.push({
          ...leave,
          id: `la-${Date.now()}-split`,
          fromDate: nextDate,
          totalDays: calculateLeaveDays(nextDate, leave.toDate),
          principalRemarks: `${leave.principalRemarks ? leave.principalRemarks + ' | ' : ''}Split continuation from ${nextDate}`
        });
      }
    } else {
      updatedLeaves.push(leave);
    }
  }

  // Recalculate staff leave balances with the updated leaves
  const newBalance = getLeaveBalance(staff, updatedLeaves, targetDate);
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

  return { updatedLeaves, updatedStaff, affectedLeaveCount };
}

/**
 * Cancels or adjusts On-Duty records for a specific teacher on a specific date.
 */
export function cancelOrSupersedeOnDutyForStaffDate(
  staff: StaffDetailRecord,
  targetDate: string,
  onDutyRecords: OnDutyRecord[]
): { updatedODs: OnDutyRecord[]; affectedODCount: number } {
  const codeMatch = (code?: string) =>
    Boolean(code && staff.employeeCode && String(code).trim().toLowerCase() === String(staff.employeeCode).trim().toLowerCase());
  const nameMatch = (name?: string) => {
    if (!staff.name || !name) return false;
    const k1 = normalizeFacultyKey(staff.name);
    const k2 = normalizeFacultyKey(name);
    return Boolean(k1 && k2 && k1 === k2);
  };

  let affectedODCount = 0;
  const updatedODs: OnDutyRecord[] = [];

  for (const od of onDutyRecords) {
    const isTargetTeacher = codeMatch(od.employeeCode) || nameMatch(od.teacherName);
    const isTargetDateSpanned = isDateInRange(targetDate, od.fromDate, od.toDate);

    if (isTargetTeacher && isTargetDateSpanned) {
      affectedODCount++;
      if (od.fromDate === targetDate && od.toDate === targetDate) {
        // Drop single-day OD
        continue;
      } else if (od.fromDate === targetDate) {
        const [y, m, d] = targetDate.split('-').map(Number);
        const nextDate = new Date(y, m - 1, d + 1).toISOString().split('T')[0];
        updatedODs.push({
          ...od,
          fromDate: nextDate,
          totalDays: calculateLeaveDays(nextDate, od.toDate)
        });
      } else if (od.toDate === targetDate) {
        const [y, m, d] = targetDate.split('-').map(Number);
        const prevDate = new Date(y, m - 1, d - 1).toISOString().split('T')[0];
        updatedODs.push({
          ...od,
          toDate: prevDate,
          totalDays: calculateLeaveDays(od.fromDate, prevDate)
        });
      } else {
        const [y, m, d] = targetDate.split('-').map(Number);
        const prevDate = new Date(y, m - 1, d - 1).toISOString().split('T')[0];
        const nextDate = new Date(y, m - 1, d + 1).toISOString().split('T')[0];
        updatedODs.push({
          ...od,
          toDate: prevDate,
          totalDays: calculateLeaveDays(od.fromDate, prevDate)
        });
        updatedODs.push({
          ...od,
          id: `od-${Date.now()}-split`,
          fromDate: nextDate,
          totalDays: calculateLeaveDays(nextDate, od.toDate)
        });
      }
    } else {
      updatedODs.push(od);
    }
  }

  return { updatedODs, affectedODCount };
}

/**
 * Resolves the attendance status for all teachers on a given date.
 * If unmarked, teachers automatically count as 'Present' (Auto-Present).
 */
export const resolveTeacherAttendance = (
  staffList: StaffDetailRecord[],
  selectedDate: string,
  attendanceRecords: TeacherAttendanceRecord[] = [],
  leaveApplications: LeaveApplication[] = [],
  onDutyRecords: OnDutyRecord[] = []
): ResolvedTeacherAttendance[] => {
  return staffList.map(staff => {
    const codeMatch = (code?: string) =>
      Boolean(code && staff.employeeCode && String(code).trim().toLowerCase() === String(staff.employeeCode).trim().toLowerCase());
    const nameMatch = (name?: string) => {
      if (!staff.name || !name) return false;
      const k1 = normalizeFacultyKey(staff.name);
      const k2 = normalizeFacultyKey(name);
      return Boolean(k1 && k2 && k1 === k2);
    };

    // 1. Check for explicit daily attendance record
    const explicitRecord = attendanceRecords.find(
      a => a.date === selectedDate && (codeMatch(a.employeeCode) || nameMatch(a.teacherName))
    );

    if (explicitRecord) {
      return {
        staff,
        status: explicitRecord.status,
        isAutoPresent: false,
        leaveType: explicitRecord.leaveType,
        remarks: explicitRecord.remarks || (explicitRecord.status === 'Present' ? 'Marked Present by Authority' : undefined),
        leaveFrom: selectedDate,
        leaveTo: selectedDate,
        halfDay: explicitRecord.halfDay,
        halfDaySession: explicitRecord.halfDaySession
      };
    }

    // 2. Check for sanctioned/approved leave spanning selectedDate
    const activeLeave = leaveApplications.find(
      l =>
        (codeMatch(l.employeeCode) || nameMatch(l.teacherName)) &&
        (l.status === 'Sanctioned' || (l.status as string) === 'Approved' || (l.status as string) === 'Pending') &&
        isDateInRange(selectedDate, l.fromDate, l.toDate)
    );

    if (activeLeave) {
      if (activeLeave.isCombinedLeave && activeLeave.dailyLeaveBreakdown && activeLeave.dailyLeaveBreakdown.length > 0) {
        const dayEntry = activeLeave.dailyLeaveBreakdown.find(d => d.date === selectedDate);
        if (dayEntry) {
          if (dayEntry.leaveType === 'Sunday' || dayEntry.leaveType === 'Holiday' || dayEntry.leaveType === 'None' || dayEntry.isNonWorkingDay) {
            return {
              staff,
              status: 'Present',
              isAutoPresent: true,
              remarks: `${dayEntry.leaveType || 'Holiday'} (Non-debit day in continuous leave)`
            };
          }
          return {
            staff,
            status: 'Leave',
            isAutoPresent: false,
            leaveType: dayEntry.leaveType as LeaveType,
            remarks: dayEntry.reason || activeLeave.reason,
            leaveFrom: activeLeave.fromDate,
            leaveTo: activeLeave.toDate,
            halfDay: dayEntry.halfDay,
            halfDaySession: dayEntry.halfDaySession
          };
        }
      }

      return {
        staff,
        status: 'Leave',
        isAutoPresent: false,
        leaveType: activeLeave.leaveType,
        remarks: activeLeave.reason,
        leaveFrom: activeLeave.fromDate,
        leaveTo: activeLeave.toDate,
        halfDay: activeLeave.halfDay,
        halfDaySession: activeLeave.halfDaySession
      };
    }

    // 3. Check for official OD spanning selectedDate
    const activeOD = onDutyRecords.find(
      od =>
        (codeMatch(od.employeeCode) || nameMatch(od.teacherName)) &&
        isDateInRange(selectedDate, od.fromDate, od.toDate)
    );

    if (activeOD) {
      return {
        staff,
        status: 'OD',
        isAutoPresent: false,
        leaveType: 'OD',
        remarks: `${activeOD.purpose} at ${activeOD.venue || 'Deputed Venue'}`,
        leaveFrom: activeOD.fromDate,
        leaveTo: activeOD.toDate
      };
    }

    // 4. Unmarked -> Automatically resolved as Present!
    return {
      staff,
      status: 'Present',
      isAutoPresent: true,
      remarks: 'Present on campus (Auto-marked by system)'
    };
  });
};

/**
 * Checks if a teacher is absent (Leave, OD, Absent) on a given date and optional periodNumber.
 * Logic:
 * - Full-day leave -> absent for all periods
 * - Half-day First Half -> absent only for periods 1-4 (present for periods 5-9)
 * - Half-day Second Half -> absent only for periods 5-9 (present for periods 1-4)
 */
export const checkTeacherAbsenceOnDate = (
  employeeCode: string,
  targetDate: string,
  attendanceRecords: TeacherAttendanceRecord[] = [],
  leaveApplications: LeaveApplication[] = [],
  onDutyRecords: OnDutyRecord[] = [],
  teacherName?: string,
  periodNum?: number
): AbsenceInfo => {
  const codeMatch = (code?: string) =>
    Boolean(code && employeeCode && String(code).trim().toLowerCase() === String(employeeCode).trim().toLowerCase());

  const nameMatch = (name?: string) => {
    if (!teacherName || !name) return false;
    const k1 = normalizeFacultyKey(teacherName);
    const k2 = normalizeFacultyKey(name);
    return Boolean(k1 && k2 && k1 === k2);
  };

  const pNum = typeof periodNum === 'number' ? Number(periodNum) : undefined;

  // 1. Check Explicit Attendance Record
  const att = attendanceRecords.find(
    a => (codeMatch(a.employeeCode) || nameMatch(a.teacherName)) && a.date === targetDate
  );

  if (att) {
    if (att.status === 'Present') {
      return { isAbsent: false, status: 'Present' };
    }
    if (att.halfDay && att.halfDaySession && pNum !== undefined) {
      if (att.halfDaySession === 'First Half') {
        if (pNum <= 4) {
          return {
            isAbsent: true,
            status: att.status,
            leaveType: att.leaveType,
            fromDate: targetDate,
            toDate: targetDate,
            reason: att.remarks || 'Half-Day Leave (First Half)',
            halfDay: true,
            halfDaySession: 'First Half'
          };
        } else {
          return { isAbsent: false, status: 'Present', halfDay: true, halfDaySession: 'First Half' };
        }
      } else if (att.halfDaySession === 'Second Half') {
        if (pNum >= 5) {
          return {
            isAbsent: true,
            status: att.status,
            leaveType: att.leaveType,
            fromDate: targetDate,
            toDate: targetDate,
            reason: att.remarks || 'Half-Day Leave (Second Half)',
            halfDay: true,
            halfDaySession: 'Second Half'
          };
        } else {
          return { isAbsent: false, status: 'Present', halfDay: true, halfDaySession: 'Second Half' };
        }
      }
    }
    return {
      isAbsent: true,
      status: att.status,
      leaveType: att.leaveType,
      fromDate: targetDate,
      toDate: targetDate,
      reason: att.remarks || `Marked ${att.status}`,
      halfDay: att.halfDay,
      halfDaySession: att.halfDaySession
    };
  }

  // 2. Check Leave
  const leave = leaveApplications.find(
    l =>
      (codeMatch(l.employeeCode) || nameMatch(l.teacherName)) &&
      (l.status === 'Sanctioned' || (l.status as string) === 'Approved' || (l.status as string) === 'Pending') &&
      isDateInRange(targetDate, l.fromDate, l.toDate)
  );

  if (leave) {
    if (leave.isCombinedLeave && leave.dailyLeaveBreakdown && leave.dailyLeaveBreakdown.length > 0) {
      const dayEntry = leave.dailyLeaveBreakdown.find(d => d.date === targetDate);
      if (dayEntry) {
        if (dayEntry.leaveType === 'Sunday' || dayEntry.leaveType === 'Holiday' || dayEntry.leaveType === 'None' || dayEntry.isNonWorkingDay) {
          return {
            isAbsent: false,
            status: 'Present',
            reason: `${dayEntry.leaveType || 'Holiday'} (Non-debit day in continuous leave)`
          };
        }
        const effectiveLeaveType = dayEntry.leaveType as LeaveType;
        if (dayEntry.halfDay && dayEntry.halfDaySession && pNum !== undefined) {
          if (dayEntry.halfDaySession === 'First Half') {
            if (pNum <= 4) {
              return {
                isAbsent: true,
                status: 'Leave',
                leaveType: effectiveLeaveType,
                fromDate: targetDate,
                toDate: targetDate,
                reason: dayEntry.reason || leave.reason || 'Half-Day Leave (First Half)',
                halfDay: true,
                halfDaySession: 'First Half'
              };
            } else {
              return { isAbsent: false, status: 'Present', halfDay: true, halfDaySession: 'First Half' };
            }
          } else if (dayEntry.halfDaySession === 'Second Half') {
            if (pNum >= 5) {
              return {
                isAbsent: true,
                status: 'Leave',
                leaveType: effectiveLeaveType,
                fromDate: targetDate,
                toDate: targetDate,
                reason: dayEntry.reason || leave.reason || 'Half-Day Leave (Second Half)',
                halfDay: true,
                halfDaySession: 'Second Half'
              };
            } else {
              return { isAbsent: false, status: 'Present', halfDay: true, halfDaySession: 'Second Half' };
            }
          }
        }
        return {
          isAbsent: true,
          status: 'Leave',
          leaveType: effectiveLeaveType,
          fromDate: targetDate,
          toDate: targetDate,
          reason: dayEntry.reason || leave.reason,
          halfDay: dayEntry.halfDay,
          halfDaySession: dayEntry.halfDaySession
        };
      }
    }

    if (leave.halfDay && leave.halfDaySession && pNum !== undefined) {
      if (leave.halfDaySession === 'First Half') {
        if (pNum <= 4) {
          return {
            isAbsent: true,
            status: 'Leave',
            leaveType: leave.leaveType,
            fromDate: leave.fromDate,
            toDate: leave.toDate,
            reason: leave.reason || 'Half-Day Leave (First Half)',
            halfDay: true,
            halfDaySession: 'First Half'
          };
        } else {
          return { isAbsent: false, status: 'Present', halfDay: true, halfDaySession: 'First Half' };
        }
      } else if (leave.halfDaySession === 'Second Half') {
        if (pNum >= 5) {
          return {
            isAbsent: true,
            status: 'Leave',
            leaveType: leave.leaveType,
            fromDate: leave.fromDate,
            toDate: leave.toDate,
            reason: leave.reason || 'Half-Day Leave (Second Half)',
            halfDay: true,
            halfDaySession: 'Second Half'
          };
        } else {
          return { isAbsent: false, status: 'Present', halfDay: true, halfDaySession: 'Second Half' };
        }
      }
    }
    return {
      isAbsent: true,
      status: 'Leave',
      leaveType: leave.leaveType,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      reason: leave.reason,
      halfDay: leave.halfDay,
      halfDaySession: leave.halfDaySession
    };
  }

  // 3. Check OD
  const od = onDutyRecords.find(
    o =>
      (codeMatch(o.employeeCode) || nameMatch(o.teacherName)) &&
      isDateInRange(targetDate, o.fromDate, o.toDate)
  );

  if (od) {
    if (od.affectedPeriods && od.affectedPeriods.length > 0 && pNum !== undefined) {
      const isPeriodAffected = od.affectedPeriods.some(ap => ap.period === pNum);
      if (!isPeriodAffected) {
        return { isAbsent: false, status: 'Present' };
      }
    }
    return {
      isAbsent: true,
      status: 'OD',
      leaveType: 'OD',
      fromDate: od.fromDate,
      toDate: od.toDate,
      reason: `${od.purpose} (${od.venue || 'Deputed'})`
    };
  }

  return { isAbsent: false };
};

/**
 * Checks if a teacher is available to be assigned a task/duty with a specific due date.
 * (Rule i & i.a):
 * - If targetDueDate falls within the teacher's active absence window -> NOT available (Rule i)
 * - If targetDueDate falls outside the teacher's absence window -> Available (Rule i.a)
 */
export const isTeacherAvailableForDeadline = (
  employeeCode: string,
  targetDueDate: string,
  attendanceRecords: TeacherAttendanceRecord[] = [],
  leaveApplications: LeaveApplication[] = [],
  onDutyRecords: OnDutyRecord[] = []
): { isAvailable: boolean; absenceInfo?: AbsenceInfo } => {
  const absence = checkTeacherAbsenceOnDate(
    employeeCode,
    targetDueDate,
    attendanceRecords,
    leaveApplications,
    onDutyRecords
  );

  if (absence.isAbsent) {
    return { isAvailable: false, absenceInfo: absence };
  }

  return { isAvailable: true };
};

/**
 * Resolves the Acting In-Charge for a committee when the primary In-Charge is on leave (Rule ii).
 */
export const resolveActingInchargeForTemplate = (
  template: PortfolioTemplate,
  assignments: PortfolioAssignment[],
  targetDate: string,
  attendanceRecords: TeacherAttendanceRecord[] = [],
  leaveApplications: LeaveApplication[] = [],
  onDutyRecords: OnDutyRecord[] = []
): ActingInchargeResult => {
  const inchargeAssignment = assignments.find(
    a => a.portfolioTemplateId === template.id && a.role === 'In-charge' && a.status === 'Active'
  );

  if (!inchargeAssignment) {
    return { isShifted: false };
  }

  const primaryAbsence = checkTeacherAbsenceOnDate(
    inchargeAssignment.teacherEmployeeCode,
    targetDate,
    attendanceRecords,
    leaveApplications,
    onDutyRecords
  );

  if (!primaryAbsence.isAbsent) {
    return {
      primaryIncharge: {
        employeeCode: inchargeAssignment.teacherEmployeeCode,
        name: inchargeAssignment.teacherName,
        role: 'In-charge'
      },
      isShifted: false
    };
  }

  // Primary In-Charge is absent! Find first available committee member
  const members = assignments.filter(
    a => a.portfolioTemplateId === template.id && a.role === 'Member' && a.status === 'Active'
  );

  const availableMember = members.find(m => {
    const abs = checkTeacherAbsenceOnDate(
      m.teacherEmployeeCode,
      targetDate,
      attendanceRecords,
      leaveApplications,
      onDutyRecords
    );
    return !abs.isAbsent;
  });

  if (availableMember) {
    return {
      primaryIncharge: {
        employeeCode: inchargeAssignment.teacherEmployeeCode,
        name: inchargeAssignment.teacherName,
        role: 'In-charge'
      },
      actingIncharge: {
        employeeCode: availableMember.teacherEmployeeCode,
        name: availableMember.teacherName,
        role: 'Acting In-Charge'
      },
      isShifted: true,
      reason: `${inchargeAssignment.teacherName} is on ${primaryAbsence.leaveType || primaryAbsence.status || 'Leave'} (${primaryAbsence.fromDate} to ${primaryAbsence.toDate})`
    };
  }

  return {
    primaryIncharge: {
      employeeCode: inchargeAssignment.teacherEmployeeCode,
      name: inchargeAssignment.teacherName,
      role: 'In-charge'
    },
    isShifted: true,
    reason: `${inchargeAssignment.teacherName} is on leave and all committee members are absent.`
  };
};

/**
 * Aggregates all Admin Absence Delegation Alerts for a date (Rule iii).
 */
export const getAdminAbsenceDelegationAlerts = (
  selectedDate: string,
  staffList: StaffDetailRecord[],
  attendanceRecords: TeacherAttendanceRecord[] = [],
  leaveApplications: LeaveApplication[] = [],
  onDutyRecords: OnDutyRecord[] = [],
  timetable: TimetableSlot[] = [],
  templates: PortfolioTemplate[] = [],
  assignments: PortfolioAssignment[] = [],
  tasks: TeacherTask[] = []
): AdminAbsenceAlert[] => {
  const dayName = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });

  const resolved = resolveTeacherAttendance(
    staffList,
    selectedDate,
    attendanceRecords,
    leaveApplications,
    onDutyRecords
  );

  const absentStaff = resolved.filter(r => r.status === 'Leave' || r.status === 'OD' || r.status === 'Absent');

  return absentStaff.map(r => {
    const absence: AbsenceInfo = {
      isAbsent: true,
      status: r.status,
      leaveType: r.leaveType,
      fromDate: r.leaveFrom || selectedDate,
      toDate: r.leaveTo || selectedDate,
      reason: r.remarks
    };

    // 1. Scheduled Timetable Periods for this day
    const proxyPeriods = timetable.filter(
      t =>
        (t.day === dayName || t.dayOfWeek === dayName) &&
        (t.teacherId === r.staff.employeeCode ||
          (t.teacherName && t.teacherName.toLowerCase() === r.staff.name.toLowerCase()))
    );

    // 2. In-Charge roles shifted to acting In-Charge
    const shiftedRoles: { committeeName: string; actingInchargeName: string; roleLevel: string }[] = [];
    templates.forEach(tpl => {
      const isTeacherIncharge = assignments.some(
        a =>
          a.portfolioTemplateId === tpl.id &&
          a.role === 'In-charge' &&
          a.status === 'Active' &&
          a.teacherEmployeeCode === r.staff.employeeCode
      );

      if (isTeacherIncharge) {
        const actingResult = resolveActingInchargeForTemplate(
          tpl,
          assignments,
          selectedDate,
          attendanceRecords,
          leaveApplications,
          onDutyRecords
        );

        if (actingResult.isShifted && actingResult.actingIncharge) {
          shiftedRoles.push({
            committeeName: tpl.name,
            actingInchargeName: actingResult.actingIncharge.name,
            roleLevel: actingResult.actingIncharge.role
          });
        }
      }
    });

    // 3. Pending tasks due on or during absence period
    const pendingTasks = tasks.filter(t => {
      const isAssigned =
        t.assignedTo === r.staff.name ||
        t.assignedTo === r.staff.employeeCode;
      const isPending = t.status === 'Pending' || t.status === 'In Progress';
      const isDueInLeave = t.dueDate && isDateInRange(t.dueDate, absence.fromDate!, absence.toDate!);
      return isAssigned && isPending && isDueInLeave;
    });

    return {
      teacher: r.staff,
      absence,
      proxyPeriodsRequired: proxyPeriods,
      shiftedRoles,
      pendingTasksDue: pendingTasks
    };
  });
};
