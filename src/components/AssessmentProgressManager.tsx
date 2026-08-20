import React, { useState, useEffect } from 'react';
import {
  AssessmentProgressRecord,
  AssessmentCategory,
  ClassSection,
  SubjectItem,
  DailyLessonPlan,
  ScholasticScoreRecordVItoVIII,
  ScholasticScoreRecordIXtoX,
  StudentProfile,
  MdpAipProjectRecord,
  SecondaryRemedialRecord,
  ExemplaryChildRecord,
  SeaPlanItem,
  PracticalAttendanceRecord,
  PracticalAttendanceRecord17i,
  ClassXMarksRecord17f,
  ClassXIAssessmentRecord17g,
  ClassXIIMarksRecord17h,
  NotebookSubmissionRecord17j,
  StaffDetailRecord
} from '../types/academic';
import {
  db,
  DEFAULT_ASSESSMENT_RECORDS,
  DEFAULT_CLASSES,
  DEFAULT_SUBJECTS,
  DEFAULT_LESSON_PLANS,
  DEFAULT_STUDENTS,
  DEFAULT_SCHOLASTIC_SCORES_VI_VIII,
  DEFAULT_SCHOLASTIC_SCORES_IX_X,
  DEFAULT_MDP_AIP_PROJECTS,
  DEFAULT_SECONDARY_REMEDIAL,
  DEFAULT_EXEMPLARY_CHILDREN,
  DEFAULT_SECONDARY_SEA_PLANS,
  DEFAULT_PRACTICAL_ATTENDANCE,
  DEFAULT_CLASS_X_MARKS_17F,
  DEFAULT_CLASS_XI_ASSESSMENT_17G,
  DEFAULT_CLASS_XII_MARKS_17H,
  DEFAULT_NOTEBOOK_SUBMISSION_17J,
  DEFAULT_NOTEBOOK_DATES_17J,
  DEFAULT_PRACTICAL_DATES_17I,
  DEFAULT_PRACTICAL_TITLES_17I,
  DEFAULT_PRACTICAL_ATTENDANCE_17I
} from '../lib/storage';
import { computeCBSEGrade } from '../lib/studentDefaults';
import { DevModeBadge } from './DevModeBadge';
import ResultAnalysisVItoX from './ResultAnalysisVItoX';
import ResultAnalysisXItoXII from './ResultAnalysisXItoXII';
import StudentBehaviourObservationManager from './StudentBehaviourObservationManager';
import RemedialAssistancePlan20a from './RemedialAssistancePlan20a';
import RemedialTeachingDetails20b from './RemedialTeachingDetails20b';
import RemedialPerformanceTracking20c from './RemedialPerformanceTracking20c';
import ExemplaryChildren21 from './ExemplaryChildren21';
import RemedialTeachingManager20 from './RemedialTeachingManager20';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Edit2,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Palette,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
  X,
  Zap,
  Check,
  AlertCircle,
  Eye
} from 'lucide-react';

interface AssessmentProgressManagerProps {
  devMode?: boolean;
  onSaved?: () => void;
}

type AssessmentSubTab =
  | 'scholastic_marks'
  | 'result_analysis_18a'
  | 'result_analysis_18b'
  | 'student_observations'
  | 'remedial_20a'
  | 'remedial_20b'
  | 'remedial_20c'
  | 'formative_log'
  | 'mdp_aip'
  | 'sea_activities'
  | 'practical_attendance'
  | 'notebook_submission'
  | 'remedial_teaching'
  | 'exemplary_children';

const ASSESSMENT_TYPES: { type: AssessmentCategory; label: string; badgeColor: string }[] = [
  { type: 'Class Test', label: 'Class Test (Formative M1-M5)', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  { type: 'Oral Questions', label: 'Oral Questions / Viva', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { type: 'Worksheet', label: 'Worksheet / Problem Sheet', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { type: 'Homework', label: 'Homework / Daily Reflection', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { type: 'Assignment', label: 'Unit Assignment / Home Task', badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  { type: 'Project Work', label: 'Project Work / Art Integrated', badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40' },
  { type: 'Quiz', label: 'Class Quiz / Rapid Fire', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { type: 'Slow Learner Remedial', label: 'Slow Learner Remedial Measure', badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  { type: 'Advanced Learner Enrichment', label: 'Advanced Learner Enrichment', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { type: 'Follow-up Action', label: 'Follow-up Action / Re-test', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' }
];

const MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March'
];

function getGradeBadgeColor(grade: string): string {
  switch (grade) {
    case 'A1': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'A2': return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
    case 'B1': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    case 'B2': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    case 'C1': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'C2': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    case 'D': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    case 'E': return 'bg-red-500/20 text-red-300 border-red-500/40';
    default: return 'bg-slate-700 text-slate-300 border-slate-600';
  }
}

export const AssessmentProgressManager: React.FC<AssessmentProgressManagerProps> = ({
  devMode = false,
  onSaved
}) => {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<AssessmentSubTab>('scholastic_marks');
  const [scholasticStage, setScholasticStage] = useState<'vi_viii' | 'ix_x' | 'class_x_17f' | 'class_xi_17g' | 'class_xii_17h'>('vi_viii');
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [printSheetType, setPrintSheetType] = useState<
    'all' | 'scholastic' | 'mdp_aip' | 'sea' | 'class_x_17f' | 'class_xi_17g' | 'class_xii_17h' | 'practical_17i' | 'notebook_17j' | 'practical' | 'remedial' | 'exemplary'
  >('mdp_aip');
  const [notification, setNotification] = useState<string | null>(null);

  // Common Master State
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [lessonPlans, setLessonPlans] = useState<DailyLessonPlan[]>([]);

  // Sub-module Data
  const [scoresVI_VIII, setScoresVI_VIII] = useState<ScholasticScoreRecordVItoVIII[]>([]);
  const [scoresIX_X, setScoresIX_X] = useState<ScholasticScoreRecordIXtoX[]>([]);
  const [scoresClassX_17F, setScoresClassX_17F] = useState<ClassXMarksRecord17f[]>([]);
  const [scoresClassXI_17G, setScoresClassXI_17G] = useState<ClassXIAssessmentRecord17g[]>([]);
  const [scoresClassXII_17H, setScoresClassXII_17H] = useState<ClassXIIMarksRecord17h[]>([]);
  const [notebookRecords, setNotebookRecords] = useState<NotebookSubmissionRecord17j[]>([]);
  const [notebookDates, setNotebookDates] = useState<string[]>(DEFAULT_NOTEBOOK_DATES_17J);
  const [isEditingDatesModal, setIsEditingDatesModal] = useState<boolean>(false);
  const [practical17iRecords, setPractical17iRecords] = useState<PracticalAttendanceRecord17i[]>([]);
  const [practicalDates17i, setPracticalDates17i] = useState<string[]>(DEFAULT_PRACTICAL_DATES_17I);
  const [practicalTitles17i, setPracticalTitles17i] = useState<string[]>(DEFAULT_PRACTICAL_TITLES_17I);
  const [isEditingPracticalModal, setIsEditingPracticalModal] = useState<boolean>(false);
  const [formativeRecords, setFormativeRecords] = useState<AssessmentProgressRecord[]>([]);
  const [mdpAipProjects, setMdpAipProjects] = useState<MdpAipProjectRecord[]>([]);
  const [seaPlans, setSeaPlans] = useState<SeaPlanItem[]>([]);
  const [practicalAttendance, setPracticalAttendance] = useState<PracticalAttendanceRecord[]>([]);
  const [remedialRecords, setRemedialRecords] = useState<SecondaryRemedialRecord[]>([]);
  const [exemplaryChildren, setExemplaryChildren] = useState<ExemplaryChildRecord[]>([]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('All');
  const [sectionFilter, setSectionFilter] = useState<string>('All');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');

  // Modals state
  const [isFormativeModalOpen, setIsFormativeModalOpen] = useState<boolean>(false);
  const [formativeForm, setFormativeForm] = useState<AssessmentProgressRecord>({
    id: '',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    topic: '',
    month: 'July',
    date: new Date().toISOString().split('T')[0],
    assessmentType: 'Class Test',
    title: '',
    description: '',
    maxMarks: 10,
    averageScore: 8,
    performanceRemarks: '',
    slowLearnerSupport: '',
    advancedLearnerActivity: '',
    remedialTeaching: '',
    enrichmentWork: '',
    followUpAction: '',
    templatePageRef: 22
  });

  const [isMdpModalOpen, setIsMdpModalOpen] = useState<boolean>(false);
  const [mdpForm, setMdpForm] = useState<MdpAipProjectRecord>({
    id: '',
    projectType: 'MDP',
    title: '',
    theme: '',
    topic: '',
    mdpAssigned: '',
    aipAssigned: '',
    evaluationCriteria: '1. Content & Concept (5M), 2. Interdisciplinary/Art Integration (5M), 3. Research & Originality (5M), 4. Presentation & Viva (5M)',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    pairedSubjects: 'Mathematics + Fine Arts + Social Science',
    targetGroup: 'Class X-A (All Students)',
    assignedDate: new Date().toISOString().split('T')[0],
    submissionDate: new Date().toISOString().split('T')[0],
    r1Content: 5,
    r2ArtIntegration: 5,
    r3ResearchCreativity: 5,
    r4Presentation: 5,
    totalMarks: 20,
    status: 'In Progress',
    remarks: '',
    templatePageRef: 23
  });

  const [isRemedialModalOpen, setIsRemedialModalOpen] = useState<boolean>(false);
  const [remedialForm, setRemedialForm] = useState<SecondaryRemedialRecord>({
    id: '',
    studentId: '',
    studentName: '',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    diagnosticWeakness: '',
    identifiedMonth: 'July',
    remedialStrategy: '',
    remedialDates: '',
    initialMarks: 10,
    reTestMarks: 30,
    progressStatus: 'Developing',
    parentSignatureAcknowledged: false,
    remarks: '',
    templatePageRef: 34
  });

  const [isExemplaryModalOpen, setIsExemplaryModalOpen] = useState<boolean>(false);
  const [exemplaryForm, setExemplaryForm] = useState<ExemplaryChildRecord>({
    id: '',
    studentId: '',
    studentName: '',
    className: 'X',
    section: 'A',
    specialAptitude: '',
    identifyingIndicators: '',
    enrichmentStepsTaken: '',
    achievementsAndAwards: '',
    templatePageRef: 37
  });

  const [isSeaModalOpen, setIsSeaModalOpen] = useState<boolean>(false);
  const [seaForm, setSeaForm] = useState<SeaPlanItem>({
    id: '',
    slNo: 1,
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    monthAndDate: 'July 2025',
    activity: '',
    evaluationCriteria: 'R1: Geometric/Calculative Accuracy (5), R2: Theoretical Rigor (5), R3: Lab Record Neatness (5), R4: Viva Voce (5)',
    remarks: '',
    term: 1
  });

  // Load Data
  useEffect(() => {
    loadAllData();

    const handleTeacherChanged = () => {
      loadAllData();
    };
    window.addEventListener('kvs-active-teacher-changed', handleTeacherChanged);
    return () => window.removeEventListener('kvs-active-teacher-changed', handleTeacherChanged);
  }, []);

  const loadAllData = async () => {
    const cls = (await db.get<ClassSection[]>('setup:classes')) || DEFAULT_CLASSES;
    const sbj = (await db.get<SubjectItem[]>('setup:subjects')) || DEFAULT_SUBJECTS;
    const std = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    const lps = (await db.get<DailyLessonPlan[]>('setup:lesson_plans')) || DEFAULT_LESSON_PLANS;

    const v8 = (await db.get<ScholasticScoreRecordVItoVIII[]>('setup:scholastic_scores_vi_viii')) || DEFAULT_SCHOLASTIC_SCORES_VI_VIII;
    const v10 = (await db.get<ScholasticScoreRecordIXtoX[]>('setup:scholastic_scores_ix_x')) || DEFAULT_SCHOLASTIC_SCORES_IX_X;
    const scX17f = (await db.get<ClassXMarksRecord17f[]>('setup:scores_class_x_17f')) || DEFAULT_CLASS_X_MARKS_17F;
    const scXI17g = (await db.get<ClassXIAssessmentRecord17g[]>('setup:scores_class_xi_17g')) || DEFAULT_CLASS_XI_ASSESSMENT_17G;
    const scXII17h = (await db.get<ClassXIIMarksRecord17h[]>('setup:scores_class_xii_17h')) || DEFAULT_CLASS_XII_MARKS_17H;
    const rawNbs = (await db.get<NotebookSubmissionRecord17j[]>('setup:notebook_submissions_17j')) || [];
    const nbDates = (await db.get<string[]>('setup:notebook_dates_17j')) || DEFAULT_NOTEBOOK_DATES_17J;

    // Reconcile 17(j) Notebook records from Student Profile & Roster
    // Sample dummy data is replaced/pruned, and real roster student records are populated
    const studentById = new Map<string, StudentProfile>();
    const studentByStudentId = new Map<string, StudentProfile>();
    std.forEach(s => {
      studentById.set(s.id, s);
      if (s.studentId) studentByStudentId.set(s.studentId, s);
    });

    const savedSubmissionsMap = new Map<string, { submissions: Record<string, string>; remarks?: string; subjectName?: string; term?: number | string }>();
    rawNbs.forEach(r => {
      // Find matching student
      const matched = studentById.get(r.studentId) || studentByStudentId.get(r.studentId) || studentById.get(r.id.replace('nb-17j-', ''));
      if (matched) {
        savedSubmissionsMap.set(matched.id, {
          submissions: r.submissions || {},
          remarks: r.remarks || '',
          subjectName: r.subjectName,
          term: r.term
        });
      }
    });

    const reconciledNbs: NotebookSubmissionRecord17j[] = std.map((student) => {
      const saved = savedSubmissionsMap.get(student.id);
      return {
        id: `nb-17j-${student.id}`,
        studentId: student.id,
        studentName: student.studentName,
        rollNo: student.rollNo,
        className: student.className,
        section: student.section,
        subjectName: saved?.subjectName || 'Mathematics (041)',
        academicYear: '2025-2026',
        term: saved?.term || 1,
        submissions: saved?.submissions || {},
        remarks: saved?.remarks || '',
        templatePageRef: 30
      };
    });

    await db.set('setup:notebook_submissions_17j', reconciledNbs);

    // Reconcile 17(i) Practical Attendance records from Student Profile & Roster
    const rawPract17i = (await db.get<PracticalAttendanceRecord17i[]>('setup:practical_attendance_17i')) || [];
    const practDates = (await db.get<string[]>('setup:practical_dates_17i')) || DEFAULT_PRACTICAL_DATES_17I;
    const practTitles = (await db.get<string[]>('setup:practical_titles_17i')) || DEFAULT_PRACTICAL_TITLES_17I;

    const savedPractMap = new Map<string, { attendance: Record<string, string>; remarks?: string; subjectName?: string; term?: number | string }>();
    rawPract17i.forEach(r => {
      const matched = studentById.get(r.studentId) || studentByStudentId.get(r.studentId) || studentById.get(r.id.replace('pract-17i-', ''));
      if (matched) {
        savedPractMap.set(matched.id, {
          attendance: r.attendance || {},
          remarks: r.remarks || '',
          subjectName: r.subjectName,
          term: r.term
        });
      }
    });

    const reconciledPract17i: PracticalAttendanceRecord17i[] = std.map((student) => {
      const saved = savedPractMap.get(student.id);
      return {
        id: `pract-17i-${student.id}`,
        studentId: student.id,
        studentName: student.studentName,
        rollNo: student.rollNo,
        className: student.className,
        section: student.section,
        subjectName: saved?.subjectName || 'Mathematics (041)',
        academicYear: '2025-2026',
        term: saved?.term || 1,
        attendance: saved?.attendance || {},
        remarks: saved?.remarks || '',
        templatePageRef: 29
      };
    });

    await db.set('setup:practical_attendance_17i', reconciledPract17i);

    const assts = (await db.get<AssessmentProgressRecord[]>('setup:assessments')) || DEFAULT_ASSESSMENT_RECORDS;
    const mdps = (await db.get<MdpAipProjectRecord[]>('setup:mdp_aip_projects')) || DEFAULT_MDP_AIP_PROJECTS;
    const seas = (await db.get<SeaPlanItem[]>('setup:secondary_sea_plans')) || DEFAULT_SECONDARY_SEA_PLANS;
    const pract = (await db.get<PracticalAttendanceRecord[]>('setup:practical_attendance')) || DEFAULT_PRACTICAL_ATTENDANCE;
    const rems = (await db.get<SecondaryRemedialRecord[]>('setup:secondary_remedial')) || DEFAULT_SECONDARY_REMEDIAL;
    const exms = (await db.get<ExemplaryChildRecord[]>('setup:exemplary_children')) || DEFAULT_EXEMPLARY_CHILDREN;

    setClasses(cls);
    setSubjects(sbj);
    setStudents(std);
    setLessonPlans(lps);
    setScoresVI_VIII(v8);
    setScoresIX_X(v10);
    setScoresClassX_17F(scX17f);
    setScoresClassXI_17G(scXI17g);
    setScoresClassXII_17H(scXII17h);
    setNotebookRecords(reconciledNbs);
    setNotebookDates(nbDates);
    setPractical17iRecords(reconciledPract17i);
    setPracticalDates17i(practDates);
    setPracticalTitles17i(practTitles);
    setFormativeRecords(assts);
    setMdpAipProjects(mdps);
    setSeaPlans(seas);
    setPracticalAttendance(pract);
    setRemedialRecords(rems);
    setExemplaryChildren(exms);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // ==========================================
  // Scholastic Score Calculator & Handlers
  // ==========================================
  const handleUpdateScoreVI_VIII = (
    id: string,
    field: keyof ScholasticScoreRecordVItoVIII,
    value: any
  ) => {
    setScoresVI_VIII(prev => {
      const updated = prev.map(rec => {
        if (rec.id !== id) return rec;
        const copy = { ...rec, [field]: value };
        // Recalculate Total
        const pt1 = Number(copy.pt1 || 0);
        const pt2 = Number(copy.pt2 || 0);
        const nb = Number(copy.notebook || 0);
        const se = Number(copy.subjectEnrichment || 0);
        const mdp = Number(copy.mdp || 0);
        const ld = Number(copy.learnersDiary || 0);
        const hy = Number(copy.halfYearly || 0);

        const total = Math.min(100, Math.round((pt1 + pt2) / 2 + nb + se + mdp + ld + hy * 0.9 * 10) / 10 || Math.round((pt1 + pt2 + nb + se + mdp + ld + hy) * 10) / 10);
        const percentage = Math.min(100, Math.max(0, Math.round(total * 10) / 10));
        copy.totalMarks = percentage;
        copy.percentage = percentage;
        copy.grade = computeCBSEGrade(percentage);
        return copy;
      });
      db.set('setup:scholastic_scores_vi_viii', updated);
      return updated;
    });
  };

  const handleUpdateScoreIX_X = (
    id: string,
    field: keyof ScholasticScoreRecordIXtoX,
    value: any
  ) => {
    setScoresIX_X(prev => {
      const updated = prev.map(rec => {
        if (rec.id !== id) return rec;
        const copy = { ...rec, [field]: value };
        const ptAvg = Number(copy.ptAvg || 0);
        const ma = Number(copy.multipleAssessment || 0);
        const port = Number(copy.portfolio || 0);
        const se = Number(copy.subjectEnrichment || 0);
        const boardExam = Number(copy.boardOrSeeExam || 0);

        const internalTotal = Math.round((ptAvg + ma + port + se) * 10) / 10;
        const grandTotal = Math.round((internalTotal + boardExam) * 10) / 10;
        const percentage = Math.min(100, Math.max(0, grandTotal));

        copy.internalTotal = internalTotal;
        copy.grandTotal = grandTotal;
        copy.percentage = percentage;
        copy.grade = computeCBSEGrade(percentage);
        return copy;
      });
      db.set('setup:scholastic_scores_ix_x', updated);
      return updated;
    });
  };

  // 17(f) Class X Handlers
  const handleUpdateScoreClassX_17F = (
    id: string,
    field: keyof ClassXMarksRecord17f,
    value: any
  ) => {
    setScoresClassX_17F(prev => {
      const updated = prev.map(rec => {
        if (rec.id !== id) return rec;
        return { ...rec, [field]: value };
      });
      db.set('setup:scores_class_x_17f', updated);
      return updated;
    });
  };

  // 17(g) Class XI Handlers
  const handleUpdateScoreClassXI_17G = (
    id: string,
    field: keyof ClassXIAssessmentRecord17g,
    value: any
  ) => {
    setScoresClassXI_17G(prev => {
      const updated = prev.map(rec => {
        if (rec.id !== id) return rec;
        const copy = { ...rec, [field]: value };
        const seeTh = Number(copy.seeTheory || 0);
        const seePr = Number(copy.seePractical || 0);
        copy.seeTotal = Math.round((seeTh + seePr) * 10) / 10;
        return copy;
      });
      db.set('setup:scores_class_xi_17g', updated);
      return updated;
    });
  };

  // 17(h) Class XII Handlers
  const handleUpdateScoreClassXII_17H = (
    id: string,
    field: keyof ClassXIIMarksRecord17h,
    value: any
  ) => {
    setScoresClassXII_17H(prev => {
      const updated = prev.map(rec => {
        if (rec.id !== id) return rec;
        return { ...rec, [field]: value };
      });
      db.set('setup:scores_class_xii_17h', updated);
      return updated;
    });
  };

  const handleAddStudentScoreRow = async () => {
    if (scholasticStage === 'vi_viii') {
      const newRec: ScholasticScoreRecordVItoVIII = {
        id: `scr-6-${Date.now()}`,
        studentId: `std-new-${Date.now()}`,
        studentName: 'New Student',
        rollNo: scoresVI_VIII.length + 1,
        className: 'VI',
        section: 'A',
        subjectName: 'Mathematics (041)',
        academicYear: '2025-2026',
        pt1: 8,
        pt2: 8.5,
        notebook: 4.5,
        subjectEnrichment: 4.5,
        mdp: 4.5,
        learnersDiary: 4,
        halfYearly: 65,
        totalMarks: 82,
        percentage: 82,
        grade: 'A2',
        remarks: 'New entry created.',
        templatePageRef: 22
      };
      const updated = [...scoresVI_VIII, newRec];
      setScoresVI_VIII(updated);
      await db.set('setup:scholastic_scores_vi_viii', updated);
      showToast('Added student record for Classes VI-VIII');
    } else if (scholasticStage === 'ix_x') {
      const newRec: ScholasticScoreRecordIXtoX = {
        id: `scr-10-${Date.now()}`,
        studentId: `std-new-${Date.now()}`,
        studentName: 'New Student',
        rollNo: scoresIX_X.length + 1,
        className: 'X',
        section: 'A',
        subjectName: 'Mathematics (041)',
        academicYear: '2025-2026',
        ptAvg: 4.5,
        multipleAssessment: 4.5,
        portfolio: 4.5,
        subjectEnrichment: 4.5,
        internalTotal: 18,
        boardOrSeeExam: 70,
        grandTotal: 88,
        percentage: 88,
        grade: 'A2',
        remarks: 'New entry created.',
        templatePageRef: 24
      };
      const updated = [...scoresIX_X, newRec];
      setScoresIX_X(updated);
      await db.set('setup:scholastic_scores_ix_x', updated);
      showToast('Added student record for Classes IX-X');
    } else if (scholasticStage === 'class_x_17f') {
      const newRec: ClassXMarksRecord17f = {
        id: `scr-10f-${Date.now()}`,
        studentId: `std-new-${Date.now()}`,
        studentName: 'New Student',
        rollNo: scoresClassX_17F.length + 1,
        className: 'X',
        section: 'A',
        subjectName: 'Mathematics (041)',
        academicYear: '2025-2026',
        m1: 18,
        m2: 18,
        m3: 19,
        m4: 19,
        m5: 19,
        pt1: 36,
        pt2: 38,
        hy: 70,
        pb1: 68,
        pb2: 72,
        pb3: 75,
        aisse: 90,
        parentSignature: 'Signed',
        remarks: 'Good progress.',
        templatePageRef: 25
      };
      const updated = [...scoresClassX_17F, newRec];
      setScoresClassX_17F(updated);
      await db.set('setup:scores_class_x_17f', updated);
      showToast('Added student mark entry for 17(f) Class X');
    } else if (scholasticStage === 'class_xi_17g') {
      const newRec: ClassXIAssessmentRecord17g = {
        id: `scr-11g-${Date.now()}`,
        studentId: `std-new-${Date.now()}`,
        studentName: 'New Student',
        rollNo: scoresClassXI_17G.length + 1,
        className: 'XI',
        section: 'A',
        subjectName: 'Mathematics (041)',
        academicYear: '2025-2026',
        pt1: 35,
        halfYearly: 60,
        pt2: 36,
        seeTheory: 62,
        seePractical: 28,
        seeTotal: 90,
        remarks: 'Consistent performance.',
        templatePageRef: 29
      };
      const updated = [...scoresClassXI_17G, newRec];
      setScoresClassXI_17G(updated);
      await db.set('setup:scores_class_xi_17g', updated);
      showToast('Added student assessment entry for 17(g) Class XI');
    } else if (scholasticStage === 'class_xii_17h') {
      const newRec: ClassXIIMarksRecord17h = {
        id: `scr-12h-${Date.now()}`,
        studentId: `std-new-${Date.now()}`,
        studentName: 'New Student',
        rollNo: scoresClassXII_17H.length + 1,
        className: 'XII',
        section: 'A',
        subjectName: 'Mathematics (041)',
        academicYear: '2025-2026',
        m1: 18,
        m2: 18,
        m3: 19,
        m4: 19,
        m5: 20,
        pt1: 37,
        pt2: 39,
        hy: 72,
        pb1: 70,
        pb2: 75,
        pb3: 78,
        aissce: 94,
        parentSignature: 'Signed',
        remarks: 'Strong board potential.',
        templatePageRef: 35
      };
      const updated = [...scoresClassXII_17H, newRec];
      setScoresClassXII_17H(updated);
      await db.set('setup:scores_class_xii_17h', updated);
      showToast('Added student mark entry for 17(h) Class XII');
    }
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (scholasticStage === 'vi_viii') {
      headers = ['Roll No', 'Student Name', 'Class', 'Section', 'Subject', 'PT1 (10)', 'PT2 (10)', 'Notebook (5)', 'SEA (5)', 'MDP (5)', 'Learners Diary (5)', 'Half Yearly (80)', 'Total', 'Percentage', 'Grade', 'Remarks'];
      rows = scoresVI_VIII.map(r => [
        String(r.rollNo),
        r.studentName,
        r.className,
        r.section,
        r.subjectName,
        String(r.pt1 ?? ''),
        String(r.pt2 ?? ''),
        String(r.notebook ?? ''),
        String(r.subjectEnrichment ?? ''),
        String(r.mdp ?? ''),
        String(r.learnersDiary ?? ''),
        String(r.halfYearly ?? ''),
        String(r.totalMarks),
        String(r.percentage),
        r.grade,
        r.remarks || ''
      ]);
    } else if (scholasticStage === 'ix_x') {
      headers = ['Roll No', 'Student Name', 'Class', 'Section', 'Subject', 'PT Avg (5)', 'Multiple Asst (5)', 'Portfolio (5)', 'SEA (5)', 'Internal Total (20)', 'Board/SEE Exam (80)', 'Grand Total (100)', 'Percentage', 'Grade', 'Remarks'];
      rows = scoresIX_X.map(r => [
        String(r.rollNo),
        r.studentName,
        r.className,
        r.section,
        r.subjectName,
        String(r.ptAvg ?? ''),
        String(r.multipleAssessment ?? ''),
        String(r.portfolio ?? ''),
        String(r.subjectEnrichment ?? ''),
        String(r.internalTotal),
        String(r.boardOrSeeExam ?? ''),
        String(r.grandTotal),
        String(r.percentage),
        r.grade,
        r.remarks || ''
      ]);
    } else if (scholasticStage === 'class_x_17f') {
      headers = ['Sl. No.', 'Name of Student', 'Class', 'Section', 'Subject', 'M-1', 'M-2', 'M-3', 'M-4', 'M-5', 'PT-1', 'PT-2', 'HY', 'PB-1', 'PB-2', 'PB-3', 'AISSE', 'Signature of Parent', 'Remarks'];
      rows = scoresClassX_17F.map(r => [
        String(r.rollNo),
        r.studentName,
        r.className,
        r.section,
        r.subjectName,
        String(r.m1 ?? ''),
        String(r.m2 ?? ''),
        String(r.m3 ?? ''),
        String(r.m4 ?? ''),
        String(r.m5 ?? ''),
        String(r.pt1 ?? ''),
        String(r.pt2 ?? ''),
        String(r.hy ?? ''),
        String(r.pb1 ?? ''),
        String(r.pb2 ?? ''),
        String(r.pb3 ?? ''),
        String(r.aisse ?? ''),
        r.parentSignature || '',
        r.remarks || ''
      ]);
    } else if (scholasticStage === 'class_xi_17g') {
      headers = ['S.No.', 'Name of the Student', 'Class', 'Section', 'Subject', 'Periodic Test 1', 'Half Yearly Exam', 'Periodic Test 2', 'SEE Theory', 'SEE Practical/Project/ASL', 'SEE Total', 'Remark'];
      rows = scoresClassXI_17G.map(r => [
        String(r.rollNo),
        r.studentName,
        r.className,
        r.section,
        r.subjectName,
        String(r.pt1 ?? ''),
        String(r.halfYearly ?? ''),
        String(r.pt2 ?? ''),
        String(r.seeTheory ?? ''),
        String(r.seePractical ?? ''),
        String(r.seeTotal ?? ''),
        r.remarks || ''
      ]);
    } else if (scholasticStage === 'class_xii_17h') {
      headers = ['Sl. No.', 'Name of Student', 'Class', 'Section', 'Subject', 'M-1', 'M-2', 'M-3', 'M-4', 'M-5', 'PT-1', 'PT-2', 'HY', 'PB-1', 'PB-2', 'PB-3', 'AISSCE', 'Signature of Parent', 'Remarks'];
      rows = scoresClassXII_17H.map(r => [
        String(r.rollNo),
        r.studentName,
        r.className,
        r.section,
        r.subjectName,
        String(r.m1 ?? ''),
        String(r.m2 ?? ''),
        String(r.m3 ?? ''),
        String(r.m4 ?? ''),
        String(r.m5 ?? ''),
        String(r.pt1 ?? ''),
        String(r.pt2 ?? ''),
        String(r.hy ?? ''),
        String(r.pb1 ?? ''),
        String(r.pb2 ?? ''),
        String(r.pb3 ?? ''),
        String(r.aissce ?? ''),
        r.parentSignature || '',
        r.remarks || ''
      ]);
    } else if (activeSubTab === 'notebook_submission') {
      headers = ['S.No.', 'Name of Student', 'Class', 'Section', 'Subject', ...notebookDates.slice(0, 20).map((d, i) => d || `Col ${i + 1}`), 'Remarks'];
      rows = filteredNotebookRecords.map(r => [
        String(r.rollNo),
        r.studentName,
        r.className,
        r.section,
        r.subjectName,
        ...Array.from({ length: 20 }).map((_, cIdx) => r.submissions[String(cIdx)] || ''),
        r.remarks || ''
      ]);
    } else if (activeSubTab === 'practical_attendance') {
      headers = ['S.No.', 'Name of Student', 'Class', 'Section', 'Subject', ...practicalDates17i.slice(0, 20).map((d, i) => `${d || `Col ${i + 1}`} (${practicalTitles17i[i] || `Exp ${i + 1}`})`), 'Remarks'];
      rows = filteredPractical17iRecords.map(r => [
        String(r.rollNo),
        r.studentName,
        r.className,
        r.section,
        r.subjectName,
        ...Array.from({ length: 20 }).map((_, cIdx) => r.attendance[String(cIdx)] || ''),
        r.remarks || ''
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KVS_Register_${activeSubTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported register data to CSV');
  };

  // ==========================================
  // 17(i) Practical Attendance Record Handlers
  // ==========================================
  const handleSyncPracticalFromRoster = async () => {
    const std = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    setStudents(std);

    const studentById = new Map<string, StudentProfile>();
    const studentByStudentId = new Map<string, StudentProfile>();
    std.forEach(s => {
      studentById.set(s.id, s);
      if (s.studentId) studentByStudentId.set(s.studentId, s);
    });

    const savedAttendanceMap = new Map<string, { attendance: Record<string, string>; remarks?: string; subjectName?: string; term?: number | string }>();
    practical17iRecords.forEach(r => {
      const matched = studentById.get(r.studentId) || studentByStudentId.get(r.studentId) || studentById.get(r.id.replace('pract-17i-', ''));
      if (matched) {
        savedAttendanceMap.set(matched.id, {
          attendance: r.attendance || {},
          remarks: r.remarks || '',
          subjectName: r.subjectName,
          term: r.term
        });
      }
    });

    const synced: PracticalAttendanceRecord17i[] = std.map((student) => {
      const saved = savedAttendanceMap.get(student.id);
      return {
        id: `pract-17i-${student.id}`,
        studentId: student.id,
        studentName: student.studentName,
        rollNo: student.rollNo,
        className: student.className,
        section: student.section,
        subjectName: saved?.subjectName || (subjectFilter === 'All' ? 'Mathematics (041)' : subjectFilter),
        academicYear: '2025-2026',
        term: saved?.term || 1,
        attendance: saved?.attendance || {},
        remarks: saved?.remarks || '',
        templatePageRef: 29
      };
    });

    setPractical17iRecords(synced);
    await db.set('setup:practical_attendance_17i', synced);
    const countInClass = synced.filter(r => (classFilter === 'All' || r.className === classFilter) && (sectionFilter === 'All' || r.section === sectionFilter)).length;
    showToast(`Imported ${countInClass} students from Student Profile & Roster for 17(i) Practical Attendance`);
  };

  const handleUpdatePracticalCell = (id: string, colKey: string, value: string) => {
    setPractical17iRecords(prev => {
      const updated = prev.map(rec => {
        if (rec.id !== id) return rec;
        return {
          ...rec,
          attendance: {
            ...rec.attendance,
            [colKey]: value
          }
        };
      });
      db.set('setup:practical_attendance_17i', updated);
      return updated;
    });
  };

  const handleCyclePracticalCell = (id: string, colKey: string) => {
    const current = practical17iRecords.find(r => r.id === id)?.attendance[colKey] || '';
    let nextVal = '';
    if (current === '') nextVal = 'P';
    else if (current === 'P') nextVal = '✓';
    else if (current === '✓') nextVal = 'Sign';
    else if (current === 'Sign') nextVal = 'A';
    else if (current === 'A') nextVal = '';
    else nextVal = '';
    handleUpdatePracticalCell(id, colKey, nextVal);
  };

  const handleUpdatePracticalStudentName = (id: string, name: string) => {
    setPractical17iRecords(prev => {
      const updated = prev.map(rec => (rec.id === id ? { ...rec, studentName: name } : rec));
      db.set('setup:practical_attendance_17i', updated);
      return updated;
    });
  };

  const handleUpdatePracticalRemarks = (id: string, remarks: string) => {
    setPractical17iRecords(prev => {
      const updated = prev.map(rec => (rec.id === id ? { ...rec, remarks } : rec));
      db.set('setup:practical_attendance_17i', updated);
      return updated;
    });
  };

  const handleDeletePracticalRow = (id: string) => {
    if (window.confirm('Remove this student row from the practical attendance register?')) {
      const updated = practical17iRecords.filter(r => r.id !== id);
      setPractical17iRecords(updated);
      db.set('setup:practical_attendance_17i', updated);
      showToast('Removed student row from 17(i)');
    }
  };

  const handleAddPracticalStudentRow = () => {
    const newRec: PracticalAttendanceRecord17i = {
      id: `pract-17i-${Date.now()}`,
      studentId: `std-new-${Date.now()}`,
      studentName: 'New Student',
      rollNo: practical17iRecords.length + 1,
      className: classFilter === 'All' ? 'X' : classFilter,
      section: sectionFilter === 'All' ? 'A' : sectionFilter,
      subjectName: subjectFilter === 'All' ? 'Mathematics (041)' : subjectFilter,
      academicYear: '2025-2026',
      term: 1,
      attendance: {
        '0': 'P', '1': 'P', '2': 'P', '3': 'P', '4': 'P', '5': 'P',
        '6': 'P', '7': 'P', '8': 'P', '9': 'P', '10': 'P', '11': 'P',
        '12': 'P', '13': 'P', '14': 'P', '15': 'P', '16': 'P', '17': 'P',
        '18': 'P', '19': 'P'
      },
      remarks: 'Active lab participant',
      templatePageRef: 29
    };
    const updated = [...practical17iRecords, newRec];
    setPractical17iRecords(updated);
    db.set('setup:practical_attendance_17i', updated);
    showToast('Added student row to 17(i) Practical Attendance');
  };

  const handleUpdatePracticalDate = (index: number, newDate: string) => {
    const updated = [...practicalDates17i];
    updated[index] = newDate;
    setPracticalDates17i(updated);
    db.set('setup:practical_dates_17i', updated);
  };

  const handleUpdatePracticalTitle = (index: number, newTitle: string) => {
    const updated = [...practicalTitles17i];
    updated[index] = newTitle;
    setPracticalTitles17i(updated);
    db.set('setup:practical_titles_17i', updated);
  };

  const handleMarkAllPresentForCol17i = (colIndex: number) => {
    setPractical17iRecords(prev => {
      const updated = prev.map(rec => ({
        ...rec,
        attendance: {
          ...rec.attendance,
          [String(colIndex)]: 'P'
        }
      }));
      db.set('setup:practical_attendance_17i', updated);
      return updated;
    });
    showToast(`Marked all students Present (P) for Practical Date ${practicalDates17i[colIndex] || `Col #${colIndex + 1}`}`);
  };

  const handleClearCol17i = (colIndex: number) => {
    setPractical17iRecords(prev => {
      const updated = prev.map(rec => {
        const copy = { ...rec.attendance };
        delete copy[String(colIndex)];
        return {
          ...rec,
          attendance: copy
        };
      });
      db.set('setup:practical_attendance_17i', updated);
      return updated;
    });
    showToast(`Cleared entries for Practical Date ${practicalDates17i[colIndex] || `Col #${colIndex + 1}`}`);
  };

  // ==========================================
  // 17(j) Notebook Submission Record Handlers
  // ==========================================
  const handleSyncNotebookFromRoster = async () => {
    const std = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    setStudents(std);

    const studentById = new Map<string, StudentProfile>();
    const studentByStudentId = new Map<string, StudentProfile>();
    std.forEach(s => {
      studentById.set(s.id, s);
      if (s.studentId) studentByStudentId.set(s.studentId, s);
    });

    const savedSubmissionsMap = new Map<string, { submissions: Record<string, string>; remarks?: string; subjectName?: string; term?: number | string }>();
    notebookRecords.forEach(r => {
      const matched = studentById.get(r.studentId) || studentByStudentId.get(r.studentId) || studentById.get(r.id.replace('nb-17j-', ''));
      if (matched) {
        savedSubmissionsMap.set(matched.id, {
          submissions: r.submissions || {},
          remarks: r.remarks || '',
          subjectName: r.subjectName,
          term: r.term
        });
      }
    });

    const synced: NotebookSubmissionRecord17j[] = std.map((student) => {
      const saved = savedSubmissionsMap.get(student.id);
      return {
        id: `nb-17j-${student.id}`,
        studentId: student.id,
        studentName: student.studentName,
        rollNo: student.rollNo,
        className: student.className,
        section: student.section,
        subjectName: saved?.subjectName || (subjectFilter === 'All' ? 'Mathematics (041)' : subjectFilter),
        academicYear: '2025-2026',
        term: saved?.term || 1,
        submissions: saved?.submissions || {},
        remarks: saved?.remarks || '',
        templatePageRef: 30
      };
    });

    setNotebookRecords(synced);
    await db.set('setup:notebook_submissions_17j', synced);
    const countInClass = synced.filter(r => (classFilter === 'All' || r.className === classFilter) && (sectionFilter === 'All' || r.section === sectionFilter)).length;
    showToast(`Imported ${countInClass} students from Student Profile & Roster for Class ${classFilter}`);
  };

  const handleUpdateNotebookCell = (id: string, colKey: string, value: string) => {
    setNotebookRecords(prev => {
      const updated = prev.map(rec => {
        if (rec.id !== id) return rec;
        return {
          ...rec,
          submissions: {
            ...rec.submissions,
            [colKey]: value
          }
        };
      });
      db.set('setup:notebook_submissions_17j', updated);
      return updated;
    });
  };

  const handleCycleNotebookCell = (id: string, colKey: string) => {
    const current = notebookRecords.find(r => r.id === id)?.submissions[colKey] || '';
    let nextVal = '';
    if (current === '') nextVal = '✓';
    else if (current === '✓') nextVal = 'A';
    else if (current === 'A') nextVal = 'Late';
    else if (current === 'Late') nextVal = '5/5';
    else if (current === '5/5') nextVal = '';
    else nextVal = '';
    handleUpdateNotebookCell(id, colKey, nextVal);
  };

  const handleUpdateNotebookStudentName = (id: string, name: string) => {
    setNotebookRecords(prev => {
      const updated = prev.map(rec => (rec.id === id ? { ...rec, studentName: name } : rec));
      db.set('setup:notebook_submissions_17j', updated);
      return updated;
    });
  };

  const handleUpdateNotebookRemarks = (id: string, remarks: string) => {
    setNotebookRecords(prev => {
      const updated = prev.map(rec => (rec.id === id ? { ...rec, remarks } : rec));
      db.set('setup:notebook_submissions_17j', updated);
      return updated;
    });
  };

  const handleDeleteNotebookRow = (id: string) => {
    if (window.confirm('Remove this student row from the notebook submission register?')) {
      const updated = notebookRecords.filter(r => r.id !== id);
      setNotebookRecords(updated);
      db.set('setup:notebook_submissions_17j', updated);
      showToast('Removed student row from 17(j)');
    }
  };

  const handleAddNotebookStudentRow = () => {
    const newRec: NotebookSubmissionRecord17j = {
      id: `nb-17j-${Date.now()}`,
      studentId: `std-new-${Date.now()}`,
      studentName: 'New Student',
      rollNo: notebookRecords.length + 1,
      className: classFilter === 'All' ? 'X' : classFilter,
      section: sectionFilter === 'All' ? 'A' : sectionFilter,
      subjectName: subjectFilter === 'All' ? 'Mathematics (041)' : subjectFilter,
      academicYear: '2025-2026',
      term: 1,
      submissions: {
        '0': '✓', '1': '✓', '2': '✓', '3': '✓', '4': '✓', '5': '✓',
        '6': '✓', '7': '✓', '8': '✓', '9': '✓', '10': '✓', '11': '✓',
        '12': '✓', '13': '✓', '14': '✓', '15': '✓', '16': '✓', '17': '✓',
        '18': '✓', '19': '✓'
      },
      remarks: 'Regular work',
      templatePageRef: 30
    };
    const updated = [...notebookRecords, newRec];
    setNotebookRecords(updated);
    db.set('setup:notebook_submissions_17j', updated);
    showToast('Added student row to 17(j) Notebook Register');
  };

  const handleUpdateNotebookDate = (index: number, newDate: string) => {
    const updated = [...notebookDates];
    updated[index] = newDate;
    setNotebookDates(updated);
    db.set('setup:notebook_dates_17j', updated);
  };

  const handleMarkAllCheckedForCol = (colIndex: number) => {
    setNotebookRecords(prev => {
      const updated = prev.map(rec => ({
        ...rec,
        submissions: {
          ...rec.submissions,
          [String(colIndex)]: '✓'
        }
      }));
      db.set('setup:notebook_submissions_17j', updated);
      return updated;
    });
    showToast(`Marked all students checked (✓) for Date ${notebookDates[colIndex] || `Col #${colIndex + 1}`}`);
  };

  const handleClearCol = (colIndex: number) => {
    setNotebookRecords(prev => {
      const updated = prev.map(rec => {
        const copy = { ...rec.submissions };
        delete copy[String(colIndex)];
        return {
          ...rec,
          submissions: copy
        };
      });
      db.set('setup:notebook_submissions_17j', updated);
      return updated;
    });
    showToast(`Cleared entries for Date ${notebookDates[colIndex] || `Col #${colIndex + 1}`}`);
  };

  // ==========================================
  // Formative Assessment Handlers
  // ==========================================
  const handleSaveFormative = async () => {
    if (!formativeForm.title.trim() || !formativeForm.topic.trim()) {
      alert('Please provide Title and Topic.');
      return;
    }
    let updated = [...formativeRecords];
    if (formativeForm.id) {
      updated = updated.map(r => (r.id === formativeForm.id ? formativeForm : r));
    } else {
      updated.unshift({ ...formativeForm, id: `asst-${Date.now()}` });
    }
    setFormativeRecords(updated);
    await db.set('setup:assessments', updated);
    setIsFormativeModalOpen(false);
    showToast('✨ Formative Progress Record saved!');
    if (onSaved) onSaved();
  };

  const handleDeleteFormative = async (id: string) => {
    if (window.confirm('Delete this assessment record?')) {
      const updated = formativeRecords.filter(r => r.id !== id);
      setFormativeRecords(updated);
      await db.set('setup:assessments', updated);
      showToast('Record deleted.');
    }
  };

  const handleSelectLessonPlan = (planId: string) => {
    const selected = lessonPlans.find(p => p.id === planId);
    if (selected) {
      setFormativeForm(prev => ({
        ...prev,
        lessonPlanId: planId,
        className: selected.className,
        section: selected.section,
        subjectName: selected.subjectName,
        topic: selected.topic,
        date: selected.date,
        performanceRemarks: prev.performanceRemarks || selected.teacherReflection || '',
        slowLearnerSupport: prev.slowLearnerSupport || selected.remedialWork || '',
        advancedLearnerActivity: prev.advancedLearnerActivity || selected.enrichmentActivity || ''
      }));
    } else {
      setFormativeForm(prev => ({ ...prev, lessonPlanId: '' }));
    }
  };

  // ==========================================
  // MDP / AIP Project Handlers
  // ==========================================
  const handleSaveMdp = async () => {
    if (!mdpForm.title.trim() && !mdpForm.topic?.trim() && !mdpForm.mdpAssigned?.trim() && !mdpForm.aipAssigned?.trim()) {
      alert('Please enter Topic and Assigned Project description.');
      return;
    }
    const total = Number(mdpForm.r1Content || 0) + Number(mdpForm.r2ArtIntegration || 0) + Number(mdpForm.r3ResearchCreativity || 0) + Number(mdpForm.r4Presentation || 0);
    const itemToSave: MdpAipProjectRecord = {
      ...mdpForm,
      title: mdpForm.title || mdpForm.topic || (mdpForm.projectType === 'MDP' ? mdpForm.mdpAssigned : mdpForm.aipAssigned) || 'Project Task',
      topic: mdpForm.topic || mdpForm.title || '',
      mdpAssigned: mdpForm.projectType === 'MDP' ? (mdpForm.mdpAssigned || mdpForm.title) : undefined,
      aipAssigned: mdpForm.projectType === 'AIP' ? (mdpForm.aipAssigned || mdpForm.title) : undefined,
      totalMarks: total || 20
    };

    let updated = [...mdpAipProjects];
    if (itemToSave.id) {
      updated = updated.map(m => (m.id === itemToSave.id ? itemToSave : m));
    } else {
      updated.unshift({ ...itemToSave, id: `mdp-${Date.now()}` });
    }
    setMdpAipProjects(updated);
    await db.set('setup:mdp_aip_projects', updated);
    setIsMdpModalOpen(false);
    showToast('Project Record saved successfully!');
  };

  const handleDeleteMdp = async (id: string) => {
    if (window.confirm('Delete this project entry?')) {
      const updated = mdpAipProjects.filter(m => m.id !== id);
      setMdpAipProjects(updated);
      await db.set('setup:mdp_aip_projects', updated);
      showToast('Project deleted.');
    }
  };

  // ==========================================
  // Secondary Remedial Handlers
  // ==========================================
  const handleSaveRemedial = async () => {
    if (!remedialForm.studentName.trim() || !remedialForm.diagnosticWeakness.trim()) {
      alert('Please provide Student Name and Diagnostic Weakness.');
      return;
    }
    let updated = [...remedialRecords];
    if (remedialForm.id) {
      updated = updated.map(r => (r.id === remedialForm.id ? remedialForm : r));
    } else {
      updated.unshift({ ...remedialForm, id: `rem-${Date.now()}` });
    }
    setRemedialRecords(updated);
    await db.set('setup:secondary_remedial', updated);
    setIsRemedialModalOpen(false);
    showToast('Remedial Teaching Record saved!');
  };

  const handleDeleteRemedial = async (id: string) => {
    if (window.confirm('Delete this remedial record?')) {
      const updated = remedialRecords.filter(r => r.id !== id);
      setRemedialRecords(updated);
      await db.set('setup:secondary_remedial', updated);
      showToast('Record deleted.');
    }
  };

  // ==========================================
  // Exemplary Children Handlers
  // ==========================================
  const handleSaveExemplary = async () => {
    if (!exemplaryForm.studentName.trim() || !exemplaryForm.specialAptitude.trim()) {
      alert('Please provide Student Name and Special Aptitude.');
      return;
    }
    let updated = [...exemplaryChildren];
    if (exemplaryForm.id) {
      updated = updated.map(e => (e.id === exemplaryForm.id ? exemplaryForm : e));
    } else {
      updated.unshift({ ...exemplaryForm, id: `exm-${Date.now()}` });
    }
    setExemplaryChildren(updated);
    await db.set('setup:exemplary_children', updated);
    setIsExemplaryModalOpen(false);
    showToast('Exemplary Child Record saved!');
  };

  const handleDeleteExemplary = async (id: string) => {
    if (window.confirm('Delete this record?')) {
      const updated = exemplaryChildren.filter(e => e.id !== id);
      setExemplaryChildren(updated);
      await db.set('setup:exemplary_children', updated);
      showToast('Record deleted.');
    }
  };

  // ==========================================
  // SEA Activities Handlers
  // ==========================================
  const handleSaveSea = async () => {
    if (!seaForm.activity.trim()) {
      alert('Please enter Activity Title.');
      return;
    }
    let updated = [...seaPlans];
    if (seaForm.id) {
      updated = updated.map(s => (s.id === seaForm.id ? seaForm : s));
    } else {
      const nextSl = updated.length + 1;
      updated.push({ ...seaForm, id: `sea-${Date.now()}`, slNo: seaForm.slNo || nextSl });
    }
    setSeaPlans(updated);
    await db.set('setup:secondary_sea_plans', updated);
    setIsSeaModalOpen(false);
    showToast('SEA Activity Plan saved!');
  };

  const handleDeleteSea = async (id: string) => {
    if (window.confirm('Delete this SEA entry?')) {
      const updated = seaPlans.filter(s => s.id !== id);
      setSeaPlans(updated);
      await db.set('setup:secondary_sea_plans', updated);
      showToast('SEA entry deleted.');
    }
  };

  // Filtered views
  const filteredScoresVI_VIII = scoresVI_VIII.filter(r => {
    const matchSearch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || (r.remarks || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = classFilter === 'All' || r.className === classFilter;
    const matchSection = sectionFilter === 'All' || r.section === sectionFilter;
    const matchSubject = subjectFilter === 'All' || r.subjectName === subjectFilter;
    return matchSearch && matchClass && matchSection && matchSubject;
  });

  const filteredScoresIX_X = scoresIX_X.filter(r => {
    const matchSearch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || (r.remarks || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = classFilter === 'All' || r.className === classFilter;
    const matchSection = sectionFilter === 'All' || r.section === sectionFilter;
    const matchSubject = subjectFilter === 'All' || r.subjectName === subjectFilter;
    return matchSearch && matchClass && matchSection && matchSubject;
  });

  const filteredScoresClassX_17F = scoresClassX_17F.filter(r => {
    const matchSearch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || (r.remarks || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = classFilter === 'All' || r.className === classFilter;
    const matchSection = sectionFilter === 'All' || r.section === sectionFilter;
    const matchSubject = subjectFilter === 'All' || r.subjectName === subjectFilter;
    return matchSearch && matchClass && matchSection && matchSubject;
  });

  const filteredScoresClassXI_17G = scoresClassXI_17G.filter(r => {
    const matchSearch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || (r.remarks || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = classFilter === 'All' || r.className === classFilter;
    const matchSection = sectionFilter === 'All' || r.section === sectionFilter;
    const matchSubject = subjectFilter === 'All' || r.subjectName === subjectFilter;
    return matchSearch && matchClass && matchSection && matchSubject;
  });

  const filteredScoresClassXII_17H = scoresClassXII_17H.filter(r => {
    const matchSearch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || (r.remarks || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = classFilter === 'All' || r.className === classFilter;
    const matchSection = sectionFilter === 'All' || r.section === sectionFilter;
    const matchSubject = subjectFilter === 'All' || r.subjectName === subjectFilter;
    return matchSearch && matchClass && matchSection && matchSubject;
  });

  const filteredNotebookRecords = notebookRecords
    .filter(r => {
      const matchSearch = (r.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.remarks || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = classFilter === 'All' || r.className === classFilter;
      const matchSection = sectionFilter === 'All' || r.section === sectionFilter;
      return matchSearch && matchClass && matchSection;
    })
    .sort((a, b) => (Number(a.rollNo) || 0) - (Number(b.rollNo) || 0));

  const filteredPractical17iRecords = practical17iRecords
    .filter(r => {
      const matchSearch = (r.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.remarks || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = classFilter === 'All' || r.className === classFilter;
      const matchSection = sectionFilter === 'All' || r.section === sectionFilter;
      return matchSearch && matchClass && matchSection;
    })
    .sort((a, b) => (Number(a.rollNo) || 0) - (Number(b.rollNo) || 0));

  const filteredFormative = formativeRecords.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.topic.toLowerCase().includes(searchTerm.toLowerCase()) || r.performanceRemarks.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = classFilter === 'All' || r.className === classFilter;
    const matchSubject = subjectFilter === 'All' || r.subjectName === subjectFilter;
    const matchType = typeFilter === 'All' || r.assessmentType === typeFilter;
    const matchMonth = monthFilter === 'All' || r.month === monthFilter;
    return matchSearch && matchClass && matchSubject && matchType && matchMonth;
  });

  const filteredMdp = mdpAipProjects.filter(p => {
    const isMDP = p.projectType === 'MDP';
    const matchClass = classFilter === 'All' || p.className === classFilter;
    const matchSearch = (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.mdpAssigned || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.evaluationCriteria || '').toLowerCase().includes(searchTerm.toLowerCase());
    return isMDP && matchClass && matchSearch;
  });

  const filteredAip = mdpAipProjects.filter(p => {
    const isAIP = p.projectType === 'AIP';
    const matchClass = classFilter === 'All' || p.className === classFilter;
    const matchSearch = (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.aipAssigned || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.evaluationCriteria || '').toLowerCase().includes(searchTerm.toLowerCase());
    return isAIP && matchClass && matchSearch;
  });

  const filteredSea = seaPlans.filter(s => {
    const matchClass = classFilter === 'All' || s.className === classFilter;
    const matchSearch = (s.activity || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.evaluationCriteria || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.monthAndDate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.remarks || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchClass && matchSearch;
  });

  // ==========================================
  // Print Mode Layout
  // ==========================================
  if (isPrintMode) {
    return (
      <div className="bg-white text-slate-900 min-h-screen p-8 print:p-0 font-sans">
        <div className="no-print mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xl">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Printer className="w-5 h-5 text-purple-400" />
              Print Preview: KVS Scholastic Assessment, Homework & Progress Suite
            </h3>
            <p className="text-xs text-slate-400">
              Official KVS/CBSE Template Pages 22-37 Middle & Secondary Teacher's Diary
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sheet switcher */}
            <div className="flex flex-wrap bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-semibold gap-1">
              <button
                onClick={() => setPrintSheetType('mdp_aip')}
                className={`px-2.5 py-1 rounded-md transition ${printSheetType === 'mdp_aip' ? 'bg-purple-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                17(b)&(c) MDP/AIP
              </button>
              <button
                onClick={() => setPrintSheetType('sea')}
                className={`px-2.5 py-1 rounded-md transition ${printSheetType === 'sea' ? 'bg-purple-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                17(e) SEA Activity
              </button>
              <button
                onClick={() => setPrintSheetType('scholastic')}
                className={`px-2.5 py-1 rounded-md transition ${printSheetType === 'scholastic' ? 'bg-purple-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                17(a)/(d) Marks VI-X
              </button>
              <button
                onClick={() => setPrintSheetType('class_x_17f')}
                className={`px-2.5 py-1 rounded-md transition ${printSheetType === 'class_x_17f' ? 'bg-purple-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                17(f) Class X
              </button>
              <button
                onClick={() => setPrintSheetType('class_xi_17g')}
                className={`px-2.5 py-1 rounded-md transition ${printSheetType === 'class_xi_17g' ? 'bg-purple-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                17(g) Class XI
              </button>
              <button
                onClick={() => setPrintSheetType('class_xii_17h')}
                className={`px-2.5 py-1 rounded-md transition ${printSheetType === 'class_xii_17h' ? 'bg-purple-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                17(h) Class XII
              </button>
              <button
                onClick={() => setPrintSheetType('practical_17i')}
                className={`px-2.5 py-1 rounded-md transition ${printSheetType === 'practical_17i' ? 'bg-purple-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                17(i) Practical
              </button>
              <button
                onClick={() => setPrintSheetType('notebook_17j')}
                className={`px-2.5 py-1 rounded-md transition ${printSheetType === 'notebook_17j' ? 'bg-purple-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                17(j) Notebook
              </button>
              <button
                onClick={() => setPrintSheetType('all')}
                className={`px-2.5 py-1 rounded-md transition ${printSheetType === 'all' ? 'bg-purple-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                All Pages
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={() => setIsPrintMode(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
            >
              <X className="w-4 h-4" />
              Close Preview
            </button>
          </div>
        </div>

        {/* Printable Report Sheet */}
        <div className="max-w-5xl mx-auto border-2 border-slate-900 p-6 space-y-8 print:border-none print:p-0">
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-xl font-black uppercase tracking-wider">KENDRIYA VIDYALAYA SANGATHAN</h1>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mt-0.5">
              TEACHER'S DIARY (MIDDLE & SECONDARY SECTION)
            </h2>
            <p className="text-xs font-medium text-slate-600 mt-1">
              Academic Session: 2025-26 • Subject: Mathematics (041) • Class: X-A
            </p>
          </div>

          {/* ========================================================================= */}
          {/* 17(b) & 17(c) MULTI-DISCIPLINARY & ART INTEGRATED PROJECTS (SCREENSHOT 1)  */}
          {/* ========================================================================= */}
          {(printSheetType === 'all' || printSheetType === 'mdp_aip') && (
            <div className="space-y-6">
              {/* 17(b) Multi-Disciplinary Projects */}
              <div className="space-y-2">
                <div className="text-center">
                  <h3 className="text-sm font-black text-slate-900 tracking-wide">
                    17(b) विद्यार्थियों को निर्दिष्ट की गई बहुविषयी परियोजनाओं का विवरण
                  </h3>
                  <h4 className="text-xs font-bold text-slate-800 mt-0.5">
                    Details of Multi-Disciplinary Projects assigned to Students
                  </h4>
                </div>

                <table className="w-full text-left text-xs border-collapse border-2 border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b-2 border-slate-900 text-center">
                      <th className="border border-slate-800 p-2 w-[12%]">Class</th>
                      <th className="border border-slate-800 p-2 w-[26%]">Topic</th>
                      <th className="border border-slate-800 p-2 w-[34%]">MDP assigned</th>
                      <th className="border border-slate-800 p-2 w-[28%]">Evaluation criteria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMdp.map((proj, idx) => (
                      <tr key={proj.id || idx} className="border-b border-slate-800 align-top">
                        <td className="border border-slate-800 p-2 text-center font-bold">
                          Class {proj.className}-{proj.section}
                        </td>
                        <td className="border border-slate-800 p-2 font-medium">
                          {proj.topic || proj.theme || proj.title}
                        </td>
                        <td className="border border-slate-800 p-2 text-[11px] leading-relaxed">
                          {proj.mdpAssigned || proj.title || proj.theme}
                        </td>
                        <td className="border border-slate-800 p-2 text-[11px] text-slate-700 leading-relaxed">
                          {proj.evaluationCriteria || '1. Content & Concept Clarity (5M), 2. Interdisciplinary Linkage (5M), 3. Research & Originality (5M), 4. Presentation & Viva (5M)'}
                        </td>
                      </tr>
                    ))}
                    {/* Pad empty lines if fewer than 5 */}
                    {Array.from({ length: Math.max(0, 5 - filteredMdp.length) }).map((_, idx) => (
                      <tr key={`blank-mdp-${idx}`} className="border-b border-slate-800 h-8">
                        <td className="border border-slate-800 p-2"></td>
                        <td className="border border-slate-800 p-2"></td>
                        <td className="border border-slate-800 p-2"></td>
                        <td className="border border-slate-800 p-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 17(c) Art Integrated Projects */}
              <div className="space-y-2 pt-4">
                <div className="text-center">
                  <h3 className="text-sm font-black text-slate-900 tracking-wide">
                    17 (c) विद्यार्थियों को निर्दिष्ट की गई कला एकीकृत परियोजनाओं का विवरण
                  </h3>
                  <h4 className="text-xs font-bold text-slate-800 mt-0.5">
                    Details of Art Integrated Projects assigned to Students
                  </h4>
                </div>

                <table className="w-full text-left text-xs border-collapse border-2 border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b-2 border-slate-900 text-center">
                      <th className="border border-slate-800 p-2 w-[12%]">Class</th>
                      <th className="border border-slate-800 p-2 w-[26%]">Topic</th>
                      <th className="border border-slate-800 p-2 w-[34%]">AIP assigned</th>
                      <th className="border border-slate-800 p-2 w-[28%]">Evaluation criteria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAip.map((proj, idx) => (
                      <tr key={proj.id || idx} className="border-b border-slate-800 align-top">
                        <td className="border border-slate-800 p-2 text-center font-bold">
                          Class {proj.className}-{proj.section}
                        </td>
                        <td className="border border-slate-800 p-2 font-medium">
                          {proj.topic || proj.theme || proj.title}
                        </td>
                        <td className="border border-slate-800 p-2 text-[11px] leading-relaxed">
                          {proj.aipAssigned || proj.title || proj.theme}
                        </td>
                        <td className="border border-slate-800 p-2 text-[11px] text-slate-700 leading-relaxed">
                          {proj.evaluationCriteria || '1. Mathematical Rigor (5M), 2. Art Integration & Craftsmanship (5M), 3. Research & Originality (5M), 4. Presentation & Viva (5M)'}
                        </td>
                      </tr>
                    ))}
                    {/* Pad empty lines if fewer than 5 */}
                    {Array.from({ length: Math.max(0, 5 - filteredAip.length) }).map((_, idx) => (
                      <tr key={`blank-aip-${idx}`} className="border-b border-slate-800 h-8">
                        <td className="border border-slate-800 p-2"></td>
                        <td className="border border-slate-800 p-2"></td>
                        <td className="border border-slate-800 p-2"></td>
                        <td className="border border-slate-800 p-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signature Footer */}
              <div className="border-t-2 border-slate-900 pt-6 mt-6 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-900">
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Subject Teacher</span>
                </div>
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Academic In-Charge</span>
                </div>
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Principal</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 17(e) LIST OF SUBJECT/CONTENT ENRICHMENT ACTIVITIES (SCREENSHOT 2)        */}
          {/* ========================================================================= */}
          {(printSheetType === 'all' || printSheetType === 'sea') && (
            <div className="space-y-4 page-break-before-always">
              <div className="text-center font-bold border-b-2 border-slate-900 pb-2">
                <h3 className="text-base font-black text-slate-900 tracking-wide uppercase">
                  17(e) विषय संवर्धन गतिविधियों की सूची
                </h3>
                <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase mt-0.5">
                  LIST OF SUBJECT/CONTENT ENRICHMENT ACTIVITIES
                </h4>
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-slate-800 px-1">
                <span>Subject: Mathematics (041)</span>
                <span>Class & Section: Class {classFilter === 'All' ? 'X - A' : classFilter}...................</span>
              </div>

              <table className="w-full text-left text-xs border-collapse border-2 border-slate-900">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b-2 border-slate-900 text-center">
                    <th className="border border-slate-800 p-2 w-[8%]">Sl. No.</th>
                    <th className="border border-slate-800 p-2 w-[16%]">Month& Date</th>
                    <th className="border border-slate-800 p-2 w-[34%]">Activity</th>
                    <th className="border border-slate-800 p-2 w-[26%]">Evaluation Criteria</th>
                    <th className="border border-slate-800 p-2 w-[16%]">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSea.map((item, idx) => (
                    <tr key={item.id || idx} className="border-b border-slate-800 align-top">
                      <td className="border border-slate-800 p-2 text-center font-bold">
                        {item.slNo || idx + 1}
                      </td>
                      <td className="border border-slate-800 p-2 text-center font-medium">
                        {item.monthAndDate}
                      </td>
                      <td className="border border-slate-800 p-2 font-medium text-[11px] leading-relaxed">
                        {item.activity}
                      </td>
                      <td className="border border-slate-800 p-2 text-[11px] text-slate-700 leading-relaxed">
                        {item.evaluationCriteria}
                      </td>
                      <td className="border border-slate-800 p-2 text-[11px] text-slate-600">
                        {item.remarks || 'Standard KVS Rubric'}
                      </td>
                    </tr>
                  ))}
                  {/* Pad empty lines up to 12 rows for authentic diary page layout */}
                  {Array.from({ length: Math.max(0, 12 - filteredSea.length) }).map((_, idx) => (
                    <tr key={`blank-sea-${idx}`} className="border-b border-slate-800 h-8">
                      <td className="border border-slate-800 p-2 text-center font-semibold text-slate-400">
                        {filteredSea.length + idx + 1}
                      </td>
                      <td className="border border-slate-800 p-2"></td>
                      <td className="border border-slate-800 p-2"></td>
                      <td className="border border-slate-800 p-2"></td>
                      <td className="border border-slate-800 p-2"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signature Footer */}
              <div className="border-t-2 border-slate-900 pt-6 mt-8 flex justify-between text-xs font-bold text-slate-900 px-6">
                <div className="pt-8 border-t border-slate-400 min-w-[200px] text-center">
                  <span>Signature of Subject Teacher</span>
                </div>
                <div className="pt-8 border-t border-slate-400 min-w-[200px] text-center">
                  <span>Signature of Principal</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 17(a) & 17(d) SCHOLASTIC MARKS REGISTER                                   */}
          {/* ========================================================================= */}
          {(printSheetType === 'all' || printSheetType === 'scholastic') && (
            <div className="space-y-3 page-break-before-always">
              <h3 className="text-sm font-bold uppercase tracking-wider bg-slate-200 p-2 border border-slate-900 text-center">
                17(a) & 17(d). Scholastic Assessment Marks Register
              </h3>

              {scholasticStage === 'vi_viii' ? (
                <table className="w-full text-left text-xs border-collapse border border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="border border-slate-800 p-1.5 text-center">Roll</th>
                      <th className="border border-slate-800 p-1.5">Student Name</th>
                      <th className="border border-slate-800 p-1.5 text-center">PT-1 (10)</th>
                      <th className="border border-slate-800 p-1.5 text-center">PT-2 (10)</th>
                      <th className="border border-slate-800 p-1.5 text-center">NB (5)</th>
                      <th className="border border-slate-800 p-1.5 text-center">SEA (5)</th>
                      <th className="border border-slate-800 p-1.5 text-center">MDP (5)</th>
                      <th className="border border-slate-800 p-1.5 text-center">LD (5)</th>
                      <th className="border border-slate-800 p-1.5 text-center">HY (80)</th>
                      <th className="border border-slate-800 p-1.5 text-center">Total (100)</th>
                      <th className="border border-slate-800 p-1.5 text-center">Grade</th>
                      <th className="border border-slate-800 p-1.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScoresVI_VIII.map(r => (
                      <tr key={r.id} className="border-b border-slate-800">
                        <td className="border border-slate-800 p-1.5 text-center font-bold">{r.rollNo}</td>
                        <td className="border border-slate-800 p-1.5 font-medium">{r.studentName}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.pt1 ?? '-'}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.pt2 ?? '-'}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.notebook ?? '-'}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.subjectEnrichment ?? '-'}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.mdp ?? '-'}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.learnersDiary ?? '-'}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.halfYearly ?? '-'}</td>
                        <td className="border border-slate-800 p-1.5 text-center font-bold">{r.totalMarks}</td>
                        <td className="border border-slate-800 p-1.5 text-center font-bold">{r.grade}</td>
                        <td className="border border-slate-800 p-1.5 text-[11px]">{r.remarks || 'Satisfactory'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-xs border-collapse border border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="border border-slate-800 p-1.5 text-center">Roll</th>
                      <th className="border border-slate-800 p-1.5">Student Name</th>
                      <th className="border border-slate-800 p-1.5 text-center">PT Avg (5)</th>
                      <th className="border border-slate-800 p-1.5 text-center">MA (5)</th>
                      <th className="border border-slate-800 p-1.5 text-center">Port (5)</th>
                      <th className="border border-slate-800 p-1.5 text-center">SEA (5)</th>
                      <th className="border border-slate-800 p-1.5 text-center">Int Total (20)</th>
                      <th className="border border-slate-800 p-1.5 text-center">Board/SEE (80)</th>
                      <th className="border border-slate-800 p-1.5 text-center">Grand Total (100)</th>
                      <th className="border border-slate-800 p-1.5 text-center">Grade</th>
                      <th className="border border-slate-800 p-1.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScoresIX_X.map(r => (
                      <tr key={r.id} className="border-b border-slate-800">
                        <td className="border border-slate-800 p-1.5 text-center font-bold">{r.rollNo}</td>
                        <td className="border border-slate-800 p-1.5 font-medium">{r.studentName}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.ptAvg ?? '-'}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.multipleAssessment ?? '-'}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.portfolio ?? '-'}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.subjectEnrichment ?? '-'}</td>
                        <td className="border border-slate-800 p-1.5 text-center font-bold">{r.internalTotal}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.boardOrSeeExam ?? '-'}</td>
                        <td className="border border-slate-800 p-1.5 text-center font-bold">{r.grandTotal}</td>
                        <td className="border border-slate-800 p-1.5 text-center font-bold">{r.grade}</td>
                        <td className="border border-slate-800 p-1.5 text-[11px]">{r.remarks || 'Satisfactory'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Signatures for Marks register */}
              <div className="border-t-2 border-slate-900 pt-8 mt-12 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-900">
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Subject Teacher</span>
                </div>
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Academic In-Charge</span>
                </div>
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Principal</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 17(f) कक्षा 10 के अंकों का ब्यौरा (RECORD OF MARKS FOR CLASS - X) - 4 pages */}
          {/* ========================================================================= */}
          {(printSheetType === 'all' || printSheetType === 'class_x_17f') && (
            <div className="space-y-3 page-break-before-always">
              <div className="text-center border-b-2 border-slate-900 pb-2">
                <div className="text-sm font-bold tracking-wider">17(f) कक्षा 10 के अंकों का ब्यौरा 4 pages</div>
                <div className="text-base font-extrabold tracking-wide uppercase">RECORD OF MARKS FOR CLASS - X</div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold px-2 py-1 bg-slate-100 border border-slate-900">
                <div>CLASS: <span className="font-semibold">{classFilter !== 'All' ? classFilter : 'X'}</span></div>
                <div>SEC: <span className="font-semibold">{sectionFilter !== 'All' ? sectionFilter : 'A'}</span></div>
                <div>SUBJECT: <span className="font-semibold">{subjectFilter !== 'All' ? subjectFilter : 'Mathematics (041)'}</span></div>
                <div>ACADEMIC YEAR: <span className="font-semibold">2025-2026</span></div>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-200 font-bold text-center">
                    <th rowSpan={2} className="border border-slate-800 p-1 w-10">Sl.No.</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 min-w-[140px] text-left">Name of Student</th>
                    <th colSpan={5} className="border border-slate-800 p-1 bg-slate-300">MONTHLY TESTS</th>
                    <th colSpan={2} className="border border-slate-800 p-1 bg-slate-300">PERIODIC TESTS</th>
                    <th rowSpan={2} className="border border-slate-800 p-1 w-10">HY</th>
                    <th rowSpan={2} className="border border-slate-800 p-1 w-10">PB-1</th>
                    <th rowSpan={2} className="border border-slate-800 p-1 w-10">PB-2</th>
                    <th rowSpan={2} className="border border-slate-800 p-1 w-10">PB-3</th>
                    <th rowSpan={2} className="border border-slate-800 p-1 w-12 font-extrabold bg-amber-100">AISSE</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 min-w-[120px]">Signature of Parent</th>
                  </tr>
                  <tr className="bg-slate-100 text-center font-semibold text-[11px]">
                    <th className="border border-slate-800 p-1 w-8">M-1</th>
                    <th className="border border-slate-800 p-1 w-8">M-2</th>
                    <th className="border border-slate-800 p-1 w-8">M-3</th>
                    <th className="border border-slate-800 p-1 w-8">M-4</th>
                    <th className="border border-slate-800 p-1 w-8">M-5</th>
                    <th className="border border-slate-800 p-1 w-9">PT-1</th>
                    <th className="border border-slate-800 p-1 w-9">PT-2</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScoresClassX_17F.map((r, idx) => (
                    <tr key={r.id} className="border-b border-slate-800">
                      <td className="border border-slate-800 p-1.5 text-center font-bold">{r.rollNo || idx + 1}</td>
                      <td className="border border-slate-800 p-1.5 font-medium">{r.studentName}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.m1 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.m2 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.m3 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.m4 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.m5 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.pt1 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.pt2 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.hy ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.pb1 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.pb2 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.pb3 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center font-bold bg-amber-50">{r.aisse ?? '-'}</td>
                      <td className="border border-slate-800 p-1.5 text-[11px] italic text-slate-700">{r.parentSignature || 'Signed'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Signatures */}
              <div className="border-t-2 border-slate-900 pt-8 mt-12 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-900">
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Subject Teacher</span>
                </div>
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Class Teacher</span>
                </div>
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Principal</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 17(g) मूल्यांकन संरचना कक्षा-11 (ASSESSMENT STRUCTURE FOR CLASS- XI) 6p   */}
          {/* ========================================================================= */}
          {(printSheetType === 'all' || printSheetType === 'class_xi_17g') && (
            <div className="space-y-3 page-break-before-always">
              <div className="text-center border-b-2 border-slate-900 pb-2">
                <div className="text-sm font-bold tracking-wider">17(g) मूल्यांकन संरचना कक्षा-11 6 pages</div>
                <div className="text-base font-extrabold tracking-wide uppercase">ASSESSMENT STRUCTURE FOR CLASS- XI</div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold px-2 py-1 bg-slate-100 border border-slate-900">
                <div>CLASS: <span className="font-semibold">{classFilter !== 'All' ? classFilter : 'XI'}</span></div>
                <div>SEC: <span className="font-semibold">{sectionFilter !== 'All' ? sectionFilter : 'A'}</span></div>
                <div>SUBJECT: <span className="font-semibold">{subjectFilter !== 'All' ? subjectFilter : 'Mathematics (041)'}</span></div>
                <div>ACADEMIC YEAR: <span className="font-semibold">2025-2026</span></div>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-200 font-bold text-center">
                    <th rowSpan={2} className="border border-slate-800 p-1 w-10">S.No</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 min-w-[160px] text-left">Name of the Student</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-24">Periodic Test 1</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-28">Half Yearly Exam</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-24">Periodic Test 2</th>
                    <th colSpan={2} className="border border-slate-800 p-1 bg-slate-300">Session Ending Exam</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 min-w-[150px]">Remark</th>
                  </tr>
                  <tr className="bg-slate-100 text-center font-semibold text-[11px]">
                    <th className="border border-slate-800 p-1 w-24">Theory Exam</th>
                    <th className="border border-slate-800 p-1 w-32">Practical/Project/ASL</th>
                  </tr>
                  <tr className="bg-slate-50 text-center font-medium text-[10px] italic text-slate-700">
                    <td className="border border-slate-800 p-0.5"></td>
                    <td className="border border-slate-800 p-0.5 font-bold text-left pl-2">Max marks</td>
                    <td className="border border-slate-800 p-0.5 font-bold">40</td>
                    <td className="border border-slate-800 p-0.5 font-bold">70/80</td>
                    <td className="border border-slate-800 p-0.5 font-bold">40</td>
                    <td className="border border-slate-800 p-0.5 font-bold">70/80</td>
                    <td className="border border-slate-800 p-0.5 font-bold">30/20</td>
                    <td className="border border-slate-800 p-0.5"></td>
                  </tr>
                </thead>
                <tbody>
                  {filteredScoresClassXI_17G.map((r, idx) => (
                    <tr key={r.id} className="border-b border-slate-800">
                      <td className="border border-slate-800 p-1.5 text-center font-bold">{r.rollNo || idx + 1}</td>
                      <td className="border border-slate-800 p-1.5 font-medium">{r.studentName}</td>
                      <td className="border border-slate-800 p-1.5 text-center">{r.pt1 ?? '-'}</td>
                      <td className="border border-slate-800 p-1.5 text-center">{r.halfYearly ?? '-'}</td>
                      <td className="border border-slate-800 p-1.5 text-center">{r.pt2 ?? '-'}</td>
                      <td className="border border-slate-800 p-1.5 text-center">{r.seeTheory ?? '-'}</td>
                      <td className="border border-slate-800 p-1.5 text-center">{r.seePractical ?? '-'}</td>
                      <td className="border border-slate-800 p-1.5 text-[11px]">{r.remarks || 'Satisfactory'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Signatures */}
              <div className="border-t-2 border-slate-900 pt-8 mt-12 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-900">
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Subject Teacher</span>
                </div>
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Class Teacher</span>
                </div>
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Principal</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 17(h) कक्षा-12 के अंकों का ब्यौरा (RECORD OF MARKS FOR CLASS- XII) 6p       */}
          {/* ========================================================================= */}
          {(printSheetType === 'all' || printSheetType === 'class_xii_17h') && (
            <div className="space-y-3 page-break-before-always">
              <div className="text-center border-b-2 border-slate-900 pb-2">
                <div className="text-sm font-bold tracking-wider">17(h) कक्षा-12 के अंकों का ब्यौरा 6 pages</div>
                <div className="text-base font-extrabold tracking-wide uppercase">RECORD OF MARKS FOR CLASS- XII</div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold px-2 py-1 bg-slate-100 border border-slate-900">
                <div>CLASS: <span className="font-semibold">{classFilter !== 'All' ? classFilter : 'XII'}</span></div>
                <div>SEC: <span className="font-semibold">{sectionFilter !== 'All' ? sectionFilter : 'A'}</span></div>
                <div>SUBJECT: <span className="font-semibold">{subjectFilter !== 'All' ? subjectFilter : 'Mathematics (041)'}</span></div>
                <div>ACADEMIC YEAR: <span className="font-semibold">2025-2026</span></div>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-200 font-bold text-center">
                    <th rowSpan={2} className="border border-slate-800 p-1 w-10">Sl.No.</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 min-w-[140px] text-left">Name of Student</th>
                    <th colSpan={5} className="border border-slate-800 p-1 bg-slate-300">MONTHLY TESTS</th>
                    <th colSpan={2} className="border border-slate-800 p-1 bg-slate-300">PERIODIC TESTS</th>
                    <th rowSpan={2} className="border border-slate-800 p-1 w-10">HY</th>
                    <th rowSpan={2} className="border border-slate-800 p-1 w-10">PB-1</th>
                    <th rowSpan={2} className="border border-slate-800 p-1 w-10">PB-2</th>
                    <th rowSpan={2} className="border border-slate-800 p-1 w-10">PB-3</th>
                    <th rowSpan={2} className="border border-slate-800 p-1 w-12 font-extrabold bg-amber-100">AISSCE</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 min-w-[120px]">Signature of Parent</th>
                  </tr>
                  <tr className="bg-slate-100 text-center font-semibold text-[11px]">
                    <th className="border border-slate-800 p-1 w-8">M-1</th>
                    <th className="border border-slate-800 p-1 w-8">M-2</th>
                    <th className="border border-slate-800 p-1 w-8">M-3</th>
                    <th className="border border-slate-800 p-1 w-8">M-4</th>
                    <th className="border border-slate-800 p-1 w-8">M-5</th>
                    <th className="border border-slate-800 p-1 w-9">PT-1</th>
                    <th className="border border-slate-800 p-1 w-9">PT-2</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScoresClassXII_17H.map((r, idx) => (
                    <tr key={r.id} className="border-b border-slate-800">
                      <td className="border border-slate-800 p-1.5 text-center font-bold">{r.rollNo || idx + 1}</td>
                      <td className="border border-slate-800 p-1.5 font-medium">{r.studentName}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.m1 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.m2 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.m3 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.m4 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.m5 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.pt1 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.pt2 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.hy ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.pb1 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.pb2 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center">{r.pb3 ?? '-'}</td>
                      <td className="border border-slate-800 p-1 text-center font-bold bg-amber-50">{r.aissce ?? '-'}</td>
                      <td className="border border-slate-800 p-1.5 text-[11px] italic text-slate-700">{r.parentSignature || 'Signed'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Signatures */}
              <div className="border-t-2 border-slate-900 pt-8 mt-12 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-900">
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Subject Teacher</span>
                </div>
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Class Teacher</span>
                </div>
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Principal</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PRINT SHEET 8: 17(i) Practical Attendance (प्रयोगात्मक कक्षाओं में उपस्थिति) 6 pages */}
          {/* ========================================================================= */}
          {(printSheetType === 'practical_17i' || printSheetType === 'all') && (
            <div className="space-y-4 pt-6 border-t-4 border-slate-900 page-break">
              <div className="text-center pb-2">
                <div className="text-xs font-semibold text-rose-600 tracking-wide mb-0.5">
                  (In landscape with proper column width)
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-base font-bold tracking-wider text-slate-900">
                    17(i) प्रयोगात्मक कक्षाओं / गतिविधियों में छात्रों की उपस्थिति का ब्यौरा
                  </span>
                  <span className="text-xs font-bold text-rose-600">6 pages</span>
                </div>
                <div className="text-base font-extrabold tracking-wide uppercase mt-0.5 text-slate-900">
                  RECORD OF ATTENDANCE OF STUDENT IN PRACTICAL CLASSES /ACTIVITIES
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold px-3 py-1.5 border-b border-slate-800">
                <div className="flex items-center gap-1">
                  Class: <span className="font-mono underline decoration-dotted underline-offset-4 ml-1">{classFilter !== 'All' ? classFilter : '.........'}</span>
                </div>
                <div className="flex items-center gap-1">
                  Sec: <span className="font-mono underline decoration-dotted underline-offset-4 ml-1">{sectionFilter !== 'All' ? sectionFilter : '.......'}</span>
                </div>
                <div className="flex items-center gap-1">
                  Subject: <span className="font-mono underline decoration-dotted underline-offset-4 ml-1">{subjectFilter !== 'All' ? subjectFilter : '.............'}</span>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-900">
                <thead>
                  {/* Tier 1 Header */}
                  <tr className="bg-slate-100 font-bold text-center">
                    <th rowSpan={3} className="border border-slate-800 p-1 w-10 text-center font-bold">S.No.</th>
                    <th className="border border-slate-800 p-1.5 min-w-[150px] text-left font-bold bg-slate-200">
                      Date
                    </th>
                    {practicalDates17i.slice(0, 20).map((d, dIdx) => (
                      <th key={`pr-date-${dIdx}`} className="border border-slate-800 p-0.5 w-6 text-center font-mono text-[10px]">
                        {d || ''}
                      </th>
                    ))}
                  </tr>
                  {/* Tier 2 Header */}
                  <tr className="bg-slate-50 font-bold text-center">
                    <th className="border border-slate-800 p-1 text-left font-bold bg-slate-100 text-[11px]">
                      Name of Practical/Activity
                    </th>
                    {practicalTitles17i.slice(0, 20).map((t, tIdx) => (
                      <th key={`pr-title-${tIdx}`} className="border border-slate-800 p-0.5 w-6 text-center font-mono text-[9px] truncate max-w-[42px]" title={t}>
                        {t ? (t.length > 8 ? t.substring(0, 8) + '..' : t) : `A${tIdx + 1}`}
                      </th>
                    ))}
                  </tr>
                  {/* Tier 3 Header */}
                  <tr className="bg-slate-200 font-bold text-center">
                    <th className="border border-slate-800 p-1 text-left font-extrabold text-[11px]">
                      Name of the Student
                    </th>
                    <th colSpan={20} className="border border-slate-800 p-1 bg-slate-300 text-center font-extrabold uppercase tracking-wider text-[11px]">
                      Signature/Attendance of Student
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPractical17iRecords.map((r, idx) => (
                    <tr key={r.id} className="border-b border-slate-800">
                      <td className="border border-slate-800 p-1 text-center font-bold">{r.rollNo || idx + 1}</td>
                      <td className="border border-slate-800 p-1.5 font-medium whitespace-nowrap">{r.studentName}</td>
                      {Array.from({ length: 20 }).map((_, cIdx) => {
                        const val = r.attendance[String(cIdx)] || '';
                        return (
                          <td key={cIdx} className="border border-slate-800 p-0.5 text-center font-bold text-[11px]">
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Empty rows to fill standard printed diary layout if fewer than 15 rows */}
                  {Array.from({ length: Math.max(0, 15 - filteredPractical17iRecords.length) }).map((_, padIdx) => (
                    <tr key={`pad-pract-${padIdx}`} className="border-b border-slate-800 h-7">
                      <td className="border border-slate-800 p-1 text-center font-bold text-slate-400">{filteredPractical17iRecords.length + padIdx + 1}</td>
                      <td className="border border-slate-800 p-1.5"></td>
                      {Array.from({ length: 20 }).map((_, cIdx) => (
                        <td key={cIdx} className="border border-slate-800 p-0.5"></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Signatures */}
              <div className="border-t-2 border-slate-900 pt-8 mt-10 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-900">
                <div className="pt-6 border-t border-slate-400">
                  <span>Signature of Subject Teacher</span>
                </div>
                <div className="pt-6 border-t border-slate-400">
                  <span>Signature of Lab Assistant / In-Charge</span>
                </div>
                <div className="pt-6 border-t border-slate-400">
                  <span>Signature of Principal</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PRINT SHEET 9: 17(j) Notebook Submission Record (कक्षा कार्य/गृह कार्य नोट बुक का रिकॉर्ड) */}
          {/* ========================================================================= */}
          {(printSheetType === 'notebook_17j' || printSheetType === 'all') && (
            <div className="space-y-4 pt-6 border-t-4 border-slate-900 page-break">
              <div className="text-center pb-2">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-base font-bold tracking-wider">
                    17(j) कक्षा कार्य/गृह कार्य नोट बुक का रिकॉर्ड
                  </span>
                  <span className="text-xs font-bold text-red-600">6 pages</span>
                </div>
                <div className="text-base font-extrabold tracking-wide uppercase mt-0.5">
                  RECORD OF CLASS WORK/HOME WORK NOTE BOOK SUBMISSION
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold px-3 py-1.5 border-b border-slate-800">
                <div className="flex items-center gap-1">
                  CLASS: <span className="font-mono underline decoration-dotted underline-offset-4 ml-1">{classFilter !== 'All' ? classFilter : '.........'}</span>
                </div>
                <div className="flex items-center gap-1">
                  SEC: <span className="font-mono underline decoration-dotted underline-offset-4 ml-1">{sectionFilter !== 'All' ? sectionFilter : '.......'}</span>
                </div>
                <div className="flex items-center gap-1">
                  SUBJECT: <span className="font-mono underline decoration-dotted underline-offset-4 ml-1">{subjectFilter !== 'All' ? subjectFilter : '.............'}</span>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-900">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th rowSpan={2} className="border border-slate-800 p-1 w-10">S.No.</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 min-w-[140px] text-left">Name of Student</th>
                    <th colSpan={20} className="border border-slate-800 p-1 bg-slate-200 uppercase font-extrabold tracking-wider">Date of Submission</th>
                  </tr>
                  <tr className="bg-slate-50 text-center font-semibold text-[10px]">
                    {notebookDates.slice(0, 20).map((d, dIdx) => (
                      <th key={dIdx} className="border border-slate-800 p-0.5 w-6 text-center font-mono">
                        {d || ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredNotebookRecords.map((r, idx) => (
                    <tr key={r.id} className="border-b border-slate-800">
                      <td className="border border-slate-800 p-1 text-center font-bold">{r.rollNo || idx + 1}</td>
                      <td className="border border-slate-800 p-1.5 font-medium whitespace-nowrap">{r.studentName}</td>
                      {Array.from({ length: 20 }).map((_, cIdx) => {
                        const val = r.submissions[String(cIdx)] || '';
                        return (
                          <td key={cIdx} className="border border-slate-800 p-0.5 text-center font-bold text-[11px]">
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Empty rows to fill standard printed diary layout if fewer than 15 rows */}
                  {Array.from({ length: Math.max(0, 15 - filteredNotebookRecords.length) }).map((_, padIdx) => (
                    <tr key={`pad-${padIdx}`} className="border-b border-slate-800 h-7">
                      <td className="border border-slate-800 p-1 text-center font-bold text-slate-400">{filteredNotebookRecords.length + padIdx + 1}</td>
                      <td className="border border-slate-800 p-1.5"></td>
                      {Array.from({ length: 20 }).map((_, cIdx) => (
                        <td key={cIdx} className="border border-slate-800 p-0.5"></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Signatures */}
              <div className="border-t-2 border-slate-900 pt-8 mt-10 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-900">
                <div className="pt-6 border-t border-slate-400">
                  <span>Signature of Subject Teacher</span>
                </div>
                <div className="pt-6 border-t border-slate-400">
                  <span>Signature of Class Teacher</span>
                </div>
                <div className="pt-6 border-t border-slate-400">
                  <span>Signature of Principal</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // Main Interactive Portal UI
  // ==========================================
  return (
    <div className="space-y-6 animate-fadeIn">
      {devMode && (
        <DevModeBadge
          pages={[22, 23, 24, 25, 26, 29, 30, 34, 35, 36, 37]}
          title="Digitizes Template Pages 22-37: Middle & Secondary Scholastic Assessment, MDP/AIP, SEA, Practicals, Remedial & Exemplary Suite"
          fieldCount={scoresVI_VIII.length + scoresIX_X.length + formativeRecords.length + mdpAipProjects.length}
        />
      )}

      {notification && (
        <div className="p-3 bg-purple-950/80 border border-purple-500/40 text-purple-200 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            {notification}
          </span>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4 text-purple-300" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              17-21. Progress & Assessment Suite (Middle & Secondary Stage)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              KVS Template Pages 22-37
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete management of Scholastic Marks Registers (VI-VIII & IX-X), Formative Lesson Progress, MDP & Art Integrated Projects, Practicals, Remedial Records & Talent Tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPrintMode(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-purple-300" />
            <span>Print Register Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('scholastic_marks')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'scholastic_marks'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>17 Scholastic Marks Registers</span>
        </button>

        <button
          onClick={() => setActiveSubTab('result_analysis_18a')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'result_analysis_18a'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span>18(a) Result Analysis (VI-X)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('result_analysis_18b')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'result_analysis_18b'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span>18(b) Result Analysis (XI-XII)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('student_observations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'student_observations'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>19. Student Observations</span>
        </button>

        <button
          onClick={() => setActiveSubTab('remedial_20a')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'remedial_20a'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Target className="w-4 h-4 text-rose-400" />
          <span>20(a) Remedial Plan</span>
        </button>

        <button
          onClick={() => setActiveSubTab('remedial_20b')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'remedial_20b'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>20(b) Remedial Details</span>
        </button>

        <button
          onClick={() => setActiveSubTab('remedial_20c')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'remedial_20c'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>20(c) Performance Tracking</span>
        </button>

        <button
          onClick={() => setActiveSubTab('formative_log')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'formative_log'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Formative & Lesson Progress</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mdp_aip')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'mdp_aip'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>17(b) & (c) MDP / AIP Projects</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sea_activities')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'sea_activities'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>17(e) Subject Enrichment (SEA)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('practical_attendance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'practical_attendance'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>17(i) Practical Attendance</span>
        </button>

        <button
          onClick={() => setActiveSubTab('notebook_submission')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
            activeSubTab === 'notebook_submission'
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-950/40 ring-1 ring-pink-400/40 font-bold'
              : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <BookOpen className={`w-4 h-4 ${activeSubTab === 'notebook_submission' ? 'text-pink-200' : 'text-pink-400'}`} />
          <span className="tracking-tight">17 (j) Notebook Submission</span>
        </button>

        <button
          onClick={() => setActiveSubTab('remedial_teaching')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'remedial_teaching'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>20(a)-(c) Remedial Teaching</span>
        </button>

        <button
          onClick={() => setActiveSubTab('exemplary_children')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'exemplary_children'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>21. Exemplary Children</span>
        </button>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student, topic, remark..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="All">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.className}>Class {c.className}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="All">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.subjectName}>{s.subjectName}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="All">All Months</option>
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB: 18(a) RESULT ANALYSIS (CLASSES VI TO X)                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'result_analysis_18a' && (
        <ResultAnalysisVItoX devMode={devMode} />
      )}

      {/* ========================================================================= */}
      {/* SUBTAB: 18(b) RESULT ANALYSIS (CLASSES XI & XII)                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'result_analysis_18b' && (
        <ResultAnalysisXItoXII devMode={devMode} />
      )}

      {/* ========================================================================= */}
      {/* SUBTAB: 19. STUDENT BEHAVIOUR OBSERVATIONS                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'student_observations' && (
        <StudentBehaviourObservationManager devMode={devMode} />
      )}

      {/* ========================================================================= */}
      {/* SUBTAB: 20(a) REMEDIAL ASSISTANCE PLAN                                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'remedial_20a' && (
        <RemedialAssistancePlan20a devMode={devMode} />
      )}

      {/* ========================================================================= */}
      {/* SUBTAB: 20(b) DETAILS OF REMEDIAL TEACHING                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'remedial_20b' && (
        <RemedialTeachingDetails20b devMode={devMode} />
      )}

      {/* ========================================================================= */}
      {/* SUBTAB: 20(c) PERFORMANCE TRACKING POST-REMEDIATION                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'remedial_20c' && (
        <RemedialPerformanceTracking20c devMode={devMode} />
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 1: SCHOLASTIC MARKS REGISTER (VI-VIII, IX-X, 17f, 17g, 17h)       */}
      {/* ========================================================================= */}
      {activeSubTab === 'scholastic_marks' && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Select Stage / Register:</span>
              <div className="flex flex-wrap gap-1 rounded-xl p-1 bg-slate-950 border border-slate-800">
                <button
                  onClick={() => setScholasticStage('vi_viii')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    scholasticStage === 'vi_viii'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  17(a) VI-VIII
                </button>
                <button
                  onClick={() => setScholasticStage('ix_x')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    scholasticStage === 'ix_x'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  17(d) IX-X
                </button>
                <button
                  onClick={() => setScholasticStage('class_x_17f')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    scholasticStage === 'class_x_17f'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  17(f) Class X
                </button>
                <button
                  onClick={() => setScholasticStage('class_xi_17g')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    scholasticStage === 'class_xi_17g'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  17(g) Class XI
                </button>
                <button
                  onClick={() => setScholasticStage('class_xii_17h')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    scholasticStage === 'class_xii_17h'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  17(h) Class XII
                </button>
              </div>
            </div>

            <button
              onClick={handleAddStudentScoreRow}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>
                {scholasticStage === 'class_x_17f'
                  ? 'Add Class X Mark Row'
                  : scholasticStage === 'class_xi_17g'
                  ? 'Add Class XI Mark Row'
                  : scholasticStage === 'class_xii_17h'
                  ? 'Add Class XII Mark Row'
                  : 'Add Student Mark Row'}
              </span>
            </button>
          </div>

          {/* Interactive Editable Table for Classes VI - VIII */}
          {scholasticStage === 'vi_viii' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-md">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-300 font-bold border-b border-slate-800">
                    <th className="p-3 w-12 text-center">Roll</th>
                    <th className="p-3 min-w-[150px]">Student Name</th>
                    <th className="p-2 w-20 text-center">PT-1 (10)</th>
                    <th className="p-2 w-20 text-center">PT-2 (10)</th>
                    <th className="p-2 w-16 text-center">NB (5)</th>
                    <th className="p-2 w-16 text-center">SEA (5)</th>
                    <th className="p-2 w-16 text-center">MDP (5)</th>
                    <th className="p-2 w-16 text-center">LD (5)</th>
                    <th className="p-2 w-20 text-center">HY (80)</th>
                    <th className="p-2 w-20 text-center">Total (100)</th>
                    <th className="p-2 w-16 text-center">Grade</th>
                    <th className="p-3 min-w-[180px]">Teacher Remarks</th>
                    <th className="p-3 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredScoresVI_VIII.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-300">{r.rollNo}</td>
                      <td className="p-3 font-medium text-slate-100">
                        <input
                          type="text"
                          value={r.studentName}
                          onChange={(e) => handleUpdateScoreVI_VIII(r.id, 'studentName', e.target.value)}
                          className="bg-transparent border-0 font-medium text-slate-100 focus:bg-slate-950 focus:ring-1 focus:ring-purple-500 rounded px-1.5 py-0.5 w-full"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          max="10"
                          min="0"
                          value={r.pt1 ?? ''}
                          onChange={(e) => handleUpdateScoreVI_VIII(r.id, 'pt1', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          max="10"
                          min="0"
                          value={r.pt2 ?? ''}
                          onChange={(e) => handleUpdateScoreVI_VIII(r.id, 'pt2', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          max="5"
                          min="0"
                          value={r.notebook ?? ''}
                          onChange={(e) => handleUpdateScoreVI_VIII(r.id, 'notebook', parseFloat(e.target.value) || 0)}
                          className="w-14 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          max="5"
                          min="0"
                          value={r.subjectEnrichment ?? ''}
                          onChange={(e) => handleUpdateScoreVI_VIII(r.id, 'subjectEnrichment', parseFloat(e.target.value) || 0)}
                          className="w-14 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          max="5"
                          min="0"
                          value={r.mdp ?? ''}
                          onChange={(e) => handleUpdateScoreVI_VIII(r.id, 'mdp', parseFloat(e.target.value) || 0)}
                          className="w-14 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          max="5"
                          min="0"
                          value={r.learnersDiary ?? ''}
                          onChange={(e) => handleUpdateScoreVI_VIII(r.id, 'learnersDiary', parseFloat(e.target.value) || 0)}
                          className="w-14 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          max="80"
                          min="0"
                          value={r.halfYearly ?? ''}
                          onChange={(e) => handleUpdateScoreVI_VIII(r.id, 'halfYearly', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-2 text-center font-bold text-amber-300">
                        {r.totalMarks}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${getGradeBadgeColor(r.grade)}`}>
                          {r.grade}
                        </span>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={r.remarks || ''}
                          onChange={(e) => handleUpdateScoreVI_VIII(r.id, 'remarks', e.target.value)}
                          placeholder="Feedback..."
                          className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${r.studentName}?`)) {
                              const updated = scoresVI_VIII.filter(x => x.id !== r.id);
                              setScoresVI_VIII(updated);
                              db.set('setup:scholastic_scores_vi_viii', updated);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Interactive Editable Table for Classes IX & X */}
          {scholasticStage === 'ix_x' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-md">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-300 font-bold border-b border-slate-800">
                    <th className="p-3 w-12 text-center">Roll</th>
                    <th className="p-3 min-w-[150px]">Student Name</th>
                    <th className="p-2 w-20 text-center">PT Avg (5)</th>
                    <th className="p-2 w-20 text-center">MA (5)</th>
                    <th className="p-2 w-20 text-center">Port (5)</th>
                    <th className="p-2 w-20 text-center">SEA (5)</th>
                    <th className="p-2 w-24 text-center">Internal (20)</th>
                    <th className="p-2 w-24 text-center">Board/SEE (80)</th>
                    <th className="p-2 w-24 text-center">Grand Total (100)</th>
                    <th className="p-2 w-16 text-center">Grade</th>
                    <th className="p-3 min-w-[180px]">Teacher Remarks</th>
                    <th className="p-3 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredScoresIX_X.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-300">{r.rollNo}</td>
                      <td className="p-3 font-medium text-slate-100">
                        <input
                          type="text"
                          value={r.studentName}
                          onChange={(e) => handleUpdateScoreIX_X(r.id, 'studentName', e.target.value)}
                          className="bg-transparent border-0 font-medium text-slate-100 focus:bg-slate-950 focus:ring-1 focus:ring-purple-500 rounded px-1.5 py-0.5 w-full"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.1"
                          max="5"
                          min="0"
                          value={r.ptAvg ?? ''}
                          onChange={(e) => handleUpdateScoreIX_X(r.id, 'ptAvg', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.1"
                          max="5"
                          min="0"
                          value={r.multipleAssessment ?? ''}
                          onChange={(e) => handleUpdateScoreIX_X(r.id, 'multipleAssessment', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.1"
                          max="5"
                          min="0"
                          value={r.portfolio ?? ''}
                          onChange={(e) => handleUpdateScoreIX_X(r.id, 'portfolio', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.1"
                          max="5"
                          min="0"
                          value={r.subjectEnrichment ?? ''}
                          onChange={(e) => handleUpdateScoreIX_X(r.id, 'subjectEnrichment', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-2 text-center font-bold text-teal-300">
                        {r.internalTotal} / 20
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          max="80"
                          min="0"
                          value={r.boardOrSeeExam ?? ''}
                          onChange={(e) => handleUpdateScoreIX_X(r.id, 'boardOrSeeExam', parseFloat(e.target.value) || 0)}
                          className="w-18 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-2 text-center font-bold text-amber-300">
                        {r.grandTotal}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${getGradeBadgeColor(r.grade)}`}>
                          {r.grade}
                        </span>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={r.remarks || ''}
                          onChange={(e) => handleUpdateScoreIX_X(r.id, 'remarks', e.target.value)}
                          placeholder="Feedback..."
                          className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${r.studentName}?`)) {
                              const updated = scoresIX_X.filter(x => x.id !== r.id);
                              setScoresIX_X(updated);
                              db.set('setup:scholastic_scores_ix_x', updated);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Interactive Editable Table for 17(f) Class X (4 pages) */}
          {scholasticStage === 'class_x_17f' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-md">
              <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-purple-300">17(f) कक्षा 10 के अंकों का ब्यौरा (RECORD OF MARKS FOR CLASS - X)</h4>
                  <p className="text-[11px] text-slate-400">Monthly Tests (M1-M5), Periodic Tests (PT1-PT2), Half Yearly (HY), Pre-Boards (PB1-PB3), Board Exam (AISSE) & Parent Signature</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/60 text-purple-200 border border-purple-500/30">
                  4 Pages Equivalent
                </span>
              </div>
              <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-950/90 text-slate-300 font-bold border-b border-slate-800 text-center">
                    <th rowSpan={2} className="p-2 w-10">Sl.</th>
                    <th rowSpan={2} className="p-2 min-w-[140px] text-left">Name of Student</th>
                    <th colSpan={5} className="p-1 bg-slate-800/80 text-purple-300 border-x border-slate-700">MONTHLY TESTS</th>
                    <th colSpan={2} className="p-1 bg-slate-800/60 text-indigo-300 border-r border-slate-700">PERIODIC TESTS</th>
                    <th rowSpan={2} className="p-2 w-14">HY</th>
                    <th rowSpan={2} className="p-2 w-14">PB-1</th>
                    <th rowSpan={2} className="p-2 w-14">PB-2</th>
                    <th rowSpan={2} className="p-2 w-14">PB-3</th>
                    <th rowSpan={2} className="p-2 w-16 text-amber-300 bg-amber-950/30 font-bold">AISSE</th>
                    <th rowSpan={2} className="p-2 min-w-[130px] text-left">Parent Signature</th>
                    <th rowSpan={2} className="p-2 w-10 text-center">Action</th>
                  </tr>
                  <tr className="bg-slate-950 text-slate-400 font-semibold text-[11px] text-center border-b border-slate-800">
                    <th className="p-1 w-12 border-l border-slate-800">M-1</th>
                    <th className="p-1 w-12">M-2</th>
                    <th className="p-1 w-12">M-3</th>
                    <th className="p-1 w-12">M-4</th>
                    <th className="p-1 w-12 border-r border-slate-800">M-5</th>
                    <th className="p-1 w-14">PT-1</th>
                    <th className="p-1 w-14 border-r border-slate-800">PT-2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredScoresClassX_17F.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2 text-center font-bold text-slate-300">{r.rollNo || idx + 1}</td>
                      <td className="p-2 font-medium text-slate-100">
                        <input
                          type="text"
                          value={r.studentName}
                          onChange={(e) => handleUpdateScoreClassX_17F(r.id, 'studentName', e.target.value)}
                          className="bg-transparent border-0 font-medium text-slate-100 focus:bg-slate-950 focus:ring-1 focus:ring-purple-500 rounded px-1.5 py-0.5 w-full"
                        />
                      </td>
                      {/* M1 to M5 */}
                      {(['m1', 'm2', 'm3', 'm4', 'm5'] as const).map((mKey) => (
                        <td key={mKey} className="p-1 text-center">
                          <input
                            type="number"
                            max="20"
                            min="0"
                            value={r[mKey] ?? ''}
                            onChange={(e) => handleUpdateScoreClassX_17F(r.id, mKey, parseFloat(e.target.value) || 0)}
                            className="w-11 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                          />
                        </td>
                      ))}
                      {/* PT1, PT2 */}
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="40"
                          min="0"
                          value={r.pt1 ?? ''}
                          onChange={(e) => handleUpdateScoreClassX_17F(r.id, 'pt1', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="40"
                          min="0"
                          value={r.pt2 ?? ''}
                          onChange={(e) => handleUpdateScoreClassX_17F(r.id, 'pt2', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      {/* HY */}
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="80"
                          min="0"
                          value={r.hy ?? ''}
                          onChange={(e) => handleUpdateScoreClassX_17F(r.id, 'hy', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      {/* PB1..PB3 */}
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="80"
                          min="0"
                          value={r.pb1 ?? ''}
                          onChange={(e) => handleUpdateScoreClassX_17F(r.id, 'pb1', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="80"
                          min="0"
                          value={r.pb2 ?? ''}
                          onChange={(e) => handleUpdateScoreClassX_17F(r.id, 'pb2', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="80"
                          min="0"
                          value={r.pb3 ?? ''}
                          onChange={(e) => handleUpdateScoreClassX_17F(r.id, 'pb3', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      {/* AISSE */}
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="100"
                          min="0"
                          value={r.aisse ?? ''}
                          onChange={(e) => handleUpdateScoreClassX_17F(r.id, 'aisse', parseFloat(e.target.value) || 0)}
                          className="w-14 bg-amber-950/50 border border-amber-500/40 text-center rounded-lg p-1 font-bold text-amber-200 focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={r.parentSignature || ''}
                          onChange={(e) => handleUpdateScoreClassX_17F(r.id, 'parentSignature', e.target.value)}
                          placeholder="e.g. Signed"
                          className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${r.studentName}?`)) {
                              const updated = scoresClassX_17F.filter(x => x.id !== r.id);
                              setScoresClassX_17F(updated);
                              db.set('setup:scores_class_x_17f', updated);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Interactive Editable Table for 17(g) Class XI (6 pages) */}
          {scholasticStage === 'class_xi_17g' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-md">
              <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-purple-300">17(g) मूल्यांकन संरचना कक्षा-11 (ASSESSMENT STRUCTURE FOR CLASS- XI)</h4>
                  <p className="text-[11px] text-slate-400">Periodic Test 1 (40), Half Yearly (70/80), Periodic Test 2 (40), SEE Theory (70/80) & SEE Practical/Project/ASL (30/20)</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/60 text-purple-200 border border-purple-500/30">
                  6 Pages Equivalent
                </span>
              </div>
              <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-slate-950/90 text-slate-300 font-bold border-b border-slate-800 text-center">
                    <th rowSpan={2} className="p-2 w-10">S.No</th>
                    <th rowSpan={2} className="p-2 min-w-[160px] text-left">Name of the Student</th>
                    <th rowSpan={2} className="p-2 w-28">Periodic Test 1</th>
                    <th rowSpan={2} className="p-2 w-32">Half Yearly Exam</th>
                    <th rowSpan={2} className="p-2 w-28">Periodic Test 2</th>
                    <th colSpan={2} className="p-1 bg-slate-800/80 text-purple-300 border-x border-slate-700">Session Ending Exam</th>
                    <th rowSpan={2} className="p-2 w-24 text-teal-300 font-bold">SEE Total</th>
                    <th rowSpan={2} className="p-2 min-w-[160px] text-left">Remark</th>
                    <th rowSpan={2} className="p-2 w-10 text-center">Action</th>
                  </tr>
                  <tr className="bg-slate-950 text-slate-400 font-semibold text-[11px] text-center border-b border-slate-800">
                    <th className="p-1 w-28 border-l border-slate-800">Theory Exam</th>
                    <th className="p-1 w-32 border-r border-slate-800">Practical/Project/ASL</th>
                  </tr>
                  <tr className="bg-slate-950/60 text-slate-400 text-[10px] italic text-center border-b border-slate-800/70">
                    <td></td>
                    <td className="text-left font-semibold pl-2">Max marks</td>
                    <td className="font-bold text-slate-300">40</td>
                    <td className="font-bold text-slate-300">70/80</td>
                    <td className="font-bold text-slate-300">40</td>
                    <td className="font-bold text-slate-300">70/80</td>
                    <td className="font-bold text-slate-300">30/20</td>
                    <td className="font-bold text-teal-300">100</td>
                    <td></td>
                    <td></td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredScoresClassXI_17G.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2 text-center font-bold text-slate-300">{r.rollNo || idx + 1}</td>
                      <td className="p-2 font-medium text-slate-100">
                        <input
                          type="text"
                          value={r.studentName}
                          onChange={(e) => handleUpdateScoreClassXI_17G(r.id, 'studentName', e.target.value)}
                          className="bg-transparent border-0 font-medium text-slate-100 focus:bg-slate-950 focus:ring-1 focus:ring-purple-500 rounded px-1.5 py-0.5 w-full"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="40"
                          min="0"
                          value={r.pt1 ?? ''}
                          onChange={(e) => handleUpdateScoreClassXI_17G(r.id, 'pt1', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="80"
                          min="0"
                          value={r.halfYearly ?? ''}
                          onChange={(e) => handleUpdateScoreClassXI_17G(r.id, 'halfYearly', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="40"
                          min="0"
                          value={r.pt2 ?? ''}
                          onChange={(e) => handleUpdateScoreClassXI_17G(r.id, 'pt2', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="80"
                          min="0"
                          value={r.seeTheory ?? ''}
                          onChange={(e) => handleUpdateScoreClassXI_17G(r.id, 'seeTheory', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="30"
                          min="0"
                          value={r.seePractical ?? ''}
                          onChange={(e) => handleUpdateScoreClassXI_17G(r.id, 'seePractical', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      <td className="p-1 text-center font-bold text-teal-300">
                        {r.seeTotal ?? (Number(r.seeTheory || 0) + Number(r.seePractical || 0))}
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={r.remarks || ''}
                          onChange={(e) => handleUpdateScoreClassXI_17G(r.id, 'remarks', e.target.value)}
                          placeholder="Feedback..."
                          className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${r.studentName}?`)) {
                              const updated = scoresClassXI_17G.filter(x => x.id !== r.id);
                              setScoresClassXI_17G(updated);
                              db.set('setup:scores_class_xi_17g', updated);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Interactive Editable Table for 17(h) Class XII (6 pages) */}
          {scholasticStage === 'class_xii_17h' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-md">
              <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-purple-300">17(h) कक्षा-12 के अंकों का ब्यौरा (RECORD OF MARKS FOR CLASS- XII)</h4>
                  <p className="text-[11px] text-slate-400">Monthly Tests (M1-M5), Periodic Tests (PT1-PT2), Half Yearly (HY), Pre-Boards (PB1-PB3), Board Exam (AISSCE) & Parent Signature</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/60 text-purple-200 border border-purple-500/30">
                  6 Pages Equivalent
                </span>
              </div>
              <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-950/90 text-slate-300 font-bold border-b border-slate-800 text-center">
                    <th rowSpan={2} className="p-2 w-10">Sl.</th>
                    <th rowSpan={2} className="p-2 min-w-[140px] text-left">Name of Student</th>
                    <th colSpan={5} className="p-1 bg-slate-800/80 text-purple-300 border-x border-slate-700">MONTHLY TESTS</th>
                    <th colSpan={2} className="p-1 bg-slate-800/60 text-indigo-300 border-r border-slate-700">PERIODIC TESTS</th>
                    <th rowSpan={2} className="p-2 w-14">HY</th>
                    <th rowSpan={2} className="p-2 w-14">PB-1</th>
                    <th rowSpan={2} className="p-2 w-14">PB-2</th>
                    <th rowSpan={2} className="p-2 w-14">PB-3</th>
                    <th rowSpan={2} className="p-2 w-16 text-amber-300 bg-amber-950/30 font-bold">AISSCE</th>
                    <th rowSpan={2} className="p-2 min-w-[130px] text-left">Parent Signature</th>
                    <th rowSpan={2} className="p-2 w-10 text-center">Action</th>
                  </tr>
                  <tr className="bg-slate-950 text-slate-400 font-semibold text-[11px] text-center border-b border-slate-800">
                    <th className="p-1 w-12 border-l border-slate-800">M-1</th>
                    <th className="p-1 w-12">M-2</th>
                    <th className="p-1 w-12">M-3</th>
                    <th className="p-1 w-12">M-4</th>
                    <th className="p-1 w-12 border-r border-slate-800">M-5</th>
                    <th className="p-1 w-14">PT-1</th>
                    <th className="p-1 w-14 border-r border-slate-800">PT-2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredScoresClassXII_17H.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2 text-center font-bold text-slate-300">{r.rollNo || idx + 1}</td>
                      <td className="p-2 font-medium text-slate-100">
                        <input
                          type="text"
                          value={r.studentName}
                          onChange={(e) => handleUpdateScoreClassXII_17H(r.id, 'studentName', e.target.value)}
                          className="bg-transparent border-0 font-medium text-slate-100 focus:bg-slate-950 focus:ring-1 focus:ring-purple-500 rounded px-1.5 py-0.5 w-full"
                        />
                      </td>
                      {/* M1 to M5 */}
                      {(['m1', 'm2', 'm3', 'm4', 'm5'] as const).map((mKey) => (
                        <td key={mKey} className="p-1 text-center">
                          <input
                            type="number"
                            max="20"
                            min="0"
                            value={r[mKey] ?? ''}
                            onChange={(e) => handleUpdateScoreClassXII_17H(r.id, mKey, parseFloat(e.target.value) || 0)}
                            className="w-11 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                          />
                        </td>
                      ))}
                      {/* PT1, PT2 */}
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="40"
                          min="0"
                          value={r.pt1 ?? ''}
                          onChange={(e) => handleUpdateScoreClassXII_17H(r.id, 'pt1', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="40"
                          min="0"
                          value={r.pt2 ?? ''}
                          onChange={(e) => handleUpdateScoreClassXII_17H(r.id, 'pt2', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      {/* HY */}
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="80"
                          min="0"
                          value={r.hy ?? ''}
                          onChange={(e) => handleUpdateScoreClassXII_17H(r.id, 'hy', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      {/* PB1..PB3 */}
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="80"
                          min="0"
                          value={r.pb1 ?? ''}
                          onChange={(e) => handleUpdateScoreClassXII_17H(r.id, 'pb1', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="80"
                          min="0"
                          value={r.pb2 ?? ''}
                          onChange={(e) => handleUpdateScoreClassXII_17H(r.id, 'pb2', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="80"
                          min="0"
                          value={r.pb3 ?? ''}
                          onChange={(e) => handleUpdateScoreClassXII_17H(r.id, 'pb3', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-slate-950 border border-slate-700 text-center rounded-lg p-1 text-slate-100 focus:ring-2 focus:ring-purple-500 text-xs"
                        />
                      </td>
                      {/* AISSCE */}
                      <td className="p-1 text-center">
                        <input
                          type="number"
                          max="100"
                          min="0"
                          value={r.aissce ?? ''}
                          onChange={(e) => handleUpdateScoreClassXII_17H(r.id, 'aissce', parseFloat(e.target.value) || 0)}
                          className="w-14 bg-amber-950/50 border border-amber-500/40 text-center rounded-lg p-1 font-bold text-amber-200 focus:ring-2 focus:ring-amber-500 text-xs"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={r.parentSignature || ''}
                          onChange={(e) => handleUpdateScoreClassXII_17H(r.id, 'parentSignature', e.target.value)}
                          placeholder="e.g. Signed"
                          className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${r.studentName}?`)) {
                              const updated = scoresClassXII_17H.filter(x => x.id !== r.id);
                              setScoresClassXII_17H(updated);
                              db.set('setup:scores_class_xii_17h', updated);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: FORMATIVE & LESSON PROGRESS LOG                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'formative_log' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              Class Tests, Oral Questions, Worksheets & Diagnostic Reminders
            </h3>
            <button
              onClick={() => {
                setFormativeForm({
                  id: '',
                  className: 'X',
                  section: 'A',
                  subjectName: 'Mathematics (041)',
                  topic: '',
                  month: 'July',
                  date: new Date().toISOString().split('T')[0],
                  assessmentType: 'Class Test',
                  title: '',
                  description: '',
                  maxMarks: 10,
                  averageScore: 8,
                  performanceRemarks: '',
                  slowLearnerSupport: '',
                  advancedLearnerActivity: '',
                  remedialTeaching: '',
                  enrichmentWork: '',
                  followUpAction: '',
                  templatePageRef: 22
                });
                setIsFormativeModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>New Progress Record</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFormative.map(r => {
              const typeObj = ASSESSMENT_TYPES.find(t => t.type === r.assessmentType);
              return (
                <div
                  key={r.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-sm transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeObj?.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                        {r.assessmentType}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Class {r.className}-{r.section} • {r.date}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{r.title}</h4>
                      <p className="text-xs text-purple-300 font-medium flex items-center gap-1 mt-0.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        {r.topic}
                      </p>
                    </div>

                    {r.maxMarks && (
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Class Avg Score:</span>
                        <span className="font-bold text-amber-300">{r.averageScore} / {r.maxMarks} Marks</span>
                      </div>
                    )}

                    <div className="space-y-1.5 text-xs pt-1">
                      {r.performanceRemarks && (
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Remarks:</span>
                          <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">{r.performanceRemarks}</p>
                        </div>
                      )}
                      {r.slowLearnerSupport && (
                        <div className="bg-orange-950/20 p-2 rounded-lg border border-orange-500/20">
                          <span className="text-[10px] uppercase font-bold text-orange-400 block mb-0.5">🌱 Slow Learner Support:</span>
                          <p className="text-orange-200 text-[11px] leading-relaxed line-clamp-2">{r.slowLearnerSupport}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[10px] font-mono text-slate-500">Ref Pg: #{r.templatePageRef || 22}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setFormativeForm({ ...r });
                          setIsFormativeModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-purple-300 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFormative(r.id)}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: MDP / AIP PROJECTS (Page 23 - Screenshot 1)                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'mdp_aip' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                Multi-Disciplinary (17b) & Art Integrated (17c) Projects Suite
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                CBSE Mandatory Cross-Curricular Projects & Paired State Art Integration (Middle & Secondary)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setPrintSheetType('mdp_aip');
                  setIsPrintMode(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                <Printer className="w-3.5 h-3.5 text-purple-400" />
                <span>Print Official Sheet</span>
              </button>
              <button
                onClick={() => {
                  setMdpForm({
                    id: '',
                    projectType: 'MDP',
                    title: '',
                    theme: '',
                    topic: '',
                    mdpAssigned: '',
                    aipAssigned: '',
                    evaluationCriteria: '1. Content & Concept Clarity (5M), 2. Interdisciplinary Linkage (5M), 3. Research & Originality (5M), 4. Presentation & Viva (5M)',
                    className: classFilter === 'All' ? 'X' : classFilter,
                    section: 'A',
                    subjectName: 'Mathematics (041)',
                    pairedSubjects: 'Mathematics + Science + Social Science',
                    targetGroup: 'Class X-A (All Students)',
                    assignedDate: new Date().toISOString().split('T')[0],
                    submissionDate: new Date().toISOString().split('T')[0],
                    r1Content: 5,
                    r2ArtIntegration: 5,
                    r3ResearchCreativity: 5,
                    r4Presentation: 5,
                    totalMarks: 20,
                    status: 'In Progress',
                    remarks: '',
                    templatePageRef: 23
                  });
                  setIsMdpModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add MDP</span>
              </button>
              <button
                onClick={() => {
                  setMdpForm({
                    id: '',
                    projectType: 'AIP',
                    title: '',
                    theme: '',
                    topic: '',
                    mdpAssigned: '',
                    aipAssigned: '',
                    evaluationCriteria: '1. Mathematical Rigor (5M), 2. Art Integration & Craftsmanship (5M), 3. Research & Originality (5M), 4. Presentation & Viva (5M)',
                    className: classFilter === 'All' ? 'X' : classFilter,
                    section: 'A',
                    subjectName: 'Mathematics (041)',
                    pairedSubjects: 'Mathematics + Fine Arts + Social Science',
                    targetGroup: 'Class X-A (All Students)',
                    assignedDate: new Date().toISOString().split('T')[0],
                    submissionDate: new Date().toISOString().split('T')[0],
                    r1Content: 5,
                    r2ArtIntegration: 5,
                    r3ResearchCreativity: 5,
                    r4Presentation: 5,
                    totalMarks: 20,
                    status: 'In Progress',
                    remarks: '',
                    templatePageRef: 23
                  });
                  setIsMdpModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add AIP</span>
              </button>
            </div>
          </div>

          {/* Section 17(b): Multi-Disciplinary Projects (MDP) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-purple-300">
                  17(b) विद्यार्थियों को निर्दिष्ट की गई बहुविषयी परियोजनाओं का विवरण
                </h4>
                <p className="text-xs font-medium text-slate-400">
                  Details of Multi-Disciplinary Projects assigned to Students
                </p>
              </div>
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-bold">
                {filteredMdp.length} MDP Assigned
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
              <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-slate-950/90 text-slate-300 font-bold border-b border-slate-800">
                    <th className="p-3 w-24 text-center">Class</th>
                    <th className="p-3 w-56">Topic</th>
                    <th className="p-3 min-w-[280px]">MDP assigned</th>
                    <th className="p-3 min-w-[240px]">Evaluation criteria</th>
                    <th className="p-3 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMdp.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 text-xs italic">
                        No Multi-Disciplinary Projects found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMdp.map(proj => (
                      <tr key={proj.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3 text-center font-bold text-slate-200">
                          <span className="px-2 py-1 bg-slate-950 rounded-lg border border-slate-800">
                            Class {proj.className}-{proj.section}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-purple-300">
                          {proj.topic || proj.theme || proj.title}
                          {proj.pairedSubjects && (
                            <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                              🔗 {proj.pairedSubjects}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-200 leading-relaxed font-medium">
                          {proj.mdpAssigned || proj.title || proj.theme}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px] leading-relaxed">
                          {proj.evaluationCriteria || '1. Concept (5M), 2. Linkage (5M), 3. Research (5M), 4. Presentation (5M)'}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setMdpForm({ ...proj, projectType: 'MDP' });
                                setIsMdpModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                              title="Edit Project"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMdp(proj.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                              title="Delete Project"
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

          {/* Section 17(c): Art Integrated Projects (AIP) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-fuchsia-300">
                  17 (c) विद्यार्थियों को निर्दिष्ट की गई कला एकीकृत परियोजनाओं का विवरण
                </h4>
                <p className="text-xs font-medium text-slate-400">
                  Details of Art Integrated Projects assigned to Students
                </p>
              </div>
              <span className="px-2 py-0.5 bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 rounded-full text-[10px] font-bold">
                {filteredAip.length} AIP Assigned
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
              <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-slate-950/90 text-slate-300 font-bold border-b border-slate-800">
                    <th className="p-3 w-24 text-center">Class</th>
                    <th className="p-3 w-56">Topic</th>
                    <th className="p-3 min-w-[280px]">AIP assigned</th>
                    <th className="p-3 min-w-[240px]">Evaluation criteria</th>
                    <th className="p-3 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAip.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 text-xs italic">
                        No Art Integrated Projects found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAip.map(proj => (
                      <tr key={proj.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3 text-center font-bold text-slate-200">
                          <span className="px-2 py-1 bg-slate-950 rounded-lg border border-slate-800">
                            Class {proj.className}-{proj.section}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-fuchsia-300">
                          {proj.topic || proj.theme || proj.title}
                          {proj.pairedSubjects && (
                            <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                              🎨 {proj.pairedSubjects}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-200 leading-relaxed font-medium">
                          {proj.aipAssigned || proj.title || proj.theme}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px] leading-relaxed">
                          {proj.evaluationCriteria || '1. Mathematical Rigor (5M), 2. Art Integration (5M), 3. Originality (5M), 4. Presentation (5M)'}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setMdpForm({ ...proj, projectType: 'AIP' });
                                setIsMdpModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-fuchsia-300 hover:bg-slate-800 rounded-lg transition"
                              title="Edit Project"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMdp(proj.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                              title="Delete Project"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: SEA ACTIVITIES (Page 25 - Screenshot 2)                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'sea_activities' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                17(e) विषय संवर्धन गतिविधियों की सूची (LIST OF SUBJECT/CONTENT ENRICHMENT ACTIVITIES)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Class & Section: Class {classFilter === 'All' ? 'X - A' : classFilter} • Subject: Mathematics (041)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setPrintSheetType('sea');
                  setIsPrintMode(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                <Printer className="w-3.5 h-3.5 text-purple-400" />
                <span>Print Official 17(e)</span>
              </button>
              <button
                onClick={() => {
                  setSeaForm({
                    id: '',
                    slNo: seaPlans.length + 1,
                    className: classFilter === 'All' ? 'X' : classFilter,
                    section: 'A',
                    subjectName: 'Mathematics (041)',
                    monthAndDate: 'July 2025',
                    activity: '',
                    evaluationCriteria: 'R1: Accuracy of geometric construction (5), R2: Theoretical calculation (5), R3: Lab file neatness (5), R4: Viva voce (5)',
                    remarks: '',
                    term: 1
                  });
                  setIsSeaModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Enrichment Activity</span>
              </button>
            </div>
          </div>

          {/* Official 17(e) Table View */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-950/90 text-slate-300 font-bold border-b border-slate-800">
                  <th className="p-3 w-16 text-center">Sl. No.</th>
                  <th className="p-3 w-32 text-center">Month& Date</th>
                  <th className="p-3 min-w-[240px]">Activity</th>
                  <th className="p-3 min-w-[240px]">Evaluation Criteria</th>
                  <th className="p-3 min-w-[160px]">Remarks</th>
                  <th className="p-3 w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSea.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 text-xs italic">
                      No Subject Enrichment Activities found. Click "+ Add Enrichment Activity" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredSea.map((sea, idx) => (
                    <tr key={sea.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3 text-center font-bold text-slate-300">
                        {sea.slNo || idx + 1}
                      </td>
                      <td className="p-3 text-center font-medium text-purple-300 whitespace-nowrap">
                        {sea.monthAndDate}
                      </td>
                      <td className="p-3 font-semibold text-slate-100 leading-relaxed">
                        {sea.activity}
                      </td>
                      <td className="p-3 text-slate-300 text-[11px] leading-relaxed">
                        {sea.evaluationCriteria}
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        {sea.remarks || 'Standard KVS Rubric'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSeaForm({ ...sea });
                              setIsSeaModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                            title="Edit Activity"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSea(sea.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Delete Activity"
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
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: 17(i) PRACTICAL ATTENDANCE REGISTER (KVS Template Page 29)      */}
      {/* ========================================================================= */}
      {activeSubTab === 'practical_attendance' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Action Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div>
              <div className="text-[11px] font-semibold text-rose-400 tracking-wide mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                (In landscape with proper column width)
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  17(i) प्रयोगात्मक कक्षाओं / गतिविधियों में छात्रों की उपस्थिति का ब्यौरा
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  6 pages • Page 29
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Roster Connected
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wide">
                RECORD OF ATTENDANCE OF STUDENT IN PRACTICAL CLASSES /ACTIVITIES
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 font-medium">
                <span>Class: <strong className="text-slate-200">{classFilter === 'All' ? 'All Classes' : `Class ${classFilter}`}</strong></span>
                <span>•</span>
                <span>Sec: <strong className="text-slate-200">{sectionFilter === 'All' ? 'All Sections' : `Section ${sectionFilter}`}</strong></span>
                <span>•</span>
                <span>Subject: <strong className="text-slate-200">{subjectFilter === 'All' ? 'All Subjects' : subjectFilter}</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSyncPracticalFromRoster}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-700/50 transition shadow-sm"
                title="Import and sync student list from Student Profile & Roster for the selected class"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Import from Roster</span>
              </button>

              <button
                onClick={() => setIsEditingPracticalModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Configure 20 Practicals</span>
              </button>

              <button
                onClick={handleAddPracticalStudentRow}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Student Row</span>
              </button>

              <button
                onClick={() => {
                  setPrintSheetType('practical_17i');
                  setIsPrintMode(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span>Print Official 17(i)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics & Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Students</span>
                <span className="text-base font-extrabold text-slate-100">{filteredPractical17iRecords.length}</span>
              </div>
              <UserCheck className="w-5 h-5 text-indigo-400 opacity-80" />
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Practical Activities</span>
                <span className="text-base font-extrabold text-indigo-300">20 Columns</span>
              </div>
              <Calendar className="w-5 h-5 text-indigo-400 opacity-80" />
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Marked</span>
                <span className="text-base font-extrabold text-emerald-400">
                  {filteredPractical17iRecords.reduce((acc, r) => acc + Object.values(r.attendance).filter(v => v && v !== 'A').length, 0)}
                </span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-80" />
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Rate</span>
                <span className="text-base font-extrabold text-cyan-300">
                  {filteredPractical17iRecords.length > 0
                    ? Math.round(
                        (filteredPractical17iRecords.reduce((acc, r) => acc + Object.values(r.attendance).filter(v => v === 'P' || v === '✓' || v === 'Sign').length, 0) /
                          (filteredPractical17iRecords.length * 20)) * 100
                      )
                    : 0}%
                </span>
              </div>
              <TrendingUp className="w-5 h-5 text-cyan-400 opacity-80" />
            </div>
          </div>

          {/* Quick Legend & Interactive helper */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-semibold">Attendance Legend:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]">
                P Present in Lab
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold text-[11px]">
                ✓ Experiment Verified
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-medium text-[11px]">
                Sign Student Signed
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[11px]">
                A Absent
              </span>
            </div>
            <div className="text-[11px] text-slate-400 italic">
              ⚡ Click any cell to cycle status • Hover column header to mark all Present
            </div>
          </div>

          {/* Table Container - Landscape Layout */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[620px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-20 bg-slate-950 text-slate-200">
                  {/* Tier 1 Header: S.No., Date and 20 Date columns */}
                  <tr className="border-b border-slate-800 text-center font-bold">
                    <th rowSpan={3} className="sticky left-0 z-30 bg-slate-950 border-r border-slate-800 p-2.5 w-12 text-center text-slate-300">
                      S.No.
                    </th>
                    <th className="sticky left-12 z-30 bg-slate-900 border-r border-slate-800 p-2 min-w-[170px] text-left text-indigo-300 font-bold">
                      Date
                    </th>
                    {practicalDates17i.slice(0, 20).map((dateStr, dIdx) => (
                      <th
                        key={`hd-pdate-${dIdx}`}
                        className="border-r border-slate-800/80 p-1 min-w-[44px] max-w-[50px] font-mono group relative hover:bg-slate-900 transition-colors"
                      >
                        <div className="font-bold text-slate-200 truncate text-[11px]">{dateStr || `#${dIdx + 1}`}</div>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center justify-center gap-0.5 mt-0.5 transition-opacity">
                          <button
                            title="Mark all students Present (P)"
                            onClick={() => handleMarkAllPresentForCol17i(dIdx)}
                            className="text-[9px] px-1 py-0.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded font-bold"
                          >
                            P
                          </button>
                          <button
                            title="Clear column"
                            onClick={() => handleClearCol17i(dIdx)}
                            className="text-[9px] px-1 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
                          >
                            ×
                          </button>
                        </div>
                      </th>
                    ))}
                    <th rowSpan={3} className="border-l border-slate-800 p-2.5 min-w-[70px] text-center text-slate-300">
                      Total P
                    </th>
                    <th rowSpan={3} className="border-l border-slate-800 p-2.5 min-w-[150px] text-left text-slate-300">
                      Remarks
                    </th>
                    <th rowSpan={3} className="border-l border-slate-800 p-2.5 w-12 text-center text-slate-300">
                      Action
                    </th>
                  </tr>

                  {/* Tier 2 Header: Name of Practical/Activity and 20 activity titles */}
                  <tr className="border-b border-slate-800 bg-slate-950 text-center text-[10px] font-semibold text-slate-300">
                    <th className="sticky left-12 z-30 bg-slate-900 border-r border-slate-800 p-2 text-left text-cyan-300 font-bold text-[11px]">
                      Name of Practical/Activity
                    </th>
                    {practicalTitles17i.slice(0, 20).map((titleStr, tIdx) => (
                      <th
                        key={`hd-ptitle-${tIdx}`}
                        className="border-r border-slate-800/80 p-1 min-w-[44px] max-w-[50px] text-center cursor-pointer hover:bg-slate-900 transition-colors"
                        title={titleStr || `Activity #${tIdx + 1}`}
                        onClick={() => setIsEditingPracticalModal(true)}
                      >
                        <div className="font-mono text-[9px] text-indigo-300 truncate font-semibold">
                          {titleStr ? (titleStr.length > 7 ? titleStr.substring(0, 7) + '..' : titleStr) : `A${tIdx + 1}`}
                        </div>
                      </th>
                    ))}
                  </tr>

                  {/* Tier 3 Header: Name of the Student and Signature/Attendance of Student */}
                  <tr className="border-b border-slate-800 bg-slate-900 text-center text-[11px] font-extrabold text-slate-200">
                    <th className="sticky left-12 z-30 bg-slate-950 border-r border-slate-800 p-2 text-left text-slate-200 font-bold">
                      Name of the Student
                    </th>
                    <th colSpan={20} className="border-r border-slate-800 p-1.5 bg-slate-900/95 text-indigo-300 uppercase tracking-wider text-[11px]">
                      Signature/Attendance of Student
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredPractical17iRecords.length === 0 ? (
                    <tr>
                      <td colSpan={25} className="p-10 text-center text-slate-400 text-xs">
                        <div className="max-w-md mx-auto space-y-3">
                          <p className="font-semibold text-slate-300">
                            No student records found for {classFilter === 'All' ? 'All Classes' : `Class ${classFilter}`} {sectionFilter === 'All' ? '' : `(Section ${sectionFilter})`} in the Practical Attendance Register.
                          </p>
                          <p className="text-slate-500 text-[11px]">
                            Student data is imported dynamically from the Student Profile & Roster. Click below to load or sync students from the roster.
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-1">
                            <button
                              onClick={handleSyncPracticalFromRoster}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Import Students from Roster</span>
                            </button>
                            <button
                              onClick={handleAddPracticalStudentRow}
                              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Custom Student</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPractical17iRecords.map((rec, idx) => {
                      const presentCount = Object.values(rec.attendance).filter(v => v === 'P' || v === '✓' || v === 'Sign').length;
                      return (
                        <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="sticky left-0 z-10 bg-slate-900 border-r border-slate-800 p-2 text-center font-bold text-slate-400">
                            {rec.rollNo || idx + 1}
                          </td>
                          <td className="sticky left-12 z-10 bg-slate-900 border-r border-slate-800 p-2">
                            <input
                              type="text"
                              value={rec.studentName}
                              onChange={(e) => handleUpdatePracticalStudentName(rec.id, e.target.value)}
                              className="w-full bg-transparent font-medium text-slate-200 text-xs focus:bg-slate-950 focus:border focus:border-indigo-500 rounded px-1.5 py-1 outline-none truncate"
                            />
                          </td>
                          {Array.from({ length: 20 }).map((_, colIdx) => {
                            const val = rec.attendance[String(colIdx)] || '';
                            let badgeStyle = 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/60';
                            if (val === 'P') badgeStyle = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]';
                            else if (val === '✓') badgeStyle = 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold';
                            else if (val === 'Sign') badgeStyle = 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold text-[9px]';
                            else if (val === 'A') badgeStyle = 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold';
                            else if (val) badgeStyle = 'bg-slate-800 text-slate-300 border border-slate-700 text-[10px]';

                            return (
                              <td key={colIdx} className="border-r border-slate-800/60 p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleCyclePracticalCell(rec.id, String(colIdx))}
                                  title={`Date: ${practicalDates17i[colIdx] || `Col #${colIdx + 1}`} | Activity: ${practicalTitles17i[colIdx] || `Exp ${colIdx + 1}`} | Click to cycle`}
                                  className={`w-8 h-7 mx-auto rounded flex items-center justify-center transition-all cursor-pointer select-none ${badgeStyle}`}
                                >
                                  {val || '-'}
                                </button>
                              </td>
                            );
                          })}
                          <td className="border-l border-slate-800 p-2 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              presentCount >= 18
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : presentCount >= 12
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {presentCount}/20
                            </span>
                          </td>
                          <td className="border-l border-slate-800 p-1.5">
                            <input
                              type="text"
                              value={rec.remarks || ''}
                              onChange={(e) => handleUpdatePracticalRemarks(rec.id, e.target.value)}
                              placeholder="e.g. Lab file verified"
                              className="w-full bg-transparent text-slate-300 text-xs focus:bg-slate-950 focus:border focus:border-indigo-500 rounded px-2 py-1 outline-none"
                            />
                          </td>
                          <td className="border-l border-slate-800 p-2 text-center">
                            <button
                              onClick={() => handleDeletePracticalRow(rec.id)}
                              title="Delete row"
                              className="text-slate-500 hover:text-red-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: NOTEBOOK SUBMISSION RECORD (17j - KVS Page 30)                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'notebook_submission' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Action Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-pink-400" />
                  17(j) कक्षा कार्य/गृह कार्य नोट बुक का रिकॉर्ड
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Page 30 • 6 Pages
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Roster Imported
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wide">
                RECORD OF CLASS WORK / HOME WORK NOTE BOOK SUBMISSION
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 font-medium">
                <span>Class: <strong className="text-slate-200">{classFilter === 'All' ? 'All Classes' : `Class ${classFilter}`}</strong></span>
                <span>•</span>
                <span>Sec: <strong className="text-slate-200">{sectionFilter === 'All' ? 'All Sections' : `Section ${sectionFilter}`}</strong></span>
                <span>•</span>
                <span>Subject: <strong className="text-slate-200">{subjectFilter === 'All' ? 'All Subjects' : subjectFilter}</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSyncNotebookFromRoster}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-700/50 transition shadow-sm"
                title="Import/sync latest student list from Student Profile & Roster for the selected class"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Import from Roster</span>
              </button>

              <button
                onClick={() => setIsEditingDatesModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5 text-pink-400" />
                <span>Configure 20 Dates</span>
              </button>

              <button
                onClick={handleAddNotebookStudentRow}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Student Row</span>
              </button>

              <button
                onClick={() => {
                  setPrintSheetType('notebook_17j');
                  setIsPrintMode(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                <Printer className="w-3.5 h-3.5 text-pink-400" />
                <span>Print Official 17(j)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics & Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Students</span>
                <span className="text-base font-extrabold text-slate-100">{filteredNotebookRecords.length}</span>
              </div>
              <UserCheck className="w-5 h-5 text-purple-400 opacity-80" />
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Dates Configured</span>
                <span className="text-base font-extrabold text-pink-300">20 Columns</span>
              </div>
              <Calendar className="w-5 h-5 text-pink-400 opacity-80" />
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Submissions</span>
                <span className="text-base font-extrabold text-emerald-400">
                  {filteredNotebookRecords.reduce((acc, r) => acc + Object.values(r.submissions).filter(v => v && v !== 'A').length, 0)}
                </span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-80" />
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Regularity Rate</span>
                <span className="text-base font-extrabold text-cyan-300">
                  {filteredNotebookRecords.length > 0
                    ? Math.round(
                        (filteredNotebookRecords.reduce((acc, r) => acc + Object.values(r.submissions).filter(v => v === '✓' || v === '5/5').length, 0) /
                          (filteredNotebookRecords.length * 20)) * 100
                      )
                    : 0}%
                </span>
              </div>
              <TrendingUp className="w-5 h-5 text-cyan-400 opacity-80" />
            </div>
          </div>

          {/* Quick Legend & Interactive helper */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-semibold">Status Legend:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]">
                ✓ Checked / Submitted
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[11px]">
                A Absent / Not Done
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium text-[11px]">
                Late Submission
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold text-[11px]">
                5/5 Scored
              </span>
            </div>
            <div className="text-[11px] text-slate-400 italic">
              ⚡ Click any cell to cycle status • Click column header to bulk mark
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-20 bg-slate-950 text-slate-200">
                  <tr className="border-b border-slate-800 text-center font-bold">
                    <th rowSpan={2} className="sticky left-0 z-30 bg-slate-950 border-r border-slate-800 p-2.5 w-12 text-center text-slate-300">
                      S.No.
                    </th>
                    <th rowSpan={2} className="sticky left-12 z-30 bg-slate-950 border-r border-slate-800 p-2.5 min-w-[170px] text-left text-slate-300">
                      Name of Student
                    </th>
                    <th colSpan={20} className="border-b border-slate-800 p-2 bg-slate-900/90 text-pink-300 uppercase tracking-wider text-[11px] font-bold">
                      Date of Submission (कक्षा कार्य / गृह कार्य प्रस्तुत करने की तिथियां)
                    </th>
                    <th rowSpan={2} className="border-l border-slate-800 p-2.5 min-w-[70px] text-center text-slate-300">
                      Total ✓
                    </th>
                    <th rowSpan={2} className="border-l border-slate-800 p-2.5 min-w-[150px] text-left text-slate-300">
                      Remarks
                    </th>
                    <th rowSpan={2} className="border-l border-slate-800 p-2.5 w-12 text-center text-slate-300">
                      Action
                    </th>
                  </tr>
                  <tr className="border-b border-slate-800 bg-slate-950 text-center text-[10px] font-semibold text-slate-400">
                    {notebookDates.slice(0, 20).map((dateStr, dIdx) => (
                      <th
                        key={dIdx}
                        className="border-r border-slate-800/80 p-1 min-w-[42px] max-w-[48px] font-mono group relative hover:bg-slate-900 transition-colors"
                      >
                        <div className="font-bold text-slate-200 truncate">{dateStr || `#${dIdx + 1}`}</div>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center justify-center gap-0.5 mt-0.5 transition-opacity">
                          <button
                            title="Mark all students checked (✓)"
                            onClick={() => handleMarkAllCheckedForCol(dIdx)}
                            className="text-[9px] px-1 py-0.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded"
                          >
                            ✓
                          </button>
                          <button
                            title="Clear column"
                            onClick={() => handleClearCol(dIdx)}
                            className="text-[9px] px-1 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
                          >
                            ×
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredNotebookRecords.length === 0 ? (
                    <tr>
                      <td colSpan={25} className="p-10 text-center text-slate-400 text-xs">
                        <div className="max-w-md mx-auto space-y-3">
                          <p className="font-semibold text-slate-300">
                            No student records found for {classFilter === 'All' ? 'All Classes' : `Class ${classFilter}`} {sectionFilter === 'All' ? '' : `(Section ${sectionFilter})`} in the Notebook Submission Register.
                          </p>
                          <p className="text-slate-500 text-[11px]">
                            Student data is imported dynamically from the Student Profile & Roster. Click below to load or sync students from the roster.
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-1">
                            <button
                              onClick={handleSyncNotebookFromRoster}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Import Students from Roster</span>
                            </button>
                            <button
                              onClick={handleAddNotebookStudentRow}
                              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Custom Student</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredNotebookRecords.map((rec, idx) => {
                      const completedCount = Object.values(rec.submissions).filter(v => v === '✓' || v === '5/5').length;
                      return (
                        <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="sticky left-0 z-10 bg-slate-900 border-r border-slate-800 p-2 text-center font-bold text-slate-400">
                            {rec.rollNo || idx + 1}
                          </td>
                          <td className="sticky left-12 z-10 bg-slate-900 border-r border-slate-800 p-2">
                            <input
                              type="text"
                              value={rec.studentName}
                              onChange={(e) => handleUpdateNotebookStudentName(rec.id, e.target.value)}
                              className="w-full bg-transparent font-medium text-slate-200 text-xs focus:bg-slate-950 focus:border focus:border-purple-500 rounded px-1.5 py-1 outline-none truncate"
                            />
                          </td>
                          {Array.from({ length: 20 }).map((_, colIdx) => {
                            const val = rec.submissions[String(colIdx)] || '';
                            let badgeStyle = 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/60';
                            if (val === '✓') badgeStyle = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold';
                            else if (val === 'A') badgeStyle = 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold';
                            else if (val === 'Late') badgeStyle = 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium text-[9px]';
                            else if (val === '5/5') badgeStyle = 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold text-[9px]';
                            else if (val) badgeStyle = 'bg-slate-800 text-slate-300 border border-slate-700 text-[10px]';

                            return (
                              <td key={colIdx} className="border-r border-slate-800/60 p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleCycleNotebookCell(rec.id, String(colIdx))}
                                  title={`Date: ${notebookDates[colIdx] || `Col #${colIdx + 1}`} | Click to cycle`}
                                  className={`w-8 h-7 mx-auto rounded flex items-center justify-center transition-all cursor-pointer select-none ${badgeStyle}`}
                                >
                                  {val || '-'}
                                </button>
                              </td>
                            );
                          })}
                          <td className="border-l border-slate-800 p-2 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              completedCount >= 18
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : completedCount >= 12
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {completedCount}/20
                            </span>
                          </td>
                          <td className="border-l border-slate-800 p-1.5">
                            <input
                              type="text"
                              value={rec.remarks || ''}
                              onChange={(e) => handleUpdateNotebookRemarks(rec.id, e.target.value)}
                              placeholder="e.g. Regular work, neat"
                              className="w-full bg-transparent text-slate-300 text-xs focus:bg-slate-950 focus:border focus:border-purple-500 rounded px-2 py-1 outline-none"
                            />
                          </td>
                          <td className="border-l border-slate-800 p-2 text-center">
                            <button
                              onClick={() => handleDeleteNotebookRow(rec.id)}
                              title="Delete row"
                              className="text-slate-500 hover:text-red-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Guidelines */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Teacher Guidelines for 17(j) Notebook Maintenance (KVS Norms):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>Class work & Homework notebooks must be checked regularly with constructive feedback, date, and initial.</li>
              <li>A minimum of 20 periodic inspection dates per term should be recorded in this digitized register.</li>
              <li>Notebook maintenance counts for 5 Marks in CBSE internal assessment (Class VI to X).</li>
            </ul>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 6: REMEDIAL TEACHING (Pages 34-36)                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'remedial_teaching' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              20(a)-(c) Remedial Assistance Register, Teaching Log & Post-Remediation Progression
            </h3>
            <button
              onClick={() => {
                setRemedialForm({
                  id: '',
                  studentId: '',
                  studentName: '',
                  className: 'X',
                  section: 'A',
                  subjectName: 'Mathematics (041)',
                  diagnosticWeakness: '',
                  identifiedMonth: 'July',
                  remedialStrategy: '',
                  remedialDates: '',
                  initialMarks: 10,
                  reTestMarks: 30,
                  progressStatus: 'Developing',
                  parentSignatureAcknowledged: false,
                  remarks: '',
                  templatePageRef: 34
                });
                setIsRemedialModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Log Remedial Case</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {remedialRecords.map(rem => (
              <div key={rem.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">Roll {rem.rollNo || '-'}: {rem.studentName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Class {rem.className}-{rem.section}</span>
                  </div>

                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div>
                      <span className="text-[10px] font-bold text-orange-400 block uppercase">Area of Weakness:</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{rem.diagnosticWeakness}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-purple-400 block uppercase">Remedial Strategy:</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{rem.remedialStrategy}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                      <span>Re-test Score:</span>
                      <span className="font-bold text-emerald-400">{rem.initialMarks} ➔ {rem.reTestMarks} Marks</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rem.progressStatus === 'Achieved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {rem.progressStatus}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRemedialForm({ ...rem });
                        setIsRemedialModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-purple-300"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRemedial(rem.id)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 7: EXEMPLARY CHILDREN (Page 37)                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'exemplary_children' && (
        <ExemplaryChildren21 devMode={devMode} />
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FORMATIVE ASSESSMENT FORM                                        */}
      {/* ========================================================================= */}
      {isFormativeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                {formativeForm.id ? 'Edit Assessment Record' : 'New Formative & Diagnostic Record'}
              </h3>
              <button
                onClick={() => setIsFormativeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-purple-500/20 space-y-1.5">
              <label className="text-xs font-bold text-purple-300 block">
                Optionally Link Daily Lesson Plan:
              </label>
              <select
                value={formativeForm.lessonPlanId || ''}
                onChange={(e) => handleSelectLessonPlan(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              >
                <option value="">-- Manual Input / Select Lesson Plan --</option>
                {lessonPlans.map(lp => (
                  <option key={lp.id} value={lp.id}>
                    Class {lp.className}-{lp.section} | {lp.subjectName} | {lp.topic} ({lp.date})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Class</label>
                <select
                  value={formativeForm.className}
                  onChange={(e) => setFormativeForm({ ...formativeForm, className: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.className}>Class {c.className}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Section</label>
                <input
                  type="text"
                  value={formativeForm.section}
                  onChange={(e) => setFormativeForm({ ...formativeForm, section: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Subject</label>
                <select
                  value={formativeForm.subjectName}
                  onChange={(e) => setFormativeForm({ ...formativeForm, subjectName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.subjectName}>{s.subjectName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Assessment Type</label>
                <select
                  value={formativeForm.assessmentType}
                  onChange={(e) => setFormativeForm({ ...formativeForm, assessmentType: e.target.value as AssessmentCategory })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  {ASSESSMENT_TYPES.map(t => (
                    <option key={t.type} value={t.type}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Date</label>
                <input
                  type="date"
                  value={formativeForm.date}
                  onChange={(e) => setFormativeForm({ ...formativeForm, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. PT-1 Prep Test / Real Numbers Quiz"
                  value={formativeForm.title}
                  onChange={(e) => setFormativeForm({ ...formativeForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Proofs of Irrationality"
                  value={formativeForm.topic}
                  onChange={(e) => setFormativeForm({ ...formativeForm, topic: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Performance Remarks</label>
                <textarea
                  rows={2}
                  value={formativeForm.performanceRemarks}
                  onChange={(e) => setFormativeForm({ ...formativeForm, performanceRemarks: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-orange-300 block mb-1">🌱 Slow Learner Support</label>
                <textarea
                  rows={2}
                  value={formativeForm.slowLearnerSupport}
                  onChange={(e) => setFormativeForm({ ...formativeForm, slowLearnerSupport: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsFormativeModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFormative}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MDP / AIP PROJECT FORM                                           */}
      {/* ========================================================================= */}
      {isMdpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                {mdpForm.id ? 'Edit Project Entry' : `Assign New ${mdpForm.projectType === 'MDP' ? 'Multi-Disciplinary (17b)' : 'Art Integrated (17c)'} Project`}
              </h3>
              <button onClick={() => setIsMdpModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Project Category</label>
                <select
                  value={mdpForm.projectType}
                  onChange={(e) => {
                    const newType = e.target.value as 'MDP' | 'AIP';
                    setMdpForm({
                      ...mdpForm,
                      projectType: newType,
                      evaluationCriteria: newType === 'MDP'
                        ? '1. Content & Concept Clarity (5M), 2. Interdisciplinary Linkage (5M), 3. Research & Originality (5M), 4. Presentation & Viva (5M)'
                        : '1. Mathematical Rigor (5M), 2. Art Integration & Craftsmanship (5M), 3. Research & Originality (5M), 4. Presentation & Viva (5M)'
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                >
                  <option value="MDP">17(b) Multi-Disciplinary (MDP)</option>
                  <option value="AIP">17(c) Art Integrated (AIP)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Class</label>
                <select
                  value={mdpForm.className}
                  onChange={(e) => setMdpForm({ ...mdpForm, className: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.className}>Class {c.className}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Section</label>
                <input
                  type="text"
                  value={mdpForm.section}
                  onChange={(e) => setMdpForm({ ...mdpForm, section: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Topic (विषय / प्रकरण)
              </label>
              <input
                type="text"
                value={mdpForm.topic || mdpForm.theme || ''}
                onChange={(e) => setMdpForm({ ...mdpForm, topic: e.target.value, theme: e.target.value })}
                placeholder="e.g. Statistical Survey of Household Electricity & Carbon Footprint"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                {mdpForm.projectType === 'MDP' ? 'MDP assigned (निर्दिष्ट बहुविषयी परियोजना)' : 'AIP assigned (निर्दिष्ट कला एकीकृत परियोजना)'}
              </label>
              <textarea
                rows={3}
                value={mdpForm.projectType === 'MDP' ? (mdpForm.mdpAssigned || mdpForm.title || '') : (mdpForm.aipAssigned || mdpForm.title || '')}
                onChange={(e) => {
                  if (mdpForm.projectType === 'MDP') {
                    setMdpForm({ ...mdpForm, mdpAssigned: e.target.value, title: e.target.value });
                  } else {
                    setMdpForm({ ...mdpForm, aipAssigned: e.target.value, title: e.target.value });
                  }
                }}
                placeholder={
                  mdpForm.projectType === 'MDP'
                    ? "Detailed task description assigned to students connecting multiple subjects..."
                    : "Artistic activity, visual/performing art integration paired with state culture (e.g. Odisha Mandalas)..."
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Evaluation criteria (मूल्यांकन मानदंड)
              </label>
              <textarea
                rows={2}
                value={mdpForm.evaluationCriteria || ''}
                onChange={(e) => setMdpForm({ ...mdpForm, evaluationCriteria: e.target.value })}
                placeholder="1. Content Clarity (5M), 2. Art/Linkage (5M), 3. Research (5M), 4. Presentation & Viva (5M)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Paired Subjects / Integrated Disciplines</label>
                <input
                  type="text"
                  value={mdpForm.pairedSubjects || ''}
                  onChange={(e) => setMdpForm({ ...mdpForm, pairedSubjects: e.target.value })}
                  placeholder="e.g. Mathematics + Fine Arts + Social Science"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Target Group</label>
                <input
                  type="text"
                  value={mdpForm.targetGroup || ''}
                  onChange={(e) => setMdpForm({ ...mdpForm, targetGroup: e.target.value })}
                  placeholder="e.g. Class X-A (Groups 1 to 8)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsMdpModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMdp}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REMEDIAL RECORD FORM                                             */}
      {/* ========================================================================= */}
      {isRemedialModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100">
                {remedialForm.id ? 'Edit Remedial Case' : 'Log Remedial Assistance Case'}
              </h3>
              <button onClick={() => setIsRemedialModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Student Name</label>
                <input
                  type="text"
                  value={remedialForm.studentName}
                  onChange={(e) => setRemedialForm({ ...remedialForm, studentName: e.target.value })}
                  placeholder="e.g. Tanmay Jena"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Progress Status</label>
                <select
                  value={remedialForm.progressStatus}
                  onChange={(e) => setRemedialForm({ ...remedialForm, progressStatus: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                >
                  <option value="Developing">Developing</option>
                  <option value="Achieved">Achieved</option>
                  <option value="Needs Further Attention">Needs Further Attention</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Diagnostic Weakness / TLO</label>
              <textarea
                rows={2}
                value={remedialForm.diagnosticWeakness}
                onChange={(e) => setRemedialForm({ ...remedialForm, diagnosticWeakness: e.target.value })}
                placeholder="Specific conceptual difficulty..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Remedial Strategy & Interventions</label>
              <textarea
                rows={2}
                value={remedialForm.remedialStrategy}
                onChange={(e) => setRemedialForm({ ...remedialForm, remedialStrategy: e.target.value })}
                placeholder="Worksheets, peer tutoring, visual flashcards..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Initial Score</label>
                <input
                  type="number"
                  value={remedialForm.initialMarks}
                  onChange={(e) => setRemedialForm({ ...remedialForm, initialMarks: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Post-Remediation Score</label>
                <input
                  type="number"
                  value={remedialForm.reTestMarks}
                  onChange={(e) => setRemedialForm({ ...remedialForm, reTestMarks: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRemedialModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRemedial}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Save Remedial Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EXEMPLARY CHILDREN FORM                                          */}
      {/* ========================================================================= */}
      {isExemplaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100">
                {exemplaryForm.id ? 'Edit Exemplary Student' : 'Add Exemplary / Gifted Student'}
              </h3>
              <button onClick={() => setIsExemplaryModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Student Name</label>
              <input
                type="text"
                value={exemplaryForm.studentName}
                onChange={(e) => setExemplaryForm({ ...exemplaryForm, studentName: e.target.value })}
                placeholder="e.g. Riya Patnaik"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Special Aptitude / Exceptional Domain</label>
              <input
                type="text"
                value={exemplaryForm.specialAptitude}
                onChange={(e) => setExemplaryForm({ ...exemplaryForm, specialAptitude: e.target.value })}
                placeholder="e.g. Olympiad Math, Robotics, Creative Writing"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Enrichment Steps & Mentoring</label>
              <textarea
                rows={2}
                value={exemplaryForm.enrichmentStepsTaken}
                onChange={(e) => setExemplaryForm({ ...exemplaryForm, enrichmentStepsTaken: e.target.value })}
                placeholder="Special question banks, ATL lab access, mentoring..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Achievements & Competitions Won</label>
              <textarea
                rows={2}
                value={exemplaryForm.achievementsAndAwards}
                onChange={(e) => setExemplaryForm({ ...exemplaryForm, achievementsAndAwards: e.target.value })}
                placeholder="Prizes, Olympiad ranks, exhibition medals..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsExemplaryModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveExemplary}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Save Exemplary Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: SEA ACTIVITY FORM (Screenshot 2 Alignment)                        */}
      {/* ========================================================================= */}
      {isSeaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                {seaForm.id ? 'Edit SEA Activity' : 'Add Subject/Content Enrichment Activity (17e)'}
              </h3>
              <button onClick={() => setIsSeaModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Sl. No. (क्रम संख्या)</label>
                <input
                  type="number"
                  value={seaForm.slNo || 1}
                  onChange={(e) => setSeaForm({ ...seaForm, slNo: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 text-center font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Month & Date (माह एवं दिनांक)</label>
                <input
                  type="text"
                  value={seaForm.monthAndDate}
                  onChange={(e) => setSeaForm({ ...seaForm, monthAndDate: e.target.value })}
                  placeholder="e.g. July 2025"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Activity (गतिविधि)</label>
              <textarea
                rows={3}
                value={seaForm.activity}
                onChange={(e) => setSeaForm({ ...seaForm, activity: e.target.value })}
                placeholder="e.g. GeoGebra Graphical Simulation of Zeros of Quadratic Polynomials"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Evaluation Criteria (मूल्यांकन मानदंड)</label>
              <textarea
                rows={2}
                value={seaForm.evaluationCriteria}
                onChange={(e) => setSeaForm({ ...seaForm, evaluationCriteria: e.target.value })}
                placeholder="e.g. R1: Accuracy of geometric construction (5), R2: Theoretical calculation (5), R3: Lab file neatness (5), R4: Viva voce (5)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Remarks (टिप्पणियाँ)</label>
              <input
                type="text"
                value={seaForm.remarks || ''}
                onChange={(e) => setSeaForm({ ...seaForm, remarks: e.target.value })}
                placeholder="e.g. Standard KVS Rubric / Math Lab Manual Alignment"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSeaModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSea}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Save SEA Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: 17(j) NOTEBOOK SUBMISSION 20 DATES CONFIGURATION                 */}
      {/* ========================================================================= */}
      {isEditingDatesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-base text-slate-100">
                  Configure 20 Submission Dates for 17(j)
                </h3>
              </div>
              <button onClick={() => setIsEditingDatesModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Customize the 20 inspection / checking dates corresponding to columns in the Notebook Submission Register (e.g., "08/04", "15/04", "22/04").
            </p>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-300">Quick Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setNotebookDates(DEFAULT_NOTEBOOK_DATES_17J);
                  db.set('setup:notebook_dates_17j', DEFAULT_NOTEBOOK_DATES_17J);
                  showToast('Reset to Default Academic Calendar Dates');
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium border border-slate-700"
              >
                Reset Default (Apr-Feb)
              </button>
              <button
                type="button"
                onClick={() => {
                  const seq = Array.from({ length: 20 }, (_, i) => `D-${i + 1}`);
                  setNotebookDates(seq);
                  db.set('setup:notebook_dates_17j', seq);
                  showToast('Set to D-1 through D-20');
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium border border-slate-700"
              >
                D-1 ... D-20
              </button>
            </div>

            {/* 4x5 Grid of 20 Dates */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-[350px] overflow-y-auto p-1">
              {Array.from({ length: 20 }).map((_, idx) => (
                <div key={idx} className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <label className="text-[10px] font-mono font-bold text-pink-400 block mb-1">
                    Date #{idx + 1}
                  </label>
                  <input
                    type="text"
                    value={notebookDates[idx] || ''}
                    onChange={(e) => handleUpdateNotebookDate(idx, e.target.value)}
                    placeholder={`e.g. 0${(idx % 9) + 1}/0${(idx % 12) + 1}`}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs text-slate-200 text-center font-mono focus:border-pink-500 outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditingDatesModal(false)}
                className="px-5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Done & Apply Dates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: 17(i) PRACTICAL ATTENDANCE 20 DATES & TITLES CONFIGURATION       */}
      {/* ========================================================================= */}
      {isEditingPracticalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-base text-slate-100">
                    Configure 20 Practical Dates & Activity Titles for 17(i)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    KVS Template Page 29 • Landscape 6-page Practical Attendance Record
                  </p>
                </div>
              </div>
              <button onClick={() => setIsEditingPracticalModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Configure the 20 columns corresponding to lab experiments / activity schedules. Each column has an experiment execution date and an experiment/activity topic title.
            </p>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-300">Quick Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setPracticalDates17i(DEFAULT_PRACTICAL_DATES_17I);
                  setPracticalTitles17i(DEFAULT_PRACTICAL_TITLES_17I);
                  db.set('setup:practical_dates_17i', DEFAULT_PRACTICAL_DATES_17I);
                  db.set('setup:practical_titles_17i', DEFAULT_PRACTICAL_TITLES_17I);
                  showToast('Reset to Default CBSE/KVS Practical Schedule');
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium border border-slate-700"
              >
                Reset Default (Math & Science Lab)
              </button>
              <button
                type="button"
                onClick={() => {
                  const seqDates = Array.from({ length: 20 }, (_, i) => `Exp-${i + 1}`);
                  const seqTitles = Array.from({ length: 20 }, (_, i) => `Practical Activity #${i + 1}`);
                  setPracticalDates17i(seqDates);
                  setPracticalTitles17i(seqTitles);
                  db.set('setup:practical_dates_17i', seqDates);
                  db.set('setup:practical_titles_17i', seqTitles);
                  showToast('Set to Generic Practical 1-20');
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium border border-slate-700"
              >
                Exp 1 ... Exp 20
              </button>
            </div>

            {/* 20 Practical Items List */}
            <div className="max-h-[380px] overflow-y-auto space-y-2 p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 20 }).map((_, idx) => (
                  <div key={`modal-pract-${idx}`} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-400 font-mono">
                        Practical Col #{idx + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Date</label>
                        <input
                          type="text"
                          value={practicalDates17i[idx] || ''}
                          onChange={(e) => handleUpdatePracticalDate(idx, e.target.value)}
                          placeholder="e.g. 12/04"
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs text-slate-200 text-center font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Practical / Activity Title</label>
                        <input
                          type="text"
                          value={practicalTitles17i[idx] || ''}
                          onChange={(e) => handleUpdatePracticalTitle(idx, e.target.value)}
                          placeholder={`Activity title #${idx + 1}`}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs text-slate-200 focus:border-indigo-500 outline-none truncate"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditingPracticalModal(false)}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Done & Apply Practicals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentProgressManager;
