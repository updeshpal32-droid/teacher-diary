import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  BookOpen,
  Target,
  Smile,
  Laptop,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Printer,
  RotateCcw,
  Paperclip,
  Image,
  Volume2,
  Video,
  FileText,
  CheckCircle2,
  UserCheck,
  Calendar,
  Layers,
  ChevronRight
} from "lucide-react";
import {
  AcademicLossCompensation28Record,
  JoyfulLearning29Record,
  CompetencyTestItem30Record,
  RemedialAttachmentItem,
  ClassSection,
  SubjectItem,
  StudentProfile
} from "../types/academic";
import {
  db,
  DEFAULT_ACADEMIC_LOSS_28,
  DEFAULT_JOYFUL_LEARNING_29,
  DEFAULT_COMPETENCY_TESTS_30
} from "../lib/storage";
import { DevModeBadge } from "./DevModeBadge";
import IctClassroomUsage27 from "./IctClassroomUsage27";

interface PedagogicalRecords28To30Props {
  devMode?: boolean;
}

const LOSS_REASON_PRESETS = [
  "Medical Leave (Dengue/Typhoid - prolonged absence)",
  "Represented Vidyalaya in KVS National Sports / Athletics Meet",
  "Mid-Session Admission Transfer from other KV (Defence Relocation)",
  "Family Emergency / Bereavement Leave",
  "Viral Fever & Health Complications during Revision Week",
  "Participated in National Children Science Congress (NCSC / JNNSMEE)",
  "Gaps in prerequisite fundamental competencies"
];

const JOYFUL_ACTIVITY_PRESETS = [
  {
    title: "Math Rangoli & Tessellations",
    act: "Experiential \"Mathematical Rangoli & Tessellations\": Students used geometric compasses, circular symmetry, and polygonal angle rules to create mathematical patterns in the Vidyalaya courtyard.",
    impact: "100% active student engagement; abstract geometry theorems transformed into vibrant visual art. Followed up with GeoGebra digital pattern creation homework."
  },
  {
    title: "Mock Environmental Court & Roleplay",
    act: "Classroom \"Mock Environmental Court & Roleplay\": Students simulated a village panchayat dispute involving industrial pollution vs river rights, taking roles of judges, scientists, and villagers.",
    impact: "Fostered critical inquiry, spontaneous public speaking, and deep environmental empathy. 28 students actively participated in arguments. Followed up with drafting policy essays."
  },
  {
    title: "Gamified Math-O-Quest Speed Quiz",
    act: "Gamified \"Math-O-Quest\" Live Speed Challenge: Used Kahoot interactive buzzers on school tablets to solve speed mental calculations, algebraic riddles, and visual puzzle cards.",
    impact: "High energy, laughter, and healthy team spirit. Eliminated math anxiety among reluctant learners. Class requested recurring bi-weekly championship rounds."
  },
  {
    title: "Low-Cost Science Toy Workshop",
    act: "Hands-on \"Low-Cost Science Toy Workshop\": Constructed balloon-powered rocket cars (Newton’s 3rd Law of Motion) and cardboard kaleidoscope tubes with mirrors.",
    impact: "Action-reaction principles and optical reflection rules grasped effortlessly through playful tactile tinkering. Followed up with group project displays in corridor showcase."
  },
  {
    title: "Outdoor Solar Shadow & Clinometer Tracking",
    act: "Outdoor \"Playground Solar Shadow & Sun Angle Tracking\": Used meter scales and clinometers to calculate tree heights and sun elevation angles using basic trigonometry.",
    impact: "Demonstrated real-world practical utility of trigonometric ratios. Students connected textbook formula with actual outdoor observations and recorded data tables accurately."
  }
];

const COMPETENCY_TEST_PRESETS = [
  "Case-Based Competency Test on Real-World Quadratic Modeling: Trajectory path of an archer’s arrow modelled by equation h(t) = -5t² + 20t + 2. Evaluated vertex maximum height, time to hit ground, and domain constraints.",
  "Assertion-Reasoning Diagnostic Item Bank on Chemical Reactions: 8 paired assertion-reason items assessing precipitation reactions, redox oxidation states, and endothermic decomposition mechanisms.",
  "Data-Interpretation & Graphical Competency Item on Linear Kinematics: Distance-time and velocity-time graphs interpreting uneven acceleration, vehicle braking distances, and area under curve calculation.",
  "Real-Life Problem Solving Test on Surface Area & Packaging Optimization: Designing minimum material tin can containers for a fruit juice manufacturer using cylindrical vs cuboidal volume-to-surface-area ratios.",
  "HOTS Inquiry & Source-Based Competency Test on Current Electricity: Multi-loop circuit analysis, calculating electric power consumption in household appliances, and auditing electricity meter tariff slabs.",
  "Experimental Reasoning Item on Cell Biology & Osmosis: Analyzing potato osmometer observations, water potential concentration gradients, and explaining hypertonic plasmolysis micro-diagrams."
];

export const PedagogicalRecords28To30: React.FC<PedagogicalRecords28To30Props> = ({ devMode }) => {
  const [activeTab, setActiveTab] = useState<"28" | "29" | "30" | "27" | "all">("all");
  const [academicLossList, setAcademicLossList] = useState<AcademicLossCompensation28Record[]>([]);
  const [joyfulLearningList, setJoyfulLearningList] = useState<JoyfulLearning29Record[]>([]);
  const [competencyList, setCompetencyList] = useState<CompetencyTestItem30Record[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Pagination for Module 28 and 30
  const [page28, setPage28] = useState<number>(1);
  const [page30, setPage30] = useState<number>(1);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("All");

  // Modals for CRUD
  const [is28ModalOpen, setIs28ModalOpen] = useState(false);
  const [is29ModalOpen, setIs29ModalOpen] = useState(false);
  const [is30ModalOpen, setIs30ModalOpen] = useState(false);
  const [isRosterImportOpen28, setIsRosterImportOpen28] = useState(false);

  // Editing state
  const [editing28, setEditing28] = useState<AcademicLossCompensation28Record | null>(null);
  const [editing29, setEditing29] = useState<JoyfulLearning29Record | null>(null);
  const [editing30, setEditing30] = useState<CompetencyTestItem30Record | null>(null);

  // Form State 28
  const [form28, setForm28] = useState<Partial<AcademicLossCompensation28Record>>({
    date: new Date().toLocaleDateString("en-GB"),
    studentName: "",
    className: "Class IX",
    section: "A",
    admissionNo: "",
    reasonForLoss: "",
    topicCompensated: "",
    remarks: "",
    pageNumber: 1,
    attachments: [],
    academicYear: "2026-27"
  });

  // Form State 29
  const [form29, setForm29] = useState<Partial<JoyfulLearning29Record>>({
    date: new Date().toLocaleDateString("en-GB"),
    className: "Class IX",
    section: "A",
    classSectionWithDate: "",
    activity: "",
    impactAndFollowUp: "",
    attachments: [],
    academicYear: "2026-27"
  });

  // Form State 30
  const [form30, setForm30] = useState<Partial<CompetencyTestItem30Record>>({
    date: new Date().toLocaleDateString("en-GB"),
    className: "Class X-A",
    section: "A",
    description: "",
    pageNumber: 1,
    attachments: [],
    academicYear: "2026-27"
  });

  // Roster Import Multi-Select State (Module 28)
  const [importClassFilter, setImportClassFilter] = useState<string>("All");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [importReason, setImportReason] = useState<string>("Medical Leave");
  const [importTopic, setImportTopic] = useState<string>("");
  const [importRemarks, setImportRemarks] = useState<string>("Remedial bridge tutorial conducted.");

  // Media Preview Viewer Modal
  const [previewAttachment, setPreviewAttachment] = useState<{
    item: RemedialAttachmentItem;
    contextTitle: string;
  } | null>(null);

  const fileInputRef28 = useRef<HTMLInputElement>(null);
  const fileInputRef29 = useRef<HTMLInputElement>(null);
  const fileInputRef30 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();

    const handleTeacherChanged = () => {
      loadData();
    };
    window.addEventListener("kvs-active-teacher-changed", handleTeacherChanged);
    return () => window.removeEventListener("kvs-active-teacher-changed", handleTeacherChanged);
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [saved28, saved29, saved30, savedClasses, savedSubjects, savedStudents] = await Promise.all([
      db.get<AcademicLossCompensation28Record[]>("setup:academic_loss_28"),
      db.get<JoyfulLearning29Record[]>("setup:joyful_learning_29"),
      db.get<CompetencyTestItem30Record[]>("setup:competency_tests_30"),
      db.get<ClassSection[]>("setup:classes"),
      db.get<SubjectItem[]>("setup:subjects"),
      db.get<StudentProfile[]>("setup:students")
    ]);

    if (saved28 && saved28.length > 0) {
      setAcademicLossList(saved28);
    } else {
      setAcademicLossList(DEFAULT_ACADEMIC_LOSS_28);
      await db.set("setup:academic_loss_28", DEFAULT_ACADEMIC_LOSS_28);
    }

    if (saved29 && saved29.length > 0) {
      setJoyfulLearningList(saved29);
    } else {
      setJoyfulLearningList(DEFAULT_JOYFUL_LEARNING_29);
      await db.set("setup:joyful_learning_29", DEFAULT_JOYFUL_LEARNING_29);
    }

    if (saved30 && saved30.length > 0) {
      setCompetencyList(saved30);
    } else {
      setCompetencyList(DEFAULT_COMPETENCY_TESTS_30);
      await db.set("setup:competency_tests_30", DEFAULT_COMPETENCY_TESTS_30);
    }

    if (savedClasses) setClasses(savedClasses);
    if (savedSubjects) setSubjects(savedSubjects);
    if (savedStudents) setStudents(savedStudents);

    setLoading(false);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleResetDefaults = async () => {
    if (window.confirm("Reset Modules 28, 29, and 30 to official KVS defaults?")) {
      setAcademicLossList(DEFAULT_ACADEMIC_LOSS_28);
      setJoyfulLearningList(DEFAULT_JOYFUL_LEARNING_29);
      setCompetencyList(DEFAULT_COMPETENCY_TESTS_30);
      await Promise.all([
        db.set("setup:academic_loss_28", DEFAULT_ACADEMIC_LOSS_28),
        db.set("setup:joyful_learning_29", DEFAULT_JOYFUL_LEARNING_29),
        db.set("setup:competency_tests_30", DEFAULT_COMPETENCY_TESTS_30)
      ]);
      showNotification("Modules 28, 29 & 30 reset to official defaults.");
    }
  };

  // ============================================================================
  // MODULE 28 HANDLERS (Academic Loss Compensation)
  // ============================================================================
  const handleOpenCreate28 = () => {
    setEditing28(null);
    setForm28({
      date: new Date().toLocaleDateString("en-GB"),
      studentName: "",
      className: classes.length > 0 ? ("Class " + classes[0].className) : "Class IX",
      section: classes.length > 0 && classes[0].section ? classes[0].section : "A",
      admissionNo: "",
      reasonForLoss: "",
      topicCompensated: "",
      remarks: "Special zero-period tutorial conducted; practice worksheet solved.",
      pageNumber: page28,
      attachments: [],
      academicYear: "2025-26"
    });
    setIs28ModalOpen(true);
  };

  const handleOpenEdit28 = (item: AcademicLossCompensation28Record) => {
    setEditing28(item);
    setForm28({
      ...item,
      attachments: item.attachments || []
    });
    setIs28ModalOpen(true);
  };

  const handleDelete28 = async (id: string) => {
    if (window.confirm("Delete this Academic Loss Compensation entry?")) {
      const updated = academicLossList.filter(item => item.id !== id);
      setAcademicLossList(updated);
      await db.set("setup:academic_loss_28", updated);
      showNotification("Academic Loss record deleted.");
    }
  };

  const handleFileUpload28 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      let type: "photo" | "audio" | "video" | "pdf" | "other" = "other";
      if (file.type.startsWith("image/")) type = "photo";
      else if (file.type.startsWith("audio/")) type = "audio";
      else if (file.type.startsWith("video/")) type = "video";
      else if (file.type === "application/pdf") type = "pdf";

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const newAttachment: RemedialAttachmentItem = {
          id: "att-alc-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
          type,
          title: file.name,
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + " KB",
          uploadedAt: new Date().toISOString().slice(0, 10),
          dataUrl: result
        };

        setForm28(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef28.current) fileInputRef28.current.value = "";
    showNotification("Evidence attached.");
  };

  const handleSave28 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form28.studentName?.trim() || !form28.reasonForLoss?.trim() || !form28.topicCompensated?.trim()) {
      alert("Please fill student name, reason for loss, and topic compensated.");
      return;
    }

    const nextSl = editing28?.slNo || (academicLossList.length + 1);

    const recordToSave: AcademicLossCompensation28Record = {
      id: editing28 ? editing28.id : ("alc-28-" + Date.now()),
      slNo: nextSl,
      date: form28.date || new Date().toLocaleDateString("en-GB"),
      studentName: form28.studentName.trim(),
      className: form28.className || "Class IX",
      section: form28.section || "A",
      admissionNo: form28.admissionNo,
      reasonForLoss: form28.reasonForLoss.trim(),
      topicCompensated: form28.topicCompensated.trim(),
      remarks: form28.remarks || "Compensation complete.",
      pageNumber: form28.pageNumber || page28,
      attachments: form28.attachments || [],
      academicYear: form28.academicYear || "2025-26",
      templatePageRef: 28
    };

    let updated: AcademicLossCompensation28Record[] = [];
    if (editing28) {
      updated = academicLossList.map(item => item.id === editing28.id ? recordToSave : item);
    } else {
      updated = [...academicLossList, recordToSave];
    }

    setAcademicLossList(updated);
    await db.set("setup:academic_loss_28", updated);
    setIs28ModalOpen(false);
    showNotification("Academic Loss Compensation record saved.");
  };

  // Bulk Roster Import (Module 28)
  const handleBulkImportFromRoster28 = async () => {
    if (selectedStudentIds.length === 0) {
      alert("Please select at least one student from the roster.");
      return;
    }

    const targetStudents = students.filter(s => selectedStudentIds.includes(s.id));
    const newRecords: AcademicLossCompensation28Record[] = targetStudents.map((st, idx) => ({
      id: "alc-imp-" + Date.now() + "-" + idx,
      slNo: academicLossList.length + idx + 1,
      date: new Date().toLocaleDateString("en-GB"),
      studentName: st.name,
      className: st.className ? ("Class " + st.className) : "Class IX",
      section: st.section || "A",
      admissionNo: st.admissionNo || "",
      reasonForLoss: importReason,
      topicCompensated: importTopic || "Remedial Concept Catch-up Module",
      remarks: importRemarks,
      pageNumber: page28,
      attachments: [],
      academicYear: "2025-26",
      templatePageRef: 28
    }));

    const updated = [...academicLossList, ...newRecords];
    setAcademicLossList(updated);
    await db.set("setup:academic_loss_28", updated);
    setIsRosterImportOpen28(false);
    setSelectedStudentIds([]);
    showNotification(newRecords.length + " students imported from roster into Academic Loss Register.");
  };

  // ============================================================================
  // MODULE 29 HANDLERS (Joyful Learning)
  // ============================================================================
  const handleOpenCreate29 = () => {
    setEditing29(null);
    const defaultDate = new Date().toLocaleDateString("en-GB");
    const defaultClass = classes.length > 0 ? ("Class " + classes[0].className) : "Class IX";
    const defaultSec = classes.length > 0 && classes[0].section ? classes[0].section : "A";
    setForm29({
      date: defaultDate,
      className: defaultClass,
      section: defaultSec,
      classSectionWithDate: defaultClass + "-" + defaultSec + " (" + defaultDate + ")",
      activity: "",
      impactAndFollowUp: "",
      attachments: [],
      academicYear: "2025-26"
    });
    setIs29ModalOpen(true);
  };

  const handleOpenEdit29 = (item: JoyfulLearning29Record) => {
    setEditing29(item);
    setForm29({
      ...item,
      attachments: item.attachments || []
    });
    setIs29ModalOpen(true);
  };

  const handleDelete29 = async (id: string) => {
    if (window.confirm("Delete this Joyful Learning entry?")) {
      const updated = joyfulLearningList.filter(item => item.id !== id);
      setJoyfulLearningList(updated);
      await db.set("setup:joyful_learning_29", updated);
      showNotification("Joyful Learning record deleted.");
    }
  };

  const handleFileUpload29 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      let type: "photo" | "audio" | "video" | "pdf" | "other" = "other";
      if (file.type.startsWith("image/")) type = "photo";
      else if (file.type.startsWith("audio/")) type = "audio";
      else if (file.type.startsWith("video/")) type = "video";
      else if (file.type === "application/pdf") type = "pdf";

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const newAttachment: RemedialAttachmentItem = {
          id: "att-jl-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
          type,
          title: file.name,
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + " KB",
          uploadedAt: new Date().toISOString().slice(0, 10),
          dataUrl: result
        };

        setForm29(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef29.current) fileInputRef29.current.value = "";
    showNotification("Joyful activity evidence attached.");
  };

  const handleSave29 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form29.activity?.trim() || !form29.impactAndFollowUp?.trim()) {
      alert("Please provide Activity description and Impact/Follow up.");
      return;
    }

    const cName = form29.className || "Class IX";
    const cSec = form29.section || "A";
    const dt = form29.date || new Date().toLocaleDateString("en-GB");
    const combinedHeader = form29.classSectionWithDate || (cName + "-" + cSec + " (" + dt + ")");

    const recordToSave: JoyfulLearning29Record = {
      id: editing29 ? editing29.id : ("jl-29-" + Date.now()),
      slNo: editing29?.slNo || (joyfulLearningList.length + 1),
      date: dt,
      className: cName,
      section: cSec,
      classSectionWithDate: combinedHeader,
      activity: form29.activity.trim(),
      impactAndFollowUp: form29.impactAndFollowUp.trim(),
      attachments: form29.attachments || [],
      academicYear: form29.academicYear || "2025-26",
      templatePageRef: 29
    };

    let updated: JoyfulLearning29Record[] = [];
    if (editing29) {
      updated = joyfulLearningList.map(item => item.id === editing29.id ? recordToSave : item);
    } else {
      updated = [...joyfulLearningList, recordToSave];
    }

    setJoyfulLearningList(updated);
    await db.set("setup:joyful_learning_29", updated);
    setIs29ModalOpen(false);
    showNotification("Joyful Learning implementation record saved.");
  };

  // ============================================================================
  // MODULE 30 HANDLERS (Competency Based Test Items)
  // ============================================================================
  const handleOpenCreate30 = () => {
    setEditing30(null);
    setForm30({
      date: new Date().toLocaleDateString("en-GB"),
      className: classes.length > 0 ? ("Class " + classes[0].className + "-" + (classes[0].section || "A")) : "Class X-A",
      section: "A",
      description: "",
      pageNumber: page30,
      attachments: [],
      academicYear: "2025-26"
    });
    setIs30ModalOpen(true);
  };

  const handleOpenEdit30 = (item: CompetencyTestItem30Record) => {
    setEditing30(item);
    setForm30({
      ...item,
      attachments: item.attachments || []
    });
    setIs30ModalOpen(true);
  };

  const handleDelete30 = async (id: string) => {
    if (window.confirm("Delete this Competency-Based Test Item record?")) {
      const updated = competencyList.filter(item => item.id !== id);
      setCompetencyList(updated);
      await db.set("setup:competency_tests_30", updated);
      showNotification("Competency Test record deleted.");
    }
  };

  const handleFileUpload30 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      let type: "photo" | "audio" | "video" | "pdf" | "other" = "other";
      if (file.type.startsWith("image/")) type = "photo";
      else if (file.type.startsWith("audio/")) type = "audio";
      else if (file.type.startsWith("video/")) type = "video";
      else if (file.type === "application/pdf") type = "pdf";

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const newAttachment: RemedialAttachmentItem = {
          id: "att-cbt-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
          type,
          title: file.name,
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + " KB",
          uploadedAt: new Date().toISOString().slice(0, 10),
          dataUrl: result
        };

        setForm30(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef30.current) fileInputRef30.current.value = "";
    showNotification("Competency Test item evidence attached.");
  };

  const handleSave30 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form30.description?.trim()) {
      alert("Please provide Description of competency-based test items.");
      return;
    }

    const recordToSave: CompetencyTestItem30Record = {
      id: editing30 ? editing30.id : ("cbt-30-" + Date.now()),
      slNo: editing30?.slNo || (competencyList.length + 1),
      date: form30.date || new Date().toLocaleDateString("en-GB"),
      className: form30.className || "Class X",
      section: form30.section || "A",
      description: form30.description.trim(),
      pageNumber: form30.pageNumber || page30,
      attachments: form30.attachments || [],
      academicYear: form30.academicYear || "2025-26",
      templatePageRef: 30
    };

    let updated: CompetencyTestItem30Record[] = [];
    if (editing30) {
      updated = competencyList.map(item => item.id === editing30.id ? recordToSave : item);
    } else {
      updated = [...competencyList, recordToSave];
    }

    setCompetencyList(updated);
    await db.set("setup:competency_tests_30", updated);
    setIs30ModalOpen(false);
    showNotification("Competency-Based Test Item saved.");
  };

  // Filtered lists
  const filtered28 = academicLossList.filter(item => {
    const matchesPage = item.pageNumber === page28;
    const matchesClass = selectedClassFilter === "All" || item.className.includes(selectedClassFilter);
    const matchesSearch = !searchTerm || (
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reasonForLoss.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.topicCompensated.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesPage && matchesClass && matchesSearch;
  });

  const filtered29 = joyfulLearningList.filter(item => {
    const matchesClass = selectedClassFilter === "All" || item.className.includes(selectedClassFilter);
    const matchesSearch = !searchTerm || (
      item.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.impactAndFollowUp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.classSectionWithDate.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesClass && matchesSearch;
  });

  const filtered30 = competencyList.filter(item => {
    const matchesPage = item.pageNumber === page30;
    const matchesClass = selectedClassFilter === "All" || item.className.includes(selectedClassFilter);
    const matchesSearch = !searchTerm || (
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.className.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesPage && matchesClass && matchesSearch;
  });

  // Students for Roster Import filter
  const rosterFilteredStudents = students.filter(s => {
    if (importClassFilter === "All") return true;
    return s.className === importClassFilter;
  });

  if (loading) {
    return <div className="p-8 text-center text-teal-300">Loading Pedagogical Records Suite...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Dev Mode Traceability Badge */}
      {devMode && (
        <DevModeBadge
          pages={[28, 29, 30]}
          title="28-30. Pedagogical Interventions & Joyful Learning Records (Academic Loss Compensation, Joyful Learning, Competency Test Items)"
        />
      )}

      {/* Main Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-widest mb-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>KVS Teacher Diary • Pedagogical Interventions & Joyful Learning Suite</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              28-30. PEDAGOGICAL INTERVENTIONS & JOYFUL LEARNING RECORDS
            </h1>
            <h2 className="text-sm font-bold text-teal-300 tracking-wide mt-0.5 uppercase">
              28. शैक्षणिक नुकसान भरपाई • 29. आनंदपूर्ण पठन • 30. योग्यता आधारित परीक्षण
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Comprehensive institutional registers recording academic loss recovery interventions, experiential joyful learning practices, and competency-based assessment items with multimedia evidence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Main Tabs */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-700 flex items-center shadow-inner flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={"px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer " + (
                  activeTab === "all"
                    ? "bg-teal-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                )}
              >
                All Records
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("28")}
                className={"px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer " + (
                  activeTab === "28"
                    ? "bg-teal-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                )}
              >
                28. Academic Loss ({academicLossList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("29")}
                className={"px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer " + (
                  activeTab === "29"
                    ? "bg-teal-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                )}
              >
                29. Joyful Learning ({joyfulLearningList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("30")}
                className={"px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer " + (
                  activeTab === "30"
                    ? "bg-teal-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                )}
              >
                30. Competency Tests ({competencyList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("27")}
                className={"px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer " + (
                  activeTab === "27"
                    ? "bg-cyan-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                )}
              >
                27. ICT Usage
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shadow transition"
              title="Print page"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>Print Page</span>
            </button>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenCreate28}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add 28. Academic Loss Entry</span>
            </button>

            <button
              onClick={() => setIsRosterImportOpen28(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-bold rounded-lg shadow transition cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Import from Roster (28)</span>
            </button>

            <button
              onClick={handleOpenCreate29}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add 29. Joyful Activity</span>
            </button>

            <button
              onClick={handleOpenCreate30}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add 30. Competency Item</span>
            </button>
          </div>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1 text-slate-400 hover:text-slate-200 transition text-[11px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-teal-950/90 border border-teal-500/50 text-teal-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-lg backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-teal-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter / Search Bar (for tabular views) */}
      {activeTab !== "27" && (
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-300">Filter Class:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-slate-900 border border-teal-500/40 rounded-lg px-3 py-1.5 text-xs font-bold text-teal-200 focus:outline-none focus:border-teal-400"
            >
              <option value="All">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.className}>Class {c.className} {c.section ? ("(" + c.section + ")") : ""}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by student, reason, topic, activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 w-full md:w-72"
            />
          </div>
        </div>
      )}

      {/* MODULE 27 VIEW IF SELECTED */}
      {activeTab === "27" && (
        <IctClassroomUsage27 devMode={devMode} />
      )}

      {/* ======================================================================= */}
      {/* MODULE 28: 28. शैक्षणिक नुकसान की भरपाई के लिए कार्यक्रम                   */}
      {/* ======================================================================= */}
      {(activeTab === "28" || activeTab === "all") && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                <Target className="w-4 h-4" />
                <span className="uppercase tracking-wider">28. शैक्षणिक नुकसान की भरपाई के लिए कार्यक्रम</span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                RECORD OF ACADEMIC LOSS COMPENSATION PROGRAMME
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Page Switcher */}
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
                <button
                  type="button"
                  onClick={() => setPage28(1)}
                  className={"px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer " + (
                    page28 === 1 ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
                  )}
                >
                  Page 1
                </button>
                <button
                  type="button"
                  onClick={() => setPage28(2)}
                  className={"px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer " + (
                    page28 === 2 ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
                  )}
                >
                  Page 2
                </button>
              </div>

              <button
                onClick={handleOpenCreate28}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Entry</span>
              </button>
            </div>
          </div>

          {/* OFFICIAL 5-COLUMN TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-4 w-28 border-r border-slate-800 text-teal-300">
                    Date
                  </th>
                  <th className="py-3 px-4 w-48 border-r border-slate-800 text-teal-300">
                    Name of student & class
                  </th>
                  <th className="py-3 px-5 w-64 border-r border-slate-800 text-teal-300">
                    Reason for Academic loss
                  </th>
                  <th className="py-3 px-5 border-r border-slate-800 text-teal-300">
                    Topic/ lesson compensated
                  </th>
                  <th className="py-3 px-4 w-48 border-r border-slate-800 text-teal-300">
                    Remarks
                  </th>
                  <th className="py-3 px-3 w-20 text-center text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                {filtered28.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                      No academic loss compensation records logged for Page {page28}.
                    </td>
                  </tr>
                ) : (
                  filtered28.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition">
                      {/* Column 1: Date */}
                      <td className="py-3 px-4 font-mono text-teal-200 align-top border-r border-slate-800 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-400/80" />
                          <span>{row.date}</span>
                        </div>
                      </td>

                      {/* Column 2: Name of student & class */}
                      <td className="py-3 px-4 align-top border-r border-slate-800 font-bold text-white">
                        <div>{row.studentName}</div>
                        <div className="text-[11px] text-teal-300 font-medium">
                          {row.className} {row.section ? ("(" + row.section + ")") : ""}
                        </div>
                        {row.admissionNo && (
                          <div className="text-[10px] text-slate-500 font-mono">Adm: {row.admissionNo}</div>
                        )}
                      </td>

                      {/* Column 3: Reason for Academic loss */}
                      <td className="py-3 px-5 align-top border-r border-slate-800 text-rose-300 font-medium leading-relaxed">
                        {row.reasonForLoss}
                      </td>

                      {/* Column 4: Topic/ lesson compensated */}
                      <td className="py-3 px-5 align-top border-r border-slate-800 leading-relaxed">
                        <p className="text-slate-200 font-medium">{row.topicCompensated}</p>

                        {/* Attachments */}
                        {row.attachments && row.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-800/80">
                            {row.attachments.map(att => (
                              <button
                                key={att.id}
                                type="button"
                                onClick={() => setPreviewAttachment({ item: att, contextTitle: row.studentName + " (" + row.className + ") - " + att.title })}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 border border-teal-500/30 text-teal-300 hover:bg-teal-950/40 transition cursor-pointer"
                              >
                                {att.type === "photo" && <Image className="w-3 h-3 text-emerald-400" />}
                                {att.type === "audio" && <Volume2 className="w-3 h-3 text-amber-400" />}
                                {att.type === "video" && <Video className="w-3 h-3 text-rose-400" />}
                                {att.type === "pdf" && <FileText className="w-3 h-3 text-indigo-400" />}
                                <span className="truncate max-w-[120px]">{att.fileName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Column 5: Remarks */}
                      <td className="py-3 px-4 align-top border-r border-slate-800 text-emerald-300 font-medium">
                        {row.remarks || "—"}
                      </td>

                      {/* Column 6: Actions */}
                      <td className="py-3 px-3 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit28(row)}
                            className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded-lg transition"
                            title="Edit entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete28(row.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODULE 29: 29. आनंदपूर्ण पठन कार्यान्वयन का अभिलेख                         */}
      {/* ======================================================================= */}
      {(activeTab === "29" || activeTab === "all") && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Smile className="w-4 h-4" />
                <span className="uppercase tracking-wider">29. आनंदपूर्ण पठन कार्यान्वयन का अभिलेख</span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                RECORD OF IMPLEMENTATION OF JOYFUL LEARNING
              </h3>
            </div>

            <button
              onClick={handleOpenCreate29}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Joyful Activity</span>
            </button>
          </div>

          {/* OFFICIAL 3-COLUMN TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-4 w-52 border-r border-slate-800 text-amber-300">
                    Class & Section with Date
                  </th>
                  <th className="py-3 px-6 border-r border-slate-800 text-amber-300">
                    Activity
                  </th>
                  <th className="py-3 px-6 border-r border-slate-800 text-amber-300">
                    Impact and Follow up
                  </th>
                  <th className="py-3 px-3 w-20 text-center text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                {filtered29.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                      No joyful learning activities logged yet.
                    </td>
                  </tr>
                ) : (
                  filtered29.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition">
                      {/* Column 1: Class & Section with Date */}
                      <td className="py-3 px-4 font-bold text-amber-200 align-top border-r border-slate-800">
                        <div className="text-sm font-black text-white">{row.className}</div>
                        {row.section && <div className="text-xs text-amber-300 font-semibold">Section {row.section}</div>}
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-1">
                          <Calendar className="w-3 h-3 text-amber-400/80" />
                          <span>{row.date}</span>
                        </div>
                      </td>

                      {/* Column 2: Activity */}
                      <td className="py-3 px-6 align-top border-r border-slate-800 leading-relaxed font-medium text-slate-200">
                        <p className="whitespace-pre-line">{row.activity}</p>

                        {/* Attachments */}
                        {row.attachments && row.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
                            {row.attachments.map(att => (
                              <button
                                key={att.id}
                                type="button"
                                onClick={() => setPreviewAttachment({ item: att, contextTitle: row.classSectionWithDate + " - " + att.title })}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold bg-slate-950 border border-amber-500/30 text-amber-300 hover:bg-amber-950/40 transition cursor-pointer"
                              >
                                {att.type === "photo" && <Image className="w-3 h-3 text-emerald-400" />}
                                {att.type === "audio" && <Volume2 className="w-3 h-3 text-amber-400" />}
                                {att.type === "video" && <Video className="w-3 h-3 text-rose-400" />}
                                {att.type === "pdf" && <FileText className="w-3 h-3 text-indigo-400" />}
                                <span className="truncate max-w-[130px]">{att.fileName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Column 3: Impact and Follow up */}
                      <td className="py-3 px-6 align-top border-r border-slate-800 leading-relaxed font-medium text-emerald-300">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="whitespace-pre-line">{row.impactAndFollowUp}</span>
                        </div>
                      </td>

                      {/* Column 4: Actions */}
                      <td className="py-3 px-3 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit29(row)}
                            className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition"
                            title="Edit activity"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete29(row.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Delete activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODULE 30: 30. योग्यता आधारित परीक्षण सामग्री का रिकॉर्ड                   */}
      {/* ======================================================================= */}
      {(activeTab === "30" || activeTab === "all") && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <BookOpen className="w-4 h-4" />
                <span className="uppercase tracking-wider">30. योग्यता आधारित परीक्षण सामग्री का रिकॉर्ड</span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                RECORD OF COMPETENCY BASED TEST ITEMS UNDERTAKEN
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Page Switcher */}
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
                <button
                  type="button"
                  onClick={() => setPage30(1)}
                  className={"px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer " + (
                    page30 === 1 ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                  )}
                >
                  Page 1
                </button>
                <button
                  type="button"
                  onClick={() => setPage30(2)}
                  className={"px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer " + (
                    page30 === 2 ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                  )}
                >
                  Page 2
                </button>
              </div>

              <button
                onClick={handleOpenCreate30}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* OFFICIAL 3-COLUMN TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-4 w-32 border-r border-slate-800 text-indigo-300">
                    Date
                  </th>
                  <th className="py-3 px-4 w-44 border-r border-slate-800 text-indigo-300">
                    Class
                  </th>
                  <th className="py-3 px-6 border-r border-slate-800 text-indigo-300">
                    Description
                  </th>
                  <th className="py-3 px-3 w-20 text-center text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                {filtered30.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                      No competency-based test items logged for Page {page30}.
                    </td>
                  </tr>
                ) : (
                  filtered30.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition">
                      {/* Column 1: Date */}
                      <td className="py-3.5 px-4 font-mono text-indigo-200 align-top border-r border-slate-800 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400/80" />
                          <span>{row.date}</span>
                        </div>
                      </td>

                      {/* Column 2: Class */}
                      <td className="py-3.5 px-4 align-top border-r border-slate-800 font-bold text-white">
                        <div className="text-sm">{row.className}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">Session 2025-26</div>
                      </td>

                      {/* Column 3: Description */}
                      <td className="py-3.5 px-6 align-top border-r border-slate-800 leading-relaxed font-medium text-slate-200">
                        <p className="whitespace-pre-line">{row.description}</p>

                        {/* Attachments */}
                        {row.attachments && row.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
                            {row.attachments.map(att => (
                              <button
                                key={att.id}
                                type="button"
                                onClick={() => setPreviewAttachment({ item: att, contextTitle: row.className + " (" + row.date + ") - " + att.title })}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold bg-slate-950 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/40 transition cursor-pointer"
                              >
                                {att.type === "photo" && <Image className="w-3 h-3 text-emerald-400" />}
                                {att.type === "audio" && <Volume2 className="w-3 h-3 text-amber-400" />}
                                {att.type === "video" && <Video className="w-3 h-3 text-rose-400" />}
                                {att.type === "pdf" && <FileText className="w-3 h-3 text-indigo-400" />}
                                <span className="truncate max-w-[130px]">{att.fileName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Column 4: Actions */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit30(row)}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition"
                            title="Edit item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete30(row.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: ADD / EDIT MODULE 28                                            */}
      {/* ======================================================================= */}
      {is28ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">
                  {editing28 ? "Edit Academic Loss Compensation" : "Add Academic Loss Compensation Entry"}
                </h3>
              </div>
              <button onClick={() => setIs28ModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave28} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Date</label>
                  <input
                    type="text"
                    value={form28.date}
                    onChange={(e) => setForm28({ ...form28, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Student Name <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Aarav Sharma"
                    value={form28.studentName}
                    onChange={(e) => setForm28({ ...form28, studentName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Class & Section</label>
                  <div className="flex gap-2">
                    <select
                      value={form28.className}
                      onChange={(e) => setForm28({ ...form28, className: e.target.value })}
                      className="w-2/3 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={"Class " + c.className}>Class {c.className}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Sec"
                      value={form28.section || ""}
                      onChange={(e) => setForm28({ ...form28, section: e.target.value })}
                      className="w-1/3 bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-slate-200 focus:border-teal-500 focus:outline-none text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Reason Presets */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-teal-300 font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quick Reason Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {LOSS_REASON_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setForm28({ ...form28, reasonForLoss: preset })}
                      className="px-2 py-1 bg-slate-900 hover:bg-teal-950 text-slate-300 hover:text-teal-200 border border-slate-700 rounded-lg text-[10px] transition cursor-pointer"
                    >
                      {preset.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Reason for Academic Loss <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Medical Leave (Dengue - 12 days), KVS National Sports Meet, Mid-term Transfer..."
                  value={form28.reasonForLoss}
                  onChange={(e) => setForm28({ ...form28, reasonForLoss: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Topic / Lesson Compensated <span className="text-rose-400">*</span></label>
                <textarea
                  rows={3}
                  placeholder="Describe topics, concepts, NCERT exercises, and practical tutorials conducted to bridge the learning gap..."
                  value={form28.topicCompensated}
                  onChange={(e) => setForm28({ ...form28, topicCompensated: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:border-teal-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. 85% scored in post-test; extra zero-period tutorial."
                    value={form28.remarks || ""}
                    onChange={(e) => setForm28({ ...form28, remarks: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Register Page</label>
                  <select
                    value={form28.pageNumber}
                    onChange={(e) => setForm28({ ...form28, pageNumber: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                  >
                    <option value={1}>Page 1</option>
                    <option value={2}>Page 2</option>
                  </select>
                </div>
              </div>

              {/* Multimedia Evidence Upload */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-teal-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-teal-400" />
                    <span>Attach Evidence (Medical Certificate, Sports Order, Worksheets, Viva Audio)</span>
                  </label>
                  <input type="file" ref={fileInputRef28} onChange={handleFileUpload28} accept="image/*,audio/*,video/*,.pdf" multiple className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef28.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                  >
                    <Paperclip className="w-3 h-3 text-teal-400" />
                    <span>Upload Evidence</span>
                  </button>
                </div>

                {form28.attachments && form28.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form28.attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg text-xs">
                        {att.type === "photo" && <Image className="w-3.5 h-3.5 text-emerald-400" />}
                        {att.type === "audio" && <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                        {att.type === "video" && <Video className="w-3.5 h-3.5 text-rose-400" />}
                        {att.type === "pdf" && <FileText className="w-3.5 h-3.5 text-indigo-400" />}
                        <span className="text-slate-200 text-[11px] truncate max-w-[130px]">{att.fileName}</span>
                        <button
                          type="button"
                          onClick={() => setForm28(prev => ({ ...prev, attachments: (prev.attachments || []).filter(a => a.id !== att.id) }))}
                          className="text-slate-400 hover:text-rose-400 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIs28ModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-900/40">
                  <Save className="w-4 h-4" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: ROSTER BULK IMPORT FOR MODULE 28                                 */}
      {/* ======================================================================= */}
      {isRosterImportOpen28 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Import Students from Student Roster</h3>
              </div>
              <button onClick={() => setIsRosterImportOpen28(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Filter Class</label>
                  <select
                    value={importClassFilter}
                    onChange={(e) => setImportClassFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="All">All Classes ({students.length} students)</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.className}>Class {c.className} {c.section ? ("(" + c.section + ")") : ""}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Default Reason for Academic Loss</label>
                  <select
                    value={importReason}
                    onChange={(e) => setImportReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                  >
                    {LOSS_REASON_PRESETS.map((p, i) => (
                      <option key={i} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Default Topic / Lesson Compensated</label>
                <input
                  type="text"
                  placeholder="e.g. Fundamental algebra & linear equations bridge revision"
                  value={importTopic}
                  onChange={(e) => setImportTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Student Picker List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300">Select Students ({selectedStudentIds.length} selected):</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds(rosterFilteredStudents.map(s => s.id))}
                      className="text-teal-400 hover:underline cursor-pointer"
                    >
                      Select All Filtered
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-2 divide-y divide-slate-800/60">
                  {rosterFilteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">No students found matching filter.</div>
                  ) : (
                    rosterFilteredStudents.map(st => {
                      const isChecked = selectedStudentIds.includes(st.id);
                      return (
                        <label
                          key={st.id}
                          className={"flex items-center justify-between p-2 rounded-lg cursor-pointer transition " + (
                            isChecked ? "bg-teal-950/40 text-teal-200" : "hover:bg-slate-900 text-slate-300"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudentIds(prev => [...prev, st.id]);
                                } else {
                                  setSelectedStudentIds(prev => prev.filter(id => id !== st.id));
                                }
                              }}
                              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-700 bg-slate-900"
                            />
                            <div>
                              <div className="font-bold text-white">{st.name}</div>
                              <div className="text-[10px] text-slate-400">Class {st.className} {st.section ? ("(" + st.section + ")") : ""} • Roll: {st.rollNo || "—"}</div>
                            </div>
                          </div>
                          {st.admissionNo && <span className="font-mono text-[10px] text-slate-500">{st.admissionNo}</span>}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsRosterImportOpen28(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button
                  type="button"
                  onClick={handleBulkImportFromRoster28}
                  disabled={selectedStudentIds.length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-teal-900/40 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Import {selectedStudentIds.length} Students</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: ADD / EDIT MODULE 29 (Joyful Learning)                           */}
      {/* ======================================================================= */}
      {is29ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {editing29 ? "Edit Joyful Learning Activity" : "Add Joyful Learning Implementation"}
                </h3>
              </div>
              <button onClick={() => setIs29ModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave29} className="space-y-4 text-xs">
              {/* Presets */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quick Joyful Activity Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {JOYFUL_ACTIVITY_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setForm29(prev => ({
                        ...prev,
                        activity: preset.act,
                        impactAndFollowUp: preset.impact
                      }))}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-amber-950 text-slate-300 hover:text-amber-200 border border-slate-700 rounded-lg text-[10px] transition cursor-pointer"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Date</label>
                  <input
                    type="text"
                    value={form29.date}
                    onChange={(e) => setForm29({ ...form29, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Class</label>
                  <select
                    value={form29.className}
                    onChange={(e) => setForm29({ ...form29, className: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={"Class " + c.className}>Class {c.className}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Section</label>
                  <input
                    type="text"
                    placeholder="e.g. A & B"
                    value={form29.section || ""}
                    onChange={(e) => setForm29({ ...form29, section: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Activity <span className="text-rose-400">*</span></label>
                <textarea
                  rows={4}
                  placeholder="Describe experiential, joyful, gamified, tactile, or cross-curricular classroom activity conducted..."
                  value={form29.activity}
                  onChange={(e) => setForm29({ ...form29, activity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:border-amber-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Impact and Follow up <span className="text-rose-400">*</span></label>
                <textarea
                  rows={3}
                  placeholder="Document student engagement impact, conceptual gains, joyful learning indicators, and subsequent follow-up actions..."
                  value={form29.impactAndFollowUp}
                  onChange={(e) => setForm29({ ...form29, impactAndFollowUp: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:border-amber-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* Multimedia Evidence Upload */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                    <span>Attach Evidence (Activity Photos, Video Clip, Audio Reflection, Creative Write-up PDF)</span>
                  </label>
                  <input type="file" ref={fileInputRef29} onChange={handleFileUpload29} accept="image/*,audio/*,video/*,.pdf" multiple className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef29.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                  >
                    <Paperclip className="w-3 h-3 text-amber-400" />
                    <span>Upload Evidence</span>
                  </button>
                </div>

                {form29.attachments && form29.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form29.attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg text-xs">
                        {att.type === "photo" && <Image className="w-3.5 h-3.5 text-emerald-400" />}
                        {att.type === "audio" && <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                        {att.type === "video" && <Video className="w-3.5 h-3.5 text-rose-400" />}
                        {att.type === "pdf" && <FileText className="w-3.5 h-3.5 text-indigo-400" />}
                        <span className="text-slate-200 text-[11px] truncate max-w-[130px]">{att.fileName}</span>
                        <button
                          type="button"
                          onClick={() => setForm29(prev => ({ ...prev, attachments: (prev.attachments || []).filter(a => a.id !== att.id) }))}
                          className="text-slate-400 hover:text-rose-400 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIs29ModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-900/40">
                  <Save className="w-4 h-4" />
                  <span>Save Joyful Activity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL: ADD / EDIT MODULE 30 (Competency Based Tests)                   */}
      {/* ======================================================================= */}
      {is30ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  {editing30 ? "Edit Competency Based Test Item" : "Add Competency Based Test Item"}
                </h3>
              </div>
              <button onClick={() => setIs30ModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave30} className="space-y-4 text-xs">
              {/* Presets */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quick Competency Item Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {COMPETENCY_TEST_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setForm30({ ...form30, description: preset })}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-indigo-950 text-slate-300 hover:text-indigo-200 border border-slate-700 rounded-lg text-[10px] transition cursor-pointer"
                    >
                      {preset.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Date</label>
                  <input
                    type="text"
                    value={form30.date}
                    onChange={(e) => setForm30({ ...form30, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Class</label>
                  <input
                    type="text"
                    placeholder="e.g. Class X-A & B"
                    value={form30.className}
                    onChange={(e) => setForm30({ ...form30, className: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Register Page</label>
                  <select
                    value={form30.pageNumber}
                    onChange={(e) => setForm30({ ...form30, pageNumber: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value={1}>Page 1</option>
                    <option value={2}>Page 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Description <span className="text-rose-400">*</span></label>
                <textarea
                  rows={5}
                  placeholder="Detailed description of competency-based test item, case-study context, assertion-reasoning pair, data interpretation chart, or HOTS problem..."
                  value={form30.description}
                  onChange={(e) => setForm30({ ...form30, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:border-indigo-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* Multimedia Evidence Upload */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Attach Evidence (Question Paper PDF, Rubric Doc, Evaluated Answer Photo, Viva Audio)</span>
                  </label>
                  <input type="file" ref={fileInputRef30} onChange={handleFileUpload30} accept="image/*,audio/*,video/*,.pdf" multiple className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef30.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                  >
                    <Paperclip className="w-3 h-3 text-indigo-400" />
                    <span>Upload Evidence</span>
                  </button>
                </div>

                {form30.attachments && form30.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form30.attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg text-xs">
                        {att.type === "photo" && <Image className="w-3.5 h-3.5 text-emerald-400" />}
                        {att.type === "audio" && <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                        {att.type === "video" && <Video className="w-3.5 h-3.5 text-rose-400" />}
                        {att.type === "pdf" && <FileText className="w-3.5 h-3.5 text-indigo-400" />}
                        <span className="text-slate-200 text-[11px] truncate max-w-[130px]">{att.fileName}</span>
                        <button
                          type="button"
                          onClick={() => setForm30(prev => ({ ...prev, attachments: (prev.attachments || []).filter(a => a.id !== att.id) }))}
                          className="text-slate-400 hover:text-rose-400 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIs30ModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/40">
                  <Save className="w-4 h-4" />
                  <span>Save Competency Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MEDIA PREVIEW VIEWER MODAL                                              */}
      {/* ======================================================================= */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {previewAttachment.contextTitle}
                </h3>
              </div>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center min-h-[220px] bg-slate-950 rounded-xl p-4 border border-slate-800">
              {previewAttachment.item.type === "photo" && previewAttachment.item.dataUrl ? (
                <img
                  src={previewAttachment.item.dataUrl}
                  alt={previewAttachment.item.title}
                  className="max-h-[380px] max-w-full rounded-xl object-contain border border-slate-800 shadow"
                />
              ) : previewAttachment.item.type === "photo" ? (
                <div className="flex flex-col items-center gap-2 text-center p-8">
                  <Image className="w-16 h-16 text-emerald-400/60" />
                  <span className="text-sm font-bold text-slate-200">{previewAttachment.item.fileName}</span>
                  <span className="text-xs text-slate-400">Attached photo evidence ({previewAttachment.item.fileSize}).</span>
                </div>
              ) : previewAttachment.item.type === "audio" && previewAttachment.item.dataUrl ? (
                <div className="w-full max-w-md space-y-4 p-4 text-center">
                  <div className="p-4 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 w-16 h-16 mx-auto flex items-center justify-center">
                    <Volume2 className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-bold text-white">{previewAttachment.item.title}</div>
                  <audio controls className="w-full mt-2" src={previewAttachment.item.dataUrl} />
                </div>
              ) : previewAttachment.item.type === "video" && previewAttachment.item.dataUrl ? (
                <video controls className="w-full rounded-xl border border-slate-800 shadow max-h-[400px]" src={previewAttachment.item.dataUrl} />
              ) : previewAttachment.item.type === "pdf" && previewAttachment.item.dataUrl ? (
                <iframe src={previewAttachment.item.dataUrl} title={previewAttachment.item.title} className="w-full h-[450px] rounded-xl border border-slate-800" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center p-8">
                  <FileText className="w-16 h-16 text-indigo-400/60" />
                  <span className="text-sm font-bold text-slate-200">{previewAttachment.item.fileName}</span>
                  <span className="text-xs text-slate-400">Attached document ({previewAttachment.item.fileSize}).</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end text-xs pt-2 border-t border-slate-800">
              <button
                onClick={() => setPreviewAttachment(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedagogicalRecords28To30;
