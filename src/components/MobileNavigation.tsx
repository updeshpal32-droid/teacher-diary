import React, { useState, useMemo } from 'react';
import { TabKey, DiaryMode } from '../App';
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Award,
  Sparkles,
  Menu,
  X,
  Search,
  BookOpen,
  Clock,
  Calendar as CalIcon,
  Building2,
  User,
  FileText,
  BookmarkCheck,
  TrendingUp,
  Eye,
  Mic,
  HeartHandshake,
  BookMarked,
  ShieldCheck,
  Printer,
  Settings,
  Activity,
  Layers,
  Sparkle,
  GraduationCap,
  Sun,
  Moon,
  Code,
  CheckCircle2,
  Plus,
  ChevronRight,
  Target
} from 'lucide-react';

interface MobileNavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  diaryMode: DiaryMode;
  onDiaryModeChange: (mode: DiaryMode) => void;
  theme: 'dark' | 'light';
  onToggleTheme: (theme: 'dark' | 'light') => void;
  devMode: boolean;
  onToggleDevMode: () => void;
  onOpenInspector: () => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

interface NavItemDef {
  key: TabKey;
  title: string;
  subtitle: string;
  pageRef: string;
  category: 'daily' | 'academics' | 'assessment' | 'admin' | 'reports';
  icon: React.ReactNode;
  stageOnly?: DiaryMode;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onSelectTab,
  diaryMode,
  onDiaryModeChange,
  theme,
  onToggleTheme,
  devMode,
  onToggleDevMode,
  onOpenInspector,
  isOpen,
  onClose,
  onOpen
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'daily' | 'assessment' | 'academics' | 'admin' | 'reports'>('all');
  const [isFabOpen, setIsFabOpen] = useState(false);

  const isFoundational = diaryMode === 'foundational-preparatory';

  // Complete List of navigation items mapped by stage
  const allNavItems: NavItemDef[] = useMemo(() => {
    const items: NavItemDef[] = [
      // Core Daily
      {
        key: 'dashboard',
        title: 'Dashboard',
        subtitle: 'Overview, timetable context & quick actions',
        pageRef: isFoundational ? 'P-1 to 34' : 'P-1 to 52',
        category: 'daily',
        icon: <LayoutDashboard className="w-4 h-4 text-amber-400" />
      },
      {
        key: 'taskmanager',
        title: 'Task Management System',
        subtitle: 'Eisenhower matrix & subtask checklist',
        pageRef: isFoundational ? 'P-12 & 32' : 'P-18 & 32',
        category: 'daily',
        icon: <ListTodo className="w-4 h-4 text-purple-400" />
      },
      {
        key: 'workload',
        title: 'Workload & Hourly Tracker',
        subtitle: 'Verifiable proof & defensible teaching hours',
        pageRef: isFoundational ? 'P-8 & 9' : 'P-10 & 11',
        category: 'daily',
        icon: <Activity className="w-4 h-4 text-emerald-400" />
      },
      {
        key: 'lessonplan',
        title: isFoundational ? 'Daily Lesson Plan Organiser' : 'Period-Wise Lesson Plan Organiser',
        subtitle: 'Competencies, TLM & pedagogical outcomes',
        pageRef: isFoundational ? 'P-33' : 'P-32',
        category: 'daily',
        icon: <FileText className="w-4 h-4 text-indigo-400" />
      },
      {
        key: 'timetable',
        title: 'Weekly Timetable Planner',
        subtitle: 'Teacher & class-wise period schedule',
        pageRef: 'P-6 & 7',
        category: 'daily',
        icon: <Clock className="w-4 h-4 text-cyan-400" />
      },

      // Admin & Setup
      {
        key: 'school',
        title: 'School & Session Setup',
        subtitle: 'Vidyalaya details, principal & committee',
        pageRef: 'P-1 & 2',
        category: 'admin',
        icon: <Building2 className="w-4 h-4 text-purple-300" />
      },
      {
        key: 'teacher',
        title: "Teacher's Profile",
        subtitle: 'Personal details, targets, duties, non-teaching & innovations',
        pageRef: isFoundational ? 'P-3' : 'P-3 & 4',
        category: 'admin',
        icon: <User className="w-4 h-4 text-purple-300" />
      },
      {
        key: 'students',
        title: isFoundational ? 'Primary Student Profiles & Roster' : 'Student Profiles & Attendance',
        subtitle: 'Master roster, admission numbers, batch sync',
        pageRef: isFoundational ? 'P-15' : 'P-21',
        category: 'admin',
        icon: <Users className="w-4 h-4 text-emerald-300" />
      },
      {
        key: 'classes',
        title: 'Class Roster & Subject Setup',
        subtitle: 'Class allotment, strengths & subject mapping',
        pageRef: isFoundational ? 'P-10' : 'P-8 & 9',
        category: 'admin',
        icon: <BookOpen className="w-4 h-4 text-indigo-300" />
      },
      {
        key: 'calendar',
        title: 'KVS Activity Calendar & Holidays',
        subtitle: 'CCA schedules, gazetted & restricted holidays',
        pageRef: isFoundational ? 'P-5' : 'P-33',
        category: 'admin',
        icon: <CalIcon className="w-4 h-4 text-rose-300" />
      }
    ];

    if (isFoundational) {
      // Foundational & Preparatory Specific
      items.push(
        {
          key: 'orf_tara',
          title: devMode ? '28. Tara Oral Reading Fluency' : 'Tara Oral Reading Fluency',
          subtitle: 'WCPM benchmarks & NIPUN remedial tracker',
          pageRef: 'P-28',
          category: 'assessment',
          icon: <Mic className="w-4 h-4 text-purple-400" />
        },
        {
          key: 'scholastic_primary',
          title: devMode ? '21/26. Scholastic Assessment (I-V)' : 'Scholastic Assessment (I-V)',
          subtitle: 'Continuous diagnostic ledger & Term evaluations',
          pageRef: 'P-21, 25, 26',
          category: 'assessment',
          icon: <Award className="w-4 h-4 text-amber-400" />
        },
        {
          key: 'monitoring',
          title: devMode ? '13-14c. Monitoring & Remedial Ledger' : 'Monitoring & Remedial Ledger',
          subtitle: 'Supervisory monitoring & late bloomer progress',
          pageRef: 'P-13 & 14c',
          category: 'assessment',
          icon: <Target className="w-4 h-4 text-indigo-400" />
        },
        {
          key: 'notebook_3_5',
          title: devMode ? '22. Notebook Correction (III-V)' : 'Notebook Correction (III-V)',
          subtitle: 'Regularity, index check & remedial stamps',
          pageRef: 'P-15 & 16',
          category: 'assessment',
          icon: <BookmarkCheck className="w-4 h-4 text-indigo-300" />
        },
        {
          key: 'sea_3_5',
          title: devMode ? '23. SEA Rubric Evaluation (III-V)' : 'SEA Rubric Evaluation (III-V)',
          subtitle: 'Subject Enrichment Activities 5-point rubrics',
          pageRef: 'P-17, 18 & 19',
          category: 'assessment',
          icon: <Sparkles className="w-4 h-4 text-emerald-400" />
        },
        {
          key: 'result_analysis',
          title: devMode ? '27. Result Analysis (III-V)' : 'Result Analysis (III-V)',
          subtitle: 'Subject-wise grade distribution & pie charts',
          pageRef: 'P-23 (2p)',
          category: 'assessment',
          icon: <TrendingUp className="w-4 h-4 text-emerald-400" />
        },
        {
          key: 'nipun',
          title: devMode ? '16. NIPUN FLN Meetings Record' : 'NIPUN FLN Meetings Record',
          subtitle: 'Monthly Foundational Literacy & Numeracy reviews',
          pageRef: 'P-16',
          category: 'academics',
          icon: <BookOpen className="w-4 h-4 text-indigo-300" />
        },
        {
          key: 'staff_meeting',
          title: devMode ? '17. Staff Meetings Gist' : 'Staff Meetings Gist',
          subtitle: 'Official staff discussions & decisions record',
          pageRef: 'P-17',
          category: 'academics',
          icon: <Users className="w-4 h-4 text-purple-300" />
        },
        {
          key: 'subject_meeting',
          title: devMode ? '18. Subject Committee Meetings' : 'Subject Committee Meetings',
          subtitle: 'Curriculum alignments & resource plans',
          pageRef: 'P-18',
          category: 'academics',
          icon: <BookMarked className="w-4 h-4 text-purple-300" />
        },
        {
          key: 'ptm_meeting',
          title: devMode ? '19. Parent-Teacher Meetings (PTM)' : 'Parent-Teacher Meetings (PTM)',
          subtitle: 'Parent interactions & collaborative resolutions',
          pageRef: 'P-19',
          category: 'academics',
          icon: <HeartHandshake className="w-4 h-4 text-pink-400" />
        }
      );
    } else {
      // Middle & Secondary Specific
      items.push(
        {
          key: 'syllabus',
          title: devMode ? '12. Month Split-Up Syllabus' : 'Month Split-Up Syllabus',
          subtitle: 'CBSE / NCERT curriculum planning by month',
          pageRef: 'P-12 to 15',
          category: 'academics',
          icon: <BookMarked className="w-4 h-4 text-purple-300" />
        },
        {
          key: 'exams',
          title: 'Exam & PT Assessment Plans',
          subtitle: 'Periodic Tests, Mid-Term & Annual blueprints',
          pageRef: 'P-34',
          category: 'assessment',
          icon: <Award className="w-4 h-4 text-purple-300" />
        },
        {
          key: 'assessment',
          title: devMode ? '17-21. Progress & Assessment Ledger' : 'Progress & Assessment Ledger',
          subtitle: 'Homework records & student competency ledger',
          pageRef: 'P-17 to 20',
          category: 'assessment',
          icon: <Award className="w-4 h-4 text-amber-400" />
        },
        {
          key: 'result_analysis_vi_xii',
          title: devMode ? '18. Result Analysis (VI-XII)' : 'Result Analysis (VI-XII)',
          subtitle: '18(a) Classes VI-X & 18(b) Classes XI-XII result analysis',
          pageRef: 'P-31 & 32',
          category: 'assessment',
          icon: <TrendingUp className="w-4 h-4 text-purple-400" />
        },
        {
          key: 'student_observations',
          title: devMode ? '19. Student Observations' : 'Student Observations',
          subtitle: 'Behaviour, discipline & leadership observations',
          pageRef: 'P-33',
          category: 'assessment',
          icon: <Eye className="w-4 h-4 text-emerald-400" />
        },
        {
          key: 'remedial_exemplary_20_21',
          title: devMode ? '20-21. Remedial & Exemplary Children' : 'Remedial & Exemplary Children',
          subtitle: '20(a-c) Remedial Registers & 21. Exemplary Children',
          pageRef: 'P-34 to 37',
          category: 'assessment',
          icon: <Target className="w-4 h-4 text-rose-400" />
        },
        {
          key: 'institutional_meetings_22_24',
          title: devMode ? '22-24. Institutional Meetings' : 'Institutional Meetings',
          subtitle: '22. PTM, 23. Staff Minutes & 24. Committee Gists',
          pageRef: 'P-38 to 51',
          category: 'assessment',
          icon: <HeartHandshake className="w-4 h-4 text-amber-400" />
        },
        {
          key: 'pedagogical_28_30',
          title: devMode ? '28-30. Pedagogical & Joyful Learning Records' : 'Pedagogical & Joyful Learning Records',
          subtitle: '28. Academic Loss, 29. Joyful Learning, 30. Competency Tests',
          pageRef: 'P-28 to 30',
          category: 'assessment',
          icon: <Sparkles className="w-4 h-4 text-teal-400" />
        },
        {
          key: 'inspection',
          title: devMode ? '4, 48, 50. Inspection Approvals' : 'Inspection Approvals',
          subtitle: 'HM / VP / Principal reviews & remarks',
          pageRef: 'P-4, 48, 50',
          category: 'reports',
          icon: <ShieldCheck className="w-4 h-4 text-purple-300" />
        }
      );
    }

    // Reports & System
    items.push(
      {
        key: 'reports',
        title: 'Master Print Reports',
        subtitle: isFoundational ? 'Official 34-Page NEP Teacher Diary' : 'Official 52-Page KVS Teacher Diary',
        pageRef: isFoundational ? 'P-1 to 34' : 'P-1 to 52',
        category: 'reports',
        icon: <Printer className="w-4 h-4 text-amber-300" />
      },
      {
        key: 'settings',
        title: 'Settings & Preferences',
        subtitle: 'Stage switch, theme, backup & restore',
        pageRef: 'System',
        category: 'admin',
        icon: <Settings className="w-4 h-4 text-slate-300" />
      }
    );

    return items;
  }, [isFoundational]);

  // Filtered items based on search and category
  const filteredNavItems = useMemo(() => {
    return allNavItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pageRef.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allNavItems, searchQuery, selectedCategory]);

  const handleItemClick = (key: TabKey) => {
    onSelectTab(key);
    onClose();
    setIsFabOpen(false);
  };

  return (
    <>
      {/* =========================================================================
          1. MOBILE BOTTOM APP BAR (Docked for Thumb Accessibility)
          ========================================================================= */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--glass)] border-t border-[var(--glass-border)] backdrop-blur-2xl px-2 py-1.5 shadow-[0_-4px_25px_rgba(0,0,0,0.4)]"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Tab 1: Dashboard */}
          <button
            onClick={() => handleItemClick('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all touch-manipulation cursor-pointer flex-1 ${
              activeTab === 'dashboard'
                ? 'text-indigo-400 font-bold scale-105'
                : 'text-[var(--text-dim)] hover:text-[var(--text-main)] active:scale-95'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'dashboard' ? 'bg-indigo-500/20 shadow-sm' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight leading-tight">Dashboard</span>
          </button>

          {/* Tab 2: Tasks & Workload */}
          <button
            onClick={() => handleItemClick('taskmanager')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all touch-manipulation cursor-pointer flex-1 ${
              activeTab === 'taskmanager' || activeTab === 'workload'
                ? 'text-purple-400 font-bold scale-105'
                : 'text-[var(--text-dim)] hover:text-[var(--text-main)] active:scale-95'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'taskmanager' || activeTab === 'workload' ? 'bg-purple-500/20 shadow-sm' : ''}`}>
              <ListTodo className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight leading-tight">Tasks</span>
          </button>

          {/* Tab 3: Students Roster */}
          <button
            onClick={() => handleItemClick('students')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all touch-manipulation cursor-pointer flex-1 ${
              activeTab === 'students'
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-[var(--text-dim)] hover:text-[var(--text-main)] active:scale-95'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'students' ? 'bg-emerald-500/20 shadow-sm' : ''}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight leading-tight">Students</span>
          </button>

          {/* Tab 4: Dynamic Assessment (ORF on Foundational, Assessment on Secondary) */}
          <button
            onClick={() => handleItemClick(isFoundational ? 'orf_tara' : 'assessment')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all touch-manipulation cursor-pointer flex-1 ${
              activeTab === 'orf_tara' ||
              activeTab === 'scholastic_primary' ||
              activeTab === 'scholastic_1_2' ||
              activeTab === 'scholastic_3_5_t1' ||
              activeTab === 'scholastic_3_5_t2' ||
              activeTab === 'assessment'
                ? 'text-amber-400 font-bold scale-105'
                : 'text-[var(--text-dim)] hover:text-[var(--text-main)] active:scale-95'
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                activeTab === 'orf_tara' ||
                activeTab === 'scholastic_primary' ||
                activeTab === 'scholastic_1_2' ||
                activeTab === 'scholastic_3_5_t1' ||
                activeTab === 'scholastic_3_5_t2' ||
                activeTab === 'assessment'
                  ? 'bg-amber-500/20 shadow-sm'
                  : ''
              }`}
            >
              {isFoundational ? <Mic className="w-5 h-5" /> : <Award className="w-5 h-5" />}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight leading-tight">
              {isFoundational ? 'ORF & FLN' : 'Assessment'}
            </span>
          </button>

          {/* Tab 5: All Pages Drawer Trigger */}
          <button
            onClick={() => {
              if (isOpen) {
                onClose();
              } else {
                onOpen();
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all touch-manipulation cursor-pointer flex-1 ${
              isOpen
                ? 'text-indigo-400 font-bold scale-105'
                : 'text-[var(--text-dim)] hover:text-[var(--text-main)] active:scale-95'
            }`}
            aria-label="Open All Modules Menu"
          >
            <div className={`relative p-1 rounded-lg ${isOpen ? 'bg-indigo-500/20 shadow-sm' : ''}`}>
              <Menu className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[9px] font-bold rounded-full">
                {isFoundational ? '34' : '52'}
              </span>
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight leading-tight">All Pages</span>
          </button>
        </div>
      </nav>

      {/* =========================================================================
          2. FLOATING ACTION BUTTON (FAB) & SPEED DIAL (Mobile Quick Actions)
          ========================================================================= */}
      <div className="md:hidden fixed bottom-18 right-4 z-40 flex flex-col items-end gap-2">
        {/* Speed Dial Menu Items */}
        {isFabOpen && (
          <div className="flex flex-col items-end gap-2 mb-2 animate-[fadeIn_0.2s_ease-out]">
            {/* Quick Action 1: Daily Lesson Plan */}
            <button
              onClick={() => handleItemClick('lessonplan')}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all border border-indigo-400/40"
            >
              <span>Daily Lesson Plan</span>
              <FileText className="w-4 h-4" />
            </button>

            {/* Quick Action 2: Timetable Planner */}
            <button
              onClick={() => handleItemClick('timetable')}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-cyan-700 text-white text-xs font-semibold shadow-lg hover:bg-cyan-800 active:scale-95 transition-all border border-cyan-400/40"
            >
              <span>Weekly Timetable</span>
              <Clock className="w-4 h-4" />
            </button>

            {/* Quick Action 3: Master Print Report */}
            <button
              onClick={() => handleItemClick('reports')}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-amber-600 text-white text-xs font-semibold shadow-lg hover:bg-amber-700 active:scale-95 transition-all border border-amber-400/40"
            >
              <span>Master PDF Print</span>
              <Printer className="w-4 h-4" />
            </button>

            {/* Quick Action 4: Page Map Inspector */}
            <button
              onClick={() => {
                setIsFabOpen(false);
                onOpenInspector();
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-purple-700 text-white text-xs font-semibold shadow-lg hover:bg-purple-800 active:scale-95 transition-all border border-purple-400/40"
            >
              <span>{isFoundational ? '34-Page Map' : '52-Page Map'}</span>
              <Layers className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Primary FAB Toggle Button */}
        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-[0_4px_20px_rgba(99,102,241,0.5)] cursor-pointer active:scale-90 transition-all border border-white/20 ${
            isFabOpen
              ? 'bg-rose-600 rotate-45'
              : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500'
          }`}
          aria-label="Quick action speed dial"
        >
          <Plus className="w-6 h-6 transition-transform" />
        </button>
      </div>

      {/* =========================================================================
          3. FULL-FEATURED MOBILE DRAWER WITH INSTANT SEARCH & DIRECTORY
          ========================================================================= */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end animate-[fadeIn_0.2s_ease-out]">
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            title="Click to close directory"
          />

          {/* Slide-Up Sheet Modal */}
          <div className="relative w-full max-h-[88vh] bg-[#0F111A] dark:bg-[#0F111A] light:bg-white text-[var(--text-main)] border-t border-[var(--glass-border)] rounded-t-[28px] shadow-2xl flex flex-col overflow-hidden animate-[slideUp_0.25s_ease-out]">
            {/* Drawer Drag Pill Header */}
            <div className="pt-2.5 pb-1 flex justify-center items-center">
              <div className="w-12 h-1.5 rounded-full bg-slate-600/40" />
            </div>

            {/* Top Sheet Header */}
            <div className="p-4 pt-1 border-b border-[var(--glass-border)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-serif text-white font-bold text-sm shadow-md">
                  KV
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[var(--text-main)] leading-tight">
                    Diary Directory
                  </h3>
                  <div className="text-[11px] text-[var(--text-dim)] flex items-center gap-1.5">
                    <span>{isFoundational ? 'Foundational 34 Pages' : 'Secondary 52 Pages'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Theme Mode Toggle inside Drawer */}
                <button
                  onClick={() => onToggleTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[var(--glass-border)] text-[var(--text-main)] hover:bg-[rgba(255,255,255,0.12)] cursor-pointer"
                  title="Toggle Theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600" />
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[var(--glass-border)] text-[var(--text-dim)] hover:text-[var(--text-main)] cursor-pointer"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stage Selector Pill */}
            <div className="p-3 bg-black/20 border-b border-[var(--glass-border)] flex gap-1.5">
              <button
                type="button"
                onClick={() => onDiaryModeChange('foundational-preparatory')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isFoundational
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-[rgba(255,255,255,0.04)] text-[var(--text-dim)] hover:text-[var(--text-main)]'
                }`}
              >
                <Sparkle className="w-3.5 h-3.5" />
                <span>Balvatika – V</span>
                <span className="text-[10px] opacity-80">(34-P)</span>
              </button>

              <button
                type="button"
                onClick={() => onDiaryModeChange('middle-secondary')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isFoundational
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-[rgba(255,255,255,0.04)] text-[var(--text-dim)] hover:text-[var(--text-main)]'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>VI – XII</span>
                <span className="text-[10px] opacity-80">(52-P)</span>
              </button>
            </div>

            {/* Instant Search Bar */}
            <div className="p-3 border-b border-[var(--glass-border)] bg-[rgba(255,255,255,0.02)]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages (e.g. ORF, PTM, Result, Lesson, P-28)..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[var(--glass-border)] text-xs text-[var(--text-main)] placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 no-scrollbar">
                {(
                  [
                    { id: 'all', label: 'All Modules' },
                    { id: 'daily', label: 'Daily Tools' },
                    { id: 'assessment', label: isFoundational ? 'Assessment & FLN' : 'Assessments' },
                    { id: 'academics', label: isFoundational ? 'Meetings' : 'Curriculum' },
                    { id: 'admin', label: 'Admin Setup' },
                    { id: 'reports', label: 'Reports' }
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-dim)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Module List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 overscroll-contain">
              {filteredNavItems.length === 0 ? (
                <div className="text-center py-10 text-[var(--text-dim)]">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-400" />
                  <p className="text-sm">No pages match "{searchQuery}"</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="mt-2 text-xs text-indigo-400 font-semibold underline cursor-pointer"
                  >
                    Clear search filters
                  </button>
                </div>
              ) : (
                filteredNavItems.map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleItemClick(item.key)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer touch-manipulation ${
                        isActive
                          ? 'bg-indigo-600/20 border-indigo-500/50 shadow-sm'
                          : 'bg-[rgba(255,255,255,0.03)] border-[var(--glass-border)] hover:bg-[rgba(255,255,255,0.07)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isActive
                              ? 'bg-indigo-600 text-white border-indigo-400'
                              : 'bg-[rgba(255,255,255,0.05)] border-[var(--glass-border)]'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`font-semibold text-xs truncate ${
                              isActive ? 'text-indigo-300 font-bold' : 'text-[var(--text-main)]'
                            }`}
                          >
                            {item.title}
                          </div>
                          <div className="text-[10px] text-[var(--text-dim)] truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[rgba(255,255,255,0.06)] border border-[var(--glass-border)] text-purple-300">
                          {item.pageRef}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick Action Drawer Footer */}
            <div className="p-3 border-t border-[var(--glass-border)] bg-[rgba(0,0,0,0.3)] flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenInspector();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-purple-300" />
                <span>{isFoundational ? '34-Page Map' : '52-Page Map'}</span>
              </button>

              <button
                onClick={() => handleItemClick('reports')}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Master Print</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
