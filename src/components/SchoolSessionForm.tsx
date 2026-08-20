import React, { useState, useEffect } from 'react';
import { SchoolDetails, AcademicSession } from '../types/academic';
import { db, DEFAULT_SCHOOL, DEFAULT_SESSIONS, getCurrentUser, setCurrentUser } from '../lib/storage';
import { DEFAULT_USER_ACCOUNTS } from '../lib/authDefaults';
import { UserAccount } from '../types/auth';
import { DevModeBadge } from './DevModeBadge';
import { Building2, Calendar, Save, RotateCcw, Plus, Trash2, Edit2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SchoolSessionFormProps {
  devMode: boolean;
  onSaved?: () => void;
}

export const SchoolSessionForm: React.FC<SchoolSessionFormProps> = ({ devMode, onSaved }) => {
  const [school, setSchool] = useState<SchoolDetails>(DEFAULT_SCHOOL);
  const [sessions, setSessions] = useState<AcademicSession[]>(DEFAULT_SESSIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New/edit session form modal state
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editSession, setEditSession] = useState<AcademicSession>({
    id: '',
    sessionName: '2026 - 2027',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    isActive: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const savedSchool = await db.get<SchoolDetails>('setup:school');
    if (savedSchool) setSchool(savedSchool);

    const savedSessions = await db.get<AcademicSession[]>('setup:sessions');
    if (savedSessions && savedSessions.length > 0) {
      setSessions(savedSessions);
    } else {
      setSessions(DEFAULT_SESSIONS);
    }
    setLoading(false);
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    // Validation
    if (!school.schoolName.trim()) {
      setMsg({ type: 'error', text: 'School Name is required.' });
      setSaving(false);
      return;
    }
    if (!school.kvCode.trim()) {
      setMsg({ type: 'error', text: 'KV / School Code is required.' });
      setSaving(false);
      return;
    }

    const success = await db.set('setup:school', school);
    if (success) {
      // Sync Admin user credentials across auth storage
      try {
        const usersList = (await db.get<UserAccount[]>('auth:users_list')) || DEFAULT_USER_ACCOUNTS;
        const updatedUsers = usersList.map(u => {
          if (u.role === 'admin' || u.id === 'user-admin-01') {
            return {
              ...u,
              name: school.principalName || u.name,
              designation: school.principalDesignation || u.designation || 'Principal I/c',
              email: school.officialEmail || u.email,
              phone: school.phoneNo || u.phone
            };
          }
          return u;
        });
        await db.set('auth:users_list', updatedUsers);

        const curr = await getCurrentUser();
        if (curr && (curr.role === 'admin' || curr.id === 'user-admin-01')) {
          const updatedCurr: UserAccount = {
            ...curr,
            name: school.principalName || curr.name,
            designation: school.principalDesignation || curr.designation || 'Principal I/c',
            email: school.officialEmail || curr.email,
            phone: school.phoneNo || curr.phone
          };
          await setCurrentUser(updatedCurr);
        }
      } catch (e) {
        console.error('Error syncing admin user account:', e);
      }

      // Broadcast global event so all components update instantly
      window.dispatchEvent(new CustomEvent('kvs-school-updated', { detail: school }));

      setSaving(false);
      setMsg({ type: 'success', text: 'Vidyalaya & Principal details saved and synced across the app!' });
      if (onSaved) onSaved();
      setTimeout(() => setMsg(null), 3500);
    } else {
      setSaving(false);
      setMsg({ type: 'error', text: 'Failed to save school details.' });
    }
  };

  const handleResetSchool = async () => {
    if (window.confirm('Reset School Details to default KVS template values?')) {
      setSchool(DEFAULT_SCHOOL);
      await db.set('setup:school', DEFAULT_SCHOOL);
      window.dispatchEvent(new CustomEvent('kvs-school-updated', { detail: DEFAULT_SCHOOL }));
      setMsg({ type: 'success', text: 'Reset to standard KVS school template.' });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleSaveSession = async () => {
    if (!editSession.sessionName.trim()) return;

    let updated = [...sessions];
    if (editSession.id) {
      updated = updated.map(s => (s.id === editSession.id ? editSession : s));
    } else {
      const newSess = { ...editSession, id: `sess-${Date.now()}` };
      updated.push(newSess);
    }

    setSessions(updated);
    await db.set('setup:sessions', updated);
    window.dispatchEvent(new CustomEvent('kvs-sessions-updated', { detail: updated }));
    setIsSessionModalOpen(false);
    setMsg({ type: 'success', text: 'Academic session updated.' });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleToggleActiveSession = async (id: string) => {
    const updated = sessions.map(s => ({
      ...s,
      isActive: s.id === id
    }));
    setSessions(updated);
    await db.set('setup:sessions', updated);

    // Sync active session name to school
    const activeOne = updated.find(s => s.isActive);
    if (activeOne) {
      const updatedSchool = { ...school, academicYear: activeOne.sessionName };
      setSchool(updatedSchool);
      await db.set('setup:school', updatedSchool);
      window.dispatchEvent(new CustomEvent('kvs-school-updated', { detail: updatedSchool }));
    }

    window.dispatchEvent(new CustomEvent('kvs-sessions-updated', { detail: updated }));
    setMsg({ type: 'success', text: `Active academic session switched to ${activeOne?.sessionName || ''}.` });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDeleteSession = async (id: string) => {
    if (sessions.length <= 1) {
      alert('At least one academic session must remain.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this session?')) {
      const updated = sessions.filter(s => s.id !== id);
      setSessions(updated);
      await db.set('setup:sessions', updated);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-purple-300">Loading Academic Setup...</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {devMode && (
        <DevModeBadge
          pages={[1, 3, 12]}
          title="Digitizes Front Cover, Inner Title & Bio-Data School Details (Section 7a, Items 17-18)"
          fieldCount={9}
        />
      )}

      {/* Notifications */}
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

      {/* School Information Card */}
      <div className="td-card">
        <div className="td-card-head">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3>Vidyalaya / School Profile</h3>
              <p className="text-xs text-[var(--text-dim)] m-0">
                Auto-populates headers on all 52 template diary pages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetSchool}
              className="td-btn-ghost text-xs py-2"
              title="Reset to default KVS School Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Auto-Fill KVS Default</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveSchool} className="td-form">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label>
                Vidyalaya / School Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={school.schoolName}
                onChange={e => setSchool({ ...school, schoolName: e.target.value })}
                placeholder="e.g. Kendriya Vidyalaya No. 1, Bhubaneswar"
                required
              />
              {devMode && <DevModeBadge pages={1} compact className="mt-1" />}
            </div>

            <div>
              <label>
                KV / School Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={school.kvCode}
                onChange={e => setSchool({ ...school, kvCode: e.target.value })}
                placeholder="e.g. KV-BBSR-1042"
                required
              />
              {devMode && <DevModeBadge pages={12} compact className="mt-1" />}
            </div>

            <div>
              <label>KVS Region / Zone</label>
              <input
                type="text"
                value={school.region}
                onChange={e => setSchool({ ...school, region: e.target.value })}
                placeholder="e.g. Bhubaneswar Region"
              />
            </div>

            <div>
              <label>Principal Name</label>
              <input
                type="text"
                value={school.principalName}
                onChange={e => setSchool({ ...school, principalName: e.target.value })}
                placeholder="e.g. Sh. HEMANANDA BARIK"
              />
            </div>

            <div>
              <label>Principal Designation</label>
              <input
                type="text"
                value={school.principalDesignation || ''}
                onChange={e => setSchool({ ...school, principalDesignation: e.target.value })}
                placeholder="e.g. Principal / Principal I/c"
              />
            </div>

            <div>
              <label>Vice Principal Name</label>
              <input
                type="text"
                value={school.vicePrincipalName}
                onChange={e => setSchool({ ...school, vicePrincipalName: e.target.value })}
                placeholder="e.g. Dr. Sunita Mohanty"
              />
            </div>

            <div>
              <label>Official Email</label>
              <input
                type="email"
                value={school.officialEmail}
                onChange={e => setSchool({ ...school, officialEmail: e.target.value })}
                placeholder="kv1bbsr@kvs.gov.in"
              />
            </div>

            <div>
              <label>Phone Number</label>
              <input
                type="text"
                value={school.phoneNo}
                onChange={e => setSchool({ ...school, phoneNo: e.target.value })}
                placeholder="+91 674 2540321"
              />
            </div>

            <div>
              <label>Website URL</label>
              <input
                type="text"
                value={school.website}
                onChange={e => setSchool({ ...school, website: e.target.value })}
                placeholder="https://no1bhubaneswar.kvs.ac.in"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-1">
              <label>Postal Address</label>
              <input
                type="text"
                value={school.address}
                onChange={e => setSchool({ ...school, address: e.target.value })}
                placeholder="Unit-IX, Bhoi Nagar, Bhubaneswar, Odisha - 751022"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[var(--glass-border)]">
            <button type="submit" disabled={saving} className="td-add-btn">
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Details...' : 'Save School Details'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Academic Session Card */}
      <div className="td-card">
        <div className="td-card-head">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3>Academic Sessions</h3>
              <p className="text-xs text-[var(--text-dim)] m-0">
                Select active session and manage academic year schedules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditSession({
                id: '',
                sessionName: '2026 - 2027',
                startDate: '2026-04-01',
                endDate: '2027-03-31',
                isActive: false
              });
              setIsSessionModalOpen(true);
            }}
            className="td-add-btn text-xs py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Session</span>
          </button>
        </div>

        {devMode && (
          <DevModeBadge
            pages={1}
            title="Auto-populates [Academic Session] field on Diary Title Page"
            compact
            className="mb-4"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map(sess => (
            <div
              key={sess.id}
              className={`p-5 rounded-2xl border transition-all ${
                sess.isActive
                  ? 'bg-purple-950/40 border-purple-500/60 shadow-[0_0_20px_rgba(165,148,249,0.15)]'
                  : 'bg-[rgba(255,255,255,0.02)] border-[var(--glass-border)]'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[var(--text-dim)] font-bold">
                    Session
                  </span>
                  <div className="font-serif text-xl font-bold text-[var(--text-main)]">
                    {sess.sessionName}
                  </div>
                </div>
                {sess.isActive ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <button
                    onClick={() => handleToggleActiveSession(sess.id)}
                    className="text-xs px-2.5 py-1 rounded-full bg-purple-900/40 hover:bg-purple-900/70 text-purple-300 border border-purple-500/30 transition-colors"
                  >
                    Set Active
                  </button>
                )}
              </div>

              <div className="text-xs text-[var(--text-dim)] space-y-1 mb-4 font-mono">
                <div>Start: {sess.startDate}</div>
                <div>End: {sess.endDate}</div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--glass-border)]">
                <button
                  onClick={() => {
                    setEditSession(sess);
                    setIsSessionModalOpen(true);
                  }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-purple-200 transition-colors"
                  title="Edit Session"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteSession(sess.id)}
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors"
                  title="Delete Session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Session Modal */}
      {isSessionModalOpen && (
        <div className="td-modal">
          <div className="td-modal-body">
            <div className="td-modal-head">
              <h2>{editSession.id ? 'Edit Session' : 'Add Academic Session'}</h2>
              <button onClick={() => setIsSessionModalOpen(false)}>✕</button>
            </div>

            <div className="p-8 td-form">
              <div>
                <label>Session Name / Year Range</label>
                <input
                  type="text"
                  value={editSession.sessionName}
                  onChange={e => setEditSession({ ...editSession, sessionName: e.target.value })}
                  placeholder="e.g. 2025 - 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={editSession.startDate}
                    onChange={e => setEditSession({ ...editSession, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label>End Date</label>
                  <input
                    type="date"
                    value={editSession.endDate}
                    onChange={e => setEditSession({ ...editSession, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={editSession.isActive}
                  onChange={e => setEditSession({ ...editSession, isActive: e.target.checked })}
                  className="w-4 h-4 text-purple-500 rounded focus:ring-purple-400"
                />
                <label htmlFor="activeCheck" className="normal-case text-sm text-[var(--text-main)] cursor-pointer">
                  Set as current active academic session
                </label>
              </div>
            </div>

            <div className="td-modal-foot">
              <button onClick={() => setIsSessionModalOpen(false)} className="td-btn-ghost">
                Cancel
              </button>
              <button onClick={handleSaveSession} className="td-add-btn">
                <Save className="w-4 h-4" />
                <span>Save Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
