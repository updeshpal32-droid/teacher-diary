import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  RemedialAssistanceRecord20a,
  RemedialAttachmentItem,
  StudentProfile,
  ScholasticScoreRecordVItoVIII,
  ScholasticScoreRecordIXtoX,
  ClassXMarksRecord17f,
  ClassXIAssessmentRecord17g,
  ClassXIIMarksRecord17h
} from '../types/academic';
import {
  db,
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
  BookOpen,
  X,
  Save,
  FileText,
  Image,
  Mic,
  Video,
  File,
  Paperclip,
  Eye,
  Download,
  Filter,
  Layers,
  ChevronRight,
  Zap,
  Target,
  Play,
  Volume2
} from 'lucide-react';

interface RemedialAssistancePlan20aProps {
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

const COMMON_WEAKNESS_PRESETS: { subject: string; topic: string; weakness: string; measures: string }[] = [
  {
    subject: 'Mathematics (041)',
    topic: 'Quadratic Equations & Roots',
    weakness: 'Formulation of quadratic equations from word problems, factorization of irrational roots, and discriminant formula application.',
    measures: '1. Step-by-step formula cue cards\n2. Graded 5-problem daily drill worksheet\n3. Zero-period peer buddy mentoring\n4. Bi-weekly re-testing on Saturday.'
  },
  {
    subject: 'Mathematics (041)',
    topic: 'Trigonometric Identities',
    weakness: 'Proof steps in trigonometric identities involving LHS/RHS transformations and reciprocal relations.',
    measures: '1. Identity tree diagram cheat sheet\n2. Group practice solving 3 standard Board template problems\n3. Individual whiteboard problem solving.'
  },
  {
    subject: 'Science (086)',
    topic: 'Chemical Equations & Reactions',
    weakness: 'Balancing multi-reactant chemical equations, assigning oxidation states and identifying redox species.',
    measures: '1. Tabular atom count method practice\n2. Interactive PhET simulation demonstration\n3. Simplified 10-equation remedial assignment.'
  },
  {
    subject: 'Science (086)',
    topic: 'Ray Optics & Lens Formula',
    weakness: 'Sign convention confusion in mirror/lens formulas (Cartesian sign convention) and ray diagram drawing.',
    measures: '1. Color-coded Cartesian coordinate rule sheet\n2. Hands-on optical bench demonstration\n3. Daily ray diagram sketching drills.'
  },
  {
    subject: 'English Core (301)',
    topic: 'Reading Comprehension & Formal Writing',
    weakness: 'Inferential reading comprehension vocabulary gaps and format errors in analytical paragraphs/formal letters.',
    measures: '1. High-frequency academic word glossaries\n2. Sentence frame templates for analytical paragraphs\n3. Timed paragraph writing practice with teacher feedback.'
  },
  {
    subject: 'Physics (042)',
    topic: 'Mechanics & Free Body Diagrams',
    weakness: 'Vector resolution on inclined planes, normal reaction forces, and static friction calculations.',
    measures: '1. Step-by-step orthogonal component breakdown sheets\n2. Wooden incline plane practical demo\n3. 1-on-1 doubt review during remedial slot.'
  }
];

export const RemedialAssistancePlan20a: React.FC<RemedialAssistancePlan20aProps> = ({ devMode }) => {
  const [records, setRecords] = useState<RemedialAssistanceRecord20a[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [selectedClass, setSelectedClass] = useState<string>('Class X-A');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics (041)');
  const [selectedPage, setSelectedPage] = useState<number>(1); // 1, 2, 3, 4 (4 Pages)
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importClassFilter, setImportClassFilter] = useState<string>('All');
  const [selectedStudentIdsForImport, setSelectedStudentIdsForImport] = useState<string[]>([]);
  const [importAreaOfWeakness, setImportAreaOfWeakness] = useState<string>('Foundational concept clarity & calculation errors in periodic assessment.');
  const [importMeasuresPlanned, setImportMeasuresPlanned] = useState<string>('Personalized worksheets, peer tutoring, and zero-period remedial practice.');
  const [editingRecord, setEditingRecord] = useState<RemedialAssistanceRecord20a | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Media Preview Viewer Modal
  const [previewAttachment, setPreviewAttachment] = useState<{
    item: RemedialAttachmentItem;
    contextTitle: string;
  } | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<RemedialAssistanceRecord20a>>({
    sNo: 1,
    studentId: '',
    studentName: '',
    rollNo: '',
    className: 'Class X-A',
    subjectName: 'Mathematics (041)',
    pageNumber: 1,
    areaOfWeakness: '',
    weaknessAttachments: [],
    measuresPlanned: '',
    measuresAttachments: [],
    diagnosticScore: 10,
    targetDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    status: 'In Remediation',
    remarks: ''
  });

  // File Upload Ref Inputs
  const weaknessFileInputRef = useRef<HTMLInputElement>(null);
  const measuresFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const saved = await db.get<RemedialAssistanceRecord20a[]>('setup:remedial_assistance_20a');
    if (saved && saved.length > 0) {
      setRecords(saved);
    } else {
      setRecords(DEFAULT_REMEDIAL_ASSISTANCE_20A);
      await db.set('setup:remedial_assistance_20a', DEFAULT_REMEDIAL_ASSISTANCE_20A);
    }

    const stdList = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    setStudents(stdList);
    setLoading(false);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Next S.No in current class, subject, page
  const getNextSNo = (cName: string, subName: string, pNum: number) => {
    const pageRecords = records.filter(r => r.className === cName && r.subjectName === subName && r.pageNumber === pNum);
    return pageRecords.length + 1;
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    const nextSNo = getNextSNo(selectedClass, selectedSubject, selectedPage);
    setFormState({
      sNo: nextSNo,
      studentId: '',
      studentName: '',
      rollNo: '',
      className: selectedClass,
      subjectName: selectedSubject,
      pageNumber: selectedPage,
      areaOfWeakness: '',
      weaknessAttachments: [],
      measuresPlanned: '',
      measuresAttachments: [],
      diagnosticScore: 10,
      targetDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'In Remediation',
      remarks: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: RemedialAssistanceRecord20a) => {
    setEditingRecord(rec);
    setFormState({
      ...rec,
      weaknessAttachments: rec.weaknessAttachments || [],
      measuresAttachments: rec.measuresAttachments || []
    });
    setIsModalOpen(true);
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this remedial assistance record?')) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      await db.set('setup:remedial_assistance_20a', updated);
      showNotification('Remedial record deleted.');
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (window.confirm('Reset 20(a). Remedial Assistance Register to official defaults?')) {
      setRecords(DEFAULT_REMEDIAL_ASSISTANCE_20A);
      await db.set('setup:remedial_assistance_20a', DEFAULT_REMEDIAL_ASSISTANCE_20A);
      showNotification('Remedial assistance register reset to defaults.');
    }
  };

  // Apply Weakness / Measures Preset
  const handleApplyPreset = (preset: typeof COMMON_WEAKNESS_PRESETS[0]) => {
    setFormState(prev => ({
      ...prev,
      areaOfWeakness: preset.weakness,
      measuresPlanned: preset.measures
    }));
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

    const newRecords: RemedialAssistanceRecord20a[] = studentsToImport.map((std, idx) => ({
      id: `rem20a-import-${Date.now()}-${idx}`,
      sNo: records.filter(r => r.pageNumber === targetPage).length + idx + 1,
      studentId: std.id,
      studentName: std.studentName,
      rollNo: std.rollNo,
      className: `Class ${std.className}-${std.section || 'A'}`,
      subjectName: selectedSubject !== 'All' ? selectedSubject : 'Mathematics (041)',
      pageNumber: targetPage,
      areaOfWeakness: importAreaOfWeakness,
      weaknessAttachments: [],
      measuresPlanned: importMeasuresPlanned,
      measuresAttachments: [],
      diagnosticScore: 10,
      targetDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'In Remediation',
      remarks: 'Imported from student roster for targeted remediation.',
      templatePageRef: 34
    }));

    const updated = [...records, ...newRecords];
    setRecords(updated);
    await db.set('setup:remedial_assistance_20a', updated);
    setIsImportModalOpen(false);
    setSelectedStudentIdsForImport([]);
    showNotification(`Successfully imported ${newRecords.length} students into 20(a) Remedial Assistance Plan.`);
  };

  // File Upload Handler (Weakness Evidence or Measures Evidence)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: 'weaknessAttachments' | 'measuresAttachments'
  ) => {
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
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type,
          title: file.name,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          uploadedAt: new Date().toISOString().slice(0, 10),
          dataUrl: result
        };

        setFormState(prev => ({
          ...prev,
          [targetField]: [...(prev[targetField] || []), newAttachment]
        }));
      };

      // Read as Data URL for inline storage / preview
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  // Remove Attachment
  const handleRemoveAttachment = (
    attachmentId: string,
    targetField: 'weaknessAttachments' | 'measuresAttachments'
  ) => {
    setFormState(prev => ({
      ...prev,
      [targetField]: (prev[targetField] || []).filter(a => a.id !== attachmentId)
    }));
  };

  // Save Record
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.studentName?.trim()) {
      alert('Please enter or select a Student Name.');
      return;
    }

    if (!formState.areaOfWeakness?.trim() || !formState.measuresPlanned?.trim()) {
      alert('Please enter both the Area of Weakness and Measures Planned.');
      return;
    }

    const sNoVal = Number(formState.sNo) || getNextSNo(formState.className || selectedClass, formState.subjectName || selectedSubject, formState.pageNumber || selectedPage);

    const recordToSave: RemedialAssistanceRecord20a = {
      id: editingRecord ? editingRecord.id : `rem-20a-${Date.now()}`,
      sNo: sNoVal,
      studentId: formState.studentId,
      studentName: formState.studentName.trim(),
      rollNo: formState.rollNo,
      className: formState.className || selectedClass,
      section: formState.section,
      subjectName: formState.subjectName || selectedSubject,
      pageNumber: formState.pageNumber || selectedPage,
      areaOfWeakness: formState.areaOfWeakness.trim(),
      weaknessAttachments: formState.weaknessAttachments || [],
      measuresPlanned: formState.measuresPlanned.trim(),
      measuresAttachments: formState.measuresAttachments || [],
      diagnosticScore: formState.diagnosticScore,
      targetDate: formState.targetDate,
      status: formState.status || 'In Remediation',
      remarks: formState.remarks,
      templatePageRef: 34
    };

    let updatedList: RemedialAssistanceRecord20a[] = [];
    if (editingRecord) {
      updatedList = records.map(r => r.id === editingRecord.id ? recordToSave : r);
    } else {
      updatedList = [...records, recordToSave];
    }

    setRecords(updatedList);
    await db.set('setup:remedial_assistance_20a', updatedList);
    setIsModalOpen(false);
    showNotification('Remedial assistance record and evidence saved successfully.');
  };

  // Auto-Scan Scholastic Scores to Detect Needing Remediation
  const handleAutoScanFromAssessments = async () => {
    let newCandidatesCount = 0;
    const existingStudentNames = new Set(records.map(r => r.studentName.toLowerCase()));

    // Check class X, XI, VI-VIII records
    const scoresVItoVIII = (await db.get<ScholasticScoreRecordVItoVIII[]>('setup:scholastic_scores_vi_viii')) || [];
    const scoresIXtoX = (await db.get<ScholasticScoreRecordIXtoX[]>('setup:scholastic_scores_ix_x')) || [];
    const scoresX = (await db.get<ClassXMarksRecord17f[]>('setup:scholastic_scores_x_17f')) || [];
    const scoresXI = (await db.get<ClassXIAssessmentRecord17g[]>('setup:scholastic_scores_xi_17g')) || [];

    const newEntries: RemedialAssistanceRecord20a[] = [];

    // Scan Class X
    scoresX.forEach(sc => {
      if (!existingStudentNames.has(sc.studentName.toLowerCase())) {
        const pt1 = sc.pt1 ?? 20;
        const hyVal = sc.hy ?? 80;
        if (pt1 < 7 || hyVal < 27) {
          newCandidatesCount++;
          newEntries.push({
            id: `rem-20a-auto-${Date.now()}-${newCandidatesCount}`,
            sNo: records.length + newCandidatesCount,
            studentId: sc.studentId,
            studentName: sc.studentName,
            rollNo: sc.rollNo,
            className: `Class ${sc.className || 'X'}-${sc.section || 'A'}`,
            subjectName: sc.subjectName || selectedSubject,
            pageNumber: selectedPage,
            areaOfWeakness: `Scored below benchmark in Periodic Assessment (${pt1 < 7 ? `PT-1: ${pt1}/20` : `Half Yearly: ${hyVal}/80`}). Diagnostic review required in core conceptual fundamentals.`,
            weaknessAttachments: [],
            measuresPlanned: '1. Diagnostic error worksheet review\n2. Daily zero-period peer tutoring assistance\n3. Remedial practice module assignment\n4. Re-evaluation test.',
            measuresAttachments: [],
            diagnosticScore: pt1 < 7 ? pt1 : Math.round(hyVal / 4),
            status: 'Identified',
            templatePageRef: 34
          });
        }
      }
    });

    if (newEntries.length > 0) {
      const combined = [...records, ...newEntries];
      setRecords(combined);
      await db.set('setup:remedial_assistance_20a', combined);
      showNotification(`Auto-identified and imported ${newEntries.length} students needing remediation from Assessment Ledgers.`);
    } else {
      showNotification('Assessment scan completed. All low-scoring students are already logged in the remedial register.');
    }
  };

  // Filtered Records for Active View
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
        rec.areaOfWeakness.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.measuresPlanned.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.remarks && rec.remarks.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchClass && matchSubject && matchPage && matchSearch;
    });
  }, [records, selectedClass, selectedSubject, selectedPage, searchTerm]);

  // Aggregate KPI stats
  const kpiStats = useMemo(() => {
    const totalCount = filteredRecords.length;
    const withEvidenceCount = filteredRecords.filter(
      r => (r.weaknessAttachments?.length || 0) > 0 || (r.measuresAttachments?.length || 0) > 0
    ).length;
    const inRemediationCount = filteredRecords.filter(r => r.status === 'In Remediation' || r.status === 'Identified').length;
    const remediatedCount = filteredRecords.filter(r => r.status === 'Remediated & Re-evaluated').length;

    return {
      totalCount,
      withEvidenceCount,
      inRemediationCount,
      remediatedCount
    };
  }, [filteredRecords]);

  // Render Attachment Badge in Table Row
  const renderAttachmentBadges = (
    attachments: RemedialAttachmentItem[] | undefined,
    contextTitle: string
  ) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5 mt-2 pt-1.5 border-t border-slate-800/80">
        {attachments.map(att => {
          let icon = <File className="w-3 h-3 text-slate-400" />;
          let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';

          if (att.type === 'photo') {
            icon = <Image className="w-3 h-3 text-emerald-400" />;
            badgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/80';
          } else if (att.type === 'audio') {
            icon = <Volume2 className="w-3 h-3 text-amber-400" />;
            badgeColor = 'bg-amber-950/80 text-amber-300 border-amber-800/50 hover:bg-amber-900/80';
          } else if (att.type === 'video') {
            icon = <Video className="w-3 h-3 text-rose-400" />;
            badgeColor = 'bg-rose-950/80 text-rose-300 border-rose-800/50 hover:bg-rose-900/80';
          } else if (att.type === 'pdf') {
            icon = <FileText className="w-3 h-3 text-indigo-400" />;
            badgeColor = 'bg-indigo-950/80 text-indigo-300 border-indigo-800/50 hover:bg-indigo-900/80';
          }

          return (
            <button
              key={att.id}
              type="button"
              onClick={() => setPreviewAttachment({ item: att, contextTitle })}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition cursor-pointer ${badgeColor}`}
              title={`Click to view/play ${att.title} (${att.fileSize || 'Attachment'})`}
            >
              {icon}
              <span className="truncate max-w-[130px]">{att.title}</span>
              <Eye className="w-2.5 h-2.5 opacity-60 ml-0.5" />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Dev Mode Traceability Badge */}
      {devMode && (
        <DevModeBadge
          pages={34}
          title="20(a) विशेष उपचारात्मक सहायता की आवश्यकता वाले विद्यार्थियों की सूची एवं सुधार हेतु आवश्यक योजना (Page 34, 4 Pages)"
        />
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1.5">
              <Target className="w-4 h-4" />
              <span>KVS Teacher Diary • Middle &amp; Secondary Portal (P-34)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              20(a) विशेष उपचारात्मक सहायता की आवश्यकता वाले विद्यार्थियों की सूची एवं सुधार हेतु आवश्यक योजना
            </h1>
            <h2 className="text-sm font-bold text-slate-300 tracking-wide mt-0.5 uppercase">
              List of Students Requiring Special Remedial Assistance and measures planned to improve their Performance
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Official 4-column diagnostic register documenting individual student learning gaps, remedial action plans, and multimedia evidence (photos, audio recordings, video clips, PDFs).
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
              onClick={handleAutoScanFromAssessments}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold rounded-xl border border-purple-500/40 shadow transition"
              title="Auto-detect students scoring < 33% from scholastic ledgers"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Auto-Detect from Marks</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shadow transition"
              title="Print official register"
            >
              <Printer className="w-4 h-4 text-purple-400" />
              <span>Print Page 34</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Remedial Record</span>
            </button>
          </div>
        </div>

        {/* Action & Metadata Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Paperclip className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Attach diagnostic test errors &amp; remedial practice sheets (Photo, Audio, Video, PDF) for verified progress audit.</span>
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

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Identified for Remediation</div>
          <div className="text-xl font-black text-white mt-1">{kpiStats.totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Students in Register</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">With Evidence Attached</div>
          <div className="text-xl font-black text-emerald-300 mt-1">{kpiStats.withEvidenceCount}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Photo / Audio / Video / PDF</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">In Remediation Phase</div>
          <div className="text-xl font-black text-purple-300 mt-1">{kpiStats.inRemediationCount}</div>
          <div className="text-[10px] text-purple-400/80 mt-0.5">Active Teaching &amp; Drills</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Remediated &amp; Re-tested</div>
          <div className="text-xl font-black text-amber-300 mt-1">{kpiStats.remediatedCount}</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Benchmark Achieved</div>
        </div>
      </div>

      {/* OFFICIAL CLASS & SUBJECT HEADER BAR (MATCHING REGISTER FORMAT) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        {/* Exact Official Top Row: Class .................... Subject .................... */}
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

          {/* 4 Pages Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2">Page:</span>
            {[1, 2, 3, 4].map(pageNum => (
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

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name, area of weakness, or measures planned..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* OFFICIAL 4-COLUMN REGISTER TABLE (MATCHING UPLOADED IMAGE) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Official Table Header */}
              <tr className="bg-slate-950 border-b-2 border-slate-800 text-slate-200 font-extrabold text-center">
                <th className="p-3 border-r border-slate-800 w-[60px]">
                  S.No
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[180px] text-left">
                  Name of Student
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[320px] text-left">
                  Area of weakness
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[320px] text-left">
                  Measures Planned
                </th>
                <th className="p-3 min-w-[80px] text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-400">
                        No remedial assistance records found for {selectedClass} • {selectedSubject} (Page {selectedPage === 0 ? 'All' : selectedPage}).
                      </span>
                      <button
                        onClick={handleOpenCreateModal}
                        className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-bold underline"
                      >
                        Add a remedial case to this page
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-800/50 transition">
                    {/* Column 1: S.No */}
                    <td className="p-3 border-r border-slate-800 text-center font-bold text-slate-400 align-top">
                      {row.sNo || idx + 1}
                    </td>

                    {/* Column 2: Name of Student */}
                    <td className="p-3 border-r border-slate-800 font-bold text-slate-100 align-top">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{row.studentName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5 flex items-center gap-2">
                        <span>{row.className}</span>
                        {row.rollNo && <span>• Roll #{row.rollNo}</span>}
                        {row.diagnosticScore !== undefined && (
                          <span className="text-rose-400 font-semibold">• Diag: {row.diagnosticScore}/40</span>
                        )}
                      </div>
                      {row.status && (
                        <div className="mt-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            row.status === 'Remediated & Re-evaluated'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                              : row.status === 'In Remediation'
                              ? 'bg-purple-950 text-purple-300 border-purple-800/60'
                              : 'bg-amber-950 text-amber-300 border-amber-800/60'
                          }`}>
                            {row.status}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Column 3: Area of weakness (with Multimedia Attachments) */}
                    <td className="p-3 border-r border-slate-800 text-slate-200 leading-relaxed align-top">
                      <p className="text-xs whitespace-pre-line">{row.areaOfWeakness}</p>
                      {/* Attached Evidence Badges */}
                      {renderAttachmentBadges(row.weaknessAttachments, `Diagnostic Evidence: ${row.studentName}`)}
                    </td>

                    {/* Column 4: Measures Planned (with Multimedia Attachments) */}
                    <td className="p-3 border-r border-slate-800 text-slate-300 leading-relaxed align-top bg-purple-950/5">
                      <p className="text-xs whitespace-pre-line">{row.measuresPlanned}</p>
                      {/* Attached Remedial Resource Badges */}
                      {renderAttachmentBadges(row.measuresAttachments, `Remedial Plan Resource: ${row.studentName}`)}
                    </td>

                    {/* Column 5: Actions */}
                    <td className="p-3 text-center align-top">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                          title="Edit remedial case"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete remedial case"
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

      {/* ADD / EDIT REMEDIAL RECORD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {editingRecord ? 'Edit Remedial Assistance Record (20a)' : 'Add Student Remedial Assistance Record (Page 34)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subject Preset Suggestion Chips */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Common Subject Weakness &amp; Remedial Action Presets (Click to fill):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_WEAKNESS_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-purple-950 hover:border-purple-600 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition"
                  >
                    {preset.topic}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">
              {/* Header Info: S.No, Student, Class, Subject, Page */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Select from Roster
                  </label>
                  <select
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">-- Choose student --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.studentName} ({s.className}-{s.section || 'A'})
                      </option>
                    ))}
                  </select>
                </div>

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
                    S.No &amp; Page
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="S.No"
                      value={formState.sNo || 1}
                      onChange={(e) => setFormState({ ...formState, sNo: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    />
                    <select
                      value={formState.pageNumber || 1}
                      onChange={(e) => setFormState({ ...formState, pageNumber: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    >
                      <option value={1}>Page 1</option>
                      <option value={2}>Page 2</option>
                      <option value={3}>Page 3</option>
                      <option value={4}>Page 4</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* 1. AREA OF WEAKNESS WITH MULTIMEDIA ATTACHMENTS */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                    <span>Area of weakness</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-normal">Attach Evidence:</span>
                    <input
                      type="file"
                      ref={weaknessFileInputRef}
                      onChange={(e) => handleFileUpload(e, 'weaknessAttachments')}
                      accept="image/*,audio/*,video/*,.pdf"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => weaknessFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                    >
                      <Paperclip className="w-3 h-3 text-purple-400" />
                      <span>Upload Photo / Audio / Video / PDF</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={3}
                  placeholder="Specific concept gap, diagnostic test error patterns, calculation hurdles, formulation mistakes..."
                  value={formState.areaOfWeakness}
                  onChange={(e) => setFormState({ ...formState, areaOfWeakness: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                  required
                />

                {/* Attached Weakness Files List */}
                {formState.weaknessAttachments && formState.weaknessAttachments.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attached Diagnostic Evidence:</div>
                    <div className="flex flex-wrap gap-2">
                      {formState.weaknessAttachments.map(att => (
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
                            onClick={() => handleRemoveAttachment(att.id, 'weaknessAttachments')}
                            className="text-slate-500 hover:text-rose-400 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. MEASURES PLANNED WITH MULTIMEDIA ATTACHMENTS */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>Measures Planned</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-normal">Attach Remedial Resource:</span>
                    <input
                      type="file"
                      ref={measuresFileInputRef}
                      onChange={(e) => handleFileUpload(e, 'measuresAttachments')}
                      accept="image/*,audio/*,video/*,.pdf"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => measuresFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                    >
                      <Paperclip className="w-3 h-3 text-emerald-400" />
                      <span>Upload Photo / Audio / Video / PDF</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={3}
                  placeholder="Intervention strategy, step-by-step cue cards, peer mentoring buddy, graded practice worksheets, re-test schedule..."
                  value={formState.measuresPlanned}
                  onChange={(e) => setFormState({ ...formState, measuresPlanned: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                  required
                />

                {/* Attached Measures Files List */}
                {formState.measuresAttachments && formState.measuresAttachments.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attached Remedial Materials:</div>
                    <div className="flex flex-wrap gap-2">
                      {formState.measuresAttachments.map(att => (
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
                            onClick={() => handleRemoveAttachment(att.id, 'measuresAttachments')}
                            className="text-slate-500 hover:text-rose-400 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Diagnostic Score (/40)
                  </label>
                  <input
                    type="number"
                    value={formState.diagnosticScore || 0}
                    onChange={(e) => setFormState({ ...formState, diagnosticScore: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={formState.targetDate}
                    onChange={(e) => setFormState({ ...formState, targetDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Remediation Status
                  </label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Identified">Identified (Needs Plan)</option>
                    <option value="In Remediation">In Remediation (Active)</option>
                    <option value="Remediated & Re-evaluated">Remediated &amp; Re-evaluated</option>
                    <option value="Ongoing Support">Ongoing Support Required</option>
                  </select>
                </div>
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
                  <span>Save Remedial Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEDIA PREVIEW / EVIDENCE VIEWER MODAL */}
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

            {/* Media Content Viewer */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col items-center justify-center min-h-[250px]">
              {previewAttachment.item.type === 'photo' && previewAttachment.item.dataUrl ? (
                <img
                  src={previewAttachment.item.dataUrl}
                  alt={previewAttachment.item.title}
                  className="max-h-[450px] w-auto rounded-lg object-contain border border-slate-800 shadow"
                />
              ) : previewAttachment.item.type === 'photo' ? (
                <div className="flex flex-col items-center gap-2 text-center p-8">
                  <Image className="w-16 h-16 text-emerald-400/60" />
                  <span className="text-sm font-bold text-slate-200">{previewAttachment.item.fileName}</span>
                  <span className="text-xs text-slate-400">Diagnostic error scan image attached ({previewAttachment.item.fileSize}).</span>
                </div>
              ) : previewAttachment.item.type === 'audio' && previewAttachment.item.dataUrl ? (
                <div className="w-full max-w-md space-y-4 p-4 text-center">
                  <div className="flex items-center justify-center">
                    <div className="p-4 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      <Volume2 className="w-10 h-10" />
                    </div>
                  </div>
                  <div className="text-sm font-bold text-white">{previewAttachment.item.title}</div>
                  <audio controls className="w-full mt-2" src={previewAttachment.item.dataUrl}>
                    Your browser does not support audio playback.
                  </audio>
                </div>
              ) : previewAttachment.item.type === 'audio' ? (
                <div className="flex flex-col items-center gap-2 text-center p-8">
                  <Mic className="w-16 h-16 text-amber-400/60" />
                  <span className="text-sm font-bold text-slate-200">{previewAttachment.item.fileName}</span>
                  <span className="text-xs text-slate-400">Audio diagnostic viva voice recording ({previewAttachment.item.fileSize}).</span>
                </div>
              ) : previewAttachment.item.type === 'video' && previewAttachment.item.dataUrl ? (
                <div className="w-full max-w-xl">
                  <video controls className="w-full rounded-xl border border-slate-800 shadow max-h-[400px]" src={previewAttachment.item.dataUrl}>
                    Your browser does not support video playback.
                  </video>
                </div>
              ) : previewAttachment.item.type === 'video' ? (
                <div className="flex flex-col items-center gap-2 text-center p-8">
                  <Video className="w-16 h-16 text-rose-400/60" />
                  <span className="text-sm font-bold text-slate-200">{previewAttachment.item.fileName}</span>
                  <span className="text-xs text-slate-400">Video remedial demonstration clip ({previewAttachment.item.fileSize}).</span>
                </div>
              ) : previewAttachment.item.type === 'pdf' && previewAttachment.item.dataUrl ? (
                <div className="w-full h-[450px]">
                  <iframe
                    src={previewAttachment.item.dataUrl}
                    title={previewAttachment.item.title}
                    className="w-full h-full rounded-xl border border-slate-800"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center p-8">
                  <FileText className="w-16 h-16 text-indigo-400/60" />
                  <span className="text-sm font-bold text-slate-200">{previewAttachment.item.fileName}</span>
                  <span className="text-xs text-slate-400">Remedial PDF practice module document ({previewAttachment.item.fileSize}).</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <div>
                Uploaded: {previewAttachment.item.uploadedAt || 'N/A'} • Size: {previewAttachment.item.fileSize || 'Standard'}
              </div>
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
                    Import Students from Roster into 20(a) Remedial Plan
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select students needing remedial assistance from your Vidyalaya roster to generate structured remediation records.
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
                  Page {selectedPage === 0 ? 1 : selectedPage} of Register 20(a)
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Default Area of Weakness</label>
                <input
                  type="text"
                  value={importAreaOfWeakness}
                  onChange={(e) => setImportAreaOfWeakness(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Default Measures Planned</label>
                <input
                  type="text"
                  value={importMeasuresPlanned}
                  onChange={(e) => setImportMeasuresPlanned(e.target.value)}
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

export default RemedialAssistancePlan20a;
