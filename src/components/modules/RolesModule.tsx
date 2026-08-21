import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Award, Users } from 'lucide-react';
import { PortfolioRoleManager } from '../PortfolioRoleManager';
import { MyPortfoliosView } from '../MyPortfoliosView';
import SubjectCommitteeManager from '../SubjectCommitteeManager';
import { UserAccount } from '../../types/auth';

interface RolesModuleProps {
  devMode: boolean;
  currentUser: UserAccount | null;
  onOpenAssignModal?: () => void;
}

export type RolesSubTab = 'committees' | 'my_roles' | 'subject_meetings';

export const RolesModule: React.FC<RolesModuleProps> = ({
  devMode,
  currentUser,
  onOpenAssignModal
}) => {
  const [activeTab, setActiveTab] = useState<RolesSubTab>('committees');
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 light:border-slate-200 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('committees')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'committees'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KVS 50 Committees & Portfolios</span>
          </button>

          <button
            onClick={() => setActiveTab('my_roles')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my_roles'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>My Assigned Roles</span>
          </button>

          <button
            onClick={() => setActiveTab('subject_meetings')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'subject_meetings'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Subject Committee Meetings (P-18/24)</span>
          </button>
        </div>

        {isAdmin && onOpenAssignModal && (
          <button
            type="button"
            onClick={onOpenAssignModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-sm cursor-pointer shrink-0"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Assign Staff Roles</span>
          </button>
        )}
      </div>

      {activeTab === 'committees' && <PortfolioRoleManager devMode={devMode} />}
      {activeTab === 'my_roles' && <MyPortfoliosView devMode={devMode} currentUser={currentUser} />}
      {activeTab === 'subject_meetings' && <SubjectCommitteeManager devMode={devMode} />}
    </div>
  );
};
