import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/storage';
import {
  StudentProfile,
  PracticalAttendanceRecord,
  ScholasticScoreRecordVItoVIII,
  ScholasticScoreRecordIXtoX,
  DailyLessonPlan
} from '../types/academic';
import {
  DEFAULT_STUDENTS,
  DEFAULT_PRACTICAL_ATTENDANCE,
  DEFAULT_SCHOLASTIC_SCORES_VI_VIII,
  DEFAULT_SCHOLASTIC_SCORES_IX_X,
  computeCBSEGrade
} from '../lib/studentDefaults';
import {
  parseStudentFile,
  parseStudentText,
  downloadSampleCSVFile,
  downloadBlankCSVFile,
  downloadSampleExcelFile,
  generateSampleCSVString,
  generateBlankCSVString,
  exportStudentsToCSV,
  exportStudentsToXLSX,
  OFFICIAL_HEADERS,
  OFFICIAL_HEADERS_WITH_CLASS,
  ParseResult
} from '../lib/studentFileImporter';
import {
  Users,
  UserPlus,
  Upload,
  Download,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Award,
  BookOpen,
  Calendar,
  Sparkles,
  RefreshCw,
  Eye,
  FileText,
  Check,
  X,
  Phone,
  Mail,
  UserCheck,
  HeartPulse,
  Printer,
  ChevronRight,
  Shield,
  HelpCircle,
  AlertTriangle,
  Copy,
  Sliders,
  Layers,
  FileDown
} from 'lucide-react';

export const KVS_CLASS_ORDER: Record<string, number> = {
  'I': 1, '1': 1, '1ST': 1,
  'II': 2, '2': 2, '2ND': 2,
  'III': 3, '3': 3, '3RD': 3,
  'IV': 4, '4': 4, '4TH': 4,
  'V': 5, '5': 5, '5TH': 5,
  'VI': 6, '6': 6, '6TH': 6,
  'VII': 7, '7': 7, '7TH': 7,
  'VIII': 8, '8': 8, '8TH': 8,
  'IX': 9, '9': 9, '9TH': 9,
  'X': 10, '10': 10, '10TH': 10,
  'XI': 11, '11': 11, '11TH': 11,
  'XII': 12, '12': 12, '12TH': 12,
};

export const NEP_STAGES_CONFIG = [
  { id: 'ALL', label: 'All Stages (I - XII)', shortLabel: 'All Stages (I-XII)', icon: '🏛️', classes: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] },
  { id: 'FOUNDATIONAL', label: 'Foundational Stage (Class 1 & 2)', shortLabel: 'Foundational (1-2)', icon: '🌱', classes: ['I', 'II'] },
  { id: 'PREPARATORY', label: 'Preparatory Stage (Class 3 to 5)', shortLabel: 'Preparatory (3-5)', icon: '📘', classes: ['III', 'IV', 'V'] },
  { id: 'MIDDLE', label: 'Middle Stage (Class 6 to 8)', shortLabel: 'Middle (6-8)', icon: '🔬', classes: ['VI', 'VII', 'VIII'] },
  { id: 'SECONDARY', label: 'Secondary Stage (Class 9 to 12)', shortLabel: 'Secondary (9-12)', icon: '🎓', classes: ['IX', 'X', 'XI', 'XII'] },
];

interface StudentProfileManagerProps {
  devMode?: boolean;
}

export function StudentProfileManager({ devMode = true }: StudentProfileManagerProps) {
  // Main tabs
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'import' | 'attendance' | 'scholastic'>('directory');

  // Core Data
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [practicalAttendance, setPracticalAttendance] = useState<PracticalAttendanceRecord[]>([]);
  const [scholasticScoresVI, setScholasticScoresVI] = useState<ScholasticScoreRecordVItoVIII[]>([]);
  const [scholasticScoresIX, setScholasticScoresIX] = useState<ScholasticScoreRecordIXtoX[]>([]);
  const [lessonPlans, setLessonPlans] = useState<DailyLessonPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Directory Filters & Search
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSocialCategory, setFilterSocialCategory] = useState<string>('ALL');
  const [filterRTE, setFilterRTE] = useState<string>('ALL');
  const [filterSGC, setFilterSGC] = useState<string>('ALL');
  const [filterMinority, setFilterMinority] = useState<string>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Selected for Bulk Actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentProfile | null>(null);

  // Single Student Detail Modal
  const [viewingStudent, setViewingStudent] = useState<StudentProfile | null>(null);

  // Add / Edit Student Modal
  const [showStudentModal, setShowStudentModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [studentFormData, setStudentFormData] = useState<Partial<StudentProfile>>({});

  // Universal Importer State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importTargetClass, setImportTargetClass] = useState<string>('AUTO');
  const [importTargetSection, setImportTargetSection] = useState<string>('A');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [purgeSampleData, setPurgeSampleData] = useState<boolean>(true);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [showColumnMapper, setShowColumnMapper] = useState<boolean>(false);
  const [manualMapping, setManualMapping] = useState<Record<string, number>>({});
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  // Practical Attendance (P-29) State
  const [attClass, setAttClass] = useState<string>('X');
  const [attSection, setAttSection] = useState<string>('A');
  const [attSubject, setAttSubject] = useState<string>('Mathematics (041)');
  const [attDate, setAttDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attPracticalNo, setAttPracticalNo] = useState<string>('Maths Lab Activity 1');
  const [attPracticalTitle, setAttPracticalTitle] = useState<string>('Constructing Square Root Spiral on square grid (Real Numbers)');
  const [attPeriodNo, setAttPeriodNo] = useState<string>('4th Period');
  const [currentAttendanceMap, setCurrentAttendanceMap] = useState<Record<string, 'P' | 'A' | 'L' | 'E'>>({});
  const [attRemarks, setAttRemarks] = useState<string>('');
  const [attSyncSuccess, setAttSyncSuccess] = useState<string | null>(null);

  // Scholastic Assessment (P-22) State
  const [schClass, setSchClass] = useState<string>('VI');
  const [schSection, setSchSection] = useState<string>('A');
  const [schSubject, setSchSubject] = useState<string>('Mathematics (041)');
  const [schSaveNotice, setSchSaveNotice] = useState<string | null>(null);

  // Load Data on Mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    const storedStudents = await db.get<StudentProfile[]>('setup:students');
    const storedPracticalAtt = await db.get<PracticalAttendanceRecord[]>('setup:practical_attendance');
    const storedScholasticVI = await db.get<ScholasticScoreRecordVItoVIII[]>('setup:scholastic_scores_vi_viii');
    const storedScholasticIX = await db.get<ScholasticScoreRecordIXtoX[]>('setup:scholastic_scores_ix_x');
    const storedLPs = await db.get<DailyLessonPlan[]>('setup:lesson_plans');

    if (storedStudents && storedStudents.length > 0) {
      setStudents(storedStudents);
    } else {
      setStudents(DEFAULT_STUDENTS);
      await db.set('setup:students', DEFAULT_STUDENTS);
    }

    if (storedPracticalAtt && storedPracticalAtt.length > 0) {
      setPracticalAttendance(storedPracticalAtt);
    } else {
      setPracticalAttendance(DEFAULT_PRACTICAL_ATTENDANCE);
      await db.set('setup:practical_attendance', DEFAULT_PRACTICAL_ATTENDANCE);
    }

    if (storedScholasticVI && storedScholasticVI.length > 0) {
      setScholasticScoresVI(storedScholasticVI);
    } else {
      setScholasticScoresVI(DEFAULT_SCHOLASTIC_SCORES_VI_VIII);
      await db.set('setup:scholastic_scores_vi_viii', DEFAULT_SCHOLASTIC_SCORES_VI_VIII);
    }

    if (storedScholasticIX && storedScholasticIX.length > 0) {
      setScholasticScoresIX(storedScholasticIX);
    } else {
      setScholasticScoresIX(DEFAULT_SCHOLASTIC_SCORES_IX_X);
      await db.set('setup:scholastic_scores_ix_x', DEFAULT_SCHOLASTIC_SCORES_IX_X);
    }

    if (storedLPs) {
      setLessonPlans(storedLPs);
    }

    setLoading(false);
  };

  // Sync Practical Attendance map when class/date changes
  useEffect(() => {
    const existing = practicalAttendance.find(
      r => r.className === attClass && r.section === attSection && r.date === attDate && r.subjectName === attSubject
    );

    const enrolled = students.filter(s => s.className === attClass && s.section === attSection);
    const map: Record<string, 'P' | 'A' | 'L' | 'E'> = {};

    if (existing) {
      enrolled.forEach(s => {
        map[s.id] = existing.attendanceMap[s.id] || 'P';
      });
      setAttPracticalNo(existing.practicalNo || 'Practical 1');
      setAttPracticalTitle(existing.practicalTitle || '');
      setAttPeriodNo(existing.periodNo || '1st Period');
      setAttRemarks(existing.remarks || '');
    } else {
      enrolled.forEach(s => {
        map[s.id] = 'P'; // Default all Present
      });
    }

    setCurrentAttendanceMap(map);
  }, [attClass, attSection, attSubject, attDate, students, practicalAttendance]);

  // Available classes list sorted pedagogically by KVS standard sequence
  const availableClasses = Array.from(new Set(students.map(s => s.className)))
    .filter((c): c is string => Boolean(c))
    .sort((a: string, b: string) => (KVS_CLASS_ORDER[a] || 99) - (KVS_CLASS_ORDER[b] || 99));
  const availableSections = Array.from(new Set(students.map(s => s.section)))
    .filter((s): s is string => Boolean(s))
    .sort();

  // Filtered students for Directory
  const filteredStudents = students.filter(student => {
    if (selectedStage !== 'ALL') {
      const stageConfig = NEP_STAGES_CONFIG.find(st => st.id === selectedStage);
      if (stageConfig && !stageConfig.classes.includes(student.className)) return false;
    }
    if (selectedClass !== 'ALL' && student.className !== selectedClass) return false;
    if (selectedSection !== 'ALL' && student.section !== selectedSection) return false;
    if (filterSocialCategory !== 'ALL' && student.socialCategory !== filterSocialCategory) return false;
    if (filterRTE !== 'ALL' && student.rte !== filterRTE) return false;
    if (filterSGC !== 'ALL' && student.singleGirlChild !== filterSGC) return false;
    if (filterMinority !== 'ALL' && student.minority !== filterMinority) return false;
    if (filterGender !== 'ALL' && student.gender !== filterGender) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = student.studentName.toLowerCase().includes(q);
      const matchId = student.studentId.toLowerCase().includes(q);
      const matchPen = (student.penNo || '').toLowerCase().includes(q);
      const matchApaar = (student.apaarId || '').toLowerCase().includes(q);
      const matchAadhaar = (student.aadhaarNo || '').toLowerCase().includes(q);
      const matchFather = (student.fatherName || '').toLowerCase().includes(q);
      const matchMother = (student.motherName || '').toLowerCase().includes(q);
      const matchContact = (student.contactNumber || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchPen && !matchApaar && !matchAadhaar && !matchFather && !matchMother && !matchContact) {
        return false;
      }
    }
    return true;
  });

  // Calculate high level metrics
  const totalCount = students.length;
  const boysCount = students.filter(s => s.gender === 'MALE').length;
  const girlsCount = students.filter(s => s.gender === 'FEMALE').length;
  const sgcCount = students.filter(s => s.singleGirlChild === 'YES').length;
  const rteCount = students.filter(s => s.rte === 'YES').length;
  const minorityCount = students.filter(s => s.minority === 'YES').length;

  // Handle Save Student (Add / Edit)
  const handleSaveStudentForm = async () => {
    if (!studentFormData.studentName?.trim()) {
      alert('Please enter Student Name');
      return;
    }

    const updatedList = [...students];
    if (editingStudent) {
      const idx = updatedList.findIndex(s => s.id === editingStudent.id);
      if (idx !== -1) {
        updatedList[idx] = {
          ...editingStudent,
          ...studentFormData
        } as StudentProfile;
      }
    } else {
      const newStudent: StudentProfile = {
        id: `std-${Date.now()}`,
        sn: updatedList.length + 1,
        studentName: studentFormData.studentName || 'Student',
        gender: studentFormData.gender || 'MALE',
        dob: studentFormData.dob || '01/01/2012',
        studentId: studentFormData.studentId || `KV-2025-${String(updatedList.length + 1).padStart(4, '0')}`,
        admissionDate: studentFormData.admissionDate || '01/04/2020',
        penNo: studentFormData.penNo || `2117010420${String(updatedList.length + 1).padStart(4, '0')}`,
        apaarId: studentFormData.apaarId || `98421049${String(updatedList.length + 1).padStart(4, '0')}`,
        fatherName: studentFormData.fatherName || '',
        motherName: studentFormData.motherName || '',
        contactNumber: studentFormData.contactNumber || '',
        bloodGroup: studentFormData.bloodGroup || 'B+',
        height: studentFormData.height || '',
        weight: studentFormData.weight || '',
        completeAddress: studentFormData.completeAddress || studentFormData.address || '',
        admissionCategory: studentFormData.admissionCategory || 'Cat-1 (Central Govt.)',
        socialCategory: studentFormData.socialCategory || 'GEN',
        minority: studentFormData.minority || 'NO',
        rte: studentFormData.rte || 'NO',
        singleGirlChild: studentFormData.singleGirlChild || 'NO',
        aadhaarNo: studentFormData.aadhaarNo || '',
        studentEmail: studentFormData.studentEmail || '',
        className: studentFormData.className || 'VI',
        section: studentFormData.section || 'A',
        rollNo: studentFormData.rollNo || updatedList.length + 1,
        address: studentFormData.completeAddress || studentFormData.address || ''
      };
      updatedList.push(newStudent);
    }

    setStudents(updatedList);
    await db.set('setup:students', updatedList);
    setShowStudentModal(false);
    setEditingStudent(null);
    setStudentFormData({});
  };

  // Open Edit Modal
  const handleOpenEdit = (student: StudentProfile) => {
    setEditingStudent(student);
    setStudentFormData({ ...student });
    setShowStudentModal(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setStudentFormData({
      className: selectedClass !== 'ALL' ? selectedClass : 'VI',
      section: selectedSection !== 'ALL' ? selectedSection : 'A',
      gender: 'MALE',
      socialCategory: 'GEN',
      minority: 'NO',
      rte: 'NO',
      singleGirlChild: 'NO',
      bloodGroup: 'B+',
      admissionCategory: 'Cat-1 (Central Govt.)'
    });
    setShowStudentModal(true);
  };

  // Delete Individual Student
  const handleDeleteStudent = async (student: StudentProfile) => {
    const updatedList = students.filter(s => s.id !== student.id);
    setStudents(updatedList);
    await db.set('setup:students', updatedList);
    setShowDeleteConfirmModal(false);
    setStudentToDelete(null);
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedStudentIds.length === 0) return;
    const updatedList = students.filter(s => !selectedStudentIds.includes(s.id));
    setStudents(updatedList);
    await db.set('setup:students', updatedList);
    setSelectedStudentIds([]);
    setShowDeleteConfirmModal(false);
  };

  // Quick function to copy sample CSV with demo data to clipboard
  const handleCopySampleCSV = () => {
    const cls = importTargetClass !== 'AUTO' ? importTargetClass : (selectedClass !== 'ALL' ? selectedClass : 'VII');
    const sample = generateSampleCSVString(true, cls);
    navigator.clipboard.writeText(sample);
    setCopyNotice(`Class ${cls} Sample CSV copied to clipboard!`);
    setTimeout(() => setCopyNotice(null), 3500);
  };

  // Quick function to copy blank CSV template to clipboard
  const handleCopyBlankCSV = () => {
    const blank = generateBlankCSVString(true);
    navigator.clipboard.writeText(blank);
    setCopyNotice('Blank CSV Template headers copied to clipboard!');
    setTimeout(() => setCopyNotice(null), 3500);
  };

  // Quick function to load sample data directly into parser
  const handleLoadSampleToParser = () => {
    const cls = importTargetClass !== 'AUTO' ? importTargetClass : (selectedClass !== 'ALL' ? selectedClass : 'VII');
    const sample = generateSampleCSVString(true, cls);
    setPastedText(sample);
    setIsParsing(true);
    setImportSuccessMsg(null);
    const result = parseStudentText(sample, cls, importTargetSection, manualMapping);
    setParseResult(result);
    setIsParsing(false);
  };

  // Update target class with live preview recalculation
  const handleTargetClassChange = (newClass: string) => {
    setImportTargetClass(newClass);
    if (parseResult) {
      const cls = newClass !== 'AUTO' ? newClass : (parseResult.detectedClass || 'VII');
      const updatedStudents = parseResult.students.map((s, idx) => ({
        ...s,
        className: cls,
        studentId: s.studentId?.startsWith('KV-') ? `KV-${cls}-${String(s.sn || idx + 1).padStart(4, '0')}` : s.studentId
      }));
      setParseResult({
        ...parseResult,
        students: updatedStudents
      });
    }
  };

  // Update target section with live preview recalculation
  const handleTargetSectionChange = (newSec: string) => {
    setImportTargetSection(newSec);
    if (parseResult) {
      const updatedStudents = parseResult.students.map((s) => ({
        ...s,
        section: newSec
      }));
      setParseResult({
        ...parseResult,
        students: updatedStudents
      });
    }
  };

  // Update specific column mapping
  const handleUpdateColumnMapping = (fieldKey: string, colIndex: number) => {
    const updated = { ...manualMapping, [fieldKey]: colIndex };
    setManualMapping(updated);
    const fallbackClass = importTargetClass !== 'AUTO' ? importTargetClass : (parseResult?.detectedClass || (selectedClass !== 'ALL' ? selectedClass : 'VII'));

    if (importFile) {
      parseStudentFile(importFile, fallbackClass, importTargetSection, updated).then(res => {
        setParseResult(res);
      });
    } else if (pastedText) {
      const res = parseStudentText(pastedText, fallbackClass, importTargetSection, updated);
      setParseResult(res);
    }
  };

  // Reset custom column mapping
  const handleResetColumnMapping = () => {
    setManualMapping({});
    const fallbackClass = importTargetClass !== 'AUTO' ? importTargetClass : (parseResult?.detectedClass || (selectedClass !== 'ALL' ? selectedClass : 'VII'));
    if (importFile) {
      parseStudentFile(importFile, fallbackClass, importTargetSection).then(res => {
        setParseResult(res);
      });
    } else if (pastedText) {
      const res = parseStudentText(pastedText, fallbackClass, importTargetSection);
      setParseResult(res);
    }
  };

  // Handle File Upload & Parse
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    setImportSuccessMsg(null);
    setManualMapping({});

    const initialFallbackClass = importTargetClass !== 'AUTO' ? importTargetClass : (selectedClass !== 'ALL' ? selectedClass : 'VII');
    const result = await parseStudentFile(file, initialFallbackClass, importTargetSection);
    
    if (result.detectedClass && importTargetClass === 'AUTO') {
      setImportTargetClass(result.detectedClass);
    }
    if (result.detectedSection) {
      setImportTargetSection(result.detectedSection);
    }
    
    setParseResult(result);
    setIsParsing(false);
  };

  // Handle Paste Parse
  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    setIsParsing(true);
    setImportSuccessMsg(null);
    const fallbackClass = importTargetClass !== 'AUTO' ? importTargetClass : (selectedClass !== 'ALL' ? selectedClass : 'VII');
    const result = parseStudentText(pastedText, fallbackClass, importTargetSection, manualMapping);
    if (result.detectedClass && importTargetClass === 'AUTO') {
      setImportTargetClass(result.detectedClass);
    }
    if (result.detectedSection) {
      setImportTargetSection(result.detectedSection);
    }
    setParseResult(result);
    setIsParsing(false);
  };

  // Check if a student is part of the initial demo/sample dataset
  const isSampleStudent = (s: StudentProfile) =>
    s.id.startsWith('std-1a-') ||
    s.id.startsWith('std-2a-') ||
    s.id.startsWith('std-3a-') ||
    s.id.startsWith('std-4a-') ||
    s.id.startsWith('std-5a-') ||
    s.id.startsWith('std-6a-') ||
    s.id.startsWith('std-7a-') ||
    s.id.startsWith('std-8a-') ||
    s.id.startsWith('std-9a-') ||
    s.id.startsWith('std-10a-') ||
    s.id.startsWith('std-11a-') ||
    s.id.startsWith('std-12a-') ||
    DEFAULT_STUDENTS.some(ds => ds.studentId === s.studentId && ds.studentName === s.studentName);

  // Sample vs Real student counts
  const sampleStudentsCount = students.filter(isSampleStudent).length;

  // Commit Parsed Students to DB
  const handleCommitImport = async () => {
    if (!parseResult || parseResult.students.length === 0) return;

    const newStudents: StudentProfile[] = parseResult.students.map((p, idx) => {
      const cls = importTargetClass !== 'AUTO' ? importTargetClass : (p.className || parseResult.detectedClass || 'I');
      const sec = p.section || importTargetSection || parseResult.detectedSection || 'A';
      return {
        id: p.id || `std-${Date.now()}-${idx}`,
        sn: p.sn || idx + 1,
        studentName: p.studentName || `Student ${idx + 1}`,
        gender: p.gender || 'MALE',
        dob: p.dob || '01/01/2018',
        studentId: p.studentId || `KV-${cls}-${String(idx + 1).padStart(4, '0')}`,
        admissionDate: p.admissionDate || '01/04/2024',
        penNo: p.penNo || '',
        apaarId: p.apaarId || '',
        fatherName: p.fatherName || '',
        motherName: p.motherName || '',
        contactNumber: p.contactNumber || '',
        bloodGroup: p.bloodGroup || 'B+',
        height: p.height || '',
        weight: p.weight || '',
        completeAddress: p.completeAddress || p.address || '',
        admissionCategory: p.admissionCategory || 'Cat-1 (Central Govt.)',
        socialCategory: p.socialCategory || 'GEN',
        minority: p.minority || 'NO',
        rte: p.rte || 'NO',
        singleGirlChild: p.singleGirlChild || 'NO',
        aadhaarNo: p.aadhaarNo || '',
        studentEmail: p.studentEmail || '',
        className: cls,
        section: sec,
        rollNo: p.rollNo || idx + 1,
        address: p.completeAddress || p.address || ''
      };
    });

    let finalStudents: StudentProfile[] = [];
    if (importMode === 'replace') {
      finalStudents = newStudents;
    } else {
      // If purgeSampleData is active, clear out demo placeholder data first
      const baseStudents = purgeSampleData ? students.filter(s => !isSampleStudent(s)) : students;
      const existingMap = new Map<string, StudentProfile>(baseStudents.map(s => [s.studentId || s.id, s]));
      newStudents.forEach(ns => {
        existingMap.set(ns.studentId || ns.id, ns);
      });
      finalStudents = Array.from(existingMap.values()) as StudentProfile[];
    }

    setStudents(finalStudents);
    await db.set('setup:students', finalStudents);
    setImportSuccessMsg(
      `Successfully imported ${newStudents.length} student records into database! ${
        purgeSampleData ? 'All sample demo student records were automatically removed.' : ''
      }`
    );
    setParseResult(null);
    setImportFile(null);
    setPastedText('');
  };

  // Explicitly Remove Sample Demo Students
  const handleClearSampleData = async () => {
    const remaining = students.filter(s => !isSampleStudent(s));
    setStudents(remaining);
    await db.set('setup:students', remaining);
    setImportSuccessMsg(`Removed all sample demo records from database. ${remaining.length} actual student records active.`);
  };

  // Reset to Default Sample Roster
  const handleLoadSampleDatabase = async () => {
    setStudents(DEFAULT_STUDENTS);
    await db.set('setup:students', DEFAULT_STUDENTS);
    setImportSuccessMsg(`Loaded default KVS roster with ${DEFAULT_STUDENTS.length} students across Foundational (1-2), Preparatory (3-5), Middle (6-8), and Secondary (9-12) stages!`);
  };

  // Save Practical Attendance and Auto-Sync to Daily Lesson Plan
  const handleSavePracticalAttendance = async () => {
    const enrolled = students.filter(s => s.className === attClass && s.section === attSection);
    const presentCount = enrolled.filter(s => currentAttendanceMap[s.id] === 'P').length;
    const absentCount = enrolled.length - presentCount;

    const recordId = `att-${attClass}-${attSection}-${attDate}-${attSubject.replace(/[^a-zA-Z0-9]/g, '')}`;
    const newRecord: PracticalAttendanceRecord = {
      id: recordId,
      date: attDate,
      className: attClass,
      section: attSection,
      subjectName: attSubject,
      practicalNo: attPracticalNo,
      practicalTitle: attPracticalTitle,
      periodNo: attPeriodNo,
      totalStudents: enrolled.length,
      presentCount,
      absentCount,
      attendanceMap: { ...currentAttendanceMap },
      teacherSignature: 'Mrs. Ananya Patnaik (TGT)',
      remarks: attRemarks,
      syncedToLessonPlan: true,
      templatePageRef: 29
    };

    // Update practical attendance list
    const updatedAttList = practicalAttendance.filter(r => r.id !== recordId);
    updatedAttList.unshift(newRecord);
    setPracticalAttendance(updatedAttList);
    await db.set('setup:practical_attendance', updatedAttList);

    // Auto-Sync to Daily Lesson Plan (Purpose 1 specified by user)
    // Find lesson plan matching date & class, or create/update attendance count
    const updatedLPs = [...lessonPlans];
    const matchingLPIdx = updatedLPs.findIndex(
      lp => lp.date === attDate && lp.className === attClass && lp.section === attSection
    );

    let syncedLPTitle = '';
    if (matchingLPIdx !== -1) {
      updatedLPs[matchingLPIdx] = {
        ...updatedLPs[matchingLPIdx],
        noOfStudentsInClass: String(presentCount),
        remarks: `${updatedLPs[matchingLPIdx].remarks || ''} [Practical Attendance logged: ${presentCount}/${enrolled.length} Present]`.trim()
      };
      syncedLPTitle = `Updated Daily Lesson Plan "${updatedLPs[matchingLPIdx].topic || updatedLPs[matchingLPIdx].chapterTitle}"`;
    }

    setLessonPlans(updatedLPs);
    await db.set('setup:lesson_plans', updatedLPs);

    setAttSyncSuccess(
      `Practical Attendance saved! ${presentCount}/${enrolled.length} students marked Present (${Math.round((presentCount / (enrolled.length || 1)) * 100)}%). ${
        syncedLPTitle ? `${syncedLPTitle} with student count ${presentCount}.` : 'Auto-synced to Teacher’s Diary register!'
      }`
    );

    setTimeout(() => {
      setAttSyncSuccess(null);
    }, 6000);
  };

  // Toggle Single Attendance
  const handleToggleAttendance = (studentId: string) => {
    const current = currentAttendanceMap[studentId] || 'P';
    const nextStatus = current === 'P' ? 'A' : current === 'A' ? 'L' : 'P';
    setCurrentAttendanceMap(prev => ({
      ...prev,
      [studentId]: nextStatus
    }));
  };

  // Mark all enrolled as Present
  const handleMarkAllPresent = () => {
    const enrolled = students.filter(s => s.className === attClass && s.section === attSection);
    const map: Record<string, 'P' | 'A' | 'L' | 'E'> = {};
    enrolled.forEach(s => {
      map[s.id] = 'P';
    });
    setCurrentAttendanceMap(map);
  };

  // Scholastic Score Update (Classes VI-VIII)
  const handleUpdateScholasticScoreVI = (
    studentId: string,
    field: keyof ScholasticScoreRecordVItoVIII,
    value: any
  ) => {
    const enrolledStudents = students.filter(s => s.className === schClass && s.section === schSection);
    const student = enrolledStudents.find(s => s.id === studentId);
    if (!student) return;

    const existingIdx = scholasticScoresVI.findIndex(s => s.studentId === studentId && s.subjectName === schSubject);
    let record: ScholasticScoreRecordVItoVIII;

    if (existingIdx !== -1) {
      record = { ...scholasticScoresVI[existingIdx], [field]: value };
    } else {
      record = {
        id: `scr-vi-${studentId}`,
        studentId,
        studentName: student.studentName,
        rollNo: student.rollNo || 1,
        className: schClass,
        section: schSection,
        subjectName: schSubject,
        academicYear: '2025-2026',
        pt1: null,
        pt2: null,
        notebook: null,
        subjectEnrichment: null,
        mdp: null,
        learnersDiary: null,
        halfYearly: null,
        totalMarks: 0,
        percentage: 0,
        grade: 'E',
        [field]: value
      };
    }

    // Auto-calculate Total & Grade
    const pt1 = record.pt1 || 0;
    const pt2 = record.pt2 || 0;
    const nb = record.notebook || 0;
    const se = record.subjectEnrichment || 0;
    const mdp = record.mdp || 0;
    const ld = record.learnersDiary || 0;
    const hy = record.halfYearly || 0;

    // Total calculation: (PT1+PT2 avg scaled to 10) + NB(5) + SE(5) + MDP(5) + LD(5) + HY(70 or scaled)
    const total = Math.min(100, Math.round(((pt1 + pt2) / 2 + nb + se + mdp + ld + hy) * 10) / 10);
    record.totalMarks = total;
    record.percentage = total;
    record.grade = computeCBSEGrade(total);

    const updated = [...scholasticScoresVI];
    if (existingIdx !== -1) {
      updated[existingIdx] = record;
    } else {
      updated.push(record);
    }
    setScholasticScoresVI(updated);
  };

  const handleSaveScholasticRecords = async () => {
    await db.set('setup:scholastic_scores_vi_viii', scholasticScoresVI);
    setSchSaveNotice('Scholastic assessment records saved successfully! Grades and pass percentages recalculated.');
    setTimeout(() => setSchSaveNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                P-21 · 16. Students’ Profile
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                P-29 · 17(i) Practical Attendance
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                P-22 · 17(a) Scholastic Record
              </span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-purple-400" />
              <span>Student Profile Directory & Universal Roster Hub</span>
            </h2>
            <p className="text-sm text-[var(--text-dim)] mt-1 max-w-3xl">
              Complete student master records supporting UDISE PEN, APAAR ID, Aadhaar, RTE & Single Girl Child tags.
              Directly integrates with <strong>P-29 Practical Attendance</strong> (auto-syncing to Daily Lesson Plans) and <strong>P-22 Scholastic Assessment Records</strong>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveSubTab('import')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Import Students (CSV/Excel)</span>
            </button>

            <button
              onClick={() => downloadSampleCSVFile()}
              className="px-3 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              title="Download Class VI Sample CSV format file"
            >
              <Download className="w-3.5 h-3.5 text-purple-300" />
              <span>Sample CSV</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4 text-purple-300" />
              <span>Add Single Student</span>
            </button>

            <button
              onClick={() => exportStudentsToCSV(filteredStudents)}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-[var(--glass-border)] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
              title="Export filtered list to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => exportStudentsToXLSX(filteredStudents)}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-[var(--glass-border)] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
              title="Export filtered list to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-[var(--glass-border)]">
          <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20">
            <div className="text-[10px] text-purple-300 font-medium uppercase tracking-wider">Total Enrolled</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{totalCount}</div>
            <div className="text-[11px] text-[var(--text-dim)] mt-0.5">Across all classes</div>
          </div>

          <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/20">
            <div className="text-[10px] text-blue-300 font-medium uppercase tracking-wider">Boys / Girls</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{boysCount} / {girlsCount}</div>
            <div className="text-[11px] text-blue-400 mt-0.5 font-medium">Gender Ratio Balanced</div>
          </div>

          <div className="p-3 rounded-2xl bg-pink-950/40 border border-pink-500/20">
            <div className="text-[10px] text-pink-300 font-medium uppercase tracking-wider">Single Girl Child</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{sgcCount}</div>
            <div className="text-[11px] text-pink-400 mt-0.5">Class 6+ KVS SGC</div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/20">
            <div className="text-[10px] text-amber-300 font-medium uppercase tracking-wider">RTE Admissions</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{rteCount}</div>
            <div className="text-[11px] text-amber-400 mt-0.5">25% Quota Verified</div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/20">
            <div className="text-[10px] text-emerald-300 font-medium uppercase tracking-wider">Minority Enrolled</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{minorityCount}</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">Special Care Tracking</div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
            <div className="text-[10px] text-indigo-300 font-medium uppercase tracking-wider">UDISE & APAAR</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">100%</div>
            <div className="text-[11px] text-indigo-300 mt-0.5">Registry Synced</div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-b border-[var(--glass-border)]">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'directory'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/5 text-[var(--text-dim)] hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students Directory & Master Table ({filteredStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('import')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'import'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/5 text-[var(--text-dim)] hover:bg-white/10 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Universal File Importer (CSV / Excel / Paste)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'attendance'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/5 text-[var(--text-dim)] hover:bg-white/10 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>{devMode ? 'P-29 Practical Attendance Logger' : 'Practical Attendance Logger'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('scholastic')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'scholastic'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/5 text-[var(--text-dim)] hover:bg-white/10 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>{devMode ? 'P-22 Scholastic Assessment Records' : 'Scholastic Assessment Records'}</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: STUDENTS DIRECTORY */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          {/* NEP Pedagogical Stage Filter Bar */}
          <div className="p-3.5 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>NEP Stage:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {NEP_STAGES_CONFIG.map(stg => (
                  <button
                    key={stg.id}
                    onClick={() => {
                      setSelectedStage(stg.id);
                      if (stg.id !== 'ALL' && selectedClass !== 'ALL' && !stg.classes.includes(selectedClass)) {
                        setSelectedClass('ALL');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      selectedStage === stg.id
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-white/20'
                        : 'bg-white/5 hover:bg-white/10 text-purple-200 border border-[var(--glass-border)]'
                    }`}
                  >
                    <span>{stg.icon}</span>
                    <span>{stg.shortLabel}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      selectedStage === stg.id ? 'bg-black/40 text-white' : 'bg-purple-950/60 text-purple-300'
                    }`}>
                      {stg.id === 'ALL'
                        ? students.length
                        : students.filter(s => stg.classes.includes(s.className)).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {selectedStage !== 'ALL' && (
              <button
                onClick={() => setSelectedStage('ALL')}
                className="text-xs text-purple-300 hover:text-white underline cursor-pointer shrink-0"
              >
                Reset Stage Filter
              </button>
            )}
          </div>

          {/* Filter & Search Toolbar */}
          <div className="p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search Box */}
              <div className="relative min-w-[240px] flex-1">
                <Search className="w-4 h-4 text-[var(--text-dim)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Name, Student ID, UDISE PEN, APAAR, Aadhaar, Phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white text-xs placeholder:text-[var(--text-dim)] focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Class Filter */}
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="px-3 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Classes ({availableClasses.length})</option>
                {availableClasses.map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>

              {/* Section Filter */}
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="px-3 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Sections</option>
                {availableSections.map(s => (
                  <option key={s} value={s}>Sec {s}</option>
                ))}
              </select>

              {/* Social Category Filter */}
              <select
                value={filterSocialCategory}
                onChange={e => setFilterSocialCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Categories</option>
                <option value="GEN">GEN</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>

              {/* SGC Tag */}
              <select
                value={filterSGC}
                onChange={e => setFilterSGC(e.target.value)}
                className="px-3 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">Single Girl Child: All</option>
                <option value="YES">SGC: YES</option>
                <option value="NO">SGC: NO</option>
              </select>
            </div>

            {/* View Mode & Bulk Delete */}
            <div className="flex items-center gap-2">
              {selectedStudentIds.length > 0 && (
                <button
                  onClick={() => setShowDeleteConfirmModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedStudentIds.length})</span>
                </button>
              )}

              <div className="flex rounded-xl border border-[var(--glass-border)] bg-purple-950/40 p-0.5">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    viewMode === 'table' ? 'bg-purple-600 text-white font-bold' : 'text-[var(--text-dim)] hover:text-white'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    viewMode === 'cards' ? 'bg-purple-600 text-white font-bold' : 'text-[var(--text-dim)] hover:text-white'
                  }`}
                >
                  ID Cards
                </button>
              </div>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' ? (
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] overflow-hidden shadow-xl">
              <div className="overflow-x-auto max-h-[640px] overflow-y-auto scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse min-w-[1900px]">
                  <thead className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md text-purple-200 border-b border-[var(--glass-border)]">
                    <tr>
                      <th className="p-3 w-10 text-center sticky left-0 z-30 bg-slate-900">
                        <input
                          type="checkbox"
                          checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedStudentIds(filteredStudents.map(s => s.id));
                            } else {
                              setSelectedStudentIds([]);
                            }
                          }}
                          className="rounded text-purple-600 focus:ring-0"
                        />
                      </th>
                      <th className="p-3 font-semibold whitespace-nowrap sticky left-10 z-30 bg-slate-900">S.N.</th>
                      <th className="p-3 font-semibold whitespace-nowrap sticky left-20 z-30 bg-slate-900 min-w-[180px]">Name of the Student</th>
                      <th className="p-3 font-semibold whitespace-nowrap">Class-Sec</th>
                      <th className="p-3 font-semibold whitespace-nowrap">Gender</th>
                      <th className="p-3 font-semibold whitespace-nowrap">DOB DD/MM/YYYY</th>
                      <th className="p-3 font-semibold whitespace-nowrap">STUDENT ID</th>
                      <th className="p-3 font-semibold whitespace-nowrap text-purple-300">Date of Admission DD/MM/YYYY</th>
                      <th className="p-3 font-semibold whitespace-nowrap">PEN NO. (From UDISE)</th>
                      <th className="p-3 font-semibold whitespace-nowrap">APAAR ID No.</th>
                      <th className="p-3 font-semibold whitespace-nowrap text-white">FATHER NAME</th>
                      <th className="p-3 font-semibold whitespace-nowrap text-white">MOTHER NAME</th>
                      <th className="p-3 font-semibold whitespace-nowrap">CONTACT NUMBER</th>
                      <th className="p-3 font-semibold whitespace-nowrap text-rose-300">BLOOD GROUP</th>
                      <th className="p-3 font-semibold whitespace-nowrap text-teal-300">HEIGHT (in cm)</th>
                      <th className="p-3 font-semibold whitespace-nowrap text-cyan-300">WEIGHT (in KG)</th>
                      <th className="p-3 font-semibold whitespace-nowrap text-amber-200 min-w-[200px]">COMPLETE ADDRESS</th>
                      <th className="p-3 font-semibold whitespace-nowrap text-indigo-300">ADMISSION CATEGORY</th>
                      <th className="p-3 font-semibold whitespace-nowrap text-purple-300">SOCIAL CATEGORY (GEN/OBC/SC/ST)</th>
                      <th className="p-3 font-semibold whitespace-nowrap text-blue-300">MINORITY (YES/ NO)</th>
                      <th className="p-3 font-semibold whitespace-nowrap text-amber-300">RTE (YES/NO)</th>
                      <th className="p-3 font-semibold whitespace-nowrap text-pink-300">SINGLE GIRL CHILD (Class 6 onwards)</th>
                      <th className="p-3 font-semibold whitespace-nowrap text-emerald-300">AADHAAR NO. OF STUDENT</th>
                      <th className="p-3 font-semibold whitespace-nowrap text-cyan-300">STUDENT EMAIL ID</th>
                      <th className="p-3 text-right font-semibold whitespace-nowrap sticky right-0 z-30 bg-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--glass-border)] text-gray-200">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={25} className="p-8 text-center text-[var(--text-dim)]">
                          No student records matching current filters. Try changing filter criteria or importing students.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, idx) => {
                        const isSelected = selectedStudentIds.includes(student.id);
                        return (
                          <tr
                            key={student.id}
                            className={`hover:bg-purple-950/30 transition-colors ${isSelected ? 'bg-purple-950/50' : ''}`}
                          >
                            <td className="p-3 text-center sticky left-0 z-10 bg-slate-900/90">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedStudentIds([...selectedStudentIds, student.id]);
                                  } else {
                                    setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                  }
                                }}
                                className="rounded text-purple-600 focus:ring-0"
                              />
                            </td>
                            <td className="p-3 font-mono text-[var(--text-dim)] sticky left-10 z-10 bg-slate-900/90">
                              {student.sn || idx + 1}
                            </td>
                            <td className="p-3 sticky left-20 z-10 bg-slate-900/90">
                              <div className="font-semibold text-white flex items-center gap-1.5 whitespace-nowrap">
                                <span>{student.studentName}</span>
                                {student.singleGirlChild === 'YES' && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30" title="Single Girl Child">
                                    SGC
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold font-mono bg-purple-950 border border-purple-500/30 text-purple-300">
                                {student.className}-{student.section}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                student.gender === 'FEMALE' ? 'bg-pink-950/60 text-pink-300' : 'bg-blue-950/60 text-blue-300'
                              }`}>
                                {student.gender}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] whitespace-nowrap text-gray-200">
                              {student.dob || '—'}
                            </td>
                            <td className="p-3 font-mono font-medium text-purple-300 whitespace-nowrap">
                              {student.studentId || '—'}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-purple-200 whitespace-nowrap">
                              {student.admissionDate || '—'}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-emerald-300 whitespace-nowrap">
                              {student.penNo || '—'}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-indigo-300 whitespace-nowrap">
                              {student.apaarId || '—'}
                            </td>
                            <td className="p-3 font-medium text-white whitespace-nowrap">
                              {student.fatherName || '—'}
                            </td>
                            <td className="p-3 font-medium text-white whitespace-nowrap">
                              {student.motherName || '—'}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-gray-300 whitespace-nowrap">
                              {student.contactNumber || '—'}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-950/80 text-rose-300 border border-rose-500/30">
                                {student.bloodGroup || '—'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-teal-300 whitespace-nowrap">
                              {student.height ? `${student.height} cm` : '—'}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-cyan-300 whitespace-nowrap">
                              {student.weight ? `${student.weight} kg` : '—'}
                            </td>
                            <td className="p-3 text-[11px] text-gray-200 min-w-[200px] max-w-[280px] truncate" title={student.completeAddress || student.address || ''}>
                              {student.completeAddress || student.address || '—'}
                            </td>
                            <td className="p-3 text-[11px] text-gray-300 whitespace-nowrap">
                              {student.admissionCategory || '—'}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-purple-900/70 text-purple-200 border border-purple-500/30">
                                {student.socialCategory || 'GEN'}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                student.minority === 'YES'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                                  : 'text-gray-400 bg-white/5'
                              }`}>
                                {student.minority || 'NO'}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                student.rte === 'YES'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                  : 'text-gray-400 bg-white/5'
                              }`}>
                                {student.rte || 'NO'}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                student.singleGirlChild === 'YES'
                                  ? 'bg-pink-950 text-pink-300 border border-pink-500/30'
                                  : 'text-gray-400 bg-white/5'
                              }`}>
                                {student.singleGirlChild || 'NO'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-emerald-300 whitespace-nowrap">
                              {student.aadhaarNo || '—'}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-indigo-200 whitespace-nowrap">
                              {student.studentEmail || '—'}
                            </td>
                            <td className="p-3 text-right sticky right-0 z-10 bg-slate-900/90 whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setViewingStudent(student)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 cursor-pointer transition-colors"
                                  title="View Full Profile Bio"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(student)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-blue-300 cursor-pointer transition-colors"
                                  title="Edit Student Data"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setStudentToDelete(student);
                                    setShowDeleteConfirmModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-950 text-rose-400 cursor-pointer transition-colors"
                                  title="Delete Student"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Card / ID Badge Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  className="p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:border-purple-500/50 shadow-lg relative group transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-950 border border-purple-500/30 text-purple-300">
                        Class {student.className}-{student.section}
                      </span>
                      <span className="ml-1.5 text-[10px] font-mono text-[var(--text-dim)]">Roll: #{student.rollNo || student.sn}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        {student.bloodGroup}
                      </span>
                      <button
                        onClick={() => handleOpenEdit(student)}
                        className="p-1 rounded bg-white/5 text-[var(--text-dim)] hover:text-white"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-base font-bold text-white leading-tight flex items-center gap-1.5">
                      <span>{student.studentName}</span>
                      {student.singleGirlChild === 'YES' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                          SGC
                        </span>
                      )}
                    </h3>
                    <div className="text-xs font-mono text-purple-300 mt-0.5">{student.studentId}</div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--glass-border)] space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-[var(--text-dim)]">
                      <span>DOB:</span>
                      <span className="font-mono text-white">{student.dob}</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-dim)]">
                      <span>UDISE PEN:</span>
                      <span className="font-mono text-emerald-300">{student.penNo}</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-dim)]">
                      <span>APAAR ID:</span>
                      <span className="font-mono text-indigo-300">{student.apaarId}</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-dim)]">
                      <span>Father:</span>
                      <span className="text-white truncate max-w-[130px]">{student.fatherName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--text-dim)]">
                      <span>Contact:</span>
                      <span className="font-mono text-white">{student.contactNumber}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-900/60 text-purple-200">
                        {student.socialCategory}
                      </span>
                      {student.rte === 'YES' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                          RTE
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setViewingStudent(student)}
                      className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                    >
                      <span>Full Bio</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: UNIVERSAL FILE IMPORTER */}
      {activeSubTab === 'import' && (
        <div className="space-y-6">
          {/* TOP TEMPLATE DOWNLOAD & FORMAT HUB */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-950/90 via-slate-900/90 to-indigo-950/90 border border-purple-500/30 shadow-xl space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Official KVS Class VI Format Center
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    All 19+ Mandated Columns
                  </span>
                </div>
                <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                  <span>Download Sample & Blank Student Templates</span>
                </h3>
                <p className="text-xs text-[var(--text-dim)] mt-1 max-w-3xl">
                  Download ready-to-use CSV or Excel files with the exact column headers and data formats. You can fill your students' details in Excel or Google Sheets and upload it below for 100% accurate parsing.
                </p>
              </div>

              {copyNotice && (
                <div className="px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{copyNotice}</span>
                </div>
              )}
            </div>

            {/* Template Download Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Card 1: Sample CSV with Data */}
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 hover:border-purple-400/50 transition-all flex flex-col justify-between space-y-3 group">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                      <Download className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                      Class {importTargetClass !== 'AUTO' ? importTargetClass : (selectedClass !== 'ALL' ? selectedClass : 'VII')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">Official Sample CSV (Filled)</h4>
                  <p className="text-[11px] text-[var(--text-dim)] mt-1 leading-relaxed">
                    Complete sample CSV file containing all 22 official columns with realistic student data for reference and testing.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => downloadSampleCSVFile(importTargetClass !== 'AUTO' ? importTargetClass : (selectedClass !== 'ALL' ? selectedClass : 'VII'))}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-purple-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={handleCopySampleCSV}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/30 cursor-pointer transition-all"
                    title="Copy Sample CSV to Clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: Blank CSV Template */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 hover:border-indigo-400/50 transition-all flex flex-col justify-between space-y-3 group">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                      22 Headers Ready
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">Blank CSV Import Template</h4>
                  <p className="text-[11px] text-[var(--text-dim)] mt-1 leading-relaxed">
                    Clean CSV template with all 22 official header names (including Height, Weight, Address) ready to paste your roster.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={downloadBlankCSVFile}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-indigo-600/20"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download Blank</span>
                  </button>
                  <button
                    onClick={handleCopyBlankCSV}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-300 border border-indigo-500/30 cursor-pointer transition-all"
                    title="Copy Blank CSV Header to Clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 3: Sample Excel Spreadsheet */}
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 hover:border-blue-400/50 transition-all flex flex-col justify-between space-y-3 group">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                      Excel (.xlsx)
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">Official Excel Template (.xlsx)</h4>
                  <p className="text-[11px] text-[var(--text-dim)] mt-1 leading-relaxed">
                    Native Microsoft Excel workbook with formatted columns, auto-width cells, and pre-configured date/text headers.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => downloadSampleExcelFile(importTargetClass !== 'AUTO' ? importTargetClass : (selectedClass !== 'ALL' ? selectedClass : 'VII'))}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-blue-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Excel (.xlsx)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Test & Format Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-purple-500/20">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLoadSampleToParser}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-950/90 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test: Load Sample CSV in Importer</span>
                </button>

                <button
                  onClick={handleLoadSampleDatabase}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Reset App to Default Demo Roster</span>
                </button>
              </div>

              <div className="text-[11px] text-[var(--text-dim)] font-mono flex items-center gap-2">
                <span>Supported Delimiters:</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-[var(--glass-border)] text-purple-200">, Comma</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-[var(--glass-border)] text-purple-200">| Pipe</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-[var(--glass-border)] text-purple-200">Tab</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-[var(--glass-border)] text-purple-200">; Semicolon</span>
              </div>
            </div>
          </div>

          {/* MAIN UPLOAD & PARSER PANEL */}
          <div className="p-6 rounded-3xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-400" />
                  <span>Universal Student Data Importer</span>
                </h3>
                <p className="text-xs text-[var(--text-dim)] mt-1">
                  Upload your saved CSV, Excel (.xlsx, .xls), TSV, or text file. The intelligent parser matches all columns automatically.
                </p>
              </div>
            </div>

            {/* Sample Data Status Banner */}
            {sampleStudentsCount > 0 && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-200 flex items-center gap-2">
                      <span>{sampleStudentsCount} Sample Demo Students Active</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">Placeholder Data</span>
                    </div>
                    <p className="text-[11px] text-amber-300/80 mt-0.5">
                      You can import your actual Class CSV/Excel file to replace them automatically, or purge demo records now.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearSampleData}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600/80 hover:bg-amber-600 border border-amber-400/40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all shadow-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Demo Records</span>
                </button>
              </div>
            )}

            {/* Column Specification Format Box */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Exact Official Column Order (Auto-Mapped & Auto-Normalized):</span>
                </div>
                <button
                  onClick={handleCopyBlankCSV}
                  className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Header Line</span>
                </button>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-purple-500/20 font-mono text-[11px] text-purple-200 overflow-x-auto whitespace-nowrap select-all scrollbar-thin">
                S.N. | Name of the Student | Gender | DOB DD/MM/YYYY | STUDENT ID | Date of Admission DD/MM/YYYY | PEN NO. (From UDISE) | APAAR ID No. | FATHER NAME | MOTHER NAME | CONTACT NUMBER | BLOOD GROUP | HEIGHT (in cm) | WEIGHT (in KG) | COMPLETE ADDRESS | ADMISSION CATEGORY | SOCIAL CATEGORY (GEN/OBC/SC/ST) | MINORITY (YES/ NO) | RTE (YES/NO) | SINGLE GIRL CHILD (Class 6 onwards) | AADHAAR NO. OF STUDENT | STUDENT EMAIL ID
              </div>
            </div>

            {/* Target Class & Section Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Target Class</label>
                <select
                  value={importTargetClass}
                  onChange={e => handleTargetClassChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="AUTO">Auto-Detect from File / Content ({parseResult?.detectedClass ? `Detected: Class ${parseResult.detectedClass}` : 'Auto / In-File'})</option>
                  <optgroup label="🌱 Foundational Stage (Class 1 & 2)">
                    <option value="I">Class I (Class 1)</option>
                    <option value="II">Class II (Class 2)</option>
                  </optgroup>
                  <optgroup label="📘 Preparatory Stage (Class 3 to 5)">
                    <option value="III">Class III (Class 3)</option>
                    <option value="IV">Class IV (Class 4)</option>
                    <option value="V">Class V (Class 5)</option>
                  </optgroup>
                  <optgroup label="🔬 Middle Stage (Class 6 to 8)">
                    <option value="VI">Class VI (Class 6)</option>
                    <option value="VII">Class VII (Class 7)</option>
                    <option value="VIII">Class VIII (Class 8)</option>
                  </optgroup>
                  <optgroup label="🎓 Secondary Stage (Class 9 to 12)">
                    <option value="IX">Class IX (Class 9)</option>
                    <option value="X">Class X (Class 10)</option>
                    <option value="XI">Class XI (Class 11)</option>
                    <option value="XII">Class XII (Class 12)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Target Section</label>
                <select
                  value={importTargetSection}
                  onChange={e => handleTargetSectionChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Import Mode</label>
                <select
                  value={importMode}
                  onChange={e => setImportMode(e.target.value as 'merge' | 'replace')}
                  className="w-full px-3 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="merge">Merge & Add to Existing Roster</option>
                  <option value="replace">Replace Entire Database Roster</option>
                </select>
              </div>
            </div>

            {/* Auto Purge Demo Checkbox */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-950/20 border border-purple-500/20">
              <input
                type="checkbox"
                id="purgeSampleDataCheck"
                checked={purgeSampleData}
                onChange={e => setPurgeSampleData(e.target.checked)}
                className="rounded text-purple-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="purgeSampleDataCheck" className="text-xs text-purple-200 cursor-pointer font-medium select-none">
                Automatically purge sample / demo student records upon importing actual student data (Recommended)
              </label>
            </div>

            {/* Drag & Drop File Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-2xl border-2 border-dashed border-purple-500/40 hover:border-purple-400 bg-purple-950/20 hover:bg-purple-950/30 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all text-center group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv, .xlsx, .xls, .json, .tsv, .txt"
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <div className="text-base font-semibold text-white">
                  {importFile ? importFile.name : 'Click to Browse or Drag & Drop Student File'}
                </div>
                <p className="text-xs text-[var(--text-dim)] mt-1">
                  Supports CSV, Excel (.xlsx, .xls), TSV, and Pipe-separated text files
                </p>
              </div>
            </div>

            {/* Alternatively: Direct Paste Option */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Or Paste CSV / Table Data Directly:</span>
                </div>
                <button
                  onClick={handleLoadSampleToParser}
                  className="text-xs text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Load Sample Text</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="Paste CSV rows with commas or pipe | separated columns here..."
                className="w-full p-3 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white text-xs font-mono placeholder:text-[var(--text-dim)] focus:outline-none focus:border-purple-500"
              />
              {pastedText.trim() && (
                <button
                  onClick={handleParsePastedText}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Parse Pasted Content</span>
                </button>
              )}
            </div>

            {/* Success Notification */}
            {importSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{importSuccessMsg}</span>
              </div>
            )}

            {/* COLUMN MAPPING INSPECTOR (When File or Text is Parsed) */}
            {parseResult && (
              <div className="space-y-3 p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Column Alignment Inspector</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                      {Object.keys(parseResult.fieldColumnIndices || {}).length} Columns Auto-Mapped
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {Object.keys(manualMapping).length > 0 && (
                      <button
                        onClick={handleResetColumnMapping}
                        className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reset Custom Overrides</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowColumnMapper(!showColumnMapper)}
                      className="text-xs text-purple-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showColumnMapper ? 'Hide Mapping Inspector' : 'View / Adjust Column Alignments'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showColumnMapper ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>

                {showColumnMapper && (
                  <div className="pt-3 border-t border-purple-500/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { key: 'studentName', label: "Student's Name" },
                      { key: 'gender', label: 'Gender' },
                      { key: 'dob', label: 'DOB (DD/MM/YYYY)' },
                      { key: 'studentId', label: 'STUDENT ID' },
                      { key: 'admissionDate', label: 'Date of Admission' },
                      { key: 'penNo', label: 'PEN NO. (From UDISE)' },
                      { key: 'apaarId', label: 'APAAR ID No.' },
                      { key: 'fatherName', label: 'FATHER NAME' },
                      { key: 'motherName', label: 'MOTHER NAME' },
                      { key: 'contactNumber', label: 'CONTACT NUMBER' },
                      { key: 'bloodGroup', label: 'BLOOD GROUP' },
                      { key: 'height', label: 'HEIGHT (in cm)' },
                      { key: 'weight', label: 'WEIGHT (in KG)' },
                      { key: 'completeAddress', label: 'COMPLETE ADDRESS' },
                      { key: 'admissionCategory', label: 'ADMISSION CATEGORY' },
                      { key: 'socialCategory', label: 'SOCIAL CATEGORY' },
                      { key: 'minority', label: 'MINORITY (YES/ NO)' },
                      { key: 'rte', label: 'RTE (YES/NO)' },
                      { key: 'singleGirlChild', label: 'SINGLE GIRL CHILD' },
                      { key: 'aadhaarNo', label: 'AADHAAR NO.' },
                      { key: 'studentEmail', label: 'STUDENT EMAIL ID' },
                      { key: 'className', label: 'Class' },
                      { key: 'section', label: 'Section' },
                      { key: 'sn', label: 'Serial No. / Roll' }
                    ].map(field => {
                      const detectedColIdx = parseResult.fieldColumnIndices?.[field.key];
                      const currentIdx = manualMapping[field.key] !== undefined ? manualMapping[field.key] : detectedColIdx;
                      return (
                        <div key={field.key} className="p-2.5 rounded-xl bg-black/40 border border-[var(--glass-border)] space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-purple-200">{field.label}</span>
                            {detectedColIdx !== undefined ? (
                              <span className="text-[9px] font-mono text-emerald-400">Auto-Mapped (Col {detectedColIdx + 1})</span>
                            ) : (
                              <span className="text-[9px] font-mono text-amber-400">Unmatched</span>
                            )}
                          </div>
                          <select
                            value={currentIdx !== undefined ? String(currentIdx) : '-1'}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              if (val >= 0) {
                                handleUpdateColumnMapping(field.key, val);
                              }
                            }}
                            className="w-full px-2 py-1 rounded-lg bg-purple-950/60 border border-[var(--glass-border)] text-white text-[11px] focus:outline-none focus:border-purple-500"
                          >
                            <option value="-1">-- Select Column --</option>
                            {(parseResult.rawHeaders || []).map((headerName, idx) => (
                              <option key={idx} value={idx}>
                                Col {idx + 1}: {headerName || `Column ${idx + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Parsed Data Preview Table */}
            {parseResult && (
              <div className="space-y-4 pt-4 border-t border-[var(--glass-border)]">
                <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Target Class for Import:</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-600 text-white font-mono font-bold">
                        Class {importTargetClass !== 'AUTO' ? importTargetClass : (parseResult.detectedClass || 'VII')} - {importTargetSection}
                      </span>
                    </div>
                    {parseResult.detectedClass && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                        Auto-detected from file: Class {parseResult.detectedClass}
                      </span>
                    )}
                    <span className="text-xs text-[var(--text-dim)]">| Quick Switch:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Foundational Stage (Class 1 & 2) */}
                      <div className="flex items-center gap-1 bg-emerald-950/40 px-1.5 py-0.5 rounded-lg border border-emerald-500/20">
                        <span className="text-[10px] font-bold text-emerald-300">🌱 Foundational:</span>
                        {['I', 'II'].map(c => (
                          <button
                            key={c}
                            onClick={() => handleTargetClassChange(c)}
                            title={`Class ${c} (Class ${c === 'I' ? '1' : '2'})`}
                            className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                              (importTargetClass === c || (importTargetClass === 'AUTO' && parseResult.detectedClass === c))
                                ? 'bg-emerald-500 text-white shadow ring-1 ring-white/50'
                                : 'bg-white/5 hover:bg-white/10 text-emerald-200'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>

                      {/* Preparatory Stage (Class 3 to 5) */}
                      <div className="flex items-center gap-1 bg-blue-950/40 px-1.5 py-0.5 rounded-lg border border-blue-500/20">
                        <span className="text-[10px] font-bold text-blue-300">📘 Preparatory:</span>
                        {['III', 'IV', 'V'].map(c => (
                          <button
                            key={c}
                            onClick={() => handleTargetClassChange(c)}
                            title={`Class ${c} (Class ${c === 'III' ? '3' : c === 'IV' ? '4' : '5'})`}
                            className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                              (importTargetClass === c || (importTargetClass === 'AUTO' && parseResult.detectedClass === c))
                                ? 'bg-blue-500 text-white shadow ring-1 ring-white/50'
                                : 'bg-white/5 hover:bg-white/10 text-blue-200'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>

                      {/* Middle Stage (Class 6 to 8) */}
                      <div className="flex items-center gap-1 bg-purple-950/40 px-1.5 py-0.5 rounded-lg border border-purple-500/20">
                        <span className="text-[10px] font-bold text-purple-300">🔬 Middle:</span>
                        {['VI', 'VII', 'VIII'].map(c => (
                          <button
                            key={c}
                            onClick={() => handleTargetClassChange(c)}
                            title={`Class ${c}`}
                            className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                              (importTargetClass === c || (importTargetClass === 'AUTO' && parseResult.detectedClass === c))
                                ? 'bg-purple-500 text-white shadow ring-1 ring-white/50'
                                : 'bg-white/5 hover:bg-white/10 text-purple-200'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>

                      {/* Secondary Stage (Class 9 to 12) */}
                      <div className="flex items-center gap-1 bg-indigo-950/40 px-1.5 py-0.5 rounded-lg border border-indigo-500/20">
                        <span className="text-[10px] font-bold text-indigo-300">🎓 Secondary:</span>
                        {['IX', 'X', 'XI', 'XII'].map(c => (
                          <button
                            key={c}
                            onClick={() => handleTargetClassChange(c)}
                            title={`Class ${c}`}
                            className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                              (importTargetClass === c || (importTargetClass === 'AUTO' && parseResult.detectedClass === c))
                                ? 'bg-indigo-500 text-white shadow ring-1 ring-white/50'
                                : 'bg-white/5 hover:bg-white/10 text-indigo-200'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-dim)]">Section:</span>
                    {['A', 'B', 'C', 'D'].map(sec => (
                      <button
                        key={sec}
                        onClick={() => handleTargetSectionChange(sec)}
                        className={`w-6 h-6 rounded-md text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                          importTargetSection === sec
                            ? 'bg-purple-500 text-white shadow'
                            : 'bg-white/5 hover:bg-white/10 text-purple-300'
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Parsed Preview</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      {parseResult.validRows} Verified Records Ready
                    </span>
                    {purgeSampleData && sampleStudentsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Will replace {sampleStudentsCount} demo records
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleCommitImport}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Import {parseResult.validRows} Students into Class {importTargetClass !== 'AUTO' ? importTargetClass : (parseResult.detectedClass || 'VII')}-{importTargetSection} Roster</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-[var(--glass-border)] overflow-hidden bg-[var(--glass-bg)] shadow-lg">
                  <div className="overflow-x-auto max-h-[480px]">
                    <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                      <thead className="sticky top-0 bg-slate-900 text-purple-200 border-b border-[var(--glass-border)] z-10 font-bold">
                        <tr>
                          <th className="p-3 font-bold sticky left-0 bg-slate-900 z-20 border-r border-[var(--glass-border)] text-purple-200">S.N.</th>
                          <th className="p-3 font-bold sticky left-12 bg-slate-900 z-20 border-r border-[var(--glass-border)] text-purple-200">Name of the Student</th>
                          <th className="p-3 font-bold text-white">Gender</th>
                          <th className="p-3 font-bold text-white">DOB DD/MM/YYYY</th>
                          <th className="p-3 font-bold text-purple-300">STUDENT ID</th>
                          <th className="p-3 font-bold text-purple-300">Date of Admission</th>
                          <th className="p-3 font-bold text-emerald-300">PEN NO. (UDISE)</th>
                          <th className="p-3 font-bold text-indigo-300">APAAR ID No.</th>
                          <th className="p-3 font-bold text-white">FATHER NAME</th>
                          <th className="p-3 font-bold text-white">MOTHER NAME</th>
                          <th className="p-3 font-bold text-white">CONTACT NUMBER</th>
                          <th className="p-3 font-bold text-rose-300">BLOOD GROUP</th>
                          <th className="p-3 font-bold text-teal-300">HEIGHT (cm)</th>
                          <th className="p-3 font-bold text-cyan-300">WEIGHT (kg)</th>
                          <th className="p-3 font-bold text-amber-200">COMPLETE ADDRESS</th>
                          <th className="p-3 font-bold text-indigo-300">ADMISSION CATEGORY</th>
                          <th className="p-3 font-bold text-purple-300">SOCIAL CATEGORY</th>
                          <th className="p-3 font-bold text-blue-300">MINORITY</th>
                          <th className="p-3 font-bold text-amber-300">RTE</th>
                          <th className="p-3 font-bold text-pink-300">SINGLE GIRL CHILD</th>
                          <th className="p-3 font-bold text-emerald-300">AADHAAR NO.</th>
                          <th className="p-3 font-bold text-cyan-300">STUDENT EMAIL ID</th>
                          <th className="p-3 font-bold text-purple-300">Class & Sec</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--glass-border)] text-gray-200">
                        {parseResult.students.map((s, i) => (
                          <tr key={i} className="hover:bg-purple-950/30 transition-colors">
                            <td className="p-3 font-mono text-[var(--text-dim)] sticky left-0 bg-slate-900/90 border-r border-[var(--glass-border)]">{s.sn || i + 1}</td>
                            <td className="p-3 font-semibold text-white sticky left-12 bg-slate-900/90 border-r border-[var(--glass-border)]">{s.studentName}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                  s.gender === 'FEMALE'
                                    ? 'bg-pink-950/60 text-pink-300'
                                    : 'bg-blue-950/60 text-blue-300'
                                }`}
                              >
                                {s.gender}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-gray-200">{s.dob}</td>
                            <td className="p-3 font-mono text-purple-300">{s.studentId}</td>
                            <td className="p-3 font-mono text-purple-200">{s.admissionDate || '-'}</td>
                            <td className="p-3 font-mono text-emerald-300">{s.penNo || '-'}</td>
                            <td className="p-3 font-mono text-indigo-300">{s.apaarId || '-'}</td>
                            <td className="p-3 text-white">{s.fatherName || '-'}</td>
                            <td className="p-3 text-white">{s.motherName || '-'}</td>
                            <td className="p-3 font-mono text-gray-300">{s.contactNumber || '-'}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/30">
                                {s.bloodGroup || 'B+'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-teal-300">{s.height ? `${s.height} cm` : '-'}</td>
                            <td className="p-3 font-mono text-[11px] text-cyan-300">{s.weight ? `${s.weight} kg` : '-'}</td>
                            <td className="p-3 text-[11px] text-gray-200 max-w-[200px] truncate" title={s.completeAddress || s.address || ''}>
                              {s.completeAddress || s.address || '-'}
                            </td>
                            <td className="p-3 text-[11px] text-gray-300">{s.admissionCategory || '-'}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-900/70 text-purple-200 border border-purple-500/30">
                                {s.socialCategory || 'GEN'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.minority === 'YES' ? 'bg-blue-950 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-gray-400'}`}>
                                {s.minority || 'NO'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.rte === 'YES' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-gray-400'}`}>
                                {s.rte || 'NO'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.singleGirlChild === 'YES' ? 'bg-pink-950 text-pink-300 border border-pink-500/30' : 'bg-white/5 text-gray-400'}`}>
                                {s.singleGirlChild || 'NO'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-emerald-300">{s.aadhaarNo || '-'}</td>
                            <td className="p-3 font-mono text-[11px] text-indigo-300">{s.studentEmail || '-'}</td>
                            <td className="p-3 font-mono text-purple-300">
                              {s.className || importTargetClass}-{s.section || importTargetSection}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: P-29 PRACTICAL ATTENDANCE LOGGER */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-xl space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    P-29 · 17(i) Attendance in Practical Classes
                  </span>
                </div>
                <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <span>Student Practical Attendance Register & Auto-Sync to Daily Lesson Plan</span>
                </h3>
                <p className="text-xs text-[var(--text-dim)] mt-1">
                  Mark Present (P) / Absent (A) for any laboratory or practical period. The total receiving the lesson automatically syncs with the Daily Lesson Plan of that date.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Mark All Present</span>
                </button>

                <button
                  onClick={handleSavePracticalAttendance}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Save & Sync to Daily Lesson Plan</span>
                </button>
              </div>
            </div>

            {/* Attendance Settings & Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-2xl bg-purple-950/40 border border-[var(--glass-border)]">
              <div>
                <label className="block text-[11px] font-medium text-purple-200 mb-1">Class</label>
                <select
                  value={attClass}
                  onChange={e => setAttClass(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500 font-semibold"
                >
                  {availableClasses.map(c => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-purple-200 mb-1">Section</label>
                <select
                  value={attSection}
                  onChange={e => setAttSection(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500 font-semibold"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-purple-200 mb-1">Subject</label>
                <input
                  type="text"
                  value={attSubject}
                  onChange={e => setAttSubject(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-purple-200 mb-1">Practical Date</label>
                <input
                  type="date"
                  value={attDate}
                  onChange={e => setAttDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-purple-200 mb-1">Period No.</label>
                <select
                  value={attPeriodNo}
                  onChange={e => setAttPeriodNo(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="1st Period">1st Period</option>
                  <option value="2nd Period">2nd Period</option>
                  <option value="3rd Period">3rd Period</option>
                  <option value="4th Period">4th Period</option>
                  <option value="5th Period">5th Period</option>
                  <option value="6th Period">6th Period</option>
                  <option value="7th Period">7th Period</option>
                  <option value="8th Period">8th Period</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-purple-200 mb-1">Practical / Lab Activity No.</label>
                <input
                  type="text"
                  value={attPracticalNo}
                  onChange={e => setAttPracticalNo(e.target.value)}
                  placeholder="e.g. Maths Lab Activity 1 / Physics Exp 3"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-purple-200 mb-1">Practical Title & Concept Description</label>
                <input
                  type="text"
                  value={attPracticalTitle}
                  onChange={e => setAttPracticalTitle(e.target.value)}
                  placeholder="e.g. Constructing Square Root Spiral on square grid"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Sync Notification Banner */}
            {attSyncSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 shadow-md font-semibold animate-fadeIn">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{attSyncSuccess}</span>
              </div>
            )}

            {/* Enrolled Students Attendance Grid */}
            {(() => {
              const enrolled = students.filter(s => s.className === attClass && s.section === attSection);
              const presentCount = enrolled.filter(s => (currentAttendanceMap[s.id] || 'P') === 'P').length;
              const absentCount = enrolled.length - presentCount;
              const pct = Math.round((presentCount / (enrolled.length || 1)) * 100);

              return (
                <div className="space-y-4">
                  {/* Attendance Stats Strip */}
                  <div className="flex flex-wrap items-center justify-between p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 text-xs">
                    <div className="flex items-center gap-4">
                      <span className="text-[var(--text-dim)]">
                        Total Enrolled: <strong className="font-mono text-white">{enrolled.length}</strong>
                      </span>
                      <span className="text-emerald-400">
                        Present (Receiving Lesson): <strong className="font-mono">{presentCount}</strong>
                      </span>
                      <span className="text-rose-400">
                        Absent: <strong className="font-mono">{absentCount}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-dim)]">Class Attendance Rate:</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-lg ${
                        pct >= 85 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {enrolled.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-purple-950/20 border border-[var(--glass-border)] text-[var(--text-dim)]">
                      No students enrolled in Class {attClass}-{attSection}. Please add or import students for this class.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-900 text-purple-200 border-b border-[var(--glass-border)]">
                          <tr>
                            <th className="p-3">Roll / S.N.</th>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">STUDENT ID</th>
                            <th className="p-3">UDISE PEN</th>
                            <th className="p-3 text-center">Attendance Status</th>
                            <th className="p-3 text-right">Toggle Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--glass-border)] text-gray-200">
                          {enrolled.map((student, idx) => {
                            const status = currentAttendanceMap[student.id] || 'P';
                            return (
                              <tr key={student.id} className="hover:bg-purple-950/30">
                                <td className="p-3 font-mono">{student.rollNo || idx + 1}</td>
                                <td className="p-3 font-semibold text-white">{student.studentName}</td>
                                <td className="p-3 font-mono text-purple-300">{student.studentId}</td>
                                <td className="p-3 font-mono text-emerald-300">{student.penNo}</td>
                                <td className="p-3 text-center">
                                  <span className={`px-3 py-1 rounded-lg font-bold text-xs font-mono ${
                                    status === 'P'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                      : status === 'A'
                                      ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                                      : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                  }`}>
                                    {status === 'P' ? 'PRESENT' : status === 'A' ? 'ABSENT' : 'LATE'}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleToggleAttendance(student.id)}
                                    className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-[var(--glass-border)] cursor-pointer"
                                  >
                                    Switch Status
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: P-22 SCHOLASTIC ASSESSMENT RECORD */}
      {activeSubTab === 'scholastic' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-xl space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    P-22 · 17(a) Scholastic Assessment Record Classes VI-VIII
                  </span>
                </div>
                <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>Scholastic Assessment Records & Marks Tabulator</span>
                </h3>
                <p className="text-xs text-[var(--text-dim)] mt-1">
                  Evaluate PT-1, PT-2, Notebook, Subject Enrichment, MDP, Learners Diary & Half Yearly. Total out of 100 and CBSE Grades (A1-E) calculate automatically.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveScholasticRecords}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Assessment Marks</span>
                </button>
              </div>
            </div>

            {/* Class & Subject Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Class</label>
                <select
                  value={schClass}
                  onChange={e => setSchClass(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="VI">Class VI</option>
                  <option value="VII">Class VII</option>
                  <option value="VIII">Class VIII</option>
                  <option value="IX">Class IX</option>
                  <option value="X">Class X</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Section</label>
                <select
                  value={schSection}
                  onChange={e => setSchSection(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1">Subject</label>
                <input
                  type="text"
                  value={schSubject}
                  onChange={e => setSchSubject(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {schSaveNotice && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{schSaveNotice}</span>
              </div>
            )}

            {/* Assessment Marks Entry Table */}
            {(() => {
              const enrolled = students.filter(s => s.className === schClass && s.section === schSection);
              if (enrolled.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl bg-purple-950/20 border border-[var(--glass-border)] text-[var(--text-dim)]">
                    No students enrolled in Class {schClass}-{schSection}.
                  </div>
                );
              }

              return (
                <div className="rounded-2xl border border-[var(--glass-border)] overflow-hidden shadow-xl">
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 z-10 bg-slate-900 text-purple-200 border-b border-[var(--glass-border)] font-semibold">
                        <tr>
                          <th className="p-2.5">Roll</th>
                          <th className="p-2.5">Student Name</th>
                          <th className="p-2.5">PT-1 (10)</th>
                          <th className="p-2.5">PT-2 (10)</th>
                          <th className="p-2.5">Notebook (5)</th>
                          <th className="p-2.5">Sub Enrich (5)</th>
                          <th className="p-2.5">MDP (5)</th>
                          <th className="p-2.5">Learners Diary (5)</th>
                          <th className="p-2.5">Half Yearly (80)</th>
                          <th className="p-2.5 font-bold text-white">Total (100)</th>
                          <th className="p-2.5 font-bold text-emerald-400">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--glass-border)] text-gray-200">
                        {enrolled.map((student, idx) => {
                          const record = scholasticScoresVI.find(
                            s => s.studentId === student.id && s.subjectName === schSubject
                          );

                          return (
                            <tr key={student.id} className="hover:bg-purple-950/30 transition-colors">
                              <td className="p-2.5 font-mono text-[var(--text-dim)]">{student.rollNo || idx + 1}</td>
                              <td className="p-2.5 font-semibold text-white">{student.studentName}</td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  max={10}
                                  min={0}
                                  step="0.5"
                                  value={record?.pt1 ?? ''}
                                  onChange={e => handleUpdateScholasticScoreVI(student.id, 'pt1', parseFloat(e.target.value) || 0)}
                                  className="w-16 px-2 py-1 rounded bg-purple-950/60 border border-[var(--glass-border)] text-white font-mono text-center"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  max={10}
                                  min={0}
                                  step="0.5"
                                  value={record?.pt2 ?? ''}
                                  onChange={e => handleUpdateScholasticScoreVI(student.id, 'pt2', parseFloat(e.target.value) || 0)}
                                  className="w-16 px-2 py-1 rounded bg-purple-950/60 border border-[var(--glass-border)] text-white font-mono text-center"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  max={5}
                                  min={0}
                                  step="0.5"
                                  value={record?.notebook ?? ''}
                                  onChange={e => handleUpdateScholasticScoreVI(student.id, 'notebook', parseFloat(e.target.value) || 0)}
                                  className="w-14 px-2 py-1 rounded bg-purple-950/60 border border-[var(--glass-border)] text-white font-mono text-center"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  max={5}
                                  min={0}
                                  step="0.5"
                                  value={record?.subjectEnrichment ?? ''}
                                  onChange={e => handleUpdateScholasticScoreVI(student.id, 'subjectEnrichment', parseFloat(e.target.value) || 0)}
                                  className="w-14 px-2 py-1 rounded bg-purple-950/60 border border-[var(--glass-border)] text-white font-mono text-center"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  max={5}
                                  min={0}
                                  step="0.5"
                                  value={record?.mdp ?? ''}
                                  onChange={e => handleUpdateScholasticScoreVI(student.id, 'mdp', parseFloat(e.target.value) || 0)}
                                  className="w-14 px-2 py-1 rounded bg-purple-950/60 border border-[var(--glass-border)] text-white font-mono text-center"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  max={5}
                                  min={0}
                                  step="0.5"
                                  value={record?.learnersDiary ?? ''}
                                  onChange={e => handleUpdateScholasticScoreVI(student.id, 'learnersDiary', parseFloat(e.target.value) || 0)}
                                  className="w-14 px-2 py-1 rounded bg-purple-950/60 border border-[var(--glass-border)] text-white font-mono text-center"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="number"
                                  max={80}
                                  min={0}
                                  value={record?.halfYearly ?? ''}
                                  onChange={e => handleUpdateScholasticScoreVI(student.id, 'halfYearly', parseFloat(e.target.value) || 0)}
                                  className="w-16 px-2 py-1 rounded bg-purple-950/60 border border-[var(--glass-border)] text-white font-mono text-center"
                                />
                              </td>
                              <td className="p-2.5 font-bold font-mono text-white">
                                {record?.totalMarks ?? 0}
                              </td>
                              <td className="p-2.5 font-bold font-mono">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  (record?.grade || 'E').startsWith('A')
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : (record?.grade || 'E').startsWith('B')
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {record?.grade || 'E'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SINGLE STUDENT DETAIL BIO MODAL */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-[var(--glass-border)] p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg">
                  {viewingStudent.studentName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-white">{viewingStudent.studentName}</h3>
                  <div className="text-xs font-mono text-purple-300">
                    Class {viewingStudent.className}-{viewingStudent.section} · Student ID: {viewingStudent.studentId}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewingStudent(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-purple-950/40 border border-purple-500/20 text-xs">
              <div>
                <span className="text-[var(--text-dim)]">UDISE PEN NO:</span>
                <div className="font-mono font-bold text-emerald-300 mt-0.5">{viewingStudent.penNo}</div>
              </div>
              <div>
                <span className="text-[var(--text-dim)]">APAAR ID NO:</span>
                <div className="font-mono font-bold text-indigo-300 mt-0.5">{viewingStudent.apaarId}</div>
              </div>
              <div>
                <span className="text-[var(--text-dim)]">Aadhaar No:</span>
                <div className="font-mono font-bold text-white mt-0.5">{viewingStudent.aadhaarNo || 'Verified'}</div>
              </div>
              <div>
                <span className="text-[var(--text-dim)]">DOB (DD/MM/YYYY):</span>
                <div className="font-mono font-bold text-white mt-0.5">{viewingStudent.dob}</div>
              </div>
              <div>
                <span className="text-[var(--text-dim)]">Admission Date:</span>
                <div className="font-mono font-bold text-white mt-0.5">{viewingStudent.admissionDate}</div>
              </div>
              <div>
                <span className="text-[var(--text-dim)]">Blood Group:</span>
                <div className="font-mono font-bold text-emerald-300 mt-0.5">{viewingStudent.bloodGroup}</div>
              </div>
              <div>
                <span className="text-[var(--text-dim)]">Height:</span>
                <div className="font-mono font-bold text-teal-300 mt-0.5">{viewingStudent.height ? `${viewingStudent.height} cm` : 'N/A'}</div>
              </div>
              <div>
                <span className="text-[var(--text-dim)]">Weight:</span>
                <div className="font-mono font-bold text-cyan-300 mt-0.5">{viewingStudent.weight ? `${viewingStudent.weight} kg` : 'N/A'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-[var(--glass-border)] space-y-2">
                <div className="font-bold text-purple-300">Parent / Guardian & Address</div>
                <div className="text-[var(--text-dim)]">Father: <strong className="text-white">{viewingStudent.fatherName || 'N/A'}</strong></div>
                <div className="text-[var(--text-dim)]">Mother: <strong className="text-white">{viewingStudent.motherName || 'N/A'}</strong></div>
                <div className="text-[var(--text-dim)]">Contact Phone: <strong className="text-white font-mono">{viewingStudent.contactNumber}</strong></div>
                <div className="text-[var(--text-dim)]">Complete Address: <span className="text-gray-200">{viewingStudent.completeAddress || viewingStudent.address || 'KV Staff / City Resident'}</span></div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-950/20 border border-[var(--glass-border)] space-y-2">
                <div className="font-bold text-purple-300">Category & Policy Tags</div>
                <div className="text-[var(--text-dim)]">Admission Category: <span className="text-white font-bold">{viewingStudent.admissionCategory}</span></div>
                <div className="text-[var(--text-dim)]">Social Category: <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-900/60 text-purple-200">{viewingStudent.socialCategory}</span></div>
                <div className="text-[var(--text-dim)]">Single Girl Child (SGC): <span className="text-white font-bold">{viewingStudent.singleGirlChild}</span></div>
                <div className="text-[var(--text-dim)]">RTE (25% Quota): <span className="text-white font-bold">{viewingStudent.rte}</span></div>
                <div className="text-[var(--text-dim)]">Minority Student: <span className="text-white font-bold">{viewingStudent.minority}</span></div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--glass-border)]">
              <button
                onClick={() => {
                  const student = viewingStudent;
                  setViewingStudent(null);
                  handleOpenEdit(student);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs cursor-pointer"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT STUDENT MODAL */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-[var(--glass-border)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-4">
              <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <span>{editingStudent ? 'Edit Student Profile' : 'Add New Student Record'}</span>
              </h3>
              <button
                onClick={() => setShowStudentModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[var(--text-dim)] mb-1">Name of the Student *</label>
                <input
                  type="text"
                  value={studentFormData.studentName || ''}
                  onChange={e => setStudentFormData({ ...studentFormData, studentName: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Class *</label>
                <select
                  value={studentFormData.className || 'I'}
                  onChange={e => setStudentFormData({ ...studentFormData, className: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
                >
                  <optgroup label="🌱 Foundational Stage (Class 1 & 2)">
                    <option value="I">Class I (Class 1)</option>
                    <option value="II">Class II (Class 2)</option>
                  </optgroup>
                  <optgroup label="📘 Preparatory Stage (Class 3 to 5)">
                    <option value="III">Class III (Class 3)</option>
                    <option value="IV">Class IV (Class 4)</option>
                    <option value="V">Class V (Class 5)</option>
                  </optgroup>
                  <optgroup label="🔬 Middle Stage (Class 6 to 8)">
                    <option value="VI">Class VI (Class 6)</option>
                    <option value="VII">Class VII (Class 7)</option>
                    <option value="VIII">Class VIII (Class 8)</option>
                  </optgroup>
                  <optgroup label="🎓 Secondary Stage (Class 9 to 12)">
                    <option value="IX">Class IX (Class 9)</option>
                    <option value="X">Class X (Class 10)</option>
                    <option value="XI">Class XI (Class 11)</option>
                    <option value="XII">Class XII (Class 12)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Section *</label>
                <input
                  type="text"
                  value={studentFormData.section || 'A'}
                  onChange={e => setStudentFormData({ ...studentFormData, section: e.target.value })}
                  placeholder="e.g. A"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">STUDENT ID</label>
                <input
                  type="text"
                  value={studentFormData.studentId || ''}
                  onChange={e => setStudentFormData({ ...studentFormData, studentId: e.target.value })}
                  placeholder="e.g. KV-2025-0601"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Gender</label>
                <select
                  value={studentFormData.gender || 'MALE'}
                  onChange={e => setStudentFormData({ ...studentFormData, gender: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">DOB (DD/MM/YYYY)</label>
                <input
                  type="text"
                  value={studentFormData.dob || ''}
                  onChange={e => setStudentFormData({ ...studentFormData, dob: e.target.value })}
                  placeholder="e.g. 12/05/2013"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Date of Admission (DD/MM/YYYY)</label>
                <input
                  type="text"
                  value={studentFormData.admissionDate || ''}
                  onChange={e => setStudentFormData({ ...studentFormData, admissionDate: e.target.value })}
                  placeholder="e.g. 01/04/2024"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">PEN NO. (From UDISE)</label>
                <input
                  type="text"
                  value={studentFormData.penNo || ''}
                  onChange={e => setStudentFormData({ ...studentFormData, penNo: e.target.value })}
                  placeholder="e.g. 21170104201001"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">APAAR ID No.</label>
                <input
                  type="text"
                  value={studentFormData.apaarId || ''}
                  onChange={e => setStudentFormData({ ...studentFormData, apaarId: e.target.value })}
                  placeholder="e.g. 984210492801"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Aadhaar No.</label>
                <input
                  type="text"
                  value={studentFormData.aadhaarNo || ''}
                  onChange={e => setStudentFormData({ ...studentFormData, aadhaarNo: e.target.value })}
                  placeholder="e.g. 4829-1029-4821"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Father Name</label>
                <input
                  type="text"
                  value={studentFormData.fatherName || ''}
                  onChange={e => setStudentFormData({ ...studentFormData, fatherName: e.target.value })}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Mother Name</label>
                <input
                  type="text"
                  value={studentFormData.motherName || ''}
                  onChange={e => setStudentFormData({ ...studentFormData, motherName: e.target.value })}
                  placeholder="e.g. Meena Sharma"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Contact Number</label>
                <input
                  type="text"
                  value={studentFormData.contactNumber || ''}
                  onChange={e => setStudentFormData({ ...studentFormData, contactNumber: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Student Email ID</label>
                <input
                  type="email"
                  value={studentFormData.studentEmail || ''}
                  onChange={e => setStudentFormData({ ...studentFormData, studentEmail: e.target.value })}
                  placeholder="e.g. aarav.sharma@kvschool.edu.in"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Blood Group</label>
                <select
                  value={studentFormData.bloodGroup || 'B+'}
                  onChange={e => setStudentFormData({ ...studentFormData, bloodGroup: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Height (in cm)</label>
                <input
                  type="text"
                  value={studentFormData.height || ''}
                  onChange={e => setStudentFormData({ ...studentFormData, height: e.target.value })}
                  placeholder="e.g. 142"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Weight (in KG)</label>
                <input
                  type="text"
                  value={studentFormData.weight || ''}
                  onChange={e => setStudentFormData({ ...studentFormData, weight: e.target.value })}
                  placeholder="e.g. 36"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[var(--text-dim)] mb-1">Complete Address</label>
                <input
                  type="text"
                  value={studentFormData.completeAddress || studentFormData.address || ''}
                  onChange={e => setStudentFormData({ ...studentFormData, completeAddress: e.target.value, address: e.target.value })}
                  placeholder="e.g. Qtr No. 42/B, Type-III, Sector-4, KV Campus, New Delhi - 110001"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Social Category</label>
                <select
                  value={studentFormData.socialCategory || 'GEN'}
                  onChange={e => setStudentFormData({ ...studentFormData, socialCategory: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="GEN">GEN</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Admission Category</label>
                <input
                  type="text"
                  value={studentFormData.admissionCategory || 'Cat-1 (Central Govt.)'}
                  onChange={e => setStudentFormData({ ...studentFormData, admissionCategory: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Single Girl Child (SGC)</label>
                <select
                  value={studentFormData.singleGirlChild || 'NO'}
                  onChange={e => setStudentFormData({ ...studentFormData, singleGirlChild: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="NO">NO</option>
                  <option value="YES">YES</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">RTE (25% Quota)</label>
                <select
                  value={studentFormData.rte || 'NO'}
                  onChange={e => setStudentFormData({ ...studentFormData, rte: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="NO">NO</option>
                  <option value="YES">YES</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-dim)] mb-1">Minority (YES/NO)</label>
                <select
                  value={studentFormData.minority || 'NO'}
                  onChange={e => setStudentFormData({ ...studentFormData, minority: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-[var(--glass-border)] text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="NO">NO</option>
                  <option value="YES">YES</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--glass-border)]">
              <button
                onClick={() => setShowStudentModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveStudentForm}
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 cursor-pointer"
              >
                {editingStudent ? 'Update Record' : 'Save Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Deletion</h3>
                <div className="text-xs text-rose-300 font-mono">This action is irreversible.</div>
              </div>
            </div>

            <p className="text-xs text-[var(--text-dim)] leading-relaxed">
              {studentToDelete
                ? `Are you sure you want to permanently delete student "${studentToDelete.studentName}" (${studentToDelete.studentId})?`
                : `Are you sure you want to delete ${selectedStudentIds.length} selected students?`}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setStudentToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (studentToDelete) {
                    handleDeleteStudent(studentToDelete);
                  } else {
                    handleBulkDelete();
                  }
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
