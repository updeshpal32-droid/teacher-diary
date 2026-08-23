import React, { useState, useEffect } from 'react';
import { X, LogOut, User, Sparkle, Settings, HelpCircle } from 'lucide-react';
import { ALL_MODULE_DEFINITIONS, type TopModuleKey, type ModuleDefinition } from './TopNavBar';
import { UserAccount } from '../../types/auth';
import { PortfolioAssignment } from '../../types/academic';
import { getVisibleTopModules, isAdminOrDataManager } from '../../lib/permissions';
import { db, DEFAULT_PORTFOLIO_ASSIGNMENTS } from '../../lib/storage';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: TopModuleKey;
  onSelectModule: (module: TopModuleKey) => void;
  currentUser: UserAccount | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  activeModule,
  onSelectModule,
  currentUser,
  onOpenLoginModal,
  onLogout,
  theme
}) => {
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 w-[290px] sm:w-[320px] max-w-[85vw] p-4 flex flex-col justify-between shadow-2xl transition-transform duration-200 border-r overflow-y-auto ${
        isDark
          ? 'bg-[#0B0D14]/98 text-slate-100 border-white/10'
          : 'bg-white text-slate-900 border-slate-200 shadow-slate-300'
      }`}>
        <div>
          {/* Header */}
          <div className={`flex items-center justify-between pb-4 mb-2 border-b ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-serif font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
                KV
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm leading-tight">Teacher's Diary</h3>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>KV Kutra Portal</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dynamic Module List */}
          <div className="space-y-1 py-1">
            {visibleModules.map(mod => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.key;

              return (
                <button
                  key={mod.key}
                  type="button"
                  onClick={() => {
                    onSelectModule(mod.key);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                      : isDark
                        ? 'text-slate-300 hover:text-white hover:bg-white/5'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : isDark ? 'text-purple-400' : 'text-indigo-600'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{mod.label}</div>
                  </div>
                  {mod.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white shadow-xs">
                      {mod.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer User Profile & Settings Links */}
        <div className={`pt-4 mt-2 border-t space-y-2 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          {currentUser ? (
            <div className="space-y-1.5">
              <div className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border ${
                isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{currentUser.name}</p>
                  <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentUser.designation} • {currentUser.role.toUpperCase()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onSelectModule('settings');
                    onClose();
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold cursor-pointer ${
                    isDark ? 'bg-white/5 hover:bg-white/10 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 text-purple-500" />
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectModule('settings');
                    window.dispatchEvent(new CustomEvent('open-settings-tab', { detail: 'tickets' }));
                    onClose();
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold cursor-pointer ${
                    isDark ? 'bg-white/5 hover:bg-white/10 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Feedback</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onOpenLoginModal();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Login to Account</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
