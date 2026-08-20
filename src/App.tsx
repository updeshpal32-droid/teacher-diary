import React, { useState, useEffect } from 'react';
import { db, initializeDatabaseIfEmpty, TEMPLATE_PAGES_MAP, TEMPLATE_PAGES_MAP_FOUNDATIONAL } from './lib/storage';
import { SchoolSessionForm } from './components/SchoolSessionForm';
import { TeacherProfileForm } from './components/TeacherProfileForm';
import { StudentProfileManager } from './components/StudentProfileManager';
import { ClassSubjectManager } from './components/ClassSubjectManager';
import { TimetablePlanner } from './components/TimetablePlanner';
import { KvsCalendarManager } from './components/KvsCalendarManager';
import { ExamScheduleManager } from './components/ExamScheduleManager';
import SyllabusPlanner from './components/SyllabusPlanner';
import DailyLessonPlanEditor from './components/DailyLessonPlanEditor';
import { AssessmentProgressManager } from './components/AssessmentProgressManager';
import { InspectionReviewManager } from './components/InspectionReviewManager';
import { TemplateReportGenerator } from './components/TemplateReportGenerator';
import { TeacherDashboard } from './components/TeacherDashboard';
import { SettingsManager } from './components/SettingsManager';
import { TemplateMappingDrawer } from './components/TemplateMappingDrawer';
import { WorkloadTracker } from './components/WorkloadTracker';
import { TaskManager } from './components/TaskManager';
import { MobileNavigation } from './components/MobileNavigation';

// Foundational & Preparatory Stage Components
import MonitoringCumReportingTool from './components/MonitoringCumReportingTool';
import NipunMeetingsManager from './components/NipunMeetingsManager';
import StaffMeetingManager from './components/StaffMeetingManager';
import SubjectCommitteeManager from './components/SubjectCommitteeManager';
import PtmMeetingManager from './components/PtmMeetingManager';
import ScholasticAssessmentItoII from './components/ScholasticAssessmentItoII';
import NotebookCorrectionIIItoV from './components/NotebookCorrectionIIItoV';
import SeaEvaluationIIItoV from './components/SeaEvaluationIIItoV';
import ScholasticAssessmentIIItoV from './components/ScholasticAssessmentIIItoV';
import ResultAnalysisIIItoV from './components/ResultAnalysisIIItoV';
import ResultAnalysisVItoX from './components/ResultAnalysisVItoX';
import ResultAnalysisXItoXII from './components/ResultAnalysisXItoXII';
import ResultAnalysisManagerVItoXII from './components/ResultAnalysisManagerVItoXII';
import StudentBehaviourObservationManager from './components/StudentBehaviourObservationManager';
import RemedialAssistancePlan20a from './components/RemedialAssistancePlan20a';
import RemedialTeachingDetails20b from './components/RemedialTeachingDetails20b';
import RemedialPerformanceTracking20c from './components/RemedialPerformanceTracking20c';
import ExemplaryChildren21 from './components/ExemplaryChildren21';
import { RemedialAndExemplaryManager } from './components/RemedialTeachingManager20';
import InstitutionalMeetingsManager22to24 from './components/InstitutionalMeetingsManager22to24';
import OralReadingFluencyTracker from './components/OralReadingFluencyTracker';
import ScholasticAssessmentManager from './components/ScholasticAssessmentManager';
import PedagogicalRecords28To30 from './components/PedagogicalRecords28To30';

import { ErrorBoundary } from './components/ErrorBoundary';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { AdminTeacherContextBar } from './components/AdminTeacherContextBar';
import { RoleAssignmentModal, RoleAssignmentAction } from './components/RoleAssignmentModal';
import { getActiveInspectedTeacher } from './lib/teacherContext';
import { StaffDetailRecord } from './types/academic';

import {
  Building2,
  User,
  BookOpen,
  Clock,
  Calendar as CalIcon,
  Award,
  Layers,
  Code,
  Sparkles,
  Menu,
  X,
  CheckCircle2,
  FileText,
  RotateCcw,
  BookMarked,
  ClipboardCheck,
  ShieldCheck,
  Printer,
  LayoutDashboard,
  Settings,
  Sun,
  Moon,
  Activity,
  ListTodo,
  Users,
  Target,
  Mic,
  TrendingUp,
  Eye,
  BookmarkCheck,
  HeartHandshake,
  GraduationCap,
  Sparkle,
  History,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight
} from 'lucide-react';
import { UserAccount, canAccessTab, getRoleBadgeInfo } from './types/auth';
import { getCurrentUser, setCurrentUser } from './lib/storage';
import { AuthLoginModal } from './components/AuthLoginModal';

export type DiaryMode = 'middle-secondary' | 'foundational-preparatory';

export type TabKey =
  | 'dashboard'
  | 'taskmanager'
  | 'workload'
  | 'school'
  | 'teacher'
  | 'students'
  | 'classes'
  | 'timetable'
  | 'calendar'
  | 'exams'
  | 'syllabus'
  | 'lessonplan'
  | 'assessment'
  | 'result_analysis_vi_xii'
  | 'result_analysis_vi_x'
  | 'result_analysis_xi_xii'
  | 'student_observations'
  | 'remedial_exemplary_20_21'
  | 'remedial_teaching_20'
  | 'remedial_20a'
  | 'remedial_20b'
  | 'remedial_20c'
  | 'exemplary_21'
  | 'institutional_meetings_22_24'
  | 'ptm_meeting_22'
  | 'staff_meeting_23'
  | 'subject_meeting_24'
  | 'pedagogical_28_30'
  | 'inspection'
  | 'reports'
  | 'settings'
  // Foundational-specific routes
  | 'monitoring'
  | 'nipun'
  | 'staff_meeting'
  | 'subject_meeting'
  | 'ptm_meeting'
  | 'scholastic_primary'
  | 'scholastic_1_2'
  | 'notebook_3_5'
  | 'sea_3_5'
  | 'scholastic_3_5_t1'
  | 'scholastic_3_5_t2'
  | 'result_analysis'
  | 'orf_tara';

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  workload: 'Workload & Tracker',
  school: 'School & Session Setup',
  teacher: "Teacher's Profile",
  students: 'Student Profiles',
  classes: 'Classes & Subjects',
  timetable: 'Timetable Planner',
  calendar: 'Calendar & Vacations',
  exams: 'Exam Schedule',
  syllabus: 'Syllabus Planner',
  lessonplan: 'Daily Lesson Plans',
  assessment: 'Progress & Assessment',
  inspection: 'Monthly Review',
  reports: 'Reports & Output',
  settings: 'Settings & Cloud Backup',
  monitoring_tool: 'Monitoring Tool',
  nipun_meetings: 'NIPUN Meetings',
  staff_meetings: 'Staff Meetings',
  subject_committee: 'Subject Committee',
  ptm_meetings: 'PTM Meetings',
  scholastic_1_2: 'Scholastic Assessment (I-II)',
  notebook_3_5: 'Notebook Correction (III-V)',
  sea_3_5: 'Subject Enrichment (III-V)',
  scholastic_3_5: 'Scholastic Progress (III-V)',
  result_analysis_vi_xii: 'Result Analysis (VI-XII)',
  student_observation_28_30: 'Student Observation (P-28-30)',
  remedial_exemplary_20_21: 'Remedial & Exemplary (P-20-21)',
  institutional_meetings_22_24: 'Institutional Meetings (P-22-24)',
  orf_tracker: 'Oral Reading Fluency (FLN)',
};

const formatTabTitle = (tabKey?: string): string => {
  if (!tabKey) return 'Dashboard';
  return TAB_LABELS[tabKey] || tabKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function App() {
  const [diaryMode, setDiaryMode] = useState<DiaryMode>('middle-secondary');
  const [activeTab, setActiveTabState] = useState<TabKey>('dashboard');

  // Navigation History Stack (Back / Forward)
  const [historyStack, setHistoryStack] = useState<TabKey[]>(['dashboard']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const setActiveTab = (newTab: TabKey | string) => {
    const target = newTab as TabKey;
    setActiveTabState(current => {
      if (target === current) return current;
      setHistoryStack(prev => {
        const trimmed = prev.slice(0, historyIndex + 1);
        return [...trimmed, target];
      });
      setHistoryIndex(prev => prev + 1);
      return target;
    });
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setActiveTabState(historyStack[prevIdx]);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setActiveTabState(historyStack[nextIdx]);
    }
  };

  const [devMode, setDevMode] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Authentication & RBAC User State
  const [currentUser, setCurrentUserAccount] = useState<UserAccount | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);
  const [activeInspectedTeacher, setActiveInspectedTeacherState] = useState<StaffDetailRecord | null>(null);

  // KVS Samagam Assign Roles Dropdown & Modal State (Admin Only)
  const [isAssignRolesModalOpen, setIsAssignRolesModalOpen] = useState<boolean>(false);
  const [assignRoleInitialAction, setAssignRoleInitialAction] = useState<RoleAssignmentAction>('class_teacher');
  const [assignRoleTargetRoleId, setAssignRoleTargetRoleId] = useState<string | undefined>(undefined);

  // Keyboard navigation shortcuts (Alt + ArrowLeft for Back, Alt + ArrowRight for Forward)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGoBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleGoForward();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, historyStack]);

  useEffect(() => {
    initApp();

    const handleSchoolUpdate = async () => {
      const user = await getCurrentUser();
      if (user) setCurrentUserAccount(user);
    };

    const handleTeacherChanged = (e: any) => {
      setActiveInspectedTeacherState(e.detail as StaffDetailRecord | null);
    };

    window.addEventListener('kvs-school-updated', handleSchoolUpdate);
    window.addEventListener('kvs-active-teacher-changed', handleTeacherChanged);

    return () => {
      window.removeEventListener('kvs-school-updated', handleSchoolUpdate);
      window.removeEventListener('kvs-active-teacher-changed', handleTeacherChanged);
    };
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const initApp = async () => {
    await initializeDatabaseIfEmpty();
    const savedTheme = await db.get<'dark' | 'light'>('settings:theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }

    const savedMode = (await db.get<DiaryMode>('settings:diary_mode')) || 'middle-secondary';
    setDiaryMode(savedMode);

    const [user, inspectedTeacher] = await Promise.all([
      getCurrentUser(),
      getActiveInspectedTeacher()
    ]);

    setCurrentUserAccount(user);

    // Load user-scoped devMode / Page Ref preference (Default to OFF = false)
    if (user) {
      const userDevMode = await db.get<boolean>(`settings:dev_mode:${user.employeeCode || user.id}`);
      setDevMode(userDevMode ?? false);
    } else {
      const guestDevMode = await db.get<boolean>('settings:dev_mode:guest');
      setDevMode(guestDevMode ?? false);
    }

    if (inspectedTeacher && user?.role === 'admin') {
      setActiveInspectedTeacherState(inspectedTeacher);
    }
    if (!user) {
      setIsLoginModalOpen(true);
    }

    setInitialized(true);
  };

  const handleLoginSuccess = async (user: UserAccount) => {
    setCurrentUserAccount(user);
    setIsLoginModalOpen(false);
    setIsUserDropdownOpen(false);

    if (user.role !== 'admin') {
      setActiveInspectedTeacherState(null);
    }

    // Load this specific user's scoped devMode / Page Ref setting (default false / OFF)
    const userDevMode = await db.get<boolean>(`settings:dev_mode:${user.employeeCode || user.id}`);
    setDevMode(userDevMode ?? false);

    window.dispatchEvent(new CustomEvent('kvs-auth-changed', { detail: user }));
    window.dispatchEvent(new CustomEvent('kvs-active-teacher-changed', { detail: user.role === 'admin' ? activeInspectedTeacher : null }));

    // When logged in through either Teacher or Admin, always land on Dashboard
    setActiveTab('dashboard');
  };

  const handleToggleDevMode = async () => {
    const nextVal = !devMode;
    setDevMode(nextVal);
    if (currentUser) {
      await db.set(`settings:dev_mode:${currentUser.employeeCode || currentUser.id}`, nextVal);
    } else {
      await db.set('settings:dev_mode:guest', nextVal);
    }
  };

  const handleLogout = async () => {
    await setCurrentUser(null);
    setCurrentUserAccount(null);
    setIsUserDropdownOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleToggleTheme = async (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    await db.set('settings:theme', newTheme);
  };

  const handleDiaryModeChange = async (newMode: DiaryMode) => {
    if (newMode === diaryMode) return;
    setDiaryMode(newMode);
    await db.set('settings:diary_mode', newMode);

    // Reset tab to prevent template mismatches
    setActiveTab('dashboard');
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#0F111A] flex items-center justify-center text-purple-300 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-serif text-white font-bold text-xl shadow-lg animate-pulse">
            TD
          </div>
          <div className="text-sm tracking-wide">Initializing Teacher's Diary Dual-Mode Shell...</div>
        </div>
      </div>
    );
  }

  const isFoundational = diaryMode === 'foundational-preparatory';

  // Page trace mapping for active tab
  const getActivePageRef = (): { page: string; maxPages: number } => {
    if (isFoundational) {
      switch (activeTab) {
        case 'dashboard': return { page: 'Dashboard', maxPages: 34 };
        case 'taskmanager': return { page: 'P-12 & 32', maxPages: 34 };
        case 'workload': return { page: 'P-8 & 9', maxPages: 34 };
        case 'school': return { page: 'P-1 & 2', maxPages: 34 };
        case 'teacher': return { page: 'P-3', maxPages: 34 };
        case 'students': return { page: 'P-15', maxPages: 34 };
        case 'classes': return { page: 'P-10', maxPages: 34 };
        case 'timetable': return { page: 'P-6 & 7', maxPages: 34 };
        case 'calendar': return { page: 'P-5', maxPages: 34 };
        case 'monitoring': return { page: 'P-13 & 14c', maxPages: 34 };
        case 'nipun': return { page: 'P-16', maxPages: 34 };
        case 'staff_meeting': return { page: 'P-17', maxPages: 34 };
        case 'subject_meeting': return { page: 'P-18', maxPages: 34 };
        case 'ptm_meeting': return { page: 'P-19', maxPages: 34 };
        case 'scholastic_primary': return { page: 'P-21, 25, 26', maxPages: 34 };
        case 'scholastic_1_2': return { page: 'P-21', maxPages: 34 };
        case 'notebook_3_5': return { page: 'P-15 & 16', maxPages: 34 };
        case 'sea_3_5': return { page: 'P-17, 18 & 19', maxPages: 34 };
        case 'scholastic_3_5_t1': return { page: 'P-25', maxPages: 34 };
        case 'scholastic_3_5_t2': return { page: 'P-26', maxPages: 34 };
        case 'result_analysis': return { page: 'P-23 (2 pages)', maxPages: 34 };
        case 'orf_tara': return { page: 'P-28', maxPages: 34 };
        case 'lessonplan': return { page: 'P-33', maxPages: 34 };
        case 'reports': return { page: 'P-1 to 34 Master', maxPages: 34 };
        default: return { page: 'P-1', maxPages: 34 };
      }
    } else {
      switch (activeTab) {
        case 'dashboard': return { page: 'Dashboard', maxPages: 52 };
        case 'taskmanager': return { page: 'P-18 & 32', maxPages: 52 };
        case 'workload': return { page: 'P-10 & 11', maxPages: 52 };
        case 'school': return { page: 'P-1 & 2', maxPages: 52 };
        case 'teacher': return { page: 'P-3 & 4', maxPages: 52 };
        case 'students': return { page: 'P-21', maxPages: 52 };
        case 'classes': return { page: 'P-8 & 9', maxPages: 52 };
        case 'timetable': return { page: 'P-6 & 7', maxPages: 52 };
        case 'calendar': return { page: 'P-33', maxPages: 52 };
        case 'exams': return { page: 'P-34', maxPages: 52 };
        case 'syllabus': return { page: 'P-12 to 15', maxPages: 52 };
        case 'lessonplan': return { page: 'P-32', maxPages: 52 };
        case 'assessment': return { page: 'P-17 to 20', maxPages: 52 };
        case 'result_analysis_vi_xii': return { page: 'P-31 & 32', maxPages: 52 };
        case 'result_analysis_vi_x': return { page: 'P-31', maxPages: 52 };
        case 'result_analysis_xi_xii': return { page: 'P-32', maxPages: 52 };
        case 'student_observations': return { page: 'P-33', maxPages: 52 };
        case 'remedial_exemplary_20_21': return { page: 'P-34 to 37', maxPages: 52 };
        case 'remedial_teaching_20': return { page: 'P-34 to 36', maxPages: 52 };
        case 'remedial_20a': return { page: 'P-34', maxPages: 52 };
        case 'remedial_20b': return { page: 'P-35', maxPages: 52 };
        case 'remedial_20c': return { page: 'P-36', maxPages: 52 };
        case 'exemplary_21': return { page: 'P-37', maxPages: 52 };
        case 'institutional_meetings_22_24': return { page: 'P-38 to 51', maxPages: 52 };
        case 'ptm_meeting_22': return { page: 'P-38 to 41', maxPages: 52 };
        case 'staff_meeting_23': return { page: 'P-42 to 46', maxPages: 52 };
        case 'subject_meeting_24': return { page: 'P-47 to 51', maxPages: 52 };
        case 'inspection': return { page: 'P-4, 48, 50', maxPages: 52 };
        case 'reports': return { page: 'P-1 to 52 Master', maxPages: 52 };
        default: return { page: 'P-1', maxPages: 52 };
      }
    }
  };

  const pageTrace = getActivePageRef();

  return (
    <div className="td-root">
      {/* Top Header Navbar */}
      <header className="td-header">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="td-menu-btn"
            title="Open Navigation Menu (Auto-closes when cursor moves away)"
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? <X className="w-4 h-4 text-purple-300" /> : <Menu className="w-4 h-4 text-purple-300" />}
            <span className="text-xs font-semibold">Menu</span>
          </button>

          {/* In-App Back & Forward History Navigation Buttons */}
          <div className="flex items-center bg-black/25 dark:bg-black/40 p-0.5 rounded-xl border border-[var(--glass-border)] shrink-0 shadow-xs">
            <button
              type="button"
              onClick={handleGoBack}
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                historyIndex > 0
                  ? 'text-white hover:bg-purple-600/40 hover:text-purple-200 cursor-pointer active:scale-95 shadow-xs'
                  : 'text-slate-500 opacity-40 cursor-not-allowed'
              }`}
              title={
                historyIndex > 0
                  ? `Back to: ${formatTabTitle(historyStack[historyIndex - 1])} (Alt + ←)`
                  : 'Back (No previous page)'
              }
              aria-label="Navigate back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-3.5 bg-slate-700/60 my-auto" />

            <button
              type="button"
              onClick={handleGoForward}
              disabled={historyIndex >= historyStack.length - 1}
              className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                historyIndex < historyStack.length - 1
                  ? 'text-white hover:bg-purple-600/40 hover:text-purple-200 cursor-pointer active:scale-95 shadow-xs'
                  : 'text-slate-500 opacity-40 cursor-not-allowed'
              }`}
              title={
                historyIndex < historyStack.length - 1
                  ? `Forward to: ${formatTabTitle(historyStack[historyIndex + 1])} (Alt + →)`
                  : 'Forward (No next page)'
              }
              aria-label="Navigate forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className={`td-brand-mark font-serif shrink-0 ${isFoundational ? 'bg-gradient-to-br from-indigo-500 to-violet-700' : ''}`}>
            KV
          </div>
          
          <div className="min-w-0">
            <div className="td-brand-name truncate">
              <span className="hidden sm:inline">KVS Teacher's Diary</span>
              <span className="sm:hidden">KVS Diary</span>
            </div>
            <div className="td-brand-sub hidden sm:flex items-center gap-1.5 truncate">
              <span>{isFoundational ? 'Foundational (Balvatika-V, 34-P)' : 'Secondary (VI-XII, 52-P)'}</span>
            </div>
          </div>
        </div>

        {/* Dual-Mode Desktop Header Toggle */}
        <div className="hidden md:flex items-center bg-black/20 dark:bg-black/40 p-1 rounded-lg border border-[var(--glass-border)] backdrop-blur-md shrink-0">
          <button
            type="button"
            onClick={() => handleDiaryModeChange('foundational-preparatory')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              isFoundational
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'
            }`}
            title="Switch to Foundational & Preparatory Stage (Balvatika to V)"
          >
            <Sparkle className="w-3.5 h-3.5" />
            <span>Balvatika – V</span>
          </button>

          <button
            type="button"
            onClick={() => handleDiaryModeChange('middle-secondary')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              !isFoundational
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'
            }`}
            title="Switch to Middle & Secondary Stage (VI to XII)"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>VI – XII</span>
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Mode Quick Switch */}
          <button
            onClick={() => handleToggleTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
              theme === 'light'
                ? 'bg-purple-100 border-purple-300 text-purple-900 hover:bg-purple-200 shadow-sm'
                : 'bg-purple-950/60 border-purple-500/30 text-purple-200 hover:bg-purple-900/80'
            }`}
            title="Switch Theme Mode"
            aria-label="Toggle light or dark theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden xl:inline ml-1">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden xl:inline ml-1">Dark</span>
              </>
            )}
          </button>

          {/* Dev Mode Toggle */}
          <button
            onClick={handleToggleDevMode}
            className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer shrink-0 ${
              devMode
                ? isFoundational
                  ? 'bg-indigo-900/80 text-indigo-200 border-indigo-400/50 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'bg-purple-900/80 text-purple-200 border-purple-400/50 shadow-[0_0_12px_rgba(165,148,249,0.3)]'
                : theme === 'light'
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-white/5 text-[var(--text-dim)] border-[var(--glass-border)]'
            }`}
            title="Toggle Template Page Reference Badging in UI"
          >
            <Code className="w-3.5 h-3.5 text-purple-400 hidden sm:inline" />
            <span className="hidden md:inline">Page Ref</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${devMode ? (isFoundational ? 'bg-indigo-500 text-white' : 'bg-purple-500 text-white') : 'bg-slate-300 text-slate-800 dark:bg-gray-800 dark:text-gray-200'}`}>
              {devMode ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Version History & Snapshots Trigger */}
          <button
            onClick={() => setIsVersionModalOpen(true)}
            className={`flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer shrink-0 ${
              isFoundational
                ? 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-100 border-indigo-400/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                : 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-100 border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
            }`}
            title="Open Versioned Snapshots & Revision Control System"
            aria-label="Version History"
          >
            <History className="w-4 h-4 text-purple-300" />
            <span className="hidden sm:inline ml-1.5">Version History</span>
          </button>

          {/* Template Inspector Trigger */}
          <button
            onClick={() => setIsInspectorOpen(true)}
            className={`flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer shrink-0 ${
              isFoundational
                ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border-indigo-400/30'
                : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border-purple-400/30'
            }`}
            title={`Inspect all ${isFoundational ? 34 : 52} PDF Template Page Mappings`}
            aria-label="Inspect Page Mappings"
          >
            <Layers className="w-4 h-4 text-indigo-300" />
            <span className="hidden sm:inline ml-1.5">{isFoundational ? '34' : '52'} Page Map</span>
          </button>

          {/* User Account / Role Badge & Dropdown */}
          <div className="relative">
            {currentUser ? (
              <div>
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                    currentUser.role === 'admin'
                      ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-500/40 text-rose-200'
                      : currentUser.role === 'data_entry_manager'
                      ? 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-500/40 text-amber-200'
                      : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/40 text-emerald-200'
                  }`}
                  title="Current Active User Session (Click to view profile / switch account)"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold font-serif text-[11px] shadow-sm">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden lg:flex flex-col text-left leading-tight">
                    <span className="font-bold text-white text-[11px] truncate max-w-[130px]">{currentUser.name}</span>
                    <span className="text-[9px] text-[var(--text-dim)] font-mono">
                      {currentUser.designation || currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-[var(--glass-border)] rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn space-y-3">
                    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{currentUser.name}</span>
                        {(() => {
                          const b = getRoleBadgeInfo(currentUser.role, currentUser.designation);
                          return (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${b.bg} ${b.text} border ${b.border}`}>
                              {b.icon} {b.label}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-[10px] text-[var(--text-dim)] font-mono truncate">{currentUser.email}</div>
                      <div className="text-[10px] text-[var(--text-dim)] font-mono">Code: {currentUser.employeeCode}</div>
                      {currentUser.isClassTeacherOf && (
                        <div className="text-[10px] text-emerald-400 font-semibold pt-0.5">
                          ⭐ Class Teacher: {currentUser.isClassTeacherOf}
                        </div>
                      )}
                    </div>

                    {/* Assigned Classes Preview */}
                    {currentUser.role === 'teacher' && currentUser.assignedClasses && currentUser.assignedClasses.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">
                          Assigned Classes:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {currentUser.assignedClasses.map(cls => (
                            <span
                              key={cls}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/60 text-purple-200 border border-purple-500/20"
                            >
                              {cls}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[var(--glass-border)] space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setIsLoginModalOpen(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 text-xs font-semibold flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />
                          <span>Switch Role / Account</span>
                        </div>
                        <span className="text-[10px] text-purple-400">1-Click</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Principal Active Teacher Inspection Bar (Admin Only) */}
      {currentUser?.role === 'admin' && (
        <AdminTeacherContextBar
          activeTeacher={activeInspectedTeacher}
          onSelectTeacher={setActiveInspectedTeacherState}
          onNavigateTab={(tab) => setActiveTab(tab as TabKey)}
          activeTab={activeTab}
          onOpenRoleAssignment={(action, roleId) => {
            setAssignRoleInitialAction(action);
            setAssignRoleTargetRoleId(roleId);
            setIsAssignRolesModalOpen(true);
          }}
        />
      )}

      {/* Mobile Portal Mode Switcher - Placed Outside td-body */}
      <div className="md:hidden py-1.5 px-3 bg-[var(--glass)] border-b border-[var(--glass-border)] flex items-center justify-between gap-2 w-full z-20">
        <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Active Stage:</span>
        <div className="inline-flex bg-black/40 p-0.5 rounded-full border border-[var(--glass-border)] shrink-0">
          <button
            onClick={() => handleDiaryModeChange('foundational-preparatory')}
            className={`py-1 px-3 rounded-full text-[11px] font-semibold text-center transition-all flex items-center gap-1 cursor-pointer touch-manipulation ${
              isFoundational
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'
            }`}
          >
            <Sparkle className="w-3 h-3 text-amber-300" />
            <span>Balvatika–V (34P)</span>
          </button>
          <button
            onClick={() => handleDiaryModeChange('middle-secondary')}
            className={`py-1 px-3 rounded-full text-[11px] font-semibold text-center transition-all flex items-center gap-1 cursor-pointer touch-manipulation ${
              !isFoundational
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'
            }`}
          >
            <GraduationCap className="w-3 h-3 text-purple-300" />
            <span>VI–XII (52P)</span>
          </button>
        </div>
      </div>

      {/* Main App Layout Body */}
      <div className="td-body relative w-full min-w-0">
        {/* Backdrop Overlay when sidebar menu is open */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 cursor-pointer transition-opacity"
            title="Click outside to close menu"
          />
        )}

        {/* Navigation Sidebar Drawer - Closes when cursor leaves (onMouseLeave) */}
        <aside
          className={`td-side ${isSidebarOpen ? 'open' : ''}`}
          onMouseLeave={() => setIsSidebarOpen(false)}
        >
          <div className="px-1 pb-3 mb-2 border-b border-[var(--glass-border)] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-serif text-white text-xs font-bold shadow-xs shrink-0 ${isFoundational ? 'bg-gradient-to-br from-indigo-500 to-violet-700' : 'bg-gradient-to-br from-purple-600 to-indigo-700'}`}>
                KV
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-[var(--text-main)] leading-none truncate">
                  {isFoundational ? 'Foundational Portal' : 'Middle & Secondary'}
                </div>
                <div className="text-[9px] uppercase font-mono font-bold text-[var(--accent)] tracking-wider mt-0.5">
                  {isFoundational ? '34-Page NEP' : '52-Page KVS'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-dim)] hover:text-white transition-colors cursor-pointer"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* SHARED STANDARD TOP TABS */}
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setIsSidebarOpen(false);
            }}
            className={`td-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 text-amber-300" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('taskmanager');
              setIsSidebarOpen(false);
            }}
            className={`td-nav-item ${activeTab === 'taskmanager' ? 'active' : ''}`}
          >
            <ListTodo className="w-4 h-4 shrink-0 text-purple-400" />
            <span>Task Management System</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('workload');
              setIsSidebarOpen(false);
            }}
            className={`td-nav-item ${activeTab === 'workload' ? 'active' : ''}`}
          >
            <Activity className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Workload & Hourly Tracker</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('school');
              setIsSidebarOpen(false);
            }}
            className={`td-nav-item ${activeTab === 'school' ? 'active' : ''}`}
          >
            <Building2 className="w-4 h-4 shrink-0 text-purple-300" />
            <span>School & Session Setup</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('teacher');
              setIsSidebarOpen(false);
            }}
            className={`td-nav-item ${activeTab === 'teacher' ? 'active' : ''}`}
          >
            <User className="w-4 h-4 shrink-0 text-purple-300" />
            <span>Teacher&apos;s Profile</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('students');
              setIsSidebarOpen(false);
            }}
            className={`td-nav-item ${activeTab === 'students' ? 'active' : ''}`}
          >
            <Users className="w-4 h-4 shrink-0 text-purple-300" />
            <span>Student Profiles & Roster</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('classes');
              setIsSidebarOpen(false);
            }}
            className={`td-nav-item ${activeTab === 'classes' ? 'active' : ''}`}
          >
            <BookOpen className="w-4 h-4 shrink-0 text-purple-300" />
            <span>Classes & Subjects Setup</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('timetable');
              setIsSidebarOpen(false);
            }}
            className={`td-nav-item ${activeTab === 'timetable' ? 'active' : ''}`}
          >
            <Clock className="w-4 h-4 shrink-0 text-purple-300" />
            <span>Weekly Timetable Planner</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('calendar');
              setIsSidebarOpen(false);
            }}
            className={`td-nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
          >
            <CalIcon className="w-4 h-4 shrink-0 text-purple-300" />
            <span>Calendar & Holidays</span>
          </button>

          {/* DYNAMIC STAGE-SPECIFIC NAVIGATION TREES */}
          {isFoundational ? (
            /* FOUNDATIONAL & PREPARATORY STAGE MENU (NEP 2020 / NIPUN BHARAT) */
            <>
              <div className="px-3 pt-3 pb-1 mt-2 border-t border-[var(--glass-border)]">
                <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                  FLN & Foundational Assessment
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('monitoring');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'monitoring' ? 'active' : ''}`}
              >
                <Target className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>{devMode ? '13-14c. Monitoring & Remedials' : 'Monitoring & Remedials'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('nipun');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'nipun' ? 'active' : ''}`}
              >
                <BookOpen className="w-4 h-4 shrink-0 text-indigo-300" />
                <span>{devMode ? '16. NIPUN FLN Meetings Gist' : 'NIPUN FLN Meetings Gist'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('staff_meeting');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'staff_meeting' ? 'active' : ''}`}
              >
                <Users className="w-4 h-4 shrink-0 text-purple-300" />
                <span>{devMode ? '17. Staff Meetings Gist' : 'Staff Meetings Gist'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('subject_meeting');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'subject_meeting' ? 'active' : ''}`}
              >
                <BookMarked className="w-4 h-4 shrink-0 text-purple-300" />
                <span>{devMode ? '18. Subject Committee Gist' : 'Subject Committee Gist'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('ptm_meeting');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'ptm_meeting' ? 'active' : ''}`}
              >
                <HeartHandshake className="w-4 h-4 shrink-0 text-purple-300" />
                <span>{devMode ? '19. PTM Meetings Record' : 'PTM Meetings Record'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('scholastic_primary');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${(activeTab === 'scholastic_primary' || activeTab === 'scholastic_1_2' || activeTab === 'scholastic_3_5_t1' || activeTab === 'scholastic_3_5_t2') ? 'active' : ''}`}
              >
                <Award className="w-4 h-4 shrink-0 text-amber-400" />
                <div className="flex flex-col text-left">
                  <span>{devMode ? '21/26. Scholastic Assessment (I-V)' : 'Scholastic Assessment (I-V)'}</span>
                  <span className="text-[10px] text-amber-300/80 font-normal">Foundational & Prep Stage</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('notebook_3_5');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'notebook_3_5' ? 'active' : ''}`}
              >
                <BookmarkCheck className="w-4 h-4 shrink-0 text-indigo-300" />
                <span>{devMode ? '22. Notebook Correction (III-V)' : 'Notebook Correction (III-V)'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('sea_3_5');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'sea_3_5' ? 'active' : ''}`}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{devMode ? '23. SEA Rubric Evaluation (III-V)' : 'SEA Rubric Evaluation (III-V)'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('result_analysis');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'result_analysis' ? 'active' : ''}`}
              >
                <TrendingUp className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{devMode ? '27. Result Analysis (III-V)' : 'Result Analysis (III-V)'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('orf_tara');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'orf_tara' ? 'active' : ''}`}
              >
                <Mic className="w-4 h-4 shrink-0 text-purple-400" />
                <span>{devMode ? '28. Tara Oral Reading Fluency' : 'Tara Oral Reading Fluency'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('lessonplan');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'lessonplan' ? 'active' : ''}`}
              >
                <FileText className="w-4 h-4 shrink-0 text-purple-300" />
                <span>{devMode ? '33. Daily Lesson Plan Organiser' : 'Daily Lesson Plan Organiser'}</span>
              </button>
            </>
          ) : (
            /* MIDDLE & SECONDARY STAGE MENU (CLASSES VI-XII) */
            <>
              <div className="px-3 pt-3 pb-1 mt-2 border-t border-[var(--glass-border)]">
                <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                  Secondary Curriculum & Evaluation
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('syllabus');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'syllabus' ? 'active' : ''}`}
              >
                <BookMarked className="w-4 h-4 shrink-0 text-purple-300" />
                <span>{devMode ? '12. Month Split-Up Syllabus' : 'Month Split-Up Syllabus'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('lessonplan');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'lessonplan' ? 'active' : ''}`}
              >
                <FileText className="w-4 h-4 shrink-0 text-purple-300" />
                <span>{devMode ? '32. Daily Lesson Plan Organiser' : 'Daily Lesson Plan Organiser'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('exams');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'exams' ? 'active' : ''}`}
              >
                <Award className="w-4 h-4 shrink-0 text-purple-300" />
                <span>Exam & PT Assessment Plans</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('assessment');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'assessment' ? 'active' : ''}`}
              >
                <ClipboardCheck className="w-4 h-4 shrink-0 text-purple-300" />
                <span>{devMode ? '17-21. Progress & Assessment' : 'Progress & Assessment'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('result_analysis_vi_xii');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'result_analysis_vi_xii' || activeTab === 'result_analysis_vi_x' || activeTab === 'result_analysis_xi_xii' ? 'active' : ''}`}
              >
                <TrendingUp className="w-4 h-4 shrink-0 text-purple-400" />
                <span>{devMode ? '18. Result Analysis (VI-XII)' : 'Result Analysis (VI-XII)'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('student_observations');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'student_observations' ? 'active' : ''}`}
              >
                <Eye className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{devMode ? '19. Student Observations' : 'Student Observations'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('remedial_exemplary_20_21');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'remedial_exemplary_20_21' || activeTab === 'remedial_teaching_20' || activeTab === 'remedial_20a' || activeTab === 'remedial_20b' || activeTab === 'remedial_20c' || activeTab === 'exemplary_21' ? 'active' : ''}`}
              >
                <Target className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{devMode ? '20-21. Remedial Teaching & Exemplary Children' : 'Remedial Teaching & Exemplary Children'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('institutional_meetings_22_24');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'institutional_meetings_22_24' || activeTab === 'ptm_meeting_22' || activeTab === 'staff_meeting_23' || activeTab === 'subject_meeting_24' ? 'active' : ''}`}
              >
                <HeartHandshake className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{devMode ? '22-24. Institutional Meetings' : 'Institutional Meetings'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('pedagogical_28_30');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'pedagogical_28_30' ? 'active' : ''}`}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-teal-400" />
                <span>{devMode ? '28-30. Pedagogical & Joyful Records' : 'Pedagogical & Joyful Records'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('inspection');
                  setIsSidebarOpen(false);
                }}
                className={`td-nav-item ${activeTab === 'inspection' ? 'active' : ''}`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-purple-300" />
                <span>{devMode ? '4, 48, 50. Inspection Approvals' : 'Inspection Approvals'}</span>
              </button>
            </>
          )}

          {/* COMMON BOTTOM NAVIGATION */}
          <button
            onClick={() => {
              setActiveTab('reports');
              setIsSidebarOpen(false);
            }}
            className={`td-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
          >
            <Printer className="w-4 h-4 shrink-0 text-amber-300" />
            <span>Master Print Reports</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              setIsSidebarOpen(false);
            }}
            className={`td-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings className="w-4 h-4 shrink-0 text-purple-300" />
            <span>Settings & Preferences</span>
          </button>

          {/* Help Box */}
          <div className="mt-auto pt-6 border-t border-[var(--glass-border)]">
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              isFoundational ? 'bg-indigo-950/40 border-indigo-500/20' : 'bg-purple-950/40 border-purple-500/20'
            }`}>
              <div className="font-semibold text-purple-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{isFoundational ? 'Foundational Stage Auto-Fill' : 'Middle Stage Auto-Fill'}</span>
              </div>
              <p className="text-[11px] text-[var(--text-dim)] m-0 leading-relaxed">
                {isFoundational
                  ? 'NIPUN Bharat & FLN competency scores auto-synchronize with diagnostic reports.'
                  : 'Teacher Profile, Timetable, and Split-up syllabus auto-fill throughout the 52 diary pages.'}
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          className="td-main"
          onClick={() => {
            if (isSidebarOpen) setIsSidebarOpen(false);
          }}
        >
          <div className="td-page">
            <div className="td-page-head">
              <div>
                <div className="td-eyebrow">
                  {isFoundational ? 'Foundational & Preparatory Stage (Balvatika - V)' : 'Middle & Secondary Stage (VI - XII)'}
                </div>
                <h1 className="td-h1">
                  {/* Shared Views */}
                  {activeTab === 'dashboard' && (currentUser?.role === 'admin' ? 'Analytics Dashboard' : 'Teacher Analytics Dashboard, Reminders & Search')}
                  {activeTab === 'taskmanager' && 'Teacher Task Management System, Eisenhower Matrix & Subtask Tracker'}
                  {activeTab === 'workload' && 'Hourly Activity Tracker, Verifiable Proof & Defensible Workload System'}
                  {activeTab === 'school' && 'Vidyalaya & Academic Session Setup'}
                  {activeTab === 'teacher' && "Teacher's Profile"}
                  {activeTab === 'students' && (devMode ? (isFoundational ? '15. Primary Student Profiles & Attendance Registry' : '16. Students’ Profile (Page 21), File Importer & Attendance') : (isFoundational ? 'Primary Student Profiles & Attendance Registry' : 'Students’ Profile, File Importer & Attendance'))}
                  {activeTab === 'classes' && 'Class Roster & Subject Setup'}
                  {activeTab === 'timetable' && 'Class & Teacher Timetable Planner'}
                  {activeTab === 'calendar' && (devMode ? (isFoundational ? '5. KVS Activity Calendar & Holidays' : '33. KVS Activity Calendar & Holidays') : 'KVS Activity Calendar & Holidays')}
                  
                  {/* Foundational Stage Specific Views */}
                  {activeTab === 'monitoring' && (devMode ? '13 & 14(c). Monitoring cum Remedial Reporting & Late Bloomer Progression Ledger' : 'Monitoring cum Remedial Reporting & Late Bloomer Progression Ledger')}
                  {activeTab === 'nipun' && (devMode ? '16. Record of Minutes of NIPUN / FLN Meetings' : 'Record of Minutes of NIPUN / FLN Meetings')}
                  {activeTab === 'staff_meeting' && (devMode ? '17. Record of Minutes of Staff Meetings' : 'Record of Minutes of Staff Meetings')}
                  {activeTab === 'subject_meeting' && (devMode ? '18. Subject Committee Meetings Gist' : 'Subject Committee Meetings Gist')}
                  {activeTab === 'ptm_meeting' && (devMode ? '19. Parent-Teacher Meeting (PTM) Record' : 'Parent-Teacher Meeting (PTM) Record')}
                  {(activeTab === 'scholastic_primary' || activeTab === 'scholastic_1_2' || activeTab === 'scholastic_3_5_t1' || activeTab === 'scholastic_3_5_t2') && (devMode ? '21 & 26. Scholastic Assessment Record Ledger (Classes I to V)' : 'Scholastic Assessment Record Ledger (Classes I to V)')}
                  {activeTab === 'notebook_3_5' && (devMode ? '22. Record of Notebook Correction & Regularity (Classes III to V)' : 'Record of Notebook Correction & Regularity (Classes III to V)')}
                  {activeTab === 'sea_3_5' && (devMode ? '23. Subject Enrichment Activities (SEA) Rubric Evaluation (Classes III to V)' : 'Subject Enrichment Activities (SEA) Rubric Evaluation (Classes III to V)')}
                  {activeTab === 'result_analysis' && (devMode ? '27. Subject-Wise Result Analysis & Grade Distribution (Classes III to V)' : 'Subject-Wise Result Analysis & Grade Distribution (Classes III to V)')}
                  {activeTab === 'orf_tara' && (devMode ? '28. Oral Reading Fluency (ORF) TARA Metric & Remedial Tracker' : 'Oral Reading Fluency (ORF) TARA Metric & Remedial Tracker')}

                  {/* Middle & Secondary Specific Views */}
                  {activeTab === 'syllabus' && (devMode ? '12. Month-Wise Split-Up Syllabus & Lesson Planner' : 'Month-Wise Split-Up Syllabus & Lesson Planner')}
                  {activeTab === 'lessonplan' && (devMode ? (isFoundational ? '33. Daily Lesson Plan Organiser' : '32. Daily & Period-Wise Lesson Plan Organiser') : 'Daily & Period-Wise Lesson Plan Organiser')}
                  {activeTab === 'exams' && 'Scholastic Assessment & Exam Planner'}
                  {activeTab === 'assessment' && (devMode ? '17-21. Assessment, Homework & Student Progress Records' : 'Assessment, Homework & Student Progress Records')}
                  {(activeTab === 'result_analysis_vi_xii' || activeTab === 'result_analysis_vi_x' || activeTab === 'result_analysis_xi_xii') && (devMode ? '18. Subject-Wise Result Analysis (Classes VI to XII)' : 'Subject-Wise Result Analysis (Classes VI to XII)')}
                  {activeTab === 'student_observations' && (devMode ? "19. Teacher's Observation on Students' Behaviour/Abilities" : "Teacher's Observation on Students' Behaviour/Abilities")}
                  {(activeTab === 'remedial_exemplary_20_21' || activeTab === 'remedial_teaching_20' || activeTab === 'remedial_20a' || activeTab === 'remedial_20b' || activeTab === 'remedial_20c' || activeTab === 'exemplary_21') && (devMode ? '20-21. Remedial Teaching & Exemplary Children Registers (20a, 20b, 20c, 21)' : 'Remedial Teaching & Exemplary Children Registers')}
                  {(activeTab === 'institutional_meetings_22_24' || activeTab === 'ptm_meeting_22' || activeTab === 'staff_meeting_23' || activeTab === 'subject_meeting_24') && (devMode ? '22-24. Institutional Meetings Registers (PTM, Staff & Subject Committee)' : 'Institutional Meetings Registers (PTM, Staff & Subject Committee)')}
                  {activeTab === 'pedagogical_28_30' && (devMode ? '28-30. Pedagogical Interventions & Joyful Learning Records' : 'Pedagogical Interventions & Joyful Learning Records')}
                  {activeTab === 'inspection' && (devMode ? '4, 48, 50. Supervisory Inspection, Review & Approval Workflow' : 'Supervisory Inspection, Review & Approval Workflow')}
                  {activeTab === 'reports' && 'Master Teacher Diary PDF & A4 Report Generator'}
                  {activeTab === 'settings' && 'System Preferences, Diary Mode & Settings'}
                </h1>
              </div>

              {/* Dev Mode Traceability Badge */}
              {devMode && (
                <div className={`px-3.5 py-2 rounded-xl border font-mono text-xs flex items-center gap-2.5 shadow-sm ${
                  isFoundational
                    ? 'bg-indigo-950/90 border-indigo-500/40 text-indigo-200'
                    : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                }`}>
                  <FileText className="w-4 h-4 text-purple-300" />
                  <div>
                    <span className="font-bold">
                      {isFoundational ? `FOUNDATIONAL PORTAL: ${pageTrace.page}/34` : `MIDDLE PORTAL: ${pageTrace.page}/52`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* VIEW CONTAINER PROTECTED BY ERROR BOUNDARY */}
            <ErrorBoundary fallbackTitle="View Rendering Error">
              {/* SHARED GENERAL VIEWS */}
              {activeTab === 'dashboard' && (
                <TeacherDashboard
                  key={currentUser?.id || 'guest'}
                  currentUser={currentUser}
                  devMode={devMode}
                  onNavigateTab={(tab) => setActiveTab(tab as TabKey)}
                />
              )}
              {activeTab === 'taskmanager' && (
                <TaskManager
                  currentUser={currentUser}
                  devMode={devMode}
                />
              )}
              {activeTab === 'workload' && (
                <WorkloadTracker
                  currentUser={currentUser}
                  devMode={devMode}
                />
              )}
              {activeTab === 'school' && <SchoolSessionForm devMode={devMode} />}
              {activeTab === 'teacher' && (
                <TeacherProfileForm
                  key={currentUser?.id || 'guest'}
                  currentUser={currentUser}
                  devMode={devMode}
                  onNavigateTab={(tab) => setActiveTab(tab as TabKey)}
                />
              )}
              {activeTab === 'students' && <StudentProfileManager devMode={devMode} />}
              {activeTab === 'classes' && <ClassSubjectManager devMode={devMode} />}
              {activeTab === 'timetable' && <TimetablePlanner devMode={devMode} />}
              {activeTab === 'calendar' && <KvsCalendarManager devMode={devMode} />}
              {activeTab === 'lessonplan' && <DailyLessonPlanEditor devMode={devMode} />}
              {activeTab === 'reports' && <TemplateReportGenerator devMode={devMode} />}
              {activeTab === 'settings' && (
                <SettingsManager
                  devMode={devMode}
                  onToggleDevMode={handleToggleDevMode}
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                  onNavigateTab={(tab) => setActiveTab(tab as TabKey)}
                  currentUser={currentUser}
                  onSwitchAccount={() => setIsLoginModalOpen(true)}
                />
              )}

              {/* FOUNDATIONAL & PREPARATORY STAGE VIEWS */}
              {isFoundational && (
                <>
                  {activeTab === 'monitoring' && <MonitoringCumReportingTool devMode={devMode} />}
                  {activeTab === 'nipun' && <NipunMeetingsManager devMode={devMode} />}
                  {activeTab === 'staff_meeting' && <StaffMeetingManager devMode={devMode} diaryMode="foundational-preparatory" />}
                  {activeTab === 'subject_meeting' && <SubjectCommitteeManager devMode={devMode} diaryMode="foundational-preparatory" />}
                  {activeTab === 'ptm_meeting' && <PtmMeetingManager devMode={devMode} diaryMode="foundational-preparatory" />}
                  {activeTab === 'scholastic_primary' && <ScholasticAssessmentManager devMode={devMode} initialStage="foundational" />}
                  {activeTab === 'scholastic_1_2' && <ScholasticAssessmentManager devMode={devMode} initialStage="foundational" />}
                  {activeTab === 'notebook_3_5' && <NotebookCorrectionIIItoV devMode={devMode} />}
                  {activeTab === 'sea_3_5' && <SeaEvaluationIIItoV devMode={devMode} />}
                  {activeTab === 'scholastic_3_5_t1' && <ScholasticAssessmentManager devMode={devMode} initialStage="preparatory" initialTerm={1} />}
                  {activeTab === 'scholastic_3_5_t2' && <ScholasticAssessmentManager devMode={devMode} initialStage="preparatory" initialTerm={2} />}
                  {activeTab === 'result_analysis' && <ResultAnalysisIIItoV devMode={devMode} />}
                  {activeTab === 'orf_tara' && <OralReadingFluencyTracker devMode={devMode} />}
                </>
              )}

              {/* MIDDLE & SECONDARY STAGE VIEWS */}
              {!isFoundational && (
                <>
                  {activeTab === 'syllabus' && <SyllabusPlanner devMode={devMode} />}
                  {activeTab === 'exams' && <ExamScheduleManager devMode={devMode} />}
                  {activeTab === 'assessment' && <AssessmentProgressManager devMode={devMode} />}
                  {(activeTab === 'result_analysis_vi_xii' || activeTab === 'result_analysis_vi_x') && (
                    <ResultAnalysisManagerVItoXII devMode={devMode} initialStage="18a" />
                  )}
                  {activeTab === 'result_analysis_xi_xii' && (
                    <ResultAnalysisManagerVItoXII devMode={devMode} initialStage="18b" />
                  )}
                  {activeTab === 'student_observations' && <StudentBehaviourObservationManager devMode={devMode} />}
                  {activeTab === 'remedial_exemplary_20_21' && <RemedialAndExemplaryManager devMode={devMode} initialSubTab="20a" />}
                  {activeTab === 'remedial_teaching_20' && <RemedialAndExemplaryManager devMode={devMode} initialSubTab="20a" />}
                  {activeTab === 'remedial_20a' && <RemedialAndExemplaryManager devMode={devMode} initialSubTab="20a" />}
                  {activeTab === 'remedial_20b' && <RemedialAndExemplaryManager devMode={devMode} initialSubTab="20b" />}
                  {activeTab === 'remedial_20c' && <RemedialAndExemplaryManager devMode={devMode} initialSubTab="20c" />}
                  {activeTab === 'exemplary_21' && <RemedialAndExemplaryManager devMode={devMode} initialSubTab="21" />}
                  {activeTab === 'institutional_meetings_22_24' && <InstitutionalMeetingsManager22to24 devMode={devMode} initialSubTab="22" />}
                  {activeTab === 'ptm_meeting_22' && <InstitutionalMeetingsManager22to24 devMode={devMode} initialSubTab="22" />}
                  {activeTab === 'staff_meeting_23' && <InstitutionalMeetingsManager22to24 devMode={devMode} initialSubTab="23" />}
                  {activeTab === 'subject_meeting_24' && <InstitutionalMeetingsManager22to24 devMode={devMode} initialSubTab="24" />}
                  {activeTab === 'pedagogical_28_30' && <PedagogicalRecords28To30 devMode={devMode} />}
                  {activeTab === 'inspection' && <InspectionReviewManager devMode={devMode} />}
                </>
              )}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Dynamic Template Inspector Drawer (34 vs 52 Pages) */}
      <TemplateMappingDrawer
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        diaryMode={diaryMode}
        templatePages={isFoundational ? TEMPLATE_PAGES_MAP_FOUNDATIONAL : TEMPLATE_PAGES_MAP}
      />

      {/* Versioned Snapshot & Revision History Modal */}
      <VersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        onDataRestored={() => initApp()}
      />

      {/* Mobile Bottom Navigation, FAB Speed Dial & Instant Page Search Drawer */}
      <MobileNavigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        diaryMode={diaryMode}
        onDiaryModeChange={handleDiaryModeChange}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        devMode={devMode}
        onToggleDevMode={() => setDevMode(!devMode)}
        onOpenInspector={() => setIsInspectorOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
      />

      {/* 3-Tier Staff Login & 1-Click Role Switcher Modal */}
      <AuthLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* KVS Samagam Assign Roles & Academic Portfolios Modal (Admin Only) */}
      <RoleAssignmentModal
        isOpen={isAssignRolesModalOpen}
        onClose={() => setIsAssignRolesModalOpen(false)}
        initialAction={assignRoleInitialAction}
        targetRoleId={assignRoleTargetRoleId}
      />
    </div>
  );
}
