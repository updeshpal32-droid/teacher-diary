import React, { useState } from 'react';
import PtmMeetingManager from './PtmMeetingManager';
import StaffMeetingManager from './StaffMeetingManager';
import SubjectCommitteeManager from './SubjectCommitteeManager';
import { HeartHandshake, Users, BookOpen, Layers } from 'lucide-react';

interface InstitutionalMeetingsManager22to24Props {
  devMode?: boolean;
  initialSubTab?: '22' | '23' | '24';
  diaryMode?: 'middle-secondary' | 'foundational-preparatory';
}

export const InstitutionalMeetingsManager22to24: React.FC<InstitutionalMeetingsManager22to24Props> = ({
  devMode,
  initialSubTab = '22',
  diaryMode = 'middle-secondary'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'22' | '23' | '24'>(initialSubTab);

  return (
    <div className="space-y-6">
      {/* Top Unified Switcher Bar */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('22')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === '22'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-rose-400" />
            <span>22. Parent-Teacher Meetings (P-38 to 41)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('23')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === '23'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>23. Staff Meetings Minutes (P-42 to 46)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('24')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === '24'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>24. Subject Committee Meetings (P-47 to 51)</span>
          </button>
        </div>

        <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] font-semibold text-purple-300">
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>KVS Modules 22, 23 &amp; 24 (Pages 38 to 51)</span>
        </div>
      </div>

      {/* Render Active Sub-Component */}
      {activeSubTab === '22' && <PtmMeetingManager devMode={devMode} diaryMode={diaryMode} />}
      {activeSubTab === '23' && <StaffMeetingManager devMode={devMode} diaryMode={diaryMode} />}
      {activeSubTab === '24' && <SubjectCommitteeManager devMode={devMode} diaryMode={diaryMode} />}
    </div>
  );
};

export default InstitutionalMeetingsManager22to24;
