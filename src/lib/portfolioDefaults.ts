import {
  PortfolioTemplate,
  PortfolioAssignment,
  ResponsibilityDelegation,
  ResponsibilityRequest,
  PortfolioSuggestion
} from '../types/academic';

export const DEFAULT_PORTFOLIO_TEMPLATES: PortfolioTemplate[] = [
  {
    id: 'port-exam',
    name: 'Examination & Evaluation Committee In-charge',
    category: 'Academic & Administration',
    description: 'Responsible for conducting all school examinations (PT-1, PT-2, Half Yearly, Pre-Boards, Session Ending), CBSE Board registration, evaluation rosters, and result analysis.',
    isCommittee: true,
    createdBy: 'Principal / Admin',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    isActive: true,
    responsibilities: [
      {
        id: 'resp-exam-1',
        title: 'Prepare Exam Date-Sheet & Invigilation Duty Roster',
        description: 'Prepare and circulate session exam timetable for PT-1, PT-2, Half-Yearly, and SEE examinations across classes I to XII with invigilation duties.',
        frequency: 'Term',
        suggestedMonths: ['July', 'September', 'December', 'February'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'Periodic Test & Half Yearly Examination Schedule'
      },
      {
        id: 'resp-exam-2',
        title: 'CBSE Board LOC Data & Subject Verification',
        description: 'Verify List of Candidates (LOC), subject codes, spelling, and eligibility on the CBSE Pariksha Sangam portal for Classes X and XII.',
        frequency: 'Annual',
        suggestedMonths: ['August', 'September', 'October'],
        isMandatory: true,
        canBeDelegated: false,
        linkedThemeCalendarActivity: 'CBSE Board LOC Submission & Verification'
      },
      {
        id: 'resp-exam-3',
        title: 'Compile Subject-Wise Result Analysis & RO Reports',
        description: 'Generate class-wise and subject-wise PI (Performance Index), pass percentage tables, and grade distributions for Regional Office submission.',
        frequency: 'Term',
        suggestedMonths: ['October', 'March'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'Result Declaration & RO Returns'
      },
      {
        id: 'resp-exam-4',
        title: 'Question Paper Moderation & Confidential Printing',
        description: 'Collect, moderate, and print sealed question papers for all classes ensuring strict confidentiality.',
        frequency: 'Term',
        suggestedMonths: ['July', 'September', 'December', 'February'],
        isMandatory: true,
        canBeDelegated: false
      }
    ]
  },
  {
    id: 'port-timetable',
    name: 'Timetable & Daily Proxy Arrangement Committee',
    category: 'Academic & Administration',
    description: 'Responsible for master school timetable planning, room allocations (Labs, Activity Rooms), and daily faculty proxy duty arrangements.',
    isCommittee: true,
    createdBy: 'Principal / Admin',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    isActive: true,
    responsibilities: [
      {
        id: 'resp-tt-1',
        title: 'Construct Master Timetable & Class-Wise Split',
        description: 'Draft and finalize the master institutional timetable balancing teacher periods (27-30 periods/week) and NEP stage guidelines.',
        frequency: 'Annual',
        suggestedMonths: ['April', 'June'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'Academic Session Timetable Implementation'
      },
      {
        id: 'resp-tt-2',
        title: 'Daily Morning Roll-Call Proxy Duty Allocation',
        description: 'Identify absent teachers by 07:45 AM and allocate proxy duties to free faculty, updating substitution registers & TaskManager.',
        frequency: 'Daily',
        suggestedMonths: ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'],
        isMandatory: true,
        canBeDelegated: true
      },
      {
        id: 'resp-tt-3',
        title: 'Special Room & Laboratory Timetable Scheduling',
        description: 'Schedule rotation slots for Science Lab, Computer Lab, Junior Science Lab, and Library.',
        frequency: 'Monthly',
        suggestedMonths: ['April', 'July', 'October'],
        isMandatory: false,
        canBeDelegated: true
      }
    ]
  },
  {
    id: 'port-admission',
    name: 'Admission Committee In-charge',
    category: 'Academic & Administration',
    description: 'Oversees student admissions for Balvatika, Class I (RTE, KVS Wards, SGC), and fresh admissions across classes II to XI per KVS Admission Guidelines.',
    isCommittee: true,
    createdBy: 'Principal / Admin',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    isActive: true,
    responsibilities: [
      {
        id: 'resp-adm-1',
        title: 'Conduct RTE & Category Lotteries with Registered Video Proof',
        description: 'Execute transparent online lottery for Class I & Balvatika admissions in presence of parent representatives and video documentation.',
        frequency: 'Annual',
        suggestedMonths: ['April', 'May'],
        isMandatory: true,
        canBeDelegated: false,
        linkedThemeCalendarActivity: 'KVS Online Admission Lottery & Scrutiny'
      },
      {
        id: 'resp-adm-2',
        title: 'Scrutinize Eligibility Documents, TCs & Category Proofs',
        description: 'Verify birth certificates, service certificates, transfer orders, caste certificates, and distance criteria for applicants.',
        frequency: 'Annual',
        suggestedMonths: ['April', 'May', 'June', 'July'],
        isMandatory: true,
        canBeDelegated: true
      },
      {
        id: 'resp-adm-3',
        title: 'Maintain Admission & Withdrawal Register (Page 20)',
        description: 'Record newly admitted scholars in official Admission/Withdrawal Register with unique Scholar Roll numbers.',
        frequency: 'Monthly',
        suggestedMonths: ['April', 'May', 'June', 'July', 'August'],
        isMandatory: true,
        canBeDelegated: true
      }
    ]
  },
  {
    id: 'port-sports',
    name: 'Sports, Physical Education & Health Committee',
    category: 'Activities, Clubs & Student Development',
    description: 'Leads physical education, morning assembly fitness, mass PT, KVS Regional/National Sports Meets, and Annual Athletic Sports Day.',
    isCommittee: true,
    createdBy: 'Principal / Admin',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    isActive: true,
    responsibilities: [
      {
        id: 'resp-sports-1',
        title: 'Organize Daily Morning Mass PT & Yoga Protocol',
        description: 'Lead synchronized morning exercise drills, Surya Namaskar, and aerobic routines during morning assembly.',
        frequency: 'Daily',
        suggestedMonths: ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'Fit India School Week & Daily Mass PT'
      },
      {
        id: 'resp-sports-2',
        title: 'Prepare & Escort Contingent for KVS Regional Sports Meet',
        description: 'Conduct trials, coaching camps, medical checks, and escort students for Cluster & Regional Athletics/Games tournaments.',
        frequency: 'Annual',
        suggestedMonths: ['July', 'August', 'September'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'KVS Regional Sports Meet & Escort Duty'
      },
      {
        id: 'resp-sports-3',
        title: 'Organize Annual Vidyalaya Sports Day & Athletic Events',
        description: 'Coordinate house-wise track & field events, pyramid formations, march-past drills, and medal distribution.',
        frequency: 'Annual',
        suggestedMonths: ['November', 'December'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'Annual Sports Day & Athletic Meet'
      },
      {
        id: 'resp-sports-4',
        title: 'Maintain Sports Equipment Inventory & First Aid Readiness',
        description: 'Audit balls, hurdles, safety crash mats, high-jump pits, and emergency sports first-aid kits.',
        frequency: 'Monthly',
        suggestedMonths: ['April', 'July', 'October', 'January'],
        isMandatory: true,
        canBeDelegated: true
      }
    ]
  },
  {
    id: 'port-scouts',
    name: 'Scouts & Guides / Cubs & Bulbuls Unit',
    category: 'Activities, Clubs & Student Development',
    description: 'Oversees troop registrations, weekly patrol activities, Tritiya Sopan & Rajya Puraskar testing camps, and community service.',
    isCommittee: true,
    createdBy: 'Principal / Admin',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    isActive: true,
    responsibilities: [
      {
        id: 'resp-scout-1',
        title: 'Conduct Weekly Scout/Guide Patrol Meetings & Knotting Drills',
        description: 'Teach compass reading, pioneering knots, first-aid bandages, and B-P six exercises.',
        frequency: 'Weekly',
        suggestedMonths: ['April', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February'],
        isMandatory: true,
        canBeDelegated: true
      },
      {
        id: 'resp-scout-2',
        title: 'Organize Tritiya Sopan & Rajya Puraskar Testing Camps',
        description: 'Prepare log books, service projects, and escort scouts to KVS Divisional & State testing rallies.',
        frequency: 'Annual',
        suggestedMonths: ['August', 'October', 'November'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'Rajya Puraskar & Rashtrapati Scout Testing Camp'
      },
      {
        id: 'resp-scout-3',
        title: 'Celebrate World Thinking Day & Scout Founder Day',
        description: 'Organize all-faith prayer, community clean-up drive, and thinking penny contribution.',
        frequency: 'Annual',
        suggestedMonths: ['February'],
        isMandatory: false,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'World Thinking Day Observance'
      }
    ]
  },
  {
    id: 'port-cca',
    name: 'CCA, Cultural & Morning Assembly Committee',
    category: 'Activities, Clubs & Student Development',
    description: 'Manages the 4-House system (Shivaji, Tagore, Ashoka, Raman), weekly co-curricular competitions, and commemorative celebrations.',
    isCommittee: true,
    createdBy: 'Principal / Admin',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    isActive: true,
    responsibilities: [
      {
        id: 'resp-cca-1',
        title: 'Design Annual Theme-Wise CCA Calendar & Rubrics',
        description: 'Prepare schedule for debate, quiz, recitation, singing, folk dance, drawing, and essay competitions.',
        frequency: 'Annual',
        suggestedMonths: ['April'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'Annual CCA & House Activity Calendar'
      },
      {
        id: 'resp-cca-2',
        title: 'Coordinate Daily House Morning Assembly Protocol',
        description: 'Ensure student thought for the day, news reading, pledge, special talks, and audio-system setup.',
        frequency: 'Daily',
        suggestedMonths: ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'],
        isMandatory: true,
        canBeDelegated: true
      },
      {
        id: 'resp-cca-3',
        title: 'Organize Independence Day & Republic Day Celebrations',
        description: 'Conduct flag hoisting parade, patriotic cultural songs, dance dramas, and sweet distribution.',
        frequency: 'Term',
        suggestedMonths: ['August', 'January'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'Independence Day & Republic Day Celebrations'
      }
    ]
  },
  {
    id: 'port-science',
    name: 'Science Exhibition, NCSC & Atal Tinkering Lab (ATL)',
    category: 'Activities, Clubs & Student Development',
    description: 'Drives scientific inquiry, National Children Science Congress projects, JNNSMEE school-level exhibits, and hands-on tinkering in ATL.',
    isCommittee: true,
    createdBy: 'Principal / Admin',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    isActive: true,
    responsibilities: [
      {
        id: 'resp-sci-1',
        title: 'Organize School-Level JNNSMEE Science Exhibition',
        description: 'Mentor student working models across themes (Renewable energy, Health, Robotics, AI, Agriculture) for regional selection.',
        frequency: 'Annual',
        suggestedMonths: ['July', 'August'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'School Level Science Exhibition (JNNSMEE)'
      },
      {
        id: 'resp-sci-2',
        title: 'Guide National Children Science Congress (NCSC) Projects',
        description: 'Facilitate community surveys, scientific research logbooks, and abstract submissions for NCSC child scientists.',
        frequency: 'Annual',
        suggestedMonths: ['August', 'September', 'October'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'National Children Science Congress (NCSC)'
      },
      {
        id: 'resp-sci-3',
        title: 'Conduct Weekly ATL Hands-On Tinkering Workshops',
        description: 'Supervise 3D printing, sensor circuits, Arduino coding, and maintain safety log in ATL room.',
        frequency: 'Weekly',
        suggestedMonths: ['April', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February'],
        isMandatory: true,
        canBeDelegated: true
      }
    ]
  },
  {
    id: 'port-eco',
    name: 'Swachhata, Eco Club & Green Vidyalaya Committee',
    category: 'Maintenance & Infrastructure',
    description: 'Promotes green campus, Swachhata Pakhwada, waste segregation, herbal garden, energy conservation, and plastic-free protocols.',
    isCommittee: true,
    createdBy: 'Principal / Admin',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    isActive: true,
    responsibilities: [
      {
        id: 'resp-eco-1',
        title: 'Execute Swachhata Pakhwada (1st–15th September)',
        description: 'Organize cleanliness pledge, classroom sanitation audits, hand-washing awareness, and community rallies.',
        frequency: 'Annual',
        suggestedMonths: ['September'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'Swachhata Pakhwada Cleanliness Drive'
      },
      {
        id: 'resp-eco-2',
        title: 'Maintain Vidyalaya Herbal Garden & Tree Plantation',
        description: 'Coordinate "Ek Ped Maa Ke Naam" sapling plantation, drip watering, and medicinal plants labeling.',
        frequency: 'Monthly',
        suggestedMonths: ['July', 'August', 'September', 'October'],
        isMandatory: false,
        canBeDelegated: true
      },
      {
        id: 'resp-eco-3',
        title: 'Conduct Plastic-Free & Energy Conservation Audits',
        description: 'Inspect dustbins, ensure LED lights/fans switch-off protocols, and test drinking water quality.',
        frequency: 'Monthly',
        suggestedMonths: ['April', 'June', 'August', 'October', 'December', 'February'],
        isMandatory: true,
        canBeDelegated: true
      }
    ]
  },
  {
    id: 'port-safety',
    name: 'Student Safety, POCSO, Disaster Management & First Aid',
    category: 'Student Welfare & Safety',
    description: 'Maintains disaster evacuation readiness, fire safety systems, POCSO complaint box, child protection protocols, and campus health kits.',
    isCommittee: true,
    createdBy: 'Principal / Admin',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    isActive: true,
    responsibilities: [
      {
        id: 'resp-safe-1',
        title: 'Conduct Bi-Annual Fire Safety & Earthquake Evacuation Mock Drills',
        description: 'Execute timed student evacuation drills, inspect fire extinguishers refilling dates, and log evacuation timing.',
        frequency: 'Term',
        suggestedMonths: ['April', 'October'],
        isMandatory: true,
        canBeDelegated: false,
        linkedThemeCalendarActivity: 'Disaster Management & Fire Evacuation Mock Drill'
      },
      {
        id: 'resp-safe-2',
        title: 'Bi-Weekly POCSO & Suggestion Box Review by Internal Committee',
        description: 'Open complaint box with committee witnesses, record entries in confidential register, and take corrective action.',
        frequency: 'Monthly',
        suggestedMonths: ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'],
        isMandatory: true,
        canBeDelegated: false
      },
      {
        id: 'resp-safe-3',
        title: 'Quarterly First Aid Kits Replenishment & Expiry Inspection',
        description: 'Replenish bandages, burn ointments, antiseptic lotions, ORS, and ice packs across staff rooms and sports arena.',
        frequency: 'Term',
        suggestedMonths: ['April', 'July', 'October', 'January'],
        isMandatory: true,
        canBeDelegated: true
      }
    ]
  },
  {
    id: 'port-it',
    name: 'IT, Website, ICT Lab & E-Governance Committee',
    category: 'Maintenance & Infrastructure',
    description: 'Manages school website disclosures, computer lab systems, interactive touch panels (PM e-Vidya), and U-DISE+ / APAAR data.',
    isCommittee: true,
    createdBy: 'Principal / Admin',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    isActive: true,
    responsibilities: [
      {
        id: 'resp-it-1',
        title: 'Update Vidyalaya Website & Mandatory Disclosures',
        description: 'Upload latest fee structure, staff profiles, VMC minutes, enrollment data, and event photo gallery.',
        frequency: 'Monthly',
        suggestedMonths: ['April', 'June', 'August', 'October', 'December', 'February'],
        isMandatory: true,
        canBeDelegated: true
      },
      {
        id: 'resp-it-2',
        title: 'U-DISE+ & APAAR (One Nation One Student ID) Sync',
        description: 'Coordinate student Aadhaar verification, socio-economic profiles, and submit finalized U-DISE+ portal data.',
        frequency: 'Annual',
        suggestedMonths: ['October', 'November', 'December'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'U-DISE+ & Student APAAR ID Generation Drive'
      },
      {
        id: 'resp-it-3',
        title: 'Weekly Computer Lab & Interactive Touch Panels Health Check',
        description: 'Verify OS updates, antivirus definitions, internet connectivity, and projector lamps.',
        frequency: 'Weekly',
        suggestedMonths: ['April', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'],
        isMandatory: false,
        canBeDelegated: true
      }
    ]
  },
  {
    id: 'port-library',
    name: 'Library & Reading Committee',
    category: 'Academic & Administration',
    description: 'Manages book cataloging, National Library Week, reading challenges, student book reviews, and procurement of NEP-aligned books.',
    isCommittee: true,
    createdBy: 'Principal / Admin',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    isActive: true,
    responsibilities: [
      {
        id: 'resp-lib-1',
        title: 'Celebrate National Library Week & Reading Month (P.N. Panicker)',
        description: 'Organize book fairs, speed reading contests, author visits, and bookmark making competitions.',
        frequency: 'Annual',
        suggestedMonths: ['June', 'July', 'November'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'National Reading Month & Library Week'
      },
      {
        id: 'resp-lib-2',
        title: 'Annual Physical Stock Verification of Library Books',
        description: 'Audit barcode numbers, damaged book write-offs, and maintain accession registers.',
        frequency: 'Annual',
        suggestedMonths: ['March'],
        isMandatory: true,
        canBeDelegated: true
      }
    ]
  },
  {
    id: 'port-guidance',
    name: 'Guidance, Counseling & Career Cell',
    category: 'Student Welfare & Safety',
    description: 'Provides psycho-social counseling, exam stress management (Pariksha Pe Charcha), and career path exploration for secondary students.',
    isCommittee: true,
    createdBy: 'Principal / Admin',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    isActive: true,
    responsibilities: [
      {
        id: 'resp-gc-1',
        title: 'Conduct Pre-Exam Stress Management & Pariksha Pe Charcha',
        description: 'Screen live telecast of Pariksha Pe Charcha with Prime Minister and conduct peer support workshops.',
        frequency: 'Annual',
        suggestedMonths: ['January', 'February'],
        isMandatory: true,
        canBeDelegated: true,
        linkedThemeCalendarActivity: 'Pariksha Pe Charcha & Exam Stress Workshop'
      },
      {
        id: 'resp-gc-2',
        title: 'Organize Career Pathways & CUET / NDA / JEE Orientation',
        description: 'Invite alumni and career counselors to guide Class XI and XII students on higher education entrance exams.',
        frequency: 'Term',
        suggestedMonths: ['October', 'November'],
        isMandatory: false,
        canBeDelegated: true
      }
    ]
  }
];

export const DEFAULT_PORTFOLIO_ASSIGNMENTS: PortfolioAssignment[] = [
  // Examination Committee
  {
    id: 'asgn-exam-inc',
    portfolioTemplateId: 'port-exam',
    role: 'In-charge',
    teacherEmployeeCode: '104822',
    teacherName: 'Mrs. S. Mohapatra',
    assignedBy: 'Sh. HEMANANDA BARIK (Principal I/c)',
    assignedAt: '2026-04-01T00:00:00.000Z',
    status: 'Active',
    notes: 'Overall lead for all periodic tests and board examinations.'
  },
  {
    id: 'asgn-exam-mem1',
    portfolioTemplateId: 'port-exam',
    role: 'Member',
    teacherEmployeeCode: '108894',
    teacherName: 'UPDESH SINGH PAL',
    assignedBy: 'Sh. HEMANANDA BARIK (Principal I/c)',
    assignedAt: '2026-04-01T00:00:00.000Z',
    status: 'Active',
    notes: 'Responsible for seating arrangements & question paper printing support.'
  },
  {
    id: 'asgn-exam-mem2',
    portfolioTemplateId: 'port-exam',
    role: 'Member',
    teacherEmployeeCode: '108990',
    teacherName: 'MANISH KUMAR YADAV',
    assignedBy: 'Sh. HEMANANDA BARIK (Principal I/c)',
    assignedAt: '2026-04-01T00:00:00.000Z',
    status: 'Active',
    notes: 'Primary section test coordinator.'
  },

  // Sports Committee
  {
    id: 'asgn-sports-inc',
    portfolioTemplateId: 'port-sports',
    role: 'In-charge',
    teacherEmployeeCode: '108894',
    teacherName: 'UPDESH SINGH PAL',
    assignedBy: 'Sh. HEMANANDA BARIK (Principal I/c)',
    assignedAt: '2026-04-01T00:00:00.000Z',
    status: 'Active',
    notes: 'Lead Physical Education Officer & Sports In-charge.'
  },
  {
    id: 'asgn-sports-mem1',
    portfolioTemplateId: 'port-sports',
    role: 'Member',
    teacherEmployeeCode: '51951',
    teacherName: 'JYOTI KUMARI DHUMA',
    assignedBy: 'Sh. HEMANANDA BARIK (Principal I/c)',
    assignedAt: '2026-04-01T00:00:00.000Z',
    status: 'Active',
    notes: 'Track and field setup coordinator.'
  },

  // Timetable Committee
  {
    id: 'asgn-tt-inc',
    portfolioTemplateId: 'port-timetable',
    role: 'In-charge',
    teacherEmployeeCode: '62034',
    teacherName: 'Sh. HEMANANDA BARIK',
    assignedBy: 'Principal / Admin',
    assignedAt: '2026-04-01T00:00:00.000Z',
    status: 'Active',
    notes: 'Master Timetable Designer.'
  },
  {
    id: 'asgn-tt-mem1',
    portfolioTemplateId: 'port-timetable',
    role: 'Member',
    teacherEmployeeCode: '108894',
    teacherName: 'UPDESH SINGH PAL',
    assignedBy: 'Sh. HEMANANDA BARIK (Principal I/c)',
    assignedAt: '2026-04-01T00:00:00.000Z',
    status: 'Active',
    notes: 'Daily Morning Proxy Duty Allocation Officer.'
  },

  // Scouts & Guides
  {
    id: 'asgn-scout-inc',
    portfolioTemplateId: 'port-scouts',
    role: 'In-charge',
    teacherEmployeeCode: '108894',
    teacherName: 'UPDESH SINGH PAL',
    assignedBy: 'Sh. HEMANANDA BARIK (Principal I/c)',
    assignedAt: '2026-04-01T00:00:00.000Z',
    status: 'Active',
    notes: 'Scout Master (Advanced Course trained).'
  },
  {
    id: 'asgn-scout-mem1',
    portfolioTemplateId: 'port-scouts',
    role: 'Member',
    teacherEmployeeCode: 'CS.107859',
    teacherName: 'A GAYATRI',
    assignedBy: 'Sh. HEMANANDA BARIK (Principal I/c)',
    assignedAt: '2026-04-01T00:00:00.000Z',
    status: 'Active',
    notes: 'Guide Captain.'
  },

  // CCA Committee
  {
    id: 'asgn-cca-inc',
    portfolioTemplateId: 'port-cca',
    role: 'In-charge',
    teacherEmployeeCode: '108990',
    teacherName: 'MANISH KUMAR YADAV',
    assignedBy: 'Sh. HEMANANDA BARIK (Principal I/c)',
    assignedAt: '2026-04-01T00:00:00.000Z',
    status: 'Active',
    notes: 'Overall Incharge of House activities & Morning Assembly.'
  },

  // Student Safety & Disaster Management
  {
    id: 'asgn-safe-inc',
    portfolioTemplateId: 'port-safety',
    role: 'In-charge',
    teacherEmployeeCode: '51951',
    teacherName: 'JYOTI KUMARI DHUMA',
    assignedBy: 'Sh. HEMANANDA BARIK (Principal I/c)',
    assignedAt: '2026-04-01T00:00:00.000Z',
    status: 'Active',
    notes: 'Fire Safety & Disaster Evacuation Officer.'
  },
  {
    id: 'asgn-safe-mem1',
    portfolioTemplateId: 'port-safety',
    role: 'Member',
    teacherEmployeeCode: '108894',
    teacherName: 'UPDESH SINGH PAL',
    assignedBy: 'Sh. HEMANANDA BARIK (Principal I/c)',
    assignedAt: '2026-04-01T00:00:00.000Z',
    status: 'Active',
    notes: 'First Aid & Emergency Response Member.'
  }
];

export const DEFAULT_RESPONSIBILITY_DELEGATIONS: ResponsibilityDelegation[] = [
  {
    id: 'del-101',
    portfolioTemplateId: 'port-sports',
    responsibilityId: 'resp-sports-4',
    originalOwnerEmployeeCode: '108894',
    originalOwnerName: 'UPDESH SINGH PAL',
    delegatedToEmployeeCode: '51951',
    delegatedToName: 'JYOTI KUMARI DHUMA',
    delegatedBy: 'UPDESH SINGH PAL (Sports In-charge)',
    delegatedAt: '2026-08-01T10:00:00.000Z',
    status: 'Active',
    notes: 'Delegated inventory count and equipment tagging for August 2026.'
  },
  {
    id: 'del-102',
    portfolioTemplateId: 'port-exam',
    responsibilityId: 'resp-exam-3',
    originalOwnerEmployeeCode: '104822',
    originalOwnerName: 'Mrs. S. Mohapatra',
    delegatedToEmployeeCode: '108990',
    delegatedToName: 'MANISH KUMAR YADAV',
    delegatedBy: 'Mrs. S. Mohapatra (Exam In-charge)',
    delegatedAt: '2026-08-10T14:00:00.000Z',
    status: 'Active',
    notes: 'Delegated primary section (Classes I-V) PT-1 result compilation.'
  }
];

export const DEFAULT_RESPONSIBILITY_REQUESTS: ResponsibilityRequest[] = [
  {
    id: 'req-201',
    portfolioTemplateId: 'port-sports',
    requestedBy: '108894',
    requestedByName: 'UPDESH SINGH PAL',
    title: 'Inter-House Volleyball & Kho-Kho League Tournament',
    description: 'Propose organizing an evening 4-house league tournament across August to select the regional team.',
    suggestedFrequency: 'Annual',
    status: 'Pending',
    principalRemarks: '',
    requestedAt: '2026-08-18T09:00:00.000Z'
  }
];

export const DEFAULT_PORTFOLIO_SUGGESTIONS: PortfolioSuggestion[] = [
  {
    id: 'sug-101',
    suggestedTitle: 'GeM Portal Procurement CRAC & Payment Verification',
    suggestedDescription: 'Regularly scrutinize Government e-Marketplace (GeM) purchase orders, generate Consignee Receipt and Acceptance Certificate (CRAC), and verify vendor invoices with bill registers.',
    suggestedFrequency: 'Monthly',
    suggestedPortfolioTemplateId: 'port-it',
    suggestedPortfolioName: 'IT, Website, ICT Lab & E-Governance Committee',
    evidenceCount: 6,
    sampleActivityIds: ['act-gem-1', 'act-gem-2'],
    status: 'Pending',
    createdAt: '2026-08-18T10:00:00.000Z'
  },
  {
    id: 'sug-102',
    suggestedTitle: 'Morning Gate Vigilance & Late-Comer Student Counseling',
    suggestedDescription: 'Supervise morning gate arrival between 07:30 AM and 07:55 AM, maintain student late-arrival logs, and conduct counseling for habitual late-comers.',
    suggestedFrequency: 'Daily',
    suggestedPortfolioTemplateId: 'port-safety',
    suggestedPortfolioName: 'Student Safety, POCSO, Disaster Management & First Aid',
    evidenceCount: 4,
    sampleActivityIds: ['act-gate-1', 'act-gate-2'],
    status: 'Pending',
    createdAt: '2026-08-19T08:00:00.000Z'
  },
  {
    id: 'sug-103',
    suggestedTitle: 'National Science Olympiad & Mathematics Olympiad Coordination',
    suggestedDescription: 'Coordinate student enrollment, fee collection, admit card issuance, and room invigilation for National Science Olympiad (NSO) and IMO exams.',
    suggestedFrequency: 'Annual',
    suggestedPortfolioTemplateId: 'port-science',
    suggestedPortfolioName: 'Science Exhibition, NCSC & Atal Tinkering Lab (ATL)',
    evidenceCount: 3,
    sampleActivityIds: ['act-olymp-1'],
    status: 'Pending',
    createdAt: '2026-08-20T12:00:00.000Z'
  }
];

