import React, { useState } from 'react';
import {
  BookOpen,
  Sparkle,
  GraduationCap,
  Calendar,
  FileText,
  ClipboardCheck,
  TrendingUp,
  Award,
  Users,
  Mic,
  BookMarked,
  Activity,
  Layers,
  HeartHandshake,
  LayoutGrid
} from 'lucide-react';
import SyllabusPlanner from '../SyllabusPlanner';
import DailyLessonPlanEditor from '../DailyLessonPlanEditor';
import { AssessmentProgressManager } from '../AssessmentProgressManager';
import ResultAnalysisManagerVItoXII from '../ResultAnalysisManagerVItoXII';
import PedagogicalRecords28To30 from '../PedagogicalRecords28To30';
import InstitutionalMeetingsManager22to24 from '../InstitutionalMeetingsManager22to24';
import { TemplateReportGenerator } from '../TemplateReportGenerator';

// Primary / Foundational Components
import MonitoringCumReportingTool from '../MonitoringCumReportingTool';
import NipunMeetingsManager from '../NipunMeetingsManager';
import ScholasticAssessmentItoII from '../ScholasticAssessmentItoII';
import NotebookCorrectionIIItoV from '../NotebookCorrectionIIItoV';
import SeaEvaluationIIItoV from '../SeaEvaluationIIItoV';
import ScholasticAssessmentIIItoV from '../ScholasticAssessmentIIItoV';
import ResultAnalysisIIItoV from '../ResultAnalysisIIItoV';
import OralReadingFluencyTracker from '../OralReadingFluencyTracker';
import PtmMeetingManager from '../PtmMeetingManager';

import { UserAccount } from '../../types/auth';
import { StaffDetailRecord } from '../../types/academic';

interface TeacherDiaryModuleProps {
  devMode: boolean;
  theme: 'dark' | 'light';
  currentUser: UserAccount | null;
  activeInspectedTeacher?: StaffDetailRecord | null;
  onOpenReportGenerator?: () => void;
}

export type DiaryStage = 'primary' | 'secondary';

type PrimarySubTab =
  | 'overview'
  | 'syllabus'
  | 'lessonplan'
  | 'monitoring'
  | 'nipun'
  | 'scholastic_1_2'
  | 'notebook_3_5'
  | 'sea_3_5'
  | 'scholastic_3_5'
  | 'result_analysis'
  | 'orf_tara'
  | 'ptm';

type SecondarySubTab =
  | 'overview'
  | 'syllabus'
  | 'lessonplan'
  | 'assessment'
  | 'result_analysis'
  | 'pedagogical'
  | 'meetings'
  | 'reports';

export const TeacherDiaryModule: React.FC<TeacherDiaryModuleProps> = ({
  devMode,
  theme,
  currentUser,
  activeInspectedTeacher,
  onOpenReportGenerator
}) => {
  const [stage, setStage] = useState<DiaryStage>('secondary');
  const [primaryTab, setPrimaryTab] = useState<PrimarySubTab>('syllabus');
  const [secondaryTab, setSecondaryTab] = useState<SecondarySubTab>('syllabus');

  return (
    <div className="space-y-4">
      {/* Eye-Catching Stage Toggle Header */}
      <div className="p-3 sm:p-4 rounded-2xl border backdrop-blur-xl bg-white/5 dark:bg-white/5 light:bg-white light:border-slate-200 border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
            stage === 'primary'
              ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
              : 'bg-gradient-to-br from-purple-500 to-indigo-600'
          }`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 light:text-slate-900">
                Teacher's Academic Diary
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                stage === 'primary'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}>
                {stage === 'primary' ? 'Balvatika – Class V' : 'Class VI – XII'}
              </span>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-500">
              {stage === 'primary'
                ? 'Foundational & Preparatory Stage (34-Page KVS Matrix)'
                : 'Middle & Secondary Stage (52-Page Master Format)'}
            </p>
          </div>
        </div>

        {/* Prominent Primary | Secondary Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-black/30 dark:bg-black/40 light:bg-slate-100 border border-white/10 light:border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStage('primary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              stage === 'primary'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
            }`}
          >
            <Sparkle className="w-3.5 h-3.5" />
            <span>Primary (Balvatika – V)</span>
          </button>

          <button
            type="button"
            onClick={() => setStage('secondary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              stage === 'secondary'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Secondary (VI – XII)</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs & Views */}
      {stage === 'primary' ? (
        <div className="space-y-4">
          {/* Primary Sub Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/10 light:border-slate-200">
            <button
              onClick={() => setPrimaryTab('syllabus')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                primaryTab === 'syllabus'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Syllabus Planner</span>
            </button>

            <button
              onClick={() => setPrimaryTab('lessonplan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                primaryTab === 'lessonplan'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Daily Lesson Plans</span>
            </button>

            <button
              onClick={() => setPrimaryTab('monitoring')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                primaryTab === 'monitoring'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Monitoring Tool (P-13)</span>
            </button>

            <button
              onClick={() => setPrimaryTab('nipun')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                primaryTab === 'nipun'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <Sparkle className="w-3.5 h-3.5" />
              <span>NIPUN Meetings</span>
            </button>

            <button
              onClick={() => setPrimaryTab('scholastic_1_2')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                primaryTab === 'scholastic_1_2'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Scholastic (I-II)</span>
            </button>

            <button
              onClick={() => setPrimaryTab('notebook_3_5')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                primaryTab === 'notebook_3_5'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Notebooks (III-V)</span>
            </button>

            <button
              onClick={() => setPrimaryTab('sea_3_5')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                primaryTab === 'sea_3_5'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>SEA Enrichment (III-V)</span>
            </button>

            <button
              onClick={() => setPrimaryTab('scholastic_3_5')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                primaryTab === 'scholastic_3_5'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Scholastic Progress (III-V)</span>
            </button>

            <button
              onClick={() => setPrimaryTab('result_analysis')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                primaryTab === 'result_analysis'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Result Analysis</span>
            </button>

            <button
              onClick={() => setPrimaryTab('orf_tara')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                primaryTab === 'orf_tara'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Reading Fluency (TARA)</span>
            </button>

            <button
              onClick={() => setPrimaryTab('ptm')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                primaryTab === 'ptm'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>PTM Meetings</span>
            </button>
          </div>

          {/* Render Primary Tab View */}
          {primaryTab === 'syllabus' && <SyllabusPlanner devMode={devMode} />}
          {primaryTab === 'lessonplan' && <DailyLessonPlanEditor devMode={devMode} />}
          {primaryTab === 'monitoring' && <MonitoringCumReportingTool devMode={devMode} />}
          {primaryTab === 'nipun' && <NipunMeetingsManager devMode={devMode} />}
          {primaryTab === 'scholastic_1_2' && <ScholasticAssessmentItoII devMode={devMode} />}
          {primaryTab === 'notebook_3_5' && <NotebookCorrectionIIItoV devMode={devMode} />}
          {primaryTab === 'sea_3_5' && <SeaEvaluationIIItoV devMode={devMode} />}
          {primaryTab === 'scholastic_3_5' && <ScholasticAssessmentIIItoV devMode={devMode} term={1} />}
          {primaryTab === 'result_analysis' && <ResultAnalysisIIItoV devMode={devMode} />}
          {primaryTab === 'orf_tara' && <OralReadingFluencyTracker devMode={devMode} />}
          {primaryTab === 'ptm' && <PtmMeetingManager devMode={devMode} />}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Secondary Sub Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/10 light:border-slate-200">
            <button
              onClick={() => setSecondaryTab('syllabus')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                secondaryTab === 'syllabus'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Syllabus Planner</span>
            </button>

            <button
              onClick={() => setSecondaryTab('lessonplan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                secondaryTab === 'lessonplan'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Daily Lesson Plans</span>
            </button>

            <button
              onClick={() => setSecondaryTab('assessment')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                secondaryTab === 'assessment'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Assessment & Progress (PT/HY/Board)</span>
            </button>

            <button
              onClick={() => setSecondaryTab('result_analysis')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                secondaryTab === 'result_analysis'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>CBSE Result Analysis (VI-XII)</span>
            </button>

            <button
              onClick={() => setSecondaryTab('pedagogical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                secondaryTab === 'pedagogical'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Pedagogical Records (P-28-30)</span>
            </button>

            <button
              onClick={() => setSecondaryTab('meetings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                secondaryTab === 'meetings'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Institutional Meetings (P-22-24)</span>
            </button>

            <button
              onClick={() => setSecondaryTab('reports')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                secondaryTab === 'reports'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Master PDF Reports</span>
            </button>
          </div>

          {/* Render Secondary Tab View */}
          {secondaryTab === 'syllabus' && <SyllabusPlanner devMode={devMode} />}
          {secondaryTab === 'lessonplan' && <DailyLessonPlanEditor devMode={devMode} />}
          {secondaryTab === 'assessment' && <AssessmentProgressManager devMode={devMode} />}
          {secondaryTab === 'result_analysis' && <ResultAnalysisManagerVItoXII devMode={devMode} />}
          {secondaryTab === 'pedagogical' && <PedagogicalRecords28To30 devMode={devMode} />}
          {secondaryTab === 'meetings' && <InstitutionalMeetingsManager22to24 devMode={devMode} />}
          {secondaryTab === 'reports' && <TemplateReportGenerator devMode={devMode} />}
        </div>
      )}
    </div>
  );
};
