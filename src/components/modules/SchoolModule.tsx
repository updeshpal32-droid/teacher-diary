import React, { useState } from 'react';
import { Building2, Calendar, BookOpen, ClipboardCheck } from 'lucide-react';
import { SchoolSessionForm } from '../SchoolSessionForm';
import { KvsCalendarManager } from '../KvsCalendarManager';
import { ClassSubjectManager } from '../ClassSubjectManager';
import { InspectionReviewManager } from '../InspectionReviewManager';

interface SchoolModuleProps {
  devMode: boolean;
  theme?: 'dark' | 'light';
}

export type SchoolSubTab = 'profile' | 'calendar' | 'classes' | 'inspections';

export const SchoolModule: React.FC<SchoolModuleProps> = ({ devMode, theme = 'dark' }) => {
  const isDark = theme !== 'light';
  const [activeTab, setActiveTab] = useState<SchoolSubTab>('profile');

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b ${
        isDark ? 'border-white/10' : 'border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : isDark
                ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-xs'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>School Profile & Session</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'calendar'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : isDark
                ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-xs'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendar & Holidays (P-5 & 33)</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'classes'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : isDark
                ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-xs'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Classes & Subjects</span>
        </button>

        <button
          onClick={() => setActiveTab('inspections')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'inspections'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : isDark
                ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-xs'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Inspection & Reviews (P-4, 48, 50)</span>
        </button>
      </div>

      {activeTab === 'profile' && <SchoolSessionForm devMode={devMode} />}
      {activeTab === 'calendar' && <KvsCalendarManager devMode={devMode} />}
      {activeTab === 'classes' && <ClassSubjectManager devMode={devMode} />}
      {activeTab === 'inspections' && <InspectionReviewManager devMode={devMode} />}
    </div>
  );
};
