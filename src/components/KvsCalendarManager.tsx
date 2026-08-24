import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types/academic';
import { db, DEFAULT_CALENDAR } from '../lib/storage';
import { useActiveWorkingDate, getLocalTodayDateString } from '../lib/activeDateContext';
import { DevModeBadge } from './DevModeBadge';
import { Calendar as CalIcon, Search, Plus, Edit2, Trash2, Save, RotateCcw, CheckCircle, AlertCircle, Tag, Filter } from 'lucide-react';

interface KvsCalendarManagerProps {
  devMode: boolean;
  onSaved?: () => void;
}

export const KvsCalendarManager: React.FC<KvsCalendarManagerProps> = ({ devMode, onSaved }) => {
  const { activeDate } = useActiveWorkingDate();
  const [events, setEvents] = useState<CalendarEvent[]>(DEFAULT_CALENDAR);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent>({
    id: '',
    date: activeDate || getLocalTodayDateString(),
    title: 'KVS Activity',
    category: 'KVS Activity',
    description: '',
    templateRefPage: 50
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const saved = await db.get<CalendarEvent[]>('setup:calendar');
    if (saved) setEvents(saved);
    setLoading(false);
  };

  const handleSaveEvent = async () => {
    if (!editEvent.title.trim() || !editEvent.date) {
      alert('Title and Date are required.');
      return;
    }

    let updated = [...events];
    if (editEvent.id) {
      updated = updated.map(e => (e.id === editEvent.id ? editEvent : e));
    } else {
      updated.push({ ...editEvent, id: `cal-${Date.now()}` });
    }

    // Sort by date
    updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setEvents(updated);
    await db.set('setup:calendar', updated);
    setIsModalOpen(false);
    setMsg({ type: 'success', text: 'Calendar activity event saved.' });
    if (onSaved) onSaved();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Delete this calendar event?')) {
      const updated = events.filter(e => e.id !== id);
      setEvents(updated);
      await db.set('setup:calendar', updated);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset to default KVS Calendar of Activities (Page 50)?')) {
      setEvents(DEFAULT_CALENDAR);
      await db.set('setup:calendar', DEFAULT_CALENDAR);
      setMsg({ type: 'success', text: 'Reset to standard KVS activity calendar.' });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="p-8 text-center text-purple-300">Loading KVS Calendar...</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {devMode && (
        <DevModeBadge
          pages={50}
          title="Digitizes Template Page 50: Section 33 KVS Calendar of Activities & Holidays"
          fieldCount={events.length}
        />
      )}

      {msg && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
            msg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="td-card">
        <div className="td-card-head">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <CalIcon className="w-6 h-6" />
            </div>
            <div>
              <h3>33. KVS Calendar of Activities & Holidays</h3>
              <p className="text-xs text-[var(--text-dim)] m-0">
                Annual Vidyalaya activity schedule, gazetted holidays, and vacations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="td-btn-ghost text-xs py-2">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Auto-Fill KVS Calendar</span>
            </button>
            <button
              onClick={() => {
                setEditEvent({
                  id: '',
                  date: new Date().toISOString().split('T')[0],
                  title: '',
                  category: 'KVS Activity',
                  description: '',
                  templateRefPage: 50
                });
                setIsModalOpen(true);
              }}
              className="td-add-btn text-xs py-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-dim)]" />
            <input
              type="text"
              placeholder="Search activities, holidays, meetings..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[var(--glass-border)] bg-white/5 rounded-xl text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-300 shrink-0" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="py-2.5 px-3 border border-[var(--glass-border)] bg-white/5 rounded-xl text-xs text-[var(--text-main)]"
            >
              <option value="all">All Categories</option>
              <option value="KVS Activity">KVS Activity</option>
              <option value="Gazetted Holiday">Gazetted Holiday</option>
              <option value="Vacation">Vacation</option>
              <option value="Staff Meeting">Staff Meeting</option>
            </select>
          </div>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto">
          <table className="td-tt">
            <thead>
              <tr>
                <th className="text-left w-36">Scheduled Date</th>
                <th className="text-left">Activity / Event Title</th>
                <th className="w-36">Category</th>
                <th className="text-left">Details & Description</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="td-empty">
                    No matching calendar events found.
                  </td>
                </tr>
              ) : (
                filteredEvents.map(evt => (
                  <tr key={evt.id}>
                    <td className="text-left font-mono font-semibold text-purple-300">
                      {evt.date}
                    </td>
                    <td className="text-left font-semibold text-[var(--text-main)]">
                      {evt.title}
                    </td>
                    <td>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          evt.category === 'Gazetted Holiday'
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                            : evt.category === 'Vacation'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                            : evt.category === 'Staff Meeting'
                            ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                            : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {evt.category}
                      </span>
                    </td>
                    <td className="text-left text-xs text-[var(--text-dim)]">
                      {evt.description}
                    </td>
                    <td>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditEvent(evt);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300"
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

      {/* Event Modal */}
      {isModalOpen && (
        <div className="td-modal">
          <div className="td-modal-body">
            <div className="td-modal-head">
              <h2>{editEvent.id ? 'Edit Calendar Event' : 'Add Calendar Event'}</h2>
              <button onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div className="p-8 td-form">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Scheduled Date</label>
                  <input
                    type="date"
                    value={editEvent.date}
                    onChange={e => setEditEvent({ ...editEvent, date: e.target.value })}
                  />
                </div>
                <div>
                  <label>Category</label>
                  <select
                    value={editEvent.category}
                    onChange={e =>
                      setEditEvent({ ...editEvent, category: e.target.value as any })
                    }
                  >
                    <option value="KVS Activity">KVS Activity</option>
                    <option value="Gazetted Holiday">Gazetted Holiday</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Staff Meeting">Staff Meeting</option>
                    <option value="Subject Committee">Subject Committee</option>
                  </select>
                </div>
              </div>

              <div>
                <label>Event Title</label>
                <input
                  type="text"
                  value={editEvent.title}
                  onChange={e => setEditEvent({ ...editEvent, title: e.target.value })}
                  placeholder="e.g. Periodic Test 1 Window Begins"
                />
              </div>

              <div>
                <label>Details & Description</label>
                <textarea
                  rows={3}
                  value={editEvent.description}
                  onChange={e => setEditEvent({ ...editEvent, description: e.target.value })}
                  placeholder="Describe activities, instructions, or responsibilities..."
                />
              </div>
            </div>
            <div className="td-modal-foot">
              <button onClick={() => setIsModalOpen(false)} className="td-btn-ghost">
                Cancel
              </button>
              <button onClick={handleSaveEvent} className="td-add-btn">
                <Save className="w-4 h-4" />
                <span>Save Event</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
