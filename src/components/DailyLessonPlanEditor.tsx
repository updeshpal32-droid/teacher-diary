import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Copy,
  ArrowRight,
  Plus,
  Edit2,
  Trash2,
  Search,
  Printer,
  Sparkles,
  Layers,
  Save,
  HelpCircle,
  Lightbulb,
  Award,
  ListCheck,
  GraduationCap,
  Bookmark,
  Share2,
  RefreshCw,
  X,
  Check,
  ChevronRight,
  CornerDownRight,
  UserCheck,
  Camera,
  Image,
  Paperclip,
  FileUp,
  Upload,
  FileCheck,
  Eye,
  BookOpenCheck,
  CalendarDays,
  Users,
  Laptop,
  ShieldCheck
} from 'lucide-react';
import {
  DailyLessonPlan,
  LessonPlanStatus,
  ClassSection,
  SubjectItem,
  SyllabusItem,
  LessonEvidenceItem,
  TeacherProfile,
  WeeklyLessonPlan,
  StudentProfile,
  PracticalAttendanceRecord,
  StaffDetailRecord
} from '../types/academic';
import { db, submitModuleForApproval, getCurrentUser } from '../lib/storage';
import {
  getActiveInspectedTeacher,
  getTeacherProfileFromStaff,
  getTeacherScopedStorageKey
} from '../lib/teacherContext';
import { DevModeBadge } from './DevModeBadge';
import LessonEvidenceManager from './LessonEvidenceManager';
import IctClassroomUsage27 from './IctClassroomUsage27';

interface DailyLessonPlanEditorProps {
  devMode?: boolean;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STATUS_MAP: Record<LessonPlanStatus, { label: string; bg: string; text: string; border: string; icon: React.FC<{ className?: string }> }> = {
  'Draft': { label: 'Draft', bg: 'bg-slate-500/10', text: 'text-slate-300', border: 'border-slate-500/30', icon: Save },
  'In Progress': { label: 'In Progress', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', icon: Clock },
  'Completed': { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle2 },
  'Pending': { label: 'Pending', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', icon: AlertCircle },
  'Revised': { label: 'Revised', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', icon: RotateCcw },
  'Rescheduled': { label: 'Rescheduled', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', icon: Calendar },
  'Carried Forward': { label: 'Carried Forward', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', icon: CornerDownRight }
};

export default function DailyLessonPlanEditor({ devMode = true }: DailyLessonPlanEditorProps) {
  const [plans, setPlans] = useState<DailyLessonPlan[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [syllabusList, setSyllabusList] = useState<SyllabusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Chapter PDF & Plan Type State
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfFileSize, setPdfFileSize] = useState<string | null>(null);
  const [planType, setPlanType] = useState<'daily' | 'weekly'>('daily');

  // Weekly Lesson Plans State
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyLessonPlan[]>([]);
  const [activeWeeklyPlan, setActiveWeeklyPlan] = useState<WeeklyLessonPlan | null>(null);

  // View state: 'register' (Daily Log) | 'weekly' (Weekly Unit Log) | 'editor' (Plan Form Builder) | 'preview' (Printable Diary Page) | 'evidence' (Media Evidence) | 'ict' (ICT/Digital Technology Usage)
  const [activeView, setActiveView] = useState<'register' | 'weekly' | 'editor' | 'preview' | 'evidence' | 'ict'>('register');

  const handleUpdatePlanEvidence = async (planId: string, updatedEvidence: LessonEvidenceItem[]) => {
    const updatedPlans = plans.map(p => {
      if (p.id === planId) {
        return { ...p, evidenceItems: updatedEvidence };
      }
      return p;
    });
    setPlans(updatedPlans);
    if (activePlan && activePlan.id === planId) {
      setActivePlan(prev => prev ? { ...prev, evidenceItems: updatedEvidence } : null);
    }
    await db.set('setup:lesson_plans', updatedPlans);
    showToast('📸 Lesson plan media evidence updated!');
  };

  // Active Plan being edited or previewed
  const [activePlan, setActivePlan] = useState<DailyLessonPlan | null>(null);

  // Filters for Register View
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<DailyLessonPlan, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    day: DAYS_OF_WEEK[new Date().getDay() - 1] || 'Monday',
    className: 'X',
    section: 'A',
    periodNo: '2nd Period',
    subjectName: 'Mathematics (041)',
    unitNo: 'Unit 1',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Real Numbers',
    topic: '',
    subtopic: '',
    durationMinutes: 40,

    // Page 1 facts & LP source
    teacherName: '',
    designation: 'TGT (Mathematics)',
    concept1Source: 'Self',
    concept2Source: 'Resource Pool',
    concept3Source: 'Self',
    concept1Text: '',
    concept2Text: '',
    concept3Text: '',
    learningOutcomes: '',
    pedagogicalStrategies: 'Experiential Learning, Guided Inquiry & Peer Discussion.',
    remedialPeriodsRequired: '1',
    remedialConceptsRequired: '',

    // Page 2 header & content
    chapterName: 'Real Numbers',
    noOfPeriodsRequired: '4',
    noOfStudentsInClass: '40',
    developerConcept1: '',
    developerConcept2: 'KVS Resource Pool',
    developerConcept3: '',
    integrationWithOtherSubjects: 'Integration with Real World Data Analysis / Science / Everyday Mathematics.',
    assessmentItemFormat: 'Formative diagnostic questions, oral checks, and short problem solving.',
    resourcesDigitalPhysical: 'NCERT Textbook, Smart TV Presentation / GeoGebra diagrams, Whiteboard.',
    realLifeApplications: 'Direct application in architecture, financial calculations, computer algorithms and science.',
    twentyFirstCenturySkills: 'Critical Thinking, Problem Solving, Scientific Temper, Digital Literacy and Collaborative Learning.',

    // Page 2 Teacher Self-Assessment
    allStudentsEngaged: 'YES',
    ableToKeepTime: 'YES',
    questionsAppropriate: 'YES',
    implementationSatisfaction: 'Satisfied',
    movedStagesSuccessfully: 'YES',
    needModifications: 'NO',

    previousKnowledge: '',
    teachingObjectives: '',
    teachingLearningMaterials: 'NCERT Textbook, Smart TV / Digital Board presentations',
    teachingMethod: 'Guided Inquiry & Experiential Learning',
    classroomActivity: '',
    blackboardSummary: '',
    assessmentQuestions: '',
    classwork: '',
    homework: '',
    remedialWork: '',
    enrichmentActivity: '',
    teacherReflection: '',
    completionStatus: 'Draft',
    remarks: '',
    templatePageRef: 48
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeInspectedTeacher, setActiveInspectedTeacher] = useState<StaffDetailRecord | null>(null);

  useEffect(() => {
    loadData();

    const handleTeacherChanged = () => {
      loadData();
    };

    window.addEventListener('kvs-active-teacher-changed', handleTeacherChanged);
    return () => window.removeEventListener('kvs-active-teacher-changed', handleTeacherChanged);
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePdfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('⚠️ Please upload a valid PDF document (.pdf)');
      return;
    }

    setSelectedPdfFile(file);
    setPdfFileName(file.name);
    setPdfFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.includes(',') ? result.split(',')[1] : result;
      setPdfBase64(base64Data);

      const cleanTitle = file.name.replace(/\.pdf$/i, '').replace(/_/g, ' ');
      setFormData(prev => ({
        ...prev,
        chapterTitle: prev.chapterTitle || cleanTitle,
        chapterName: prev.chapterName || cleanTitle,
        topic: prev.topic || cleanTitle
      }));

      showToast(`📄 Chapter PDF "${file.name}" attached successfully! Ready for AI extraction.`);
    };
    reader.readAsDataURL(file);
  };

  const handleClearPdf = () => {
    setSelectedPdfFile(null);
    setPdfBase64(null);
    setPdfFileName(null);
    setPdfFileSize(null);
    showToast('Chapter PDF removed.');
  };

  const handleFetchStudentCount = async () => {
    try {
      const allStudents = await db.get<StudentProfile[]>('setup:students') || [];
      const enrolled = allStudents.filter(s => s.className === formData.className && s.section === formData.section);
      const practicalAtt = await db.get<PracticalAttendanceRecord[]>('setup:practical_attendance') || [];
      const record = practicalAtt.find(r => r.className === formData.className && r.section === formData.section && r.date === formData.date);

      if (record && record.presentCount !== undefined) {
        setFormData(prev => ({ ...prev, noOfStudentsInClass: String(record.presentCount) }));
        showToast(`✅ Synced with Practical Attendance (P-29): ${record.presentCount} students present receiving lesson!`);
      } else if (enrolled.length > 0) {
        setFormData(prev => ({ ...prev, noOfStudentsInClass: String(enrolled.length) }));
        showToast(`✅ Auto-filled from Student Master Roster: ${enrolled.length} enrolled students in Class ${formData.className}-${formData.section}`);
      } else {
        showToast(`ℹ️ No students found for Class ${formData.className}-${formData.section}. Please add in Student Profiles.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateAiPlan = async () => {
    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const res = await fetch('/api/generate-lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          className: formData.className,
          section: formData.section,
          subjectName: formData.subjectName,
          unitNo: formData.unitNo,
          chapterTitle: formData.chapterTitle || formData.topic || 'Chapter Core Topics',
          topic: formData.topic || formData.chapterTitle || 'Core Concepts',
          subtopic: formData.subtopic,
          durationMinutes: formData.durationMinutes,
          date: formData.date,
          pdfBase64,
          mimeType: 'application/pdf',
          fileName: pdfFileName
        })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to generate AI lesson plan');
      }

      const data = json.data;

      if (planType === 'weekly') {
        const newWeeklyPlan: WeeklyLessonPlan = {
          id: `wlp-${Date.now()}`,
          weeklyTitle: data.weeklyTitle || `Weekly Unit Plan: ${formData.chapterTitle || formData.topic}`,
          subjectName: data.subjectName || formData.subjectName,
          className: data.className || formData.className,
          section: formData.section || 'A',
          chapterTitle: data.chapterTitle || formData.chapterTitle || 'Chapter',
          totalPeriods: data.totalPeriods || 6,
          startDate: formData.date,
          endDate: new Date(new Date(formData.date).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          weeklyOverview: data.weeklyOverview || '',
          weeklyLearningOutcomes: data.weeklyLearningOutcomes || '',
          weeklyAssessmentStrategy: data.weeklyAssessmentStrategy || '',
          days: data.days || [],
          createdDate: new Date().toISOString().split('T')[0],
          chapterPdfName: pdfFileName || undefined,
          completionStatus: 'In Progress'
        };

        const updatedWeeklyList = [newWeeklyPlan, ...weeklyPlans];
        setWeeklyPlans(updatedWeeklyList);
        setActiveWeeklyPlan(newWeeklyPlan);
        await db.set('setup:weekly_lesson_plans', updatedWeeklyList);
        setActiveView('weekly');
        showToast(`✨ Generated 6-Day Weekly Unit Plan from Chapter PDF "${pdfFileName || 'Chapter'}"!`);
      } else {
        setFormData(prev => ({
          ...prev,
          concept1Text: data.concept1Text || `Concept 1: Core Fundamentals of ${formData.topic || formData.chapterTitle}`,
          concept2Text: data.concept2Text || `Concept 2: Methodological Applications & Formulas`,
          concept3Text: data.concept3Text || `Concept 3: Solved Examples & NCERT Exercises`,
          learningOutcomes: data.learningOutcomes || prev.learningOutcomes,
          pedagogicalStrategies: data.pedagogicalStrategies || data.teachingMethod || prev.pedagogicalStrategies,
          remedialPeriodsRequired: data.remedialPeriodsRequired || prev.remedialPeriodsRequired,
          remedialConceptsRequired: data.remedialConceptsRequired || data.remedialWork || prev.remedialConceptsRequired,
          chapterName: data.chapterName || formData.chapterTitle || prev.chapterName,
          noOfPeriodsRequired: data.noOfPeriodsRequired || prev.noOfPeriodsRequired,
          noOfStudentsInClass: data.noOfStudentsInClass || prev.noOfStudentsInClass,
          developerConcept1: teacherProfile?.name || prev.developerConcept1,
          developerConcept2: data.developerConcept2 || prev.developerConcept2,
          developerConcept3: teacherProfile?.name || prev.developerConcept3,
          integrationWithOtherSubjects: data.integrationWithOtherSubjects || prev.integrationWithOtherSubjects,
          assessmentItemFormat: data.assessmentItemFormat || data.assessmentQuestions || prev.assessmentItemFormat,
          resourcesDigitalPhysical: data.resourcesDigitalPhysical || data.teachingLearningMaterials || prev.resourcesDigitalPhysical,
          realLifeApplications: data.realLifeApplications || data.enrichmentActivity || prev.realLifeApplications,
          twentyFirstCenturySkills: data.twentyFirstCenturySkills || prev.twentyFirstCenturySkills,
          allStudentsEngaged: data.allStudentsEngaged || 'YES',
          ableToKeepTime: data.ableToKeepTime || 'YES',
          questionsAppropriate: data.questionsAppropriate || 'YES',
          implementationSatisfaction: data.implementationSatisfaction || 'Satisfied',
          movedStagesSuccessfully: data.movedStagesSuccessfully || 'YES',
          needModifications: data.needModifications || 'NO',
          previousKnowledge: data.previousKnowledge || prev.previousKnowledge,
          teachingObjectives: data.teachingObjectives || prev.teachingObjectives,
          teachingLearningMaterials: data.teachingLearningMaterials || prev.teachingLearningMaterials,
          teachingMethod: data.teachingMethod || prev.teachingMethod,
          classroomActivity: data.classroomActivity || prev.classroomActivity,
          blackboardSummary: data.blackboardSummary || prev.blackboardSummary,
          assessmentQuestions: data.assessmentQuestions || prev.assessmentQuestions,
          classwork: data.classwork || prev.classwork,
          homework: data.homework || prev.homework,
          remedialWork: data.remedialWork || prev.remedialWork,
          enrichmentActivity: data.enrichmentActivity || prev.enrichmentActivity,
          teacherReflection: data.teacherReflection || prev.teacherReflection
        }));

        showToast(`✨ Generated inspection-ready Daily Lesson Plan from Chapter PDF "${pdfFileName || 'Chapter'}"! Review & save.`);
      }
    } catch (err: any) {
      console.error('AI Lesson Plan Error:', err);
      setAiError(err?.message || 'Error communicating with AI service');
      showToast('AI generation failed. You can fill out fields manually.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    const [storedPlans, storedWeekly, storedClasses, storedSubjects, storedSyllabus, storedTeacher, activeStaff] = await Promise.all([
      db.get<DailyLessonPlan[]>('setup:lesson_plans'),
      db.get<WeeklyLessonPlan[]>('setup:weekly_lesson_plans'),
      db.get<ClassSection[]>('setup:classes'),
      db.get<SubjectItem[]>('setup:subjects'),
      db.get<SyllabusItem[]>('setup:syllabus'),
      db.get<TeacherProfile>('setup:teacher'),
      getActiveInspectedTeacher()
    ]);

    if (activeStaff) {
      setActiveInspectedTeacher(activeStaff);
      const activeProf = getTeacherProfileFromStaff(activeStaff, storedTeacher);
      setTeacherProfile(activeProf);

      const scopedKey = getTeacherScopedStorageKey('setup:lesson_plans', activeStaff.employeeCode);
      const scopedPlans = await db.get<DailyLessonPlan[]>(scopedKey);
      if (scopedPlans && scopedPlans.length > 0) {
        setPlans(scopedPlans);
      } else {
        const teacherPlans = (storedPlans || []).filter(p => p.teacherName === activeStaff.name || p.teacherName === activeProf.name);
        if (teacherPlans.length > 0) {
          setPlans(teacherPlans);
        } else if (storedPlans) {
          const adapted = storedPlans.map(p => ({
            ...p,
            teacherName: activeStaff.name,
            designation: activeStaff.designation || p.designation
          }));
          setPlans(adapted);
        }
      }
    } else {
      setActiveInspectedTeacher(null);
      if (storedPlans) setPlans(storedPlans);
      if (storedTeacher) setTeacherProfile(storedTeacher);
    }

    if (storedWeekly) setWeeklyPlans(storedWeekly);
    if (storedClasses) setClasses(storedClasses);
    if (storedSubjects) setSubjects(storedSubjects);
    if (storedSyllabus) setSyllabusList(storedSyllabus);

    setIsLoading(false);
  };

  // Open Editor for a New Plan
  const openNewPlanForm = () => {
    setActivePlan(null);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDayName = DAYS_OF_WEEK[new Date().getDay() - 1] || 'Monday';

    setFormData({
      date: todayStr,
      day: todayDayName,
      className: classes[0]?.className || 'X',
      section: classes[0]?.section || 'A',
      periodNo: '1st Period',
      subjectName: subjects[0]?.subjectName || 'Mathematics (041)',
      unitNo: 'Unit 1',
      chapterNo: 'Chapter 1',
      chapterTitle: 'Real Numbers',
      topic: '',
      subtopic: '',
      durationMinutes: 40,
      
      teacherName: teacherProfile?.name || '',
      designation: teacherProfile?.designation || 'TGT (Mathematics)',
      concept1Source: 'Self',
      concept2Source: 'Resource Pool',
      concept3Source: 'Self',
      concept1Text: '',
      concept2Text: '',
      concept3Text: '',
      learningOutcomes: '1. Students will demonstrate understanding of core principles.\n2. Solve NCERT textbook problems independently.',
      pedagogicalStrategies: 'Experiential Learning, Guided Inquiry, Interactive Whiteboard Demonstrations & Peer Pair Discussion.',
      remedialPeriodsRequired: '1-2 Periods',
      remedialConceptsRequired: '',

      chapterName: 'Real Numbers',
      noOfPeriodsRequired: '4',
      noOfStudentsInClass: '40',
      developerConcept1: teacherProfile?.name || '',
      developerConcept2: 'KVS Resource Pool',
      developerConcept3: teacherProfile?.name || '',

      integrationWithOtherSubjects: 'Integration with Real World Data Analysis, Physics & Daily Life Mathematics.',
      assessmentItemFormat: 'Formative evaluation MCQs, Oral Viva questions and Short Answer Problem Solving.',
      resourcesDigitalPhysical: 'NCERT Textbook, Smart TV GeoGebra Applets, Physical Manipulatives and Chart Paper.',
      realLifeApplications: 'Direct application in measurement estimation, computing algorithms and financial math.',
      twentyFirstCenturySkills: 'Critical Thinking, Problem Solving, Scientific Temper, Digital Literacy and Collaboration.',

      allStudentsEngaged: 'YES',
      ableToKeepTime: 'YES',
      questionsAppropriate: 'YES',
      implementationSatisfaction: 'Satisfied',
      movedStagesSuccessfully: 'YES',
      needModifications: 'NO',

      previousKnowledge: '1. Testing basic understanding of prerequisite concepts. 2. Short oral questions.',
      teachingObjectives: '1. Introduce core concept definitions and mathematical formulation.\n2. Enable students to apply logic to real-world problems.',
      teachingLearningMaterials: 'NCERT Textbook, Whiteboard Markers, Smart TV / Digital Board presentations.',
      teachingMethod: 'Guided Inquiry, Demonstration, and Pair Activity.',
      classroomActivity: 'Teacher explains theorem on board. Students attempt practice questions in pairs.',
      blackboardSummary: 'Key Formulae / Definitions / Step-by-step example solution.',
      assessmentQuestions: '1. Formative evaluation question 1.\n2. Concept check question 2.',
      classwork: 'NCERT Textbook Exercise questions 1 & 2.',
      homework: 'NCERT Exercise questions 3 & 4.',
      remedialWork: 'Individual attention and simplified worksheet for slow learners.',
      enrichmentActivity: 'HOTS problem for fast learners.',
      teacherReflection: 'Lesson delivered smoothly. Class engagement was high.',
      completionStatus: 'Draft',
      remarks: '',
      templatePageRef: 48
    });
    setFormErrors({});
    setActiveView('editor');
  };

  // Open Editor for Existing Plan
  const openEditPlanForm = (plan: DailyLessonPlan) => {
    setActivePlan(plan);
    setFormData({
      date: plan.date,
      day: plan.day,
      className: plan.className,
      section: plan.section,
      periodNo: plan.periodNo,
      subjectName: plan.subjectName,
      unitNo: plan.unitNo,
      chapterNo: plan.chapterNo,
      chapterTitle: plan.chapterTitle,
      topic: plan.topic,
      subtopic: plan.subtopic,
      durationMinutes: plan.durationMinutes,

      teacherName: plan.teacherName || teacherProfile?.name || '',
      designation: plan.designation || teacherProfile?.designation || 'TGT (Mathematics)',
      concept1Source: plan.concept1Source || 'Self',
      concept2Source: plan.concept2Source || 'Resource Pool',
      concept3Source: plan.concept3Source || 'Self',
      concept1Text: plan.concept1Text || plan.topic || '',
      concept2Text: plan.concept2Text || '',
      concept3Text: plan.concept3Text || '',
      learningOutcomes: plan.learningOutcomes || '',
      pedagogicalStrategies: plan.pedagogicalStrategies || plan.teachingMethod || '',
      remedialPeriodsRequired: plan.remedialPeriodsRequired || '1 Period',
      remedialConceptsRequired: plan.remedialConceptsRequired || plan.remedialWork || '',

      chapterName: plan.chapterName || plan.chapterTitle || '',
      noOfPeriodsRequired: plan.noOfPeriodsRequired || '4',
      noOfStudentsInClass: plan.noOfStudentsInClass || '40',
      developerConcept1: plan.developerConcept1 || plan.teacherName || teacherProfile?.name || '',
      developerConcept2: plan.developerConcept2 || 'KVS Resource Pool',
      developerConcept3: plan.developerConcept3 || plan.teacherName || teacherProfile?.name || '',

      integrationWithOtherSubjects: plan.integrationWithOtherSubjects || '',
      assessmentItemFormat: plan.assessmentItemFormat || plan.assessmentQuestions || '',
      resourcesDigitalPhysical: plan.resourcesDigitalPhysical || plan.teachingLearningMaterials || '',
      realLifeApplications: plan.realLifeApplications || plan.enrichmentActivity || '',
      twentyFirstCenturySkills: plan.twentyFirstCenturySkills || '',

      allStudentsEngaged: plan.allStudentsEngaged || 'YES',
      ableToKeepTime: plan.ableToKeepTime || 'YES',
      questionsAppropriate: plan.questionsAppropriate || 'YES',
      implementationSatisfaction: plan.implementationSatisfaction || 'Satisfied',
      movedStagesSuccessfully: plan.movedStagesSuccessfully || 'YES',
      needModifications: plan.needModifications || 'NO',

      previousKnowledge: plan.previousKnowledge,
      teachingObjectives: plan.teachingObjectives,
      teachingLearningMaterials: plan.teachingLearningMaterials,
      teachingMethod: plan.teachingMethod,
      classroomActivity: plan.classroomActivity,
      blackboardSummary: plan.blackboardSummary,
      assessmentQuestions: plan.assessmentQuestions,
      classwork: plan.classwork,
      homework: plan.homework,
      remedialWork: plan.remedialWork,
      enrichmentActivity: plan.enrichmentActivity,
      teacherReflection: plan.teacherReflection,
      completionStatus: plan.completionStatus,
      remarks: plan.remarks || '',
      templatePageRef: plan.templatePageRef || 48
    });
    setFormErrors({});
    setActiveView('editor');
  };

  // Duplicate Previous Lesson Action
  const handleDuplicatePlan = (sourcePlan: DailyLessonPlan) => {
    const nextDate = new Date(sourcePlan.date);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDateStr = nextDate.toISOString().split('T')[0];
    const nextDayName = DAYS_OF_WEEK[nextDate.getDay() - 1] || 'Monday';

    const newDuplicatedPlan: DailyLessonPlan = {
      ...sourcePlan,
      id: `lp-${Date.now()}`,
      date: nextDateStr,
      day: nextDayName,
      topic: `${sourcePlan.topic} (Continued)`,
      subtopic: `${sourcePlan.subtopic} - Part 2`,
      completionStatus: 'Draft',
      teacherReflection: 'Continuation lesson from previous day.'
    };

    const updatedList = [newDuplicatedPlan, ...plans];
    setPlans(updatedList);
    db.set('setup:lesson_plans', updatedList);
    showToast(`Duplicated lesson plan for ${newDuplicatedPlan.topic} on ${newDuplicatedPlan.date}!`);
    openEditPlanForm(newDuplicatedPlan);
  };

  // Carry Forward Pending Topic Action
  const handleCarryForwardPlan = (sourcePlan: DailyLessonPlan) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tomorrowDayName = DAYS_OF_WEEK[tomorrow.getDay() - 1] || 'Monday';

    const carriedPlan: DailyLessonPlan = {
      ...sourcePlan,
      id: `lp-${Date.now()}`,
      date: tomorrowStr,
      day: tomorrowDayName,
      topic: `[Carried Forward] ${sourcePlan.topic}`,
      subtopic: `Pending portion: ${sourcePlan.subtopic}`,
      previousKnowledge: `Recap of carried forward concept from ${sourcePlan.date}.`,
      completionStatus: 'Carried Forward',
      carriedFromId: sourcePlan.id,
      teacherReflection: `Carried forward from ${sourcePlan.date} lesson to ensure complete concept mastery.`,
      remarks: `Topics pending from ${sourcePlan.date} period schedule.`
    };

    const updatedList = [carriedPlan, ...plans];
    setPlans(updatedList);
    db.set('setup:lesson_plans', updatedList);
    showToast(`Carried forward pending topics into new plan dated ${tomorrowStr}!`);
    openEditPlanForm(carriedPlan);
  };

  // Save Plan (Draft or Complete)
  const handleSavePlan = async (targetStatus: LessonPlanStatus = 'Draft') => {
    const errors: Record<string, string> = {};

    if (!formData.topic.trim()) errors.topic = 'Lesson topic is required';
    if (!formData.chapterTitle.trim()) errors.chapterTitle = 'Chapter title is required';
    if (!formData.date.trim()) errors.date = 'Date is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Please fill in required lesson metadata.');
      return;
    }

    const payloadToSave = {
      ...formData,
      completionStatus: targetStatus
    };

    let updatedList: DailyLessonPlan[];
    if (activePlan) {
      updatedList = plans.map(p =>
        p.id === activePlan.id ? { ...payloadToSave, id: activePlan.id } : p
      );
    } else {
      const newPlan: DailyLessonPlan = {
        ...payloadToSave,
        id: `lp-${Date.now()}`
      };
      updatedList = [newPlan, ...plans];
    }

    setPlans(updatedList);
    await db.set('setup:lesson_plans', updatedList);
    if (activeInspectedTeacher?.employeeCode) {
      const scopedKey = getTeacherScopedStorageKey('setup:lesson_plans', activeInspectedTeacher.employeeCode);
      await db.set(scopedKey, updatedList);
    }
    showToast(`Lesson plan successfully saved as ${targetStatus}!`);
    setActiveView('register');
  };

  // Submit to Principal for Checking Authority Review
  const handleSubmitToPrincipal = async (planToSubmit?: DailyLessonPlan) => {
    const target = planToSubmit || activePlan || formData as DailyLessonPlan;
    if (!target.chapterTitle || !target.topic) {
      showToast('Please specify chapter and topic before submitting for review.');
      return;
    }
    const user = await getCurrentUser();
    await submitModuleForApproval({
      teacherId: user?.id || 'teacher-01',
      teacherName: user?.name || 'Assigned Teacher',
      teacherDesignation: user?.designation || 'Teacher',
      moduleKey: 'lessonplan',
      moduleTitle: `P-32 Daily Lesson Plan (${target.className || 'General'} ${target.subjectName || 'Subject'})`,
      recordId: target.id || `lp-${Date.now()}`,
      className: target.className,
      subjectName: target.subjectName,
      title: `${target.chapterTitle}: ${target.topic}`,
      summary: `Sub-topics: ${target.subtopic || 'N/A'}. Date: ${target.date}`,
      status: 'pending',
      officialStampApplied: false
    });
    showToast('🚀 Lesson plan submitted to Principal / Admin for review & digital approval stamp!');
  };

  // Delete Plan
  const handleDeletePlan = async (id: string) => {
    if (confirm('Are you sure you want to delete this daily lesson plan?')) {
      const updatedList = plans.filter(p => p.id !== id);
      setPlans(updatedList);
      await db.set('setup:lesson_plans', updatedList);
      showToast('Lesson plan deleted.');
    }
  };

  // Pull Chapter & Topic from Syllabus Plan
  const handleSyllabusSelect = (sylId: string) => {
    const selectedSyl = syllabusList.find(s => s.id === sylId);
    if (selectedSyl) {
      setFormData(prev => ({
        ...prev,
        className: selectedSyl.className,
        section: selectedSyl.section,
        subjectName: selectedSyl.subjectName,
        unitNo: selectedSyl.unitNo,
        chapterNo: selectedSyl.chapterNo,
        chapterTitle: selectedSyl.chapterTitle,
        teachingObjectives: selectedSyl.teachingTarget,
        homework: selectedSyl.revisionPlan || prev.homework,
        remedialWork: selectedSyl.remarks || prev.remedialWork
      }));
      showToast(`Auto-filled lesson plan details from Syllabus Chapter: ${selectedSyl.chapterTitle}`);
    }
  };

  // Open Printable Preview
  const openPreview = (plan: DailyLessonPlan) => {
    setActivePlan(plan);
    setActiveView('preview');
  };

  // Filtered Register List
  const filteredPlans = plans.filter(plan => {
    if (filterClass !== 'All' && plan.className !== filterClass) return false;
    if (filterSubject !== 'All' && plan.subjectName !== filterSubject) return false;
    if (filterStatus !== 'All' && plan.completionStatus !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        plan.topic.toLowerCase().includes(q) ||
        plan.subtopic.toLowerCase().includes(q) ||
        plan.chapterTitle.toLowerCase().includes(q) ||
        plan.teachingObjectives.toLowerCase().includes(q) ||
        plan.classroomActivity.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Calculate Metrics
  const totalPlans = plans.length;
  const completedPlansCount = plans.filter(p => p.completionStatus === 'Completed').length;
  const draftPlansCount = plans.filter(p => p.completionStatus === 'Draft').length;
  const carriedPlansCount = plans.filter(p => p.completionStatus === 'Carried Forward').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-bounce border border-indigo-400/40">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-400" />
              Daily Lesson Plan & Period Plan Editor
            </h2>
            {devMode && <DevModeBadge pages={[48, 49]} title="32. Daily Lesson Plan Organiser (Pages 48 & 49)" />}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Create, edit, duplicate, and carry forward period-wise lesson plans exactly as formatted in the KVS Teacher's Diary.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeView !== 'register' && (
            <button
              onClick={() => setActiveView('register')}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <Layers className="w-4 h-4" />
              Daily Lesson Log
            </button>
          )}

          <button
            onClick={() => setActiveView('weekly')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors border ${
              activeView === 'weekly'
                ? 'bg-purple-600 text-white border-purple-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-amber-300" />
            <span>Weekly Unit Register ({weeklyPlans.length})</span>
          </button>

          <button
            onClick={() => setActiveView('evidence')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors border ${
              activeView === 'evidence'
                ? 'bg-purple-600 text-white border-purple-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Camera className="w-4 h-4 text-purple-300" />
            <span>Media Evidence & Appendix</span>
          </button>

          <button
            onClick={() => setActiveView('ict')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors border ${
              activeView === 'ict'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Laptop className="w-4 h-4 text-cyan-300" />
            <span>27. ICT / Digital Usage</span>
          </button>

          <button
            onClick={openNewPlanForm}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Daily Lesson Plan</span>
          </button>
        </div>
      </div>

      {/* Main View Router */}
      {activeView === 'editor' ? (
        /* ========================================================================= */
        /* VIEW 1: INTERACTIVE LESSON PLAN EDITOR FORM BUILDER                        */
        /* ========================================================================= */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
          {/* Editor Header Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                {activePlan ? 'Editing Existing Plan' : 'New Lesson Plan Draft'}
              </span>
              <h3 className="text-lg font-bold text-slate-100">
                {formData.topic ? formData.topic : 'Untitled Lesson Plan'}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateAiPlan}
                disabled={isGeneratingAi}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all shadow-sm border border-purple-400/30"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>AI Generate Plan</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleSavePlan('Draft')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                <Save className="w-4 h-4 text-slate-400" />
                Save Draft
              </button>

              <button
                onClick={() => handleSavePlan('Completed')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Complete
              </button>

              <button
                onClick={() => handleSavePlan('Revised')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Save & Revise
              </button>

              <button
                onClick={() => handleSubmitToPrincipal()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                title="Submit this daily lesson plan directly to the Principal / Admin for Checking Authority verification & digital stamp"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Submit to Principal</span>
              </button>

              {activePlan && (
                <button
                  onClick={() => openPreview(activePlan)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print Diary Page
                </button>
              )}
            </div>
          </div>

          {/* Quick Auto-Fill Selector from Split-Up Syllabus */}
          {syllabusList.length > 0 && (
            <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-purple-300 font-medium">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Auto-populate from Split-Up Syllabus:</span>
              </div>
              <select
                onChange={(e) => e.target.value && handleSyllabusSelect(e.target.value)}
                defaultValue=""
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="" disabled>Select Chapter from Syllabus...</option>
                {syllabusList.map(s => (
                  <option key={s.id} value={s.id}>
                    Class {s.className}-{s.section} | {s.chapterNo}: {s.chapterTitle} ({s.month})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* AI Lesson Plan Generator & Chapter PDF Upload Box */}
          <div className="bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-900 border border-purple-500/40 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-600/30 border border-purple-400/40 rounded-xl text-purple-300">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    Chapter PDF Upload & AI Lesson Plan Generator
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                      Gemini 2.5 Flash
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Upload any chapter PDF (NCERT / CBSE / State Board) to extract exact textbook formulas, learning outcomes, board summaries, classwork, and homework.
                  </p>
                </div>
              </div>

              {/* Daily vs Weekly Plan Selector */}
              <div className="flex items-center bg-slate-900/90 border border-purple-500/30 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setPlanType('daily')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    planType === 'daily'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Daily Plan (1 Period)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlanType('weekly')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    planType === 'weekly'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Weekly Plan (6 Days)</span>
                </button>
              </div>
            </div>

            {/* Upload Area & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* PDF Dropzone / Status */}
              <div className="md:col-span-2">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfFileUpload}
                  className="hidden"
                  id="chapter-pdf-input"
                />

                {selectedPdfFile ? (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-emerald-600/20 rounded-lg text-emerald-400 shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-100 flex items-center gap-2 truncate">
                          <span className="truncate">{pdfFileName}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 shrink-0 border border-emerald-500/30">
                            Ready for AI
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{pdfFileSize} • Chapter PDF Attached</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearPdf}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-700 transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="chapter-pdf-input"
                    className="flex items-center gap-3 bg-slate-900/80 hover:bg-slate-800/80 border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-xl p-3.5 cursor-pointer transition-colors text-xs"
                  >
                    <div className="p-2 bg-purple-600/20 text-purple-300 rounded-lg shrink-0">
                      <FileUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 block">
                        Upload Chapter PDF (Optional)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Click to browse or drop any textbook chapter PDF for maximum accuracy.
                      </span>
                    </div>
                  </label>
                )}
              </div>

              {/* Generate AI CTA Button */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleGenerateAiPlan}
                  disabled={isGeneratingAi}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md border border-purple-400/30"
                >
                  {isGeneratingAi ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Reading Chapter PDF & Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>
                        Generate {planType === 'weekly' ? '6-Day Weekly Unit Plan' : 'Daily Lesson Plan'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {aiError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Form Fields Section 1: Lesson Header & LP Source */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              1. General Schedule, Teacher Facts & Source of LP (Page 48 Header)
              {devMode && <DevModeBadge pages={48} title="Page 48 Header & LP Source" />}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => {
                    const newDate = e.target.value;
                    const d = new Date(newDate);
                    const dayName = DAYS_OF_WEEK[d.getDay() - 1] || 'Monday';
                    setFormData({ ...formData, date: newDate, day: dayName });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                {formErrors.date && <span className="text-rose-400 text-[10px]">{formErrors.date}</span>}
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Day</label>
                <input
                  type="text"
                  value={formData.day}
                  onChange={e => setFormData({ ...formData, day: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Class & Section</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.className}
                    onChange={e => setFormData({ ...formData, className: e.target.value })}
                    placeholder="Class X"
                    className="w-1/2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                    placeholder="Sec A"
                    className="w-1/2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Period & Duration</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.periodNo}
                    onChange={e => setFormData({ ...formData, periodNo: e.target.value })}
                    placeholder="2nd Period"
                    className="w-2/3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    placeholder="40"
                    className="w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Name of Teacher</label>
                <input
                  type="text"
                  value={formData.teacherName || ''}
                  onChange={e => setFormData({ ...formData, teacherName: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.designation || ''}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. TGT (Mathematics)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subjectName}
                  onChange={e => setFormData({ ...formData, subjectName: e.target.value })}
                  placeholder="e.g. Mathematics (041)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Unit / Chapter Title *</label>
                <input
                  type="text"
                  value={formData.chapterTitle}
                  onChange={e => setFormData({ ...formData, chapterTitle: e.target.value, chapterName: e.target.value })}
                  placeholder="Chapter 1: Real Numbers"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                {formErrors.chapterTitle && <span className="text-rose-400 text-[10px]">{formErrors.chapterTitle}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Lesson Topic *</label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={e => setFormData({ ...formData, topic: e.target.value, concept1Text: e.target.value })}
                  placeholder="e.g. Proofs of Irrationality"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                {formErrors.topic && <span className="text-rose-400 text-[10px]">{formErrors.topic}</span>}
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Subtopic Focus</label>
                <input
                  type="text"
                  value={formData.subtopic}
                  onChange={e => setFormData({ ...formData, subtopic: e.target.value })}
                  placeholder="e.g. Proving √2 and √3 are Irrational Numbers using Contradiction"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Source of LP (Self / Resource Pool) */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-2 text-xs">
              <span className="font-semibold text-purple-300 uppercase tracking-wider block">Source of the LP (Self / Resource Pool)</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-700">
                  <span className="text-slate-300 font-medium">Concept 1:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, concept1Source: 'Self' })}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded ${formData.concept1Source === 'Self' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                      Self
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, concept1Source: 'Resource Pool' })}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded ${formData.concept1Source === 'Resource Pool' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                      Resource Pool
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-700">
                  <span className="text-slate-300 font-medium">Concept 2:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, concept2Source: 'Self' })}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded ${formData.concept2Source === 'Self' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                      Self
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, concept2Source: 'Resource Pool' })}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded ${formData.concept2Source === 'Resource Pool' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                      Resource Pool
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-700">
                  <span className="text-slate-300 font-medium">Concept 3:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, concept3Source: 'Self' })}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded ${formData.concept3Source === 'Self' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                      Self
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, concept3Source: 'Resource Pool' })}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded ${formData.concept3Source === 'Resource Pool' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                      Resource Pool
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields Section 2: Page 48 Concepts, NCERT Outcomes & Pedagogical Strategies */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              2. Concepts, NCERT Learning Outcomes & Pedagogical Strategies (Page 48 Table)
              {devMode && <DevModeBadge pages={48} title="Page 48 Concepts & GLO/SLO" />}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-2">
                <label className="block font-medium text-slate-300">Concepts (1, 2, 3)</label>
                <input
                  type="text"
                  value={formData.concept1Text || ''}
                  onChange={e => setFormData({ ...formData, concept1Text: e.target.value })}
                  placeholder="Concept 1: Definition & Core Principle"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <input
                  type="text"
                  value={formData.concept2Text || ''}
                  onChange={e => setFormData({ ...formData, concept2Text: e.target.value })}
                  placeholder="Concept 2: Formula Derivations / Proof Method"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <input
                  type="text"
                  value={formData.concept3Text || ''}
                  onChange={e => setFormData({ ...formData, concept3Text: e.target.value })}
                  placeholder="Concept 3: Solved Examples & NCERT Exercises"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">सीखने के परिणाम / Learning Outcomes (NCERT)</label>
                <textarea
                  rows={5}
                  value={formData.learningOutcomes}
                  onChange={e => setFormData({ ...formData, learningOutcomes: e.target.value })}
                  placeholder="1. Demonstrate logical proof for irrational numbers independently. 2. Solve textbook problems."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">शैक्षणिक रणनीतियाँ / Pedagogical Strategies</label>
                <textarea
                  rows={5}
                  value={formData.pedagogicalStrategies || formData.teachingMethod || ''}
                  onChange={e => setFormData({ ...formData, pedagogicalStrategies: e.target.value, teachingMethod: e.target.value })}
                  placeholder="Experiential Learning, Guided Inquiry, Interactive Whiteboard Demonstrations & Pair Activities."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed"
                />
              </div>
            </div>

            {/* Post Teaching Reflection / Remedial Teaching */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-3 text-xs">
              <span className="font-semibold text-amber-300 uppercase tracking-wider block">Planning for Remedial Teaching (Page 48 Footer)</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">No. of periods required</label>
                  <input
                    type="text"
                    value={formData.remedialPeriodsRequired || ''}
                    onChange={e => setFormData({ ...formData, remedialPeriodsRequired: e.target.value })}
                    placeholder="e.g. 1-2 Periods"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-300 mb-1 font-medium">Concepts for Which remedial classes are required</label>
                  <input
                    type="text"
                    value={formData.remedialConceptsRequired || formData.remedialWork || ''}
                    onChange={e => setFormData({ ...formData, remedialConceptsRequired: e.target.value, remedialWork: e.target.value })}
                    placeholder="e.g. Substitution step in contradiction proofs for slow learners"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields Section 3: Page 49 Chapter Details, Developers & 5-Column Content */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              3. Chapter Details, LP Developer & Content Columns (Page 49)
              {devMode && <DevModeBadge pages={49} title="Page 49 Columns" />}
            </h4>

            {/* Page 49 Header Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Name of Chapter</label>
                <input
                  type="text"
                  value={formData.chapterName || formData.chapterTitle || ''}
                  onChange={e => setFormData({ ...formData, chapterName: e.target.value, chapterTitle: e.target.value })}
                  placeholder="e.g. Real Numbers"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">No of periods required</label>
                <input
                  type="text"
                  value={formData.noOfPeriodsRequired || ''}
                  onChange={e => setFormData({ ...formData, noOfPeriodsRequired: e.target.value })}
                  placeholder="e.g. 4 Periods"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-300">No of students in class</label>
                  <button
                    type="button"
                    onClick={handleFetchStudentCount}
                    className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                    title="Auto-fetch from Student Master Roster or P-29 Practical Attendance"
                  >
                    <Users className="w-3 h-3 text-purple-400" />
                    <span>Auto-Sync / Fetch</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.noOfStudentsInClass || ''}
                  onChange={e => setFormData({ ...formData, noOfStudentsInClass: e.target.value })}
                  placeholder="e.g. 40"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Developer for Concepts 1, 2, 3 */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-2 text-xs">
              <span className="font-semibold text-indigo-300 uppercase tracking-wider block">Lesson Plan Developer (Concept-wise)</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Concept 1 Developer</label>
                  <input
                    type="text"
                    value={formData.developerConcept1 || ''}
                    onChange={e => setFormData({ ...formData, developerConcept1: e.target.value })}
                    placeholder="Self / Teacher Name"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Concept 2 Developer</label>
                  <input
                    type="text"
                    value={formData.developerConcept2 || ''}
                    onChange={e => setFormData({ ...formData, developerConcept2: e.target.value })}
                    placeholder="KVS Resource Pool"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Concept 3 Developer</label>
                  <input
                    type="text"
                    value={formData.developerConcept3 || ''}
                    onChange={e => setFormData({ ...formData, developerConcept3: e.target.value })}
                    placeholder="Self / Co-Teacher"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* 5 Column Grid for Page 49 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">अन्य विषयों के साथ एकीकरण / Integration with other subjects</label>
                <textarea
                  rows={3}
                  value={formData.integrationWithOtherSubjects || ''}
                  onChange={e => setFormData({ ...formData, integrationWithOtherSubjects: e.target.value })}
                  placeholder="Integration with Real World Data Analysis, Physics and Financial Math."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">मूल्यांकन / Assessment (Item Format)</label>
                <textarea
                  rows={3}
                  value={formData.assessmentItemFormat || formData.assessmentQuestions || ''}
                  onChange={e => setFormData({ ...formData, assessmentItemFormat: e.target.value, assessmentQuestions: e.target.value })}
                  placeholder="Formative evaluation MCQs, Oral Viva and Short Answer Problem Solving."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">संसाधन (डिजिटल/भौतिक) / Resources (Digital/Physical)</label>
                <textarea
                  rows={3}
                  value={formData.resourcesDigitalPhysical || formData.teachingLearningMaterials || ''}
                  onChange={e => setFormData({ ...formData, resourcesDigitalPhysical: e.target.value, teachingLearningMaterials: e.target.value })}
                  placeholder="NCERT Textbook, Smart TV GeoGebra Applets, Chart Paper."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">वास्तविक जीवन अनुप्रयोग / Extension / Real life applications</label>
                <textarea
                  rows={3}
                  value={formData.realLifeApplications || formData.enrichmentActivity || ''}
                  onChange={e => setFormData({ ...formData, realLifeApplications: e.target.value, enrichmentActivity: e.target.value })}
                  placeholder="Direct application in architecture, estimation, computer algorithms and scientific research."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 leading-relaxed"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-2">
                <label className="block font-medium text-slate-300 mb-1">21st Century Skills / Value Education / Vocational skills</label>
                <textarea
                  rows={3}
                  value={formData.twentyFirstCenturySkills || ''}
                  onChange={e => setFormData({ ...formData, twentyFirstCenturySkills: e.target.value })}
                  placeholder="Critical Thinking, Problem Solving, Scientific Temper, Digital Literacy and Collaborative Learning."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Form Fields Section 4: Teacher Self-Assessment Checklist (Page 49 Footer) */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <ListCheck className="w-4 h-4 text-emerald-400" />
              4. Self-Assessment by the Teacher (Page 49 Checklist)
              {devMode && <DevModeBadge pages={49} title="Page 49 Checkboxes" />}
            </h4>

            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-700">
                  <span className="text-slate-200 font-medium">1. Were all students engaged in all activities?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allStudentsEngaged: 'YES' })}
                      className={`px-3 py-1 rounded text-xs font-bold ${formData.allStudentsEngaged === 'YES' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allStudentsEngaged: 'NO' })}
                      className={`px-3 py-1 rounded text-xs font-bold ${formData.allStudentsEngaged === 'NO' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-700">
                  <span className="text-slate-200 font-medium">2. Was I able to keep time?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, ableToKeepTime: 'YES' })}
                      className={`px-3 py-1 rounded text-xs font-bold ${formData.ableToKeepTime === 'YES' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, ableToKeepTime: 'NO' })}
                      className={`px-3 py-1 rounded text-xs font-bold ${formData.ableToKeepTime === 'NO' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-700">
                  <span className="text-slate-200 font-medium">3. Were questions posed to test understanding appropriate?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, questionsAppropriate: 'YES' })}
                      className={`px-3 py-1 rounded text-xs font-bold ${formData.questionsAppropriate === 'YES' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, questionsAppropriate: 'NO' })}
                      className={`px-3 py-1 rounded text-xs font-bold ${formData.questionsAppropriate === 'NO' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-700">
                  <span className="text-slate-200 font-medium">4. Was I able to move through stages successfully?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, movedStagesSuccessfully: 'YES' })}
                      className={`px-3 py-1 rounded text-xs font-bold ${formData.movedStagesSuccessfully === 'YES' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, movedStagesSuccessfully: 'NO' })}
                      className={`px-3 py-1 rounded text-xs font-bold ${formData.movedStagesSuccessfully === 'NO' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-700">
                  <span className="text-slate-200 font-medium">5. Do I need any modifications in the plan?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, needModifications: 'YES' })}
                      className={`px-3 py-1 rounded text-xs font-bold ${formData.needModifications === 'YES' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, needModifications: 'NO' })}
                      className={`px-3 py-1 rounded text-xs font-bold ${formData.needModifications === 'NO' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-700">
                  <span className="text-slate-200 font-medium">6. Implementation Satisfaction level:</span>
                  <select
                    value={formData.implementationSatisfaction || 'Satisfied'}
                    onChange={e => setFormData({ ...formData, implementationSatisfaction: e.target.value as any })}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded px-2.5 py-1"
                  >
                    <option value="Satisfied">Satisfied</option>
                    <option value="Partially satisfied">Partially satisfied</option>
                    <option value="Unsatisfied">Unsatisfied</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields Section 5: Detailed Classroom Execution Notes */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Award className="w-4 h-4 text-indigo-400" />
              5. Classroom Execution Notes (PK, Objectives, Board, CW/HW, Reflection)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Previous Knowledge (PK Testing)</label>
                <textarea
                  rows={3}
                  value={formData.previousKnowledge}
                  onChange={e => setFormData({ ...formData, previousKnowledge: e.target.value })}
                  placeholder="1. What are rational numbers? 2. Can rational numbers be expressed as p/q?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Teaching Objectives</label>
                <textarea
                  rows={3}
                  value={formData.teachingObjectives}
                  onChange={e => setFormData({ ...formData, teachingObjectives: e.target.value })}
                  placeholder="1. To introduce proof by contradiction method. 2. Apply Fundamental Theorem of Arithmetic."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Blackboard Summary</label>
                <textarea
                  rows={3}
                  value={formData.blackboardSummary}
                  onChange={e => setFormData({ ...formData, blackboardSummary: e.target.value })}
                  placeholder="Key theorems, main formula derivations, definitions, and board summary points."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 leading-relaxed font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Classwork Assigned (CW)</label>
                <textarea
                  rows={3}
                  value={formData.classwork}
                  onChange={e => setFormData({ ...formData, classwork: e.target.value })}
                  placeholder="NCERT Exercise 1.2 Questions 1 & 2."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Homework Assigned (HW)</label>
                <textarea
                  rows={3}
                  value={formData.homework}
                  onChange={e => setFormData({ ...formData, homework: e.target.value })}
                  placeholder="NCERT Exercise 1.2 Question 3 & Exemplar Problem 4."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Teacher's Self Reflection</label>
                <textarea
                  rows={3}
                  value={formData.teacherReflection}
                  onChange={e => setFormData({ ...formData, teacherReflection: e.target.value })}
                  placeholder="85% students grasped logic. Pair activity helped low confidence students."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <button
              onClick={() => setActiveView('register')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSavePlan('Draft')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg transition-colors"
              >
                Save as Draft
              </button>

              <button
                onClick={() => handleSavePlan('Completed')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                Save & Mark Complete
              </button>
            </div>
          </div>
        </div>
      ) : activeView === 'weekly' ? (
        /* ========================================================================= */
        /* VIEW 1B: WEEKLY UNIT LESSON PLANS REGISTER & 6-DAY PROGRESSION TABLE       */
        /* ========================================================================= */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-300" />
                <h3 className="text-lg font-bold text-slate-100">
                  Weekly Unit Lesson Plans Register (6-Day Unit Progression)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Generated from chapter PDFs or AI unit prompts. Provides a day-by-day 6-period pedagogical roadmap for complete chapter coverage.
              </p>
            </div>

            <button
              onClick={() => {
                setPlanType('weekly');
                openNewPlanForm();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Weekly Unit Plan</span>
            </button>
          </div>

          {weeklyPlans.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-4">
              <div className="w-12 h-12 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-2xl flex items-center justify-center mx-auto">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-200">No Weekly Unit Plans Generated Yet</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Upload a chapter PDF in the Lesson Plan Editor and select "Weekly Plan (6 Days)" to auto-generate a comprehensive 6-day unit progression plan.
                </p>
              </div>
              <button
                onClick={() => {
                  setPlanType('weekly');
                  openNewPlanForm();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Upload PDF & Create Weekly Plan</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {weeklyPlans.map(wlp => (
                <div key={wlp.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-sm">
                  {/* Weekly Plan Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                          6-Day Unit Plan
                        </span>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          Class {wlp.className}-{wlp.section} • {wlp.subjectName}
                        </span>
                        {wlp.chapterPdfName && (
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <FileCheck className="w-3 h-3" />
                            PDF: {wlp.chapterPdfName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-100">{wlp.weeklyTitle}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-3xl">
                        {wlp.weeklyOverview}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
                      >
                        <Printer className="w-4 h-4" />
                        Print Unit Plan
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this weekly unit plan?')) {
                            const updated = weeklyPlans.filter(p => p.id !== wlp.id);
                            setWeeklyPlans(updated);
                            await db.set('setup:weekly_lesson_plans', updated);
                            showToast('Weekly unit plan removed.');
                          }
                        }}
                        className="p-1.5 hover:bg-rose-500/20 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Overview Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
                      <span className="font-bold text-purple-300 block mb-1 uppercase tracking-wider text-[10px]">
                        🎯 Unit Learning Outcomes (GLO / SLO)
                      </span>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-line">{wlp.weeklyLearningOutcomes}</p>
                    </div>
                    <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
                      <span className="font-bold text-indigo-300 block mb-1 uppercase tracking-wider text-[10px]">
                        📝 Unit Assessment Strategy
                      </span>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-line">{wlp.weeklyAssessmentStrategy}</p>
                    </div>
                  </div>

                  {/* 6-Day Progression Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      Day-by-Day 6-Period Teaching Roadmap
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {wlp.days.map((day, idx) => (
                        <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                              <span className="px-2 py-0.5 bg-purple-600/30 text-purple-300 text-[10px] font-extrabold rounded border border-purple-500/30">
                                DAY {day.dayNumber}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400">
                                {day.pedagogicalStrategy}
                              </span>
                            </div>

                            <h5 className="text-xs font-bold text-slate-100 mb-1">{day.dayTitle}</h5>
                            <p className="text-[11px] text-purple-300 font-medium mb-2">{day.subtopics}</p>

                            <div className="space-y-2 text-[11px] text-slate-300">
                              <div>
                                <strong className="text-slate-400 block text-[10px]">NCERT Learning Outcome:</strong>
                                <span>{day.learningOutcomes}</span>
                              </div>
                              <div>
                                <strong className="text-slate-400 block text-[10px]">Teacher Activity:</strong>
                                <span>{day.teacherActivity}</span>
                              </div>
                              <div>
                                <strong className="text-slate-400 block text-[10px]">Blackboard Work:</strong>
                                <span className="font-mono text-amber-200/90">{day.blackboardWork}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1 bg-slate-900/60 p-2.5 rounded-lg">
                            <div><strong className="text-slate-400">CW/HW:</strong> {day.classworkHomework}</div>
                            <div><strong className="text-slate-400">Diagnostic Check:</strong> {day.assessmentQuestion}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeView === 'preview' && activePlan ? (
        /* ========================================================================= */
        /* VIEW 2: OFFICIAL PRINTABLE TEACHER'S DIARY PAGE PREVIEW (2-PAGE KVS SCAN)  */
        /* ========================================================================= */
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4">
            <button
              onClick={() => setActiveView('register')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
            >
              ← Back to Lesson Log
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print / Export PDF (Pages 48-49)
              </button>
            </div>
          </div>

          {/* Printable Container for Page 48 & Page 49 */}
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* ==================== PAGE 48: LESSON PLAN ORGANISER PAGE 1 ==================== */}
            <div className="bg-white text-slate-900 rounded-xl p-6 shadow-2xl border-2 border-slate-900 space-y-4 print:p-0 print:border-2 print:shadow-none page-break-after">
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2">
                <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">32. LESSON PLAN ORGANISER</h2>
                <span className="text-xs font-bold text-red-600 uppercase border border-red-600 px-2 py-0.5 rounded">60 pages</span>
              </div>

              {/* Facts Grid Header */}
              <div className="grid grid-cols-2 gap-2 border border-slate-900 p-2.5 text-xs bg-slate-50 font-sans">
                <div><strong className="text-slate-800">Name of Teacher:</strong> {activePlan.teacherName || '—'}</div>
                <div><strong className="text-slate-800">Designation:</strong> {activePlan.designation || 'TGT (Mathematics)'}</div>
                <div><strong className="text-slate-800">Date:</strong> {activePlan.date} ({activePlan.day})</div>
                <div><strong className="text-slate-800">Class & Sec:</strong> Class {activePlan.className}-{activePlan.section}</div>
                <div><strong className="text-slate-800">Subject:</strong> {activePlan.subjectName}</div>
                <div><strong className="text-slate-800">Period & Duration:</strong> {activePlan.periodNo} ({activePlan.durationMinutes} mins)</div>
              </div>

              {/* Source of the LP Table */}
              <div className="border border-slate-900 text-xs">
                <div className="bg-slate-200 font-bold p-1.5 text-center border-b border-slate-900 uppercase">
                  Source of the LP (Self / Resource Pool)
                </div>
                <div className="grid grid-cols-3 divide-x divide-slate-900 text-center py-2 font-medium bg-slate-50">
                  <div><strong>Concept 1:</strong> {activePlan.concept1Source || 'Self'}</div>
                  <div><strong>Concept 2:</strong> {activePlan.concept2Source || 'Resource Pool'}</div>
                  <div><strong>Concept 3:</strong> {activePlan.concept3Source || 'Self'}</div>
                </div>
              </div>

              {/* Main 3 Column Table */}
              <table className="w-full border-collapse border border-slate-900 text-xs">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-900 text-center font-bold">
                    <th className="border-r border-slate-900 p-2 w-1/4">Concepts (1, 2, 3)</th>
                    <th className="border-r border-slate-900 p-2 w-3/8">सीखने के परिणाम / Learning Outcomes (NCERT)</th>
                    <th className="p-2 w-3/8">शैक्षणिक रणनीतियाँ / Pedagogical Strategies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  <tr className="align-top">
                    <td className="border-r border-slate-900 p-2.5 space-y-2 bg-slate-50/50">
                      <div><strong>Concept 1:</strong> {activePlan.concept1Text || activePlan.topic || 'Core Concept'}</div>
                      {activePlan.concept2Text && <div><strong>Concept 2:</strong> {activePlan.concept2Text}</div>}
                      {activePlan.concept3Text && <div><strong>Concept 3:</strong> {activePlan.concept3Text}</div>}
                    </td>
                    <td className="border-r border-slate-900 p-2.5 whitespace-pre-line leading-relaxed">
                      {activePlan.learningOutcomes}
                    </td>
                    <td className="p-2.5 whitespace-pre-line leading-relaxed">
                      {activePlan.pedagogicalStrategies || activePlan.teachingMethod}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Post Teaching Reflection / Remedial Teaching */}
              <div className="border border-slate-900 p-3 text-xs bg-slate-50/80 space-y-1">
                <div className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-2">
                  Post Teaching Reflection — Planning for Remedial Teaching
                </div>
                <div><strong>No. of periods required:</strong> {activePlan.remedialPeriodsRequired || '1 Period'}</div>
                <div><strong>Concepts for Which remedial classes are required:</strong> {activePlan.remedialConceptsRequired || activePlan.remedialWork || 'N/A'}</div>
              </div>

              <div className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2">
                Page 48 — Kendriya Vidyalaya Sangathan Lesson Plan Organiser
              </div>
            </div>


            {/* ==================== PAGE 49: LESSON PLAN ORGANISER PAGE 2 ==================== */}
            <div className="bg-white text-slate-900 rounded-xl p-6 shadow-2xl border-2 border-slate-900 space-y-4 print:p-0 print:border-2 print:shadow-none">
              {/* Header Grid */}
              <div className="grid grid-cols-3 gap-2 border border-slate-900 p-2.5 text-xs bg-slate-50">
                <div><strong>Name of chapter:</strong> {activePlan.chapterName || activePlan.chapterTitle}</div>
                <div><strong>No of periods required:</strong> {activePlan.noOfPeriodsRequired || '4'}</div>
                <div><strong>No of students in the class:</strong> {activePlan.noOfStudentsInClass || '40'}</div>
              </div>

              {/* Lesson Plan Developer */}
              <div className="border border-slate-900 text-xs">
                <div className="bg-slate-200 font-bold p-1.5 text-center border-b border-slate-900 uppercase">
                  Lesson Plan Developer
                </div>
                <div className="grid grid-cols-3 divide-x divide-slate-900 text-center py-2 font-medium bg-slate-50">
                  <div><strong>Concept 1:</strong> {activePlan.developerConcept1 || activePlan.teacherName || 'Self'}</div>
                  <div><strong>Concept 2:</strong> {activePlan.developerConcept2 || 'KVS Resource Pool'}</div>
                  <div><strong>Concept 3:</strong> {activePlan.developerConcept3 || activePlan.teacherName || 'Self'}</div>
                </div>
              </div>

              {/* 5 Column Main Grid */}
              <table className="w-full border-collapse border border-slate-900 text-[11px]">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-900 text-center font-bold">
                    <th className="border-r border-slate-900 p-1.5 w-1/5">अन्य विषयों के साथ एकीकरण / Integration with other subjects</th>
                    <th className="border-r border-slate-900 p-1.5 w-1/5">मूल्यांकन / Assessment (Item Format)</th>
                    <th className="border-r border-slate-900 p-1.5 w-1/5">संसाधन (डिजिटल/भौतिक) / Resources (Digital/Physical)</th>
                    <th className="border-r border-slate-900 p-1.5 w-1/5">वास्तविक जीवन अनुप्रयोग / Extension / Real life applications</th>
                    <th className="p-1.5 w-1/5">21st Century Skills / Value Education / Vocational skills</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  <tr className="align-top leading-relaxed">
                    <td className="border-r border-slate-900 p-2">{activePlan.integrationWithOtherSubjects || 'Cross-curricular integration with Science & Real-world Math.'}</td>
                    <td className="border-r border-slate-900 p-2">{activePlan.assessmentItemFormat || activePlan.assessmentQuestions}</td>
                    <td className="border-r border-slate-900 p-2">{activePlan.resourcesDigitalPhysical || activePlan.teachingLearningMaterials}</td>
                    <td className="border-r border-slate-900 p-2">{activePlan.realLifeApplications || activePlan.enrichmentActivity}</td>
                    <td className="p-2">{activePlan.twentyFirstCenturySkills || 'Critical Thinking, Problem Solving, Scientific Temper & Collaboration.'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Self-Assessment by the Teacher Checklist */}
              <div className="border border-slate-900 p-3 text-xs space-y-2 bg-slate-50/80">
                <div className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1">
                  Self-Assessment by the Teacher
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span>Were all students engaged in all activities?</span>
                    <strong className="text-slate-900 font-mono">[{activePlan.allStudentsEngaged || 'YES'}]</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span>Was I able to keep time?</span>
                    <strong className="text-slate-900 font-mono">[{activePlan.ableToKeepTime || 'YES'}]</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span>Were questions posed to test understanding appropriate?</span>
                    <strong className="text-slate-900 font-mono">[{activePlan.questionsAppropriate || 'YES'}]</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span>Implementation Satisfaction:</span>
                    <strong className="text-slate-900 font-mono">[{activePlan.implementationSatisfaction || 'Satisfied'}]</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Was I able to move through stages successfully?</span>
                    <strong className="text-slate-900 font-mono">[{activePlan.movedStagesSuccessfully || 'YES'}]</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Do I need any modifications in the plan?</span>
                    <strong className="text-slate-900 font-mono">[{activePlan.needModifications || 'NO'}]</strong>
                  </div>
                </div>
              </div>

              {/* Signatures Block */}
              <div className="grid grid-cols-3 gap-4 border-t-2 border-slate-900 pt-10 mt-6 text-center text-xs font-bold text-slate-900">
                <div>
                  <div className="border-b border-slate-400 mb-2 pb-6"></div>
                  <span>Signature of Subject Teacher</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 mb-2 pb-6"></div>
                  <span>Signature of HOD / Vice Principal</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 mb-2 pb-6"></div>
                  <span>Signature of Principal</span>
                </div>
              </div>

              <div className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2">
                Page 49 — Kendriya Vidyalaya Sangathan Lesson Plan Organiser
              </div>
            </div>
          </div>
        </div>
      ) : activeView === 'evidence' ? (
        /* ========================================================================= */
        /* VIEW 4: LESSON PLAN MEDIA EVIDENCE REGISTER & APPENDIX                    */
        /* ========================================================================= */
        <LessonEvidenceManager
          plans={plans}
          activePlan={activePlan}
          onUpdatePlanEvidence={handleUpdatePlanEvidence}
          devMode={devMode}
        />
      ) : activeView === 'ict' ? (
        /* ========================================================================= */
        /* VIEW 5: 27. DETAILS OF ICT/DIGITAL TECHNOLOGY USED DURING CLASSROOM       */
        /* ========================================================================= */
        <IctClassroomUsage27 devMode={devMode} />
      ) : (
        /* ========================================================================= */
        /* VIEW 3: LESSON PLAN REGISTER LOG & OVERVIEW                               */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Metrics Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400">Total Lesson Plans</span>
              <div className="text-2xl font-bold text-slate-100 mt-1">{totalPlans}</div>
              <span className="text-[11px] text-slate-500 mt-1">Logged in Teacher's Diary</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400">Completed Lessons</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{completedPlansCount}</div>
              <span className="text-[11px] text-emerald-500/80 mt-1">{Math.round((completedPlansCount / (totalPlans || 1)) * 100)}% Completion Rate</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400">Drafts & In Progress</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">{draftPlansCount}</div>
              <span className="text-[11px] text-amber-500/80 mt-1">Pending Sign-off</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs text-slate-400">Carried Forward</span>
              <div className="text-2xl font-bold text-sky-400 mt-1">{carriedPlansCount}</div>
              <span className="text-[11px] text-sky-500/80 mt-1">Pending subtopics moved</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Filter Class</label>
                <select
                  value={filterClass}
                  onChange={e => setFilterClass(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="All">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.className}>Class {c.className}-{c.section}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Filter Subject</label>
                <select
                  value={filterSubject}
                  onChange={e => setFilterSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="All">All Subjects</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.subjectName}>{s.subjectName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Filter Status</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Revised">Revised</option>
                  <option value="Carried Forward">Carried Forward</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Search Keywords</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Topic, chapter, activities..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Plans Register Cards List */}
          {isLoading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
              Loading daily lesson plans...
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-3">
              <FileText className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-base text-slate-300 font-medium">No lesson plans found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create a new period lesson plan or adjust your filter choices.
              </p>
              <button
                onClick={openNewPlanForm}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Create First Lesson Plan
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlans.map(plan => {
                const statusInfo = STATUS_MAP[plan.completionStatus] || STATUS_MAP['Draft'];
                const StatusIcon = statusInfo.icon;

                return (
                  <div key={plan.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs font-semibold border border-purple-500/20">
                            Class {plan.className}-{plan.section}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium">
                            {plan.periodNo}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium">
                            {plan.date} ({plan.day})
                          </span>
                          {devMode && <DevModeBadge pages={plan.templatePageRef || 48} title="Pages 48 & 49" />}
                        </div>

                        <h3 className="text-base font-bold text-slate-100 mt-2">
                          {plan.topic} — <span className="text-purple-300 font-normal">{plan.chapterTitle}</span>
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>

                        <button
                          onClick={() => openPreview(plan)}
                          title="Print Diary Page"
                          className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openEditPlanForm(plan)}
                          title="Edit Lesson Plan"
                          className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          title="Delete Lesson Plan"
                          className="p-1.5 hover:bg-rose-500/10 rounded-md text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Overview Summary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                      <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                        <span className="text-slate-400 font-medium block text-[11px] mb-1">Subtopic & Objectives</span>
                        <p className="line-clamp-2">{plan.subtopic || plan.teachingObjectives}</p>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                        <span className="text-slate-400 font-medium block text-[11px] mb-1">Pedagogy & Classroom Activity</span>
                        <p className="line-clamp-2">{plan.classroomActivity || plan.teachingMethod}</p>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                        <span className="text-slate-400 font-medium block text-[11px] mb-1">Homework & Remediation</span>
                        <p className="line-clamp-2">{plan.homework || plan.remedialWork || 'Standard assignments'}</p>
                      </div>
                    </div>

                    {/* Attached Media Evidence Thumbnails Bar */}
                    {plan.evidenceItems && plan.evidenceItems.length > 0 && (
                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5" />
                            Evidence ({plan.evidenceItems.length}):
                          </span>
                          {plan.evidenceItems.slice(0, 4).map(ev => (
                            <div
                              key={ev.id}
                              title={`${ev.title} (${ev.category})`}
                              className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-700/80 rounded text-[11px] text-slate-300 shrink-0"
                            >
                              {ev.fileType === 'image' || ev.fileType === 'video' ? (
                                <img src={ev.fileUrl} alt={ev.title} className="w-4 h-4 rounded object-cover" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-rose-400" />
                              )}
                              <span className="truncate max-w-[100px] font-medium">{ev.title}</span>
                            </div>
                          ))}
                          {plan.evidenceItems.length > 4 && (
                            <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                              +{plan.evidenceItems.length - 4} more
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setActivePlan(plan);
                            setActiveView('evidence');
                          }}
                          className="text-[11px] text-purple-300 hover:text-purple-200 font-semibold underline shrink-0"
                        >
                          Manage Media
                        </button>
                      </div>
                    )}

                    {/* Action Bar for Duplicate, Evidence & Carry Forward */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                      <div className="text-[11px] text-slate-400">
                        Duration: <strong className="text-slate-200">{plan.durationMinutes} mins</strong> | TLM: {plan.teachingLearningMaterials ? 'Provided' : 'Standard'}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActivePlan(plan);
                            setActiveView('evidence');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs rounded-md transition-colors"
                          title="Upload and manage photo/video/document evidence"
                        >
                          <Camera className="w-3.5 h-3.5 text-purple-300" />
                          <span>Evidence ({plan.evidenceItems?.length || 0})</span>
                        </button>

                        <button
                          onClick={() => handleDuplicatePlan(plan)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md transition-colors"
                          title="Duplicate this lesson plan structure for another date"
                        >
                          <Copy className="w-3.5 h-3.5 text-purple-400" />
                          Duplicate Lesson
                        </button>

                        <button
                          onClick={() => handleCarryForwardPlan(plan)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs rounded-md transition-colors"
                          title="Carry forward incomplete subtopics into a new lesson plan"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                          Carry Forward Topic
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
