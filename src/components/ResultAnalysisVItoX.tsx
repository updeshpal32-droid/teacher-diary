import React, { useState, useEffect, useMemo } from 'react';
import {
  ResultAnalysisClass6_10,
  ScholasticScoreRecordVItoVIII,
  ScholasticScoreRecordIXtoX,
  ClassXMarksRecord17f,
  StudentProfile,
  ClassSection,
  SubjectItem
} from '../types/academic';
import {
  db,
  DEFAULT_RESULT_ANALYSIS_VI_X,
  DEFAULT_SCHOLASTIC_SCORES_VI_VIII,
  DEFAULT_SCHOLASTIC_SCORES_IX_X,
  DEFAULT_CLASS_X_MARKS_17F,
  DEFAULT_STUDENTS,
  DEFAULT_CLASSES,
  DEFAULT_SUBJECTS
} from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  TrendingUp,
  Award,
  BarChart3,
  Sparkles,
  Printer,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  PieChart,
  ArrowRightLeft,
  Info,
  Check,
  Percent,
  SlidersHorizontal,
  ChevronDown,
  Download,
  Upload,
  AlertTriangle,
  BookOpen,
  Users
} from 'lucide-react';

interface ResultAnalysisVItoXProps {
  devMode: boolean;
}

const EXAM_OPTIONS = [
  { id: 'UT', label: 'Unit Test (UT)' },
  { id: 'MT', label: 'Monthly Test (MT)' },
  { id: 'HY', label: 'Half Yearly (HY)' },
  { id: 'PB', label: 'Pre-Board (PB)' },
  { id: 'SEE', label: 'Session Ending Exam (SEE)' },
  { id: 'PT-1', label: 'Periodic Test 1 (PT-1)' },
  { id: 'PT-2', label: 'Periodic Test 2 (PT-2)' },
  { id: 'PT-3', label: 'Periodic Test 3 (PT-3)' }
];

const SUBJECT_OPTIONS = [
  { id: 'sbj-02', name: 'Mathematics' },
  { id: 'sbj-03', name: 'Science' },
  { id: 'sbj-04', name: 'Social Science' },
  { id: 'sbj-01', name: 'English' },
  { id: 'sbj-05', name: 'Hindi' },
  { id: 'sbj-06', name: 'Sanskrit' }
];

const CLASS_OPTIONS = [
  { id: 'cls-6a', name: 'Class VI-A' },
  { id: 'cls-6b', name: 'Class VI-B' },
  { id: 'cls-7a', name: 'Class VII-A' },
  { id: 'cls-7b', name: 'Class VII-B' },
  { id: 'cls-8a', name: 'Class VIII-A' },
  { id: 'cls-8b', name: 'Class VIII-B' },
  { id: 'cls-9a', name: 'Class IX-A' },
  { id: 'cls-9b', name: 'Class IX-B' },
  { id: 'cls-10a', name: 'Class X-A' },
  { id: 'cls-10b', name: 'Class X-B' }
];

export default function ResultAnalysisVItoX({ devMode }: ResultAnalysisVItoXProps) {
  const [records, setRecords] = useState<ResultAnalysisClass6_10[]>([]);
  const [scoresVI_VIII, setScoresVI_VIII] = useState<ScholasticScoreRecordVItoVIII[]>([]);
  const [scoresIX_X, setScoresIX_X] = useState<ScholasticScoreRecordIXtoX[]>([]);
  const [scoresClassX_17F, setScoresClassX_17F] = useState<ClassXMarksRecord17f[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  // Filter States
  const [examFilter, setExamFilter] = useState<string>('All');
  const [classFilter, setClassFilter] = useState<string>('All');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [pageFilter, setPageFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'register' | 'charts' | 'range_key'>('register');

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Partial<ResultAnalysisClass6_10> | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedRA = (await db.get<ResultAnalysisClass6_10[]>('setup:result_analysis_vi_x')) || DEFAULT_RESULT_ANALYSIS_VI_X;
    const savedVI_VIII = (await db.get<ScholasticScoreRecordVItoVIII[]>('setup:scholastic_scores_vi_viii')) || DEFAULT_SCHOLASTIC_SCORES_VI_VIII;
    const savedIX_X = (await db.get<ScholasticScoreRecordIXtoX[]>('setup:scholastic_scores_ix_x')) || DEFAULT_SCHOLASTIC_SCORES_IX_X;
    const saved17F = (await db.get<ClassXMarksRecord17f[]>('setup:class_x_marks_17f')) || DEFAULT_CLASS_X_MARKS_17F;
    const savedStd = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    const savedCls = (await db.get<ClassSection[]>('setup:classes')) || DEFAULT_CLASSES;
    const savedSbj = (await db.get<SubjectItem[]>('setup:subjects')) || DEFAULT_SUBJECTS;

    setRecords(savedRA);
    setScoresVI_VIII(savedVI_VIII);
    setScoresIX_X(savedIX_X);
    setScoresClassX_17F(saved17F);
    setStudents(savedStd);
    setClasses(savedCls);
    setSubjects(savedSbj);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Performance Index (PI) Calculation for Secondary Range Brackets
  // Weights: 90%+ = 100, 75-90% = 82.5, 60-75% = 67.5, 45-60% = 52.5, 33-45% = 39, <33% = 0
  const calculatePI = (
    r33_45: number,
    r45_60: number,
    r60_75: number,
    r75_90: number,
    r90_plus: number,
    totalAppeared: number
  ): number => {
    if (!totalAppeared || totalAppeared <= 0) return 0;
    const weightedSum =
      (r90_plus || 0) * 100 +
      (r75_90 || 0) * 82.5 +
      (r60_75 || 0) * 67.5 +
      (r45_60 || 0) * 52.5 +
      (r33_45 || 0) * 39.0;
    return Number((weightedSum / totalAppeared).toFixed(1));
  };

  // Filtered analysis records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (examFilter !== 'All' && r.exam !== examFilter && !r.exam.includes(examFilter)) return false;
      if (classFilter !== 'All' && r.className !== classFilter && r.classSectionId !== classFilter) return false;
      if (subjectFilter !== 'All' && r.subjectName !== subjectFilter && r.subjectId !== subjectFilter) return false;
      if (pageFilter !== 'All' && String(r.pageNo) !== pageFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchExam = (r.exam || '').toLowerCase().includes(q);
        const matchSub = (r.subjectName || '').toLowerCase().includes(q);
        const matchCls = (r.className || '').toLowerCase().includes(q);
        const matchRem = (r.remarks || '').toLowerCase().includes(q);
        if (!matchExam && !matchSub && !matchCls && !matchRem) return false;
      }
      return true;
    });
  }, [records, examFilter, classFilter, subjectFilter, pageFilter, searchQuery]);

  // Modal open for New Entry
  const handleOpenNew = () => {
    setEditingItem({
      id: `ra-vix-${Date.now()}`,
      pageNo: pageFilter !== 'All' ? Number(pageFilter) : 1,
      exam: examFilter !== 'All' ? examFilter : 'UT',
      subjectName: subjectFilter !== 'All' ? subjectFilter : 'Mathematics',
      className: classFilter !== 'All' ? classFilter : 'Class VI-A',
      studentsOnRoll: 40,
      appeared: 40,
      qualified: 38,
      needsImprovement: 2,
      passPercentage: 95.0,
      range33to45: 4,
      range45to60: 8,
      range60to75: 14,
      range75to90: 8,
      range90Above: 4,
      classAverage: 72.0,
      performanceIndex: 72.5,
      highestScore: 98,
      lowestScore: 24,
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ResultAnalysisClass6_10) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    await db.set('setup:result_analysis_vi_x', updated);
    showNotification('Record removed successfully.');
  };

  const handleResetDefaults = async () => {
    setRecords(DEFAULT_RESULT_ANALYSIS_VI_X);
    await db.set('setup:result_analysis_vi_x', DEFAULT_RESULT_ANALYSIS_VI_X);
    showNotification('Reset to official KVS exemplar analysis records.');
  };

  const handleSaveModal = async () => {
    if (!editingItem || !editingItem.exam || !editingItem.subjectName || !editingItem.className) return;

    const r33_45 = Number(editingItem.range33to45) || 0;
    const r45_60 = Number(editingItem.range45to60) || 0;
    const r60_75 = Number(editingItem.range60to75) || 0;
    const r75_90 = Number(editingItem.range75to90) || 0;
    const r90_plus = Number(editingItem.range90Above) || 0;

    const sumQualified = r33_45 + r45_60 + r60_75 + r75_90 + r90_plus;
    const needsImp = Number(editingItem.needsImprovement) || 0;
    const appeared = Number(editingItem.appeared) || (sumQualified + needsImp) || 40;
    const onRoll = Number(editingItem.studentsOnRoll) || appeared || 40;
    const passPct = appeared > 0 ? Number(((sumQualified / appeared) * 100).toFixed(1)) : 100.0;
    const pi = calculatePI(r33_45, r45_60, r60_75, r75_90, r90_plus, appeared);

    const savedRecord: ResultAnalysisClass6_10 = {
      id: editingItem.id || `ra-vix-${Date.now()}`,
      pageNo: Number(editingItem.pageNo) || 1,
      exam: editingItem.exam,
      subjectName: editingItem.subjectName,
      subjectId: editingItem.subjectId,
      className: editingItem.className,
      classSectionId: editingItem.classSectionId,
      studentsOnRoll: onRoll,
      totalOnRoll: onRoll,
      appeared: appeared,
      totalAppeared: appeared,
      qualified: sumQualified,
      passed: sumQualified,
      needsImprovement: needsImp,
      passPercentage: passPct,
      qualifiedPercentage: passPct,
      range33to45: r33_45,
      range45to60: r45_60,
      range60to75: r60_75,
      range75to90: r75_90,
      range90Above: r90_plus,
      classAverage: Number(editingItem.classAverage) || 72.0,
      performanceIndex: pi,
      pi: pi,
      highestScore: Number(editingItem.highestScore) || 98,
      lowestScore: Number(editingItem.lowestScore) || 25,
      remarks: editingItem.remarks || ''
    };

    const existsIdx = records.findIndex(r => r.id === savedRecord.id);
    let updatedList: ResultAnalysisClass6_10[];
    if (existsIdx >= 0) {
      updatedList = [...records];
      updatedList[existsIdx] = savedRecord;
    } else {
      updatedList = [...records, savedRecord];
    }

    setRecords(updatedList);
    await db.set('setup:result_analysis_vi_x', updatedList);
    setIsModalOpen(false);
    setEditingItem(null);
    showNotification('18(a) Result Analysis row saved successfully.');
  };

  // Auto-sync / aggregate directly from Scholastic Assessment Records (17a & 17d)
  const handleAutoGenerateFromScholastic = async (examType: 'UT' | 'HY' | 'SEE' | 'PB') => {
    let generatedCount = 0;
    let updatedRecords = [...records];

    // 1. Process Middle Classes (VI-VIII)
    CLASS_OPTIONS.filter(c => c.id.startsWith('cls-6') || c.id.startsWith('cls-7') || c.id.startsWith('cls-8')).forEach(cls => {
      SUBJECT_OPTIONS.forEach(sbj => {
        const clsRoman = cls.id.includes('6') ? 'VI' : (cls.id.includes('7') ? 'VII' : 'VIII');
        const secLetter = cls.id.endsWith('b') ? 'B' : 'A';

        const matchingScores = scoresVI_VIII.filter(s => {
          const matchSub = (s.subjectName || '').toLowerCase().includes(sbj.name.toLowerCase()) || sbj.name.toLowerCase().includes((s.subjectName || '').toLowerCase());
          const matchCls = (s.className === clsRoman || s.className === cls.name || s.className.includes(clsRoman)) && (s.section === secLetter || !s.section);
          return matchSub && matchCls;
        });

        if (matchingScores.length > 0) {
          let rLessThan33 = 0;
          let r33_45 = 0;
          let r45_60 = 0;
          let r60_75 = 0;
          let r75_90 = 0;
          let r90_plus = 0;
          let totalScoreSum = 0;
          let maxScore = 0;
          let minScore = 100;

          matchingScores.forEach(sc => {
            let percentage = 0;
            if (examType === 'UT') {
              const ptVal = sc.pt1 ?? sc.pt2 ?? 7;
              percentage = (ptVal / 10) * 100;
            } else if (examType === 'HY') {
              percentage = sc.halfYearly !== null && sc.halfYearly !== undefined ? (sc.halfYearly / 80) * 100 : (sc.percentage || 70);
            } else if (examType === 'SEE') {
              percentage = sc.percentage || (sc.totalMarks / 100) * 100 || 75;
            } else {
              percentage = sc.percentage || 70;
            }

            percentage = Math.min(100, Math.max(0, percentage));
            totalScoreSum += percentage;
            if (percentage > maxScore) maxScore = percentage;
            if (percentage < minScore) minScore = percentage;

            if (percentage < 33) rLessThan33++;
            else if (percentage < 45) r33_45++;
            else if (percentage < 60) r45_60++;
            else if (percentage < 75) r60_75++;
            else if (percentage < 90) r75_90++;
            else r90_plus++;
          });

          const totalAppeared = matchingScores.length;
          const qualifiedCount = totalAppeared - rLessThan33;
          const passPct = totalAppeared > 0 ? Number(((qualifiedCount / totalAppeared) * 100).toFixed(1)) : 100;
          const avgScore = totalAppeared > 0 ? Number((totalScoreSum / totalAppeared).toFixed(1)) : 70;
          const pi = calculatePI(r33_45, r45_60, r60_75, r75_90, r90_plus, totalAppeared);

          const pageNum = examType === 'UT' ? 1 : (examType === 'HY' ? 2 : (examType === 'PB' ? 3 : 4));
          const newId = `ra-vix-${cls.id}-${sbj.id}-${examType.toLowerCase()}`;

          const newEntry: ResultAnalysisClass6_10 = {
            id: newId,
            pageNo: pageNum,
            exam: examType,
            subjectName: sbj.name,
            subjectId: sbj.id,
            className: cls.name,
            classSectionId: cls.id,
            studentsOnRoll: totalAppeared,
            totalOnRoll: totalAppeared,
            appeared: totalAppeared,
            totalAppeared: totalAppeared,
            qualified: qualifiedCount,
            passed: qualifiedCount,
            needsImprovement: rLessThan33,
            passPercentage: passPct,
            qualifiedPercentage: passPct,
            range33to45: r33_45,
            range45to60: r45_60,
            range60to75: r60_75,
            range75to90: r75_90,
            range90Above: r90_plus,
            classAverage: avgScore,
            performanceIndex: pi,
            pi: pi,
            highestScore: Math.round(maxScore),
            lowestScore: Math.round(minScore),
            remarks: `Auto-aggregated from Module 17(a) Scholastic Ledger (${matchingScores.length} students).`
          };

          const existingIdx = updatedRecords.findIndex(r => r.id === newId);
          if (existingIdx >= 0) {
            updatedRecords[existingIdx] = newEntry;
          } else {
            updatedRecords.push(newEntry);
          }
          generatedCount++;
        }
      });
    });

    // 2. Process Secondary Classes (IX-X)
    CLASS_OPTIONS.filter(c => c.id.startsWith('cls-9') || c.id.startsWith('cls-10')).forEach(cls => {
      SUBJECT_OPTIONS.forEach(sbj => {
        const clsRoman = cls.id.includes('9') ? 'IX' : 'X';
        const secLetter = cls.id.endsWith('b') ? 'B' : 'A';

        const matchingScores = scoresIX_X.filter(s => {
          const matchSub = (s.subjectName || '').toLowerCase().includes(sbj.name.toLowerCase()) || sbj.name.toLowerCase().includes((s.subjectName || '').toLowerCase());
          const matchCls = (s.className === clsRoman || s.className === cls.name || s.className.includes(clsRoman)) && (s.section === secLetter || !s.section);
          return matchSub && matchCls;
        });

        if (matchingScores.length > 0) {
          let rLessThan33 = 0;
          let r33_45 = 0;
          let r45_60 = 0;
          let r60_75 = 0;
          let r75_90 = 0;
          let r90_plus = 0;
          let totalScoreSum = 0;
          let maxScore = 0;
          let minScore = 100;

          matchingScores.forEach(sc => {
            let percentage = 0;
            if (examType === 'UT') {
              percentage = (sc.ptAvg ?? 3.8) * 20;
            } else if (examType === 'HY') {
              percentage = sc.boardOrSeeExam !== null && sc.boardOrSeeExam !== undefined ? (sc.boardOrSeeExam / 80) * 100 : (sc.percentage || 72);
            } else {
              percentage = sc.percentage || (sc.grandTotal / 100) * 100 || 74;
            }

            percentage = Math.min(100, Math.max(0, percentage));
            totalScoreSum += percentage;
            if (percentage > maxScore) maxScore = percentage;
            if (percentage < minScore) minScore = percentage;

            if (percentage < 33) rLessThan33++;
            else if (percentage < 45) r33_45++;
            else if (percentage < 60) r45_60++;
            else if (percentage < 75) r60_75++;
            else if (percentage < 90) r75_90++;
            else r90_plus++;
          });

          const totalAppeared = matchingScores.length;
          const qualifiedCount = totalAppeared - rLessThan33;
          const passPct = totalAppeared > 0 ? Number(((qualifiedCount / totalAppeared) * 100).toFixed(1)) : 100;
          const avgScore = totalAppeared > 0 ? Number((totalScoreSum / totalAppeared).toFixed(1)) : 70;
          const pi = calculatePI(r33_45, r45_60, r60_75, r75_90, r90_plus, totalAppeared);

          const pageNum = examType === 'UT' ? 1 : (examType === 'HY' ? 2 : (examType === 'PB' ? 3 : 4));
          const newId = `ra-vix-${cls.id}-${sbj.id}-${examType.toLowerCase()}`;

          const newEntry: ResultAnalysisClass6_10 = {
            id: newId,
            pageNo: pageNum,
            exam: examType,
            subjectName: sbj.name,
            subjectId: sbj.id,
            className: cls.name,
            classSectionId: cls.id,
            studentsOnRoll: totalAppeared,
            totalOnRoll: totalAppeared,
            appeared: totalAppeared,
            totalAppeared: totalAppeared,
            qualified: qualifiedCount,
            passed: qualifiedCount,
            needsImprovement: rLessThan33,
            passPercentage: passPct,
            qualifiedPercentage: passPct,
            range33to45: r33_45,
            range45to60: r45_60,
            range60to75: r60_75,
            range75to90: r75_90,
            range90Above: r90_plus,
            classAverage: avgScore,
            performanceIndex: pi,
            pi: pi,
            highestScore: Math.round(maxScore),
            lowestScore: Math.round(minScore),
            remarks: `Auto-aggregated from Module 17(d) Scholastic Ledger (${matchingScores.length} students).`
          };

          const existingIdx = updatedRecords.findIndex(r => r.id === newId);
          if (existingIdx >= 0) {
            updatedRecords[existingIdx] = newEntry;
          } else {
            updatedRecords.push(newEntry);
          }
          generatedCount++;
        }
      });
    });

    if (generatedCount > 0) {
      setRecords(updatedRecords);
      await db.set('setup:result_analysis_vi_x', updatedRecords);
      showNotification(`Aggregated ${generatedCount} analysis records for ${examType} directly from Scholastic Assessment!`);
    } else {
      showNotification(`No matching scholastic score data found for ${examType}.`);
    }
  };

  // Summary Metrics Across Filtered Set
  const totalRows = filteredRecords.length;
  const totalOnRollSum = filteredRecords.reduce((acc, r) => acc + (r.studentsOnRoll || r.totalOnRoll || 0), 0);
  const totalAppearedSum = filteredRecords.reduce((acc, r) => acc + (r.appeared || r.totalAppeared || 0), 0);
  const totalQualifiedSum = filteredRecords.reduce((acc, r) => acc + (r.qualified || r.passed || 0), 0);
  const totalNeedsImpSum = filteredRecords.reduce((acc, r) => acc + (r.needsImprovement || 0), 0);
  const overallPassPct = totalAppearedSum > 0 ? ((totalQualifiedSum / totalAppearedSum) * 100).toFixed(1) : '100.0';

  const sum33_45 = filteredRecords.reduce((acc, r) => acc + (r.range33to45 || 0), 0);
  const sum45_60 = filteredRecords.reduce((acc, r) => acc + (r.range45to60 || 0), 0);
  const sum60_75 = filteredRecords.reduce((acc, r) => acc + (r.range60to75 || 0), 0);
  const sum75_90 = filteredRecords.reduce((acc, r) => acc + (r.range75to90 || 0), 0);
  const sum90_plus = filteredRecords.reduce((acc, r) => acc + (r.range90Above || 0), 0);

  const overallAvgPI = totalAppearedSum > 0 ? calculatePI(sum33_45, sum45_60, sum60_75, sum75_90, sum90_plus, totalAppearedSum) : 0;

  return (
    <div className="space-y-6">
      {/* Dev Mode Official Page Banner */}
      {devMode && (
        <DevModeBadge
          pages={31}
          title="18(a) विषयानुसार परिणाम विश्लेषण (कक्षाएँ-6-10) (SUBJECT WISE RESULT ANALYSIS - Page 31, Landscape Format)"
        />
      )}

      {/* Main Header Container matching official Teacher's Diary Format */}
      <div className="bg-gradient-to-br from-purple-950/40 via-slate-900/50 to-indigo-950/40 border border-purple-500/30 p-6 rounded-2xl space-y-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-purple-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Official KVS Module 18(a)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Page 31 (Landscape Format)
              </span>
              {notification && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold animate-pulse">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{notification}</span>
                </span>
              )}
            </div>

            {/* Strict Header matching the user's uploaded form with "4 pages" removed */}
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-400 shrink-0" />
              <span>18(a) विषयानुसार परिणाम विश्लेषण (कक्षाएँ-6-10)</span>
            </h1>
            <h2 className="text-sm font-bold text-purple-300 uppercase tracking-wide">
              SUBJECT WISE RESULT ANALYSIS (FOR CLASSES- VI TO X)
            </h2>
            <p className="text-xs text-gray-300/80 italic mt-0.5">
              5-Bracket Marks Distribution (&lt;33%, 33-45%, 45-60%, 60-75%, 75-90%, 90%+) & KVS Quality Performance Index
            </p>
          </div>

          {/* Navigation Tabs Pill */}
          <div className="bg-black/50 p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 shrink-0 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-200" />
              <span>Official Register 18(a)</span>
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'charts'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-200" />
              <span>Performance Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('range_key')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'range_key'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-200" />
              <span>Range Key & Guidelines</span>
            </button>
          </div>
        </div>

        {/* Global Filters Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs pt-1">
          {/* Exam Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Exam</label>
            <select
              value={examFilter}
              onChange={e => setExamFilter(e.target.value)}
              className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="All">All Exams (UT, MT, HY, PB, SEE)</option>
              {EXAM_OPTIONS.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.label}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Subject</label>
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="All">All Subjects</option>
              {SUBJECT_OPTIONS.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Class & Sec Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Class & Section</label>
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="All">All Classes (VI to X)</option>
              {CLASS_OPTIONS.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Page Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Page View</label>
            <select
              value={pageFilter}
              onChange={e => setPageFilter(e.target.value)}
              className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="All">All 4 Pages</option>
              <option value="1">Page 1 (Term 1 / UT & MT)</option>
              <option value="2">Page 2 (Term 1 / Half Yearly)</option>
              <option value="3">Page 3 (Term 2 / Pre-Board)</option>
              <option value="4">Page 4 (Term 2 / Session Ending)</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Search</label>
            <div className="relative mt-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search exam, subject..."
                className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-purple-500/10">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenNew}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Analysis Row</span>
            </button>

            <button
              onClick={() => handleAutoGenerateFromScholastic('UT')}
              className="px-3.5 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Compute percentage ranges automatically from Unit Tests"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-teal-300" />
              <span>Sync UT (PT-1)</span>
            </button>

            <button
              onClick={() => handleAutoGenerateFromScholastic('HY')}
              className="px-3.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Compute percentage ranges automatically from Half Yearly scores"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-300" />
              <span>Sync HY Exam</span>
            </button>

            <button
              onClick={() => handleAutoGenerateFromScholastic('SEE')}
              className="px-3.5 py-1.5 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Compute percentage ranges automatically from Session Ending Exam"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-fuchsia-300" />
              <span>Sync SEE Exam</span>
            </button>

            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              title="Print 18(a) in Landscape mode"
            >
              <Printer className="w-4 h-4 text-purple-300" />
              <span>Print Landscape Register 18(a)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-gray-400">Analysis Entries</div>
          <div className="text-xl font-black text-white mt-0.5">{totalRows}</div>
          <div className="text-[10px] text-purple-300 mt-0.5">Classes VI-X Ledger</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-gray-400">Total Appeared</div>
          <div className="text-xl font-black text-blue-300 mt-0.5">{totalAppearedSum}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Roll: {totalOnRollSum}</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-emerald-400">Total Qualified</div>
          <div className="text-xl font-black text-emerald-300 mt-0.5">{totalQualifiedSum}</div>
          <div className="text-[10px] text-emerald-300/80 mt-0.5">{overallPassPct}% Pass Rate</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-rose-400">Needs Improvement (&lt;33%)</div>
          <div className="text-xl font-black text-rose-300 mt-0.5">{totalNeedsImpSum}</div>
          <div className="text-[10px] text-rose-300/80 mt-0.5">Remedial Support</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-amber-400">High Achievers (75%+)</div>
          <div className="text-xl font-black text-amber-300 mt-0.5">{sum75_90 + sum90_plus}</div>
          <div className="text-[10px] text-amber-300/80 mt-0.5">
            {totalAppearedSum > 0 ? Math.round(((sum75_90 + sum90_plus) / totalAppearedSum) * 100) : 0}% Distinction Level
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-purple-400">Performance Index</div>
          <div className="text-xl font-black text-purple-300 mt-0.5">{overallAvgPI} <span className="text-xs text-gray-400 font-normal">/ 100</span></div>
          <div className="text-[10px] text-purple-300/80 mt-0.5">KVS Quality Benchmark</div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: OFFICIAL REGISTER TABLE (EXACT REPLICA OF 18(a) IMAGE)       */}
      {/* ==================================================================== */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
            <table className="w-full text-xs text-left border-collapse min-w-[1250px]">
              <thead>
                {/* 13 Column Headers matching the user's uploaded form exactly */}
                <tr className="bg-purple-950/80 text-purple-200 border-b border-purple-500/30 text-center font-bold uppercase tracking-wider text-[11px]">
                  {/* 1. Exam */}
                  <th className="py-3 px-3 border-r border-purple-500/30 w-32 text-center">
                    UT / MT /<br />HY / PB /<br />SEE
                  </th>

                  {/* 2. Subject */}
                  <th className="py-3 px-3 border-r border-purple-500/30 w-32 text-left">
                    Subject
                  </th>

                  {/* 3. Class & Sec */}
                  <th className="py-3 px-2.5 border-r border-purple-500/30 w-24 text-center">
                    Class<br />& Sec
                  </th>

                  {/* 4. No. of Students on Roll */}
                  <th className="py-3 px-2 border-r border-purple-500/30 w-20 text-center text-gray-300">
                    No. of<br />Students<br />on Roll
                  </th>

                  {/* 5. Appeared */}
                  <th className="py-3 px-2 border-r border-purple-500/30 w-18 text-center text-blue-200">
                    Appeared
                  </th>

                  {/* 6. Qualified */}
                  <th className="py-3 px-2 border-r border-purple-500/30 w-18 text-center text-emerald-300">
                    Qualified
                  </th>

                  {/* 7. Needs Improvement <33% */}
                  <th className="py-3 px-2 border-r border-purple-500/30 w-22 text-center text-rose-300">
                    Needs<br />Improve-<br />ment<br />&lt;33%
                  </th>

                  {/* 8. Pass % */}
                  <th className="py-3 px-2 border-r-2 border-purple-500/50 w-20 text-center text-emerald-300 bg-emerald-950/30">
                    Pass<br />%
                  </th>

                  {/* 9. 33% to <45% */}
                  <th className="py-3 px-2 border-r border-purple-500/30 w-16 text-center text-amber-200">
                    33%<br />to<br />&lt;45%
                  </th>

                  {/* 10. 45% to <60% */}
                  <th className="py-3 px-2 border-r border-purple-500/30 w-16 text-center text-teal-300">
                    45%<br />to<br />&lt;60%
                  </th>

                  {/* 11. 60% to <75% */}
                  <th className="py-3 px-2 border-r border-purple-500/30 w-16 text-center text-blue-300">
                    60%<br />to<br />&lt;75%
                  </th>

                  {/* 12. 75% to <90% */}
                  <th className="py-3 px-2 border-r border-purple-500/30 w-16 text-center text-purple-300">
                    75%<br />to<br />&lt;90%
                  </th>

                  {/* 13. 90% and above */}
                  <th className="py-3 px-2 border-r border-purple-500/30 w-20 text-center text-amber-300 bg-amber-950/20">
                    90%<br />and above
                  </th>

                  {/* Actions */}
                  <th className="py-3 px-2 w-16 text-center text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 font-mono">
                {filteredRecords.map((row, idx) => {
                  const onRoll = row.studentsOnRoll || row.totalOnRoll || 40;
                  const appeared = row.appeared || row.totalAppeared || onRoll;
                  const qualified = row.qualified !== undefined ? row.qualified : (row.passed !== undefined ? row.passed : appeared);
                  const needsImp = row.needsImprovement || 0;
                  const passPct = row.passPercentage !== undefined
                    ? row.passPercentage
                    : (row.qualifiedPercentage !== undefined ? row.qualifiedPercentage : 100);

                  return (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors">
                      {/* 1. UT / MT / HY / PB / SEE */}
                      <td className="py-2.5 px-3 border-r border-white/10 font-sans font-bold text-white text-xs text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                            {row.exam}
                          </span>
                        </div>
                      </td>

                      {/* 2. Subject */}
                      <td className="py-2.5 px-3 border-r border-white/10 font-sans text-purple-200 font-semibold">
                        {row.subjectName}
                      </td>

                      {/* 3. Class & Sec */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center font-bold text-amber-300">
                        {row.className}
                      </td>

                      {/* 4. No. of Students on Roll */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center font-semibold text-gray-300">
                        {onRoll}
                      </td>

                      {/* 5. Appeared */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center font-bold text-blue-200">
                        {appeared}
                      </td>

                      {/* 6. Qualified */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center font-bold text-emerald-300">
                        {qualified}
                      </td>

                      {/* 7. Needs Improvement <33% */}
                      <td className={`py-2.5 px-2 border-r border-white/10 text-center font-bold ${
                        needsImp > 0 ? 'text-rose-400 bg-rose-500/10' : 'text-gray-400'
                      }`}>
                        {needsImp}
                      </td>

                      {/* 8. Pass % */}
                      <td className="py-2.5 px-2 border-r-2 border-purple-500/40 text-center font-black text-emerald-300 bg-emerald-500/10">
                        {passPct}%
                      </td>

                      {/* 9. 33% to <45% */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center text-amber-200 font-bold">
                        {row.range33to45 ?? 0}
                      </td>

                      {/* 10. 45% to <60% */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center text-teal-300 font-bold">
                        {row.range45to60 ?? 0}
                      </td>

                      {/* 11. 60% to <75% */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center text-blue-300 font-bold">
                        {row.range60to75 ?? 0}
                      </td>

                      {/* 12. 75% to <90% */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center text-purple-300 font-bold">
                        {row.range75to90 ?? 0}
                      </td>

                      {/* 13. 90% and above */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center font-black text-amber-300 bg-amber-500/10">
                        {row.range90Above ?? 0}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(row)}
                            className="p-1 hover:bg-purple-500/20 text-purple-300 rounded transition-colors cursor-pointer"
                            title="Edit Result Analysis"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors cursor-pointer"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-gray-400">
                      <TrendingUp className="w-8 h-8 text-purple-400/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-white">No 18(a) Result Analysis records found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Click "+ Add Analysis Row" or "Sync" from scholastic assessment data above.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Grand Total Summary Row */}
              {filteredRecords.length > 0 && (
                <tfoot className="bg-purple-950/90 text-purple-200 border-t-2 border-purple-500/50 font-bold text-center">
                  <tr>
                    <td colSpan={3} className="py-3 px-3 border-r border-purple-500/30 text-right uppercase tracking-wider text-xs">
                      Grand Total / Summary:
                    </td>
                    <td className="py-3 px-2 border-r border-purple-500/30 font-mono text-gray-200">
                      {totalOnRollSum}
                    </td>
                    <td className="py-3 px-2 border-r border-purple-500/30 font-mono text-blue-200">
                      {totalAppearedSum}
                    </td>
                    <td className="py-3 px-2 border-r border-purple-500/30 font-mono text-emerald-300">
                      {totalQualifiedSum}
                    </td>
                    <td className="py-3 px-2 border-r border-purple-500/30 font-mono text-rose-300">
                      {totalNeedsImpSum}
                    </td>
                    <td className="py-3 px-2 border-r-2 border-purple-500/50 font-mono text-emerald-300 bg-emerald-950/40">
                      {overallPassPct}%
                    </td>
                    <td className="py-3 px-2 border-r border-purple-500/30 font-mono text-amber-200">
                      {sum33_45}
                    </td>
                    <td className="py-3 px-2 border-r border-purple-500/30 font-mono text-teal-300">
                      {sum45_60}
                    </td>
                    <td className="py-3 px-2 border-r border-purple-500/30 font-mono text-blue-300">
                      {sum60_75}
                    </td>
                    <td className="py-3 px-2 border-r border-purple-500/30 font-mono text-purple-300">
                      {sum75_90}
                    </td>
                    <td className="py-3 px-2 border-r border-purple-500/30 font-mono text-amber-300 bg-amber-950/30">
                      {sum90_plus}
                    </td>
                    <td className="py-3 px-2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: PERFORMANCE ANALYTICS & CHARTS                                */}
      {/* ==================================================================== */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Range Distribution Histogram Card */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                    <span>5-Bracket Marks Distribution Spectrum</span>
                  </h3>
                  <p className="text-xs text-gray-400">Total Appeared: {totalAppearedSum} students</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {/* 90% and above */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-amber-300">90% and above (Outstanding)</span>
                    <span className="font-mono text-amber-300">
                      {sum90_plus} ({totalAppearedSum > 0 ? Math.round((sum90_plus / totalAppearedSum) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${totalAppearedSum > 0 ? (sum90_plus / totalAppearedSum) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 75% to <90% */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-purple-300">75% to &lt;90% (Distinction)</span>
                    <span className="font-mono text-purple-300">
                      {sum75_90} ({totalAppearedSum > 0 ? Math.round((sum75_90 / totalAppearedSum) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${totalAppearedSum > 0 ? (sum75_90 / totalAppearedSum) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 60% to <75% */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-blue-300">60% to &lt;75% (First Division)</span>
                    <span className="font-mono text-blue-300">
                      {sum60_75} ({totalAppearedSum > 0 ? Math.round((sum60_75 / totalAppearedSum) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${totalAppearedSum > 0 ? (sum60_75 / totalAppearedSum) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 45% to <60% */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-teal-300">45% to &lt;60% (Second Division)</span>
                    <span className="font-mono text-teal-300">
                      {sum45_60} ({totalAppearedSum > 0 ? Math.round((sum45_60 / totalAppearedSum) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${totalAppearedSum > 0 ? (sum45_60 / totalAppearedSum) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 33% to <45% */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-amber-200">33% to &lt;45% (Third Division / Pass)</span>
                    <span className="font-mono text-amber-200">
                      {sum33_45} ({totalAppearedSum > 0 ? Math.round((sum33_45 / totalAppearedSum) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${totalAppearedSum > 0 ? (sum33_45 / totalAppearedSum) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Needs Improvement <33% */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-rose-400">Needs Improvement &lt;33% (Remedial Required)</span>
                    <span className="font-mono text-rose-400">
                      {totalNeedsImpSum} ({totalAppearedSum > 0 ? Math.round((totalNeedsImpSum / totalAppearedSum) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 to-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${totalAppearedSum > 0 ? (totalNeedsImpSum / totalAppearedSum) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Pass Rate & Quality Comparison */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 backdrop-blur-md shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-400" />
                  <span>Subject-Wise Pass Rate & Quality Performance</span>
                </h3>
                <p className="text-xs text-gray-400">Comparative metrics across core disciplines</p>
              </div>

              <div className="space-y-3 pt-2">
                {SUBJECT_OPTIONS.map(sbj => {
                  const subRecords = records.filter(r => r.subjectName === sbj.name || r.subjectId === sbj.id);
                  const subAppeared = subRecords.reduce((acc, r) => acc + (r.appeared || 0), 0);
                  const subQualified = subRecords.reduce((acc, r) => acc + (r.qualified || 0), 0);
                  const subPassPct = subAppeared > 0 ? Number(((subQualified / subAppeared) * 100).toFixed(1)) : 0;
                  const subPI = subAppeared > 0
                    ? calculatePI(
                        subRecords.reduce((a, r) => a + (r.range33to45 || 0), 0),
                        subRecords.reduce((a, r) => a + (r.range45to60 || 0), 0),
                        subRecords.reduce((a, r) => a + (r.range60to75 || 0), 0),
                        subRecords.reduce((a, r) => a + (r.range75to90 || 0), 0),
                        subRecords.reduce((a, r) => a + (r.range90Above || 0), 0),
                        subAppeared
                      )
                    : 0;

                  return (
                    <div key={sbj.id} className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{sbj.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-emerald-300 font-bold">Pass: {subPassPct}%</span>
                          <span className="font-mono text-purple-300 font-bold">PI: {subPI}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${subPassPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: RANGE KEY & CBSE GUIDELINES                                  */}
      {/* ==================================================================== */}
      {activeTab === 'range_key' && (
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6 backdrop-blur-md">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Official KVS/CBSE Secondary Marks Distribution & Remedial Policy</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Standard 5-tier classification utilized in Official Teacher's Diary Module 18(a) for Classes VI to X.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
              <div className="text-xs uppercase font-bold text-amber-400">90% and Above</div>
              <div className="text-sm font-black text-white">Exemplary / Outstanding Level</div>
              <p className="text-xs text-gray-300">
                Students demonstrating deep analytical mastery, critical thinking, and superior conceptual clarity.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
              <div className="text-xs uppercase font-bold text-purple-400">75% to &lt;90% & 60% to &lt;75%</div>
              <div className="text-sm font-black text-white">Distinction & First Division</div>
              <p className="text-xs text-gray-300">
                Solid understanding of foundational topics. Candidate for enrichment activities and science exhibitions.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2">
              <div className="text-xs uppercase font-bold text-rose-400">Needs Improvement (&lt;33%)</div>
              <div className="text-sm font-black text-white">Remedial Action Mandatory</div>
              <p className="text-xs text-gray-300">
                Requires focused diagnostic evaluation, individualized remedial worksheets, and structured post-test monitoring.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ADD / EDIT MODAL                                                     */}
      {/* ==================================================================== */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-400" />
                <span>{editingItem.id?.startsWith('ra-vix-') && records.some(r => r.id === editingItem.id) ? 'Edit 18(a) Result Analysis Row' : 'Add New 18(a) Result Analysis Row'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Exam */}
              <div>
                <label className="text-[10px] uppercase font-bold text-purple-300">Exam Type</label>
                <select
                  value={editingItem.exam || 'UT'}
                  onChange={e => setEditingItem({ ...editingItem, exam: e.target.value })}
                  className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                >
                  {EXAM_OPTIONS.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.label}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="text-[10px] uppercase font-bold text-purple-300">Subject</label>
                <select
                  value={editingItem.subjectName || 'Mathematics'}
                  onChange={e => setEditingItem({ ...editingItem, subjectName: e.target.value })}
                  className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                >
                  {SUBJECT_OPTIONS.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Class & Sec */}
              <div>
                <label className="text-[10px] uppercase font-bold text-purple-300">Class & Section</label>
                <select
                  value={editingItem.className || 'Class VI-A'}
                  onChange={e => setEditingItem({ ...editingItem, className: e.target.value })}
                  className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                >
                  {CLASS_OPTIONS.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              {/* Roll */}
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400">On Roll</label>
                <input
                  type="number"
                  value={editingItem.studentsOnRoll ?? 40}
                  onChange={e => setEditingItem({ ...editingItem, studentsOnRoll: Number(e.target.value) })}
                  className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              {/* Appeared */}
              <div>
                <label className="text-[10px] uppercase font-bold text-blue-300">Appeared</label>
                <input
                  type="number"
                  value={editingItem.appeared ?? 40}
                  onChange={e => setEditingItem({ ...editingItem, appeared: Number(e.target.value) })}
                  className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              {/* Needs Improvement <33% */}
              <div>
                <label className="text-[10px] uppercase font-bold text-rose-300">Needs Imp (&lt;33%)</label>
                <input
                  type="number"
                  value={editingItem.needsImprovement ?? 0}
                  onChange={e => setEditingItem({ ...editingItem, needsImprovement: Number(e.target.value) })}
                  className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              {/* Page No */}
              <div>
                <label className="text-[10px] uppercase font-bold text-purple-300">Page No (1-4)</label>
                <select
                  value={editingItem.pageNo ?? 1}
                  onChange={e => setEditingItem({ ...editingItem, pageNo: Number(e.target.value) })}
                  className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                >
                  <option value="1">Page 1</option>
                  <option value="2">Page 2</option>
                  <option value="3">Page 3</option>
                  <option value="4">Page 4</option>
                </select>
              </div>
            </div>

            {/* 5 Marks Range Buckets */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-purple-300">Marks Range Frequency Distribution</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-amber-200 font-semibold block">33% to &lt;45%</span>
                  <input
                    type="number"
                    value={editingItem.range33to45 ?? 0}
                    onChange={e => setEditingItem({ ...editingItem, range33to45: Number(e.target.value) })}
                    className="w-full mt-1 py-1.5 px-2 bg-black/40 border border-white/10 rounded-lg text-center text-white"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-teal-300 font-semibold block">45% to &lt;60%</span>
                  <input
                    type="number"
                    value={editingItem.range45to60 ?? 0}
                    onChange={e => setEditingItem({ ...editingItem, range45to60: Number(e.target.value) })}
                    className="w-full mt-1 py-1.5 px-2 bg-black/40 border border-white/10 rounded-lg text-center text-white"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-blue-300 font-semibold block">60% to &lt;75%</span>
                  <input
                    type="number"
                    value={editingItem.range60to75 ?? 0}
                    onChange={e => setEditingItem({ ...editingItem, range60to75: Number(e.target.value) })}
                    className="w-full mt-1 py-1.5 px-2 bg-black/40 border border-white/10 rounded-lg text-center text-white"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-purple-300 font-semibold block">75% to &lt;90%</span>
                  <input
                    type="number"
                    value={editingItem.range75to90 ?? 0}
                    onChange={e => setEditingItem({ ...editingItem, range75to90: Number(e.target.value) })}
                    className="w-full mt-1 py-1.5 px-2 bg-black/40 border border-white/10 rounded-lg text-center text-white"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-amber-300 font-semibold block">90% and above</span>
                  <input
                    type="number"
                    value={editingItem.range90Above ?? 0}
                    onChange={e => setEditingItem({ ...editingItem, range90Above: Number(e.target.value) })}
                    className="w-full mt-1 py-1.5 px-2 bg-black/40 border border-white/10 rounded-lg text-center text-white"
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400">Teacher Remarks / Diagnostic Feedback</label>
              <input
                type="text"
                value={editingItem.remarks || ''}
                onChange={e => setEditingItem({ ...editingItem, remarks: e.target.value })}
                placeholder="e.g. Remedial planned for weak topics, high scores in practical..."
                className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModal}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                Save Analysis Row
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
