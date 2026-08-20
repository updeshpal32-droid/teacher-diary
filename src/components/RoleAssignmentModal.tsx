import React, { useState, useEffect } from 'react';
import { UserAccount, ClassSubjectAssignment, StageCategory } from '../types/auth';
import { StaffDetailRecord, TeacherProfile, AcademicResponsibility, CustomRoleDefinition } from '../types/academic';
import {
  db,
  getUserAccounts,
  saveUserAccount,
  getCustomRoles,
  addCustomRole,
  updateCustomRole,
  deleteCustomRole,
  DEFAULT_KVS_ROLES,
  DEFAULT_TEACHER
} from '../lib/storage';
import { getTeacherScopedStorageKey, getTeacherProfileFromStaff } from '../lib/teacherContext';
import {
  Crown,
  BookOpen,
  Eye,
  FileCheck2,
  GraduationCap,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Edit,
  ShieldCheck,
  Award,
  Layers,
  Building2,
  Mic,
  UserPlus,
  Trophy,
  HeartPulse,
  Armchair,
  Settings,
  Check,
  Users2,
  Sparkles
} from 'lucide-react';

export type RoleAssignmentAction =
  | 'class_teacher'
  | 'co_class_teacher'
  | 'subject_teacher'
  | 'foundational_observer'
  | 'exam_incharge'
  | 'cbse_incharge'
  | 'office_incharge'
  | 'cla_incharge'
  | 'morning_assembly_incharge'
  | 'admission_incharge'
  | 'sports_incharge'
  | 'medical_incharge'
  | 'furniture_incharge'
  | 'incharge'
  | 'manage_roles'
  | 'overview';

interface RoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: RoleAssignmentAction;
  targetTeacherCode?: string;
  targetRoleId?: string;
}

const ALL_CLASSES = [
  'Balvatika-1', 'Balvatika-2', 'Balvatika-3',
  'I-A', 'II-A', 'III-A', 'IV-A', 'V-A',
  'VI-A', 'VII-A', 'VIII-A',
  'IX-A', 'X-A',
  'XI-A', 'XII-A'
];

const STANDARD_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Science',
  'English',
  'Hindi',
  'Sanskrit',
  'Social Science',
  'Computer Science / AI',
  'Environmental Studies (EVS)',
  'Physical & Health Education (P&HE)',
  'Art Education',
  'Work Education (W.E.)',
  'Music & Performing Arts',
  'Library Science',
  'Special Education / Inclusive Support'
];

export function RoleAssignmentModal({
  isOpen,
  onClose,
  initialAction = 'class_teacher',
  targetTeacherCode,
  targetRoleId
}: RoleAssignmentModalProps) {
  const [activeTab, setActiveTab] = useState<'class_teacher' | 'subject_teacher' | 'incharge' | 'manage_roles' | 'overview'>('class_teacher');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [staffList, setStaffList] = useState<StaffDetailRecord[]>([]);
  const [rolesList, setRolesList] = useState<CustomRoleDefinition[]>(DEFAULT_KVS_ROLES);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  // Class Teacher / Co-Class Teacher Form
  const [classTeacherType, setClassTeacherType] = useState<'primary_ct' | 'co_ct'>('primary_ct');
  const [selectedClassForCT, setSelectedClassForCT] = useState('X-A');

  // Subject Teacher Form
  const [subjectClass, setSubjectClass] = useState('IX-A');
  const [subjectName, setSubjectName] = useState('Mathematics');

  // Incharge Assignment Form
  const [selectedInchargeRoleId, setSelectedInchargeRoleId] = useState<string>('role-office-ic');
  const [inchargeLevel, setInchargeLevel] = useState<'In-Charge' | 'Convenor' | 'Member' | 'Coordinator'>('In-Charge');
  const [inchargeScope, setInchargeScope] = useState('School Wide (Vidyalaya Level)');
  const [inchargeKeyOutcomes, setInchargeKeyOutcomes] = useState('');

  // Role Management State (Create & Edit)
  const [isEditingRole, setIsEditingRole] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleCategory, setNewRoleCategory] = useState<CustomRoleDefinition['category']>('administrative');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleDefaultLevel, setNewRoleDefaultLevel] = useState<'In-Charge' | 'Convenor' | 'Member' | 'Coordinator'>('In-Charge');

  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      mapInitialActionToTab(initialAction, targetRoleId);
    }
  }, [isOpen, initialAction, targetTeacherCode, targetRoleId]);

  const mapInitialActionToTab = (action: RoleAssignmentAction, roleId?: string) => {
    if (action === 'class_teacher') {
      setActiveTab('class_teacher');
      setClassTeacherType('primary_ct');
    } else if (action === 'co_class_teacher') {
      setActiveTab('class_teacher');
      setClassTeacherType('co_ct');
    } else if (action === 'subject_teacher') {
      setActiveTab('subject_teacher');
    } else if (action === 'manage_roles') {
      setActiveTab('manage_roles');
    } else if (action === 'overview') {
      setActiveTab('overview');
    } else {
      setActiveTab('incharge');
      if (action === 'foundational_observer') setSelectedInchargeRoleId('role-fln-obs');
      else if (action === 'exam_incharge') setSelectedInchargeRoleId('role-exam-ic');
      else if (action === 'cbse_incharge') setSelectedInchargeRoleId('role-cbse-ic');
      else if (action === 'office_incharge') setSelectedInchargeRoleId('role-office-ic');
      else if (action === 'cla_incharge') setSelectedInchargeRoleId('role-cla-ic');
      else if (action === 'morning_assembly_incharge') setSelectedInchargeRoleId('role-assembly-ic');
      else if (action === 'admission_incharge') setSelectedInchargeRoleId('role-admission-ic');
      else if (action === 'sports_incharge') setSelectedInchargeRoleId('role-sports-ic');
      else if (action === 'medical_incharge') setSelectedInchargeRoleId('role-medical-ic');
      else if (action === 'furniture_incharge') setSelectedInchargeRoleId('role-furniture-ic');
      else if (roleId) setSelectedInchargeRoleId(roleId);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [userAccounts, staffRecords, customRoles] = await Promise.all([
      getUserAccounts(),
      db.get<StaffDetailRecord[]>('setup:staff_details') || [],
      getCustomRoles()
    ]);
    setUsers(userAccounts);
    setStaffList(staffRecords || []);
    setRolesList(customRoles);

    if (targetTeacherCode) {
      const match = userAccounts.find(u => u.employeeCode === targetTeacherCode);
      if (match) {
        setSelectedTeacherId(match.id);
      }
    } else if (userAccounts.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(userAccounts[0].id);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const activeUser = users.find(u => u.id === selectedTeacherId) || users[0];
  const selectedRoleDef = rolesList.find(r => r.id === selectedInchargeRoleId) || rolesList[0];

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // 1. Assign Class Teacher or Co-Class Teacher
  const handleAssignClassTeacher = async () => {
    if (!activeUser) return;
    setLoading(true);

    try {
      const isCoCT = classTeacherType === 'co_ct';
      const roleLabel = isCoCT ? 'Co-Class Teacher' : 'Class Teacher';

      const updatedUser: UserAccount = {
        ...activeUser,
        ...(isCoCT
          ? { isCoClassTeacherOf: selectedClassForCT }
          : { isClassTeacherOf: selectedClassForCT })
      };
      await saveUserAccount(updatedUser);

      const updatedStaff = staffList.map(s => {
        if (s.employeeCode === activeUser.employeeCode) {
          const remarkToAdd = `${roleLabel}: ${selectedClassForCT} (Session 2026-27).`;
          const prev = s.principalRemarks || '';
          return {
            ...s,
            principalRemarks: prev.includes(remarkToAdd) ? prev : `${remarkToAdd} ${prev}`.trim()
          };
        }
        return s;
      });
      await db.set('setup:staff_details', updatedStaff);

      const scopedKey = getTeacherScopedStorageKey('setup:teacher', activeUser.employeeCode);
      const existingProfile = await db.get<TeacherProfile>(scopedKey);
      if (existingProfile) {
        await db.set(scopedKey, {
          ...existingProfile,
          ...(isCoCT
            ? { coClassTeacherRole: `Co-Class Teacher ${selectedClassForCT}` }
            : { classTeacherRole: `Class Teacher ${selectedClassForCT}` })
        });
      } else {
        const staffRec = staffList.find(s => s.employeeCode === activeUser.employeeCode);
        const synth = staffRec ? getTeacherProfileFromStaff(staffRec, DEFAULT_TEACHER) : DEFAULT_TEACHER;
        await db.set(scopedKey, {
          ...synth,
          name: activeUser.name,
          employeeCode: activeUser.employeeCode,
          designation: activeUser.designation,
          ...(isCoCT
            ? { coClassTeacherRole: `Co-Class Teacher ${selectedClassForCT}` }
            : { classTeacherRole: `Class Teacher ${selectedClassForCT}` })
        });
      }

      await loadData();
      window.dispatchEvent(new CustomEvent('kvs-auth-changed', { detail: null }));
      window.dispatchEvent(new CustomEvent('kvs-active-teacher-changed', { detail: null }));
      showNotification(`Successfully assigned ${activeUser.name} as ${roleLabel} of Class ${selectedClassForCT}!`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 1b. Remove Class Teacher or Co-Class Teacher Assignment
  const handleRemoveClassTeacher = async (type: 'primary_ct' | 'co_ct') => {
    if (!activeUser) return;
    setLoading(true);

    try {
      const isCoCT = type === 'co_ct';
      const updatedUser: UserAccount = {
        ...activeUser,
        ...(isCoCT ? { isCoClassTeacherOf: undefined } : { isClassTeacherOf: undefined })
      };
      await saveUserAccount(updatedUser);

      const updatedStaff = staffList.map(s => {
        if (s.employeeCode === activeUser.employeeCode) {
          let remarks = s.principalRemarks || '';
          if (isCoCT) {
            remarks = remarks.replace(/Co-Class Teacher:\s*[^.;\n]+[.;]?/gi, '').replace(/Co-CT:\s*[^.;\n]+[.;]?/gi, '').trim();
          } else {
            remarks = remarks.replace(/Class Teacher:\s*[^.;\n]+[.;]?/gi, '').replace(/\bCT:\s*[^.;\n]+[.;]?/gi, '').trim();
          }
          return {
            ...s,
            principalRemarks: remarks
          };
        }
        return s;
      });
      await db.set('setup:staff_details', updatedStaff);

      const scopedKey = getTeacherScopedStorageKey('setup:teacher', activeUser.employeeCode);
      const existingProfile = await db.get<TeacherProfile>(scopedKey);
      if (existingProfile) {
        await db.set(scopedKey, {
          ...existingProfile,
          ...(isCoCT ? { coClassTeacherRole: '' } : { classTeacherRole: '' })
        });
      }

      await loadData();
      window.dispatchEvent(new CustomEvent('kvs-auth-changed', { detail: null }));
      window.dispatchEvent(new CustomEvent('kvs-active-teacher-changed', { detail: null }));
      showNotification(`Removed ${isCoCT ? 'Co-Class Teacher' : 'Class Teacher'} assignment from ${activeUser.name}.`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Assign Subject Teacher
  const handleAddSubjectAssignment = async () => {
    if (!activeUser) return;
    setLoading(true);

    try {
      const currentAssignments: ClassSubjectAssignment[] = activeUser.assignments || [];
      const isAlreadyAssigned = currentAssignments.some(
        a => a.className === subjectClass && a.subject === subjectName
      );

      if (isAlreadyAssigned) {
        showNotification(`${activeUser.name} is already assigned ${subjectName} in Class ${subjectClass}.`);
        setLoading(false);
        return;
      }

      const parts = subjectClass.split('-');
      const clsNum = parts[0];
      const sec = parts[1] || 'A';
      let stage: StageCategory = 'middle';
      if (clsNum.startsWith('Balvatika') || clsNum === 'I' || clsNum === 'II') stage = 'foundational';
      else if (clsNum === 'III' || clsNum === 'IV' || clsNum === 'V') stage = 'preparatory';
      else if (clsNum === 'VI' || clsNum === 'VII' || clsNum === 'VIII') stage = 'middle';
      else if (clsNum === 'IX' || clsNum === 'X') stage = 'secondary';
      else if (clsNum === 'XI' || clsNum === 'XII') stage = 'senior_secondary';

      const newAssignment: ClassSubjectAssignment = {
        id: `asg-${Date.now()}`,
        className: clsNum,
        section: sec,
        subject: subjectName,
        stage
      };

      const updatedAssignments = [...currentAssignments, newAssignment];
      const updatedClasses = Array.from(new Set([...(activeUser.assignedClasses || []), subjectClass]));
      const updatedSubjects = Array.from(new Set([...(activeUser.assignedSubjects || []), subjectName]));

      const updatedUser: UserAccount = {
        ...activeUser,
        assignments: updatedAssignments,
        assignedClasses: updatedClasses,
        assignedSubjects: updatedSubjects
      };
      await saveUserAccount(updatedUser);

      const scopedKey = getTeacherScopedStorageKey('setup:teacher', activeUser.employeeCode);
      const existingProfile = await db.get<TeacherProfile>(scopedKey);
      if (existingProfile) {
        const existingTaught = existingProfile.classesAndSubjectsTaught || [];
        if (!existingTaught.includes(`${subjectClass} - ${subjectName}`)) {
          await db.set(scopedKey, {
            ...existingProfile,
            classesAndSubjectsTaught: [...existingTaught, `${subjectClass} - ${subjectName}`]
          });
        }
      }

      await loadData();
      window.dispatchEvent(new CustomEvent('kvs-active-teacher-changed', { detail: null }));
      showNotification(`Assigned ${subjectName} (Class ${subjectClass}) to ${activeUser.name}!`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Remove Subject Assignment
  const handleRemoveSubjectAssignment = async (idx: number) => {
    if (!activeUser || !activeUser.assignments) return;
    setLoading(true);

    try {
      const updatedAssignments = activeUser.assignments.filter((_, i) => i !== idx);
      const updatedClasses = Array.from(new Set(updatedAssignments.map(a => a.className)));
      const updatedSubjects = Array.from(new Set(updatedAssignments.map(a => a.subject)));

      const updatedUser: UserAccount = {
        ...activeUser,
        assignments: updatedAssignments,
        assignedClasses: updatedClasses,
        assignedSubjects: updatedSubjects
      };
      await saveUserAccount(updatedUser);
      await loadData();
      showNotification('Subject assignment removed.');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 3. Assign Institutional Incharge / Portfolio
  const handleAssignInchargeRole = async () => {
    if (!activeUser || !selectedRoleDef) return;
    setLoading(true);

    try {
      const scopedKey = getTeacherScopedStorageKey('setup:teacher', activeUser.employeeCode);
      const profile = (await db.get<TeacherProfile>(scopedKey)) || {
        ...activeUser,
        academicResponsibilities: []
      };

      const newResp: AcademicResponsibility = {
        id: `resp-${Date.now()}`,
        dutyName: selectedRoleDef.name,
        role: inchargeLevel,
        levelOrClass: inchargeScope || 'School Wide',
        academicYear: '2026-27',
        keyOutcomes: inchargeKeyOutcomes || selectedRoleDef.description || 'Assigned official Vidyalaya portfolio.'
      };

      const existingResponsibilities = profile.academicResponsibilities || [];
      const filtered = existingResponsibilities.filter(r => r.dutyName !== selectedRoleDef.name);

      await db.set(scopedKey, {
        ...profile,
        academicResponsibilities: [newResp, ...filtered]
      });

      const updatedStaff = staffList.map(s => {
        if (s.employeeCode === activeUser.employeeCode) {
          const note = `${selectedRoleDef.name} (${inchargeLevel})`;
          const prev = s.principalRemarks || '';
          return {
            ...s,
            principalRemarks: prev.includes(note) ? prev : `${note}; ${prev}`.trim()
          };
        }
        return s;
      });
      await db.set('setup:staff_details', updatedStaff);

      await loadData();
      window.dispatchEvent(new CustomEvent('kvs-active-teacher-changed', { detail: null }));
      showNotification(`Assigned portfolio "${selectedRoleDef.name}" (${inchargeLevel}) to ${activeUser.name}!`);
      setInchargeKeyOutcomes('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 4. Role Management: Create / Add New Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      setLoading(true);
      const created = await addCustomRole({
        name: newRoleName.trim(),
        category: newRoleCategory,
        description: newRoleDescription.trim() || 'Official Vidyalaya committee/incharge portfolio.',
        defaultRoleLevel: newRoleDefaultLevel,
        isBuiltIn: false
      });
      setRolesList(created);
      setNewRoleName('');
      setNewRoleDescription('');
      showNotification(`Added new role "${newRoleName}" to the institutional list!`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4b. Role Management: Edit Role
  const handleUpdateRole = async (id: string) => {
    if (!newRoleName.trim()) return;

    try {
      setLoading(true);
      const updated = await updateCustomRole(id, {
        name: newRoleName.trim(),
        category: newRoleCategory,
        description: newRoleDescription.trim(),
        defaultRoleLevel: newRoleDefaultLevel
      });
      setRolesList(updated);
      setIsEditingRole(null);
      setNewRoleName('');
      setNewRoleDescription('');
      showNotification('Updated role definition successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4c. Role Management: Delete Role
  const handleDeleteRole = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove the role "${name}" from the system?`)) return;

    try {
      setLoading(true);
      const updated = await deleteCustomRole(id);
      setRolesList(updated);
      showNotification(`Removed role "${name}" from the list.`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditRole = (role: CustomRoleDefinition) => {
    setIsEditingRole(role.id);
    setNewRoleName(role.name);
    setNewRoleCategory(role.category);
    setNewRoleDescription(role.description);
    setNewRoleDefaultLevel(role.defaultRoleLevel || 'In-Charge');
  };

  const cancelEditRole = () => {
    setIsEditingRole(null);
    setNewRoleName('');
    setNewRoleDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md border border-emerald-400/30">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white leading-none">
                  KVS Samagam: Staff Role Allocation Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  2026-27
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Assign Class Teachers, Co-Class Teachers, Subject Teachers &amp; Institutional Incharges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notification Banner */}
        {successMsg && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/50 px-4 py-2 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Tab Navigation */}
        <div className="flex items-center gap-1.5 p-2 bg-slate-950 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('class_teacher')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'class_teacher'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Assign Class / Co-Class Teacher</span>
          </button>

          <button
            onClick={() => setActiveTab('subject_teacher')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'subject_teacher'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-300" />
            <span>Assign Subject Teacher</span>
          </button>

          <button
            onClick={() => setActiveTab('incharge')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'incharge'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Assign Incharge Roles ({rolesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('manage_roles')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'manage_roles'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-indigo-300" />
            <span>Manage Roles List</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-300" />
            <span>Master Matrix</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* Teacher Selector Bar (Visible for assignment tabs) */}
          {activeTab !== 'overview' && activeTab !== 'manage_roles' && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Select Faculty Member to Allocate Role:</span>
                <span className="text-[11px] text-purple-300 font-mono">
                  {users.length} Total Staff
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.designation} (#{u.employeeCode})
                    </option>
                  ))}
                </select>

                {activeUser && (
                  <div className="px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs flex-wrap gap-1.5">
                    <div>
                      <span className="font-bold text-white">{activeUser.name}</span>
                      <span className="text-slate-400 text-[11px] block">{activeUser.designation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {activeUser.isClassTeacherOf ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          ⭐ CT: {activeUser.isClassTeacherOf}
                        </span>
                      ) : null}
                      {activeUser.isCoClassTeacherOf ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          🤝 Co-CT: {activeUser.isCoClassTeacherOf}
                        </span>
                      ) : null}
                      {!activeUser.isClassTeacherOf && !activeUser.isCoClassTeacherOf && (
                        <span className="text-[10px] text-slate-500">No CT Assigned</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: ASSIGN CLASS TEACHER / CO-CLASS TEACHER */}
          {activeTab === 'class_teacher' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Class Teacher &amp; Co-Class Teacher Allocation</span>
                  </div>
                  <span className="text-[11px] text-teal-200/80 font-semibold">
                    KVS Vidyalaya Dual-Teacher Oversight
                  </span>
                </div>

                {/* Sub-Role Selector: Primary CT vs Co-CT */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Select Responsibility Type to Assign:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setClassTeacherType('primary_ct')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        classTeacherType === 'primary_ct'
                          ? 'bg-amber-950/50 border-amber-500/70 text-white shadow-lg ring-1 ring-amber-400/50'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        classTeacherType === 'primary_ct' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Crown className="w-4 h-4 font-bold" />
                      </div>
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span>Primary Class Teacher (CT)</span>
                          {classTeacherType === 'primary_ct' && <span className="text-amber-400 text-[10px]">● Active</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Head of class attendance, student bio-records, report cards &amp; diary records.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClassTeacherType('co_ct')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        classTeacherType === 'co_ct'
                          ? 'bg-cyan-950/50 border-cyan-500/70 text-white shadow-lg ring-1 ring-cyan-400/50'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        classTeacherType === 'co_ct' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Users2 className="w-4 h-4 font-bold" />
                      </div>
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span>Co-Class Teacher / Associate (Co-CT)</span>
                          {classTeacherType === 'co_ct' && <span className="text-cyan-400 text-[10px]">● Active</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Assists in substitute attendance, discipline monitoring &amp; student activities.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Target Class Selector */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Assign Class &amp; Section for {classTeacherType === 'co_ct' ? 'Co-Class Teacher' : 'Class Teacher'}:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_CLASSES.map(cls => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setSelectedClassForCT(cls)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          selectedClassForCT === cls
                            ? (classTeacherType === 'co_ct'
                                ? 'bg-cyan-600 border-cyan-400 text-white shadow-md'
                                : 'bg-teal-600 border-teal-400 text-white shadow-md')
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Class {cls}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confirm Action Button */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] text-slate-400">
                    Will update Teacher Profile &amp; KVS Staff Directory for Session 2026-27.
                  </div>
                  <button
                    onClick={handleAssignClassTeacher}
                    disabled={loading || !activeUser}
                    className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                      classTeacherType === 'co_ct'
                        ? 'bg-cyan-600 hover:bg-cyan-500'
                        : 'bg-teal-600 hover:bg-teal-500'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Confirm {classTeacherType === 'co_ct' ? 'Co-Class Teacher' : 'Class Teacher'} Assignment
                    </span>
                  </button>
                </div>
              </div>

              {/* Current Active Teacher's Class Teacher & Co-Class Teacher Assignments */}
              {activeUser && (activeUser.isClassTeacherOf || activeUser.isCoClassTeacherOf) && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Current Class Leadership Roles for {activeUser.name}:
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeUser.isClassTeacherOf && (
                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <div>
                            <span className="font-bold text-xs text-amber-200">
                              Class Teacher (Head CT)
                            </span>
                            <span className="block text-xs font-black text-white">
                              Class {activeUser.isClassTeacherOf}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveClassTeacher('primary_ct')}
                          className="px-2 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 text-[10px] font-bold transition-all cursor-pointer"
                          title="Remove Class Teacher Role"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {activeUser.isCoClassTeacherOf && (
                      <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users2 className="w-4 h-4 text-cyan-400" />
                          <div>
                            <span className="font-bold text-xs text-cyan-200">
                              Co-Class Teacher (Associate)
                            </span>
                            <span className="block text-xs font-black text-white">
                              Class {activeUser.isCoClassTeacherOf}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveClassTeacher('co_ct')}
                          className="px-2 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 text-[10px] font-bold transition-all cursor-pointer"
                          title="Remove Co-Class Teacher Role"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASSIGN SUBJECT TEACHER */}
          {activeTab === 'subject_teacher' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/30 space-y-4">
                <div className="flex items-center gap-2 text-sky-300 font-bold text-sm">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>Subject &amp; Class Teaching Allocation</span>
                </div>
                <p className="text-xs text-slate-300">
                  Map classes and subjects taught by faculty members to unlock syllabus logs, lesson planning, and scholastic marks entry.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Target Class:</label>
                    <select
                      value={subjectClass}
                      onChange={e => setSubjectClass(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                    >
                      {ALL_CLASSES.map(cls => (
                        <option key={cls} value={cls}>Class {cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Subject Name:</label>
                    <select
                      value={subjectName}
                      onChange={e => setSubjectName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                    >
                      {STANDARD_SUBJECTS.map(subj => (
                        <option key={subj} value={subj}>{subj}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={handleAddSubjectAssignment}
                    disabled={loading || !activeUser}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Subject Mapping</span>
                  </button>
                </div>
              </div>

              {/* Current Teacher Assignments List */}
              {activeUser && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Current Subject Allocations for {activeUser.name}:
                  </h4>
                  {(!activeUser.assignments || activeUser.assignments.length === 0) ? (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                      No active subject-class mapping assigned yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeUser.assignments.map((asg, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-xs text-sky-200">Class {asg.className}</span>
                            <span className="text-xs text-slate-400 ml-2">{asg.subject}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveSubjectAssignment(idx)}
                            className="p-1 rounded-lg hover:bg-rose-950 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Remove mapping"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ASSIGN INCHARGE ROLES */}
          {activeTab === 'incharge' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Assign Institutional Portfolio &amp; Incharge Duty</span>
                  </div>
                  <span className="text-[10px] text-indigo-300 font-mono">
                    {rolesList.length} Active Portfolios Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Select Portfolio / Incharge Role:</label>
                    <select
                      value={selectedInchargeRoleId}
                      onChange={e => {
                        setSelectedInchargeRoleId(e.target.value);
                        const match = rolesList.find(r => r.id === e.target.value);
                        if (match?.defaultRoleLevel) setInchargeLevel(match.defaultRoleLevel);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                    >
                      {rolesList.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name} ({role.category.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Role Status / Designation:</label>
                    <select
                      value={inchargeLevel}
                      onChange={e => setInchargeLevel(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                    >
                      <option value="In-Charge">In-Charge (Single/Head)</option>
                      <option value="Convenor">Convenor (Committee Lead)</option>
                      <option value="Coordinator">Coordinator</option>
                      <option value="Member">Committee Member</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Scope / Target Level:</label>
                    <input
                      type="text"
                      value={inchargeScope}
                      onChange={e => setInchargeScope(e.target.value)}
                      placeholder="e.g. School Wide, Secondary (VI-X), Primary"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Academic Session:</label>
                    <input
                      type="text"
                      value="2026-27"
                      readOnly
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 text-xs font-bold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Key Outcomes &amp; Responsibilities:
                  </label>
                  <textarea
                    rows={2}
                    value={inchargeKeyOutcomes}
                    onChange={e => setInchargeKeyOutcomes(e.target.value)}
                    placeholder={selectedRoleDef?.description || "Enter specific outcomes or duties..."}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Will be synced to Page 16 (10a) Academic Responsibilities and Staff Record.
                  </div>
                  <button
                    onClick={handleAssignInchargeRole}
                    disabled={loading || !activeUser}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Assign {selectedRoleDef?.name || 'Role'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MANAGE ROLES LIST (CREATE, ADD, EDIT, REMOVE) */}
          {activeTab === 'manage_roles' && (
            <div className="space-y-6">
              {/* Form to Add or Edit Role */}
              <form
                onSubmit={e => {
                  if (isEditingRole) {
                    e.preventDefault();
                    handleUpdateRole(isEditingRole);
                  } else {
                    handleCreateRole(e);
                  }
                }}
                className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <Settings className="w-4 h-4 text-indigo-400" />
                    <span>{isEditingRole ? 'Edit Institutional Role' : 'Create & Add New Institutional Role'}</span>
                  </div>
                  {isEditingRole && (
                    <button
                      type="button"
                      onClick={cancelEditRole}
                      className="text-xs text-rose-300 hover:underline cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-300 mb-1">Role / Committee Name:</label>
                    <input
                      type="text"
                      required
                      value={newRoleName}
                      onChange={e => setNewRoleName(e.target.value)}
                      placeholder="e.g. Eco Club I/c, IT Incharge, Library I/c"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Category:</label>
                    <select
                      value={newRoleCategory}
                      onChange={e => setNewRoleCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                    >
                      <option value="administrative">Administrative</option>
                      <option value="academic">Academic &amp; Pedagogy</option>
                      <option value="activity">Co-Scholastic &amp; Activity</option>
                      <option value="welfare">Student Welfare &amp; Health</option>
                      <option value="logistics">Logistics &amp; Infrastructure</option>
                      <option value="core">Core Teaching</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Default Role Level:</label>
                    <select
                      value={newRoleDefaultLevel}
                      onChange={e => setNewRoleDefaultLevel(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                    >
                      <option value="In-Charge">In-Charge</option>
                      <option value="Convenor">Convenor</option>
                      <option value="Coordinator">Coordinator</option>
                      <option value="Member">Member</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Role Description &amp; Scope of Duties:</label>
                  <textarea
                    rows={2}
                    value={newRoleDescription}
                    onChange={e => setNewRoleDescription(e.target.value)}
                    placeholder="Describe the duties, portfolio expectations, registers to maintain, or key committees..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="submit"
                    disabled={loading || !newRoleName.trim()}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isEditingRole ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{isEditingRole ? 'Save Changes' : '+ Add Role to Master List'}</span>
                  </button>
                </div>
              </form>

              {/* List of Existing Roles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Master List of Institutional Roles ({rolesList.length}):
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rolesList.map(role => (
                    <div
                      key={role.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2.5 hover:border-slate-700 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            {role.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-900 text-indigo-300 border border-slate-800">
                            {role.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {role.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px]">
                        <span className="text-slate-500 font-mono">
                          Level: <strong className="text-slate-300">{role.defaultRoleLevel || 'In-Charge'}</strong>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditRole(role)}
                            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-semibold cursor-pointer"
                            title="Edit Role"
                          >
                            <Edit className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRole(role.id, role.name)}
                            className="px-2 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-rose-200 border border-rose-500/20 font-semibold cursor-pointer"
                            title="Remove Role"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MASTER ROLE MATRIX OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">Master Academic &amp; Administrative Roles Matrix</h3>
                  <p className="text-xs text-slate-400">Complete summary of staff allocations across KV Kutra</p>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter by teacher or role..."
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">S.N.</th>
                      <th className="p-3">Staff Name &amp; Designation</th>
                      <th className="p-3">Class Teacher / Co-CT</th>
                      <th className="p-3">Assigned Subjects &amp; Classes</th>
                      <th className="p-3">Special Portfolios</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {users
                      .filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.designation.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((u, idx) => (
                        <tr key={u.id} className="hover:bg-slate-850 transition-colors">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-white">{u.name}</div>
                            <div className="text-[10px] text-slate-400">{u.designation} • #{u.employeeCode}</div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              {u.isClassTeacherOf ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 w-fit">
                                  ⭐ CT: Class {u.isClassTeacherOf}
                                </span>
                              ) : null}
                              {u.isCoClassTeacherOf ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 w-fit">
                                  🤝 Co-CT: Class {u.isCoClassTeacherOf}
                                </span>
                              ) : null}
                              {!u.isClassTeacherOf && !u.isCoClassTeacherOf && (
                                <span className="text-slate-600">—</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            {u.assignedClasses && u.assignedClasses.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {u.assignedClasses.map(c => (
                                  <span key={c} className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-950 text-purple-200 border border-purple-500/30">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            {u.role === 'admin' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                👑 Principal &amp; Checking Authority
                              </span>
                            ) : u.role === 'data_entry_manager' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                📊 Data Entry Manager
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Academic Faculty</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Official KVS Samagam Role Allocation Engine (Session 2026-27)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
          >
            Done / Close
          </button>
        </div>

      </div>
    </div>
  );
}
