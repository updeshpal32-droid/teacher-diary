import React, { useState, useRef, useEffect } from 'react';
import {
  DailyLessonPlan,
  LessonEvidenceItem,
  LessonEvidenceCategory
} from '../types/academic';
import {
  Image,
  Video,
  FileText,
  Upload,
  Trash2,
  CheckCircle,
  Eye,
  Printer,
  Sparkles,
  Filter,
  Plus,
  FileCheck,
  Calendar,
  X,
  Tag,
  Paperclip,
  CheckSquare,
  Square,
  Award,
  BookOpen,
  Camera,
  Cloud,
  HardDrive,
  FolderCheck
} from 'lucide-react';
import { db } from '../lib/storage';

interface LessonEvidenceManagerProps {
  plans: DailyLessonPlan[];
  activePlan?: DailyLessonPlan | null;
  onUpdatePlanEvidence: (planId: string, updatedEvidence: LessonEvidenceItem[]) => void;
  devMode?: boolean;
}

const EVIDENCE_CATEGORIES: { category: LessonEvidenceCategory; label: string; color: string }[] = [
  { category: 'Photo', label: '📸 Classroom Photo', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { category: 'Video Clip', label: '🎥 Video Clip', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { category: 'Worksheet', label: '📄 Student Worksheet', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { category: 'PDF Document', label: '📕 PDF Document', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { category: 'Student Work Sample', label: '✍️ Student Work Sample', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { category: 'Experiment Evidence', label: '🧪 Science/Math Experiment', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { category: 'Activity Evidence', label: '🎨 Group Activity Evidence', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  { category: 'Classroom Materials', label: '📚 TLM / Smart Board Material', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' }
];

export default function LessonEvidenceManager({
  plans,
  activePlan,
  onUpdatePlanEvidence,
  devMode = true
}: LessonEvidenceManagerProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(activePlan?.id || (plans[0]?.id || ''));
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [previewMedia, setPreviewMedia] = useState<LessonEvidenceItem | null>(null);
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // New Evidence Upload Form State
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<LessonEvidenceCategory>('Photo');
  const [caption, setCaption] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{
    fileType: 'image' | 'video' | 'pdf' | 'document';
    fileUrl: string;
    fileName: string;
    fileSize: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentPlan = plans.find(p => p.id === selectedPlanId) || activePlan || plans[0];
  const evidenceList = currentPlan?.evidenceItems || [];

  const [storageLocation, setStorageLocation] = useState<'local' | 'google_drive'>('local');
  const [googleDriveAccount, setGoogleDriveAccount] = useState<{ connected: boolean; email: string; folder: string } | null>(null);

  useEffect(() => {
    loadStorageSettings();
  }, []);

  const loadStorageSettings = async () => {
    const loc = await db.get<'local' | 'google_drive'>('settings:media_storage_location');
    if (loc) setStorageLocation(loc);

    const driveAcc = await db.get<{ connected: boolean; email: string; folder: string }>('settings:google_drive_account');
    if (driveAcc) setGoogleDriveAccount(driveAcc);
  };

  // Handle File Upload Read
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = `${sizeInMb} MB`;

    let fileType: 'image' | 'video' | 'pdf' | 'document' = 'image';
    if (file.type.startsWith('video/')) {
      fileType = 'video';
    } else if (file.type === 'application/pdf') {
      fileType = 'pdf';
    } else if (file.type.startsWith('text/') || file.type.includes('document')) {
      fileType = 'document';
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile({
        fileType,
        fileUrl: event.target?.result as string,
        fileName: file.name,
        fileSize: sizeStr
      });
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleAddSampleMedia = (type: 'photo' | 'worksheet' | 'video' | 'experiment') => {
    let sample: LessonEvidenceItem;
    const now = new Date().toISOString().split('T')[0];
    const loc = storageLocation;
    const drivePathVal = loc === 'google_drive' ? `My Drive/KVS Teacher Diary/Media Evidence/sample_${Date.now()}` : undefined;

    if (type === 'photo') {
      sample = {
        id: `ev-${Date.now()}`,
        lessonPlanId: currentPlan.id,
        title: 'Board Work & Student Practice Photo',
        category: 'Photo',
        fileType: 'image',
        fileUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
        fileName: 'classroom_board_activity.jpg',
        fileSize: '1.6 MB',
        uploadDate: now,
        caption: `Live classroom observation photo for Class ${currentPlan.className}-${currentPlan.section} on topic: ${currentPlan.topic}.`,
        className: currentPlan.className,
        section: currentPlan.section,
        subjectName: currentPlan.subjectName,
        topic: currentPlan.topic,
        isSelectedForAppendix: true,
        storageLocation: loc,
        drivePath: drivePathVal
      };
    } else if (type === 'worksheet') {
      sample = {
        id: `ev-${Date.now()}`,
        lessonPlanId: currentPlan.id,
        title: 'Class Practice Worksheet',
        category: 'Worksheet',
        fileType: 'pdf',
        fileUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
        fileName: `worksheet_${currentPlan.topic.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        fileSize: '950 KB',
        uploadDate: now,
        caption: `Printed diagnostic and practice exercise worksheet evaluated during 40-minute period.`,
        className: currentPlan.className,
        section: currentPlan.section,
        subjectName: currentPlan.subjectName,
        topic: currentPlan.topic,
        isSelectedForAppendix: true,
        storageLocation: loc,
        drivePath: drivePathVal
      };
    } else if (type === 'video') {
      sample = {
        id: `ev-${Date.now()}`,
        lessonPlanId: currentPlan.id,
        title: 'Group Explanation Short Video Recording',
        category: 'Video Clip',
        fileType: 'video',
        fileUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
        fileName: 'group_activity_video_clip.mp4',
        fileSize: '6.2 MB',
        uploadDate: now,
        caption: `30-second video recording of student peer-learning pair activity during period.`,
        className: currentPlan.className,
        section: currentPlan.section,
        subjectName: currentPlan.subjectName,
        topic: currentPlan.topic,
        isSelectedForAppendix: true,
        storageLocation: loc,
        drivePath: drivePathVal
      };
    } else {
      sample = {
        id: `ev-${Date.now()}`,
        lessonPlanId: currentPlan.id,
        title: 'Math/Science Activity Kit Evidence',
        category: 'Experiment Evidence',
        fileType: 'image',
        fileUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
        fileName: 'experiment_activity_kit.jpg',
        fileSize: '2.4 MB',
        uploadDate: now,
        caption: `Demonstration using manipulative models & activity kit during class activity.`,
        className: currentPlan.className,
        section: currentPlan.section,
        subjectName: currentPlan.subjectName,
        topic: currentPlan.topic,
        isSelectedForAppendix: true,
        storageLocation: loc,
        drivePath: drivePathVal
      };
    }

    const updated = [sample, ...evidenceList];
    onUpdatePlanEvidence(currentPlan.id, updated);
  };

  const handleSaveUploadedMedia = () => {
    if (!title.trim() || !selectedFile || !currentPlan) return;

    const newItem: LessonEvidenceItem = {
      id: `ev-${Date.now()}`,
      lessonPlanId: currentPlan.id,
      title: title.trim(),
      category,
      fileType: selectedFile.fileType,
      fileUrl: selectedFile.fileUrl,
      fileName: selectedFile.fileName,
      fileSize: selectedFile.fileSize,
      uploadDate: new Date().toISOString().split('T')[0],
      caption: caption.trim() || `Classroom evidence item for ${currentPlan.topic}`,
      className: currentPlan.className,
      section: currentPlan.section,
      subjectName: currentPlan.subjectName,
      topic: currentPlan.topic,
      isSelectedForAppendix: true,
      storageLocation: storageLocation,
      drivePath: storageLocation === 'google_drive' ? `My Drive/KVS Teacher Diary/Media Evidence/${selectedFile.fileName}` : undefined
    };

    const updated = [newItem, ...evidenceList];
    onUpdatePlanEvidence(currentPlan.id, updated);

    // Reset Form
    setTitle('');
    setCaption('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToggleAppendixSelect = (item: LessonEvidenceItem) => {
    const updated = evidenceList.map(ev =>
      ev.id === item.id ? { ...ev, isSelectedForAppendix: !ev.isSelectedForAppendix } : ev
    );
    onUpdatePlanEvidence(currentPlan.id, updated);
  };

  const handleDeleteEvidence = (itemId: string) => {
    const updated = evidenceList.filter(ev => ev.id !== itemId);
    onUpdatePlanEvidence(currentPlan.id, updated);
  };

  const filteredEvidence = evidenceList.filter(item => {
    if (categoryFilter === 'All') return true;
    return item.category === categoryFilter;
  });

  const selectedForAppendixCount = evidenceList.filter(i => i.isSelectedForAppendix !== false).length;

  if (isPrintMode && currentPlan) {
    return (
      <div className="bg-white text-slate-900 min-h-screen p-8 print:p-0">
        {/* Print Toolbar */}
        <div className="no-print mb-6 flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Printer className="w-5 h-5 text-purple-400" />
              Print Preview: Teaching Evidence Appendix Report
            </h3>
            <p className="text-xs text-slate-400">
              Official KVS/CBSE Classroom Activity & Media Evidence Attachment
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={() => setIsPrintMode(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Close Preview
            </button>
          </div>
        </div>

        {/* Official Printable Appendix Sheet */}
        <div className="max-w-4xl mx-auto border-2 border-slate-900 p-8 rounded-none space-y-6">
          {/* KVS Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
              KENDRIYA VIDYALAYA SANGATHAN
            </h1>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mt-0.5">
              OFFICIAL TEACHING-LEARNING & CLASSROOM ACTIVITY EVIDENCE APPENDIX
            </h2>
            <p className="text-xs font-medium text-slate-600 mt-1">
              Attached to Daily Lesson Plan Record | Subject Teacher's Diary
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border border-slate-800 p-4 bg-slate-50 font-medium">
            <div>
              <span className="text-slate-500 uppercase text-[10px] block font-bold">Class & Section:</span>
              <span className="font-bold text-slate-900 text-sm">Class {currentPlan.className}-{currentPlan.section}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block font-bold">Subject:</span>
              <span className="font-bold text-slate-900 text-sm">{currentPlan.subjectName}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block font-bold">Lesson Topic:</span>
              <span className="font-bold text-slate-900">{currentPlan.topic}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block font-bold">Teaching Date:</span>
              <span className="font-bold text-slate-900">{currentPlan.date} ({currentPlan.day})</span>
            </div>
          </div>

          {/* Evidence Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-400 pb-1 flex items-center justify-between">
              <span>Classroom Media & Activity Attachments</span>
              <span className="text-xs font-normal text-slate-600">Total Items: {evidenceList.filter(i => i.isSelectedForAppendix !== false).length}</span>
            </h3>

            {evidenceList.filter(i => i.isSelectedForAppendix !== false).length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs italic">
                No media evidence items selected for this report appendix.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {evidenceList
                  .filter(i => i.isSelectedForAppendix !== false)
                  .map((item, idx) => (
                    <div key={item.id} className="border border-slate-800 p-3 rounded-md space-y-2.5 bg-slate-50/50">
                      {/* Item Thumbnail */}
                      <div className="aspect-video bg-slate-200 rounded overflow-hidden border border-slate-300 relative flex items-center justify-center">
                        {item.fileType === 'image' || item.fileType === 'video' ? (
                          <img
                            src={item.fileUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-700 p-4 text-center">
                            <FileText className="w-10 h-10 text-rose-600 mb-1" />
                            <span className="text-xs font-bold">{item.fileName}</span>
                            <span className="text-[10px] text-slate-500">{item.fileSize}</span>
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded">
                          Item #{idx + 1} • {item.category}
                        </span>
                      </div>

                      {/* Evidence Details */}
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{item.title}</h4>
                        <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                          {item.caption}
                        </p>
                        <div className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between border-t border-slate-200 pt-1">
                          <span>File: {item.fileName} ({item.fileSize})</span>
                          <span>Uploaded: {item.uploadDate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Inspection Signature Block */}
          <div className="border-t-2 border-slate-900 pt-8 mt-12 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-900">
            <div className="pt-8 border-t border-slate-400">
              <span>Signature of Subject Teacher</span>
              <p className="text-[10px] font-normal text-slate-500 mt-0.5">Date: {currentPlan.date}</p>
            </div>
            <div className="pt-8 border-t border-slate-400">
              <span>Signature of Academic Coordinator / HOD</span>
              <p className="text-[10px] font-normal text-slate-500 mt-0.5">Checked & Verified</p>
            </div>
            <div className="pt-8 border-t border-slate-400">
              <span>Signature of Principal / Inspector</span>
              <p className="text-[10px] font-normal text-slate-500 mt-0.5">Approved & Stamped</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-400" />
              Lesson Plan Photo, Video & Document Evidence System
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Inspection Evidence Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Attach photos, video recordings, worksheets, student work samples, and classroom materials linked directly to lesson plan topics for inspection records.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPrintMode(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-md border border-purple-400/30"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Print Evidence Appendix Report</span>
          </button>
        </div>
      </div>

      {/* Selector Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Lesson Plan Selector */}
        <div className="flex items-center gap-2 flex-1">
          <label className="text-xs font-bold text-slate-300 shrink-0">
            Select Lesson Plan:
          </label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {plans.map(p => (
              <option key={p.id} value={p.id}>
                Class {p.className}-{p.section} | {p.subjectName} | {p.topic} ({p.date})
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="All">All Categories ({evidenceList.length})</option>
            {EVIDENCE_CATEGORIES.map(c => (
              <option key={c.category} value={c.category}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Lesson Plan Summary Banner */}
      {currentPlan && (
        <div className="bg-slate-900/80 border border-purple-500/20 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Class {currentPlan.className}-{currentPlan.section}
              </span>
              <span className="text-xs font-bold text-slate-200">{currentPlan.subjectName}</span>
              <span className="text-xs text-slate-400">• {currentPlan.periodNo}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              {currentPlan.topic}
            </h4>
            <p className="text-xs text-slate-400">
              Subtopic: {currentPlan.subtopic || currentPlan.topic} | Date: {currentPlan.date} ({currentPlan.day})
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <Award className="w-4 h-4 text-amber-400" />
            <span>
              <strong className="text-purple-300">{selectedForAppendixCount}</strong> of {evidenceList.length} items marked for Appendix Report
            </span>
          </div>
        </div>
      )}

      {/* Upload Box & Quick Preset Adders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Upload Box */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          {/* Active Storage Destination Indicator Banner */}
          <div className={`p-3 border rounded-xl text-xs flex items-center justify-between ${
            storageLocation === 'google_drive'
              ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
              : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center gap-2">
              {storageLocation === 'google_drive' ? (
                <>
                  <Cloud className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    Storage Target: <strong className="text-purple-300">Google Drive Cloud</strong> ({googleDriveAccount?.email || 'Connected Account'})
                  </span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Storage Target: <strong className="text-emerald-300">Local Device Database</strong> (Offline Storage)
                  </span>
                </>
              )}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {storageLocation === 'google_drive' ? 'Google Cloud Sync' : 'Local IndexedDB'}
            </span>
          </div>

          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <Upload className="w-4 h-4 text-purple-400" />
            Upload New Photo, Video or Document Evidence
          </h4>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-slate-700 hover:border-purple-500/50 bg-slate-950/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-3 bg-purple-600/20 text-purple-400 rounded-full border border-purple-500/30">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Click to select file or drag & drop media here
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supports JPG, PNG, MP4 video clips, PDF worksheets & student documents
                </p>
              </div>
            </div>
          </div>

          {/* Uploaded File Metadata Form */}
          {selectedFile && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Paperclip className="w-4 h-4 text-purple-400" />
                  <span>Selected File: {selectedFile.fileName}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({selectedFile.fileSize})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-slate-400 hover:text-rose-400 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Evidence Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Board Work Proof / Student Lab Experiment"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Evidence Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LessonEvidenceCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {EVIDENCE_CATEGORIES.map(c => (
                      <option key={c.category} value={c.category}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Caption & Description for Record *
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={2}
                  placeholder="Describe classroom context, student participation, and pedagogical relevance..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveUploadedMedia}
                disabled={!title.trim()}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Attach Evidence to Lesson Plan</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Sample Media Preset Generator */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Quick Sample Evidence Presets
            </h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Instantly generate high-resolution sample teaching evidence for testing inspection records:
            </p>

            <div className="space-y-2 mt-3">
              <button
                type="button"
                onClick={() => handleAddSampleMedia('photo')}
                className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 flex items-center justify-between transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-400" />
                  <span>Classroom Board Work Photo</span>
                </span>
                <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
              </button>

              <button
                type="button"
                onClick={() => handleAddSampleMedia('worksheet')}
                className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 flex items-center justify-between transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Evaluated Student Worksheet</span>
                </span>
                <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
              </button>

              <button
                type="button"
                onClick={() => handleAddSampleMedia('video')}
                className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 flex items-center justify-between transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span>Classroom Group Video Clip</span>
                </span>
                <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
              </button>

              <button
                type="button"
                onClick={() => handleAddSampleMedia('experiment')}
                className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 flex items-center justify-between transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>Activity Kit / Model Evidence</span>
                </span>
                <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
              </button>
            </div>
          </div>

          <div className="bg-purple-950/30 border border-purple-500/20 rounded-lg p-3 text-[11px] text-purple-300">
            💡 <strong>Tip:</strong> Items marked with a checkmark are included in the printable Appendix Report.
          </div>
        </div>
      </div>

      {/* Media Evidence Thumbnails Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Image className="w-4 h-4 text-purple-400" />
            Attached Media Evidence Items ({filteredEvidence.length})
          </h4>
          <span className="text-xs text-slate-400">
            Linked to Lesson Plan: <strong className="text-slate-200">{currentPlan?.topic}</strong>
          </span>
        </div>

        {filteredEvidence.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <Camera className="w-10 h-10 mx-auto text-slate-700" />
            <p className="text-xs font-medium">No media evidence uploaded yet for this lesson plan.</p>
            <p className="text-[11px] text-slate-600">Use the upload box above or click sample presets to attach classroom photos & worksheets.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredEvidence.map((item) => {
              const categoryObj = EVIDENCE_CATEGORIES.find(c => c.category === item.category);
              const isSelected = item.isSelectedForAppendix !== false;

              return (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col justify-between transition-all group"
                >
                  {/* Thumbnail Container */}
                  <div className="aspect-video bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    {item.fileType === 'image' || item.fileType === 'video' ? (
                      <img
                        src={item.fileUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-slate-400">
                        <FileText className="w-10 h-10 text-rose-500 mb-1" />
                        <span className="text-xs font-bold text-slate-300 truncate max-w-[150px]">{item.fileName}</span>
                        <span className="text-[10px] text-slate-500">{item.fileSize}</span>
                      </div>
                    )}

                    {/* Category Overlay Tag & Storage Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap max-w-[90%]">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border backdrop-blur-md ${categoryObj?.color || 'bg-slate-800 text-slate-300'}`}>
                        {item.category}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border backdrop-blur-md flex items-center gap-1 ${
                        (item.storageLocation || storageLocation) === 'google_drive'
                          ? 'bg-purple-900/80 text-purple-200 border-purple-500/40'
                          : 'bg-emerald-900/80 text-emerald-200 border-emerald-500/40'
                      }`}>
                        {(item.storageLocation || storageLocation) === 'google_drive' ? (
                          <><Cloud className="w-2.5 h-2.5 text-purple-300" /> Drive</>
                        ) : (
                          <><HardDrive className="w-2.5 h-2.5 text-emerald-300" /> Local</>
                        )}
                      </span>
                    </div>

                    {/* Action Hover Buttons */}
                    <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={() => setPreviewMedia(item)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow"
                      >
                        <Eye className="w-4 h-4 text-purple-400" />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvidence(item.id)}
                        className="p-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded-lg text-xs font-medium flex items-center gap-1 shadow"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-200 line-clamp-1">{item.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.caption}
                      </p>
                    </div>

                    <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <button
                        type="button"
                        onClick={() => handleToggleAppendixSelect(item)}
                        className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                          isSelected ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        <span>Appendix Report</span>
                      </button>

                      <span>{item.uploadDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Media Lightbox Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-100">{previewMedia.title}</h4>
                <p className="text-xs text-slate-400">
                  {previewMedia.category} • Class {previewMedia.className}-{previewMedia.section} • {previewMedia.subjectName}
                </p>
              </div>
              <button
                onClick={() => setPreviewMedia(null)}
                className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Media Content */}
            <div className="p-4 bg-slate-950 overflow-y-auto flex items-center justify-center min-h-[300px]">
              {previewMedia.fileType === 'image' || previewMedia.fileType === 'video' ? (
                <img
                  src={previewMedia.fileUrl}
                  alt={previewMedia.title}
                  className="max-h-[60vh] rounded-lg object-contain"
                />
              ) : (
                <div className="text-center py-12 space-y-3">
                  <FileText className="w-16 h-16 text-rose-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-200">{previewMedia.fileName}</p>
                  <p className="text-xs text-slate-400">Document / PDF Evidence File ({previewMedia.fileSize})</p>
                  <a
                    href={previewMedia.fileUrl}
                    download={previewMedia.fileName}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Download PDF File
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer Caption */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                Pedagogical Evidence Caption
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {previewMedia.caption}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
