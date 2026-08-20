import React, { useState } from 'react';
import ResultAnalysisVItoX from './ResultAnalysisVItoX';
import ResultAnalysisXItoXII from './ResultAnalysisXItoXII';
import { DevModeBadge } from './DevModeBadge';
import {
  TrendingUp,
  FileSpreadsheet,
  Award,
  Layers,
  GraduationCap,
  Sparkles,
  BookOpen,
  ChevronRight
} from 'lucide-react';

interface ResultAnalysisManagerVItoXIIProps {
  devMode?: boolean;
  initialStage?: '18a' | '18b';
}

export const ResultAnalysisManagerVItoXII: React.FC<ResultAnalysisManagerVItoXIIProps> = ({
  devMode,
  initialStage = '18a'
}) => {
  const [activeSection, setActiveSection] = useState<'18a' | '18b'>(initialStage);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Dev Mode Traceability Badge */}
      {devMode && (
        <DevModeBadge
          pages={activeSection === '18a' ? 31 : 32}
          title={
            activeSection === '18a'
              ? '18(a) विषयानुसार परिणाम विश्लेषण (कक्षाएँ-6-10) (SUBJECT WISE RESULT ANALYSIS - Page 31, Landscape Format)'
              : '18(b) विषयानुसार परिणाम विश्लेषण (कक्षाएँ-11 & 12) (SUBJECT WISE RESULT ANALYSIS - Page 32, Landscape Format)'
          }
        />
      )}

      {/* Top Header & Stage Switcher Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>KVS Teacher Diary • Middle &amp; Senior Secondary Portal (P-31 &amp; P-32)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              18. विषयानुसार परिणाम विश्लेषण (कक्षाएँ-6 से 12)
            </h1>
            <h2 className="text-sm font-bold text-slate-300 tracking-wide mt-0.5 uppercase">
              SUBJECT WISE RESULT ANALYSIS (CLASSES VI TO XII)
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Comprehensive subject-wise examination performance ledger, pass percentage tracking, 5-tier distribution spectrum, and KVS Quality Performance Index (PI) for Middle, Secondary, and Senior Secondary classes.
            </p>
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveSection('18a')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeSection === '18a'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <div className="text-left">
                <div className="leading-none">18(a). Classes VI - X</div>
                <div className="text-[10px] opacity-75 font-normal mt-0.5">Middle &amp; Secondary (P-31)</div>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('18b')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeSection === '18b'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <div className="text-left">
                <div className="leading-none">18(b). Classes XI - XII</div>
                <div className="text-[10px] opacity-75 font-normal mt-0.5">Senior Secondary (P-32)</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Render Active Section */}
      <div>
        {activeSection === '18a' && (
          <ResultAnalysisVItoX devMode={false} />
        )}
        {activeSection === '18b' && (
          <ResultAnalysisXItoXII devMode={false} />
        )}
      </div>
    </div>
  );
};

export default ResultAnalysisManagerVItoXII;
