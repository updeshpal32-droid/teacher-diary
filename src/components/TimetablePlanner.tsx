import React, { useState, useEffect, useMemo } from 'react';
import { TimetableSlot, DayOfWeek, TeacherRecord, StaffDetailRecord } from '../types/academic';
import { db, DEFAULT_TIMETABLE, DEFAULT_PERIOD_TIMINGS, DEFAULT_STAFF_DETAILS, getUserAccounts } from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import { ExcelTimetableImporter, canonicalizeClassName } from './ExcelTimetableImporter';
import { compareClassGrades } from '../utils/csvParser';
import {
  Clock,
  Calendar,
  Plus,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Edit2,
  Coffee,
  Sparkles,
  Trash2,
  Eraser,
  Filter,
  CheckSquare,
  Square,
  X,
  Search,
  AlertTriangle,
  Copy,
  ClipboardPaste,
  Check,
  BookOpen,
  Users,
  UserCheck,
  GraduationCap,
  FileSpreadsheet
} from 'lucide-react';

import { UserAccount } from '../types/auth';
import { isAdminOrDataManager, hasTimetableEditAccess } from '../lib/permissions';

interface TimetablePlannerProps {
  devMode: boolean;
  onSaved?: () => void;
  currentUser?: UserAccount | null;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Standard Classes I to XII
const CLASS_OPTIONS = [
  { label: 'Class I', val: 'I-A', level: 'Primary' },
  { label: 'Class II', val: 'II-A', level: 'Primary' },
  { label: 'Class III', val: 'III-A', level: 'Primary' },
  { label: 'Class IV', val: 'IV-A', level: 'Primary' },
  { label: 'Class V', val: 'V-A', level: 'Primary' },
  { label: 'Class VI', val: 'VI-A', level: 'Secondary' },
  { label: 'Class VII', val: 'VII-A', level: 'Secondary' },
  { label: 'Class VIII', val: 'VIII-A', level: 'Secondary' },
  { label: 'Class IX-A', val: 'IX-A', level: 'Secondary' },
  { label: 'Class IX-B', val: 'IX-B', level: 'Secondary' },
  { label: 'Class X-A', val: 'X-A', level: 'Secondary' },
  { label: 'Class X-B', val: 'X-B', level: 'Secondary' },
  { label: 'Class XI-A', val: 'XI-A', level: 'Senior Secondary' },
  { label: 'Class XI-B', val: 'XI-B', level: 'Senior Secondary' },
  { label: 'Class XII-A', val: 'XII-A', level: 'Senior Secondary' },
  { label: 'Class XII-B', val: 'XII-B', level: 'Senior Secondary' },
];


function normalizeFacultyKey(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^(mr|mrs|ms|dr|smt|shri|sh)\.?\s+/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function resolveToRegistryName(rawName: string, registry: StaffDetailRecord[]): { name: string; id?: string } {
  if (!rawName) return { name: '' };
  const rawKey = normalizeFacultyKey(rawName);

  // Direct special aliases
  if (rawKey.includes('updesh') || rawKey.includes('updeshkumar') || rawKey.includes('updeshsinghpal')) {
    const p = registry.find(s => s.employeeCode === '108894' || normalizeFacultyKey(s.name).includes('updesh'));
    return { name: p ? p.name : 'UPDESH SINGH PAL', id: '108894' };
  }
  if (rawKey.includes('sunitavema') || rawKey.includes('sunitaverma')) {
    const p = registry.find(s => normalizeFacultyKey(s.name).includes('gayatri'));
    if (p) return { name: p.name, id: p.employeeCode };
  }
  if (rawKey.includes('anjalideshmukh') || rawKey.includes('anjali')) {
    const p = registry.find(s => normalizeFacultyKey(s.name).includes('santwana'));
    if (p) return { name: p.name, id: p.employeeCode };
  }

  // Find in registry
  const match = registry.find(s => {
    const sKey = normalizeFacultyKey(s.name);
    return sKey === rawKey || sKey.includes(rawKey) || rawKey.includes(sKey);
  });

  if (match) {
    return { name: match.name, id: match.employeeCode };
  }

  return { name: rawName };
}

export const TimetablePlanner: React.FC<TimetablePlannerProps> = ({ devMode, onSaved, currentUser }) => {
  const canEdit = hasTimetableEditAccess(currentUser);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(DEFAULT_TIMETABLE);
  const [periodTimings, setPeriodTimings] = useState<Record<number, { time: string; label: string }>>(DEFAULT_PERIOD_TIMINGS);
  const [viewMode, setViewMode] = useState<'teacher' | 'class'>('teacher');
  const [selectedClass, setSelectedClass] = useState<string>('X-A');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Period Timings Edit Drawer / Modal
  const [isEditingTimings, setIsEditingTimings] = useState(false);
  const [tempTimings, setTempTimings] = useState<Record<number, { time: string; label: string }>>(DEFAULT_PERIOD_TIMINGS);

  // Quick Multi-Select / Bulk Clear Mode
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isGridSelectMode, setIsGridSelectMode] = useState(false);
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<string[]>([]);
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [filterDay, setFilterDay] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Teacher State
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');

  // Copy / Paste Clipboard State
  const [copiedSlotData, setCopiedSlotData] = useState<{
    className: string;
    subjectName: string;
    roomNo?: string;
    isBreak?: boolean;
  } | null>(null);

  // Dynamically extract all unique classes from current timetable schedule
  const dynamicClassesInSchedule = useMemo(() => {
    const set = new Set<string>();
    timetable.forEach(s => {
      if (s.className) {
        set.add(canonicalizeClassName(s.className));
      }
    });
    return Array.from(set).sort((a, b) => compareClassGrades(a, b, 'asc'));
  }, [timetable]);

  // Combine static options with any dynamic/imported classes
  const allClassPills = useMemo(() => {
    const staticVals = new Set(CLASS_OPTIONS.map(c => c.val));
    const extraClasses = dynamicClassesInSchedule.filter(c => !staticVals.has(c));
    return [
      ...CLASS_OPTIONS,
      ...extraClasses.map(c => ({ label: `Class ${c}`, val: c, level: 'Imported' }))
    ];
  }, [dynamicClassesInSchedule]);

  const [staffRegistry, setStaffRegistry] = useState<StaffDetailRecord[]>(DEFAULT_STAFF_DETAILS);
  const [storedTeachers, setStoredTeachers] = useState<TeacherRecord[]>([]);

  // Build authoritative faculty list matching "All Staff Details & Faculty Master Registry"
  const allTeachers = useMemo(() => {
    const registry = staffRegistry.length > 0 ? staffRegistry : DEFAULT_STAFF_DETAILS;
    // Extract unique teacher names from the official Faculty Master Registry
    const teacherNames = registry
      .map(s => s.name.trim())
      .filter(Boolean);
    return Array.from(new Set(teacherNames)).sort((a, b) => a.localeCompare(b));
  }, [staffRegistry]);

  useEffect(() => {
    if (allTeachers.length > 0 && (!selectedTeacher || !allTeachers.includes(selectedTeacher))) {
      setSelectedTeacher(allTeachers[0]);
    }
  }, [allTeachers, selectedTeacher]);

  const teacherPeriodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allTeachers.forEach(t => { counts[t] = 0; });

    timetable.forEach(s => {
      if (s.teacherName && s.teacherName.trim() && !s.isBreak) {
        const sKey = normalizeFacultyKey(s.teacherName);
        const match = allTeachers.find(t => {
          const tKey = normalizeFacultyKey(t);
          return tKey === sKey || tKey.includes(sKey) || sKey.includes(tKey);
        });
        if (match) {
          counts[match] = (counts[match] || 0) + 1;
        }
      }
    });
    return counts;
  }, [timetable, allTeachers]);

  const activeTeachersCount = useMemo(() => {
    return allTeachers.filter(t => (teacherPeriodCounts[t] || 0) > 0).length;
  }, [allTeachers, teacherPeriodCounts]);
  // Excel Importer State & Handler
  const [isExcelImporterOpen, setIsExcelImporterOpen] = useState(false);

  const handleExcelImportSuccess = async (
    importedSlots: TimetableSlot[],
    replaceMode: boolean,
    importedTeachersRecords?: TeacherRecord[]
  ) => {
    // Canonicalize class name for all imported slots
    const canonicalSlots = importedSlots.map(s => ({
      ...s,
      className: canonicalizeClassName(s.className)
    }));

    let finalSchedule: TimetableSlot[] = [];

    if (replaceMode) {
      finalSchedule = canonicalSlots;
    } else {
      // Merge mode: replace matching slots, keep existing unmentioned slots
      const mergedMap = new Map<string, TimetableSlot>();
      timetable.forEach(s => {
        const key = s.teacherName
          ? `${s.teacherName.trim().toLowerCase()}-${s.day}-${s.period}`
          : `${canonicalizeClassName(s.className)}-${s.day}-${s.period}`;
        mergedMap.set(key, s);
      });
      canonicalSlots.forEach(s => {
        const key = s.teacherName
          ? `${s.teacherName.trim().toLowerCase()}-${s.day}-${s.period}`
          : `${canonicalizeClassName(s.className)}-${s.day}-${s.period}`;
        mergedMap.set(key, s);
      });
      finalSchedule = Array.from(mergedMap.values());
    }

    setTimetable(finalSchedule);
    await db.set('setup:timetable', finalSchedule);

    // If teacher records were imported (via Teachers.csv), upsert into db
    if (importedTeachersRecords && importedTeachersRecords.length > 0) {
      const existing = (await db.get<TeacherRecord[]>('setup:teachersList')) || [];
      const teacherMap = new Map<string, TeacherRecord>();
      existing.forEach(t => teacherMap.set(t.teacherId, t));
      importedTeachersRecords.forEach(t => teacherMap.set(t.teacherId, t));
      const mergedTeachers = Array.from(teacherMap.values());
      setStoredTeachers(mergedTeachers);
      await db.set('setup:teachersList', mergedTeachers);
    }

    // Extract imported teachers
    const importedTeachers = Array.from(new Set(canonicalSlots.map(s => s.teacherName).filter(Boolean))) as string[];

    if (importedTeachers.length > 0) {
      setSelectedTeacher(importedTeachers[0]);
      setViewMode('teacher');
    } else if (canonicalSlots.length > 0) {
      setViewMode('class');
      setSelectedClass(canonicalSlots[0].className);
    }

    setMsg({
      type: 'success',
      text: `Successfully imported ${canonicalSlots.length} period schedule(s) for ${
        importedTeachersRecords && importedTeachersRecords.length > 0
          ? `${importedTeachersRecords.length} registered teacher(s)`
          : importedTeachers.length > 0
          ? `${importedTeachers.length} teacher(s)`
          : 'classes'
      }!`,
    });
    if (onSaved) onSaved();
    setTimeout(() => setMsg(null), 4000);
  };

  // Slot editing modal
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<TimetableSlot>({
    id: '',
    day: 'Monday',
    period: 1,
    className: 'X-A',
    subjectName: 'Mathematics',
    roomNo: 'Room 24'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [savedTT, savedStaff, userAccounts, savedTeachers, savedTimings] = await Promise.all([
      db.get<TimetableSlot[]>('setup:timetable'),
      db.get<StaffDetailRecord[]>('setup:staff_details'),
      getUserAccounts(),
      db.get<TeacherRecord[]>('setup:teachersList'),
      db.get<Record<number, { time: string; label: string }>>('setup:period_timings')
    ]);

    // Build Master Staff Registry matching "All Staff Details & Faculty Master Registry"
    const staffMap = new Map<string, StaffDetailRecord>();
    DEFAULT_STAFF_DETAILS.forEach(s => {
      if (s.employeeCode) staffMap.set(s.employeeCode, s);
    });
    if (savedStaff && savedStaff.length > 0) {
      savedStaff.forEach(s => {
        if (s.employeeCode) staffMap.set(s.employeeCode, s);
      });
    }
    if (userAccounts && userAccounts.length > 0) {
      userAccounts.forEach(u => {
        if (u.employeeCode) {
          const existing = staffMap.get(u.employeeCode);
          if (existing) {
            staffMap.set(u.employeeCode, {
              ...existing,
              name: u.name || existing.name,
              designation: u.designation || existing.designation
            });
          } else {
            staffMap.set(u.employeeCode, {
              id: u.id,
              serialNo: staffMap.size + 1,
              name: u.name,
              employeeCode: u.employeeCode,
              designation: u.designation || 'Teacher',
              employmentType: 'Regular',
              socialCategory: 'GENERAL',
              dob: '',
              joiningDateKVSWithDesignation: '',
              joiningDatePresentKVWithDesignation: '',
              bankAccountNo: '',
              ifscCode: '',
              bankName: '',
              highestAcademicAndProfessionalQual: '',
              permanentPostalAddress: '',
              email: u.email,
              phoneCalls: '',
              phoneWhatsapp: '',
              aadharNo: '',
              pranOrPanNo: '',
              isMinority: 'No',
              seniorityNumber: '',
              approvalStatus: 'Verified & Approved'
            });
          }
        }
      });
    }

    const regList = Array.from(staffMap.values());
    setStaffRegistry(regList);
    if (savedTeachers) setStoredTeachers(savedTeachers);

    // Normalize and cleanse timetable (auto-upgrades if stored timetable is legacy < 200 slots)
    const raw = savedTT && savedTT.length >= 200 ? savedTT : DEFAULT_TIMETABLE;
    const cleansedTT: TimetableSlot[] = raw
      .filter(s => {
        if (s.id === 'tt-fri-6' || s.id === 'tt-fri-sr-7') return false;
        if (s.day === 'Friday' && s.period === 6 && s.subjectName === 'Competency Test') return false;
        if (s.day === 'Friday' && s.period === 7 && s.className === 'VI-A' && s.subjectName.includes('Art Education')) return false;
        if (s.teacherName && (s.teacherName.toLowerCase().includes('vikram mehta') || s.teacherName.toLowerCase().includes('data entry'))) return false;
        return true;
      })
      .map(s => {
        if (!s.teacherName) return s;
        const res = resolveToRegistryName(s.teacherName, regList);
        return {
          ...s,
          teacherName: res.name,
          teacherId: res.id || s.teacherId
        };
      });

    setTimetable(cleansedTT);
    await db.set('setup:timetable', cleansedTT);

    if (savedTimings) {
      setPeriodTimings(savedTimings);
      setTempTimings(savedTimings);
    } else {
      setPeriodTimings(DEFAULT_PERIOD_TIMINGS);
      setTempTimings(DEFAULT_PERIOD_TIMINGS);
    }
    setLoading(false);
  };
  const getSlot = (day: DayOfWeek, period: number): TimetableSlot | undefined => {
    if (viewMode === 'teacher') {
      if (!selectedTeacher) return undefined;
      const targetKey = normalizeFacultyKey(selectedTeacher);
      return timetable.find(s => {
        if (s.day !== day || s.period !== period) return false;
        if (!s.teacherName) return false;
        const sKey = normalizeFacultyKey(s.teacherName);
        return sKey === targetKey || sKey.includes(targetKey) || targetKey.includes(sKey);
      });
    }
    // viewMode === 'class'
    const targetCanonical = canonicalizeClassName(selectedClass);
    const targetBase = targetCanonical.split('-')[0];

    return timetable.find(s => {
      if (s.day !== day || s.period !== period) return false;
      if (!s.className) return false;
      const sCanonical = canonicalizeClassName(s.className);
      const sBase = sCanonical.split('-')[0];

      return sCanonical === targetCanonical || sBase === targetBase || sCanonical.startsWith(targetBase + '-');
    });
  };
  const handleCellClick = (day: DayOfWeek, period: number) => {
    const key = `${day}-${period}`;
    if (isGridSelectMode) {
      if (selectedSlotKeys.includes(key)) {
        setSelectedSlotKeys(selectedSlotKeys.filter(k => k !== key));
      } else {
        setSelectedSlotKeys([...selectedSlotKeys, key]);
      }
      return;
    }

    const existing = getSlot(day, period);
    if (existing) {
      setActiveSlot({ ...existing });
    } else {
      const isPeriod9 = period === 9;
      setActiveSlot({
        id: `tt-${day.toLowerCase().slice(0, 3)}-${period}-${Date.now()}`,
        day,
        period,
        className: viewMode === 'class' ? selectedClass : 'X-A',
        subjectName: isPeriod9 ? 'Remedial Class / Extra Time Needed' : 'Mathematics',
        teacherName: viewMode === 'teacher' ? selectedTeacher : '',
        roomNo: 'Room 24'
      });
    }
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = async () => {
    const slotToSave = {
      ...activeSlot,
      className: canonicalizeClassName(activeSlot.className || selectedClass)
    };

    let updated = [...timetable];
    const index = updated.findIndex(s => {
      if (s.id === slotToSave.id) return true;
      if (s.day !== slotToSave.day || s.period !== slotToSave.period) return false;
      if (viewMode === 'class') {
        return canonicalizeClassName(s.className) === slotToSave.className;
      } else {
        return s.teacherName && slotToSave.teacherName && s.teacherName.trim().toLowerCase() === slotToSave.teacherName.trim().toLowerCase();
      }
    });

    if (index >= 0) {
      updated[index] = slotToSave;
    } else {
      updated.push(slotToSave);
    }

    setTimetable(updated);
    await db.set('setup:timetable', updated);
    setIsSlotModalOpen(false);
    setMsg({ type: 'success', text: `Slot updated for ${slotToSave.day} Period ${slotToSave.period}` });
    if (onSaved) onSaved();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDeleteActiveSlot = async () => {
    const updated = timetable.filter(s => {
      if (s.id === activeSlot.id) return false;
      if (s.day === activeSlot.day && s.period === activeSlot.period) {
        if (viewMode === 'teacher' && selectedTeacher) {
          return !s.teacherName || s.teacherName.trim().toLowerCase() !== selectedTeacher.trim().toLowerCase();
        }
        if (viewMode === 'class') {
          return canonicalizeClassName(s.className) !== canonicalizeClassName(activeSlot.className);
        }
      }
      return true;
    });
    setTimetable(updated);
    await db.set('setup:timetable', updated);
    setIsSlotModalOpen(false);
    setMsg({ type: 'success', text: `Removed slot for ${activeSlot.day} Period ${activeSlot.period}` });
    if (onSaved) onSaved();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDeleteSelectedSlots = async () => {
    if (selectedSlotKeys.length === 0) return;
    const count = selectedSlotKeys.length;
    const updated = timetable.filter(s => !selectedSlotKeys.includes(`${s.day}-${s.period}`));
    setTimetable(updated);
    await db.set('setup:timetable', updated);
    setSelectedSlotKeys([]);
    setIsGridSelectMode(false);
    setMsg({ type: 'success', text: `Successfully removed ${count} period(s).` });
    if (onSaved) onSaved();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleCopySlotData = (slot: { className: string; subjectName: string; roomNo?: string; isBreak?: boolean }) => {
    setCopiedSlotData({
      className: slot.className || '',
      subjectName: slot.subjectName || '',
      roomNo: slot.roomNo || '',
      isBreak: slot.isBreak || false,
    });
    setMsg({
      type: 'success',
      text: `Copied period: "${slot.className} - ${slot.subjectName}". Select target slot(s) and click Paste!`,
    });
    setTimeout(() => setMsg(null), 4000);
  };

  const handlePasteToTargetKeys = async (targetKeys: string[]) => {
    if (!copiedSlotData) {
      setMsg({ type: 'error', text: 'No period details copied yet. Copy a period first!' });
      setTimeout(() => setMsg(null), 3000);
      return;
    }
    if (targetKeys.length === 0) {
      setIsGridSelectMode(true);
      setMsg({ type: 'success', text: 'Multi-Select Mode active. Click any grid cell(s) to select where to paste!' });
      setTimeout(() => setMsg(null), 4000);
      return;
    }

    let updated = [...timetable];
    targetKeys.forEach(key => {
      const [dayStr, periodStr] = key.split('-');
      const day = dayStr as DayOfWeek;
      const period = parseInt(periodStr, 10);
      const existingIndex = updated.findIndex(s => s.day === day && s.period === period);

      const newSlot: TimetableSlot = {
        id: existingIndex >= 0 ? updated[existingIndex].id : `tt-${day.toLowerCase().slice(0, 3)}-${period}`,
        day,
        period,
        className: copiedSlotData.className,
        subjectName: copiedSlotData.subjectName,
        roomNo: copiedSlotData.roomNo || '',
        isBreak: copiedSlotData.isBreak || false,
      };

      if (existingIndex >= 0) {
        updated[existingIndex] = newSlot;
      } else {
        updated.push(newSlot);
      }
    });

    setTimetable(updated);
    await db.set('setup:timetable', updated);
    setSelectedSlotKeys([]);
    setMsg({
      type: 'success',
      text: `Successfully pasted "${copiedSlotData.className} - ${copiedSlotData.subjectName}" into ${targetKeys.length} slot(s)!`,
    });
    if (onSaved) onSaved();
    setTimeout(() => setMsg(null), 3500);
  };

  const handleClearByPreset = async (type: 'period9' | 'saturday' | 'class' | 'subject' | 'day' | 'all') => {
    let updated = [...timetable];
    let removedCount = 0;

    if (type === 'period9') {
      updated = timetable.filter(s => s.period !== 9);
      removedCount = timetable.length - updated.length;
    } else if (type === 'saturday') {
      updated = timetable.filter(s => s.day !== 'Saturday');
      removedCount = timetable.length - updated.length;
    } else if (type === 'class' && filterClass !== 'ALL') {
      updated = timetable.filter(s => s.className !== filterClass);
      removedCount = timetable.length - updated.length;
    } else if (type === 'subject' && filterSubject !== 'ALL') {
      updated = timetable.filter(s => s.subjectName !== filterSubject);
      removedCount = timetable.length - updated.length;
    } else if (type === 'day' && filterDay !== 'ALL') {
      updated = timetable.filter(s => s.day !== filterDay);
      removedCount = timetable.length - updated.length;
    } else if (type === 'all') {
      removedCount = timetable.length;
      updated = [];
    }

    if (removedCount > 0 || type === 'all') {
      setTimetable(updated);
      await db.set('setup:timetable', updated);
      setSelectedSlotKeys([]);
      setMsg({ type: 'success', text: `Cleared ${removedCount} period slot(s).` });
      if (onSaved) onSaved();
      setTimeout(() => setMsg(null), 3000);
    } else {
      setMsg({ type: 'error', text: 'No matching periods found to remove.' });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  // Extract unique classes and subjects for filtering
  const uniqueClasses = Array.from(new Set(timetable.map(s => s.className).filter(Boolean)));
  const uniqueSubjects = Array.from(new Set(timetable.map(s => s.subjectName).filter(Boolean)));

  const handleSaveTimings = async () => {
    setPeriodTimings(tempTimings);
    await db.set('setup:period_timings', tempTimings);
    setIsEditingTimings(false);
    setMsg({ type: 'success', text: 'Period bell schedule timings updated successfully!' });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleReset = async () => {
    setTimetable(DEFAULT_TIMETABLE);
    setPeriodTimings(DEFAULT_PERIOD_TIMINGS);
    setTempTimings(DEFAULT_PERIOD_TIMINGS);
    setSelectedSlotKeys([]);
    await db.set('setup:timetable', DEFAULT_TIMETABLE);
    await db.set('setup:period_timings', DEFAULT_PERIOD_TIMINGS);
    setMsg({ type: 'success', text: 'Reset timetable and timings to standard KVS schedule.' });
    if (onSaved) onSaved();
    setTimeout(() => setMsg(null), 3000);
  };

  // Compute total teaching periods count
  const totalTeachingPeriods = useMemo(() => {
    if (viewMode === 'teacher') {
      if (!selectedTeacher) return 0;
      const normSelected = selectedTeacher.trim().toLowerCase();
      return timetable.filter(
        s => s.teacherName && s.teacherName.trim().toLowerCase() === normSelected && !s.isBreak
      ).length;
    }
    // viewMode === 'class'
    const targetCanonical = canonicalizeClassName(selectedClass);
    const targetBase = targetCanonical.split('-')[0];
    return timetable.filter(s => {
      if (!s.className || s.isBreak) return false;
      const sCanonical = canonicalizeClassName(s.className);
      const sBase = sCanonical.split('-')[0];
      return sCanonical === targetCanonical || sBase === targetBase || sCanonical.startsWith(targetBase + '-');
    }).length;
  }, [timetable, viewMode, selectedClass, selectedTeacher]);

  if (loading) {
    return <div className="p-8 text-center text-purple-300">Loading Timetable Grid...</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {devMode && (
        <DevModeBadge
          pages={14}
          title="Class Timetable & Teacher's Timetable (9 Periods x 6 Days with Timings)"
          fieldCount={54}
        />
      )}

      {msg && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
            msg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="td-card">
        <div className="td-card-head flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white m-0">Weekly Timetable</h3>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="td-seg w-full sm:w-auto justify-center">
              <button
                className={viewMode === 'teacher' ? 'active' : ''}
                onClick={() => setViewMode('teacher')}
              >
                Teacher timetable
              </button>
              <button
                className={viewMode === 'class' ? 'active' : ''}
                onClick={() => setViewMode('class')}
              >
                Class timetable
              </button>
            </div>

            {canEdit ? (
              <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setIsExcelImporterOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Import timetable Excel sheet (.xlsx, .xls, .csv) for all classes"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Import Excel</span>
                </button>

                <button
                  onClick={() => {
                    setIsGridSelectMode(!isGridSelectMode);
                    if (isGridSelectMode) setSelectedSlotKeys([]);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isGridSelectMode
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md animate-pulse'
                      : 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100 shadow-xs'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  <span className="truncate">{isGridSelectMode ? 'Exit Select' : 'Multi-Select'}</span>
                </button>

                <button
                  onClick={() => setIsBulkDeleteOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Eraser className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="truncate">Bulk Clear</span>
                </button>

                <button
                  onClick={() => {
                    setTempTimings(periodTimings);
                    setIsEditingTimings(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-300 hover:bg-purple-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  <span className="truncate">Timings</span>
                </button>

                <button
                  onClick={handleReset}
                  className="col-span-2 sm:col-span-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Auto-Fill</span>
                </button>
              </div>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>View-Only</span>
              </span>
            )}
          </div>
        </div>

        {/* Floating Clipboard Banner when copiedSlotData is active */}
        {copiedSlotData && (
          <div className="p-3 mb-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3 text-purple-200 animate-fadeIn shadow-md">
            <div className="flex items-center gap-2">
              <ClipboardPaste className="w-5 h-5 text-purple-400 animate-bounce" />
              <div className="text-xs">
                <span className="font-bold text-purple-300">Copied Period Buffer: </span>
                <span className="font-mono font-bold text-white bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/30">
                  {copiedSlotData.className} — {copiedSlotData.subjectName}
                  {copiedSlotData.roomNo ? ` (${copiedSlotData.roomNo})` : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePasteToTargetKeys(selectedSlotKeys)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>
                  {selectedSlotKeys.length > 0
                    ? `Paste to ${selectedSlotKeys.length} Selected Slot(s)`
                    : 'Select Target Slots to Paste'}
                </span>
              </button>
              <button
                onClick={() => setCopiedSlotData(null)}
                title="Clear clipboard buffer"
                className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-dim)] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Multi-Select Toolbar when isGridSelectMode is active */}
        {isGridSelectMode && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/40 border border-rose-500/30 flex flex-wrap items-center justify-between gap-3 text-rose-200 animate-fadeIn shadow-md">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-rose-400" />
              <span className="font-bold text-xs">
                Multi-Select Mode Active: Click any timetable cell to select/deselect it.
              </span>
              <span className="ml-2 px-2 py-0.5 bg-rose-900/60 rounded-full border border-rose-500/30 font-mono text-xs font-bold text-rose-300">
                {selectedSlotKeys.length} Selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              {copiedSlotData && (
                <button
                  disabled={selectedSlotKeys.length === 0}
                  onClick={() => handlePasteToTargetKeys(selectedSlotKeys)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                    selectedSlotKeys.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-emerald-950 text-emerald-600 border border-emerald-900 cursor-not-allowed'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Paste Copied Period ({selectedSlotKeys.length})</span>
                </button>
              )}
              <button
                onClick={() => {
                  const allKeys = timetable.map(s => `${s.day}-${s.period}`);
                  setSelectedSlotKeys(allKeys);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-900 border border-rose-500/30 text-rose-200 text-xs font-semibold cursor-pointer"
              >
                Select All Filled ({timetable.length})
              </button>
              <button
                onClick={() => setSelectedSlotKeys([])}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-semibold cursor-pointer"
              >
                Deselect All
              </button>
              <button
                disabled={selectedSlotKeys.length === 0}
                onClick={handleDeleteSelectedSlots}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                  selectedSlotKeys.length > 0
                    ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                    : 'bg-rose-950 text-rose-600 border border-rose-900 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Selected ({selectedSlotKeys.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Class Selection Toolbar */}
        {viewMode === 'class' && (
          <div className="p-3 sm:p-4 mb-4 sm:mb-6 rounded-2xl bg-purple-950/40 border border-[var(--glass-border)] space-y-2.5 shadow-md animate-fadeIn">
            <div className="flex items-center justify-between gap-2.5 border-b border-[var(--glass-border)] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                  <span>Class schedule</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    Class {selectedClass}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <label className="text-xs font-medium text-purple-200">Class:</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs cursor-pointer focus:outline-none focus:border-purple-500 max-w-[140px]"
                >
                  {allClassPills.map(c => (
                    <option key={c.val} value={c.val}>
                      {c.label} {c.level ? `(${c.level})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Class Pill Selector */}
            <div className="flex flex-wrap gap-1.5">
              {allClassPills.map(opt => {
                const isActive = canonicalizeClassName(selectedClass) === canonicalizeClassName(opt.val);
                const hasData = dynamicClassesInSchedule.includes(canonicalizeClassName(opt.val));
                return (
                  <button
                    key={opt.val}
                    onClick={() => setSelectedClass(opt.val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0 ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-sm ring-1 ring-white/20 font-bold'
                        : hasData
                        ? 'bg-white/5 hover:bg-white/10 text-purple-200 border border-purple-500/30'
                        : 'bg-white/5 hover:bg-white/10 text-[var(--text-dim)] border border-[var(--glass-border)]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {hasData && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Schedule available" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Teacher Selection Toolbar */}
        {viewMode === 'teacher' && (
          <div className="p-3 sm:p-4 mb-4 sm:mb-6 rounded-2xl bg-purple-950/40 border border-[var(--glass-border)] space-y-2.5 shadow-md animate-fadeIn">
            <div className="flex items-center justify-between gap-2.5 border-b border-[var(--glass-border)] pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                  <span>Teacher schedule</span>
                  {selectedTeacher && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold truncate max-w-[130px] sm:max-w-none">
                      {selectedTeacher}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <label className="text-xs font-medium text-purple-200">Teacher:</label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs cursor-pointer focus:outline-none focus:border-purple-500 max-w-[150px] sm:max-w-[200px]"
                >
                  {allTeachers.map(t => (
                    <option key={t} value={t}>
                      {t} {teacherPeriodCounts[t] ? `(${teacherPeriodCounts[t]}p)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Teacher Chips (wrap, smaller padding) */}
            <div className="flex flex-wrap gap-1.5 max-h-32 sm:max-h-none overflow-y-auto sm:overflow-visible">
              {allTeachers.map(teacherName => {
                const isActive = selectedTeacher.trim().toLowerCase() === teacherName.trim().toLowerCase();
                const periodCount = teacherPeriodCounts[teacherName] || 0;
                const hasData = periodCount > 0;

                return (
                  <button
                    key={teacherName}
                    onClick={() => setSelectedTeacher(teacherName)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-sm ring-1 ring-white/20 font-bold'
                        : hasData
                        ? 'bg-white/5 hover:bg-white/10 text-purple-200 border border-purple-500/30'
                        : 'bg-white/5 hover:bg-white/10 text-[var(--text-dim)] border border-[var(--glass-border)]'
                    }`}
                  >
                    <span className="truncate max-w-[110px]">{teacherName}</span>
                    {hasData ? (
                      <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                        {periodCount}p
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--text-dim)]">0p</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Total Periods Metric */}
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-purple-950/40 border border-purple-500/20 mb-4 sm:mb-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold font-mono text-sm sm:text-base shadow-md shadow-purple-600/30">
              {totalTeachingPeriods}
            </div>
            <div>
              <div className="text-[11px] sm:text-xs uppercase tracking-wider text-purple-300 font-bold flex items-center gap-1.5 flex-wrap">
                <span>Weekly Teaching Load</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  + Period 9
                </span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-white">
                {totalTeachingPeriods} Periods / Week (Mon - Sat)
              </div>
            </div>
          </div>
          <div className="text-xs text-[var(--text-dim)] italic hidden lg:block">
            Timings for each period are listed in the top header row. Click any cell to customize.
          </div>
        </div>

        {/* Timetable Table */}
        <div className="overflow-x-auto rounded-xl border border-[var(--glass-border)]">
          <table className="td-tt min-w-[980px]">
            <thead>
              {/* FIRST ROW: PERIOD NAMES & TIMINGS */}
              <tr>
                <th className="td-tt-period min-w-[110px] text-center">
                  <div className="font-bold text-xs uppercase tracking-wider text-purple-200">Day \ Period</div>
                  <div className="text-[10px] font-mono text-[var(--text-dim)] mt-0.5">Start - End Time</div>
                </th>
                {PERIODS.map(p => {
                  const tInfo = periodTimings[p] || DEFAULT_PERIOD_TIMINGS[p] || { time: '', label: '' };
                  const isPeriod9 = p === 9;
                  return (
                    <React.Fragment key={p}>
                      <th
                        onClick={() => {
                          setTempTimings(periodTimings);
                          setIsEditingTimings(true);
                        }}
                        title="Click to edit bell timings for this period"
                        className={`p-2.5 text-center border transition-all cursor-pointer hover:bg-white/5 group ${
                          isPeriod9
                            ? 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/30 text-amber-300'
                            : 'bg-purple-950/40 hover:bg-purple-900/50 border-[var(--glass-border)] text-purple-200'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className={`font-bold text-xs ${isPeriod9 ? 'text-amber-300 group-hover:text-amber-200' : 'text-purple-200 group-hover:text-white'} transition-colors`}>Period {p}</span>
                          {isPeriod9 && (
                            <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              Extra
                            </span>
                          )}
                          <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-purple-400 transition-opacity ml-0.5" />
                        </div>
                        {/* FIRST ROW: TIMINGS DISPLAY */}
                        <div className={`text-[10px] font-mono font-semibold ${isPeriod9 ? 'text-amber-300 border-amber-500/30 bg-amber-950/60' : 'text-purple-300 border-purple-500/30 bg-purple-950/60'} mt-1 px-2 py-0.5 rounded border inline-block whitespace-nowrap`}>
                          {tInfo.time}
                        </div>
                        <div className={`text-[9px] ${isPeriod9 ? 'text-amber-400' : 'text-[var(--text-dim)]'} mt-1 truncate max-w-[120px] mx-auto`}>
                          {isPeriod9 ? 'Remedial / Extra Class' : `Slot ${p}`}
                        </div>
                      </th>

                      {/* DEDICATED RECESS COLUMN AFTER PERIOD 4 */}
                      {p === 4 && (
                        <th
                          onClick={() => {
                            setTempTimings(periodTimings);
                            setIsEditingTimings(true);
                          }}
                          title="Click to edit recess timing"
                          className="p-2.5 text-center border bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/30 text-emerald-300 min-w-[115px] cursor-pointer group transition-all"
                        >
                          <div className="flex items-center justify-center gap-1.5 font-bold text-xs text-emerald-300">
                            <Coffee className="w-3.5 h-3.5 text-emerald-400" />
                            <span>RECESS</span>
                            <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                          </div>
                          <div className="text-[10px] font-mono font-semibold text-emerald-300 mt-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 inline-block whitespace-nowrap">
                            {periodTimings[0]?.time || '11:00 AM - 11:20 AM'}
                          </div>
                          <div className="text-[9px] text-emerald-400 mt-1">
                            Lunch & Interval
                          </div>
                        </th>
                      )}
                    </React.Fragment>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day}>
                  <td className="td-tt-period font-bold text-center">
                    {day}
                  </td>
                  {PERIODS.map(p => {
                    const slot = getSlot(day, p);
                    const isFree = !slot || !slot.className || slot.className.toLowerCase().includes('free');
                    const isBreak = slot?.isBreak;
                    const isPeriod9 = p === 9;
                    const cellKey = `${day}-${p}`;
                    const isSelected = selectedSlotKeys.includes(cellKey);

                    return (
                      <React.Fragment key={p}>
                        <td
                          onClick={() => handleCellClick(day, p)}
                          className={`transition-all cursor-pointer p-2.5 border text-center relative ${
                            isSelected
                              ? 'bg-rose-500/30 border-rose-500 text-white ring-2 ring-rose-400'
                              : isPeriod9
                              ? isFree
                                ? 'bg-amber-950/10 hover:bg-amber-950/30 border-amber-500/20 text-amber-300'
                                : 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/30 text-amber-200'
                              : isBreak
                              ? 'bg-amber-950/30 hover:bg-amber-900/40 border-amber-500/30 text-amber-200'
                              : isFree
                              ? 'bg-transparent hover:bg-white/5 border-[var(--glass-border)] text-[var(--text-dim)]'
                              : 'bg-purple-950/40 hover:bg-purple-900/50 border-purple-500/30 hover:border-purple-400 text-purple-200'
                          }`}
                        >
                          {slot && !isGridSelectMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopySlotData(slot);
                              }}
                              title="Copy this period details"
                              className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 p-1 rounded bg-white/10 hover:bg-white/20 text-purple-300 transition-opacity z-10 cursor-pointer"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                          )}

                          {isGridSelectMode && (
                            <div className="absolute top-1 right-1 z-10">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-rose-400 fill-rose-950" />
                              ) : (
                                <Square className="w-4 h-4 text-[var(--text-dim)] opacity-60 hover:opacity-100" />
                              )}
                            </div>
                          )}

                          {slot ? (
                            <div className="space-y-1 text-center">
                              <div className="font-bold text-xs text-white truncate tracking-tight">
                                {viewMode === 'teacher' ? slot.className : slot.subjectName}
                              </div>
                              <div>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold truncate ${
                                  isSelected
                                    ? 'bg-rose-900/60 text-rose-200 border border-rose-500/30'
                                    : isPeriod9
                                    ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                    : isBreak
                                    ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                    : 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                                }`}>
                                  {viewMode === 'teacher' ? slot.subjectName : slot.className}
                                </span>
                              </div>
                              {slot.teacherName && (
                                <div className="text-[10px] font-bold text-purple-300 truncate max-w-[130px] mx-auto bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/30">
                                  👨‍🏫 {slot.teacherName}
                                </div>
                              )}
                              <div className={`text-[10px] font-mono ${
                                isSelected
                                  ? 'text-rose-200'
                                  : isPeriod9
                                  ? 'text-amber-300'
                                  : isBreak
                                  ? 'text-amber-300'
                                  : 'text-[var(--text-dim)]'
                              }`}>
                                {slot.roomNo}
                              </div>
                            </div>
                          ) : (
                            <span className={`empty text-[11px] ${
                              isSelected
                                ? 'text-rose-300'
                                : isPeriod9 ? 'text-amber-400 hover:text-amber-300' : 'text-[var(--text-dim)] hover:text-purple-300'
                            }`}>
                              {isPeriod9
                                ? '+ Add Remedial'
                                : viewMode === 'class'
                                ? `+ Add Period (${selectedClass})`
                                : '+ Add'}
                            </span>
                          )}
                        </td>

                        {/* DEDICATED RECESS CELL AFTER PERIOD 4 */}
                        {p === 4 && (
                          <td
                            onClick={() => {
                              setTempTimings(periodTimings);
                              setIsEditingTimings(true);
                            }}
                            title="Click to edit recess timing"
                            className="bg-emerald-950/30 border border-emerald-500/20 text-center p-2 text-emerald-300 align-middle hover:bg-emerald-950/50 cursor-pointer transition-all"
                          >
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <Coffee className="w-4 h-4 text-emerald-400" />
                              <span className="font-bold text-[11px] uppercase tracking-wider text-emerald-300">RECESS</span>
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                                {periodTimings[0]?.time || '11:00 AM - 11:20 AM'}
                              </span>
                            </div>
                          </td>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT PERIOD TIMINGS MODAL */}
      {isEditingTimings && (
        <div className="td-modal">
          <div className="td-modal-body max-w-2xl">
            <div className="td-modal-head">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <h2>Configure Period Timings (Start - End Time)</h2>
              </div>
              <button onClick={() => setIsEditingTimings(false)}>✕</button>
            </div>
            <div className="p-6 td-form space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                <div className="text-xs font-bold text-purple-200 flex items-center justify-between">
                  <span>Quick Bell Schedule Presets:</span>
                  <span className="text-[10px] text-purple-300 font-mono">One-click auto fill</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTempTimings({
                      1: { time: '08:20 AM - 09:00 AM', label: 'Period 1' },
                      2: { time: '09:00 AM - 09:40 AM', label: 'Period 2' },
                      3: { time: '09:40 AM - 10:20 AM', label: 'Period 3' },
                      4: { time: '10:20 AM - 11:00 AM', label: 'Period 4 (Recess After)' },
                      0: { time: '11:00 AM - 11:20 AM', label: 'Recess / Lunch Break' },
                      5: { time: '11:20 AM - 12:00 PM', label: 'Period 5' },
                      6: { time: '12:00 PM - 12:40 PM', label: 'Period 6' },
                      7: { time: '12:40 PM - 01:20 PM', label: 'Period 7' },
                      8: { time: '01:20 PM - 02:00 PM', label: 'Period 8' },
                      9: { time: '02:00 PM - 02:45 PM', label: 'Period 9 (Remedial / Extra Class)' },
                    })}
                    className="px-2.5 py-1 rounded-lg bg-purple-900/60 hover:bg-purple-800 border border-purple-500/40 text-purple-100 text-[11px] font-bold cursor-pointer transition-all"
                  >
                    KVS Standard Shift (08:20 AM - 02:45 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempTimings({
                      1: { time: '07:30 AM - 08:10 AM', label: 'Period 1' },
                      2: { time: '08:10 AM - 08:50 AM', label: 'Period 2' },
                      3: { time: '08:50 AM - 09:30 AM', label: 'Period 3' },
                      4: { time: '09:30 AM - 10:10 AM', label: 'Period 4 (Recess After)' },
                      0: { time: '10:10 AM - 10:30 AM', label: 'Recess / Lunch Break' },
                      5: { time: '10:30 AM - 11:10 AM', label: 'Period 5' },
                      6: { time: '11:10 AM - 11:50 AM', label: 'Period 6' },
                      7: { time: '11:50 AM - 12:30 PM', label: 'Period 7' },
                      8: { time: '12:30 PM - 01:10 PM', label: 'Period 8' },
                      9: { time: '01:10 PM - 01:55 PM', label: 'Period 9 (Remedial / Extra Class)' },
                    })}
                    className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-100 text-[11px] font-bold cursor-pointer transition-all"
                  >
                    KVS Summer Shift (07:30 AM - 01:55 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempTimings({
                      1: { time: '08:40 AM - 09:20 AM', label: 'Period 1' },
                      2: { time: '09:20 AM - 10:00 AM', label: 'Period 2' },
                      3: { time: '10:00 AM - 10:40 AM', label: 'Period 3' },
                      4: { time: '10:40 AM - 11:20 AM', label: 'Period 4 (Recess After)' },
                      0: { time: '11:20 AM - 11:40 AM', label: 'Recess / Lunch Break' },
                      5: { time: '11:40 AM - 12:20 PM', label: 'Period 5' },
                      6: { time: '12:20 PM - 01:00 PM', label: 'Period 6' },
                      7: { time: '01:00 PM - 01:40 PM', label: 'Period 7' },
                      8: { time: '01:40 PM - 02:20 PM', label: 'Period 8' },
                      9: { time: '02:20 PM - 03:05 PM', label: 'Period 9 (Remedial / Extra Class)' },
                    })}
                    className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900 border border-blue-500/40 text-blue-100 text-[11px] font-bold cursor-pointer transition-all"
                  >
                    KVS Winter Shift (08:40 AM - 03:05 PM)
                  </button>
                </div>
              </div>

              <p className="text-xs text-[var(--text-dim)] m-0">
                Customize the bell timing ranges for Periods 1 through 9 as well as Recess. These will appear in the top row of the weekly timetable and reports.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4, 0, 5, 6, 7, 8, 9].map(p => {
                  if (p === 0) {
                    return (
                      <div key={0} className="p-3 rounded-xl border bg-emerald-950/30 border-emerald-500/40 col-span-1 sm:col-span-2 shadow-xs">
                        <label className="text-xs font-bold text-emerald-300 flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Coffee className="w-3.5 h-3.5 text-emerald-400" />
                            Recess / Lunch Interval Time
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase">Break (After Period 4)</span>
                        </label>
                        <input
                          type="text"
                          value={tempTimings[0]?.time || ''}
                          onChange={e => setTempTimings({
                            ...tempTimings,
                            0: { time: e.target.value, label: 'Recess / Lunch Break' }
                          })}
                          placeholder="e.g. 11:00 AM - 11:20 AM"
                          className="text-xs font-mono font-bold bg-emerald-950/60 border-emerald-500/40 text-emerald-100 focus:border-emerald-400"
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={p} className={`p-3 rounded-xl border ${p === 9 ? 'bg-amber-950/20 border-amber-500/30' : 'bg-purple-950/20 border-purple-500/20'}`}>
                      <label className="text-xs font-bold text-purple-300 flex items-center justify-between mb-1.5">
                        <span>Period {p} {p === 9 ? '(Remedial / Extra Class)' : ''}</span>
                        <span className="text-[10px] font-mono text-[var(--text-dim)]">Slot {p}</span>
                      </label>
                      <input
                        type="text"
                        value={tempTimings[p]?.time || ''}
                        onChange={e => setTempTimings({
                          ...tempTimings,
                          [p]: { ...tempTimings[p], time: e.target.value }
                        })}
                        placeholder="e.g. 08:20 AM - 09:00 AM"
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="td-modal-foot">
              <button onClick={() => setIsEditingTimings(false)} className="td-btn-ghost">
                Cancel
              </button>
              <button onClick={handleSaveTimings} className="td-add-btn cursor-pointer">
                <Save className="w-4 h-4" />
                <span>Save Timings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Modal */}
      {isSlotModalOpen && (
        <div className="td-modal">
          <div className="td-modal-body">
            <div className="td-modal-head">
              <h2>
                Edit Schedule Slot ({activeSlot.day} - Period {activeSlot.period})
                {activeSlot.period === 9 && <span className="ml-2 text-xs text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">Remedial / Extra Class</span>}
              </h2>
              <button onClick={() => setIsSlotModalOpen(false)}>✕</button>
            </div>
            <div className="p-8 td-form space-y-4">
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-bold">Period {activeSlot.period} Timing:</span>{' '}
                  <span className="font-mono text-purple-300 font-bold">{periodTimings[activeSlot.period]?.time || 'Custom Time'}</span>
                </div>
                {activeSlot.period === 9 && (
                  <span className="text-[10px] text-amber-300 font-bold">Extra Class / Remedial Period</span>
                )}
              </div>

              {/* Copy & Paste Quick Bar */}
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleCopySlotData(activeSlot)}
                  className="px-3 py-1.5 rounded-lg bg-purple-900/80 hover:bg-purple-800 border border-purple-400/40 text-purple-100 font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-purple-300" />
                  <span>Copy Period Details</span>
                </button>

                {copiedSlotData && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSlot({
                        ...activeSlot,
                        className: copiedSlotData.className,
                        subjectName: copiedSlotData.subjectName,
                        roomNo: copiedSlotData.roomNo || '',
                        isBreak: copiedSlotData.isBreak || false,
                      });
                      setMsg({ type: 'success', text: 'Pasted copied period details into fields!' });
                      setTimeout(() => setMsg(null), 2500);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste Copied: "{copiedSlotData.className} - {copiedSlotData.subjectName}"</span>
                  </button>
                )}
              </div>

              {activeSlot.period === 9 && (
                <div>
                  <label className="text-xs font-bold text-amber-300 mb-1 block">Quick Period 9 Presets:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Remedial Class / Extra Time Needed',
                      'Slow Learners Board Prep',
                      'Competency Doubt Clearing',
                      'Sports & P&HE Extra Coaching',
                      'Free / Self Study'
                    ].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setActiveSlot({ ...activeSlot, subjectName: preset })}
                        className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 hover:bg-amber-900 text-amber-200 text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Class & Section</label>
                  <input
                    type="text"
                    value={activeSlot.className}
                    onChange={e => setActiveSlot({ ...activeSlot, className: e.target.value })}
                    placeholder="e.g. X-A or Free / Planning"
                  />
                </div>
                <div>
                  <label>Subject / Activity</label>
                  <input
                    type="text"
                    value={activeSlot.subjectName}
                    onChange={e => setActiveSlot({ ...activeSlot, subjectName: e.target.value })}
                    placeholder="e.g. Mathematics or Remedial Support"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Room / Venue</label>
                  <input
                    type="text"
                    value={activeSlot.roomNo}
                    onChange={e => setActiveSlot({ ...activeSlot, roomNo: e.target.value })}
                    placeholder="e.g. Room 24 or Math Lab"
                  />
                </div>
                <div>
                  <label>Assigned Teacher / Faculty</label>
                  <select
                    value={activeSlot.teacherName || ''}
                    onChange={e => {
                      const val = e.target.value;
                      const matched = staffRegistry.find(s => s.name === val);
                      setActiveSlot({
                        ...activeSlot,
                        teacherName: val,
                        teacherId: matched?.employeeCode || activeSlot.teacherId
                      });
                    }}
                  >
                    <option value="">-- Select Faculty Member --</option>
                    {allTeachers.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="breakCheck"
                  checked={activeSlot.isBreak || false}
                  onChange={e => setActiveSlot({ ...activeSlot, isBreak: e.target.checked })}
                  className="w-4 h-4 text-purple-500 rounded"
                />
                <label htmlFor="breakCheck" className="normal-case text-sm text-[var(--text-main)] cursor-pointer">
                  Recess / Snack Break Slot
                </label>
              </div>
            </div>
            <div className="td-modal-foot flex justify-between items-center">
              <button
                type="button"
                onClick={handleDeleteActiveSlot}
                className="px-3.5 py-2 rounded-xl bg-rose-950/80 border border-rose-500/50 hover:bg-rose-900 text-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Remove / Delete Slot</span>
              </button>

              <div className="flex items-center gap-2">
                <button onClick={() => setIsSlotModalOpen(false)} className="td-btn-ghost">
                  Cancel
                </button>
                <button onClick={handleSaveSlot} className="td-add-btn cursor-pointer">
                  <Save className="w-4 h-4" />
                  <span>Save Slot</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Bulk Clear & Batch Delete Modal */}
      {isBulkDeleteOpen && (
        <div className="td-modal">
          <div className="td-modal-body max-w-2xl">
            <div className="td-modal-head">
              <h2 className="flex items-center gap-2 text-rose-300">
                <Eraser className="w-5 h-5 text-rose-400" />
                <span>Quick Bulk Clear & Batch Remove Periods</span>
              </h2>
              <button onClick={() => setIsBulkDeleteOpen(false)}>✕</button>
            </div>

            <div className="p-6 td-form space-y-6 max-h-[75vh] overflow-y-auto">
              {/* SECTION 1: 1-CLICK BATCH CLEAR PRESETS */}
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                  <span className="font-extrabold text-xs uppercase tracking-wider text-rose-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    1-Click Batch Removal Presets
                  </span>
                  <span className="text-[10px] text-rose-300 font-mono">Instant Bulk Action</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleClearByPreset('period9')}
                    className="p-2.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-between cursor-pointer transition-all text-left"
                  >
                    <span>Clear All Period 9 (Remedial / Extra) Slots</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/30 font-mono text-[10px]">
                      {timetable.filter(s => s.period === 9).length} slots
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleClearByPreset('saturday')}
                    className="p-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center justify-between cursor-pointer transition-all text-left"
                  >
                    <span>Clear All Saturday Slots</span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/30 font-mono text-[10px]">
                      {timetable.filter(s => s.day === 'Saturday').length} slots
                    </span>
                  </button>
                </div>

                {/* FILTERED CLEARING */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Clear by Class */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-rose-200 block">Clear By Class / Section:</label>
                    <div className="flex gap-1.5">
                      <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        className="text-xs bg-slate-900 border-rose-500/40 text-rose-100 py-1"
                      >
                        <option value="ALL">Select Class...</option>
                        {uniqueClasses.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={filterClass === 'ALL'}
                        onClick={() => handleClearByPreset('class')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                          filterClass !== 'ALL'
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/40 cursor-not-allowed'
                        }`}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Clear by Subject */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-rose-200 block">Clear By Subject:</label>
                    <div className="flex gap-1.5">
                      <select
                        value={filterSubject}
                        onChange={e => setFilterSubject(e.target.value)}
                        className="text-xs bg-slate-900 border-rose-500/40 text-rose-100 py-1"
                      >
                        <option value="ALL">Select Subject...</option>
                        {uniqueSubjects.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={filterSubject === 'ALL'}
                        onClick={() => handleClearByPreset('subject')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                          filterSubject !== 'ALL'
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-rose-950 text-rose-400 border border-rose-800/40 cursor-not-allowed'
                        }`}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* FULL RESET */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleClearByPreset('all')}
                    className="px-3 py-1.5 rounded-lg bg-rose-900/90 hover:bg-rose-800 border border-rose-500 text-rose-100 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Wipe Entire Timetable Grid (Clear All {timetable.length} Slots)</span>
                  </button>
                </div>
              </div>

              {/* SECTION 2: SEARCH & SELECT SPECIFIC SLOTS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs uppercase tracking-wider text-purple-200 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-purple-400" />
                    Search & Select Specific Periods to Delete
                  </span>
                  <span className="text-[11px] font-mono text-purple-300">
                    {timetable.length} Total Assigned Slots
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search periods by Class (e.g. X-A), Subject (e.g. Math), Day (e.g. Monday)..."
                    className="pl-9 text-xs bg-purple-950/40 border-purple-500/30 focus:border-purple-400"
                  />
                </div>

                {/* Slots Checklist Table */}
                <div className="border border-purple-500/30 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto bg-purple-950/20">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-purple-950/60 text-purple-200 sticky top-0 border-b border-purple-500/30 font-bold">
                      <tr>
                        <th className="p-2 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              timetable.length > 0 &&
                              selectedSlotKeys.length ===
                                timetable.filter(s =>
                                  !searchTerm ||
                                  s.day.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  s.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  s.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length
                            }
                            onChange={e => {
                              const filtered = timetable.filter(s =>
                                !searchTerm ||
                                s.day.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                s.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                s.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
                              );
                              if (e.target.checked) {
                                setSelectedSlotKeys(filtered.map(s => `${s.day}-${s.period}`));
                              } else {
                                setSelectedSlotKeys([]);
                              }
                            }}
                            className="w-3.5 h-3.5 rounded text-rose-500"
                          />
                        </th>
                        <th className="p-2">Day & Period</th>
                        <th className="p-2">Class</th>
                        <th className="p-2">Subject</th>
                        <th className="p-2">Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-500/20">
                      {timetable
                        .filter(s =>
                          !searchTerm ||
                          s.day.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(s => {
                          const key = `${s.day}-${s.period}`;
                          const checked = selectedSlotKeys.includes(key);
                          return (
                            <tr
                              key={key}
                              onClick={() => {
                                if (checked) {
                                  setSelectedSlotKeys(selectedSlotKeys.filter(k => k !== key));
                                } else {
                                  setSelectedSlotKeys([...selectedSlotKeys, key]);
                                }
                              }}
                              className={`cursor-pointer hover:bg-purple-900/40 transition-colors ${
                                checked ? 'bg-rose-950/60 font-semibold' : ''
                              }`}
                            >
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {}}
                                  className="w-3.5 h-3.5 rounded text-rose-500 cursor-pointer"
                                />
                              </td>
                              <td className="p-2 font-mono font-bold text-purple-200">
                                {s.day} (Period {s.period})
                              </td>
                              <td className="p-2 font-bold text-amber-300">{s.className}</td>
                              <td className="p-2 text-slate-200">{s.subjectName}</td>
                              <td className="p-2 text-slate-400 font-mono">{s.roomNo || '-'}</td>
                            </tr>
                          );
                        })}
                      {timetable.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                            No periods found in the timetable.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="td-modal-foot flex justify-between items-center">
              <span className="text-xs text-rose-300 font-mono font-bold">
                {selectedSlotKeys.length} slot(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsBulkDeleteOpen(false)} className="td-btn-ghost">
                  Close
                </button>
                <button
                  disabled={selectedSlotKeys.length === 0}
                  onClick={async () => {
                    await handleDeleteSelectedSlots();
                    setIsBulkDeleteOpen(false);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all ${
                    selectedSlotKeys.length > 0
                      ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                      : 'bg-rose-900/40 text-rose-300/40 border border-rose-800/40 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove Selected ({selectedSlotKeys.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Timetable Importer Modal */}
      <ExcelTimetableImporter
        isOpen={isExcelImporterOpen}
        onClose={() => setIsExcelImporterOpen(false)}
        onImportSuccess={handleExcelImportSuccess}
      />
    </div>
  );
};
