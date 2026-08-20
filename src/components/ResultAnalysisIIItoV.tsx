import React, { useState, useEffect } from 'react';
import {
  ResultAnalysisClass3_5,
  PrimaryGradeCounts,
  ScholasticRecordClass3_5,
  StudentProfile,
  PrimaryTerm
} from '../types/academic';
import {
  db,
  DEFAULT_RESULT_ANALYSIS_III_V,
  DEFAULT_SCHOLASTIC_III_V,
  DEFAULT_STUDENTS
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
  ChevronDown
} from 'lucide-react';

interface ResultAnalysisIIItoVProps {
  devMode: boolean;
}

const EXAM_OPTIONS = [
  'Periodic Test 1 (PT-1)',
  'Term-1 / Half Yearly Exam',
  'Periodic Test 2 (PT-2)',
  'Term-2 / Session Ending Exam (SEE)',
  'Annual Consolidated',
  'Unit Assessment'
];

const SUBJECT_OPTIONS = [
  { id: 'sbj-p03', name: 'English' },
  { id: 'sbj-p04', name: 'Hindi' },
  { id: 'sbj-p02', name: 'Mathematics' },
  { id: 'sbj-p01', name: 'Environmental Studies (EVS)' }
];

const CLASS_OPTIONS = [
  { id: 'cls-3a', name: 'Class III-A' },
  { id: 'cls-3b', name: 'Class III-B' },
  { id: 'cls-4a', name: 'Class IV-A' },
  { id: 'cls-4b', name: 'Class IV-B' },
  { id: 'cls-5a', name: 'Class V-A' },
  { id: 'cls-5b', name: 'Class V-B' }
];

const GRADE_KEYS: (keyof PrimaryGradeCounts)[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E'];

export default function ResultAnalysisIIItoV({ devMode }: ResultAnalysisIIItoVProps) {
  const [records, setRecords] = useState<ResultAnalysisClass3_5[]>([]);
  const [scholasticScores, setScholasticScores] = useState<ScholasticRecordClass3_5[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);

  // Filter States
  const [examFilter, setExamFilter] = useState<string>('All');
  const [classFilter, setClassFilter] = useState<string>('All');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'register' | 'charts' | 'grading_key'>('register');

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Partial<ResultAnalysisClass3_5> | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedRA = (await db.get<ResultAnalysisClass3_5[]>('setup:result_analysis_iii_v')) || DEFAULT_RESULT_ANALYSIS_III_V;
    const savedSch = (await db.get<ScholasticRecordClass3_5[]>('setup:scholastic_scores_iii_v')) || DEFAULT_SCHOLASTIC_III_V;
    const savedStd = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;

    setRecords(savedRA);
    setScholasticScores(savedSch);
    setStudents(savedStd);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Compute KVS Performance Index (PI)
  // Weightages: A1=100, A2=87.5, B1=75, B2=62.5, C1=50, C2=37.5, D=25, E=0
  const calculateKvsPI = (grades: PrimaryGradeCounts, totalAppeared: number): number => {
    if (!totalAppeared || totalAppeared <= 0) return 0;
    const weightedSum =
      (grades.A1 || 0) * 100 +
      (grades.A2 || 0) * 87.5 +
      (grades.B1 || 0) * 75 +
      (grades.B2 || 0) * 62.5 +
      (grades.C1 || 0) * 50 +
      (grades.C2 || 0) * 37.5 +
      (grades.D || 0) * 25 +
      (grades.E || 0) * 0;
    return Number((weightedSum / totalAppeared).toFixed(1));
  };

  // Filtered analysis records
  const filteredRecords = records.filter(r => {
    if (examFilter !== 'All' && r.exam !== examFilter) return false;
    if (classFilter !== 'All' && r.className !== classFilter && r.classSectionId !== classFilter) return false;
    if (subjectFilter !== 'All' && r.subjectName !== subjectFilter && r.subjectId !== subjectFilter) return false;
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

  // Modal open for New Entry
  const handleOpenNew = () => {
    setEditingItem({
      id: `ra-${Date.now()}`,
      exam: examFilter !== 'All' ? examFilter : 'Periodic Test 1 (PT-1)',
      subjectName: subjectFilter !== 'All' ? subjectFilter : 'Mathematics',
      className: classFilter !== 'All' ? classFilter : 'Class III-A',
      studentsOnRoll: 40,
      appeared: 40,
      qualified: 40,
      needsImprovement: 0,
      qualifiedPercentage: 100,
      classAverage: 80.0,
      performanceIndex: 80.0,
      gradeCounts: {
        A1: 10,
        A2: 12,
        B1: 8,
        B2: 6,
        C1: 4,
        C2: 0,
        D: 0,
        E: 0
      },
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ResultAnalysisClass3_5) => {
    setEditingItem({ ...item, gradeCounts: { ...item.gradeCounts } });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    await db.set('setup:result_analysis_iii_v', updated);
    showNotification('Record removed successfully.');
  };

  const handleResetDefaults = async () => {
    setRecords(DEFAULT_RESULT_ANALYSIS_III_V);
    await db.set('setup:result_analysis_iii_v', DEFAULT_RESULT_ANALYSIS_III_V);
    showNotification('Reset to official KVS exemplar analysis records.');
  };

  const handleSaveModal = async () => {
    if (!editingItem || !editingItem.exam || !editingItem.subjectName || !editingItem.className) return;

    const grades: PrimaryGradeCounts = editingItem.gradeCounts || {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
      D: 0,
      E: 0
    };

    const sumQualified =
      (grades.A1 || 0) +
      (grades.A2 || 0) +
      (grades.B1 || 0) +
      (grades.B2 || 0) +
      (grades.C1 || 0) +
      (grades.C2 || 0) +
      (grades.D || 0);

    const needsImp = grades.E || 0;
    const onRoll = Number(editingItem.studentsOnRoll) || (sumQualified + needsImp) || 40;
    const appeared = Number(editingItem.appeared) || (sumQualified + needsImp) || onRoll;
    const qualifiedPct = appeared > 0 ? Number(((sumQualified / appeared) * 100).toFixed(1)) : 100;
    const pi = calculateKvsPI(grades, appeared);

    const savedRecord: ResultAnalysisClass3_5 = {
      id: editingItem.id || `ra-${Date.now()}`,
      exam: editingItem.exam,
      subjectName: editingItem.subjectName,
      className: editingItem.className,
      studentsOnRoll: onRoll,
      totalOnRoll: onRoll,
      appeared: appeared,
      totalAppeared: appeared,
      qualified: sumQualified,
      passed: sumQualified,
      needsImprovement: needsImp,
      qualifiedPercentage: qualifiedPct,
      passPercentage: qualifiedPct,
      gradeCounts: grades,
      classAverage: Number(editingItem.classAverage) || 80.0,
      performanceIndex: pi,
      pi: pi,
      remarks: editingItem.remarks || ''
    };

    const existsIdx = records.findIndex(r => r.id === savedRecord.id);
    let updatedList: ResultAnalysisClass3_5[];
    if (existsIdx >= 0) {
      updatedList = [...records];
      updatedList[existsIdx] = savedRecord;
    } else {
      updatedList = [...records, savedRecord];
    }

    setRecords(updatedList);
    await db.set('setup:result_analysis_iii_v', updatedList);
    setIsModalOpen(false);
    setEditingItem(null);
    showNotification('Result Analysis row saved successfully.');
  };

  // Helper to sync / compute directly from Module 26 Scholastic Assessment records
  const handleAutoGenerateFromScholastic = async (term: PrimaryTerm = 1) => {
    const termLabel = term === 1 ? 'Term-1 / Half Yearly Exam' : 'Term-2 / Session Ending Exam (SEE)';
    let generatedCount = 0;
    let updatedRecords = [...records];

    CLASS_OPTIONS.forEach(cls => {
      SUBJECT_OPTIONS.forEach(sbj => {
        // Find matching scholastic records for this class, subject & term
        const matchingScores = scholasticScores.filter(s => {
          const matchTerm = s.term === term;
          const matchSub = s.subjectId === sbj.id || s.id.includes(sbj.id);
          const matchCls = s.classSectionId === cls.id || s.id.includes(cls.id);
          return matchTerm && matchSub && matchCls;
        });

        if (matchingScores.length > 0) {
          const grades: PrimaryGradeCounts = {
            A1: 0,
            A2: 0,
            B1: 0,
            B2: 0,
            C1: 0,
            C2: 0,
            D: 0,
            E: 0
          };

          let totalPctSum = 0;

          matchingScores.forEach(sc => {
            const g = (sc.grade || 'A1') as keyof PrimaryGradeCounts;
            if (grades[g] !== undefined) {
              grades[g] += 1;
            }
            totalPctSum += (sc.percentage || sc.total || 0);
          });

          const totalAppeared = matchingScores.length;
          const totalOnRoll = totalAppeared;
          const qualifiedCount = totalAppeared - (grades.E || 0);
          const qualifiedPct = totalAppeared > 0 ? Number(((qualifiedCount / totalAppeared) * 100).toFixed(1)) : 100;
          const classAvg = totalAppeared > 0 ? Number((totalPctSum / totalAppeared).toFixed(1)) : 0;
          const pi = calculateKvsPI(grades, totalAppeared);

          const newId = `ra-${cls.id}-${sbj.id}-t${term}`;
          const newEntry: ResultAnalysisClass3_5 = {
            id: newId,
            exam: termLabel,
            subjectName: sbj.name,
            subjectId: sbj.id,
            className: cls.name,
            classSectionId: cls.id,
            term: term,
            studentsOnRoll: totalOnRoll,
            totalOnRoll: totalOnRoll,
            appeared: totalAppeared,
            totalAppeared: totalAppeared,
            qualified: qualifiedCount,
            passed: qualifiedCount,
            needsImprovement: grades.E || 0,
            qualifiedPercentage: qualifiedPct,
            passPercentage: qualifiedPct,
            classAverage: classAvg,
            performanceIndex: pi,
            pi: pi,
            gradeCounts: grades,
            remarks: `Auto-aggregated from Module 26 Scholastic Ledger (${matchingScores.length} students).`
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
      await db.set('setup:result_analysis_iii_v', updatedRecords);
      showNotification(`Aggregated ${generatedCount} analysis records directly from Module 26 Scholastic Ledger!`);
    } else {
      showNotification('No matching scholastic score data found to auto-aggregate.');
    }
  };

  // Summary Metrics Across Filtered Set
  const totalRows = filteredRecords.length;
  const totalOnRollSum = filteredRecords.reduce((acc, r) => acc + (r.studentsOnRoll || r.totalOnRoll || 0), 0);
  const totalAppearedSum = filteredRecords.reduce((acc, r) => acc + (r.appeared || r.totalAppeared || 0), 0);
  const totalQualifiedSum = filteredRecords.reduce((acc, r) => acc + (r.qualified || r.passed || 0), 0);
  const totalNeedsImpSum = filteredRecords.reduce((acc, r) => acc + (r.needsImprovement || 0), 0);
  const overallQualifiedPct = totalAppearedSum > 0 ? ((totalQualifiedSum / totalAppearedSum) * 100).toFixed(1) : '100.0';

  const totalGradeSum: PrimaryGradeCounts = {
    A1: filteredRecords.reduce((acc, r) => acc + (r.gradeCounts?.A1 || 0), 0),
    A2: filteredRecords.reduce((acc, r) => acc + (r.gradeCounts?.A2 || 0), 0),
    B1: filteredRecords.reduce((acc, r) => acc + (r.gradeCounts?.B1 || 0), 0),
    B2: filteredRecords.reduce((acc, r) => acc + (r.gradeCounts?.B2 || 0), 0),
    C1: filteredRecords.reduce((acc, r) => acc + (r.gradeCounts?.C1 || 0), 0),
    C2: filteredRecords.reduce((acc, r) => acc + (r.gradeCounts?.C2 || 0), 0),
    D: filteredRecords.reduce((acc, r) => acc + (r.gradeCounts?.D || 0), 0),
    E: filteredRecords.reduce((acc, r) => acc + (r.gradeCounts?.E || 0), 0)
  };

  const overallAvgPI = totalAppearedSum > 0 ? calculateKvsPI(totalGradeSum, totalAppearedSum) : 0;

  return (
    <div className="space-y-6">
      {/* Dev Mode Official Page Banner */}
      {devMode && (
        <DevModeBadge
          pages={23}
          title="27. विषयानुसार परिणाम विश्लेषण (कक्षा- 3 से 5) (SUBJECT WISE RESULT ANALYSIS - Page 23, 2 pages Landscape)"
        />
      )}

      {/* Main Header Container matching official Teacher's Diary Page 23 */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/50 to-blue-950/40 border border-indigo-500/30 p-6 rounded-2xl space-y-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-indigo-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Official KVS Module 27
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Page 23 (2 pages - Landscape Format)
              </span>
              {notification && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold animate-pulse">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{notification}</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-400 shrink-0" />
              <span>27. विषयानुसार परिणाम विश्लेषण (कक्षा- 3 से 5)</span>
            </h1>
            <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wide">
              SUBJECT WISE RESULT ANALYSIS (FOR CLASSES- III to V)
            </h2>
            <p className="text-xs text-gray-300/80 italic mt-0.5">
              (In landscape with proper spacing of columns) — Standardized CBSE 8-Point Primary Grading System (A1 to E) & KVS Performance Index
            </p>
          </div>

          {/* Navigation Tabs Pill */}
          <div className="bg-black/50 p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 shrink-0 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-200" />
              <span>Official Register (P-23)</span>
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'charts'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-200" />
              <span>Performance Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('grading_key')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'grading_key'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-200" />
              <span>CBSE Grading Scale</span>
            </button>
          </div>
        </div>

        {/* Global Filters Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
          {/* Exam Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Exam</label>
            <select
              value={examFilter}
              onChange={e => setExamFilter(e.target.value)}
              className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="All">All Examinations</option>
              {EXAM_OPTIONS.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Subject</label>
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
            <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Class & Section</label>
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="All">All Classes (III to V)</option>
              {CLASS_OPTIONS.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Search</label>
            <div className="relative mt-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search exam, subject, remarks..."
                className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-indigo-500/10">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenNew}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Analysis Row</span>
            </button>

            <button
              onClick={() => handleAutoGenerateFromScholastic(1)}
              className="px-3.5 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Compute grade frequencies automatically from Module 26 Scholastic Assessment"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-teal-300" />
              <span>Sync from Module 26 (Term 1)</span>
            </button>

            <button
              onClick={() => handleAutoGenerateFromScholastic(2)}
              className="px-3.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Compute grade frequencies automatically from Module 26 Scholastic Assessment"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-purple-300" />
              <span>Sync from Module 26 (Term 2)</span>
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
              className="px-4 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              title="Print Page 23 in Landscape mode"
            >
              <Printer className="w-4 h-4 text-indigo-300" />
              <span>Print Landscape Register (P-23)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-gray-400">Analysis Rows</div>
          <div className="text-xl font-black text-white mt-0.5">{totalRows}</div>
          <div className="text-[10px] text-indigo-300 mt-0.5">Exam-Subject Records</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-gray-400">Total Appeared</div>
          <div className="text-xl font-black text-blue-300 mt-0.5">{totalAppearedSum}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Roll: {totalOnRollSum}</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-emerald-400">Qualified (A1 - D)</div>
          <div className="text-xl font-black text-emerald-300 mt-0.5">{totalQualifiedSum}</div>
          <div className="text-[10px] text-emerald-300/80 mt-0.5">{overallQualifiedPct}% Qualified</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-rose-400">Needs Improvement (E)</div>
          <div className="text-xl font-black text-rose-300 mt-0.5">{totalNeedsImpSum}</div>
          <div className="text-[10px] text-rose-300/80 mt-0.5">Remedial Focus</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-amber-400">A1 + A2 Top Grades</div>
          <div className="text-xl font-black text-amber-300 mt-0.5">{totalGradeSum.A1 + totalGradeSum.A2}</div>
          <div className="text-[10px] text-amber-300/80 mt-0.5">
            {totalAppearedSum > 0 ? Math.round(((totalGradeSum.A1 + totalGradeSum.A2) / totalAppearedSum) * 100) : 0}% High Achievers
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-purple-400">Performance Index</div>
          <div className="text-xl font-black text-purple-300 mt-0.5">{overallAvgPI} <span className="text-xs text-gray-400 font-normal">/ 100</span></div>
          <div className="text-[10px] text-purple-300/80 mt-0.5">KVS Quality Benchmark</div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: OFFICIAL REGISTER TABLE (EXACT REPLICA OF PAGE 23 PDF)         */}
      {/* ==================================================================== */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
            <table className="w-full text-xs text-left border-collapse min-w-[1300px]">
              <thead>
                {/* Official 16 Column Headers matching the PDF Screenshot exactly */}
                <tr className="bg-indigo-950/80 text-indigo-200 border-b border-indigo-500/30 text-center font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 border-r border-indigo-500/30 w-36 text-left">
                    Exam
                  </th>
                  <th className="py-3 px-3 border-r border-indigo-500/30 w-32 text-left">
                    Subject
                  </th>
                  <th className="py-3 px-2.5 border-r border-indigo-500/30 w-24 text-center">
                    Class & Sec
                  </th>
                  <th className="py-3 px-2 border-r border-indigo-500/30 w-20 text-center text-gray-300">
                    No. of Students on Roll
                  </th>
                  <th className="py-3 px-2 border-r border-indigo-500/30 w-16 text-center text-blue-200">
                    No. Appeared
                  </th>
                  <th className="py-3 px-2 border-r border-indigo-500/30 w-16 text-center text-emerald-300">
                    No. Qualified
                  </th>
                  <th className="py-3 px-2 border-r border-indigo-500/30 w-24 text-center text-rose-300">
                    No. Needs Improvement
                  </th>
                  <th className="py-3 px-2 border-r-2 border-indigo-500/50 w-20 text-center text-emerald-300 bg-emerald-950/30">
                    Qualified %
                  </th>

                  {/* 8 Grade Columns: No. of A1 to E Grades */}
                  <th className="py-3 px-1.5 border-r border-indigo-500/30 w-12 text-center text-amber-300" title="91 - 100%">
                    No. of A1 Grades
                  </th>
                  <th className="py-3 px-1.5 border-r border-indigo-500/30 w-12 text-center text-amber-300" title="81 - 90%">
                    No. of A2 Grades
                  </th>
                  <th className="py-3 px-1.5 border-r border-indigo-500/30 w-12 text-center text-blue-300" title="71 - 80%">
                    No. of B1 Grades
                  </th>
                  <th className="py-3 px-1.5 border-r border-indigo-500/30 w-12 text-center text-blue-300" title="61 - 70%">
                    No. of B2 Grades
                  </th>
                  <th className="py-3 px-1.5 border-r border-indigo-500/30 w-12 text-center text-teal-300" title="51 - 60%">
                    No. of C1 Grades
                  </th>
                  <th className="py-3 px-1.5 border-r border-indigo-500/30 w-12 text-center text-teal-300" title="41 - 50%">
                    No. of C2 Grades
                  </th>
                  <th className="py-3 px-1.5 border-r border-indigo-500/30 w-12 text-center text-amber-200" title="33 - 40%">
                    No. of D Grades
                  </th>
                  <th className="py-3 px-1.5 border-r border-indigo-500/30 w-12 text-center text-rose-400 bg-rose-950/20" title="32% & Below">
                    No. of E Grades
                  </th>

                  <th className="py-3 px-2 border-r border-indigo-500/30 w-16 text-center text-purple-300 bg-purple-950/30" title="KVS Quality Performance Index">
                    PI %
                  </th>
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
                  const needsImp = row.needsImprovement || (row.gradeCounts?.E || 0);
                  const qualifiedPct = row.qualifiedPercentage !== undefined
                    ? row.qualifiedPercentage
                    : (row.passPercentage !== undefined ? row.passPercentage : 100);
                  const pi = row.performanceIndex !== undefined
                    ? row.performanceIndex
                    : (row.pi !== undefined ? row.pi : calculateKvsPI(row.gradeCounts, appeared));

                  return (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors">
                      {/* 1. Exam */}
                      <td className="py-2.5 px-3 border-r border-white/10 font-sans font-bold text-white text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded bg-indigo-500/20 text-indigo-300 text-[10px] flex items-center justify-center font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span>{row.exam}</span>
                        </div>
                      </td>

                      {/* 2. Subject */}
                      <td className="py-2.5 px-3 border-r border-white/10 font-sans text-indigo-200 font-semibold">
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

                      {/* 5. No. Appeared */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center font-bold text-blue-200">
                        {appeared}
                      </td>

                      {/* 6. No. Qualified */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center font-bold text-emerald-300">
                        {qualified}
                      </td>

                      {/* 7. No. Needs Improvement */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center font-bold text-rose-300">
                        {needsImp}
                      </td>

                      {/* 8. Qualified % */}
                      <td className="py-2.5 px-2 border-r-2 border-indigo-500/40 text-center font-black text-emerald-300 bg-emerald-500/10">
                        {qualifiedPct}%
                      </td>

                      {/* 9. No. of A1 Grades */}
                      <td className="py-2.5 px-1.5 border-r border-white/10 text-center text-amber-300 font-bold">
                        {row.gradeCounts?.A1 ?? 0}
                      </td>

                      {/* 10. No. of A2 Grades */}
                      <td className="py-2.5 px-1.5 border-r border-white/10 text-center text-amber-200 font-bold">
                        {row.gradeCounts?.A2 ?? 0}
                      </td>

                      {/* 11. No. of B1 Grades */}
                      <td className="py-2.5 px-1.5 border-r border-white/10 text-center text-blue-300 font-bold">
                        {row.gradeCounts?.B1 ?? 0}
                      </td>

                      {/* 12. No. of B2 Grades */}
                      <td className="py-2.5 px-1.5 border-r border-white/10 text-center text-blue-200 font-bold">
                        {row.gradeCounts?.B2 ?? 0}
                      </td>

                      {/* 13. No. of C1 Grades */}
                      <td className="py-2.5 px-1.5 border-r border-white/10 text-center text-teal-300 font-bold">
                        {row.gradeCounts?.C1 ?? 0}
                      </td>

                      {/* 14. No. of C2 Grades */}
                      <td className="py-2.5 px-1.5 border-r border-white/10 text-center text-teal-200 font-bold">
                        {row.gradeCounts?.C2 ?? 0}
                      </td>

                      {/* 15. No. of D Grades */}
                      <td className="py-2.5 px-1.5 border-r border-white/10 text-center text-amber-100 font-bold">
                        {row.gradeCounts?.D ?? 0}
                      </td>

                      {/* 16. No. of E Grades */}
                      <td className={`py-2.5 px-1.5 border-r border-white/10 text-center font-black ${
                        (row.gradeCounts?.E || 0) > 0 ? 'text-rose-400 bg-rose-500/20' : 'text-gray-500'
                      }`}>
                        {row.gradeCounts?.E ?? 0}
                      </td>

                      {/* Performance Index */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center font-black text-purple-300 bg-purple-500/10">
                        {pi}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(row)}
                            className="p-1 hover:bg-indigo-500/20 text-indigo-300 rounded transition-colors cursor-pointer"
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
                    <td colSpan={18} className="py-12 text-center text-gray-400">
                      <TrendingUp className="w-8 h-8 text-indigo-400/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-white">No Result Analysis records found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Click "+ Add Analysis Row", "Sync from Module 26", or "Reset Defaults" to populate Page 23.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Total Aggregate Summary Footer */}
              {filteredRecords.length > 0 && (
                <tfoot>
                  <tr className="bg-indigo-950/90 text-white font-bold border-t-2 border-indigo-500/40 text-center text-xs">
                    <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider font-extrabold text-indigo-200 border-r border-indigo-500/30">
                      Total Consolidated Summary:
                    </td>
                    <td className="py-3 px-2 border-r border-indigo-500/30 text-gray-200 font-mono">
                      {totalOnRollSum}
                    </td>
                    <td className="py-3 px-2 border-r border-indigo-500/30 text-blue-200 font-mono">
                      {totalAppearedSum}
                    </td>
                    <td className="py-3 px-2 border-r border-indigo-500/30 text-emerald-300 font-mono">
                      {totalQualifiedSum}
                    </td>
                    <td className="py-3 px-2 border-r border-indigo-500/30 text-rose-300 font-mono">
                      {totalNeedsImpSum}
                    </td>
                    <td className="py-3 px-2 border-r-2 border-indigo-500/50 text-emerald-300 font-mono font-black bg-emerald-500/20">
                      {overallQualifiedPct}%
                    </td>

                    {/* Grade Sums */}
                    <td className="py-3 px-1.5 border-r border-indigo-500/30 text-amber-300 font-mono">
                      {totalGradeSum.A1}
                    </td>
                    <td className="py-3 px-1.5 border-r border-indigo-500/30 text-amber-200 font-mono">
                      {totalGradeSum.A2}
                    </td>
                    <td className="py-3 px-1.5 border-r border-indigo-500/30 text-blue-300 font-mono">
                      {totalGradeSum.B1}
                    </td>
                    <td className="py-3 px-1.5 border-r border-indigo-500/30 text-blue-200 font-mono">
                      {totalGradeSum.B2}
                    </td>
                    <td className="py-3 px-1.5 border-r border-indigo-500/30 text-teal-300 font-mono">
                      {totalGradeSum.C1}
                    </td>
                    <td className="py-3 px-1.5 border-r border-indigo-500/30 text-teal-200 font-mono">
                      {totalGradeSum.C2}
                    </td>
                    <td className="py-3 px-1.5 border-r border-indigo-500/30 text-amber-100 font-mono">
                      {totalGradeSum.D}
                    </td>
                    <td className="py-3 px-1.5 border-r border-indigo-500/30 text-rose-400 font-mono">
                      {totalGradeSum.E}
                    </td>

                    <td className="py-3 px-2 border-r border-indigo-500/30 text-purple-300 font-mono font-black bg-purple-500/20">
                      {overallAvgPI}
                    </td>
                    <td className="py-3 px-2">
                      -
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Printable Signature Block for Page 23 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-6 text-xs text-gray-300 backdrop-blur-md">
            <div className="text-center sm:text-left">
              <div className="font-bold text-white">Subject Teacher Sign & Date</div>
              <div className="mt-6 border-b border-gray-500 w-48 mx-auto sm:mx-0"></div>
              <div className="text-[10px] text-gray-400 mt-1">Name: ______________________</div>
            </div>

            <div className="text-center">
              <div className="font-bold text-white">Class Teacher Sign & Date</div>
              <div className="mt-6 border-b border-gray-500 w-48 mx-auto"></div>
              <div className="text-[10px] text-gray-400 mt-1">Name: ______________________</div>
            </div>

            <div className="text-center sm:text-right">
              <div className="font-bold text-white">Head Master / Principal Signature</div>
              <div className="mt-6 border-b border-gray-500 w-48 mx-auto sm:ml-auto sm:mr-0"></div>
              <div className="text-[10px] text-gray-400 mt-1">Kendriya Vidyalaya Seal</div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: PERFORMANCE ANALYTICS & CHARTS                                */}
      {/* ==================================================================== */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* Grade Distribution Bar Frequencies */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  <span>CBSE Primary Grade Frequency Distribution (A1 to E)</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Consolidated student counts across all filtered examinations and subjects ({totalAppearedSum} students total)
                </p>
              </div>

              <span className="text-xs text-indigo-300 font-mono font-bold bg-indigo-500/20 px-3 py-1 rounded-lg border border-indigo-500/30">
                Average PI: {overallAvgPI} / 100
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 pt-2">
              {GRADE_KEYS.map(grade => {
                const count = totalGradeSum[grade] || 0;
                const pct = totalAppearedSum > 0 ? Math.round((count / totalAppearedSum) * 100) : 0;

                const getBarColor = () => {
                  if (grade === 'A1') return 'bg-emerald-500 text-emerald-300';
                  if (grade === 'A2') return 'bg-teal-500 text-teal-300';
                  if (grade === 'B1') return 'bg-blue-500 text-blue-300';
                  if (grade === 'B2') return 'bg-cyan-500 text-cyan-300';
                  if (grade === 'C1') return 'bg-amber-500 text-amber-300';
                  if (grade === 'C2') return 'bg-orange-500 text-orange-300';
                  if (grade === 'D') return 'bg-yellow-500 text-yellow-300';
                  return 'bg-rose-500 text-rose-300';
                };

                return (
                  <div
                    key={grade}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center flex flex-col justify-between h-36"
                  >
                    <div>
                      <div className="text-xs font-bold font-mono text-indigo-200">Grade {grade}</div>
                      <div className="text-[10px] text-gray-400">
                        {grade === 'A1' ? '91-100%' : grade === 'A2' ? '81-90%' : grade === 'B1' ? '71-80%' : grade === 'B2' ? '61-70%' : grade === 'C1' ? '51-60%' : grade === 'C2' ? '41-50%' : grade === 'D' ? '33-40%' : '≤32%'}
                      </div>
                    </div>

                    <div className="font-serif text-2xl font-black text-white">{count}</div>

                    <div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getBarColor().split(' ')[0]}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-300 font-mono mt-1">{pct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subject Performance Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUBJECT_OPTIONS.map(sbj => {
              const subRecords = records.filter(r => r.subjectName === sbj.name || r.subjectId === sbj.id);
              const subAppeared = subRecords.reduce((acc, r) => acc + (r.appeared || r.totalAppeared || 0), 0);
              const subQualified = subRecords.reduce((acc, r) => acc + (r.qualified || r.passed || 0), 0);
              const subNeedsImp = subRecords.reduce((acc, r) => acc + (r.needsImprovement || 0), 0);
              const subPct = subAppeared > 0 ? ((subQualified / subAppeared) * 100).toFixed(1) : '100.0';

              const subGrades: PrimaryGradeCounts = {
                A1: subRecords.reduce((acc, r) => acc + (r.gradeCounts?.A1 || 0), 0),
                A2: subRecords.reduce((acc, r) => acc + (r.gradeCounts?.A2 || 0), 0),
                B1: subRecords.reduce((acc, r) => acc + (r.gradeCounts?.B1 || 0), 0),
                B2: subRecords.reduce((acc, r) => acc + (r.gradeCounts?.B2 || 0), 0),
                C1: subRecords.reduce((acc, r) => acc + (r.gradeCounts?.C1 || 0), 0),
                C2: subRecords.reduce((acc, r) => acc + (r.gradeCounts?.C2 || 0), 0),
                D: subRecords.reduce((acc, r) => acc + (r.gradeCounts?.D || 0), 0),
                E: subRecords.reduce((acc, r) => acc + (r.gradeCounts?.E || 0), 0)
              };
              const subPI = subAppeared > 0 ? calculateKvsPI(subGrades, subAppeared) : 0;

              return (
                <div key={sbj.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-3">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <div>
                      <h4 className="font-bold text-white text-sm">{sbj.name}</h4>
                      <p className="text-xs text-gray-400">{subRecords.length} recorded examination assessments</p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs border border-indigo-500/30">
                      PI: {subPI}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-black/30">
                      <div className="text-[10px] text-gray-400">Appeared</div>
                      <div className="font-bold text-white text-base mt-0.5">{subAppeared}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30">
                      <div className="text-[10px] text-emerald-400">Qualified</div>
                      <div className="font-bold text-emerald-300 text-base mt-0.5">{subQualified}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30">
                      <div className="text-[10px] text-rose-400">Needs Imp.</div>
                      <div className="font-bold text-rose-300 text-base mt-0.5">{subNeedsImp}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30">
                      <div className="text-[10px] text-amber-400">Pass %</div>
                      <div className="font-bold text-amber-300 text-base mt-0.5">{subPct}%</div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">Grade Breakdown</div>
                    <div className="flex items-center gap-1 text-[10px] font-mono">
                      {GRADE_KEYS.map(g => (
                        <div key={g} className="flex-1 text-center p-1 rounded bg-black/40 border border-white/5">
                          <span className="text-gray-400 block">{g}</span>
                          <span className="font-bold text-white">{subGrades[g] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: CBSE 8-POINT PRIMARY GRADING SCALE REFERENCE                  */}
      {/* ==================================================================== */}
      {activeTab === 'grading_key' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <span>CBSE & KVS 8-Point Scholastic Grading Scale (Classes III to V)</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Official mark range boundaries, qualitative achievement descriptors, grade points, and KVS Performance Index (PI) multipliers.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-950/60 text-emerald-200 border-b border-white/10 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-4 border-r border-white/10">Grade</th>
                    <th className="py-2.5 px-4 border-r border-white/10">Marks Range (%)</th>
                    <th className="py-2.5 px-4 border-r border-white/10">Qualitative Achievement</th>
                    <th className="py-2.5 px-4 border-r border-white/10 text-center">Status</th>
                    <th className="py-2.5 px-4 text-center">KVS PI Weightage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/5">
                    <td className="py-2.5 px-4 border-r border-white/10 font-bold text-emerald-400 font-mono text-sm">A1</td>
                    <td className="py-2.5 px-4 border-r border-white/10 font-mono font-bold text-white">91% - 100%</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-gray-200 font-medium">Outstanding / Top Mastery</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-center font-bold text-emerald-300">Qualified</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-300">100.0</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="py-2.5 px-4 border-r border-white/10 font-bold text-teal-400 font-mono text-sm">A2</td>
                    <td className="py-2.5 px-4 border-r border-white/10 font-mono font-bold text-white">81% - 90%</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-gray-200 font-medium">Excellent / High Competency</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-center font-bold text-emerald-300">Qualified</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-300">87.5</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="py-2.5 px-4 border-r border-white/10 font-bold text-blue-400 font-mono text-sm">B1</td>
                    <td className="py-2.5 px-4 border-r border-white/10 font-mono font-bold text-white">71% - 80%</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-gray-200 font-medium">Very Good / Solid Foundation</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-center font-bold text-emerald-300">Qualified</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-300">75.0</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="py-2.5 px-4 border-r border-white/10 font-bold text-cyan-400 font-mono text-sm">B2</td>
                    <td className="py-2.5 px-4 border-r border-white/10 font-mono font-bold text-white">61% - 70%</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-gray-200 font-medium">Good / Above Average</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-center font-bold text-emerald-300">Qualified</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-300">62.5</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="py-2.5 px-4 border-r border-white/10 font-bold text-amber-400 font-mono text-sm">C1</td>
                    <td className="py-2.5 px-4 border-r border-white/10 font-mono font-bold text-white">51% - 60%</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-gray-200 font-medium">Fair / Basic Conceptual Understanding</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-center font-bold text-emerald-300">Qualified</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-300">50.0</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="py-2.5 px-4 border-r border-white/10 font-bold text-orange-400 font-mono text-sm">C2</td>
                    <td className="py-2.5 px-4 border-r border-white/10 font-mono font-bold text-white">41% - 50%</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-gray-200 font-medium">Average / Meets Core Minimums</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-center font-bold text-emerald-300">Qualified</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-300">37.5</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="py-2.5 px-4 border-r border-white/10 font-bold text-yellow-400 font-mono text-sm">D</td>
                    <td className="py-2.5 px-4 border-r border-white/10 font-mono font-bold text-white">33% - 40%</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-gray-200 font-medium">Marginal Pass / Needs Guidance</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-center font-bold text-emerald-300">Qualified</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-300">25.0</td>
                  </tr>
                  <tr className="hover:bg-white/5 bg-rose-950/20">
                    <td className="py-2.5 px-4 border-r border-white/10 font-bold text-rose-400 font-mono text-sm">E</td>
                    <td className="py-2.5 px-4 border-r border-white/10 font-mono font-bold text-rose-300">32% & Below</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-rose-200 font-medium">Needs Intensive Remediation</td>
                    <td className="py-2.5 px-4 border-r border-white/10 text-center font-bold text-rose-400">Needs Improvement</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-400">0.0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD / EDIT RESULT ANALYSIS ROW                                */}
      {/* ==================================================================== */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <span>{editingItem.id ? 'Edit Result Analysis Entry' : 'Add New Result Analysis Entry'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Exam & Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-indigo-300">Exam</label>
                  <select
                    value={editingItem.exam || ''}
                    onChange={e => setEditingItem({ ...editingItem, exam: e.target.value })}
                    className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  >
                    {EXAM_OPTIONS.map(ex => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-indigo-300">Subject</label>
                  <select
                    value={editingItem.subjectName || ''}
                    onChange={e => setEditingItem({ ...editingItem, subjectName: e.target.value })}
                    className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  >
                    {SUBJECT_OPTIONS.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-indigo-300">Class & Section</label>
                  <select
                    value={editingItem.className || ''}
                    onChange={e => setEditingItem({ ...editingItem, className: e.target.value })}
                    className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  >
                    {CLASS_OPTIONS.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-indigo-300">No. of Students on Roll</label>
                  <input
                    type="number"
                    min={1}
                    value={editingItem.studentsOnRoll ?? 40}
                    onChange={e => setEditingItem({ ...editingItem, studentsOnRoll: Number(e.target.value) })}
                    className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-indigo-300">No. Appeared</label>
                  <input
                    type="number"
                    min={0}
                    value={editingItem.appeared ?? 40}
                    onChange={e => setEditingItem({ ...editingItem, appeared: Number(e.target.value) })}
                    className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Grade Counts Inputs (A1 to E) */}
              <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-2">
                <label className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                  CBSE 8-Point Grade Breakdown (Number of Students)
                </label>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
                  {GRADE_KEYS.map(g => (
                    <div key={g}>
                      <label className="text-[10px] font-mono font-bold text-gray-300 block text-center">
                        {g}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={editingItem.gradeCounts?.[g] ?? 0}
                        onChange={e => {
                          const val = Math.max(0, Number(e.target.value));
                          const newGrades = {
                            ...(editingItem.gradeCounts || {
                              A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0, D: 0, E: 0
                            }),
                            [g]: val
                          };
                          const sumQ = (newGrades.A1 || 0) + (newGrades.A2 || 0) + (newGrades.B1 || 0) + (newGrades.B2 || 0) + (newGrades.C1 || 0) + (newGrades.C2 || 0) + (newGrades.D || 0);
                          const totalApp = sumQ + (newGrades.E || 0);
                          setEditingItem({
                            ...editingItem,
                            gradeCounts: newGrades,
                            appeared: totalApp || editingItem.appeared,
                            qualified: sumQ,
                            needsImprovement: newGrades.E || 0,
                            qualifiedPercentage: totalApp > 0 ? Number(((sumQ / totalApp) * 100).toFixed(1)) : 100
                          });
                        }}
                        className="w-full mt-1 py-1.5 px-1 bg-black/60 border border-white/10 rounded-lg text-center text-xs text-white font-mono font-bold focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[10px] uppercase font-bold text-indigo-300">
                  Pedagogical Remarks & Action Plan
                </label>
                <textarea
                  rows={2}
                  value={editingItem.remarks || ''}
                  onChange={e => setEditingItem({ ...editingItem, remarks: e.target.value })}
                  placeholder="e.g. Remedial classes scheduled for underachieving students; special praise for math Olympiad qualifiers."
                  className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveModal}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"
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
