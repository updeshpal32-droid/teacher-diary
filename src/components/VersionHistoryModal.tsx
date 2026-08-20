import React, { useState, useEffect, useRef } from 'react';
import {
  AppDataSnapshot,
  AcademicSession
} from '../types/academic';
import {
  getSnapshotsHistory,
  saveSnapshot,
  restoreSnapshot,
  deleteSnapshot,
  exportAllHistoryJSON,
  exportSingleSnapshotJSON,
  importBackupJSON,
  db
} from '../lib/storage';
import {
  History,
  RotateCcw,
  Download,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  FileJson,
  X,
  Sparkles,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  Eye
} from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  onDataRestored
}) => {
  const [snapshots, setSnapshots] = useState<AppDataSnapshot[]>([]);
  const [activeSession, setActiveSession] = useState<string>('2025 - 2026 Term 1');
  const [availableSessions, setAvailableSessions] = useState<string[]>([
    '2025 - 2026 Term 1',
    '2025 - 2026 Term 2',
    '2026 - 2027 Term 1',
    'Historical Archives'
  ]);
  
  // Snapshot creation form state
  const [newLabel, setNewLabel] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preview state
  const [previewSnapshot, setPreviewSnapshot] = useState<AppDataSnapshot | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
      loadSessions();
    }
  }, [isOpen]);

  const loadSnapshots = async () => {
    const history = await getSnapshotsHistory();
    setSnapshots(history);
  };

  const loadSessions = async () => {
    const savedSessions = await db.get<AcademicSession[]>('setup:sessions');
    if (savedSessions && savedSessions.length > 0) {
      const active = savedSessions.find(s => s.isActive);
      if (active) {
        setActiveSession(`${active.sessionName} Term 1`);
      }
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    setIsCreating(true);
    try {
      await saveSnapshot(newLabel.trim(), activeSession, newNotes.trim());
      setNewLabel('');
      setNewNotes('');
      setMessage({ type: 'success', text: 'Snapshot revision saved successfully!' });
      await loadSnapshots();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save snapshot' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (snapshot: AppDataSnapshot) => {
    if (window.confirm(`Are you sure you want to restore "${snapshot.label}" to the active workspace?\n\nAn auto-backup of your current workspace will be created automatically.`)) {
      try {
        await restoreSnapshot(snapshot.id);
        setMessage({ type: 'success', text: `Restored "${snapshot.label}" to active workspace.` });
        await loadSnapshots();
        if (onDataRestored) {
          onDataRestored();
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Failed to restore snapshot' });
      }
    }
  };

  const handleDelete = async (snapshot: AppDataSnapshot) => {
    if (window.confirm(`Delete revision snapshot "${snapshot.label}" permanently?`)) {
      await deleteSnapshot(snapshot.id);
      setMessage({ type: 'success', text: 'Snapshot deleted from history.' });
      await loadSnapshots();
    }
  };

  const handleExportFull = async () => {
    await exportAllHistoryJSON();
    setMessage({ type: 'success', text: 'Full offline JSON backup downloaded.' });
  };

  const handleExportSingle = async (snapshotId: string) => {
    await exportSingleSnapshotJSON(snapshotId);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = await importBackupJSON(content);
        if (res.success) {
          setMessage({
            type: 'success',
            text: `Successfully imported backup (${res.importedSnapshotsCount} snapshot(s) loaded).`
          });
          await loadSnapshots();
          if (onDataRestored) {
            onDataRestored();
          }
        } else {
          setMessage({ type: 'error', text: res.error || 'Import failed.' });
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#121526] border border-purple-500/30 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/80 via-[#181B30] to-indigo-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Versioned Snapshot & Profile System</span>
                <span className="text-[10px] bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full border border-purple-400/30 uppercase font-mono font-bold">
                  v2.5 Revision Control
                </span>
              </h2>
              <p className="text-xs text-purple-300/70">
                Save, compare, restore, and backup timetable & academic revisions per Term/Session
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-purple-300/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Version History"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
            message.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/30'
              : 'bg-rose-950/80 text-rose-200 border-rose-500/30'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="hover:opacity-80">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Active Session & Quick Actions Toolbar */}
          <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Active Academic Session / Term</div>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={activeSession}
                    onChange={(e) => setActiveSession(e.target.value)}
                    className="bg-black/50 border border-purple-500/30 text-xs text-white rounded-lg px-3 py-1.5 font-semibold focus:outline-none focus:border-purple-400"
                  >
                    {availableSessions.map((sess) => (
                      <option key={sess} value={sess} className="bg-[#121526] text-white">
                        {sess}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Offline JSON Backup Safety Controls */}
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <button
                type="button"
                onClick={handleExportFull}
                className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Export full offline JSON backup containing active state and all snapshot history"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export All History (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Import offline JSON backup file"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-300" />
                <span>Import Backup (.json)</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>

          {/* Form: Create New Version Snapshot */}
          <form onSubmit={handleCreateSnapshot} className="bg-gradient-to-br from-purple-950/40 via-indigo-950/20 to-black/40 border border-purple-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Create New Version Snapshot</span>
              </h3>
              <span className="text-[11px] text-purple-300/60">
                Saves current live workspace state to history
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-purple-300/80 mb-1 font-semibold">
                  Snapshot Revision Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Term 1 Schedule - Revised after Staff Transfer"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-purple-300/80 mb-1 font-semibold">
                  Revision Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Swapped Period 2 P&HE with Class X-A Math"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isCreating || !newLabel.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isCreating ? 'Saving Snapshot...' : 'Save Current State as Snapshot'}</span>
              </button>
            </div>
          </form>

          {/* Revision History Snapshots Timeline List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Version History Revisions ({snapshots.length})</span>
              </h3>
              <span className="text-[11px] text-purple-300/60">
                Click "Restore as Active" to revert to any past snapshot
              </span>
            </div>

            {snapshots.length === 0 ? (
              <div className="bg-black/30 border border-purple-500/20 rounded-2xl p-8 text-center space-y-2">
                <Clock className="w-8 h-8 text-purple-400/40 mx-auto" />
                <p className="text-xs text-purple-300/70 font-semibold">No version snapshots created yet</p>
                <p className="text-[11px] text-purple-300/50 max-w-md mx-auto">
                  Click "Save Current State as Snapshot" above before making large schedule or profile changes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {snapshots.map((snap) => {
                  const summary = snap.dataCountSummary;
                  const isCurrent = snap.isCurrent;

                  return (
                    <div
                      key={snap.id}
                      className={`border rounded-2xl p-4 transition-all ${
                        isCurrent
                          ? 'bg-purple-950/50 border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                          : 'bg-black/40 border-purple-500/20 hover:border-purple-500/40'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white truncate">{snap.label}</span>
                            
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Active Workspace</span>
                              </span>
                            )}

                            {snap.sessionName && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {snap.sessionName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-[11px] text-purple-300/60 flex-wrap">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-purple-400" />
                              {new Date(snap.createdAt).toLocaleString('en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </span>

                            {snap.notes && (
                              <span className="italic text-purple-200/80">"{snap.notes}"</span>
                            )}
                          </div>

                          {/* Data item counts summary */}
                          {summary && (
                            <div className="flex items-center gap-2 pt-1 flex-wrap text-[10px] text-purple-300/80">
                              <span className="bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/20">
                                📅 {summary.timetableCount} Timetable Slots
                              </span>
                              <span className="bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/20">
                                👥 {summary.studentsCount} Students
                              </span>
                              <span className="bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/20">
                                📚 {summary.syllabusCount} Syllabus Items
                              </span>
                              <span className="bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/20">
                                📝 {summary.examsCount} Exam Plans
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Snapshot Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => setPreviewSnapshot(previewSnapshot?.id === snap.id ? null : snap)}
                            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/20 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Preview data content in snapshot"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-400" />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportSingle(snap.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/20 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Export single snapshot .json"
                          >
                            <FileJson className="w-3.5 h-3.5 text-amber-400" />
                            <span>Export</span>
                          </button>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleRestore(snap)}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                              title="Restore this snapshot into active workspace"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore as Active</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(snap)}
                            className="p-1.5 rounded-xl text-rose-400/70 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Preview Drawer */}
                      {previewSnapshot?.id === snap.id && (
                        <div className="mt-3 pt-3 border-t border-purple-500/20 bg-black/60 rounded-xl p-3 text-xs space-y-2 font-mono">
                          <div className="text-[11px] font-bold text-purple-300 flex items-center justify-between">
                            <span>RAW SNAPSHOT DATA SUMMARY</span>
                            <button onClick={() => setPreviewSnapshot(null)} className="text-purple-300/60 hover:text-white">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                            <div className="p-2 rounded bg-purple-950/40 border border-purple-500/20">
                              <div className="text-purple-300/60">School Info</div>
                              <div className="text-white font-bold">{snap.data?.['setup:school']?.schoolName || 'Configured'}</div>
                            </div>
                            <div className="p-2 rounded bg-purple-950/40 border border-purple-500/20">
                              <div className="text-purple-300/60">Teacher Name</div>
                              <div className="text-white font-bold">{snap.data?.['setup:teacher']?.name || 'Configured'}</div>
                            </div>
                            <div className="p-2 rounded bg-purple-950/40 border border-purple-500/20">
                              <div className="text-purple-300/60">Timetable Slots</div>
                              <div className="text-white font-bold">{snap.data?.['setup:timetable']?.length || 0} slots</div>
                            </div>
                            <div className="p-2 rounded bg-purple-950/40 border border-purple-500/20">
                              <div className="text-purple-300/60">Student Roster</div>
                              <div className="text-white font-bold">{snap.data?.['setup:students']?.length || 0} students</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-purple-500/20 bg-gradient-to-r from-purple-950/40 to-black/60 flex items-center justify-between shrink-0">
          <div className="text-xs text-purple-300/60 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Auto-backups are created before every restore operation.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
