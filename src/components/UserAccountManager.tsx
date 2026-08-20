import React, { useState, useEffect } from 'react';
import {
  UserAccount,
  UserRole,
  TeacherDesignation,
  ClassSubjectAssignment,
  getRoleBadgeInfo,
  getStageCategory
} from '../types/auth';
import { getUserAccounts, saveUserAccount, deleteUserAccount } from '../lib/storage';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Plus,
  X,
  Lock,
  Mail,
  Award,
  Sparkles,
  Search,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';

const ALL_CLASSES = [
  'Balvatika-1', 'Balvatika-2', 'Balvatika-3',
  'I', 'II', 'III', 'IV', 'V',
  'VI', 'VII', 'VIII',
  'IX', 'X',
  'XI', 'XII'
];

const SECTIONS = ['A', 'B', 'C', 'D'];

const STANDARD_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Science',
  'General Science',
  'English',
  'Hindi',
  'Sanskrit',
  'Social Science',
  'History',
  'Geography',
  'Economics',
  'Computer Science',
  'Informatics Practices',
  'Artificial Intelligence (AI)',
  'Environmental Studies (EVS)',
  'Physical & Health Education (PHE)',
  'Art Education',
  'Work Education'
];

const DESIGNATIONS: TeacherDesignation[] = [
  'Principal',
  'Vice-Principal',
  'Academic Incharge',
  'PGT',
  'TGT',
  'PRT',
  'Balvatika Teacher',
  'Data Entry Manager',
  'Special Educator',
  'Activity / PET / Librarian'
];

interface UserAccountManagerProps {
  currentUserId: string;
}

export function UserAccountManager({ currentUserId }: UserAccountManagerProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<UserAccount>>({
    name: '',
    email: '',
    password: 'teacher',
    role: 'teacher',
    designation: 'TGT',
    employeeCode: '',
    department: '',
    assignments: [],
    assignedClasses: [],
    assignedSubjects: [],
    isClassTeacherOf: '',
    phone: '',
    isActive: true
  });

  // Dynamic Assignment Row Form
  const [newAssignmentClass, setNewAssignmentClass] = useState('IX');
  const [newAssignmentSection, setNewAssignmentSection] = useState('A');
  const [newAssignmentSubject, setNewAssignmentSubject] = useState('Mathematics');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const list = await getUserAccounts();
    setUsers(list);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      id: `user-${Date.now()}`,
      name: '',
      email: '',
      password: 'teacher',
      role: 'teacher',
      designation: 'TGT',
      employeeCode: `KV-${Math.floor(10000 + Math.random() * 90000)}`,
      department: 'Department of Science & Mathematics',
      assignments: [
        { id: `as-${Date.now()}-1`, className: 'IX', section: 'A', subject: 'Mathematics', stage: 'secondary' }
      ],
      assignedClasses: ['IX-A'],
      assignedSubjects: ['Mathematics'],
      isClassTeacherOf: '',
      phone: '',
      isActive: true,
      createdAt: new Date().toISOString()
    });
    setIsModalOpen(true);
    setSaveSuccessMsg('');
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      ...user,
      assignments: user.assignments || []
    });
    setIsModalOpen(true);
    setSaveSuccessMsg('');
  };

  const handleAddAssignment = () => {
    const classSec = `${newAssignmentClass}-${newAssignmentSection}`;
    const stage = getStageCategory(newAssignmentClass);
    const newAs: ClassSubjectAssignment = {
      id: `as-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      className: newAssignmentClass,
      section: newAssignmentSection,
      subject: newAssignmentSubject,
      stage
    };

    const currentAssignments = formData.assignments || [];
    const updatedAssignments = [...currentAssignments, newAs];

    // Recompute unique classes & subjects
    const uniqueClasses = Array.from(new Set(updatedAssignments.map(a => `${a.className}-${a.section}`)));
    const uniqueSubjects = Array.from(new Set(updatedAssignments.map(a => a.subject)));

    setFormData({
      ...formData,
      assignments: updatedAssignments,
      assignedClasses: uniqueClasses,
      assignedSubjects: uniqueSubjects
    });
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    const currentAssignments = formData.assignments || [];
    const updatedAssignments = currentAssignments.filter(a => a.id !== assignmentId);
    const uniqueClasses = Array.from(new Set(updatedAssignments.map(a => `${a.className}-${a.section}`)));
    const uniqueSubjects = Array.from(new Set(updatedAssignments.map(a => a.subject)));

    setFormData({
      ...formData,
      assignments: updatedAssignments,
      assignedClasses: uniqueClasses,
      assignedSubjects: uniqueSubjects
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.email?.trim()) return;

    const userToSave: UserAccount = {
      id: formData.id || `user-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password || 'teacher',
      role: formData.role || 'teacher',
      designation: formData.designation || 'TGT',
      employeeCode: formData.employeeCode || `KV-EMP-${Date.now().toString().slice(-5)}`,
      department: formData.department || '',
      assignments: formData.assignments || [],
      assignedClasses: formData.assignedClasses || [],
      assignedSubjects: formData.assignedSubjects || [],
      isClassTeacherOf: formData.isClassTeacherOf || undefined,
      phone: formData.phone || '',
      isActive: formData.isActive !== false,
      createdAt: formData.createdAt || new Date().toISOString()
    };

    const updatedList = await saveUserAccount(userToSave);
    setUsers(updatedList);
    setIsModalOpen(false);
    setSaveSuccessMsg(`Staff account for ${userToSave.name} updated successfully!`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleDelete = async (userId: string, name: string) => {
    if (userId === currentUserId) {
      alert('You cannot delete your own active administrator account.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove the staff account for "${name}"?`)) {
      const updated = await deleteUserAccount(userId);
      setUsers(updated);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.designation && u.designation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.assignedSubjects && u.assignedSubjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Admin Console · Staff & Subject Allocation
            </span>
          </div>
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <span>Staff Account Directory & Dynamic Class-Subject Allocation</span>
          </h2>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Manage teacher logins, designations (PGT/TGT/PRT), and flexibly assign any subjects and classes across Balvatika to Class XII.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Staff Account</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Toolbar Search & Filter */}
      <div className="p-4 rounded-2xl bg-purple-950/40 border border-[var(--glass-border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, code, subject..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[var(--text-dim)] font-medium">Filter Role:</span>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white font-semibold focus:outline-none"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="admin">Admin ({users.filter(u => u.role === 'admin').length})</option>
            <option value="data_entry_manager">Data Entry Manager ({users.filter(u => u.role === 'data_entry_manager').length})</option>
            <option value="teacher">Teachers ({users.filter(u => u.role === 'teacher').length})</option>
          </select>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => {
          const badge = getRoleBadgeInfo(user.role, user.designation);

          return (
            <div
              key={user.id}
              className="p-5 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-lg flex flex-col justify-between gap-4 hover:border-purple-500/40 transition-all group"
            >
              <div className="space-y-3">
                {/* Top Info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white font-serif shadow-md">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{user.name}</h3>
                      <div className="text-[11px] font-mono text-purple-300">{user.employeeCode}</div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border} shrink-0`}>
                    {badge.icon} {badge.label}
                  </span>
                </div>

                {/* Contact & Meta */}
                <div className="text-xs space-y-1 text-[var(--text-dim)]">
                  <div className="truncate">📧 <span className="font-mono text-white">{user.email}</span></div>
                  {user.phone && <div>📞 <span className="text-white">{user.phone}</span></div>}
                  {user.isClassTeacherOf && (
                    <div className="text-emerald-400 font-semibold">
                      ⭐ Class Teacher of: <strong>{user.isClassTeacherOf}</strong>
                    </div>
                  )}
                </div>

                {/* Dynamic Assignments Preview */}
                {user.role === 'teacher' && (
                  <div className="pt-2 border-t border-[var(--glass-border)] space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                      Assigned Classes & Subjects ({user.assignments?.length || 0}):
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                      {user.assignments && user.assignments.length > 0 ? (
                        user.assignments.map((as, idx) => (
                          <span
                            key={as.id || idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-950/60 text-purple-200 border border-purple-500/20 flex items-center gap-1"
                          >
                            <strong className="text-amber-300">{as.className}-{as.section}</strong>: {as.subject}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">No specific classes assigned yet</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[var(--glass-border)] flex items-center justify-between text-xs">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${user.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {user.isActive ? 'Active Account' : 'Suspended'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(user)}
                    className="p-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-purple-200 hover:text-white cursor-pointer"
                    title="Edit user details & class allocations"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(user.id, user.name)}
                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 hover:text-white cursor-pointer"
                    title="Remove user account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-[var(--glass-border)] rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-6">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-4">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <span>{editingUser ? `Edit Staff Account: ${editingUser.name}` : 'Register New Staff Account'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 text-xs">
              {/* Core Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[var(--text-dim)] mb-1 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Updesh Kumar"
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-dim)] mb-1 font-medium">Email Address (Login ID) *</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. updesh.teacher@kvs.edu"
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-dim)] mb-1 font-medium">Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode || ''}
                    onChange={e => setFormData({ ...formData, employeeCode: e.target.value })}
                    placeholder="e.g. KV-PGT-84920"
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* Role & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20">
                <div>
                  <label className="block text-purple-200 mb-1 font-bold">Role Level *</label>
                  <select
                    value={formData.role || 'teacher'}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500 font-bold"
                  >
                    <option value="admin">🏛️ Level 1: Admin (Principal / Incharge)</option>
                    <option value="data_entry_manager">📊 Level 2: Data Entry Manager</option>
                    <option value="teacher">👩‍🏫 Level 3: Teacher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-purple-200 mb-1 font-bold">Designation *</label>
                  <select
                    value={formData.designation || 'TGT'}
                    onChange={e => setFormData({ ...formData, designation: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500 font-semibold"
                  >
                    {DESIGNATIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-purple-200 mb-1 font-bold">Class Teacher Role</label>
                  <input
                    type="text"
                    value={formData.isClassTeacherOf || ''}
                    onChange={e => setFormData({ ...formData, isClassTeacherOf: e.target.value })}
                    placeholder="e.g. XII-A or X-B (Optional)"
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Dynamic Class & Subject Assignment Section */}
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-[var(--glass-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <span>Assigned Classes & Subjects (Cross-Stage Supported)</span>
                    </h4>
                    <p className="text-[11px] text-[var(--text-dim)]">
                      Assign any combination of classes (Class I to XII, Balvatika) and subjects to this teacher.
                    </p>
                  </div>
                </div>

                {/* Add Assignment Sub-Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-purple-950/50 border border-purple-500/30 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-purple-200 mb-1">Class</label>
                    <select
                      value={newAssignmentClass}
                      onChange={e => setNewAssignmentClass(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-purple-950/80 border border-[var(--glass-border)] text-white font-bold"
                    >
                      {ALL_CLASSES.map(c => (
                        <option key={c} value={c}>Class {c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-purple-200 mb-1">Section</label>
                    <select
                      value={newAssignmentSection}
                      onChange={e => setNewAssignmentSection(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-purple-950/80 border border-[var(--glass-border)] text-white font-bold"
                    >
                      {SECTIONS.map(s => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-purple-200 mb-1">Subject</label>
                    <select
                      value={newAssignmentSubject}
                      onChange={e => setNewAssignmentSubject(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-purple-950/80 border border-[var(--glass-border)] text-white font-bold"
                    >
                      {STANDARD_SUBJECTS.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAssignment}
                    className="w-full py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Class</span>
                  </button>
                </div>

                {/* List of Current Assignments */}
                <div className="space-y-1.5">
                  {formData.assignments && formData.assignments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {formData.assignments.map(as => (
                        <div
                          key={as.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                              {as.className}-{as.section}
                            </span>
                            <span className="text-white font-semibold">{as.subject}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAssignment(as.id)}
                            className="p-1 text-gray-400 hover:text-rose-400 cursor-pointer"
                            title="Remove this class allocation"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center rounded-lg bg-purple-950/10 border border-dashed border-[var(--glass-border)] text-gray-400">
                      No classes assigned yet. Use the selector above to assign subjects.
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[var(--text-dim)] mb-1 font-medium">Account Password</label>
                  <input
                    type="text"
                    value={formData.password || ''}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password (default: teacher)"
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-white font-semibold">
                    <input
                      type="checkbox"
                      checked={formData.isActive !== false}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-purple-500/40 bg-purple-950/60 text-purple-600 cursor-pointer"
                    />
                    <span>Account Active & Enabled</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--glass-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  {editingUser ? 'Update Staff Account' : 'Save New Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
