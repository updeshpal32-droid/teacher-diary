import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StaffDetailRecord, SchoolDetails, TeacherProfile } from '../types/academic';
import { db, DEFAULT_STAFF_DETAILS, DEFAULT_SCHOOL, DEFAULT_TEACHER, getCurrentUser, getMergedStaffList } from '../lib/storage';
import { UserAccount } from '../types/auth';
import { setActiveInspectedTeacher } from '../lib/teacherContext';
import { isAdminOrDataManager } from '../lib/permissions';
import {
  parseStaffCSVText,
  downloadSampleStaffCSVFile,
  downloadBlankStaffCSVFile,
  generateStaffCSVString,
  detectEmploymentType,
  OFFICIAL_STAFF_HEADERS
} from '../lib/staffFileImporter';
import {
  Users,
  UserPlus,
  Upload,
  Download,
  FileSpreadsheet,
  Trash2,
  Edit,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Award,
  BookOpen,
  Sparkles,
  RefreshCw,
  Eye,
  FileText,
  Check,
  X,
  Phone,
  Mail,
  ShieldCheck,
  MessageSquare,
  Building,
  CreditCard,
  Briefcase,
  GraduationCap,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Copy,
  SlidersHorizontal,
  Lock,
  Unlock,
  MessageCircle,
  FileDown,
  CheckCheck,
  Shield,
  Zap,
  Crown
} from 'lucide-react';
import { RoleAssignmentModal, RoleAssignmentAction } from './RoleAssignmentModal';
import { ProfileChangeRequestsModal } from './ProfileChangeRequestsModal';
import { ProfileChangeRequest } from '../types/academic';

interface StaffDetailsManagerProps {
  devMode?: boolean;
  onInspectTeacherBioData?: (teacher: StaffDetailRecord) => void;
  onNavigateTab?: (tab: string) => void;
  currentUser?: UserAccount | null;
}

export const StaffDetailsManager: React.FC<StaffDetailsManagerProps> = ({
  devMode,
  onInspectTeacherBioData,
  onNavigateTab,
  currentUser: propUser
}) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(propUser || null);
  const [staffList, setStaffList] = useState<StaffDetailRecord[]>(DEFAULT_STAFF_DETAILS);
  const [school, setSchool] = useState<SchoolDetails>(DEFAULT_SCHOOL);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [maskSensitiveData, setMaskSensitiveData] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // KVS Samagam Role Assignment Modal State
  const [isAssignRolesModalOpen, setIsAssignRolesModalOpen] = useState(false);
  const [isProfileRequestsModalOpen, setIsProfileRequestsModalOpen] = useState(false);
  const [pendingProfileRequestsCount, setPendingProfileRequestsCount] = useState(0);
  const [assignRoleAction, setAssignRoleAction] = useState<RoleAssignmentAction>('class_teacher');
  const [selectedStaffForRole, setSelectedStaffForRole] = useState<StaffDetailRecord | null>(null);

  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffDetailRecord | null>(null);
  const [editingStaff, setEditingStaff] = useState<Partial<StaffDetailRecord> | null>(null);

  // Import State
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importPreview, setImportPreview] = useState<StaffDetailRecord[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verification Form State
  const [verificationStatus, setVerificationStatus] = useState<'Verified & Approved' | 'Correction Requested' | 'Pending Review'>('Verified & Approved');
  const [verificationRemarks, setVerificationRemarks] = useState('');
  const [verificationSuggestions, setVerificationSuggestions] = useState('');

  // Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    loadStaffData();
  }, []);

  const loadStaffData = async () => {
    try {
      setLoading(true);
      const [mergedStaff, savedSchool, user] = await Promise.all([
        getMergedStaffList(),
        db.get<SchoolDetails>('setup:school'),
        propUser ? Promise.resolve(propUser) : getCurrentUser()
      ]);
      if (user) setCurrentUser(user);

      if (savedSchool) setSchool(savedSchool);

      const effectiveStaff = (mergedStaff && mergedStaff.length > 0) ? mergedStaff : DEFAULT_STAFF_DETAILS;
      const normalized = effectiveStaff.map(s => ({
        ...s,
        employmentType: s.employmentType || detectEmploymentType(s.designation)
      }));
      setStaffList(normalized);
    } catch (err) {
      console.error('Error loading staff details:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveStaffList = async (updated: StaffDetailRecord[]) => {
    // Ensure sequential serial numbers and proper employmentType
    const reIndexed = updated.map((stf, idx) => ({
      ...stf,
      serialNo: idx + 1,
      employmentType: stf.employmentType || detectEmploymentType(stf.designation)
    }));
    setStaffList(reIndexed);
    await db.set('setup:staff_details', reIndexed);
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Delete Staff
  const handleDeleteStaff = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the staff records?`)) return;
    const updated = staffList.filter(s => s.id !== id);
    await saveStaffList(updated);
    showToast(`Staff member ${name} deleted.`);
  };

  // Open Edit Modal
  const handleOpenEditModal = (staff: StaffDetailRecord) => {
    setEditingStaff({
      ...staff,
      employmentType: staff.employmentType || detectEmploymentType(staff.designation)
    });
    setShowAddEditModal(true);
  };

  // Open Add Modal
  const handleOpenAddModal = (defaultType: 'Regular' | 'Contractual' = 'Regular') => {
    const nextSN = staffList.length + 1;
    setEditingStaff({
      id: `stf-${Date.now()}`,
      serialNo: nextSN,
      name: '',
      employeeCode: defaultType === 'Contractual' ? `CNT${20100 + nextSN}` : `EMP${10800 + nextSN}`,
      designation: defaultType === 'Contractual' ? 'Contractual PGT (Computer Science)' : 'TGT (Mathematics)',
      employmentType: defaultType,
      socialCategory: 'GEN',
      dob: '01/01/1990',
      joiningDateKVSWithDesignation: defaultType === 'Contractual' ? '01/07/2024 on Contract' : '01/08/2015 as TGT',
      joiningDatePresentKVWithDesignation: defaultType === 'Contractual' ? '01/07/2024 as Contractual Faculty' : '01/04/2021 as TGT',
      bankAccountNo: '',
      ifscCode: 'SBIN0001042',
      bankName: 'State Bank of India',
      highestAcademicAndProfessionalQual: 'M.Sc., B.Ed., CTET',
      permanentPostalAddress: '',
      email: '',
      phoneCalls: '',
      phoneWhatsapp: '',
      aadharNo: '',
      pranOrPanNo: defaultType === 'Contractual' ? 'PRAN-N/A' : '',
      isMinority: 'No',
      seniorityNumber: defaultType === 'Contractual' ? `CONT-SEN-${nextSN}` : `KVS-SEN-2020-${nextSN}`,
      approvalStatus: 'Pending Review'
    });
    setShowAddEditModal(true);
  };

  // Save Add/Edit Staff
  const handleSaveStaffForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editingStaff.name?.trim()) {
      showToast('Staff Name is required', 'error');
      return;
    }

    const completeRecord: StaffDetailRecord = {
      ...(editingStaff as StaffDetailRecord),
      employmentType: editingStaff.employmentType || detectEmploymentType(editingStaff.designation)
    };

    let updated: StaffDetailRecord[];
    const exists = staffList.some(s => s.id === editingStaff.id);

    if (exists) {
      updated = staffList.map(s => (s.id === editingStaff.id ? completeRecord : s));
      showToast(`Updated details for ${editingStaff.name}.`);
    } else {
      updated = [...staffList, completeRecord];
      showToast(`Added new staff member ${editingStaff.name}.`);
    }

    await saveStaffList(updated);
    setShowAddEditModal(false);
    setEditingStaff(null);
  };

  // Open Verification / Inspection Modal
  const handleOpenVerification = (staff: StaffDetailRecord) => {
    setSelectedStaff(staff);
    setVerificationStatus(staff.approvalStatus || 'Verified & Approved');
    setVerificationRemarks(staff.principalRemarks || '');
    setVerificationSuggestions(staff.principalSuggestions || '');
    setShowVerificationModal(true);
  };

  // Save Principal Verification
  const handleSaveVerification = async () => {
    if (!selectedStaff) return;

    const updated = staffList.map(s => {
      if (s.id === selectedStaff.id) {
        return {
          ...s,
          approvalStatus: verificationStatus,
          principalRemarks: verificationRemarks.trim(),
          principalSuggestions: verificationSuggestions.trim(),
          approvedBy: `${school.principalName || 'Principal'} (${school.principalDesignation || 'Principal I/c'})`,
          approvedDate: new Date().toISOString().split('T')[0]
        };
      }
      return s;
    });

    await saveStaffList(updated);
    setShowVerificationModal(false);
    showToast(`Verification status stamped for ${selectedStaff.name}.`);
  };

  // Handle File Upload for CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (text) {
        setImportText(text);
        const result = parseStaffCSVText(text);
        setImportPreview(result.records);
        setImportErrors(result.errors);
      }
    };
    reader.readAsText(file);
  };

  // Parse Text Input
  const handleParseTextInput = () => {
    if (!importText.trim()) {
      showToast('Please paste CSV text or choose a file first.', 'error');
      return;
    }
    const result = parseStaffCSVText(importText);
    setImportPreview(result.records);
    setImportErrors(result.errors);
  };

  // Confirm CSV Import
  const handleConfirmImport = async () => {
    if (importPreview.length === 0) {
      showToast('No valid staff records found to import.', 'error');
      return;
    }

    let finalStaff: StaffDetailRecord[];
    if (importMode === 'replace') {
      finalStaff = importPreview;
    } else {
      // Append mode - avoid duplicates by employeeCode
      const existingCodes = new Set(staffList.map(s => s.employeeCode.toLowerCase()));
      const newItems = importPreview.filter(p => !existingCodes.has(p.employeeCode.toLowerCase()));
      finalStaff = [...staffList, ...newItems];
    }

    await saveStaffList(finalStaff);
    setShowImportModal(false);
    setImportText('');
    setImportPreview([]);
    setImportErrors([]);
    showToast(`Successfully imported ${importPreview.length} staff records!`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csvContent = generateStaffCSVString(staffList);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KVS_Staff_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${staffList.length} staff records to CSV.`);
  };

  // Filtered Staff List
  const filteredStaffList = useMemo(() => {
    return staffList.filter(stf => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (stf.name || '').toLowerCase().includes(q) ||
        (stf.employeeCode || '').toLowerCase().includes(q) ||
        (stf.designation || '').toLowerCase().includes(q) ||
        (stf.email || '').toLowerCase().includes(q) ||
        (stf.phoneCalls || '').includes(q) ||
        (stf.seniorityNumber || '').toLowerCase().includes(q) ||
        (stf.permanentPostalAddress || '').toLowerCase().includes(q);

      const empType = stf.employmentType || detectEmploymentType(stf.designation);
      const matchesEmpType = selectedEmploymentType === 'all' || empType === selectedEmploymentType;
      const matchesCat = selectedCategory === 'all' || stf.socialCategory === selectedCategory;
      const matchesDesig = selectedDesignation === 'all' || (stf.designation || '').toLowerCase().includes(selectedDesignation.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || stf.approvalStatus === selectedStatus;

      return matchesSearch && matchesEmpType && matchesCat && matchesDesig && matchesStatus;
    });
  }, [staffList, searchQuery, selectedEmploymentType, selectedCategory, selectedDesignation, selectedStatus]);

  // Statistics
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'data_entry_manager';

  const regularCount = useMemo(() => staffList.filter(s => (s.employmentType || detectEmploymentType(s.designation)) === 'Regular').length, [staffList]);
  const contractualCount = useMemo(() => staffList.filter(s => (s.employmentType || detectEmploymentType(s.designation)) === 'Contractual').length, [staffList]);
  const approvedCount = useMemo(() => staffList.filter(s => s.approvalStatus === 'Verified & Approved').length, [staffList]);

  // Mask helper for sensitive info
  const maskText = (text: string, visibleEnd = 4) => {
    if (!maskSensitiveData || !text) return text;
    if (text.length <= visibleEnd) return '••••';
    return '•••• ' + text.slice(-visibleEnd);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400">Loading KVS Staff Details Directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 border transition-all animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-500/50' : 'bg-rose-950 text-rose-200 border-rose-500/50'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner: Master Staff Directory & Bulk Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin ? (
                <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Staff Directory & Checking Authority</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>Vidyalaya Staff Directory (View-Only Mode)</span>
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                20-Column Official Schema
              </span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>All Staff Details & Faculty Master Registry</span>
            </h2>

            {/* Quick Metrics Badges with Regular vs Contractual distinction */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Total Staff: <strong className="text-white">{staffList.length}</strong></span>
              </div>

              <div className="px-3 py-1 rounded-xl bg-sky-950/60 border border-sky-500/40 text-xs text-sky-200 flex items-center gap-1.5 shadow-sm">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span>Regular Staff (Permanent): <strong className="text-sky-300 font-black">{regularCount}</strong></span>
              </div>

              <div className="px-3 py-1 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-1.5 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Contractual / Part-Time Staff: <strong className="text-amber-300 font-black">{contractualCount}</strong></span>
              </div>

              {isAdmin && (
                <div className="px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified: <strong className="text-emerald-300 font-bold">{approvedCount}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Top Actions: Admin Management Controls vs Teacher Export */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <>
                <button
                  onClick={() => setIsProfileRequestsModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer relative"
                  title="Review Faculty Profile Change Requests"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Profile Updates</span>
                  {pendingProfileRequestsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                      {pendingProfileRequestsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedStaffForRole(null);
                    setAssignRoleAction('class_teacher');
                    setIsAssignRolesModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  title="Official KVS Samagam: Assign Class Teachers, Subject Allocations & Incharge Portfolios"
                >
                  <Crown className="w-4 h-4 text-amber-300" />
                  <span>Assign Roles</span>
                </button>

                {isAdminOrDataManager(currentUser) && (
                  <>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Import Staff CSV</span>
                    </button>

                    <button
                      onClick={() => handleOpenAddModal('Regular')}
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                      title="Add a Regular / Permanent faculty member"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ Add Regular</span>
                    </button>

                    <button
                      onClick={() => handleOpenAddModal('Contractual')}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                      title="Add a Contractual / Part-time faculty member"
                    >
                      <Zap className="w-4 h-4" />
                      <span>+ Add Contractual</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => downloadSampleStaffCSVFile()}
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Download sample CSV template with both Regular & Contractual staff"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sample CSV</span>
                </button>

                <button
                  onClick={() => downloadBlankStaffCSVFile()}
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Download blank template with official headers"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
                  <span>Blank CSV</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Export all staff records to CSV file"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export CSV</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  title="Export faculty directory to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-purple-300" />
                  <span>Export Staff Directory CSV</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, emp code, designation, address, email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Employment Nature Filter */}
            <div className="flex items-center bg-slate-950 rounded-xl p-0.5 border border-slate-800">
              <button
                onClick={() => setSelectedEmploymentType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedEmploymentType === 'all'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Cadres ({staffList.length})
              </button>

              <button
                onClick={() => setSelectedEmploymentType('Regular')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  selectedEmploymentType === 'Regular'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-sky-400 hover:text-sky-300'
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>Regular ({regularCount})</span>
              </button>

              <button
                onClick={() => setSelectedEmploymentType('Contractual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  selectedEmploymentType === 'Contractual'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Contractual ({contractualCount})</span>
              </button>
            </div>

            {/* Social Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="all">Category: All</option>
              <option value="GEN">GEN (General)</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="EWS">EWS</option>
            </select>

            {/* Designation Filter */}
            <select
              value={selectedDesignation}
              onChange={e => setSelectedDesignation(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="all">Cadre: All</option>
              <option value="Principal">Principal</option>
              <option value="PGT">PGT</option>
              <option value="TGT">TGT</option>
              <option value="PRT">PRT</option>
              <option value="Data Entry">Data Entry Manager</option>
            </select>

            {/* Verification Status Filter - Admin Only */}
            {isAdmin && (
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="all">Status: All</option>
                <option value="Verified & Approved">Verified & Approved</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Correction Requested">Correction Requested</option>
              </select>
            )}

            {/* Sensitive Data Mask Toggle */}
            <button
              onClick={() => setMaskSensitiveData(m => !m)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                maskSensitiveData
                  ? 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  : 'bg-amber-950/40 text-amber-300 border-amber-500/40'
              }`}
              title="Toggle masking of bank accounts and Aadhar numbers"
            >
              {maskSensitiveData ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{maskSensitiveData ? 'Masked' : 'Unmasked'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 20-Column Official Staff Registry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto max-h-[650px] relative">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/90 backdrop-blur-md sticky top-0 z-20 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 sticky left-0 bg-slate-950 z-30 min-w-[50px] text-center border-r border-slate-800">S.N.</th>
                <th className="p-3 sticky left-[50px] bg-slate-950 z-30 min-w-[210px] border-r border-slate-800">Name & Cadre Type</th>
                <th className="p-3 min-w-[110px]">Emp Code</th>
                <th className="p-3 min-w-[170px]">Designation</th>
                <th className="p-3 min-w-[90px] text-center">Category</th>
                <th className="p-3 min-w-[100px]">DOB</th>
                <th className="p-3 min-w-[170px]">KVS Joining</th>
                <th className="p-3 min-w-[170px]">Present KV Joining</th>
                <th className="p-3 min-w-[130px]">Bank A/C No.</th>
                <th className="p-3 min-w-[110px]">IFSC</th>
                <th className="p-3 min-w-[150px]">Bank Name</th>
                <th className="p-3 min-w-[200px]">Highest Qualifications</th>
                <th className="p-3 min-w-[220px]">Permanent Address</th>
                <th className="p-3 min-w-[180px]">Email</th>
                <th className="p-3 min-w-[130px]">Phone (Calls)</th>
                <th className="p-3 min-w-[140px]">Phone (WhatsApp)</th>
                <th className="p-3 min-w-[130px]">Aadhar No</th>
                <th className="p-3 min-w-[160px]">PRAN / PAN No</th>
                <th className="p-3 min-w-[120px]">Minority?</th>
                <th className="p-3 min-w-[150px]">Seniority No</th>
                {isAdmin && (
                  <th className="p-3 min-w-[130px] text-center">Status</th>
                )}
                {isAdmin && (
                  <th className="p-3 sticky right-0 bg-slate-950 z-30 min-w-[170px] text-center border-l border-slate-800 text-amber-300">
                    Principal Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredStaffList.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 22 : 20} className="p-8 text-center text-slate-500 italic">
                    No staff records found matching your filters. Click "+ Add Regular", "+ Add Contractual", or "Import Staff CSV" to add data.
                  </td>
                </tr>
              ) : (
                filteredStaffList.map((stf, index) => {
                  const isApproved = stf.approvalStatus === 'Verified & Approved';
                  const isCorrection = stf.approvalStatus === 'Correction Requested';
                  const isContractual = (stf.employmentType || detectEmploymentType(stf.designation)) === 'Contractual';

                  return (
                    <tr
                      key={stf.id}
                      className={`hover:bg-slate-800/40 transition-colors group ${
                        isContractual ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* 1. S.N. (Sticky) */}
                      <td className="p-3 sticky left-0 bg-slate-900 group-hover:bg-slate-850 z-10 text-center font-mono font-bold text-slate-400 border-r border-slate-800">
                        {stf.serialNo || index + 1}
                      </td>

                      {/* 2. Name & Cadre Type (Sticky) - DISTINCTIVE COLOR CODING */}
                      <td className="p-3 sticky left-[50px] bg-slate-900 group-hover:bg-slate-850 z-10 font-bold border-r border-slate-800">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`truncate max-w-[150px] font-bold ${
                                isContractual ? 'text-amber-300' : 'text-sky-100'
                              }`}
                              title={stf.name}
                            >
                              {stf.name}
                            </span>
                          </div>

                          {/* Distinctive Employment Badge */}
                          <div>
                            {isContractual ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                <Zap className="w-2.5 h-2.5 text-amber-400" />
                                <span>Contractual</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/40">
                                <Shield className="w-2.5 h-2.5 text-sky-400" />
                                <span>Regular</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Employee Code */}
                      <td className={`p-3 font-mono font-bold ${isContractual ? 'text-amber-400' : 'text-purple-300'}`}>
                        {stf.employeeCode}
                      </td>

                      {/* 4. Designation */}
                      <td className={`p-3 font-semibold ${isContractual ? 'text-amber-200' : 'text-slate-200'}`}>
                        {stf.designation}
                      </td>

                      {/* 5. Social Category */}
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          stf.socialCategory === 'GEN'
                            ? 'bg-slate-800 text-slate-300 border border-slate-700'
                            : stf.socialCategory === 'OBC'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : stf.socialCategory === 'SC'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {stf.socialCategory || 'GEN'}
                        </span>
                      </td>

                      {/* 6. DOB */}
                      <td className="p-3 font-mono text-slate-300 whitespace-nowrap">
                        {stf.dob}
                      </td>

                      {/* 7. Date of joining in KVS with designation */}
                      <td className="p-3 text-slate-300 text-[11px]">
                        {stf.joiningDateKVSWithDesignation}
                      </td>

                      {/* 8. Date of joining in Present KV with designation */}
                      <td className="p-3 text-slate-300 text-[11px]">
                        {stf.joiningDatePresentKVWithDesignation}
                      </td>

                      {/* 9. BANK A/C No. */}
                      <td className="p-3 font-mono text-slate-300">
                        <div className="flex items-center gap-1">
                          <span>{maskText(stf.bankAccountNo, 4)}</span>
                          {stf.bankAccountNo && (
                            <button
                              onClick={() => handleCopy(stf.bankAccountNo, 'Bank Account')}
                              className="text-slate-500 hover:text-white"
                              title="Copy A/C No"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 10. IFSC */}
                      <td className="p-3 font-mono text-slate-300">
                        <div className="flex items-center gap-1">
                          <span>{stf.ifscCode}</span>
                          {stf.ifscCode && (
                            <button
                              onClick={() => handleCopy(stf.ifscCode, 'IFSC')}
                              className="text-slate-500 hover:text-white"
                              title="Copy IFSC"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 11. BANK NAME */}
                      <td className="p-3 text-slate-300 truncate max-w-[140px]" title={stf.bankName}>
                        {stf.bankName}
                      </td>

                      {/* 12. Highest Acad. Qual. with Professional Qualification */}
                      <td className="p-3 text-slate-300 text-[11px] truncate max-w-[190px]" title={stf.highestAcademicAndProfessionalQual}>
                        {stf.highestAcademicAndProfessionalQual}
                      </td>

                      {/* 13. Permanent Postal Address */}
                      <td className="p-3 text-slate-400 text-[11px] truncate max-w-[210px]" title={stf.permanentPostalAddress}>
                        {stf.permanentPostalAddress}
                      </td>

                      {/* 14. E-mail */}
                      <td className="p-3 text-purple-400 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <a href={`mailto:${stf.email}`} className="hover:underline truncate max-w-[140px]" title={stf.email}>
                            {stf.email}
                          </a>
                          {stf.email && (
                            <button onClick={() => handleCopy(stf.email, 'Email')} className="text-slate-500 hover:text-white">
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 15. Phone No. for calls */}
                      <td className="p-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <a href={`tel:${stf.phoneCalls}`} className="hover:underline">
                            {stf.phoneCalls}
                          </a>
                          {stf.phoneCalls && (
                            <button onClick={() => handleCopy(stf.phoneCalls, 'Phone')} className="text-slate-500 hover:text-white">
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 16. Phone No. (Whatsapp) */}
                      <td className="p-3 font-mono text-emerald-400 text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span>{stf.phoneWhatsapp}</span>
                          {stf.phoneWhatsapp && (
                            <a
                              href={`https://wa.me/${stf.phoneWhatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* 17. Aadhar No */}
                      <td className="p-3 font-mono text-slate-300 whitespace-nowrap">
                        {maskText(stf.aadharNo, 4)}
                      </td>

                      {/* 18. PRAN / PAN No */}
                      <td className="p-3 font-mono text-slate-300 text-[11px] truncate max-w-[150px]" title={stf.pranOrPanNo}>
                        {stf.pranOrPanNo}
                      </td>

                      {/* 19. Minority? */}
                      <td className="p-3 text-slate-300 text-[11px]">
                        {stf.isMinority || 'No'}
                      </td>

                      {/* 20. SENIORITY NUMBER */}
                      <td className={`p-3 font-mono text-[11px] font-bold ${isContractual ? 'text-amber-300' : 'text-purple-300'}`}>
                        {stf.seniorityNumber}
                      </td>

                      {/* Status - Admin Only */}
                      {isAdmin && (
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : isCorrection
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {stf.approvalStatus || 'Pending Review'}
                          </span>
                        </td>
                      )}

                      {/* Principal Actions Column (Sticky) - Admin Only */}
                      {isAdmin && (
                        <td className="p-3 sticky right-0 bg-slate-900 group-hover:bg-slate-850 z-10 text-center border-l border-slate-800">
                          <div className="flex items-center justify-center gap-1">
                            {/* Assign Role (KVS Samagam) */}
                            <button
                              onClick={() => {
                                setSelectedStaffForRole(stf);
                                setAssignRoleAction('class_teacher');
                                setIsAssignRolesModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer"
                              title={`Assign Class, Subject or Incharge Role to ${stf.name}`}
                            >
                              <Crown className="w-3.5 h-3.5 text-amber-300" />
                            </button>

                            {/* Inspect & Verify Modal */}
                            <button
                              onClick={() => handleOpenVerification(stf)}
                              className="p-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer"
                              title="Verify & Suggest (Principal Checking Authority)"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>

                            {/* Inspect Teacher Bio-Data Full Form */}
                            {onInspectTeacherBioData && (
                              <button
                                onClick={async () => {
                                  await setActiveInspectedTeacher(stf);
                                  onInspectTeacherBioData(stf);
                                }}
                                className="p-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/30 transition-all cursor-pointer"
                                title="Inspect Complete Diary Bio-Data & Responsibilities"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit Details & Delete (Admin Only) */}
                            {isAdminOrDataManager(currentUser) && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(stf)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                                  title="Edit Staff Record"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteStaff(stf.id, stf.name)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                                  title="Delete Staff Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: PRINCIPAL INSPECTION & VERIFICATION MODAL */}
      {showVerificationModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span>Principal Checking & Approval Authority</span>
                    {(selectedStaff.employmentType || detectEmploymentType(selectedStaff.designation)) === 'Contractual' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Contractual
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/40">
                        Regular
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Review and endorse Bio-Data for <strong className="text-white">{selectedStaff.name}</strong> ({selectedStaff.designation})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowVerificationModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Teacher Overview Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Emp Code:</span>
                <span className="font-mono font-bold text-purple-300">{selectedStaff.employeeCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Cadre Nature:</span>
                <span className={`font-bold ${
                  (selectedStaff.employmentType || detectEmploymentType(selectedStaff.designation)) === 'Contractual'
                    ? 'text-amber-300'
                    : 'text-sky-300'
                }`}>
                  {selectedStaff.employmentType || detectEmploymentType(selectedStaff.designation)} Faculty
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Social Category:</span>
                <span className="font-bold text-white">{selectedStaff.socialCategory}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Joining:</span>
                <span className="font-medium text-slate-300">{selectedStaff.joiningDateKVSWithDesignation}</span>
              </div>
            </div>

            {/* Quick Cross-Module Links for this Teacher */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Audit Related Teacher's Diary Modules for {selectedStaff.name}:</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    setShowVerificationModal(false);
                    if (onNavigateTab) onNavigateTab('lessonplan');
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-left transition-all cursor-pointer group"
                >
                  <span className="text-[10px] text-slate-500 block">Module 32</span>
                  <span className="text-xs font-bold text-white group-hover:text-purple-300 flex items-center justify-between">
                    Lesson Plans <ChevronRight className="w-3 h-3 text-slate-500" />
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowVerificationModal(false);
                    if (onNavigateTab) onNavigateTab('assessment');
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition-all cursor-pointer group"
                >
                  <span className="text-[10px] text-slate-500 block">Module 17</span>
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 flex items-center justify-between">
                    Assessments <ChevronRight className="w-3 h-3 text-slate-500" />
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowVerificationModal(false);
                    if (onNavigateTab) onNavigateTab('remedial');
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition-all cursor-pointer group"
                >
                  <span className="text-[10px] text-slate-500 block">Module 20</span>
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300 flex items-center justify-between">
                    Remedials <ChevronRight className="w-3 h-3 text-slate-500" />
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowVerificationModal(false);
                    if (onNavigateTab) onNavigateTab('inspection');
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-left transition-all cursor-pointer group"
                >
                  <span className="text-[10px] text-slate-500 block">Module 25</span>
                  <span className="text-xs font-bold text-white group-hover:text-cyan-300 flex items-center justify-between">
                    Inspections <ChevronRight className="w-3 h-3 text-slate-500" />
                  </span>
                </button>
              </div>
            </div>

            {/* Verification Form */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Approval & Verification Status *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVerificationStatus('Verified & Approved')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      verificationStatus === 'Verified & Approved'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verified & Approved</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerificationStatus('Pending Review')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      verificationStatus === 'Pending Review'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending Review</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerificationStatus('Correction Requested')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      verificationStatus === 'Correction Requested'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Correction Requested</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Principal Checking Remarks / Service Book Endorsement Note
                </label>
                <textarea
                  rows={2}
                  value={verificationRemarks}
                  onChange={e => setVerificationRemarks(e.target.value)}
                  placeholder="e.g. Verified with Original Service Book records and CBSE LOC submission..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Suggestions for Teacher's Diary / Action Points
                </label>
                <textarea
                  rows={2}
                  value={verificationSuggestions}
                  onChange={e => setVerificationSuggestions(e.target.value)}
                  placeholder="e.g. Please update Page 49 Self-Reflection for Class X Maths and log remedial test scores..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span>Checking Authority:</span>
                <strong className="text-cyan-300">{school.principalName || 'Principal'} ({school.principalDesignation || 'Principal I/c'})</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveVerification}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save & Stamp Verification</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK CSV IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base text-white">
                  Bulk Import Staff Details CSV
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Upload your staff data CSV file matching the official KVS schema. Both <strong>Regular (Permanent)</strong> and <strong>Contractual / Part-Time</strong> faculty records are automatically recognized and color-coded.
            </p>

            {/* Drag and Drop / File Input */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-slate-700 hover:border-purple-500/60 rounded-2xl bg-slate-950/60 text-center cursor-pointer space-y-2 transition-all"
            >
              <FileSpreadsheet className="w-10 h-10 text-purple-400 mx-auto" />
              <div className="text-xs font-bold text-white">Click or Drag & Drop Staff CSV File here</div>
              <p className="text-[11px] text-slate-400">Supports standard comma-separated CSV with headers</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Direct Paste Alternative */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Or Paste Raw CSV Data:</label>
                <button
                  type="button"
                  onClick={handleParseTextInput}
                  className="text-xs text-purple-400 hover:underline font-semibold cursor-pointer"
                >
                  Parse Pasted Text →
                </button>
              </div>
              <textarea
                rows={4}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={`"S.N.","Name","Employee Code","Designation","Employment Type","SocialCategory (GEN, OBC, SC, ST"...`}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px] placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Import Mode Options */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="text-purple-600"
                />
                <span>Replace all current records ({importPreview.length} new records)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="text-purple-600"
                />
                <span>Append / Update non-duplicates</span>
              </label>
            </div>

            {/* Errors if any */}
            {importErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Validation Notices ({importErrors.length}):</span>
                </div>
                <div className="max-h-20 overflow-y-auto pl-4 space-y-0.5 list-disc text-[11px]">
                  {importErrors.map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview of Parsed Staff */}
            {importPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <div className="flex items-center gap-2">
                    <span>Parsed Records Preview ({importPreview.length} Staff):</span>
                    <span className="text-sky-400">
                      Regular: {importPreview.filter(p => p.employmentType === 'Regular').length}
                    </span>
                    <span>•</span>
                    <span className="text-amber-400">
                      Contractual: {importPreview.filter(p => p.employmentType === 'Contractual').length}
                    </span>
                  </div>
                  <span className="text-emerald-400">Ready to Import ✓</span>
                </div>

                <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 divide-y divide-slate-800/60 text-xs">
                  {importPreview.slice(0, 10).map((stf, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${stf.employmentType === 'Contractual' ? 'text-amber-400' : 'text-purple-400'}`}>
                          {stf.employeeCode}
                        </span>
                        <span className={`font-bold ${stf.employmentType === 'Contractual' ? 'text-amber-300' : 'text-white'}`}>
                          {stf.name}
                        </span>
                        <span className="text-slate-400">({stf.designation})</span>
                        {stf.employmentType === 'Contractual' ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Contractual
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            Regular
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[11px]">{stf.email}</span>
                    </div>
                  ))}
                  {importPreview.length > 10 && (
                    <div className="p-2 text-center text-slate-500 text-[11px]">
                      + {importPreview.length - 10} more records...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importPreview.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Import {importPreview.length} Staff Records</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD / EDIT STAFF MEMBER MODAL */}
      {showAddEditModal && editingStaff && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  {editingStaff.id && staffList.some(s => s.id === editingStaff.id) ? 'Edit Staff Details' : 'Add New Staff Member'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddEditModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffForm} className="space-y-4">
              {/* Cadre Type Selector: Regular vs Contractual */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <label className="block text-xs font-black text-slate-300">
                  Employment Cadre Nature *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingStaff({
                      ...editingStaff,
                      employmentType: 'Regular',
                      pranOrPanNo: editingStaff.pranOrPanNo === 'PRAN-N/A' ? '' : editingStaff.pranOrPanNo
                    })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      (editingStaff.employmentType || 'Regular') === 'Regular'
                        ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>🛡️ Regular Staff (Permanent KVS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingStaff({
                      ...editingStaff,
                      employmentType: 'Contractual',
                      pranOrPanNo: editingStaff.pranOrPanNo || 'PRAN-N/A'
                    })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      editingStaff.employmentType === 'Contractual'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>⚡ Contractual / Part-Time Faculty</span>
                  </button>
                </div>
              </div>

              {/* Section A: Personal & Service Identity */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  1. Personal & Service Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editingStaff.name || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                      placeholder="e.g. Mrs. Sunita Verma"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Employee Code *</label>
                    <input
                      type="text"
                      required
                      value={editingStaff.employeeCode || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, employeeCode: e.target.value })}
                      placeholder="e.g. EMP10842"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Designation *</label>
                    <input
                      type="text"
                      required
                      value={editingStaff.designation || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, designation: e.target.value })}
                      placeholder="e.g. TGT (Science)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Social Category</label>
                    <select
                      value={editingStaff.socialCategory || 'GEN'}
                      onChange={e => setEditingStaff({ ...editingStaff, socialCategory: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="GEN">GEN (General)</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">DOB (DD/MM/YYYY)</label>
                    <input
                      type="text"
                      value={editingStaff.dob || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, dob: e.target.value })}
                      placeholder="15/07/1988"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Minority? (Yes/No)</label>
                    <input
                      type="text"
                      value={editingStaff.isMinority || 'No'}
                      onChange={e => setEditingStaff({ ...editingStaff, isMinority: e.target.value })}
                      placeholder="No or Yes (Muslim/Christian)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Seniority Number</label>
                    <input
                      type="text"
                      value={editingStaff.seniorityNumber || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, seniorityNumber: e.target.value })}
                      placeholder="KVS-TGT-2019-042"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Date of joining in KVS with designation</label>
                    <input
                      type="text"
                      value={editingStaff.joiningDateKVSWithDesignation || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, joiningDateKVSWithDesignation: e.target.value })}
                      placeholder="e.g. 10/08/2012 as PRT"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Date of joining in Present KV with designation</label>
                    <input
                      type="text"
                      value={editingStaff.joiningDatePresentKVWithDesignation || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, joiningDatePresentKVWithDesignation: e.target.value })}
                      placeholder="e.g. 05/04/2021 as TGT (Science)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section B: Banking & Tax Credentials */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                  2. Banking & Salary Account
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={editingStaff.bankName || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, bankName: e.target.value })}
                      placeholder="State Bank of India"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Bank A/C No.</label>
                    <input
                      type="text"
                      value={editingStaff.bankAccountNo || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, bankAccountNo: e.target.value })}
                      placeholder="30492819482"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={editingStaff.ifscCode || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, ifscCode: e.target.value })}
                      placeholder="SBIN0001042"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Aadhar Number</label>
                    <input
                      type="text"
                      value={editingStaff.aadharNo || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, aadharNo: e.target.value })}
                      placeholder="9876-5432-1098"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">PRAN / PAN Number</label>
                    <input
                      type="text"
                      value={editingStaff.pranOrPanNo || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, pranOrPanNo: e.target.value })}
                      placeholder="110049283741 / ABCDE1234F"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section C: Qualifications & Contact Info */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                  3. Qualifications & Contact Details
                </span>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Highest Academic & Professional Qualifications</label>
                  <input
                    type="text"
                    value={editingStaff.highestAcademicAndProfessionalQual || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, highestAcademicAndProfessionalQual: e.target.value })}
                    placeholder="e.g. M.Sc. Chemistry, B.Ed., CTET Qualified"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Permanent Postal Address</label>
                  <input
                    type="text"
                    value={editingStaff.permanentPostalAddress || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, permanentPostalAddress: e.target.value })}
                    placeholder="Plot No. 42, Saheed Nagar, Bhubaneswar, Odisha - 751007"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Official / Personal Email</label>
                    <input
                      type="email"
                      value={editingStaff.email || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })}
                      placeholder="teacher@kvs.edu"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Phone No. (for calls)</label>
                    <input
                      type="text"
                      value={editingStaff.phoneCalls || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, phoneCalls: e.target.value })}
                      placeholder="+91 94370 12345"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Phone No. (WhatsApp)</label>
                    <input
                      type="text"
                      value={editingStaff.phoneWhatsapp || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, phoneWhatsapp: e.target.value })}
                      placeholder="+91 94370 12345"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Staff Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KVS Samagam Assign Roles & Academic Portfolios Modal */}
      <RoleAssignmentModal
        isOpen={isAssignRolesModalOpen}
        onClose={() => {
          setIsAssignRolesModalOpen(false);
          loadStaffData();
        }}
        initialAction={assignRoleAction}
        targetTeacherCode={selectedStaffForRole?.employeeCode}
      />
    </div>
  );
};
