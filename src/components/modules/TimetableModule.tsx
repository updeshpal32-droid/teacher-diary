import React, { useState } from 'react';
import { Clock, Users } from 'lucide-react';
import { TimetablePlanner } from '../TimetablePlanner';
import { DutyAndProxyManager } from '../DutyAndProxyManager';
import { UserAccount } from '../../types/auth';

interface TimetableModuleProps {
  devMode: boolean;
  currentUser?: UserAccount | null;
}

export type TimetableSubTab = 'matrix' | 'duty_proxy';

export const TimetableModule: React.FC<TimetableModuleProps> = ({ devMode, currentUser }) => {
  const [activeTab, setActiveTab] = useState<TimetableSubTab>('matrix');

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/10 light:border-slate-200">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'matrix'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Weekly Timetable Matrix (P-6 & 7)</span>
        </button>

        <button
          onClick={() => setActiveTab('duty_proxy')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'duty_proxy'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Daily Duty & Proxy Arrangement</span>
        </button>
      </div>

      {activeTab === 'matrix' && <TimetablePlanner devMode={devMode} currentUser={currentUser} />}
      {activeTab === 'duty_proxy' && <DutyAndProxyManager devMode={devMode} currentUser={currentUser} />}
    </div>
  );
};
