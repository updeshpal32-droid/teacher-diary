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
  Shield
} from 'lucide-react';
import { CloudSyncBadge } from '../CloudSyncBadge';
import { UserAccount } from '../../types/auth';
import { PortfolioAssignment } from '../../types/academic';
import { type TopModuleKey, getVisibleTopModules, isAdminOrDataManager } from '../../lib/permissions';
import { db, DEFAULT_PORTFOLIO_ASSIGNMENTS } from '../../lib/storage';

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

  useEffect(() => {
    const loadAssignments = async () => {
      const saved = await db.get<PortfolioAssignment[]>('setup:portfolio_assignments');
      setAssignments(saved && saved.length > 0 ? saved : DEFAULT_PORTFOLIO_ASSIGNMENTS);
    };
    loadAssignments();

    const handleUpdate = () => loadAssignments();
    window.addEventListener('kvs-portfolios-updated', handleUpdate);
    return () => window.removeEventListener('kvs-portfolios-updated', handleUpdate);
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
  const visibleModuleKeys = getVisibleTopModules(currentUser, assignments);
  const visibleModules = visibleModuleKeys
    .map(key => ALL_MODULE_DEFINITIONS[key])
    .filter(Boolean);

  const isAdmin = isAdminOrDataManager(currentUser);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-colors duration-200 bg-[#0F111A]/90 dark:bg-[#0B0D14]/95 border-white/10 dark:border-white/10 light:bg-white/95 light:border-slate-200">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-5">
        {/* Top Action Row */}
        <div className="flex items-center justify-between h-14 gap-2 sm:gap-4">
          
          {/* Left: Brand & Mobile Hamburger */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl border transition-all text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10 light:text-slate-700 light:bg-slate-100 light:border-slate-200 cursor-pointer"
              aria-label="Open Mobile Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* School Brand Mark */}
            <div
              onClick={() => onSelectModule('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
              title="Go to Dashboard"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-serif font-bold text-sm sm:text-base text-white shadow-md transition-transform group-hover:scale-105 bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600">
                KV
              </div>
              <div className="min-w-0">
                <div className="font-serif font-bold text-sm sm:text-base text-slate-100 dark:text-slate-100 light:text-slate-900 leading-none tracking-tight truncate flex items-center gap-1.5">
                  <span>KVS Teacher's Diary</span>
                  <span className="hidden xl:inline-block px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    KV Kutra
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 leading-tight truncate mt-0.5">
                  {currentUser?.designation ? `${currentUser.designation} Portal` : 'Smart School Suite'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Icons & User Session Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Persistent Task / Work Shortcut Button */}
            <button
              type="button"
              onClick={onQuickTasksClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border-purple-500/40 light:bg-purple-50 light:text-purple-700 light:border-purple-200"
              title="Quick Work & Task Manager Shortcut"
            >
              <ListTodo className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Tasks</span>
            </button>

            {/* Cloud Sync Live Badge */}
            <CloudSyncBadge theme={theme} isFoundational={false} />

            {/* Version History Trigger */}
            <button
              type="button"
              onClick={onOpenVersionHistory}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer bg-white/5 hover:bg-white/10 text-slate-200 border-white/10 light:bg-slate-100 light:text-slate-700 light:border-slate-200"
              title="Revision Snapshots & History"
            >
              <History className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden md:inline">History</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer bg-white/5 hover:bg-white/10 text-slate-200 border-white/10 light:bg-slate-100 light:text-slate-700 light:border-slate-200"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
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
                      ? 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-500/40 text-rose-200 light:bg-rose-50 light:text-rose-700 light:border-rose-200'
                      : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/40 text-emerald-200 light:bg-emerald-50 light:text-emerald-700 light:border-emerald-200'
                  }`}
                  title="Active User Session & Settings"
                >
                  <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-[10px] font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="hidden md:inline max-w-[130px] truncate">{currentUser.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
                <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl shadow-2xl border z-50 backdrop-blur-xl bg-[#131722]/98 border-white/10 text-slate-200 light:bg-white/98 light:border-slate-200 light:text-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="p-2.5 border-b border-white/10 light:border-slate-100">
                    <p className="text-xs font-bold truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser.designation} • {currentUser.employeeCode || 'KV Staff'}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {currentUser.role.toUpperCase()}
                      </span>
                      {currentUser.isClassTeacherOf && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-xl hover:bg-white/10 light:hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="font-semibold">Settings & Preferences</div>
                        <div className="text-[10px] text-slate-400">Theme, backup & account options</div>
                      </div>
                    </button>

                    {/* Feedback & Support Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onSelectModule('settings');
                        window.dispatchEvent(new CustomEvent('open-settings-tab', { detail: 'tickets' }));
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-xl hover:bg-white/10 light:hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="font-semibold">Feedback & Support Desk</div>
                        <div className="text-[10px] text-slate-400">Report issue or feature suggestion</div>
                      </div>
                    </button>

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span className="font-semibold">Switch Account / Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Desktop Horizontal Navigation Bar (Filtered dynamically by role) */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1.5 border-t border-white/5 light:border-slate-100 scrollbar-none">
          {visibleModules.map(mod => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.key;

            return (
              <button
                key={mod.key}
                type="button"
                onClick={() => onSelectModule(mod.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100'
                }`}
                title={mod.description}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 light:text-slate-500'}`} />
                <span>{mod.label}</span>
                {mod.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-400/20 text-purple-200">
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
