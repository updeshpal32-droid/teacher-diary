import React, { useState, useEffect, useRef } from 'react';
import { StaffDetailRecord, CustomRoleDefinition } from '../types/academic';
import { db, DEFAULT_STAFF_DETAILS, getCustomRoles, DEFAULT_KVS_ROLES } from '../lib/storage';
import { setActiveInspectedTeacher } from '../lib/teacherContext';
import { RoleAssignmentAction } from './RoleAssignmentModal';
import {
  Crown,
  ChevronDown,
  User,
  Search,
  X,
  FileText,
  ClipboardCheck,
  TrendingUp,
  Target,
  Sparkles,
  BookOpen,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Award,
  Settings,
  Layers,
  Building2,
  Mic,
  UserPlus,
  Trophy,
  HeartPulse,
  Armchair,
  GraduationCap,
  FileCheck2,
  Users2
} from 'lucide-react';

interface AdminTeacherContextBarProps {
  activeTeacher: StaffDetailRecord | null;
  onSelectTeacher: (staff: StaffDetailRecord | null) => void;
  onNavigateTab: (tab: string) => void;
  activeTab: string;
  onOpenRoleAssignment?: (action: RoleAssignmentAction, roleId?: string) => void;
}

export const AdminTeacherContextBar: React.FC<AdminTeacherContextBarProps> = ({
  activeTeacher,
  onSelectTeacher,
  onNavigateTab,
  activeTab,
  onOpenRoleAssignment
}) => {
  const [allStaff, setAllStaff] = useState<StaffDetailRecord[]>(DEFAULT_STAFF_DETAILS);
  const [customRoles, setCustomRoles] = useState<CustomRoleDefinition[]>(DEFAULT_KVS_ROLES);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAssignRolesOpen, setIsAssignRolesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const assignRolesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const handleClose = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (assignRolesRef.current && !assignRolesRef.current.contains(e.target as Node)) {
        setIsAssignRolesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClose);
    return () => document.removeEventListener('mousedown', handleClose);
  }, []);

  const loadData = async () => {
    const [savedStaff, savedRoles] = await Promise.all([
      db.get<StaffDetailRecord[]>('setup:staff_details'),
      getCustomRoles()
    ]);
    if (savedStaff && savedStaff.length > 0) {
      setAllStaff(savedStaff);
    }
    if (savedRoles && savedRoles.length > 0) {
      setCustomRoles(savedRoles);
    }
  };

  const isContractual = activeTeacher?.employmentType === 'Contractual';

  const filteredStaff = allStaff.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.employeeCode || '').toLowerCase().includes(q) ||
      (s.designation || '').toLowerCase().includes(q)
    );
  });

  const handleSwitchTeacher = async (staff: StaffDetailRecord) => {
    await setActiveInspectedTeacher(staff);
    onSelectTeacher(staff);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleExitOversight = async () => {
    await setActiveInspectedTeacher(null);
    onSelectTeacher(null);
    onNavigateTab('teacher');
  };

  const handleTriggerRoleAssignment = (action: RoleAssignmentAction, roleId?: string) => {
    setIsAssignRolesOpen(false);
    if (onOpenRoleAssignment) {
      onOpenRoleAssignment(action, roleId);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-950 via-purple-950/70 to-slate-950 border-y border-purple-500/40 px-4 py-2.5 shadow-lg relative z-30 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Section: Active Teacher Status Badge & Dropdown & Assign Roles Trigger */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Dynamic Principal Oversight Mode Badge: ON vs OFF */}
          {activeTeacher ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-xs shadow-md shadow-emerald-950/50 animate-fadeIn">
              <Crown className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Principal Oversight Mode: ON</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-400 font-bold text-xs animate-fadeIn">
              <Crown className="w-3.5 h-3.5 text-slate-500" />
              <span>Principal Oversight Mode: OFF</span>
            </div>
          )}

          <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />

          {/* Teacher Selector Pill & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-white text-xs font-semibold shadow-md transition-all cursor-pointer group ${
                activeTeacher
                  ? 'bg-slate-900/90 hover:bg-slate-800 border-purple-500/50 hover:border-purple-400'
                  : 'bg-gradient-to-r from-purple-900/80 to-indigo-900/80 hover:from-purple-800 hover:to-indigo-800 border-purple-400 ring-2 ring-purple-500/30'
              }`}
              title={activeTeacher ? "Click to switch active inspected teacher" : "Click to select a teacher and turn Oversight ON"}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white ${
                activeTeacher ? 'bg-purple-600' : 'bg-emerald-600'
              }`}>
                {activeTeacher ? activeTeacher.name.charAt(0) : '🔍'}
              </div>

              {activeTeacher ? (
                <div className="text-left flex items-center gap-1.5 flex-wrap">
                  <span className={`font-bold ${isContractual ? 'text-amber-300' : 'text-sky-200'} group-hover:text-white`}>
                    {activeTeacher.name}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    ({activeTeacher.designation || 'Faculty'})
                  </span>
                  {isContractual ? (
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      ⚡ Contractual
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      🛡️ Regular
                    </span>
                  )}
                  <span className="text-[10px] text-purple-300 font-mono bg-purple-950 px-1 rounded">
                    #{activeTeacher.employeeCode}
                  </span>
                </div>
              ) : (
                <div className="text-left flex items-center gap-2 font-bold text-purple-200">
                  <span>👉 Select Faculty Member to Turn ON Oversight</span>
                  <span className="text-[10px] text-purple-300 font-normal px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30">
                    {allStaff.length} Teachers Available
                  </span>
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-purple-300 opacity-70 group-hover:opacity-100 ml-1" />
            </button>

            {/* Switcher Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-purple-500/50 rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn space-y-2.5 max-h-[75vh] flex flex-col backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>Select Faculty Member ({allStaff.length} Staff)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    KV Kutra (2026-27)
                  </span>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search faculty by name, post, code..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Turn Off Oversight Action if currently ON */}
                {activeTeacher && (
                  <button
                    onClick={handleExitOversight}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-950/80 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer shadow-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5 text-rose-400" />
                      <span>Turn Off Oversight Mode</span>
                    </span>
                    <span className="text-[10px] text-rose-400/80 uppercase tracking-wider font-bold">Turn OFF</span>
                  </button>
                )}

                {/* Staff List with Full Post & Cadre Badges */}
                <div className="overflow-y-auto space-y-1.5 pr-1 max-h-64 divide-y divide-slate-800/40 scrollbar-thin">
                  {filteredStaff.map((stf) => {
                    const isSelected = activeTeacher
                      ? (stf.id === activeTeacher.id || stf.name === activeTeacher.name)
                      : false;
                    const stfCont = stf.employmentType === 'Contractual';
                    return (
                      <button
                        key={stf.id}
                        onClick={() => handleSwitchTeacher(stf)}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600/30 border border-purple-500/50 text-white shadow-md ring-1 ring-purple-400/40'
                            : 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className={`font-bold text-xs truncate ${stfCont ? 'text-amber-300' : 'text-sky-200'}`}>
                              {stf.name}
                            </span>
                            {stfCont ? (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                                ⚡ Contractual
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/40 shrink-0">
                                🛡️ Regular
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center justify-between">
                            <span className="font-medium text-slate-300">{stf.designation}</span>
                            <span className="font-mono text-purple-300">#{stf.employeeCode}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* KVS SAMAGAM: Assign Roles ▾ Dropdown Trigger in Oversight Bar */}
          <div className="relative" ref={assignRolesRef}>
            <button
              type="button"
              onClick={() => setIsAssignRolesOpen(!isAssignRolesOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer shrink-0 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white border-teal-400/50 shadow-md shadow-teal-950/40"
              title="Official KVS Samagam: Assign Class Teachers, Subject Teachers & Institutional Incharges"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Assign Roles</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* Dropdown Menu */}
            {isAssignRolesOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-slate-950 border border-emerald-500/50 rounded-2xl shadow-2xl p-2.5 z-50 animate-fadeIn space-y-1.5 backdrop-blur-xl max-h-[80vh] overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400 border-b border-slate-800 flex items-center justify-between">
                  <span>KVS Samagam Roles</span>
                  <span className="text-[9px] text-slate-400 font-mono">2026-27</span>
                </div>

                {/* Committees Directory Direct Quick-Jump */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignRolesOpen(false);
                    onNavigateTab('portfolios');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold transition-all flex items-center justify-between shadow-sm cursor-pointer border border-emerald-400/40"
                  title="Open Official Responsibilities & Committees Directory (50 Portfolios)"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-200" />
                    <span>📂 Official Committees Directory</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-200 text-[10px] font-mono">50</span>
                </button>

                {/* Core Roles */}
                <div className="text-[10px] font-bold text-slate-400 px-2 pt-1 uppercase">Core Academic:</div>
                <button
                  type="button"
                  onClick={() => handleTriggerRoleAssignment('class_teacher')}
                  className="w-full text-left px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>Assign Class Teacher</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerRoleAssignment('co_class_teacher')}
                  className="w-full text-left px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Users2 className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Assign Co-Class Teacher</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerRoleAssignment('subject_teacher')}
                  className="w-full text-left px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-sky-200" />
                  <span>Assign Subject Teacher</span>
                </button>

                {/* Incharge Portfolios */}
                <div className="text-[10px] font-bold text-slate-400 px-2 pt-1 uppercase">Institutional Incharges ({customRoles.length}):</div>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {customRoles.map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleTriggerRoleAssignment('incharge', role.id)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-medium transition-all flex items-center justify-between cursor-pointer border border-slate-800/60"
                    >
                      <span className="truncate">{role.name}</span>
                      <span className="text-[9px] px-1 rounded bg-slate-950 text-emerald-400 uppercase font-mono">{role.category.slice(0, 4)}</span>
                    </button>
                  ))}
                </div>

                {/* Manage Roles & Master Matrix Bottom Action Bar */}
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleTriggerRoleAssignment('manage_roles')}
                    className="w-full text-left px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 hover:text-white text-xs font-bold transition-all flex items-center justify-between cursor-pointer border border-indigo-500/30"
                  >
                    <span className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-indigo-300" />
                      <span>⚙️ Manage &amp; Add Roles List</span>
                    </span>
                    <span>+</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTriggerRoleAssignment('overview')}
                    className="w-full text-left px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-white text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>📊 View Master Role Matrix</span>
                    </span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Module Quick Jump Shortcuts & Exit Button (Appears ONLY when Oversight is ON) */}
        {activeTeacher && (
          <div className="flex items-center gap-1.5 flex-wrap animate-fadeIn">
            <button
              onClick={() => onNavigateTab('teacher')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'teacher'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
              title="View Selected Teacher Bio-Data & Responsibilities (P-3 & 4)"
            >
              <User className="w-3 h-3 text-purple-300" />
              <span>Bio-Data (P-3)</span>
            </button>

            <button
              onClick={() => onNavigateTab('lessonplan')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'lessonplan'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
              title="Inspect Daily Lesson Plans (P-32)"
            >
              <FileText className="w-3 h-3 text-indigo-300" />
              <span>Lesson Plan (P-32)</span>
            </button>

            <button
              onClick={() => onNavigateTab('assessment')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'assessment'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
              title="Inspect Progress & Assessments (P-17 to 21)"
            >
              <ClipboardCheck className="w-3 h-3 text-amber-300" />
              <span>Assessment (P-17)</span>
            </button>

            <button
              onClick={() => onNavigateTab('result_analysis_vi_xii')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'result_analysis_vi_xii'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
              title="Inspect Result Analysis (P-18)"
            >
              <TrendingUp className="w-3 h-3 text-emerald-300" />
              <span>Results (P-18)</span>
            </button>

            <button
              onClick={() => onNavigateTab('remedial_exemplary_20_21')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'remedial_exemplary_20_21'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
              title="Inspect Remedial & Exemplary Ledgers (P-20 & 21)"
            >
              <Target className="w-3 h-3 text-rose-300" />
              <span>Remedials (P-20)</span>
            </button>

            <button
              onClick={() => onNavigateTab('institutional_meetings_22_24')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'institutional_meetings_22_24'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
              title="Inspect Institutional Meetings (P-22 to 24)"
            >
              <BookOpen className="w-3 h-3 text-orange-300" />
              <span>Meetings (P-22)</span>
            </button>

            {/* Exit Oversight Button */}
            <button
              onClick={handleExitOversight}
              className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 hover:text-white border border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ml-1 shadow-sm"
              title="Turn off Oversight Mode"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Turn OFF</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
