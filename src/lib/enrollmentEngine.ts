import {
  StudentProfile,
  ClassSection,
  TransferCertificateRecord,
  StudentAttendanceRecord,
  ClassDailyAttendanceRecord
} from '../types/academic';
import { getDayStatusInfo, DayStatusResult } from './kvsHolidays2026';
import * as XLSX from 'xlsx';

// ==========================================
// 1. SECTION 1: CASTE CATEGORY WISE TYPES & MATRIX
// ==========================================

export interface CasteCategoryRow {
  className: string;
  section: string;
  isSubtotal?: boolean;
  isGrandTotal?: boolean;
  rowLabel?: string;

  // Total Students
  totalBoys: number;
  totalGirls: number;
  grandTotalStudents: number;

  // Social Categories (Boys / Girls / Total)
  gen: { b: number; g: number; t: number };
  sc: { b: number; g: number; t: number };
  st: { b: number; g: number; t: number };
  obcCl: { b: number; g: number; t: number };
  obcNcl: { b: number; g: number; t: number };

  // Category Totals Check (Gen/SC/ST/PH/OBC/Muslim/MC)
  checkBoys: number;
  checkGirls: number;
  checkGrandTotal: number;

  // PH / CWSN
  ph: { b: number; g: number; t: number };

  // Minority Categories
  muslim: { b: number; g: number; t: number };
  christian: { b: number; g: number; t: number };
  others: { b: number; g: number; t: number };

  // Special Schemes
  rte: { b: number; g: number; t: number };
  bpl: { b: number; g: number; t: number };
  sgc: number;
  totalObc: number; // OBC-CL + OBC-NCL

  // Admin Verification
  writeYes: 'YES' | 'NO' | string;
  classTeacherName: string;
}

// ==========================================
// 2. SECTION 2: ADMN CATEGORY WISE TYPES & MATRIX
// ==========================================

export interface AdmnCategoryRow {
  className: string;
  section: string;
  isSubtotal?: boolean;
  isGrandTotal?: boolean;
  rowLabel?: string;

  // Categories I to V (B / G / T)
  cat1: { b: number; g: number; t: number };
  cat2: { b: number; g: number; t: number };
  cat3: { b: number; g: number; t: number };
  cat4: { b: number; g: number; t: number };
  cat5: { b: number; g: number; t: number };

  // Totals
  totalBoys: number;
  totalGirls: number;
  grandTotal: number;

  // Admissions & TCs
  newAdmissions: number;
  noOfTcIssued: number;
  markYes: 'YES' | 'NO' | string;
  classTeacherName: string;
  tcIssuedInPreviousMonth: number;
}

// ==========================================
// 3. DAILY ATTENDANCE TYPES & MATRIX
// ==========================================

export interface DailyClassAttendanceCell {
  className: string;
  section: string;
  presentCount: number;
  absentCount: number;
  absentRollNos: string; // e.g. "5, 10, 11, 20"
  totalClassStrength: number;
}

export interface DailyAttendanceRow {
  dateStr: string; // YYYY-MM-DD
  displayDate: string; // e.g. "1/April/2026"
  dayOfWeek: string; // "Wednesday"
  dayStatus: DayStatusResult;
  classCells: Record<string, DailyClassAttendanceCell>; // Key: "I", "II" ... "X"
  totalPresent: number;
  totalAbsent: number;
  totalStudents: number;
}

// Helper to initialize empty Caste Category Row
function createEmptyCasteRow(className: string, section: string, label?: string, isSub = false, isGrand = false): CasteCategoryRow {
  return {
    className,
    section,
    isSubtotal: isSub,
    isGrandTotal: isGrand,
    rowLabel: label,
    totalBoys: 0,
    totalGirls: 0,
    grandTotalStudents: 0,
    gen: { b: 0, g: 0, t: 0 },
    sc: { b: 0, g: 0, t: 0 },
    st: { b: 0, g: 0, t: 0 },
    obcCl: { b: 0, g: 0, t: 0 },
    obcNcl: { b: 0, g: 0, t: 0 },
    checkBoys: 0,
    checkGirls: 0,
    checkGrandTotal: 0,
    ph: { b: 0, g: 0, t: 0 },
    muslim: { b: 0, g: 0, t: 0 },
    christian: { b: 0, g: 0, t: 0 },
    others: { b: 0, g: 0, t: 0 },
    rte: { b: 0, g: 0, t: 0 },
    bpl: { b: 0, g: 0, t: 0 },
    sgc: 0,
    totalObc: 0,
    writeYes: 'YES',
    classTeacherName: ''
  };
}

function addCasteRow(target: CasteCategoryRow, src: CasteCategoryRow) {
  target.totalBoys += src.totalBoys;
  target.totalGirls += src.totalGirls;
  target.grandTotalStudents += src.grandTotalStudents;

  target.gen.b += src.gen.b; target.gen.g += src.gen.g; target.gen.t += src.gen.t;
  target.sc.b += src.sc.b; target.sc.g += src.sc.g; target.sc.t += src.sc.t;
  target.st.b += src.st.b; target.st.g += src.st.g; target.st.t += src.st.t;
  target.obcCl.b += src.obcCl.b; target.obcCl.g += src.obcCl.g; target.obcCl.t += src.obcCl.t;
  target.obcNcl.b += src.obcNcl.b; target.obcNcl.g += src.obcNcl.g; target.obcNcl.t += src.obcNcl.t;

  target.checkBoys += src.checkBoys;
  target.checkGirls += src.checkGirls;
  target.checkGrandTotal += src.checkGrandTotal;

  target.ph.b += src.ph.b; target.ph.g += src.ph.g; target.ph.t += src.ph.t;
  target.muslim.b += src.muslim.b; target.muslim.g += src.muslim.g; target.muslim.t += src.muslim.t;
  target.christian.b += src.christian.b; target.christian.g += src.christian.g; target.christian.t += src.christian.t;
  target.others.b += src.others.b; target.others.g += src.others.g; target.others.t += src.others.t;

  target.rte.b += src.rte.b; target.rte.g += src.rte.g; target.rte.t += src.rte.t;
  target.bpl.b += src.bpl.b; target.bpl.g += src.bpl.g; target.bpl.t += src.bpl.t;
  target.sgc += src.sgc;
  target.totalObc += src.totalObc;
}

// Helper to initialize empty Admn Category Row
function createEmptyAdmnRow(className: string, section: string, label?: string, isSub = false, isGrand = false): AdmnCategoryRow {
  return {
    className,
    section,
    isSubtotal: isSub,
    isGrandTotal: isGrand,
    rowLabel: label,
    cat1: { b: 0, g: 0, t: 0 },
    cat2: { b: 0, g: 0, t: 0 },
    cat3: { b: 0, g: 0, t: 0 },
    cat4: { b: 0, g: 0, t: 0 },
    cat5: { b: 0, g: 0, t: 0 },
    totalBoys: 0,
    totalGirls: 0,
    grandTotal: 0,
    newAdmissions: 0,
    noOfTcIssued: 0,
    markYes: 'YES',
    classTeacherName: '',
    tcIssuedInPreviousMonth: 0
  };
}

function addAdmnRow(target: AdmnCategoryRow, src: AdmnCategoryRow) {
  target.cat1.b += src.cat1.b; target.cat1.g += src.cat1.g; target.cat1.t += src.cat1.t;
  target.cat2.b += src.cat2.b; target.cat2.g += src.cat2.g; target.cat2.t += src.cat2.t;
  target.cat3.b += src.cat3.b; target.cat3.g += src.cat3.g; target.cat3.t += src.cat3.t;
  target.cat4.b += src.cat4.b; target.cat4.g += src.cat4.g; target.cat4.t += src.cat4.t;
  target.cat5.b += src.cat5.b; target.cat5.g += src.cat5.g; target.cat5.t += src.cat5.t;

  target.totalBoys += src.totalBoys;
  target.totalGirls += src.totalGirls;
  target.grandTotal += src.grandTotal;
  target.newAdmissions += src.newAdmissions;
  target.noOfTcIssued += src.noOfTcIssued;
  target.tcIssuedInPreviousMonth += src.tcIssuedInPreviousMonth;
}

// ==========================================
// 4. MATRIX BUILDERS
// ==========================================

const STANDARD_CLASSES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export const CLASS_TEACHERS_KV_KUTRA: Record<string, string> = {
  'I': 'Aarti Kisan',
  'II': 'Santwana Dash',
  'III': 'Sarita Dhanwar',
  'IV': 'Mahendra Kua',
  'V': 'Manish kumar sidar',
  'VI': 'Dipanwita Mandal',
  'VII': 'Omprakash Sharma',
  'VIII': 'Sanjukta Kujur',
  'IX': 'Samya Raha',
  'X': 'Priyabrat Padhan'
};

/**
 * Computes Section 1 (Caste Category Wise Matrix) with all official subtotal groups:
 * - I to II Total
 * - III to V Total
 * - VI to VIII Total
 * - IX to X Total
 * - I To X Grand Total
 */
export function calculateCasteCategoryMatrix(
  students: StudentProfile[],
  classes: ClassSection[],
  issuedTcList: TransferCertificateRecord[] = []
): CasteCategoryRow[] {
  // Exclude students who have been issued a valid TC
  const issuedTcStudentIds = new Set(issuedTcList.filter(t => t.status === 'Issued').map(t => t.studentId));
  const activeStudents = students.filter(s => !issuedTcStudentIds.has(s.id) && !issuedTcStudentIds.has(s.studentId));

  const rows: CasteCategoryRow[] = [];

  const subtotalI_II = createEmptyCasteRow('I to II Total', '', 'I to II Total', true);
  const subtotalIII_V = createEmptyCasteRow('III to V Total', '', 'III to V Total', true);
  const subtotalVI_VIII = createEmptyCasteRow('VI to VIII Total', '', 'VI to VIII Total', true);
  const subtotalIX_X = createEmptyCasteRow('IX to X Total', '', 'IX to X Total', true);
  const grandTotal = createEmptyCasteRow('I To X Grand Total', '', 'I To X Grand Total', false, true);

  for (const cls of STANDARD_CLASSES) {
    const classRow = createEmptyCasteRow(cls, 'A');
    classRow.classTeacherName = CLASS_TEACHERS_KV_KUTRA[cls] || classes.find(c => c.className === cls)?.classTeacherName || '';

    const classStudents = activeStudents.filter(s => (s.className || '').trim().toUpperCase() === cls);

    for (const student of classStudents) {
      const isBoy = (student.gender || '').toUpperCase() === 'MALE' || (student.gender || '').toUpperCase() === 'BOY';
      const isGirl = (student.gender || '').toUpperCase() === 'FEMALE' || (student.gender || '').toUpperCase() === 'GIRL';

      if (isBoy) classRow.totalBoys++;
      if (isGirl) classRow.totalGirls++;
      classRow.grandTotalStudents++;

      const socialCat = (student.socialCategory || 'GEN').toUpperCase();
      if (socialCat === 'GEN' || socialCat === 'GENERAL') {
        if (isBoy) classRow.gen.b++;
        if (isGirl) classRow.gen.g++;
        classRow.gen.t++;
      } else if (socialCat === 'SC') {
        if (isBoy) classRow.sc.b++;
        if (isGirl) classRow.sc.g++;
        classRow.sc.t++;
      } else if (socialCat === 'ST') {
        if (isBoy) classRow.st.b++;
        if (isGirl) classRow.st.g++;
        classRow.st.t++;
      } else if (socialCat === 'OBC-CL' || socialCat === 'OBC CL') {
        if (isBoy) classRow.obcCl.b++;
        if (isGirl) classRow.obcCl.g++;
        classRow.obcCl.t++;
      } else {
        // Default OBC-NCL
        if (isBoy) classRow.obcNcl.b++;
        if (isGirl) classRow.obcNcl.g++;
        classRow.obcNcl.t++;
      }

      // Check Totals
      if (isBoy) classRow.checkBoys++;
      if (isGirl) classRow.checkGirls++;
      classRow.checkGrandTotal++;

      // Minority & Special Flags
      const min = (student.minority || '').toUpperCase();
      if (min === 'YES' || min === 'MUSLIM') {
        if (isBoy) classRow.muslim.b++;
        if (isGirl) classRow.muslim.g++;
        classRow.muslim.t++;
      } else if (min === 'CHRISTIAN') {
        if (isBoy) classRow.christian.b++;
        if (isGirl) classRow.christian.g++;
        classRow.christian.t++;
      }

      const isRte = (student.rte || '').toUpperCase() === 'YES';
      if (isRte) {
        if (isBoy) classRow.rte.b++;
        if (isGirl) classRow.rte.g++;
        classRow.rte.t++;
      }

      const isSgc = (student.singleGirlChild || '').toUpperCase() === 'YES';
      if (isSgc && isGirl) {
        classRow.sgc++;
      }
    }

    classRow.totalObc = classRow.obcCl.t + classRow.obcNcl.t;

    rows.push(classRow);

    // Accumulate into Subtotals
    if (cls === 'I' || cls === 'II') addCasteRow(subtotalI_II, classRow);
    if (cls === 'III' || cls === 'IV' || cls === 'V') addCasteRow(subtotalIII_V, classRow);
    if (cls === 'VI' || cls === 'VII' || cls === 'VIII') addCasteRow(subtotalVI_VIII, classRow);
    if (cls === 'IX' || cls === 'X') addCasteRow(subtotalIX_X, classRow);
    addCasteRow(grandTotal, classRow);

    // Insert Subtotal Rows after corresponding groups
    if (cls === 'II') rows.push(subtotalI_II);
    if (cls === 'V') rows.push(subtotalIII_V);
    if (cls === 'VIII') rows.push(subtotalVI_VIII);
    if (cls === 'X') {
      rows.push(subtotalIX_X);
      rows.push(grandTotal);
    }
  }

  return rows;
}

/**
 * Computes Section 2 (Admission Category Wise Matrix) with all official subtotal groups:
 * - I to V Total
 * - VI to VIII Total
 * - IX to X Total
 * - I to X GRAND TOTAL
 */
export function calculateAdmnCategoryMatrix(
  students: StudentProfile[],
  classes: ClassSection[],
  issuedTcList: TransferCertificateRecord[] = []
): AdmnCategoryRow[] {
  const issuedTcStudentIds = new Set(issuedTcList.filter(t => t.status === 'Issued').map(t => t.studentId));
  const activeStudents = students.filter(s => !issuedTcStudentIds.has(s.id) && !issuedTcStudentIds.has(s.studentId));

  const rows: AdmnCategoryRow[] = [];

  const subtotalI_V = createEmptyAdmnRow('I to V Total', '', 'I to V Total', true);
  const subtotalVI_VIII = createEmptyAdmnRow('VI to VIII Total', '', 'VI to VIII Total', true);
  const subtotalIX_X = createEmptyAdmnRow('IX to X Total', '', 'IX to X Total', true);
  const grandTotal = createEmptyAdmnRow('I to X GRAND TOTAL', '', 'I to X GRAND TOTAL', false, true);

  for (const cls of STANDARD_CLASSES) {
    const classRow = createEmptyAdmnRow(cls, 'A');
    classRow.classTeacherName = CLASS_TEACHERS_KV_KUTRA[cls] || classes.find(c => c.className === cls)?.classTeacherName || '';

    const classStudents = activeStudents.filter(s => (s.className || '').trim().toUpperCase() === cls);
    const classTcList = issuedTcList.filter(t => t.className === cls && t.status === 'Issued');
    classRow.noOfTcIssued = classTcList.length;

    for (const student of classStudents) {
      const isBoy = (student.gender || '').toUpperCase() === 'MALE' || (student.gender || '').toUpperCase() === 'BOY';
      const isGirl = (student.gender || '').toUpperCase() === 'FEMALE' || (student.gender || '').toUpperCase() === 'GIRL';

      if (isBoy) classRow.totalBoys++;
      if (isGirl) classRow.totalGirls++;
      classRow.grandTotal++;

      const cat = (student.admissionCategory || 'V').toUpperCase();
      if (cat === 'I' || cat === 'CAT-I' || cat === 'CAT 1' || cat === '1') {
        if (isBoy) classRow.cat1.b++;
        if (isGirl) classRow.cat1.g++;
        classRow.cat1.t++;
      } else if (cat === 'II' || cat === 'CAT-II' || cat === 'CAT 2' || cat === '2') {
        if (isBoy) classRow.cat2.b++;
        if (isGirl) classRow.cat2.g++;
        classRow.cat2.t++;
      } else if (cat === 'III' || cat === 'CAT-III' || cat === 'CAT 3' || cat === '3') {
        if (isBoy) classRow.cat3.b++;
        if (isGirl) classRow.cat3.g++;
        classRow.cat3.t++;
      } else if (cat === 'IV' || cat === 'CAT-IV' || cat === 'CAT 4' || cat === '4') {
        if (isBoy) classRow.cat4.b++;
        if (isGirl) classRow.cat4.g++;
        classRow.cat4.t++;
      } else {
        // Default Cat-V (Private / General Public)
        if (isBoy) classRow.cat5.b++;
        if (isGirl) classRow.cat5.g++;
        classRow.cat5.t++;
      }
    }

    rows.push(classRow);

    if (['I', 'II', 'III', 'IV', 'V'].includes(cls)) addAdmnRow(subtotalI_V, classRow);
    if (['VI', 'VII', 'VIII'].includes(cls)) addAdmnRow(subtotalVI_VIII, classRow);
    if (['IX', 'X'].includes(cls)) addAdmnRow(subtotalIX_X, classRow);
    addAdmnRow(grandTotal, classRow);

    if (cls === 'V') rows.push(subtotalI_V);
    if (cls === 'VIII') rows.push(subtotalVI_VIII);
    if (cls === 'X') {
      rows.push(subtotalIX_X);
      rows.push(grandTotal);
    }
  }

  return rows;
}

/**
 * Computes Monthly Daily Attendance Grid matching KV Kutra 2026-27 Sheet
 */
export function generateMonthlyDailyAttendanceGrid(
  students: StudentProfile[],
  attendanceRecords: (ClassDailyAttendanceRecord | StudentAttendanceRecord)[],
  year: number,
  monthIndex: number // 0-indexed: 3 = April, 4 = May, etc.
): DailyAttendanceRow[] {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const rows: DailyAttendanceRow[] = [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const curMonthName = monthNames[monthIndex];

  // Group active students by class
  const classStudentsMap: Record<string, StudentProfile[]> = {};
  for (const cls of STANDARD_CLASSES) {
    classStudentsMap[cls] = students.filter(s => (s.className || '').trim().toUpperCase() === cls);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const padDay = String(day).padStart(2, '0');
    const padMonth = String(monthIndex + 1).padStart(2, '0');
    const dateStr = `${year}-${padMonth}-${padDay}`;
    const displayDate = `${day}/${curMonthName}/${year}`;

    const dateObj = new Date(year, monthIndex, day);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dayStatus = getDayStatusInfo(dateStr);

    const classCells: Record<string, DailyClassAttendanceCell> = {};
    let rowTotalPresent = 0;
    let rowTotalAbsent = 0;
    let rowTotalStudents = 0;

    for (const cls of STANDARD_CLASSES) {
      const clsStudents = classStudentsMap[cls] || [];
      const totalStrength = clsStudents.length;
      rowTotalStudents += totalStrength;

      if (dayStatus.isHolidayOrOff) {
        classCells[cls] = {
          className: cls,
          section: 'A',
          presentCount: 0,
          absentCount: 0,
          absentRollNos: '',
          totalClassStrength: totalStrength
        };
      } else {
        // Find attendance records for this class and date
        const rec = attendanceRecords.find(r => r.date === dateStr && r.className === cls);
        if (rec && 'presentCount' in rec) {
          const classRec = rec as ClassDailyAttendanceRecord;
          const pres = classRec.presentCount;
          const abs = classRec.absentCount;
          const rollNos = classRec.absentRollNos ? classRec.absentRollNos.join(', ') : '';
          classCells[cls] = {
            className: cls,
            section: 'A',
            presentCount: pres,
            absentCount: abs,
            absentRollNos: rollNos,
            totalClassStrength: totalStrength
          };
          rowTotalPresent += pres;
          rowTotalAbsent += abs;
        } else {
          // Default all present on working days if not yet marked
          classCells[cls] = {
            className: cls,
            section: 'A',
            presentCount: totalStrength,
            absentCount: 0,
            absentRollNos: '',
            totalClassStrength: totalStrength
          };
          rowTotalPresent += totalStrength;
        }
      }
    }

    rows.push({
      dateStr,
      displayDate,
      dayOfWeek,
      dayStatus,
      classCells,
      totalPresent: dayStatus.isHolidayOrOff ? 0 : rowTotalPresent,
      totalAbsent: dayStatus.isHolidayOrOff ? 0 : rowTotalAbsent,
      totalStudents: rowTotalStudents
    });
  }

  return rows;
}

// ==========================================
// 5. EXCEL (.XLSX) EXPORT ENGINES
// ==========================================

export function exportEnrollmentToExcel(
  casteRows: CasteCategoryRow[],
  admnRows: AdmnCategoryRow[],
  asOnDateStr: string = '31/07/2026',
  schoolName: string = 'KENDRIYA VIDYALAYA KUTRA, SUNDARGARH, ODISHA'
) {
  const wb = XLSX.utils.book_new();

  // 1. Build Caste Category Wise Sheet
  const casteData: any[][] = [];
  casteData.push([`As on ${asOnDateStr}`, schoolName]);
  casteData.push(['', '', 'Caste Category Wise', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Caste Category Wise']);
  casteData.push(['', '', 'Social Category', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Total Boys', 'Total Girls', 'Grand Total', 'PH', '', '', 'Minority Category']);
  casteData.push([
    'Class', 'Sec.', 'Total Number of Students', '', '',
    'Gen', '', '', 'SC', '', '', 'ST', '', '',
    'OBC CL', '', '', 'OBC-NCL', '', '',
    'Total Boys', 'Total Girls', 'Grand Total',
    'PH Boys', 'PH Girls', 'PH Total',
    'Muslim Boys', 'Muslim Girls', 'Muslim Total',
    'Christian Boys', 'Christian Girls', 'Christian Total',
    'Others Boys', 'Others Girls', 'Others Total',
    'RTE Boys', 'RTE Girls', 'RTE Total',
    'BPL Boys', 'BPL Girls', 'BPL Total',
    'SGC', 'Total OBC', 'Write Yes after Updating', 'Name of Class teacher'
  ]);
  casteData.push([
    '', '', 'Boys', 'Girls', 'Total',
    'Boys', 'Girls', 'Total', 'Boys', 'Girls', 'Total', 'Boys', 'Girls', 'Total',
    'Boys', 'Girls', 'Total', 'Boys', 'Girls', 'Total',
    '', '', '',
    '', '', '',
    '', '', '',
    '', '', '',
    '', '', '',
    '', '', '',
    '', '', '',
    '', '', '', ''
  ]);

  for (const r of casteRows) {
    casteData.push([
      r.rowLabel || r.className,
      r.isSubtotal || r.isGrandTotal ? '' : r.section,
      r.totalBoys, r.totalGirls, r.grandTotalStudents,
      r.gen.b, r.gen.g, r.gen.t,
      r.sc.b, r.sc.g, r.sc.t,
      r.st.b, r.st.g, r.st.t,
      r.obcCl.b, r.obcCl.g, r.obcCl.t,
      r.obcNcl.b, r.obcNcl.g, r.obcNcl.t,
      r.checkBoys, r.checkGirls, r.checkGrandTotal,
      r.ph.b, r.ph.g, r.ph.t,
      r.muslim.b, r.muslim.g, r.muslim.t,
      r.christian.b, r.christian.g, r.christian.t,
      r.others.b, r.others.g, r.others.t,
      r.rte.b, r.rte.g, r.rte.t,
      r.bpl.b, r.bpl.g, r.bpl.t,
      r.sgc, r.totalObc, r.writeYes, r.classTeacherName
    ]);
  }

  // 2. Build Admn Category Wise Sheet
  const admnData: any[][] = [];
  admnData.push(['Admn. Category Wise', '', 'Admn. Category Wise', '', '', '', 'Admn. Category Wise']);
  admnData.push([
    'Class', 'SEC',
    'Cat-I Boys', 'Cat-I Girls', 'Cat-I Total',
    'Cat-II Boys', 'Cat-II Girls', 'Cat-II Total',
    'Cat-III Boys', 'Cat-III Girls', 'Cat-III Total',
    'Cat-IV Boys', 'Cat-IV Girls', 'Cat-IV Total',
    'Cat-V Boys', 'Cat-V Girls', 'Cat-V Total',
    'Total Boys', 'Total Girls', 'Grand Total',
    'New Admn', 'No. of TC Issued', 'Mark Yes', 'Class Teacher', 'TC Issued in the previous month'
  ]);

  for (const r of admnRows) {
    admnData.push([
      r.rowLabel || r.className,
      r.isSubtotal || r.isGrandTotal ? '' : r.section,
      r.cat1.b, r.cat1.g, r.cat1.t,
      r.cat2.b, r.cat2.g, r.cat2.t,
      r.cat3.b, r.cat3.g, r.cat3.t,
      r.cat4.b, r.cat4.g, r.cat4.t,
      r.cat5.b, r.cat5.g, r.cat5.t,
      r.totalBoys, r.totalGirls, r.grandTotal,
      r.newAdmissions, r.noOfTcIssued, r.markYes, r.classTeacherName, r.tcIssuedInPreviousMonth
    ]);
  }

  const wsCaste = XLSX.utils.aoa_to_sheet(casteData);
  const wsAdmn = XLSX.utils.aoa_to_sheet(admnData);

  XLSX.utils.book_append_sheet(wb, wsCaste, 'Caste Category Wise');
  XLSX.utils.book_append_sheet(wb, wsAdmn, 'Admn Category Wise');

  XLSX.writeFile(wb, `Students_Enrolment_${asOnDateStr.replace(/\//g, '-')}.xlsx`);
}

export function exportDailyAttendanceToExcel(
  dailyRows: DailyAttendanceRow[],
  monthName: string,
  year: number
) {
  const wb = XLSX.utils.book_new();
  const data: any[][] = [];

  data.push([`Student Daily Attendance ${monthName}-${year}`]);

  // Headers
  const header1 = ['Date'];
  const header2 = [''];

  for (const cls of STANDARD_CLASSES) {
    header1.push(cls, '', '');
    header2.push('Pres', 'Abs', 'Abs Roll Nos');
  }
  header1.push('Total', '', '');
  header2.push('Pres', 'Abs', 'Total');

  data.push(header1);
  data.push(header2);

  for (const row of dailyRows) {
    if (row.dayStatus.isHolidayOrOff) {
      const holRow: (string | number)[] = [row.displayDate];
      for (let i = 0; i < STANDARD_CLASSES.length; i++) {
        holRow.push(row.dayStatus.badgeLabel, '', '');
      }
      holRow.push('#VALUE!', '#VALUE!', '#VALUE!');
      data.push(holRow);
    } else {
      const r: (string | number)[] = [row.displayDate];
      for (const cls of STANDARD_CLASSES) {
        const c = row.classCells[cls];
        r.push(c ? c.presentCount : 0);
        r.push(c ? c.absentCount : 0);
        r.push(c ? c.absentRollNos : '');
      }
      r.push(row.totalPresent);
      r.push(row.totalAbsent);
      r.push(row.totalStudents);
      data.push(r);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, `${monthName} ${year}`);
  XLSX.writeFile(wb, `Daily_Student_Attendance_${monthName}_${year}.xlsx`);
}