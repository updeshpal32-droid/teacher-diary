import { StaffDetailRecord } from '../types/academic';

export const OFFICIAL_STAFF_HEADERS = [
  'S.N.',
  'Name',
  'Employee Code',
  'Designation',
  'Employment Type (Regular/Contractual)',
  'SocialCategory (GEN, OBC, SC, ST',
  'DOB (DD/MM/YYY)',
  'Date of joining in KVS with designation',
  'Date of joining in Present KV with designation',
  'BANK A/C No.',
  'IFSC',
  'BANK NAME',
  'Highest Acad. Qual. with Professional Qualifcation',
  'Permanent Postal Address',
  'E-mail',
  'Phone No. for calls',
  'Phone No. (Whatsapp)',
  'Aadhar No',
  'PRAN /PAN No',
  'Minority? Yes/No Mention Category',
  'SENIORITY NUMBER'
];

export const DEFAULT_SAMPLE_STAFF_LIST: StaffDetailRecord[] = [
  {
    id: 'stf-1',
    serialNo: 1,
    name: 'Sh. HEMANANDA BARIK',
    employeeCode: '62034',
    designation: 'Principal I/c',
    employmentType: 'Regular',
    socialCategory: 'OBC',
    dob: '18.10.1971',
    joiningDateKVSWithDesignation: '04/05/2016, PGT (Eng)',
    joiningDatePresentKVWithDesignation: '07/03/2024',
    bankAccountNo: '',
    ifscCode: '',
    bankName: '',
    highestAcademicAndProfessionalQual: 'M.A. (English), B.Ed.',
    permanentPostalAddress: 'KV Campus Quarters',
    email: 'hemanandabarik18@gmail.com',
    phoneCalls: '',
    phoneWhatsapp: '',
    aadharNo: '',
    pranOrPanNo: '',
    isMinority: 'No',
    seniorityNumber: 'KVS-PRIN-2018-009',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Institutional Administrative Head & Checking Authority.',
    approvedBy: 'Deputy Commissioner KVS RO',
    approvedDate: '2026-04-01'
  },
  {
    id: 'stf-2',
    serialNo: 2,
    name: 'JYOTI KUMARI DHUMA',
    employeeCode: '51951',
    designation: 'TGT(W.E.)',
    employmentType: 'Regular',
    socialCategory: 'ST',
    dob: '23.01.1977',
    joiningDateKVSWithDesignation: '28/09/2007, TGT(W.E.)',
    joiningDatePresentKVWithDesignation: '18/08/2023',
    bankAccountNo: '20005038882',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'CHSE, Diploma in electronics & telecommunication',
    permanentPostalAddress: 'AT-TALIMUNDA, P.O. -BARANGA KACHHAR, DT. SUNDARGARH, ODISHA 770016',
    email: 'jyotikumaridhuma@gmail.com',
    phoneCalls: '7377035054',
    phoneWhatsapp: '7377035054',
    aadharNo: '719521021480',
    pranOrPanNo: '110051282237 /',
    isMinority: 'Yes, Christian',
    seniorityNumber: '353',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Service Book and UBI entries verified.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-15'
  },
  {
    id: 'stf-3',
    serialNo: 3,
    name: 'UPDESH SINGH PAL',
    employeeCode: '108894',
    designation: 'TGT (P&HE)',
    employmentType: 'Regular',
    socialCategory: 'OBC',
    dob: '16.08.1993',
    joiningDateKVSWithDesignation: '20/12/2023, TGT (P&HE)',
    joiningDatePresentKVWithDesignation: '20/12/2023',
    bankAccountNo: '717702010011258',
    ifscCode: 'SBIN0002875',
    bankName: 'UBI',
    highestAcademicAndProfessionalQual: 'M.P.Ed., B.P.Ed.',
    permanentPostalAddress: '09, Salempur Road, Nagla Dali, Hathras, Uttar Pradesh 281306',
    email: 'Updeshpal32@gmail.com',
    phoneCalls: '8433447204',
    phoneWhatsapp: '8433447204',
    aadharNo: '672480495982',
    pranOrPanNo: '110178234695 /',
    isMinority: 'No',
    seniorityNumber: '1218',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Sports In-charge & NCC/Scouting Incharge.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-15'
  },
  {
    id: 'stf-4',
    serialNo: 4,
    name: 'PRIYABRATA PADHAN',
    employeeCode: '76958',
    designation: 'TGT (Hindi)',
    employmentType: 'Regular',
    socialCategory: 'OBC',
    dob: '12.05.1988',
    joiningDateKVSWithDesignation: '14/11/2019, TGT (Hindi)',
    joiningDatePresentKVWithDesignation: '14/11/2019',
    bankAccountNo: '33445566778',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'M.A. (Hindi), B.Ed.',
    permanentPostalAddress: 'KV Campus Staff Quarters, Sundargarh',
    email: 'priyabrata.padhan@kvs.gov.in',
    phoneCalls: '9876543210',
    phoneWhatsapp: '9876543210',
    aadharNo: '556677889900',
    pranOrPanNo: '110099887766',
    isMinority: 'No',
    seniorityNumber: '890',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Official Language / Rajbhasha Incharge & CT: VI-A.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-15'
  },
  {
    id: 'stf-5',
    serialNo: 5,
    name: 'OMPRAKASH SHARMA',
    employeeCode: '106018',
    designation: 'TGT (Sanskrit)',
    employmentType: 'Regular',
    socialCategory: 'GENERAL',
    dob: '05.07.1985',
    joiningDateKVSWithDesignation: '10/08/2018, TGT (Sanskrit)',
    joiningDatePresentKVWithDesignation: '10/08/2018',
    bankAccountNo: '44556677889',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'M.A. (Sanskrit), B.Ed.',
    permanentPostalAddress: 'Sundargarh, Odisha',
    email: 'omprakash.sharma@kvs.gov.in',
    phoneCalls: '9876543211',
    phoneWhatsapp: '9876543211',
    aadharNo: '443322110099',
    pranOrPanNo: '110088776655',
    isMinority: 'No',
    seniorityNumber: '765',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'EBSB & Sanskrit Promotion In-Charge.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-15'
  },
  {
    id: 'stf-6',
    serialNo: 6,
    name: 'DIPANWITA MANDAL',
    employeeCode: '102725',
    designation: 'Librarian',
    employmentType: 'Regular',
    socialCategory: 'GENERAL',
    dob: '14.02.1990',
    joiningDateKVSWithDesignation: '15/09/2021, Librarian',
    joiningDatePresentKVWithDesignation: '15/09/2021',
    bankAccountNo: '55667788990',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'M.Lib.I.Sc.',
    permanentPostalAddress: 'Sundargarh, Odisha',
    email: 'dipanwita.mandal@kvs.gov.in',
    phoneCalls: '9876543212',
    phoneWhatsapp: '9876543212',
    aadharNo: '332211009988',
    pranOrPanNo: '110077665544',
    isMinority: 'No',
    seniorityNumber: '920',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Library Management & Joy of Reading Incharge.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-15'
  },
  {
    id: 'stf-7',
    serialNo: 7,
    name: 'SAMYA RAHA',
    employeeCode: '106020',
    designation: 'TGT (Art Education)',
    employmentType: 'Regular',
    socialCategory: 'GENERAL',
    dob: '20.09.1991',
    joiningDateKVSWithDesignation: '01/10/2022, TGT (Art Education)',
    joiningDatePresentKVWithDesignation: '01/10/2022',
    bankAccountNo: '66778899001',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'B.F.A., M.F.A.',
    permanentPostalAddress: 'Sundargarh, Odisha',
    email: 'samya.raha@kvs.gov.in',
    phoneCalls: '9876543213',
    phoneWhatsapp: '9876543213',
    aadharNo: '221100998877',
    pranOrPanNo: '110066554433',
    isMinority: 'No',
    seniorityNumber: '1040',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Display Boards & Art Integration Incharge.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-15'
  },
  {
    id: 'stf-8',
    serialNo: 8,
    name: 'SANJUKTA KUJUR',
    employeeCode: '106019',
    designation: 'TGT (English)',
    employmentType: 'Regular',
    socialCategory: 'ST',
    dob: '08.11.1989',
    joiningDateKVSWithDesignation: '12/07/2020, TGT (English)',
    joiningDatePresentKVWithDesignation: '12/07/2020',
    bankAccountNo: '77889900112',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'M.A. (English), B.Ed.',
    permanentPostalAddress: 'Sundargarh, Odisha',
    email: 'sanjukta.kujur@kvs.gov.in',
    phoneCalls: '9876543214',
    phoneWhatsapp: '9876543214',
    aadharNo: '110099887766',
    pranOrPanNo: '110055443322',
    isMinority: 'Yes',
    seniorityNumber: '980',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'English Language Lab & Literary Club Incharge.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-15'
  },
  {
    id: 'stf-9',
    serialNo: 9,
    name: 'MAHENDRA KUA',
    employeeCode: '77890',
    designation: 'TGT (Maths)',
    employmentType: 'Regular',
    socialCategory: 'ST',
    dob: '02.03.1987',
    joiningDateKVSWithDesignation: '18/02/2019, TGT (Maths)',
    joiningDatePresentKVWithDesignation: '18/02/2019',
    bankAccountNo: '88990011223',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'M.Sc. (Maths), B.Ed.',
    permanentPostalAddress: 'Sundargarh, Odisha',
    email: 'mahendra.kua@kvs.gov.in',
    phoneCalls: '9876543215',
    phoneWhatsapp: '9876543215',
    aadharNo: '009988776655',
    pranOrPanNo: '110044332211',
    isMinority: 'Yes',
    seniorityNumber: '850',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Mathematics Olympiad & CT: IX-A.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-15'
  },
  {
    id: 'stf-10',
    serialNo: 10,
    name: 'ARATI KISHAN',
    employeeCode: '106023',
    designation: 'PRT',
    employmentType: 'Regular',
    socialCategory: 'ST',
    dob: '19.04.1994',
    joiningDateKVSWithDesignation: '25/08/2023, PRT',
    joiningDatePresentKVWithDesignation: '25/08/2023',
    bankAccountNo: '99001122334',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'B.A., D.El.Ed.',
    permanentPostalAddress: 'Sundargarh, Odisha',
    email: 'arati.kishan@kvs.gov.in',
    phoneCalls: '9876543216',
    phoneWhatsapp: '9876543216',
    aadharNo: '998877665544',
    pranOrPanNo: '110033221100',
    isMinority: 'Yes',
    seniorityNumber: '1150',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Primary Wing Coordinator & CT: I-A.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-15'
  },
  {
    id: 'stf-11',
    serialNo: 11,
    name: 'SARITA DHANWAR',
    employeeCode: '106022',
    designation: 'PRT',
    employmentType: 'Regular',
    socialCategory: 'ST',
    dob: '11.08.1992',
    joiningDateKVSWithDesignation: '20/08/2023, PRT',
    joiningDatePresentKVWithDesignation: '20/08/2023',
    bankAccountNo: '10111213141',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'B.Sc., D.El.Ed.',
    permanentPostalAddress: 'Sundargarh, Odisha',
    email: 'sarita.dhanwar@kvs.gov.in',
    phoneCalls: '9876543217',
    phoneWhatsapp: '9876543217',
    aadharNo: '887766554433',
    pranOrPanNo: '110022110099',
    isMinority: 'Yes',
    seniorityNumber: '1140',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'FLN / NIPUN Bharat Coordinator & CT: II-A.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-15'
  },
  {
    id: 'stf-12',
    serialNo: 12,
    name: 'MANISH KUMAR SIDAR',
    employeeCode: '106021',
    designation: 'PRT (Music)',
    employmentType: 'Regular',
    socialCategory: 'ST',
    dob: '15.06.1993',
    joiningDateKVSWithDesignation: '18/08/2023, PRT (Music)',
    joiningDatePresentKVWithDesignation: '18/08/2023',
    bankAccountNo: '12131415161',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'B.Mus., Sangeet Visharad',
    permanentPostalAddress: 'Sundargarh, Odisha',
    email: 'manish.sidar@kvs.gov.in',
    phoneCalls: '9876543218',
    phoneWhatsapp: '9876543218',
    aadharNo: '776655443322',
    pranOrPanNo: '110011009988',
    isMinority: 'Yes',
    seniorityNumber: '1130',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'School Choir & Morning Assembly Incharge & CT: V-A.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-15'
  },
  {
    id: 'stf-13',
    serialNo: 13,
    name: 'SANTWANA DASH',
    employeeCode: '106024',
    designation: 'PRT',
    employmentType: 'Regular',
    socialCategory: 'GENERAL',
    dob: '25.12.1995',
    joiningDateKVSWithDesignation: '01/09/2023, PRT',
    joiningDatePresentKVWithDesignation: '01/09/2023',
    bankAccountNo: '13141516171',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'B.A. (Hons), B.Ed.',
    permanentPostalAddress: 'Sundargarh, Odisha',
    email: 'santwana.dash@kvs.gov.in',
    phoneCalls: '9876543219',
    phoneWhatsapp: '9876543219',
    aadharNo: '665544332211',
    pranOrPanNo: '110000998877',
    isMinority: 'No',
    seniorityNumber: '1160',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Cub-Bulbul & Co-Curricular Incharge & CT: III-A.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-15'
  },
  {
    id: 'stf-14',
    serialNo: 14,
    name: 'Sh. KISHOR SEMER LOKA',
    employeeCode: '62035',
    designation: 'SSA / UDC',
    employmentType: 'Regular',
    socialCategory: 'ST',
    dob: '04.05.1979',
    joiningDateKVSWithDesignation: '10/01/2012, LDC',
    joiningDatePresentKVWithDesignation: '15/04/2021',
    bankAccountNo: '14151617181',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'B.Com.',
    permanentPostalAddress: 'KV Staff Quarters, Sundargarh',
    email: 'kishor.loka@kvs.gov.in',
    phoneCalls: '9876543220',
    phoneWhatsapp: '9876543220',
    aadharNo: '554433221100',
    pranOrPanNo: '110099001122',
    isMinority: 'Yes',
    seniorityNumber: '420',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Office Proceedings, UBI Portal & Pay Bills In-Charge.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-15'
  },
  {
    id: 'stf-15',
    serialNo: 15,
    name: 'A GAYATRI',
    employeeCode: 'CS.107859',
    designation: 'TGT SCIENCE',
    employmentType: 'Contractual',
    socialCategory: 'GENERAL',
    dob: '11.06.2001',
    joiningDateKVSWithDesignation: '21/6/24 (Science Teacher)',
    joiningDatePresentKVWithDesignation: '21.06.2024',
    bankAccountNo: '549910110002250',
    ifscCode: 'BKID0005499',
    bankName: 'BOI',
    highestAcademicAndProfessionalQual: 'B.Sc(botany hons.), B.ed',
    permanentPostalAddress: 'AT- KOITABASA, FERTILIZER TOWNSHIP, ROURKELA -7 PO/PS- TANGARPALI PIN-769007',
    email: 'agayatri2016@gmail.com',
    phoneCalls: '7008134216',
    phoneWhatsapp: '9692357592',
    aadharNo: '872507965704',
    pranOrPanNo: '-',
    isMinority: 'No',
    seniorityNumber: '',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Contractual faculty appointment Session 2026-27.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-10'
  },
  {
    id: 'stf-16',
    serialNo: 16,
    name: 'KALPADARSHINI DASH',
    employeeCode: 'CS.107860',
    designation: 'TGT MATHS',
    employmentType: 'Contractual',
    socialCategory: 'GENERAL',
    dob: '18.09.1996',
    joiningDateKVSWithDesignation: '24/06/2024',
    joiningDatePresentKVWithDesignation: '24/06/2024',
    bankAccountNo: '16171819201',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'M.Sc. (Maths), B.Ed.',
    permanentPostalAddress: 'Sundargarh, Odisha',
    email: 'kalpadarshini.dash@gmail.com',
    phoneCalls: '9437123456',
    phoneWhatsapp: '9437123456',
    aadharNo: '443322110011',
    pranOrPanNo: '-',
    isMinority: 'No',
    seniorityNumber: '',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Contractual Mathematics Faculty Session 2026-27.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-10'
  },
  {
    id: 'stf-17',
    serialNo: 17,
    name: 'MANJU XESS',
    employeeCode: 'CS.107861',
    designation: 'TGT SOCIAL SCIENCE',
    employmentType: 'Contractual',
    socialCategory: 'ST',
    dob: '03.01.1995',
    joiningDateKVSWithDesignation: '24/06/2024',
    joiningDatePresentKVWithDesignation: '24/06/2024',
    bankAccountNo: '17181920211',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'M.A. (History), B.Ed.',
    permanentPostalAddress: 'Sundargarh, Odisha',
    email: 'manju.xess@gmail.com',
    phoneCalls: '9437654321',
    phoneWhatsapp: '9437654321',
    aadharNo: '332211001122',
    pranOrPanNo: '-',
    isMinority: 'Yes',
    seniorityNumber: '',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Contractual Social Science Faculty Session 2026-27.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-10'
  },
  {
    id: 'stf-18',
    serialNo: 18,
    name: 'KARISHMA KERKETTA',
    employeeCode: 'CS.129498',
    designation: 'COMPUTER INSTRUCTOR',
    employmentType: 'Contractual',
    socialCategory: 'ST',
    dob: '16/09/1993',
    joiningDateKVSWithDesignation: '25/03/2026',
    joiningDatePresentKVWithDesignation: '06/04/2026',
    bankAccountNo: '31792698647',
    ifscCode: 'SBIN0017195',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'MCA',
    permanentPostalAddress: 'At-Lamloi Bypass Rajgangpur po-Rajgangpur sundargarh 770017',
    email: 'karishma.kerketta13@gmail.com',
    phoneCalls: '7978631497',
    phoneWhatsapp: '7978631497',
    aadharNo: '803128186137',
    pranOrPanNo: 'CTWPK9662H',
    isMinority: 'Christian',
    seniorityNumber: '',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'ICT Lab & Computer Instructor records confirmed.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-10'
  },
  {
    id: 'stf-19',
    serialNo: 19,
    name: 'SIPIKA PATEL',
    employeeCode: 'CS.107862',
    designation: 'TGT ODIA',
    employmentType: 'Contractual',
    socialCategory: 'OBC',
    dob: '07.03.1997',
    joiningDateKVSWithDesignation: '24/06/2024',
    joiningDatePresentKVWithDesignation: '24/06/2024',
    bankAccountNo: '19202122231',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'M.A. (Odia), B.Ed.',
    permanentPostalAddress: 'Sundargarh, Odisha',
    email: 'sipika.patel@gmail.com',
    phoneCalls: '9437987654',
    phoneWhatsapp: '9437987654',
    aadharNo: '221100112233',
    pranOrPanNo: '-',
    isMinority: 'No',
    seniorityNumber: '',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Contractual Odia Faculty Session 2026-27.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-10'
  },
  {
    id: 'stf-20',
    serialNo: 20,
    name: 'SUNITA JOJO',
    employeeCode: 'CS.107863',
    designation: 'PRT',
    employmentType: 'Contractual',
    socialCategory: 'ST',
    dob: '12.11.1998',
    joiningDateKVSWithDesignation: '24/06/2024',
    joiningDatePresentKVWithDesignation: '24/06/2024',
    bankAccountNo: '20212223241',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'B.A., D.El.Ed.',
    permanentPostalAddress: 'Sundargarh, Odisha',
    email: 'sunita.jojo@gmail.com',
    phoneCalls: '9437112233',
    phoneWhatsapp: '9437112233',
    aadharNo: '110011223344',
    pranOrPanNo: '-',
    isMinority: 'Yes',
    seniorityNumber: '',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Contractual PRT Faculty Session 2026-27 & CT: IV-A.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-10'
  },
  {
    id: 'stf-21',
    serialNo: 21,
    name: 'SANTOSH KUMAR NAIK',
    employeeCode: 'CS.107864',
    designation: 'PRT',
    employmentType: 'Contractual',
    socialCategory: 'SC',
    dob: '28.05.1996',
    joiningDateKVSWithDesignation: '24/06/2024',
    joiningDatePresentKVWithDesignation: '24/06/2024',
    bankAccountNo: '21222324251',
    ifscCode: 'SBIN0000238',
    bankName: 'SBI',
    highestAcademicAndProfessionalQual: 'B.Sc., D.El.Ed.',
    permanentPostalAddress: 'Sundargarh, Odisha',
    email: 'santosh.naik@gmail.com',
    phoneCalls: '9437445566',
    phoneWhatsapp: '9437445566',
    aadharNo: '001122334455',
    pranOrPanNo: '-',
    isMinority: 'No',
    seniorityNumber: '',
    approvalStatus: 'Verified & Approved',
    principalRemarks: 'Contractual PRT Faculty Session 2026-27.',
    approvedBy: 'Principal I/c',
    approvedDate: '2026-07-10'
  }
];

/**
 * Auto-detect Employment Nature: Regular vs Contractual
 */
export function detectEmploymentType(designation?: string, rawType?: string): 'Regular' | 'Contractual' {
  if (rawType) {
    const low = rawType.toLowerCase().trim();
    if (
      low.includes('contract') ||
      low.includes('cont') ||
      low.includes('part') ||
      low.includes('adhoc') ||
      low.includes('guest') ||
      low.includes('temporary') ||
      low.includes('vocational')
    ) {
      return 'Contractual';
    }
    if (low.includes('reg') || low.includes('perm') || low.includes('regular')) {
      return 'Regular';
    }
  }

  if (designation) {
    const desigLow = designation.toLowerCase().trim();
    if (
      desigLow.includes('contract') ||
      desigLow.includes('(cont') ||
      desigLow.includes('part-time') ||
      desigLow.includes('part time') ||
      desigLow.includes('adhoc') ||
      desigLow.includes('guest') ||
      desigLow.includes('vocational') ||
      desigLow.includes('instructor') ||
      desigLow.includes('coach')
    ) {
      return 'Contractual';
    }
  }

  return 'Regular';
}

/**
 * Determines whether a teacher is Regular or Contractual by Name lookup or keyword
 */
export function getStaffEmploymentType(teacherName?: string, staffList?: StaffDetailRecord[]): 'Regular' | 'Contractual' {
  if (!teacherName) return 'Regular';
  const norm = teacherName.toLowerCase().trim();

  // Keyword in name (e.g. "Mr. Amit (Cont.)")
  if (norm.includes('(cont') || norm.includes('contract') || norm.includes('part-time') || norm.includes('guest')) {
    return 'Contractual';
  }

  if (staffList && staffList.length > 0) {
    const match = staffList.find(s => {
      const sName = (s.name || '').toLowerCase().trim();
      return sName === norm || sName.includes(norm) || norm.includes(sName);
    });
    if (match) {
      return match.employmentType || detectEmploymentType(match.designation);
    }
  }

  return 'Regular';
}

/**
 * RFC-4180 Compliant CSV State-Machine Parser
 * Correctly parses multi-line quoted fields, escaped quotes (""), commas, and carriage returns.
 */
export function parseCSVToRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \r\n
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.length > 0 && currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Intelligent Header Fuzzy Matcher for all Staff Fields
 */
export function mapHeaderIndexToField(headerName: string): keyof StaffDetailRecord | null {
  const h = headerName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. S.N.
  if (h === 'sn' || h === 'sno' || h === 'slno' || h === 'serialno' || h === 'srno') {
    return 'serialNo';
  }

  // 2. Name
  if (h === 'name' || h === 'teachername' || h === 'staffname' || h === 'fullname' || h === 'employeename') {
    return 'name';
  }

  // 3. Employee Code
  if (h.includes('emp') && (h.includes('code') || h.includes('id') || h.includes('no'))) {
    return 'employeeCode';
  }

  // 4. Joining Dates (MUST BE CHECKED BEFORE general designation / post / category checks!)
  if (h.includes('joining') && h.includes('kvs')) {
    return 'joiningDateKVSWithDesignation';
  }

  if (h.includes('joining') && (h.includes('present') || h.includes('current') || h.includes('kv'))) {
    return 'joiningDatePresentKVWithDesignation';
  }

  // 5. Employment Type (Regular / Contractual)
  if (
    h.includes('employment') ||
    h.includes('stafftype') ||
    h.includes('cadretype') ||
    h === 'type' ||
    h.includes('regularcontractual') ||
    (h.includes('regular') && h.includes('contract'))
  ) {
    return 'employmentType';
  }

  // 6. Permanent Postal Address (MUST BE CHECKED BEFORE designation and post checks!)
  if (h.includes('address') || h.includes('postal') || h.includes('residence')) {
    return 'permanentPostalAddress';
  }

  // 7. Designation
  if (
    h === 'designation' ||
    h === 'post' ||
    h === 'cadre' ||
    (h.includes('designation') && !h.includes('joining')) ||
    (h.includes('post') && !h.includes('address') && !h.includes('postal'))
  ) {
    return 'designation';
  }

  // 8. Minority (MUST BE CHECKED BEFORE general social category check!)
  if (h.includes('minority') || h.includes('minor')) {
    return 'isMinority';
  }

  // 9. Social Category
  if (h.includes('social') || h.includes('caste') || h === 'cat' || (h.includes('category') && !h.includes('minority'))) {
    return 'socialCategory';
  }

  // 10. DOB
  if (h.includes('dob') || h.includes('birth') || h.includes('dateofbirth')) {
    return 'dob';
  }

  // 11. BANK A/C No.
  if ((h.includes('bank') && (h.includes('ac') || h.includes('acc') || h.includes('account'))) || h === 'accountno' || h === 'bankacno') {
    return 'bankAccountNo';
  }

  // 12. IFSC
  if (h.includes('ifsc')) {
    return 'ifscCode';
  }

  // 13. BANK NAME
  if (h.includes('bankname') || (h.includes('bank') && !h.includes('ac') && !h.includes('ifsc'))) {
    return 'bankName';
  }

  // 14. Highest Acad. Qual. with Professional Qualification
  if (h.includes('qual') || h.includes('education') || h.includes('acad')) {
    return 'highestAcademicAndProfessionalQual';
  }

  // 15. E-mail
  if (h.includes('mail') || h === 'email' || h === 'emailid') {
    return 'email';
  }

  // 16. Phone No. (Whatsapp)
  if (h.includes('whatsapp') || h.includes('wa') || h.includes('wapp')) {
    return 'phoneWhatsapp';
  }

  // 17. Phone No. for calls
  if (h.includes('call') || (h.includes('phone') && !h.includes('whatsapp')) || h === 'mobile' || h === 'contact') {
    return 'phoneCalls';
  }

  // 18. Aadhar No
  if (h.includes('aadhar') || h.includes('adhaar') || h.includes('uid')) {
    return 'aadharNo';
  }

  // 19. PRAN / PAN No
  if (h.includes('pran') || h.includes('pan') || h.includes('gpf') || h.includes('nps')) {
    return 'pranOrPanNo';
  }

  // 20. SENIORITY NUMBER
  if (h.includes('seniority') || h.includes('senno')) {
    return 'seniorityNumber';
  }

  return null;
}

export interface StaffParseResult {
  records: StaffDetailRecord[];
  errors: string[];
  totalRows: number;
}

/**
 * Clean multiline whitespace inside cells
 */
function cleanCellValue(val: string): string {
  if (!val) return '';
  return val
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse CSV File or Raw CSV Text with RFC-4180 Multiline Quoted Field Support
 */
export function parseStaffCSVText(csvContent: string): StaffParseResult {
  if (!csvContent || !csvContent.trim()) {
    return { records: [], errors: ['CSV content is empty.'], totalRows: 0 };
  }

  const allRows = parseCSVToRows(csvContent);

  if (allRows.length === 0) {
    return { records: [], errors: ['CSV content is empty.'], totalRows: 0 };
  }

  const headerRow = allRows[0];
  const fieldMapping: (keyof StaffDetailRecord | null)[] = headerRow.map(h => mapHeaderIndexToField(h));

  const records: StaffDetailRecord[] = [];
  const errors: string[] = [];

  for (let r = 1; r < allRows.length; r++) {
    const rowTokens = allRows[r];
    if (rowTokens.length === 0 || rowTokens.every(c => !c || !c.trim())) continue;

    const rawRecord: Partial<StaffDetailRecord> = {
      id: `stf-imp-${Date.now()}-${r}`,
      serialNo: r,
      approvalStatus: 'Pending Review'
    };

    // Map column values using dynamic header mapping
    for (let c = 0; c < rowTokens.length; c++) {
      const field = fieldMapping[c];
      const val = cleanCellValue(rowTokens[c] || '');

      if (field) {
        if (field === 'serialNo') {
          const parsedSN = parseInt(val, 10);
          rawRecord.serialNo = isNaN(parsedSN) ? r : parsedSN;
        } else {
          (rawRecord as any)[field] = val;
        }
      }
    }

    // Fallback if Name wasn't mapped by header
    if (!rawRecord.name && rowTokens[1] && isNaN(Number(rowTokens[1]))) {
      rawRecord.name = cleanCellValue(rowTokens[1]);
    }

    // Validation
    if (!rawRecord.name || !rawRecord.name.trim()) {
      errors.push(`Row ${r + 1}: Missing Teacher Name. Skipped.`);
      continue;
    }

    // Auto-detect employment type (Regular vs Contractual)
    rawRecord.employmentType = detectEmploymentType(rawRecord.designation, rawRecord.employmentType);

    if (!rawRecord.employeeCode) {
      rawRecord.employeeCode = rawRecord.employmentType === 'Contractual' ? `CNT${20000 + r}` : `EMP${10000 + r}`;
    }

    if (!rawRecord.designation) rawRecord.designation = 'TGT / PGT Teacher';
    if (!rawRecord.socialCategory) rawRecord.socialCategory = 'GEN';
    if (!rawRecord.dob) rawRecord.dob = '';
    if (!rawRecord.joiningDateKVSWithDesignation) rawRecord.joiningDateKVSWithDesignation = '';
    if (!rawRecord.joiningDatePresentKVWithDesignation) rawRecord.joiningDatePresentKVWithDesignation = '';
    if (!rawRecord.bankAccountNo) rawRecord.bankAccountNo = '';
    if (!rawRecord.ifscCode) rawRecord.ifscCode = '';
    if (!rawRecord.bankName) rawRecord.bankName = '';
    if (!rawRecord.highestAcademicAndProfessionalQual) rawRecord.highestAcademicAndProfessionalQual = '';
    if (!rawRecord.permanentPostalAddress) rawRecord.permanentPostalAddress = '';
    if (!rawRecord.email) rawRecord.email = '';
    if (!rawRecord.phoneCalls) rawRecord.phoneCalls = '';
    if (!rawRecord.phoneWhatsapp) rawRecord.phoneWhatsapp = rawRecord.phoneCalls || '';
    if (!rawRecord.aadharNo) rawRecord.aadharNo = '';
    if (!rawRecord.pranOrPanNo) rawRecord.pranOrPanNo = '';
    if (!rawRecord.isMinority) rawRecord.isMinority = 'No';
    if (!rawRecord.seniorityNumber) rawRecord.seniorityNumber = '';

    records.push(rawRecord as StaffDetailRecord);
  }

  return {
    records,
    errors,
    totalRows: allRows.length - 1
  };
}

/**
 * Generate CSV string from staff list
 */
export function generateStaffCSVString(staffList: StaffDetailRecord[]): string {
  const headerLine = OFFICIAL_STAFF_HEADERS.map(h => `"${h}"`).join(',');

  const rows = staffList.map((stf, index) => {
    return [
      `"${stf.serialNo || index + 1}"`,
      `"${stf.name || ''}"`,
      `"${stf.employeeCode || ''}"`,
      `"${stf.designation || ''}"`,
      `"${stf.employmentType || 'Regular'}"`,
      `"${stf.socialCategory || 'GEN'}"`,
      `"${stf.dob || ''}"`,
      `"${stf.joiningDateKVSWithDesignation || ''}"`,
      `"${stf.joiningDatePresentKVWithDesignation || ''}"`,
      `"${stf.bankAccountNo || ''}"`,
      `"${stf.ifscCode || ''}"`,
      `"${stf.bankName || ''}"`,
      `"${stf.highestAcademicAndProfessionalQual || ''}"`,
      `"${(stf.permanentPostalAddress || '').replace(/"/g, '""')}"`,
      `"${stf.email || ''}"`,
      `"${stf.phoneCalls || ''}"`,
      `"${stf.phoneWhatsapp || ''}"`,
      `"${stf.aadharNo || ''}"`,
      `"${stf.pranOrPanNo || ''}"`,
      `"${stf.isMinority || 'No'}"`,
      `"${stf.seniorityNumber || ''}"`
    ].join(',');
  });

  return [headerLine, ...rows].join('\n');
}

/**
 * Download sample CSV file
 */
export function downloadSampleStaffCSVFile(filename = 'KVS_Staff_Details_Sample.csv') {
  const csvContent = generateStaffCSVString(DEFAULT_SAMPLE_STAFF_LIST);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download blank CSV template
 */
export function downloadBlankStaffCSVFile(filename = 'KVS_Staff_Details_Blank_Template.csv') {
  const headerLine = OFFICIAL_STAFF_HEADERS.map(h => `"${h}"`).join(',');
  const blob = new Blob([headerLine + '\n'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
