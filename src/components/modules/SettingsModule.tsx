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

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/10 light:border-slate-200">
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'preferences'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>General Preferences & Backup</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'accounts'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Accounts & RBAC</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'feedback'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
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

      {activeTab === 'accounts' && <UserAccountManager currentUserId={currentUser?.id} />}

      {activeTab === 'feedback' && (
        <TicketFeedbackManager devMode={devMode} currentUser={currentUser} />
      )}
    </div>
  );
};
