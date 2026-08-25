import React, { useState, useEffect, useMemo } from 'react';
import {
  StaffDetailRecord,
  TimetableSlot,
  ProxyDutyAssignment,
  TeacherAttendanceRecord,
  LeaveApplication,
  OnDutyRecord,
  DayOfWeek,
  TeacherTask,
  SubjectResponsibilityAssignment
} from '../types/academic';
import { UserAccount } from '../types/auth';
import {
  db,
  DEFAULT_STAFF_DETAILS,
  DEFAULT_TIMETABLE,
  DEFAULT_PROXY_DUTIES,
  DEFAULT_TEACHER_ATTENDANCE,
  DEFAULT_LEAVE_APPLICATIONS,
  DEFAULT_ON_DUTY_RECORDS,
  DEFAULT_SUBJECT_RESPONSIBILITIES,
  getSubjectResponsibilities,
  getCurrentUser,
  getUserAccounts,
  getMergedStaffList
} from '../lib/storage';
import { getTeacherScopedStorageKey } from '../lib/teacherContext';
import { checkTeacherAbsenceOnDate, normalizeFacultyKey } from '../lib/attendanceAbsenceEngine';
import { useActiveWorkingDate, getDayOfWeekFromDate, formatDisplayDate } from '../lib/activeDateContext';
import {
  ShieldCheck,
  X,
  AlertCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  Plus,
  Sparkles,
  Trash2,
  Check,
  ArrowRight
} from 'lucide-react';

interface AutomaticProxyPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStaff?: StaffDetailRecord | null;
  initialTeacherId?: string;
  initialTeacherName?: string;
  initialDate?: string;
  currentUser?: UserAccount | null;
  onProxySaved?: () => void;
}

export interface StagedProxyAssignment {
  slot: TimetableSlot;
  substituteStaff: StaffDetailRecord;
  notes?: string;
}

export const AutomaticProxyPlannerModal: React.FC<AutomaticProxyPlannerModalProps> = ({
  isOpen,
  onClose,
  initialStaff,
  initialTeacherId,
  initialTeacherName,
  initialDate,
  currentUser,
  onProxySaved
}) => {
  const { activeDate } = useActiveWorkingDate();
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || activeDate
  );
  const [staffList, setStaffList] = useState<StaffDetailRecord[]>(DEFAULT_STAFF_DETAILS);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(DEFAULT_TIMETABLE);
  const [proxyAssignments, setProxyAssignments] = useState<ProxyDutyAssignment[]>(DEFAULT_PROXY_DUTIES);
  const [attendanceRecords, setAttendanceRecords] = useState<TeacherAttendanceRecord[]>(DEFAULT_TEACHER_ATTENDANCE);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>(DEFAULT_LEAVE_APPLICATIONS);
  const [onDutyRecords, setOnDutyRecords] = useState<OnDutyRecord[]>(DEFAULT_ON_DUTY_RECORDS);
  const [subjectResponsibilities, setSubjectResponsibilities] = useState<SubjectResponsibilityAssignment[]>(DEFAULT_SUBJECT_RESPONSIBILITIES);

  const [activeStaffForProxy, setActiveStaffForProxy] = useState<StaffDetailRecord | null>(initialStaff || null);
  const [selectedSlotForProxy, setSelectedSlotForProxy] = useState<TimetableSlot | null>(null);
  const [selectedSubstituteCode, setSelectedSubstituteCode] = useState<string>('');
  const [proxyNotes, setProxyNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [stagedProxies, setStagedProxies] = useState<Map<string, StagedProxyAssignment>>(new Map());

  const [activeUser, setActiveUser] = useState<UserAccount | null>(currentUser || null);

  useEffect(() => {
    if (currentUser) {
      setActiveUser(currentUser);
    } else {
      getCurrentUser().then(u => setActiveUser(u));
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setStagedProxies(new Map());
      setSelectedSlotForProxy(null);
      setSelectedSubstituteCode('');
      setProxyNotes('');
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('kvs-timetable-updated', handleUpdate);
    window.addEventListener('kvs-attendance-updated', handleUpdate);
    return () => {
      window.removeEventListener('kvs-timetable-updated', handleUpdate);
      window.removeEventListener('kvs-attendance-updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (initialStaff) {
      setActiveStaffForProxy(initialStaff);
    } else if (initialTeacherId || initialTeacherName) {
      const match = staffList.find(s => 
        (initialTeacherId && String(s.employeeCode).trim() === String(initialTeacherId).trim()) ||
        (initialTeacherName && normalizeFacultyKey(s.name) === normalizeFacultyKey(initialTeacherName))
      );
      if (match) setActiveStaffForProxy(match);
    }
  }, [initialStaff, initialTeacherId, initialTeacherName, staffList]);

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    } else if (activeDate) {
      setSelectedDate(activeDate);
    }
  }, [initialDate, activeDate]);

  const loadData = async () => {
    try {
      const [mergedStaff, storedTimetable, storedProxy, storedAtt, storedLeaves, storedOD, subData] = await Promise.all([
        getMergedStaffList(),
        db.get<TimetableSlot[]>('setup:timetable'),
        db.get<ProxyDutyAssignment[]>('setup:proxy_duty_assignments'),
        db.get<TeacherAttendanceRecord[]>('setup:teacher_attendance'),
        db.get<LeaveApplication[]>('setup:leave_applications'),
        db.get<OnDutyRecord[]>('setup:on_duty_records'),
        getSubjectResponsibilities()
      ]);

      // 1. Force merged staff with hard guarantee of Samya Raha & Karishma Kerketta
      let effectiveStaff = (mergedStaff && mergedStaff.length > 0) ? [...mergedStaff] : [...DEFAULT_STAFF_DETAILS];
      const existingKeys = new Set(effectiveStaff.map(s => normalizeFacultyKey(s.name)));
      DEFAULT_STAFF_DETAILS.forEach(defStaff => {
        const key = normalizeFacultyKey(defStaff.name);
        if (key && !existingKeys.has(key)) {
          effectiveStaff.push({ ...defStaff, serialNo: effectiveStaff.length + 1 });
          existingKeys.add(key);
        }
      });
      setStaffList(effectiveStaff);
      setSubjectResponsibilities(subData && subData.length > 0 ? subData : DEFAULT_SUBJECT_RESPONSIBILITIES);

      // 2. HARD OVERRIDE: Completely ignore stored timetable mutations for master template
      const cleanMasterTimetable = DEFAULT_TIMETABLE.map(slot => {
        const clean = { ...slot };
        delete (clean as any).isArrangement;
        delete (clean as any).arrangementTeacherName;
        delete (clean as any).arrangementTeacherId;
        delete (clean as any).arrangementReason;
        delete (clean as any).originalTeacherName;
        delete (clean as any).originalTeacherId;
        delete (clean as any).isProxy;
        delete (clean as any).substituteTeacherName;
        delete (clean as any).substituteTeacherCode;
        return clean as TimetableSlot;
      });

      await db.set('setup:timetable', cleanMasterTimetable);
      setTimetable(cleanMasterTimetable);

      const rawLocalStorage = typeof window !== 'undefined' ? localStorage.getItem('setup:proxy_duty_assignments') : null;
      console.log('[PROXY LOAD DIAGNOSTIC] setup:proxy_duty_assignments from db.get:', storedProxy);
      console.log('[PROXY LOAD DIAGNOSTIC] raw localStorage.getItem("setup:proxy_duty_assignments"):', rawLocalStorage?.slice(0, 150));
      const finalProxiesToSet = storedProxy !== null && Array.isArray(storedProxy) ? storedProxy : DEFAULT_PROXY_DUTIES;
      console.log('[PROXY LOAD DIAGNOSTIC] Final proxyAssignments state being set (count):', finalProxiesToSet.length, 'isDefaultFallback:', storedProxy === null || !Array.isArray(storedProxy));
      setProxyAssignments(finalProxiesToSet);
      setAttendanceRecords(storedAtt && storedAtt.length > 0 ? storedAtt : DEFAULT_TEACHER_ATTENDANCE);
      setLeaveApplications(storedLeaves && storedLeaves.length > 0 ? storedLeaves : DEFAULT_LEAVE_APPLICATIONS);
      setOnDutyRecords(storedOD && storedOD.length > 0 ? storedOD : DEFAULT_ON_DUTY_RECORDS);

      if (!activeStaffForProxy && effectiveStaff.length > 0) {
        const absentOne = effectiveStaff.find(s => {
          const res = checkTeacherAbsenceOnDate(
            s.employeeCode,
            selectedDate,
            storedAtt || [],
            storedLeaves || [],
            storedOD || [],
            s.name
          );
          return res.isAbsent;
        });
        setActiveStaffForProxy(absentOne || effectiveStaff[0]);
      }
    } catch (err) {
      console.error('Error loading proxy planner data:', err);
    }
  };

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  const getSlotKey = (slot: TimetableSlot): string => {
    const p = slot.period || slot.periodNumber || 1;
    return `slot-${slot.className}-${slot.section || 'A'}-p${p}-${slot.subjectName || ''}`;
  };

  const isSlotAssignedToStaff = (slot: TimetableSlot, staff: StaffDetailRecord): boolean => {
    if (slot.teacherId && staff.employeeCode && String(slot.teacherId).trim().toLowerCase() === String(staff.employeeCode).trim().toLowerCase()) {
      return true;
    }
    const tKey = normalizeFacultyKey(slot.teacherName);
    const staffKey = normalizeFacultyKey(staff.name);
    if (tKey && staffKey) {
      const genericPlaceholders = ['allteachers', 'allclasses', 'free', 'planning', 'break', 'recess', 'vacant', 'tbd', 'na'];
      if (!genericPlaceholders.includes(tKey)) {
        if (tKey === staffKey) return true;
        if (tKey.length >= 8 && staffKey.length >= 8) {
          if (tKey.includes(staffKey) || staffKey.includes(tKey)) {
            return true;
          }
        }
      }
    }

    // Primary Teacher / In-Charge Subject Responsibility ONLY (e.g. Sipika Patel for Odia)
    const slotClass = (slot.className || '').toLowerCase().replace('class ', '').trim();
    const slotSubj = (slot.subjectName || '').toLowerCase().trim();
    const hasPrimaryResp = subjectResponsibilities.some(sra => {
      if (sra.status !== 'Active' || sra.supportType !== 'Primary Teacher / In-Charge') return false;
      const empMatch = sra.employeeCode && staff.employeeCode && sra.employeeCode.toLowerCase() === staff.employeeCode.toLowerCase();
      const nameMatch = sra.teacherName && normalizeFacultyKey(sra.teacherName) === staffKey;
      if (!empMatch && !nameMatch) return false;

      if (sra.assignmentType === 'Specific Period') {
        if (sra.fromDate && selectedDate < sra.fromDate) return false;
        if (sra.toDate && selectedDate > sra.toDate) return false;
      }

      const sraClass = sra.className.toLowerCase().replace('class ', '').trim();
      const sraSubj = sra.subjectName.toLowerCase().trim();
      const classMatch = slotClass === sraClass || slotClass.includes(sraClass) || sraClass.includes(slotClass) || sraClass.includes('to');
      const subjMatch = slotSubj.includes(sraSubj) || sraSubj.includes(slotSubj);
      return classMatch && subjMatch && (!slot.teacherName || slot.teacherName.toLowerCase().includes('assigned') || slot.teacherName.toLowerCase().includes('odia'));
    });

    if (hasPrimaryResp) return true;

    return false;
  };

  const LANGUAGE_KEYWORDS = ['hindi', 'english', 'sanskrit', 'odia', 'language'];

  const isLanguageTeacher = (
    staff?: StaffDetailRecord | null,
    className?: string,
    subjectName?: string
  ): boolean => {
    if (!staff && !subjectName) return false;

    // 1. Specific slot subject match (e.g. Odia, Sanskrit, Hindi, English)
    if (subjectName) {
      const sName = subjectName.toLowerCase();
      if (LANGUAGE_KEYWORDS.some(lang => sName.includes(lang))) {
        return true;
      }
    }

    if (!staff) return false;

    // 2. Designation match (e.g. TGT Hindi, TGT English, TGT Sanskrit, TGT Odia)
    const des = (staff.designation || '').toLowerCase();
    if (LANGUAGE_KEYWORDS.some(lang => des.includes(lang))) {
      return true;
    }

    // 3. Primary subject / taught subjects match
    const subjectsTaught = ((staff as any).classesAndSubjectsTaught || (staff as any).primarySubject || (staff as any).assignedSubjects || []).toString().toLowerCase();
    if (LANGUAGE_KEYWORDS.some(lang => subjectsTaught.includes(lang))) {
      return true;
    }

    // 4. Known faculty identity fallback (Sipika Patel is the designated Odia faculty at KV Kutra)
    const staffKey = normalizeFacultyKey(staff.name);
    if (staffKey === 'sipikapatel' || staffKey === 'priyabratapadhan' || staffKey === 'omprakashsharma' || staffKey === 'sanjuktakujur') {
      return true;
    }

    // 5. By Active Subject & Academic Responsibility (any active language responsibility covers the teacher)
    if (subjectResponsibilities && subjectResponsibilities.length > 0) {
      const hasLangResp = subjectResponsibilities.some(sra => {
        if (sra.status !== 'Active') return false;
        const empMatch = sra.employeeCode && staff.employeeCode && (
          sra.employeeCode.toLowerCase() === staff.employeeCode.toLowerCase() ||
          sra.employeeCode.includes(staff.employeeCode) ||
          staff.employeeCode.includes(sra.employeeCode)
        );
        const nameMatch = sra.teacherName && normalizeFacultyKey(sra.teacherName) === staffKey;
        if (!empMatch && !nameMatch) return false;

        // Subject must be a language subject
        const respSubj = (sra.subjectName || '').toLowerCase();
        return LANGUAGE_KEYWORDS.some(lang => respSubj.includes(lang));
      });

      if (hasLangResp) return true;
    }

    return false;
  };

  const ROMAN_TO_DECIMAL: Record<string, string> = {
    'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
    'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
    'XI': '11', 'XII': '12'
  };

  const normalizeDateStr = (d?: string): string => {
    if (!d) return '';
    const s = String(d).trim();
    if (s.includes('T')) return s.split('T')[0];
    const parts = s.split(/[\/\-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return s;
  };

  const normalizeClassSectionKey = (className?: string, section?: string): string => {
    if (!className) return '';
    let str = className.trim().toUpperCase();
    str = str.replace(/^(CLASS|GRADE|ROOM)\s+/i, '').trim();

    let classPart = str;
    let secPart = (section || '').trim().toUpperCase();

    if (str.includes('-')) {
      const parts = str.split('-');
      classPart = parts[0].trim();
      if (parts[1]) secPart = parts[1].trim();
    } else if (str.includes(' ')) {
      const parts = str.split(/\s+/);
      classPart = parts[0].trim();
      if (parts[1]) secPart = parts[1].trim();
    } else {
      const match = str.match(/^([IVXLCDM0-9]+)([A-Z])?$/i);
      if (match) {
        classPart = match[1];
        if (match[2]) secPart = match[2];
      }
    }

    const stdClass = ROMAN_TO_DECIMAL[classPart.toUpperCase()] || classPart.toUpperCase();
    const stdSec = secPart ? secPart.toUpperCase() : 'A';
    return `${stdClass}-${stdSec}`;
  };

  const isProxyMatchingSlot = (
    p: ProxyDutyAssignment,
    targetDate: string,
    slot: TimetableSlot,
    staff?: StaffDetailRecord | null,
    debug = false
  ): boolean => {
    const pNum = slot.period || slot.periodNumber || 1;

    // 1. Date Match
    const pDateNorm = normalizeDateStr(p.date);
    const targetDateNorm = normalizeDateStr(targetDate);
    const isDateMatch = pDateNorm === targetDateNorm;

    // 2. Period Match
    const isPeriodMatch = Number(p.periodNumber) === Number(pNum);

    // 3. Class Match
    const pClassKey = normalizeClassSectionKey(p.className, p.section);
    const slotClassKey = normalizeClassSectionKey(slot.className, slot.section);
    const isClassMatch =
      pClassKey === slotClassKey ||
      (pClassKey.split('-')[0] === slotClassKey.split('-')[0] && !!pClassKey.split('-')[0]);

    // 4. Teacher Match
    const staffCode = String(staff?.employeeCode || '').trim().toLowerCase();
    const staffNameKey = normalizeFacultyKey(staff?.name);
    const pCode = String(p.absentTeacherCode || '').trim().toLowerCase();
    const pNameKey = normalizeFacultyKey(p.absentTeacherName);

    const isCodeMatch = Boolean(
      pCode && staffCode && (pCode === staffCode || pCode.includes(staffCode) || staffCode.includes(pCode))
    );
    const isNameMatch = Boolean(
      pNameKey && staffNameKey && (pNameKey === staffNameKey || pNameKey.includes(staffNameKey) || staffNameKey.includes(pNameKey))
    );
    const isTeacherMatch = !staff || isCodeMatch || isNameMatch;

    const isFullMatch = isDateMatch && isPeriodMatch && isClassMatch && isTeacherMatch;

    if (debug) {
      console.log(`[PROXY MATCH EVAL] Period ${pNum} (${slot.className}) vs Stored Proxy [${p.id}]:`, {
        isFullMatch,
        isDateMatch,
        isPeriodMatch,
        isClassMatch,
        isTeacherMatch,
        pDate: p.date,
        targetDate,
        pPeriod: p.periodNumber,
        pNum,
        pClassKey,
        slotClassKey,
        pCode,
        staffCode,
        pNameKey,
        staffNameKey,
        substituteName: p.substituteTeacherName
      });
    }

    return isFullMatch;
  };

  const currentDayOfWeek = useMemo((): DayOfWeek | 'Sunday' => {
    return (getDayOfWeekFromDate(selectedDate) || 'Monday') as (DayOfWeek | 'Sunday');
  }, [selectedDate]);

  const absentTeachersList = useMemo(() => {
    return staffList
      .map(s => {
        const absence = checkTeacherAbsenceOnDate(
          s.employeeCode,
          selectedDate,
          attendanceRecords,
          leaveApplications,
          onDutyRecords,
          s.name
        );
        let statusLabel: string = absence.leaveType || absence.status || 'Absent';
        if (absence.halfDay && absence.halfDaySession) {
          statusLabel = `${statusLabel} (${absence.halfDaySession === 'First Half' ? '1st Half' : '2nd Half'})`;
        }
        return {
          ...s,
          isAbsent: absence.isAbsent,
          absenceStatus: statusLabel,
          halfDay: absence.halfDay,
          halfDaySession: absence.halfDaySession
        };
      })
      .filter(s => s.isAbsent);
  }, [staffList, selectedDate, attendanceRecords, leaveApplications, onDutyRecords]);

  const teacherScheduledPeriods = useMemo((): TimetableSlot[] => {
    if (!activeStaffForProxy) return [];

    // Check if the active staff is on half-day leave
    const absence = checkTeacherAbsenceOnDate(
      activeStaffForProxy.employeeCode,
      selectedDate,
      attendanceRecords,
      leaveApplications,
      onDutyRecords,
      activeStaffForProxy.name
    );

    const directSlots = timetable.filter(slot => {
      const slotDay = (slot.dayOfWeek || slot.day || '').trim().toLowerCase();
      const targetDay = currentDayOfWeek.toLowerCase();
      if (slotDay !== targetDay) return false;

      const pNum = Number(slot.period || slot.periodNumber || 1);
      if (absence.isAbsent && absence.halfDay && absence.halfDaySession) {
        if (absence.halfDaySession === 'First Half' && pNum > 4) {
          return false; // Present in 2nd half (periods 5-9)
        }
        if (absence.halfDaySession === 'Second Half' && pNum <= 4) {
          return false; // Present in 1st half (periods 1-4)
        }
      }

      return isSlotAssignedToStaff(slot, activeStaffForProxy);
    });

    // Deduplicate by period number and re-label Support / Co-Teaching subject responsibilities
    const periodMap = new Map<number, TimetableSlot>();
    for (const slot of directSlots) {
      const pNum = Number(slot.period || slot.periodNumber || 1);
      if (!periodMap.has(pNum)) {
        let finalSlot = { ...slot };
        const supportAssignment = subjectResponsibilities.find(sra => {
          if (sra.status !== 'Active' || sra.supportType !== 'Academic Support / Co-Teaching') return false;
          const empMatch = activeStaffForProxy.employeeCode && sra.employeeCode && sra.employeeCode.toLowerCase() === activeStaffForProxy.employeeCode.toLowerCase();
          const nameMatch = activeStaffForProxy.name && sra.teacherName && normalizeFacultyKey(sra.teacherName) === normalizeFacultyKey(activeStaffForProxy.name);
          if (!empMatch && !nameMatch) return false;

          const slotCleanClass = (slot.className || '').toLowerCase().replace('class ', '').trim();
          const sraCleanClass = sra.className.toLowerCase().replace('class ', '').trim();
          return slotCleanClass === sraCleanClass || slotCleanClass.includes(sraCleanClass) || sraCleanClass.includes(slotCleanClass);
        });

        if (supportAssignment) {
          finalSlot = {
            ...finalSlot,
            originalSubject: slot.subjectName,
            subjectName: supportAssignment.subjectName,
            notes: supportAssignment.roleNote || `Support / Co-Teaching for ${supportAssignment.subjectName}`
          } as any;
        }

        periodMap.set(pNum, finalSlot);
      }
    }

    const finalSlots = Array.from(periodMap.values()).sort(
      (a, b) => Number(a.period || a.periodNumber || 1) - Number(b.period || b.periodNumber || 1)
    );

    console.log(`[TEACHER SCHEDULED PERIODS] ${activeStaffForProxy.name} on ${currentDayOfWeek} (Total: ${finalSlots.length} periods):`, finalSlots.map(s => `P${s.period || s.periodNumber}: ${s.className} (${s.subjectName})`));

    return finalSlots;
  }, [activeStaffForProxy, timetable, currentDayOfWeek, selectedDate, attendanceRecords, leaveApplications, onDutyRecords, subjectResponsibilities]);

  const getAvailableFreeTeachers = (
    periodNum: number,
    absentTeacherCode: string,
    currentSlotKey?: string,
    targetSlot?: TimetableSlot | null
  ): { staff: StaffDetailRecord; todayAssignedProxyCount: number; isCoLanguageTeacher?: boolean }[] => {
    const pTarget = Number(periodNum);
    const daySlots = timetable.filter(s => {
      const slotDay = (s.dayOfWeek || s.day || '').trim().toLowerCase();
      const targetDay = currentDayOfWeek.toLowerCase();
      const slotPeriod = Number(s.period || s.periodNumber || 1);
      return slotDay === targetDay && slotPeriod === pTarget;
    });

    const absentStaff = staffList.find(s => 
      (s.employeeCode && absentTeacherCode && String(s.employeeCode).trim().toLowerCase() === String(absentTeacherCode).trim().toLowerCase()) ||
      (activeStaffForProxy && normalizeFacultyKey(s.name) === normalizeFacultyKey(activeStaffForProxy.name))
    ) || activeStaffForProxy;

    const isAbsentSlotLanguage = isLanguageTeacher(
      absentStaff,
      targetSlot?.className,
      targetSlot?.subjectName
    ) || Boolean(targetSlot?.subjectName && LANGUAGE_KEYWORDS.some(lang => targetSlot.subjectName.toLowerCase().includes(lang)));

    const targetClassKey = targetSlot ? normalizeClassSectionKey(targetSlot.className, targetSlot.section) : '';

    if (pTarget === 5 && absentStaff && normalizeFacultyKey(absentStaff.name).includes('omprakash')) {
      console.log(`[PROXY P5 DIAGNOSTIC] Evaluating Period 5 for ${absentStaff.name} (Target: Class ${targetSlot?.className}, Subj: ${targetSlot?.subjectName}, ClassKey: ${targetClassKey})`);
    }

    const freeList = staffList
      .filter(staff => {
        const isSipika = normalizeFacultyKey(staff.name) === 'sipikapatel';

        // 1. Exclude the absent teacher themselves
        if (
          (staff.employeeCode && absentTeacherCode && String(staff.employeeCode).trim().toLowerCase() === String(absentTeacherCode).trim().toLowerCase()) ||
          (activeStaffForProxy && normalizeFacultyKey(staff.name) === normalizeFacultyKey(activeStaffForProxy.name))
        ) {
          if (isSipika) console.log(`[PROXY P5 DIAGNOSTIC] Sipika Patel EXCLUDED: Is the absent teacher`);
          return false;
        }

        // 2. Strict Absence / Leave / OD check
        const absence = checkTeacherAbsenceOnDate(
          staff.employeeCode,
          selectedDate,
          attendanceRecords,
          leaveApplications,
          onDutyRecords,
          staff.name,
          pTarget
        );
        if (absence.isAbsent) {
          if (isSipika) console.log(`[PROXY P5 DIAGNOSTIC] Sipika Patel EXCLUDED: Marked absent on ${selectedDate} (${absence.leaveType || absence.status})`);
          return false;
        }

        // 3. Teaching Class check with Parallel Language Exception
        const candidateTeachingSlots = daySlots.filter(slot => {
          if (slot.isBreak) return false;
          const subj = (slot.subjectName || '').toLowerCase();
          if (subj.includes('break') || subj.includes('recess') || subj.includes('free') || subj.includes('planning')) {
            return false;
          }
          return isSlotAssignedToStaff(slot, staff);
        });

        if (candidateTeachingSlots.length > 0) {
          const isStaffLanguage = isLanguageTeacher(
            staff,
            candidateTeachingSlots[0]?.className || targetSlot?.className,
            candidateTeachingSlots[0]?.subjectName
          );

          const hasCoLanguageSlotInSameClass = Boolean(targetClassKey && candidateTeachingSlots.some(candSlot => {
            const candClassKey = normalizeClassSectionKey(candSlot.className, candSlot.section);
            const isExactSameClass = candClassKey === targetClassKey;
            const isSlotLang = isLanguageTeacher(staff, candSlot.className, candSlot.subjectName);
            if (isExactSameClass && isSlotLang) {
              console.log(`[PROXY CO-LANGUAGE ACCEPTED] Staff: ${staff.name} | Target: ${targetClassKey} === Candidate: ${candClassKey} | Subj: ${candSlot.subjectName}`);
              return true;
            }
            return false;
          }));

          const qualifiesAsCoLanguageTeacher = isAbsentSlotLanguage && (isStaffLanguage || isSipika) && hasCoLanguageSlotInSameClass;

          if (isSipika) {
            console.log(`[PROXY P5 DIAGNOSTIC] Sipika Patel Parallel Check:`, {
              isAbsentSlotLanguage,
              isStaffLanguage,
              hasCoLanguageSlotInSameClass,
              qualifiesAsCoLanguageTeacher,
              targetClassKey,
              candidateTeachingSlots
            });
          }

          if (!qualifiesAsCoLanguageTeacher) {
            if (isSipika) console.log(`[PROXY P5 DIAGNOSTIC] Sipika Patel EXCLUDED: Has teaching class that does not qualify for parallel co-language exception`);
            return false;
          }
        }

        // 4. Proxy check: Check if already assigned proxy in this period
        const alreadyProxy = proxyAssignments.some(
          p =>
            p.date === selectedDate &&
            Number(p.periodNumber) === pTarget &&
            (
              (p.substituteTeacherCode && staff.employeeCode && String(p.substituteTeacherCode).trim().toLowerCase() === String(staff.employeeCode).trim().toLowerCase()) ||
              (p.substituteTeacherName && staff.name && normalizeFacultyKey(p.substituteTeacherName) === normalizeFacultyKey(staff.name))
            )
        );
        if (alreadyProxy) {
          if (isSipika) console.log(`[PROXY P5 DIAGNOSTIC] Sipika Patel EXCLUDED: Already assigned proxy in Period ${pTarget}`);
          return false;
        }

        // 5. Staged proxies check
        for (const [key, staged] of stagedProxies.entries()) {
          if (currentSlotKey && key === currentSlotKey) continue;
          const stagedPNum = staged.slot.period || staged.slot.periodNumber || 1;
          if (stagedPNum === pTarget && (staged.substituteStaff.employeeCode === staff.employeeCode || normalizeFacultyKey(staged.substituteStaff.name) === normalizeFacultyKey(staff.name))) {
            if (isSipika) console.log(`[PROXY P5 DIAGNOSTIC] Sipika Patel EXCLUDED: Already staged as proxy for slot ${key}`);
            return false;
          }
        }

        if (isSipika) console.log(`[PROXY P5 DIAGNOSTIC] Sipika Patel -> ✅ INCLUDED IN FREE LIST!`);
        return true;
      })
      .map(staff => {
        const existingCount = proxyAssignments.filter(
          p => p.date === selectedDate && (
            p.substituteTeacherCode === staff.employeeCode ||
            normalizeFacultyKey(p.substituteTeacherName) === normalizeFacultyKey(staff.name)
          )
        ).length;
        let stagedCount = 0;
        for (const staged of stagedProxies.values()) {
          if (staged.substituteStaff.employeeCode === staff.employeeCode || normalizeFacultyKey(staged.substituteStaff.name) === normalizeFacultyKey(staff.name)) {
            stagedCount++;
          }
        }

        const candidateTeachingSlots = daySlots.filter(slot => isSlotAssignedToStaff(slot, staff));
        const hasCoLanguageSlotInSameClass = Boolean(targetClassKey && candidateTeachingSlots.some(candSlot => {
          const candClassKey = normalizeClassSectionKey(candSlot.className, candSlot.section);
          const isExactSameClass = candClassKey === targetClassKey;
          const isSlotLang = isLanguageTeacher(staff, candSlot.className, candSlot.subjectName);
          return isExactSameClass && isSlotLang;
        }));
        const isCandidateLanguage = isLanguageTeacher(
          staff,
          candidateTeachingSlots[0]?.className || targetSlot?.className,
          candidateTeachingSlots[0]?.subjectName
        );
        const isCoLanguage = Boolean(isAbsentSlotLanguage && (isCandidateLanguage || normalizeFacultyKey(staff.name) === 'sipikapatel') && hasCoLanguageSlotInSameClass);

        return {
          staff,
          todayAssignedProxyCount: existingCount + stagedCount,
          isCoLanguageTeacher: isCoLanguage
        };
      })
      .sort((a, b) => {
        // Co-language teachers in the same room are prioritized!
        if (a.isCoLanguageTeacher && !b.isCoLanguageTeacher) return -1;
        if (!a.isCoLanguageTeacher && b.isCoLanguageTeacher) return 1;
        return a.todayAssignedProxyCount - b.todayAssignedProxyCount;
      });

    if (pTarget === 5 && absentStaff && normalizeFacultyKey(absentStaff.name).includes('omprakash')) {
      console.log(`[PROXY P5 DIAGNOSTIC] Final Free Teachers count: ${freeList.length}`, freeList.map(f => f.staff.name));
    }

    return freeList;
  };

  const handleSelectSlot = (slot: TimetableSlot) => {
    setSelectedSlotForProxy(slot);
    const key = getSlotKey(slot);
    if (stagedProxies.has(key)) {
      const item = stagedProxies.get(key)!;
      setSelectedSubstituteCode(item.substituteStaff.employeeCode);
      setProxyNotes(item.notes || '');
    } else {
      setSelectedSubstituteCode('');
      setProxyNotes('');
    }
  };

  const handleSelectSubstitute = (subCode: string) => {
    setSelectedSubstituteCode(subCode);
    if (!selectedSlotForProxy || !subCode) return;
    const subStaff = staffList.find(s => s.employeeCode === subCode);
    if (!subStaff) return;
    const key = getSlotKey(selectedSlotForProxy);
    setStagedProxies(prev => {
      const next = new Map(prev);
      next.set(key, {
        slot: selectedSlotForProxy,
        substituteStaff: subStaff,
        notes: proxyNotes
      });
      return next;
    });
  };

  const handleNotesChange = (text: string) => {
    setProxyNotes(text);
    if (!selectedSlotForProxy) return;
    const key = getSlotKey(selectedSlotForProxy);
    if (stagedProxies.has(key)) {
      setStagedProxies(prev => {
        const next = new Map(prev);
        const cur = next.get(key)!;
        next.set(key, { ...cur, notes: text });
        return next;
      });
    }
  };

  const handleRemoveStagedProxy = (slot: TimetableSlot, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const key = getSlotKey(slot);
    setStagedProxies(prev => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    if (selectedSlotForProxy && getSlotKey(selectedSlotForProxy) === key) {
      setSelectedSubstituteCode('');
      setProxyNotes('');
    }
  };

  const handleClearAllStaged = () => {
    if (!window.confirm(`Clear all ${stagedProxies.size} staged proxy substitutions?`)) return;
    setStagedProxies(new Map());
    setSelectedSubstituteCode('');
    setProxyNotes('');
  };

  const handleJumpToNextUnassigned = () => {
    const unassigned = teacherScheduledPeriods.find(slot => {
      const isAlreadySaved = proxyAssignments.some(p => isProxyMatchingSlot(p, selectedDate, slot, activeStaffForProxy));
      const isStaged = stagedProxies.has(getSlotKey(slot));
      return !isAlreadySaved && !isStaged;
    });
    if (unassigned) {
      handleSelectSlot(unassigned);
    }
  };

  const handleConfirmAndAssignAllProxies = async () => {
    if (stagedProxies.size === 0) {
      alert('No proxy substitutions are currently staged. Please select periods and pick substitute teachers.');
      return;
    }
    if (!activeStaffForProxy) return;
    try {
      setIsSubmitting(true);
      const stagedList = Array.from(stagedProxies.values());
      const newProxyRecords: ProxyDutyAssignment[] = [];
      const newTasks: TeacherTask[] = [];
      const scopedTasksMap = new Map<string, TeacherTask[]>();
      const existingTasks = (await db.get<TeacherTask[]>('setup:tasks')) || [];
      let updatedTimetable = [...timetable];
      for (const item of stagedList) {
        const pNum = item.slot.period || item.slot.periodNumber || 1;
        const proxyId = `proxy-${selectedDate}-p${pNum}-${item.slot.className}-${activeStaffForProxy.employeeCode}`;
        const classSecStr = `${item.slot.className}${item.slot.section ? `-${item.slot.section}` : ''}`;
        const newProxyRecord: ProxyDutyAssignment = {
          id: proxyId,
          date: normalizeDateStr(selectedDate) || selectedDate,
          dayOfWeek: currentDayOfWeek as DayOfWeek,
          periodNumber: Number(pNum),
          timeSlot: item.slot.timeSlot || `Period ${pNum}`,
          className: item.slot.className || '',
          section: item.slot.section || 'A',
          subjectName: item.slot.subjectName || 'General',
          roomNo: item.slot.roomNo || null,
          absentTeacherCode: activeStaffForProxy.employeeCode || '',
          absentTeacherName: activeStaffForProxy.name || '',
          absenceReason:
            checkTeacherAbsenceOnDate(
              activeStaffForProxy.employeeCode,
              selectedDate,
              attendanceRecords,
              leaveApplications,
              onDutyRecords
            ).leaveType || 'Leave',
          substituteTeacherCode: item.substituteStaff.employeeCode || '',
          substituteTeacherName: item.substituteStaff.name || '',
          substituteDesignation: item.substituteStaff.designation || 'Teacher',
          isFreePeriod: true,
          assignedBy: activeUser?.name ? `${activeUser.name} (In-charge)` : 'Principal / Timetable Incharge',
          assignedAt: new Date().toISOString(),
          status: 'Assigned',
          syncedToTaskSystem: true,
          notes: item.notes?.trim() || null
        };
        newProxyRecords.push(newProxyRecord);
        const proxyTaskId = `task-proxy-${selectedDate}-p${pNum}-${item.substituteStaff.employeeCode}`;
        const proxyTask: TeacherTask = {
          id: proxyTaskId,
          title: `🚨 PROXY DUTY: Period ${pNum} in Class ${classSecStr} (${newProxyRecord.timeSlot})`,
          description: `Substitution duty assigned for ${activeStaffForProxy.name}. Subject: ${item.slot.subjectName}. Room: ${item.slot.roomNo || 'Assigned'}. Notes: ${item.notes || 'Maintain classroom discipline and academic activity.'}`,
          priority: 'Do First (Urgent & Important)',
          status: 'Pending',
          category: 'Arrangement / Proxy Duty',
          dueDate: selectedDate,
          dueTime: item.slot.timeSlot?.split('-')?.[0]?.trim() || '08:00',
          tags: ['Proxy Duty', 'Timetable Arrangement', `Class ${item.slot.className}`],
          subtasks: [
            { id: `st-1-${proxyTaskId}`, title: 'Report to classroom on time and mark proxy presence', completed: false },
            { id: `st-2-${proxyTaskId}`, title: 'Engage students with textbook / revision worksheet', completed: false }
          ],
          assignedBy: activeUser?.name || 'Principal / Timetable Incharge',
          assignedByRole: 'Principal',
          isTopPriority: true,
          overloadImpact: true,
          linkedClass: `Class ${item.slot.className}`,
          linkedSubject: item.slot.subjectName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        newTasks.push(proxyTask);
        const scopedKey = getTeacherScopedStorageKey('setup:tasks', item.substituteStaff.employeeCode);
        if (!scopedTasksMap.has(scopedKey)) {
          scopedTasksMap.set(scopedKey, []);
        }
        scopedTasksMap.get(scopedKey)!.push(proxyTask);
      }

      // Read fresh stored proxies from DB to avoid dropping any concurrent or previously saved proxies
      const freshStoredProxies = (await db.get<ProxyDutyAssignment[]>('setup:proxy_duty_assignments')) || [];
      const newProxyIds = new Set(newProxyRecords.map(p => p.id));

      const updatedProxies: ProxyDutyAssignment[] = [
        ...freshStoredProxies.filter(p => {
          if (newProxyIds.has(p.id)) return false;
          // Filter out existing proxy if it matches the exact same absent teacher, date, period, and class
          const isReplacedSlot = newProxyRecords.some(newP =>
            isProxyMatchingSlot(p, newP.date, {
              period: newP.periodNumber,
              className: newP.className,
              section: newP.section,
              teacherName: newP.absentTeacherName,
              teacherId: newP.absentTeacherCode
            } as TimetableSlot, {
              name: newP.absentTeacherName,
              employeeCode: newP.absentTeacherCode
            } as StaffDetailRecord)
          );
          return !isReplacedSlot;
        }),
        ...newProxyRecords
      ].map(p => ({
        id: p.id,
        date: normalizeDateStr(p.date) || p.date,
        dayOfWeek: p.dayOfWeek || 'Monday',
        periodNumber: Number(p.periodNumber),
        timeSlot: p.timeSlot || `Period ${p.periodNumber}`,
        className: p.className || '',
        section: p.section || 'A',
        subjectName: p.subjectName || 'General',
        roomNo: p.roomNo || null,
        absentTeacherCode: p.absentTeacherCode || '',
        absentTeacherName: p.absentTeacherName || '',
        absenceReason: p.absenceReason || 'Leave',
        substituteTeacherCode: p.substituteTeacherCode || '',
        substituteTeacherName: p.substituteTeacherName || '',
        substituteDesignation: p.substituteDesignation || 'Teacher',
        isFreePeriod: p.isFreePeriod !== false,
        assignedBy: p.assignedBy || 'Principal / Timetable Incharge',
        assignedAt: p.assignedAt || new Date().toISOString(),
        status: p.status || 'Assigned',
        syncedToTaskSystem: p.syncedToTaskSystem !== false,
        notes: p.notes?.trim() || null
      }));

      setProxyAssignments(updatedProxies);

      const newTaskIds = new Set(newTasks.map(t => t.id));
      const updatedTasks = [
        ...existingTasks.filter(t => !newTaskIds.has(t.id)),
        ...newTasks
      ];

      console.log('[PROXY WRITE DIAGNOSTIC] Writing to key "setup:proxy_duty_assignments":', {
        count: updatedProxies.length,
        newRecordsAdded: newProxyRecords.length,
        itemsPreview: updatedProxies.slice(0, 3)
      });

      const writePromises: Promise<any>[] = [
        db.set('setup:proxy_duty_assignments', updatedProxies),
        db.set('setup:tasks', updatedTasks)
      ];

      for (const [scopedKey, taskList] of scopedTasksMap.entries()) {
        const existingScoped = (await db.get<TeacherTask[]>(scopedKey)) || [];
        const taskIds = new Set(taskList.map(t => t.id));
        const mergedScoped = [
          ...existingScoped.filter(t => !taskIds.has(t.id)),
          ...taskList
        ];
        writePromises.push(db.set(scopedKey, mergedScoped));
      }

      await Promise.all(writePromises);

      // Verify persistence from DB and localStorage
      const verified = await db.get<ProxyDutyAssignment[]>('setup:proxy_duty_assignments');
      const rawLocalAfterWrite = typeof window !== 'undefined' ? localStorage.getItem('setup:proxy_duty_assignments') : null;
      console.log('[PROXY WRITE DIAGNOSTIC] Verification after save:', {
        key: 'setup:proxy_duty_assignments',
        verifiedDbCount: verified?.length,
        rawLocalStorageLength: rawLocalAfterWrite?.length,
        rawLocalStoragePreview: rawLocalAfterWrite?.slice(0, 150)
      });

      const count = stagedProxies.size;
      setStagedProxies(new Map());
      setSelectedSlotForProxy(null);
      setSelectedSubstituteCode('');
      setProxyNotes('');
      window.dispatchEvent(new CustomEvent('kvs-timetable-updated'));
      window.dispatchEvent(new CustomEvent('kvs-attendance-updated'));
      showNotification(`Successfully assigned ${count} proxy substitution(s) for ${activeStaffForProxy.name} on ${selectedDate}!`);
      if (onProxySaved) onProxySaved();
    } catch (err) {
      console.error('Error assigning all proxies:', err);
      alert('Failed to assign proxy substitutions. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSafeClose = () => {
    if (stagedProxies.size > 0) {
      if (!window.confirm(`You have ${stagedProxies.size} unsaved staged proxy assignment(s). Discard them and close?`)) {
        return;
      }
    }
    setStagedProxies(new Map());
    onClose();
  };

  const handleCancelProxy = async (proxyId: string) => {
    const targetProxy = proxyAssignments.find(p => p.id === proxyId);
    if (!targetProxy) return;
    if (!window.confirm(`Cancel proxy assignment of ${targetProxy.substituteTeacherName} for Period ${targetProxy.periodNumber}?`)) {
      return;
    }
    try {
      const freshStoredProxies = (await db.get<ProxyDutyAssignment[]>('setup:proxy_duty_assignments')) || proxyAssignments;
      const updatedProxies = freshStoredProxies.filter(p => p.id !== proxyId);
      setProxyAssignments(updatedProxies);
      await db.set('setup:proxy_duty_assignments', updatedProxies);
      window.dispatchEvent(new CustomEvent('kvs-timetable-updated'));
      window.dispatchEvent(new CustomEvent('kvs-attendance-updated'));
      showNotification(`Proxy substitution for Period ${targetProxy.periodNumber} cancelled`);
      if (onProxySaved) onProxySaved();
    } catch (err) {
      console.error('Error cancelling proxy:', err);
    }
  };

  if (!isOpen) return null;

  const totalSlotsCount = teacherScheduledPeriods.length;
  const totalAssignedOrStagedCount = teacherScheduledPeriods.filter(slot => {
    const isSaved = proxyAssignments.some(p => isProxyMatchingSlot(p, selectedDate, slot, activeStaffForProxy));
    const isStaged = stagedProxies.has(getSlotKey(slot));
    return isSaved || isStaged;
  }).length;
  const unassignedCount = Math.max(0, totalSlotsCount - totalAssignedOrStagedCount);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-5 sm:p-6 space-y-5 shadow-2xl relative my-6 animate-scaleUp max-h-[92vh] overflow-y-auto">
        
        {msg && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-fadeIn ${
              msg.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/50'
                : 'bg-rose-950/90 text-rose-200 border border-rose-500/50'
            }`}
          >
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white p-0.5 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2 m-0">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span>Automatic Proxy & Substitution Planner</span>
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Date:</span>
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  setSelectedSlotForProxy(null);
                  setSelectedSubstituteCode('');
                  setStagedProxies(new Map());
                }}
                className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
              />
              <span className={`px-2 py-0.5 rounded-md border text-xs font-bold font-mono ${
                currentDayOfWeek === 'Sunday'
                  ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                  : 'bg-purple-950/80 border-purple-500/40 text-purple-300'
              }`}>
                {currentDayOfWeek} {currentDayOfWeek === 'Sunday' && '(Weekend)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSafeClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close planner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Select Absent / Target Faculty Requiring Substitution:</span>
            </label>
            {absentTeachersList.length > 0 && (
              <span className="text-[11px] font-mono text-rose-300 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-md">
                {absentTeachersList.length} Faculty Absent / On Leave
              </span>
            )}
          </div>

          <select
            value={activeStaffForProxy?.employeeCode || ''}
            onChange={e => {
              const found = staffList.find(s => s.employeeCode === e.target.value);
              if (found) {
                if (stagedProxies.size > 0 && !window.confirm(`Switching teacher will clear ${stagedProxies.size} staged proxy assignment(s). Continue?`)) {
                  return;
                }
                setActiveStaffForProxy(found);
                setSelectedSlotForProxy(null);
                setSelectedSubstituteCode('');
                setStagedProxies(new Map());
              }
            }}
            className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-purple-500/40 rounded-xl text-white font-bold focus:outline-none focus:border-purple-400 shadow-md cursor-pointer"
          >
            {absentTeachersList.length > 0 && (
              <optgroup label="⚠️ On Leave / OD / Absent on this date">
                {absentTeachersList.map(s => (
                  <option key={s.employeeCode} value={s.employeeCode}>
                    🚨 {s.name} ({s.designation || 'Teacher'}) &bull; [{s.absenceStatus || 'On Leave'}]
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="All School Faculty">
              {staffList.map(s => (
                <option key={s.employeeCode} value={s.employeeCode}>
                  {s.name} ({s.designation || 'Teacher'} - {s.employeeCode})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {activeStaffForProxy && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-300">
                  {activeStaffForProxy.name} ({teacherScheduledPeriods.length} Classes on {currentDayOfWeek}):
                </span>
                <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                  totalAssignedOrStagedCount === totalSlotsCount && totalSlotsCount > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {totalAssignedOrStagedCount} of {totalSlotsCount} Assigned
                  {stagedProxies.size > 0 && ` (${stagedProxies.size} Staged)`}
                </span>
                {unassignedCount > 0 && (
                  <span className="text-rose-400 font-mono text-[11px]">
                    &bull; {unassignedCount} Remaining
                  </span>
                )}
              </div>

              {stagedProxies.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearAllStaged}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] font-bold border border-slate-700 cursor-pointer"
                  >
                    Clear All Staged
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAndAssignAllProxies}
                    disabled={isSubmitting}
                    className="px-3.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/30 cursor-pointer animate-pulse"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Assign All ({stagedProxies.size})</span>
                  </button>
                </div>
              )}
            </div>

            {teacherScheduledPeriods.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs space-y-1.5">
                <Clock className="w-6 h-6 mx-auto text-slate-600" />
                <div className="font-bold text-white">
                  No scheduled timetable periods found for {activeStaffForProxy.name} on {currentDayOfWeek}.
                </div>
                <div className="text-[11px] text-slate-500">
                  This teacher has no active teaching classes scheduled for {currentDayOfWeek} in the master timetable.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teacherScheduledPeriods.map((slot, sIdx) => {
                  const pNum = slot.period || slot.periodNumber || 1;
                  const slotKey = getSlotKey(slot);
                  const existingProxy = proxyAssignments.find(p => isProxyMatchingSlot(p, selectedDate, slot, activeStaffForProxy, true));
                  const isStaged = stagedProxies.has(slotKey);
                  const stagedItem = stagedProxies.get(slotKey);

                  const isSelected =
                    selectedSlotForProxy &&
                    getSlotKey(selectedSlotForProxy) === slotKey;

                  return (
                    <div
                      key={slot.id || `slot-${pNum}-${sIdx}`}
                      onClick={() => handleSelectSlot(slot)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 relative ${
                        isSelected
                          ? 'bg-purple-950/70 border-purple-400 shadow-xl shadow-purple-950/60 ring-2 ring-purple-400'
                          : isStaged
                          ? 'bg-emerald-950/40 border-emerald-400 shadow-md shadow-emerald-950/30'
                          : existingProxy
                          ? 'bg-slate-900/80 border-emerald-500/30 hover:border-emerald-500/60'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-md font-mono text-xs font-bold ${
                            isStaged
                              ? 'bg-emerald-500 text-slate-950'
                              : isSelected
                              ? 'bg-purple-500 text-white'
                              : 'bg-slate-800 text-purple-300'
                          }`}>
                            Period {pNum}
                          </span>
                          {isStaged && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold uppercase tracking-wider">
                              Staged
                            </span>
                          )}
                        </div>
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

                      {isStaged && stagedItem ? (
                        <div className="pt-2 border-t border-emerald-500/30 flex items-center justify-between">
                          <div className="text-[11px] text-emerald-300 font-bold flex items-center gap-1.5 truncate">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">Proxy: {stagedItem.substituteStaff.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={e => handleRemoveStagedProxy(slot, e)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 underline font-bold cursor-pointer shrink-0 ml-2"
                          >
                            Clear
                          </button>
                        </div>
                      ) : existingProxy ? (
                        <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                          <div className="text-[11px] text-emerald-300 font-bold flex items-center gap-1.5 truncate">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">Proxy: {existingProxy.substituteTeacherName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleCancelProxy(existingProxy.id);
                            }}
                            className="text-[10px] text-rose-400 hover:text-rose-300 underline font-bold cursor-pointer shrink-0 ml-2"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-rose-400 font-bold">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Needs Proxy Assignment</span>
                          </span>
                          <span className="text-[10px] text-purple-400 uppercase font-mono">
                            {isSelected ? 'Selecting...' : 'Click to stage'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedSlotForProxy && activeStaffForProxy && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-4 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
              <h4 className="text-xs font-bold text-purple-300 m-0 uppercase tracking-wider flex items-center gap-1.5">
                <span>
                  2. Choose Substitute for Period {selectedSlotForProxy.period || selectedSlotForProxy.periodNumber || 1} (Class {selectedSlotForProxy.className} &bull; {selectedSlotForProxy.subjectName})
                </span>
              </h4>
              {stagedProxies.has(getSlotKey(selectedSlotForProxy)) && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold text-[10px]">
                  Staged ✓
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Available Free Teachers During Period {selectedSlotForProxy.period || selectedSlotForProxy.periodNumber || 1} *
              </label>

              {(() => {
                const pNum = selectedSlotForProxy.period || selectedSlotForProxy.periodNumber || 1;
                const slotKey = getSlotKey(selectedSlotForProxy);
                const freeStaffInfo = getAvailableFreeTeachers(pNum, activeStaffForProxy.employeeCode, slotKey, selectedSlotForProxy);

                if (freeStaffInfo.length === 0) {
                  return (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs space-y-2">
                      <div>⚠️ No completely free teachers found during Period {pNum}. You can still choose any present faculty below:</div>
                      <select
                        required
                        value={selectedSubstituteCode}
                        onChange={e => handleSelectSubstitute(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
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
                    onChange={e => handleSelectSubstitute(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-emerald-300 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
                  >
                    <option value="">-- Select From {freeStaffInfo.length} Eligible Free Teacher(s) --</option>
                    {freeStaffInfo.map(({ staff, todayAssignedProxyCount, isCoLanguageTeacher }) => (
                      <option key={staff.employeeCode} value={staff.employeeCode}>
                        {isCoLanguageTeacher ? '🌟' : '✅'} {staff.name} ({staff.designation || 'Teacher'}) {isCoLanguageTeacher ? '• [Co-Language in Same Class]' : `• Free in Period ${pNum}`} • {todayAssignedProxyCount === 0 ? '0 proxies assigned today' : `${todayAssignedProxyCount} proxy assigned today`}
                      </option>
                    ))}
                  </select>
                );
              })()}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                Special Instructions / Notes for Proxy Teacher (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Conduct revision test / NCERT reading / Science lab activity..."
                value={proxyNotes}
                onChange={e => handleNotesChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none shadow-inner"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
              <div className="text-[11px] text-slate-400">
                {selectedSubstituteCode ? (
                  <span className="text-emerald-300 font-bold">
                    ✓ Period {selectedSlotForProxy.period || selectedSlotForProxy.periodNumber || 1} staged with {staffList.find(s => s.employeeCode === selectedSubstituteCode)?.name}.
                  </span>
                ) : (
                  <span>Select a substitute above to stage this period.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unassignedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleJumpToNextUnassigned}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Next Period</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {stagedProxies.size > 0 && (
                  <button
                    type="button"
                    onClick={handleConfirmAndAssignAllProxies}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/30 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {stagedProxies.size === 1
                        ? 'Confirm & Assign Proxy'
                        : `Confirm & Assign All (${stagedProxies.size})`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400 font-mono">
            {stagedProxies.size > 0 ? (
              <span className="text-emerald-300 font-bold">
                ● {stagedProxies.size} proxy substitution(s) staged and ready to commit.
              </span>
            ) : (
              <span>Click periods above to stage substitute teachers in batch.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleSafeClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              {stagedProxies.size > 0 ? 'Discard & Close' : 'Close Planner'}
            </button>

            {stagedProxies.size > 0 && (
              <button
                type="button"
                onClick={handleConfirmAndAssignAllProxies}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-xl shadow-emerald-500/40 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {stagedProxies.size === 1
                    ? 'Confirm & Assign Proxy'
                    : `Confirm & Assign All (${stagedProxies.size} Proxies)`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
