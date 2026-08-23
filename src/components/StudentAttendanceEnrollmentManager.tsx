import React, { useState, useEffect, useMemo } from 'react';
import {
  StudentProfile,
  ClassSection,
  TransferCertificateRecord,
  StudentAttendanceRecord,
  ClassDailyAttendanceRecord
} from '../types/academic';
import { UserAccount } from '../types/auth';
import {
  db,
  DEFAULT_STUDENTS,
  DEFAULT_CLASSES,
  DEFAULT_TRANSFER_CERTIFICATES,
  DEFAULT_STUDENT_ATTENDANCE,
  DEFAULT_CLASS_DAILY_ATTENDANCE
} from '../lib/storage';
import { useActiveWorkingDate } from '../lib/activeDateContext';
import {
  calculateCasteCategoryMatrix,
  calculateAdmnCategoryMatrix,
  generateMonthlyDailyAttendanceGrid,
  exportEnrollmentToExcel,
  exportDailyAttendanceToExcel,
  CasteCategoryRow,
  AdmnCategoryRow,
  DailyAttendanceRow
} from '../lib/enrollmentEngine';
import { isAdminOrDataManager, isClassTeacherOrCoTeacher, isAdmin } from '../lib/permissions';
import {
  Users,
  Calendar as CalIcon,
  Download,
  Upload,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  CalendarDays,
  FileText,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  GraduationCap,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  Printer
} from 'lucide-react';
import { DevModeBadge } from './DevModeBadge';

interface StudentAttendanceEnrollmentManagerProps {
  devMode?: boolean;
  currentUser?: UserAccount | null;
  onSaved?: () => void;
}

type ActiveSubTab = 'enrollment' | 'daily_attendance' | 'tc_manager' | 'excel_sync';

export const StudentAttendanceEnrollmentManager: React.FC<StudentAttendanceEnrollmentManagerProps> = ({
  devMode,
  currentUser,
  onSaved
}) => {
  const { activeDate } = useActiveWorkingDate();
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>('enrollment');
  const [academicYear, setAcademicYear] = useState<'2025-26' | '2026-27'>('2026-27');
  const [asOnDate, setAsOnDate] = useState<string>(activeDate);

  // Month selection for daily attendance (Default active working date month)
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const y = Number(activeDate.split('-')[0]);
    return isNaN(y) ? 2026 : y;
  });
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(() => {
    const m = Number(activeDate.split('-')[1]);
    return isNaN(m) ? 7 : m - 1;
  });

  // Core Data
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [tcRecords, setTcRecords] = useState<TransferCertificateRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<ClassDailyAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // TC Issue Modal State
  const [isTcModalOpen, setIsTcModalOpen] = useState(false);
  const [selectedStudentForTc, setSelectedStudentForTc] = useState<StudentProfile | null>(null);
  const [tcDateOfLeaving, setTcDateOfLeaving] = useState<string>(activeDate);
  const [tcDateOfIssue, setTcDateOfIssue] = useState<string>(activeDate);
  const [tcReason, setTcReason] = useState<TransferCertificateRecord['reasonForLeaving']>('Parent Transfer');
  const [tcDestinationSchool, setTcDestinationSchool] = useState<string>('');
  const [tcRemarks, setTcRemarks] = useState<string>('');

  // Daily Attendance Quick-Mark Modal State
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [markDate, setMarkDate] = useState<string>(activeDate);
  const [markClass, setMarkClass] = useState<string>('I');
  const [markAbsentRollNos, setMarkAbsentRollNos] = useState<string>('');

  useEffect(() => {
    if (activeDate) {
      setAsOnDate(activeDate);
      setMarkDate(activeDate);
      const [y, m] = activeDate.split('-').map(Number);
      if (!isNaN(y)) setSelectedYear(y);
      if (!isNaN(m)) setSelectedMonthIndex(m - 1);
    }
  }, [activeDate]);

  const isPrincipalOrAdmin = currentUser?.role === 'admin' || currentUser?.activePersona === 'admin';
  const isDataEntryManager = currentUser?.role === 'data_entry_manager' || currentUser?.activePersona === 'data_entry_manager';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storedStudents, storedClasses, storedTcs, storedAtt] = await Promise.all([
        db.get<StudentProfile[]>('setup:students'),
        db.get<ClassSection[]>('setup:classes'),
        db.get<TransferCertificateRecord[]>('setup:transfer_certificates'),
        db.get<ClassDailyAttendanceRecord[]>('setup:class_daily_attendance')
      ]);

      setStudents(storedStudents && storedStudents.length > 0 ? storedStudents : DEFAULT_STUDENTS);
      setClasses(storedClasses && storedClasses.length > 0 ? storedClasses : DEFAULT_CLASSES);
      setTcRecords(storedTcs && storedTcs.length > 0 ? storedTcs : DEFAULT_TRANSFER_CERTIFICATES);
      setAttendanceRecords(storedAtt && storedAtt.length > 0 ? storedAtt : DEFAULT_CLASS_DAILY_ATTENDANCE);
    } catch (err) {
      console.error('Error loading enrollment & attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  // Section 1: Caste Category Matrix Calculation
  const casteMatrix: CasteCategoryRow[] = useMemo(() => {
    return calculateCasteCategoryMatrix(students, classes, tcRecords);
  }, [students, classes, tcRecords]);

  // Section 2: Admn Category Matrix Calculation
  const admnMatrix: AdmnCategoryRow[] = useMemo(() => {
    return calculateAdmnCategoryMatrix(students, classes, tcRecords);
  }, [students, classes, tcRecords]);

  // Daily Attendance Matrix for selected month & year
  const dailyAttendanceGrid: DailyAttendanceRow[] = useMemo(() => {
    return generateMonthlyDailyAttendanceGrid(students, attendanceRecords, selectedYear, selectedMonthIndex);
  }, [students, attendanceRecords, selectedYear, selectedMonthIndex]);

  // Active student count after excluding issued TCs
  const issuedTcStudentIds = useMemo(() => {
    return new Set(tcRecords.filter(t => t.status === 'Issued').map(t => t.studentId));
  }, [tcRecords]);

  const activeStudents = useMemo(() => {
    return students.filter(s => !issuedTcStudentIds.has(s.id) && !issuedTcStudentIds.has(s.studentId));
  }, [students, issuedTcStudentIds]);

  // Handle TC Issuance
  const handleIssueTc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForTc) return;

    const newTc: TransferCertificateRecord = {
      id: `tc-${Date.now()}`,
      tcNumber: `TC/KVK/${selectedYear}/${String(tcRecords.length + 1).padStart(3, '0')}`,
      studentId: selectedStudentForTc.id || selectedStudentForTc.studentId,
      studentName: selectedStudentForTc.studentName,
      admissionNo: selectedStudentForTc.admissionNo || selectedStudentForTc.studentId || 'KV-KUTRA',
      penNo: selectedStudentForTc.penNo,
      apaarId: selectedStudentForTc.apaarId,
      fatherName: selectedStudentForTc.fatherName,
      motherName: selectedStudentForTc.motherName,
      nationality: 'Indian',
      socialCategory: selectedStudentForTc.socialCategory || 'GEN',
      className: selectedStudentForTc.className,
      section: selectedStudentForTc.section || 'A',
      admissionDateInSchool: selectedStudentForTc.admissionDate || '2025-04-01',
      dateOfLeaving: tcDateOfLeaving,
      dateOfIssueTc: tcDateOfIssue,
      reasonForLeaving: tcReason,
      destinationSchoolName: tcDestinationSchool.trim() || undefined,
      totalWorkingDays: 220,
      daysPresent: 195,
      conductAndBehaviour: 'Good',
      duesCleared: true,
      remarks: tcRemarks.trim() || undefined,
      issuedByPrincipalName: 'Shri Hemananda Barik (Principal I/c)',
      status: 'Issued',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedTcList = [...tcRecords, newTc];
    setTcRecords(updatedTcList);
    await db.set('setup:transfer_certificates', updatedTcList);

    setIsTcModalOpen(false);
    setSelectedStudentForTc(null);
    showFeedback(`Transfer Certificate (${newTc.tcNumber}) issued for ${selectedStudentForTc.studentName}`);
    if (onSaved) onSaved();
  };

  // Handle Fast Class Roll-Call Submission
  const handleSaveClassAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    const clsStudents = activeStudents.filter(s => (s.className || '').trim().toUpperCase() === markClass);
    const totalClassStrength = clsStudents.length;

    // Parse absent roll numbers
    const rawRolls = markAbsentRollNos.split(',').map(r => r.trim()).filter(r => r.length > 0);
    const absentRollNos = rawRolls.map(r => parseInt(r, 10)).filter(n => !isNaN(n));
    const absentCount = absentRollNos.length;
    const presentCount = Math.max(0, totalClassStrength - absentCount);

    const recId = `att-cls-${markClass}-${markDate}`;
    const newRecord: ClassDailyAttendanceRecord = {
      id: recId,
      date: markDate,
      className: markClass,
      section: 'A',
      totalStudents: totalClassStrength,
      presentCount,
      absentCount,
      absentStudentIds: [],
      absentRollNos,
      markedByTeacherName: currentUser?.name || 'Class Teacher',
      markedAt: new Date().toISOString()
    };

    const updatedList = [
      ...attendanceRecords.filter(r => r.id !== recId && !(r.date === markDate && r.className === markClass)),
      newRecord
    ];

    setAttendanceRecords(updatedList);
    await db.set('setup:class_daily_attendance', updatedList);

    setIsMarkModalOpen(false);
    showFeedback(`Attendance saved for Class ${markClass} on ${markDate} (Pres: ${presentCount}, Abs: ${absentCount})`);
    if (onSaved) onSaved();
  };

  // Export handlers
  const handleExportEnrollment = () => {
    const formattedDate = asOnDate ? asOnDate.split('-').reverse().join('/') : '31/07/2026';
    exportEnrollmentToExcel(casteMatrix, admnMatrix, formattedDate);
    showFeedback('Exported Students Enrolment (.xlsx) successfully!');
  };

  const handleExportDailyAttendance = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    exportDailyAttendanceToExcel(dailyAttendanceGrid, monthNames[selectedMonthIndex], selectedYear);
    showFeedback('Exported Daily Student Attendance (.xlsx) successfully!');
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-purple-300 flex flex-col items-center justify-center gap-3">
        <RotateCcw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="text-sm font-medium">Loading Student Attendance, TC & Enrollment Hub...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 p-5 rounded-2xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-600/30 border border-purple-500/50 text-purple-300">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 m-0">
              <span>Student Attendance, TC & Monthly Enrollment</span>
              {devMode && <DevModeBadge pages={[1, 52]} title="KV Kutra Official Formats" />}
            </h2>
          </div>
          <p className="text-xs text-purple-200/80 m-0">
            Official KV Kutra RO Returns &bull; Caste & Admission Category Breakdown &bull; Daily Roll-Call Grid with 2026 Holiday Master &bull; Transfer Certificates.
          </p>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={academicYear}
            onChange={e => setAcademicYear(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-purple-500/40 rounded-xl text-purple-200 font-bold focus:outline-none"
          >
            <option value="2026-27">Session: 2026-27</option>
            <option value="2025-26">Session: 2025-26</option>
          </select>

          <button
            onClick={() => setIsTcModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/30 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Issue TC</span>
          </button>

          <button
            onClick={() => setIsMarkModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Mark Daily Attendance</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold animate-fadeIn ${
            msg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-300'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('enrollment')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'enrollment'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Monthly Enrollment Return (RO Format)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('daily_attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'daily_attendance'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Daily Student Attendance Matrix</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tc_manager')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'tc_manager'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Transfer Certificates ({tcRecords.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: MONTHLY ENROLLMENT RETURN (EXACT GOOGLE SHEETS STRUCTURE) */}
      {/* ========================================================================= */}
      {activeSubTab === 'enrollment' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Control Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-medium">As on Date:</span>
                <input
                  type="date"
                  value={asOnDate}
                  onChange={e => setAsOnDate(e.target.value)}
                  className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
                />
              </div>
              <span className="text-xs text-slate-400">
                Active Enrolled Students: <strong className="text-purple-300">{activeStudents.length}</strong> (TCs Issued: {tcRecords.filter(t => t.status === 'Issued').length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportEnrollment}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Return (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: CASTE CATEGORY WISE MATRIX */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-2">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-white m-0">
                  Section 1: Students Enrolment &bull; Caste Category Wise (Social & Minority)
                </h3>
                <span className="text-xs text-slate-400">
                  As on {asOnDate.split('-').reverse().join('/')} &bull; KENDRIYA VIDYALAYA KUTRA, SUNDARGARH, ODISHA
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-bold">
                Caste Category Wise
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  {/* Main Header Row 1 */}
                  <tr className="bg-sky-950/90 text-sky-200 border-b border-slate-800 text-center font-bold">
                    <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-800">Class</th>
                    <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-800">Sec.</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-sky-900/60">Total Number of Students</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-indigo-900/60">Gen</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-indigo-900/60">SC</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-indigo-900/60">ST</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-indigo-900/60">OBC CL</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-indigo-900/60">OBC-NCL</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-emerald-900/60">Total Check (Gen/SC/ST/PH/OBC/Muslim/MC)</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-teal-900/60">PH / CWSN</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-violet-900/60">Muslim</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-violet-900/60">Christian</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-violet-900/60">Others</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-amber-900/60">RTE</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-amber-900/60">BPL</th>
                    <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-800 bg-amber-900/40">SGC</th>
                    <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-800 bg-indigo-900/40">Total OBC</th>
                    <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-800 bg-emerald-900/40">Write Yes</th>
                    <th rowSpan={2} className="py-2.5 px-3">Name of Class Teacher</th>
                  </tr>
                  {/* Sub-Header Row 2 */}
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-center font-semibold text-[10px]">
                    {/* Total Students */}
                    <th className="py-1 px-1.5 border-r border-slate-800">B</th>
                    <th className="py-1 px-1.5 border-r border-slate-800">G</th>
                    <th className="py-1 px-1.5 border-r border-slate-800 font-bold text-white">T</th>
                    {/* Gen */}
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    {/* SC */}
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    {/* ST */}
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    {/* OBC CL */}
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    {/* OBC NCL */}
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    {/* Total Check */}
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    {/* PH */}
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    {/* Muslim */}
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    {/* Christian */}
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    {/* Others */}
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    {/* RTE */}
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    {/* BPL */}
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {casteMatrix.map((r, rIdx) => {
                    const isSub = r.isSubtotal;
                    const isGrand = r.isGrandTotal;

                    return (
                      <tr
                        key={`caste-row-${rIdx}`}
                        className={`transition-colors ${
                          isGrand
                            ? 'bg-purple-950/90 text-purple-200 font-bold text-xs'
                            : isSub
                            ? 'bg-amber-950/70 text-amber-300 font-bold'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <td className="py-2 px-2 text-center font-bold border-r border-slate-800">
                          {r.rowLabel || r.className}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-800">
                          {isSub || isGrand ? '' : r.section}
                        </td>

                        {/* Total Students */}
                        <td className="py-2 px-1.5 text-center border-r border-slate-800">{r.totalBoys}</td>
                        <td className="py-2 px-1.5 text-center border-r border-slate-800">{r.totalGirls}</td>
                        <td className="py-2 px-1.5 text-center font-bold text-white border-r border-slate-800 bg-sky-950/30">
                          {r.grandTotalStudents}
                        </td>

                        {/* Gen */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.gen.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.gen.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.gen.t}</td>

                        {/* SC */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.sc.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.sc.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.sc.t}</td>

                        {/* ST */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.st.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.st.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.st.t}</td>

                        {/* OBC CL */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.obcCl.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.obcCl.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.obcCl.t}</td>

                        {/* OBC NCL */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.obcNcl.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.obcNcl.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.obcNcl.t}</td>

                        {/* Total Check */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.checkBoys}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.checkGirls}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800 bg-emerald-950/30">{r.checkGrandTotal}</td>

                        {/* PH */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.ph.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.ph.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.ph.t}</td>

                        {/* Muslim */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.muslim.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.muslim.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.muslim.t}</td>

                        {/* Christian */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.christian.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.christian.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.christian.t}</td>

                        {/* Others */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.others.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.others.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.others.t}</td>

                        {/* RTE */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.rte.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.rte.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.rte.t}</td>

                        {/* BPL */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.bpl.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.bpl.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.bpl.t}</td>

                        {/* SGC & Total OBC */}
                        <td className="py-2 px-2 text-center border-r border-slate-800">{r.sgc}</td>
                        <td className="py-2 px-2 text-center border-r border-slate-800 font-bold text-indigo-300">{r.totalObc}</td>

                        {/* Verification & Teacher Name */}
                        <td className="py-2 px-2 text-center border-r border-slate-800">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-bold">
                            {r.writeYes}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-sans font-medium">
                          {r.classTeacherName}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: ADMISSION CATEGORY WISE MATRIX */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-2">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-white m-0">
                  Section 2: Students Enrolment &bull; Admission Category Wise (Cat-I to Cat-V)
                </h3>
                <span className="text-xs text-slate-400">
                  Central Govt / Defence / State Govt / Autonomous / General Public Breakdowns & TC Tracking
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                Admn. Category Wise
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-emerald-950/90 text-emerald-200 border-b border-slate-800 text-center font-bold">
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-800">Class</th>
                    <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-800">SEC</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-indigo-900/60">Cat-I (Def/Central)</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-indigo-900/60">Cat-II (Central Auto)</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-indigo-900/60">Cat-III (State Govt)</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-indigo-900/60">Cat-IV (State Auto)</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-indigo-900/60">Cat-V (Private/Other)</th>
                    <th colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-sky-900/60">Total Strength</th>
                    <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-800 bg-emerald-900/40">New Admn</th>
                    <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-800 bg-rose-900/40">No. of TC Issued</th>
                    <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-800 bg-emerald-900/40">Mark Yes</th>
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-800">Class Teacher</th>
                    <th rowSpan={2} className="py-2.5 px-3">TC Issued in previous month</th>
                  </tr>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-center font-semibold text-[10px]">
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    <th className="py-1 px-1 border-r border-slate-800">B</th><th className="py-1 px-1 border-r border-slate-800">G</th><th className="py-1 px-1 border-r border-slate-800 text-white font-bold">T</th>
                    <th className="py-1 px-1.5 border-r border-slate-800">B</th><th className="py-1 px-1.5 border-r border-slate-800">G</th><th className="py-1 px-1.5 border-r border-slate-800 text-white font-bold">T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {admnMatrix.map((r, rIdx) => {
                    const isSub = r.isSubtotal;
                    const isGrand = r.isGrandTotal;

                    return (
                      <tr
                        key={`admn-row-${rIdx}`}
                        className={`transition-colors ${
                          isGrand
                            ? 'bg-purple-950/90 text-purple-200 font-bold text-xs'
                            : isSub
                            ? 'bg-amber-950/70 text-amber-300 font-bold'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <td className="py-2 px-3 text-center font-bold border-r border-slate-800">
                          {r.rowLabel || r.className}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-800">
                          {isSub || isGrand ? '' : r.section}
                        </td>

                        {/* Cat-I */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.cat1.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.cat1.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.cat1.t}</td>

                        {/* Cat-II */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.cat2.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.cat2.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.cat2.t}</td>

                        {/* Cat-III */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.cat3.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.cat3.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.cat3.t}</td>

                        {/* Cat-IV */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.cat4.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.cat4.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.cat4.t}</td>

                        {/* Cat-V */}
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.cat5.b}</td>
                        <td className="py-2 px-1 text-center border-r border-slate-800">{r.cat5.g}</td>
                        <td className="py-2 px-1 text-center font-bold text-white border-r border-slate-800">{r.cat5.t}</td>

                        {/* Total Strength */}
                        <td className="py-2 px-1.5 text-center border-r border-slate-800">{r.totalBoys}</td>
                        <td className="py-2 px-1.5 text-center border-r border-slate-800">{r.totalGirls}</td>
                        <td className="py-2 px-1.5 text-center font-bold text-white border-r border-slate-800 bg-sky-950/30">
                          {r.grandTotal}
                        </td>

                        {/* New Admn & TC Issued */}
                        <td className="py-2 px-2 text-center border-r border-slate-800 font-bold text-emerald-400">{r.newAdmissions}</td>
                        <td className="py-2 px-2 text-center border-r border-slate-800 font-bold text-rose-400">{r.noOfTcIssued}</td>

                        {/* Verification & Teacher */}
                        <td className="py-2 px-2 text-center border-r border-slate-800">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-bold">
                            {r.markYes}
                          </span>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-800 text-slate-300 font-sans font-medium">
                          {r.classTeacherName}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">
                          {r.tcIssuedInPreviousMonth || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DAILY STUDENT ATTENDANCE MATRIX */}
      {/* ========================================================================= */}
      {activeSubTab === 'daily_attendance' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Month Selector Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedMonthIndex}
                onChange={e => setSelectedMonthIndex(parseInt(e.target.value, 10))}
                className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
              >
                <option value={0}>January 2026</option>
                <option value={1}>February 2026</option>
                <option value={2}>March 2026</option>
                <option value={3}>April 2026 (Apr 26)</option>
                <option value={4}>May 2026 (May 26)</option>
                <option value={5}>June 2026 (Jun 26)</option>
                <option value={6}>July 2026 (Jul 26)</option>
                <option value={7}>August 2026 (Aug 26)</option>
                <option value={8}>September 2026 (Sep 26)</option>
                <option value={9}>October 2026 (Oct 26)</option>
                <option value={10}>November 2026 (Nov 26)</option>
                <option value={11}>December 2026 (Dec 26)</option>
              </select>

              <span className="text-xs text-slate-400">
                Sundays, Gazetted Holidays & Vacations automatically rendered in red.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportDailyAttendance}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Daily Sheet (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Daily Attendance Matrix Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white m-0">
                  Student Daily Attendance Grid 2026-27 &bull; Classes I to X
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {isAdminOrDataManager(currentUser) ? (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Full Attendance Marking Privileges (Admin / Data Manager)
                  </span>
                ) : (currentUser?.isClassTeacherOf || currentUser?.isCoClassTeacherOf) ? (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Class Teacher Access: {currentUser.isClassTeacherOf || currentUser.isCoClassTeacherOf}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-xs flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> View-Only Mode: Attendance is maintained by Class Teachers
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto max-h-[700px]">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="sticky top-0 z-20 shadow-md">
                  {/* Top Class Names */}
                  <tr className="bg-slate-950 text-white border-b border-slate-800 text-center font-bold">
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-800 bg-slate-900 sticky left-0 z-30">
                      Date
                    </th>
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].map(cls => (
                      <th key={cls} colSpan={3} className="py-2 px-2 border-r border-slate-800 bg-slate-950">
                        Class {cls}
                      </th>
                    ))}
                    <th colSpan={3} className="py-2 px-2 bg-purple-950 text-purple-200">
                      Total Across Classes
                    </th>
                  </tr>
                  {/* Sub-Header: Pres | Abs | Abs Roll Nos */}
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-center font-semibold text-[10px]">
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].map(cls => (
                      <React.Fragment key={`sub-${cls}`}>
                        <th className="py-1 px-1.5 border-r border-slate-800 text-emerald-400">Pres</th>
                        <th className="py-1 px-1.5 border-r border-slate-800 text-rose-400">Abs</th>
                        <th className="py-1 px-3 border-r border-slate-800 text-amber-300">Abs Roll Nos</th>
                      </React.Fragment>
                    ))}
                    <th className="py-1 px-2 border-r border-purple-800 text-emerald-300 font-bold bg-purple-950/80">Pres</th>
                    <th className="py-1 px-2 border-r border-purple-800 text-rose-300 font-bold bg-purple-950/80">Abs</th>
                    <th className="py-1 px-2 text-white font-bold bg-purple-950/80">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {dailyAttendanceGrid.map((row, rIdx) => {
                    const isOff = row.dayStatus.isHolidayOrOff;

                    if (isOff) {
                      return (
                        <tr
                          key={`daily-row-${rIdx}`}
                          className="bg-rose-950/90 text-white font-bold border-y border-rose-600/50"
                        >
                          <td className="py-2 px-3 border-r border-rose-800/60 font-bold text-xs sticky left-0 bg-rose-950 z-10 whitespace-nowrap">
                            {row.displayDate}
                          </td>
                          <td colSpan={30} className="py-2 px-4 text-center font-sans tracking-widest text-xs uppercase bg-rose-900/60 border-r border-rose-800">
                            🚨 {row.dayStatus.badgeLabel} &bull; {row.dayStatus.fullTitle}
                          </td>
                          <td className="py-2 px-2 text-center text-rose-300 border-r border-rose-800 font-bold">#VALUE!</td>
                          <td className="py-2 px-2 text-center text-rose-300 border-r border-rose-800 font-bold">#VALUE!</td>
                          <td className="py-2 px-2 text-center text-rose-200 font-bold">#VALUE!</td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={`daily-row-${rIdx}`}
                        className="hover:bg-slate-800/40 text-slate-300 transition-colors"
                      >
                        <td className="py-2 px-3 border-r border-slate-800 font-medium text-white sticky left-0 bg-slate-900 z-10 whitespace-nowrap">
                          {row.displayDate}
                        </td>

                        {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].map(cls => {
                          const cell = row.classCells[cls];
                          const hasAbs = cell && cell.absentCount > 0;

                          return (
                            <React.Fragment key={`cell-${cls}-${rIdx}`}>
                              <td className="py-2 px-1.5 text-center border-r border-slate-800 font-bold text-emerald-400">
                                {cell ? cell.presentCount : 0}
                              </td>
                              <td className={`py-2 px-1.5 text-center border-r border-slate-800 font-bold ${hasAbs ? 'text-rose-400 bg-rose-950/20' : 'text-slate-500'}`}>
                                {cell ? cell.absentCount : 0}
                              </td>
                              <td className="py-2 px-2 border-r border-slate-800 text-[10px] text-amber-300 whitespace-nowrap font-sans">
                                {cell && cell.absentRollNos ? cell.absentRollNos : '-'}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        {/* Daily Totals */}
                        <td className="py-2 px-2 text-center border-r border-slate-800 font-black text-emerald-300 bg-slate-950">
                          {row.totalPresent}
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-800 font-black text-rose-400 bg-slate-950">
                          {row.totalAbsent}
                        </td>
                        <td className="py-2 px-2 text-center font-black text-white bg-slate-950">
                          {row.totalStudents}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: TRANSFER CERTIFICATE (TC) MANAGER */}
      {/* ========================================================================= */}
      {activeSubTab === 'tc_manager' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white m-0">Transfer Certificate (TC) Register</h3>
              <p className="text-xs text-slate-400 m-0">
                Issuing a TC automatically removes the student from active enrollment rosters and updates Monthly RO Returns.
              </p>
            </div>

            {(isAdminOrDataManager(currentUser) || currentUser?.isClassTeacherOf || currentUser?.isCoClassTeacherOf) ? (
              <button
                onClick={() => setIsTcModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Issue New Transfer Certificate</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-slate-800 text-slate-400 text-xs flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>TCs can be initiated by Class Teachers and approved by Admin</span>
              </span>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold">
                    <th className="py-3 px-4">TC Number</th>
                    <th className="py-3 px-4">Student Name & ID</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Date of Leaving</th>
                    <th className="py-3 px-4">Date of Issue</th>
                    <th className="py-3 px-4">Reason for Leaving</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {tcRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No Transfer Certificates issued yet.
                      </td>
                    </tr>
                  ) : (
                    tcRecords.map(tc => (
                      <tr key={tc.id} className="hover:bg-slate-800/40 text-slate-300">
                        <td className="py-3 px-4 font-bold text-purple-300">{tc.tcNumber}</td>
                        <td className="py-3 px-4 font-sans font-medium text-white space-y-0.5">
                          <div>{tc.studentName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">Admn: {tc.admissionNo}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">Class {tc.className} {tc.section}</td>
                        <td className="py-3 px-4">{tc.dateOfLeaving}</td>
                        <td className="py-3 px-4">{tc.dateOfIssueTc}</td>
                        <td className="py-3 px-4 font-sans">{tc.reasonForLeaving}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            {tc.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ISSUE TRANSFER CERTIFICATE */}
      {/* ========================================================================= */}
      {isTcModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2 m-0">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>Issue Transfer Certificate (TC)</span>
                </h3>
                <p className="text-xs text-slate-400 m-0">
                  Select student to generate formal certificate and deduct from active enrollment.
                </p>
              </div>
              <button
                onClick={() => setIsTcModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueTc} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Select Student *</label>
                <select
                  required
                  value={selectedStudentForTc?.id || ''}
                  onChange={e => {
                    const st = activeStudents.find(s => s.id === e.target.value);
                    setSelectedStudentForTc(st || null);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Choose Student from Active Roll --</option>
                  {activeStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.studentName} &bull; Class {s.className} &bull; Roll: {s.rollNo || s.sn} &bull; Admn: {s.studentId || s.admissionNo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Date of Leaving *</label>
                  <input
                    type="date"
                    required
                    value={tcDateOfLeaving}
                    onChange={e => setTcDateOfLeaving(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Date of Issue *</label>
                  <input
                    type="date"
                    required
                    value={tcDateOfIssue}
                    onChange={e => setTcDateOfIssue(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Reason for Leaving *</label>
                  <select
                    value={tcReason}
                    onChange={e => setTcReason(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Parent Transfer">Parent Transfer / Relocation</option>
                    <option value="Admission to Other School">Admission to Other School</option>
                    <option value="Higher Education">Higher Education</option>
                    <option value="Personal Request">Personal Request</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Destination School (Optional)</label>
                  <input
                    type="text"
                    value={tcDestinationSchool}
                    onChange={e => setTcDestinationSchool(e.target.value)}
                    placeholder="e.g. KV Rourkela / DPS Sundargarh"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Remarks / Clearance</label>
                <input
                  type="text"
                  value={tcRemarks}
                  onChange={e => setTcRemarks(e.target.value)}
                  placeholder="All school fees and library books cleared."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTcModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!selectedStudentForTc}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-600/30 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Issue & Sanction TC</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FAST CLASS ROLL-CALL ATTENDANCE */}
      {/* ========================================================================= */}
      {isMarkModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2 m-0">
                  <CalendarDays className="w-5 h-5 text-emerald-400" />
                  <span>Mark Class Daily Attendance</span>
                </h3>
                <p className="text-xs text-slate-400 m-0">
                  Enter absent roll numbers (comma separated) for automatic formula calculation.
                </p>
              </div>
              <button
                onClick={() => setIsMarkModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClassAttendance} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={markDate}
                    onChange={e => setMarkDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Class *</label>
                  <select
                    value={markClass}
                    onChange={e => setMarkClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].map(c => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Absent Roll Numbers (Comma-separated)
                </label>
                <input
                  type="text"
                  value={markAbsentRollNos}
                  onChange={e => setMarkAbsentRollNos(e.target.value)}
                  placeholder="e.g. 5, 10, 11, 20"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Leave blank if all students are present today.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMarkModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Attendance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};