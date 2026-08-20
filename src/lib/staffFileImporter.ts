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
    id: 'stf-5',
    serialNo: 5,
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
