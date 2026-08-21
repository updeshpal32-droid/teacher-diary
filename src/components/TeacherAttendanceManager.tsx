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
  DEFAULT_LEAVE_SETTINGS
} from '../lib/storage';
import {
  getLeaveBalance,
  canApplyLeave,
  debitLeave,
  calculateLeaveDays,
  LeaveValidationResult
} from '../lib/leaveEngine';
import { getTeacherScopedStorageKey } from '../lib/teacherContext';
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

  // Current selected date for attendance (defaults to Today)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
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

  // Permissions & Roles
  const isPrincipalOrAdmin = currentUser?.role === 'admin' || currentUser?.activePersona === 'admin';
  const isDataEntryManager = currentUser?.role === 'data_entry_manager' || currentUser?.activePersona === 'data_entry_manager';
  const canMarkAttendance = isPrincipalOrAdmin || isDataEntryManager;

  useEffect(() => {
    loadInitialData();
  }, []);

  // Recalculate validation whenever leave form changes
  useEffect(() => {
    if (isLeaveModalOpen && activeStaffForLeave) {
      const res = canApplyLeave(activeStaffForLeave, leaveType, leaveFromDate, leaveToDate, leaveApplications);
      setValidationResult(res);
    }
  }, [isLeaveModalOpen, activeStaffForLeave, leaveType, leaveFromDate, leaveToDate, leaveApplications]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [storedStaff, storedAttendance, storedLeaves, storedOD, storedTimetable, storedProxy, storedSettings] = await Promise.all([
        db.get<StaffDetailRecord[]>('setup:staff_details'),
        db.get<TeacherAttendanceRecord[]>('setup:teacher_attendance'),
        db.get<LeaveApplication[]>('setup:leave_applications'),
        db.get<OnDutyRecord[]>('setup:on_duty_records'),
        db.get<TimetableSlot[]>('setup:timetable'),
        db.get<ProxyDutyAssignment[]>('setup:proxy_duty_assignments'),
        db.get<LeaveSettingsConfig>('setup:leave_settings')
      ]);

      setStaffList(storedStaff && storedStaff.length > 0 ? storedStaff : DEFAULT_STAFF_DETAILS);
      setAttendanceRecords(storedAttendance && storedAttendance.length > 0 ? storedAttendance : DEFAULT_TEACHER_ATTENDANCE);
      setLeaveApplications(storedLeaves && storedLeaves.length > 0 ? storedLeaves : DEFAULT_LEAVE_APPLICATIONS);
      setOnDutyRecords(storedOD && storedOD.length > 0 ? storedOD : DEFAULT_ON_DUTY_RECORDS);
      setTimetable(storedTimetable && storedTimetable.length > 0 ? storedTimetable : DEFAULT_TIMETABLE);
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

  // Quick Attendance Mark
  const handleMarkAttendance = async (staff: StaffDetailRecord, status: AttendanceStatus, customLeaveType?: LeaveType) => {
    if (!canMarkAttendance) {
      alert('Only Principal / Admin or Authorized Attendance Incharge can mark daily staff attendance.');
      return;
    }

    const recId = `att-staff-${staff.employeeCode}-${selectedDate}`;
    const existingIndex = attendanceRecords.findIndex(r => r.id === recId || (r.employeeCode === staff.employeeCode && r.date === selectedDate));

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
      markedBy: currentUser?.name || 'Admin',
      markedAt: new Date().toISOString(),
      verifiedByPrincipal: isPrincipalOrAdmin
    };

    let updatedList: TeacherAttendanceRecord[];
    if (existingIndex >= 0) {
      updatedList = [...attendanceRecords];
      updatedList[existingIndex] = newRecord;
    } else {
      updatedList = [...attendanceRecords, newRecord];
    }

    setAttendanceRecords(updatedList);
    await db.set('setup:teacher_attendance', updatedList);
    showFeedback(`Marked ${staff.name} as ${status}${customLeaveType ? ` (${customLeaveType})` : ''} for ${selectedDate}`);
    if (onSaved) onSaved();
  };

  // Open Leave Modal for a specific teacher
  const handleOpenLeaveModal = (staff: StaffDetailRecord) => {
    setActiveStaffForLeave(staff);
    setLeaveFromDate(selectedDate);
    setLeaveToDate(selectedDate);
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

    const days = calculateLeaveDays(leaveFromDate, leaveToDate);
    if (days <= 0) {
      alert('Invalid date range. To Date must be on or after From Date.');
      return;
    }

    // Validation check
    const validation = canApplyLeave(activeStaffForLeave, leaveType, leaveFromDate, leaveToDate, leaveApplications);
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
      toDate: leaveToDate,
      totalDays: days,
      reason: leaveReason.trim() || 'Personal Work',
      stationLeavingPermission: stationLeaving,
      stationAddress: stationLeaving ? stationAddress : undefined,
      status: isPrincipalOrAdmin ? 'Sanctioned' : 'Pending',
      appliedAt: new Date().toISOString(),
      sanctionedBy: isPrincipalOrAdmin ? (currentUser?.name || 'Principal') : undefined,
      sanctionedAt: isPrincipalOrAdmin ? new Date().toISOString() : undefined,
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
      remarks: leaveReason || `Sanctioned ${leaveType}`,
      markedBy: currentUser?.name || 'Admin',
      markedAt: new Date().toISOString(),
      verifiedByPrincipal: isPrincipalOrAdmin
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
      markedBy: currentUser?.name || 'Admin',
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

    setIsOnDutyModalOpen(false);
    showFeedback(`On-Duty deputation recorded for ${activeStaffForOD.name}`);
    if (onSaved) onSaved();
  };

  // Mark All Present Shortcut (1-Tap for Quick Morning Registration)
  const handleMarkAllPresent = async () => {
    if (!canMarkAttendance) return;
    if (!window.confirm(`Mark all unassigned teachers as 'Present' for ${selectedDate}?`)) return;

    const updatedList = [...attendanceRecords];

    for (const staff of staffList) {
      const existing = updatedList.find(r => r.employeeCode === staff.employeeCode && r.date === selectedDate);
      if (!existing || existing.status === 'Holiday') {
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
          markedBy: currentUser?.name || 'Admin',
          markedAt: new Date().toISOString(),
          verifiedByPrincipal: isPrincipalOrAdmin
        };
        const idx = updatedList.findIndex(r => r.id === recId);
        if (idx >= 0) updatedList[idx] = newRecord;
        else updatedList.push(newRecord);
      }
    }

    setAttendanceRecords(updatedList);
    await db.set('setup:teacher_attendance', updatedList);
    showFeedback(`All active staff marked Present for ${selectedDate}`);
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
    const teacherNameLower = staff.name.trim().toLowerCase();
    const daySlots = timetable.filter(s => (s.dayOfWeek || s.day) === currentDayOfWeek);

    const matchingSlots = daySlots.filter(slot => {
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

      // Exclude teachers who are themselves on Leave or Absent today
      const att = dayAttendanceMap.get(staff.employeeCode);
      if (att && (att.status === 'Leave' || att.status === 'Absent')) return false;

      // Check if they already have a regular class or existing proxy in this period
      const teacherNameLower = staff.name.trim().toLowerCase();
      const hasClass = daySlots.some(s => {
        const tName = (s.teacherName || '').toLowerCase();
        const arrName = (s.arrangementTeacherName || '').toLowerCase();
        return (tName && tName.includes(teacherNameLower)) || (s.isArrangement && arrName && arrName.includes(teacherNameLower));
      });

      return !hasClass;
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
    setTimetable(updatedTimetable);

    await Promise.all([
      db.set('setup:proxy_duty_assignments', updatedProxyList),
      db.set('setup:timetable', updatedTimetable),
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

    // Revert TimetableSlot isArrangement flag
    const updatedTimetable = timetable.map(slot => {
      const pNum = slot.period || slot.periodNumber || 1;
      const isTarget =
        (slot.dayOfWeek || slot.day) === proxyToCancel.dayOfWeek &&
        pNum === proxyToCancel.periodNumber &&
        slot.className === proxyToCancel.className;

      if (isTarget) {
        return {
          ...slot,
          isArrangement: false,
          arrangementTeacherName: undefined,
          arrangementReason: undefined
        };
      }
      return slot;
    });

    // Remove task from TaskManager
    const existingTasks = (await db.get<TeacherTask[]>('setup:tasks')) || [];
    const updatedTasks = existingTasks.filter(t => !t.id.includes(proxyToCancel.periodNumber.toString()) || !t.title.includes(proxyToCancel.className));

    const promises: Promise<any>[] = [
      db.set('setup:proxy_duty_assignments', updatedProxyList),
      db.set('setup:timetable', updatedTimetable),
      db.set('setup:tasks', updatedTasks)
    ];

    if (proxyToCancel.substituteTeacherCode) {
      const scopedSubTaskKey = getTeacherScopedStorageKey('setup:tasks', proxyToCancel.substituteTeacherCode);
      const existingSubTasks = (await db.get<TeacherTask[]>(scopedSubTaskKey)) || [];
      const updatedSubTasks = existingSubTasks.filter(t => !t.id.includes(proxyToCancel.periodNumber.toString()) || !t.title.includes(proxyToCancel.className));
      promises.push(db.set(scopedSubTaskKey, updatedSubTasks));
    }

    setProxyAssignments(updatedProxyList);
    setTimetable(updatedTimetable);

    await Promise.all(promises);

    window.dispatchEvent(new CustomEvent('kvs-timetable-updated'));
    showFeedback(`Cancelled proxy duty for Period ${proxyToCancel.periodNumber} (${proxyToCancel.className})`, 'info');
    if (onSaved) onSaved();
  };

  // Current Date Attendance Lookup Map
  const dayAttendanceMap = useMemo(() => {
    const map = new Map<string, TeacherAttendanceRecord>();
    for (const rec of attendanceRecords) {
      if (rec.date === selectedDate) {
        map.set(rec.employeeCode, rec);
      }
    }
    return map;
  }, [attendanceRecords, selectedDate]);

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
      const att = dayAttendanceMap.get(staff.employeeCode);
      const curStatus = att?.status || 'Unmarked';
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
    let leave = 0;
    let od = 0;
    let absent = 0;
    let unmarked = 0;

    for (const staff of staffList) {
      const att = dayAttendanceMap.get(staff.employeeCode);
      if (!att) {
        unmarked++;
      } else if (att.status === 'Present') {
        present++;
      } else if (att.status === 'Leave') {
        leave++;
      } else if (att.status === 'OD') {
        od++;
      } else if (att.status === 'Absent') {
        absent++;
      }
    }

    // Count pending proxy substitutions today
    const absentStaffToday = staffList.filter(s => {
      const att = dayAttendanceMap.get(s.employeeCode);
      return att && (att.status === 'Leave' || att.status === 'Absent' || att.status === 'OD');
    });

    let totalPeriodsNeedingProxy = 0;
    let assignedProxiesToday = 0;

    for (const staff of absentStaffToday) {
      const daySlots = getStaffDayPeriods(staff);
      totalPeriodsNeedingProxy += daySlots.length;
      const staffProxies = proxyAssignments.filter(p => p.date === selectedDate && p.absentTeacherCode === staff.employeeCode);
      assignedProxiesToday += staffProxies.length;
    }

    const pendingProxies = Math.max(0, totalPeriodsNeedingProxy - assignedProxiesToday);

    return {
      total: staffList.length,
      present,
      leave,
      od,
      absent,
      unmarked,
      attendanceRate: staffList.length > 0 ? Math.round(((present + od) / staffList.length) * 100) : 0,
      totalPeriodsNeedingProxy,
      assignedProxiesToday,
      pendingProxies
    };
  }, [staffList, dayAttendanceMap, proxyAssignments, selectedDate, timetable, currentDayOfWeek]);

  // Current Live Balance for Staff in Leave Modal
  const activeStaffBalance: LeaveBalance | null = useMemo(() => {
    if (!activeStaffForLeave) return null;
    return getLeaveBalance(activeStaffForLeave, leaveApplications, selectedDate);
  }, [activeStaffForLeave, leaveApplications, selectedDate]);

  const requestedLeaveDays = useMemo(() => {
    return calculateLeaveDays(leaveFromDate, leaveToDate);
  }, [leaveFromDate, leaveToDate]);

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
          <p className="text-xs text-purple-200/80 m-0">
            Daily faculty roll-call, statutory leave balances, Central Government & KVS Contractual safeguard engine, automatic proxy duty substitution, and monthly accounts statements.
          </p>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'daily' && (
            <button
              onClick={handleMarkAllPresent}
              disabled={!canMarkAttendance}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Mark All Present</span>
            </button>
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
              <div className="text-[10px] text-emerald-300/70">On Campus Today</div>
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

          {/* Teacher Roster List & Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map(staff => {
              const att = dayAttendanceMap.get(staff.employeeCode);
              const curStatus = att?.status || 'Unmarked';
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
                      ? 'border-emerald-500/30 hover:border-emerald-500/60'
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
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                          : curStatus === 'Leave'
                          ? 'bg-amber-950 text-amber-300 border-amber-500'
                          : curStatus === 'OD'
                          ? 'bg-blue-950 text-blue-300 border-blue-500'
                          : curStatus === 'Absent'
                          ? 'bg-rose-950 text-rose-300 border-rose-500'
                          : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}
                    >
                      {curStatus} {att?.leaveType ? `(${att.leaveType})` : ''}
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

              {/* Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">From Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveFromDate}
                    onChange={e => setLeaveFromDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

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
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 font-sans">Total Requested Duration:</span>
                <strong className="text-purple-300">{requestedLeaveDays} day(s)</strong>
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

      {/* ========================================================================= */}
      {/* MODAL 3: AUTOMATIC PROXY / ARRANGEMENT DUTY PLANNER */}
      {/* ========================================================================= */}
      {isProxyModalOpen && activeStaffForProxy && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl relative my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2 m-0">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  <span>Automatic Proxy & Substitution Planner</span>
                </h3>
                <p className="text-xs text-slate-400 m-0">
                  Absent Teacher: <strong className="text-rose-300">{activeStaffForProxy.name}</strong> ({activeStaffForProxy.designation}) &bull; Date: {selectedDate} ({currentDayOfWeek})
                </p>
              </div>
              <button
                onClick={() => setIsProxyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Periods Scheduled for Absent Teacher */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider m-0">
                1. Select Period Requiring Substitution:
              </h4>

              {getStaffDayPeriods(activeStaffForProxy).length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs">
                  ✨ No scheduled timetable periods found for {activeStaffForProxy.name} on {currentDayOfWeek}. No substitution required!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {getStaffDayPeriods(activeStaffForProxy).map((slot, sIdx) => {
                    const pNum = slot.period || slot.periodNumber || 1;
                    const existingProxy = proxyAssignments.find(
                      p =>
                        p.date === selectedDate &&
                        p.periodNumber === pNum &&
                        p.className === slot.className &&
                        p.absentTeacherCode === activeStaffForProxy.employeeCode
                    );

                    const isSelected =
                      selectedSlotForProxy &&
                      (selectedSlotForProxy.period || selectedSlotForProxy.periodNumber) === pNum &&
                      selectedSlotForProxy.className === slot.className;

                    return (
                      <div
                        key={slot.id || `slot-${pNum}-${sIdx}`}
                        onClick={() => {
                          setSelectedSlotForProxy(slot);
                          setSelectedSubstituteCode('');
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? 'bg-purple-950/60 border-purple-500 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500'
                            : existingProxy
                            ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-purple-300 font-mono text-xs font-bold">
                            Period {pNum}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {slot.timeSlot || '08:00 - 08:40'}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <div className="font-bold text-white text-xs flex items-center justify-between">
                            <span>Class {slot.className} {slot.section || ''}</span>
                            <span className="text-purple-300 font-normal">{slot.subjectName}</span>
                          </div>
                          {slot.roomNo && (
                            <div className="text-[11px] text-slate-500">Room: {slot.roomNo}</div>
                          )}
                        </div>

                        {/* Existing Proxy Indicator */}
                        {existingProxy ? (
                          <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                            <div className="text-[11px] text-emerald-300 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Proxy: {existingProxy.substituteTeacherName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelProxy(existingProxy.id);
                              }}
                              className="text-[10px] text-rose-400 hover:text-rose-300 underline font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-rose-400 font-bold">
                            <span className="flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Needs Proxy Assignment</span>
                            </span>
                            <span className="text-[10px] text-purple-400 uppercase font-mono">Click to select</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Substitution Assignment Form for Selected Period */}
            {selectedSlotForProxy && (
              <form onSubmit={handleAssignProxy} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-purple-300 m-0 uppercase tracking-wider flex items-center gap-1.5">
                    <span>2. Assign Available Substitute Teacher for Period {selectedSlotForProxy.period || selectedSlotForProxy.periodNumber || 1} (Class {selectedSlotForProxy.className})</span>
                  </h4>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Available Free Teachers During Period {selectedSlotForProxy.period || selectedSlotForProxy.periodNumber || 1} *
                  </label>
                  {(() => {
                    const pNum = selectedSlotForProxy.period || selectedSlotForProxy.periodNumber || 1;
                    const freeStaff = getAvailableFreeTeachers(pNum, activeStaffForProxy.employeeCode);

                    if (freeStaff.length === 0) {
                      return (
                        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs">
                          ⚠️ No completely free teachers found for Period {pNum}. You may still select any present staff below:
                          <select
                            required
                            value={selectedSubstituteCode}
                            onChange={e => setSelectedSubstituteCode(e.target.value)}
                            className="mt-2 w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                          >
                            <option value="">-- Choose Any Present Faculty --</option>
                            {staffList
                              .filter(s => s.employeeCode !== activeStaffForProxy.employeeCode)
                              .map(s => (
                                <option key={s.employeeCode} value={s.employeeCode}>
                                  {s.name} ({s.designation}) - {s.employmentType || 'Regular'}
                                </option>
                              ))}
                          </select>
                        </div>
                      );
                    }

                    return (
                      <select
                        required
                        value={selectedSubstituteCode}
                        onChange={e => setSelectedSubstituteCode(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="">-- Select From {freeStaff.length} Free Teacher(s) --</option>
                        {freeStaff.map(s => (
                          <option key={s.employeeCode} value={s.employeeCode}>
                            ✅ {s.name} ({s.designation}) &bull; Free Period {pNum} &bull; {s.employmentType || 'Regular'}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Special Instructions / Notes for Proxy Teacher (Optional)
                  </label>
                  <input
                    type="text"
                    value={proxyNotes}
                    onChange={e => setProxyNotes(e.target.value)}
                    placeholder="e.g. Conduct chapter 4 revision test / NCERT reading / Science lab visit..."
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Will automatically generate task: <strong>Proxy Duty – Class {selectedSlotForProxy.className}-{selectedSlotForProxy.section || 'A'} (Period {selectedSlotForProxy.period || selectedSlotForProxy.periodNumber || 1}) for {activeStaffForProxy.name}</strong>
                  </span>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Assign Proxy</span>
                  </button>
                </div>
              </form>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsProxyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Close Planner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
