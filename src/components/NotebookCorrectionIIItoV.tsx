import React, { useState, useEffect } from 'react';
import {
  NotebookRecordClass3_5,
  StudentProfile,
  MonthlyNotebookScore,
  PrimaryTerm,
  ScholasticRecordClass3_5
} from '../types/academic';
import {
  db,
  DEFAULT_NOTEBOOK_III_V,
  DEFAULT_STUDENTS,
  DEFAULT_SCHOLASTIC_III_V
} from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  BookOpen,
  CheckCircle2,
  Search,
  Upload,
  Printer,
  Sparkles,
  Sliders,
  Award,
  ChevronRight,
  Info,
  Layers,
  ArrowRightLeft,
  Check,
  Zap,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

interface NotebookCorrectionIIItoVProps {
  devMode: boolean;
}

const TERM_1_MONTHS = ['April', 'July', 'August', 'September'] as const;
const TERM_2_MONTHS = ['October', 'November', 'January', 'February'] as const;

export default function NotebookCorrectionIIItoV({ devMode }: NotebookCorrectionIIItoVProps) {
  // State
  const [records, setRecords] = useState<NotebookRecordClass3_5[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<PrimaryTerm>(1);
  const [selectedClass, setSelectedClass] = useState<string>('cls-3a');
  const [selectedSubject, setSelectedSubject] = useState<string>('sbj-p02');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'spread' | 'single_month'>('spread');
  const [focusedMonth, setFocusedMonth] = useState<string>('April');
  const [isSavedBanner, setIsSavedBanner] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string>('Changes Saved');
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [batchScores, setBatchScores] = useState<{ regularity: number; index: number; neatness: number; completion: number }>({
    regularity: 5,
    index: 5,
    neatness: 5,
    completion: 5
  });

  const currentMonths = selectedTerm === 1 ? TERM_1_MONTHS : TERM_2_MONTHS;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // When term changes, reset focused month to the first month of that term
    setFocusedMonth(selectedTerm === 1 ? 'April' : 'October');
  }, [selectedTerm]);

  const loadData = async () => {
    const recs = (await db.get<NotebookRecordClass3_5[]>('setup:notebook_scores_iii_v')) || DEFAULT_NOTEBOOK_III_V;
    const stds = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    setRecords(recs);
    setStudents(stds);
  };

  const showNotification = (msg: string) => {
    setSavedMessage(msg);
    setIsSavedBanner(true);
    setTimeout(() => setIsSavedBanner(false), 2500);
  };

  // Helper to normalize student name & roll number across different profile shapes
  const getStudentDisplayName = (studentId: string, fallbackName?: string): string => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      return (student as any).studentName || (student as any).name || 'Student';
    }
    return fallbackName || 'Student';
  };

  const getStudentRollOrSN = (studentId: string, idx: number): string | number => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      return (student as any).rollNo || (student as any).sn || idx + 1;
    }
    return idx + 1;
  };

  const getStudentAdmissionNo = (studentId: string): string => {
    const student = students.find(s => s.id === studentId);
    return (student as any)?.admissionNo || studentId.replace('std-', 'KVS-');
  };

  const getClassLabel = () => {
    if (selectedClass === 'cls-3a') return 'Class III - Section A';
    if (selectedClass === 'cls-3b') return 'Class III - Section B';
    if (selectedClass === 'cls-4a') return 'Class IV - Section A';
    if (selectedClass === 'cls-4b') return 'Class IV - Section B';
    if (selectedClass === 'cls-5a') return 'Class V - Section A';
    if (selectedClass === 'cls-5b') return 'Class V - Section B';
    return 'Classes III to V';
  };

  const getSubjectLabel = () => {
    if (selectedSubject === 'sbj-p03') return 'English';
    if (selectedSubject === 'sbj-p04') return 'Hindi';
    if (selectedSubject === 'sbj-p02') return 'Mathematics';
    if (selectedSubject === 'sbj-p01') return 'Environmental Studies (EVS)';
    return 'Subject';
  };

  // Filter students based on class selection
  const classStudents = students.filter(s => {
    const className = (s.className || '').toUpperCase();
    if (selectedClass.includes('3')) return className === 'III' || className === '3' || s.id.startsWith('std-3');
    if (selectedClass.includes('4')) return className === 'IV' || className === '4' || s.id.startsWith('std-4');
    if (selectedClass.includes('5')) return className === 'V' || className === '5' || s.id.startsWith('std-5');
    return className === 'III' || className === 'IV' || className === 'V' || s.id.startsWith('std-3') || s.id.startsWith('std-4') || s.id.startsWith('std-5');
  }).filter(s => {
    const name = ((s as any).studentName || (s as any).name || '').toLowerCase();
    const roll = String((s as any).rollNo || (s as any).sn || '');
    return name.includes(searchQuery.toLowerCase()) || roll.includes(searchQuery);
  });

  const getRecordForStudent = (studentId: string): NotebookRecordClass3_5 => {
    const existing = records.find(
      r => r.studentId === studentId && r.term === selectedTerm && r.subjectId === selectedSubject
    );
    if (existing) return existing;
    return {
      id: `nb-${studentId}-${selectedTerm}-${selectedSubject}`,
      studentId,
      classSectionId: selectedClass,
      subjectId: selectedSubject,
      term: selectedTerm,
      monthlyScores: {}
    };
  };

  const handleScoreChange = async (
    studentId: string,
    month: string,
    field: keyof Omit<MonthlyNotebookScore, 'total'>,
    val: number | string
  ) => {
    const numVal = val === '' ? 0 : Number(val);
    const clamped = Math.max(0, Math.min(5, isNaN(numVal) ? 0 : numVal));
    const currentRec = getRecordForStudent(studentId);
    const existingMonthScore = currentRec.monthlyScores?.[month] || {
      regularity: 0,
      index: 0,
      neatness: 0,
      completion: 0,
      total: 0
    };

    const updatedMonthScore: MonthlyNotebookScore = {
      ...existingMonthScore,
      [field]: clamped
    };
    updatedMonthScore.total =
      (updatedMonthScore.regularity || 0) +
      (updatedMonthScore.index || 0) +
      (updatedMonthScore.neatness || 0) +
      (updatedMonthScore.completion || 0);

    const updatedRecord: NotebookRecordClass3_5 = {
      ...currentRec,
      monthlyScores: {
        ...(currentRec.monthlyScores || {}),
        [month]: updatedMonthScore
      }
    };

    const existingIdx = records.findIndex(
      r => r.studentId === studentId && r.term === selectedTerm && r.subjectId === selectedSubject
    );
    let updatedList: NotebookRecordClass3_5[];
    if (existingIdx >= 0) {
      updatedList = [...records];
      updatedList[existingIdx] = updatedRecord;
    } else {
      updatedList = [...records, updatedRecord];
    }

    setRecords(updatedList);
    await db.set('setup:notebook_scores_iii_v', updatedList);
    showNotification('Score Auto-Saved');
  };

  const handleImportStudentsFromProfile = async () => {
    const matchingStudents = students.filter(s => {
      const className = (s.className || '').toUpperCase();
      if (selectedClass.includes('3')) return className === 'III' || className === '3' || s.id.startsWith('std-3');
      if (selectedClass.includes('4')) return className === 'IV' || className === '4' || s.id.startsWith('std-4');
      if (selectedClass.includes('5')) return className === 'V' || className === '5' || s.id.startsWith('std-5');
      return true;
    });

    let newRecords = [...records];
    let createdCount = 0;

    matchingStudents.forEach((st, idx) => {
      const exists = newRecords.find(
        r => r.studentId === st.id && r.term === selectedTerm && r.subjectId === selectedSubject
      );
      if (!exists) {
        const defaultMonthlyScores: { [month: string]: MonthlyNotebookScore } = {};
        currentMonths.forEach((m, mIdx) => {
          const reg = 4 + (idx % 2);
          const ind = 4 + ((idx + mIdx) % 2);
          const ntn = 4 + (idx % 2);
          const cmp = 4 + ((idx + 1) % 2);
          defaultMonthlyScores[m] = {
            regularity: Math.min(5, reg),
            index: Math.min(5, ind),
            neatness: Math.min(5, ntn),
            completion: Math.min(5, cmp),
            total: Math.min(20, reg + ind + ntn + cmp)
          };
        });

        newRecords.push({
          id: `nb-${st.id}-${selectedTerm}-${selectedSubject}`,
          studentId: st.id,
          classSectionId: selectedClass,
          subjectId: selectedSubject,
          term: selectedTerm,
          monthlyScores: defaultMonthlyScores
        });
        createdCount++;
      }
    });

    setRecords(newRecords);
    await db.set('setup:notebook_scores_iii_v', newRecords);
    showNotification(`Synced ${matchingStudents.length} Students from Profile Roster (${createdCount} newly initialized)`);
  };

  const handleApplyBatchFill = async () => {
    const reg = Math.max(0, Math.min(5, batchScores.regularity));
    const ind = Math.max(0, Math.min(5, batchScores.index));
    const ntn = Math.max(0, Math.min(5, batchScores.neatness));
    const cmp = Math.max(0, Math.min(5, batchScores.completion));
    const tot = reg + ind + ntn + cmp;

    let updatedList = [...records];
    let count = 0;

    classStudents.forEach(st => {
      const currentRec = getRecordForStudent(st.id);
      const updatedMonths = { ...(currentRec.monthlyScores || {}) };

      currentMonths.forEach(m => {
        updatedMonths[m] = {
          regularity: reg,
          index: ind,
          neatness: ntn,
          completion: cmp,
          total: tot
        };
      });

      const updatedRecord: NotebookRecordClass3_5 = {
        ...currentRec,
        monthlyScores: updatedMonths
      };

      const idx = updatedList.findIndex(
        r => r.studentId === st.id && r.term === selectedTerm && r.subjectId === selectedSubject
      );
      if (idx >= 0) {
        updatedList[idx] = updatedRecord;
      } else {
        updatedList.push(updatedRecord);
      }
      count++;
    });

    setRecords(updatedList);
    await db.set('setup:notebook_scores_iii_v', updatedList);
    setShowBatchModal(false);
    showNotification(`Batch template applied to ${count} students across all ${currentMonths.length} months`);
  };

  // Push Scaled Scores directly to Module 26 Scholastic Assessment Ledger
  const handlePushToScholasticLedger = async () => {
    const scholasticRecs = (await db.get<ScholasticRecordClass3_5[]>('setup:scholastic_scores_iii_v')) || DEFAULT_SCHOLASTIC_III_V;
    let updatedScholastic = [...scholasticRecs];
    let syncedCount = 0;

    classStudents.forEach(st => {
      const nbRec = getRecordForStudent(st.id);
      const months = currentMonths;
      let monthScoresSum = 0;
      let monthsCount = 0;

      months.forEach(m => {
        const mScore = nbRec.monthlyScores?.[m]?.total;
        if (mScore !== undefined && mScore > 0) {
          monthScoresSum += mScore;
          monthsCount++;
        }
      });

      const rawAvg = monthsCount > 0 ? Number((monthScoresSum / monthsCount).toFixed(1)) : 0;
      const scaled5 = Number((rawAvg / 4).toFixed(1)); // 20 scaled to 5

      const existingScholasticIdx = updatedScholastic.findIndex(
        s => s.studentId === st.id && s.term === selectedTerm && s.subjectId === selectedSubject
      );

      if (existingScholasticIdx >= 0) {
        const existing = updatedScholastic[existingScholasticIdx];
        const updatedTotal = Number(
          ((existing.ptScaled10 || 0) + (existing.mdp20 || 0) + scaled5 + (existing.seaScaled5 || 0) + (existing.seeTotal60 || 0)).toFixed(1)
        );
        const updatedPct = Math.round(updatedTotal);
        
        updatedScholastic[existingScholasticIdx] = {
          ...existing,
          notebookRaw20: rawAvg,
          notebookScaled5: scaled5,
          notebook: scaled5,
          grandTotal100: updatedTotal,
          total: updatedTotal,
          percentage: updatedPct
        };
        syncedCount++;
      }
    });

    await db.set('setup:scholastic_scores_iii_v', updatedScholastic);
    showNotification(`Successfully pushed notebook scores (scaled to 5 marks) for ${syncedCount} students to Module 26 Ledger!`);
  };

  // Helper to compute student term average & scaled score
  const calculateStudentTermStats = (studentId: string) => {
    const rec = getRecordForStudent(studentId);
    const months = currentMonths;
    let sum = 0;
    let count = 0;

    months.forEach(m => {
      const score = rec.monthlyScores?.[m]?.total;
      if (score !== undefined && score > 0) {
        sum += score;
        count++;
      }
    });

    const average20 = count > 0 ? Number((sum / count).toFixed(1)) : 0;
    const scaled5 = Number((average20 / 4).toFixed(1)); // Out of 5
    return { average20, scaled5, recordedMonths: count };
  };

  // Aggregate class statistics
  const totalStudentsInRoster = classStudents.length;
  const evaluatedStudentsCount = classStudents.filter(s => {
    const stats = calculateStudentTermStats(s.id);
    return stats.average20 > 0;
  }).length;

  const classOverallAverage20 = evaluatedStudentsCount > 0
    ? (
        classStudents.reduce((acc, s) => acc + calculateStudentTermStats(s.id).average20, 0) /
        evaluatedStudentsCount
      ).toFixed(1)
    : '0.0';

  const classOverallScaled5 = Number(((Number(classOverallAverage20) / 4) || 0).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Dev Mode Official Page Banner */}
      {devMode && (
        <DevModeBadge
          pages={selectedTerm === 1 ? 15 : 16}
          title={
            selectedTerm === 1
              ? '22 (a). नोट बुक मूल्यांकन अभिलेख (कक्षा- 3 से 5) (Page 15 - Term 1 Months: April, July, August, September - Max 20 Marks)'
              : '22 (b). नोट बुक मूल्यांकन अभिलेख (कक्षा- 3 से 5) (Page 16 - Term 2 Months: October, November, January, February - Max 20 Marks)'
          }
        />
      )}

      {/* Official Header Card Matching PDF */}
      <div className="bg-gradient-to-br from-indigo-950/30 via-stone-900/40 to-slate-900/60 border border-indigo-500/30 p-6 rounded-2xl space-y-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-indigo-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Official KVS Ledger
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                8 pages (Pages 15 & 16)
              </span>
              {isSavedBanner && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold animate-pulse">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{savedMessage}</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400 shrink-0" />
              <span>
                {selectedTerm === 1 ? '22 (a)' : '22 (b)'}. नोट बुक मूल्यांकन अभिलेख (कक्षा- 3 से 5)
              </span>
            </h1>
            <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wide">
              RECORD OF NOTEBOOK CORRECTION FOR CLASSES- III to V
            </h2>
          </div>

          {/* Term Toggle Pills */}
          <div className="bg-black/50 p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setSelectedTerm(1)}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedTerm === 1
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-indigo-200" />
              <span>22 (a). Term- 1 (P-15)</span>
            </button>

            <button
              onClick={() => setSelectedTerm(2)}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedTerm === 2
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-pink-200" />
              <span>22 (b). Term 2 (P-16)</span>
            </button>
          </div>
        </div>

        {/* Official Header Details Strip (Subject, Term, Class/Section) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
          <div>
            <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
              Subject: <span className="text-white font-mono">{getSubjectLabel()}</span>
            </label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="sbj-p02">Mathematics (Primary)</option>
              <option value="sbj-p03">English (Primary)</option>
              <option value="sbj-p04">Hindi (Primary)</option>
              <option value="sbj-p01">Environmental Studies (EVS)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
              Class / Section: <span className="text-white font-mono">{getClassLabel()}</span>
            </label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="cls-3a">Class III - Section A</option>
              <option value="cls-3b">Class III - Section B</option>
              <option value="cls-4a">Class IV - Section A</option>
              <option value="cls-4b">Class IV - Section B</option>
              <option value="cls-5a">Class V - Section A</option>
              <option value="cls-5b">Class V - Section B</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
              Term Months: <span className="text-amber-300 font-bold">{currentMonths.join(', ')}</span>
            </label>
            <div className="mt-1 py-2 px-3 bg-black/30 border border-white/10 rounded-xl text-xs text-indigo-200 font-mono flex items-center justify-between">
              <span>{selectedTerm === 1 ? 'Term- 1 (4 Months)' : 'Term 2 (4 Months)'}</span>
              <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 rounded-md font-bold text-indigo-300">
                Max 20/mo
              </span>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Search Student</label>
            <div className="relative mt-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name or roll no..."
                className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Action Controls & Quick Sync Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-indigo-500/10">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleImportStudentsFromProfile}
              className="px-3.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Pull student profiles matching selected class"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-300" />
              <span>Import / Sync from Profiles</span>
            </button>

            <button
              onClick={() => setShowBatchModal(true)}
              className="px-3.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Apply standard score template in bulk"
            >
              <Zap className="w-3.5 h-3.5 text-purple-300" />
              <span>Batch Quick Fill</span>
            </button>

            <button
              onClick={handlePushToScholasticLedger}
              className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Scale to 5 marks and push directly into Module 26 Scholastic Record"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-300" />
              <span>Push Scaled Scores to Module 26 (/5)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="bg-black/40 p-1 rounded-xl border border-white/10 flex items-center gap-1">
              <button
                onClick={() => setViewMode('spread')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'spread'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Full 4-Month Ledger Spread
              </button>
              <button
                onClick={() => setViewMode('single_month')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'single_month'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Focused Month Entry
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-gray-300" />
              <span>Print Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics & Class Performance Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-gray-400">Total Enrolled</div>
          <div className="text-xl font-black text-white mt-0.5">{totalStudentsInRoster}</div>
          <div className="text-[10px] text-indigo-300 mt-0.5">Students in {getClassLabel()}</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-gray-400">Evaluated</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5">{evaluatedStudentsCount} / {totalStudentsInRoster}</div>
          <div className="text-[10px] text-emerald-300/80 mt-0.5">
            {totalStudentsInRoster > 0 ? Math.round((evaluatedStudentsCount / totalStudentsInRoster) * 100) : 0}% graded
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-gray-400">Class Average (/20)</div>
          <div className="text-xl font-black text-amber-300 mt-0.5">{classOverallAverage20} <span className="text-xs text-gray-400 font-normal">/ 20</span></div>
          <div className="text-[10px] text-amber-200/80 mt-0.5">Continuous Evaluation Mean</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-gray-400">Scaled Mean (/5)</div>
          <div className="text-xl font-black text-indigo-300 mt-0.5">{classOverallScaled5} <span className="text-xs text-gray-400 font-normal">/ 5.0</span></div>
          <div className="text-[10px] text-indigo-200/80 mt-0.5">Scholastic Weightage (Module 26)</div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: FULL 4-MONTH SPREAD (EXACT REPLICA OF PDF PAGES 15 & 16)      */}
      {/* ==================================================================== */}
      {viewMode === 'spread' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
            <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
              <thead>
                {/* Row 1: MONTH Header Groupings */}
                <tr className="bg-indigo-950/80 text-indigo-200 border-b border-indigo-500/30 text-center font-bold">
                  <th className="py-2.5 px-3 border-r border-indigo-500/30 w-12 text-center" rowSpan={2}>
                    {selectedTerm === 1 ? 'S.N' : 'S.NO'}
                  </th>
                  <th className="py-2.5 px-4 border-r border-indigo-500/30 text-left min-w-[180px]" rowSpan={2}>
                    NAME OF STUDENT
                  </th>

                  {currentMonths.map(m => (
                    <th
                      key={m}
                      colSpan={5}
                      className="py-2 px-2 border-r border-indigo-500/30 bg-indigo-900/40 text-indigo-100 font-extrabold uppercase tracking-wider text-xs"
                    >
                      MONTH: {m}
                    </th>
                  ))}

                  <th colSpan={2} className="py-2 px-3 bg-purple-950/60 text-purple-200 font-extrabold uppercase tracking-wider text-xs">
                    TERM {selectedTerm} SUMMARY
                  </th>
                </tr>

                {/* Row 2: Sub-columns for Regularity, Index, Neatness, Completion, Total */}
                <tr className="bg-black/60 text-gray-300 border-b border-white/10 text-center text-[10px] font-semibold">
                  {currentMonths.map((m, mIdx) => (
                    <React.Fragment key={m}>
                      <th className="py-2 px-1 border-r border-white/10 w-12 text-amber-300" title="REGULARITY (Max 5)">
                        REG<br />5
                      </th>
                      <th className="py-2 px-1 border-r border-white/10 w-12 text-amber-300" title="INDEX (Max 5)">
                        IND<br />5
                      </th>
                      <th className="py-2 px-1 border-r border-white/10 w-12 text-amber-300" title="NEATNESS (Max 5)">
                        NEAT<br />5
                      </th>
                      <th className="py-2 px-1 border-r border-white/10 w-12 text-amber-300" title="COMPLETION (Max 5)">
                        COMP<br />5
                      </th>
                      <th
                        className={`py-2 px-1 border-r ${
                          mIdx === currentMonths.length - 1 ? 'border-r-2 border-indigo-500/40' : 'border-white/10'
                        } w-14 font-black text-indigo-300 bg-indigo-500/10`}
                        title="TOTAL (Max 20)"
                      >
                        TOTAL<br />20
                      </th>
                    </React.Fragment>
                  ))}

                  <th className="py-2 px-2 border-r border-white/10 w-16 text-purple-300 font-black bg-purple-500/10">
                    AVG<br />/20
                  </th>
                  <th className="py-2 px-2 w-16 text-emerald-300 font-black bg-emerald-500/10" title="Scaled for Module 26 Scholastic Record">
                    SCALED<br />/5
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 font-mono">
                {classStudents.map((student, idx) => {
                  const rec = getRecordForStudent(student.id);
                  const displayName = getStudentDisplayName(student.id, (student as any).name);
                  const rollOrSN = getStudentRollOrSN(student.id, idx);
                  const admNo = getStudentAdmissionNo(student.id);
                  const { average20, scaled5 } = calculateStudentTermStats(student.id);

                  return (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                      {/* S.N */}
                      <td className="py-2 px-2 border-r border-white/10 text-center font-bold text-gray-400">
                        {rollOrSN}
                      </td>

                      {/* NAME OF STUDENT */}
                      <td className="py-2 px-4 border-r border-white/10 font-sans text-gray-200 font-medium">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{displayName}</span>
                          <span className="text-[10px] text-gray-500 font-mono ml-2">Adm: {admNo}</span>
                        </div>
                      </td>

                      {/* 4 Months Data Columns */}
                      {currentMonths.map((m, mIdx) => {
                        const mScore = rec.monthlyScores?.[m] || {
                          regularity: 0,
                          index: 0,
                          neatness: 0,
                          completion: 0,
                          total: 0
                        };

                        return (
                          <React.Fragment key={m}>
                            {/* Regularity (5) */}
                            <td className="py-1 px-1 border-r border-white/10 text-center">
                              <input
                                type="number"
                                min={0}
                                max={5}
                                value={mScore.regularity || ''}
                                onChange={e => handleScoreChange(student.id, m, 'regularity', e.target.value)}
                                className="w-10 text-center py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-amber-200 focus:border-indigo-400 focus:outline-none"
                              />
                            </td>

                            {/* Index (5) */}
                            <td className="py-1 px-1 border-r border-white/10 text-center">
                              <input
                                type="number"
                                min={0}
                                max={5}
                                value={mScore.index || ''}
                                onChange={e => handleScoreChange(student.id, m, 'index', e.target.value)}
                                className="w-10 text-center py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-amber-200 focus:border-indigo-400 focus:outline-none"
                              />
                            </td>

                            {/* Neatness (5) */}
                            <td className="py-1 px-1 border-r border-white/10 text-center">
                              <input
                                type="number"
                                min={0}
                                max={5}
                                value={mScore.neatness || ''}
                                onChange={e => handleScoreChange(student.id, m, 'neatness', e.target.value)}
                                className="w-10 text-center py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-amber-200 focus:border-indigo-400 focus:outline-none"
                              />
                            </td>

                            {/* Completion (5) */}
                            <td className="py-1 px-1 border-r border-white/10 text-center">
                              <input
                                type="number"
                                min={0}
                                max={5}
                                value={mScore.completion || ''}
                                onChange={e => handleScoreChange(student.id, m, 'completion', e.target.value)}
                                className="w-10 text-center py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-amber-200 focus:border-indigo-400 focus:outline-none"
                              />
                            </td>

                            {/* Total (20) */}
                            <td
                              className={`py-1 px-1 border-r ${
                                mIdx === currentMonths.length - 1 ? 'border-r-2 border-indigo-500/40' : 'border-white/10'
                              } text-center font-black ${
                                mScore.total >= 18
                                  ? 'bg-emerald-500/10 text-emerald-300'
                                  : mScore.total >= 14
                                  ? 'bg-blue-500/10 text-blue-300'
                                  : mScore.total > 0
                                  ? 'bg-amber-500/10 text-amber-300'
                                  : 'text-gray-500'
                              }`}
                            >
                              {mScore.total || 0}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      {/* Term Average (/20) */}
                      <td className="py-2 px-2 border-r border-white/10 text-center font-bold text-purple-300 bg-purple-500/5">
                        {average20}
                      </td>

                      {/* Scaled (/5) */}
                      <td className="py-2 px-2 text-center font-black text-emerald-300 bg-emerald-500/5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30">
                          {scaled5}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {classStudents.length === 0 && (
                  <tr>
                    <td colSpan={24} className="py-12 text-center text-gray-400 font-sans">
                      <BookOpen className="w-8 h-8 text-indigo-400/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No students in current filter</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Click "Import / Sync from Profiles" to automatically populate the roster.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: FOCUSED SINGLE MONTH ENTRY                                    */}
      {/* ==================================================================== */}
      {viewMode === 'single_month' && (
        <div className="space-y-4">
          {/* Month Select Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-black/40 p-2.5 rounded-2xl border border-white/10">
            <span className="text-xs font-bold text-indigo-300 px-3 uppercase tracking-wide">Select Month:</span>
            {currentMonths.map(m => (
              <button
                key={m}
                onClick={() => setFocusedMonth(m)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  focusedMonth === m
                    ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-500/25'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Focused Month Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-indigo-950/80 text-indigo-200 border-b border-white/10 text-[11px] uppercase tracking-wider">
                  <th className="p-3 w-14 text-center font-bold">S.No / Roll</th>
                  <th className="p-3 min-w-[180px] font-bold">Student Name</th>
                  <th className="p-3 text-center w-32 font-bold text-amber-300">
                    <div>Regularity</div>
                    <div className="text-[10px] text-gray-400 lowercase font-normal">(Max 5)</div>
                  </th>
                  <th className="p-3 text-center w-32 font-bold text-amber-300">
                    <div>Index Maintenance</div>
                    <div className="text-[10px] text-gray-400 lowercase font-normal">(Max 5)</div>
                  </th>
                  <th className="p-3 text-center w-32 font-bold text-amber-300">
                    <div>Neatness & Handwriting</div>
                    <div className="text-[10px] text-gray-400 lowercase font-normal">(Max 5)</div>
                  </th>
                  <th className="p-3 text-center w-32 font-bold text-amber-300">
                    <div>Completion & Corrections</div>
                    <div className="text-[10px] text-gray-400 lowercase font-normal">(Max 5)</div>
                  </th>
                  <th className="p-3 text-center w-32 font-bold text-indigo-300 bg-indigo-950/90">
                    <div>Month Total</div>
                    <div className="text-[10px] text-indigo-300 font-normal">(/20)</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {classStudents.map((student, idx) => {
                  const rec = getRecordForStudent(student.id);
                  const displayName = getStudentDisplayName(student.id, (student as any).name);
                  const rollOrSN = getStudentRollOrSN(student.id, idx);
                  const admNo = getStudentAdmissionNo(student.id);
                  const monthData = rec.monthlyScores?.[focusedMonth] || {
                    regularity: 0,
                    index: 0,
                    neatness: 0,
                    completion: 0,
                    total: 0
                  };

                  return (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 text-center font-bold text-gray-400">{rollOrSN}</td>
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white">{displayName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">Adm: {admNo}</div>
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={5}
                          value={monthData.regularity || ''}
                          onChange={e => handleScoreChange(student.id, focusedMonth, 'regularity', e.target.value)}
                          className="w-16 text-center py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-indigo-400 focus:outline-none"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={5}
                          value={monthData.index || ''}
                          onChange={e => handleScoreChange(student.id, focusedMonth, 'index', e.target.value)}
                          className="w-16 text-center py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-indigo-400 focus:outline-none"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={5}
                          value={monthData.neatness || ''}
                          onChange={e => handleScoreChange(student.id, focusedMonth, 'neatness', e.target.value)}
                          className="w-16 text-center py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-indigo-400 focus:outline-none"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={5}
                          value={monthData.completion || ''}
                          onChange={e => handleScoreChange(student.id, focusedMonth, 'completion', e.target.value)}
                          className="w-16 text-center py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-indigo-400 focus:outline-none"
                        />
                      </td>

                      <td className="p-3 text-center bg-indigo-950/30 font-bold font-mono">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            monthData.total >= 18
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : monthData.total >= 14
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : monthData.total > 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-black/30 text-gray-400 border border-white/10'
                          }`}
                        >
                          {monthData.total} / 20
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official 4-Parameter Assessment Rubric Reference Card */}
      <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>KVS Official Notebook Evaluation Parameters (Pages 15 & 16 of Diary):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
            <div className="font-bold text-amber-300 flex items-center justify-between">
              <span>1. REGULARITY</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 rounded">5 Marks</span>
            </div>
            <p className="text-[11px] text-gray-300">
              Timely notebook submission on designated days, adherence to homework timelines, and daily upkeep.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
            <div className="font-bold text-amber-300 flex items-center justify-between">
              <span>2. INDEX</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 rounded">5 Marks</span>
            </div>
            <p className="text-[11px] text-gray-300">
              Serial numbering, dates, chapter titles, page numbers, and teacher signature columns kept up-to-date.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
            <div className="font-bold text-amber-300 flex items-center justify-between">
              <span>3. NEATNESS</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 rounded">5 Marks</span>
            </div>
            <p className="text-[11px] text-gray-300">
              Legible handwriting, clean cover with label, properly drawn margins, diagrams, and absence of scribbling.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
            <div className="font-bold text-amber-300 flex items-center justify-between">
              <span>4. COMPLETION</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 rounded">5 Marks</span>
            </div>
            <p className="text-[11px] text-gray-300">
              All classwork notes, assignments, and corrections completed following teacher feedback and remedial guidance.
            </p>
          </div>
        </div>
      </div>

      {/* Batch Quick Fill Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <span>Batch Quick Fill Notebook Scores</span>
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-white/5 rounded-lg"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Apply default uniform scores across all {classStudents.length} students for all {currentMonths.length} months of Term {selectedTerm}.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Regularity (Max 5)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={batchScores.regularity}
                  onChange={e => setBatchScores({ ...batchScores, regularity: Number(e.target.value) })}
                  className="w-full mt-1 py-1.5 px-3 bg-black/50 border border-white/10 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Index (Max 5)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={batchScores.index}
                  onChange={e => setBatchScores({ ...batchScores, index: Number(e.target.value) })}
                  className="w-full mt-1 py-1.5 px-3 bg-black/50 border border-white/10 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Neatness (Max 5)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={batchScores.neatness}
                  onChange={e => setBatchScores({ ...batchScores, neatness: Number(e.target.value) })}
                  className="w-full mt-1 py-1.5 px-3 bg-black/50 border border-white/10 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Completion (Max 5)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={batchScores.completion}
                  onChange={e => setBatchScores({ ...batchScores, completion: Number(e.target.value) })}
                  className="w-full mt-1 py-1.5 px-3 bg-black/50 border border-white/10 rounded-xl text-white font-bold"
                />
              </div>
            </div>

            <div className="bg-indigo-950/40 p-3 rounded-xl border border-indigo-500/20 text-xs text-indigo-200 flex items-center justify-between font-bold">
              <span>Total Month Score:</span>
              <span className="text-sm text-indigo-300">
                {batchScores.regularity + batchScores.index + batchScores.neatness + batchScores.completion} / 20
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBatchFill}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/30"
              >
                Apply to All Students
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
