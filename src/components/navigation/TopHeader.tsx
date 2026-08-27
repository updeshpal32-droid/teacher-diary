import React from 'react';
import {
  Menu,
  Sun,
  Moon,
  History,
  HelpCircle,
  Sparkles,
  Layers
} from 'lucide-react';
import { CloudSyncBadge } from '../CloudSyncBadge';
import { UserAccount } from '../../types/auth';
import { TopModuleKey } from '../../lib/permissions';
import { ALL_MODULE_DEFINITIONS } from './TopNavBar';

export interface TopHeaderProps {
  activeModule: TopModuleKey;
  onOpenMobileMenu: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentUser: UserAccount | null;
  onOpenVersionHistory: () => void;
  onOpenInspector: () => void;
  devMode: boolean;
  onToggleDevMode: () => void;
  onNavigateTab?: (target: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeModule,
  onOpenMobileMenu,
  theme,
  onToggleTheme,
  currentUser,
  onOpenVersionHistory,
  onOpenInspector,
  devMode,
  onToggleDevMode,
  onNavigateTab
}) => {
  const isDark = theme !== 'light';
  const currentDef = ALL_MODULE_DEFINITIONS[activeModule] || {
    label: 'Dashboard',
    description: 'Teacher Personal Diary'
  };

  return (
    <header className={`sticky top-0 z-20 w-full backdrop-blur-xl border-b transition-colors px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 select-none ${
      isDark
        ? 'bg-[#0B0D14]/90 border-slate-800 text-white'
        : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
    }`}>
      {/* Left: Mobile Drawer Trigger + Active Module Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className={`lg:hidden p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
            isDark
              ? 'text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border-slate-700'
              : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
          }`}
          aria-label="Open Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex items-center gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-black tracking-tight truncate m-0 flex items-center gap-1.5">
                <span>{currentDef.label}</span>
              </h1>
              <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isDark
                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                  : 'bg-purple-100 text-purple-800 border-purple-300'
              }`}>
                KVS Personal Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden md:block m-0">
              {currentDef.description}
            </p>
          </div>
        </div>
      </div>

      {/* Right Tools: Sync Badge, History, Theme Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Cloud Sync Live Badge */}
        <CloudSyncBadge theme={theme} isFoundational={false} />

        {/* Revision Snapshots Trigger */}
        <button
          type="button"
          onClick={onOpenVersionHistory}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
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
              ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700'
              : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-indigo-300'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-700" />}
        </button>

        {/* Active User Name Badge (Quick glance) */}
        {currentUser && (
          <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
              {currentUser.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white truncate max-w-[120px] m-0">{currentUser.name}</p>
              <p className="text-[10px] text-purple-400 truncate m-0">{currentUser.designation || 'TGT (P&HE)'}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
