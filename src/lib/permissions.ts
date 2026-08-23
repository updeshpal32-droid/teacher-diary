import { UserAccount, getStageCategory } from '../types/auth';
import { PortfolioAssignment, PortfolioTemplate, StaffDetailRecord } from '../types/academic';
import { DEFAULT_PORTFOLIO_ASSIGNMENTS, DEFAULT_PORTFOLIO_TEMPLATES } from './portfolioDefaults';

export type TopModuleKey =
  | 'dashboard'
  | 'school'
  | 'staff'
  | 'students'
  | 'roles'
  | 'diary'
  | 'timetable'
  | 'calendar'
  | 'admission'
  | 'office'
  | 'tasks'
  | 'settings';

/**
 * Check if the user has Admin or Data Entry Manager privileges
 */
export function isAdminOrDataManager(user: UserAccount | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'data_entry_manager';
}

/**
 * Check if the user is strictly an Admin
 */
export function isAdmin(user: UserAccount | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin';
}

/**
 * Check if the user is a Class Teacher or Co-Class Teacher of a given class/section
 */
export function isClassTeacherOrCoTeacher(
  user: UserAccount | null | undefined,
  className?: string,
  section?: string
): boolean {
  if (!user) return false;
  if (isAdminOrDataManager(user)) return true;

  const targetClassSection = className && section ? `${className.trim().toUpperCase()}-${section.trim().toUpperCase()}` : (className || '').trim().toUpperCase();

  // Check direct properties
  if (user.isClassTeacherOf) {
    const ctNorm = user.isClassTeacherOf.trim().toUpperCase();
    if (ctNorm === targetClassSection || (className && ctNorm.startsWith(className.trim().toUpperCase()))) {
      return true;
    }
  }

  if (user.isCoClassTeacherOf) {
    const coNorm = user.isCoClassTeacherOf.trim().toUpperCase();
    if (coNorm === targetClassSection || (className && coNorm.startsWith(className.trim().toUpperCase()))) {
      return true;
    }
  }

  // Check assignments array
  if (user.assignments && user.assignments.length > 0 && className) {
    const match = user.assignments.find(a => {
      const aClass = a.className.trim().toUpperCase();
      const aSec = a.section ? a.section.trim().toUpperCase() : '';
      if (section) {
        return a.isClassTeacher && aClass === className.trim().toUpperCase() && aSec === section.trim().toUpperCase();
      }
      return a.isClassTeacher && aClass === className.trim().toUpperCase();
    });
    if (match) return true;
  }

  return false;
}

/**
 * Check if the user is an Incharge, Convenor, Coordinator, or Member of matching committees
 */
export function hasCommitteeInchargeOrMemberAccess(
  user: UserAccount | null | undefined,
  keywords: string[],
  assignments?: PortfolioAssignment[],
  templates?: PortfolioTemplate[]
): boolean {
  if (!user) return false;
  if (isAdminOrDataManager(user)) return true;

  const activeAssignments = (assignments && assignments.length > 0) ? assignments : DEFAULT_PORTFOLIO_ASSIGNMENTS;
  const activeTemplates = (templates && templates.length > 0) ? templates : DEFAULT_PORTFOLIO_TEMPLATES;

  const userCode = (user.employeeCode || '').trim().toLowerCase();
  const userName = (user.name || '').trim().toLowerCase();

  // Find all template IDs matching the keywords
  const matchingTemplateIds = new Set<string>();
  activeTemplates.forEach(t => {
    const nameLower = t.name.toLowerCase();
    const descLower = (t.description || '').toLowerCase();
    const idLower = t.id.toLowerCase();
    const matches = keywords.some(k => {
      const kl = k.toLowerCase();
      return nameLower.includes(kl) || descLower.includes(kl) || idLower.includes(kl);
    });
    if (matches) {
      matchingTemplateIds.add(t.id);
    }
  });

  // Also include keywords directly as possible IDs
  keywords.forEach(k => matchingTemplateIds.add(k.toLowerCase()));

  // Check if user is assigned to any of these
  return activeAssignments.some(a => {
    const aPortId = ((a as any).portfolioId || (a as any).portfolioTemplateId || '').toLowerCase();
    const aEmp = ((a as any).employeeCode || (a as any).teacherEmployeeCode || '').toLowerCase();
    const aName = (a.teacherName || '').toLowerCase();

    const isUser = (userCode && aEmp && userCode === aEmp) || (userName && aName && (aName.includes(userName) || userName.includes(aName)));
    if (!isUser) return false;

    // Check if portfolio matches
    return matchingTemplateIds.has(aPortId) || keywords.some(k => aPortId.includes(k.toLowerCase()));
  });
}

/**
 * Admission module access: Admin, Data Entry Manager, or Admission Committee Incharge/Member
 */
export function hasAdmissionAccess(user: UserAccount | null | undefined, assignments?: PortfolioAssignment[]): boolean {
  return hasCommitteeInchargeOrMemberAccess(
    user,
    ['admission', 'online admission', 'port-admission', 'rte'],
    assignments
  );
}

/**
 * Office module access: Admin, Data Entry Manager, or Office / Administration Committee Incharge/Member
 */
export function hasOfficeAccess(user: UserAccount | null | undefined, assignments?: PortfolioAssignment[]): boolean {
  return hasCommitteeInchargeOrMemberAccess(
    user,
    ['office', 'administration', 'administrative', 'dak', 'service book', 'port-office', 'port-admin'],
    assignments
  );
}

/**
 * Timetable editing access: Admin, Data Entry Manager, or Timetable Committee Incharge/Member
 */
export function hasTimetableEditAccess(user: UserAccount | null | undefined, assignments?: PortfolioAssignment[]): boolean {
  return hasCommitteeInchargeOrMemberAccess(
    user,
    ['timetable', 'time-table', 'time table', 'port-timetable'],
    assignments
  );
}

/**
 * Resolve teacher's eligible stages and smart default stage for Teacher's Diary
 */
export function resolveTeacherDiaryStage(user: UserAccount | null | undefined): {
  defaultStage: 'primary' | 'secondary';
  hasPrimaryPeriods: boolean;
  hasSecondaryPeriods: boolean;
  eligibleStagesDescription: string;
} {
  if (!user) {
    return {
      defaultStage: 'secondary',
      hasPrimaryPeriods: true,
      hasSecondaryPeriods: true,
      eligibleStagesDescription: 'All Stages (Guest / Admin)'
    };
  }

  if (isAdminOrDataManager(user)) {
    return {
      defaultStage: 'secondary',
      hasPrimaryPeriods: true,
      hasSecondaryPeriods: true,
      eligibleStagesDescription: 'All Stages (Administrative)'
    };
  }

  const designation = (user.designation || '').toUpperCase();
  let hasPrimary = false;
  let hasSecondary = false;

  // Check designation base
  if (designation.includes('PRT') || designation.includes('BALVATIKA') || designation.includes('PRIMARY')) {
    hasPrimary = true;
  }
  if (designation.includes('PGT') || designation.includes('TGT') || designation.includes('SECONDARY')) {
    hasSecondary = true;
  }

  // Check assigned classes / periods
  const classes = user.assignedClasses || [];
  const assignments = user.assignments || [];

  const checkClassStr = (c: string) => {
    const cat = getStageCategory(c);
    if (cat === 'foundational' || cat === 'preparatory') hasPrimary = true;
    if (cat === 'middle' || cat === 'secondary' || cat === 'senior_secondary') hasSecondary = true;
  };

  classes.forEach(checkClassStr);
  assignments.forEach(a => checkClassStr(a.className));

  // If no classes or designations found, default to both
  if (!hasPrimary && !hasSecondary) {
    hasPrimary = true;
    hasSecondary = true;
  }

  let defaultStage: 'primary' | 'secondary' = 'secondary';
  if (hasPrimary && !hasSecondary) {
    defaultStage = 'primary';
  } else if (!hasPrimary && hasSecondary) {
    defaultStage = 'secondary';
  } else if (hasPrimary && hasSecondary) {
    // If teaching in both, prefer primary if PRT, otherwise secondary
    defaultStage = (designation.includes('PRT') || designation.includes('BALVATIKA')) ? 'primary' : 'secondary';
  }

  let description = 'Secondary Stage (Classes VI-XII)';
  if (hasPrimary && hasSecondary) {
    description = 'Cross-Stage Faculty (Balvatika–V & VI–XII)';
  } else if (hasPrimary) {
    description = 'Primary Stage (Balvatika–V)';
  }

  return {
    defaultStage,
    hasPrimaryPeriods: hasPrimary,
    hasSecondaryPeriods: hasSecondary,
    eligibleStagesDescription: description
  };
}

/**
 * Filter visible top-level modules based on user role and committee assignments
 */
export function getVisibleTopModules(
  user: UserAccount | null | undefined,
  assignments?: PortfolioAssignment[]
): TopModuleKey[] {
  if (!user || isAdminOrDataManager(user)) {
    // Admin & Data Entry Manager see all modules
    return [
      'dashboard',
      'school',
      'staff',
      'students',
      'roles',
      'diary',
      'timetable',
      'admission',
      'office',
      'tasks'
    ];
  }

  // Normal Teacher visibility rules:
  // 1. Remove School -> Shift Calendar outward
  // 2. Remove Admission & Office unless member/incharge
  const modules: TopModuleKey[] = [
    'dashboard',
    'staff',
    'students',
    'roles',
    'diary',
    'timetable',
    'tasks',
    'calendar' // View-Only Calendar shifted outward
  ];

  if (hasAdmissionAccess(user, assignments)) {
    modules.push('admission');
  }

  if (hasOfficeAccess(user, assignments)) {
    modules.push('office');
  }

  return modules;
}
