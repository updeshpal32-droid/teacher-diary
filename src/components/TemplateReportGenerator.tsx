import React, { useState, useEffect } from 'react';
import {
  SchoolDetails,
  TeacherProfile,
  ClassSection,
  TimetableSlot,
  CalendarEvent,
  SyllabusItem,
  DailyLessonPlan,
  AssessmentProgressRecord,
  InspectionReviewRecord,
  LessonEvidenceItem
} from '../types/academic';
import {
  db,
  DEFAULT_SCHOOL,
  DEFAULT_TEACHER,
  DEFAULT_CLASSES,
  DEFAULT_TIMETABLE,
  DEFAULT_PERIOD_TIMINGS,
  DEFAULT_CALENDAR,
  DEFAULT_SYLLABUS,
  DEFAULT_LESSON_PLANS,
  DEFAULT_ASSESSMENT_RECORDS,
  DEFAULT_INSPECTION_RECORDS
} from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  Printer,
  FileText,
  Search,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

interface TemplateReportGeneratorProps {
  devMode: boolean;
}

export type ReportType =
  | 'ALL_MASTER_DIARY'
  | 'COVER_PAGE'
  | 'TEACHER_PROFILE'
  | 'TIMETABLE'
  | 'ACADEMIC_CALENDAR'
  | 'ANNUAL_PLAN'
  | 'MONTHLY_PLAN'
  | 'DAILY_LESSON_PLAN'
  | 'HOMEWORK_LOG'
  | 'ASSESSMENT_PROGRESS'
  | 'MEDIA_EVIDENCE'
  | 'INSPECTION_REMARKS'
  | 'MONTHLY_SUMMARY';

export const TemplateReportGenerator: React.FC<TemplateReportGeneratorProps> = ({ devMode: initialDevMode }) => {
  // Data State
  const [school, setSchool] = useState<SchoolDetails>(DEFAULT_SCHOOL);
  const [teacher, setTeacher] = useState<TeacherProfile>(DEFAULT_TEACHER);
  const [classes, setClasses] = useState<ClassSection[]>(DEFAULT_CLASSES);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(DEFAULT_TIMETABLE);
  const [periodTimings, setPeriodTimings] = useState<Record<number, { time: string; label: string }>>(DEFAULT_PERIOD_TIMINGS);
  const [events, setEvents] = useState<CalendarEvent[]>(DEFAULT_CALENDAR);
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>(DEFAULT_SYLLABUS);
  const [lessonPlans, setLessonPlans] = useState<DailyLessonPlan[]>(DEFAULT_LESSON_PLANS);
  const [assessments, setAssessments] = useState<AssessmentProgressRecord[]>(DEFAULT_ASSESSMENT_RECORDS);
  const [inspections, setInspections] = useState<InspectionReviewRecord[]>(DEFAULT_INSPECTION_RECORDS);
  const [loading, setLoading] = useState<boolean>(true);

  // Report Controls & Filters
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('ALL_MASTER_DIARY');
  const [showTemplateWatermarks, setShowTemplateWatermarks] = useState<boolean>(initialDevMode);

  // Filters
  const [startDate, setStartDate] = useState<string>('2025-04-01');
  const [endDate, setEndDate] = useState<string>('2026-03-31');
  const [classFilter, setClassFilter] = useState<string>('All');
  const [sectionFilter, setSectionFilter] = useState<string>('All');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const s = await db.get<SchoolDetails>('setup:school');
      const t = await db.get<TeacherProfile>('setup:teacher');
      const c = await db.get<ClassSection[]>('setup:classes');
      const tt = await db.get<TimetableSlot[]>('setup:timetable');
      const pt = await db.get<Record<number, { time: string; label: string }>>('setup:period_timings');
      const ev = await db.get<CalendarEvent[]>('setup:calendar');
      const syl = await db.get<SyllabusItem[]>('setup:syllabus');
      const lp = await db.get<DailyLessonPlan[]>('setup:lesson_plans');
      const asst = await db.get<AssessmentProgressRecord[]>('setup:assessments');
      const insp = await db.get<InspectionReviewRecord[]>('setup:inspections');

      if (s) setSchool(s);
      if (t) setTeacher(t);
      if (c && Array.isArray(c)) setClasses(c);
      if (tt && Array.isArray(tt)) setTimetable(tt);
      if (pt) setPeriodTimings(pt);
      if (ev && Array.isArray(ev)) setEvents(ev);
      if (syl && Array.isArray(syl)) setSyllabus(syl);
      if (lp && Array.isArray(lp)) setLessonPlans(lp);
      if (asst && Array.isArray(asst)) setAssessments(asst);
      if (insp && Array.isArray(insp)) setInspections(insp);
    } catch (err) {
      console.error('Failed to load master report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  // Safe Property Access Helpers
  const getTeacherName = (t: TeacherProfile) => t.name || (t as any).fullName || 'Dr. Ramesh Sharma';
  const getTeacherEmail = (t: TeacherProfile) => t.email || (t as any).emailOfficial || 'ramesh.sharma@kvs.gov.in';
  const getTeacherPhone = (t: TeacherProfile) => t.phoneNo || (t as any).phoneMobile || '+91 98765 43210';
  const getTeacherJoiningKVS = (t: TeacherProfile) => t.joiningDateKVS || (t as any).joiningDateKvs || '2015-08-01';
  const getTeacherJoiningStation = (t: TeacherProfile) => t.joiningDatePresentKV || (t as any).joiningDatePresentStation || '2021-04-01';
  const getTeacherPrimarySubject = (t: TeacherProfile) => t.classesAndSubjectsTaught || (t as any).primarySubject || 'Mathematics (041)';
  const getSchoolYear = (s: SchoolDetails) => (s as any).academicYear || '2025-2026';
  const getSchoolRegion = (s: SchoolDetails) => s.region || (s as any).regionName || 'Bhubaneswar Region';
  const getSchoolCode = (s: SchoolDetails) => s.kvCode || (s as any).schoolCode || '1042';

  // Filtered Arrays with robust null/undefined safety
  const safeLessonPlans = Array.isArray(lessonPlans) ? lessonPlans : [];
  const filteredLessonPlans = safeLessonPlans.filter(p => {
    if (!p) return false;
    const planClass = p.className || '';
    const planSection = p.section || '';
    const planSubject = p.subjectName || '';
    const planDate = p.date || '';
    const planStatus = p.completionStatus || '';
    const planTopic = p.topic || '';
    const planOutcomes = p.learningOutcomes || '';

    const matchesClass = classFilter === 'All' || planClass === classFilter;
    const matchesSection = sectionFilter === 'All' || planSection === sectionFilter;
    const matchesSubject = subjectFilter === 'All' || planSubject === subjectFilter;
    const matchesMonth = monthFilter === 'All' || planDate.startsWith(monthFilter);
    const matchesStatus = statusFilter === 'All' || planStatus === statusFilter;
    const matchesSearch = !searchQuery || planTopic.toLowerCase().includes(searchQuery.toLowerCase()) || planOutcomes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = (!startDate || planDate >= startDate) && (!endDate || planDate <= endDate);

    return matchesClass && matchesSection && matchesSubject && matchesMonth && matchesStatus && matchesSearch && matchesDate;
  });

  const safeSyllabus = Array.isArray(syllabus) ? syllabus : [];
  const filteredSyllabus = safeSyllabus.filter(s => {
    if (!s) return false;
    const sylClass = s.className || '';
    const sylSubject = s.subjectName || '';
    const sylMonth = s.month || (s as any).targetMonth || '';
    const sylStatus = s.completionStatus || (s as any).status || '';
    const sylChapter = s.chapterTitle || (s as any).chapterName || '';

    const matchesClass = classFilter === 'All' || sylClass === classFilter;
    const matchesSubject = subjectFilter === 'All' || sylSubject === subjectFilter;
    const matchesMonth = monthFilter === 'All' || sylMonth === monthFilter;
    const matchesStatus = statusFilter === 'All' || sylStatus === statusFilter;
    const matchesSearch = !searchQuery || sylChapter.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesClass && matchesSubject && matchesMonth && matchesStatus && matchesSearch;
  });

  const safeAssessments = Array.isArray(assessments) ? assessments : [];
  const filteredAssessments = safeAssessments.filter(a => {
    if (!a) return false;
    const aClass = a.className || '';
    const aSection = a.section || '';
    const aSubject = a.subjectName || '';
    const aTitle = a.title || '';
    const aTopic = a.topic || '';

    const matchesClass = classFilter === 'All' || aClass === classFilter;
    const matchesSection = sectionFilter === 'All' || aSection === sectionFilter;
    const matchesSubject = subjectFilter === 'All' || aSubject === subjectFilter;
    const matchesSearch = !searchQuery || aTitle.toLowerCase().includes(searchQuery.toLowerCase()) || aTopic.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesClass && matchesSection && matchesSubject && matchesSearch;
  });

  const allMediaEvidence: LessonEvidenceItem[] = filteredLessonPlans.flatMap(p => p.evidenceItems || []);

  if (loading) {
    return (
      <div className="p-12 text-center text-purple-300 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Loading Master Report Generator...</p>
      </div>
    );
  }

  // Watermark Component Helper
  const TemplateWatermark = ({ pageNo, title }: { pageNo: number | string; title: string }) => {
    if (!showTemplateWatermarks) return null;
    return (
      <div className="print-watermark mb-2 bg-purple-950/20 text-purple-800 border border-purple-400/30 px-3 py-1 rounded text-[10px] font-bold flex items-center justify-between uppercase tracking-wider">
        <span>📄 Based on Template Page {pageNo}: {title}</span>
        <span className="text-[9px] font-mono text-purple-600">KVS Digital Diary System</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Dev Mode Reference Banner */}
      {initialDevMode && (
        <DevModeBadge
          pages={[1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 17, 22, 24, 40, 48, 50, 51]}
          title="Print-Ready A4 Report Engine: Generates exact KVS Template PDF mirror pages with filterable sections & dev page callouts"
          fieldCount={13}
        />
      )}

      {/* Control Panel (Hidden on Print) */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Printer className="w-5 h-5 text-purple-400" />
              Template-Based Print-Ready Report Generator
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select specific report modules or print the entire KVS Teacher's Diary in official A4 layout format.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTemplateWatermarks(!showTemplateWatermarks)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                showTemplateWatermarks
                  ? 'bg-purple-950/80 text-purple-200 border-purple-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle 'Based on Template Page X' badge overlays"
            >
              {showTemplateWatermarks ? <Eye className="w-3.5 h-3.5 text-purple-300" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showTemplateWatermarks ? 'Dev Badges: Visible' : 'Dev Badges: Hidden'}</span>
            </button>

            <button
              onClick={triggerPrint}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md border border-purple-400/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Print A4 Report / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Report Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
          {[
            { id: 'ALL_MASTER_DIARY', label: '📘 Full Master Diary' },
            { id: 'COVER_PAGE', label: '📖 Cover Page (Pg 1)' },
            { id: 'TEACHER_PROFILE', label: '👤 Teacher Profile (Pg 2-3)' },
            { id: 'TIMETABLE', label: '🗓️ Class Timetable (Pg 6-7)' },
            { id: 'ACADEMIC_CALENDAR', label: '📅 KVS Calendar (Pg 8-9)' },
            { id: 'ANNUAL_PLAN', label: '📊 Annual Plan (Pg 10-11)' },
            { id: 'MONTHLY_PLAN', label: '🗓️ Monthly Plan (Pg 12-16)' },
            { id: 'DAILY_LESSON_PLAN', label: '📝 Daily Plans (Pg 48-49)' },
            { id: 'HOMEWORK_LOG', label: '🏠 Homework Log (Pg 22-23)' },
            { id: 'ASSESSMENT_PROGRESS', label: '✍️ Assessment Register (Pg 24-30)' },
            { id: 'MEDIA_EVIDENCE', label: '📸 Evidence Appendix (Pg 40-45)' },
            { id: 'INSPECTION_REMARKS', label: '🛡️ Inspection Log (Pg 4, 48, 50)' },
            { id: 'MONTHLY_SUMMARY', label: '📈 Progress Summary (Pg 51-52)' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedReportType(r.id as ReportType)}
              className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                selectedReportType === r.id
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <span className="block truncate">{r.label}</span>
            </button>
          ))}
        </div>

        {/* Global Filters Grid */}
        <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Search Topic / Keyword
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2 py-1 text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Class
            </label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 cursor-pointer"
            >
              <option value="All">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.className}>Class {c.className}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Section
            </label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 cursor-pointer"
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Month
            </label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 cursor-pointer"
            >
              <option value="All">All Months</option>
              <option value="April">April</option>
              <option value="May">May</option>
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* PRINT-READY A4 REPORT DOCUMENT DISPLAY CONTAINER */}
      <div className="bg-white text-slate-900 shadow-xl rounded-none p-8 md:p-12 max-w-5xl mx-auto space-y-12 border-2 border-slate-900 print:p-0 print:border-none print:shadow-none font-sans">

        {/* ------------------------------------------------------------------------- */}
        {/* REPORT MODULE 1: OFFICIAL COVER PAGE (Template Page 1)                    */}
        {/* ------------------------------------------------------------------------- */}
        {(selectedReportType === 'ALL_MASTER_DIARY' || selectedReportType === 'COVER_PAGE') && (
          <div className="report-page border-4 border-slate-900 p-8 min-h-[1050px] flex flex-col justify-between text-center relative bg-slate-50/50">
            <TemplateWatermark pageNo={1} title="Official KVS Teacher's Diary Cover Page" />

            {/* Top Emblems Header */}
            <div className="space-y-3">
              <div className="w-20 h-20 mx-auto rounded-full bg-purple-900 text-white flex items-center justify-center font-black text-2xl border-2 border-slate-900 shadow-md">
                KVS
              </div>
              <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900 mt-2">
                KENDRIYA VIDYALAYA SANGATHAN
              </h1>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                AN AUTONOMOUS BODY UNDER MINISTRY OF EDUCATION, GOVT. OF INDIA
              </h2>
            </div>

            {/* Central Diary Title */}
            <div className="py-8 my-auto border-y-4 border-slate-900 space-y-3 bg-white p-6 shadow-sm">
              <h3 className="text-3xl font-black uppercase tracking-widest text-slate-900">
                TEACHER'S DIARY
              </h3>
              <p className="text-lg font-bold text-purple-900 uppercase tracking-wide">
                ACADEMIC SESSION: {getSchoolYear(school)}
              </p>
              <p className="text-xs text-slate-600 uppercase font-semibold">
                NCF 2023 & KVS SPLIT-UP SYLLABUS COMPLIANT
              </p>
            </div>

            {/* Bottom Metadata Block */}
            <div className="text-left grid grid-cols-2 gap-6 border-2 border-slate-900 p-6 bg-white text-xs font-bold leading-relaxed">
              <div className="space-y-1.5">
                <p><span className="text-slate-500 uppercase">Name of Teacher:</span> <br/><strong className="text-sm text-slate-900">{getTeacherName(teacher)}</strong></p>
                <p><span className="text-slate-500 uppercase">Designation:</span> <br/><strong>{teacher.designation} ({teacher.employeeCode})</strong></p>
                <p><span className="text-slate-500 uppercase">Subject(s) Taught:</span> <br/><strong>{getTeacherPrimarySubject(teacher)}</strong></p>
              </div>

              <div className="space-y-1.5">
                <p><span className="text-slate-500 uppercase">School / Vidyalaya:</span> <br/><strong className="text-sm text-slate-900">{school.schoolName}</strong></p>
                <p><span className="text-slate-500 uppercase">KVS Region:</span> <br/><strong>{getSchoolRegion(school)} (School Code: {getSchoolCode(school)})</strong></p>
                <p><span className="text-slate-500 uppercase">Principal Name:</span> <br/><strong>{school.principalName}</strong></p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* REPORT MODULE 2: TEACHER PROFILE & BIO (Template Page 12, 15, 16)         */}
        {/* ------------------------------------------------------------------------- */}
        {(selectedReportType === 'ALL_MASTER_DIARY' || selectedReportType === 'TEACHER_PROFILE') && (
          <div className="report-page space-y-6 pt-6 border-t-2 border-slate-900">
            {/* P-12: Section 7(a) Bio-Data */}
            <TemplateWatermark pageNo={12} title="Section 7(a) Teacher Bio-Data & Academic Targets" />

            <div className="border-2 border-slate-900 p-6 space-y-6 bg-white">
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h2 className="text-lg font-black uppercase text-slate-900">
                  SECTION 7(a): GENERAL INFORMATION & BIO-DATA OF THE TEACHER
                </h2>
                <p className="text-xs font-medium text-slate-600">Template Page 12 Personal & Academic Particulars Record</p>
              </div>

              <div className="grid grid-cols-2 gap-6 text-xs font-medium leading-relaxed">
                <div className="border border-slate-800 p-4 space-y-2">
                  <h3 className="font-bold uppercase text-purple-900 border-b border-slate-300 pb-1">1. Personal & Service Details</h3>
                  <p><strong>Full Name:</strong> {getTeacherName(teacher)}</p>
                  <p><strong>Designation:</strong> {teacher.designation}</p>
                  <p><strong>Employee Code / Staff ID:</strong> {teacher.employeeCode}</p>
                  <p><strong>Qualifications:</strong> {teacher.qualifications}</p>
                  <p><strong>Seniority No. in KVS:</strong> {teacher.seniorityNo || '-'}</p>
                  <p><strong>Date of Birth:</strong> {teacher.dob || (teacher as any).dateOfBirth || '-'}</p>
                  <p><strong>Date of Joining KVS:</strong> {getTeacherJoiningKVS(teacher)}</p>
                  <p><strong>Date of Joining Present Station:</strong> {getTeacherJoiningStation(teacher)}</p>
                  <p><strong>NCC / Scouting & Guiding:</strong> {teacher.nccScoutingQualification || '-'}</p>
                </div>

                <div className="border border-slate-800 p-4 space-y-2">
                  <h3 className="font-bold uppercase text-purple-900 border-b border-slate-300 pb-1">2. Contact, Identity & Institutional Roles</h3>
                  <p><strong>Residential Address:</strong> {teacher.residentialAddress}</p>
                  <p><strong>Contact Phone No:</strong> {getTeacherPhone(teacher)}</p>
                  <p><strong>Official Email ID:</strong> {getTeacherEmail(teacher)}</p>
                  <p><strong>Blood Group:</strong> {teacher.bloodGroup}</p>
                  <p><strong>GPF / CPF / PRAN No:</strong> {teacher.gpfCpfPranNo || '-'}</p>
                  <p><strong>PAN No:</strong> {teacher.panNo || '-'}</p>
                  <p><strong>Aadhar No:</strong> {teacher.aadharNo || '-'}</p>
                  <p><strong>Class Teacher Role:</strong> {teacher.classTeacherRole || 'N/A'}</p>
                  <p><strong>Classes & Subjects Taught:</strong> {teacher.classesAndSubjectsTaught || '-'}</p>
                </div>
              </div>

              {/* Item 19: Academic Targets Table */}
              {teacher.academicTargets && teacher.academicTargets.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold uppercase text-purple-900">Item 19: Academic Targets for Session</h3>
                  <table className="w-full text-left text-xs border border-slate-800">
                    <thead className="bg-slate-100 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2 border-r border-slate-800">Subject Code & Name</th>
                        <th className="p-2 border-r border-slate-800 text-center">Class & Sec</th>
                        <th className="p-2 border-r border-slate-800 text-center">Target Pass %</th>
                        <th className="p-2 text-center">Target A1 Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacher.academicTargets.map((tgt, i) => (
                        <tr key={tgt.id || i} className="border-b border-slate-700">
                          <td className="p-2 border-r border-slate-800 font-medium">{tgt.subjectCodeName}</td>
                          <td className="p-2 border-r border-slate-800 text-center font-bold">{tgt.classSection}</td>
                          <td className="p-2 border-r border-slate-800 text-center font-mono font-bold text-emerald-800">{tgt.passPercentage}%</td>
                          <td className="p-2 text-center font-mono font-bold text-purple-900">{tgt.targetA1Count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* P-15: 9(a) Teaching Philosophy & 9(b) Achievements */}
            <div className="border-2 border-slate-900 p-6 space-y-6 bg-white">
              <TemplateWatermark pageNo={15} title="9(a) Teaching Philosophy & 9(b) Achievements" />
              
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h2 className="text-lg font-black uppercase text-slate-900">
                  PAGE 15: 9(a) TEACHING PHILOSOPHY & 9(b) NOTABLE ACHIEVEMENTS
                </h2>
                <p className="text-xs font-medium text-slate-600">Scholastic & Co-Scholastic Milestones • NEP-2020 Pedagogical Philosophy</p>
              </div>

              {/* 9(a) Teaching Philosophy */}
              <div className="border border-slate-800 p-4 space-y-2">
                <h3 className="font-bold uppercase text-amber-900 border-b border-slate-300 pb-1 text-xs">
                  9(a) Statement of Teaching Philosophy
                </h3>
                <p className="text-xs text-slate-800 leading-relaxed italic">
                  "{teacher.teachingPhilosophy || 'To foster competency-based education, experiential learning, and active character building in Kendriya Vidyalaya students.'}"
                </p>
              </div>

              {/* 9(b) Achievements */}
              <div className="space-y-4">
                <h3 className="font-bold uppercase text-purple-900 text-xs">
                  9(b) Scholastic & Co-Scholastic Achievements
                </h3>

                {teacher.scholasticAchievementsText && (
                  <div className="text-xs border-l-2 border-blue-600 pl-3 py-1 bg-blue-50/50">
                    <strong className="text-blue-900 block mb-0.5">Scholastic Summary:</strong>
                    <span className="text-slate-800">{teacher.scholasticAchievementsText}</span>
                  </div>
                )}

                {teacher.coScholasticAchievementsText && (
                  <div className="text-xs border-l-2 border-emerald-600 pl-3 py-1 bg-emerald-50/50">
                    <strong className="text-emerald-900 block mb-0.5">Co-Scholastic Summary:</strong>
                    <span className="text-slate-800">{teacher.coScholasticAchievementsText}</span>
                  </div>
                )}

                {teacher.achievementsList && teacher.achievementsList.length > 0 && (
                  <table className="w-full text-left text-xs border border-slate-800">
                    <thead className="bg-slate-100 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2 border-r border-slate-800 w-20 text-center">Year</th>
                        <th className="p-2 border-r border-slate-800 w-28">Category</th>
                        <th className="p-2 border-r border-slate-800 w-24 text-center">Level</th>
                        <th className="p-2 border-r border-slate-800">Achievement Title & Description</th>
                        <th className="p-2 w-48">Award / Recognition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacher.achievementsList.map((ach, idx) => (
                        <tr key={ach.id || idx} className="border-b border-slate-700">
                          <td className="p-2 border-r border-slate-800 text-center font-mono">{ach.year}</td>
                          <td className="p-2 border-r border-slate-800 font-semibold">{ach.category}</td>
                          <td className="p-2 border-r border-slate-800 text-center">{ach.level}</td>
                          <td className="p-2 border-r border-slate-800">
                            <strong>{ach.title}</strong>
                            <p className="text-[11px] text-slate-600 m-0 mt-0.5">{ach.description}</p>
                          </td>
                          <td className="p-2 font-medium text-amber-900">{ach.awardOrRecognition || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* P-16: 10(a) Academic Responsibilities & 10(b) KVS Flagship */}
            <div className="border-2 border-slate-900 p-6 space-y-6 bg-white">
              <TemplateWatermark pageNo={16} title="10(a) Academic Responsibilities & 10(b) KVS Flagship" />
              
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <h2 className="text-lg font-black uppercase text-slate-900">
                  PAGE 16: 10(a) ACADEMIC RESPONSIBILITIES & 10(b) KVS FLAGSHIP PROGRAMS
                </h2>
                <p className="text-xs font-medium text-slate-600">Institutional Duties & National Mission Contributions</p>
              </div>

              {/* 10(a) Academic Responsibilities */}
              <div className="space-y-2">
                <h3 className="font-bold uppercase text-indigo-900 text-xs">
                  10(a) Academic & Administrative Responsibilities
                </h3>
                {teacher.academicResponsibilities && teacher.academicResponsibilities.length > 0 ? (
                  <table className="w-full text-left text-xs border border-slate-800">
                    <thead className="bg-slate-100 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2 border-r border-slate-800 w-20 text-center">Session</th>
                        <th className="p-2 border-r border-slate-800 w-48">Duty / Committee</th>
                        <th className="p-2 border-r border-slate-800 w-28 text-center">Designation</th>
                        <th className="p-2 border-r border-slate-800 w-36">Level / Class</th>
                        <th className="p-2">Key Outcomes / Institutional Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacher.academicResponsibilities.map((resp, idx) => (
                        <tr key={resp.id || idx} className="border-b border-slate-700">
                          <td className="p-2 border-r border-slate-800 text-center font-mono">{resp.academicYear}</td>
                          <td className="p-2 border-r border-slate-800 font-bold">{resp.dutyName}</td>
                          <td className="p-2 border-r border-slate-800 text-center font-medium text-indigo-900">{resp.role}</td>
                          <td className="p-2 border-r border-slate-800">{resp.levelOrClass}</td>
                          <td className="p-2 text-slate-700">{resp.keyOutcomes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-slate-500 italic">No academic responsibilities listed.</p>
                )}
              </div>

              {/* 10(b) Contributions to KVS Flagship Programs */}
              <div className="space-y-2 pt-2">
                <h3 className="font-bold uppercase text-teal-900 text-xs">
                  10(b) Contributions to KVS Flagship Programs & National Missions
                </h3>
                {teacher.kvsFlagshipContributions && teacher.kvsFlagshipContributions.length > 0 ? (
                  <table className="w-full text-left text-xs border border-slate-800">
                    <thead className="bg-slate-100 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2 border-r border-slate-800 w-44">Flagship Program</th>
                        <th className="p-2 border-r border-slate-800 w-32 text-center">Role / Capacity</th>
                        <th className="p-2 border-r border-slate-800 w-36">Target Group</th>
                        <th className="p-2 border-r border-slate-800">Key Actions Undertaken</th>
                        <th className="p-2 w-48">Measurable Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacher.kvsFlagshipContributions.map((flag, idx) => (
                        <tr key={flag.id || idx} className="border-b border-slate-700">
                          <td className="p-2 border-r border-slate-800 font-bold text-teal-900">{flag.programName}</td>
                          <td className="p-2 border-r border-slate-800 text-center font-medium">{flag.role}</td>
                          <td className="p-2 border-r border-slate-800">{flag.targetGroup}</td>
                          <td className="p-2 border-r border-slate-800 text-slate-700">{flag.actionsTaken}</td>
                          <td className="p-2 font-medium text-emerald-800">{flag.measurableImpact}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-slate-500 italic">No flagship program contributions listed.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* REPORT MODULE 3: TIMETABLE & TEACHING SCHEDULE (Template Page 6 & 7)       */}
        {/* ------------------------------------------------------------------------- */}
        {(selectedReportType === 'ALL_MASTER_DIARY' || selectedReportType === 'TIMETABLE') && (
          <div className="report-page space-y-4 pt-6 border-t-2 border-slate-900">
            <TemplateWatermark pageNo="6 & 7" title="Master Class & Teacher Timetable Schedule" />

            <div className="text-center border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase text-slate-900">
                CLASS & TEACHER TIME TABLE SCHEDULE
              </h2>
              <p className="text-xs text-slate-600">Template Pages 6 & 7 Weekly Class Assignment Grid</p>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                  <th className="border border-slate-800 p-2 w-16">Day \ Period</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(p => (
                    <React.Fragment key={p}>
                      <th className="border border-slate-800 p-1.5 text-center">
                        <div className="font-bold">P-{p} {p === 9 ? '(Extra)' : ''}</div>
                        <div className="text-[9px] font-mono text-slate-700 font-medium">
                          {periodTimings[p]?.time || DEFAULT_PERIOD_TIMINGS[p]?.time || ''}
                        </div>
                      </th>
                      {p === 4 && (
                        <th className="border border-slate-800 p-1.5 text-center bg-emerald-100 text-emerald-950 font-extrabold min-w-[75px]">
                          <div className="uppercase tracking-wider">RECESS</div>
                          <div className="text-[9px] font-mono text-emerald-800 font-bold">
                            {periodTimings[0]?.time || DEFAULT_PERIOD_TIMINGS[0]?.time || '11:00 AM - 11:20 AM'}
                          </div>
                        </th>
                      )}
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <tr key={day} className="border-b border-slate-800">
                    <td className="border border-slate-800 p-2 font-bold bg-slate-100">{day}</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(pNum => {
                      const slot = timetable.find(
                        t => (t.day === day || (t as any).dayOfWeek === day) && (t.period === pNum || (t as any).periodNumber === pNum)
                      );
                      return (
                        <React.Fragment key={pNum}>
                          <td className="border border-slate-800 p-1.5 text-center align-top text-[10px]">
                            {slot ? (
                              <div>
                                <strong className="block text-slate-900">
                                  {slot.className}
                                  {(slot as any).section ? `-${(slot as any).section}` : ''}
                                </strong>
                                <span className="text-purple-800 font-medium">{slot.subjectName}</span>
                                {slot.roomNo && <div className="text-[9px] text-slate-500 font-mono">{slot.roomNo}</div>}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          {pNum === 4 && (
                            <td className="border border-slate-800 p-1 text-center align-middle bg-emerald-50 text-emerald-900 font-bold text-[10px]">
                              <div className="uppercase tracking-wider font-black text-emerald-800 text-[9px]">RECESS</div>
                              <div className="text-[8px] text-slate-600 font-normal">Interval</div>
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* REPORT MODULE 4: ACADEMIC CALENDAR & HOLIDAYS (Template Page 8 & 9)        */}
        {/* ------------------------------------------------------------------------- */}
        {(selectedReportType === 'ALL_MASTER_DIARY' || selectedReportType === 'ACADEMIC_CALENDAR') && (
          <div className="report-page space-y-4 pt-6 border-t-2 border-slate-900">
            <TemplateWatermark pageNo="8 & 9" title="KVS Academic Calendar & Holidays List" />

            <div className="text-center border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase text-slate-900">
                KVS ANNUAL ACADEMIC & ACTIVITY CALENDAR
              </h2>
              <p className="text-xs text-slate-600">Template Pages 8 & 9 Gazette Holidays & Observances</p>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                  <th className="border border-slate-800 p-2 w-28">Date</th>
                  <th className="border border-slate-800 p-2">Event Title</th>
                  <th className="border border-slate-800 p-2 w-28">Category</th>
                  <th className="border border-slate-800 p-2">Pertaining Details</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, idx) => (
                  <tr key={ev.id || idx} className="border-b border-slate-800">
                    <td className="border border-slate-800 p-2 font-mono">{ev.date}</td>
                    <td className="border border-slate-800 p-2 font-bold text-slate-900">{ev.title}</td>
                    <td className="border border-slate-800 p-2 font-semibold text-purple-900">{ev.category}</td>
                    <td className="border border-slate-800 p-2 text-slate-700">{ev.description || 'Gazetted Observance'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* REPORT MODULE 5: ANNUAL & MONTHLY SYLLABUS PLAN (Template Page 10 - 16)    */}
        {/* ------------------------------------------------------------------------- */}
        {(selectedReportType === 'ALL_MASTER_DIARY' || selectedReportType === 'ANNUAL_PLAN' || selectedReportType === 'MONTHLY_PLAN') && (
          <div className="report-page space-y-4 pt-6 border-t-2 border-slate-900">
            <TemplateWatermark pageNo="10 - 16" title="Annual & Split-Up Syllabus Execution Register" />

            <div className="text-center border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase text-slate-900">
                SPLIT-UP SYLLABUS & MONTHLY TARGET EXECUTION REGISTER
              </h2>
              <p className="text-xs text-slate-600">Template Pages 10 to 16 Annual Curriculum Allocation</p>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                  <th className="border border-slate-800 p-2 w-24">Month</th>
                  <th className="border border-slate-800 p-2 w-20">Class</th>
                  <th className="border border-slate-800 p-2">Chapter & Topic Title</th>
                  <th className="border border-slate-800 p-2 w-16 text-center">Periods</th>
                  <th className="border border-slate-800 p-2">Target & Suggested Activities</th>
                  <th className="border border-slate-800 p-2 w-20 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSyllabus.map((s, idx) => {
                  const sMonth = s.month || (s as any).targetMonth || '-';
                  const sChapter = s.chapterTitle || (s as any).chapterName || s.unitTitle || '-';
                  const sSubtopics = (s as any).subtopics || s.teachingTarget || '';
                  const sPeriods = s.periodsRequired || (s as any).allottedPeriods || '-';
                  const sActivities = (s as any).suggestedActivities || s.projectWork || s.practicalWork || 'Standard NCERT Activities';
                  const sStatus = s.completionStatus || (s as any).status || 'Planned';

                  return (
                    <tr key={s.id || idx} className="border-b border-slate-800">
                      <td className="border border-slate-800 p-2 font-bold">{sMonth}</td>
                      <td className="border border-slate-800 p-2 font-semibold">Class {s.className}</td>
                      <td className="border border-slate-800 p-2">
                        <strong className="block text-slate-900">{sChapter}</strong>
                        {sSubtopics && <span className="text-[10px] text-slate-600">{sSubtopics}</span>}
                      </td>
                      <td className="border border-slate-800 p-2 text-center font-mono">{sPeriods}</td>
                      <td className="border border-slate-800 p-2 text-slate-700">{sActivities}</td>
                      <td className="border border-slate-800 p-2 text-center font-bold text-slate-900">{sStatus}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* REPORT MODULE 6: DAILY LESSON PLANS (Template Page 48 & 49)               */}
        {/* ------------------------------------------------------------------------- */}
        {(selectedReportType === 'ALL_MASTER_DIARY' || selectedReportType === 'DAILY_LESSON_PLAN') && (
          <div className="report-page space-y-6 pt-6 border-t-2 border-slate-900">
            <TemplateWatermark pageNo="48 & 49" title="Daily & Period-wise Lesson Plans" />

            <div className="text-center border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase text-slate-900">
                DAILY & PERIOD-WISE LESSON PLAN RECORDS
              </h2>
              <p className="text-xs text-slate-600">Template Pages 48 & 49 Detailed Pedagogical Execution</p>
            </div>

            {filteredLessonPlans.map((lp, idx) => {
              const lpSkills = (lp as any).focusedSkillsCompetencies || lp.teachingObjectives || '-';
              const lpPedagogy = (lp as any).teachingPedagogyMethod || lp.teachingMethod || lp.pedagogicalStrategies || '-';
              const lpActivity = (lp as any).plannedActivityProcedure || lp.classroomActivity || '-';
              const lpBlackboard = (lp as any).blackboardWorkSummary || lp.blackboardSummary || '-';

              return (
                <div key={lp.id || idx} className="border-2 border-slate-900 p-4 space-y-3 bg-white">
                  <div className="grid grid-cols-4 gap-2 text-xs border-b border-slate-800 pb-2 font-bold bg-slate-100 p-2">
                    <div>Date: <span className="font-normal">{lp.date} ({lp.day})</span></div>
                    <div>Class & Sec: <span className="font-normal">Class {lp.className}-{lp.section}</span></div>
                    <div>Subject: <span className="font-normal">{lp.subjectName}</span></div>
                    <div>Period No: <span className="font-normal">#{lp.periodNo}</span></div>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <p><strong>Topic & Subtopic:</strong> <span className="font-bold text-slate-900">{lp.topic}</span> ({lp.subtopic || lp.chapterTitle})</p>
                    <p><strong>Focused Skills / Competencies:</strong> {lpSkills}</p>
                    <p><strong>Learning Outcomes:</strong> {lp.learningOutcomes}</p>
                    <p><strong>Pedagogical Strategies:</strong> {lpPedagogy}</p>
                    <p><strong>Classroom Activity / Lab Demonstration:</strong> {lpActivity}</p>
                    <p><strong>Blackboard Work / Summary:</strong> {lpBlackboard}</p>
                    <p><strong>Teacher Self-Reflection:</strong> <span className="italic text-purple-950 font-medium">{lp.teacherReflection || 'Delivered effectively.'}</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* REPORT MODULE 7: HOMEWORK & ASSIGNMENT LOG (Template Page 22 & 23)        */}
        {/* ------------------------------------------------------------------------- */}
        {(selectedReportType === 'ALL_MASTER_DIARY' || selectedReportType === 'HOMEWORK_LOG') && (
          <div className="report-page space-y-4 pt-6 border-t-2 border-slate-900">
            <TemplateWatermark pageNo="22 & 23" title="Homework, Assignment & Practice Exercise Log" />

            <div className="text-center border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase text-slate-900">
                HOMEWORK & ASSIGNMENT ASSIGNMENT REGISTER
              </h2>
              <p className="text-xs text-slate-600">Template Pages 22 & 23 Home Exercise Records</p>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                  <th className="border border-slate-800 p-2 w-28">Date Assigned</th>
                  <th className="border border-slate-800 p-2 w-20">Class</th>
                  <th className="border border-slate-800 p-2">Topic & Homework Task</th>
                  <th className="border border-slate-800 p-2">Slow Learner Remedial Support</th>
                  <th className="border border-slate-800 p-2">Advanced Learner Enrichment</th>
                </tr>
              </thead>
              <tbody>
                {filteredLessonPlans.map((lp, idx) => (
                  <tr key={lp.id || idx} className="border-b border-slate-800 align-top">
                    <td className="border border-slate-800 p-2 font-mono">{lp.date}</td>
                    <td className="border border-slate-800 p-2 font-bold">Class {lp.className}-{lp.section}</td>
                    <td className="border border-slate-800 p-2">
                      <strong className="block text-slate-900">{lp.topic}</strong>
                      <span className="text-slate-700">{lp.homework || (lp as any).assessmentHomeworkAssigned || 'NCERT Chapter Exercise Questions'}</span>
                    </td>
                    <td className="border border-slate-800 p-2 text-slate-700">{lp.remedialWork || 'Simplified guided worksheet'}</td>
                    <td className="border border-slate-800 p-2 text-slate-700">{lp.enrichmentActivity || 'HOTS problem challenge'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* REPORT MODULE 8: ASSESSMENT & PROGRESS REGISTER (Template Page 24 - 30)   */}
        {/* ------------------------------------------------------------------------- */}
        {(selectedReportType === 'ALL_MASTER_DIARY' || selectedReportType === 'ASSESSMENT_PROGRESS') && (
          <div className="report-page space-y-4 pt-6 border-t-2 border-slate-900">
            <TemplateWatermark pageNo="24 - 30" title="Scholastic Assessment & Progress Register" />

            <div className="text-center border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase text-slate-900">
                SCHOLASTIC ASSESSMENT & STUDENT PROGRESS REGISTER
              </h2>
              <p className="text-xs text-slate-600">Template Pages 24 to 30 Evaluation & Progress Logs</p>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                  <th className="border border-slate-800 p-2 w-24">Date & Type</th>
                  <th className="border border-slate-800 p-2 w-16">Class</th>
                  <th className="border border-slate-800 p-2">Title & Topic</th>
                  <th className="border border-slate-800 p-2">Performance Remarks</th>
                  <th className="border border-slate-800 p-2">Remedial Support</th>
                  <th className="border border-slate-800 p-2">Follow-up Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((a, idx) => (
                  <tr key={a.id || idx} className="border-b border-slate-800 align-top">
                    <td className="border border-slate-800 p-2">
                      <span className="font-bold block text-slate-900">{a.assessmentType}</span>
                      <span className="text-[10px] text-slate-600 font-mono">{a.date}</span>
                    </td>
                    <td className="border border-slate-800 p-2 font-bold">Class {a.className}-{a.section}</td>
                    <td className="border border-slate-800 p-2">
                      <strong className="block text-slate-900">{a.title}</strong>
                      <span className="text-slate-600">Topic: {a.topic}</span>
                    </td>
                    <td className="border border-slate-800 p-2 text-slate-800">{a.performanceRemarks || a.description || 'Satisfactory progress'}</td>
                    <td className="border border-slate-800 p-2 text-slate-800">{a.slowLearnerSupport || a.remedialTeaching || 'Targeted practice'}</td>
                    <td className="border border-slate-800 p-2 text-slate-800">{a.followUpAction || 'Reviewed in class'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* REPORT MODULE 9: MEDIA EVIDENCE APPENDIX (Template Page 40 - 45)          */}
        {/* ------------------------------------------------------------------------- */}
        {(selectedReportType === 'ALL_MASTER_DIARY' || selectedReportType === 'MEDIA_EVIDENCE') && (
          <div className="report-page space-y-4 pt-6 border-t-2 border-slate-900">
            <TemplateWatermark pageNo="40 - 45" title="Teaching & Activity Media Evidence Appendix" />

            <div className="text-center border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase text-slate-900">
                OFFICIAL CLASSROOM MEDIA & ACTIVITY EVIDENCE APPENDIX
              </h2>
              <p className="text-xs text-slate-600">Template Pages 40 to 45 Activity & Lab Photo Attachments</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {allMediaEvidence.map((ev, idx) => (
                <div key={ev.id || idx} className="border border-slate-800 p-3 space-y-2 bg-slate-50">
                  <div className="aspect-video bg-slate-200 rounded overflow-hidden relative border border-slate-300">
                    {ev.fileType === 'image' || ev.fileType === 'video' ? (
                      <img src={ev.fileUrl} alt={ev.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <FileText className="w-8 h-8 text-rose-600 mb-1" />
                        <span className="text-xs font-bold">{ev.fileName}</span>
                      </div>
                    )}
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-bold rounded">
                      {ev.category}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{ev.title}</h4>
                    <p className="text-[10px] text-slate-700 leading-snug mt-1">{ev.caption}</p>
                    <p className="text-[9px] text-slate-500 font-mono mt-1">Class {ev.className}-{ev.section} | {ev.subjectName} | {ev.uploadDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* REPORT MODULE 10: INSPECTION REMARKS & SEALS (Template Page 4, 48 & 50)  */}
        {/* ------------------------------------------------------------------------- */}
        {(selectedReportType === 'ALL_MASTER_DIARY' || selectedReportType === 'INSPECTION_REMARKS') && (
          <div className="report-page space-y-4 pt-6 border-t-2 border-slate-900">
            <TemplateWatermark pageNo="4, 48, 50" title="Supervisory Inspection & Approval Sign-offs" />

            <div className="text-center border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase text-slate-900">
                SUPERVISORY INSPECTION, REVIEW REMARKS & SEAL REGISTER
              </h2>
              <p className="text-xs text-slate-600">Template Pages 4, 48 & 50 Principal & Observer Approvals</p>
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                  <th className="border border-slate-800 p-2 w-24">Date</th>
                  <th className="border border-slate-800 p-2 w-32">Reviewer Title</th>
                  <th className="border border-slate-800 p-2">Record & Topic</th>
                  <th className="border border-slate-800 p-2">Inspection Remarks & Guidance</th>
                  <th className="border border-slate-800 p-2 w-28 text-center">Status & Seal</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((insp, idx) => (
                  <tr key={insp.id || idx} className="border-b border-slate-800 align-top">
                    <td className="border border-slate-800 p-2 font-mono">{insp.reviewDate || (insp as any).submissionDate}</td>
                    <td className="border border-slate-800 p-2">
                      <strong className="block text-slate-900">{insp.reviewerName || insp.reviewerRole}</strong>
                      <span className="text-[10px] text-slate-600">{insp.reviewerDesignation}</span>
                    </td>
                    <td className="border border-slate-800 p-2">
                      <strong className="block text-slate-900">{insp.recordTitle}</strong>
                      <span className="text-slate-600">{insp.recordType}</span>
                    </td>
                    <td className="border border-slate-800 p-2 leading-relaxed text-slate-800">
                      {insp.remarks || 'Standard approved entry.'}
                    </td>
                    <td className="border border-slate-800 p-2 text-center">
                      <span className="font-bold uppercase text-[10px] block text-slate-900">{insp.status}</span>
                      {insp.sealStampText && (
                        <div className="text-[8px] font-black uppercase tracking-wider text-purple-950 border border-slate-900 p-0.5 rounded mt-1 bg-slate-100">
                          {insp.sealStampText}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* REPORT MODULE 11: MONTHLY PROGRESS SUMMARY (Template Page 51 & 52)         */}
        {/* ------------------------------------------------------------------------- */}
        {(selectedReportType === 'ALL_MASTER_DIARY' || selectedReportType === 'MONTHLY_SUMMARY') && (
          <div className="report-page space-y-6 pt-6 border-t-2 border-slate-900">
            <TemplateWatermark pageNo="51 & 52" title="Monthly Teaching Progress Summary" />

            <div className="text-center border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase text-slate-900">
                MONTHLY TEACHING PROGRESS & SYLLABUS EXECUTION SUMMARY
              </h2>
              <p className="text-xs text-slate-600">Template Pages 51 & 52 Monthly Audit Sign-off</p>
            </div>

            <div className="border-2 border-slate-900 p-6 space-y-4 bg-white text-xs">
              <div className="grid grid-cols-3 gap-4 border-b border-slate-800 pb-3 font-bold">
                <div>Total Lesson Plans Created: <span className="text-purple-900">{lessonPlans.length}</span></div>
                <div>Completed Topics: <span className="text-emerald-800">{lessonPlans.filter(p => p.completionStatus === 'Completed').length}</span></div>
                <div>Assessments Logged: <span className="text-blue-900">{assessments.length}</span></div>
              </div>

              <div className="space-y-2 leading-relaxed">
                <p><strong>Self-Audit Remarks by Subject Teacher:</strong></p>
                <p className="p-3 bg-slate-50 border border-slate-300 italic text-slate-800">
                  "Syllabus coverage is fully aligned with KVS split-up timetable. Slow learner remedial sessions conducted regularly with guided practice worksheets attached in Appendix."
                </p>
              </div>

              {/* End Signatures Block */}
              <div className="pt-10 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-900">
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Teacher</span>
                  <p className="text-[10px] font-normal text-slate-500 mt-0.5">{getTeacherName(teacher)}</p>
                </div>
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Coordinator</span>
                  <p className="text-[10px] font-normal text-slate-500 mt-0.5">Smt. Anjali Verma</p>
                </div>
                <div className="pt-8 border-t border-slate-400">
                  <span>Signature of Principal</span>
                  <p className="text-[10px] font-normal text-slate-500 mt-0.5">{school.principalName || 'Dr. Sunita Deshmukh'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
