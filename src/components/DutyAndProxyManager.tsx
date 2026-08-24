import React, { useState, useEffect, useMemo } from 'react';
import {
  TimetableSlot,
  StaffDetailRecord,
  ProxyDutyAssignment,
  TeacherAttendanceRecord,
  LeaveApplication,
  CampusDutyAssignment,
  CampusDutyType,
  TeacherTask,
  DayOfWeek
} from '../types/academic';
import { UserAccount } from '../types/auth';
import { db, DEFAULT_STAFF_DETAILS, getUserAccounts, getMergedStaffList } from '../lib/storage';
import { resolveTeacherAttendance, checkTeacherAbsenceOnDate, normalizeFacultyKey } from '../lib/attendanceAbsenceEngine';
import { useActiveWorkingDate } from '../lib/activeDateContext';
import { getTeacherScopedStorageKey } from '../lib/teacherContext';
import { DevModeBadge } from './DevModeBadge';
import { AutomaticProxyPlannerModal } from './AutomaticProxyPlannerModal';
import {
  Clock,
  UserCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users,
  Shield,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Download,
  Printer,
  ChevronRight,
  Search,
  Filter,
  Check,
  X,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Sun,
  Coffee,
  DoorOpen,
  BellRing,
  Edit3,
  MapPin,
  UserPlus,
  Bus,
  CheckSquare,
  Square
} from 'lucide-react';

interface DutyAndProxyManagerProps {
  devMode?: boolean;
  currentUser?: UserAccount | null;
  onNavigateTab?: (tab: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

type ActiveSubTab =
  | 'proxy_periods'
  | 'morning_gate'
  | 'recess_duty'
  | 'afternoon_gate'
  | 'duty_master_matrix';

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MORNING_GATE_LOCATIONS = [
  'Main Entrance Gate & Punctuality Check',
  'Morning Assembly Ground & Stage PA System',
  'Cycle Stand & Entry Security Gate',
  'Junior Wing Gate & Parent Reception'
];

const RECESS_LOCATIONS = [
  'Playground & Sports Field',
  'Junior Wing Corridor & Water Points',
  'Senior Wing Corridor & Staircase',
  'Canteen & Central Courtyard'
];

const AFTERNOON_GATE_LOCATIONS = [
  'Main School Gate & Traffic Dispersal',
  'Bus Boarding Stand & Student Safety',
  'Cycle Stand & Pedestrian Exit',
  'Primary Wing Dispersal Area & Van Stand'
];

export const DutyAndProxyManager: React.FC<DutyAndProxyManagerProps> = ({
  devMode,
  currentUser,
  onNavigateTab,
  onClose,
  isModal = false
}) => {
  const [activeTab, setActiveTab] = useState<ActiveSubTab>('recess_duty');
  const [staffList, setStaffList] = useState<StaffDetailRecord[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [proxyAssignments, setProxyAssignments] = useState<ProxyDutyAssignment[]>([]);
  const [campusDuties, setCampusDuties] = useState<CampusDutyAssignment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [periodTimings, setPeriodTimings] = useState<Record<number, { time: string; label: string }>>({});
  const [loading, setLoading] = useState(true);

  const { activeDate } = useActiveWorkingDate();

  // Selected Date for Proxy Substitution
  const [selectedDate, setSelectedDate] = useState<string>(activeDate);

  useEffect(() => {
    if (activeDate) {
      setSelectedDate(activeDate);
    }
  }, [activeDate]);

  // Modal: Automatic Proxy Planner Modal
  const [isProxyModalOpen, setIsProxyModalOpen] = useState(false);
  const [plannerInitialStaff, setPlannerInitialStaff] = useState<StaffDetailRecord | null>(null);

  const handleOpenProxyPlanner = (staff?: StaffDetailRecord | null) => {
    setPlannerInitialStaff(staff || null);
    setIsProxyModalOpen(true);
  };

  // Modal: New Campus Duty (Multi-Teacher Selection)
  const [isCampusDutyModalOpen, setIsCampusDutyModalOpen] = useState(false);
  const [dutyType, setDutyType] = useState<CampusDutyType>('Recess & Playground');
  const [dutyDay, setDutyDay] = useState<DayOfWeek>('Monday');
  const [dutyLocation, setDutyLocation] = useState(RECESS_LOCATIONS[0]);
  const [dutyTiming, setDutyTiming] = useState('10:30 - 11:00 AM');
  const [selectedTeacherCodes, setSelectedTeacherCodes] = useState<string[]>([]);
  const [dutyNotes, setDutyNotes] = useState('');

  // Inline Quick Add Teacher to specific Day & Duty Type
  const [inlineAddDay, setInlineAddDay] = useState<DayOfWeek | null>(null);
  const [inlineSelectedTeacherCode, setInlineSelectedTeacherCode] = useState('');
  const [inlineLocation, setInlineLocation] = useState('');

  // Inline Edit / Switch Spot on assigned Duty
  const [editingDutyId, setEditingDutyId] = useState<string | null>(null);
  const [editDutyLocation, setEditDutyLocation] = useState('');

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAllData();

    const handleDataUpdate = () => {
      loadAllData();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModal && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('kvs-portfolios-updated', handleDataUpdate);
    window.addEventListener('kvs-attendance-updated', handleDataUpdate);
    window.addEventListener('kvs-timetable-updated', handleDataUpdate);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('kvs-portfolios-updated', handleDataUpdate);
      window.removeEventListener('kvs-attendance-updated', handleDataUpdate);
      window.removeEventListener('kvs-timetable-updated', handleDataUpdate);
    };
  }, [isModal, onClose]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [allStaff, savedTT, savedProxies, savedDuties, savedAtt, savedLeaves, savedTimings] =
        await Promise.all([
          getMergedStaffList(),
          db.get<TimetableSlot[]>('setup:timetable'),
          db.get<ProxyDutyAssignment[]>('setup:proxy_duty_assignments'),
          db.get<CampusDutyAssignment[]>('setup:campus_duty_assignments'),
          db.get<TeacherAttendanceRecord[]>('setup:teacher_attendance'),
          db.get<LeaveApplication[]>('setup:leave_applications'),
          db.get<Record<number, { time: string; label: string }>>('setup:period_timings')
        ]);

      const effectiveStaff = (allStaff && allStaff.length > 0) ? allStaff : DEFAULT_STAFF_DETAILS;
      setStaffList(effectiveStaff);
      if (savedTT && savedTT.length > 0) setTimetable(savedTT);
      if (savedProxies && savedProxies.length > 0) setProxyAssignments(savedProxies);
      if (savedDuties && savedDuties.length > 0) {
        setCampusDuties(savedDuties);
      } else {
        initializeDefaultCampusDuties(allStaff);
      }
      if (savedAtt && savedAtt.length > 0) setAttendanceRecords(savedAtt);
      if (savedLeaves && savedLeaves.length > 0) setLeaveApplications(savedLeaves);
      if (savedTimings) setPeriodTimings(savedTimings);
    } catch (err) {
      console.error('Error loading duty data:', err);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultCampusDuties = async (staff: StaffDetailRecord[]) => {
    if (staff.length < 5) return;

    const initialDuties: CampusDutyAssignment[] = [
      // Monday Morning Gate (Multiple teachers)
      {
        id: 'duty-init-1',
        dutyType: 'Morning Gate & Assembly',
        dayOfWeek: 'Monday',
        location: 'Main Entrance Gate & Punctuality Check',
        timing: '07:15 - 07:45 AM',
        teacherEmployeeCode: staff[0]?.employeeCode || '108894',
        teacherName: staff[0]?.name || 'Teacher 1',
        teacherDesignation: staff[0]?.designation,
        status: 'Scheduled',
        assignedBy: 'Timetable Committee In-charge',
        assignedAt: new Date().toISOString()
      },
      {
        id: 'duty-init-2',
        dutyType: 'Morning Gate & Assembly',
        dayOfWeek: 'Monday',
        location: 'Morning Assembly Ground & Stage PA System',
        timing: '07:15 - 07:45 AM',
        teacherEmployeeCode: staff[1]?.employeeCode || '108898',
        teacherName: staff[1]?.name || 'Teacher 2',
        teacherDesignation: staff[1]?.designation,
        status: 'Scheduled',
        assignedBy: 'Timetable Committee In-charge',
        assignedAt: new Date().toISOString()
      },

      // Monday Recess (Multiple teachers)
      {
        id: 'duty-init-3',
        dutyType: 'Recess & Playground',
        dayOfWeek: 'Monday',
        location: 'Playground & Sports Field',
        timing: '10:30 - 11:00 AM',
        teacherEmployeeCode: staff[2]?.employeeCode || '102725',
        teacherName: staff[2]?.name || 'Teacher 3',
        teacherDesignation: staff[2]?.designation,
        status: 'Scheduled',
        assignedBy: 'Timetable Committee In-charge',
        assignedAt: new Date().toISOString()
      },
      {
        id: 'duty-init-4',
        dutyType: 'Recess & Playground',
        dayOfWeek: 'Monday',
        location: 'Junior Wing Corridor & Water Points',
        timing: '10:30 - 11:00 AM',
        teacherEmployeeCode: staff[3]?.employeeCode || '108896',
        teacherName: staff[3]?.name || 'Teacher 4',
        teacherDesignation: staff[3]?.designation,
        status: 'Scheduled',
        assignedBy: 'Timetable Committee In-charge',
        assignedAt: new Date().toISOString()
      },

      // Monday Afternoon Gate Dispersal (Multiple teachers)
      {
        id: 'duty-init-5',
        dutyType: 'Dispersal & Bus Stand',
        dayOfWeek: 'Monday',
        location: 'Main School Gate & Traffic Dispersal',
        timing: '01:40 - 02:10 PM',
        teacherEmployeeCode: staff[4]?.employeeCode || '108897',
        teacherName: staff[4]?.name || 'Teacher 5',
        teacherDesignation: staff[4]?.designation,
        status: 'Scheduled',
        assignedBy: 'Timetable Committee In-charge',
        assignedAt: new Date().toISOString()
      },
      {
        id: 'duty-init-6',
        dutyType: 'Dispersal & Bus Stand',
        dayOfWeek: 'Monday',
        location: 'Bus Boarding Stand & Student Safety',
        timing: '01:40 - 02:10 PM',
        teacherEmployeeCode: staff[0]?.employeeCode || '108894',
        teacherName: staff[0]?.name || 'Teacher 1',
        teacherDesignation: staff[0]?.designation,
        status: 'Scheduled',
        assignedBy: 'Timetable Committee In-charge',
        assignedAt: new Date().toISOString()
      }
    ];

    setCampusDuties(initialDuties);
    await db.set('setup:campus_duty_assignments', initialDuties);
  };

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  const selectedDayOfWeek = useMemo((): DayOfWeek => {
    const d = new Date(selectedDate);
    const dayIndex = d.getDay();
    const days: DayOfWeek[] = ['Monday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Monday';
  }, [selectedDate]);

  // Today's Absent / On Leave / OD Teachers
  const absentTeachersToday = useMemo(() => {
    return staffList.filter(s => {
      const abs = checkTeacherAbsenceOnDate(
        s.employeeCode,
        selectedDate,
        attendanceRecords,
        leaveApplications,
        []
      );
      return abs.isAbsent;
    });
  }, [staffList, attendanceRecords, leaveApplications, selectedDate]);

  // Proxy assignments for selected date
  const filteredProxyAssignments = useMemo(() => {
    return proxyAssignments.filter(p => p.date === selectedDate);
  }, [proxyAssignments, selectedDate]);

  // Find free teachers for a given period number and day
  const getFreeTeachersForPeriod = (periodNum: number, day: DayOfWeek): StaffDetailRecord[] => {
    return staffList.filter(s => {
      const isAbsent = absentTeachersToday.some(a =>
        (a.employeeCode && s.employeeCode && String(a.employeeCode).trim().toLowerCase() === String(s.employeeCode).trim().toLowerCase()) ||
        (a.name && s.name && normalizeFacultyKey(a.name) === normalizeFacultyKey(s.name))
      );
      if (isAbsent) return false;

      const hasRegularClass = timetable.some(t => {
        const tDay = (t.day || t.dayOfWeek || '').trim().toLowerCase();
        const targetDay = day.toLowerCase();
        const pNum = Number(t.period || t.periodNumber || 1);
        if (tDay !== targetDay || pNum !== periodNum) return false;
        if (t.isBreak) return false;
        const subj = (t.subjectName || '').toLowerCase();
        if (subj.includes('break') || subj.includes('recess') || subj.includes('free') || subj.includes('planning')) return false;

        if (t.teacherId && s.employeeCode && String(t.teacherId).trim().toLowerCase() === String(s.employeeCode).trim().toLowerCase()) {
          return true;
        }
        const tKey = normalizeFacultyKey(t.teacherName);
        const sKey = normalizeFacultyKey(s.name);
        if (tKey && sKey && (tKey === sKey || (tKey.length >= 6 && sKey.length >= 6 && (tKey.includes(sKey) || sKey.includes(tKey))))) {
          return true;
        }
        return false;
      });
      if (hasRegularClass) return false;

      const alreadyProxy = proxyAssignments.some(
        p =>
          p.date === selectedDate &&
          Number(p.periodNumber) === periodNum &&
          (
            (p.substituteTeacherCode && s.employeeCode && String(p.substituteTeacherCode).trim().toLowerCase() === String(s.employeeCode).trim().toLowerCase()) ||
            (p.substituteTeacherName && s.name && normalizeFacultyKey(p.substituteTeacherName) === normalizeFacultyKey(s.name))
          )
      );
      if (alreadyProxy) return false;

      return true;
    });
  };



  const handleRemoveProxy = async (proxyId: string, subName: string) => {
    if (!window.confirm(`Cancel proxy substitution assigned to ${subName}?`)) return;

    try {
      const updated = proxyAssignments.filter(p => p.id !== proxyId);
      setProxyAssignments(updated);
      await db.set('setup:proxy_duty_assignments', updated);

      window.dispatchEvent(new CustomEvent('kvs-timetable-updated'));
      showNotification('Proxy substitution cancelled.');
    } catch (err) {
      console.error('Error cancelling proxy:', err);
      showNotification('Failed to cancel proxy.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // ACTION: Add / Save Multiple Campus Duties in 1 Click
  // --------------------------------------------------------------------------
  const handleSaveMultipleCampusDuties = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeacherCodes.length === 0) {
      alert('Please select at least one teacher.');
      return;
    }

    try {
      const newDuties: CampusDutyAssignment[] = [];

      for (let i = 0; i < selectedTeacherCodes.length; i++) {
        const code = selectedTeacherCodes[i];
        const teacher = staffList.find(s => s.employeeCode === code);
        if (!teacher) continue;

        // Determine location based on list or default
        const loc = dutyLocation;

        const duty: CampusDutyAssignment = {
          id: `duty-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
          dutyType,
          dayOfWeek: dutyDay,
          location: loc,
          timing: dutyTiming,
          teacherEmployeeCode: teacher.employeeCode,
          teacherName: teacher.name,
          teacherDesignation: teacher.designation,
          status: 'Scheduled',
          assignedBy: currentUser?.name ? `${currentUser.name} (Duty In-charge)` : 'Campus Duty Committee',
          assignedAt: new Date().toISOString(),
          notes: dutyNotes.trim() || undefined
        };

        newDuties.push(duty);

        // Inject Task for teacher
        const teacherTaskKey = getTeacherScopedStorageKey('setup:tasks', teacher.employeeCode);
        const existingTasks = (await db.get<TeacherTask[]>(teacherTaskKey)) || [];

        const dutyTask: TeacherTask = {
          id: `task-duty-${Date.now()}-${i}`,
          title: `🛡️ CAMPUS DUTY: ${dutyType} on ${dutyDay} (${dutyTiming})`,
          description: `Location: ${loc}. Notes: ${dutyNotes || 'Supervise student discipline, safety, and punctuality.'}`,
          priority: 'Schedule (Important & Not Urgent)',
          status: 'Pending',
          category: 'Assembly & Duty',
          dueDate: selectedDate,
          dueTime: dutyTiming.split('-')?.[0]?.trim() || '10:30',
          tags: ['Campus Duty', 'Discipline & Safety'],
          subtasks: [],
          assignedBy: currentUser?.name || 'Duty In-charge',
          assignedByRole: 'Incharge',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await db.set(teacherTaskKey, [dutyTask, ...existingTasks]);
      }

      const updated = [...campusDuties, ...newDuties];
      setCampusDuties(updated);
      await db.set('setup:campus_duty_assignments', updated);

      window.dispatchEvent(new CustomEvent('kvs-timetable-updated'));
      window.dispatchEvent(new CustomEvent('kvs-tasks-updated'));

      showNotification(`Assigned ${newDuties.length} teachers to ${dutyType} on ${dutyDay}!`);

      setIsCampusDutyModalOpen(false);
      setSelectedTeacherCodes([]);
      setDutyNotes('');
    } catch (err) {
      console.error('Error saving campus duties:', err);
      showNotification('Failed to save campus duties.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // ACTION: Direct Inline Add Single Teacher to a Day Card
  // --------------------------------------------------------------------------
  const handleInlineAddTeacher = async (day: DayOfWeek, currentType: CampusDutyType, currentTiming: string) => {
    if (!inlineSelectedTeacherCode) return;

    const teacher = staffList.find(s => s.employeeCode === inlineSelectedTeacherCode);
    if (!teacher) return;

    const defaultLocations =
      currentType === 'Morning Gate & Assembly'
        ? MORNING_GATE_LOCATIONS
        : currentType === 'Dispersal & Bus Stand'
        ? AFTERNOON_GATE_LOCATIONS
        : RECESS_LOCATIONS;

    const loc = inlineLocation || defaultLocations[0];

    try {
      const newDuty: CampusDutyAssignment = {
        id: `duty-inline-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        dutyType: currentType,
        dayOfWeek: day,
        location: loc,
        timing: currentTiming,
        teacherEmployeeCode: teacher.employeeCode,
        teacherName: teacher.name,
        teacherDesignation: teacher.designation,
        status: 'Scheduled',
        assignedBy: currentUser?.name ? `${currentUser.name} (In-charge)` : 'Duty In-charge',
        assignedAt: new Date().toISOString()
      };

      const updated = [...campusDuties, newDuty];
      setCampusDuties(updated);
      await db.set('setup:campus_duty_assignments', updated);

      const teacherTaskKey = getTeacherScopedStorageKey('setup:tasks', teacher.employeeCode);
      const existingTasks = (await db.get<TeacherTask[]>(teacherTaskKey)) || [];

      const dutyTask: TeacherTask = {
        id: `task-duty-${Date.now()}`,
        title: `🛡️ CAMPUS DUTY: ${currentType} on ${day} (${currentTiming})`,
        description: `Location: ${loc}. Supervise student discipline and safety.`,
        priority: 'Schedule (Important & Not Urgent)',
        status: 'Pending',
        category: 'Assembly & Duty',
        dueDate: selectedDate,
        dueTime: currentTiming.split('-')?.[0]?.trim() || '10:30',
        tags: ['Campus Duty', 'Discipline & Safety'],
        subtasks: [],
        assignedBy: currentUser?.name || 'Duty In-charge',
        assignedByRole: 'Incharge',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.set(teacherTaskKey, [dutyTask, ...existingTasks]);

      window.dispatchEvent(new CustomEvent('kvs-timetable-updated'));
      window.dispatchEvent(new CustomEvent('kvs-tasks-updated'));

      showNotification(`Added ${teacher.name} to ${day} duty!`);
      setInlineAddDay(null);
      setInlineSelectedTeacherCode('');
      setInlineLocation('');
    } catch (err) {
      console.error('Error adding inline teacher duty:', err);
      showNotification('Failed to add teacher to duty.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // ACTION: Update Spot / Location on Assigned Duty Box
  // --------------------------------------------------------------------------
  const handleUpdateDutyLocation = async (dutyId: string, newLoc: string) => {
    try {
      const updated = campusDuties.map(d => (d.id === dutyId ? { ...d, location: newLoc } : d));
      setCampusDuties(updated);
      await db.set('setup:campus_duty_assignments', updated);

      window.dispatchEvent(new CustomEvent('kvs-timetable-updated'));
      setEditingDutyId(null);
      showNotification('Updated duty spot.');
    } catch (err) {
      console.error('Error updating duty spot:', err);
      showNotification('Failed to update spot.', 'error');
    }
  };

  const handleRemoveCampusDuty = async (dutyId: string, tName: string) => {
    if (!window.confirm(`Remove ${tName} from this scheduled campus duty?`)) return;

    try {
      const updated = campusDuties.filter(d => d.id !== dutyId);
      setCampusDuties(updated);
      await db.set('setup:campus_duty_assignments', updated);

      window.dispatchEvent(new CustomEvent('kvs-timetable-updated'));
      showNotification('Campus duty removed.');
    } catch (err) {
      console.error('Error removing campus duty:', err);
      showNotification('Failed to remove duty.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // Auto-Generate Weekly Balanced Roster with Multiple Teachers Per Slot
  // --------------------------------------------------------------------------
  const handleAutoGenerateWeeklyRoster = async () => {
    if (staffList.length === 0) return;
    if (!window.confirm('Auto-generate a comprehensive Weekly Roster with multiple teachers for Morning Gate, Recess, and Afternoon Dispersal?')) {
      return;
    }

    try {
      const newRoster: CampusDutyAssignment[] = [];
      let staffIdx = 0;

      DAYS_OF_WEEK.forEach(day => {
        // 1. Morning Gate Duty (2 Teachers)
        const mg1 = staffList[staffIdx % staffList.length];
        staffIdx++;
        const mg2 = staffList[staffIdx % staffList.length];
        staffIdx++;

        newRoster.push(
          {
            id: `duty-auto-${day}-mg1`,
            dutyType: 'Morning Gate & Assembly',
            dayOfWeek: day,
            location: MORNING_GATE_LOCATIONS[0],
            timing: '07:15 - 07:45 AM',
            teacherEmployeeCode: mg1.employeeCode,
            teacherName: mg1.name,
            teacherDesignation: mg1.designation,
            status: 'Scheduled',
            assignedBy: 'Timetable Committee Auto-Roster',
            assignedAt: new Date().toISOString()
          },
          {
            id: `duty-auto-${day}-mg2`,
            dutyType: 'Morning Gate & Assembly',
            dayOfWeek: day,
            location: MORNING_GATE_LOCATIONS[1],
            timing: '07:15 - 07:45 AM',
            teacherEmployeeCode: mg2.employeeCode,
            teacherName: mg2.name,
            teacherDesignation: mg2.designation,
            status: 'Scheduled',
            assignedBy: 'Timetable Committee Auto-Roster',
            assignedAt: new Date().toISOString()
          }
        );

        // 2. Recess Break Duty (3 Teachers)
        const rec1 = staffList[staffIdx % staffList.length];
        staffIdx++;
        const rec2 = staffList[staffIdx % staffList.length];
        staffIdx++;
        const rec3 = staffList[staffIdx % staffList.length];
        staffIdx++;

        newRoster.push(
          {
            id: `duty-auto-${day}-rec1`,
            dutyType: 'Recess & Playground',
            dayOfWeek: day,
            location: RECESS_LOCATIONS[0],
            timing: '10:30 - 11:00 AM',
            teacherEmployeeCode: rec1.employeeCode,
            teacherName: rec1.name,
            teacherDesignation: rec1.designation,
            status: 'Scheduled',
            assignedBy: 'Timetable Committee Auto-Roster',
            assignedAt: new Date().toISOString()
          },
          {
            id: `duty-auto-${day}-rec2`,
            dutyType: 'Recess & Playground',
            dayOfWeek: day,
            location: RECESS_LOCATIONS[1],
            timing: '10:30 - 11:00 AM',
            teacherEmployeeCode: rec2.employeeCode,
            teacherName: rec2.name,
            teacherDesignation: rec2.designation,
            status: 'Scheduled',
            assignedBy: 'Timetable Committee Auto-Roster',
            assignedAt: new Date().toISOString()
          },
          {
            id: `duty-auto-${day}-rec3`,
            dutyType: 'Recess & Playground',
            dayOfWeek: day,
            location: RECESS_LOCATIONS[2],
            timing: '10:30 - 11:00 AM',
            teacherEmployeeCode: rec3.employeeCode,
            teacherName: rec3.name,
            teacherDesignation: rec3.designation,
            status: 'Scheduled',
            assignedBy: 'Timetable Committee Auto-Roster',
            assignedAt: new Date().toISOString()
          }
        );

        // 3. Afternoon Gate & Dispersal (2 Teachers)
        const aft1 = staffList[staffIdx % staffList.length];
        staffIdx++;
        const aft2 = staffList[staffIdx % staffList.length];
        staffIdx++;

        newRoster.push(
          {
            id: `duty-auto-${day}-aft1`,
            dutyType: 'Dispersal & Bus Stand',
            dayOfWeek: day,
            location: AFTERNOON_GATE_LOCATIONS[0],
            timing: '01:40 - 02:10 PM',
            teacherEmployeeCode: aft1.employeeCode,
            teacherName: aft1.name,
            teacherDesignation: aft1.designation,
            status: 'Scheduled',
            assignedBy: 'Timetable Committee Auto-Roster',
            assignedAt: new Date().toISOString()
          },
          {
            id: `duty-auto-${day}-aft2`,
            dutyType: 'Dispersal & Bus Stand',
            dayOfWeek: day,
            location: AFTERNOON_GATE_LOCATIONS[1],
            timing: '01:40 - 02:10 PM',
            teacherEmployeeCode: aft2.employeeCode,
            teacherName: aft2.name,
            teacherDesignation: aft2.designation,
            status: 'Scheduled',
            assignedBy: 'Timetable Committee Auto-Roster',
            assignedAt: new Date().toISOString()
          }
        );
      });

      setCampusDuties(newRoster);
      await db.set('setup:campus_duty_assignments', newRoster);

      window.dispatchEvent(new CustomEvent('kvs-timetable-updated'));
      showNotification(`Generated full balanced Weekly Roster (${newRoster.length} duty slots across all 6 days)!`);
    } catch (err) {
      console.error('Error generating auto-roster:', err);
      showNotification('Failed to generate roster.', 'error');
    }
  };

  // Helper to render Day-Wise Roster Grid with Multi-Teacher Box and Inline Controls
  const renderDayWiseRosterGrid = (
    currentType: CampusDutyType,
    currentTiming: string,
    locationOptions: string[],
    themeColor: 'purple' | 'sky' | 'amber'
  ) => {
    const colorClasses = {
      purple: {
        border: 'border-purple-500/40',
        badgeBg: 'bg-purple-950/80',
        badgeText: 'text-purple-300',
        btnBg: 'bg-purple-600 hover:bg-purple-500',
        spotText: 'text-purple-300'
      },
      sky: {
        border: 'border-sky-500/40',
        badgeBg: 'bg-sky-950/80',
        badgeText: 'text-sky-300',
        btnBg: 'bg-sky-600 hover:bg-sky-500',
        spotText: 'text-sky-300'
      },
      amber: {
        border: 'border-amber-500/40',
        badgeBg: 'bg-amber-950/80',
        badgeText: 'text-amber-300',
        btnBg: 'bg-amber-600 hover:bg-amber-500',
        spotText: 'text-amber-300'
      }
    }[themeColor];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS_OF_WEEK.map(day => {
          const dayDuties = campusDuties.filter(
            d =>
              d.dayOfWeek === day &&
              (currentType === 'Morning Gate & Assembly'
                ? d.dutyType === 'Morning Gate & Assembly'
                : currentType === 'Dispersal & Bus Stand'
                ? d.dutyType === 'Dispersal & Bus Stand'
                : d.dutyType === 'Recess & Playground' || d.dutyType === 'Corridor & Water Point')
          );

          const isInlineOpen = inlineAddDay === day;

          return (
            <div
              key={day}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-4 space-y-3 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{day}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 font-bold">
                      {dayDuties.length} {dayDuties.length === 1 ? 'Faculty' : 'Faculties'}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${colorClasses.badgeBg} ${colorClasses.badgeText}`}>
                    {currentTiming}
                  </span>
                </div>

                {/* Multiple Assigned Teachers List */}
                <div className="space-y-2">
                  {dayDuties.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-5 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                      No teachers scheduled. Click below to add.
                    </div>
                  ) : (
                    dayDuties.map(d => {
                      const isEditing = editingDutyId === d.id;

                      return (
                        <div
                          key={d.id}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 space-y-2 text-xs transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="font-bold text-white flex items-center gap-1.5">
                                <UserCheck className={`w-3.5 h-3.5 ${colorClasses.spotText}`} />
                                <span>{d.teacherName}</span>
                              </span>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {d.teacherDesignation || 'Faculty'} &bull; Code: {d.teacherEmployeeCode}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  if (isEditing) {
                                    setEditingDutyId(null);
                                  } else {
                                    setEditingDutyId(d.id);
                                    setEditDutyLocation(d.location);
                                  }
                                }}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Change Duty Spot"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleRemoveCampusDuty(d.id, d.teacherName)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
                                title="Remove Teacher"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Spot Display or Spot Selector */}
                          {isEditing ? (
                            <div className="pt-1.5 border-t border-slate-800 flex items-center gap-1.5">
                              <select
                                value={editDutyLocation}
                                onChange={e => setEditDutyLocation(e.target.value)}
                                className="flex-1 px-2 py-1 text-[11px] bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                              >
                                {locationOptions.map(loc => (
                                  <option key={loc} value={loc}>
                                    {loc}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleUpdateDutyLocation(d.id, editDutyLocation)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900">
                              <span className={`font-medium ${colorClasses.spotText} flex items-center gap-1`}>
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{d.location}</span>
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 shrink-0">Scheduled</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Inline Quick Add Teacher Form */}
                {isInlineOpen && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-2.5 text-xs animate-fadeIn">
                    <div className="flex items-center justify-between font-bold text-white text-[11px]">
                      <span>Add Faculty to {day}:</span>
                      <button
                        onClick={() => setInlineAddDay(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <select
                      value={inlineSelectedTeacherCode}
                      onChange={e => setInlineSelectedTeacherCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
                    >
                      <option value="">-- Choose Teacher --</option>
                      {staffList.map(s => (
                        <option key={s.id || s.employeeCode} value={s.employeeCode}>
                          {s.name} ({s.designation || 'Teacher'} - {s.employeeCode})
                        </option>
                      ))}
                    </select>

                    <select
                      value={inlineLocation || locationOptions[0]}
                      onChange={e => setInlineLocation(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-purple-300 font-bold focus:outline-none"
                    >
                      {locationOptions.map(loc => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setInlineAddDay(null)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!inlineSelectedTeacherCode}
                        onClick={() => handleInlineAddTeacher(day, currentType, currentTiming)}
                        className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-[11px] font-bold shadow-xs cursor-pointer"
                      >
                        + Add to {day}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Add Button on Card */}
              {!isInlineOpen && (
                <button
                  onClick={() => {
                    setInlineAddDay(day);
                    setInlineSelectedTeacherCode('');
                    setInlineLocation(locationOptions[0]);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Teacher to {day}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const morningGateCount = campusDuties.filter(d => d.dutyType === 'Morning Gate & Assembly').length;
  const recessCount = campusDuties.filter(
    d => d.dutyType === 'Recess & Playground' || d.dutyType === 'Corridor & Water Point'
  ).length;
  const afternoonGateCount = campusDuties.filter(d => d.dutyType === 'Dispersal & Bus Stand').length;

  if (loading) {
    return (
      <div className="p-12 text-center text-purple-300 flex flex-col items-center justify-center gap-3">
        <RotateCcw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="text-sm font-medium">Loading Duty & Proxy Substitution Engine...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-fadeIn ${isModal ? 'p-2' : 'pb-16'}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-purple-950 border border-amber-500/30 p-5 rounded-3xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <Clock className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 m-0">
              <span>Timetable, Proxy Period & Campus Duty Desk</span>
              {devMode && <DevModeBadge pages={[2, 4]} title="Daily Duty & Proxy Engine" />}
            </h2>
          </div>
          <p className="text-xs text-amber-200/80 m-0">
            Assign daily proxy substitutions, manage Morning Gate, Recess/Break duty, and Afternoon School-End Dispersal rosters with multiple teachers per slot.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsProxyModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Proxy Period</span>
          </button>

          <button
            onClick={() => {
              if (activeTab === 'morning_gate') {
                setDutyType('Morning Gate & Assembly');
                setDutyTiming('07:15 - 07:45 AM');
                setDutyLocation(MORNING_GATE_LOCATIONS[0]);
              } else if (activeTab === 'afternoon_gate') {
                setDutyType('Dispersal & Bus Stand');
                setDutyTiming('01:40 - 02:10 PM');
                setDutyLocation(AFTERNOON_GATE_LOCATIONS[0]);
              } else {
                setDutyType('Recess & Playground');
                setDutyTiming('10:30 - 11:00 AM');
                setDutyLocation(RECESS_LOCATIONS[0]);
              }
              setSelectedTeacherCodes([]);
              setIsCampusDutyModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Multi-Teacher Duty</span>
          </button>

          <button
            onClick={handleAutoGenerateWeeklyRoster}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
            title="Auto generate 6-day balanced multi-teacher roster"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Auto-Generate Weekly Roster</span>
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-600 border border-rose-500/40 text-rose-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="Close Desk & Return to Dashboard (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Close Desk</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold animate-fadeIn ${
            msg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-300'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1">
          <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
            <span>Today's Substitutions</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-300 font-mono">{filteredProxyAssignments.length}</div>
          <div className="text-[10px] text-amber-300/70">For {selectedDate}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-1">
          <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider flex items-center justify-between">
            <span>Absent Teachers</span>
            <Users className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-300 font-mono">{absentTeachersToday.length}</div>
          <div className="text-[10px] text-rose-300/70">On Leave / Absent</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/30 space-y-1">
          <div className="text-[10px] font-bold text-sky-300 uppercase tracking-wider flex items-center justify-between">
            <span>Morning Gate</span>
            <DoorOpen className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-black text-sky-300 font-mono">{morningGateCount}</div>
          <div className="text-[10px] text-sky-300/70">07:15 - 07:45 AM</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-1">
          <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center justify-between">
            <span>Recess Supervision</span>
            <Coffee className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-300 font-mono">{recessCount}</div>
          <div className="text-[10px] text-purple-300/70">10:30 - 11:00 AM</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
          <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center justify-between">
            <span>Afternoon Gate</span>
            <Bus className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-300 font-mono">{afternoonGateCount}</div>
          <div className="text-[10px] text-emerald-300/70">01:40 - 02:10 PM</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('morning_gate')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'morning_gate'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <DoorOpen className="w-4 h-4 text-sky-300" />
          <span>Morning Gate & Assembly ({morningGateCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('recess_duty')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'recess_duty'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Coffee className="w-4 h-4 text-purple-300" />
          <span>Recess / Break Duty ({recessCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('afternoon_gate')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'afternoon_gate'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Bus className="w-4 h-4 text-emerald-300" />
          <span>Afternoon Gate & Dispersal ({afternoonGateCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('proxy_periods')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'proxy_periods'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-300" />
          <span>Daily Proxy Substitutions ({filteredProxyAssignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('duty_master_matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'duty_master_matrix'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-300" />
          <span>Master Duty Matrix ({campusDuties.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. MORNING GATE & ASSEMBLY SUPERVISION (07:15 - 07:45 AM) */}
      {/* ========================================================================= */}
      {activeTab === 'morning_gate' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white m-0 flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-sky-400" />
                <span>Morning Gate, Punctuality & Assembly Stage Duty (07:15 - 07:45 AM)</span>
              </h3>
              <p className="text-xs text-slate-400 m-0">
                Staff allocated for morning arrival gate supervision, uniform & punctuality check, and assembly sound/stage conduction.
              </p>
            </div>

            <button
              onClick={() => {
                setDutyType('Morning Gate & Assembly');
                setDutyTiming('07:15 - 07:45 AM');
                setDutyLocation(MORNING_GATE_LOCATIONS[0]);
                setSelectedTeacherCodes([]);
                setIsCampusDutyModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-600/30"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Morning Gate Duty</span>
            </button>
          </div>

          {renderDayWiseRosterGrid(
            'Morning Gate & Assembly',
            '07:15 - 07:45 AM',
            MORNING_GATE_LOCATIONS,
            'sky'
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RECESS / BREAK SUPERVISION DUTY (10:30 - 11:00 AM) */}
      {/* ========================================================================= */}
      {activeTab === 'recess_duty' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white m-0 flex items-center gap-2">
                <Coffee className="w-4 h-4 text-purple-400" />
                <span>Recess & Break Campus Supervision Roster (10:30 AM - 11:00 AM)</span>
              </h3>
              <p className="text-xs text-slate-400 m-0">
                Staff allocated for corridor discipline, playground safety, and drinking water point supervision during interval.
              </p>
            </div>

            <button
              onClick={() => {
                setDutyType('Recess & Playground');
                setDutyTiming('10:30 - 11:00 AM');
                setDutyLocation(RECESS_LOCATIONS[0]);
                setSelectedTeacherCodes([]);
                setIsCampusDutyModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/30"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Recess Duty</span>
            </button>
          </div>

          {renderDayWiseRosterGrid(
            'Recess & Playground',
            '10:30 - 11:00 AM',
            RECESS_LOCATIONS,
            'purple'
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. AFTERNOON GATE & DISPERSAL DUTY (01:40 - 02:10 PM) */}
      {/* ========================================================================= */}
      {activeTab === 'afternoon_gate' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white m-0 flex items-center gap-2">
                <Bus className="w-4 h-4 text-emerald-400" />
                <span>Afternoon Gate & Dispersal Duty (01:40 PM - 02:10 PM &bull; School End)</span>
              </h3>
              <p className="text-xs text-slate-400 m-0">
                Staff allocated for student dispersal at school exit, bus boarding safety, traffic regulation, and cycle stand order.
              </p>
            </div>

            <button
              onClick={() => {
                setDutyType('Dispersal & Bus Stand');
                setDutyTiming('01:40 - 02:10 PM');
                setDutyLocation(AFTERNOON_GATE_LOCATIONS[0]);
                setSelectedTeacherCodes([]);
                setIsCampusDutyModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Afternoon Dispersal Duty</span>
            </button>
          </div>

          {renderDayWiseRosterGrid(
            'Dispersal & Bus Stand',
            '01:40 - 02:10 PM',
            AFTERNOON_GATE_LOCATIONS,
            'amber'
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DAILY PROXY SUBSTITUTION ROSTER */}
      {/* ========================================================================= */}
      {activeTab === 'proxy_periods' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Select Substitution Date:</span>
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500 font-bold"
              />
              <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                {selectedDayOfWeek}
              </span>
            </div>

            <button
              onClick={() => handleOpenProxyPlanner(null)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Assign Period Substitution</span>
            </button>
          </div>

          {absentTeachersToday.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Teachers On Leave / Absent for {selectedDate} ({selectedDayOfWeek}) &bull; Click to plan proxy:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {absentTeachersToday.map(t => (
                  <button
                    key={t.employeeCode}
                    type="button"
                    onClick={() => handleOpenProxyPlanner(t)}
                    className="px-3 py-1 rounded-xl bg-rose-950/90 hover:bg-rose-900 border border-rose-500/50 hover:border-rose-400 text-rose-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-105"
                  >
                    <span>{t.name}</span>
                    <span className="text-[10px] text-rose-300/80 font-mono">({t.designation || 'Teacher'})</span>
                    <span className="px-1.5 py-0.2 rounded bg-rose-500/30 text-[9px] text-rose-200 font-mono font-bold uppercase">
                      Plan Proxy
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white m-0">
                  Daily Proxy Substitution Register &bull; {selectedDate} ({selectedDayOfWeek})
                </h3>
              </div>
              <span className="text-xs text-amber-300 font-mono font-bold">
                {filteredProxyAssignments.length} Proxy Slots Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold">
                    <th className="py-3 px-4">Period & Timing</th>
                    <th className="py-3 px-3">Class & Section</th>
                    <th className="py-3 px-3">Absent Teacher</th>
                    <th className="py-3 px-3">Assigned Substitute Teacher</th>
                    <th className="py-3 px-3">Subject / Task</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredProxyAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 space-y-2">
                        <Clock className="w-8 h-8 mx-auto text-slate-600" />
                        <div>No proxy substitutions assigned for this date.</div>
                        <button
                          onClick={() => setIsProxyModalOpen(true)}
                          className="text-amber-400 hover:text-amber-300 font-bold text-xs underline cursor-pointer"
                        >
                          Click here to assign a period substitution
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredProxyAssignments.map(proxy => (
                      <tr key={proxy.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold font-mono">
                            Period {proxy.periodNumber}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">{proxy.timeSlot}</div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-white font-bold">
                            {proxy.className}-{proxy.section}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-rose-300">{proxy.absentTeacherName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Code: {proxy.absentTeacherCode}</div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-emerald-300 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{proxy.substituteTeacherName}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {proxy.substituteDesignation || 'Faculty'} &bull; Free Period
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-200">{proxy.subjectName}</div>
                          {proxy.notes && <div className="text-[10px] text-slate-400 italic">{proxy.notes}</div>}
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                            {proxy.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleRemoveProxy(proxy.id, proxy.substituteTeacherName)}
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 cursor-pointer"
                            title="Cancel Proxy"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MASTER CAMPUS DUTY MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'duty_master_matrix' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white m-0">
                  Comprehensive Campus Duty Roster (All Days & All Slots)
                </h3>
              </div>
              <span className="text-xs text-purple-300 font-mono font-bold">
                {campusDuties.length} Total Duty Assignments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold">
                    <th className="py-3 px-4">Day of Week</th>
                    <th className="py-3 px-3">Duty Slot / Category</th>
                    <th className="py-3 px-3">Spot / Location</th>
                    <th className="py-3 px-3">Timing</th>
                    <th className="py-3 px-3">Assigned Faculty</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {campusDuties.map(d => (
                    <tr key={d.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                      <td className="py-3 px-4 font-bold text-white font-mono">{d.dayOfWeek}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/30 text-purple-300 font-bold text-[10px]">
                          {d.dutyType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-200">{d.location}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{d.timing}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{d.teacherName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Code: {d.teacherEmployeeCode}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleRemoveCampusDuty(d.id, d.teacherName)}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AUTOMATIC PROXY & SUBSTITUTION PLANNER */}
      {/* ========================================================================= */}
      <AutomaticProxyPlannerModal
        isOpen={isProxyModalOpen}
        onClose={() => setIsProxyModalOpen(false)}
        initialStaff={plannerInitialStaff}
        initialDate={selectedDate}
        currentUser={currentUser}
        onProxySaved={loadAllData}
      />

      {/* ========================================================================= */}
      {/* MODAL: SCHEDULE CAMPUS DUTY (WITH MULTI-TEACHER CHECKBOX SELECTION) */}
      {/* ========================================================================= */}
      {isCampusDutyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl relative my-8 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                  Multi-Teacher Scheduling
                </span>
                <h3 className="text-base font-bold text-white m-0">Schedule Campus Duty</h3>
              </div>
              <button
                onClick={() => setIsCampusDutyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMultipleCampusDuties} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Duty Type *</label>
                  <select
                    value={dutyType}
                    onChange={e => {
                      const val = e.target.value as CampusDutyType;
                      setDutyType(val);
                      if (val === 'Morning Gate & Assembly') {
                        setDutyTiming('07:15 - 07:45 AM');
                        setDutyLocation(MORNING_GATE_LOCATIONS[0]);
                      } else if (val === 'Dispersal & Bus Stand') {
                        setDutyTiming('01:40 - 02:10 PM');
                        setDutyLocation(AFTERNOON_GATE_LOCATIONS[0]);
                      } else {
                        setDutyTiming('10:30 - 11:00 AM');
                        setDutyLocation(RECESS_LOCATIONS[0]);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  >
                    <option value="Morning Gate & Assembly">Morning Gate & Assembly (07:15 - 07:45 AM)</option>
                    <option value="Recess & Playground">Recess / Break Duty (10:30 - 11:00 AM)</option>
                    <option value="Dispersal & Bus Stand">Afternoon Gate & Dispersal (01:40 - 02:10 PM)</option>
                    <option value="Corridor & Water Point">Corridor & Water Point (Recess)</option>
                    <option value="Special Event Supervision">Special Event Supervision</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Day of Week *</label>
                  <select
                    value={dutyDay}
                    onChange={e => setDutyDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold font-mono"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Timing Slot *</label>
                  <input
                    type="text"
                    required
                    value={dutyTiming}
                    onChange={e => setDutyTiming(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Default Spot / Location *</label>
                  <select
                    value={dutyLocation}
                    onChange={e => setDutyLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-purple-300 font-bold"
                  >
                    {(dutyType === 'Morning Gate & Assembly'
                      ? MORNING_GATE_LOCATIONS
                      : dutyType === 'Dispersal & Bus Stand'
                      ? AFTERNOON_GATE_LOCATIONS
                      : RECESS_LOCATIONS
                    ).map(loc => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Teacher Selection Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>Select Teachers ({selectedTeacherCodes.length} selected):</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTeacherCodes.length === staffList.length) {
                        setSelectedTeacherCodes([]);
                      } else {
                        setSelectedTeacherCodes(staffList.map(s => s.employeeCode));
                      }
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                  >
                    {selectedTeacherCodes.length === staffList.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-2xl border border-slate-800 divide-y divide-slate-850 space-y-1">
                  {staffList.map(s => {
                    const isSelected = selectedTeacherCodes.includes(s.employeeCode);

                    return (
                      <div
                        key={s.id || s.employeeCode}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTeacherCodes(selectedTeacherCodes.filter(c => c !== s.employeeCode));
                          } else {
                            setSelectedTeacherCodes([...selectedTeacherCodes, s.employeeCode]);
                          }
                        }}
                        className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-950/60 border border-purple-500/40 text-white' : 'hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-bold text-xs">{s.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({s.designation || 'Teacher'})</span>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {s.employeeCode}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Duty Instructions / Notes:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ensure no student leaves without parent/van pass..."
                  value={dutyNotes}
                  onChange={e => setDutyNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCampusDutyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={selectedTeacherCodes.length === 0}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Assign {selectedTeacherCodes.length} Teachers</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
