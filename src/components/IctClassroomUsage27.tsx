import React, { useState, useEffect, useRef } from 'react';
import {
  Laptop,
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
  Layers,
  Search,
  Filter,
  Monitor,
  Check
} from 'lucide-react';
import { IctClassroomUsage27Record, RemedialAttachmentItem, ClassSection, SubjectItem, DailyLessonPlan } from '../types/academic';
import { db, DEFAULT_ICT_USAGE_27 } from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';

interface IctClassroomUsage27Props {
  devMode?: boolean;
}

const ICT_TOOL_PRESETS = [
  { name: 'DIKSHA QR e-Content', desc: 'DIKSHA 3D Interactive module with QR-code animated explanation & practice quiz.' },
  { name: 'PhET Interactive Sim', desc: 'PhET Virtual Laboratory simulation (Colorado Univ) for dynamic parameter exploration.' },
  { name: 'GeoGebra 3D Grapher', desc: 'GeoGebra Dynamic Geometry & Algebraic curve plotting for real-time visualization.' },
  { name: 'PM eVidya & Swayam Prabha', desc: 'PM eVidya broadcast telecast video lesson with conceptual pause-and-reflect checkpoints.' },
  { name: 'Interactive Flat Panel (IFP)', desc: 'IFP Smart Touchboard ray diagrams, digital whiteboarding, and multi-touch student annotations.' },
  { name: 'NCERT e-Pathshala', desc: 'NCERT e-Pathshala flipbook interactive audio-visual illustrations & audio stories.' },
  { name: 'Kahoot / Mentimeter Quiz', desc: 'Gamified real-time formative assessment quiz with instant student feedback.' },
  { name: 'Google Earth 3D Flythrough', desc: 'Satellite topography, Himalayan terrain flythrough, and GIS river basin analysis.' }
];

export const IctClassroomUsage27: React.FC<IctClassroomUsage27Props> = ({ devMode }) => {
  const [records, setRecords] = useState<IctClassroomUsage27Record[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [lessonPlans, setLessonPlans] = useState<DailyLessonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Page selector: 1 or 2
  const [activePage, setActivePage] = useState<number>(1);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IctClassroomUsage27Record | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Media Preview Viewer Modal
  const [previewAttachment, setPreviewAttachment] = useState<{
    item: RemedialAttachmentItem;
    contextTitle: string;
  } | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<IctClassroomUsage27Record>>({
    date: new Date().toLocaleDateString('en-GB'),
    className: 'Class X',
    section: 'A',
    period: 'Period 1',
    subject: 'Mathematics (041)',
    topicAndEContentDescription: '',
    principalSign: 'Verified & Signed',
    isSigned: true,
    pageNumber: 1,
    attachments: [],
    remarks: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [savedIct, savedClasses, savedSubjects, savedPlans] = await Promise.all([
      db.get<IctClassroomUsage27Record[]>('setup:ict_classroom_usage_27'),
      db.get<ClassSection[]>('setup:classes'),
      db.get<SubjectItem[]>('setup:subjects'),
      db.get<DailyLessonPlan[]>('setup:lesson_plans')
    ]);

    if (savedIct && savedIct.length > 0) {
      setRecords(savedIct);
    } else {
      setRecords(DEFAULT_ICT_USAGE_27);
      await db.set('setup:ict_classroom_usage_27', DEFAULT_ICT_USAGE_27);
    }

    if (savedClasses) setClasses(savedClasses);
    if (savedSubjects) setSubjects(savedSubjects);
    if (savedPlans) setLessonPlans(savedPlans);

    setLoading(false);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    setFormState({
      date: new Date().toLocaleDateString('en-GB'),
      className: classes.length > 0 ? `Class ${classes[0].className}` : 'Class X',
      section: classes.length > 0 && classes[0].section ? classes[0].section : 'A',
      period: 'Period 2',
      subject: subjects.length > 0 ? subjects[0].subjectName : 'Mathematics (041)',
      topicAndEContentDescription: '',
      principalSign: 'Verified & Signed',
      isSigned: true,
      pageNumber: activePage,
      attachments: [],
      remarks: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: IctClassroomUsage27Record) => {
    setEditingRecord(rec);
    setFormState({
      ...rec,
      attachments: rec.attachments || []
    });
    setIsModalOpen(true);
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Delete this ICT classroom transaction record?')) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      await db.set('setup:ict_classroom_usage_27', updated);
      showNotification('ICT classroom record deleted.');
    }
  };

  // Reset Defaults
  const handleResetDefaults = async () => {
    if (window.confirm('Reset 27. ICT/Digital Technology Classroom Records to official KVS defaults?')) {
      setRecords(DEFAULT_ICT_USAGE_27);
      await db.set('setup:ict_classroom_usage_27', DEFAULT_ICT_USAGE_27);
      showNotification('27. ICT records reset to official defaults.');
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
          id: `att-ict-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
    showNotification('Evidence attached.');
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

    if (!formState.topicAndEContentDescription?.trim()) {
      alert('Please provide Topic & Description of e-content.');
      return;
    }

    const nextSlNo = editingRecord?.slNo ||
      (records.filter(r => r.pageNumber === (formState.pageNumber || activePage)).length + 1);

    const recordToSave: IctClassroomUsage27Record = {
      id: editingRecord ? editingRecord.id : `ict-27-${Date.now()}`,
      slNo: nextSlNo,
      date: formState.date || new Date().toLocaleDateString('en-GB'),
      className: formState.className || 'Class X',
      section: formState.section || 'A',
      period: formState.period || 'Period 1',
      subject: formState.subject || 'General',
      topicAndEContentDescription: formState.topicAndEContentDescription.trim(),
      principalSign: formState.principalSign || 'Verified & Signed',
      isSigned: formState.isSigned !== undefined ? formState.isSigned : true,
      pageNumber: formState.pageNumber || activePage,
      attachments: formState.attachments || [],
      remarks: formState.remarks,
      templatePageRef: 27
    };

    let updatedList: IctClassroomUsage27Record[] = [];
    if (editingRecord) {
      updatedList = records.map(r => r.id === editingRecord.id ? recordToSave : r);
    } else {
      updatedList = [...records, recordToSave];
    }

    setRecords(updatedList);
    await db.set('setup:ict_classroom_usage_27', updatedList);
    setIsModalOpen(false);
    showNotification('27. ICT transaction entry saved.');
  };

  // Filtered list
  const pageRecords = records.filter(r => (r.pageNumber || 1) === activePage);
  const filteredRecords = pageRecords.filter(r => {
    const matchClass = selectedClassFilter === 'All' ||
      r.className.toLowerCase().includes(selectedClassFilter.toLowerCase());
    const matchSearch = searchTerm === '' ||
      r.topicAndEContentDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.date.toLowerCase().includes(searchTerm.toLowerCase());
    return matchClass && matchSearch;
  });

  if (loading) {
    return <div className="p-8 text-center text-purple-300">Loading ICT Classroom Transactions...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Dev Mode Traceability Badge */}
      {devMode && (
        <DevModeBadge
          pages={[50, 51]}
          title="27. कक्षा गतिविधियों में प्रयुक्त आईसीटी/डिजिटल प्रौद्योगिकी का विवरण (DETAILS OF ICT/DIGITAL TECHNOLOGY USED DURING CLASSROOM TRANSACTION)"
        />
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1.5">
              <Laptop className="w-4 h-4" />
              <span>KVS Teacher Diary • Digital Pedagogies & NEP 2020</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              27. कक्षा गतिविधियों में प्रयुक्त आईसीटी/डिजिटल प्रौद्योगिकी का विवरण
            </h1>
            <h2 className="text-sm font-bold text-slate-300 tracking-wide mt-0.5 uppercase">
              DETAILS OF ICT/DIGITAL TECHNOLOGY USED DURING CLASSROOM TRANSACTION
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Official 6-column register logging date-wise, class-wise, and period-wise digital content transactions (DIKSHA, PhET Simulations, GeoGebra, PM eVidya, IFP Interactive Flat Panels) with multimedia evidence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Page 1 / Page 2 Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-700 flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => setActivePage(1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activePage === 1
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Page 1 ({records.filter(r => (r.pageNumber || 1) === 1).length})
              </button>
              <button
                type="button"
                onClick={() => setActivePage(2)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activePage === 2
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Page 2 ({records.filter(r => r.pageNumber === 2).length})
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shadow transition"
              title="Print official register page"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print Page</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-900/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log ICT Usage</span>
            </button>
          </div>
        </div>

        {/* Action Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Monitor className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Document interactive smartboard lessons, simulations, DIKSHA modules, and attach screenshots or student audio-viva clips.</span>
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
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-lg backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-cyan-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-300">Filter Class:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-slate-900 border border-cyan-500/40 rounded-lg px-3 py-1.5 text-xs font-bold text-cyan-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="All">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={`Class ${c.className}`}>Class {c.className} {c.section ? `(${c.section})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search topic, e-content, period, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full md:w-72"
            />
          </div>
        </div>

        {/* OFFICIAL 6-COLUMN REGISTER TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-inner">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-3 w-12 text-center border-r border-slate-800 text-cyan-300">
                  Date
                </th>
                <th className="py-3 px-4 w-32 border-r border-slate-800 text-cyan-300">
                  Class & Section
                </th>
                <th className="py-3 px-3 w-24 border-r border-slate-800 text-cyan-300">
                  Period
                </th>
                <th className="py-3 px-4 w-36 border-r border-slate-800 text-cyan-300">
                  Sub
                </th>
                <th className="py-3 px-6 border-r border-slate-800 text-cyan-300">
                  Topic & Description of e-content
                </th>
                <th className="py-3 px-4 w-44 border-r border-slate-800 text-cyan-300">
                  Principal&apos;s Sign
                </th>
                <th className="py-3 px-3 w-20 text-center text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No ICT transactions logged on Page {activePage}. Click &quot;Log ICT Usage&quot; to record smart classroom activities.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition">
                    {/* Column 1: Date */}
                    <td className="py-3.5 px-3 font-mono font-bold text-white text-center align-top border-r border-slate-800 whitespace-nowrap">
                      {row.date}
                    </td>

                    {/* Column 2: Class & Section */}
                    <td className="py-3.5 px-4 font-bold text-cyan-200 align-top border-r border-slate-800">
                      <div>{row.className}</div>
                      {row.section && <div className="text-[10px] text-slate-400 font-normal">Section {row.section}</div>}
                    </td>

                    {/* Column 3: Period */}
                    <td className="py-3.5 px-3 font-medium text-amber-300 align-top border-r border-slate-800 whitespace-nowrap">
                      {row.period}
                    </td>

                    {/* Column 4: Sub */}
                    <td className="py-3.5 px-4 font-semibold text-slate-200 align-top border-r border-slate-800">
                      {row.subject}
                    </td>

                    {/* Column 5: Topic & Description of e-content */}
                    <td className="py-3.5 px-6 align-top border-r border-slate-800 leading-relaxed">
                      <p className="text-xs text-slate-200 font-medium whitespace-pre-line">
                        {row.topicAndEContentDescription}
                      </p>

                      {/* Evidence Files Attachment Badges */}
                      {row.attachments && row.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
                          {row.attachments.map(att => (
                            <button
                              key={att.id}
                              type="button"
                              onClick={() => setPreviewAttachment({ item: att, contextTitle: `${row.className} (${row.subject}) - ${att.title}` })}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 transition cursor-pointer"
                              title="Click to view/play attached media"
                            >
                              {att.type === 'photo' && <Image className="w-3 h-3 text-cyan-400" />}
                              {att.type === 'audio' && <Volume2 className="w-3 h-3 text-amber-400" />}
                              {att.type === 'video' && <Video className="w-3 h-3 text-rose-400" />}
                              {att.type === 'pdf' && <FileText className="w-3 h-3 text-indigo-400" />}
                              <span className="truncate max-w-[140px]">{att.fileName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Column 6: Principal's Sign */}
                    <td className="py-3.5 px-4 align-top border-r border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        <span className="font-bold text-xs text-emerald-300">
                          {row.principalSign || 'Verified & Signed'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 align-top text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition"
                          title="Edit entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete entry"
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
                <Laptop className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  {editingRecord ? 'Edit 27. ICT/Digital Technology Entry' : 'Log 27. ICT/Digital Technology Usage'}
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
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quick e-Content Tool Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ICT_TOOL_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormState(prev => ({
                        ...prev,
                        topicAndEContentDescription: prev.topicAndEContentDescription
                          ? `${prev.topicAndEContentDescription} • ${preset.desc}`
                          : preset.desc
                      }))}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-200 border border-slate-700 rounded-lg text-[10px] transition cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 14/08/2025"
                    value={formState.date}
                    onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Class & Section <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={formState.className}
                      onChange={(e) => setFormState({ ...formState, className: e.target.value })}
                      className="w-2/3 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                      required
                    >
                      {classes.map(c => (
                        <option key={c.id} value={`Class ${c.className}`}>Class {c.className}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Sec (A)"
                      value={formState.section || ''}
                      onChange={(e) => setFormState({ ...formState, section: e.target.value })}
                      className="w-1/3 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Period
                  </label>
                  <select
                    value={formState.period}
                    onChange={(e) => setFormState({ ...formState, period: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                      <option key={p} value={`Period ${p}`}>Period {p}</option>
                    ))}
                    <option value="Zero Period">Zero Period</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Subject <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formState.subject}
                    onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                    required
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.subjectCode ? `${s.subjectName} (${s.subjectCode})` : s.subjectName}>
                        {s.subjectName} {s.subjectCode ? `(${s.subjectCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Page Register
                  </label>
                  <select
                    value={formState.pageNumber || 1}
                    onChange={(e) => setFormState({ ...formState, pageNumber: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value={1}>Page 1 (First Half)</option>
                    <option value={2}>Page 2 (Second Half)</option>
                  </select>
                </div>
              </div>

              {/* Topic & Description */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Topic & Description of e-content <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Quadratic Equations - Demonstrated roots and parabolic curve derivation using GeoGebra Dynamic Grapher and DIKSHA 3D interactive video module..."
                  value={formState.topicAndEContentDescription}
                  onChange={(e) => setFormState({ ...formState, topicAndEContentDescription: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* Principal's Sign */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Principal&apos;s Sign
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified & Signed"
                  value={formState.principalSign}
                  onChange={(e) => setFormState({ ...formState, principalSign: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* MULTIMEDIA EVIDENCE UPLOAD */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Attach Multimedia Evidence (Smartboard Photo, Screen Video, Audio Viva, PDF)</span>
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
                    <Paperclip className="w-3 h-3 text-cyan-400" />
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
                        {att.type === 'photo' && <Image className="w-3.5 h-3.5 text-cyan-400" />}
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
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-900/40 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Entry</span>
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
                <Paperclip className="w-4 h-4 text-cyan-400" />
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
                  <Image className="w-16 h-16 text-cyan-400/60" />
                  <span className="text-sm font-bold text-slate-200">{previewAttachment.item.fileName}</span>
                  <span className="text-xs text-slate-400">Attached smart classroom screenshot / photo ({previewAttachment.item.fileSize}).</span>
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
                  <span className="text-xs text-slate-400">Attached e-content document ({previewAttachment.item.fileSize}).</span>
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

export default IctClassroomUsage27;

