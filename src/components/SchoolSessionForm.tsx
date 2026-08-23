import React, { useState, useEffect } from 'react';
import { SchoolDetails, AcademicSession } from '../types/academic';
import { db, DEFAULT_SCHOOL, DEFAULT_SESSIONS, getCurrentUser, setCurrentUser } from '../lib/storage';
import { DEFAULT_USER_ACCOUNTS } from '../lib/authDefaults';
import { UserAccount } from '../types/auth';
import { DevModeBadge } from './DevModeBadge';
import { KvsLogo } from './common/KvsLogo';
import { Building2, Calendar, Save, RotateCcw, Plus, Trash2, Edit2, CheckCircle, AlertCircle, RefreshCw, Upload, Image as ImageIcon, Sparkles, ExternalLink, X } from 'lucide-react';

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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSchool(prev => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setSchool(prev => ({ ...prev, logoUrl: undefined }));
  };

  const handleGenerateSubtitle = () => {
    const subtitle = `An autonomous body under the Ministry of Education, Government of India | KV Code: ${school.kvCode || '2218'}, CBSE Affiliation Number: ${school.cbseAffiliationNo || '1500052'}, CBSE School Code: ${school.cbseSchoolCode || '19133'}, UDISE Code: ${school.udiseCode || '21050903372'}`;
    setSchool(prev => ({ ...prev, bannerSubtitle: subtitle }));
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
          {/* Logo & Live Banner Branding Section */}
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white m-0">Vidyalaya / School Logo & Official Emblem</h4>
                  <p className="text-xs text-purple-200/70 m-0">Upload a custom school logo image or use the built-in KVS Sun Emblem</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{school.logoUrl ? 'Change Logo' : 'Upload School Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {school.logoUrl && (
                  <button
                    type="button"
                    onClick={handleClearLogo}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    title="Reset to Official KVS Emblem"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reset to KVS Emblem</span>
                  </button>
                )}
              </div>
            </div>

            {/* Logo Preview & Current Badge */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <KvsLogo logoUrl={school.logoUrl} size="lg" />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{school.logoUrl ? 'Custom Uploaded Logo Active' : 'Official KVS Rising Sun Vector Emblem Active'}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {school.logoUrl ? 'Custom Image' : 'Default Vector'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 m-0">
                  {school.logoUrl
                    ? 'Your custom school logo is displayed in the top navbar banner, printable diary exports, and dashboard.'
                    : 'High-detail vector emblem with Sanskrit motto "केन्द्रीय विद्यालय संगठन" is rendered automatically.'}
                </p>
              </div>
            </div>

            {/* Live Banner Preview in Light & Dark Mode */}
            <div className="space-y-2 pt-2 border-t border-purple-500/20">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                Live Navbar Banner Preview:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Light Mode Preview */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-[#00529b] via-[#0275d8] to-[#004b8d] border border-sky-400/40 shadow-md text-white">
                  <div className="text-[9px] font-bold text-sky-200 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Light Mode (Official KVS Blue)</span>
                    <span className="px-1 py-0.2 rounded bg-sky-400/30 text-[8px]">Day Mode</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <KvsLogo logoUrl={school.logoUrl} size="sm" isDark={false} />
                    <div className="min-w-0">
                      <div className="font-serif font-black text-xs text-white uppercase tracking-wide truncate">
                        {school.schoolName || 'Kendriya Vidyalaya Kutra'}
                      </div>
                      <div className="text-[10px] text-sky-100 line-clamp-1">
                        {school.bannerSubtitle || 'An autonomous body under the Ministry of Education, Government of India'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dark Mode Preview */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-[#0B0F19] via-[#121929] to-[#0B0F19] border border-indigo-500/40 shadow-md text-white">
                  <div className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Dark Mode (Midnight Indigo)</span>
                    <span className="px-1 py-0.2 rounded bg-indigo-500/30 text-[8px]">Night Mode</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <KvsLogo logoUrl={school.logoUrl} size="sm" isDark={true} />
                    <div className="min-w-0">
                      <div className="font-serif font-black text-xs bg-clip-text text-transparent bg-gradient-to-r from-indigo-100 via-purple-100 to-amber-200 uppercase tracking-wide truncate">
                        {school.schoolName || 'Kendriya Vidyalaya Kutra'}
                      </div>
                      <div className="text-[10px] text-slate-300 line-clamp-1">
                        {school.bannerSubtitle || 'An autonomous body under the Ministry of Education, Government of India'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label>
                Portal / App Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={school.portalName ?? "KVS Teacher's Diary"}
                onChange={e => setSchool({ ...school, portalName: e.target.value })}
                placeholder="e.g. KVS Teacher's Diary"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Customizes top-left app title across all user dashboards</span>
            </div>

            <div>
              <label>
                Vidyalaya / School Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={school.schoolName}
                onChange={e => setSchool({ ...school, schoolName: e.target.value })}
                placeholder="e.g. Kendriya Vidyalaya Kutra"
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
                placeholder="e.g. 2218"
                required
              />
              {devMode && <DevModeBadge pages={12} compact className="mt-1" />}
            </div>

            <div>
              <label>CBSE Affiliation Number</label>
              <input
                type="text"
                value={school.cbseAffiliationNo || ''}
                onChange={e => setSchool({ ...school, cbseAffiliationNo: e.target.value })}
                placeholder="e.g. 1500052"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">CBSE Affiliation No (Auto-included in banner)</span>
            </div>

            <div>
              <label>CBSE School Code</label>
              <input
                type="text"
                value={school.cbseSchoolCode || ''}
                onChange={e => setSchool({ ...school, cbseSchoolCode: e.target.value })}
                placeholder="e.g. 19133"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">CBSE School Code for exams and reports</span>
            </div>

            <div>
              <label>UDISE Code</label>
              <input
                type="text"
                value={school.udiseCode || ''}
                onChange={e => setSchool({ ...school, udiseCode: e.target.value })}
                placeholder="e.g. 21050903372"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">National UDISE+ identifier</span>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="m-0">Banner Statutory / Affiliation Subtitle</label>
                <button
                  type="button"
                  onClick={handleGenerateSubtitle}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Generate from KV & CBSE Codes</span>
                </button>
              </div>
              <textarea
                value={school.bannerSubtitle || ''}
                onChange={e => setSchool({ ...school, bannerSubtitle: e.target.value })}
                placeholder="An autonomous body under the Ministry of Education, Government of India | KV Code: 2218, CBSE Affiliation Number: 1500052, CBSE School Code: 19133, UDISE Code: 21050903372"
                rows={2}
                className="w-full text-xs font-sans p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                This subtitle is displayed in the main top header banner and official diary prints.
              </span>
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
