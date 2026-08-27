import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Clock,
  UserCheck,
  Briefcase,
  ListTodo,
  Calendar,
  Building2,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  User,
  History,
  HelpCircle,
  Activity,
  CheckSquare,
  FileText,
  X,
  Sparkles,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { KvsLogo } from '../common/KvsLogo';
import { UserAccount } from '../../types/auth';
import { SchoolDetails, PortfolioAssignment } from '../../types/academic';
import { TopModuleKey, getVisibleTopModules, isAdminOrDataManager } from '../../lib/permissions';
import { db, DEFAULT_SCHOOL, DEFAULT_PORTFOLIO_ASSIGNMENTS } from '../../lib/storage';

export interface LeftSidebarProps {
  activeModule: TopModuleKey;
  onSelectModule: (module: TopModuleKey) => void;
  onNavigateTab?: (target: string) => void;
  currentUser: UserAccount | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenVersionHistory: () => void;
  onOpenInspector: () => void;
  devMode: boolean;
  onToggleDevMode: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onNewTaskClick?: () => void;
}

interface NavItemDef {
  key: TopModuleKey | string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  isSubItem?: boolean;
  targetTab?: string;
  badge?: string;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeModule,
  onSelectModule,
  onNavigateTab,
  currentUser,
  onOpenLoginModal,
  onLogout,
  theme,
  onToggleTheme,
  onOpenVersionHistory,
  onOpenInspector,
  devMode,
  onToggleDevMode,
  isMobileOpen,
  onCloseMobile,
  onNewTaskClick
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kvs_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails>(DEFAULT_SCHOOL);
  const [assignments, setAssignments] = useState<PortfolioAssignment[]>([]);

  useEffect(() => {
    localStorage.setItem('kvs_sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const loadData = async () => {
      const [savedSchool, savedPortfolios] = await Promise.all([
        db.get<SchoolDetails>('setup:school'),
        db.get<PortfolioAssignment[]>('setup:portfolio_assignments')
      ]);
      if (savedSchool) setSchoolDetails(savedSchool);
      if (savedPortfolios && savedPortfolios.length > 0) setAssignments(savedPortfolios);
    };
    loadData();

    const handleSchoolUpdate = () => loadData();
    window.addEventListener('kvs-school-updated', handleSchoolUpdate);
    window.addEventListener('kvs-portfolios-updated', handleSchoolUpdate);
    return () => {
      window.removeEventListener('kvs-school-updated', handleSchoolUpdate);
      window.removeEventListener('kvs-portfolios-updated', handleSchoolUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isMobileOpen]);

  const isDark = theme !== 'light';
  const isAdmin = isAdminOrDataManager(currentUser);
  const visibleModuleKeys = new Set(getVisibleTopModules(currentUser, assignments));

  const handleNavClick = (item: NavItemDef) => {
    if (item.targetTab && onNavigateTab) {
      onNavigateTab(item.targetTab);
    } else {
      onSelectModule(item.key as TopModuleKey);
    }
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const handlePrimaryNewTask = () => {
    if (onNewTaskClick) {
      onNewTaskClick();
    } else {
      window.dispatchEvent(new CustomEvent('kvs-open-new-task'));
      if (activeModule !== 'dashboard' && activeModule !== 'tasks') {
        onSelectModule('tasks');
      }
    }
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  // Nav Groups Definition
  const peopleManagementItems: NavItemDef[] = [
    { key: 'staff', label: 'Staff Directory', shortLabel: 'Staff', icon: Users },
    { key: 'students', label: 'Students Roster', shortLabel: 'Students', icon: GraduationCap },
    { key: 'roles', label: isAdmin ? 'Roles & Committees' : 'My Roles & Committees', shortLabel: 'Roles', icon: ShieldCheck },
    { key: 'diary', label: "Teacher's Diary", shortLabel: 'Diary', icon: BookOpen },
    { key: 'timetable', label: 'Timetable Matrix', shortLabel: 'Timetable', icon: Clock },
    { key: 'admission', label: 'Admission Desk', shortLabel: 'Admission', icon: UserCheck },
    { key: 'office', label: 'Office & Dak', shortLabel: 'Office', icon: Briefcase },
    { key: 'calendar', label: 'Academic Calendar', shortLabel: 'Calendar', icon: Calendar },
    { key: 'school', label: 'School Details', shortLabel: 'School', icon: Building2 }
  ].filter(item => visibleModuleKeys.has(item.key as TopModuleKey));

  const workTasksItems: NavItemDef[] = [
    { key: 'tasks', label: 'Task Hub', shortLabel: 'Tasks', icon: ListTodo },
    { key: 'taskmanager', label: 'Task Manager & To-Dos', shortLabel: 'To-Dos', icon: CheckSquare, targetTab: 'taskmanager', isSubItem: true },
    { key: 'workload', label: 'Hourly Activity & Duty Log', shortLabel: 'Hourly Log', icon: Activity, targetTab: 'workload', isSubItem: true },
    { key: 'non_teaching', label: 'Work Done (Non-Teaching)', shortLabel: 'Non-Teaching', icon: FileText, targetTab: 'taskmanager', isSubItem: true }
  ];

  const renderDesktopNavButton = (item: NavItemDef) => {
    const Icon = item.icon;
    const isActive = activeModule === item.key || (item.targetTab && activeModule === 'tasks' && item.key === 'tasks');

    return (
      <button
        key={item.key}
        type="button"
        onClick={() => handleNavClick(item)}
        title={isCollapsed ? item.label : undefined}
        className={`group relative w-full flex items-center gap-3 rounded-xl transition-all text-left cursor-pointer select-none ${
          isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
        } ${item.isSubItem && !isCollapsed ? 'pl-7 text-xs' : 'text-xs sm:text-[13px]'} ${
          isActive
            ? 'bg-purple-950/60 text-purple-200 font-bold border-l-4 border-purple-500 shadow-sm'
            : isDark
            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-4 border-transparent'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-l-4 border-transparent'
        }`}
      >
        <Icon
          className={`shrink-0 transition-transform group-hover:scale-110 ${
            isCollapsed ? 'w-5 h-5' : 'w-4 h-4'
          } ${
            isActive
              ? 'text-purple-400'
              : isDark
              ? 'text-slate-400 group-hover:text-purple-300'
              : 'text-slate-500 group-hover:text-purple-600'
          }`}
        />

        {!isCollapsed && (
          <span className="truncate flex-1 font-medium tracking-tight">
            {item.label}
          </span>
        )}

        {item.badge && !isCollapsed && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {item.badge}
          </span>
        )}

        {/* Tooltip for collapsed mode */}
        {isCollapsed && (
          <div className="fixed left-20 ml-2 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
            {item.label}
          </div>
        )}
      </button>
    );
  };

  // MOBILE: Always expanded with comfortable 44px min tap targets
  const renderMobileNavButton = (item: NavItemDef) => {
    const Icon = item.icon;
    const isActive = activeModule === item.key || (item.targetTab && activeModule === 'tasks' && item.key === 'tasks');

    return (
      <button
        key={item.key}
        type="button"
        onClick={() => {
          if (item.targetTab && onNavigateTab) {
            onNavigateTab(item.targetTab);
          } else {
            onSelectModule(item.key as TopModuleKey);
          }
          onCloseMobile();
        }}
        className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left cursor-pointer select-none ${
          item.isSubItem ? 'pl-7 text-xs' : 'text-xs sm:text-[13px]'
        } ${
          isActive
            ? 'bg-purple-950/70 text-purple-200 font-bold border-l-4 border-purple-500 shadow-xs'
            : isDark
            ? 'text-slate-300 hover:text-white hover:bg-slate-800/60 border-l-4 border-transparent'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-l-4 border-transparent'
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 transition-transform ${
            isActive
              ? 'text-purple-400'
              : isDark
              ? 'text-slate-400'
              : 'text-slate-500'
          }`}
        />

        <span className="truncate flex-1 font-medium tracking-tight">
          {item.label}
        </span>

        {item.badge && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  interface ToolItemDef {
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    action: () => void;
    isDestructive?: boolean;
  }

  const mobileToolItems: ToolItemDef[] = [
    {
      key: 'settings',
      label: 'Settings & Preferences',
      icon: Settings,
      action: () => {
        onSelectModule('settings');
        onCloseMobile();
      }
    },
    {
      key: 'history',
      label: 'Version Snapshots',
      icon: History,
      action: () => {
        onOpenVersionHistory();
        onCloseMobile();
      }
    },
    {
      key: 'theme',
      label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: isDark ? Sun : Moon,
      action: () => {
        onToggleTheme();
      }
    },
    ...(currentUser ? [
      {
        key: 'logout',
        label: 'Switch Account / Logout',
        icon: LogOut,
        action: () => {
          onLogout();
          onCloseMobile();
        },
        isDestructive: true
      }
    ] : [
      {
        key: 'login',
        label: 'Sign In',
        icon: User,
        action: () => {
          onOpenLoginModal();
          onCloseMobile();
        }
      }
    ])
  ];

  const renderMobileToolButton = (tool: ToolItemDef) => {
    const Icon = tool.icon;
    return (
      <button
        key={tool.key}
        type="button"
        onClick={tool.action}
        className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left cursor-pointer select-none text-xs sm:text-[13px] border-l-4 border-transparent ${
          tool.isDestructive
            ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
            : isDark
            ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${tool.isDestructive ? 'text-rose-400' : 'text-slate-400'}`} />
        <span className="truncate flex-1 font-medium tracking-tight">
          {tool.label}
        </span>
      </button>
    );
  };

  const desktopSidebarContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Header & Brand */}
      <div className="space-y-4">
        {/* Brand Bar */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div
            onClick={() => handleNavClick({ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard })}
            className={`flex items-center gap-2.5 cursor-pointer min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}
            title="Go to Dashboard"
          >
            <div className="shrink-0">
              <KvsLogo logoUrl={schoolDetails.logoUrl} size={isCollapsed ? 'xs' : 'sm'} isDark={isDark} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h2 className="text-xs font-serif font-black tracking-tight text-white truncate m-0">
                  {schoolDetails.schoolName || 'KV Kutra Portal'}
                </h2>
                <p className="text-[10px] text-purple-400 font-mono truncate m-0">
                  Teacher's Diary {schoolDetails.kvCode ? `• KV.${schoolDetails.kvCode}` : ''}
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-1 scrollbar-thin">
          {/* Main Dashboard */}
          <div>
            {renderDesktopNavButton({
              key: 'dashboard',
              label: 'Dashboard',
              icon: LayoutDashboard
            })}
          </div>

          {/* PEOPLE & MANAGEMENT */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                People &amp; Management
              </div>
            )}
            {peopleManagementItems.map(renderDesktopNavButton)}
          </div>

          {/* WORK & TASKS */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                Work &amp; Tasks
              </div>
            )}
            {workTasksItems.map(renderDesktopNavButton)}
          </div>
        </div>
      </div>

      {/* Bottom Sticky Section: + New Task Button & Account Card */}
      <div className={`pt-3 border-t space-y-2.5 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        {/* Primary "+ New Task" Button */}
        <button
          type="button"
          onClick={handlePrimaryNewTask}
          title="Create New Priority Task"
          className={`w-full flex items-center justify-center gap-2 rounded-xl font-bold transition-all shadow-lg cursor-pointer ${
            isCollapsed ? 'p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/40' : 'px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs shadow-purple-900/40 hover:scale-102'
          }`}
        >
          <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
          {!isCollapsed && <span>+ New Task</span>}
        </button>

        {/* Active User Account Session */}
        <div className="relative" ref={accountMenuRef}>
          {currentUser ? (
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className={`w-full flex items-center gap-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                isCollapsed ? 'p-2 justify-center' : 'p-2.5'
              } ${
                isDark
                  ? 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs">
                {currentUser.name ? currentUser.name.charAt(0) : 'U'}
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate text-white">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {currentUser.designation || 'TGT (P&HE)'}
                  </div>
                </div>
              )}

              {!isCollapsed && (
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className={`w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer ${
                isCollapsed ? 'p-2' : 'px-3 py-2'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Login</span>}
            </button>
          )}

          {/* Account Popover Menu */}
          {isAccountMenuOpen && currentUser && (
            <div className={`absolute bottom-full left-0 mb-2 w-64 p-2 rounded-2xl shadow-2xl border z-50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 ${
              isDark
                ? 'bg-slate-900/98 border-slate-700 text-slate-200'
                : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="p-2.5 border-b border-slate-800">
                <p className="text-xs font-bold truncate text-white">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentUser.designation} • Emp: {currentUser.employeeCode || '108894'}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {currentUser.role.toUpperCase()}
                  </span>
                  {currentUser.isClassTeacherOf && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      CT: {currentUser.isClassTeacherOf}
                    </span>
                  )}
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onSelectModule('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-xl hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span>Settings &amp; Preferences</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onOpenVersionHistory();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-xl hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
                >
                  <History className="w-4 h-4 text-indigo-400" />
                  <span>Version Snapshots</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onToggleTheme();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-xl hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                  <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Switch Account / Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 z-30 transition-all duration-300 border-r p-4 select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isDark
            ? 'bg-[#0B0D14] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        {desktopSidebarContent}
      </aside>

      {/* Mobile Slide-in Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop (dimmed overlay behind drawer; tap overlay closes it) */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-fadeIn cursor-pointer"
            onClick={onCloseMobile}
            aria-label="Close drawer overlay"
          />

          {/* Drawer Panel: 85vw width, max 320px, full labels, dark theme */}
          <div
            className={`fixed inset-y-0 left-0 w-[85vw] max-w-[320px] p-4 flex flex-col justify-between shadow-2xl border-r z-50 animate-[slideRight_0.25s_ease-out] overflow-hidden ${
              isDark
                ? 'bg-[#0B0D14] border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Top Brand Header with Close X */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div
                onClick={() => {
                  onSelectModule('dashboard');
                  onCloseMobile();
                }}
                className="flex items-center gap-2.5 cursor-pointer min-w-0"
                title="Go to Dashboard"
              >
                <div className="shrink-0">
                  <KvsLogo logoUrl={schoolDetails.logoUrl} size="sm" isDark={isDark} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-serif font-black tracking-tight text-white truncate m-0">
                    {schoolDetails.schoolName || 'KV Kutra Portal'}
                  </h2>
                  <p className="text-[10px] text-purple-400 font-mono truncate m-0">
                    Teacher's Diary {schoolDetails.kvCode ? `• KV.${schoolDetails.kvCode}` : ''}
                  </p>
                </div>
              </div>

              {/* Close Button (X must call onCloseMobile) */}
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0 transition-colors"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation Sections (Grouped with small muted section headers) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-3 scrollbar-thin">
              {/* Section: Dashboard */}
              <div>
                {renderMobileNavButton({
                  key: 'dashboard',
                  label: 'Dashboard',
                  icon: LayoutDashboard
                })}
              </div>

              {/* Section: PEOPLE & MANAGEMENT */}
              <div className="space-y-1">
                <div className="px-3 pt-1 pb-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500 select-none">
                  People &amp; Management
                </div>
                {peopleManagementItems.map(renderMobileNavButton)}
              </div>

              {/* Section: WORK & TASKS */}
              <div className="space-y-1">
                <div className="px-3 pt-1 pb-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500 select-none">
                  Work &amp; Tasks
                </div>
                {workTasksItems.map(renderMobileNavButton)}
              </div>

              {/* Section: TOOLS / ACCOUNT */}
              <div className="space-y-1">
                <div className="px-3 pt-1 pb-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500 select-none">
                  Tools &amp; Account
                </div>
                {mobileToolItems.map(renderMobileToolButton)}
              </div>
            </div>

            {/* Sticky Bottom inside Drawer: [+ New Task] with visible label & User chip with name/initial */}
            <div className={`pt-3 border-t space-y-2.5 shrink-0 ${
              isDark ? 'border-slate-800 bg-[#0B0D14]' : 'border-slate-200 bg-white'
            }`}>
              {/* [+ New Task] with visible label */}
              <button
                type="button"
                onClick={handlePrimaryNewTask}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs shadow-md shadow-purple-900/40 cursor-pointer active:scale-98 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ New Task</span>
              </button>

              {/* User chip with name/initial, not only "U" */}
              {currentUser ? (
                <div
                  onClick={() => {
                    onSelectModule('settings');
                    onCloseMobile();
                  }}
                  className={`min-h-[44px] p-2 rounded-xl border flex items-center gap-2.5 cursor-pointer text-left transition-colors ${
                    isDark
                      ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-800'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
                  }`}
                  title="View Settings &amp; Profile"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {currentUser.designation || 'Faculty'}
                    </div>
                  </div>
                  <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenLoginModal();
                    onCloseMobile();
                  }}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
