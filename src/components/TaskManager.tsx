import React, { useState, useEffect, useRef } from 'react';
import {
  db,
  DEFAULT_TASKS,
  DEFAULT_DUTY_PRESETS,
  DEFAULT_TASK_LISTS,
  getAllAvailableTags,
  getTeacherPersonalTags,
  saveTeacherPersonalTags,
  saveGlobalAdminTags,
  getGlobalAdminTags
} from '../lib/storage';
import {
  TeacherTask,
  TaskSubtask,
  EisenhowerPriority,
  HourlyCategory,
  DutyPreset,
  TaskList,
  TaskTagDefinition,
  TimetableSlot,
  TeacherProfile,
  StaffDetailRecord,
  TeacherAttendanceRecord,
  LeaveApplication,
  OnDutyRecord,
  ProxyDutyAssignment,
  SubjectResponsibilityAssignment,
  CampusDutyAssignment
} from '../types/academic';
import { UserAccount } from '../types/auth';
import { isTeacherAvailableForDeadline, checkTeacherAbsenceOnDate, normalizeFacultyKey } from '../lib/attendanceAbsenceEngine';
import { parseSmartDate, ParsedDateResult } from '../lib/smartDateParser';
import { getTeacherScopedStorageKey, getActiveInspectedTeacher } from '../lib/teacherContext';
import { useActiveWorkingDate } from '../lib/activeDateContext';
import {
  getUnifiedTeachingPeriodsForTeacher,
  convertTeachingPeriodsToTasks,
  convertCampusDutiesToTasks,
  filterAuthenticTeacherTasks,
  checkTeachingPeriodOverlap,
  UnifiedTeachingPeriod
} from '../lib/unifiedTeacherScheduleEngine';
import {
  DEFAULT_PROXY_DUTIES,
  DEFAULT_SUBJECT_RESPONSIBILITIES,
  DEFAULT_TIMETABLE,
  DEFAULT_STAFF_DETAILS
} from '../lib/storage';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  Zap,
  Tag,
  UserCheck,
  RotateCcw,
  Bot,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  ListTodo,
  Grid,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Mic,
  Share2,
  FileText,
  Inbox,
  CalendarDays,
  Sunrise,
  Layers,
  Flag,
  Folder,
  Send,
  MoreHorizontal,
  FolderPlus,
  Check,
  X,
  Settings,
  Sliders,
  CalendarCheck,
  HelpCircle,
  Keyboard,
  Info,
  Shield,
  ShieldCheck,
  Lock
} from 'lucide-react';

interface TaskManagerProps {
  devMode: boolean;
  currentUser?: UserAccount | null;
  onSyncToWorkload?: (task: TeacherTask) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ devMode, currentUser, onSyncToWorkload }) => {
  const { activeDate: activeWorkingDate, activeDayName } = useActiveWorkingDate();
  const [tasks, setTasks] = useState<TeacherTask[]>([]);
  const [unifiedTeachingPeriods, setUnifiedTeachingPeriods] = useState<UnifiedTeachingPeriod[]>([]);
  const [activeView, setActiveView] = useState<'matrix' | 'list' | 'recurring' | 'ai'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TeacherTask | null>(null);
  
  // New task form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<HourlyCategory>('Teaching');
  const [formPriority, setFormPriority] = useState<EisenhowerPriority>('Do First (Urgent & Important)');
  const [formStatus, setFormStatus] = useState<'Pending' | 'In Progress' | 'Completed' | 'Deferred'>('Pending');
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueTime, setFormDueTime] = useState('12:00');
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState(45);
  const [formTags, setFormTags] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('Self');
  const [formLinkedClass, setFormLinkedClass] = useState('');
  const [formLinkedSubject, setFormLinkedSubject] = useState('');
  const [formListId, setFormListId] = useState<string>('inbox');
  const [formOverloadImpact, setFormOverloadImpact] = useState(false);
  const [formSubtasks, setFormSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // AI & Voice Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  // Duty Presets State & Form
  const [dutyPresets, setDutyPresets] = useState<DutyPreset[]>([]);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<DutyPreset | null>(null);

  const [presetTitle, setPresetTitle] = useState('');
  const [presetDesc, setPresetDesc] = useState('');
  const [presetCategory, setPresetCategory] = useState<HourlyCategory>('Assembly & Duty');
  const [presetPriority, setPresetPriority] = useState<EisenhowerPriority>('Do First (Urgent & Important)');
  const [presetEstMinutes, setPresetEstMinutes] = useState(45);
  const [presetFrequency, setPresetFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [presetSubtasks, setPresetSubtasks] = useState<string[]>([]);
  const [newPresetSubtaskInput, setNewPresetSubtaskInput] = useState('');

  // Task Lists State (TickTick-style lists & smart filters)
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('inbox');
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#3b82f6');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListName, setEditListName] = useState('');
  const [editListColor, setEditListColor] = useState('#3b82f6');

  // Smart Recognition Settings & State
  const [smartRecognitionEnabled, setSmartRecognitionEnabled] = useState(true);
  const [stripDateFromTitle, setStripDateFromTitle] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [smartParsedResult, setSmartParsedResult] = useState<ParsedDateResult | null>(null);
  const [isSmartDateIgnored, setIsSmartDateIgnored] = useState(false);

  // TickTick Quick-Add Input State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [isQuickAddExpanded, setIsQuickAddExpanded] = useState(false);
  const [quickDueDate, setQuickDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickDueTime, setQuickDueTime] = useState('12:00');
  const [quickPriority, setQuickPriority] = useState<EisenhowerPriority>('Do First (Urgent & Important)');
  const [quickCategory, setQuickCategory] = useState<HourlyCategory>('Teaching');
  const [quickEstimatedMinutes, setQuickEstimatedMinutes] = useState(45);
  const [quickAssignedTo, setQuickAssignedTo] = useState('Self');

  const formEndMinutes = React.useMemo(() => {
    if (!formDueTime) return '12:40';
    const [h, m] = formDueTime.split(':').map(Number);
    const totalM = (h || 0) * 60 + (m || 0) + (formEstimatedMinutes || 40);
    const endH = String(Math.floor(totalM / 60) % 24).padStart(2, '0');
    const endM = String(totalM % 60).padStart(2, '0');
    return `${endH}:${endM}`;
  }, [formDueTime, formEstimatedMinutes]);

  const modalOverlapInfo = React.useMemo(() => {
    if (formCategory === 'Teaching' || formDueDate !== activeWorkingDate) {
      return { hasOverlap: false };
    }
    return checkTeachingPeriodOverlap(formDueTime, formEndMinutes, unifiedTeachingPeriods);
  }, [formDueTime, formEndMinutes, unifiedTeachingPeriods, formCategory, formDueDate, activeWorkingDate]);

  const [quickListId, setQuickListId] = useState<string>('inbox');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showListPicker, setShowListPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [isQuickListening, setIsQuickListening] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showTipsTooltip, setShowTipsTooltip] = useState(false);

  // Dynamic Tag / Category System (Admin & Teacher Scoped)
  const [availableTags, setAvailableTags] = useState<TaskTagDefinition[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#8b5cf6');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('#8b5cf6');
  const [tagSuccessMsg, setTagSuccessMsg] = useState<string | null>(null);

  const quickTitleInputRef = useRef<HTMLInputElement>(null);
  const quickDescInputRef = useRef<HTMLTextAreaElement>(null);
  const quickAddContainerRef = useRef<HTMLFormElement>(null);

  const [activeInspectedTeacher, setActiveInspectedTeacher] = useState<StaffDetailRecord | null>(null);
  const [staffList, setStaffList] = useState<StaffDetailRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [onDutyRecords, setOnDutyRecords] = useState<OnDutyRecord[]>([]);
  const teacherCode = currentUser?.employeeCode;
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    const initData = async () => {
      const inspected = currentUser?.role === 'admin' ? (await getActiveInspectedTeacher()) : null;
      setActiveInspectedTeacher(inspected);
      const code = (currentUser?.role === 'admin' && inspected?.employeeCode) ? inspected.employeeCode : (currentUser?.employeeCode || '108894');
      await loadTasks(code);
      await loadPresets();
      await loadTaskLists();
      await loadSmartSettings();
      await loadAvailableTags(code);

      // Load faculty and attendance data for deadline availability checking
      try {
        const [staffData, attData, leaveData, odData] = await Promise.all([
          db.get<StaffDetailRecord[]>('setup:staff_details'),
          db.get<TeacherAttendanceRecord[]>('setup:teacher_attendance'),
          db.get<LeaveApplication[]>('setup:leave_applications'),
          db.get<OnDutyRecord[]>('setup:on_duty_records')
        ]);
        if (staffData) setStaffList(staffData);
        if (attData) setAttendanceRecords(attData);
        if (leaveData) setLeaveApplications(leaveData);
        if (odData) setOnDutyRecords(odData);
      } catch (err) {
        console.error('Error loading staff attendance for tasks:', err);
      }
    };
    initData();

    const handleTimetableUpdate = async () => {
      const inspected = currentUser?.role === 'admin' ? (await getActiveInspectedTeacher()) : null;
      const code = (currentUser?.role === 'admin' && inspected?.employeeCode) ? inspected.employeeCode : (currentUser?.employeeCode || '108894');
      await loadTasks(code);
    };

    const handleTeacherChanged = async (e: any) => {
      if (currentUser?.role !== 'admin') return;
      const inspected = e.detail || (await getActiveInspectedTeacher());
      setActiveInspectedTeacher(inspected);
      const code = inspected?.employeeCode || '108894';
      await loadTasks(code);
      await loadAvailableTags(code);
    };

    window.addEventListener('kvs-timetable-updated', handleTimetableUpdate);
    window.addEventListener('kvs-auth-changed', handleTimetableUpdate);
    window.addEventListener('kvs-active-teacher-changed', handleTeacherChanged);

    return () => {
      window.removeEventListener('kvs-timetable-updated', handleTimetableUpdate);
      window.removeEventListener('kvs-auth-changed', handleTimetableUpdate);
      window.removeEventListener('kvs-active-teacher-changed', handleTeacherChanged);
    };
  }, [currentUser?.employeeCode, currentUser?.role]);

  const loadAvailableTags = async (overrideTeacherCode?: string) => {
    try {
      const codeToUse = overrideTeacherCode || activeInspectedTeacher?.employeeCode || teacherCode;
      const tags = await getAllAvailableTags(codeToUse);
      setAvailableTags(tags);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  const showTagFeedback = (msg: string) => {
    setTagSuccessMsg(msg);
    setTimeout(() => setTagSuccessMsg(null), 3000);
  };

  // Create Tag (Admin creates global tag, Teacher creates personal tag)
  const handleCreateCustomTag = async () => {
    if (!newTagName.trim()) return;
    const name = newTagName.trim();

    if (isAdmin) {
      const globalTags = await getGlobalAdminTags();
      const newTag: TaskTagDefinition = {
        id: `tag-admin-${Date.now()}`,
        name,
        source: 'admin',
        color: newTagColor,
        isImmutableForTeacher: true,
        createdById: 'admin'
      };
      await saveGlobalAdminTags([...globalTags, newTag]);
      showTagFeedback(`Created Admin Tag "${name}"`);
    } else {
      const personal = await getTeacherPersonalTags(teacherCode);
      const newTag: TaskTagDefinition = {
        id: `tag-t-${Date.now()}`,
        name,
        source: 'teacher',
        color: newTagColor,
        isImmutableForTeacher: false,
        createdById: teacherCode || 'teacher'
      };
      await saveTeacherPersonalTags(teacherCode || 'teacher', [...personal, newTag]);
      showTagFeedback(`Created Personal Tag "${name}"`);
    }

    setNewTagName('');
    setIsAddingTag(false);
    await loadAvailableTags();
  };

  // Update Tag (Admin can edit admin tags; Teacher can edit only their own personal tags)
  const handleUpdateCustomTag = async (tag: TaskTagDefinition) => {
    if (!editTagName.trim()) return;
    const newName = editTagName.trim();

    if (tag.source === 'admin') {
      if (!isAdmin) {
        alert('Admin-assigned tags cannot be renamed by teachers.');
        return;
      }
      const globalTags = await getGlobalAdminTags();
      const updated = globalTags.map(t => (t.id === tag.id ? { ...t, name: newName, color: editTagColor } : t));
      await saveGlobalAdminTags(updated);
      showTagFeedback(`Updated Admin Tag "${newName}"`);
    } else {
      const personal = await getTeacherPersonalTags(teacherCode);
      const updated = personal.map(t => (t.id === tag.id ? { ...t, name: newName, color: editTagColor } : t));
      await saveTeacherPersonalTags(teacherCode || 'teacher', updated);
      showTagFeedback(`Updated Personal Tag "${newName}"`);
    }

    setEditingTagId(null);
    await loadAvailableTags();
  };

  // Delete Tag (Admin can delete admin tags; Teacher can delete only their own personal tags)
  const handleDeleteCustomTag = async (tag: TaskTagDefinition) => {
    if (tag.source === 'admin' && !isAdmin) {
      alert('Admin-assigned roles and institutional tags cannot be removed by teachers.');
      return;
    }

    if (!window.confirm(`Delete tag "${tag.name}"?`)) return;

    if (tag.source === 'admin') {
      const globalTags = await getGlobalAdminTags();
      const updated = globalTags.filter(t => t.id !== tag.id);
      await saveGlobalAdminTags(updated);
      showTagFeedback(`Deleted Admin Tag "${tag.name}"`);
    } else {
      const personal = await getTeacherPersonalTags(teacherCode);
      const updated = personal.filter(t => t.id !== tag.id);
      await saveTeacherPersonalTags(teacherCode || 'teacher', updated);
      showTagFeedback(`Deleted Personal Tag "${tag.name}"`);
    }

    await loadAvailableTags();
  };

  const loadSmartSettings = async () => {
    try {
      const recEnabled = await db.get<boolean>('settings:smart_recognition_enabled');
      if (recEnabled !== null && recEnabled !== undefined) {
        setSmartRecognitionEnabled(recEnabled);
      }
      const stripEnabled = await db.get<boolean>('settings:smart_recognition_strip_text');
      if (stripEnabled !== null && stripEnabled !== undefined) {
        setStripDateFromTitle(stripEnabled);
      }
    } catch (err) {
      console.error('Error loading smart recognition settings:', err);
    }
  };

  const handleToggleSmartRecognition = async (enabled: boolean) => {
    setSmartRecognitionEnabled(enabled);
    await db.set('settings:smart_recognition_enabled', enabled);
    if (!enabled) {
      setSmartParsedResult(null);
    } else {
      setIsSmartDateIgnored(false);
      if (quickTitle.trim()) {
        const parsed = parseSmartDate(quickTitle);
        if (parsed) {
          setSmartParsedResult(parsed);
          setQuickDueDate(parsed.dueDate);
          if (parsed.dueTime) {
            setQuickDueTime(parsed.dueTime);
          }
        }
      }
    }
  };

  const handleToggleStripDate = async (enabled: boolean) => {
    setStripDateFromTitle(enabled);
    await db.set('settings:smart_recognition_strip_text', enabled);
  };

  const loadTaskLists = async () => {
    try {
      const stored = await db.get<TaskList[]>('setup:task_lists');
      if (stored && stored.length > 0) {
        setTaskLists(stored);
      } else {
        await db.set('setup:task_lists', DEFAULT_TASK_LISTS);
        setTaskLists(DEFAULT_TASK_LISTS);
      }
    } catch (err) {
      console.error('Error loading task lists:', err);
      setTaskLists(DEFAULT_TASK_LISTS);
    }
  };

  const saveTaskLists = async (updated: TaskList[]) => {
    setTaskLists(updated);
    await db.set('setup:task_lists', updated);
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    const newList: TaskList = {
      id: `list_${Date.now()}`,
      name: newListName.trim(),
      type: 'regular',
      color: newListColor,
      icon: 'Folder',
      isSystem: false,
      sortOrder: taskLists.length + 1
    };
    const updated = [...taskLists, newList];
    await saveTaskLists(updated);
    setSelectedListId(newList.id);
    setNewListName('');
    setIsAddingList(false);
  };

  const handleStartEditList = (list: TaskList) => {
    setEditingListId(list.id);
    setEditListName(list.name);
    setEditListColor(list.color || '#3b82f6');
  };

  const handleUpdateList = async () => {
    if (!editingListId || !editListName.trim()) return;
    const updated = taskLists.map(l =>
      l.id === editingListId
        ? { ...l, name: editListName.trim(), color: editListColor }
        : l
    );
    await saveTaskLists(updated);
    setEditingListId(null);
  };

  const handleDeleteList = async (listId: string) => {
    if (confirm('Delete this list? Tasks assigned to it will be moved to Inbox.')) {
      const updatedLists = taskLists.filter(l => l.id !== listId);
      await saveTaskLists(updatedLists);
      
      // Reassign tasks from deleted list to Inbox
      const updatedTasks = tasks.map(t =>
        t.listId === listId ? { ...t, listId: 'inbox' } : t
      );
      await saveTasks(updatedTasks);
      
      if (selectedListId === listId) {
        setSelectedListId('inbox');
      }
    }
  };

  const handleFocusQuickAdd = () => {
    // Switch to list view so the full TickTick quick-add bar and lists are visible
    setActiveView('list');
    setIsQuickAddExpanded(true);
    setTimeout(() => {
      quickAddContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      quickTitleInputRef.current?.focus();
    }, 100);
  };

  // Live title change handler with Natural Language Date Recognition
  const handleQuickTitleChange = (val: string) => {
    setQuickTitle(val);

    if (smartRecognitionEnabled) {
      const parsed = parseSmartDate(val);
      if (parsed) {
        setSmartParsedResult(parsed);
        setIsSmartDateIgnored(false);
        setQuickDueDate(parsed.dueDate);
        if (parsed.dueTime) {
          setQuickDueTime(parsed.dueTime);
        }
      } else {
        setSmartParsedResult(null);
      }
    } else {
      setSmartParsedResult(null);
    }
  };

  // Remove/Cancel smart recognized date for current entry
  const handleCancelSmartDate = () => {
    setIsSmartDateIgnored(true);
    setSmartParsedResult(null);
    setQuickDueDate(new Date().toISOString().split('T')[0]);
    setQuickDueTime('12:00');
  };

  // Helper function to split compound task text into multiple discrete task clauses
  const splitCompoundTasks = (text: string): string[] => {
    if (!text || !text.trim()) return [];
    
    // Split by newlines, semicolons, or connective phrases like "and", "also", "then", "after that"
    const rawParts = text
      .split(/(?:\r?\n|;\s*|\s+(?:and\s+also|and\s+then|and|also|then|after\s+that)\s+)/i)
      .map(p => p.trim())
      .filter(p => p.length > 2);

    return rawParts.length > 0 ? rawParts : [text.trim()];
  };

  // Quick Task Creation Handler (TickTick UX with Multi-Task & Smart Recognition)
  const handleQuickAddTask = async () => {
    if (!quickTitle.trim()) return;

    // Determine target list & dynamic due date based on active list
    let targetListId = quickListId;
    if (!targetListId || targetListId === 'today' || targetListId === 'tomorrow' || targetListId === 'next_7_days' || targetListId === 'all' || targetListId === 'high_priority') {
      targetListId = selectedListId && !['today', 'tomorrow', 'next_7_days', 'all', 'high_priority'].includes(selectedListId)
        ? selectedListId
        : 'inbox';
    }

    const clauses = splitCompoundTasks(quickTitle.trim());
    const newCreatedTasks: TeacherTask[] = [];

    for (let i = 0; i < clauses.length; i++) {
      const clauseText = clauses[i];
      const parsed = smartRecognitionEnabled && !isSmartDateIgnored ? parseSmartDate(clauseText) : null;
      
      let finalDueDate = quickDueDate || new Date().toISOString().split('T')[0];
      let finalDueTime = quickDueTime || '12:00';
      let finalTitle = clauseText;
      const isSmart = !!parsed;

      if (parsed) {
        finalDueDate = parsed.dueDate;
        finalDueTime = parsed.dueTime || finalDueTime;
        if (stripDateFromTitle && parsed.cleanTitle) {
          finalTitle = parsed.cleanTitle;
        }
      } else if (clauses.length === 1 && smartParsedResult && !isSmartDateIgnored) {
        finalDueDate = smartParsedResult.dueDate;
        finalDueTime = smartParsedResult.dueTime || finalDueTime;
        if (stripDateFromTitle && smartParsedResult.cleanTitle) {
          finalTitle = smartParsedResult.cleanTitle;
        }
      } else if (selectedListId === 'tomorrow' && !showDatePicker) {
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        finalDueDate = tom.toISOString().split('T')[0];
      }

      // Auto category detection for compound items
      let itemCategory = quickCategory;
      const lower = clauseText.toLowerCase();
      if (lower.includes('gem') || lower.includes('procure') || lower.includes('envelope') || lower.includes('sanction')) {
        itemCategory = 'GeM Portal Admin';
      } else if (lower.includes('pt') || lower.includes('drill') || lower.includes('sport') || lower.includes('assembly')) {
        itemCategory = lower.includes('pt') || lower.includes('sport') ? 'Sports / RSM / NSM' : 'Assembly & Duty';
      }

      let calculatedPriority = quickPriority;
      if (selectedListId === 'high_priority' && !showPriorityPicker) {
        calculatedPriority = 'Do First (Urgent & Important)';
      }

      const newTask: TeacherTask = {
        id: `tsk-${Date.now()}-${i}`,
        title: finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1),
        originalTitle: isSmart ? clauseText : undefined,
        description: quickDesc.trim() || undefined,
        category: itemCategory,
        priority: calculatedPriority,
        status: 'Pending',
        dueDate: finalDueDate,
        dueTime: finalDueTime,
        listId: targetListId,
        estimatedMinutes: 45,
        isSmartRecognized: isSmart,
        recognizedDateText: parsed ? parsed.matchedText : undefined,
        subtasks: [],
        tags: isSmart ? ['Smart Parsed'] : [],
        assignedTo: 'Self',
        overloadImpact: itemCategory !== 'Teaching',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      newCreatedTasks.push(newTask);
    }

    const updated = [...newCreatedTasks, ...tasks];
    await saveTasks(updated);

    // Reset Quick Add input state but KEEP focus for continuous typing
    setQuickTitle('');
    setQuickDesc('');
    setSmartParsedResult(null);
    setIsSmartDateIgnored(false);
    setIsQuickAddExpanded(false);
    setShowDatePicker(false);
    setShowPriorityPicker(false);
    setShowListPicker(false);
    setShowCategoryPicker(false);
    
    // Maintain focus for fast continuous adding
    setTimeout(() => {
      if (quickTitleInputRef.current) {
        quickTitleInputRef.current.focus();
      }
    }, 50);
  };

  // Keyboard Navigation & Shortcut Handler for Quick Add
  const handleQuickTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Shift + Enter: Expand description without saving
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      setIsQuickAddExpanded(true);
      setTimeout(() => {
        quickDescInputRef.current?.focus();
      }, 50);
      return;
    }

    // Cmd + Enter or Ctrl + Enter: Save task
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleQuickAddTask();
      return;
    }

    // Enter alone: Save task immediately (TickTick UX)
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQuickAddTask();
      return;
    }

    // Escape: Collapse quick add bar
    if (e.key === 'Escape') {
      setIsQuickAddExpanded(false);
      setShowDatePicker(false);
      setShowPriorityPicker(false);
      setShowListPicker(false);
      setShowCategoryPicker(false);
    }
  };

  const handleQuickDescKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd + Enter or Ctrl + Enter: Save task
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleQuickAddTask();
      return;
    }

    // Escape: return focus to title
    if (e.key === 'Escape') {
      quickTitleInputRef.current?.focus();
    }
  };

  const loadTasks = async (targetEmpCode?: string) => {
    try {
      const inspected = currentUser?.role === 'admin' ? (await getActiveInspectedTeacher()) : null;
      const currentEmpCode = targetEmpCode || (currentUser?.role === 'admin' && inspected?.employeeCode ? inspected.employeeCode : (currentUser?.employeeCode || '108894'));
      const scopedTaskKey = getTeacherScopedStorageKey('setup:tasks', currentEmpCode);

      const [
        storedScoped,
        globalStored,
        timetable,
        staffDetailsList,
        proxyAssignments,
        subjectResponsibilities,
        attendanceRecords,
        leaveApplications,
        onDutyRecords,
        campusDuties
      ] = await Promise.all([
        db.get<TeacherTask[]>(scopedTaskKey),
        db.get<TeacherTask[]>('setup:tasks'),
        db.get<TimetableSlot[]>('setup:timetable'),
        db.get<StaffDetailRecord[]>('setup:staff_details'),
        db.get<ProxyDutyAssignment[]>('setup:proxy_duty_assignments'),
        db.get<SubjectResponsibilityAssignment[]>('setup:subject_responsibilities'),
        db.get<TeacherAttendanceRecord[]>('setup:teacher_attendance'),
        db.get<LeaveApplication[]>('setup:leave_applications'),
        db.get<OnDutyRecord[]>('setup:on_duty_records'),
        db.get<CampusDutyAssignment[]>('setup:campus_duty_assignments')
      ]);

      const allStaff = (staffDetailsList && staffDetailsList.length > 0) ? staffDetailsList : DEFAULT_STAFF_DETAILS;
      const matchedStaff = allStaff.find(s => s.employeeCode === currentEmpCode || (currentUser?.name && normalizeFacultyKey(s.name) === normalizeFacultyKey(currentUser.name)));
      const staffObj = matchedStaff || (currentUser?.role === 'admin' && inspected ? inspected : currentUser) || { employeeCode: currentEmpCode };

      let baseTasks: TeacherTask[] = [];

      if (storedScoped && Array.isArray(storedScoped)) {
        baseTasks = storedScoped;
      } else if (currentEmpCode === '108894' && globalStored && globalStored.length > 0) {
        // Updesh Singh Pal inherits existing tasks
        baseTasks = globalStored;
        await db.set(scopedTaskKey, globalStored);
      } else {
        // Other teachers start fresh with isolated task list
        baseTasks = [];
        await db.set(scopedTaskKey, []);
      }

      // Compute Unified Teaching Periods for target date
      const periods = getUnifiedTeachingPeriodsForTeacher({
        staff: staffObj,
        targetDate: activeWorkingDate,
        timetable: (timetable && timetable.length > 0) ? timetable : DEFAULT_TIMETABLE,
        proxyAssignments: proxyAssignments || DEFAULT_PROXY_DUTIES,
        subjectResponsibilities: subjectResponsibilities || DEFAULT_SUBJECT_RESPONSIBILITIES,
        attendanceRecords: attendanceRecords || [],
        leaveApplications: leaveApplications || [],
        onDutyRecords: onDutyRecords || []
      });

      setUnifiedTeachingPeriods(periods);

      // 1. Generate canonical tasks for today's periods (regular, support, confirmed proxy)
      const generatedTeachingTasks = convertTeachingPeriodsToTasks(periods, activeWorkingDate, baseTasks);

      // 2. Generate canonical campus duties (morning gate, recess, afternoon gate)
      const campusDutyTasks = convertCampusDutiesToTasks(campusDuties || [], activeWorkingDate, staffObj, baseTasks);

      // 3. Filter authentic non-teaching tasks (created by or explicitly assigned to this teacher)
      const teachingTaskIds = new Set(generatedTeachingTasks.map(t => t.id));
      const campusDutyIds = new Set(campusDutyTasks.map(t => t.id));
      const authenticNonTeachingTasks = filterAuthenticTeacherTasks({
        tasks: baseTasks,
        staff: staffObj,
        activeDate: activeWorkingDate
      }).filter(t => !teachingTaskIds.has(t.id) && !campusDutyIds.has(t.id));

      const mergedAllTasks = [...generatedTeachingTasks, ...campusDutyTasks, ...authenticNonTeachingTasks];

      setTasks(mergedAllTasks);
      await db.set(scopedTaskKey, mergedAllTasks);
      if (currentEmpCode === '108894') {
        await db.set('setup:tasks', mergedAllTasks);
      }
    } catch (err) {
      console.error('Error loading tasks with timetable sync:', err);
      setTasks([]);
    }
  };

  const saveTasks = async (updated: TeacherTask[]) => {
    setTasks(updated);
    const inspected = currentUser?.role === 'admin' ? (await getActiveInspectedTeacher()) : null;
    const currentEmpCode = (currentUser?.role === 'admin' && inspected?.employeeCode) ? inspected.employeeCode : (currentUser?.employeeCode || '108894');
    const scopedTaskKey = getTeacherScopedStorageKey('setup:tasks', currentEmpCode);
    await db.set(scopedTaskKey, updated);
    if (currentEmpCode === '108894') {
      await db.set('setup:tasks', updated);
    }
  };

  const loadPresets = async () => {
    try {
      const stored = await db.get<DutyPreset[]>('setup:duty_presets');
      if (stored && stored.length > 0) {
        setDutyPresets(stored);
      } else {
        await db.set('setup:duty_presets', DEFAULT_DUTY_PRESETS);
        setDutyPresets(DEFAULT_DUTY_PRESETS);
      }
    } catch (err) {
      console.error('Error loading duty presets:', err);
      setDutyPresets(DEFAULT_DUTY_PRESETS);
    }
  };

  const savePresets = async (updated: DutyPreset[]) => {
    setDutyPresets(updated);
    await db.set('setup:duty_presets', updated);
  };

  const handleOpenNewPresetModal = () => {
    setEditingPreset(null);
    setPresetTitle('');
    setPresetDesc('');
    setPresetCategory('Assembly & Duty');
    setPresetPriority('Do First (Urgent & Important)');
    setPresetEstMinutes(45);
    setPresetFrequency('Daily');
    setPresetSubtasks([]);
    setNewPresetSubtaskInput('');
    setIsPresetModalOpen(true);
  };

  const handleOpenEditPresetModal = (preset: DutyPreset) => {
    setEditingPreset(preset);
    setPresetTitle(preset.title);
    setPresetDesc(preset.desc);
    setPresetCategory(preset.category);
    setPresetPriority(preset.priority);
    setPresetEstMinutes(preset.estimatedMinutes);
    setPresetFrequency(preset.recurringFrequency || 'Daily');
    setPresetSubtasks(preset.subtasks || []);
    setNewPresetSubtaskInput('');
    setIsPresetModalOpen(true);
  };

  const handleSavePresetForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetTitle.trim()) return;

    if (editingPreset) {
      const updatedList = dutyPresets.map(p =>
        p.id === editingPreset.id
          ? {
              ...p,
              title: presetTitle.trim(),
              desc: presetDesc.trim(),
              category: presetCategory,
              priority: presetPriority,
              estimatedMinutes: presetEstMinutes,
              recurringFrequency: presetFrequency,
              subtasks: presetSubtasks
            }
          : p
      );
      await savePresets(updatedList);
    } else {
      const newP: DutyPreset = {
        id: `pst-${Date.now()}`,
        title: presetTitle.trim(),
        desc: presetDesc.trim(),
        category: presetCategory,
        priority: presetPriority,
        estimatedMinutes: presetEstMinutes,
        recurringFrequency: presetFrequency,
        subtasks: presetSubtasks
      };
      await savePresets([...dutyPresets, newP]);
    }
    setIsPresetModalOpen(false);
  };

  const handleDeletePreset = async (presetId: string) => {
    if (confirm('Are you sure you want to delete this Duty Preset?')) {
      const updatedList = dutyPresets.filter(p => p.id !== presetId);
      await savePresets(updatedList);
    }
  };

  const handleResetPresetsToDefault = async () => {
    if (confirm('Reset all Duty Presets to standard Indian school default templates?')) {
      await savePresets(DEFAULT_DUTY_PRESETS);
    }
  };

  const handleAddPresetSubtask = () => {
    if (!newPresetSubtaskInput.trim()) return;
    setPresetSubtasks([...presetSubtasks, newPresetSubtaskInput.trim()]);
    setNewPresetSubtaskInput('');
  };

  const handleRemovePresetSubtask = (index: number) => {
    setPresetSubtasks(presetSubtasks.filter((_, i) => i !== index));
  };

  const handleOpenNewTaskModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDesc('');
    setFormCategory('Teaching');
    setFormPriority('Do First (Urgent & Important)');
    setFormStatus('Pending');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormDueTime('12:00');
    setFormEstimatedMinutes(45);
    setFormTags('');
    setFormAssignedTo('Self');
    setFormLinkedClass('');
    setFormLinkedSubject('');
    setFormListId(selectedListId && !['today', 'tomorrow', 'next_7_days', 'all', 'high_priority'].includes(selectedListId) ? selectedListId : 'inbox');
    setFormOverloadImpact(false);
    setFormSubtasks([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: TeacherTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormCategory(task.category);
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormDueDate(task.dueDate);
    setFormDueTime(task.dueTime || '12:00');
    setFormEstimatedMinutes(task.estimatedMinutes || 30);
    setFormTags(task.tags ? task.tags.join(', ') : '');
    setFormAssignedTo(task.assignedTo || 'Self');
    setFormLinkedClass(task.linkedClass || '');
    setFormLinkedSubject(task.linkedSubject || '');
    setFormListId(task.listId || 'inbox');
    setFormOverloadImpact(!!task.overloadImpact);
    setFormSubtasks(task.subtasks || []);
    setIsModalOpen(true);
  };

  const handleSaveTaskForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const parsedTags = formTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (editingTask) {
      const updatedList = tasks.map(t =>
        t.id === editingTask.id
          ? {
              ...t,
              title: formTitle.trim(),
              description: formDesc.trim(),
              category: formCategory,
              priority: formPriority,
              status: formStatus,
              dueDate: formDueDate,
              dueTime: formDueTime,
              listId: formListId,
              estimatedMinutes: formEstimatedMinutes,
              tags: parsedTags,
              assignedTo: formAssignedTo,
              linkedClass: formLinkedClass,
              linkedSubject: formLinkedSubject,
              overloadImpact: formOverloadImpact,
              subtasks: formSubtasks,
              updatedAt: new Date().toISOString()
            }
          : t
      );
      await saveTasks(updatedList);
    } else {
      const newTask: TeacherTask = {
        id: `tsk-${Date.now()}`,
        title: formTitle.trim(),
        description: formDesc.trim(),
        category: formCategory,
        priority: formPriority,
        status: formStatus,
        dueDate: formDueDate,
        dueTime: formDueTime,
        listId: formListId,
        estimatedMinutes: formEstimatedMinutes,
        tags: parsedTags,
        assignedTo: formAssignedTo,
        linkedClass: formLinkedClass,
        linkedSubject: formLinkedSubject,
        overloadImpact: formOverloadImpact,
        subtasks: formSubtasks,
        isRecurring: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveTasks([newTask, ...tasks]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      const updated = tasks.filter(t => t.id !== id);
      await saveTasks(updated);
    }
  };

  const handleToggleTaskStatus = async (id: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
        return {
          ...t,
          status: nextStatus as any,
          subtasks: t.subtasks.map(st => ({ ...st, completed: nextStatus === 'Completed' })),
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
    await saveTasks(updated);
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextSubtasks = t.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        const allDone = nextSubtasks.every(s => s.completed);
        return {
          ...t,
          subtasks: nextSubtasks,
          status: (allDone ? 'Completed' : t.status === 'Completed' ? 'In Progress' : t.status) as any,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
    await saveTasks(updated);
  };

  const handleAddSubtaskToForm = () => {
    if (!newSubtaskTitle.trim()) return;
    setFormSubtasks([
      ...formSubtasks,
      { id: `st-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false }
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtaskFromForm = (id: string) => {
    setFormSubtasks(formSubtasks.filter(s => s.id !== id));
  };

  const toggleTaskExpansion = (id: string) => {
    setExpandedTaskIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddPresetDuty = async (preset: DutyPreset) => {
    const newTask: TeacherTask = {
      id: `tsk-preset-${Date.now()}`,
      title: preset.title,
      description: preset.desc,
      category: preset.category,
      priority: preset.priority,
      status: 'Pending',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '09:00',
      estimatedMinutes: preset.estimatedMinutes,
      tags: ['School Duty', 'Official Preset'],
      assignedTo: 'Self',
      subtasks: (preset.subtasks || []).map((st, i) => ({ id: `st-p-${i}-${Date.now()}`, title: st, completed: false })),
      isRecurring: true,
      recurringFrequency: preset.recurringFrequency || 'Daily',
      overloadImpact: preset.category !== 'Teaching',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveTasks([newTask, ...tasks]);
    alert(`Added "${preset.title}" to your Task List!`);
  };

  // Quick Voice Input with instant smart recognition
  const handleQuickVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported in this browser. Please type your task.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsQuickListening(true);
    recognition.onend = () => setIsQuickListening(false);
    recognition.onerror = () => setIsQuickListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const combined = quickTitle ? `${quickTitle} ${transcript}` : transcript;
      handleQuickTitleChange(combined);
      setIsQuickAddExpanded(true);
      setTimeout(() => quickTitleInputRef.current?.focus(), 50);
    };

    recognition.start();
  };

  // AI Assistant: Intelligent Multi-Task Breakdown Generator
  const handleGenerateAiTask = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);

    try {
      setTimeout(async () => {
        const raw = aiPrompt.trim();
        // Split prompt if user provided multiple commands separated by "and", "also", "then", commas, or newlines
        const clauses = raw
          .split(/(?:\r?\n|(?:\s+(?:and|also|then|after that)\s+)|(?:\s*;\s*))/i)
          .map(s => s.trim())
          .filter(s => s.length > 5);

        const newGeneratedTasks: TeacherTask[] = [];

        for (let i = 0; i < (clauses.length > 0 ? clauses.length : 1); i++) {
          const itemText = clauses[i] || raw;
          const parsed = parseSmartDate(itemText);
          const taskTitle = parsed ? (parsed.cleanTitle || itemText) : itemText;
          const isGem = itemText.toLowerCase().includes('gem') || itemText.toLowerCase().includes('procure') || itemText.toLowerCase().includes('sanction');
          const isSports = itemText.toLowerCase().includes('sport') || itemText.toLowerCase().includes('drill') || itemText.toLowerCase().includes('pt');
          const isUrgent = itemText.toLowerCase().includes('urgent') || itemText.toLowerCase().includes('today') || itemText.toLowerCase().includes('emergency');

          const tsk: TeacherTask = {
            id: `tsk-ai-${Date.now()}-${i}`,
            title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
            originalTitle: itemText,
            description: `Generated via AI Assistant prompt: "${raw}"`,
            category: isGem ? 'GeM Portal Admin' : isSports ? 'Sports / RSM / NSM' : 'Teaching',
            priority: isUrgent ? 'Do First (Urgent & Important)' : 'Schedule (Important & Not Urgent)',
            status: 'Pending',
            dueDate: parsed ? parsed.dueDate : new Date().toISOString().split('T')[0],
            dueTime: parsed ? parsed.dueTime : '10:00',
            estimatedMinutes: 45,
            isSmartRecognized: !!parsed,
            recognizedDateText: parsed ? parsed.matchedText : undefined,
            tags: ['AI Generated', ...(isGem ? ['GeM'] : []), ...(parsed ? ['Smart Parsed'] : [])],
            assignedTo: 'Self',
            subtasks: [
              { id: `st-ai-${i}-1`, title: 'Verify official guidelines and permissions', completed: false },
              { id: `st-ai-${i}-2`, title: 'Execute primary task action', completed: false },
              { id: `st-ai-${i}-3`, title: 'Log entry in Teacher Diary records', completed: false }
            ],
            overloadImpact: isGem || isSports,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          newGeneratedTasks.push(tsk);
        }

        await saveTasks([...newGeneratedTasks, ...tasks]);
        setAiPrompt('');
        setIsAiLoading(false);
        setActiveView('list');
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsAiLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported in this browser. Please type your prompt.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAiPrompt(prev => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.start();
  };

  // Filtering with TickTick Smart Lists & Regular Lists
  const filteredTasks = tasks.filter(t => {
    const matchesQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || t.priority === selectedPriority;
    const matchesStatus =
      selectedStatus === 'All'
        ? true
        : selectedStatus === 'OverloadImpact'
        ? t.overloadImpact
        : t.status === selectedStatus;

    // List filtering
    let matchesList = true;
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

    const next7Date = new Date();
    next7Date.setDate(next7Date.getDate() + 7);
    const next7Str = next7Date.toISOString().split('T')[0];

    if (selectedListId === 'inbox') {
      matchesList = !t.listId || t.listId === 'inbox';
    } else if (selectedListId === 'today') {
      matchesList = t.dueDate === todayStr;
    } else if (selectedListId === 'tomorrow') {
      matchesList = t.dueDate === tomorrowStr;
    } else if (selectedListId === 'next_7_days') {
      matchesList = t.dueDate >= todayStr && t.dueDate <= next7Str;
    } else if (selectedListId === 'high_priority') {
      matchesList = t.priority === 'Do First (Urgent & Important)' || !!t.isTopPriority;
    } else if (selectedListId === 'all') {
      matchesList = true;
    } else if (selectedListId) {
      matchesList = t.listId === selectedListId;
    }

    return matchesQuery && matchesCategory && matchesPriority && matchesStatus && matchesList;
  });

  // Eisenhower Matrix Quadrant Grouping
  const doFirstTasks = filteredTasks.filter(t => t.priority === 'Do First (Urgent & Important)');
  const scheduleTasks = filteredTasks.filter(t => t.priority === 'Schedule (Important & Not Urgent)');
  const delegateTasks = filteredTasks.filter(t => t.priority === 'Delegate (Urgent & Not Important)');
  const dontDoTasks = filteredTasks.filter(t => t.priority === "Don't Do / Low Priority");

  // Summary Metrics
  const totalCount = tasks.length;
  const pendingCount = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const doFirstCount = tasks.filter(t => t.priority === 'Do First (Urgent & Important)' && t.status !== 'Completed').length;
  const overloadCount = tasks.filter(t => t.overloadImpact && t.status !== 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-purple-400 uppercase tracking-wider mb-1">
              <ListTodo className="w-4 h-4 text-purple-400" />
              <span>Teacher Task Management</span>
              {devMode && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                  DEV MODE
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Task Hub
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
              title="User Guide & Feature Help"
            >
              <Info className="w-4 h-4 text-purple-400" />
              <span>How to Use</span>
            </button>
            <button
              onClick={handleOpenNewTaskModal}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
            <button
              onClick={() => setActiveView('ai')}
              className="px-4 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Task Breakdown</span>
            </button>
          </div>
        </div>

        {/* Core KPI Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="text-[11px] font-medium text-slate-400">Total Tasks</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40">
            <div className="text-[11px] font-medium text-amber-300">Active / Pending</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{pendingCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40">
            <div className="text-[11px] font-medium text-rose-300">Urgent (Do First)</div>
            <div className="text-xl font-bold text-rose-400 mt-0.5">{doFirstCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40">
            <div className="text-[11px] font-medium text-purple-300">Non-Teaching Overload</div>
            <div className="text-xl font-bold text-purple-400 mt-0.5">{overloadCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
            <div className="text-[11px] font-medium text-emerald-300">Completed</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{completedCount}</div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation & Filter Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveView('list')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeView === 'list'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>All Tasks List</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
              {filteredTasks.length}
            </span>
          </button>
          <button
            onClick={() => setActiveView('recurring')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeView === 'recurring'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Duty Presets & Recurring</span>
          </button>
          <button
            onClick={() => setActiveView('matrix')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeView === 'matrix'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Eisenhower Matrix</span>
          </button>
          <button
            onClick={() => setActiveView('ai')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeView === 'ai'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px] md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks or tags..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Primary Content View Container */}
      {activeView === 'matrix' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 text-purple-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong>Eisenhower Matrix:</strong> Focus first on <strong>Do First (Quadrant 1)</strong> to prevent delays in urgent GeM sanctions, safety drills, or board practicals.
              </span>
            </div>
            <span className="hidden sm:inline-block font-mono text-[10px] text-purple-400">
              4-Quadrant Prioritization
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quadrant 1: Do First */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-rose-300">
                    Quadrant 1: Do First (Urgent & Important)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-mono font-bold">
                  {doFirstTasks.length} Tasks
                </span>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {doFirstTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 italic">
                    No urgent tasks in this quadrant.
                  </div>
                ) : (
                  doFirstTasks.map(task => (
                    <MatrixTaskCard
                      key={task.id}
                      task={task}
                      onToggleStatus={() => handleToggleTaskStatus(task.id)}
                      onToggleSubtask={stId => handleToggleSubtask(task.id, stId)}
                      onEdit={() => handleOpenEditModal(task)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onSyncToWorkload={() => onSyncToWorkload && onSyncToWorkload(task)}
                      isExpanded={!!expandedTaskIds[task.id]}
                      onToggleExpand={() => toggleTaskExpansion(task.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Quadrant 2: Schedule */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <h3 className="text-sm font-bold text-purple-300">
                    Quadrant 2: Schedule (Important & Not Urgent)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 text-[10px] font-mono font-bold">
                  {scheduleTasks.length} Tasks
                </span>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {scheduleTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 italic">
                    No tasks scheduled.
                  </div>
                ) : (
                  scheduleTasks.map(task => (
                    <MatrixTaskCard
                      key={task.id}
                      task={task}
                      onToggleStatus={() => handleToggleTaskStatus(task.id)}
                      onToggleSubtask={stId => handleToggleSubtask(task.id, stId)}
                      onEdit={() => handleOpenEditModal(task)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onSyncToWorkload={() => onSyncToWorkload && onSyncToWorkload(task)}
                      isExpanded={!!expandedTaskIds[task.id]}
                      onToggleExpand={() => toggleTaskExpansion(task.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Quadrant 3: Delegate */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <h3 className="text-sm font-bold text-amber-300">
                    Quadrant 3: Delegate (Urgent & Not Important)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-mono font-bold">
                  {delegateTasks.length} Tasks
                </span>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {delegateTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 italic">
                    No tasks for delegation.
                  </div>
                ) : (
                  delegateTasks.map(task => (
                    <MatrixTaskCard
                      key={task.id}
                      task={task}
                      onToggleStatus={() => handleToggleTaskStatus(task.id)}
                      onToggleSubtask={stId => handleToggleSubtask(task.id, stId)}
                      onEdit={() => handleOpenEditModal(task)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onSyncToWorkload={() => onSyncToWorkload && onSyncToWorkload(task)}
                      isExpanded={!!expandedTaskIds[task.id]}
                      onToggleExpand={() => toggleTaskExpansion(task.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Quadrant 4: Don't Do / Low Priority */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-500" />
                  <h3 className="text-sm font-bold text-slate-300">
                    Quadrant 4: Low Priority / Archive
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-bold">
                  {dontDoTasks.length} Tasks
                </span>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {dontDoTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 italic">
                    No low priority tasks.
                  </div>
                ) : (
                  dontDoTasks.map(task => (
                    <MatrixTaskCard
                      key={task.id}
                      task={task}
                      onToggleStatus={() => handleToggleTaskStatus(task.id)}
                      onToggleSubtask={stId => handleToggleSubtask(task.id, stId)}
                      onEdit={() => handleOpenEditModal(task)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onSyncToWorkload={() => onSyncToWorkload && onSyncToWorkload(task)}
                      isExpanded={!!expandedTaskIds[task.id]}
                      onToggleExpand={() => toggleTaskExpansion(task.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Tasks List View & TickTick 2-Column Task Hub */}
      {activeView === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: TickTick-Style Smart & Custom Lists Sidebar */}
          <div className="lg:col-span-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Smart Views
              </div>
              <div className="space-y-1">
                {taskLists.filter(l => l.type === 'smart').map(list => {
                  const isSelected = selectedListId === list.id;
                  
                  // Compute count for this list
                  const todayStr = new Date().toISOString().split('T')[0];
                  const tomorrowDate = new Date();
                  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
                  const next7Date = new Date();
                  next7Date.setDate(next7Date.getDate() + 7);
                  const next7Str = next7Date.toISOString().split('T')[0];

                  const count = tasks.filter(t => {
                    if (list.id === 'inbox') return !t.listId || t.listId === 'inbox';
                    if (list.id === 'today') return t.dueDate === todayStr;
                    if (list.id === 'tomorrow') return t.dueDate === tomorrowStr;
                    if (list.id === 'next_7_days') return t.dueDate >= todayStr && t.dueDate <= next7Str;
                    if (list.id === 'high_priority') return t.priority === 'Do First (Urgent & Important)' || !!t.isTopPriority;
                    if (list.id === 'all') return true;
                    return t.listId === list.id;
                  }).length;

                  return (
                    <button
                      key={list.id}
                      onClick={() => {
                        setSelectedListId(list.id);
                        setQuickListId(list.id === 'today' || list.id === 'tomorrow' || list.id === 'next_7_days' || list.id === 'all' || list.id === 'high_priority' ? 'inbox' : list.id);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {list.id === 'inbox' && <Inbox className="w-4 h-4 text-indigo-400" />}
                        {list.id === 'today' && <Calendar className="w-4 h-4 text-blue-400" />}
                        {list.id === 'tomorrow' && <Sunrise className="w-4 h-4 text-purple-400" />}
                        {list.id === 'next_7_days' && <CalendarDays className="w-4 h-4 text-cyan-400" />}
                        {list.id === 'all' && <Layers className="w-4 h-4 text-slate-400" />}
                        {list.id === 'high_priority' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                        <span>{list.name}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                        isSelected ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom / Regular User Lists */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Lists
                </span>
                <button
                  onClick={() => setIsAddingList(!isAddingList)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-purple-300 transition-colors cursor-pointer"
                  title="Add Custom List"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {isAddingList && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-purple-500/30 space-y-2 mb-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    placeholder="List name..."
                    autoFocus
                    className="w-full px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateList();
                      if (e.key === 'Escape') setIsAddingList(false);
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewListColor(c)}
                          className={`w-4 h-4 rounded-full transition-transform ${
                            newListColor === c ? 'scale-125 ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleCreateList}
                        className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-500"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingList(false)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {taskLists.filter(l => l.type === 'regular').map(list => {
                  const isSelected = selectedListId === list.id;
                  const count = tasks.filter(t => t.listId === list.id).length;
                  const isEditing = editingListId === list.id;

                  if (isEditing) {
                    return (
                      <div key={list.id} className="p-2 rounded-xl bg-slate-950 border border-purple-500/40 space-y-2">
                        <input
                          type="text"
                          value={editListName}
                          onChange={e => setEditListName(e.target.value)}
                          autoFocus
                          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-purple-500"
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleUpdateList();
                            if (e.key === 'Escape') setEditingListId(null);
                          }}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'].map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setEditListColor(c)}
                                className={`w-3.5 h-3.5 rounded-full transition-transform ${
                                  editListColor === c ? 'scale-125 ring-2 ring-white/50' : 'opacity-70'
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={handleUpdateList}
                              className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-500"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingListId(null)}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={list.id}
                      className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedListId(list.id);
                          setQuickListId(list.id);
                        }}
                        className="flex items-center gap-2.5 truncate flex-1 text-left cursor-pointer"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: list.color || '#3b82f6' }}
                        />
                        <span className="truncate">{list.name}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                          isSelected ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {count}
                        </span>

                        {!list.isSystem && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity ml-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditList(list)}
                              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                              title="Edit List"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteList(list.id)}
                              className="p-1 rounded hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                              title="Delete List"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Quick-Add Bar, Filters, and Task Stream */}
          <div className="lg:col-span-9 space-y-4">
            {/* ------------------------------------------------------------- */}
            {/* TICKTICK-STYLE QUICK ADD TOP BAR                               */}
            {/* ------------------------------------------------------------- */}
            <form
              ref={quickAddContainerRef}
              onSubmit={e => {
                e.preventDefault();
                handleQuickAddTask();
              }}
              className={`rounded-2xl border transition-all duration-200 ${
                isQuickAddExpanded
                  ? 'p-4 bg-slate-900/95 border-purple-500/60 shadow-xl shadow-purple-950/40 ring-1 ring-purple-500/30'
                  : 'p-3 bg-slate-900 border-slate-700/80 hover:border-purple-500/40 shadow-md'
              }`}
            >
              <div className="flex flex-col gap-2.5">
                {/* Title Input & Live Smart Chip Preview */}
                <div className="flex items-center gap-3">
                  <Plus className={`w-5 h-5 shrink-0 transition-colors ${
                    quickTitle.trim() ? 'text-purple-400' : 'text-slate-500'
                  }`} />
                  <div className="flex-1 relative">
                    <input
                      ref={quickTitleInputRef}
                      type="text"
                      value={quickTitle}
                      onChange={e => handleQuickTitleChange(e.target.value)}
                      onFocus={() => setIsQuickAddExpanded(true)}
                      onKeyDown={handleQuickTitleKeyDown}
                      placeholder="What would you like to do? (e.g. Meeting tomorrow 9am, Submit report by Friday 3pm)"
                      className="w-full text-sm bg-transparent text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  {/* Quick Voice Dictation Button */}
                  <button
                    type="button"
                    onClick={handleQuickVoiceInput}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      isQuickListening
                        ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/50'
                        : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800'
                    }`}
                    title="Voice input with smart recognition"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Tips & Shortcuts Trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTipsTooltip(!showTipsTooltip)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Keyboard Shortcuts & Smart Examples"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>

                    {showTipsTooltip && (
                      <div className="absolute right-0 top-full mt-2 z-50 p-4 rounded-2xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-md space-y-3 w-80 text-left animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Keyboard className="w-4 h-4 text-purple-400" />
                            <span>Quick Add Tips & Shortcuts</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowTipsTooltip(false)}
                            className="text-slate-400 hover:text-white p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1.5 text-[11px] text-slate-300">
                          <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-400">Save Task:</span>
                            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-300 font-mono text-[10px]">Enter</kbd>
                          </div>
                          <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-400">Save with notes:</span>
                            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-300 font-mono text-[10px]">Cmd + Enter</kbd>
                          </div>
                          <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-400">Expand Description:</span>
                            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-300 font-mono text-[10px]">Shift + Enter</kbd>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                            Smart Recognition Examples:
                          </div>
                          <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                            <li><code className="text-blue-300">Meeting tomorrow 9am</code></li>
                            <li><code className="text-blue-300">Submit report by Friday 3pm</code></li>
                            <li><code className="text-blue-300">Call parent next Monday 10am</code></li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {quickTitle && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickTitle('');
                        setSmartParsedResult(null);
                      }}
                      className="text-slate-500 hover:text-slate-300 p-1"
                      title="Clear"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Expandable Description Area */}
                {isQuickAddExpanded && (
                  <div className="pl-8 pt-1">
                    <textarea
                      ref={quickDescInputRef}
                      rows={2}
                      value={quickDesc}
                      onChange={e => setQuickDesc(e.target.value)}
                      onKeyDown={handleQuickDescKeyDown}
                      placeholder="Add description or notes... (Cmd+Enter to save)"
                      className="w-full text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 leading-relaxed resize-y"
                    />
                  </div>
                )}

                {/* Toolbar & Metadata Chips (Dates, Smart Pill, Priority, List, Category, Settings, Save) */}
                {isQuickAddExpanded && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 pl-8">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* SMART RECOGNIZED DATE BADGE (Live Removable Pill) */}
                      {smartRecognitionEnabled && smartParsedResult && !isSmartDateIgnored ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/60 text-blue-200 text-xs font-semibold shadow-sm animate-fade-in group">
                          <CalendarCheck className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                          <span>{smartParsedResult.displayText}</span>
                          <button
                            type="button"
                            onClick={handleCancelSmartDate}
                            className="ml-1 p-0.5 rounded-full hover:bg-blue-500/40 text-blue-300 hover:text-white transition-colors"
                            title="Cancel smart recognized date"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        /* Manual Date & Time Picker Button */
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              quickDueDate
                                ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title="Set Due Date & Time"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            <span>{quickDueDate || 'Due Date'}</span>
                            {quickDueTime && <span className="text-[10px] font-mono text-blue-200">({quickDueTime})</span>}
                          </button>

                          {showDatePicker && (
                            <div className="absolute left-0 top-full mt-1 z-30 p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl space-y-2 min-w-[220px]">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Due Date & Time
                              </div>
                              <div className="flex gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuickDueDate(new Date().toISOString().split('T')[0]);
                                    setShowDatePicker(false);
                                  }}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                                >
                                  Today
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 1);
                                    setQuickDueDate(d.toISOString().split('T')[0]);
                                    setShowDatePicker(false);
                                  }}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                                >
                                  Tomorrow
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 7);
                                    setQuickDueDate(d.toISOString().split('T')[0]);
                                    setShowDatePicker(false);
                                  }}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                                >
                                  Next Week
                                </button>
                              </div>
                              <input
                                type="date"
                                value={quickDueDate}
                                onChange={e => setQuickDueDate(e.target.value)}
                                className="w-full text-xs p-1.5 rounded bg-slate-900 border border-slate-700 text-white"
                              />
                              <input
                                type="time"
                                value={quickDueTime}
                                onChange={e => setQuickDueTime(e.target.value)}
                                className="w-full text-xs p-1.5 rounded bg-slate-900 border border-slate-700 text-white"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Priority Picker Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowPriorityPicker(!showPriorityPicker)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            quickPriority === 'Do First (Urgent & Important)'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                              : quickPriority === 'Schedule (Important & Not Urgent)'
                              ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                          title="Eisenhower Priority"
                        >
                          <Flag className={`w-3.5 h-3.5 ${
                            quickPriority === 'Do First (Urgent & Important)' ? 'text-rose-400' : 'text-purple-400'
                          }`} />
                          <span>{quickPriority.split('(')[0].trim()}</span>
                        </button>

                        {showPriorityPicker && (
                          <div className="absolute left-0 top-full mt-1 z-30 p-2 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl space-y-1 min-w-[230px]">
                            {[
                              { label: 'Do First (Urgent & Important)', color: 'text-rose-400' },
                              { label: 'Schedule (Important & Not Urgent)', color: 'text-purple-400' },
                              { label: 'Delegate (Urgent & Not Important)', color: 'text-amber-400' },
                              { label: "Don't Do / Low Priority", color: 'text-slate-400' }
                            ].map(p => (
                              <button
                                key={p.label}
                                type="button"
                                onClick={() => {
                                  setQuickPriority(p.label as EisenhowerPriority);
                                  setShowPriorityPicker(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 hover:bg-slate-800 ${
                                  quickPriority === p.label ? 'bg-slate-800 font-bold' : ''
                                }`}
                              >
                                <Flag className={`w-3.5 h-3.5 ${p.color}`} />
                                <span className="text-slate-200">{p.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* List Selector Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowListPicker(!showListPicker)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                          title="Select Destination List"
                        >
                          <Folder className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {taskLists.find(l => l.id === (quickListId || selectedListId))?.name || 'Inbox'}
                          </span>
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>

                        {showListPicker && (
                          <div className="absolute left-0 top-full mt-1 z-30 p-2 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl space-y-1 min-w-[190px]">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                              Select List
                            </div>
                            {taskLists.map(l => (
                              <button
                                key={l.id}
                                type="button"
                                onClick={() => {
                                  setQuickListId(l.id);
                                  setShowListPicker(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-800 ${
                                  (quickListId || selectedListId) === l.id ? 'bg-slate-800 font-bold text-purple-300' : 'text-slate-200'
                                }`}
                              >
                                <span>{l.name}</span>
                                {l.color && (
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Tag / Category Selector Dropdown with Admin & Personal Tag Management */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 max-w-[210px]"
                          title="Select Tag / Duty Category"
                        >
                          <Tag className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="truncate">{quickCategory}</span>
                          <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                        </button>

                        {showCategoryPicker && (
                          <div className="absolute left-0 top-full mt-1 z-40 p-2.5 rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl space-y-2 min-w-[260px] max-w-[320px] max-h-[380px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-800">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Task Tags & Categories
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsAddingTag(!isAddingTag)}
                                className="px-2 py-0.5 rounded-md bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>{isAdmin ? 'Add Admin Tag' : 'New Tag'}</span>
                              </button>
                            </div>

                            {/* Tag Notification Message */}
                            {tagSuccessMsg && (
                              <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                                {tagSuccessMsg}
                              </div>
                            )}

                            {/* Add New Tag Inline Form */}
                            {isAddingTag && (
                              <div className="p-2 rounded-xl bg-slate-900 border border-purple-500/30 space-y-2">
                                <div className="text-[10px] font-bold text-purple-300">
                                  {isAdmin ? 'Create Institutional Tag (Global)' : 'Create Personal Tag'}
                                </div>
                                <input
                                  type="text"
                                  value={newTagName}
                                  onChange={e => setNewTagName(e.target.value)}
                                  placeholder="Tag name (e.g. Physics Lab, Eco Club)..."
                                  className="w-full px-2 py-1 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                                  autoFocus
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleCreateCustomTag();
                                    }
                                  }}
                                />
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1">
                                    {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#f43f5e'].map(c => (
                                      <button
                                        key={c}
                                        type="button"
                                        onClick={() => setNewTagColor(c)}
                                        className={`w-4 h-4 rounded-full border ${
                                          newTagColor === c ? 'ring-2 ring-white border-transparent' : 'border-transparent'
                                        }`}
                                        style={{ backgroundColor: c }}
                                      />
                                    ))}
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setIsAddingTag(false)}
                                      className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCreateCustomTag}
                                      className="px-2.5 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Section 1: Admin / Institutional Assigned Roles (Locked for Teachers) */}
                            <div className="space-y-1">
                              <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1">
                                <Shield className="w-3 h-3 text-purple-400" />
                                <span>Principal Assigned / Institutional</span>
                              </div>
                              {availableTags.filter(t => t.source === 'admin').map(tag => (
                                <div
                                  key={tag.id}
                                  className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                                    quickCategory === tag.name ? 'bg-slate-800 font-bold text-teal-300' : 'text-slate-200 hover:bg-slate-900'
                                  }`}
                                >
                                  {editingTagId === tag.id && isAdmin ? (
                                    <div className="flex items-center gap-1.5 flex-1">
                                      <input
                                        type="text"
                                        value={editTagName}
                                        onChange={e => setEditTagName(e.target.value)}
                                        className="flex-1 px-1.5 py-0.5 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCustomTag(tag)}
                                        className="p-1 rounded bg-purple-600 text-white text-[10px]"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingTagId(null)}
                                        className="p-1 rounded bg-slate-800 text-slate-400 text-[10px]"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuickCategory(tag.name as HourlyCategory);
                                          setShowCategoryPicker(false);
                                        }}
                                        className="flex items-center gap-2 flex-1 text-left cursor-pointer truncate"
                                      >
                                        <span
                                          className="w-2 h-2 rounded-full shrink-0"
                                          style={{ backgroundColor: tag.color || '#8b5cf6' }}
                                        />
                                        <span className="truncate">{tag.name}</span>
                                        <span className="px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-500/30 text-[9px] text-purple-300 font-mono flex items-center gap-0.5 shrink-0">
                                          <Lock className="w-2.5 h-2.5 text-purple-400" />
                                          <span>Admin</span>
                                        </span>
                                      </button>

                                      {isAdmin && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingTagId(tag.id);
                                              setEditTagName(tag.name);
                                              setEditTagColor(tag.color || '#8b5cf6');
                                            }}
                                            className="p-1 text-slate-400 hover:text-purple-300"
                                            title="Edit Admin Tag"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteCustomTag(tag)}
                                            className="p-1 text-slate-400 hover:text-rose-400"
                                            title="Delete Admin Tag"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Section 2: Teacher's Personal Custom Tags */}
                            <div className="space-y-1 pt-1 border-t border-slate-800/80">
                              <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider px-1">
                                Personal Custom Tags
                              </div>
                              {availableTags.filter(t => t.source === 'teacher').length === 0 ? (
                                <div className="px-2 py-1 text-[11px] text-slate-500 italic">
                                  No personal tags yet. Click "+ New Tag" above to create one.
                                </div>
                              ) : (
                                availableTags.filter(t => t.source === 'teacher').map(tag => (
                                  <div
                                    key={tag.id}
                                    className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                                      quickCategory === tag.name ? 'bg-slate-800 font-bold text-teal-300' : 'text-slate-200 hover:bg-slate-900'
                                    }`}
                                  >
                                    {editingTagId === tag.id ? (
                                      <div className="flex items-center gap-1.5 flex-1">
                                        <input
                                          type="text"
                                          value={editTagName}
                                          onChange={e => setEditTagName(e.target.value)}
                                          className="flex-1 px-1.5 py-0.5 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                                          autoFocus
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateCustomTag(tag)}
                                          className="p-1 rounded bg-purple-600 text-white text-[10px]"
                                        >
                                          <Check className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingTagId(null)}
                                          className="p-1 rounded bg-slate-800 text-slate-400 text-[10px]"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setQuickCategory(tag.name as HourlyCategory);
                                            setShowCategoryPicker(false);
                                          }}
                                          className="flex items-center gap-2 flex-1 text-left cursor-pointer truncate"
                                        >
                                          <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: tag.color || '#3b82f6' }}
                                          />
                                          <span className="truncate">{tag.name}</span>
                                        </button>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingTagId(tag.id);
                                              setEditTagName(tag.name);
                                              setEditTagColor(tag.color || '#3b82f6');
                                            }}
                                            className="p-1 text-slate-400 hover:text-purple-300"
                                            title="Edit Tag"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteCustomTag(tag)}
                                            className="p-1 text-slate-400 hover:text-rose-400"
                                            title="Delete Tag"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Smart Recognition Settings Trigger Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            smartRecognitionEnabled
                              ? 'bg-purple-950/60 border-purple-500/40 text-purple-300 hover:bg-purple-900/60'
                              : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                          }`}
                          title="Smart Recognition Settings"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>

                        {isSettingsOpen && (
                          <div className="absolute left-0 bottom-full mb-2 z-40 p-3 rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl space-y-3 min-w-[260px]">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                <span>Smart Recognition</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsSettingsOpen(false)}
                                className="text-slate-400 hover:text-white p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <label className="flex items-center justify-between gap-2 text-xs text-slate-300 cursor-pointer">
                              <span>Natural Language Date Recognition</span>
                              <input
                                type="checkbox"
                                checked={smartRecognitionEnabled}
                                onChange={e => handleToggleSmartRecognition(e.target.checked)}
                                className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                              />
                            </label>

                            <label className={`flex items-center justify-between gap-2 text-xs cursor-pointer ${
                              smartRecognitionEnabled ? 'text-slate-300' : 'text-slate-600 pointer-events-none'
                            }`}>
                              <span>Remove Date from Final Title</span>
                              <input
                                type="checkbox"
                                disabled={!smartRecognitionEnabled}
                                checked={stripDateFromTitle}
                                onChange={e => handleToggleStripDate(e.target.checked)}
                                className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">
                        Cmd+↵ to add
                      </span>
                      <button
                        type="submit"
                        disabled={!quickTitle.trim()}
                        className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>

            {/* List Header & Active Filters Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-300">
                  <ListTodo className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 m-0">
                    <span>
                      {taskLists.find(l => l.id === selectedListId)?.name || 'All Tasks'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-300 font-mono">
                      {filteredTasks.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 m-0">
                    {selectedListId === 'inbox' && 'Default holding list for unassigned or incoming school tasks'}
                    {selectedListId === 'today' && 'Statutory tasks and period obligations due today'}
                    {selectedListId === 'tomorrow' && 'Advance planning for tomorrow’s classes and duties'}
                    {selectedListId === 'next_7_days' && '7-day rolling window of academic and administrative commitments'}
                    {selectedListId === 'high_priority' && 'Urgent & Important tasks requiring prompt completion'}
                    {selectedListId === 'all' && 'Master task stream across all smart and custom lists'}
                    {!['inbox', 'today', 'tomorrow', 'next_7_days', 'high_priority', 'all'].includes(selectedListId) && 'Custom task list'}
                  </p>
                </div>
              </div>

              {/* Secondary Category & Priority Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500 max-w-[150px]"
                >
                  <option value="All">All Tags / Categories</option>
                  <optgroup label="Principal Assigned / Institutional">
                    {availableTags.filter(t => t.source === 'admin').map(tag => (
                      <option key={tag.id} value={tag.name}>
                        🛡️ {tag.name}
                      </option>
                    ))}
                  </optgroup>
                  {availableTags.filter(t => t.source === 'teacher').length > 0 && (
                    <optgroup label="Personal Custom Tags">
                      {availableTags.filter(t => t.source === 'teacher').map(tag => (
                        <option key={tag.id} value={tag.name}>
                          🏷️ {tag.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="OverloadImpact">Duty Overload Only</option>
                </select>
              </div>
            </div>

            {/* Task Cards Stream */}
            <div className="space-y-2.5">
              {filteredTasks.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-400">All tasks in this list are completed! Take it easy.</p>
                  <button
                    onClick={handleFocusQuickAdd}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Quick Add Task</span>
                  </button>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <ListTaskCard
                    key={task.id}
                    task={task}
                    onToggleStatus={() => handleToggleTaskStatus(task.id)}
                    onToggleSubtask={stId => handleToggleSubtask(task.id, stId)}
                    onEdit={() => handleOpenEditModal(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onSyncToWorkload={() => onSyncToWorkload && onSyncToWorkload(task)}
                    isExpanded={!!expandedTaskIds[task.id]}
                    onToggleExpand={() => toggleTaskExpansion(task.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Duty Presets & Recurring Duties View */}
      {activeView === 'recurring' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-purple-400" />
                  <span>Customizable Indian School Teacher Duty Presets</span>
                </h3>
                <p className="text-xs text-purple-200/80 mt-1">
                  Manage recurring statutory duties, create custom task templates, or edit/delete existing presets.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleResetPresetsToDefault}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Reset to default templates"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
                <button
                  onClick={handleOpenNewPresetModal}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Duty Preset</span>
                </button>
              </div>
            </div>
          </div>

          {dutyPresets.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <RotateCcw className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No duty presets found.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleResetPresetsToDefault}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Load Standard Presets
                </button>
                <button
                  onClick={handleOpenNewPresetModal}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Custom Preset</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dutyPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 text-[10px] font-mono">
                          {preset.category}
                        </span>
                        {preset.recurringFrequency && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-[10px] font-mono">
                            {preset.recurringFrequency}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono shrink-0">
                        <Clock className="w-3 h-3" />
                        {preset.estimatedMinutes} mins
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug">{preset.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{preset.desc}</p>

                    {preset.subtasks && preset.subtasks.length > 0 && (
                      <div className="pt-2 border-t border-slate-800 space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Included Subtasks ({preset.subtasks.length}):
                        </div>
                        {preset.subtasks.map((st, i) => (
                          <div key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" />
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => handleAddPresetDuty(preset)}
                      className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to My Tasks</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditPresetModal(preset)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      title="Edit Duty Preset"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 transition-colors cursor-pointer"
                      title="Delete Duty Preset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Assistant View */}
      {activeView === 'ai' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Gemini AI Task Breakdown & Voice Assistant</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Describe your task or diktat in plain English or Voice
            </h3>
            <p className="text-xs text-slate-400">
              Enter any teacher instruction or order (e.g. "Prepare question papers for class 10 periodic test and complete stock verification for sports room"). AI will structure it with subtasks, category, and priority matrix.
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                rows={4}
                placeholder="Type or dictate your task (e.g., Process GeM portal sanction for physics lab microscopes by Friday)..."
                className="w-full p-4 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`absolute right-3 bottom-3 p-2 rounded-lg ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                } transition-all cursor-pointer`}
                title="Voice Dictation"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-[11px] text-slate-500 italic">
                {isListening ? 'Listening to voice...' : 'Press microphone icon for speech-to-text input.'}
              </div>
              <button
                onClick={handleGenerateAiTask}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {isAiLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Structuring Task...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Structured Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-purple-400" />
                <span>{editingTask ? 'Edit Task' : 'Create New Teacher Task'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveTaskForm} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. GeM Portal Sanction Approval / PT-1 Grading"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Detailed Description
                </label>
                <textarea
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  rows={2}
                  placeholder="Additional context or official document reference..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Destination List</label>
                  <select
                    value={formListId}
                    onChange={e => setFormListId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    {taskLists.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Tag / Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as HourlyCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <optgroup label="Principal Assigned / Institutional">
                      {availableTags.filter(t => t.source === 'admin').map(tag => (
                        <option key={tag.id} value={tag.name}>
                          🛡️ {tag.name}
                        </option>
                      ))}
                    </optgroup>
                    {availableTags.filter(t => t.source === 'teacher').length > 0 && (
                      <optgroup label="Personal Custom Tags">
                        {availableTags.filter(t => t.source === 'teacher').map(tag => (
                          <option key={tag.id} value={tag.name}>
                            🏷️ {tag.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Eisenhower Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as EisenhowerPriority)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Do First (Urgent & Important)">
                      Quadrant 1: Do First (Urgent & Important)
                    </option>
                    <option value="Schedule (Important & Not Urgent)">
                      Quadrant 2: Schedule (Important & Not Urgent)
                    </option>
                    <option value="Delegate (Urgent & Not Important)">
                      Quadrant 3: Delegate (Urgent & Not Important)
                    </option>
                    <option value="Don't Do / Low Priority">Quadrant 4: Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Due Time</label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={e => setFormDueTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Est. Minutes</label>
                  <input
                    type="number"
                    value={formEstimatedMinutes}
                    onChange={e => setFormEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Protected Teaching Period Overlap Warning (Requirement 3 & 4) */}
              {modalOverlapInfo.hasOverlap && modalOverlapInfo.overlappingPeriod && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2.5 shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300">Protected Teaching Period Conflict</p>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      Period {modalOverlapInfo.overlappingPeriod.periodNumber} ({modalOverlapInfo.overlappingPeriod.className} {modalOverlapInfo.overlappingPeriod.subjectName}, {modalOverlapInfo.overlappingPeriod.startTime}–{modalOverlapInfo.overlappingPeriod.endTime}) is scheduled at this time. Non-teaching tasks must not be scheduled during teaching periods unless proxy coverage exists.
                    </p>
                  </div>
                </div>
              )}

              {/* Faculty Assignment with Leave & Availability Checking (Rule i & i.a) */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Assign To Faculty / Role
                </label>
                <select
                  value={formAssignedTo}
                  onChange={e => setFormAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Self">Self (My Diary)</option>
                  {staffList.length > 0 && (
                    <optgroup label="School Faculty (Availability evaluated for Due Date)">
                      {staffList.map(teacher => {
                        const avail = isTeacherAvailableForDeadline(
                          teacher.employeeCode,
                          formDueDate,
                          attendanceRecords,
                          leaveApplications,
                          onDutyRecords
                        );

                        return (
                          <option
                            key={teacher.employeeCode}
                            value={teacher.name}
                            disabled={!avail.isAvailable}
                          >
                            {avail.isAvailable
                              ? `✅ ${teacher.name} (${teacher.designation || 'Teacher'})`
                              : `🚫 ${teacher.name} (On ${avail.absenceInfo?.leaveType || avail.absenceInfo?.status || 'Leave'} on ${formDueDate} - Unavailable)`}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  <optgroup label="Other Roles">
                    <option value="Lab Attendant">Lab Attendant</option>
                    <option value="Student Council">Student Council</option>
                    <option value="Co-Teacher">Co-Teacher</option>
                  </optgroup>
                </select>

                {(() => {
                  const selectedTeacher = staffList.find(s => s.name === formAssignedTo);
                  if (!selectedTeacher) return null;
                  const avail = isTeacherAvailableForDeadline(
                    selectedTeacher.employeeCode,
                    formDueDate,
                    attendanceRecords,
                    leaveApplications,
                    onDutyRecords
                  );
                  if (!avail.isAvailable) {
                    return (
                      <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-300 flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-white">
                            {selectedTeacher.name} is on {avail.absenceInfo?.leaveType || avail.absenceInfo?.status || 'Leave'}
                          </span>
                          <span className="block text-[10px] text-amber-300/80">
                            Leave duration: {avail.absenceInfo?.fromDate} to {avail.absenceInfo?.toDate}. Please select a due date outside this period or assign to an available colleague.
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Subtasks Builder */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Subtask Checklist Items
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add sub-step..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtaskToForm}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                  {formSubtasks.map((st, i) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
                    >
                      <span>
                        {i + 1}. {st.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtaskFromForm(st.id)}
                        className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags & Overload Checkbox */}
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={e => setFormTags(e.target.value)}
                    placeholder="e.g. GeM, Exam, Urgent"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-purple-950/20 border border-purple-800/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formOverloadImpact}
                    onChange={e => setFormOverloadImpact(e.target.checked)}
                    className="rounded border-slate-800 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-purple-300">
                      Non-Teaching Overload Duty
                    </div>
                    <div className="text-[10px] text-purple-300/70">
                      Mark if task delay or duration is caused by non-teaching administrative duties.
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  {editingTask ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duty Preset Edit / Create Modal */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-400" />
                <span>{editingPreset ? 'Modify Duty Preset' : 'Add Custom Duty Preset'}</span>
              </h3>
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePresetForm} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Preset Duty Title *
                </label>
                <input
                  type="text"
                  required
                  value={presetTitle}
                  onChange={e => setPresetTitle(e.target.value)}
                  placeholder="e.g. Daily Morning Gate Duty & Dress Inspector"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Description
                </label>
                <textarea
                  value={presetDesc}
                  onChange={e => setPresetDesc(e.target.value)}
                  rows={2}
                  placeholder="Official scope of duty or circular details..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                  <select
                    value={presetCategory}
                    onChange={e => setPresetCategory(e.target.value as HourlyCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Assembly & Duty">Assembly & Duty</option>
                    <option value="GeM Portal Admin">GeM Portal Admin</option>
                    <option value="Sports / RSM / NSM">Sports / RSM / NSM</option>
                    <option value="Parade & Pyramid">Parade & Pyramid</option>
                    <option value="Teacher Diary Docs">Teacher Diary Docs</option>
                    <option value="Teaching">Teaching</option>
                    <option value="Administrative Duty">Administrative Duty</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Priority</label>
                  <select
                    value={presetPriority}
                    onChange={e => setPresetPriority(e.target.value as EisenhowerPriority)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Do First (Urgent & Important)">
                      Quadrant 1: Do First (Urgent & Important)
                    </option>
                    <option value="Schedule (Important & Not Urgent)">
                      Quadrant 2: Schedule (Important & Not Urgent)
                    </option>
                    <option value="Delegate (Urgent & Not Important)">
                      Quadrant 3: Delegate (Urgent & Not Important)
                    </option>
                    <option value="Don't Do / Low Priority">Quadrant 4: Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Est. Duration (Mins)</label>
                  <input
                    type="number"
                    value={presetEstMinutes}
                    onChange={e => setPresetEstMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Recurring Frequency</label>
                  <select
                    value={presetFrequency}
                    onChange={e => setPresetFrequency(e.target.value as 'Daily' | 'Weekly' | 'Monthly')}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Daily">Daily Recurring</option>
                    <option value="Weekly">Weekly Recurring</option>
                    <option value="Monthly">Monthly Recurring</option>
                  </select>
                </div>
              </div>

              {/* Subtasks Builder */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Preset Subtasks / Step Checklist
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPresetSubtaskInput}
                    onChange={e => setNewPresetSubtaskInput(e.target.value)}
                    placeholder="Add step to preset..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPresetSubtask}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                  {presetSubtasks.map((st, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
                    >
                      <span>
                        {i + 1}. {st}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePresetSubtask(i)}
                        className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPresetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  {editingPreset ? 'Update Preset' : 'Save Duty Preset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User-Facing Help & Keyboard Shortcuts Guide Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-400">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white m-0">
                    TickTick-Style Task Manager Guide
                  </h3>
                  <p className="text-xs text-slate-400 m-0">
                    Learn rapid task addition, smart date parsing, voice recognition, and Eisenhower matrix prioritization.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 max-h-[65vh] overflow-y-auto pr-1">
              {/* Quick Add & Shortcuts */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <h4 className="font-bold text-purple-300 flex items-center gap-1.5 text-sm">
                  <Keyboard className="w-4 h-4 text-purple-400" />
                  <span>Desktop & Mobile Quick Add</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Click the floating <strong>+</strong> button (or top input bar) to add tasks instantly without opening heavy modal dialogs:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-purple-300 font-bold block">Enter ↵</span>
                    <span className="text-slate-400 text-[10px]">Create task & keep focus</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-purple-300 font-bold block">Shift + Enter</span>
                    <span className="text-slate-400 text-[10px]">Expand notes / description</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-purple-300 font-bold block">Cmd / Ctrl + Enter</span>
                    <span className="text-slate-400 text-[10px]">Save task with notes</span>
                  </div>
                </div>
              </div>

              {/* Natural Language Date Recognition */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <h4 className="font-bold text-blue-300 flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Smart Date & Time Recognition</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Type naturally in Indian English. The system automatically parses dates, days, and times offline without sending queries over the network:
                </p>
                <div className="space-y-1 text-slate-300 font-mono text-[11px] bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div>• <span className="text-blue-300">"Meeting tomorrow 9am"</span> &rarr; Sets due tomorrow at 09:00</div>
                  <div>• <span className="text-blue-300">"Submit GeM sanction report by Friday 3pm"</span> &rarr; Sets due this Friday at 15:00</div>
                  <div>• <span className="text-blue-300">"Call parent next Monday 10am"</span> &rarr; Sets due next Monday at 10:00</div>
                  <div>• <span className="text-blue-300">"Unit test grading on 25th Aug"</span> &rarr; Sets due on 25 August</div>
                </div>
              </div>

              {/* Voice & AI Task Breakdown */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <h4 className="font-bold text-indigo-300 flex items-center gap-1.5 text-sm">
                  <Mic className="w-4 h-4 text-indigo-400" />
                  <span>Voice Dictation & AI Multi-Task Generation</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  • <strong>Microphone Button (<Mic className="w-3 h-3 inline text-rose-400" />):</strong> Speak your task title directly into the Quick Add bar with live smart date recognition.<br/>
                  • <strong>AI Assistant Tab:</strong> Speak or type a compound sentence (e.g. <em>"Submit GeM sanction report by Friday and organize sports drill tomorrow 8am"</em>) to split it into multiple structured tasks with checklists.
                </p>
              </div>

              {/* Smart Lists & Eisenhower Matrix */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <h4 className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
                  <Grid className="w-4 h-4 text-emerald-400" />
                  <span>Smart Lists & Eisenhower Prioritization</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Use the left sidebar in <strong>All Tasks List</strong> to filter tasks by <strong>Today</strong>, <strong>Tomorrow</strong>, <strong>Next 7 Days</strong>, and <strong>High Priority</strong>. Switch to the <strong>Eisenhower Matrix</strong> tab anytime to focus on Quadrant 1 (Urgent & Important statutory duties).
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-purple-600/30 transition-all"
              >
                Got It, Let's Go!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) - Bottom-Right (Mobile & Desktop) */}
      <button
        onClick={handleFocusQuickAdd}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-purple-600/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20 group"
        title="Quick Add Task (Click to focus)"
        aria-label="Add Task"
      >
        <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
      </button>
    </div>
  );
};

// Sub-component: Matrix Task Card
const MatrixTaskCard: React.FC<{
  task: TeacherTask;
  onToggleStatus: () => void;
  onToggleSubtask: (subtaskId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onSyncToWorkload?: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({
  task,
  onToggleStatus,
  onToggleSubtask,
  onEdit,
  onDelete,
  onSyncToWorkload,
  isExpanded,
  onToggleExpand
}) => {
  const isDone = task.status === 'Completed';
  const subtasksCount = task.subtasks ? task.subtasks.length : 0;
  const completedSubtasksCount = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;

  return (
    <div
      className={`p-3 rounded-xl border transition-all ${
        isDone
          ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button
            onClick={onToggleStatus}
            className={`mt-0.5 p-0.5 rounded transition-colors cursor-pointer ${
              isDone ? 'text-emerald-400' : 'text-slate-500 hover:text-purple-400'
            }`}
          >
            {isDone ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </button>

          <div className="flex-1 min-w-0 space-y-1">
            <div
              className={`text-xs font-bold leading-tight truncate ${
                isDone ? 'line-through text-slate-500' : 'text-white'
              }`}
            >
              {task.title}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                {task.category}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3" />
                {task.dueDate}
              </span>
              {task.overloadImpact && (
                <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  Non-Teaching
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {subtasksCount > 0 && (
            <button
              onClick={onToggleExpand}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 font-mono flex items-center gap-1 cursor-pointer"
            >
              <span>
                {completedSubtasksCount}/{subtasksCount}
              </span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          <button
            onClick={onEdit}
            className="p-1 text-slate-400 hover:text-purple-300 transition-colors cursor-pointer"
            title="Edit Task"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Delete Task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Subtasks List */}
      {isExpanded && subtasksCount > 0 && (
        <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1">
          {task.subtasks.map(st => (
            <label
              key={st.id}
              className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white"
            >
              <input
                type="checkbox"
                checked={st.completed}
                onChange={() => onToggleSubtask(st.id)}
                className="rounded border-slate-800 text-purple-600 focus:ring-purple-500"
              />
              <span className={st.completed ? 'line-through text-slate-500' : ''}>
                {st.title}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// Sub-component: List Task Card
const ListTaskCard: React.FC<{
  task: TeacherTask;
  onToggleStatus: () => void;
  onToggleSubtask: (subtaskId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onSyncToWorkload?: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({
  task,
  onToggleStatus,
  onToggleSubtask,
  onEdit,
  onDelete,
  onSyncToWorkload,
  isExpanded,
  onToggleExpand
}) => {
  const isDone = task.status === 'Completed';

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isDone
          ? 'bg-slate-900/60 border-slate-800/80 opacity-70'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <button
            onClick={onToggleStatus}
            className={`mt-1 p-1 rounded-lg transition-colors cursor-pointer ${
              isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 hover:text-purple-400'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>

          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4
                className={`text-sm font-bold ${
                  isDone ? 'line-through text-slate-500' : 'text-white'
                }`}
              >
                {task.title}
              </h4>
              {task.id.startsWith('proxy-duty-') && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10px] font-black tracking-wide flex items-center gap-1 animate-pulse" title="Proxy Substitution Duty assigned by Principal / Incharge">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>⚠️ PROXY DUTY</span>
                </span>
              )}
              {task.id.startsWith('tt-period-') && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>Timetable Period</span>
                </span>
              )}
              {task.isSmartRecognized && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-950/80 border border-blue-800 text-blue-300 text-[10px] font-mono flex items-center gap-1" title={task.originalTitle ? `Parsed from: "${task.originalTitle}"` : 'Smart Recognized'}>
                  <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                  <span>Smart</span>
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 text-[10px] font-mono">
                {task.category}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  task.priority.includes('Do First')
                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {task.priority}
              </span>
            </div>

            {task.description && (
              <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Due: {task.dueDate} {task.dueTime}
              </span>
              {task.estimatedMinutes && (
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {task.estimatedMinutes} mins
                </span>
              )}
              {task.overloadImpact && (
                <span className="text-purple-400 font-medium">Non-Teaching Duty Overload</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {task.subtasks && task.subtasks.length > 0 && (
            <button
              onClick={onToggleExpand}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>
                Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})
              </span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={onEdit}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Edit Task"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 transition-colors cursor-pointer"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subtasks Accordion */}
      {isExpanded && task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Subtask Checklist
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {task.subtasks.map(st => (
              <label
                key={st.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer hover:border-purple-500/40"
              >
                <input
                  type="checkbox"
                  checked={st.completed}
                  onChange={() => onToggleSubtask(st.id)}
                  className="rounded border-slate-800 text-purple-600 focus:ring-purple-500"
                />
                <span className={st.completed ? 'line-through text-slate-500' : ''}>
                  {st.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
