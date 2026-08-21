import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  PortfolioTemplate,
  PortfolioAssignment,
  ResponsibilityDelegation,
  ResponsibilityRequest,
  PortfolioCategory,
  ResponsibilityFrequency,
  StaffDetailRecord,
  PortfolioResponsibility,
  ResponsibilitySubItem,
  PortfolioSuggestion,
  ThemeCalendarActivity,
  ThemeCalendarCategory,
  ThemeCalendarMonth,
  HourlyActivity,
  TeacherTask
} from '../types/academic';
import { UserAccount } from '../types/auth';
import {
  db,
  DEFAULT_PORTFOLIO_TEMPLATES,
  DEFAULT_PORTFOLIO_ASSIGNMENTS,
  DEFAULT_RESPONSIBILITY_DELEGATIONS,
  DEFAULT_RESPONSIBILITY_REQUESTS,
  DEFAULT_PORTFOLIO_SUGGESTIONS,
  DEFAULT_STAFF_DETAILS,
  THEME_CALENDAR_2026_27,
  THEME_FOR_THE_YEAR,
  getUserAccounts
} from '../lib/storage';
import { detectPortfolioSuggestions } from '../lib/suggestionEngine';
import {
  processRawCommitteeRows,
  downloadSampleCommitteesExcel,
  downloadSampleCommitteesCSV,
  exportActiveCommitteesToExcel,
  ParsedImportResult
} from '../lib/portfolioImportExport';
import { DevModeBadge } from './DevModeBadge';
import {
  Briefcase,
  UserCheck,
  Users,
  ArrowRight,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  HelpCircle,
  X,
  FileText,
  UserPlus,
  Trash2,
  Check,
  Calendar,
  Layers,
  Award,
  Clock,
  Send,
  Eye,
  Sliders,
  Flame,
  BrainCircuit,
  Zap,
  TrendingUp,
  Cpu,
  BookOpen,
  CalendarDays,
  Edit2,
  Edit3,
  Settings,
  Upload,
  Download,
  FileSpreadsheet,
  FileCode,
  CheckCheck,
  AlertCircle
} from 'lucide-react';

interface PortfolioRoleManagerProps {
  devMode?: boolean;
  currentUser?: UserAccount | null;
  onNavigateTab?: (tab: string) => void;
}

type SubTab = 'committees' | 'delegations' | 'requests' | 'suggestions' | 'theme_calendar';

const CATEGORY_COLORS: Record<PortfolioCategory, { bg: string; text: string; border: string }> = {
  'Academic & Administration': { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-500/40' },
  'Student Welfare & Safety': { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-500/40' },
  'Activities, Clubs & Student Development': { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  'Maintenance & Infrastructure': { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-500/40' },
  'Office / Administrative': { bg: 'bg-sky-950/40', text: 'text-sky-300', border: 'border-sky-500/40' },
  'Other': { bg: 'bg-slate-950/40', text: 'text-slate-300', border: 'border-slate-700' }
};

export const PortfolioRoleManager: React.FC<PortfolioRoleManagerProps> = ({
  devMode,
  currentUser,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<SubTab>('committees');
  const [templates, setTemplates] = useState<PortfolioTemplate[]>([]);
  const [assignments, setAssignments] = useState<PortfolioAssignment[]>([]);
  const [delegations, setDelegations] = useState<ResponsibilityDelegation[]>([]);
  const [requests, setRequests] = useState<ResponsibilityRequest[]>([]);
  const [suggestions, setSuggestions] = useState<PortfolioSuggestion[]>([]);
  const [staffList, setStaffList] = useState<StaffDetailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | PortfolioCategory>('ALL');
  const [suggestionStatusFilter, setSuggestionStatusFilter] = useState<'ALL' | 'Pending' | 'Approved' | 'Rejected'>('ALL');

  // Theme Calendar Filters (Phase 6)
  const [selectedCalendarMonth, setSelectedCalendarMonth] = useState<'ALL' | ThemeCalendarMonth>('ALL');
  const [selectedCalendarCategory, setSelectedCalendarCategory] = useState<'ALL' | ThemeCalendarCategory>('ALL');

  // Modals: Assign Role
  const [selectedTemplateForAssign, setSelectedTemplateForAssign] = useState<PortfolioTemplate | null>(null);
  const [selectedRoleType, setSelectedRoleType] = useState<'In-charge' | 'Member'>('In-charge');
  const [selectedTeacherCode, setSelectedTeacherCode] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // Modals: Edit Portfolio
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState<PortfolioTemplate | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<PortfolioCategory>('Academic & Administration');
  const [editDescription, setEditDescription] = useState('');
  const [editInchargeCode, setEditInchargeCode] = useState('');
  const [editMemberCodes, setEditMemberCodes] = useState<string[]>([]);
  const [editResponsibilities, setEditResponsibilities] = useState<PortfolioResponsibility[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Responsibility input fields inside Edit Modal
  const [newRespTitle, setNewRespTitle] = useState('');
  const [newRespSubCategory, setNewRespSubCategory] = useState('');
  const [newRespFreq, setNewRespFreq] = useState<ResponsibilityFrequency>('Monthly');
  const [newRespIsMandatory, setNewRespIsMandatory] = useState(false);
  const [newRespSubItems, setNewRespSubItems] = useState<ResponsibilitySubItem[]>([]);
  const [newSubItemTitle, setNewSubItemTitle] = useState('');
  const [editingRespId, setEditingRespId] = useState<string | null>(null);
  const [quickAddMemberCode, setQuickAddMemberCode] = useState('');

  // Modals: Delegation
  const [selectedTemplateForDelegation, setSelectedTemplateForDelegation] = useState<PortfolioTemplate | null>(null);
  const [selectedRespId, setSelectedRespId] = useState('');
  const [selectedDelegatedTeacherCode, setSelectedDelegatedTeacherCode] = useState('');
  const [delegationNotes, setDelegationNotes] = useState('');

  // Modals: Request Review
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<ResponsibilityRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [principalRemarks, setPrincipalRemarks] = useState('');

  // Modals: Create Portfolio
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioCategory, setNewPortfolioCategory] = useState<PortfolioCategory>('Academic & Administration');
  const [newPortfolioDesc, setNewPortfolioDesc] = useState('');
  const [newPortfolioRespTitle, setNewPortfolioRespTitle] = useState('');
  const [newPortfolioSubCategory, setNewPortfolioSubCategory] = useState('');
  const [newPortfolioRespFreq, setNewPortfolioRespFreq] = useState<ResponsibilityFrequency>('Monthly');

  // Modals: Bulk Import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [parsedImportResult, setParsedImportResult] = useState<ParsedImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggestion edit target portfolio mapping
  const [suggestionTargetMap, setSuggestionTargetMap] = useState<Record<string, string>>({});

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredStaffForMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return staffList;
    const q = memberSearchQuery.toLowerCase();
    return staffList.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        (s.designation && s.designation.toLowerCase().includes(q)) ||
        (s.employeeCode && s.employeeCode.toLowerCase().includes(q))
    );
  }, [staffList, memberSearchQuery]);

  useEffect(() => {
    loadAllData();

    const handlePortfolioUpdate = () => {
      loadAllData();
    };

    window.addEventListener('kvs-portfolios-updated', handlePortfolioUpdate);
    window.addEventListener('kvs-auth-changed', handlePortfolioUpdate);
    return () => {
      window.removeEventListener('kvs-portfolios-updated', handlePortfolioUpdate);
      window.removeEventListener('kvs-auth-changed', handlePortfolioUpdate);
    };
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [tData, aData, dData, rData, sData, staffData, userAccounts] = await Promise.all([
        db.get<PortfolioTemplate[]>('setup:portfolio_templates'),
        db.get<PortfolioAssignment[]>('setup:portfolio_assignments'),
        db.get<ResponsibilityDelegation[]>('setup:responsibility_delegations'),
        db.get<ResponsibilityRequest[]>('setup:responsibility_requests'),
        db.get<PortfolioSuggestion[]>('setup:portfolio_suggestions'),
        db.get<StaffDetailRecord[]>('setup:staff_details'),
        getUserAccounts()
      ]);

      const loadedTemplates = tData && tData.length > 0 ? tData : DEFAULT_PORTFOLIO_TEMPLATES;
      setTemplates(loadedTemplates);
      setAssignments(aData && aData.length > 0 ? aData : DEFAULT_PORTFOLIO_ASSIGNMENTS);
      setDelegations(dData && dData.length > 0 ? dData : DEFAULT_RESPONSIBILITY_DELEGATIONS);
      setRequests(rData && rData.length > 0 ? rData : DEFAULT_RESPONSIBILITY_REQUESTS);

      const loadedSuggestions = sData && sData.length > 0 ? sData : DEFAULT_PORTFOLIO_SUGGESTIONS;
      setSuggestions(loadedSuggestions);

      const initialTargets: Record<string, string> = {};
      loadedSuggestions.forEach(s => {
        initialTargets[s.id] = s.suggestedPortfolioTemplateId || loadedTemplates[0]?.id || '';
      });
      setSuggestionTargetMap(initialTargets);

      // Merge all staff and user accounts so EVERY teacher is in staffList
      const combinedStaffMap = new Map<string, StaffDetailRecord>();

      DEFAULT_STAFF_DETAILS.forEach(s => {
        if (s.employeeCode) combinedStaffMap.set(s.employeeCode, s);
      });

      if (staffData && staffData.length > 0) {
        staffData.forEach(s => {
          if (s.employeeCode) combinedStaffMap.set(s.employeeCode, s);
        });
      }

      if (userAccounts && userAccounts.length > 0) {
        userAccounts.forEach(u => {
          if (u.employeeCode) {
            const existing = combinedStaffMap.get(u.employeeCode);
            if (existing) {
              combinedStaffMap.set(u.employeeCode, {
                ...existing,
                name: u.name || existing.name,
                designation: u.designation || existing.designation
              });
            } else {
              combinedStaffMap.set(u.employeeCode, {
                id: u.id,
                serialNo: combinedStaffMap.size + 1,
                name: u.name,
                employeeCode: u.employeeCode,
                designation: u.designation || 'Teacher',
                employmentType: 'Regular',
                socialCategory: 'GENERAL',
                dob: '',
                joiningDateKVSWithDesignation: '',
                joiningDatePresentKVWithDesignation: '',
                bankAccountNo: '',
                ifscCode: '',
                bankName: '',
                highestAcademicAndProfessionalQual: '',
                permanentPostalAddress: '',
                email: u.email,
                phoneCalls: '',
                phoneWhatsapp: '',
                aadharNo: '',
                pranOrPanNo: '',
                isMinority: 'No',
                seniorityNumber: '',
                approvalStatus: 'Verified & Approved'
              });
            }
          }
        });
      }

      setStaffList(Array.from(combinedStaffMap.values()));
    } catch (err) {
      console.error('Error loading portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  // --------------------------------------------------------------------------
  // ACTION: Remove a specific Committee Member
  // --------------------------------------------------------------------------
  const handleRemoveMember = async (assignmentId: string, memberName: string) => {
    if (!window.confirm(`Remove "${memberName}" from this committee?`)) {
      return;
    }

    try {
      const updated = assignments.filter(a => a.id !== assignmentId);
      setAssignments(updated);
      await db.set('setup:portfolio_assignments', updated);

      window.dispatchEvent(new CustomEvent('kvs-portfolios-updated'));
      showNotification(`Removed ${memberName} from committee.`);
    } catch (err) {
      console.error('Error removing committee member:', err);
      showNotification('Failed to remove member.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // ACTION: Quick Add Member Inside Edit Modal
  // --------------------------------------------------------------------------
  const handleQuickAddMemberInEdit = async () => {
    if (!selectedTemplateForEdit || !quickAddMemberCode) return;
    const teacher = staffList.find(s => s.employeeCode === quickAddMemberCode);
    const teacherName = teacher ? teacher.name : quickAddMemberCode;

    const alreadyMember = assignments.some(
      a =>
        a.portfolioTemplateId === selectedTemplateForEdit.id &&
        a.teacherEmployeeCode === quickAddMemberCode &&
        a.role === 'Member'
    );

    if (alreadyMember) {
      alert(`${teacherName} is already a member of this committee.`);
      return;
    }

    const newAsgn: PortfolioAssignment = {
      id: `asgn-${Date.now().toString().slice(-5)}`,
      portfolioTemplateId: selectedTemplateForEdit.id,
      role: 'Member',
      teacherEmployeeCode: quickAddMemberCode,
      teacherName: teacherName,
      assignedBy: currentUser?.name || 'Principal',
      assignedAt: new Date().toISOString(),
      status: 'Active',
      notes: 'Added via Committee Editor.'
    };

    const updated = [...assignments, newAsgn];
    setAssignments(updated);
    await db.set('setup:portfolio_assignments', updated);

    window.dispatchEvent(new CustomEvent('kvs-portfolios-updated'));
    showNotification(`Added ${teacherName} as committee member.`);
    setQuickAddMemberCode('');
  };

  // --------------------------------------------------------------------------
  // BULK FILE IMPORT HANDLERS (.xlsx, .csv, .json)
  // --------------------------------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    if (fileName.endsWith('.json')) {
      reader.onload = event => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          const rawRows = Array.isArray(parsed) ? parsed : parsed.committees || [];
          const result = processRawCommitteeRows(rawRows, staffList, currentUser?.name || 'Principal');
          setParsedImportResult(result);
        } catch (err) {
          alert('Invalid JSON file format.');
        }
      };
      reader.readAsText(file);
    } else {
      // Excel (.xlsx, .xls) or CSV (.csv)
      reader.onload = event => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet);

          const result = processRawCommitteeRows(rawRows, staffList, currentUser?.name || 'Principal');
          setParsedImportResult(result);
        } catch (err) {
          console.error('Error parsing file:', err);
          alert('Failed to parse spreadsheet file. Please verify columns.');
        }
      };
      reader.readAsArrayBuffer(file);
    }

    // Reset input
    e.target.value = '';
  };

  const handleApplyImport = async () => {
    if (!parsedImportResult || parsedImportResult.templates.length === 0) return;

    setIsImporting(true);
    try {
      let finalTemplates: PortfolioTemplate[] = [];
      let finalAssignments: PortfolioAssignment[] = [];

      if (importMode === 'replace') {
        finalTemplates = parsedImportResult.templates;
        finalAssignments = parsedImportResult.assignments;
      } else {
        // Merge mode: retain existing, append new
        const existingNames = new Set(templates.map(t => t.name.toLowerCase()));
        const newTemplates = parsedImportResult.templates.filter(
          t => !existingNames.has(t.name.toLowerCase())
        );
        finalTemplates = [...templates, ...newTemplates];
        finalAssignments = [...assignments, ...parsedImportResult.assignments];
      }

      setTemplates(finalTemplates);
      setAssignments(finalAssignments);

      await Promise.all([
        db.set('setup:portfolio_templates', finalTemplates),
        db.set('setup:portfolio_assignments', finalAssignments)
      ]);

      window.dispatchEvent(new CustomEvent('kvs-portfolios-updated'));
      showNotification(
        `Successfully imported ${parsedImportResult.summary.totalCommittees} committees with ${parsedImportResult.summary.inchargesAssigned} in-charges and ${parsedImportResult.summary.membersAssigned} members!`
      );

      setIsImportModalOpen(false);
      setParsedImportResult(null);
    } catch (err) {
      console.error('Error applying import:', err);
      showNotification('Failed to apply import.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // --------------------------------------------------------------------------
  // AI SUGGESTION ENGINE ACTIONS (PHASE 5)
  // --------------------------------------------------------------------------
  const handleRunAIDetectionScan = async () => {
    setIsDetecting(true);
    try {
      const [activities, tasks] = await Promise.all([
        db.get<HourlyActivity[]>('setup:hourly_activities') || [],
        db.get<TeacherTask[]>('setup:tasks') || []
      ]);

      const detected = detectPortfolioSuggestions(activities, tasks, templates, suggestions);
      setSuggestions(detected);
      await db.set('setup:portfolio_suggestions', detected);

      const targets: Record<string, string> = { ...suggestionTargetMap };
      detected.forEach(s => {
        if (!targets[s.id]) {
          targets[s.id] = s.suggestedPortfolioTemplateId || templates[0]?.id || '';
        }
      });
      setSuggestionTargetMap(targets);

      const pendingCount = detected.filter(s => s.status === 'Pending').length;
      showNotification(`AI Scan complete! ${pendingCount} living responsibility suggestions ready for review.`);
    } catch (err) {
      console.error('Error running AI detection scan:', err);
      showNotification('Failed to run AI detection scan.', 'error');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleApproveSuggestion = async (sug: PortfolioSuggestion) => {
    const targetPortId = suggestionTargetMap[sug.id] || sug.suggestedPortfolioTemplateId || templates[0]?.id;
    const targetTemplate = templates.find(t => t.id === targetPortId);

    if (!targetTemplate) {
      alert('Please select a valid committee for this suggestion.');
      return;
    }

    try {
      const newResp: PortfolioResponsibility = {
        id: `resp-ai-${Date.now()}`,
        title: sug.suggestedTitle,
        description: sug.suggestedDescription,
        frequency: sug.suggestedFrequency,
        isMandatory: false,
        canBeDelegated: true
      };

      const updatedTemplates = templates.map(t => {
        if (t.id === targetPortId) {
          return {
            ...t,
            responsibilities: [...t.responsibilities, newResp],
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });

      const updatedSuggestions = suggestions.map(s => {
        if (s.id === sug.id) {
          return {
            ...s,
            status: 'Approved' as const,
            suggestedPortfolioTemplateId: targetPortId,
            suggestedPortfolioName: targetTemplate.name,
            reviewedAt: new Date().toISOString(),
            principalRemarks: 'Approved and added to official committee responsibilities via Living Suggestion Engine.'
          };
        }
        return s;
      });

      setTemplates(updatedTemplates);
      setSuggestions(updatedSuggestions);

      await Promise.all([
        db.set('setup:portfolio_templates', updatedTemplates),
        db.set('setup:portfolio_suggestions', updatedSuggestions)
      ]);

      window.dispatchEvent(new CustomEvent('kvs-portfolios-updated'));
      showNotification(`Approved! "${sug.suggestedTitle}" added to ${targetTemplate.name}.`);
    } catch (err) {
      console.error('Error approving suggestion:', err);
      showNotification('Failed to approve suggestion.', 'error');
    }
  };

  const handleRejectSuggestion = async (sugId: string) => {
    try {
      const updatedSuggestions = suggestions.map(s => {
        if (s.id === sugId) {
          return {
            ...s,
            status: 'Rejected' as const,
            reviewedAt: new Date().toISOString(),
            principalRemarks: 'Dismissed by Principal.'
          };
        }
        return s;
      });

      setSuggestions(updatedSuggestions);
      await db.set('setup:portfolio_suggestions', updatedSuggestions);
      showNotification('Suggestion dismissed.');
    } catch (err) {
      console.error('Error rejecting suggestion:', err);
      showNotification('Failed to dismiss suggestion.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // THEME CALENDAR 2026-27 ACTIONS (PHASE 6)
  // --------------------------------------------------------------------------
  const handleAdoptCalendarActivity = async (activity: ThemeCalendarActivity) => {
    const targetPortId = activity.suggestedCommitteeId || 'port-exam';
    const targetTemplate = templates.find(t => t.id === targetPortId);

    if (!targetTemplate) {
      alert(`Committee ${activity.suggestedCommitteeName || targetPortId} not found.`);
      return;
    }

    const alreadyExists = targetTemplate.responsibilities.some(
      r => r.linkedThemeCalendarActivity === activity.title || r.title.toLowerCase() === activity.title.toLowerCase()
    );

    if (alreadyExists) {
      showNotification(`"${activity.title}" is already an active responsibility in ${targetTemplate.name}.`, 'error');
      return;
    }

    try {
      const newResp: PortfolioResponsibility = {
        id: `resp-cal-${Date.now()}`,
        title: activity.title,
        description: activity.description || `Official KVS 2026-27 Theme Calendar Activity (${activity.month}).`,
        frequency: activity.month === 'April & May' ? 'Term' : 'Annual',
        suggestedMonths: [activity.month],
        isMandatory: activity.isMandatory || false,
        canBeDelegated: true,
        linkedThemeCalendarActivity: activity.title
      };

      const updatedTemplates = templates.map(t => {
        if (t.id === targetPortId) {
          return {
            ...t,
            responsibilities: [...t.responsibilities, newResp],
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });

      setTemplates(updatedTemplates);
      await db.set('setup:portfolio_templates', updatedTemplates);

      window.dispatchEvent(new CustomEvent('kvs-portfolios-updated'));
      showNotification(`Adopted "${activity.title}" into ${targetTemplate.name}!`);
    } catch (err) {
      console.error('Error adopting calendar activity:', err);
      showNotification('Failed to adopt calendar activity.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // ACTION: Assign Teacher to Portfolio (In-charge or Member)
  // --------------------------------------------------------------------------
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateForAssign || !selectedTeacherCode) return;

    const teacher = staffList.find(s => s.employeeCode === selectedTeacherCode);
    const teacherName = teacher ? teacher.name : selectedTeacherCode;

    try {
      let updatedAssignments = [...assignments];

      if (selectedRoleType === 'In-charge') {
        updatedAssignments = updatedAssignments.filter(
          a => !(a.portfolioTemplateId === selectedTemplateForAssign.id && a.role === 'In-charge')
        );
      }

      const existingMember = updatedAssignments.find(
        a =>
          a.portfolioTemplateId === selectedTemplateForAssign.id &&
          a.teacherEmployeeCode === selectedTeacherCode &&
          a.role === selectedRoleType
      );

      if (existingMember) {
        showNotification(`${teacherName} is already assigned as ${selectedRoleType}.`, 'error');
        return;
      }

      const newAsgn: PortfolioAssignment = {
        id: `asgn-${Date.now().toString().slice(-5)}`,
        portfolioTemplateId: selectedTemplateForAssign.id,
        role: selectedRoleType,
        teacherEmployeeCode: selectedTeacherCode,
        teacherName: teacherName,
        assignedBy: currentUser?.name || 'Principal',
        assignedAt: new Date().toISOString(),
        status: 'Active',
        notes: assignmentNotes.trim() || undefined
      };

      updatedAssignments.push(newAsgn);
      setAssignments(updatedAssignments);
      await db.set('setup:portfolio_assignments', updatedAssignments);

      window.dispatchEvent(new CustomEvent('kvs-portfolios-updated', { detail: newAsgn }));
      showNotification(`Assigned ${teacherName} as ${selectedRoleType} for ${selectedTemplateForAssign.name}`);

      setSelectedTemplateForAssign(null);
      setSelectedTeacherCode('');
      setAssignmentNotes('');
    } catch (err) {
      console.error('Error saving portfolio assignment:', err);
      showNotification('Failed to save assignment.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // ACTION: Edit an Existing Portfolio (Staged Unified Batch Transaction)
  // --------------------------------------------------------------------------
  const handleOpenEditModal = (template: PortfolioTemplate) => {
    setSelectedTemplateForEdit(template);
    setEditName(template.name);
    setEditCategory(template.category);
    setEditDescription(template.description);
    setEditResponsibilities(template.responsibilities ? JSON.parse(JSON.stringify(template.responsibilities)) : []);

    // Load active In-charge
    const inchargeAsgn = assignments.find(
      a => a.portfolioTemplateId === template.id && a.role === 'In-charge' && a.status === 'Active'
    );
    setEditInchargeCode(inchargeAsgn?.teacherEmployeeCode || '');

    // Load active Members
    const memberCodes = assignments
      .filter(a => a.portfolioTemplateId === template.id && a.role === 'Member' && a.status === 'Active')
      .map(a => a.teacherEmployeeCode);
    setEditMemberCodes(memberCodes);

    // Reset responsibility input state
    setNewRespTitle('');
    setNewRespSubCategory('');
    setNewRespFreq('Monthly');
    setNewRespIsMandatory(false);
    setNewRespSubItems([]);
    setNewSubItemTitle('');
    setEditingRespId(null);
    setMemberSearchQuery('');
  };

  const handleToggleMember = (empCode: string) => {
    setEditMemberCodes(prev =>
      prev.includes(empCode) ? prev.filter(c => c !== empCode) : [...prev, empCode]
    );
  };

  const handleSelectAllFilteredMembers = () => {
    const codesToAdd = filteredStaffForMembers.map(s => s.employeeCode);
    setEditMemberCodes(prev => Array.from(new Set([...prev, ...codesToAdd])));
  };

  const handleClearAllMembers = () => {
    setEditMemberCodes([]);
  };

  const handleAddOrUpdateResponsibilityInEdit = () => {
    if (!newRespTitle.trim()) return;

    if (editingRespId) {
      setEditResponsibilities(prev =>
        prev.map(r => {
          if (r.id === editingRespId) {
            return {
              ...r,
              title: newRespTitle.trim(),
              subCategory: newRespSubCategory.trim() || undefined,
              frequency: newRespFreq,
              isMandatory: newRespIsMandatory,
              subItems: newRespSubItems.length > 0 ? newRespSubItems : undefined
            };
          }
          return r;
        })
      );
      setEditingRespId(null);
    } else {
      const newResp: PortfolioResponsibility = {
        id: `resp-custom-${Date.now()}`,
        title: newRespTitle.trim(),
        subCategory: newRespSubCategory.trim() || undefined,
        description: 'Official committee duty.',
        frequency: newRespFreq,
        isMandatory: newRespIsMandatory,
        canBeDelegated: true,
        subItems: newRespSubItems.length > 0 ? newRespSubItems : undefined
      };
      setEditResponsibilities(prev => [...prev, newResp]);
    }

    setNewRespTitle('');
    setNewRespSubCategory('');
    setNewRespFreq('Monthly');
    setNewRespIsMandatory(false);
    setNewRespSubItems([]);
    setNewSubItemTitle('');
  };

  const handleStartEditResp = (resp: PortfolioResponsibility) => {
    setEditingRespId(resp.id);
    setNewRespTitle(resp.title);
    setNewRespSubCategory(resp.subCategory || '');
    setNewRespFreq(resp.frequency || 'Monthly');
    setNewRespIsMandatory(resp.isMandatory || false);
    setNewRespSubItems(resp.subItems ? [...resp.subItems] : []);
    setNewSubItemTitle('');
  };

  const handleCancelEditResp = () => {
    setEditingRespId(null);
    setNewRespTitle('');
    setNewRespSubCategory('');
    setNewRespFreq('Monthly');
    setNewRespIsMandatory(false);
    setNewRespSubItems([]);
    setNewSubItemTitle('');
  };

  const handleAddSubItemInEdit = () => {
    if (!newSubItemTitle.trim()) return;
    const item: ResponsibilitySubItem = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: newSubItemTitle.trim(),
      isCompleted: false
    };
    setNewRespSubItems(prev => [...prev, item]);
    setNewSubItemTitle('');
  };

  const handleRemoveSubItemInEdit = (subId: string) => {
    setNewRespSubItems(prev => prev.filter(i => i.id !== subId));
  };

  const handleRemoveResponsibilityInEdit = (respId: string) => {
    setEditResponsibilities(prev => prev.filter(r => r.id !== respId));
    if (editingRespId === respId) {
      handleCancelEditResp();
    }
  };

  const handleSaveEditedPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateForEdit || !editName.trim()) return;

    try {
      // 1. Update Portfolio Template
      const updatedTemplates = templates.map(t => {
        if (t.id === selectedTemplateForEdit.id) {
          return {
            ...t,
            name: editName.trim(),
            category: editCategory,
            description: editDescription.trim(),
            responsibilities: editResponsibilities,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });

      // 2. Update Portfolio Assignments (Atomic Transaction)
      const otherAssignments = assignments.filter(a => a.portfolioTemplateId !== selectedTemplateForEdit.id);
      const newCommitteeAssignments: PortfolioAssignment[] = [];

      // Primary In-charge
      if (editInchargeCode) {
        const inchargeStaff = staffList.find(s => s.employeeCode === editInchargeCode);
        newCommitteeAssignments.push({
          id: `asgn-inc-${selectedTemplateForEdit.id}-${Date.now().toString().slice(-4)}`,
          portfolioTemplateId: selectedTemplateForEdit.id,
          role: 'In-charge',
          teacherEmployeeCode: editInchargeCode,
          teacherName: inchargeStaff ? inchargeStaff.name : editInchargeCode,
          assignedBy: currentUser?.name || 'Principal',
          assignedAt: new Date().toISOString(),
          status: 'Active',
          notes: 'Assigned as Committee In-charge'
        });
      }

      // Committee Members from multi-select
      editMemberCodes.forEach((mCode, idx) => {
        if (mCode === editInchargeCode) return; // Prevent duplicate
        const memberStaff = staffList.find(s => s.employeeCode === mCode);
        newCommitteeAssignments.push({
          id: `asgn-mem-${selectedTemplateForEdit.id}-${mCode}-${idx}-${Date.now().toString().slice(-4)}`,
          portfolioTemplateId: selectedTemplateForEdit.id,
          role: 'Member',
          teacherEmployeeCode: mCode,
          teacherName: memberStaff ? memberStaff.name : mCode,
          assignedBy: currentUser?.name || 'Principal',
          assignedAt: new Date().toISOString(),
          status: 'Active',
          notes: 'Assigned as Committee Member'
        });
      });

      const updatedAssignments = [...otherAssignments, ...newCommitteeAssignments];

      setTemplates(updatedTemplates);
      setAssignments(updatedAssignments);

      await Promise.all([
        db.set('setup:portfolio_templates', updatedTemplates),
        db.set('setup:portfolio_assignments', updatedAssignments)
      ]);

      window.dispatchEvent(new CustomEvent('kvs-portfolios-updated'));
      showNotification(`✨ Saved changes for "${editName.trim()}" with ${editMemberCodes.length} members and ${editResponsibilities.length} responsibilities!`);
      setSelectedTemplateForEdit(null);
    } catch (err) {
      console.error('Error updating portfolio:', err);
      showNotification('Failed to update portfolio.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // ACTION: Delete a Portfolio
  // --------------------------------------------------------------------------
  const handleDeletePortfolio = async (template: PortfolioTemplate) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the committee "${template.name}"?\n\nThis will also remove all its assigned In-charge and member records.`
      )
    ) {
      return;
    }

    try {
      const updatedTemplates = templates.filter(t => t.id !== template.id);
      const updatedAssignments = assignments.filter(a => a.portfolioTemplateId !== template.id);
      const updatedDelegations = delegations.filter(d => d.portfolioTemplateId !== template.id);
      const updatedRequests = requests.filter(r => r.portfolioTemplateId !== template.id);

      setTemplates(updatedTemplates);
      setAssignments(updatedAssignments);
      setDelegations(updatedDelegations);
      setRequests(updatedRequests);

      await Promise.all([
        db.set('setup:portfolio_templates', updatedTemplates),
        db.set('setup:portfolio_assignments', updatedAssignments),
        db.set('setup:responsibility_delegations', updatedDelegations),
        db.set('setup:responsibility_requests', updatedRequests)
      ]);

      window.dispatchEvent(new CustomEvent('kvs-portfolios-updated'));
      showNotification(`Deleted committee "${template.name}".`);
    } catch (err) {
      console.error('Error deleting portfolio:', err);
      showNotification('Failed to delete portfolio.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // ACTION: Delegate a Specific Responsibility
  // --------------------------------------------------------------------------
  const handleSaveDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateForDelegation || !selectedRespId || !selectedDelegatedTeacherCode) return;

    const currentIncharge = assignments.find(
      a => a.portfolioTemplateId === selectedTemplateForDelegation.id && a.role === 'In-charge' && a.status === 'Active'
    );

    const targetTeacher = staffList.find(s => s.employeeCode === selectedDelegatedTeacherCode);
    const targetName = targetTeacher ? targetTeacher.name : selectedDelegatedTeacherCode;

    try {
      const newDel: ResponsibilityDelegation = {
        id: `del-${Date.now().toString().slice(-5)}`,
        portfolioTemplateId: selectedTemplateForDelegation.id,
        responsibilityId: selectedRespId,
        originalOwnerEmployeeCode: currentIncharge?.teacherEmployeeCode || '108894',
        originalOwnerName: currentIncharge?.teacherName || 'In-charge',
        delegatedToEmployeeCode: selectedDelegatedTeacherCode,
        delegatedToName: targetName,
        delegatedBy: currentUser?.name ? `${currentUser.name} (Principal)` : 'Principal',
        delegatedAt: new Date().toISOString(),
        status: 'Active',
        notes: delegationNotes.trim() || undefined
      };

      const updatedDelegations = [newDel, ...delegations];
      setDelegations(updatedDelegations);
      await db.set('setup:responsibility_delegations', updatedDelegations);

      window.dispatchEvent(new CustomEvent('kvs-portfolios-updated', { detail: newDel }));
      showNotification(`Delegated responsibility to ${targetName}. Ownership remains with ${newDel.originalOwnerName}.`);

      setSelectedTemplateForDelegation(null);
      setSelectedRespId('');
      setSelectedDelegatedTeacherCode('');
      setDelegationNotes('');
    } catch (err) {
      console.error('Error delegating responsibility:', err);
      showNotification('Failed to delegate responsibility.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // ACTION: Review Teacher Responsibility Request
  // --------------------------------------------------------------------------
  const handleReviewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForReview) return;

    try {
      const updatedRequests = requests.map(r => {
        if (r.id === selectedRequestForReview.id) {
          return {
            ...r,
            status: reviewAction,
            principalRemarks: principalRemarks.trim() || undefined,
            reviewedAt: new Date().toISOString()
          };
        }
        return r;
      });

      if (reviewAction === 'Approved') {
        const targetTemplate = templates.find(t => t.id === selectedRequestForReview.portfolioTemplateId);
        if (targetTemplate) {
          const newResp: PortfolioResponsibility = {
            id: `resp-${Date.now()}`,
            title: selectedRequestForReview.title,
            description: selectedRequestForReview.description,
            frequency: selectedRequestForReview.suggestedFrequency,
            isMandatory: false,
            canBeDelegated: true
          };

          const updatedTemplates = templates.map(t => {
            if (t.id === targetTemplate.id) {
              return {
                ...t,
                responsibilities: [...t.responsibilities, newResp],
                updatedAt: new Date().toISOString()
              };
            }
            return t;
          });

          setTemplates(updatedTemplates);
          await db.set('setup:portfolio_templates', updatedTemplates);
        }
      }

      setRequests(updatedRequests);
      await db.set('setup:responsibility_requests', updatedRequests);

      window.dispatchEvent(new CustomEvent('kvs-portfolios-updated'));
      showNotification(`Request ${reviewAction.toLowerCase()} successfully!`);

      setSelectedRequestForReview(null);
      setPrincipalRemarks('');
    } catch (err) {
      console.error('Error reviewing request:', err);
      showNotification('Failed to review request.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // ACTION: Create New Custom Portfolio / Committee
  // --------------------------------------------------------------------------
  const handleCreateNewPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim() || !newPortfolioDesc.trim() || !newPortfolioRespTitle.trim()) {
      alert('Please fill all required portfolio fields.');
      return;
    }

    try {
      const newTemplate: PortfolioTemplate = {
        id: `port-custom-${Date.now()}`,
        name: newPortfolioName.trim(),
        category: newPortfolioCategory,
        description: newPortfolioDesc.trim(),
        isCommittee: true,
        createdBy: currentUser?.name || 'Principal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        responsibilities: [
          {
            id: `resp-${Date.now()}-1`,
            title: newPortfolioRespTitle.trim(),
            subCategory: newPortfolioSubCategory.trim() || undefined,
            description: 'Primary core duty for this institutional portfolio.',
            frequency: newPortfolioRespFreq,
            isMandatory: true,
            canBeDelegated: true
          }
        ]
      };

      const updated = [newTemplate, ...templates];
      setTemplates(updated);
      await db.set('setup:portfolio_templates', updated);

      window.dispatchEvent(new CustomEvent('kvs-portfolios-updated', { detail: newTemplate }));
      showNotification(`Created new committee portfolio: ${newTemplate.name}`);

      setIsCreateModalOpen(false);
      setNewPortfolioName('');
      setNewPortfolioDesc('');
      setNewPortfolioRespTitle('');
    } catch (err) {
      console.error('Error creating portfolio template:', err);
      showNotification('Failed to create portfolio template.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // Filtered Datasets
  // --------------------------------------------------------------------------
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchCat = categoryFilter === 'ALL' || t.category === categoryFilter;
      const matchSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.responsibilities.some(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [templates, categoryFilter, searchQuery]);

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter(s => {
      const matchStatus = suggestionStatusFilter === 'ALL' || s.status === suggestionStatusFilter;
      const matchSearch =
        s.suggestedTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.suggestedDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.suggestedPortfolioName || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [suggestions, suggestionStatusFilter, searchQuery]);

  const filteredCalendarActivities = useMemo(() => {
    return THEME_CALENDAR_2026_27.filter(a => {
      const matchMonth = selectedCalendarMonth === 'ALL' || a.month === selectedCalendarMonth;
      const matchCat = selectedCalendarCategory === 'ALL' || a.category === selectedCalendarCategory;
      const matchSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.suggestedCommitteeName || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchMonth && matchCat && matchSearch;
    });
  }, [selectedCalendarMonth, selectedCalendarCategory, searchQuery]);

  const pendingRequestsCount = requests.filter(r => r.status === 'Pending').length;
  const pendingSuggestionsCount = suggestions.filter(s => s.status === 'Pending').length;

  if (loading) {
    return (
      <div className="p-12 text-center text-purple-300 flex flex-col items-center justify-center gap-3">
        <RotateCcw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="text-sm font-medium">Loading Institutional Committees & Portfolios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 p-5 rounded-2xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-600/30 border border-purple-500/50 text-purple-300">
              <Briefcase className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 m-0">
              <span>Principal Desk &bull; Vidyalaya Roles, Committees & Calendar 2026-27</span>
              {devMode && <DevModeBadge pages={[3, 4]} title="Principal Committee Governance" />}
            </h2>
          </div>
          <p className="text-xs text-purple-200/80 m-0">
            Configure institutional committees, bulk import/export rosters, assign In-charges and members, edit/delete portfolios, and track deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
            title="Import committees, incharges and members from Excel or CSV"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>

          {/* Export Matrix Button */}
          <button
            onClick={() => exportActiveCommitteesToExcel(templates, assignments)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
            title="Download full committee roster to Excel"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          {/* AI Scan Button */}
          <button
            onClick={handleRunAIDetectionScan}
            disabled={isDetecting}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isDetecting ? 'Scanning...' : 'AI Scan'}</span>
          </button>

          {/* New Committee Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Committee</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold animate-fadeIn ${
            msg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-300'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-1">
          <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center justify-between">
            <span>Committees</span>
            <Briefcase className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-300 font-mono">{templates.length}</div>
          <div className="text-[10px] text-purple-300/70">Official Portfolios</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>In-charges Assigned</span>
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">
            {assignments.filter(a => a.role === 'In-charge' && a.status === 'Active').length}
          </div>
          <div className="text-[10px] text-slate-500">1 Lead per Committee</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1">
          <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
            <span>Active Delegations</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400 font-mono">
            {delegations.filter(d => d.status === 'Active').length}
          </div>
          <div className="text-[10px] text-amber-300/70">Actual Doers Assigned</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/30 space-y-1">
          <div className="text-[10px] font-bold text-sky-300 uppercase tracking-wider flex items-center justify-between">
            <span>Official Activities</span>
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-black text-sky-300 font-mono">{THEME_CALENDAR_2026_27.length}</div>
          <div className="text-[10px] text-sky-300/70">2026-27 KVS Mandates</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
          <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
            <span>AI Suggestions</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-black text-indigo-300 font-mono">{pendingSuggestionsCount}</div>
          <div className="text-[10px] text-indigo-300/70">Living Suggestions</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('committees')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'committees'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Committees Directory ({templates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('theme_calendar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'theme_calendar'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-purple-300" />
          <span>KVS Theme Calendar 2026-27 ({THEME_CALENDAR_2026_27.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('delegations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'delegations'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          <span>Active Delegations ({delegations.filter(d => d.status === 'Active').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'requests'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Faculty Proposals ({pendingRequestsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'suggestions'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Living Suggestions ({pendingSuggestionsCount})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. COMMITTEES DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'committees' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search committee name, category, in-charge, member, or duty..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">Category:</span>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Academic & Administration">Academic & Administration</option>
                <option value="Student Welfare & Safety">Student Welfare & Safety</option>
                <option value="Activities, Clubs & Student Development">Activities & Student Development</option>
                <option value="Maintenance & Infrastructure">Maintenance & Infrastructure</option>
                <option value="Office / Administrative">Office / Administrative</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map(template => {
              const incharge = assignments.find(
                a => a.portfolioTemplateId === template.id && a.role === 'In-charge' && a.status === 'Active'
              );
              const members = assignments.filter(
                a => a.portfolioTemplateId === template.id && a.role === 'Member' && a.status === 'Active'
              );
              const activeDelegations = delegations.filter(
                d => d.portfolioTemplateId === template.id && d.status === 'Active'
              );
              const catColor = CATEGORY_COLORS[template.category] || CATEGORY_COLORS['Other'];

              return (
                <div
                  key={template.id}
                  className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 space-y-4 shadow-lg transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                          {template.category}
                        </span>
                        <h3 className="text-sm font-bold text-white m-0 flex items-center gap-1.5">
                          <span>{template.name}</span>
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        <button
                          onClick={() => handleOpenEditModal(template)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-all cursor-pointer"
                          title="Edit Committee Scope, Members & Duties"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeletePortfolio(template)}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 hover:text-rose-100 text-xs transition-all cursor-pointer"
                          title="Delete this Portfolio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedTemplateForAssign(template);
                            setSelectedRoleType('In-charge');
                            setSelectedTeacherCode(incharge?.teacherEmployeeCode || '');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          {incharge ? 'Change In-charge' : '+ Assign In-charge'}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 m-0 leading-relaxed">
                      {template.description}
                    </p>

                    {/* Committee Members Block */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Primary In-charge (Role):</span>
                        {incharge ? (
                          <strong className="text-white flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                            <span>{incharge.teacherName}</span>
                          </strong>
                        ) : (
                          <span className="text-amber-400 text-[11px] italic font-medium">Unassigned</span>
                        )}
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Committee Members ({members.length}):</span>
                          <button
                            onClick={() => {
                              setSelectedTemplateForAssign(template);
                              setSelectedRoleType('Member');
                              setSelectedTeacherCode('');
                            }}
                            className="text-purple-400 hover:text-purple-300 font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Member</span>
                          </button>
                        </div>

                        {members.length === 0 ? (
                          <div className="text-[11px] text-slate-600 italic">No additional members.</div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {members.map(m => (
                              <span
                                key={m.id}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 group hover:border-slate-700"
                              >
                                <span>{m.teacherName}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(m.id, m.teacherName)}
                                  className="text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                                  title={`Remove ${m.teacherName} from committee`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Responsibilities list */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-300">
                          Official Responsibilities ({template.responsibilities.length}):
                        </span>
                        <button
                          onClick={() => {
                            setSelectedTemplateForDelegation(template);
                            setSelectedRespId(template.responsibilities[0]?.id || '');
                          }}
                          className="text-amber-400 hover:text-amber-300 font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>Delegate Duty</span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        {template.responsibilities.map(resp => {
                          const isDelegated = activeDelegations.find(d => d.responsibilityId === resp.id);

                          return (
                            <div
                              key={resp.id}
                              className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-2"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-medium text-slate-200 truncate flex items-center gap-1.5">
                                  <span>{resp.title}</span>
                                  {resp.isMandatory && (
                                    <span className="text-[9px] font-bold text-rose-400 font-mono">*MANDATORY</span>
                                  )}
                                  {resp.linkedThemeCalendarActivity && (
                                    <span className="text-[9px] font-bold text-sky-400 font-mono flex items-center gap-0.5 bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-500/30">
                                      <Calendar className="w-2.5 h-2.5" />
                                      <span>KVS Calendar</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <span className="font-mono">{resp.frequency}</span>
                                  {resp.suggestedMonths && resp.suggestedMonths.length > 0 && (
                                    <span>&bull; Months: {resp.suggestedMonths.join(', ')}</span>
                                  )}
                                </div>
                              </div>

                              {isDelegated ? (
                                <span className="shrink-0 px-2 py-0.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                                  Delegated: {isDelegated.delegatedToName}
                                </span>
                              ) : (
                                <span className="shrink-0 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-500">
                                  Owned by In-charge
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-slate-800">
                    <span>{template.isCommittee ? 'Institutional Committee' : 'Special Role'}</span>
                    <span>{activeDelegations.length} Active Delegations</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. THEME-WISE CALENDAR 2026-27 (PHASE 6) */}
      {/* ========================================================================= */}
      {activeTab === 'theme_calendar' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/40 shadow-xl space-y-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white m-0">
                Official KVS Monthly Calendar of Activities (Theme-Wise) 2026-27
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200">
              <span className="font-bold text-purple-300">Annual Theme: </span>
              <span className="italic">"{THEME_FOR_THE_YEAR}"</span>
            </div>
            <p className="text-xs text-slate-300 m-0">
              Browse master month-wise mandates from KVS HQs, view mapped committees & in-charges, and adopt calendar deliverables directly into Vidyalaya committee responsibilities.
            </p>
          </div>

          {/* Month & Category Filter Strip */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {(
                [
                  'ALL',
                  'April & May',
                  'June & July',
                  'August',
                  'September',
                  'October',
                  'November',
                  'December',
                  'January',
                  'February',
                  'March'
                ] as const
              ).map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedCalendarMonth(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCalendarMonth === m
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Category:</span>
                <select
                  value={selectedCalendarCategory}
                  onChange={e => setSelectedCalendarCategory(e.target.value as any)}
                  className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Academic Activities">Academic Activities</option>
                  <option value="Examination Activities">Examination Activities</option>
                  <option value="Science, STEM & ATL">Science, STEM & ATL</option>
                  <option value="EBSB, Kala Utsav & Cultural">EBSB, Kala Utsav & Cultural</option>
                  <option value="Games, Sports & Yoga">Games, Sports & Yoga</option>
                  <option value="Scouts & Guides">Scouts & Guides</option>
                  <option value="Vocational & Skill Education">Vocational & Skill (10 Bagless)</option>
                  <option value="Training & CPD">Training & CPD</option>
                  <option value="National & International Days">National & International Days</option>
                </select>
              </div>

              <span className="text-xs text-purple-300 font-mono">
                {filteredCalendarActivities.length} Official Activities Listed
              </span>
            </div>
          </div>

          {/* Activities List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCalendarActivities.map(activity => {
              const targetCommittee = templates.find(t => t.id === activity.suggestedCommitteeId);
              const incharge = assignments.find(
                a => a.portfolioTemplateId === activity.suggestedCommitteeId && a.role === 'In-charge' && a.status === 'Active'
              );

              return (
                <div
                  key={activity.id}
                  className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 space-y-3 shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/40 text-[10px] font-bold text-purple-300 font-mono">
                          {activity.month}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-medium text-slate-300">
                          {activity.category}
                        </span>

                        {activity.dateOrWeek && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-500/30 text-[10px] font-mono text-amber-300">
                            {activity.dateOrWeek}
                          </span>
                        )}
                      </div>

                      {activity.isMandatory && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/40 text-[9px] font-mono font-bold text-rose-300">
                          *MANDATORY
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white m-0 leading-snug">
                      {activity.title}
                    </h4>

                    {activity.description && (
                      <p className="text-xs text-slate-400 leading-relaxed m-0">
                        {activity.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-[10px] text-slate-500 font-medium">Mapped Committee & In-charge:</div>
                      <div className="text-purple-300 font-bold truncate">
                        {targetCommittee ? targetCommittee.name : activity.suggestedCommitteeName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Lead: {incharge ? incharge.teacherName : 'Principal / Unassigned'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAdoptCalendarActivity(activity)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-md shadow-purple-600/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adopt as Duty</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ACTIVE DELEGATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'delegations' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white m-0">
                  Responsibility Delegation Ledger (Ownership vs Actual Doer)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {delegations.filter(d => d.status === 'Active').length} Active Delegations
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold">
                    <th className="py-3 px-4">Responsibility</th>
                    <th className="py-3 px-3">Committee</th>
                    <th className="py-3 px-3">Primary Owner (In-charge)</th>
                    <th className="py-3 px-3">Actual Doer (Delegated To)</th>
                    <th className="py-3 px-3">Delegated By</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {delegations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No active delegations found.
                      </td>
                    </tr>
                  ) : (
                    delegations.map(del => {
                      const template = templates.find(t => t.id === del.portfolioTemplateId);
                      const resp = template?.responsibilities.find(r => r.id === del.responsibilityId);

                      return (
                        <tr key={del.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-bold text-white">{resp?.title || 'Delegated Responsibility'}</div>
                            <div className="text-[11px] text-slate-400">{resp?.frequency || 'Monthly'}</div>
                            {del.notes && <div className="text-[10px] text-amber-300/80 italic mt-0.5">Note: {del.notes}</div>}
                          </td>

                          <td className="py-3 px-3 text-purple-300 font-medium">
                            {template?.name || del.portfolioTemplateId}
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{del.originalOwnerName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">In-charge ({del.originalOwnerEmployeeCode})</div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-amber-300">{del.delegatedToName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Actual Doer ({del.delegatedToEmployeeCode})</div>
                          </td>

                          <td className="py-3 px-3 text-slate-400 text-[11px]">
                            {del.delegatedBy}
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                del.status === 'Active'
                                  ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                                  : del.status === 'Completed'
                                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-400'
                              }`}
                            >
                              {del.status}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            {del.status === 'Active' && (
                              <button
                                onClick={async () => {
                                  const updated = delegations.map(d =>
                                    d.id === del.id ? { ...d, status: 'Withdrawn' as const } : d
                                  );
                                  setDelegations(updated);
                                  await db.set('setup:responsibility_delegations', updated);
                                  showNotification('Delegation recalled to original In-charge.');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-[11px] font-bold cursor-pointer"
                              >
                                Recall Duty
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FACULTY PROPOSALS & REQUESTS */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white m-0">
                  Faculty Responsibility Proposals Awaiting Principal Approval
                </h3>
              </div>
              <span className="text-xs text-sky-300 font-mono font-bold">
                {pendingRequestsCount} Pending Review
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold">
                    <th className="py-3 px-4">Proposed Responsibility</th>
                    <th className="py-3 px-3">Target Committee</th>
                    <th className="py-3 px-3">Proposed By (Faculty)</th>
                    <th className="py-3 px-3">Frequency</th>
                    <th className="py-3 px-3">Submitted On</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No faculty responsibility proposals submitted.
                      </td>
                    </tr>
                  ) : (
                    requests.map(req => {
                      const template = templates.find(t => t.id === req.portfolioTemplateId);

                      return (
                        <tr key={req.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                          <td className="py-3 px-4 max-w-sm">
                            <div className="font-bold text-white text-xs">{req.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{req.description}</div>
                          </td>

                          <td className="py-3 px-3 text-purple-300 font-medium">
                            {template?.name || req.portfolioTemplateId}
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{req.requestedByName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Code: {req.requestedBy}</div>
                          </td>

                          <td className="py-3 px-3 font-mono text-[11px]">
                            {req.suggestedFrequency}
                          </td>

                          <td className="py-3 px-3 text-[11px] text-slate-400">
                            {new Date(req.requestedAt).toLocaleDateString()}
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                req.status === 'Approved'
                                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                                  : req.status === 'Rejected'
                                  ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                                  : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            {req.status === 'Pending' ? (
                              <button
                                onClick={() => {
                                  setSelectedRequestForReview(req);
                                  setReviewAction('Approved');
                                  setPrincipalRemarks('Approved for session inclusion.');
                                }}
                                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] cursor-pointer shadow-xs"
                              >
                                Review / Decide
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500">Decided</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. AI LIVING SUGGESTIONS ENGINE (PHASE 5) */}
      {/* ========================================================================= */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white m-0">
                  AI Living Suggestion Engine &bull; Auto-Learning from Diary Workload
                </h3>
              </div>
              <p className="text-xs text-indigo-200/80 m-0 max-w-2xl leading-relaxed">
                The engine continuously inspects teacher hourly activities, untagged diary entries, and task logs to identify recurring uncodified responsibilities and proposes them for official committee adoption.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunAIDetectionScan}
                disabled={isDetecting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isDetecting ? 'Analyzing Workload...' : 'Run Live Diary Scan'}</span>
              </button>
            </div>
          </div>

          {/* Filter / Status Bar */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">Filter Status:</span>
              {(['ALL', 'Pending', 'Approved', 'Rejected'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setSuggestionStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    suggestionStatusFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <span className="text-xs text-indigo-300 font-mono">
              {filteredSuggestions.length} Pattern(s) Identified
            </span>
          </div>

          {/* Suggestions List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuggestions.length === 0 ? (
              <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2">
                <Sparkles className="w-10 h-10 mx-auto text-indigo-400/60" />
                <div className="font-bold text-slate-400">No suggestions match filter.</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click "Run Live Diary Scan" above to discover unassigned responsibilities from daily teacher workloads.
                </p>
              </div>
            ) : (
              filteredSuggestions.map(sug => {
                const targetPortId = suggestionTargetMap[sug.id] || sug.suggestedPortfolioTemplateId || templates[0]?.id;

                return (
                  <div
                    key={sug.id}
                    className={`bg-slate-900 border rounded-2xl p-5 space-y-4 shadow-lg transition-all flex flex-col justify-between ${
                      sug.status === 'Pending'
                        ? 'border-indigo-500/50 hover:border-indigo-400'
                        : sug.status === 'Approved'
                        ? 'border-emerald-500/40 opacity-90'
                        : 'border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/40 text-[10px] font-bold text-indigo-300 flex items-center gap-1 font-mono">
                              <Sparkles className="w-3 h-3 text-indigo-400" />
                              <span>AI Detected Duty</span>
                            </span>

                            <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/30 text-[10px] font-bold text-purple-300 font-mono">
                              Seen in {sug.evidenceCount} Logs
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white m-0 pt-1">
                            {sug.suggestedTitle}
                          </h3>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            sug.status === 'Approved'
                              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                              : sug.status === 'Rejected'
                              ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                              : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300 animate-pulse'
                          }`}
                        >
                          {sug.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed m-0">
                        {sug.suggestedDescription}
                      </p>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Suggested Frequency:</span>
                          <span className="font-mono font-bold text-purple-300">{sug.suggestedFrequency}</span>
                        </div>

                        {sug.status === 'Pending' ? (
                          <div className="space-y-1 pt-1 border-t border-slate-800">
                            <label className="text-[11px] text-slate-400 font-bold block">Target Committee / Portfolio:</label>
                            <select
                              value={targetPortId}
                              onChange={e => {
                                setSuggestionTargetMap({
                                  ...suggestionTargetMap,
                                  [sug.id]: e.target.value
                                });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white font-bold focus:outline-none focus:border-indigo-500"
                            >
                              {templates.map(t => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                            <span className="text-slate-400 font-medium">Assigned Portfolio:</span>
                            <span className="font-bold text-white">{sug.suggestedPortfolioName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(sug.createdAt).toLocaleDateString()}
                      </span>

                      {sug.status === 'Pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRejectSuggestion(sug.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                          >
                            Dismiss
                          </button>

                          <button
                            onClick={() => handleApproveSuggestion(sug)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Add</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN IN-CHARGE / MEMBER */}
      {/* ========================================================================= */}
      {selectedTemplateForAssign && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                  {selectedRoleType === 'In-charge' ? 'Primary Leadership' : 'Committee Member'}
                </span>
                <h3 className="text-base font-bold text-white m-0">Assign Committee Role</h3>
              </div>
              <button
                onClick={() => setSelectedTemplateForAssign(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Target Committee:</label>
                <input
                  type="text"
                  disabled
                  value={selectedTemplateForAssign.name}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-purple-300 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Role Type:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRoleType('In-charge')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedRoleType === 'In-charge'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Primary In-charge
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRoleType('Member')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedRoleType === 'Member'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Committee Member
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Select Faculty Teacher *</label>
                <select
                  required
                  value={selectedTeacherCode}
                  onChange={e => setSelectedTeacherCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Choose Teacher from Staff Roll --</option>
                  {staffList.map(s => (
                    <option key={s.id || s.employeeCode} value={s.employeeCode}>
                      {s.name} ({s.designation || 'Teacher'} - {s.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Assignment Remarks / Directives:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Designated as lead in-charge for academic session 2026-27..."
                  value={assignmentNotes}
                  onChange={e => setAssignmentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateForAssign(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-purple-600/30"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT COMMITTEE PORTFOLIO & MEMBERS */}
      {/* ========================================================================= */}
      {selectedTemplateForEdit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 space-y-5 shadow-2xl relative my-8 animate-scaleUp max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                  Institutional Governance &bull; Staged Batch Editor
                </span>
                <h3 className="text-base font-bold text-white m-0 flex items-center gap-2">
                  <span>Edit Committee Portfolio, Members & Duties</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedTemplateForEdit(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                title="Discard and close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedPortfolio} className="space-y-5">
              {/* Committee Name */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Committee / Portfolio Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Category & Primary In-charge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category *</label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as PortfolioCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none"
                  >
                    <option value="Academic & Administration">Academic & Administration</option>
                    <option value="Student Welfare & Safety">Student Welfare & Safety</option>
                    <option value="Activities, Clubs & Student Development">Activities & Clubs</option>
                    <option value="Maintenance & Infrastructure">Maintenance & Infrastructure</option>
                    <option value="Office / Administrative">Office / Administrative</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Primary In-charge:</label>
                  <select
                    value={editInchargeCode}
                    onChange={e => setEditInchargeCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-purple-300 font-bold focus:outline-none focus:border-purple-500"
                  >
                    <option value="">-- Unassigned / Select In-charge --</option>
                    {staffList.map(s => (
                      <option key={s.id || s.employeeCode} value={s.employeeCode}>
                        {s.name} ({s.designation || 'Teacher'} - {s.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description & Official Scope */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description & Official Scope *</label>
                <textarea
                  required
                  rows={2}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* -------------------------------------------------------- */}
              {/* SECTION: MULTI-SELECT COMMITTEE MEMBERS */}
              {/* -------------------------------------------------------- */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Manage Committee Members ({editMemberCodes.length} Selected):</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFilteredMembers}
                      className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 cursor-pointer"
                    >
                      Select All Filtered
                    </button>
                    <span className="text-slate-600">&bull;</span>
                    <button
                      type="button"
                      onClick={handleClearAllMembers}
                      className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Selected Member Chips */}
                {editMemberCodes.length > 0 && (
                  <div className="p-2.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {editMemberCodes.map(mCode => {
                      const staff = staffList.find(s => s.employeeCode === mCode);
                      return (
                        <span
                          key={mCode}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-900/60 border border-purple-500/30 text-white text-xs font-medium"
                        >
                          <span>{staff ? staff.name : mCode}</span>
                          <span className="text-[10px] text-purple-300 font-mono">({mCode})</span>
                          <button
                            type="button"
                            onClick={() => handleToggleMember(mCode)}
                            className="text-purple-300 hover:text-white cursor-pointer ml-0.5"
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Search & Multi-Select Faculty List */}
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter teachers by name, subject, designation or code..."
                      value={memberSearchQuery}
                      onChange={e => setMemberSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {filteredStaffForMembers.map(staff => {
                      const isSelected = editMemberCodes.includes(staff.employeeCode);
                      const isIncharge = editInchargeCode === staff.employeeCode;

                      return (
                        <label
                          key={staff.id || staff.employeeCode}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-950/50 border-purple-500/40 text-purple-200'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleMember(staff.employeeCode)}
                              className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                            />
                            <div className="truncate">
                              <span className="font-bold text-white block truncate">{staff.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {staff.designation || 'Teacher'} &bull; {staff.employeeCode}
                              </span>
                            </div>
                          </div>

                          {isIncharge && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded bg-purple-600 text-[9px] font-bold text-white">
                              In-charge
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------- */}
              {/* SECTION: RESPONSIBILITIES & SUBCATEGORIES MANAGEMENT */}
              {/* -------------------------------------------------------- */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-purple-400" />
                    <span>Manage Official Responsibilities ({editResponsibilities.length} Staged):</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Supports Subcategories & Quarterly cycle</span>
                </div>

                {/* List of Staged Responsibilities */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editResponsibilities.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-500 italic text-center">
                      No duties added yet. Use the duty entry form below to add responsibilities and subcategories.
                    </div>
                  ) : (
                    editResponsibilities.map((resp, idx) => (
                      <div
                        key={resp.id || idx}
                        className={`p-3 rounded-2xl border transition-all text-xs space-y-1.5 ${
                          editingRespId === resp.id
                            ? 'bg-purple-950/60 border-purple-500/60 ring-1 ring-purple-500'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-xs">{resp.title}</span>
                              {resp.subCategory && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-900/60 border border-purple-500/30 text-[10px] text-purple-200 font-semibold font-mono">
                                  📁 {resp.subCategory}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 font-mono">
                                ⏱️ {resp.frequency}
                              </span>
                              {resp.isMandatory && (
                                <span className="text-[9px] font-bold text-rose-400 font-mono">*MANDATORY</span>
                              )}
                            </div>

                            {resp.subItems && resp.subItems.length > 0 && (
                              <div className="pl-2 border-l-2 border-purple-500/30 space-y-0.5 mt-1 text-[11px] text-slate-300">
                                {resp.subItems.map((si, sIdx) => (
                                  <div key={si.id || sIdx} className="flex items-center gap-1.5">
                                    <span className="text-purple-400">&bull;</span>
                                    <span>{si.title}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditResp(resp)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 cursor-pointer"
                              title="Edit duty & subcategory"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveResponsibilityInEdit(resp.id)}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 cursor-pointer"
                              title="Remove duty"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Duty & Subcategory Entry Form */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-purple-300 flex items-center justify-between">
                    <span>{editingRespId ? '✏️ Modify Duty & Subcategory' : '➕ Add Official Responsibility & Subcategory'}</span>
                    {editingRespId && (
                      <button
                        type="button"
                        onClick={handleCancelEditResp}
                        className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Duty Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Audit Verification of VVN Accounts..."
                        value={newRespTitle}
                        onChange={e => setNewRespTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Subcategory / Domain (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Pay Bill & TDS, VVN Accounts, Service Book..."
                        value={newRespSubCategory}
                        onChange={e => setNewRespSubCategory(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Frequency Cycle *</label>
                      <select
                        value={newRespFreq}
                        onChange={e => setNewRespFreq(e.target.value as ResponsibilityFrequency)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white font-bold focus:outline-none"
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly (Every 3 Months)</option>
                        <option value="Term">Term (Quarter/Semester)</option>
                        <option value="Annual">Annual (Yearly)</option>
                        <option value="As-needed">As-needed</option>
                        <option value="One-time">One-time</option>
                      </select>
                    </div>

                    <div className="flex items-center pb-2">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRespIsMandatory}
                          onChange={e => setNewRespIsMandatory(e.target.checked)}
                          className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Mandatory institutional duty</span>
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddOrUpdateResponsibilityInEdit}
                        disabled={!newRespTitle.trim()}
                        className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-md"
                      >
                        {editingRespId ? '✓ Update Duty' : '+ Add Duty'}
                      </button>
                    </div>
                  </div>

                  {/* Sub-tasks / Sub-items Builder */}
                  <div className="pt-2 border-t border-slate-900 space-y-2">
                    <label className="text-[11px] font-semibold text-purple-300 block">Sub-tasks / Action Checklist (Optional):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add sub-task (e.g. Generate Form 16 Part A & B)..."
                        value={newSubItemTitle}
                        onChange={e => setNewSubItemTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubItemInEdit();
                          }
                        }}
                        className="flex-1 px-3 py-1 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddSubItemInEdit}
                        disabled={!newSubItemTitle.trim()}
                        className="px-3 py-1 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-500/30 text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        + Sub-task
                      </button>
                    </div>

                    {newRespSubItems.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {newRespSubItems.map((si) => (
                          <span
                            key={si.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
                          >
                            <span>{si.title}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubItemInEdit(si.id)}
                              className="text-slate-500 hover:text-rose-300 cursor-pointer ml-0.5"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeletePortfolio(selectedTemplateForEdit)}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Committee</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplateForEdit(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW COMMITTEE PORTFOLIO */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                  Institutional Governance
                </span>
                <h3 className="text-base font-bold text-white m-0">Create New Committee Portfolio</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPortfolio} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Committee Portfolio Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyber Security & Student Digital Safety Cell"
                  value={newPortfolioName}
                  onChange={e => setNewPortfolioName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category *</label>
                  <select
                    value={newPortfolioCategory}
                    onChange={e => setNewPortfolioCategory(e.target.value as PortfolioCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none"
                  >
                    <option value="Academic & Administration">Academic & Administration</option>
                    <option value="Student Welfare & Safety">Student Welfare & Safety</option>
                    <option value="Activities, Clubs & Student Development">Activities & Clubs</option>
                    <option value="Maintenance & Infrastructure">Maintenance & Infrastructure</option>
                    <option value="Office / Administrative">Office / Administrative</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Primary Duty Frequency *</label>
                  <select
                    value={newPortfolioRespFreq}
                    onChange={e => setNewPortfolioRespFreq(e.target.value as ResponsibilityFrequency)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly (Every 3 Months)</option>
                    <option value="Term">Term (Quarter/Semester)</option>
                    <option value="Annual">Annual (Yearly)</option>
                    <option value="As-needed">As-needed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Committee Description & Scope *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Define official mandate, target outcomes, and administrative responsibilities..."
                  value={newPortfolioDesc}
                  onChange={e => setNewPortfolioDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Core Responsibility Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Conduct monthly cyber hygiene audits & student workshops"
                    value={newPortfolioRespTitle}
                    onChange={e => setNewPortfolioRespTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Subcategory / Domain (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Student Safety, Digital Records..."
                    value={newPortfolioSubCategory}
                    onChange={e => setNewPortfolioSubCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-purple-600/30"
                >
                  Create Committee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
