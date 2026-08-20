import React, { useState, useEffect, useRef } from "react";
import {
  Lightbulb,
  Award,
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
  Sparkles
} from "lucide-react";
import {
  TeacherInnovationProject31aRecord,
  TeacherBestPractice31bRecord,
  RemedialAttachmentItem,
  ClassSection,
  SubjectItem
} from "../types/academic";
import {
  db,
  DEFAULT_INNOVATION_PROJECTS_31A,
  DEFAULT_BEST_PRACTICES_31B
} from "../lib/storage";
import { DevModeBadge } from "./DevModeBadge";

interface TeacherInnovationAndBestPractices31Props {
  devMode?: boolean;
}

const INNOVATION_PROJECT_PRESETS = [
  {
    subject: "Mathematics (041)",
    brief: "Project \"GeoGebra Dynamic Geometry Explorers\": Implemented weekly hands-on 3D geometry exploration where students construct dynamic geometric theorems on school tablets with bi-weekly peer inquiry podcasts."
  },
  {
    subject: "Experiential Science & Ecology",
    brief: "Project \"Green Vidyalaya Micro-Composting & QR-Tagging\": Catalogued 42 indigenous campus tree species, created digital audio QR tags, and managed a zero-waste organic compost unit."
  },
  {
    subject: "English & Language Arts",
    brief: "Project \"Story-Craft Digital Audiobooks & Theatre\": Students recorded multilingual audio stories with background Foley sound effects to foster reading fluency and confidence."
  },
  {
    subject: "Computational Thinking & AI",
    brief: "Project \"Scratch Coding & Micro:bit Weather Station\": Guided middle school students in designing environmental sensors and automated classroom plant watering monitors."
  }
];

const BEST_PRACTICE_PRESETS = [
  {
    desc: "Zero-Period Peer Tutoring Circles: Pairing high-achieving student mentors with learners requiring remedial support for 20 minutes before morning assembly with guided formula flashcards.",
    outcome: "34% improvement in periodic test marks of low-scoring students and enhanced leadership skills among student mentors."
  },
  {
    desc: "Gamified \"Math Olympiad Challenge of the Week\" on Vidyalaya Corridor Bulletin Board featuring logic puzzles, riddle cards, and QR-code solution submissions.",
    outcome: "Over 180+ weekly student submissions; 14 students qualified for KVS Regional Mathematical Olympiad Stage 2."
  },
  {
    desc: "Continuous Audio-Visual Student Reflection Logs: Students record a 60-second summary of key concepts learned at the end of each major unit using school tablets.",
    outcome: "Significantly enhanced retention of scientific definitions and eliminated conceptual misconceptions early."
  },
  {
    desc: "Mistake Book (गलती कॉपी) Routine: Dedicated notebook where students analyze their own test errors with root-cause correction steps before submitting for re-evaluation.",
    outcome: "Recurring calculation and formula recall errors dropped by 45% in terminal board sample papers."
  }
];

export const TeacherInnovationAndBestPractices31: React.FC<TeacherInnovationAndBestPractices31Props> = ({ devMode }) => {
  const [activeTab, setActiveTab] = useState<"31a" | "31b" | "all">("all");
  const [innovationList, setInnovationList] = useState<TeacherInnovationProject31aRecord[]>([]);
  const [bestPracticesList, setBestPracticesList] = useState<TeacherBestPractice31bRecord[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal States
  const [is31aModalOpen, setIs31aModalOpen] = useState(false);
  const [is31bModalOpen, setIs31bModalOpen] = useState(false);
  const [editing31a, setEditing31a] = useState<TeacherInnovationProject31aRecord | null>(null);
  const [editing31b, setEditing31b] = useState<TeacherBestPractice31bRecord | null>(null);

  // Form 31a State
  const [form31a, setForm31a] = useState<Partial<TeacherInnovationProject31aRecord>>({
    className: "Class IX & X",
    section: "A & B",
    subject: "Mathematics (041)",
    briefOfProjectAndExecution: "",
    academicYear: "2025-26",
    attachments: [],
    remarks: ""
  });

  // Form 31b State
  const [form31b, setForm31b] = useState<Partial<TeacherBestPractice31bRecord>>({
    description: "",
    outcome: "",
    academicYear: "2025-26",
    attachments: [],
    remarks: ""
  });

  // Media Preview Viewer Modal
  const [previewAttachment, setPreviewAttachment] = useState<{
    item: RemedialAttachmentItem;
    contextTitle: string;
  } | null>(null);

  const fileInputRef31a = useRef<HTMLInputElement>(null);
  const fileInputRef31b = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [saved31a, saved31b, savedClasses, savedSubjects] = await Promise.all([
      db.get<TeacherInnovationProject31aRecord[]>("setup:teacher_innovation_31a"),
      db.get<TeacherBestPractice31bRecord[]>("setup:teacher_best_practices_31b"),
      db.get<ClassSection[]>("setup:classes"),
      db.get<SubjectItem[]>("setup:subjects")
    ]);

    if (saved31a && saved31a.length > 0) {
      setInnovationList(saved31a);
    } else {
      setInnovationList(DEFAULT_INNOVATION_PROJECTS_31A);
      await db.set("setup:teacher_innovation_31a", DEFAULT_INNOVATION_PROJECTS_31A);
    }

    if (saved31b && saved31b.length > 0) {
      setBestPracticesList(saved31b);
    } else {
      setBestPracticesList(DEFAULT_BEST_PRACTICES_31B);
      await db.set("setup:teacher_best_practices_31b", DEFAULT_BEST_PRACTICES_31B);
    }

    if (savedClasses) setClasses(savedClasses);
    if (savedSubjects) setSubjects(savedSubjects);

    setLoading(false);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (window.confirm("Reset both 31(a) Innovation Projects and 31(b) Best Practices to official KVS defaults?")) {
      setInnovationList(DEFAULT_INNOVATION_PROJECTS_31A);
      setBestPracticesList(DEFAULT_BEST_PRACTICES_31B);
      await Promise.all([
        db.set("setup:teacher_innovation_31a", DEFAULT_INNOVATION_PROJECTS_31A),
        db.set("setup:teacher_best_practices_31b", DEFAULT_BEST_PRACTICES_31B)
      ]);
      showNotification("31(a) and 31(b) registers reset to official defaults.");
    }
  };

  // 31(a) HANDLERS
  const handleOpenCreate31a = () => {
    setEditing31a(null);
    setForm31a({
      className: classes.length > 0 ? ("Class " + classes[0].className) : "Class IX",
      section: "A & B",
      subject: subjects.length > 0 ? subjects[0].subjectName : "Mathematics (041)",
      briefOfProjectAndExecution: "",
      academicYear: "2025-26",
      attachments: [],
      remarks: ""
    });
    setIs31aModalOpen(true);
  };

  const handleOpenEdit31a = (item: TeacherInnovationProject31aRecord) => {
    setEditing31a(item);
    setForm31a({
      ...item,
      attachments: item.attachments || []
    });
    setIs31aModalOpen(true);
  };

  const handleDelete31a = async (id: string) => {
    if (window.confirm("Delete this 31(a) Innovation Project?")) {
      const updated = innovationList.filter(i => i.id !== id);
      setInnovationList(updated);
      await db.set("setup:teacher_innovation_31a", updated);
      showNotification("31(a) Project deleted.");
    }
  };

  const handleFileUpload31a = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          id: "att-inno-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
          type,
          title: file.name,
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + " KB",
          uploadedAt: new Date().toISOString().slice(0, 10),
          dataUrl: result
        };

        setForm31a(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef31a.current) fileInputRef31a.current.value = "";
    showNotification("Project evidence attached.");
  };

  const handleSave31a = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form31a.briefOfProjectAndExecution?.trim()) {
      alert("Please provide Brief of Project & Execution.");
      return;
    }

    const nextSlNo = editing31a?.slNo || (innovationList.length + 1);

    const recordToSave: TeacherInnovationProject31aRecord = {
      id: editing31a ? editing31a.id : ("inno-31a-" + Date.now()),
      slNo: nextSlNo,
      className: form31a.className || "Class IX",
      section: form31a.section || "A",
      subject: form31a.subject || "General",
      briefOfProjectAndExecution: form31a.briefOfProjectAndExecution.trim(),
      academicYear: form31a.academicYear || "2025-26",
      attachments: form31a.attachments || [],
      remarks: form31a.remarks,
      templatePageRef: 31
    };

    let updated: TeacherInnovationProject31aRecord[] = [];
    if (editing31a) {
      updated = innovationList.map(i => i.id === editing31a.id ? recordToSave : i);
    } else {
      updated = [...innovationList, recordToSave];
    }

    setInnovationList(updated);
    await db.set("setup:teacher_innovation_31a", updated);
    setIs31aModalOpen(false);
    showNotification("31(a) Innovation Project saved.");
  };

  // 31(b) HANDLERS
  const handleOpenCreate31b = () => {
    setEditing31b(null);
    setForm31b({
      description: "",
      outcome: "",
      academicYear: "2025-26",
      attachments: [],
      remarks: ""
    });
    setIs31bModalOpen(true);
  };

  const handleOpenEdit31b = (item: TeacherBestPractice31bRecord) => {
    setEditing31b(item);
    setForm31b({
      ...item,
      attachments: item.attachments || []
    });
    setIs31bModalOpen(true);
  };

  const handleDelete31b = async (id: string) => {
    if (window.confirm("Delete this 31(b) Best Practice?")) {
      const updated = bestPracticesList.filter(b => b.id !== id);
      setBestPracticesList(updated);
      await db.set("setup:teacher_best_practices_31b", updated);
      showNotification("31(b) Best Practice deleted.");
    }
  };

  const handleFileUpload31b = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          id: "att-bp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
          type,
          title: file.name,
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + " KB",
          uploadedAt: new Date().toISOString().slice(0, 10),
          dataUrl: result
        };

        setForm31b(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef31b.current) fileInputRef31b.current.value = "";
    showNotification("Best Practice evidence attached.");
  };

  const handleSave31b = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form31b.description?.trim() || !form31b.outcome?.trim()) {
      alert("Please provide Description and Outcome of best practice.");
      return;
    }

    const nextSn = editing31b?.sn || (bestPracticesList.length + 1);

    const recordToSave: TeacherBestPractice31bRecord = {
      id: editing31b ? editing31b.id : ("bp-31b-" + Date.now()),
      sn: nextSn,
      description: form31b.description.trim(),
      outcome: form31b.outcome.trim(),
      academicYear: form31b.academicYear || "2025-26",
      attachments: form31b.attachments || [],
      remarks: form31b.remarks,
      templatePageRef: 31
    };

    let updated: TeacherBestPractice31bRecord[] = [];
    if (editing31b) {
      updated = bestPracticesList.map(b => b.id === editing31b.id ? recordToSave : b);
    } else {
      updated = [...bestPracticesList, recordToSave];
    }

    setBestPracticesList(updated);
    await db.set("setup:teacher_best_practices_31b", updated);
    setIs31bModalOpen(false);
    showNotification("31(b) Best Practice saved.");
  };

  if (loading) {
    return <div className="p-8 text-center text-purple-300">Loading Innovation & Best Practices...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Dev Mode Traceability Badge */}
      {devMode && (
        <DevModeBadge
          pages={31}
          title="31(a) PROJECTS UNDERTAKEN FOR INNOVATION EXPERIMENTATION & 31(b) LIST OF BEST PRACTICES UNDERTAKEN"
        />
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1.5">
              <Lightbulb className="w-4 h-4" />
              <span>KVS Teacher Diary • Pedagogical Research & Innovation Portfolio</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              31(a) PROJECTS UNDERTAKEN FOR INNOVATION EXPERIMENTATION & 31(b) BEST PRACTICES
            </h1>
            <h2 className="text-sm font-bold text-purple-300 tracking-wide mt-0.5 uppercase">
              31(a) शिक्षक द्वारा इनोवेशन एवं एक्सपेरीमेंटेशन प्रोजेक्ट & 31(b) सर्वोत्तम अभ्यास
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Official institutional portfolio documenting classroom action research, innovative STEM/pedagogical projects, high-impact teaching practices, and measurable learning gains with multimedia evidence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-700 flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={"px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer " + (
                  activeTab === "all"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                )}
              >
                All Combined ({innovationList.length + bestPracticesList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("31a")}
                className={"px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer " + (
                  activeTab === "31a"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                )}
              >
                31(a) Innovation ({innovationList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("31b")}
                className={"px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer " + (
                  activeTab === "31b"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                )}
              >
                31(b) Best Practices ({bestPracticesList.length})
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shadow transition"
              title="Print portfolio"
            >
              <Printer className="w-4 h-4 text-purple-400" />
              <span>Print Page</span>
            </button>
          </div>
        </div>

        {/* Action Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate31a}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add 31(a) Innovation Project</span>
            </button>

            <button
              onClick={handleOpenCreate31b}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add 31(b) Best Practice</span>
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
        <div className="bg-purple-950/90 border border-purple-500/50 text-purple-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-lg backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-purple-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SECTION 31(a): PROJECTS UNDERTAKEN FOR INNOVATION EXPERIMENTATION */}
      {(activeTab === "31a" || activeTab === "all") && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <Lightbulb className="w-4 h-4" />
                <span className="uppercase tracking-wider">31(a) शिक्षक द्वारा इनोवेशन एवं एक्सपेरीमेंटेशन हेतु लिए गए प्रोजेक्ट</span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                PROJECTS UNDERTAKEN BY THE TEACHER FOR INNOVATION EXPERIMENTATION
              </h3>
            </div>

            <button
              onClick={handleOpenCreate31a}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow transition self-start cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          {/* OFFICIAL 3-COLUMN TABLE FOR 31(a) */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-4 w-44 border-r border-slate-800 text-purple-300">
                    Class & Section
                  </th>
                  <th className="py-3 px-4 w-52 border-r border-slate-800 text-purple-300">
                    Subject
                  </th>
                  <th className="py-3 px-6 border-r border-slate-800 text-purple-300">
                    Brief of Project & Execution
                  </th>
                  <th className="py-3 px-3 w-20 text-center text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                {innovationList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                      No innovation & experimentation projects logged yet.
                    </td>
                  </tr>
                ) : (
                  innovationList.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition">
                      {/* Column 1: Class & Section */}
                      <td className="py-3.5 px-4 font-bold text-purple-200 align-top border-r border-slate-800">
                        <div className="text-sm font-black">{row.className}</div>
                        {row.section && <div className="text-[11px] text-slate-400 font-normal">Section {row.section}</div>}
                        <div className="text-[10px] text-slate-500 font-mono mt-1">Session {row.academicYear || "2025-26"}</div>
                      </td>

                      {/* Column 2: Subject */}
                      <td className="py-3.5 px-4 font-semibold text-slate-200 align-top border-r border-slate-800">
                        {row.subject}
                      </td>

                      {/* Column 3: Brief of Project & Execution */}
                      <td className="py-3.5 px-6 align-top border-r border-slate-800 leading-relaxed">
                        <p className="text-xs text-slate-200 whitespace-pre-line font-medium">
                          {row.briefOfProjectAndExecution}
                        </p>

                        {/* Evidence Files Attachment Badges */}
                        {row.attachments && row.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
                            {row.attachments.map(att => (
                              <button
                                key={att.id}
                                type="button"
                                onClick={() => setPreviewAttachment({ item: att, contextTitle: row.className + " (" + row.subject + ") - " + att.title })}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950 border border-purple-500/30 text-purple-300 hover:bg-purple-950/40 transition cursor-pointer"
                                title="Click to view/play attached media"
                              >
                                {att.type === "photo" && <Image className="w-3 h-3 text-emerald-400" />}
                                {att.type === "audio" && <Volume2 className="w-3 h-3 text-amber-400" />}
                                {att.type === "video" && <Video className="w-3 h-3 text-rose-400" />}
                                {att.type === "pdf" && <FileText className="w-3 h-3 text-indigo-400" />}
                                <span className="truncate max-w-[140px]">{att.fileName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit31a(row)}
                            className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                            title="Edit project"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete31a(row.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Delete project"
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

      {/* SECTION 31(b): LIST OF BEST PRACTICES UNDERTAKEN */}
      {(activeTab === "31b" || activeTab === "all") && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Award className="w-4 h-4" />
                <span className="uppercase tracking-wider">31(b) किये गए सर्वोत्तम अभ्यासों की सूची</span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                LIST OF BEST PRACTICES UNDERTAKEN
              </h3>
            </div>

            <button
              onClick={handleOpenCreate31b}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow transition self-start cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Best Practice</span>
            </button>
          </div>

          {/* OFFICIAL 3-COLUMN TABLE FOR 31(b) */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-4 w-16 text-center border-r border-slate-800 text-amber-300">
                    S.N.
                  </th>
                  <th className="py-3 px-6 border-r border-slate-800 text-amber-300">
                    Description
                  </th>
                  <th className="py-3 px-6 border-r border-slate-800 text-amber-300">
                    Outcome
                  </th>
                  <th className="py-3 px-3 w-20 text-center text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                {bestPracticesList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                      No pedagogical best practices logged yet.
                    </td>
                  </tr>
                ) : (
                  bestPracticesList.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition">
                      {/* Column 1: S.N. */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300 text-center align-top border-r border-slate-800">
                        {row.sn || idx + 1}
                      </td>

                      {/* Column 2: Description */}
                      <td className="py-3.5 px-6 align-top border-r border-slate-800 leading-relaxed">
                        <p className="text-xs text-slate-200 whitespace-pre-line font-medium">
                          {row.description}
                        </p>

                        {/* Evidence Files Attachment Badges */}
                        {row.attachments && row.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
                            {row.attachments.map(att => (
                              <button
                                key={att.id}
                                type="button"
                                onClick={() => setPreviewAttachment({ item: att, contextTitle: "Best Practice #" + row.sn + " - " + att.title })}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-950 border border-amber-500/30 text-amber-300 hover:bg-amber-950/40 transition cursor-pointer"
                                title="Click to view/play attached media"
                              >
                                {att.type === "photo" && <Image className="w-3 h-3 text-emerald-400" />}
                                {att.type === "audio" && <Volume2 className="w-3 h-3 text-amber-400" />}
                                {att.type === "video" && <Video className="w-3 h-3 text-rose-400" />}
                                {att.type === "pdf" && <FileText className="w-3 h-3 text-indigo-400" />}
                                <span className="truncate max-w-[140px]">{att.fileName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Column 3: Outcome */}
                      <td className="py-3.5 px-6 align-top border-r border-slate-800 leading-relaxed font-medium text-emerald-300">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{row.outcome}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit31b(row)}
                            className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition"
                            title="Edit practice"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete31b(row.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Delete practice"
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

      {/* 31(a) ADD / EDIT MODAL */}
      {is31aModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {editing31a ? "Edit 31(a) Innovation Project" : "Add 31(a) Innovation & Experimentation Project"}
                </h3>
              </div>
              <button
                onClick={() => setIs31aModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave31a} className="space-y-4 text-xs">
              {/* Presets Quick Fill */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quick Innovation Project Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {INNOVATION_PROJECT_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setForm31a(prev => ({
                        ...prev,
                        subject: preset.subject,
                        briefOfProjectAndExecution: preset.brief
                      }))}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-purple-950 text-slate-300 hover:text-purple-200 border border-slate-700 rounded-lg text-[10px] transition cursor-pointer"
                    >
                      {preset.subject}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Class & Section <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Class IX & X"
                    value={form31a.className}
                    onChange={(e) => setForm31a({ ...form31a, className: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A & B"
                    value={form31a.section || ""}
                    onChange={(e) => setForm31a({ ...form31a, section: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={form31a.academicYear || "2025-26"}
                    onChange={(e) => setForm31a({ ...form31a, academicYear: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Subject <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics (041) & STEM"
                  value={form31a.subject}
                  onChange={(e) => setForm31a({ ...form31a, subject: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Brief of Project & Execution <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Describe project objectives, student engagement methodology, weekly execution timeline, tools used, and measurable results..."
                  value={form31a.briefOfProjectAndExecution}
                  onChange={(e) => setForm31a({ ...form31a, briefOfProjectAndExecution: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-purple-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* MULTIMEDIA EVIDENCE UPLOAD 31a */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-purple-400" />
                    <span>Attach Project Evidence (Project Photo, Model Video, Audio Viva, PDF Report)</span>
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef31a}
                    onChange={handleFileUpload31a}
                    accept="image/*,audio/*,video/*,.pdf"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef31a.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                  >
                    <Paperclip className="w-3 h-3 text-purple-400" />
                    <span>Upload Evidence</span>
                  </button>
                </div>

                {form31a.attachments && form31a.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form31a.attachments.map(att => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg text-xs"
                      >
                        {att.type === "photo" && <Image className="w-3.5 h-3.5 text-emerald-400" />}
                        {att.type === "audio" && <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                        {att.type === "video" && <Video className="w-3.5 h-3.5 text-rose-400" />}
                        {att.type === "pdf" && <FileText className="w-3.5 h-3.5 text-indigo-400" />}
                        <span className="text-slate-200 text-[11px] truncate max-w-[130px]">{att.fileName}</span>
                        <button
                          type="button"
                          onClick={() => setForm31a(prev => ({ ...prev, attachments: (prev.attachments || []).filter(a => a.id !== att.id) }))}
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
                <button
                  type="button"
                  onClick={() => setIs31aModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save 31(a) Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 31(b) ADD / EDIT MODAL */}
      {is31bModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {editing31b ? "Edit 31(b) Best Practice" : "Add 31(b) Best Practice Undertaken"}
                </h3>
              </div>
              <button
                onClick={() => setIs31bModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave31b} className="space-y-4 text-xs">
              {/* Presets Quick Fill */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quick Best Practice Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {BEST_PRACTICE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setForm31b(prev => ({
                        ...prev,
                        description: preset.desc,
                        outcome: preset.outcome
                      }))}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-amber-950 text-slate-300 hover:text-amber-200 border border-slate-700 rounded-lg text-[10px] transition cursor-pointer"
                    >
                      {preset.desc.slice(0, 35)}...
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Description of Best Practice <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Detailed description of pedagogical practice, methodology, classroom implementation, and strategy..."
                  value={form31b.description}
                  onChange={(e) => setForm31b({ ...form31b, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-amber-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Outcome & Measurable Impact <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Document measurable academic improvements, test score gains, reduction in errors, or behavioral benefits..."
                  value={form31b.outcome}
                  onChange={(e) => setForm31b({ ...form31b, outcome: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-amber-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* MULTIMEDIA EVIDENCE UPLOAD 31b */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                    <span>Attach Best Practice Evidence (Classroom Photos, Audio Testimonials, PDF)</span>
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef31b}
                    onChange={handleFileUpload31b}
                    accept="image/*,audio/*,video/*,.pdf"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef31b.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                  >
                    <Paperclip className="w-3 h-3 text-amber-400" />
                    <span>Upload Evidence</span>
                  </button>
                </div>

                {form31b.attachments && form31b.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form31b.attachments.map(att => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg text-xs"
                      >
                        {att.type === "photo" && <Image className="w-3.5 h-3.5 text-emerald-400" />}
                        {att.type === "audio" && <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                        {att.type === "video" && <Video className="w-3.5 h-3.5 text-rose-400" />}
                        {att.type === "pdf" && <FileText className="w-3.5 h-3.5 text-indigo-400" />}
                        <span className="text-slate-200 text-[11px] truncate max-w-[130px]">{att.fileName}</span>
                        <button
                          type="button"
                          onClick={() => setForm31b(prev => ({ ...prev, attachments: (prev.attachments || []).filter(a => a.id !== att.id) }))}
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
                <button
                  type="button"
                  onClick={() => setIs31bModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-900/40 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save 31(b) Practice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEDIA PREVIEW VIEWER MODAL */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-purple-400" />
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
                  <span className="text-xs text-slate-400">Attached project photo document ({previewAttachment.item.fileSize}).</span>
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
                  <span className="text-xs text-slate-400">Attached research report document ({previewAttachment.item.fileSize}).</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end text-xs pt-2 border-t border-slate-800">
              <button
                onClick={() => setPreviewAttachment(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition"
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

export default TeacherInnovationAndBestPractices31;
