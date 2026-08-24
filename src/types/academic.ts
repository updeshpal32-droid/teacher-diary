export interface SchoolDetails {
  schoolName: string;
  kvCode: string;
  region: string;
  officialEmail: string;
  address: string;
  principalName: string;
  principalDesignation?: string;
  vicePrincipalName: string;
  phoneNo: string;
  website: string;
  schoolCode?: string;
  academicYear?: string;
  portalName?: string;
  cbseAffiliationNo?: string;
  cbseSchoolCode?: string;
  udiseCode?: string;
  bannerSubtitle?: string;
  logoUrl?: string;
}

export interface AcademicTarget {
  id: string;
  subjectCodeName: string; // e.g. "Mathematics (041)"
  classSection: string;   // e.g. "X-A"
  passPercentage: number;  // e.g. 100
  targetA1Count: number;   // e.g. 15
}

export interface TeacherRecord {
  teacherId: string;   // Unique primary key (Employee Code e.g. "CS.134497" or "76958")
  teacherName: string; // Official Name
  designation: string; // Designation e.g. "TGT(SST)", "PRT"
  school: string;      // School Name e.g. "KV KUTRA"
  updatedAt?: string;
}

export interface TeacherAchievement {
  id: string;
  category: 'Scholastic' | 'Co-Scholastic' | 'Professional';
  year: string; // e.g. "2024-2025"
  title: string; // e.g. "100% Pass Result in Class X Board Examination"
  level: 'School' | 'Cluster' | 'Regional' | 'National' | 'International';
  description: string;
  awardOrRecognition?: string;
}

export type RoleCategory = 'core' | 'academic' | 'administrative' | 'activity' | 'welfare' | 'logistics';

export interface CustomRoleDefinition {
  id: string;
  name: string;
  category: RoleCategory;
  description: string;
  icon?: string;
  isBuiltIn?: boolean;
  defaultRoleLevel?: 'In-Charge' | 'Convenor' | 'Member' | 'Coordinator';
}

export interface AcademicResponsibility {
  id: string;
  dutyName: string; // e.g. "Time-Table Committee Convenor", "Morning Assembly I/c", "Sports I/c"
  role: 'Convenor' | 'In-Charge' | 'Member' | 'Coordinator' | 'Advisor';
  levelOrClass: string; // e.g. "Secondary & Sr. Secondary (VI-XII)"
  academicYear: string; // e.g. "2026-2027"
  keyOutcomes: string; // e.g. "Prepared conflict-free master timetable with balanced workload distribution."
}

export interface KvsFlagshipContribution {
  id: string;
  programName: string; // e.g. "PM SHRI School Scheme", "NIPUN Bharat & FLN Mission", "Ek Bharat Shreshtha Bharat (EBSB)"
  role: string; // e.g. "Nodal Teacher / Activity Coordinator"
  targetGroup: string; // e.g. "Classes VI-X (450 Students)"
  actionsTaken: string; // e.g. "Organized paired-state cultural exchange exhibitions and language learning corners."
  measurableImpact: string; // e.g. "100% student participation; awarded 1st prize at Regional EBSB festival."
}

export interface TeacherProfile {
  name: string;
  designation: string;
  qualifications: string;
  seniorityNo: string;
  employeeCode: string;
  dob: string; // YYYY-MM-DD
  joiningDateKVS: string;
  joiningDatePresentKV: string;
  nccScoutingQualification: string;
  gpfCpfPranNo: string;
  panNo: string;
  aadharNo: string;
  residentialAddress: string;
  phoneNo: string;
  email: string;
  awardsWon: string;
  classesAndSubjectsTaught: string;
  classTeacherRole: string; // e.g. "Class Teacher X-A"
  coClassTeacherRole?: string; // e.g. "Co-Class Teacher II-A"
  bloodGroup: string;
  academicTargets: AcademicTarget[];
  photoUrl?: string;
  fullName?: string;
  primarySubject?: string;

  // P-15: 9(a) & 9(b) - Module: Teacher Profile Setup
  teachingPhilosophy?: string;
  achievementsList?: TeacherAchievement[];
  scholasticAchievementsText?: string;
  coScholasticAchievementsText?: string;

  // P-16: 10(a) & 10(b) - Module: Teacher Profile Setup
  academicResponsibilities?: AcademicResponsibility[];
  kvsFlagshipContributions?: KvsFlagshipContribution[];
}

/**
 * 20-Column Official Staff Details Record for KVS Vidyalaya Administration
 */
export interface StaffDetailRecord {
  id: string;
  serialNo: number; // S.N.
  name: string; // Name
  employeeCode: string; // Employee Code
  designation: string; // Designation (e.g. PGT Maths, TGT Science, PRT, etc.)
  employmentType?: 'Regular' | 'Contractual'; // Regular vs Contractual / Part-Time Faculty
  socialCategory: 'GEN' | 'OBC' | 'SC' | 'ST' | 'EWS' | string; // SocialCategory
  dob: string; // DOB (DD/MM/YYYY)
  joiningDateKVSWithDesignation: string; // Date of joining in KVS with designation
  joiningDatePresentKVWithDesignation: string; // Date of joining in Present KV with designation
  bankAccountNo: string; // BANK A/C No.
  ifscCode: string; // IFSC
  bankName: string; // BANK NAME
  highestAcademicAndProfessionalQual: string; // Highest Acad. Qual. with Professional Qualification
  permanentPostalAddress: string; // Permanent Postal Address
  email: string; // E-mail
  phoneCalls: string; // Phone No. for calls
  phoneWhatsapp: string; // Phone No. (Whatsapp)
  aadharNo: string; // Aadhar No
  pranOrPanNo: string; // PRAN /PAN No
  isMinority: string; // Minority? Yes/No Mention Category
  seniorityNumber: string; // SENIORITY NUMBER

  // Principal / Admin Checking, Approval and Suggestions Tracking
  approvalStatus?: 'Verified & Approved' | 'Pending Review' | 'Correction Requested';
  principalRemarks?: string;
  principalSuggestions?: string;
  approvedBy?: string;
  approvedDate?: string;

  // Linked Teacher Profile Bio-data
  profileData?: Partial<TeacherProfile>;
  
  // Attendance & Leave Ledger Tracking
  leaveEntitlementOverride?: {
    clBalance?: number;
    elBalance?: number;
    hplBalance?: number;
    commutedBalance?: number;
    specialClBalance?: number;
    cclBalance?: number;
  };
  vacationRemedialDutyAssignedMonths?: string[]; // e.g. ['2026-05', '2026-06'] -> If assigned, contractual CL = 0 for that month
  contractualJoiningDate?: string; // Date of current contract start
  contractualTenureEndDate?: string; // Contract expiry date

  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicSession {
  id: string;
  sessionName: string; // e.g. "2025-2026"
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ClassSection {
  id: string;
  className: string; // e.g. "VI", "VII", "VIII", "IX", "X", "XI", "XII"
  section: string;   // e.g. "A", "B", "C"
  classTeacherName: string;
  totalStudents: number;
}

export interface SubjectItem {
  id: string;
  subjectName: string; // e.g. "Mathematics"
  subjectCode: string; // e.g. "041"
  classLevel: string;  // e.g. "IX & X"
  targetPassRate: number;
  targetA1Count: number;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimetableSlot {
  id: string;
  day: DayOfWeek;
  period: number; // 1 to 9
  className: string;
  subjectName: string;
  roomNo?: string;
  teacherName?: string;
  teacherId?: string; // Teacher_ID foreign key
  timeSlot?: string;  // e.g. "07:50 - 08:30"
  isBreak?: boolean;
  breakName?: string;
  dayOfWeek?: string;
  periodNumber?: number;
  section?: string;
  // Arrangement / Substitution support
  isArrangement?: boolean;
  originalTeacherName?: string;
  arrangementTeacherName?: string;
  arrangementReason?: string;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: 'KVS Activity' | 'Gazetted Holiday' | 'Vacation' | 'Staff Meeting' | 'Subject Committee';
  description: string;
  templateRefPage: number;
}

export interface ExamSchedule {
  id: string;
  examName: string; // "PT-1", "PT-2", "Half Yearly", "PB-1", "PB-2", "AISSE", "AISSCE"
  classLevel: string; // "VI-VIII", "IX-X", "XI", "XII"
  subjectName: string;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
  instructions?: string;
}

export type SyllabusStatus =
  | 'Planned'
  | 'In Progress'
  | 'Completed'
  | 'Pending'
  | 'Revised'
  | 'Skipped'
  | 'Rescheduled';

export interface SyllabusItem {
  id: string;
  className: string; // e.g. "X"
  section: string;   // e.g. "A" or "All"
  subjectName: string; // e.g. "Mathematics (041)"
  month: string;      // "April", "May", "July", "August", "September", "October", "November", "December", "January", "February", "March"
  unitNo: string;     // e.g. "Unit 1"
  unitTitle: string;  // e.g. "Number Systems"
  chapterNo: string;  // e.g. "Chapter 1"
  chapterTitle: string; // e.g. "Real Numbers"
  teachingTarget: string; // Key learning targets and competencies
  workingDaysRequired: number; // e.g. 10
  periodsRequired: number;     // e.g. 14
  revisionPlan: string;  // Revision strategy & worksheets
  examinationPlan: string; // Alignment with PT-1, PT-2, Half Yearly, Board Exams
  projectWork: string;   // Art integrated / MDP project assignment
  practicalWork: string; // Maths Lab activity / Practical
  completionStatus: SyllabusStatus;
  targetCompletionDate: string; // YYYY-MM-DD
  actualCompletionDate?: string; // YYYY-MM-DD
  remarks?: string;
  templatePageRef?: number; // Default 18
  status?: string;
  chapterName?: string;
  subtopics?: string[];
  targetMonth?: string;
  allottedPeriods?: number;
}

export interface TemplatePageMap {
  pageNo: number;
  sectionTitle: string;
  digitalModule: string;
  autoFillStatus: 'Auto-Filled' | 'Manual Input' | 'Calculated';
  pageType: 'Header Form' | 'Data Table' | 'Instruction Rules' | 'Daily Log';
  description: string;
}

export type LessonPlanStatus =
  | 'Draft'
  | 'Completed'
  | 'In Progress'
  | 'Pending'
  | 'Revised'
  | 'Rescheduled'
  | 'Carried Forward';

export interface DailyLessonPlan {
  id: string;
  date: string; // YYYY-MM-DD
  day: string;  // e.g. "Monday"
  className: string; // e.g. "X"
  section: string;   // e.g. "A"
  periodNo: string;  // e.g. "2nd Period"
  subjectName: string; // e.g. "Mathematics (041)"
  unitNo: string;    // e.g. "Unit 1"
  chapterNo: string; // e.g. "Chapter 1"
  chapterTitle: string; // e.g. "Real Numbers"
  topic: string;     // e.g. "Irrational Numbers"
  subtopic: string;  // e.g. "Proof of Irrationality of √2 and √3"
  durationMinutes: number; // e.g. 40

  // Official KVS Lesson Plan Organiser Page 1 Header & Facts
  teacherName?: string;
  designation?: string;
  concept1Source?: 'Self' | 'Resource Pool' | '';
  concept2Source?: 'Self' | 'Resource Pool' | '';
  concept3Source?: 'Self' | 'Resource Pool' | '';

  // Page 1 Table & Reflection
  concept1Text?: string;
  concept2Text?: string;
  concept3Text?: string;
  learningOutcomes: string; // सीखने के परिणाम / Learning Outcomes (NCERT)
  pedagogicalStrategies?: string; // शैक्षणिक रणनीतियाँ / Pedagogical Strategies
  remedialPeriodsRequired?: string; // No. of periods required for remedial
  remedialConceptsRequired?: string; // Concepts for Which remedial classes are required

  // Official KVS Lesson Plan Organiser Page 2 Header & Developer
  chapterName?: string; // Name of chapter
  noOfPeriodsRequired?: string; // No of periods required
  noOfStudentsInClass?: string; // No of students in the class
  developerConcept1?: string;
  developerConcept2?: string;
  developerConcept3?: string;

  // Page 2 Content Columns
  integrationWithOtherSubjects?: string; // अन्य विषयों के साथ एकीकरण / Integration with other subjects
  assessmentItemFormat?: string; // मूल्यांकन / Assessment (Item Format)
  resourcesDigitalPhysical?: string; // संसाधन (डिजिटल/भौतिक) / Resources (Digital/Physical)
  realLifeApplications?: string; // वास्तविक जीवन अनुप्रयोग / Extension / Real life applications
  twentyFirstCenturySkills?: string; // 21st Century Skills / Value Education / Vocational skills

  // Page 2 Teacher Self-Assessment Checkboxes
  allStudentsEngaged?: 'YES' | 'NO' | '';
  ableToKeepTime?: 'YES' | 'NO' | '';
  questionsAppropriate?: 'YES' | 'NO' | '';
  implementationSatisfaction?: 'Partially satisfied' | 'Satisfied' | 'Unsatisfied' | '';
  movedStagesSuccessfully?: 'YES' | 'NO' | '';
  needModifications?: 'YES' | 'NO' | '';

  // Pedagogical and Content fields
  previousKnowledge: string;
  teachingObjectives: string;
  teachingLearningMaterials: string;
  teachingMethod: string;
  classroomActivity: string;
  blackboardSummary: string;
  assessmentQuestions: string;
  classwork: string;
  homework: string;
  remedialWork: string;
  enrichmentActivity: string;
  teacherReflection: string;
  completionStatus: LessonPlanStatus;
  remarks?: string;
  templatePageRef?: number; // Default 48 (Pages 48 & 49)
  carriedFromId?: string;   // ID of original plan if carried forward
  evidenceItems?: LessonEvidenceItem[];
  assessmentHomeworkAssigned?: boolean | string;
}

export interface WeeklyLessonPlanDay {
  dayNumber: number; // 1, 2, 3, 4, 5, 6
  dayTitle: string;
  subtopics: string;
  learningOutcomes: string;
  pedagogicalStrategy: string;
  teacherActivity: string;
  studentActivity: string;
  blackboardWork: string;
  classworkHomework: string;
  assessmentQuestion: string;
}

export interface WeeklyLessonPlan {
  id: string;
  weeklyTitle: string;
  subjectName: string;
  className: string;
  section: string;
  chapterTitle: string;
  totalPeriods: number;
  startDate: string;
  endDate: string;
  weeklyOverview: string;
  weeklyLearningOutcomes: string;
  weeklyAssessmentStrategy: string;
  days: WeeklyLessonPlanDay[];
  createdDate: string;
  chapterPdfName?: string;
  completionStatus: 'Draft' | 'Completed' | 'In Progress';
}

export type LessonEvidenceCategory =
  | 'Photo'
  | 'Video Clip'
  | 'Worksheet'
  | 'PDF Document'
  | 'Student Work Sample'
  | 'Experiment Evidence'
  | 'Activity Evidence'
  | 'Classroom Materials';

export interface LessonEvidenceItem {
  id: string;
  lessonPlanId: string;
  title: string;
  category: LessonEvidenceCategory;
  fileType: 'image' | 'video' | 'pdf' | 'document';
  fileUrl: string; // Base64 data URL or preview URL
  fileName: string;
  fileSize?: string;
  uploadDate: string; // YYYY-MM-DD
  caption: string;
  // Linked metadata
  className: string;
  section: string;
  subjectName: string;
  topic: string;
  isSelectedForAppendix?: boolean;
  storageLocation?: 'local' | 'google_drive';
  drivePath?: string;
}

export type AssessmentCategory =
  | 'Class Test'
  | 'Oral Questions'
  | 'Worksheet'
  | 'Homework'
  | 'Assignment'
  | 'Project Work'
  | 'Quiz'
  | 'Slow Learner Remedial'
  | 'Advanced Learner Enrichment'
  | 'Follow-up Action';

export interface AssessmentProgressRecord {
  id: string;
  className: string;
  section: string;
  subjectName: string;
  lessonPlanId?: string; // Optional link to Daily Lesson Plan
  topic: string;
  month: string; // e.g. "July 2025"
  date: string;  // YYYY-MM-DD
  assessmentType: AssessmentCategory;
  title: string;
  description: string;
  maxMarks?: number;
  averageScore?: number;
  // Specific required pedagogical assessment & progress fields:
  performanceRemarks: string;
  slowLearnerSupport: string;
  advancedLearnerActivity: string;
  remedialTeaching: string;
  enrichmentWork: string;
  followUpAction: string;
  templatePageRef?: number; // e.g. Page 50 / 52 / 54
}

export type ReviewerRole =
  | 'Teacher'
  | 'Coordinator'
  | 'Supervisor'
  | 'Principal'
  | 'Assistant Commissioner';

export type ReviewStatus =
  | 'Pending'
  | 'Approved'
  | 'Returned for Correction'
  | 'Inspected & Stamped';

export interface InspectionReviewRecord {
  id: string;
  recordType: 'Daily Lesson Plan' | 'Syllabus Plan' | 'Assessment Register' | 'Complete Teacher Diary';
  recordId: string;
  recordTitle: string;
  teacherName: string;
  className: string;
  subjectName: string;
  submissionDate: string;
  reviewDate?: string;
  reviewerName?: string;
  reviewerRole: ReviewerRole;
  reviewerDesignation?: string;
  status: ReviewStatus;
  remarks?: string;
  suggestions?: string;
  digitalSignatureName?: string;
  sealStampText?: string;
  templatePageRef: number; // e.g. Page 4, Page 48, Page 50
}

export type HourlyCategory =
  | 'Teaching'
  | 'GeM Portal Admin'
  | 'Sports / RSM / NSM'
  | 'Assembly & Duty'
  | 'Arrangement / Proxy Duty'
  | 'Parade & Pyramid'
  | 'Teacher Diary Docs'
  | 'Digital Records'
  | 'Administrative Duty'
  | 'Co-Curricular'
  | 'Other';

export type ActivityStatus = 'Done' | 'Pending' | 'Missed' | 'In Progress';

export type EisenhowerPriority =
  | 'Do First (Urgent & Important)'
  | 'Schedule (Important & Not Urgent)'
  | 'Delegate (Urgent & Not Important)'
  | 'Don\'t Do / Low Priority';

export interface ActivityEvidence {
  id: string;
  activityId?: string;
  fileType: 'image' | 'video' | 'document' | 'voice_note';
  fileName: string;
  fileUrl: string; // Data URL or storage link
  fileSize?: string;
  uploadedAt: string; // ISO verified timestamp
  timestampVerified: boolean;
  gpsLocation?: string;
  caption?: string;
}

export interface HourlyActivity {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  title: string;
  description: string;
  category: HourlyCategory;
  status: ActivityStatus;
  priority: EisenhowerPriority;
  className?: string;
  subjectName?: string;
  isOverlappingDuty?: boolean;
  overloadReason?: string;
  evidenceIds: string[];
  kanbanColumn: 'Pending' | 'In Progress' | 'Completed' | 'Delayed';
  // Role & Responsibility Linking (Phase 4)
  portfolioTemplateId?: string;
  portfolioTemplateName?: string;
  responsibilityId?: string;
  responsibilityTitle?: string;
  isDelegatedWork?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarSyncSetting {
  id: string;
  calendarName: string;
  category: HourlyCategory;
  color: string;
  syncEnabled: boolean;
  googleCalendarId?: string;
  sharedWithPrincipal: boolean;
  lastSyncedAt?: string;
}

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface DutyPreset {
  id: string;
  title: string;
  desc: string;
  category: HourlyCategory;
  priority: EisenhowerPriority;
  estimatedMinutes: number;
  subtasks: string[];
  recurringFrequency?: 'Daily' | 'Weekly' | 'Monthly';
}

export interface TaskListFilterRules {
  dateRange?: 'all' | 'today' | 'tomorrow' | 'next_7_days' | 'overdue' | 'no_date';
  priority?: EisenhowerPriority | 'all' | 'high_priority'; // high_priority = 'Do First (Urgent & Important)' or isTopPriority
  status?: 'all' | 'pending_or_in_progress' | 'completed' | 'deferred';
  category?: HourlyCategory | 'all';
  tag?: string;
}

export interface TaskList {
  id: string;
  name: string;
  type: 'regular' | 'smart';
  color?: string;
  icon?: string; // lucide icon identifier or emoji
  filterRules?: TaskListFilterRules;
  isSystem?: boolean; // System lists cannot be deleted
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskTagDefinition {
  id: string;
  name: string;
  source: 'admin' | 'teacher'; // 'admin' = Principal/Institutional assigned; 'teacher' = Personal custom tag
  color?: string;
  isImmutableForTeacher?: boolean; // True for admin-assigned institutional tags
  createdById?: string; // Employee code or 'admin'
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherTask {
  id: string;
  title: string;
  originalTitle?: string; // Original title before NLP extraction
  description?: string;
  category: HourlyCategory;
  priority: EisenhowerPriority;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Deferred';
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  listId?: string; // Associated TaskList ID (e.g. 'inbox', 'work', 'personal')
  recognizedDateText?: string; // e.g. "tomorrow at 5pm", "every Monday", "Aug 25"
  isSmartRecognized?: boolean; // Flag indicating NLP parsing was applied
  estimatedMinutes?: number;
  subtasks: TaskSubtask[];
  tags: string[];
  isRecurring?: boolean;
  recurringFrequency?: 'Daily' | 'Weekly' | 'Monthly';
  assignedTo?: string; // Self, Lab Attendant, Co-Teacher, Student Council
  assignedBy?: string; // e.g. "Self", "Principal Dr. R. K. Sharma", "Academic Incharge"
  assignedByRole?: 'Self' | 'Principal' | 'Incharge' | 'Committee';
  isTopPriority?: boolean;
  linkedClass?: string;
  linkedSubject?: string;
  overloadImpact?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIWorkloadAnalysisReport {
  id: string;
  generatedAt: string;
  periodRange: string;
  totalHoursLogged: number;
  teachingHours: number;
  adminHours: number;
  gemHours: number;
  sportsParadeHours: number;
  dutyHours: number;
  overloadScore: number; // 0-100
  overloadSummary: string;
  officialDefensibilityStatement: string;
  recommendations: string[];
  pendingTaskExplanations: { taskTitle: string; causeOfDelay: string }[];
}

export interface StudentProfile {
  id: string; // Unique primary ID
  sn: number | string; // S.N.
  studentName: string; // Name of the Student
  gender: 'MALE' | 'FEMALE' | 'OTHER' | string; // Gender
  dob: string; // DOB DD/MM/YYYY
  studentId: string; // STUDENT ID (e.g. KV-2025-1049)
  admissionDate: string; // Date of Admission DD/MM/YYYY
  penNo: string; // PEN NO. (From UDISE)
  apaarId: string; // APAAR ID No.
  fatherName: string; // FATHER NAME
  motherName: string; // MOTHER NAME
  contactNumber: string; // CONTACT NUMBER
  bloodGroup: string; // BLOOD GROUP
  height?: string | number; // HEIGHT (in cm)
  weight?: string | number; // WEIGHT (in KG)
  completeAddress?: string; // COMPLETE ADDRESS
  admissionCategory: string; // ADMISSION CATEGORY
  socialCategory: 'GEN' | 'OBC' | 'SC' | 'ST' | string; // SOCIAL CATEGORY
  minority: 'YES' | 'NO' | string; // MINORITY (YES/ NO)
  rte: 'YES' | 'NO' | string; // RTE (YES/NO)
  singleGirlChild: 'YES' | 'NO' | string; // SINGLE GIRL CHILD (Class 6 onwards)
  aadhaarNo: string; // AADHAAR NO. OF STUDENT
  studentEmail: string; // STUDENT EMAIL ID
  className: string; // e.g. "VI", "VII", "VIII", "IX", "X", "XI", "XII"
  section: string; // e.g. "A", "B", "C"
  rollNo?: number;
  photoUrl?: string;
  address?: string;
  remarks?: string;
  name?: string;
  admissionNo?: string;
}

export interface PracticalAttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  className: string; // e.g. "X"
  section: string; // e.g. "A"
  subjectName: string; // e.g. "Mathematics (041)" / "Physics (042)"
  practicalNo: string; // e.g. "Practical 1" or "Maths Lab 2"
  practicalTitle: string; // e.g. "Constructing Square Root Spiral on square grid"
  periodNo: string; // e.g. "4th Period"
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  attendanceMap: Record<string, 'P' | 'A' | 'L' | 'E'>; // studentId -> status (P: Present, A: Absent, L: Late, E: Excused)
  teacherSignature?: string;
  remarks?: string;
  linkedLessonPlanId?: string; // Links to DailyLessonPlan id
  syncedToLessonPlan?: boolean;
  templatePageRef?: number; // Default 29 (Page 29, 17(i))
}

export interface ScholasticScoreRecordVItoVIII {
  id: string;
  studentId: string; // Foreign key to student
  studentName: string;
  rollNo: number | string;
  className: string; // "VI", "VII", "VIII"
  section: string; // "A", "B"
  subjectName: string;
  academicYear: string; // "2025-2026"
  pt1: number | null; // PT-1 (Max 10)
  pt2: number | null; // PT-2 (Max 10)
  notebook: number | null; // Notebook Submission (Max 5)
  subjectEnrichment: number | null; // Subject Enrichment (Max 5)
  mdp: number | null; // Multi-Disciplinary Project (Max 5)
  learnersDiary: number | null; // Learners Diary / Portfolio (Max 5)
  halfYearly: number | null; // Half Yearly Exam (Max 80, scaled / raw)
  totalMarks: number; // Total out of 100
  percentage: number;
  grade: string; // A1, A2, B1, B2, C1, C2, D, E
  remarks?: string;
  templatePageRef?: number; // Default 22 (Page 22, 17(a))
}

export interface ScholasticScoreRecordIXtoX {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: number | string;
  className: string; // "IX", "X"
  section: string;
  subjectName: string;
  academicYear: string;
  ptAvg: number | null; // Best of PTs (Max 5)
  multipleAssessment: number | null; // Multiple Assessment (Max 5)
  portfolio: number | null; // Portfolio (Max 5)
  subjectEnrichment: number | null; // Subject Enrichment (Max 5)
  internalTotal: number; // Total Internal (Max 20)
  boardOrSeeExam: number | null; // Annual / Board Exam (Max 80)
  grandTotal: number; // Grand Total (Max 100)
  percentage: number;
  grade: string;
  remarks?: string;
  templatePageRef?: number; // Default 24 (Page 24, 17(d))
}

/**
 * 17(f) कक्षा 10 के अंकों का ब्यौरा (RECORD OF MARKS FOR CLASS - X) - 4 pages
 * Columns: Sl.No., Name of Student, MONTHLY TESTS (M-1..M-5), PERIODIC TESTS (PT-1, PT-2), HY, PB-1, PB-2, PB-3, AISSE, Signature of Parent
 */
export interface ClassXMarksRecord17f {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: number | string;
  className: string; // "X"
  section: string; // "A"
  subjectName: string;
  academicYear: string;
  m1: number | null;
  m2: number | null;
  m3: number | null;
  m4: number | null;
  m5: number | null;
  pt1: number | null;
  pt2: number | null;
  hy: number | null;
  pb1: number | null;
  pb2: number | null;
  pb3: number | null;
  aisse: number | null;
  parentSignature?: string;
  remarks?: string;
  templatePageRef?: number; // 17(f)
}

/**
 * 17(g) मूल्यांकन संरचना कक्षा-11 (ASSESSMENT STRUCTURE FOR CLASS- XI) - 6 pages
 * Columns: S.No, Name of the Student, Periodic Test 1, Half Yearly Exam, Periodic Test 2, Session Ending Exam (Theory Exam, Practical/Project/ASL), Remark
 */
export interface ClassXIAssessmentRecord17g {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: number | string;
  className: string; // "XI"
  section: string; // "A"
  subjectName: string;
  academicYear: string;
  pt1: number | null;
  halfYearly: number | null;
  pt2: number | null;
  seeTheory: number | null;
  seePractical: number | null;
  seeTotal?: number | null;
  remarks?: string;
  templatePageRef?: number; // 17(g)
}

/**
 * 17(h) कक्षा-12 के अंकों का ब्यौरा (RECORD OF MARKS FOR CLASS- XII) - 6 pages
 * Columns: Sl.No., Name of Student, MONTHLY TESTS (M-1..M-5), PERIODIC TESTS (PT-1, PT-2), HY, PB-1, PB-2, PB-3, AISSCE, Signature of Parent
 */
export interface ClassXIIMarksRecord17h {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: number | string;
  className: string; // "XII"
  section: string; // "A"
  subjectName: string;
  academicYear: string;
  m1: number | null;
  m2: number | null;
  m3: number | null;
  m4: number | null;
  m5: number | null;
  pt1: number | null;
  pt2: number | null;
  hy: number | null;
  pb1: number | null;
  pb2: number | null;
  pb3: number | null;
  aissce: number | null;
  parentSignature?: string;
  remarks?: string;
  templatePageRef?: number; // 17(h)
}

export interface MdpAipProjectRecord {
  id: string;
  projectType: 'MDP' | 'AIP' | 'Inter-Disciplinary' | 'Experiential'; // Multi-Disciplinary or Art Integrated Project
  title: string;
  theme: string;
  topic?: string; // e.g. "Fractions", "Symmetry & Patterns", "Quadratic Equations"
  mdpAssigned?: string; // Description of MDP assigned
  aipAssigned?: string; // Description of AIP assigned
  evaluationCriteria?: string; // e.g. "1. Concept Clarity (5M), 2. Art Integration (5M), 3. Research (5M), 4. Presentation (5M)"
  className: string;
  section: string;
  subjectName: string;
  pairedSubjects?: string; // e.g. "Mathematics + Art + Social Science"
  targetGroup: string;
  assignedDate: string;
  submissionDate: string;
  r1Content: number; // Max 5
  r2ArtIntegration: number; // Max 5
  r3ResearchCreativity: number; // Max 5
  r4Presentation: number; // Max 5
  totalMarks: number; // Max 20
  status: 'Assigned' | 'In Progress' | 'Evaluated' | 'Exhibited';
  remarks?: string;
  templatePageRef?: number; // Page 23
}

export interface SecondaryRemedialRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNo?: number | string;
  className: string;
  section: string;
  subjectName: string;
  diagnosticWeakness: string; // Specific TLO / Concept
  identifiedMonth: string;
  remedialStrategy: string;
  remedialDates: string; // e.g. "Aug 12 - Aug 20 (5 Periods)"
  initialMarks: number; // Score before remedial (e.g. 8/40)
  reTestMarks: number; // Score after remedial (e.g. 26/40)
  progressStatus: 'Achieved' | 'Developing' | 'Needs Further Attention' | 'Needs Ongoing Support';
  parentSignatureAcknowledged?: boolean;
  remarks?: string;
  templatePageRef?: number; // Pages 34-36
}

export interface ExemplaryChildRecord {
  id: string;
  slNo?: number;
  studentId?: string;
  studentName: string;
  rollNo?: number | string;
  className: string;
  section?: string;
  identifiedAreasOfStrengthAndStepsTaken?: string; // Column 4: Identified areas of strength and Steps taken up for further improvement
  improvementShown?: string; // Column 5: Improvement shown
  specialAptitude?: string; // e.g. "Olympiad Math", "Creative Writing", "Robotics & Science Exhibition"
  identifyingIndicators?: string;
  enrichmentStepsTaken?: string; // Advanced modules, mentoring, lab access
  achievementsAndAwards?: string; // e.g. "1st Prize at Regional Science Congress"
  attachments?: RemedialAttachmentItem[]; // Photos, audio viva, video demos, PDF certificates
  pageNumber?: number; // 1 or 2 (2 Pages)
  templatePageRef?: number; // Page 37
}

// ============================================================================
// KVS FOUNDATIONAL & PREPARATORY STAGE TEACHER'S DIARY (Balvatika to Class V)
// ============================================================================

/**
 * Global application diary mode switcher:
 * Supports partitioning views and records between Middle/Secondary (VI-XII)
 * and Foundational/Preparatory (Balvatika to V) stages.
 */
export type DiaryMode = 'middle-secondary' | 'foundational-preparatory';

/**
 * Common Term identifier for primary stage academic reporting (Term 1 / Term 2).
 */
export type PrimaryTerm = 1 | 2;

/**
 * Progress status for Targeted Learning Outcomes (TLOs) remediation.
 */
export type RemedialProgressStatus = 'No Progress' | 'Developing' | 'Achieved' | 'Not Started';

/**
 * Collaborative meeting categories for teacher diary logs.
 */
export type CollaborationMeetingType = 'staff' | 'subject_committee' | 'ptm';

/**
 * Foundational Stage rating scale for Classes I & II Continuous Assessment Cycles.
 */
export type FoundationalCycleRating = 'A' | 'B' | 'C';

/**
 * 8-point CBSE/KVS Primary Grading Scale for Scholastic Assessments (Classes III to V).
 */
export type CbsePrimaryGrade = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'D' | 'E';

/**
 * Oral Reading Fluency range classification based on WCPM benchmarks (TARA App).
 */
export type OrfRangeGroup = 'Below Base' | 'Within Base' | 'Above Base';

/**
 * Module 13: Monitoring cum Remedial Reporting Record
 * Tracks students who struggle to achieve Targeted Learning Outcomes (TLOs) over a 16-page ledger format.
 */
export interface MonitoringCumReportingRecord {
  id: string; // Primary Key
  studentId: string; // Reference to student profile
  classSectionId: string;
  subjectId: string;
  tloNotAchieved: string; // Description of TLO or learning area needing attention
  remedialStrategies: string; // Planned support/intervention
  progressStatus: RemedialProgressStatus; // 'No Progress' | 'Developing' | 'Achieved'
  updatedAt: string; // ISO timestamp
}

/**
 * Module 14(c): Record of Progress for Late Bloomers
 * Continuous progress tracker logging qualitative improvements over time.
 */
export interface LateBloomerProgressRecord {
  id: string;
  studentId: string;
  classSectionId: string;
  subjectId: string;
  month: string; // e.g., "April", "July", "August"
  observationalNotes: string; // Qualitative feedback on performance recovery
  testScoreProgress: string; // Description of grade/score movement
}

/**
 * Module 16: Gist of Minutes of NIPUN Meetings
 * Logs academic reviews and action items focused on Foundational Literacy and Numeracy (FLN).
 */
export interface NipunMeetingRecord {
  id: string;
  date: string; // YYYY-MM-DD
  agendaPoints: string;
  gistOfDiscussion: string;
  actionPoints: string[];
  actionTaken: string;
}

/**
 * Modules 17, 18, & 19: Staff, Subject Committee, and PTM Gists
 * Collaborative logging scoped by portal context and diary mode.
 */
export interface CollaborationMeetingRecord {
  id: string;
  meetingType: CollaborationMeetingType; // 'staff' | 'subject_committee' | 'ptm'
  diaryMode: DiaryMode; // 'middle-secondary' | 'foundational-preparatory'
  date: string;
  agenda: string;
  discussionSummary: string;
  decisionsMade: string[];
  remarks: string;
}

/**
 * Module 22: अभिभावक-अध्यापक बैठक का अभिलेख (RECORD OF PARENT-TEACHER MEETINGS - 4 pages)
 * Official KVS Teacher's Diary Pages 38 to 41 (Middle & Secondary Stage).
 * Columns: Sl No, Date, Name of the Student and Class, Suggestions, Parents Signature with Mobile No.
 * + Multi-file Evidence attachments (Photo, Audio viva/discussion note, Video, PDF attendance)
 */
export interface PtmMeetingRecord22 {
  id: string;
  slNo: number;
  date: string;
  studentId?: string;
  studentNameAndClass: string; // e.g. "Rohan Sharma (Class X-A)"
  studentName?: string;
  className?: string;
  section?: string;
  rollNo?: number | string;
  suggestions: string; // Detailed suggestions & discussion notes
  parentSignatureWithMobile: string; // e.g. "Signed (S. K. Sharma, 9876543210)"
  parentName?: string;
  parentMobileNo?: string;
  isSigned?: boolean;
  pageNumber: number; // 1 to 4 (4 Pages total, Pages 38 to 41)
  attachments?: RemedialAttachmentItem[]; // Photos, audio viva, video clips, PDFs
  remarks?: string;
  templatePageRef?: number; // 38 to 41
}

/**
 * Module 23: मासिक स्टाफ मीटिंग का कार्यवृत्त सार (GIST OF MINUTES OF THE STAFF MEETINGS - 5 pages)
 * Official KVS Teacher's Diary Pages 42 to 46 (Middle & Secondary Stage).
 * Columns: Month & Date, Important/Relevant Points, Action taken/ Follow up
 * + Multi-file Evidence attachments (Photo of signed minutes, Audio notes, Video, PDF circulars)
 */
export interface StaffMeetingRecord23 {
  id: string;
  slNo?: number;
  monthAndDate: string; // e.g. "July 2025 (05/07/2025)"
  date?: string;
  meetingTitle?: string;
  importantPoints: string; // Important/Relevant Points discussed in staff meeting
  actionTakenFollowUp: string; // Action taken/ Follow up
  pageNumber: number; // 1 to 5 (5 Pages total, Pages 42 to 46)
  attachments?: RemedialAttachmentItem[]; // Photos, audio recordings, video, PDFs
  remarks?: string;
  templatePageRef?: number; // 42 to 46
}

/**
 * Module 24: मासिक विषय समिति की बैठक का कार्यवृत्त सार (GIST OF THE MONTHLY SUBJECT COMMITTEE MEETINGS - 5 pages)
 * Official KVS Teacher's Diary Pages 47 to 51 (Middle & Secondary Stage).
 * Columns: Date of meeting, Gist of the Decisions/Suggestions, Follow Up actions
 * + Multi-file Evidence attachments (Photo of notes, Audio discussion, Video, PDF lesson planning)
 */
export interface SubjectCommitteeMeetingRecord24 {
  id: string;
  slNo?: number;
  dateOfMeeting: string; // e.g. "12/07/2025"
  subjectName?: string; // e.g. "Mathematics (041)"
  gistOfDecisionsSuggestions: string; // Gist of the Decisions/Suggestions
  followUpActions: string; // Follow Up actions
  pageNumber: number; // 1 to 5 (5 Pages total, Pages 47 to 51)
  attachments?: RemedialAttachmentItem[]; // Photos, audio, video, PDFs
  remarks?: string;
  templatePageRef?: number; // 47 to 51
}

/**
 * Module 21: Scholastic Assessment Record (Classes I & II)
 * Competency-specific evaluation across 8 Continuous Assessment Cycles.
 */
export interface ScholasticRecordClass1_2 {
  id: string;
  studentId: string;
  classSectionId: string;
  subjectId: string;
  cycleRatings: {
    [cycleNumber: number]: {
      [competencyKey: string]: FoundationalCycleRating; // 'A' | 'B' | 'C'
    };
  }; // Cycles 1 to 8, evaluating early developmental targets
}

/**
 * Monthly score breakdown for Notebook Correction (Classes III to V) - Max 20 marks.
 */
export interface MonthlyNotebookScore {
  regularity: number; // Max 5
  index: number;      // Max 5
  neatness: number;   // Max 5
  completion: number; // Max 5
  total: number;      // Auto-calculated (regularity + index + neatness + completion)
}

/**
 * Module 22(a) & 22(b): Notebook Correction Record (Classes III to V)
 * Monthly tracking of student notebook parameters mapping to a total of 20 marks.
 */
export interface NotebookRecordClass3_5 {
  id: string;
  studentId: string;
  classSectionId: string;
  subjectId: string;
  term: PrimaryTerm; // 1 | 2
  monthlyScores: {
    [month: string]: MonthlyNotebookScore;
  };
}

/**
 * Module 23(a): Planned Subject Enrichment Activities (Classes III to V)
 * List of Subject Enrichment Activities Planned (Term 1-2) - Page 17 (4 pages)
 */
export interface SeaPlanItem {
  id: string;
  slNo?: number | string;      // S.No.
  monthAndDate: string;        // Month & Date (e.g. 'April', 'July 15', 'August')
  activity: string;            // Activity Title / Theme / Task
  evaluationCriteria: string;  // Evaluation Criteria (R1: Content, R2: Fluency, R3: Creativity, R4: Presentation)
  remarks?: string;            // Pedagogical notes, resource materials, TLO links
  className?: string;          // e.g. "X", "VI", "IX"
  section?: string;            // e.g. "A", "B"
  classSectionId?: string;
  subjectId?: string;
  subjectName?: string;
  term?: PrimaryTerm;          // 1 | 2
}

/**
 * Rubric score breakdown for a single Subject Enrichment Activity (Max 20 marks).
 */
export interface SeaActivityRubricScores {
  r1: number; // Rubric 1 (Max 5)
  r2: number; // Rubric 2 (Max 5)
  r3: number; // Rubric 3 (Max 5)
  r4: number; // Rubric 4 (Max 5)
  total: number; // Auto-calculated (r1 + r2 + r3 + r4, out of 20)
}

export type SeaMonthlyRubricScore = SeaActivityRubricScores;

/**
 * Subject Enrichment Activity score container.
 */
export interface SeaActivityItem {
  activityName: string; // From 23(a) metadata
  scores: SeaActivityRubricScores;
}

/**
 * Module 23(a), (b), & (c): Subject Enrichment Activities (SEA - Classes III to V)
 * Records planned SEA criteria (23a) and Term 1 & Term 2 scoresheets (23b & 23c).
 */
export interface SeaRecordClass3_5 {
  id: string;
  studentId: string;
  classSectionId: string;
  subjectId: string;
  term: PrimaryTerm; // 1 | 2
  monthlyScores?: {
    [month: string]: SeaMonthlyRubricScore;
  };
  activities?: {
    activityName: string;
    scores: {
      r1: number;
      r2: number;
      r3: number;
      r4: number;
      total: number;
    };
  };
}

/**
 * Module 25 & 26: Scholastic Assessment Record (Classes III to V)
 * Consolidates continuous components into terminal percentages and CBSE/KVS grades.
 */
export interface ScholasticRecordClass3_5 {
  id: string;
  studentId: string;
  classSectionId: string;
  subjectId: string;
  term: PrimaryTerm; // 1 | 2
  periodicTest: number;     // Max 10 (Scaled)
  notebook: number;         // Max 5 (scaled from Module 22)
  sea: number;              // Max 5 (scaled from Module 23)
  mdp: number;              // Multi-Disciplinary Projects (Max 20 or 10)
  termEndExam: number;      // SEE Written Test (Max 30 or 40 or 60)
  total: number;            // Auto-calculated sum
  percentage: number;
  grade: CbsePrimaryGrade;   // 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'D' | 'E'

  // Exact Official Module 26 Page 22 Columns:
  ptOral?: number;          // PERIODIC TEST: ORAL (Max 10)
  ptPenPaper?: number;      // PERIODIC TEST: PEN PAPER (Max 30)
  ptTotal40?: number;       // PERIODIC TEST: TOTAL 40
  ptScaled10?: number;      // PERIODIC TEST: TOTAL 40 (10)
  mdp20?: number;           // MDP (Max 20)
  notebookRaw20?: number;   // NOTEBOOK SUBMISSION 20 (raw)
  notebookScaled5?: number; // NOTEBOOK SUBMISSION 20 (5)
  seaRaw20?: number;        // SUBJECT ENRICHMENT 20 (raw)
  seaScaled5?: number;      // SUBJECT ENRICHMENT 20 (5)
  seeOral?: number;         // SEE: ORAL (Max 20)
  seePenPaper?: number;     // SEE: PEN PAPER (Max 40)
  seeTotal60?: number;      // SEE: TOTAL (Max 60)
  grandTotal100?: number;   // GRAND TOTAL (Max 100)
}

/**
 * Grade count summary for Subject-Wise Result Analysis (Classes III to V).
 */
export interface PrimaryGradeCounts {
  A1: number;
  A2: number;
  B1: number;
  B2: number;
  C1: number;
  C2: number;
  D: number;
  E: number;
}

/**
 * Module 27: Subject-Wise Result Analysis (Classes III to V)
 * Official KVS Teacher's Diary Page 23 (2 pages - Landscape Layout).
 * Aggregates examination performance, qualified counts, and CBSE 8-point primary grade distribution (A1 to E).
 */
export interface ResultAnalysisClass3_5 {
  id: string;
  exam: string;                 // 'PT-1' | 'Term-1 (Half Yearly)' | 'PT-2' | 'Term-2 (Session Ending Exam)' | 'Pre-Board'
  subjectName: string;          // 'English' | 'Hindi' | 'Mathematics' | 'Environmental Studies (EVS)'
  subjectId?: string;
  className: string;            // 'Class III-A' | 'Class III-B' | 'Class IV-A' | 'Class V-A' etc.
  classSectionId?: string;
  term?: PrimaryTerm;           // 1 | 2
  studentsOnRoll: number;       // No. of Students on Roll
  totalOnRoll?: number;         // Alias
  appeared: number;             // No. Appeared
  totalAppeared?: number;       // Alias
  qualified: number;            // No. Qualified (A1 - D)
  passed?: number;              // Alias
  needsImprovement: number;     // No. Needs Improvement (Grade E)
  qualifiedPercentage: number;  // Qualified %
  passPercentage?: number;      // Alias
  gradeCounts: PrimaryGradeCounts; // A1, A2, B1, B2, C1, C2, D, E
  classAverage?: number;        // Class Average %
  performanceIndex?: number;    // KVS Performance Index (PI: 0 - 100)
  pi?: number;                  // Alias
  remarks?: string;
}

/**
 * Module 18(a): Subject-Wise Result Analysis (Classes VI to X)
 * Official KVS Teacher's Diary Page 31 (Landscape Layout).
 * 18(a) विषयानुसार परिणाम विश्लेषण (कक्षाएँ-6-10)
 * SUBJECT WISE RESULT ANALYSIS (FOR CLASSES- VI TO X)
 * Columns:
 * 1. UT / MT / HY / PB / SEE (Exam)
 * 2. Subject
 * 3. Class & Sec
 * 4. No. of Students on Roll
 * 5. Appeared
 * 6. Qualified
 * 7. Needs Improvement <33%
 * 8. Pass %
 * 9. 33% to <45%
 * 10. 45% to <60%
 * 11. 60% to <75%
 * 12. 75% to <90%
 * 13. 90% and above
 */
export interface ResultAnalysisClass6_10 {
  id: string;
  pageNo?: number;              // 1 | 2 | 3 | 4
  exam: string;                 // 'UT' | 'MT' | 'HY' | 'PB' | 'SEE' | 'Periodic Test 1 (PT-1)' | 'Half Yearly Exam' | 'Pre-Board' | 'Session Ending Exam (SEE)'
  subjectName: string;          // 'Mathematics' | 'Science' | 'Social Science' | 'English' | 'Hindi' | 'Sanskrit'
  subjectId?: string;
  className: string;            // 'Class VI-A' | 'Class VII-A' | 'Class VIII-B' | 'Class IX-A' | 'Class X-A' etc.
  classSectionId?: string;
  studentsOnRoll: number;       // No. of Students on Roll
  totalOnRoll?: number;         // Alias
  appeared: number;             // Appeared
  totalAppeared?: number;       // Alias
  qualified: number;            // Qualified (>= 33%)
  passed?: number;              // Alias
  needsImprovement: number;     // Needs Improvement <33%
  passPercentage: number;       // Pass % (Qualified / Appeared * 100)
  qualifiedPercentage?: number; // Alias
  range33to45: number;          // 33% to <45%
  range45to60: number;          // 45% to <60%
  range60to75: number;          // 60% to <75%
  range75to90: number;          // 75% to <90%
  range90Above: number;         // 90% and above
  classAverage?: number;        // Class Average %
  performanceIndex?: number;    // KVS Performance Index (PI: 0 - 100)
  pi?: number;                  // Alias
  highestScore?: number;
  lowestScore?: number;
  remarks?: string;
}

/**
 * Module 18(b): Subject-Wise Result Analysis (Classes XI & XII)
 * Official KVS Teacher's Diary Page 32 (Landscape Layout).
 * 18(b) विषयानुसार परिणाम विश्लेषण (कक्षाएँ-11 & 12)
 * SUBJECT WISE RESULT ANALYSIS (FOR CLASSES XI & XII)
 * Columns:
 * 1. UT / MT / HY / PB / SEE (Exam)
 * 2. Subject
 * 3. Class & Sec
 * 4. No. of Students on Roll
 * 5. Appeared
 * 6. Passed
 * 7. Failed
 * 8. Pass %
 * 9. 33% to <45%
 * 10. 45% to <60%
 * 11. 60% to <75%
 * 12. 75% to <90%
 * 13. 90% and above
 */
export interface ResultAnalysisClass11_12 {
  id: string;
  pageNo?: number;              // 1 | 2
  exam: string;                 // 'UT' | 'MT' | 'HY' | 'PB' | 'SEE' | 'PT-1' | 'Half Yearly Exam' | 'Pre-Board 1 (PB-1)' | 'Pre-Board 2 (PB-2)' | 'Session Ending Exam (SEE)' | 'AISSCE Board'
  subjectName: string;          // 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology' | 'Computer Science' | 'English Core' | 'Economics' | 'Accountancy' | 'Business Studies' | 'Hindi Core'
  subjectId?: string;
  className: string;            // 'Class XI-A' | 'Class XI-B' | 'Class XII-A' | 'Class XII-B' etc.
  classSectionId?: string;
  studentsOnRoll: number;       // No. of Students on Roll
  totalOnRoll?: number;         // Alias
  appeared: number;             // Appeared
  totalAppeared?: number;       // Alias
  passed: number;               // Passed (>= 33%)
  qualified?: number;           // Alias
  failed: number;               // Failed (< 33%)
  passPercentage: number;       // Pass % (Passed / Appeared * 100)
  qualifiedPercentage?: number; // Alias
  range33to45: number;          // 33% to <45%
  range45to60: number;          // 45% to <60%
  range60to75: number;          // 60% to <75%
  range75to90: number;          // 75% to <90%
  range90Above: number;         // 90% and above
  classAverage?: number;        // Class Average %
  performanceIndex?: number;    // KVS Performance Index (PI: 0 - 100)
  pi?: number;                  // Alias
  highestScore?: number;
  lowestScore?: number;
  remarks?: string;
}

/**
 * Module 19: विद्यार्थियों की क्षमता एवं उनके व्यवहार पर शिक्षक की टिप्पणी (2 pages)
 * Teacher's Observation on Students' Behaviour/Abilities (Discipline, Leadership quality etc.)
 * Official KVS Teacher's Diary Page 33 (Middle & Secondary Stage).
 * Columns:
 * 1. Name of Student
 * 2. Class
 * 3. Date & Place
 * 4. Objective Description
 * 5. Comments by the Observer
 */
export interface StudentBehaviourObservationRecord {
  id: string;
  studentId?: string;
  studentName: string;
  className: string; // e.g. "Class X-A", "Class IX-B", "Class XI-A", "Class XII-A"
  section?: string;
  dateAndPlace: string; // e.g. "2026-08-12 • Morning Assembly Ground"
  date?: string;
  place?: string;
  category?: 'Discipline' | 'Leadership quality' | 'Teamwork' | 'Academic Integrity' | 'Punctuality' | 'Empathy & Helpfulness' | 'Extracurricular Participation' | 'Initiative & Responsibility' | 'Other';
  objectiveDescription: string; // Detailed objective description of observed behaviour
  commentsByObserver: string;   // Observer's comments / Teacher remarks & guidance
  observerComments?: string;    // Alias
  observerName?: string;
  observerDesignation?: string;
  templatePageRef?: number;     // Default 33
}

/**
 * Diagnostic & Remedial Evidence Attachment Item
 * Supports Photo, Audio note, Video clip, and PDF document
 */
export interface RemedialAttachmentItem {
  id: string;
  type: 'photo' | 'audio' | 'video' | 'pdf' | 'other';
  title: string;
  dataUrl?: string; // Base64 data or object URL
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  notes?: string;
}

/**
 * Module 20(a): विशेष उपचारात्मक सहायता की आवश्यकता वाले विद्यार्थियों की सूची एवं सुधार हेतु आवश्यक योजना (4 Pages)
 * List of Students Requiring Special Remedial Assistance and measures planned to improve their Performance
 * Official KVS Teacher's Diary Page 34 (Middle & Secondary Stage).
 * Columns:
 * 1. S.No
 * 2. Name of Student
 * 3. Area of weakness (with attached photo, audio, video, pdf evidence)
 * 4. Measures Planned (with attached photo, audio, video, pdf evidence)
 */
export interface RemedialAssistanceRecord20a {
  id: string;
  sNo: number;
  studentId?: string;
  studentName: string;
  rollNo?: number | string;
  className: string; // e.g. "Class X-A", "Class IX-A", "Class VIII-B", "Class XI-A", "Class XII-A"
  section?: string;
  subjectName: string; // e.g. "Mathematics (041)", "Science (086)", "Physics (042)", "English (301)"
  pageNumber: number; // 1, 2, 3, or 4 (4 Pages total)
  areaOfWeakness: string; // Detailed diagnostic weakness / learning gap description
  weaknessAttachments?: RemedialAttachmentItem[]; // Photo, Audio, Video clip, PDF evidence
  measuresPlanned: string; // Targeted pedagogical interventions & learning strategies
  measuresAttachments?: RemedialAttachmentItem[]; // Remedial worksheets, photos, audio, video, PDF evidence
  diagnosticScore?: number; // Score in diagnostic test (e.g. 8/40)
  targetDate?: string;
  status?: 'Identified' | 'In Remediation' | 'Remediated & Re-evaluated' | 'Ongoing Support';
  remarks?: string;
  templatePageRef?: number; // Default 34
}

/**
 * Module 20(b): उपचारात्मक शिक्षण का ब्यौरा (DETAILS OF REMEDIAL TEACHING - 2 Pages)
 * Official KVS Teacher's Diary Page 35 (Middle & Secondary Stage).
 * Columns: Sl No, Name of Student, Topic/concept, Date 1..Date 9
 * + Multi-file Evidence attachments (Photo, Audio viva, Video demo, PDF lesson worksheet)
 */
export interface RemedialTeachingDetailsRecord20b {
  id: string;
  slNo: number;
  studentId?: string;
  studentName: string;
  rollNo?: number | string;
  className: string; // e.g. "Class X-A"
  section?: string;
  subjectName: string; // e.g. "Mathematics (041)"
  topicConcept: string; // Topic or concept taught in remedial sessions
  pageNumber: number; // Page 1 or 2 (2 Pages)
  dates: string[]; // Up to 9 date strings for the 9 date columns
  sessionStatuses?: ('P' | 'A' | '✓' | 'Done' | '' | string)[]; // Status per date column
  attachments?: RemedialAttachmentItem[]; // Photo, Audio viva, Video demo, PDF lesson worksheet
  completionStatus?: 'In Progress' | 'Completed' | 'Ongoing Drill';
  remarks?: string;
  templatePageRef?: number; // 35
}

/**
 * Module 20(c): उपचारात्मक सहायता की आवश्यकता वाले छात्रों की प्रगति का अभिलेख
 * TRACKING OF STUDENTS’ PERFORMANCE AFTER REMEDIATION (2 Pages)
 * Official KVS Teacher's Diary Page 36 (Middle & Secondary Stage).
 * Columns: Sl No, Name of Student, Nature of Test (PT/HY/ etc.), Record of Progress (with Max Marks header & test score columns), Parent's Signature
 * + Multi-file Evidence attachments (Photo of corrected re-test, Audio viva, Video, PDF score sheet)
 */
export interface RemedialPerformanceTrackingRecord20c {
  id: string;
  slNo: number;
  studentId?: string;
  studentName: string;
  rollNo?: number | string;
  className: string;
  section?: string;
  subjectName: string;
  natureOfTest: string; // e.g. "PT-1 Re-Test", "Half Yearly Re-evaluation", "Chapter Slip Test"
  maxMarks: number; // e.g. 40, 20, 50, 80
  scores: (number | null)[]; // Up to 10 test progression scores
  testDates?: string[]; // Corresponding dates for each score entry
  parentSignature: string; // e.g. "Signed (Mr. R. K. Sharma)" or "Acknowledged"
  parentSignatureDate?: string;
  parentPhone?: string;
  isParentAcknowledged: boolean;
  attachments?: RemedialAttachmentItem[]; // Re-test sheet scan, PDF report, audio viva
  status?: 'Target Met' | 'Developing' | 'Needs Further Attention' | 'In Remediation' | 'Ongoing Support';
  pageNumber: number; // Page 1 or 2 (2 Pages)
  remarks?: string;
  templatePageRef?: number; // 36
}

/**
 * Module 28: Oral Reading Fluency (ORF) TARA App Metric
 * Captures baseline, midline, and endline oral reading proficiency.
 */
export interface OralReadingFluencyRecord {
  id: string;
  studentId: string;
  classSectionId?: string;
  className?: string; // e.g. "I", "II", "III", "IV", "V"
  section?: string;   // e.g. "A", "B"
  studentName?: string;
  rollNo?: number | string;
  admissionNo?: string;
  subjectId: string; // Typically Hindi or English
  subjectName?: string;
  baselineWcpm: number; // Words Correct Per Minute
  midlineWcpm: number;
  endlineWcpm: number;
  accuracyPercentage?: number;
  rangeGroup: OrfRangeGroup; // 'Below Base' | 'Within Base' | 'Above Base'
  remedialMeasures: string;
  taraLevel?: string; // 'Letter' | 'Word' | 'Sentence' | 'Paragraph' | 'Story'
  assessmentDate?: string;
  remarks?: string;
}

/**
 * 17(i) प्रयोगात्मक कक्षाओं / गतिविधियों में छात्रों की उपस्थिति का ब्यौरा
 * Record of attendance of Student in Practical Classes / Activities (6 pages)
 * Columns: S.No., Name of Student, Dates, Name of Practical/Activity, Signature/Attendance of Student
 */
export interface PracticalAttendanceRecord17i {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: number | string;
  className: string;
  section: string;
  subjectName: string;
  academicYear: string;
  term?: number | string;
  // slot key ('0' to '19') -> 'P' | 'A' | '✓' | 'Sign' | string status/grade
  attendance: Record<string, string>;
  remarks?: string;
  templatePageRef?: number; // 29 / 17(i)
}

/**
 * 17(j) कक्षा कार्य/गृह कार्य नोट बुक का रिकॉर्ड (RECORD OF CLASS WORK/HOME WORK NOTE BOOK SUBMISSION)
 * Columns: S.No., Name of Student, Date of Submission (20 column dates / slots)
 */
export interface NotebookSubmissionRecord17j {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: number | string;
  className: string;
  section: string;
  subjectName: string;
  academicYear: string;
  term?: number | string;
  // Dynamic slot key (e.g. col_0 to col_19 or custom date) -> status or marks (e.g., '✓', 'Late', 'A', '5/5', '10/10')
  submissions: Record<string, string>;
  remarks?: string;
  templatePageRef?: number; // 17(j)
}

/**
 * Proposed schema structure for persistent version control and snapshot history
 */
export interface AppDataSnapshot {
  id: string;                    // e.g., "snapshot_2026_term1_rev2"
  label: string;                 // e.g., "Term 1 Schedule - Revised (Aug 2026)"
  createdAt: string;             // ISO Date string
  sessionName?: string;          // e.g., "2025 - 2026 Term 1"
  isCurrent?: boolean;           // True if currently active workspace state
  notes?: string;
  dataCountSummary?: {
    timetableCount: number;
    studentsCount: number;
    teachersCount?: number;
    syllabusCount: number;
    examsCount: number;
    lessonPlansCount: number;
  };
  data: {
    school?: SchoolDetails;
    teacher?: TeacherProfile;
    sessions?: AcademicSession[];
    classes?: ClassSection[];
    subjects?: SubjectItem[];
    timetable?: TimetableSlot[];
    periodTimings?: Record<number, { time: string; label: string }>;
    calendar?: CalendarEvent[];
    exams?: ExamSchedule[];
    syllabus?: SyllabusItem[];
    lessonPlans?: DailyLessonPlan[];
    assessments?: AssessmentProgressRecord[];
    inspections?: InspectionReviewRecord[];
    activities?: HourlyActivity[];
    evidence?: ActivityEvidence[];
    calendarSync?: CalendarSyncSetting[];
    tasks?: TeacherTask[];
    dutyPresets?: DutyPreset[];
    students?: StudentProfile[];
    practicalAttendance?: PracticalAttendanceRecord[];
    scholasticVItoVIII?: ScholasticScoreRecordVItoVIII[];
    scholasticIXtoX?: ScholasticScoreRecordIXtoX[];
    monitoring?: MonitoringCumReportingRecord[];
    lateBloomers?: LateBloomerProgressRecord[];
    nipunMeetings?: NipunMeetingRecord[];
    scholasticItoII?: ScholasticRecordClass1_2[];
    notebookIIItoV?: NotebookRecordClass3_5[];
    seaIIItoV?: SeaRecordClass3_5[];
    scholasticIIItoV?: ScholasticRecordClass3_5[];
    resultAnalysisIIItoV?: ResultAnalysisClass3_5[];
    resultAnalysisVItoX?: ResultAnalysisClass6_10[];
    resultAnalysisXItoXII?: ResultAnalysisClass11_12[];
    studentBehaviourObservations?: StudentBehaviourObservationRecord[];
    remedialAssistance20a?: RemedialAssistanceRecord20a[];
    remedialTeaching20b?: RemedialTeachingDetailsRecord20b[];
    remedialPerformance20c?: RemedialPerformanceTrackingRecord20c[];
    ptmMeetings22?: PtmMeetingRecord22[];
    staffMeetings23?: StaffMeetingRecord23[];
    subjectMeetings24?: SubjectCommitteeMeetingRecord24[];
    orfTara?: OralReadingFluencyRecord[];
    workDoneOtherThanTeaching26?: WorkDoneOtherThanTeaching26Record[];
    ictClassroomUsage27?: IctClassroomUsage27Record[];
    academicLossCompensation28?: AcademicLossCompensation28Record[];
    joyfulLearning29?: JoyfulLearning29Record[];
    competencyTestItems30?: CompetencyTestItem30Record[];
    teacherInnovation31a?: TeacherInnovationProject31aRecord[];
    teacherBestPractices31b?: TeacherBestPractice31bRecord[];
    [key: string]: any;
  };
}

/**
 * 26. अध्यापन के अलावा किए गए कार्यों का विवरण
 * DETAILS OF WORK DONE OTHER THAN TEACHING
 * Columns: Months, Details, Signature of Principal / V P
 * + Multi-file evidence (Photo, Audio, Video, PDF)
 */
export interface WorkDoneOtherThanTeaching26Record {
  id: string;
  month: string; // e.g. "April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"
  details: string; // Detailed record of non-teaching responsibilities, committees, examinations, and events
  principalSignature: string; // e.g. "Verified & Signed (Principal)" or "Signed"
  principalSignatureDate?: string;
  isSigned?: boolean;
  academicYear?: string;
  attachments?: RemedialAttachmentItem[]; // Photo of deputation letter, signed circular, audio note, video, PDF order
  remarks?: string;
  templatePageRef?: number; // 52 / 26
}

/**
 * 27. कक्षा गतिविधियों में प्रयुक्त आईसीटी/डिजिटल प्रौद्योगिकी का विवरण
 * DETAILS OF ICT/DIGITAL TECHNOLOGY USED DURING CLASSROOM TRANSACTION (2 Pages)
 * Columns: Date, Class & Section, Period, Sub, Topic & Description of e-content, Principal's Sign
 * + Multi-file evidence (Photo, Audio, Video, PDF)
 */
export interface IctClassroomUsage27Record {
  id: string;
  slNo?: number;
  date: string; // e.g. "12/08/2025"
  className: string; // e.g. "Class X"
  section?: string; // e.g. "A"
  period: string; // e.g. "Period 3"
  subject: string; // e.g. "Mathematics (041)"
  topicAndEContentDescription: string; // e.g. "Quadratic Equations - DIKSHA 3D Interactive module & GeoGebra curve plotter"
  principalSign: string; // e.g. "Verified & Signed"
  isSigned?: boolean;
  pageNumber: number; // 1 or 2 (2 Pages)
  attachments?: RemedialAttachmentItem[]; // Screenshot photos, screen recording videos, audio viva clips, PDF worksheets
  remarks?: string;
  templatePageRef?: number; // 27
}

/**
 * 28. शैक्षणिक नुकसान की भरपाई के लिए कार्यक्रम
 * RECORD OF ACADEMIC LOSS COMPENSATION PROGRAMME (2 Pages)
 * Columns: Date, Name of student & class, Reason for Academic loss, Topic/ lesson compensated, Remarks
 * + Multi-file evidence (Photo, Audio, Video, PDF)
 */
export interface AcademicLossCompensation28Record {
  id: string;
  slNo?: number;
  date: string; // e.g. "14/08/2025"
  studentName: string; // e.g. "Aarav Sharma"
  className: string; // e.g. "Class IX"
  section?: string; // e.g. "A"
  admissionNo?: string;
  reasonForLoss: string; // e.g. "Medical Leave (Dengue - 12 days)", "Represented School in KVS National Sports Meet", "Transfer from KV Pune (Mid-term)"
  topicCompensated: string; // e.g. "Linear Equations in Two Variables - Algebraic & Graphical Solution"
  remarks?: string; // e.g. "Special zero-period tutorial; solved all NCERT exemplar exercises; 85% in post-test."
  pageNumber: number; // 1 or 2
  attachments?: RemedialAttachmentItem[]; // Medical certificate, sports duty slip, worksheet photos, audio viva notes, evaluation PDFs
  academicYear?: string;
  templatePageRef?: number; // 28
}

/**
 * 29. आनंदपूर्ण पठन कार्यान्वयन का अभिलेख
 * RECORD OF IMPLEMENTATION OF JOYFUL LEARNING
 * Columns: Class& Section with Date, Activity, Impact and Follow up
 * + Multi-file evidence (Photo, Audio, Video, PDF)
 */
export interface JoyfulLearning29Record {
  id: string;
  slNo?: number;
  date: string; // e.g. "20/08/2025"
  className: string; // e.g. "Class IX"
  section?: string; // e.g. "A & B"
  classSectionWithDate: string; // Combined display e.g. "Class IX-A (20/08/2025)"
  activity: string; // Detailed description of joyful experiential activity (Math Rangoli, Role Play, Kahoot Quiz, Science Toy, Story theatre)
  impactAndFollowUp: string; // Measurable engagement impact, conceptual understanding, and follow-up activities
  attachments?: RemedialAttachmentItem[]; // Activity photos, video recordings, joy reflection audio, creative write-up PDFs
  academicYear?: string;
  templatePageRef?: number; // 29
}

/**
 * 30. योग्यता आधारित परीक्षण सामग्री का रिकॉर्ड
 * RECORD OF COMPETENCY BASED TEST ITEMS UNDERTAKEN (2 Pages)
 * Columns: Date, Class, Description
 * + Multi-file evidence (Photo, Audio, Video, PDF)
 */
export interface CompetencyTestItem30Record {
  id: string;
  slNo?: number;
  date: string; // e.g. "22/08/2025"
  className: string; // e.g. "Class X-A & B"
  section?: string;
  description: string; // Detailed description of competency-based items (Case-based analysis, Assertion-Reasoning, Real-world data interpretation)
  pageNumber: number; // 1 or 2
  attachments?: RemedialAttachmentItem[]; // Question paper PDFs, rubric docs, student response photos, viva audio
  academicYear?: string;
  templatePageRef?: number; // 30
}

/**
 * 31(a) शिक्षक द्वारा इनोवेशन एवं एक्सपेरीमेंटेशन हेतु लिए गए प्रोजेक्ट
 * PROJECTS UNDERTAKEN BY THE TEACHER FOR INNOVATION EXPERIMENTATION
 * Columns: Class & Section, Subject, Brief of Project & Execution
 * + Multi-file evidence (Photo, Audio, Video, PDF)
 */
export interface TeacherInnovationProject31aRecord {
  id: string;
  slNo?: number;
  className: string; // e.g. "Class IX"
  section?: string; // e.g. "A & B"
  subject: string; // e.g. "Science (086)"
  briefOfProjectAndExecution: string; // Detailed description of innovation project, execution methodology, timeline & outcomes
  academicYear?: string;
  attachments?: RemedialAttachmentItem[]; // Project photos, video demos, audio interviews, research paper/report PDFs
  remarks?: string;
  templatePageRef?: number; // 31(a)
}

/**
 * 31(b) किये गए सर्वोत्तम अभ्यासों की सूची
 * LIST OF BEST PRACTICES UNDERTAKEN
 * Columns: S.N., Description, Outcome
 * + Multi-file evidence (Photo, Audio, Video, PDF)
 */
export interface TeacherBestPractice31bRecord {
  id: string;
  sn: number; // S.N. (1, 2, 3...)
  description: string; // Description of pedagogical best practice
  outcome: string; // Measurable outcome and impact on student learning
  academicYear?: string;
  attachments?: RemedialAttachmentItem[]; // Photos of best practice, audio/video testimonials, metric report PDFs
  remarks?: string;
  templatePageRef?: number; // 31(b)
}

/**
 * Teacher Profile Update Request for Principal Approval
 */
export interface ProfileFieldDiff {
  fieldKey: string;
  fieldLabel: string;
  currentValue: string;
  proposedValue: string;
}

export interface ProfileChangeRequest {
  id: string; // e.g. "req-1724058000"
  employeeCode: string;
  teacherName: string;
  designation: string;
  submittedAt: string; // ISO string
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: string;
  resolvedBy?: string; // e.g. "Sh. Hemananda Barik (Principal I/c)"
  principalRemarks?: string;
  proposedProfile: TeacherProfile;
  currentProfile: TeacherProfile;
  changedFields: ProfileFieldDiff[];
}

/**
 * Official KVS & School Leave and Attendance System Types
 */
export type LeaveType =
  | 'CL'      // Casual Leave (8/8 per cal yr for Regular; max 1/mo for Contractual after 1 mo continuous service)
  | 'EL'      // Earned Leave
  | 'HPL'     // Half Pay Leave (20 days per completed yr)
  | 'Comm'    // Commuted Leave (on Medical Grounds against 2x HPL)
  | 'EOL-MG'  // Extra Ordinary Leave on Medical Grounds
  | 'EOL-PA'  // Extra Ordinary Leave on Private Affairs
  | 'CCL'     // Child Care Leave (Female teachers / Single male parent)
  | 'ML'      // Maternity Leave (180 days) / Paternity Leave (15 days)
  | 'SpCL'    // Special Casual Leave (Sports events, Elections, Scout/Guide camps, Family Planning)
  | 'Absent'  // Unauthorized / Unexcused Absence / Loss of Pay
  | 'OD';     // Official On Duty (Deputation, CBSE Exam Centre, Sports Meet, RO Meeting, Training)

export type AttendanceStatus = 'Present' | 'Leave' | 'OD' | 'Absent' | 'Holiday' | 'Vacation' | 'Sunday';

export interface TeacherAttendanceRecord {
  id: string; // e.g. "att-staff-108894-2026-08-20"
  employeeCode: string;
  teacherName: string;
  designation: string;
  employmentType: 'Regular' | 'Contractual';
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  leaveType?: LeaveType;
  inTime?: string; // e.g. "07:35 AM"
  outTime?: string; // e.g. "02:15 PM"
  isLate?: boolean;
  lateMinutes?: number;
  halfDay?: boolean;
  halfDaySession?: 'First Half' | 'Second Half';
  remarks?: string;
  leaveApplicationId?: string;
  onDutyRecordId?: string;
  markedBy: string; // e.g. "Principal" | "Self" | "Biometric"
  markedAt: string; // ISO timestamp
  verifiedByPrincipal?: boolean;
  verifiedAt?: string;
}

export interface DailyLeaveBreakdownItem {
  date: string; // YYYY-MM-DD
  dayName?: string; // e.g. "Monday", "Sunday"
  leaveType: LeaveType | 'Holiday' | 'Sunday' | 'None';
  halfDay?: boolean;
  halfDaySession?: 'First Half' | 'Second Half';
  isNonWorkingDay?: boolean; // true for Sunday / Calendar Holiday
  reason?: string;
}

export interface LeaveApplication {
  id: string; // e.g. "la-1724058000"
  employeeCode: string;
  teacherName: string;
  designation: string;
  employmentType: 'Regular' | 'Contractual';
  leaveType: LeaveType;
  fromDate: string; // YYYY-MM-DD
  toDate: string;   // YYYY-MM-DD
  totalDays: number;
  halfDay?: boolean;
  halfDaySession?: 'First Half' | 'Second Half';
  isCombinedLeave?: boolean;
  dailyLeaveBreakdown?: DailyLeaveBreakdownItem[];
  reason: string;
  stationLeavingPermission: boolean;
  stationAddress?: string;
  prefixDates?: string; // e.g. "2026-08-14 (Holiday)"
  suffixDates?: string; // e.g. "2026-08-17 (Sunday)"
  medicalCertificateAttached?: boolean;
  medicalCertDocUrl?: string;
  status: 'Pending' | 'Recommended' | 'Sanctioned' | 'Rejected' | 'Cancelled';
  appliedAt: string; // ISO timestamp
  recommendedBy?: string; // e.g. "Vice Principal / Incharge"
  sanctionedBy?: string;  // e.g. "Sh. Hemananda Barik (Principal I/c)"
  sanctionedAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  principalRemarks?: string;
  proxyArrangementsConfirmed?: boolean;
}

export interface OnDutyRecord {
  id: string; // e.g. "od-1724058000"
  employeeCode: string;
  teacherName: string;
  designation: string;
  purpose: 'CBSE Observer' | 'KVS Regional Sports Meet' | 'National Sports Meet (NSM)' | 'In-Service Teacher Training' | 'Scout & Guide Rajya Puruskar Camp' | 'RO Official Meeting' | 'Election Duty' | 'Other';
  description: string;
  venue: string; // e.g. "KV Sambalpur / KVS RO Bhubaneswar"
  officialOrderNo?: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string;   // YYYY-MM-DD
  totalDays: number;
  affectedPeriods: {
    day: DayOfWeek;
    period: number;
    className: string;
    subjectName: string;
  }[];
  sanctionedByPrincipal: boolean;
  sanctionedDate?: string;
  certificateAttachmentUrl?: string;
  createdAt: string;
}

export interface LeaveBalance {
  employeeCode: string;
  teacherName: string;
  employmentType: 'Regular' | 'Contractual';
  academicYear: string; // e.g. "2026-2027"
  calendarYear: number; // e.g. 2026

  // Regular Teachers Statutory Balances
  clTotal: number;      // Standard: 8 days
  clAvailed: number;
  clRemaining: number;

  elTotal: number;      // 10 / 20 days per annum
  elAvailed: number;
  elRemaining: number;

  hplTotal: number;     // 20 days per annum
  hplAvailed: number;
  hplRemaining: number;

  commutedAvailed: number; // Debited at 2x from HPL
  specialClAvailed: number;
  cclTotal?: number;
  cclAvailed?: number;
  cclRemaining?: number;

  // Contractual Staff Specific Entitlements
  contractualMonthlyClCredited: number; // Max 1 per month worked
  contractualMonthlyClAvailed: number;
  contractualMonthlyClBalance: number;
  contractualVacationDutyExclusionActive?: boolean; // If true, 0 CL in that vacation month

  // History breakdown
  leavesHistory: {
    leaveId: string;
    leaveType: LeaveType;
    fromDate: string;
    toDate: string;
    days: number;
    sanctionedAt: string;
    remarks?: string;
  }[];

  lastCalculatedAt: string;
}

export interface LeaveSettingsConfig {
  contractualMinServiceMonths: number; // default 1
  contractualMaxClPerMonth: number;    // default 1
  remedialVacationDutyMonths: string[]; // e.g. ['2026-05', '2026-06', '2026-10']
  regularClAnnualEntitlement: number;   // default 8
  regularElAnnualEntitlement: number;   // default 10
  regularHplAnnualEntitlement: number;  // default 20
  regularCclAnnualEntitlement: number;  // default 730
}

export interface StudentAttendanceRecord {
  id: string; // e.g. "att-stud-1049-2026-08-20"
  studentId: string; // Foreign key to StudentProfile
  studentName: string;
  rollNo: number | string;
  className: string; // "I"..."XII"
  section: string;   // "A", "B", "C"
  date: string;      // YYYY-MM-DD
  status: 'P' | 'A' | 'L' | 'E'; // Present, Absent, Late, Excused/Leave
  reasonForAbsence?: string; // e.g. "Fever / Medical", "Out of station", "Family function"
  markedByTeacherCode?: string;
  markedByTeacherName?: string;
  markedAt: string;
  isTcCancelled?: boolean; // Set true if student has been issued TC
}

export interface ClassDailyAttendanceRecord {
  id: string; // e.g. "att-cls-I-2026-08-20"
  date: string; // YYYY-MM-DD
  className: string; // "I" to "X"
  section: string; // "A"
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  absentRollNos: number[];
  absentStudentIds?: string[];
  markedByTeacherName?: string;
  markedAt: string;
}

export interface TransferCertificateRecord {
  id: string; // e.g. "tc-2026-0042"
  tcNumber: string; // Official TC No. e.g. "TC/2026/042"
  bookNo?: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  penNo?: string; // UDISE PEN
  apaarId?: string;
  fatherName: string;
  motherName: string;
  nationality: string;
  socialCategory: string; // GEN / OBC / SC / ST / EWS
  className: string;
  section: string;
  admissionDateInSchool: string;
  dateOfLeaving: string; // YYYY-MM-DD
  dateOfIssueTc: string;  // YYYY-MM-DD
  reasonForLeaving: 'Parent Transfer' | 'Relocation' | 'Admission to Other School' | 'Higher Education' | 'Personal Request';
  destinationSchoolName?: string;
  totalWorkingDays: number;
  daysPresent: number;
  conductAndBehaviour: 'Good' | 'Very Good' | 'Exemplary' | 'Satisfactory';
  duesCleared: boolean;
  concessionAvailed?: string;
  nccOrScoutGuide?: string;
  gamesPlayed?: string;
  remarks?: string;
  issuedByPrincipalName: string;
  status: 'Draft' | 'Issued' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyEnrollmentClassData {
  className: string; // "I", "II" ... "XII"
  section: string;   // "A", "B"
  boysCount: number;
  girlsCount: number;
  transgenderCount: number;
  totalStudents: number;
  categoryBreakdown: {
    gen: { boys: number; girls: number; total: number };
    obc: { boys: number; girls: number; total: number };
    sc: { boys: number; girls: number; total: number };
    st: { boys: number; girls: number; total: number };
    ewsOrBpl: { boys: number; girls: number; total: number };
    minority: { boys: number; girls: number; total: number };
    singleGirlChild: number;
    rte: number;
    differentlyAbled: number;
  };
  admissionsInMonth: number;
  tcIssuedInMonth: number;
  netEnrollment: number;
}

export interface MonthlyEnrollmentSnapshot {
  id: string; // e.g. "enroll-ro-2026-08"
  month: string; // "August"
  year: number; // 2026
  monthYearStr: string; // "2026-08"
  generatedAt: string; // ISO date
  generatedBy: string; // e.g. "Updesh Singh Pal (Data Entry Manager)"
  verifiedByPrincipal: string; // "Shri Hemananda Barik (Principal I/c)"
  schoolName: string;
  kvCode: string;
  region: string;
  classesData: MonthlyEnrollmentClassData[];
  grandTotals: {
    totalBoys: number;
    totalGirls: number;
    totalStudents: number;
    totalGen: number;
    totalObc: number;
    totalSc: number;
    totalSt: number;
    totalEws: number;
    totalMinority: number;
    totalSgc: number;
    totalRte: number;
    totalDifferentlyAbled: number;
    totalTcIssued: number;
    totalNewAdmissions: number;
  };
  roSubmissionStatus: 'Draft' | 'Finalized' | 'Exported' | 'Submitted to RO';
  submissionDate?: string;
  roDispatchNumber?: string;
}

export interface ProxyDutyAssignment {
  id: string; // e.g. "proxy-2026-08-20-p3-xia"
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  timeSlot?: string;
  className: string;
  section: string;
  subjectName: string;
  roomNo?: string;

  // Absent Teacher
  absentTeacherCode: string;
  absentTeacherName: string;
  absenceReason: LeaveType | 'Late' | 'Official Deputation' | 'Emergency' | string;

  // Substitute Assigned Teacher
  substituteTeacherCode: string;
  substituteTeacherName: string;
  substituteDesignation?: string;
  isFreePeriod: boolean; // Confirmed that substitute had no other regular teaching period

  // Assignment metadata
  assignedBy: string; // e.g. "Time-Table Committee / Principal"
  assignedAt: string;
  status: 'Assigned' | 'Acknowledged' | 'Completed' | 'Reassigned';
  taskManagementTaskId?: string; // Links to auto-generated task in TaskManager
  syncedToTaskSystem: boolean;
  notes?: string;
}

export type TicketCategory = 'Bug / Glitch' | 'Feature Request' | 'Feedback' | 'UI/UX Issue' | 'Data Issue' | 'Other';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface TicketEvidence {
  id: string;
  fileName: string;
  fileType: 'image' | 'pdf' | 'video' | 'other';
  fileUrl: string;          // Base64 data URL
  uploadedAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  moduleOrPage?: string;    // e.g. "Teacher Attendance", "Student Enrollment", "TaskManager"
  status: TicketStatus;
  evidence: TicketEvidence[];
  raisedBy: string;         // employeeCode or user id
  raisedByName: string;
  raisedAt: string;
  assignedTo?: string;
  assignedToName?: string;
  principalOrDevRemarks?: string;
  resolvedAt?: string;
  updatedAt: string;
}

// ============================================================================
// ROLE + RESPONSIBILITY + DELEGATION + CALENDAR-LINKED ACTIVITY SYSTEM (PHASE 1)
// ============================================================================

export type PortfolioCategory =
  | 'Academic & Administration'
  | 'Student Welfare & Safety'
  | 'Activities, Clubs & Student Development'
  | 'Maintenance & Infrastructure'
  | 'Office / Administrative'
  | 'Other';

export type ResponsibilityFrequency =
  | 'One-time'
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'Quarterly'
  | 'Term'
  | 'Annual'
  | 'As-needed';

export interface ResponsibilitySubItem {
  id: string;
  title: string;
  description?: string;
  isCompleted?: boolean;
}

export interface PortfolioResponsibility {
  id: string;
  title: string;
  subCategory?: string;                // e.g. "Pay Bills & TDS", "Audit & VVN", "Service Records"
  subItems?: ResponsibilitySubItem[];  // Sub-tasks or checklist items
  description?: string;
  frequency: ResponsibilityFrequency;
  suggestedMonths?: string[];          // e.g. ["April", "May", "August"]
  isMandatory: boolean;
  canBeDelegated: boolean;
  linkedThemeCalendarActivity?: string;
}

export interface PortfolioTemplate {
  id: string;
  name: string;                        // e.g. "Examination Committee In-charge"
  category: PortfolioCategory;
  description: string;
  responsibilities: PortfolioResponsibility[];
  isCommittee: boolean;                // true for most school committees
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface PortfolioAssignment {
  id: string;
  portfolioTemplateId: string;
  role: 'In-charge' | 'Member';
  teacherEmployeeCode: string;
  teacherName: string;
  assignedBy: string;
  assignedAt: string;
  status: 'Active' | 'Relieved';
  notes?: string;
}

export interface ResponsibilityDelegation {
  id: string;
  portfolioTemplateId: string;
  responsibilityId: string;
  originalOwnerEmployeeCode: string;   // the In-charge
  originalOwnerName: string;
  delegatedToEmployeeCode: string;
  delegatedToName: string;
  delegatedBy: string;                 // Principal or In-charge
  delegatedAt: string;
  status: 'Active' | 'Completed' | 'Withdrawn';
  notes?: string;
}

export interface ResponsibilityRequest {
  id: string;
  portfolioTemplateId: string;
  requestedBy: string;
  requestedByName: string;
  title: string;
  description: string;
  suggestedFrequency: ResponsibilityFrequency;
  status: 'Pending' | 'Approved' | 'Rejected';
  principalRemarks?: string;
  requestedAt: string;
  reviewedAt?: string;
}

export interface PortfolioSuggestion {
  id: string;
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedFrequency: ResponsibilityFrequency;
  suggestedPortfolioTemplateId?: string;   // which existing portfolio it should go under
  suggestedPortfolioName?: string;
  evidenceCount: number;                   // how many times this pattern was seen
  sampleActivityIds: string[];
  status: 'Pending' | 'Approved' | 'Rejected' | 'Ignored';
  createdAt: string;
  reviewedAt?: string;
  principalRemarks?: string;
}

export type ThemeCalendarCategory =
  | 'Academic Activities'
  | 'Examination Activities'
  | 'Science, STEM & ATL'
  | 'EBSB, Kala Utsav & Cultural'
  | 'Games, Sports & Yoga'
  | 'Scouts & Guides'
  | 'Vocational & Skill Education'
  | 'Training & CPD'
  | 'National & International Days';

export type ThemeCalendarMonth =
  | 'April & May'
  | 'June & July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December'
  | 'January'
  | 'February'
  | 'March';

export interface ThemeCalendarActivity {
  id: string;
  month: ThemeCalendarMonth;
  category: ThemeCalendarCategory;
  title: string;
  description?: string;
  suggestedCommitteeId?: string;
  suggestedCommitteeName?: string;
  isMandatory?: boolean;
  dateOrWeek?: string;
}

export type CampusDutyType =
  | 'Morning Gate & Assembly'
  | 'Recess & Playground'
  | 'Corridor & Water Point'
  | 'Dispersal & Bus Stand'
  | 'Special Event Supervision';

export interface CampusDutyAssignment {
  id: string;
  dutyType: CampusDutyType;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | string;
  date?: string; // Optional specific date YYYY-MM-DD
  location: string;
  timing: string;
  teacherEmployeeCode: string;
  teacherName: string;
  teacherDesignation?: string;
  status: 'Scheduled' | 'Completed' | 'Substituted';
  assignedBy: string;
  assignedAt: string;
  notes?: string;
}

export type SubjectSupportType =
  | 'Primary Teacher / In-Charge'
  | 'Academic Support / Co-Teaching'
  | 'Remedial In-Charge'
  | 'Special Assignment';

export interface SubjectResponsibilityAssignment {
  id: string; // e.g. "sra-1724500000"
  employeeCode: string;
  teacherName: string;
  designation?: string;
  subjectName: string; // e.g. "Odia", "Mathematics", "English", "Hindi", "TWAU", "Science", etc.
  className: string; // e.g. "Class V-A", "V-A", "Class V", etc.
  section?: string;
  supportType: SubjectSupportType;
  assignmentType: 'Whole Session' | 'Specific Period';
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  roleNote?: string; // e.g. "Odia in-charge – no regular Odia teacher", "Class V Math support as per Academic Plan 12-08-2026"
  status: 'Active' | 'Ended';
  assignedBy: string;
  assignedAt: string;
  periodsAffected?: number[];
  updatedAt?: string;
}











