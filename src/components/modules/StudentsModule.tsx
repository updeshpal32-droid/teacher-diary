import React, { useState } from 'react';
import { GraduationCap, Users, CalendarCheck, Activity, Award } from 'lucide-react';
import { StudentProfileManager } from '../StudentProfileManager';
import { StudentAttendanceEnrollmentManager } from '../StudentAttendanceEnrollmentManager';
import StudentBehaviourObservationManager from '../StudentBehaviourObservationManager';
import { RemedialAndExemplaryManager } from '../RemedialTeachingManager20';

interface StudentsModuleProps {
  devMode: boolean;
}

export type StudentsSubTab = 'directory' | 'attendance' | 'behaviour' | 'remedial';

export const StudentsModule: React.FC<StudentsModuleProps> = ({ devMode }) => {
  const [activeTab, setActiveTab] = useState<StudentsSubTab>('directory');

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/10 light:border-slate-200">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'directory'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student Directory (P-15 & 21)</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Attendance & Enrollment</span>
        </button>

        <button
          onClick={() => setActiveTab('behaviour')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'behaviour'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Behaviour & Anecdotal (P-28-30)</span>
        </button>

        <button
          onClick={() => setActiveTab('remedial')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'remedial'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Remedial & Exemplary (P-20-21)</span>
        </button>
      </div>

      {activeTab === 'directory' && <StudentProfileManager devMode={devMode} />}
      {activeTab === 'attendance' && <StudentAttendanceEnrollmentManager devMode={devMode} />}
      {activeTab === 'behaviour' && <StudentBehaviourObservationManager devMode={devMode} />}
      {activeTab === 'remedial' && <RemedialAndExemplaryManager devMode={devMode} />}
    </div>
  );
};
