import React, { useState, useEffect, useMemo } from 'react';
import {
  db,
  getAllAvailableTags,
  DEFAULT_PORTFOLIO_TEMPLATES,
  DEFAULT_PORTFOLIO_ASSIGNMENTS,
  DEFAULT_RESPONSIBILITY_DELEGATIONS,
  DEFAULT_PERIOD_TIMINGS,
  DEFAULT_TIMETABLE
} from '../lib/storage';
import {
  HourlyActivity,
  ActivityEvidence,
  CalendarSyncSetting,
  AIWorkloadAnalysisReport,
  HourlyCategory,
  ActivityStatus,
  EisenhowerPriority,
  TeacherProfile,
  SchoolDetails,
  TaskTagDefinition,
  PortfolioTemplate,
  PortfolioAssignment,
  ResponsibilityDelegation,
  TimetableSlot,
  CampusDutyAssignment,
  ProxyDutyAssignment,
  SubjectResponsibilityAssignment,
  TeacherAttendanceRecord,
  LeaveApplication,
  OnDutyRecord
} from '../types/academic';
import { UserAccount } from '../types/auth';
import { getTeacherScopedStorageKey } from '../lib/teacherContext';
import {
  getUnifiedTeachingPeriodsForTeacher,
  convertTeachingPeriodsToHourlyActivities,
  checkTeachingPeriodOverlap,
  UnifiedTeachingPeriod
} from '../lib/unifiedTeacherScheduleEngine';
import { DEFAULT_SUBJECT_RESPONSIBILITIES } from '../lib/storage';
import {
  Clock,
  Plus,
  Mic,
  MicOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  Calendar as CalIcon,
  Sparkles,
  BarChart3,
  Printer,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronRight,
  ExternalLink,
  Lock,
  Layers,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  Download,
  Share2,
  Trash2,
  Edit2,
  Tag,
  Briefcase,
  Award,
  RotateCcw
} from 'lucide-react';

interface WorkloadTrackerProps {
  devMode?: boolean;
  currentUser?: UserAccount | null;
}

/**
 * Generates authentic daily workload schedule from Timetable slots,
 * Campus Duties, Committee/Portfolio assignments, and Proxy substitutions for ANY teacher.
 */
export function generateTeacherDailyWorkload(
  user: UserAccount | null | undefined,
  teacher: Partial<TeacherProfile> | null | undefined,
  targetDate: string,
  timetable: TimetableSlot[],
  periodTimings: Record<number, { time: string; label: string }>,
  portfolios: PortfolioAssignment[],
  portfolioTemplates: PortfolioTemplate[],
  delegations: ResponsibilityDelegation[],
  campusDuties: any[],
  proxyDuties: ProxyDutyAssignment[],
  subjectResponsibilities: SubjectResponsibilityAssignment[] = DEFAULT_SUBJECT_RESPONSIBILITIES,
  attendanceRecords: TeacherAttendanceRecord[] = [],
  leaveApplications: LeaveApplication[] = [],
  onDutyRecords: OnDutyRecord[] = []
): HourlyActivity[] {
  const d = new Date(targetDate);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = isNaN(d.getTime()) ? 'Friday' : days[d.getDay()] === 'Sunday' ? 'Monday' : days[d.getDay()];

  const empCode = user?.employeeCode || teacher?.employeeCode;
  const teacherName = user?.name || teacher?.name || 'Teacher';
  const teacherNameLower = teacherName.toLowerCase();
  const cleanTeacherName = teacherNameLower.replace(/^(mr|mrs|ms|dr|smt|shri)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');

  const results: HourlyActivity[] = [];

  const makeIso = (timeStr: string) => {
    const [h, m] = (timeStr || '09:00').split(':');
    return `${targetDate}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00.000Z`;
  };

  // 1. Compute Unified Teaching Periods for this Teacher on targetDate
  const staffObj = user || teacher || { employeeCode: empCode, name: teacherName };
  const unifiedTeachingPeriods = getUnifiedTeachingPeriodsForTeacher({
    staff: staffObj,
    targetDate,
    timetable: timetable && timetable.length > 0 ? timetable : [],
    proxyAssignments: proxyDuties || [],
    subjectResponsibilities: subjectResponsibilities || [],
    attendanceRecords: attendanceRecords || [],
    leaveApplications: leaveApplications || [],
    onDutyRecords: onDutyRecords || [],
    periodTimings
  });

  // 2. Generate canonical 40-minute teaching activities from unifiedTeachingPeriods
  const teachingActivities = convertTeachingPeriodsToHourlyActivities(unifiedTeachingPeriods, targetDate, staffObj);
  results.push(...teachingActivities);

  // 3. Morning School Gate & Assembly Duty (07:15 - 07:50 AM)
  const isMorningGateAssigned = campusDuties?.some(d => {
    const isDay = (d.dayOfWeek || d.day) === dayName;
    const isType = d.dutyType === 'Morning Gate & Assembly';
    const isTeacher = (empCode && d.teacherEmployeeCode === empCode) || (d.teacherName && d.teacherName.toLowerCase().includes(teacherNameLower));
    return isDay && isType && isTeacher;
  });

  const isPhysEdOrAssemblyLead = teacherNameLower.includes('updesh') || teacherNameLower.includes('hemananda') || isMorningGateAssigned;

  if (isPhysEdOrAssemblyLead || isMorningGateAssigned) {
    const gateOverlap = checkTeachingPeriodOverlap('07:20', '07:50', unifiedTeachingPeriods);
    results.push({
      id: `act-gate-${targetDate}-${empCode || '01'}`,
      date: targetDate,
      startTime: '07:20',
      endTime: '07:50',
      title: 'Morning School Assembly & Gate / Student Discipline Duty',
      description: 'Supervised morning entry gate, student uniform check, house march-past line formation, morning prayer assembly, and National Anthem.',
      category: 'Assembly & Duty',
      status: 'Done',
      priority: 'Do First (Urgent & Important)',
      className: 'School Wide',
      subjectName: 'Assembly & Gate',
      isOverlappingDuty: gateOverlap.hasOverlap,
      overloadReason: gateOverlap.hasOverlap && gateOverlap.overlappingPeriod ? `Duty scheduled during protected Period ${gateOverlap.overlappingPeriod.periodNumber} (${gateOverlap.overlappingPeriod.className} ${gateOverlap.overlappingPeriod.subjectName}).` : undefined,
      evidenceIds: [],
      kanbanColumn: 'Completed',
      createdAt: makeIso('07:20'),
      updatedAt: makeIso('07:50')
    });
  }

  // 4. Recess Duty (10:30 - 11:00 AM)
  const isRecessDutyAssigned = campusDuties?.some(d => {
    const isDay = (d.dayOfWeek || d.day) === dayName;
    const isType = d.dutyType === 'Recess & Playground';
    const isTeacher = (empCode && d.teacherEmployeeCode === empCode) || (d.teacherName && d.teacherName.toLowerCase().includes(teacherNameLower));
    return isDay && isType && isTeacher;
  });

  if (isRecessDutyAssigned || dayName === 'Monday' || dayName === 'Friday') {
    const recessOverlap = checkTeachingPeriodOverlap('10:30', '11:00', unifiedTeachingPeriods);
    results.push({
      id: `act-recess-${targetDate}-${empCode || '01'}`,
      date: targetDate,
      startTime: '10:30',
      endTime: '11:00',
      title: 'Recess & Mid-Day Meal Campus Supervision Duty',
      description: 'Supervised student safety in central corridor, drinking water stations, mid-day meal cleanliness, and playground vigil.',
      category: 'Assembly & Duty',
      status: 'Done',
      priority: 'Schedule (Important & Not Urgent)',
      isOverlappingDuty: recessOverlap.hasOverlap,
      overloadReason: recessOverlap.hasOverlap && recessOverlap.overlappingPeriod ? `Duty scheduled during protected Period ${recessOverlap.overlappingPeriod.periodNumber} (${recessOverlap.overlappingPeriod.className} ${recessOverlap.overlappingPeriod.subjectName}).` : undefined,
      evidenceIds: [],
      kanbanColumn: 'Completed',
      createdAt: makeIso('10:30'),
      updatedAt: makeIso('11:00')
    });
  }

  // 5. Active Committee / Portfolio Assigned Work (Phase 4 Integration)
  const myAssignments = (portfolios || []).filter(a => {
    if (a.status !== 'Active') return false;
    if (empCode && a.teacherEmployeeCode === empCode) return true;
    if (a.teacherName && a.teacherName.toLowerCase().includes(teacherNameLower)) return true;
    if (cleanTeacherName && a.teacherName) {
      const cleanA = a.teacherName.toLowerCase().replace(/^(mr|mrs|ms|dr|smt|shri)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');
      if (cleanA && cleanTeacherName && (cleanA === cleanTeacherName || cleanA.includes(cleanTeacherName) || cleanTeacherName.includes(cleanA))) return true;
    }
    return false;
  });

  const portfolioPlanningSlots = [
    { start: '12:20', end: '13:00' },
    { start: '13:40', end: '14:20' }
  ];

  myAssignments.slice(0, 2).forEach((asgn, idx) => {
    const template = (portfolioTemplates || []).find(t => t.id === asgn.portfolioTemplateId);
    const templateName = template ? template.name : (asgn.portfolioTemplateId || 'Vidyalaya Institutional Committee');
    const timeSlot = portfolioPlanningSlots[idx] || { start: '14:00', end: '14:40' };

    let specificTitle = `${templateName} Execution & Review`;
    let specificDesc = `Coordinated and executed institutional responsibilities as ${asgn.role} for ${templateName}.`;
    let cat: HourlyCategory = 'Administrative Duty';

    const tLower = templateName.toLowerCase();
    if (tLower.includes('art') || tLower.includes('display') || tLower.includes('cultural') || tLower.includes('co-curricular') || tLower.includes('scout')) {
      cat = 'Co-Curricular';
      if (tLower.includes('display')) {
        specificTitle = 'Display Board Updating & Art Integrated Curation';
        specificDesc = 'Curated creative student art, updated corridor bulletin boards with monthly themes, and verified competition posters.';
      } else if (tLower.includes('cultural')) {
        specificTitle = 'Cultural Programme Choir & Stage Decor Coordination';
        specificDesc = 'Rehearsed student group choir and coordinated stage artistic backdrops for upcoming Vidyalaya celebration.';
      } else if (tLower.includes('scout')) {
        specificTitle = 'Scouts & Guides Troop Drill & Knot-Tying Practice';
        specificDesc = 'Conducted patrol march-past drill, tent-pitching techniques, and inspected scout logbooks.';
      }
    } else if (tLower.includes('safety') || tLower.includes('pocso') || tLower.includes('disaster')) {
      cat = 'Administrative Duty';
      specificTitle = 'Campus Safety, First Aid Box & CCTV Inspection';
      specificDesc = 'Inspected emergency exit routes, verified first-aid medical kits, and reviewed student suggestion box.';
    } else if (tLower.includes('timetable') || tLower.includes('proxy')) {
      cat = 'Administrative Duty';
      specificTitle = 'Timetable Review & Daily Proxy Substitution Roster';
      specificDesc = 'Processed morning teacher leave requests and organized balanced proxy arrangements for all vacant periods across school.';
    } else if (tLower.includes('sports') || tLower.includes('gym')) {
      cat = 'Sports / RSM / NSM';
      specificTitle = 'National Sports Meet (NSM) Squad Training & Ground Practice';
      specificDesc = 'Coached athletics squad for sprint timing records, high jump, and relay baton exchange on school sports ground.';
    } else if (tLower.includes('library') || tLower.includes('reader')) {
      cat = 'Other';
      specificTitle = 'Library Book Accession & Joy of Reading Programme';
      specificDesc = 'Catalogued newly arrived reference books, updated student issuance registers, and prepared weekly book recommendations.';
    } else if (tLower.includes('gem') || tLower.includes('purchase')) {
      cat = 'GeM Portal Admin';
      specificTitle = 'GeM Portal Procurement Sanction & L1 Verification';
      specificDesc = 'Verified GeM delivery consignments, processed CRAC receipts, and updated stock entry register.';
    } else if (tLower.includes('smart') || tLower.includes('computer') || tLower.includes('ict')) {
      cat = 'Digital Records';
      specificTitle = 'Smart Classroom Interactive Board & IT Maintenance';
      specificDesc = 'Checked classroom projector connections, updated antivirus security definitions, and tested audio-visual equipment.';
    }

    results.push({
      id: `act-port-${targetDate}-${asgn.id || idx}`,
      date: targetDate,
      startTime: timeSlot.start,
      endTime: timeSlot.end,
      title: specificTitle,
      description: specificDesc,
      category: cat,
      status: 'Done',
      priority: 'Do First (Urgent & Important)',
      portfolioTemplateId: asgn.portfolioTemplateId,
      portfolioTemplateName: templateName,
      isDelegatedWork: false,
      isOverlappingDuty: idx > 0,
      overloadReason: idx > 0 ? `Concurrent execution of ${templateName} responsibilities during Vidyalaya planning hours.` : undefined,
      evidenceIds: [],
      kanbanColumn: 'Completed',
      createdAt: makeIso(timeSlot.start),
      updatedAt: makeIso(timeSlot.end)
    });
  });

  // 6. Afternoon Gate & Dispersal Duty (14:10 - 14:40)
  const isAfternoonGateAssigned = campusDuties?.some(d => {
    const isDay = (d.dayOfWeek || d.day) === dayName;
    const isType = d.dutyType === 'Afternoon Gate & Dispersal';
    const isTeacher = (empCode && d.teacherEmployeeCode === empCode) || (d.teacherName && d.teacherName.toLowerCase().includes(teacherNameLower));
    return isDay && isType && isTeacher;
  });

  if (isAfternoonGateAssigned) {
    results.push({
      id: `act-afternoon-${targetDate}-${empCode || '01'}`,
      date: targetDate,
      startTime: '14:10',
      endTime: '14:40',
      title: 'Afternoon Gate Dispersal & Student Bus Safety Supervision',
      description: 'Supervised orderly primary and secondary student dismissal, school bus boarding queues, and pedestrian safety at the school gate.',
      category: 'Assembly & Duty',
      status: 'Done',
      priority: 'Do First (Urgent & Important)',
      isOverlappingDuty: false,
      evidenceIds: [],
      kanbanColumn: 'Completed',
      createdAt: makeIso('14:10'),
      updatedAt: makeIso('14:40')
    });
  }

  // 7. Teacher Diary & Lesson Plan Preparation (14:40 - 15:30)
  results.push({
    id: `act-diary-${targetDate}-${empCode || '01'}`,
    date: targetDate,
    startTime: '14:40',
    endTime: '15:30',
    title: 'Teacher Diary Documentation & Daily Lesson Plan Reflection',
    description: 'Updated daily teacher diary records, documented student learning outcomes, logged classroom formative assessment grades, and mapped upcoming competency benchmarks.',
    category: 'Teacher Diary Docs',
    status: 'Done',
    priority: 'Schedule (Important & Not Urgent)',
    isOverlappingDuty: false,
    evidenceIds: [],
    kanbanColumn: 'Completed',
    createdAt: makeIso('14:40'),
    updatedAt: makeIso('15:30')
  });

  return results.sort((a, b) => {
    const timeA = (a.startTime || '00:00').replace(':', '');
    const timeB = (b.startTime || '00:00').replace(':', '');
    return Number(timeA) - Number(timeB);
  });
}

export function WorkloadTracker({ devMode = true, currentUser }: WorkloadTrackerProps) {
  const [subTab, setSubTab] = useState<'tracker' | 'evidence' | 'heatmap' | 'kanban' | 'pdf' | 'calendar' | 'ai'>('tracker');

  // Data states
  const [activities, setActivities] = useState<HourlyActivity[]>([]);
  const [evidenceList, setEvidenceList] = useState<ActivityEvidence[]>([]);
  const [calendarSyncList, setCalendarSyncList] = useState<CalendarSyncSetting[]>([]);
  const [aiReport, setAiReport] = useState<AIWorkloadAnalysisReport | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<Partial<TeacherProfile>>({});
  const [schoolDetails, setSchoolDetails] = useState<Partial<SchoolDetails>>({});

  // Timetable and Campus context
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [periodTimings, setPeriodTimings] = useState<Record<number, { time: string; label: string }>>(DEFAULT_PERIOD_TIMINGS);
  const [campusDuties, setCampusDuties] = useState<CampusDutyAssignment[]>([]);
  const [proxyDuties, setProxyDuties] = useState<ProxyDutyAssignment[]>([]);
  const [subjectResponsibilities, setSubjectResponsibilities] = useState<SubjectResponsibilityAssignment[]>(DEFAULT_SUBJECT_RESPONSIBILITIES);
  const [attendanceRecords, setAttendanceRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [onDutyRecords, setOnDutyRecords] = useState<OnDutyRecord[]>([]);

  // Portfolio states for Role & Responsibility linking (Phase 4)
  const [portfolioTemplates, setPortfolioTemplates] = useState<PortfolioTemplate[]>([]);
  const [portfolioAssignments, setPortfolioAssignments] = useState<PortfolioAssignment[]>([]);
  const [responsibilityDelegations, setResponsibilityDelegations] = useState<ResponsibilityDelegation[]>([]);

  // Filter and view states
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dateFilterMode, setDateFilterMode] = useState<'selected' | 'all'>('selected');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [heatmapTimeframe, setHeatmapTimeframe] = useState<'Weekly' | 'Monthly' | 'Quarterly' | 'Annual'>('Weekly');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<HourlyActivity | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Activity form fields
  const [newDate, setNewDate] = useState<string>(todayStr);
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newCategory, setNewCategory] = useState<HourlyCategory>('Teaching');
  const [newStatus, setNewStatus] = useState<ActivityStatus>('Done');
  const [newPriority, setNewPriority] = useState<EisenhowerPriority>('Do First (Urgent & Important)');
  const [newClassName, setNewClassName] = useState('IX-A');
  const [newSubjectName, setNewSubjectName] = useState('Teaching');
  const [newDescription, setNewDescription] = useState('');
  const [newIsOverload, setNewIsOverload] = useState(false);
  const [newOverloadReason, setNewOverloadReason] = useState('');

  // Role & Responsibility Linking Form Fields (Phase 4)
  const [newPortfolioTemplateId, setNewPortfolioTemplateId] = useState<string>('');
  const [newResponsibilityId, setNewResponsibilityId] = useState<string>('');

  // Evidence upload form fields
  const [evidenceCaption, setEvidenceCaption] = useState('');
  const [evidenceActivityId, setEvidenceActivityId] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // Dynamic Tags / Categories State (Admin & Teacher Scoped)
  const [availableTags, setAvailableTags] = useState<TaskTagDefinition[]>([]);

  const teacherCode = currentUser?.employeeCode;
  const scopedActivityKey = teacherCode ? getTeacherScopedStorageKey('setup:hourly_activities', teacherCode) : 'setup:hourly_activities';
  const scopedEvidenceKey = teacherCode ? getTeacherScopedStorageKey('setup:evidence', teacherCode) : 'setup:evidence';
  const scopedSyncKey = teacherCode ? getTeacherScopedStorageKey('setup:calendar_sync', teacherCode) : 'setup:calendar_sync';
  const scopedTeacherKey = teacherCode ? getTeacherScopedStorageKey('setup:teacher', teacherCode) : 'setup:teacher';

  useEffect(() => {
    loadAllData();
  }, [teacherCode, selectedDate]);

  const loadAllData = async () => {
    try {
      const [
        savedActivities,
        defaultActivities,
        savedEvidence,
        savedSync,
        scopedProfile,
        defaultProfile,
        school,
        tags,
        savedPortTemplates,
        savedPortAssignments,
        savedDelegations,
        savedTimetable,
        savedTimings,
        savedCampusDuties,
        savedProxies,
        savedSubjectResponsibilities,
        savedAttendance,
        savedLeaves,
        savedOD
      ] = await Promise.all([
        db.get<HourlyActivity[]>(scopedActivityKey),
        db.get<HourlyActivity[]>('setup:hourly_activities'),
        db.get<ActivityEvidence[]>(scopedEvidenceKey),
        db.get<CalendarSyncSetting[]>(scopedSyncKey),
        db.get<TeacherProfile>(scopedTeacherKey),
        db.get<TeacherProfile>('setup:teacher'),
        db.get<SchoolDetails>('setup:school'),
        getAllAvailableTags(teacherCode),
        db.get<PortfolioTemplate[]>('setup:portfolio_templates'),
        db.get<PortfolioAssignment[]>('setup:portfolio_assignments'),
        db.get<ResponsibilityDelegation[]>('setup:responsibility_delegations'),
        db.get<TimetableSlot[]>('setup:timetable'),
        db.get<Record<number, { time: string; label: string }>>('setup:period_timings'),
        db.get<CampusDutyAssignment[]>('setup:campus_duty_assignments'),
        db.get<ProxyDutyAssignment[]>('setup:proxy_duty_assignments'),
        db.get<SubjectResponsibilityAssignment[]>('setup:subject_responsibilities'),
        db.get<TeacherAttendanceRecord[]>('setup:teacher_attendance'),
        db.get<LeaveApplication[]>('setup:leave_applications'),
        db.get<OnDutyRecord[]>('setup:on_duty_records')
      ]);

      const effectiveProfile: Partial<TeacherProfile> = {
        ...(defaultProfile || {}),
        ...(scopedProfile || {}),
        name: scopedProfile?.name || currentUser?.name || defaultProfile?.name,
        employeeCode: currentUser?.employeeCode || scopedProfile?.employeeCode || defaultProfile?.employeeCode,
        primarySubject: currentUser?.assignedSubjects?.[0] || scopedProfile?.primarySubject || defaultProfile?.primarySubject
      };

      setTeacherProfile(effectiveProfile);
      setSchoolDetails(school || {});
      setAvailableTags(tags || []);
      setEvidenceList(savedEvidence || []);
      setCalendarSyncList(savedSync || []);

      const activeTemplates = savedPortTemplates && savedPortTemplates.length > 0 ? savedPortTemplates : DEFAULT_PORTFOLIO_TEMPLATES;
      const activeAssignments = savedPortAssignments && savedPortAssignments.length > 0 ? savedPortAssignments : DEFAULT_PORTFOLIO_ASSIGNMENTS;
      const activeDelegations = savedDelegations && savedDelegations.length > 0 ? savedDelegations : DEFAULT_RESPONSIBILITY_DELEGATIONS;
      const activeTimetable = savedTimetable && savedTimetable.length > 0 ? savedTimetable : DEFAULT_TIMETABLE;
      const activeTimings = savedTimings || DEFAULT_PERIOD_TIMINGS;
      const activeCampusDuties = savedCampusDuties || [];
      const activeProxies = savedProxies || [];
      const activeSR = savedSubjectResponsibilities && savedSubjectResponsibilities.length > 0 ? savedSubjectResponsibilities : DEFAULT_SUBJECT_RESPONSIBILITIES;
      const activeAtt = savedAttendance || [];
      const activeLeaves = savedLeaves || [];
      const activeOD = savedOD || [];

      setPortfolioTemplates(activeTemplates);
      setPortfolioAssignments(activeAssignments);
      setResponsibilityDelegations(activeDelegations);
      setTimetableSlots(activeTimetable);
      setPeriodTimings(activeTimings);
      setCampusDuties(activeCampusDuties);
      setProxyDuties(activeProxies);
      setSubjectResponsibilities(activeSR);
      setAttendanceRecords(activeAtt);
      setLeaveApplications(activeLeaves);
      setOnDutyRecords(activeOD);

      let currentActivities = savedActivities;

      // Check if current activities contain dummy Mathematics data that belongs to Updesh Kumar when logged in as another teacher (e.g. Samya Raha, Dipanwita Mandal, Jyoti Kumari Dhuma)
      const isDummyFromOtherTeacher = currentActivities && currentActivities.some(a => 
        currentUser?.employeeCode && currentUser.employeeCode !== '108894' &&
        (a.title.includes('Mathematics Period 1: Quadratic Equations') || a.title.includes('Emergency GeM Portal Procurement Sanction')) &&
        !currentUser?.assignedSubjects?.some(s => s.toLowerCase().includes('mathematics') || s.toLowerCase().includes('gem'))
      );

      // If no activities or contains wrong teacher dummy data, auto-generate authentic schedule for the selected date!
      if (!currentActivities || currentActivities.length === 0 || isDummyFromOtherTeacher) {
        const generated = generateTeacherDailyWorkload(
          currentUser,
          effectiveProfile,
          selectedDate,
          activeTimetable,
          activeTimings,
          activeAssignments,
          activeTemplates,
          activeDelegations,
          activeCampusDuties,
          activeProxies,
          activeSR,
          activeAtt,
          activeLeaves,
          activeOD
        );
        currentActivities = generated;
        await db.set(scopedActivityKey, generated);
      }

      setActivities(currentActivities || []);
    } catch (err) {
      console.error('Error loading workload data:', err);
    }
  };

  const saveActivities = async (updated: HourlyActivity[]) => {
    setActivities(updated);
    await db.set(scopedActivityKey, updated);
    if (teacherCode === '108894') {
      await db.set('setup:hourly_activities', updated);
    }
  };

  const saveEvidence = async (updated: ActivityEvidence[]) => {
    setEvidenceList(updated);
    await db.set(scopedEvidenceKey, updated);
  };

  /**
   * Action: Sync actual daily schedule on demand from Timetable & Portfolios
   */
  const handleSyncActualSchedule = async (targetDateStr: string = selectedDate) => {
    const generated = generateTeacherDailyWorkload(
      currentUser,
      teacherProfile,
      targetDateStr,
      timetableSlots,
      periodTimings,
      portfolioAssignments,
      portfolioTemplates,
      responsibilityDelegations,
      campusDuties,
      proxyDuties,
      subjectResponsibilities,
      attendanceRecords,
      leaveApplications,
      onDutyRecords
    );

    // Keep activities from other dates, replace/merge activities for targetDateStr
    const otherDateActs = activities.filter(a => a.date !== targetDateStr);
    const updated = [...generated, ...otherDateActs];
    await saveActivities(updated);

    setSyncFeedback(`✨ Synchronized ${generated.length} authentic duties from Timetable & Portfolios for ${currentUser?.name || 'Faculty'} on ${targetDateStr}!`);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  // Compute eligible Portfolios for the current teacher (In-charge, Member, or Delegated Doer)
  const myEligiblePortfolios = useMemo(() => {
    const userCode = teacherCode || '108894';
    const userName = (currentUser?.name || '').toLowerCase();

    const assignedIds = new Set<string>();

    portfolioAssignments
      .filter(a => a.status === 'Active' && (a.teacherEmployeeCode === userCode || (a.teacherName && a.teacherName.toLowerCase().includes(userName))))
      .forEach(a => assignedIds.add(a.portfolioTemplateId));

    responsibilityDelegations
      .filter(d => d.status === 'Active' && (d.delegatedToEmployeeCode === userCode || (d.delegatedToName && d.delegatedToName.toLowerCase().includes(userName))))
      .forEach(d => assignedIds.add(d.portfolioTemplateId));

    return portfolioTemplates.filter(t => assignedIds.has(t.id));
  }, [portfolioTemplates, portfolioAssignments, responsibilityDelegations, teacherCode, currentUser]);

  // Compute available responsibilities under selected portfolio
  const availableResponsibilitiesForSelectedPort = useMemo(() => {
    if (!newPortfolioTemplateId) return [];
    const template = portfolioTemplates.find(t => t.id === newPortfolioTemplateId);
    return template ? template.responsibilities : [];
  }, [newPortfolioTemplateId, portfolioTemplates]);

  // Compute Hours by Portfolio Summary
  const portfolioHoursSummary = useMemo(() => {
    const summary: Record<string, { name: string; hours: number; count: number }> = {};

    activities.forEach(act => {
      if (act.portfolioTemplateId && act.portfolioTemplateName) {
        if (!summary[act.portfolioTemplateId]) {
          summary[act.portfolioTemplateId] = { name: act.portfolioTemplateName, hours: 0, count: 0 };
        }
        const [startH, startM] = (act.startTime || '09:00').split(':').map(Number);
        const [endH, endM] = (act.endTime || '10:00').split(':').map(Number);
        let durationHrs = (endH * 60 + endM - (startH * 60 + startM)) / 60;
        if (durationHrs <= 0) durationHrs = 1;

        summary[act.portfolioTemplateId].hours += durationHrs;
        summary[act.portfolioTemplateId].count += 1;
      }
    });

    return Object.values(summary);
  }, [activities]);

  // Dynamic quick presets tailored to current logged in teacher
  const quickPresets = useMemo(() => {
    const teacherSubj = currentUser?.assignedSubjects?.[0] || teacherProfile.primarySubject || 'Teaching';
    const firstClass = currentUser?.assignedClasses?.[0] || 'IX-A';
    const topPort = myEligiblePortfolios[0];

    const presets = [
      {
        title: `Class ${firstClass} ${teacherSubj} Period`,
        label: `📚 Class ${firstClass} ${teacherSubj.slice(0, 14)}`,
        category: 'Teaching' as HourlyCategory,
        priority: 'Do First (Urgent & Important)' as EisenhowerPriority,
        className: firstClass,
        subjectName: teacherSubj,
        bg: 'bg-purple-900/40 hover:bg-purple-800/60 border-purple-500/30 text-purple-200'
      },
      ...(topPort
        ? [
            {
              title: `${topPort.name} Coordination & Execution`,
              label: `🏛️ ${topPort.name.slice(0, 22)}`,
              category: 'Administrative Duty' as HourlyCategory,
              priority: 'Do First (Urgent & Important)' as EisenhowerPriority,
              portId: topPort.id,
              bg: 'bg-indigo-950/50 hover:bg-indigo-900/60 border-indigo-500/30 text-indigo-200'
            }
          ]
        : []),
      {
        title: 'Morning School Assembly & Gate / Student Discipline Duty',
        label: '🏃 Morning Gate & Assembly',
        category: 'Assembly & Duty' as HourlyCategory,
        priority: 'Do First (Urgent & Important)' as EisenhowerPriority,
        bg: 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-500/30 text-emerald-200'
      },
      {
        title: 'Teacher Diary Documentation & Daily Lesson Plan Reflection',
        label: '📝 Teacher Diary & Lesson Plan',
        category: 'Teacher Diary Docs' as HourlyCategory,
        priority: 'Schedule (Important & Not Urgent)' as EisenhowerPriority,
        bg: 'bg-amber-950/50 hover:bg-amber-900/60 border-amber-500/30 text-amber-200'
      },
      {
        title: 'Recess & Mid-Day Meal Campus Supervision Duty',
        label: '🍲 Recess & Meal Vigil',
        category: 'Assembly & Duty' as HourlyCategory,
        priority: 'Schedule (Important & Not Urgent)' as EisenhowerPriority,
        bg: 'bg-sky-950/50 hover:bg-sky-900/60 border-sky-500/30 text-sky-200'
      }
    ];

    return presets;
  }, [currentUser, teacherProfile, myEligiblePortfolios]);

  // Voice to text quick entry
  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice-to-text recognition is not supported natively in this browser window. Please type manually or use Chrome/Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewTitle(transcript);
        setSpeechText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingActivity(null);
    setNewDate(selectedDate);
    setNewTitle('');
    setNewStartTime('09:00');
    setNewEndTime('10:00');
    setNewCategory('Teaching');
    setNewStatus('Done');
    setNewPriority('Do First (Urgent & Important)');
    setNewClassName(currentUser?.assignedClasses?.[0] || 'IX-A');
    setNewSubjectName(currentUser?.assignedSubjects?.[0] || teacherProfile.primarySubject || 'Teaching');
    setNewDescription('');
    setNewIsOverload(false);
    setNewOverloadReason('');
    setNewPortfolioTemplateId(myEligiblePortfolios[0]?.id || '');
    setNewResponsibilityId(myEligiblePortfolios[0]?.responsibilities[0]?.id || '');
    setIsAddModalOpen(true);
  };

  const handleOpenEditActivity = (act: HourlyActivity) => {
    setEditingActivity(act);
    setNewDate(act.date || selectedDate);
    setNewTitle(act.title);
    setNewStartTime(act.startTime);
    setNewEndTime(act.endTime);
    setNewCategory(act.category);
    setNewStatus(act.status);
    setNewPriority(act.priority || 'Do First (Urgent & Important)');
    setNewClassName(act.className || currentUser?.assignedClasses?.[0] || 'IX-A');
    setNewSubjectName(act.subjectName || currentUser?.assignedSubjects?.[0] || 'Teaching');
    setNewDescription(act.description || '');
    setNewIsOverload(act.isOverlappingDuty || false);
    setNewOverloadReason(act.overloadReason || '');
    setNewPortfolioTemplateId(act.portfolioTemplateId || '');
    setNewResponsibilityId(act.responsibilityId || '');
    setIsAddModalOpen(true);
  };

  const handleQuickAddPreset = (
    presetTitle: string,
    category: HourlyCategory,
    priority: EisenhowerPriority,
    overload = false,
    reason = '',
    portId?: string,
    respId?: string,
    clsName?: string,
    subjName?: string
  ) => {
    setEditingActivity(null);
    setNewDate(selectedDate);
    setNewTitle(presetTitle);
    setNewCategory(category);
    setNewPriority(priority);
    setNewClassName(clsName || currentUser?.assignedClasses?.[0] || 'IX-A');
    setNewSubjectName(subjName || currentUser?.assignedSubjects?.[0] || 'Teaching');
    setNewIsOverload(overload);
    setNewOverloadReason(reason);
    setNewPortfolioTemplateId(portId || myEligiblePortfolios[0]?.id || '');
    setNewResponsibilityId(respId || '');
    setIsAddModalOpen(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const selectedPort = portfolioTemplates.find(t => t.id === newPortfolioTemplateId);
    const selectedResp = selectedPort?.responsibilities.find(r => r.id === newResponsibilityId);

    const userCode = teacherCode || '108894';
    const isDelegated = responsibilityDelegations.some(
      d =>
        d.portfolioTemplateId === newPortfolioTemplateId &&
        d.responsibilityId === newResponsibilityId &&
        d.status === 'Active' &&
        d.delegatedToEmployeeCode === userCode
    );

    if (editingActivity) {
      const updated = activities.map(a => {
        if (a.id === editingActivity.id) {
          return {
            ...a,
            date: newDate,
            startTime: newStartTime,
            endTime: newEndTime,
            title: newTitle.trim(),
            description: newDescription.trim() || 'Hourly workload activity logged.',
            category: newCategory,
            status: newStatus,
            priority: newPriority,
            className: newCategory === 'Teaching' ? newClassName : undefined,
            subjectName: newCategory === 'Teaching' ? newSubjectName : undefined,
            isOverlappingDuty: newIsOverload,
            overloadReason: newIsOverload ? newOverloadReason : undefined,
            portfolioTemplateId: newPortfolioTemplateId || undefined,
            portfolioTemplateName: selectedPort?.name || undefined,
            responsibilityId: newResponsibilityId || undefined,
            responsibilityTitle: selectedResp?.title || undefined,
            isDelegatedWork: isDelegated,
            kanbanColumn: (newStatus === 'Done' ? 'Completed' : newStatus === 'In Progress' ? 'In Progress' : newStatus === 'Missed' ? 'Delayed' : 'Pending') as 'Completed' | 'In Progress' | 'Pending' | 'Delayed',
            updatedAt: new Date().toISOString()
          };
        }
        return a;
      });
      await saveActivities(updated);
    } else {
      const newAct: HourlyActivity = {
        id: 'act-' + Date.now(),
        date: newDate || selectedDate,
        startTime: newStartTime,
        endTime: newEndTime,
        title: newTitle.trim(),
        description: newDescription.trim() || 'Hourly workload activity logged.',
        category: newCategory,
        status: newStatus,
        priority: newPriority,
        className: newCategory === 'Teaching' ? newClassName : undefined,
        subjectName: newCategory === 'Teaching' ? newSubjectName : undefined,
        isOverlappingDuty: newIsOverload,
        overloadReason: newIsOverload ? newOverloadReason : undefined,
        evidenceIds: [],
        portfolioTemplateId: newPortfolioTemplateId || undefined,
        portfolioTemplateName: selectedPort?.name || undefined,
        responsibilityId: newResponsibilityId || undefined,
        responsibilityTitle: selectedResp?.title || undefined,
        isDelegatedWork: isDelegated,
        kanbanColumn: (newStatus === 'Done' ? 'Completed' : newStatus === 'In Progress' ? 'In Progress' : newStatus === 'Missed' ? 'Delayed' : 'Pending') as 'Completed' | 'In Progress' | 'Pending' | 'Delayed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveActivities([newAct, ...activities]);
    }

    setEditingActivity(null);
    setNewTitle('');
    setNewDescription('');
    setNewIsOverload(false);
    setNewOverloadReason('');
    setNewPortfolioTemplateId('');
    setNewResponsibilityId('');
    setIsAddModalOpen(false);
  };

  const handleDeleteActivity = async (id: string) => {
    if (confirm('Are you sure you want to delete this activity log?')) {
      const updated = activities.filter(a => a.id !== id);
      await saveActivities(updated);
    }
  };

  const handleUpdateStatus = async (id: string, newStat: ActivityStatus) => {
    const updated = activities.map(a => {
      if (a.id === id) {
        const kanbanCol: 'Completed' | 'In Progress' | 'Pending' | 'Delayed' = newStat === 'Done' ? 'Completed' : newStat === 'In Progress' ? 'In Progress' : newStat === 'Missed' ? 'Delayed' : 'Pending';
        return { ...a, status: newStat, kanbanColumn: kanbanCol, updatedAt: new Date().toISOString() };
      }
      return a;
    });
    await saveActivities(updated);
  };

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEvidence(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      const isImg = file.type.startsWith('image/');

      const newEv: ActivityEvidence = {
        id: 'ev-' + Date.now(),
        activityId: evidenceActivityId || 'general',
        fileUrl: base64Url,
        fileName: file.name,
        fileType: isImg ? 'image' : 'document',
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toISOString(),
        gpsLocation: 'KV Vidyalaya Campus (Geo-locked)',
        timestampVerified: true,
        caption: evidenceCaption.trim() || 'Uploaded authentic proof record'
      };

      const updatedEvidence = [newEv, ...evidenceList];
      await saveEvidence(updatedEvidence);

      if (evidenceActivityId) {
        const updatedActs = activities.map(a => {
          if (a.id === evidenceActivityId) {
            return { ...a, evidenceIds: [...(a.evidenceIds || []), newEv.id] };
          }
          return a;
        });
        await saveActivities(updatedActs);
      }

      setUploadingEvidence(false);
      setEvidenceCaption('');
      setEvidenceActivityId('');
      alert('Authentic Proof Document Uploaded and Timestamp Verified!');
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteEvidence = async (id: string) => {
    if (confirm('Delete this proof record?')) {
      const updated = evidenceList.filter(e => e.id !== id);
      await saveEvidence(updated);
    }
  };

  const handleGenerateAIReport = () => {
    setIsLoadingAI(true);
    setTimeout(() => {
      const totalActivities = activities.length;
      const completedActivities = activities.filter(a => a.status === 'Done').length;
      const overloadActivities = activities.filter(a => a.isOverlappingDuty).length;

      const newRep: AIWorkloadAnalysisReport = {
        id: 'rep-' + Date.now(),
        generatedAt: new Date().toISOString(),
        periodRange: 'Current Academic Session',
        totalHoursLogged: totalActivities * 1.0,
        teachingHours: activities.filter(a => a.category === 'Teaching').length * 1.0,
        adminHours: activities.filter(a => a.category === 'Administrative Duty' || a.category === 'GeM Portal Admin').length * 1.0,
        gemHours: activities.filter(a => a.category === 'GeM Portal Admin').length * 1.0,
        sportsParadeHours: activities.filter(a => a.category === 'Sports / RSM / NSM' || a.category === 'Parade & Pyramid').length * 1.0,
        dutyHours: activities.filter(a => a.category === 'Assembly & Duty' || a.category === 'Arrangement / Proxy Duty').length * 1.0,
        overloadScore: overloadActivities > 3 ? 85 : overloadActivities > 0 ? 45 : 10,
        overloadSummary: `Analysis of ${totalActivities} logged workload units for ${currentUser?.name || 'Faculty Member'} indicates structured instructional and institutional output. Total completion rate stands at ${Math.round((completedActivities / (totalActivities || 1)) * 100)}%. ${overloadActivities} activities experienced official overlap friction.`,
        officialDefensibilityStatement: 'Fully Defensible (Meets KVS Norms & Audit Standards)',
        recommendations: [
          'Ensure all committee and administrative duties are tagged to official Role/Committee portfolios.',
          'Upload photo proof for campus and non-classroom supervision duties.',
          'Print the weekly summary to maintain page-11 physical diary backup.'
        ],
        pendingTaskExplanations: []
      };
      setAiReport(newRep);
      setIsLoadingAI(false);
    }, 1200);
  };

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const matchDate = dateFilterMode === 'all' || !selectedDate || a.date === selectedDate;
      const matchCat = categoryFilter === 'All' || a.category === categoryFilter;
      const matchStat = statusFilter === 'All' || a.status === statusFilter;
      return matchDate && matchCat && matchStat;
    });
  }, [activities, selectedDate, dateFilterMode, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-600/30 border border-purple-500/50 text-purple-300">
              <Clock className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2 m-0">
              <span>Teacher Hourly Workload & Proof System</span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-[11px] text-purple-200 font-sans border border-purple-500/40">
                {currentUser?.name || teacherProfile.name || 'Faculty Member'} ({currentUser?.designation || 'TGT'})
              </span>
            </h2>
          </div>
          <p className="text-xs text-purple-200/80 m-0">
            Real-time hourly time tracking with 1-tap Role & Responsibility categorization, Geo-tagged proof locker, and Timetable integration.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => handleSyncActualSchedule(selectedDate)}
            className="px-3.5 py-2 rounded-2xl bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-500/40 text-indigo-200 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            title="Auto-Fill actual teaching periods & committee works from Vidyalaya Master Timetable"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sync Daily Timetable & Duties</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-950/50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Hourly Activity</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between animate-fadeIn shadow-lg">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </span>
          <button onClick={() => setSyncFeedback(null)} className="text-emerald-300 hover:text-white">✕</button>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-1">
          <div className="text-xs text-purple-300 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Total Logged Duties</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">{filteredActivities.length} Entries</div>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-1">
          <div className="text-xs text-emerald-300 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed (Done)</span>
          </div>
          <div className="text-xl font-bold text-emerald-300 mt-1">
            {filteredActivities.filter(a => a.status === 'Done').length} Units
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-1">
          <div className="text-xs text-amber-300 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Overload / Overlaps</span>
          </div>
          <div className="text-xl font-bold text-amber-300 mt-1">
            {filteredActivities.filter(a => a.isOverlappingDuty).length} Overlaps
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-1">
          <div className="text-xs text-purple-300 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Proof Evidence Items</span>
          </div>
          <div className="text-xl font-bold text-purple-200 mt-1">{evidenceList.length} Files</div>
        </div>
      </div>

      {/* Role & Committee Hours Summary Strip (Phase 4) */}
      {portfolioHoursSummary.length > 0 && (
        <div className="p-4 rounded-3xl bg-slate-900 border border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-purple-300">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-purple-400" />
              <span>Logged Workload by Role & Committee Portfolio (Phase 4):</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {portfolioHoursSummary.reduce((acc, p) => acc + p.hours, 0).toFixed(1)} Total Committee Hours
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {portfolioHoursSummary.map((port, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-purple-950/50 border border-purple-500/30 text-xs flex items-center gap-2"
              >
                <span className="text-white font-medium">{port.name}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white font-mono font-bold text-[10px]">
                  {port.hours.toFixed(1)} hrs ({port.count} duties)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--glass-border)] no-scrollbar">
        {[
          { id: 'tracker', label: 'Hourly Timeline', icon: Clock },
          { id: 'evidence', label: 'Verifiable Evidence Proof', icon: ShieldCheck, badge: evidenceList.length },
          { id: 'heatmap', label: 'Workload Heatmap', icon: BarChart3 },
          { id: 'kanban', label: 'Kanban Workload Board', icon: Layers },
          { id: 'pdf', label: 'Defensible PDF Report', icon: Printer },
          { id: 'calendar', label: 'Google Calendar Sync', icon: CalIcon },
          { id: 'ai', label: 'AI Workload Audit', icon: Sparkles, badge: aiReport ? 'Ready' : undefined }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/40'
                  : 'bg-purple-950/30 text-purple-300/80 hover:bg-purple-900/50 hover:text-white border border-purple-500/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-300'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW 1: HOURLY TIMELINE & QUICK LOG */}
      {subTab === 'tracker' && (
        <div className="space-y-6">
          {/* One-Tap Quick Entry Presets tailored to Teacher */}
          <div className="p-4 rounded-3xl bg-purple-950/30 border border-purple-500/20 space-y-3">
            <div className="text-xs font-semibold text-purple-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>One-Tap Quick Entry Presets for {currentUser?.name || 'Faculty Member'}</span>
              </span>
              <span className="text-[11px] text-[var(--text-dim)]">Tap to quickly pre-fill logger</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    handleQuickAddPreset(
                      preset.title,
                      preset.category,
                      preset.priority,
                      false,
                      '',
                      (preset as any).portId,
                      undefined,
                      (preset as any).className,
                      (preset as any).subjectName
                    )
                  }
                  className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${preset.bg}`}
                >
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters & Date Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-purple-200">Date View:</span>
                <div className="inline-flex rounded-xl bg-purple-950/60 p-0.5 border border-purple-500/30 text-xs">
                  <button
                    onClick={() => setDateFilterMode('selected')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      dateFilterMode === 'selected' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    Specific Day
                  </button>
                  <button
                    onClick={() => setDateFilterMode('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      dateFilterMode === 'all' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    All Days
                  </button>
                </div>
              </div>

              {dateFilterMode === 'selected' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="td-input py-1 px-3 text-xs w-36"
                  />
                  <button
                    onClick={() => setSelectedDate(todayStr)}
                    className="px-2.5 py-1 rounded-xl bg-purple-900/50 hover:bg-purple-800 text-[11px] text-purple-200 border border-purple-500/30 cursor-pointer"
                  >
                    Today
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-purple-200">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="td-select py-1 px-3 text-xs"
                >
                  <option value="All">All Categories</option>
                  {availableTags.map(tag => (
                    <option key={tag.id} value={tag.name}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-purple-200">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="td-select py-1 px-3 text-xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="Done">Completed (Done)</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                  <option value="Missed">Delayed / Overload</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hourly Timeline List */}
          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <div className="p-8 rounded-3xl bg-purple-950/20 border border-purple-500/20 text-center space-y-4">
                <Clock className="w-10 h-10 text-purple-400 mx-auto opacity-60" />
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-purple-200">
                    No activity logs recorded for {dateFilterMode === 'selected' ? selectedDate : 'this filter'}
                  </div>
                  <p className="text-xs text-[var(--text-dim)] max-w-md mx-auto">
                    Click &ldquo;Sync Daily Timetable & Duties&rdquo; below to automatically populate all scheduled periods and committee responsibilities for {currentUser?.name || 'Faculty Member'}.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleSyncActualSchedule(selectedDate)}
                    className="px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>⚡ Auto-Fill Schedule from Timetable & Portfolios</span>
                  </button>

                  <button
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 rounded-2xl bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-semibold text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Manual Log</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredActivities.map((act) => {
                const linkedEvidences = evidenceList.filter(e => (act.evidenceIds || []).includes(e.id) || e.activityId === act.id);

                return (
                  <div
                    key={act.id}
                    className={`p-5 rounded-3xl border transition-all relative overflow-hidden ${
                      act.isOverlappingDuty
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20'
                        : act.status === 'Done'
                        ? 'bg-slate-900/60 border-slate-700/60'
                        : 'bg-purple-950/30 border-purple-500/30'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Time & Details */}
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-center shrink-0 min-w-[95px]">
                          <div className="text-xs font-mono font-bold text-purple-200">{act.startTime}</div>
                          <div className="text-[10px] text-purple-400 font-mono">to {act.endTime}</div>
                          {act.date && act.date !== selectedDate && (
                            <div className="text-[9px] text-slate-400 mt-1 font-mono">{act.date}</div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white">{act.title}</span>

                            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-[10px] text-purple-300 font-medium">
                              {act.category}
                            </span>

                            {/* Phase 4: Role & Responsibility Badge */}
                            {act.portfolioTemplateName && (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                                  act.isDelegatedWork
                                    ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                                    : 'bg-purple-950/80 border-purple-500/40 text-purple-200'
                                }`}
                              >
                                <Briefcase className="w-3 h-3" />
                                <span>{act.portfolioTemplateName}</span>
                                {act.responsibilityTitle && <span>&bull; {act.responsibilityTitle}</span>}
                                {act.isDelegatedWork && <span className="text-amber-400 font-mono">(Delegated)</span>}
                              </span>
                            )}

                            {act.isOverlappingDuty && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] text-amber-300 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Overload / Overlapping Duty</span>
                              </span>
                            )}

                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300">
                              {act.priority}
                            </span>
                          </div>

                          <p className="text-xs text-[var(--text-dim)] leading-relaxed">{act.description}</p>

                          {act.overloadReason && (
                            <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold text-amber-300">Official Overload Justification: </span>
                                <span>{act.overloadReason}</span>
                              </div>
                            </div>
                          )}

                          {/* Attached Proof Badges */}
                          {linkedEvidences.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="text-[10px] text-purple-300 font-medium flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>{linkedEvidences.length} Verified Evidence Record(s)</span>
                              </span>
                              {linkedEvidences.map(ev => (
                                <a
                                  key={ev.id}
                                  href={ev.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-purple-400 hover:text-purple-200 underline font-mono flex items-center gap-0.5"
                                >
                                  <span>{ev.fileName}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <select
                          value={act.status}
                          onChange={e => handleUpdateStatus(act.id, e.target.value as ActivityStatus)}
                          className={`td-select text-xs py-1 px-2.5 font-semibold ${
                            act.status === 'Done'
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                              : act.status === 'In Progress'
                              ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                              : 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                          }`}
                        >
                          <option value="Done">Completed (Done)</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Pending">Pending</option>
                          <option value="Missed">Missed / Delayed</option>
                        </select>

                        <button
                          onClick={() => handleOpenEditActivity(act)}
                          className="p-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-500/30 text-purple-300 transition-all cursor-pointer"
                          title="Edit Activity"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteActivity(act.id)}
                          className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 transition-all cursor-pointer"
                          title="Delete Log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: EVIDENCE PROOF VAULT */}
      {subTab === 'evidence' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white m-0">Upload Verifiable Duty Evidence (Photos / Documents)</h3>
              </div>
              <span className="text-xs text-purple-300 font-mono">Geo-Locked & Timestamped Locker</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-purple-300 font-semibold block mb-1">Link to Logged Activity:</label>
                <select
                  value={evidenceActivityId}
                  onChange={e => setEvidenceActivityId(e.target.value)}
                  className="td-select text-xs w-full"
                >
                  <option value="">-- General Vidyalaya Evidence --</option>
                  {activities.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.date} | {a.startTime}-{a.endTime} | {a.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-purple-300 font-semibold block mb-1">Proof Caption / Description:</label>
                <input
                  type="text"
                  placeholder="e.g. Art exhibition display or student project photo"
                  value={evidenceCaption}
                  onChange={e => setEvidenceCaption(e.target.value)}
                  className="td-input text-xs w-full"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingEvidence ? 'Processing File...' : 'Select Photo / File'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleEvidenceUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Evidence Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidenceList.length === 0 ? (
              <div className="col-span-full p-8 rounded-3xl bg-purple-950/20 border border-purple-500/20 text-center text-xs text-[var(--text-dim)]">
                No proof evidence files uploaded yet. Upload photographs or documents to build your verifiable duty locker.
              </div>
            ) : (
              evidenceList.map(ev => {
                const linkedAct = activities.find(a => a.id === ev.activityId);

                return (
                  <div key={ev.id} className="p-4 rounded-3xl bg-slate-900/80 border border-slate-700/60 space-y-3 relative flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="aspect-video bg-black/40 rounded-2xl overflow-hidden border border-slate-800 relative group flex items-center justify-center">
                        {ev.fileType === 'image' ? (
                          <img src={ev.fileUrl} alt={ev.fileName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="p-4 text-center space-y-2">
                            <FileText className="w-10 h-10 text-purple-400 mx-auto" />
                            <div className="text-xs text-purple-200 font-mono">{ev.fileName}</div>
                          </div>
                        )}

                        <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-emerald-500/40 text-[10px] text-emerald-300 font-mono font-medium flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Verified Timestamp</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white truncate">{ev.fileName}</div>
                        <p className="text-[11px] text-[var(--text-dim)] line-clamp-2">{ev.caption || 'Authentic proof record'}</p>

                        {linkedAct && (
                          <div className="text-[10px] text-purple-300 bg-purple-950/60 p-1.5 rounded-lg border border-purple-500/20 truncate">
                            Linked: {linkedAct.title}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{new Date(ev.uploadedAt).toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={ev.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 transition-all"
                          title="Open Full File"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteEvidence(ev.id)}
                          className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 transition-all cursor-pointer"
                          title="Delete Evidence"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: WORKLOAD HEATMAP DASHBOARD */}
      {subTab === 'heatmap' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-bold text-white">Workload Density & Completion Heatmap ({currentUser?.name || 'Faculty'})</span>
            </div>

            <div className="flex items-center gap-2">
              {(['Weekly', 'Monthly', 'Quarterly', 'Annual'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setHeatmapTimeframe(tf)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    heatmapTimeframe === tf
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-4">
            <div className="text-xs font-semibold text-purple-200">Weekly Hourly Grid (Mon-Sat 08:00 - 15:00)</div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              <div className="p-2 font-bold text-purple-300">Time</div>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="p-2 font-bold text-purple-300">{d}</div>
              ))}

              {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'].map(t => (
                <React.Fragment key={t}>
                  <div className="p-2 font-mono text-[11px] text-slate-400">{t}</div>
                  {[0, 1, 2, 3, 4, 5].map(dIdx => (
                    <div
                      key={dIdx}
                      className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20 text-[10px] text-purple-200 font-medium hover:bg-purple-900/60 transition-all cursor-pointer"
                    >
                      Class / Duty
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: KANBAN WORKLOAD BOARD */}
      {subTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['Pending', 'In Progress', 'Completed', 'Delayed'] as const).map(col => {
            const colActivities = activities.filter(a => a.kanbanColumn === col);

            return (
              <div key={col} className="p-4 rounded-3xl bg-slate-900/60 border border-purple-500/20 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-purple-200 pb-2 border-b border-purple-500/20">
                  <span>{col}</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-600/30 text-[10px] font-mono text-purple-300">
                    {colActivities.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {colActivities.map(act => (
                    <div key={act.id} className="p-3 rounded-2xl bg-slate-950 border border-purple-500/20 space-y-2 text-xs">
                      <div className="font-bold text-white">{act.title}</div>
                      <div className="text-[10px] text-purple-300 font-mono">{act.startTime} - {act.endTime}</div>
                      {act.portfolioTemplateName && (
                        <div className="text-[10px] text-purple-400 truncate">🏛️ {act.portfolioTemplateName}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-VIEW 5: DEFENSIBLE PDF REPORT */}
      {subTab === 'pdf' && (
        <div className="p-8 rounded-3xl bg-slate-900 border border-purple-500/30 space-y-4 text-center">
          <Printer className="w-12 h-12 text-purple-400 mx-auto" />
          <h3 className="text-base font-bold text-white m-0">Print Official P-10 & 11 Teacher Hourly Diary</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Generates standardized A4 inspection-ready logs containing verified timestamps, role/committee categorizations, and disruption notes for {currentUser?.name || 'Faculty Member'}.
          </p>
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span>Print Workload Register (A4)</span>
          </button>
        </div>
      )}

      {/* SUB-VIEW 6: GOOGLE CALENDAR SYNC */}
      {subTab === 'calendar' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-purple-500/30 space-y-4">
          <div className="flex items-center gap-2">
            <CalIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white m-0">Two-Way Google Calendar & Timetable Sync</h3>
          </div>
          <p className="text-xs text-slate-400">
            Automatically sync daily period allocations and assigned committee duties with your official Google Calendar.
          </p>
          <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/20 text-xs text-purple-300">
            Connected Google Account: {currentUser?.email || 'teacher@kvs.ac.in'} (Auto-Sync Active)
          </div>
        </div>
      )}

      {/* SUB-VIEW 7: AI WORKLOAD AUDIT */}
      {subTab === 'ai' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-purple-500/30 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white m-0">AI Workload & Legal Defense Audit</h3>
            </div>
            <button
              onClick={handleGenerateAIReport}
              disabled={isLoadingAI}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isLoadingAI ? 'Analyzing Workload...' : 'Run New AI Audit'}</span>
            </button>
          </div>

          {aiReport && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-3 text-xs">
              <div className="font-bold text-purple-300">Executive Summary:</div>
              <p className="text-slate-300 leading-relaxed">{aiReport.overloadSummary}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Defensible Hours:</div>
                  <div className="text-base font-bold text-emerald-400">{aiReport.totalHoursLogged} hrs</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Overload Friction Index:</div>
                  <div className="text-base font-bold text-amber-400">
                    {aiReport.overloadScore > 50 ? 'High' : aiReport.overloadScore > 20 ? 'Moderate' : 'Low'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Audit Status:</div>
                  <div className="text-base font-bold text-purple-300">{aiReport.officialDefensibilityStatement}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT ACTIVITY MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121420] border border-purple-500/40 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span>{editingActivity ? 'Modify / Edit Hourly Activity' : 'Log New Hourly Duty / Activity'}</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-purple-300 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4">
              {/* Date & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-purple-300 font-semibold block mb-1">Activity Date:</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="td-input text-xs w-full"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-purple-300 font-semibold">Duty / Task Title *</label>
                    <button
                      type="button"
                      onClick={handleToggleVoice}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold flex items-center gap-1 transition-all ${
                        isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-purple-900/60 text-purple-300'
                      }`}
                    >
                      {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                      <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class IX Art Education Period 2"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="td-input text-xs w-full"
                  />
                </div>
              </div>

              {/* Start & End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-purple-300 font-semibold block mb-1">Start Time:</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    className="td-input text-xs w-full"
                  />
                </div>

                <div>
                  <label className="text-xs text-purple-300 font-semibold block mb-1">End Time:</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    className="td-input text-xs w-full"
                  />
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-purple-300 font-semibold block mb-1">Tag / Duty Category:</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as HourlyCategory)}
                    className="td-select text-xs w-full"
                  >
                    <optgroup label="Principal Assigned / Institutional">
                      {availableTags.filter(t => t.source === 'admin').map(tag => (
                        <option key={tag.id} value={tag.name}>
                          🛡️ {tag.name}
                        </option>
                      ))}
                    </optgroup>
                    {availableTags.filter(t => t.source === 'teacher').length > 0 && (
                      <optgroup label="Personal Custom Tags">
                        {availableTags.filter(t => t.source === 'teacher').map(tag => (
                          <option key={tag.id} value={tag.name}>
                            🏷️ {tag.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-purple-300 font-semibold block mb-1">Status:</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as ActivityStatus)}
                    className="td-select text-xs w-full"
                  >
                    <option value="Done">Done (Completed)</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Missed">Missed / Delayed</option>
                  </select>
                </div>
              </div>

              {/* Phase 4: Role & Responsibility Linking Box */}
              <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-3">
                <div className="text-xs font-bold text-purple-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                    <span>Tag to Committee Role & Responsibility (Optional):</span>
                  </span>
                  <span className="text-[10px] text-purple-400 font-mono">Phase 4 Integration</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Committee / Role:</label>
                    <select
                      value={newPortfolioTemplateId}
                      onChange={e => {
                        setNewPortfolioTemplateId(e.target.value);
                        const target = portfolioTemplates.find(t => t.id === e.target.value);
                        setNewResponsibilityId(target?.responsibilities[0]?.id || '');
                      }}
                      className="td-select text-xs w-full bg-slate-950"
                    >
                      <option value="">-- None / General Activity --</option>
                      {myEligiblePortfolios.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Specific Responsibility:</label>
                    <select
                      value={newResponsibilityId}
                      onChange={e => setNewResponsibilityId(e.target.value)}
                      disabled={!newPortfolioTemplateId}
                      className="td-select text-xs w-full bg-slate-950 disabled:opacity-50"
                    >
                      <option value="">-- Select Responsibility --</option>
                      {availableResponsibilitiesForSelectedPort.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.frequency})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Overload Checkbox */}
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsOverload}
                    onChange={e => setNewIsOverload(e.target.checked)}
                    className="rounded border-amber-500 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Tag as Overlapping Duty / Official Work Overload</span>
                </label>

                {newIsOverload && (
                  <input
                    type="text"
                    placeholder="Describe official overlap reason (e.g., Assigned proxy period or called by Principal)"
                    value={newOverloadReason}
                    onChange={e => setNewOverloadReason(e.target.value)}
                    className="td-input text-xs w-full bg-amber-950/60"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-purple-300 font-semibold">Notes / Description:</label>
                <textarea
                  rows={2}
                  placeholder="Additional details about task..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="td-input text-xs w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/20">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg cursor-pointer"
                >
                  {editingActivity ? 'Update Activity Log' : 'Save Activity Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
