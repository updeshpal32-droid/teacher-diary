import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SubjectCommitteeMeetingRecord24, RemedialAttachmentItem } from '../types/academic';
import { db, DEFAULT_SUBJECT_MEETINGS_24 } from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Printer,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  Save,
  FileText,
  Image,
  Mic,
  Video,
  File,
  Paperclip,
  Eye,
  Calendar,
  ShieldCheck,
  Volume2,
  Layers,
  GraduationCap
} from 'lucide-react';

interface SubjectCommitteeManagerProps {
  devMode?: boolean;
  diaryMode?: 'middle-secondary' | 'foundational-preparatory';
}

const SUBJECT_OPTIONS = [
  'Mathematics (041)',
  'Science (086)',
  'English Core (301)',
  'Hindi (002)',
  'Social Science (087)',
  'Physics (042)',
  'Chemistry (043)',
  'Biology (044)',
  'Computer Science / AI (083)',
  'Economics (030)'
];

export const SubjectCommitteeManager: React.FC<SubjectCommitteeManagerProps> = ({
  devMode,
  diaryMode = 'middle-secondary'
}) => {
  const isFoundational = diaryMode === 'foundational-preparatory';
  const moduleNumber = isFoundational ? '18' : '24';
  const pageRange = isFoundational ? 'P-22 to 26' : 'P-47 to 51';
  const storageKey = isFoundational ? 'setup:subject_meetings_foundational' : 'setup:subject_meetings_24';

  const [records, setRecords] = useState<SubjectCommitteeMeetingRecord24[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SubjectCommitteeMeetingRecord24 | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Media Preview Viewer Modal
  const [previewAttachment, setPreviewAttachment] = useState<{
    item: RemedialAttachmentItem;
    contextTitle: string;
  } | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<SubjectCommitteeMeetingRecord24>>({
    slNo: 1,
    dateOfMeeting: new Date().toLocaleDateString('en-GB'),
    subjectName: 'Mathematics (041)',
    gistOfDecisionsSuggestions: '',
    followUpActions: '',
    pageNumber: 1,
    attachments: [],
    remarks: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [storageKey]);

  const loadData = async () => {
    setLoading(true);
    const saved = await db.get<SubjectCommitteeMeetingRecord24[]>(storageKey);
    if (saved && saved.length > 0) {
      setRecords(saved);
    } else {
      setRecords(DEFAULT_SUBJECT_MEETINGS_24);
      await db.set(storageKey, DEFAULT_SUBJECT_MEETINGS_24);
    }
    setLoading(false);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const getNextSlNo = (pNum: number) => {
    const pageRecords = records.filter(r => r.pageNumber === pNum);
    return pageRecords.length + 1;
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    const nextSlNo = getNextSlNo(selectedPage);
    setFormState({
      slNo: nextSlNo,
      dateOfMeeting: new Date().toLocaleDateString('en-GB'),
      subjectName: selectedSubject !== 'All' ? selectedSubject : 'Mathematics (041)',
      gistOfDecisionsSuggestions: '',
      followUpActions: '',
      pageNumber: selectedPage,
      attachments: [],
      remarks: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: SubjectCommitteeMeetingRecord24) => {
    setEditingRecord(rec);
    setFormState({
      ...rec,
      attachments: rec.attachments || []
    });
    setIsModalOpen(true);
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this subject committee meeting entry?')) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      await db.set(storageKey, updated);
      showNotification('Subject committee entry deleted.');
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (window.confirm(`Reset ${moduleNumber}. Subject Committee Meetings records to official defaults?`)) {
      setRecords(DEFAULT_SUBJECT_MEETINGS_24);
      await db.set(storageKey, DEFAULT_SUBJECT_MEETINGS_24);
      showNotification('Subject committee records reset to defaults.');
    }
  };

  // Upload Evidence File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      let type: 'photo' | 'audio' | 'video' | 'pdf' | 'other' = 'other';
      if (file.type.startsWith('image/')) type = 'photo';
      else if (file.type.startsWith('audio/')) type = 'audio';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type === 'application/pdf') type = 'pdf';

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const newAttachment: RemedialAttachmentItem = {
          id: `att-scm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type,
          title: file.name,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          uploadedAt: new Date().toISOString().slice(0, 10),
          dataUrl: result
        };

        setFormState(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Remove Attachment
  const handleRemoveAttachment = (attachmentId: string) => {
    setFormState(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== attachmentId)
    }));
  };

  // Save Record
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.dateOfMeeting?.trim() || !formState.gistOfDecisionsSuggestions?.trim()) {
      alert('Please fill in Date of meeting and Gist of Decisions/Suggestions.');
      return;
    }

    const slNoVal = Number(formState.slNo) || getNextSlNo(formState.pageNumber || selectedPage);

    const recordToSave: SubjectCommitteeMeetingRecord24 = {
      id: editingRecord ? editingRecord.id : `scm-${Date.now()}`,
      slNo: slNoVal,
      dateOfMeeting: formState.dateOfMeeting.trim(),
      subjectName: formState.subjectName?.trim() || 'General Subject Committee',
      gistOfDecisionsSuggestions: formState.gistOfDecisionsSuggestions.trim(),
      followUpActions: formState.followUpActions?.trim() || '',
      pageNumber: formState.pageNumber || selectedPage,
      attachments: formState.attachments || [],
      remarks: formState.remarks,
      templatePageRef: isFoundational ? 22 : 47
    };

    let updatedList: SubjectCommitteeMeetingRecord24[] = [];
    if (editingRecord) {
      updatedList = records.map(r => r.id === editingRecord.id ? recordToSave : r);
    } else {
      updatedList = [...records, recordToSave];
    }

    setRecords(updatedList);
    await db.set(storageKey, updatedList);
    setIsModalOpen(false);
    showNotification('Subject committee minutes and evidence saved successfully.');
  };

  // Filtered List
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchPage = selectedPage === 0 || rec.pageNumber === selectedPage;
      const matchSubject = selectedSubject === 'All' || rec.subjectName === selectedSubject;
      const matchSearch = searchTerm === '' ||
        rec.dateOfMeeting.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.gistOfDecisionsSuggestions.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.followUpActions.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.subjectName && rec.subjectName.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchPage && matchSubject && matchSearch;
    });
  }, [records, selectedPage, selectedSubject, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Dev Mode Traceability Badge */}
      {devMode && (
        <DevModeBadge
          pages={isFoundational ? 22 : 47}
          title={`${moduleNumber}. मासिक विषय समिति की बैठक का कार्यवृत्त सार (GIST OF THE MONTHLY SUBJECT COMMITTEE MEETINGS - ${pageRange})`}
        />
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1.5">
              <BookOpen className="w-4 h-4" />
              <span>KVS Teacher Diary • {isFoundational ? 'Foundational Portal (P-22 to 26)' : 'Middle & Secondary Portal (P-47 to 51)'}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {moduleNumber}. मासिक विषय समिति की बैठक का कार्यवृत्त सार
            </h1>
            <h2 className="text-sm font-bold text-slate-300 tracking-wide mt-0.5 uppercase">
              GIST OF THE MONTHLY SUBJECT COMMITTEE MEETINGS
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Subject department coordination, question paper moderation, syllabus split-up pacing, lab activities, Olympiad coaching, and pedagogical follow-ups with multimedia evidence (Whiteboard photos, audio discussions, PDF blueprints).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shadow transition"
              title="Print official register"
            >
              <Printer className="w-4 h-4 text-purple-400" />
              <span>Print {pageRange}</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Committee Meeting</span>
            </button>
          </div>
        </div>

        {/* Action Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Document departmental consensus on periodic test blueprints, practical activities, and competency teaching strategies.</span>
          </div>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1 text-slate-400 hover:text-slate-200 transition text-[11px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* SUBJECT & PAGE SELECTOR BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-300">Department:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="All">All Subjects / Departments</option>
              {SUBJECT_OPTIONS.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* 5 Pages Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2">Page:</span>
            {[1, 2, 3, 4, 5].map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setSelectedPage(pageNum)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedPage === pageNum
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Page {pageNum}
              </button>
            ))}
            <button
              onClick={() => setSelectedPage(0)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedPage === 0
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by date, subject, decisions, or follow up actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* OFFICIAL 3-COLUMN REGISTER TABLE (MATCHING IMAGE 3) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Exact Headers matching official register */}
              <tr className="bg-slate-950 border-b-2 border-slate-800 text-slate-200 font-extrabold text-center">
                <th className="p-3 border-r border-slate-800 w-[140px] text-center">
                  Date of meeting
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[380px] text-left">
                  Gist of the Decisions/Suggestions
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[320px] text-left">
                  Follow Up actions
                </th>
                <th className="p-3 min-w-[75px] text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-400">
                        No subject committee meeting records found for Page {selectedPage}.
                      </span>
                      <button
                        onClick={handleOpenCreateModal}
                        className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-bold underline"
                      >
                        Add subject committee meeting
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-800/50 transition">
                    {/* Column 1: Date of meeting */}
                    <td className="p-3.5 border-r border-slate-800 font-bold text-slate-100 align-top text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center gap-1 text-purple-300 font-mono text-xs font-bold">
                          <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>{row.dateOfMeeting}</span>
                        </div>
                        {row.subjectName && (
                          <span className="px-2 py-0.5 bg-indigo-950/80 border border-indigo-800/60 rounded-full text-[10px] text-indigo-300 font-semibold mt-1">
                            {row.subjectName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 2: Gist of the Decisions/Suggestions + Evidence Attachments */}
                    <td className="p-3.5 border-r border-slate-800 text-slate-200 leading-relaxed align-top">
                      <p className="text-xs font-medium whitespace-pre-line leading-relaxed">{row.gistOfDecisionsSuggestions}</p>

                      {/* Attached Evidence Badges */}
                      {row.attachments && row.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
                          {row.attachments.map(att => (
                            <button
                              key={att.id}
                              type="button"
                              onClick={() => setPreviewAttachment({ item: att, contextTitle: `Subject Committee Evidence: ${row.subjectName || 'Meeting'}` })}
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition cursor-pointer bg-purple-950/80 text-purple-300 border-purple-800/50 hover:bg-purple-900/80"
                            >
                              {att.type === 'photo' && <Image className="w-3 h-3 text-emerald-400" />}
                              {att.type === 'audio' && <Volume2 className="w-3 h-3 text-amber-400" />}
                              {att.type === 'video' && <Video className="w-3 h-3 text-rose-400" />}
                              {att.type === 'pdf' && <FileText className="w-3 h-3 text-indigo-400" />}
                              <span className="truncate max-w-[140px]">{att.title}</span>
                              <Eye className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Column 3: Follow Up actions */}
                    <td className="p-3.5 border-r border-slate-800 text-slate-300 align-top">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                          {row.followUpActions || 'Actions under execution by department.'}
                        </p>
                      </div>
                    </td>

                    {/* Column 4: Actions */}
                    <td className="p-3 text-center align-top">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                          title="Edit committee entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete committee entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL FOR SUBJECT COMMITTEE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {editingRecord ? 'Edit Subject Committee Minutes' : `Add ${moduleNumber}. Subject Committee Meeting`}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Date of meeting <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12/07/2025"
                    value={formState.dateOfMeeting}
                    onChange={(e) => setFormState({ ...formState, dateOfMeeting: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Subject / Department <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formState.subjectName}
                    onChange={(e) => setFormState({ ...formState, subjectName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  >
                    {SUBJECT_OPTIONS.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gist of the Decisions/Suggestions */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Gist of the Decisions/Suggestions <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Record syllabus split-up discussion, test question paper blueprints, laboratory demo allocation, slow learner worksheets..."
                  value={formState.gistOfDecisionsSuggestions}
                  onChange={(e) => setFormState({ ...formState, gistOfDecisionsSuggestions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-purple-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* Follow Up actions */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Follow Up actions
                </label>
                <textarea
                  rows={3}
                  placeholder="Document departmental actions to be executed, lab period schedules, worksheet distribution status..."
                  value={formState.followUpActions}
                  onChange={(e) => setFormState({ ...formState, followUpActions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-purple-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* MULTIMEDIA EVIDENCE UPLOAD */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attach Evidence (Whiteboard Notes, Audio Recording, PDF Blueprints)</span>
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,audio/*,video/*,.pdf"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                  >
                    <Paperclip className="w-3 h-3 text-purple-400" />
                    <span>Upload Evidence</span>
                  </button>
                </div>

                {formState.attachments && formState.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formState.attachments.map(att => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-200"
                      >
                        {att.type === 'photo' && <Image className="w-3.5 h-3.5 text-emerald-400" />}
                        {att.type === 'audio' && <Mic className="w-3.5 h-3.5 text-amber-400" />}
                        {att.type === 'video' && <Video className="w-3.5 h-3.5 text-rose-400" />}
                        {att.type === 'pdf' && <FileText className="w-3.5 h-3.5 text-indigo-400" />}
                        <span className="truncate max-w-[140px] font-medium">{att.title}</span>
                        <span className="text-[9px] text-slate-500 font-mono">({att.fileSize})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-slate-500 hover:text-rose-400 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  <span>Save Committee Minutes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEDIA PREVIEW MODAL */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                  {previewAttachment.contextTitle}
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {previewAttachment.item.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col items-center justify-center min-h-[250px]">
              {previewAttachment.item.type === 'photo' && previewAttachment.item.dataUrl ? (
                <img
                  src={previewAttachment.item.dataUrl}
                  alt={previewAttachment.item.title}
                  className="max-h-[450px] w-auto rounded-lg object-contain border border-slate-800 shadow"
                />
              ) : previewAttachment.item.type === 'audio' && previewAttachment.item.dataUrl ? (
                <div className="w-full max-w-md space-y-4 p-4 text-center">
                  <div className="p-4 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 w-16 h-16 mx-auto flex items-center justify-center">
                    <Volume2 className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-bold text-white">{previewAttachment.item.title}</div>
                  <audio controls className="w-full mt-2" src={previewAttachment.item.dataUrl} />
                </div>
              ) : previewAttachment.item.type === 'video' && previewAttachment.item.dataUrl ? (
                <video controls className="w-full rounded-xl border border-slate-800 shadow max-h-[400px]" src={previewAttachment.item.dataUrl} />
              ) : previewAttachment.item.type === 'pdf' && previewAttachment.item.dataUrl ? (
                <iframe src={previewAttachment.item.dataUrl} title={previewAttachment.item.title} className="w-full h-[450px] rounded-xl border border-slate-800" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center p-8">
                  <FileText className="w-16 h-16 text-indigo-400/60" />
                  <span className="text-sm font-bold text-slate-200">{previewAttachment.item.fileName}</span>
                  <span className="text-xs text-slate-400">Attached committee document ({previewAttachment.item.fileSize}).</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end text-xs pt-2 border-t border-slate-800">
              <button
                onClick={() => setPreviewAttachment(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectCommitteeManager;
