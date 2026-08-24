import {
  SchoolDetails,
  TeacherProfile,
  AcademicSession,
  ClassSection,
  SubjectItem,
  TimetableSlot,
  CalendarEvent,
  ExamSchedule,
  SyllabusItem,
  DailyLessonPlan,
  TemplatePageMap,
  AssessmentProgressRecord,
  InspectionReviewRecord,
  HourlyActivity,
  ActivityEvidence,
  CalendarSyncSetting,
  TeacherTask,
  TaskList,
  TaskTagDefinition,
  DutyPreset,
  StudentProfile,
  PracticalAttendanceRecord,
  ScholasticScoreRecordVItoVIII,
  ScholasticScoreRecordIXtoX,
  MonitoringCumReportingRecord,
  LateBloomerProgressRecord,
  NipunMeetingRecord,
  CollaborationMeetingRecord,
  ScholasticRecordClass1_2,
  NotebookRecordClass3_5,
  SeaPlanItem,
  SeaRecordClass3_5,
  ScholasticRecordClass3_5,
  ResultAnalysisClass3_5,
  ResultAnalysisClass6_10,
  ResultAnalysisClass11_12,
  StudentBehaviourObservationRecord,
  RemedialAssistanceRecord20a,
  RemedialTeachingDetailsRecord20b,
  RemedialPerformanceTrackingRecord20c,
  PtmMeetingRecord22,
  StaffMeetingRecord23,
  SubjectCommitteeMeetingRecord24,
  RemedialAttachmentItem,
  OralReadingFluencyRecord,
  MdpAipProjectRecord,
  SecondaryRemedialRecord,
  ExemplaryChildRecord,
  ClassXMarksRecord17f,
  ClassXIAssessmentRecord17g,
  ClassXIIMarksRecord17h,
  PracticalAttendanceRecord17i,
  NotebookSubmissionRecord17j,
  WorkDoneOtherThanTeaching26Record,
  IctClassroomUsage27Record,
  AcademicLossCompensation28Record,
  JoyfulLearning29Record,
  CompetencyTestItem30Record,
  TeacherInnovationProject31aRecord,
  TeacherBestPractice31bRecord,
  StaffDetailRecord,
  CustomRoleDefinition,
  AppDataSnapshot,
  TeacherAttendanceRecord,
  LeaveApplication,
  OnDutyRecord,
  LeaveBalance,
  StudentAttendanceRecord,
  ClassDailyAttendanceRecord,
  TransferCertificateRecord,
  MonthlyEnrollmentSnapshot,
  ProxyDutyAssignment,
  LeaveSettingsConfig,
  Ticket,
  TicketEvidence,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  PortfolioTemplate,
  PortfolioAssignment,
  ResponsibilityDelegation,
  ResponsibilityRequest,
  PortfolioSuggestion,
  SubjectResponsibilityAssignment
} from '../types/academic';
import {
  DEFAULT_STUDENTS,
  DEFAULT_PRACTICAL_ATTENDANCE,
  DEFAULT_SCHOLASTIC_SCORES_VI_VIII,
  DEFAULT_SCHOLASTIC_SCORES_IX_X
} from './studentDefaults';
import {
  DEFAULT_PORTFOLIO_TEMPLATES,
  DEFAULT_PORTFOLIO_ASSIGNMENTS,
  DEFAULT_RESPONSIBILITY_DELEGATIONS,
  DEFAULT_RESPONSIBILITY_REQUESTS,
  DEFAULT_PORTFOLIO_SUGGESTIONS
} from './portfolioDefaults';
import { DEFAULT_SAMPLE_STAFF_LIST } from './staffFileImporter';
import { UserAccount, ModuleApprovalRecord, ApprovalStatus } from '../types/auth';
import { DEFAULT_USER_ACCOUNTS } from './authDefaults';
import { firestoreGet, firestoreSet, firestoreSubscribe, DEFAULT_SCHOOL_ID } from './firebase';

export const DEFAULT_STAFF_DETAILS: StaffDetailRecord[] = DEFAULT_SAMPLE_STAFF_LIST;

// Polyfill window.storage if needed
if (typeof window !== 'undefined' && !(window as any).storage) {
  (window as any).storage = {
    get: async (key: string) => {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    },
    set: async (key: string, value: string) => {
      localStorage.setItem(key, value);
    },
    delete: async (key: string) => {
      localStorage.removeItem(key);
    },
    list: async (prefix: string) => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return { keys };
    }
  };
}

export const db = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const res = await (window as any).storage.get(key);
      if (res?.value) {
        return JSON.parse(res.value);
      }
      // Fallback to Cloud Firestore if missing locally
      const cloudVal = await firestoreGet<T>(key);
      if (cloudVal !== null && cloudVal !== undefined) {
        await (window as any).storage.set(key, JSON.stringify(cloudVal));
        return cloudVal;
      }
      return null;
    } catch (err) {
      console.error(`Error reading storage key ${key}:`, err);
      return null;
    }
  },
  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await (window as any).storage.set(key, JSON.stringify(value));
      // Asynchronously push update to Cloud Firestore
      firestoreSet(key, value).catch(err => {
        console.warn(`[Firestore] Sync failed for ${key}:`, err);
      });
      return true;
    } catch (err) {
      console.error(`Error writing storage key ${key}:`, err);
      return false;
    }
  },
  async remove(key: string): Promise<boolean> {
    try {
      await (window as any).storage.delete(key);
      firestoreSet(key, null).catch(err => {
        console.warn(`[Firestore] Cloud remove failed for ${key}:`, err);
      });
      return true;
    } catch (err) {
      console.error(`Error removing storage key ${key}:`, err);
      return false;
    }
  }
};

// Default seed data for Kendriya Vidyalaya Teacher Diary
export const DEFAULT_SCHOOL: SchoolDetails = {
  schoolName: 'Kendriya Vidyalaya Kutra',
  kvCode: '2218',
  cbseAffiliationNo: '1500052',
  cbseSchoolCode: '19133',
  udiseCode: '21050903372',
  bannerSubtitle: 'An autonomous body under the Ministry of Education, Government of India | KV Code: 2218, CBSE Affiliation Number: 1500052, CBSE School Code: 19133, UDISE Code: 21050903372',
  region: 'Bhubaneswar Region',
  officialEmail: 'kvkutra1@gmail.com',
  address: 'At Centre Primary School Campus, Kutra, Sundargarh, Odisha - 770018',
  principalName: 'Shri Hemananda Barik',
  principalDesignation: 'Principal I/c',
  vicePrincipalName: 'Nil',
  phoneNo: '+91 6001419689',
  website: 'https://kutra.kvs.ac.in/',
  academicYear: '2026 - 2027',
  portalName: "KVS Teacher's Diary"
};

export const DEFAULT_TEACHER: TeacherProfile = {
  name: 'Mrs. Ananya Patnaik',
  designation: 'TGT (P&HE)',
  qualifications: 'M.P.Ed., B.P.Ed., CTET Qualified, NIS Athletics Coach',
  seniorityNo: 'KVS-TGT-PHE-2019-018',
  employeeCode: 'EMP849201',
  dob: '1988-06-15',
  joiningDateKVS: '2014-08-01',
  joiningDatePresentKV: '2021-04-05',
  nccScoutingQualification: 'HWB (Himalaya Wood Badge) Guide Captain',
  gpfCpfPranNo: '110049283741 (PRAN)',
  panNo: 'ABCDE1234F',
  aadharNo: '9876-5432-1098',
  residentialAddress: 'Quarter No. Type IV/12, KV Campus, Unit-IX, Bhubaneswar',
  phoneNo: '+91 94370 12345',
  email: 'ananya.patnaik@kvs.gov.in',
  awardsWon: 'KVS Regional Incentive Award for Excellence in Sports & P&HE (2023)',
  classesAndSubjectsTaught: 'Class VI-A (P&HE), Class IX-A (P&HE), Class X-A (P&HE), Class XI-A (Physical Education)',
  classTeacherRole: 'Class Teacher of Class X-A',
  coClassTeacherRole: '',
  bloodGroup: 'O +ve',
  academicTargets: [
    { id: 'tgt-1', subjectCodeName: 'Physical & Health Education (P&HE)', classSection: 'VI-A', passPercentage: 100, targetA1Count: 25 },
    { id: 'tgt-2', subjectCodeName: 'Physical & Health Education (P&HE)', classSection: 'IX-A', passPercentage: 100, targetA1Count: 20 },
    { id: 'tgt-3', subjectCodeName: 'Physical Education (048)', classSection: 'XI-A', passPercentage: 100, targetA1Count: 15 },
    { id: 'tgt-4', subjectCodeName: 'Mathematics (041)', classSection: 'X-A', passPercentage: 98, targetA1Count: 12 }
  ],
  // P-15: 9(a) Statement of Teaching Philosophy
  teachingPhilosophy: 'My teaching philosophy is anchored in holistic, experiential, and competency-based education as envisioned in NEP-2020 and Panchakosha Vikas. I believe that every child possesses innate curiosity and distinct physical and intellectual potential. As an educator in Kendriya Vidyalaya, my mission is to nurture active health, scientific temperament, emotional resilience, and sportsmanship. By integrating physical literacy, digital tools, and joyful collaborative tasks, I create an inclusive, safe, and empowering classroom environment where every student develops self-discipline, teamwork, and a lifelong commitment to physical and academic excellence.',
  
  // P-15: 9(b) Achievements (Scholastic & Co-Scholastic)
  scholasticAchievementsText: 'Achieved 100% pass result with an outstanding Performance Index (PI: 84.6) in Class X and Class XII Board Physical Education. Developed 8 interactive digital sports modules on DIKSHA and guided 12 students in National Science and Health Exhibition.',
  coScholasticAchievementsText: 'Led KVS Regional Under-17 Girls Volleyball Team to Gold Medal at KVS 53rd National Sports Meet. Guided 6 Guides to receive the Rashtrapati Guide Award. Coordinated Vidyalaya Fit India School 3-Star Accreditation.',
  achievementsList: [
    {
      id: 'ach-1',
      category: 'Scholastic',
      year: '2024-25',
      title: '100% Quality Board Results & Academic Commendation',
      level: 'Regional',
      description: 'Secured 100% pass rate with 84.6 PI in Class X P&HE and Class XII Physical Education (048) with 18 A1 grades.',
      awardOrRecognition: 'KVS Regional Academic Appreciation Certificate'
    },
    {
      id: 'ach-2',
      category: 'Scholastic',
      year: '2023-24',
      title: 'National Digital TLM & E-Content Development',
      level: 'National',
      description: 'Created 8 interactive video lessons on indigenous Indian sports and yoga selected for DIKSHA & PM e-Vidya portals.',
      awardOrRecognition: 'NCERT / KVS E-Content Merit Recognition'
    },
    {
      id: 'ach-3',
      category: 'Co-Scholastic',
      year: '2024-25',
      title: 'Rashtrapati Guide Award Mentorship',
      level: 'National',
      description: 'Mentored and guided 6 Bharat Scouts & Guides who successfully earned the Rashtrapati Guide Award at Rashtrapati Bhavan.',
      awardOrRecognition: 'Himalaya Wood Badge (HWB) Leader Parchment'
    },
    {
      id: 'ach-4',
      category: 'Co-Scholastic',
      year: '2023-24',
      title: 'KVS National Sports Meet Gold Medal as Head Coach',
      level: 'National',
      description: 'Coached and managed the Bhubaneswar Regional U-17 Volleyball team to clinch the Gold Medal at KVS National Games.',
      awardOrRecognition: 'Best Coach Trophy & KVS Regional Incentive Award'
    },
    {
      id: 'ach-5',
      category: 'Co-Scholastic',
      year: '2024-25',
      title: 'Ek Bharat Shreshtha Bharat (EBSB) Folk Dance Prize',
      level: 'Cluster',
      description: 'Trained student dance troupe for EBSB paired-state cultural presentation securing 1st position in Cluster Level.',
      awardOrRecognition: 'Cluster Kala Utsav Trophy'
    }
  ],

  // P-16: 10(a) Academic Responsibilities
  academicResponsibilities: [
    {
      id: 'resp-1',
      dutyName: 'Time-Table Committee Convenor',
      role: 'Convenor',
      levelOrClass: 'Secondary & Sr. Secondary (VI-XII)',
      academicYear: '2025-26',
      keyOutcomes: 'Framed master clash-free timetable integrating NEP 2020 sports periods, digital lab slots, and remedial teaching hours.'
    },
    {
      id: 'resp-2',
      dutyName: 'Examination Committee Member & UBI Data Incharge',
      role: 'Member',
      levelOrClass: 'Classes IX to XII',
      academicYear: '2024-25',
      keyOutcomes: 'Conducted Periodic Tests and Pre-Board examinations smoothly; ensured 100% timely online marks entry.'
    },
    {
      id: 'resp-3',
      dutyName: 'CCA & House Master (Tagore House)',
      role: 'In-Charge',
      levelOrClass: 'School Wide',
      academicYear: '2025-26',
      keyOutcomes: 'Organized inter-house literary, cultural, and sports competitions; guided Tagore House to Overall Runners-up position.'
    },
    {
      id: 'resp-4',
      dutyName: 'Admission Verification Committee Member',
      role: 'Member',
      levelOrClass: 'Classes I & VI Admissions',
      academicYear: '2025-26',
      keyOutcomes: 'Verified service certificates, RTE applications, and Single Girl Child documents with zero discrepancies.'
    }
  ],

  // P-16: 10(b) Contributions to KVS Flagship Programs
  kvsFlagshipContributions: [
    {
      id: 'flag-1',
      programName: 'PM SHRI School Implementation',
      role: 'Green Campus & Health Pillar Coordinator',
      targetGroup: 'Whole Vidyalaya (750 Students)',
      actionsTaken: 'Spearheaded sports infrastructure upgradation, Bagless Days sports workshops, and green energy student sensitization.',
      measurableImpact: 'Vidyalaya secured 5-star rating on PM SHRI National School Quality Assessment Portal.'
    },
    {
      id: 'flag-2',
      programName: 'FIT India School Movement & Yoga Utsav',
      role: 'Nodal Teacher / Lead Coordinator',
      targetGroup: 'Classes I to XII (All Students & Staff)',
      actionsTaken: 'Conducted daily morning fitness drills, organized Fit India Freedom Run, and International Day of Yoga mass demonstration.',
      measurableImpact: 'School achieved FIT India 3-Star Accreditation Certificate from Ministry of Youth Affairs & Sports.'
    },
    {
      id: 'flag-3',
      programName: 'NIPUN Bharat & Jadui Pitara FLN Sports Integration',
      role: 'Foundational Movement Facilitator',
      targetGroup: 'Balvatika to Class II (180 Students)',
      actionsTaken: 'Created indigenous motor-skill learning toys and active movement games to reinforce foundational numeracy and language concepts.',
      measurableImpact: '100% Balvatika children demonstrated enhanced gross motor skills and active participation in class.'
    },
    {
      id: 'flag-4',
      programName: 'Ek Bharat Shreshtha Bharat (EBSB)',
      role: 'EBSB Club Coordinator',
      targetGroup: 'Classes VI to X',
      actionsTaken: 'Organized Odisha-Maharashtra paired state cultural festival, language learning booths, and traditional sports displays.',
      measurableImpact: 'Over 350 students participated; received 1st prize in Regional EBSB cultural exhibition.'
    },
    {
      id: 'flag-5',
      programName: 'Pariksha Pe Charcha (PPC) & Mental Health',
      role: 'Student Counseling & Registration Coordinator',
      targetGroup: 'Classes IX to XII Students & Parents',
      actionsTaken: 'Facilitated 100% online registration of students and parents on MyGov portal; conducted yoga and stress-relief sessions.',
      measurableImpact: 'Zero exam-stress grievances recorded; 15 students received certificates of appreciation from Hon\'ble Prime Minister.'
    }
  ]
};

export const DEFAULT_SESSIONS: AcademicSession[] = [
  { id: 'sess-2026-27', sessionName: '2026 - 2027', startDate: '2026-04-01', endDate: '2027-03-31', isActive: true },
  { id: 'sess-2025-26', sessionName: '2025 - 2026', startDate: '2025-04-01', endDate: '2026-03-31', isActive: false },
  { id: 'sess-2024-25', sessionName: '2024 - 2025', startDate: '2024-04-01', endDate: '2025-03-31', isActive: false }
];

export const DEFAULT_CLASSES: ClassSection[] = [
  { id: 'cls-1a', className: 'I', section: 'A', classTeacherName: 'Mrs. R. Sharma', totalStudents: 35 },
  { id: 'cls-2a', className: 'II', section: 'A', classTeacherName: 'Mrs. P. Das', totalStudents: 36 },
  { id: 'cls-3a', className: 'III', section: 'A', classTeacherName: 'Mrs. M. Roy', totalStudents: 38 },
  { id: 'cls-4a', className: 'IV', section: 'A', classTeacherName: 'Shri A. K. Sahoo', totalStudents: 38 },
  { id: 'cls-5a', className: 'V', section: 'A', classTeacherName: 'Mrs. S. Patnaik', totalStudents: 40 },
  { id: 'cls-6a', className: 'VI', section: 'A', classTeacherName: 'Shri R. K. Sharma', totalStudents: 40 },
  { id: 'cls-7a', className: 'VII', section: 'A', classTeacherName: 'Mrs. S. Mohanty', totalStudents: 42 },
  { id: 'cls-8a', className: 'VIII', section: 'A', classTeacherName: 'Shri B. C. Pradhan', totalStudents: 41 },
  { id: 'cls-9a', className: 'IX', section: 'A', classTeacherName: 'Mrs. S. Jena', totalStudents: 44 },
  { id: 'cls-9b', className: 'IX', section: 'B', classTeacherName: 'Shri A. K. Mishra', totalStudents: 43 },
  { id: 'cls-10a', className: 'X', section: 'A', classTeacherName: 'Mrs. Ananya Patnaik', totalStudents: 42 },
  { id: 'cls-10b', className: 'X', section: 'B', classTeacherName: 'Shri M. K. Panda', totalStudents: 40 },
  { id: 'cls-11a', className: 'XI', section: 'A', classTeacherName: 'Dr. P. K. Dash', totalStudents: 38 },
  { id: 'cls-11b', className: 'XI', section: 'B', classTeacherName: 'Mrs. R. Tripathy', totalStudents: 36 },
  { id: 'cls-11c', className: 'XI', section: 'C', classTeacherName: 'Shri T. K. Sahoo', totalStudents: 35 },
  { id: 'cls-12a', className: 'XII', section: 'A', classTeacherName: 'Shri S. N. Ray', totalStudents: 40 },
  { id: 'cls-12b', className: 'XII', section: 'B', classTeacherName: 'Mrs. M. Swain', totalStudents: 38 },
  { id: 'cls-12c', className: 'XII', section: 'C', classTeacherName: 'Shri G. C. Behera', totalStudents: 34 }
];

export const DEFAULT_SUBJECTS: SubjectItem[] = [
  { id: 'sbj-p01', subjectName: 'Environmental Studies (EVS)', subjectCode: 'EVS', classLevel: 'I - V', targetPassRate: 100, targetA1Count: 25 },
  { id: 'sbj-p02', subjectName: 'Mathematics (Primary)', subjectCode: 'MATH-P', classLevel: 'I - V', targetPassRate: 100, targetA1Count: 25 },
  { id: 'sbj-p03', subjectName: 'English (Primary)', subjectCode: 'ENG-P', classLevel: 'I - V', targetPassRate: 100, targetA1Count: 25 },
  { id: 'sbj-p04', subjectName: 'Hindi (Primary)', subjectCode: 'HIN-P', classLevel: 'I - V', targetPassRate: 100, targetA1Count: 25 },
  { id: 'sbj-001', subjectName: 'Mathematics (041)', subjectCode: '041', classLevel: 'VI - XII', targetPassRate: 100, targetA1Count: 20 },
  { id: 'sbj-002', subjectName: 'Science (086)', subjectCode: '086', classLevel: 'VI - X', targetPassRate: 100, targetA1Count: 18 },
  { id: 'sbj-003', subjectName: 'Social Science (087)', subjectCode: '087', classLevel: 'VI - X', targetPassRate: 100, targetA1Count: 16 },
  { id: 'sbj-004', subjectName: 'English Language & Lit. (184)', subjectCode: '184', classLevel: 'VI - X', targetPassRate: 100, targetA1Count: 22 },
  { id: 'sbj-005', subjectName: 'English Core (301)', subjectCode: '301', classLevel: 'XI & XII', targetPassRate: 100, targetA1Count: 25 },
  { id: 'sbj-006', subjectName: 'Hindi Course-A (002)', subjectCode: '002', classLevel: 'VI - X', targetPassRate: 100, targetA1Count: 20 },
  { id: 'sbj-007', subjectName: 'Physics (042)', subjectCode: '042', classLevel: 'XI & XII', targetPassRate: 100, targetA1Count: 15 },
  { id: 'sbj-008', subjectName: 'Chemistry (043)', subjectCode: '043', classLevel: 'XI & XII', targetPassRate: 100, targetA1Count: 15 },
  { id: 'sbj-009', subjectName: 'Biology (044)', subjectCode: '044', classLevel: 'XI & XII', targetPassRate: 100, targetA1Count: 14 },
  { id: 'sbj-010', subjectName: 'Computer Science (083)', subjectCode: '083', classLevel: 'XI & XII', targetPassRate: 100, targetA1Count: 16 },
  { id: 'sbj-011', subjectName: 'Accountancy (055)', subjectCode: '055', classLevel: 'XI & XII', targetPassRate: 100, targetA1Count: 12 },
  { id: 'sbj-012', subjectName: 'Business Studies (054)', subjectCode: '054', classLevel: 'XI & XII', targetPassRate: 100, targetA1Count: 14 },
  { id: 'sbj-013', subjectName: 'Economics (030)', subjectCode: '030', classLevel: 'XI & XII', targetPassRate: 100, targetA1Count: 15 },
  { id: 'sbj-014', subjectName: 'History (027)', subjectCode: '027', classLevel: 'XI & XII', targetPassRate: 100, targetA1Count: 12 },
  { id: 'sbj-015', subjectName: 'Geography (029)', subjectCode: '029', classLevel: 'XI & XII', targetPassRate: 100, targetA1Count: 12 },
  { id: 'sbj-016', subjectName: 'Political Science (028)', subjectCode: '028', classLevel: 'XI & XII', targetPassRate: 100, targetA1Count: 12 },
  { id: 'sbj-017', subjectName: 'Physical Education (048)', subjectCode: '048', classLevel: 'XI & XII', targetPassRate: 100, targetA1Count: 20 }
];

import { AUTHENTIC_KVS_TIMETABLE } from '../data/defaultTimetableData';

export const DEFAULT_TIMETABLE: TimetableSlot[] = AUTHENTIC_KVS_TIMETABLE;

export const DEFAULT_PERIOD_TIMINGS: Record<number, { time: string; label: string }> = {
  1: { time: '07:50 AM - 08:30 AM', label: 'Period 1' },
  2: { time: '08:30 AM - 09:10 AM', label: 'Period 2' },
  3: { time: '09:10 AM - 09:50 AM', label: 'Period 3' },
  4: { time: '09:50 AM - 10:30 AM', label: 'Period 4 (Recess After)' },
  0: { time: '10:30 AM - 11:00 AM', label: 'Recess & Mid-Day Meal Break' },
  5: { time: '11:00 AM - 11:40 AM', label: 'Period 5' },
  6: { time: '11:40 AM - 12:20 PM', label: 'Period 6' },
  7: { time: '12:20 PM - 01:00 PM', label: 'Period 7' },
  8: { time: '01:00 PM - 01:40 PM', label: 'Period 8' },
  9: { time: '01:40 PM - 02:20 PM', label: 'Period 9 (Remedial / Extra Coaching)' },
};

export const DEFAULT_CALENDAR: CalendarEvent[] = [
  { id: 'cal-1', date: '2025-04-01', title: 'Re-opening of Vidyalaya for Session 2025-26', category: 'KVS Activity', description: 'Welcoming students, special assembly, distribution of textbooks and time tables.', templateRefPage: 50 },
  { id: 'cal-2', date: '2025-04-14', title: 'Dr. B. R. Ambedkar Jayanti', category: 'Gazetted Holiday', description: 'National Holiday on account of Dr. B. R. Ambedkar Jayanti.', templateRefPage: 50 },
  { id: 'cal-3', date: '2025-05-01', title: 'Monthly Staff Meeting & Subject Committee', category: 'Staff Meeting', description: 'Review of monthly split-up syllabus, preparation of learning outcomes and lesson plans.', templateRefPage: 50 },
  { id: 'cal-4', date: '2025-05-12', title: 'Summer Vacation Begins', category: 'Vacation', description: 'Summer vacation for students and teachers till June 20, 2025.', templateRefPage: 50 },
  { id: 'cal-5', date: '2025-06-21', title: 'International Day of Yoga & Vidyalaya Reopens', category: 'KVS Activity', description: 'Yoga session for all staff and students followed by classes.', templateRefPage: 50 },
  { id: 'cal-6', date: '2025-07-15', title: 'Periodic Test 1 (PT-1) Window Begins', category: 'KVS Activity', description: 'Periodic Test 1 for Classes VI to XII as per prescribed syllabus.', templateRefPage: 50 },
  { id: 'cal-7', date: '2025-08-15', title: 'Independence Day Celebration', category: 'KVS Activity', description: 'Flag hoisting, march past, patriotic songs, and cultural presentations.', templateRefPage: 50 },
  { id: 'cal-8', date: '2025-09-05', title: 'Teachers\' Day Celebration', category: 'KVS Activity', description: 'Self-governance by senior students and honoring teacher achievements.', templateRefPage: 50 },
  { id: 'cal-9', date: '2025-09-18', title: 'Half Yearly Examination Window', category: 'KVS Activity', description: 'Mid-term examinations for Classes VI to XII.', templateRefPage: 50 },
  { id: 'cal-10', date: '2025-10-02', title: 'Mahatma Gandhi Jayanti / Swachh Bharat Abhiyan', category: 'KVS Activity', description: 'Cleanliness drive and floral tribute to Mahatma Gandhi and Lal Bahadur Shastri.', templateRefPage: 50 }
];

export const DEFAULT_EXAMS: ExamSchedule[] = [
  { id: 'ex-1', examName: 'Periodic Test 1 (PT-1)', classLevel: 'Classes VI - VIII', subjectName: 'Mathematics', examDate: '2025-07-21', maxMarks: 40, passingMarks: 14, instructions: 'Covers Chapters 1 to 3 as per monthly split-up syllabus.' },
  { id: 'ex-2', examName: 'Periodic Test 1 (PT-1)', classLevel: 'Classes IX & X', subjectName: 'Mathematics (041)', examDate: '2025-07-22', maxMarks: 40, passingMarks: 14, instructions: 'Written Test (40 marks) + Portfolio (5) + Subject Enrichment (5).' },
  { id: 'ex-3', examName: 'Half Yearly Examination', classLevel: 'Classes VI - VIII', subjectName: 'Mathematics', examDate: '2025-09-22', maxMarks: 80, passingMarks: 27, instructions: '50% Term-1 syllabus coverage.' },
  { id: 'ex-4', examName: 'Half Yearly Examination', classLevel: 'Classes IX & X', subjectName: 'Mathematics (041)', examDate: '2025-09-24', maxMarks: 80, passingMarks: 27, instructions: 'CBSE pattern question paper.' },
  { id: 'ex-5', examName: 'Periodic Test 2 (PT-2)', classLevel: 'Classes VI - VIII', subjectName: 'Mathematics', examDate: '2025-12-15', maxMarks: 40, passingMarks: 14, instructions: 'Covers Post-Half Yearly chapters.' },
  { id: 'ex-6', examName: 'Pre-Board 1 (PB-1)', classLevel: 'Class X & XII', subjectName: 'Mathematics (041)', examDate: '2026-01-08', maxMarks: 80, passingMarks: 27, instructions: 'Full 100% CBSE syllabus Board rehearsal.' }
];

export const DEFAULT_SYLLABUS: SyllabusItem[] = [
  // Class I - Primary
  {
    id: 'syl-101',
    className: 'I',
    section: 'A',
    subjectName: 'Environmental Studies (EVS)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'My Self & World',
    chapterNo: 'Chapter 1',
    chapterTitle: 'About Me & My Family',
    teachingTarget: 'Self-introduction, Identifying family members (Father, Mother, Brother, Sister), Body parts awareness.',
    workingDaysRequired: 8,
    periodsRequired: 10,
    revisionPlan: 'Family tree drawing activity.',
    examinationPlan: 'Oral Assessment 1.',
    projectWork: 'Create a "My Family Photo Frame".',
    practicalWork: 'Fingerprint identification art activity.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-28',
    actualCompletionDate: '2025-04-28',
    remarks: 'Kids enjoyed sharing stories about grandparents.',
    templatePageRef: 18
  },
  {
    id: 'syl-102',
    className: 'I',
    section: 'A',
    subjectName: 'Mathematics (Primary)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Shapes & Pre-Number Concepts',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Shapes and Space',
    teachingTarget: 'Inside-Outside, Bigger-Smaller, Top-Bottom, On-Under, Basic shapes (Circle, Square, Triangle).',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Shape sorting with plastic blocks.',
    examinationPlan: 'Evaluation 1 (Foundational Stage).',
    projectWork: 'Shape collage poster using colored paper cutouts.',
    practicalWork: 'Clay modeling of basic geometric shapes.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-29',
    remarks: 'Foundational NIPUN Bharat learning outcome achieved.',
    templatePageRef: 18
  },

  // Class II - Primary
  {
    id: 'syl-201',
    className: 'II',
    section: 'A',
    subjectName: 'Environmental Studies (EVS)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Our Body & Health',
    chapterNo: 'Chapter 1',
    chapterTitle: 'My Body & Cleanliness',
    teachingTarget: 'Sense organs, Healthy habits, Personal hygiene, Daily routine for clean living.',
    workingDaysRequired: 8,
    periodsRequired: 10,
    revisionPlan: 'Handwashing 7 steps demo drill.',
    examinationPlan: 'Periodic Assessment 1.',
    projectWork: 'Hygiene chart poster.',
    practicalWork: 'Sense organ identification blindfold game.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-28',
    actualCompletionDate: '2025-04-28',
    remarks: 'Interactive handwashing demo done.',
    templatePageRef: 18
  },
  {
    id: 'syl-202',
    className: 'II',
    section: 'A',
    subjectName: 'Mathematics (Primary)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Measurement & Numbers',
    chapterNo: 'Chapter 1',
    chapterTitle: 'What is Long, What is Round?',
    teachingTarget: 'Rolling vs Sliding objects, Counting in groups, Tens & Ones place value concept.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Rolling vs sliding ramp test.',
    examinationPlan: 'Evaluation 1.',
    projectWork: 'Group counting using bindi sheets.',
    practicalWork: 'Maths Kit: Abacus and spike board counting.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-29',
    remarks: 'NIPUN FLN goal achieved.',
    templatePageRef: 18
  },

  // Class III - Primary
  {
    id: 'syl-301',
    className: 'III',
    section: 'A',
    subjectName: 'Environmental Studies (EVS)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Animal World',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Poonam\'s Day Out',
    teachingTarget: 'Observing animals in nature, Animal movements (fly, crawl, walk, hop), Animal habitats & sounds.',
    workingDaysRequired: 8,
    periodsRequired: 10,
    revisionPlan: 'Animal habitat matching worksheet.',
    examinationPlan: 'Periodic Test 1.',
    projectWork: 'Animal footprint collage.',
    practicalWork: 'School garden ecosystem walk.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-28',
    actualCompletionDate: '2025-04-28',
    remarks: 'Vidyalaya garden field trip conducted.',
    templatePageRef: 18
  },
  {
    id: 'syl-302',
    className: 'III',
    section: 'A',
    subjectName: 'Mathematics (Primary)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Spatial Understanding',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Where to Look From',
    teachingTarget: 'Top view, Front view, Side view, Mirror halves, Symmetry in patterns.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Mirror symmetry paper folding.',
    examinationPlan: 'PT-1 Math.',
    projectWork: 'Rangoli symmetry design.',
    practicalWork: 'Drawing 3D box perspectives.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-29',
    remarks: 'Excellent mirror halves concepts demonstrated.',
    templatePageRef: 18
  },

  // Class IV - Primary
  {
    id: 'syl-401',
    className: 'IV',
    section: 'A',
    subjectName: 'Environmental Studies (EVS)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Transport & Bridges',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Going to School',
    teachingTarget: 'Different modes of transport to reach school across India (Bamboo bridge, Trolley, Vallam, Camel cart, Jugad).',
    workingDaysRequired: 8,
    periodsRequired: 10,
    revisionPlan: 'Indian transport map puzzle.',
    examinationPlan: 'PT-1 EVS.',
    projectWork: 'Pulp and popsicle stick bridge model.',
    practicalWork: 'Virtual video journey of Ladakh & Assam rope bridges.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-28',
    actualCompletionDate: '2025-04-28',
    remarks: 'Students appreciated transport diversity across states.',
    templatePageRef: 18
  },
  {
    id: 'syl-402',
    className: 'IV',
    section: 'A',
    subjectName: 'Mathematics (Primary)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Building & Patterns',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Building with Bricks',
    teachingTarget: 'Brick floor patterns, Arc designs, 3D faces of bricks, Calculating total bricks & cost estimation.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Brick pattern tessellation worksheet.',
    examinationPlan: 'PT-1 Mathematics.',
    projectWork: 'Model monument using real or clay bricks.',
    practicalWork: 'Measuring brick dimensions with measuring tape.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-29',
    remarks: 'Practical estimation skills built.',
    templatePageRef: 18
  },

  // Class V - Primary
  {
    id: 'syl-501',
    className: 'V',
    section: 'A',
    subjectName: 'Environmental Studies (EVS)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Animal Behaviour & Senses',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Super Senses',
    teachingTarget: 'Super sense of smell in ants & dogs, Vision in birds, Hearing in tiger & sloths, Animal poaching & tiger protection.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Super senses summary table & National Parks map.',
    examinationPlan: 'PT-1 EVS.',
    projectWork: 'Wildlife conservation & anti-poaching awareness poster.',
    practicalWork: 'Experimenting with ant scent trails and sugar bait.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-28',
    actualCompletionDate: '2025-04-28',
    remarks: 'High curiosity during ant trail experiment.',
    templatePageRef: 18
  },
  {
    id: 'syl-502',
    className: 'V',
    section: 'A',
    subjectName: 'Mathematics (Primary)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Large Numbers & Measurement',
    chapterNo: 'Chapter 1',
    chapterTitle: 'The Fish Tale',
    teachingTarget: 'Speed, distance, time calculations for fishing boats, Lakhs & Crores place value, Fish market word problems.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Boats speed & catch weight math drills.',
    examinationPlan: 'PT-1 Mathematics.',
    projectWork: 'Women\'s Fish Bank loan & interest savings calculation project.',
    practicalWork: 'Maths Lab: Place value chart up to 1 Crore.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-29',
    remarks: 'Financial literacy basics introduced.',
    templatePageRef: 18
  },

  // Class VI - Mathematics
  {
    id: 'syl-601',
    className: 'VI',
    section: 'A',
    subjectName: 'Mathematics (041)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Number System',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Knowing Our Numbers',
    teachingTarget: 'Comparing numbers, Large numbers in practice, Indian & International Place Value System, Estimation and Brackets.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Place value chart drill and estimation worksheets.',
    examinationPlan: 'Periodic Test-1 (Weightage: 10 Marks).',
    projectWork: 'Design a population chart comparison poster for Indian states.',
    practicalWork: 'Maths Lab Activity: Making Place Value cards up to 8 digits.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-28',
    remarks: 'Active student participation in place value games.',
    templatePageRef: 18
  },
  {
    id: 'syl-602',
    className: 'VI',
    section: 'A',
    subjectName: 'Science (086)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Food & Nutrition',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Components of Food',
    teachingTarget: 'Nutrients in food (Carbohydrates, Proteins, Fats, Vitamins, Minerals), Balanced Diet, Deficiency Diseases.',
    workingDaysRequired: 8,
    periodsRequired: 10,
    revisionPlan: 'Dietary survey chart review and deficiency disease table.',
    examinationPlan: 'Formative Quiz M1.',
    projectWork: 'Create a Balanced Diet Thali model using eco-friendly materials.',
    practicalWork: 'Science Lab: Testing for Starch (Iodine Test) and Protein (Biuret Test) in food samples.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-28',
    actualCompletionDate: '2025-04-27',
    remarks: 'Demonstration experiments conducted successfully.',
    templatePageRef: 18
  },
  {
    id: 'syl-603',
    className: 'VI',
    section: 'A',
    subjectName: 'Social Science (087)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Our Pasts - I',
    chapterNo: 'Chapter 1',
    chapterTitle: 'What, Where, How and When?',
    teachingTarget: 'Finding out about past, Manuscripts, Inscriptions, Archaeology, Historians, Dates & Timeline (BC/AD).',
    workingDaysRequired: 8,
    periodsRequired: 10,
    revisionPlan: 'Timeline drawing drill on chart paper.',
    examinationPlan: 'Periodic Test 1.',
    projectWork: 'Collect pictures of ancient coins and inscriptions.',
    practicalWork: 'Map Activity: Locating Indus Valley & Narmada river sites on India outline map.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-25',
    actualCompletionDate: '2025-04-25',
    remarks: 'Map filling work completed by all students.',
    templatePageRef: 18
  },
  {
    id: 'syl-604',
    className: 'VI',
    section: 'A',
    subjectName: 'English Language & Lit. (184)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Honeysuckle',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Who Did Patrick\'s Homework? & A House, A Home',
    teachingTarget: 'Reading comprehension, Vocabulary expansion, Nouns (Common, Proper, Collective), Rhyming schemes.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Recitation practice and paragraph writing on "My Dream Home".',
    examinationPlan: 'Unit Test 1.',
    projectWork: 'Illustrated story card creation.',
    practicalWork: 'Language Lab: Pronunciation and listening comprehension exercise.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-29',
    actualCompletionDate: '2025-04-29',
    remarks: 'Roleplay performed in English language hour.',
    templatePageRef: 18
  },

  // Class VII - Mathematics & Science & Social Science & English
  {
    id: 'syl-701',
    className: 'VII',
    section: 'A',
    subjectName: 'Mathematics (041)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Number Systems',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Integers',
    teachingTarget: 'Properties of addition & subtraction of integers, Multiplication & Division of integers, Word problems.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Integer number line jump activity & practice sheet.',
    examinationPlan: 'Periodic Test 1.',
    projectWork: 'Integer board game design.',
    practicalWork: 'Maths Lab Activity: Verification of integer addition using colored counters (Red & Blue).',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-30',
    remarks: 'Integer signs mastered by 90% class.',
    templatePageRef: 18
  },
  {
    id: 'syl-702',
    className: 'VII',
    section: 'A',
    subjectName: 'Science (086)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Life Processes',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Nutrition in Plants',
    teachingTarget: 'Mode of nutrition in plants, Photosynthesis, Autotrophs, Heterotrophs, Saprotrophs, Symbiosis.',
    workingDaysRequired: 8,
    periodsRequired: 10,
    revisionPlan: 'Stomata structure diagram drawing and photosynthesis equation.',
    examinationPlan: 'PT-1 Quiz.',
    projectWork: 'Herbarium file of insectivorous plant pictures.',
    practicalWork: 'Science Lab: Observation of fungi/bread mould under microscope.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-28',
    actualCompletionDate: '2025-04-27',
    remarks: 'Microscope viewing completed in pairs.',
    templatePageRef: 18
  },
  {
    id: 'syl-703',
    className: 'VII',
    section: 'A',
    subjectName: 'Social Science (087)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Our Environment',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Environment & Ecosystem',
    teachingTarget: 'Components of environment (Natural, Human-made, Human), Ecosystem, Domains of Earth (Lithosphere, Hydrosphere, Atmosphere, Biosphere).',
    workingDaysRequired: 8,
    periodsRequired: 10,
    revisionPlan: 'Diagram labeling of domains of Earth.',
    examinationPlan: 'PT-1 Examination.',
    projectWork: 'Poster on Ecosystem Conservation.',
    practicalWork: 'Field Visit: School botanical garden ecosystem study.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-26',
    actualCompletionDate: '2025-04-26',
    remarks: 'Outdoor garden study noted in observation diaries.',
    templatePageRef: 18
  },

  // Class VIII - Science & Mathematics
  {
    id: 'syl-801',
    className: 'VIII',
    section: 'A',
    subjectName: 'Mathematics (041)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Number Systems',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Rational Numbers',
    teachingTarget: 'Properties of Rational Numbers (Closure, Commutative, Associative, Distributive), Representation on Number Line.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Distributive law worksheet and NCERT exercise problem solving.',
    examinationPlan: 'PT-1 Assessment.',
    projectWork: 'Number System tree classification chart.',
    practicalWork: 'Maths Lab Activity: Locating rational numbers between two given numbers on paper ribbon.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-29',
    remarks: 'Good grasp of distributive property.',
    templatePageRef: 18
  },
  {
    id: 'syl-802',
    className: 'VIII',
    section: 'A',
    subjectName: 'Science (086)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Agriculture & Food',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Crop Production and Management',
    teachingTarget: 'Agricultural practices: Preparation of soil, Sowing, Adding manure and fertilisers, Irrigation, Harvesting, Storage.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Difference between Manure & Fertiliser comparison matrix.',
    examinationPlan: 'Periodic Test 1.',
    projectWork: 'Sample collection of Kharif and Rabi crops in seed jars.',
    practicalWork: 'Science Lab: Seed quality test by water flotation technique.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-29',
    actualCompletionDate: '2025-04-28',
    remarks: 'Seed quality experiment conducted in science lab.',
    templatePageRef: 18
  },

  // Class IX - Science & Mathematics & English
  {
    id: 'syl-901',
    className: 'IX',
    section: 'A',
    subjectName: 'Mathematics (041)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Number Systems',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Number Systems',
    teachingTarget: 'Real numbers, Irrational numbers, Real numbers and their decimal expansions, Representing real numbers on number line, Operations on real numbers, Laws of exponents for real numbers.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Rationalisation of denominator problem drills.',
    examinationPlan: 'Periodic Test 1.',
    projectWork: 'Spiral of square roots on chart paper.',
    practicalWork: 'Maths Lab Activity: Geometrical representation of √x on paper.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-29',
    remarks: 'Rationalisation techniques thoroughly reviewed.',
    templatePageRef: 18
  },
  {
    id: 'syl-902',
    className: 'IX',
    section: 'A',
    subjectName: 'Science (086)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Matter - Its Nature and Behaviour',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Matter in Our Surroundings',
    teachingTarget: 'Physical nature of matter, Characteristics of particles of matter, States of matter (Solid, Liquid, Gas), Evaporation, Latent heat.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Interconversion of states of matter diagram & cooling effect of evaporation.',
    examinationPlan: 'PT-1 Written Test.',
    projectWork: 'Model of arrangement of particles in 3 states of matter using beads.',
    practicalWork: 'Science Lab: Determination of melting point of ice and boiling point of water.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-28',
    actualCompletionDate: '2025-04-28',
    remarks: 'Boiling point thermometer readings verified by all groups.',
    templatePageRef: 18
  },
  {
    id: 'syl-903',
    className: 'IX',
    section: 'A',
    subjectName: 'Social Science (087)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'India and the Contemporary World - I',
    chapterNo: 'Chapter 1',
    chapterTitle: 'The French Revolution',
    teachingTarget: 'French Society during late 18th century, Outbreak of revolution, France becomes constitutional monarchy & republic, Abolition of slavery, Everyday life.',
    workingDaysRequired: 12,
    periodsRequired: 14,
    revisionPlan: 'Causes of French revolution mindmap and key personality profiles.',
    examinationPlan: 'PT-1 Exam.',
    projectWork: 'Poster on Declaration of Rights of Man and Citizen.',
    practicalWork: 'Map Work: Paris, Bordeaux, Nantes, Marseilles on France map.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-30',
    remarks: 'Map pointing completed in notebooks.',
    templatePageRef: 18
  },

  // Class X - Mathematics, Science, Social Science, English, Hindi
  {
    id: 'syl-101',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Number Systems',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Real Numbers',
    teachingTarget: 'Fundamental Theorem of Arithmetic, Proofs of Irrationality of √2, √3, √5.',
    workingDaysRequired: 8,
    periodsRequired: 10,
    revisionPlan: '2 Revision classes, Worksheets on Irrationality proofs, NCERT Exemplar questions.',
    examinationPlan: 'Formative Assessment M1 & PT-1 Examination.',
    projectWork: 'Art-Integrated Project: Chart mapping Golden Ratio in Odisha Sun Temple architecture.',
    practicalWork: 'Maths Lab Activity 1: Constructing Square Root Spiral on square grid.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-28',
    remarks: 'Syllabus completed ahead of schedule with 100% student submission.',
    templatePageRef: 18
  },
  {
    id: 'syl-102',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    month: 'April',
    unitNo: 'Unit 2',
    unitTitle: 'Algebra',
    chapterNo: 'Chapter 2',
    chapterTitle: 'Polynomials',
    teachingTarget: 'Zeros of a Polynomial, Relationship between Zeros and Coefficients of Quadratic Polynomials.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Question Bank solving on Quadratic polynomial factorisation.',
    examinationPlan: 'PT-1 Written Test Coverage (10 Marks weightage).',
    projectWork: 'Graphical Representation of Parabola curve using String Art.',
    practicalWork: 'Maths Lab Activity 2: Geometric representation of zeros of polynomial ax + b.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-05-10',
    actualCompletionDate: '2025-05-10',
    remarks: 'Remedial session conducted for 5 students on polynomial division.',
    templatePageRef: 18
  },
  {
    id: 'syl-103',
    className: 'X',
    section: 'A',
    subjectName: 'Science (086)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Chemical Substances - Nature & Behaviour',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Chemical Reactions and Equations',
    teachingTarget: 'Chemical equation, Balanced chemical equation, Implications of balanced chemical equation, Types of chemical reactions: Combination, Decomposition, Displacement, Double displacement, Precipitation, Endothermic & Exothermic, Oxidation and Reduction.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Balancing chemical equations practice worksheet.',
    examinationPlan: 'PT-1 Examination.',
    projectWork: 'Rusting of iron preventive measures survey chart.',
    practicalWork: 'Science Lab: Performing and observing combination, decomposition, displacement, and double displacement reactions.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-28',
    remarks: 'Magnesium ribbon burning experiment demonstrated in lab.',
    templatePageRef: 18
  },
  {
    id: 'syl-104',
    className: 'X',
    section: 'A',
    subjectName: 'Science (086)',
    month: 'May',
    unitNo: 'Unit 2',
    unitTitle: 'World of Living',
    chapterNo: 'Chapter 6',
    chapterTitle: 'Life Processes',
    teachingTarget: 'Basic concept of nutrition, respiration, transport and excretion in plants and animals.',
    workingDaysRequired: 12,
    periodsRequired: 15,
    revisionPlan: 'Diagram practice of human digestive and respiratory systems.',
    examinationPlan: 'Monthly Unit Test (May).',
    projectWork: 'Working model of human heart blood circulation.',
    practicalWork: 'Science Lab: Preparing a temporary mount of a leaf peel to show stomata.',
    completionStatus: 'In Progress',
    targetCompletionDate: '2025-05-25',
    actualCompletionDate: '',
    remarks: 'Stomata temporary mount prepared by all students.',
    templatePageRef: 18
  },
  {
    id: 'syl-105',
    className: 'X',
    section: 'A',
    subjectName: 'Social Science (087)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'India & Contemporary World - II',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Rise of Nationalism in Europe',
    teachingTarget: 'French Revolution idea of Nation, Making of Nationalism, Age of Revolutions (1830-1848), Unification of Germany & Italy, Visualising Nation.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Timeline of European Unification movements.',
    examinationPlan: 'PT-1 Examination.',
    projectWork: 'Allegory of Germania & Marianne research report.',
    practicalWork: 'Map Work: Identification of countries involved in World War & Treaty of Vienna.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-29',
    remarks: 'Map work checked in student portfolios.',
    templatePageRef: 18
  },

  // Class XI - Physics, Chemistry, Biology, Mathematics, Computer Science
  {
    id: 'syl-1101',
    className: 'XI',
    section: 'A',
    subjectName: 'Physics (042)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Physical World and Measurement',
    chapterNo: 'Chapter 1 & 2',
    chapterTitle: 'Units and Measurements',
    teachingTarget: 'SI units, Fundamental and derived units, Significant figures, Dimensions of physical quantities, Dimensional analysis and its applications.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Dimensional analysis formula conversion problems.',
    examinationPlan: 'Periodic Test 1.',
    projectWork: 'History of SI units timeline chart.',
    practicalWork: 'Physics Lab: Vernier Calipers - Measuring diameter of a small spherical body.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-29',
    remarks: 'Vernier zero error calculations demonstrated.',
    templatePageRef: 18
  },
  {
    id: 'syl-1102',
    className: 'XI',
    section: 'A',
    subjectName: 'Chemistry (043)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Basic Concepts of Chemistry',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Some Basic Concepts of Chemistry',
    teachingTarget: 'General Introduction: Importance and scope of chemistry, Atomic and molecular masses, Mole concept and molar mass, Percentage composition, Empirical & molecular formula, Stoichiometry.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Mole concept numerical solving marathon.',
    examinationPlan: 'PT-1 Written Exam.',
    projectWork: 'Mole concept real-life analogy poster.',
    practicalWork: 'Chemistry Lab: Preparation of standard solution of Oxalic acid.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-28',
    actualCompletionDate: '2025-04-28',
    remarks: 'Standard Oxalic acid prepared by every student.',
    templatePageRef: 18
  },

  // Class XII - Physics, Chemistry, Biology, Mathematics, Computer Science
  {
    id: 'syl-1201',
    className: 'XII',
    section: 'A',
    subjectName: 'Physics (042)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Electrostatics',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Electric Charges and Fields',
    teachingTarget: 'Electric Charges, Conservation of charge, Coulomb\'s law, Electric field, Electric dipole, Electric flux, Gauss\'s theorem and its applications.',
    workingDaysRequired: 12,
    periodsRequired: 15,
    revisionPlan: 'Gauss Law derivations and numerical problem solving.',
    examinationPlan: 'Periodic Test 1.',
    projectWork: 'Van de Graaff generator working principles report.',
    practicalWork: 'Physics Lab: Metre Bridge - Determination of specific resistance of a wire.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-29',
    remarks: 'Metre bridge Null point reading practice completed.',
    templatePageRef: 18
  },
  {
    id: 'syl-1202',
    className: 'XII',
    section: 'A',
    subjectName: 'Chemistry (043)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Physical Chemistry',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Solutions',
    teachingTarget: 'Types of solutions, Expression of concentration, Solubility of gases in liquids (Henry\'s law), Raoult\'s law, Colligative properties (Relative lowering of vapour pressure, Elevation of boiling point, Depression of freezing point, Osmotic pressure), Abnormal molar mass.',
    workingDaysRequired: 12,
    periodsRequired: 15,
    revisionPlan: 'Vant Hoff factor numerical problems and Raoult law derivation.',
    examinationPlan: 'PT-1 Exam.',
    projectWork: 'Osmosis applications in kidney dialysis medical technology.',
    practicalWork: 'Chemistry Lab: Volumetric Analysis - Titration of KMnO4 vs Mohr\'s Salt.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-30',
    remarks: 'KMnO4 Titration endpoint pink color achieved accurately.',
    templatePageRef: 18
  },
  {
    id: 'syl-1203',
    className: 'XII',
    section: 'A',
    subjectName: 'Mathematics (041)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Relations and Functions',
    chapterNo: 'Chapter 1 & 2',
    chapterTitle: 'Relations & Functions & Inverse Trigonometric Functions',
    teachingTarget: 'Types of relations: Reflexive, Symmetric, Transitive, Equivalence. One to one & onto functions. Inverse Trigonometric Functions: Definition, range, domain, principal value branch.',
    workingDaysRequired: 12,
    periodsRequired: 15,
    revisionPlan: 'Inverse trig principal value evaluation worksheets.',
    examinationPlan: 'PT-1 Exam.',
    projectWork: 'Graphic representation of inverse trigonometric functions using GeoGebra.',
    practicalWork: 'Maths Lab Activity: Verification of equivalence relation using set diagrams.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-28',
    remarks: 'Good performance in principal value questions.',
    templatePageRef: 18
  },
  {
    id: 'syl-103b',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    month: 'July',
    unitNo: 'Unit 2',
    unitTitle: 'Algebra',
    chapterNo: 'Chapter 4',
    chapterTitle: 'Quadratic Equations',
    teachingTarget: 'Standard form ax² + bx + c = 0, Solutions by Factorization & Discriminant Formula, Nature of Roots.',
    workingDaysRequired: 12,
    periodsRequired: 14,
    revisionPlan: 'Problem Solving Worksheet on Word Problems involving Real Life Situations.',
    examinationPlan: 'Half Yearly Examination (September).',
    projectWork: 'Poster making on Real-world application of Quadratic curves in satellite dishes.',
    practicalWork: 'Maths Lab Activity 4: Finding roots of quadratic equation by completing square method geometrically.',
    completionStatus: 'Planned',
    targetCompletionDate: '2025-07-31',
    actualCompletionDate: '',
    remarks: 'Targeted to start immediately after PT-1 window.',
    templatePageRef: 18
  },
  {
    id: 'syl-105',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    month: 'August',
    unitNo: 'Unit 2',
    unitTitle: 'Algebra',
    chapterNo: 'Chapter 5',
    chapterTitle: 'Arithmetic Progressions',
    teachingTarget: 'Derivation of nth term and Sum of first n terms of A.P., Applications in solving daily life problems.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Formative quiz and Speed Math competition.',
    examinationPlan: 'Half Yearly Examination & CBSE Board Sample Question Papers.',
    projectWork: 'Investigation project on Fibonacci Sequence in Nature.',
    practicalWork: 'Maths Lab Activity 5: Verifying sum of first n natural numbers geometrically.',
    completionStatus: 'Planned',
    targetCompletionDate: '2025-08-20',
    actualCompletionDate: '',
    remarks: '',
    templatePageRef: 18
  },
  {
    id: 'syl-106',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    month: 'August',
    unitNo: 'Unit 3',
    unitTitle: 'Coordinate Geometry',
    chapterNo: 'Chapter 7',
    chapterTitle: 'Coordinate Geometry',
    teachingTarget: 'Review of Coordinate Geometry concepts, Distance Formula, Section Formula (Internal division).',
    workingDaysRequired: 8,
    periodsRequired: 10,
    revisionPlan: 'Coordinate Grid graph exercises.',
    examinationPlan: 'Half Yearly Exam.',
    projectWork: 'Mapping school playground coordinates using GPS / Graph sheet.',
    practicalWork: 'Maths Lab Activity 6: Verifying Section Formula using thread art.',
    completionStatus: 'Revised',
    targetCompletionDate: '2025-08-31',
    actualCompletionDate: '',
    remarks: 'Adjusted periods due to Regional Sports Meet schedule.',
    templatePageRef: 18
  },
  {
    id: 'syl-107',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    month: 'September',
    unitNo: 'Unit 4',
    unitTitle: 'Geometry',
    chapterNo: 'Chapter 6',
    chapterTitle: 'Triangles',
    teachingTarget: 'Basic Proportionality Theorem (Thales Theorem) & Converse, Criteria for Similarity of Triangles.',
    workingDaysRequired: 14,
    periodsRequired: 16,
    revisionPlan: 'Theorem Proof Writing drills and HOTS question series.',
    examinationPlan: 'Half Yearly Examination & Board Term 1.',
    projectWork: 'Model making on Similar Triangles and Indirect Height Measurement.',
    practicalWork: 'Maths Lab Activity 7: Experimental verification of Basic Proportionality Theorem.',
    completionStatus: 'Rescheduled',
    targetCompletionDate: '2025-09-15',
    actualCompletionDate: '',
    remarks: 'Moved forward to allow dedicated 1-week Half Yearly revision.',
    templatePageRef: 18
  },
  {
    id: 'syl-108',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    month: 'October',
    unitNo: 'Unit 5',
    unitTitle: 'Trigonometry',
    chapterNo: 'Chapter 8',
    chapterTitle: 'Introduction to Trigonometry',
    teachingTarget: 'Trigonometric Ratios of acute angles, Values at 0°, 30°, 45°, 60°, 90°, Trigonometric Identities.',
    workingDaysRequired: 12,
    periodsRequired: 14,
    revisionPlan: 'Trigonometric Identity Proof Marathon worksheet.',
    examinationPlan: 'PT-2 Examination.',
    projectWork: 'Constructing a Clinometer instrument for angle measurement.',
    practicalWork: 'Maths Lab Activity 8: Measuring height of Vidyalaya flagpole using Clinometer.',
    completionStatus: 'Pending',
    targetCompletionDate: '2025-10-25',
    actualCompletionDate: '',
    remarks: 'Awaiting completion of Half Yearly examination evaluation.',
    templatePageRef: 18
  },
  {
    id: 'syl-109',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    month: 'November',
    unitNo: 'Unit 5',
    unitTitle: 'Trigonometry',
    chapterNo: 'Chapter 9',
    chapterTitle: 'Some Applications of Trigonometry',
    teachingTarget: 'Heights and Distances: Angle of Elevation, Angle of Depression, Simple problems with 2 right triangles (30°, 45°, 60°).',
    workingDaysRequired: 8,
    periodsRequired: 10,
    revisionPlan: 'CBSE Previous 10 Years Board Questions.',
    examinationPlan: 'Pre-Board 1 (PB-1) Rehearsal.',
    projectWork: '3D Model of Lighthouse and Ship distance calculation.',
    practicalWork: 'Maths Lab Activity 9: Verifying sin²θ + cos²θ = 1 using unit circle.',
    completionStatus: 'Skipped',
    targetCompletionDate: '2025-11-10',
    actualCompletionDate: '',
    remarks: 'Merged into Chapter 8 practical sessions for faster coverage.',
    templatePageRef: 18
  },
  {
    id: 'syl-110',
    className: 'XI',
    section: 'B',
    subjectName: 'Mathematics (041)',
    month: 'April',
    unitNo: 'Unit 1',
    unitTitle: 'Sets and Functions',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Sets',
    teachingTarget: 'Sets and representation, Empty set, Finite/Infinite sets, Subsets, Power Set, Venn Diagrams.',
    workingDaysRequired: 10,
    periodsRequired: 12,
    revisionPlan: 'Venn Diagram word problem solving.',
    examinationPlan: 'Class Test 1.',
    projectWork: 'Venn Diagram applications in Computer Science Logic gates.',
    practicalWork: 'Maths Lab Activity 1: Verification of Distributive Law of Sets.',
    completionStatus: 'Completed',
    targetCompletionDate: '2025-04-30',
    actualCompletionDate: '2025-04-29',
    remarks: 'High engagement in Venn diagram set operations.',
    templatePageRef: 18
  }
];

export const DEFAULT_LESSON_PLANS: DailyLessonPlan[] = [
  {
    id: 'lp-101',
    date: '2025-07-28',
    day: 'Monday',
    className: 'X',
    section: 'A',
    periodNo: '2nd Period',
    subjectName: 'Mathematics (041)',
    unitNo: 'Unit 1: Number Systems',
    chapterNo: 'Chapter 1',
    chapterTitle: 'Real Numbers',
    topic: 'Proofs of Irrationality',
    subtopic: 'Proving √2 and √3 are Irrational Numbers using Contradiction',
    durationMinutes: 40,
    previousKnowledge: '1. What are rational numbers? 2. Can rational numbers be expressed as p/q where q ≠ 0? 3. What are co-prime numbers?',
    teachingObjectives: '1. To enable students to understand proof by contradiction. 2. To apply Fundamental Theorem of Arithmetic in proving irrationality of square roots of prime numbers.',
    learningOutcomes: '1. Students will be able to construct a rigorous proof for irrationality of √2. 2. Students will demonstrate competence in identifying co-prime relationships and prime factors.',
    teachingLearningMaterials: 'NCERT Textbook Class X, Smart Board interactive diagram showing prime factorisation theorem, Chart paper on Number System Hierarchy.',
    teachingMethod: 'Experiential Learning & Guided Inquiry with Mathematical Deduction.',
    classroomActivity: 'Teacher demonstrates step-by-step contradiction proof on board. Students work in pairs to write the parallel proof for √3.',
    blackboardSummary: 'Theorem: Let p be a prime number. If p divides a², then p divides a, where a is a positive integer. Proof: Assume √2 = p/q (co-prime). 2q² = p² ⇒ 2 divides p² ⇒ 2 divides p. Let p = 2c...',
    assessmentQuestions: '1. Prove that 5 - √3 is irrational. 2. If p is prime, why is √p always irrational?',
    classwork: 'NCERT Exercise 1.2 Questions 1 & 2.',
    homework: 'NCERT Exercise 1.2 Question 3 (i, ii, iii) & Exemplar Problem 4.',
    remedialWork: 'Doubt clearing session for 4 students on understanding assumption p = 2c substitution step.',
    enrichmentActivity: 'Investigate if √n is irrational when n is a non-perfect square.',
    teacherReflection: '85% students grasped the proof by contradiction logic well. Pair activity helped low confidence students write steps independently.',
    completionStatus: 'Completed',
    remarks: 'Lesson delivered as per split-up syllabus schedule. Board work was well-structured.',
    templatePageRef: 48,
    evidenceItems: [
      {
        id: 'ev-101',
        lessonPlanId: 'lp-101',
        title: 'Board Work & Proof Derivation',
        category: 'Photo',
        fileType: 'image',
        fileUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
        fileName: 'board_work_proof_sqrt2.jpg',
        fileSize: '1.4 MB',
        uploadDate: '2025-07-28',
        caption: 'Classroom whiteboard showing step-by-step contradiction proof for √2 irrationality.',
        className: 'X',
        section: 'A',
        subjectName: 'Mathematics (041)',
        topic: 'Proofs of Irrationality',
        isSelectedForAppendix: true
      },
      {
        id: 'ev-102',
        lessonPlanId: 'lp-101',
        title: 'Class X-A Diagnostic Worksheet',
        category: 'Worksheet',
        fileType: 'pdf',
        fileUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80',
        fileName: 'worksheet_irrational_numbers.pdf',
        fileSize: '820 KB',
        uploadDate: '2025-07-28',
        caption: 'Student practice worksheet on identifying rational vs irrational numbers.',
        className: 'X',
        section: 'A',
        subjectName: 'Mathematics (041)',
        topic: 'Proofs of Irrationality',
        isSelectedForAppendix: true
      },
      {
        id: 'ev-103',
        lessonPlanId: 'lp-101',
        title: 'Student Pair Activity Work Sample',
        category: 'Student Work Sample',
        fileType: 'image',
        fileUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
        fileName: 'student_notebook_proof_sqrt3.jpg',
        fileSize: '2.1 MB',
        uploadDate: '2025-07-28',
        caption: 'Class X-A student notebook sample writing the independent proof for √3.',
        className: 'X',
        section: 'A',
        subjectName: 'Mathematics (041)',
        topic: 'Proofs of Irrationality',
        isSelectedForAppendix: true
      }
    ]
  },
  {
    id: 'lp-102',
    date: '2025-07-29',
    day: 'Tuesday',
    className: 'X',
    section: 'A',
    periodNo: '3rd Period',
    subjectName: 'Mathematics (041)',
    unitNo: 'Unit 2: Algebra',
    chapterNo: 'Chapter 2',
    chapterTitle: 'Polynomials',
    topic: 'Zeros of a Polynomial',
    subtopic: 'Geometrical Meaning of Zeros of Quadratic Polynomials (Parabola)',
    durationMinutes: 40,
    previousKnowledge: '1. What is a degree 2 polynomial? 2. How many zeros can a linear polynomial have?',
    teachingObjectives: 'To visualize the graph of y = ax² + bx + c and relate x-axis intersection points with real zeros.',
    learningOutcomes: 'Students can identify the number of zeros of a quadratic polynomial by looking at its graph.',
    teachingLearningMaterials: 'GeoGebra Software on Smart TV, Graph sheets, Colored whiteboard markers.',
    teachingMethod: 'ICT Integrated Visual Learning & Graph Plotting Activity.',
    classroomActivity: 'Plotting y = x² - 3x - 4 on graph sheet and observing points (-1,0) and (4,0) on x-axis.',
    blackboardSummary: 'Graph of Quadratic Polynomial ax² + bx + c is a Parabola. 1. Opens upwards if a > 0. 2. Opens downwards if a < 0. No. of zeros = Number of points where graph intersects x-axis.',
    assessmentQuestions: 'Look at the parabola graph shown on GeoGebra: how many zeros does it have if it touches x-axis at 1 point?',
    classwork: 'NCERT Exercise 2.1 Q1 (parts i to vi).',
    homework: 'Draw graph of y = x² - 4 on graph paper and find zeros.',
    remedialWork: 'Guided graph plotting support for slow learners.',
    enrichmentActivity: 'Explore cubic polynomial graphs y = x³ - 4x on GeoGebra.',
    teacherReflection: 'Use of GeoGebra dynamic visualization made parabolic concepts very clear.',
    completionStatus: 'Completed',
    remarks: 'Approved by Vice Principal during classroom observation.',
    templatePageRef: 48,
    evidenceItems: [
      {
        id: 'ev-201',
        lessonPlanId: 'lp-102',
        title: 'GeoGebra Parabola Smart TV Demonstration',
        category: 'Classroom Materials',
        fileType: 'image',
        fileUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80',
        fileName: 'geogebra_parabola_demo.png',
        fileSize: '1.8 MB',
        uploadDate: '2025-07-29',
        caption: 'Smart TV screen displaying interactive quadratic curve intersection points with x-axis.',
        className: 'X',
        section: 'A',
        subjectName: 'Mathematics (041)',
        topic: 'Zeros of a Polynomial',
        isSelectedForAppendix: true
      },
      {
        id: 'ev-202',
        lessonPlanId: 'lp-102',
        title: 'Classroom Activity Short Video Clip',
        category: 'Video Clip',
        fileType: 'video',
        fileUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
        fileName: 'class_parabola_activity_clip.mp4',
        fileSize: '8.4 MB',
        uploadDate: '2025-07-29',
        caption: 'Short 20-second video recording of student group discussion on roots of quadratic equation.',
        className: 'X',
        section: 'A',
        subjectName: 'Mathematics (041)',
        topic: 'Zeros of a Polynomial',
        isSelectedForAppendix: true
      }
    ]
  }
];

export const TEMPLATE_PAGES_MAP: TemplatePageMap[] = [
  { pageNo: 1, sectionTitle: 'Front Cover & General Details', digitalModule: 'Teacher Profile & School Details', autoFillStatus: 'Auto-Filled', pageType: 'Header Form', description: 'Name, Designation, Classes & Subjects, Class Teacher role, KV Name, Region' },
  { pageNo: 2, sectionTitle: 'Constitution Preamble & Fundamental Duties', digitalModule: 'Academic Reference Rules', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'Articles 51A Fundamental Duties reference text' },
  { pageNo: 3, sectionTitle: 'Inner Title Page', digitalModule: 'Teacher Profile', autoFillStatus: 'Auto-Filled', pageType: 'Header Form', description: 'Vidyalaya header and teacher assignment summary' },
  { pageNo: 4, sectionTitle: 'Index Part 1 (S.N. 1 - 17d)', digitalModule: 'Navigation & Module Directory', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'Index table mapping all diary sections' },
  { pageNo: 5, sectionTitle: 'Index Part 2 (S.N. 17i - 34)', digitalModule: 'Navigation & Module Directory', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'Index table mapping practicals, results, remediation, lesson plans' },
  { pageNo: 6, sectionTitle: 'Code of Conduct for Teachers (Page 1)', digitalModule: 'Teacher Guidelines & Rules', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'Articles 59 KVS Education Code rules 1 to 22' },
  { pageNo: 7, sectionTitle: 'Code of Conduct for Teachers (Page 2)', digitalModule: 'Teacher Guidelines & Rules', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'Articles 59 KVS Education Code rules 23 to 37' },
  { pageNo: 8, sectionTitle: 'Children’s Bill of Rights', digitalModule: 'Teacher Guidelines & Rules', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'Child rights, dignity, protection, UN Convention details' },
  { pageNo: 9, sectionTitle: 'Salient Features of NEP-2020', digitalModule: 'Academic Reference Rules', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'Key policy features (5+3+3+4, PARAKH, FLN)' },
  { pageNo: 10, sectionTitle: 'SDG Goals & 21st-Century Skills', digitalModule: 'Pedagogy & Skills Reference', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: '17 Sustainable Development Goals & 4Cs, IMT, FLIPS skills' },
  { pageNo: 11, sectionTitle: 'Ready Reckoner (Important Links & Helplines)', digitalModule: 'Useful Links Directory', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'Important websites (CBSE, NCERT, DIKSHA, NISHTHA, KVS) and emergency numbers' },
  { pageNo: 12, sectionTitle: '7(a) Bio-Data of Teacher & Academic Targets', digitalModule: 'Teacher Profile Setup', autoFillStatus: 'Auto-Filled', pageType: 'Header Form', description: '19 detailed fields including PRAN, PAN, Aadhar, Awards, Academic Targets' },
  { pageNo: 13, sectionTitle: '7(b) Transfer Details', digitalModule: 'Teacher Profile Setup', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'History of previous KV postings and grounds of transfer' },
  { pageNo: 14, sectionTitle: '8(a) Class Timetable & 8(b) Teacher’s Timetable', digitalModule: 'Timetable Planner', autoFillStatus: 'Auto-Filled', pageType: 'Data Table', description: 'Mon-Sat 8 periods grid for Class & Teacher schedules' },
  { pageNo: 15, sectionTitle: '9(a) Teaching Philosophy & 9(b) Achievements', digitalModule: 'Teacher Profile Setup', autoFillStatus: 'Manual Input', pageType: 'Header Form', description: 'Teaching philosophy statement & scholastic/co-scholastic achievements' },
  { pageNo: 16, sectionTitle: '10(a) Academic Responsibilities & 10(b) KVS Flagship', digitalModule: 'Teacher Profile Setup', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Academic duties and contributions to KVS Flagship programs' },
  { pageNo: 17, sectionTitle: '11. CPD Courses / Workshops Attended (2 Pages)', digitalModule: 'Professional Development Log', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'CPD training hours, online/offline mode, venue, cumulative hours' },
  { pageNo: 18, sectionTitle: '12. Month-Wise Split-Up Syllabus (5 Pages)', digitalModule: 'Syllabus Planner', autoFillStatus: 'Calculated', pageType: 'Data Table', description: 'Subject, class, month, chapter/topic, periods required, actual date completion' },
  { pageNo: 19, sectionTitle: '13. Suggested Reading & 14. E-Content Prepared', digitalModule: 'Learning Resources & Media', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Student reading list & teacher uploaded e-contents (DIKSHA, PM e-Vidya)' },
  { pageNo: 20, sectionTitle: '15(a) Professional Reading & 15(b) Publications', digitalModule: 'Teacher Profile & Resources', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Books/articles/websites visited for professional growth & published papers' },
  { pageNo: 21, sectionTitle: '16. Students’ Profile (4 Pages)', digitalModule: 'Student Management', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Class & section student directory with parents\' contact & email' },
  { pageNo: 22, sectionTitle: '17(a) Scholastic Assessment Record Classes VI-VIII', digitalModule: 'Assessment & Marks Record', autoFillStatus: 'Calculated', pageType: 'Data Table', description: 'PT-1, PT-2, Notebook, Subject Enrichment, MDP, Learners Diary, HY, Total' },
  { pageNo: 23, sectionTitle: '17(b) Multi-Disciplinary & 17(c) Art Integrated Projects', digitalModule: 'Project Tracker', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'MDP and AIP assigned topics and evaluation criteria' },
  { pageNo: 24, sectionTitle: '17(d) Scholastic Assessment Record Classes IX-X', digitalModule: 'Assessment & Marks Record', autoFillStatus: 'Calculated', pageType: 'Data Table', description: 'PT1-3, Portfolio, Subject Enrichment, Multiple Assessment, SEE, Total' },
  { pageNo: 25, sectionTitle: '17(e) List of Subject/Content Enrichment Activities', digitalModule: 'Assessment & Activities', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Month/date, activity, evaluation criteria, remarks' },
  { pageNo: 26, sectionTitle: '17(f) Record of Marks for Class X (4 Pages)', digitalModule: 'Assessment & Marks Record', autoFillStatus: 'Calculated', pageType: 'Data Table', description: 'Monthly tests M1-M5, PT1-2, HY, PB1-3, AISSE marks & parent sign' },
  { pageNo: 27, sectionTitle: '17(g) Assessment Structure for Class XI (6 Pages)', digitalModule: 'Assessment & Marks Record', autoFillStatus: 'Calculated', pageType: 'Data Table', description: 'PT1, Half Yearly, PT2, Session Ending Theory & Practical/Project/ASL' },
  { pageNo: 28, sectionTitle: '17(h) Record of Marks for Class XII (6 Pages)', digitalModule: 'Assessment & Marks Record', autoFillStatus: 'Calculated', pageType: 'Data Table', description: 'Monthly tests M1-M5, PT1-2, HY, PB1-3, AISSCE marks & parent sign' },
  { pageNo: 29, sectionTitle: '17(i) Attendance in Practical Classes (6 Pages)', digitalModule: 'Attendance Logger', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Student practical attendance grid with signatures' },
  { pageNo: 30, sectionTitle: '17(j) Class Work / Home Work Submission (6 Pages)', digitalModule: 'Homework & Note Book Tracker', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Notebook submission tracking matrix with submission dates' },
  { pageNo: 31, sectionTitle: '18(a) Subject Wise Result Analysis Classes VI-X (4 Pages)', digitalModule: 'Result Analysis Generator', autoFillStatus: 'Calculated', pageType: 'Data Table', description: 'Pass %, grade breakdown (<45%, 45-60%, 60-75%, 75-90%, 90%+)' },
  { pageNo: 32, sectionTitle: '18(b) Subject Wise Result Analysis Classes XI-XII', digitalModule: 'Result Analysis Generator', autoFillStatus: 'Calculated', pageType: 'Data Table', description: 'Passed, failed, pass %, grade spectrum analysis' },
  { pageNo: 33, sectionTitle: '19. Teacher’s Observation on Student Behaviour (2 Pages)', digitalModule: 'Student Observation Log', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Discipline, leadership quality, objective description, observer comments' },
  { pageNo: 34, sectionTitle: '20(a) Remedial Assistance List & Measures (4 Pages)', digitalModule: 'Remedial Teaching Module', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'List of students requiring remediation, area of weakness, measures planned' },
  { pageNo: 35, sectionTitle: '20(b) Details of Remedial Teaching (2 Pages)', digitalModule: 'Remedial Teaching Module', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Topic/concept taught and date-wise tracking' },
  { pageNo: 36, sectionTitle: '20(c) Tracking Performance After Remediation (2 Pages)', digitalModule: 'Remedial Teaching Module', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Nature of re-test, progress record, parent signature' },
  { pageNo: 37, sectionTitle: '21. List of Exemplary Children & Steps (2 Pages)', digitalModule: 'Student Talent Tracker', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Areas of strength, steps taken for further improvement, progress shown' },
  { pageNo: 38, sectionTitle: '22. Record of Parent-Teacher Meetings (4 Pages)', digitalModule: 'PTM Record Manager', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Date, student name & class, suggestions, parents signature & mobile no' },
  { pageNo: 39, sectionTitle: '23. Gist of Minutes of Staff Meetings (5 Pages)', digitalModule: 'Meeting Minutes Manager', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Month & date, important points discussed, action taken / follow up' },
  { pageNo: 40, sectionTitle: '24. Gist of Monthly Subject Committee Meetings', digitalModule: 'Meeting Minutes Manager', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Date of meeting, decisions/suggestions, follow-up actions' },
  { pageNo: 41, sectionTitle: '25. Follow Up of Classroom Observation Remarks', digitalModule: 'Inspection & Review Logger', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Supervising authority remarks, main suggestions, follow-up action taken' },
  { pageNo: 42, sectionTitle: '26. Details of Work Done Other Than Teaching', digitalModule: 'Non-Teaching Activity Log', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Month-by-month administrative, examination, and co-curricular duties' },
  { pageNo: 43, sectionTitle: '27. Details of ICT / Digital Technology Used (2 Pages)', digitalModule: 'Digital Teaching Log', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Class, period, subject, topic & description of e-content, principal sign' },
  { pageNo: 44, sectionTitle: '28. Academic Loss Compensation Programme (2 Pages)', digitalModule: 'CLAP & Loss Compensation', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Student name, reason for loss, compensated topics/lessons' },
  { pageNo: 45, sectionTitle: '29. Implementation of Joyful Learning Activities', digitalModule: 'Joyful Learning & FLN Tracker', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Class, section, date, activity, impact and follow up' },
  { pageNo: 46, sectionTitle: '30. Competency Based Test Items Undertaken (2 Pages)', digitalModule: 'CBT Item Bank & Assessment', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Date, class, description of competency-based items' },
  { pageNo: 47, sectionTitle: '31(a) Innovation & Experimentation & 31(b) Best Practices', digitalModule: 'Innovation & Best Practices', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Teacher projects undertaken for innovation and best practices list' },
  { pageNo: 48, sectionTitle: '32. Lesson Plan Organiser Page 1 (General Facts & Strategies)', digitalModule: 'Daily Lesson Plan Organiser', autoFillStatus: 'Auto-Filled', pageType: 'Daily Log', description: 'Header facts, concepts 1-3, learning outcomes (NCERT), pedagogical strategies' },
  { pageNo: 49, sectionTitle: '32. Lesson Plan Organiser Page 2 (Integration & Reflection)', digitalModule: 'Daily Lesson Plan Organiser', autoFillStatus: 'Manual Input', pageType: 'Daily Log', description: 'Integration with subjects, assessment format, resources, 21st century skills, teacher self-assessment checkboxes' },
  { pageNo: 50, sectionTitle: '33. KVS Calendar of Activities', digitalModule: 'Academic Calendar', autoFillStatus: 'Auto-Filled', pageType: 'Data Table', description: 'Date & description of all scheduled Vidyalaya activities' },
  { pageNo: 51, sectionTitle: '34. Notes Section', digitalModule: 'Notes & Scratchpad', autoFillStatus: 'Manual Input', pageType: 'Daily Log', description: 'Lined blank writing space for miscellaneous teacher notes' },
  { pageNo: 52, sectionTitle: 'Back Cover & Year Calendar', digitalModule: 'Annual Calendar Overview', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'Back inner cover year calendar' }
];

// ============================================================================
// 34-PAGE INDEX: KVS FOUNDATIONAL & PREPARATORY STAGE TEACHER'S DIARY
// ============================================================================
export const TEMPLATE_PAGES_MAP_FOUNDATIONAL: TemplatePageMap[] = [
  { pageNo: 1, sectionTitle: 'Code of Conduct for Teachers', digitalModule: 'Teacher Guidelines & Rules', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'KVS Education Code Article 59 code of conduct for teachers' },
  { pageNo: 2, sectionTitle: 'Children’s Bill of Rights', digitalModule: 'Teacher Guidelines & Rules', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'UN Convention child rights: dignity, expression, development, care & protection' },
  { pageNo: 3, sectionTitle: 'Salient Features of NEP-2020', digitalModule: 'Academic Reference Rules', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'NEP 5+3+3+4 architecture, FLN, PARAKH, holistic progress' },
  { pageNo: 4, sectionTitle: 'Role of Teachers in NIPUN Bharat & Jadui Pitara', digitalModule: 'FLN Guidelines', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'Foundational Literacy & Numeracy objectives and Jadui Pitara TLM usage' },
  { pageNo: 5, sectionTitle: 'Social Commitment, 21st Century Skills & Panchakosha Vikas', digitalModule: 'Pedagogy & Skills Reference', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'Five-fold Panchakosha child development & soft skills' },
  { pageNo: 6, sectionTitle: 'Ready Reckoner for Teachers', digitalModule: 'Useful Links Directory', autoFillStatus: 'Auto-Filled', pageType: 'Instruction Rules', description: 'Important contact helplines & official education portals' },
  { pageNo: 7, sectionTitle: 'Bio-data of the Teacher & Transfer Details', digitalModule: 'Teacher Profile Setup', autoFillStatus: 'Auto-Filled', pageType: 'Header Form', description: 'Comprehensive personal profile, service records, and posting history' },
  { pageNo: 8, sectionTitle: 'Statement of Teaching Philosophy & Notable Achievements', digitalModule: 'Teacher Profile Setup', autoFillStatus: 'Manual Input', pageType: 'Header Form', description: 'Personal teaching philosophy and academic/co-curricular achievements' },
  { pageNo: 9, sectionTitle: 'Class Time Table & Teacher’s Time Table', digitalModule: 'Timetable Planner', autoFillStatus: 'Auto-Filled', pageType: 'Data Table', description: 'Weekly 8-period timetable grid with break allocation and subject summary' },
  { pageNo: 10, sectionTitle: 'Details of CPD Courses / Trainings / Workshops Attended', digitalModule: 'Professional Development Log', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: '4-page log of 50+ hours annual CPD participation' },
  { pageNo: 11, sectionTitle: 'Month-Wise Split-Up Syllabus', digitalModule: 'Syllabus Planner', autoFillStatus: 'Calculated', pageType: 'Data Table', description: '5-page monthly split-up syllabus and completion tracker' },
  { pageNo: 12, sectionTitle: 'Students’ Profile', digitalModule: 'Student Management', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: '8-page student directory for Classes I to V' },
  { pageNo: 13, sectionTitle: 'Monitoring cum Remedial Reporting Record (Module 13)', digitalModule: 'Remedial Teaching Module', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: '16-page ledger tracking students struggling to achieve Targeted Learning Outcomes (TLOs)' },
  { pageNo: 14, sectionTitle: 'Late Bloomers’ Record of Progress & Remedial Teaching (Module 14)', digitalModule: 'Remedial Teaching Module', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Continuous qualitative progress tracker for slow learners and special assistance' },
  { pageNo: 15, sectionTitle: 'List of Exemplary Children & Steps for Improvement', digitalModule: 'Student Talent Tracker', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: '4-page record of gifted learners and enrichment interventions' },
  { pageNo: 16, sectionTitle: 'Record of Minutes of NIPUN / FLN Meetings (Module 16)', digitalModule: 'Meeting Minutes Manager', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: '4-page log of monthly NIPUN FLN review meetings and action items' },
  { pageNo: 17, sectionTitle: 'Gist of Minutes of Monthly Staff Meetings (Module 17)', digitalModule: 'Meeting Minutes Manager', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: '8-page staff meeting proceedings and follow-up directives' },
  { pageNo: 18, sectionTitle: 'Gist of Subject Committee Meetings (Module 18)', digitalModule: 'Meeting Minutes Manager', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: '4-page primary subject committee discussions and instructional decisions' },
  { pageNo: 19, sectionTitle: 'Record of Parent Teacher Meetings (Module 19)', digitalModule: 'PTM Record Manager', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: '4-page PTM feedback, parent signatures, and student progress notes' },
  { pageNo: 20, sectionTitle: 'Follow up of Observations/Suggestions given by Principal / AC / DC', digitalModule: 'Inspection & Review Logger', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: '2-page classroom supervision review notes and compliance tracking' },
  { pageNo: 21, sectionTitle: 'Scholastic Assessment Record for Classes I & II (Module 21)', digitalModule: 'Assessment & Marks Record', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: '8 Continuous Assessment Cycles rating developmental competencies (A/B/C)' },
  { pageNo: 22, sectionTitle: 'Record of Notebook Correction for Classes III to V (Module 22)', digitalModule: 'Homework & Note Book Tracker', autoFillStatus: 'Calculated', pageType: 'Data Table', description: '8-page monthly ledger for Regularity, Index, Neatness, and Completion (Max 20)' },
  { pageNo: 23, sectionTitle: 'Subject Enrichment Activities (SEA) for Classes III to V (Module 23)', digitalModule: 'Assessment & Activities', autoFillStatus: 'Calculated', pageType: 'Data Table', description: 'Planned SEA criteria and Term 1 & 2 4-rubric evaluation sheets (Max 20)' },
  { pageNo: 24, sectionTitle: 'Details of Multi-Disciplinary Projects Assigned (Module 24)', digitalModule: 'Project Tracker', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Term 1 & 2 cross-curricular projects with evaluation criteria' },
  { pageNo: 25, sectionTitle: 'Scholastic Assessment Record Classes III to V - Term 1 (Module 25)', digitalModule: 'Assessment & Marks Record', autoFillStatus: 'Calculated', pageType: 'Data Table', description: '8-page Term 1 consolidated marks: PT (10), Notebook (5), SEA (5), MDP (10), Term End Exam (30/40)' },
  { pageNo: 26, sectionTitle: 'Scholastic Assessment Record Classes III to V - Term 2 (Module 26)', digitalModule: 'Assessment & Marks Record', autoFillStatus: 'Calculated', pageType: 'Data Table', description: '8-page Term 2 consolidated marks and 8-point grading spectrum' },
  { pageNo: 27, sectionTitle: 'Subject-Wise Result Analysis for Classes III to V (Module 27)', digitalModule: 'Result Analysis Generator', autoFillStatus: 'Calculated', pageType: 'Data Table', description: '2-page landscape statistical distribution: on roll, appeared, passed, needs improvement, grade counts' },
  { pageNo: 28, sectionTitle: 'Result of Oral Reading Fluency - TARA App (Module 28)', digitalModule: 'Assessment & Marks Record', autoFillStatus: 'Calculated', pageType: 'Data Table', description: '6-page WCPM tracking for Baseline, Midline, and Endline reading assessments' },
  { pageNo: 29, sectionTitle: 'Teacher’s Observation Notes on Students (Module 29)', digitalModule: 'Student Observation Log', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: '8-page qualitative log on student behaviour, discipline, and leadership' },
  { pageNo: 30, sectionTitle: 'Professional Reading, Websites & Innovative Practices (Module 30)', digitalModule: 'Innovation & Best Practices', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Teacher professional literature log and classroom experimentation write-ups' },
  { pageNo: 31, sectionTitle: 'Details of ICT / TAL / CAL Classes Taken (Module 31)', digitalModule: 'Digital Teaching Log', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: '4-page register of digital board and e-content multimedia transactions' },
  { pageNo: 32, sectionTitle: 'Work Done Other Than Teaching & Inclusive Education (Module 32)', digitalModule: 'Non-Teaching Activity Log', autoFillStatus: 'Manual Input', pageType: 'Data Table', description: 'Monthly administrative duties and inclusive classroom initiatives' },
  { pageNo: 33, sectionTitle: 'Lesson Plan Organiser (Module 33)', digitalModule: 'Daily Lesson Plan Organiser', autoFillStatus: 'Auto-Filled', pageType: 'Daily Log', description: '50-page NEP 2020 Curricular Goals (CG1-13) and Competencies Lesson Plans' },
  { pageNo: 34, sectionTitle: 'Notes & Reflections (Module 34)', digitalModule: 'Notes & Scratchpad', autoFillStatus: 'Manual Input', pageType: 'Daily Log', description: 'Blank lined pages for teacher observations, reflections, and pedagogical notes' }
];

export const DEFAULT_ASSESSMENT_RECORDS: AssessmentProgressRecord[] = [
  {
    id: 'asst-101',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    lessonPlanId: 'lp-101',
    topic: 'Proofs of Irrationality (Real Numbers)',
    month: 'July 2025',
    date: '2025-07-28',
    assessmentType: 'Class Test',
    title: 'PT-1 Prep Diagnostic Class Test on Irrationality Proofs',
    description: '10-marks 20-minute closed book class diagnostic test containing short analytical proof questions.',
    maxMarks: 10,
    averageScore: 8.2,
    performanceRemarks: '82% average class performance. Excellent clarity on basic contradiction steps; minor algebraic signs errors in 4 students.',
    slowLearnerSupport: 'Provided 3 step-by-step guided worksheets with template proof frames for 5 students needing reinforcement.',
    advancedLearnerActivity: 'Assigned HOTS Challenge Problem on proving irrationality of √2 + √3 using algebraic identity square expansion.',
    remedialTeaching: 'Conducted a 15-minute period-end review on standard prime factor divisibility lemma.',
    enrichmentWork: 'Assigned NCERT Exemplar higher order problems on real number decimal expansions.',
    followUpAction: 'Re-test 5 slow learners during zero period on Friday; check corrected worksheets on Monday.',
    templatePageRef: 22
  },
  {
    id: 'asst-102',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    lessonPlanId: 'lp-102',
    topic: 'Zeros of a Polynomial',
    month: 'July 2025',
    date: '2025-07-29',
    assessmentType: 'Oral Questions',
    title: 'Geometric Interpretation Oral Viva & Rapid Fire',
    description: 'Oral questioning on identifying number of real zeros from graphical intersections with the X-axis.',
    maxMarks: 5,
    averageScore: 4.5,
    performanceRemarks: 'Active participation across all groups. Parabola curve visualization concepts grasped well by 90% students.',
    slowLearnerSupport: 'Used GeoGebra interactive smart TV sliders to show graph touch points visually.',
    advancedLearnerActivity: 'Asked advanced students to predict graph behavior for cubic polynomials with 3 real roots.',
    remedialTeaching: 'Demonstrated 3 additional graphical sketches on blackboard.',
    enrichmentWork: 'Encouraged drawing 5 quadratic graphs using graph sheets at home.',
    followUpAction: 'Check homework notebooks on Wednesday for graph accuracy.',
    templatePageRef: 25
  },
  {
    id: 'asst-103',
    className: 'IX',
    section: 'B',
    subjectName: 'Mathematics (041)',
    topic: 'Number Systems & Rationalization',
    month: 'July 2025',
    date: '2025-07-25',
    assessmentType: 'Worksheet',
    title: 'Surds & Rationalizing the Denominator Worksheet',
    description: '2-page activity worksheet with 8 graded numerical problems.',
    maxMarks: 15,
    averageScore: 12.8,
    performanceRemarks: 'Good accuracy in binomial conjugate rationalization. Need to focus on simplification of square roots.',
    slowLearnerSupport: 'Paired slow learners with peer mentors for peer-tutoring step walkthroughs.',
    advancedLearnerActivity: 'Created multi-nested square root expressions puzzle worksheet.',
    remedialTeaching: 'Board demonstration of conjugate multiplication identities.',
    enrichmentWork: 'Assigned Vedic Math shortcut tricks for calculating square roots.',
    followUpAction: 'Verify peer-mentored worksheet submissions during next tutorial.',
    templatePageRef: 30
  }
];

export const DEFAULT_INSPECTION_RECORDS: InspectionReviewRecord[] = [
  {
    id: 'insp-101',
    recordType: 'Daily Lesson Plan',
    recordId: 'lp-101',
    recordTitle: 'Proofs of Irrationality (Real Numbers)',
    teacherName: 'Dr. Ramesh Sharma (PGT Math)',
    className: 'X-A',
    subjectName: 'Mathematics (041)',
    submissionDate: '2025-07-28',
    reviewDate: '2025-07-29',
    reviewerName: 'Dr. Sunita Deshmukh',
    reviewerRole: 'Principal',
    reviewerDesignation: 'Principal, KV No.1 Delhi Cantt',
    status: 'Approved',
    remarks: 'Pristine lesson plan structure with clear TLM references and well-structured slow learner worksheet attachments.',
    suggestions: 'Incorporate 5 minutes interactive mental math quiz at entry time.',
    digitalSignatureName: 'Sunita Deshmukh (Principal)',
    sealStampText: 'OFFICIALLY APPROVED - PRINCIPAL KV NO.1',
    templatePageRef: 4
  },
  {
    id: 'insp-102',
    recordType: 'Complete Teacher Diary',
    recordId: 'td-2025',
    recordTitle: 'Teacher Diary Annual Review & Index Audit',
    teacherName: 'Dr. Ramesh Sharma (PGT Math)',
    className: 'X-A, IX-B',
    subjectName: 'Mathematics (041)',
    submissionDate: '2025-07-20',
    reviewDate: '2025-07-22',
    reviewerName: 'Shri V. K. Aggarwal',
    reviewerRole: 'Assistant Commissioner',
    reviewerDesignation: 'Assistant Commissioner, KVS Regional Office',
    status: 'Inspected & Stamped',
    remarks: 'Comprehensive alignment with KVS split-up syllabus and NCF 2023 guidelines. Excellent documentation of experiential activities.',
    suggestions: 'Ensure all media evidence photos carry date and activity labels in Appendix.',
    digitalSignatureName: 'V. K. Aggarwal (Assistant Commissioner)',
    sealStampText: 'INSPECTED & STAMPED - ASSISTANT COMMISSIONER KVS RO',
    templatePageRef: 48
  },
  {
    id: 'insp-103',
    recordType: 'Assessment Register',
    recordId: 'asst-101',
    recordTitle: 'PT-1 Prep Diagnostic Class Test on Irrationality Proofs',
    teacherName: 'Dr. Ramesh Sharma (PGT Math)',
    className: 'X-A',
    subjectName: 'Mathematics (041)',
    submissionDate: '2025-07-28',
    reviewDate: '2025-07-29',
    reviewerName: 'Smt. Anjali Verma',
    reviewerRole: 'Coordinator',
    reviewerDesignation: 'Senior Secondary Academic Coordinator',
    status: 'Approved',
    remarks: 'Remedial action plan for 5 slow learners is timely and appropriate.',
    suggestions: 'Schedule re-test scores tracking in next monthly register page.',
    digitalSignatureName: 'Anjali Verma (Coordinator)',
    sealStampText: 'VERIFIED BY ACADEMIC COORDINATOR',
    templatePageRef: 34
  },
  {
    id: 'insp-104',
    recordType: 'Syllabus Plan',
    recordId: 'syl-105',
    recordTitle: 'Triangles & Similarities Split-up Plan',
    teacherName: 'Dr. Ramesh Sharma (PGT Math)',
    className: 'X-A',
    subjectName: 'Mathematics (041)',
    submissionDate: '2025-07-29',
    reviewDate: undefined,
    reviewerName: undefined,
    reviewerRole: 'Coordinator',
    reviewerDesignation: undefined,
    status: 'Pending',
    remarks: undefined,
    suggestions: undefined,
    templatePageRef: 12
  }
];

export async function initializeDatabaseIfEmpty() {

  const existingSchool = await db.get<SchoolDetails>('setup:school');
  if (!existingSchool) {
    await db.set('setup:school', DEFAULT_SCHOOL);
  }

  const existingTeacher = await db.get<TeacherProfile>('setup:teacher');
  if (!existingTeacher) {
    await db.set('setup:teacher', DEFAULT_TEACHER);
  }

  // Ensure comprehensive 21-member staff details roster is initialized and synced
  await getMergedStaffList();

  const existingSessions = await db.get<AcademicSession[]>('setup:sessions');
  if (!existingSessions || existingSessions.length === 0) {
    await db.set('setup:sessions', DEFAULT_SESSIONS);
  } else {
    // Ensure 2026 - 2027 session is active and present
    const has2026 = existingSessions.some(s => s.sessionName.includes('2026'));
    if (!has2026) {
      const merged: AcademicSession[] = [
        { id: 'sess-2026-27', sessionName: '2026 - 2027', startDate: '2026-04-01', endDate: '2027-03-31', isActive: true },
        ...existingSessions.map(s => ({ ...s, isActive: false }))
      ];
      await db.set('setup:sessions', merged);
    } else {
      const updated = existingSessions.map(s => ({
        ...s,
        isActive: s.sessionName.includes('2026')
      }));
      await db.set('setup:sessions', updated);
    }
  }

  const existingClasses = await db.get<ClassSection[]>('setup:classes');
  if (!existingClasses) {
    await db.set('setup:classes', DEFAULT_CLASSES);
  }

  const existingSubjects = await db.get<SubjectItem[]>('setup:subjects');
  if (!existingSubjects) {
    await db.set('setup:subjects', DEFAULT_SUBJECTS);
  }

  const existingTimetable = await db.get<TimetableSlot[]>('setup:timetable');
  if (!existingTimetable || existingTimetable.length < 200) {
    await db.set('setup:timetable', DEFAULT_TIMETABLE);
  } else {
    // Merge existing user custom imports with DEFAULT_TIMETABLE
    const mergedMap = new Map<string, TimetableSlot>();
    DEFAULT_TIMETABLE.forEach(s => { if (s.id) mergedMap.set(s.id, s); });
    existingTimetable.forEach(s => { if (s.id) mergedMap.set(s.id, s); });
    await db.set('setup:timetable', Array.from(mergedMap.values()));
  }

  const existingTimings = await db.get<Record<number, { time: string; label: string }>>('setup:period_timings');
  if (!existingTimings) {
    await db.set('setup:period_timings', DEFAULT_PERIOD_TIMINGS);
  }

  const existingCalendar = await db.get<CalendarEvent[]>('setup:calendar');
  if (!existingCalendar) {
    await db.set('setup:calendar', DEFAULT_CALENDAR);
  }

  const existingActiveDate = await db.get<string>('setup:active_working_date');
  if (!existingActiveDate) {
    const today = new Date().toISOString().split('T')[0];
    await db.set('setup:active_working_date', today);
  }

  const existingExams = await db.get<ExamSchedule[]>('setup:exams');
  if (!existingExams) {
    await db.set('setup:exams', DEFAULT_EXAMS);
  }

  const existingSyllabus = await db.get<SyllabusItem[]>('setup:syllabus');
  if (!existingSyllabus) {
    await db.set('setup:syllabus', DEFAULT_SYLLABUS);
  }

  const existingLessonPlans = await db.get<DailyLessonPlan[]>('setup:lesson_plans');
  if (!existingLessonPlans) {
    await db.set('setup:lesson_plans', DEFAULT_LESSON_PLANS);
  }

  const existingAssessments = await db.get<AssessmentProgressRecord[]>('setup:assessments');
  if (!existingAssessments) {
    await db.set('setup:assessments', DEFAULT_ASSESSMENT_RECORDS);
  }

  const existingInspections = await db.get<InspectionReviewRecord[]>('setup:inspections');
  if (!existingInspections) {
    await db.set('setup:inspections', DEFAULT_INSPECTION_RECORDS);
  }

  const existingActivities = await db.get<HourlyActivity[]>('setup:hourly_activities');
  if (!existingActivities) {
    await db.set('setup:hourly_activities', DEFAULT_HOURLY_ACTIVITIES);
  }

  const existingEvidence = await db.get<ActivityEvidence[]>('setup:evidence');
  if (!existingEvidence) {
    await db.set('setup:evidence', DEFAULT_EVIDENCE);
  }

  const existingCalendarSync = await db.get<CalendarSyncSetting[]>('setup:calendar_sync');
  if (!existingCalendarSync) {
    await db.set('setup:calendar_sync', DEFAULT_CALENDAR_SETTINGS);
  }

  const existingTasks = await db.get<TeacherTask[]>('setup:tasks');
  if (!existingTasks) {
    await db.set('setup:tasks', DEFAULT_TASKS);
  } else {
    // Backwards compatibility migration: ensure listId is populated (defaulting to 'inbox')
    const needsMigration = existingTasks.some(t => !t.listId);
    if (needsMigration) {
      const migrated = existingTasks.map(t => ({
        ...t,
        listId: t.listId || 'inbox'
      }));
      await db.set('setup:tasks', migrated);
    }
  }

  const existingTaskLists = await db.get<TaskList[]>('setup:task_lists');
  if (!existingTaskLists) {
    await db.set('setup:task_lists', DEFAULT_TASK_LISTS);
  }

  const existingSmartRecognition = await db.get<boolean>('settings:smart_recognition_enabled');
  if (existingSmartRecognition === null || existingSmartRecognition === undefined) {
    await db.set('settings:smart_recognition_enabled', true);
  }

  const existingPresets = await db.get<DutyPreset[]>('setup:duty_presets');
  if (!existingPresets) {
    await db.set('setup:duty_presets', DEFAULT_DUTY_PRESETS);
  }

  const existingStudents = await db.get<StudentProfile[]>('setup:students');
  if (!existingStudents) {
    await db.set('setup:students', DEFAULT_STUDENTS);
  }

  const existingPracticalAttendance = await db.get<PracticalAttendanceRecord[]>('setup:practical_attendance');
  if (!existingPracticalAttendance) {
    await db.set('setup:practical_attendance', DEFAULT_PRACTICAL_ATTENDANCE);
  }

  const existingScholasticVItoVIII = await db.get<ScholasticScoreRecordVItoVIII[]>('setup:scholastic_scores_vi_viii');
  if (!existingScholasticVItoVIII) {
    await db.set('setup:scholastic_scores_vi_viii', DEFAULT_SCHOLASTIC_SCORES_VI_VIII);
  }

  const existingScholasticIXtoX = await db.get<ScholasticScoreRecordIXtoX[]>('setup:scholastic_scores_ix_x');
  if (!existingScholasticIXtoX) {
    await db.set('setup:scholastic_scores_ix_x', DEFAULT_SCHOLASTIC_SCORES_IX_X);
  }

  // Foundational & Preparatory Stage Collections (Balvatika to Class V)
  const existingMonitoring = await db.get<MonitoringCumReportingRecord[]>('setup:monitoring_cum_reporting');
  if (!existingMonitoring) {
    await db.set('setup:monitoring_cum_reporting', DEFAULT_MONITORING_CUM_REPORTING);
  }

  const existingLateBloomers = await db.get<LateBloomerProgressRecord[]>('setup:late_bloomer_progress');
  if (!existingLateBloomers) {
    await db.set('setup:late_bloomer_progress', DEFAULT_LATE_BLOOMER_PROGRESS);
  }

  const existingNipunMeetings = await db.get<NipunMeetingRecord[]>('setup:nipun_meetings');
  if (!existingNipunMeetings) {
    await db.set('setup:nipun_meetings', DEFAULT_NIPUN_MEETINGS);
  }

  const existingScholasticItoII = await db.get<ScholasticRecordClass1_2[]>('setup:scholastic_scores_i_ii');
  if (!existingScholasticItoII) {
    await db.set('setup:scholastic_scores_i_ii', DEFAULT_SCHOLASTIC_I_II);
  }

  const existingNotebookIIItoV = await db.get<NotebookRecordClass3_5[]>('setup:notebook_scores_iii_v');
  if (!existingNotebookIIItoV) {
    await db.set('setup:notebook_scores_iii_v', DEFAULT_NOTEBOOK_III_V);
  }

  const existingSeaIIItoV = await db.get<SeaRecordClass3_5[]>('setup:sea_scores_iii_v');
  if (!existingSeaIIItoV) {
    await db.set('setup:sea_scores_iii_v', DEFAULT_SEA_III_V);
  }

  const existingScholasticIIItoV = await db.get<ScholasticRecordClass3_5[]>('setup:scholastic_scores_iii_v');
  if (!existingScholasticIIItoV) {
    await db.set('setup:scholastic_scores_iii_v', DEFAULT_SCHOLASTIC_III_V);
  }

  const existingOrfTara = await db.get<OralReadingFluencyRecord[]>('setup:oral_reading_fluency_tara');
  if (!existingOrfTara) {
    await db.set('setup:oral_reading_fluency_tara', DEFAULT_ORF_TARA);
  }

  const existingRAIIItoV = await db.get<ResultAnalysisClass3_5[]>('setup:result_analysis_iii_v');
  if (!existingRAIIItoV) {
    await db.set('setup:result_analysis_iii_v', DEFAULT_RESULT_ANALYSIS_III_V);
  }

  const existingRAVItoX = await db.get<ResultAnalysisClass6_10[]>('setup:result_analysis_vi_x');
  if (!existingRAVItoX) {
    await db.set('setup:result_analysis_vi_x', DEFAULT_RESULT_ANALYSIS_VI_X);
  }

  const existingRAXItoXII = await db.get<ResultAnalysisClass11_12[]>('setup:result_analysis_xi_xii');
  if (!existingRAXItoXII) {
    await db.set('setup:result_analysis_xi_xii', DEFAULT_RESULT_ANALYSIS_XI_XII);
  }

  const existingObs = await db.get<StudentBehaviourObservationRecord[]>('setup:student_behaviour_observations');
  if (!existingObs) {
    await db.set('setup:student_behaviour_observations', DEFAULT_STUDENT_BEHAVIOUR_OBSERVATIONS);
  }

  const existingRem20a = await db.get<RemedialAssistanceRecord20a[]>('setup:remedial_assistance_20a');
  if (!existingRem20a) {
    await db.set('setup:remedial_assistance_20a', DEFAULT_REMEDIAL_ASSISTANCE_20A);
  }

  const existingRem20b = await db.get<RemedialTeachingDetailsRecord20b[]>('setup:remedial_teaching_20b');
  if (!existingRem20b) {
    await db.set('setup:remedial_teaching_20b', DEFAULT_REMEDIAL_TEACHING_DETAILS_20B);
  }

  const existingRem20c = await db.get<RemedialPerformanceTrackingRecord20c[]>('setup:remedial_performance_20c');
  if (!existingRem20c) {
    await db.set('setup:remedial_performance_20c', DEFAULT_REMEDIAL_PERFORMANCE_TRACKING_20C);
  }

  const existingPtm22 = await db.get<PtmMeetingRecord22[]>('setup:ptm_meetings_22');
  if (!existingPtm22) {
    await db.set('setup:ptm_meetings_22', DEFAULT_PTM_MEETINGS_22);
  }

  const existingSm23 = await db.get<StaffMeetingRecord23[]>('setup:staff_meetings_23');
  if (!existingSm23) {
    await db.set('setup:staff_meetings_23', DEFAULT_STAFF_MEETINGS_23);
  }

  const existingScm24 = await db.get<SubjectCommitteeMeetingRecord24[]>('setup:subject_meetings_24');
  if (!existingScm24) {
    await db.set('setup:subject_meetings_24', DEFAULT_SUBJECT_MEETINGS_24);
  }

  const existingWdot26 = await db.get<WorkDoneOtherThanTeaching26Record[]>('setup:work_done_other_than_teaching_26');
  if (!existingWdot26) {
    await db.set('setup:work_done_other_than_teaching_26', DEFAULT_WORK_DONE_26);
  }

  const existingIct27 = await db.get<IctClassroomUsage27Record[]>('setup:ict_classroom_usage_27');
  if (!existingIct27) {
    await db.set('setup:ict_classroom_usage_27', DEFAULT_ICT_USAGE_27);
  }

  const existingAlc28 = await db.get<AcademicLossCompensation28Record[]>('setup:academic_loss_28');
  if (!existingAlc28) {
    await db.set('setup:academic_loss_28', DEFAULT_ACADEMIC_LOSS_28);
  }

  const existingJl29 = await db.get<JoyfulLearning29Record[]>('setup:joyful_learning_29');
  if (!existingJl29) {
    await db.set('setup:joyful_learning_29', DEFAULT_JOYFUL_LEARNING_29);
  }

  const existingCbt30 = await db.get<CompetencyTestItem30Record[]>('setup:competency_tests_30');
  if (!existingCbt30) {
    await db.set('setup:competency_tests_30', DEFAULT_COMPETENCY_TESTS_30);
  }

  const existingInno31a = await db.get<TeacherInnovationProject31aRecord[]>('setup:teacher_innovation_31a');
  if (!existingInno31a) {
    await db.set('setup:teacher_innovation_31a', DEFAULT_INNOVATION_PROJECTS_31A);
  }

  const existingBp31b = await db.get<TeacherBestPractice31bRecord[]>('setup:teacher_best_practices_31b');
  if (!existingBp31b) {
    await db.set('setup:teacher_best_practices_31b', DEFAULT_BEST_PRACTICES_31B);
  }

  const existingCustomRoles = await db.get<CustomRoleDefinition[]>('setup:custom_roles');
  if (!existingCustomRoles || existingCustomRoles.length === 0) {
    await db.set('setup:custom_roles', DEFAULT_KVS_ROLES);
  } else {
    // Ensure all 12 default roles exist if not present
    const missingDefaults = DEFAULT_KVS_ROLES.filter(def => !existingCustomRoles.some(r => r.name.toLowerCase() === def.name.toLowerCase()));
    if (missingDefaults.length > 0) {
      await db.set('setup:custom_roles', [...existingCustomRoles, ...missingDefaults]);
    }
  }

  // Auth Users and Active Session Initialization
  const currentSchool = (await db.get<SchoolDetails>('setup:school')) || DEFAULT_SCHOOL;
  const existingUsers = await db.get<UserAccount[]>('auth:users_list');
  const hasDummyUsers = existingUsers && existingUsers.some(u => 
    u.id === 'user-dem-01' || u.name === 'Vikram Mehta' || u.name === 'Updesh Kumar' || u.name === 'Sunita Verma' || u.name === 'Anjali Deshmukh'
  );

  if (!existingUsers || existingUsers.length < 15 || hasDummyUsers) {
    // Overwrite with full real 21 staff accounts
    const syncedDefaults = DEFAULT_USER_ACCOUNTS.map(u => {
      if (u.role === 'admin') {
        return {
          ...u,
          name: currentSchool.principalName || u.name,
          designation: currentSchool.principalDesignation || u.designation || 'Principal I/c',
          email: currentSchool.officialEmail || u.email
        };
      }
      return u;
    });
    await db.set('auth:users_list', syncedDefaults);
  } else {
    // Sync principal name & designation to admin account
    const syncedUsers = existingUsers.map(u => {
      if (u.role === 'admin' || u.id.includes('admin')) {
        return {
          ...u,
          name: currentSchool.principalName || u.name,
          designation: currentSchool.principalDesignation || u.designation || 'Principal I/c',
          email: currentSchool.officialEmail || u.email
        };
      }
      return u;
    });
    await db.set('auth:users_list', syncedUsers);
  }

  const existingCurrentUser = await db.get<UserAccount>('auth:current_user');
  if (!existingCurrentUser || existingCurrentUser.name === 'Vikram Mehta' || existingCurrentUser.name === 'Updesh Kumar' || existingCurrentUser.name === 'Sunita Verma' || existingCurrentUser.name === 'Anjali Deshmukh') {
    await db.set('auth:current_user', DEFAULT_USER_ACCOUNTS[0]);
  } else if (existingCurrentUser.role === 'admin' || existingCurrentUser.id.includes('admin')) {
    const updatedAdmin = {
      ...existingCurrentUser,
      name: currentSchool.principalName || existingCurrentUser.name,
      designation: currentSchool.principalDesignation || existingCurrentUser.designation || 'Principal I/c',
      email: currentSchool.officialEmail || existingCurrentUser.email
    };
    await db.set('auth:current_user', updatedAdmin);
  }
}

export async function resetDatabaseToDefaults() {
  const keys = [
    'setup:school',
    'setup:teacher',
    'setup:staff_details',
    'setup:sessions',
    'setup:classes',
    'setup:subjects',
    'setup:timetable',
    'setup:calendar',
    'setup:exams',
    'setup:syllabus',
    'setup:lesson_plans',
    'setup:assessments',
    'setup:inspections',
    'setup:hourly_activities',
    'setup:evidence',
    'setup:calendar_sync',
    'setup:tasks',
    'setup:duty_presets',
    'setup:students',
    'setup:practical_attendance',
    'setup:scholastic_scores_vi_viii',
    'setup:scholastic_scores_ix_x',
    'setup:monitoring_cum_reporting',
    'setup:late_bloomer_progress',
    'setup:nipun_meetings',
    'setup:scholastic_scores_i_ii',
    'setup:notebook_scores_iii_v',
    'setup:sea_scores_iii_v',
    'setup:scholastic_scores_iii_v',
    'setup:oral_reading_fluency_tara',
    'setup:result_analysis_iii_v',
    'setup:result_analysis_vi_x',
    'setup:result_analysis_xi_xii',
    'setup:student_behaviour_observations',
    'setup:remedial_assistance_20a',
    'setup:remedial_teaching_20b',
    'setup:remedial_performance_20c',
    'setup:ptm_meetings_22',
    'setup:staff_meetings_23',
    'setup:subject_meetings_24',
    'setup:work_done_other_than_teaching_26',
    'setup:ict_classroom_usage_27',
    'setup:academic_loss_28',
    'setup:joyful_learning_29',
    'setup:competency_tests_30',
    'setup:teacher_innovation_31a',
    'setup:teacher_best_practices_31b'
  ];
  for (const k of keys) {
    await db.remove(k);
  }
}

export const DEFAULT_HOURLY_ACTIVITIES: HourlyActivity[] = [
  {
    id: 'act-101',
    date: '2026-08-09',
    startTime: '07:30',
    endTime: '08:15',
    title: 'Morning School Assembly & Uniform/Discipline Duty',
    description: 'Managed morning prayer assembly, uniform check, house march past supervision, and student attendance.',
    category: 'Assembly & Duty',
    status: 'Done',
    priority: 'Do First (Urgent & Important)',
    className: 'X-A',
    subjectName: 'Assembly',
    isOverlappingDuty: false,
    evidenceIds: ['ev-101'],
    kanbanColumn: 'Completed',
    createdAt: '2026-08-09T07:30:00.000Z',
    updatedAt: '2026-08-09T08:15:00.000Z'
  },
  {
    id: 'act-102',
    date: '2026-08-09',
    startTime: '08:15',
    endTime: '09:00',
    title: 'Class X-A Mathematics Period 1: Quadratic Equations',
    description: 'Taught factorization methods for quadratic roots. Conducted board drill and collected homework notebooks.',
    category: 'Teaching',
    status: 'Done',
    priority: 'Do First (Urgent & Important)',
    className: 'X-A',
    subjectName: 'Mathematics (041)',
    isOverlappingDuty: false,
    evidenceIds: ['ev-102'],
    kanbanColumn: 'Completed',
    createdAt: '2026-08-09T08:15:00.000Z',
    updatedAt: '2026-08-09T09:00:00.000Z'
  },
  {
    id: 'act-103',
    date: '2026-08-09',
    startTime: '09:00',
    endTime: '10:30',
    title: 'Emergency GeM Portal Procurement Sanction & L1 Verification',
    description: 'Urgent processing of GeM portal order for lab chemicals & sports equipment per Principal order. Uploaded CRAC certificate.',
    category: 'GeM Portal Admin',
    status: 'Done',
    priority: 'Do First (Urgent & Important)',
    isOverlappingDuty: true,
    overloadReason: 'Called to computer lab by Principal during Period 3 free slot; extended into substitution slot.',
    evidenceIds: ['ev-103'],
    kanbanColumn: 'Completed',
    createdAt: '2026-08-09T09:00:00.000Z',
    updatedAt: '2026-08-09T10:30:00.000Z'
  },
  {
    id: 'act-104',
    date: '2026-08-09',
    startTime: '10:30',
    endTime: '11:10',
    title: 'Class IX-B Mathematics Period 4: Polynomials',
    description: 'Taught Remainder Theorem and algebraic identities. Handed out diagnostic practice sheets.',
    category: 'Teaching',
    status: 'Done',
    priority: 'Schedule (Important & Not Urgent)',
    className: 'IX-B',
    subjectName: 'Mathematics (041)',
    isOverlappingDuty: false,
    evidenceIds: [],
    kanbanColumn: 'Completed',
    createdAt: '2026-08-09T10:30:00.000Z',
    updatedAt: '2026-08-09T11:10:00.000Z'
  },
  {
    id: 'act-105',
    date: '2026-08-09',
    startTime: '11:10',
    endTime: '11:35',
    title: 'Recess Corridor & Canteen Safety Vigil Duty',
    description: 'Supervised student safety in central courtyard, preventing rush near water coolers and canteen.',
    category: 'Assembly & Duty',
    status: 'Done',
    priority: 'Schedule (Important & Not Urgent)',
    isOverlappingDuty: false,
    evidenceIds: [],
    kanbanColumn: 'Completed',
    createdAt: '2026-08-09T11:10:00.000Z',
    updatedAt: '2026-08-09T11:35:00.000Z'
  },
  {
    id: 'act-106',
    date: '2026-08-09',
    startTime: '11:35',
    endTime: '12:50',
    title: 'National Sports Meet (NSM) Squad Training & Physical Conditioning',
    description: 'Coached Regional Athletics squad for 100m sprint, relay baton passing, and high jump practice on school grounds.',
    category: 'Sports / RSM / NSM',
    status: 'Done',
    priority: 'Do First (Urgent & Important)',
    isOverlappingDuty: true,
    overloadReason: 'KVS Regional Sports Office deadline requires daily intensive 75-min squad training session.',
    evidenceIds: ['ev-104'],
    kanbanColumn: 'Completed',
    createdAt: '2026-08-09T11:35:00.000Z',
    updatedAt: '2026-08-09T12:50:00.000Z'
  },
  {
    id: 'act-107',
    date: '2026-08-09',
    startTime: '12:50',
    endTime: '13:30',
    title: 'Class XII Physics Period 7: Electrostatics Numerical Drill',
    description: 'Doubt clearance and Gauss law application problems for upcoming Board Mock assessment.',
    category: 'Teaching',
    status: 'In Progress',
    priority: 'Schedule (Important & Not Urgent)',
    className: 'XII-A',
    subjectName: 'Physics (042)',
    isOverlappingDuty: false,
    evidenceIds: [],
    kanbanColumn: 'In Progress',
    createdAt: '2026-08-09T12:50:00.000Z',
    updatedAt: '2026-08-09T13:30:00.000Z'
  },
  {
    id: 'act-108',
    date: '2026-08-09',
    startTime: '13:30',
    endTime: '14:30',
    title: 'Independence Day Parade March Past & Pyramid Formation Rehearsal',
    description: 'Conducted drill ground march past rhythm training and 3-tier human pyramid safety formation rehearsal.',
    category: 'Parade & Pyramid',
    status: 'Pending',
    priority: 'Do First (Urgent & Important)',
    isOverlappingDuty: true,
    overloadReason: 'National Event preparations assigned as In-Charge Officer.',
    evidenceIds: [],
    kanbanColumn: 'Pending',
    createdAt: '2026-08-09T13:30:00.000Z',
    updatedAt: '2026-08-09T13:30:00.000Z'
  },
  {
    id: 'act-109',
    date: '2026-08-09',
    startTime: '14:30',
    endTime: '15:30',
    title: 'Grading 45 Class X Mathematics Periodic Test Answer Scripts',
    description: 'Evaluating PT-1 answer sheets and entering marks into KVS Online Portal & Teacher Register.',
    category: 'Teacher Diary Docs',
    status: 'Missed',
    priority: 'Delegate (Urgent & Not Important)',
    className: 'X-A',
    subjectName: 'Mathematics (041)',
    isOverlappingDuty: true,
    overloadReason: 'Delayed due to back-to-back GeM Portal emergency sanction and NSM sports grounds training.',
    evidenceIds: [],
    kanbanColumn: 'Delayed',
    createdAt: '2026-08-09T14:30:00.000Z',
    updatedAt: '2026-08-09T15:30:00.000Z'
  }
];

export const DEFAULT_EVIDENCE: ActivityEvidence[] = [
  {
    id: 'ev-101',
    activityId: 'act-101',
    fileType: 'image',
    fileName: 'Morning_Assembly_Discipline_Duty.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80',
    fileSize: '1.2 MB',
    uploadedAt: '2026-08-09T08:00:15.120Z',
    timestampVerified: true,
    caption: 'Verified photograph of morning prayer assembly & uniform discipline check'
  },
  {
    id: 'ev-102',
    activityId: 'act-102',
    fileType: 'image',
    fileName: 'Class_XA_Maths_Blackboard_Work.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80',
    fileSize: '2.1 MB',
    uploadedAt: '2026-08-09T08:55:02.400Z',
    timestampVerified: true,
    caption: 'Class X-A Quadratic Equations chalkboard derivations and student board practice'
  },
  {
    id: 'ev-103',
    activityId: 'act-103',
    fileType: 'document',
    fileName: 'GeM_Procurement_Sanction_CRAC_Receipt.pdf',
    fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    fileSize: '840 KB',
    uploadedAt: '2026-08-09T10:15:40.880Z',
    timestampVerified: true,
    caption: 'Official Government e-Marketplace (GeM) CRAC inspection & approval receipt signed by Principal'
  },
  {
    id: 'ev-104',
    activityId: 'act-106',
    fileType: 'image',
    fileName: 'NSM_Athletics_Ground_Training.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop&q=80',
    fileSize: '1.8 MB',
    uploadedAt: '2026-08-09T12:30:10.050Z',
    timestampVerified: true,
    caption: 'National Sports Meet relay team baton practice on school track grounds'
  }
];

export const DEFAULT_CALENDAR_SETTINGS: CalendarSyncSetting[] = [
  {
    id: 'cal-1',
    calendarName: 'Teaching & Class Schedule',
    category: 'Teaching',
    color: '#8B5CF6',
    syncEnabled: true,
    googleCalendarId: 'teacher.teaching@group.calendar.google.com',
    sharedWithPrincipal: true,
    lastSyncedAt: '2026-08-09T08:00:00.000Z'
  },
  {
    id: 'cal-2',
    calendarName: 'GeM Portal & Admin Deadlines',
    category: 'GeM Portal Admin',
    color: '#F59E0B',
    syncEnabled: true,
    googleCalendarId: 'teacher.gemadmin@group.calendar.google.com',
    sharedWithPrincipal: true,
    lastSyncedAt: '2026-08-09T08:00:00.000Z'
  },
  {
    id: 'cal-3',
    calendarName: 'Sports (NSM / RSM) & Ground Training',
    category: 'Sports / RSM / NSM',
    color: '#10B981',
    syncEnabled: true,
    googleCalendarId: 'teacher.sports@group.calendar.google.com',
    sharedWithPrincipal: true,
    lastSyncedAt: '2026-08-09T08:00:00.000Z'
  },
  {
    id: 'cal-4',
    calendarName: 'Parade & National Event Rehearsals',
    category: 'Parade & Pyramid',
    color: '#EC4899',
    syncEnabled: true,
    googleCalendarId: 'teacher.parade@group.calendar.google.com',
    sharedWithPrincipal: true,
    lastSyncedAt: '2026-08-09T08:00:00.000Z'
  },
  {
    id: 'cal-5',
    calendarName: 'Recess & Assembly Vigil Duties',
    category: 'Assembly & Duty',
    color: '#3B82F6',
    syncEnabled: true,
    googleCalendarId: 'teacher.duty@group.calendar.google.com',
    sharedWithPrincipal: true,
    lastSyncedAt: '2026-08-09T08:00:00.000Z'
  }
];

export const DEFAULT_TASKS: TeacherTask[] = [
  {
    id: 'tsk-201',
    title: 'Process Emergency GeM Portal CRAC Sanction for Science Lab Equipment',
    description: 'Verify L1 vendor document submission, inspect delivered goods in physics lab, and generate online Consignee Receipt and Acceptance Certificate (CRAC) on GeM Portal.',
    category: 'GeM Portal Admin',
    priority: 'Do First (Urgent & Important)',
    status: 'In Progress',
    dueDate: '2026-08-10',
    dueTime: '12:00',
    listId: 'list_work',
    estimatedMinutes: 60,
    subtasks: [
      { id: 'st-1', title: 'Cross-check physical delivered items against GeM Invoice #4920', completed: true },
      { id: 'st-2', title: 'Verify lab stock entry register page number', completed: true },
      { id: 'st-3', title: 'Login with Digital Signature on GeM Portal', completed: false },
      { id: 'st-4', title: 'Upload signed CRAC certificate and forward to Principal for payment', completed: false }
    ],
    tags: ['GeM Procurement', 'Urgent Admin', 'Lab Stock'],
    isRecurring: false,
    assignedTo: 'Self (In-Charge Teacher)',
    linkedClass: 'X-A',
    linkedSubject: 'Physics (042)',
    overloadImpact: true,
    createdAt: '2026-08-09T08:00:00.000Z',
    updatedAt: '2026-08-09T10:00:00.000Z'
  },
  {
    id: 'tsk-202',
    title: 'Grade Periodic Test 1 (PT-1) Mathematics Answer Papers - Class X-A',
    description: 'Evaluate 45 student test booklets for Quadratic Equations & Polynomials. Enter marks in KVS e-Pravesh/Student Portal.',
    category: 'Teacher Diary Docs',
    priority: 'Schedule (Important & Not Urgent)',
    status: 'Pending',
    dueDate: '2026-08-12',
    dueTime: '16:00',
    listId: 'list_work',
    estimatedMinutes: 120,
    subtasks: [
      { id: 'st-5', title: 'Grade Questions 1 to 15 (Section A & B)', completed: true },
      { id: 'st-6', title: 'Grade Long Answer Questions 16 to 25 (Section C & D)', completed: false },
      { id: 'st-7', title: 'Prepare marks tabulator sheet and error analysis report', completed: false }
    ],
    tags: ['PT-1 Evaluation', 'Board Exam Prep', 'Class X-A'],
    isRecurring: false,
    assignedTo: 'Self',
    linkedClass: 'Class 10-A',
    linkedSubject: 'Mathematics (041)',
    overloadImpact: true,
    createdAt: '2026-08-09T09:00:00.000Z',
    updatedAt: '2026-08-09T09:00:00.000Z'
  },
  {
    id: 'tsk-203',
    title: 'Conduct Daily Morning Assembly Prayer & Uniform Discipline Patrol',
    description: 'Supervise morning assembly, house march past, uniform cleanliness, and monitor late-coming students at main school gate.',
    category: 'Assembly & Duty',
    priority: 'Schedule (Important & Not Urgent)',
    status: 'Completed',
    dueDate: '2026-08-09',
    dueTime: '07:45',
    listId: 'inbox',
    estimatedMinutes: 45,
    subtasks: [
      { id: 'st-8', title: 'Check sound system and mic setup in courtyard', completed: true },
      { id: 'st-9', title: 'Record late arrival student names in discipline diary', completed: true }
    ],
    tags: ['Daily Duty', 'Assembly', 'Discipline'],
    isRecurring: true,
    recurringFrequency: 'Daily',
    assignedTo: 'Self & House Master',
    overloadImpact: false,
    createdAt: '2026-08-09T07:00:00.000Z',
    updatedAt: '2026-08-09T08:15:00.000Z'
  },
  {
    id: 'tsk-204',
    title: 'National Sports Meet (NSM) Regional Squad Athletic Ground Drill',
    description: 'Conduct intensive 100m sprint baton relay drill and physical conditioning session for selected regional athletes.',
    category: 'Sports / RSM / NSM',
    priority: 'Do First (Urgent & Important)',
    status: 'Completed',
    dueDate: '2026-08-09',
    dueTime: '12:30',
    listId: 'list_work',
    estimatedMinutes: 75,
    subtasks: [
      { id: 'st-10', title: 'Check sports kit & track readiness', completed: true },
      { id: 'st-11', title: 'Conduct sprint timing trials and log performance in sports register', completed: true }
    ],
    tags: ['NSM Sports', 'KVS Athletics', 'Regional Squad'],
    isRecurring: true,
    recurringFrequency: 'Daily',
    assignedTo: 'Self (Sports In-Charge)',
    overloadImpact: true,
    createdAt: '2026-08-09T08:00:00.000Z',
    updatedAt: '2026-08-09T12:50:00.000Z'
  },
  {
    id: 'tsk-205',
    title: 'Independence Day Parade March Past & Pyramid Formation Safety Rehearsal',
    description: 'Train 60 students in synchronized march past steps and erect 3-tier human pyramid with safety crash mats.',
    category: 'Parade & Pyramid',
    priority: 'Do First (Urgent & Important)',
    status: 'In Progress',
    dueDate: '2026-08-11',
    dueTime: '14:00',
    listId: 'list_work',
    estimatedMinutes: 90,
    subtasks: [
      { id: 'st-12', title: 'Arrange safety mats on drill ground', completed: true },
      { id: 'st-13', title: 'Rehearse band rhythm steps with marching contingent', completed: false },
      { id: 'st-14', title: 'Finalize student positions for 3-tier pyramid', completed: false }
    ],
    tags: ['Independence Day', 'Parade', 'Pyramid'],
    isRecurring: true,
    recurringFrequency: 'Daily',
    assignedTo: 'Self (Parade Officer)',
    overloadImpact: true,
    createdAt: '2026-08-08T10:00:00.000Z',
    updatedAt: '2026-08-09T14:00:00.000Z'
  }
];

export const DEFAULT_TEACHER_ATTENDANCE: TeacherAttendanceRecord[] = [
  {
    id: 'att-staff-108894-2026-08-20',
    employeeCode: '108894',
    teacherName: 'UPDESH SINGH PAL',
    designation: 'TGT (P&HE)',
    employmentType: 'Regular',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    inTime: '07:32 AM',
    markedBy: 'Self / Biometric',
    markedAt: new Date().toISOString()
  },
  {
    id: 'att-staff-108990-2026-08-20',
    employeeCode: '108990',
    teacherName: 'MANISH KUMAR YADAV',
    designation: 'PRT',
    employmentType: 'Regular',
    date: new Date().toISOString().split('T')[0],
    status: 'Leave',
    leaveType: 'CL',
    remarks: 'Family emergency / urgent personal work',
    markedBy: 'Principal / Admin',
    markedAt: new Date().toISOString(),
    verifiedByPrincipal: true
  },
  {
    id: 'att-staff-104992-2026-08-20',
    employeeCode: '104992',
    teacherName: 'PRIYANKA SHARMA',
    designation: 'TGT English (Contractual)',
    employmentType: 'Contractual',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    inTime: '07:40 AM',
    markedBy: 'Biometric',
    markedAt: new Date().toISOString()
  }
];

export const DEFAULT_LEAVE_APPLICATIONS: LeaveApplication[] = [
  {
    id: 'la-2026-08-01',
    employeeCode: '108990',
    teacherName: 'MANISH KUMAR YADAV',
    designation: 'PRT',
    employmentType: 'Regular',
    leaveType: 'CL',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    totalDays: 1,
    reason: 'Urgent domestic work at hometown',
    stationLeavingPermission: false,
    status: 'Sanctioned',
    appliedAt: new Date().toISOString(),
    sanctionedBy: 'Shri Hemananda Barik (Principal I/c)',
    sanctionedAt: new Date().toISOString(),
    principalRemarks: 'Sanctioned. Ensure proxy arrangements are in place.',
    proxyArrangementsConfirmed: true
  },
  {
    id: 'la-omprakash-2026-08-22',
    employeeCode: '106018',
    teacherName: 'OMPRAKASH SHARMA',
    designation: 'TGT (Sanskrit)',
    employmentType: 'Regular',
    leaveType: 'SpCL',
    fromDate: '2026-08-22',
    toDate: '2026-08-30',
    totalDays: 5,
    isCombinedLeave: true,
    dailyLeaveBreakdown: [
      { date: '2026-08-22', dayName: 'Saturday', leaveType: 'SpCL', isNonWorkingDay: false, reason: 'Special Casual Leave' },
      { date: '2026-08-23', dayName: 'Sunday', leaveType: 'Sunday', isNonWorkingDay: true, reason: 'Sunday (Weekly Off)' },
      { date: '2026-08-24', dayName: 'Monday', leaveType: 'SpCL', isNonWorkingDay: false, reason: 'Special Casual Leave' },
      { date: '2026-08-25', dayName: 'Tuesday', leaveType: 'SpCL', isNonWorkingDay: false, reason: 'Special Casual Leave' },
      { date: '2026-08-26', dayName: 'Wednesday', leaveType: 'Holiday', isNonWorkingDay: true, reason: 'Janmashtami (Gazetted Holiday)' },
      { date: '2026-08-27', dayName: 'Thursday', leaveType: 'CL', isNonWorkingDay: false, reason: 'Casual Leave' },
      { date: '2026-08-28', dayName: 'Friday', leaveType: 'Holiday', isNonWorkingDay: true, reason: 'School / Local Holiday' },
      { date: '2026-08-29', dayName: 'Saturday', leaveType: 'CL', isNonWorkingDay: false, reason: 'Casual Leave' },
      { date: '2026-08-30', dayName: 'Sunday', leaveType: 'Sunday', isNonWorkingDay: true, reason: 'Sunday (Weekly Off)' }
    ],
    reason: 'Out of station (SpCL + CL + Holidays)',
    stationLeavingPermission: true,
    stationAddress: 'Jaipur, Rajasthan',
    status: 'Sanctioned',
    appliedAt: '2026-08-20T10:00:00.000Z',
    sanctionedBy: 'Shri Hemananda Barik (Principal I/c)',
    sanctionedAt: '2026-08-20T12:00:00.000Z',
    principalRemarks: 'Sanctioned combined continuous leave under KVS leave rules.',
    proxyArrangementsConfirmed: true
  }
];

export const DEFAULT_ON_DUTY_RECORDS: OnDutyRecord[] = [
  {
    id: 'od-2026-08-15',
    employeeCode: '108894',
    teacherName: 'UPDESH SINGH PAL',
    designation: 'TGT (P&HE)',
    purpose: 'National Sports Meet (NSM)',
    description: 'Deputed as Team Manager & Contingent Leader for KVS Regional Athletics Contingent at National Sports Meet.',
    venue: 'KV No. 1 Bhubaneswar',
    officialOrderNo: 'KVS/RO/BBSR/SPORTS/2026/894',
    fromDate: '2026-08-25',
    toDate: '2026-08-28',
    totalDays: 4,
    affectedPeriods: [
      { day: 'Tuesday', period: 1, className: 'VI-A', subjectName: 'Physical & Health Education' },
      { day: 'Tuesday', period: 3, className: 'VII-A', subjectName: 'Physical & Health Education' },
      { day: 'Wednesday', period: 2, className: 'VIII-A', subjectName: 'Physical & Health Education' }
    ],
    sanctionedByPrincipal: true,
    sanctionedDate: '2026-08-18',
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_TRANSFER_CERTIFICATES: TransferCertificateRecord[] = [
  {
    id: 'tc-2026-001',
    tcNumber: 'TC/2026-27/001',
    bookNo: 'Vol-XV',
    studentId: 'KV-2025-1088',
    studentName: 'AARAV MOHANTY',
    admissionNo: '1088',
    penNo: 'PEN2025091244',
    apaarId: 'APAAR-9812-4412-09',
    fatherName: 'RAJESH MOHANTY',
    motherName: 'PRIYA MOHANTY',
    nationality: 'Indian',
    socialCategory: 'GEN',
    className: 'VIII',
    section: 'A',
    admissionDateInSchool: '01/04/2021',
    dateOfLeaving: '2026-08-10',
    dateOfIssueTc: '2026-08-12',
    reasonForLeaving: 'Parent Transfer',
    destinationSchoolName: 'KV MEG & Centre Bangalore',
    totalWorkingDays: 68,
    daysPresent: 64,
    conductAndBehaviour: 'Very Good',
    duesCleared: true,
    issuedByPrincipalName: 'Shri Hemananda Barik (Principal I/c)',
    status: 'Issued',
    createdAt: '2026-08-12T10:00:00.000Z',
    updatedAt: '2026-08-12T10:00:00.000Z'
  }
];

export const DEFAULT_MONTHLY_ENROLLMENT_SNAPSHOTS: MonthlyEnrollmentSnapshot[] = [
  {
    id: 'enroll-ro-2026-07',
    month: 'July',
    year: 2026,
    monthYearStr: '2026-07',
    generatedAt: '2026-07-31T17:00:00.000Z',
    generatedBy: 'UPDESH SINGH PAL (Data Entry Manager)',
    verifiedByPrincipal: 'Shri Hemananda Barik (Principal I/c)',
    schoolName: 'KENDRIYA VIDYALAYA KUTRA',
    kvCode: '1628',
    region: 'BHUBANESWAR',
    classesData: [
      {
        className: 'VI',
        section: 'A',
        boysCount: 22,
        girlsCount: 18,
        transgenderCount: 0,
        totalStudents: 40,
        categoryBreakdown: {
          gen: { boys: 8, girls: 6, total: 14 },
          obc: { boys: 7, girls: 6, total: 13 },
          sc: { boys: 4, girls: 3, total: 7 },
          st: { boys: 3, girls: 3, total: 6 },
          ewsOrBpl: { boys: 2, girls: 1, total: 3 },
          minority: { boys: 1, girls: 1, total: 2 },
          singleGirlChild: 4,
          rte: 10,
          differentlyAbled: 0
        },
        admissionsInMonth: 2,
        tcIssuedInMonth: 0,
        netEnrollment: 40
      },
      {
        className: 'VII',
        section: 'A',
        boysCount: 20,
        girlsCount: 19,
        transgenderCount: 0,
        totalStudents: 39,
        categoryBreakdown: {
          gen: { boys: 7, girls: 7, total: 14 },
          obc: { boys: 6, girls: 6, total: 12 },
          sc: { boys: 4, girls: 3, total: 7 },
          st: { boys: 3, girls: 3, total: 6 },
          ewsOrBpl: { boys: 1, girls: 2, total: 3 },
          minority: { boys: 1, girls: 0, total: 1 },
          singleGirlChild: 3,
          rte: 8,
          differentlyAbled: 0
        },
        admissionsInMonth: 1,
        tcIssuedInMonth: 1,
        netEnrollment: 39
      },
      {
        className: 'VIII',
        section: 'A',
        boysCount: 21,
        girlsCount: 19,
        transgenderCount: 0,
        totalStudents: 40,
        categoryBreakdown: {
          gen: { boys: 8, girls: 7, total: 15 },
          obc: { boys: 6, girls: 6, total: 12 },
          sc: { boys: 4, girls: 3, total: 7 },
          st: { boys: 3, girls: 3, total: 6 },
          ewsOrBpl: { boys: 1, girls: 1, total: 2 },
          minority: { boys: 1, girls: 1, total: 2 },
          singleGirlChild: 2,
          rte: 6,
          differentlyAbled: 0
        },
        admissionsInMonth: 0,
        tcIssuedInMonth: 0,
        netEnrollment: 40
      },
      {
        className: 'IX',
        section: 'A',
        boysCount: 24,
        girlsCount: 18,
        transgenderCount: 0,
        totalStudents: 42,
        categoryBreakdown: {
          gen: { boys: 9, girls: 6, total: 15 },
          obc: { boys: 8, girls: 6, total: 14 },
          sc: { boys: 4, girls: 3, total: 7 },
          st: { boys: 3, girls: 3, total: 6 },
          ewsOrBpl: { boys: 2, girls: 1, total: 3 },
          minority: { boys: 1, girls: 1, total: 2 },
          singleGirlChild: 3,
          rte: 0,
          differentlyAbled: 1
        },
        admissionsInMonth: 1,
        tcIssuedInMonth: 0,
        netEnrollment: 42
      },
      {
        className: 'X',
        section: 'A',
        boysCount: 23,
        girlsCount: 17,
        transgenderCount: 0,
        totalStudents: 40,
        categoryBreakdown: {
          gen: { boys: 9, girls: 6, total: 15 },
          obc: { boys: 7, girls: 5, total: 12 },
          sc: { boys: 4, girls: 3, total: 7 },
          st: { boys: 3, girls: 3, total: 6 },
          ewsOrBpl: { boys: 1, girls: 1, total: 2 },
          minority: { boys: 1, girls: 0, total: 1 },
          singleGirlChild: 2,
          rte: 0,
          differentlyAbled: 0
        },
        admissionsInMonth: 0,
        tcIssuedInMonth: 1,
        netEnrollment: 40
      }
    ],
    grandTotals: {
      totalBoys: 110,
      totalGirls: 91,
      totalStudents: 201,
      totalGen: 73,
      totalObc: 63,
      totalSc: 35,
      totalSt: 30,
      totalEws: 13,
      totalMinority: 8,
      totalSgc: 14,
      totalRte: 24,
      totalDifferentlyAbled: 1,
      totalTcIssued: 2,
      totalNewAdmissions: 4
    },
    roSubmissionStatus: 'Submitted to RO',
    submissionDate: '2026-08-01',
    roDispatchNumber: 'KVK/RO-RET/2026/07-12'
  }
];

export const DEFAULT_STUDENT_ATTENDANCE: StudentAttendanceRecord[] = [
  {
    id: 'att-std-1049-2026-08-20',
    studentId: 'KV-2025-1049',
    studentName: 'AAYUSH PATEL',
    rollNo: 1,
    className: 'VI',
    section: 'A',
    date: new Date().toISOString().split('T')[0],
    status: 'P',
    markedAt: new Date().toISOString()
  }
];

export const DEFAULT_CLASS_DAILY_ATTENDANCE: ClassDailyAttendanceRecord[] = [
  {
    id: 'att-cls-I-2026-04-01',
    date: '2026-04-01',
    className: 'I',
    section: 'A',
    totalStudents: 40,
    presentCount: 32,
    absentCount: 2,
    absentRollNos: [6, 32],
    markedByTeacherName: 'Aarti Kisan',
    markedAt: '2026-04-01T08:30:00.000Z'
  },
  {
    id: 'att-cls-II-2026-04-01',
    date: '2026-04-01',
    className: 'II',
    section: 'A',
    totalStudents: 40,
    presentCount: 31,
    absentCount: 7,
    absentRollNos: [11, 12, 13, 15, 31, 34, 39],
    markedByTeacherName: 'Santwana Dash',
    markedAt: '2026-04-01T08:30:00.000Z'
  }
];

export const DEFAULT_PROXY_DUTIES: ProxyDutyAssignment[] = [
  {
    id: 'proxy-2026-08-20-p2-viia',
    date: new Date().toISOString().split('T')[0],
    dayOfWeek: 'Thursday',
    periodNumber: 2,
    timeSlot: '08:30 - 09:10',
    className: 'VII',
    section: 'A',
    subjectName: 'Hindi',
    roomNo: 'Room 102',
    absentTeacherCode: '108990',
    absentTeacherName: 'MANISH KUMAR YADAV',
    absenceReason: 'CL',
    substituteTeacherCode: '108894',
    substituteTeacherName: 'UPDESH SINGH PAL',
    substituteDesignation: 'TGT (P&HE)',
    isFreePeriod: true,
    assignedBy: 'Time-Table Committee / Principal',
    assignedAt: new Date().toISOString(),
    status: 'Assigned',
    syncedToTaskSystem: true,
    notes: 'Supervise Hindi reading & notebook revision'
  }
];

export const DEFAULT_LEAVE_SETTINGS: LeaveSettingsConfig = {
  contractualMinServiceMonths: 1,
  contractualMaxClPerMonth: 1,
  remedialVacationDutyMonths: ['2026-05', '2026-06'],
  regularClAnnualEntitlement: 8,
  regularElAnnualEntitlement: 10,
  regularHplAnnualEntitlement: 20,
  regularCclAnnualEntitlement: 730
};

export const DEFAULT_TICKETS: Ticket[] = [
  {
    id: 'tkt-1001',
    title: 'Excel Export formatting for Monthly Leave Statement',
    category: 'Feedback',
    priority: 'Medium',
    description: 'The monthly leave statement export works smoothly. Please ensure whole-school loss of pay days are highlighted in bold for accounts verification.',
    moduleOrPage: 'Teacher Attendance',
    status: 'Resolved',
    evidence: [],
    raisedBy: '108894',
    raisedByName: 'UPDESH SINGH PAL',
    raisedAt: '2026-08-19T09:30:00.000Z',
    assignedTo: 'admin',
    assignedToName: 'Principal / Admin',
    principalOrDevRemarks: 'Implemented in the latest version with dedicated whole-school summary totals row.',
    resolvedAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'tkt-1002',
    title: 'Automatic arrangement duty notification in TaskManager',
    category: 'Feature Request',
    priority: 'High',
    description: 'When proxy duty is assigned to a teacher, please auto-create an urgent task in TaskManager so they receive priority alert.',
    moduleOrPage: 'Timetable Planner',
    status: 'Resolved',
    evidence: [],
    raisedBy: '104822',
    raisedByName: 'Mrs. S. Mohapatra',
    raisedAt: '2026-08-19T14:15:00.000Z',
    assignedTo: 'admin',
    assignedToName: 'Principal / Admin',
    principalOrDevRemarks: 'Configured and live. Tasks are created under Arrangement / Proxy Duty category with Do First priority.',
    resolvedAt: '2026-08-20T11:30:00.000Z',
    updatedAt: '2026-08-20T11:30:00.000Z'
  },
  {
    id: 'tkt-1003',
    title: 'Student photo preview in attendance grid',
    category: 'UI/UX Issue',
    priority: 'Low',
    description: 'Would like to view student thumbnail avatar when hovering over student roll numbers in daily attendance register.',
    moduleOrPage: 'Student Enrollment',
    status: 'Open',
    evidence: [],
    raisedBy: '109241',
    raisedByName: 'Mr. P. K. Dash',
    raisedAt: '2026-08-20T08:00:00.000Z',
    updatedAt: '2026-08-20T08:00:00.000Z'
  }
];

export {
  DEFAULT_PORTFOLIO_TEMPLATES,
  DEFAULT_PORTFOLIO_ASSIGNMENTS,
  DEFAULT_RESPONSIBILITY_DELEGATIONS,
  DEFAULT_RESPONSIBILITY_REQUESTS,
  DEFAULT_PORTFOLIO_SUGGESTIONS
};

export const DEFAULT_SUBJECT_RESPONSIBILITIES: SubjectResponsibilityAssignment[] = [
  {
    id: 'sra-1',
    employeeCode: 'CS.107862', // Sipika Patel
    teacherName: 'SIPIKA PATEL',
    designation: 'TGT ODIA / Special Educator',
    subjectName: 'Odia',
    className: 'Class V-A',
    section: 'A',
    supportType: 'Primary Teacher / In-Charge',
    assignmentType: 'Whole Session',
    fromDate: '2026-04-01',
    toDate: '2027-03-31',
    roleNote: 'Odia in-charge – no regular Odia teacher appointed this session.',
    status: 'Active',
    assignedBy: 'Shri Hemananda Barik (Principal I/c)',
    assignedAt: '2026-04-01T09:00:00.000Z'
  },
  {
    id: 'sra-2',
    employeeCode: 'CS.107861', // Karishma Kerketta
    teacherName: 'KARISHMA KERKETTA',
    designation: 'PRT',
    subjectName: 'Mathematics',
    className: 'Class V-A',
    section: 'A',
    supportType: 'Academic Support / Co-Teaching',
    assignmentType: 'Whole Session',
    fromDate: '2026-08-12',
    toDate: '2027-03-31',
    roleNote: 'Class V Math academic support as per New Academic Plan (12-08-2026) to improve scholastic competency.',
    status: 'Active',
    assignedBy: 'Shri Hemananda Barik (Principal I/c)',
    assignedAt: '2026-08-12T10:30:00.000Z'
  }
];

export async function getSubjectResponsibilities(): Promise<SubjectResponsibilityAssignment[]> {
  const saved = await db.get<SubjectResponsibilityAssignment[]>('setup:subject_responsibility_assignments');
  if (saved && saved.length > 0) return saved;
  return DEFAULT_SUBJECT_RESPONSIBILITIES;
}

export async function saveSubjectResponsibilities(items: SubjectResponsibilityAssignment[]): Promise<void> {
  await db.set('setup:subject_responsibility_assignments', items);
}

export { THEME_CALENDAR_2026_27, THEME_FOR_THE_YEAR } from './themeCalendar2026';

export const DEFAULT_TASK_LISTS: TaskList[] = [
  {
    id: 'inbox',
    name: 'Inbox',
    type: 'smart',
    color: '#6366f1',
    icon: 'Inbox',
    filterRules: {
      dateRange: 'all',
      status: 'pending_or_in_progress'
    },
    isSystem: true,
    sortOrder: 1
  },
  {
    id: 'today',
    name: 'Today',
    type: 'smart',
    color: '#3b82f6',
    icon: 'Calendar23',
    filterRules: {
      dateRange: 'today',
      status: 'pending_or_in_progress'
    },
    isSystem: true,
    sortOrder: 2
  },
  {
    id: 'tomorrow',
    name: 'Tomorrow',
    type: 'smart',
    color: '#8b5cf6',
    icon: 'Sunrise',
    filterRules: {
      dateRange: 'tomorrow',
      status: 'pending_or_in_progress'
    },
    isSystem: true,
    sortOrder: 3
  },
  {
    id: 'next_7_days',
    name: 'Next 7 Days',
    type: 'smart',
    color: '#06b6d4',
    icon: 'CalendarDays',
    filterRules: {
      dateRange: 'next_7_days',
      status: 'pending_or_in_progress'
    },
    isSystem: true,
    sortOrder: 4
  },
  {
    id: 'all',
    name: 'All',
    type: 'smart',
    color: '#64748b',
    icon: 'Layers',
    filterRules: {
      dateRange: 'all',
      status: 'all'
    },
    isSystem: true,
    sortOrder: 5
  },
  {
    id: 'high_priority',
    name: 'High Priority',
    type: 'smart',
    color: '#ef4444',
    icon: 'AlertTriangle',
    filterRules: {
      priority: 'high_priority',
      status: 'pending_or_in_progress'
    },
    isSystem: true,
    sortOrder: 6
  },
  {
    id: 'list_work',
    name: 'Work & Academic',
    type: 'regular',
    color: '#3b82f6',
    icon: 'Briefcase',
    isSystem: false,
    sortOrder: 10
  },
  {
    id: 'list_personal',
    name: 'Personal',
    type: 'regular',
    color: '#f59e0b',
    icon: 'User',
    isSystem: false,
    sortOrder: 11
  }
];

export const DEFAULT_DUTY_PRESETS: DutyPreset[] = [
  {
    id: 'pst-1',
    title: 'Daily Morning Assembly & Gate Patrol Duty',
    desc: 'Supervise morning prayer, student dress code, and latecomers log at gate.',
    category: 'Assembly & Duty',
    priority: 'Do First (Urgent & Important)',
    estimatedMinutes: 45,
    subtasks: ['Setup courtyard mic', 'Log late entries in discipline book', 'Supervise march past'],
    recurringFrequency: 'Daily'
  },
  {
    id: 'pst-2',
    title: 'GeM Portal Procurement Voucher Verification & Stock Ledger Entry',
    desc: 'Verify CRAC bills, inspect vendor goods delivery, and update school stock register.',
    category: 'GeM Portal Admin',
    priority: 'Do First (Urgent & Important)',
    estimatedMinutes: 60,
    subtasks: ['Cross-check PO invoice', 'Inspect lab/sports items', 'Sign stock register', 'Upload digital CRAC'],
    recurringFrequency: 'Weekly'
  },
  {
    id: 'pst-3',
    title: 'Periodic Test Answer Sheet Evaluation & Online Marks Upload',
    desc: 'Evaluate 40+ answer scripts, calculate percentage, and upload to KVS/CBSE online portal.',
    category: 'Teacher Diary Docs',
    priority: 'Schedule (Important & Not Urgent)',
    estimatedMinutes: 120,
    subtasks: ['Grade Q1-Q20', 'Calculate total marks', 'Enter in e-Pravesh portal'],
    recurringFrequency: 'Monthly'
  },
  {
    id: 'pst-4',
    title: 'National Sports Meet Athletic Trial Drill',
    desc: 'Conduct sprint timing trials and log performance metrics for regional athletes.',
    category: 'Sports / RSM / NSM',
    priority: 'Do First (Urgent & Important)',
    estimatedMinutes: 90,
    subtasks: ['Prep track timers', 'Supervise sprint trials', 'Record timing metrics'],
    recurringFrequency: 'Daily'
  },
  {
    id: 'pst-5',
    title: 'Parade March Past & Safety Drill Rehearsal',
    desc: 'Train parade contingent in synchronized marching steps and safety maneuvers.',
    category: 'Parade & Pyramid',
    priority: 'Do First (Urgent & Important)',
    estimatedMinutes: 75,
    subtasks: ['Lay safety mats', 'Rehearse band rhythm steps', 'Check parade lineup'],
    recurringFrequency: 'Daily'
  }
];

// ============================================================================
// DEFAULT SEED DATA: FOUNDATIONAL & PREPARATORY STAGE (Balvatika to Class V)
// ============================================================================

/**
 * Module 13: Monitoring cum Remedial Reporting Record Seed Data
 */
export const DEFAULT_MONITORING_CUM_REPORTING: MonitoringCumReportingRecord[] = [
  {
    id: 'mcr-001',
    studentId: 'std-2a-03',
    classSectionId: 'cls-2a',
    subjectId: 'sbj-p02',
    tloNotAchieved: 'Two-digit addition with regrouping and place value comprehension',
    remedialStrategies: 'Concrete TLM manipulatives (base-10 blocks, Ganit Mala), peer-pair counting games, and 10-minute daily blackboard drills',
    progressStatus: 'Developing',
    updatedAt: '2026-08-10T09:30:00.000Z'
  },
  {
    id: 'mcr-002',
    studentId: 'std-1a-04',
    classSectionId: 'cls-1a',
    subjectId: 'sbj-p03',
    tloNotAchieved: 'Three-letter phonetic blends (CVC words: cat, pin, hop) and initial consonant digraphs',
    remedialStrategies: 'Jadui Pitara picture-word matching flashcards, phonics rhyme audio clips, and tactile sand-tray letter tracing',
    progressStatus: 'Developing',
    updatedAt: '2026-08-11T10:15:00.000Z'
  },
  {
    id: 'mcr-003',
    studentId: 'std-3a-02',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p04',
    tloNotAchieved: 'Hindi Matra identification (इ vs ई and उ vs ऊ) in sentence construction',
    remedialStrategies: 'Worksheet drills, colorful matra charts, and guided oral reading sessions with teacher reinforcement',
    progressStatus: 'Achieved',
    updatedAt: '2026-08-12T11:00:00.000Z'
  }
];

/**
 * Module 14(c): Record of Progress for Late Bloomers Seed Data
 */
export const DEFAULT_LATE_BLOOMER_PROGRESS: LateBloomerProgressRecord[] = [
  {
    id: 'lbp-001',
    studentId: 'std-2a-03',
    classSectionId: 'cls-2a',
    subjectId: 'sbj-p02',
    month: 'July',
    observationalNotes: 'Shows increased confidence in single-digit additions using fingers and beads. Began attempting 2-digit sums with teacher scaffolding.',
    testScoreProgress: 'Improved from 3/10 in baseline to 6/10 in weekly unit review.'
  },
  {
    id: 'lbp-002',
    studentId: 'std-1a-04',
    classSectionId: 'cls-1a',
    subjectId: 'sbj-p03',
    month: 'August',
    observationalNotes: 'Successfully decoded 8 out of 10 CVC words during story circle. Actively engages in phonics echo games.',
    testScoreProgress: 'Grade moved from C to B in Letter-Sound Association diagnostic.'
  },
  {
    id: 'lbp-003',
    studentId: 'std-4a-05',
    classSectionId: 'cls-4a',
    subjectId: 'sbj-p01',
    month: 'August',
    observationalNotes: 'Demonstrated better retention of plant parts and functions when assessed using real leaf specimens from Vidyalaya botanical garden.',
    testScoreProgress: 'Scored 14/20 in formative worksheet, showing positive upward trajectory from initial 8/20.'
  }
];

/**
 * Module 16: Gist of Minutes of NIPUN Meetings Seed Data
 */
export const DEFAULT_NIPUN_MEETINGS: NipunMeetingRecord[] = [
  {
    id: 'nip-001',
    date: '2026-07-15',
    agendaPoints: 'Review of FLN learning kit implementation (Jadui Pitara), Vidya Pravesh 3-month module rollout for Class 1, and baseline TARA oral reading app assessment.',
    gistOfDiscussion: 'HM emphasized daily 90-minute literacy & numeracy block transaction. Discussed utilization of Jadui Pitara activity cards and story cards for developing phonological awareness. Primary teachers shared initial class observation feedback.',
    actionPoints: [
      'Deploy Jadui Pitara toy-based learning kits in all Class 1 & 2 sections',
      'Complete TARA app baseline reading survey for Classes 1 to 3 by July 25th',
      'Prepare low-cost/no-cost TLM corner in every primary classroom'
    ],
    actionTaken: 'All Class 1 and 2 teachers received Jadui Pitara master kits and integrated 20 minutes daily play-based literacy games into timetable.'
  },
  {
    id: 'nip-002',
    date: '2026-08-08',
    agendaPoints: 'Mid-term progress review on FLN Lakshya benchmarks for Class 2 (reading with understanding 45-60 wpm) and Class 3 (reading 60 wpm & 3-digit subtraction).',
    gistOfDiscussion: 'Reviewed monthly diagnostic assessment reports. Identified 8 students requiring structured remedial support under NIPUN Lakshya. Decided to initiate peer-reading circles and take-home picture reading cards.',
    actionPoints: [
      'Organize 15-minute zero period remedial reading sessions for identified late bloomers',
      'Conduct orientation for parents on supporting home reading under NIPUN Bharat',
      'Update NIPUN tracking register with cycle-wise progress markers'
    ],
    actionTaken: 'Parent orientation conducted on PTM day; take-home Barkha reading series booklets distributed to targeted students.'
  }
];

/**
 * Module 21: Scholastic Assessment Record (Classes I & II) Seed Data
 */
export const DEFAULT_SCHOLASTIC_I_II: ScholasticRecordClass1_2[] = [
  {
    id: 'sch12-001',
    studentId: 'std-1a-01',
    classSectionId: 'cls-1a',
    subjectId: 'sbj-p03',
    cycleRatings: {
      1: { listening_understanding: 'A', speaking_fluency: 'A', reading_readiness: 'A', creative_expression: 'A', social_behavior: 'A' },
      2: { listening_understanding: 'A', speaking_fluency: 'A', reading_readiness: 'A', creative_expression: 'A', social_behavior: 'A' },
      3: { listening_understanding: 'A', speaking_fluency: 'A', reading_readiness: 'A', creative_expression: 'A', social_behavior: 'A' }
    }
  },
  {
    id: 'sch12-002',
    studentId: 'std-1a-04',
    classSectionId: 'cls-1a',
    subjectId: 'sbj-p03',
    cycleRatings: {
      1: { listening_understanding: 'B', speaking_fluency: 'B', reading_readiness: 'C', creative_expression: 'B', social_behavior: 'B' },
      2: { listening_understanding: 'B', speaking_fluency: 'B', reading_readiness: 'B', creative_expression: 'B', social_behavior: 'A' },
      3: { listening_understanding: 'A', speaking_fluency: 'B', reading_readiness: 'B', creative_expression: 'A', social_behavior: 'A' }
    }
  },
  {
    id: 'sch12-003',
    studentId: 'std-2a-01',
    classSectionId: 'cls-2a',
    subjectId: 'sbj-p02',
    cycleRatings: {
      1: { number_sense: 'A', basic_operations: 'A', shapes_spatial: 'A', mental_arithmetic: 'A', neatness: 'A' },
      2: { number_sense: 'A', basic_operations: 'A', shapes_spatial: 'A', mental_arithmetic: 'A', neatness: 'A' }
    }
  }
];

/**
 * Module 22(a) & 22(b): Notebook Correction Record (Classes III to V) Seed Data
 */
export const DEFAULT_NOTEBOOK_III_V: NotebookRecordClass3_5[] = [
  {
    id: 'nb-001',
    studentId: 'std-3a-01',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p02',
    term: 1,
    monthlyScores: {
      April: { regularity: 5, index: 5, neatness: 4, completion: 5, total: 19 },
      July: { regularity: 5, index: 5, neatness: 5, completion: 5, total: 20 },
      August: { regularity: 4, index: 5, neatness: 5, completion: 5, total: 19 },
      September: { regularity: 5, index: 5, neatness: 5, completion: 5, total: 20 }
    }
  },
  {
    id: 'nb-002',
    studentId: 'std-3a-02',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p02',
    term: 1,
    monthlyScores: {
      April: { regularity: 3, index: 3, neatness: 3, completion: 3, total: 12 },
      July: { regularity: 4, index: 4, neatness: 3, completion: 4, total: 15 },
      August: { regularity: 4, index: 4, neatness: 4, completion: 4, total: 16 },
      September: { regularity: 4, index: 5, neatness: 4, completion: 5, total: 18 }
    }
  },
  {
    id: 'nb-003',
    studentId: 'std-4a-01',
    classSectionId: 'cls-4a',
    subjectId: 'sbj-p01',
    term: 1,
    monthlyScores: {
      April: { regularity: 5, index: 5, neatness: 5, completion: 5, total: 20 },
      July: { regularity: 5, index: 5, neatness: 5, completion: 5, total: 20 },
      August: { regularity: 5, index: 5, neatness: 4, completion: 5, total: 19 },
      September: { regularity: 5, index: 5, neatness: 5, completion: 5, total: 20 }
    }
  }
];

/**
 * Module 23(a): List of Subject Enrichment Activities Planned (Term 1-2) Seed Data
 * Page 17 (4 pages)
 */
export const DEFAULT_SEA_PLANS_III_V: SeaPlanItem[] = [
  {
    id: 'seap-001',
    monthAndDate: 'April 2026 (W4)',
    activity: 'Oral Reading Fluency & Picture Story Dramatization',
    evaluationCriteria: 'R1: Content & Script Mastery (5), R2: Pronunciation & Fluency (5), R3: Voice Modulation & Expression (5), R4: Stage Confidence & Body Language (5) = Max 20',
    remarks: 'Focus on overcoming stage shyness; English & Hindi communication competencies.',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p03',
    term: 1
  },
  {
    id: 'seap-002',
    monthAndDate: 'July 2026 (W3)',
    activity: 'Math Lab Hands-On Origami & Geometric Tessellation Kit',
    evaluationCriteria: 'R1: Accuracy of Shapes & Edges (5), R2: Understanding of 2D/3D Properties (5), R3: Creative Pattern Design (5), R4: Viva & Explanation of Angles (5) = Max 20',
    remarks: 'Linked to Geometry & Spatial Understanding Chapter.',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p02',
    term: 1
  },
  {
    id: 'seap-003',
    monthAndDate: 'August 2026 (W2)',
    activity: 'EVS Herbarium Leaf Album & Flora Classification Project',
    evaluationCriteria: 'R1: Variety of Specimens Collected (5), R2: Correct Botanical/Common Labeling (5), R3: Album Layout & Cleanliness (5), R4: Viva on Plant Adaptation (5) = Max 20',
    remarks: 'Field walk inside school herbal garden, NCERT EVS Unit 3.',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p01',
    term: 1
  },
  {
    id: 'seap-004',
    monthAndDate: 'September 2026 (W1)',
    activity: 'Hindi Kavita Pathan & Shabda-Antyakshari Recitation',
    evaluationCriteria: 'R1: Laya aur Taal (Rhythm) (5), R2: Shuddh Uccharan (Pronunciation) (5), R3: Bhaav-Bhangima (Gestures) (5), R4: Atma-Vishwas (Confidence) (5) = Max 20',
    remarks: 'Part of Hindi Pakhwada celebrations.',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p04',
    term: 1
  },
  {
    id: 'seap-005',
    monthAndDate: 'October 2026 (W3)',
    activity: 'Science Working Model Exhibition: Clean Water & Filtration',
    evaluationCriteria: 'R1: Scientific Concept Clarity (5), R2: Working Model Execution (5), R3: Use of Recycled Eco-Materials (5), R4: Presentation & Peer Q&A (5) = Max 20',
    remarks: 'Term 2 Kickoff Science Fair project.',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p01',
    term: 2
  },
  {
    id: 'seap-006',
    monthAndDate: 'November 2026 (W2)',
    activity: 'Math Puzzles, Vedic Multiplication & Tangram Solving Speed Test',
    evaluationCriteria: 'R1: Speed & Accuracy (5), R2: Mental Calculation Strategy (5), R3: Puzzle Solution Ingenuity (5), R4: Notebook Journal Entry (5) = Max 20',
    remarks: 'National Mathematics Month preparation activity.',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p02',
    term: 2
  },
  {
    id: 'seap-007',
    monthAndDate: 'January 2027 (W3)',
    activity: 'English Roleplay: Community Helpers & Mock News Broadcast',
    evaluationCriteria: 'R1: Dialogue Delivery & Script (5), R2: Vocabulary & Grammar (5), R3: Costume & Prop Authenticity (5), R4: Audience Engagement (5) = Max 20',
    remarks: 'Inter-house language enrichment activity.',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p03',
    term: 2
  },
  {
    id: 'seap-008',
    monthAndDate: 'February 2027 (W2)',
    activity: 'Environmental Map Work & State Capitals Quiz Relay',
    evaluationCriteria: 'R1: Map Pointing Accuracy (5), R2: Knowledge of Geography & Culture (5), R3: Team Coordination (5), R4: Speed & Viva Response (5) = Max 20',
    remarks: 'Consolidation of EVS Year-End competencies.',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p01',
    term: 2
  }
];

/**
 * Module 23(a), (b), & (c): Subject Enrichment Activities (SEA - Classes III to V) Seed Data
 */
export const DEFAULT_SEA_III_V: SeaRecordClass3_5[] = [
  {
    id: 'sea-001',
    studentId: 'std-3a-01',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p03',
    term: 1,
    monthlyScores: {
      'April': { r1: 5, r2: 5, r3: 4, r4: 5, total: 19 },
      'July': { r1: 5, r2: 4, r3: 5, r4: 5, total: 19 },
      'August': { r1: 4, r2: 5, r3: 5, r4: 4, total: 18 },
      'September': { r1: 5, r2: 5, r3: 5, r4: 5, total: 20 }
    },
    activities: {
      activityName: 'Story Dramatization & Dialogue Delivery',
      scores: { r1: 5, r2: 5, r3: 4, r4: 5, total: 19 }
    }
  },
  {
    id: 'sea-002',
    studentId: 'std-3a-02',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p03',
    term: 1,
    monthlyScores: {
      'April': { r1: 4, r2: 3, r3: 4, r4: 4, total: 15 },
      'July': { r1: 4, r2: 4, r3: 3, r4: 4, total: 15 },
      'August': { r1: 3, r2: 4, r3: 4, r4: 4, total: 15 },
      'September': { r1: 4, r2: 4, r3: 4, r4: 4, total: 16 }
    },
    activities: {
      activityName: 'Story Dramatization & Dialogue Delivery',
      scores: { r1: 4, r2: 3, r3: 4, r4: 4, total: 15 }
    }
  },
  {
    id: 'sea-003',
    studentId: 'std-4a-01',
    classSectionId: 'cls-4a',
    subjectId: 'sbj-p01',
    term: 1,
    monthlyScores: {
      'April': { r1: 5, r2: 5, r3: 5, r4: 5, total: 20 },
      'July': { r1: 5, r2: 5, r3: 4, r4: 5, total: 19 },
      'August': { r1: 5, r2: 5, r3: 5, r4: 5, total: 20 },
      'September': { r1: 5, r2: 4, r3: 5, r4: 5, total: 19 }
    },
    activities: {
      activityName: 'EVS State Heritage & Map Quiz Exhibition',
      scores: { r1: 5, r2: 5, r3: 5, r4: 5, total: 20 }
    }
  }
];

/**
 * Module 25 & 26: Scholastic Assessment Record (Classes III to V) Seed Data
 */
export const DEFAULT_SCHOLASTIC_III_V: ScholasticRecordClass3_5[] = [
  {
    id: 'sch35-001',
    studentId: 'std-3a-01',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p02',
    term: 1,
    periodicTest: 9.5,
    notebook: 5.0,
    sea: 4.8,
    mdp: 9.5,
    termEndExam: 38.0,
    total: 66.8,
    percentage: 95.4,
    grade: 'A1'
  },
  {
    id: 'sch35-002',
    studentId: 'std-3a-02',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p02',
    term: 1,
    periodicTest: 7.0,
    notebook: 4.0,
    sea: 3.8,
    mdp: 8.0,
    termEndExam: 28.5,
    total: 51.3,
    percentage: 73.3,
    grade: 'B1'
  },
  {
    id: 'sch35-003',
    studentId: 'std-4a-01',
    classSectionId: 'cls-4a',
    subjectId: 'sbj-p01',
    term: 1,
    periodicTest: 9.0,
    notebook: 5.0,
    sea: 5.0,
    mdp: 9.0,
    termEndExam: 37.0,
    total: 65.0,
    percentage: 92.9,
    grade: 'A1'
  }
];

/**
 * Module 28: Oral Reading Fluency (ORF) TARA App Seed Data
 */
export const DEFAULT_ORF_TARA: OralReadingFluencyRecord[] = [
  {
    id: 'orf-001',
    studentId: 'std-2a-01',
    classSectionId: 'cls-2a',
    subjectId: 'sbj-p03',
    baselineWcpm: 48,
    midlineWcpm: 56,
    endlineWcpm: 64,
    rangeGroup: 'Above Base',
    remedialMeasures: 'Encouraged to read advanced picture chapter books and participate in English recitation.'
  },
  {
    id: 'orf-002',
    studentId: 'std-2a-03',
    classSectionId: 'cls-2a',
    subjectId: 'sbj-p03',
    baselineWcpm: 24,
    midlineWcpm: 34,
    endlineWcpm: 46,
    rangeGroup: 'Within Base',
    remedialMeasures: 'Daily paired reading with mentor buddy, 10-minute sight word flashcard drills using TARA reading app.'
  },
  {
    id: 'orf-003',
    studentId: 'std-3a-02',
    classSectionId: 'cls-3a',
    subjectId: 'sbj-p04',
    baselineWcpm: 32,
    midlineWcpm: 44,
    endlineWcpm: 58,
    rangeGroup: 'Within Base',
    remedialMeasures: 'Guided reading of Barkha series Hindi storybooks, pronunciation practice of conjunct consonants.'
  }
];

/**
 * Module 27: Result Analysis (Classes III to V) Seed Data
 * Page 23 (2 pages - Landscape format)
 */
export const DEFAULT_RESULT_ANALYSIS_III_V: ResultAnalysisClass3_5[] = [
  {
    id: 'ra-001',
    exam: 'Periodic Test 1 (PT-1)',
    subjectName: 'Mathematics',
    subjectId: 'sbj-p02',
    className: 'Class III-A',
    classSectionId: 'cls-3a',
    term: 1,
    studentsOnRoll: 40,
    totalOnRoll: 40,
    appeared: 40,
    totalAppeared: 40,
    qualified: 40,
    passed: 40,
    needsImprovement: 0,
    qualifiedPercentage: 100,
    passPercentage: 100,
    classAverage: 84.5,
    performanceIndex: 82.5,
    pi: 82.5,
    gradeCounts: {
      A1: 14,
      A2: 12,
      B1: 8,
      B2: 4,
      C1: 2,
      C2: 0,
      D: 0,
      E: 0
    },
    remarks: 'Strong foundation in single/double digit multiplication and shapes.'
  },
  {
    id: 'ra-002',
    exam: 'Periodic Test 1 (PT-1)',
    subjectName: 'English',
    subjectId: 'sbj-p03',
    className: 'Class III-A',
    classSectionId: 'cls-3a',
    term: 1,
    studentsOnRoll: 40,
    totalOnRoll: 40,
    appeared: 39,
    totalAppeared: 39,
    qualified: 39,
    passed: 39,
    needsImprovement: 0,
    qualifiedPercentage: 100,
    passPercentage: 100,
    classAverage: 81.2,
    performanceIndex: 78.8,
    pi: 78.8,
    gradeCounts: {
      A1: 12,
      A2: 11,
      B1: 9,
      B2: 5,
      C1: 2,
      C2: 0,
      D: 0,
      E: 0
    },
    remarks: '1 student on medical leave. Oral reading fluency good.'
  },
  {
    id: 'ra-003',
    exam: 'Periodic Test 1 (PT-1)',
    subjectName: 'Environmental Studies (EVS)',
    subjectId: 'sbj-p01',
    className: 'Class III-A',
    classSectionId: 'cls-3a',
    term: 1,
    studentsOnRoll: 40,
    totalOnRoll: 40,
    appeared: 40,
    totalAppeared: 40,
    qualified: 40,
    passed: 40,
    needsImprovement: 0,
    qualifiedPercentage: 100,
    passPercentage: 100,
    classAverage: 86.8,
    performanceIndex: 86.25,
    pi: 86.25,
    gradeCounts: {
      A1: 18,
      A2: 10,
      B1: 7,
      B2: 4,
      C1: 1,
      C2: 0,
      D: 0,
      E: 0
    },
    remarks: 'Excellent concept clarity in Plants and Animals units.'
  },
  {
    id: 'ra-004',
    exam: 'Periodic Test 1 (PT-1)',
    subjectName: 'Hindi',
    subjectId: 'sbj-p04',
    className: 'Class III-A',
    classSectionId: 'cls-3a',
    term: 1,
    studentsOnRoll: 40,
    totalOnRoll: 40,
    appeared: 40,
    totalAppeared: 40,
    qualified: 40,
    passed: 40,
    needsImprovement: 0,
    qualifiedPercentage: 100,
    passPercentage: 100,
    classAverage: 82.0,
    performanceIndex: 80.0,
    pi: 80.0,
    gradeCounts: {
      A1: 13,
      A2: 12,
      B1: 8,
      B2: 5,
      C1: 2,
      C2: 0,
      D: 0,
      E: 0
    },
    remarks: 'Matra accuracy improved after remedial spelling drills.'
  },
  {
    id: 'ra-005',
    exam: 'Term-1 / Half Yearly Exam',
    subjectName: 'Mathematics',
    subjectId: 'sbj-p02',
    className: 'Class III-A',
    classSectionId: 'cls-3a',
    term: 1,
    studentsOnRoll: 40,
    totalOnRoll: 40,
    appeared: 40,
    totalAppeared: 40,
    qualified: 40,
    passed: 40,
    needsImprovement: 0,
    qualifiedPercentage: 100,
    passPercentage: 100,
    classAverage: 85.6,
    performanceIndex: 84.4,
    pi: 84.4,
    gradeCounts: {
      A1: 16,
      A2: 12,
      B1: 7,
      B2: 4,
      C1: 1,
      C2: 0,
      D: 0,
      E: 0
    },
    remarks: 'Scholastic continuous assessment + SEE term aggregate.'
  },
  {
    id: 'ra-006',
    exam: 'Term-1 / Half Yearly Exam',
    subjectName: 'Environmental Studies (EVS)',
    subjectId: 'sbj-p01',
    className: 'Class IV-A',
    classSectionId: 'cls-4a',
    term: 1,
    studentsOnRoll: 38,
    totalOnRoll: 38,
    appeared: 38,
    totalAppeared: 38,
    qualified: 38,
    passed: 38,
    needsImprovement: 0,
    qualifiedPercentage: 100,
    passPercentage: 100,
    classAverage: 87.2,
    performanceIndex: 86.8,
    pi: 86.8,
    gradeCounts: {
      A1: 17,
      A2: 10,
      B1: 7,
      B2: 3,
      C1: 1,
      C2: 0,
      D: 0,
      E: 0
    },
    remarks: 'High achievement in environmental experiments & map work.'
  },
  {
    id: 'ra-007',
    exam: 'Periodic Test 2 (PT-2)',
    subjectName: 'Mathematics',
    subjectId: 'sbj-p02',
    className: 'Class V-A',
    classSectionId: 'cls-5a',
    term: 2,
    studentsOnRoll: 42,
    totalOnRoll: 42,
    appeared: 42,
    totalAppeared: 42,
    qualified: 41,
    passed: 41,
    needsImprovement: 1,
    qualifiedPercentage: 97.6,
    passPercentage: 97.6,
    classAverage: 79.4,
    performanceIndex: 76.2,
    pi: 76.2,
    gradeCounts: {
      A1: 12,
      A2: 13,
      B1: 8,
      B2: 5,
      C1: 2,
      C2: 1,
      D: 0,
      E: 1
    },
    remarks: 'Remedial coaching scheduled for fractions and decimal conversion.'
  },
  {
    id: 'ra-008',
    exam: 'Term-2 / Session Ending Exam',
    subjectName: 'English',
    subjectId: 'sbj-p03',
    className: 'Class V-A',
    classSectionId: 'cls-5a',
    term: 2,
    studentsOnRoll: 42,
    totalOnRoll: 42,
    appeared: 42,
    totalAppeared: 42,
    qualified: 42,
    passed: 42,
    needsImprovement: 0,
    qualifiedPercentage: 100,
    passPercentage: 100,
    classAverage: 83.8,
    performanceIndex: 82.1,
    pi: 82.1,
    gradeCounts: {
      A1: 15,
      A2: 13,
      B1: 8,
      B2: 4,
      C1: 2,
      C2: 0,
      D: 0,
      E: 0
    },
    remarks: '100% qualified; outstanding creative writing and speech performance.'
  }
];

/**
 * Module 18(a): Result Analysis (Classes VI to X) Seed Data
 * Page 31 (Landscape format)
 * 18(a) विषयानुसार परिणाम विश्लेषण (कक्षाएँ-6-10)
 * SUBJECT WISE RESULT ANALYSIS (FOR CLASSES- VI TO X)
 */
export const DEFAULT_RESULT_ANALYSIS_VI_X: ResultAnalysisClass6_10[] = [
  {
    id: 'ra-vix-001',
    pageNo: 1,
    exam: 'UT',
    subjectName: 'Mathematics',
    subjectId: 'sbj-02',
    className: 'Class VI-A',
    classSectionId: 'cls-6a',
    studentsOnRoll: 42,
    totalOnRoll: 42,
    appeared: 42,
    totalAppeared: 42,
    qualified: 40,
    passed: 40,
    needsImprovement: 2,
    passPercentage: 95.2,
    range33to45: 4,
    range45to60: 8,
    range60to75: 12,
    range75to90: 10,
    range90Above: 6,
    classAverage: 71.4,
    performanceIndex: 72.8,
    pi: 72.8,
    highestScore: 98,
    lowestScore: 24,
    remarks: 'Strong performance in Number Systems and Whole Numbers.'
  },
  {
    id: 'ra-vix-002',
    pageNo: 1,
    exam: 'UT',
    subjectName: 'Science',
    subjectId: 'sbj-03',
    className: 'Class VI-A',
    classSectionId: 'cls-6a',
    studentsOnRoll: 42,
    totalOnRoll: 42,
    appeared: 41,
    totalAppeared: 41,
    qualified: 40,
    passed: 40,
    needsImprovement: 1,
    passPercentage: 97.6,
    range33to45: 3,
    range45to60: 7,
    range60to75: 14,
    range75to90: 11,
    range90Above: 5,
    classAverage: 73.2,
    performanceIndex: 74.5,
    pi: 74.5,
    highestScore: 96,
    lowestScore: 28,
    remarks: 'Good understanding of Components of Food & Sorting Materials.'
  },
  {
    id: 'ra-vix-003',
    pageNo: 1,
    exam: 'MT',
    subjectName: 'English',
    subjectId: 'sbj-01',
    className: 'Class VII-A',
    classSectionId: 'cls-7a',
    studentsOnRoll: 40,
    totalOnRoll: 40,
    appeared: 40,
    totalAppeared: 40,
    qualified: 39,
    passed: 39,
    needsImprovement: 1,
    passPercentage: 97.5,
    range33to45: 5,
    range45to60: 9,
    range60to75: 12,
    range75to90: 9,
    range90Above: 4,
    classAverage: 69.8,
    performanceIndex: 70.2,
    pi: 70.2,
    highestScore: 94,
    lowestScore: 30,
    remarks: 'Grammar and reading comprehension skills evaluated.'
  },
  {
    id: 'ra-vix-004',
    pageNo: 1,
    exam: 'MT',
    subjectName: 'Social Science',
    subjectId: 'sbj-04',
    className: 'Class VII-A',
    classSectionId: 'cls-7a',
    studentsOnRoll: 40,
    totalOnRoll: 40,
    appeared: 39,
    totalAppeared: 39,
    qualified: 38,
    passed: 38,
    needsImprovement: 1,
    passPercentage: 97.4,
    range33to45: 4,
    range45to60: 8,
    range60to75: 13,
    range75to90: 8,
    range90Above: 5,
    classAverage: 71.0,
    performanceIndex: 71.8,
    pi: 71.8,
    highestScore: 95,
    lowestScore: 31,
    remarks: 'Map skills and medieval history concepts tested.'
  },
  {
    id: 'ra-vix-005',
    pageNo: 2,
    exam: 'HY',
    subjectName: 'Mathematics',
    subjectId: 'sbj-02',
    className: 'Class VIII-A',
    classSectionId: 'cls-8a',
    studentsOnRoll: 45,
    totalOnRoll: 45,
    appeared: 44,
    totalAppeared: 44,
    qualified: 42,
    passed: 42,
    needsImprovement: 2,
    passPercentage: 95.5,
    range33to45: 6,
    range45to60: 10,
    range60to75: 13,
    range75to90: 8,
    range90Above: 5,
    classAverage: 68.5,
    performanceIndex: 69.0,
    pi: 69.0,
    highestScore: 99,
    lowestScore: 22,
    remarks: 'Term 1 comprehensive evaluation. Remedials conducted for algebra.'
  },
  {
    id: 'ra-vix-006',
    pageNo: 2,
    exam: 'HY',
    subjectName: 'Science',
    subjectId: 'sbj-03',
    className: 'Class VIII-A',
    classSectionId: 'cls-8a',
    studentsOnRoll: 45,
    totalOnRoll: 45,
    appeared: 45,
    totalAppeared: 45,
    qualified: 44,
    passed: 44,
    needsImprovement: 1,
    passPercentage: 97.8,
    range33to45: 5,
    range45to60: 11,
    range60to75: 14,
    range75to90: 9,
    range90Above: 5,
    classAverage: 70.8,
    performanceIndex: 71.5,
    pi: 71.5,
    highestScore: 97,
    lowestScore: 26,
    remarks: 'Physics light and reproduction in plants concepts strong.'
  },
  {
    id: 'ra-vix-007',
    pageNo: 2,
    exam: 'HY',
    subjectName: 'Hindi',
    subjectId: 'sbj-05',
    className: 'Class IX-A',
    classSectionId: 'cls-9a',
    studentsOnRoll: 44,
    totalOnRoll: 44,
    appeared: 44,
    totalAppeared: 44,
    qualified: 43,
    passed: 43,
    needsImprovement: 1,
    passPercentage: 97.7,
    range33to45: 4,
    range45to60: 9,
    range60to75: 15,
    range75to90: 10,
    range90Above: 5,
    classAverage: 72.4,
    performanceIndex: 73.6,
    pi: 73.6,
    highestScore: 96,
    lowestScore: 30,
    remarks: 'Hindi Sparsh & Sanchayan chapters covered in Half Yearly.'
  },
  {
    id: 'ra-vix-008',
    pageNo: 3,
    exam: 'PB',
    subjectName: 'Mathematics',
    subjectId: 'sbj-02',
    className: 'Class X-A',
    classSectionId: 'cls-10a',
    studentsOnRoll: 42,
    totalOnRoll: 42,
    appeared: 42,
    totalAppeared: 42,
    qualified: 40,
    passed: 40,
    needsImprovement: 2,
    passPercentage: 95.2,
    range33to45: 5,
    range45to60: 9,
    range60to75: 12,
    range75to90: 8,
    range90Above: 6,
    classAverage: 70.2,
    performanceIndex: 71.0,
    pi: 71.0,
    highestScore: 100,
    lowestScore: 20,
    remarks: 'Pre-Board 1 examination aligned with CBSE board pattern.'
  },
  {
    id: 'ra-vix-009',
    pageNo: 3,
    exam: 'PB',
    subjectName: 'Science',
    subjectId: 'sbj-03',
    className: 'Class X-A',
    classSectionId: 'cls-10a',
    studentsOnRoll: 42,
    totalOnRoll: 42,
    appeared: 41,
    totalAppeared: 41,
    qualified: 40,
    passed: 40,
    needsImprovement: 1,
    passPercentage: 97.6,
    range33to45: 4,
    range45to60: 8,
    range60to75: 14,
    range75to90: 9,
    range90Above: 5,
    classAverage: 72.0,
    performanceIndex: 73.0,
    pi: 73.0,
    highestScore: 98,
    lowestScore: 28,
    remarks: 'Competency based questions and case-study analysis done.'
  },
  {
    id: 'ra-vix-010',
    pageNo: 4,
    exam: 'SEE',
    subjectName: 'Mathematics',
    subjectId: 'sbj-02',
    className: 'Class IX-A',
    classSectionId: 'cls-9a',
    studentsOnRoll: 44,
    totalOnRoll: 44,
    appeared: 44,
    totalAppeared: 44,
    qualified: 43,
    passed: 43,
    needsImprovement: 1,
    passPercentage: 97.7,
    range33to45: 4,
    range45to60: 9,
    range60to75: 14,
    range75to90: 10,
    range90Above: 6,
    classAverage: 73.5,
    performanceIndex: 74.8,
    pi: 74.8,
    highestScore: 99,
    lowestScore: 31,
    remarks: 'Annual Session Ending Exam consolidated final result.'
  },
  {
    id: 'ra-vix-011',
    pageNo: 4,
    exam: 'SEE',
    subjectName: 'Science',
    subjectId: 'sbj-03',
    className: 'Class IX-A',
    classSectionId: 'cls-9a',
    studentsOnRoll: 44,
    totalOnRoll: 44,
    appeared: 44,
    totalAppeared: 44,
    qualified: 44,
    passed: 44,
    needsImprovement: 0,
    passPercentage: 100.0,
    range33to45: 3,
    range45to60: 8,
    range60to75: 15,
    range75to90: 11,
    range90Above: 7,
    classAverage: 75.8,
    performanceIndex: 77.2,
    pi: 77.2,
    highestScore: 98,
    lowestScore: 36,
    remarks: '100% pass achieved with high marks in practical skills.'
  },
  {
    id: 'ra-vix-012',
    pageNo: 4,
    exam: 'SEE',
    subjectName: 'Sanskrit',
    subjectId: 'sbj-06',
    className: 'Class VIII-A',
    classSectionId: 'cls-8a',
    studentsOnRoll: 45,
    totalOnRoll: 45,
    appeared: 45,
    totalAppeared: 45,
    qualified: 45,
    passed: 45,
    needsImprovement: 0,
    passPercentage: 100.0,
    range33to45: 2,
    range45to60: 7,
    range60to75: 16,
    range75to90: 12,
    range90Above: 8,
    classAverage: 78.4,
    performanceIndex: 80.5,
    pi: 80.5,
    highestScore: 100,
    lowestScore: 40,
    remarks: 'Excellent grammatical accuracy and shloka recitation.'
  }
];

/**
 * Module 18(b): Result Analysis (Classes XI & XII) Seed Data
 * Page 32 (Landscape format)
 * 18(b) विषयानुसार परिणाम विश्लेषण (कक्षाएँ-11 & 12)
 * SUBJECT WISE RESULT ANALYSIS (FOR CLASSES XI & XII)
 */
export const DEFAULT_RESULT_ANALYSIS_XI_XII: ResultAnalysisClass11_12[] = [
  {
    id: 'ra-xixii-001',
    pageNo: 1,
    exam: 'UT',
    subjectName: 'Physics (042)',
    subjectId: 'sbj-11',
    className: 'Class XI-A',
    classSectionId: 'cls-11a',
    studentsOnRoll: 38,
    totalOnRoll: 38,
    appeared: 38,
    totalAppeared: 38,
    passed: 36,
    qualified: 36,
    failed: 2,
    passPercentage: 94.7,
    range33to45: 5,
    range45to60: 9,
    range60to75: 11,
    range75to90: 7,
    range90Above: 4,
    classAverage: 67.4,
    performanceIndex: 68.2,
    pi: 68.2,
    highestScore: 96,
    lowestScore: 20,
    remarks: 'Kinematics & Units and Measurements unit test completed.'
  },
  {
    id: 'ra-xixii-002',
    pageNo: 1,
    exam: 'UT',
    subjectName: 'Chemistry (043)',
    subjectId: 'sbj-12',
    className: 'Class XI-A',
    classSectionId: 'cls-11a',
    studentsOnRoll: 38,
    totalOnRoll: 38,
    appeared: 38,
    totalAppeared: 38,
    passed: 37,
    qualified: 37,
    failed: 1,
    passPercentage: 97.4,
    range33to45: 4,
    range45to60: 8,
    range60to75: 13,
    range75to90: 8,
    range90Above: 4,
    classAverage: 69.8,
    performanceIndex: 70.5,
    pi: 70.5,
    highestScore: 95,
    lowestScore: 28,
    remarks: 'Basic Concepts & Structure of Atom tested.'
  },
  {
    id: 'ra-xixii-003',
    pageNo: 1,
    exam: 'MT',
    subjectName: 'Mathematics (041)',
    subjectId: 'sbj-02',
    className: 'Class XI-A',
    classSectionId: 'cls-11a',
    studentsOnRoll: 38,
    totalOnRoll: 38,
    appeared: 37,
    totalAppeared: 37,
    passed: 35,
    qualified: 35,
    failed: 2,
    passPercentage: 94.6,
    range33to45: 4,
    range45to60: 7,
    range60to75: 12,
    range75to90: 7,
    range90Above: 5,
    classAverage: 68.9,
    performanceIndex: 70.0,
    pi: 70.0,
    highestScore: 99,
    lowestScore: 22,
    remarks: 'Sets, Relations and Trigonometric Functions evaluation.'
  },
  {
    id: 'ra-xixii-004',
    pageNo: 1,
    exam: 'HY',
    subjectName: 'Physics (042)',
    subjectId: 'sbj-11',
    className: 'Class XI-A',
    classSectionId: 'cls-11a',
    studentsOnRoll: 38,
    totalOnRoll: 38,
    appeared: 38,
    totalAppeared: 38,
    passed: 36,
    qualified: 36,
    failed: 2,
    passPercentage: 94.7,
    range33to45: 5,
    range45to60: 9,
    range60to75: 12,
    range75to90: 6,
    range90Above: 4,
    classAverage: 66.5,
    performanceIndex: 67.4,
    pi: 67.4,
    highestScore: 97,
    lowestScore: 24,
    remarks: 'Half yearly theory (70M) and practicals (30M) conducted.'
  },
  {
    id: 'ra-xixii-005',
    pageNo: 1,
    exam: 'SEE',
    subjectName: 'Biology (044)',
    subjectId: 'sbj-13',
    className: 'Class XI-B',
    classSectionId: 'cls-11b',
    studentsOnRoll: 35,
    totalOnRoll: 35,
    appeared: 35,
    totalAppeared: 35,
    passed: 35,
    qualified: 35,
    failed: 0,
    passPercentage: 100.0,
    range33to45: 3,
    range45to60: 7,
    range60to75: 13,
    range75to90: 8,
    range90Above: 4,
    classAverage: 71.2,
    performanceIndex: 72.8,
    pi: 72.8,
    highestScore: 98,
    lowestScore: 36,
    remarks: 'Annual Session Ending Examination result; 100% pass rate.'
  },
  {
    id: 'ra-xixii-006',
    pageNo: 2,
    exam: 'UT',
    subjectName: 'Physics (042)',
    subjectId: 'sbj-11',
    className: 'Class XII-A',
    classSectionId: 'cls-12a',
    studentsOnRoll: 40,
    totalOnRoll: 40,
    appeared: 40,
    totalAppeared: 40,
    passed: 39,
    qualified: 39,
    failed: 1,
    passPercentage: 97.5,
    range33to45: 4,
    range45to60: 8,
    range60to75: 14,
    range75to90: 8,
    range90Above: 5,
    classAverage: 70.1,
    performanceIndex: 71.2,
    pi: 71.2,
    highestScore: 98,
    lowestScore: 28,
    remarks: 'Electrostatics & Current Electricity unit test.'
  },
  {
    id: 'ra-xixii-007',
    pageNo: 2,
    exam: 'HY',
    subjectName: 'Chemistry (043)',
    subjectId: 'sbj-12',
    className: 'Class XII-A',
    classSectionId: 'cls-12a',
    studentsOnRoll: 40,
    totalOnRoll: 40,
    appeared: 40,
    totalAppeared: 40,
    passed: 39,
    qualified: 39,
    failed: 1,
    passPercentage: 97.5,
    range33to45: 4,
    range45to60: 8,
    range60to75: 13,
    range75to90: 9,
    range90Above: 5,
    classAverage: 71.4,
    performanceIndex: 72.5,
    pi: 72.5,
    highestScore: 97,
    lowestScore: 30,
    remarks: 'Term 1 syllabus comprehensive assessment.'
  },
  {
    id: 'ra-xixii-008',
    pageNo: 2,
    exam: 'PB',
    subjectName: 'Mathematics (041)',
    subjectId: 'sbj-02',
    className: 'Class XII-A',
    classSectionId: 'cls-12a',
    studentsOnRoll: 40,
    totalOnRoll: 40,
    appeared: 40,
    totalAppeared: 40,
    passed: 38,
    qualified: 38,
    failed: 2,
    passPercentage: 95.0,
    range33to45: 4,
    range45to60: 9,
    range60to75: 12,
    range75to90: 8,
    range90Above: 5,
    classAverage: 69.5,
    performanceIndex: 70.4,
    pi: 70.4,
    highestScore: 100,
    lowestScore: 24,
    remarks: 'Pre-Board 1 examination aligned with CBSE AISSCE Board pattern.'
  },
  {
    id: 'ra-xixii-009',
    pageNo: 2,
    exam: 'PB',
    subjectName: 'Computer Science (083)',
    subjectId: 'sbj-14',
    className: 'Class XII-A',
    classSectionId: 'cls-12a',
    studentsOnRoll: 40,
    totalOnRoll: 40,
    appeared: 40,
    totalAppeared: 40,
    passed: 40,
    qualified: 40,
    failed: 0,
    passPercentage: 100.0,
    range33to45: 2,
    range45to60: 6,
    range60to75: 14,
    range75to90: 11,
    range90Above: 7,
    classAverage: 76.5,
    performanceIndex: 78.2,
    pi: 78.2,
    highestScore: 99,
    lowestScore: 40,
    remarks: 'Python programming, SQL, and computer networks assessed.'
  },
  {
    id: 'ra-xixii-010',
    pageNo: 2,
    exam: 'SEE',
    subjectName: 'English Core (301)',
    subjectId: 'sbj-01',
    className: 'Class XII-A',
    classSectionId: 'cls-12a',
    studentsOnRoll: 40,
    totalOnRoll: 40,
    appeared: 40,
    totalAppeared: 40,
    passed: 40,
    qualified: 40,
    failed: 0,
    passPercentage: 100.0,
    range33to45: 2,
    range45to60: 7,
    range60to75: 15,
    range75to90: 10,
    range90Above: 6,
    classAverage: 74.8,
    performanceIndex: 76.0,
    pi: 76.0,
    highestScore: 96,
    lowestScore: 38,
    remarks: 'ASL and literature/writing sections completed.'
  }
];

/**
 * Module 19: Teacher's Observation on Students' Behaviour/Abilities (Page 33)
 * 19. विद्यार्थियों की क्षमता एवं उनके व्यवहार पर शिक्षक की टिप्पणी
 * Teacher's Observation on Students' Behaviour/Abilities (Discipline, Leadership quality etc.)
 */
export const DEFAULT_STUDENT_BEHAVIOUR_OBSERVATIONS: StudentBehaviourObservationRecord[] = [
  {
    id: 'obs-001',
    studentId: 'std-10a-01',
    studentName: 'Aarav Sharma',
    className: 'Class X-A',
    section: 'A',
    dateAndPlace: '2026-08-12 • Morning Assembly Ground',
    date: '2026-08-12',
    place: 'Morning Assembly Ground',
    category: 'Leadership quality',
    objectiveDescription: 'Led the Shivaji House morning assembly march past with impeccable command, coordinated pledge recitation, and ensured orderly line discipline across junior classes.',
    commentsByObserver: 'Exemplary leadership qualities, clear vocal command, and high sense of responsibility. Recommended for Junior Head Boy nomination.',
    observerName: 'S. K. Sharma',
    observerDesignation: 'PGT Mathematics / Class Teacher X-A',
    templatePageRef: 33
  },
  {
    id: 'obs-002',
    studentId: 'std-10a-02',
    studentName: 'Ananya Verma',
    className: 'Class X-A',
    section: 'A',
    dateAndPlace: '2026-08-14 • Mathematics Laboratory',
    date: '2026-08-14',
    place: 'Mathematics Laboratory',
    category: 'Teamwork',
    objectiveDescription: 'Actively assisted struggling peers during the Tangent Circle Theorem geometry modeling session, explaining proofs patiently and maintaining collaborative team spirit.',
    commentsByObserver: 'Displays high academic empathy, patience, and peer-mentoring aptitude. Commendable peer leader in collaborative group assignments.',
    observerName: 'S. K. Sharma',
    observerDesignation: 'PGT Mathematics',
    templatePageRef: 33
  },
  {
    id: 'obs-003',
    studentId: 'std-09a-01',
    studentName: 'Rohan Patel',
    className: 'Class IX-A',
    section: 'A',
    dateAndPlace: '2026-08-08 • School Corridor & Canteen',
    date: '2026-08-08',
    place: 'School Corridor & Canteen',
    category: 'Academic Integrity',
    objectiveDescription: 'Found a lost wristwatch near the science lab corridor during lunch recess and promptly submitted it to the Vice Principal office without hesitation.',
    commentsByObserver: 'High level of moral integrity, honesty, and civic responsibility. Publicly appreciated during the morning assembly.',
    observerName: 'P. K. Mishra',
    observerDesignation: 'TGT Science / Discipline Committee Incharge',
    templatePageRef: 33
  },
  {
    id: 'obs-004',
    studentId: 'std-08a-01',
    studentName: 'Sneha Kulkarni',
    className: 'Class VIII-A',
    section: 'A',
    dateAndPlace: '2026-08-05 • Science Lab',
    date: '2026-08-05',
    place: 'Science Lab',
    category: 'Discipline',
    objectiveDescription: 'Observed strict laboratory safety protocols during chemical titration, wore protective goggles, and guided classmates on chemical disposal compliance.',
    commentsByObserver: 'Meticulous attention to safety, rules, and laboratory cleanliness. Role model for laboratory discipline.',
    observerName: 'R. K. Jena',
    observerDesignation: 'TGT Science',
    templatePageRef: 33
  },
  {
    id: 'obs-005',
    studentId: 'std-11a-01',
    studentName: 'Aditya Sen',
    className: 'Class XI-A',
    section: 'A',
    dateAndPlace: '2026-08-02 • Physics Lab & Project Room',
    date: '2026-08-02',
    place: 'Physics Lab & Project Room',
    category: 'Initiative & Responsibility',
    objectiveDescription: 'Volunteered to calibrate the optical benches and potentiometer apparatus after class hours to ensure smooth experiment setups for practicals.',
    commentsByObserver: 'Demonstrates deep scientific curiosity, proactive initiative, and readiness to undertake voluntary technical duties.',
    observerName: 'Dr. M. K. Rao',
    observerDesignation: 'PGT Physics',
    templatePageRef: 33
  },
  {
    id: 'obs-006',
    studentId: 'std-12a-01',
    studentName: 'Pooja Raut',
    className: 'Class XII-A',
    section: 'A',
    dateAndPlace: '2026-07-28 • Inter-House Sports Arena',
    date: '2026-07-28',
    place: 'Inter-House Sports Arena',
    category: 'Extracurricular Participation',
    objectiveDescription: 'Captained the Ashoka House badminton team to the regional finals, exhibiting exceptional sportsmanship and motivating junior players after a close defeat.',
    commentsByObserver: 'True sportsmanship, grace under competitive pressure, and inspiring team motivator. Recommended for Annual Sports Award.',
    observerName: 'V. S. Chauhan',
    observerDesignation: 'TGT P&HE / Sports Coach',
    templatePageRef: 33
  },
  {
    id: 'obs-007',
    studentId: 'std-07a-01',
    studentName: 'Rahul Nayak',
    className: 'Class VII-A',
    section: 'A',
    dateAndPlace: '2026-07-20 • Classroom 7-A',
    date: '2026-07-20',
    place: 'Classroom 7-A',
    category: 'Punctuality',
    objectiveDescription: 'Consistent 100% on-time attendance, zero unexcused morning assembly delays, and daily prompt submission of homework notebooks.',
    commentsByObserver: 'Remarkable regularity, disciplined daily habit, and punctual academic submissions.',
    observerName: 'Meenakshi Sundaram',
    observerDesignation: 'TGT English / Class Teacher VII-A',
    templatePageRef: 33
  },
  {
    id: 'obs-008',
    studentId: 'std-06a-01',
    studentName: 'Priya Mahapatra',
    className: 'Class VI-A',
    section: 'A',
    dateAndPlace: '2026-07-15 • School Eco-Club Garden',
    date: '2026-07-15',
    place: 'School Eco-Club Garden',
    category: 'Empathy & Helpfulness',
    objectiveDescription: 'Initiated daily watering and maintenance of school herbal garden saplings; helped a physically challenged classmate carry textbooks to the second floor.',
    commentsByObserver: 'Kind-hearted, compassionate towards environment and peers. A standout example of empathy and social responsibility.',
    observerName: 'A. K. Panda',
    observerDesignation: 'TGT Social Science / Eco-Club Incharge',
    templatePageRef: 33
  }
];

/**
 * Module 20(a): विशेष उपचारात्मक सहायता की आवश्यकता वाले विद्यार्थियों की सूची एवं सुधार हेतु आवश्यक योजना
 * List of Students Requiring Special Remedial Assistance and measures planned to improve their Performance (4 Pages, Page 34)
 */
export const DEFAULT_REMEDIAL_ASSISTANCE_20A: RemedialAssistanceRecord20a[] = [
  {
    id: 'rem-20a-001',
    sNo: 1,
    studentId: 'std-10a-04',
    studentName: 'Vikramaditya Roy',
    rollNo: 4,
    className: 'Class X-A',
    section: 'A',
    subjectName: 'Mathematics (041)',
    pageNumber: 1,
    areaOfWeakness: 'Formulation of quadratic equations from word problems, factorization of irrational roots, and confusion in discriminants (D < 0 vs D >= 0).',
    weaknessAttachments: [
      {
        id: 'att-diag-001',
        type: 'photo',
        title: 'Diagnostic Test Error Analysis (Q5 & Q8)',
        fileName: 'vikram_math_diagnostic_errors.jpg',
        fileSize: '1.2 MB',
        uploadedAt: '2026-08-04'
      },
      {
        id: 'att-diag-002',
        type: 'pdf',
        title: 'Diagnostic Evaluation Sheet.pdf',
        fileName: 'Diagnostic_Test_Report_Math_10A.pdf',
        fileSize: '450 KB',
        uploadedAt: '2026-08-04'
      }
    ],
    measuresPlanned: '1. Step-by-step discriminant formula cue cards\n2. Daily 15-minute zero-period peer tutoring with Aarav Sharma\n3. Graded 5-question daily drill worksheet on algebraic factorisation\n4. Bi-weekly re-testing on Saturday zero period.',
    measuresAttachments: [
      {
        id: 'att-meas-001',
        type: 'pdf',
        title: 'Graded Quadratic Practice Worksheet Pack.pdf',
        fileName: 'Quadratic_Equations_Remedial_Level1.pdf',
        fileSize: '680 KB',
        uploadedAt: '2026-08-06'
      }
    ],
    diagnosticScore: 9,
    targetDate: '2026-08-30',
    status: 'In Remediation',
    remarks: 'Student showing positive enthusiasm during peer tutoring sessions.',
    templatePageRef: 34
  },
  {
    id: 'att-20a-002',
    sNo: 2,
    studentId: 'std-10a-07',
    studentName: 'Kavya S. Nair',
    rollNo: 7,
    className: 'Class X-A',
    section: 'A',
    subjectName: 'Mathematics (041)',
    pageNumber: 1,
    areaOfWeakness: 'Trigonometric identities proof steps, applying LHS = RHS transformations involving cosec²θ and cot²θ.',
    weaknessAttachments: [
      {
        id: 'att-diag-003',
        type: 'photo',
        title: 'Trigonometry Slip Test Sheet',
        fileName: 'kavya_trig_errors.png',
        fileSize: '890 KB',
        uploadedAt: '2026-08-08'
      }
    ],
    measuresPlanned: '1. Trigonometric identity tree diagram summary sheet\n2. Group practice solving 3 standard Board proof templates daily\n3. Individual whiteboard solving drills during remedial slot.',
    measuresAttachments: [
      {
        id: 'att-meas-002',
        type: 'photo',
        title: 'Handwritten Identity Summary Mindmap',
        fileName: 'trig_identity_cheatsheet.jpg',
        fileSize: '1.1 MB',
        uploadedAt: '2026-08-10'
      }
    ],
    diagnosticScore: 11,
    targetDate: '2026-08-28',
    status: 'In Remediation',
    remarks: 'Memorised basic identities; working on LHS multi-step expansions.',
    templatePageRef: 34
  },
  {
    id: 'att-20a-003',
    sNo: 3,
    studentId: 'std-10a-11',
    studentName: 'Mohd. Zeeshan',
    rollNo: 11,
    className: 'Class X-A',
    section: 'A',
    subjectName: 'Science (086)',
    pageNumber: 1,
    areaOfWeakness: 'Balancing complex chemical redox reactions, identifying oxidising/reducing agents in displacement reactions.',
    weaknessAttachments: [
      {
        id: 'att-diag-004',
        type: 'pdf',
        title: 'Chemistry UT-1 Reaction Balance Sheet',
        fileName: 'zeeshan_science_ut1.pdf',
        fileSize: '320 KB',
        uploadedAt: '2026-08-05'
      }
    ],
    measuresPlanned: '1. Atom count grid tabular method training\n2. Interactive PhET simulation for balancing chemical equations\n3. Simplified 10-equation remedial assignment.',
    measuresAttachments: [
      {
        id: 'att-meas-003',
        type: 'video',
        title: 'PhET Chemical Balancing Demo Clip',
        fileName: 'phet_redox_demo.mp4',
        fileSize: '4.5 MB',
        uploadedAt: '2026-08-09'
      }
    ],
    diagnosticScore: 10,
    targetDate: '2026-08-25',
    status: 'In Remediation',
    remarks: 'Understands combination reactions; needs more drill on displacement.',
    templatePageRef: 34
  },
  {
    id: 'att-20a-004',
    sNo: 4,
    studentId: 'std-09a-05',
    studentName: 'Harshit Gupta',
    rollNo: 5,
    className: 'Class IX-A',
    section: 'A',
    subjectName: 'Mathematics (041)',
    pageNumber: 2,
    areaOfWeakness: 'Number systems: Rationalising denominators with binomial surds (e.g., 1 / (√3 + √2)) and Laws of Exponents with fractional powers.',
    weaknessAttachments: [
      {
        id: 'att-diag-005',
        type: 'photo',
        title: 'Classwork Notebook Error Scan',
        fileName: 'harshit_surds_mistakes.jpg',
        fileSize: '950 KB',
        uploadedAt: '2026-08-02'
      }
    ],
    measuresPlanned: '1. Conjugate radical multiplication algorithm practice\n2. Daily 4-problem homework checklist with teacher sign-off\n3. Peer mentor assigned for period 4 practice sessions.',
    measuresAttachments: [
      {
        id: 'att-meas-004',
        type: 'pdf',
        title: 'Surds and Radicals Step-by-Step Guide.pdf',
        fileName: 'Surds_Radicals_Remedial.pdf',
        fileSize: '510 KB',
        uploadedAt: '2026-08-04'
      }
    ],
    diagnosticScore: 8,
    targetDate: '2026-08-22',
    status: 'Remediated & Re-evaluated',
    remarks: 'Scored 24/30 in follow-up re-test. Remarkable progress.',
    templatePageRef: 34
  },
  {
    id: 'att-20a-005',
    sNo: 5,
    studentId: 'std-11a-08',
    studentName: 'Nisha Agarwal',
    rollNo: 8,
    className: 'Class XI-A',
    section: 'A',
    subjectName: 'Physics (042)',
    pageNumber: 3,
    areaOfWeakness: 'Vector resolution in inclined plane mechanics, free body diagram (FBD) components and frictional force calculations.',
    weaknessAttachments: [
      {
        id: 'att-diag-006',
        type: 'audio',
        title: 'Oral Diagnostic Viva Recording on FBD',
        fileName: 'nisha_fbd_viva_recording.m4a',
        fileSize: '1.8 MB',
        uploadedAt: '2026-08-07'
      }
    ],
    measuresPlanned: '1. Color-coded FBD component drawing worksheets\n2. Hands-on inclined plane wooden block lab demonstration\n3. 1-on-1 concept review during Saturday remedial period.',
    measuresAttachments: [
      {
        id: 'att-meas-005',
        type: 'pdf',
        title: 'Free Body Diagram Practice Set.pdf',
        fileName: 'Physics_FBD_Mechanics_Remedial.pdf',
        fileSize: '720 KB',
        uploadedAt: '2026-08-11'
      }
    ],
    diagnosticScore: 12,
    targetDate: '2026-09-05',
    status: 'In Remediation',
    remarks: 'Able to draw orthogonal components; working on normal reaction calculations.',
    templatePageRef: 34
  },
  {
    id: 'att-20a-006',
    sNo: 6,
    studentId: 'std-12a-06',
    studentName: 'Tanya Banerjee',
    rollNo: 6,
    className: 'Class XII-A',
    section: 'A',
    subjectName: 'Chemistry (043)',
    pageNumber: 4,
    areaOfWeakness: 'Electrochemistry: Nernst equation calculations involving log terms and molar conductivities at infinite dilution (Kohlrausch law).',
    weaknessAttachments: [
      {
        id: 'att-diag-007',
        type: 'photo',
        title: 'Nernst Numerical Calculation Errors',
        fileName: 'tanya_nernst_errors.jpg',
        fileSize: '1.4 MB',
        uploadedAt: '2026-08-10'
      }
    ],
    measuresPlanned: '1. Log table / anti-log calculation quick-reference guide\n2. 10 standard Board numerical problems solved with step-marking scheme\n3. Weekly progress review test.',
    measuresAttachments: [
      {
        id: 'att-meas-006',
        type: 'pdf',
        title: 'Electrochemistry Master Formula Sheet.pdf',
        fileName: 'Nernst_Kohlrausch_Drill_12A.pdf',
        fileSize: '620 KB',
        uploadedAt: '2026-08-12'
      }
    ],
    diagnosticScore: 14,
    targetDate: '2026-09-10',
    status: 'In Remediation',
    remarks: 'Formula substitution is clear; calculating log quotients needs speed drill.',
    templatePageRef: 34
  }
];

/**
 * Module 20(b): उपचारात्मक शिक्षण का ब्यौरा (DETAILS OF REMEDIAL TEACHING - Page 35)
 * Columns: Sl No, Name of Student, Topic/concept, Date 1..Date 9
 * + Multi-file evidence attachments
 */
export const DEFAULT_REMEDIAL_TEACHING_DETAILS_20B: RemedialTeachingDetailsRecord20b[] = [
  {
    id: 'rem-20b-001',
    slNo: 1,
    studentId: 'std-10a-04',
    studentName: 'Vikramaditya Roy',
    rollNo: 4,
    className: 'Class X-A',
    section: 'A',
    subjectName: 'Mathematics (041)',
    topicConcept: 'Quadratic Equations: Factorisation, Quadratic Formula & Discriminant Analysis',
    pageNumber: 1,
    dates: ['04/08', '06/08', '08/08', '11/08', '13/08', '16/08', '18/08', '20/08', '22/08'],
    sessionStatuses: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', '✓'],
    attachments: [
      {
        id: 'att-20b-001',
        type: 'photo',
        title: 'Remedial Session Whiteboard Solving Step Photo',
        fileName: 'quadratic_board_session_aug16.jpg',
        fileSize: '1.3 MB',
        uploadedAt: '2026-08-16'
      },
      {
        id: 'att-20b-002',
        type: 'pdf',
        title: 'Session 1-9 Drill Worksheets Pack.pdf',
        fileName: 'Quadratic_Drill_Level1_Complete.pdf',
        fileSize: '840 KB',
        uploadedAt: '2026-08-18'
      }
    ],
    completionStatus: 'Completed',
    remarks: 'Attended all 9 targeted remedial sessions. Factorisation speed improved significantly.',
    templatePageRef: 35
  },
  {
    id: 'rem-20b-002',
    slNo: 2,
    studentId: 'std-10a-07',
    studentName: 'Kavya S. Nair',
    rollNo: 7,
    className: 'Class X-A',
    section: 'A',
    subjectName: 'Mathematics (041)',
    topicConcept: 'Trigonometry: Fundamental Identities & Step-by-Step Proof of LHS = RHS',
    pageNumber: 1,
    dates: ['05/08', '07/08', '09/08', '12/08', '14/08', '17/08', '19/08', '21/08', '24/08'],
    sessionStatuses: ['P', 'P', 'P', 'P', 'P', 'P', 'P', '✓', ''],
    attachments: [
      {
        id: 'att-20b-003',
        type: 'audio',
        title: 'Oral Identity Recitation & Proof Explanation Viva',
        fileName: 'kavya_trig_identities_viva.mp3',
        fileSize: '2.1 MB',
        uploadedAt: '2026-08-19'
      }
    ],
    completionStatus: 'In Progress',
    remarks: 'Mastered 3 primary identities; practicing complex algebraic denominators.',
    templatePageRef: 35
  },
  {
    id: 'rem-20b-003',
    slNo: 3,
    studentId: 'std-10a-11',
    studentName: 'Mohd. Zeeshan',
    rollNo: 11,
    className: 'Class X-A',
    section: 'A',
    subjectName: 'Science (086)',
    topicConcept: 'Chemical Reactions: Balancing Equations by Tabular Atom Count Method',
    pageNumber: 1,
    dates: ['06/08', '08/08', '11/08', '13/08', '16/08', '18/08', '20/08', '22/08', '25/08'],
    sessionStatuses: ['P', 'P', 'P', 'P', 'P', 'P', '✓', '', ''],
    attachments: [
      {
        id: 'att-20b-004',
        type: 'video',
        title: 'Redox Reaction Balancing PhET Sim Video',
        fileName: 'zeeshan_balancing_sim_demo.mp4',
        fileSize: '5.2 MB',
        uploadedAt: '2026-08-18'
      }
    ],
    completionStatus: 'In Progress',
    remarks: 'Consistent attendance. Successfully balanced 8/10 equations independently in Session 7.',
    templatePageRef: 35
  },
  {
    id: 'rem-20b-004',
    slNo: 4,
    studentId: 'std-09a-05',
    studentName: 'Harshit Gupta',
    rollNo: 5,
    className: 'Class IX-A',
    section: 'A',
    subjectName: 'Mathematics (041)',
    topicConcept: 'Number Systems: Rationalising the Denominator & Surds Arithmetic',
    pageNumber: 2,
    dates: ['02/08', '04/08', '06/08', '09/08', '11/08', '13/08', '16/08', '18/08', '20/08'],
    sessionStatuses: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', '✓'],
    attachments: [
      {
        id: 'att-20b-005',
        type: 'pdf',
        title: 'Corrected Remedial Exercise Sheet 1-9.pdf',
        fileName: 'Harshit_Surds_Corrected_Module.pdf',
        fileSize: '760 KB',
        uploadedAt: '2026-08-20'
      }
    ],
    completionStatus: 'Completed',
    remarks: 'All 9 sessions completed with teacher signature on workbook.',
    templatePageRef: 35
  }
];

/**
 * Module 20(c): उपचारात्मक सहायता की आवश्यकता वाले छात्रों की प्रगति का अभिलेख
 * TRACKING OF STUDENTS’ PERFORMANCE AFTER REMEDIATION (Page 36)
 * Columns: Sl No, Name of Student, Nature of Test, Record of Progress (Max Marks & Tests 1..10), Parent's Signature
 * + Multi-file evidence attachments
 */
export const DEFAULT_REMEDIAL_PERFORMANCE_TRACKING_20C: RemedialPerformanceTrackingRecord20c[] = [
  {
    id: 'rem-20c-001',
    slNo: 1,
    studentId: 'std-10a-04',
    studentName: 'Vikramaditya Roy',
    rollNo: 4,
    className: 'Class X-A',
    section: 'A',
    subjectName: 'Mathematics (041)',
    natureOfTest: 'PT-1 Diagnostic & Re-Test Series',
    maxMarks: 40,
    scores: [9, 14, 18, 22, 26, 29, 32, null, null, null],
    testDates: ['04/08', '08/08', '12/08', '15/08', '18/08', '21/08', '25/08', '', '', ''],
    parentSignature: 'Signed (S. N. Roy - Father)',
    parentSignatureDate: '2026-08-26',
    parentPhone: '9876543210',
    isParentAcknowledged: true,
    attachments: [
      {
        id: 'att-20c-001',
        type: 'photo',
        title: 'Re-Test Paper Score 32/40 Answer Sheet Scan',
        fileName: 'vikram_retest_32_marks_sheet.jpg',
        fileSize: '1.6 MB',
        uploadedAt: '2026-08-26'
      },
      {
        id: 'att-20c-002',
        type: 'pdf',
        title: 'Post-Remediation Progress Summary Report.pdf',
        fileName: 'Vikram_Progress_Report_Math.pdf',
        fileSize: '410 KB',
        uploadedAt: '2026-08-26'
      }
    ],
    status: 'Target Met',
    pageNumber: 1,
    remarks: 'Remarkable score leap from 9/40 (diagnostic) to 32/40 (re-test). Parent commended progress in diary.',
    templatePageRef: 36
  },
  {
    id: 'rem-20c-002',
    slNo: 2,
    studentId: 'std-10a-07',
    studentName: 'Kavya S. Nair',
    rollNo: 7,
    className: 'Class X-A',
    section: 'A',
    subjectName: 'Mathematics (041)',
    natureOfTest: 'Trigonometry Chapter Re-Test & Quizzes',
    maxMarks: 25,
    scores: [7, 10, 14, 17, 19, 21, null, null, null, null],
    testDates: ['05/08', '09/08', '13/08', '17/08', '21/08', '24/08', '', '', '', ''],
    parentSignature: 'Signed (Suresh Nair - Father)',
    parentSignatureDate: '2026-08-25',
    parentPhone: '9812345678',
    isParentAcknowledged: true,
    attachments: [
      {
        id: 'att-20c-003',
        type: 'photo',
        title: 'Trigonometry Re-Test Answer Paper Photo',
        fileName: 'kavya_retest_score21.jpg',
        fileSize: '1.2 MB',
        uploadedAt: '2026-08-25'
      }
    ],
    status: 'Target Met',
    pageNumber: 1,
    remarks: 'Consistent score improvement from 7/25 to 21/25. Parent verified homework regularly.',
    templatePageRef: 36
  },
  {
    id: 'rem-20c-003',
    slNo: 3,
    studentId: 'std-10a-11',
    studentName: 'Mohd. Zeeshan',
    rollNo: 11,
    className: 'Class X-A',
    section: 'A',
    subjectName: 'Science (086)',
    natureOfTest: 'Chemical Reactions Slip Test & Unit Assessment',
    maxMarks: 30,
    scores: [8, 12, 16, 20, 23, null, null, null, null, null],
    testDates: ['06/08', '11/08', '16/08', '20/08', '24/08', '', '', '', '', ''],
    parentSignature: 'Acknowledged via SMS / Diary Sign',
    parentSignatureDate: '2026-08-24',
    parentPhone: '9765432109',
    isParentAcknowledged: true,
    attachments: [
      {
        id: 'att-20c-004',
        type: 'pdf',
        title: 'Chemistry Re-Test Assessment Sheet.pdf',
        fileName: 'Zeeshan_Chemistry_ReTest_Score23.pdf',
        fileSize: '490 KB',
        uploadedAt: '2026-08-24'
      }
    ],
    status: 'Target Met',
    pageNumber: 1,
    remarks: 'Score progressed from 8/30 to 23/30. Confident with redox balancing.',
    templatePageRef: 36
  },
  {
    id: 'rem-20c-004',
    slNo: 4,
    studentId: 'std-09a-05',
    studentName: 'Harshit Gupta',
    rollNo: 5,
    className: 'Class IX-A',
    section: 'A',
    subjectName: 'Mathematics (041)',
    natureOfTest: 'Number Systems Mastery Test Series',
    maxMarks: 40,
    scores: [11, 16, 21, 27, 31, 34, null, null, null, null],
    testDates: ['03/08', '07/08', '11/08', '15/08', '18/08', '21/08', '', '', '', ''],
    parentSignature: 'Signed (Manoj Gupta - Father)',
    parentSignatureDate: '2026-08-22',
    parentPhone: '9823456789',
    isParentAcknowledged: true,
    attachments: [
      {
        id: 'att-20c-005',
        type: 'photo',
        title: 'Final Mastery Test 34/40 Marks Sheet',
        fileName: 'harshit_mastery_test_34.jpg',
        fileSize: '1.4 MB',
        uploadedAt: '2026-08-22'
      }
    ],
    status: 'Target Met',
    pageNumber: 2,
    remarks: 'Outstanding progress from 11/40 to 34/40. Remediation completed successfully.',
    templatePageRef: 36
  }
];

export const DEFAULT_MDP_AIP_PROJECTS: MdpAipProjectRecord[] = [
  {
    id: 'mdp-01',
    projectType: 'AIP',
    title: 'Geometrical Symmetry & Golden Ratio in Odisha Temple Architecture',
    topic: 'Surface Areas & Volumes / Triangles & Circles',
    aipAssigned: '3D Geometric Architectural Models of Konark Sun Temple & Odisha Heritage featuring golden ratio and circular symmetry',
    evaluationCriteria: '1. Mathematical Rigor (5M), 2. Art Integration & Craftsmanship (5M), 3. Research & Originality (5M), 4. Presentation & Viva (5M)',
    theme: 'Art Integration (Odisha Art & Heritage)',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    pairedSubjects: 'Mathematics + Visual Art + Social Science',
    targetGroup: 'Class X-A (All Students / 8 Groups)',
    assignedDate: '2025-07-15',
    submissionDate: '2025-08-20',
    r1Content: 5,
    r2ArtIntegration: 5,
    r3ResearchCreativity: 4.5,
    r4Presentation: 4.5,
    totalMarks: 19,
    status: 'Evaluated',
    remarks: 'Exemplary 3D geometrical models of Konark Sun Temple wheels presented with ratio analysis.',
    templatePageRef: 23
  },
  {
    id: 'mdp-02',
    projectType: 'MDP',
    title: 'Rainwater Harvesting & Ground Water Recharging Model in Vidyalaya',
    topic: 'Environmental Sustainability & Water Management',
    mdpAssigned: 'Multi-disciplinary project combining volumetric catchment calculations, geological soil layer analysis, and filtration prototype',
    evaluationCriteria: '1. Concept & Data Accuracy (5M), 2. Interdisciplinary Linkage (5M), 3. Model Craft & Innovation (5M), 4. Presentation (5M)',
    theme: 'Environmental Sustainability & Water Conservation',
    className: 'IX',
    section: 'A',
    subjectName: 'Science (086)',
    pairedSubjects: 'Science + Geography + Mathematics',
    targetGroup: 'Class IX-A (42 Students / 6 Groups)',
    assignedDate: '2025-08-01',
    submissionDate: '2025-09-10',
    r1Content: 4.5,
    r2ArtIntegration: 4,
    r3ResearchCreativity: 4.5,
    r4Presentation: 4.5,
    totalMarks: 17.5,
    status: 'In Progress',
    remarks: 'Calculated catchment area volumetric flow and designed filtration pit prototype.',
    templatePageRef: 23
  },
  {
    id: 'mdp-03',
    projectType: 'MDP',
    title: 'Tribal Art (Warli / Saura Painting) & Statistical Data Representation',
    topic: 'Statistics & Geometric Patterns',
    mdpAssigned: 'Warli art motifs used to represent categorical frequency distribution and geometric line symmetry',
    evaluationCriteria: '1. Mathematical Clarity (5M), 2. Interdisciplinary Synergy (5M), 3. Artistic Authenticity (5M), 4. Viva Voce (5M)',
    theme: 'Indigenous Heritage & Cultural Mathematics',
    className: 'VI',
    section: 'A',
    subjectName: 'Mathematics (041)',
    pairedSubjects: 'Mathematics + Visual Art + EBSB',
    targetGroup: 'Class VI-A (40 Students)',
    assignedDate: '2025-07-10',
    submissionDate: '2025-08-14',
    r1Content: 5,
    r2ArtIntegration: 5,
    r3ResearchCreativity: 4,
    r4Presentation: 5,
    totalMarks: 19,
    status: 'Exhibited',
    remarks: 'Exhibited during Independence Day cultural gallery in Vidyalaya assembly hall.',
    templatePageRef: 23
  },
  {
    id: 'mdp-04',
    projectType: 'AIP',
    title: 'Mathematical Rangoli & Vedic Mandalas with Parabolic Curves',
    topic: 'Coordinate Geometry & Quadratic Curves',
    aipAssigned: 'Designing symmetrical Rangoli floor art utilizing coordinate axes, parabola graphing, and polar symmetry',
    evaluationCriteria: '1. Curve Accuracy (5M), 2. Aesthetic Appeal (5M), 3. Mathematical Documentation (5M), 4. Defense (5M)',
    theme: 'Traditional Indian Art & Geometry',
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    pairedSubjects: 'Mathematics + Visual Art',
    targetGroup: 'Class X-A (Teams of 4)',
    assignedDate: '2025-09-01',
    submissionDate: '2025-09-25',
    r1Content: 4.5,
    r2ArtIntegration: 5,
    r3ResearchCreativity: 4.5,
    r4Presentation: 5,
    totalMarks: 19,
    status: 'Assigned',
    remarks: 'Submitted for upcoming National Mathematics Day display.',
    templatePageRef: 23
  }
];

export const DEFAULT_SECONDARY_REMEDIAL: SecondaryRemedialRecord[] = [
  {
    id: 'rem-sec-01',
    studentId: 'std-10a-05',
    studentName: 'Tanmay Jena',
    rollNo: 5,
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    diagnosticWeakness: 'Quadratic equation factorisation by splitting middle term and discriminant condition (D < 0)',
    identifiedMonth: 'July 2025',
    remedialStrategy: 'Targeted visual algebraic algebra tiles, step-by-step flowchart worksheet, and 1-on-1 zero-period peer mentoring',
    remedialDates: 'July 22 - July 30 (6 Sessions)',
    initialMarks: 11,
    reTestMarks: 31,
    progressStatus: 'Achieved',
    parentSignatureAcknowledged: true,
    remarks: 'Remarkable improvement. Scored 31/40 in chapter re-test.',
    templatePageRef: 34
  },
  {
    id: 'rem-sec-02',
    studentId: 'std-6a-04',
    studentName: 'Chirag Naik',
    rollNo: 4,
    className: 'VI',
    section: 'A',
    subjectName: 'Mathematics (041)',
    diagnosticWeakness: 'Addition & subtraction of unlike fractions using LCM method',
    identifiedMonth: 'August 2025',
    remedialStrategy: 'Fraction disc strips manipulatives and daily 5-question morning drill sheets',
    remedialDates: 'Aug 04 - Aug 12 (5 Sessions)',
    initialMarks: 8,
    reTestMarks: 24,
    progressStatus: 'Developing',
    parentSignatureAcknowledged: true,
    remarks: 'Grasped like fractions; continues practice on three-term LCM calculations.',
    templatePageRef: 34
  },
  {
    id: 'rem-sec-03',
    studentId: 'std-10a-03',
    studentName: 'Samir Mohanty',
    rollNo: 3,
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    diagnosticWeakness: 'Proof of theorem on areas of similar triangles and basic proportionality theorem',
    identifiedMonth: 'August 2025',
    remedialStrategy: 'Color-coded triangle construction diagrams and structured proof fill-in templates',
    remedialDates: 'Aug 14 - Aug 22 (4 Sessions)',
    initialMarks: 14,
    reTestMarks: 34,
    progressStatus: 'Achieved',
    parentSignatureAcknowledged: true,
    remarks: 'Successfully reproduced both theorems independently with accurate reasoning.',
    templatePageRef: 34
  }
];

export const DEFAULT_EXEMPLARY_CHILDREN: ExemplaryChildRecord[] = [
  {
    id: 'exm-01',
    slNo: 1,
    studentId: 'std-10a-02',
    studentName: 'Riya Patnaik',
    rollNo: 2,
    className: 'Class X-A',
    section: 'A',
    identifiedAreasOfStrengthAndStepsTaken: 'Exceptional aptitude in Olympiad Mathematics & Algorithmic Geometry. Provided RMO/INMO previous 10-year problem banks, advanced Calculus readiness modules, and assigned as Lead Peer Mentor for math clinic.',
    improvementShown: 'Secured Rank 1 in Vidyalaya Math Olympiad with 100% score; qualified for KVS Regional Mathematics Olympiad Round 2 with Distinction.',
    specialAptitude: 'Olympiad Mathematics, Advanced Calculus Readiness & Algorithmic Problem Solving',
    identifyingIndicators: 'Consistently scores 98-100% in PTs; solves Class XI coordinate geometry problems independently.',
    enrichmentStepsTaken: 'Provided NCERT Exemplar & RMO previous year question banks; appointed as Peer Mentor lead.',
    achievementsAndAwards: 'Rank 1 in Vidyalaya Math Olympiad; selected for KVS Regional Mathematics Olympiad Round 2.',
    attachments: [
      {
        id: 'att-exm-001',
        type: 'photo',
        title: 'KVS Regional Math Olympiad Merit Certificate Scan',
        fileName: 'riya_olympiad_merit_cert.jpg',
        fileSize: '1.8 MB',
        uploadedAt: '2026-08-15'
      },
      {
        id: 'att-exm-002',
        type: 'pdf',
        title: 'RMO Advanced Problem Solutions Portfolio.pdf',
        fileName: 'Riya_RMO_Solutions_Portfolio.pdf',
        fileSize: '950 KB',
        uploadedAt: '2026-08-17'
      }
    ],
    pageNumber: 1,
    templatePageRef: 37
  },
  {
    id: 'exm-02',
    slNo: 2,
    studentId: 'std-6a-01',
    studentName: 'Aarav Sharma',
    rollNo: 1,
    className: 'Class VI-A',
    section: 'A',
    identifiedAreasOfStrengthAndStepsTaken: 'High scientific curiosity, hands-on Arduino IoT prototyping & rapid mental arithmetic. Granted dedicated Atal Tinkering Lab (ATL) access; guided for NCSC Project on automated micro-drip irrigation.',
    improvementShown: 'Awarded Gold Medal at KVS Cluster Science Exhibition 2025; developed functioning solar-powered moisture sensor model.',
    specialAptitude: 'Robotics, Science Innovation & Mental Speed Mathematics',
    identifyingIndicators: 'Demonstrates acute scientific curiosity and builds working electronic sensors using Arduino kits at home.',
    enrichmentStepsTaken: 'Special access to Atal Tinkering Lab (ATL); guided for National Children\'s Science Congress (NCSC) project on smart irrigation.',
    achievementsAndAwards: 'Gold Medal at KVS Cluster Science Exhibition 2025 for Automated Soil Moisture Sensor.',
    attachments: [
      {
        id: 'att-exm-003',
        type: 'video',
        title: 'Arduino Soil Moisture Sensor Working Prototype Demo',
        fileName: 'aarav_smart_irrigation_demo.mp4',
        fileSize: '6.4 MB',
        uploadedAt: '2026-08-12'
      }
    ],
    pageNumber: 1,
    templatePageRef: 37
  },
  {
    id: 'exm-03',
    slNo: 3,
    studentId: 'std-10a-01',
    studentName: 'Rohan Sharma',
    rollNo: 1,
    className: 'Class X-A',
    section: 'A',
    identifiedAreasOfStrengthAndStepsTaken: 'Spatial visualization & Art-Integrated Geometric Architectural Modeling. Mentored to construct 3D polyhedral models and integrate Konark temple geometry into mathematical proofs.',
    improvementShown: 'Secured 1st Position in KVS State Art-Integrated Math Project Exhibition; published illustrated origami geometry booklet.',
    specialAptitude: 'Creative Mathematical Modeling & Art Integrated Spatial Geometry',
    identifyingIndicators: 'Constructed intricate 3D geometric polyhedrons and fractals displaying advanced spatial imagination.',
    enrichmentStepsTaken: 'Encouraged to deliver class presentation on fractal geometry and coordinate transformation in computer graphics.',
    achievementsAndAwards: '1st Prize in KVS State Level Art-Integrated Project Exhibition.',
    attachments: [
      {
        id: 'att-exm-004',
        type: 'photo',
        title: 'Konark Temple Geometric Art Integration Model Photo',
        fileName: 'rohan_konark_model_exhibition.jpg',
        fileSize: '2.1 MB',
        uploadedAt: '2026-08-14'
      }
    ],
    pageNumber: 1,
    templatePageRef: 37
  },
  {
    id: 'exm-04',
    slNo: 4,
    studentId: 'std-12a-01',
    studentName: 'Ananya Deshmukh',
    rollNo: 3,
    className: 'Class XII-A',
    section: 'A',
    identifiedAreasOfStrengthAndStepsTaken: 'Mastery in Organic Reaction Mechanisms and Spectroscopic Analysis. Provided CSIR research internship readings, advanced multi-step synthesis worksheets, and lab leadership duties.',
    improvementShown: 'Scored 100/100 in Pre-Board Chemistry; selected as KVS National Science Congress delegate for Green Chemistry research.',
    specialAptitude: 'Advanced Organic Chemistry Synthesis & Chemical Research',
    identifyingIndicators: 'Solved JEE Advanced Level Organic chemistry multi-step problems in under 3 minutes.',
    enrichmentStepsTaken: 'Guided on green synthesis of biodegradable biopolymers in senior chemistry lab.',
    achievementsAndAwards: 'KVS National Science Congress Young Innovator Finalist 2025.',
    attachments: [
      {
        id: 'att-exm-005',
        type: 'pdf',
        title: 'Green Chemistry Research Paper & Certificate.pdf',
        fileName: 'Ananya_Green_Polymer_Project_Cert.pdf',
        fileSize: '1.1 MB',
        uploadedAt: '2026-08-16'
      }
    ],
    pageNumber: 2,
    templatePageRef: 37
  }
];

/**
 * Module 22: अभिभावक-अध्यापक बैठक का अभिलेख (RECORD OF PARENT-TEACHER MEETINGS - 4 pages)
 * Official KVS Teacher's Diary Pages 38 to 41 (Middle & Secondary Stage).
 * Columns: Sl No, Date, Name of the Student and Class, Suggestions, Parents Signature with Mobile No.
 * + Multi-file evidence attachments
 */
export const DEFAULT_PTM_MEETINGS_22: PtmMeetingRecord22[] = [
  {
    id: 'ptm-22-001',
    slNo: 1,
    date: '10/08/2025',
    studentId: 'std-10a-04',
    studentNameAndClass: 'Vikramaditya Roy (Class X-A)',
    studentName: 'Vikramaditya Roy',
    className: 'Class X-A',
    section: 'A',
    rollNo: 4,
    suggestions: 'Discussed Periodic Test 1 score in Mathematics and quadratic equations factorisation errors. Parent assured daily 30-minute supervised homework completion and monitoring of remedial worksheets.',
    parentSignatureWithMobile: 'Signed (S. N. Roy - Father, 9876543210)',
    parentName: 'S. N. Roy',
    parentMobileNo: '9876543210',
    isSigned: true,
    pageNumber: 1,
    attachments: [
      {
        id: 'att-ptm-001',
        type: 'photo',
        title: 'Signed PTM Meeting Register Slip & Diary Note',
        fileName: 'vikram_ptm_signed_slip.jpg',
        fileSize: '1.4 MB',
        uploadedAt: '2025-08-10'
      },
      {
        id: 'att-ptm-002',
        type: 'pdf',
        title: 'Parent Undertaking & Remedial Agreement.pdf',
        fileName: 'Vikram_PTM_Undertaking.pdf',
        fileSize: '480 KB',
        uploadedAt: '2025-08-10'
      }
    ],
    remarks: 'Parent very cooperative; agreed to check teacher remarks in school diary weekly.',
    templatePageRef: 38
  },
  {
    id: 'ptm-22-002',
    slNo: 2,
    date: '10/08/2025',
    studentId: 'std-10a-07',
    studentNameAndClass: 'Kavya S. Nair (Class X-A)',
    studentName: 'Kavya S. Nair',
    className: 'Class X-A',
    section: 'A',
    rollNo: 7,
    suggestions: 'Advised parent on trigonometry identity practice and reducing exam anxiety. Suggested maintaining a dedicated formula flashcard booklet.',
    parentSignatureWithMobile: 'Signed (Suresh Nair - Father, 9812345678)',
    parentName: 'Suresh Nair',
    parentMobileNo: '9812345678',
    isSigned: true,
    pageNumber: 1,
    attachments: [
      {
        id: 'att-ptm-003',
        type: 'audio',
        title: 'PTM Discussion Voice Memo with Parent',
        fileName: 'kavya_ptm_audio_summary.mp3',
        fileSize: '2.4 MB',
        uploadedAt: '2025-08-10'
      }
    ],
    remarks: 'Father confirmed purchase of reference materials and regular practice at home.',
    templatePageRef: 38
  },
  {
    id: 'ptm-22-003',
    slNo: 3,
    date: '10/08/2025',
    studentId: 'std-10a-02',
    studentNameAndClass: 'Riya Patnaik (Class X-A)',
    studentName: 'Riya Patnaik',
    className: 'Class X-A',
    section: 'A',
    rollNo: 2,
    suggestions: 'Apprised parents of Riya\'s outstanding performance (Rank 1 in Vidyalaya Olympiad). Discussed guidance for KVS Regional & National Olympiad stages.',
    parentSignatureWithMobile: 'Signed (Dr. B. K. Patnaik - Father, 9822334455)',
    parentName: 'Dr. B. K. Patnaik',
    parentMobileNo: '9822334455',
    isSigned: true,
    pageNumber: 1,
    attachments: [
      {
        id: 'att-ptm-004',
        type: 'pdf',
        title: 'Olympiad Enrichment Permission & Consent Letter.pdf',
        fileName: 'Riya_Olympiad_Consent_PTM.pdf',
        fileSize: '350 KB',
        uploadedAt: '2025-08-10'
      }
    ],
    remarks: 'Parents expressed gratitude and committed full support for regional travel.',
    templatePageRef: 38
  },
  {
    id: 'ptm-22-004',
    slNo: 4,
    date: '12/10/2025',
    studentId: 'std-10a-11',
    studentNameAndClass: 'Mohd. Zeeshan (Class X-A)',
    studentName: 'Mohd. Zeeshan',
    className: 'Class X-A',
    section: 'A',
    rollNo: 11,
    suggestions: 'Reviewed Half-Yearly chemistry paper with mother. Recommended focus on chemical equation balancing and daily formula revision.',
    parentSignatureWithMobile: 'Signed (Farzana Begum - Mother, 9765432109)',
    parentName: 'Farzana Begum',
    parentMobileNo: '9765432109',
    isSigned: true,
    pageNumber: 2,
    attachments: [
      {
        id: 'att-ptm-005',
        type: 'photo',
        title: 'Corrected Half-Yearly Script Signature Photo',
        fileName: 'zeeshan_hy_script_signed.jpg',
        fileSize: '1.2 MB',
        uploadedAt: '2025-10-12'
      }
    ],
    remarks: 'Mother will ensure daily 20 minutes chemistry problem solving.',
    templatePageRef: 39
  }
];

/**
 * Module 23: मासिक स्टाफ मीटिंग का कार्यवृत्त सार (GIST OF MINUTES OF THE STAFF MEETINGS - 5 pages)
 * Official KVS Teacher's Diary Pages 42 to 46 (Middle & Secondary Stage).
 * Columns: Month & Date, Important/Relevant Points, Action taken/ Follow up
 * + Multi-file evidence attachments
 */
export const DEFAULT_STAFF_MEETINGS_23: StaffMeetingRecord23[] = [
  {
    id: 'sm-23-001',
    slNo: 1,
    monthAndDate: 'July 2025 (05/07/2025)',
    date: '2025-07-05',
    meetingTitle: 'Commencement of Academic Session & Split-Up Syllabus Alignment',
    importantPoints: '1. Strict adherence to KVS Split-Up Syllabus and timely lesson planning entry in Teacher Diary.\n2. Implementation of zero-period remedial support for late bloomers across Classes IX to XII.\n3. Vidyalaya cleanliness, corridor supervision, and student uniform inspection protocol.',
    actionTakenFollowUp: '1. All subject teachers submitted split-up syllabus monthly planning by 10th July.\n2. Remedial student lists and intervention action plans finalized.\n3. House masters inspected corridors and morning assembly discipline daily.',
    pageNumber: 1,
    attachments: [
      {
        id: 'att-sm-001',
        type: 'photo',
        title: 'Staff Meeting Attendance & Signed Resolution Page',
        fileName: 'staff_meeting_minutes_july.jpg',
        fileSize: '1.9 MB',
        uploadedAt: '2025-07-05'
      },
      {
        id: 'att-sm-002',
        type: 'pdf',
        title: 'Principal Circular on Split-up Syllabus Submission.pdf',
        fileName: 'Circular_Syllabus_Adherence_2025.pdf',
        fileSize: '510 KB',
        uploadedAt: '2025-07-06'
      }
    ],
    remarks: 'Chaired by Principal. All 48 staff members present.',
    templatePageRef: 42
  },
  {
    id: 'sm-23-002',
    slNo: 2,
    monthAndDate: 'August 2025 (08/08/2025)',
    date: '2025-08-08',
    meetingTitle: 'Independence Day Celebrations, FLN NIPUN Review & PTM Organization',
    importantPoints: '1. Review of Periodic Test 1 results across classes VI to XII.\n2. House-wise cultural and patriotic presentation duties for 15th August.\n3. Scheduling of Class X & XII Parent-Teacher Meeting (PTM) on second Saturday.',
    actionTakenFollowUp: '1. Result analysis ledgers completed and slow learners identified for remedial clinic.\n2. Independence Day event successfully conducted with zero accidents.\n3. PTM invitation circulars sent to all parents via SMS and student diaries.',
    pageNumber: 1,
    attachments: [
      {
        id: 'att-sm-003',
        type: 'audio',
        title: 'Principal Address on Board Exam Readiness (Audio)',
        fileName: 'principal_briefing_aug8.mp3',
        fileSize: '3.1 MB',
        uploadedAt: '2025-08-08'
      }
    ],
    remarks: 'Special emphasis placed on safety and student engagement during national festival.',
    templatePageRef: 42
  },
  {
    id: 'sm-23-003',
    slNo: 3,
    monthAndDate: 'September 2025 (05/09/2025)',
    date: '2025-09-05',
    meetingTitle: 'Teacher\'s Day Celebration & Half-Yearly Examination Readiness',
    importantPoints: '1. Finalization of Half-Yearly / Term 1 examination date-sheet and question paper moderation.\n2. Verification of syllabus completion up to September 15th.\n3. Supervision duties and seating arrangements for examination halls.',
    actionTakenFollowUp: '1. Two sets of moderated question papers submitted in sealed envelopes.\n2. Practical evaluation schedules published on student notice boards.\n3. Seating charts and flying squad duties distributed.',
    pageNumber: 2,
    attachments: [
      {
        id: 'att-sm-004',
        type: 'pdf',
        title: 'Half-Yearly Examination Duty Roster & Guidelines.pdf',
        fileName: 'HY_Exam_Duty_Roster_2025.pdf',
        fileSize: '720 KB',
        uploadedAt: '2025-09-05'
      }
    ],
    remarks: 'Examination committee finalized all logistical arrangements.',
    templatePageRef: 43
  }
];

/**
 * Module 24: मासिक विषय समिति की बैठक का कार्यवृत्त सार (GIST OF THE MONTHLY SUBJECT COMMITTEE MEETINGS - 5 pages)
 * Official KVS Teacher's Diary Pages 47 to 51 (Middle & Secondary Stage).
 * Columns: Date of meeting, Gist of the Decisions/Suggestions, Follow Up actions
 * + Multi-file evidence attachments
 */
export const DEFAULT_SUBJECT_MEETINGS_24: SubjectCommitteeMeetingRecord24[] = [
  {
    id: 'scm-24-001',
    slNo: 1,
    dateOfMeeting: '12/07/2025',
    subjectName: 'Mathematics (041)',
    gistOfDecisionsSuggestions: '1. Moderation of Periodic Test 1 question papers ensuring 20% competency-based questions as per CBSE guidelines.\n2. Integration of 2 Maths Lab activities per month in Class IX & X (e.g. Square root spiral, Linear equations on coordinate grid).\n3. Identified top talent for Vidyalaya and Regional Mathematical Olympiad training.',
    followUpActions: '1. Blueprint and answer scheme prepared and signed by all 4 department teachers.\n2. Lab periods allocated in weekly timetable; activity records checked regularly.\n3. Special after-school Olympiad coaching initiated for identified students.',
    pageNumber: 1,
    attachments: [
      {
        id: 'att-scm-001',
        type: 'photo',
        title: 'Subject Committee Whiteboard Discussion & Blueprint Notes',
        fileName: 'math_committee_july12_blueprint.jpg',
        fileSize: '1.6 MB',
        uploadedAt: '2025-07-12'
      },
      {
        id: 'att-scm-002',
        type: 'pdf',
        title: 'CBSE Competency Question Bank & Department Action Plan.pdf',
        fileName: 'Math_Dept_Action_Plan_2025.pdf',
        fileSize: '890 KB',
        uploadedAt: '2025-07-14'
      }
    ],
    remarks: 'Convened by Senior PGT Maths. All TGTs & PRTs teaching math attended.',
    templatePageRef: 47
  },
  {
    id: 'scm-24-002',
    slNo: 2,
    dateOfMeeting: '16/08/2025',
    subjectName: 'Science (086)',
    gistOfDecisionsSuggestions: '1. Post-PT-1 performance review in Physics, Chemistry, and Biology.\n2. Compulsory demonstration of all NCERT activities in regular classes.\n3. Preparation of models for KVS Cluster Science Exhibition on Green Energy & AI.',
    followUpActions: '1. Chapter-wise remedial assignment sheets prepared for low-scoring topics.\n2. Science laboratory log book maintained for all practical demonstrations.\n3. 4 student projects selected and registered for Cluster Science Fair.',
    pageNumber: 1,
    attachments: [
      {
        id: 'att-scm-003',
        type: 'video',
        title: 'Science Lab Demonstration Protocol Discussion (Video)',
        fileName: 'science_dept_lab_demo_aug16.mp4',
        fileSize: '5.6 MB',
        uploadedAt: '2025-08-16'
      }
    ],
    remarks: 'Detailed lab safety norms reviewed and signed by all science teachers.',
    templatePageRef: 47
  },
  {
    id: 'scm-24-003',
    slNo: 3,
    dateOfMeeting: '10/09/2025',
    subjectName: 'English Core (301)',
    gistOfDecisionsSuggestions: '1. Enhancement of reading comprehension and creative writing skills in Classes VI-X.\n2. Organization of Intra-School Debate & Extempore Competition during Hindi/English Pakhwada.\n3. Regular notebook checking and constructive feedback on grammatical errors.',
    followUpActions: '1. Daily 10-minute vocabulary builder introduced during zero period.\n2. Debate event conducted with 32 participant students across 4 houses.\n3. Notebook submission schedule strictly enforced.',
    pageNumber: 2,
    attachments: [
      {
        id: 'att-scm-004',
        type: 'pdf',
        title: 'English Language Competency Guidelines & Debate Topic List.pdf',
        fileName: 'English_Dept_Minutes_Sep2025.pdf',
        fileSize: '430 KB',
        uploadedAt: '2025-09-10'
      }
    ],
    remarks: 'Language laboratory schedule finalized for audio-visual lessons.',
    templatePageRef: 48
  }
];

export const DEFAULT_SECONDARY_SEA_PLANS: SeaPlanItem[] = [
  {
    id: 'sea-sec-01',
    slNo: 1,
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    monthAndDate: 'April 2025',
    activity: 'Maths Lab Activity: Verification of Square Root Spiral (Irrational Numbers)',
    evaluationCriteria: 'R1: Accuracy of geometric construction (5), R2: Theoretical calculation (5), R3: Lab file neatness (5), R4: Viva voce (5)',
    remarks: 'All 42 students executed square root spiral up to √7 on square grid sheet.',
    term: 1
  },
  {
    id: 'sea-sec-02',
    slNo: 2,
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    monthAndDate: 'July 2025',
    activity: 'GeoGebra Graphical Simulation of Zeros of Quadratic Polynomials',
    evaluationCriteria: 'R1: ICT software navigation (5), R2: Curve observation & vertex logging (5), R3: Worksheet derivation (5), R4: Oral explanation (5)',
    remarks: 'Conducted in computer lab; students observed dynamic changes when parameter \'a\' is varied.',
    term: 1
  },
  {
    id: 'sea-sec-03',
    slNo: 3,
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    monthAndDate: 'August 2025',
    activity: 'Real-Life Height & Distance Inclinometer Model Making',
    evaluationCriteria: 'R1: Model precision (5), R2: Trigonometric ratio application (5), R3: Outdoor measurement recording (5), R4: Presentation (5)',
    remarks: 'Measured height of school flagpole and building using handmade protractor inclinometers.',
    term: 2
  },
  {
    id: 'sea-sec-04',
    slNo: 4,
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    monthAndDate: 'October 2025',
    activity: 'Statistical Survey & Ogive Curve of Vidyalaya Energy & Water Consumption',
    evaluationCriteria: 'R1: Survey Data Collection (5), R2: Cumulative Frequency Table (5), R3: Ogive Graphing (5), R4: Inference (5)',
    remarks: 'Interdisciplinary survey in collaboration with Vidyalaya Eco Club and physics department.',
    term: 2
  },
  {
    id: 'sea-sec-05',
    slNo: 5,
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    monthAndDate: 'November 2025',
    activity: 'Mathematical Rangoli & Vedic Mathematics Short-Cut Drills',
    evaluationCriteria: 'R1: Mathematical Symmetries (5), R2: Speed of Calculation (5), R3: Peer Engagement (5), R4: Documentation (5)',
    remarks: 'Students demonstrated 2-digit multiplication algorithms in morning assembly.',
    term: 2
  }
];

/**
 * 17(f) कक्षा 10 के अंकों का ब्यौरा (RECORD OF MARKS FOR CLASS - X) 4 pages
 */
export const DEFAULT_CLASS_X_MARKS_17F: ClassXMarksRecord17f[] = [
  {
    id: 'scr-10f-01',
    studentId: 'std-10a-01',
    studentName: 'Rohan Sharma',
    rollNo: 1,
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    m1: 18,
    m2: 19,
    m3: 19,
    m4: 20,
    m5: 19,
    pt1: 38,
    pt2: 39,
    hy: 74,
    pb1: 72,
    pb2: 76,
    pb3: 78,
    aisse: 95,
    parentSignature: 'Signed (Devendra Sharma)',
    remarks: 'Consistent problem solving throughout all term cycles.',
    templatePageRef: 25
  },
  {
    id: 'scr-10f-02',
    studentId: 'std-10a-02',
    studentName: 'Riya Patnaik',
    rollNo: 2,
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    m1: 20,
    m2: 20,
    m3: 20,
    m4: 20,
    m5: 20,
    pt1: 40,
    pt2: 40,
    hy: 78,
    pb1: 76,
    pb2: 79,
    pb3: 80,
    aisse: 99,
    parentSignature: 'Signed (Ashok Patnaik)',
    remarks: 'Outstanding speed & accuracy in Pre-Boards.',
    templatePageRef: 25
  },
  {
    id: 'scr-10f-03',
    studentId: 'std-10a-03',
    studentName: 'Samir Mohanty',
    rollNo: 3,
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    m1: 15,
    m2: 16,
    m3: 17,
    m4: 16,
    m5: 17,
    pt1: 32,
    pt2: 34,
    hy: 64,
    pb1: 60,
    pb2: 66,
    pb3: 70,
    aisse: 82,
    parentSignature: 'Signed (Subhas Mohanty)',
    remarks: 'Regular attendance and steady upward progression in Pre-Boards.',
    templatePageRef: 25
  },
  {
    id: 'scr-10f-04',
    studentId: 'std-10a-04',
    studentName: 'Sneha Barik',
    rollNo: 4,
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    m1: 17,
    m2: 18,
    m3: 18,
    m4: 19,
    m5: 18,
    pt1: 36,
    pt2: 37,
    hy: 70,
    pb1: 68,
    pb2: 72,
    pb3: 75,
    aisse: 89,
    parentSignature: 'Signed (Balaram Barik)',
    remarks: 'Strong conceptual foundation in geometry and trigonometry.',
    templatePageRef: 25
  },
  {
    id: 'scr-10f-05',
    studentId: 'std-10a-05',
    studentName: 'Tanmay Jena',
    rollNo: 5,
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    m1: 13,
    m2: 14,
    m3: 15,
    m4: 16,
    m5: 16,
    pt1: 26,
    pt2: 29,
    hy: 56,
    pb1: 52,
    pb2: 60,
    pb3: 65,
    aisse: 74,
    parentSignature: 'Signed (Kamalakanta Jena)',
    remarks: 'Remedial coaching in algebra yielded significant gains in PB-2 & PB-3.',
    templatePageRef: 25
  },
  {
    id: 'scr-10f-06',
    studentId: 'std-10a-06',
    studentName: 'Zoya Fatima',
    rollNo: 6,
    className: 'X',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    m1: 19,
    m2: 19,
    m3: 20,
    m4: 19,
    m5: 20,
    pt1: 39,
    pt2: 38,
    hy: 75,
    pb1: 74,
    pb2: 77,
    pb3: 79,
    aisse: 96,
    parentSignature: 'Signed (Dr. Tariq Anwar)',
    remarks: 'Excellent analytical presentation and clear step marking.',
    templatePageRef: 25
  }
];

/**
 * 17(g) मूल्यांकन संरचना कक्षा-11 (ASSESSMENT STRUCTURE FOR CLASS- XI) 6 pages
 */
export const DEFAULT_CLASS_XI_ASSESSMENT_17G: ClassXIAssessmentRecord17g[] = [
  {
    id: 'scr-11g-01',
    studentId: 'std-11a-01',
    studentName: 'Abhinav Senapati',
    rollNo: 1,
    className: 'XI',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    pt1: 36,
    halfYearly: 62,
    pt2: 37,
    seeTheory: 64,
    seePractical: 29,
    seeTotal: 93,
    remarks: 'Good analytical rigor in calculus & coordinate geometry.',
    templatePageRef: 29
  },
  {
    id: 'scr-11g-02',
    studentId: 'std-11a-02',
    studentName: 'Shreya Mohapatra',
    rollNo: 2,
    className: 'XI',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    pt1: 38,
    halfYearly: 66,
    pt2: 39,
    seeTheory: 68,
    seePractical: 30,
    seeTotal: 98,
    remarks: 'Top ranker with outstanding conceptual clarity in proofs.',
    templatePageRef: 29
  },
  {
    id: 'scr-11g-03',
    studentId: 'std-11a-03',
    studentName: 'Sourav Mohanty',
    rollNo: 3,
    className: 'XI',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    pt1: 28,
    halfYearly: 50,
    pt2: 32,
    seeTheory: 54,
    seePractical: 27,
    seeTotal: 81,
    remarks: 'Marked improvement after zero-period remedial sessions on trigonometry.',
    templatePageRef: 29
  },
  {
    id: 'scr-11g-04',
    studentId: 'std-11a-04',
    studentName: 'Aniket Verma',
    rollNo: 4,
    className: 'XI',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    pt1: 34,
    halfYearly: 58,
    pt2: 35,
    seeTheory: 61,
    seePractical: 28,
    seeTotal: 89,
    remarks: 'Punctual in lab record submission and mathematical modeling.',
    templatePageRef: 29
  },
  {
    id: 'scr-11g-05',
    studentId: 'std-11a-05',
    studentName: 'Pratyush Nayak',
    rollNo: 5,
    className: 'XI',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    pt1: 32,
    halfYearly: 55,
    pt2: 34,
    seeTheory: 59,
    seePractical: 28,
    seeTotal: 87,
    remarks: 'Active participant in peer problem-solving circles.',
    templatePageRef: 29
  },
  {
    id: 'scr-11g-06',
    studentId: 'std-11a-06',
    studentName: 'Megha Sahoo',
    rollNo: 6,
    className: 'XI',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    pt1: 37,
    halfYearly: 64,
    pt2: 38,
    seeTheory: 66,
    seePractical: 29,
    seeTotal: 95,
    remarks: 'Clear mathematical derivations and well-kept lab activity file.',
    templatePageRef: 29
  }
];

/**
 * 17(h) कक्षा-12 के अंकों का ब्यौरा (RECORD OF MARKS FOR CLASS- XII) 6 pages
 */
export const DEFAULT_CLASS_XII_MARKS_17H: ClassXIIMarksRecord17h[] = [
  {
    id: 'scr-12h-01',
    studentId: 'std-12a-01',
    studentName: 'Vikramaditya Rout',
    rollNo: 1,
    className: 'XII',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    m1: 18,
    m2: 19,
    m3: 19,
    m4: 20,
    m5: 20,
    pt1: 38,
    pt2: 39,
    hy: 72,
    pb1: 70,
    pb2: 74,
    pb3: 77,
    aissce: 96,
    parentSignature: 'Signed (Prasanna Rout)',
    remarks: 'High potential for scoring 95%+ in CBSE Board Examination.',
    templatePageRef: 35
  },
  {
    id: 'scr-12h-02',
    studentId: 'std-12a-02',
    studentName: 'Tanya Swain',
    rollNo: 2,
    className: 'XII',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    m1: 19,
    m2: 19,
    m3: 20,
    m4: 20,
    m5: 20,
    pt1: 39,
    pt2: 40,
    hy: 76,
    pb1: 74,
    pb2: 78,
    pb3: 79,
    aissce: 98,
    parentSignature: 'Signed (Kishore Swain)',
    remarks: 'Excellent mastery of 3D Geometry and Linear Programming.',
    templatePageRef: 35
  },
  {
    id: 'scr-12h-03',
    studentId: 'std-12a-03',
    studentName: 'Ayush Mohapatra',
    rollNo: 3,
    className: 'XII',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    m1: 16,
    m2: 17,
    m3: 17,
    m4: 18,
    m5: 18,
    pt1: 33,
    pt2: 35,
    hy: 64,
    pb1: 62,
    pb2: 67,
    pb3: 71,
    aissce: 85,
    parentSignature: 'Signed (Prakash Mohapatra)',
    remarks: 'Good progress across three pre-board rehearsals.',
    templatePageRef: 35
  },
  {
    id: 'scr-12h-04',
    studentId: 'std-12a-04',
    studentName: 'Priyanka Das',
    rollNo: 4,
    className: 'XII',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    m1: 18,
    m2: 18,
    m3: 19,
    m4: 19,
    m5: 19,
    pt1: 37,
    pt2: 38,
    hy: 71,
    pb1: 69,
    pb2: 73,
    pb3: 76,
    aissce: 92,
    parentSignature: 'Signed (Bijay Das)',
    remarks: 'Very neat presentation and accurate differential equations solutions.',
    templatePageRef: 35
  },
  {
    id: 'scr-12h-05',
    studentId: 'std-12a-05',
    studentName: 'Debabrata Nayak',
    rollNo: 5,
    className: 'XII',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    m1: 14,
    m2: 15,
    m3: 16,
    m4: 16,
    m5: 17,
    pt1: 29,
    pt2: 31,
    hy: 58,
    pb1: 55,
    pb2: 62,
    pb3: 68,
    aissce: 78,
    parentSignature: 'Signed (Bikash Nayak)',
    remarks: 'Steadily upgraded from 55 in PB-1 to 68 in PB-3 after targeted calculus support.',
    templatePageRef: 35
  },
  {
    id: 'scr-12h-06',
    studentId: 'std-12a-06',
    studentName: 'Shalini Mishra',
    rollNo: 6,
    className: 'XII',
    section: 'A',
    subjectName: 'Mathematics (041)',
    academicYear: '2025-2026',
    m1: 19,
    m2: 20,
    m3: 20,
    m4: 20,
    m5: 20,
    pt1: 39,
    pt2: 40,
    hy: 77,
    pb1: 75,
    pb2: 78,
    pb3: 80,
    aissce: 97,
    parentSignature: 'Signed (Anil Mishra)',
    remarks: 'Top score in Pre-Board 3 with full marks in long answers.',
    templatePageRef: 35
  }
];

export const DEFAULT_NOTEBOOK_DATES_17J: string[] = [
  '08/04', '15/04', '22/04', '29/04',
  '06/05', '13/05',
  '01/07', '08/07', '15/07', '22/07', '29/07',
  '05/08', '12/08', '19/08', '26/08',
  '02/09', '09/09', '16/09', '23/09', '30/09'
];

export const DEFAULT_NOTEBOOK_SUBMISSION_17J: NotebookSubmissionRecord17j[] = [];

export const DEFAULT_PRACTICAL_DATES_17I: string[] = [
  '12/04', '19/04', '26/04', '03/05', '10/05',
  '05/07', '12/07', '19/07', '26/07', '02/08',
  '09/08', '16/08', '23/08', '30/08', '06/09',
  '13/09', '20/09', '27/09', '04/10', '11/10'
];

export const DEFAULT_PRACTICAL_TITLES_17I: string[] = [
  'Exp 1: Pythagoras Theorem verification',
  'Exp 2: Linear equations graphic consistency',
  'Exp 3: Quadratic zeros parabolic trace',
  'Exp 4: Arithmetic progression sum verification',
  'Exp 5: Similar triangles ratio verification',
  'Exp 6: Circle tangent perpendicular theorem',
  'Exp 7: Section formula coordinate model',
  'Exp 8: Clinometer angle of elevation',
  'Exp 9: Cylinder & cone volume comparison',
  'Exp 10: Cumulative frequency ogive curve',
  'Exp 11: Experimental probability dice throw',
  'Exp 12: Area of circle sector by paper sectoring',
  'Exp 13: Frustum volume & surface area model',
  'Exp 14: Distance formula coordinate grid',
  'Exp 15: Trigonometric identity sin²θ+cos²θ=1',
  'Exp 16: Basic proportionality theorem model',
  'Exp 17: Angle bisector property verification',
  'Exp 18: Sphere surface area peel model',
  'Exp 19: Median estimation from ogive curve',
  'Exp 20: Comprehensive maths lab portfolio viva'
];

export const DEFAULT_PRACTICAL_ATTENDANCE_17I: PracticalAttendanceRecord17i[] = [];

/**
 * Module 26: 26. अध्यापन के अलावा किए गए कार्यों का विवरण
 * DETAILS OF WORK DONE OTHER THAN TEACHING
 * Columns: Months, Details, Signature of Principal / V P
 */
export const DEFAULT_WORK_DONE_26: WorkDoneOtherThanTeaching26Record[] = [
  {
    id: 'wdot-26-001',
    month: 'April',
    details: 'Coordinated Vidyalaya Admission Verification Committee for Class I & VI registrations. Prepared Master Time Table draft for Secondary Section (Classes IX-X). Conducted Orientation Session for incoming parents on CBSE curriculum and NEP 2020 guidelines.',
    principalSignature: 'Verified & Signed (Principal)',
    principalSignatureDate: '2025-04-30',
    isSigned: true,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-wdot-001',
        type: 'pdf',
        title: 'Admission Verification Committee Duty Order.pdf',
        fileName: 'KVS_Admission_Duty_Order_Apr2025.pdf',
        fileSize: '420 KB',
        uploadedAt: '2025-04-10'
      }
    ],
    remarks: 'Admission process completed with 100% compliance as per KVS schedule.',
    templatePageRef: 52
  },
  {
    id: 'wdot-26-002',
    month: 'May',
    details: 'Supervised Summer Camp STEM & Origami Activity Workshop for Middle School students. Assisted in annual stock verification and physical audit of Mathematics & Composite Science Laboratories.',
    principalSignature: 'Verified & Signed (Principal)',
    principalSignatureDate: '2025-05-20',
    isSigned: true,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-wdot-002',
        type: 'photo',
        title: 'Maths Lab Stock Verification Report',
        fileName: 'Lab_Stock_Verification_May.jpg',
        fileSize: '1.2 MB',
        uploadedAt: '2025-05-18'
      }
    ],
    remarks: 'Stock verification register updated and certified.',
    templatePageRef: 52
  },
  {
    id: 'wdot-26-003',
    month: 'June',
    details: 'Participated in KVS Regional In-Service Teacher Training Program on Pedagogical Innovations & AI in Classroom Transaction. Drafted annual pedagogical plan and lesson schedule for Term 1.',
    principalSignature: 'Verified & Signed (Vice Principal)',
    principalSignatureDate: '2025-06-28',
    isSigned: true,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-wdot-003',
        type: 'pdf',
        title: 'In-Service Training Completion Certificate.pdf',
        fileName: 'KVS_InService_Training_Cert.pdf',
        fileSize: '650 KB',
        uploadedAt: '2025-06-28'
      }
    ],
    remarks: 'Presented best practices in mathematics visualization to peer cohort.',
    templatePageRef: 52
  },
  {
    id: 'wdot-26-004',
    month: 'July',
    details: 'Served as House Master (Shivaji House) for Inter-House Debate, Recitation, and Chess Tournaments. Organized Vidyalaya Level Van Mahotsav tree plantation drive and student environmental pledge.',
    principalSignature: 'Verified & Signed (Principal)',
    principalSignatureDate: '2025-07-31',
    isSigned: true,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-wdot-004',
        type: 'photo',
        title: 'Van Mahotsav Event Photo & Student Roster',
        fileName: 'Van_Mahotsav_Event_July.jpg',
        fileSize: '1.8 MB',
        uploadedAt: '2025-07-15'
      }
    ],
    remarks: 'Shivaji House secured 1st position in Inter-House Debate.',
    templatePageRef: 52
  },
  {
    id: 'wdot-26-005',
    month: 'August',
    details: 'Coordinated Independence Day cultural program parade contingent and patriotic song choir. Prepared question papers, blueprints, and evaluation rubrics for Periodic Test 1 examinations.',
    principalSignature: 'Verified & Signed (Principal)',
    principalSignatureDate: '2025-08-31',
    isSigned: true,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-wdot-005',
        type: 'audio',
        title: 'Choir Rehearsal Audio Recording',
        fileName: 'Patriotic_Song_Rehearsal.mp3',
        fileSize: '3.1 MB',
        uploadedAt: '2025-08-14'
      }
    ],
    remarks: 'Independence Day celebration conducted with high student participation.',
    templatePageRef: 52
  },
  {
    id: 'wdot-26-006',
    month: 'September',
    details: 'Assisted Exam Cell in organizing CBSE Class X & XII Sample Paper Series and Hindi Pakhwada celebrations. Conducted Teacher-Parent consultation sessions for students needing academic intervention.',
    principalSignature: 'Verified & Signed (Principal)',
    principalSignatureDate: '2025-09-30',
    isSigned: true,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-wdot-006',
        type: 'pdf',
        title: 'Hindi Pakhwada Results & Report.pdf',
        fileName: 'Hindi_Pakhwada_Report.pdf',
        fileSize: '380 KB',
        uploadedAt: '2025-09-25'
      }
    ],
    remarks: 'PT-1 mark tabulation completed on time.',
    templatePageRef: 52
  },
  {
    id: 'wdot-26-007',
    month: 'October',
    details: 'In-Charge of Vidyalaya Level Rashtriya Ekta Parv & Kala Utsav competitions. Coordinated escort duty for students participating in KVS Regional Sports Meet (Athletics & Badminton).',
    principalSignature: 'Verified & Signed (Principal)',
    principalSignatureDate: '2025-10-31',
    isSigned: true,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-wdot-007',
        type: 'pdf',
        title: 'Escort Teacher Deputation Order.pdf',
        fileName: 'Regional_Meet_Escort_Order.pdf',
        fileSize: '510 KB',
        uploadedAt: '2025-10-12'
      }
    ],
    remarks: 'Students won 3 Gold and 2 Silver medals at Regional Sports Meet.',
    templatePageRef: 52
  },
  {
    id: 'wdot-26-008',
    month: 'November',
    details: 'Convenor for National Science Day & KVS Jawaharlal Nehru Science Exhibition school level models. Supervised Vidyalaya Swachhata Pakhwada activities and campus cleanliness drive.',
    principalSignature: 'Verified & Signed (Vice Principal)',
    principalSignatureDate: '2025-11-30',
    isSigned: true,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-wdot-008',
        type: 'photo',
        title: 'Science Exhibition Working Model Exhibit',
        fileName: 'Science_Exhibition_Models.jpg',
        fileSize: '2.1 MB',
        uploadedAt: '2025-11-20'
      }
    ],
    remarks: '4 exhibits selected for KVS National Science Exhibition.',
    templatePageRef: 52
  },
  {
    id: 'wdot-26-009',
    month: 'December',
    details: 'Assisted in KVS Foundation Day celebration arrangements and alumni interaction session. Coordinated conduct of Half-Yearly Examinations and Centralized Question Paper distribution.',
    principalSignature: 'Verified & Signed (Principal)',
    principalSignatureDate: '2025-12-31',
    isSigned: true,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-wdot-009',
        type: 'pdf',
        title: 'Half Yearly Examination Duty Roster.pdf',
        fileName: 'HY_Exam_Duty_Roster.pdf',
        fileSize: '490 KB',
        uploadedAt: '2025-12-05'
      }
    ],
    remarks: 'Exam invigilation and answer sheet evaluation completed smoothly.',
    templatePageRef: 52
  },
  {
    id: 'wdot-26-010',
    month: 'January',
    details: 'Coordinated Republic Day march past practice and flag unfurling protocol. Conducted Pariksha Pe Charcha 2026 live telecast arrangement in Vidyalaya multipurpose hall for 450+ students.',
    principalSignature: 'Verified & Signed (Principal)',
    principalSignatureDate: '2026-01-31',
    isSigned: true,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-wdot-010',
        type: 'photo',
        title: 'Pariksha Pe Charcha Live Telecast in Auditorium',
        fileName: 'PPC_Live_Hall_Setup.jpg',
        fileSize: '1.9 MB',
        uploadedAt: '2026-01-27'
      }
    ],
    remarks: '100% student and parent registration achieved for PPC 2026.',
    templatePageRef: 52
  },
  {
    id: 'wdot-26-011',
    month: 'February',
    details: 'Appointed as Assistant Superintendent for CBSE Class X & XII Board Examination Centre. Prepared and verified student subject-wise admit cards and internal assessment moderation portals.',
    principalSignature: 'Verified & Signed (Principal)',
    principalSignatureDate: '2026-02-28',
    isSigned: true,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-wdot-011',
        type: 'pdf',
        title: 'CBSE Board Examination Centre Appointment Order.pdf',
        fileName: 'CBSE_Centre_Superintendent_Order.pdf',
        fileSize: '720 KB',
        uploadedAt: '2026-02-10'
      }
    ],
    remarks: 'Board exam centre protocol maintained with zero discrepancies.',
    templatePageRef: 52
  },
  {
    id: 'wdot-26-012',
    month: 'March',
    details: 'Prepared consolidated Annual Results, Progress Report Cards, and Promotion Lists for Classes VI to IX & XI. Supervised new session textbook distribution from NCERT/KVS regional repository.',
    principalSignature: 'Verified & Signed (Principal)',
    principalSignatureDate: '2026-03-31',
    isSigned: true,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-wdot-012',
        type: 'pdf',
        title: 'Annual Result Tabulation Sheet & Promotion Gazette.pdf',
        fileName: 'Annual_Promotion_Gazette_2026.pdf',
        fileSize: '1.1 MB',
        uploadedAt: '2026-03-28'
      }
    ],
    remarks: 'Session 2025-26 successfully concluded with 100% syllabus coverage.',
    templatePageRef: 52
  }
];

/**
 * Module 27: 27. कक्षा गतिविधियों में प्रयुक्त आईसीटी/डिजिटल प्रौद्योगिकी का विवरण
 * DETAILS OF ICT/DIGITAL TECHNOLOGY USED DURING CLASSROOM TRANSACTION (2 Pages)
 * Columns: Date, Class & Section, Period, Sub, Topic & Description of e-content, Principal's Sign
 */
export const DEFAULT_ICT_USAGE_27: IctClassroomUsage27Record[] = [
  {
    id: 'ict-27-001',
    slNo: 1,
    date: '14/07/2025',
    className: 'Class X',
    section: 'A',
    period: 'Period 2',
    subject: 'Mathematics (041)',
    topicAndEContentDescription: 'Quadratic Equations: Demonstrated standard form ax²+bx+c=0 roots derivation using GeoGebra Dynamic Grapher and DIKSHA 3D Interactive module QR-Code MAT1004.',
    principalSign: 'Verified & Signed',
    isSigned: true,
    pageNumber: 1,
    attachments: [
      {
        id: 'att-ict-001',
        type: 'photo',
        title: 'GeoGebra Parabola Graph on Smartboard',
        fileName: 'geogebra_quadratic_demo.jpg',
        fileSize: '1.2 MB',
        uploadedAt: '2025-07-14'
      }
    ],
    remarks: 'Students visualized discriminant D>0, D=0, D<0 real root intersections clearly.',
    templatePageRef: 27
  },
  {
    id: 'ict-27-002',
    slNo: 2,
    date: '22/07/2025',
    className: 'Class X',
    section: 'B',
    period: 'Period 4',
    subject: 'Science (086)',
    topicAndEContentDescription: 'Chemical Reactions & Equations: Conducted virtual balancing of redox reactions using PhET Interactive Simulations (Colorado University) and PM eVidya video lesson.',
    principalSign: 'Verified & Signed',
    isSigned: true,
    pageNumber: 1,
    attachments: [
      {
        id: 'att-ict-002',
        type: 'video',
        title: 'PhET Virtual Lab Screen Recording',
        fileName: 'phet_chemical_balancing.mp4',
        fileSize: '4.8 MB',
        uploadedAt: '2025-07-22'
      }
    ],
    remarks: 'High student engagement in virtual beaker titration and gas evolution observation.',
    templatePageRef: 27
  },
  {
    id: 'ict-27-003',
    slNo: 3,
    date: '05/08/2025',
    className: 'Class IX',
    section: 'A',
    period: 'Period 1',
    subject: 'Mathematics (041)',
    topicAndEContentDescription: 'Coordinate Geometry: Cartesian plane plotting, quadrant identification, and distance formulation via NCERT e-Pathshala interactive animations and Kahoot live quiz.',
    principalSign: 'Verified & Signed',
    isSigned: true,
    pageNumber: 1,
    attachments: [
      {
        id: 'att-ict-003',
        type: 'pdf',
        title: 'Kahoot Quiz Results & Leaderboard.pdf',
        fileName: 'Coordinate_Kahoot_Summary.pdf',
        fileSize: '320 KB',
        uploadedAt: '2025-08-05'
      }
    ],
    remarks: '32 out of 35 students achieved 100% in quadrant coordinates quiz.',
    templatePageRef: 27
  },
  {
    id: 'ict-27-004',
    slNo: 4,
    date: '18/08/2025',
    className: 'Class IX',
    section: 'B',
    period: 'Period 3',
    subject: 'Social Science (087)',
    topicAndEContentDescription: 'Physical Features of India: Explored Himalayas, Northern Plains, and Coastal regions using Google Earth 3D Satellite Flythrough and Bhasha Sangam cultural audio clips.',
    principalSign: 'Verified & Signed',
    isSigned: true,
    pageNumber: 1,
    attachments: [
      {
        id: 'att-ict-004',
        type: 'photo',
        title: 'Google Earth 3D Topography Projection',
        fileName: 'google_earth_himalayas.jpg',
        fileSize: '1.6 MB',
        uploadedAt: '2025-08-18'
      }
    ],
    remarks: 'Relief features and river drainage basins visualized effectively.',
    templatePageRef: 27
  },
  {
    id: 'ict-27-005',
    slNo: 5,
    date: '02/09/2025',
    className: 'Class X',
    section: 'A',
    period: 'Period 5',
    subject: 'English Language & Literature (184)',
    topicAndEContentDescription: 'A Letter to God (Lencho): English pronunciation and tone modulation using DIKSHA Audio e-Story and AI-powered Voice Assessor for interactive peer reading.',
    principalSign: 'Verified & Signed',
    isSigned: true,
    pageNumber: 2,
    attachments: [
      {
        id: 'att-ict-005',
        type: 'audio',
        title: 'Lencho Letter Pronunciation Audio Track',
        fileName: 'lencho_audio_narration.mp3',
        fileSize: '2.8 MB',
        uploadedAt: '2025-09-02'
      }
    ],
    remarks: 'Fluency and voice modulation improved significantly during roleplay.',
    templatePageRef: 27
  },
  {
    id: 'ict-27-006',
    slNo: 6,
    date: '16/09/2025',
    className: 'Class X',
    section: 'B',
    period: 'Period 2',
    subject: 'Science (086)',
    topicAndEContentDescription: 'Light - Reflection & Refraction: Ray diagram ray optics simulation using OPhysics interactive mirrors and lenses applet on Interactive Flat Panel (IFP).',
    principalSign: 'Verified & Signed',
    isSigned: true,
    pageNumber: 2,
    attachments: [
      {
        id: 'att-ict-006',
        type: 'photo',
        title: 'IFP Convex Lens Ray Diagram Interactive Session',
        fileName: 'ifp_lens_ray_diagram.jpg',
        fileSize: '1.4 MB',
        uploadedAt: '2025-09-16'
      }
    ],
    remarks: 'Concave and convex focal point ray tracing mastered by students.',
    templatePageRef: 27
  }
];

/**
 * Module 31(a): 31(a) शिक्षक द्वारा इनोवेशन एवं एक्सपेरीमेंटेशन हेतु लिए गए प्रोजेक्ट
 * PROJECTS UNDERTAKEN BY THE TEACHER FOR INNOVATION EXPERIMENTATION
 * Columns: Class & Section, Subject, Brief of Project & Execution
 */
export const DEFAULT_INNOVATION_PROJECTS_31A: TeacherInnovationProject31aRecord[] = [
  {
    id: 'inno-31a-001',
    slNo: 1,
    className: 'Class IX & X',
    section: 'A & B',
    subject: 'Mathematics (041) & STEM',
    briefOfProjectAndExecution: 'Project "GeoGebra Explorers: Visualizing Abstract Geometry through Dynamic Modeling". Implemented weekly hands-on 3D geometry exploration where students construct dynamic geometric theorems on school tablets. Organized bi-weekly peer discovery circles and recorded mathematical inquiry podcasts.',
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-inno-001',
        type: 'photo',
        title: 'Students dynamic modeling in Maths Lab',
        fileName: 'geogebra_project_lab.jpg',
        fileSize: '1.5 MB',
        uploadedAt: '2025-08-15'
      },
      {
        id: 'att-inno-002',
        type: 'pdf',
        title: 'Action Research Project Proposal & Rubrics.pdf',
        fileName: 'Innovation_Project_Proposal_2025.pdf',
        fileSize: '680 KB',
        uploadedAt: '2025-08-15'
      }
    ],
    remarks: 'Submitted for KVS Regional Innovation & Experimentation Award 2025.',
    templatePageRef: 31
  },
  {
    id: 'inno-31a-002',
    slNo: 2,
    className: 'Class VI to VIII',
    section: 'All Sections',
    subject: 'Experiential Science & Ecology',
    briefOfProjectAndExecution: 'Project "Green Vidyalaya Micro-Composting & Biodiversity QR-Tagging". Students catalogued 42 indigenous campus tree species, created digital botanical profile QR tags linked to audio guides, and managed a zero-waste biodegradable waste compost unit producing 120 kg organic manure for the Vidyalaya herbal garden.',
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-inno-003',
        type: 'video',
        title: 'Herbal Garden QR Tagging Project Walkthrough',
        fileName: 'composting_project_video.mp4',
        fileSize: '5.2 MB',
        uploadedAt: '2025-10-20'
      }
    ],
    remarks: 'Recognized with Green School Certificate by KVS Regional Office.',
    templatePageRef: 31
  }
];

/**
 * Module 31(b): 31(b) किये गए सर्वोत्तम अभ्यासों की सूची
 * LIST OF BEST PRACTICES UNDERTAKEN
 * Columns: S.N., Description, Outcome
 */
export const DEFAULT_BEST_PRACTICES_31B: TeacherBestPractice31bRecord[] = [
  {
    id: 'bp-31b-001',
    sn: 1,
    description: 'Zero-Period Peer Tutoring Circles: Pairing high-achieving student mentors with learners requiring remedial support for 20 minutes before morning assembly with guided formula flashcards.',
    outcome: '34% improvement in periodic test marks of low-scoring students and enhanced leadership/communication skills among student mentors.',
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-bp-001',
        type: 'photo',
        title: 'Morning Peer Tutoring Session in Action',
        fileName: 'peer_tutoring_session.jpg',
        fileSize: '1.3 MB',
        uploadedAt: '2025-09-10'
      }
    ],
    remarks: 'Adopted as standard practice across all secondary sections in Vidyalaya.',
    templatePageRef: 31
  },
  {
    id: 'bp-31b-002',
    sn: 2,
    description: 'Gamified "Math Olympiad Challenge of the Week" on Vidyalaya Corridor Bulletin Board featuring logic puzzles, riddle cards, and QR-code solution submissions.',
    outcome: 'Over 180+ weekly student submissions; 14 students qualified for KVS Regional Mathematical Olympiad Stage 2.',
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-bp-002',
        type: 'pdf',
        title: 'Weekly Puzzle Bank & Student Solution Samples.pdf',
        fileName: 'Math_Challenge_Samples.pdf',
        fileSize: '450 KB',
        uploadedAt: '2025-10-05'
      }
    ],
    remarks: 'Stimulated logical thinking and enthusiasm across Classes VI to XII.',
    templatePageRef: 31
  },
  {
    id: 'bp-31b-003',
    sn: 3,
    description: 'Continuous Audio-Visual Student Reflection Logs: Students record a 60-second summary of key concepts learned at the end of each major unit using school tablets.',
    outcome: 'Significantly enhanced retention of scientific definitions and eliminated conceptual misconceptions early.',
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-bp-003',
        type: 'audio',
        title: 'Student 60-Second Concept Reflection Clip',
        fileName: 'student_reflection_audio.mp3',
        fileSize: '1.8 MB',
        uploadedAt: '2025-11-12'
      }
    ],
    remarks: 'Valuable feedback tool for customized lesson planning.',
    templatePageRef: 31
  }
];

/**
 * Module 28: 28. शैक्षणिक नुकसान की भरपाई के लिए कार्यक्रम
 * RECORD OF ACADEMIC LOSS COMPENSATION PROGRAMME (2 Pages)
 * Columns: Date, Name of student & class, Reason for Academic loss, Topic/ lesson compensated, Remarks
 */
export const DEFAULT_ACADEMIC_LOSS_28: AcademicLossCompensation28Record[] = [
  {
    id: 'alc-28-001',
    slNo: 1,
    date: '14/08/2025',
    studentName: 'Aarav Sharma',
    className: 'Class IX',
    section: 'A',
    admissionNo: 'KV-2024-0412',
    reasonForLoss: 'Medical Leave (Dengue Fever - 12 days absence)',
    topicCompensated: 'Linear Equations in Two Variables: Algebraic methods of elimination & graphical interpretation of intersecting lines.',
    remarks: 'Conducted special zero-period tutorials; provided exemplar worksheet; scored 88% in post-compensation assessment.',
    pageNumber: 1,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-alc-001',
        type: 'pdf',
        title: 'Medical Certificate & Leave Slip.pdf',
        fileName: 'Medical_Leave_Certificate_Aarav.pdf',
        fileSize: '340 KB',
        uploadedAt: '2025-08-14'
      },
      {
        id: 'att-alc-002',
        type: 'photo',
        title: 'Corrected Remedial Practice Worksheet',
        fileName: 'linear_eq_worksheet_aarav.jpg',
        fileSize: '1.1 MB',
        uploadedAt: '2025-08-16'
      }
    ],
    templatePageRef: 28
  },
  {
    id: 'alc-28-002',
    slNo: 2,
    date: '22/08/2025',
    studentName: 'Priya Patel',
    className: 'Class X',
    section: 'B',
    admissionNo: 'KV-2023-0189',
    reasonForLoss: 'Represented Vidyalaya in KVS National Athletics Meet (Lucknow - 8 days)',
    topicCompensated: 'Introduction to Trigonometry: Trigonometric ratios of specific angles (0°, 30°, 45°, 60°, 90°) & standard identities.',
    remarks: 'Shared teacher summary notes and audio conceptual explanation; solved NCERT exercises under peer mentorship.',
    pageNumber: 1,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-alc-003',
        type: 'pdf',
        title: 'KVS Sports Deputation Duty Order.pdf',
        fileName: 'KVS_National_Sports_Duty_Order.pdf',
        fileSize: '510 KB',
        uploadedAt: '2025-08-22'
      },
      {
        id: 'att-alc-004',
        type: 'audio',
        title: 'Trigonometry Concept Audio Summary',
        fileName: 'trigonometry_audio_summary.mp3',
        fileSize: '2.4 MB',
        uploadedAt: '2025-08-23'
      }
    ],
    templatePageRef: 28
  },
  {
    id: 'alc-28-003',
    slNo: 3,
    date: '02/09/2025',
    studentName: 'Rohan Verma',
    className: 'Class IX',
    section: 'B',
    admissionNo: 'KV-2025-0872',
    reasonForLoss: 'Mid-Session Admission Transfer from KV Pune (Defence Relocation)',
    topicCompensated: 'Polynomials: Remainder Theorem, Factor Theorem & algebraic identities algebraic factorizations.',
    remarks: 'Assigned student study buddy; conducted 3 catch-up bridge sessions; notebook completion verified.',
    pageNumber: 1,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-alc-005',
        type: 'pdf',
        title: 'Transfer Certificate & Previous KV Marksheet.pdf',
        fileName: 'Transfer_Certificate_KV_Pune.pdf',
        fileSize: '430 KB',
        uploadedAt: '2025-09-02'
      }
    ],
    templatePageRef: 28
  },
  {
    id: 'alc-28-004',
    slNo: 4,
    date: '18/09/2025',
    studentName: 'Ananya Iyer',
    className: 'Class X',
    section: 'A',
    admissionNo: 'KV-2023-0104',
    reasonForLoss: 'Extended Leave due to Family Bereavement (10 days)',
    topicCompensated: 'Arithmetic Progressions: Finding nth term, common difference, and sum of first n terms with word problems.',
    remarks: 'Provided step-by-step solved problem bank; daily 15-minute doubt resolution during zero period.',
    pageNumber: 2,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-alc-006',
        type: 'pdf',
        title: 'AP Practice Problem Bank & Solution Key.pdf',
        fileName: 'AP_Practice_Sheet_Ananya.pdf',
        fileSize: '620 KB',
        uploadedAt: '2025-09-18'
      }
    ],
    templatePageRef: 28
  },
  {
    id: 'alc-28-005',
    slNo: 5,
    date: '06/10/2025',
    studentName: 'Kabir Singh',
    className: 'Class IX',
    section: 'A',
    admissionNo: 'KV-2024-0355',
    reasonForLoss: 'Viral Jaundice / Prolonged Illness during Term 1 Revision Week',
    topicCompensated: 'Coordinate Geometry: Cartesian plane, plotting points, distance formula & area calculation.',
    remarks: 'Conducted 1-on-1 practical graphing tutorial on smart interactive screen; doubts resolved.',
    pageNumber: 2,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-alc-007',
        type: 'photo',
        title: 'Smartboard Coordinate Geometry Graph Session',
        fileName: 'smartboard_graph_tutorial.jpg',
        fileSize: '1.3 MB',
        uploadedAt: '2025-10-06'
      }
    ],
    templatePageRef: 28
  },
  {
    id: 'alc-28-006',
    slNo: 6,
    date: '28/10/2025',
    studentName: 'Sneha Kumari',
    className: 'Class X',
    section: 'B',
    admissionNo: 'KV-2023-0241',
    reasonForLoss: 'Participated in National Children Science Congress (NCSC State Level)',
    topicCompensated: 'Surface Areas and Volumes: Combination of Solids (Cylinders, Cones, Hemispheres & Frustum).',
    remarks: 'Completed 3D manipulative model calculations; verified homework assignments and mock test.',
    pageNumber: 2,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-alc-008',
        type: 'pdf',
        title: 'NCSC State Level Participation Certificate.pdf',
        fileName: 'NCSC_State_Certificate_Sneha.pdf',
        fileSize: '490 KB',
        uploadedAt: '2025-10-28'
      }
    ],
    templatePageRef: 28
  }
];

/**
 * Module 29: 29. आनंदपूर्ण पठन कार्यान्वयन का अभिलेख
 * RECORD OF IMPLEMENTATION OF JOYFUL LEARNING
 * Columns: Class& Section with Date, Activity, Impact and Follow up
 */
export const DEFAULT_JOYFUL_LEARNING_29: JoyfulLearning29Record[] = [
  {
    id: 'jl-29-001',
    slNo: 1,
    date: '18/07/2025',
    className: 'Class IX',
    section: 'A',
    classSectionWithDate: 'Class IX-A (18/07/2025)',
    activity: 'Experiential "Mathematical Rangoli & Tessellations": Students used geometric compasses, circular symmetry, and polygonal angle rules to create mathematical patterns in the Vidyalaya courtyard.',
    impactAndFollowUp: '100% active student participation with high enthusiasm. Abstract geometry theorems transformed into vibrant visual art. Followed up with GeoGebra digital pattern creation homework.',
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-jl-001',
        type: 'photo',
        title: 'Math Rangoli Courtyard Exhibition Photo',
        fileName: 'math_rangoli_exhibition.jpg',
        fileSize: '1.7 MB',
        uploadedAt: '2025-07-18'
      },
      {
        id: 'att-jl-002',
        type: 'video',
        title: 'Students Explaining Symmetry in Rangoli Video',
        fileName: 'rangoli_symmetry_clip.mp4',
        fileSize: '5.2 MB',
        uploadedAt: '2025-07-18'
      }
    ],
    templatePageRef: 29
  },
  {
    id: 'jl-29-002',
    slNo: 2,
    date: '08/08/2025',
    className: 'Class X',
    section: 'B',
    classSectionWithDate: 'Class X-B (08/08/2025)',
    activity: 'Classroom "Mock Environmental Court & Roleplay": Students simulated a village panchayat dispute involving industrial pollution vs river rights, taking roles of judges, scientists, and villagers.',
    impactAndFollowUp: 'Fostered critical inquiry, spontaneous public speaking, and deep environmental empathy. 28 students actively participated in arguments. Followed up with drafting policy essays.',
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-jl-003',
        type: 'audio',
        title: 'Mock Court Roleplay Live Audio Session',
        fileName: 'mock_court_roleplay_audio.mp3',
        fileSize: '3.6 MB',
        uploadedAt: '2025-08-08'
      },
      {
        id: 'att-jl-004',
        type: 'pdf',
        title: 'Student Script & Evidence Briefing.pdf',
        fileName: 'Mock_Panchayat_Roleplay_Script.pdf',
        fileSize: '410 KB',
        uploadedAt: '2025-08-08'
      }
    ],
    templatePageRef: 29
  },
  {
    id: 'jl-29-003',
    slNo: 3,
    date: '26/08/2025',
    className: 'Class IX',
    section: 'B',
    classSectionWithDate: 'Class IX-B (26/08/2025)',
    activity: 'Gamified "Math-O-Quest" Live Speed Challenge: Used Kahoot interactive buzzers on school tablets to solve speed mental calculations, algebraic riddles, and visual puzzle cards.',
    impactAndFollowUp: 'High energy, laughter, and healthy team spirit. Eliminated math anxiety among reluctant learners. Class requested recurring bi-weekly championship rounds.',
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-jl-005',
        type: 'photo',
        title: 'Kahoot Live Tournament Scoreboard Screen',
        fileName: 'kahoot_math_tournament.jpg',
        fileSize: '1.2 MB',
        uploadedAt: '2025-08-26'
      }
    ],
    templatePageRef: 29
  },
  {
    id: 'jl-29-004',
    slNo: 4,
    date: '12/09/2025',
    className: 'Class X',
    section: 'A',
    classSectionWithDate: 'Class X-A (12/09/2025)',
    activity: 'Hands-on "Low-Cost Science Toy Workshop": Constructed balloon-powered rocket cars (Newton’s 3rd Law of Motion) and cardboard kaleidoscope tubes with mirrors.',
    impactAndFollowUp: 'Action-reaction principles and optical reflection rules grasped effortlessly through playful tactile tinkering. Followed up with group project displays in corridor showcase.',
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-jl-006',
        type: 'video',
        title: 'Balloon Rocket Race Testing in Classroom Video',
        fileName: 'balloon_rocket_car_race.mp4',
        fileSize: '6.1 MB',
        uploadedAt: '2025-09-12'
      }
    ],
    templatePageRef: 29
  },
  {
    id: 'jl-29-005',
    slNo: 5,
    date: '06/10/2025',
    className: 'Class IX & X',
    section: 'A & B',
    classSectionWithDate: 'Class IX & X (06/10/2025)',
    activity: 'Outdoor "Playground Solar Shadow & Sun Angle Tracking": Used meter scales and clinometers to calculate tree heights and sun elevation angles using basic trigonometry.',
    impactAndFollowUp: 'Demonstrated real-world practical utility of trigonometric ratios. Students connected textbook formula with actual outdoor observations and recorded data tables accurately.',
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-jl-007',
        type: 'photo',
        title: 'Outdoor Clinometer Measurement Activity Photo',
        fileName: 'outdoor_clinometer_activity.jpg',
        fileSize: '1.6 MB',
        uploadedAt: '2025-10-06'
      },
      {
        id: 'att-jl-008',
        type: 'pdf',
        title: 'Outdoor Sun Angle Measurement Log.pdf',
        fileName: 'Sun_Angle_Measurement_Log.pdf',
        fileSize: '380 KB',
        uploadedAt: '2025-10-06'
      }
    ],
    templatePageRef: 29
  }
];

/**
 * Module 30: 30. योग्यता आधारित परीक्षण सामग्री का रिकॉर्ड
 * RECORD OF COMPETENCY BASED TEST ITEMS UNDERTAKEN (2 Pages)
 * Columns: Date, Class, Description
 */
export const DEFAULT_COMPETENCY_TESTS_30: CompetencyTestItem30Record[] = [
  {
    id: 'cbt-30-001',
    slNo: 1,
    date: '24/07/2025',
    className: 'Class X-A',
    section: 'A',
    description: 'Case-Based Competency Test on Real-World Quadratic Modeling: Trajectory path of an archer’s arrow modelled by equation h(t) = -5t² + 20t + 2. Students evaluated vertex maximum height, time to hit ground, and domain constraints.',
    pageNumber: 1,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-cbt-001',
        type: 'pdf',
        title: 'Quadratic Arrow Trajectory Case Item.pdf',
        fileName: 'Quadratic_Modeling_Case_Test.pdf',
        fileSize: '480 KB',
        uploadedAt: '2025-07-24'
      },
      {
        id: 'att-cbt-002',
        type: 'photo',
        title: 'Sample Evaluated Student Answer Sheet',
        fileName: 'student_evaluated_case_sheet.jpg',
        fileSize: '1.3 MB',
        uploadedAt: '2025-07-25'
      }
    ],
    templatePageRef: 30
  },
  {
    id: 'cbt-30-002',
    slNo: 2,
    date: '12/08/2025',
    className: 'Class X-B',
    section: 'B',
    description: 'Assertion-Reasoning Diagnostic Item Bank on Chemical Reactions: 8 paired assertion-reason items assessing precipitation reactions, redox oxidation states, and endothermic decomposition mechanisms.',
    pageNumber: 1,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-cbt-003',
        type: 'pdf',
        title: 'Chemical Reactions Assertion-Reason Item Bank.pdf',
        fileName: 'Assertion_Reason_Item_Bank_Chem.pdf',
        fileSize: '540 KB',
        uploadedAt: '2025-08-12'
      }
    ],
    templatePageRef: 30
  },
  {
    id: 'cbt-30-003',
    slNo: 3,
    date: '28/08/2025',
    className: 'Class IX-A',
    section: 'A',
    description: 'Data-Interpretation & Graphical Competency Item on Linear Kinematics: Distance-time and velocity-time graphs interpreting uneven acceleration, vehicle braking distances, and area under curve calculation.',
    pageNumber: 1,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-cbt-004',
        type: 'pdf',
        title: 'Kinematics Graphical Item Paper.pdf',
        fileName: 'Kinematics_Graph_Competency_Test.pdf',
        fileSize: '510 KB',
        uploadedAt: '2025-08-28'
      }
    ],
    templatePageRef: 30
  },
  {
    id: 'cbt-30-004',
    slNo: 4,
    date: '15/09/2025',
    className: 'Class IX-B',
    section: 'B',
    description: 'Real-Life Problem Solving Test on Surface Area & Packaging Optimization: Designing minimum material tin can containers for a fruit juice manufacturer using cylindrical vs cuboidal volume-to-surface-area ratios.',
    pageNumber: 2,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-cbt-005',
        type: 'pdf',
        title: 'Packaging Optimization Problem Rubric.pdf',
        fileName: 'Packaging_Optimization_Rubric.pdf',
        fileSize: '420 KB',
        uploadedAt: '2025-09-15'
      }
    ],
    templatePageRef: 30
  },
  {
    id: 'cbt-30-005',
    slNo: 5,
    date: '08/10/2025',
    className: 'Class X-A & B',
    section: 'A & B',
    description: 'HOTS Inquiry & Source-Based Competency Test on Current Electricity: Multi-loop circuit analysis, calculating electric power consumption in household appliances, and auditing electricity meter tariff slabs.',
    pageNumber: 2,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-cbt-006',
        type: 'pdf',
        title: 'Electricity HOTS Source-Based Test.pdf',
        fileName: 'Electricity_HOTS_Competency_Test.pdf',
        fileSize: '650 KB',
        uploadedAt: '2025-10-08'
      },
      {
        id: 'att-cbt-007',
        type: 'audio',
        title: 'Student Viva Explanation Audio on Circuit Logic',
        fileName: 'student_circuit_viva_audio.mp3',
        fileSize: '2.1 MB',
        uploadedAt: '2025-10-08'
      }
    ],
    templatePageRef: 30
  },
  {
    id: 'cbt-30-006',
    slNo: 6,
    date: '04/11/2025',
    className: 'Class IX-A',
    section: 'A',
    description: 'Experimental Reasoning Item on Cell Biology & Osmosis: Analyzing potato osmometer observations, water potential concentration gradients, and explaining hypertonic plasmolysis micro-diagrams.',
    pageNumber: 2,
    academicYear: '2025-26',
    attachments: [
      {
        id: 'att-cbt-008',
        type: 'pdf',
        title: 'Osmosis Experimental Item Sheet.pdf',
        fileName: 'Osmosis_Experimental_Reasoning_Test.pdf',
        fileSize: '470 KB',
        uploadedAt: '2025-11-04'
      }
    ],
    templatePageRef: 30
  }
];

export {
  DEFAULT_STUDENTS,
  DEFAULT_PRACTICAL_ATTENDANCE,
  DEFAULT_SCHOLASTIC_SCORES_VI_VIII,
  DEFAULT_SCHOLASTIC_SCORES_IX_X
};

// ============================================================================
// VERSIONED SNAPSHOT & PROFILE SYSTEM API (HISTORY & BACKUP MANAGEMENT)
// ============================================================================

export const STORAGE_KEYS = [
  'setup:school',
  'setup:teacher',
  'setup:sessions',
  'setup:classes',
  'setup:subjects',
  'setup:timetable',
  'setup:period_timings',
  'setup:staff_details',
  'setup:calendar',
  'setup:exams',
  'setup:syllabus',
  'setup:lesson_plans',
  'setup:assessments',
  'setup:inspections',
  'setup:hourly_activities',
  'setup:evidence',
  'setup:calendar_sync',
  'setup:tasks',
  'setup:duty_presets',
  'setup:students',
  'setup:practical_attendance',
  'setup:scholastic_scores_vi_viii',
  'setup:scholastic_scores_ix_x',
  'setup:scores_class_x_17f',
  'setup:scores_class_xi_17g',
  'setup:scores_class_xii_17h',
  'setup:notebook_submissions_17j',
  'setup:practical_attendance_17i',
  'setup:monitoring_cum_reporting',
  'setup:late_bloomer_progress',
  'setup:nipun_meetings',
  'setup:scholastic_scores_i_ii',
  'setup:notebook_scores_iii_v',
  'setup:sea_scores_iii_v',
  'setup:scholastic_scores_iii_v',
  'setup:oral_reading_fluency_tara',
  'setup:work_done_other_than_teaching_26',
  'setup:ict_classroom_usage_27',
  'setup:academic_loss_28',
  'setup:joyful_learning_29',
  'setup:competency_tests_30',
  'setup:teacher_innovation_31a',
  'setup:teacher_best_practices_31b',
  'setup:teacher_attendance',
  'setup:leave_applications',
  'setup:on_duty_records',
  'setup:proxy_duty_assignments',
  'setup:leave_settings',
  'setup:student_attendance',
  'setup:class_daily_attendance',
  'setup:transfer_certificates',
  'setup:monthly_enrollment_snapshots',
  'setup:tickets',
  'setup:portfolio_templates',
  'setup:portfolio_assignments',
  'setup:responsibility_delegations',
  'setup:responsibility_requests',
  'setup:portfolio_suggestions',
  'setup:subject_responsibility_assignments',
  'auth:users_list',
  'auth:custom_roles'
] as const;

export async function getCurrentWorkspaceState(): Promise<Record<string, any>> {
  const dataMap: Record<string, any> = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('setup:') || key.startsWith('auth:') || key.startsWith('settings:'))) {
        const val = await db.get(key);
        if (val !== null && val !== undefined) {
          dataMap[key] = val;
        }
      }
    }
  }
  for (const k of STORAGE_KEYS) {
    if (dataMap[k] === undefined) {
      const val = await db.get(k);
      if (val !== null && val !== undefined) {
        dataMap[k] = val;
      }
    }
  }
  return dataMap;
}

export async function loadWorkspaceState(dataMap: Record<string, any>): Promise<void> {
  for (const [k, v] of Object.entries(dataMap)) {
    if (v !== undefined && v !== null) {
      await db.set(k, v);
    }
  }
}

export async function getSnapshotsHistory(): Promise<AppDataSnapshot[]> {
  const snapshots = await db.get<AppDataSnapshot[]>('history_snapshots');
  return snapshots || [];
}

export async function saveSnapshot(
  label: string,
  sessionName?: string,
  notes?: string
): Promise<AppDataSnapshot> {
  const currentState = await getCurrentWorkspaceState();
  const timetable = currentState['setup:timetable'] || [];
  const students = currentState['setup:students'] || [];
  const syllabus = currentState['setup:syllabus'] || [];
  const exams = currentState['setup:exams'] || [];
  const lessonPlans = currentState['setup:lesson_plans'] || [];
  
  const snapshot: AppDataSnapshot = {
    id: `snapshot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    label: label.trim() || `Revision Snapshot - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
    createdAt: new Date().toISOString(),
    sessionName: sessionName || '2025 - 2026 Term 1',
    isCurrent: false,
    notes: notes || '',
    dataCountSummary: {
      timetableCount: Array.isArray(timetable) ? timetable.length : 0,
      studentsCount: Array.isArray(students) ? students.length : 0,
      syllabusCount: Array.isArray(syllabus) ? syllabus.length : 0,
      examsCount: Array.isArray(exams) ? exams.length : 0,
      lessonPlansCount: Array.isArray(lessonPlans) ? lessonPlans.length : 0,
    },
    data: currentState
  };

  const history = await getSnapshotsHistory();
  const updatedHistory = [snapshot, ...history.map(s => ({ ...s, isCurrent: false }))];
  await db.set('history_snapshots', updatedHistory);
  return snapshot;
}

export async function restoreSnapshot(snapshotId: string): Promise<boolean> {
  const history = await getSnapshotsHistory();
  const target = history.find(s => s.id === snapshotId);
  if (!target || !target.data) return false;

  // Auto-backup current workspace state before restore to prevent accidental loss
  await saveSnapshot(`Auto-backup before restoring "${target.label}"`);

  // Load snapshot data into active workspace
  await loadWorkspaceState(target.data);

  // Update isCurrent status in history
  const updatedHistory = history.map(s => ({
    ...s,
    isCurrent: s.id === snapshotId
  }));
  await db.set('history_snapshots', updatedHistory);

  return true;
}

export async function deleteSnapshot(snapshotId: string): Promise<boolean> {
  const history = await getSnapshotsHistory();
  const updated = history.filter(s => s.id !== snapshotId);
  await db.set('history_snapshots', updated);
  return true;
}

export async function exportAllHistoryJSON(): Promise<void> {
  const currentState = await getCurrentWorkspaceState();
  const history = await getSnapshotsHistory();

  const backupPayload = {
    app: "KVS Teacher's Diary Versioned System",
    version: "2.5",
    exportedAt: new Date().toISOString(),
    currentActiveWorkspace: currentState,
    historySnapshots: history
  };

  const jsonStr = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kvs_teacher_diary_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportSingleSnapshotJSON(snapshotId: string): Promise<void> {
  const history = await getSnapshotsHistory();
  const target = history.find(s => s.id === snapshotId);
  if (!target) return;

  const jsonStr = JSON.stringify(target, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const sanitizedLabel = target.label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  a.download = `snapshot_${sanitizedLabel}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importBackupJSON(jsonContent: string): Promise<{ success: boolean; importedSnapshotsCount: number; error?: string }> {
  try {
    const parsed = JSON.parse(jsonContent);

    // Single Snapshot format
    if (parsed.id && parsed.data && parsed.label) {
      const history = await getSnapshotsHistory();
      const exists = history.some(s => s.id === parsed.id);
      if (!exists) {
        await db.set('history_snapshots', [parsed, ...history]);
      }
      if (parsed.data && typeof parsed.data === 'object') {
        await loadWorkspaceState(parsed.data);
      }
      return { success: true, importedSnapshotsCount: 1 };
    }

    // Full Backup Payload format
    if (parsed.currentActiveWorkspace || parsed.historySnapshots) {
      if (parsed.currentActiveWorkspace) {
        await loadWorkspaceState(parsed.currentActiveWorkspace);
      }
      let snapshotCount = 0;
      if (Array.isArray(parsed.historySnapshots)) {
        await db.set('history_snapshots', parsed.historySnapshots);
        snapshotCount = parsed.historySnapshots.length;
      }
      return { success: true, importedSnapshotsCount: snapshotCount || 1 };
    }

    // Flat key format like { "setup:school": ..., "setup:timetable": ... }
    let count = 0;
    for (const [key, val] of Object.entries(parsed)) {
      if (typeof key === 'string' && (key.startsWith('setup:') || key.startsWith('auth:') || key.startsWith('settings:'))) {
        if (val !== undefined && val !== null) {
          await db.set(key, val);
          count++;
        }
      }
    }
    if (count > 0) {
      return { success: true, importedSnapshotsCount: count };
    }

    return { success: false, importedSnapshotsCount: 0, error: "Unrecognized JSON format. Must be a valid snapshot or full backup file." };
  } catch (err: any) {
    return { success: false, importedSnapshotsCount: 0, error: err.message || "Failed to parse JSON file." };
  }
}

// ==========================================
// AUTHENTICATION & USER MANAGEMENT HELPERS
// ==========================================

export async function getUserAccounts(): Promise<UserAccount[]> {
  const users = await db.get<UserAccount[]>('auth:users_list');
  const hasDummyUsers = users && users.some(u => 
    u.id === 'user-dem-01' || u.name === 'Vikram Mehta' || u.name === 'Updesh Kumar' || u.name === 'Sunita Verma' || u.name === 'Anjali Deshmukh'
  );

  if (!users || users.length < 15 || hasDummyUsers) {
    await db.set('auth:users_list', DEFAULT_USER_ACCOUNTS);
    return DEFAULT_USER_ACCOUNTS;
  }
  return users;
}

export async function saveUserAccount(account: UserAccount): Promise<UserAccount[]> {
  const users = await getUserAccounts();
  const index = users.findIndex(u => u.id === account.id);
  let updated: UserAccount[];
  if (index >= 0) {
    updated = [...users];
    updated[index] = account;
  } else {
    updated = [account, ...users];
  }
  await db.set('auth:users_list', updated);
  
  // If editing current logged in user, update session as well
  const current = await getCurrentUser();
  if (current && current.id === account.id) {
    await setCurrentUser(account);
  }
  return updated;
}

export async function deleteUserAccount(userId: string): Promise<UserAccount[]> {
  const users = await getUserAccounts();
  const updated = users.filter(u => u.id !== userId);
  await db.set('auth:users_list', updated);
  return updated;
}

export async function getCurrentUser(): Promise<UserAccount | null> {
  const user = await db.get<UserAccount>('auth:current_user');
  if (!user) {
    const users = await getUserAccounts();
    return users[0] || null;
  }
  return user;
}

export async function setCurrentUser(user: UserAccount | null): Promise<void> {
  if (user) {
    await db.set('auth:current_user', user);
  } else {
    await db.remove('auth:current_user');
  }
}

function normalizeStaffKey(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^(mr|mrs|ms|dr|smt|shri|sh)\.?\s+/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Returns the comprehensive merged list of all 21 teaching/support staff.
 * Guarantees that Samya Raha, Karishma Kerketta, and all faculty are always present.
 */
export async function getMergedStaffList(): Promise<StaffDetailRecord[]> {
  const storedStaff = await db.get<StaffDetailRecord[]>('setup:staff_details');
  const userAccounts = await getUserAccounts();
  const staffMap = new Map<string, StaffDetailRecord>();

  const getStaffKey = (name?: string, code?: string) => {
    const k = normalizeStaffKey(name);
    if (k) return k;
    if (code) return String(code).trim().toLowerCase();
    return '';
  };

  // 1. Seed with ALL 21 DEFAULT_STAFF_DETAILS
  DEFAULT_STAFF_DETAILS.forEach(s => {
    const key = getStaffKey(s.name, s.employeeCode);
    if (key) staffMap.set(key, { ...s });
  });

  // 2. Merge storedStaff (preserve any user edits)
  if (storedStaff && storedStaff.length > 0) {
    storedStaff.forEach(s => {
      const key = getStaffKey(s.name, s.employeeCode);
      if (key) {
        const existing = staffMap.get(key) || s;
        staffMap.set(key, { ...existing, ...s });
      }
    });
  }

  // 3. Merge user accounts
  if (userAccounts && userAccounts.length > 0) {
    userAccounts.forEach(u => {
      const key = getStaffKey(u.name, u.employeeCode);
      if (key) {
        const existing = staffMap.get(key);
        if (existing) {
          staffMap.set(key, {
            ...existing,
            employeeCode: u.employeeCode || existing.employeeCode,
            name: existing.name || u.name,
            designation: existing.designation || u.designation || 'Teacher',
            email: existing.email || u.email
          });
        }
      }
    });
  }

  // 4. Hard-check: Guarantee Samya Raha & Karishma Kerketta are always included
  const samyaKey = 'samyaraha';
  const karishmaKey = 'karishmakerketta';
  if (!staffMap.has(samyaKey)) {
    const samyaDefault = DEFAULT_STAFF_DETAILS.find(s => normalizeStaffKey(s.name) === samyaKey);
    if (samyaDefault) staffMap.set(samyaKey, { ...samyaDefault });
  }
  if (!staffMap.has(karishmaKey)) {
    const karishmaDefault = DEFAULT_STAFF_DETAILS.find(s => normalizeStaffKey(s.name) === karishmaKey);
    if (karishmaDefault) staffMap.set(karishmaKey, { ...karishmaDefault });
  }

  // 5. Ensure all other default staff exist in the map
  DEFAULT_STAFF_DETAILS.forEach(s => {
    const key = getStaffKey(s.name, s.employeeCode);
    if (key && !staffMap.has(key)) {
      staffMap.set(key, { ...s });
    }
  });

  const finalStaff = Array.from(staffMap.values()).map((s, idx) => ({ ...s, serialNo: idx + 1 }));

  // Always keep storage updated with complete 21+ staff list
  if (!storedStaff || storedStaff.length < finalStaff.length || !storedStaff.some(s => normalizeStaffKey(s.name) === samyaKey) || !storedStaff.some(s => normalizeStaffKey(s.name) === karishmaKey)) {
    await db.set('setup:staff_details', finalStaff);
  }

  return finalStaff;
}

// ==========================================
// CHECKING & APPROVAL AUTHORITY HELPERS
// ==========================================

export async function getModuleApprovalRecords(): Promise<ModuleApprovalRecord[]> {
  const records = await db.get<ModuleApprovalRecord[]>('auth:approvals_list');
  return records || [];
}

export async function submitModuleForApproval(
  recordData: Omit<ModuleApprovalRecord, 'id' | 'submittedAt'>
): Promise<ModuleApprovalRecord> {
  const existing = await getModuleApprovalRecords();
  const newRecord: ModuleApprovalRecord = {
    ...recordData,
    id: `appr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    submittedAt: new Date().toISOString()
  };
  
  // Check if an existing approval record for this module & recordId exists
  const existingIndex = existing.findIndex(r => r.moduleKey === recordData.moduleKey && r.recordId === recordData.recordId);
  let updated: ModuleApprovalRecord[];
  if (existingIndex >= 0) {
    updated = [...existing];
    updated[existingIndex] = newRecord;
  } else {
    updated = [newRecord, ...existing];
  }
  await db.set('auth:approvals_list', updated);
  return newRecord;
}

export async function updateModuleApprovalStatus(
  approvalId: string,
  status: ApprovalStatus,
  remarks?: string,
  stamp: boolean = true,
  reviewedBy: string = 'Principal / Incharge'
): Promise<ModuleApprovalRecord[]> {
  const existing = await getModuleApprovalRecords();
  const updated = existing.map(r => {
    if (r.id === approvalId) {
      return {
        ...r,
        status,
        remarks: remarks !== undefined ? remarks : r.remarks,
        officialStampApplied: stamp,
        reviewedAt: new Date().toISOString(),
        reviewedBy
      };
    }
    return r;
  });
  await db.set('auth:approvals_list', updated);
  return updated;
}

export const DEFAULT_KVS_ROLES: CustomRoleDefinition[] = [
  {
    id: 'role-ct',
    name: 'Class Teacher',
    category: 'core',
    description: 'Class administrative & academic incharge, daily attendance register, report cards, student profiles, parent communication.',
    icon: 'Crown',
    isBuiltIn: true,
    defaultRoleLevel: 'In-Charge'
  },
  {
    id: 'role-st',
    name: 'Subject Teacher',
    category: 'core',
    description: 'Subject pedagogy, syllabus pacing, lesson plan execution, homework evaluation, diagnostic assessment.',
    icon: 'BookOpen',
    isBuiltIn: true,
    defaultRoleLevel: 'In-Charge'
  },
  {
    id: 'role-fln-obs',
    name: 'Foundational Stage Observer',
    category: 'academic',
    description: 'NIPUN Bharat & FLN Mission monitoring, foundational literacy/numeracy milestones, Balvatika to Class II pedagogical supervision.',
    icon: 'Eye',
    isBuiltIn: true,
    defaultRoleLevel: 'In-Charge'
  },
  {
    id: 'role-exam-ic',
    name: 'Exam Incharge Role',
    category: 'academic',
    description: 'Internal school examinations, PT-1/PT-2/Half-Yearly schedules, blueprint moderation, UBI portal marks uploading, report card preparation.',
    icon: 'FileCheck2',
    isBuiltIn: true,
    defaultRoleLevel: 'Convenor'
  },
  {
    id: 'role-cbse-ic',
    name: 'CBSE Incharge Role',
    category: 'academic',
    description: 'CBSE Board LOC registration, Class X/XII examination centre coordination, board practical exam conduction, marks entry.',
    icon: 'GraduationCap',
    isBuiltIn: true,
    defaultRoleLevel: 'Convenor'
  },
  {
    id: 'role-office-ic',
    name: 'Office I/c',
    category: 'administrative',
    description: 'Administrative liaison with Vidyalaya office, dispatch & receipt of dak/circulars, service book records verification, official correspondence.',
    icon: 'Building2',
    isBuiltIn: true,
    defaultRoleLevel: 'In-Charge'
  },
  {
    id: 'role-cla-ic',
    name: 'CLA I/c',
    category: 'academic',
    description: 'Continuous Learning Activities (CLA), activity-based experiential learning coordination, peer observation, teacher diary reviews.',
    icon: 'Layers',
    isBuiltIn: true,
    defaultRoleLevel: 'In-Charge'
  },
  {
    id: 'role-assembly-ic',
    name: 'Morning Assembly I/c',
    category: 'activity',
    description: 'Daily morning assembly program schedules, House duty roaster, pledge/thought/news, audio-visual system, discipline, special day celebrations.',
    icon: 'Mic',
    isBuiltIn: true,
    defaultRoleLevel: 'In-Charge'
  },
  {
    id: 'role-admission-ic',
    name: 'Admission I/c',
    category: 'administrative',
    description: 'KVS Online Admission Portal coordination, lottery generation, document scrutiny, RTE & category verification, admission register.',
    icon: 'UserPlus',
    isBuiltIn: true,
    defaultRoleLevel: 'Convenor'
  },
  {
    id: 'role-sports-ic',
    name: 'Sports I/c',
    category: 'activity',
    description: 'Physical & Health Education, sports inventory, KVS Regional & National Sports Meet coaching, Annual Sports Day, Fit India activities.',
    icon: 'Trophy',
    isBuiltIn: true,
    defaultRoleLevel: 'In-Charge'
  },
  {
    id: 'role-medical-ic',
    name: 'Medical I/c',
    category: 'welfare',
    description: 'Student Health Cards, First Aid room maintenance, Annual Medical Health Checkup camps, RBSK team coordination, hygiene awareness.',
    icon: 'HeartPulse',
    isBuiltIn: true,
    defaultRoleLevel: 'In-Charge'
  },
  {
    id: 'role-furniture-ic',
    name: 'Furniture I/c',
    category: 'logistics',
    description: 'Physical infrastructure & classroom dual desk inventory, stock register maintenance, annual physical verification, repair & condemnation.',
    icon: 'Armchair',
    isBuiltIn: true,
    defaultRoleLevel: 'In-Charge'
  }
];

export async function getCustomRoles(): Promise<CustomRoleDefinition[]> {
  const saved = await db.get<CustomRoleDefinition[]>('setup:custom_roles');
  if (saved && saved.length > 0) {
    return saved;
  }
  await db.set('setup:custom_roles', DEFAULT_KVS_ROLES);
  return DEFAULT_KVS_ROLES;
}

export async function saveCustomRoles(roles: CustomRoleDefinition[]): Promise<CustomRoleDefinition[]> {
  await db.set('setup:custom_roles', roles);
  return roles;
}

export async function addCustomRole(role: Omit<CustomRoleDefinition, 'id'>): Promise<CustomRoleDefinition[]> {
  const roles = await getCustomRoles();
  const newRole: CustomRoleDefinition = {
    ...role,
    id: `role-${Date.now()}`
  };
  const updated = [...roles, newRole];
  await saveCustomRoles(updated);
  return updated;
}

export async function updateCustomRole(id: string, patch: Partial<CustomRoleDefinition>): Promise<CustomRoleDefinition[]> {
  const roles = await getCustomRoles();
  const updated = roles.map(r => r.id === id ? { ...r, ...patch } : r);
  await saveCustomRoles(updated);
  return updated;
}

export async function deleteCustomRole(id: string): Promise<CustomRoleDefinition[]> {
  const roles = await getCustomRoles();
  const updated = roles.filter(r => r.id !== id);
  await saveCustomRoles(updated);
  return updated;
}

// -------------------------------------------------------------
// Unified Tag / Category Management System (Admin + Teacher Scoped)
// -------------------------------------------------------------

export const DEFAULT_ADMIN_TAGS: TaskTagDefinition[] = [
  {
    id: 'tag-teaching',
    name: 'Teaching',
    source: 'admin',
    color: '#8b5cf6', // purple
    isImmutableForTeacher: true,
    description: 'Direct classroom teaching, lesson execution, and student mentoring.'
  },
  {
    id: 'tag-gem',
    name: 'GeM Portal Admin',
    source: 'admin',
    color: '#f59e0b', // amber
    isImmutableForTeacher: true,
    description: 'Government e-Marketplace procurement, sanction orders, and CRAC generation.'
  },
  {
    id: 'tag-sports',
    name: 'Sports / RSM / NSM',
    source: 'admin',
    color: '#10b981', // emerald
    isImmutableForTeacher: true,
    description: 'KVS Regional/National sports coaching, physical conditioning, and athletics.'
  },
  {
    id: 'tag-assembly',
    name: 'Assembly & Duty',
    source: 'admin',
    color: '#06b6d4', // cyan
    isImmutableForTeacher: true,
    description: 'Morning assembly coordination, house duties, discipline, and gate duties.'
  },
  {
    id: 'tag-parade',
    name: 'Parade & Pyramid',
    source: 'admin',
    color: '#ec4899', // pink
    isImmutableForTeacher: true,
    description: 'March past, scouting & guiding parades, national festival drills.'
  },
  {
    id: 'tag-diary',
    name: 'Teacher Diary Docs',
    source: 'admin',
    color: '#6366f1', // indigo
    isImmutableForTeacher: true,
    description: 'Official Teacher’s Diary records, lesson planning, and syllabus registers.'
  },
  {
    id: 'tag-admin-duty',
    name: 'Administrative Duty',
    source: 'admin',
    color: '#f43f5e', // rose
    isImmutableForTeacher: true,
    description: 'Official institutional committees, admissions, examinations, and audit inspections.'
  }
];

export async function getGlobalAdminTags(): Promise<TaskTagDefinition[]> {
  const saved = await db.get<TaskTagDefinition[]>('setup:task_tags_global');
  if (saved && saved.length > 0) {
    return saved;
  }
  await db.set('setup:task_tags_global', DEFAULT_ADMIN_TAGS);
  return DEFAULT_ADMIN_TAGS;
}

export async function saveGlobalAdminTags(tags: TaskTagDefinition[]): Promise<TaskTagDefinition[]> {
  await db.set('setup:task_tags_global', tags);
  return tags;
}

export async function getTeacherPersonalTags(teacherCode?: string): Promise<TaskTagDefinition[]> {
  if (!teacherCode) return [];
  const key = `setup:task_tags_teacher_${teacherCode}`;
  return (await db.get<TaskTagDefinition[]>(key)) || [];
}

export async function saveTeacherPersonalTags(teacherCode: string, tags: TaskTagDefinition[]): Promise<TaskTagDefinition[]> {
  const key = `setup:task_tags_teacher_${teacherCode}`;
  await db.set(key, tags);
  return tags;
}

/**
 * Returns all tags available for a teacher:
 * Admin Global Tags (immutable) + Roles Assigned from Staff/Profile + Teacher's Personal Tags
 */
export async function getAllAvailableTags(teacherCode?: string): Promise<TaskTagDefinition[]> {
  const adminTags = await getGlobalAdminTags();
  const personalTags = await getTeacherPersonalTags(teacherCode);
  
  // Also dynamically merge any custom institutional roles as admin tags
  const customRoles = await getCustomRoles();
  const roleTags: TaskTagDefinition[] = customRoles.map(cr => ({
    id: `tag-role-${cr.id}`,
    name: cr.name,
    source: 'admin',
    color: '#0ea5e9', // sky
    isImmutableForTeacher: true,
    description: cr.description
  }));

  const allMap = new Map<string, TaskTagDefinition>();
  // 1. Admin tags first
  [...adminTags, ...roleTags].forEach(t => {
    allMap.set(t.name.toLowerCase().trim(), t);
  });
  // 2. Personal tags
  personalTags.forEach(t => {
    allMap.set(t.name.toLowerCase().trim(), t);
  });

  return Array.from(allMap.values());
}

// ============================================================================
// FIREBASE CLOUD FIRESTORE CENTRAL DATA SYNCHRONIZATION
// ============================================================================

/**
 * Pushes all current workspace data (timetables, 19 teachers, students, etc.) to Firebase Cloud Firestore.
 */
export async function syncAllToCloud(): Promise<{ success: boolean; count: number }> {
  try {
    const currentState = await getCurrentWorkspaceState();
    let count = 0;
    for (const [key, val] of Object.entries(currentState)) {
      if (val !== undefined && val !== null) {
        await firestoreSet(key, val);
        count++;
      }
    }
    return { success: true, count };
  } catch (err) {
    console.error('[Firestore] Failed to push all to cloud:', err);
    return { success: false, count: 0 };
  }
}

/**
 * Pulls the latest centralized data from Firebase Cloud Firestore into local storage.
 */
export async function syncAllFromCloud(): Promise<{ success: boolean; updatedCount: number }> {
  try {
    let updatedCount = 0;
    for (const k of STORAGE_KEYS) {
      const cloudVal = await firestoreGet(k);
      if (cloudVal !== null && cloudVal !== undefined) {
        await (window as any).storage.set(k, JSON.stringify(cloudVal));
        updatedCount++;
      }
    }
    return { success: true, updatedCount };
  } catch (err) {
    console.error('[Firestore] Failed to pull all from cloud:', err);
    return { success: false, updatedCount: 0 };
  }
}

/**
 * Startup synchronization engine:
 * 1. Checks if Cloud Firestore has saved data.
 * 2. If Cloud Firestore has data, hydrates local cache.
 * 3. If local has customized timetable (e.g. 19 teachers on localhost) and Cloud is empty, automatically seeds Cloud!
 */
export async function initCloudSync(): Promise<void> {
  try {
    const cloudTimetable = await firestoreGet<TimetableSlot[]>('setup:timetable');
    const localTimetable = await db.get<TimetableSlot[]>('setup:timetable');

    if (cloudTimetable && cloudTimetable.length > 0) {
      // Cloud has existing data -> pull updates into local storage
      console.log(`[Firestore] Syncing ${cloudTimetable.length} timetable slots from Cloud...`);
      await syncAllFromCloud();
    } else if (localTimetable && localTimetable.length > 0) {
      // Local has data -> push to initialize cloud database
      console.log(`[Firestore] Seeding Cloud Firestore with ${localTimetable.length} local timetable slots...`);
      await syncAllToCloud();
    }
  } catch (err) {
    console.warn('[Firestore] Initial cloud sync notice:', err);
  }
}

// Unified Active Working Date System Exports
export * from './activeDateContext';
