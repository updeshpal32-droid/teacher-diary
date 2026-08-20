import React, { useState } from 'react';
import RemedialAssistancePlan20a from './RemedialAssistancePlan20a';
import RemedialTeachingDetails20b from './RemedialTeachingDetails20b';
import RemedialPerformanceTracking20c from './RemedialPerformanceTracking20c';
import ExemplaryChildren21 from './ExemplaryChildren21';
import { Target, BookOpen, TrendingUp, Trophy, Layers } from 'lucide-react';

interface RemedialAndExemplaryManagerProps {
  devMode?: boolean;
  initialSubTab?: '20a' | '20b' | '20c' | '21';
}

export const RemedialAndExemplaryManager: React.FC<RemedialAndExemplaryManagerProps> = ({
  devMode,
  initialSubTab = '20a'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'20a' | '20b' | '20c' | '21'>(initialSubTab);

  return (
    <div className="space-y-6">
      {/* Top Unified Switcher Bar */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('20a')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === '20a'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <Target className="w-4 h-4 text-rose-400" />
            <span>20(a). Remedial Plan (P-34)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('20b')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === '20b'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>20(b). Teaching Details (P-35)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('20c')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === '20c'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>20(c). Performance Tracking (P-36)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('21')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === '21'
                ? 'bg-gradient-to-r from-amber-600 to-indigo-600 text-white shadow-md shadow-amber-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>21. Exemplary Children (P-37)</span>
          </button>
        </div>

        <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] font-semibold text-purple-300">
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>KVS Modules 20 &amp; 21 (Pages 34 to 37)</span>
        </div>
      </div>

      {/* Render Active Sub-Component */}
      {activeSubTab === '20a' && <RemedialAssistancePlan20a devMode={devMode} />}
      {activeSubTab === '20b' && <RemedialTeachingDetails20b devMode={devMode} />}
      {activeSubTab === '20c' && <RemedialPerformanceTracking20c devMode={devMode} />}
      {activeSubTab === '21' && <ExemplaryChildren21 devMode={devMode} />}
    </div>
  );
};

export const RemedialTeachingManager20 = RemedialAndExemplaryManager;
export default RemedialAndExemplaryManager;
