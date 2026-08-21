export type UserRole = 'admin' | 'data_entry_manager' | 'teacher';

export type TeacherDesignation =
  | 'Principal'
  | 'Principal I/c'
  | 'Vice-Principal'
  | 'Academic Incharge'
  | 'PGT'
  | 'TGT'
  | 'PRT'
  | 'Balvatika Teacher'
  | 'Data Entry Manager'
  | 'Special Educator'
  | 'Activity / PET / Librarian'
  | (string & {});

export type StageCategory =
  | 'foundational'     // Balvatika, I, II
  | 'preparatory'      // III, IV, V
  | 'middle'           // VI, VII, VIII
  | 'secondary'        // IX, X
  | 'senior_secondary';// XI, XII

export interface ClassSubjectAssignment {
  id: string;
  className: string; // e.g. 'XI', 'IX', 'V', 'VI', 'III', 'Balvatika-3'
  section: string;   // e.g. 'A', 'B', 'C'
  subject: string;   // e.g. 'Mathematics', 'Physics', 'Science', 'English', 'EVS'
  stage: StageCategory;
  isClassTeacher?: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole; // 'admin' | 'data_entry_manager' | 'teacher'
  designation: TeacherDesignation;
  employeeCode: string;
  department?: string;
  
  // Dynamic Admin Assignments (Any classes, any subjects, cross-stage supported)
  assignments: ClassSubjectAssignment[];
  assignedClasses: string[]; // e.g. ['V-A', 'IX-A', 'XI-A', 'XII-A']
  assignedSubjects: string[]; // e.g. ['Mathematics', 'Physics', 'Science']
  isClassTeacherOf?: string; // e.g. 'XII-A' or null
  isCoClassTeacherOf?: string; // e.g. 'II-A' or null (Co / Associate Class Teacher)
  
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  activePersona?: 'admin' | 'data_entry_manager' | 'teacher'; // Optional runtime active persona switch for dual-role users
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  currentUser: UserAccount;
  loginTimestamp: number;
}

export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'revision_requested';

export interface ModuleApprovalRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherDesignation?: string;
  moduleKey: string; // e.g. 'lessonplan', 'assessment_17', 'result_analysis_18', 'observations_19', 'remedial_20b', 'exemplary_21', 'meetings_22_24', 'followup_25', 'non_teaching_26', 'ict_27', 'academic_loss_28', 'joyful_29', 'competency_30', 'innovation_31a', 'best_practice_31b'
  moduleTitle: string; // e.g. 'P-32 Daily Lesson Plan (Class XI-A Maths)'
  recordId: string;
  className?: string;
  subjectName?: string;
  title: string;
  summary?: string;
  status: ApprovalStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string; // e.g. 'Dr. R. K. Sharma (Principal)'
  remarks?: string;
  officialStampApplied: boolean;
}

// Stage resolver helper
export function getStageCategory(className: string): StageCategory {
  const norm = className.trim().toUpperCase();
  if (norm.includes('BALVATIKA') || norm === 'I' || norm === 'II' || norm === '1' || norm === '2') {
    return 'foundational';
  }
  if (norm === 'III' || norm === 'IV' || norm === 'V' || norm === '3' || norm === '4' || norm === '5') {
    return 'preparatory';
  }
  if (norm === 'VI' || norm === 'VII' || norm === 'VIII' || norm === '6' || norm === '7' || norm === '8') {
    return 'middle';
  }
  if (norm === 'IX' || norm === 'X' || norm === '9' || norm === '10') {
    return 'secondary';
  }
  return 'senior_secondary';
}

// Check whether a user has permission to access a specific tab/feature based on active persona
export function canAccessTab(role: UserRole, tabKey: string, activePersona?: UserRole): boolean {
  const effectiveRole = activePersona || role;

  if (effectiveRole === 'admin') {
    // Admin has access to everything
    return true;
  }

  if (effectiveRole === 'data_entry_manager') {
    // Data Entry Manager can manage master data, rosters, syllabi, timetables, calendars, marks
    const allowedTabs = [
      'dashboard',
      'teacher_attendance',
      'student_enrollment',
      'students',
      'classes',
      'timetable',
      'calendar',
      'exams',
      'syllabus',
      'assessment',
      'result_analysis_vi_xii',
      'result_analysis_vi_x',
      'result_analysis_xi_xii',
      'scholastic_primary',
      'scholastic_1_2',
      'scholastic_3_5_t1',
      'scholastic_3_5_t2',
      'result_analysis',
      'reports',
      'tickets',
      'my_portfolios',
      'settings'
    ];
    return allowedTabs.includes(tabKey);
  }

  if (effectiveRole === 'teacher') {
    // Teachers have access to all diary modules relevant to teaching & documentation
    const allowedTabs = [
      'dashboard',
      'taskmanager',
      'workload',
      'teacher_attendance',
      'student_enrollment',
      'my_portfolios',
      'teacher',
      'students',
      'classes',
      'timetable',
      'calendar',
      'exams',
      'syllabus',
      'lessonplan',
      'assessment',
      'result_analysis_vi_xii',
      'result_analysis_vi_x',
      'result_analysis_xi_xii',
      'student_observations',
      'remedial_exemplary_20_21',
      'remedial_teaching_20',
      'remedial_20a',
      'remedial_20b',
      'remedial_20c',
      'exemplary_21',
      'institutional_meetings_22_24',
      'ptm_meeting_22',
      'staff_meeting_23',
      'subject_meeting_24',
      'pedagogical_28_30',
      'inspection',
      'reports',
      'tickets',
      'settings',
      // Foundational-specific routes
      'monitoring',
      'nipun',
      'staff_meeting',
      'subject_meeting',
      'ptm_meeting',
      'scholastic_primary',
      'scholastic_1_2',
      'notebook_3_5',
      'sea_3_5',
      'scholastic_3_5_t1',
      'scholastic_3_5_t2',
      'result_analysis',
      'orf_tara'
    ];
    return allowedTabs.includes(tabKey);
  }

  return false;
}

export function getRoleBadgeInfo(role: UserRole, designation?: TeacherDesignation): { label: string; bg: string; text: string; border: string; icon: string } {
  switch (role) {
    case 'admin':
      return {
        label: designation || 'Principal / Admin',
        bg: 'bg-rose-500/20',
        text: 'text-rose-300',
        border: 'border-rose-500/40',
        icon: '🏛️'
      };
    case 'data_entry_manager':
      return {
        label: 'Data Entry Manager',
        bg: 'bg-amber-500/20',
        text: 'text-amber-300',
        border: 'border-amber-500/40',
        icon: '📊'
      };
    case 'teacher':
      return {
        label: designation ? `${designation}` : 'Teacher',
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-300',
        border: 'border-emerald-500/40',
        icon: designation?.includes('PGT') ? '🎓' : designation?.includes('TGT') ? '🔬' : '🍎'
      };
  }
}
