import React, { useState, useEffect, useMemo } from 'react';
import { StudentBehaviourObservationRecord, StudentProfile } from '../types/academic';
import {
  db,
  DEFAULT_STUDENT_BEHAVIOUR_OBSERVATIONS,
  DEFAULT_STUDENTS
} from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import {
  Eye,
  Plus,
  Edit2,
  Trash2,
  Printer,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
  Sparkles,
  ShieldCheck,
  Calendar,
  MapPin,
  FileText,
  X,
  Save,
  BookOpen,
  Filter,
  Lightbulb
} from 'lucide-react';

interface StudentBehaviourObservationManagerProps {
  devMode?: boolean;
}

const CATEGORY_OPTIONS = [
  'Leadership quality',
  'Discipline',
  'Teamwork',
  'Academic Integrity',
  'Punctuality',
  'Empathy & Helpfulness',
  'Extracurricular Participation',
  'Initiative & Responsibility',
  'Other'
] as const;

const CLASS_OPTIONS = [
  'Class VI-A',
  'Class VI-B',
  'Class VII-A',
  'Class VII-B',
  'Class VIII-A',
  'Class VIII-B',
  'Class IX-A',
  'Class IX-B',
  'Class X-A',
  'Class X-B',
  'Class XI-A (Science)',
  'Class XI-B (Science/Bio)',
  'Class XI-C (Commerce)',
  'Class XII-A (Science)',
  'Class XII-B (Science/Bio)',
  'Class XII-C (Commerce)'
];

const PRESET_OBSERVATION_TEMPLATES = [
  {
    title: 'Morning Assembly Leadership',
    category: 'Leadership quality' as const,
    place: 'Morning Assembly Ground',
    description: 'Led the House morning assembly march past with clear command, coordinated pledge recitation, and maintained discipline in line formation.',
    comments: 'Exemplary leadership, poise, and public speaking confidence. Recommended for student council roles.'
  },
  {
    title: 'Peer Tutoring & Academic Support',
    category: 'Teamwork' as const,
    place: 'Classroom & Library',
    description: 'Patiently guided classmates having difficulty understanding mathematical proofs and collaborated effectively during group assignments.',
    comments: 'Demonstrates deep academic empathy, collaborative spirit, and strong communication skills.'
  },
  {
    title: 'Moral Integrity & Honesty',
    category: 'Academic Integrity' as const,
    place: 'School Corridor',
    description: 'Found a valuable misplaced item during lunch break and immediately deposited it at the school reception desk.',
    comments: 'High moral character, integrity, and sense of civic responsibility. Appreciated in class.'
  },
  {
    title: 'Laboratory Safety Compliance',
    category: 'Discipline' as const,
    place: 'Science Laboratory',
    description: 'Consistently follows all safety protocols during science practicals, wears apron/goggles, and keeps the workstation pristine.',
    comments: 'Meticulous attention to laboratory discipline, safety rules, and orderly conduct.'
  },
  {
    title: 'Sportsmanship Under Pressure',
    category: 'Extracurricular Participation' as const,
    place: 'Sports Ground',
    description: 'Captained the house team in the annual athletics meet, motivated team members, and showed respectful conduct towards match officials.',
    comments: 'True sportsmanship, composure under competitive pressure, and inspiring team spirit.'
  }
];

export const StudentBehaviourObservationManager: React.FC<StudentBehaviourObservationManagerProps> = ({ devMode }) => {
  const [observations, setObservations] = useState<StudentBehaviourObservationRecord[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importClassFilter, setImportClassFilter] = useState<string>('All');
  const [selectedStudentIdsForImport, setSelectedStudentIdsForImport] = useState<string[]>([]);
  const [importCategory, setImportCategory] = useState<typeof CATEGORY_OPTIONS[number]>('Leadership quality');
  const [importPlace, setImportPlace] = useState<string>('Classroom & Campus');
  const [editingObservation, setEditingObservation] = useState<StudentBehaviourObservationRecord | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Form State
  const [formState, setFormState] = useState<Partial<StudentBehaviourObservationRecord>>({
    studentId: '',
    studentName: '',
    className: 'Class X-A',
    dateAndPlace: `${new Date().toISOString().slice(0, 10)} • Morning Assembly Ground`,
    date: new Date().toISOString().slice(0, 10),
    place: 'Morning Assembly Ground',
    category: 'Leadership quality',
    objectiveDescription: '',
    commentsByObserver: '',
    observerName: 'S. K. Sharma',
    observerDesignation: 'PGT Mathematics / Class Teacher'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const saved = await db.get<StudentBehaviourObservationRecord[]>('setup:student_behaviour_observations');
    if (saved && saved.length > 0) {
      setObservations(saved);
    } else {
      setObservations(DEFAULT_STUDENT_BEHAVIOUR_OBSERVATIONS);
      await db.set('setup:student_behaviour_observations', DEFAULT_STUDENT_BEHAVIOUR_OBSERVATIONS);
    }

    const stdList = (await db.get<StudentProfile[]>('setup:students')) || DEFAULT_STUDENTS;
    setStudents(stdList);
    setLoading(false);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingObservation(null);
    const today = new Date().toISOString().slice(0, 10);
    setFormState({
      studentId: '',
      studentName: '',
      className: selectedClassFilter !== 'All' ? selectedClassFilter : 'Class X-A',
      dateAndPlace: `${today} • Morning Assembly Ground`,
      date: today,
      place: 'Morning Assembly Ground',
      category: 'Leadership quality',
      objectiveDescription: '',
      commentsByObserver: '',
      observerName: 'S. K. Sharma',
      observerDesignation: 'PGT Mathematics'
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (obs: StudentBehaviourObservationRecord) => {
    setEditingObservation(obs);
    setFormState({ ...obs });
    setIsModalOpen(true);
  };

  // Delete Observation
  const handleDeleteObservation = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student observation?')) {
      const updated = observations.filter(o => o.id !== id);
      setObservations(updated);
      await db.set('setup:student_behaviour_observations', updated);
      showNotification('Observation record deleted.');
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (window.confirm('Reset 19. Student Behaviour Observations to official defaults?')) {
      setObservations(DEFAULT_STUDENT_BEHAVIOUR_OBSERVATIONS);
      await db.set('setup:student_behaviour_observations', DEFAULT_STUDENT_BEHAVIOUR_OBSERVATIONS);
      showNotification('Observations reset to defaults.');
    }
  };

  // Apply Quick Template
  const handleApplyTemplate = (tmpl: typeof PRESET_OBSERVATION_TEMPLATES[0]) => {
    const currentDate = formState.date || new Date().toISOString().slice(0, 10);
    setFormState(prev => ({
      ...prev,
      category: tmpl.category,
      place: tmpl.place,
      dateAndPlace: `${currentDate} • ${tmpl.place}`,
      objectiveDescription: tmpl.description,
      commentsByObserver: tmpl.comments
    }));
  };

  // Auto-fill Student Details from Roster
  const handleStudentSelect = (studentId: string) => {
    const selected = students.find(s => s.id === studentId);
    if (selected) {
      setFormState(prev => ({
        ...prev,
        studentId: selected.id,
        studentName: selected.studentName,
        className: `Class ${selected.className}-${selected.section || 'A'}`
      }));
    }
  };

  // Bulk Import Students from Roster
  const handleBulkImportStudents = async () => {
    if (selectedStudentIdsForImport.length === 0) {
      alert('Please select at least one student from the roster to import.');
      return;
    }

    const studentsToImport = students.filter(s => selectedStudentIdsForImport.includes(s.id));
    const currentDate = new Date().toISOString().slice(0, 10);

    const newObservations: StudentBehaviourObservationRecord[] = studentsToImport.map((std, idx) => ({
      id: `sbo-import-${Date.now()}-${idx}`,
      slNo: observations.length + idx + 1,
      studentId: std.id,
      studentName: std.studentName,
      className: `Class ${std.className}-${std.section || 'A'}`,
      dateAndPlace: `${currentDate} • ${importPlace}`,
      date: currentDate,
      place: importPlace,
      category: importCategory,
      objectiveDescription: `Demonstrated positive engagement, classroom discipline, and participation in ${std.className}-${std.section || 'A'} activities.`,
      commentsByObserver: `Consistent behaviour and cooperative attitude shown. Recommended to sustain active participation.`,
      templatePageRef: 33
    }));

    const updated = [...observations, ...newObservations];
    setObservations(updated);
    await db.set('setup:student_behaviour_observations', updated);
    setIsImportModalOpen(false);
    setSelectedStudentIdsForImport([]);
    showNotification(`Successfully imported ${newObservations.length} students from roster into observations ledger.`);
  };

  // Save Record
  const handleSaveObservation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.studentName?.trim()) {
      alert('Please enter or select a Student Name.');
      return;
    }

    if (!formState.objectiveDescription?.trim() || !formState.commentsByObserver?.trim()) {
      alert('Please provide both the Objective Description and Comments by the Observer.');
      return;
    }

    const formattedDateAndPlace = formState.dateAndPlace?.trim() ||
      `${formState.date || new Date().toISOString().slice(0, 10)} • ${formState.place || 'School Campus'}`;

    const recordToSave: StudentBehaviourObservationRecord = {
      id: editingObservation ? editingObservation.id : `obs-${Date.now()}`,
      studentId: formState.studentId,
      studentName: formState.studentName.trim(),
      className: formState.className || 'Class X-A',
      section: formState.section,
      dateAndPlace: formattedDateAndPlace,
      date: formState.date,
      place: formState.place,
      category: formState.category || 'Leadership quality',
      objectiveDescription: formState.objectiveDescription.trim(),
      commentsByObserver: formState.commentsByObserver.trim(),
      observerComments: formState.commentsByObserver.trim(),
      observerName: formState.observerName || 'Class Teacher',
      observerDesignation: formState.observerDesignation || 'PGT / TGT',
      templatePageRef: 33
    };

    let updatedList: StudentBehaviourObservationRecord[] = [];
    if (editingObservation) {
      updatedList = observations.map(o => o.id === editingObservation.id ? recordToSave : o);
    } else {
      updatedList = [recordToSave, ...observations];
    }

    setObservations(updatedList);
    await db.set('setup:student_behaviour_observations', updatedList);
    setIsModalOpen(false);
    showNotification('Student behaviour observation saved successfully.');
  };

  // Filtered List
  const filteredObservations = useMemo(() => {
    return observations.filter(obs => {
      const matchClass = selectedClassFilter === 'All' ||
        obs.className.toLowerCase().includes(selectedClassFilter.toLowerCase()) ||
        selectedClassFilter.toLowerCase().includes(obs.className.toLowerCase());

      const matchCategory = selectedCategoryFilter === 'All' ||
        obs.category === selectedCategoryFilter;

      const matchSearch = searchTerm === '' ||
        obs.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obs.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obs.dateAndPlace.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obs.objectiveDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obs.commentsByObserver.toLowerCase().includes(searchTerm.toLowerCase());

      return matchClass && matchCategory && matchSearch;
    });
  }, [observations, selectedClassFilter, selectedCategoryFilter, searchTerm]);

  // Aggregate KPI Metrics
  const kpiMetrics = useMemo(() => {
    const totalCount = filteredObservations.length;
    const leadershipCount = filteredObservations.filter(o => o.category === 'Leadership quality').length;
    const disciplineCount = filteredObservations.filter(o => o.category === 'Discipline' || o.category === 'Academic Integrity' || o.category === 'Punctuality').length;
    const distinctStudents = new Set(filteredObservations.map(o => o.studentName)).size;
    const distinctClasses = new Set(filteredObservations.map(o => o.className)).size;

    return {
      totalCount,
      leadershipCount,
      disciplineCount,
      distinctStudents,
      distinctClasses
    };
  }, [filteredObservations]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Dev Mode Traceability Badge */}
      {devMode && (
        <DevModeBadge
          pages={33}
          title="19. विद्यार्थियों की क्षमता एवं उनके व्यवहार पर शिक्षक की टिप्पणी (Teacher's Observation on Student Behaviour - Page 33, 2 Pages)"
        />
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1.5">
              <Eye className="w-4 h-4" />
              <span>KVS Teacher Diary • Middle &amp; Secondary Portal (P-33)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              19. विद्यार्थियों की क्षमता एवं उनके व्यवहार पर शिक्षक की टिप्पणी
            </h1>
            <h2 className="text-sm font-bold text-slate-300 tracking-wide mt-0.5 uppercase">
              Teacher's Observation on Students' Behaviour/Abilities (Discipline, Leadership quality etc.)
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Official 5-column register tracking qualitative behavioural milestones, discipline, leadership qualities, teamwork, and observer comments as per KVS diary guidelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedStudentIdsForImport([]);
                setIsImportModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-800/60 shadow transition"
              title="Import students from master roster"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Import from Student Roster</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 shadow transition"
              title="Print official register"
            >
              <Printer className="w-4 h-4 text-purple-400" />
              <span>Print Page 33</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student Observation</span>
            </button>
          </div>
        </div>

        {/* Action Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Document specific objective incidents with dates and locations to build defensible holistic student portfolios.</span>
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
        <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Observations Logged</div>
          <div className="text-xl font-black text-white mt-1">{kpiMetrics.totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{kpiMetrics.distinctStudents} Unique Students</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Leadership &amp; Council</div>
          <div className="text-xl font-black text-purple-300 mt-1">{kpiMetrics.leadershipCount}</div>
          <div className="text-[10px] text-purple-400/80 mt-0.5">High Potential Candidates</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Discipline &amp; Integrity</div>
          <div className="text-xl font-black text-emerald-300 mt-1">{kpiMetrics.disciplineCount}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Commendable Conduct</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Classes Monitored</div>
          <div className="text-xl font-black text-amber-300 mt-1">{kpiMetrics.distinctClasses}</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Class 6 to 12 Coverage</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Filter by Class</label>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="All">All Classes (VI to XII)</option>
              {CLASS_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Filter by Category</label>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="All">All Observation Categories</option>
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Search Observations</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student, description, comments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* OFFICIAL 5-COLUMN REGISTER TABLE (MATCHING UPLOADED IMAGE) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Official Table Header */}
              <tr className="bg-slate-950 border-b-2 border-slate-800 text-slate-200 font-extrabold text-center">
                <th className="p-3 border-r border-slate-800 min-w-[150px] text-left">
                  Name of Student
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[100px]">
                  Class
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[160px] text-left">
                  Date &amp; Place
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[280px] text-left">
                  Objective Description
                </th>
                <th className="p-3 border-r border-slate-800 min-w-[240px] text-left">
                  Comments by the Observer
                </th>
                <th className="p-3 min-w-[80px] text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredObservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-400">No student observation records found.</span>
                      <button
                        onClick={handleOpenCreateModal}
                        className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-bold underline"
                      >
                        Add a new observation record
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredObservations.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/50 transition">
                    {/* Column 1: Name of Student */}
                    <td className="p-3 border-r border-slate-800 font-bold text-slate-100 align-top">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{row.studentName}</span>
                      </div>
                      {row.category && (
                        <div className="mt-1">
                          <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/50 text-purple-300 text-[10px] font-semibold">
                            {row.category}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Column 2: Class */}
                    <td className="p-3 border-r border-slate-800 text-center font-medium text-slate-300 align-top">
                      <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-bold">
                        {row.className}
                      </span>
                    </td>

                    {/* Column 3: Date & Place */}
                    <td className="p-3 border-r border-slate-800 text-slate-300 font-medium align-top">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-snug">{row.dateAndPlace}</span>
                      </div>
                    </td>

                    {/* Column 4: Objective Description */}
                    <td className="p-3 border-r border-slate-800 text-slate-200 leading-relaxed align-top">
                      <p className="text-xs">{row.objectiveDescription}</p>
                    </td>

                    {/* Column 5: Comments by the Observer */}
                    <td className="p-3 border-r border-slate-800 text-slate-300 leading-relaxed align-top bg-purple-950/5">
                      <p className="text-xs italic text-purple-200">"{row.commentsByObserver}"</p>
                      {row.observerName && (
                        <div className="text-[10px] text-slate-500 font-semibold mt-1.5 not-italic">
                          — {row.observerName} {row.observerDesignation ? `(${row.observerDesignation})` : ''}
                        </div>
                      )}
                    </td>

                    {/* Column 6: Actions */}
                    <td className="p-3 text-center align-top">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                          title="Edit observation"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteObservation(row.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete observation"
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

      {/* ADD / EDIT OBSERVATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {editingObservation ? 'Edit Student Observation (19)' : 'Add New Student Observation (Page 33)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Template Chips */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick KVS Observation Templates (Click to apply):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_OBSERVATION_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-purple-950 hover:border-purple-600 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition"
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveObservation} className="space-y-4 text-xs">
              {/* Student Selection & Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Select Existing Student (Optional Quick Fill)
                  </label>
                  <select
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">-- Choose student from Roster --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.studentName} (Class {s.className}-{s.section || 'A'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Name of Student <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aarav Sharma"
                    value={formState.studentName}
                    onChange={(e) => setFormState({ ...formState, studentName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Class &amp; Section <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formState.className}
                    onChange={(e) => setFormState({ ...formState, className: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                    required
                  >
                    {CLASS_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Observation Category
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Place */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Date &amp; Place <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2026-08-14 • Mathematics Laboratory & Corridor"
                  value={formState.dateAndPlace}
                  onChange={(e) => setFormState({ ...formState, dateAndPlace: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              {/* Objective Description */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Objective Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe specifically what student actions, leadership instances, discipline compliance, or abilities were observed..."
                  value={formState.objectiveDescription}
                  onChange={(e) => setFormState({ ...formState, objectiveDescription: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              {/* Comments by the Observer */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Comments by the Observer <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Teacher's remarks, pedagogical recommendations, reinforcement steps, or commendations..."
                  value={formState.commentsByObserver}
                  onChange={(e) => setFormState({ ...formState, commentsByObserver: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              {/* Observer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Observer Name
                  </label>
                  <input
                    type="text"
                    value={formState.observerName}
                    onChange={(e) => setFormState({ ...formState, observerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Observer Designation
                  </label>
                  <input
                    type="text"
                    value={formState.observerDesignation}
                    onChange={(e) => setFormState({ ...formState, observerDesignation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Observation Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT FROM STUDENT ROSTER MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Import Students from Roster into Observations
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select students from your Vidyalaya class roster to quickly generate observation tracking entries.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Filter Roster Class</label>
                <select
                  value={importClassFilter}
                  onChange={(e) => setImportClassFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="All">All Classes</option>
                  {CLASS_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Initial Category</label>
                <select
                  value={importCategory}
                  onChange={(e) => setImportCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Default Place</label>
                <input
                  type="text"
                  value={importPlace}
                  onChange={(e) => setImportPlace(e.target.value)}
                  placeholder="e.g. Classroom & Campus"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Student Checkbox List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">
                  Select Students ({selectedStudentIdsForImport.length} Selected):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = students.filter(s => {
                        if (importClassFilter === 'All') return true;
                        const classMatch = `Class ${s.className}-${s.section || 'A'}`;
                        return classMatch === importClassFilter || s.className === importClassFilter;
                      });
                      setSelectedStudentIdsForImport(filtered.map(s => s.id));
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Select All Filtered
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIdsForImport([])}
                    className="text-xs text-slate-400 hover:text-slate-300"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/60 p-2">
                {students
                  .filter(s => {
                    if (importClassFilter === 'All') return true;
                    const classMatch = `Class ${s.className}-${s.section || 'A'}`;
                    return classMatch === importClassFilter || s.className === importClassFilter;
                  })
                  .map(std => {
                    const isChecked = selectedStudentIdsForImport.includes(std.id);
                    return (
                      <label
                        key={std.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                          isChecked ? 'bg-purple-950/40 text-white' : 'hover:bg-slate-900/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIdsForImport(prev => [...prev, std.id]);
                              } else {
                                setSelectedStudentIdsForImport(prev => prev.filter(id => id !== std.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                          />
                          <div>
                            <span className="font-bold text-slate-100">{std.studentName}</span>
                            {std.rollNo && (
                              <span className="text-[10px] text-slate-400 ml-2 font-mono">
                                (Roll #{std.rollNo})
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] text-purple-300 font-mono bg-purple-950/80 px-2 py-0.5 rounded border border-purple-900/40">
                          Class {std.className}-{std.section || 'A'}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImportStudents}
                disabled={selectedStudentIdsForImport.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 transition cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Import {selectedStudentIdsForImport.length} Students</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentBehaviourObservationManager;
