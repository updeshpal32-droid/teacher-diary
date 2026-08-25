import {
  TimetableSlot,
  ProxyDutyAssignment,
  SubjectResponsibilityAssignment,
  TeacherAttendanceRecord,
  LeaveApplication,
  OnDutyRecord,
  TeacherTask,
  HourlyActivity,
  CampusDutyAssignment
} from '../types/academic';
import { normalizeFacultyKey, checkTeacherAbsenceOnDate } from './attendanceAbsenceEngine';
import { getDayOfWeekFromDate } from './activeDateContext';

export interface UnifiedTeachingPeriod {
  id: string;
  periodNumber: number;
  timeSlot: string; // e.g. "07:50 AM - 08:30 AM"
  startTime: string; // "07:50"
  endTime: string; // "08:30"
  durationMinutes: number; // 40
  className: string; // "V-A"
  section: string; // "A"
  subjectName: string; // "Hindi", "TWAU", "English", etc.
  roomNo?: string;
  isProxy?: boolean;
  isArrangement?: boolean;
  absentTeacherName?: string;
  absentTeacherCode?: string;
  arrangementReason?: string;
  isSupportSubject?: boolean;
  originalSubject?: string;
  supportType?: string;
  supportRoleNote?: string;
  assignedTeacherName?: string;
  assignedTeacherCode?: string;
}

export const DEFAULT_PERIOD_TIMINGS: Record<number, { start: string; end: string; slot: string; label: string }> = {
  1: { start: '07:50', end: '08:30', slot: '07:50 AM - 08:30 AM', label: 'Period 1' },
  2: { start: '08:30', end: '09:10', slot: '08:30 AM - 09:10 AM', label: 'Period 2' },
  3: { start: '09:10', end: '09:50', slot: '09:10 AM - 09:50 AM', label: 'Period 3' },
  4: { start: '09:50', end: '10:30', slot: '09:50 AM - 10:30 AM', label: 'Period 4' },
  5: { start: '11:00', end: '11:40', slot: '11:00 AM - 11:40 AM', label: 'Period 5' },
  6: { start: '11:40', end: '12:20', slot: '11:40 AM - 12:20 PM', label: 'Period 6' },
  7: { start: '12:20', end: '13:00', slot: '12:20 PM - 01:00 PM', label: 'Period 7' },
  8: { start: '13:00', end: '13:40', slot: '01:00 PM - 01:40 PM', label: 'Period 8' },
  9: { start: '13:40', end: '14:20', slot: '01:40 PM - 02:20 PM', label: 'Period 9' }
};

export function normalizeDateStr(d?: string | null): string {
  if (!d) return '';
  const clean = d.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const parts = clean.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  try {
    const dt = new Date(clean);
    if (!isNaN(dt.getTime())) {
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch (_) {}
  return clean;
}

/**
 * Calculates a teacher's exact, unified teaching periods for any given calendar date.
 * Combines:
 * 1. Master timetable regular periods (filtered by presence / half-day absence)
 * 2. Academic Support / Co-Teaching subject responsibilities (re-labeling the teacher's own slots)
 * 3. Confirmed proxy substitution periods assigned to this teacher on that date
 */
export function getUnifiedTeachingPeriodsForTeacher({
  staff,
  targetDate,
  timetable = [],
  proxyAssignments = [],
  subjectResponsibilities = [],
  attendanceRecords = [],
  leaveApplications = [],
  onDutyRecords = [],
  periodTimings = {}
}: {
  staff?: { employeeCode?: string; name?: string; primarySubject?: string; classesAndSubjectsTaught?: string } | null;
  targetDate: string; // YYYY-MM-DD
  timetable: TimetableSlot[];
  proxyAssignments?: ProxyDutyAssignment[];
  subjectResponsibilities?: SubjectResponsibilityAssignment[];
  attendanceRecords?: TeacherAttendanceRecord[];
  leaveApplications?: LeaveApplication[];
  onDutyRecords?: OnDutyRecord[];
  periodTimings?: Record<number, { time: string; label: string }>;
}): UnifiedTeachingPeriod[] {
  if (!staff || !targetDate) return [];

  const canonicalTargetDate = normalizeDateStr(targetDate);
  const dayName = getDayOfWeekFromDate(canonicalTargetDate);
  if (!dayName || dayName === 'Sunday') return [];

  const empCode = (staff.employeeCode || '').trim();
  const staffName = (staff.name || '').trim();
  const staffKey = normalizeFacultyKey(staffName);

  // Check absence / leave status for this teacher on target date
  const absence = checkTeacherAbsenceOnDate(
    empCode,
    canonicalTargetDate,
    attendanceRecords,
    leaveApplications,
    onDutyRecords,
    staffName
  );

  // If full day absent or on leave, teacher has no teaching periods (their periods become proxy requirements)
  if (absence.isAbsent && !absence.halfDay) {
    return [];
  }

  const daySlots = timetable.filter(t => (t.dayOfWeek || t.day || '').trim().toLowerCase() === dayName.toLowerCase());

  // 1. Filter active subject responsibilities for this teacher
  const myActiveSR = subjectResponsibilities.filter(sra => {
    if (sra.status !== 'Active') return false;
    const sraEmp = (sra.employeeCode || '').trim().toLowerCase();
    const empMatch = empCode && sraEmp && (empCode.toLowerCase() === sraEmp || sraEmp.includes(empCode.toLowerCase()) || empCode.toLowerCase().includes(sraEmp));
    const nameMatch = staffKey && sra.teacherName && normalizeFacultyKey(sra.teacherName) === staffKey;
    if (!empMatch && !nameMatch) return false;

    if (sra.assignmentType === 'Specific Period') {
      if (sra.fromDate && canonicalTargetDate < sra.fromDate) return false;
      if (sra.toDate && canonicalTargetDate > sra.toDate) return false;
    }
    return true;
  });

  // 2. Direct timetable matching
  const matchingDirectSlots = daySlots.filter(slot => {
    const pNum = Number(slot.period || slot.periodNumber || 1);

    // Half-day leave filtering:
    if (absence.isAbsent && absence.halfDay && absence.halfDaySession) {
      if (absence.halfDaySession === 'First Half' && pNum > 4) return false;
      if (absence.halfDaySession === 'Second Half' && pNum <= 4) return false;
    }

    const slotTeacher = (slot.teacherName || '').toLowerCase();
    const slotSubject = (slot.subjectName || '').toLowerCase();
    const slotClass = (slot.className || '').trim();

    // Priority 0: Direct Employee Code match
    if (empCode && (slot.teacherId === empCode || (slot as any).teacherEmployeeCode === empCode)) {
      return true;
    }

    // Priority 1: Direct or Substring match
    if (slotTeacher && staffName && (slotTeacher.includes(staffName.toLowerCase()) || staffName.toLowerCase().includes(slotTeacher))) {
      return true;
    }

    // Priority 2: Clean normalized faculty key match
    const cleanSlotTeacher = normalizeFacultyKey(slotTeacher);
    if (cleanSlotTeacher && staffKey && (cleanSlotTeacher === staffKey || cleanSlotTeacher.includes(staffKey) || staffKey.includes(cleanSlotTeacher))) {
      return true;
    }

    // Priority 3: Primary Teacher / In-Charge Subject Responsibility ONLY (e.g. Sipika Patel for Odia)
    const matchingPrimarySR = myActiveSR.find(sra => {
      if (sra.supportType !== 'Primary Teacher / In-Charge') return false;
      const slotCleanClass = slotClass.toLowerCase().replace('class ', '').trim();
      const sraCleanClass = sra.className.toLowerCase().replace('class ', '').trim();
      const classMatch = slotCleanClass === sraCleanClass || slotCleanClass.includes(sraCleanClass) || sraCleanClass.includes(slotCleanClass) || sraCleanClass.includes('to');
      const subjMatch = sra.subjectName && (slotSubject.includes(sra.subjectName.toLowerCase()) || sra.subjectName.toLowerCase().includes(slotSubject));
      return classMatch && subjMatch && (!slotTeacher || slotTeacher.includes('assigned') || slotTeacher.includes('odia'));
    });

    return !matchingPrimarySR ? false : true;
  });

  const periodMap = new Map<number, UnifiedTeachingPeriod>();

  // Populate direct slots and re-label for Academic Support / Co-Teaching
  for (const slot of matchingDirectSlots) {
    const pNum = Number(slot.period || slot.periodNumber || 1);
    if (!periodMap.has(pNum)) {
      const defaultTiming = DEFAULT_PERIOD_TIMINGS[pNum] || { start: '09:00', end: '09:40', slot: `Period ${pNum}`, label: `Period ${pNum}` };
      const customSlotText = periodTimings[pNum]?.time || defaultTiming.slot;

      let periodObj: UnifiedTeachingPeriod = {
        id: `period-${canonicalTargetDate}-p${pNum}`,
        periodNumber: pNum,
        timeSlot: customSlotText,
        startTime: defaultTiming.start,
        endTime: defaultTiming.end,
        durationMinutes: 40,
        className: slot.className,
        section: slot.section || 'A',
        subjectName: slot.subjectName,
        roomNo: slot.roomNo || `Classroom ${slot.className}`,
        isProxy: false,
        isArrangement: false,
        isSupportSubject: false,
        assignedTeacherName: staffName,
        assignedTeacherCode: empCode
      };

      // Check for Academic Support / Co-Teaching on this teacher's own period
      const supportAssignment = myActiveSR.find(sra => {
        if (sra.supportType !== 'Academic Support / Co-Teaching') return false;
        const slotCleanClass = (slot.className || '').toLowerCase().replace('class ', '').trim();
        const sraCleanClass = sra.className.toLowerCase().replace('class ', '').trim();
        return slotCleanClass === sraCleanClass || slotCleanClass.includes(sraCleanClass) || sraCleanClass.includes(slotCleanClass);
      });

      if (supportAssignment) {
        periodObj = {
          ...periodObj,
          originalSubject: slot.subjectName,
          subjectName: supportAssignment.subjectName,
          isSupportSubject: true,
          supportType: supportAssignment.supportType,
          supportRoleNote: supportAssignment.roleNote
        };
      }

      periodMap.set(pNum, periodObj);
    }
  }

  // 3. Confirmed Proxy Substitutions Assigned to this Teacher on target date
  const myProxies = proxyAssignments.filter(p => {
    const matchDate = normalizeDateStr(p.date) === canonicalTargetDate;
    const matchStatus = p.status === 'Assigned' || p.status === 'Acknowledged' || p.status === 'Completed' || (p.status as any) === 'Confirmed' || !p.status;
    const subEmp = (p.substituteTeacherCode || '').trim().toLowerCase();
    const subName = (p.substituteTeacherName || '').trim();
    const subKey = normalizeFacultyKey(subName);

    const matchSubstitute =
      (empCode && subEmp && (empCode.toLowerCase() === subEmp || subEmp.includes(empCode.toLowerCase()) || empCode.toLowerCase().includes(subEmp))) ||
      (staffKey && subKey && (staffKey === subKey || staffKey.includes(subKey) || subKey.includes(staffKey)));

    return matchDate && matchStatus && matchSubstitute;
  });

  for (const proxy of myProxies) {
    const pNum = Number(proxy.periodNumber || 1);
    const defaultTiming = DEFAULT_PERIOD_TIMINGS[pNum] || { start: '09:00', end: '09:40', slot: `Period ${pNum}`, label: `Period ${pNum}` };
    const customSlotText = periodTimings[pNum]?.time || defaultTiming.slot;

    periodMap.set(pNum, {
      id: `proxy-${canonicalTargetDate}-${proxy.id || pNum}`,
      periodNumber: pNum,
      timeSlot: customSlotText,
      startTime: defaultTiming.start,
      endTime: defaultTiming.end,
      durationMinutes: 40,
      className: proxy.className,
      section: proxy.section || 'A',
      subjectName: proxy.subjectName,
      roomNo: proxy.roomNo || `Classroom ${proxy.className}`,
      isProxy: true,
      isArrangement: true,
      absentTeacherName: proxy.absentTeacherName,
      absentTeacherCode: proxy.absentTeacherCode,
      arrangementReason: proxy.absenceReason || 'Leave',
      isSupportSubject: false,
      assignedTeacherName: staffName,
      assignedTeacherCode: empCode
    });
  }

  return Array.from(periodMap.values()).sort((a, b) => a.periodNumber - b.periodNumber);
}

/**
 * Converts unified teaching periods into top-priority action items/tasks for the teacher.
 * Merges with existing tasks, preserving completion status.
 */
export function convertTeachingPeriodsToTasks(
  periods: UnifiedTeachingPeriod[],
  targetDate: string,
  existingTasks: TeacherTask[] = []
): TeacherTask[] {
  const canonicalDate = normalizeDateStr(targetDate);
  const nowIso = new Date().toISOString();

  return periods.map(period => {
    const taskId = `task-teaching-${canonicalDate}-p${period.periodNumber}`;
    const existing = existingTasks.find(t => t.id === taskId);

    let title = `Teach ${period.subjectName} – Class ${period.className} (Period ${period.periodNumber})`;
    let description = `Curriculum transaction, board illustration, interactive discussion, student activity, and notebook checking for Class ${period.className} ${period.subjectName}.`;

    if (period.isProxy) {
      title = `Proxy: ${period.subjectName} – Class ${period.className} (for ${period.absentTeacherName || 'Absent Teacher'})`;
      description = `Substitution duty for ${period.absentTeacherName || 'absent teacher'} (${period.arrangementReason || 'Leave'}). Maintain classroom decorum and conduct academic engagement.`;
    } else if (period.isSupportSubject) {
      title = `Academic Support: ${period.subjectName} – Class ${period.className} (Period ${period.periodNumber})`;
      description = `Class ${period.className} ${period.subjectName} support during ${period.originalSubject || 'specialist'} period as per Academic Plan. Focus on loud reading and neat handwriting drills.`;
    }

    const tags = ['Teaching', `Period ${period.periodNumber}`];
    if (period.isProxy) tags.push('Proxy Substitution');
    if (period.isSupportSubject) tags.push('Academic Support');

    return {
      id: taskId,
      title: existing?.title || title,
      description: existing?.description || description,
      category: 'Teaching',
      priority: 'Do First (Urgent & Important)',
      status: existing?.status || 'Pending',
      dueDate: canonicalDate,
      dueTime: period.startTime,
      estimatedMinutes: 40,
      subtasks: existing?.subtasks || [
        { id: `sub-1-${taskId}`, title: 'Classroom entry & attendance verification', completed: existing?.status === 'Completed' },
        { id: `sub-2-${taskId}`, title: 'Subject curriculum transaction & student activities', completed: existing?.status === 'Completed' },
        { id: `sub-3-${taskId}`, title: 'Notebook correction & homework assignment', completed: existing?.status === 'Completed' }
      ],
      tags,
      isTopPriority: true,
      linkedClass: period.className,
      linkedSubject: period.subjectName,
      overloadImpact: false,
      assignedBy: period.isProxy ? 'Principal / Timetable Incharge' : 'Timetable Master Schedule',
      assignedByRole: period.isProxy ? 'Principal' : 'Self',
      createdAt: existing?.createdAt || nowIso,
      updatedAt: existing?.updatedAt || nowIso
    };
  });
}

/**
 * Converts unified teaching periods into 40-minute Hourly Activity timeline blocks.
 */
export function convertTeachingPeriodsToHourlyActivities(
  periods: UnifiedTeachingPeriod[],
  targetDate: string,
  staff?: { employeeCode?: string; name?: string } | null
): HourlyActivity[] {
  const canonicalDate = normalizeDateStr(targetDate);
  const empCode = staff?.employeeCode || 'TCH';

  const makeIso = (timeStr: string) => {
    const [h, m] = (timeStr || '09:00').split(':');
    return `${canonicalDate}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00.000Z`;
  };

  return periods.map(period => {
    let title = `Class ${period.className} ${period.subjectName} (Period ${period.periodNumber})`;
    let description = `Conducted curriculum transaction, interactive chalkboard drills, and student notebook correction in ${period.roomNo || `Class ${period.className}`}.`;

    if (period.isProxy) {
      title = `Proxy Period ${period.periodNumber}: Class ${period.className} (${period.subjectName})`;
      description = `Substitution duty in Class ${period.className} for ${period.absentTeacherName || 'absent teacher'} (${period.arrangementReason || 'Leave'}).`;
    } else if (period.isSupportSubject) {
      title = `Academic Support: Class ${period.className} (${period.subjectName})`;
      description = `Class ${period.className} ${period.subjectName} support during ${period.originalSubject || 'regular'} slot as per Academic Plan.`;
    }

    return {
      id: `act-period-${canonicalDate}-${empCode}-p${period.periodNumber}`,
      date: canonicalDate,
      startTime: period.startTime,
      endTime: period.endTime,
      title,
      description,
      category: 'Teaching',
      status: 'Done',
      priority: 'Do First (Urgent & Important)',
      className: period.className,
      subjectName: period.subjectName,
      isOverlappingDuty: false,
      evidenceIds: [],
      kanbanColumn: 'Completed',
      createdAt: makeIso(period.startTime),
      updatedAt: makeIso(period.endTime)
    };
  });
}

/**
 * Checks if a proposed non-teaching time range overlaps with any protected teaching period.
 * Returns overlap info.
 */
export function checkTeachingPeriodOverlap(
  startTime: string, // "11:15"
  endTime: string, // "12:00"
  teachingPeriods: UnifiedTeachingPeriod[]
): { hasOverlap: boolean; overlappingPeriod?: UnifiedTeachingPeriod } {
  if (!startTime || !endTime || !teachingPeriods || teachingPeriods.length === 0) {
    return { hasOverlap: false };
  }

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const reqStart = toMinutes(startTime);
  const reqEnd = toMinutes(endTime);
  if (isNaN(reqStart) || isNaN(reqEnd) || reqEnd <= reqStart) {
    return { hasOverlap: false };
  }

  for (const period of teachingPeriods) {
    const pStart = toMinutes(period.startTime);
    const pEnd = toMinutes(period.endTime);

    // Overlap condition: max(reqStart, pStart) < min(reqEnd, pEnd)
    if (Math.max(reqStart, pStart) < Math.min(reqEnd, pEnd)) {
      return {
        hasOverlap: true,
        overlappingPeriod: period
      };
    }
  }

  return { hasOverlap: false };
}

/**
 * Converts campus duties (Morning Gate, Recess, Afternoon Gate) into authentic tasks for this teacher.
 */
export function convertCampusDutiesToTasks(
  campusDuties: CampusDutyAssignment[] = [],
  targetDate: string,
  staff?: { employeeCode?: string; name?: string } | null,
  existingTasks: TeacherTask[] = []
): TeacherTask[] {
  if (!staff || !targetDate) return [];
  const canonicalDate = normalizeDateStr(targetDate);
  const dayName = getDayOfWeekFromDate(canonicalDate);
  if (!dayName || dayName === 'Sunday') return [];

  const empCode = (staff.employeeCode || '').trim();
  const staffName = (staff.name || '').trim();
  const staffKey = normalizeFacultyKey(staffName);
  const staffNameLower = staffName.toLowerCase();

  const isAssigned = (dutyType: string) => {
    return campusDuties.some(d => {
      const isDay = (d.dayOfWeek || '').toLowerCase() === dayName.toLowerCase() || (d.date && normalizeDateStr(d.date) === canonicalDate);
      const isType = d.dutyType === dutyType;
      const dEmp = (d.teacherEmployeeCode || '').trim();
      const dName = (d.teacherName || '').trim();
      const dKey = normalizeFacultyKey(dName);

      const matchEmp = empCode && dEmp && (empCode.toLowerCase() === dEmp.toLowerCase());
      const matchName = (staffKey && dKey && staffKey === dKey) || (dName && staffNameLower && dName.toLowerCase().includes(staffNameLower));

      return isDay && isType && (matchEmp || matchName);
    });
  };

  const tasks: TeacherTask[] = [];
  const nowIso = new Date().toISOString();

  // 1. Morning Gate & Assembly Duty (07:15 - 07:50 AM)
  const isPhysEdOrAssemblyLead = staffNameLower.includes('updesh') || staffNameLower.includes('hemananda') || isAssigned('Morning Gate & Assembly');
  if (isPhysEdOrAssemblyLead) {
    const taskId = `task-gate-morning-${canonicalDate}-${empCode || '01'}`;
    const existing = existingTasks.find(t => t.id === taskId);
    tasks.push({
      id: taskId,
      title: existing?.title || 'Morning School Assembly & Gate / Student Discipline Duty',
      description: existing?.description || 'Supervise morning arrival gate, student uniform verification, house assembly march past lines, prayer, and National Anthem.',
      category: 'Assembly & Duty',
      priority: 'Do First (Urgent & Important)',
      status: existing?.status || 'Pending',
      dueDate: canonicalDate,
      dueTime: '07:15',
      estimatedMinutes: 35,
      subtasks: existing?.subtasks || [
        { id: `st-gate-1-${taskId}`, title: 'Main gate student arrival monitoring & late-comer log', completed: existing?.status === 'Completed' },
        { id: `st-gate-2-${taskId}`, title: 'Assembly prayer ground microphone check & line order', completed: existing?.status === 'Completed' }
      ],
      tags: ['Campus Duty', 'Morning Assembly', 'Discipline'],
      isTopPriority: true,
      overloadImpact: false,
      assignedBy: 'Principal / Senior Teacher',
      assignedByRole: 'Principal',
      createdAt: existing?.createdAt || nowIso,
      updatedAt: existing?.updatedAt || nowIso
    });
  }

  // 2. Recess & Playground Duty (10:30 - 11:00 AM)
  const isRecessAssigned = isAssigned('Recess & Playground') || dayName === 'Monday' || dayName === 'Friday';
  if (isRecessAssigned) {
    const taskId = `task-recess-${canonicalDate}-${empCode || '01'}`;
    const existing = existingTasks.find(t => t.id === taskId);
    tasks.push({
      id: taskId,
      title: existing?.title || 'Recess & Mid-Day Meal Campus Supervision Duty',
      description: existing?.description || 'Monitor central corridor safety, clean drinking water stations, mid-day meal cleanliness, and playground vigil during break.',
      category: 'Assembly & Duty',
      priority: 'Schedule (Important & Not Urgent)',
      status: existing?.status || 'Pending',
      dueDate: canonicalDate,
      dueTime: '10:30',
      estimatedMinutes: 30,
      subtasks: existing?.subtasks || [
        { id: `st-rec-1-${taskId}`, title: 'Corridor & staircase student safety supervision', completed: existing?.status === 'Completed' },
        { id: `st-rec-2-${taskId}`, title: 'Playground & water cooler hygiene monitoring', completed: existing?.status === 'Completed' }
      ],
      tags: ['Campus Duty', 'Recess Duty', 'Student Safety'],
      isTopPriority: false,
      overloadImpact: false,
      assignedBy: 'Principal / Discipline Committee',
      assignedByRole: 'Incharge',
      createdAt: existing?.createdAt || nowIso,
      updatedAt: existing?.updatedAt || nowIso
    });
  }

  // 3. Afternoon Gate & Dispersal Duty (14:10 - 14:40)
  if (isAssigned('Afternoon Gate & Dispersal')) {
    const taskId = `task-gate-afternoon-${canonicalDate}-${empCode || '01'}`;
    const existing = existingTasks.find(t => t.id === taskId);
    tasks.push({
      id: taskId,
      title: existing?.title || 'Afternoon Gate Dispersal & Student Bus Safety Supervision',
      description: existing?.description || 'Supervise primary and secondary student dismissal, school bus boarding queues, and pedestrian safety at school gate.',
      category: 'Assembly & Duty',
      priority: 'Do First (Urgent & Important)',
      status: existing?.status || 'Pending',
      dueDate: canonicalDate,
      dueTime: '14:10',
      estimatedMinutes: 30,
      subtasks: existing?.subtasks || [
        { id: `st-aft-1-${taskId}`, title: 'Dismissal order check & primary queue supervision', completed: existing?.status === 'Completed' },
        { id: `st-aft-2-${taskId}`, title: 'Bus departure & main gate exit safety verification', completed: existing?.status === 'Completed' }
      ],
      tags: ['Campus Duty', 'Afternoon Dispersal', 'Bus Safety'],
      isTopPriority: true,
      overloadImpact: false,
      assignedBy: 'Principal / Safety Committee',
      assignedByRole: 'Principal',
      createdAt: existing?.createdAt || nowIso,
      updatedAt: existing?.updatedAt || nowIso
    });
  }

  return tasks;
}

/**
 * Strictly filters non-teaching tasks to only include those belonging to the logged-in teacher.
 * Drops:
 * - Any foreign PROXY DUTY tasks (since all proxies are generated canonically by unified schedule engine)
 * - Any residual 08:00 generic placeholder proxy tasks
 * - Any auto-generated teaching or duty tasks from other dates
 * - Any seed tasks (DEFAULT_TASKS) not assigned to this teacher
 */
export function filterAuthenticTeacherTasks({
  tasks,
  staff,
  activeDate
}: {
  tasks: TeacherTask[];
  staff?: { employeeCode?: string; name?: string; primarySubject?: string; assignedSubjects?: string[] } | null;
  activeDate: string;
}): TeacherTask[] {
  if (!tasks || !Array.isArray(tasks)) return [];

  const empCode = (staff?.employeeCode || '').trim();
  const staffName = (staff?.name || '').trim();
  const staffKey = normalizeFacultyKey(staffName);
  const isUpdesh = empCode === '108894' || staffKey.includes('updesh');

  return tasks.filter(task => {
    const taskTitleLower = (task.title || '').toLowerCase();
    const taskDescLower = (task.description || '').toLowerCase();
    const taskTagsLower = (task.tags || []).map(t => t.toLowerCase());

    // 1. Drop any legacy/residual non-canonical proxy tasks (canonical proxies have id starting with task-teaching-)
    if (
      task.id.startsWith('task-proxy-') ||
      task.id.startsWith('proxy-duty-') ||
      task.id.startsWith('proxy-2026-') ||
      task.category === 'Arrangement / Proxy Duty' ||
      (!task.id.startsWith('task-teaching-') && (
        taskTagsLower.includes('proxy duty') ||
        taskTagsLower.includes('timetable arrangement') ||
        taskTitleLower.includes('proxy duty') ||
        taskTitleLower.startsWith('proxy:')
      ))
    ) {
      return false;
    }

    // 2. Allow authentic teaching, proxy substitution, and campus duty tasks for this teacher to preserve completion status
    if (task.id.startsWith('task-teaching-')) {
      if (!isUpdesh && !taskTitleLower.startsWith('proxy:') && (taskTitleLower.includes('physical education') || taskTitleLower.includes('pe '))) {
        return false;
      }
      return true;
    }

    if (task.id.startsWith('task-gate-') || task.id.startsWith('task-recess-')) {
      return true;
    }

    if (task.id.startsWith('tt-period-') || taskTitleLower.startsWith('campus duty:')) {
      return false;
    }

    // 3. Drop seed DEFAULT_TASKS or foreign subject tasks if logged in as another teacher
    if (!isUpdesh) {
      if (
        task.id === 'tsk-201' || // GeM Portal Science Lab
        task.id === 'tsk-202' || // Grade PT-1 Mathematics
        task.id === 'tsk-204' || // National Sports Meet
        task.id === 'tsk-205' || // Independence Day Parade
        taskTitleLower.includes('physical education') ||
        taskTitleLower.includes('asset register') ||
        taskTitleLower.includes('stock verification') ||
        taskTitleLower.includes('gem portal') ||
        taskTitleLower.includes('sports / rsm') ||
        taskDescLower.includes('physical education') ||
        taskDescLower.includes('asset register') ||
        taskDescLower.includes('stock verification')
      ) {
        return false;
      }
    }

    // 4. Drop manual/AI teaching period tasks if they don't match this teacher's assigned subjects
    if (task.category === 'Teaching' && !task.id.startsWith('task-teaching-')) {
      if (!isUpdesh && (taskTitleLower.includes('physical education') || taskTitleLower.includes('pe '))) {
        return false;
      }
      if (empCode === '102725' && !taskTitleLower.includes('library') && !taskTitleLower.includes('english') && !taskTitleLower.includes('reading') && !taskTitleLower.includes('book')) {
        return false;
      }
    }

    // 5. Verify ownership / assignment of custom tasks
    const assignedToStr = (task.assignedTo || '').trim();
    if (assignedToStr) {
      const assignedLower = assignedToStr.toLowerCase();
      if (assignedLower === 'self' || assignedLower.startsWith('self')) {
        return true;
      }

      const assignedKey = normalizeFacultyKey(assignedToStr);
      if (staffKey && (assignedKey === staffKey || assignedKey.includes(staffKey) || staffKey.includes(assignedKey))) {
        return true;
      }
      if (empCode && assignedToStr.includes(empCode)) {
        return true;
      }

      // If assigned explicitly to another known teacher name, drop it
      const foreignNames = ['hemananda', 'barik', 'updesh', 'manju', 'xess', 'karishma', 'kerketta', 'santosh', 'naik', 'priyabrata', 'padhan', 'sanjukta', 'kujur', 'sipika', 'patel', 'jyoti', 'dhuma', 'samya', 'raha', 'santwana', 'dash', 'gayatri', 'omprakash', 'sharma'];
      const matchesOther = foreignNames.some(fn => assignedLower.includes(fn) && !staffName.toLowerCase().includes(fn));
      if (matchesOther) {
        return false;
      }
    }

    return true;
  });
}
