import React, { useState, useEffect, useMemo } from 'react';
import { ResultAnalysisClass11_12, ClassXIAssessmentRecord17g, ClassXIIMarksRecord17h } from '../types/academic';
import {
  db,
  DEFAULT_RESULT_ANALYSIS_XI_XII,
  DEFAULT_CLASS_XI_ASSESSMENT_17G,
  DEFAULT_CLASS_XII_MARKS_17H
} from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  TrendingUp,
  FileSpreadsheet,
  Award,
  Filter,
  Search,
  Plus,
  Edit2,
  Trash2,
  Printer,
  RotateCcw,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  HelpCircle,
  Layers,
  ChevronRight,
  Calculator,
  RefreshCw,
  X,
  Save,
  FileText
} from 'lucide-react';

interface ResultAnalysisXItoXIIProps {
  devMode?: boolean;
}

const EXAM_TYPES = [
  'UT',
  'MT',
  'HY',
  'PB',
  'SEE',
  'Periodic Test 1 (PT-1)',
  'Periodic Test 2 (PT-2)',
  'Half Yearly Exam',
  'Pre-Board 1 (PB-1)',
  'Pre-Board 2 (PB-2)',
  'Session Ending Exam (SEE)',
  'AISSCE Board Exam'
];

const SUBJECT_OPTIONS = [
  { id: 'sbj-11', name: 'Physics (042)' },
  { id: 'sbj-12', name: 'Chemistry (043)' },
  { id: 'sbj-02', name: 'Mathematics (041)' },
  { id: 'sbj-13', name: 'Biology (044)' },
  { id: 'sbj-14', name: 'Computer Science (083)' },
  { id: 'sbj-01', name: 'English Core (301)' },
  { id: 'sbj-15', name: 'Hindi Core (302)' },
  { id: 'sbj-16', name: 'Economics (030)' },
  { id: 'sbj-17', name: 'Accountancy (055)' },
  { id: 'sbj-18', name: 'Business Studies (054)' },
  { id: 'sbj-19', name: 'Physical Education (048)' }
];

const CLASS_OPTIONS = [
  { id: 'cls-11a', name: 'Class XI-A (Science)' },
  { id: 'cls-11b', name: 'Class XI-B (Science/Bio)' },
  { id: 'cls-11c', name: 'Class XI-C (Commerce)' },
  { id: 'cls-12a', name: 'Class XII-A (Science)' },
  { id: 'cls-12b', name: 'Class XII-B (Science/Bio)' },
  { id: 'cls-12c', name: 'Class XII-C (Commerce)' }
];

export const ResultAnalysisXItoXII: React.FC<ResultAnalysisXItoXIIProps> = ({ devMode }) => {
  const [records, setRecords] = useState<ResultAnalysisClass11_12[]>([]);
  const [scoresClassXI, setScoresClassXI] = useState<ClassXIAssessmentRecord17g[]>([]);
  const [scoresClassXII, setScoresClassXII] = useState<ClassXIIMarksRecord17h[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<'register' | 'analytics' | 'guidelines'>('register');
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>('All');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
  const [selectedPageFilter, setSelectedPageFilter] = useState<string>('All'); // 'All' | '1' | '2'
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ResultAnalysisClass11_12 | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<ResultAnalysisClass11_12>>({
    pageNo: 1,
    exam: 'UT',
    subjectName: 'Physics (042)',
    className: 'Class XI-A (Science)',
    studentsOnRoll: 38,
    appeared: 38,
    passed: 36,
    failed: 2,
    passPercentage: 94.7,
    range33to45: 5,
    range45to60: 9,
    range60to75: 11,
    range75to90: 7,
    range90Above: 4,
    classAverage: 67.4,
    performanceIndex: 68.2,
    highestScore: 96,
    lowestScore: 20,
    remarks: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const saved = await db.get<ResultAnalysisClass11_12[]>('setup:result_analysis_xi_xii');
    if (saved && saved.length > 0) {
      setRecords(saved);
    } else {
      setRecords(DEFAULT_RESULT_ANALYSIS_XI_XII);
      await db.set('setup:result_analysis_xi_xii', DEFAULT_RESULT_ANALYSIS_XI_XII);
    }

    const sc11 = (await db.get<ClassXIAssessmentRecord17g[]>('setup:class_xi_assessment_17g')) || DEFAULT_CLASS_XI_ASSESSMENT_17G;
    const sc12 = (await db.get<ClassXIIMarksRecord17h[]>('setup:class_xii_marks_17h')) || DEFAULT_CLASS_XII_MARKS_17H;
    setScoresClassXI(sc11);
    setScoresClassXII(sc12);

    setLoading(false);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Performance Index (PI) Calculation formula for Senior Secondary
  const calculatePI = (r33: number, r45: number, r60: number, r75: number, r90: number, appeared: number): number => {
    if (!appeared || appeared <= 0) return 0;
    const weightedSum = (r90 * 100) + (r75 * 82.5) + (r60 * 67.5) + (r45 * 52.5) + (r33 * 39.0);
    return Number((weightedSum / appeared).toFixed(1));
  };

  // Handle Form Change with real-time recalculation
  const handleFormChange = (field: keyof ResultAnalysisClass11_12, value: any) => {
    setFormState(prev => {
      const updated = { ...prev, [field]: value };

      const onRoll = Number(field === 'studentsOnRoll' ? value : updated.studentsOnRoll) || 0;
      const appeared = Number(field === 'appeared' ? value : updated.appeared) || 0;
      const r33 = Number(field === 'range33to45' ? value : updated.range33to45) || 0;
      const r45 = Number(field === 'range45to60' ? value : updated.range45to60) || 0;
      const r60 = Number(field === 'range60to75' ? value : updated.range60to75) || 0;
      const r75 = Number(field === 'range75to90' ? value : updated.range75to90) || 0;
      const r90 = Number(field === 'range90Above' ? value : updated.range90Above) || 0;

      const sumPassed = r33 + r45 + r60 + r75 + r90;
      const autoPassed = field === 'passed' ? Number(value) : sumPassed;
      const autoFailed = Math.max(0, appeared - autoPassed);
      const autoPassPct = appeared > 0 ? Number(((autoPassed / appeared) * 100).toFixed(1)) : 0;
      const autoPI = calculatePI(r33, r45, r60, r75, r90, appeared);

      return {
        ...updated,
        studentsOnRoll: onRoll,
        totalOnRoll: onRoll,
        appeared: appeared,
        totalAppeared: appeared,
        passed: autoPassed,
        qualified: autoPassed,
        failed: autoFailed,
        passPercentage: autoPassPct,
        qualifiedPercentage: autoPassPct,
        performanceIndex: autoPI,
        pi: autoPI
      };
    });
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    setFormState({
      pageNo: selectedPageFilter !== 'All' ? Number(selectedPageFilter) : 1,
      exam: 'UT',
      subjectName: 'Physics (042)',
      className: 'Class XI-A (Science)',
      studentsOnRoll: 38,
      appeared: 38,
      passed: 36,
      failed: 2,
      passPercentage: 94.7,
      range33to45: 5,
      range45to60: 9,
      range60to75: 11,
      range75to90: 7,
      range90Above: 4,
      classAverage: 68.0,
      performanceIndex: 69.2,
      highestScore: 95,
      lowestScore: 24,
      remarks: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: ResultAnalysisClass11_12) => {
    setEditingRecord(rec);
    setFormState({ ...rec });
    setIsModalOpen(true);
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this result analysis record?')) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      await db.set('setup:result_analysis_xi_xii', updated);
      showNotification('Record deleted successfully.');
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (window.confirm('Reset 18(b) Subject-Wise Result Analysis (Classes XI & XII) to official KVS defaults?')) {
      setRecords(DEFAULT_RESULT_ANALYSIS_XI_XII);
      await db.set('setup:result_analysis_xi_xii', DEFAULT_RESULT_ANALYSIS_XI_XII);
      showNotification('18(b) Result Analysis reset to official defaults.');
    }
  };

  // Save Record (Create / Update)
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.exam || !formState.subjectName || !formState.className) {
      alert('Please select Exam, Subject, and Class & Sec.');
      return;
    }

    const appeared = Number(formState.appeared) || 0;
    const passed = Number(formState.passed) || 0;
    const failed = Number(formState.failed) || Math.max(0, appeared - passed);
    const passPct = appeared > 0 ? Number(((passed / appeared) * 100).toFixed(1)) : 0;
    const pi = calculatePI(
      Number(formState.range33to45) || 0,
      Number(formState.range45to60) || 0,
      Number(formState.range60to75) || 0,
      Number(formState.range75to90) || 0,
      Number(formState.range90Above) || 0,
      appeared
    );

    const recordToSave: ResultAnalysisClass11_12 = {
      id: editingRecord ? editingRecord.id : `ra-xixii-${Date.now()}`,
      pageNo: Number(formState.pageNo) || 1,
      exam: formState.exam || 'UT',
      subjectName: formState.subjectName || 'Physics (042)',
      subjectId: SUBJECT_OPTIONS.find(s => s.name === formState.subjectName)?.id,
      className: formState.className || 'Class XI-A (Science)',
      classSectionId: CLASS_OPTIONS.find(c => c.name === formState.className)?.id,
      studentsOnRoll: Number(formState.studentsOnRoll) || 0,
      totalOnRoll: Number(formState.studentsOnRoll) || 0,
      appeared: appeared,
      totalAppeared: appeared,
      passed: passed,
      qualified: passed,
      failed: failed,
      passPercentage: passPct,
      qualifiedPercentage: passPct,
      range33to45: Number(formState.range33to45) || 0,
      range45to60: Number(formState.range45to60) || 0,
      range60to75: Number(formState.range60to75) || 0,
      range75to90: Number(formState.range75to90) || 0,
      range90Above: Number(formState.range90Above) || 0,
      classAverage: Number(formState.classAverage) || 0,
      performanceIndex: pi,
      pi: pi,
      highestScore: Number(formState.highestScore) || 100,
      lowestScore: Number(formState.lowestScore) || 0,
      remarks: formState.remarks || ''
    };

    let updatedList: ResultAnalysisClass11_12[] = [];
    if (editingRecord) {
      updatedList = records.map(r => r.id === editingRecord.id ? recordToSave : r);
    } else {
      updatedList = [recordToSave, ...records];
    }

    setRecords(updatedList);
    await db.set('setup:result_analysis_xi_xii', updatedList);
    setIsModalOpen(false);
    showNotification('18(b) Result Analysis row saved successfully.');
  };

  // Auto-sync / aggregate directly from Scholastic Assessment Records (17g & 17h)
  const handleAutoGenerateFromScholastic = async (examType: 'UT' | 'HY' | 'SEE' | 'PB') => {
    let generatedCount = 0;
    let updatedRecords = [...records];

    // 1. Process Class XI (17g)
    CLASS_OPTIONS.filter(c => c.id.startsWith('cls-11')).forEach(cls => {
      SUBJECT_OPTIONS.forEach(sbj => {
        const secLetter = cls.id.endsWith('b') ? 'B' : (cls.id.endsWith('c') ? 'C' : 'A');

        const matchingScores = scoresClassXI.filter(s => {
          const matchSub = (s.subjectName || '').toLowerCase().includes(sbj.name.toLowerCase()) || sbj.name.toLowerCase().includes((s.subjectName || '').toLowerCase());
          const matchCls = (s.className === 'XI' || s.className === cls.name || s.className.includes('XI')) && (s.section === secLetter || !s.section);
          return matchSub && matchCls;
        });

        if (matchingScores.length > 0) {
          let rFailed = 0;
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
              const ptVal = sc.pt1 ?? sc.pt2 ?? 18;
              percentage = (ptVal / 20) * 100;
            } else if (examType === 'HY') {
              percentage = sc.halfYearly !== null && sc.halfYearly !== undefined ? (sc.halfYearly / 70) * 100 : 68;
            } else if (examType === 'SEE') {
              const seeVal = sc.seeTotal ?? ((sc.seeTheory ?? 0) + (sc.seePractical ?? 0));
              percentage = seeVal > 0 ? (seeVal / 100) * 100 : 72;
            } else {
              percentage = 70;
            }

            percentage = Math.min(100, Math.max(0, percentage));
            totalScoreSum += percentage;
            if (percentage > maxScore) maxScore = percentage;
            if (percentage < minScore) minScore = percentage;

            if (percentage < 33) rFailed++;
            else if (percentage < 45) r33_45++;
            else if (percentage < 60) r45_60++;
            else if (percentage < 75) r60_75++;
            else if (percentage < 90) r75_90++;
            else r90_plus++;
          });

          const totalAppeared = matchingScores.length;
          const passedCount = totalAppeared - rFailed;
          const passPct = totalAppeared > 0 ? Number(((passedCount / totalAppeared) * 100).toFixed(1)) : 100;
          const avgScore = totalAppeared > 0 ? Number((totalScoreSum / totalAppeared).toFixed(1)) : 70;
          const pi = calculatePI(r33_45, r45_60, r60_75, r75_90, r90_plus, totalAppeared);

          const pageNum = 1;
          const newId = `ra-xixii-${cls.id}-${sbj.id}-${examType.toLowerCase()}`;

          const newEntry: ResultAnalysisClass11_12 = {
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
            passed: passedCount,
            qualified: passedCount,
            failed: rFailed,
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
            remarks: `Auto-aggregated from Module 17(g) Class XI Ledger (${matchingScores.length} students).`
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

    // 2. Process Class XII (17h)
    CLASS_OPTIONS.filter(c => c.id.startsWith('cls-12')).forEach(cls => {
      SUBJECT_OPTIONS.forEach(sbj => {
        const secLetter = cls.id.endsWith('b') ? 'B' : (cls.id.endsWith('c') ? 'C' : 'A');

        const matchingScores = scoresClassXII.filter(s => {
          const matchSub = (s.subjectName || '').toLowerCase().includes(sbj.name.toLowerCase()) || sbj.name.toLowerCase().includes((s.subjectName || '').toLowerCase());
          const matchCls = (s.className === 'XII' || s.className === cls.name || s.className.includes('XII')) && (s.section === secLetter || !s.section);
          return matchSub && matchCls;
        });

        if (matchingScores.length > 0) {
          let rFailed = 0;
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
              const ptVal = sc.pt1 ?? sc.pt2 ?? sc.m1 ?? 36;
              percentage = (ptVal / 40) * 100;
            } else if (examType === 'HY') {
              percentage = sc.hy !== null && sc.hy !== undefined ? (sc.hy / 80) * 100 : 70;
            } else if (examType === 'PB') {
              percentage = sc.pb1 ?? sc.pb2 ?? sc.pb3 ?? 72;
            } else {
              percentage = sc.aissce !== null && sc.aissce !== undefined ? (sc.aissce / 100) * 100 : 74;
            }

            percentage = Math.min(100, Math.max(0, percentage));
            totalScoreSum += percentage;
            if (percentage > maxScore) maxScore = percentage;
            if (percentage < minScore) minScore = percentage;

            if (percentage < 33) rFailed++;
            else if (percentage < 45) r33_45++;
            else if (percentage < 60) r45_60++;
            else if (percentage < 75) r60_75++;
            else if (percentage < 90) r75_90++;
            else r90_plus++;
          });

          const totalAppeared = matchingScores.length;
          const passedCount = totalAppeared - rFailed;
          const passPct = totalAppeared > 0 ? Number(((passedCount / totalAppeared) * 100).toFixed(1)) : 100;
          const avgScore = totalAppeared > 0 ? Number((totalScoreSum / totalAppeared).toFixed(1)) : 70;
          const pi = calculatePI(r33_45, r45_60, r60_75, r75_90, r90_plus, totalAppeared);

          const pageNum = 2;
          const newId = `ra-xixii-${cls.id}-${sbj.id}-${examType.toLowerCase()}`;

          const newEntry: ResultAnalysisClass11_12 = {
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
            passed: passedCount,
            qualified: passedCount,
            failed: rFailed,
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
            remarks: `Auto-aggregated from Module 17(h) Class XII Ledger (${matchingScores.length} students).`
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
      await db.set('setup:result_analysis_xi_xii', updatedRecords);
      showNotification(`Successfully synchronized ${generatedCount} records from Class XI & XII Scholastic Ledgers.`);
    } else {
      showNotification('No matching student scores found to sync. Ensure Class XI (17g) and XII (17h) rosters are filled.');
    }
  };

  // Filtered List
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchExam = selectedExamFilter === 'All' || r.exam === selectedExamFilter || (r.exam && r.exam.includes(selectedExamFilter));
      const matchSubject = selectedSubjectFilter === 'All' || r.subjectName.toLowerCase().includes(selectedSubjectFilter.toLowerCase());
      const matchClass = selectedClassFilter === 'All' || r.className.toLowerCase().includes(selectedClassFilter.toLowerCase());
      const matchPage = selectedPageFilter === 'All' || String(r.pageNo || 1) === selectedPageFilter;
      const matchSearch =
        searchTerm === '' ||
        r.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.exam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.remarks || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchExam && matchSubject && matchClass && matchPage && matchSearch;
    });
  }, [records, selectedExamFilter, selectedSubjectFilter, selectedClassFilter, selectedPageFilter, searchTerm]);

  // Aggregate Metrics
  const aggregateMetrics = useMemo(() => {
    const totalEntries = filteredRecords.length;
    const totalStudentsOnRoll = filteredRecords.reduce((sum, r) => sum + (r.studentsOnRoll || 0), 0);
    const totalAppeared = filteredRecords.reduce((sum, r) => sum + (r.appeared || 0), 0);
    const totalPassed = filteredRecords.reduce((sum, r) => sum + (r.passed || 0), 0);
    const totalFailed = filteredRecords.reduce((sum, r) => sum + (r.failed || 0), 0);
    const overallPassPct = totalAppeared > 0 ? Number(((totalPassed / totalAppeared) * 100).toFixed(1)) : 0;

    const totalR33 = filteredRecords.reduce((sum, r) => sum + (r.range33to45 || 0), 0);
    const totalR45 = filteredRecords.reduce((sum, r) => sum + (r.range45to60 || 0), 0);
    const totalR60 = filteredRecords.reduce((sum, r) => sum + (r.range60to75 || 0), 0);
    const totalR75 = filteredRecords.reduce((sum, r) => sum + (r.range75to90 || 0), 0);
    const totalR90 = filteredRecords.reduce((sum, r) => sum + (r.range90Above || 0), 0);

    const overallPI = calculatePI(totalR33, totalR45, totalR60, totalR75, totalR90, totalAppeared);
    const totalHighAchievers = totalR75 + totalR90;
    const highAchieverPct = totalAppeared > 0 ? Number(((totalHighAchievers / totalAppeared) * 100).toFixed(1)) : 0;

    return {
      totalEntries,
      totalStudentsOnRoll,
      totalAppeared,
      totalPassed,
      totalFailed,
      overallPassPct,
      totalR33,
      totalR45,
      totalR60,
      totalR75,
      totalR90,
      overallPI,
      totalHighAchievers,
      highAchieverPct
    };
  }, [filteredRecords]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Dev Mode Traceability Badge */}
      {devMode && (
        <DevModeBadge
          pages={32}
          title="18(b) विषयानुसार परिणाम विश्लेषण (कक्षाएँ-11 & 12) (SUBJECT WISE RESULT ANALYSIS - Page 32, Landscape Format)"
        />
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>KVS Teacher Diary • Middle & Senior Secondary Portal (P-32)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              18(b) विषयानुसार परिणाम विश्लेषण (कक्षाएँ-11 & 12)
            </h1>
            <h2 className="text-sm font-bold text-slate-300 tracking-wide mt-0.5 uppercase">
              SUBJECT WISE RESULT ANALYSIS (FOR CLASSES XI & XII)
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Official 13-column Senior Secondary marks bracket register tracking examination performance, pass percentages, failed counts, 5-tier marks distribution spectrum, and KVS Quality Performance Index (PI).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shadow transition"
              title="Print official landscape register"
            >
              <Printer className="w-4 h-4 text-purple-400" />
              <span>Print Landscape Register</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Result Analysis Row</span>
            </button>
          </div>
        </div>

        {/* Quick Sync & Reset Action Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-purple-400" />
              Auto-Sync from Scholastic Marks:
            </span>
            <button
              onClick={() => handleAutoGenerateFromScholastic('UT')}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-purple-950 hover:border-purple-600 border border-slate-700 text-slate-300 rounded-lg transition text-[11px] font-medium"
            >
              Sync UT / Unit Tests
            </button>
            <button
              onClick={() => handleAutoGenerateFromScholastic('HY')}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-purple-950 hover:border-purple-600 border border-slate-700 text-slate-300 rounded-lg transition text-[11px] font-medium"
            >
              Sync Half Yearly
            </button>
            <button
              onClick={() => handleAutoGenerateFromScholastic('PB')}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-purple-950 hover:border-purple-600 border border-slate-700 text-slate-300 rounded-lg transition text-[11px] font-medium"
            >
              Sync Pre-Board (XII)
            </button>
            <button
              onClick={() => handleAutoGenerateFromScholastic('SEE')}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-purple-950 hover:border-purple-600 border border-slate-700 text-slate-300 rounded-lg transition text-[11px] font-medium"
            >
              Sync Annual / SEE (XI)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1 text-slate-400 hover:text-slate-200 transition text-[11px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Key Metric KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Entries Count</div>
          <div className="text-xl font-black text-white mt-1">{aggregateMetrics.totalEntries}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{aggregateMetrics.totalStudentsOnRoll} Students on Roll</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Appeared</div>
          <div className="text-xl font-black text-indigo-400 mt-1">{aggregateMetrics.totalAppeared}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Students Examined</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Passed (≥33%)</div>
          <div className="text-xl font-black text-emerald-400 mt-1">{aggregateMetrics.totalPassed}</div>
          <div className="text-[10px] text-emerald-400 font-bold mt-0.5">{aggregateMetrics.overallPassPct}% Pass Rate</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Failed (&lt;33%)</div>
          <div className="text-xl font-black text-rose-400 mt-1">{aggregateMetrics.totalFailed}</div>
          <div className="text-[10px] text-rose-400 font-bold mt-0.5">Remedial Focus</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">High Achievers (≥75%)</div>
          <div className="text-xl font-black text-purple-400 mt-1">{aggregateMetrics.totalHighAchievers}</div>
          <div className="text-[10px] text-purple-300 font-bold mt-0.5">{aggregateMetrics.highAchieverPct}% Distinction</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Performance Index</div>
          <div className="text-xl font-black text-amber-400 mt-1">{aggregateMetrics.overallPI}</div>
          <div className="text-[10px] text-amber-300 font-bold mt-0.5">KVS PI (Scale 0-100)</div>
        </div>
      </div>

      {/* Main View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('register')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'register'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Official 18(b) Register Table</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'analytics'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Visual Performance Spectrum</span>
        </button>

        <button
          onClick={() => setActiveTab('guidelines')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'guidelines'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Senior Secondary Range Key & Guidelines</span>
        </button>
      </div>

      {/* TAB 1: OFFICIAL REGISTER TABLE */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Filter by Exam</label>
                <select
                  value={selectedExamFilter}
                  onChange={(e) => setSelectedExamFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="All">All Exams (UT/MT/HY/PB/SEE)</option>
                  {EXAM_TYPES.map(ex => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Filter by Subject</label>
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="All">All Subjects</option>
                  {SUBJECT_OPTIONS.map(sbj => (
                    <option key={sbj.id} value={sbj.name}>{sbj.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Filter by Class & Sec</label>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="All">All Classes (XI & XII)</option>
                  {CLASS_OPTIONS.map(cls => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Filter by Page View</label>
                <select
                  value={selectedPageFilter}
                  onChange={(e) => setSelectedPageFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="All">All Pages (Pages 1 & 2)</option>
                  <option value="1">Page 1 (Class XI Term 1 / Mid-Year)</option>
                  <option value="2">Page 2 (Class XII Pre-Board / Boards)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Search Table</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search subject, exam, remarks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* OFFICIAL 13-COLUMN TABLE (MATCHING UPLOADED IMAGE) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  {/* Official Header Strip */}
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-extrabold text-center">
                    <th className="p-2.5 border-r border-slate-800 min-w-[90px]">UT / MT /<br />HY / PB /<br />SEE</th>
                    <th className="p-2.5 border-r border-slate-800 min-w-[130px] text-left">Subject</th>
                    <th className="p-2.5 border-r border-slate-800 min-w-[100px]">Class &amp;<br />Sec</th>
                    <th className="p-2.5 border-r border-slate-800 min-w-[75px]">No. of<br />Students<br />on Roll</th>
                    <th className="p-2.5 border-r border-slate-800 min-w-[65px] bg-slate-900">Appeared</th>
                    <th className="p-2.5 border-r border-slate-800 min-w-[65px] text-emerald-400 bg-emerald-950/20">Passed</th>
                    <th className="p-2.5 border-r border-slate-800 min-w-[75px] text-rose-400 bg-rose-950/20">Failed</th>
                    <th className="p-2.5 border-r border-slate-800 min-w-[65px] text-amber-300 bg-amber-950/20">Pass<br />%</th>
                    <th className="p-2.5 border-r border-slate-800 min-w-[65px]">33%<br />to<br />&lt;45%</th>
                    <th className="p-2.5 border-r border-slate-800 min-w-[65px]">45%<br />to<br />&lt;60%</th>
                    <th className="p-2.5 border-r border-slate-800 min-w-[65px]">60%<br />to<br />&lt;75%</th>
                    <th className="p-2.5 border-r border-slate-800 min-w-[65px] text-purple-300">75%<br />to<br />&lt;90%</th>
                    <th className="p-2.5 border-r border-slate-800 min-w-[65px] text-indigo-300">90%<br />and<br />above</th>
                    <th className="p-2.5 min-w-[90px] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="p-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle className="w-8 h-8 text-slate-600" />
                          <span className="text-sm font-semibold text-slate-400">No result analysis records match the selected filter.</span>
                          <button
                            onClick={handleOpenCreateModal}
                            className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-bold underline"
                          >
                            Add a new row for Class XI or XII
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-800/50 transition">
                        <td className="p-2.5 border-r border-slate-800 text-center font-bold text-slate-200">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                            {row.exam}
                          </span>
                        </td>
                        <td className="p-2.5 border-r border-slate-800 font-semibold text-slate-100">
                          <div>{row.subjectName}</div>
                          {row.remarks && (
                            <div className="text-[10px] text-slate-500 font-normal truncate max-w-[160px]" title={row.remarks}>
                              {row.remarks}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-center text-slate-300 font-medium">
                          {row.className}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-center font-mono text-slate-300">
                          {row.studentsOnRoll}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-center font-mono font-bold text-slate-200 bg-slate-950/30">
                          {row.appeared}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-center font-mono font-bold text-emerald-400 bg-emerald-950/10">
                          {row.passed}
                        </td>
                        <td className={`p-2.5 border-r border-slate-800 text-center font-mono font-bold ${row.failed > 0 ? 'text-rose-400 bg-rose-950/20' : 'text-slate-500'}`}>
                          {row.failed}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-center font-mono font-black text-amber-300 bg-amber-950/10">
                          {row.passPercentage}%
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-center font-mono text-slate-300">
                          {row.range33to45}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-center font-mono text-slate-300">
                          {row.range45to60}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-center font-mono text-slate-300">
                          {row.range60to75}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-center font-mono font-bold text-purple-300 bg-purple-950/10">
                          {row.range75to90}
                        </td>
                        <td className="p-2.5 border-r border-slate-800 text-center font-mono font-bold text-indigo-300 bg-indigo-950/10">
                          {row.range90Above}
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(row)}
                              className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                              title="Edit row"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(row.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Grand Totals Summary Row */}
                {filteredRecords.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-950 font-black text-slate-200 border-t-2 border-slate-800 text-center">
                      <td colSpan={3} className="p-2.5 text-right uppercase tracking-wider text-[11px] text-purple-400 border-r border-slate-800">
                        Grand Totals &amp; Aggregate %:
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-mono text-white">
                        {aggregateMetrics.totalStudentsOnRoll}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-mono text-white bg-slate-900">
                        {aggregateMetrics.totalAppeared}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-mono text-emerald-400 bg-emerald-950/30">
                        {aggregateMetrics.totalPassed}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-mono text-rose-400 bg-rose-950/30">
                        {aggregateMetrics.totalFailed}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-mono text-amber-300 bg-amber-950/30">
                        {aggregateMetrics.overallPassPct}%
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-mono text-slate-300">
                        {aggregateMetrics.totalR33}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-mono text-slate-300">
                        {aggregateMetrics.totalR45}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-mono text-slate-300">
                        {aggregateMetrics.totalR60}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-mono text-purple-300 bg-purple-950/30">
                        {aggregateMetrics.totalR75}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-mono text-indigo-300 bg-indigo-950/30">
                        {aggregateMetrics.totalR90}
                      </td>
                      <td className="p-2.5 text-xs text-amber-400 font-mono">
                        PI: {aggregateMetrics.overallPI}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL PERFORMANCE SPECTRUM */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>5-Bracket Marks Distribution Spectrum (Senior Secondary Classes XI & XII)</span>
            </h3>

            <div className="space-y-3">
              {/* 90% and above */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-indigo-300 mb-1">
                  <span>90% and above (Outstanding / A1 Tier)</span>
                  <span>{aggregateMetrics.totalR90} students ({aggregateMetrics.totalAppeared > 0 ? ((aggregateMetrics.totalR90 / aggregateMetrics.totalAppeared) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500"
                    style={{ width: `${aggregateMetrics.totalAppeared > 0 ? (aggregateMetrics.totalR90 / aggregateMetrics.totalAppeared) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* 75% to <90% */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-purple-300 mb-1">
                  <span>75% to &lt;90% (Distinction / A2-B1 Tier)</span>
                  <span>{aggregateMetrics.totalR75} students ({aggregateMetrics.totalAppeared > 0 ? ((aggregateMetrics.totalR75 / aggregateMetrics.totalAppeared) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${aggregateMetrics.totalAppeared > 0 ? (aggregateMetrics.totalR75 / aggregateMetrics.totalAppeared) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* 60% to <75% */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-blue-300 mb-1">
                  <span>60% to &lt;75% (First Division / B2-C1 Tier)</span>
                  <span>{aggregateMetrics.totalR60} students ({aggregateMetrics.totalAppeared > 0 ? ((aggregateMetrics.totalR60 / aggregateMetrics.totalAppeared) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${aggregateMetrics.totalAppeared > 0 ? (aggregateMetrics.totalR60 / aggregateMetrics.totalAppeared) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* 45% to <60% */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-amber-300 mb-1">
                  <span>45% to &lt;60% (Second Division / C2-D Tier)</span>
                  <span>{aggregateMetrics.totalR45} students ({aggregateMetrics.totalAppeared > 0 ? ((aggregateMetrics.totalR45 / aggregateMetrics.totalAppeared) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${aggregateMetrics.totalAppeared > 0 ? (aggregateMetrics.totalR45 / aggregateMetrics.totalAppeared) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* 33% to <45% */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-orange-300 mb-1">
                  <span>33% to &lt;45% (Third Division / Passing Threshold)</span>
                  <span>{aggregateMetrics.totalR33} students ({aggregateMetrics.totalAppeared > 0 ? ((aggregateMetrics.totalR33 / aggregateMetrics.totalAppeared) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${aggregateMetrics.totalAppeared > 0 ? (aggregateMetrics.totalR33 / aggregateMetrics.totalAppeared) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Failed <33% */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-rose-400 mb-1">
                  <span>Failed / Essential Repeat (&lt;33%)</span>
                  <span>{aggregateMetrics.totalFailed} students ({aggregateMetrics.totalAppeared > 0 ? ((aggregateMetrics.totalFailed / aggregateMetrics.totalAppeared) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-500"
                    style={{ width: `${aggregateMetrics.totalAppeared > 0 ? (aggregateMetrics.totalFailed / aggregateMetrics.totalAppeared) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subject Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.map((rec) => (
              <div key={rec.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <div className="text-xs font-bold text-white">{rec.subjectName}</div>
                    <div className="text-[11px] text-slate-400">{rec.className} • {rec.exam}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    rec.passPercentage >= 95 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    rec.passPercentage >= 80 ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                    'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {rec.passPercentage}% Pass
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">Appeared</div>
                    <div className="font-bold text-white mt-0.5">{rec.appeared}</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">Passed</div>
                    <div className="font-bold text-emerald-400 mt-0.5">{rec.passed}</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">Failed</div>
                    <div className="font-bold text-rose-400 mt-0.5">{rec.failed}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                  <span className="text-slate-400">KVS Performance Index:</span>
                  <span className="font-mono font-bold text-amber-300">{rec.performanceIndex ?? rec.pi ?? '--'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GUIDELINES & SENIOR SECONDARY RANGE KEY */}
      {activeTab === 'guidelines' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <span>Official KVS &amp; CBSE Senior Secondary Result Analysis Instructions (Classes XI &amp; XII)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Instructions for filling Module 18(b) (Page 32) in the Kendriya Vidyalaya Teacher's Diary.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">1. Marks Distribution Brackets</h4>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">90% and above:</strong> Outstanding performance (A1 equivalent).</li>
                <li><strong className="text-white">75% to &lt;90%:</strong> Distinction category (A2 / B1 grade band).</li>
                <li><strong className="text-white">60% to &lt;75%:</strong> First Division achievers (B2 / C1 band).</li>
                <li><strong className="text-white">45% to &lt;60%:</strong> Second Division students (C2 band).</li>
                <li><strong className="text-white">33% to &lt;45%:</strong> Passing range (D grade band).</li>
                <li><strong className="text-rose-400">Failed (&lt;33%):</strong> Essential repeat; remedial diagnostic measures mandatory in Module 20.</li>
              </ul>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">2. KVS Performance Index (PI) Calculation</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                The Quality Performance Index (PI) is calculated using the official weighted scheme:
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300">
                PI = [(N₉₀ × 100) + (N₇₅ × 82.5) + (N₆₀ × 67.5) + (N₄₅ × 52.5) + (N₃₃ × 39.0)] ÷ Total Appeared
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                A PI score above 70 reflects high academic quality; PI above 80 represents exceptional excellence.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {editingRecord ? 'Edit Result Analysis Row (XI & XII)' : 'Add New Result Analysis Row (18b)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Exam / Assessment <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formState.exam}
                    onChange={(e) => handleFormChange('exam', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  >
                    {EXAM_TYPES.map(ex => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Subject <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formState.subjectName}
                    onChange={(e) => handleFormChange('subjectName', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  >
                    {SUBJECT_OPTIONS.map(sbj => (
                      <option key={sbj.id} value={sbj.name}>{sbj.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Class &amp; Section <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formState.className}
                    onChange={(e) => handleFormChange('className', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  >
                    {CLASS_OPTIONS.map(cls => (
                      <option key={cls.id} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roster Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">No. on Roll</label>
                  <input
                    type="number"
                    min={1}
                    value={formState.studentsOnRoll}
                    onChange={(e) => handleFormChange('studentsOnRoll', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Appeared</label>
                  <input
                    type="number"
                    min={0}
                    value={formState.appeared}
                    onChange={(e) => handleFormChange('appeared', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-emerald-400 block mb-1">Passed (≥33%)</label>
                  <input
                    type="number"
                    min={0}
                    value={formState.passed}
                    onChange={(e) => handleFormChange('passed', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-emerald-700 rounded-lg p-2 text-emerald-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-rose-400 block mb-1">Failed (&lt;33%)</label>
                  <input
                    type="number"
                    min={0}
                    value={formState.failed}
                    onChange={(e) => handleFormChange('failed', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-rose-700 rounded-lg p-2 text-rose-300 font-mono font-bold"
                  />
                </div>
              </div>

              {/* 5-Bracket Distribution Inputs */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                  5-Bracket Score Distribution (Must sum to Passed count)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">33% to &lt;45%</label>
                    <input
                      type="number"
                      min={0}
                      value={formState.range33to45}
                      onChange={(e) => handleFormChange('range33to45', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">45% to &lt;60%</label>
                    <input
                      type="number"
                      min={0}
                      value={formState.range45to60}
                      onChange={(e) => handleFormChange('range45to60', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">60% to &lt;75%</label>
                    <input
                      type="number"
                      min={0}
                      value={formState.range60to75}
                      onChange={(e) => handleFormChange('range60to75', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-purple-300 block mb-1">75% to &lt;90%</label>
                    <input
                      type="number"
                      min={0}
                      value={formState.range75to90}
                      onChange={(e) => handleFormChange('range75to90', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-purple-800 rounded-lg p-2 text-purple-200 font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-indigo-300 block mb-1">90% and above</label>
                    <input
                      type="number"
                      min={0}
                      value={formState.range90Above}
                      onChange={(e) => handleFormChange('range90Above', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-indigo-800 rounded-lg p-2 text-indigo-200 font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Stats Display */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-purple-950/20 border border-purple-500/30 rounded-xl p-3 text-center">
                <div>
                  <div className="text-[10px] text-purple-300 font-semibold">Pass Percentage</div>
                  <div className="text-base font-black text-amber-300 font-mono mt-0.5">{formState.passPercentage}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-purple-300 font-semibold">Performance Index</div>
                  <div className="text-base font-black text-purple-300 font-mono mt-0.5">{formState.performanceIndex}</div>
                </div>
                <div>
                  <div className="text-[10px] text-purple-300 font-semibold">Highest Score</div>
                  <input
                    type="number"
                    value={formState.highestScore}
                    onChange={(e) => handleFormChange('highestScore', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center font-mono text-xs text-white mt-0.5"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-purple-300 font-semibold">Lowest Score</div>
                  <input
                    type="number"
                    value={formState.lowestScore}
                    onChange={(e) => handleFormChange('lowestScore', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center font-mono text-xs text-white mt-0.5"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Remarks &amp; Quality Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 100% pass achieved with high scores in practical numericals and board problem sets."
                  value={formState.remarks}
                  onChange={(e) => handleFormChange('remarks', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Result Analysis Row</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultAnalysisXItoXII;
