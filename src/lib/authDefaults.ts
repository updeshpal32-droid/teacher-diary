import { UserAccount } from '../types/auth';

export const DEFAULT_USER_ACCOUNTS: UserAccount[] = [
  // 1. Institutional Head / Admin
  {
    id: 'user-admin-62034',
    name: 'Sh. HEMANANDA BARIK',
    email: 'hemanandabarik18@gmail.com',
    password: 'admin',
    role: 'admin',
    designation: 'Principal I/c',
    employeeCode: '62034',
    department: 'Institutional Administration & Academic Oversight',
    assignments: [
      { id: 'as-ad-1', className: 'XII', section: 'A', subject: 'English', stage: 'senior_secondary' },
      { id: 'as-ad-2', className: 'X', section: 'A', subject: 'English', stage: 'secondary' }
    ],
    assignedClasses: ['VI-A', 'VII-A', 'VIII-A', 'IX-A', 'X-A', 'XI-A', 'XII-A', 'I-A', 'II-A', 'III-A', 'IV-A', 'V-A'],
    assignedSubjects: ['All Subjects / Academic Oversight'],
    phone: '+91 6001419689',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z',
    lastLoginAt: '2026-08-18T08:00:00.000Z'
  },

  // 2. Data Entry Manager: Updesh Singh Pal, TGT (P&HE)
  {
    id: 'user-dem-108894',
    name: 'UPDESH SINGH PAL',
    email: 'Updeshpal32@gmail.com',
    password: 'data',
    role: 'data_entry_manager',
    designation: 'TGT (P&HE)',
    employeeCode: '108894',
    department: 'Department of Physical & Health Education / Data Center',
    assignments: [
      { id: 'as-dem-1', className: 'VI', section: 'A', subject: 'Physical & Health Education', stage: 'middle' },
      { id: 'as-dem-2', className: 'VII', section: 'A', subject: 'Physical & Health Education', stage: 'middle' },
      { id: 'as-dem-3', className: 'VIII', section: 'A', subject: 'Physical & Health Education', stage: 'middle' },
      { id: 'as-dem-4', className: 'IX', section: 'A', subject: 'Physical & Health Education', stage: 'secondary' },
      { id: 'as-dem-5', className: 'X', section: 'A', subject: 'Physical & Health Education', stage: 'secondary' }
    ],
    assignedClasses: ['VI-A', 'VII-A', 'VIII-A', 'IX-A', 'X-A', 'XI-A', 'XII-A'],
    assignedSubjects: ['Physical & Health Education', 'Sports & Games', 'Yoga & Fitness'],
    phone: '8433447204',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z',
    lastLoginAt: '2026-08-18T08:30:00.000Z'
  },

  // 3. JYOTI KUMARI DHUMA - TGT(W.E.)
  {
    id: 'user-tch-51951',
    name: 'JYOTI KUMARI DHUMA',
    email: 'jyotikumaridhuma@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'TGT(W.E.)',
    employeeCode: '51951',
    department: 'Department of Work Experience & Vocational Studies',
    assignments: [
      { id: 'as-jkd-1', className: 'VI', section: 'A', subject: 'Work Education (W.E.)', stage: 'middle' },
      { id: 'as-jkd-2', className: 'VII', section: 'A', subject: 'Work Education (W.E.)', stage: 'middle' },
      { id: 'as-jkd-3', className: 'VIII', section: 'A', subject: 'Work Education (W.E.)', stage: 'middle' },
      { id: 'as-jkd-4', className: 'IX', section: 'A', subject: 'Work Education (W.E.)', stage: 'secondary' },
      { id: 'as-jkd-5', className: 'X', section: 'A', subject: 'Work Education (W.E.)', stage: 'secondary' }
    ],
    assignedClasses: ['VI-A', 'VII-A', 'VIII-A', 'IX-A', 'X-A'],
    assignedSubjects: ['Work Education (W.E.)', 'Electrical Gadgets & Tech'],
    isClassTeacherOf: 'IX-A',
    phone: '7377035054',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 4. PRIYABRATA PADHAN - TGT HINDI
  {
    id: 'user-tch-76958',
    name: 'PRIYABRATA PADHAN',
    email: 'rinkupadhan10@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'TGT HINDI',
    employeeCode: '76958',
    department: 'Department of Languages (Hindi)',
    assignments: [
      { id: 'as-pp-1', className: 'VI', section: 'A', subject: 'Hindi', stage: 'middle' },
      { id: 'as-pp-2', className: 'VIII', section: 'A', subject: 'Hindi', stage: 'middle' },
      { id: 'as-pp-3', className: 'X', section: 'A', subject: 'Hindi Course A', stage: 'secondary' }
    ],
    assignedClasses: ['VI-A', 'VIII-A', 'X-A'],
    assignedSubjects: ['Hindi', 'Hindi Literature'],
    isClassTeacherOf: 'X-A',
    phone: '7381828298',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 5. OMPRAKASH SHARMA - TGT Sanskrit
  {
    id: 'user-tch-102642',
    name: 'OMPRAKASH SHARMA',
    email: 'Omprakashshastri415@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'TGT Sanskrit',
    employeeCode: '102642',
    department: 'Department of Sanskrit & Indian Languages',
    assignments: [
      { id: 'as-ops-1', className: 'VI', section: 'A', subject: 'Sanskrit', stage: 'middle' },
      { id: 'as-ops-2', className: 'VII', section: 'A', subject: 'Sanskrit', stage: 'middle' },
      { id: 'as-ops-3', className: 'VIII', section: 'A', subject: 'Sanskrit', stage: 'middle' }
    ],
    assignedClasses: ['VI-A', 'VII-A', 'VIII-A'],
    assignedSubjects: ['Sanskrit', 'Vedic Heritage'],
    phone: '9928929274',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 6. DIPANWITA MANDAL - LIBRARIAN
  {
    id: 'user-tch-102725',
    name: 'DIPANWITA MANDAL',
    email: 'dipanwitamandal617@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'LIBRARIAN',
    employeeCode: '102725',
    department: 'Library & Information Resource Center',
    assignments: [
      { id: 'as-dm-1', className: 'VI', section: 'A', subject: 'Library Science', stage: 'middle' },
      { id: 'as-dm-2', className: 'VII', section: 'A', subject: 'Library Science', stage: 'middle' },
      { id: 'as-dm-3', className: 'VIII', section: 'A', subject: 'Library Science', stage: 'middle' },
      { id: 'as-dm-4', className: 'IX', section: 'A', subject: 'Library Science', stage: 'secondary' },
      { id: 'as-dm-5', className: 'X', section: 'A', subject: 'Library Science', stage: 'secondary' }
    ],
    assignedClasses: ['VI-A', 'VII-A', 'VIII-A', 'IX-A', 'X-A'],
    assignedSubjects: ['Library Science', 'Reading Programme (Joy of Reading)'],
    phone: '8001267885',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 7. SAMYA RAHA - TGT (Art Education)
  {
    id: 'user-tch-106020',
    name: 'SAMYA RAHA',
    email: 'samya.raha@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'TGT (Art Education)',
    employeeCode: '106020',
    department: 'Department of Fine Arts & Sculpture',
    assignments: [
      { id: 'as-sr-1', className: 'VI', section: 'A', subject: 'Art Education', stage: 'middle' },
      { id: 'as-sr-2', className: 'VII', section: 'A', subject: 'Art Education', stage: 'middle' },
      { id: 'as-sr-3', className: 'VIII', section: 'A', subject: 'Art Education', stage: 'middle' },
      { id: 'as-sr-4', className: 'IX', section: 'A', subject: 'Art Education', stage: 'secondary' },
      { id: 'as-sr-5', className: 'X', section: 'A', subject: 'Art Education', stage: 'secondary' }
    ],
    assignedClasses: ['VI-A', 'VII-A', 'VIII-A', 'IX-A', 'X-A'],
    assignedSubjects: ['Art Education', 'Sculpture & Painting', 'Art Integrated Learning (AIL)'],
    phone: '9476311099',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 8. SANJUKTA KUJUR - TGT ENGLISH
  {
    id: 'user-tch-106019',
    name: 'SANJUKTA KUJUR',
    email: 'sanjuktakujur87@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'TGT ENGLISH',
    employeeCode: '106019',
    department: 'Department of English',
    assignments: [
      { id: 'as-sk-1', className: 'VI', section: 'A', subject: 'English', stage: 'middle' },
      { id: 'as-sk-2', className: 'VII', section: 'A', subject: 'English', stage: 'middle' },
      { id: 'as-sk-3', className: 'IX', section: 'A', subject: 'English Language & Literature', stage: 'secondary' }
    ],
    assignedClasses: ['VI-A', 'VII-A', 'IX-A'],
    assignedSubjects: ['English', 'English Language & Literature'],
    isClassTeacherOf: 'VII-A',
    phone: '9046798968',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 9. MAHENDRA KUA - PRT
  {
    id: 'user-tch-11211',
    name: 'MAHENDRA KUA',
    email: 'mahendrakua1971@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'PRT',
    employeeCode: '11211',
    department: 'Primary Section',
    assignments: [
      { id: 'as-mk-1', className: 'V', section: 'A', subject: 'Mathematics', stage: 'preparatory' },
      { id: 'as-mk-2', className: 'V', section: 'A', subject: 'EVS', stage: 'preparatory' }
    ],
    assignedClasses: ['V-A'],
    assignedSubjects: ['Mathematics', 'EVS'],
    isClassTeacherOf: 'V-A',
    phone: '9938980264',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 10. ARATI KISHAN - PRT
  {
    id: 'user-tch-72833',
    name: 'ARATI KISHAN',
    email: 'aratigopna@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'PRT',
    employeeCode: '72833',
    department: 'Primary Section',
    assignments: [
      { id: 'as-ak-1', className: 'IV', section: 'A', subject: 'English', stage: 'preparatory' },
      { id: 'as-ak-2', className: 'IV', section: 'A', subject: 'Hindi', stage: 'preparatory' }
    ],
    assignedClasses: ['IV-A'],
    assignedSubjects: ['English', 'Hindi'],
    isClassTeacherOf: 'IV-A',
    phone: '8658121527',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 11. SARITA DHANWAR - PRT
  {
    id: 'user-tch-102643',
    name: 'SARITA DHANWAR',
    email: 'sdhanwar99@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'PRT',
    employeeCode: '102643',
    department: 'Primary Section',
    assignments: [
      { id: 'as-sd-1', className: 'III', section: 'A', subject: 'Mathematics', stage: 'preparatory' },
      { id: 'as-sd-2', className: 'III', section: 'A', subject: 'EVS', stage: 'preparatory' }
    ],
    assignedClasses: ['III-A'],
    assignedSubjects: ['Mathematics', 'EVS'],
    isClassTeacherOf: 'III-A',
    phone: '9337568710',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 12. MANISH KUMAR SIDAR - PRT MUSIC
  {
    id: 'user-tch-110505',
    name: 'MANISH KUMAR SIDAR',
    email: 'mnshsidar3@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'PRT MUSIC',
    employeeCode: '110505',
    department: 'Department of Music & Performing Arts',
    assignments: [
      { id: 'as-mks-1', className: 'I', section: 'A', subject: 'Music & Vocal Arts', stage: 'foundational' },
      { id: 'as-mks-2', className: 'II', section: 'A', subject: 'Music & Vocal Arts', stage: 'foundational' },
      { id: 'as-mks-3', className: 'III', section: 'A', subject: 'Music & Vocal Arts', stage: 'preparatory' },
      { id: 'as-mks-4', className: 'IV', section: 'A', subject: 'Music & Vocal Arts', stage: 'preparatory' },
      { id: 'as-mks-5', className: 'V', section: 'A', subject: 'Music & Vocal Arts', stage: 'preparatory' }
    ],
    assignedClasses: ['I-A', 'II-A', 'III-A', 'IV-A', 'V-A'],
    assignedSubjects: ['Music & Vocal Arts', 'Assembly Choir & CCA'],
    phone: '9907078211',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 13. SANTWANA DASH - PRT
  {
    id: 'user-tch-110791',
    name: 'SANTWANA DASH',
    email: 'sshantwana@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'PRT',
    employeeCode: '110791',
    department: 'Primary Section',
    assignments: [
      { id: 'as-sdash-1', className: 'II', section: 'A', subject: 'English', stage: 'foundational' },
      { id: 'as-sdash-2', className: 'II', section: 'A', subject: 'Mathematics', stage: 'foundational' }
    ],
    assignedClasses: ['II-A'],
    assignedSubjects: ['English', 'Mathematics'],
    isClassTeacherOf: 'II-A',
    phone: '8763802734',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 14. Sh. KISHOR SEMER LOKA - Sub Staff
  {
    id: 'user-tch-10762',
    name: 'Sh. KISHOR SEMER LOKA',
    email: 'ksloka1969@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'Sub Staff (Regular)',
    employeeCode: '10762',
    department: 'Campus Support & Operations',
    assignments: [],
    assignedClasses: ['Campus Support'],
    assignedSubjects: ['Support Services'],
    phone: '9938542578',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 15. A GAYATRI - TGT SCIENCE (Contractual)
  {
    id: 'user-tch-CS107859',
    name: 'A GAYATRI',
    email: 'agayatri2016@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'TGT SCIENCE',
    employeeCode: 'CS.107859',
    department: 'Department of Science (Contractual Faculty)',
    assignments: [
      { id: 'as-ag-1', className: 'VI', section: 'A', subject: 'Science', stage: 'middle' },
      { id: 'as-ag-2', className: 'VII', section: 'A', subject: 'Science', stage: 'middle' },
      { id: 'as-ag-3', className: 'VIII', section: 'A', subject: 'Science', stage: 'middle' }
    ],
    assignedClasses: ['VI-A', 'VII-A', 'VIII-A'],
    assignedSubjects: ['Science (Physics, Chemistry, Biology)'],
    isClassTeacherOf: 'VI-A',
    phone: '7008134216',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 16. KALPADARSHINI DASH - TGT MATHS (Contractual)
  {
    id: 'user-tch-CS134776',
    name: 'KALPADARSHINI DASH',
    email: 'kalpadarshinidash2000@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'TGT MATHS',
    employeeCode: 'CS.134776',
    department: 'Department of Mathematics (Contractual Faculty)',
    assignments: [
      { id: 'as-kd-1', className: 'VI', section: 'A', subject: 'Mathematics', stage: 'middle' },
      { id: 'as-kd-2', className: 'VII', section: 'A', subject: 'Mathematics', stage: 'middle' },
      { id: 'as-kd-3', className: 'VIII', section: 'A', subject: 'Mathematics', stage: 'middle' }
    ],
    assignedClasses: ['VI-A', 'VII-A', 'VIII-A'],
    assignedSubjects: ['Mathematics'],
    phone: '6370542319',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 17. MANJU XESS - TGT SST (Contractual)
  {
    id: 'user-tch-CS134497',
    name: 'MANJU XESS',
    email: 'manjuxess8457@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'TGT SST',
    employeeCode: 'CS.134497',
    department: 'Department of Social Sciences (Contractual Faculty)',
    assignments: [
      { id: 'as-mx-1', className: 'VI', section: 'A', subject: 'Social Studies', stage: 'middle' },
      { id: 'as-mx-2', className: 'VII', section: 'A', subject: 'Social Studies', stage: 'middle' },
      { id: 'as-mx-3', className: 'VIII', section: 'A', subject: 'Social Studies', stage: 'middle' },
      { id: 'as-mx-4', className: 'IX', section: 'A', subject: 'Social Science', stage: 'secondary' },
      { id: 'as-mx-5', className: 'X', section: 'A', subject: 'Social Science', stage: 'secondary' }
    ],
    assignedClasses: ['VI-A', 'VII-A', 'VIII-A', 'IX-A', 'X-A'],
    assignedSubjects: ['Social Science (History, Geography, Civics, Economics)'],
    isClassTeacherOf: 'VIII-A',
    phone: '8658458772',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 18. KARISHMA KERKETTA - COMPUTER INSTRUCTOR (Contractual)
  {
    id: 'user-tch-CS129498',
    name: 'KARISHMA KERKETTA',
    email: 'karishma.kerketta13@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'COMPUTER INSTRUCTOR',
    employeeCode: 'CS.129498',
    department: 'ICT & AI Resource Center (Contractual Faculty)',
    assignments: [
      { id: 'as-kk-1', className: 'VI', section: 'A', subject: 'Computer Science & AI', stage: 'middle' },
      { id: 'as-kk-2', className: 'VII', section: 'A', subject: 'Computer Science & AI', stage: 'middle' },
      { id: 'as-kk-3', className: 'VIII', section: 'A', subject: 'Computer Science & AI', stage: 'middle' },
      { id: 'as-kk-4', className: 'IX', section: 'A', subject: 'Artificial Intelligence (AI 417)', stage: 'secondary' },
      { id: 'as-kk-5', className: 'X', section: 'A', subject: 'Artificial Intelligence (AI 417)', stage: 'secondary' }
    ],
    assignedClasses: ['VI-A', 'VII-A', 'VIII-A', 'IX-A', 'X-A'],
    assignedSubjects: ['Computer Science', 'Artificial Intelligence (AI)', 'Cyber Safety'],
    phone: '7978631497',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 19. SIPIKA PATEL - SPECIAL EDUCATOR (Contractual)
  {
    id: 'user-tch-CS129494',
    name: 'SIPIKA PATEL',
    email: 'patelsipika@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'SPECIAL EDUCATOR',
    employeeCode: 'CS.129494',
    department: 'Inclusive Education & Child Guidance (Contractual Faculty)',
    assignments: [
      { id: 'as-sp-1', className: 'I', section: 'A', subject: 'Inclusive Support & IEP', stage: 'foundational' },
      { id: 'as-sp-2', className: 'VI', section: 'A', subject: 'Inclusive Support & IEP', stage: 'middle' }
    ],
    assignedClasses: ['All Classes (CWSN Support)'],
    assignedSubjects: ['Special Education', 'Individualized Education Plan (IEP)'],
    phone: '9078755336',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 20. SUNITA JOJO - PRT (Contractual)
  {
    id: 'user-tch-CS129496',
    name: 'SUNITA JOJO',
    email: 'sunitajojo407@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'PRT',
    employeeCode: 'CS.129496',
    department: 'Primary Section (Contractual Faculty)',
    assignments: [
      { id: 'as-sj-1', className: 'I', section: 'A', subject: 'Hindi & FLN', stage: 'foundational' },
      { id: 'as-sj-2', className: 'I', section: 'A', subject: 'Mathematics & Numeracy', stage: 'foundational' }
    ],
    assignedClasses: ['I-A'],
    assignedSubjects: ['Hindi', 'Mathematics', 'FLN NIPUN Activities'],
    isClassTeacherOf: 'I-A',
    phone: '9827506505',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  },

  // 21. SANTOSH KUMAR NAIK - PRT (Contractual)
  {
    id: 'user-tch-CS130589',
    name: 'SANTOSH KUMAR NAIK',
    email: 'santoshkumarnaik768@gmail.com',
    password: 'teacher',
    role: 'teacher',
    designation: 'PRT',
    employeeCode: 'CS.130589',
    department: 'Primary Section (Contractual Faculty)',
    assignments: [
      { id: 'as-skn-1', className: 'III', section: 'A', subject: 'English', stage: 'preparatory' },
      { id: 'as-skn-2', className: 'III', section: 'A', subject: 'Hindi', stage: 'preparatory' }
    ],
    assignedClasses: ['III-A'],
    assignedSubjects: ['English', 'Hindi'],
    phone: '9040109350',
    isActive: true,
    createdAt: '2026-04-01T00:00:00.000Z'
  }
];
