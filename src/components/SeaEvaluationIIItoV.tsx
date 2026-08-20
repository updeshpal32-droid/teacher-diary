import React, { useState, useEffect } from 'react';
import {
  SeaPlanItem,
  SeaRecordClass3_5,
  SeaMonthlyRubricScore,
  StudentProfile,
  PrimaryTerm,
  ScholasticRecordClass3_5
} from '../types/academic';
import {
  db,
  DEFAULT_SEA_PLANS_III_V,
  DEFAULT_SEA_III_V,
  DEFAULT_STUDENTS,
  DEFAULT_SCHOLASTIC_III_V
} from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  Sparkles,
  Award,
  Search,
  CheckCircle2,
  Sliders,
  Save,
  BookOpen,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Upload,
  Zap,
  ArrowRightLeft,
  Info,
  Check,
  FileSpreadsheet,
  TrendingUp,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

interface SeaEvaluationIIItoVProps {
  devMode: boolean;
}

const TERM_1_MONTHS = ['April', 'July', 'August', 'September'] as const;
const TERM_2_MONTHS = ['October', 'November', 'January', 'February'] as const;

export default function SeaEvaluationIIItoV({ devMode }: SeaEvaluationIIItoVProps) {
  // Main Module Tab: 'planning' (23a, P-17) | 'recording_t1' (23b, P-18) | 'recording_t2' (23c, P-19)
  const [activeSection, setActiveSection] = useState<'planning' | 'recording_t1' | 'recording_t2'>('planning');

  // Common Selection Filters
  const [selectedClass, setSelectedClass] = useState<string>('cls-3a');
  const [selectedSubject, setSelectedSubject] = useState<string>('sbj-p03');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data States
  const [plans, setPlans] = useState<SeaPlanItem[]>([]);
  const [records, setRecords] = useState<SeaRecordClass3_5[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  
  // Recording UI States
  const [recordingViewMode, setRecordingViewMode] = useState<'spread' | 'single_month'>('spread');
  const [focusedMonth, setFocusedMonth] = useState<string>('April');
  const [isSavedBanner, setIsSavedBanner] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string>('Changes Saved');

  // Plan Edit / Create Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<Partial<SeaPlanItem> | null>(null);

  // Batch Fill Modal State
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [batchRubrics, setBatchRubrics] = useState<{ r1: number; r2: number; r3: number; r4: number }>({
    r1: 5,
    r2: 5,
    r3: 5,
    r4: 5
  });

  const activeRecordingTerm: PrimaryTerm = activeSection === 'recording_t2' ? 2 : 1;
  const currentMonths = activeRecordingTerm === 1 ? TERM_1_MONTHS : TERM_2_MONTHS;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Reset focused month when recording section switches
    if (activeSection === 'recording_t1') {
      setFocusedMonth('April');
    } else if (activeSection === 'recording_t2') {
      setFocusedMonth('October');
    }
  }, [activeSection]);

  const loadData = async () => {
    const savedPlans = (await db.get<SeaPlanItem[]>('setup:sea_plans_iii_v')) || DEFAULT_SEA_PLANS_III_V;
    const savedRecs = (await db.get<SeaRecordClass3_5[]>('setup:sea_scores_iii_v')) || DEFAULT_SEA_III_V;
    const stds = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;

    setPlans(savedPlans);
    setRecords(savedRecs);
    setStudents(stds);
  };

  const showNotification = (msg: string) => {
    setSavedMessage(msg);
    setIsSavedBanner(true);
    setTimeout(() => setIsSavedBanner(false), 2500);
  };

  // Helper Labels
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
    if (selectedSubject === 'sbj-p03') return 'English (Primary)';
    if (selectedSubject === 'sbj-p04') return 'Hindi (Primary)';
    if (selectedSubject === 'sbj-p02') return 'Mathematics (Primary)';
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

  // ==========================================================================
  // PLANNING PART (23a - PAGE 17) HANDLERS
  // ==========================================================================

  const filteredPlans = plans.filter(p => {
    if (p.subjectId && p.subjectId !== selectedSubject) return false;
    if (p.classSectionId && p.classSectionId !== selectedClass) return false;
    return true;
  });

  const handleOpenNewPlan = () => {
    setEditingPlan({
      id: `seap-${Date.now()}`,
      monthAndDate: 'April 2026 (W4)',
      activity: '',
      evaluationCriteria: 'R1: Content & Concept Clarity (5), R2: Fluency & Execution (5), R3: Creativity & Innovation (5), R4: Presentation & Viva (5) = Max 20',
      remarks: '',
      classSectionId: selectedClass,
      subjectId: selectedSubject,
      term: 1
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: SeaPlanItem) => {
    setEditingPlan({ ...plan });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async () => {
    if (!editingPlan || !editingPlan.activity) return;

    let updatedPlans: SeaPlanItem[];
    const exists = plans.findIndex(p => p.id === editingPlan.id);

    const fullPlan: SeaPlanItem = {
      id: editingPlan.id || `seap-${Date.now()}`,
      monthAndDate: editingPlan.monthAndDate || 'Month & Date',
      activity: editingPlan.activity,
      evaluationCriteria: editingPlan.evaluationCriteria || 'R1: Content (5), R2: Fluency (5), R3: Creativity (5), R4: Presentation (5) = Max 20',
      remarks: editingPlan.remarks || '',
      classSectionId: editingPlan.classSectionId || selectedClass,
      subjectId: editingPlan.subjectId || selectedSubject,
      term: editingPlan.term || 1
    };

    if (exists >= 0) {
      updatedPlans = [...plans];
      updatedPlans[exists] = fullPlan;
    } else {
      updatedPlans = [...plans, fullPlan];
    }

    setPlans(updatedPlans);
    await db.set('setup:sea_plans_iii_v', updatedPlans);
    setIsPlanModalOpen(false);
    setEditingPlan(null);
    showNotification('Planned Activity Saved to 23(a)');
  };

  const handleDeletePlan = async (id: string) => {
    const updated = plans.filter(p => p.id !== id);
    setPlans(updated);
    await db.set('setup:sea_plans_iii_v', updated);
    showNotification('Activity Plan Removed');
  };

  const handleResetDefaultPlans = async () => {
    setPlans(DEFAULT_SEA_PLANS_III_V);
    await db.set('setup:sea_plans_iii_v', DEFAULT_SEA_PLANS_III_V);
    showNotification('Reset to Standard NCERT / KVS Exemplar Activities');
  };

  // ==========================================================================
  // RECORDING PART (23b & 23c - PAGES 18 & 19) HANDLERS
  // ==========================================================================

  const getRecordForStudent = (studentId: string): SeaRecordClass3_5 => {
    const existing = records.find(
      r => r.studentId === studentId && r.term === activeRecordingTerm && r.subjectId === selectedSubject
    );
    if (existing) return existing;
    return {
      id: `sea-${studentId}-${activeRecordingTerm}-${selectedSubject}`,
      studentId,
      classSectionId: selectedClass,
      subjectId: selectedSubject,
      term: activeRecordingTerm,
      monthlyScores: {}
    };
  };

  const handleRubricScoreChange = async (
    studentId: string,
    month: string,
    rubricKey: 'r1' | 'r2' | 'r3' | 'r4',
    val: number | string
  ) => {
    const numVal = val === '' ? 0 : Number(val);
    const clamped = Math.max(0, Math.min(5, isNaN(numVal) ? 0 : numVal));
    const currentRec = getRecordForStudent(studentId);
    
    const existingMonthScore = currentRec.monthlyScores?.[month] || {
      r1: 0,
      r2: 0,
      r3: 0,
      r4: 0,
      total: 0
    };

    const updatedMonthScore: SeaMonthlyRubricScore = {
      ...existingMonthScore,
      [rubricKey]: clamped
    };
    updatedMonthScore.total =
      (updatedMonthScore.r1 || 0) +
      (updatedMonthScore.r2 || 0) +
      (updatedMonthScore.r3 || 0) +
      (updatedMonthScore.r4 || 0);

    const updatedRecord: SeaRecordClass3_5 = {
      ...currentRec,
      monthlyScores: {
        ...(currentRec.monthlyScores || {}),
        [month]: updatedMonthScore
      },
      // Backward compatibility update for activities
      activities: {
        activityName: currentRec.activities?.activityName || `SEA Continuous Evaluation Term ${activeRecordingTerm}`,
        scores: updatedMonthScore
      }
    };

    const existingIdx = records.findIndex(
      r => r.studentId === studentId && r.term === activeRecordingTerm && r.subjectId === selectedSubject
    );
    let updatedList: SeaRecordClass3_5[];
    if (existingIdx >= 0) {
      updatedList = [...records];
      updatedList[existingIdx] = updatedRecord;
    } else {
      updatedList = [...records, updatedRecord];
    }

    setRecords(updatedList);
    await db.set('setup:sea_scores_iii_v', updatedList);
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
        r => r.studentId === st.id && r.term === activeRecordingTerm && r.subjectId === selectedSubject
      );
      if (!exists) {
        const defaultMonthlyScores: { [month: string]: SeaMonthlyRubricScore } = {};
        currentMonths.forEach((m, mIdx) => {
          const r1Val = 4 + (idx % 2);
          const r2Val = 4 + ((idx + mIdx) % 2);
          const r3Val = 4 + (idx % 2);
          const r4Val = 4 + ((idx + 1) % 2);
          defaultMonthlyScores[m] = {
            r1: Math.min(5, r1Val),
            r2: Math.min(5, r2Val),
            r3: Math.min(5, r3Val),
            r4: Math.min(5, r4Val),
            total: Math.min(20, r1Val + r2Val + r3Val + r4Val)
          };
        });

        newRecords.push({
          id: `sea-${st.id}-${activeRecordingTerm}-${selectedSubject}`,
          studentId: st.id,
          classSectionId: selectedClass,
          subjectId: selectedSubject,
          term: activeRecordingTerm,
          monthlyScores: defaultMonthlyScores,
          activities: {
            activityName: `SEA Planned Continuous Assessment`,
            scores: defaultMonthlyScores[currentMonths[0]] || { r1: 5, r2: 5, r3: 4, r4: 5, total: 19 }
          }
        });
        createdCount++;
      }
    });

    setRecords(newRecords);
    await db.set('setup:sea_scores_iii_v', newRecords);
    showNotification(`Synced ${matchingStudents.length} Students from Profile Roster (${createdCount} records initialized)`);
  };

  const handleApplyBatchFill = async () => {
    const r1 = Math.max(0, Math.min(5, batchRubrics.r1));
    const r2 = Math.max(0, Math.min(5, batchRubrics.r2));
    const r3 = Math.max(0, Math.min(5, batchRubrics.r3));
    const r4 = Math.max(0, Math.min(5, batchRubrics.r4));
    const tot = r1 + r2 + r3 + r4;

    let updatedList = [...records];
    let count = 0;

    classStudents.forEach(st => {
      const currentRec = getRecordForStudent(st.id);
      const updatedMonths = { ...(currentRec.monthlyScores || {}) };

      currentMonths.forEach(m => {
        updatedMonths[m] = {
          r1,
          r2,
          r3,
          r4,
          total: tot
        };
      });

      const updatedRecord: SeaRecordClass3_5 = {
        ...currentRec,
        monthlyScores: updatedMonths,
        activities: {
          activityName: currentRec.activities?.activityName || `SEA Rubric Continuous Assessment`,
          scores: { r1, r2, r3, r4, total: tot }
        }
      };

      const idx = updatedList.findIndex(
        r => r.studentId === st.id && r.term === activeRecordingTerm && r.subjectId === selectedSubject
      );
      if (idx >= 0) {
        updatedList[idx] = updatedRecord;
      } else {
        updatedList.push(updatedRecord);
      }
      count++;
    });

    setRecords(updatedList);
    await db.set('setup:sea_scores_iii_v', updatedList);
    setShowBatchModal(false);
    showNotification(`Batch rubrics applied to ${count} students across all ${currentMonths.length} months`);
  };

  // Push Scaled Scores directly to Module 26 Scholastic Assessment Ledger
  const handlePushToScholasticLedger = async () => {
    const scholasticRecs = (await db.get<ScholasticRecordClass3_5[]>('setup:scholastic_scores_iii_v')) || DEFAULT_SCHOLASTIC_III_V;
    let updatedScholastic = [...scholasticRecs];
    let syncedCount = 0;

    classStudents.forEach(st => {
      const seaRec = getRecordForStudent(st.id);
      const months = currentMonths;
      let monthScoresSum = 0;
      let monthsCount = 0;

      months.forEach(m => {
        const mScore = seaRec.monthlyScores?.[m]?.total;
        if (mScore !== undefined && mScore > 0) {
          monthScoresSum += mScore;
          monthsCount++;
        }
      });

      // If monthlyScores are empty, fallback to legacy activities
      if (monthsCount === 0 && seaRec.activities?.scores?.total) {
        monthScoresSum = seaRec.activities.scores.total;
        monthsCount = 1;
      }

      const rawAvg = monthsCount > 0 ? Number((monthScoresSum / monthsCount).toFixed(1)) : 0;
      const scaled5 = Number((rawAvg / 4).toFixed(1)); // 20 scaled to 5

      const existingScholasticIdx = updatedScholastic.findIndex(
        s => s.studentId === st.id && s.term === activeRecordingTerm && s.subjectId === selectedSubject
      );

      if (existingScholasticIdx >= 0) {
        const existing = updatedScholastic[existingScholasticIdx];
        const updatedTotal = Number(
          ((existing.ptScaled10 || 0) + (existing.mdp20 || 0) + (existing.notebookScaled5 || 0) + scaled5 + (existing.seeTotal60 || 0)).toFixed(1)
        );
        const updatedPct = Math.round(updatedTotal);
        
        updatedScholastic[existingScholasticIdx] = {
          ...existing,
          seaRaw20: rawAvg,
          seaScaled5: scaled5,
          sea: scaled5,
          grandTotal100: updatedTotal,
          total: updatedTotal,
          percentage: updatedPct
        };
        syncedCount++;
      }
    });

    await db.set('setup:scholastic_scores_iii_v', updatedScholastic);
    showNotification(`Successfully pushed SEA scores (scaled to 5 marks) for ${syncedCount} students to Module 26 Ledger!`);
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

    if (count === 0 && rec.activities?.scores?.total) {
      sum = rec.activities.scores.total;
      count = 1;
    }

    const average20 = count > 0 ? Number((sum / count).toFixed(1)) : 0;
    const scaled5 = Number((average20 / 4).toFixed(1)); // Out of 5
    return { average20, scaled5, recordedMonths: count };
  };

  // Aggregate statistics
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
          pages={
            activeSection === 'planning'
              ? 17
              : activeSection === 'recording_t1'
              ? 18
              : 19
          }
          title={
            activeSection === 'planning'
              ? '23 (a). नियोजित विषय संवर्धन क्रियाकलापों की सूची (List of Subject Enrichment Activities Planned - Term 1-2, Page 17, 4 pages)'
              : activeSection === 'recording_t1'
              ? '23 (b). विषयसंवर्धन क्रियाकलापों का मूल्यांकन अभिलेख (कक्षा- 3 से 5) (Page 18 - Term- 1: April, July, August, September, 8 pages)'
              : '23 (c). विषयसंवर्धन क्रियाकलापों का मूल्यांकन अभिलेख (कक्षा- 3 से 5) (Page 19 - Term- 2: October, November, January, February, 8 pages)'
          }
        />
      )}

      {/* Unified Master Header Card Matching PDF Module 23 */}
      <div className="bg-gradient-to-br from-emerald-950/30 via-slate-900/40 to-teal-950/50 border border-emerald-500/30 p-6 rounded-2xl space-y-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-emerald-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official KVS Module 23
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activeSection === 'planning' ? '4 pages (Page 17)' : '8 pages (Pages 18 & 19)'}
              </span>
              {isSavedBanner && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold animate-pulse">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{savedMessage}</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>
                {activeSection === 'planning'
                  ? '23 (a). नियोजित विषय संवर्धन क्रियाकलापों की सूची'
                  : activeSection === 'recording_t1'
                  ? '23 (b). विषयसंवर्धन क्रियाकलापों का मूल्यांकन अभिलेख'
                  : '23 (c). विषयसंवर्धन क्रियाकलापों का मूल्यांकन अभिलेख'}
              </span>
            </h1>
            <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-wide">
              {activeSection === 'planning'
                ? 'LIST OF SUBJECT ENRICHMENT ACTIVITIES PLANNED (TERM 1-2)'
                : activeSection === 'recording_t1'
                ? 'RECORD OF SEA FOR CLASSES- III to V (TERM- 1)'
                : 'RECORD OF SEA FOR CLASSES- III to V (TERM- 2)'}
            </h2>
          </div>

          {/* Top Level Nav Pill: Planning vs Recording Term 1 vs Recording Term 2 */}
          <div className="bg-black/50 p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 shrink-0 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveSection('planning')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSection === 'planning'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-200" />
              <span>23 (a). Planning (P-17)</span>
            </button>

            <button
              onClick={() => setActiveSection('recording_t1')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSection === 'recording_t1'
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-cyan-200" />
              <span>23 (b). Term- 1 Record (P-18)</span>
            </button>

            <button
              onClick={() => setActiveSection('recording_t2')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSection === 'recording_t2'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-purple-200" />
              <span>23 (c). Term- 2 Record (P-19)</span>
            </button>
          </div>
        </div>

        {/* Global Filter Details Strip (Subject, Class/Section, Term Indicator, Search) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
          <div>
            <label className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
              Subject: <span className="text-white font-mono">{getSubjectLabel()}</span>
            </label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="sbj-p03">English (Primary)</option>
              <option value="sbj-p04">Hindi (Primary)</option>
              <option value="sbj-p02">Mathematics (Primary)</option>
              <option value="sbj-p01">Environmental Studies (EVS)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
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
            <label className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
              {activeSection === 'planning' ? 'Planning Scope' : 'Active Evaluation Term'}
            </label>
            <div className="mt-1 py-2 px-3 bg-black/30 border border-white/10 rounded-xl text-xs text-emerald-200 font-mono flex items-center justify-between">
              <span>
                {activeSection === 'planning'
                  ? 'Term 1 & Term 2 (8 Months)'
                  : activeSection === 'recording_t1'
                  ? 'Term- 1 (Apr, Jul, Aug, Sep)'
                  : 'Term- 2 (Oct, Nov, Jan, Feb)'}
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 rounded-md font-bold text-emerald-300">
                Max 20/mo
              </span>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Search</label>
            <div className="relative mt-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={activeSection === 'planning' ? 'Filter planned activities...' : 'Search student name / roll...'}
                className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-500/10">
          <div className="flex flex-wrap items-center gap-2">
            {activeSection === 'planning' ? (
              <>
                <button
                  onClick={handleOpenNewPlan}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Plan New SEA Activity</span>
                </button>

                <button
                  onClick={handleResetDefaultPlans}
                  className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-emerald-200 border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Load KVS Exemplars</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleImportStudentsFromProfile}
                  className="px-3.5 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Pull student profiles matching selected class"
                >
                  <Upload className="w-3.5 h-3.5 text-teal-300" />
                  <span>Import / Sync Roster</span>
                </button>

                <button
                  onClick={() => setShowBatchModal(true)}
                  className="px-3.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Apply standard rubric scores in bulk"
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
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeSection !== 'planning' && (
              <div className="bg-black/40 p-1 rounded-xl border border-white/10 flex items-center gap-1">
                <button
                  onClick={() => setRecordingViewMode('spread')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    recordingViewMode === 'spread'
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Full 4-Month Ledger Spread
                </button>
                <button
                  onClick={() => setRecordingViewMode('single_month')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    recordingViewMode === 'single_month'
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Focused Month Entry
                </button>
              </div>
            )}

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-gray-300" />
              <span>Print Page</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: PLANNING PART (PAGE 17 - 23a)                              */}
      {/* ==================================================================== */}
      {activeSection === 'planning' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>23 (a). नियोजित विषय संवर्धन क्रियाकलापों की सूची (List of Subject Enrichment Activities Planned)</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Exact replica of Teacher's Diary Page 17 (Term 1-2). Define planned dates, activities, 4-rubric evaluation criteria, and pedagogical remarks.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-300 font-mono font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                {filteredPlans.length} Planned Activities
              </span>
            </div>
          </div>

          {/* Page 17 Table Layout */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
            <table className="w-full text-xs text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-emerald-950/80 text-emerald-200 border-b border-emerald-500/30 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-4 w-36 border-r border-emerald-500/30">
                    Month & Date
                  </th>
                  <th className="py-3 px-4 w-64 border-r border-emerald-500/30">
                    Activity
                  </th>
                  <th className="py-3 px-4 border-r border-emerald-500/30 min-w-[280px]">
                    Evaluation Criteria (Rubrics R1 - R4)
                  </th>
                  <th className="py-3 px-4 w-56 border-r border-emerald-500/30">
                    Remarks
                  </th>
                  <th className="py-3 px-3 w-20 text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 font-sans">
                {filteredPlans.map((plan, idx) => (
                  <tr key={plan.id} className="hover:bg-white/5 transition-colors">
                    {/* Month & Date */}
                    <td className="py-3 px-4 border-r border-white/10 font-mono font-bold text-amber-300 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span>{plan.monthAndDate}</span>
                      </div>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-black/40 text-gray-400 font-mono">
                        {plan.term ? `Term ${plan.term}` : 'Term 1-2'}
                      </span>
                    </td>

                    {/* Activity */}
                    <td className="py-3 px-4 border-r border-white/10 align-top font-semibold text-white">
                      <div>{plan.activity}</div>
                    </td>

                    {/* Evaluation Criteria */}
                    <td className="py-3 px-4 border-r border-white/10 align-top text-gray-300">
                      <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-[11px] leading-relaxed">
                        {plan.evaluationCriteria}
                      </div>
                    </td>

                    {/* Remarks */}
                    <td className="py-3 px-4 border-r border-white/10 align-top text-gray-400 text-[11px] italic">
                      {plan.remarks || '-'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center align-top">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditPlan(plan)}
                          className="p-1.5 hover:bg-emerald-500/20 text-emerald-300 rounded-lg transition-colors cursor-pointer"
                          title="Edit Activity Plan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete Activity Plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredPlans.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      <FolderOpen className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-white">No Planned SEA Activities for this filter</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Click "+ Plan New SEA Activity" or "Load KVS Exemplars" to populate Page 17.
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
      {/* SECTION 2: RECORDING PART (PAGES 18 & 19 - 23b & 23c)                  */}
      {/* ==================================================================== */}
      {activeSection !== 'planning' && (
        <div className="space-y-5">
          {/* Performance Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <div className="text-[10px] uppercase font-bold text-gray-400">Enrolled in {getClassLabel()}</div>
              <div className="text-xl font-black text-white mt-0.5">{totalStudentsInRoster}</div>
              <div className="text-[10px] text-emerald-300 mt-0.5">Students in Roster</div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <div className="text-[10px] uppercase font-bold text-gray-400">Evaluated</div>
              <div className="text-xl font-black text-teal-300 mt-0.5">{evaluatedStudentsCount} / {totalStudentsInRoster}</div>
              <div className="text-[10px] text-teal-300/80 mt-0.5">
                {totalStudentsInRoster > 0 ? Math.round((evaluatedStudentsCount / totalStudentsInRoster) * 100) : 0}% graded
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <div className="text-[10px] uppercase font-bold text-gray-400">Term Average (/20)</div>
              <div className="text-xl font-black text-amber-300 mt-0.5">{classOverallAverage20} <span className="text-xs text-gray-400 font-normal">/ 20</span></div>
              <div className="text-[10px] text-amber-200/80 mt-0.5">4-Rubric SEA Mean Score</div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <div className="text-[10px] uppercase font-bold text-gray-400">Scaled Mean (/5)</div>
              <div className="text-xl font-black text-emerald-300 mt-0.5">{classOverallScaled5} <span className="text-xs text-gray-400 font-normal">/ 5.0</span></div>
              <div className="text-[10px] text-emerald-200/80 mt-0.5">Module 26 Scholastic Scaled</div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* VIEW MODE: FULL 4-MONTH SPREAD (PAGES 18 & 19 EXACT LEDGER)       */}
          {/* ================================================================ */}
          {recordingViewMode === 'spread' && (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
              <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
                <thead>
                  {/* Row 1: Top Header Row Grouping Months */}
                  <tr className="bg-emerald-950/80 text-emerald-200 border-b border-emerald-500/30 text-center font-bold">
                    <th className="py-2.5 px-3 border-r border-emerald-500/30 w-12 text-center" rowSpan={2}>
                      S.NO
                    </th>
                    <th className="py-2.5 px-4 border-r border-emerald-500/30 text-left min-w-[180px]" rowSpan={2}>
                      NAME OF STUDENT
                    </th>

                    {currentMonths.map(m => (
                      <th
                        key={m}
                        colSpan={5}
                        className="py-2 px-2 border-r border-emerald-500/30 bg-emerald-900/40 text-emerald-100 font-extrabold uppercase tracking-wider text-xs"
                      >
                        MONTH: {m}
                      </th>
                    ))}

                    <th colSpan={2} className="py-2 px-3 bg-teal-950/60 text-teal-200 font-extrabold uppercase tracking-wider text-xs">
                      TERM {activeRecordingTerm} SUMMARY
                    </th>
                  </tr>

                  {/* Row 2: Sub-columns for R1, R2, R3, R4, Total */}
                  <tr className="bg-black/60 text-gray-300 border-b border-white/10 text-center text-[10px] font-semibold">
                    {currentMonths.map((m, mIdx) => (
                      <React.Fragment key={m}>
                        <th className="py-2 px-1 border-r border-white/10 w-11 text-amber-300" title="Rubric 1 (Max 5): Content / Concepts">
                          R1<br />5
                        </th>
                        <th className="py-2 px-1 border-r border-white/10 w-11 text-amber-300" title="Rubric 2 (Max 5): Fluency / Execution">
                          R2<br />5
                        </th>
                        <th className="py-2 px-1 border-r border-white/10 w-11 text-amber-300" title="Rubric 3 (Max 5): Creativity / Innovation">
                          R3<br />5
                        </th>
                        <th className="py-2 px-1 border-r border-white/10 w-11 text-amber-300" title="Rubric 4 (Max 5): Presentation / Viva">
                          R4<br />5
                        </th>
                        <th
                          className={`py-2 px-1 border-r ${
                            mIdx === currentMonths.length - 1 ? 'border-r-2 border-emerald-500/40' : 'border-white/10'
                          } w-14 font-black text-emerald-300 bg-emerald-500/10`}
                          title="TOTAL (Max 20)"
                        >
                          TOTAL<br />20
                        </th>
                      </React.Fragment>
                    ))}

                    <th className="py-2 px-2 border-r border-white/10 w-16 text-teal-300 font-black bg-teal-500/10">
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
                        {/* S.NO */}
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
                            r1: 0,
                            r2: 0,
                            r3: 0,
                            r4: 0,
                            total: 0
                          };

                          return (
                            <React.Fragment key={m}>
                              {/* R1 (5) */}
                              <td className="py-1 px-1 border-r border-white/10 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={5}
                                  value={mScore.r1 || ''}
                                  onChange={e => handleRubricScoreChange(student.id, m, 'r1', e.target.value)}
                                  className="w-10 text-center py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-amber-200 focus:border-emerald-400 focus:outline-none"
                                />
                              </td>

                              {/* R2 (5) */}
                              <td className="py-1 px-1 border-r border-white/10 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={5}
                                  value={mScore.r2 || ''}
                                  onChange={e => handleRubricScoreChange(student.id, m, 'r2', e.target.value)}
                                  className="w-10 text-center py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-amber-200 focus:border-emerald-400 focus:outline-none"
                                />
                              </td>

                              {/* R3 (5) */}
                              <td className="py-1 px-1 border-r border-white/10 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={5}
                                  value={mScore.r3 || ''}
                                  onChange={e => handleRubricScoreChange(student.id, m, 'r3', e.target.value)}
                                  className="w-10 text-center py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-amber-200 focus:border-emerald-400 focus:outline-none"
                                />
                              </td>

                              {/* R4 (5) */}
                              <td className="py-1 px-1 border-r border-white/10 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={5}
                                  value={mScore.r4 || ''}
                                  onChange={e => handleRubricScoreChange(student.id, m, 'r4', e.target.value)}
                                  className="w-10 text-center py-1 bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-amber-200 focus:border-emerald-400 focus:outline-none"
                                />
                              </td>

                              {/* Total (20) */}
                              <td
                                className={`py-1 px-1 border-r ${
                                  mIdx === currentMonths.length - 1 ? 'border-r-2 border-emerald-500/40' : 'border-white/10'
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
                        <td className="py-2 px-2 border-r border-white/10 text-center font-bold text-teal-300 bg-teal-500/5">
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
                        <Sparkles className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" />
                        <p className="text-sm font-semibold">No students matching current filter</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Click "Import / Sync Roster" to automatically pull the class student list.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ================================================================ */}
          {/* VIEW MODE: FOCUSED SINGLE MONTH ENTRY                             */}
          {/* ================================================================ */}
          {recordingViewMode === 'single_month' && (
            <div className="space-y-4">
              {/* Month Switcher Tabs */}
              <div className="flex flex-wrap items-center gap-2 bg-black/40 p-2.5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-emerald-300 px-3 uppercase tracking-wide">Select Month:</span>
                {currentMonths.map(m => (
                  <button
                    key={m}
                    onClick={() => setFocusedMonth(m)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      focusedMonth === m
                        ? 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/25'
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
                    <tr className="bg-emerald-950/80 text-emerald-200 border-b border-white/10 text-[11px] uppercase tracking-wider">
                      <th className="p-3 w-14 text-center font-bold">S.No / Roll</th>
                      <th className="p-3 min-w-[180px] font-bold">Student Name</th>
                      <th className="p-3 text-center w-32 font-bold text-amber-300">
                        <div>Rubric 1 (R1)</div>
                        <div className="text-[10px] text-gray-400 lowercase font-normal">Content & Mastery (5)</div>
                      </th>
                      <th className="p-3 text-center w-32 font-bold text-amber-300">
                        <div>Rubric 2 (R2)</div>
                        <div className="text-[10px] text-gray-400 lowercase font-normal">Fluency & Execution (5)</div>
                      </th>
                      <th className="p-3 text-center w-32 font-bold text-amber-300">
                        <div>Rubric 3 (R3)</div>
                        <div className="text-[10px] text-gray-400 lowercase font-normal">Creativity & Originality (5)</div>
                      </th>
                      <th className="p-3 text-center w-32 font-bold text-amber-300">
                        <div>Rubric 4 (R4)</div>
                        <div className="text-[10px] text-gray-400 lowercase font-normal">Presentation & Viva (5)</div>
                      </th>
                      <th className="p-3 text-center w-32 font-bold text-emerald-300 bg-emerald-950/90">
                        <div>Month Total</div>
                        <div className="text-[10px] text-emerald-300 font-normal">(/20)</div>
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
                        r1: 0,
                        r2: 0,
                        r3: 0,
                        r4: 0,
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
                              value={monthData.r1 || ''}
                              onChange={e => handleRubricScoreChange(student.id, focusedMonth, 'r1', e.target.value)}
                              className="w-16 text-center py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
                            />
                          </td>

                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={5}
                              value={monthData.r2 || ''}
                              onChange={e => handleRubricScoreChange(student.id, focusedMonth, 'r2', e.target.value)}
                              className="w-16 text-center py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
                            />
                          </td>

                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={5}
                              value={monthData.r3 || ''}
                              onChange={e => handleRubricScoreChange(student.id, focusedMonth, 'r3', e.target.value)}
                              className="w-16 text-center py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
                            />
                          </td>

                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={5}
                              value={monthData.r4 || ''}
                              onChange={e => handleRubricScoreChange(student.id, focusedMonth, 'r4', e.target.value)}
                              className="w-16 text-center py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
                            />
                          </td>

                          <td className="p-3 text-center bg-emerald-950/30 font-bold font-mono">
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

          {/* Official 4-Rubric Competency Evaluation Reference Card */}
          <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>
                KVS Official Subject Enrichment Rubric Matrix (Pages 18 & 19 of Diary):
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span>RUBRIC 1 (R1)</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 rounded font-mono">5 Marks</span>
                </div>
                <div className="text-white font-semibold text-[11px]">Content Mastery & Concept Clarity</div>
                <p className="text-[11px] text-gray-300">
                  Subject factual depth, understanding of underlying concepts, and precision in answers.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span>RUBRIC 2 (R2)</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 rounded font-mono">5 Marks</span>
                </div>
                <div className="text-white font-semibold text-[11px]">Fluency, Technique & Execution</div>
                <p className="text-[11px] text-gray-300">
                  Language pronunciation/flow, mathematical calculation steps, laboratory technique, and speed.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span>RUBRIC 3 (R3)</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 rounded font-mono">5 Marks</span>
                </div>
                <div className="text-white font-semibold text-[11px]">Creativity & Originality</div>
                <p className="text-[11px] text-gray-300">
                  Innovative approaches, unique artistic/dramatic interpretations, and out-of-the-box reasoning.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span>RUBRIC 4 (R4)</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 rounded font-mono">5 Marks</span>
                </div>
                <div className="text-white font-semibold text-[11px]">Presentation & Viva Response</div>
                <p className="text-[11px] text-gray-300">
                  Stage confidence, neatness of charts/models, body language, and peer interaction in Q&A.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: PLAN NEW / EDIT SEA ACTIVITY (23a)                           */}
      {/* ==================================================================== */}
      {isPlanModalOpen && editingPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>23 (a). Plan Subject Enrichment Activity</span>
              </h3>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-white/5 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-300 uppercase">Month & Date (Column 1)</label>
                <input
                  type="text"
                  value={editingPlan.monthAndDate || ''}
                  onChange={e => setEditingPlan({ ...editingPlan, monthAndDate: e.target.value })}
                  placeholder="e.g. April 2026 (W4) or 15 July 2026"
                  className="w-full mt-1 py-2 px-3 bg-black/50 border border-white/10 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-300 uppercase">Activity Title / Description (Column 2)</label>
                <input
                  type="text"
                  value={editingPlan.activity || ''}
                  onChange={e => setEditingPlan({ ...editingPlan, activity: e.target.value })}
                  placeholder="e.g. Story Dramatization, Math Origami, EVS Leaf Album..."
                  className="w-full mt-1 py-2 px-3 bg-black/50 border border-white/10 rounded-xl text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-300 uppercase">Evaluation Criteria & Rubrics (Column 3)</label>
                <textarea
                  rows={3}
                  value={editingPlan.evaluationCriteria || ''}
                  onChange={e => setEditingPlan({ ...editingPlan, evaluationCriteria: e.target.value })}
                  placeholder="R1: Content (5), R2: Fluency (5), R3: Creativity (5), R4: Presentation (5)..."
                  className="w-full mt-1 py-2 px-3 bg-black/50 border border-white/10 rounded-xl text-white leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-300 uppercase">Remarks / Pedagogical Notes (Column 4)</label>
                <input
                  type="text"
                  value={editingPlan.remarks || ''}
                  onChange={e => setEditingPlan({ ...editingPlan, remarks: e.target.value })}
                  placeholder="e.g. Linked to NCERT Unit 4; resources required..."
                  className="w-full mt-1 py-2 px-3 bg-black/50 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Class</label>
                  <select
                    value={editingPlan.classSectionId || selectedClass}
                    onChange={e => setEditingPlan({ ...editingPlan, classSectionId: e.target.value })}
                    className="w-full mt-1 py-1.5 px-3 bg-black/50 border border-white/10 rounded-xl text-white"
                  >
                    <option value="cls-3a">Class III (A)</option>
                    <option value="cls-3b">Class III (B)</option>
                    <option value="cls-4a">Class IV (A)</option>
                    <option value="cls-4b">Class IV (B)</option>
                    <option value="cls-5a">Class V (A)</option>
                    <option value="cls-5b">Class V (B)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Term</label>
                  <select
                    value={editingPlan.term || 1}
                    onChange={e => setEditingPlan({ ...editingPlan, term: Number(e.target.value) as 1 | 2 })}
                    className="w-full mt-1 py-1.5 px-3 bg-black/50 border border-white/10 rounded-xl text-white"
                  >
                    <option value={1}>Term 1</option>
                    <option value={2}>Term 2</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Planned Activity</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: BATCH QUICK FILL SCORES (23b & 23c)                          */}
      {/* ==================================================================== */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>Batch Quick Fill SEA Scores</span>
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-white/5 rounded-lg"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Apply default rubric scores across all {classStudents.length} students for all {currentMonths.length} months of Term {activeRecordingTerm}.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Rubric 1: Content (5)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={batchRubrics.r1}
                  onChange={e => setBatchRubrics({ ...batchRubrics, r1: Number(e.target.value) })}
                  className="w-full mt-1 py-1.5 px-3 bg-black/50 border border-white/10 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Rubric 2: Fluency (5)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={batchRubrics.r2}
                  onChange={e => setBatchRubrics({ ...batchRubrics, r2: Number(e.target.value) })}
                  className="w-full mt-1 py-1.5 px-3 bg-black/50 border border-white/10 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Rubric 3: Creativity (5)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={batchRubrics.r3}
                  onChange={e => setBatchRubrics({ ...batchRubrics, r3: Number(e.target.value) })}
                  className="w-full mt-1 py-1.5 px-3 bg-black/50 border border-white/10 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Rubric 4: Presentation (5)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={batchRubrics.r4}
                  onChange={e => setBatchRubrics({ ...batchRubrics, r4: Number(e.target.value) })}
                  className="w-full mt-1 py-1.5 px-3 bg-black/50 border border-white/10 rounded-xl text-white font-bold"
                />
              </div>
            </div>

            <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-xs flex items-center justify-between">
              <span className="text-gray-400 font-medium">Monthly Total per Student:</span>
              <span className="font-mono font-black text-emerald-300">
                {batchRubrics.r1 + batchRubrics.r2 + batchRubrics.r3 + batchRubrics.r4} / 20
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBatchFill}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to All Students</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
