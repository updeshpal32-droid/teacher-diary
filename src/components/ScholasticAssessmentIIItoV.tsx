import React, { useState, useEffect } from 'react';
import { ScholasticRecordClass3_5, StudentProfile, PrimaryTerm, CbsePrimaryGrade } from '../types/academic';
import { db, DEFAULT_SCHOLASTIC_III_V, DEFAULT_STUDENTS } from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  Award,
  CheckCircle2,
  Search,
  Sliders,
  Sparkles,
  Calculator,
  Save,
  BookOpen,
  Printer
} from 'lucide-react';

interface ScholasticAssessmentIIItoVProps {
  devMode: boolean;
  term?: PrimaryTerm;
}

function calculateGrade(percentage: number): CbsePrimaryGrade {
  if (percentage >= 91) return 'A1';
  if (percentage >= 81) return 'A2';
  if (percentage >= 71) return 'B1';
  if (percentage >= 61) return 'B2';
  if (percentage >= 51) return 'C1';
  if (percentage >= 41) return 'C2';
  if (percentage >= 33) return 'D';
  return 'E';
}

export default function ScholasticAssessmentIIItoV({ devMode, term = 1 }: ScholasticAssessmentIIItoVProps) {
  const [activeTerm, setActiveTerm] = useState<PrimaryTerm>(term);
  const [records, setRecords] = useState<ScholasticRecordClass3_5[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('cls-3a');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    setActiveTerm(term);
  }, [term]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const recs = (await db.get<ScholasticRecordClass3_5[]>('setup:scholastic_scores_iii_v')) || DEFAULT_SCHOLASTIC_III_V;
    const stds = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    setRecords(recs);
    setStudents(stds);
  };

  const classStudents = students.filter(s => {
    if (selectedClass === 'cls-3a') return s.className === 'III' || s.id.startsWith('std-3');
    if (selectedClass === 'cls-4a') return s.className === 'IV' || s.id.startsWith('std-4');
    if (selectedClass === 'cls-5a') return s.className === 'V' || s.id.startsWith('std-5');
    return true;
  });

  const getRecordForStudent = (studentId: string): ScholasticRecordClass3_5 => {
    const existing = records.find(r => r.studentId === studentId && r.term === activeTerm);
    if (existing) return existing;
    return {
      id: `sch35-${studentId}-${activeTerm}`,
      studentId,
      classSectionId: selectedClass,
      subjectId: 'sbj-p02',
      term: activeTerm,
      periodicTest: 0,
      notebook: 0,
      sea: 0,
      mdp: 0,
      termEndExam: 0,
      total: 0,
      percentage: 0,
      grade: 'E'
    };
  };

  const handleScoreChange = async (
    studentId: string,
    field: keyof Pick<ScholasticRecordClass3_5, 'periodicTest' | 'notebook' | 'sea' | 'mdp' | 'termEndExam'>,
    val: number
  ) => {
    const currentRec = getRecordForStudent(studentId);
    let max = 10;
    if (field === 'notebook' || field === 'sea') max = 5;
    if (field === 'termEndExam') max = 30; // 30 marks exam + 10 PT + 5 NB + 5 SEA + 10 MDP = 60 total scaled to 100% or 40+10+5+5=60

    const clamped = Math.max(0, Math.min(max, val || 0));
    const updatedRec: ScholasticRecordClass3_5 = {
      ...currentRec,
      [field]: clamped
    };

    const maxMarksTotal = 60; // 10 (PT) + 5 (NB) + 5 (SEA) + 10 (MDP) + 30 (Exam)
    updatedRec.total =
      updatedRec.periodicTest + updatedRec.notebook + updatedRec.sea + updatedRec.mdp + updatedRec.termEndExam;
    updatedRec.percentage = Math.round((updatedRec.total / maxMarksTotal) * 100);
    updatedRec.grade = calculateGrade(updatedRec.percentage);

    const existingIdx = records.findIndex(r => r.studentId === studentId && r.term === activeTerm);
    let updatedList: ScholasticRecordClass3_5[];
    if (existingIdx >= 0) {
      updatedList = [...records];
      updatedList[existingIdx] = updatedRec;
    } else {
      updatedList = [...records, updatedRec];
    }

    setRecords(updatedList);
    await db.set('setup:scholastic_scores_iii_v', updatedList);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const filteredStudents = classStudents.filter(
    s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNo.toString().includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {devMode && (
        <DevModeBadge
          pages={activeTerm === 1 ? 25 : 26}
          title={`Scholastic Assessment Record for Classes III to V - Term ${activeTerm} (Module ${activeTerm === 1 ? 25 : 26})`}
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <span>
              Scholastic Assessment Record (Classes III to V) — Term {activeTerm}
            </span>
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Consolidated Term Breakdown: Periodic Test (10) + Notebook (5) + SEA (5) + MDP (10) + Session Exam (30)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSaved && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved</span>
            </div>
          )}

          <div className="bg-black/30 p-1 rounded-xl border border-white/10 flex gap-1">
            <button
              onClick={() => setActiveTerm(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTerm === 1
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              Term 1 (Page 25)
            </button>
            <button
              onClick={() => setActiveTerm(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTerm === 2
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              Term 2 (Page 26)
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/5 border border-white/10 p-4 rounded-xl">
        <div>
          <label className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Class</label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
          >
            <option value="cls-3a">Class III - Section A</option>
            <option value="cls-4a">Class IV - Section A</option>
            <option value="cls-5a">Class V - Section A</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Subject</label>
          <select className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white">
            <option>Mathematics (041)</option>
            <option>English Language</option>
            <option>Hindi (Rimjhim)</option>
            <option>Environmental Studies (EVS)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Search Student</label>
          <div className="relative mt-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-purple-300/50" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* Assessment Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-indigo-950/60 text-purple-200 border-b border-white/10 text-[11px] uppercase tracking-wider">
              <th className="p-3 w-12 text-center font-bold">Roll</th>
              <th className="p-3 min-w-[150px] font-bold">Student Name</th>
              <th className="p-3 text-center w-24 font-bold">PT (Max 10)</th>
              <th className="p-3 text-center w-24 font-bold">Notebook (Max 5)</th>
              <th className="p-3 text-center w-24 font-bold">SEA (Max 5)</th>
              <th className="p-3 text-center w-24 font-bold">MDP (Max 10)</th>
              <th className="p-3 text-center w-28 font-bold">SEE / Exam (Max 30)</th>
              <th className="p-3 text-center w-24 font-bold text-indigo-300 bg-indigo-950/80">Total (/60)</th>
              <th className="p-3 text-center w-24 font-bold text-indigo-200 bg-indigo-950/80">% Score</th>
              <th className="p-3 text-center w-20 font-bold text-amber-300 bg-indigo-950/80">CBSE Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-purple-100">
            {filteredStudents.map(student => {
              const rec = getRecordForStudent(student.id);

              return (
                <tr key={student.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 text-center font-mono font-bold text-purple-300">#{student.rollNo}</td>
                  <td className="p-3">
                    <div className="font-semibold text-white">{student.name}</div>
                    <div className="text-[10px] text-[var(--text-dim)] font-mono">{student.admissionNo}</div>
                  </td>

                  <td className="p-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={rec.periodicTest || ''}
                      onChange={e => handleScoreChange(student.id, 'periodicTest', parseFloat(e.target.value))}
                      className="w-14 text-center py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </td>

                  <td className="p-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={rec.notebook || ''}
                      onChange={e => handleScoreChange(student.id, 'notebook', parseFloat(e.target.value))}
                      className="w-14 text-center py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </td>

                  <td className="p-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={rec.sea || ''}
                      onChange={e => handleScoreChange(student.id, 'sea', parseFloat(e.target.value))}
                      className="w-14 text-center py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </td>

                  <td className="p-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={rec.mdp || ''}
                      onChange={e => handleScoreChange(student.id, 'mdp', parseFloat(e.target.value))}
                      className="w-14 text-center py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </td>

                  <td className="p-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={rec.termEndExam || ''}
                      onChange={e => handleScoreChange(student.id, 'termEndExam', parseFloat(e.target.value))}
                      className="w-16 text-center py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-white focus:border-indigo-400 focus:outline-none"
                    />
                  </td>

                  <td className="p-3 text-center bg-indigo-950/30 font-bold font-mono text-white">
                    {rec.total}
                  </td>

                  <td className="p-3 text-center bg-indigo-950/30 font-bold font-mono text-indigo-300">
                    {rec.percentage}%
                  </td>

                  <td className="p-3 text-center bg-indigo-950/30 font-bold font-mono">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        rec.grade === 'A1' || rec.grade === 'A2'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : rec.grade === 'B1' || rec.grade === 'B2'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : rec.grade === 'C1' || rec.grade === 'C2'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {rec.grade}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
