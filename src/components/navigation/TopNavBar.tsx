import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Clock,
  UserCheck,
  Briefcase,
  ListTodo,
  MessageSquarePlus,
  Settings,
  Sun,
  Moon,
  Menu,
  Sparkle,
  Sparkles,
  ChevronDown,
  LogOut,
  User,
  History,
  Calendar,
  Layers,
  Code,
  HelpCircle,
  Shield,
  ExternalLink
} from 'lucide-react';
import { CloudSyncBadge } from '../CloudSyncBadge';
import { KvsLogo } from '../common/KvsLogo';
import { UserAccount } from '../../types/auth';
import { PortfolioAssignment, SchoolDetails } from '../../types/academic';
import { type TopModuleKey, getVisibleTopModules, isAdminOrDataManager } from '../../lib/permissions';
import { db, DEFAULT_PORTFOLIO_ASSIGNMENTS, DEFAULT_SCHOOL } from '../../lib/storage';

export type { TopModuleKey };

export interface ModuleDefinition {
  key: TopModuleKey;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
}

export const ALL_MODULE_DEFINITIONS: Record<TopModuleKey, ModuleDefinition> = {
  dashboard: {
    key: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: LayoutDashboard,
    description: 'Overview, timetable preview & quick metrics'
  },
  school: {
    key: 'school',
    label: 'School',
    shortLabel: 'School',
    icon: Building2,
    description: 'School setup, sessions & academic calendar'
  },
  staff: {
    key: 'staff',
    label: 'Staff',
    shortLabel: 'Staff',
    icon: Users,
    description: 'Directory, attendance, training, vacancy & meetings'
  },
  students: {
    key: 'students',
    label: 'Students',
    shortLabel: 'Students',
    icon: GraduationCap,
    description: 'Student profiles, enrollment & behaviour records'
  },
  roles: {
    key: 'roles',
    label: 'My Roles & Committees',
    shortLabel: 'My Roles',
    icon: ShieldCheck,
    description: 'KVK committees, assigned roles & delegations'
  },
  diary: {
    key: 'diary',
    label: "Teacher's Diary",
    shortLabel: 'Diary',
    icon: BookOpen,
    description: 'Primary & Secondary syllabus, lesson plans & assessments'
  },
  timetable: {
    key: 'timetable',
    label: 'Timetable',
    shortLabel: 'Timetable',
    icon: Clock,
    description: 'Weekly schedule matrix & proxy arrangements'
  },
  calendar: {
    key: 'calendar',
    label: 'Academic Calendar',
    shortLabel: 'Calendar',
    icon: Calendar,
    description: 'KVS Activity Calendar, Gazetted Holidays & Vacations (View-Only)'
  },
  admission: {
    key: 'admission',
    label: 'Admission',
    shortLabel: 'Admission',
    icon: UserCheck,
    description: 'Verification, RTE, SGC & category quotas'
  },
  office: {
    key: 'office',
    label: 'Office',
    shortLabel: 'Office',
    icon: Briefcase,
    description: 'Dak dispatch, service ledger, UBI fees & stock'
  },
  tasks: {
    key: 'tasks',
    label: 'Work & Tasks',
    shortLabel: 'Tasks',
    icon: ListTodo,
    description: 'To-do manager, hourly duty log & non-teaching records'
  },
  settings: {
    key: 'settings',
    label: 'Settings',
    shortLabel: 'Settings',
    icon: Settings,
    description: 'Preferences, user accounts, cloud sync & backup'
  }
};

interface TopNavBarProps {
  activeModule: TopModuleKey;
  onSelectModule: (module: TopModuleKey) => void;
  onOpenMobileMenu: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentUser: UserAccount | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onQuickTasksClick: () => void;
  onOpenVersionHistory: () => void;
  onOpenInspector: () => void;
  devMode: boolean;
  onToggleDevMode: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeModule,
  onSelectModule,
  onOpenMobileMenu,
  theme,
  onToggleTheme,
  currentUser,
  onOpenLoginModal,
  onLogout,
  onQuickTasksClick,
  onOpenVersionHistory,
  onOpenInspector,
  devMode,
  onToggleDevMode
}) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [assignments, setAssignments] = useState<PortfolioAssignment[]>([]);
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails>(DEFAULT_SCHOOL);

  useEffect(() => {
    const loadAssignments = async () => {
      const saved = await db.get<PortfolioAssignment[]>('setup:portfolio_assignments');
      setAssignments(saved && saved.length > 0 ? saved : DEFAULT_PORTFOLIO_ASSIGNMENTS);
    };
    loadAssignments();

    const loadSchool = async () => {
      const saved = await db.get<SchoolDetails>('setup:school');
      if (saved) setSchoolDetails(saved);
    };
    loadSchool();

    const handleUpdate = () => loadAssignments();
    const handleSchoolUpdate = () => loadSchool();

    window.addEventListener('kvs-portfolios-updated', handleUpdate);
    window.addEventListener('kvs-school-updated', handleSchoolUpdate);

    return () => {
      window.removeEventListener('kvs-portfolios-updated', handleUpdate);
      window.removeEventListener('kvs-school-updated', handleSchoolUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute visible modules based on permissions
  const isAdmin = isAdminOrDataManager(currentUser);
  const visibleModuleKeys = getVisibleTopModules(currentUser, assignments);
  const visibleModules = visibleModuleKeys
    .map(key => {
      const def = ALL_MODULE_DEFINITIONS[key];
      if (!def) return null;
      if (key === 'roles') {
        return {
          ...def,
          label: isAdmin ? 'Roles & Committees' : 'My Roles & Committees',
          shortLabel: isAdmin ? 'Roles' : 'My Roles'
        };
      }
      return def;
    })
    .filter(Boolean) as ModuleDefinition[];

  const isDark = theme !== 'light';

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-colors duration-200 shadow-md ${
      isDark
        ? 'bg-[#0B0D14]/98 border-white/10 text-white'
        : 'bg-white/98 border-slate-200 text-slate-900 shadow-slate-200/50'
    }`}>
      <div className="max-w-[1720px] mx-auto px-3 sm:px-5">
        {/* Top Action Row */}
        <div className="flex items-center justify-between min-h-16 py-1.5 gap-2 sm:gap-4">
          
          {/* Left: Prominent Left-Aligned Vidyalaya Banner & Mobile Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className={`lg:hidden p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                isDark
                  ? 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                  : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
              }`}
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Left-Aligned Vidyalaya Institutional Banner (>= md) */}
            <div className={`hidden md:flex items-center gap-3 min-w-0 max-w-4xl px-3.5 py-1.5 rounded-2xl border transition-all select-none ${
              isDark
                ? 'bg-gradient-to-r from-[#0B0F19] via-[#121929] to-[#0B0F19] border-indigo-500/30 text-white shadow-md'
                : 'bg-gradient-to-r from-[#00529b] via-[#0275d8] to-[#004b8d] border-sky-400/50 text-white shadow-md'
            }`}>
              <div
                onClick={() => onSelectModule('dashboard')}
                className="cursor-pointer transition-transform hover:scale-105 shrink-0"
                title="Go to Vidyalaya Dashboard"
              >
                <KvsLogo logoUrl={schoolDetails.logoUrl} size="md" isDark={isDark} />
              </div>

              <div className="min-w-0 flex flex-col justify-center">
                {/* Top Line: Large Bold School Name */}
                <div className="flex items-center gap-2">
                  <h1
                    onClick={() => onSelectModule('dashboard')}
                    className={`font-serif font-black text-base lg:text-lg tracking-tight truncate cursor-pointer transition-colors m-0 ${
                      isDark
                        ? 'bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-amber-200 hover:brightness-125'
                        : 'text-white hover:text-amber-200'
                    }`}
                    title={schoolDetails.schoolName || 'Kendriya Vidyalaya Kutra'}
                  >
                    {schoolDetails.schoolName || 'Kendriya Vidyalaya Kutra'}
                  </h1>
                  {schoolDetails.kvCode && (
                    <span className={`hidden xl:inline-block px-1.5 py-0.5 rounded text-[10px] font-sans font-bold border ${
                      isDark
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        : 'bg-sky-950/40 text-amber-300 border-sky-400/40'
                    }`}>
                      KV.{schoolDetails.kvCode}
                    </span>
                  )}
                </div>

                {/* Bottom Line: Statutory Subtitle (Linked to school website) */}
                <a
                  href={schoolDetails.website || 'https://kutra.kvs.ac.in/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-[11px] font-sans transition-colors line-clamp-1 flex items-center gap-1 ${
                    isDark
                      ? 'text-slate-300 hover:text-amber-300'
                      : 'text-sky-100 hover:text-amber-200 font-medium'
                  }`}
                  title="Open Official Vidyalaya Website"
                >
                  <span>
                    {schoolDetails.bannerSubtitle ||
                      `An autonomous body under the Ministry of Education, Government of India | KV Code: ${schoolDetails.kvCode || '2218'}, CBSE Affiliation Number: ${schoolDetails.cbseAffiliationNo || '1500052'}, CBSE School Code: ${schoolDetails.cbseSchoolCode || '19133'}, UDISE Code: ${schoolDetails.udiseCode || '21050903372'}`}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-70 inline shrink-0" />
                </a>
              </div>
            </div>

            {/* Mobile Brand Mark (< md) - Compact, Single Line */}
            <div
              onClick={() => onSelectModule('dashboard')}
              className="flex md:hidden items-center gap-2 cursor-pointer select-none group min-w-0"
              title="Go to Dashboard"
            >
              <KvsLogo logoUrl={schoolDetails.logoUrl} size="xs" isDark={isDark} />
              <span className={`font-serif font-black text-sm tracking-tight truncate ${
                isDark ? 'text-white' : 'text-slate-900 font-extrabold'
              }`}>
                {schoolDetails.portalName || "KVS Teacher's Diary"}
              </span>
            </div>
          </div>

          {/* Right Action Icons & User Session Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Persistent Task / Work Shortcut Button */}
            <button
              type="button"
              onClick={onQuickTasksClick}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                isDark
                  ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border-purple-500/40'
                  : 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300'
              }`}
              title="Quick Work & Task Manager Shortcut"
            >
              <ListTodo className={`w-3.5 h-3.5 ${isDark ? 'text-purple-400' : 'text-purple-700'}`} />
              <span className="hidden sm:inline font-bold">Tasks</span>
            </button>

            {/* Cloud Sync Live Badge */}
            <CloudSyncBadge theme={theme} isFoundational={false} />

            {/* Version History Trigger */}
            <button
              type="button"
              onClick={onOpenVersionHistory}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Revision Snapshots & History"
            >
              <History className={`w-3.5 h-3.5 ${isDark ? 'text-purple-300' : 'text-indigo-600'}`} />
              <span className="hidden md:inline font-bold">History</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className={`p-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-amber-400 border-white/10'
                  : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-300'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-700" />
              )}
            </button>

            {/* User Session Menu (Contains Settings & Feedback) */}
            <div className="relative" ref={dropdownRef}>
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                    isAdmin
                      ? isDark
                        ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-500/40 text-rose-200'
                        : 'bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-900'
                      : isDark
                        ? 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/40 text-emerald-200'
                        : 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-900'
                  }`}
                  title="Active User Session & Settings"
                >
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="hidden md:inline max-w-[130px] truncate font-bold">{currentUser.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              )}

              {/* Active User Session Dropdown */}
              {isUserDropdownOpen && currentUser && (
                <div className={`absolute right-0 mt-2 w-64 p-2 rounded-2xl shadow-2xl border z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150 ${
                  isDark
                    ? 'bg-[#131722]/98 border-white/10 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
                }`}>
                  <div className={`p-2.5 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <p className="text-xs font-bold truncate">{currentUser.name}</p>
                    <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentUser.designation} • {currentUser.employeeCode || 'KV Staff'}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        isDark ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      }`}>
                        {currentUser.role.toUpperCase()}
                      </span>
                      {currentUser.isClassTeacherOf && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          CT: {currentUser.isClassTeacherOf}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1 space-y-0.5">
                    {/* Settings & Preferences Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onSelectModule('settings');
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-xl transition-colors cursor-pointer ${
                        isDark ? 'hover:bg-white/10 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <Settings className="w-4 h-4 text-purple-500" />
                      <div>
                        <div className="font-semibold">Settings & Preferences</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Theme, backup & account options</div>
                      </div>
                    </button>

                    {/* Feedback & Support Desk */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onSelectModule('settings');
                        window.dispatchEvent(new CustomEvent('open-settings-tab', { detail: 'tickets' }));
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-xl transition-colors cursor-pointer ${
                        isDark ? 'hover:bg-white/10 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4 text-cyan-500" />
                      <div>
                        <div className="font-semibold">Feedback & Support Desk</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Report issue or feature suggestion</div>
                      </div>
                    </button>

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span className="font-semibold">Switch Account / Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Desktop Horizontal Navigation Bar (Eye-Catching, Large, Clear & Simple Pill Chips) */}
        <nav className={`hidden lg:flex items-center gap-2 overflow-x-auto py-2.5 px-1 border-t transition-colors scrollbar-none ${
          isDark ? 'border-white/10 bg-transparent' : 'border-slate-200 bg-slate-100/70'
        }`}>
          {/* Dedicated Home / Dashboard Icon Pill */}
          <button
            type="button"
            onClick={() => onSelectModule('dashboard')}
            className={`flex items-center justify-center p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none shrink-0 ${
              activeModule === 'dashboard'
                ? isDark
                  ? 'bg-gradient-to-r from-purple-700 via-indigo-600 to-violet-700 text-white border-2 border-purple-300 shadow-lg shadow-purple-950/80 ring-2 ring-purple-400/50 scale-[1.03]'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-2 border-indigo-700 shadow-md shadow-indigo-300 ring-2 ring-indigo-400/60 scale-[1.03]'
                : isDark
                  ? 'bg-[#131728]/95 hover:bg-slate-800 text-slate-200 hover:text-white border-2 border-purple-500/40 hover:border-purple-400 shadow-sm hover:scale-[1.02]'
                  : 'bg-white hover:bg-indigo-50/70 text-slate-900 hover:text-indigo-900 border-2 border-slate-300 hover:border-indigo-500 shadow-sm hover:scale-[1.02]'
            }`}
            title="Go to Dashboard (Home)"
            aria-label="Home Dashboard"
          >
            <LayoutDashboard className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
              activeModule === 'dashboard'
                ? 'text-white'
                : isDark ? 'text-purple-400' : 'text-indigo-600'
            }`} />
          </button>

          {/* Module Pill Tabs */}
          {visibleModules
            .filter(mod => mod.key !== 'dashboard')
            .map(mod => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.key;

              return (
                <button
                  key={mod.key}
                  type="button"
                  onClick={() => onSelectModule(mod.key)}
                  className={`flex items-center gap-2 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-2xl text-xs sm:text-[13px] font-extrabold tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer select-none shrink-0 ${
                    isActive
                      ? isDark
                        ? 'bg-gradient-to-r from-purple-700 via-indigo-600 to-violet-700 text-white border-2 border-purple-300 shadow-lg shadow-purple-950/80 ring-2 ring-purple-400/50 scale-[1.03]'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-2 border-indigo-700 shadow-md shadow-indigo-300 ring-2 ring-indigo-400/60 scale-[1.03]'
                      : isDark
                        ? 'bg-[#131728]/95 hover:bg-slate-800 text-slate-100 hover:text-white border-2 border-purple-500/40 hover:border-purple-400 shadow-sm hover:scale-[1.02]'
                        : 'bg-white hover:bg-indigo-50/70 text-slate-900 hover:text-indigo-950 border-2 border-slate-300 hover:border-indigo-500 shadow-sm hover:scale-[1.02]'
                  }`}
                  title={mod.description}
                >
                  <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${
                    isActive
                      ? 'text-white'
                      : isDark ? 'text-purple-400' : 'text-indigo-600'
                  }`} />
                  <span className={isActive ? 'text-white font-black' : isDark ? 'text-slate-100 font-extrabold' : 'text-slate-900 font-black'}>
                    {mod.label}
                  </span>
                  {mod.badge && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-rose-500 text-white shadow-xs">
                      {mod.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>
      </div>
    </header>
  );
};
