import React, { useState, useEffect, useMemo } from 'react';
import {
  TeacherProfile,
  AcademicTarget,
  TeacherAchievement,
  AcademicResponsibility,
  KvsFlagshipContribution,
  StaffDetailRecord,
  ProfileChangeRequest,
  ProfileFieldDiff
} from '../types/academic';
import { db, DEFAULT_TEACHER, getCurrentUser } from '../lib/storage';
import {
  getActiveInspectedTeacher,
  setActiveInspectedTeacher,
  getTeacherScopedStorageKey,
  getTeacherProfileFromStaff,
  parseDateToISO,
  extractPanNumber,
  extractPranNumber
} from '../lib/teacherContext';
import { UserAccount } from '../types/auth';
import { StaffDetailsManager } from './StaffDetailsManager';
import { DevModeBadge } from './DevModeBadge';
import {
  User,
  Award,
  Shield,
  Target,
  Plus,
  Trash2,
  Save, Send,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Camera,
  FileText,
  BookOpen,
  Sparkles,
  Briefcase,
  Flag,
  Lightbulb,
  GraduationCap,
  Medal,
  ChevronRight,
  ChevronDown,
  Filter,
  ClipboardList,
  Users,
  ArrowLeft,
  ArrowRight,
  Crown,
  ShieldCheck
} from 'lucide-react';
import WorkDoneOtherThanTeaching26 from './WorkDoneOtherThanTeaching26';
import TeacherInnovationAndBestPractices31 from './TeacherInnovationAndBestPractices31';
import { RoleAssignmentModal, RoleAssignmentAction } from './RoleAssignmentModal';
import { ProfileChangeRequestsModal } from './ProfileChangeRequestsModal';

export const STANDARD_KVS_DESIGNATIONS = [
  'PGT Mathematics',
  'PGT Physics',
  'PGT Chemistry',
  'PGT Biology',
  'PGT English',
  'PGT Hindi',
  'PGT Computer Science',
  'PGT Commerce',
  'PGT Economics',
  'PGT History',
  'PGT Geography',
  'TGT Mathematics',
  'TGT Science',
  'TGT Social Science',
  'TGT English',
  'TGT Hindi',
  'TGT Sanskrit',
  'TGT (WE)',
  'TGT (P&HE)',
  'TGT (AE)',
  'PRT',
  'PRT (MUSIC)',
  'LIBRARIAN',
  'SPECIAL EDUCATOR',
  'HEAD MISTRESS',
  'VICE PRINCIPAL',
  'PRINCIPAL'
];

interface TeacherProfileFormProps {
  devMode: boolean;
  onSaved?: () => void;
  onNavigateTab?: (tab: string) => void;
  currentUser?: UserAccount | null;
}

type ProfileSectionTab = 'all' | 'biodata' | 'targets' | 'philosophy' | 'responsibilities' | 'work_done_26' | 'innovation_31';

export const TeacherProfileForm: React.FC<TeacherProfileFormProps> = ({ devMode, onSaved, onNavigateTab, currentUser: propUser }) => {
  const [profile, setProfile] = useState<TeacherProfile>(DEFAULT_TEACHER);
  const [baselineProfile, setBaselineProfile] = useState<TeacherProfile>(DEFAULT_TEACHER);
  const [pendingRequest, setPendingRequest] = useState<ProfileChangeRequest | null>(null);
  const [lastResolvedRequest, setLastResolvedRequest] = useState<ProfileChangeRequest | null>(null);
  const [isProfileChangeModalOpen, setIsProfileChangeModalOpen] = useState(false);
  const [selectedInitialRequestId, setSelectedInitialRequestId] = useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [adminViewTab, setAdminViewTab] = useState<'staff_directory' | 'teacher_biodata'>('teacher_biodata');
  const [inspectingTeacher, setInspectingTeacher] = useState<StaffDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<ProfileSectionTab>('all');
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'Scholastic' | 'Co-Scholastic' | 'Professional'>('all');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // KVS Samagam Role Assignment Modal State (Admin Only)
  const [isAssignRolesModalOpen, setIsAssignRolesModalOpen] = useState(false);
  const [assignRoleAction, setAssignRoleAction] = useState<RoleAssignmentAction>('class_teacher');
  const [isClassesExpanded, setIsClassesExpanded] = useState(false);

  const classList = useMemo(() => {
    if (!profile.classesAndSubjectsTaught) return [];
    return profile.classesAndSubjectsTaught
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);
  }, [profile.classesAndSubjectsTaught]);

  useEffect(() => {
    loadData();

    const handleTeacherChanged = (e: any) => {
      const activeStaff = e.detail as StaffDetailRecord | null;
      if (activeStaff) {
        setInspectingTeacher(activeStaff);
        setAdminViewTab('teacher_biodata');
      }
      loadData();
    };

    const handleOpenRequests = (e: any) => {
      const detail = e.detail;
      setSelectedInitialRequestId(detail?.selectedId || detail?.employeeCode || null);
      setIsProfileChangeModalOpen(true);
      setAdminViewTab('teacher_biodata');
      loadData();
    };

    window.addEventListener('kvs-active-teacher-changed', handleTeacherChanged);
    window.addEventListener('kvs-open-profile-requests', handleOpenRequests);

    return () => {
      window.removeEventListener('kvs-active-teacher-changed', handleTeacherChanged);
      window.removeEventListener('kvs-open-profile-requests', handleOpenRequests);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const user = propUser || (await getCurrentUser());
    if (user) setCurrentUser(user);

    const [savedTeacher, activeStaff, savedStaff] = await Promise.all([
      db.get<TeacherProfile>('setup:teacher'),
      getActiveInspectedTeacher(),
      db.get<StaffDetailRecord[]>('setup:staff_details')
    ]);

    const staffList = savedStaff || [];

    // CASE 1: Individual Teacher Logged In (e.g. Sanjukta Kujur)
    if (user && user.role === 'teacher') {
      setAdminViewTab('teacher_biodata');
      setInspectingTeacher(null);

      const scopedKey = getTeacherScopedStorageKey('setup:teacher', user.employeeCode);
      const scopedProfile = await db.get<TeacherProfile>(scopedKey);

      // Match staff record from staff directory
      const staffMatch = staffList.find(st =>
        st.employeeCode === user.employeeCode ||
        (user.name && st.name && st.name.toLowerCase() === user.name.toLowerCase())
      );

      // Extract incharge duties from principalRemarks if any
      const remarksInchargeList: AcademicResponsibility[] = [];
      if (staffMatch?.principalRemarks) {
        const parts = staffMatch.principalRemarks.split(';');
        for (const p of parts) {
          const trimmed = p.trim();
          if (trimmed && !trimmed.toLowerCase().startsWith('ct:') && !trimmed.toLowerCase().startsWith('co-ct:')) {
            const roleMatch = trimmed.match(/^([^()]+)s*(?:(([^()]+)))?/);
            if (roleMatch) {
              remarksInchargeList.push({
                id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                dutyName: roleMatch[1].trim(),
                role: (roleMatch[2]?.trim() as any) || 'In-Charge',
                levelOrClass: 'School Wide',
                academicYear: '2026-27',
                keyOutcomes: 'Assigned official Vidyalaya portfolio.'
              });
            }
          }
        }
      }

      const synthesized = staffMatch
        ? getTeacherProfileFromStaff(staffMatch, DEFAULT_TEACHER)
        : DEFAULT_TEACHER;

      const mergedResponsibilities = [
        ...(scopedProfile?.academicResponsibilities || [])
      ];
      for (const rem of remarksInchargeList) {
        if (!mergedResponsibilities.some(r => r.dutyName.toLowerCase() === rem.dutyName.toLowerCase())) {
          mergedResponsibilities.push(rem);
        }
      }

      let resolvedCT = scopedProfile?.classTeacherRole;
      let resolvedCoCT = scopedProfile?.coClassTeacherRole;

      if (!resolvedCT) {
        if (user.isClassTeacherOf) {
          resolvedCT = `Class Teacher ${user.isClassTeacherOf}`;
        } else if (staffMatch?.principalRemarks) {
          const ctMatch = staffMatch.principalRemarks.match(/(?<!Co[- ])Class\s*Teacher:\s*([^;.\n]+)/i) || staffMatch.principalRemarks.match(/(?<!Co[- ])\bCT:\s*([^;.\n]+)/i);
          if (ctMatch && ctMatch[1]) resolvedCT = `Class Teacher ${ctMatch[1].trim()}`;
        }
      }

      if (!resolvedCoCT) {
        if (user.isCoClassTeacherOf) {
          resolvedCoCT = `Co-Class Teacher ${user.isCoClassTeacherOf}`;
        } else if (staffMatch?.principalRemarks) {
          const coMatch = staffMatch.principalRemarks.match(/Co[- ]Class\s*Teacher:\s*([^;.\n]+)/i) || staffMatch.principalRemarks.match(/Co[- ]CT:\s*([^;.\n]+)/i);
          if (coMatch && coMatch[1]) resolvedCoCT = `Co-Class Teacher ${coMatch[1].trim()}`;
        }
      }

      const effectiveProfile: TeacherProfile = {
        ...synthesized,
        ...(scopedProfile || {}),
        name: scopedProfile?.name || staffMatch?.name || user.name || synthesized.name,
        designation: (scopedProfile?.designation && scopedProfile.designation !== DEFAULT_TEACHER.designation)
          ? scopedProfile.designation
          : (staffMatch?.designation || user.designation || scopedProfile?.designation || synthesized.designation || DEFAULT_TEACHER.designation),
        employeeCode: user.employeeCode || scopedProfile?.employeeCode || synthesized.employeeCode,
        classTeacherRole: resolvedCT || synthesized.classTeacherRole || '',
        coClassTeacherRole: resolvedCoCT || synthesized.coClassTeacherRole || '',
        academicResponsibilities: mergedResponsibilities,
        dob: parseDateToISO(scopedProfile?.dob || synthesized.dob),
        joiningDateKVS: parseDateToISO(scopedProfile?.joiningDateKVS || synthesized.joiningDateKVS),
        joiningDatePresentKV: parseDateToISO(scopedProfile?.joiningDatePresentKV || synthesized.joiningDatePresentKV),
        panNo: scopedProfile?.panNo || synthesized.panNo || '',
        gpfCpfPranNo: extractPranNumber(scopedProfile?.gpfCpfPranNo || synthesized.gpfCpfPranNo)
      };

      setProfile(effectiveProfile);
      setBaselineProfile(effectiveProfile);
    }
    // CASE 2: Admin inspecting a specific teacher
    else if (activeStaff && (user?.role === 'admin' || !user)) {
      setInspectingTeacher(activeStaff);
      const scopedKey = getTeacherScopedStorageKey('setup:teacher', activeStaff.employeeCode);
      const [scopedProfile, usersList] = await Promise.all([
        db.get<TeacherProfile>(scopedKey),
        db.get<UserAccount[]>('auth:users_list')
      ]);

      const userAcc = usersList?.find(u => u.employeeCode === activeStaff.employeeCode);

      let inspCT = scopedProfile?.classTeacherRole;
      let inspCoCT = scopedProfile?.coClassTeacherRole;

      if (!inspCT) {
        if (userAcc?.isClassTeacherOf) {
          inspCT = `Class Teacher ${userAcc.isClassTeacherOf}`;
        } else if (activeStaff.principalRemarks) {
          const ctMatch = activeStaff.principalRemarks.match(/(?<!Co[- ])Class\s*Teacher:\s*([^;.\n]+)/i) || activeStaff.principalRemarks.match(/(?<!Co[- ])\bCT:\s*([^;.\n]+)/i);
          if (ctMatch && ctMatch[1]) inspCT = `Class Teacher ${ctMatch[1].trim()}`;
        }
      }

      if (!inspCoCT) {
        if (userAcc?.isCoClassTeacherOf) {
          inspCoCT = `Co-Class Teacher ${userAcc.isCoClassTeacherOf}`;
        } else if (activeStaff.principalRemarks) {
          const coMatch = activeStaff.principalRemarks.match(/Co[- ]Class\s*Teacher:\s*([^;.\n]+)/i) || activeStaff.principalRemarks.match(/Co[- ]CT:\s*([^;.\n]+)/i);
          if (coMatch && coMatch[1]) inspCoCT = `Co-Class Teacher ${coMatch[1].trim()}`;
        }
      }

      if (scopedProfile) {
        setProfile({
          ...scopedProfile,
          designation: (scopedProfile.designation && scopedProfile.designation !== DEFAULT_TEACHER.designation)
            ? scopedProfile.designation
            : (activeStaff.designation || scopedProfile.designation || DEFAULT_TEACHER.designation),
          classTeacherRole: inspCT || scopedProfile.classTeacherRole || '',
          coClassTeacherRole: inspCoCT || scopedProfile.coClassTeacherRole || '',
          dob: parseDateToISO(scopedProfile.dob || activeStaff.dob),
          joiningDateKVS: parseDateToISO(scopedProfile.joiningDateKVS || activeStaff.joiningDateKVSWithDesignation),
          joiningDatePresentKV: parseDateToISO(scopedProfile.joiningDatePresentKV || activeStaff.joiningDatePresentKVWithDesignation),
          panNo: scopedProfile.panNo || extractPanNumber(activeStaff.pranOrPanNo),
          gpfCpfPranNo: extractPranNumber(scopedProfile.gpfCpfPranNo || activeStaff.pranOrPanNo)
        });
      } else {
        const synthesized = getTeacherProfileFromStaff(activeStaff, savedTeacher);
        setProfile({
          ...synthesized,
          classTeacherRole: inspCT || synthesized.classTeacherRole || '',
          coClassTeacherRole: inspCoCT || synthesized.coClassTeacherRole || ''
        });
        setBaselineProfile({
          ...synthesized,
          classTeacherRole: inspCT || synthesized.classTeacherRole || '',
          coClassTeacherRole: inspCoCT || synthesized.coClassTeacherRole || ''
        });
      }
      setAdminViewTab('teacher_biodata');
    }
    // CASE 3: Admin on default template view
    else if (savedTeacher) {
      setProfile({
        ...DEFAULT_TEACHER,
        ...savedTeacher,
        dob: parseDateToISO(savedTeacher.dob),
        joiningDateKVS: parseDateToISO(savedTeacher.joiningDateKVS),
        joiningDatePresentKV: parseDateToISO(savedTeacher.joiningDatePresentKV),
        panNo: savedTeacher.panNo || '',
        gpfCpfPranNo: extractPranNumber(savedTeacher.gpfCpfPranNo),
        academicTargets: savedTeacher.academicTargets || DEFAULT_TEACHER.academicTargets || [],
        achievementsList: savedTeacher.achievementsList || DEFAULT_TEACHER.achievementsList || [],
        academicResponsibilities: savedTeacher.academicResponsibilities || DEFAULT_TEACHER.academicResponsibilities || [],
        kvsFlagshipContributions: savedTeacher.kvsFlagshipContributions || DEFAULT_TEACHER.kvsFlagshipContributions || [],
        teachingPhilosophy: savedTeacher.teachingPhilosophy ?? DEFAULT_TEACHER.teachingPhilosophy,
        scholasticAchievementsText: savedTeacher.scholasticAchievementsText ?? DEFAULT_TEACHER.scholasticAchievementsText,
        coScholasticAchievementsText: savedTeacher.coScholasticAchievementsText ?? DEFAULT_TEACHER.coScholasticAchievementsText
      });
      setBaselineProfile(profile);
    } else {
      setProfile(DEFAULT_TEACHER);
    }
    
    // Load change requests
    const allRequests = (await db.get<ProfileChangeRequest[]>('profile:change_requests')) || [];
    setPendingRequestsCount(allRequests.filter(r => r.status === 'pending').length);

    if (user && user.role === 'teacher') {
      const myRequests = allRequests.filter(r => r.employeeCode === user.employeeCode);
      const pending = myRequests.find(r => r.status === 'pending');
      const resolved = myRequests.filter(r => r.status !== 'pending').sort((a, b) => new Date(b.resolvedAt || b.submittedAt).getTime() - new Date(a.resolvedAt || a.submittedAt).getTime())[0];
      setPendingRequest(pending || null);
      setLastResolvedRequest(resolved || null);
    } else {
      setPendingRequest(null);
      setLastResolvedRequest(null);
    }

    setLoading(false);
  };

    const setProfileFromStaff = (stf: StaffDetailRecord) => {
    setProfile(prev => ({
      ...prev,
      name: stf.name || prev.name,
      designation: stf.designation || prev.designation,
      employeeCode: stf.employeeCode || prev.employeeCode,
      seniorityNo: stf.seniorityNumber || prev.seniorityNo,
      dob: parseDateToISO(stf.dob) || prev.dob,
      joiningDateKVS: parseDateToISO(stf.joiningDateKVSWithDesignation) || prev.joiningDateKVS,
      joiningDatePresentKV: parseDateToISO(stf.joiningDatePresentKVWithDesignation) || prev.joiningDatePresentKV,
      qualifications: stf.highestAcademicAndProfessionalQual || prev.qualifications,
      residentialAddress: stf.permanentPostalAddress || prev.residentialAddress,
      email: stf.email || prev.email,
      phoneNo: stf.phoneCalls || stf.phoneWhatsapp || prev.phoneNo,
      aadharNo: stf.aadharNo || prev.aadharNo,
      gpfCpfPranNo: extractPranNumber(stf.pranOrPanNo) || prev.gpfCpfPranNo,
      panNo: extractPanNumber(stf.pranOrPanNo) || prev.panNo
    }));
  };

  const handleInspectTeacherBioData = (stf: StaffDetailRecord) => {
    setInspectingTeacher(stf);
    setActiveInspectedTeacher(stf);
    setAdminViewTab('teacher_biodata');
  };

  
  
  const computeProfileDiffs = (current: TeacherProfile, proposed: TeacherProfile): ProfileFieldDiff[] => {
    const diffs: ProfileFieldDiff[] = [];
    const check = (key: keyof TeacherProfile, label: string) => {
      const val1 = String(current[key] || '').trim();
      const val2 = String(proposed[key] || '').trim();
      if (val1 !== val2) {
        diffs.push({
          fieldKey: String(key),
          fieldLabel: label,
          currentValue: val1,
          proposedValue: val2
        });
      }
    };

    check('name', 'Teacher Name');
    check('designation', 'Designation / Post');
    check('qualifications', 'Highest Academic & Professional Qualifications');
    check('seniorityNo', 'Seniority Number in KVS');
    check('employeeCode', 'Employee Code');
    check('dob', 'Date of Birth');
    check('joiningDateKVS', 'Date of Joining KVS');
    check('joiningDatePresentKV', 'Date of Joining Present KV');
    check('nccScoutingQualification', 'NCC / Scouting & Guiding');
    check('gpfCpfPranNo', 'GPF / CPF / PRAN Number');
    check('panNo', 'PAN Number');
    check('aadharNo', 'Aadhar Number');
    check('residentialAddress', 'Permanent / Residential Postal Address');
    check('phoneNo', 'Mobile Phone Number');
    check('email', 'Official Email ID');
    check('awardsWon', 'Awards / Commendations Won');
    check('classesAndSubjectsTaught', 'Classes & Subjects Taught (Item 16)');
    check('classTeacherRole', 'Class Teacher Assignment (Head CT) (Item 17)');
    check('coClassTeacherRole', 'Co-Class Teacher Assignment (Associate CT) (Item 17b)');
    check('bloodGroup', 'Blood Group');
    check('teachingPhilosophy', 'Teaching Philosophy');
    check('scholasticAchievementsText', 'Scholastic Achievements');
    check('coScholasticAchievementsText', 'Co-Scholastic Achievements');

    if (JSON.stringify(current.academicTargets || []) !== JSON.stringify(proposed.academicTargets || [])) {
      diffs.push({
        fieldKey: 'academicTargets',
        fieldLabel: 'Academic Targets',
        currentValue: `${(current.academicTargets || []).length} target(s)`,
        proposedValue: `${(proposed.academicTargets || []).length} target(s)`
      });
    }

    if (JSON.stringify(current.achievementsList || []) !== JSON.stringify(proposed.achievementsList || [])) {
      diffs.push({
        fieldKey: 'achievementsList',
        fieldLabel: 'Achievements List',
        currentValue: `${(current.achievementsList || []).length} item(s)`,
        proposedValue: `${(proposed.achievementsList || []).length} item(s)`
      });
    }

    if (JSON.stringify(current.academicResponsibilities || []) !== JSON.stringify(proposed.academicResponsibilities || [])) {
      diffs.push({
        fieldKey: 'academicResponsibilities',
        fieldLabel: 'Academic Responsibilities',
        currentValue: `${(current.academicResponsibilities || []).length} duty/duties`,
        proposedValue: `${(proposed.academicResponsibilities || []).length} duty/duties`
      });
    }

    return diffs;
  };

  const getActiveStorageKey = () => {
    if (inspectingTeacher?.employeeCode) {
      return getTeacherScopedStorageKey('setup:teacher', inspectingTeacher.employeeCode);
    }
    if (currentUser?.employeeCode && currentUser.role === 'teacher') {
      return getTeacherScopedStorageKey('setup:teacher', currentUser.employeeCode);
    }
    return 'setup:teacher';
  };


  const handleCancelPendingRequest = async () => {
    if (!pendingRequest) return;
    if (window.confirm('Are you sure you want to cancel your pending profile update request?')) {
      const allRequests = (await db.get<ProfileChangeRequest[]>('profile:change_requests')) || [];
      const filtered = allRequests.filter(r => r.id !== pendingRequest.id);
      await db.set('profile:change_requests', filtered);
      setPendingRequest(null);
      setMsg({ type: 'success', text: 'Pending profile change request cancelled.' });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMsg(null);

    // Validation
    if (!profile.name.trim()) {
      setMsg({ type: 'error', text: 'Teacher Name is required.' });
      setSaving(false);
      return;
    }
    if (!profile.employeeCode.trim()) {
      setMsg({ type: 'error', text: 'Employee Code is required.' });
      setSaving(false);
      return;
    }

    const isTeacher = currentUser?.role === 'teacher';

    // IF TEACHER: Submit Profile Change Request for Principal Approval
    if (isTeacher) {
      const diffs = computeProfileDiffs(baselineProfile, profile);
      if (diffs.length === 0) {
        setMsg({ type: 'error', text: 'No changes detected in your bio-data to submit for approval.' });
        setSaving(false);
        return;
      }

      const newRequest: ProfileChangeRequest = {
        id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        employeeCode: profile.employeeCode,
        teacherName: profile.name,
        designation: profile.designation,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        proposedProfile: profile,
        currentProfile: baselineProfile,
        changedFields: diffs
      };

      const allRequests = (await db.get<ProfileChangeRequest[]>('profile:change_requests')) || [];
      // Remove any existing pending request for this employee
      const updated = allRequests.filter(r => !(r.employeeCode === profile.employeeCode && r.status === 'pending'));
      updated.unshift(newRequest);
      await db.set('profile:change_requests', updated);

      setPendingRequest(newRequest);
      setSaving(false);
      setMsg({
        type: 'success',
        text: `🚀 Profile update request submitted successfully! (${diffs.length} field(s) modified). Waiting for Principal verification & approval.`
      });
      if (onSaved) onSaved();
      return;
    }

    // IF ADMIN / PRINCIPAL: Direct Instant Save
    const storageKey = getActiveStorageKey();
    const success = await db.set(storageKey, profile);
    if (storageKey === 'setup:teacher') {
      await db.set('setup:teacher', profile);
    }

    // Also synchronize into Staff Details if inspecting
    if (inspectingTeacher) {
      const staffList = (await db.get<StaffDetailRecord[]>('setup:staff_details')) || [];
      const updatedStaff = staffList.map(stf => {
        if (stf.employeeCode === inspectingTeacher.employeeCode) {
          return {
            ...stf,
            name: profile.name || stf.name,
            phoneCalls: profile.phoneNo || stf.phoneCalls,
            email: profile.email || stf.email,
            highestAcademicAndProfessionalQual: profile.qualifications || stf.highestAcademicAndProfessionalQual,
            permanentPostalAddress: profile.residentialAddress || stf.permanentPostalAddress,
            dob: profile.dob || stf.dob,
            joiningDateKVSWithDesignation: profile.joiningDateKVS || stf.joiningDateKVSWithDesignation,
            joiningDatePresentKVWithDesignation: profile.joiningDatePresentKV || stf.joiningDatePresentKVWithDesignation,
            aadharNo: profile.aadharNo || stf.aadharNo,
            pranOrPanNo: profile.panNo || profile.gpfCpfPranNo || stf.pranOrPanNo,
            seniorityNumber: profile.seniorityNo || stf.seniorityNumber,
            approvalStatus: 'Verified & Approved' as const
          };
        }
        return stf;
      });
      await db.set('setup:staff_details', updatedStaff);
    }

    setBaselineProfile(profile);
    setSaving(false);
    if (success) {
      setMsg({ type: 'success', text: `Teacher Profile & Diary Bio-Data saved directly for ${profile.name}!` });
      if (onSaved) onSaved();
      setTimeout(() => setMsg(null), 3000);
    } else {
      setMsg({ type: 'error', text: 'Failed to save profile.' });
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset Teacher Profile to standard Kendriya Vidyalaya template values?')) {
      setProfile(DEFAULT_TEACHER);
      await db.set('setup:teacher', DEFAULT_TEACHER);
      setMsg({ type: 'success', text: 'Reset to standard KVS teacher profile.' });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  // --------------------------------------------------------------------------
  // Item 19: Academic Targets Handlers
  // --------------------------------------------------------------------------
  const buildClassesString = (targets: AcademicTarget[], fallback: string = '') => {
    if (!targets || targets.length === 0) return fallback;
    const str = targets
      .map(t => {
        const subj = t.subjectCodeName ? t.subjectCodeName.trim() : '';
        const cls = t.classSection ? t.classSection.trim() : '';
        if (cls && subj) return `Class ${cls} (${subj})`;
        return cls || subj;
      })
      .filter(Boolean)
      .join(', ');
    return str || fallback;
  };

  const handleAddTarget = (subjectName: string = 'Physical & Health Education (P&HE)', e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newTarget: AcademicTarget = {
      id: `tgt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      subjectCodeName: subjectName,
      classSection: 'VI-A',
      passPercentage: 100,
      targetA1Count: 15
    };
    const currentTargets = profile.academicTargets || [];
    const updatedTargets = [...currentTargets, newTarget];
    const updatedClasses = buildClassesString(updatedTargets, profile.classesAndSubjectsTaught);
    const updatedProfile = {
      ...profile,
      classesAndSubjectsTaught: updatedClasses,
      academicTargets: updatedTargets
    };
    setProfile(updatedProfile);
    db.set(getActiveStorageKey(), updatedProfile);
  };

  const handleUpdateTarget = (id: string, field: keyof AcademicTarget, val: any) => {
    setProfile(prev => {
      const currentTargets = prev.academicTargets || [];
      const updatedTargets = currentTargets.map(t =>
        t.id === id ? { ...t, [field]: val } : t
      );
      const updatedClasses = buildClassesString(updatedTargets, prev.classesAndSubjectsTaught);
      const updated = {
        ...prev,
        classesAndSubjectsTaught: updatedClasses,
        academicTargets: updatedTargets
      };
      db.set(getActiveStorageKey(), updated);
      return updated;
    });
  };

  const handleDeleteTarget = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentTargets = profile.academicTargets || [];
    const updatedTargets = currentTargets.filter(t => t.id !== id);
    const updatedClasses = buildClassesString(updatedTargets, profile.classesAndSubjectsTaught);
    const updatedProfile = {
      ...profile,
      classesAndSubjectsTaught: updatedClasses,
      academicTargets: updatedTargets
    };
    setProfile(updatedProfile);
    db.set(getActiveStorageKey(), updatedProfile);
  };

  // --------------------------------------------------------------------------
  // P-15: 9(b) Achievements Handlers
  // --------------------------------------------------------------------------
  const handleAddAchievement = (category: 'Scholastic' | 'Co-Scholastic' | 'Professional' = 'Scholastic', e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newAch: TeacherAchievement = {
      id: `ach-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category,
      year: '2025-26',
      title: '',
      level: 'Regional',
      description: '',
      awardOrRecognition: ''
    };
    const currentList = profile.achievementsList || [];
    const updatedList = [...currentList, newAch];
    const updated = { ...profile, achievementsList: updatedList };
    setProfile(updated);
    db.set(getActiveStorageKey(), updated);
  };

  const handleUpdateAchievement = (id: string, field: keyof TeacherAchievement, val: any) => {
    setProfile(prev => {
      const currentList = prev.achievementsList || [];
      const updatedList = currentList.map(a =>
        a.id === id ? { ...a, [field]: val } : a
      );
      const updated = { ...prev, achievementsList: updatedList };
      db.set(getActiveStorageKey(), updated);
      return updated;
    });
  };

  const handleDeleteAchievement = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentList = profile.achievementsList || [];
    const updatedList = currentList.filter(a => a.id !== id);
    const updated = { ...profile, achievementsList: updatedList };
    setProfile(updated);
    db.set(getActiveStorageKey(), updated);
  };

  // --------------------------------------------------------------------------
  // P-16: 10(a) Academic Responsibilities Handlers
  // --------------------------------------------------------------------------
  const handleAddResponsibility = (preset?: { dutyName: string; role: 'Convenor' | 'In-Charge' | 'Member' | 'Coordinator' | 'Advisor'; levelOrClass: string; keyOutcomes: string }, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newResp: AcademicResponsibility = {
      id: `resp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dutyName: preset?.dutyName || '',
      role: preset?.role || 'Member',
      levelOrClass: preset?.levelOrClass || '',
      academicYear: '2025-26',
      keyOutcomes: preset?.keyOutcomes || ''
    };
    const currentList = profile.academicResponsibilities || [];
    const updatedList = [...currentList, newResp];
    const updated = { ...profile, academicResponsibilities: updatedList };
    setProfile(updated);
    db.set(getActiveStorageKey(), updated);
  };

  const handleUpdateResponsibility = (id: string, field: keyof AcademicResponsibility, val: any) => {
    setProfile(prev => {
      const currentList = prev.academicResponsibilities || [];
      const updatedList = currentList.map(r =>
        r.id === id ? { ...r, [field]: val } : r
      );
      const updated = { ...prev, academicResponsibilities: updatedList };
      db.set(getActiveStorageKey(), updated);
      return updated;
    });
  };

  const handleDeleteResponsibility = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentList = profile.academicResponsibilities || [];
    const updatedList = currentList.filter(r => r.id !== id);
    const updated = { ...profile, academicResponsibilities: updatedList };
    setProfile(updated);
    db.set(getActiveStorageKey(), updated);
  };

  // --------------------------------------------------------------------------
  // P-16: 10(b) KVS Flagship Contributions Handlers
  // --------------------------------------------------------------------------
  const handleAddFlagship = (preset?: { programName: string; role: string; targetGroup: string; actionsTaken: string; measurableImpact: string }, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newFlag: KvsFlagshipContribution = {
      id: `flag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      programName: preset?.programName || '',
      role: preset?.role || 'Lead Coordinator',
      targetGroup: preset?.targetGroup || '',
      actionsTaken: preset?.actionsTaken || '',
      measurableImpact: preset?.measurableImpact || ''
    };
    const currentList = profile.kvsFlagshipContributions || [];
    const updatedList = [...currentList, newFlag];
    const updated = { ...profile, kvsFlagshipContributions: updatedList };
    setProfile(updated);
    db.set(getActiveStorageKey(), updated);
  };

  const handleUpdateFlagship = (id: string, field: keyof KvsFlagshipContribution, val: any) => {
    setProfile(prev => {
      const currentList = prev.kvsFlagshipContributions || [];
      const updatedList = currentList.map(f =>
        f.id === id ? { ...f, [field]: val } : f
      );
      const updated = { ...prev, kvsFlagshipContributions: updatedList };
      db.set(getActiveStorageKey(), updated);
      return updated;
    });
  };

  const handleDeleteFlagship = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentList = profile.kvsFlagshipContributions || [];
    const updatedList = currentList.filter(f => f.id !== id);
    const updated = { ...profile, kvsFlagshipContributions: updatedList };
    setProfile(updated);
    db.set(getActiveStorageKey(), updated);
  };

  const activePersona = currentUser?.activePersona || (currentUser?.role === 'admin' ? 'admin' : 'teacher');
  const isAdmin = activePersona === 'admin' || currentUser?.role === 'admin' || (activePersona === 'data_entry_manager');

  if (loading) {
    return <div className="p-8 text-center text-purple-300">Loading Teacher Profile...</div>;
  }

  const filteredAchievements = (profile.achievementsList || []).filter(a =>
    achievementFilter === 'all' ? true : a.category === achievementFilter
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top View Switcher (Admin vs Teacher Mode) */}
      {isAdmin ? (
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex items-center justify-between gap-2 flex-wrap shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              <span>{inspectingTeacher ? `Inspecting: ${inspectingTeacher.name}` : "Teacher Bio-Data"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsProfileChangeModalOpen(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer relative"
              title="Review & Approve Faculty Profile Change Requests"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Review Updates</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setAssignRoleAction('class_teacher');
                setIsAssignRolesModalOpen(true);
              }}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Assign Class Teacher, Subject Teachers & Institutional Incharges"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>👑 Assign Roles</span>
            </button>
          </div>
        </div>
      ) : (
        /* Teacher Mode Top Switcher */
        <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex items-center justify-between gap-2 flex-wrap shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-200" />
              <span>My Bio-Data</span>
            </div>
          </div>

          <div className="text-[11px] text-purple-300 font-bold px-2.5 py-1 bg-purple-950/60 rounded-lg border border-purple-500/30 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Faculty Member: {profile.name} (#{profile.employeeCode})</span>
          </div>
        </div>
      )}

      {/* If Staff Directory tab is selected, render StaffDetailsManager */}
      {adminViewTab === 'staff_directory' ? (
        <StaffDetailsManager
          devMode={devMode}
          currentUser={currentUser}
          onInspectTeacherBioData={(stf) => {
            setProfileFromStaff(stf);
            setInspectingTeacher(stf);
            setAdminViewTab('teacher_biodata');
            setActiveSubTab('biodata');
          }}
          onNavigateTab={onNavigateTab}
        />
      ) : (
        /* Regular Teacher Profile Bio-Data Form (or Admin inspecting selected teacher) */
        <div className="space-y-6 sm:space-y-8">
          {/* Back button and Assign Role action if inspecting teacher */}
          {isAdmin && inspectingTeacher && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-amber-950/40 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
                  🔍
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Inspecting: <strong className="text-purple-300">{inspectingTeacher.name}</strong></span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-black">
                      {inspectingTeacher.designation}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    Emp Code: <strong className="text-white">{inspectingTeacher.employeeCode}</strong> · Seniority: <strong className="text-amber-300">{inspectingTeacher.seniorityNumber}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setAssignRoleAction('class_teacher');
                    setIsAssignRolesModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>Assign Role</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdminViewTab('staff_directory');
                    setInspectingTeacher(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Directory</span>
                </button>
              </div>
            </div>
          )}

          {/* Compact Teacher Bio-Data Header */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-purple-950 border border-purple-500/40 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                  {profile.photoUrl ? (
                    <img src={profile.photoUrl} alt="Teacher Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-purple-300/50" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    Teacher Bio-Data
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white m-0 truncate">
                    {profile.name || 'Teacher Name'}
                  </h3>
                  <p className="text-xs text-slate-400 m-0 font-mono truncate">
                    {profile.designation} · {profile.employeeCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* Assigned Classes — Expandable */}
            {classList.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsClassesExpanded(!isClassesExpanded)}
                  className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-white font-medium py-1 px-2.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer transition-all"
                >
                  <span>Assigned classes · {classList.length}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-purple-400 transition-transform ${isClassesExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isClassesExpanded && (
                  <div className="flex flex-wrap gap-1.5 pt-2 animate-fadeIn">
                    {classList.map((cls, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/30 text-purple-200 font-mono font-semibold"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

      {/* Quick Sub-Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'all'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-purple-950/40 text-purple-200 hover:bg-purple-900/60 border border-purple-500/20'
          }`}
        >
          📄 Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('biodata')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'biodata'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-purple-950/40 text-purple-200 hover:bg-purple-900/60 border border-purple-500/20'
          }`}
        >
          📋 Bio-Data
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('targets')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'targets'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-purple-950/40 text-purple-200 hover:bg-purple-900/60 border border-purple-500/20'
          }`}
        >
          🎯 Academic Targets
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('philosophy')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'philosophy'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-purple-950/40 text-purple-200 hover:bg-purple-900/60 border border-purple-500/20'
          }`}
        >
          🌟 Philosophy &amp; Achievements
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('responsibilities')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'responsibilities'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-purple-950/40 text-purple-200 hover:bg-purple-900/60 border border-purple-500/20'
          }`}
        >
          🏛️ Academic Duties
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('work_done_26')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'work_done_26'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-purple-950/40 text-purple-200 hover:bg-purple-900/60 border border-purple-500/20'
          }`}
        >
          📌 Work Other than Teaching
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('innovation_31')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubTab === 'innovation_31'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-purple-950/40 text-purple-200 hover:bg-purple-900/60 border border-purple-500/20'
          }`}
        >
          💡 Innovation &amp; Best Practices
        </button>
      </div>

      
      {/* Live Status Banners for Teacher Update Requests */}
      {!isAdmin && pendingRequest && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold shrink-0 mt-0.5 shadow-sm">
              ⏳
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-black text-amber-200 uppercase tracking-wide">
                  Profile Update Request Pending Principal Approval
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pendingRequest.changedFields.length} field(s) submitted
                </span>
              </div>
              <p className="text-xs text-amber-300/80 pt-0.5">
                Submitted on {new Date(pendingRequest.submittedAt).toLocaleString()}. Your updates will be verified and merged into the official Vidyalaya Staff Directory upon Principal approval.
              </p>
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                {pendingRequest.changedFields.map(f => (
                  <span key={f.fieldKey} className="px-2 py-0.5 rounded-md bg-slate-950/90 border border-amber-500/30 text-[10px] text-amber-200">
                    {f.fieldLabel}: <strong className="text-white">{f.proposedValue}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancelPendingRequest}
            className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Cancel Request
          </button>
        </div>
      )}

      {!isAdmin && !pendingRequest && lastResolvedRequest?.status === 'approved' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/50 flex items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold shrink-0 shadow-sm">
              ✅
            </div>
            <div>
              <h4 className="text-xs font-black text-emerald-200 uppercase tracking-wide">
                Profile Update Approved by Principal
              </h4>
              <p className="text-xs text-emerald-300/80 pt-0.5">
                Your profile modifications were approved on {lastResolvedRequest.resolvedAt ? new Date(lastResolvedRequest.resolvedAt).toLocaleDateString() : ''} ({lastResolvedRequest.principalRemarks || 'Merged with Vidyalaya Directory'}).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLastResolvedRequest(null)}
            className="text-xs text-emerald-400 hover:text-white px-2 py-1 cursor-pointer font-bold"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {!isAdmin && !pendingRequest && lastResolvedRequest?.status === 'rejected' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-900 border border-rose-500/50 flex items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 font-bold shrink-0 shadow-sm">
              ⚠️
            </div>
            <div>
              <h4 className="text-xs font-black text-rose-200 uppercase tracking-wide">
                Profile Update Returned by Principal
              </h4>
              <p className="text-xs text-rose-300/80 pt-0.5">
                Principal Remarks: <strong className="text-white">"{lastResolvedRequest.principalRemarks}"</strong>. You can adjust your entries and submit again.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLastResolvedRequest(null)}
            className="text-xs text-rose-400 hover:text-white px-2 py-1 cursor-pointer font-bold"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
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

      <form onSubmit={handleSave} className="space-y-6 sm:space-y-8 pb-24">
        {/* ================================================================= */}
        {/* SECTION 1: BIO-DATA                                               */}
        {/* ================================================================= */}
        {(activeSubTab === 'all' || activeSubTab === 'biodata') && (
          <div className="td-card p-3.5 sm:p-5">
            <div className="td-card-head pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white m-0">Teacher Bio-Data</h3>
                </div>
              </div>
            </div>

            <div className="td-form">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {/* 1. Name */}
                <div>
                  <label>
                    1. Teacher Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Mrs. Ananya Patnaik"
                    required
                    className="w-full"
                  />
                </div>

                {/* 2. Designation */}
                <div>
                  <label>
                    2. Designation <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={profile.designation || ''}
                    onChange={e => setProfile({ ...profile, designation: e.target.value })}
                    className="w-full"
                  >
                    {profile.designation && !STANDARD_KVS_DESIGNATIONS.includes(profile.designation) && (
                      <option value={profile.designation}>{profile.designation}</option>
                    )}
                    {STANDARD_KVS_DESIGNATIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    <option value="Other">Other Specialty</option>
                  </select>
                </div>

                {/* 3. Qualifications */}
                <div>
                  <label>3. Educational Qualifications</label>
                  <input
                    type="text"
                    value={profile.qualifications}
                    onChange={e => setProfile({ ...profile, qualifications: e.target.value })}
                    placeholder="M.Sc. (Maths), B.Ed., CTET"
                    className="w-full"
                  />
                </div>

                {/* 4. Seniority No */}
                <div>
                  <label>4. Seniority No. in KVS</label>
                  <input
                    type="text"
                    value={profile.seniorityNo}
                    onChange={e => setProfile({ ...profile, seniorityNo: e.target.value })}
                    placeholder="KVS-PGT-MATH-2018-042"
                    className="w-full"
                  />
                </div>

                {/* 5. Employee Code */}
                <div>
                  <label>
                    5. Employee Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.employeeCode}
                    onChange={e => setProfile({ ...profile, employeeCode: e.target.value })}
                    placeholder="EMP849201"
                    required
                    className="w-full"
                  />
                </div>

                {/* 6. DOB */}
                <div>
                  <label>6. Date of Birth</label>
                  <input
                    type="date"
                    value={parseDateToISO(profile.dob)}
                    onChange={e => setProfile({ ...profile, dob: e.target.value })}
                    className="w-full"
                  />
                </div>

                {/* 7. Joining KVS */}
                <div>
                  <label>7. Date of Joining KVS</label>
                  <input
                    type="date"
                    value={parseDateToISO(profile.joiningDateKVS)}
                    onChange={e => setProfile({ ...profile, joiningDateKVS: e.target.value })}
                    className="w-full"
                  />
                </div>

                {/* 8. Joining Present KV */}
                <div>
                  <label>8. Date of Joining Present KV</label>
                  <input
                    type="date"
                    value={parseDateToISO(profile.joiningDatePresentKV)}
                    onChange={e => setProfile({ ...profile, joiningDatePresentKV: e.target.value })}
                    className="w-full"
                  />
                </div>

                {/* 9. NCC / Scouting */}
                <div>
                  <label>9. NCC / Scouting &amp; Guiding</label>
                  <input
                    type="text"
                    value={profile.nccScoutingQualification}
                    onChange={e => setProfile({ ...profile, nccScoutingQualification: e.target.value })}
                    placeholder="e.g. HWB Guide Captain / ANO"
                    className="w-full"
                  />
                </div>

                {/* 10. GPF / PRAN */}
                <div>
                  <label>10. GPF / CPF / PRAN No.</label>
                  <input
                    type="text"
                    value={profile.gpfCpfPranNo}
                    onChange={e => setProfile({ ...profile, gpfCpfPranNo: e.target.value })}
                    placeholder="110049283741 (PRAN)"
                    className="w-full"
                  />
                </div>

                {/* 11. PAN No */}
                <div>
                  <label>11. PAN No.</label>
                  <input
                    type="text"
                    value={profile.panNo}
                    onChange={e => setProfile({ ...profile, panNo: e.target.value })}
                    placeholder="ABCDE1234F"
                    className="w-full"
                  />
                </div>

                {/* 12. Aadhar No */}
                <div>
                  <label>12. Aadhar No.</label>
                  <input
                    type="text"
                    value={profile.aadharNo}
                    onChange={e => setProfile({ ...profile, aadharNo: e.target.value })}
                    placeholder="9876-5432-1098"
                    className="w-full"
                  />
                </div>

                {/* 13. Address */}
                <div className="md:col-span-2">
                  <label>13. Residential Address</label>
                  <input
                    type="text"
                    value={profile.residentialAddress}
                    onChange={e => setProfile({ ...profile, residentialAddress: e.target.value })}
                    placeholder="Quarter No. Type IV/12, KV Campus, Bhubaneswar"
                    className="w-full"
                  />
                </div>

                {/* 14. Phone & Email */}
                <div>
                  <label>14. Mobile Phone</label>
                  <input
                    type="text"
                    value={profile.phoneNo}
                    onChange={e => setProfile({ ...profile, phoneNo: e.target.value })}
                    placeholder="+91 94370 12345"
                    className="w-full"
                  />
                </div>

                <div>
                  <label>14b. Official Email ID</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                    placeholder="ananya.patnaik@kvs.gov.in"
                    className="w-full"
                  />
                </div>

                {/* 15. Awards */}
                <div className="md:col-span-2">
                  <label>15. Awards / Commendations Won</label>
                  <input
                    type="text"
                    value={profile.awardsWon}
                    onChange={e => setProfile({ ...profile, awardsWon: e.target.value })}
                    placeholder="KVS Regional Incentive Award for Academic Excellence (2023)"
                    className="w-full"
                  />
                </div>

                {/* 16. Classes & Subjects */}
                <div>
                  <label>16. Classes &amp; Subjects Taught</label>
                  <input
                    type="text"
                    value={profile.classesAndSubjectsTaught}
                    onChange={e => setProfile({ ...profile, classesAndSubjectsTaught: e.target.value })}
                    placeholder="Class VI-A (P&HE), Class IX-A (P&HE), Class X-A (P&HE), Class XI-A (Physical Education)"
                    className="w-full"
                  />
                </div>

                {/* 17. Class Teacher Role */}
                <div>
                  <label>17. Class Teacher Assignment (Head CT)</label>
                  <input
                    type="text"
                    value={profile.classTeacherRole}
                    onChange={e => setProfile({ ...profile, classTeacherRole: e.target.value })}
                    placeholder="Class Teacher of Class X-A"
                    className="w-full"
                  />
                </div>

                {/* 17b. Co-Class Teacher Role */}
                <div>
                  <label>17b. Co-Class Teacher Assignment (Associate CT)</label>
                  <input
                    type="text"
                    value={profile.coClassTeacherRole || ''}
                    onChange={e => setProfile({ ...profile, coClassTeacherRole: e.target.value })}
                    placeholder="Co-Class Teacher of Class II-A"
                    className="w-full"
                  />
                </div>

                {/* 18. Blood Group */}
                <div>
                  <label>18. Blood Group</label>
                  <input
                    type="text"
                    value={profile.bloodGroup}
                    onChange={e => setProfile({ ...profile, bloodGroup: e.target.value })}
                    placeholder="O +ve"
                    className="w-full"
                  />
                </div>

                {/* Profile Photo URL */}
                <div className="md:col-span-2">
                  <label>Profile Photo URL (optional)</label>
                  <input
                    type="text"
                    value={profile.photoUrl || ''}
                    onChange={e => {
                      const updated = { ...profile, photoUrl: e.target.value };
                      setProfile(updated);
                      db.set(getActiveStorageKey(), updated);
                    }}
                    placeholder="Enter image URL (e.g. https://...)"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 2: ACADEMIC TARGETS                                     */}
        {/* ================================================================= */}
        {(activeSubTab === 'all' || activeSubTab === 'targets') && (
          <div className="td-card p-3.5 sm:p-5">
            <div className="td-card-head pb-3 border-b border-white/10 mb-4 flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white m-0">Academic Targets for Session</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddTarget('Physical & Health Education (P&HE)')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 hover:bg-emerald-900 text-emerald-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ P&HE Target</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddTarget('Mathematics (041)')}
                  className="td-add-btn text-xs py-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Target Class</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="td-form-table">
                <thead>
                  <tr>
                    <th className="text-left py-2.5 px-3">Subject Code & Name</th>
                    <th className="w-32 py-2.5 px-3">Class & Sec</th>
                    <th className="w-36 py-2.5 px-3">Target Pass %</th>
                    <th className="w-36 py-2.5 px-3">Target A1 Count</th>
                    <th className="w-20 py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!profile.academicTargets || profile.academicTargets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="td-empty py-6 text-center text-xs text-[var(--text-dim)]">
                        No academic targets defined yet. Click "+ Add Target Class" to start.
                      </td>
                    </tr>
                  ) : (
                    profile.academicTargets.map(tgt => (
                      <tr key={tgt.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="text-left p-2">
                          <input
                            type="text"
                            value={tgt.subjectCodeName}
                            onChange={e => handleUpdateTarget(tgt.id, 'subjectCodeName', e.target.value)}
                            placeholder="e.g. Physical & Health Education (P&HE)"
                            className="td-table-input font-medium text-left"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={tgt.classSection}
                            onChange={e => handleUpdateTarget(tgt.id, 'classSection', e.target.value)}
                            placeholder="e.g. VI-A"
                            className="td-table-input text-center"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={tgt.passPercentage}
                            onChange={e => handleUpdateTarget(tgt.id, 'passPercentage', parseFloat(e.target.value) || 0)}
                            className="td-table-input font-mono text-emerald-400 font-bold text-center"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            value={tgt.targetA1Count}
                            onChange={e => handleUpdateTarget(tgt.id, 'targetA1Count', parseInt(e.target.value, 10) || 0)}
                            className="td-table-input font-mono text-purple-300 font-bold text-center"
                          />
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTarget(tgt.id, e)}
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer flex items-center justify-center mx-auto border border-rose-500/20"
                            title="Delete Target"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 3: P-15 9(a) TEACHING PHILOSOPHY & 9(b) ACHIEVEMENTS       */}
        {/* ================================================================= */}
        {(activeSubTab === 'all' || activeSubTab === 'philosophy') && (
          <div className="space-y-6">
            {/* P-15 9(a) Teaching Philosophy */}
            <div className="td-card">
              <div className="td-card-head flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white m-0">Statement of Teaching Philosophy</h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...profile,
                      teachingPhilosophy: DEFAULT_TEACHER.teachingPhilosophy
                    };
                    setProfile(updated);
                    db.set(getActiveStorageKey(), updated);
                  }}
                  className="td-btn-ghost text-xs py-1.5"
                  title="Insert KVS Standard Teaching Philosophy template"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Insert Standard NEP Template</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200/90 mb-4 space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>NEP-2020 &amp; KVS Pedagogical Focus Areas:</span>
                </div>
                <p className="m-0 text-slate-300 leading-relaxed">
                  Articulate your core pedagogical beliefs: <em>Competency-Based Education</em>, <em>Experiential &amp; Joyful Learning</em>, <em>Panchakosha Vikas</em>, <em>Inclusivity &amp; Differentiated Instruction</em>, and <em>21st Century Skills Development (Critical Thinking, Creativity, Collaboration)</em>.
                </p>
              </div>

              <div className="space-y-2">
                <textarea
                  rows={5}
                  value={profile.teachingPhilosophy || ''}
                  onChange={e => {
                    const updated = { ...profile, teachingPhilosophy: e.target.value };
                    setProfile(updated);
                    db.set(getActiveStorageKey(), updated);
                  }}
                  placeholder="State your personal teaching philosophy, core instructional principles, student-centered values, and commitment to the holistic development of Kendriya Vidyalaya learners..."
                  className="w-full text-xs font-sans leading-relaxed p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl text-purple-100 placeholder-purple-300/40 focus:border-amber-400 focus:outline-none"
                />
                <div className="flex justify-between items-center text-[10px] text-[var(--text-dim)] px-1">
                  <span>Pedagogical Beliefs</span>
                  <span>{(profile.teachingPhilosophy || '').length} characters</span>
                </div>
              </div>
            </div>

            {/* Achievements (Scholastic & Co-Scholastic) */}
            <div className="td-card p-3.5 sm:p-5">
              <div className="td-card-head pb-3 border-b border-white/10 mb-4 flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                    <Award className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white m-0">Notable Achievements (Scholastic &amp; Co-Scholastic)</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAddAchievement('Scholastic')}
                    className="px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-500/40 hover:bg-blue-900 text-blue-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-400" />
                    <span>+ Scholastic</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAchievement('Co-Scholastic')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 hover:bg-emerald-900 text-emerald-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+ Co-Scholastic</span>
                  </button>
                </div>
              </div>

              {/* Text Summaries for Scholastic and Co-Scholastic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5 border border-[var(--glass-border)] space-y-2">
                  <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>Scholastic Achievements Summary:</span>
                  </label>
                  <textarea
                    rows={3}
                    value={profile.scholasticAchievementsText || ''}
                    onChange={e => {
                      const updated = { ...profile, scholasticAchievementsText: e.target.value };
                      setProfile(updated);
                      db.set(getActiveStorageKey(), updated);
                    }}
                    placeholder="E.g. 100% CBSE Board results, High Performance Index (PI), Subject distinctions, DIKSHA e-content created..."
                    className="w-full text-xs p-2.5 bg-purple-950/30 border border-purple-500/20 rounded-lg text-purple-100"
                  />
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-[var(--glass-border)] space-y-2">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Medal className="w-4 h-4" />
                    <span>Co-Scholastic Achievements Summary:</span>
                  </label>
                  <textarea
                    rows={3}
                    value={profile.coScholasticAchievementsText || ''}
                    onChange={e => {
                      const updated = { ...profile, coScholasticAchievementsText: e.target.value };
                      setProfile(updated);
                      db.set(getActiveStorageKey(), updated);
                    }}
                    placeholder="E.g. KVS National Sports coaching, Rashtrapati Scout/Guide awardees mentored, Kala Utsav, EBSB, Youth Parliament..."
                    className="w-full text-xs p-2.5 bg-purple-950/30 border border-purple-500/20 rounded-lg text-purple-100"
                  />
                </div>
              </div>

              {/* Filter & Interactive Achievements Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xs uppercase font-bold text-purple-300 tracking-wider m-0">
                    Detailed Achievement Register (P-15)
                  </h4>
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-purple-400" />
                    <select
                      value={achievementFilter}
                      onChange={e => setAchievementFilter(e.target.value as any)}
                      className="py-1 px-2.5 bg-purple-950/50 border border-purple-500/30 rounded-lg text-xs text-purple-200"
                    >
                      <option value="all">All Categories</option>
                      <option value="Scholastic">Scholastic Only</option>
                      <option value="Co-Scholastic">Co-Scholastic Only</option>
                      <option value="Professional">Professional Only</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="td-form-table">
                    <thead>
                      <tr>
                        <th className="w-28 py-2.5 px-3">Session / Year</th>
                        <th className="w-36 py-2.5 px-3">Category</th>
                        <th className="w-32 py-2.5 px-3">Level</th>
                        <th className="text-left py-2.5 px-3">Achievement Title & Particulars</th>
                        <th className="text-left w-52 py-2.5 px-3">Award / Recognition</th>
                        <th className="w-20 py-2.5 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAchievements.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="td-empty py-6 text-center text-xs text-[var(--text-dim)]">
                            No achievements recorded. Click "+ Scholastic" or "+ Co-Scholastic" above to add.
                          </td>
                        </tr>
                      ) : (
                        filteredAchievements.map(ach => (
                          <tr key={ach.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-2">
                              <input
                                type="text"
                                value={ach.year}
                                onChange={e => handleUpdateAchievement(ach.id, 'year', e.target.value)}
                                placeholder="2025-26"
                                className="td-table-input text-center font-mono text-xs font-semibold"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={ach.category}
                                onChange={e => handleUpdateAchievement(ach.id, 'category', e.target.value as any)}
                                className="td-table-select text-xs font-semibold"
                              >
                                <option value="Scholastic">Scholastic</option>
                                <option value="Co-Scholastic">Co-Scholastic</option>
                                <option value="Professional">Professional</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <select
                                value={ach.level}
                                onChange={e => handleUpdateAchievement(ach.id, 'level', e.target.value as any)}
                                className="td-table-select text-xs"
                              >
                                <option value="School">School</option>
                                <option value="Cluster">Cluster</option>
                                <option value="Regional">Regional</option>
                                <option value="National">National</option>
                                <option value="International">International</option>
                              </select>
                            </td>
                            <td className="text-left p-2 space-y-1.5">
                              <input
                                type="text"
                                value={ach.title}
                                onChange={e => handleUpdateAchievement(ach.id, 'title', e.target.value)}
                                placeholder="Title of achievement or distinction..."
                                className="td-table-input font-bold text-xs"
                              />
                              <input
                                type="text"
                                value={ach.description}
                                onChange={e => handleUpdateAchievement(ach.id, 'description', e.target.value)}
                                placeholder="Details of result, students guided, or event summary..."
                                className="td-table-input text-[11px]"
                              />
                            </td>
                            <td className="text-left p-2">
                              <input
                                type="text"
                                value={ach.awardOrRecognition || ''}
                                onChange={e => handleUpdateAchievement(ach.id, 'awardOrRecognition', e.target.value)}
                                placeholder="e.g. Certificate / Trophy / Cash Award"
                                className="td-table-input text-xs text-amber-300 font-medium"
                              />
                            </td>
                            <td className="p-2">
                              <button
                                type="button"
                                onClick={(e) => handleDeleteAchievement(ach.id, e)}
                                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer mx-auto flex items-center justify-center border border-rose-500/20"
                                title="Delete Achievement"
                              >
                                <Trash2 className="w-4 h-4 text-rose-400" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 4: P-16 10(a) ACADEMIC RESPONSIBILITIES & 10(b) FLAGSHIP  */}
        {/* ================================================================= */}
        {(activeSubTab === 'all' || activeSubTab === 'responsibilities') && (
          <div className="space-y-6">
            {/* Academic Responsibilities */}
            <div className="td-card p-3.5 sm:p-5">
              <div className="td-card-head pb-3 border-b border-white/10 mb-4 flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white m-0">Academic &amp; Administrative Responsibilities</h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssignRoleAction('exam_incharge');
                        setIsAssignRolesModalOpen(true);
                      }}
                      className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                      title="Assign Exam Incharge, CBSE Incharge or Foundational Observer"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-300" />
                      <span>👑 Assign Official Portfolios</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleAddResponsibility({
                      dutyName: 'Time-Table Committee Convenor',
                      role: 'Convenor',
                      levelOrClass: 'Secondary & Sr. Secondary (VI-XII)',
                      keyOutcomes: 'Framed clash-free master timetable incorporating sports and remedial periods.'
                    }, e)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/30 hover:bg-indigo-900 text-indigo-200 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    + Time-Table I/C
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleAddResponsibility({
                      dutyName: 'Examination Committee Member',
                      role: 'Member',
                      levelOrClass: 'Classes IX to XII',
                      keyOutcomes: 'Conducted PT and Pre-Boards with 100% compliance in UBI marks portal.'
                    }, e)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/30 hover:bg-indigo-900 text-indigo-200 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    + Exam Committee
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleAddResponsibility(undefined, e)}
                    className="td-add-btn text-xs py-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Custom Duty</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="td-form-table">
                  <thead>
                    <tr>
                      <th className="w-28 py-2.5 px-3">Session</th>
                      <th className="text-left w-64 py-2.5 px-3">Committee / Responsibility Name</th>
                      <th className="w-36 py-2.5 px-3">Designation / Role</th>
                      <th className="w-40 py-2.5 px-3">Level / Classes</th>
                      <th className="text-left py-2.5 px-3">Key Outcomes / Execution Summary</th>
                      <th className="w-20 py-2.5 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!profile.academicResponsibilities || profile.academicResponsibilities.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="td-empty py-6 text-center text-xs text-[var(--text-dim)]">
                          No academic responsibilities added. Click "+ Custom Duty" or presets above to record.
                        </td>
                      </tr>
                    ) : (
                      profile.academicResponsibilities.map(resp => (
                        <tr key={resp.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-2">
                            <input
                              type="text"
                              value={resp.academicYear || ''}
                              onChange={e => handleUpdateResponsibility(resp.id, 'academicYear', e.target.value)}
                              placeholder="2025-26"
                              className="td-table-input text-center font-mono text-xs font-semibold"
                            />
                          </td>
                          <td className="text-left p-2">
                            <input
                              type="text"
                              value={resp.dutyName || ''}
                              onChange={e => handleUpdateResponsibility(resp.id, 'dutyName', e.target.value)}
                              placeholder="e.g. Time-Table Convenor / House Master"
                              className="td-table-input font-bold text-xs text-left"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={resp.role || 'Member'}
                              onChange={e => handleUpdateResponsibility(resp.id, 'role', e.target.value as any)}
                              className="td-table-select text-xs font-semibold"
                            >
                              <option value="Convenor">Convenor</option>
                              <option value="In-Charge">In-Charge</option>
                              <option value="Coordinator">Coordinator</option>
                              <option value="Member">Member</option>
                              <option value="Advisor">Advisor</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={resp.levelOrClass || ''}
                              onChange={e => handleUpdateResponsibility(resp.id, 'levelOrClass', e.target.value)}
                              placeholder="VI-XII / School Level"
                              className="td-table-input text-xs text-center"
                            />
                          </td>
                          <td className="text-left p-2">
                            <input
                              type="text"
                              value={resp.keyOutcomes || ''}
                              onChange={e => handleUpdateResponsibility(resp.id, 'keyOutcomes', e.target.value)}
                              placeholder="Actions taken, execution summary and specific achievements..."
                              className="td-table-input text-xs text-left"
                            />
                          </td>
                          <td className="p-2">
                            <button
                              type="button"
                              onClick={(e) => handleDeleteResponsibility(resp.id, e)}
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer mx-auto flex items-center justify-center border border-rose-500/20"
                              title="Delete Responsibility"
                            >
                              <Trash2 className="w-4 h-4 text-rose-400" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contributions to KVS Flagship Programs */}
            <div className="td-card p-3.5 sm:p-5">
              <div className="td-card-head pb-3 border-b border-white/10 mb-4 flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300">
                    <Flag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white m-0">Contributions to KVS Flagship Programs</h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={(e) => handleAddFlagship({
                      programName: 'PM SHRI School Scheme',
                      role: 'Pillar Coordinator / Lead Teacher',
                      targetGroup: 'Classes VI-XII (720 Students)',
                      actionsTaken: 'Spearheaded experiential learning, bagless days, and environmental sustainability initiatives.',
                      measurableImpact: 'Achieved 5-star rating on PM SHRI school accreditation matrix.'
                    }, e)}
                    className="px-2.5 py-1 rounded-lg bg-teal-950/80 border border-teal-500/30 hover:bg-teal-900 text-teal-200 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    + PM SHRI
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleAddFlagship({
                      programName: 'NIPUN Bharat & Jadui Pitara FLN',
                      role: 'FLN Mentor / Activity Facilitator',
                      targetGroup: 'Balvatika to Class II (180 Students)',
                      actionsTaken: 'Integrated joyful learning toys and physical motor drills with foundational numeracy.',
                      measurableImpact: '100% attainment of foundational literacy & numeracy milestones.'
                    }, e)}
                    className="px-2.5 py-1 rounded-lg bg-teal-950/80 border border-teal-500/30 hover:bg-teal-900 text-teal-200 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    + NIPUN Bharat
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleAddFlagship({
                      programName: 'Ek Bharat Shreshtha Bharat (EBSB)',
                      role: 'EBSB Club Coordinator',
                      targetGroup: 'Classes VI to X (400 Students)',
                      actionsTaken: 'Conducted paired-state language assembly, folk dance, and culinary workshops.',
                      measurableImpact: 'Won 1st prize at Regional EBSB Cultural Conclave.'
                    }, e)}
                    className="px-2.5 py-1 rounded-lg bg-teal-950/80 border border-teal-500/30 hover:bg-teal-900 text-teal-200 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    + EBSB
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleAddFlagship(undefined, e)}
                    className="td-add-btn text-xs py-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Flagship</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="td-form-table">
                  <thead>
                    <tr>
                      <th className="text-left w-52 py-2.5 px-3">KVS Flagship Program</th>
                      <th className="w-36 py-2.5 px-3">Role / Capacity</th>
                      <th className="w-36 py-2.5 px-3">Target Group / Class</th>
                      <th className="text-left py-2.5 px-3">Key Actions Undertaken</th>
                      <th className="text-left w-56 py-2.5 px-3">Measurable Impact & Outcomes</th>
                      <th className="w-20 py-2.5 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!profile.kvsFlagshipContributions || profile.kvsFlagshipContributions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="td-empty py-6 text-center text-xs text-[var(--text-dim)]">
                          No KVS Flagship program contributions added. Click presets above or "+ Add Flagship" to record.
                        </td>
                      </tr>
                    ) : (
                      profile.kvsFlagshipContributions.map(flag => (
                        <tr key={flag.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="text-left p-2">
                            <input
                              type="text"
                              value={flag.programName || ''}
                              onChange={e => handleUpdateFlagship(flag.id, 'programName', e.target.value)}
                              placeholder="e.g. PM SHRI / FIT India / EBSB"
                              className="td-table-input font-bold text-xs text-left text-teal-300"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={flag.role || ''}
                              onChange={e => handleUpdateFlagship(flag.id, 'role', e.target.value)}
                              placeholder="Lead Coordinator / Nodal"
                              className="td-table-input text-xs text-center font-medium"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={flag.targetGroup || ''}
                              onChange={e => handleUpdateFlagship(flag.id, 'targetGroup', e.target.value)}
                              placeholder="Classes VI-X (400 Students)"
                              className="td-table-input text-xs text-center"
                            />
                          </td>
                          <td className="text-left p-2">
                            <input
                              type="text"
                              value={flag.actionsTaken || ''}
                              onChange={e => handleUpdateFlagship(flag.id, 'actionsTaken', e.target.value)}
                              placeholder="Specific interventions, workshops, activities conducted..."
                              className="td-table-input text-xs text-left"
                            />
                          </td>
                          <td className="text-left p-2">
                            <input
                              type="text"
                              value={flag.measurableImpact || ''}
                              onChange={e => handleUpdateFlagship(flag.id, 'measurableImpact', e.target.value)}
                              placeholder="Awards, percentage improvement, accreditation..."
                              className="td-table-input text-xs text-emerald-300 font-medium text-left"
                            />
                          </td>
                          <td className="p-2">
                            <button
                              type="button"
                              onClick={(e) => handleDeleteFlagship(flag.id, e)}
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer mx-auto flex items-center justify-center border border-rose-500/20"
                              title="Delete Flagship Record"
                            >
                              <Trash2 className="w-4 h-4 text-rose-400" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Module 26: DETAILS OF WORK DONE OTHER THAN TEACHING */}
        {/* ------------------------------------------------------------------ */}
        {(activeSubTab === 'all' || activeSubTab === 'work_done_26') && (
          <div className="pt-2">
            <WorkDoneOtherThanTeaching26 devMode={devMode} />
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Module 31: INNOVATION EXPERIMENTATION & BEST PRACTICES */}
        {/* ------------------------------------------------------------------ */}
        {(activeSubTab === 'all' || activeSubTab === 'innovation_31') && (
          <div className="pt-2">
            <TeacherInnovationAndBestPractices31 devMode={devMode} />
          </div>
        )}

        {/* Global Save Footer Button */}
        <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 shadow-lg">
          {!isAdmin ? (
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>{saving ? 'Submitting Request...' : 'Submit Changes for Principal Approval'}</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Profile...' : 'Save & Update Profile Directly'}</span>
            </button>
          )}
        </div>
      </form>
      </div>
      )}

      {/* Principal Review & Approval Modal for Profile Updates */}
      <ProfileChangeRequestsModal
        isOpen={isProfileChangeModalOpen}
        initialRequestId={selectedInitialRequestId}
        onClose={() => {
          setIsProfileChangeModalOpen(false);
          setSelectedInitialRequestId(null);
          loadData();
        }}
        onRequestResolved={loadData}
      />

      {/* KVS Samagam Role Assignment Modal (Admin Checking Authority) */}
      <RoleAssignmentModal
        isOpen={isAssignRolesModalOpen}
        onClose={() => {
          setIsAssignRolesModalOpen(false);
          loadData();
        }}
        initialAction={assignRoleAction}
        targetTeacherCode={inspectingTeacher?.employeeCode || profile.employeeCode}
      />
    </div>
  );
};
