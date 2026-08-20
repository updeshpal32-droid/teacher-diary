import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  RemedialTeachingDetailsRecord20b,
  RemedialAssistanceRecord20a,
  RemedialAttachmentItem,
  StudentProfile
} from '../types/academic';
import {
  db,
  DEFAULT_REMEDIAL_TEACHING_DETAILS_20B,
  DEFAULT_REMEDIAL_ASSISTANCE_20A,
  DEFAULT_STUDENTS
} from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Printer,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  Sparkles,
  X,
  Save,
  FileText,
  Image,
  Mic,
  Video,
  File,
  Paperclip,
  Eye,
  Layers,
  Calendar,
  Zap,
  Volume2
} from 'lucide-react';

interface RemedialTeachingDetails20bProps {
  devMode?: boolean;
}

const CLASS_OPTIONS = [
  'Class VI-A',
  'Class VI-B',
  'Class VII-A',
  'Class VII-B',
  'Class VIII-A',
  'Class VIII-B',
  'Class IX-A',
  'Class IX-B',
  'Class X-A',
  'Class X-B',
  'Class XI-A',
  'Class XI-B',
  'Class XII-A',
  'Class XII-B'
];

const SUBJECT_OPTIONS = [
  'Mathematics (041)',
  'Science (086)',
  'Social Science (087)',
  'English Core (301)',
  'Hindi Course A (002)',
  'Physics (042)',
  'Chemistry (043)',
  'Biology (044)',
  'Computer Science (083)',
  'Accountancy (055)',
  'Economics (030)',
  'Business Studies (054)'
];

export const RemedialTeachingDetails20b: React.FC<RemedialTeachingDetails20bProps> = ({ devMode }) => {
  const [records, setRecords] = useState<RemedialTeachingDetailsRecord20b[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [selectedClass, setSelectedClass] = useState<string>('Class X-A');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics (041)');
  const [selectedPage, setSelectedPage] = useState<number>(1); // 1, 2 (2 Pages)
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importClassFilter, setImportClassFilter] = useState<string>('All');
  const [selectedStudentIdsForImport, setSelectedStudentIdsForImport] = useState<string[]>([]);
  const [importTopicConcept, setImportTopicConcept] = useState<string>('Quadratic Equations & Polynomial Factorisation');
  const [editingRecord, setEditingRecord] = useState<RemedialTeachingDetailsRecord20b | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Media Preview Viewer Modal
  const [previewAttachment, setPreviewAttachment] = useState<{
    item: RemedialAttachmentItem;
    contextTitle: string;
  } | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<RemedialTeachingDetailsRecord20b>>({
    slNo: 1,
    studentId: '',
    studentName: '',
    rollNo: '',
    className: 'Class X-A',
    subjectName: 'Mathematics (041)',
    topicConcept: '',
    pageNumber: 1,
    dates: Array(9).fill(''),
    sessionStatuses: Array(9).fill('P'),
    attachments: [],
    completionStatus: 'In Progress',
    remarks: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const saved = await db.get<RemedialTeachingDetailsRecord20b[]>('setup:remedial_teaching_20b');
    if (saved && saved.length > 0) {
      setRecords(saved);
    } else {
      setRecords(DEFAULT_REMEDIAL_TEACHING_DETAILS_20B);
      await db.set('setup:remedial_teaching_20b', DEFAULT_REMEDIAL_TEACHING_DETAILS_20B);
    }

    const stdList = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    setStudents(stdList);
    setLoading(false);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const getNextSlNo = (cName: string, subName: string, pNum: number) => {
    const pageRecords = records.filter(r => r.className === cName && r.subjectName === subName && r.pageNumber === pNum);
    return pageRecords.length + 1;
  };

  // Auto-fill Student from Roster
  const handleStudentSelect = (studentId: string) => {
    const selected = students.find(s => s.id === studentId);
    if (selected) {
      setFormState(prev => ({
        ...prev,
        studentId: selected.id,
        studentName: selected.studentName,
        rollNo: selected.rollNo,
        className: `Class ${selected.className}-${selected.section || 'A'}`
      }));
    }
  };

  // Bulk Import Students from Roster
  const handleBulkImportStudents = async () => {
    if (selectedStudentIdsForImport.length === 0) {
      alert('Please select at least one student from the roster to import.');
      return;
    }

    const studentsToImport = students.filter(s => selectedStudentIdsForImport.includes(s.id));
    const targetPage = selectedPage === 0 ? 1 : selectedPage;

    const newRecords: RemedialTeachingDetailsRecord20b[] = studentsToImport.map((std, idx) => ({
      id: `rem-20b-import-${Date.now()}-${idx}`,
      slNo: records.filter(r => r.pageNumber === targetPage).length + idx + 1,
      studentId: std.id,
      studentName: std.studentName,
      rollNo: std.rollNo,
      className: `Class ${std.className}-${std.section || 'A'}`,
      section: std.section || 'A',
      subjectName: selectedSubject !== 'All' ? selectedSubject : 'Mathematics (041)',
      topicConcept: importTopicConcept,
      pageNumber: targetPage,
      dates: Array(9).fill(''),
      sessionStatuses: Array(9).fill('P'),
      attachments: [],
      completionStatus: 'In Progress',
      remarks: 'Imported from student roster for remedial teaching details.',
      templatePageRef: 35
    }));

    const updated = [...records, ...newRecords];
    setRecords(updated);
    await db.set('setup:remedial_teaching_20b', updated);
    setIsImportModalOpen(false);
    setSelectedStudentIdsForImport([]);
    showNotification(`Successfully imported ${newRecords.length} students into 20(b) Remedial Teaching Details.`);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    const nextSlNo = getNextSlNo(selectedClass, selectedSubject, selectedPage);
    setFormState({
      slNo: nextSlNo,
      studentId: '',
      studentName: '',
      rollNo: '',
      className: selectedClass,
      subjectName: selectedSubject,
      topicConcept: '',
      pageNumber: selectedPage,
      dates: Array(9).fill(''),
      sessionStatuses: Array(9).fill('P'),
      attachments: [],
      completionStatus: 'In Progress',
      remarks: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: RemedialTeachingDetailsRecord20b) => {
    setEditingRecord(rec);
    const existingDates = [...(rec.dates || [])];
    while (existingDates.length < 9) existingDates.push('');
    const existingStatuses = [...(rec.sessionStatuses || [])];
    while (existingStatuses.length < 9) existingStatuses.push('P');

    setFormState({
      ...rec,
      dates: existingDates,
      sessionStatuses: existingStatuses,
      attachments: rec.attachments || []
    });
    setIsModalOpen(true);
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this remedial teaching record?')) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      await db.set('setup:remedial_teaching_20b', updated);
      showNotification('Record deleted.');
    }
  };

  // Reset Defaults
  const handleResetDefaults = async () => {
    if (window.confirm('Reset 20(b). Details of Remedial Teaching to official defaults?')) {
      setRecords(DEFAULT_REMEDIAL_TEACHING_DETAILS_20B);
      await db.set('setup:remedial_teaching_20b', DEFAULT_REMEDIAL_TEACHING_DETAILS_20B);
      showNotification('20(b) records reset to defaults.');
    }
  };

  // Sync from 20(a) Remedial Assistance Register
  const handleSyncFrom20a = async () => {
    const list20a = (await db.get<RemedialAssistanceRecord20a[]>('setup:remedial_assistance_20a')) || DEFAULT_REMEDIAL_ASSISTANCE_20A;
    const existingNames = new Set(records.map(r => r.studentName.toLowerCase()));

    const newEntries: RemedialTeachingDetailsRecord20b[] = [];
    list20a.forEach((item, idx) => {
      if (!existingNames.has(item.studentName.toLowerCase())) {
        const dArr = Array(9).fill('');
        dArr[0] = '04/08';
        dArr[1] = '08/08';
        dArr[2] = '12/08';

        newEntries.push({
          id: `rem-20b-sync-${Date.now()}-${idx}`,
          slNo: records.length + newEntries.length + 1,
          studentId: item.studentId,
          studentName: item.studentName,
          rollNo: item.rollNo,
          className: item.className || selectedClass,
          section: item.section,
          subjectName: item.subjectName || selectedSubject,
          topicConcept: item.areaOfWeakness ? item.areaOfWeakness.slice(0, 75) + '...' : 'Remedial Conceptual Training',
          pageNumber: 1,
          dates: dArr,
          sessionStatuses: ['P', 'P', 'P', '', '', '', '', '', ''],
          attachments: item.measuresAttachments || [],
          completionStatus: 'In Progress',
          remarks: 'Auto-synced from 20(a) Remedial Assistance List',
          templatePageRef: 35
        });
      }
    });

    if (newEntries.length > 0) {
      const combined = [...records, ...newEntries];
      setRecords(combined);
      await db.set('setup:remedial_teaching_20b', combined);
      showNotification(`Imported ${newEntries.length} student records from 20(a) register.`);
    } else {
      showNotification('All students from 20(a) are already synced in 20(b).');
    }
  };

  // Upload Evidence File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      let type: 'photo' | 'audio' | 'video' | 'pdf' | 'other' = 'other';
      if (file.type.startsWith('image/')) type = 'photo';
      else if (file.type.startsWith('audio/')) type = 'audio';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type === 'application/pdf') type = 'pdf';

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const newAttachment: RemedialAttachmentItem = {
          id: `att-20b-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type,
          title: file.name,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          uploadedAt: new Date().toISOString().slice(0, 10),
          dataUrl: result
        };

        setFormState(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Remove Attachment
  const handleRemoveAttachment = (attachmentId: string) => {
    setFormState(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== attachmentId)
    }));
  };

  // Save Record
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.studentName?.trim() || !formState.topicConcept?.trim()) {
      alert('Please provide both the Student Name and Topic/Concept.');
      return;
    }

    const slNoVal = Number(formState.slNo) || getNextSlNo(formState.className || selectedClass, formState.subjectName || selectedSubject, formState.pageNumber || selectedPage);

    const recordToSave: RemedialTeachingDetailsRecord20b = {
      id: editingRecord ? editingRecord.id : `rem-20b-${Date.now()}`,
      slNo: slNoVal,
      studentId: formState.studentId,
      studentName: formState.studentName.trim(),
      rollNo: formState.rollNo,
      className: formState.className || selectedClass,
      section: formState.section,
      subjectName: formState.subjectName || selectedSubject,
      topicConcept: formState.topicConcept.trim(),
      pageNumber: formState.pageNumber || selectedPage,
      dates: formState.dates || Array(9).fill(''),
      sessionStatuses: formState.sessionStatuses || Array(9).fill('P'),
      attachments: formState.attachments || [],
      completionStatus: formState.completionStatus || 'In Progress',
      remarks: formState.remarks,
      templatePageRef: 35
    };

    let updatedList: RemedialTeachingDetailsRecord20b[] = [];
    if (editingRecord) {
      updatedList = records.map(r => r.id === editingRecord.id ? recordToSave : r);
    } else {
      updatedList = [...records, recordToSave];
    }

    setRecords(updatedList);
    await db.set('setup:remedial_teaching_20b', updatedList);
    setIsModalOpen(false);
    showNotification('20(b) Remedial teaching record and session evidence saved.');
  };

  // Filtered list
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchClass = selectedClass === 'All' ||
        rec.className.toLowerCase().includes(selectedClass.toLowerCase()) ||
        selectedClass.toLowerCase().includes(rec.className.toLowerCase());

      const matchSubject = selectedSubject === 'All' ||
        rec.subjectName.toLowerCase().includes(selectedSubject.toLowerCase()) ||
        selectedSubject.toLowerCase().includes(rec.subjectName.toLowerCase());

      const matchPage = selectedPage === 0 || rec.pageNumber === selectedPage;

      const matchSearch = searchTerm === '' ||
        rec.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.topicConcept.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.remarks && rec.remarks.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchClass && matchSubject && matchPage && matchSearch;
    });
  }, [records, selectedClass, selectedSubject, selectedPage, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Dev Mode Traceability Badge */}
      {devMode && (
        <DevModeBadge
          pages={35}
          title="20(b) उपचारात्मक शिक्षण का ब्यौरा (DETAILS OF REMEDIAL TEACHING - Page 35, 2 Pages)"
        />
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1.5">
              <BookOpen className="w-4 h-4" />
              <span>KVS Teacher Diary • Middle &amp; Secondary Portal (P-35)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              20(b) उपचारात्मक शिक्षण का ब्यौरा
            </h1>
            <h2 className="text-sm font-bold text-slate-300 tracking-wide mt-0.5 uppercase">
              DETAILS OF REMEDIAL TEACHING
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Date-wise tracking matrix across 9 teaching sessions per topic/concept with multimedia teaching evidence (Photos, Audio viva, Video clips, PDFs).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedStudentIdsForImport([]);
                setIsImportModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-800/60 shadow transition"
              title="Import students directly from roster"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Import from Student Roster</span>
            </button>

            <button
              onClick={handleSyncFrom20a}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold rounded-xl border border-purple-500/40 shadow transition"
              title="Import student roster and learning gaps from 20(a)"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Sync from 20(a)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shadow transition"
              title="Print official register"
            >
              <Printer className="w-4 h-4 text-purple-400" />
              <span>Print Page 35</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Remedial Session</span>
            </button>
          </div>
        </div>

        {/* Action Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Record session dates (e.g. 04/08, 08/08) and student attendance across all 9 designated remedial periods.</span>
          </div>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1 text-slate-400 hover:text-slate-200 transition text-[11px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* CLASS & SUBJECT SELECTOR BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-300 whitespace-nowrap">Class :</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-900 border border-purple-500/40 rounded-lg px-3 py-1.5 text-xs font-bold text-purple-200 focus:outline-none focus:border-purple-400 min-w-[140px]"
              >
                <option value="All">All Classes (VI-XII)</option>
                {CLASS_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-300 whitespace-nowrap">Subject :</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-900 border border-indigo-500/40 rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-200 focus:outline-none focus:border-indigo-400 min-w-[180px]"
              >
                <option value="All">All Subjects</option>
                {SUBJECT_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2 Pages Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2">Page:</span>
            {[1, 2].map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setSelectedPage(pageNum)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedPage === pageNum
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Page {pageNum}
              </button>
            ))}
            <button
              onClick={() => setSelectedPage(0)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedPage === 0
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name, topic/concept, or remarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* OFFICIAL 12-COLUMN 20(b) REGISTER TABLE (MATCHING IMAGE 1) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Official Table Header */}
              <tr className="bg-slate-950 border-b-2 border-slate-800 text-slate-200 font-extrabold text-center">
                <th className="p-3 border-r border-slate-800 w-[55px]">
                  Sl No
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[160px] text-left">
                  Name of Student
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[240px] text-left">
                  Topic/concept
                </th>
                {/* 9 Date Columns */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <th key={num} className="p-2.5 border-r border-slate-800 w-[70px] text-center">
                    Date
                  </th>
                ))}
                <th className="p-3 min-w-[75px] text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-400">
                        No 20(b) remedial teaching records found for {selectedClass} • {selectedSubject}.
                      </span>
                      <button
                        onClick={handleOpenCreateModal}
                        className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-bold underline"
                      >
                        Add a remedial teaching record
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-800/50 transition">
                    {/* Column 1: Sl No */}
                    <td className="p-3 border-r border-slate-800 text-center font-bold text-slate-400 align-top">
                      {row.slNo || idx + 1}
                    </td>

                    {/* Column 2: Name of Student */}
                    <td className="p-3 border-r border-slate-800 font-bold text-slate-100 align-top">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{row.studentName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        {row.className} {row.rollNo ? `• Roll #${row.rollNo}` : ''}
                      </div>
                    </td>

                    {/* Column 3: Topic/concept + Evidence Badges */}
                    <td className="p-3 border-r border-slate-800 text-slate-200 leading-relaxed align-top">
                      <p className="text-xs font-medium">{row.topicConcept}</p>
                      {/* Attached Multimedia Evidence */}
                      {row.attachments && row.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-1.5 border-t border-slate-800/80">
                          {row.attachments.map(att => (
                            <button
                              key={att.id}
                              type="button"
                              onClick={() => setPreviewAttachment({ item: att, contextTitle: `Teaching Evidence: ${row.studentName}` })}
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition cursor-pointer bg-purple-950/80 text-purple-300 border-purple-800/50 hover:bg-purple-900/80"
                            >
                              {att.type === 'photo' && <Image className="w-3 h-3 text-emerald-400" />}
                              {att.type === 'audio' && <Volume2 className="w-3 h-3 text-amber-400" />}
                              {att.type === 'video' && <Video className="w-3 h-3 text-rose-400" />}
                              {att.type === 'pdf' && <FileText className="w-3 h-3 text-indigo-400" />}
                              <span className="truncate max-w-[110px]">{att.title}</span>
                              <Eye className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Columns 4 - 12: 9 Date Columns */}
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(dIdx => {
                      const dateVal = row.dates?.[dIdx] || '';
                      const statusVal = row.sessionStatuses?.[dIdx] || (dateVal ? 'P' : '');
                      return (
                        <td key={dIdx} className="p-2 border-r border-slate-800 text-center font-mono text-[11px] align-middle">
                          {dateVal ? (
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-purple-300 font-bold">{dateVal}</span>
                              {statusVal && (
                                <span className={`text-[9px] font-bold px-1 rounded mt-0.5 ${
                                  statusVal === '✓' || statusVal === 'Done'
                                    ? 'bg-emerald-950 text-emerald-400'
                                    : statusVal === 'A'
                                    ? 'bg-rose-950 text-rose-400'
                                    : 'text-slate-400'
                                }`}>
                                  {statusVal}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-700">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Column 13: Actions */}
                    <td className="p-3 text-center align-top">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                          title="Edit teaching record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL FOR 20(b) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {editingRecord ? 'Edit 20(b) Remedial Teaching Record' : 'Add 20(b) Remedial Teaching Record (Page 35)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Name of Student <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vikramaditya Roy"
                    value={formState.studentName}
                    onChange={(e) => setFormState({ ...formState, studentName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Class &amp; Section <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formState.className}
                    onChange={(e) => setFormState({ ...formState, className: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  >
                    {CLASS_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Subject Name <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formState.subjectName}
                    onChange={(e) => setFormState({ ...formState, subjectName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  >
                    {SUBJECT_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topic / Concept */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Topic / Concept Taught in Remedial Sessions <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Quadratic Equations: Factorisation, Quadratic Formula & Discriminant Analysis"
                  value={formState.topicConcept}
                  onChange={(e) => setFormState({ ...formState, topicConcept: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              {/* 9 Remedial Session Dates */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>9 Remedial Session Dates (DD/MM format):</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(dIdx => (
                    <div key={dIdx}>
                      <span className="text-[10px] text-slate-500 block mb-0.5 text-center">Date {dIdx + 1}</span>
                      <input
                        type="text"
                        placeholder={`D${dIdx + 1}`}
                        value={formState.dates?.[dIdx] || ''}
                        onChange={(e) => {
                          const updated = [...(formState.dates || Array(9).fill(''))];
                          updated[dIdx] = e.target.value;
                          setFormState({ ...formState, dates: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center text-xs text-purple-200 font-mono focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* MULTIMEDIA EVIDENCE UPLOAD */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attach Teaching &amp; Student Work Evidence (Photo, Audio, Video, PDF)</span>
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,audio/*,video/*,.pdf"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                  >
                    <Paperclip className="w-3 h-3 text-purple-400" />
                    <span>Upload Evidence</span>
                  </button>
                </div>

                {formState.attachments && formState.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formState.attachments.map(att => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-200"
                      >
                        {att.type === 'photo' && <Image className="w-3.5 h-3.5 text-emerald-400" />}
                        {att.type === 'audio' && <Mic className="w-3.5 h-3.5 text-amber-400" />}
                        {att.type === 'video' && <Video className="w-3.5 h-3.5 text-rose-400" />}
                        {att.type === 'pdf' && <FileText className="w-3.5 h-3.5 text-indigo-400" />}
                        <span className="truncate max-w-[140px] font-medium">{att.title}</span>
                        <span className="text-[9px] text-slate-500 font-mono">({att.fileSize})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-slate-500 hover:text-rose-400 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Teaching Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEDIA PREVIEW MODAL */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                  {previewAttachment.contextTitle}
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {previewAttachment.item.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col items-center justify-center min-h-[250px]">
              {previewAttachment.item.type === 'photo' && previewAttachment.item.dataUrl ? (
                <img
                  src={previewAttachment.item.dataUrl}
                  alt={previewAttachment.item.title}
                  className="max-h-[450px] w-auto rounded-lg object-contain border border-slate-800 shadow"
                />
              ) : previewAttachment.item.type === 'audio' && previewAttachment.item.dataUrl ? (
                <div className="w-full max-w-md space-y-4 p-4 text-center">
                  <div className="p-4 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 w-16 h-16 mx-auto flex items-center justify-center">
                    <Volume2 className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-bold text-white">{previewAttachment.item.title}</div>
                  <audio controls className="w-full mt-2" src={previewAttachment.item.dataUrl} />
                </div>
              ) : previewAttachment.item.type === 'video' && previewAttachment.item.dataUrl ? (
                <video controls className="w-full rounded-xl border border-slate-800 shadow max-h-[400px]" src={previewAttachment.item.dataUrl} />
              ) : previewAttachment.item.type === 'pdf' && previewAttachment.item.dataUrl ? (
                <iframe src={previewAttachment.item.dataUrl} title={previewAttachment.item.title} className="w-full h-[450px] rounded-xl border border-slate-800" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center p-8">
                  <FileText className="w-16 h-16 text-indigo-400/60" />
                  <span className="text-sm font-bold text-slate-200">{previewAttachment.item.fileName}</span>
                  <span className="text-xs text-slate-400">Attached remedial document ({previewAttachment.item.fileSize}).</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end text-xs pt-2 border-t border-slate-800">
              <button
                onClick={() => setPreviewAttachment(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT FROM STUDENT ROSTER MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Import Students from Roster into 20(b) Teaching Details
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select students from your Vidyalaya roster to populate the 9-session remedial teaching matrix.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Filter Roster Class</label>
                <select
                  value={importClassFilter}
                  onChange={(e) => setImportClassFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="All">All Classes</option>
                  {CLASS_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Target Page</label>
                <div className="text-xs text-purple-300 font-bold py-1.5 px-3 bg-purple-950/80 rounded-xl border border-purple-900/40">
                  Page {selectedPage === 0 ? 1 : selectedPage} of Register 20(b)
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Default Topic / Concept</label>
                <input
                  type="text"
                  value={importTopicConcept}
                  onChange={(e) => setImportTopicConcept(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Student Checkbox List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">
                  Select Students ({selectedStudentIdsForImport.length} Selected):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = students.filter(s => {
                        if (importClassFilter === 'All') return true;
                        const classMatch = `Class ${s.className}-${s.section || 'A'}`;
                        return classMatch === importClassFilter || s.className === importClassFilter;
                      });
                      setSelectedStudentIdsForImport(filtered.map(s => s.id));
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Select All Filtered
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIdsForImport([])}
                    className="text-xs text-slate-400 hover:text-slate-300"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/60 p-2">
                {students
                  .filter(s => {
                    if (importClassFilter === 'All') return true;
                    const classMatch = `Class ${s.className}-${s.section || 'A'}`;
                    return classMatch === importClassFilter || s.className === importClassFilter;
                  })
                  .map(std => {
                    const isChecked = selectedStudentIdsForImport.includes(std.id);
                    return (
                      <label
                        key={std.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                          isChecked ? 'bg-purple-950/40 text-white' : 'hover:bg-slate-900/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIdsForImport(prev => [...prev, std.id]);
                              } else {
                                setSelectedStudentIdsForImport(prev => prev.filter(id => id !== std.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                          />
                          <div>
                            <span className="font-bold text-slate-100">{std.studentName}</span>
                            {std.rollNo && (
                              <span className="text-[10px] text-slate-400 ml-2 font-mono">
                                (Roll #{std.rollNo})
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] text-purple-300 font-mono bg-purple-950/80 px-2 py-0.5 rounded border border-purple-900/40">
                          Class {std.className}-{std.section || 'A'}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImportStudents}
                disabled={selectedStudentIdsForImport.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 transition cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Import {selectedStudentIdsForImport.length} Students</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemedialTeachingDetails20b;
