import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Printer,
  RotateCcw,
  Paperclip,
  Image,
  Volume2,
  Video,
  FileText,
  CheckCircle2,
  Sparkles,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { WorkDoneOtherThanTeaching26Record, RemedialAttachmentItem } from '../types/academic';
import { db, DEFAULT_WORK_DONE_26 } from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';

interface WorkDoneOtherThanTeaching26Props {
  devMode?: boolean;
}

const MONTHS_ORDER = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March'
];

const NON_TEACHING_PRESETS = [
  {
    title: 'Vidyalaya Admission Verification Committee',
    duty: 'Coordinated student online registration, document verification, category verification (RTE/KVS Ward/Single Girl Child), and prepared merit admission lists.'
  },
  {
    title: 'Master Time Table Committee In-Charge',
    duty: 'Drafted and balanced teacher period distribution, class-wise room allocation, zero-period remedial slots, and special activity schedules.'
  },
  {
    title: 'CBSE Examination Centre Superintendent / Observer',
    duty: 'Managed confidential question paper custody, seating plan arrangement, invigilator deployment, and error-free OMR answer booklet dispatch.'
  },
  {
    title: 'House Master (Inter-House Activities & Assembly)',
    duty: 'Mentored house student council, organized morning assembly presentations, uniform/discipline checks, and coordinated Inter-House sports and cultural contests.'
  },
  {
    title: 'Jawaharlal Nehru Science Exhibition / STEM In-Charge',
    duty: 'Guided student science working models, coordinated Vidyalaya Level Science Exhibition, and accompanied winning exhibits to KVS Regional Level.'
  },
  {
    title: 'CCA & Cultural Event Coordinator (Independence / Republic Day)',
    duty: 'Coordinated flag unfurling drill, parade march past practice, patriotic song choir rehearsal, and prize distribution protocol.'
  },
  {
    title: 'Annual Stock & Lab Audit Committee',
    duty: 'Conducted comprehensive physical stock count, consumable chemical/glassware audit, working condition testing, and updated laboratory accession register.'
  },
  {
    title: 'Pariksha Pe Charcha & Career Guidance Coordinator',
    duty: 'Arranged auditorium live broadcast, 100% student/parent registration on MyGov portal, and conducted post-telecast stress-management counseling.'
  }
];

export const WorkDoneOtherThanTeaching26: React.FC<WorkDoneOtherThanTeaching26Props> = ({ devMode }) => {
  const [records, setRecords] = useState<WorkDoneOtherThanTeaching26Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WorkDoneOtherThanTeaching26Record | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Media Preview Viewer Modal
  const [previewAttachment, setPreviewAttachment] = useState<{
    item: RemedialAttachmentItem;
    contextTitle: string;
  } | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<WorkDoneOtherThanTeaching26Record>>({
    month: 'April',
    details: '',
    principalSignature: 'Verified & Signed (Principal)',
    principalSignatureDate: new Date().toISOString().slice(0, 10),
    isSigned: true,
    academicYear: '2025-26',
    attachments: [],
    remarks: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const saved = await db.get<WorkDoneOtherThanTeaching26Record[]>('setup:work_done_other_than_teaching_26');
    if (saved && saved.length > 0) {
      setRecords(saved);
    } else {
      setRecords(DEFAULT_WORK_DONE_26);
      await db.set('setup:work_done_other_than_teaching_26', DEFAULT_WORK_DONE_26);
    }
    setLoading(false);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Open Create Modal
  const handleOpenCreateModal = (month?: string) => {
    setEditingRecord(null);
    setFormState({
      month: month || (selectedMonthFilter !== 'All' ? selectedMonthFilter : 'April'),
      details: '',
      principalSignature: 'Verified & Signed (Principal)',
      principalSignatureDate: new Date().toISOString().slice(0, 10),
      isSigned: true,
      academicYear: '2025-26',
      attachments: [],
      remarks: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: WorkDoneOtherThanTeaching26Record) => {
    setEditingRecord(rec);
    setFormState({
      ...rec,
      attachments: rec.attachments || []
    });
    setIsModalOpen(true);
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this duty record?')) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      await db.set('setup:work_done_other_than_teaching_26', updated);
      showNotification('Duty record deleted.');
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (window.confirm('Reset 26. Details of work done other than Teaching to official KVS defaults?')) {
      setRecords(DEFAULT_WORK_DONE_26);
      await db.set('setup:work_done_other_than_teaching_26', DEFAULT_WORK_DONE_26);
      showNotification('26. Work Done records reset to official defaults.');
    }
  };

  // File Upload Handler (Photo, Audio, Video, PDF)
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
          id: `att-wdot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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

    if (fileInputRef.current) fileInputRef.current.value = '';
    showNotification('Evidence file attached.');
  };

  const handleRemoveAttachment = (attId: string) => {
    setFormState(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== attId)
    }));
  };

  // Save Record
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.month?.trim() || !formState.details?.trim()) {
      alert('Please provide both the Month and Details of work done.');
      return;
    }

    const recordToSave: WorkDoneOtherThanTeaching26Record = {
      id: editingRecord ? editingRecord.id : `wdot-26-${Date.now()}`,
      month: formState.month.trim(),
      details: formState.details.trim(),
      principalSignature: formState.principalSignature || 'Verified & Signed (Principal)',
      principalSignatureDate: formState.principalSignatureDate || new Date().toISOString().slice(0, 10),
      isSigned: formState.isSigned !== undefined ? formState.isSigned : true,
      academicYear: formState.academicYear || '2025-26',
      attachments: formState.attachments || [],
      remarks: formState.remarks,
      templatePageRef: 52
    };

    let updatedList: WorkDoneOtherThanTeaching26Record[] = [];
    if (editingRecord) {
      updatedList = records.map(r => r.id === editingRecord.id ? recordToSave : r);
    } else {
      updatedList = [...records, recordToSave];
    }

    setRecords(updatedList);
    await db.set('setup:work_done_other_than_teaching_26', updatedList);
    setIsModalOpen(false);
    showNotification('26. Work Done record and evidence saved.');
  };

  // Filtered list
  const filteredRecords = records.filter(r => {
    const matchMonth = selectedMonthFilter === 'All' || r.month === selectedMonthFilter;
    const matchSearch = searchTerm === '' ||
      r.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.remarks && r.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchMonth && matchSearch;
  });

  // Sort by academic month order (April to March)
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const idxA = MONTHS_ORDER.indexOf(a.month);
    const idxB = MONTHS_ORDER.indexOf(b.month);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  if (loading) {
    return <div className="p-8 text-center text-purple-300">Loading Non-Teaching Work Records...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Dev Mode Traceability Badge */}
      {devMode && (
        <DevModeBadge
          pages={52}
          title="26. अध्यापन के अलावा किए गए कार्यों का विवरण (DETAILS OF WORK DONE OTHER THAN TEACHING - Page 52)"
        />
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1.5">
              <Briefcase className="w-4 h-4" />
              <span>KVS Teacher Diary • Institutional Portfolios</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              26. अध्यापन के अलावा किए गए कार्यों का विवरण
            </h1>
            <h2 className="text-sm font-bold text-slate-300 tracking-wide mt-0.5 uppercase">
              DETAILS OF WORK DONE OTHER THAN TEACHING
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Official 3-column institutional register tracking monthly non-teaching duties, committees, board examination operations, CCA coordination, and verified principal signatures with multimedia evidence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shadow transition"
              title="Print official register"
            >
              <Printer className="w-4 h-4 text-purple-400" />
              <span>Print Page 52</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Non-Teaching Work</span>
            </button>
          </div>
        </div>

        {/* Action Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Document admission committees, examination in-charge duties, CCA events, and attach signed deputation letters or photos for audit compliance.</span>
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
        <div className="bg-purple-950/90 border border-purple-500/50 text-purple-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-lg backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-purple-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-300">Filter Month:</span>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="bg-slate-900 border border-purple-500/40 rounded-lg px-3 py-1.5 text-xs font-bold text-purple-200 focus:outline-none focus:border-purple-400"
            >
              <option value="All">All Months (Academic Year)</option>
              {MONTHS_ORDER.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search duty details, committees, keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-full md:w-72"
            />
          </div>
        </div>

        {/* OFFICIAL 3-COLUMN REGISTER TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-inner">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-4 w-40 border-r border-slate-800 text-purple-300">
                  Months
                </th>
                <th className="py-3 px-6 border-r border-slate-800 text-purple-300">
                  Details
                </th>
                <th className="py-3 px-5 w-60 border-r border-slate-800 text-purple-300">
                  Signature of Principal / V P
                </th>
                <th className="py-3 px-3 w-20 text-center text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
              {sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                    No work done records found. Click &quot;Add Non-Teaching Work&quot; to log your monthly responsibilities.
                  </td>
                </tr>
              ) : (
                sortedRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition">
                    {/* Column 1: Months */}
                    <td className="py-3.5 px-4 font-bold text-white align-top border-r border-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="text-sm font-black text-purple-200">{row.month}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        Session {row.academicYear || '2025-26'}
                      </div>
                    </td>

                    {/* Column 2: Details */}
                    <td className="py-3.5 px-6 align-top border-r border-slate-800 leading-relaxed">
                      <p className="text-xs text-slate-200 whitespace-pre-line font-medium">
                        {row.details}
                      </p>

                      {/* Evidence Files Attachment Badges */}
                      {row.attachments && row.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
                          {row.attachments.map(att => (
                            <button
                              key={att.id}
                              type="button"
                              onClick={() => setPreviewAttachment({ item: att, contextTitle: `${row.month} - ${att.title}` })}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/40 transition cursor-pointer"
                              title="Click to view/play attached evidence"
                            >
                              {att.type === 'photo' && <Image className="w-3 h-3 text-emerald-400" />}
                              {att.type === 'audio' && <Volume2 className="w-3 h-3 text-amber-400" />}
                              {att.type === 'video' && <Video className="w-3 h-3 text-rose-400" />}
                              {att.type === 'pdf' && <FileText className="w-3 h-3 text-indigo-400" />}
                              <span className="truncate max-w-[140px]">{att.fileName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Column 3: Signature of Principal / V P */}
                    <td className="py-3.5 px-5 align-top border-r border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        <span className="font-bold text-xs text-emerald-300">
                          {row.principalSignature || 'Verified & Signed'}
                        </span>
                      </div>
                      {row.principalSignatureDate && (
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          Date: {row.principalSignatureDate}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 align-top text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                          title="Edit record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete record"
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

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {editingRecord ? 'Edit Work Done Other than Teaching' : 'Add 26. Work Done Other Than Teaching'}
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
              {/* Presets Quick Fill */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quick Duty Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {NON_TEACHING_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormState(prev => ({ ...prev, details: preset.duty }))}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-purple-950 text-slate-300 hover:text-purple-200 border border-slate-700 rounded-lg text-[10px] transition cursor-pointer"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Month <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formState.month}
                    onChange={(e) => setFormState({ ...formState, month: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  >
                    {MONTHS_ORDER.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={formState.academicYear || '2025-26'}
                    onChange={(e) => setFormState({ ...formState, academicYear: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Details of Work Done Other than Teaching <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed description of non-teaching assignments, exam invigilation, admission verification, CCA activities, or administrative duties..."
                  value={formState.details}
                  onChange={(e) => setFormState({ ...formState, details: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-purple-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* Signature of Principal / V P */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Signature of Principal / V P
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Verified & Signed (Principal)"
                    value={formState.principalSignature}
                    onChange={(e) => setFormState({ ...formState, principalSignature: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Verification Date
                  </label>
                  <input
                    type="date"
                    value={formState.principalSignatureDate}
                    onChange={(e) => setFormState({ ...formState, principalSignatureDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* MULTIMEDIA EVIDENCE UPLOAD */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attach Evidence (Deputation Letter, Duty Slip, Event Photo, PDF Order)</span>
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
                        className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg text-xs"
                      >
                        {att.type === 'photo' && <Image className="w-3.5 h-3.5 text-emerald-400" />}
                        {att.type === 'audio' && <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                        {att.type === 'video' && <Video className="w-3.5 h-3.5 text-rose-400" />}
                        {att.type === 'pdf' && <FileText className="w-3.5 h-3.5 text-indigo-400" />}
                        <span className="text-slate-200 text-[11px] truncate max-w-[130px]">{att.fileName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-slate-400 hover:text-rose-400 ml-1"
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
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEDIA PREVIEW VIEWER MODAL */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {previewAttachment.contextTitle}
                </h3>
              </div>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center min-h-[220px] bg-slate-950 rounded-xl p-4 border border-slate-800">
              {previewAttachment.item.type === 'photo' && previewAttachment.item.dataUrl ? (
                <img
                  src={previewAttachment.item.dataUrl}
                  alt={previewAttachment.item.title}
                  className="max-h-[380px] max-w-full rounded-xl object-contain border border-slate-800 shadow"
                />
              ) : previewAttachment.item.type === 'photo' ? (
                <div className="flex flex-col items-center gap-2 text-center p-8">
                  <Image className="w-16 h-16 text-emerald-400/60" />
                  <span className="text-sm font-bold text-slate-200">{previewAttachment.item.fileName}</span>
                  <span className="text-xs text-slate-400">Attached non-teaching duty photo document ({previewAttachment.item.fileSize}).</span>
                </div>
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
                  <span className="text-xs text-slate-400">Attached duty circular / order document ({previewAttachment.item.fileSize}).</span>
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

export default WorkDoneOtherThanTeaching26;

