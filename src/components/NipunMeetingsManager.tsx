import React, { useState, useEffect } from 'react';
import { NipunMeetingRecord } from '../types/academic';
import { db, DEFAULT_NIPUN_MEETINGS } from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  FileText,
  Calendar,
  Plus,
  Save,
  Trash2,
  Edit2,
  CheckCircle2,
  ListTodo,
  BookOpen,
  Sparkles,
  Search,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';

interface NipunMeetingsManagerProps {
  devMode: boolean;
}

export default function NipunMeetingsManager({ devMode }: NipunMeetingsManagerProps) {
  const [meetings, setMeetings] = useState<NipunMeetingRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<NipunMeetingRecord | null>(null);

  // Form State
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formAgenda, setFormAgenda] = useState('');
  const [formDiscussion, setFormDiscussion] = useState('');
  const [formActionPoints, setFormActionPoints] = useState<string[]>(['']);
  const [formActionTaken, setFormActionTaken] = useState('');

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    const data = (await db.get<NipunMeetingRecord[]>('setup:nipun_meetings')) || DEFAULT_NIPUN_MEETINGS;
    setMeetings(data);
  };

  const handleSave = async () => {
    if (!formDate || !formAgenda) return;

    const filteredActionPoints = formActionPoints.filter(p => p.trim().length > 0);

    let updated: NipunMeetingRecord[];
    if (editingMeeting) {
      updated = meetings.map(m =>
        m.id === editingMeeting.id
          ? {
              ...m,
              date: formDate,
              agendaPoints: formAgenda,
              gistOfDiscussion: formDiscussion,
              actionPoints: filteredActionPoints,
              actionTaken: formActionTaken
            }
          : m
      );
    } else {
      const newRec: NipunMeetingRecord = {
        id: `nip-${Date.now()}`,
        date: formDate,
        agendaPoints: formAgenda,
        gistOfDiscussion: formDiscussion,
        actionPoints: filteredActionPoints,
        actionTaken: formActionTaken
      };
      updated = [newRec, ...meetings];
    }

    setMeetings(updated);
    await db.set('setup:nipun_meetings', updated);
    closeModal();
  };

  const handleDelete = async (id: string) => {
    const updated = meetings.filter(m => m.id !== id);
    setMeetings(updated);
    await db.set('setup:nipun_meetings', updated);
  };

  const openAdd = () => {
    setEditingMeeting(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormAgenda('');
    setFormDiscussion('');
    setFormActionPoints(['']);
    setFormActionTaken('');
    setIsModalOpen(true);
  };

  const openEdit = (m: NipunMeetingRecord) => {
    setEditingMeeting(m);
    setFormDate(m.date);
    setFormAgenda(m.agendaPoints);
    setFormDiscussion(m.gistOfDiscussion);
    setFormActionPoints(m.actionPoints.length > 0 ? m.actionPoints : ['']);
    setFormActionTaken(m.actionTaken);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMeeting(null);
  };

  const handleAddActionPoint = () => {
    setFormActionPoints([...formActionPoints, '']);
  };

  const handleActionPointChange = (index: number, val: string) => {
    const copy = [...formActionPoints];
    copy[index] = val;
    setFormActionPoints(copy);
  };

  const handleRemoveActionPoint = (index: number) => {
    setFormActionPoints(formActionPoints.filter((_, i) => i !== index));
  };

  const filteredMeetings = meetings.filter(
    m =>
      m.agendaPoints.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.gistOfDiscussion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.actionTaken.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {devMode && (
        <DevModeBadge
          pages={16}
          title="Record of Minutes of NIPUN / FLN Meetings (Module 16, Page 16)"
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>NIPUN Bharat / FLN Meeting Minutes & Directives</span>
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Official monthly FLN planning, Vidya Pravesh, Jadui Pitara deployment, and remedial reviews
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Meeting Record</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-purple-300/60" />
        <input
          type="text"
          placeholder="Search meeting date, agenda topics, discussion notes, or action items..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-purple-100 placeholder-purple-300/40 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Meeting Cards */}
      <div className="space-y-4">
        {filteredMeetings.map(m => (
          <div
            key={m.id}
            className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">
                    Meeting Date: {new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-indigo-300 font-mono">Official NIPUN Bharat Committee Review</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(m)}
                  className="p-2 hover:bg-white/10 text-indigo-300 rounded-lg transition-all"
                  title="Edit Minutes"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                  title="Delete Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                  Agenda Points & Objectives:
                </span>
                <p className="text-xs text-white/90 leading-relaxed m-0">{m.agendaPoints}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">
                  Gist of Discussion & Decisions:
                </span>
                <p className="text-xs text-purple-100/90 leading-relaxed m-0">{m.gistOfDiscussion}</p>
              </div>
            </div>

            {m.actionPoints && m.actionPoints.length > 0 && (
              <div className="p-3.5 rounded-xl bg-black/20 border border-white/5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>Key Action Points & Deliverables:</span>
                </span>
                <ul className="space-y-1 pl-4 m-0 text-xs text-white/80 list-disc">
                  {m.actionPoints.map((pt, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {m.actionTaken && (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                    Follow-Up Action Taken & Compliance:
                  </span>
                  <p className="text-xs text-emerald-100/90 leading-relaxed mt-0.5 m-0">{m.actionTaken}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredMeetings.length === 0 && (
          <div className="text-center py-12 text-purple-300/60 text-xs font-mono">
            No NIPUN meeting records found. Click "New Meeting Record" to add one.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="td-modal">
          <div className="td-modal-body max-w-xl">
            <div className="td-modal-head bg-indigo-950/80 border-b border-indigo-500/30">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-300" />
                <h3 className="text-base font-bold text-white">
                  {editingMeeting ? 'Edit NIPUN Meeting Minutes' : 'Record New NIPUN / FLN Meeting'}
                </h3>
              </div>
              <button onClick={closeModal} className="text-purple-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-[11px] font-semibold text-purple-300">Meeting Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full mt-1 p-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-purple-300">Agenda Points</label>
                <textarea
                  rows={2}
                  value={formAgenda}
                  onChange={e => setFormAgenda(e.target.value)}
                  placeholder="e.g. FLN target review, Jadui Pitara usage, Vidya Pravesh evaluation..."
                  className="w-full mt-1 p-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-purple-300">Gist of Discussion</label>
                <textarea
                  rows={3}
                  value={formDiscussion}
                  onChange={e => setFormDiscussion(e.target.value)}
                  placeholder="Summary of pedagogical deliberations, teacher feedback, and principal guidance..."
                  className="w-full mt-1 p-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-purple-300">Action Points (Deliverables)</label>
                  <button
                    type="button"
                    onClick={handleAddActionPoint}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Point
                  </button>
                </div>
                <div className="space-y-2">
                  {formActionPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={pt}
                        onChange={e => handleActionPointChange(idx, e.target.value)}
                        placeholder={`Action Item #${idx + 1}`}
                        className="flex-1 p-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                      />
                      {formActionPoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveActionPoint(idx)}
                          className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-purple-300">Action Taken (Follow-up)</label>
                <textarea
                  rows={2}
                  value={formActionTaken}
                  onChange={e => setFormActionTaken(e.target.value)}
                  placeholder="Report compliance, TLM kit distribution, or classroom implementations accomplished..."
                  className="w-full mt-1 p-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="td-modal-foot justify-end gap-2 bg-indigo-950/60 border-t border-indigo-500/30 p-4">
              <button onClick={closeModal} className="td-btn-ghost text-xs">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Save Minutes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
