import React, { useState, useEffect } from 'react';
import {
  MonitoringCumReportingRecord,
  LateBloomerProgressRecord,
  StudentProfile,
  ClassSection,
  SubjectItem,
  RemedialProgressStatus
} from '../types/academic';
import {
  db,
  DEFAULT_MONITORING_CUM_REPORTING,
  DEFAULT_LATE_BLOOMER_PROGRESS,
  DEFAULT_STUDENTS,
  DEFAULT_CLASSES,
  DEFAULT_SUBJECTS
} from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  Target,
  Users,
  Search,
  Plus,
  Save,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Filter,
  BookOpen,
  X,
  FileCheck
} from 'lucide-react';

interface MonitoringCumReportingToolProps {
  devMode: boolean;
}

export default function MonitoringCumReportingTool({ devMode }: MonitoringCumReportingToolProps) {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'late_bloomers'>('monitoring');
  const [monitoringRecords, setMonitoringRecords] = useState<MonitoringCumReportingRecord[]>([]);
  const [lateBloomerRecords, setLateBloomerRecords] = useState<LateBloomerProgressRecord[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMonitoring, setEditingMonitoring] = useState<MonitoringCumReportingRecord | null>(null);
  const [editingLateBloomer, setEditingLateBloomer] = useState<LateBloomerProgressRecord | null>(null);

  // Form Fields
  const [formStudentId, setFormStudentId] = useState('');
  const [formClassId, setFormClassId] = useState('cls-1a');
  const [formSubjectId, setFormSubjectId] = useState('sbj-p02');
  const [formTlo, setFormTlo] = useState('');
  const [formStrategies, setFormStrategies] = useState('');
  const [formStatus, setFormStatus] = useState<RemedialProgressStatus>('Developing');
  const [formMonth, setFormMonth] = useState('August');
  const [formObsNotes, setFormObsNotes] = useState('');
  const [formTestScore, setFormTestScore] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const mRecords = (await db.get<MonitoringCumReportingRecord[]>('setup:monitoring_cum_reporting')) || DEFAULT_MONITORING_CUM_REPORTING;
    const lbRecords = (await db.get<LateBloomerProgressRecord[]>('setup:late_bloomer_progress')) || DEFAULT_LATE_BLOOMER_PROGRESS;
    const stds = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    const cls = (await db.get<ClassSection[]>('setup:classes')) || DEFAULT_CLASSES;
    const sbjs = (await db.get<SubjectItem[]>('setup:subjects')) || DEFAULT_SUBJECTS;

    setMonitoringRecords(mRecords);
    setLateBloomerRecords(lbRecords);
    setStudents(stds);
    setClasses(cls);
    setSubjects(sbjs);
  };

  const handleSaveMonitoring = async () => {
    if (!formStudentId || !formTlo) return;

    let updated: MonitoringCumReportingRecord[];
    if (editingMonitoring) {
      updated = monitoringRecords.map(m =>
        m.id === editingMonitoring.id
          ? {
              ...m,
              studentId: formStudentId,
              classSectionId: formClassId,
              subjectId: formSubjectId,
              tloNotAchieved: formTlo,
              remedialStrategies: formStrategies,
              progressStatus: formStatus,
              updatedAt: new Date().toISOString()
            }
          : m
      );
    } else {
      const newRec: MonitoringCumReportingRecord = {
        id: `mcr-${Date.now()}`,
        studentId: formStudentId,
        classSectionId: formClassId,
        subjectId: formSubjectId,
        tloNotAchieved: formTlo,
        remedialStrategies: formStrategies,
        progressStatus: formStatus,
        updatedAt: new Date().toISOString()
      };
      updated = [newRec, ...monitoringRecords];
    }

    setMonitoringRecords(updated);
    await db.set('setup:monitoring_cum_reporting', updated);
    closeModal();
  };

  const handleSaveLateBloomer = async () => {
    if (!formStudentId || !formObsNotes) return;

    let updated: LateBloomerProgressRecord[];
    if (editingLateBloomer) {
      updated = lateBloomerRecords.map(lb =>
        lb.id === editingLateBloomer.id
          ? {
              ...lb,
              studentId: formStudentId,
              classSectionId: formClassId,
              subjectId: formSubjectId,
              month: formMonth,
              observationalNotes: formObsNotes,
              testScoreProgress: formTestScore
            }
          : lb
      );
    } else {
      const newRec: LateBloomerProgressRecord = {
        id: `lbp-${Date.now()}`,
        studentId: formStudentId,
        classSectionId: formClassId,
        subjectId: formSubjectId,
        month: formMonth,
        observationalNotes: formObsNotes,
        testScoreProgress: formTestScore
      };
      updated = [newRec, ...lateBloomerRecords];
    }

    setLateBloomerRecords(updated);
    await db.set('setup:late_bloomer_progress', updated);
    closeModal();
  };

  const handleDeleteMonitoring = async (id: string) => {
    const updated = monitoringRecords.filter(m => m.id !== id);
    setMonitoringRecords(updated);
    await db.set('setup:monitoring_cum_reporting', updated);
  };

  const handleDeleteLateBloomer = async (id: string) => {
    const updated = lateBloomerRecords.filter(lb => lb.id !== id);
    setLateBloomerRecords(updated);
    await db.set('setup:late_bloomer_progress', updated);
  };

  const openAddModal = () => {
    const firstStd = students[0]?.id || '';
    setFormStudentId(firstStd);
    setFormClassId('cls-1a');
    setFormSubjectId('sbj-p02');
    setFormTlo('');
    setFormStrategies('');
    setFormStatus('Developing');
    setFormMonth('August');
    setFormObsNotes('');
    setFormTestScore('');
    setEditingMonitoring(null);
    setEditingLateBloomer(null);
    setIsModalOpen(true);
  };

  const openEditMonitoring = (m: MonitoringCumReportingRecord) => {
    setEditingMonitoring(m);
    setFormStudentId(m.studentId);
    setFormClassId(m.classSectionId);
    setFormSubjectId(m.subjectId);
    setFormTlo(m.tloNotAchieved);
    setFormStrategies(m.remedialStrategies);
    setFormStatus(m.progressStatus);
    setIsModalOpen(true);
  };

  const openEditLateBloomer = (lb: LateBloomerProgressRecord) => {
    setEditingLateBloomer(lb);
    setFormStudentId(lb.studentId);
    setFormClassId(lb.classSectionId);
    setFormSubjectId(lb.subjectId);
    setFormMonth(lb.month);
    setFormObsNotes(lb.observationalNotes);
    setFormTestScore(lb.testScoreProgress);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMonitoring(null);
    setEditingLateBloomer(null);
  };

  const getStudentName = (id: string) => {
    const s = students.find(std => std.id === id);
    return s ? `${s.name} (Roll #${s.rollNo})` : id;
  };

  const filteredMonitoring = monitoringRecords.filter(r => {
    const matchesClass = selectedClass === 'All' || r.classSectionId === selectedClass;
    const stdName = getStudentName(r.studentId).toLowerCase();
    const matchesSearch =
      stdName.includes(searchQuery.toLowerCase()) ||
      r.tloNotAchieved.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.remedialStrategies.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const filteredLateBloomers = lateBloomerRecords.filter(r => {
    const matchesClass = selectedClass === 'All' || r.classSectionId === selectedClass;
    const stdName = getStudentName(r.studentId).toLowerCase();
    const matchesSearch =
      stdName.includes(searchQuery.toLowerCase()) ||
      r.observationalNotes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.testScoreProgress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {devMode && (
        <DevModeBadge
          pages={[13, 14]}
          title="Monitoring cum Remedial Reporting & Late Bloomers Progress Record (Pages 13 & 14c)"
        />
      )}

      {/* Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <span>Targeted Learning Outcomes (TLO) & Remedial Tracker</span>
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Official NIPUN Bharat Continuous Remedial Support & Late Bloomer Progression Ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-black/30 p-1 rounded-xl border border-white/10 flex gap-1">
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'monitoring'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              Module 13: Monitoring Record
            </button>
            <button
              onClick={() => setActiveTab('late_bloomers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'late_bloomers'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              Module 14(c): Late Bloomers
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white/5 border border-white/10 p-4 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-purple-300/60" />
          <input
            type="text"
            placeholder="Search student, TLO description, notes, or strategy..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-purple-100 placeholder-purple-300/40 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-purple-300" />
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-purple-200 focus:outline-none"
          >
            <option value="All">All Primary Classes</option>
            <option value="cls-1a">Class I-A</option>
            <option value="cls-2a">Class II-A</option>
            <option value="cls-3a">Class III-A</option>
            <option value="cls-4a">Class IV-A</option>
            <option value="cls-5a">Class V-A</option>
          </select>
        </div>
      </div>

      {/* Content View */}
      {activeTab === 'monitoring' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMonitoring.map(rec => (
            <div
              key={rec.id}
              className="bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all p-5 rounded-2xl flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                      TLO
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{getStudentName(rec.studentId)}</h3>
                      <span className="text-[10px] text-indigo-300 font-mono">
                        Class: {rec.classSectionId.replace('cls-', '').toUpperCase()} | Sub: {rec.subjectId}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      rec.progressStatus === 'Achieved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : rec.progressStatus === 'Developing'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {rec.progressStatus}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider">
                      Targeted Learning Outcome Not Achieved:
                    </span>
                    <p className="text-xs text-white/90 mt-0.5 leading-relaxed">{rec.tloNotAchieved}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                      Remedial TLM / Strategy Applied:
                    </span>
                    <p className="text-xs text-indigo-100/80 mt-0.5 leading-relaxed">{rec.remedialStrategies}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <span className="text-[10px] text-[var(--text-dim)] font-mono">
                  Updated: {new Date(rec.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditMonitoring(rec)}
                    className="p-1.5 hover:bg-white/10 text-indigo-300 rounded-lg transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMonitoring(rec.id)}
                    className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredMonitoring.length === 0 && (
            <div className="col-span-2 text-center py-12 text-purple-300/60 text-xs font-mono">
              No monitoring records found for the selected filter.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLateBloomers.map(rec => (
            <div
              key={rec.id}
              className="bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all p-5 rounded-2xl flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                      LB
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{getStudentName(rec.studentId)}</h3>
                      <span className="text-[10px] text-purple-300 font-mono">
                        Month: {rec.month} | Class: {rec.classSectionId.replace('cls-', '').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Continuous Progress
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">
                      Teacher's Observational Notes:
                    </span>
                    <p className="text-xs text-white/90 mt-0.5 leading-relaxed">{rec.observationalNotes}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                      Diagnostic / Test Score Progress:
                    </span>
                    <p className="text-xs text-emerald-100/90 mt-0.5 leading-relaxed">{rec.testScoreProgress}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <span className="text-[10px] text-[var(--text-dim)] font-mono">NIPUN Lakshya Tracking</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditLateBloomer(rec)}
                    className="p-1.5 hover:bg-white/10 text-purple-300 rounded-lg transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteLateBloomer(rec.id)}
                    className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredLateBloomers.length === 0 && (
            <div className="col-span-2 text-center py-12 text-purple-300/60 text-xs font-mono">
              No late bloomer records found.
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="td-modal">
          <div className="td-modal-body max-w-lg">
            <div className="td-modal-head bg-indigo-950/80 border-b border-indigo-500/30">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-300" />
                <h3 className="text-base font-bold text-white">
                  {activeTab === 'monitoring'
                    ? editingMonitoring
                      ? 'Edit Monitoring cum Remedial Entry'
                      : 'New Monitoring cum Remedial Entry'
                    : editingLateBloomer
                    ? 'Edit Late Bloomer Progress'
                    : 'New Late Bloomer Progress Entry'}
                </h3>
              </div>
              <button onClick={closeModal} className="text-purple-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-purple-300">Select Student</label>
                  <select
                    value={formStudentId}
                    onChange={e => setFormStudentId(e.target.value)}
                    className="w-full mt-1 p-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Roll #{s.rollNo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-purple-300">Class & Section</label>
                  <select
                    value={formClassId}
                    onChange={e => setFormClassId(e.target.value)}
                    className="w-full mt-1 p-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  >
                    <option value="cls-1a">Class I-A</option>
                    <option value="cls-2a">Class II-A</option>
                    <option value="cls-3a">Class III-A</option>
                    <option value="cls-4a">Class IV-A</option>
                    <option value="cls-5a">Class V-A</option>
                  </select>
                </div>
              </div>

              {activeTab === 'monitoring' ? (
                <>
                  <div>
                    <label className="text-[11px] font-semibold text-purple-300">
                      Targeted Learning Outcome (TLO) Not Achieved
                    </label>
                    <textarea
                      rows={2}
                      value={formTlo}
                      onChange={e => setFormTlo(e.target.value)}
                      placeholder="e.g. 2-digit subtraction with regrouping, reading simple CVC words..."
                      className="w-full mt-1 p-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-purple-300/40"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-purple-300">
                      Remedial TLM & Instructional Strategy
                    </label>
                    <textarea
                      rows={2}
                      value={formStrategies}
                      onChange={e => setFormStrategies(e.target.value)}
                      placeholder="e.g. Jadui Pitara picture cards, Ganit Mala, peer pairing..."
                      className="w-full mt-1 p-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-purple-300/40"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-purple-300">Current Progress Status</label>
                    <select
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value as any)}
                      className="w-full mt-1 p-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Developing">Developing (In Progress)</option>
                      <option value="Achieved">Achieved (Mastered)</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] font-semibold text-purple-300">Evaluation Month</label>
                    <select
                      value={formMonth}
                      onChange={e => setFormMonth(e.target.value)}
                      className="w-full mt-1 p-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                    >
                      <option value="April">April</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="October">October</option>
                      <option value="November">November</option>
                      <option value="December">December</option>
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-purple-300">Observational Notes</label>
                    <textarea
                      rows={2}
                      value={formObsNotes}
                      onChange={e => setFormObsNotes(e.target.value)}
                      placeholder="Describe qualitative changes in engagement, confidence, oral skills..."
                      className="w-full mt-1 p-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-purple-300/40"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-purple-300">Test Score & Diagnostic Growth</label>
                    <input
                      type="text"
                      value={formTestScore}
                      onChange={e => setFormTestScore(e.target.value)}
                      placeholder="e.g. Scored 15/20 in weekly check, up from 8/20"
                      className="w-full mt-1 p-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-purple-300/40"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="td-modal-foot justify-end gap-2 bg-indigo-950/60 border-t border-indigo-500/30 p-4">
              <button onClick={closeModal} className="td-btn-ghost text-xs">
                Cancel
              </button>
              <button
                onClick={activeTab === 'monitoring' ? handleSaveMonitoring : handleSaveLateBloomer}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
