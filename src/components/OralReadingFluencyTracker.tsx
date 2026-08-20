import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  OralReadingFluencyRecord,
  StudentProfile,
  OrfRangeGroup
} from '../types/academic';
import {
  db,
  DEFAULT_ORF_TARA,
  DEFAULT_STUDENTS
} from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  Mic,
  Activity,
  Search,
  CheckCircle2,
  Sliders,
  Sparkles,
  Award,
  Zap,
  TrendingUp,
  Save,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Printer,
  Users,
  AlertCircle,
  FileText,
  Check,
  X,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Layers,
  BarChart2,
  Headphones,
  Volume2
} from 'lucide-react';

interface OralReadingFluencyTrackerProps {
  devMode: boolean;
}

// Class-specific NIPUN targets for Oral Reading Fluency (WCPM with comprehension)
export const NIPUN_BENCHMARKS: Record<string, { label: string; minWcpm: number; targetWcpm: number }> = {
  'I': { label: 'Class I', minWcpm: 20, targetWcpm: 30 },
  'II': { label: 'Class II', minWcpm: 30, targetWcpm: 45 },
  'III': { label: 'Class III', minWcpm: 45, targetWcpm: 60 },
  'IV': { label: 'Class IV', minWcpm: 60, targetWcpm: 75 },
  'V': { label: 'Class V', minWcpm: 75, targetWcpm: 90 }
};

export const REMEDIAL_STRATEGY_PRESETS = [
  'Daily paired oral reading sessions using TARA audio storybooks & decodable readers',
  '10-minute sight word & matra flashcard drills with peer mentor support',
  'Choral reading of NCERT Sarangi/Mridang stories with teacher modeling and echo drills',
  'Phoneme blending cards & syllable segmentation exercises for conjunct consonants',
  'Independent reading from Barkha series class library corner with comprehension quiz',
  'Repeated timed reading of leveled short paragraphs to boost speed & expression',
  'Audio-recorded self-evaluation of reading passages with pronunciation feedback'
];

export const TARA_READING_LEVELS = [
  'Letter Level',
  'Word Level',
  'Sentence Level',
  'Paragraph Level',
  'Story Level (Fluent)'
];

function determineRangeGroup(wcpm: number, className: string = 'II'): OrfRangeGroup {
  const normClass = className.replace(/CLASS|GRADE/gi, '').trim().toUpperCase();
  const benchmark = NIPUN_BENCHMARKS[normClass] || NIPUN_BENCHMARKS['II'];
  
  if (wcpm < benchmark.minWcpm) return 'Below Base';
  if (wcpm < benchmark.targetWcpm) return 'Within Base';
  return 'Above Base';
}

export default function OralReadingFluencyTracker({ devMode }: OralReadingFluencyTrackerProps) {
  // State
  const [records, setRecords] = useState<OralReadingFluencyRecord[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('II');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedSubject, setSelectedSubject] = useState<string>('Hindi');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterBand, setFilterBand] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'tracker' | 'analytics' | 'remedial_guide'>('tracker');
  const [notification, setNotification] = useState<string | null>(null);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [modalFormData, setModalFormData] = useState<{
    id?: string;
    studentId: string;
    studentName: string;
    rollNo: number | string;
    admissionNo: string;
    className: string;
    section: string;
    subjectName: string;
    baselineWcpm: number;
    midlineWcpm: number;
    endlineWcpm: number;
    accuracyPercentage: number;
    rangeGroup: OrfRangeGroup;
    taraLevel: string;
    remedialMeasures: string;
    remarks: string;
    addToMasterDirectory: boolean;
  }>({
    studentId: '',
    studentName: '',
    rollNo: '',
    admissionNo: '',
    className: 'II',
    section: 'A',
    subjectName: 'Hindi',
    baselineWcpm: 25,
    midlineWcpm: 38,
    endlineWcpm: 52,
    accuracyPercentage: 92,
    rangeGroup: 'Within Base',
    taraLevel: 'Paragraph Level',
    remedialMeasures: REMEDIAL_STRATEGY_PRESETS[0],
    remarks: '',
    addToMasterDirectory: true
  });

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importSubTab, setImportSubTab] = useState<'file' | 'paste' | 'roster'>('file');
  const [pastedData, setPastedData] = useState<string>('');
  const [previewStudents, setPreviewStudents] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importTargetClass, setImportTargetClass] = useState<string>('II');
  const [importTargetSection, setImportTargetSection] = useState<string>('A');
  const [importTargetSubject, setImportTargetSubject] = useState<string>('Hindi');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Fill Modal State
  const [isQuickFillOpen, setIsQuickFillOpen] = useState<boolean>(false);
  const [quickFillType, setQuickFillType] = useState<'baseline' | 'midline' | 'endline' | 'remedial'>('baseline');
  const [quickFillValue, setQuickFillValue] = useState<number | string>(30);

  // Delete Confirmation State
  const [deletingStudent, setDeletingStudent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedRecords = (await db.get<OralReadingFluencyRecord[]>('setup:oral_reading_fluency_tara')) || DEFAULT_ORF_TARA;
    const savedStudents = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    setRecords(savedRecords);
    setStudents(savedStudents);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Helper to normalize class
  const normalizeClass = (cls: string): string => {
    const s = (cls || '').toUpperCase().replace(/CLASS|STD|SECTION|SEC|-A|-B|-C|-D|\s/g, '');
    if (s === '1' || s === 'I' || s === '1ST') return 'I';
    if (s === '2' || s === 'II' || s === '2ND') return 'II';
    if (s === '3' || s === 'III' || s === '3RD') return 'III';
    if (s === '4' || s === 'IV' || s === '4TH') return 'IV';
    if (s === '5' || s === 'V' || s === '5TH') return 'V';
    return s || 'II';
  };

  // Build combined list of students to display for the selected Class & Section & Subject
  // This unifies registered students in setup:students and existing ORF records
  const displayItems = React.useMemo(() => {
    // 1. Get all students that match the selected class & section
    const matchingMasterStudents = students.filter(s => {
      const matchCls = selectedClass === 'ALL' || normalizeClass(s.className) === normalizeClass(selectedClass);
      const matchSec = selectedSection === 'ALL' || (s.section || 'A').toUpperCase() === selectedSection.toUpperCase();
      return matchCls && matchSec;
    });

    // 2. Map through students or existing records
    const studentMap = new Map<string, {
      student: StudentProfile;
      record: OralReadingFluencyRecord;
    }>();

    // Add master students first
    matchingMasterStudents.forEach(st => {
      const existingRec = records.find(r => r.studentId === st.id && (r.subjectId === selectedSubject || r.subjectName === selectedSubject));
      const defBand = determineRangeGroup(existingRec?.endlineWcpm || existingRec?.baselineWcpm || 30, selectedClass);
      
      const rec: OralReadingFluencyRecord = existingRec || {
        id: `orf-${st.id}-${selectedSubject.toLowerCase()}`,
        studentId: st.id,
        className: st.className || selectedClass,
        section: st.section || selectedSection,
        studentName: st.studentName || st.name || `Student ${st.rollNo || ''}`,
        rollNo: st.rollNo || 0,
        admissionNo: st.studentId || st.admissionNo || '',
        subjectId: selectedSubject,
        subjectName: selectedSubject,
        baselineWcpm: 25,
        midlineWcpm: 38,
        endlineWcpm: 50,
        accuracyPercentage: 90,
        rangeGroup: defBand,
        taraLevel: 'Paragraph Level',
        remedialMeasures: REMEDIAL_STRATEGY_PRESETS[0],
        remarks: ''
      };

      studentMap.set(st.id, {
        student: st,
        record: rec
      });
    });

    // Also include any records in ORF table that might not be in master student list for this class
    records.forEach(r => {
      const rCls = normalizeClass(r.className || '');
      const matchCls = selectedClass === 'ALL' || rCls === normalizeClass(selectedClass);
      const matchSec = selectedSection === 'ALL' || (r.section || 'A').toUpperCase() === selectedSection.toUpperCase();
      const matchSub = r.subjectId === selectedSubject || r.subjectName === selectedSubject;

      if (matchCls && matchSec && matchSub && !studentMap.has(r.studentId)) {
        const dummyStudent: StudentProfile = {
          id: r.studentId,
          sn: 1,
          rollNo: typeof r.rollNo === 'number' ? r.rollNo : parseInt(String(r.rollNo)) || 1,
          studentName: r.studentName || 'Student',
          gender: 'MALE',
          dob: '01/01/2018',
          studentId: r.admissionNo || r.studentId,
          admissionDate: '01/04/2024',
          penNo: '',
          apaarId: '',
          fatherName: '',
          motherName: '',
          contactNumber: '',
          bloodGroup: '',
          admissionCategory: 'General',
          socialCategory: 'GEN',
          minority: 'NO',
          rte: 'NO',
          singleGirlChild: 'NO',
          aadhaarNo: '',
          studentEmail: '',
          className: r.className || selectedClass,
          section: r.section || selectedSection
        };

        studentMap.set(r.studentId, {
          student: dummyStudent,
          record: r
        });
      }
    });

    // Convert map to array and sort by roll number
    let items = Array.from(studentMap.values()).sort((a, b) => {
      const rollA = Number(a.student.rollNo || a.record.rollNo || 0);
      const rollB = Number(b.student.rollNo || b.record.rollNo || 0);
      return rollA - rollB;
    });

    // Apply Filter Band
    if (filterBand !== 'ALL') {
      items = items.filter(item => item.record.rangeGroup === filterBand);
    }

    // Apply Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item => {
        const name = (item.student.studentName || item.student.name || item.record.studentName || '').toLowerCase();
        const roll = String(item.student.rollNo || item.record.rollNo || '');
        const adm = (item.student.studentId || item.student.admissionNo || item.record.admissionNo || '').toLowerCase();
        const rem = (item.record.remedialMeasures || '').toLowerCase();
        return name.includes(q) || roll.includes(q) || adm.includes(q) || rem.includes(q);
      });
    }

    return items;
  }, [students, records, selectedClass, selectedSection, selectedSubject, filterBand, searchQuery]);

  // Save single student inline score changes
  const handleWcpmChange = async (
    studentId: string,
    field: 'baselineWcpm' | 'midlineWcpm' | 'endlineWcpm' | 'accuracyPercentage',
    val: number
  ) => {
    const clamped = Math.max(0, val || 0);
    const existingRec = records.find(r => r.studentId === studentId && (r.subjectId === selectedSubject || r.subjectName === selectedSubject));
    const student = students.find(s => s.id === studentId);

    const baseRec: OralReadingFluencyRecord = existingRec || {
      id: `orf-${studentId}-${selectedSubject.toLowerCase()}`,
      studentId,
      className: student?.className || selectedClass,
      section: student?.section || selectedSection,
      studentName: student?.studentName || student?.name || 'Student',
      rollNo: student?.rollNo || 1,
      admissionNo: student?.studentId || student?.admissionNo || '',
      subjectId: selectedSubject,
      subjectName: selectedSubject,
      baselineWcpm: 25,
      midlineWcpm: 38,
      endlineWcpm: 50,
      accuracyPercentage: 90,
      rangeGroup: 'Within Base',
      taraLevel: 'Paragraph Level',
      remedialMeasures: REMEDIAL_STRATEGY_PRESETS[0],
      remarks: ''
    };

    const updatedRec: OralReadingFluencyRecord = {
      ...baseRec,
      [field]: clamped
    };

    // Auto-update Range Group based on highest progress score
    const targetScore = field === 'endlineWcpm' ? clamped : (updatedRec.endlineWcpm || updatedRec.midlineWcpm || clamped);
    updatedRec.rangeGroup = determineRangeGroup(targetScore, updatedRec.className || selectedClass);

    const existingIdx = records.findIndex(r => r.studentId === studentId && (r.subjectId === selectedSubject || r.subjectName === selectedSubject));
    let updatedList: OralReadingFluencyRecord[];
    if (existingIdx >= 0) {
      updatedList = [...records];
      updatedList[existingIdx] = updatedRec;
    } else {
      updatedList = [...records, updatedRec];
    }

    setRecords(updatedList);
    await db.set('setup:oral_reading_fluency_tara', updatedList);
    showNotification('Fluency metric updated');
  };

  const handleRemedialChange = async (studentId: string, text: string) => {
    const existingRec = records.find(r => r.studentId === studentId && (r.subjectId === selectedSubject || r.subjectName === selectedSubject));
    const student = students.find(s => s.id === studentId);

    const baseRec: OralReadingFluencyRecord = existingRec || {
      id: `orf-${studentId}-${selectedSubject.toLowerCase()}`,
      studentId,
      className: student?.className || selectedClass,
      section: student?.section || selectedSection,
      studentName: student?.studentName || student?.name || 'Student',
      rollNo: student?.rollNo || 1,
      admissionNo: student?.studentId || student?.admissionNo || '',
      subjectId: selectedSubject,
      subjectName: selectedSubject,
      baselineWcpm: 25,
      midlineWcpm: 38,
      endlineWcpm: 50,
      accuracyPercentage: 90,
      rangeGroup: 'Within Base',
      taraLevel: 'Paragraph Level',
      remedialMeasures: text,
      remarks: ''
    };

    const updatedRec: OralReadingFluencyRecord = {
      ...baseRec,
      remedialMeasures: text
    };

    const existingIdx = records.findIndex(r => r.studentId === studentId && (r.subjectId === selectedSubject || r.subjectName === selectedSubject));
    let updatedList: OralReadingFluencyRecord[];
    if (existingIdx >= 0) {
      updatedList = [...records];
      updatedList[existingIdx] = updatedRec;
    } else {
      updatedList = [...records, updatedRec];
    }

    setRecords(updatedList);
    await db.set('setup:oral_reading_fluency_tara', updatedList);
  };

  const handleTaraLevelChange = async (studentId: string, level: string) => {
    const existingRec = records.find(r => r.studentId === studentId && (r.subjectId === selectedSubject || r.subjectName === selectedSubject));
    const student = students.find(s => s.id === studentId);

    const baseRec: OralReadingFluencyRecord = existingRec || {
      id: `orf-${studentId}-${selectedSubject.toLowerCase()}`,
      studentId,
      className: student?.className || selectedClass,
      section: student?.section || selectedSection,
      studentName: student?.studentName || student?.name || 'Student',
      rollNo: student?.rollNo || 1,
      admissionNo: student?.studentId || student?.admissionNo || '',
      subjectId: selectedSubject,
      subjectName: selectedSubject,
      baselineWcpm: 25,
      midlineWcpm: 38,
      endlineWcpm: 50,
      accuracyPercentage: 90,
      rangeGroup: 'Within Base',
      taraLevel: level,
      remedialMeasures: REMEDIAL_STRATEGY_PRESETS[0],
      remarks: ''
    };

    const updatedRec: OralReadingFluencyRecord = {
      ...baseRec,
      taraLevel: level
    };

    const existingIdx = records.findIndex(r => r.studentId === studentId && (r.subjectId === selectedSubject || r.subjectName === selectedSubject));
    let updatedList: OralReadingFluencyRecord[];
    if (existingIdx >= 0) {
      updatedList = [...records];
      updatedList[existingIdx] = updatedRec;
    } else {
      updatedList = [...records, updatedRec];
    }

    setRecords(updatedList);
    await db.set('setup:oral_reading_fluency_tara', updatedList);
    showNotification(`TARA level set to ${level}`);
  };

  // Open Modal for New Student
  const handleOpenAddStudent = () => {
    setEditingStudentId(null);
    const nextRoll = displayItems.length + 1;
    setModalFormData({
      studentId: `std-${selectedClass.toLowerCase()}${selectedSection.toLowerCase()}-${String(nextRoll).padStart(2, '0')}`,
      studentName: '',
      rollNo: nextRoll,
      admissionNo: `KV-${new Date().getFullYear()}-${selectedClass}${selectedSection}-${String(nextRoll).padStart(2, '0')}`,
      className: selectedClass !== 'ALL' ? selectedClass : 'II',
      section: selectedSection !== 'ALL' ? selectedSection : 'A',
      subjectName: selectedSubject,
      baselineWcpm: 25,
      midlineWcpm: 38,
      endlineWcpm: 50,
      accuracyPercentage: 92,
      rangeGroup: 'Within Base',
      taraLevel: 'Paragraph Level',
      remedialMeasures: REMEDIAL_STRATEGY_PRESETS[0],
      remarks: '',
      addToMasterDirectory: true
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit Student
  const handleOpenEditStudent = (item: { student: StudentProfile; record: OralReadingFluencyRecord }) => {
    setEditingStudentId(item.student.id);
    setModalFormData({
      id: item.record.id,
      studentId: item.student.id,
      studentName: item.student.studentName || item.student.name || item.record.studentName || '',
      rollNo: item.student.rollNo || item.record.rollNo || 1,
      admissionNo: item.student.studentId || item.student.admissionNo || item.record.admissionNo || '',
      className: item.student.className || item.record.className || selectedClass,
      section: item.student.section || item.record.section || selectedSection,
      subjectName: item.record.subjectName || item.record.subjectId || selectedSubject,
      baselineWcpm: item.record.baselineWcpm || 0,
      midlineWcpm: item.record.midlineWcpm || 0,
      endlineWcpm: item.record.endlineWcpm || 0,
      accuracyPercentage: item.record.accuracyPercentage || 90,
      rangeGroup: item.record.rangeGroup || 'Within Base',
      taraLevel: item.record.taraLevel || 'Paragraph Level',
      remedialMeasures: item.record.remedialMeasures || REMEDIAL_STRATEGY_PRESETS[0],
      remarks: item.record.remarks || '',
      addToMasterDirectory: true
    });
    setIsModalOpen(true);
  };

  // Save Modal Form (Add or Edit)
  const handleSaveModal = async () => {
    if (!modalFormData.studentName.trim()) {
      alert('Please enter the student name.');
      return;
    }

    const stId = editingStudentId || modalFormData.studentId || `std-${Date.now()}`;
    const endWcpm = Number(modalFormData.endlineWcpm) || 0;
    const computedBand = determineRangeGroup(endWcpm || Number(modalFormData.baselineWcpm) || 30, modalFormData.className);

    // 1. Create / Update ORF Record
    const savedRec: OralReadingFluencyRecord = {
      id: modalFormData.id || `orf-${stId}-${modalFormData.subjectName.toLowerCase()}`,
      studentId: stId,
      studentName: modalFormData.studentName.trim(),
      rollNo: Number(modalFormData.rollNo) || 1,
      admissionNo: modalFormData.admissionNo.trim(),
      className: modalFormData.className,
      section: modalFormData.section,
      subjectId: modalFormData.subjectName,
      subjectName: modalFormData.subjectName,
      baselineWcpm: Number(modalFormData.baselineWcpm) || 0,
      midlineWcpm: Number(modalFormData.midlineWcpm) || 0,
      endlineWcpm: endWcpm,
      accuracyPercentage: Number(modalFormData.accuracyPercentage) || 90,
      rangeGroup: computedBand,
      taraLevel: modalFormData.taraLevel,
      remedialMeasures: modalFormData.remedialMeasures,
      remarks: modalFormData.remarks
    };

    const existingRecIdx = records.findIndex(r => r.studentId === stId && (r.subjectId === modalFormData.subjectName || r.subjectName === modalFormData.subjectName));
    let updatedRecords: OralReadingFluencyRecord[];
    if (existingRecIdx >= 0) {
      updatedRecords = [...records];
      updatedRecords[existingRecIdx] = savedRec;
    } else {
      updatedRecords = [...records, savedRec];
    }
    setRecords(updatedRecords);
    await db.set('setup:oral_reading_fluency_tara', updatedRecords);

    // 2. Also Update / Add to master student list (setup:students) if requested
    if (modalFormData.addToMasterDirectory) {
      const existingStdIdx = students.findIndex(s => s.id === stId);
      let updatedStudents: StudentProfile[];

      const studentProfileObj: StudentProfile = {
        id: stId,
        sn: Number(modalFormData.rollNo) || 1,
        rollNo: Number(modalFormData.rollNo) || 1,
        studentName: modalFormData.studentName.trim(),
        name: modalFormData.studentName.trim(),
        gender: 'MALE',
        dob: '01/01/2018',
        studentId: modalFormData.admissionNo.trim() || `KV-2025-${stId}`,
        admissionNo: modalFormData.admissionNo.trim() || `KV-2025-${stId}`,
        admissionDate: '01/04/2024',
        penNo: '',
        apaarId: '',
        fatherName: '',
        motherName: '',
        contactNumber: '',
        bloodGroup: '',
        admissionCategory: 'General',
        socialCategory: 'GEN',
        minority: 'NO',
        rte: 'NO',
        singleGirlChild: 'NO',
        aadhaarNo: '',
        studentEmail: '',
        className: modalFormData.className,
        section: modalFormData.section
      };

      if (existingStdIdx >= 0) {
        updatedStudents = [...students];
        updatedStudents[existingStdIdx] = {
          ...updatedStudents[existingStdIdx],
          studentName: modalFormData.studentName.trim(),
          name: modalFormData.studentName.trim(),
          rollNo: Number(modalFormData.rollNo) || updatedStudents[existingStdIdx].rollNo,
          studentId: modalFormData.admissionNo.trim() || updatedStudents[existingStdIdx].studentId,
          className: modalFormData.className,
          section: modalFormData.section
        };
      } else {
        updatedStudents = [...students, studentProfileObj];
      }

      setStudents(updatedStudents);
      await db.set('setup:students', updatedStudents);
    }

    setIsModalOpen(false);
    showNotification(editingStudentId ? 'Student record updated successfully' : 'New student added successfully');
  };

  // Delete Student confirmation
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    const stId = deletingStudent.id;

    // Filter out from records
    const updatedRecs = records.filter(r => r.studentId !== stId);
    setRecords(updatedRecs);
    await db.set('setup:oral_reading_fluency_tara', updatedRecs);

    // Optionally also remove from students roster
    const updatedStds = students.filter(s => s.id !== stId);
    setStudents(updatedStds);
    await db.set('setup:students', updatedStds);

    setDeletingStudent(null);
    showNotification('Student removed from tracker');
  };

  // ==========================================
  // IMPORTER LOGIC
  // ==========================================

  // Process text or Excel rows into student preview
  const parseRowsToStudents = (rawRows: any[][]) => {
    if (!rawRows || rawRows.length === 0) {
      setImportError('No data found in the uploaded file or text.');
      return;
    }

    // Try to find header row or start from row 0
    let startIdx = 0;
    const firstRowStr = rawRows[0].map(c => String(c).toLowerCase()).join(' ');
    if (firstRowStr.includes('name') || firstRowStr.includes('roll') || firstRowStr.includes('student')) {
      startIdx = 1;
    }

    const parsed: any[] = [];
    for (let i = startIdx; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0 || !row[0]) continue;

      // Detect fields
      let rollNo: number = i - startIdx + 1;
      let name = '';
      let admissionNo = '';
      let baseline = 25;
      let midline = 38;
      let endline = 50;
      let accuracy = 90;
      let level = 'Paragraph Level';
      let remedial = REMEDIAL_STRATEGY_PRESETS[0];

      // Format 1: If 1st column is a number, it's roll number, 2nd is name
      if (typeof row[0] === 'number' || (!isNaN(Number(row[0])) && Number(row[0]) < 100)) {
        rollNo = Number(row[0]);
        name = String(row[1] || '').trim();
        admissionNo = String(row[2] || '');
        if (row[3] !== undefined && !isNaN(Number(row[3]))) baseline = Number(row[3]);
        if (row[4] !== undefined && !isNaN(Number(row[4]))) midline = Number(row[4]);
        if (row[5] !== undefined && !isNaN(Number(row[5]))) endline = Number(row[5]);
        if (row[6]) remedial = String(row[6]);
      } else {
        // First column is name
        name = String(row[0] || '').trim();
        if (row[1] !== undefined && !isNaN(Number(row[1]))) rollNo = Number(row[1]);
        admissionNo = String(row[2] || '');
        if (row[3] !== undefined && !isNaN(Number(row[3]))) baseline = Number(row[3]);
        if (row[4] !== undefined && !isNaN(Number(row[4]))) midline = Number(row[4]);
        if (row[5] !== undefined && !isNaN(Number(row[5]))) endline = Number(row[5]);
        if (row[6]) remedial = String(row[6]);
      }

      if (name) {
        parsed.push({
          id: `std-imp-${Date.now()}-${i}`,
          rollNo,
          studentName: name,
          name,
          admissionNo: admissionNo || `KV-2025-${importTargetClass}${importTargetSection}-${rollNo}`,
          className: importTargetClass,
          section: importTargetSection,
          subjectName: importTargetSubject,
          baselineWcpm: baseline,
          midlineWcpm: midline,
          endlineWcpm: endline,
          accuracyPercentage: accuracy,
          rangeGroup: determineRangeGroup(endline || baseline, importTargetClass),
          taraLevel: level,
          remedialMeasures: remedial
        });
      }
    }

    if (parsed.length === 0) {
      setImportError('Could not extract valid student rows. Please check file format.');
      setPreviewStudents([]);
    } else {
      setImportError(null);
      setPreviewStudents(parsed);
    }
  };

  // Handle File Upload (.xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        parseRowsToStudents(data);
      } catch (err: any) {
        setImportError(`File parse error: ${err.message || 'Invalid file format'}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handle Pasted Text Parsing
  const handleParsePastedText = () => {
    if (!pastedData.trim()) {
      setImportError('Please paste some text first.');
      return;
    }

    const lines = pastedData.trim().split(/\r?\n/);
    const rows = lines.map(line => {
      if (line.includes('\t')) return line.split('\t');
      if (line.includes(',')) return line.split(',');
      return line.split(/\s{2,}/);
    });

    parseRowsToStudents(rows);
  };

  // Commit Previewed Imported Students
  const handleCommitImport = async () => {
    if (previewStudents.length === 0) return;

    let updatedRecords = [...records];
    let updatedStudents = [...students];

    previewStudents.forEach((st, idx) => {
      const studentId = `std-${importTargetClass.toLowerCase()}${importTargetSection.toLowerCase()}-${String(st.rollNo || idx + 1).padStart(2, '0')}`;

      // Master Student Record
      const masterObj: StudentProfile = {
        id: studentId,
        sn: st.rollNo || idx + 1,
        rollNo: st.rollNo || idx + 1,
        studentName: st.studentName,
        name: st.studentName,
        gender: 'MALE',
        dob: '01/01/2018',
        studentId: st.admissionNo || `KV-2025-${studentId}`,
        admissionNo: st.admissionNo || `KV-2025-${studentId}`,
        admissionDate: '01/04/2024',
        penNo: '',
        apaarId: '',
        fatherName: '',
        motherName: '',
        contactNumber: '',
        bloodGroup: '',
        admissionCategory: 'General',
        socialCategory: 'GEN',
        minority: 'NO',
        rte: 'NO',
        singleGirlChild: 'NO',
        aadhaarNo: '',
        studentEmail: '',
        className: importTargetClass,
        section: importTargetSection
      };

      const existingStdIdx = updatedStudents.findIndex(s => s.id === studentId || (s.className === importTargetClass && s.section === importTargetSection && s.rollNo === st.rollNo));
      if (existingStdIdx >= 0) {
        updatedStudents[existingStdIdx] = { ...updatedStudents[existingStdIdx], studentName: st.studentName, name: st.studentName };
      } else {
        updatedStudents.push(masterObj);
      }

      // ORF Record
      const orfObj: OralReadingFluencyRecord = {
        id: `orf-${studentId}-${importTargetSubject.toLowerCase()}`,
        studentId: studentId,
        studentName: st.studentName,
        rollNo: st.rollNo || idx + 1,
        admissionNo: st.admissionNo || `KV-2025-${studentId}`,
        className: importTargetClass,
        section: importTargetSection,
        subjectId: importTargetSubject,
        subjectName: importTargetSubject,
        baselineWcpm: st.baselineWcpm || 25,
        midlineWcpm: st.midlineWcpm || 38,
        endlineWcpm: st.endlineWcpm || 50,
        accuracyPercentage: st.accuracyPercentage || 90,
        rangeGroup: determineRangeGroup(st.endlineWcpm || st.baselineWcpm, importTargetClass),
        taraLevel: st.taraLevel || 'Paragraph Level',
        remedialMeasures: st.remedialMeasures || REMEDIAL_STRATEGY_PRESETS[0]
      };

      const existingRecIdx = updatedRecords.findIndex(r => r.studentId === studentId && (r.subjectId === importTargetSubject || r.subjectName === importTargetSubject));
      if (existingRecIdx >= 0) {
        updatedRecords[existingRecIdx] = orfObj;
      } else {
        updatedRecords.push(orfObj);
      }
    });

    setStudents(updatedStudents);
    setRecords(updatedRecords);
    await db.set('setup:students', updatedStudents);
    await db.set('setup:oral_reading_fluency_tara', updatedRecords);

    // Switch view to the imported class
    setSelectedClass(importTargetClass);
    setSelectedSection(importTargetSection);
    setSelectedSubject(importTargetSubject);

    setIsImportModalOpen(false);
    setPreviewStudents([]);
    setPastedData('');
    showNotification(`Successfully imported ${previewStudents.length} students into ORF Tracker!`);
  };

  // Sync All Students from Master Directory for Current Class
  const handleSyncFromMasterRoster = async () => {
    const classRoster = students.filter(s => normalizeClass(s.className) === normalizeClass(selectedClass) && (selectedSection === 'ALL' || (s.section || 'A').toUpperCase() === selectedSection.toUpperCase()));

    if (classRoster.length === 0) {
      alert(`No registered students found in Master Directory for Class ${selectedClass}-${selectedSection}. Please add or import students first.`);
      return;
    }

    let updatedRecords = [...records];
    let newEntriesCount = 0;

    classRoster.forEach(st => {
      const exists = updatedRecords.find(r => r.studentId === st.id && (r.subjectId === selectedSubject || r.subjectName === selectedSubject));
      if (!exists) {
        const defBand = determineRangeGroup(35, selectedClass);
        const newRec: OralReadingFluencyRecord = {
          id: `orf-${st.id}-${selectedSubject.toLowerCase()}`,
          studentId: st.id,
          studentName: st.studentName || st.name || `Student ${st.rollNo}`,
          rollNo: st.rollNo || 1,
          admissionNo: st.studentId || st.admissionNo || '',
          className: st.className || selectedClass,
          section: st.section || selectedSection,
          subjectId: selectedSubject,
          subjectName: selectedSubject,
          baselineWcpm: 25,
          midlineWcpm: 38,
          endlineWcpm: 50,
          accuracyPercentage: 90,
          rangeGroup: defBand,
          taraLevel: 'Paragraph Level',
          remedialMeasures: REMEDIAL_STRATEGY_PRESETS[0]
        };
        updatedRecords.push(newRec);
        newEntriesCount++;
      }
    });

    if (newEntriesCount > 0) {
      setRecords(updatedRecords);
      await db.set('setup:oral_reading_fluency_tara', updatedRecords);
      showNotification(`Synced ${newEntriesCount} new students from Master Directory!`);
    } else {
      showNotification('All class students are already synced in ORF Tracker.');
    }
  };

  // Download Sample CSV
  const handleDownloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Roll No,Student Name,Admission No,Baseline WCPM,Midline WCPM,Endline WCPM,Remedial Strategy\n" +
      "1,Aarav Sharma,KV-2025-0101,24,35,48,Daily paired oral reading sessions using TARA audio storybooks\n" +
      "2,Ananya Deshmukh,KV-2025-0102,42,52,65,Independent reading from Barkha series library corner\n" +
      "3,Vihaan Patel,KV-2025-0103,18,28,38,10-minute sight word flashcard drills with peer mentor\n" +
      "4,Ishaan Verma,KV-2025-0104,32,44,58,Choral reading of NCERT Sarangi stories with echo drills\n" +
      "5,Saanvi Nair,KV-2025-0105,50,62,72,Advanced story narration & speech recitation\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KVS_ORF_TARA_Sample_Class_${selectedClass}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Blank CSV Template
  const handleDownloadBlankCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Roll No,Student Name,Admission No,Baseline WCPM,Midline WCPM,Endline WCPM,Remedial Strategy\n" +
      "1,,,,,, \n" +
      "2,,,,,, \n" +
      "3,,,,,, \n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KVS_ORF_TARA_Blank_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Current View to CSV / Excel
  const handleExportCSV = () => {
    const exportData = displayItems.map(item => ({
      'Roll No': item.student.rollNo || item.record.rollNo || '',
      'Student Name': item.student.studentName || item.student.name || item.record.studentName || '',
      'Admission No': item.student.studentId || item.student.admissionNo || item.record.admissionNo || '',
      'Class & Sec': `${item.student.className || selectedClass}-${item.student.section || selectedSection}`,
      'Language/Subject': selectedSubject,
      'Baseline WCPM': item.record.baselineWcpm || 0,
      'Midline WCPM': item.record.midlineWcpm || 0,
      'Endline WCPM': item.record.endlineWcpm || 0,
      'Progress (+Δ)': (item.record.endlineWcpm || 0) - (item.record.baselineWcpm || 0),
      'Accuracy %': `${item.record.accuracyPercentage || 90}%`,
      'Performance Band': item.record.rangeGroup || 'Within Base',
      'TARA Level': item.record.taraLevel || 'Paragraph Level',
      'Remedial Strategy': item.record.remedialMeasures || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ORF_TARA_Tracker");
    XLSX.writeFile(wb, `KVS_Page28_ORF_TARA_Class_${selectedClass}_${selectedSection}_${selectedSubject}.xlsx`);
  };

  // Batch Quick Fill Apply
  const handleApplyQuickFill = async () => {
    let updatedRecords = [...records];

    displayItems.forEach(item => {
      const stId = item.student.id;
      const existingRecIdx = updatedRecords.findIndex(r => r.studentId === stId && (r.subjectId === selectedSubject || r.subjectName === selectedSubject));
      
      const currentRec = item.record;
      let newRec: OralReadingFluencyRecord = { ...currentRec };

      if (quickFillType === 'baseline') {
        newRec.baselineWcpm = Number(quickFillValue) || 0;
      } else if (quickFillType === 'midline') {
        newRec.midlineWcpm = Number(quickFillValue) || 0;
      } else if (quickFillType === 'endline') {
        newRec.endlineWcpm = Number(quickFillValue) || 0;
      } else if (quickFillType === 'remedial') {
        newRec.remedialMeasures = String(quickFillValue);
      }

      newRec.rangeGroup = determineRangeGroup(newRec.endlineWcpm || newRec.baselineWcpm, selectedClass);

      if (existingRecIdx >= 0) {
        updatedRecords[existingRecIdx] = newRec;
      } else {
        updatedRecords.push(newRec);
      }
    });

    setRecords(updatedRecords);
    await db.set('setup:oral_reading_fluency_tara', updatedRecords);
    setIsQuickFillOpen(false);
    showNotification(`Quick fill applied to all ${displayItems.length} students!`);
  };

  // Compute Summary Statistics
  const totalCount = displayItems.length;
  const belowBaseCount = displayItems.filter(i => i.record.rangeGroup === 'Below Base').length;
  const withinBaseCount = displayItems.filter(i => i.record.rangeGroup === 'Within Base').length;
  const aboveBaseCount = displayItems.filter(i => i.record.rangeGroup === 'Above Base').length;
  
  const avgBaseline = totalCount > 0 ? Math.round(displayItems.reduce((acc, i) => acc + (i.record.baselineWcpm || 0), 0) / totalCount) : 0;
  const avgMidline = totalCount > 0 ? Math.round(displayItems.reduce((acc, i) => acc + (i.record.midlineWcpm || 0), 0) / totalCount) : 0;
  const avgEndline = totalCount > 0 ? Math.round(displayItems.reduce((acc, i) => acc + (i.record.endlineWcpm || 0), 0) / totalCount) : 0;
  const avgGrowth = avgEndline - avgBaseline;

  const currentBenchmark = NIPUN_BENCHMARKS[selectedClass] || NIPUN_BENCHMARKS['II'];

  return (
    <div className="space-y-6">
      {devMode && (
        <DevModeBadge
          pages={28}
          title="28. Oral Reading Fluency (ORF) TARA Metric & Remedial Tracker (Official Page 28)"
        />
      )}

      {/* Main Header Container matching official Teacher's Diary Page 28 */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/50 to-blue-950/40 border border-indigo-500/30 p-6 rounded-2xl space-y-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-indigo-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Official KVS Module 28
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Page 28 (FLN / NIPUN Bharat)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Headphones className="w-3 h-3" />
                <span>TARA Mobile App Integrated</span>
              </span>

              {notification && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold animate-pulse">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{notification}</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Mic className="w-6 h-6 text-indigo-400 shrink-0" />
              <span>28. Oral Reading Fluency (ORF) TARA Metric & Remedial Tracker</span>
            </h1>
            <h2 className="text-xs sm:text-sm font-bold text-indigo-300 uppercase tracking-wide">
              मौखिक पठन प्रवाह (WCPM) मूल्यांकन एवं उपचारात्मक शिक्षण रजिस्टर
            </h2>
            <p className="text-xs text-gray-300/80 italic mt-0.5">
              Continuous diagnostic assessment of Words Correct Per Minute (WCPM) with Accuracy & NIPUN Lakshya Remedial Plans
            </p>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="bg-black/50 p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 shrink-0 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'tracker'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-200" />
              <span>ORF Assessment Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-purple-200" />
              <span>NIPUN FLN Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('remedial_guide')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'remedial_guide'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-200" />
              <span>Remedial Strategies</span>
            </button>
          </div>
        </div>

        {/* Global Controls & Filters Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs pt-1">
          {/* Class Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Class</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="I">Class I (Target: 30 WCPM)</option>
              <option value="II">Class II (Target: 45 WCPM)</option>
              <option value="III">Class III (Target: 60 WCPM)</option>
              <option value="IV">Class IV (Target: 75 WCPM)</option>
              <option value="V">Class V (Target: 90 WCPM)</option>
              <option value="ALL">All Classes (I to V)</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Section</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
              <option value="ALL">All Sections</option>
            </select>
          </div>

          {/* Subject / Language Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Language Medium</label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="Hindi">Hindi (Rimjhim / Sarangi / आनंदमयी)</option>
              <option value="English">English (Mridang / Marigold / Joyful)</option>
              <option value="Sanskrit">Sanskrit (रुचिरा / आनन्दम्)</option>
            </select>
          </div>

          {/* Band Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">NIPUN Band</label>
            <select
              value={filterBand}
              onChange={e => setFilterBand(e.target.value)}
              className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="ALL">All Performance Bands</option>
              <option value="Below Base">🔴 Below Base (&lt; {currentBenchmark.minWcpm} WCPM)</option>
              <option value="Within Base">🟡 Within Base ({currentBenchmark.minWcpm}–{currentBenchmark.targetWcpm} WCPM)</option>
              <option value="Above Base">🟢 Above Base (&gt; {currentBenchmark.targetWcpm} WCPM)</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Search</label>
            <div className="relative mt-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search student, roll, remarks..."
                className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-indigo-500/10">
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Add Student Button */}
            <button
              onClick={handleOpenAddStudent}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Student</span>
            </button>

            {/* 2. Import Students Button */}
            <button
              onClick={() => {
                setImportTargetClass(selectedClass !== 'ALL' ? selectedClass : 'II');
                setImportTargetSection(selectedSection !== 'ALL' ? selectedSection : 'A');
                setImportTargetSubject(selectedSubject);
                setIsImportModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-300" />
              <span>Import Students (CSV / Excel)</span>
            </button>

            {/* 3. Sync from Master Roster */}
            <button
              onClick={handleSyncFromMasterRoster}
              className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Auto-populate students from the school's global database for this class"
            >
              <Users className="w-3.5 h-3.5 text-blue-300" />
              <span>Sync from School Roster</span>
            </button>

            {/* 4. Batch Quick Fill */}
            <button
              onClick={() => setIsQuickFillOpen(true)}
              className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-300" />
              <span>Batch Quick Fill</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Export & Print */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="Export to Excel Spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-gray-400" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Print Page 28 Register"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-300" />
              <span>Print Page 28</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-gray-400">Total Assessed</div>
          <div className="text-xl font-black text-white mt-0.5">{totalCount}</div>
          <div className="text-[10px] text-indigo-300 mt-0.5">Students in Roster</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-rose-400">Below Base (Remedial)</div>
          <div className="text-xl font-black text-rose-300 mt-0.5">{belowBaseCount}</div>
          <div className="text-[10px] text-rose-300/80 mt-0.5">
            {totalCount > 0 ? Math.round((belowBaseCount / totalCount) * 100) : 0}% of class
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-amber-400">Within Base</div>
          <div className="text-xl font-black text-amber-300 mt-0.5">{withinBaseCount}</div>
          <div className="text-[10px] text-amber-300/80 mt-0.5">
            {totalCount > 0 ? Math.round((withinBaseCount / totalCount) * 100) : 0}% developing
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-emerald-400">Above Base (Fluent)</div>
          <div className="text-xl font-black text-emerald-300 mt-0.5">{aboveBaseCount}</div>
          <div className="text-[10px] text-emerald-300/80 mt-0.5">
            {totalCount > 0 ? Math.round((aboveBaseCount / totalCount) * 100) : 0}% target achieved
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-blue-400">Avg Progress</div>
          <div className="text-xl font-black text-blue-300 mt-0.5">
            {avgBaseline} → {avgEndline} <span className="text-xs text-gray-400 font-normal">WCPM</span>
          </div>
          <div className="text-[10px] text-blue-300/80 mt-0.5">
            Avg Growth: <span className="font-bold text-emerald-400">+{avgGrowth} WCPM</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
          <div className="text-[10px] uppercase font-bold text-purple-400">NIPUN Target</div>
          <div className="text-xl font-black text-purple-300 mt-0.5">
            {currentBenchmark.targetWcpm} <span className="text-xs text-gray-400 font-normal">WCPM</span>
          </div>
          <div className="text-[10px] text-purple-300/80 mt-0.5">{currentBenchmark.label} standard</div>
        </div>
      </div>

      {/* Target Guide Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-indigo-200">NIPUN Bharat WCPM Lakshya ({currentBenchmark.label}):</span>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
            Below Base: &lt; {currentBenchmark.minWcpm} WCPM (Intensive Phonics Support)
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
            Within Base: {currentBenchmark.minWcpm}–{currentBenchmark.targetWcpm} WCPM (Developing Fluency)
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
            Above Base: &gt; {currentBenchmark.targetWcpm} WCPM (Fluent with Comprehension)
          </span>
        </div>

        <div className="text-[11px] text-gray-400">
          Evaluated via TARA reading audio passages
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: ORF ASSESSMENT LEDGER TABLE (PAGE 28)                         */}
      {/* ==================================================================== */}
      {activeTab === 'tracker' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
            <table className="w-full text-xs text-left border-collapse min-w-[1250px]">
              <thead>
                <tr className="bg-indigo-950/80 text-indigo-200 border-b border-indigo-500/30 text-center font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 border-r border-indigo-500/30 w-12 text-center">
                    Roll
                  </th>
                  <th className="py-3 px-4 border-r border-indigo-500/30 w-52 text-left">
                    Student Details
                  </th>
                  <th className="py-3 px-2 border-r border-indigo-500/30 w-28 text-center text-rose-300" title="Words Correct Per Minute (April/July)">
                    Baseline WCPM
                  </th>
                  <th className="py-3 px-2 border-r border-indigo-500/30 w-28 text-center text-amber-300" title="Words Correct Per Minute (October/November)">
                    Midline WCPM
                  </th>
                  <th className="py-3 px-2 border-r border-indigo-500/30 w-28 text-center text-emerald-300" title="Words Correct Per Minute (February/March)">
                    Endline WCPM
                  </th>
                  <th className="py-3 px-2 border-r border-indigo-500/30 w-24 text-center text-blue-300" title="Growth from Baseline to Endline">
                    Progress (+Δ)
                  </th>
                  <th className="py-3 px-2 border-r border-indigo-500/30 w-28 text-center text-purple-300" title="NIPUN Lakshya Performance Band">
                    Range Group
                  </th>
                  <th className="py-3 px-2 border-r border-indigo-500/30 w-32 text-center text-indigo-300" title="TARA Reading Level">
                    TARA Level
                  </th>
                  <th className="py-3 px-3 border-r border-indigo-500/30 min-w-[280px] text-left text-teal-300">
                    Remedial Measures & Interventions Planned
                  </th>
                  <th className="py-3 px-2 w-20 text-center text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {displayItems.map(({ student, record }, idx) => {
                  const baseline = record.baselineWcpm || 0;
                  const midline = record.midlineWcpm || 0;
                  const endline = record.endlineWcpm || 0;
                  const delta = endline - baseline;
                  const currentBand = record.rangeGroup || determineRangeGroup(endline || baseline, student.className || selectedClass);

                  return (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                      {/* Roll No */}
                      <td className="py-2.5 px-3 border-r border-white/10 text-center font-mono font-bold text-amber-300">
                        #{student.rollNo || record.rollNo || idx + 1}
                      </td>

                      {/* Student Details */}
                      <td className="py-2.5 px-4 border-r border-white/10 font-sans">
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          <span>{student.studentName || student.name || record.studentName}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>ID: {student.studentId || student.admissionNo || record.admissionNo || 'N/A'}</span>
                          <span className="text-indigo-300">Class {student.className || selectedClass}-{student.section || selectedSection}</span>
                        </div>
                      </td>

                      {/* Baseline WCPM */}
                      <td className="py-2 px-2 border-r border-white/10 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={150}
                            value={baseline}
                            onChange={e => handleWcpmChange(student.id, 'baselineWcpm', parseInt(e.target.value) || 0)}
                            className="w-16 py-1 px-1.5 text-center bg-black/40 border border-white/10 rounded-lg font-mono font-bold text-xs text-rose-200 focus:border-indigo-400 focus:outline-none"
                          />
                          <span className="text-[9px] text-gray-400 font-mono">wpm</span>
                        </div>
                      </td>

                      {/* Midline WCPM */}
                      <td className="py-2 px-2 border-r border-white/10 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={150}
                            value={midline}
                            onChange={e => handleWcpmChange(student.id, 'midlineWcpm', parseInt(e.target.value) || 0)}
                            className="w-16 py-1 px-1.5 text-center bg-black/40 border border-white/10 rounded-lg font-mono font-bold text-xs text-amber-200 focus:border-indigo-400 focus:outline-none"
                          />
                          <span className="text-[9px] text-gray-400 font-mono">wpm</span>
                        </div>
                      </td>

                      {/* Endline WCPM */}
                      <td className="py-2 px-2 border-r border-white/10 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={150}
                            value={endline}
                            onChange={e => handleWcpmChange(student.id, 'endlineWcpm', parseInt(e.target.value) || 0)}
                            className="w-16 py-1 px-1.5 text-center bg-black/40 border border-white/10 rounded-lg font-mono font-bold text-xs text-emerald-200 focus:border-indigo-400 focus:outline-none"
                          />
                          <span className="text-[9px] text-gray-400 font-mono">wpm</span>
                        </div>
                      </td>

                      {/* Progress Growth Delta */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          delta > 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : delta === 0
                            ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {delta > 0 ? `+${delta}` : delta} wpm
                        </span>
                      </td>

                      {/* Range Group / Performance Band */}
                      <td className="py-2.5 px-2 border-r border-white/10 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider block ${
                            currentBand === 'Above Base'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : currentBand === 'Within Base'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {currentBand}
                        </span>
                      </td>

                      {/* TARA Reading Level Dropdown */}
                      <td className="py-2 px-2 border-r border-white/10 text-center">
                        <select
                          value={record.taraLevel || 'Paragraph Level'}
                          onChange={e => handleTaraLevelChange(student.id, e.target.value)}
                          className="w-full py-1 px-2 bg-black/40 border border-white/10 rounded-lg text-[10px] font-medium text-indigo-200 focus:border-indigo-400 focus:outline-none"
                        >
                          {TARA_READING_LEVELS.map(lvl => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                      </td>

                      {/* Remedial Strategy Text Input with Quick Suggestions */}
                      <td className="py-2 px-3 border-r border-white/10">
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={record.remedialMeasures || ''}
                            onChange={e => handleRemedialChange(student.id, e.target.value)}
                            placeholder="Intervention strategy (e.g. flashcards, paired reading...)"
                            className="w-full py-1 px-2.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:border-indigo-400 focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditStudent({ student, record })}
                            className="p-1.5 hover:bg-indigo-500/20 text-indigo-300 rounded-lg transition-colors cursor-pointer"
                            title="Edit Student Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingStudent({ id: student.id, name: student.studentName || student.name || record.studentName || 'Student' })}
                            className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Remove Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {displayItems.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400">
                      <Mic className="w-8 h-8 text-indigo-400/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-white">No students found in ORF Tracker for Class {selectedClass}-{selectedSection}</p>
                      <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                        Click <span className="text-indigo-300 font-bold">+ Add Student</span>, <span className="text-emerald-300 font-bold">Import Students (CSV/Excel)</span>, or <span className="text-blue-300 font-bold">Sync from School Roster</span> to get started.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Table Footer Summary */}
              {displayItems.length > 0 && (
                <tfoot>
                  <tr className="bg-indigo-950/90 text-white font-bold border-t-2 border-indigo-500/40 text-center text-xs">
                    <td colSpan={2} className="py-3 px-4 text-right uppercase tracking-wider font-extrabold text-indigo-200 border-r border-indigo-500/30">
                      Class Average Metrics:
                    </td>
                    <td className="py-3 px-2 border-r border-indigo-500/30 text-rose-200 font-mono">
                      {avgBaseline} wpm
                    </td>
                    <td className="py-3 px-2 border-r border-indigo-500/30 text-amber-200 font-mono">
                      {avgMidline} wpm
                    </td>
                    <td className="py-3 px-2 border-r border-indigo-500/30 text-emerald-200 font-mono">
                      {avgEndline} wpm
                    </td>
                    <td className="py-3 px-2 border-r border-indigo-500/30 text-blue-200 font-mono">
                      +{avgGrowth} wpm
                    </td>
                    <td colSpan={4} className="py-3 px-4 text-left text-gray-300 font-sans text-[11px]">
                      {aboveBaseCount} Fluent ({Math.round((aboveBaseCount/totalCount)*100)}%), {withinBaseCount} Developing ({Math.round((withinBaseCount/totalCount)*100)}%), {belowBaseCount} Remedial ({Math.round((belowBaseCount/totalCount)*100)}%)
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Printable Signature Block for Page 28 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-6 text-xs text-gray-300 backdrop-blur-md">
            <div className="text-center sm:text-left">
              <div className="font-bold text-white">Language Teacher Signature & Date</div>
              <div className="mt-6 border-b border-gray-500 w-48 mx-auto sm:mx-0"></div>
              <div className="text-[10px] text-gray-400 mt-1">Name: ______________________</div>
            </div>

            <div className="text-center">
              <div className="font-bold text-white">FLN / NIPUN Coordinator Signature</div>
              <div className="mt-6 border-b border-gray-500 w-48 mx-auto"></div>
              <div className="text-[10px] text-gray-400 mt-1">Name: ______________________</div>
            </div>

            <div className="text-center sm:text-right">
              <div className="font-bold text-white">Head Master / Principal Signature</div>
              <div className="mt-6 border-b border-gray-500 w-48 mx-auto sm:ml-auto sm:mr-0"></div>
              <div className="text-[10px] text-gray-400 mt-1">Kendriya Vidyalaya Seal</div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: NIPUN FLN PERFORMANCE ANALYTICS                              */}
      {/* ==================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Progression Graph & Range Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Below Base Card */}
            <div className="bg-rose-950/20 border border-rose-500/30 p-5 rounded-2xl space-y-3 backdrop-blur-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-rose-300 text-sm">Below Base Range</h3>
                  <p className="text-[11px] text-gray-400">&lt; {currentBenchmark.minWcpm} WCPM (Needs Support)</p>
                </div>
                <span className="text-2xl font-black text-rose-400">{belowBaseCount}</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all"
                  style={{ width: `${totalCount > 0 ? (belowBaseCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-300">
                Action: Targeted phonemic awareness, letter-sound association drills, and TARA audio stories with buddy mentors.
              </p>
            </div>

            {/* Within Base Card */}
            <div className="bg-amber-950/20 border border-amber-500/30 p-5 rounded-2xl space-y-3 backdrop-blur-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-amber-300 text-sm">Within Base Range</h3>
                  <p className="text-[11px] text-gray-400">{currentBenchmark.minWcpm}–{currentBenchmark.targetWcpm} WCPM (Developing)</p>
                </div>
                <span className="text-2xl font-black text-amber-400">{withinBaseCount}</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${totalCount > 0 ? (withinBaseCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-300">
                Action: Graded reader books (Barkha Series), timed repeated reading, and fluency pacing games.
              </p>
            </div>

            {/* Above Base Card */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-5 rounded-2xl space-y-3 backdrop-blur-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-emerald-300 text-sm">Above Base Range</h3>
                  <p className="text-[11px] text-gray-400">&gt; {currentBenchmark.targetWcpm} WCPM (Fluent)</p>
                </div>
                <span className="text-2xl font-black text-emerald-400">{aboveBaseCount}</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${totalCount > 0 ? (aboveBaseCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-300">
                Action: Complex comprehension tasks, creative story generation, speech recitation, and peer tutoring.
              </p>
            </div>
          </div>

          {/* Diagnostic WCPM Growth Comparison Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <span>Diagnostic Benchmark Progression ({selectedSubject} - Class {selectedClass})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center">
                <div className="text-xs font-bold text-rose-300 uppercase">Baseline Assessment (April/July)</div>
                <div className="text-3xl font-black text-white mt-1">{avgBaseline} <span className="text-sm font-normal text-gray-400">wpm</span></div>
                <p className="text-[11px] text-gray-400 mt-1">Starting point at term beginning</p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center">
                <div className="text-xs font-bold text-amber-300 uppercase">Midline Assessment (Oct/Nov)</div>
                <div className="text-3xl font-black text-white mt-1">{avgMidline} <span className="text-sm font-normal text-gray-400">wpm</span></div>
                <p className="text-[11px] text-emerald-400 mt-1 font-bold">+{avgMidline - avgBaseline} wpm improvement</p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center">
                <div className="text-xs font-bold text-emerald-300 uppercase">Endline Assessment (Feb/Mar)</div>
                <div className="text-3xl font-black text-white mt-1">{avgEndline} <span className="text-sm font-normal text-gray-400">wpm</span></div>
                <p className="text-[11px] text-emerald-400 mt-1 font-bold">+{avgEndline - avgBaseline} wpm total growth</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: REMEDIAL STRATEGIES & TARA PEDAGOGY GUIDE                    */}
      {/* ==================================================================== */}
      {activeTab === 'remedial_guide' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REMEDIAL_STRATEGY_PRESETS.map((strategy, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h4 className="font-bold text-white text-xs">Strategy #{idx + 1}</h4>
                </div>
                <p className="text-xs text-gray-300 pl-8 leading-relaxed">
                  {strategy}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-5 backdrop-blur-md space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Headphones className="w-4 h-4 text-indigo-400" />
              <span>About the TARA (Teaching And Reading Acceleration) Framework</span>
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              TARA is a specialized pedagogical tool designed for KVS primary classrooms under the NIPUN Bharat FLN mission. It evaluates automaticity, expression, and word-accuracy rate per minute (WCPM) using graded vernacular stories and decodable audio texts.
            </p>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: ADD / EDIT STUDENT MODAL                                    */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {editingStudentId ? <Edit2 className="w-5 h-5 text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-400" />}
                  <span>{editingStudentId ? 'Edit Student ORF Record' : 'Add New Student to ORF Tracker'}</span>
                </h3>
                <p className="text-xs text-gray-400">
                  {editingStudentId ? 'Update student assessment scores & remedial plan' : 'Enter student demographic details and initial reading benchmark'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Student Name */}
              <div>
                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  value={modalFormData.studentName}
                  onChange={e => setModalFormData({ ...modalFormData, studentName: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white font-medium"
                />
              </div>

              {/* Roll Number */}
              <div>
                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                  Roll Number
                </label>
                <input
                  type="number"
                  min={1}
                  value={modalFormData.rollNo}
                  onChange={e => setModalFormData({ ...modalFormData, rollNo: parseInt(e.target.value) || 1 })}
                  className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
                />
              </div>

              {/* Admission / Student ID */}
              <div>
                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                  Admission / Student ID
                </label>
                <input
                  type="text"
                  value={modalFormData.admissionNo}
                  onChange={e => setModalFormData({ ...modalFormData, admissionNo: e.target.value })}
                  placeholder="e.g. KV-2025-0101"
                  className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
                />
              </div>

              {/* Class & Section */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                    Class
                  </label>
                  <select
                    value={modalFormData.className}
                    onChange={e => setModalFormData({ ...modalFormData, className: e.target.value })}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white"
                  >
                    <option value="I">Class I</option>
                    <option value="II">Class II</option>
                    <option value="III">Class III</option>
                    <option value="IV">Class IV</option>
                    <option value="V">Class V</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                    Section
                  </label>
                  <select
                    value={modalFormData.section}
                    onChange={e => setModalFormData({ ...modalFormData, section: e.target.value })}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white"
                  >
                    <option value="A">Sec A</option>
                    <option value="B">Sec B</option>
                    <option value="C">Sec C</option>
                    <option value="D">Sec D</option>
                  </select>
                </div>
              </div>

              {/* Language Medium */}
              <div>
                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                  Language Medium / Subject
                </label>
                <select
                  value={modalFormData.subjectName}
                  onChange={e => setModalFormData({ ...modalFormData, subjectName: e.target.value })}
                  className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white"
                >
                  <option value="Hindi">Hindi (Rimjhim / Sarangi)</option>
                  <option value="English">English (Mridang / Marigold)</option>
                  <option value="Sanskrit">Sanskrit (रुचिरा)</option>
                </select>
              </div>

              {/* TARA Level */}
              <div>
                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                  TARA Reading Level
                </label>
                <select
                  value={modalFormData.taraLevel}
                  onChange={e => setModalFormData({ ...modalFormData, taraLevel: e.target.value })}
                  className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white"
                >
                  {TARA_READING_LEVELS.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              {/* WCPM Assessment Scores */}
              <div className="sm:col-span-2 grid grid-cols-3 gap-3 p-3.5 bg-black/30 rounded-2xl border border-white/5">
                <div>
                  <label className="text-[10px] font-bold text-rose-300 uppercase block mb-1">Baseline WCPM</label>
                  <input
                    type="number"
                    min={0}
                    value={modalFormData.baselineWcpm}
                    onChange={e => setModalFormData({ ...modalFormData, baselineWcpm: parseInt(e.target.value) || 0 })}
                    className="w-full py-1.5 px-3 bg-black/50 border border-white/10 rounded-xl text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-300 uppercase block mb-1">Midline WCPM</label>
                  <input
                    type="number"
                    min={0}
                    value={modalFormData.midlineWcpm}
                    onChange={e => setModalFormData({ ...modalFormData, midlineWcpm: parseInt(e.target.value) || 0 })}
                    className="w-full py-1.5 px-3 bg-black/50 border border-white/10 rounded-xl text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-emerald-300 uppercase block mb-1">Endline WCPM</label>
                  <input
                    type="number"
                    min={0}
                    value={modalFormData.endlineWcpm}
                    onChange={e => setModalFormData({ ...modalFormData, endlineWcpm: parseInt(e.target.value) || 0 })}
                    className="w-full py-1.5 px-3 bg-black/50 border border-white/10 rounded-xl text-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* Remedial Strategy */}
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                    Remedial Strategy & Measures
                  </label>
                  <span className="text-[10px] text-gray-400">Quick Presets below</span>
                </div>
                <textarea
                  rows={2}
                  value={modalFormData.remedialMeasures}
                  onChange={e => setModalFormData({ ...modalFormData, remedialMeasures: e.target.value })}
                  placeholder="Describe reading intervention plan..."
                  className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs leading-relaxed"
                />

                {/* Quick Presets Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {REMEDIAL_STRATEGY_PRESETS.slice(0, 4).map((strat, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setModalFormData({ ...modalFormData, remedialMeasures: strat })}
                      className="px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] truncate max-w-xs transition-colors cursor-pointer"
                    >
                      {strat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add to Master Directory Checkbox */}
              <div className="sm:col-span-2 flex items-center gap-2 pt-2 border-t border-white/5">
                <input
                  type="checkbox"
                  id="addToMaster"
                  checked={modalFormData.addToMasterDirectory}
                  onChange={e => setModalFormData({ ...modalFormData, addToMasterDirectory: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-black/40 border-white/20 focus:ring-indigo-500"
                />
                <label htmlFor="addToMaster" className="text-xs text-gray-300 cursor-pointer">
                  Sync & register student in global school master directory (<code className="text-indigo-300 font-mono text-[10px]">setup:students</code>)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-gray-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModal}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <Save className="w-4 h-4" />
                <span>Save Student Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: UNIVERSAL IMPORT MODAL (CSV / EXCEL / PASTE)                */}
      {/* ==================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <span>Import Students into ORF TARA Tracker</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Batch import student rosters from CSV, Excel, or Google Sheets text copy-paste
                </p>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setPreviewStudents([]);
                }}
                className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Class & Language Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-black/30 rounded-2xl border border-white/5 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-indigo-300">Target Class</label>
                <select
                  value={importTargetClass}
                  onChange={e => setImportTargetClass(e.target.value)}
                  className="w-full mt-1 py-1.5 px-2.5 bg-black/50 border border-white/10 rounded-xl text-white"
                >
                  <option value="I">Class I</option>
                  <option value="II">Class II</option>
                  <option value="III">Class III</option>
                  <option value="IV">Class IV</option>
                  <option value="V">Class V</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-indigo-300">Target Section</label>
                <select
                  value={importTargetSection}
                  onChange={e => setImportTargetSection(e.target.value)}
                  className="w-full mt-1 py-1.5 px-2.5 bg-black/50 border border-white/10 rounded-xl text-white"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-indigo-300">Language Medium</label>
                <select
                  value={importTargetSubject}
                  onChange={e => setImportTargetSubject(e.target.value)}
                  className="w-full mt-1 py-1.5 px-2.5 bg-black/50 border border-white/10 rounded-xl text-white"
                >
                  <option value="Hindi">Hindi (Rimjhim / Sarangi)</option>
                  <option value="English">English (Mridang / Marigold)</option>
                  <option value="Sanskrit">Sanskrit (रुचिरा)</option>
                </select>
              </div>
            </div>

            {/* Sub-Tabs for Import Methods */}
            <div className="flex border-b border-white/10 gap-4 text-xs font-bold">
              <button
                onClick={() => setImportSubTab('file')}
                className={`pb-2 border-b-2 transition-all cursor-pointer ${
                  importSubTab === 'file'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                1. Upload CSV / Excel File
              </button>

              <button
                onClick={() => setImportSubTab('paste')}
                className={`pb-2 border-b-2 transition-all cursor-pointer ${
                  importSubTab === 'paste'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                2. Paste from Google Sheets / Excel
              </button>
            </div>

            {/* TAB 1: File Upload */}
            {importSubTab === 'file' && (
              <div className="space-y-4 text-xs">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-8 text-center cursor-pointer bg-emerald-950/10 hover:bg-emerald-950/20 transition-all group"
                >
                  <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold text-white">Click or drag & drop student file here</p>
                  <p className="text-xs text-gray-400 mt-1">Supports .csv, .xlsx, and .xls spreadsheet formats</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white/5 rounded-xl text-xs">
                  <span className="text-gray-400">Need a template to get started?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadSampleCSV}
                      className="px-3 py-1 bg-white/10 hover:bg-white/15 text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Sample CSV</span>
                    </button>
                    <button
                      onClick={handleDownloadBlankCSV}
                      className="px-3 py-1 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Blank Template</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Text Paste */}
            {importSubTab === 'paste' && (
              <div className="space-y-3 text-xs">
                <p className="text-gray-300">
                  Copy rows from Excel or Google Sheets (e.g. Columns: <code className="text-emerald-300 font-mono">Roll No | Student Name | Admission No | Baseline | Midline | Endline | Remedial</code>) and paste below:
                </p>
                <textarea
                  rows={6}
                  value={pastedData}
                  onChange={e => setPastedData(e.target.value)}
                  placeholder="1	Aarav Sharma	KV-2025-01	24	35	48	Daily paired reading&#10;2	Ananya Deshmukh	KV-2025-02	42	52	65	Barkha readers"
                  className="w-full p-3 bg-black/50 border border-white/10 rounded-2xl text-white font-mono text-xs leading-relaxed"
                />
                <button
                  onClick={handleParsePastedText}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Parse Pasted Data</span>
                </button>
              </div>
            )}

            {/* Error Display */}
            {importError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Preview Table */}
            {previewStudents.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Parsed {previewStudents.length} Students Preview:</span>
                  </h4>
                  <span className="text-[10px] text-emerald-300 font-mono">Ready to import into Class {importTargetClass}-{importTargetSection}</span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/40">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-emerald-950/60 text-emerald-300 text-[10px] uppercase border-b border-white/10">
                        <th className="p-2 w-12 text-center">Roll</th>
                        <th className="p-2 font-sans">Name</th>
                        <th className="p-2">Admission No</th>
                        <th className="p-2 text-center">Base</th>
                        <th className="p-2 text-center">Mid</th>
                        <th className="p-2 text-center">End</th>
                        <th className="p-2 font-sans">Remedial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[11px] text-gray-300">
                      {previewStudents.map((st, i) => (
                        <tr key={i}>
                          <td className="p-1.5 text-center text-amber-300 font-bold">#{st.rollNo}</td>
                          <td className="p-1.5 font-bold text-white font-sans">{st.studentName}</td>
                          <td className="p-1.5 text-gray-400">{st.admissionNo}</td>
                          <td className="p-1.5 text-center text-rose-300">{st.baselineWcpm}</td>
                          <td className="p-1.5 text-center text-amber-300">{st.midlineWcpm}</td>
                          <td className="p-1.5 text-center text-emerald-300">{st.endlineWcpm}</td>
                          <td className="p-1.5 text-gray-400 truncate max-w-xs font-sans">{st.remedialMeasures}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setPreviewStudents([]);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-gray-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCommitImport}
                disabled={previewStudents.length === 0}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg ${
                  previewStudents.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Import ({previewStudents.length} Students)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: BATCH QUICK FILL MODAL                                      */}
      {/* ==================================================================== */}
      {isQuickFillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <span>Batch Quick Fill Tool</span>
              </h3>
              <button
                onClick={() => setIsQuickFillOpen(false)}
                className="p-1 hover:bg-white/10 text-gray-400 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Uniformly update assessment fields across all <span className="font-bold text-white">{displayItems.length} students</span> currently in Class {selectedClass}-{selectedSection}:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-purple-300 uppercase">Target Field</label>
                <select
                  value={quickFillType}
                  onChange={e => {
                    const t = e.target.value as any;
                    setQuickFillType(t);
                    if (t === 'remedial') setQuickFillValue(REMEDIAL_STRATEGY_PRESETS[0]);
                    else setQuickFillValue(35);
                  }}
                  className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white"
                >
                  <option value="baseline">Baseline WCPM (Words per minute)</option>
                  <option value="midline">Midline WCPM (Words per minute)</option>
                  <option value="endline">Endline WCPM (Words per minute)</option>
                  <option value="remedial">Remedial Strategy Text</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-purple-300 uppercase">Fill Value</label>
                {quickFillType === 'remedial' ? (
                  <select
                    value={String(quickFillValue)}
                    onChange={e => setQuickFillValue(e.target.value)}
                    className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs"
                  >
                    {REMEDIAL_STRATEGY_PRESETS.map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min={0}
                    max={150}
                    value={quickFillValue}
                    onChange={e => setQuickFillValue(parseInt(e.target.value) || 0)}
                    className="w-full mt-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white font-mono font-bold"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setIsQuickFillOpen(false)}
                className="px-4 py-2 bg-white/10 text-gray-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyQuickFill}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply to All Students</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: DELETE CONFIRMATION MODAL                                   */}
      {/* ==================================================================== */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remove Student?</h3>
                <p className="text-xs text-gray-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-white">{deletingStudent.name}</span> from the ORF assessment tracker?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 bg-white/10 text-gray-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Yes, Remove Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
