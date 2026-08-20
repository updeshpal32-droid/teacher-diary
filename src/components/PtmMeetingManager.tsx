import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PtmMeetingRecord22, RemedialAttachmentItem, StudentProfile } from '../types/academic';
import { db, DEFAULT_PTM_MEETINGS_22, DEFAULT_STUDENTS } from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  HeartHandshake,
  Plus,
  Edit2,
  Trash2,
  Printer,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
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
  Phone,
  ShieldCheck,
  Volume2
} from 'lucide-react';

interface PtmMeetingManagerProps {
  devMode?: boolean;
  diaryMode?: 'middle-secondary' | 'foundational-preparatory';
}

const CLASS_OPTIONS = [
  'Class VI-A',
  'Class VI-B',
  'Class VII-A',
  'Class VII-B',
  'Class VIII-A',
  'Class VIII-B',
  'Class IX-A',
  'Class IX-B',
  'Class X-A',
  'Class X-B',
  'Class XI-A',
  'Class XI-B',
  'Class XII-A',
  'Class XII-B'
];

export const PtmMeetingManager: React.FC<PtmMeetingManagerProps> = ({
  devMode,
  diaryMode = 'middle-secondary'
}) => {
  const isFoundational = diaryMode === 'foundational-preparatory';
  const moduleNumber = isFoundational ? '19' : '22';
  const pageRange = isFoundational ? 'P-27 to 30' : 'P-38 to 41';
  const storageKey = isFoundational ? 'setup:ptm_meetings_foundational' : 'setup:ptm_meetings_22';

  const [records, setRecords] = useState<PtmMeetingRecord22[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('Class X');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importClassFilter, setImportClassFilter] = useState<string>('All');
  const [selectedStudentIdsForImport, setSelectedStudentIdsForImport] = useState<string[]>([]);
  const [importSuggestions, setImportSuggestions] = useState<string>('Discussed quarterly academic performance, periodic assessment marks, and daily homework regularity. Parent assured closer home supervision.');
  const [editingRecord, setEditingRecord] = useState<PtmMeetingRecord22 | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Media Preview Viewer Modal
  const [previewAttachment, setPreviewAttachment] = useState<{
    item: RemedialAttachmentItem;
    contextTitle: string;
  } | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<PtmMeetingRecord22>>({
    slNo: 1,
    date: new Date().toLocaleDateString('en-GB'),
    studentId: '',
    studentNameAndClass: '',
    suggestions: '',
    parentSignatureWithMobile: 'Signed',
    parentMobileNo: '',
    isSigned: true,
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
    const saved = await db.get<PtmMeetingRecord22[]>(storageKey);
    if (saved && saved.length > 0) {
      setRecords(saved);
    } else {
      setRecords(DEFAULT_PTM_MEETINGS_22);
      await db.set(storageKey, DEFAULT_PTM_MEETINGS_22);
    }

    const stdList = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    setStudents(stdList);
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

  // Auto-fill Student from Roster
  const handleStudentSelect = (studentId: string) => {
    const selected = students.find(s => s.id === studentId);
    if (selected) {
      const parentName = selected.fatherName || selected.motherName || 'Parent';
      setFormState(prev => ({
        ...prev,
        studentId: selected.id,
        studentNameAndClass: `${selected.studentName} (Class ${selected.className}-${selected.section || 'A'})`,
        parentSignatureWithMobile: `Signed (${parentName})`,
        parentMobileNo: selected.contactNumber || ''
      }));
    }
  };

  // Bulk Import Students from Roster
  const handleBulkImportStudents = async () => {
    if (selectedStudentIdsForImport.length === 0) {
      alert('Please select at least one student from the roster to import.');
      return;
    }

    const studentsToImport = students.filter(s => selectedStudentIdsForImport.includes(s.id));
    const currentDate = new Date().toLocaleDateString('en-GB');
    const targetPage = selectedPage === 0 ? 1 : selectedPage;

    const newRecords: PtmMeetingRecord22[] = studentsToImport.map((std, idx) => {
      const parentName = std.fatherName || std.motherName || 'Parent';
      return {
        id: `ptm-import-${Date.now()}-${idx}`,
        slNo: records.filter(r => r.pageNumber === targetPage).length + idx + 1,
        date: currentDate,
        studentId: std.id,
        studentNameAndClass: `${std.studentName} (Class ${std.className}-${std.section || 'A'})`,
        suggestions: importSuggestions,
        parentSignatureWithMobile: `Signed (${parentName} - ${std.contactNumber || 'Contact on file'})`,
        parentMobileNo: std.contactNumber || '',
        parentName: parentName,
        isSigned: true,
        pageNumber: targetPage,
        attachments: [],
        remarks: 'Imported from student roster for PTM consultation ledger.',
        templatePageRef: isFoundational ? 27 : 38
      };
    });

    const updated = [...records, ...newRecords];
    setRecords(updated);
    await db.set(storageKey, updated);
    setIsImportModalOpen(false);
    setSelectedStudentIdsForImport([]);
    showNotification(`Successfully imported ${newRecords.length} students into PTM Meeting Records.`);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    const nextSlNo = getNextSlNo(selectedPage);
    setFormState({
      slNo: nextSlNo,
      date: new Date().toLocaleDateString('en-GB'),
      studentId: '',
      studentNameAndClass: `${selectedClass}-${selectedSection}`,
      suggestions: '',
      parentSignatureWithMobile: 'Signed',
      parentMobileNo: '',
      isSigned: true,
      pageNumber: selectedPage,
      attachments: [],
      remarks: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: PtmMeetingRecord22) => {
    setEditingRecord(rec);
    setFormState({
      ...rec,
      attachments: rec.attachments || []
    });
    setIsModalOpen(true);
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this PTM entry?')) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      await db.set(storageKey, updated);
      showNotification('PTM entry deleted.');
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (window.confirm(`Reset ${moduleNumber}. Parent-Teacher Meetings records to official defaults?`)) {
      setRecords(DEFAULT_PTM_MEETINGS_22);
      await db.set(storageKey, DEFAULT_PTM_MEETINGS_22);
      showNotification('PTM records reset to defaults.');
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
          id: `att-ptm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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

    if (!formState.studentNameAndClass?.trim() || !formState.suggestions?.trim()) {
      alert('Please fill in Student Name & Class and Suggestions.');
      return;
    }

    const slNoVal = Number(formState.slNo) || getNextSlNo(formState.pageNumber || selectedPage);

    const recordToSave: PtmMeetingRecord22 = {
      id: editingRecord ? editingRecord.id : `ptm-${Date.now()}`,
      slNo: slNoVal,
      date: formState.date || new Date().toLocaleDateString('en-GB'),
      studentId: formState.studentId,
      studentNameAndClass: formState.studentNameAndClass.trim(),
      suggestions: formState.suggestions.trim(),
      parentSignatureWithMobile: formState.parentSignatureWithMobile?.trim() || (formState.parentMobileNo ? `Signed (${formState.parentMobileNo})` : 'Signed'),
      parentName: formState.parentName,
      parentMobileNo: formState.parentMobileNo,
      isSigned: formState.isSigned ?? true,
      pageNumber: formState.pageNumber || selectedPage,
      attachments: formState.attachments || [],
      remarks: formState.remarks,
      templatePageRef: isFoundational ? 27 : 38
    };

    let updatedList: PtmMeetingRecord22[] = [];
    if (editingRecord) {
      updatedList = records.map(r => r.id === editingRecord.id ? recordToSave : r);
    } else {
      updatedList = [...records, recordToSave];
    }

    setRecords(updatedList);
    await db.set(storageKey, updatedList);
    setIsModalOpen(false);
    showNotification('PTM record and evidence saved successfully.');
  };

  // Filtered List
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchPage = selectedPage === 0 || rec.pageNumber === selectedPage;
      const matchSearch = searchTerm === '' ||
        rec.studentNameAndClass.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.suggestions.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.parentSignatureWithMobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.date.toLowerCase().includes(searchTerm.toLowerCase());

      return matchPage && matchSearch;
    });
  }, [records, selectedPage, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Dev Mode Traceability Badge */}
      {devMode && (
        <DevModeBadge
          pages={isFoundational ? 27 : 38}
          title={`${moduleNumber}. अभिभावक-अध्यापक बैठक का अभिलेख (RECORD OF PARENT-TEACHER MEETINGS - ${pageRange})`}
        />
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1.5">
              <HeartHandshake className="w-4 h-4" />
              <span>KVS Teacher Diary • {isFoundational ? 'Foundational Portal (P-27 to 30)' : 'Middle & Secondary Portal (P-38 to 41)'}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {moduleNumber}. अभिभावक-अध्यापक बैठक का अभिलेख
            </h1>
            <h2 className="text-sm font-bold text-slate-300 tracking-wide mt-0.5 uppercase">
              RECORD OF PARENT-TEACHER MEETINGS
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Parent-Teacher consultations, academic and behavioural feedback, parent mobile numbers, verified signatures, and discussion evidence (Photos of diary slips, audio memos, PDF consent letters).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedStudentIdsForImport([]);
                setIsImportModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-800/60 shadow transition"
              title="Import students directly from roster"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Import from Student Roster</span>
            </button>

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
              <span>Add PTM Entry</span>
            </button>
          </div>
        </div>

        {/* Action Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Document parent contact details, guidance points shared, and attach signed slips or audio recordings for complete auditable compliance.</span>
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

      {/* CLASS & SECTION SELECTOR BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-300 whitespace-nowrap">Class :</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-900 border border-purple-500/40 rounded-lg px-3 py-1.5 text-xs font-bold text-purple-200 focus:outline-none focus:border-purple-400 min-w-[130px]"
              >
                {['Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X', 'Class XI', 'Class XII'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-300 whitespace-nowrap">Section :</span>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="bg-slate-900 border border-indigo-500/40 rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-200 focus:outline-none focus:border-indigo-400 min-w-[80px]"
              >
                {['A', 'B', 'C', 'D'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4 Pages Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2">Page:</span>
            {[1, 2, 3, 4].map(pageNum => (
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
            placeholder="Search by student name, suggestions, parent mobile number or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* OFFICIAL 5-COLUMN REGISTER TABLE (MATCHING IMAGE 1) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Exact Headers matching official register */}
              <tr className="bg-slate-950 border-b-2 border-slate-800 text-slate-200 font-extrabold text-center">
                <th className="p-3 border-r border-slate-800 w-[55px]">
                  Sl No
                </th>
                <th className="p-3 border-r border-slate-800 w-[100px] text-center">
                  Date
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[200px] text-left">
                  Name of the Student and Class
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[320px] text-left">
                  Suggestions
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[220px] text-left">
                  Parents Signature with Mobile No.
                </th>
                <th className="p-3 min-w-[75px] text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-400">
                        No PTM records found for selected filters.
                      </span>
                      <button
                        onClick={handleOpenCreateModal}
                        className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-bold underline"
                      >
                        Add a PTM consultation entry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-800/50 transition">
                    {/* Column 1: Sl No */}
                    <td className="p-3 border-r border-slate-800 text-center font-bold text-slate-400 align-top">
                      {row.slNo || idx + 1}
                    </td>

                    {/* Column 2: Date */}
                    <td className="p-3 border-r border-slate-800 text-center font-mono text-purple-300 font-bold align-top">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{row.date}</span>
                      </div>
                    </td>

                    {/* Column 3: Name of the Student and Class */}
                    <td className="p-3 border-r border-slate-800 font-bold text-slate-100 align-top">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{row.studentNameAndClass}</span>
                      </div>
                      {row.rollNo && (
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                          Roll #{row.rollNo}
                        </div>
                      )}
                    </td>

                    {/* Column 4: Suggestions + Attached Evidence */}
                    <td className="p-3 border-r border-slate-800 text-slate-200 leading-relaxed align-top">
                      <p className="text-xs font-medium whitespace-pre-line">{row.suggestions}</p>

                      {/* Attached Evidence Badges */}
                      {row.attachments && row.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-1.5 border-t border-slate-800/80">
                          {row.attachments.map(att => (
                            <button
                              key={att.id}
                              type="button"
                              onClick={() => setPreviewAttachment({ item: att, contextTitle: `PTM Evidence: ${row.studentNameAndClass}` })}
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition cursor-pointer bg-purple-950/80 text-purple-300 border-purple-800/50 hover:bg-purple-900/80"
                            >
                              {att.type === 'photo' && <Image className="w-3 h-3 text-emerald-400" />}
                              {att.type === 'audio' && <Volume2 className="w-3 h-3 text-amber-400" />}
                              {att.type === 'video' && <Video className="w-3 h-3 text-rose-400" />}
                              {att.type === 'pdf' && <FileText className="w-3 h-3 text-indigo-400" />}
                              <span className="truncate max-w-[120px]">{att.title}</span>
                              <Eye className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Column 5: Parents Signature with Mobile No. */}
                    <td className="p-3 border-r border-slate-800 text-slate-300 align-top">
                      <div className="flex items-start gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-slate-100">{row.parentSignatureWithMobile}</div>
                          {row.parentMobileNo && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                              <Phone className="w-3 h-3 text-purple-400" />
                              <span>{row.parentMobileNo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Column 6: Actions */}
                    <td className="p-3 text-center align-top">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                          title="Edit PTM entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete PTM entry"
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

      {/* ADD / EDIT MODAL FOR PTM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {editingRecord ? 'Edit PTM Entry' : `Add ${moduleNumber}. Parent-Teacher Meeting Entry`}
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
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <label className="text-[11px] font-bold text-purple-300 block">
                  Select Existing Student from Roster (Auto-fill Name, Class & Parent):
                </label>
                <select
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Choose student from Roster --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.studentName} (Class {s.className}-{s.section || 'A'}) • Parent: {s.fatherName || s.motherName || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Date of PTM Meeting <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10/08/2025"
                    value={formState.date}
                    onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Name of Student &amp; Class <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vikramaditya Roy (Class X-A)"
                    value={formState.studentNameAndClass}
                    onChange={(e) => setFormState({ ...formState, studentNameAndClass: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Suggestions / Key Feedback &amp; Academic Intervention <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Record actionable feedback given to parent, homework monitoring advice, remedial class plan, or behavioural notes..."
                  value={formState.suggestions}
                  onChange={(e) => setFormState({ ...formState, suggestions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-purple-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* Parents Signature with Mobile No. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Parents Signature / Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Signed (S. N. Roy - Father)"
                    value={formState.parentSignatureWithMobile}
                    onChange={(e) => setFormState({ ...formState, parentSignatureWithMobile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Parent Mobile Number (10 Digits)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={formState.parentMobileNo || ''}
                    onChange={(e) => setFormState({ ...formState, parentMobileNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* MULTIMEDIA EVIDENCE UPLOAD */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attach PTM Evidence (Signed Slips, Voice Memo, Consent PDFs)</span>
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
                  <span>Save PTM Record</span>
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
                  <span className="text-xs text-slate-400">Attached PTM document ({previewAttachment.item.fileSize}).</span>
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

      {/* IMPORT FROM STUDENT ROSTER MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Import Students from Roster into PTM Meeting Records
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select students from your Vidyalaya roster to generate PTM consultation entries with auto-filled parent contact numbers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Filter Roster Class</label>
                <select
                  value={importClassFilter}
                  onChange={(e) => setImportClassFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="All">All Classes</option>
                  {['Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X', 'Class XI', 'Class XII'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Target Page</label>
                <div className="text-xs text-purple-300 font-bold py-1.5 px-3 bg-purple-950/80 rounded-xl border border-purple-900/40">
                  Page {selectedPage === 0 ? 1 : selectedPage} of Register {moduleNumber}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Default Suggestions / Key Feedback Given
                </label>
                <textarea
                  rows={2}
                  value={importSuggestions}
                  onChange={(e) => setImportSuggestions(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>
            </div>

            {/* Student Checkbox List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">
                  Select Students ({selectedStudentIdsForImport.length} Selected):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = students.filter(s => {
                        if (importClassFilter === 'All') return true;
                        const classMatch = `Class ${s.className}`;
                        const classMatchFull = `Class ${s.className}-${s.section || 'A'}`;
                        return classMatch === importClassFilter || classMatchFull.includes(importClassFilter) || s.className === importClassFilter;
                      });
                      setSelectedStudentIdsForImport(filtered.map(s => s.id));
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Select All Filtered
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIdsForImport([])}
                    className="text-xs text-slate-400 hover:text-slate-300"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/60 p-2">
                {students
                  .filter(s => {
                    if (importClassFilter === 'All') return true;
                    const classMatch = `Class ${s.className}`;
                    const classMatchFull = `Class ${s.className}-${s.section || 'A'}`;
                    return classMatch === importClassFilter || classMatchFull.includes(importClassFilter) || s.className === importClassFilter;
                  })
                  .map(std => {
                    const isChecked = selectedStudentIdsForImport.includes(std.id);
                    return (
                      <label
                        key={std.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                          isChecked ? 'bg-purple-950/40 text-white' : 'hover:bg-slate-900/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIdsForImport(prev => [...prev, std.id]);
                              } else {
                                setSelectedStudentIdsForImport(prev => prev.filter(id => id !== std.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                          />
                          <div>
                            <span className="font-bold text-slate-100">{std.studentName}</span>
                            {std.rollNo && (
                              <span className="text-[10px] text-slate-400 ml-2 font-mono">
                                (Roll #{std.rollNo})
                              </span>
                            )}
                            {(std.fatherName || std.contactNumber) && (
                              <span className="text-[10px] text-slate-500 ml-2">
                                • Parent: {std.fatherName || 'Parent'} ({std.contactNumber || 'No Phone'})
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] text-purple-300 font-mono bg-purple-950/80 px-2 py-0.5 rounded border border-purple-900/40">
                          Class {std.className}-{std.section || 'A'}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImportStudents}
                disabled={selectedStudentIdsForImport.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 transition cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Import {selectedStudentIdsForImport.length} Students</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PtmMeetingManager;
