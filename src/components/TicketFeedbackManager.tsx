import React, { useState, useEffect, useMemo } from 'react';
import {
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketEvidence
} from '../types/academic';
import { UserAccount } from '../types/auth';
import { db, DEFAULT_TICKETS } from '../lib/storage';
import { RaiseTicketModal } from './RaiseTicketModal';
import * as XLSX from 'xlsx';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  FileText,
  Paperclip,
  Eye,
  Download,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  Sparkles,
  MessageSquare,
  Bug,
  Lightbulb,
  Layout,
  Database,
  X,
  ExternalLink,
  Users,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { DevModeBadge } from './DevModeBadge';

interface TicketFeedbackManagerProps {
  devMode?: boolean;
  currentUser?: UserAccount | null;
  currentTab?: string;
  onNavigateTab?: (tab: string) => void;
  theme?: 'dark' | 'light';
}

type SubTab = 'my_tickets' | 'admin_desk';

const CATEGORY_ICONS: Record<TicketCategory, { icon: any; color: string; bg: string; border: string }> = {
  'Bug / Glitch': { icon: Bug, color: 'text-rose-400', bg: 'bg-rose-950/40', border: 'border-rose-500/40' },
  'Feature Request': { icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-500/40' },
  'Feedback': { icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-500/40' },
  'UI/UX Issue': { icon: Layout, color: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-500/40' },
  'Data Issue': { icon: Database, color: 'text-indigo-400', bg: 'bg-indigo-950/40', border: 'border-indigo-500/40' },
  'Other': { icon: HelpCircle, color: 'text-slate-400', bg: 'bg-slate-950/40', border: 'border-slate-700' }
};

const PRIORITY_BADGES: Record<TicketPriority, { color: string; bg: string; border: string; label: string }> = {
  Low: { color: 'text-slate-300', bg: 'bg-slate-800', border: 'border-slate-700', label: 'Low' },
  Medium: { color: 'text-sky-300', bg: 'bg-sky-950/80', border: 'border-sky-500/40', label: 'Medium' },
  High: { color: 'text-amber-300', bg: 'bg-amber-950/80', border: 'border-amber-500/40', label: 'High' },
  Critical: { color: 'text-rose-300', bg: 'bg-rose-950/80', border: 'border-rose-500/50', label: 'Critical' }
};

const STATUS_BADGES: Record<TicketStatus, { color: string; bg: string; border: string; label: string }> = {
  Open: { color: 'text-emerald-300', bg: 'bg-emerald-950/80', border: 'border-emerald-500/40', label: 'Open' },
  'In Progress': { color: 'text-amber-300', bg: 'bg-amber-950/80', border: 'border-amber-500/40', label: 'In Progress' },
  Resolved: { color: 'text-purple-300', bg: 'bg-purple-950/80', border: 'border-purple-500/40', label: 'Resolved' },
  Closed: { color: 'text-slate-400', bg: 'bg-slate-950', border: 'border-slate-800', label: 'Closed' }
};

export const TicketFeedbackManager: React.FC<TicketFeedbackManagerProps> = ({
  devMode,
  currentUser,
  currentTab,
  onNavigateTab,
  theme = 'dark'
}) => {
  const isDark = theme !== 'light';
  const isPrincipalOrAdmin = currentUser?.role === 'admin' || currentUser?.activePersona === 'admin';
  const isDataEntryManager = currentUser?.role === 'data_entry_manager' || currentUser?.activePersona === 'data_entry_manager';
  const canManageAllTickets = isPrincipalOrAdmin || isDataEntryManager;

  const [activeTab, setActiveTab] = useState<SubTab>(canManageAllTickets ? 'admin_desk' : 'my_tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TicketCategory>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TicketPriority>('ALL');

  // Modal States
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<Ticket | null>(null);
  const [selectedTicketForManage, setSelectedTicketForManage] = useState<Ticket | null>(null);

  // Manage Ticket Form State
  const [manageStatus, setManageStatus] = useState<TicketStatus>('Open');
  const [manageAssignedTo, setManageAssignedTo] = useState<string>('');
  const [manageRemarks, setManageRemarks] = useState<string>('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewEvidence, setPreviewEvidence] = useState<TicketEvidence | null>(null);

  useEffect(() => {
    loadTickets();

    const handleTicketsUpdated = () => {
      loadTickets();
    };

    window.addEventListener('kvs-tickets-updated', handleTicketsUpdated);
    return () => {
      window.removeEventListener('kvs-tickets-updated', handleTicketsUpdated);
    };
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const storedTickets = await db.get<Ticket[]>('setup:tickets');
      setTickets(storedTickets && storedTickets.length > 0 ? storedTickets : DEFAULT_TICKETS);
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  // Open Admin Management Modal for a ticket
  const handleOpenManageModal = (ticket: Ticket) => {
    setSelectedTicketForManage(ticket);
    setManageStatus(ticket.status);
    setManageAssignedTo(ticket.assignedToName || ticket.assignedTo || '');
    setManageRemarks(ticket.principalOrDevRemarks || '');
  };

  // Save Ticket Updates (Admin / Principal)
  const handleSaveTicketManagement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForManage) return;

    try {
      const isNowResolved = manageStatus === 'Resolved' && selectedTicketForManage.status !== 'Resolved';
      const updatedTicket: Ticket = {
        ...selectedTicketForManage,
        status: manageStatus,
        assignedTo: manageAssignedTo ? manageAssignedTo.toLowerCase().replace(/\\s+/g, '_') : undefined,
        assignedToName: manageAssignedTo.trim() || undefined,
        principalOrDevRemarks: manageRemarks.trim() || undefined,
        resolvedAt: isNowResolved ? new Date().toISOString() : selectedTicketForManage.resolvedAt,
        updatedAt: new Date().toISOString()
      };

      const updatedList = tickets.map(t => (t.id === updatedTicket.id ? updatedTicket : t));
      setTickets(updatedList);
      await db.set('setup:tickets', updatedList);

      window.dispatchEvent(new CustomEvent('kvs-tickets-updated', { detail: updatedTicket }));
      showFeedback(`Ticket #${selectedTicketForManage.id} updated successfully!`);
      setSelectedTicketForManage(null);
    } catch (err) {
      console.error('Error saving ticket updates:', err);
      showFeedback('Failed to update ticket.', 'error');
    }
  };

  // Filtered tickets based on active tab and search criteria
  const userTickets = useMemo(() => {
    const userCode = currentUser?.employeeCode || currentUser?.id || '108894';
    const userName = currentUser?.name || '';

    return tickets.filter(t => {
      const matchUser =
        t.raisedBy === userCode ||
        (userName && t.raisedByName && t.raisedByName.toLowerCase().includes(userName.toLowerCase()));
      return matchUser;
    });
  }, [tickets, currentUser]);

  const activeTicketsList = activeTab === 'my_tickets' ? userTickets : tickets;

  const filteredTickets = useMemo(() => {
    return activeTicketsList.filter(t => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.moduleOrPage && t.moduleOrPage.toLowerCase().includes(q)) ||
        t.raisedByName.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

      return matchSearch && matchStatus && matchCategory && matchPriority;
    });
  }, [activeTicketsList, searchQuery, statusFilter, categoryFilter, priorityFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const list = activeTab === 'my_tickets' ? userTickets : tickets;
    const total = list.length;
    const open = list.filter(t => t.status === 'Open').length;
    const inProgress = list.filter(t => t.status === 'In Progress').length;
    const resolved = list.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
    const critical = list.filter(t => t.priority === 'Critical' && t.status !== 'Closed').length;

    return { total, open, inProgress, resolved, critical };
  }, [tickets, userTickets, activeTab]);

  // Export Tickets to Excel
  const handleExportTicketsToExcel = () => {
    const wb = XLSX.utils.book_new();
    const data: any[][] = [];

    data.push(['KENDRIYA VIDYALAYA KUTRA - FEEDBACK & SYSTEM TICKETS REPORT']);
    data.push([`Generated On: ${new Date().toLocaleString()}`, '', '', '', '', '', '', '', '']);
    data.push(['']);

    data.push([
      'Ticket ID',
      'Title',
      'Category',
      'Priority',
      'Module / Page',
      'Status',
      'Raised By',
      'Raised Date',
      'Assigned To',
      'Principal / Dev Remarks',
      'Resolved Date'
    ]);

    for (const t of filteredTickets) {
      data.push([
        t.id,
        t.title,
        t.category,
        t.priority,
        t.moduleOrPage || 'General',
        t.status,
        `${t.raisedByName} (${t.raisedBy})`,
        new Date(t.raisedAt).toLocaleDateString(),
        t.assignedToName || 'Unassigned',
        t.principalOrDevRemarks || 'None',
        t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString() : 'Pending'
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets Report');
    XLSX.writeFile(wb, `KVS_Tickets_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    showFeedback('Exported tickets list to Excel (.xlsx) successfully!');
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-purple-300 flex flex-col items-center justify-center gap-3">
        <RotateCcw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="text-sm font-medium">Loading Feedback & Tickets System...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner & Header */}
      <div className={`p-5 rounded-2xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 border transition-all ${
        isDark
          ? 'bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-purple-500/30 text-white'
          : 'bg-gradient-to-r from-purple-100 via-white to-indigo-100 border-purple-200 text-slate-900 shadow-slate-200/50'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl border ${
              isDark ? 'bg-purple-600/30 border-purple-500/50 text-purple-300' : 'bg-purple-100 border-purple-300 text-purple-700'
            }`}>
              <HelpCircle className="w-5 h-5" />
            </span>
            <h2 className={`text-xl font-black tracking-tight flex items-center gap-2 m-0 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <span>Ticket Raise & Feedback Desk</span>
              {devMode && <DevModeBadge pages={[1, 52]} title="User Feedback & Bug Tracking System" />}
            </h2>
          </div>
          <p className={`text-xs m-0 ${isDark ? 'text-purple-200/80' : 'text-slate-600'}`}>
            Direct communication channel for staff to report bugs, request features, suggest UI improvements, and track resolution status with evidence.
          </p>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsRaiseModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Raise New Ticket</span>
          </button>

          <button
            onClick={handleExportTicketsToExcel}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold animate-fadeIn ${
            msg.type === 'success'
              ? isDark ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : isDark ? 'bg-rose-950/90 border-rose-500/50 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-rose-500" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Sub-Tab Navigation */}
      <div className={`flex items-center gap-2 border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          onClick={() => setActiveTab('my_tickets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'my_tickets'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>My Raised Tickets ({userTickets.length})</span>
        </button>

        {canManageAllTickets && (
          <button
            onClick={() => setActiveTab('admin_desk')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'admin_desk'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Principal & Admin Ticket Desk ({tickets.length})</span>
            {tickets.filter(t => t.status === 'Open').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[10px] font-mono font-bold">
                {tickets.filter(t => t.status === 'Open').length} Open
              </span>
            )}
          </button>
        )}
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className={`p-3.5 rounded-2xl border space-y-1 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>Total Tickets</span>
            <FileText className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className={`text-xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{metrics.total}</div>
          <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>In current view</div>
        </div>

        <div className={`p-3.5 rounded-2xl border space-y-1 ${
          isDark ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200 shadow-sm'
        }`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
            isDark ? 'text-emerald-300' : 'text-emerald-800'
          }`}>
            <span>Open (New)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className={`text-xl font-black font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{metrics.open}</div>
          <div className={`text-[10px] ${isDark ? 'text-emerald-300/70' : 'text-emerald-600'}`}>Awaiting review</div>
        </div>

        <div className={`p-3.5 rounded-2xl border space-y-1 ${
          isDark ? 'bg-amber-950/30 border-amber-500/30' : 'bg-amber-50 border-amber-200 shadow-sm'
        }`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
            isDark ? 'text-amber-300' : 'text-amber-800'
          }`}>
            <span>In Progress</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className={`text-xl font-black font-mono ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{metrics.inProgress}</div>
          <div className={`text-[10px] ${isDark ? 'text-amber-300/70' : 'text-amber-600'}`}>Under action</div>
        </div>

        <div className={`p-3.5 rounded-2xl border space-y-1 ${
          isDark ? 'bg-purple-950/30 border-purple-500/30' : 'bg-purple-50 border-purple-200 shadow-sm'
        }`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
            isDark ? 'text-purple-300' : 'text-purple-800'
          }`}>
            <span>Resolved</span>
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className={`text-xl font-black font-mono ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{metrics.resolved}</div>
          <div className={`text-[10px] ${isDark ? 'text-purple-300/70' : 'text-purple-600'}`}>Completed & closed</div>
        </div>

        <div className={`p-3.5 rounded-2xl border space-y-1 ${
          isDark ? 'bg-rose-950/30 border-rose-500/30' : 'bg-rose-50 border-rose-200 shadow-sm'
        }`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
            isDark ? 'text-rose-300' : 'text-rose-800'
          }`}>
            <span>Critical Priority</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className={`text-xl font-black font-mono ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>{metrics.critical}</div>
          <div className={`text-[10px] ${isDark ? 'text-rose-300/70' : 'text-rose-600'}`}>Immediate attention</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="relative w-full md:w-72">
          <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Search tickets by title, id, module..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 text-xs border rounded-xl focus:outline-none focus:border-purple-500 ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className={`px-3 py-1.5 text-xs border rounded-xl font-bold focus:outline-none ${
              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as any)}
            className={`px-3 py-1.5 text-xs border rounded-xl font-bold focus:outline-none ${
              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <option value="ALL">All Categories</option>
            <option value="Bug / Glitch">Bug / Glitch</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Feedback">Feedback</option>
            <option value="UI/UX Issue">UI/UX Issue</option>
            <option value="Data Issue">Data Issue</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as any)}
            className={`px-3 py-1.5 text-xs border rounded-xl font-bold focus:outline-none ${
              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <option value="ALL">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Tickets List / Table */}
      <div className={`border rounded-2xl overflow-hidden shadow-xl space-y-2 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-500" />
            <h3 className={`text-sm font-bold m-0 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {activeTab === 'my_tickets' ? 'My Raised Tickets Ledger' : 'All Vidyalaya System Tickets & Feedback'}
            </h3>
          </div>
          <span className={`text-xs font-mono font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
            Showing {filteredTickets.length} of {activeTicketsList.length} tickets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-bold ${
                isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}>
                <th className="py-3 px-3">Ticket ID</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-4">Title & Description</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Raised By / Date</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-sans ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No tickets found matching current filters.</p>
                    <button
                      onClick={() => setIsRaiseModalOpen(true)}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Raise a Ticket</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => {
                  const catConfig = CATEGORY_ICONS[ticket.category] || CATEGORY_ICONS['Other'];
                  const CatIcon = catConfig.icon;
                  const prioBadge = PRIORITY_BADGES[ticket.priority] || PRIORITY_BADGES['Medium'];
                  const statusBadge = STATUS_BADGES[ticket.status] || STATUS_BADGES['Open'];

                  return (
                    <tr key={ticket.id} className={`transition-colors ${
                      isDark ? 'hover:bg-slate-800/40 text-slate-300' : 'hover:bg-slate-50 text-slate-800'
                    }`}>
                      {/* Ticket ID */}
                      <td className={`py-3 px-3 font-mono font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                        #{ticket.id}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}>
                          <CatIcon className="w-3 h-3" />
                          <span>{ticket.category}</span>
                        </span>
                      </td>

                      {/* Title & Description */}
                      <td className="py-3 px-4 max-w-sm">
                        <div
                          onClick={() => setSelectedTicketForDetail(ticket)}
                          className={`font-bold text-xs cursor-pointer line-clamp-1 ${
                            isDark ? 'text-white hover:text-purple-300' : 'text-slate-900 hover:text-purple-700 font-extrabold'
                          }`}
                        >
                          {ticket.title}
                        </div>
                        <div className={`text-[11px] line-clamp-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {ticket.description}
                        </div>
                        {ticket.evidence && ticket.evidence.length > 0 && (
                          <div className={`flex items-center gap-1 text-[10px] font-mono mt-1 ${
                            isDark ? 'text-purple-300' : 'text-purple-700 font-bold'
                          }`}>
                            <Paperclip className="w-3 h-3" />
                            <span>{ticket.evidence.length} attachment(s)</span>
                          </div>
                        )}
                      </td>

                      {/* Module */}
                      <td className={`py-3 px-3 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {ticket.moduleOrPage || 'General'}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${prioBadge.bg} ${prioBadge.color} ${prioBadge.border}`}>
                          {prioBadge.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg} ${statusBadge.color} ${statusBadge.border}`}>
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Raised By / Date */}
                      <td className="py-3 px-3">
                        <div className={`font-bold text-[11px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{ticket.raisedByName}</div>
                        <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {new Date(ticket.raisedAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedTicketForDetail(ticket)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 border ${
                              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                            }`}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {canManageAllTickets && (
                            <button
                              onClick={() => handleOpenManageModal(ticket)}
                              className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold cursor-pointer transition-all shadow-xs"
                              title="Update Status / Assign / Add Remarks"
                            >
                              Manage
                            </button>
                          )}
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

      {/* ========================================================================= */}
      {/* MODAL: TICKET DETAILS & EVIDENCE VIEWER */}
      {/* ========================================================================= */}
      {selectedTicketForDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl relative my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-purple-400 font-bold text-xs">#{selectedTicketForDetail.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGES[selectedTicketForDetail.status].bg} ${STATUS_BADGES[selectedTicketForDetail.status].color} ${STATUS_BADGES[selectedTicketForDetail.status].border}`}>
                    {selectedTicketForDetail.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white m-0">{selectedTicketForDetail.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTicketForDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Meta information strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Category</span>
                  <strong className="text-white font-sans">{selectedTicketForDetail.category}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Priority</span>
                  <strong className={PRIORITY_BADGES[selectedTicketForDetail.priority].color}>
                    {selectedTicketForDetail.priority}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Module</span>
                  <strong className="text-white font-sans">{selectedTicketForDetail.moduleOrPage || 'General'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Raised Date</span>
                  <strong className="text-white">
                    {new Date(selectedTicketForDetail.raisedAt).toLocaleDateString()}
                  </strong>
                </div>
              </div>

              {/* Raised By info */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <div className="text-slate-300">
                  Raised by: <strong className="text-white">{selectedTicketForDetail.raisedByName}</strong> ({selectedTicketForDetail.raisedBy})
                </div>
                {selectedTicketForDetail.assignedToName && (
                  <div className="text-purple-300">
                    Assigned to: <strong>{selectedTicketForDetail.assignedToName}</strong>
                  </div>
                )}
              </div>

              {/* Full Description */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Description:</span>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedTicketForDetail.description}
                </div>
              </div>

              {/* Principal / Developer Remarks */}
              {selectedTicketForDetail.principalOrDevRemarks && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Principal / Developer Remarks & Action Taken:</span>
                  </span>
                  <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-200 text-xs leading-relaxed">
                    {selectedTicketForDetail.principalOrDevRemarks}
                  </div>
                </div>
              )}

              {/* Evidence Gallery */}
              {selectedTicketForDetail.evidence && selectedTicketForDetail.evidence.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Attached Evidence ({selectedTicketForDetail.evidence.length}):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedTicketForDetail.evidence.map(ev => (
                      <div
                        key={ev.id}
                        className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {ev.fileType === 'image' ? (
                            <img
                              src={ev.fileUrl}
                              alt={ev.fileName}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-700 cursor-pointer"
                              onClick={() => setPreviewEvidence(ev)}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-300 font-bold text-xs">
                              PDF
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{ev.fileName}</div>
                            <div className="text-[10px] text-slate-400 font-mono uppercase">{ev.fileType}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                          {ev.fileType === 'image' ? (
                            <button
                              type="button"
                              onClick={() => setPreviewEvidence(ev)}
                              className="px-2 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>
                          ) : (
                            <a
                              href={ev.fileUrl}
                              download={ev.fileName}
                              className="px-2 py-1 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              {canManageAllTickets && (
                <button
                  type="button"
                  onClick={() => {
                    const t = selectedTicketForDetail;
                    setSelectedTicketForDetail(null);
                    handleOpenManageModal(t);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
                >
                  Manage / Update Ticket
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedTicketForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADMIN MANAGE TICKET */}
      {/* ========================================================================= */}
      {selectedTicketForManage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative my-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-purple-400 font-bold text-xs">#{selectedTicketForManage.id}</span>
                  <span className="text-xs text-slate-400">&bull; Raised by {selectedTicketForManage.raisedByName}</span>
                </div>
                <h3 className="text-base font-bold text-white m-0">{selectedTicketForManage.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTicketForManage(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTicketManagement} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Status *</label>
                  <select
                    value={manageStatus}
                    onChange={e => setManageStatus(e.target.value as TicketStatus)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-purple-500"
                  >
                    <option value="Open">🟢 Open</option>
                    <option value="In Progress">🟡 In Progress</option>
                    <option value="Resolved">🟣 Resolved</option>
                    <option value="Closed">⚪ Closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Assigned To</label>
                  <input
                    type="text"
                    placeholder="e.g. Principal / Lead Developer / Timetable Committee"
                    value={manageAssignedTo}
                    onChange={e => setManageAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Principal / Developer Remarks & Action Taken
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter response, resolution details, or action instructions for the user..."
                  value={manageRemarks}
                  onChange={e => setManageRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForManage(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Updates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RAISE TICKET MODAL */}
      {/* ========================================================================= */}
      <RaiseTicketModal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        currentUser={currentUser}
        currentTab={currentTab}
        onTicketCreated={() => loadTickets()}
      />

      {/* Image Preview Modal */}
      {previewEvidence && (
        <div className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4">
          <div className="relative max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{previewEvidence.fileName}</span>
              <button
                onClick={() => setPreviewEvidence(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewEvidence.fileUrl}
              alt={previewEvidence.fileName}
              className="max-h-[75vh] w-auto mx-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
