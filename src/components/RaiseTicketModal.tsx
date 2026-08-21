import React, { useState, useEffect } from 'react';
import {
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketEvidence
} from '../types/academic';
import { UserAccount } from '../types/auth';
import { db, DEFAULT_TICKETS } from '../lib/storage';
import {
  X,
  Plus,
  Trash2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Sparkles,
  HelpCircle,
  Bug,
  Lightbulb,
  MessageSquare,
  Layout,
  Database,
  Paperclip,
  Eye
} from 'lucide-react';

interface RaiseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  currentTab?: string;
  onTicketCreated?: (newTicket: Ticket) => void;
}

const MODULE_OPTIONS = [
  'Dashboard',
  'Teacher Attendance & Leaves',
  'Student Enrollment & Daily Attendance',
  'Timetable Planner & Proxies',
  'Task Manager & Workload',
  'Lesson Plans (P-32)',
  'Assessment & Student Progress',
  'Result Analysis (VI-XII)',
  'Foundational & NIPUN Records',
  'Calendar & Vacations',
  'Supervisory Inspection & Review',
  'Master Reports & PDF Export',
  'Settings & Backup',
  'Other / General System'
];

export const RaiseTicketModal: React.FC<RaiseTicketModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentTab,
  onTicketCreated
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Bug / Glitch');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [moduleOrPage, setModuleOrPage] = useState('Dashboard');
  const [description, setDescription] = useState('');
  const [evidenceList, setEvidenceList] = useState<TicketEvidence[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewEvidence, setPreviewEvidence] = useState<TicketEvidence | null>(null);

  // Auto-map currentTab to a human-readable module name
  useEffect(() => {
    if (!currentTab) return;
    const tabLower = currentTab.toLowerCase();
    if (tabLower.includes('attendance') || tabLower.includes('leave')) {
      setModuleOrPage('Teacher Attendance & Leaves');
    } else if (tabLower.includes('enrollment') || tabLower.includes('student')) {
      setModuleOrPage('Student Enrollment & Daily Attendance');
    } else if (tabLower.includes('timetable')) {
      setModuleOrPage('Timetable Planner & Proxies');
    } else if (tabLower.includes('task') || tabLower.includes('workload')) {
      setModuleOrPage('Task Manager & Workload');
    } else if (tabLower.includes('lesson')) {
      setModuleOrPage('Lesson Plans (P-32)');
    } else if (tabLower.includes('assessment')) {
      setModuleOrPage('Assessment & Student Progress');
    } else if (tabLower.includes('result')) {
      setModuleOrPage('Result Analysis (VI-XII)');
    } else if (tabLower.includes('nipun') || tabLower.includes('scholastic') || tabLower.includes('monitoring')) {
      setModuleOrPage('Foundational & NIPUN Records');
    } else if (tabLower.includes('calendar')) {
      setModuleOrPage('Calendar & Vacations');
    } else if (tabLower.includes('inspection')) {
      setModuleOrPage('Supervisory Inspection & Review');
    } else if (tabLower.includes('report')) {
      setModuleOrPage('Master Reports & PDF Export');
    } else if (tabLower.includes('setting')) {
      setModuleOrPage('Settings & Backup');
    } else {
      setModuleOrPage('Dashboard');
    }
  }, [currentTab, isOpen]);

  if (!isOpen) return null;

  // Handle file uploads (Images & PDFs) converted to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      // Limit file size to ~5MB for local storage safety
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" is larger than 5MB. Please upload a smaller file or compressed image.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isImage = file.type.startsWith('image/');

        const newEvidence: TicketEvidence = {
          id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          fileName: file.name,
          fileType: isPdf ? 'pdf' : isImage ? 'image' : 'other',
          fileUrl: base64Url,
          uploadedAt: new Date().toISOString()
        };

        setEvidenceList(prev => [...prev, newEvidence]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const handleRemoveEvidence = (id: string) => {
    setEvidenceList(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a ticket title.');
      return;
    }
    if (!description.trim()) {
      alert('Please provide a detailed description of the feedback, bug, or request.');
      return;
    }

    try {
      setIsSubmitting(true);
      const existingTickets = (await db.get<Ticket[]>('setup:tickets')) || DEFAULT_TICKETS;

      const newTicketId = `tkt-${Date.now().toString().slice(-6)}`;
      const raisedByCode = currentUser?.employeeCode || currentUser?.id || '108894';
      const raisedByName = currentUser?.name || 'Staff User';

      const newTicket: Ticket = {
        id: newTicketId,
        title: title.trim(),
        category,
        priority,
        description: description.trim(),
        moduleOrPage,
        status: 'Open',
        evidence: evidenceList,
        raisedBy: raisedByCode,
        raisedByName,
        raisedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedTickets = [newTicket, ...existingTickets];
      await db.set('setup:tickets', updatedTickets);

      window.dispatchEvent(new CustomEvent('kvs-tickets-updated', { detail: newTicket }));
      if (onTicketCreated) onTicketCreated(newTicket);

      setMsg({ type: 'success', text: `Ticket #${newTicket.id} submitted successfully!` });

      setTimeout(() => {
        // Reset form
        setTitle('');
        setDescription('');
        setEvidenceList([]);
        setCategory('Bug / Glitch');
        setPriority('Medium');
        setMsg(null);
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error submitting ticket:', err);
      setMsg({ type: 'error', text: 'Failed to save ticket. Please try again.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl relative my-8 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-600/30 border border-purple-500/50 text-purple-300">
                <HelpCircle className="w-5 h-5" />
              </span>
              <h3 className="text-base font-black text-white m-0 flex items-center gap-2">
                <span>Raise Ticket / Feedback & Bug Report</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 m-0">
              Submit feedback, feature requests, or report system glitches directly to the Principal & Developer Desk.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {msg && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
              msg.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/90 border-rose-500/50 text-rose-300'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Info Strip */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Raised By:</span>
              <strong className="text-white font-bold">{currentUser?.name || 'Staff User'}</strong>
              <span className="text-purple-300 font-mono text-[11px]">
                ({currentUser?.employeeCode || '108894'} &bull; {currentUser?.designation || 'Faculty'})
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Status: <strong className="text-emerald-400">Open (New)</strong>
            </span>
          </div>

          {/* Ticket Title */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Ticket Title / Summary *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Issue with period 3 proxy assignment / Feature request for custom holiday colors"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Category, Priority & Module Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TicketCategory)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
              >
                <option value="Bug / Glitch">🐞 Bug / Glitch</option>
                <option value="Feature Request">💡 Feature Request</option>
                <option value="Feedback">💬 General Feedback</option>
                <option value="UI/UX Issue">🎨 UI/UX Layout Issue</option>
                <option value="Data Issue">📊 Data / Calculation Issue</option>
                <option value="Other">📌 Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Priority Level *
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TicketPriority)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
              >
                <option value="Low">🟢 Low (Routine / Nice to have)</option>
                <option value="Medium">🟡 Medium (Normal priority)</option>
                <option value="High">🟠 High (Impacting daily work)</option>
                <option value="Critical">🔴 Critical (Blocking operations)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Module / Page Context
              </label>
              <select
                value={moduleOrPage}
                onChange={e => setModuleOrPage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
              >
                {MODULE_OPTIONS.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Detailed Description & Steps to Reproduce *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe the issue in detail. If reporting a bug, what happened vs what you expected? Mention any specific class, student, or teacher involved..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none font-sans"
            />
          </div>

          {/* Evidence Attachments (Images / PDFs) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-purple-400" />
                <span>Attach Evidence / Screenshots / PDF Documents</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {evidenceList.length} attachment(s) added
              </span>
            </div>

            {/* Upload Drop Zone */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-dashed border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Upload Screenshot or File</div>
                  <div className="text-[10px] text-slate-400">PNG, JPG, WebP, or PDF (up to 5MB)</div>
                </div>
              </div>

              <label className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                <span>Browse Files</span>
                <input
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/webp, application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Evidence Preview List */}
            {evidenceList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {evidenceList.map(ev => (
                  <div
                    key={ev.id}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 group relative"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {ev.fileType === 'image' ? (
                        <img
                          src={ev.fileUrl}
                          alt={ev.fileName}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-700 cursor-pointer"
                          onClick={() => setPreviewEvidence(ev)}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-300 font-bold text-[10px]">
                          PDF
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-white truncate">{ev.fileName}</div>
                        <div className="text-[9px] text-slate-400 uppercase font-mono">{ev.fileType}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {ev.fileType === 'image' && (
                        <button
                          type="button"
                          onClick={() => setPreviewEvidence(ev)}
                          className="p-1 text-slate-400 hover:text-purple-300 rounded cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(ev.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Ticket'}</span>
            </button>
          </div>
        </form>

        {/* Image Preview Modal */}
        {previewEvidence && (
          <div className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4">
            <div className="relative max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{previewEvidence.fileName}</span>
                <button
                  onClick={() => setPreviewEvidence(null)}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <img
                src={previewEvidence.fileUrl}
                alt={previewEvidence.fileName}
                className="max-h-[75vh] w-auto mx-auto rounded-xl object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
