import React, { useState, useEffect } from 'react';
import { ScholasticRecordClass1_2, StudentProfile, ClassSection } from '../types/academic';
import { db, DEFAULT_SCHOLASTIC_I_II, DEFAULT_STUDENTS, DEFAULT_CLASSES } from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  Award,
  Users,
  Search,
  Filter,
  Save,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Sliders,
  Printer,
  ChevronRight
} from 'lucide-react';

interface ScholasticAssessmentItoIIProps {
  devMode: boolean;
}

const COMPETENCY_FIELDS = [
  { key: 'listening_understanding', label: 'Listening with Comprehension', domain: 'Foundational Language' },
  { key: 'speaking_fluency', label: 'Speaking & Oral Expression', domain: 'Foundational Language' },
  { key: 'reading_readiness', label: 'Reading Readiness & Phonics', domain: 'Foundational Language' },
  { key: 'number_sense', label: 'Number Concept & Counting', domain: 'Foundational Numeracy' },
  { key: 'basic_operations', label: 'Basic Mathematical Operations', domain: 'Foundational Numeracy' },
  { key: 'shapes_spatial', label: 'Shapes & Spatial Understanding', domain: 'Cognitive Skills' },
  { key: 'creative_expression', label: 'Creative & Visual Expression', domain: 'Aesthetic Skills' },
  { key: 'social_behavior', label: 'Social & Emotional Habits', domain: 'Socio-Emotional' }
];

export default function ScholasticAssessmentItoII({ devMode }: ScholasticAssessmentItoIIProps) {
  const [records, setRecords] = useState<ScholasticRecordClass1_2[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('cls-1a');
  const [selectedCycle, setSelectedCycle] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSavedBanner, setIsSavedBanner] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const recs = (await db.get<ScholasticRecordClass1_2[]>('setup:scholastic_scores_i_ii')) || DEFAULT_SCHOLASTIC_I_II;
    const stds = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    setRecords(recs);
    setStudents(stds);
  };

  const classStudents = students.filter(s => {
    if (selectedClass === 'cls-1a') return s.className === 'I' || s.id.startsWith('std-1');
    if (selectedClass === 'cls-2a') return s.className === 'II' || s.id.startsWith('std-2');
    return true;
  });

  const getRecordForStudent = (studentId: string): ScholasticRecordClass1_2 => {
    const existing = records.find(r => r.studentId === studentId);
    if (existing) return existing;
    return {
      id: `sch12-${studentId}`,
      studentId,
      classSectionId: selectedClass,
      subjectId: 'sbj-p03',
      cycleRatings: {}
    };
  };

  const handleRatingChange = async (studentId: string, competencyKey: string, rating: 'A' | 'B' | 'C') => {
    const currentRec = getRecordForStudent(studentId);
    const updatedCycleRatings = {
      ...currentRec.cycleRatings,
      [selectedCycle]: {
        ...(currentRec.cycleRatings[selectedCycle] || {}),
        [competencyKey]: rating
      }
    };

    const updatedRecord: ScholasticRecordClass1_2 = {
      ...currentRec,
      cycleRatings: updatedCycleRatings
    };

    const existingIdx = records.findIndex(r => r.studentId === studentId);
    let updatedList: ScholasticRecordClass1_2[];
    if (existingIdx >= 0) {
      updatedList = [...records];
      updatedList[existingIdx] = updatedRecord;
    } else {
      updatedList = [...records, updatedRecord];
    }

    setRecords(updatedList);
    await db.set('setup:scholastic_scores_i_ii', updatedList);
    showSaved();
  };

  const showSaved = () => {
    setIsSavedBanner(true);
    setTimeout(() => setIsSavedBanner(false), 2000);
  };

  const filteredStudents = classStudents.filter(
    s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNo.toString().includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {devMode && (
        <DevModeBadge
          pages={21}
          title="Scholastic Assessment Record for Classes I & II (Module 21, Page 21 - 8 Continuous Cycles)"
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <span>Scholastic Assessment Record (Classes I & II)</span>
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Continuous 8-Cycle Qualitative Competency & Developmental Milestone Rubric (Grades A / B / C)
          </p>
        </div>

        {isSavedBanner && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            <span>Auto-Saved Changes</span>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/5 border border-white/10 p-4 rounded-xl">
        <div>
          <label className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Select Class</label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
          >
            <option value="cls-1a">Class I - Section A</option>
            <option value="cls-2a">Class II - Section A</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
            Continuous Assessment Cycle
          </label>
          <select
            value={selectedCycle}
            onChange={e => setSelectedCycle(Number(e.target.value))}
            className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-indigo-200 font-semibold"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(cycle => (
              <option key={cycle} value={cycle}>
                Cycle {cycle} (Continuous Assessment)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Search Student</label>
          <div className="relative mt-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-purple-300/50" />
            <input
              type="text"
              placeholder="Search by student name or roll..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-purple-300/40"
            />
          </div>
        </div>
      </div>

      {/* Grading Legend Guide */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs">
        <span className="font-semibold text-indigo-200">Scale:</span>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">A = Proficient</span>
        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">B = Developing</span>
        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">C = Needs Support</span>
      </div>

      {/* Assessment Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-indigo-950/60 text-purple-200 border-b border-white/10 text-[11px] uppercase tracking-wider">
              <th className="p-3 w-12 text-center font-bold">Roll</th>
              <th className="p-3 min-w-[160px] font-bold">Student Name</th>
              {COMPETENCY_FIELDS.map(comp => (
                <th key={comp.key} className="p-3 text-center min-w-[110px] font-bold">
                  <div className="text-[10px] text-indigo-300 font-mono lowercase">{comp.domain}</div>
                  <div className="text-white mt-0.5 text-xs">{comp.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-purple-100">
            {filteredStudents.map(student => {
              const rec = getRecordForStudent(student.id);
              const cycleData = rec.cycleRatings?.[selectedCycle] || {};

              return (
                <tr key={student.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 text-center font-mono font-bold text-purple-300">#{student.rollNo}</td>
                  <td className="p-3">
                    <div className="font-semibold text-white">{student.name}</div>
                    <div className="text-[10px] text-[var(--text-dim)] font-mono">{student.admissionNo}</div>
                  </td>

                  {COMPETENCY_FIELDS.map(comp => {
                    const currentVal = cycleData[comp.key] || '';
                    return (
                      <td key={comp.key} className="p-2 text-center">
                        <div className="inline-flex rounded-lg bg-black/40 border border-white/10 p-0.5">
                          {(['A', 'B', 'C'] as const).map(grade => (
                            <button
                              key={grade}
                              onClick={() => handleRatingChange(student.id, comp.key, grade)}
                              className={`px-2 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                                currentVal === grade
                                  ? grade === 'A'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : grade === 'B'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'bg-rose-600 text-white shadow-sm'
                                  : 'text-purple-300 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {grade}
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-10 text-purple-300/60 font-mono">
                  No students found in {selectedClass.toUpperCase()}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
