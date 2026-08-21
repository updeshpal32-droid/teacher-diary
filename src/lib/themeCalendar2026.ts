import { ThemeCalendarActivity, ThemeCalendarCategory, ThemeCalendarMonth } from '../types/academic';

export const THEME_FOR_THE_YEAR = 'Academic Excellence through Innovation, Assessment Reform and Skill Integration';

export const THEME_CALENDAR_2026_27: ThemeCalendarActivity[] = [
  // =========================================================================
  // 1. ACADEMIC ACTIVITIES (Pages 2-3)
  // =========================================================================
  {
    id: 'acad-apr-1',
    month: 'April & May',
    category: 'Academic Activities',
    title: 'Setting of Academic Target, Mission Statement of KV & Display Learning Outcomes',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination & Evaluation Committee'
  },
  {
    id: 'acad-apr-2',
    month: 'April & May',
    category: 'Academic Activities',
    title: 'Bridge Course for Class VI and other Classes',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination & Evaluation Committee'
  },
  {
    id: 'acad-apr-3',
    month: 'April & May',
    category: 'Academic Activities',
    title: 'Pustakophaar (Book Sharing Initiative)',
    suggestedCommitteeId: 'port-library',
    suggestedCommitteeName: 'Library Committee'
  },
  {
    id: 'acad-apr-4',
    month: 'April & May',
    category: 'Academic Activities',
    title: 'Tarunotsav for Class X Appeared Students',
    suggestedCommitteeId: 'port-guidance',
    suggestedCommitteeName: 'Guidance & Counseling Cell'
  },
  {
    id: 'acad-apr-5',
    month: 'April & May',
    category: 'Academic Activities',
    title: 'Distribution of Student Diary and ID Cards',
    suggestedCommitteeId: 'port-timetable',
    suggestedCommitteeName: 'Timetable & Academic Roster'
  },
  {
    id: 'acad-apr-6',
    month: 'April & May',
    category: 'Academic Activities',
    title: '1st Quarterly NIPUN Bharat Review Meeting',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination & Evaluation Committee'
  },
  {
    id: 'acad-apr-7',
    month: 'April & May',
    category: 'Academic Activities',
    title: 'Notification of various Committees at Vidyalaya Level as per directions of KVS',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Academic & Administration',
    isMandatory: true
  },
  {
    id: 'acad-apr-8',
    month: 'April & May',
    category: 'Academic Activities',
    title: 'Vidya Pravesh for Class-I (3-Month Play-Based Readiness Module)',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Primary Academic Incharge'
  },
  {
    id: 'acad-apr-9',
    month: 'April & May',
    category: 'Academic Activities',
    title: 'School-Level Workshop on NCF-SE 2023, NCF-FS 2022 & Curriculum Sensitization',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination & Academic Committee'
  },
  {
    id: 'acad-apr-10',
    month: 'April & May',
    category: 'Academic Activities',
    title: 'Entry Level Learners Achievement Test for Grades III, VI, and IX',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination & Evaluation Committee'
  },
  {
    id: 'acad-jun-1',
    month: 'June & July',
    category: 'Academic Activities',
    title: 'Publication of Vidyalaya Patrika (Annual School Magazine)',
    suggestedCommitteeId: 'port-it',
    suggestedCommitteeName: 'Editorial Board & IT Committee'
  },
  {
    id: 'acad-jun-2',
    month: 'June & July',
    category: 'Academic Activities',
    title: 'Quarterly Newsletter and Magazine Release by PM SHRI KVs',
    suggestedCommitteeId: 'port-it',
    suggestedCommitteeName: 'PM SHRI & IT Committee'
  },
  {
    id: 'acad-jun-3',
    month: 'June & July',
    category: 'Academic Activities',
    title: 'Diagnosis of weak areas of Secondary students and planning effective remedial intervention',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination Committee'
  },
  {
    id: 'acad-jun-4',
    month: 'June & July',
    category: 'Academic Activities',
    title: 'Assessment of Oral Reading Fluency (Grades III to VIII)',
    suggestedCommitteeId: 'port-library',
    suggestedCommitteeName: 'Language Department & Library'
  },
  {
    id: 'acad-aug-1',
    month: 'August',
    category: 'Academic Activities',
    title: '2nd Quarterly NIPUN Meeting & NEP 2020 Action Plan Review',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination & Academic Committee'
  },
  {
    id: 'acad-aug-2',
    month: 'August',
    category: 'Academic Activities',
    title: 'Review of Efforts made for Children with Special Needs (CWSN)',
    suggestedCommitteeId: 'port-guidance',
    suggestedCommitteeName: 'Guidance & Counseling Cell'
  },
  {
    id: 'acad-sep-1',
    month: 'September',
    category: 'Academic Activities',
    title: 'Review of Syllabus Coverage before Mid-Term Tests & Academic Supervision Action Plan',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination Committee'
  },
  {
    id: 'acad-sep-2',
    month: 'September',
    category: 'Academic Activities',
    title: 'Submission of Staff Sanction Proposals for Academic Session 2027-28',
    suggestedCommitteeId: 'port-timetable',
    suggestedCommitteeName: 'Administrative Office'
  },
  {
    id: 'acad-oct-1',
    month: 'October',
    category: 'Academic Activities',
    title: 'Showcasing Best Practices under "Leading from Front" Innovation Initiative',
    suggestedCommitteeId: 'port-it',
    suggestedCommitteeName: 'IT & Innovation Committee'
  },
  {
    id: 'acad-nov-1',
    month: 'November',
    category: 'Academic Activities',
    title: '3rd Quarterly NIPUN Meeting & Mission LiFE Classroom Integration Review',
    suggestedCommitteeId: 'port-eco',
    suggestedCommitteeName: 'Swachhata & Eco Club'
  },
  {
    id: 'acad-dec-1',
    month: 'December',
    category: 'Academic Activities',
    title: 'Special Classes & Targeted Revision for Classes X & XII Board Students',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination Committee'
  },
  {
    id: 'acad-jan-1',
    month: 'January',
    category: 'Academic Activities',
    title: '4th Quarterly NIPUN Meeting & Exit Level Learners Achievement Test (Grades III, VI, IX)',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination Committee'
  },
  {
    id: 'acad-feb-1',
    month: 'February',
    category: 'Academic Activities',
    title: 'Notification & Registration for Admission in Class-I (Session 2027-28)',
    suggestedCommitteeId: 'port-admission',
    suggestedCommitteeName: 'Admission Committee',
    isMandatory: true
  },
  {
    id: 'acad-feb-2',
    month: 'February',
    category: 'Academic Activities',
    title: 'Walk-in Interviews for Contractual Teachers (Academic Session 2027-28)',
    suggestedCommitteeId: 'port-timetable',
    suggestedCommitteeName: 'Administration & Staffing'
  },
  {
    id: 'acad-mar-1',
    month: 'March',
    category: 'Academic Activities',
    title: 'Final Admission Verification & Next Session Planning 2027-28',
    suggestedCommitteeId: 'port-admission',
    suggestedCommitteeName: 'Admission Committee'
  },

  // =========================================================================
  // 2. EXAMINATION CALENDAR ACTIVITIES (Page 4)
  // =========================================================================
  {
    id: 'exam-apr-1',
    month: 'April & May',
    category: 'Examination Activities',
    title: 'Conduct of Supplementary Examination & Sharing of Assessment Scheme 2026-27',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination & Evaluation Committee'
  },
  {
    id: 'exam-jun-1',
    month: 'June & July',
    category: 'Examination Activities',
    title: 'Conduct of Periodic Test-I (Classes III to X) & Sample Question Papers Preparation',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination & Evaluation Committee'
  },
  {
    id: 'exam-aug-1',
    month: 'August',
    category: 'Examination Activities',
    title: 'CBSE List of Candidates (LOC) Submission for Classes X & XII (Tentative)',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination Committee',
    isMandatory: true
  },
  {
    id: 'exam-sep-1',
    month: 'September',
    category: 'Examination Activities',
    title: 'Half Yearly Examination (Classes III-VIII) & Periodic Test-II (Classes IX & X)',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination & Evaluation Committee',
    isMandatory: true
  },
  {
    id: 'exam-sep-2',
    month: 'September',
    category: 'Examination Activities',
    title: 'Online CBSE Registration of Classes IX & XI',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination Committee'
  },
  {
    id: 'exam-oct-1',
    month: 'October',
    category: 'Examination Activities',
    title: '1st Pre-Board Examination for Classes X & XII (Winter Stations)',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination Committee'
  },
  {
    id: 'exam-nov-1',
    month: 'November',
    category: 'Examination Activities',
    title: '1st Pre-Board Examination for Classes X & XII (Summer Stations) & Class XI Half Yearly',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination Committee'
  },
  {
    id: 'exam-dec-1',
    month: 'December',
    category: 'Examination Activities',
    title: 'Pre-Board II Examination for Classes X and XII',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination Committee'
  },
  {
    id: 'exam-jan-1',
    month: 'January',
    category: 'Examination Activities',
    title: 'Periodic Test-III (Class IX), PT-II (Classes III-VIII) & CBSE Practical/Internal Marks Compilation',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination Committee'
  },
  {
    id: 'exam-jan-2',
    month: 'January',
    category: 'Examination Activities',
    title: 'Pariksha Pe Charcha (PPC) Program Participation',
    suggestedCommitteeId: 'port-it',
    suggestedCommitteeName: 'IT & Cultural Committee'
  },
  {
    id: 'exam-feb-1',
    month: 'February',
    category: 'Examination Activities',
    title: 'Submission of Internal Assessment / Practical Activity Marks (Classes III to VIII)',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination Committee'
  },
  {
    id: 'exam-mar-1',
    month: 'March',
    category: 'Examination Activities',
    title: 'Session Ending Examination 2026-27 & Declaration of Results',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Examination Committee',
    isMandatory: true
  },

  // =========================================================================
  // 3. SCIENCE, STEM & ATL (Pages 5-6)
  // =========================================================================
  {
    id: 'stem-apr-1',
    month: 'April & May',
    category: 'Science, STEM & ATL',
    title: 'Rashtriya Bal Vaigyanik Pradarshani (RBVP) National Level & ATL STEM Promotion',
    suggestedCommitteeId: 'port-science',
    suggestedCommitteeName: 'Science Exhibition, NCSC & ATL Committee'
  },
  {
    id: 'stem-jun-1',
    month: 'June & July',
    category: 'Science, STEM & ATL',
    title: 'Registration for INSPIRE Awards MANAK Scheme & IOQM Mathematics Olympiad',
    suggestedCommitteeId: 'port-science',
    suggestedCommitteeName: 'Science Exhibition & ATL Committee'
  },
  {
    id: 'stem-jun-2',
    month: 'June & July',
    category: 'Science, STEM & ATL',
    title: 'CSIR Lab Visit under JIGYASA & PRAYAAS Registration',
    suggestedCommitteeId: 'port-science',
    suggestedCommitteeName: 'Science Department'
  },
  {
    id: 'stem-aug-1',
    month: 'August',
    category: 'Science, STEM & ATL',
    title: 'Know Your Chandrayaan, Vigyan Jyoti & RBVP School Level Activities',
    suggestedCommitteeId: 'port-science',
    suggestedCommitteeName: 'Science & Space Club'
  },
  {
    id: 'stem-sep-1',
    month: 'September',
    category: 'Science, STEM & ATL',
    title: 'Submission of Projects in INSPIRE Awards MANAK Portal',
    suggestedCommitteeId: 'port-science',
    suggestedCommitteeName: 'Science Exhibition Committee'
  },
  {
    id: 'stem-sep-2',
    month: 'September',
    category: 'Science, STEM & ATL',
    title: 'Swachh Evam Harit Vidyalaya Rating (SHVR) Registration & Data Submission',
    suggestedCommitteeId: 'port-eco',
    suggestedCommitteeName: 'Swachhata & Eco Club'
  },
  {
    id: 'stem-nov-1',
    month: 'November',
    category: 'Science, STEM & ATL',
    title: 'Regional Mathematics Olympiad (RMO) Examination',
    suggestedCommitteeId: 'port-science',
    suggestedCommitteeName: 'Mathematics Department'
  },
  {
    id: 'stem-dec-1',
    month: 'December',
    category: 'Science, STEM & ATL',
    title: 'Rashtriya Bal Vaigyanik Pradarshani (RBVP) Regional Level',
    suggestedCommitteeId: 'port-science',
    suggestedCommitteeName: 'Science Exhibition Committee'
  },
  {
    id: 'stem-jan-1',
    month: 'January',
    category: 'Science, STEM & ATL',
    title: 'Annual ATL & School Innovation Council Performance Audit & INMO Registration',
    suggestedCommitteeId: 'port-science',
    suggestedCommitteeName: 'Atal Tinkering Lab (ATL)'
  },
  {
    id: 'stem-feb-1',
    month: 'February',
    category: 'Science, STEM & ATL',
    title: 'ISRO YUva VIgyani KAryakram (YUVIKA) Student Registration',
    suggestedCommitteeId: 'port-science',
    suggestedCommitteeName: 'Science & Innovation Club'
  },

  // =========================================================================
  // 4. EK BHARAT SHRESTHA BHARAT (EBSB), KALA UTSAV & YOUTH PARLIAMENT (Pages 7-8)
  // =========================================================================
  {
    id: 'ebsb-apr-1',
    month: 'April & May',
    category: 'EBSB, Kala Utsav & Cultural',
    title: 'School Level Essay, Paragraph Writing & Vocal/Instrumental Music of Paired State',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'CCA & EBSB Club'
  },
  {
    id: 'ebsb-jun-1',
    month: 'June & July',
    category: 'EBSB, Kala Utsav & Cultural',
    title: 'Traditional Storytelling, 2D/3D Visual Art & Virtual Cultural Exchange with Paired State',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'CCA & Arts Committee'
  },
  {
    id: 'ebsb-aug-1',
    month: 'August',
    category: 'EBSB, Kala Utsav & Cultural',
    title: 'Regional Level EBSB & Kala Utsav Folk Dance / Music / Drama Competitions',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'CCA & Cultural Committee'
  },
  {
    id: 'ebsb-sep-1',
    month: 'September',
    category: 'EBSB, Kala Utsav & Cultural',
    title: 'Swachhata Pakhwada (Cleanliness Fortnight) Observance',
    suggestedCommitteeId: 'port-eco',
    suggestedCommitteeName: 'Swachhata & Eco Club',
    dateOrWeek: '1st to 15th September'
  },
  {
    id: 'ebsb-oct-1',
    month: 'October',
    category: 'EBSB, Kala Utsav & Cultural',
    title: 'National Unity Day (Rashtriya Ekta Diwas) & KVS National Level EBSB Meet',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'CCA & EBSB Club',
    dateOrWeek: '31st October'
  },
  {
    id: 'ebsb-nov-1',
    month: 'November',
    category: 'EBSB, Kala Utsav & Cultural',
    title: 'Constitution Day (Samvidhan Diwas) & Janjatiya Gaurav Diwas Celebration',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'Social Science & CCA',
    dateOrWeek: '15th & 26th November'
  },
  {
    id: 'ebsb-dec-1',
    month: 'December',
    category: 'EBSB, Kala Utsav & Cultural',
    title: 'KVS Foundation Day Celebration & Annual Day of Vidyalaya',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'CCA & School Events Committee',
    dateOrWeek: '15th December'
  },
  {
    id: 'ebsb-dec-2',
    month: 'December',
    category: 'EBSB, Kala Utsav & Cultural',
    title: 'National Mathematics Day (22 Dec) & Veer Bal Diwas (26 Dec)',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'CCA & Mathematics Department'
  },
  {
    id: 'ebsb-jan-1',
    month: 'January',
    category: 'EBSB, Kala Utsav & Cultural',
    title: 'National Youth Day (12 Jan), Parakram Diwas (23 Jan) & Republic Day (26 Jan)',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'CCA & Morning Assembly'
  },

  // =========================================================================
  // 5. GAMES, SPORTS & YOGA (Pages 9-10)
  // =========================================================================
  {
    id: 'sport-apr-1',
    month: 'April & May',
    category: 'Games, Sports & Yoga',
    title: 'Vidyalaya Level Sports Trials & Selection for School Teams / Fit India Suggestive Activities',
    suggestedCommitteeId: 'port-sports',
    suggestedCommitteeName: 'Sports & Physical Education Committee'
  },
  {
    id: 'sport-jun-1',
    month: 'June & July',
    category: 'Games, Sports & Yoga',
    title: 'International Day of Yoga (21st June) & National Yoga Olympiad by NCERT',
    suggestedCommitteeId: 'port-sports',
    suggestedCommitteeName: 'Sports & Yoga Committee',
    dateOrWeek: '21st June'
  },
  {
    id: 'sport-jun-2',
    month: 'June & July',
    category: 'Games, Sports & Yoga',
    title: '55th KVS National Sports Meet (Indoor Events)',
    suggestedCommitteeId: 'port-sports',
    suggestedCommitteeName: 'Sports & Physical Education'
  },
  {
    id: 'sport-aug-1',
    month: 'August',
    category: 'Games, Sports & Yoga',
    title: 'National Sports Day (Rashtriya Khel Diwas) & Fit India Freedom Run',
    suggestedCommitteeId: 'port-sports',
    suggestedCommitteeName: 'Sports & Physical Education',
    dateOrWeek: '29th August'
  },
  {
    id: 'sport-oct-1',
    month: 'October',
    category: 'Games, Sports & Yoga',
    title: '55th KVS National Sports Meet (Outdoor / Cricket) & 70th SGFI School Games Coaching Camp',
    suggestedCommitteeId: 'port-sports',
    suggestedCommitteeName: 'Sports Committee'
  },
  {
    id: 'sport-nov-1',
    month: 'November',
    category: 'Games, Sports & Yoga',
    title: '8th Edition of Fit India School Week & Annual Sports Day of Vidyalaya',
    suggestedCommitteeId: 'port-sports',
    suggestedCommitteeName: 'Sports & Physical Education',
    isMandatory: true
  },
  {
    id: 'sport-nov-2',
    month: 'November',
    category: 'Games, Sports & Yoga',
    title: 'Mini Sports Meet for Primary Wing Children (Classes I to V)',
    suggestedCommitteeId: 'port-sports',
    suggestedCommitteeName: 'Primary Sports Incharge'
  },
  {
    id: 'sport-jan-1',
    month: 'January',
    category: 'Games, Sports & Yoga',
    title: 'Participation in 70th National School Games (SGFI)',
    suggestedCommitteeId: 'port-sports',
    suggestedCommitteeName: 'Sports Committee'
  },

  // =========================================================================
  // 6. SCOUTS AND GUIDES (Page 11)
  // =========================================================================
  {
    id: 'scout-apr-1',
    month: 'April & May',
    category: 'Scouts & Guides',
    title: 'Unit Registration Process & First Troop/Company/Cub/Flock Meeting',
    suggestedCommitteeId: 'port-scouts',
    suggestedCommitteeName: 'Scouts & Guides Committee'
  },
  {
    id: 'scout-jun-1',
    month: 'June & July',
    category: 'Scouts & Guides',
    title: 'Dwitiya Charan / Rajat Pankh Camp at Vidyalaya Level',
    suggestedCommitteeId: 'port-scouts',
    suggestedCommitteeName: 'Scouts & Guides'
  },
  {
    id: 'scout-aug-1',
    month: 'August',
    category: 'Scouts & Guides',
    title: 'Pratham Sopan Camp at Vidyalaya Level & Rajya Puraskar Testing Camp',
    suggestedCommitteeId: 'port-scouts',
    suggestedCommitteeName: 'Scouts & Guides Committee'
  },
  {
    id: 'scout-sep-1',
    month: 'September',
    category: 'Scouts & Guides',
    title: 'World Scout Day Celebration (1st Aug) & Chaturth Charan Testing Camp',
    suggestedCommitteeId: 'port-scouts',
    suggestedCommitteeName: 'Scouts & Guides'
  },
  {
    id: 'scout-oct-1',
    month: 'October',
    category: 'Scouts & Guides',
    title: 'Tritiya Sopan Testing Camp at Divisional Level & Golden Arrow Form Verification',
    suggestedCommitteeId: 'port-scouts',
    suggestedCommitteeName: 'Scouts & Guides'
  },
  {
    id: 'scout-jan-1',
    month: 'January',
    category: 'Scouts & Guides',
    title: 'Dwitiya Sopan Testing Camp at Vidyalaya Level',
    suggestedCommitteeId: 'port-scouts',
    suggestedCommitteeName: 'Scouts & Guides'
  },
  {
    id: 'scout-feb-1',
    month: 'February',
    category: 'Scouts & Guides',
    title: 'World Thinking Day Observance & Golden Arrow Award Rally',
    suggestedCommitteeId: 'port-scouts',
    suggestedCommitteeName: 'Scouts & Guides',
    dateOrWeek: '22nd February'
  },

  // =========================================================================
  // 7. VOCATIONAL & SKILL EDUCATION (10 BAGLESS DAYS) (Page 12)
  // =========================================================================
  {
    id: 'voc-apr-1',
    month: 'April & May',
    category: 'Vocational & Skill Education',
    title: 'Orientation on CBSE Skill Courses (Classes VI-VIII & IX-XII) & Student Enrollment',
    suggestedCommitteeId: 'port-guidance',
    suggestedCommitteeName: 'Vocational & Skill Education'
  },
  {
    id: 'voc-jun-1',
    month: 'June & July',
    category: 'Vocational & Skill Education',
    title: '10 Bagless Days: Local Artisans/Craftsmen Workshop & Multi-Disciplinary Projects (MDP)',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'Vocational Skills & MDP'
  },
  {
    id: 'voc-aug-1',
    month: 'August',
    category: 'Vocational & Skill Education',
    title: 'Industry / Professional Institute Field Visits & Expert Guest Lectures',
    suggestedCommitteeId: 'port-guidance',
    suggestedCommitteeName: 'Skill Education Cell'
  },
  {
    id: 'voc-oct-1',
    month: 'October',
    category: 'Vocational & Skill Education',
    title: '10 Bagless Days: Hands-on Practice in Animation, Cooking, Embroidery & Coding',
    suggestedCommitteeId: 'port-it',
    suggestedCommitteeName: 'Skill & IT Committee'
  },
  {
    id: 'voc-jan-1',
    month: 'January',
    category: 'Vocational & Skill Education',
    title: 'Vidyalaya Level Vocational & Crafts Skills Exhibition',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'Vocational Skills Committee'
  },

  // =========================================================================
  // 8. TRAINING & CPD (Pages 13-15)
  // =========================================================================
  {
    id: 'cpd-apr-1',
    month: 'April & May',
    category: 'Training & CPD',
    title: 'STEM Workshops, PRERNA Mentors Training & Foundational FLN Capacity Building',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Teacher Professional Development'
  },
  {
    id: 'cpd-sep-1',
    month: 'September',
    category: 'Training & CPD',
    title: 'Training and Development Week Observance & Induction Courses for New Recruits',
    suggestedCommitteeId: 'port-exam',
    suggestedCommitteeName: 'Academic In-charge'
  },
  {
    id: 'cpd-oct-1',
    month: 'October',
    category: 'Training & CPD',
    title: 'Uploading of 50-Hour CPD Certificates on KVS SAMAGAM Portal',
    suggestedCommitteeId: 'port-it',
    suggestedCommitteeName: 'IT & SAMAGAM Incharge'
  },

  // =========================================================================
  // 9. NATIONAL / INTERNATIONAL DAYS & WEEKS (Page 16)
  // =========================================================================
  {
    id: 'day-apr-1',
    month: 'April & May',
    category: 'National & International Days',
    title: 'World Health Day (7 Apr), Ambedkar Jayanti (14 Apr) & Earth Day (22 Apr)',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'CCA & Assembly Committee'
  },
  {
    id: 'day-jun-1',
    month: 'June & July',
    category: 'National & International Days',
    title: 'World Environment Day (5 June) & Van Mahotsav "One Child One Plant" (1-7 July)',
    suggestedCommitteeId: 'port-eco',
    suggestedCommitteeName: 'Swachhata & Eco Club'
  },
  {
    id: 'day-aug-1',
    month: 'August',
    category: 'National & International Days',
    title: 'Celebration of Independence Day (15th August)',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'CCA Committee',
    dateOrWeek: '15th August',
    isMandatory: true
  },
  {
    id: 'day-sep-1',
    month: 'September',
    category: 'National & International Days',
    title: 'Teachers Day (5th Sept) & Hindi Diwas / Hindi Pakhwada',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'Language Department & CCA',
    dateOrWeek: '5th & 14th September'
  },
  {
    id: 'day-oct-1',
    month: 'October',
    category: 'National & International Days',
    title: 'Gandhi Jayanti (2 Oct) & Vigilance Awareness Week (31 Oct)',
    suggestedCommitteeId: 'port-safety',
    suggestedCommitteeName: 'Discipline & Safety Committee'
  },
  {
    id: 'day-nov-1',
    month: 'November',
    category: 'National & International Days',
    title: 'National Education Day (11 Nov) & Childrens Day (14 Nov)',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'CCA Committee'
  },
  {
    id: 'day-jan-1',
    month: 'January',
    category: 'National & International Days',
    title: 'Celebration of Republic Day (26th January)',
    suggestedCommitteeId: 'port-cca',
    suggestedCommitteeName: 'CCA Committee',
    dateOrWeek: '26th January',
    isMandatory: true
  },
  {
    id: 'day-feb-1',
    month: 'February',
    category: 'National & International Days',
    title: 'International Mother Tongue Day (21 Feb) & National Science Day (28 Feb)',
    suggestedCommitteeId: 'port-science',
    suggestedCommitteeName: 'Science & Language Department'
  },
  {
    id: 'day-mar-1',
    month: 'March',
    category: 'National & International Days',
    title: 'International Womens Day Celebration (8th March)',
    suggestedCommitteeId: 'port-safety',
    suggestedCommitteeName: 'Safety & POCSO Committee'
  }
];

export function getActivitiesByMonth(month: ThemeCalendarMonth): ThemeCalendarActivity[] {
  return THEME_CALENDAR_2026_27.filter(a => a.month === month);
}

export function getActivitiesByCategory(category: ThemeCalendarCategory): ThemeCalendarActivity[] {
  return THEME_CALENDAR_2026_27.filter(a => a.category === category);
}

export function getActivitiesForCommittee(committeeId: string): ThemeCalendarActivity[] {
  return THEME_CALENDAR_2026_27.filter(a => a.suggestedCommitteeId === committeeId);
}
