import React, { useState } from 'react';
import { Settings, Users, MessageSquare } from 'lucide-react';
import { SettingsManager } from '../SettingsManager';
import { UserAccountManager } from '../UserAccountManager';
import { TicketFeedbackManager } from '../TicketFeedbackManager';
import { UserAccount } from '../../types/auth';
import { isAdminOrDataManager } from '../../lib/permissions';

interface SettingsModuleProps {
  devMode: boolean;
  onToggleDevMode: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: (newTheme: 'dark' | 'light') => void;
  currentUser: UserAccount | null;
  onSwitchAccount?: () => void;
  onNavigateTab: (tab: any) => void;
}

export type SettingsSubTab = 'preferences' | 'accounts' | 'feedback';

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  devMode,
  onToggleDevMode,
  theme,
  onToggleTheme,
  currentUser,
  onSwitchAccount,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<SettingsSubTab>('preferences');
  const isAdmin = isAdminOrDataManager(currentUser);
  const isDark = theme !== 'light';

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b ${
        isDark ? 'border-white/10' : 'border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'preferences'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : isDark
                ? 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>General Preferences & Backup</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'accounts'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : isDark
                  ? 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Accounts & RBAC</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'feedback'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : isDark
                ? 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Feedback & Support Desk</span>
        </button>
      </div>

      {activeTab === 'preferences' && (
        <SettingsManager
          devMode={devMode}
          onToggleDevMode={onToggleDevMode}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onNavigateTab={onNavigateTab}
          currentUser={currentUser}
          onSwitchAccount={onSwitchAccount}
        />
      )}

      {activeTab === 'accounts' && <UserAccountManager currentUserId={currentUser?.id} theme={theme} />}

      {activeTab === 'feedback' && (
        <TicketFeedbackManager devMode={devMode} currentUser={currentUser} theme={theme} />
      )}
    </div>
  );
};
