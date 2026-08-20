import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StaffMeetingRecord23, RemedialAttachmentItem } from '../types/academic';
import { db, DEFAULT_STAFF_MEETINGS_23 } from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  Users,
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
  Layers
} from 'lucide-react';

interface StaffMeetingManagerProps {
  devMode?: boolean;
  diaryMode?: 'middle-secondary' | 'foundational-preparatory';
}

export const StaffMeetingManager: React.FC<StaffMeetingManagerProps> = ({
  devMode,
  diaryMode = 'middle-secondary'
}) => {
  const isFoundational = diaryMode === 'foundational-preparatory';
  const moduleNumber = isFoundational ? '17' : '23';
  const pageRange = isFoundational ? 'P-17 to 21' : 'P-42 to 46';
  const storageKey = isFoundational ? 'setup:staff_meetings_foundational' : 'setup:staff_meetings_23';

  const [records, setRecords] = useState<StaffMeetingRecord23[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StaffMeetingRecord23 | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Media Preview Viewer Modal
  const [previewAttachment, setPreviewAttachment] = useState<{
    item: RemedialAttachmentItem;
    contextTitle: string;
  } | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<StaffMeetingRecord23>>({
    slNo: 1,
    monthAndDate: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    date: new Date().toISOString().slice(0, 10),
    meetingTitle: '',
    importantPoints: '',
    actionTakenFollowUp: '',
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
    const saved = await db.get<StaffMeetingRecord23[]>(storageKey);
    if (saved && saved.length > 0) {
      setRecords(saved);
    } else {
      setRecords(DEFAULT_STAFF_MEETINGS_23);
      await db.set(storageKey, DEFAULT_STAFF_MEETINGS_23);
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
      monthAndDate: `${new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' })} (${new Date().toLocaleDateString('en-GB')})`,
      date: new Date().toISOString().slice(0, 10),
      meetingTitle: '',
      importantPoints: '',
      actionTakenFollowUp: '',
      pageNumber: selectedPage,
      attachments: [],
      remarks: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: StaffMeetingRecord23) => {
    setEditingRecord(rec);
    setFormState({
      ...rec,
      attachments: rec.attachments || []
    });
    setIsModalOpen(true);
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff meeting minutes entry?')) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      await db.set(storageKey, updated);
      showNotification('Staff meeting entry deleted.');
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (window.confirm(`Reset ${moduleNumber}. Gist of Staff Meetings to official defaults?`)) {
      setRecords(DEFAULT_STAFF_MEETINGS_23);
      await db.set(storageKey, DEFAULT_STAFF_MEETINGS_23);
      showNotification('Staff meeting records reset to defaults.');
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
          id: `att-sm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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

    if (!formState.monthAndDate?.trim() || !formState.importantPoints?.trim()) {
      alert('Please fill in Month & Date and Important/Relevant Points.');
      return;
    }

    const slNoVal = Number(formState.slNo) || getNextSlNo(formState.pageNumber || selectedPage);

    const recordToSave: StaffMeetingRecord23 = {
      id: editingRecord ? editingRecord.id : `sm-${Date.now()}`,
      slNo: slNoVal,
      monthAndDate: formState.monthAndDate.trim(),
      date: formState.date || new Date().toISOString().slice(0, 10),
      meetingTitle: formState.meetingTitle?.trim(),
      importantPoints: formState.importantPoints.trim(),
      actionTakenFollowUp: formState.actionTakenFollowUp?.trim() || '',
      pageNumber: formState.pageNumber || selectedPage,
      attachments: formState.attachments || [],
      remarks: formState.remarks,
      templatePageRef: isFoundational ? 17 : 42
    };

    let updatedList: StaffMeetingRecord23[] = [];
    if (editingRecord) {
      updatedList = records.map(r => r.id === editingRecord.id ? recordToSave : r);
    } else {
      updatedList = [...records, recordToSave];
    }

    setRecords(updatedList);
    await db.set(storageKey, updatedList);
    setIsModalOpen(false);
    showNotification('Staff meeting minutes and evidence saved successfully.');
  };

  // Filtered List
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchPage = selectedPage === 0 || rec.pageNumber === selectedPage;
      const matchSearch = searchTerm === '' ||
        rec.monthAndDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.importantPoints.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.actionTakenFollowUp.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.meetingTitle && rec.meetingTitle.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchPage && matchSearch;
    });
  }, [records, selectedPage, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Dev Mode Traceability Badge */}
      {devMode && (
        <DevModeBadge
          pages={isFoundational ? 17 : 42}
          title={`${moduleNumber}. मासिक स्टाफ मीटिंग का कार्यवृत्त सार (GIST OF MINUTES OF THE STAFF MEETINGS - ${pageRange})`}
        />
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1.5">
              <Users className="w-4 h-4" />
              <span>KVS Teacher Diary • {isFoundational ? 'Foundational Portal (P-17 to 21)' : 'Middle & Secondary Portal (P-42 to 46)'}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {moduleNumber}. मासिक स्टाफ मीटिंग का कार्यवृत्त सार
            </h1>
            <h2 className="text-sm font-bold text-slate-300 tracking-wide mt-0.5 uppercase">
              GIST OF MINUTES OF THE STAFF MEETINGS
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Monthly staff deliberations, principal instructions, institutional policy decisions, examination rosters, and follow-up actions with multi-file evidence (Signed minutes photos, audio addresses, PDF circulars).
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
              <span>Add Staff Meeting</span>
            </button>
          </div>
        </div>

        {/* Action Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Document critical staff meeting points and track subsequent execution and pedagogical follow-up.</span>
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

      {/* PAGE SELECTOR & SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by month, key discussions, or action taken..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* OFFICIAL 3-COLUMN REGISTER TABLE (MATCHING IMAGE 2) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Exact Headers matching official register */}
              <tr className="bg-slate-950 border-b-2 border-slate-800 text-slate-200 font-extrabold text-center">
                <th className="p-3 border-r border-slate-800 w-[180px] text-left">
                  Month &amp; Date
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[360px] text-left">
                  Important/Relevant Points
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[320px] text-left">
                  Action taken/ Follow up
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
                        No staff meeting records found for Page {selectedPage}.
                      </span>
                      <button
                        onClick={handleOpenCreateModal}
                        className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-bold underline"
                      >
                        Add staff meeting minutes
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-800/50 transition">
                    {/* Column 1: Month & Date */}
                    <td className="p-3.5 border-r border-slate-800 font-bold text-slate-100 align-top">
                      <div className="flex items-start gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs text-purple-300 font-bold">{row.monthAndDate}</div>
                          {row.meetingTitle && (
                            <div className="text-[11px] text-slate-400 font-normal mt-1 leading-snug">
                              {row.meetingTitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Important/Relevant Points + Evidence Attachments */}
                    <td className="p-3.5 border-r border-slate-800 text-slate-200 leading-relaxed align-top">
                      <p className="text-xs font-medium whitespace-pre-line leading-relaxed">{row.importantPoints}</p>

                      {/* Attached Evidence Badges */}
                      {row.attachments && row.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
                          {row.attachments.map(att => (
                            <button
                              key={att.id}
                              type="button"
                              onClick={() => setPreviewAttachment({ item: att, contextTitle: `Staff Meeting Evidence: ${row.monthAndDate}` })}
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

                    {/* Column 3: Action taken/ Follow up */}
                    <td className="p-3.5 border-r border-slate-800 text-slate-300 align-top">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                          {row.actionTakenFollowUp || 'Under implementation / pending review.'}
                        </p>
                      </div>
                    </td>

                    {/* Column 4: Actions */}
                    <td className="p-3 text-center align-top">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                          title="Edit minutes entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete minutes entry"
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

      {/* ADD / EDIT MODAL FOR STAFF MEETING */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {editingRecord ? 'Edit Staff Meeting Minutes' : `Add ${moduleNumber}. Gist of Staff Meeting`}
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
                    Month &amp; Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. July 2025 (05/07/2025)"
                    value={formState.monthAndDate}
                    onChange={(e) => setFormState({ ...formState, monthAndDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Meeting Subject / Agenda Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Academic Planning & Split-up Syllabus"
                    value={formState.meetingTitle || ''}
                    onChange={(e) => setFormState({ ...formState, meetingTitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Important / Relevant Points */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Important / Relevant Points <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Record summary of principal briefing, pedagogical decisions, examination dates, discipline responsibilities..."
                  value={formState.importantPoints}
                  onChange={(e) => setFormState({ ...formState, importantPoints: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-purple-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* Action taken / Follow up */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Action taken / Follow up
                </label>
                <textarea
                  rows={3}
                  placeholder="Document specific follow-up actions taken, submissions completed, circular compliance..."
                  value={formState.actionTakenFollowUp}
                  onChange={(e) => setFormState({ ...formState, actionTakenFollowUp: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-purple-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* MULTIMEDIA EVIDENCE UPLOAD */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attach Meeting Evidence (Signed Minutes, Audio Briefing, PDF Circular)</span>
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
                  <span>Save Minutes</span>
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
                  <span className="text-xs text-slate-400">Attached meeting record document ({previewAttachment.item.fileSize}).</span>
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

export default StaffMeetingManager;
