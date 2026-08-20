import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ExemplaryChildRecord,
  RemedialAttachmentItem,
  StudentProfile,
  ClassXMarksRecord17f,
  ClassXIAssessmentRecord17g
} from '../types/academic';
import {
  db,
  DEFAULT_EXEMPLARY_CHILDREN,
  DEFAULT_STUDENTS
} from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  Award,
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
  Star,
  Zap,
  Volume2,
  Trophy,
  GraduationCap
} from 'lucide-react';

interface ExemplaryChildren21Props {
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

export const ExemplaryChildren21: React.FC<ExemplaryChildren21Props> = ({ devMode }) => {
  const [records, setRecords] = useState<ExemplaryChildRecord[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importClassFilter, setImportClassFilter] = useState<string>('All');
  const [selectedStudentIdsForImport, setSelectedStudentIdsForImport] = useState<string[]>([]);
  const [importStrengthsAndSteps, setImportStrengthsAndSteps] = useState<string>('High analytical ability, rapid problem solving, and aptitude for advanced competitive examinations. Mentored with advanced Olympiad problem sheets.');
  const [importImprovementShown, setImportImprovementShown] = useState<string>('Demonstrated exemplary accuracy in complex application problems and guided peers during group learning sessions.');
  const [editingRecord, setEditingRecord] = useState<ExemplaryChildRecord | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Media Preview Viewer Modal
  const [previewAttachment, setPreviewAttachment] = useState<{
    item: RemedialAttachmentItem;
    contextTitle: string;
  } | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<ExemplaryChildRecord>>({
    slNo: 1,
    studentId: '',
    studentName: '',
    rollNo: '',
    className: 'Class X-A',
    section: 'A',
    identifiedAreasOfStrengthAndStepsTaken: '',
    improvementShown: '',
    attachments: [],
    pageNumber: 1,
    specialAptitude: '',
    achievementsAndAwards: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const saved = await db.get<ExemplaryChildRecord[]>('setup:exemplary_children');
    if (saved && saved.length > 0) {
      setRecords(saved);
    } else {
      setRecords(DEFAULT_EXEMPLARY_CHILDREN);
      await db.set('setup:exemplary_children', DEFAULT_EXEMPLARY_CHILDREN);
    }

    const stdList = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    setStudents(stdList);
    setLoading(false);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const getNextSlNo = (cName: string, pNum: number) => {
    const pageRecords = records.filter(r => (cName === 'All' || r.className.includes(cName)) && r.pageNumber === pNum);
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
        section: selected.section || 'A'
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

    const newRecords: ExemplaryChildRecord[] = studentsToImport.map((std, idx) => ({
      id: `exm-import-${Date.now()}-${idx}`,
      slNo: records.filter(r => r.pageNumber === targetPage).length + idx + 1,
      studentId: std.id,
      studentName: std.studentName,
      rollNo: std.rollNo,
      className: `Class ${std.className}-${std.section || 'A'}`,
      section: std.section || 'A',
      identifiedAreasOfStrengthAndStepsTaken: importStrengthsAndSteps,
      improvementShown: importImprovementShown,
      specialAptitude: 'Academic Excellence & Advanced Conceptual Mastery',
      identifyingIndicators: 'Consistently demonstrates exceptional cognitive grasp and initiative in class.',
      enrichmentStepsTaken: importStrengthsAndSteps,
      achievementsAndAwards: 'Selected for Vidyalaya Talent & Olympiad Enrichment Program',
      attachments: [],
      pageNumber: targetPage,
      templatePageRef: 37
    }));

    const updated = [...records, ...newRecords];
    setRecords(updated);
    await db.set('setup:exemplary_children', updated);
    setIsImportModalOpen(false);
    setSelectedStudentIdsForImport([]);
    showNotification(`Successfully imported ${newRecords.length} students into 21. Exemplary Children register.`);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    const nextSlNo = getNextSlNo(selectedClass, selectedPage);
    setFormState({
      slNo: nextSlNo,
      studentId: '',
      studentName: '',
      rollNo: '',
      className: selectedClass === 'All' ? 'Class X-A' : selectedClass,
      section: 'A',
      identifiedAreasOfStrengthAndStepsTaken: '',
      improvementShown: '',
      attachments: [],
      pageNumber: selectedPage,
      specialAptitude: '',
      achievementsAndAwards: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: ExemplaryChildRecord) => {
    setEditingRecord(rec);
    setFormState({
      ...rec,
      attachments: rec.attachments || []
    });
    setIsModalOpen(true);
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this exemplary student record?')) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      await db.set('setup:exemplary_children', updated);
      showNotification('Exemplary child record deleted.');
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (window.confirm('Reset 21. Exemplary Children to official defaults?')) {
      setRecords(DEFAULT_EXEMPLARY_CHILDREN);
      await db.set('setup:exemplary_children', DEFAULT_EXEMPLARY_CHILDREN);
      showNotification('21. Exemplary children records reset to defaults.');
    }
  };

  // Auto-scan High Performers (>90% / Grade A1)
  const handleScanHighPerformers = async () => {
    const scoresX = (await db.get<ClassXMarksRecord17f[]>('setup:scholastic_scores_ix_x')) || [];
    const scoresXI = (await db.get<ClassXIAssessmentRecord17g[]>('setup:scholastic_scores_xi_17g')) || [];
    const existingNames = new Set(records.map(r => r.studentName.toLowerCase()));

    let count = 0;
    const newEntries: ExemplaryChildRecord[] = [];

    scoresX.forEach(sc => {
      if (!existingNames.has(sc.studentName.toLowerCase())) {
        const pt1 = sc.pt1 ?? 0;
        const pt2 = sc.pt2 ?? 0;
        const hy = sc.hy ?? 0;
        if (pt1 >= 38 || pt2 >= 38 || hy >= 72) {
          count++;
          newEntries.push({
            id: `exm-scan-${Date.now()}-${count}`,
            slNo: records.length + count,
            studentId: sc.studentId,
            studentName: sc.studentName,
            rollNo: sc.rollNo,
            className: `Class ${sc.className || 'X'}-${sc.section || 'A'}`,
            section: sc.section || 'A',
            identifiedAreasOfStrengthAndStepsTaken: `High academic excellence in Periodic & Term Assessments (${pt1 >= 38 ? `PT-1: ${pt1}/40` : `Half Yearly: ${hy}/80`}). Provided advanced Olympiad problem bank and peer mentoring responsibilities.`,
            improvementShown: 'Consistently maintains Grade A1; qualified for inter-school academic competitions.',
            attachments: [],
            pageNumber: selectedPage,
            templatePageRef: 37
          });
        }
      }
    });

    if (newEntries.length > 0) {
      const combined = [...records, ...newEntries];
      setRecords(combined);
      await db.set('setup:exemplary_children', combined);
      showNotification(`Identified and added ${newEntries.length} high-performing students.`);
    } else {
      showNotification('No new high performers (>90%) detected from recent marks ledger.');
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
          id: `att-exm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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

    if (!formState.studentName?.trim() || !formState.identifiedAreasOfStrengthAndStepsTaken?.trim()) {
      alert('Please provide both Student Name and Identified areas of strength & steps taken.');
      return;
    }

    const slNoVal = Number(formState.slNo) || getNextSlNo(formState.className || selectedClass, formState.pageNumber || selectedPage);

    const recordToSave: ExemplaryChildRecord = {
      id: editingRecord ? editingRecord.id : `exm-${Date.now()}`,
      slNo: slNoVal,
      studentId: formState.studentId || '',
      studentName: formState.studentName.trim(),
      rollNo: formState.rollNo,
      className: formState.className || (selectedClass === 'All' ? 'Class X-A' : selectedClass),
      section: formState.section || 'A',
      identifiedAreasOfStrengthAndStepsTaken: formState.identifiedAreasOfStrengthAndStepsTaken.trim(),
      improvementShown: formState.improvementShown?.trim() || 'Consistent superior performance.',
      specialAptitude: formState.specialAptitude || formState.identifiedAreasOfStrengthAndStepsTaken.slice(0, 50),
      achievementsAndAwards: formState.achievementsAndAwards || formState.improvementShown,
      attachments: formState.attachments || [],
      pageNumber: formState.pageNumber || selectedPage,
      templatePageRef: 37
    };

    let updatedList: ExemplaryChildRecord[] = [];
    if (editingRecord) {
      updatedList = records.map(r => r.id === editingRecord.id ? recordToSave : r);
    } else {
      updatedList = [...records, recordToSave];
    }

    setRecords(updatedList);
    await db.set('setup:exemplary_children', updatedList);
    setIsModalOpen(false);
    showNotification('21. Exemplary child record and evidence saved.');
  };

  // Filtered List
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchClass = selectedClass === 'All' ||
        rec.className.toLowerCase().includes(selectedClass.toLowerCase()) ||
        selectedClass.toLowerCase().includes(rec.className.toLowerCase());

      const matchPage = selectedPage === 0 || rec.pageNumber === selectedPage;

      const matchSearch = searchTerm === '' ||
        rec.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.identifiedAreasOfStrengthAndStepsTaken && rec.identifiedAreasOfStrengthAndStepsTaken.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.improvementShown && rec.improvementShown.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.specialAptitude && rec.specialAptitude.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchClass && matchPage && matchSearch;
    });
  }, [records, selectedClass, selectedPage, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Dev Mode Traceability Badge */}
      {devMode && (
        <DevModeBadge
          pages={37}
          title="21. अनुकरणीय छात्रों की सूची एवं उनके उत्तरोत्तर विकास हेतु उठाये गए कदम (LIST OF EXEMPLARY CHILDREN - Page 37, 2 Pages)"
        />
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1.5">
              <Trophy className="w-4 h-4" />
              <span>KVS Teacher Diary • Middle &amp; Secondary Portal (P-37)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              21. अनुकरणीय छात्रों की सूची एवं उनके उत्तरोत्तर विकास हेतु उठाये गए कदम
            </h1>
            <h2 className="text-sm font-bold text-slate-300 tracking-wide mt-0.5 uppercase">
              LIST OF EXEMPLARY CHILDREN AND STEPS TAKEN FOR FURTHER IMPROVEMENT
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Gifted &amp; high-potential student talent register, enrichment actions (Olympiad coaching, science exhibits, peer mentors), and verified award evidence (Certificates, project videos, research PDFs).
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
              onClick={handleScanHighPerformers}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 shadow transition"
              title="Auto-detect top performers scoring >90% or Grade A1"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Scan Top Performers</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shadow transition"
              title="Print official register"
            >
              <Printer className="w-4 h-4 text-purple-400" />
              <span>Print Page 37</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-900/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Exemplary Student</span>
            </button>
          </div>
        </div>

        {/* Action Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Star className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Document identified special aptitudes, accelerated learning challenges, and evidence of outstanding achievements.</span>
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

      {/* CLASS & PAGE SELECTOR BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-300 whitespace-nowrap">Filter Class:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-900 border border-purple-500/40 rounded-lg px-3 py-1.5 text-xs font-bold text-purple-200 focus:outline-none focus:border-purple-400 min-w-[150px]"
              >
                <option value="All">All Classes (VI-XII)</option>
                {CLASS_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
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
                    ? 'bg-amber-600 text-white shadow'
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
            placeholder="Search by student name, identified strength, enrichment steps, or achievement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* OFFICIAL 5-COLUMN REGISTER TABLE (MATCHING UPLOADED IMAGE) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Exact Headers from official register */}
              <tr className="bg-slate-950 border-b-2 border-slate-800 text-slate-200 font-extrabold text-center">
                <th className="p-3 border-r border-slate-800 w-[65px]">
                  Sl. No.
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[180px] text-left">
                  Name of Student
                </th>
                <th className="p-3 border-r border-slate-800 w-[120px] text-center">
                  Class &amp; Section
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[320px] text-left">
                  Identified areas of strength and Steps taken up for further improvement
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[240px] text-left">
                  Improvement shown
                </th>
                <th className="p-3 min-w-[75px] text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-400">
                        No exemplary student records found.
                      </span>
                      <button
                        onClick={handleOpenCreateModal}
                        className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-bold underline"
                      >
                        Add an exemplary student record
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-800/50 transition">
                    {/* Column 1: Sl. No. */}
                    <td className="p-3 border-r border-slate-800 text-center font-bold text-slate-400 align-top">
                      {row.slNo || idx + 1}
                    </td>

                    {/* Column 2: Name of Student */}
                    <td className="p-3 border-r border-slate-800 font-bold text-slate-100 align-top">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{row.studentName}</span>
                      </div>
                      {row.rollNo && (
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                          Roll #{row.rollNo}
                        </div>
                      )}
                    </td>

                    {/* Column 3: Class & Section */}
                    <td className="p-3 border-r border-slate-800 text-center font-bold text-purple-300 align-top">
                      <span className="px-2 py-0.5 bg-purple-950/80 border border-purple-800/60 rounded-md text-[11px]">
                        {row.className.replace('Class ', '')}
                      </span>
                    </td>

                    {/* Column 4: Identified areas of strength and Steps taken up for further improvement */}
                    <td className="p-3 border-r border-slate-800 text-slate-200 leading-relaxed align-top">
                      <p className="text-xs font-medium whitespace-pre-line">
                        {row.identifiedAreasOfStrengthAndStepsTaken || row.enrichmentStepsTaken || row.specialAptitude}
                      </p>

                      {/* Attached Evidence Badges */}
                      {row.attachments && row.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-1.5 border-t border-slate-800/80">
                          {row.attachments.map(att => (
                            <button
                              key={att.id}
                              type="button"
                              onClick={() => setPreviewAttachment({ item: att, contextTitle: `Exemplary Achievement: ${row.studentName}` })}
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition cursor-pointer bg-amber-950/80 text-amber-300 border-amber-800/50 hover:bg-amber-900/80"
                            >
                              {att.type === 'photo' && <Image className="w-3 h-3 text-emerald-400" />}
                              {att.type === 'audio' && <Volume2 className="w-3 h-3 text-amber-400" />}
                              {att.type === 'video' && <Video className="w-3 h-3 text-rose-400" />}
                              {att.type === 'pdf' && <FileText className="w-3 h-3 text-indigo-400" />}
                              <span className="truncate max-w-[120px]">{att.title}</span>
                              <Eye className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Column 5: Improvement shown */}
                    <td className="p-3 border-r border-slate-800 text-slate-300 leading-relaxed align-top">
                      <div className="flex items-start gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-xs font-medium whitespace-pre-line">
                          {row.improvementShown || row.achievementsAndAwards || 'Outstanding performance recorded.'}
                        </span>
                      </div>
                    </td>

                    {/* Column 6: Actions */}
                    <td className="p-3 text-center align-top">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition"
                          title="Edit exemplary record"
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

      {/* ADD / EDIT MODAL FOR 21 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {editingRecord ? 'Edit 21. Exemplary Child Record' : 'Add 21. Exemplary Child Record (Page 37)'}
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
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <label className="text-[11px] font-bold text-amber-300 block">
                  Select Existing Student from Roster (Optional Quick Fill):
                </label>
                <select
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose student from Roster --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.studentName} (Class {s.className}-{s.section || 'A'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Name of Student <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Riya Patnaik"
                    value={formState.studentName}
                    onChange={(e) => setFormState({ ...formState, studentName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                    required
                  >
                    {CLASS_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Roll No. (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 02"
                    value={formState.rollNo || ''}
                    onChange={(e) => setFormState({ ...formState, rollNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Column 4: Identified areas of strength & Steps taken */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Identified areas of strength and Steps taken up for further improvement <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe student's special aptitudes (Olympiad Math, Science Prototyping, Creative Writing) and enrichment steps (Advanced problem banks, Atal Tinkering Lab access, mentorship)..."
                  value={formState.identifiedAreasOfStrengthAndStepsTaken}
                  onChange={(e) => setFormState({ ...formState, identifiedAreasOfStrengthAndStepsTaken: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-amber-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* Column 5: Improvement shown */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Improvement shown (Achievements, Olympiad awards, competitions, leadership)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Secured Rank 1 in Regional Olympiad; Gold Medal at Cluster Science Exhibition; 100/100 in Board Mock Exams..."
                  value={formState.improvementShown}
                  onChange={(e) => setFormState({ ...formState, improvementShown: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-amber-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* MULTIMEDIA EVIDENCE UPLOAD */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attach Achievement Evidence (Certificates, Project Videos, Viva Audio, Portfolio PDFs)</span>
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
                    <Paperclip className="w-3 h-3 text-amber-400" />
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
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-900/40 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Exemplary Record</span>
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
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
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
                  <span className="text-xs text-slate-400">Attached achievement document ({previewAttachment.item.fileSize}).</span>
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
                    Import Students from Roster into 21. Exemplary Children
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select students from your Vidyalaya roster to generate talent acceleration &amp; enrichment records.
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="All">All Classes</option>
                  {CLASS_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Target Page</label>
                <div className="text-xs text-amber-300 font-bold py-1.5 px-3 bg-amber-950/80 rounded-xl border border-amber-900/40">
                  Page {selectedPage === 0 ? 1 : selectedPage} of Register 21
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Identified Areas of Strength &amp; Steps Taken
                </label>
                <textarea
                  rows={2}
                  value={importStrengthsAndSteps}
                  onChange={(e) => setImportStrengthsAndSteps(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Improvement Shown
                </label>
                <textarea
                  rows={2}
                  value={importImprovementShown}
                  onChange={(e) => setImportImprovementShown(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
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
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
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
                          isChecked ? 'bg-amber-950/40 text-white' : 'hover:bg-slate-900/60 text-slate-300'
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
                            className="w-4 h-4 rounded text-amber-600 bg-slate-900 border-slate-700"
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

                        <span className="text-[10px] text-amber-300 font-mono bg-amber-950/80 px-2 py-0.5 rounded border border-amber-900/40">
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

export default ExemplaryChildren21;
