import React from 'react';
import { X, LogOut, User, Sparkle } from 'lucide-react';
import { TOP_MODULES, TopModuleKey } from './TopNavBar';
import { UserAccount } from '../../types/auth';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-[290px] sm:w-[320px] max-w-[85vw] p-4 flex flex-col justify-between shadow-2xl transition-transform duration-200 bg-[#0F111A]/98 dark:bg-[#0B0D14]/98 light:bg-white/98 text-slate-100 light:text-slate-900 border-r border-white/10 light:border-slate-200 overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-white/10 light:border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-serif font-bold text-sm text-white bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
                KV
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm leading-tight">Teacher's Diary</h3>
                <p className="text-[10px] text-slate-400">KV Kutra Portal</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-white/10 light:hover:bg-slate-100 cursor-pointer"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Module List (12 items) */}
          <div className="space-y-1 py-1">
            {TOP_MODULES.map(mod => {
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 light:text-slate-700 light:hover:text-slate-900 light:hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 light:text-slate-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{mod.label}</div>
                  </div>
                  {mod.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-400/20 text-purple-200">
                      {mod.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer User Profile / Auth */}
        <div className="pt-4 mt-2 border-t border-white/10 light:border-slate-200">
          {currentUser ? (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.role.toUpperCase()}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
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
