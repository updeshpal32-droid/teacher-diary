import React, { useState, useEffect } from 'react';
import {
  InspectionReviewRecord,
  ReviewerRole,
  ReviewStatus,
  DailyLessonPlan,
  AssessmentProgressRecord
} from '../types/academic';
import { db, DEFAULT_INSPECTION_RECORDS, DEFAULT_LESSON_PLANS, DEFAULT_ASSESSMENT_RECORDS } from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  Search,
  Filter,
  UserCheck,
  Edit2,
  Trash2,
  Save,
  X,
  Printer,
  Sparkles,
  FileCheck,
  Send,
  Stamp,
  User,
  RotateCcw,
  BookOpen,
  Calendar,
  Building
} from 'lucide-react';

interface InspectionReviewManagerProps {
  devMode: boolean;
  onSaved?: () => void;
}

const ROLES: { role: ReviewerRole; label: string; icon: string; description: string }[] = [
  { role: 'Teacher', label: '👩‍🏫 Teacher View', icon: 'User', description: 'Submit records for review & view principal/observer feedback' },
  { role: 'Coordinator', label: '📊 Coordinator / HOD', icon: 'UserCheck', description: 'Verify daily plans & assessment registers' },
  { role: 'Principal', label: '🏛️ Principal / Admin', icon: 'ShieldCheck', description: 'Monthly approval sign-off & official seal stamp' },
  { role: 'Assistant Commissioner', label: '⭐ Assistant Commissioner / Observer', icon: 'Award', description: 'Annual KVS inspection audit & official inspection remarks' }
];

export const InspectionReviewManager: React.FC<InspectionReviewManagerProps> = ({ devMode, onSaved }) => {
  const [records, setRecords] = useState<InspectionReviewRecord[]>(DEFAULT_INSPECTION_RECORDS);
  const [lessonPlans, setLessonPlans] = useState<DailyLessonPlan[]>(DEFAULT_LESSON_PLANS);
  const [assessments, setAssessments] = useState<AssessmentProgressRecord[]>(DEFAULT_ASSESSMENT_RECORDS);
  const [loading, setLoading] = useState(true);

  // Active Role Switcher
  const [activeRole, setActiveRole] = useState<ReviewerRole>('Principal');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [recordTypeFilter, setRecordTypeFilter] = useState('All');

  // Modals & UI state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State for Reviewing
  const [selectedReview, setSelectedReview] = useState<InspectionReviewRecord | null>(null);
  const [reviewForm, setReviewForm] = useState<{
    reviewerName: string;
    reviewerDesignation: string;
    reviewerRole: ReviewerRole;
    status: ReviewStatus;
    remarks: string;
    suggestions: string;
    digitalSignatureName: string;
    sealStampText: string;
    templatePageRef: number;
  }>({
    reviewerName: 'Dr. Sunita Deshmukh',
    reviewerDesignation: 'Principal, KV No.1 Delhi Cantt',
    reviewerRole: 'Principal',
    status: 'Approved',
    remarks: '',
    suggestions: '',
    digitalSignatureName: 'Sunita Deshmukh (Principal)',
    sealStampText: 'OFFICIALLY APPROVED - PRINCIPAL KV NO.1',
    templatePageRef: 4
  });

  // Form State for Teacher submitting new record
  const [submitForm, setSubmitForm] = useState({
    recordType: 'Daily Lesson Plan' as 'Daily Lesson Plan' | 'Syllabus Plan' | 'Assessment Register' | 'Complete Teacher Diary',
    recordId: '',
    recordTitle: '',
    teacherName: 'Dr. Ramesh Sharma (PGT Math)',
    className: 'X-A',
    subjectName: 'Mathematics (041)',
    targetRole: 'Principal' as ReviewerRole,
    templatePageRef: 4
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const savedInspections = await db.get<InspectionReviewRecord[]>('setup:inspections');
    const savedPlans = await db.get<DailyLessonPlan[]>('setup:lesson_plans');
    const savedAssessments = await db.get<AssessmentProgressRecord[]>('setup:assessments');

    if (savedInspections) setRecords(savedInspections);
    if (savedPlans) setLessonPlans(savedPlans);
    if (savedAssessments) setAssessments(savedAssessments);

    setLoading(false);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const openReviewModal = (record: InspectionReviewRecord) => {
    setSelectedReview(record);
    const isAC = activeRole === 'Assistant Commissioner';
    const isPrincipal = activeRole === 'Principal';

    setReviewForm({
      reviewerName: record.reviewerName || (isAC ? 'Shri V. K. Aggarwal' : isPrincipal ? 'Dr. Sunita Deshmukh' : 'Smt. Anjali Verma'),
      reviewerDesignation: record.reviewerDesignation || (isAC ? 'Assistant Commissioner, KVS Regional Office' : isPrincipal ? 'Principal, KV No.1 Delhi' : 'Academic Coordinator'),
      reviewerRole: activeRole,
      status: record.status === 'Pending' ? (isAC ? 'Inspected & Stamped' : 'Approved') : record.status,
      remarks: record.remarks || '',
      suggestions: record.suggestions || '',
      digitalSignatureName: record.digitalSignatureName || (isAC ? 'V. K. Aggarwal (AC)' : isPrincipal ? 'Sunita Deshmukh (Principal)' : 'Anjali Verma (Coordinator)'),
      sealStampText: record.sealStampText || (isAC ? 'INSPECTED & STAMPED - ASSISTANT COMMISSIONER KVS RO' : 'OFFICIALLY APPROVED - PRINCIPAL KV NO.1'),
      templatePageRef: record.templatePageRef || (isAC ? 48 : 4)
    });
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async () => {
    if (!selectedReview) return;

    const today = new Date().toISOString().split('T')[0];
    const updatedRecord: InspectionReviewRecord = {
      ...selectedReview,
      reviewDate: today,
      reviewerName: reviewForm.reviewerName,
      reviewerRole: reviewForm.reviewerRole,
      reviewerDesignation: reviewForm.reviewerDesignation,
      status: reviewForm.status,
      remarks: reviewForm.remarks,
      suggestions: reviewForm.suggestions,
      digitalSignatureName: reviewForm.digitalSignatureName,
      sealStampText: reviewForm.sealStampText,
      templatePageRef: reviewForm.templatePageRef
    };

    const updated = records.map(r => (r.id === selectedReview.id ? updatedRecord : r));
    setRecords(updated);
    await db.set('setup:inspections', updated);
    setIsReviewModalOpen(false);
    showToast(`✨ Review status updated to "${reviewForm.status}" with digital seal stamp!`);
    if (onSaved) onSaved();
  };

  const handleTeacherSubmitNewRecord = async () => {
    if (!submitForm.recordTitle.trim()) {
      alert('Please select or enter record title.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newRecord: InspectionReviewRecord = {
      id: `insp-${Date.now()}`,
      recordType: submitForm.recordType,
      recordId: submitForm.recordId || `rec-${Date.now()}`,
      recordTitle: submitForm.recordTitle,
      teacherName: submitForm.teacherName,
      className: submitForm.className,
      subjectName: submitForm.subjectName,
      submissionDate: today,
      reviewerRole: submitForm.targetRole,
      status: 'Pending',
      templatePageRef: submitForm.templatePageRef
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    await db.set('setup:inspections', updated);
    setIsSubmitModalOpen(false);
    showToast('🚀 Record successfully submitted for inspection & approval!');
    if (onSaved) onSaved();
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Delete this inspection review record?')) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      await db.set('setup:inspections', updated);
      showToast('Record deleted.');
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset to standard KVS inspection & review records?')) {
      setRecords(DEFAULT_INSPECTION_RECORDS);
      await db.set('setup:inspections', DEFAULT_INSPECTION_RECORDS);
      showToast('Reset to default inspection records.');
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch =
      r.recordTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.remarks && r.remarks.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.reviewerName && r.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesRecordType = recordTypeFilter === 'All' || r.recordType === recordTypeFilter;

    return matchesSearch && matchesStatus && matchesRecordType;
  });

  if (loading) {
    return <div className="p-8 text-center text-purple-300">Loading Inspection & Review Workflows...</div>;
  }

  if (isPrintMode) {
    return (
      <div className="bg-white text-slate-900 min-h-screen p-8 print:p-0">
        <div className="no-print mb-6 flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Printer className="w-5 h-5 text-purple-400" />
              Print Preview: Teacher Diary Inspection & Observer Log
            </h3>
            <p className="text-xs text-slate-400">
              Official KVS/CBSE Template Pages 4, 48 & 50 Assistant Commissioner & Principal Remarks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-md"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={() => setIsPrintMode(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
            >
              <X className="w-4 h-4" />
              Close Preview
            </button>
          </div>
        </div>

        {/* Printable Official Inspection Log Sheet */}
        <div className="max-w-5xl mx-auto border-2 border-slate-900 p-8 space-y-6">
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-black uppercase tracking-wider">KENDRIYA VIDYALAYA SANGATHAN</h1>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mt-1">
              TEACHER'S DIARY INSPECTION, SUPERVISORY REMARKS & APPROVAL LOG
            </h2>
            <p className="text-xs font-medium text-slate-600 mt-1">
              Reference Pages: 4 (Principal Monthly Review), 48 (Assistant Commissioner Inspection), 50 (Observer Audit)
            </p>
          </div>

          <table className="w-full text-left text-xs border-collapse border border-slate-900">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                <th className="border border-slate-800 p-2.5 text-center w-12">S.N.</th>
                <th className="border border-slate-800 p-2.5">Date & Page Ref</th>
                <th className="border border-slate-800 p-2.5">Teacher & Submission</th>
                <th className="border border-slate-800 p-2.5">Reviewer Designation</th>
                <th className="border border-slate-800 p-2.5">Inspection Remarks & Guidance</th>
                <th className="border border-slate-800 p-2.5">Status & Digital Seal</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r, idx) => (
                <tr key={r.id} className="border-b border-slate-800 align-top">
                  <td className="border border-slate-800 p-2.5 text-center font-bold">{idx + 1}</td>
                  <td className="border border-slate-800 p-2.5">
                    <div className="font-bold">{r.reviewDate || r.submissionDate}</div>
                    <div className="text-[10px] text-purple-900 font-bold mt-1">Page #{r.templatePageRef}</div>
                  </td>
                  <td className="border border-slate-800 p-2.5">
                    <div className="font-bold text-slate-900">{r.recordTitle}</div>
                    <div className="text-[11px] text-slate-700">{r.teacherName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Class {r.className} | {r.subjectName}</div>
                  </td>
                  <td className="border border-slate-800 p-2.5">
                    <div className="font-bold text-slate-900">{r.reviewerName || 'Pending Reviewer'}</div>
                    <div className="text-[10px] text-slate-600">{r.reviewerDesignation || r.reviewerRole}</div>
                  </td>
                  <td className="border border-slate-800 p-2.5 space-y-1">
                    <div className="text-slate-900 font-medium">{r.remarks || 'No remarks added.'}</div>
                    {r.suggestions && (
                      <div className="text-[11px] text-slate-700 italic border-l-2 border-slate-800 pl-2 mt-1">
                        <strong>Suggestions:</strong> {r.suggestions}
                      </div>
                    )}
                  </td>
                  <td className="border border-slate-800 p-2.5 space-y-1">
                    <span className="font-bold uppercase text-[11px] block text-slate-900">{r.status}</span>
                    {r.sealStampText && (
                      <div className="text-[9px] font-black uppercase tracking-wider text-purple-950 border border-slate-900 p-1 rounded text-center bg-slate-100">
                        {r.sealStampText}
                      </div>
                    )}
                    {r.digitalSignatureName && (
                      <div className="text-[10px] text-slate-600 font-mono mt-1">
                        Signed: {r.digitalSignatureName}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t-2 border-slate-900 pt-10 mt-16 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-900">
            <div className="pt-8 border-t border-slate-400">
              <span>Signature of Teacher</span>
            </div>
            <div className="pt-8 border-t border-slate-400">
              <span>Signature of Principal</span>
            </div>
            <div className="pt-8 border-t border-slate-400">
              <span>Assistant Commissioner / Inspector</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {devMode && (
        <DevModeBadge
          pages={[4, 48, 50]}
          title="Digitizes Template Pages 4, 48, 50: Inspection, Assistant Commissioner Remarks, Principal Approval Sign-off & Digital Seal Stamps"
          fieldCount={records.length}
        />
      )}

      {notification && (
        <div className="p-3 bg-purple-950/80 border border-purple-500/40 text-purple-200 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            {notification}
          </span>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4 text-purple-300" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              Inspection, Review & Approval Workflows
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              KVS Template Pages 4, 48 & 50
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review submitted daily lesson plans, syllabus split-ups, and teacher diaries. Add Principal / Assistant Commissioner inspection remarks, digital signatures, and official seal stamps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPrintMode(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-purple-300" />
            <span>Print Inspection Log</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition-colors"
            title="Reset to default inspection records"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md border border-purple-400/30"
          >
            <Send className="w-4 h-4" />
            <span>Submit Record for Review</span>
          </button>
        </div>
      </div>

      {/* Role Switcher Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Select Active Reviewer Role:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLES.map(r => (
            <button
              key={r.role}
              onClick={() => setActiveRole(r.role)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                activeRole === r.role
                  ? 'bg-purple-950/60 border-purple-500/80 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div>
                <span className="font-bold text-xs block">{r.label}</span>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{r.description}</p>
              </div>
              {activeRole === r.role && (
                <span className="text-[10px] font-bold text-purple-300 mt-2 self-end flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Mode
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search teacher, title, remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Returned for Correction">Returned for Correction</option>
              <option value="Inspected & Stamped">Inspected & Stamped</option>
            </select>
          </div>

          <div>
            <select
              value={recordTypeFilter}
              onChange={(e) => setRecordTypeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="All">All Record Types</option>
              <option value="Daily Lesson Plan">Daily Lesson Plan</option>
              <option value="Syllabus Plan">Syllabus Plan</option>
              <option value="Assessment Register">Assessment Register</option>
              <option value="Complete Teacher Diary">Complete Teacher Diary</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submitted & Inspection Records List */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
            <ShieldCheck className="w-12 h-12 mx-auto text-slate-700" />
            <p className="text-sm font-semibold">No inspection or review records match your filters.</p>
            <p className="text-xs text-slate-600">Click "Submit Record for Review" to add a new submission entry.</p>
          </div>
        ) : (
          filteredRecords.map((r) => {
            const isApproved = r.status === 'Approved' || r.status === 'Inspected & Stamped';
            const isPending = r.status === 'Pending';
            const isReturned = r.status === 'Returned for Correction';

            return (
              <div
                key={r.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-purple-300 border border-slate-700">
                        {r.recordType}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Ref Page: #{r.templatePageRef}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-100 flex items-center gap-2 mt-1">
                      {r.recordTitle}
                    </h3>

                    <p className="text-xs text-slate-400 flex items-center gap-3">
                      <span><strong>Teacher:</strong> {r.teacherName}</span>
                      <span>•</span>
                      <span>Class {r.className} ({r.subjectName})</span>
                      <span>•</span>
                      <span>Submitted: {r.submissionDate}</span>
                    </p>
                  </div>

                  {/* Status Badge & Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                        isApproved
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : isReturned
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {isApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> : isReturned ? <XCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {r.status}
                    </span>

                    {activeRole !== 'Teacher' && (
                      <button
                        onClick={() => openReviewModal(r)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                      >
                        <Stamp className="w-3.5 h-3.5" />
                        <span>Review & Seal</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteRecord(r.id)}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Reviewer Details & Seal Stamp Box */}
                {r.reviewerName ? (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-purple-400" />
                        <span className="font-bold text-slate-200">{r.reviewerName}</span>
                        <span className="text-slate-400">({r.reviewerDesignation})</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">Reviewed on: {r.reviewDate}</span>
                    </div>

                    {r.remarks && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Inspection Remarks:
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                          {r.remarks}
                        </p>
                      </div>
                    )}

                    {r.suggestions && (
                      <div>
                        <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block mb-0.5">
                          Suggestions for Improvement:
                        </span>
                        <p className="text-xs text-purple-200/90 leading-relaxed bg-purple-950/20 p-2.5 rounded-lg border border-purple-500/20">
                          {r.suggestions}
                        </p>
                      </div>
                    )}

                    {/* Official Digital Seal Stamp Box */}
                    {r.sealStampText && (
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <Stamp className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-black uppercase tracking-wider text-amber-300 px-3 py-1 bg-amber-950/40 border border-amber-500/40 rounded-lg">
                            {r.sealStampText}
                          </span>
                        </div>
                        {r.digitalSignatureName && (
                          <div className="text-xs text-slate-400 font-mono">
                            Digital Signature: <strong className="text-slate-200">{r.digitalSignatureName}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs text-amber-400/80 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Awaiting review from {r.reviewerRole}...
                    </span>
                    <span className="text-[11px] text-slate-500">Submitted on {r.submissionDate}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Review & Seal Modal */}
      {isReviewModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Stamp className="w-5 h-5 text-purple-400" />
                Inspect & Sign Record: {selectedReview.recordTitle}
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <p><strong>Teacher:</strong> {selectedReview.teacherName}</p>
              <p><strong>Class & Subject:</strong> Class {selectedReview.className} | {selectedReview.subjectName}</p>
              <p><strong>Record Type:</strong> {selectedReview.recordType}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Reviewer Name *</label>
                <input
                  type="text"
                  value={reviewForm.reviewerName}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Designation *</label>
                <input
                  type="text"
                  value={reviewForm.reviewerDesignation}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewerDesignation: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Approval Status *</label>
                <select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value as ReviewStatus })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="Approved">Approved</option>
                  <option value="Inspected & Stamped">Inspected & Stamped</option>
                  <option value="Returned for Correction">Returned for Correction</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Template Page Reference</label>
                <input
                  type="number"
                  value={reviewForm.templatePageRef}
                  onChange={(e) => setReviewForm({ ...reviewForm, templatePageRef: parseInt(e.target.value) || 4 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Inspection Remarks *</label>
              <textarea
                rows={3}
                value={reviewForm.remarks}
                onChange={(e) => setReviewForm({ ...reviewForm, remarks: e.target.value })}
                placeholder="Enter official inspection comments, observations..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-purple-300 block mb-1">Suggestions for Guidance</label>
              <textarea
                rows={2}
                value={reviewForm.suggestions}
                onChange={(e) => setReviewForm({ ...reviewForm, suggestions: e.target.value })}
                placeholder="Specific guidance for pedagogical improvement..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Digital Signature Name</label>
                <input
                  type="text"
                  value={reviewForm.digitalSignatureName}
                  onChange={(e) => setReviewForm({ ...reviewForm, digitalSignatureName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-amber-300 block mb-1">Official Seal Stamp Text</label>
                <input
                  type="text"
                  value={reviewForm.sealStampText}
                  onChange={(e) => setReviewForm({ ...reviewForm, sealStampText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
              >
                <Stamp className="w-4 h-4" />
                <span>Save Review & Stamp Seal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Record for Review Modal (Teacher Mode) */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-400" />
                Submit Record for Inspection & Approval
              </h3>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Record Category *</label>
                <select
                  value={submitForm.recordType}
                  onChange={(e) => setSubmitForm({ ...submitForm, recordType: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="Daily Lesson Plan">Daily Lesson Plan</option>
                  <option value="Syllabus Plan">Syllabus Plan</option>
                  <option value="Assessment Register">Assessment Register</option>
                  <option value="Complete Teacher Diary">Complete Teacher Diary</option>
                </select>
              </div>

              {submitForm.recordType === 'Daily Lesson Plan' && (
                <div>
                  <label className="text-[11px] font-semibold text-purple-300 block mb-1">Select Saved Lesson Plan *</label>
                  <select
                    onChange={(e) => {
                      const lp = lessonPlans.find(p => p.id === e.target.value);
                      if (lp) {
                        setSubmitForm({
                          ...submitForm,
                          recordId: lp.id,
                          recordTitle: `${lp.topic} (${lp.date})`,
                          className: `${lp.className}-${lp.section}`,
                          subjectName: lp.subjectName
                        });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value="">-- Choose Lesson Plan --</option>
                    {lessonPlans.map(lp => (
                      <option key={lp.id} value={lp.id}>
                        Class {lp.className}-{lp.section} | {lp.subjectName} | {lp.topic} ({lp.date})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {submitForm.recordType === 'Assessment Register' && (
                <div>
                  <label className="text-[11px] font-semibold text-purple-300 block mb-1">Select Assessment Record *</label>
                  <select
                    onChange={(e) => {
                      const asst = assessments.find(a => a.id === e.target.value);
                      if (asst) {
                        setSubmitForm({
                          ...submitForm,
                          recordId: asst.id,
                          recordTitle: asst.title,
                          className: `${asst.className}-${asst.section}`,
                          subjectName: asst.subjectName
                        });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value="">-- Choose Assessment Record --</option>
                    {assessments.map(a => (
                      <option key={a.id} value={a.id}>
                        Class {a.className}-{a.section} | {a.subjectName} | {a.title} ({a.date})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Record Title / Subject Line *</label>
                <input
                  type="text"
                  value={submitForm.recordTitle}
                  onChange={(e) => setSubmitForm({ ...submitForm, recordTitle: e.target.value })}
                  placeholder="e.g. Real Numbers Lesson Plan / Term 1 Diary Review"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Teacher Name *</label>
                  <input
                    type="text"
                    value={submitForm.teacherName}
                    onChange={(e) => setSubmitForm({ ...submitForm, teacherName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Submit To (Target Reviewer) *</label>
                  <select
                    value={submitForm.targetRole}
                    onChange={(e) => setSubmitForm({ ...submitForm, targetRole: e.target.value as ReviewerRole })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value="Principal">Principal</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Assistant Commissioner">Assistant Commissioner</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTeacherSubmitNewRecord}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit for Inspection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
