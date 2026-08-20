import { DayOfWeek, TeacherRecord, TimetableSlot, SyllabusItem, SyllabusStatus } from '../types/academic';

/**
 * Standard client-side RFC-4180 compliant CSV parser.
 * Supports quoted fields, escaped quotes, newlines inside quotes, and flexible column headers.
 */
export function parseCSV(text: string): Record<string, string>[] {
  if (!text || !text.trim()) return [];

  const lines: string[] = [];
  let currentLine = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if ((char === '\n' || char === '\r') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return [];

  // Parse cells for a row
  const parseRowCells = (rowStr: string): string[] => {
    const cells: string[] = [];
    let currentCell = '';
    let inQ = false;

    for (let i = 0; i < rowStr.length; i++) {
      const c = rowStr[i];
      const nc = rowStr[i + 1];

      if (c === '"') {
        if (inQ && nc === '"') {
          currentCell += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === ',' && !inQ) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += c;
      }
    }
    cells.push(currentCell.trim());
    return cells;
  };

  const rawHeaders = parseRowCells(lines[0]);
  const headers = rawHeaders.map(h => h.trim());
  const records: Record<string, string>[] = [];

  for (let r = 1; r < lines.length; r++) {
    const rowValues = parseRowCells(lines[r]);
    if (rowValues.length === 0 || (rowValues.length === 1 && !rowValues[0])) continue;

    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = rowValues[idx] !== undefined ? rowValues[idx] : '';
    });
    records.push(record);
  }

  return records;
}

/**
 * Helper to match header column case-insensitively with fallback options
 */
function getColumnValue(row: Record<string, string>, possibleNames: string[]): string {
  const rowKeys = Object.keys(row);
  for (const name of possibleNames) {
    const matchedKey = rowKeys.find(
      k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === name.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    if (matchedKey && row[matchedKey] !== undefined) {
      return row[matchedKey].trim();
    }
  }
  return '';
}

export interface CSVImportSummary {
  teachersCount: number;
  teachersUpdatedCount: number;
  timetableCount: number;
  timetableUpdatedCount: number;
  freePeriodsSkipped: number;
  errors: string[];
  warnings: string[];
}

/**
 * Parses Teachers.csv and returns TeacherRecord list + validation errors
 */
export function processTeachersCSV(
  csvText: string,
  existingTeachersMap: Map<string, TeacherRecord> = new Map()
): {
  teachersMap: Map<string, TeacherRecord>;
  errors: string[];
  importedCount: number;
  updatedCount: number;
} {
  const records = parseCSV(csvText);
  const errors: string[] = [];
  const teachersMap = new Map<string, TeacherRecord>(existingTeachersMap);

  let importedCount = 0;
  let updatedCount = 0;

  records.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1
    const teacherId = getColumnValue(row, ['Teacher_ID', 'TeacherID', 'Teacher ID', 'EmployeeCode', 'ID']);
    const teacherName = getColumnValue(row, ['Teacher_Name', 'TeacherName', 'Teacher Name', 'Name', 'Teacher']);
    const designation = getColumnValue(row, ['Designation', 'Post', 'Designation_Name']);
    const school = getColumnValue(row, ['School', 'School_Name', 'KV', 'KV_Name']);

    if (!teacherId) {
      errors.push(`Teachers.csv Row ${rowNum}: Missing Teacher_ID (Employee Code). Skipped.`);
      return;
    }

    const key = teacherId.trim();
    const isExisting = teachersMap.has(key);

    const record: TeacherRecord = {
      teacherId: key,
      teacherName: teacherName || key,
      designation: designation || 'Teacher',
      school: school || 'Kendriya Vidyalaya',
      updatedAt: new Date().toISOString()
    };

    teachersMap.set(key, record);
    if (isExisting) {
      updatedCount++;
    } else {
      importedCount++;
    }
  });

  return {
    teachersMap,
    errors,
    importedCount,
    updatedCount
  };
}

/**
 * Normalizes day string to valid DayOfWeek
 */
function normalizeDay(dayStr: string): DayOfWeek {
  const norm = dayStr.trim().toLowerCase();
  if (norm.startsWith('mon')) return 'Monday';
  if (norm.startsWith('tue')) return 'Tuesday';
  if (norm.startsWith('wed')) return 'Wednesday';
  if (norm.startsWith('thu')) return 'Thursday';
  if (norm.startsWith('fri')) return 'Friday';
  if (norm.startsWith('sat')) return 'Saturday';
  return 'Monday';
}

/**
 * Normalizes period text e.g. "Period 1" or "1" -> 1
 */
function normalizePeriodNum(periodStr: string): number {
  const digits = periodStr.match(/\d+/);
  if (digits) {
    const num = parseInt(digits[0], 10);
    if (num >= 1 && num <= 9) return num;
  }
  return 1;
}

/**
 * Canonicalizes class name e.g. "VI" -> "VI-A", "6" -> "VI-A", "X" -> "X-A"
 */
export function canonicalizeClassName(clsStr: string): string {
  if (!clsStr || !clsStr.trim()) return '';
  let str = clsStr.trim().toUpperCase();
  if (str.includes('-')) return str;

  const romanMap: Record<string, string> = {
    '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V',
    '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X',
    '11': 'XI', '12': 'XII'
  };

  if (romanMap[str]) {
    str = romanMap[str];
  }

  return `${str}-A`;
}

export const CLASS_NUMERIC_RANK: Record<string, number> = {
  'BALVATIKA-1': 0.1,
  'BALVATIKA-2': 0.2,
  'BALVATIKA-3': 0.3,
  'BALVATIKA 1': 0.1,
  'BALVATIKA 2': 0.2,
  'BALVATIKA 3': 0.3,
  'BALVATIKA': 0.2,
  'NURSERY': 0.4,
  'LKG': 0.5,
  'UKG': 0.6,
  'KG': 0.6,
  'I': 1,
  '1': 1,
  'II': 2,
  '2': 2,
  'III': 3,
  '3': 3,
  'IV': 4,
  '4': 4,
  'V': 5,
  '5': 5,
  'VI': 6,
  '6': 6,
  'VII': 7,
  '7': 7,
  'VIII': 8,
  '8': 8,
  'IX': 9,
  '9': 9,
  'X': 10,
  '10': 10,
  'XI': 11,
  '11': 11,
  'XII': 12,
  '12': 12,
};

/**
 * Returns numeric grade rank (1..12, etc.) and section for accurate pedagogical sorting
 */
export function getClassSortRank(classInput: string): { gradeRank: number; section: string } {
  if (!classInput) return { gradeRank: 999, section: '' };
  
  let str = String(classInput).trim().toUpperCase();
  str = str.replace(/^(CLASS|STD|GRADE)\s*/i, '').trim();

  // Extract Section letter (e.g. "-A", " A", " SEC A", "(A)")
  let section = 'A';
  const secMatch = str.match(/[-_\s/()]+([A-Z])$/i) || str.match(/([I|V|X|0-9]+)\s*([A-Z])$/i);
  if (secMatch) {
    section = secMatch[secMatch.length - 1].toUpperCase();
  }

  // Check early childhood / Balvatika
  if (str.startsWith('BALVATIKA-1') || str.startsWith('BALVATIKA 1')) return { gradeRank: 0.1, section };
  if (str.startsWith('BALVATIKA-2') || str.startsWith('BALVATIKA 2')) return { gradeRank: 0.2, section };
  if (str.startsWith('BALVATIKA-3') || str.startsWith('BALVATIKA 3')) return { gradeRank: 0.3, section };
  if (str.startsWith('NURSERY')) return { gradeRank: 0.4, section };
  if (str.startsWith('LKG')) return { gradeRank: 0.5, section };
  if (str.startsWith('UKG') || str.startsWith('KG')) return { gradeRank: 0.6, section };

  // Match Roman or Arabic numeral at beginning
  // Order matters: match XII, XI, VIII, VII, VI, IX, X, IV, V, III, II, I, or \d+
  const numMatch = str.match(/^(XII|XI|VIII|VII|VI|IX|X|IV|V|III|II|I|\d+)/i);
  if (numMatch) {
    const token = numMatch[1].toUpperCase();
    const rank = CLASS_NUMERIC_RANK[token] !== undefined ? CLASS_NUMERIC_RANK[token] : parseInt(token, 10) || 999;
    return { gradeRank: rank, section };
  }

  return { gradeRank: 999, section: str };
}

/**
 * Accurately compares two class strings by pedagogical grade level (I..XII) and section
 */
export function compareClassGrades(classA: string, classB: string, sortOrder: 'asc' | 'desc' = 'asc'): number {
  const rankA = getClassSortRank(classA);
  const rankB = getClassSortRank(classB);

  if (rankA.gradeRank !== rankB.gradeRank) {
    return sortOrder === 'asc' 
      ? rankA.gradeRank - rankB.gradeRank 
      : rankB.gradeRank - rankA.gradeRank;
  }

  const secComp = (rankA.section || '').localeCompare(rankB.section || '');
  return sortOrder === 'asc' ? secComp : -secComp;
}

/**
 * Parses Timetable.csv and returns TimetableSlot list + validation summary
 */
export function processTimetableCSV(
  csvText: string,
  teachersMap: Map<string, TeacherRecord>,
  existingSlotsMap: Map<string, TimetableSlot> = new Map()
): {
  slotsMap: Map<string, TimetableSlot>;
  errors: string[];
  warnings: string[];
  importedCount: number;
  updatedCount: number;
  freePeriodsSkipped: number;
} {
  const records = parseCSV(csvText);
  const errors: string[] = [];
  const warnings: string[] = [];
  const slotsMap = new Map<string, TimetableSlot>(existingSlotsMap);

  let importedCount = 0;
  let updatedCount = 0;
  let freePeriodsSkipped = 0;

  records.forEach((row, index) => {
    const rowNum = index + 2;
    const teacherId = getColumnValue(row, ['Teacher_ID', 'TeacherID', 'Teacher ID', 'EmployeeCode', 'ID']);
    const rowTeacherName = getColumnValue(row, ['Teacher_Name', 'TeacherName', 'Teacher Name', 'Name']);
    const dayStr = getColumnValue(row, ['Day', 'Day_Of_Week', 'DayOfWeek']);
    const periodStr = getColumnValue(row, ['Period', 'Period_No', 'PeriodNo']);
    const timeSlot = getColumnValue(row, ['Time_Slot', 'TimeSlot', 'Time', 'Timing']);
    const subject = getColumnValue(row, ['Subject', 'Subject_Name', 'SubjectName']);
    const classGrade = getColumnValue(row, ['Class_Grade', 'ClassGrade', 'Class', 'Grade', 'Section']);

    if (!teacherId) {
      errors.push(`Timetable.csv Row ${rowNum}: Missing Teacher_ID. Skipped.`);
      return;
    }

    const tKey = teacherId.trim();
    const teacherRecord = teachersMap.get(tKey);

    if (!teacherRecord) {
      warnings.push(`Timetable.csv Row ${rowNum}: Teacher_ID "${tKey}" (${rowTeacherName || 'Unknown'}) was not found in Teachers.csv.`);
    }

    const resolvedTeacherName = teacherRecord ? teacherRecord.teacherName : (rowTeacherName || tKey);

    // Skip creating a period entry if both Subject and Class_Grade are blank
    if (!subject.trim() && !classGrade.trim()) {
      freePeriodsSkipped++;
      // If an existing slot for this teacher, day, period exists, remove it
      const dayVal = normalizeDay(dayStr);
      const periodNum = normalizePeriodNum(periodStr);
      const slotKey = `${tKey}-${dayVal}-${periodNum}`;
      slotsMap.delete(slotKey);
      return;
    }

    const dayVal = normalizeDay(dayStr);
    const periodNum = normalizePeriodNum(periodStr);
    const canonicalClass = canonicalizeClassName(classGrade) || 'VI-A';
    const slotKey = `${tKey}-${dayVal}-${periodNum}`;

    const isExisting = slotsMap.has(slotKey);

    const slot: TimetableSlot = {
      id: `tt-${tKey.replace(/[^a-zA-Z0-9]/g, '')}-${dayVal.slice(0, 3)}-p${periodNum}`,
      day: dayVal,
      period: periodNum,
      className: canonicalClass,
      subjectName: subject.trim() || 'General',
      roomNo: 'Room 24',
      teacherId: tKey,
      teacherName: resolvedTeacherName,
      timeSlot: timeSlot.trim() || '07:50 - 08:30'
    };

    slotsMap.set(slotKey, slot);

    if (isExisting) {
      updatedCount++;
    } else {
      importedCount++;
    }
  });

  return {
    slotsMap,
    errors,
    warnings,
    importedCount,
    updatedCount,
    freePeriodsSkipped
  };
}

/**
 * Normalizes class strings e.g. "3" -> "III", "Class 3" -> "III"
 */
export function normalizeClass(rawClass: any, defaultClass: string = 'X'): string {
  if (!rawClass && rawClass !== 0) return defaultClass;
  const str = String(rawClass).trim().toUpperCase();
  const romanMap: Record<string, string> = {
    '1': 'I', '01': 'I', 'CLASS 1': 'I', 'CLASS I': 'I', 'GRADE 1': 'I',
    '2': 'II', '02': 'II', 'CLASS 2': 'II', 'CLASS II': 'II', 'GRADE 2': 'II',
    '3': 'III', '03': 'III', 'CLASS 3': 'III', 'CLASS III': 'III', 'GRADE 3': 'III',
    '4': 'IV', '04': 'IV', 'CLASS 4': 'IV', 'CLASS IV': 'IV', 'GRADE 4': 'IV',
    '5': 'V', '05': 'V', 'CLASS 5': 'V', 'CLASS V': 'V', 'GRADE 5': 'V',
    '6': 'VI', '06': 'VI', 'CLASS 6': 'VI', 'CLASS VI': 'VI', 'GRADE 6': 'VI',
    '7': 'VII', '07': 'VII', 'CLASS 7': 'VII', 'CLASS VII': 'VII', 'GRADE 7': 'VII',
    '8': 'VIII', '08': 'VIII', 'CLASS 8': 'VIII', 'CLASS VIII': 'VIII', 'GRADE 8': 'VIII',
    '9': 'IX', '09': 'IX', 'CLASS 9': 'IX', 'CLASS IX': 'IX', 'GRADE 9': 'IX',
    '10': 'X', 'CLASS 10': 'X', 'CLASS X': 'X', 'GRADE 10': 'X',
    '11': 'XI', 'CLASS 11': 'XI', 'CLASS XI': 'XI', 'GRADE 11': 'XI',
    '12': 'XII', 'CLASS 12': 'XII', 'CLASS XII': 'XII', 'GRADE 12': 'XII'
  };
  return romanMap[str] || str || defaultClass;
}

/**
 * Extracts unit number, unit title, chapter number, and chapter title from combined text or individual fields.
 */
export function extractUnitAndChapter(
  rawUnitChapter: string,
  rawUnitNo?: string,
  rawUnitTitle?: string,
  rawChapterNo?: string,
  rawChapterTitle?: string,
  idx: number = 0
): { unitNo: string; unitTitle: string; chapterNo: string; chapterTitle: string } {
  let uNo = (rawUnitNo || '').trim();
  let uTitle = (rawUnitTitle || '').trim();
  let cNo = (rawChapterNo || '').trim();
  let cTitle = (rawChapterTitle || '').trim();

  // If explicit chapter title is provided and valid, use explicit fields
  if (cTitle && cTitle !== 'General Topic' && cTitle !== 'Chapter Title' && cTitle.toLowerCase() !== 'undefined') {
    return {
      unitNo: uNo,
      unitTitle: uTitle,
      chapterNo: cNo,
      chapterTitle: cTitle
    };
  }

  const rawStr = (rawUnitChapter || uTitle || cTitle || '').trim();
  if (!rawStr) {
    return {
      unitNo: uNo,
      unitTitle: uTitle,
      chapterNo: cNo,
      chapterTitle: `Topic ${idx + 1}`
    };
  }

  const lines = rawStr.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let detectedUnitNo = uNo;
  let detectedUnitTitle = uTitle;
  let detectedChapterNo = cNo;
  let detectedChapterTitle = '';

  // Case 1: Unit Header e.g. "Unit 1:" or "Unit 1" or "Unit-1" or "इकाई 1"
  const firstLine = lines[0] || '';
  const unitHeaderMatch = firstLine.match(/^(unit\s*[\d\w]+|इकाई\s*[\d\w]+)[\s:\-–—]*(.*)$/i);

  if (unitHeaderMatch) {
    detectedUnitNo = unitHeaderMatch[1].replace(/इकाई/i, 'Unit').trim();
    const restOfFirstLine = unitHeaderMatch[2].trim();

    const remainingLines = restOfFirstLine ? [restOfFirstLine, ...lines.slice(1)] : lines.slice(1);

    if (remainingLines.length > 0) {
      detectedUnitTitle = remainingLines[0];
      if (remainingLines.length > 1) {
        detectedChapterTitle = remainingLines.slice(1).join('\n');
      } else {
        detectedChapterTitle = remainingLines[0];
      }
    } else {
      detectedUnitTitle = detectedUnitNo;
      detectedChapterTitle = detectedUnitNo;
    }

    return {
      unitNo: detectedUnitNo,
      unitTitle: detectedUnitTitle,
      chapterNo: detectedChapterNo,
      chapterTitle: detectedChapterTitle || rawStr
    };
  }

  // Case 2: Sanskrit or Hindi chapter heading e.g. "प्रथमः पाठः – वयं वर्णमालां पठामः;"
  const sanskritMatch = rawStr.match(/^([\u0900-\u097F\w]+\s*(?:पाठः|पाठ|अध्याय)[\s:\-–—]*)([\s\S]*)$/i);
  if (sanskritMatch) {
    detectedChapterNo = sanskritMatch[1].trim();
    detectedChapterTitle = sanskritMatch[2].trim() || rawStr;
    return {
      unitNo: detectedUnitNo,
      unitTitle: detectedUnitTitle,
      chapterNo: detectedChapterNo,
      chapterTitle: detectedChapterTitle
    };
  }

  // Case 3: Preserving full raw text with original linebreaks intact
  return {
    unitNo: detectedUnitNo,
    unitTitle: detectedUnitTitle,
    chapterNo: detectedChapterNo,
    chapterTitle: rawStr
  };
}

/**
 * Parse split-up syllabus CSV into SyllabusItem array
 */
export function parseSyllabusCSV(text: string, defaultClass: string = 'X', defaultSubject: string = 'Mathematics'): SyllabusItem[] {
  const records = parseCSV(text);
  if (!records || records.length === 0) return [];

  return records.map((row, idx) => {
    const rawClass = getColumnValue(row, ['className', 'class', 'class_name', 'grade', 'standard']) || defaultClass;
    const className = normalizeClass(rawClass, defaultClass);

    const rawSubject = getColumnValue(row, ['subjectName', 'subject', 'subject_name', 'course']) || defaultSubject;
    const subjectName = rawSubject === 'Maths' ? 'Mathematics' : rawSubject;

    const month = getColumnValue(row, ['month', 'teaching_month', 'target_month']) || 'April';

    const rawUnitChapter = getColumnValue(row, [
      'unit_chapter',
      'unitChapter',
      'unit_and_chapter',
      'unitAndChapter',
      'chapter_unit'
    ]);
    const rawUnitNo = getColumnValue(row, ['unitNo', 'unit_no', 'unit', 'unit_number']);
    const rawUnitTitle = getColumnValue(row, ['unitTitle', 'unit_title', 'unit_name']);
    const rawChapterNo = getColumnValue(row, ['chapterNo', 'chapter_no', 'chapter', 'chapter_number']);
    const rawChapterTitle = getColumnValue(row, ['chapterTitle', 'chapter_title', 'chapter_name', 'topic']);

    const { unitNo, unitTitle, chapterNo, chapterTitle } = extractUnitAndChapter(
      rawUnitChapter,
      rawUnitNo,
      rawUnitTitle,
      rawChapterNo,
      rawChapterTitle,
      idx
    );

    const teachingTarget = getColumnValue(row, [
      'teaching_target_competencies',
      'teachingTargetCompetencies',
      'teaching_target',
      'teachingTarget',
      'competencies',
      'ncert_target',
      'topics_covered',
      'teaching_aids',
      'learning_outcomes',
      'target'
    ]) || '';

    const rawDaysPeriods = getColumnValue(row, [
      'days_periods',
      'daysPeriods',
      'days_and_periods',
      'workingDaysRequired',
      'working_days',
      'periodsRequired',
      'periods',
      'no_of_periods'
    ]);

    let workingDaysRequired = 8;
    let periodsRequired = 10;

    if (rawDaysPeriods) {
      const digits = rawDaysPeriods.match(/\d+/g);
      if (digits && digits.length >= 2) {
        workingDaysRequired = Number(digits[0]) || 8;
        periodsRequired = Number(digits[1]) || 10;
      } else if (digits && digits.length === 1) {
        periodsRequired = Number(digits[0]) || 10;
        workingDaysRequired = Math.max(1, Math.round(periodsRequired / 3));
      }
    }

    const specificRev = getColumnValue(row, ['revisionPlan', 'revision_plan', 'revision']);
    const specificExam = getColumnValue(row, ['examinationPlan', 'examination_plan', 'exam_plan', 'examPlan', 'exam']);
    const rawRevExam = getColumnValue(row, [
      'revision_exam_plan',
      'revisionExamPlan',
      'revision_and_exam_plan',
      'revision_and_examination_plan'
    ]) || '';

    let revisionPlan = specificRev;
    let examinationPlan = specificExam;

    if (!revisionPlan && !examinationPlan && rawRevExam) {
      revisionPlan = rawRevExam;
      examinationPlan = '';
    } else if (revisionPlan && examinationPlan && revisionPlan.trim() === examinationPlan.trim()) {
      examinationPlan = '';
    }

    const projectWork = getColumnValue(row, ['projectWork', 'project_work', 'project']) || '';
    const practicalWork = getColumnValue(row, ['practicalWork', 'practical_work', 'practical', 'lab_work']) || '';
    const rawStatus = getColumnValue(row, ['completionStatus', 'completion_status', 'status']);
    const validStatuses: SyllabusStatus[] = ['Completed', 'In Progress', 'Planned', 'Pending'];
    const completionStatus: SyllabusStatus = validStatuses.includes(rawStatus as SyllabusStatus) ? (rawStatus as SyllabusStatus) : 'Planned';

    const sourcePage = getColumnValue(row, ['source_page', 'sourcePage', 'page']);

    return {
      id: `csv-syl-${Date.now()}-${idx}`,
      className,
      section: getColumnValue(row, ['section']) || 'A',
      subjectName,
      month,
      unitNo,
      unitTitle,
      chapterNo,
      chapterTitle,
      teachingTarget,
      workingDaysRequired,
      periodsRequired,
      revisionPlan,
      examinationPlan,
      projectWork,
      practicalWork,
      completionStatus,
      targetCompletionDate: getColumnValue(row, ['targetCompletionDate', 'target_date']) || '',
      actualCompletionDate: getColumnValue(row, ['actualCompletionDate', 'actual_date']) || '',
      remarks: getColumnValue(row, ['remarks', 'notes']) || (sourcePage ? `Page ${sourcePage} from CSV` : 'Imported from CSV syllabus'),
      templatePageRef: Number(sourcePage) || 18
    };
  });
}

/**
 * Parse split-up syllabus JSON into SyllabusItem array
 */
export function parseSyllabusJSON(text: string, defaultClass: string = 'X', defaultSubject: string = 'Mathematics'): SyllabusItem[] {
  let obj: any;
  try {
    obj = JSON.parse(text);
  } catch {
    return [];
  }
  const topClass = obj && typeof obj === 'object' && !Array.isArray(obj)
    ? (obj.className || obj.class || obj.grade || obj.standard || obj.class_name || '')
    : '';
  const topSubject = obj && typeof obj === 'object' && !Array.isArray(obj)
    ? (obj.subjectName || obj.subject || obj.course || obj.subject_name || '')
    : '';

  const rawArray = Array.isArray(obj) ? obj : (obj.items || obj.syllabus || obj.data || obj.chapters || obj.split_up || obj.splitUp || []);
  if (!Array.isArray(rawArray) || rawArray.length === 0) return [];

  const validStatuses: SyllabusStatus[] = ['Completed', 'In Progress', 'Planned', 'Pending'];

  return rawArray.map((item: any, idx: number) => {
    const rawClass = item.className || item.class || item.grade || item.standard || item.class_name || topClass || defaultClass;
    const className = normalizeClass(rawClass, defaultClass);

    const rawSubject = item.subjectName || item.subject || item.course || item.subject_name || topSubject || defaultSubject;
    const subjectName = rawSubject === 'Maths' ? 'Mathematics' : rawSubject;

    const month = item.month || item.teaching_month || item.target_month || 'April';

    const rawUnitChapter = item.unit_chapter || item.unitChapter || item.unit_and_chapter || item.unitAndChapter || item.chapter_unit || '';
    const rawUnitNo = item.unitNo || item.unit_no || item.unit || '';
    const rawUnitTitle = item.unitTitle || item.unit_title || item.unit_name || '';
    const rawChapterNo = item.chapterNo || item.chapter_no || item.chapter || '';
    const rawChapterTitle = item.chapterTitle || item.chapter_title || item.topic || '';

    const { unitNo, unitTitle, chapterNo, chapterTitle } = extractUnitAndChapter(
      rawUnitChapter,
      rawUnitNo,
      rawUnitTitle,
      rawChapterNo,
      rawChapterTitle,
      idx
    );

    const teachingTarget =
      item.teaching_target_competencies ||
      item.teachingTargetCompetencies ||
      item.teaching_target ||
      item.teachingTarget ||
      item.competencies ||
      item.ncert_target ||
      item.topics_covered ||
      item.teaching_aids ||
      item.learning_outcomes ||
      item.target ||
      '';

    const rawDaysPeriods = item.days_periods || item.daysPeriods || item.days_and_periods || item.workingDaysRequired || item.working_days || item.periodsRequired || item.periods || '';
    let workingDaysRequired = 8;
    let periodsRequired = 10;

    if (typeof rawDaysPeriods === 'number') {
      periodsRequired = rawDaysPeriods;
      workingDaysRequired = Math.max(1, Math.round(rawDaysPeriods / 3));
    } else if (typeof rawDaysPeriods === 'string' && rawDaysPeriods.trim()) {
      const digits = rawDaysPeriods.match(/\d+/g);
      if (digits && digits.length >= 2) {
        workingDaysRequired = Number(digits[0]) || 8;
        periodsRequired = Number(digits[1]) || 10;
      } else if (digits && digits.length === 1) {
        periodsRequired = Number(digits[0]) || 10;
        workingDaysRequired = Math.max(1, Math.round(periodsRequired / 3));
      }
    }

    const specificRev = item.revisionPlan || item.revision_plan || item.revision || '';
    const specificExam = item.examinationPlan || item.examination_plan || item.exam_plan || item.examPlan || item.exam || '';
    const rawRevExam =
      item.revision_exam_plan ||
      item.revisionExamPlan ||
      item.revision_and_exam_plan ||
      item.revision_and_examination_plan ||
      '';

    let revisionPlan = specificRev;
    let examinationPlan = specificExam;

    if (!revisionPlan && !examinationPlan && rawRevExam) {
      revisionPlan = rawRevExam;
      examinationPlan = '';
    } else if (revisionPlan && examinationPlan && revisionPlan.trim() === examinationPlan.trim()) {
      examinationPlan = '';
    }

    const projectWork = item.projectWork || item.project_work || item.project || '';
    const practicalWork = item.practicalWork || item.practical_work || item.practical || item.lab_work || '';

    const rawStatus = item.completionStatus || item.completion_status || item.status || 'Planned';
    const completionStatus: SyllabusStatus = validStatuses.includes(rawStatus as SyllabusStatus) ? (rawStatus as SyllabusStatus) : 'Planned';

    const sourcePage = item.source_page || item.sourcePage || item.templatePageRef;

    return {
      id: `json-syl-${Date.now()}-${idx}`,
      className,
      section: item.section || 'A',
      subjectName,
      month,
      unitNo,
      unitTitle,
      chapterNo,
      chapterTitle,
      teachingTarget,
      workingDaysRequired,
      periodsRequired,
      revisionPlan,
      examinationPlan,
      projectWork,
      practicalWork,
      completionStatus,
      targetCompletionDate: item.targetCompletionDate || item.target_date || '',
      actualCompletionDate: item.actualCompletionDate || item.actual_date || '',
      remarks: item.remarks || (sourcePage ? `Page ${sourcePage} from JSON syllabus` : 'Imported from JSON syllabus'),
      templatePageRef: Number(sourcePage) || 18
    };
  });
}

