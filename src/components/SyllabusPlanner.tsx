import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  SkipForward,
  CalendarClock,
  FileText,
  Layers,
  Search,
  Check,
  X,
  Sparkles,
  BarChart3,
  Award,
  RefreshCw,
  FlaskConical,
  FolderKanban,
  FileUp,
  Upload,
  Loader2,
  FileCheck,
  SlidersHorizontal,
  Columns,
  MoveHorizontal,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Eye,
  Code,
  Copy,
  FileJson,
  CheckSquare,
  Square
} from 'lucide-react';
import { SyllabusItem, SyllabusStatus, ClassSection, SubjectItem } from '../types/academic';
import { db, DEFAULT_CLASSES, DEFAULT_SUBJECTS } from '../lib/storage';
import { parseSyllabusCSV, parseSyllabusJSON } from '../utils/csvParser';
import { DevModeBadge } from './DevModeBadge';

interface SyllabusPlannerProps {
  devMode?: boolean;
}

const MONTHS_LIST = [
  'April', 'May', 'July', 'August', 'September', 
  'October', 'November', 'December', 'January', 'February', 'March'
];

const STATUS_CONFIG: Record<SyllabusStatus, { label: string; bg: string; text: string; border: string; icon: React.FC<{ className?: string }> }> = {
  'Completed': { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle2 },
  'In Progress': { label: 'In Progress', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', icon: Clock },
  'Planned': { label: 'Planned', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', icon: Calendar },
  'Pending': { label: 'Pending', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', icon: AlertCircle },
  'Revised': { label: 'Revised', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', icon: RotateCcw },
  'Skipped': { label: 'Skipped', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', icon: SkipForward },
  'Rescheduled': { label: 'Rescheduled', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', icon: CalendarClock },
};

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  classSubj: 140,
  month: 120,
  unitChapter: 220,
  teachingTarget: 300,
  daysPeriods: 110,
  revisionExam: 230,
  status: 140,
  actions: 80,
};

const COLUMN_LABELS: Record<string, string> = {
  classSubj: 'Class / Subject',
  month: 'Month',
  unitChapter: 'Unit & Chapter',
  teachingTarget: 'Teaching Target / Competencies',
  daysPeriods: 'Days & Periods',
  revisionExam: 'Revision & Exam Plan',
  status: 'Completion Status',
  actions: 'Actions'
};

export default function SyllabusPlanner({ devMode = true }: SyllabusPlannerProps) {
  const [syllabusList, setSyllabusList] = useState<SyllabusItem[]>([]);
  const [classList, setClassList] = useState<ClassSection[]>([]);
  const [subjectList, setSubjectList] = useState<SubjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Column Width Resizing State
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('syllabus_planner_col_widths');
      if (saved) return { ...DEFAULT_COLUMN_WIDTHS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_COLUMN_WIDTHS;
  });

  const [isColumnResizeModalOpen, setIsColumnResizeModalOpen] = useState(false);
  const [resizingColKey, setResizingColKey] = useState<string | null>(null);

  const handleColumnResizeStart = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColKey(colKey);

    const startX = e.clientX;
    const startWidth = columnWidths[colKey] || 120;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(60, Math.min(600, startWidth + delta));
      setColumnWidths(prev => {
        const updated = { ...prev, [colKey]: newWidth };
        try {
          localStorage.setItem('syllabus_planner_col_widths', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    };

    const onMouseUp = () => {
      setResizingColKey(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handlePresetWidths = (preset: 'compact' | 'balanced' | 'wide') => {
    let newWidths: Record<string, number>;
    if (preset === 'compact') {
      newWidths = {
        classSubj: 110,
        month: 90,
        unitChapter: 170,
        teachingTarget: 220,
        daysPeriods: 90,
        revisionExam: 170,
        status: 120,
        actions: 70
      };
    } else if (preset === 'wide') {
      newWidths = {
        classSubj: 180,
        month: 140,
        unitChapter: 280,
        teachingTarget: 400,
        daysPeriods: 130,
        revisionExam: 320,
        status: 160,
        actions: 90
      };
    } else {
      newWidths = { ...DEFAULT_COLUMN_WIDTHS };
    }
    setColumnWidths(newWidths);
    try {
      localStorage.setItem('syllabus_planner_col_widths', JSON.stringify(newWidths));
    } catch {
      // ignore
    }
  };

  const handleResetColumnWidths = () => {
    setColumnWidths({ ...DEFAULT_COLUMN_WIDTHS });
    try {
      localStorage.setItem('syllabus_planner_col_widths', JSON.stringify(DEFAULT_COLUMN_WIDTHS));
    } catch {
      // ignore
    }
  };

  // Active View Tab: 'breakup' (Month & Chapter Table) | 'units' (Unit & Teaching Targets) | 'practical' (Projects & Practicals) | 'summary' (Completion Analytics)
  const [activeTab, setActiveTab] = useState<'breakup' | 'units' | 'practical' | 'summary'>('breakup');

  // Filters
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterSection, setFilterSection] = useState<string>('All');
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterUnit, setFilterUnit] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SyllabusItem | null>(null);

  // Expanded Teaching Target & Unit/Chapter IDs (click cell to view complete text)
  const [expandedTargetIds, setExpandedTargetIds] = useState<Set<string>>(new Set());
  const [expandedUnitChapterIds, setExpandedUnitChapterIds] = useState<Set<string>>(new Set());

  // Row selection state for bulk deletion & management
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // In-app Delete Confirmation Modal State (replaces window.confirm for iframe sandbox safety)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    onConfirm: () => {}
  });

  // Success Notification Toast
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const toggleExpandTarget = (id: string) => {
    setExpandedTargetIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleExpandUnitChapter = (id: string) => {
    setExpandedUnitChapterIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // PDF / Data File Syllabus Upload Modal State
  const [isUploadPdfModalOpen, setIsUploadPdfModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'paste'>('file');
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [targetSubjectUpload, setTargetSubjectUpload] = useState('Mathematics (041)');
  const [targetClassUpload, setTargetClassUpload] = useState('X');
  const [isCustomSubjectInput, setIsCustomSubjectInput] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [capturedItems, setCapturedItems] = useState<SyllabusItem[]>([]);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const [importReplaceOption, setImportReplaceOption] = useState<'replace_matching' | 'replace_all' | 'append'>('replace_matching');

  // Form Fields
  const [formData, setFormData] = useState<Omit<SyllabusItem, 'id'>>({
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Number Systems',
    chapterNo: 'Chapter 1',
    chapterTitle: '',
    teachingTarget: '',
    workingDaysRequired: 8,
    periodsRequired: 10,
    revisionPlan: '',
    examinationPlan: '',
    projectWork: '',
    practicalWork: '',
    completionStatus: 'Planned',
    targetCompletionDate: '',
    actualCompletionDate: '',
    remarks: '',
    templatePageRef: 18
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    let storedSyllabus = await db.get<SyllabusItem[]>('setup:syllabus');
    
    if (storedSyllabus && storedSyllabus.length > 0) {
      // Automatic deduplication & replacement cleanup
      // If newer imported items (json-syl- / captured-syl- / csv-syl-) exist alongside old default items for the same Class & Subject,
      // purge the superseded older entries so duplicates never persist.
      const groups = new Map<string, SyllabusItem[]>();
      for (const item of storedSyllabus) {
        const key = `${normalizeClassStr(item.className)}|${normalizeSubjectStr(item.subjectName)}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(item);
      }

      let hadDuplicates = false;
      const cleanedList: SyllabusItem[] = [];

      for (const [, items] of groups.entries()) {
        const imported = items.filter(i => i.id.startsWith('json-syl-') || i.id.startsWith('captured-syl-') || i.id.startsWith('csv-syl-'));
        const nonImported = items.filter(i => !i.id.startsWith('json-syl-') && !i.id.startsWith('captured-syl-') && !i.id.startsWith('csv-syl-'));

        if (imported.length > 0 && nonImported.length > 0) {
          // Keep the newly imported syllabus and remove superseded old items
          cleanedList.push(...imported);
          hadDuplicates = true;
        } else {
          // Remove exact duplicated chapters within the same group
          const seen = new Set<string>();
          const deduped: SyllabusItem[] = [];
          for (const it of items) {
            const signature = `${it.month.toLowerCase().trim()}|${(it.chapterNo || '').toLowerCase().trim()}|${(it.chapterTitle || '').toLowerCase().trim()}`;
            if (!seen.has(signature)) {
              seen.add(signature);
              deduped.push(it);
            } else {
              hadDuplicates = true;
            }
          }
          cleanedList.push(...deduped);
        }
      }

      if (hadDuplicates) {
        storedSyllabus = cleanedList;
        await db.set('setup:syllabus', cleanedList);
      }
      setSyllabusList(storedSyllabus);
    }

    const storedClasses = await db.get<ClassSection[]>('setup:classes');
    if (storedClasses) setClassList(storedClasses);

    const storedSubjects = await db.get<SubjectItem[]>('setup:subjects');
    if (storedSubjects) setSubjectList(storedSubjects);

    setIsLoading(false);
  };

  const promptDeleteClassSubjectSyllabus = (cls: string, sub?: string) => {
    const isSpecificSub = sub && sub !== 'All';
    const targetItems = syllabusList.filter(item => {
      const matchCls = matchClassNames(item.className, cls);
      const matchSub = isSpecificSub ? matchSubjectNames(item.subjectName, sub) : true;
      return matchCls && matchSub;
    });

    const count = targetItems.length;
    if (count === 0) return;

    const label = isSpecificSub ? `Class ${cls} — ${sub}` : `Class ${cls} (All Subjects)`;

    setDeleteConfirmModal({
      isOpen: true,
      title: `Delete Syllabus: ${label}`,
      message: `Are you sure you want to delete all ${count} syllabus chapter records for ${label}? This will remove all previously entered or imported split-up entries for this class.`,
      confirmText: `Delete ${count} Chapters`,
      onConfirm: async () => {
        const updatedList = syllabusList.filter(item => {
          const matchCls = matchClassNames(item.className, cls);
          const matchSub = isSpecificSub ? matchSubjectNames(item.subjectName, sub) : true;
          return !(matchCls && matchSub);
        });
        setSyllabusList(updatedList);
        await db.set('setup:syllabus', updatedList);
        setSelectedRowIds(new Set());
        setSuccessToast(`Deleted all ${count} syllabus chapters for ${label}.`);
        setDeleteConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const promptDeleteItem = (item: SyllabusItem) => {
    setDeleteConfirmModal({
      isOpen: true,
      title: 'Delete Syllabus Chapter Entry',
      message: `Are you sure you want to delete "${item.chapterNo ? item.chapterNo + ': ' : ''}${item.chapterTitle}" (${item.subjectName}, Class ${item.className})?`,
      confirmText: 'Delete Chapter',
      onConfirm: async () => {
        const updatedList = syllabusList.filter(i => i.id !== item.id);
        setSyllabusList(updatedList);
        await db.set('setup:syllabus', updatedList);
        setSelectedRowIds(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        setSuccessToast(`Deleted "${item.chapterTitle}" from Class ${item.className} ${item.subjectName}.`);
        setDeleteConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const promptBulkDelete = () => {
    const count = selectedRowIds.size;
    if (count === 0) return;
    setDeleteConfirmModal({
      isOpen: true,
      title: `Delete ${count} Selected Syllabus Items`,
      message: `Are you sure you want to delete these ${count} selected syllabus entries? This action cannot be undone.`,
      confirmText: `Delete ${count} Selected Items`,
      onConfirm: async () => {
        const updatedList = syllabusList.filter(item => !selectedRowIds.has(item.id));
        setSyllabusList(updatedList);
        await db.set('setup:syllabus', updatedList);
        setSelectedRowIds(new Set());
        setSuccessToast(`Successfully deleted ${count} selected syllabus entries.`);
        setDeleteConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const toggleSelectAll = (items: SyllabusItem[]) => {
    if (items.length === 0) return;
    const allSelected = items.every(i => selectedRowIds.has(i.id));
    if (allSelected) {
      setSelectedRowIds(prev => {
        const next = new Set(prev);
        items.forEach(i => next.delete(i.id));
        return next;
      });
    } else {
      setSelectedRowIds(prev => {
        const next = new Set(prev);
        items.forEach(i => next.add(i.id));
        return next;
      });
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCleanDuplicates = async () => {
    const groups = new Map<string, SyllabusItem[]>();
    for (const item of syllabusList) {
      const key = `${normalizeClassStr(item.className)}|${normalizeSubjectStr(item.subjectName)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }

    const cleanedList: SyllabusItem[] = [];
    for (const [, items] of groups.entries()) {
      const imported = items.filter(i => i.id.startsWith('json-syl-') || i.id.startsWith('captured-syl-') || i.id.startsWith('csv-syl-'));
      const nonImported = items.filter(i => !i.id.startsWith('json-syl-') && !i.id.startsWith('captured-syl-') && !i.id.startsWith('csv-syl-'));

      if (imported.length > 0 && nonImported.length > 0) {
        cleanedList.push(...imported);
      } else {
        const seen = new Set<string>();
        const deduped: SyllabusItem[] = [];
        for (const it of items) {
          const signature = `${it.month.toLowerCase().trim()}|${(it.chapterNo || '').toLowerCase().trim()}|${(it.chapterTitle || '').toLowerCase().trim()}`;
          if (!seen.has(signature)) {
            seen.add(signature);
            deduped.push(it);
          }
        }
        cleanedList.push(...deduped);
      }
    }

    setSyllabusList(cleanedList);
    await db.set('setup:syllabus', cleanedList);
  };

  const handleSaveSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.className.trim()) errors.className = 'Class is required';
    if (!formData.subjectName.trim()) errors.subjectName = 'Subject is required';
    if (!formData.chapterTitle.trim()) errors.chapterTitle = 'Chapter title is required';
    if (!formData.teachingTarget.trim()) errors.teachingTarget = 'Teaching target is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    let updatedList: SyllabusItem[];
    if (editingItem) {
      updatedList = syllabusList.map(item =>
        item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
      );
    } else {
      const newItem: SyllabusItem = {
        ...formData,
        id: `syl-${Date.now()}`
      };
      updatedList = [newItem, ...syllabusList];
    }

    setSyllabusList(updatedList);
    await db.set('setup:syllabus', updatedList);
    closeModal();
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this syllabus plan item?')) {
      const updatedList = syllabusList.filter(item => item.id !== id);
      setSyllabusList(updatedList);
      await db.set('setup:syllabus', updatedList);
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: SyllabusStatus) => {
    const updatedList = syllabusList.map(item => {
      if (item.id === id) {
        const today = new Date().toISOString().split('T')[0];
        return {
          ...item,
          completionStatus: newStatus,
          actualCompletionDate: newStatus === 'Completed' ? (item.actualCompletionDate || today) : item.actualCompletionDate
        };
      }
      return item;
    });
    setSyllabusList(updatedList);
    await db.set('setup:syllabus', updatedList);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      className: classList[0]?.className || 'X',
      section: classList[0]?.section || 'A',
      subjectName: subjectList[0]?.subjectName || 'Mathematics (041)',
      month: 'April',
      unitNo: 'Unit 1',
      unitTitle: 'Algebra',
      chapterNo: `Chapter ${syllabusList.length + 1}`,
      chapterTitle: '',
      teachingTarget: '',
      workingDaysRequired: 10,
      periodsRequired: 12,
      revisionPlan: '',
      examinationPlan: '',
      projectWork: '',
      practicalWork: '',
      completionStatus: 'Planned',
      targetCompletionDate: new Date().toISOString().split('T')[0],
      actualCompletionDate: '',
      remarks: '',
      templatePageRef: 18
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: SyllabusItem) => {
    setEditingItem(item);
    setFormData({
      className: item.className,
      section: item.section,
      subjectName: item.subjectName,
      month: item.month,
      unitNo: item.unitNo,
      unitTitle: item.unitTitle,
      chapterNo: item.chapterNo,
      chapterTitle: item.chapterTitle,
      teachingTarget: item.teachingTarget,
      workingDaysRequired: item.workingDaysRequired,
      periodsRequired: item.periodsRequired,
      revisionPlan: item.revisionPlan || '',
      examinationPlan: item.examinationPlan || '',
      projectWork: item.projectWork || '',
      practicalWork: item.practicalWork || '',
      completionStatus: item.completionStatus,
      targetCompletionDate: item.targetCompletionDate || '',
      actualCompletionDate: item.actualCompletionDate || '',
      remarks: item.remarks || '',
      templatePageRef: item.templatePageRef || 18
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Helper to ensure newly uploaded/extracted subject and class exist in system options database
  const ensureSubjectAndClassExist = async (subName?: string, clsName?: string) => {
    if (!subName || !subName.trim()) return;
    const cleanSub = subName.trim();
    const cleanCls = clsName ? clsName.trim() : 'X';

    // 1. Check & Register Subject in system database if new
    let currentSubjects = await db.get<SubjectItem[]>('setup:subjects');
    if (!currentSubjects || currentSubjects.length === 0) {
      currentSubjects = subjectList.length > 0 ? subjectList : DEFAULT_SUBJECTS;
    }

    const subExists = currentSubjects.some(
      s => s.subjectName.toLowerCase() === cleanSub.toLowerCase()
    );

    if (!subExists) {
      const codeMatch = cleanSub.match(/\((\d+)\)/);
      const newSubItem: SubjectItem = {
        id: `sbj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        subjectName: cleanSub,
        subjectCode: codeMatch ? codeMatch[1] : 'SUB',
        classLevel: `Class ${cleanCls}`,
        targetPassRate: 100,
        targetA1Count: 15
      };
      const updatedSubjects = [newSubItem, ...currentSubjects];
      setSubjectList(updatedSubjects);
      await db.set('setup:subjects', updatedSubjects);
    }

    // 2. Check & Register Class in system database if new
    let currentClasses = await db.get<ClassSection[]>('setup:classes');
    if (!currentClasses || currentClasses.length === 0) {
      currentClasses = classList.length > 0 ? classList : DEFAULT_CLASSES;
    }

    const clsExists = currentClasses.some(
      c => c.className.toLowerCase() === cleanCls.toLowerCase()
    );

    if (!clsExists && cleanCls) {
      const newClassItem: ClassSection = {
        id: `cls-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        className: cleanCls,
        section: 'A',
        classTeacherName: 'Subject Teacher',
        totalStudents: 40
      };
      const updatedClasses = [newClassItem, ...currentClasses];
      setClassList(updatedClasses);
      await db.set('setup:classes', updatedClasses);
    }
  };

  // PDF Upload & JSON Paste Handlers
  const openPdfUploadModal = () => {
    setSelectedPdfFile(null);
    setPastedJsonText('');
    setUploadMode('file');
    setCapturedItems([]);
    setUploadSuccessMessage(null);
    setUploadErrorMessage(null);
    setIsUploadPdfModalOpen(true);
  };

  const handleParsePastedJson = async () => {
    if (!pastedJsonText.trim()) {
      setUploadErrorMessage("Please paste valid JSON text into the box before parsing.");
      return;
    }

    setIsExtractingPdf(true);
    setUploadErrorMessage(null);
    setUploadSuccessMessage(null);

    try {
      const parsedItems = parseSyllabusJSON(pastedJsonText, targetClassUpload, targetSubjectUpload);
      setIsExtractingPdf(false);

      if (parsedItems.length === 0) {
        setUploadErrorMessage("No valid syllabus entries found in the pasted JSON. Please ensure it contains an array of syllabus objects or a { syllabus: [...] } wrapper.");
        return;
      }

      for (const mItem of parsedItems) {
        await ensureSubjectAndClassExist(mItem.subjectName, mItem.className);
      }

      setCapturedItems(parsedItems);
      const detectedSub = parsedItems[0]?.subjectName || targetSubjectUpload;
      const detectedCls = parsedItems[0]?.className || targetClassUpload;
      setTargetSubjectUpload(detectedSub);
      setTargetClassUpload(detectedCls);
      setUploadSuccessMessage(`Successfully parsed ${parsedItems.length} syllabus chapter entries for "${detectedSub}" (Class ${detectedCls}) from pasted JSON text!`);
    } catch (e: any) {
      setIsExtractingPdf(false);
      setUploadErrorMessage("JSON Parsing Error: " + (e?.message || 'Syntax error in JSON string'));
    }
  };

  const handlePasteSampleJson = () => {
    const sampleJson = JSON.stringify([
      {
        "month": "April",
        "unit_chapter": "Unit 1: Food\nChapter 1: Components of Food",
        "teaching_target": "Sources of food, nutrients, balanced diet and deficiency diseases",
        "working_days": 18,
        "periods_required": 12,
        "revision_plan": "Weekly oral quiz and worksheets",
        "examination_plan": "Periodic Test 1",
        "project_work": "Collect plant food samples and list nutrient content"
      },
      {
        "month": "May",
        "unit_chapter": "Unit 2: Materials\nChapter 2: Sorting Materials into Groups",
        "teaching_target": "Properties of materials, luster, hardness, solubility, transparency",
        "working_days": 15,
        "periods_required": 10,
        "revision_plan": "Diagrams and short revision",
        "examination_plan": "Periodic Test 1",
        "practical_work": "Solubility testing in laboratory"
      }
    ], null, 2);

    setPastedJsonText(sampleJson);
    setUploadErrorMessage(null);
    setUploadSuccessMessage(null);
  };

  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedPdfFile(e.target.files[0]);
      setUploadErrorMessage(null);
      setUploadSuccessMessage(null);
    }
  };

  const handleExtractSyllabusPdf = async () => {
    if (!selectedPdfFile) {
      setUploadErrorMessage("Please select a Split-Up Syllabus file (PDF, CSV, JSON, Word, Excel) to upload.");
      return;
    }

    setIsExtractingPdf(true);
    setUploadErrorMessage(null);
    setUploadSuccessMessage(null);

    const fileNameLower = selectedPdfFile.name.toLowerCase();

    try {
      if (fileNameLower.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const text = reader.result as string;
            const parsedItems = parseSyllabusJSON(text, targetClassUpload, targetSubjectUpload);
            setIsExtractingPdf(false);

            if (parsedItems.length === 0) {
              setUploadErrorMessage("No valid syllabus chapter entries found in the JSON file.");
              return;
            }

            for (const mItem of parsedItems) {
              await ensureSubjectAndClassExist(mItem.subjectName, mItem.className);
            }

            setCapturedItems(parsedItems);
            const detectedSub = parsedItems[0]?.subjectName || targetSubjectUpload;
            setUploadSuccessMessage(`Successfully parsed ${parsedItems.length} syllabus chapter entries from JSON file "${selectedPdfFile.name}"!`);
          } catch (e: any) {
            setIsExtractingPdf(false);
            setUploadErrorMessage("Failed to parse JSON syllabus file: " + (e?.message || 'Invalid format'));
          }
        };
        reader.onerror = () => {
          setIsExtractingPdf(false);
          setUploadErrorMessage("Error reading JSON file.");
        };
        reader.readAsText(selectedPdfFile);
        return;
      }

      if (fileNameLower.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const text = reader.result as string;
            const parsedItems = parseSyllabusCSV(text, targetClassUpload, targetSubjectUpload);
            setIsExtractingPdf(false);

            if (parsedItems.length === 0) {
              setUploadErrorMessage("No valid syllabus chapter entries found in the CSV file.");
              return;
            }

            for (const mItem of parsedItems) {
              await ensureSubjectAndClassExist(mItem.subjectName, mItem.className);
            }

            setCapturedItems(parsedItems);
            setUploadSuccessMessage(`Successfully parsed ${parsedItems.length} syllabus chapter entries from CSV file "${selectedPdfFile.name}"!`);
          } catch (e: any) {
            setIsExtractingPdf(false);
            setUploadErrorMessage("Failed to parse CSV syllabus file: " + (e?.message || 'Invalid format'));
          }
        };
        reader.onerror = () => {
          setIsExtractingPdf(false);
          setUploadErrorMessage("Error reading CSV file.");
        };
        reader.readAsText(selectedPdfFile);
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const resultStr = reader.result as string;
        const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;

        const response = await fetch('/api/parse-syllabus-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64: base64Data,
            mimeType: selectedPdfFile.type || 'application/pdf',
            fileName: selectedPdfFile.name,
            targetSubject: targetSubjectUpload,
            targetClass: targetClassUpload
          })
        });

        const resData = await response.json();
        setIsExtractingPdf(false);

        if (resData.success && resData.items) {
          const detectedSub = resData.extractedSubject || targetSubjectUpload;
          const detectedCls = resData.extractedClass || targetClassUpload;

          // Automatically register newly discovered subject & class in available option lists!
          await ensureSubjectAndClassExist(detectedSub, detectedCls);

          const mappedItems: SyllabusItem[] = resData.items.map((item: any, idx: number) => {
            const itemSub = item.subjectName || detectedSub;
            const itemCls = item.className || detectedCls;
            return {
              id: `captured-syl-${Date.now()}-${idx}`,
              className: itemCls,
              section: item.section || 'A',
              subjectName: itemSub,
              month: item.month || 'April',
              unitNo: item.unitNo || `Unit ${idx + 1}`,
              unitTitle: item.unitTitle || 'General Unit',
              chapterNo: item.chapterNo || `Chapter ${idx + 1}`,
              chapterTitle: item.chapterTitle || 'Chapter Title',
              teachingTarget: item.teachingTarget || '',
              workingDaysRequired: Number(item.workingDaysRequired) || 8,
              periodsRequired: Number(item.periodsRequired) || 10,
              revisionPlan: item.revisionPlan || '',
              examinationPlan: item.examinationPlan || '',
              projectWork: item.projectWork || '',
              practicalWork: item.practicalWork || '',
              completionStatus: (item.completionStatus as SyllabusStatus) || 'Planned',
              targetCompletionDate: item.targetCompletionDate || '',
              actualCompletionDate: item.actualCompletionDate || '',
              remarks: item.remarks || `Captured from ${selectedPdfFile.name}`,
              templatePageRef: 18
            };
          });

          // Ensure any item-level subject/class variations are registered as well
          for (const mItem of mappedItems) {
            await ensureSubjectAndClassExist(mItem.subjectName, mItem.className);
          }

          setCapturedItems(mappedItems);
          setTargetSubjectUpload(detectedSub);
          setUploadSuccessMessage(`Successfully captured ${mappedItems.length} syllabus chapter entries for "${detectedSub}" (Class ${detectedCls}) from "${selectedPdfFile.name}"! Subject "${detectedSub}" is now added to available dropdown options.`);
        } else {
          setUploadErrorMessage(resData.error || "Could not parse syllabus file.");
        }
      };

      reader.onerror = () => {
        setIsExtractingPdf(false);
        setUploadErrorMessage("Failed to read the selected file.");
      };

      reader.readAsDataURL(selectedPdfFile);

    } catch (err: any) {
      setIsExtractingPdf(false);
      setUploadErrorMessage(err?.message || "An error occurred while analyzing the syllabus file.");
    }
  };

  // Normalize and fuzzy-match class strings (e.g., '10', 'Class 10', 'X', 'Class X', '1', 'I')
  const normalizeClassStr = (c: string): string => {
    if (!c) return '';
    const str = c.trim().toUpperCase();

    // Direct exact matches
    if (str === '1' || str === '01' || str === 'I' || str === 'CLASS 1' || str === 'CLASS I' || str === 'GRADE 1' || str === '1ST') return 'I';
    if (str === '2' || str === '02' || str === 'II' || str === 'CLASS 2' || str === 'CLASS II' || str === 'GRADE 2' || str === '2ND') return 'II';
    if (str === '3' || str === '03' || str === 'III' || str === 'CLASS 3' || str === 'CLASS III' || str === 'GRADE 3' || str === '3RD') return 'III';
    if (str === '4' || str === '04' || str === 'IV' || str === 'CLASS 4' || str === 'CLASS IV' || str === 'GRADE 4' || str === '4TH') return 'IV';
    if (str === '5' || str === '05' || str === 'V' || str === 'CLASS 5' || str === 'CLASS V' || str === 'GRADE 5' || str === '5TH') return 'V';
    if (str === '6' || str === '06' || str === 'VI' || str === 'CLASS 6' || str === 'CLASS VI' || str === 'GRADE 6' || str === '6TH') return 'VI';
    if (str === '7' || str === '07' || str === 'VII' || str === 'CLASS 7' || str === 'CLASS VII' || str === 'GRADE 7' || str === '7TH') return 'VII';
    if (str === '8' || str === '08' || str === 'VIII' || str === 'CLASS 8' || str === 'CLASS VIII' || str === 'GRADE 8' || str === '8TH') return 'VIII';
    if (str === '9' || str === '09' || str === 'IX' || str === 'CLASS 9' || str === 'CLASS IX' || str === 'GRADE 9' || str === '9TH') return 'IX';
    if (str === '10' || str === 'X' || str === 'CLASS 10' || str === 'CLASS X' || str === 'GRADE 10' || str === '10TH') return 'X';
    if (str === '11' || str === 'XI' || str === 'CLASS 11' || str === 'CLASS XI' || str === 'GRADE 11' || str === '11TH') return 'XI';
    if (str === '12' || str === 'XII' || str === 'CLASS 12' || str === 'CLASS XII' || str === 'GRADE 12' || str === '12TH') return 'XII';

    // Regex check for strings like "Class 12-A" or "6th"
    const m12 = str.match(/(?:CLASS|GRADE|STD|STANDARD)?\s*(12|XII|12TH)\b/);
    if (m12) return 'XII';
    const m11 = str.match(/(?:CLASS|GRADE|STD|STANDARD)?\s*(11|XI|11TH)\b/);
    if (m11) return 'XI';
    const m10 = str.match(/(?:CLASS|GRADE|STD|STANDARD)?\s*(10|X|10TH)\b/);
    if (m10) return 'X';
    const m9 = str.match(/(?:CLASS|GRADE|STD|STANDARD)?\s*(9|IX|9TH)\b/);
    if (m9) return 'IX';
    const m8 = str.match(/(?:CLASS|GRADE|STD|STANDARD)?\s*(8|VIII|8TH)\b/);
    if (m8) return 'VIII';
    const m7 = str.match(/(?:CLASS|GRADE|STD|STANDARD)?\s*(7|VII|7TH)\b/);
    if (m7) return 'VII';
    const m6 = str.match(/(?:CLASS|GRADE|STD|STANDARD)?\s*(6|VI|6TH)\b/);
    if (m6) return 'VI';
    const m5 = str.match(/(?:CLASS|GRADE|STD|STANDARD)?\s*(5|V|5TH)\b/);
    if (m5) return 'V';
    const m4 = str.match(/(?:CLASS|GRADE|STD|STANDARD)?\s*(4|IV|4TH)\b/);
    if (m4) return 'IV';
    const m3 = str.match(/(?:CLASS|GRADE|STD|STANDARD)?\s*(3|III|3RD)\b/);
    if (m3) return 'III';
    const m2 = str.match(/(?:CLASS|GRADE|STD|STANDARD)?\s*(2|II|2ND)\b/);
    if (m2) return 'II';
    const m1 = str.match(/(?:CLASS|GRADE|STD|STANDARD)?\s*(1|I|1ST)\b/);
    if (m1) return 'I';

    return str.replace(/^CLASS\s+/i, '');
  };

  const matchClassNames = (itemClass: string, filterClass: string): boolean => {
    if (!filterClass || filterClass === 'All') return true;
    const normItem = normalizeClassStr(itemClass);
    const normFilter = normalizeClassStr(filterClass);

    if (normItem && normFilter) {
      return normItem === normFilter;
    }

    return itemClass.trim().toLowerCase() === filterClass.trim().toLowerCase();
  };

  // Normalize and fuzzy-match subject strings (e.g. 'Mathematics (041)', 'Mathematics', 'Maths', 'Sanskrit', 'संस्कृत')
  const normalizeSubjectStr = (s: string): string => {
    if (!s) return '';
    let cleaned = s.trim().toLowerCase().replace(/\s*\(\d+\)/g, '');

    // Common multilingual & alias normalizations
    if (cleaned.includes('sanskrit') || cleaned.includes('संस्कृत') || cleaned.includes('संस्कृतम्')) return 'sanskrit';
    if (cleaned.includes('hindi') || cleaned.includes('हिंदी') || cleaned.includes('हिन्दी')) return 'hindi';
    if (cleaned.includes('math') || cleaned.includes('गणित')) return 'mathematics';
    if (cleaned.includes('science') || cleaned.includes('विज्ञान')) {
      if (cleaned.includes('social') || cleaned.includes('सामाजिक') || cleaned.includes('sst')) return 'socialscience';
      if (cleaned.includes('computer') || cleaned.includes('संगणक')) return 'computerscience';
      return 'science';
    }
    if (cleaned.includes('social') || cleaned.includes('सामाजिक') || cleaned.includes('sst')) return 'socialscience';
    if (cleaned.includes('english') || cleaned.includes('अंग्रेजी') || cleaned.includes('आंग्ल')) return 'english';
    if (cleaned.includes('evs') || cleaned.includes('environmental') || cleaned.includes('पर्यावरण')) return 'evs';
    if (cleaned.includes('physics') || cleaned.includes('भौतिक')) return 'physics';
    if (cleaned.includes('chemistry') || cleaned.includes('रसायन')) return 'chemistry';
    if (cleaned.includes('biology') || cleaned.includes('जीव')) return 'biology';
    if (cleaned.includes('history') || cleaned.includes('इतिहास')) return 'history';
    if (cleaned.includes('geography') || cleaned.includes('भूगोल')) return 'geography';
    if (cleaned.includes('economics') || cleaned.includes('अर्थशास्त्र')) return 'economics';
    if (cleaned.includes('physical') || cleaned.includes('p&he') || cleaned.includes('phe') || cleaned.includes('शारीरिक')) return 'physicaleducation';

    return cleaned.replace(/[\s\-_–—,.:;()\/]+/g, '').replace(/[^a-z0-9\u0900-\u097F]/g, '');
  };

  const matchSubjectNames = (itemSubject: string, filterSubject: string): boolean => {
    if (!filterSubject || filterSubject === 'All') return true;
    const normItem = normalizeSubjectStr(itemSubject);
    const normFilter = normalizeSubjectStr(filterSubject);
    if (normItem && normFilter && normItem === normFilter) return true;
    if (normItem && normFilter && (normItem.includes(normFilter) || normFilter.includes(normItem))) return true;
    return itemSubject.trim().toLowerCase() === filterSubject.trim().toLowerCase();
  };

  const handleImportCapturedSyllabus = async () => {
    if (capturedItems.length === 0) return;

    // Register all subjects/classes in captured items
    for (const item of capturedItems) {
      await ensureSubjectAndClassExist(item.subjectName, item.className);
    }

    let updatedList: SyllabusItem[] = [];

    if (importReplaceOption === 'replace_all') {
      // Delete & replace ALL existing session data
      updatedList = [...capturedItems];
    } else if (importReplaceOption === 'replace_matching') {
      // Delete & replace previous data for matching Class & Subject(s) with deep fuzzy match
      const remainingOldItems = syllabusList.filter(oldItem => {
        const isReplacedByNew = capturedItems.some(newItem => {
          const classMatch = matchClassNames(oldItem.className, newItem.className);
          const subjectMatch = matchSubjectNames(oldItem.subjectName, newItem.subjectName);
          return classMatch && subjectMatch;
        });
        return !isReplacedByNew;
      });

      updatedList = [...capturedItems, ...remainingOldItems];
    } else {
      // Append to existing
      updatedList = [...capturedItems, ...syllabusList];
    }

    setSyllabusList(updatedList);
    await db.set('setup:syllabus', updatedList);

    // If all captured items belong to one class/subject, filter to that; otherwise set to 'All'
    const capturedClasses = Array.from(new Set(capturedItems.map(i => normalizeClassStr(i.className))));
    const capturedSubjects = Array.from(new Set(capturedItems.map(i => normalizeSubjectStr(i.subjectName))));

    if (capturedClasses.length === 1 && capturedClasses[0]) {
      const matchCls = ALL_STANDARD_CLASSES.find(c => normalizeClassStr(c) === capturedClasses[0]) || capturedItems[0].className;
      setFilterClass(matchCls);
    } else {
      setFilterClass('All');
    }

    if (capturedSubjects.length === 1 && capturedItems[0]?.subjectName) {
      setFilterSubject(capturedItems[0].subjectName);
    } else {
      setFilterSubject('All');
    }

    setIsUploadPdfModalOpen(false);
    setCapturedItems([]);
    setSelectedPdfFile(null);
    setPastedJsonText('');
    setUploadSuccessMessage(null);
  };

  // Derive Filter Options
  const ALL_STANDARD_CLASSES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const ALL_STANDARD_SUBJECTS = [
    'Environmental Studies (EVS)',
    'Mathematics (Primary)',
    'English (Primary)',
    'Hindi (Primary)',
    'Mathematics (041)',
    'Science (086)',
    'Social Science (087)',
    'English Language & Lit. (184)',
    'English Core (301)',
    'Hindi Course-A (002)',
    'Sanskrit (122)',
    'Sanskrit',
    'Physics (042)',
    'Chemistry (043)',
    'Biology (044)',
    'Computer Science (083)',
    'Accountancy (055)',
    'Business Studies (054)',
    'Economics (030)',
    'History (027)',
    'Geography (029)',
    'Political Science (028)',
    'Physical Education (048)'
  ];

  const uniqueUnits = Array.from(new Set(syllabusList.map(s => s.unitNo))).sort();
  const rawClasses = [
    ...ALL_STANDARD_CLASSES,
    ...classList.map(c => c.className),
    ...syllabusList.map(s => s.className)
  ];
  const uniqueClassesMap = new Map<string, string>();
  rawClasses.forEach(c => {
    const norm = normalizeClassStr(c);
    if (norm && !uniqueClassesMap.has(norm)) {
      uniqueClassesMap.set(norm, norm);
    }
  });
  const uniqueClasses = Array.from(uniqueClassesMap.values()).sort((a, b) => {
    const order: Record<string, number> = { 
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 
      'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 
    };
    return (order[a] || 99) - (order[b] || 99);
  });
  const uniqueSubjects = Array.from(new Set([
    ...ALL_STANDARD_SUBJECTS,
    ...subjectList.map(s => s.subjectName),
    ...syllabusList.map(s => s.subjectName)
  ])).sort();

  // Filter Logic
  const filteredSyllabus = syllabusList.filter(item => {
    if (!matchClassNames(item.className, filterClass)) return false;
    if (filterSection !== 'All' && item.section !== filterSection && item.section !== 'All') return false;
    if (!matchSubjectNames(item.subjectName, filterSubject)) return false;
    if (filterMonth !== 'All' && item.month.trim().toLowerCase() !== filterMonth.trim().toLowerCase()) return false;
    if (filterUnit !== 'All' && item.unitNo !== filterUnit) return false;
    if (filterStatus !== 'All' && item.completionStatus !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.chapterTitle.toLowerCase().includes(q) ||
        item.chapterNo.toLowerCase().includes(q) ||
        item.unitTitle.toLowerCase().includes(q) ||
        item.teachingTarget.toLowerCase().includes(q) ||
        item.revisionPlan.toLowerCase().includes(q) ||
        item.projectWork.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Calculate Metrics
  const totalItems = filteredSyllabus.length;
  const completedCount = filteredSyllabus.filter(s => s.completionStatus === 'Completed').length;
  const inProgressCount = filteredSyllabus.filter(s => s.completionStatus === 'In Progress').length;
  const pendingCount = filteredSyllabus.filter(s => s.completionStatus === 'Pending').length;
  const plannedCount = filteredSyllabus.filter(s => s.completionStatus === 'Planned').length;
  const revisedCount = filteredSyllabus.filter(s => s.completionStatus === 'Revised').length;
  const skippedCount = filteredSyllabus.filter(s => s.completionStatus === 'Skipped').length;
  const rescheduledCount = filteredSyllabus.filter(s => s.completionStatus === 'Rescheduled').length;

  const totalPeriodsPlanned = filteredSyllabus.reduce((acc, curr) => acc + (Number(curr.periodsRequired) || 0), 0);
  const totalWorkingDays = filteredSyllabus.reduce((acc, curr) => acc + (Number(curr.workingDaysRequired) || 0), 0);
  const completionPercentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              Syllabus & Lesson Planning (Split-Up Syllabus)
            </h2>
            {devMode && <DevModeBadge pages={18} title="12. Month-Wise Split-Up Syllabus (5 Pages)" />}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Annual syllabus plan, month-wise breakups, unit targets, working days, revision plans, and completion tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openPdfUploadModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
          >
            <FileUp className="w-4 h-4 text-amber-300" />
            <span>Import / Paste Split-Up Syllabus</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Syllabus Item</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Chapters</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-100">{totalItems}</div>
          <div className="text-[11px] text-slate-400 mt-1">{totalWorkingDays} Working Days</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Completion Rate</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{completionPercentage}%</div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${completionPercentage}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{completedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">{totalPeriodsPlanned} Total Periods</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>In Progress</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{inProgressCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">{plannedCount} Planned Items</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pending / Delayed</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">{pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">{rescheduledCount} Rescheduled</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Revised / Skipped</span>
            <RotateCcw className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-100">{revisedCount + skippedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">{revisedCount} Revised, {skippedCount} Skipped</div>
        </div>
      </div>

      {/* Navigation Tabs & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('breakup')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'breakup'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Month-Wise Breakup Table
            </button>

            <button
              onClick={() => setActiveTab('units')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'units'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              Unit & Teaching Targets
            </button>

            <button
              onClick={() => setActiveTab('practical')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'practical'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              Projects & Practicals
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Annual Completion Report
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Showing <strong className="text-slate-200">{filteredSyllabus.length}</strong> items</span>
            {activeTab === 'breakup' && (
              <button
                onClick={() => setIsColumnResizeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-500/30 transition-colors shadow-sm ml-1"
                title="Resize and adjust table column widths"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Resize Columns</span>
              </button>
            )}
            <button
              onClick={loadData}
              title="Refresh Syllabus Data"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Multi-field Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Class</label>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Classes</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Section</label>
            <select
              value={filterSection}
              onChange={e => setFilterSection(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Subject</label>
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Subjects</option>
              {uniqueSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Month</label>
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Months</option>
              {MONTHS_LIST.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Unit Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Unit</label>
            <select
              value={filterUnit}
              onChange={e => setFilterUnit(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Units</option>
              {uniqueUnits.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Revised">Revised</option>
              <option value="Skipped">Skipped</option>
              <option value="Rescheduled">Rescheduled</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search chapters, learning targets, revision plans, projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Active Filter & Management Toolbar */}
        {(filterClass !== 'All' || filterSubject !== 'All' || filterMonth !== 'All' || filterStatus !== 'All' || filterSection !== 'All' || filterUnit !== 'All' || searchQuery || selectedRowIds.size > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-slate-300">
              <span className="text-slate-400 font-medium">Active Filters:</span>
              {filterClass !== 'All' && (
                <span className="px-2 py-0.5 bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 rounded font-medium">
                  Class {filterClass}
                </span>
              )}
              {filterSubject !== 'All' && (
                <span className="px-2 py-0.5 bg-purple-950/60 border border-purple-700/50 text-purple-300 rounded font-medium">
                  {filterSubject}
                </span>
              )}
              {filterMonth !== 'All' && (
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded">
                  {filterMonth}
                </span>
              )}
              {filterStatus !== 'All' && (
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded">
                  {filterStatus}
                </span>
              )}
              {selectedRowIds.size > 0 && (
                <span className="px-2 py-0.5 bg-rose-950/80 border border-rose-600/60 text-rose-300 rounded font-bold">
                  {selectedRowIds.size} Selected
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Bulk Delete Selected Button */}
              {selectedRowIds.size > 0 && (
                <button
                  type="button"
                  onClick={promptBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors shadow-sm text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedRowIds.size})</span>
                </button>
              )}

              {/* Delete Filtered Class / Subject Syllabus */}
              {filterClass !== 'All' && filteredSyllabus.length > 0 && (
                <button
                  type="button"
                  onClick={() => promptDeleteClassSubjectSyllabus(filterClass, filterSubject)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-700/60 rounded-lg transition-colors text-xs font-semibold"
                  title={filterSubject !== 'All' ? `Delete all syllabus records for Class ${filterClass} - ${filterSubject}` : `Delete all syllabus records for Class ${filterClass}`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    {filterSubject !== 'All'
                      ? `Delete Class ${filterClass} (${filterSubject}) [${filteredSyllabus.length}]`
                      : `Delete All Class ${filterClass} Syllabus [${filteredSyllabus.length}]`}
                  </span>
                </button>
              )}

              {selectedRowIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRowIds(new Set())}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-xs"
                >
                  Deselect All
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setFilterClass('All');
                  setFilterSection('All');
                  setFilterSubject('All');
                  setFilterMonth('All');
                  setFilterUnit('All');
                  setFilterStatus('All');
                  setSearchQuery('');
                  setSelectedRowIds(new Set());
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-xs"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Views */}
      {isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          Loading syllabus planning records...
        </div>
      ) : filteredSyllabus.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-base text-slate-300 font-medium">No syllabus items found matching your filters</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try resetting your search query or filters, or add a new syllabus breakup entry.
          </p>
          <button
            onClick={() => {
              setFilterClass('All');
              setFilterSection('All');
              setFilterSubject('All');
              setFilterMonth('All');
              setFilterUnit('All');
              setFilterStatus('All');
              setSearchQuery('');
              setSelectedRowIds(new Set());
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : activeTab === 'breakup' ? (
        /* View 1: Month-Wise Split-Up Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-300 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                  {/* Bulk Select Checkbox Column */}
                  <th className="py-3 px-3 w-10 text-center select-none border-r border-slate-800/40">
                    <button
                      type="button"
                      onClick={() => toggleSelectAll(filteredSyllabus)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center justify-center"
                      title={filteredSyllabus.length > 0 && filteredSyllabus.every(i => selectedRowIds.has(i.id)) ? "Deselect all visible items" : "Select all visible items"}
                    >
                      {filteredSyllabus.length > 0 && filteredSyllabus.every(i => selectedRowIds.has(i.id)) ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : selectedRowIds.size > 0 ? (
                        <div className="w-4 h-4 border border-indigo-400 bg-indigo-500/20 rounded flex items-center justify-center">
                          <div className="w-2 h-0.5 bg-indigo-400 rounded" />
                        </div>
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                      )}
                    </button>
                  </th>

                  <th
                    style={{ width: `${columnWidths.classSubj}px`, minWidth: `${columnWidths.classSubj}px` }}
                    className="py-3 px-3 relative group/th select-none border-r border-slate-800/40"
                  >
                    <span>Class/Subj</span>
                    <div
                      onMouseDown={(e) => handleColumnResizeStart('classSubj', e)}
                      className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-20 flex items-center justify-center group/handle ${resizingColKey === 'classSubj' ? 'bg-indigo-500/40' : 'hover:bg-indigo-500/20'}`}
                      title="Click & drag to resize column"
                    >
                      <div className={`w-0.5 h-4 ${resizingColKey === 'classSubj' ? 'bg-indigo-400' : 'bg-slate-700 group-hover/handle:bg-indigo-400'} rounded transition-colors`} />
                    </div>
                  </th>

                  <th
                    style={{ width: `${columnWidths.month}px`, minWidth: `${columnWidths.month}px` }}
                    className="py-3 px-3 relative group/th select-none border-r border-slate-800/40"
                  >
                    <span>Month</span>
                    <div
                      onMouseDown={(e) => handleColumnResizeStart('month', e)}
                      className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-20 flex items-center justify-center group/handle ${resizingColKey === 'month' ? 'bg-indigo-500/40' : 'hover:bg-indigo-500/20'}`}
                      title="Click & drag to resize column"
                    >
                      <div className={`w-0.5 h-4 ${resizingColKey === 'month' ? 'bg-indigo-400' : 'bg-slate-700 group-hover/handle:bg-indigo-400'} rounded transition-colors`} />
                    </div>
                  </th>

                  <th
                    style={{ width: `${columnWidths.unitChapter}px`, minWidth: `${columnWidths.unitChapter}px` }}
                    className="py-3 px-3 relative group/th select-none border-r border-slate-800/40"
                  >
                    <span>Unit & Chapter</span>
                    <div
                      onMouseDown={(e) => handleColumnResizeStart('unitChapter', e)}
                      className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-20 flex items-center justify-center group/handle ${resizingColKey === 'unitChapter' ? 'bg-indigo-500/40' : 'hover:bg-indigo-500/20'}`}
                      title="Click & drag to resize column"
                    >
                      <div className={`w-0.5 h-4 ${resizingColKey === 'unitChapter' ? 'bg-indigo-400' : 'bg-slate-700 group-hover/handle:bg-indigo-400'} rounded transition-colors`} />
                    </div>
                  </th>

                  <th
                    style={{ width: `${columnWidths.teachingTarget}px`, minWidth: `${columnWidths.teachingTarget}px` }}
                    className="py-3 px-3 relative group/th select-none border-r border-slate-800/40"
                  >
                    <span>Teaching Target / Competencies</span>
                    <div
                      onMouseDown={(e) => handleColumnResizeStart('teachingTarget', e)}
                      className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-20 flex items-center justify-center group/handle ${resizingColKey === 'teachingTarget' ? 'bg-indigo-500/40' : 'hover:bg-indigo-500/20'}`}
                      title="Click & drag to resize column"
                    >
                      <div className={`w-0.5 h-4 ${resizingColKey === 'teachingTarget' ? 'bg-indigo-400' : 'bg-slate-700 group-hover/handle:bg-indigo-400'} rounded transition-colors`} />
                    </div>
                  </th>

                  <th
                    style={{ width: `${columnWidths.daysPeriods}px`, minWidth: `${columnWidths.daysPeriods}px` }}
                    className="py-3.5 px-3 text-center relative group/th select-none border-r border-slate-800/40"
                  >
                    <span>Days/Periods</span>
                    <div
                      onMouseDown={(e) => handleColumnResizeStart('daysPeriods', e)}
                      className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-20 flex items-center justify-center group/handle ${resizingColKey === 'daysPeriods' ? 'bg-indigo-500/40' : 'hover:bg-indigo-500/20'}`}
                      title="Click & drag to resize column"
                    >
                      <div className={`w-0.5 h-4 ${resizingColKey === 'daysPeriods' ? 'bg-indigo-400' : 'bg-slate-700 group-hover/handle:bg-indigo-400'} rounded transition-colors`} />
                    </div>
                  </th>

                  <th
                    style={{ width: `${columnWidths.revisionExam}px`, minWidth: `${columnWidths.revisionExam}px` }}
                    className="py-3 px-3 relative group/th select-none border-r border-slate-800/40"
                  >
                    <span>Revision & Exam Plan</span>
                    <div
                      onMouseDown={(e) => handleColumnResizeStart('revisionExam', e)}
                      className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-20 flex items-center justify-center group/handle ${resizingColKey === 'revisionExam' ? 'bg-indigo-500/40' : 'hover:bg-indigo-500/20'}`}
                      title="Click & drag to resize column"
                    >
                      <div className={`w-0.5 h-4 ${resizingColKey === 'revisionExam' ? 'bg-indigo-400' : 'bg-slate-700 group-hover/handle:bg-indigo-400'} rounded transition-colors`} />
                    </div>
                  </th>

                  <th
                    style={{ width: `${columnWidths.status}px`, minWidth: `${columnWidths.status}px` }}
                    className="py-3 px-3 relative group/th select-none border-r border-slate-800/40"
                  >
                    <span>Completion Status</span>
                    <div
                      onMouseDown={(e) => handleColumnResizeStart('status', e)}
                      className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-20 flex items-center justify-center group/handle ${resizingColKey === 'status' ? 'bg-indigo-500/40' : 'hover:bg-indigo-500/20'}`}
                      title="Click & drag to resize column"
                    >
                      <div className={`w-0.5 h-4 ${resizingColKey === 'status' ? 'bg-indigo-400' : 'bg-slate-700 group-hover/handle:bg-indigo-400'} rounded transition-colors`} />
                    </div>
                  </th>

                  <th
                    style={{ width: `${columnWidths.actions}px`, minWidth: `${columnWidths.actions}px` }}
                    className="py-3 px-3 text-right"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredSyllabus.map(item => {
                  const statusInfo = STATUS_CONFIG[item.completionStatus] || STATUS_CONFIG['Planned'];
                  const StatusIcon = statusInfo.icon;
                  const isRowSelected = selectedRowIds.has(item.id);

                  return (
                    <tr key={item.id} className={`hover:bg-slate-800/40 transition-colors group ${isRowSelected ? 'bg-indigo-950/25' : ''}`}>
                      {/* Row selection checkbox */}
                      <td className="py-3 px-3 text-center border-r border-slate-800/30">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(item.id)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center justify-center"
                          title={isRowSelected ? "Deselect item" : "Select item"}
                        >
                          {isRowSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      <td style={{ width: `${columnWidths.classSubj}px`, minWidth: `${columnWidths.classSubj}px` }} className="py-3 px-3 font-medium overflow-hidden border-r border-slate-800/30">
                        <div className="text-slate-100 font-semibold">Class {item.className}-{item.section}</div>
                        <div className="text-[11px] text-slate-400">{item.subjectName}</div>
                      </td>

                      <td style={{ width: `${columnWidths.month}px`, minWidth: `${columnWidths.month}px` }} className="py-3 px-3 overflow-hidden border-r border-slate-800/30">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/60">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          {item.month}
                        </span>
                      </td>

                      <td
                        onClick={() => toggleExpandUnitChapter(item.id)}
                        style={{ width: `${columnWidths.unitChapter}px`, minWidth: `${columnWidths.unitChapter}px` }}
                        className="py-3 px-3 overflow-hidden border-r border-slate-800/30 cursor-pointer hover:bg-indigo-950/20 transition-colors group/cell select-text"
                        title="Click cell to expand/collapse complete Unit & Chapter text"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 space-y-1">
                            {/* Unit Name & Number - Complete display for all */}
                            {(item.unitNo || item.unitTitle) && item.unitTitle !== 'General Unit' && item.unitTitle !== item.chapterTitle && (
                              <div className="text-[11px] font-bold text-indigo-200 bg-indigo-950/60 border border-indigo-500/30 px-2 py-1 rounded-md whitespace-pre-wrap break-words leading-normal">
                                {item.unitNo ? <span className="text-indigo-300 mr-1">{item.unitNo}{item.unitTitle ? ' — ' : ''}</span> : null}
                                <span>{item.unitTitle}</span>
                              </div>
                            )}
                            {/* Chapter Title & Topics - Complete display */}
                            <div className={`font-semibold text-slate-100 text-xs leading-relaxed whitespace-pre-wrap break-words ${expandedUnitChapterIds.has(item.id) ? 'bg-slate-950/70 p-2 rounded-lg border border-indigo-500/30 my-1' : ''}`}>
                              {item.chapterNo && !item.chapterTitle.toLowerCase().includes(item.chapterNo.toLowerCase()) ? `${item.chapterNo}: ` : ''}{item.chapterTitle}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandUnitChapter(item.id);
                            }}
                            className="p-1 text-slate-500 hover:text-indigo-300 group-hover/cell:text-indigo-400 rounded transition-colors flex-shrink-0 mt-0.5"
                            title={expandedUnitChapterIds.has(item.id) ? "Collapse view" : "Click to view highlighted view"}
                          >
                            {expandedUnitChapterIds.has(item.id) ? (
                              <ChevronUp className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 group-hover/cell:text-indigo-300" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td
                        onClick={() => toggleExpandTarget(item.id)}
                        style={{ width: `${columnWidths.teachingTarget}px`, minWidth: `${columnWidths.teachingTarget}px` }}
                        className="py-3 px-3 overflow-hidden border-r border-slate-800/30 cursor-pointer hover:bg-indigo-950/20 transition-colors group/cell select-text"
                        title="Click cell to expand/collapse complete Teaching Target & Competencies text"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1">
                            <p className={`text-slate-300 leading-relaxed ${expandedTargetIds.has(item.id) ? 'whitespace-pre-wrap font-normal text-xs text-slate-100 bg-slate-950/60 p-2 rounded-lg border border-indigo-500/30 my-1' : 'line-clamp-3'}`}>
                              {item.teachingTarget || <span className="text-slate-500 italic">No targets specified</span>}
                            </p>
                            {item.remarks && (
                              <span className="text-[10px] text-slate-500 italic block mt-1">
                                Note: {item.remarks}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandTarget(item.id);
                            }}
                            className="p-1 text-slate-500 hover:text-indigo-300 group-hover/cell:text-indigo-400 rounded transition-colors flex-shrink-0"
                            title={expandedTargetIds.has(item.id) ? "Collapse text" : "Click to view full complete text"}
                          >
                            {expandedTargetIds.has(item.id) ? (
                              <ChevronUp className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 group-hover/cell:text-indigo-300" />
                            )}
                          </button>
                        </div>
                        {!expandedTargetIds.has(item.id) && item.teachingTarget && item.teachingTarget.length > 60 && (
                          <span className="text-[10px] text-indigo-400/80 font-medium mt-1 inline-flex items-center gap-1 group-hover/cell:underline">
                            <Eye className="w-3 h-3" /> Click cell to view complete text
                          </span>
                        )}
                      </td>

                      <td style={{ width: `${columnWidths.daysPeriods}px`, minWidth: `${columnWidths.daysPeriods}px` }} className="py-3 px-3 text-center overflow-hidden border-r border-slate-800/30">
                        <div className="font-semibold text-slate-200">{item.workingDaysRequired} Days</div>
                        <div className="text-[11px] text-slate-400">{item.periodsRequired} Periods</div>
                      </td>

                      <td style={{ width: `${columnWidths.revisionExam}px`, minWidth: `${columnWidths.revisionExam}px` }} className="py-3 px-3 text-[11px] overflow-hidden border-r border-slate-800/30">
                        {item.revisionPlan && item.examinationPlan && item.revisionPlan.trim() !== item.examinationPlan.trim() ? (
                          <>
                            <div className="text-slate-300"><strong className="text-slate-400">Rev:</strong> {item.revisionPlan}</div>
                            <div className="text-amber-400/90 mt-0.5"><strong className="text-slate-400">Exam:</strong> {item.examinationPlan}</div>
                          </>
                        ) : item.revisionPlan ? (
                          <div className="text-slate-300"><strong className="text-indigo-300">Rev & Exam:</strong> {item.revisionPlan}</div>
                        ) : item.examinationPlan ? (
                          <div className="text-amber-400/90"><strong className="text-amber-300">Exam:</strong> {item.examinationPlan}</div>
                        ) : (
                          <span className="text-slate-500 italic">—</span>
                        )}
                      </td>

                      <td style={{ width: `${columnWidths.status}px`, minWidth: `${columnWidths.status}px` }} className="py-3 px-3 overflow-hidden border-r border-slate-800/30">
                        {/* Quick status selector */}
                        <div className="relative group/status inline-block">
                          <select
                            value={item.completionStatus}
                            onChange={(e) => handleQuickStatusChange(item.id, e.target.value as SyllabusStatus)}
                            className={`appearance-none cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-md border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border} focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-6`}
                          >
                            <option value="Planned" className="bg-slate-900 text-slate-200">Planned</option>
                            <option value="In Progress" className="bg-slate-900 text-slate-200">In Progress</option>
                            <option value="Completed" className="bg-slate-900 text-slate-200">Completed</option>
                            <option value="Pending" className="bg-slate-900 text-slate-200">Pending</option>
                            <option value="Revised" className="bg-slate-900 text-slate-200">Revised</option>
                            <option value="Skipped" className="bg-slate-900 text-slate-200">Skipped</option>
                            <option value="Rescheduled" className="bg-slate-900 text-slate-200">Rescheduled</option>
                          </select>
                        </div>
                        {item.actualCompletionDate && (
                          <div className="text-[10px] text-emerald-500 mt-1">Done: {item.actualCompletionDate}</div>
                        )}
                      </td>

                      <td style={{ width: `${columnWidths.actions}px`, minWidth: `${columnWidths.actions}px` }} className="py-3 px-3 text-right overflow-hidden">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit Item"
                            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => promptDeleteItem(item)}
                            title="Delete Item"
                            className="p-1.5 hover:bg-rose-500/20 rounded-md text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'units' ? (
        /* View 2: Unit & Teaching Targets Detailed Cards */
        <div className="space-y-4">
          {filteredSyllabus.map(item => {
            const statusInfo = STATUS_CONFIG[item.completionStatus] || STATUS_CONFIG['Planned'];
            const StatusIcon = statusInfo.icon;

            return (
              <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                        Class {item.className}-{item.section}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium">
                        {item.subjectName}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium">
                        {item.month}
                      </span>
                      {devMode && <DevModeBadge pages={item.templatePageRef || 18} title="Page 18 - Split-Up Syllabus" />}
                    </div>
                    <h3 className="text-base font-bold text-slate-100 mt-2">
                      {item.unitNo}: {item.unitTitle} — <span className="text-indigo-300">{item.chapterNo}: {item.chapterTitle}</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusInfo.label}
                    </span>
                    <button
                      onClick={() => openEditModal(item)}
                      title="Edit Item"
                      className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => promptDeleteItem(item)}
                      title="Delete Item"
                      className="p-1.5 hover:bg-rose-500/20 rounded-md text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
                    <h4 className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      Teaching Targets & NCERT Learning Competencies
                    </h4>
                    <p className="text-slate-300 leading-relaxed">{item.teachingTarget}</p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
                    <h4 className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Time Allocation
                    </h4>
                    <div className="space-y-1 text-slate-300">
                      <div>Required Working Days: <strong className="text-slate-100">{item.workingDaysRequired} Days</strong></div>
                      <div>Required Periods: <strong className="text-slate-100">{item.periodsRequired} Periods</strong></div>
                      <div>Target Date: <strong className="text-slate-100">{item.targetCompletionDate || 'N/A'}</strong></div>
                      {item.actualCompletionDate && (
                        <div>Completed Date: <strong className="text-emerald-400">{item.actualCompletionDate}</strong></div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-800/40 border border-slate-800/60 rounded-lg p-3 space-y-1">
                    <span className="font-medium text-slate-400 block text-[11px]">Revision Strategy & Worksheets</span>
                    <p className="text-slate-200">{item.revisionPlan || 'No specific revision plan noted.'}</p>
                  </div>

                  <div className="bg-slate-800/40 border border-slate-800/60 rounded-lg p-3 space-y-1">
                    <span className="font-medium text-slate-400 block text-[11px]">Examination & Assessment Integration</span>
                    <p className="text-amber-300/90">{item.examinationPlan || 'Standard class test evaluation.'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : activeTab === 'practical' ? (
        /* View 3: Projects & Practicals Tracker */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSyllabus.map(item => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-indigo-400">Class {item.className}-{item.section}</span>
                  <h3 className="font-bold text-slate-100 text-sm">{item.chapterNo}: {item.chapterTitle}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {devMode && <DevModeBadge pages={23} title="Page 23 - Projects & Practicals" />}
                  <button
                    onClick={() => openEditModal(item)}
                    title="Edit Item"
                    className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => promptDeleteItem(item)}
                    title="Delete Item"
                    className="p-1.5 hover:bg-rose-500/20 rounded-md text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <FolderKanban className="w-4 h-4" />
                  Art Integrated & Multi-Disciplinary Project (MDP)
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {item.projectWork || 'No specific project assigned for this chapter.'}
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <FlaskConical className="w-4 h-4" />
                  Maths Lab Practical Work / Activity
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {item.practicalWork || 'No lab practical specified.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* View 4: Annual Completion Report Summary */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                Annual Syllabus Completion Status Audit
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Official KVS Teacher Diary audit summary of completed syllabus vs planned targets.
              </p>
            </div>
            {devMode && <DevModeBadge pages={18} title="Page 18 - Syllabus Audit" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Spectrum Progress Bar */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-5 space-y-4">
              <h4 className="text-sm font-semibold text-slate-200">Syllabus Status Distribution</h4>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Completed ({completedCount})</span>
                    <span className="font-bold text-emerald-400">{Math.round((completedCount / (totalItems || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(completedCount / (totalItems || 1)) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>In Progress ({inProgressCount})</span>
                    <span className="font-bold text-amber-400">{Math.round((inProgressCount / (totalItems || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(inProgressCount / (totalItems || 1)) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Planned ({plannedCount})</span>
                    <span className="font-bold text-sky-400">{Math.round((plannedCount / (totalItems || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: `${(plannedCount / (totalItems || 1)) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Pending / Delayed ({pendingCount})</span>
                    <span className="font-bold text-rose-400">{Math.round((pendingCount / (totalItems || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(pendingCount / (totalItems || 1)) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Revised / Rescheduled / Skipped ({revisedCount + rescheduledCount + skippedCount})</span>
                    <span className="font-bold text-purple-400">{Math.round(((revisedCount + rescheduledCount + skippedCount) / (totalItems || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${((revisedCount + rescheduledCount + skippedCount) / (totalItems || 1)) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Teaching Target & Time Summary */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-5 space-y-4 text-xs">
              <h4 className="text-sm font-semibold text-slate-200">Academic Time & Period Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Total Working Days Allocated:</span>
                  <span className="font-bold text-slate-100">{totalWorkingDays} Days</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Total Instructional Periods Planned:</span>
                  <span className="font-bold text-slate-100">{totalPeriodsPlanned} Periods</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Syllabus Completion Verification:</span>
                  <span className="font-bold text-emerald-400">Verified by Principal / VP</span>
                </div>
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300">
                  <p className="font-medium text-[11px] leading-relaxed">
                    ✓ All month-wise split-up entries align with KVS Regional Academic Guidelines and CBSE Class X/XI/XII Board Examination schedules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-base">
                  {editingItem ? 'Edit Syllabus Plan Item' : 'Add New Syllabus Plan Item'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSyllabus} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Class *</label>
                  <select
                    value={formData.className}
                    onChange={e => setFormData({ ...formData, className: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {uniqueClasses.map(c => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                  {formErrors.className && <span className="text-rose-400 text-[10px] mt-0.5">{formErrors.className}</span>}
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Section</label>
                  <select
                    value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="A">Sec A</option>
                    <option value="B">Sec B</option>
                    <option value="C">Sec C</option>
                    <option value="D">Sec D</option>
                    <option value="All">All Sections</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Subject *</label>
                  <select
                    value={formData.subjectName}
                    onChange={e => setFormData({ ...formData, subjectName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {uniqueSubjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {formErrors.subjectName && <span className="text-rose-400 text-[10px] mt-0.5">{formErrors.subjectName}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Month *</label>
                  <select
                    value={formData.month}
                    onChange={e => setFormData({ ...formData, month: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {MONTHS_LIST.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Unit Number</label>
                  <input
                    type="text"
                    value={formData.unitNo}
                    onChange={e => setFormData({ ...formData, unitNo: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Unit 1"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Unit Title</label>
                  <input
                    type="text"
                    value={formData.unitTitle}
                    onChange={e => setFormData({ ...formData, unitTitle: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Number Systems"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Chapter Number</label>
                  <input
                    type="text"
                    value={formData.chapterNo}
                    onChange={e => setFormData({ ...formData, chapterNo: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Chapter 1"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Chapter Title *</label>
                  <textarea
                    rows={2}
                    value={formData.chapterTitle}
                    onChange={e => setFormData({ ...formData, chapterTitle: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Real Numbers"
                  />
                  {formErrors.chapterTitle && <span className="text-rose-400 text-[10px] mt-0.5">{formErrors.chapterTitle}</span>}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Teaching Targets & Key Learning Competencies *</label>
                <textarea
                  rows={2}
                  value={formData.teachingTarget}
                  onChange={e => setFormData({ ...formData, teachingTarget: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Detail key learning outcomes, formulas, BPT proof, etc."
                />
                {formErrors.teachingTarget && <span className="text-rose-400 text-[10px] mt-0.5">{formErrors.teachingTarget}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Working Days Required</label>
                  <input
                    type="number"
                    value={formData.workingDaysRequired}
                    onChange={e => setFormData({ ...formData, workingDaysRequired: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Periods Required</label>
                  <input
                    type="number"
                    value={formData.periodsRequired}
                    onChange={e => setFormData({ ...formData, periodsRequired: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Completion Status</label>
                  <select
                    value={formData.completionStatus}
                    onChange={e => setFormData({ ...formData, completionStatus: e.target.value as SyllabusStatus })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Revised">Revised</option>
                    <option value="Skipped">Skipped</option>
                    <option value="Rescheduled">Rescheduled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={formData.targetCompletionDate}
                    onChange={e => setFormData({ ...formData, targetCompletionDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Actual Completion Date</label>
                  <input
                    type="date"
                    value={formData.actualCompletionDate}
                    onChange={e => setFormData({ ...formData, actualCompletionDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Revision Plan & Worksheets</label>
                  <input
                    type="text"
                    value={formData.revisionPlan}
                    onChange={e => setFormData({ ...formData, revisionPlan: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Worksheets, Question Bank solving, etc."
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Examination Alignment</label>
                  <input
                    type="text"
                    value={formData.examinationPlan}
                    onChange={e => setFormData({ ...formData, examinationPlan: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="PT-1, PT-2, Half Yearly, Pre-Board"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Project Work / MDP</label>
                  <input
                    type="text"
                    value={formData.projectWork}
                    onChange={e => setFormData({ ...formData, projectWork: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Art-integrated project topic"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Practical Work / Maths Lab</label>
                  <input
                    type="text"
                    value={formData.practicalWork}
                    onChange={e => setFormData({ ...formData, practicalWork: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Lab Activity title"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Remarks / Special Notes</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Extra periods allotted for slow learners"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  {editingItem ? 'Save Changes' : 'Create Syllabus Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* PDF / File Upload Modal */}
      {isUploadPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-slate-100 text-base">
                  Upload & Auto-Capture Split-Up Syllabus (PDF, CSV, JSON, Word, Excel)
                </h3>
              </div>
              <button
                onClick={() => setIsUploadPdfModalOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-300">
              <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2 font-bold text-purple-300 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Syllabus Document & File Parser</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Upload an official KVS / CBSE Split-Up Syllabus document or data file (PDF, CSV, JSON, Word, Excel). The system extracts and structures month-wise topics, NCERT competencies, working days, periods required, exam plans, and lab activities for your target subject across Classes I to XII.
                </p>
              </div>

              {/* Target Class & Subject Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">
                    Target Class
                  </label>
                  <select
                    value={targetClassUpload}
                    onChange={(e) => setTargetClassUpload(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                  >
                    <option value="I">Class I (Primary)</option>
                    <option value="II">Class II (Primary)</option>
                    <option value="III">Class III (Primary)</option>
                    <option value="IV">Class IV (Primary)</option>
                    <option value="V">Class V (Primary)</option>
                    <option value="VI">Class VI (Middle)</option>
                    <option value="VII">Class VII (Middle)</option>
                    <option value="VIII">Class VIII (Middle)</option>
                    <option value="IX">Class IX (Secondary)</option>
                    <option value="X">Class X (Secondary)</option>
                    <option value="XI">Class XI (Senior Secondary)</option>
                    <option value="XII">Class XII (Senior Secondary)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-200">
                      Target Subject
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomSubjectInput(!isCustomSubjectInput)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold underline"
                    >
                      {isCustomSubjectInput ? "Choose existing subject" : "＋ Enter custom subject"}
                    </button>
                  </div>

                  {isCustomSubjectInput ? (
                    <input
                      type="text"
                      value={targetSubjectUpload}
                      onChange={(e) => setTargetSubjectUpload(e.target.value)}
                      placeholder="e.g. Environmental Studies (EVS) or Mathematics (041)"
                      className="w-full bg-slate-900 border border-purple-500/50 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium text-xs"
                    />
                  ) : (
                    <select
                      value={targetSubjectUpload}
                      onChange={(e) => setTargetSubjectUpload(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                    >
                      {uniqueSubjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Import Mode Switcher */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('file');
                    setUploadErrorMessage(null);
                    setUploadSuccessMessage(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-xs transition-colors ${
                    uploadMode === 'file'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileUp className="w-4 h-4 text-amber-300" />
                  <span>Upload Document File (PDF, CSV, JSON, Word, Excel)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('paste');
                    setUploadErrorMessage(null);
                    setUploadSuccessMessage(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-xs transition-colors ${
                    uploadMode === 'paste'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Code className="w-4 h-4 text-amber-300" />
                  <span>Directly Paste JSON Text</span>
                </button>
              </div>

              {uploadMode === 'file' ? (
                <>
                  {/* File Upload Area */}
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-200">
                      Select Split-Up Syllabus File (PDF, CSV, JSON, Word, Excel)
                    </label>
                    <div className="border-2 border-dashed border-slate-700 hover:border-purple-500/50 bg-slate-950/50 rounded-xl p-6 text-center space-y-3 transition-all cursor-pointer relative">
                      <input
                        type="file"
                        accept=".pdf,.docx,.xlsx,.xls,.csv,.json,.txt"
                        onChange={handlePdfFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-8 h-8 text-purple-400 mx-auto" />
                      <div>
                        {selectedPdfFile ? (
                          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                            <FileCheck className="w-5 h-5" />
                            <span>{selectedPdfFile.name}</span>
                            <span className="text-xs text-slate-400">({Math.round(selectedPdfFile.size / 1024)} KB)</span>
                          </div>
                        ) : (
                          <>
                            <p className="font-semibold text-slate-200 text-sm">
                              Click to browse or drop Split-Up Syllabus file (PDF, CSV, JSON, Word, Excel)
                            </p>
                            <p className="text-slate-500 text-[11px] mt-1">
                              Supports KVS / CBSE Annual Split-Up Syllabus (Class I to XII) in PDF, CSV, JSON, Word & Excel
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Extract File Button */}
                  <button
                    type="button"
                    onClick={handleExtractSyllabusPdf}
                    disabled={isExtractingPdf || !selectedPdfFile}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                  >
                    {isExtractingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Analyzing File & Extracting Target Subject Syllabus...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Extract & Capture Target Subject Syllabus</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Direct Paste JSON Text Area */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-200">
                        Paste Split-Up Syllabus JSON Text
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePasteSampleJson}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 rounded text-[11px] font-semibold transition-colors"
                        >
                          <FileJson className="w-3.5 h-3.5" />
                          <span>Paste Sample JSON</span>
                        </button>
                        {pastedJsonText && (
                          <button
                            type="button"
                            onClick={() => {
                              setPastedJsonText('');
                              setUploadErrorMessage(null);
                              setUploadSuccessMessage(null);
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded text-[11px] font-medium transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        value={pastedJsonText}
                        onChange={(e) => setPastedJsonText(e.target.value)}
                        placeholder={`[\n  {\n    "month": "April",\n    "unit_chapter": "Unit 1: Food\\nChapter 1: Components of Food",\n    "teaching_target": "Sources of food, major nutrients, balanced diet",\n    "working_days": 18,\n    "periods_required": 12,\n    "revision_plan": "Weekly oral quiz and worksheets",\n    "examination_plan": "Periodic Test 1",\n    "project_work": "Collect plant food samples"\n  }\n]`}
                        rows={10}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-slate-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Accepts a JSON array of chapter objects or <code className="text-purple-300 font-mono">{"{ syllabus: [...] }"}</code>. Supported fields include: <span className="text-slate-300 font-medium">month</span>, <span className="text-slate-300 font-medium">unit_chapter</span> (or <span className="text-slate-300 font-medium">chapterTitle</span>), <span className="text-slate-300 font-medium">teaching_target</span>, <span className="text-slate-300 font-medium">working_days</span>, <span className="text-slate-300 font-medium">periods_required</span>, <span className="text-slate-300 font-medium">revision_plan</span>, <span className="text-slate-300 font-medium">examination_plan</span>, <span className="text-slate-300 font-medium">project_work</span>, and <span className="text-slate-300 font-medium">practical_work</span>.
                    </p>
                  </div>

                  {/* Parse Pasted JSON Button */}
                  <button
                    type="button"
                    onClick={handleParsePastedJson}
                    disabled={isExtractingPdf || !pastedJsonText.trim()}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                  >
                    {isExtractingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Parsing & Extracting Pasted JSON...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Parse & Import Pasted JSON Syllabus</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Error & Success Messages */}
              {uploadErrorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadErrorMessage}</span>
                </div>
              )}

              {uploadSuccessMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccessMessage}</span>
                </div>
              )}

              {/* Captured Items Preview Table */}
              {capturedItems.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200 text-sm flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      Captured Syllabus Preview ({capturedItems.length} Monthly Chapters)
                    </span>
                    <span className="text-[11px] text-purple-300">
                      Ready for Template Pg 18-22 Import
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-900 text-slate-300 sticky top-0 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Month</th>
                          <th className="p-2.5">Unit & Chapter Title</th>
                          <th className="p-2.5">Teaching Targets / NCERT Competencies</th>
                          <th className="p-2.5 text-center">Periods</th>
                          <th className="p-2.5">Projects / Practicals</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {capturedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            <td className="p-2.5 font-bold text-purple-300 whitespace-nowrap">{item.month}</td>
                            <td className="p-2.5 font-medium text-slate-100 max-w-sm">
                              {(item.unitNo || item.unitTitle) && item.unitTitle !== 'General Unit' && item.unitTitle !== item.chapterTitle && (
                                <div className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded mb-1 whitespace-pre-wrap break-words">
                                  {item.unitNo ? <span className="text-indigo-200 mr-1">{item.unitNo}{item.unitTitle ? ' — ' : ''}</span> : null}
                                  <span>{item.unitTitle}</span>
                                </div>
                              )}
                              <div className="whitespace-pre-wrap leading-relaxed">{item.chapterNo && !item.chapterTitle.toLowerCase().includes(item.chapterNo.toLowerCase()) ? `${item.chapterNo}: ` : ''}{item.chapterTitle}</div>
                            </td>
                            <td className="p-2.5 max-w-xs text-slate-300 line-clamp-2">{item.teachingTarget}</td>
                            <td className="p-2.5 text-center font-bold text-slate-200 whitespace-nowrap">{item.periodsRequired} P</td>
                            <td className="p-2.5 text-slate-400 max-w-xs line-clamp-1">{item.projectWork || item.practicalWork || 'Standard Work'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Import Strategy / Data Replacement Options */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <label className="block text-xs font-bold text-slate-200">
                      Import Replacement Strategy for Academic Session
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${importReplaceOption === 'replace_matching' ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60'}`}>
                        <input
                          type="radio"
                          name="importStrategy"
                          checked={importReplaceOption === 'replace_matching'}
                          onChange={() => setImportReplaceOption('replace_matching')}
                          className="mt-0.5 accent-indigo-500"
                        />
                        <div>
                          <span className="font-bold text-slate-100 block">Replace & Delete Previous Data (Default)</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Deletes and removes old syllabus records for the imported class & subject, replacing them with new data.</span>
                        </div>
                      </label>

                      <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${importReplaceOption === 'replace_all' ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200' : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60'}`}>
                        <input
                          type="radio"
                          name="importStrategy"
                          checked={importReplaceOption === 'replace_all'}
                          onChange={() => setImportReplaceOption('replace_all')}
                          className="mt-0.5 accent-indigo-500"
                        />
                        <div>
                          <span className="font-bold text-slate-100 block">Replace ALL Session Data</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Completely clears all previous syllabus records across all classes & subjects for this academic session.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleImportCapturedSyllabus}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Import & Replace ({capturedItems.length}) Captured Chapters to Teacher Diary</span>
                  </button>
                </div>
              )}

            </div>

            <div className="flex items-center justify-end p-4 border-t border-slate-800 bg-slate-950/60">
              <button
                type="button"
                onClick={() => setIsUploadPdfModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Width Edit Modal */}
      {isColumnResizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-base">
                  Edit & Resize Table Column Widths
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsColumnResizeModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-xs text-slate-300 leading-relaxed">
                Adjust column widths in pixels using the range sliders below, or click and drag any column boundary header directly in the table view.
              </p>

              {/* Layout Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-200">
                  Quick Layout Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetWidths('compact')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Columns className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Compact</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetWidths('balanced')}
                    className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MoveHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Balanced</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetWidths('wide')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Expanded</span>
                  </button>
                </div>
              </div>

              {/* Individual Column Sliders */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {Object.keys(COLUMN_LABELS).map((colKey) => {
                  const val = columnWidths[colKey] || DEFAULT_COLUMN_WIDTHS[colKey] || 120;
                  return (
                    <div key={colKey} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{COLUMN_LABELS[colKey]}</span>
                        <div className="flex items-center gap-1 font-mono text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          <span>{val}px</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={60}
                          max={500}
                          step={5}
                          value={val}
                          onChange={(e) => {
                            const newWidth = Number(e.target.value);
                            setColumnWidths(prev => {
                              const updated = { ...prev, [colKey]: newWidth };
                              try {
                                localStorage.setItem('syllabus_planner_col_widths', JSON.stringify(updated));
                              } catch {
                                // ignore
                              }
                              return updated;
                            });
                          }}
                          className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                        <input
                          type="number"
                          min={60}
                          max={500}
                          value={val}
                          onChange={(e) => {
                            const newWidth = Math.max(60, Math.min(500, Number(e.target.value) || 60));
                            setColumnWidths(prev => {
                              const updated = { ...prev, [colKey]: newWidth };
                              try {
                                localStorage.setItem('syllabus_planner_col_widths', JSON.stringify(updated));
                              } catch {
                                // ignore
                              }
                              return updated;
                            });
                          }}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/60">
              <button
                type="button"
                onClick={handleResetColumnWidths}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </button>
              <button
                type="button"
                onClick={() => setIsColumnResizeModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors text-xs"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation In-App Modal (Safe & reliable in iframe) */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-800 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-100">{deleteConfirmModal.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{deleteConfirmModal.message}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteConfirmModal.onConfirm()}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors text-xs shadow-lg shadow-rose-950/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteConfirmModal.confirmText || 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 border border-emerald-500/50 px-4 py-3 rounded-xl shadow-2xl text-xs text-emerald-300 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{successToast}</span>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
