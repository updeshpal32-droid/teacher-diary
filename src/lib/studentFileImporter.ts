import * as XLSX from 'xlsx';
import { StudentProfile } from '../types/academic';

export interface ParseResult {
  success: boolean;
  students: Partial<StudentProfile>[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
  detectedColumns: string[];
  headerRowIndex: number;
  columnMapping: Record<string, string>;
  fieldColumnIndices: Record<string, number>;
  rawHeaders: string[];
  detectedClass?: string;
  detectedSection?: string;
  rawRows?: string[][];
}

export const OFFICIAL_HEADERS = [
  'S.N.',
  'Name of the Student',
  'Gender',
  'DOB DD/MM/YYYY',
  'STUDENT ID',
  'Date of Admission DD/MM/YYYY',
  'PEN NO. (From UDISE)',
  'APAAR ID No.',
  'FATHER NAME',
  'MOTHER NAME',
  'CONTACT NUMBER',
  'BLOOD GROUP',
  'HEIGHT (in cm)',
  'WEIGHT (in KG)',
  'COMPLETE ADDRESS',
  'ADMISSION CATEGORY',
  'SOCIAL CATEGORY (GEN/OBC/SC/ST)',
  'MINORITY (YES/ NO)',
  'RTE (YES/NO)',
  'SINGLE GIRL CHILD (Class 6 onwards)',
  'AADHAAR NO. OF STUDENT',
  'STUDENT EMAIL ID'
];

export const OFFICIAL_HEADERS_WITH_CLASS = [
  ...OFFICIAL_HEADERS,
  'CLASS',
  'SECTION',
  'ROLL NO'
];

/**
 * Normalizes header string for fuzzy matching
 */
export function cleanHeader(header: string): string {
  if (!header) return '';
  return String(header)
    .replace(/^\uFEFF/, '') // Strip UTF-8 BOM
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Normalizes class name (Roman numerals or numbers to standardized Roman numerals)
 */
export function normalizeClassName(val: any): string {
  if (!val) return '';
  const str = String(val).toUpperCase().replace(/CLASS|STD|STANDARD|GRADE/g, '').trim();
  
  // Foundational Stage (Class 1 & 2)
  if (['1', '1ST', 'I', 'I-A', 'I-B', 'I-C', 'I-D', 'FIRST', 'ONE'].some(k => str === k || str === `I` || str.startsWith('I-') || str.startsWith('1-'))) return 'I';
  if (['2', '2ND', 'II', 'II-A', 'II-B', 'II-C', 'II-D', 'SECOND', 'TWO'].some(k => str === k || str === `II` || str.startsWith('II-') || str.startsWith('2-'))) return 'II';
  
  // Preparatory Stage (Class 3 to 5)
  if (['3', '3RD', 'III', 'III-A', 'III-B', 'III-C', 'III-D', 'THIRD', 'THREE'].some(k => str === k || str === `III` || str.startsWith('III-') || str.startsWith('3-'))) return 'III';
  if (['4', '4TH', 'IV', 'IV-A', 'IV-B', 'IV-C', 'IV-D', 'FOURTH', 'FOUR'].some(k => str === k || str === `IV` || str.startsWith('IV-') || str.startsWith('4-'))) return 'IV';
  if (['5', '5TH', 'V', 'V-A', 'V-B', 'V-C', 'V-D', 'FIFTH', 'FIVE'].some(k => str === k || str === `V` || str.startsWith('V-') || str.startsWith('5-'))) return 'V';

  // Middle Stage (Class 6 to 8)
  if (['6', '6TH', 'VI', 'VI-A', 'VI-B', 'VI-C', 'VI-D', 'SIXTH', 'SIX'].some(k => str === k || str === `VI` || str.startsWith('VI-') || str.startsWith('6-'))) return 'VI';
  if (['7', '7TH', 'VII', 'VII-A', 'VII-B', 'VII-C', 'VII-D', 'SEVENTH', 'SEVEN'].some(k => str === k || str === `VII` || str.startsWith('VII-') || str.startsWith('7-'))) return 'VII';
  if (['8', '8TH', 'VIII', 'VIII-A', 'VIII-B', 'VIII-C', 'VIII-D', 'EIGHTH', 'EIGHT'].some(k => str === k || str === `VIII` || str.startsWith('VIII-') || str.startsWith('8-'))) return 'VIII';

  // Secondary Stage (Class 9 to 12)
  if (['9', '9TH', 'IX', 'IX-A', 'IX-B', 'IX-C', 'IX-D', 'NINTH', 'NINE'].some(k => str === k || str === `IX` || str.startsWith('IX-') || str.startsWith('9-'))) return 'IX';
  if (['10', '10TH', 'X', 'X-A', 'X-B', 'X-C', 'X-D', 'TENTH', 'TEN'].some(k => str === k || str === `X` || str.startsWith('X-') || str.startsWith('10-'))) return 'X';
  if (['11', '11TH', 'XI', 'XI-A', 'XI-B', 'XI-C', 'XI-D', 'ELEVENTH', 'ELEVEN'].some(k => str === k || str === `XI` || str.startsWith('XI-') || str.startsWith('11-'))) return 'XI';
  if (['12', '12TH', 'XII', 'XII-A', 'XII-B', 'XII-C', 'XII-D', 'TWELFTH', 'TWELVE'].some(k => str === k || str === `XII` || str.startsWith('XII-') || str.startsWith('12-'))) return 'XII';

  return str;
}

/**
 * Formats any date string or Excel serial number into DD/MM/YYYY
 */
export function formatToDDMMYYYY(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim().replace(/\u00A0/g, ' ');
  if (!str || str === '-' || str === 'NA' || str === 'N/A' || str === 'null') return '';

  // If numeric Excel date serial number (e.g. 25000 - 60000)
  const num = Number(str);
  if (!isNaN(num) && num > 20000 && num < 75000) {
    try {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      const d = String(date.getUTCDate()).padStart(2, '0');
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const y = date.getUTCFullYear();
      if (!isNaN(date.getTime()) && y > 1980 && y < 2050) {
        return `${d}/${m}/${y}`;
      }
    } catch {
      // fallback
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    let y = dmyMatch[3];
    if (y.length === 2) {
      const yr = parseInt(y, 10);
      y = yr > 50 ? `19${y}` : `20${y}`;
    }
    return `${d}/${m}/${y}`;
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${d}/${m}/${y}`;
  }

  // If Date string representation like "12 May 2013" or "May 12, 2013"
  const parsedTimestamp = Date.parse(str);
  if (!isNaN(parsedTimestamp)) {
    const parsedDate = new Date(parsedTimestamp);
    if (!isNaN(parsedDate.getTime())) {
      const d = String(parsedDate.getDate()).padStart(2, '0');
      const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const y = parsedDate.getFullYear();
      if (y > 1980 && y < 2050) {
        return `${d}/${m}/${y}`;
      }
    }
  }

  return str;
}

/**
 * Normalizes gender value
 */
export function normalizeGender(val: any): 'MALE' | 'FEMALE' | 'OTHER' {
  if (!val) return 'MALE';
  const str = String(val).toUpperCase().trim();
  if (
    str.startsWith('F') ||
    str.includes('GIRL') ||
    str.includes('FEMALE') ||
    str === '2' ||
    str.includes('WOMAN') ||
    str.includes('STREE')
  ) {
    return 'FEMALE';
  }
  if (
    str.startsWith('M') ||
    str.includes('BOY') ||
    str.includes('MALE') ||
    str === '1' ||
    str.includes('MAN') ||
    str.includes('PURUSH')
  ) {
    return 'MALE';
  }
  return 'OTHER';
}

/**
 * Normalizes yes/no booleans (Minority, RTE, Single Girl Child)
 */
export function normalizeYesNo(val: any): 'YES' | 'NO' {
  if (!val) return 'NO';
  const str = String(val).toUpperCase().trim();
  if (
    str === 'Y' ||
    str === 'YES' ||
    str === 'TRUE' ||
    str === '1' ||
    str === 'YES/NO' ||
    str.startsWith('YES') ||
    str === 'T'
  ) {
    return 'YES';
  }
  return 'NO';
}

/**
 * Normalizes social category
 */
export function normalizeCategory(val: any): 'GEN' | 'OBC' | 'SC' | 'ST' | string {
  if (!val) return 'GEN';
  const upper = String(val).toUpperCase().trim();
  if (upper.includes('SC') || upper === 'SCHEDULED CASTE') return 'SC';
  if (upper.includes('ST') || upper === 'SCHEDULED TRIBE') return 'ST';
  if (upper.includes('OBC') || upper.includes('OTHER BACKWARD')) return 'OBC';
  if (upper.includes('GEN') || upper.includes('UR') || upper.includes('GENERAL') || upper.includes('UNRESERVED')) return 'GEN';
  if (upper.includes('EWS')) return 'GEN';
  return upper || 'GEN';
}

/**
 * Checks if a string is a genuine student name (and NOT a header, footer, or metadata string)
 */
export function isValidStudentName(nameCandidate: any): boolean {
  if (!nameCandidate) return false;
  const str = String(nameCandidate).trim();
  if (str.length < 2) return false;

  // Must contain alphabetic characters
  if (!/[a-zA-Z]/.test(str)) return false;

  // Cannot be purely digits or dates
  if (/^[\d/.-]+$/.test(str)) return false;

  const lower = str.toLowerCase();

  // Block forbidden header/footer/metadata words
  const forbiddenWords = [
    'total',
    'grand total',
    'summary',
    'signature',
    'sign',
    'class teacher',
    'principal',
    'checked by',
    'verified by',
    'page',
    'sl.no',
    'sl no',
    's.no',
    's.n.',
    'sno',
    'roll no',
    'student name',
    'name of the student',
    'name of student',
    'pupil name',
    'candidate name',
    'kendriya vidyalaya',
    'kvs',
    'vidyalaya',
    'udise',
    'apaar',
    'aadhaar',
    'date of admission',
    'date of birth',
    'blood group',
    'contact number',
    'category',
    'minority',
    'single girl child',
    'remarks',
    'boys',
    'girls',
    'present',
    'absent',
    'na',
    'null',
    'undefined',
    'student id',
    'admission no'
  ];

  if (forbiddenWords.some(w => lower === w || (lower.startsWith(w) && str.length < 35))) {
    return false;
  }

  // Reject sentences longer than 50 chars that are not names
  if (str.length > 50 && (lower.includes('signature') || lower.includes('generated') || lower.includes('dated'))) {
    return false;
  }

  return true;
}

/**
 * Checks if a candidate row represents a genuine student record
 */
export function isLegitimateStudentRow(row: string[] | Record<string, any>, studentName: string): boolean {
  if (!isValidStudentName(studentName)) return false;

  const values = Array.isArray(row)
    ? row.map(c => String(c ?? '').trim())
    : Object.values(row).map(c => String(c ?? '').trim());

  const nonBlankValues = values.filter(v => v.length > 0 && v !== '-' && v !== 'N/A' && v !== 'NA');

  // Must have more than just a serial number and a blank cell
  if (nonBlankValues.length < 2) return false;

  // Check if all cells are just numbers
  if (nonBlankValues.every(v => !isNaN(Number(v)))) return false;

  return true;
}

/**
 * Calculates score for a header candidate row
 */
export function scoreHeaderRow(row: string[]): number {
  if (!row || row.length < 2) return 0;
  let score = 0;
  row.forEach(cell => {
    const cl = cleanHeader(cell);
    if (!cl) return;
    if (['name', 'studentname', 'nameofstudent', 'fullname', 'candidatename', 'childname', 'nameofthestudent', 'studentsname', 'pupilname'].some(k => cl.includes(k))) score += 6;
    if (['gender', 'sex', 'gendermf'].some(k => cl === k || cl.includes(k))) score += 5;
    if (['dob', 'dateofbirth', 'birthdate', 'dobddmmyyyy'].some(k => cl.includes(k))) score += 5;
    if (['studentid', 'admissionno', 'admno', 'regno', 'scholarno', 'studentno', 'admnumber'].some(k => cl.includes(k))) score += 5;
    if (['pen', 'penno', 'udise', 'pennofromudise'].some(k => cl.includes(k))) score += 5;
    if (['apaar', 'apaarid', 'apaaridno'].some(k => cl.includes(k))) score += 5;
    if (['father', 'fathername', 'guardian', 'fathersname'].some(k => cl.includes(k))) score += 5;
    if (['mother', 'mothername', 'mothersname'].some(k => cl.includes(k))) score += 5;
    if (['contact', 'mobile', 'phone', 'contactnumber', 'mobileno'].some(k => cl.includes(k))) score += 5;
    if (['blood', 'bloodgroup', 'bg'].some(k => cl.includes(k))) score += 4;
    if (['height', 'heightincm', 'ht', 'heightcm'].some(k => cl.includes(k))) score += 4;
    if (['weight', 'weightinkg', 'wt', 'weightkg'].some(k => cl.includes(k))) score += 4;
    if (['completeaddress', 'address', 'residentialaddress', 'permanentaddress', 'fulladdress'].some(k => cl.includes(k))) score += 4;
    if (['category', 'socialcategory', 'admissioncategory', 'caste'].some(k => cl.includes(k))) score += 4;
    if (['minority', 'rte', 'singlegirlchild', 'sgc'].some(k => cl.includes(k))) score += 4;
    if (['aadhaar', 'aadhar', 'uid', 'aadhaarno'].some(k => cl.includes(k))) score += 4;
    if (['email', 'mail', 'studentemail'].some(k => cl.includes(k))) score += 4;
    if (['sn', 'sno', 'slno', 'srno', 'rollno', 'roll', 'serial'].some(k => cl === k || cl.includes(k))) score += 3;
    if (['class', 'section', 'sec'].some(k => cl === k || cl.includes(k))) score += 3;
  });
  return score;
}

/**
 * Detects Class and Section from filename, sheet name, pre-header rows, and raw cells
 */
export function detectClassAndSection(
  fileName: string = '',
  sheetName: string = '',
  preHeaderRows: string[][] = [],
  rawRows: string[][] = []
): { detectedClass?: string; detectedSection?: string } {
  let detectedClass = '';
  let detectedSection = '';

  const scanText = (text: string) => {
    if (!text) return;
    const clean = text.toUpperCase();

    // Check Class patterns in priority order
    // 1. Foundational Stage (Class 1 & 2 / I & II)
    if (/(?:CLASS|STD|GRADE)\s*[:=-]?\s*(I|1|I-A|I-B|I-C|1ST|1-A|1-B)\b/.test(clean) || /\bCLASS\s*1\b/.test(clean) || /\b1ST\s*CLASS\b/.test(clean) || /\bGRADE\s*1\b/.test(clean) || /\bFOUNDATIONAL.*(?:1|I)\b/.test(clean)) {
      if (!detectedClass) detectedClass = 'I';
    } else if (/(?:CLASS|STD|GRADE)\s*[:=-]?\s*(II|2|II-A|II-B|II-C|2ND|2-A|2-B)\b/.test(clean) || /\bCLASS\s*2\b/.test(clean) || /\b2ND\s*CLASS\b/.test(clean) || /\bGRADE\s*2\b/.test(clean) || /\bFOUNDATIONAL.*(?:2|II)\b/.test(clean)) {
      if (!detectedClass) detectedClass = 'II';
    }
    // 2. Preparatory Stage (Class 3 to 5 / III to V)
    else if (/(?:CLASS|STD|GRADE)\s*[:=-]?\s*(III|3|III-A|III-B|III-C|3RD|3-A|3-B)\b/.test(clean) || /\bCLASS\s*3\b/.test(clean) || /\b3RD\s*CLASS\b/.test(clean) || /\bGRADE\s*3\b/.test(clean) || /\bPREPARATORY.*(?:3|III)\b/.test(clean)) {
      if (!detectedClass) detectedClass = 'III';
    } else if (/(?:CLASS|STD|GRADE)\s*[:=-]?\s*(IV|4|IV-A|IV-B|IV-C|4TH|4-A|4-B)\b/.test(clean) || /\bCLASS\s*4\b/.test(clean) || /\b4TH\s*CLASS\b/.test(clean) || /\bGRADE\s*4\b/.test(clean) || /\bPREPARATORY.*(?:4|IV)\b/.test(clean)) {
      if (!detectedClass) detectedClass = 'IV';
    } else if (/(?:CLASS|STD|GRADE)\s*[:=-]?\s*(V|5|V-A|V-B|V-C|5TH|5-A|5-B)\b/.test(clean) || /\bCLASS\s*5\b/.test(clean) || /\b5TH\s*CLASS\b/.test(clean) || /\bGRADE\s*5\b/.test(clean) || /\bPREPARATORY.*(?:5|V)\b/.test(clean)) {
      if (!detectedClass) detectedClass = 'V';
    }
    // 3. Middle Stage (Class 6 to 8 / VI to VIII)
    else if (/(?:CLASS|STD|GRADE)\s*[:=-]?\s*(VIII|8|VIII-A|VIII-B|8TH|8-A)\b/.test(clean) || /\bVIII\b/.test(clean) || /\bCLASS\s*8\b/.test(clean) || /\b8TH\b/.test(clean)) {
      if (!detectedClass) detectedClass = 'VIII';
    } else if (/(?:CLASS|STD|GRADE)\s*[:=-]?\s*(VII|7|VII-A|VII-B|VII-C|7TH|7-A|7-B)\b/.test(clean) || /\bVII\b/.test(clean) || /\bCLASS\s*7\b/.test(clean) || /\b7TH\b/.test(clean)) {
      if (!detectedClass) detectedClass = 'VII';
    } else if (/(?:CLASS|STD|GRADE)\s*[:=-]?\s*(VI|6|VI-A|VI-B|VI-C|6TH|6-A|6-B)\b/.test(clean) || /\bVI\b/.test(clean) || /\bCLASS\s*6\b/.test(clean) || /\b6TH\b/.test(clean)) {
      if (!detectedClass) detectedClass = 'VI';
    }
    // 4. Secondary Stage (Class 9 to 12 / IX to XII)
    else if (/(?:CLASS|STD|GRADE)\s*[:=-]?\s*(XII|12|XII-A|XII-B|12TH|12-A)\b/.test(clean) || /\bXII\b/.test(clean) || /\bCLASS\s*12\b/.test(clean) || /\b12TH\b/.test(clean)) {
      if (!detectedClass) detectedClass = 'XII';
    } else if (/(?:CLASS|STD|GRADE)\s*[:=-]?\s*(XI|11|XI-A|XI-B|11TH|11-A)\b/.test(clean) || /\bXI\b/.test(clean) || /\bCLASS\s*11\b/.test(clean) || /\b11TH\b/.test(clean)) {
      if (!detectedClass) detectedClass = 'XI';
    } else if (/(?:CLASS|STD|GRADE)\s*[:=-]?\s*(X|10|X-A|X-B|10TH|10-A)\b/.test(clean) || /\bX\b/.test(clean) || /\bCLASS\s*10\b/.test(clean) || /\b10TH\b/.test(clean)) {
      if (!detectedClass) detectedClass = 'X';
    } else if (/(?:CLASS|STD|GRADE)\s*[:=-]?\s*(IX|9|IX-A|IX-B|9TH|9-A)\b/.test(clean) || /\bIX\b/.test(clean) || /\bCLASS\s*9\b/.test(clean) || /\b9TH\b/.test(clean)) {
      if (!detectedClass) detectedClass = 'IX';
    }

    // Check Section patterns
    const secMatch = clean.match(/(?:SECTION|SEC)\s*[:=-]?\s*([A-D])\b/);
    if (secMatch && !detectedSection) {
      detectedSection = secMatch[1];
    } else if (/(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|1|2|3|4|5|6|7|8|9|10|11|12)\s*[-_]?\s*([A-D])\b/.test(clean)) {
      const match = clean.match(/(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|1|2|3|4|5|6|7|8|9|10|11|12)\s*[-_]?\s*([A-D])\b/);
      if (match && !detectedSection) {
        detectedSection = match[1];
      }
    }
  };

  // 1. Inspect Sheet Name
  scanText(sheetName);

  // 2. Inspect File Name
  scanText(fileName);

  // 3. Inspect Pre-Header Rows (title banners)
  preHeaderRows.forEach(row => {
    scanText(row.join(' '));
  });

  // 4. Sample first few raw rows
  rawRows.slice(0, 10).forEach(row => {
    scanText(row.join(' '));
  });

  return {
    detectedClass: detectedClass || undefined,
    detectedSection: detectedSection || undefined
  };
}

/**
 * Builds field column indices map by analyzing header names
 */
export function buildFieldColumnIndices(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};

  headers.forEach((header, idx) => {
    const cl = cleanHeader(header);
    if (!cl) return;

    // S.N. / Roll No
    if (['sn', 'sno', 'slno', 'srno', 'serialno', 'serial', 'snno'].includes(cl) && map.sn === undefined) {
      map.sn = idx;
    } else if (['rollno', 'rollnumber', 'roll', 'rno', 'roll_no'].includes(cl) && map.rollNo === undefined) {
      map.rollNo = idx;
    }
    // Student Name
    else if (
      (
        [
          'nameofthestudent',
          'studentname',
          'nameofstudent',
          'name',
          'student',
          'fullname',
          'studentsname',
          'candidatename',
          'pupilname',
          'childname',
          'studentfullname',
          'nameofthechild',
          'nameofpupil'
        ].includes(cl) ||
        (cl.includes('name') &&
          !cl.includes('father') &&
          !cl.includes('mother') &&
          !cl.includes('guardian') &&
          !cl.includes('school') &&
          !cl.includes('teacher'))
      ) &&
      map.studentName === undefined
    ) {
      map.studentName = idx;
    }
    // Gender
    else if (
      ['gender', 'sex', 'gendermf', 'genderfm', 'genderboygirl', 'sexmf', 'boygirl', 'genderofstudent'].includes(cl) &&
      map.gender === undefined
    ) {
      map.gender = idx;
    }
    // DOB
    else if (
      (
        ['dobddmmyyyy', 'dob', 'dateofbirth', 'birthdate', 'dobddmmyy', 'dateofbirthddmmyyyy', 'dobdateofbirth', 'birthdateformat', 'studentdob'].includes(cl) ||
        (cl.includes('birth') && cl.includes('date')) ||
        cl.includes('dob')
      ) &&
      map.dob === undefined
    ) {
      map.dob = idx;
    }
    // Student ID / Admission No
    else if (
      ['studentid', 'id', 'admissionno', 'admno', 'admnumber', 'regno', 'registrationno', 'scholarno', 'admissionnumber', 'studentno', 'srno', 'stdid', 'student_id', 'enrollmentno'].includes(cl) &&
      map.studentId === undefined
    ) {
      map.studentId = idx;
    }
    // Date of Admission
    else if (
      (
        ['dateofadmissionddmmyyyy', 'dateofadmission', 'admissiondate', 'doa', 'admissiondateddmmyyyy', 'dateofadm', 'admdate', 'joiningdate', 'dateofjoining', 'admissiondt'].includes(cl) ||
        (cl.includes('admission') && cl.includes('date'))
      ) &&
      map.admissionDate === undefined
    ) {
      map.admissionDate = idx;
    }
    // PEN No
    else if (
      (
        ['pennofromudise', 'penno', 'pen', 'udisepen', 'udisepenno', 'pennumber', 'permanenteducationnumber', 'udisepennumber', 'udisepennofromudise', 'pennofromudiseplus', 'udiseno', 'penudise'].includes(cl) ||
        (cl.includes('pen') && (cl.includes('udise') || cl.includes('no') || cl.includes('number')))
      ) &&
      map.penNo === undefined
    ) {
      map.penNo = idx;
    }
    // APAAR ID
    else if (
      (['apaaridno', 'apaarid', 'apaarno', 'apaar', 'apaarnumber', 'apaarcardno', 'apaaridnumber', 'apaaridnum', 'apaarnoofstudent'].includes(cl) || cl.includes('apaar')) &&
      map.apaarId === undefined
    ) {
      map.apaarId = idx;
    }
    // Father Name
    else if (
      (
        ['fathername', 'fathersname', 'father', 'guardianname', 'guardiansname', 'fathersfullname', 'fatherguardian', 'parentname', 'fatherguardiansname'].includes(cl) ||
        cl.includes('father')
      ) &&
      map.fatherName === undefined
    ) {
      map.fatherName = idx;
    }
    // Mother Name
    else if (
      (['mothername', 'mothersname', 'mother', 'mothersfullname'].includes(cl) || cl.includes('mother')) &&
      map.motherName === undefined
    ) {
      map.motherName = idx;
    }
    // Contact Number
    else if (
      (
        ['contactnumber', 'contactno', 'mobileno', 'mobile', 'phone', 'phonenumber', 'contact', 'telephone', 'parentcontact', 'parentmobile', 'cell', 'cellno', 'mobilenumber'].includes(cl) ||
        cl.includes('contact') ||
        cl.includes('mobile') ||
        cl.includes('phone')
      ) &&
      map.contactNumber === undefined
    ) {
      map.contactNumber = idx;
    }
    // Blood Group
    else if (
      (['bloodgroup', 'bloodgrp', 'bg', 'blood', 'bloodgroupbg'].includes(cl) || cl.includes('blood')) &&
      map.bloodGroup === undefined
    ) {
      map.bloodGroup = idx;
    }
    // Height
    else if (
      (['heightincm', 'height', 'heightcm', 'ht', 'heightinheight', 'studentheight', 'heightcms'].includes(cl) || cl.includes('height')) &&
      map.height === undefined
    ) {
      map.height = idx;
    }
    // Weight
    else if (
      (['weightinkg', 'weight', 'weightkg', 'wt', 'studentweight', 'weightkgs'].includes(cl) || cl.includes('weight')) &&
      map.weight === undefined
    ) {
      map.weight = idx;
    }
    // Address
    else if (
      (
        ['completeaddress', 'address', 'residentialaddress', 'residentaddress', 'permanentaddress', 'fulladdress', 'studentaddress', 'communicationaddress', 'postaladdress'].includes(cl) ||
        cl.includes('address')
      ) &&
      map.completeAddress === undefined
    ) {
      map.completeAddress = idx;
    }
    // Admission Category
    else if (
      (
        ['admissioncategory', 'admcategory', 'admcat', 'admissiontype', 'admissionquota', 'admquota', 'categoryofadmission', 'admncat'].includes(cl) ||
        (cl.includes('admission') && cl.includes('cat'))
      ) &&
      map.admissionCategory === undefined
    ) {
      map.admissionCategory = idx;
    }
    // Social Category
    else if (
      (
        ['socialcategorygenobcscst', 'socialcategory', 'castecategory', 'caste', 'socialcat', 'categorygenobcscst', 'category', 'community'].includes(cl) ||
        cl.includes('social') ||
        cl.includes('caste')
      ) &&
      map.socialCategory === undefined
    ) {
      map.socialCategory = idx;
    }
    // Minority
    else if (
      (['minorityyesno', 'minority', 'isminority', 'minoritystatus', 'minorityyn'].includes(cl) || cl.includes('minority')) &&
      map.minority === undefined
    ) {
      map.minority = idx;
    }
    // RTE
    else if (
      (['rteyesno', 'rte', 'isrte', 'rtestatus', 'rteyn', 'righttoeducation'].includes(cl) || cl.includes('rte')) &&
      map.rte === undefined
    ) {
      map.rte = idx;
    }
    // Single Girl Child
    else if (
      (
        ['singlegirlchildclass6onwards', 'singlegirlchild', 'singlegirl', 'sgc', 'issinglegirlchild', 'singlegirlchildsgc', 'sgcstatus', 'onlygirlchild'].includes(cl) ||
        cl.includes('singlegirl') ||
        cl.includes('sgc')
      ) &&
      map.singleGirlChild === undefined
    ) {
      map.singleGirlChild = idx;
    }
    // Aadhaar No
    else if (
      (
        ['aadhaarnoofstudent', 'aadhaarno', 'aadharno', 'aadhaar', 'aadhar', 'aadharnumber', 'aadhaarnumber', 'uid', 'uidai', 'aadhaarcardno', 'aadharcardno', 'studentaadhaar'].includes(cl) ||
        cl.includes('aadhaar') ||
        cl.includes('aadhar')
      ) &&
      map.aadhaarNo === undefined
    ) {
      map.aadhaarNo = idx;
    }
    // Student Email
    else if (
      (
        ['studentemailid', 'studentemail', 'emailid', 'email', 'studentmail', 'e_mail', 'studentsemail', 'student_email', 'mailid'].includes(cl) ||
        cl.includes('email') ||
        cl.includes('mail')
      ) &&
      map.studentEmail === undefined
    ) {
      map.studentEmail = idx;
    }
    // Class
    else if (['class', 'classname', 'classsec', 'standard', 'grade'].includes(cl) && map.className === undefined) {
      map.className = idx;
    }
    // Section
    else if (['section', 'sec'].includes(cl) && map.section === undefined) {
      map.section = idx;
    }
  });

  return map;
}

/**
 * Maps raw field keys or positional array into StudentProfile
 */
export function mapRowToStudentProfile(
  rawRow: Record<string, any> | any[],
  fallbackClass: string = 'VII',
  fallbackSection: string = 'A',
  index: number = 1,
  columnMappingIndices?: Record<string, number>
): Partial<StudentProfile> | null {
  const result: Partial<StudentProfile> = {
    id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    className: fallbackClass,
    section: fallbackSection,
    sn: index,
    rollNo: index
  };

  // If positional array with custom column mapping indices
  if (Array.isArray(rawRow)) {
    const getCell = (idx: number | undefined): string => {
      if (idx === undefined || idx < 0 || idx >= rawRow.length) return '';
      const val = rawRow[idx];
      if (val === null || val === undefined) return '';
      return String(val).trim().replace(/\u00A0/g, ' ');
    };

    if (columnMappingIndices && Object.keys(columnMappingIndices).length > 0) {
      if (columnMappingIndices.sn !== undefined) {
        const num = parseInt(getCell(columnMappingIndices.sn), 10);
        result.sn = isNaN(num) ? index : num;
      }
      if (columnMappingIndices.studentName !== undefined) result.studentName = getCell(columnMappingIndices.studentName);
      if (columnMappingIndices.gender !== undefined) result.gender = normalizeGender(getCell(columnMappingIndices.gender));
      if (columnMappingIndices.dob !== undefined) result.dob = formatToDDMMYYYY(getCell(columnMappingIndices.dob));
      if (columnMappingIndices.studentId !== undefined) result.studentId = getCell(columnMappingIndices.studentId);
      if (columnMappingIndices.admissionDate !== undefined) result.admissionDate = formatToDDMMYYYY(getCell(columnMappingIndices.admissionDate));
      if (columnMappingIndices.penNo !== undefined) result.penNo = getCell(columnMappingIndices.penNo);
      if (columnMappingIndices.apaarId !== undefined) result.apaarId = getCell(columnMappingIndices.apaarId);
      if (columnMappingIndices.fatherName !== undefined) result.fatherName = getCell(columnMappingIndices.fatherName);
      if (columnMappingIndices.motherName !== undefined) result.motherName = getCell(columnMappingIndices.motherName);
      if (columnMappingIndices.contactNumber !== undefined) result.contactNumber = getCell(columnMappingIndices.contactNumber);
      if (columnMappingIndices.bloodGroup !== undefined) result.bloodGroup = getCell(columnMappingIndices.bloodGroup).toUpperCase();
      if (columnMappingIndices.height !== undefined) result.height = getCell(columnMappingIndices.height);
      if (columnMappingIndices.weight !== undefined) result.weight = getCell(columnMappingIndices.weight);
      if (columnMappingIndices.completeAddress !== undefined) {
        const addr = getCell(columnMappingIndices.completeAddress);
        result.completeAddress = addr;
        result.address = addr;
      }
      if (columnMappingIndices.admissionCategory !== undefined) result.admissionCategory = getCell(columnMappingIndices.admissionCategory);
      if (columnMappingIndices.socialCategory !== undefined) result.socialCategory = normalizeCategory(getCell(columnMappingIndices.socialCategory));
      if (columnMappingIndices.minority !== undefined) result.minority = normalizeYesNo(getCell(columnMappingIndices.minority));
      if (columnMappingIndices.rte !== undefined) result.rte = normalizeYesNo(getCell(columnMappingIndices.rte));
      if (columnMappingIndices.singleGirlChild !== undefined) result.singleGirlChild = normalizeYesNo(getCell(columnMappingIndices.singleGirlChild));
      if (columnMappingIndices.aadhaarNo !== undefined) result.aadhaarNo = getCell(columnMappingIndices.aadhaarNo);
      if (columnMappingIndices.studentEmail !== undefined) result.studentEmail = getCell(columnMappingIndices.studentEmail);
      if (columnMappingIndices.className !== undefined) {
        const cl = normalizeClassName(getCell(columnMappingIndices.className));
        if (cl) result.className = cl;
      }
      if (columnMappingIndices.section !== undefined) {
        const sec = getCell(columnMappingIndices.section).toUpperCase();
        if (sec) result.section = sec;
      }
      if (columnMappingIndices.rollNo !== undefined) {
        const num = parseInt(getCell(columnMappingIndices.rollNo), 10);
        result.rollNo = isNaN(num) ? index : num;
      }
    } else {
      // Standard official positional fallback (0..24)
      if (getCell(0)) {
        const num = parseInt(getCell(0), 10);
        result.sn = isNaN(num) ? index : num;
      }
      if (getCell(1)) result.studentName = getCell(1);
      if (getCell(2)) result.gender = normalizeGender(getCell(2));
      if (getCell(3)) result.dob = formatToDDMMYYYY(getCell(3));
      if (getCell(4)) result.studentId = getCell(4);
      if (getCell(5)) result.admissionDate = formatToDDMMYYYY(getCell(5));
      if (getCell(6)) result.penNo = getCell(6);
      if (getCell(7)) result.apaarId = getCell(7);
      if (getCell(8)) result.fatherName = getCell(8);
      if (getCell(9)) result.motherName = getCell(9);
      if (getCell(10)) result.contactNumber = getCell(10);
      if (getCell(11)) result.bloodGroup = getCell(11).toUpperCase();
      if (getCell(12)) result.height = getCell(12);
      if (getCell(13)) result.weight = getCell(13);
      if (getCell(14)) {
        result.completeAddress = getCell(14);
        result.address = getCell(14);
      }
      if (getCell(15)) result.admissionCategory = getCell(15);
      if (getCell(16)) result.socialCategory = normalizeCategory(getCell(16));
      if (getCell(17)) result.minority = normalizeYesNo(getCell(17));
      if (getCell(18)) result.rte = normalizeYesNo(getCell(18));
      if (getCell(19)) result.singleGirlChild = normalizeYesNo(getCell(19));
      if (getCell(20)) result.aadhaarNo = getCell(20);
      if (getCell(21)) result.studentEmail = getCell(21);
      if (getCell(22)) {
        const cl = normalizeClassName(getCell(22));
        if (cl) result.className = cl;
      }
      if (getCell(23)) result.section = getCell(23).toUpperCase();
      if (getCell(24)) {
        const num = parseInt(getCell(24), 10);
        result.rollNo = isNaN(num) ? index : num;
      }
    }
  } else {
    // 2. If rawRow is an Object, perform key matching
    for (const [key, value] of Object.entries(rawRow)) {
      if (value === undefined || value === null) continue;
      const strVal = String(value).trim().replace(/\u00A0/g, ' ');
      if (!strVal) continue;

      const cleanedKey = cleanHeader(key);

      if (['sn', 'sno', 'slno', 'srno', 'serialno', 'serial', 'snno'].includes(cleanedKey)) {
        const num = parseInt(strVal, 10);
        result.sn = isNaN(num) ? index : num;
      } else if (['rollno', 'rollnumber', 'roll', 'rno', 'roll_no'].includes(cleanedKey)) {
        const num = parseInt(strVal, 10);
        result.rollNo = isNaN(num) ? index : num;
      } else if (
        [
          'nameofthestudent',
          'studentname',
          'nameofstudent',
          'name',
          'student',
          'fullname',
          'studentsname',
          'candidatename',
          'pupilname',
          'childname',
          'studentfullname',
          'nameofthechild'
        ].includes(cleanedKey) ||
        (cleanedKey.includes('name') &&
          !cleanedKey.includes('father') &&
          !cleanedKey.includes('mother') &&
          !cleanedKey.includes('guardian') &&
          !cleanedKey.includes('school') &&
          !cleanedKey.includes('teacher'))
      ) {
        result.studentName = strVal;
      } else if (
        ['gender', 'sex', 'gendermf', 'genderfm', 'genderboygirl', 'sexmf', 'boygirl', 'genderofstudent'].includes(cleanedKey)
      ) {
        result.gender = normalizeGender(strVal);
      } else if (
        ['dobddmmyyyy', 'dob', 'dateofbirth', 'birthdate', 'dobddmmyy', 'dateofbirthddmmyyyy', 'dobdateofbirth', 'birthdateformat', 'studentdob'].includes(cleanedKey) ||
        (cleanedKey.includes('birth') && cleanedKey.includes('date')) ||
        cleanedKey.includes('dob')
      ) {
        result.dob = formatToDDMMYYYY(strVal);
      } else if (
        ['studentid', 'id', 'admissionno', 'admno', 'admnumber', 'regno', 'registrationno', 'scholarno', 'admissionnumber', 'studentno', 'srno', 'stdid', 'student_id', 'enrollmentno'].includes(cleanedKey)
      ) {
        result.studentId = strVal;
      } else if (
        ['dateofadmissionddmmyyyy', 'dateofadmission', 'admissiondate', 'doa', 'admissiondateddmmyyyy', 'dateofadm', 'admdate', 'joiningdate', 'dateofjoining', 'admissiondt'].includes(cleanedKey) ||
        (cleanedKey.includes('admission') && cleanedKey.includes('date'))
      ) {
        result.admissionDate = formatToDDMMYYYY(strVal);
      } else if (
        ['pennofromudise', 'penno', 'pen', 'udisepen', 'udisepenno', 'pennumber', 'permanenteducationnumber', 'udisepennumber', 'udisepennofromudise', 'pennofromudiseplus', 'udiseno', 'penudise'].includes(cleanedKey) ||
        (cleanedKey.includes('pen') && (cleanedKey.includes('udise') || cleanedKey.includes('no') || cleanedKey.includes('number')))
      ) {
        result.penNo = strVal;
      } else if (
        ['apaaridno', 'apaarid', 'apaarno', 'apaar', 'apaarnumber', 'apaarcardno', 'apaaridnumber', 'apaaridnum', 'apaarnoofstudent'].includes(cleanedKey) ||
        cleanedKey.includes('apaar')
      ) {
        result.apaarId = strVal;
      } else if (
        ['fathername', 'fathersname', 'father', 'guardianname', 'guardiansname', 'fathersfullname', 'fatherguardian', 'parentname', 'fatherguardiansname'].includes(cleanedKey) ||
        cleanedKey.includes('father')
      ) {
        result.fatherName = strVal;
      } else if (
        ['mothername', 'mothersname', 'mother', 'mothersfullname'].includes(cleanedKey) ||
        cleanedKey.includes('mother')
      ) {
        result.motherName = strVal;
      } else if (
        ['contactnumber', 'contactno', 'mobileno', 'mobile', 'phone', 'phonenumber', 'contact', 'telephone', 'parentcontact', 'parentmobile', 'cell', 'cellno', 'mobilenumber'].includes(cleanedKey) ||
        cleanedKey.includes('contact') ||
        cleanedKey.includes('mobile') ||
        cleanedKey.includes('phone')
      ) {
        result.contactNumber = strVal;
      } else if (
        ['bloodgroup', 'bloodgrp', 'bg', 'blood', 'bloodgroupbg'].includes(cleanedKey) ||
        cleanedKey.includes('blood')
      ) {
        result.bloodGroup = strVal.toUpperCase();
      } else if (
        ['heightincm', 'height', 'heightcm', 'ht', 'heightinheight', 'studentheight', 'heightcms'].includes(cleanedKey) ||
        cleanedKey.includes('height')
      ) {
        result.height = strVal;
      } else if (
        ['weightinkg', 'weight', 'weightkg', 'wt', 'studentweight', 'weightkgs'].includes(cleanedKey) ||
        cleanedKey.includes('weight')
      ) {
        result.weight = strVal;
      } else if (
        ['completeaddress', 'address', 'residentialaddress', 'residentaddress', 'permanentaddress', 'fulladdress', 'studentaddress', 'communicationaddress', 'postaladdress'].includes(cleanedKey) ||
        cleanedKey.includes('address')
      ) {
        result.completeAddress = strVal;
        result.address = strVal;
      } else if (
        ['admissioncategory', 'admcategory', 'admcat', 'admissiontype', 'admissionquota', 'admquota', 'categoryofadmission', 'admncat'].includes(cleanedKey) ||
        (cleanedKey.includes('admission') && cleanedKey.includes('cat'))
      ) {
        result.admissionCategory = strVal;
      } else if (
        ['socialcategorygenobcscst', 'socialcategory', 'castecategory', 'caste', 'socialcat', 'categorygenobcscst', 'category', 'community'].includes(cleanedKey) ||
        cleanedKey.includes('social') ||
        cleanedKey.includes('caste')
      ) {
        result.socialCategory = normalizeCategory(strVal);
      } else if (
        ['minorityyesno', 'minority', 'isminority', 'minoritystatus', 'minorityyn'].includes(cleanedKey) ||
        cleanedKey.includes('minority')
      ) {
        result.minority = normalizeYesNo(strVal);
      } else if (
        ['rteyesno', 'rte', 'isrte', 'rtestatus', 'rteyn', 'righttoeducation'].includes(cleanedKey) ||
        cleanedKey.includes('rte')
      ) {
        result.rte = normalizeYesNo(strVal);
      } else if (
        ['singlegirlchildclass6onwards', 'singlegirlchild', 'singlegirl', 'sgc', 'issinglegirlchild', 'singlegirlchildsgc', 'sgcstatus', 'onlygirlchild'].includes(cleanedKey) ||
        cleanedKey.includes('singlegirl') ||
        cleanedKey.includes('sgc')
      ) {
        result.singleGirlChild = normalizeYesNo(strVal);
      } else if (
        ['aadhaarnoofstudent', 'aadhaarno', 'aadharno', 'aadhaar', 'aadhar', 'aadharnumber', 'aadhaarnumber', 'uid', 'uidai', 'aadhaarcardno', 'aadharcardno', 'studentaadhaar'].includes(cleanedKey) ||
        cleanedKey.includes('aadhaar') ||
        cleanedKey.includes('aadhar')
      ) {
        result.aadhaarNo = strVal;
      } else if (
        ['studentemailid', 'studentemail', 'emailid', 'email', 'studentmail', 'e_mail', 'studentsemail', 'student_email', 'mailid'].includes(cleanedKey) ||
        cleanedKey.includes('email') ||
        cleanedKey.includes('mail')
      ) {
        result.studentEmail = strVal;
      } else if (['class', 'classname', 'classsec', 'standard', 'grade'].includes(cleanedKey)) {
        const cl = normalizeClassName(strVal);
        if (cl) result.className = cl;
      } else if (['section', 'sec'].includes(cleanedKey)) {
        result.section = strVal.toUpperCase();
      }
    }
  }

  // Validate student name
  if (!result.studentName || !isValidStudentName(result.studentName)) {
    // If not valid name, try to find first alphabetic word candidate in row
    const values = (Array.isArray(rawRow) ? rawRow : Object.values(rawRow))
      .map(v => String(v || '').trim())
      .filter(v => isValidStudentName(v));

    if (values.length > 0) {
      result.studentName = values[0];
    } else {
      // Not a legitimate student row (e.g. empty line, footer, notes) -> return null to drop it!
      return null;
    }
  }

  // Final check: must be a legitimate row
  if (!isLegitimateStudentRow(rawRow, result.studentName)) {
    return null;
  }

  // Default missing attributes cleanly
  if (!result.studentId) {
    result.studentId = `KV-${result.className || fallbackClass}-${String(index).padStart(4, '0')}`;
  }
  if (!result.gender) {
    result.gender = 'MALE';
  }
  if (!result.dob) {
    result.dob = '01/01/2012';
  }
  if (!result.admissionCategory) {
    result.admissionCategory = 'Cat-1 (Central Govt.)';
  }
  if (!result.socialCategory) {
    result.socialCategory = 'GEN';
  }
  if (!result.minority) {
    result.minority = 'NO';
  }
  if (!result.rte) {
    result.rte = 'NO';
  }
  if (!result.singleGirlChild) {
    result.singleGirlChild = 'NO';
  }
  if (!result.bloodGroup) {
    result.bloodGroup = 'B+';
  }

  return result;
}

/**
 * Universal text tokenizer for RFC-4180 CSV, TSV, Pipe, and Semicolon files
 */
export function tokenizeDelimitedText(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!cleaned.trim()) return [];

  const lines = cleaned.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  const sampleLines = lines.slice(0, 5);
  let commaCount = 0;
  let tabCount = 0;
  let pipeCount = 0;
  let semiCount = 0;

  sampleLines.forEach(l => {
    commaCount += (l.match(/,/g) || []).length;
    tabCount += (l.match(/\t/g) || []).length;
    pipeCount += (l.match(/\|/g) || []).length;
    semiCount += (l.match(/;/g) || []).length;
  });

  let delimiter = ',';
  const counts = [
    { delim: ',', count: commaCount },
    { delim: '\t', count: tabCount },
    { delim: '|', count: pipeCount },
    { delim: ';', count: semiCount }
  ].sort((a, b) => b.count - a.count);

  if (counts[0].count > 0) {
    delimiter = counts[0].delim;
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const nextChar = cleaned[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (char === '\n' && !insideQuotes) {
      currentRow.push(currentField.trim());
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Universal text parser supporting CSV, TSV, Pipe, and Semicolon files
 */
export function parseStudentText(
  text: string,
  fallbackClass: string = 'VII',
  fallbackSection: string = 'A',
  manualColumnMapping?: Record<string, number>,
  fileName: string = ''
): ParseResult {
  const result: ParseResult = {
    success: false,
    students: [],
    errors: [],
    warnings: [],
    totalRows: 0,
    validRows: 0,
    detectedColumns: [],
    headerRowIndex: -1,
    columnMapping: {},
    fieldColumnIndices: {},
    rawHeaders: [],
    rawRows: []
  };

  const rawRows = tokenizeDelimitedText(text);

  if (rawRows.length === 0) {
    result.errors.push('File is empty or no valid rows detected.');
    return result;
  }

  result.rawRows = rawRows;

  // Find header row
  let bestHeaderIndex = -1;
  let maxScore = 0;

  for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
    const score = scoreHeaderRow(rawRows[i]);
    if (score > maxScore && score >= 3) {
      maxScore = score;
      bestHeaderIndex = i;
    }
  }

  result.headerRowIndex = bestHeaderIndex;

  const preHeaderRows = bestHeaderIndex > 0 ? rawRows.slice(0, bestHeaderIndex) : [];
  const { detectedClass, detectedSection } = detectClassAndSection(fileName, '', preHeaderRows, rawRows);

  const effectiveClass = fallbackClass !== 'AUTO' && fallbackClass ? fallbackClass : (detectedClass || 'VII');
  const effectiveSection = fallbackSection || detectedSection || 'A';

  result.detectedClass = detectedClass || effectiveClass;
  result.detectedSection = detectedSection || effectiveSection;

  let headerRow: string[] = [];
  let dataRows: string[][] = [];

  if (bestHeaderIndex >= 0) {
    headerRow = rawRows[bestHeaderIndex];
    dataRows = rawRows.slice(bestHeaderIndex + 1);
  } else {
    headerRow = OFFICIAL_HEADERS_WITH_CLASS;
    dataRows = rawRows;
    result.warnings.push('No header row recognized; mapping columns using standard official position.');
  }

  result.rawHeaders = headerRow;
  result.detectedColumns = headerRow;
  result.totalRows = dataRows.length;

  const fieldIndices = manualColumnMapping && Object.keys(manualColumnMapping).length > 0
    ? manualColumnMapping
    : buildFieldColumnIndices(headerRow);

  result.fieldColumnIndices = fieldIndices;

  const colMap: Record<string, string> = {};
  headerRow.forEach((h, colIdx) => {
    colMap[h || `Col_${colIdx + 1}`] = `Column ${colIdx + 1}`;
  });
  result.columnMapping = colMap;

  const parsedStudents: Partial<StudentProfile>[] = [];
  let studentCounter = 1;

  dataRows.forEach((row) => {
    if (!row || row.length === 0 || row.every(c => !c || c.trim() === '')) return;

    // Skip if identical to header row
    if (row.length === headerRow.length && row.every((c, i) => cleanHeader(c) === cleanHeader(headerRow[i]))) {
      return;
    }

    const student = mapRowToStudentProfile(
      row,
      effectiveClass,
      effectiveSection,
      studentCounter,
      fieldIndices
    );

    if (student) {
      student.sn = studentCounter;
      student.rollNo = student.rollNo || studentCounter;
      student.studentId = student.studentId || `KV-${effectiveClass}-${String(studentCounter).padStart(4, '0')}`;
      parsedStudents.push(student);
      studentCounter++;
    }
  });

  result.students = parsedStudents;
  result.validRows = parsedStudents.length;
  result.success = parsedStudents.length > 0;

  if (result.validRows === 0) {
    result.errors.push('No valid student rows could be parsed. Please verify student names and download sample template.');
  }

  return result;
}

/**
 * Universal file parser supporting CSV, TSV, XLSX, XLS, and JSON
 */
export async function parseStudentFile(
  file: File,
  fallbackClass: string = 'VII',
  fallbackSection: string = 'A',
  manualColumnMapping?: Record<string, number>
): Promise<ParseResult> {
  const fileName = file.name.toLowerCase();
  const result: ParseResult = {
    success: false,
    students: [],
    errors: [],
    warnings: [],
    totalRows: 0,
    validRows: 0,
    detectedColumns: [],
    headerRowIndex: -1,
    columnMapping: {},
    fieldColumnIndices: {},
    rawHeaders: [],
    rawRows: []
  };

  try {
    // Excel Workbook Parsing (.xlsx / .xls)
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rawRows: string[][] = XLSX.utils.sheet_to_json<any[]>(worksheet, {
        header: 1,
        defval: '',
        raw: false,
        dateNF: 'dd/mm/yyyy'
      }).map(row => (Array.isArray(row) ? row.map(c => String(c ?? '').trim()) : []));

      if (!rawRows || rawRows.length === 0) {
        result.errors.push('The uploaded Excel sheet contains no data rows.');
        return result;
      }

      result.rawRows = rawRows;

      // Find header row
      let bestHeaderIndex = -1;
      let maxScore = 0;

      for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
        const score = scoreHeaderRow(rawRows[i]);
        if (score > maxScore && score >= 3) {
          maxScore = score;
          bestHeaderIndex = i;
        }
      }

      result.headerRowIndex = bestHeaderIndex;

      const preHeaderRows = bestHeaderIndex > 0 ? rawRows.slice(0, bestHeaderIndex) : [];
      const { detectedClass, detectedSection } = detectClassAndSection(file.name, firstSheetName, preHeaderRows, rawRows);

      const effectiveClass = fallbackClass !== 'AUTO' && fallbackClass ? fallbackClass : (detectedClass || 'VII');
      const effectiveSection = fallbackSection || detectedSection || 'A';

      result.detectedClass = detectedClass || effectiveClass;
      result.detectedSection = detectedSection || effectiveSection;

      let headerRow: string[] = [];
      let dataRows: string[][] = [];

      if (bestHeaderIndex >= 0) {
        headerRow = rawRows[bestHeaderIndex];
        dataRows = rawRows.slice(bestHeaderIndex + 1);
      } else {
        headerRow = OFFICIAL_HEADERS_WITH_CLASS;
        dataRows = rawRows;
        result.warnings.push('No header row recognized; mapping columns using standard official position.');
      }

      result.rawHeaders = headerRow;
      result.detectedColumns = headerRow;
      result.totalRows = dataRows.length;

      const fieldIndices = manualColumnMapping && Object.keys(manualColumnMapping).length > 0
        ? manualColumnMapping
        : buildFieldColumnIndices(headerRow);

      result.fieldColumnIndices = fieldIndices;

      const colMap: Record<string, string> = {};
      headerRow.forEach((h, colIdx) => {
        colMap[h || `Col_${colIdx + 1}`] = `Column ${colIdx + 1}`;
      });
      result.columnMapping = colMap;

      const parsed: Partial<StudentProfile>[] = [];
      let studentCounter = 1;

      dataRows.forEach((row) => {
        if (!row || row.length === 0 || row.every(c => !c || c.trim() === '')) return;

        // Skip if identical to header
        if (row.length === headerRow.length && row.every((c, i) => cleanHeader(c) === cleanHeader(headerRow[i]))) {
          return;
        }

        const student = mapRowToStudentProfile(
          row,
          effectiveClass,
          effectiveSection,
          studentCounter,
          fieldIndices
        );

        if (student) {
          student.sn = studentCounter;
          student.rollNo = student.rollNo || studentCounter;
          student.studentId = student.studentId || `KV-${effectiveClass}-${String(studentCounter).padStart(4, '0')}`;
          parsed.push(student);
          studentCounter++;
        }
      });

      result.students = parsed;
      result.validRows = parsed.length;
      result.success = parsed.length > 0;

      if (result.validRows === 0) {
        result.errors.push('No valid student rows could be parsed. Please check if your sheet contains Student Names.');
      }

      return result;
    }

    // JSON file parsing
    if (fileName.endsWith('.json')) {
      const text = await file.text();
      const rawJson = JSON.parse(text);
      const arr = Array.isArray(rawJson) ? rawJson : [rawJson];

      if (arr.length === 0) {
        result.errors.push('JSON array is empty.');
        return result;
      }

      result.detectedColumns = Object.keys(arr[0]);
      result.rawHeaders = Object.keys(arr[0]);
      result.totalRows = arr.length;
      
      const { detectedClass, detectedSection } = detectClassAndSection(file.name, '', [], []);
      const effectiveClass = fallbackClass !== 'AUTO' && fallbackClass ? fallbackClass : (detectedClass || 'VII');
      const effectiveSection = fallbackSection || detectedSection || 'A';
      result.detectedClass = detectedClass || effectiveClass;
      result.detectedSection = detectedSection || effectiveSection;

      const parsed: Partial<StudentProfile>[] = [];
      let counter = 1;

      arr.forEach((row) => {
        const student = mapRowToStudentProfile(row, effectiveClass, effectiveSection, counter);
        if (student) {
          student.sn = counter;
          student.rollNo = student.rollNo || counter;
          parsed.push(student);
          counter++;
        }
      });

      result.students = parsed;
      result.validRows = parsed.length;
      result.success = parsed.length > 0;
      return result;
    }

    // CSV / TSV / TXT file
    const text = await file.text();
    return parseStudentText(text, fallbackClass, fallbackSection, manualColumnMapping, file.name);
  } catch (err: any) {
    result.errors.push(`Error parsing file: ${err?.message || String(err)}`);
    return result;
  }
}

/**
 * Generates sample CSV string matching the user's exact specification with UTF-8 BOM
 */
export function generateSampleCSVString(includeClassColumns: boolean = true, targetClass: string = 'VII'): string {
  const cls = normalizeClassName(targetClass) || 'VII';
  const isFoundational = ['I', 'II', '1', '2'].includes(cls);
  const isPreparatory = ['III', 'IV', 'V', '3', '4', '5'].includes(cls);
  
  let sampleRows: string[][] = [];

  if (isFoundational) {
    // Foundational Stage (Class 1 & 2): Ages ~6-7
    sampleRows = [
      [
        '1', 'Aarav Sharma', 'MALE', '14/05/2018', `KV-2025-${cls}01`, '05/04/2024',
        '21170104206001', '984210496801', 'Rajesh Sharma', 'Meena Sharma', '+91 98765 43210',
        'B+', '116', '20.5', 'Qtr No. 42, KV Staff Colony, Bhubaneswar', 'Cat-1 (Central Govt.)',
        'GEN', 'NO', 'NO', 'NO', '4829-1029-4821', `aarav.sharma2018@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '1'] : [])
      ],
      [
        '2', 'Ananya Deshmukh', 'FEMALE', '22/09/2018', `KV-2025-${cls}02`, '08/04/2024',
        '21170104206002', '984210496802', 'Sunil Deshmukh', 'Pooja Deshmukh', '+91 98451 23456',
        'O+', '114', '19.8', 'Plot 104, Saheed Nagar, Bhubaneswar', 'Cat-1 (Defence)',
        'OBC', 'NO', 'NO', 'YES', '5920-1938-2049', `ananya.deshmukh2018@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '2'] : [])
      ],
      [
        '3', 'Reyansh Patel', 'MALE', '10/11/2018', `KV-2025-${cls}03`, '06/04/2024',
        '21170104206003', '984210496803', 'Alok Patel', 'Geeta Patel', '+91 94370 88219',
        'A+', '118', '21.0', 'Flat 302, Royal Residency, Nayapalli', 'Cat-2 (Autonomous/PSU)',
        'GEN', 'NO', 'NO', 'NO', '3819-2048-1920', `reyansh.patel2018@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '3'] : [])
      ],
      [
        '4', 'Saanvi Das', 'FEMALE', '03/02/2019', `KV-2025-${cls}04`, '10/04/2024',
        '21170104206004', '984210496804', 'Debendra Das', 'Lata Das', '+91 97761 02938',
        'AB+', '112', '18.5', 'Bhoi Nagar, Unit-9, Bhubaneswar', 'RTE (25% Quota)',
        'SC', 'NO', 'YES', 'NO', '8192-3019-4820', `saanvi.das2019@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '4'] : [])
      ],
      [
        '5', 'Advait Verma', 'MALE', '15/07/2018', `KV-2025-${cls}05`, '07/04/2024',
        '21170104206005', '984210496805', 'Mangal Verma', 'Shanti Verma', '+91 94381 92019',
        'O-', '115', '20.0', 'Railway Colony, Mancheswar, Bhubaneswar', 'Cat-1 (Railways)',
        'ST', 'NO', 'NO', 'NO', '7281-9301-4829', `advait.verma2018@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '5'] : [])
      ]
    ];
  } else if (isPreparatory) {
    // Preparatory Stage (Class 3 to 5): Ages ~8-10
    sampleRows = [
      [
        '1', 'Kabir Mohanty', 'MALE', '12/04/2015', `KV-2025-${cls}01`, '05/04/2021',
        '21170104205001', '984210495801', 'Ashok Mohanty', 'Sunita Mohanty', '+91 98765 43210',
        'B+', '132', '28.5', 'Qtr No. 12, KV Staff Quarters, Bhubaneswar', 'Cat-1 (Central Govt.)',
        'GEN', 'NO', 'NO', 'NO', '4829-1029-4821', `kabir.mohanty2015@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '1'] : [])
      ],
      [
        '2', 'Ishita Sengupta', 'FEMALE', '18/08/2015', `KV-2025-${cls}02`, '08/04/2021',
        '21170104205002', '984210495802', 'Partha Sengupta', 'Ruma Sengupta', '+91 98451 23456',
        'O+', '130', '26.8', 'Plot 55, Saheed Nagar, Bhubaneswar', 'Cat-1 (Defence)',
        'OBC', 'NO', 'NO', 'YES', '5920-1938-2049', `ishita.sengupta2015@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '2'] : [])
      ],
      [
        '3', 'Tanmay Acharya', 'MALE', '05/12/2015', `KV-2025-${cls}03`, '06/04/2021',
        '21170104205003', '984210495803', 'Bikas Acharya', 'Niharika Acharya', '+91 94370 88219',
        'A+', '135', '30.0', 'Flat 401, Grand Residency, Nayapalli', 'Cat-2 (Autonomous/PSU)',
        'GEN', 'NO', 'NO', 'NO', '3819-2048-1920', `tanmay.acharya2015@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '3'] : [])
      ],
      [
        '4', 'Prisha Sen', 'FEMALE', '20/02/2016', `KV-2025-${cls}04`, '10/04/2021',
        '21170104205004', '984210495804', 'Debasish Sen', 'Mitali Sen', '+91 97761 02938',
        'AB+', '128', '25.5', 'Bhoi Nagar, Unit-4, Bhubaneswar', 'RTE (25% Quota)',
        'SC', 'NO', 'YES', 'NO', '8192-3019-4820', `prisha.sen2016@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '4'] : [])
      ],
      [
        '5', 'Rohan Paul', 'MALE', '11/06/2015', `KV-2025-${cls}05`, '07/04/2021',
        '21170104205005', '984210495805', 'Samir Paul', 'Kalyani Paul', '+91 94381 92019',
        'O-', '133', '29.2', 'Railway Enclave, Mancheswar, Bhubaneswar', 'Cat-1 (Railways)',
        'ST', 'NO', 'NO', 'NO', '7281-9301-4829', `rohan.paul2015@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '5'] : [])
      ]
    ];
  } else {
    // Middle & Secondary Stage (Class 6 to 12)
    sampleRows = [
      [
        '1', 'Aarav Sharma', 'MALE', '12/05/2012', `KV-2025-${cls}01`, '05/04/2018',
        '21170104201001', '984210492801', 'Rajesh Sharma', 'Meena Sharma', '+91 98765 43210',
        'B+', '148', '38.5', 'Qtr No. 42, KV Staff Colony, Bhubaneswar', 'Cat-1 (Central Govt.)',
        'GEN', 'NO', 'NO', 'NO', '4829-1029-4821', `aarav.sharma2012@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '1'] : [])
      ],
      [
        '2', 'Ananya Deshmukh', 'FEMALE', '24/09/2012', `KV-2025-${cls}02`, '08/04/2018',
        '21170104201002', '984210492802', 'Sunil Deshmukh', 'Pooja Deshmukh', '+91 98451 23456',
        'O+', '145', '36.0', 'Plot 104, Saheed Nagar, Bhubaneswar', 'Cat-1 (Defence)',
        'OBC', 'NO', 'NO', 'YES', '5920-1938-2049', `ananya.deshmukh2012@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '2'] : [])
      ],
      [
        '3', 'Bhavya Mishra', 'FEMALE', '18/11/2012', `KV-2025-${cls}03`, '06/04/2018',
        '21170104201003', '984210492803', 'Alok Mishra', 'Geeta Mishra', '+91 94370 88219',
        'A+', '142', '34.5', 'Flat 302, Royal Residency, Nayapalli', 'Cat-2 (Autonomous/PSU)',
        'GEN', 'NO', 'NO', 'YES', '3819-2048-1920', `bhavya.mishra2012@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '3'] : [])
      ],
      [
        '4', 'Chirag Naik', 'MALE', '03/02/2012', `KV-2025-${cls}04`, '10/04/2018',
        '21170104201004', '984210492804', 'Debendra Naik', 'Lata Naik', '+91 97761 02938',
        'AB+', '150', '41.0', 'Bhoi Nagar, Unit-9, Bhubaneswar', 'RTE (25% Quota)',
        'SC', 'NO', 'YES', 'NO', '8192-3019-4820', `chirag.naik2012@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '4'] : [])
      ],
      [
        '5', 'Divya Soren', 'FEMALE', '15/07/2012', `KV-2025-${cls}05`, '07/04/2018',
        '21170104201005', '984210492805', 'Mangal Soren', 'Shanti Soren', '+91 94381 92019',
        'O-', '144', '35.2', 'Railway Colony, Mancheswar, Bhubaneswar', 'Cat-1 (Railways)',
        'ST', 'NO', 'NO', 'YES', '7281-9301-4829', `divya.soren2012@kvsstudent.in`,
        ...(includeClassColumns ? [cls, 'A', '5'] : [])
      ]
    ];
  }

  const headers = includeClassColumns ? OFFICIAL_HEADERS_WITH_CLASS : OFFICIAL_HEADERS;
  const headerLine = headers.map(h => `"${h}"`).join(',');
  const rowLines = sampleRows.map(row => row.map(cell => `"${cell}"`).join(','));

  // Prepend UTF-8 BOM (\uFEFF) for flawless Excel compatibility
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

/**
 * Generates clean blank template CSV string
 */
export function generateBlankCSVString(includeClassColumns: boolean = true): string {
  const headers = includeClassColumns ? OFFICIAL_HEADERS_WITH_CLASS : OFFICIAL_HEADERS;
  const headerLine = headers.map(h => `"${h}"`).join(',');
  return '\uFEFF' + headerLine;
}

/**
 * Download sample CSV file
 */
export function downloadSampleCSVFile(className: string = 'VII') {
  const content = generateSampleCSVString(true, className);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Class_${className}_Students_Sample_Template.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download blank CSV template file
 */
export function downloadBlankCSVFile() {
  const content = generateBlankCSVString(true);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Students_Profile_Blank_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download sample formatted Excel (.xlsx) file
 */
export function downloadSampleExcelFile(className: string = 'VII') {
  const cls = normalizeClassName(className) || 'VII';
  const isFoundational = ['I', 'II', '1', '2'].includes(cls);
  const isPreparatory = ['III', 'IV', 'V', '3', '4', '5'].includes(cls);

  let sampleData: any[] = [];

  if (isFoundational) {
    // Foundational Stage (Class 1 & 2): Ages ~6-7
    sampleData = [
      {
        'S.N.': 1,
        'Name of the Student': 'Aarav Sharma',
        'Gender': 'MALE',
        'DOB DD/MM/YYYY': '14/05/2018',
        'STUDENT ID': `KV-2025-${cls}01`,
        'Date of Admission DD/MM/YYYY': '05/04/2024',
        'PEN NO. (From UDISE)': '21170104206001',
        'APAAR ID No.': '984210496801',
        'FATHER NAME': 'Rajesh Sharma',
        'MOTHER NAME': 'Meena Sharma',
        'CONTACT NUMBER': '+91 98765 43210',
        'BLOOD GROUP': 'B+',
        'HEIGHT (in cm)': '116',
        'WEIGHT (in KG)': '20.5',
        'COMPLETE ADDRESS': 'Qtr No. 42, KV Staff Colony, Bhubaneswar',
        'ADMISSION CATEGORY': 'Cat-1 (Central Govt.)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'GEN',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'NO',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'NO',
        'AADHAAR NO. OF STUDENT': '4829-1029-4821',
        'STUDENT EMAIL ID': `aarav.sharma2018@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 1
      },
      {
        'S.N.': 2,
        'Name of the Student': 'Ananya Deshmukh',
        'Gender': 'FEMALE',
        'DOB DD/MM/YYYY': '22/09/2018',
        'STUDENT ID': `KV-2025-${cls}02`,
        'Date of Admission DD/MM/YYYY': '08/04/2024',
        'PEN NO. (From UDISE)': '21170104206002',
        'APAAR ID No.': '984210496802',
        'FATHER NAME': 'Sunil Deshmukh',
        'MOTHER NAME': 'Pooja Deshmukh',
        'CONTACT NUMBER': '+91 98451 23456',
        'BLOOD GROUP': 'O+',
        'HEIGHT (in cm)': '114',
        'WEIGHT (in KG)': '19.8',
        'COMPLETE ADDRESS': 'Plot 104, Saheed Nagar, Bhubaneswar',
        'ADMISSION CATEGORY': 'Cat-1 (Defence)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'OBC',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'NO',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'YES',
        'AADHAAR NO. OF STUDENT': '5920-1938-2049',
        'STUDENT EMAIL ID': `ananya.deshmukh2018@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 2
      },
      {
        'S.N.': 3,
        'Name of the Student': 'Reyansh Patel',
        'Gender': 'MALE',
        'DOB DD/MM/YYYY': '10/11/2018',
        'STUDENT ID': `KV-2025-${cls}03`,
        'Date of Admission DD/MM/YYYY': '06/04/2024',
        'PEN NO. (From UDISE)': '21170104206003',
        'APAAR ID No.': '984210496803',
        'FATHER NAME': 'Alok Patel',
        'MOTHER NAME': 'Geeta Patel',
        'CONTACT NUMBER': '+91 94370 88219',
        'BLOOD GROUP': 'A+',
        'HEIGHT (in cm)': '118',
        'WEIGHT (in KG)': '21.0',
        'COMPLETE ADDRESS': 'Flat 302, Royal Residency, Nayapalli',
        'ADMISSION CATEGORY': 'Cat-2 (Autonomous/PSU)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'GEN',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'NO',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'NO',
        'AADHAAR NO. OF STUDENT': '3819-2048-1920',
        'STUDENT EMAIL ID': `reyansh.patel2018@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 3
      },
      {
        'S.N.': 4,
        'Name of the Student': 'Saanvi Das',
        'Gender': 'FEMALE',
        'DOB DD/MM/YYYY': '03/02/2019',
        'STUDENT ID': `KV-2025-${cls}04`,
        'Date of Admission DD/MM/YYYY': '10/04/2024',
        'PEN NO. (From UDISE)': '21170104206004',
        'APAAR ID No.': '984210496804',
        'FATHER NAME': 'Debendra Das',
        'MOTHER NAME': 'Lata Das',
        'CONTACT NUMBER': '+91 97761 02938',
        'BLOOD GROUP': 'AB+',
        'HEIGHT (in cm)': '112',
        'WEIGHT (in KG)': '18.5',
        'COMPLETE ADDRESS': 'Bhoi Nagar, Unit-9, Bhubaneswar',
        'ADMISSION CATEGORY': 'RTE (25% Quota)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'SC',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'YES',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'NO',
        'AADHAAR NO. OF STUDENT': '8192-3019-4820',
        'STUDENT EMAIL ID': `saanvi.das2019@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 4
      },
      {
        'S.N.': 5,
        'Name of the Student': 'Advait Verma',
        'Gender': 'MALE',
        'DOB DD/MM/YYYY': '15/07/2018',
        'STUDENT ID': `KV-2025-${cls}05`,
        'Date of Admission DD/MM/YYYY': '07/04/2024',
        'PEN NO. (From UDISE)': '21170104206005',
        'APAAR ID No.': '984210496805',
        'FATHER NAME': 'Mangal Verma',
        'MOTHER NAME': 'Shanti Verma',
        'CONTACT NUMBER': '+91 94381 92019',
        'BLOOD GROUP': 'O-',
        'HEIGHT (in cm)': '115',
        'WEIGHT (in KG)': '20.0',
        'COMPLETE ADDRESS': 'Railway Colony, Mancheswar, Bhubaneswar',
        'ADMISSION CATEGORY': 'Cat-1 (Railways)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'ST',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'NO',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'NO',
        'AADHAAR NO. OF STUDENT': '7281-9301-4829',
        'STUDENT EMAIL ID': `advait.verma2018@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 5
      }
    ];
  } else if (isPreparatory) {
    // Preparatory Stage (Class 3 to 5): Ages ~8-10
    sampleData = [
      {
        'S.N.': 1,
        'Name of the Student': 'Kabir Mohanty',
        'Gender': 'MALE',
        'DOB DD/MM/YYYY': '12/04/2015',
        'STUDENT ID': `KV-2025-${cls}01`,
        'Date of Admission DD/MM/YYYY': '05/04/2021',
        'PEN NO. (From UDISE)': '21170104205001',
        'APAAR ID No.': '984210495801',
        'FATHER NAME': 'Ashok Mohanty',
        'MOTHER NAME': 'Sunita Mohanty',
        'CONTACT NUMBER': '+91 98765 43210',
        'BLOOD GROUP': 'B+',
        'HEIGHT (in cm)': '132',
        'WEIGHT (in KG)': '28.5',
        'COMPLETE ADDRESS': 'Qtr No. 12, KV Staff Quarters, Bhubaneswar',
        'ADMISSION CATEGORY': 'Cat-1 (Central Govt.)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'GEN',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'NO',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'NO',
        'AADHAAR NO. OF STUDENT': '4829-1029-4821',
        'STUDENT EMAIL ID': `kabir.mohanty2015@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 1
      },
      {
        'S.N.': 2,
        'Name of the Student': 'Ishita Sengupta',
        'Gender': 'FEMALE',
        'DOB DD/MM/YYYY': '18/08/2015',
        'STUDENT ID': `KV-2025-${cls}02`,
        'Date of Admission DD/MM/YYYY': '08/04/2021',
        'PEN NO. (From UDISE)': '21170104205002',
        'APAAR ID No.': '984210495802',
        'FATHER NAME': 'Partha Sengupta',
        'MOTHER NAME': 'Ruma Sengupta',
        'CONTACT NUMBER': '+91 98451 23456',
        'BLOOD GROUP': 'O+',
        'HEIGHT (in cm)': '130',
        'WEIGHT (in KG)': '26.8',
        'COMPLETE ADDRESS': 'Plot 55, Saheed Nagar, Bhubaneswar',
        'ADMISSION CATEGORY': 'Cat-1 (Defence)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'OBC',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'NO',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'YES',
        'AADHAAR NO. OF STUDENT': '5920-1938-2049',
        'STUDENT EMAIL ID': `ishita.sengupta2015@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 2
      },
      {
        'S.N.': 3,
        'Name of the Student': 'Tanmay Acharya',
        'Gender': 'MALE',
        'DOB DD/MM/YYYY': '05/12/2015',
        'STUDENT ID': `KV-2025-${cls}03`,
        'Date of Admission DD/MM/YYYY': '06/04/2021',
        'PEN NO. (From UDISE)': '21170104205003',
        'APAAR ID No.': '984210495803',
        'FATHER NAME': 'Bikas Acharya',
        'MOTHER NAME': 'Niharika Acharya',
        'CONTACT NUMBER': '+91 94370 88219',
        'BLOOD GROUP': 'A+',
        'HEIGHT (in cm)': '135',
        'WEIGHT (in KG)': '30.0',
        'COMPLETE ADDRESS': 'Flat 401, Grand Residency, Nayapalli',
        'ADMISSION CATEGORY': 'Cat-2 (Autonomous/PSU)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'GEN',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'NO',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'NO',
        'AADHAAR NO. OF STUDENT': '3819-2048-1920',
        'STUDENT EMAIL ID': `tanmay.acharya2015@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 3
      },
      {
        'S.N.': 4,
        'Name of the Student': 'Prisha Sen',
        'Gender': 'FEMALE',
        'DOB DD/MM/YYYY': '20/02/2016',
        'STUDENT ID': `KV-2025-${cls}04`,
        'Date of Admission DD/MM/YYYY': '10/04/2021',
        'PEN NO. (From UDISE)': '21170104205004',
        'APAAR ID No.': '984210495804',
        'FATHER NAME': 'Debasish Sen',
        'MOTHER NAME': 'Mitali Sen',
        'CONTACT NUMBER': '+91 97761 02938',
        'BLOOD GROUP': 'AB+',
        'HEIGHT (in cm)': '128',
        'WEIGHT (in KG)': '25.5',
        'COMPLETE ADDRESS': 'Bhoi Nagar, Unit-4, Bhubaneswar',
        'ADMISSION CATEGORY': 'RTE (25% Quota)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'SC',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'YES',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'NO',
        'AADHAAR NO. OF STUDENT': '8192-3019-4820',
        'STUDENT EMAIL ID': `prisha.sen2016@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 4
      },
      {
        'S.N.': 5,
        'Name of the Student': 'Rohan Paul',
        'Gender': 'MALE',
        'DOB DD/MM/YYYY': '11/06/2015',
        'STUDENT ID': `KV-2025-${cls}05`,
        'Date of Admission DD/MM/YYYY': '07/04/2021',
        'PEN NO. (From UDISE)': '21170104205005',
        'APAAR ID No.': '984210495805',
        'FATHER NAME': 'Samir Paul',
        'MOTHER NAME': 'Kalyani Paul',
        'CONTACT NUMBER': '+91 94381 92019',
        'BLOOD GROUP': 'O-',
        'HEIGHT (in cm)': '133',
        'WEIGHT (in KG)': '29.2',
        'COMPLETE ADDRESS': 'Railway Enclave, Mancheswar, Bhubaneswar',
        'ADMISSION CATEGORY': 'Cat-1 (Railways)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'ST',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'NO',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'NO',
        'AADHAAR NO. OF STUDENT': '7281-9301-4829',
        'STUDENT EMAIL ID': `rohan.paul2015@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 5
      }
    ];
  } else {
    // Middle & Secondary Stage (Class 6 to 12)
    sampleData = [
      {
        'S.N.': 1,
        'Name of the Student': 'Aarav Sharma',
        'Gender': 'MALE',
        'DOB DD/MM/YYYY': '12/05/2012',
        'STUDENT ID': `KV-2025-${cls}01`,
        'Date of Admission DD/MM/YYYY': '05/04/2018',
        'PEN NO. (From UDISE)': '21170104201001',
        'APAAR ID No.': '984210492801',
        'FATHER NAME': 'Rajesh Sharma',
        'MOTHER NAME': 'Meena Sharma',
        'CONTACT NUMBER': '+91 98765 43210',
        'BLOOD GROUP': 'B+',
        'HEIGHT (in cm)': '148',
        'WEIGHT (in KG)': '38.5',
        'COMPLETE ADDRESS': 'Qtr No. 42, KV Staff Colony, Bhubaneswar',
        'ADMISSION CATEGORY': 'Cat-1 (Central Govt.)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'GEN',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'NO',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'NO',
        'AADHAAR NO. OF STUDENT': '4829-1029-4821',
        'STUDENT EMAIL ID': `aarav.sharma2012@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 1
      },
      {
        'S.N.': 2,
        'Name of the Student': 'Ananya Deshmukh',
        'Gender': 'FEMALE',
        'DOB DD/MM/YYYY': '24/09/2012',
        'STUDENT ID': `KV-2025-${cls}02`,
        'Date of Admission DD/MM/YYYY': '08/04/2018',
        'PEN NO. (From UDISE)': '21170104201002',
        'APAAR ID No.': '984210492802',
        'FATHER NAME': 'Sunil Deshmukh',
        'MOTHER NAME': 'Pooja Deshmukh',
        'CONTACT NUMBER': '+91 98451 23456',
        'BLOOD GROUP': 'O+',
        'HEIGHT (in cm)': '145',
        'WEIGHT (in KG)': '36.0',
        'COMPLETE ADDRESS': 'Plot 104, Saheed Nagar, Bhubaneswar',
        'ADMISSION CATEGORY': 'Cat-1 (Defence)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'OBC',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'NO',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'YES',
        'AADHAAR NO. OF STUDENT': '5920-1938-2049',
        'STUDENT EMAIL ID': `ananya.deshmukh2012@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 2
      },
      {
        'S.N.': 3,
        'Name of the Student': 'Bhavya Mishra',
        'Gender': 'FEMALE',
        'DOB DD/MM/YYYY': '18/11/2012',
        'STUDENT ID': `KV-2025-${cls}03`,
        'Date of Admission DD/MM/YYYY': '06/04/2018',
        'PEN NO. (From UDISE)': '21170104201003',
        'APAAR ID No.': '984210492803',
        'FATHER NAME': 'Alok Mishra',
        'MOTHER NAME': 'Geeta Mishra',
        'CONTACT NUMBER': '+91 94370 88219',
        'BLOOD GROUP': 'A+',
        'HEIGHT (in cm)': '142',
        'WEIGHT (in KG)': '34.5',
        'COMPLETE ADDRESS': 'Flat 302, Royal Residency, Nayapalli',
        'ADMISSION CATEGORY': 'Cat-2 (Autonomous/PSU)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'GEN',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'NO',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'YES',
        'AADHAAR NO. OF STUDENT': '3819-2048-1920',
        'STUDENT EMAIL ID': `bhavya.mishra2012@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 3
      },
      {
        'S.N.': 4,
        'Name of the Student': 'Chirag Naik',
        'Gender': 'MALE',
        'DOB DD/MM/YYYY': '03/02/2012',
        'STUDENT ID': `KV-2025-${cls}04`,
        'Date of Admission DD/MM/YYYY': '10/04/2018',
        'PEN NO. (From UDISE)': '21170104201004',
        'APAAR ID No.': '984210492804',
        'FATHER NAME': 'Debendra Naik',
        'MOTHER NAME': 'Lata Naik',
        'CONTACT NUMBER': '+91 97761 02938',
        'BLOOD GROUP': 'AB+',
        'HEIGHT (in cm)': '150',
        'WEIGHT (in KG)': '41.0',
        'COMPLETE ADDRESS': 'Bhoi Nagar, Unit-9, Bhubaneswar',
        'ADMISSION CATEGORY': 'RTE (25% Quota)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'SC',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'YES',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'NO',
        'AADHAAR NO. OF STUDENT': '8192-3019-4820',
        'STUDENT EMAIL ID': `chirag.naik2012@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 4
      },
      {
        'S.N.': 5,
        'Name of the Student': 'Divya Soren',
        'Gender': 'FEMALE',
        'DOB DD/MM/YYYY': '15/07/2012',
        'STUDENT ID': `KV-2025-${cls}05`,
        'Date of Admission DD/MM/YYYY': '07/04/2018',
        'PEN NO. (From UDISE)': '21170104201005',
        'APAAR ID No.': '984210492805',
        'FATHER NAME': 'Mangal Soren',
        'MOTHER NAME': 'Shanti Soren',
        'CONTACT NUMBER': '+91 94381 92019',
        'BLOOD GROUP': 'O-',
        'HEIGHT (in cm)': '144',
        'WEIGHT (in KG)': '35.2',
        'COMPLETE ADDRESS': 'Railway Colony, Mancheswar, Bhubaneswar',
        'ADMISSION CATEGORY': 'Cat-1 (Railways)',
        'SOCIAL CATEGORY (GEN/OBC/SC/ST)': 'ST',
        'MINORITY (YES/ NO)': 'NO',
        'RTE (YES/NO)': 'NO',
        'SINGLE GIRL CHILD (Class 6 onwards)': 'YES',
        'AADHAAR NO. OF STUDENT': '7281-9301-4829',
        'STUDENT EMAIL ID': `divya.soren2012@kvsstudent.in`,
        'CLASS': cls,
        'SECTION': 'A',
        'ROLL NO': 5
      }
    ];
  }

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // Set generous column widths
  worksheet['!cols'] = [
    { wch: 6 },  // S.N.
    { wch: 24 }, // Student Name
    { wch: 10 }, // Gender
    { wch: 15 }, // DOB
    { wch: 16 }, // Student ID
    { wch: 18 }, // Admission Date
    { wch: 20 }, // PEN No
    { wch: 16 }, // APAAR ID
    { wch: 22 }, // Father Name
    { wch: 22 }, // Mother Name
    { wch: 18 }, // Contact
    { wch: 12 }, // Blood Group
    { wch: 14 }, // Height
    { wch: 14 }, // Weight
    { wch: 36 }, // Complete Address
    { wch: 22 }, // Admission Category
    { wch: 18 }, // Social Category
    { wch: 12 }, // Minority
    { wch: 12 }, // RTE
    { wch: 18 }, // Single Girl Child
    { wch: 22 }, // Aadhaar
    { wch: 28 }, // Email
    { wch: 8 },  // Class
    { wch: 8 },  // Section
    { wch: 8 }   // Roll No
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Class_${cls}_Students`);
  XLSX.writeFile(workbook, `Class_${cls}_Students_Template.xlsx`);
}

/**
 * Export student array to CSV
 */
export function exportStudentsToCSV(students: StudentProfile[], filename = 'Students_Profile_Export.csv') {
  const rows = students.map(s => [
    s.sn || '',
    s.studentName || '',
    s.gender || '',
    s.dob || '',
    s.studentId || '',
    s.admissionDate || '',
    s.penNo || '',
    s.apaarId || '',
    s.fatherName || '',
    s.motherName || '',
    s.contactNumber || '',
    s.bloodGroup || '',
    s.height || '',
    s.weight || '',
    s.completeAddress || s.address || '',
    s.admissionCategory || '',
    s.socialCategory || '',
    s.minority || 'NO',
    s.rte || 'NO',
    s.singleGirlChild || 'NO',
    s.aadhaarNo || '',
    s.studentEmail || '',
    s.className || '',
    s.section || '',
    s.rollNo || ''
  ]);

  const header = OFFICIAL_HEADERS_WITH_CLASS.map(h => `"${h}"`).join(',');
  const lines = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
  const csvContent = '\uFEFF' + [header, ...lines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export student array to XLSX
 */
export function exportStudentsToXLSX(students: StudentProfile[], filename = 'Students_Profile_Export.xlsx') {
  const exportData = students.map(s => ({
    'S.N.': s.sn,
    'Name of the Student': s.studentName,
    'Gender': s.gender,
    'DOB DD/MM/YYYY': s.dob,
    'STUDENT ID': s.studentId,
    'Date of Admission DD/MM/YYYY': s.admissionDate,
    'PEN NO. (From UDISE)': s.penNo,
    'APAAR ID No.': s.apaarId,
    'FATHER NAME': s.fatherName,
    'MOTHER NAME': s.motherName,
    'CONTACT NUMBER': s.contactNumber,
    'BLOOD GROUP': s.bloodGroup,
    'HEIGHT (in cm)': s.height || '',
    'WEIGHT (in KG)': s.weight || '',
    'COMPLETE ADDRESS': s.completeAddress || s.address || '',
    'ADMISSION CATEGORY': s.admissionCategory,
    'SOCIAL CATEGORY (GEN/OBC/SC/ST)': s.socialCategory,
    'MINORITY (YES/ NO)': s.minority,
    'RTE (YES/NO)': s.rte,
    'SINGLE GIRL CHILD (Class 6 onwards)': s.singleGirlChild,
    'AADHAAR NO. OF STUDENT': s.aadhaarNo,
    'STUDENT EMAIL ID': s.studentEmail,
    'CLASS': s.className,
    'SECTION': s.section,
    'ROLL NO': s.rollNo
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students_Roster');
  XLSX.writeFile(workbook, filename);
}
