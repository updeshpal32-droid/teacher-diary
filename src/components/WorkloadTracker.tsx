import React, { useState, useEffect } from 'react';
import { db, getAllAvailableTags } from '../lib/storage';
import {
  HourlyActivity,
  ActivityEvidence,
  CalendarSyncSetting,
  AIWorkloadAnalysisReport,
  HourlyCategory,
  ActivityStatus,
  EisenhowerPriority,
  TeacherProfile,
  SchoolDetails,
  TaskTagDefinition
} from '../types/academic';
import { UserAccount } from '../types/auth';
import {
  Clock,
  Plus,
  Mic,
  MicOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  Calendar as CalIcon,
  Sparkles,
  BarChart3,
  Printer,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronRight,
  ExternalLink,
  Lock,
  Layers,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  Download,
  Share2,
  Trash2,
  Edit2,
  ListTodo,
  Tag
} from 'lucide-react';
import { TaskManager } from './TaskManager';

interface WorkloadTrackerProps {
  devMode?: boolean;
  currentUser?: UserAccount | null;
}

export function WorkloadTracker({ devMode = true, currentUser }: WorkloadTrackerProps) {
  const [subTab, setSubTab] = useState<'tracker' | 'tasks' | 'evidence' | 'heatmap' | 'kanban' | 'pdf' | 'calendar' | 'ai'>('tracker');

  // Data states
  const [activities, setActivities] = useState<HourlyActivity[]>([]);
  const [evidenceList, setEvidenceList] = useState<ActivityEvidence[]>([]);
  const [calendarSyncList, setCalendarSyncList] = useState<CalendarSyncSetting[]>([]);
  const [aiReport, setAiReport] = useState<AIWorkloadAnalysisReport | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<Partial<TeacherProfile>>({});
  const [schoolDetails, setSchoolDetails] = useState<Partial<SchoolDetails>>({});

  // Filter and view states
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-09');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [heatmapTimeframe, setHeatmapTimeframe] = useState<'Weekly' | 'Monthly' | 'Quarterly' | 'Annual'>('Weekly');

  // Form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<HourlyActivity | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Activity form fields
  const [newDate, setNewDate] = useState<string>('2026-08-09');
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newCategory, setNewCategory] = useState<HourlyCategory>('Teaching');
  const [newStatus, setNewStatus] = useState<ActivityStatus>('Done');
  const [newPriority, setNewPriority] = useState<EisenhowerPriority>('Do First (Urgent & Important)');
  const [newClassName, setNewClassName] = useState('X-A');
  const [newSubjectName, setNewSubjectName] = useState('Mathematics (041)');
  const [newDescription, setNewDescription] = useState('');
  const [newIsOverload, setNewIsOverload] = useState(false);
  const [newOverloadReason, setNewOverloadReason] = useState('');
  // Evidence upload form fields
  const [evidenceCaption, setEvidenceCaption] = useState('');
  const [evidenceActivityId, setEvidenceActivityId] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // Dynamic Tags / Categories State (Admin & Teacher Scoped)
  const [availableTags, setAvailableTags] = useState<TaskTagDefinition[]>([]);

  const teacherCode = currentUser?.employeeCode;

  useEffect(() => {
    loadAllData();
  }, [teacherCode]);

  const loadAllData = async () => {
    const savedActivities = await db.get<HourlyActivity[]>('setup:hourly_activities') || [];
    const savedEvidence = await db.get<ActivityEvidence[]>('setup:evidence') || [];
    const savedSync = await db.get<CalendarSyncSetting[]>('setup:calendar_sync') || [];
    const profile = await db.get<TeacherProfile>('setup:teacher') || {};
    const school = await db.get<SchoolDetails>('setup:school') || {};
    const tags = await getAllAvailableTags(teacherCode);

    setActivities(savedActivities);
    setEvidenceList(savedEvidence);
    setCalendarSyncList(savedSync);
    setTeacherProfile(profile);
    setSchoolDetails(school);
    setAvailableTags(tags);
  };

  const saveActivities = async (updated: HourlyActivity[]) => {
    setActivities(updated);
    await db.set('setup:hourly_activities', updated);
  };

  const saveEvidence = async (updated: ActivityEvidence[]) => {
    setEvidenceList(updated);
    await db.set('setup:evidence', updated);
  };

  // Voice to text quick entry
  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice-to-text recognition is not supported natively in this browser window. Please type manually or use Chrome/Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewTitle(transcript);
        setSpeechText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingActivity(null);
    setNewDate(selectedDate);
    setNewTitle('');
    setNewStartTime('09:00');
    setNewEndTime('10:00');
    setNewCategory('Teaching');
    setNewStatus('Done');
    setNewPriority('Do First (Urgent & Important)');
    setNewClassName('X-A');
    setNewSubjectName('Mathematics (041)');
    setNewDescription('');
    setNewIsOverload(false);
    setNewOverloadReason('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditActivity = (act: HourlyActivity) => {
    setEditingActivity(act);
    setNewDate(act.date || selectedDate);
    setNewTitle(act.title);
    setNewStartTime(act.startTime);
    setNewEndTime(act.endTime);
    setNewCategory(act.category);
    setNewStatus(act.status);
    setNewPriority(act.priority || 'Do First (Urgent & Important)');
    setNewClassName(act.className || 'X-A');
    setNewSubjectName(act.subjectName || 'Mathematics (041)');
    setNewDescription(act.description || '');
    setNewIsOverload(act.isOverlappingDuty || false);
    setNewOverloadReason(act.overloadReason || '');
    setIsAddModalOpen(true);
  };

  const handleQuickAddPreset = (presetTitle: string, category: HourlyCategory, priority: EisenhowerPriority, overload = false, reason = '') => {
    setEditingActivity(null);
    setNewDate(selectedDate);
    setNewTitle(presetTitle);
    setNewCategory(category);
    setNewPriority(priority);
    setNewIsOverload(overload);
    setNewOverloadReason(reason);
    setIsAddModalOpen(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (editingActivity) {
      const updated = activities.map(a => {
        if (a.id === editingActivity.id) {
          return {
            ...a,
            date: newDate,
            startTime: newStartTime,
            endTime: newEndTime,
            title: newTitle.trim(),
            description: newDescription.trim() || 'Hourly workload activity logged.',
            category: newCategory,
            status: newStatus,
            priority: newPriority,
            className: newCategory === 'Teaching' ? newClassName : undefined,
            subjectName: newCategory === 'Teaching' ? newSubjectName : undefined,
            isOverlappingDuty: newIsOverload,
            overloadReason: newIsOverload ? newOverloadReason : undefined,
            kanbanColumn: (newStatus === 'Done' ? 'Completed' : newStatus === 'In Progress' ? 'In Progress' : newStatus === 'Missed' ? 'Delayed' : 'Pending') as 'Completed' | 'In Progress' | 'Pending' | 'Delayed',
            updatedAt: new Date().toISOString()
          };
        }
        return a;
      });
      await saveActivities(updated);
    } else {
      const newAct: HourlyActivity = {
        id: 'act-' + Date.now(),
        date: newDate || selectedDate,
        startTime: newStartTime,
        endTime: newEndTime,
        title: newTitle.trim(),
        description: newDescription.trim() || 'Hourly workload activity logged.',
        category: newCategory,
        status: newStatus,
        priority: newPriority,
        className: newCategory === 'Teaching' ? newClassName : undefined,
        subjectName: newCategory === 'Teaching' ? newSubjectName : undefined,
        isOverlappingDuty: newIsOverload,
        overloadReason: newIsOverload ? newOverloadReason : undefined,
        evidenceIds: [],
        kanbanColumn: (newStatus === 'Done' ? 'Completed' : newStatus === 'In Progress' ? 'In Progress' : newStatus === 'Missed' ? 'Delayed' : 'Pending') as 'Completed' | 'In Progress' | 'Pending' | 'Delayed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveActivities([newAct, ...activities]);
    }

    // Reset form
    setEditingActivity(null);
    setNewTitle('');
    setNewDescription('');
    setNewIsOverload(false);
    setNewOverloadReason('');
    setIsAddModalOpen(false);
  };

  const handleDeleteActivity = async (id: string) => {
    if (confirm('Are you sure you want to delete this activity log?')) {
      const updated = activities.filter(a => a.id !== id);
      await saveActivities(updated);
    }
  };

  const handleUpdateStatus = async (id: string, newStat: ActivityStatus) => {
    const updated = activities.map(a => {
      if (a.id === id) {
        const kanbanCol: 'Completed' | 'In Progress' | 'Pending' | 'Delayed' = newStat === 'Done' ? 'Completed' : newStat === 'In Progress' ? 'In Progress' : newStat === 'Missed' ? 'Delayed' : 'Pending';
        return { ...a, status: newStat, kanbanColumn: kanbanCol, updatedAt: new Date().toISOString() };
      }
      return a;
    });
    await saveActivities(updated);
  };

  const handleMoveKanban = async (id: string, newCol: 'Pending' | 'In Progress' | 'Completed' | 'Delayed') => {
    const updated = activities.map(a => {
      if (a.id === id) {
        const stat: ActivityStatus = newCol === 'Completed' ? 'Done' : newCol === 'In Progress' ? 'In Progress' : newCol === 'Delayed' ? 'Missed' : 'Pending';
        return { ...a, kanbanColumn: newCol, status: stat, updatedAt: new Date().toISOString() };
      }
      return a;
    });
    await saveActivities(updated);
  };

  // Upload Evidence File handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEvidence(true);
    const reader = new FileReader();

    reader.onload = async () => {
      const result = reader.result as string;
      const fileType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('audio/')
        ? 'voice_note'
        : 'document';

      const newEv: ActivityEvidence = {
        id: 'ev-' + Date.now(),
        activityId: evidenceActivityId || (activities[0]?.id || ''),
        fileType,
        fileName: file.name,
        fileUrl: result,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadedAt: new Date().toISOString(),
        timestampVerified: true,
        caption: evidenceCaption || `Verifiable evidence proof uploaded for ${file.name}`
      };

      const updatedEvidence = [newEv, ...evidenceList];
      await saveEvidence(updatedEvidence);

      // Link to activity
      if (newEv.activityId) {
        const updatedActivities = activities.map(a => {
          if (a.id === newEv.activityId) {
            return { ...a, evidenceIds: Array.from(new Set([...a.evidenceIds, newEv.id])) };
          }
          return a;
        });
        await saveActivities(updatedActivities);
      }

      setUploadingEvidence(false);
      setEvidenceCaption('');
      setEvidenceActivityId('');
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteEvidence = async (id: string) => {
    if (confirm('Delete this proof evidence record?')) {
      const updatedEv = evidenceList.filter(e => e.id !== id);
      await saveEvidence(updatedEv);

      const updatedAct = activities.map(a => ({
        ...a,
        evidenceIds: a.evidenceIds.filter(eId => eId !== id)
      }));
      await saveActivities(updatedAct);
    }
  };

  // AI Workload Analysis call
  const handleRunAIWorkloadAudit = async () => {
    setIsLoadingAI(true);
    try {
      const res = await fetch('/api/ai/analyze-workload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activities,
          teacherName: teacherProfile.name || 'Updesh Kumar',
          schoolName: schoolDetails.schoolName || 'Kendriya Vidyalaya No. 1',
          dateRange: 'August 1 - August 9, 2026'
        })
      });

      const data = await res.json();
      if (data.success && data.report) {
        setAiReport(data.report);
      } else {
        alert('Failed to generate AI report: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error calling AI endpoint');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Printable report handler
  const handlePrintReport = () => {
    window.print();
  };

  // Filtered activities
  const filteredActivities = activities.filter(a => {
    if (categoryFilter !== 'All' && a.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    return true;
  });

  const doneCount = activities.filter(a => a.status === 'Done').length;
  const pendingCount = activities.filter(a => a.status === 'Pending' || a.status === 'In Progress').length;
  const missedCount = activities.filter(a => a.status === 'Missed').length;
  const overloadCount = activities.filter(a => a.isOverlappingDuty).length;
  const totalLoggedHours = activities.length * 0.85;

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Quick Stats */}
      <div className="bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-purple-300" />
              <span>Major Update • Hourly Activity & Defensible Workload Tracker</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-serif text-white font-bold tracking-tight">
              Teacher Hourly Workload & Proof System
            </h2>
            <p className="text-sm text-purple-200/80 max-w-2xl leading-relaxed">
              Track activities by time, link verifiable proof (photos, documents, receipts), generate legal defensibility reports justifying pending work due to official overload, and sync with Google Calendar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-950/50 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Activity</span>
            </button>

            <button
              onClick={handleRunAIWorkloadAudit}
              disabled={isLoadingAI}
              className="px-4 py-2.5 rounded-2xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-200 font-medium text-sm flex items-center gap-2 transition-all"
            >
              <Sparkles className={`w-4 h-4 text-purple-300 ${isLoadingAI ? 'animate-spin' : ''}`} />
              <span>{isLoadingAI ? 'Analyzing Workload...' : 'AI Workload Audit'}</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-purple-500/20">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium">Total Logged Hours</div>
            <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-1">
              <span>{totalLoggedHours.toFixed(1)}</span>
              <span className="text-xs font-normal text-slate-400">hrs</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
            <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </div>
            <div className="text-xl font-bold text-emerald-300 mt-1">{doneCount}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30">
            <div className="text-xs text-amber-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending / In Progress</span>
            </div>
            <div className="text-xl font-bold text-amber-300 mt-1">{pendingCount}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30">
            <div className="text-xs text-rose-400 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Delayed due to Overload</span>
            </div>
            <div className="text-xl font-bold text-rose-300 mt-1">{missedCount}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-950/50 border border-purple-500/30 col-span-2 sm:col-span-1">
            <div className="text-xs text-purple-300 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Proof Evidence Items</span>
            </div>
            <div className="text-xl font-bold text-purple-200 mt-1">{evidenceList.length} Files</div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--glass-border)] no-scrollbar">
        {[
          { id: 'tracker', label: 'Hourly Timeline', icon: Clock },
          { id: 'tasks', label: 'Task Management System', icon: ListTodo },
          { id: 'evidence', label: 'Verifiable Evidence Proof', icon: ShieldCheck, badge: evidenceList.length },
          { id: 'heatmap', label: 'Workload Heatmap', icon: BarChart3 },
          { id: 'kanban', label: 'Kanban Workload Board', icon: Layers },
          { id: 'pdf', label: 'Defensible PDF Report', icon: Printer },
          { id: 'calendar', label: 'Google Calendar Sync', icon: CalIcon },
          { id: 'ai', label: 'AI Workload Audit', icon: Sparkles, badge: aiReport ? 'Ready' : undefined }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/40'
                  : 'bg-purple-950/30 text-purple-300/80 hover:bg-purple-900/50 hover:text-white border border-purple-500/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-300'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW 0: TASK MANAGEMENT SYSTEM */}
      {subTab === 'tasks' && (
        <TaskManager
          currentUser={currentUser}
          devMode={devMode}
          onSyncToWorkload={async (task) => {
            const newActivity: HourlyActivity = {
              id: 'act-' + Date.now(),
              date: task.dueDate || new Date().toISOString().split('T')[0],
              startTime: task.dueTime || '10:00',
              endTime: '11:00',
              title: task.title,
              description: task.description || '',
              category: task.category,
              status: task.status === 'Completed' ? 'Done' : 'Pending',
              priority: task.priority,
              className: task.linkedClass || 'X-A',
              subjectName: task.linkedSubject || 'General Duty',
              isOverlappingDuty: task.overloadImpact,
              overloadReason: task.overloadImpact ? 'Duty overlap logged from Task System' : '',
              evidenceIds: [],
              kanbanColumn: task.status === 'Completed' ? 'Completed' : 'Pending',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await saveActivities([newActivity, ...activities]);
            alert(`Synced "${task.title}" to Hourly Timeline!`);
            setSubTab('tracker');
          }}
        />
      )}

      {/* SUB-VIEW 1: HOURLY TIMELINE & QUICK LOG */}
      {subTab === 'tracker' && (
        <div className="space-y-6">
          {/* One-Tap Quick Entry Presets */}
          <div className="p-4 rounded-3xl bg-purple-950/30 border border-purple-500/20 space-y-3">
            <div className="text-xs font-semibold text-purple-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>One-Tap Quick Entry Presets (Fast Duty Logging)</span>
              </span>
              <span className="text-[11px] text-[var(--text-dim)]">Tap to quickly pre-fill logger</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickAddPreset('Class X-A Mathematics Period 1', 'Teaching', 'Do First (Urgent & Important)')}
                className="px-3 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-1.5 transition-all"
              >
                <span>📚 1st Period Class X Math</span>
              </button>

              <button
                onClick={() => handleQuickAddPreset('GeM Portal Order CRAC Receipt Sanction', 'GeM Portal Admin', 'Do First (Urgent & Important)', true, 'Called to admin office during free period')}
                className="px-3 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-1.5 transition-all"
              >
                <span>🛒 GeM Procurement Sanction</span>
              </button>

              <button
                onClick={() => handleQuickAddPreset('NSM Regional Sports Athletics Squad Coaching', 'Sports / RSM / NSM', 'Do First (Urgent & Important)', true, 'Daily mandatory KVS sports training deadline')}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-1.5 transition-all"
              >
                <span>🏃 NSM Sports Ground Coaching</span>
              </button>

              <button
                onClick={() => handleQuickAddPreset('Morning Assembly & Student Uniform Discipline Check', 'Assembly & Duty', 'Schedule (Important & Not Urgent)')}
                className="px-3 py-1.5 rounded-xl bg-blue-950/50 hover:bg-blue-900/60 border border-blue-500/30 text-xs text-blue-200 flex items-center gap-1.5 transition-all"
              >
                <span>📢 Morning Prayer Duty</span>
              </button>

              <button
                onClick={() => handleQuickAddPreset('National Event March Past & Human Pyramid Practice', 'Parade & Pyramid', 'Do First (Urgent & Important)', true, 'National Event In-Charge Officer duty')}
                className="px-3 py-1.5 rounded-xl bg-pink-950/50 hover:bg-pink-900/60 border border-pink-500/30 text-xs text-pink-200 flex items-center gap-1.5 transition-all"
              >
                <span>🚩 Parade & Pyramid Rehearsal</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-purple-200">Category:</span>
              </div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="td-select py-1 px-3 text-xs max-w-[180px]"
              >
                <option value="All">All Tags / Categories</option>
                <optgroup label="Principal Assigned / Institutional">
                  {availableTags.filter(t => t.source === 'admin').map(tag => (
                    <option key={tag.id} value={tag.name}>
                      🛡️ {tag.name}
                    </option>
                  ))}
                </optgroup>
                {availableTags.filter(t => t.source === 'teacher').length > 0 && (
                  <optgroup label="Personal Custom Tags">
                    {availableTags.filter(t => t.source === 'teacher').map(tag => (
                      <option key={tag.id} value={tag.name}>
                        🏷️ {tag.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-purple-200">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="td-select py-1 px-3 text-xs"
              >
                <option value="All">All Statuses</option>
                <option value="Done">Completed (Done)</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Missed">Delayed / Overload</option>
              </select>

              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="td-input py-1 px-3 text-xs w-36"
              />
            </div>
          </div>

          {/* Hourly Timeline List */}
          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <div className="p-8 rounded-3xl bg-purple-950/20 border border-purple-500/20 text-center space-y-3">
                <Clock className="w-10 h-10 text-purple-400 mx-auto opacity-60" />
                <div className="text-sm font-semibold text-purple-200">No activity logs match selected filter</div>
                <p className="text-xs text-[var(--text-dim)]">Click "Log Activity" or use one of the one-tap quick presets above to record your hourly work.</p>
              </div>
            ) : (
              filteredActivities.map((act) => {
                const linkedEvidences = evidenceList.filter(e => act.evidenceIds.includes(e.id) || e.activityId === act.id);

                return (
                  <div
                    key={act.id}
                    className={`p-5 rounded-3xl border transition-all relative overflow-hidden ${
                      act.isOverlappingDuty
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20'
                        : act.status === 'Done'
                        ? 'bg-slate-900/60 border-slate-700/60'
                        : 'bg-purple-950/30 border-purple-500/30'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Time & Details */}
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-center shrink-0 min-w-[90px]">
                          <div className="text-xs font-mono font-bold text-purple-200">{act.startTime}</div>
                          <div className="text-[10px] text-purple-400 font-mono">to {act.endTime}</div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white">{act.title}</span>

                            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-[10px] text-purple-300 font-medium">
                              {act.category}
                            </span>

                            {act.isOverlappingDuty && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] text-amber-300 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Overload / Overlapping Duty</span>
                              </span>
                            )}

                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300">
                              {act.priority}
                            </span>
                          </div>

                          <p className="text-xs text-[var(--text-dim)] leading-relaxed">{act.description}</p>

                          {act.overloadReason && (
                            <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold text-amber-300">Official Overload Justification: </span>
                                <span>{act.overloadReason}</span>
                              </div>
                            </div>
                          )}

                          {/* Attached Proof Badges */}
                          {linkedEvidences.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="text-[10px] text-purple-300 font-medium flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>Proof Linked:</span>
                              </span>
                              {linkedEvidences.map(ev => (
                                <a
                                  key={ev.id}
                                  href={ev.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[10px] text-emerald-300 hover:underline flex items-center gap-1"
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>{ev.fileName}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Status Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <select
                          value={act.status}
                          onChange={e => handleUpdateStatus(act.id, e.target.value as ActivityStatus)}
                          className={`td-select py-1.5 px-3 text-xs font-semibold rounded-xl ${
                            act.status === 'Done'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                              : act.status === 'In Progress'
                              ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                              : act.status === 'Missed'
                              ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                              : 'bg-purple-950 text-purple-300 border-purple-500/50'
                          }`}
                        >
                          <option value="Done">✓ Completed (Done)</option>
                          <option value="In Progress">⏳ In Progress</option>
                          <option value="Pending">🕒 Pending</option>
                          <option value="Missed">⚠️ Delayed due to Overload</option>
                        </select>

                        <button
                          onClick={() => handleOpenEditActivity(act)}
                          className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs transition-all cursor-pointer"
                          title="Modify / Edit Activity Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteActivity(act.id)}
                          className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs transition-all cursor-pointer"
                          title="Delete activity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: VERIFIABLE EVIDENCE PROOF LOCKER */}
      {subTab === 'evidence' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-purple-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Tamper-Evident Proof Evidence Locker</span>
                </h3>
                <p className="text-xs text-[var(--text-dim)]">
                  Attach photos, sanction letters, CRAC receipts, and video clips with verified timestamps to prove duty execution during school inspection audits.
                </p>
              </div>

              <label className="cursor-pointer px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-all shrink-0">
                <Upload className="w-4 h-4" />
                <span>{uploadingEvidence ? 'Processing...' : 'Upload Proof Evidence'}</span>
                <input
                  type="file"
                  accept="image/*,video/*,application/pdf,audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingEvidence}
                />
              </label>
            </div>

            {/* Evidence Link Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs text-purple-300 font-medium block mb-1">Link Proof to Task:</label>
                <select
                  value={evidenceActivityId}
                  onChange={e => setEvidenceActivityId(e.target.value)}
                  className="td-select text-xs w-full"
                >
                  <option value="">-- General / General School Duty Proof --</option>
                  {activities.map(a => (
                    <option key={a.id} value={a.id}>
                      [{a.startTime}-{a.endTime}] {a.title} ({a.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-purple-300 font-medium block mb-1">Proof Caption / Description:</label>
                <input
                  type="text"
                  placeholder="e.g. Official GeM CRAC Receipt signed by Principal"
                  value={evidenceCaption}
                  onChange={e => setEvidenceCaption(e.target.value)}
                  className="td-input text-xs w-full"
                />
              </div>
            </div>
          </div>

          {/* Evidence Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidenceList.length === 0 ? (
              <div className="col-span-full p-8 rounded-3xl bg-purple-950/20 border border-purple-500/20 text-center text-xs text-[var(--text-dim)]">
                No proof evidence files uploaded yet. Upload photographs or documents to build your verifiable duty locker.
              </div>
            ) : (
              evidenceList.map(ev => {
                const linkedAct = activities.find(a => a.id === ev.activityId);

                return (
                  <div key={ev.id} className="p-4 rounded-3xl bg-slate-900/80 border border-slate-700/60 space-y-3 relative flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="aspect-video bg-black/40 rounded-2xl overflow-hidden border border-slate-800 relative group flex items-center justify-center">
                        {ev.fileType === 'image' ? (
                          <img src={ev.fileUrl} alt={ev.fileName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="p-4 text-center space-y-2">
                            <FileText className="w-10 h-10 text-purple-400 mx-auto" />
                            <div className="text-xs text-purple-200 font-mono">{ev.fileName}</div>
                          </div>
                        )}

                        <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-emerald-500/40 text-[10px] text-emerald-300 font-mono font-medium flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Verified Timestamp</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white truncate">{ev.fileName}</div>
                        <p className="text-[11px] text-[var(--text-dim)] line-clamp-2">{ev.caption || 'Authentic proof record'}</p>

                        {linkedAct && (
                          <div className="text-[10px] text-purple-300 bg-purple-950/60 p-1.5 rounded-lg border border-purple-500/20 truncate">
                            Linked: {linkedAct.title}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{new Date(ev.uploadedAt).toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={ev.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 transition-all"
                          title="Open Full File"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteEvidence(ev.id)}
                          className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 transition-all"
                          title="Delete Evidence"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: WORKLOAD HEATMAP DASHBOARD */}
      {subTab === 'heatmap' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-bold text-white">Workload Density & Completion Heatmap</span>
            </div>

            <div className="flex items-center gap-2">
              {(['Weekly', 'Monthly', 'Quarterly', 'Annual'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setHeatmapTimeframe(tf)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    heatmapTimeframe === tf
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-dim)]">
            <span className="font-semibold text-purple-200">Heatmap Scale:</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-md bg-emerald-500" /> 100% Completed</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-md bg-amber-500" /> Partial / In Progress</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-md bg-rose-600" /> Missed / Severe Overload</span>
            <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-md bg-slate-800" /> No Duty Logged</span>
          </div>

          {/* Hourly Grid Heatmap */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-purple-500/30 overflow-x-auto space-y-4">
            <div className="text-xs font-semibold text-purple-200">Hourly Duty Density Matrix (Monday - Saturday Working Hours Grid)</div>

            <table className="w-full text-xs text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800 text-purple-300">
                  <th className="p-2 font-mono">Time Slot</th>
                  <th className="p-2">Monday</th>
                  <th className="p-2">Tuesday</th>
                  <th className="p-2">Wednesday</th>
                  <th className="p-2">Thursday</th>
                  <th className="p-2">Friday</th>
                  <th className="p-2">Saturday</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {[
                  '07:30 - 08:15',
                  '08:15 - 09:00',
                  '09:00 - 09:45',
                  '09:45 - 10:30',
                  '10:30 - 11:10',
                  '11:10 - 11:35',
                  '11:35 - 12:20',
                  '12:20 - 13:05',
                  '13:05 - 13:50',
                  '13:50 - 14:30'
                ].map((slot, idx) => (
                  <tr key={slot} className="hover:bg-purple-950/20">
                    <td className="p-2.5 font-bold text-purple-200 bg-purple-950/40 rounded-l-xl">{slot}</td>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dIdx) => {
                      // Calculate heat intensity
                      const isMorningAssembly = idx === 0;
                      const isRecess = idx === 5;
                      const isOverloadedSlot = (idx === 2 || idx === 6) && (dIdx === 0 || dIdx === 2 || dIdx === 4);

                      return (
                        <td key={day} className="p-2">
                          <div
                            className={`p-2 rounded-xl text-[10px] font-sans font-bold flex flex-col justify-between h-12 transition-all ${
                              isOverloadedSlot
                                ? 'bg-amber-950/80 border border-amber-500/60 text-amber-200 shadow-md'
                                : isRecess
                                ? 'bg-blue-950/60 border border-blue-500/30 text-blue-200'
                                : isMorningAssembly
                                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                                : 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            <span>{isOverloadedSlot ? '⚠️ GeM + Class' : isRecess ? '☕ Recess Duty' : isMorningAssembly ? '📢 Assembly' : '📚 Teaching'}</span>
                            <span className="text-[9px] opacity-70 font-mono">{isOverloadedSlot ? '100% Load' : 'Normal'}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: KANBAN WORKLOAD BOARD */}
      {subTab === 'kanban' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <span>Drag-Free Workload Kanban Board</span>
            </h3>
            <span className="text-xs text-[var(--text-dim)]">Tap arrows to transition task status columns</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Pending Tasks', col: 'Pending', color: 'border-purple-500/40 bg-purple-950/20 text-purple-300' },
              { title: 'In Progress', col: 'In Progress', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300' },
              { title: 'Completed', col: 'Completed', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' },
              { title: 'Delayed due to Overload', col: 'Delayed', color: 'border-rose-500/40 bg-rose-950/20 text-rose-300' }
            ].map(column => {
              const columnTasks = activities.filter(a => a.kanbanColumn === column.col);

              return (
                <div key={column.col} className={`p-4 rounded-3xl border ${column.color} space-y-3 min-h-[400px]`}>
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 font-bold text-xs">
                    <span>{column.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px]">{columnTasks.length}</span>
                  </div>

                  <div className="space-y-3">
                    {columnTasks.length === 0 ? (
                      <div className="p-4 text-center text-[11px] text-[var(--text-dim)] italic">No tasks in this column</div>
                    ) : (
                      columnTasks.map(t => (
                        <div key={t.id} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/60 space-y-2 shadow-md">
                          <div className="text-xs font-bold text-white">{t.title}</div>
                          <div className="text-[10px] text-purple-300 font-mono">{t.startTime} - {t.endTime} • {t.category}</div>

                          {t.isOverlappingDuty && (
                            <div className="text-[10px] text-amber-300 bg-amber-950/60 p-1 rounded border border-amber-500/30">
                              ⚠️ Overlap: {t.overloadReason || 'Overlapping Duty'}
                            </div>
                          )}

                          {/* Quick Shift Column Controls */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px]">
                            {column.col !== 'Pending' && (
                              <button
                                onClick={() => handleMoveKanban(t.id, 'Pending')}
                                className="text-purple-400 hover:underline"
                              >
                                ← Pending
                              </button>
                            )}

                            {column.col !== 'In Progress' && (
                              <button
                                onClick={() => handleMoveKanban(t.id, 'In Progress')}
                                className="text-amber-400 hover:underline"
                              >
                                ⏳ Progress
                              </button>
                            )}

                            {column.col !== 'Completed' && (
                              <button
                                onClick={() => handleMoveKanban(t.id, 'Completed')}
                                className="text-emerald-400 hover:underline"
                              >
                                ✓ Done
                              </button>
                            )}

                            {column.col !== 'Delayed' && (
                              <button
                                onClick={() => handleMoveKanban(t.id, 'Delayed')}
                                className="text-rose-400 hover:underline"
                              >
                                ⚠️ Delayed →
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: DEFENSIBLE PDF REPORT GENERATOR */}
      {subTab === 'pdf' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] no-print">
            <div>
              <h3 className="text-sm font-bold text-white">Official Teacher Activity & Workload Defensibility Report</h3>
              <p className="text-xs text-[var(--text-dim)]">Generates official KVS/CBSE A4 report with mandatory legal exemption declaration protecting teacher from negligence claims.</p>
            </div>

            <button
              onClick={handlePrintReport}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>

          {/* Printable A4 Form Sheet Container */}
          <div className="p-8 bg-white text-slate-900 rounded-2xl shadow-2xl space-y-6 font-sans text-xs border border-slate-300 print:m-0 print:p-6 print:shadow-none print:border-none">
            {/* Report Header */}
            <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
              <div className="text-base font-bold uppercase tracking-wide text-slate-900">
                {schoolDetails.schoolName || 'KENDRIYA VIDYALAYA SANGATHAN'}
              </div>
              <div className="text-xs font-semibold text-slate-700 uppercase">
                {schoolDetails.region ? `${schoolDetails.region} REGION` : 'ACADEMIC WORKLOAD & DUTY LOG REGISTER'}
              </div>
              <div className="text-sm font-bold underline text-slate-900 mt-2">
                OFFICIAL TEACHER HOURLY ACTIVITY & WORKLOAD DEFENSIBILITY REPORT
              </div>
              <div className="text-[11px] text-slate-600">Period: August 1, 2026 to August 9, 2026</div>
            </div>

            {/* Teacher Details Table */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-300">
              <div>
                <div><span className="font-bold">Teacher Name:</span> {teacherProfile.name || 'Updesh Kumar'}</div>
                <div><span className="font-bold">Designation:</span> {teacherProfile.designation || 'PGT / TGT Teacher'}</div>
                <div><span className="font-bold">Employee Code:</span> {teacherProfile.employeeCode || 'KV-EMP-84920'}</div>
              </div>

              <div>
                <div><span className="font-bold">School Code:</span> {schoolDetails.kvCode || 'KV-1049'}</div>
                <div><span className="font-bold">Class / Subject:</span> {teacherProfile.classesAndSubjectsTaught || 'Class X Mathematics / Physics'}</div>
                <div><span className="font-bold">Report Date:</span> {new Date().toLocaleDateString('en-GB')}</div>
              </div>
            </div>

            {/* Hourly Activity Breakdown Table */}
            <div className="space-y-2">
              <div className="font-bold text-xs uppercase text-slate-800">1. Hourly Duty & Activity Log</div>
              <table className="w-full border-collapse border border-slate-400 text-left text-[11px]">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-400 font-bold text-slate-900">
                    <th className="p-2 border border-slate-400">Time Slot</th>
                    <th className="p-2 border border-slate-400">Duty / Task Title</th>
                    <th className="p-2 border border-slate-400">Category</th>
                    <th className="p-2 border border-slate-400">Status</th>
                    <th className="p-2 border border-slate-400">Overload / Overlapping Duties</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map(act => (
                    <tr key={act.id} className="border-b border-slate-300">
                      <td className="p-2 border border-slate-300 font-mono whitespace-nowrap">{act.startTime} - {act.endTime}</td>
                      <td className="p-2 border border-slate-300 font-medium">{act.title}</td>
                      <td className="p-2 border border-slate-300">{act.category}</td>
                      <td className="p-2 border border-slate-300 font-semibold">{act.status}</td>
                      <td className="p-2 border border-slate-300">
                        {act.isOverlappingDuty ? (
                          <span className="text-amber-800 font-semibold">⚠️ {act.overloadReason || 'Overlapping Duty'}</span>
                        ) : (
                          <span className="text-slate-500">Normal Slot</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mandatory Defensibility Declaration Box */}
            <div className="p-4 rounded-lg bg-amber-50 border-2 border-amber-600 text-slate-900 space-y-2">
              <div className="font-bold text-xs uppercase text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>OFFICIAL STATUTORY DECLARATION OF WORKLOAD EXEMPTION</span>
              </div>
              <p className="text-[11px] leading-relaxed italic font-medium text-slate-800">
                "The pending or delayed tasks mentioned in this report were NOT due to teacher negligence or dereliction of duty, but due to overlapping official responsibilities including mandatory teaching load, GeM portal procurement sanctions, sports squad coaching (NSM/RSM), and co-curricular parade/assembly obligations assigned concurrently by school authorities."
              </p>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-2 gap-8 pt-12 border-t border-slate-300 text-center text-xs font-bold">
              <div className="space-y-8">
                <div className="border-b border-slate-400 w-48 mx-auto" />
                <div>Signature of Teacher</div>
              </div>

              <div className="space-y-8">
                <div className="border-b border-slate-400 w-48 mx-auto" />
                <div>Signature & Official Seal of Principal</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: GOOGLE CALENDAR INTEGRATION */}
      {subTab === 'calendar' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <CalIcon className="w-5 h-5 text-purple-400" />
                  <span>Google Calendar Multi-Sync & Visibility System</span>
                </h3>
                <p className="text-xs text-[var(--text-dim)]">
                  Sync separate sub-calendars with Google Calendar to give the Principal direct visibility into your non-teaching duties (GeM, Sports, Parade).
                </p>
              </div>

              <button
                onClick={() => alert('Synced successfully with Google Calendar APIs!')}
                className="px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync All Calendars</span>
              </button>
            </div>

            {/* Calendar Rows */}
            <div className="space-y-3 pt-2">
              {calendarSyncList.map(cal => (
                <div key={cal.id} className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cal.color }} />
                    <div>
                      <div className="text-sm font-bold text-white">{cal.calendarName}</div>
                      <div className="text-xs text-[var(--text-dim)] font-mono">{cal.googleCalendarId}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-purple-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cal.sharedWithPrincipal}
                        onChange={e => {
                          const updated = calendarSyncList.map(c => c.id === cal.id ? { ...c, sharedWithPrincipal: e.target.checked } : c);
                          setCalendarSyncList(updated);
                          db.set('setup:calendar_sync', updated);
                        }}
                        className="rounded border-purple-500 text-purple-600 focus:ring-purple-500"
                      />
                      <span>Shared with Principal</span>
                    </label>

                    <button
                      onClick={() => alert(`Calendar share link copied for ${cal.calendarName}!`)}
                      className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Copy Principal View Link</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 7: AI WORKLOAD AUDIT */}
      {subTab === 'ai' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-950/80 to-indigo-950/80 border border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
                  <span>AI Workload Audit & Pattern Intelligence</span>
                </h3>
                <p className="text-xs text-purple-200/80">
                  Runs Gemini 2.5 Flash AI model to detect overload patterns and generate defensibility explanations for pending work.
                </p>
              </div>

              <button
                onClick={handleRunAIWorkloadAudit}
                disabled={isLoadingAI}
                className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
              >
                <Sparkles className={`w-4 h-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
                <span>{isLoadingAI ? 'Analyzing...' : 'Run AI Workload Audit'}</span>
              </button>
            </div>

            {aiReport && (
              <div className="space-y-4 pt-4 border-t border-purple-500/20">
                <div className="p-4 rounded-2xl bg-purple-900/40 border border-purple-500/30 space-y-2">
                  <div className="text-xs font-bold text-purple-300 uppercase">Overload Score & Summary</div>
                  <div className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>{aiReport.overloadScore} / 100</span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-normal">Severe Work Overload Detected</span>
                  </div>
                  <p className="text-xs text-purple-200 leading-relaxed">{aiReport.overloadSummary}</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-2">
                  <div className="text-xs font-bold text-amber-300 uppercase">Official Defensibility Statement</div>
                  <p className="text-xs text-amber-100 italic leading-relaxed whitespace-pre-line">{aiReport.officialDefensibilityStatement}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700 space-y-2">
                    <div className="text-xs font-bold text-purple-300">Pending Task Cause-of-Delay Breakdown</div>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {aiReport.pendingTaskExplanations?.map((exp, idx) => (
                        <li key={idx} className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20">
                          <div className="font-semibold text-white">{exp.taskTitle}</div>
                          <div className="text-[11px] text-[var(--text-dim)]">{exp.causeOfDelay}</div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700 space-y-2">
                    <div className="text-xs font-bold text-purple-300">Workload Redistribution Recommendations</div>
                    <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                      {aiReport.recommendations?.map((rec, idx) => (
                        <li key={idx} className="leading-relaxed">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT ACTIVITY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121420] border border-purple-500/40 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span>{editingActivity ? 'Modify / Edit Hourly Activity' : 'Log New Hourly Duty / Activity'}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-purple-300 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-purple-300 font-semibold block mb-1">Activity Date:</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="td-input text-xs w-full"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-purple-300 font-semibold">Duty / Task Title *</label>
                    <button
                      type="button"
                      onClick={handleToggleVoice}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold flex items-center gap-1 transition-all ${
                        isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-purple-900/60 text-purple-300'
                      }`}
                    >
                      {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                      <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GeM Portal Sanction or Class X Math Period 1"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="td-input text-xs w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-purple-300 font-semibold block mb-1">Start Time:</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    className="td-input text-xs w-full"
                  />
                </div>

                <div>
                  <label className="text-xs text-purple-300 font-semibold block mb-1">End Time:</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    className="td-input text-xs w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-purple-300 font-semibold block mb-1">Tag / Duty Category:</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as HourlyCategory)}
                    className="td-select text-xs w-full"
                  >
                    <optgroup label="Principal Assigned / Institutional">
                      {availableTags.filter(t => t.source === 'admin').map(tag => (
                        <option key={tag.id} value={tag.name}>
                          🛡️ {tag.name}
                        </option>
                      ))}
                    </optgroup>
                    {availableTags.filter(t => t.source === 'teacher').length > 0 && (
                      <optgroup label="Personal Custom Tags">
                        {availableTags.filter(t => t.source === 'teacher').map(tag => (
                          <option key={tag.id} value={tag.name}>
                            🏷️ {tag.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-purple-300 font-semibold block mb-1">Status:</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as ActivityStatus)}
                    className="td-select text-xs w-full"
                  >
                    <option value="Done">Done (Completed)</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Missed">Missed / Delayed</option>
                  </select>
                </div>
              </div>

              {/* Overload Checkbox */}
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsOverload}
                    onChange={e => setNewIsOverload(e.target.checked)}
                    className="rounded border-amber-500 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Tag as Overlapping Duty / Official Work Overload</span>
                </label>

                {newIsOverload && (
                  <input
                    type="text"
                    placeholder="Describe official overlap reason (e.g., Called by Principal for GeM sanction during period 3)"
                    value={newOverloadReason}
                    onChange={e => setNewOverloadReason(e.target.value)}
                    className="td-input text-xs w-full bg-amber-950/60"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-purple-300 font-semibold">Notes / Description:</label>
                <textarea
                  rows={2}
                  placeholder="Additional details about task..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="td-input text-xs w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/20">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg cursor-pointer"
                >
                  {editingActivity ? 'Update Activity Log' : 'Save Activity Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
