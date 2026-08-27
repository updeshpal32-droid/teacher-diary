import React, { useState } from 'react';
import { ListTodo, Activity, Briefcase } from 'lucide-react';
import { TaskManager } from '../TaskManager';
import { WorkloadTracker } from '../WorkloadTracker';
import { WorkDoneOtherThanTeaching26 } from '../WorkDoneOtherThanTeaching26';

import { UserAccount } from '../../types/auth';

interface TasksModuleProps {
  devMode: boolean;
  currentUser?: UserAccount | null;
}

export type TasksSubTab = 'tasks' | 'hourly' | 'other_work';

export const TasksModule: React.FC<TasksModuleProps> = ({ devMode, currentUser }) => {
  const [activeTab, setActiveTab] = useState<TasksSubTab>('tasks');

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/10 light:border-slate-200">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'tasks'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>Task Manager & To-Dos</span>
        </button>

        <button
          onClick={() => setActiveTab('hourly')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'hourly'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Hourly Activity & Duty Log</span>
        </button>

        <button
          onClick={() => setActiveTab('other_work')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'other_work'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Work Done Other Than Teaching</span>
        </button>
      </div>

      {activeTab === 'tasks' && <TaskManager devMode={devMode} currentUser={currentUser} />}
      {activeTab === 'hourly' && <WorkloadTracker devMode={devMode} currentUser={currentUser} />}
      {activeTab === 'other_work' && <WorkDoneOtherThanTeaching26 devMode={devMode} />}
    </div>
  );
};
