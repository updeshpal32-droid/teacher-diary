import React, { useState, useEffect } from 'react';
import {
  ScholasticRecordClass1_2,
  ScholasticRecordClass3_5,
  StudentProfile,
  PrimaryTerm,
  CbsePrimaryGrade,
  FoundationalCycleRating
} from '../types/academic';
import {
  db,
  DEFAULT_SCHOLASTIC_I_II,
  DEFAULT_SCHOLASTIC_III_V,
  DEFAULT_STUDENTS,
  DEFAULT_NOTEBOOK_III_V,
  DEFAULT_SEA_III_V
} from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  Award,
  Users,
  Search,
  CheckCircle2,
  Sparkles,
  Printer,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Sliders,
  Calculator,
  Layers,
  ChevronRight,
  BookOpen,
  Info,
  Check,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface ScholasticAssessmentManagerProps {
  devMode: boolean;
  initialStage?: 'foundational' | 'preparatory';
  initialTerm?: PrimaryTerm;
}

const FOUNDATIONAL_COMPETENCY_FIELDS = [
  { key: 'listening_understanding', label: 'Listening with Comprehension', domain: 'Foundational Language' },
  { key: 'speaking_fluency', label: 'Speaking & Oral Expression', domain: 'Foundational Language' },
  { key: 'reading_readiness', label: 'Reading Readiness & Phonics', domain: 'Foundational Language' },
  { key: 'number_sense', label: 'Number Concept & Counting', domain: 'Foundational Numeracy' },
  { key: 'basic_operations', label: 'Basic Mathematical Operations', domain: 'Foundational Numeracy' },
  { key: 'shapes_spatial', label: 'Shapes & Spatial Understanding', domain: 'Cognitive Skills' },
  { key: 'creative_expression', label: 'Creative & Visual Expression', domain: 'Aesthetic Skills' },
  { key: 'social_behavior', label: 'Social & Emotional Habits', domain: 'Socio-Emotional' }
];

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

function getGradeBadgeColor(grade: CbsePrimaryGrade): string {
  switch (grade) {
    case 'A1':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'A2':
      return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
    case 'B1':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    case 'B2':
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    case 'C1':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'C2':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    case 'D':
      return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    case 'E':
      return 'bg-red-500/20 text-red-300 border-red-500/40';
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
  }
}

export default function ScholasticAssessmentManager({
  devMode,
  initialStage = 'foundational',
  initialTerm = 1
}: ScholasticAssessmentManagerProps) {
  // Stage Navigator: 'foundational' (Classes I & II) | 'preparatory' (Classes III to V)
  const [stage, setStage] = useState<'foundational' | 'preparatory'>(initialStage);
  
  // Shared state
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSavedBanner, setIsSavedBanner] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string>('Auto-Saved Changes');

  // Foundational Stage (Classes I & II) state
  const [recordsI_II, setRecordsI_II] = useState<ScholasticRecordClass1_2[]>([]);
  const [selectedClassI_II, setSelectedClassI_II] = useState<string>('cls-1a');
  const [selectedSubjectI_II, setSelectedSubjectI_II] = useState<string>('sbj-p03');
  const [foundationalViewMode, setFoundationalViewMode] = useState<'spread' | 'single_cycle'>('spread');
  const [activeCycle, setActiveCycle] = useState<number>(1);
  const [competencyModalStudentId, setCompetencyModalStudentId] = useState<string | null>(null);

  // Preparatory Stage (Classes III to V) state
  const [recordsIII_V, setRecordsIII_V] = useState<ScholasticRecordClass3_5[]>([]);
  const [selectedClassIII_V, setSelectedClassIII_V] = useState<string>('cls-3a');
  const [selectedSubjectIII_V, setSelectedSubjectIII_V] = useState<string>('sbj-p02');
  const [activeTerm, setActiveTerm] = useState<PrimaryTerm>(initialTerm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const recs12 = (await db.get<ScholasticRecordClass1_2[]>('setup:scholastic_scores_i_ii')) || DEFAULT_SCHOLASTIC_I_II;
    const recs35 = (await db.get<ScholasticRecordClass3_5[]>('setup:scholastic_scores_iii_v')) || DEFAULT_SCHOLASTIC_III_V;
    const stds = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    
    setRecordsI_II(recs12);
    setRecordsIII_V(recs35);
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

  // ==========================================================================
  // FOUNDATIONAL STAGE (CLASSES I & II) HANDLERS & LOGIC
  // ==========================================================================

  const getFoundationalClassLabel = () => {
    if (selectedClassI_II === 'cls-1a') return 'I (A)';
    if (selectedClassI_II === 'cls-1b') return 'I (B)';
    if (selectedClassI_II === 'cls-2a') return 'II (A)';
    if (selectedClassI_II === 'cls-2b') return 'II (B)';
    return 'I & II';
  };

  const foundationalFilteredStudents = students.filter(s => {
    const className = (s.className || '').toUpperCase();
    if (selectedClassI_II === 'cls-1a' || selectedClassI_II === 'cls-1b') {
      return className === 'I' || className === '1' || s.id.startsWith('std-1');
    }
    if (selectedClassI_II === 'cls-2a' || selectedClassI_II === 'cls-2b') {
      return className === 'II' || className === '2' || s.id.startsWith('std-2');
    }
    return className === 'I' || className === 'II' || s.id.startsWith('std-1') || s.id.startsWith('std-2');
  }).filter(s => {
    const name = ((s as any).studentName || (s as any).name || '').toLowerCase();
    const roll = String((s as any).rollNo || (s as any).sn || '');
    return name.includes(searchQuery.toLowerCase()) || roll.includes(searchQuery);
  });

  const getRecordForFoundationalStudent = (studentId: string): ScholasticRecordClass1_2 => {
    const existing = recordsI_II.find(r => r.studentId === studentId && r.subjectId === selectedSubjectI_II);
    if (existing) return existing;
    return {
      id: `sch12-${studentId}-${selectedSubjectI_II}`,
      studentId,
      classSectionId: selectedClassI_II,
      subjectId: selectedSubjectI_II,
      cycleRatings: {}
    };
  };

  const handleFoundationalCycleRatingChange = async (
    studentId: string,
    cycleNum: number,
    rating: FoundationalCycleRating | ''
  ) => {
    const currentRec = getRecordForFoundationalStudent(studentId);
    const existingCycleObj = currentRec.cycleRatings[cycleNum] || {};
    
    // Default main rating key for overall cycle
    const updatedCycleRatings = {
      ...currentRec.cycleRatings,
      [cycleNum]: {
        ...existingCycleObj,
        overall: rating as FoundationalCycleRating
      }
    };

    const updatedRecord: ScholasticRecordClass1_2 = {
      ...currentRec,
      cycleRatings: updatedCycleRatings
    };

    const existingIdx = recordsI_II.findIndex(r => r.studentId === studentId && r.subjectId === selectedSubjectI_II);
    let updatedList: ScholasticRecordClass1_2[];
    if (existingIdx >= 0) {
      updatedList = [...recordsI_II];
      updatedList[existingIdx] = updatedRecord;
    } else {
      updatedList = [...recordsI_II, updatedRecord];
    }

    setRecordsI_II(updatedList);
    await db.set('setup:scholastic_scores_i_ii', updatedList);
    showNotification(`Cycle ${cycleNum} Rating Updated`);
  };

  const handleFoundationalCompetencyRating = async (
    studentId: string,
    cycleNum: number,
    competencyKey: string,
    rating: FoundationalCycleRating
  ) => {
    const currentRec = getRecordForFoundationalStudent(studentId);
    const existingCycleObj = currentRec.cycleRatings[cycleNum] || {};
    
    const updatedCycleRatings = {
      ...currentRec.cycleRatings,
      [cycleNum]: {
        ...existingCycleObj,
        [competencyKey]: rating
      }
    };

    const updatedRecord: ScholasticRecordClass1_2 = {
      ...currentRec,
      cycleRatings: updatedCycleRatings
    };

    const existingIdx = recordsI_II.findIndex(r => r.studentId === studentId && r.subjectId === selectedSubjectI_II);
    let updatedList: ScholasticRecordClass1_2[];
    if (existingIdx >= 0) {
      updatedList = [...recordsI_II];
      updatedList[existingIdx] = updatedRecord;
    } else {
      updatedList = [...recordsI_II, updatedRecord];
    }

    setRecordsI_II(updatedList);
    await db.set('setup:scholastic_scores_i_ii', updatedList);
    showNotification('Competency Rubric Saved');
  };

  const handleImportStudentsFromProfileI_II = async () => {
    const matchingStudents = students.filter(s => {
      const className = (s.className || '').toUpperCase();
      if (selectedClassI_II.includes('1')) return className === 'I' || className === '1' || s.id.startsWith('std-1');
      if (selectedClassI_II.includes('2')) return className === 'II' || className === '2' || s.id.startsWith('std-2');
      return true;
    });

    let newRecords = [...recordsI_II];
    let createdCount = 0;

    matchingStudents.forEach(st => {
      const exists = newRecords.find(r => r.studentId === st.id && r.subjectId === selectedSubjectI_II);
      if (!exists) {
        newRecords.push({
          id: `sch12-${st.id}-${selectedSubjectI_II}`,
          studentId: st.id,
          classSectionId: selectedClassI_II,
          subjectId: selectedSubjectI_II,
          cycleRatings: {
            1: { listening_understanding: 'A', speaking_fluency: 'A', overall: 'A' },
            2: { listening_understanding: 'A', speaking_fluency: 'B', overall: 'A' }
          }
        });
        createdCount++;
      }
    });

    setRecordsI_II(newRecords);
    await db.set('setup:scholastic_scores_i_ii', newRecords);
    showNotification(`Synced ${matchingStudents.length} Students from Profile Roster (${createdCount} newly initialized)`);
  };

  const getCycleRatingDisplay = (record: ScholasticRecordClass1_2, cycleNum: number): string => {
    const cycle = record.cycleRatings?.[cycleNum];
    if (!cycle) return '-';
    if (cycle.overall) return cycle.overall;
    
    // Check if competencies exist and derive majority
    const values = Object.values(cycle).filter(v => v === 'A' || v === 'B' || v === 'C');
    if (values.length > 0) {
      return values[0];
    }
    return '-';
  };

  // ==========================================================================
  // PREPARATORY STAGE (CLASSES III TO V) HANDLERS & LOGIC
  // ==========================================================================

  const getPreparatoryClassLabel = () => {
    if (selectedClassIII_V === 'cls-3a') return 'III (A)';
    if (selectedClassIII_V === 'cls-3b') return 'III (B)';
    if (selectedClassIII_V === 'cls-4a') return 'IV (A)';
    if (selectedClassIII_V === 'cls-4b') return 'IV (B)';
    if (selectedClassIII_V === 'cls-5a') return 'V (A)';
    if (selectedClassIII_V === 'cls-5b') return 'V (B)';
    return 'III to V';
  };

  const preparatoryFilteredStudents = students.filter(s => {
    const className = (s.className || '').toUpperCase();
    if (selectedClassIII_V.includes('3')) return className === 'III' || className === '3' || s.id.startsWith('std-3');
    if (selectedClassIII_V.includes('4')) return className === 'IV' || className === '4' || s.id.startsWith('std-4');
    if (selectedClassIII_V.includes('5')) return className === 'V' || className === '5' || s.id.startsWith('std-5');
    return className === 'III' || className === 'IV' || className === 'V' || s.id.startsWith('std-3') || s.id.startsWith('std-4') || s.id.startsWith('std-5');
  }).filter(s => {
    const name = ((s as any).studentName || (s as any).name || '').toLowerCase();
    const roll = String((s as any).rollNo || (s as any).sn || '');
    return name.includes(searchQuery.toLowerCase()) || roll.includes(searchQuery);
  });

  const getRecordForPreparatoryStudent = (studentId: string): ScholasticRecordClass3_5 => {
    const existing = recordsIII_V.find(
      r => r.studentId === studentId && r.term === activeTerm && r.subjectId === selectedSubjectIII_V
    );
    if (existing) return existing;
    return {
      id: `sch35-${studentId}-${activeTerm}-${selectedSubjectIII_V}`,
      studentId,
      classSectionId: selectedClassIII_V,
      subjectId: selectedSubjectIII_V,
      term: activeTerm,
      periodicTest: 0,
      notebook: 0,
      sea: 0,
      mdp: 0,
      termEndExam: 0,
      total: 0,
      percentage: 0,
      grade: 'E',
      ptOral: 0,
      ptPenPaper: 0,
      ptTotal40: 0,
      ptScaled10: 0,
      mdp20: 0,
      notebookRaw20: 0,
      notebookScaled5: 0,
      seaRaw20: 0,
      seaScaled5: 0,
      seeOral: 0,
      seePenPaper: 0,
      seeTotal60: 0,
      grandTotal100: 0
    };
  };

  const handlePreparatoryScoreChange = async (
    studentId: string,
    updates: Partial<ScholasticRecordClass3_5>
  ) => {
    const currentRec = getRecordForPreparatoryStudent(studentId);
    
    // Merge updates
    const merged: ScholasticRecordClass3_5 = {
      ...currentRec,
      ...updates
    };

    // Calculate PT Total (40) and Scaled (10)
    const ptOral = Math.max(0, Math.min(10, Number(merged.ptOral || 0)));
    const ptPenPaper = Math.max(0, Math.min(30, Number(merged.ptPenPaper || 0)));
    const ptTotal40 = ptOral + ptPenPaper;
    const ptScaled10 = Number((ptTotal40 / 4).toFixed(1)); // 40 scaled to 10
    merged.ptOral = ptOral;
    merged.ptPenPaper = ptPenPaper;
    merged.ptTotal40 = ptTotal40;
    merged.ptScaled10 = ptScaled10;
    merged.periodicTest = ptScaled10;

    // MDP (20)
    const mdp20 = Math.max(0, Math.min(20, Number(merged.mdp20 ?? merged.mdp ?? 0)));
    merged.mdp20 = mdp20;
    merged.mdp = mdp20;

    // Notebook Submission (20 raw -> 5 scaled)
    const nbRaw = Math.max(0, Math.min(20, Number(merged.notebookRaw20 ?? (merged.notebook ? merged.notebook * 4 : 0))));
    const nbScaled = Number((nbRaw / 4).toFixed(1));
    merged.notebookRaw20 = nbRaw;
    merged.notebookScaled5 = nbScaled;
    merged.notebook = nbScaled;

    // Subject Enrichment (20 raw -> 5 scaled)
    const seaRaw = Math.max(0, Math.min(20, Number(merged.seaRaw20 ?? (merged.sea ? merged.sea * 4 : 0))));
    const seaScaled = Number((seaRaw / 4).toFixed(1));
    merged.seaRaw20 = seaRaw;
    merged.seaScaled5 = seaScaled;
    merged.sea = seaScaled;

    // SEE (Oral 20 + Pen Paper 40 = Total 60)
    const seeOral = Math.max(0, Math.min(20, Number(merged.seeOral || 0)));
    const seePenPaper = Math.max(0, Math.min(40, Number(merged.seePenPaper || 0)));
    const seeTotal60 = seeOral + seePenPaper;
    merged.seeOral = seeOral;
    merged.seePenPaper = seePenPaper;
    merged.seeTotal60 = seeTotal60;
    merged.termEndExam = seeTotal60;

    // Grand Total (100) = PT Scaled (10) + MDP (20) + Notebook Scaled (5) + SEA Scaled (5) + SEE Total (60)
    const grandTotal = Number((ptScaled10 + mdp20 + nbScaled + seaScaled + seeTotal60).toFixed(1));
    merged.grandTotal100 = grandTotal;
    merged.total = grandTotal;
    merged.percentage = Math.round(grandTotal);
    merged.grade = calculateGrade(merged.percentage);

    const existingIdx = recordsIII_V.findIndex(
      r => r.studentId === studentId && r.term === activeTerm && r.subjectId === selectedSubjectIII_V
    );
    let updatedList: ScholasticRecordClass3_5[];
    if (existingIdx >= 0) {
      updatedList = [...recordsIII_V];
      updatedList[existingIdx] = merged;
    } else {
      updatedList = [...recordsIII_V, merged];
    }

    setRecordsIII_V(updatedList);
    await db.set('setup:scholastic_scores_iii_v', updatedList);
    showNotification('Student Marks Auto-Saved');
  };

  const handleImportStudentsFromProfileIII_V = async () => {
    const matchingStudents = students.filter(s => {
      const className = (s.className || '').toUpperCase();
      if (selectedClassIII_V.includes('3')) return className === 'III' || className === '3' || s.id.startsWith('std-3');
      if (selectedClassIII_V.includes('4')) return className === 'IV' || className === '4' || s.id.startsWith('std-4');
      if (selectedClassIII_V.includes('5')) return className === 'V' || className === '5' || s.id.startsWith('std-5');
      return true;
    });

    let newRecords = [...recordsIII_V];
    let createdCount = 0;

    matchingStudents.forEach((st, idx) => {
      const exists = newRecords.find(
        r => r.studentId === st.id && r.term === activeTerm && r.subjectId === selectedSubjectIII_V
      );
      if (!exists) {
        // Base initial values for smooth demonstration
        const basePtOral = 8 + (idx % 3);
        const basePtPenPaper = 24 + (idx % 7);
        const ptTot = basePtOral + basePtPenPaper;
        const ptSc = Number((ptTot / 4).toFixed(1));
        const mdpVal = 16 + (idx % 5);
        const nbRaw = 18;
        const nbSc = 4.5;
        const seaRaw = 18;
        const seaSc = 4.5;
        const seeOr = 16 + (idx % 5);
        const seePp = 32 + (idx % 9);
        const seeTot = seeOr + seePp;
        const grandTot = Number((ptSc + mdpVal + nbSc + seaSc + seeTot).toFixed(1));
        const pct = Math.round(grandTot);

        newRecords.push({
          id: `sch35-${st.id}-${activeTerm}-${selectedSubjectIII_V}`,
          studentId: st.id,
          classSectionId: selectedClassIII_V,
          subjectId: selectedSubjectIII_V,
          term: activeTerm,
          ptOral: basePtOral,
          ptPenPaper: basePtPenPaper,
          ptTotal40: ptTot,
          ptScaled10: ptSc,
          periodicTest: ptSc,
          mdp20: mdpVal,
          mdp: mdpVal,
          notebookRaw20: nbRaw,
          notebookScaled5: nbSc,
          notebook: nbSc,
          seaRaw20: seaRaw,
          seaScaled5: seaSc,
          sea: seaSc,
          seeOral: seeOr,
          seePenPaper: seePp,
          seeTotal60: seeTot,
          termEndExam: seeTot,
          grandTotal100: grandTot,
          total: grandTot,
          percentage: pct,
          grade: calculateGrade(pct)
        });
        createdCount++;
      }
    });

    setRecordsIII_V(newRecords);
    await db.set('setup:scholastic_scores_iii_v', newRecords);
    showNotification(`Synced ${matchingStudents.length} Students from Profile Roster (${createdCount} records initialized)`);
  };

  const handlePullFromNotebookAndSea = async () => {
    const nbRecords = (await db.get<any[]>('setup:notebook_scores_iii_v')) || DEFAULT_NOTEBOOK_III_V;
    const seaRecords = (await db.get<any[]>('setup:sea_scores_iii_v')) || DEFAULT_SEA_III_V;

    let updatedList = [...recordsIII_V];
    let syncedCount = 0;

    preparatoryFilteredStudents.forEach(st => {
      const currentRec = getRecordForPreparatoryStudent(st.id);
      
      // Look for notebook score in Module 22
      const nbMatch = nbRecords.find(n => n.studentId === st.id && n.term === activeTerm);
      let nbRawScore = currentRec.notebookRaw20 || 0;
      if (nbMatch?.monthlyScores) {
        const scores = Object.values(nbMatch.monthlyScores) as any[];
        if (scores.length > 0) {
          const avg = scores.reduce((acc, curr) => acc + (curr.total || 0), 0) / scores.length;
          nbRawScore = Number(avg.toFixed(1));
        }
      }

      // Look for SEA score in Module 23
      const seaMatch = seaRecords.find(s => s.studentId === st.id && s.term === activeTerm);
      let seaRawScore = currentRec.seaRaw20 || 0;
      if (seaMatch?.monthlyScores) {
        const scores = Object.values(seaMatch.monthlyScores) as any[];
        if (scores.length > 0) {
          const avg = scores.reduce((acc, curr) => acc + (curr.total || 0), 0) / scores.length;
          seaRawScore = Number(avg.toFixed(1));
        }
      } else if (seaMatch?.activities?.scores?.total) {
        seaRawScore = Number(seaMatch.activities.scores.total);
      }

      const nbScaled = Number((nbRawScore / 4).toFixed(1));
      const seaScaled = Number((seaRawScore / 4).toFixed(1));
      const ptScaled = currentRec.ptScaled10 || 0;
      const mdp = currentRec.mdp20 || 0;
      const seeTotal = currentRec.seeTotal60 || 0;

      const grandTotal = Number((ptScaled + mdp + nbScaled + seaScaled + seeTotal).toFixed(1));
      const pct = Math.round(grandTotal);

      const updatedRec: ScholasticRecordClass3_5 = {
        ...currentRec,
        notebookRaw20: nbRawScore,
        notebookScaled5: nbScaled,
        notebook: nbScaled,
        seaRaw20: seaRawScore,
        seaScaled5: seaScaled,
        sea: seaScaled,
        grandTotal100: grandTotal,
        total: grandTotal,
        percentage: pct,
        grade: calculateGrade(pct)
      };

      const idx = updatedList.findIndex(
        r => r.studentId === st.id && r.term === activeTerm && r.subjectId === selectedSubjectIII_V
      );
      if (idx >= 0) {
        updatedList[idx] = updatedRec;
      } else {
        updatedList.push(updatedRec);
      }
      syncedCount++;
    });

    setRecordsIII_V(updatedList);
    await db.set('setup:scholastic_scores_iii_v', updatedList);
    showNotification(`Successfully pulled & scaled scores for ${syncedCount} students from Modules 22 & 23`);
  };

  // Compute Preparatory statistics
  const currentPrepRecords = preparatoryFilteredStudents.map(s => getRecordForPreparatoryStudent(s.id));
  const prepTotalAppeared = currentPrepRecords.filter(r => (r.grandTotal100 || 0) > 0).length;
  const prepAverageScore = prepTotalAppeared > 0 
    ? (currentPrepRecords.reduce((acc, r) => acc + (r.grandTotal100 || 0), 0) / prepTotalAppeared).toFixed(1)
    : '0.0';
  const prepPassedCount = currentPrepRecords.filter(r => r.grade !== 'E' && (r.grandTotal100 || 0) > 0).length;
  const prepNeedsImprovementCount = currentPrepRecords.filter(r => r.grade === 'E' && (r.grandTotal100 || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Dev Mode Banner with Official Page Numbers */}
      {devMode && (
        <DevModeBadge
          pages={stage === 'foundational' ? 21 : (activeTerm === 1 ? 25 : 26)}
          title={
            stage === 'foundational'
              ? '21. Scholastic Assessment Record for Classes I & II (Module 21, Pages 13 & 14 - 8 Continuous Cycles)'
              : `26. Scholastic Assessment Record for Classes III to V - Term ${activeTerm} (Module ${activeTerm === 1 ? 25 : 26}, Page 22)`
          }
        />
      )}

      {/* Global Header & Stage Mode Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
              KVS Unified Ledger
            </span>
            {isSavedBanner && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold animate-pulse">
                <CheckCircle2 className="w-3 h-3" />
                <span>{savedMessage}</span>
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400 shrink-0" />
            <span>Scholastic Assessment Record</span>
          </h1>
          <p className="text-xs text-[var(--text-dim)] mt-0.5">
            Official KVS Primary Stage Evaluation (Classes I to V) with dual Foundational & Preparatory structures
          </p>
        </div>

        {/* Primary Stage Tabs */}
        <div className="bg-black/40 p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setStage('foundational')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              stage === 'foundational'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Foundational (Class 1 & 2)</span>
          </button>
          
          <button
            onClick={() => setStage('preparatory')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              stage === 'preparatory'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-200" />
            <span>Preparatory (Class 3 to 5)</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: FOUNDATIONAL STAGE (CLASSES I & II) LAYOUT                 */}
      {/* ==================================================================== */}
      {stage === 'foundational' && (
        <div className="space-y-5">
          {/* Official Attached Sheet Header Card */}
          <div className="bg-gradient-to-br from-amber-950/20 to-stone-900/40 border border-amber-500/30 p-6 rounded-2xl space-y-4">
            <div className="text-center border-b border-amber-500/20 pb-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
                (Spread in two adjoining pages with more columns)
              </span>
              <h2 className="text-xl font-extrabold text-amber-100 mt-1">
                21. शैक्षिक मूल्यांकन अभिलेख (कक्षा-1 एवं 2)
              </h2>
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                SCHOLASTIC ASSESSMENT RECORD FOR CLASSES - I & II
              </h3>
              <p className="text-xs text-amber-200/80 italic mt-1.5 bg-amber-500/10 py-1 px-3 rounded-lg inline-block border border-amber-500/20">
                Teacher is advised to maintain the detailed record of Scholastic assessment for all students. (Hard Copy)
              </p>
            </div>

            {/* Controls Bar for Class I & II */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end pt-1">
              <div>
                <label className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                  CLASS: <span className="text-white font-mono">{getFoundationalClassLabel()}</span>
                </label>
                <select
                  value={selectedClassI_II}
                  onChange={e => setSelectedClassI_II(e.target.value)}
                  className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                >
                  <option value="cls-1a">Class I - Section A</option>
                  <option value="cls-1b">Class I - Section B</option>
                  <option value="cls-2a">Class II - Section A</option>
                  <option value="cls-2b">Class II - Section B</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                  SEC: <span className="text-white font-mono">{selectedClassI_II.endsWith('b') ? 'B' : 'A'}</span>
                </label>
                <select
                  value={selectedClassI_II.endsWith('b') ? 'B' : 'A'}
                  onChange={e => {
                    const isB = e.target.value === 'B';
                    if (selectedClassI_II.includes('1')) setSelectedClassI_II(isB ? 'cls-1b' : 'cls-1a');
                    if (selectedClassI_II.includes('2')) setSelectedClassI_II(isB ? 'cls-2b' : 'cls-2a');
                  }}
                  className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">SUBJECT:</label>
                <select
                  value={selectedSubjectI_II}
                  onChange={e => setSelectedSubjectI_II(e.target.value)}
                  className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                >
                  <option value="sbj-p03">English (Primary)</option>
                  <option value="sbj-p04">Hindi (Primary)</option>
                  <option value="sbj-p02">Mathematics (Primary)</option>
                  <option value="sbj-p01">Environmental Studies / Activities</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Search Roster</label>
                <div className="relative mt-1">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by student name or roll..."
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-500/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleImportStudentsFromProfileI_II}
                  className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-300" />
                  <span>Import / Sync from Student Profiles</span>
                </button>

                <div className="bg-black/30 p-1 rounded-xl border border-white/10 flex items-center gap-1">
                  <button
                    onClick={() => setFoundationalViewMode('spread')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      foundationalViewMode === 'spread' ? 'bg-amber-500/30 text-amber-200 font-bold' : 'text-gray-400'
                    }`}
                  >
                    Spread View (Cycles 1-8)
                  </button>
                  <button
                    onClick={() => setFoundationalViewMode('single_cycle')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      foundationalViewMode === 'single_cycle' ? 'bg-amber-500/30 text-amber-200 font-bold' : 'text-gray-400'
                    }`}
                  >
                    Focused Cycle Rubric
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-300" />
                  <span>Print Two-Page Spread</span>
                </button>
              </div>
            </div>
          </div>

          {/* SPREAD VIEW: PAGE 1 (CYCLES 1-3) & PAGE 2 (CYCLES 4-8) */}
          {foundationalViewMode === 'spread' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    {/* Top Grouping Header */}
                    <tr className="bg-amber-950/40 text-amber-200 border-b border-amber-500/20 text-center font-bold">
                      <th className="py-2.5 px-3 border-r border-amber-500/20 w-12" rowSpan={2}>
                        S.No
                      </th>
                      <th className="py-2.5 px-4 border-r border-amber-500/20 text-left min-w-[200px]" rowSpan={2}>
                        Name of the Students
                      </th>
                      <th colSpan={3} className="py-2 px-3 border-r border-amber-500/20 bg-amber-900/30 text-amber-200 font-black tracking-wide">
                        PAGE 1: FIRST TERM CYCLES
                      </th>
                      <th colSpan={5} className="py-2 px-3 bg-amber-900/20 text-amber-300 font-black tracking-wide">
                        PAGE 2: SECOND TERM CYCLES
                      </th>
                      <th className="py-2.5 px-3 border-l border-amber-500/20 w-24" rowSpan={2}>
                        Competency Detail
                      </th>
                    </tr>
                    {/* Sub Headers for 8 Cycles */}
                    <tr className="bg-black/50 text-gray-300 border-b border-white/10 text-center text-[11px] font-semibold">
                      <th className="py-2 px-2 border-r border-white/10 w-20 text-amber-300">CYCLE 1</th>
                      <th className="py-2 px-2 border-r border-white/10 w-20 text-amber-300">CYCLE 2</th>
                      <th className="py-2 px-2 border-r border-amber-500/30 w-20 text-amber-300 bg-amber-500/10">CYCLE 3</th>
                      <th className="py-2 px-2 border-r border-white/10 w-20 text-orange-300">CYCLE 4</th>
                      <th className="py-2 px-2 border-r border-white/10 w-20 text-orange-300">CYCLE 5</th>
                      <th className="py-2 px-2 border-r border-white/10 w-20 text-orange-300">CYCLE 6</th>
                      <th className="py-2 px-2 border-r border-white/10 w-20 text-orange-300">CYCLE 7</th>
                      <th className="py-2 px-2 border-r border-white/10 w-20 text-orange-300">CYCLE 8</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {foundationalFilteredStudents.map((st, idx) => {
                      const rec = getRecordForFoundationalStudent(st.id);
                      const displayName = getStudentDisplayName(st.id, (st as any).name);
                      const rollOrSN = getStudentRollOrSN(st.id, idx);

                      return (
                        <tr key={st.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 border-r border-white/10 text-center text-gray-400 font-bold">
                            {rollOrSN}
                          </td>
                          <td className="py-2 px-4 border-r border-white/10 font-sans text-gray-200 font-medium">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white">{displayName}</span>
                              <span className="text-[10px] text-gray-500 font-mono ml-2">ID: {st.id.replace('std-', '')}</span>
                            </div>
                          </td>

                          {/* 8 Cycles inputs */}
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(cNum => {
                            const rating = getCycleRatingDisplay(rec, cNum);
                            return (
                              <td
                                key={cNum}
                                className={`py-1.5 px-2 border-r border-white/10 text-center ${
                                  cNum === 3 ? 'border-r-2 border-amber-500/40 bg-amber-500/5' : ''
                                }`}
                              >
                                <select
                                  value={rating === '-' ? '' : rating}
                                  onChange={e =>
                                    handleFoundationalCycleRatingChange(
                                      st.id,
                                      cNum,
                                      e.target.value as FoundationalCycleRating | ''
                                    )
                                  }
                                  className={`w-12 py-1 px-1 text-center font-bold rounded-lg text-xs transition-all ${
                                    rating === 'A'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : rating === 'B'
                                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                      : rating === 'C'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-black/40 text-gray-400 border border-white/10'
                                  }`}
                                >
                                  <option value="">-</option>
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="C">C</option>
                                </select>
                              </td>
                            );
                          })}

                          {/* Quick Rubric Details Button */}
                          <td className="py-2 px-3 text-center border-l border-white/10">
                            <button
                              onClick={() => setCompetencyModalStudentId(st.id)}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-sans font-semibold transition-all flex items-center justify-center gap-1 mx-auto"
                            >
                              <Sliders className="w-3 h-3" />
                              <span>Rubric</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {foundationalFilteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-gray-400 font-sans">
                          <Users className="w-8 h-8 text-amber-400/40 mx-auto mb-2" />
                          <p className="text-sm font-semibold">No students found in current roster filter</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Click "Import / Sync from Student Profiles" to pull student roster data into this register.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Qualitative Rating Legend */}
              <div className="bg-black/30 border border-white/10 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 font-sans font-semibold text-gray-300">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>Foundational 3-Point Qualitative Evaluation Scale:</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                      A
                    </span>
                    <span className="text-gray-300">Proficient / Concept Mastered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-[10px]">
                      B
                    </span>
                    <span className="text-gray-300">Developing / With Scaffolding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-[10px]">
                      C
                    </span>
                    <span className="text-gray-300">Needs Support / Remedial Attention</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FOCUSED SINGLE CYCLE VIEW WITH 8 TARGET COMPETENCIES */}
          {foundationalViewMode === 'single_cycle' && (
            <div className="space-y-4">
              {/* Cycle Picker Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-2 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-amber-300 px-3 uppercase tracking-wide">Select Cycle:</span>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(c => (
                  <button
                    key={c}
                    onClick={() => setActiveCycle(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeCycle === c
                        ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/20'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    Cycle {c}
                  </button>
                ))}
              </div>

              {/* Table with all 8 foundational competencies */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-amber-950/40 text-amber-200 border-b border-amber-500/20 text-center font-bold">
                      <th className="py-2.5 px-3 border-r border-amber-500/20 w-12" rowSpan={2}>S.No</th>
                      <th className="py-2.5 px-4 border-r border-amber-500/20 text-left min-w-[180px]" rowSpan={2}>Student Name</th>
                      <th colSpan={3} className="py-1.5 px-2 border-r border-amber-500/20 bg-indigo-950/40 text-indigo-300">
                        Language & Phonics
                      </th>
                      <th colSpan={3} className="py-1.5 px-2 border-r border-amber-500/20 bg-purple-950/40 text-purple-300">
                        Foundational Numeracy
                      </th>
                      <th colSpan={2} className="py-1.5 px-2 bg-emerald-950/40 text-emerald-300">
                        Aesthetic & Socio-Emotional
                      </th>
                    </tr>
                    <tr className="bg-black/50 text-gray-300 border-b border-white/10 text-center text-[10px]">
                      <th className="py-2 px-1 border-r border-white/10 w-24">Listening</th>
                      <th className="py-2 px-1 border-r border-white/10 w-24">Speaking</th>
                      <th className="py-2 px-1 border-r border-amber-500/20 w-24">Reading</th>
                      <th className="py-2 px-1 border-r border-white/10 w-24">Number Sense</th>
                      <th className="py-2 px-1 border-r border-white/10 w-24">Operations</th>
                      <th className="py-2 px-1 border-r border-amber-500/20 w-24">Shapes</th>
                      <th className="py-2 px-1 border-r border-white/10 w-24">Expression</th>
                      <th className="py-2 px-1 w-24">Social Habits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {foundationalFilteredStudents.map((st, idx) => {
                      const rec = getRecordForFoundationalStudent(st.id);
                      const cycleRatings = rec.cycleRatings?.[activeCycle] || {};
                      const displayName = getStudentDisplayName(st.id, (st as any).name);
                      const rollOrSN = getStudentRollOrSN(st.id, idx);

                      return (
                        <tr key={st.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 border-r border-white/10 text-center text-gray-400 font-bold">{rollOrSN}</td>
                          <td className="py-2 px-4 border-r border-white/10 font-sans text-gray-200 font-medium">
                            <span className="font-semibold text-white">{displayName}</span>
                          </td>

                          {FOUNDATIONAL_COMPETENCY_FIELDS.map(comp => {
                            const val = (cycleRatings as any)[comp.key] || '';
                            return (
                              <td key={comp.key} className="py-1 px-1 border-r border-white/10 text-center">
                                <select
                                  value={val}
                                  onChange={e =>
                                    handleFoundationalCompetencyRating(
                                      st.id,
                                      activeCycle,
                                      comp.key,
                                      e.target.value as FoundationalCycleRating
                                    )
                                  }
                                  className={`w-12 py-1 px-1 text-center font-bold rounded-lg text-xs ${
                                    val === 'A'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : val === 'B'
                                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                      : val === 'C'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-black/40 text-gray-400 border border-white/10'
                                  }`}
                                >
                                  <option value="">-</option>
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="C">C</option>
                                </select>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 2: PREPARATORY STAGE (CLASSES III TO V) LAYOUT                */}
      {/* ==================================================================== */}
      {stage === 'preparatory' && (
        <div className="space-y-5">
          {/* Official Attached Sheet Header Card matching PDF Page 22 */}
          <div className="bg-gradient-to-br from-indigo-950/30 to-purple-950/20 border border-indigo-500/30 p-6 rounded-2xl space-y-4">
            <div className="text-center border-b border-indigo-500/20 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                  26. शैक्षिक मूल्यांकन अभिलेख (कक्षा- 3 से 5)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  8 page format
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                SCHOLASTIC ASSESSMENT RECORD FOR CLASSES- III to V
              </h2>
              
              {/* Term 1 vs Term 2 Selector */}
              <div className="inline-flex items-center bg-black/50 p-1.5 rounded-xl border border-indigo-500/30 mt-3">
                <button
                  onClick={() => setActiveTerm(1)}
                  className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTerm === 1
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  TERM - 1
                </button>
                <button
                  onClick={() => setActiveTerm(2)}
                  className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTerm === 2
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  TERM - 2
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end pt-1">
              <div>
                <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                  CLASS: <span className="text-white font-mono">{getPreparatoryClassLabel()}</span>
                </label>
                <select
                  value={selectedClassIII_V}
                  onChange={e => setSelectedClassIII_V(e.target.value)}
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
                  SEC: <span className="text-white font-mono">{selectedClassIII_V.endsWith('b') ? 'B' : 'A'}</span>
                </label>
                <select
                  value={selectedClassIII_V.endsWith('b') ? 'B' : 'A'}
                  onChange={e => {
                    const isB = e.target.value === 'B';
                    if (selectedClassIII_V.includes('3')) setSelectedClassIII_V(isB ? 'cls-3b' : 'cls-3a');
                    if (selectedClassIII_V.includes('4')) setSelectedClassIII_V(isB ? 'cls-4b' : 'cls-4a');
                    if (selectedClassIII_V.includes('5')) setSelectedClassIII_V(isB ? 'cls-5b' : 'cls-5a');
                  }}
                  className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">SUBJECT:</label>
                <select
                  value={selectedSubjectIII_V}
                  onChange={e => setSelectedSubjectIII_V(e.target.value)}
                  className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                >
                  <option value="sbj-p02">Mathematics (Primary)</option>
                  <option value="sbj-p01">Environmental Studies (EVS)</option>
                  <option value="sbj-p03">English (Primary)</option>
                  <option value="sbj-p04">Hindi (Primary)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Search Student</label>
                <div className="relative mt-1">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by student name or roll..."
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-indigo-500/10">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleImportStudentsFromProfileIII_V}
                  className="px-3.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Import / Sync from Student Profiles</span>
                </button>

                <button
                  onClick={handlePullFromNotebookAndSea}
                  className="px-3.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>Pull from Notebook (22) & SEA (23)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-300" />
                  <span>Print Hard Copy</span>
                </button>
              </div>
            </div>
          </div>

          {/* EXACT TABLE STRUCTURE MATCHING PDF PAGE 22 OCR & SCREENSHOT */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
            <table className="w-full text-xs text-left border-collapse min-w-[980px]">
              <thead>
                {/* Header Row 1 */}
                <tr className="bg-indigo-950/60 text-indigo-100 border-b border-indigo-500/30 text-center font-bold">
                  <th className="py-3 px-3 border-r border-indigo-500/20 w-12" rowSpan={2}>
                    S.NO.
                  </th>
                  <th className="py-3 px-4 border-r border-indigo-500/20 text-left min-w-[200px]" rowSpan={2}>
                    NAME OF STUDENT
                  </th>
                  <th colSpan={3} className="py-2 px-2 border-r border-indigo-500/20 bg-indigo-900/40 text-indigo-200 font-extrabold">
                    PERIODIC TEST
                  </th>
                  <th className="py-3 px-2 border-r border-indigo-500/20 w-16 bg-purple-950/30" rowSpan={2}>
                    MDP
                  </th>
                  <th className="py-3 px-2 border-r border-indigo-500/20 w-24 bg-blue-950/30 text-[11px]" rowSpan={2}>
                    NOTEBOOK<br />SUBMISSION
                  </th>
                  <th className="py-3 px-2 border-r border-indigo-500/20 w-24 bg-teal-950/30 text-[11px]" rowSpan={2}>
                    SUBJECT<br />ENRICHMENT
                  </th>
                  <th colSpan={3} className="py-2 px-2 border-r border-indigo-500/20 bg-emerald-950/40 text-emerald-200 font-extrabold">
                    SEE
                  </th>
                  <th className="py-3 px-3 border-r border-indigo-500/20 w-20 bg-black/60 font-black" rowSpan={2}>
                    GRAND<br />TOTAL
                  </th>
                  <th className="py-3 px-3 w-16 bg-black/60 font-black" rowSpan={2}>
                    GRADE
                  </th>
                </tr>

                {/* Header Row 2: Sub-columns and max marks */}
                <tr className="bg-black/60 text-gray-300 border-b border-white/10 text-center text-[10px] font-mono">
                  {/* Periodic Test sub-columns */}
                  <th className="py-2 px-2 border-r border-white/10 w-14">
                    ORAL<br /><span className="text-indigo-400 font-bold">10</span>
                  </th>
                  <th className="py-2 px-2 border-r border-white/10 w-16">
                    PEN<br />PAPER<br /><span className="text-indigo-400 font-bold">30</span>
                  </th>
                  <th className="py-2 px-2 border-r border-indigo-500/20 w-20 bg-indigo-500/10 text-white font-bold">
                    TOTAL<br /><span className="text-amber-300">40 (10)</span>
                  </th>

                  {/* Single column max marks note in header 2 */}
                  {/* MDP Max */}
                  {/* NB Max: 20 (5) */}
                  {/* SEA Max: 20 (5) */}

                  {/* SEE sub-columns */}
                  <th className="py-2 px-2 border-r border-white/10 w-14">
                    ORAL<br /><span className="text-emerald-400 font-bold">20</span>
                  </th>
                  <th className="py-2 px-2 border-r border-white/10 w-16">
                    PEN<br />PAPER<br /><span className="text-emerald-400 font-bold">40</span>
                  </th>
                  <th className="py-2 px-2 border-r border-indigo-500/20 w-16 bg-emerald-500/10 text-white font-bold">
                    TOTAL<br /><span className="text-emerald-300">60</span>
                  </th>
                </tr>

                {/* Official scaling sub-header matching PDF Page 22 row */}
                <tr className="bg-indigo-950/20 text-gray-400 text-center text-[10px] font-mono border-b border-white/10">
                  <td colSpan={2} className="py-1 px-3 border-r border-white/10 text-right font-sans font-bold text-gray-300">
                    Max Marks:
                  </td>
                  <td className="py-1 px-1 border-r border-white/10 text-indigo-300 font-bold">10</td>
                  <td className="py-1 px-1 border-r border-white/10 text-indigo-300 font-bold">30</td>
                  <td className="py-1 px-1 border-r border-indigo-500/20 text-amber-300 font-black bg-indigo-500/10">40 (10)</td>
                  <td className="py-1 px-1 border-r border-indigo-500/20 text-purple-300 font-bold">20</td>
                  <td className="py-1 px-1 border-r border-indigo-500/20 text-blue-300 font-bold">20 (5)</td>
                  <td className="py-1 px-1 border-r border-indigo-500/20 text-teal-300 font-bold">20 (5)</td>
                  <td className="py-1 px-1 border-r border-white/10 text-emerald-300 font-bold">20</td>
                  <td className="py-1 px-1 border-r border-white/10 text-emerald-300 font-bold">40</td>
                  <td className="py-1 px-1 border-r border-indigo-500/20 text-emerald-300 font-black bg-emerald-500/10">60</td>
                  <td className="py-1 px-1 border-r border-white/10 text-white font-black bg-black/40">100</td>
                  <td className="py-1 px-1 text-gray-300 font-bold bg-black/40">-</td>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {preparatoryFilteredStudents.map((st, idx) => {
                  const rec = getRecordForPreparatoryStudent(st.id);
                  const displayName = getStudentDisplayName(st.id, (st as any).name);
                  const rollOrSN = getStudentRollOrSN(st.id, idx);

                  const ptOral = rec.ptOral ?? 0;
                  const ptPenPaper = rec.ptPenPaper ?? 0;
                  const ptTotal40 = rec.ptTotal40 ?? (ptOral + ptPenPaper);
                  const ptScaled10 = rec.ptScaled10 ?? rec.periodicTest ?? Number((ptTotal40 / 4).toFixed(1));

                  const mdp = rec.mdp20 ?? rec.mdp ?? 0;
                  const nbRaw = rec.notebookRaw20 ?? (rec.notebook ? rec.notebook * 4 : 0);
                  const nbScaled = rec.notebookScaled5 ?? rec.notebook ?? Number((nbRaw / 4).toFixed(1));

                  const seaRaw = rec.seaRaw20 ?? (rec.sea ? rec.sea * 4 : 0);
                  const seaScaled = rec.seaScaled5 ?? rec.sea ?? Number((seaRaw / 4).toFixed(1));

                  const seeOral = rec.seeOral ?? 0;
                  const seePenPaper = rec.seePenPaper ?? 0;
                  const seeTotal60 = rec.seeTotal60 ?? (seeOral + seePenPaper);

                  const grandTotal = rec.grandTotal100 ?? rec.total ?? Number((ptScaled10 + mdp + nbScaled + seaScaled + seeTotal60).toFixed(1));
                  const grade = rec.grade || calculateGrade(grandTotal);

                  return (
                    <tr key={st.id} className="hover:bg-white/5 transition-colors">
                      {/* S.NO */}
                      <td className="py-2 px-3 border-r border-white/10 text-center text-gray-400 font-bold">
                        {rollOrSN}
                      </td>

                      {/* NAME OF STUDENT */}
                      <td className="py-2 px-4 border-r border-white/10 font-sans text-gray-200 font-medium">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{displayName}</span>
                          <span className="text-[10px] text-gray-500 font-mono ml-2">ID: {st.id.replace('std-', '')}</span>
                        </div>
                      </td>

                      {/* PERIODIC TEST: ORAL (10) */}
                      <td className="py-1.5 px-1 border-r border-white/10 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={ptOral === 0 ? '' : ptOral}
                          onChange={e =>
                            handlePreparatoryScoreChange(st.id, {
                              ptOral: parseFloat(e.target.value) || 0
                            })
                          }
                          placeholder="0"
                          className="w-12 py-1 px-1 text-center bg-black/40 border border-white/10 rounded-lg text-xs text-indigo-200 font-bold focus:border-indigo-400 focus:outline-none"
                        />
                      </td>

                      {/* PERIODIC TEST: PEN PAPER (30) */}
                      <td className="py-1.5 px-1 border-r border-white/10 text-center">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          step="0.5"
                          value={ptPenPaper === 0 ? '' : ptPenPaper}
                          onChange={e =>
                            handlePreparatoryScoreChange(st.id, {
                              ptPenPaper: parseFloat(e.target.value) || 0
                            })
                          }
                          placeholder="0"
                          className="w-12 py-1 px-1 text-center bg-black/40 border border-white/10 rounded-lg text-xs text-indigo-200 font-bold focus:border-indigo-400 focus:outline-none"
                        />
                      </td>

                      {/* PERIODIC TEST: TOTAL 40 (10) [Calculated] */}
                      <td className="py-1.5 px-2 border-r border-indigo-500/20 text-center bg-indigo-950/30">
                        <div className="font-bold text-amber-300 text-xs">
                          {ptScaled10}{' '}
                          <span className="text-[10px] text-gray-400 font-normal">({ptTotal40})</span>
                        </div>
                      </td>

                      {/* MDP (20) */}
                      <td className="py-1.5 px-1 border-r border-indigo-500/20 text-center bg-purple-950/20">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={mdp === 0 ? '' : mdp}
                          onChange={e =>
                            handlePreparatoryScoreChange(st.id, {
                              mdp20: parseFloat(e.target.value) || 0
                            })
                          }
                          placeholder="0"
                          className="w-12 py-1 px-1 text-center bg-black/40 border border-purple-500/30 rounded-lg text-xs text-purple-200 font-bold focus:border-purple-400 focus:outline-none"
                        />
                      </td>

                      {/* NOTEBOOK SUBMISSION 20 (5) */}
                      <td className="py-1.5 px-1 border-r border-indigo-500/20 text-center bg-blue-950/20">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={nbRaw === 0 ? '' : nbRaw}
                            onChange={e =>
                              handlePreparatoryScoreChange(st.id, {
                                notebookRaw20: parseFloat(e.target.value) || 0
                              })
                            }
                            placeholder="0"
                            className="w-11 py-1 px-1 text-center bg-black/40 border border-blue-500/30 rounded-lg text-xs text-blue-200 font-bold focus:border-blue-400 focus:outline-none"
                          />
                          <span className="text-[10px] text-blue-300 font-bold">({nbScaled})</span>
                        </div>
                      </td>

                      {/* SUBJECT ENRICHMENT 20 (5) */}
                      <td className="py-1.5 px-1 border-r border-indigo-500/20 text-center bg-teal-950/20">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={seaRaw === 0 ? '' : seaRaw}
                            onChange={e =>
                              handlePreparatoryScoreChange(st.id, {
                                seaRaw20: parseFloat(e.target.value) || 0
                              })
                            }
                            placeholder="0"
                            className="w-11 py-1 px-1 text-center bg-black/40 border border-teal-500/30 rounded-lg text-xs text-teal-200 font-bold focus:border-teal-400 focus:outline-none"
                          />
                          <span className="text-[10px] text-teal-300 font-bold">({seaScaled})</span>
                        </div>
                      </td>

                      {/* SEE: ORAL (20) */}
                      <td className="py-1.5 px-1 border-r border-white/10 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={seeOral === 0 ? '' : seeOral}
                          onChange={e =>
                            handlePreparatoryScoreChange(st.id, {
                              seeOral: parseFloat(e.target.value) || 0
                            })
                          }
                          placeholder="0"
                          className="w-12 py-1 px-1 text-center bg-black/40 border border-white/10 rounded-lg text-xs text-emerald-200 font-bold focus:border-emerald-400 focus:outline-none"
                        />
                      </td>

                      {/* SEE: PEN PAPER (40) */}
                      <td className="py-1.5 px-1 border-r border-white/10 text-center">
                        <input
                          type="number"
                          min="0"
                          max="40"
                          step="0.5"
                          value={seePenPaper === 0 ? '' : seePenPaper}
                          onChange={e =>
                            handlePreparatoryScoreChange(st.id, {
                              seePenPaper: parseFloat(e.target.value) || 0
                            })
                          }
                          placeholder="0"
                          className="w-12 py-1 px-1 text-center bg-black/40 border border-white/10 rounded-lg text-xs text-emerald-200 font-bold focus:border-emerald-400 focus:outline-none"
                        />
                      </td>

                      {/* SEE: TOTAL 60 [Calculated] */}
                      <td className="py-1.5 px-2 border-r border-indigo-500/20 text-center bg-emerald-950/30">
                        <span className="font-bold text-emerald-300 text-xs">{seeTotal60}</span>
                      </td>

                      {/* GRAND TOTAL (100) */}
                      <td className="py-2 px-3 border-r border-indigo-500/20 text-center bg-black/40">
                        <span className="font-black text-white text-sm tracking-tight">{grandTotal}</span>
                      </td>

                      {/* GRADE */}
                      <td className="py-2 px-2 text-center bg-black/40">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-black border font-sans ${getGradeBadgeColor(
                            grade
                          )}`}
                        >
                          {grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {preparatoryFilteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-gray-400 font-sans">
                      <Users className="w-8 h-8 text-indigo-400/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No student records found in selected class</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Click "Import / Sync from Student Profiles" to pull student roster data into this register.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Preparatory Stage Class Summary Statistics (Module 27 Alignment) */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-black/40 border border-indigo-500/20 p-4 rounded-2xl">
            <div className="text-xs font-bold text-indigo-300 mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span>Term {activeTerm} Scholastic Result Summary & Grade Spectrum (Classes III-V)</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-center">
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Students on Roll</span>
                <p className="text-lg font-black text-white mt-0.5">{preparatoryFilteredStudents.length}</p>
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Evaluated</span>
                <p className="text-lg font-black text-indigo-300 mt-0.5">{prepTotalAppeared}</p>
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Class Average</span>
                <p className="text-lg font-black text-amber-300 mt-0.5">{prepAverageScore}%</p>
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Passed / Qualified</span>
                <p className="text-lg font-black text-emerald-400 mt-0.5">{prepPassedCount}</p>
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Needs Support (E)</span>
                <p className="text-lg font-black text-red-400 mt-0.5">{prepNeedsImprovementCount}</p>
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Pass Rate</span>
                <p className="text-lg font-black text-teal-300 mt-0.5">
                  {prepTotalAppeared > 0 ? Math.round((prepPassedCount / prepTotalAppeared) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* COMPETENCY DETAIL MODAL (FOR FOUNDATIONAL STAGE)                     */}
      {/* ==================================================================== */}
      {competencyModalStudentId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400">
                  Qualitative Competencies Rubric
                </span>
                <h3 className="text-lg font-bold text-white">
                  {getStudentDisplayName(competencyModalStudentId)} — Cycle {activeCycle}
                </h3>
              </div>
              <button
                onClick={() => setCompetencyModalStudentId(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cycle Selector within modal */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/10">
              <span className="text-xs text-gray-400 font-semibold px-2">Cycle:</span>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCycle(c)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    activeCycle === c ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Competency rows */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {FOUNDATIONAL_COMPETENCY_FIELDS.map(comp => {
                const rec = getRecordForFoundationalStudent(competencyModalStudentId);
                const currentRating = (rec.cycleRatings?.[activeCycle] as any)?.[comp.key] || '';

                return (
                  <div
                    key={comp.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div>
                      <span className="text-[10px] font-semibold text-amber-300 uppercase">{comp.domain}</span>
                      <h4 className="text-xs font-bold text-white">{comp.label}</h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(['A', 'B', 'C'] as FoundationalCycleRating[]).map(rt => (
                        <button
                          key={rt}
                          onClick={() =>
                            handleFoundationalCompetencyRating(
                              competencyModalStudentId,
                              activeCycle,
                              comp.key,
                              rt
                            )
                          }
                          className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                            currentRating === rt
                              ? rt === 'A'
                                ? 'bg-emerald-500 text-white font-black shadow-lg'
                                : rt === 'B'
                                ? 'bg-blue-500 text-white font-black shadow-lg'
                                : 'bg-amber-500 text-white font-black shadow-lg'
                              : 'bg-black/40 text-gray-400 hover:text-white border border-white/10'
                          }`}
                        >
                          {rt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setCompetencyModalStudentId(null)}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all"
              >
                Close & Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
