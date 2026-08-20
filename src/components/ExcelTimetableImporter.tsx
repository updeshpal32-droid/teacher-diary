import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { TimetableSlot, DayOfWeek, TeacherRecord } from '../types/academic';
import {
  processTeachersCSV,
  processTimetableCSV,
  parseCSV
} from '../utils/csvParser';
import {
  SAMPLE_TEACHERS_CSV,
  SAMPLE_TIMETABLE_CSV
} from '../data/sampleKvsCsvData';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  Layers,
  ArrowRight,
  Filter,
  Users,
  Check,
  RefreshCw,
  HelpCircle,
  Sparkles,
  FileType,
  UserCheck,
  FileCode,
  Info
} from 'lucide-react';

interface ExcelTimetableImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (
    importedSlots: TimetableSlot[],
    replaceMode: boolean,
    importedTeachers?: TeacherRecord[]
  ) => void;
}

const DAYS_LIST: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to normalize day string
const normalizeDay = (val: string): DayOfWeek | null => {
  if (!val) return null;
  const s = String(val).trim().toUpperCase();
  if (s.startsWith('MON')) return 'Monday';
  if (s.startsWith('TUE')) return 'Tuesday';
  if (s.startsWith('WED')) return 'Wednesday';
  if (s.startsWith('THU')) return 'Thursday';
  if (s.startsWith('FRI')) return 'Friday';
  if (s.startsWith('SAT')) return 'Saturday';
  return null;
};

// Helper to normalize period number
const normalizePeriod = (val: any): number | null => {
  if (val === null || val === undefined) return null;
  const s = String(val).trim().toUpperCase();
  const digits = s.match(/\d+/);
  if (digits) {
    const num = parseInt(digits[0], 10);
    if (num >= 1 && num <= 9) return num;
  }
  return null;
};

const ROMAN_MAP: Record<string, string> = {
  '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', '6': 'VI',
  '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X', '11': 'XI', '12': 'XII'
};

// Helper to canonicalize any raw class string to standard format (e.g., VI-A, X-A)
export const canonicalizeClassName = (val: string): string => {
  if (!val) return 'X-A';
  let str = String(val).trim().toUpperCase();

  // Strip common prefixes and title words
  str = str.replace(/^TIMETABLE\s+(FOR\s+)?/i, '');
  str = str.replace(/^(CLASS|STD|GRADE|SEC|SECTION)\s*/i, '');
  str = str.replace(/\s+TIMETABLE$/i, '');
  str = str.replace(/\s+SCHEDULE$/i, '');
  str = str.replace(/\s+CLASS$/i, '');
  str = str.trim();

  if (!str) return 'X-A';

  // Extract Section letter if present (e.g., "-A", " A", " SEC A", "(A)")
  let section = 'A';
  const secMatch = str.match(/[-_\s/()]+([A-Z])$/i) || str.match(/([I|V|X|0-9]+)\s*([A-Z])$/i);
  if (secMatch) {
    section = secMatch[secMatch.length - 1].toUpperCase();
  }

  // Extract class number or roman numeral (1..12 or I..XII)
  const numMatch = str.match(/^(XII|XI|IX|X|VIII|VII|VI|IV|V|III|II|I|\d+)/i);
  if (numMatch) {
    let token = numMatch[1].toUpperCase();
    if (ROMAN_MAP[token]) {
      token = ROMAN_MAP[token];
    }
    return `${token}-${section}`;
  }

  return str.replace(/\s+/g, '-').toUpperCase();
};

export const ExcelTimetableImporter: React.FC<ExcelTimetableImporterProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [activeImportTab, setActiveImportTab] = useState<'csv' | 'excel'>('csv');

  // CSV Mode State
  const [teachersCsvText, setTeachersCsvText] = useState<string>('');
  const [timetableCsvText, setTimetableCsvText] = useState<string>('');
  const [teachersFileName, setTeachersFileName] = useState<string>('');
  const [timetableFileName, setTimetableFileName] = useState<string>('');

  const [csvSummary, setCsvSummary] = useState<{
    teachersMap: Map<string, TeacherRecord>;
    slotsMap: Map<string, TimetableSlot>;
    teachersCount: number;
    teachersUpdatedCount: number;
    timetableCount: number;
    timetableUpdatedCount: number;
    freePeriodsSkipped: number;
    errors: string[];
    warnings: string[];
  } | null>(null);

  const teachersFileInputRef = useRef<HTMLInputElement>(null);
  const timetableFileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedSlots, setExtractedSlots] = useState<TimetableSlot[]>([]);
  const [detectedClasses, setDetectedClasses] = useState<string[]>([]);
  const [detectedTeachers, setDetectedTeachers] = useState<string[]>([]);
  const [replaceMode, setReplaceMode] = useState<boolean>(true);
  const [previewFilterClass, setPreviewFilterClass] = useState<string>('ALL');
  const [previewFilterTeacher, setPreviewFilterTeacher] = useState<string>('ALL');
  const [selectedSheetNames, setSelectedSheetNames] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const runCsvProcess = (tText: string, ttText: string) => {
    if (!tText && !ttText) {
      setCsvSummary(null);
      return;
    }

    const tRes = processTeachersCSV(tText);
    const ttRes = processTimetableCSV(ttText, tRes.teachersMap);

    setCsvSummary({
      teachersMap: tRes.teachersMap,
      slotsMap: ttRes.slotsMap,
      teachersCount: tRes.importedCount,
      teachersUpdatedCount: tRes.updatedCount,
      timetableCount: ttRes.importedCount,
      timetableUpdatedCount: ttRes.updatedCount,
      freePeriodsSkipped: ttRes.freePeriodsSkipped,
      errors: [...tRes.errors, ...ttRes.errors],
      warnings: ttRes.warnings
    });
  };

  const handleTeachersFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setTeachersFileName(f.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setTeachersCsvText(text);
        runCsvProcess(text, timetableCsvText);
      };
      reader.readAsText(f);
    }
  };

  const handleTimetableFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setTimetableFileName(f.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setTimetableCsvText(text);
        runCsvProcess(teachersCsvText, text);
      };
      reader.readAsText(f);
    }
  };

  const handleLoadSampleCsvData = () => {
    setTeachersFileName('Teachers.csv (Sample KV KUTRA)');
    setTimetableFileName('Timetable.csv (Sample KV KUTRA)');
    setTeachersCsvText(SAMPLE_TEACHERS_CSV);
    setTimetableCsvText(SAMPLE_TIMETABLE_CSV);
    runCsvProcess(SAMPLE_TEACHERS_CSV, SAMPLE_TIMETABLE_CSV);
  };

  const handleDownloadSampleCsv = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyCsvImport = () => {
    if (!csvSummary) return;
    const slots = Array.from(csvSummary.slotsMap.values());
    const teachers = Array.from(csvSummary.teachersMap.values());
    onImportSuccess(slots, replaceMode, teachers);
    onClose();
  };

  // Download Sample KVS Excel Template
  const handleDownloadSample = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Matrix Grid for Class X-A
      const classXData = [
        ['KENDRIYA VIDYALAYA SANGATHAN - CLASS X-A TIMETABLE'],
        ['Day / Period', 'Period 1 (08:00-08:40)', 'Period 2 (08:40-09:20)', 'Period 3 (09:20-10:00)', 'Period 4 (10:00-10:40)', 'Period 5 (11:00-11:40)', 'Period 6 (11:40-12:20)', 'Period 7 (12:20-01:00)', 'Period 8 (01:00-01:40)', 'Period 9 (02:00-02:45)'],
        ['Monday', 'Mathematics (R24)', 'Science (Lab 1)', 'English (R24)', 'Hindi (R24)', 'Social Science (R24)', 'Computer Science (Lab 2)', 'Physical Education (Ground)', 'Library (Lib)', 'Remedial Maths'],
        ['Tuesday', 'Science (Lab 1)', 'Mathematics (R24)', 'Social Science (R24)', 'English (R24)', 'Hindi (R24)', 'Artificial Intelligence (Lab 2)', 'Music/Art (R24)', 'Value Education', 'Extra Coaching'],
        ['Wednesday', 'English (R24)', 'Social Science (R24)', 'Mathematics (R24)', 'Science (Lab 1)', 'Sanskrit/Third Lang', 'Physics (Lab 3)', 'Chemistry (Lab 1)', 'Sports/PE', 'Slow Learners Drill'],
        ['Thursday', 'Mathematics (R24)', 'English (R24)', 'Science (Lab 1)', 'Social Science (R24)', 'Hindi (R24)', 'Computer Science', 'Work Experience (R24)', 'Self Study', 'Board Exam Practice'],
        ['Friday', 'Social Science (R24)', 'Mathematics (R24)', 'English (R24)', 'Science (Lab 1)', 'Hindi (R24)', 'Mathematics Practical', 'Library', 'CCA Activity', 'Remedial Science'],
        ['Saturday', 'Mathematics (R24)', 'Science (Lab 1)', 'Social Science (R24)', 'English (R24)', 'Youth Parliament', 'House Meeting', 'SCOUT / GUIDE', 'Club Activity', 'Extra Time']
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(classXData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Class X-A');

      // Sheet 2: Matrix Grid for Class IX-B
      const classIXData = [
        ['KENDRIYA VIDYALAYA SANGATHAN - CLASS IX-B TIMETABLE'],
        ['Day / Period', 'Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8', 'Period 9'],
        ['Monday', 'English (R18)', 'Mathematics (R18)', 'Science (R18)', 'Hindi (R18)', 'Social Science', 'PE', 'Music', 'Library', 'Remedial English'],
        ['Tuesday', 'Mathematics (R18)', 'Science (R18)', 'English (R18)', 'Social Science', 'Hindi (R18)', 'Computer', 'Art', 'PE', 'Slow Learners Drill'],
        ['Wednesday', 'Science (R18)', 'Hindi (R18)', 'Mathematics (R18)', 'English (R18)', 'Social Science', 'Science Lab', 'Work Experience', 'Games', 'Remedial Maths'],
        ['Thursday', 'Hindi (R18)', 'Social Science', 'Science (R18)', 'Mathematics (R18)', 'English (R18)', 'Library', 'Yoga', 'Self Study', 'Extra Class'],
        ['Friday', 'Social Science', 'Mathematics (R18)', 'English (R18)', 'Science (R18)', 'Hindi (R18)', 'PE', 'CCA', 'Club', 'Remedial Science'],
        ['Saturday', 'Mathematics (R18)', 'Science (R18)', 'Social Science', 'English (R18)', 'Co-Curricular', 'Sports', 'Guide/Scout', 'Cleanliness', 'Extra Practice']
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(classIXData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Class IX-B');

      // Sheet 3: Tabular List Format (All Classes)
      const listData = [
        ['Class', 'Day', 'Period', 'Subject', 'Teacher', 'Room'],
        ['VI-A', 'Monday', 1, 'Mathematics', 'Mr. R. K. Sharma', 'Room 12'],
        ['VI-A', 'Monday', 2, 'Science', 'Dr. Sunita Rao', 'Room 12'],
        ['VI-A', 'Monday', 3, 'English', 'Mrs. Priya Singh', 'Room 12'],
        ['VII-A', 'Monday', 1, 'Science', 'Dr. Sunita Rao', 'Room 14'],
        ['VII-A', 'Monday', 2, 'Mathematics', 'Mr. R. K. Sharma', 'Room 14'],
        ['VIII-A', 'Monday', 1, 'English', 'Mrs. Priya Singh', 'Room 16'],
        ['VIII-A', 'Monday', 2, 'Social Science', 'Mr. Amit Verma', 'Room 16'],
        ['XI-A', 'Monday', 1, 'Physics', 'Dr. A. K. Gupta', 'Physics Lab'],
        ['XI-A', 'Monday', 2, 'Chemistry', 'Mrs. Meenakshi Sundaram', 'Chem Lab'],
        ['XII-A', 'Monday', 1, 'Mathematics', 'Mr. R. K. Sharma', 'Room 30'],
        ['XII-A', 'Monday', 2, 'Physics', 'Dr. A. K. Gupta', 'Room 30']
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(listData);
      XLSX.utils.book_append_sheet(wb, ws3, 'All Classes Master List');

      // Sheet 4: Matrix Grid for Teacher (Mr. R. K. Sharma)
      const teacherData = [
        ['TEACHER TIMETABLE - MR. R. K. SHARMA (PGT MATHEMATICS)'],
        ['Day / Period', 'Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8', 'Period 9'],
        ['Monday', 'VI-A (Maths)', 'FREE', 'VII-A (Maths)', 'XII-A (Maths)', 'FREE', 'X-A (Maths)', 'FREE', 'FREE', 'Remedial XI-A'],
        ['Tuesday', 'XII-A (Maths)', 'VI-A (Maths)', 'FREE', 'VII-A (Maths)', 'X-A (Maths)', 'FREE', 'FREE', 'FREE', 'Extra Coaching'],
        ['Wednesday', 'FREE', 'XII-A (Maths)', 'VI-A (Maths)', 'X-A (Maths)', 'FREE', 'VII-A (Maths)', 'FREE', 'FREE', 'Slow Learners'],
        ['Thursday', 'VI-A (Maths)', 'FREE', 'XII-A (Maths)', 'X-A (Maths)', 'VII-A (Maths)', 'FREE', 'FREE', 'FREE', 'Board Exam Practice'],
        ['Friday', 'FREE', 'VI-A (Maths)', 'X-A (Maths)', 'FREE', 'XII-A (Maths)', 'VII-A (Maths)', 'FREE', 'CCA', 'Remedial Maths'],
        ['Saturday', 'VI-A (Maths)', 'FREE', 'XII-A (Maths)', 'X-A (Maths)', 'FREE', 'House Duty', 'Scout', 'FREE', 'Extra Time']
      ];
      const ws4 = XLSX.utils.aoa_to_sheet(teacherData);
      XLSX.utils.book_append_sheet(wb, ws4, 'Teacher - Mr. R. K. Sharma');

      // Sheet 5: Tabular List Format for Teachers
      const teacherListData = [
        ['Teacher', 'Day', 'Period', 'Class', 'Subject', 'Room'],
        ['Mr. R. K. Sharma', 'Monday', 1, 'VI-A', 'Mathematics', 'Room 12'],
        ['Mr. R. K. Sharma', 'Monday', 3, 'VII-A', 'Mathematics', 'Room 14'],
        ['Mr. R. K. Sharma', 'Monday', 4, 'XII-A', 'Mathematics', 'Room 30'],
        ['Dr. Sunita Rao', 'Monday', 1, 'VII-A', 'Science', 'Room 14'],
        ['Dr. Sunita Rao', 'Monday', 2, 'VI-A', 'Science', 'Room 12'],
        ['Mrs. Priya Singh', 'Monday', 1, 'VIII-A', 'English', 'Room 16'],
        ['Mrs. Priya Singh', 'Monday', 3, 'VI-A', 'English', 'Room 12'],
        ['Mr. Amit Verma', 'Monday', 2, 'VIII-A', 'Social Science', 'Room 16'],
        ['Dr. A. K. Gupta', 'Monday', 1, 'XI-A', 'Physics', 'Physics Lab'],
        ['Dr. A. K. Gupta', 'Monday', 2, 'XII-A', 'Physics', 'Room 30']
      ];
      const ws5 = XLSX.utils.aoa_to_sheet(teacherListData);
      XLSX.utils.book_append_sheet(wb, ws5, 'All Teachers Master List');

      XLSX.writeFile(wb, 'KVS_School_Weekly_Timetable_Template.xlsx');
    } catch (err) {
      console.error('Failed to generate template XLSX', err);
    }
  };

  // Process and parse Excel File
  const processExcelFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setErrorMsg(null);
    setExtractedSlots([]);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('The uploaded Excel workbook contains no worksheets.');
      }

      setSelectedSheetNames(workbook.SheetNames);

      const allParsedSlots: TimetableSlot[] = [];
      const classSet = new Set<string>();
      const teacherSet = new Set<string>();

      // Loop through each sheet in workbook
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) return;

        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (!jsonData || jsonData.length === 0) return;

        // Check if sheet name indicates a specific teacher e.g. "Mr. R. K. Sharma" or "Teacher - Sunita Rao"
        let sheetTeacherName = '';
        if (sheetName.match(/(Teacher|Faculty|Staff|Mr|Mrs|Dr|Ms|Prof)\b/i)) {
          sheetTeacherName = sheetName.replace(/^(Teacher|Faculty|Staff)\s*[-_:]?\s*/i, '').trim();
        }

        // Determine default class name from sheet name if possible
        let sheetClassName = canonicalizeClassName(sheetName);

        // Check format 1: Tabular List format (Header has "Class", "Day", "Period", "Subject", "Teacher")
        let isTabular = false;
        let classColIdx = -1;
        let dayColIdx = -1;
        let periodColIdx = -1;
        let subjectColIdx = -1;
        let teacherColIdx = -1;
        let roomColIdx = -1;

        // Scan first 6 rows for tabular header or sheet title class/teacher
        for (let r = 0; r < Math.min(jsonData.length, 6); r++) {
          const row = jsonData[r];
          if (!row) continue;
          row.forEach((cellVal, cIdx) => {
            const str = String(cellVal).trim().toLowerCase();
            if (str.includes('class') || str.includes('sec')) classColIdx = cIdx;
            if (str.includes('day')) dayColIdx = cIdx;
            if (str.includes('period') || str.includes('slot')) periodColIdx = cIdx;
            if (str.includes('subject') || str.includes('paper') || str.includes('course')) subjectColIdx = cIdx;
            if (str.includes('teacher') || str.includes('faculty') || str.includes('staff') || str.includes('educator')) teacherColIdx = cIdx;
            if (str.includes('room') || str.includes('lab') || str.includes('hall')) roomColIdx = cIdx;

            // Check if title row mentions teacher explicitly e.g. "TEACHER TIMETABLE - MR. R. K. SHARMA"
            if (String(cellVal).match(/(TEACHER|FACULTY)\s*[-_:]?\s*([A-Za-z\.\s]+)/i)) {
              const tMatch = String(cellVal).match(/(TEACHER|FACULTY)\s*[-_:]?\s*([A-Za-z\.\s]+)/i);
              if (tMatch && tMatch[2]) {
                const candidateT = tMatch[2].replace(/TIMETABLE|SCHEDULE/gi, '').trim();
                if (candidateT.length > 2) sheetTeacherName = candidateT;
              }
            }

            // Check if title row mentions class explicitly (e.g. "CLASS IX-B TIMETABLE")
            if (String(cellVal).match(/(CLASS|STD|SECTION|GRADE|TIMETABLE FOR)\s+[I|V|X|0-9]+/i)) {
              sheetClassName = canonicalizeClassName(String(cellVal));
            }
          });

          if (dayColIdx >= 0 && periodColIdx >= 0 && (subjectColIdx >= 0 || classColIdx >= 0)) {
            isTabular = true;
            break;
          }
        }

        if (isTabular && dayColIdx >= 0 && periodColIdx >= 0) {
          // Parse as tabular list
          for (let r = 1; r < jsonData.length; r++) {
            const row = jsonData[r];
            if (!row || row.length === 0) continue;

            const dayVal = normalizeDay(row[dayColIdx]);
            const periodVal = normalizePeriod(row[periodColIdx]);
            const subjVal = subjectColIdx >= 0 && row[subjectColIdx] ? String(row[subjectColIdx]).trim() : '';
            const rawTeacher = teacherColIdx >= 0 && row[teacherColIdx] ? String(row[teacherColIdx]).trim() : '';
            const teacherVal = rawTeacher || sheetTeacherName;
            const rawCls = classColIdx >= 0 && row[classColIdx] ? String(row[classColIdx]).trim() : '';
            const clsVal = rawCls ? canonicalizeClassName(rawCls) : sheetClassName;
            const roomVal = roomColIdx >= 0 && row[roomColIdx] ? String(row[roomColIdx]).trim() : '';

            if (dayVal && periodVal && (subjVal || clsVal)) {
              classSet.add(clsVal);
              if (teacherVal) teacherSet.add(teacherVal);
              allParsedSlots.push({
                id: `import-${clsVal}-${dayVal.slice(0, 3)}-${periodVal}-${r}`,
                day: dayVal,
                period: periodVal,
                className: clsVal,
                subjectName: subjVal,
                teacherName: teacherVal,
                roomNo: roomVal
              });
            }
          }
        } else {
          // Parse as Matrix Grid format
          let currentMatrixClass = sheetClassName;
          let periodColMap: { [colIdx: number]: number } = {};
          let headerRowIdx = -1;

          // Find header row containing Period numbers 1..9 or P1..P8
          for (let r = 0; r < Math.min(jsonData.length, 10); r++) {
            const row = jsonData[r];
            if (!row) continue;

            // Check if row contains a class title header e.g. "CLASS IX-A TIMETABLE"
            row.forEach(cell => {
              const cellStr = String(cell || '').trim();
              if (cellStr.match(/(CLASS|STD|SECTION|GRADE)\s+[I|V|X|0-9]+/i)) {
                currentMatrixClass = canonicalizeClassName(cellStr);
              }
            });

            let periodMatchesCount = 0;
            const tempMap: { [c: number]: number } = {};

            row.forEach((cellVal, cIdx) => {
              const pNum = normalizePeriod(cellVal);
              if (pNum !== null) {
                tempMap[cIdx] = pNum;
                periodMatchesCount++;
              }
            });

            if (periodMatchesCount >= 3) {
              headerRowIdx = r;
              periodColMap = tempMap;
              break;
            }
          }

          // If periods found in column headers
          if (headerRowIdx >= 0) {
            for (let r = headerRowIdx + 1; r < jsonData.length; r++) {
              const row = jsonData[r];
              if (!row || row.length === 0) continue;

              // Check if intermediate row specifies a new class title
              row.forEach(cell => {
                const cellStr = String(cell || '').trim();
                if (cellStr.match(/(CLASS|STD|SECTION|GRADE)\s+[I|V|X|0-9]+/i)) {
                  currentMatrixClass = canonicalizeClassName(cellStr);
                }
              });

              // Check first 3 columns for Day Name
              let dayFound: DayOfWeek | null = null;
              for (let c = 0; c < Math.min(row.length, 3); c++) {
                const dayCandidate = normalizeDay(row[c]);
                if (dayCandidate) {
                  dayFound = dayCandidate;
                  break;
                }
              }

              if (dayFound) {
                Object.entries(periodColMap).forEach(([cIdxStr, periodNum]) => {
                  const cIdx = parseInt(cIdxStr, 10);
                  const cellContent = row[cIdx] ? String(row[cIdx]).trim() : '';

                  if (cellContent && cellContent !== '-' && cellContent.toUpperCase() !== 'FREE' && cellContent.toUpperCase() !== 'VACANT') {
                    let subjectName = cellContent;
                    let roomNo = '';
                    let teacherName = sheetTeacherName;
                    let targetCls = currentMatrixClass;

                    // Check if cell content starts with a Class name e.g. "VI-A (Maths)" or "X-A - Physics"
                    const classPrefixMatch = cellContent.match(/^((?:CLASS|STD|SECTION|GRADE)?\s*(?:XII|XI|IX|X|VIII|VII|VI|IV|V|III|II|I|\d+)[-_\s]*[A-Z]?)\b/i);
                    if (classPrefixMatch && classPrefixMatch[1]) {
                      targetCls = canonicalizeClassName(classPrefixMatch[1]);
                      // remove class prefix from subjectName
                      subjectName = cellContent.substring(classPrefixMatch[0].length).replace(/^[-_\s/()]+|[-_\s/()]+$/g, '').trim();
                    }

                    const roomMatch = cellContent.match(/^(.*?)\((.*?)\)$/);
                    if (roomMatch) {
                      if (!classPrefixMatch) subjectName = roomMatch[1].trim();
                      const inside = roomMatch[2].trim();
                      if (inside.includes('-')) {
                        const parts = inside.split('-').map(p => p.trim());
                        if (parts[0].match(/^(Room|R\d|Lab|Hall|Ground|Lib)/i)) {
                          roomNo = parts[0];
                          if (!teacherName) teacherName = parts[1];
                        } else {
                          if (!teacherName) teacherName = parts[0];
                          roomNo = parts[1];
                        }
                      } else if (inside.match(/^(Room|R\d|Lab|Hall|Ground|Lib)/i)) {
                        roomNo = inside;
                      } else if (!teacherName) {
                        teacherName = inside;
                      }
                    } else if (cellContent.includes('-') && !classPrefixMatch) {
                      const parts = cellContent.split('-').map(p => p.trim());
                      subjectName = parts[0];
                      if (parts.length >= 2 && !teacherName) teacherName = parts[1];
                      if (parts.length >= 3) roomNo = parts[2];
                    }

                    classSet.add(targetCls);
                    if (teacherName) teacherSet.add(teacherName);

                    allParsedSlots.push({
                      id: `import-${targetCls}-${dayFound.slice(0, 3)}-${periodNum}-${r}-${cIdx}`,
                      day: dayFound,
                      period: periodNum,
                      className: targetCls,
                      subjectName: subjectName || 'General',
                      teacherName: teacherName,
                      roomNo
                    });
                  }
                });
              }
            }
          }
        }
      });

      if (allParsedSlots.length === 0) {
        throw new Error(
          'Could not extract period slots from the file. Please ensure the Excel contains standard Day headers (Monday-Saturday) and Period columns (1-9).'
        );
      }

      setExtractedSlots(allParsedSlots);
      const classesArr = Array.from(classSet).sort();
      const teachersArr = Array.from(teacherSet).sort();
      setDetectedClasses(classesArr);
      setDetectedTeachers(teachersArr);
    } catch (err: any) {
      console.error('Error parsing Excel file:', err);
      setErrorMsg(err.message || 'Failed to parse Excel file. Please verify file format.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processExcelFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (extractedSlots.length === 0) return;
    onImportSuccess(extractedSlots, replaceMode);
    onClose();
  };

  const filteredPreviewSlots = extractedSlots.filter((slot) => {
    if (previewFilterClass !== 'ALL' && slot.className !== previewFilterClass) return false;
    if (previewFilterTeacher !== 'ALL' && slot.teacherName !== previewFilterTeacher) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header with Mode Switcher */}
        <div className="p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-b border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-300">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white m-0 flex items-center gap-2">
                <span>Timetable Data Importer</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-extrabold">
                  {activeImportTab === 'csv' ? 'CSV Dual-File Import' : 'Multi-Class Excel Parser'}
                </span>
              </h3>
              <p className="text-xs text-purple-200/80 m-0">
                {activeImportTab === 'csv'
                  ? 'Import Teachers.csv and Timetable.csv to build individual teacher and class schedules.'
                  : 'Upload your school\'s weekly timetable Excel sheet (.xlsx, .xls) to auto-extract schedules.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Mode Switcher Tabs */}
            <div className="p-1 rounded-xl bg-slate-950 border border-purple-500/30 flex items-center gap-1">
              <button
                onClick={() => setActiveImportTab('csv')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeImportTab === 'csv'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
                }`}
              >
                <FileType className="w-3.5 h-3.5" />
                <span>CSV Files</span>
              </button>
              <button
                onClick={() => setActiveImportTab('excel')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeImportTab === 'excel'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-purple-300 hover:text-white hover:bg-purple-900/40'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel Sheet</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-6 space-y-6 overflow-y-auto grow">
          {/* TAB 1: CSV FILE IMPORT MODE */}
          {activeImportTab === 'csv' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Banner and Quick Sample Loader */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-slate-900 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white m-0">Quick CSV Dataset Loader</h4>
                    <p className="text-xs text-purple-200/80 m-0">
                      Upload your two CSV files below or test with sample KV KUTRA teacher & timetable data.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleLoadSampleCsvData}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                  >
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>⚡ Load Sample KV KUTRA CSV Data</span>
                  </button>
                  <button
                    onClick={() => handleDownloadSampleCsv('Teachers.csv', SAMPLE_TEACHERS_CSV)}
                    className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-400/30 text-purple-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-300" />
                    <span>Teachers.csv</span>
                  </button>
                  <button
                    onClick={() => handleDownloadSampleCsv('Timetable.csv', SAMPLE_TIMETABLE_CSV)}
                    className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-400/30 text-purple-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-300" />
                    <span>Timetable.csv</span>
                  </button>
                </div>
              </div>

              {/* Dual File Dropzones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Teachers.csv Upload */}
                <div
                  onClick={() => teachersFileInputRef.current?.click()}
                  className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center text-center gap-3 ${
                    teachersFileName
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-purple-500/30 bg-slate-950/60 hover:border-purple-400/60 hover:bg-purple-950/20'
                  }`}
                >
                  <input
                    ref={teachersFileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleTeachersFileChange}
                    className="hidden"
                  />
                  <div className={`p-3 rounded-2xl ${teachersFileName ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'}`}>
                    {teachersFileName ? <UserCheck className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-white m-0">1. Teachers.csv</h5>
                    <p className="text-[11px] text-purple-300/80 m-0 mt-0.5">
                      Columns: <span className="font-mono text-amber-300">Teacher_ID, Teacher_Name, Designation, School</span>
                    </p>
                  </div>
                  {teachersFileName ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{teachersFileName}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-purple-400">Click to select Teachers.csv</span>
                  )}
                </div>

                {/* Timetable.csv Upload */}
                <div
                  onClick={() => timetableFileInputRef.current?.click()}
                  className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center text-center gap-3 ${
                    timetableFileName
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-purple-500/30 bg-slate-950/60 hover:border-purple-400/60 hover:bg-purple-950/20'
                  }`}
                >
                  <input
                    ref={timetableFileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleTimetableFileChange}
                    className="hidden"
                  />
                  <div className={`p-3 rounded-2xl ${timetableFileName ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'}`}>
                    {timetableFileName ? <FileCheck className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-white m-0">2. Timetable.csv</h5>
                    <p className="text-[11px] text-purple-300/80 m-0 mt-0.5">
                      Columns: <span className="font-mono text-amber-300">Teacher_ID, Day, Period, Subject, Class_Grade</span>
                    </p>
                  </div>
                  {timetableFileName ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{timetableFileName}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-purple-400">Click to select Timetable.csv</span>
                  )}
                </div>
              </div>

              {/* CSV Import Results & Validation Summary */}
              {csvSummary && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/30 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-500/20">
                      <div className="text-[10px] font-extrabold uppercase text-purple-300">Teachers Master</div>
                      <div className="text-xl font-black text-amber-300 mt-0.5">
                        {csvSummary.teachersMap.size} records
                      </div>
                      <div className="text-[10px] text-purple-300/70 mt-1">
                        {csvSummary.teachersCount} new • {csvSummary.teachersUpdatedCount} updated
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-500/20">
                      <div className="text-[10px] font-extrabold uppercase text-purple-300">Active Periods</div>
                      <div className="text-xl font-black text-emerald-300 mt-0.5">
                        {csvSummary.slotsMap.size} slots
                      </div>
                      <div className="text-[10px] text-purple-300/70 mt-1">
                        {csvSummary.timetableCount} new • {csvSummary.timetableUpdatedCount} updated
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-500/20">
                      <div className="text-[10px] font-extrabold uppercase text-purple-300">Free Periods Skipped</div>
                      <div className="text-xl font-black text-cyan-300 mt-0.5">
                        {csvSummary.freePeriodsSkipped} free
                      </div>
                      <div className="text-[10px] text-purple-300/70 mt-1">
                        Blank subject & class ignored
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-500/20">
                      <div className="text-[10px] font-extrabold uppercase text-purple-300">Idempotency Check</div>
                      <div className="text-sm font-black text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Safe Re-run</span>
                      </div>
                      <div className="text-[10px] text-purple-300/70 mt-1">
                        Keyed by Teacher_ID
                      </div>
                    </div>
                  </div>

                  {/* Errors / Warnings */}
                  {csvSummary.errors.length > 0 && (
                    <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 space-y-1 text-xs">
                      <div className="font-extrabold flex items-center gap-2 text-rose-300">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>CSV Validation Issues ({csvSummary.errors.length}):</span>
                      </div>
                      <ul className="list-disc pl-5 m-0 space-y-0.5 text-rose-200/90">
                        {csvSummary.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {csvSummary.errors.length > 5 && (
                          <li>...and {csvSummary.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {csvSummary.warnings.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-200 space-y-1 text-xs">
                      <div className="font-extrabold flex items-center gap-2 text-amber-300">
                        <Info className="w-4 h-4 text-amber-400" />
                        <span>Notice ({csvSummary.warnings.length}):</span>
                      </div>
                      <ul className="list-disc pl-5 m-0 space-y-0.5 text-amber-200/90">
                        {csvSummary.warnings.slice(0, 5).map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Apply CSV Import Button */}
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex items-center justify-between gap-4">
                    <div>
                      <h5 className="text-sm font-extrabold text-white m-0">Ready to Apply CSV Schedule</h5>
                      <p className="text-xs text-purple-200/80 m-0">
                        This will populate individual teacher timetables for all 19+ teachers.
                      </p>
                    </div>

                    <button
                      onClick={handleApplyCsvImport}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm flex items-center gap-2 cursor-pointer shadow-xl transition-all"
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>Apply & Import CSV Timetable</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXCEL FILE IMPORT MODE */}
          {activeImportTab === 'excel' && (
            <div className="space-y-6 animate-fadeIn">
          {/* File Upload Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
              isDragOver
                ? 'border-purple-400 bg-purple-950/60 scale-[1.01]'
                : file
                ? 'border-emerald-500/60 bg-emerald-950/20'
                : 'border-purple-500/30 bg-slate-950/60 hover:bg-purple-950/20 hover:border-purple-400/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {loading ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <RefreshCw className="w-10 h-10 text-purple-400 animate-spin" />
                <span className="text-sm font-bold text-purple-200">Parsing Excel Worksheet structure...</span>
                <span className="text-xs text-purple-400">Extracting class schedules, periods & subjects</span>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  <FileCheck className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-200 m-0">{file.name}</p>
                  <p className="text-xs text-emerald-400/80 m-0">
                    {(file.size / 1024).toFixed(1)} KB • Click or Drag another file to replace
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300">
                  <Upload className="w-8 h-8 animate-bounce" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-purple-100 m-0">
                    Click to browse or Drag & Drop Excel timetable sheet here
                  </p>
                  <p className="text-xs text-purple-300/80 m-0">
                    Supports <span className="font-mono text-amber-300 font-bold">.XLSX</span>,{' '}
                    <span className="font-mono text-amber-300 font-bold">.XLS</span>, or{' '}
                    <span className="font-mono text-amber-300 font-bold">.CSV</span> format
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold m-0 text-rose-100">{errorMsg}</p>
                <p className="m-0 mt-1 text-rose-300/80">
                  Tip: Download our sample template to see the recommended KVS timetable layout.
                </p>
              </div>
            </div>
          )}

          {/* Extracted Timetable Summary & Preview */}
          {extractedSlots.length > 0 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Stats Summary Bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/30 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-500/20">
                  <div className="text-[10px] font-extrabold uppercase text-purple-300">Total Period Slots</div>
                  <div className="text-xl font-black text-amber-300 mt-0.5">{extractedSlots.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-500/20">
                  <div className="text-[10px] font-extrabold uppercase text-purple-300">Classes Detected</div>
                  <div className="text-xl font-black text-emerald-300 mt-0.5">{detectedClasses.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-500/20">
                  <div className="text-[10px] font-extrabold uppercase text-purple-300">Teachers Detected</div>
                  <div className="text-xl font-black text-cyan-300 mt-0.5">{detectedTeachers.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-500/20">
                  <div className="text-[10px] font-extrabold uppercase text-purple-300">Worksheets Read</div>
                  <div className="text-xl font-black text-indigo-300 mt-0.5">{selectedSheetNames.length}</div>
                </div>
              </div>

              {/* Import Action Strategy */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span className="font-extrabold text-purple-200">Import Strategy:</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-purple-200 font-bold">
                    <input
                      type="radio"
                      name="importMode"
                      checked={replaceMode}
                      onChange={() => setReplaceMode(true)}
                      className="accent-purple-500 cursor-pointer"
                    />
                    <span>Replace All Current Timetable Data</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-purple-200 font-bold">
                    <input
                      type="radio"
                      name="importMode"
                      checked={!replaceMode}
                      onChange={() => setReplaceMode(false)}
                      className="accent-purple-500 cursor-pointer"
                    />
                    <span>Merge / Append into Current Schedule</span>
                  </label>
                </div>
              </div>

              {/* Preview Table Header & Class / Teacher Filter */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-black text-purple-100">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Parsed Period Slots Preview ({filteredPreviewSlots.length}):</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-purple-400" />
                    <label className="text-xs text-purple-300 font-bold">Class:</label>
                    <select
                      value={previewFilterClass}
                      onChange={(e) => setPreviewFilterClass(e.target.value)}
                      className="px-2 py-1 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-100 text-xs font-bold focus:outline-none"
                    >
                      <option value="ALL">All ({detectedClasses.length})</option>
                      {detectedClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          Class {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <label className="text-xs text-purple-300 font-bold">Teacher:</label>
                    <select
                      value={previewFilterTeacher}
                      onChange={(e) => setPreviewFilterTeacher(e.target.value)}
                      className="px-2 py-1 rounded-xl bg-purple-950 border border-purple-500/40 text-cyan-200 text-xs font-bold focus:outline-none"
                    >
                      <option value="ALL">All ({detectedTeachers.length})</option>
                      {detectedTeachers.map((tch) => (
                        <option key={tch} value={tch}>
                          {tch}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Extracted Slots Table */}
              <div className="max-h-60 overflow-y-auto border border-purple-500/30 rounded-2xl bg-slate-950/60 divide-y divide-purple-500/20">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-950/80 text-purple-300 uppercase text-[10px] font-extrabold sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="p-2.5">Class</th>
                      <th className="p-2.5">Day</th>
                      <th className="p-2.5">Period</th>
                      <th className="p-2.5">Subject</th>
                      <th className="p-2.5">Teacher</th>
                      <th className="p-2.5">Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10 text-purple-100">
                    {filteredPreviewSlots.slice(0, 80).map((s, idx) => (
                      <tr key={s.id || idx} className="hover:bg-purple-900/30 transition-colors">
                        <td className="p-2.5 font-bold text-amber-300">{s.className}</td>
                        <td className="p-2.5">{s.day}</td>
                        <td className="p-2.5 font-mono text-purple-300">Period {s.period}</td>
                        <td className="p-2.5 font-bold text-emerald-300">{s.subjectName}</td>
                        <td className="p-2.5 font-bold text-cyan-300">{s.teacherName || '—'}</td>
                        <td className="p-2.5 text-purple-300/80">{s.roomNo || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPreviewSlots.length > 80 && (
                  <div className="p-2 text-center text-xs text-purple-400 bg-purple-950/40 font-mono">
                    + {filteredPreviewSlots.length - 80} more slots parsed
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-950 border-t border-purple-500/30 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
          >
            Cancel
          </button>

          <button
            disabled={extractedSlots.length === 0}
            onClick={handleConfirmImport}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all ${
              extractedSlots.length > 0
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer scale-[1.02]'
                : 'bg-emerald-950/40 border border-emerald-800/30 text-emerald-400/40 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply & Add {extractedSlots.length} Period(s) to Timetable</span>
          </button>
        </div>
      </div>
    </div>
  );
};
