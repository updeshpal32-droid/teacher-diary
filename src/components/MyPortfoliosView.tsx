import React, { useState, useEffect, useMemo } from 'react';
import {
  PortfolioTemplate,
  PortfolioAssignment,
  ResponsibilityDelegation,
  ResponsibilityRequest,
  PortfolioCategory,
  ResponsibilityFrequency,
  HourlyActivity,
  ThemeCalendarActivity,
  ThemeCalendarMonth
} from '../types/academic';
import { UserAccount } from '../types/auth';
import {
  db,
  DEFAULT_PORTFOLIO_TEMPLATES,
  DEFAULT_PORTFOLIO_ASSIGNMENTS,
  DEFAULT_RESPONSIBILITY_DELEGATIONS,
  DEFAULT_RESPONSIBILITY_REQUESTS,
  THEME_CALENDAR_2026_27,
  THEME_FOR_THE_YEAR
} from '../lib/storage';
import { getTeacherScopedStorageKey } from '../lib/teacherContext';
import { DevModeBadge } from './DevModeBadge';
import {
  Briefcase,
  UserCheck,
  Users,
  ArrowRight,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  X,
  FileText,
  Check,
  Calendar,
  Layers,
  ChevronRight,
  Send,
  ShieldAlert,
  Award,
  CalendarDays,
  CheckSquare
} from 'lucide-react';

interface MyPortfoliosViewProps {
  currentUser?: UserAccount | null;
  devMode?: boolean;
  onNavigateTab?: (tab: string) => void;
}

type SubTab = 'my_roles' | 'memberships' | 'delegated_to_me' | 'calendar_schedule' | 'my_requests';

const CATEGORY_COLORS: Record<PortfolioCategory, { bg: string; text: string; border: string }> = {
  'Academic & Administration': { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-500/40' },
  'Student Welfare & Safety': { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-500/40' },
  'Activities, Clubs & Student Development': { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  'Maintenance & Infrastructure': { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-500/40' },
  'Office / Administrative': { bg: 'bg-sky-950/40', text: 'text-sky-300', border: 'border-sky-500/40' },
  'Other': { bg: 'bg-slate-950/40', text: 'text-slate-300', border: 'border-slate-700' }
};

export const MyPortfoliosView: React.FC<MyPortfoliosViewProps> = ({
  currentUser,
  devMode,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<SubTab>('my_roles');
  const [templates, setTemplates] = useState<PortfolioTemplate[]>([]);
  const [assignments, setAssignments] = useState<PortfolioAssignment[]>([]);
  const [delegations, setDelegations] = useState<ResponsibilityDelegation[]>([]);
  const [requests, setRequests] = useState<ResponsibilityRequest[]>([]);
  const [activities, setActivities] = useState<HourlyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Theme Calendar Month Filter
  const [calendarMonthFilter, setCalendarMonthFilter] = useState<'ALL' | ThemeCalendarMonth>('ALL');

  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedPortfolioForRequest, setSelectedPortfolioForRequest] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDesc, setRequestDesc] = useState('');
  const [requestFrequency, setRequestFrequency] = useState<ResponsibilityFrequency>('Monthly');

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const teacherCode = currentUser?.employeeCode || '108894';
  const teacherName = currentUser?.name || 'Faculty Member';

  useEffect(() => {
    loadAllData();

    const handlePortfolioUpdate = () => {
      loadAllData();
    };

    window.addEventListener('kvs-portfolios-updated', handlePortfolioUpdate);
    return () => {
      window.removeEventListener('kvs-portfolios-updated', handlePortfolioUpdate);
    };
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const teacherCode = currentUser?.employeeCode;
      const scopedActKey = teacherCode ? getTeacherScopedStorageKey('setup:hourly_activities', teacherCode) : 'setup:hourly_activities';

      const [tData, aData, dData, rData, scopedActs, defaultActs] = await Promise.all([
        db.get<PortfolioTemplate[]>('setup:portfolio_templates'),
        db.get<PortfolioAssignment[]>('setup:portfolio_assignments'),
        db.get<ResponsibilityDelegation[]>('setup:responsibility_delegations'),
        db.get<ResponsibilityRequest[]>('setup:responsibility_requests'),
        db.get<HourlyActivity[]>(scopedActKey),
        db.get<HourlyActivity[]>('setup:hourly_activities')
      ]);

      setTemplates(tData && tData.length > 0 ? tData : DEFAULT_PORTFOLIO_TEMPLATES);
      setAssignments(aData && aData.length > 0 ? aData : DEFAULT_PORTFOLIO_ASSIGNMENTS);
      setDelegations(dData && dData.length > 0 ? dData : DEFAULT_RESPONSIBILITY_DELEGATIONS);
      setRequests(rData && rData.length > 0 ? rData : DEFAULT_RESPONSIBILITY_REQUESTS);
      setActivities(scopedActs && scopedActs.length > 0 ? scopedActs : defaultActs || []);
    } catch (err) {
      console.error('Error loading my portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  // Helper: Calculate Logged Hours for a Portfolio
  const getHoursForPortfolio = (portId: string) => {
    const matching = activities.filter(a => a.portfolioTemplateId === portId);
    return matching.reduce((sum, a) => {
      const [startH, startM] = (a.startTime || '09:00').split(':').map(Number);
      const [endH, endM] = (a.endTime || '10:00').split(':').map(Number);
      let d = (endH * 60 + endM - (startH * 60 + startM)) / 60;
      return sum + (d > 0 ? d : 1);
    }, 0);
  };

  // Helper: Calculate Logged Hours for a Specific Responsibility
  const getHoursForResponsibility = (respId: string) => {
    const matching = activities.filter(a => a.responsibilityId === respId);
    return matching.reduce((sum, a) => {
      const [startH, startM] = (a.startTime || '09:00').split(':').map(Number);
      const [endH, endM] = (a.endTime || '10:00').split(':').map(Number);
      let d = (endH * 60 + endM - (startH * 60 + startM)) / 60;
      return sum + (d > 0 ? d : 1);
    }, 0);
  };

  // --------------------------------------------------------------------------
  // Filtered Datasets for Current Teacher
  // --------------------------------------------------------------------------

  // 1. My In-charge Portfolios (Primary Owner)
  const myInchargeAssignments = useMemo(() => {
    const cleanU = (teacherName || '').toLowerCase().replace(/^(mr|mrs|ms|dr|smt|shri)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');

    return assignments.filter(a => {
      if (a.role !== 'In-charge' || a.status !== 'Active') return false;
      if (teacherCode && a.teacherEmployeeCode && a.teacherEmployeeCode.toLowerCase() === teacherCode.toLowerCase()) return true;
      const cleanA = (a.teacherName || '').toLowerCase().replace(/^(mr|mrs|ms|dr|smt|shri)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');
      return cleanU && cleanA && (cleanU === cleanA || cleanU.includes(cleanA) || cleanA.includes(cleanU));
    });
  }, [assignments, teacherCode, teacherName]);

  const myInchargeTemplates = useMemo(() => {
    return templates.filter(t => myInchargeAssignments.some(a => a.portfolioTemplateId === t.id));
  }, [templates, myInchargeAssignments]);

  // 2. My Committee Memberships
  const myMemberAssignments = useMemo(() => {
    const cleanU = (teacherName || '').toLowerCase().replace(/^(mr|mrs|ms|dr|smt|shri)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');

    return assignments.filter(a => {
      if (a.role !== 'Member' || a.status !== 'Active') return false;
      if (teacherCode && a.teacherEmployeeCode && a.teacherEmployeeCode.toLowerCase() === teacherCode.toLowerCase()) return true;
      const cleanA = (a.teacherName || '').toLowerCase().replace(/^(mr|mrs|ms|dr|smt|shri)\.?\s+/i, '').replace(/[^a-z0-9]/g, '');
      return cleanU && cleanA && (cleanU === cleanA || cleanU.includes(cleanA) || cleanA.includes(cleanU));
    });
  }, [assignments, teacherCode, teacherName]);

  const myMemberTemplates = useMemo(() => {
    return templates.filter(t => myMemberAssignments.some(a => a.portfolioTemplateId === t.id));
  }, [templates, myMemberAssignments]);

  // Combined list of portfolios teacher belongs to (eligible for submitting requests & calendar tracking)
  const myEligiblePortfolios = useMemo(() => {
    const combinedIds = new Set([
      ...myInchargeAssignments.map(a => a.portfolioTemplateId),
      ...myMemberAssignments.map(a => a.portfolioTemplateId)
    ]);
    return templates.filter(t => combinedIds.has(t.id));
  }, [templates, myInchargeAssignments, myMemberAssignments]);

  // 3. Responsibilities Delegated to Me (Actual Doer)
  const myDelegatedTasks = useMemo(() => {
    return delegations.filter(
      d =>
        d.delegatedToEmployeeCode === teacherCode ||
        d.delegatedToName.toLowerCase().includes(teacherName.toLowerCase())
    );
  }, [delegations, teacherCode, teacherName]);

  // 4. My Responsibility Requests
  const myRequests = useMemo(() => {
    return requests.filter(
      r =>
        r.requestedBy === teacherCode ||
        r.requestedByName.toLowerCase().includes(teacherName.toLowerCase())
    );
  }, [requests, teacherCode, teacherName]);

  // 5. Official KVS 2026-27 Theme Calendar Activities for Teacher's Committees (Phase 6)
  const myCalendarActivities = useMemo(() => {
    const myPortIds = new Set(myEligiblePortfolios.map(p => p.id));
    return THEME_CALENDAR_2026_27.filter(
      a =>
        (a.suggestedCommitteeId && myPortIds.has(a.suggestedCommitteeId)) &&
        (calendarMonthFilter === 'ALL' || a.month === calendarMonthFilter)
    );
  }, [myEligiblePortfolios, calendarMonthFilter]);

  // --------------------------------------------------------------------------
  // ACTION: Submit New Responsibility Proposal / Request
  // --------------------------------------------------------------------------
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolioForRequest || !requestTitle.trim() || !requestDesc.trim()) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      const newReq: ResponsibilityRequest = {
        id: `req-${Date.now().toString().slice(-5)}`,
        portfolioTemplateId: selectedPortfolioForRequest,
        requestedBy: teacherCode,
        requestedByName: teacherName,
        title: requestTitle.trim(),
        description: requestDesc.trim(),
        suggestedFrequency: requestFrequency,
        status: 'Pending',
        requestedAt: new Date().toISOString()
      };

      const updatedRequests = [newReq, ...requests];
      setRequests(updatedRequests);
      await db.set('setup:responsibility_requests', updatedRequests);

      window.dispatchEvent(new CustomEvent('kvs-portfolios-updated', { detail: newReq }));
      showNotification('Responsibility proposal submitted for Principal approval!');

      setIsRequestModalOpen(false);
      setSelectedPortfolioForRequest('');
      setRequestTitle('');
      setRequestDesc('');
    } catch (err) {
      console.error('Error submitting responsibility request:', err);
      showNotification('Failed to submit request.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // ACTION: Acknowledge or Complete Delegated Responsibility
  // --------------------------------------------------------------------------
  const handleAcknowledgeDelegation = async (delegationId: string) => {
    try {
      const updated = delegations.map(d =>
        d.id === delegationId ? { ...d, notes: `${d.notes || ''} [Acknowledged by ${teacherName}]`.trim() } : d
      );
      setDelegations(updated);
      await db.set('setup:responsibility_delegations', updated);
      window.dispatchEvent(new CustomEvent('kvs-portfolios-updated'));
      showNotification('Delegated responsibility acknowledged.');
    } catch (err) {
      console.error('Error acknowledging delegation:', err);
      showNotification('Failed to update delegation.', 'error');
    }
  };

  const handleMarkDelegationCompleted = async (delegationId: string) => {
    try {
      const updated = delegations.map(d =>
        d.id === delegationId ? { ...d, status: 'Completed' as const } : d
      );
      setDelegations(updated);
      await db.set('setup:responsibility_delegations', updated);
      window.dispatchEvent(new CustomEvent('kvs-portfolios-updated'));
      showNotification('Marked delegated responsibility as Completed!');
    } catch (err) {
      console.error('Error completing delegation:', err);
      showNotification('Failed to mark completed.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-purple-300 flex flex-col items-center justify-center gap-3">
        <RotateCcw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="text-sm font-medium">Loading your Vidyalaya roles & assigned duties...</span>
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
              <Award className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 m-0">
              <span>My Institutional Roles, Committees & Calendar Deliverables</span>
              {devMode && <DevModeBadge pages={[3, 4]} title="Teacher Portfolio & Duties Ledger" />}
            </h2>
          </div>
          <p className="text-xs text-purple-200/80 m-0">
            View your primary In-charge committees (ownership), committee memberships, responsibilities delegated to you as actual doer, and KVS 2026-27 theme calendar mandates.
          </p>
        </div>

        {myEligiblePortfolios.length > 0 && (
          <button
            onClick={() => {
              setSelectedPortfolioForRequest(myEligiblePortfolios[0]?.id || '');
              setIsRequestModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 self-start lg:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Propose New Responsibility</span>
          </button>
        )}
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

      {/* Teacher Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-1">
          <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center justify-between">
            <span>Primary In-charge</span>
            <UserCheck className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-300 font-mono">{myInchargeTemplates.length}</div>
          <div className="text-[10px] text-purple-300/70">Committees Led by Me</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Committee Member</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">{myMemberTemplates.length}</div>
          <div className="text-[10px] text-slate-500">Active Memberships</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1">
          <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
            <span>Delegated to Me</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400 font-mono">
            {myDelegatedTasks.filter(d => d.status === 'Active').length}
          </div>
          <div className="text-[10px] text-amber-300/70">Actual Doer Duties</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/30 space-y-1">
          <div className="text-[10px] font-bold text-sky-300 uppercase tracking-wider flex items-center justify-between">
            <span>Calendar Mandates</span>
            <CalendarDays className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-black text-sky-300 font-mono">{myCalendarActivities.length}</div>
          <div className="text-[10px] text-sky-300/70">2026-27 KVS Tasks</div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('my_roles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'my_roles'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>My Primary Roles ({myInchargeTemplates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('memberships')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'memberships'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>My Memberships ({myMemberTemplates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('delegated_to_me')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'delegated_to_me'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          <span>Delegated to Me ({myDelegatedTasks.filter(d => d.status === 'Active').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar_schedule')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'calendar_schedule'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-purple-300" />
          <span>KVS 2026-27 Schedule ({myCalendarActivities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('my_requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'my_requests'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>My Proposals ({myRequests.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. MY PRIMARY ROLES (IN-CHARGE - OWNERSHIP) */}
      {/* ========================================================================= */}
      {activeTab === 'my_roles' && (
        <div className="space-y-4">
          {myInchargeTemplates.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2">
              <UserCheck className="w-10 h-10 mx-auto text-slate-600" />
              <div className="font-bold text-slate-400">No In-charge portfolios assigned yet.</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Official In-charge portfolios are designated by the Principal. When assigned, your responsibilities, logged workload, and delegations will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myInchargeTemplates.map(template => {
                const catColor = CATEGORY_COLORS[template.category] || CATEGORY_COLORS['Other'];
                const myAsgn = myInchargeAssignments.find(a => a.portfolioTemplateId === template.id);
                const committeeMembers = assignments.filter(
                  a => a.portfolioTemplateId === template.id && a.role === 'Member' && a.status === 'Active'
                );
                const activeDelegations = delegations.filter(
                  d => d.portfolioTemplateId === template.id && d.status === 'Active'
                );
                const portHours = getHoursForPortfolio(template.id);

                return (
                  <div
                    key={template.id}
                    className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                            {template.category}
                          </span>
                          <h3 className="text-sm font-bold text-white m-0">
                            {template.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {portHours > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                              ⏱️ {portHours.toFixed(1)}h logged
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-300 text-[10px] font-bold font-mono uppercase">
                            Primary In-charge
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 m-0 leading-relaxed">
                        {template.description}
                      </p>

                      {/* Committee Members list */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Committee Members ({committeeMembers.length}):
                        </div>
                        {committeeMembers.length === 0 ? (
                          <div className="text-[11px] text-slate-600 italic">No additional members assigned.</div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {committeeMembers.map(m => (
                              <span
                                key={m.id}
                                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
                              >
                                {m.teacherName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Responsibilities list */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300">
                            Portfolio Responsibilities ({template.responsibilities.length}):
                          </span>
                          <button
                            onClick={() => {
                              setSelectedPortfolioForRequest(template.id);
                              setIsRequestModalOpen(true);
                            }}
                            className="text-purple-400 hover:text-purple-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Propose Addition</span>
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {template.responsibilities.map(resp => {
                            const isDelegated = activeDelegations.find(d => d.responsibilityId === resp.id);
                            const respHours = getHoursForResponsibility(resp.id);

                            return (
                              <div
                                key={resp.id}
                                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="space-y-0.5 min-w-0">
                                  <div className="font-medium text-slate-200 truncate flex items-center gap-1.5 flex-wrap">
                                    <span>{resp.title}</span>
                                    {resp.subCategory && (
                                      <span className="text-[9px] font-bold text-purple-300 font-mono bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/30">
                                        📁 {resp.subCategory}
                                      </span>
                                    )}
                                    {resp.isMandatory && (
                                      <span className="text-[9px] font-bold text-rose-400 font-mono">*MANDATORY</span>
                                    )}
                                    {resp.linkedThemeCalendarActivity && (
                                      <span className="text-[9px] font-bold text-sky-400 font-mono flex items-center gap-0.5 bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-500/30">
                                        <Calendar className="w-2.5 h-2.5" />
                                        <span>KVS 2026-27</span>
                                      </span>
                                    )}
                                    {respHours > 0 && (
                                      <span className="text-[9px] font-bold text-emerald-400 font-mono bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                        ⏱️ {respHours.toFixed(1)}h
                                      </span>
                                    )}
                                  </div>
                                  {resp.subItems && resp.subItems.length > 0 && (
                                    <div className="text-[10px] text-slate-300 pl-2 border-l border-purple-500/30 space-y-0.5 my-1">
                                      {resp.subItems.map((si, sIdx) => (
                                        <div key={si.id || sIdx} className="flex items-center gap-1">
                                          <span className="text-purple-400">&bull;</span>
                                          <span>{si.title}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
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
                                  <span className="shrink-0 px-2 py-0.5 rounded-lg bg-purple-950/60 border border-purple-500/30 text-[10px] font-bold text-purple-300">
                                    Owned by You
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-slate-800">
                      <span>Assigned by {myAsgn?.assignedBy || 'Principal'}</span>
                      <span>{activeDelegations.length} Active Delegations</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MY COMMITTEE MEMBERSHIPS */}
      {/* ========================================================================= */}
      {activeTab === 'memberships' && (
        <div className="space-y-4">
          {myMemberTemplates.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-600" />
              <div className="font-bold text-slate-400">No committee memberships found.</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When you are added as a committee member by the Principal, the committee details and lead In-charge will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myMemberTemplates.map(template => {
                const catColor = CATEGORY_COLORS[template.category] || CATEGORY_COLORS['Other'];
                const incharge = assignments.find(
                  a => a.portfolioTemplateId === template.id && a.role === 'In-charge' && a.status === 'Active'
                );
                const portHours = getHoursForPortfolio(template.id);

                return (
                  <div
                    key={template.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                            {template.category}
                          </span>
                          <h3 className="text-sm font-bold text-white m-0">
                            {template.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {portHours > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                              ⏱️ {portHours.toFixed(1)}h logged
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold font-mono uppercase">
                            Committee Member
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 m-0 leading-relaxed">
                        {template.description}
                      </p>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                        <span className="text-slate-400">Committee In-charge (Lead):</span>
                        <strong className="text-purple-300">{incharge ? incharge.teacherName : 'Principal I/c'}</strong>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300">Committee Responsibilities:</span>
                          <button
                            onClick={() => {
                              setSelectedPortfolioForRequest(template.id);
                              setIsRequestModalOpen(true);
                            }}
                            className="text-purple-400 hover:text-purple-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Propose Addition</span>
                          </button>
                        </div>

                        <div className="space-y-1">
                          {template.responsibilities.map(r => {
                            const respHours = getHoursForResponsibility(r.id);
                            return (
                              <div
                                key={r.id}
                                className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-medium text-slate-200">{r.title}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.frequency}</div>
                                </div>
                                {respHours > 0 && (
                                  <span className="text-[9px] font-bold text-emerald-400 font-mono bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                    ⏱️ {respHours.toFixed(1)}h
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RESPONSIBILITIES DELEGATED TO ME (ACTUAL DOER) */}
      {/* ========================================================================= */}
      {activeTab === 'delegated_to_me' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white m-0">
                  Responsibilities Delegated to Me (Actual Doer Ledger)
                </h3>
              </div>
              <span className="text-xs text-amber-300 font-mono font-bold">
                {myDelegatedTasks.filter(d => d.status === 'Active').length} Active Duties
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold">
                    <th className="py-3 px-4">Delegated Responsibility</th>
                    <th className="py-3 px-3">Committee</th>
                    <th className="py-3 px-3">Primary Owner (In-charge)</th>
                    <th className="py-3 px-3">Logged Workload</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {myDelegatedTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No responsibilities have been delegated to you.
                      </td>
                    </tr>
                  ) : (
                    myDelegatedTasks.map(del => {
                      const template = templates.find(t => t.id === del.portfolioTemplateId);
                      const resp = template?.responsibilities.find(r => r.id === del.responsibilityId);
                      const respHours = resp ? getHoursForResponsibility(resp.id) : 0;

                      return (
                        <tr key={del.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                          <td className="py-3 px-4 max-w-sm">
                            <div className="font-bold text-white text-xs">{resp?.title || 'Delegated Duty'}</div>
                            <div className="text-[11px] text-amber-300 font-mono">Frequency: {resp?.frequency || 'Monthly'}</div>
                            {del.notes && (
                              <div className="text-[10px] text-slate-400 mt-1 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                Instructions: {del.notes}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 text-purple-300 font-medium">
                            {template?.name || del.portfolioTemplateId}
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{del.originalOwnerName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">In-charge ({del.originalOwnerEmployeeCode})</div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/30 text-[10px] font-mono text-purple-300">
                              ⏱️ {respHours.toFixed(1)} hrs
                            </span>
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
                            {del.status === 'Active' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleAcknowledgeDelegation(del.id)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer transition-colors"
                                  title="Acknowledge Receipt"
                                >
                                  Acknowledge
                                </button>

                                <button
                                  onClick={() => handleMarkDelegationCompleted(del.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
                                  title="Mark Completed"
                                >
                                  Mark Completed
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-emerald-400 font-bold font-mono">✓ Finished</span>
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
      {/* 4. KVS THEME CALENDAR 2026-27 SCHEDULE (PHASE 6) */}
      {/* ========================================================================= */}
      {activeTab === 'calendar_schedule' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white m-0">
                  Official KVS Theme Calendar Deliverables for My Committees
                </h3>
              </div>
              <span className="text-xs text-purple-300 font-mono font-bold">
                {myCalendarActivities.length} Assigned Mandates
              </span>
            </div>
            <div className="text-xs text-slate-300 italic">
              Annual KVS Theme: "{THEME_FOR_THE_YEAR}"
            </div>
          </div>

          {/* Month Filter */}
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
                onClick={() => setCalendarMonthFilter(m)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  calendarMonthFilter === m
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myCalendarActivities.length === 0 ? (
              <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                No official calendar mandates match the selected month for your assigned committees.
              </div>
            ) : (
              myCalendarActivities.map(act => (
                <div
                  key={act.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/40 text-[10px] font-bold text-purple-300 font-mono">
                        {act.month}
                      </span>

                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-400">
                        {act.category}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white m-0 leading-snug">{act.title}</h4>
                    {act.description && <p className="text-[11px] text-slate-400 m-0">{act.description}</p>}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-purple-300">
                    <span>Target: {act.suggestedCommitteeName}</span>
                    {act.dateOrWeek && <span className="font-mono text-amber-300">{act.dateOrWeek}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MY RESPONSIBILITY REQUESTS & PROPOSALS */}
      {/* ========================================================================= */}
      {activeTab === 'my_requests' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white m-0">
                  My Responsibility Proposals Submitted to Principal
                </h3>
              </div>

              {myEligiblePortfolios.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedPortfolioForRequest(myEligiblePortfolios[0]?.id || '');
                    setIsRequestModalOpen(true);
                  }}
                  className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Proposal</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold">
                    <th className="py-3 px-4">Proposed Responsibility</th>
                    <th className="py-3 px-3">Target Committee</th>
                    <th className="py-3 px-3">Frequency</th>
                    <th className="py-3 px-3">Submitted On</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Principal Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {myRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        You have not submitted any responsibility proposals.
                      </td>
                    </tr>
                  ) : (
                    myRequests.map(req => {
                      const template = templates.find(t => t.id === req.portfolioTemplateId);

                      return (
                        <tr key={req.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                          <td className="py-3 px-4 max-w-sm">
                            <div className="font-bold text-white text-xs">{req.title}</div>
                            <div className="text-[11px] text-slate-400">{req.description}</div>
                          </td>

                          <td className="py-3 px-3 text-purple-300 font-medium">
                            {template?.name || req.portfolioTemplateId}
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

                          <td className="py-3 px-3 text-[11px]">
                            {req.principalRemarks ? (
                              <span className="text-emerald-300 font-medium">{req.principalRemarks}</span>
                            ) : (
                              <span className="text-slate-600 italic">Awaiting Principal Review</span>
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
      {/* MODAL: PROPOSE / REQUEST NEW RESPONSIBILITY */}
      {/* ========================================================================= */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                  Faculty Proposal
                </span>
                <h3 className="text-base font-bold text-white m-0">Propose New Committee Responsibility</h3>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Target Committee / Portfolio *</label>
                <select
                  required
                  value={selectedPortfolioForRequest}
                  onChange={e => setSelectedPortfolioForRequest(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
                >
                  {myEligiblePortfolios.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Only committees where you are an In-charge or Active Member are listed.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Responsibility Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conduct Inter-House Quiz on National Science Day"
                  value={requestTitle}
                  onChange={e => setRequestTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Suggested Frequency *</label>
                <select
                  value={requestFrequency}
                  onChange={e => setRequestFrequency(e.target.value as ResponsibilityFrequency)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Term">Term</option>
                  <option value="Annual">Annual</option>
                  <option value="As-needed">As-needed</option>
                  <option value="One-time">One-time</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Detailed Description & Justification *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why this responsibility should be added to the portfolio, targeted classes, and expected outcomes..."
                  value={requestDesc}
                  onChange={e => setRequestDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Proposal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
