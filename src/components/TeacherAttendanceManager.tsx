import React, { useState, useEffect, useMemo } from 'react';
import {
  StaffDetailRecord,
  TeacherAttendanceRecord,
  LeaveApplication,
  OnDutyRecord,
  LeaveType,
  AttendanceStatus,
  LeaveBalance,
  DayOfWeek,
  TimetableSlot,
  TeacherTask,
  ProxyDutyAssignment,
  LeaveSettingsConfig
} from '../types/academic';
import { UserAccount } from '../types/auth';
import {
  db,
  DEFAULT_STAFF_DETAILS,
  DEFAULT_TEACHER_ATTENDANCE,
  DEFAULT_LEAVE_APPLICATIONS,
  DEFAULT_ON_DUTY_RECORDS,
  DEFAULT_TIMETABLE,
  DEFAULT_PROXY_DUTIES,
  DEFAULT_LEAVE_SETTINGS,
  getCurrentUser,
  getUserAccounts,
  getMergedStaffList
} from '../lib/storage';
import {
  resolveTeacherAttendance,
  ResolvedTeacherAttendance,
  checkTeacherAbsenceOnDate,
  normalizeFacultyKey,
  cancelOrSupersedeLeaveForStaffDate,
  cancelOrSupersedeOnDutyForStaffDate,
  isDateInRange
} from '../lib/attendanceAbsenceEngine';
import {
  getLeaveBalance,
  canApplyLeave,
  debitLeave,
  calculateLeaveDays,
  LeaveValidationResult
} from '../lib/leaveEngine';
import { getTeacherScopedStorageKey } from '../lib/teacherContext';
import { useActiveWorkingDate, getDayOfWeekFromDate, formatDisplayDate } from '../lib/activeDateContext';
import { AutomaticProxyPlannerModal } from './AutomaticProxyPlannerModal';
import * as XLSX from 'xlsx';
import {
  Calendar as CalIcon,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  Plus,
  X,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  CalendarDays,
  Building2,
  Users,
  Printer,
  Download,
  Settings,
  LayoutDashboard,
  FileSpreadsheet,
  CheckSquare,
  Check,
  Square,
  Percent,
  TrendingUp,
  BookmarkCheck,
  Eye,
  Award
} from 'lucide-react';
import { DevModeBadge } from './DevModeBadge';

interface TeacherAttendanceManagerProps {
  devMode?: boolean;
  currentUser?: UserAccount | null;
  onSaved?: () => void;
}

type SubTab = 'daily' | 'executive' | 'monthly_statement' | 'settings';

const LEAVE_TYPE_LABELS: Record<LeaveType, { name: string; full: string; desc: string }> = {
  CL: { name: 'Casual Leave (CL)', full: 'Casual Leave', desc: '8 days/yr for Regular; max 1/mo for Contractual after 1 month service' },
  EL: { name: 'Earned Leave (EL)', full: 'Earned Leave', desc: 'Credited in advance for non-vacation duties / statutory accrual' },
  HPL: { name: 'Half Pay Leave (HPL)', full: 'Half Pay Leave', desc: '20 days per completed year on medical/private affairs' },
  Comm: { name: 'Commuted Leave (Comm)', full: 'Commuted Leave', desc: 'Medical ground leave with MC, debits 2x from HPL' },
  'EOL-MG': { name: 'Extra Extraordinary Leave (Medical)', full: 'EOL Medical Grounds', desc: 'Leave without pay on certified illness' },
  'EOL-PA': { name: 'Extra Extraordinary Leave (Private)', full: 'EOL Private Affairs', desc: 'Leave without pay for urgent personal affairs' },
  CCL: { name: 'Child Care Leave (CCL)', full: 'Child Care Leave', desc: 'For female staff or single male parent (max 730 days)' },
  ML: { name: 'Maternity / Paternity Leave', full: 'Maternity/Paternity Leave', desc: '180 days ML / 15 days Paternity leave' },
  SpCL: { name: 'Special Casual Leave (SpCL)', full: 'Special Casual Leave', desc: 'For Sports meet, Scout camps, Elections, Family Planning' },
  Absent: { name: 'Unauthorized Absence / Loss of Pay', full: 'Loss of Pay / Absent', desc: 'Unsanctioned leave or contractual breach' },
  OD: { name: 'Official On-Duty (OD)', full: 'Official Deputation', desc: 'CBSE observer, NSM sports, In-service training, RO meeting' }
};

export const TeacherAttendanceManager: React.FC<TeacherAttendanceManagerProps> = ({
  devMode,
  currentUser,
  onSaved
}) => {
  const [activeTab, setActiveTab] = useState<SubTab>('daily');
  const { activeDate } = useActiveWorkingDate();

  // Current selected date for attendance (defaults to Unified Active Working Date)
  const [selectedDate, setSelectedDate] = useState<string>(activeDate);

  useEffect(() => {
    if (activeDate) {
      setSelectedDate(activeDate);
    }
  }, [activeDate]);
  const [staffList, setStaffList] = useState<StaffDetailRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [onDutyRecords, setOnDutyRecords] = useState<OnDutyRecord[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [proxyAssignments, setProxyAssignments] = useState<ProxyDutyAssignment[]>([]);
  const [leaveSettings, setLeaveSettings] = useState<LeaveSettingsConfig>(DEFAULT_LEAVE_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AttendanceStatus>('ALL');
  const [employmentFilter, setEmploymentFilter] = useState<'ALL' | 'Regular' | 'Contractual'>('ALL');
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Monthly Statement State
  const [statementYear, setStatementYear] = useState<number>(2026);
  const [statementMonth, setStatementMonth] = useState<number>(new Date().getMonth()); // 0-indexed

  // Proxy Assignment Modal State
  const [isProxyModalOpen, setIsProxyModalOpen] = useState(false);
  const [activeStaffForProxy, setActiveStaffForProxy] = useState<StaffDetailRecord | null>(null);
  const [selectedSlotForProxy, setSelectedSlotForProxy] = useState<TimetableSlot | null>(null);
  const [selectedSubstituteCode, setSelectedSubstituteCode] = useState<string>('');
  const [proxyNotes, setProxyNotes] = useState<string>('');

  // Leave Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [activeStaffForLeave, setActiveStaffForLeave] = useState<StaffDetailRecord | null>(null);
  const [leaveType, setLeaveType] = useState<LeaveType>('CL');
  const [leaveFromDate, setLeaveFromDate] = useState<string>(selectedDate);
  const [leaveToDate, setLeaveToDate] = useState<string>(selectedDate);
  const [halfDay, setHalfDay] = useState<boolean>(false);
  const [halfDaySession, setHalfDaySession] = useState<'First Half' | 'Second Half'>('Second Half');
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [stationLeaving, setStationLeaving] = useState<boolean>(false);
  const [stationAddress, setStationAddress] = useState<string>('');
  const [principalOverrideAllowed, setPrincipalOverrideAllowed] = useState<boolean>(false);
  const [principalOverrideRemarks, setPrincipalOverrideRemarks] = useState<string>('');
  const [validationResult, setValidationResult] = useState<LeaveValidationResult | null>(null);

  // On-Duty Modal State
  const [isOnDutyModalOpen, setIsOnDutyModalOpen] = useState(false);
  const [activeStaffForOD, setActiveStaffForOD] = useState<StaffDetailRecord | null>(null);
  const [odPurpose, setOdPurpose] = useState<OnDutyRecord['purpose']>('KVS Regional Sports Meet');
  const [odDescription, setOdDescription] = useState<string>('');
  const [odVenue, setOdVenue] = useState<string>('');
  const [odOrderNo, setOdOrderNo] = useState<string>('');
  const [odFromDate, setOdFromDate] = useState<string>(selectedDate);
  const [odToDate, setOdToDate] = useState<string>(selectedDate);

  // Staged Attendance & Save State
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [unsavedStaffCodes, setUnsavedStaffCodes] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Leave Override Confirmation Modal
  const [confirmOverrideModal, setConfirmOverrideModal] = useState<{
    isOpen: boolean;
    staff: StaffDetailRecord;
    targetStatus: AttendanceStatus;
    activeLeaveInfo?: { leaveType?: LeaveType; fromDate?: string; toDate?: string; reason?: string };
    activeODInfo?: { purpose?: string; venue?: string };
  } | null>(null);

  // Permissions & Roles (Admin, Data Entry Manager, and Assigned Teachers)
  const [activeUser, setActiveUser] = useState<UserAccount | null>(currentUser || null);

  useEffect(() => {
    if (currentUser) {
      setActiveUser(currentUser);
    } else {
      getCurrentUser().then(u => setActiveUser(u));
    }
  }, [currentUser]);

  const isPrincipalOrAdmin =
    activeUser?.role === 'admin' ||
    activeUser?.activePersona === 'admin' ||
    Boolean(activeUser?.designation && activeUser.designation.toLowerCase().includes('principal'));
  const isDataEntryManager =
    activeUser?.role === 'data_entry_manager' ||
    activeUser?.activePersona === 'data_entry_manager';
  
  // All staff roles (Admin, Data Manager, and Assigned Teachers) have full access to mark attendance, apply leaves, and record OD
  const canMarkAttendance = true;

  useEffect(() => {
    loadInitialData();
  }, []);

  // Recalculate validation whenever leave form changes
  useEffect(() => {
    if (isLeaveModalOpen && activeStaffForLeave) {
      const res = canApplyLeave(activeStaffForLeave, leaveType, leaveFromDate, halfDay ? leaveFromDate : leaveToDate, leaveApplications, halfDay);
      setValidationResult(res);
    }
  }, [isLeaveModalOpen, activeStaffForLeave, leaveType, leaveFromDate, leaveToDate, leaveApplications, halfDay]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [mergedStaff, storedAttendance, storedLeaves, storedOD, storedTimetable, storedProxy, storedSettings] = await Promise.all([
        getMergedStaffList(),
        db.get<TeacherAttendanceRecord[]>('setup:teacher_attendance'),
        db.get<LeaveApplication[]>('setup:leave_applications'),
        db.get<OnDutyRecord[]>('setup:on_duty_records'),
        db.get<TimetableSlot[]>('setup:timetable'),
        db.get<ProxyDutyAssignment[]>('setup:proxy_duty_assignments'),
        db.get<LeaveSettingsConfig>('setup:leave_settings')
      ]);

      const effectiveStaff = (mergedStaff && mergedStaff.length > 0) ? mergedStaff : DEFAULT_STAFF_DETAILS;
      setStaffList(effectiveStaff);
      setAttendanceRecords(storedAttendance && storedAttendance.length > 0 ? storedAttendance : DEFAULT_TEACHER_ATTENDANCE);
      setLeaveApplications(storedLeaves && storedLeaves.length > 0 ? storedLeaves : DEFAULT_LEAVE_APPLICATIONS);
      setOnDutyRecords(storedOD && storedOD.length > 0 ? storedOD : DEFAULT_ON_DUTY_RECORDS);

      const rawTimetable = (storedTimetable && storedTimetable.length > 0) ? storedTimetable : DEFAULT_TIMETABLE;
      const effectiveTimetable = rawTimetable.map(slot => {
        const clean: any = { ...slot };
        delete clean.isArrangement;
        delete clean.arrangementTeacherName;
        delete clean.arrangementTeacherId;
        delete clean.arrangementReason;
        delete clean.originalTeacherName;
        delete clean.originalTeacherId;
        delete clean.isProxy;
        delete clean.substituteTeacherName;
        delete clean.substituteTeacherCode;
        return clean as TimetableSlot;
      });
      await db.set('setup:timetable', effectiveTimetable);
      setTimetable(effectiveTimetable);
      setProxyAssignments(storedProxy && storedProxy.length > 0 ? storedProxy : DEFAULT_PROXY_DUTIES);
      setLeaveSettings(storedSettings || DEFAULT_LEAVE_SETTINGS);
    } catch (err) {
      console.error('Error loading attendance, leave & proxy data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Quick Attendance Mark with Overwrite Protection & Bidirectional Switching
  const handleMarkAttendance = async (
    staff: StaffDetailRecord,
    status: AttendanceStatus,
    customLeaveType?: LeaveType,
    bypassConfirmation: boolean = false
  ) => {
    // Check if teacher currently has an active leave application on selectedDate
    const codeMatch = (code?: string) =>
      Boolean(code && staff.employeeCode && String(code).trim().toLowerCase() === String(staff.employeeCode).trim().toLowerCase());
    const nameMatch = (name?: string) => {
      if (!staff.name || !name) return false;
      const k1 = normalizeFacultyKey(staff.name);
      const k2 = normalizeFacultyKey(name);
      return Boolean(k1 && k2 && k1 === k2);
    };

    const activeLeave = leaveApplications.find(
      l =>
        (codeMatch(l.employeeCode) || nameMatch(l.teacherName)) &&
        (l.status === 'Sanctioned' || (l.status as string) === 'Approved' || (l.status as string) === 'Pending') &&
        isDateInRange(selectedDate, l.fromDate, l.toDate)
    );

    const activeOD = onDutyRecords.find(
      o =>
        (codeMatch(o.employeeCode) || nameMatch(o.teacherName)) &&
        isDateInRange(selectedDate, o.fromDate, o.toDate)
    );

    // If teacher is currently on sanctioned Leave or OD, and status is changing to Present or Absent
    if (!bypassConfirmation && (activeLeave || activeOD) && (status === 'Present' || status === 'Absent')) {
      setConfirmOverrideModal({
        isOpen: true,
        staff,
        targetStatus: status,
        activeLeaveInfo: activeLeave ? {
          leaveType: activeLeave.leaveType,
          fromDate: activeLeave.fromDate,
          toDate: activeLeave.toDate,
          reason: activeLeave.reason
        } : undefined,
        activeODInfo: activeOD ? {
          purpose: activeOD.purpose,
          venue: activeOD.venue
        } : undefined
      });
      return;
    }

    let updatedLeavesList = leaveApplications;
    let updatedStaffList = staffList;
    let updatedODsList = onDutyRecords;

    // If overriding active leave -> cancel/supersede leave for selectedDate and refund balance
    if (activeLeave) {
      const res = cancelOrSupersedeLeaveForStaffDate(
        staff,
        selectedDate,
        leaveApplications,
        activeUser?.name || 'Principal',
        `Attendance corrected to ${status} by Principal`
      );
      updatedLeavesList = res.updatedLeaves;
      updatedStaffList = staffList.map(s => (s.employeeCode === staff.employeeCode ? res.updatedStaff : s));
      setLeaveApplications(updatedLeavesList);
      setStaffList(updatedStaffList);
    }

    // If overriding active OD -> cancel/trim OD for selectedDate
    if (activeOD) {
      const odRes = cancelOrSupersedeOnDutyForStaffDate(staff, selectedDate, onDutyRecords);
      updatedODsList = odRes.updatedODs;
      setOnDutyRecords(updatedODsList);
    }

    const recId = `att-staff-${staff.employeeCode}-${selectedDate}`;
    const existingIndex = attendanceRecords.findIndex(
      r => r.id === recId || (codeMatch(r.employeeCode) && r.date === selectedDate)
    );

    const newRecord: TeacherAttendanceRecord = {
      id: recId,
      employeeCode: staff.employeeCode,
      teacherName: staff.name,
      designation: staff.designation,
      employmentType: staff.employmentType || 'Regular',
      date: selectedDate,
      status,
      leaveType: customLeaveType,
      inTime: status === 'Present' ? '07:35 AM' : undefined,
      outTime: status === 'Present' ? '02:10 PM' : undefined,
      markedBy: activeUser?.name || 'Principal',
      markedAt: new Date().toISOString(),
      verifiedByPrincipal: true
    };

    let updatedList: TeacherAttendanceRecord[];
    if (existingIndex >= 0) {
      updatedList = [...attendanceRecords];
      updatedList[existingIndex] = newRecord;
    } else {
      updatedList = [...attendanceRecords, newRecord];
    }

    setAttendanceRecords(updatedList);

    // Track staged change
    setUnsavedStaffCodes(prev => new Set(prev).add(staff.employeeCode));
    setHasUnsavedChanges(true);

    // Persist to storage immediately and update event
    await Promise.all([
      db.set('setup:staff_details', updatedStaffList),
      db.set('setup:leave_applications', updatedLeavesList),
      db.set('setup:on_duty_records', updatedODsList),
      db.set('setup:teacher_attendance', updatedList)
    ]);

    window.dispatchEvent(new CustomEvent('kvs-attendance-updated'));
    showFeedback(`Updated ${staff.name} to ${status}${customLeaveType ? ` (${customLeaveType})` : ''} for ${selectedDate}`);
    if (onSaved) onSaved();
  };

  // Save All Attendance for Selected Date
  const handleSaveAllAttendanceForDate = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        db.set('setup:staff_details', staffList),
        db.set('setup:leave_applications', leaveApplications),
        db.set('setup:on_duty_records', onDutyRecords),
        db.set('setup:teacher_attendance', attendanceRecords)
      ]);
      setHasUnsavedChanges(false);
      setUnsavedStaffCodes(new Set());
      window.dispatchEvent(new CustomEvent('kvs-attendance-updated'));
      showFeedback(`Daily Attendance & Leave records successfully committed for ${selectedDate}`);
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      showFeedback('Error saving attendance records', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Discard Staged Changes
  const handleDiscardStagedChanges = async () => {
    if (!window.confirm(`Discard unsaved attendance changes for ${selectedDate}?`)) return;
    await loadInitialData();
    setHasUnsavedChanges(false);
    setUnsavedStaffCodes(new Set());
    showFeedback('Unsaved changes discarded');
  };

  // Open Leave Modal for a specific teacher
  const handleOpenLeaveModal = (staff: StaffDetailRecord) => {
    setActiveStaffForLeave(staff);
    setLeaveFromDate(selectedDate);
    setLeaveToDate(selectedDate);
    setHalfDay(false);
    setHalfDaySession('Second Half');
    setLeaveType('CL');
    setLeaveReason('');
    setStationLeaving(false);
    setStationAddress('');
    setPrincipalOverrideAllowed(false);
    setPrincipalOverrideRemarks('');
    setIsLeaveModalOpen(true);
  };

  // Submit and Sanction Leave
  const handleSaveLeaveApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaffForLeave) return;

    const toDate = halfDay ? leaveFromDate : leaveToDate;
    const days = halfDay ? 0.5 : calculateLeaveDays(leaveFromDate, toDate);
    if (days <= 0) {
      alert('Invalid date range. To Date must be on or after From Date.');
      return;
    }

    // Validation check
    const validation = canApplyLeave(activeStaffForLeave, leaveType, leaveFromDate, toDate, leaveApplications, halfDay);
    if (!validation.canApply && !principalOverrideAllowed) {
      alert(`Cannot apply leave: ${validation.reason}`);
      return;
    }

    const newLeave: LeaveApplication = {
      id: `la-${Date.now()}`,
      employeeCode: activeStaffForLeave.employeeCode,
      teacherName: activeStaffForLeave.name,
      designation: activeStaffForLeave.designation,
      employmentType: activeStaffForLeave.employmentType || 'Regular',
      leaveType,
      fromDate: leaveFromDate,
      toDate,
      totalDays: days,
      halfDay,
      halfDaySession: halfDay ? halfDaySession : undefined,
      reason: leaveReason.trim() || 'Personal Work',
      stationLeavingPermission: stationLeaving,
      stationAddress: stationLeaving ? stationAddress : undefined,
      status: 'Sanctioned',
      appliedAt: new Date().toISOString(),
      sanctionedBy: activeUser?.name || 'Principal',
      sanctionedAt: new Date().toISOString(),
      principalRemarks: principalOverrideAllowed
        ? (principalOverrideRemarks.trim() || 'Sanctioned under Principal Discretionary Override.')
        : undefined
    };

    // Debit leave from ledger if sanctioned
    const { updatedStaff, updatedLeaves } = debitLeave(activeStaffForLeave, newLeave, leaveApplications);

    // Update staff in staff list
    const updatedStaffList = staffList.map(s => (s.employeeCode === updatedStaff.employeeCode ? updatedStaff : s));
    setStaffList(updatedStaffList);
    setLeaveApplications(updatedLeaves);

    // Mark daily attendance for the selected date as Leave
    const attRecId = `att-staff-${activeStaffForLeave.employeeCode}-${selectedDate}`;
    const newAttRecord: TeacherAttendanceRecord = {
      id: attRecId,
      employeeCode: activeStaffForLeave.employeeCode,
      teacherName: activeStaffForLeave.name,
      designation: activeStaffForLeave.designation,
      employmentType: activeStaffForLeave.employmentType || 'Regular',
      date: selectedDate,
      status: 'Leave',
      leaveType,
      leaveApplicationId: newLeave.id,
      halfDay,
      halfDaySession: halfDay ? halfDaySession : undefined,
      remarks: leaveReason || `Sanctioned ${leaveType}${halfDay ? ` (${halfDaySession})` : ''}`,
      markedBy: activeUser?.name || 'Admin',
      markedAt: new Date().toISOString(),
      verifiedByPrincipal: true
    };

    const updatedAttList = [
      ...attendanceRecords.filter(r => r.id !== attRecId && !(r.employeeCode === activeStaffForLeave.employeeCode && r.date === selectedDate)),
      newAttRecord
    ];

    setAttendanceRecords(updatedAttList);

    await Promise.all([
      db.set('setup:staff_details', updatedStaffList),
      db.set('setup:leave_applications', updatedLeaves),
      db.set('setup:teacher_attendance', updatedAttList)
    ]);

    window.dispatchEvent(new CustomEvent('kvs-attendance-updated'));
    setIsLeaveModalOpen(false);
    showFeedback(`Leave (${leaveType} - ${days} day(s)) sanctioned for ${activeStaffForLeave.name}`);
    if (onSaved) onSaved();
  };

  // Open On-Duty (OD) Modal
  const handleOpenOnDutyModal = (staff: StaffDetailRecord) => {
    setActiveStaffForOD(staff);
    setOdFromDate(selectedDate);
    setOdToDate(selectedDate);
    setOdPurpose('KVS Regional Sports Meet');
    setOdDescription('');
    setOdVenue('');
    setOdOrderNo('');
    setIsOnDutyModalOpen(true);
  };

  // Save On-Duty (OD) Record
  const handleSaveOnDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaffForOD) return;

    const days = calculateLeaveDays(odFromDate, odToDate);
    const newOD: OnDutyRecord = {
      id: `od-${Date.now()}`,
      employeeCode: activeStaffForOD.employeeCode,
      teacherName: activeStaffForOD.name,
      designation: activeStaffForOD.designation,
      purpose: odPurpose,
      description: odDescription || `Official Deputation for ${odPurpose}`,
      venue: odVenue || 'KVS Regional Office / Cluster Venue',
      officialOrderNo: odOrderNo || undefined,
      fromDate: odFromDate,
      toDate: odToDate,
      totalDays: days,
      affectedPeriods: [],
      sanctionedByPrincipal: true,
      sanctionedDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const updatedODList = [...onDutyRecords, newOD];
    setOnDutyRecords(updatedODList);

    // Mark daily attendance as OD
    const attRecId = `att-staff-${activeStaffForOD.employeeCode}-${selectedDate}`;
    const newAttRecord: TeacherAttendanceRecord = {
      id: attRecId,
      employeeCode: activeStaffForOD.employeeCode,
      teacherName: activeStaffForOD.name,
      designation: activeStaffForOD.designation,
      employmentType: activeStaffForOD.employmentType || 'Regular',
      date: selectedDate,
      status: 'OD',
      leaveType: 'OD',
      onDutyRecordId: newOD.id,
      remarks: `On-Duty: ${odPurpose} at ${odVenue || 'Deputed Venue'}`,
      markedBy: activeUser?.name || 'Admin',
      markedAt: new Date().toISOString(),
      verifiedByPrincipal: true
    };

    const updatedAttList = [
      ...attendanceRecords.filter(r => r.id !== attRecId && !(r.employeeCode === activeStaffForOD.employeeCode && r.date === selectedDate)),
      newAttRecord
    ];

    setAttendanceRecords(updatedAttList);

    await Promise.all([
      db.set('setup:on_duty_records', updatedODList),
      db.set('setup:teacher_attendance', updatedAttList)
    ]);

    window.dispatchEvent(new CustomEvent('kvs-attendance-updated'));
    setIsOnDutyModalOpen(false);
    showFeedback(`On-Duty deputation recorded for ${activeStaffForOD.name}`);
    if (onSaved) onSaved();
  };

  // Mark All Present Shortcut (1-Tap for Quick Morning Registration)
  const handleMarkAllPresent = async () => {
    if (!window.confirm(`Mark all ${staffList.length} faculty as 'Present' for ${selectedDate}?`)) return;

    const updatedList = [...attendanceRecords];

    for (const staff of staffList) {
      const recId = `att-staff-${staff.employeeCode}-${selectedDate}`;
      const newRecord: TeacherAttendanceRecord = {
        id: recId,
        employeeCode: staff.employeeCode,
        teacherName: staff.name,
        designation: staff.designation,
        employmentType: staff.employmentType || 'Regular',
        date: selectedDate,
        status: 'Present',
        inTime: '07:30 AM',
        outTime: '02:10 PM',
        markedBy: activeUser?.name || 'Admin',
        markedAt: new Date().toISOString(),
        verifiedByPrincipal: true
      };
      const idx = updatedList.findIndex(r => r.id === recId || (r.employeeCode === staff.employeeCode && r.date === selectedDate));
      if (idx >= 0) {
        updatedList[idx] = newRecord;
      } else {
        updatedList.push(newRecord);
      }
    }

    setAttendanceRecords(updatedList);
    await db.set('setup:teacher_attendance', updatedList);
    window.dispatchEvent(new CustomEvent('kvs-attendance-updated'));
    showFeedback(`All ${staffList.length} faculty successfully marked Present for ${selectedDate}`);
    if (onSaved) onSaved();
  };

  // Get Day of Week for selectedDate
  const currentDayOfWeek = useMemo((): DayOfWeek => {
    const days: (DayOfWeek | 'Sunday')[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(selectedDate);
    const day = days[d.getDay()];
    return day === 'Sunday' ? 'Monday' : day;
  }, [selectedDate]);

  // Extract scheduled periods for a specific teacher on the selected date
  const getStaffDayPeriods = (staff: StaffDetailRecord): TimetableSlot[] => {
    const absence = checkTeacherAbsenceOnDate(
      staff.employeeCode,
      selectedDate,
      attendanceRecords,
      leaveApplications,
      onDutyRecords,
      staff.name
    );

    const teacherNameLower = staff.name.trim().toLowerCase();
    const daySlots = timetable.filter(s => (s.dayOfWeek || s.day) === currentDayOfWeek);

    const matchingSlots = daySlots.filter(slot => {
      const pNum = Number(slot.period || slot.periodNumber || 1);
      if (absence.isAbsent && absence.halfDay && absence.halfDaySession) {
        if (absence.halfDaySession === 'First Half' && pNum > 4) {
          return false;
        }
        if (absence.halfDaySession === 'Second Half' && pNum <= 4) {
          return false;
        }
      }
      const slotTeacher = (slot.teacherName || '').toLowerCase();
      return slotTeacher && (slotTeacher.includes(teacherNameLower) || teacherNameLower.includes(slotTeacher));
    });

    // Sort by period number
    return matchingSlots.sort((a, b) => (a.period || a.periodNumber || 1) - (b.period || b.periodNumber || 1));
  };

  // Find all teachers who are FREE during a specific period on the selected date
  const getAvailableFreeTeachers = (periodNum: number, currentAbsentStaffCode: string): StaffDetailRecord[] => {
    const daySlots = timetable.filter(s => (s.dayOfWeek || s.day) === currentDayOfWeek && (s.period || s.periodNumber || 1) === periodNum);

    return staffList.filter(staff => {
      // Exclude absent teacher
      if (staff.employeeCode === currentAbsentStaffCode) return false;

      // Check absence for this specific period
      const absence = checkTeacherAbsenceOnDate(
        staff.employeeCode,
        selectedDate,
        attendanceRecords,
        leaveApplications,
        onDutyRecords,
        staff.name,
        periodNum
      );
      if (absence.isAbsent) return false;

      // Check if they already have a regular class or existing proxy in this period
      const teacherNameLower = staff.name.trim().toLowerCase();
      const hasClass = daySlots.some(s => {
        const tName = (s.teacherName || '').toLowerCase();
        return tName && (tName.includes(teacherNameLower) || teacherNameLower.includes(tName));
      });
      if (hasClass) return false;

      const isProxyOnDate = proxyAssignments.some(
        p => p.date === selectedDate && p.periodNumber === periodNum && (
          (p.substituteTeacherCode && p.substituteTeacherCode === staff.employeeCode) ||
          (p.substituteTeacherName && p.substituteTeacherName.toLowerCase().includes(teacherNameLower))
        )
      );

      return !isProxyOnDate;
    });
  };

  // Open Proxy Modal for an absent teacher & specific period slot
  const handleOpenProxyModal = (staff: StaffDetailRecord, slot?: TimetableSlot) => {
    setActiveStaffForProxy(staff);
    const periods = getStaffDayPeriods(staff);
    const targetSlot = slot || periods[0] || null;
    setSelectedSlotForProxy(targetSlot);
    setSelectedSubstituteCode('');
    setProxyNotes('');
    setIsProxyModalOpen(true);
  };

  // Assign Proxy Duty Action
  const handleAssignProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaffForProxy || !selectedSlotForProxy || !selectedSubstituteCode) {
      alert('Please select a period and available substitute teacher.');
      return;
    }

    const subStaff = staffList.find(s => s.employeeCode === selectedSubstituteCode);
    if (!subStaff) return;

    const pNum = selectedSlotForProxy.period || selectedSlotForProxy.periodNumber || 1;
    const proxyId = `proxy-${selectedDate}-p${pNum}-${selectedSlotForProxy.className}-${activeStaffForProxy.employeeCode}`;
    const classSecStr = `${selectedSlotForProxy.className}${selectedSlotForProxy.section ? `-${selectedSlotForProxy.section}` : ''}`;

    // 1. Create ProxyDutyAssignment Record
    const newProxyRecord: ProxyDutyAssignment = {
      id: proxyId,
      date: selectedDate,
      dayOfWeek: currentDayOfWeek,
      periodNumber: pNum,
      timeSlot: selectedSlotForProxy.timeSlot || `Period ${pNum}`,
      className: selectedSlotForProxy.className,
      section: selectedSlotForProxy.section || 'A',
      subjectName: selectedSlotForProxy.subjectName,
      roomNo: selectedSlotForProxy.roomNo,
      absentTeacherCode: activeStaffForProxy.employeeCode,
      absentTeacherName: activeStaffForProxy.name,
      absenceReason: dayAttendanceMap.get(activeStaffForProxy.employeeCode)?.leaveType || 'Leave',
      substituteTeacherCode: subStaff.employeeCode,
      substituteTeacherName: subStaff.name,
      substituteDesignation: subStaff.designation,
      isFreePeriod: true,
      assignedBy: currentUser?.name || 'Principal / Incharge',
      assignedAt: new Date().toISOString(),
      status: 'Assigned',
      syncedToTaskSystem: true,
      notes: proxyNotes.trim() || undefined
    };

    // 2. Update TimetableSlot (isArrangement = true, arrangementTeacherName)
    const updatedTimetable = timetable.map(slot => {
      const slotTeacher = (slot.teacherName || '').toLowerCase();
      const absentTeacherLower = activeStaffForProxy.name.toLowerCase();
      const isMatch =
        (slot.dayOfWeek || slot.day) === currentDayOfWeek &&
        (slot.period || slot.periodNumber || 1) === pNum &&
        slotTeacher.includes(absentTeacherLower);

      if (isMatch) {
        return {
          ...slot,
          isArrangement: true,
          originalTeacherName: activeStaffForProxy.name,
          arrangementTeacherName: subStaff.name,
          arrangementReason: `Proxy for ${activeStaffForProxy.name} (${dayAttendanceMap.get(activeStaffForProxy.employeeCode)?.leaveType || 'Leave'})`
        };
      }
      return slot;
    });

    // 3. Create High-Priority Task in TaskManager for Substitute Teacher
    const existingTasks = (await db.get<TeacherTask[]>('setup:tasks')) || [];
    const proxyTaskId = `proxy-duty-${selectedSlotForProxy.id || `proxy-p${pNum}-${selectedSlotForProxy.className}`}-${selectedDate}`;

    const newProxyTask: TeacherTask = {
      id: proxyTaskId,
      title: `Proxy Duty – Class ${classSecStr} (Period ${pNum}) for ${activeStaffForProxy.name}`,
      description: `Substitution arrangement assigned for absent teacher ${activeStaffForProxy.name}. Subject: ${selectedSlotForProxy.subjectName}. Reason: ${dayAttendanceMap.get(activeStaffForProxy.employeeCode)?.leaveType || 'Staff on Leave'}. ${proxyNotes ? `Notes: ${proxyNotes}` : ''}`,
      category: 'Arrangement / Proxy Duty',
      priority: 'Do First (Urgent & Important)',
      status: 'Pending',
      dueDate: selectedDate,
      dueTime: selectedSlotForProxy.timeSlot?.split('-')[0]?.trim() || '08:00',
      listId: 'inbox',
      estimatedMinutes: 40,
      subtasks: [
        { id: `st-pr-1-${proxyTaskId}`, title: 'Report to assigned classroom & maintain discipline', completed: false },
        { id: `st-pr-2-${proxyTaskId}`, title: 'Engage students in revision / reading activity', completed: false },
        { id: `st-pr-3-${proxyTaskId}`, title: 'Sign substitution register in Principal office', completed: false }
      ],
      tags: ['Proxy Duty', 'Arrangement', `Class ${selectedSlotForProxy.className}`, 'Priority Duty'],
      assignedBy: currentUser?.name || 'Principal / Academic Incharge',
      assignedByRole: 'Principal',
      isTopPriority: true,
      overloadImpact: true,
      linkedClass: selectedSlotForProxy.className ? `Class ${selectedSlotForProxy.className}` : undefined,
      linkedSubject: selectedSlotForProxy.subjectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedTasks = [
      ...existingTasks.filter(t => t.id !== proxyTaskId),
      newProxyTask
    ];

    const scopedSubTaskKey = getTeacherScopedStorageKey('setup:tasks', subStaff.employeeCode);
    const existingSubTasks = (await db.get<TeacherTask[]>(scopedSubTaskKey)) || [];
    const updatedSubTasks = [
      ...existingSubTasks.filter(t => t.id !== proxyTaskId),
      newProxyTask
    ];

    // Update state & persistence
    const updatedProxyList = [
      ...proxyAssignments.filter(p => p.id !== proxyId),
      newProxyRecord
    ];

    setProxyAssignments(updatedProxyList);

    await Promise.all([
      db.set('setup:proxy_duty_assignments', updatedProxyList),
      db.set('setup:tasks', updatedTasks),
      db.set(scopedSubTaskKey, updatedSubTasks)
    ]);

    window.dispatchEvent(new CustomEvent('kvs-timetable-updated'));
    showFeedback(`Assigned ${subStaff.name} as proxy for Class ${selectedSlotForProxy.className} (Period ${pNum})`);
    setSelectedSlotForProxy(null);
    setSelectedSubstituteCode('');
    setProxyNotes('');
    if (onSaved) onSaved();
  };

  // Cancel Proxy Assignment
  const handleCancelProxy = async (proxyId: string) => {
    const proxyToCancel = proxyAssignments.find(p => p.id === proxyId);
    if (!proxyToCancel) return;

    const updatedProxyList = proxyAssignments.filter(p => p.id !== proxyId);

    // Remove task from TaskManager
    const existingTasks = (await db.get<TeacherTask[]>('setup:tasks')) || [];
    const updatedTasks = existingTasks.filter(t => !t.id.includes(proxyToCancel.periodNumber.toString()) || !t.title.includes(proxyToCancel.className));

    const promises: Promise<any>[] = [
      db.set('setup:proxy_duty_assignments', updatedProxyList),
      db.set('setup:tasks', updatedTasks)
    ];

    if (proxyToCancel.substituteTeacherCode) {
      const scopedSubTaskKey = getTeacherScopedStorageKey('setup:tasks', proxyToCancel.substituteTeacherCode);
      const existingSubTasks = (await db.get<TeacherTask[]>(scopedSubTaskKey)) || [];
      const updatedSubTasks = existingSubTasks.filter(t => !t.id.includes(proxyToCancel.periodNumber.toString()) || !t.title.includes(proxyToCancel.className));
      promises.push(db.set(scopedSubTaskKey, updatedSubTasks));
    }

    setProxyAssignments(updatedProxyList);

    await Promise.all(promises);

    window.dispatchEvent(new CustomEvent('kvs-timetable-updated'));
    showFeedback(`Cancelled proxy duty for Period ${proxyToCancel.periodNumber} (${proxyToCancel.className})`, 'info');
    if (onSaved) onSaved();
  };

  // Resolved Daily Attendance (Unmarked faculty automatically resolve as Present)
  const resolvedAttendanceList = useMemo(() => {
    return resolveTeacherAttendance(
      staffList,
      selectedDate,
      attendanceRecords,
      leaveApplications,
      onDutyRecords
    );
  }, [staffList, selectedDate, attendanceRecords, leaveApplications, onDutyRecords]);

  // Current Date Attendance Lookup Map
  const dayAttendanceMap = useMemo(() => {
    const map = new Map<string, ResolvedTeacherAttendance>();
    for (const item of resolvedAttendanceList) {
      map.set(item.staff.employeeCode, item);
    }
    return map;
  }, [resolvedAttendanceList]);

  // Filtered Staff List
  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        staff.name.toLowerCase().includes(q) ||
        staff.employeeCode.toLowerCase().includes(q) ||
        staff.designation.toLowerCase().includes(q);

      // Employment Type
      const empType = staff.employmentType || 'Regular';
      const matchEmp = employmentFilter === 'ALL' || empType === employmentFilter;

      // Status
      const resolved = dayAttendanceMap.get(staff.employeeCode);
      const curStatus = resolved?.status || 'Present';
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Present' && curStatus === 'Present') ||
        (statusFilter === 'Leave' && curStatus === 'Leave') ||
        (statusFilter === 'OD' && curStatus === 'OD') ||
        (statusFilter === 'Absent' && curStatus === 'Absent');

      return matchSearch && matchEmp && matchStatus;
    });
  }, [staffList, searchQuery, employmentFilter, statusFilter, dayAttendanceMap]);

  // Live Summary Metrics for Selected Date
  const metrics = useMemo(() => {
    let present = 0;
    let autoPresent = 0;
    let leave = 0;
    let od = 0;
    let absent = 0;

    for (const item of resolvedAttendanceList) {
      if (item.status === 'Present') {
        present++;
        if (item.isAutoPresent) autoPresent++;
      } else if (item.status === 'Leave') {
        leave++;
      } else if (item.status === 'OD') {
        od++;
      } else if (item.status === 'Absent') {
        absent++;
      }
    }

    // Count pending proxy substitutions today for absent faculty
    const absentStaffToday = resolvedAttendanceList.filter(
      r => r.status === 'Leave' || r.status === 'Absent' || r.status === 'OD'
    );

    let totalPeriodsNeedingProxy = 0;
    let assignedProxiesToday = 0;

    for (const item of absentStaffToday) {
      const daySlots = getStaffDayPeriods(item.staff);
      totalPeriodsNeedingProxy += daySlots.length;
      const staffProxies = proxyAssignments.filter(
        p => p.date === selectedDate && p.absentTeacherCode === item.staff.employeeCode
      );
      assignedProxiesToday += staffProxies.length;
    }

    const pendingProxies = Math.max(0, totalPeriodsNeedingProxy - assignedProxiesToday);

    return {
      total: staffList.length,
      present,
      autoPresent,
      leave,
      od,
      absent,
      attendanceRate: staffList.length > 0 ? Math.round(((present + od) / staffList.length) * 100) : 0,
      totalPeriodsNeedingProxy,
      assignedProxiesToday,
      pendingProxies,
      absentStaffToday
    };
  }, [staffList, resolvedAttendanceList, proxyAssignments, selectedDate, timetable, currentDayOfWeek]);

  // Current Live Balance for Staff in Leave Modal
  const activeStaffBalance: LeaveBalance | null = useMemo(() => {
    if (!activeStaffForLeave) return null;
    return getLeaveBalance(activeStaffForLeave, leaveApplications, selectedDate);
  }, [activeStaffForLeave, leaveApplications, selectedDate]);

  const requestedLeaveDays = useMemo(() => {
    if (halfDay) return 0.5;
    return calculateLeaveDays(leaveFromDate, leaveToDate);
  }, [leaveFromDate, leaveToDate, halfDay]);

  // Monthly Leave Statement Calculations
  const monthlyStatementData = useMemo(() => {
    const monthStr = `${statementYear}-${String(statementMonth + 1).padStart(2, '0')}`;

    // Filter leaves in this month
    const monthLeaves = leaveApplications.filter(l => {
      if (l.status === 'Rejected' || l.status === 'Cancelled') return false;
      return l.fromDate.startsWith(monthStr) || l.toDate.startsWith(monthStr);
    });

    let schoolTotalCl = 0;
    let schoolTotalEl = 0;
    let schoolTotalHpl = 0;
    let schoolTotalComm = 0;
    let schoolTotalEol = 0;
    let schoolTotalOd = 0;
    let schoolTotalAbsentLop = 0;
    let schoolTotalAllDays = 0;

    const rows = staffList.map((staff, idx) => {
      const staffMonthLeaves = monthLeaves.filter(l => l.employeeCode === staff.employeeCode);
      const balance = getLeaveBalance(staff, leaveApplications, `${statementYear}-${String(statementMonth + 1).padStart(2, '0')}-28`);

      let cl = 0;
      let el = 0;
      let hpl = 0;
      let comm = 0;
      let eol = 0;
      let od = 0;
      let absentLop = 0;

      for (const l of staffMonthLeaves) {
        const days = l.totalDays || calculateLeaveDays(l.fromDate, l.toDate);
        if (l.leaveType === 'CL') cl += days;
        else if (l.leaveType === 'EL') el += days;
        else if (l.leaveType === 'HPL') hpl += days;
        else if (l.leaveType === 'Comm') comm += days;
        else if (l.leaveType === 'EOL-MG' || l.leaveType === 'EOL-PA') eol += days;
        else if (l.leaveType === 'OD') od += days;
        else if (l.leaveType === 'Absent') absentLop += days;
      }

      // Also check raw attendance records for unexcused Absent marks
      const staffAttRecords = attendanceRecords.filter(
        a => a.employeeCode === staff.employeeCode && a.date.startsWith(monthStr) && a.status === 'Absent'
      );
      if (staffAttRecords.length > absentLop) {
        absentLop = staffAttRecords.length;
      }

      const totalDays = cl + el + hpl + comm + eol + od + absentLop;

      schoolTotalCl += cl;
      schoolTotalEl += el;
      schoolTotalHpl += hpl;
      schoolTotalComm += comm;
      schoolTotalEol += eol;
      schoolTotalOd += od;
      schoolTotalAbsentLop += absentLop;
      schoolTotalAllDays += totalDays;

      return {
        sn: idx + 1,
        employeeCode: staff.employeeCode,
        name: staff.name,
        designation: staff.designation,
        employmentType: staff.employmentType || 'Regular',
        cl,
        el,
        hpl,
        comm,
        eol,
        od,
        absentLop,
        totalDays,
        clRemaining: balance.clRemaining,
        elRemaining: balance.elRemaining,
        hplRemaining: balance.hplRemaining,
        remarks: absentLop > 0 ? `${absentLop} day(s) Loss of Pay` : (totalDays === 0 ? 'NIL' : 'Sanctioned')
      };
    });

    return {
      rows,
      schoolTotals: {
        cl: schoolTotalCl,
        el: schoolTotalEl,
        hpl: schoolTotalHpl,
        comm: schoolTotalComm,
        eol: schoolTotalEol,
        od: schoolTotalOd,
        absentLop: schoolTotalAbsentLop,
        allDays: schoolTotalAllDays
      }
    };
  }, [staffList, leaveApplications, attendanceRecords, statementYear, statementMonth]);

  // Export Monthly Statement to Excel
  const handleExportMonthlyStatement = () => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const curMonthName = monthNames[statementMonth];

    const wb = XLSX.utils.book_new();
    const data: any[][] = [];

    data.push([`MONTHLY LEAVE STATEMENT & LOSS OF PAY REPORT - ${curMonthName.toUpperCase()} ${statementYear}`]);
    data.push(['School: KENDRIYA VIDYALAYA KUTRA, SUNDARGARH, ODISHA', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    data.push(['']);

    // Header Row
    data.push([
      'S.No',
      'Employee Code',
      'Teacher Name',
      'Designation',
      'Employment Type',
      'CL Taken',
      'EL Taken',
      'HPL Taken',
      'Commuted Taken',
      'EOL / LOP Taken',
      'OD Taken',
      'Total Days',
      'CL Balance',
      'EL Balance',
      'HPL Balance',
      'Remarks / Loss of Pay'
    ]);

    // Data Rows
    for (const r of monthlyStatementData.rows) {
      data.push([
        r.sn,
        r.employeeCode,
        r.name,
        r.designation,
        r.employmentType,
        r.cl,
        r.el,
        r.hpl,
        r.comm,
        r.eol,
        r.od,
        r.totalDays,
        r.clRemaining,
        r.elRemaining,
        r.hplRemaining,
        r.remarks
      ]);
    }

    // Whole-School Accounts Summary Row
    data.push([
      'TOTAL',
      '',
      'WHOLE-SCHOOL TOTALS',
      '',
      '',
      monthlyStatementData.schoolTotals.cl,
      monthlyStatementData.schoolTotals.el,
      monthlyStatementData.schoolTotals.hpl,
      monthlyStatementData.schoolTotals.comm,
      monthlyStatementData.schoolTotals.eol,
      monthlyStatementData.schoolTotals.od,
      monthlyStatementData.schoolTotals.allDays,
      '',
      '',
      '',
      `TOTAL LOSS OF PAY: ${monthlyStatementData.schoolTotals.absentLop} DAYS`
    ]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, `Leave ${curMonthName} ${statementYear}`);
    XLSX.writeFile(wb, `Monthly_Leave_Statement_${curMonthName}_${statementYear}.xlsx`);
    showFeedback('Exported Monthly Leave Statement (.xlsx) successfully!');
  };

  // Save Settings
  const handleSaveLeaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.set('setup:leave_settings', leaveSettings);
    await db.set('setup:staff_details', staffList);
    showFeedback('Leave & Vacation settings updated successfully!');
    if (onSaved) onSaved();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-purple-300 flex flex-col items-center justify-center gap-3">
        <RotateCcw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="text-sm font-medium">Loading Teacher Attendance & Leave System...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 p-5 rounded-2xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-600/30 border border-purple-500/50 text-purple-300">
              <UserCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 m-0">
              <span>Teacher Attendance & Leave Management</span>
              {devMode && <DevModeBadge pages={[1, 52]} title="Staff Daily Attendance & Leave System" />}
            </h2>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'daily' && (
            <>
              <button
                onClick={handleMarkAllPresent}
                disabled={!canMarkAttendance}
                className="px-3.5 py-1.5 rounded-xl bg-purple-700/60 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-purple-500/40 cursor-pointer shadow-xs"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Mark All Present</span>
              </button>

              <button
                onClick={handleSaveAllAttendanceForDate}
                disabled={isSaving}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  hasUnsavedChanges
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30 font-black ring-2 ring-emerald-400 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : `Save Attendance (${selectedDate})`}</span>
              </button>
            </>
          )}

          {activeTab === 'monthly_statement' && (
            <>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Statement</span>
              </button>

              <button
                onClick={handleExportMonthlyStatement}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export (.xlsx)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold animate-fadeIn ${
            msg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : msg.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-300'
              : 'bg-blue-950/90 border-blue-500/50 text-blue-300'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'daily'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Daily Roll-Call & Proxies</span>
        </button>

        <button
          onClick={() => setActiveTab('executive')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'executive'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Principal Executive Dashboard</span>
          {metrics.pendingProxies > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono">
              {metrics.pendingProxies}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('monthly_statement')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'monthly_statement'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Monthly Leave Statement (Accounts)</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Leave & Vacation Settings</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DAILY ROLL-CALL & PROXIES */}
      {/* ========================================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Date Navigator Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevDay}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800">
                <CalIcon className="w-4 h-4 text-purple-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer font-mono"
                />
              </div>

              <button
                onClick={handleNextDay}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleSetToday}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/30 cursor-pointer"
              >
                Today
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={employmentFilter}
                onChange={e => setEmploymentFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none"
              >
                <option value="ALL">All Employment</option>
                <option value="Regular">Regular Staff</option>
                <option value="Contractual">Contractual Staff</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Leave">On Leave</option>
                <option value="OD">On-Duty (OD)</option>
                <option value="Absent">Absent / LOP</option>
              </select>
            </div>
          </div>

          {/* KPI Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Total Faculty</span>
                <Users className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-black text-white font-mono">{metrics.total}</div>
              <div className="text-[10px] text-slate-500">Regular & Contractual</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1 shadow-sm">
              <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center justify-between">
                <span>Present</span>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-emerald-400 font-mono">{metrics.present}</div>
              <div className="text-[10px] text-emerald-300/70">
                {metrics.autoPresent > 0 ? `${metrics.autoPresent} Auto-Present` : 'All on Campus'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1 shadow-sm">
              <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                <span>On Leave</span>
                <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-black text-amber-400 font-mono">{metrics.leave}</div>
              <div className="text-[10px] text-amber-300/70">Sanctioned Leave</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-1 shadow-sm">
              <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider flex items-center justify-between">
                <span>Official OD</span>
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-black text-blue-400 font-mono">{metrics.od}</div>
              <div className="text-[10px] text-blue-300/70">Deputations / Sports</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-1 shadow-sm">
              <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider flex items-center justify-between">
                <span>Absent / LOP</span>
                <UserX className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-xl font-black text-rose-400 font-mono">{metrics.absent}</div>
              <div className="text-[10px] text-rose-300/70">Loss of Pay / Unpaid</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-1 shadow-sm">
              <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center justify-between">
                <span>Proxies Pending</span>
                <Clock className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-black text-purple-300 font-mono">{metrics.pendingProxies}</div>
              <div className="text-[10px] text-purple-300/70">
                {metrics.assignedProxiesToday} / {metrics.totalPeriodsNeedingProxy} Assigned
              </div>
            </div>
          </div>

          {/* Absence Delegation Alert Banner (Shown when teachers are on Leave/OD/Absent) */}
          {metrics.absentStaffToday && metrics.absentStaffToday.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border border-amber-500/40 shadow-lg space-y-2.5 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 m-0">
                    <span>Faculty Absence & Delegation Notice</span>
                    <span className="px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black font-mono">
                      {metrics.absentStaffToday.length} Staff on Leave/OD
                    </span>
                  </h4>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (metrics.absentStaffToday[0]) {
                        handleOpenProxyModal(metrics.absentStaffToday[0].staff);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Assign {metrics.pendingProxies} Proxies</span>
                  </button>
                </div>
              </div>

              {/* Absent Staff Summary Chips */}
              <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-amber-500/20">
                {metrics.absentStaffToday.map(r => {
                  const periods = getStaffDayPeriods(r.staff);
                  return (
                    <span
                      key={r.staff.employeeCode}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs text-white"
                    >
                      <span className="font-bold">{r.staff.name}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                          r.status === 'Leave'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : r.status === 'OD'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {r.leaveType || r.status}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {periods.length} Class Period(s)
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Teacher Roster List & Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map(staff => {
              const att = dayAttendanceMap.get(staff.employeeCode);
              const curStatus = att?.status || 'Present';
              const isAutoPresent = att?.isAutoPresent ?? true;
              const isContractual = staff.employmentType === 'Contractual';
              const balance = getLeaveBalance(staff, leaveApplications, selectedDate);
              const dayPeriods = getStaffDayPeriods(staff);
              const isAbsentOrLeave = curStatus === 'Leave' || curStatus === 'Absent' || curStatus === 'OD';
              const staffProxies = proxyAssignments.filter(p => p.date === selectedDate && p.absentTeacherCode === staff.employeeCode);
              const needProxyCount = Math.max(0, dayPeriods.length - staffProxies.length);

              return (
                <div
                  key={staff.employeeCode}
                  className={`p-4 rounded-2xl border transition-all space-y-3 bg-slate-900 ${
                    curStatus === 'Present'
                      ? isAutoPresent
                        ? 'border-emerald-500/30 hover:border-emerald-500/60'
                        : 'border-emerald-500/50 bg-emerald-950/10'
                      : curStatus === 'Leave'
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : curStatus === 'OD'
                      ? 'border-blue-500/40 bg-blue-950/10'
                      : curStatus === 'Absent'
                      ? 'border-rose-500/40 bg-rose-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header: Teacher Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-xs">{staff.name}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            isContractual
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          }`}
                        >
                          {staff.employmentType || 'Regular'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {staff.designation} &bull; <span className="font-mono">{staff.employeeCode}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        curStatus === 'Present'
                          ? isAutoPresent
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-xs'
                            : 'bg-emerald-600 text-white border-emerald-500'
                          : curStatus === 'Leave'
                          ? 'bg-amber-950 text-amber-300 border-amber-500'
                          : curStatus === 'OD'
                          ? 'bg-blue-950 text-blue-300 border-blue-500'
                          : curStatus === 'Absent'
                          ? 'bg-rose-950 text-rose-300 border-rose-500'
                          : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}
                    >
                      {curStatus === 'Present' && isAutoPresent
                        ? 'Auto-Present'
                        : `${curStatus}${att?.leaveType && curStatus === 'Leave' ? ` (${att.leaveType})` : ''}`}
                    </span>
                  </div>

                  {/* Leave Balances Strip */}
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[10px] font-mono">
                    {isContractual ? (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-slate-400 font-sans">Monthly CL:</span>
                        <span className="font-bold text-amber-300">
                          {balance.clRemaining} day(s) balance
                        </span>
                        <span className="text-slate-500 text-[9px]">
                          ({balance.clAvailed} availed)
                        </span>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="text-slate-400">CL: </span>
                          <strong className={balance.clRemaining < 2 ? 'text-rose-400' : 'text-purple-300'}>
                            {balance.clRemaining}/{balance.clTotal}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400">EL: </span>
                          <strong className="text-blue-300">{balance.elRemaining}/{balance.elTotal}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">HPL: </span>
                          <strong className="text-indigo-300">{balance.hplRemaining}/{balance.hplTotal}</strong>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Proxy Status Indicator (If teacher is Absent/Leave/OD) */}
                  {isAbsentOrLeave && dayPeriods.length > 0 && (
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-bold">Today's Periods:</span>
                        <span className="font-mono font-bold text-white">{dayPeriods.length} Class(es)</span>
                      </div>

                      <div className="flex items-center justify-between">
                        {needProxyCount > 0 ? (
                          <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>{needProxyCount} Substitution(s) Needed</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>All Proxies Assigned</span>
                          </span>
                        )}

                        <button
                          onClick={() => handleOpenProxyModal(staff)}
                          className="px-2 py-0.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-[10px] font-bold cursor-pointer transition-all"
                        >
                          Manage Proxies
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Action Pill Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      onClick={() => handleMarkAttendance(staff, 'Present')}
                      disabled={!canMarkAttendance}
                      className={`py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        curStatus === 'Present'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-950 hover:bg-emerald-950/40 text-emerald-400 border border-slate-800'
                      }`}
                    >
                      Present
                    </button>

                    <button
                      onClick={() => handleOpenLeaveModal(staff)}
                      disabled={!canMarkAttendance}
                      className={`py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        curStatus === 'Leave'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                          : 'bg-slate-950 hover:bg-amber-950/40 text-amber-400 border border-slate-800'
                      }`}
                    >
                      Leave
                    </button>

                    <button
                      onClick={() => handleOpenOnDutyModal(staff)}
                      disabled={!canMarkAttendance}
                      className={`py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        curStatus === 'OD'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-slate-950 hover:bg-blue-950/40 text-blue-400 border border-slate-800'
                      }`}
                    >
                      On-Duty
                    </button>

                    <button
                      onClick={() => handleMarkAttendance(staff, 'Absent', 'Absent')}
                      disabled={!canMarkAttendance}
                      className={`py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        curStatus === 'Absent'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                          : 'bg-slate-950 hover:bg-rose-950/40 text-rose-400 border border-slate-800'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PRINCIPAL EXECUTIVE DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'executive' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Faculty Presence Rate</span>
                <Percent className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                {metrics.attendanceRate}%
              </div>
              <div className="text-xs text-slate-400">
                {metrics.present + metrics.od} of {metrics.total} faculty on campus today
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Pending Substitutions</span>
                <Clock className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-black text-rose-400 font-mono">
                {metrics.pendingProxies}
              </div>
              <div className="text-xs text-slate-400">
                {metrics.totalPeriodsNeedingProxy > 0
                  ? `${metrics.assignedProxiesToday} of ${metrics.totalPeriodsNeedingProxy} periods covered`
                  : 'No substitutions required today'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Staff on Sanctioned Leave</span>
                <CalendarDays className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-amber-400 font-mono">
                {metrics.leave}
              </div>
              <div className="text-xs text-slate-400">
                {metrics.od} staff on official deputation / OD
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
                <span>Loss of Pay / Absent</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-black text-rose-400 font-mono">
                {metrics.absent}
              </div>
              <div className="text-xs text-slate-400">
                Unexcused or contractual breach
              </div>
            </div>
          </div>

          {/* Pending Proxy Substitutions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-2">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white m-0">
                  Today's Proxy Substitutions Register &bull; {selectedDate} ({currentDayOfWeek})
                </h3>
              </div>
              <span className="text-xs text-purple-300 font-bold">
                {proxyAssignments.filter(p => p.date === selectedDate).length} Assigned
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold">
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-3">Class & Section</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Absent Teacher</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Assigned Proxy</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {proxyAssignments.filter(p => p.date === selectedDate).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                        No proxy substitutions assigned for today yet.
                      </td>
                    </tr>
                  ) : (
                    proxyAssignments
                      .filter(p => p.date === selectedDate)
                      .map(p => (
                        <tr key={p.id} className="hover:bg-slate-800/40 text-slate-300">
                          <td className="py-2.5 px-3 font-bold text-purple-300">Period {p.periodNumber}</td>
                          <td className="py-2.5 px-3 font-bold text-white">Class {p.className}-{p.section}</td>
                          <td className="py-2.5 px-3 text-slate-300 font-sans">{p.subjectName}</td>
                          <td className="py-2.5 px-3 text-rose-300 font-sans font-medium">{p.absentTeacherName}</td>
                          <td className="py-2.5 px-3 text-slate-400 font-sans">{p.absenceReason}</td>
                          <td className="py-2.5 px-3 text-emerald-300 font-sans font-bold">
                            ✅ {p.substituteTeacherName} ({p.substituteDesignation})
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-sans">
                            <button
                              onClick={() => handleCancelProxy(p.id)}
                              className="text-[11px] text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Leave Balance Alerts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-2">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white m-0">
                  Low Leave Balance Alert (Faculty with &lt; 2 Casual Leaves)
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold">
                    <th className="py-2.5 px-4">Faculty Name</th>
                    <th className="py-2.5 px-4">Designation</th>
                    <th className="py-2.5 px-4">Employment</th>
                    <th className="py-2.5 px-4">CL Balance Remaining</th>
                    <th className="py-2.5 px-4">EL Balance</th>
                    <th className="py-2.5 px-4">HPL Balance</th>
                    <th className="py-2.5 px-4">Alert Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {staffList
                    .filter(s => {
                      const bal = getLeaveBalance(s, leaveApplications, selectedDate);
                      return bal.clRemaining < 2;
                    })
                    .map(s => {
                      const bal = getLeaveBalance(s, leaveApplications, selectedDate);
                      const isExhausted = bal.clRemaining === 0;

                      return (
                        <tr key={s.employeeCode} className="hover:bg-slate-800/40 text-slate-300">
                          <td className="py-2.5 px-4 font-sans font-bold text-white">{s.name}</td>
                          <td className="py-2.5 px-4 font-sans">{s.designation}</td>
                          <td className="py-2.5 px-4 font-sans">{s.employmentType || 'Regular'}</td>
                          <td className="py-2.5 px-4 font-bold text-rose-400">{bal.clRemaining} day(s)</td>
                          <td className="py-2.5 px-4 text-blue-300">{bal.elRemaining}</td>
                          <td className="py-2.5 px-4 text-indigo-300">{bal.hplRemaining}</td>
                          <td className="py-2.5 px-4 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isExhausted
                                  ? 'bg-rose-950 text-rose-300 border-rose-500'
                                  : 'bg-amber-950 text-amber-300 border-amber-500'
                              }`}
                            >
                              {isExhausted ? 'CL Exhausted' : 'Low CL Balance'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: MONTHLY LEAVE STATEMENT (ACCOUNTS) */}
      {/* ========================================================================= */}
      {activeTab === 'monthly_statement' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Month Selector Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={statementMonth}
                onChange={e => setStatementMonth(parseInt(e.target.value, 10))}
                className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
              >
                <option value={0}>January 2026</option>
                <option value={1}>February 2026</option>
                <option value={2}>March 2026</option>
                <option value={3}>April 2026</option>
                <option value={4}>May 2026</option>
                <option value={5}>June 2026</option>
                <option value={6}>July 2026</option>
                <option value={7}>August 2026</option>
                <option value={8}>September 2026</option>
                <option value={9}>October 2026</option>
                <option value={10}>November 2026</option>
                <option value={11}>December 2026</option>
              </select>

              <select
                value={statementYear}
                onChange={e => setStatementYear(parseInt(e.target.value, 10))}
                className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
              >
                <option value={2026}>Session: 2026-27</option>
                <option value={2025}>Session: 2025-26</option>
              </select>

              <span className="text-xs text-slate-400">
                Official Monthly Return for Accounts, Salary Processing & RO Submission.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all border border-slate-700 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Statement</span>
              </button>

              <button
                onClick={handleExportMonthlyStatement}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Statement Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-white m-0">
                  Monthly Leave & Loss of Pay Statement &bull; KENDRIYA VIDYALAYA KUTRA
                </h3>
                <span className="text-xs text-slate-400">
                  For the month of {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][statementMonth]} {statementYear}
                </span>
              </div>

              <div className="px-3 py-1 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold font-mono">
                Total School Loss of Pay: {monthlyStatementData.schoolTotals.absentLop} Day(s)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-center font-bold">
                    <th rowSpan={2} className="py-2 px-2 border-r border-slate-800">S.N.</th>
                    <th rowSpan={2} className="py-2 px-3 border-r border-slate-800 text-left">Teacher Name</th>
                    <th rowSpan={2} className="py-2 px-2 border-r border-slate-800 text-left">Designation</th>
                    <th rowSpan={2} className="py-2 px-2 border-r border-slate-800">Type</th>
                    <th colSpan={7} className="py-1 px-2 border-r border-slate-800 bg-purple-950/60 text-purple-200">
                      Leaves Taken During Month (Days)
                    </th>
                    <th rowSpan={2} className="py-2 px-2 border-r border-slate-800 bg-sky-950/60 text-sky-200 font-black">
                      Total Days
                    </th>
                    <th colSpan={3} className="py-1 px-2 border-r border-slate-800 bg-indigo-950/60 text-indigo-200">
                      Balance Remaining
                    </th>
                    <th rowSpan={2} className="py-2 px-3 text-left">Remarks / LOP</th>
                  </tr>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-center font-semibold text-[10px]">
                    <th className="py-1 px-1.5 border-r border-slate-800">CL</th>
                    <th className="py-1 px-1.5 border-r border-slate-800">EL</th>
                    <th className="py-1 px-1.5 border-r border-slate-800">HPL</th>
                    <th className="py-1 px-1.5 border-r border-slate-800">Comm</th>
                    <th className="py-1 px-1.5 border-r border-slate-800">EOL</th>
                    <th className="py-1 px-1.5 border-r border-slate-800">OD</th>
                    <th className="py-1 px-1.5 border-r border-slate-800 text-rose-400 font-bold">Absent/LOP</th>
                    <th className="py-1 px-1.5 border-r border-slate-800">CL</th>
                    <th className="py-1 px-1.5 border-r border-slate-800">EL</th>
                    <th className="py-1 px-1.5 border-r border-slate-800">HPL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {monthlyStatementData.rows.map(r => (
                    <tr key={r.employeeCode} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                      <td className="py-2 px-2 text-center border-r border-slate-800">{r.sn}</td>
                      <td className="py-2 px-3 font-sans font-medium text-white border-r border-slate-800">
                        {r.name}
                      </td>
                      <td className="py-2 px-2 font-sans text-slate-400 border-r border-slate-800">
                        {r.designation}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-800 font-sans text-[10px]">
                        <span className={`px-1.5 py-0.2 rounded ${r.employmentType === 'Contractual' ? 'bg-amber-950 text-amber-300' : 'bg-purple-950 text-purple-300'}`}>
                          {r.employmentType}
                        </span>
                      </td>

                      {/* Leaves Taken */}
                      <td className="py-2 px-1.5 text-center border-r border-slate-800">{r.cl || '-'}</td>
                      <td className="py-2 px-1.5 text-center border-r border-slate-800">{r.el || '-'}</td>
                      <td className="py-2 px-1.5 text-center border-r border-slate-800">{r.hpl || '-'}</td>
                      <td className="py-2 px-1.5 text-center border-r border-slate-800">{r.comm || '-'}</td>
                      <td className="py-2 px-1.5 text-center border-r border-slate-800">{r.eol || '-'}</td>
                      <td className="py-2 px-1.5 text-center border-r border-slate-800">{r.od || '-'}</td>
                      <td className={`py-2 px-1.5 text-center border-r border-slate-800 font-bold ${r.absentLop > 0 ? 'text-rose-400 bg-rose-950/20' : 'text-slate-500'}`}>
                        {r.absentLop || '-'}
                      </td>

                      {/* Total Days */}
                      <td className="py-2 px-2 text-center font-black text-white border-r border-slate-800 bg-sky-950/20">
                        {r.totalDays || 0}
                      </td>

                      {/* Balance Remaining */}
                      <td className="py-2 px-1.5 text-center border-r border-slate-800 font-bold text-purple-300">{r.clRemaining}</td>
                      <td className="py-2 px-1.5 text-center border-r border-slate-800 text-blue-300">{r.elRemaining}</td>
                      <td className="py-2 px-1.5 text-center border-r border-slate-800 text-indigo-300">{r.hplRemaining}</td>

                      {/* Remarks */}
                      <td className="py-2 px-3 font-sans text-[11px] text-slate-400">
                        {r.remarks}
                      </td>
                    </tr>
                  ))}

                  {/* Whole School Summary Row */}
                  <tr className="bg-purple-950/90 text-white font-bold border-t-2 border-purple-500 text-center">
                    <td colSpan={4} className="py-3 px-3 border-r border-purple-800 text-left font-sans tracking-wide">
                      TOTAL WHOLE-SCHOOL LEAVE & LOSS OF PAY DAYS
                    </td>
                    <td className="py-3 px-1.5 border-r border-purple-800">{monthlyStatementData.schoolTotals.cl}</td>
                    <td className="py-3 px-1.5 border-r border-purple-800">{monthlyStatementData.schoolTotals.el}</td>
                    <td className="py-3 px-1.5 border-r border-purple-800">{monthlyStatementData.schoolTotals.hpl}</td>
                    <td className="py-3 px-1.5 border-r border-purple-800">{monthlyStatementData.schoolTotals.comm}</td>
                    <td className="py-3 px-1.5 border-r border-purple-800">{monthlyStatementData.schoolTotals.eol}</td>
                    <td className="py-3 px-1.5 border-r border-purple-800">{monthlyStatementData.schoolTotals.od}</td>
                    <td className="py-3 px-1.5 border-r border-purple-800 text-rose-300 font-black bg-rose-950">
                      {monthlyStatementData.schoolTotals.absentLop} LOP
                    </td>
                    <td className="py-3 px-2 border-r border-purple-800 text-emerald-300 font-black">
                      {monthlyStatementData.schoolTotals.allDays}
                    </td>
                    <td colSpan={3} className="py-3 px-2 border-r border-purple-800 text-slate-400 font-sans text-[10px]">
                      Ledger Updated
                    </td>
                    <td className="py-3 px-3 text-left font-sans text-xs text-rose-300">
                      Loss of Pay: {monthlyStatementData.schoolTotals.absentLop} Days Total
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: LEAVE & VACATION SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveLeaveSettings} className="space-y-6 animate-fadeIn max-w-4xl">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 m-0">
                <Settings className="w-5 h-5 text-purple-400" />
                <span>KVS Leave & Contractual Safeguards Configuration</span>
              </h3>
              <p className="text-xs text-slate-400 m-0">
                Configure statutory parameters, contractual service rules, and remedial duty months.
              </p>
            </div>

            {/* Contractual Rules Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider m-0">
                1. Contractual Staff Casual Leave (CL) Rules
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Minimum Service Required Before 1st CL (Months)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={leaveSettings.contractualMinServiceMonths}
                    onChange={e =>
                      setLeaveSettings({
                        ...leaveSettings,
                        contractualMinServiceMonths: parseInt(e.target.value, 10) || 0
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Standard KVS rule: 1 completed month of continuous service.
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Maximum CL Allowed Per Calendar Month (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={leaveSettings.contractualMaxClPerMonth}
                    onChange={e =>
                      setLeaveSettings({
                        ...leaveSettings,
                        contractualMaxClPerMonth: parseInt(e.target.value, 10) || 1
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Standard KVS rule: Max 1 CL per calendar month.
                  </span>
                </div>
              </div>
            </div>

            {/* Vacation & Remedial Duty Months Section */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider m-0">
                2. Vacation / Break Months with Remedial Duties (CL Entitlement = 0)
              </h4>
              <p className="text-xs text-slate-400 m-0">
                When contractual faculty are assigned institutional / remedial duties during vacation breaks, their CL entitlement for that month is reduced to 0 as per KVS norms.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {[
                  { key: '2026-05', label: 'May 2026 (Summer Vacation)' },
                  { key: '2026-06', label: 'June 2026 (Summer Vacation)' },
                  { key: '2026-10', label: 'October 2026 (Autumn Break)' },
                  { key: '2026-12', label: 'December 2026 (Winter Break)' }
                ].map(vMonth => {
                  const isChecked = leaveSettings.remedialVacationDutyMonths.includes(vMonth.key);

                  return (
                    <label
                      key={vMonth.key}
                      className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-purple-950/60 border-purple-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          const updated = e.target.checked
                            ? [...leaveSettings.remedialVacationDutyMonths, vMonth.key]
                            : leaveSettings.remedialVacationDutyMonths.filter(m => m !== vMonth.key);
                          setLeaveSettings({
                            ...leaveSettings,
                            remedialVacationDutyMonths: updated
                          });
                        }}
                        className="rounded accent-purple-600 cursor-pointer"
                      />
                      <span className="text-xs font-medium">{vMonth.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Leave Settings</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: LEAVE APPLICATION & SANCTION */}
      {/* ========================================================================= */}
      {isLeaveModalOpen && activeStaffForLeave && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2 m-0">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>Leave Application & Sanction</span>
                </h3>
                <p className="text-xs text-slate-400 m-0">
                  {activeStaffForLeave.name} ({activeStaffForLeave.designation}) &bull;{' '}
                  <span className="text-purple-300 font-bold">{activeStaffForLeave.employmentType || 'Regular'}</span>
                </p>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeaveApplication} className="space-y-4">
              {/* Leave Type Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Leave Type *</label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
                >
                  {activeStaffForLeave.employmentType === 'Contractual' ? (
                    <>
                      <option value="CL">Casual Leave (CL) - Max 1/Month</option>
                      <option value="OD">Official On-Duty (OD)</option>
                      <option value="Absent">Leave Without Pay / Absent</option>
                    </>
                  ) : (
                    <>
                      <option value="CL">Casual Leave (CL) - 8 days/yr</option>
                      <option value="EL">Earned Leave (EL)</option>
                      <option value="HPL">Half Pay Leave (HPL)</option>
                      <option value="Comm">Commuted Leave (Medical)</option>
                      <option value="EOL-MG">Extra Ordinary Leave (Medical)</option>
                      <option value="EOL-PA">Extra Ordinary Leave (Private)</option>
                      <option value="CCL">Child Care Leave (CCL)</option>
                      <option value="SpCL">Special Casual Leave (SpCL)</option>
                      <option value="Absent">Leave Without Pay / Absent</option>
                    </>
                  )}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {LEAVE_TYPE_LABELS[leaveType]?.desc}
                </span>
              </div>

              {/* Half-Day Toggle */}
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2.5">
                <label className="flex items-center gap-2 text-xs text-purple-200 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={halfDay}
                    onChange={e => {
                      const checked = e.target.checked;
                      setHalfDay(checked);
                      if (checked) {
                        setLeaveToDate(leaveFromDate);
                      }
                    }}
                    className="rounded accent-purple-600 cursor-pointer w-4 h-4"
                  />
                  <span>Half-Day Leave (0.5 Day)</span>
                </label>

                {halfDay && (
                  <div className="pt-2 border-t border-purple-800/40 flex items-center gap-4 flex-wrap">
                    <span className="text-xs font-bold text-slate-300">Session:</span>
                    <label className="flex items-center gap-1.5 text-xs text-purple-200 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="halfDaySession"
                        value="First Half"
                        checked={halfDaySession === 'First Half'}
                        onChange={() => setHalfDaySession('First Half')}
                        className="accent-purple-500 cursor-pointer"
                      />
                      <span>First Half (Periods 1–4)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-purple-200 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="halfDaySession"
                        value="Second Half"
                        checked={halfDaySession === 'Second Half'}
                        onChange={() => setHalfDaySession('Second Half')}
                        className="accent-purple-500 cursor-pointer"
                      />
                      <span>Second Half (Periods 5–9)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {halfDay ? 'Date *' : 'From Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveFromDate}
                    onChange={e => {
                      const val = e.target.value;
                      setLeaveFromDate(val);
                      if (halfDay) {
                        setLeaveToDate(val);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                {!halfDay && (
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">To Date *</label>
                    <input
                      type="date"
                      required
                      value={leaveToDate}
                      onChange={e => setLeaveToDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 font-sans">Total Requested Duration:</span>
                <strong className="text-purple-300">
                  {requestedLeaveDays} day(s) {halfDay && `(${halfDaySession})`}
                </strong>
              </div>

              {/* Validation Feedback & Warnings */}
              {validationResult && !validationResult.canApply && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-rose-300 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{validationResult.reason}</span>
                  </div>

                  {isPrincipalOrAdmin && (
                    <div className="pt-2 border-t border-rose-800/60 space-y-2">
                      <label className="flex items-center gap-2 text-amber-300 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={principalOverrideAllowed}
                          onChange={e => setPrincipalOverrideAllowed(e.target.checked)}
                          className="rounded accent-amber-500 cursor-pointer"
                        />
                        <span>Allow Sanction under Principal Discretionary Override</span>
                      </label>

                      {principalOverrideAllowed && (
                        <input
                          type="text"
                          required
                          placeholder="Enter Principal sanction reason / official order justification..."
                          value={principalOverrideRemarks}
                          onChange={e => setPrincipalOverrideRemarks(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-amber-500/50 rounded-xl text-white focus:outline-none"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Station Leaving & Reason */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Reason for Leave *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urgent family work / Medical checkup / Family function"
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stationLeaving}
                    onChange={e => setStationLeaving(e.target.checked)}
                    className="rounded accent-purple-600 cursor-pointer"
                  />
                  <span>Permission to leave headquarter / station required</span>
                </label>

                {stationLeaving && (
                  <input
                    type="text"
                    required
                    placeholder="Address during station leave & contact number..."
                    value={stationAddress}
                    onChange={e => setStationAddress(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={validationResult && !validationResult.canApply && !principalOverrideAllowed}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sanction & Debit Leave</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ON-DUTY (OD) FORM */}
      {/* ========================================================================= */}
      {isOnDutyModalOpen && activeStaffForOD && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2 m-0">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  <span>Record Official On-Duty (OD) Deputation</span>
                </h3>
                <p className="text-xs text-slate-400 m-0">
                  {activeStaffForOD.name} ({activeStaffForOD.designation})
                </p>
              </div>
              <button
                onClick={() => setIsOnDutyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOnDuty} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Purpose of Deputation *</label>
                <select
                  value={odPurpose}
                  onChange={e => setOdPurpose(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
                >
                  <option value="KVS Regional Sports Meet">KVS Regional / National Sports Meet</option>
                  <option value="Scouts & Guides Camp">Scouts & Guides Camp / Rally</option>
                  <option value="CBSE Board Observer / Exam Duty">CBSE Board Observer / Exam Center Duty</option>
                  <option value="In-Service Training / Workshop">In-Service Training / Workshop / Seminar</option>
                  <option value="Regional Office Meeting">Regional Office (RO) Meeting / Audit</option>
                  <option value="Official Institutional Work">Official Institutional Work / Escort Duty</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Deputation Venue *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KV No. 1 Bhubaneswar / RO BBSR"
                    value={odVenue}
                    onChange={e => setOdVenue(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Official Order No. (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. KVS/RO/BBSR/SPORTS/2026/894"
                    value={odOrderNo}
                    onChange={e => setOdOrderNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">From Date *</label>
                  <input
                    type="date"
                    required
                    value={odFromDate}
                    onChange={e => setOdFromDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">To Date *</label>
                  <input
                    type="date"
                    required
                    value={odToDate}
                    onChange={e => setOdToDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Detailed Description / Escort Role</label>
                <input
                  type="text"
                  placeholder="e.g. Escorting U-17 Girls Athletics team to Regional Sports Meet"
                  value={odDescription}
                  onChange={e => setOdDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOnDutyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Record On-Duty</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Bottom Save Action Bar for Unsaved Changes */}
      {hasUnsavedChanges && activeTab === 'daily' && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl flex items-center gap-4 text-white max-w-xl w-[90vw] animate-slideUp">
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div className="min-w-0">
              <h4 className="font-black text-sm text-emerald-300 m-0 truncate">Unsaved Attendance Changes</h4>
              <p className="text-xs text-slate-300 m-0 truncate">
                {unsavedStaffCodes.size} faculty modified for {formatDisplayDate(selectedDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDiscardStagedChanges}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={handleSaveAllAttendanceForDate}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : `Save (${selectedDate})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Principal Override Sanctioned Leave / OD */}
      {confirmOverrideModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white m-0">Override Sanctioned Leave / Duty?</h3>
                <p className="text-xs text-slate-400 m-0">Principal Attendance Correction Protocol</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-slate-300 m-0">
                <strong className="text-white">{confirmOverrideModal.staff.name}</strong> currently has an active sanctioned{' '}
                <strong className="text-amber-300">
                  {confirmOverrideModal.activeLeaveInfo?.leaveType || (confirmOverrideModal.activeODInfo ? 'Official On-Duty' : 'Absence')}
                </strong>{' '}
                recorded for <strong className="text-emerald-400">{formatDisplayDate(selectedDate)}</strong>.
              </p>
              
              {confirmOverrideModal.activeLeaveInfo?.reason && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="text-slate-500 block font-bold">Sanctioned Leave Details:</span>
                  <span className="text-slate-300 font-mono">
                    Dates: {confirmOverrideModal.activeLeaveInfo.fromDate} to {confirmOverrideModal.activeLeaveInfo.toDate}
                  </span>
                  <p className="text-slate-400 italic m-0">"{confirmOverrideModal.activeLeaveInfo.reason}"</p>
                </div>
              )}

              {confirmOverrideModal.activeODInfo?.purpose && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="text-slate-500 block font-bold">Official On-Duty Details:</span>
                  <p className="text-slate-300 m-0">{confirmOverrideModal.activeODInfo.purpose} ({confirmOverrideModal.activeODInfo.venue || 'Deputed'})</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                <p className="font-bold m-0">Correction Effect:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  <li>Cancels / supersedes this entry for <strong className="text-white">{formatDisplayDate(selectedDate)}</strong>.</li>
                  <li>Restores debited leave day balance back to teacher's ledger.</li>
                  <li>Marks daily status as <strong className="text-emerald-300">{confirmOverrideModal.targetStatus}</strong>.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmOverrideModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const modal = confirmOverrideModal;
                  setConfirmOverrideModal(null);
                  handleMarkAttendance(modal.staff, modal.targetStatus, undefined, true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Mark {confirmOverrideModal.targetStatus}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: AUTOMATIC PROXY & SUBSTITUTION PLANNER */}
      {/* ========================================================================= */}
      <AutomaticProxyPlannerModal
        isOpen={isProxyModalOpen}
        onClose={() => setIsProxyModalOpen(false)}
        initialStaff={activeStaffForProxy}
        initialDate={selectedDate}
        currentUser={currentUser}
        onProxySaved={loadInitialData}
      />
    </div>
  );
};
