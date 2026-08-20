import React, { useState, useEffect, useMemo } from 'react';
import {
  SchoolDetails,
  TeacherProfile,
  ClassSection,
  TimetableSlot,
  CalendarEvent,
  SyllabusItem,
  DailyLessonPlan,
  AssessmentProgressRecord,
  InspectionReviewRecord,
  LessonEvidenceItem,
  TeacherTask,
  StaffDetailRecord,
  ProfileChangeRequest
} from '../types/academic';
import {
  db,
  DEFAULT_SCHOOL,
  DEFAULT_TEACHER,
  DEFAULT_CLASSES,
  DEFAULT_TIMETABLE,
  DEFAULT_CALENDAR,
  DEFAULT_SYLLABUS,
  DEFAULT_LESSON_PLANS,
  DEFAULT_ASSESSMENT_RECORDS,
  DEFAULT_INSPECTION_RECORDS,
  DEFAULT_PERIOD_TIMINGS,
  DEFAULT_TASKS,
  DEFAULT_STAFF_DETAILS,
  getCurrentUser
} from '../lib/storage';
import { compareClassGrades } from '../utils/csvParser';
import { getTeacherScopedStorageKey } from '../lib/teacherContext';
import { getStaffEmploymentType } from '../lib/staffFileImporter';
import { UserAccount } from '../types/auth';
import { DevModeBadge } from './DevModeBadge';
import { ProfileChangeRequestsModal } from './ProfileChangeRequestsModal';
import {
  LayoutDashboard,
  Clock,
  BookOpen,
  FileEdit,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Award,
  Camera,
  ShieldCheck,
  Printer,
  Search,
  BellRing,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  Shield,
  Zap,
  ChevronRight,
  Filter,
  RefreshCw,
  X,
  FileText,
  ListTodo,
  Coffee,
  UserCheck,
  UserX,
  MapPin,
  UtensilsCrossed,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Tag,
  Flag,
  Crown,
  CheckCircle,
  CalendarDays,
  Bookmark,
  Users,
  Megaphone,
  Star,
  Target,
  CheckCheck,
  Users2
} from 'lucide-react';

interface TeacherDashboardProps {
  devMode: boolean;
  onNavigateTab: (tab: string) => void;
  currentUser?: UserAccount | null;
}

const DEFAULT_RECESS_DUTY_ROSTER: Record<string, { time: string; duties: { name: string; designation: string; location: string; role: string }[] }> = {
  Monday: {
    time: '10:30 AM - 11:00 AM',
    duties: [
      { name: 'Mr. Vikram Mehta', designation: 'Data Entry Manager', location: 'Canteen & Central Assembly Ground', role: 'Chief Recess Supervisor' },
      { name: 'Mrs. Sunita Verma', designation: 'TGT Science', location: '1st Floor Corridor & Water Station', role: 'Floor Incharge' },
      { name: 'Mrs. Anjali Deshmukh', designation: 'PRT Primary', location: 'Primary Wing & Gate 2', role: 'Primary Safety Incharge' }
    ]
  },
  Tuesday: {
    time: '10:30 AM - 11:00 AM',
    duties: [
      { name: 'Mrs. Sunita Verma', designation: 'TGT Science', location: 'Central Assembly Ground & Canteen Area', role: 'Chief Recess Supervisor' },
      { name: 'Mr. Updesh Kumar', designation: 'PGT Mathematics', location: 'Senior Wing Corridor & Labs', role: 'Senior Floor Incharge' },
      { name: 'Mrs. Anjali Deshmukh', designation: 'PRT Primary', location: 'Primary Wing Courtyard & Water Points', role: 'Primary Safety Incharge' }
    ]
  },
  Wednesday: {
    time: '10:30 AM - 11:00 AM',
    duties: [
      { name: 'Mr. Vikram Mehta', designation: 'Data Entry Manager', location: 'Canteen & Sports Field', role: 'Chief Recess Supervisor' },
      { name: 'Mrs. Anjali Deshmukh', designation: 'PRT Primary', location: 'Primary Building & Gate 1', role: 'Primary Safety Incharge' },
      { name: 'Mr. Updesh Kumar', designation: 'PGT Mathematics', location: 'Library & Multi-Purpose Hall', role: 'Senior Floor Incharge' }
    ]
  },
  Thursday: {
    time: '10:30 AM - 11:00 AM',
    duties: [
      { name: 'Mrs. Sunita Verma', designation: 'TGT Science', location: 'Assembly Ground & Water Points', role: 'Chief Recess Supervisor' },
      { name: 'Mrs. Anjali Deshmukh', designation: 'PRT Primary', location: 'Primary Playground & Mid-Day Meal Hall', role: 'Primary Safety Incharge' },
      { name: 'Mr. Vikram Mehta', designation: 'Data Entry Manager', location: 'Senior Corridor & Cycles Stand', role: 'Campus Incharge' }
    ]
  },
  Friday: {
    time: '10:30 AM - 11:00 AM',
    duties: [
      { name: 'Mr. Updesh Kumar', designation: 'PGT Mathematics', location: 'Central Lawn & Canteen Area', role: 'Chief Recess Supervisor' },
      { name: 'Mrs. Sunita Verma', designation: 'TGT Science', location: 'Ground Floor Corridor & Labs', role: 'Floor Incharge' },
      { name: 'Mrs. Anjali Deshmukh', designation: 'PRT Primary', location: 'Primary Wing Water Cooler Point', role: 'Primary Safety Incharge' }
    ]
  },
  Saturday: {
    time: '10:30 AM - 11:00 AM',
    duties: [
      { name: 'Mr. Vikram Mehta', designation: 'Data Entry Manager', location: 'Main Gate & Assembly Ground', role: 'Chief Recess Supervisor' },
      { name: 'Mrs. Sunita Verma', designation: 'TGT Science', location: 'Senior Wing & Balcony Areas', role: 'Senior Floor Incharge' },
      { name: 'Mrs. Anjali Deshmukh', designation: 'PRT Primary', location: 'Activity Hall & Playground', role: 'Primary Safety Incharge' }
    ]
  }
};

const DEFAULT_TEACHER_DASHBOARD_TASKS: TeacherTask[] = [
  {
    id: 'tsk-p1',
    title: 'Verify & Submit Term-1 / Half-Yearly Marks Tabulation Register',
    description: 'Ensure all periodic test (PT-1) marks and internal assessment scores are tabulated in KVS e-Pravesh portal by 4:00 PM today.',
    category: 'Teacher Diary Docs',
    priority: 'Do First (Urgent & Important)',
    status: 'Pending',
    dueDate: '2026-08-18',
    dueTime: '16:00',
    estimatedMinutes: 60,
    subtasks: [
      { id: 'st-p1', title: 'Check Class X-A Mathematics marks tabulation sheet', completed: true },
      { id: 'st-p2', title: 'Verify Class XII-A Calculus practical record marks', completed: false },
      { id: 'st-p3', title: 'Principal signature on final master mark sheet', completed: false }
    ],
    tags: ['Principal Directive', 'Marks Tabulation', 'Urgent'],
    assignedBy: 'Principal Shri Hemananda Barik',
    assignedByRole: 'Principal',
    isTopPriority: true,
    linkedClass: 'Class X-A',
    linkedSubject: 'Mathematics (041)',
    createdAt: '2026-08-18T07:30:00.000Z',
    updatedAt: '2026-08-18T07:30:00.000Z'
  },
  {
    id: 'tsk-p2',
    title: 'Moderate Class XII Mathematics Question Paper Blueprint for Half-Yearly Exam',
    description: 'Review typology of questions (HOTS, Case-based, MCQ) aligned strictly with CBSE 2026 examination guidelines.',
    category: 'Teacher Diary Docs',
    priority: 'Do First (Urgent & Important)',
    status: 'In Progress',
    dueDate: '2026-08-19',
    dueTime: '14:00',
    estimatedMinutes: 90,
    subtasks: [
      { id: 'st-p4', title: 'Validate chapter-wise marks weightage distribution', completed: true },
      { id: 'st-p5', title: 'Prepare bilingual Hindi/English version of questions', completed: false }
    ],
    tags: ['Academic Incharge', 'CBSE Exam', 'Question Paper'],
    assignedBy: 'Academic Incharge (Mrs. Sunita Verma)',
    assignedByRole: 'Incharge',
    isTopPriority: true,
    linkedClass: 'Class XII-A',
    linkedSubject: 'Mathematics (041)',
    createdAt: '2026-08-18T08:00:00.000Z',
    updatedAt: '2026-08-18T08:00:00.000Z'
  },
  {
    id: 'tsk-p3',
    title: 'Verify Candidate Signature & Photo Sheet on CBSE Board LOC Portal',
    description: 'Cross-verify spelling of student names, mother/father names, and subject codes (041 Maths, 042 Physics) for Class 10 & 12.',
    category: 'Administrative Duty',
    priority: 'Do First (Urgent & Important)',
    status: 'Pending',
    dueDate: '2026-08-20',
    dueTime: '15:00',
    estimatedMinutes: 45,
    subtasks: [
      { id: 'st-p6', title: 'Verify Class 10-A student list against admission register', completed: true },
      { id: 'st-p7', title: 'Collect missing parent confirmation slips', completed: false }
    ],
    tags: ['Exam Committee', 'LOC Board Registration'],
    assignedBy: 'Examination Committee Incharge',
    assignedByRole: 'Committee',
    isTopPriority: true,
    createdAt: '2026-08-18T08:30:00.000Z',
    updatedAt: '2026-08-18T08:30:00.000Z'
  },
  {
    id: 'tsk-s1',
    title: 'Prepare Lesson Plan & Pedagogical Activity for Class X-A (Quadratic Equations)',
    description: 'Prepare interactive graph demonstration for roots of quadratic equations and update Diary Page 32.',
    category: 'Teacher Diary Docs',
    priority: 'Schedule (Important & Not Urgent)',
    status: 'In Progress',
    dueDate: '2026-08-18',
    dueTime: '08:30',
    estimatedMinutes: 40,
    subtasks: [
      { id: 'st-s1', title: 'Draft learning outcomes and experiential activity in Diary', completed: true },
      { id: 'st-s2', title: 'Prepare Geogebra visualizer model on interactive panel', completed: false }
    ],
    tags: ['Lesson Plan', 'Class X-A', 'Diary P-32'],
    assignedBy: 'Self',
    assignedByRole: 'Self',
    isTopPriority: false,
    linkedClass: 'Class 10-A',
    linkedSubject: 'Mathematics (041)',
    createdAt: '2026-08-18T07:00:00.000Z',
    updatedAt: '2026-08-18T07:00:00.000Z'
  },
  {
    id: 'tsk-s2',
    title: 'Evaluate & Correct Class XII-A Homework Notebooks (Calculus & Integration)',
    description: 'Provide constructive feedback and check error corrections for 42 student calculus notebooks.',
    category: 'Teacher Diary Docs',
    priority: 'Schedule (Important & Not Urgent)',
    status: 'Pending',
    dueDate: '2026-08-18',
    dueTime: '15:30',
    estimatedMinutes: 60,
    subtasks: [
      { id: 'st-s3', title: 'Check exercise 7.1 to 7.4 solutions', completed: false },
      { id: 'st-s4', title: 'Note down common misconceptions for tomorrow class', completed: false }
    ],
    tags: ['Homework Evaluation', 'Class XII-A', 'Diary P-22'],
    assignedBy: 'Self',
    assignedByRole: 'Self',
    isTopPriority: false,
    linkedClass: 'Class XII-A',
    linkedSubject: 'Mathematics (041)',
    createdAt: '2026-08-18T07:15:00.000Z',
    updatedAt: '2026-08-18T07:15:00.000Z'
  },
  {
    id: 'tsk-s3',
    title: 'Log Slow Learner Remedial Interventions in Diary Page 20(b) & Track Progress',
    description: 'Document diagnostic test gaps and 1-on-1 mentoring sessions conducted for 5 struggling students in Class IX-A.',
    category: 'Teacher Diary Docs',
    priority: 'Schedule (Important & Not Urgent)',
    status: 'Pending',
    dueDate: '2026-08-18',
    dueTime: '17:00',
    estimatedMinutes: 30,
    subtasks: [
      { id: 'st-s5', title: 'Record post-remediation quiz scores in Diary P-20(c)', completed: false }
    ],
    tags: ['Remedial Diary', 'Page 20b', 'Student Support'],
    assignedBy: 'Self',
    assignedByRole: 'Self',
    isTopPriority: false,
    linkedClass: 'Class IX-A',
    linkedSubject: 'Mathematics (041)',
    createdAt: '2026-08-18T07:20:00.000Z',
    updatedAt: '2026-08-18T07:20:00.000Z'
  }
];

const TODAY_SCHEDULED_ACTIVITIES = [
  {
    id: 'act-1',
    time: '07:30 AM - 07:50 AM',
    title: 'Morning Assembly & Uniform Discipline Patrol',
    location: 'Central Courtyard / Main Gate',
    role: 'Assembly Supervision & Uniform Cleanliness Incharge',
    badge: 'Daily School Duty',
    icon: 'Megaphone'
  },
  {
    id: 'act-2',
    time: '10:30 AM - 11:00 AM',
    title: 'Mid-Day Recess Discipline & Canteen Supervision',
    location: 'Senior Wing Corridor & Drinking Water Point',
    role: 'Senior Floor Safety Incharge',
    badge: 'Campus Safety Duty',
    icon: 'ShieldCheck'
  },
  {
    id: 'act-3',
    time: '01:45 PM - 02:25 PM',
    title: 'Monthly Mathematics Subject Committee Meeting',
    location: 'Conference Room (Room 102)',
    role: 'Presenter: Split-Up Syllabus & PT-1 Result Analysis Review',
    badge: 'KVS Academic Committee',
    icon: 'Bookmark'
  },
  {
    id: 'act-4',
    time: '01:40 PM - 02:20 PM',
    title: 'Remedial Extra Coaching Class (Class IX-A Low Performers)',
    location: 'Mathematics Lab (Ground Floor)',
    role: '1-on-1 Concept Reinforcement on Polynomials',
    badge: 'Remedial Coaching',
    icon: 'Target'
  }
];

const UPCOMING_ACADEMIC_DEADLINES = [
  {
    id: 'dead-1',
    date: '25 Aug 2026',
    daysLeft: '7 Days Left',
    title: 'KVS National Children Science Congress (NCSC) Project Submission',
    desc: 'Finalize student science project synopsis, logbook evidence, and teacher guide certification.',
    tag: 'National Competition',
    urgency: 'high'
  },
  {
    id: 'dead-2',
    date: '28 Aug 2026',
    daysLeft: '10 Days Left',
    title: 'CBSE Class X & XII Candidate LOC Final Verification with Parents',
    desc: 'Verify subject codes (041/042), Aadhaar numbers, and parent signatures on draft LOC sheets.',
    tag: 'CBSE Board Exam',
    urgency: 'high'
  },
  {
    id: 'dead-3',
    date: '05 Sep 2026',
    daysLeft: '18 Days Left',
    title: "Teachers' Day & Term-1 Parent-Teacher Meeting (PTM)",
    desc: 'Distribute PT-1 report cards, review student diary reflection sheets, and discuss remedial progress with parents.',
    tag: 'PTM & Evaluation',
    urgency: 'medium'
  },
  {
    id: 'dead-4',
    date: '15 Sep 2026',
    daysLeft: '28 Days Left',
    title: 'Pariksha Pe Charcha (PPC 2026) Student Registration Drive',
    desc: 'Enroll 100% students of Classes IX to XII on MyGov portal for Hon’ble PM’s interaction.',
    tag: 'National Event',
    urgency: 'medium'
  }
];

function parseTimeToMinutes(tStr: string): number {
  if (!tStr) return 0;
  const match = tStr.trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : '';

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function getPeriodTimeRange(timeStr: string): { startMin: number; endMin: number } | null {
  if (!timeStr || !timeStr.includes('-')) return null;
  const parts = timeStr.split('-');
  const startMin = parseTimeToMinutes(parts[0]);
  const endMin = parseTimeToMinutes(parts[1]);
  return { startMin, endMin };
}

function detectCurrentActivePeriod(timings: Record<number, { time: string }>): {
  activePeriod: number | null;
  isOffSchoolHours: boolean;
  statusLabel: string;
} {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayIndex = now.getDay();

  if (dayIndex === 0) {
    return {
      activePeriod: null,
      isOffSchoolHours: true,
      statusLabel: 'Sunday / Holiday (Off-School Hours · Showing Period 1)'
    };
  }

  const periodsToCheck = [1, 2, 3, 4, 0, 5, 6, 7, 8, 9];
  for (const p of periodsToCheck) {
    const timing = timings[p]?.time;
    if (timing) {
      const range = getPeriodTimeRange(timing);
      if (range && currentMinutes >= range.startMin && currentMinutes < range.endMin) {
        return {
          activePeriod: p,
          isOffSchoolHours: false,
          statusLabel: p === 0 ? '🥪 Recess Break (Active Now)' : `🔴 Period ${p} Active Now`
        };
      }
    }
  }

  return {
    activePeriod: null,
    isOffSchoolHours: true,
    statusLabel: '🌙 Off School Hours (Defaulted to Period 1)'
  };
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ devMode, onNavigateTab, currentUser: propUser }) => {
  const [school, setSchool] = useState<SchoolDetails>(DEFAULT_SCHOOL);
  const [teacher, setTeacher] = useState<TeacherProfile>(DEFAULT_TEACHER);
  const [classes, setClasses] = useState<ClassSection[]>(DEFAULT_CLASSES);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(DEFAULT_TIMETABLE);
  const [calendar, setCalendar] = useState<CalendarEvent[]>(DEFAULT_CALENDAR);
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>(DEFAULT_SYLLABUS);
  const [lessonPlans, setLessonPlans] = useState<DailyLessonPlan[]>(DEFAULT_LESSON_PLANS);
  const [assessments, setAssessments] = useState<AssessmentProgressRecord[]>(DEFAULT_ASSESSMENT_RECORDS);
  const [inspections, setInspections] = useState<InspectionReviewRecord[]>(DEFAULT_INSPECTION_RECORDS);
  const [periodTimings, setPeriodTimings] = useState<Record<number, { time: string; label: string }>>(DEFAULT_PERIOD_TIMINGS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  // Active period detection & live schedule status
  const [activePeriodInfo, setActivePeriodInfo] = useState<{
    activePeriod: number | null;
    isOffSchoolHours: boolean;
    statusLabel: string;
  }>(() => detectCurrentActivePeriod(DEFAULT_PERIOD_TIMINGS));

  // Selected period(s) filter: by default active period during school hours, or [1] if off-school hours
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>(() => {
    const detect = detectCurrentActivePeriod(DEFAULT_PERIOD_TIMINGS);
    return detect.activePeriod !== null ? [detect.activePeriod] : [1];
  });

  // Selected Day for Timetable
  const [selectedDay, setSelectedDay] = useState<string>('Tuesday'); // default current day context
  const [scheduleScope, setScheduleScope] = useState<'my_classes' | 'all' | 'arrangements'>('my_classes');
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Tasks Management State
  const [tasks, setTasks] = useState<TeacherTask[]>(DEFAULT_TEACHER_DASHBOARD_TASKS);
  const [isProfileRequestsModalOpen, setIsProfileRequestsModalOpen] = useState(false);
  const [profileRequests, setProfileRequests] = useState<ProfileChangeRequest[]>([]);
  const [taskTab, setTaskTab] = useState<'all' | 'assigned_by_superiors' | 'self'>('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [staffList, setStaffList] = useState<StaffDetailRecord[]>(DEFAULT_STAFF_DETAILS);
  const [newTaskPriority, setNewTaskPriority] = useState<string>('Do First (Urgent & Important)');
  const [newTaskAssignedBy, setNewTaskAssignedBy] = useState<'Self' | 'Principal' | 'Incharge'>('Self');
  const [newTaskDueTime, setNewTaskDueTime] = useState('15:00');
  const [newTaskClass, setNewTaskClass] = useState('Class X-A');

  useEffect(() => {
    loadData();
    // Auto set day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];
    if (todayName !== 'Sunday') {
      setSelectedDay(todayName);
    } else {
      setSelectedDay('Monday');
    }

    const handleSchoolUpdate = (e: any) => {
      if (e.detail) setSchool(e.detail);
      loadData();
    };

    const handleSessionsUpdate = () => {
      loadData();
    };

    const handleAuthChange = () => {
      loadData();
    };

    window.addEventListener('kvs-school-updated', handleSchoolUpdate);
    window.addEventListener('kvs-sessions-updated', handleSessionsUpdate);
    window.addEventListener('kvs-auth-changed', handleAuthChange);
    window.addEventListener('kvs-active-teacher-changed', handleAuthChange);
    window.addEventListener('kvs-profile-request-resolved', handleAuthChange);

    return () => {
      window.removeEventListener('kvs-school-updated', handleSchoolUpdate);
      window.removeEventListener('kvs-sessions-updated', handleSessionsUpdate);
      window.removeEventListener('kvs-auth-changed', handleAuthChange);
      window.removeEventListener('kvs-active-teacher-changed', handleAuthChange);
      window.removeEventListener('kvs-profile-request-resolved', handleAuthChange);
    };
  }, [propUser]);

  // Live clock ticker (separate from data loading)
  useEffect(() => {
    const ticker = setInterval(() => {
      const detect = detectCurrentActivePeriod(periodTimings);
      setActivePeriodInfo(detect);
    }, 20000);
    return () => clearInterval(ticker);
  }, [periodTimings]);

  const loadData = async () => {
    try {
      setLoading(true);
      const u = propUser || (await getCurrentUser());
      if (u) setCurrentUser(u);

      const scopedKey = u?.employeeCode
        ? getTeacherScopedStorageKey('setup:teacher', u.employeeCode)
        : 'setup:teacher';

      const [s, scopedTeacher, defaultTeacher, c, tt, cal, syl, lp, asst, insp, pt, savedTasks, savedStaff, savedProfileReqs] = await Promise.all([
        db.get<SchoolDetails>('setup:school'),
        db.get<TeacherProfile>(scopedKey),
        db.get<TeacherProfile>('setup:teacher'),
        db.get<ClassSection[]>('setup:classes'),
        db.get<TimetableSlot[]>('setup:timetable'),
        db.get<CalendarEvent[]>('setup:calendar'),
        db.get<SyllabusItem[]>('setup:syllabus'),
        db.get<DailyLessonPlan[]>('setup:lesson_plans'),
        db.get<AssessmentProgressRecord[]>('setup:assessments'),
        db.get<InspectionReviewRecord[]>('setup:inspections'),
        db.get<Record<number, { time: string; label: string }>>('setup:period_timings'),
        db.get<TeacherTask[]>('setup:tasks'),
        db.get<StaffDetailRecord[]>('setup:staff_details'),
        db.get<ProfileChangeRequest[]>('profile:change_requests')
      ]);
      setProfileRequests(savedProfileReqs || []);

      if (s) setSchool(s);

      // Match staff details record for this teacher if available
      const staffMatch = savedStaff && u?.employeeCode
        ? savedStaff.find(st => st.employeeCode === u.employeeCode || (u.name && st.name && st.name.toLowerCase() === u.name.toLowerCase()))
        : null;

      // Extract any incharge duties mentioned in principalRemarks if not present in academicResponsibilities
      const remarksInchargeList: { dutyName: string; role: string }[] = [];
      if (staffMatch?.principalRemarks) {
        const parts = staffMatch.principalRemarks.split(';');
        for (const p of parts) {
          const trimmed = p.trim();
          if (trimmed && !trimmed.toLowerCase().startsWith('ct:') && !trimmed.toLowerCase().startsWith('co-ct:')) {
            const roleMatch = trimmed.match(/^([^()]+)s*(?:(([^()]+)))?/);
            if (roleMatch) {
              remarksInchargeList.push({
                dutyName: roleMatch[1].trim(),
                role: roleMatch[2]?.trim() || 'In-Charge'
              });
            }
          }
        }
      }

      const mergedResponsibilities = [
        ...(scopedTeacher?.academicResponsibilities || [])
      ];

      for (const rem of remarksInchargeList) {
        if (!mergedResponsibilities.some(r => r.dutyName.toLowerCase() === rem.dutyName.toLowerCase())) {
          mergedResponsibilities.push({
            id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            dutyName: rem.dutyName,
            role: (rem.role as any) || 'In-Charge',
            levelOrClass: 'School Wide',
            academicYear: '2026-27',
            keyOutcomes: 'Assigned official Vidyalaya portfolio.'
          });
        }
      }

      // Construct accurate teacher profile
      const effectiveTeacher: TeacherProfile = {
        ...(defaultTeacher || DEFAULT_TEACHER),
        ...(scopedTeacher || {}),
        name: scopedTeacher?.name || staffMatch?.name || u?.name || defaultTeacher?.name || DEFAULT_TEACHER.name,
        designation: scopedTeacher?.designation || staffMatch?.designation || u?.designation || defaultTeacher?.designation || DEFAULT_TEACHER.designation,
        employeeCode: u?.employeeCode || scopedTeacher?.employeeCode || staffMatch?.employeeCode || defaultTeacher?.employeeCode || DEFAULT_TEACHER.employeeCode,
        classTeacherRole: u?.isClassTeacherOf ? `Class Teacher ${u.isClassTeacherOf}` : (scopedTeacher?.classTeacherRole || (staffMatch?.principalRemarks?.includes('CT:') ? staffMatch.principalRemarks.match(/CT:\s*([^;]+)/)?.[1]?.trim() || '' : '')),
        coClassTeacherRole: u?.isCoClassTeacherOf ? `Co-Class Teacher ${u.isCoClassTeacherOf}` : (scopedTeacher?.coClassTeacherRole || (staffMatch?.principalRemarks?.includes('Co-CT:') ? staffMatch.principalRemarks.match(/Co-CT:\s*([^;]+)/)?.[1]?.trim() || '' : '')),
        academicResponsibilities: mergedResponsibilities
      };

      setTeacher(effectiveTeacher);
      if (c) setClasses(c);
      if (tt) setTimetable(tt);
      if (cal) setCalendar(cal);
      if (syl) setSyllabus(syl);
      if (lp) setLessonPlans(lp);
      if (asst) setAssessments(asst);
      if (insp) setInspections(insp);
      if (pt) {
        setPeriodTimings(pt);
        const detect = detectCurrentActivePeriod(pt);
        setActivePeriodInfo(detect);
      }
      if (savedTasks && savedTasks.length > 0) {
        setTasks(savedTasks);
      }
      if (savedStaff && savedStaff.length > 0) {
        setStaffList(savedStaff);
      }
    } catch (err) {
      console.error('Error loading dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

    // Helper for faculty rendering with Regular (Sky) vs Contractual (Amber) badge
  const renderFacultyPill = (name?: string) => {
    if (!name) return <span className="text-slate-400 font-medium truncate">Assigned Faculty</span>;
    const empType = getStaffEmploymentType(name, staffList);
    const isContractual = empType === 'Contractual';

    return (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        <span className={`font-semibold truncate max-w-[130px] ${isContractual ? 'text-amber-300' : 'text-sky-200'}`}>
          {name}
        </span>
        {isContractual ? (
          <span className="px-1 py-0.2 rounded text-[8px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ⚡ Cont.
          </span>
        ) : (
          <span className="px-1 py-0.2 rounded text-[8px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
            🛡️ Reg.
          </span>
        )}
      </span>
    );
  };

  // Toggle Task Completion
  const handleToggleTask = async (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
        return { ...t, status: nextStatus as 'Pending' | 'Completed' };
      }
      return t;
    });
    setTasks(updated);
    await db.set('setup:tasks', updated);
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    await db.set('setup:tasks', updated);
  };

  // Create New Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task: TeacherTask = {
      id: `tsk-${Date.now()}`,
      title: newTaskTitle.trim(),
      category: 'Teacher Diary Docs',
      priority: newTaskPriority as any,
      status: 'Pending',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: newTaskDueTime,
      subtasks: [],
      tags: [newTaskAssignedBy === 'Self' ? 'Self Created' : 'Assigned by Superior'],
      assignedBy: newTaskAssignedBy === 'Principal'
        ? `Principal ${school.principalName || ''}`.trim()
        : newTaskAssignedBy === 'Incharge'
        ? 'Academic Incharge'
        : 'Self',
      assignedByRole: newTaskAssignedBy,
      isTopPriority: newTaskPriority.includes('Urgent'),
      linkedClass: newTaskClass,
      linkedSubject: 'Mathematics (041)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [task, ...tasks];
    setTasks(updated);
    await db.set('setup:tasks', updated);
    setNewTaskTitle('');
    setShowNewTaskModal(false);
  };

  // Current Teacher's identity
  const currentTeacherName = currentUser?.name || teacher.name || 'Updesh Kumar';
  const assignedClassesList = currentUser?.assignedClasses || ['X-A', 'XII-A', 'XI-B', 'IX-B', 'IX-A'];

  // Teacher's own scheduled classes for the selected day (Guaranteed single class per period)
  const myTodayClasses = useMemo(() => {
    const daySlots = timetable.filter(t => (t.dayOfWeek || t.day) === selectedDay);
    const teacherNameLower = currentTeacherName.trim().toLowerCase();
    const teacherSubjectLower = (teacher.primarySubject || teacher.classesAndSubjectsTaught || 'Mathematics').toLowerCase();

    // 1. Filter slots belonging to this teacher
    const matchingSlots = daySlots.filter(slot => {
      const slotTeacher = (slot.teacherName || '').toLowerCase();
      const arrangementTeacher = (slot.arrangementTeacherName || '').toLowerCase();
      const slotSubject = (slot.subjectName || '').toLowerCase();
      const slotClass = (slot.className || '').trim();

      // Priority A: Direct teacherName match
      if (slotTeacher && teacherNameLower && (slotTeacher.includes(teacherNameLower) || teacherNameLower.includes(slotTeacher))) {
        return true;
      }

      // Priority B: Proxy arrangement assigned to this teacher
      if (slot.isArrangement && arrangementTeacher && teacherNameLower && (arrangementTeacher.includes(teacherNameLower) || teacherNameLower.includes(arrangementTeacher))) {
        return true;
      }

      // Priority C: If slot has no specific teacher or generic name, match only if BOTH class AND subject match
      const isClassAssigned = assignedClassesList.some(c => c.toLowerCase() === slotClass.toLowerCase());
      const isSubjectMatched = teacherSubjectLower && (slotSubject.includes(teacherSubjectLower) || teacherSubjectLower.includes(slotSubject));

      if (isClassAssigned && isSubjectMatched && (!slotTeacher || slotTeacher.includes('assigned staff'))) {
        return true;
      }

      return false;
    });

    // 2. Strict Deduplication: An individual teacher can ONLY be present in ONE class per period!
    const singleClassPerPeriodMap = new Map<number, TimetableSlot>();

    for (const slot of matchingSlots) {
      const pNum = slot.period || slot.periodNumber || 1;
      const slotTeacher = (slot.teacherName || '').toLowerCase();
      const isDirectMatch = slotTeacher.includes(teacherNameLower) || (slot.isArrangement && (slot.arrangementTeacherName || '').toLowerCase().includes(teacherNameLower));

      if (!singleClassPerPeriodMap.has(pNum)) {
        singleClassPerPeriodMap.set(pNum, slot);
      } else if (isDirectMatch) {
        // Direct named teacher assignment takes precedence over generic class matches
        singleClassPerPeriodMap.set(pNum, slot);
      }
    }

    // 3. Convert map to sorted array by period
    const uniqueSlots = Array.from(singleClassPerPeriodMap.values());

    return uniqueSlots.sort((a, b) => {
      const periodA = a.period || a.periodNumber || 1;
      const periodB = b.period || b.periodNumber || 1;
      return sortOrder === 'asc' ? periodA - periodB : periodB - periodA;
    });
  }, [timetable, selectedDay, currentTeacherName, teacher.primarySubject, teacher.classesAndSubjectsTaught, assignedClassesList, sortOrder]);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'data_entry_manager';

  // For Admin / School-Wide View: Group classes period by period
  const periodWiseSchedule = useMemo(() => {
    const daySlots = timetable.filter(t => (t.dayOfWeek || t.day) === selectedDay);
    const allPeriodNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return allPeriodNumbers.map(pNum => {
      let slots = daySlots.filter(s => (s.period || s.periodNumber || 1) === pNum);

      if (scheduleSearch.trim()) {
        const q = scheduleSearch.toLowerCase();
        slots = slots.filter(s =>
          (s.className || '').toLowerCase().includes(q) ||
          (s.subjectName || '').toLowerCase().includes(q) ||
          (s.teacherName || '').toLowerCase().includes(q) ||
          (s.arrangementTeacherName || '').toLowerCase().includes(q) ||
          (s.roomNo || '').toLowerCase().includes(q)
        );
      }

      // Sort classes in natural Roman numeral order
      slots.sort((a, b) => {
        const gradeA = a.className || '';
        const gradeB = b.className || '';
        const cmp = compareClassGrades(gradeA, gradeB);
        return sortOrder === 'asc' ? cmp : -cmp;
      });

      const isCurrentActive = activePeriodInfo.activePeriod === pNum;
      const timingInfo = periodTimings[pNum] || { time: '07:50 AM - 08:30 AM', label: `Period ${pNum}` };

      return {
        periodNumber: pNum,
        time: timingInfo.time,
        label: timingInfo.label,
        slots,
        isCurrentActive
      };
    });
  }, [timetable, selectedDay, scheduleSearch, sortOrder, activePeriodInfo.activePeriod, periodTimings]);

  // Filtered periods based on selectedPeriods for Admin
  const displayedPeriodGroups = useMemo(() => {
    if (selectedPeriods.length === 0 || selectedPeriods.includes(0)) {
      return periodWiseSchedule;
    }
    return periodWiseSchedule.filter(p => selectedPeriods.includes(p.periodNumber));
  }, [periodWiseSchedule, selectedPeriods]);

  // Should show recess break in Admin view
  const shouldShowRecess = useMemo(() => {
    if (selectedPeriods.length === 0 || selectedPeriods.includes(0) || selectedPeriods.includes(-1)) {
      return true;
    }
    return activePeriodInfo.statusLabel.toLowerCase().includes('recess');
  }, [selectedPeriods, activePeriodInfo.statusLabel]);

  // Period Toggle Handler
  const handleTogglePeriodFilter = (pNum: number) => {
    if (pNum === 0) {
      setSelectedPeriods([0]);
      return;
    }
    let next: number[];
    if (selectedPeriods.includes(0)) {
      next = [pNum];
    } else if (selectedPeriods.includes(pNum)) {
      next = selectedPeriods.filter(p => p !== pNum);
      if (next.length === 0) next = [0];
    } else {
      next = [...selectedPeriods, pNum];
    }
    setSelectedPeriods(next);
  };

  // Recess Duty assigned to this teacher today
  const myRecessDutyToday = useMemo(() => {
    const recessInfo = DEFAULT_RECESS_DUTY_ROSTER[selectedDay] || DEFAULT_RECESS_DUTY_ROSTER['Tuesday'];
    return recessInfo.duties.find(d => currentTeacherName && d.name.toLowerCase().includes(currentTeacherName.toLowerCase()));
  }, [selectedDay, currentTeacherName]);

  // General Metrics
  const pendingLessonPlans = lessonPlans.filter(lp => lp.completionStatus === 'Pending' || lp.completionStatus === 'In Progress');
  const incompleteReflections = lessonPlans.filter(lp => !lp.teacherReflection || lp.teacherReflection.trim().length < 10);
  const pendingHomework = lessonPlans.filter(lp => !lp.homework && !lp.assessmentItemFormat);

  const totalSyllabusChapters = syllabus.length || 24;
  const completedSyllabusChapters = syllabus.filter(s => s.status === 'Completed').length || 14;
  const syllabusProgressPercent = Math.round((completedSyllabusChapters / totalSyllabusChapters) * 100);

  const approvedInspections = inspections.filter(i => i.status === 'Approved' || i.status === 'Inspected & Stamped');
  const pendingInspectionsCount = inspections.filter(i => i.status === 'Pending').length;

  // Filter Tasks by Tab
  const filteredTasks = useMemo(() => {
    if (taskTab === 'assigned_by_superiors') {
      return tasks.filter(t => t.assignedByRole === 'Principal' || t.assignedByRole === 'Incharge' || t.assignedByRole === 'Committee' || (t.assignedBy && t.assignedBy !== 'Self'));
    }
    if (taskTab === 'self') {
      return tasks.filter(t => !t.assignedByRole || t.assignedByRole === 'Self' || t.assignedBy === 'Self');
    }
    return tasks;
  }, [tasks, taskTab]);

  const superiorTasksCount = tasks.filter(t => t.assignedByRole === 'Principal' || t.assignedByRole === 'Incharge' || t.assignedByRole === 'Committee').length;
  const selfTasksCount = tasks.filter(t => !t.assignedByRole || t.assignedByRole === 'Self' || t.assignedBy === 'Self').length;
  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;

  // All day slots for Admin stats
  const allTodaySlots = useMemo(() => {
    return timetable.filter(t => (t.dayOfWeek || t.day) === selectedDay);
  }, [timetable, selectedDay]);

  const proxySlotsCount = allTodaySlots.filter(s => s.isArrangement).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400">Loading Dashboard Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Role Identity Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin ? (
                <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Principal & Administration Oversight</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                  👨‍🏫 Teacher Workspace & Personal Diary
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {school.schoolName || 'Kendriya Vidyalaya'}
              </span>
              {devMode && <DevModeBadge pages={[18, 32]} title="KVS Diary P-18 & Analytics" fieldCount={2} />}
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{isAdmin ? (school.principalName || currentUser?.name || 'Principal') : currentTeacherName}</span>
              <span className="text-sm font-semibold text-purple-400 font-mono">
                ({isAdmin ? (school.principalDesignation || currentUser?.designation || 'Principal / Checking Authority') : (teacher.designation || 'PGT Mathematics')})
              </span>
            </h2>

            <p className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
              {isAdmin ? (
                <>
                  <span>Campus: <strong className="text-white">{school.kvCode || 'KV-1042'}</strong></span>
                  <span>•</span>
                  <span>Active Day: <strong className="text-emerald-400">{selectedDay}, 18 August 2026</strong></span>
                  <span>•</span>
                  <span>Total Scheduled Classes: <strong className="text-amber-300">{allTodaySlots.length} Periods</strong></span>
                </>
              ) : (
                <>
                  <span>Emp ID: <strong className="text-white">{teacher.employeeCode || currentUser?.employeeCode || 'T-9842'}</strong></span>
                  <span>•</span>
                  <span>Assigned Classes: <strong className="text-amber-300">{assignedClassesList.join(', ') || 'None assigned'}</strong></span>
                  <span>•</span>
                  <span>Today: <strong className="text-emerald-400">{selectedDay}, 18 August 2026</strong></span>
                </>
              )}
            </p>

            {/* Individual Teacher's Allocated Leadership & Incharge Badges */}
            {!isAdmin && (currentUser?.isClassTeacherOf || currentUser?.isCoClassTeacherOf || teacher.classTeacherRole || teacher.coClassTeacherRole || (teacher.academicResponsibilities && teacher.academicResponsibilities.length > 0)) && (
              <div className="flex items-center gap-2 flex-wrap pt-1 animate-fadeIn">
                {(currentUser?.isClassTeacherOf || teacher.classTeacherRole) && (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/25 text-amber-300 border border-amber-500/50 flex items-center gap-1.5 shadow-xs">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Class Teacher: Class {currentUser?.isClassTeacherOf || teacher.classTeacherRole.replace(/Class Teacher (of )?/i, '')}</span>
                  </span>
                )}

                {(currentUser?.isCoClassTeacherOf || teacher.coClassTeacherRole) && (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 flex items-center gap-1.5 shadow-xs">
                    <Users2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Co-Class Teacher: Class {currentUser?.isCoClassTeacherOf || (teacher.coClassTeacherRole || '').replace(/Co-Class Teacher (of )?/i, '')}</span>
                  </span>
                )}

                {teacher.academicResponsibilities && teacher.academicResponsibilities.map((resp, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-950/90 text-purple-200 border border-purple-400/50 flex items-center gap-1.5 shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{resp.dutyName} ({resp.role})</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <>
                <button
                  onClick={() => onNavigateTab('timetable')}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-200" />
                  <span>Assign Proxy Duty</span>
                </button>

                <button
                  onClick={() => onNavigateTab('lessonplan')}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <FileEdit className="w-4 h-4" />
                  <span>Approve Lesson Plans</span>
                </button>

                <button
                  onClick={() => onNavigateTab('teacher')}
                  className="px-3.5 py-2 rounded-xl bg-purple-950/90 hover:bg-purple-900 text-purple-200 text-xs font-bold border border-purple-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Users className="w-4 h-4 text-purple-300" />
                  <span>Inspect Staff Diaries</span>
                </button>

                <button
                  onClick={() => onNavigateTab('inspection')}
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold border border-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inspection Stamps (P-25)</span>
                </button>

                <button
                  onClick={() => onNavigateTab('reports')}
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold border border-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-purple-400" />
                  <span>Master Reports</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigateTab('lessonplan')}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <FileEdit className="w-4 h-4" />
                  <span>Write Lesson Plan (P-32)</span>
                </button>

                <button
                  onClick={() => setShowNewTaskModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-purple-400" />
                  <span>Add Priority Task</span>
                </button>

                <button
                  onClick={() => onNavigateTab('attendance')}
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold border border-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mark Attendance</span>
                </button>

                <button
                  onClick={() => onNavigateTab('assessment')}
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold border border-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Assessments (P-17)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Core KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {isAdmin ? (
          <>
            <div
              onClick={() => onNavigateTab('timetable')}
              className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl cursor-pointer transition-all space-y-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Total Classes</span>
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{allTodaySlots.length}</div>
              <p className="text-[10px] font-semibold text-slate-400">{selectedDay} Teaching Periods</p>
            </div>

            <div
              onClick={() => onNavigateTab('timetable')}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl cursor-pointer transition-all space-y-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Arrangements</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">{proxySlotsCount}</div>
              <p className="text-[10px] font-semibold text-slate-400">Active Proxy Substitutions</p>
            </div>

            <div
              onClick={() => onNavigateTab('lessonplan')}
              className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl cursor-pointer transition-all space-y-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Lesson Plans</span>
                <FileEdit className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-300 font-mono">{lessonPlans.length}</div>
              <p className="text-[10px] font-semibold text-slate-400">Plans Registered in Portal</p>
            </div>

            <div
              onClick={() => onNavigateTab('inspection')}
              className="bg-slate-900 border border-slate-800 hover:border-rose-500/50 p-4 rounded-2xl cursor-pointer transition-all space-y-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Pending Stamping</span>
                <ShieldCheck className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 font-mono">{pendingInspectionsCount}</div>
              <p className="text-[10px] font-semibold text-slate-400">Awaiting Principal Review</p>
            </div>

            <div
              onClick={() => onNavigateTab('syllabus')}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl cursor-pointer transition-all space-y-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Syllabus Health</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">{syllabusProgressPercent}%</div>
              <p className="text-[10px] font-semibold text-slate-400">{completedSyllabusChapters}/{totalSyllabusChapters} Chapters Covered</p>
            </div>

            <div
              onClick={() => onNavigateTab('workload')}
              className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-2xl cursor-pointer transition-all space-y-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Directives</span>
                <Crown className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400 font-mono">{tasks.length}</div>
              <p className="text-[10px] font-semibold text-slate-400">{completedTasksCount} Completed</p>
            </div>
          </>
        ) : (
          <>
            <div
              onClick={() => onNavigateTab('timetable')}
              className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl cursor-pointer transition-all space-y-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">My Classes Today</span>
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">{myTodayClasses.length}</div>
              <p className="text-[10px] font-semibold text-slate-400">{selectedDay} Teaching Periods</p>
            </div>

            <div
              onClick={() => onNavigateTab('lessonplan')}
              className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl cursor-pointer transition-all space-y-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Pending Plans</span>
                <FileEdit className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">{pendingLessonPlans.length}</div>
              <p className="text-[10px] font-semibold text-slate-400">Lesson Plans in Draft</p>
            </div>

            <div
              onClick={() => onNavigateTab('lessonplan')}
              className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl cursor-pointer transition-all space-y-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Reflections</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 font-mono">{incompleteReflections.length}</div>
              <p className="text-[10px] font-semibold text-slate-400">Pg 49 Self-Reflection</p>
            </div>

            <div
              onClick={() => onNavigateTab('syllabus')}
              className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl cursor-pointer transition-all space-y-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Syllabus Progress</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">{syllabusProgressPercent}%</div>
              <p className="text-[10px] font-semibold text-slate-400">{completedSyllabusChapters}/{totalSyllabusChapters} Chapters Done</p>
            </div>

            <div
              onClick={() => onNavigateTab('workload')}
              className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl cursor-pointer transition-all space-y-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Priority Tasks</span>
                <ListTodo className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-400 font-mono">{tasks.filter(t => t.status !== 'Completed').length}</div>
              <p className="text-[10px] font-semibold text-slate-400">{completedTasksCount}/{tasks.length} Done</p>
            </div>

            <div
              onClick={() => onNavigateTab('inspection')}
              className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl cursor-pointer transition-all space-y-1 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Approvals</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400 font-mono">{approvedInspections.length}</div>
              <p className="text-[10px] font-semibold text-slate-400">Principal / Incharge Stamped</p>
            </div>
          </>
        )}
      </div>

      {/* Main Content Grid: 2 Columns on Left, 1 Column on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT 2 COLUMNS: SCHEDULE + TOP PRIORITY TASKS */}
        <div className="lg:col-span-2 space-y-6">

          {/* SECTION 1: SCHEDULE VIEW (ROLE DEDICATED) */}
          {isAdmin ? (
            /* ADMIN VIEW: PERIOD-WISE BREAKDOWN OF ALL CLASSES */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-base text-white">
                      Today's Teaching Schedule ({selectedDay})
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Period-Wise Breakdown
                    </span>
                    {activePeriodInfo.isOffSchoolHours ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        🌙 Off School Hours (Defaulted to Period 1)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                        🔴 {activePeriodInfo.statusLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Chronological period schedule with subjects, assigned faculty, arrangement substitutions, and recess duty roster.
                  </p>
                </div>

                {/* Day Selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 self-start md:self-auto">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedDay === day ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period Multi-Select Filter Bar & Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                    <Filter className="w-3.5 h-3.5 text-purple-400" /> Filter:
                  </span>

                  <button
                    onClick={() => handleTogglePeriodFilter(0)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedPeriods.includes(0)
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    All Periods
                  </button>

                  {[1, 2, 3, 4].map(p => (
                    <button
                      key={p}
                      onClick={() => handleTogglePeriodFilter(p)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        selectedPeriods.includes(p)
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      P{p}
                    </button>
                  ))}

                  <button
                    onClick={() => handleTogglePeriodFilter(-1)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedPeriods.includes(-1)
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-950 text-amber-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    🥪 Recess
                  </button>

                  {[5, 6, 7, 8, 9].map(p => (
                    <button
                      key={p}
                      onClick={() => handleTogglePeriodFilter(p)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        selectedPeriods.includes(p)
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      P{p}
                    </button>
                  ))}
                </div>

                {/* Search & Sort Controls */}
                <div className="flex items-center gap-2">
                  <div className="relative w-44">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={scheduleSearch}
                      onChange={e => setScheduleSearch(e.target.value)}
                      placeholder="Search class, staff..."
                      className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-[11px] placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}
                    className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    title="Sort class grade order"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
                    <span>{sortOrder === 'asc' ? 'IV → XII' : 'XII → IV'}</span>
                  </button>
                </div>
              </div>

              {/* Period Groups List */}
              <div className="space-y-4">
                {displayedPeriodGroups.map((group) => {
                  const isPeriod4 = group.periodNumber === 4;
                  const isLastBeforeRecess = isPeriod4 && shouldShowRecess;

                  return (
                    <React.Fragment key={group.periodNumber}>
                      {/* Period Block */}
                      <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        group.isCurrentActive
                          ? 'bg-purple-950/30 border-purple-500 shadow-md ring-1 ring-purple-500/50'
                          : 'bg-slate-950 border-slate-800'
                      }`}>
                        {/* Period Header */}
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs ${
                              group.isCurrentActive
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                            }`}>
                              Period {group.periodNumber}
                            </span>
                            <span className="text-xs font-bold text-white font-mono">{group.time}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {group.slots.length} Classes Scheduled
                            </span>
                          </div>

                          {group.isCurrentActive && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500 text-white flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              ACTIVE NOW
                            </span>
                          )}
                        </div>

                        {/* Classes Grid */}
                        {group.slots.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-500 italic">
                            No classes scheduled for Period {group.periodNumber} on {selectedDay}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {group.slots.map(slot => {
                              const isArrangement = slot.isArrangement;

                              return (
                                <div
                                  key={slot.id}
                                  className={`p-3 rounded-xl border transition-all space-y-1.5 text-xs ${
                                    isArrangement
                                      ? 'bg-amber-950/40 border-amber-500/50 shadow-xs'
                                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  {/* Class & Section + Room */}
                                  <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded text-xs font-mono font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                      {slot.className}{slot.section ? `-${slot.section}` : ''}
                                    </span>

                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                      <MapPin className="w-3 h-3 text-purple-400" />
                                      <span>{slot.roomNo || 'Classroom'}</span>
                                    </div>
                                  </div>

                                  {/* Subject Name */}
                                  <div className="font-bold text-white truncate text-xs">
                                    {slot.subjectName}
                                  </div>

                                  {/* Assigned Teacher */}
                                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    {renderFacultyPill(slot.teacherName)}
                                  </div>

                                  {/* Proxy / Arrangement Banner */}
                                  {isArrangement && (
                                    <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/40 text-[10px] text-amber-200 space-y-1">
                                      <div className="flex items-center gap-1.5 font-bold text-amber-300 flex-wrap">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>Arrangement:</span>
                                        {renderFacultyPill(slot.arrangementTeacherName)}
                                      </div>
                                      <div className="text-[9px] text-slate-300 italic flex items-center gap-1 flex-wrap">
                                        <span>Absent:</span>
                                        {renderFacultyPill(slot.originalTeacherName)}
                                        {slot.arrangementReason ? <span>({slot.arrangementReason})</span> : null}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Recess Break Roster Card (Displayed after Period 4) */}
                      {isLastBeforeRecess && (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-orange-950/30 border border-amber-500/40 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-sm">
                                🥪
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-amber-200 flex items-center gap-2">
                                  <span>Mid-Day Recess Break (10:30 AM - 11:00 AM)</span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-black">
                                    Daily Campus Duty Roster
                                  </span>
                                </h4>
                              </div>
                            </div>
                            <span className="text-[10px] text-amber-400 font-mono">
                              🛡️ Campus Safety Protocol
                            </span>
                          </div>

                          {/* Recess Duties Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {(DEFAULT_RECESS_DUTY_ROSTER[selectedDay] || DEFAULT_RECESS_DUTY_ROSTER['Tuesday']).duties.map((duty, dIdx) => (
                              <div key={dIdx} className="p-2.5 rounded-xl bg-slate-950/90 border border-amber-500/20 space-y-1 text-xs">
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  {renderFacultyPill(duty.name)}
                                  <span className="text-[9px] font-bold text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-500/30">
                                    {duty.role}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-300 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>{duty.location}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ) : (
            /* TEACHER VIEW: MY TEACHING SCHEDULE (1 CLASS PER PERIOD) */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              
              {/* Header: Title, Controls, Day Selector */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-base text-white">
                      My Teaching Schedule ({selectedDay})
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                      {myTodayClasses.length} Assigned Periods
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Classes, substitute proxy duties, and campus supervision assigned to <strong className="text-slate-200">{currentTeacherName}</strong> today.
                  </p>
                </div>

                {/* Day Selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 self-start md:self-auto">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedDay === day ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recess Duty Banner (if assigned to this teacher today) */}
              {myRecessDutyToday && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/50 via-slate-950 to-orange-950/40 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-sm">
                      🥪
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-200 flex items-center gap-2">
                        <span>Today's Recess Duty (10:30 AM - 11:00 AM)</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-black">
                          Active Assignment
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300">
                        Location: <strong className="text-white">{myRecessDutyToday.location}</strong> · Role: <strong className="text-amber-300">{myRecessDutyToday.role}</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono self-start sm:self-auto">
                    🛡️ Campus Safety Protocol
                  </span>
                </div>
              )}

              {/* Teacher's Scheduled Classes List */}
              {myTodayClasses.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-2">
                  <Coffee className="w-8 h-8 text-slate-500 mx-auto" />
                  <h4 className="text-xs font-bold text-white">No Scheduled Teaching Classes on {selectedDay}</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Use this day for academic planning, evaluation of homework notebooks, or reviewing student diagnostic assessments.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {myTodayClasses.map(slot => {
                    const periodNum = slot.period || slot.periodNumber || 1;
                    const timeSlot = periodTimings[periodNum]?.time || '07:50 AM - 08:30 AM';
                    const isProxy = slot.isArrangement;
                    const isCurrent = activePeriodInfo.activePeriod === periodNum;

                    return (
                      <div
                        key={slot.id}
                        className={`p-4 rounded-xl border transition-all space-y-2.5 relative overflow-hidden ${
                          isCurrent
                            ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/50'
                            : isProxy
                            ? 'bg-amber-950/30 border-amber-500/40'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Period Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                              isCurrent
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                            }`}>
                              P{periodNum}
                            </span>
                            <span className="text-xs font-bold text-white">Period {periodNum}</span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {timeSlot}
                            </span>
                          </div>

                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500 text-white flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                              ACTIVE NOW
                            </span>
                          )}

                          {isProxy && !isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-black">
                              PROXY / ARR
                            </span>
                          )}
                        </div>

                        {/* Class Details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {slot.className}{slot.section ? `-${slot.section}` : ''}
                            </span>
                            <h5 className="font-bold text-sm text-white truncate">
                              {slot.subjectName}
                            </h5>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-purple-400" />
                            <span>Room: <strong className="text-slate-200">{slot.roomNo || 'Classroom'}</strong></span>
                          </div>
                        </div>

                        {/* Proxy duty note if applicable */}
                        {isProxy && (
                          <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/30 text-[10px] text-amber-200 space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold flex-wrap">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Arrangement for:</span>
                              {renderFacultyPill(slot.originalTeacherName)}
                            </div>
                            {slot.arrangementReason && (
                              <div className="italic text-slate-300 text-[9px]">"{slot.arrangementReason}"</div>
                            )}
                          </div>
                        )}

                        {/* Action Links */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <button
                            onClick={() => onNavigateTab('lessonplan')}
                            className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <span>Lesson Plan (P-32)</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => onNavigateTab('assessment')}
                            className="text-slate-400 hover:text-white font-medium hover:underline cursor-pointer"
                          >
                            Assessment Marks →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: TOP PRIORITY TASKS & ACTION CENTER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            
            {/* Header: Title, Controls, Add Task Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-white">
                    {isAdmin ? 'Institutional Directives & Priority Tasks' : "Today's Top Priority Tasks & Action Center"}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tasks.filter(t => t.status !== 'Completed').length} Pending
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isAdmin
                    ? 'Directives issued by Principal, Section Incharges, and Committees across the institution.'
                    : 'Directives from Principal & Section Incharges alongside personal lesson planning and evaluation items.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewTaskModal(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Filter Tabs: All, Assigned by Principal/Incharges, Created by Self */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setTaskTab('all')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  taskTab === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Tasks ({tasks.length})
              </button>

              <button
                type="button"
                onClick={() => setTaskTab('assigned_by_superiors')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  taskTab === 'assigned_by_superiors'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-400 hover:text-white'
                }`}
              >
                <Crown className="w-3 h-3 text-amber-300" />
                <span>Principal & Incharge Directives ({superiorTasksCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setTaskTab('self')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  taskTab === 'self'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3 h-3 text-purple-300" />
                <span>{isAdmin ? 'Administrative Tasks' : 'Personal / Self'} ({selfTasksCount})</span>
              </button>
            </div>

            {/* Tasks List */}
            <div className="space-y-2.5">
              {filteredTasks.map(task => {
                const isDone = task.status === 'Completed';
                const isSuperior = task.assignedByRole === 'Principal' || task.assignedByRole === 'Incharge' || task.assignedByRole === 'Committee';

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                      isDone
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        : isSuperior
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-xs'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id)}
                          className="mt-0.5 text-slate-400 hover:text-purple-400 cursor-pointer"
                          title={isDone ? 'Mark as Incomplete' : 'Mark as Completed'}
                        >
                          {isDone ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 hover:text-white" />
                          )}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className={`font-bold text-xs ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                              {task.title}
                            </h5>

                            {isSuperior ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                <Crown className="w-2.5 h-2.5 text-amber-400" />
                                <span>{task.assignedBy || 'Superior Directive'}</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                👤 {isAdmin ? 'Administration' : 'Self Created'}
                              </span>
                            )}

                            {task.isTopPriority && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                🔴 Urgent Priority
                              </span>
                            )}
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-slate-400 font-normal">
                              {task.description}
                            </p>
                          )}

                          {/* Subtasks if any */}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="pl-2 border-l-2 border-slate-800 space-y-1 pt-1">
                              {task.subtasks.map(st => (
                                <div key={st.id} className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                  <span>{st.completed ? '✓' : '○'}</span>
                                  <span className={st.completed ? 'line-through text-slate-500' : ''}>{st.title}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {task.dueTime && (
                          <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                            🕒 {task.dueTime}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT 1 COLUMN: PENDING TASKS, SCHEDULED ACTIVITIES, UPCOMING DEADLINES */}
        <div className="space-y-6">

          {/* SECTION 3: PENDING COMPLIANCE / PRINCIPAL APPROVALS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {isAdmin ? <ShieldCheck className="w-5 h-5 text-cyan-400" /> : <AlertTriangle className="w-5 h-5 text-amber-400" />}
                <h3 className="font-bold text-base text-white">
                  {isAdmin ? 'Principal Checking & Approvals' : 'Pending Diary Compliance'}
                </h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isAdmin ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              }`}>
                {isAdmin ? 'Authority Review' : 'Action Items'}
              </span>
            </div>

            <div className="space-y-2.5">
              {isAdmin ? (
                <>
                                    {/* Teacher Profile & Bio-Data Update Requests */}
                  <div
                    onClick={() => {
                      onNavigateTab('teacher');
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('kvs-open-profile-requests', { detail: { selectedId: null } }));
                      }, 50);
                    }}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl cursor-pointer transition-all space-y-1.5 group shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5 group-hover:text-amber-300 transition-colors">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Teacher Profile &amp; Bio-Data Updates</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        profileRequests.filter(r => r.status === 'pending').length > 0
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {profileRequests.filter(r => r.status === 'pending').length > 0
                          ? `${profileRequests.filter(r => r.status === 'pending').length} Pending Approval`
                          : '0 Pending'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Review and approve faculty bio-data updates, qualifications, designations, contact changes, and portfolios.
                    </p>
                    {profileRequests.filter(r => r.status === 'pending').length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {profileRequests.filter(r => r.status === 'pending').map(r => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateTab('teacher');
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('kvs-open-profile-requests', { detail: { selectedId: r.id, employeeCode: r.employeeCode } }));
                              }, 50);
                            }}
                            className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-[9px] font-mono text-amber-200 transition-all cursor-pointer flex items-center gap-1 hover:scale-105 active:scale-95 shadow-sm"
                            title={`Click to inspect and execute approval for ${r.teacherName}`}
                          >
                            <span>{r.teacherName}</span>
                            <span className="text-amber-400 font-bold">({r.changedFields.length} changes)</span>
                            <ChevronRight className="w-2.5 h-2.5 text-amber-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lesson Plans Stamping Alert */}
                  <div
                    onClick={() => onNavigateTab('lessonplan')}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-purple-500/40 rounded-xl cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <FileEdit className="w-3.5 h-3.5 text-purple-400" />
                        <span>Teacher Lesson Plans (P-32)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {lessonPlans.length} Total Plans
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Review weekly pedagogical plans, TLM integration, and learning outcomes submitted by faculty.
                    </p>
                  </div>

                  {/* Inspection Records & Diary Endorsement */}
                  <div
                    onClick={() => onNavigateTab('inspection')}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500/40 rounded-xl cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Inspection & Diary Endorsement (P-25)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {pendingInspectionsCount} Pending
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Record Principal / Vice Principal monthly observation notes, suggestions, and official signature stamps.
                    </p>
                  </div>

                  {/* Assessment Register Review */}
                  <div
                    onClick={() => onNavigateTab('assessment')}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-xl cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Assessment Progress Records (P-17)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {assessments.length} Records
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Verify Periodic Test marks, student achievement distributions, and remedial intervention logs.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Pending Reflections Alert */}
                  <div
                    onClick={() => onNavigateTab('lessonplan')}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-xl cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <FileEdit className="w-3.5 h-3.5 text-amber-400" />
                        <span>Teacher's Self-Reflection</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {incompleteReflections.length} Missing
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Update Page 49 Self-Reflection for recently delivered learning outcomes and student response.
                    </p>
                  </div>

                  {/* Pending Homework Logging Alert */}
                  <div
                    onClick={() => onNavigateTab('lessonplan')}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-purple-500/40 rounded-xl cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                        <span>Homework & Assessment Logs</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {pendingHomework.length} Incomplete
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Record daily homework assignments and formative checking feedback in diary modules.
                    </p>
                  </div>

                  {/* Remedial Teaching Records Alert */}
                  <div
                    onClick={() => onNavigateTab('assessment')}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-xl cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Remedial Follow-up (Pg 20b)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Ready for Log
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Update diagnostic feedback and post-remedial test scores for identified slow learners.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECTION 4: OTHER IMPORTANT SCHEDULED ACTIVITIES TODAY */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">
                  {isAdmin ? 'Campus Daily Duty Schedule' : 'Other Scheduled Activities Today'}
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {selectedDay}
              </span>
            </div>

            <div className="space-y-2.5">
              {TODAY_SCHEDULED_ACTIVITIES.map(act => (
                <div key={act.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate max-w-[190px]">{act.title}</span>
                    <span className="text-[9px] font-mono font-bold text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-500/30 shrink-0">
                      {act.time}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{act.location}</span>
                  </div>

                  <div className="text-[9px] text-indigo-300 font-medium pt-0.5 flex items-center justify-between">
                    <span>⭐ {act.role}</span>
                    <span className="text-[8px] bg-slate-900 px-1 rounded text-slate-400">{act.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: UPCOMING IMPORTANT EVENTS & ACADEMIC DEADLINES */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base text-white">
                  Upcoming Events & Deadlines
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('exams')}
                className="text-xs text-purple-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                Calendar <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {UPCOMING_ACADEMIC_DEADLINES.map(dead => (
                <div key={dead.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate max-w-[170px]">{dead.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border ${
                      dead.urgency === 'high'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    }`}>
                      {dead.date}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{dead.desc}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[9px] text-slate-400">
                    <span>📌 {dead.tag}</span>
                    <span className="font-bold text-amber-300">{dead.daysLeft}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 6: MASTER PRINT REPORTS QUICK LAUNCHER */}
          <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">
                Print-Ready A4 Master Reports
              </h3>
            </div>
            <p className="text-xs font-semibold text-purple-200 leading-relaxed">
              Export exact KVS Teacher's Diary pages 1 to 52 in print-ready A4 PDF format with developer page callout toggles.
            </p>
            <button
              onClick={() => onNavigateTab('reports')}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Launch Master Report Generator</span>
            </button>
          </div>

        </div>

      </div>

      {/* NEW TASK CREATION MODAL */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-base text-white">Add New Priority Task</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Task Title / Action Item *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Prepare PT-2 Question Paper Blueprint..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Assigned By</label>
                  <select
                    value={newTaskAssignedBy}
                    onChange={e => setNewTaskAssignedBy(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="Self">👤 Self (Personal Task)</option>
                    <option value="Principal">👑 Principal {school.principalName ? `(${school.principalName})` : ''}</option>
                    <option value="Incharge">⭐ Academic Incharge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Priority Level</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="Do First (Urgent & Important)">🔴 Do First (Urgent)</option>
                    <option value="Schedule (Important & Not Urgent)">🟡 Schedule (Important)</option>
                    <option value="Routine (Routine Activity)">🟢 Routine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Due Time Today</label>
                  <input
                    type="time"
                    value={newTaskDueTime}
                    onChange={e => setNewTaskDueTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Linked Class</label>
                  <input
                    type="text"
                    value={newTaskClass}
                    onChange={e => setNewTaskClass(e.target.value)}
                    placeholder="e.g. Class X-A"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Add to Priority List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
