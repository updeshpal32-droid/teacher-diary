import { PortfolioCategory, ResponsibilityFrequency } from '../types/academic';

export interface RawCommitteeRow {
  serialNo?: number | string;
  name: string;
  category: PortfolioCategory;
  description: string;
  inchargeName: string;
  inchargeCode?: string;
  members: string; // Comma or semicolon separated
  responsibilities: string; // Semicolon separated duties (with optional (Freq))
}

export const SAMPLE_50_KVS_COMMITTEES: RawCommitteeRow[] = [
  {
    serialNo: 1,
    name: 'Examination & Evaluation Committee In-charge',
    category: 'Academic & Administration',
    description: 'Conducting PT-1, PT-2, Half Yearly, SEE examinations, CBSE Board LOC verification, evaluation rosters, and result analysis.',
    inchargeName: 'MR SAMYA RAHA',
    inchargeCode: '106020',
    members: 'UPDESH SINGH PAL, MANISH KUMAR YADAV, SANJUKTA KUJUR',
    responsibilities: 'Prepare Exam Date-Sheet & Duty Roster (Term); CBSE Board LOC Data & Subject Verification (Annual); Result Analysis & PI Reports (Term); Question Paper Moderation & Confidential Printing (Term)'
  },
  {
    serialNo: 2,
    name: 'Timetable & Daily Proxy Arrangement Committee',
    category: 'Academic & Administration',
    description: 'Master timetable scheduling, room allocations (Labs, Activity Rooms), and daily faculty proxy substitution arrangements.',
    inchargeName: 'DIPANWITA MANDAL',
    inchargeCode: '102725',
    members: 'UPDESH SINGH PAL, RAMESH CHANDRA SHARMA',
    responsibilities: 'Construct Master Timetable & Class-Wise Split (Annual); Daily Morning Proxy Duty Allocation (Daily); Special Room & Lab Timetable Scheduling (Monthly)'
  },
  {
    serialNo: 3,
    name: 'Admission Committee In-charge',
    category: 'Academic & Administration',
    description: 'KVS Online Admission portal operations, lottery execution, document verification, RTE & category quota admissions.',
    inchargeName: 'PRIYANKA MEHER',
    inchargeCode: '108896',
    members: 'MANISH KUMAR SIDAR, SANJUKTA KUJUR',
    responsibilities: 'Manage KVS Online Admission Portal & Lotteries (Annual); Document Verification & RTE Quota Scrutiny (Annual); Class XI Stream Allocation Roster (Annual)'
  },
  {
    serialNo: 4,
    name: 'Vidyalaya Management Committee (VMC) & Advisory Board',
    category: 'Academic & Administration',
    description: 'Coordinating VMC executive meetings, drafting agenda notes, parent-teacher-nominee resolutions, and administrative compliance.',
    inchargeName: 'MRS S. MOHAPATRA',
    inchargeCode: '106019',
    members: 'DIPANWITA MANDAL, MR SAMYA RAHA',
    responsibilities: 'Convene Quarterly VMC Meetings & Minutes (Term); Coordinate Local Administration & Nominee Liaison (As-needed); Annual Vidyalaya Development Plan Compilation (Annual)'
  },
  {
    serialNo: 5,
    name: 'Finance, GeM & Local Purchase Committee (LPC)',
    category: 'Office / Administrative',
    description: 'Government e-Marketplace (GeM) procurement, comparative bid preparation, invoice verification, and audit compliance.',
    inchargeName: 'UPDESH SINGH PAL',
    inchargeCode: '108894',
    members: 'MR SAMYA RAHA, DIPANWITA MANDAL',
    responsibilities: 'Create & Process GeM Bids and Direct Purchases (Monthly); Prepare Local Purchase Comparative Statements (Monthly); Annual VVN & Non-Govt Fund Audit Reconciliation (Annual)'
  },
  {
    serialNo: 6,
    name: 'Student Welfare, Safety & POCSO Committee',
    category: 'Student Welfare & Safety',
    description: 'Zero tolerance child safety enforcement, complaint box scrutiny, POCSO awareness, student emotional well-being and safety audits.',
    inchargeName: 'SANJUKTA KUJUR',
    inchargeCode: '108897',
    members: 'PRIYANKA MEHER, UPDESH SINGH PAL',
    responsibilities: 'Bi-Weekly Drop-Box Clearance & Redressal (Weekly); Monthly School Safety & Surveillance Audit (Monthly); POCSO & Child Rights Sensitization Assemblies (Term)'
  },
  {
    serialNo: 7,
    name: 'Disciplinary & Grievance Redressal Cell',
    category: 'Student Welfare & Safety',
    description: 'Monitoring campus discipline, punctuality, uniform adherence, anti-bullying measures, and parent-counselor consultations.',
    inchargeName: 'MANISH KUMAR YADAV',
    inchargeCode: '108898',
    members: 'RAMESH CHANDRA SHARMA, MR SAMYA RAHA',
    responsibilities: 'Daily Gate Punctuality & Uniform Supervision (Daily); Anti-Bullying Inspections & Log Maintenance (Weekly); Student Grievance Resolution & Counseling Records (As-needed)'
  },
  {
    serialNo: 8,
    name: 'Sports, Physical Education, Yoga & Fit India Committee',
    category: 'Activities, Clubs & Student Development',
    description: 'Organizing sports periods, Fit India School Week, Regional & National Sports Meets (RSM/NSM), Khelo India fitness assessments.',
    inchargeName: 'UPDESH SINGH PAL',
    inchargeCode: '108894',
    members: 'MANISH KUMAR YADAV, SANJUKTA KUJUR',
    responsibilities: 'Conduct Khelo India Student Fitness Assessments (Term); Organize Fit India School Week & Mass Yoga (Annual); Train Teams for KVS Regional & National Sports Meet (Annual); Maintain Sports Grounds & Equipment Inventory (Monthly)'
  },
  {
    serialNo: 9,
    name: 'Scouts & Guides / Cubs & Bulbul Troop',
    category: 'Activities, Clubs & Student Development',
    description: 'Troop registration, Pravesh to Rajya Puraskar badge testing, Tritiya Sopan camps, thinking day celebrations, and social service rallies.',
    inchargeName: 'MANISH KUMAR SIDAR',
    inchargeCode: '110505',
    members: 'PRIYANKA MEHER, DIPANWITA MANDAL',
    responsibilities: 'Conduct Weekly Scouts & Guides Patrol Meetings (Weekly); Organize Tritiya Sopan & Rajya Puraskar Testing Camps (Annual); Celebrate World Thinking Day & B.P. Day (Annual)'
  },
  {
    serialNo: 10,
    name: 'EBSB, Cultural & Kala Utsav Committee',
    category: 'Activities, Clubs & Student Development',
    description: 'Ek Bharat Shreshtha Bharat activities, language learning pledge, folk dances, indigenous games, and annual school cultural day.',
    inchargeName: 'MR SAMYA RAHA',
    inchargeCode: '106020',
    members: 'SANJUKTA KUJUR, DIPANWITA MANDAL',
    responsibilities: 'Organize Daily EBSB Sentence Learning in Assembly (Daily); Coordinate Kala Utsav Regional Level Entries (Annual); Direct Annual Day Cultural Performances (Annual)'
  },
  {
    serialNo: 11,
    name: 'Science Club, STEM, ATL & INSPIRE Cell',
    category: 'Activities, Clubs & Student Development',
    description: 'Conducting National Children Science Congress (NCSC), INSPIRE Award MANAK nominations, Rashtriya Bal Vaigyanik Pradarshani, and science quizzes.',
    inchargeName: 'DIPANWITA MANDAL',
    inchargeCode: '102725',
    members: 'RAMESH CHANDRA SHARMA, MR SAMYA RAHA',
    responsibilities: 'Submit INSPIRE MANAK Student Project Nominations (Annual); Guide Projects for National Children Science Congress (Annual); Organize National Science Day Exhibition (Annual)'
  },
  {
    serialNo: 12,
    name: 'Eco Club & Green School / Swachhata Committee',
    category: 'Maintenance & Infrastructure',
    description: 'Swachhata Pakhwada, tree plantation (Ek Ped Maa Ke Naam), herbal garden maintenance, rainwater harvesting and plastic-free campus drives.',
    inchargeName: 'PRIYANKA MEHER',
    inchargeCode: '108896',
    members: 'UPDESH SINGH PAL, MANISH KUMAR SIDAR',
    responsibilities: 'Conduct Swachhata Pakhwada & Cleanliness Audits (Term); Maintain Vidyalaya Botanical & Herbal Garden (Weekly); Organize Tree Plantation Drives & Eco-Pledges (Annual)'
  },
  {
    serialNo: 13,
    name: 'Library & Reading Promotion Committee',
    category: 'Academic & Administration',
    description: 'Library automation via e-Granthalaya, National Book Week celebrations, Class Library management, and reading challenge monitoring.',
    inchargeName: 'SANJUKTA KUJUR',
    inchargeCode: '108897',
    members: 'MRS S. MOHAPATRA, PRIYANKA MEHER',
    responsibilities: 'Update e-Granthalaya Catalog & Circulation (Weekly); Celebrate National Reading Month & P.N. Panicker Day (Annual); Manage Class Library Book Circulation (Monthly)'
  },
  {
    serialNo: 14,
    name: 'IT, Website, ICT, AI & PM SHRI Digital Cell',
    category: 'Academic & Administration',
    description: 'School website content updates, ICT lab maintenance, UDISE+ data entry, PRABANDH portal uploads, and PM SHRI digital initiatives.',
    inchargeName: 'MANISH KUMAR SIDAR',
    inchargeCode: '110505',
    members: 'UPDESH SINGH PAL, MR SAMYA RAHA',
    responsibilities: 'Maintain Vidyalaya Website & Mandatory Public Disclosures (Monthly); Manage UDISE+ & Student Data Ingestion (Annual); Maintain Computer Lab Hardware & Internet Connectivity (Daily)'
  },
  {
    serialNo: 15,
    name: 'Career Guidance, Counseling & Mental Health Cell',
    category: 'Student Welfare & Safety',
    description: 'Career counseling seminars, Manodarpan mental health sessions, CUET / NDA / JEE / NEET orientation, and emotional helpline support.',
    inchargeName: 'RAMESH CHANDRA SHARMA',
    inchargeCode: '108899',
    members: 'SANJUKTA KUJUR, DIPANWITA MANDAL',
    responsibilities: 'Organize Career Awareness & Competitive Exam Guidance (Term); Conduct Manodarpan Psychological Support Sessions (Monthly); Facilitate Alumni Mentorship Talks for Class XII (Term)'
  },
  {
    serialNo: 16,
    name: 'Language Club & Hindi Pakhwada Committee',
    category: 'Activities, Clubs & Student Development',
    description: 'Conducting Hindi Pakhwada, Matribhasha Diwas, Sanskrit Saptah, English literary competitions, and creative writing workshops.',
    inchargeName: 'MRS S. MOHAPATRA',
    inchargeCode: '106019',
    members: 'PRIYANKA MEHER, SANJUKTA KUJUR',
    responsibilities: 'Organize Hindi Pakhwada Competitions & Prize Distribution (Annual); Celebrate International Mother Tongue Day (Annual); Conduct Spell-Bee & Creative Writing Contests (Term)'
  },
  {
    serialNo: 17,
    name: 'Mathematics & Vedic Math Club',
    category: 'Activities, Clubs & Student Development',
    description: 'National Mathematics Day (Ramanujan Day), Math Olympiad coaching, Math Lab activities, and mental math workshops.',
    inchargeName: 'MANISH KUMAR YADAV',
    inchargeCode: '108898',
    members: 'DIPANWITA MANDAL, UPDESH SINGH PAL',
    responsibilities: 'Celebrate National Mathematics Day & Model Exhibition (Annual); Conduct Math Olympiad & Aryabhata Ganit Challenge (Annual); Organize Math Lab Experiential Learning Hours (Weekly)'
  },
  {
    serialNo: 18,
    name: 'Social Science & Heritage Club',
    category: 'Activities, Clubs & Student Development',
    description: 'Social Science exhibition, Constitution Day celebrations, Model United Nations (MUN), and local historical monument documentation.',
    inchargeName: 'RAMESH CHANDRA SHARMA',
    inchargeCode: '108899',
    members: 'MANISH KUMAR SIDAR, MRS S. MOHAPATRA',
    responsibilities: 'Organize Social Science Exhibition & Youth Parliament (Annual); Celebrate Constitution Day & Preamble Reading (Annual); Conduct Local Heritage Awareness Visits (Annual)'
  },
  {
    serialNo: 19,
    name: 'Art, Craft & S.U.P.W. Committee',
    category: 'Activities, Clubs & Student Development',
    description: 'School campus beautification, SUPW practical projects, thematic wall paintings, stage decorations, and craft exhibitions.',
    inchargeName: 'MR SAMYA RAHA',
    inchargeCode: '106020',
    members: 'SANJUKTA KUJUR, PRIYANKA MEHER',
    responsibilities: 'Design Stage Backdrops & Signages for All School Events (As-needed); Conduct Annual Art & SUPW Craft Exhibition (Annual); Maintain Campus Murals & Aesthetics (Monthly)'
  },
  {
    serialNo: 20,
    name: 'House System & Inter-House Competitions Committee',
    category: 'Activities, Clubs & Student Development',
    description: 'Allocating students to Shivaji, Tagore, Ashoka, and Raman houses, maintaining House points tally, and conducting Saturday CCA activities.',
    inchargeName: 'UPDESH SINGH PAL',
    inchargeCode: '108894',
    members: 'MANISH KUMAR YADAV, DIPANWITA MANDAL, SANJUKTA KUJUR',
    responsibilities: 'Prepare Annual CCA Calendar & Saturday Activity Schedule (Annual); Maintain House Points Scoreboard & Shield Awards (Weekly); Supervise Inter-House Debate, Quiz & Patriotic Song Competitions (Monthly)'
  },
  {
    serialNo: 21,
    name: 'Morning Assembly & Daily Diary Maintenance Committee',
    category: 'Academic & Administration',
    description: 'Supervising daily assembly rota, thought of the day, GK quiz, news reading, audio-system coordination, and teacher diary checks.',
    inchargeName: 'DIPANWITA MANDAL',
    inchargeCode: '102725',
    members: 'RAMESH CHANDRA SHARMA, MR SAMYA RAHA',
    responsibilities: 'Supervise Daily Morning Assembly Conduct & Discipline (Daily); Verify Weekly Teacher Diary Logs & Workload Entries (Weekly); Organize Special Thematic Assembly Presentations (Weekly)'
  },
  {
    serialNo: 22,
    name: 'Furniture & Annual Physical Stock Verification Committee',
    category: 'Maintenance & Infrastructure',
    description: 'Conducting annual physical verification of laboratory, library, sports, AV, and classroom furniture stocks with condemnation reports.',
    inchargeName: 'MANISH KUMAR YADAV',
    inchargeCode: '108898',
    members: 'UPDESH SINGH PAL, MANISH KUMAR SIDAR',
    responsibilities: 'Conduct Annual Physical Stock Verification & Discrepancy Reconciliation (Annual); Prepare Unserviceable Furniture Condemnation Board Proceedings (Annual); Maintain Central Stock Register & Room Inventories (Term)'
  },
  {
    serialNo: 23,
    name: 'Building, Campus & Infrastructure Maintenance Committee',
    category: 'Maintenance & Infrastructure',
    description: 'Supervising civil and electrical maintenance, CPWD coordination, white-washing, boundary security, and classroom repairs.',
    inchargeName: 'UPDESH SINGH PAL',
    inchargeCode: '108894',
    members: 'MR SAMYA RAHA, RAMESH CHANDRA SHARMA',
    responsibilities: 'Coordinate with CPWD / MES for Civil & Electrical Repairs (Monthly); Inspect Boundary Walls, Gates & Campus Security Barriers (Weekly); Supervise Annual Campus Painting & Whitewash (Annual)'
  },
  {
    serialNo: 24,
    name: 'Drinking Water, Sanitation & Solar Power Cell',
    category: 'Maintenance & Infrastructure',
    description: 'Monitoring RO water plants, water testing lab certifications, toilet hygiene inspections, and rooftop solar grid operations.',
    inchargeName: 'SANJUKTA KUJUR',
    inchargeCode: '108897',
    members: 'PRIYANKA MEHER, UPDESH SINGH PAL',
    responsibilities: 'Get Water Potability Lab Testing Done Every Quarter (Term); Conduct Daily Toilet Cleanliness & Hygiene Inspections (Daily); Monitor RO Purifier Filter Replacement & Solar Net Metering (Monthly)'
  },
  {
    serialNo: 25,
    name: 'First Aid, Medical & Health Checkup Committee',
    category: 'Student Welfare & Safety',
    description: 'Maintaining medical room supplies, annual student health checkup cards, height-weight-BMI tracking, and emergency hospital liaison.',
    inchargeName: 'PRIYANKA MEHER',
    inchargeCode: '108896',
    members: 'UPDESH SINGH PAL, SANJUKTA KUJUR',
    responsibilities: 'Conduct Annual Comprehensive Student Health Checkup (Annual); Maintain First Aid Box Supplies & Expiry Tracker (Monthly); Track Height, Weight & BMI of All Students (Term)'
  },
  {
    serialNo: 26,
    name: 'Canteen, Refreshment & Mid-Day Refreshment Cell',
    category: 'Student Welfare & Safety',
    description: 'Supervising student nutrition, clean drinking water, hygiene during school events, and refreshments for external invigilators.',
    inchargeName: 'MRS S. MOHAPATRA',
    inchargeCode: '106019',
    members: 'DIPANWITA MANDAL, MANISH KUMAR SIDAR',
    responsibilities: 'Audit Food Hygiene & Cleanliness in School Refreshment Area (Monthly); Arrange Refreshments for CBSE / Sports / Cultural Meets (As-needed)'
  },
  {
    serialNo: 27,
    name: 'Remedial Teaching & Slow Learners Support Cell',
    category: 'Academic & Administration',
    description: 'Identifying struggling students post PT-1/Half-Yearly, arranging zero-period extra classes, peer tutoring, and parent progress updates.',
    inchargeName: 'DIPANWITA MANDAL',
    inchargeCode: '102725',
    members: 'MANISH KUMAR YADAV, MRS S. MOHAPATRA',
    responsibilities: 'Identify At-Risk Students & Maintain Remedial Diagnostic Registers (Term); Schedule Zero-Period Revision Classes (Weekly); Track Improvement Index for Board Classes (Monthly)'
  },
  {
    serialNo: 28,
    name: 'Gifted Students & Olympiad / NTSE / KVPY Cell',
    category: 'Academic & Administration',
    description: 'Special mentoring for high-achievers, competitive exam registration (NTSE, Olympiads, Aryabhata), and advanced research projects.',
    inchargeName: 'RAMESH CHANDRA SHARMA',
    inchargeCode: '108899',
    members: 'DIPANWITA MANDAL, MANISH KUMAR YADAV',
    responsibilities: 'Register Students for International & National Olympiads (Term); Conduct Advanced Problem Solving Weekend Sessions (Weekly); Mentor INSPIRE & Young Scientist Fellows (Annual)'
  },
  {
    serialNo: 29,
    name: 'FLN (Foundational Literacy & Numeracy) / NIPUN Bharat Cell',
    category: 'Academic & Administration',
    description: 'Monitoring NIPUN Bharat targets for Balvatika to Class III, Jaadui Pitara TLM integration, and vidyapravesh readiness modules.',
    inchargeName: 'PRIYANKA MEHER',
    inchargeCode: '108896',
    members: 'SANJUKTA KUJUR, MRS S. MOHAPATRA',
    responsibilities: 'Conduct Periodic FLN Reading & Math Competency Assessments (Monthly); Implement Jaadui Pitara Play-Based TLMs in Primary Classes (Weekly); Organize Primary Grandparents Day & FLN Melas (Annual)'
  },
  {
    serialNo: 30,
    name: 'Vidyanjali & Community Engagement Cell',
    category: 'Academic & Administration',
    description: 'Connecting school with community volunteers, alumni resource persons, NGO partnerships, and CSR infrastructure contributions.',
    inchargeName: 'MANISH KUMAR SIDAR',
    inchargeCode: '110505',
    members: 'MR SAMYA RAHA, RAMESH CHANDRA SHARMA',
    responsibilities: 'Upload School Requirements on Ministry Vidyanjali Portal (Monthly); Coordinate Volunteer Guest Lectures & Career Mentorships (Term); Acknowledge Community Contributors & CSR Partners (Annual)'
  },
  {
    serialNo: 31,
    name: 'Alumni Association & Old Students Network',
    category: 'Office / Administrative',
    description: 'Maintaining alumni database, organizing annual alumni reunions, career interactions, and legacy donation drives.',
    inchargeName: 'MR SAMYA RAHA',
    inchargeCode: '106020',
    members: 'UPDESH SINGH PAL, MANISH KUMAR SIDAR',
    responsibilities: 'Update Alumni Register & Digital Directory (Monthly); Convene Annual Vidyalaya Alumni Meet (Annual); Facilitate Alumni Scholarship Programs (Annual)'
  },
  {
    serialNo: 32,
    name: 'PTA (Parent-Teacher Association) Executive Committee',
    category: 'Academic & Administration',
    description: 'Parent-teacher engagement, general body meetings, constructive feedback collection, and academic collaboration.',
    inchargeName: 'MRS S. MOHAPATRA',
    inchargeCode: '106019',
    members: 'DIPANWITA MANDAL, UPDESH SINGH PAL',
    responsibilities: 'Organize Post-Exam PTMs with 100% Attendance Drive (Term); Convene Annual General Body Meeting of PTA (Annual); Document Parent Feedback & Redressal Measures (Term)'
  },
  {
    serialNo: 33,
    name: 'NEP 2020 Implementation & 10 Bagless Days Cell',
    category: 'Academic & Administration',
    description: 'Planning 10 Bagless Days for Classes VI-VIII, local craft apprenticeships, vocational exposure, and experiential learning projects.',
    inchargeName: 'UPDESH SINGH PAL',
    inchargeCode: '108894',
    members: 'MR SAMYA RAHA, PRIYANKA MEHER',
    responsibilities: 'Schedule & Execute 10 Bagless Days Vocational Modules (Term); Organize Local Artisan & Craft Workshops (Annual); Maintain Experiential Learning Records as per NEP Guidelines (Term)'
  },
  {
    serialNo: 34,
    name: 'Educational Excursion, Tour & Field Visit Committee',
    category: 'Activities, Clubs & Student Development',
    description: 'Planning local educational trips, science city visits, museum tours, historical excursions, and student travel safety.',
    inchargeName: 'MANISH KUMAR YADAV',
    inchargeCode: '108898',
    members: 'UPDESH SINGH PAL, SANJUKTA KUJUR',
    responsibilities: 'Obtain Parent Consent & RO Approval for Field Excursions (As-needed); Organize Annual Educational Tour for Senior Classes (Annual); Supervise Travel Insurance & First Aid Protocols (As-needed)'
  },
  {
    serialNo: 35,
    name: 'Audio-Visual, PA System & Stage Arrangement Committee',
    category: 'Maintenance & Infrastructure',
    description: 'Managing public address microphones, podiums, LED projector screens, stage lighting, and sound check during events.',
    inchargeName: 'MANISH KUMAR SIDAR',
    inchargeCode: '110505',
    members: 'MR SAMYA RAHA, UPDESH SINGH PAL',
    responsibilities: 'Setup PA System & Microphones for Morning Assembly (Daily); Coordinate Audio-Visual Projection for Seminars & Meetings (As-needed); Maintain Sound Mixer, Amplifiers & Cordless Mics (Monthly)'
  },
  {
    serialNo: 36,
    name: 'Photography, Video Documentation & Media Press Cell',
    category: 'Office / Administrative',
    description: 'Documenting school events, preparing press releases for local dailies, compiling photo archives, and social media showcase.',
    inchargeName: 'MR SAMYA RAHA',
    inchargeCode: '106020',
    members: 'MANISH KUMAR SIDAR, RAMESH CHANDRA SHARMA',
    responsibilities: 'Photograph All Official Institutional Events & Dignitary Visits (As-needed); Draft & Send Press Notes to Local Newspapers (As-needed); Maintain High-Resolution Digital Photo Archive (Monthly)'
  },
  {
    serialNo: 37,
    name: 'School Magazine (Vidyalaya Patrika) Editorial Board',
    category: 'Academic & Administration',
    description: 'Collecting student and staff articles, poems, drawings, editing English/Hindi/Sanskrit sections, designing layout, and printing the annual magazine.',
    inchargeName: 'MRS S. MOHAPATRA',
    inchargeCode: '106019',
    members: 'PRIYANKA MEHER, MR SAMYA RAHA',
    responsibilities: 'Collect & Moderate Student Articles, Poems & Artwork (Term); Edit & Proofread Hindi, English & Sanskrit Sections (Annual); Finalize Magazine Layout & Oversee Publication Printing (Annual)'
  },
  {
    serialNo: 38,
    name: 'Annual Day, Sports Day & National Festivals Committee',
    category: 'Activities, Clubs & Student Development',
    description: 'Organizing Independence Day, Republic Day, Gandhi Jayanti, Annual Athletic Meet, invitation cards, stage decor, and VIP protocols.',
    inchargeName: 'UPDESH SINGH PAL',
    inchargeCode: '108894',
    members: 'MR SAMYA RAHA, DIPANWITA MANDAL, MANISH KUMAR YADAV',
    responsibilities: 'Organize Independence Day & Republic Day Celebrations (Annual); Draft Invitation Protocols & VIP Seating Arrangements (As-needed); Supervise March-Past & Prize Distribution Logistics (Annual)'
  },
  {
    serialNo: 39,
    name: 'Staff Common Room & Welfare Committee',
    category: 'Office / Administrative',
    description: 'Staff tea club, staff welfare initiatives, farewells, felicitation of teachers on achievements, and staff lounge amenities.',
    inchargeName: 'SANJUKTA KUJUR',
    inchargeCode: '108897',
    members: 'MRS S. MOHAPATRA, RAMESH CHANDRA SHARMA',
    responsibilities: 'Manage Staff Welfare Fund & Tea Club Subscriptions (Monthly); Organize Farewell & Welcome Functions for Faculty (As-needed); Maintain Staff Lounge Cleanliness & Essentials (Weekly)'
  },
  {
    serialNo: 40,
    name: 'RTI, Legal & Public Relations Monitoring Cell',
    category: 'Office / Administrative',
    description: 'Tracking Right to Information applications, ensuring time-bound replies within 30 days, court case records, and official replies.',
    inchargeName: 'RAMESH CHANDRA SHARMA',
    inchargeCode: '108899',
    members: 'MRS S. MOHAPATRA, UPDESH SINGH PAL',
    responsibilities: 'Draft Accurate RTI Replies within Statutory 30-Day Deadline (As-needed); Maintain RTI Receipt & Disposal Register (Monthly); Coordinate with Legal Counsel for Any Sub-Judice Returns (As-needed)'
  },
  {
    serialNo: 41,
    name: 'Right to Education (RTE) & 25% Quota Monitoring Cell',
    category: 'Student Welfare & Safety',
    description: 'Monitoring RTE 25% quota student admissions, free uniform & textbook distribution, academic progress tracking, and equity support.',
    inchargeName: 'PRIYANKA MEHER',
    inchargeCode: '108896',
    members: 'SANJUKTA KUJUR, MANISH KUMAR SIDAR',
    responsibilities: 'Verify RTE Student Free Books & Uniform Reimbursements (Annual); Monitor Academic Progress & Extra Support for RTE Students (Term); Submit RTE Compliance Returns to KVS Regional Office (Annual)'
  },
  {
    serialNo: 42,
    name: 'Internal Complaints Committee (ICC / POSH)',
    category: 'Student Welfare & Safety',
    description: 'Statutory compliance under Prevention of Sexual Harassment of Women at Workplace Act 2013, workshops, and grievance hearings.',
    inchargeName: 'MRS S. MOHAPATRA',
    inchargeCode: '106019',
    members: 'SANJUKTA KUJUR, DIPANWITA MANDAL',
    responsibilities: 'Display Statutory POSH Posters & Internal Committee Details (Annual); Conduct Gender Sensitization Workshops for Staff (Annual); Submit Annual ICC Report to KVS RO & District Officer (Annual)'
  },
  {
    serialNo: 43,
    name: 'Disaster Management & Fire Safety Cell',
    category: 'Student Welfare & Safety',
    description: 'Conducting mock fire drills, evacuation map displays, fire extinguisher refilling, disaster management plan, and liaison with fire department.',
    inchargeName: 'UPDESH SINGH PAL',
    inchargeCode: '108894',
    members: 'MANISH KUMAR YADAV, RAMESH CHANDRA SHARMA',
    responsibilities: 'Conduct Half-Yearly Campus Fire Evacuation Mock Drills (Term); Inspect Fire Extinguishers & Refilling Expiry Dates (Monthly); Update Vidyalaya Disaster Management Plan (VDMP) (Annual)'
  },
  {
    serialNo: 44,
    name: 'Cyber Safety, Information Security & Data Protection Cell',
    category: 'Student Welfare & Safety',
    description: 'Cyber hygiene workshops, safe internet usage guidelines, social media safety for students, and student personal data security.',
    inchargeName: 'MANISH KUMAR SIDAR',
    inchargeCode: '110505',
    members: 'DIPANWITA MANDAL, MR SAMYA RAHA',
    responsibilities: 'Conduct Cyber Safety Assemblies & Cyber Jagrookta Diwas (Monthly); Ensure Firewall & Content Filtering on School Internet (Monthly); Sensitize Students on Safe Social Media Practices (Term)'
  },
  {
    serialNo: 45,
    name: 'National Green Corps (NGC) & Waste Segregation Cell',
    category: 'Maintenance & Infrastructure',
    description: 'Zero waste campus, dry/wet waste segregation bins, composting pit management, e-waste disposal, and energy conservation.',
    inchargeName: 'PRIYANKA MEHER',
    inchargeCode: '108896',
    members: 'UPDESH SINGH PAL, SANJUKTA KUJUR',
    responsibilities: 'Supervise Wet/Dry Waste Segregation at Source (Daily); Maintain School Compost Pit & Organic Fertilizer Usage (Monthly); Conduct E-Waste Collection & Safe Disposal (Annual)'
  },
  {
    serialNo: 46,
    name: 'Road Safety & Traffic Awareness Club',
    category: 'Student Welfare & Safety',
    description: 'Traffic rules orientation, bicycle stand parking order, helmet awareness, safe dispersal supervision, and student van verification.',
    inchargeName: 'MANISH KUMAR YADAV',
    inchargeCode: '108898',
    members: 'UPDESH SINGH PAL, RAMESH CHANDRA SHARMA',
    responsibilities: 'Supervise Afternoon Student Dispersal & Gate Traffic (Daily); Verify Commercial Auto/Van Drivers Verification Documents (Term); Organize Road Safety Week Competitions & Pledges (Annual)'
  },
  {
    serialNo: 47,
    name: 'Heritage Club & Spic Macay Chapter',
    category: 'Activities, Clubs & Student Development',
    description: 'Spic Macay classical music/dance lecture demonstrations, heritage passport activities, and celebrating World Heritage Day.',
    inchargeName: 'MR SAMYA RAHA',
    inchargeCode: '106020',
    members: 'MRS S. MOHAPATRA, SANJUKTA KUJUR',
    responsibilities: 'Host Classical Artists via Spic Macay Outreach (Annual); Celebrate World Heritage Day & Monument Quizzes (Annual); Organize Heritage Walks & Traditional Craft Workshops (Annual)'
  },
  {
    serialNo: 48,
    name: 'Quiz, Debate & Model United Nations (MUN) Club',
    category: 'Activities, Clubs & Student Development',
    description: 'Training students in parliamentary debate, Heritage Quiz, G.K. competitions, mock youth parliament, and inter-school debate participation.',
    inchargeName: 'RAMESH CHANDRA SHARMA',
    inchargeCode: '108899',
    members: 'DIPANWITA MANDAL, PRIYANKA MEHER',
    responsibilities: 'Conduct Monthly Vidyalaya Inter-House Quiz Leagues (Monthly); Train Debate Teams for Regional Level Competitions (Term); Coordinate Youth Parliament Festival Entries (Annual)'
  },
  {
    serialNo: 49,
    name: 'Co-Curricular Assessment & Portfolio Verification Committee',
    category: 'Academic & Administration',
    description: 'Verifying student co-scholastic grading (Art, Health & Physical Education, Work Experience), life skills rubrics, and holistic progress cards (HPC).',
    inchargeName: 'DIPANWITA MANDAL',
    inchargeCode: '102725',
    members: 'MR SAMYA RAHA, UPDESH SINGH PAL',
    responsibilities: 'Standardize Co-Scholastic Assessment Rubrics Across Classes (Term); Audit Student Holistic Progress Card (HPC) Portfolios (Term); Compile Co-Scholastic Grades for Report Card Generation (Term)'
  },
  {
    serialNo: 50,
    name: 'CPD, Faculty Training & Peer Learning Study Circle',
    category: 'Academic & Administration',
    description: 'Tracking 50 hours Continuous Professional Development (CPD) for all teachers via NISHTHA / DIKSHA / KVS ZIET modules and organizing peer workshops.',
    inchargeName: 'MRS S. MOHAPATRA',
    inchargeCode: '106019',
    members: 'DIPANWITA MANDAL, RAMESH CHANDRA SHARMA, UPDESH SINGH PAL',
    responsibilities: 'Monitor Teacher 50-Hour Annual CPD Compliance on DIKSHA (Term); Organize Monthly In-House Pedagogical Sharing Circles (Monthly); Maintain Record of ZIET & Regional Office Training Nominees (Annual)'
  }
];
