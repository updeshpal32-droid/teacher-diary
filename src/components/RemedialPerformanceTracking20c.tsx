import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  RemedialPerformanceTrackingRecord20c,
  RemedialAssistanceRecord20a,
  RemedialAttachmentItem,
  StudentProfile
} from '../types/academic';
import {
  db,
  DEFAULT_REMEDIAL_PERFORMANCE_TRACKING_20C,
  DEFAULT_REMEDIAL_ASSISTANCE_20A,
  DEFAULT_STUDENTS
} from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  Printer,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
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
  Check,
  Zap,
  Volume2,
  ShieldCheck
} from 'lucide-react';

interface RemedialPerformanceTracking20cProps {
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

export const RemedialPerformanceTracking20c: React.FC<RemedialPerformanceTracking20cProps> = ({ devMode }) => {
  const [records, setRecords] = useState<RemedialPerformanceTrackingRecord20c[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('Class X-A');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics (041)');
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importClassFilter, setImportClassFilter] = useState<string>('All');
  const [selectedStudentIdsForImport, setSelectedStudentIdsForImport] = useState<string[]>([]);
  const [importNatureOfTest, setImportNatureOfTest] = useState<string>('PT-1 Diagnostic & Re-Test Series');
  const [editingRecord, setEditingRecord] = useState<RemedialPerformanceTrackingRecord20c | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Media Preview Viewer Modal
  const [previewAttachment, setPreviewAttachment] = useState<{
    item: RemedialAttachmentItem;
    contextTitle: string;
  } | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<RemedialPerformanceTrackingRecord20c>>({
    slNo: 1,
    studentId: '',
    studentName: '',
    rollNo: '',
    className: 'Class X-A',
    subjectName: 'Mathematics (041)',
    natureOfTest: 'PT-1 Diagnostic & Re-Test Series',
    maxMarks: 40,
    scores: Array(10).fill(null),
    testDates: Array(10).fill(''),
    parentSignature: 'Signed (Parent)',
    parentSignatureDate: new Date().toISOString().slice(0, 10),
    isParentAcknowledged: true,
    attachments: [],
    status: 'Target Met',
    pageNumber: 1,
    remarks: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const saved = await db.get<RemedialPerformanceTrackingRecord20c[]>('setup:remedial_performance_20c');
    if (saved && saved.length > 0) {
      setRecords(saved);
    } else {
      setRecords(DEFAULT_REMEDIAL_PERFORMANCE_TRACKING_20C);
      await db.set('setup:remedial_performance_20c', DEFAULT_REMEDIAL_PERFORMANCE_TRACKING_20C);
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
        className: `Class ${selected.className}-${selected.section || 'A'}`,
        parentSignature: `Signed (${selected.fatherName || selected.motherName || 'Parent'})`
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

    const newRecords: RemedialPerformanceTrackingRecord20c[] = studentsToImport.map((std, idx) => ({
      id: `rem-20c-import-${Date.now()}-${idx}`,
      slNo: records.filter(r => r.pageNumber === targetPage).length + idx + 1,
      studentId: std.id,
      studentName: std.studentName,
      rollNo: std.rollNo,
      className: `Class ${std.className}-${std.section || 'A'}`,
      section: std.section || 'A',
      subjectName: selectedSubject !== 'All' ? selectedSubject : 'Mathematics (041)',
      natureOfTest: importNatureOfTest,
      maxMarks: 40,
      scores: Array(10).fill(null),
      testDates: Array(10).fill(''),
      parentSignature: `Signed (${std.fatherName || std.motherName || 'Parent'})`,
      parentSignatureDate: new Date().toISOString().slice(0, 10),
      isParentAcknowledged: true,
      attachments: [],
      status: 'In Remediation',
      pageNumber: targetPage,
      remarks: 'Imported from student roster for performance tracking.',
      templatePageRef: 36
    }));

    const updated = [...records, ...newRecords];
    setRecords(updated);
    await db.set('setup:remedial_performance_20c', updated);
    setIsImportModalOpen(false);
    setSelectedStudentIdsForImport([]);
    showNotification(`Successfully imported ${newRecords.length} students into 20(c) Performance Tracking.`);
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
      natureOfTest: 'PT-1 Diagnostic & Re-Test Series',
      maxMarks: 40,
      scores: Array(10).fill(null),
      testDates: Array(10).fill(''),
      parentSignature: 'Signed (Parent)',
      parentSignatureDate: new Date().toISOString().slice(0, 10),
      isParentAcknowledged: true,
      attachments: [],
      status: 'In Remediation',
      pageNumber: selectedPage,
      remarks: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: RemedialPerformanceTrackingRecord20c) => {
    setEditingRecord(rec);
    const scoresArr = [...(rec.scores || [])];
    while (scoresArr.length < 10) scoresArr.push(null);
    const datesArr = [...(rec.testDates || [])];
    while (datesArr.length < 10) datesArr.push('');

    setFormState({
      ...rec,
      scores: scoresArr,
      testDates: datesArr,
      attachments: rec.attachments || []
    });
    setIsModalOpen(true);
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this performance tracking record?')) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      await db.set('setup:remedial_performance_20c', updated);
      showNotification('Record deleted.');
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (window.confirm('Reset 20(c). Performance Tracking Post-Remediation to defaults?')) {
      setRecords(DEFAULT_REMEDIAL_PERFORMANCE_TRACKING_20C);
      await db.set('setup:remedial_performance_20c', DEFAULT_REMEDIAL_PERFORMANCE_TRACKING_20C);
      showNotification('20(c) records reset to defaults.');
    }
  };

  // Sync from 20(a)
  const handleSyncFrom20a = async () => {
    const list20a = (await db.get<RemedialAssistanceRecord20a[]>('setup:remedial_assistance_20a')) || DEFAULT_REMEDIAL_ASSISTANCE_20A;
    const existingNames = new Set(records.map(r => r.studentName.toLowerCase()));

    const newEntries: RemedialPerformanceTrackingRecord20c[] = [];
    list20a.forEach((item, idx) => {
      if (!existingNames.has(item.studentName.toLowerCase())) {
        const sArr = Array(10).fill(null);
        sArr[0] = item.diagnosticScore || 10;
        sArr[1] = Math.min(40, (item.diagnosticScore || 10) + 6);
        sArr[2] = Math.min(40, (item.diagnosticScore || 10) + 12);

        newEntries.push({
          id: `rem-20c-sync-${Date.now()}-${idx}`,
          slNo: records.length + newEntries.length + 1,
          studentId: item.studentId,
          studentName: item.studentName,
          rollNo: item.rollNo,
          className: item.className || selectedClass,
          section: item.section,
          subjectName: item.subjectName || selectedSubject,
          natureOfTest: 'Diagnostic Assessment & Re-Test Series',
          maxMarks: 40,
          scores: sArr,
          testDates: ['04/08', '12/08', '20/08', '', '', '', '', '', '', ''],
          parentSignature: 'Signed (Parent)',
          parentSignatureDate: new Date().toISOString().slice(0, 10),
          isParentAcknowledged: true,
          attachments: item.weaknessAttachments || [],
          status: 'Target Met',
          pageNumber: 1,
          remarks: 'Auto-synced from 20(a) Remedial Register',
          templatePageRef: 36
        });
      }
    });

    if (newEntries.length > 0) {
      const combined = [...records, ...newEntries];
      setRecords(combined);
      await db.set('setup:remedial_performance_20c', combined);
      showNotification(`Imported ${newEntries.length} student records from 20(a) register.`);
    } else {
      showNotification('All students from 20(a) are already synced in 20(c).');
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
          id: `att-20c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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

    if (!formState.studentName?.trim() || !formState.natureOfTest?.trim()) {
      alert('Please provide both the Student Name and Nature of Test.');
      return;
    }

    const slNoVal = Number(formState.slNo) || getNextSlNo(formState.className || selectedClass, formState.subjectName || selectedSubject, formState.pageNumber || selectedPage);

    const recordToSave: RemedialPerformanceTrackingRecord20c = {
      id: editingRecord ? editingRecord.id : `rem-20c-${Date.now()}`,
      slNo: slNoVal,
      studentId: formState.studentId,
      studentName: formState.studentName.trim(),
      rollNo: formState.rollNo,
      className: formState.className || selectedClass,
      section: formState.section,
      subjectName: formState.subjectName || selectedSubject,
      natureOfTest: formState.natureOfTest.trim(),
      maxMarks: Number(formState.maxMarks) || 40,
      scores: formState.scores || Array(10).fill(null),
      testDates: formState.testDates || Array(10).fill(''),
      parentSignature: formState.parentSignature?.trim() || 'Signed (Parent)',
      parentSignatureDate: formState.parentSignatureDate,
      isParentAcknowledged: formState.isParentAcknowledged ?? true,
      attachments: formState.attachments || [],
      status: formState.status || 'Target Met',
      pageNumber: formState.pageNumber || selectedPage,
      remarks: formState.remarks,
      templatePageRef: 36
    };

    let updatedList: RemedialPerformanceTrackingRecord20c[] = [];
    if (editingRecord) {
      updatedList = records.map(r => r.id === editingRecord.id ? recordToSave : r);
    } else {
      updatedList = [...records, recordToSave];
    }

    setRecords(updatedList);
    await db.set('setup:remedial_performance_20c', updatedList);
    setIsModalOpen(false);
    showNotification('20(c) Performance tracking record and test evidence saved.');
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
        rec.natureOfTest.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.parentSignature.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.remarks && rec.remarks.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchClass && matchSubject && matchPage && matchSearch;
    });
  }, [records, selectedClass, selectedSubject, selectedPage, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Dev Mode Traceability Badge */}
      {devMode && (
        <DevModeBadge
          pages={36}
          title="20(c) उपचारात्मक सहायता की आवश्यकता वाले छात्रों की प्रगति का अभिलेख (TRACKING OF PERFORMANCE AFTER REMEDIATION - Page 36, 2 Pages)"
        />
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>KVS Teacher Diary • Middle &amp; Secondary Portal (P-36)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              20(c) उपचारात्मक सहायता की आवश्यकता वाले छात्रों की प्रगति का अभिलेख
            </h1>
            <h2 className="text-sm font-bold text-slate-300 tracking-wide mt-0.5 uppercase">
              TRACKING OF STUDENTS’ PERFORMANCE AFTER REMEDIATION
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Post-remediation test scores progression record, parent verification signatures, and diagnostic evidence (Answer sheet photos, audio viva notes, PDF reports).
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
              title="Import student roster and diagnostic tests from 20(a)"
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
              <span>Print Page 36</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Progress Record</span>
            </button>
          </div>
        </div>

        {/* Action Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Verify parent signature acknowledgement and upload re-test answer sheets as auditable proof of learning progression.</span>
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
            placeholder="Search by student name, test name, parent signature..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* OFFICIAL 20(c) REGISTER TABLE (MATCHING IMAGE 2) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Row 1 Header: Sl No, Name of Student, Nature of Test, Record of Progress (colSpan 10), Parent's Signature */}
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-200 font-extrabold text-center">
                <th rowSpan={2} className="p-3 border-r border-slate-800 w-[55px]">
                  Sl No
                </th>
                <th rowSpan={2} className="p-3 border-r border-slate-800 min-w-[160px] text-left">
                  Name of Student
                </th>
                <th rowSpan={2} className="p-3 border-r border-slate-800 min-w-[180px] text-left">
                  <div>Nature of Test</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">(PT/HY/ etc.)</div>
                </th>
                {/* Spanning Record of Progress Header with Max Marks */}
                <th colSpan={10} className="p-2 border-r border-slate-800 bg-purple-950/40 text-purple-200">
                  <div className="font-black text-[11px] tracking-wide">Record of Progress</div>
                  <div className="text-[10px] text-slate-400 font-normal">Max Marks: Specified in subheaders</div>
                </th>
                <th rowSpan={2} className="p-3 border-r border-slate-800 min-w-[160px] text-left">
                  Parent’s Signature
                </th>
                <th rowSpan={2} className="p-3 min-w-[75px] text-center">
                  Actions
                </th>
              </tr>
              {/* Row 2 Subheader: Test 1..10 Subcolumns */}
              <tr className="bg-slate-950 border-b-2 border-slate-800 text-slate-400 text-[10px] text-center font-bold">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tNum => (
                  <th key={tNum} className="p-1.5 border-r border-slate-800 w-[45px]">
                    T{tNum}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={15} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-400">
                        No 20(c) performance tracking records found for {selectedClass} • {selectedSubject}.
                      </span>
                      <button
                        onClick={handleOpenCreateModal}
                        className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-bold underline"
                      >
                        Add a performance tracking record
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => {
                  const maxMarks = row.maxMarks || 40;
                  return (
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

                      {/* Column 3: Nature of Test + Evidence Badges */}
                      <td className="p-3 border-r border-slate-800 text-slate-200 align-top">
                        <div className="font-semibold text-xs text-purple-200">{row.natureOfTest}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Max Marks: {maxMarks}</div>
                        {/* Attached Test Evidence */}
                        {row.attachments && row.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 pt-1.5 border-t border-slate-800/80">
                            {row.attachments.map(att => (
                              <button
                                key={att.id}
                                type="button"
                                onClick={() => setPreviewAttachment({ item: att, contextTitle: `Test Score Proof: ${row.studentName}` })}
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition cursor-pointer bg-emerald-950/80 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/80"
                              >
                                {att.type === 'photo' && <Image className="w-3 h-3 text-emerald-400" />}
                                {att.type === 'audio' && <Volume2 className="w-3 h-3 text-amber-400" />}
                                {att.type === 'video' && <Video className="w-3 h-3 text-rose-400" />}
                                {att.type === 'pdf' && <FileText className="w-3 h-3 text-indigo-400" />}
                                <span className="truncate max-w-[100px]">{att.title}</span>
                                <Eye className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                              </button>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Columns 4 - 13: 10 Test Scores */}
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(sIdx => {
                        const scoreVal = row.scores?.[sIdx];
                        const hasScore = scoreVal !== null && scoreVal !== undefined;
                        const scorePct = hasScore ? (scoreVal / maxMarks) * 100 : 0;

                        return (
                          <td key={sIdx} className="p-2 border-r border-slate-800 text-center font-mono text-xs align-middle">
                            {hasScore ? (
                              <div className="flex flex-col items-center">
                                <span className={`font-bold ${
                                  scorePct >= 75
                                    ? 'text-emerald-400'
                                    : scorePct >= 50
                                    ? 'text-purple-300'
                                    : scorePct >= 33
                                    ? 'text-amber-300'
                                    : 'text-rose-400'
                                }`}>
                                  {scoreVal}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-700">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Column 14: Parent's Signature */}
                      <td className="p-3 border-r border-slate-800 text-slate-300 align-top">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{row.parentSignature || 'Signed'}</span>
                        </div>
                        {row.parentSignatureDate && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Date: {row.parentSignatureDate}
                          </div>
                        )}
                      </td>

                      {/* Column 15: Actions */}
                      <td className="p-3 text-center align-top">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(row)}
                            className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                            title="Edit tracking record"
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL FOR 20(c) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {editingRecord ? 'Edit 20(c) Performance Tracking Record' : 'Add 20(c) Performance Tracking Record (Page 36)'}
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

              {/* Nature of Test & Max Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Nature of Test (PT/HY/ etc.) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Periodic Test 1 Re-Test & Chapter Quizzes"
                    value={formState.natureOfTest}
                    onChange={(e) => setFormState({ ...formState, natureOfTest: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Max Marks for Tests <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 40, 25, 50, 80"
                    value={formState.maxMarks || 40}
                    onChange={(e) => setFormState({ ...formState, maxMarks: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* 10 Test Progression Scores */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  <span>Record of Progress (Scores out of {formState.maxMarks || 40}):</span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(sIdx => (
                    <div key={sIdx}>
                      <span className="text-[10px] text-slate-500 block mb-0.5 text-center">Test {sIdx + 1}</span>
                      <input
                        type="number"
                        placeholder="-"
                        value={formState.scores?.[sIdx] !== null && formState.scores?.[sIdx] !== undefined ? formState.scores[sIdx] : ''}
                        onChange={(e) => {
                          const updated = [...(formState.scores || Array(10).fill(null))];
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          updated[sIdx] = val;
                          setFormState({ ...formState, scores: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-center text-xs text-purple-200 font-mono font-bold focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Parent Signature & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Parent’s Signature &amp; Acknowledgement
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Signed (S. N. Roy - Father)"
                    value={formState.parentSignature}
                    onChange={(e) => setFormState({ ...formState, parentSignature: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Signature Date
                  </label>
                  <input
                    type="date"
                    value={formState.parentSignatureDate}
                    onChange={(e) => setFormState({ ...formState, parentSignatureDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* MULTIMEDIA EVIDENCE UPLOAD */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attach Test Scores Evidence &amp; Answer Sheets (Photo, Audio, Video, PDF)</span>
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
                    <span>Upload Test Evidence</span>
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
                  <span>Save Progress Record</span>
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
                  <span className="text-xs text-slate-400">Attached re-test score document ({previewAttachment.item.fileSize}).</span>
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
                    Import Students from Roster into 20(c) Performance Tracking
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select students from your Vidyalaya roster to generate post-remediation progress tracking records with parent details.
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
                  Page {selectedPage === 0 ? 1 : selectedPage} of Register 20(c)
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Default Nature of Test</label>
                <input
                  type="text"
                  value={importNatureOfTest}
                  onChange={(e) => setImportNatureOfTest(e.target.value)}
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
                            {std.fatherName && (
                              <span className="text-[10px] text-slate-500 ml-2">
                                • Parent: {std.fatherName}
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

export default RemedialPerformanceTracking20c;
