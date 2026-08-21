import React, { useState, useEffect } from 'react';
import {
  ProfileChangeRequest,
  StaffDetailRecord,
  TeacherProfile
} from '../types/academic';
import { db, getCurrentUser } from '../lib/storage';
import { getTeacherScopedStorageKey } from '../lib/teacherContext';
import { detectEmploymentType } from '../lib/staffFileImporter';
import { UserAccount } from '../types/auth';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  User,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  X,
  FileText,
  Building,
  CheckCheck,
  Crown
} from 'lucide-react';

interface ProfileChangeRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestResolved?: () => void;
  initialRequestId?: string | null;
}

export const ProfileChangeRequestsModal: React.FC<ProfileChangeRequestsModalProps> = ({
  isOpen,
  onClose,
  onRequestResolved,
  initialRequestId
}) => {
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [selectedReq, setSelectedReq] = useState<ProfileChangeRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [principalRemarks, setPrincipalRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen, initialRequestId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadRequests = async () => {
    const stored = (await db.get<ProfileChangeRequest[]>('profile:change_requests')) || [];
    stored.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    setRequests(stored);

    if (initialRequestId) {
      const match = stored.find(r => r.id === initialRequestId || r.employeeCode === initialRequestId);
      if (match) {
        setSelectedReq(match);
        setPrincipalRemarks(match.principalRemarks || '');
        if (match.status !== 'pending') {
          setFilterStatus('all');
        }
        return;
      }
    }

    const pending = stored.filter(r => r.status === 'pending');
    if (pending.length > 0) {
      setSelectedReq(pending[0]);
    } else if (stored.length > 0) {
      setSelectedReq(stored[0]);
    } else {
      setSelectedReq(null);
    }
  };

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!selectedReq) return;
    setProcessing(true);
    setMsg(null);

    try {
      const user = await getCurrentUser();
      const approverName = user?.name ? `${user.name} (${user.role === 'admin' ? 'Principal I/c' : 'Data Entry Manager'})` : 'Principal / Checking Authority';

      const rawCoCT = selectedReq.proposedProfile.coClassTeacherRole || '';
      const cleanCoCT = rawCoCT
        .replace(/^co[- ]?class\s*teacher\s*(of)?\s*(class)?\s*/i, '')
        .replace(/^[-\s:]+/, '')
        .trim();

      const rawCT = selectedReq.proposedProfile.classTeacherRole || '';
      const cleanCT = rawCT
        .replace(/^class\s*teacher\s*(of)?\s*(class)?\s*/i, '')
        .replace(/^[-\s:]+/, '')
        .trim();

      // 1. Update Teacher's Scoped Profile
      const scopedKey = getTeacherScopedStorageKey('setup:teacher', selectedReq.employeeCode);
      await db.set(scopedKey, selectedReq.proposedProfile);

      // 2. Synchronize Matching Fields into Staff Details (20-Column Master Registry)
      const staffList = (await db.get<StaffDetailRecord[]>('setup:staff_details')) || [];
      const updatedStaff = staffList.map(stf => {
        if (stf.employeeCode === selectedReq.employeeCode) {
          const newDesignation = selectedReq.proposedProfile.designation || stf.designation;

          let remarks = stf.principalRemarks || '';
          if (cleanCoCT) {
            remarks = remarks.replace(/Co-Class Teacher:\s*[^.;\n]+[.;]?/gi, '').replace(/Co-CT:\s*[^.;\n]+[.;]?/gi, '').trim();
            const newCoRemark = `Co-Class Teacher: ${cleanCoCT} (Session 2026-27).`;
            remarks = remarks ? `${newCoRemark} ${remarks}` : newCoRemark;
          }
          if (cleanCT) {
            remarks = remarks.replace(/Class Teacher:\s*[^.;\n]+[.;]?/gi, '').replace(/\bCT:\s*[^.;\n]+[.;]?/gi, '').trim();
            const newCTRemark = `Class Teacher: ${cleanCT} (Session 2026-27).`;
            remarks = remarks ? `${newCTRemark} ${remarks}` : newCTRemark;
          }

          return {
            ...stf,
            name: selectedReq.proposedProfile.name || stf.name,
            designation: newDesignation,
            employmentType: detectEmploymentType(newDesignation) || stf.employmentType,
            phoneCalls: selectedReq.proposedProfile.phoneNo || stf.phoneCalls,
            email: selectedReq.proposedProfile.email || stf.email,
            highestAcademicAndProfessionalQual: selectedReq.proposedProfile.qualifications || stf.highestAcademicAndProfessionalQual,
            permanentPostalAddress: selectedReq.proposedProfile.residentialAddress || stf.permanentPostalAddress,
            dob: selectedReq.proposedProfile.dob || stf.dob,
            joiningDateKVSWithDesignation: selectedReq.proposedProfile.joiningDateKVS || stf.joiningDateKVSWithDesignation,
            joiningDatePresentKVWithDesignation: selectedReq.proposedProfile.joiningDatePresentKV || stf.joiningDatePresentKVWithDesignation,
            aadharNo: selectedReq.proposedProfile.aadharNo || stf.aadharNo,
            pranOrPanNo: selectedReq.proposedProfile.panNo || selectedReq.proposedProfile.gpfCpfPranNo || stf.pranOrPanNo,
            seniorityNumber: selectedReq.proposedProfile.seniorityNo || stf.seniorityNumber,
            principalRemarks: remarks,
            approvalStatus: 'Verified & Approved' as const
          };
        }
        return stf;
      });
      await db.set('setup:staff_details', updatedStaff);

      // 3. Synchronize Auth Users List and Current User
      const usersList = (await db.get<UserAccount[]>('auth:users_list')) || [];
      const updatedUsers = usersList.map(u => {
        if (u.employeeCode === selectedReq.employeeCode) {
          return {
            ...u,
            name: selectedReq.proposedProfile.name || u.name,
            designation: selectedReq.proposedProfile.designation || u.designation,
            ...(cleanCoCT ? { isCoClassTeacherOf: cleanCoCT } : rawCoCT === '' ? { isCoClassTeacherOf: undefined } : {}),
            ...(cleanCT ? { isClassTeacherOf: cleanCT } : rawCT === '' ? { isClassTeacherOf: undefined } : {})
          };
        }
        return u;
      });
      await db.set('auth:users_list', updatedUsers);

      const curUser = await db.get<UserAccount>('auth:current_user');
      if (curUser && curUser.employeeCode === selectedReq.employeeCode) {
        const updatedCurUser = {
          ...curUser,
          name: selectedReq.proposedProfile.name || curUser.name,
          designation: selectedReq.proposedProfile.designation || curUser.designation,
          ...(cleanCoCT ? { isCoClassTeacherOf: cleanCoCT } : rawCoCT === '' ? { isCoClassTeacherOf: undefined } : {}),
          ...(cleanCT ? { isClassTeacherOf: cleanCT } : rawCT === '' ? { isClassTeacherOf: undefined } : {})
        };
        await db.set('auth:current_user', updatedCurUser);
      }

      // 4. Update Timetable, Portfolios, and Campus Duties
      const newName = selectedReq.proposedProfile.name;
      const oldName = selectedReq.teacherName;
      if (newName) {
        // Timetable
        const timetable = (await db.get<any[]>('setup:timetable')) || [];
        if (timetable.length > 0) {
          const updatedTT = timetable.map(slot => {
            if (
              slot.teacherId === selectedReq.employeeCode ||
              (oldName && slot.teacherName && slot.teacherName.toLowerCase().includes(oldName.toLowerCase())) ||
              (selectedReq.employeeCode === '51951' && slot.teacherName && slot.teacherName.toLowerCase().includes('dhuma'))
            ) {
              return {
                ...slot,
                teacherId: selectedReq.employeeCode,
                teacherName: newName
              };
            }
            return slot;
          });
          await db.set('setup:timetable', updatedTT);
        }

        // Portfolios
        const assignments = (await db.get<any[]>('setup:portfolio_assignments')) || [];
        if (assignments.length > 0) {
          const updatedAsgn = assignments.map(a => {
            if (
              a.teacherEmployeeCode === selectedReq.employeeCode ||
              (oldName && a.teacherName && a.teacherName.toLowerCase().includes(oldName.toLowerCase())) ||
              (selectedReq.employeeCode === '51951' && a.teacherName && a.teacherName.toLowerCase().includes('dhuma'))
            ) {
              return {
                ...a,
                teacherEmployeeCode: selectedReq.employeeCode,
                teacherName: newName
              };
            }
            return a;
          });
          await db.set('setup:portfolio_assignments', updatedAsgn);
        }

        // Campus Duties
        const campusDuties = (await db.get<any[]>('setup:campus_duty_assignments')) || [];
        if (campusDuties.length > 0) {
          const updatedDuties = campusDuties.map(d => {
            if (
              d.teacherEmployeeCode === selectedReq.employeeCode ||
              (oldName && d.teacherName && d.teacherName.toLowerCase().includes(oldName.toLowerCase()))
            ) {
              return {
                ...d,
                teacherEmployeeCode: selectedReq.employeeCode,
                teacherName: newName,
                teacherDesignation: selectedReq.proposedProfile.designation || d.teacherDesignation
              };
            }
            return d;
          });
          await db.set('setup:campus_duty_assignments', updatedDuties);
        }
      }

      // 5. Update Request Status in IndexedDB
      const allRequests = (await db.get<ProfileChangeRequest[]>('profile:change_requests')) || [];
      const updatedRequests = allRequests.map(r => {
        if (r.id === selectedReq.id) {
          return {
            ...r,
            status: 'approved' as const,
            resolvedAt: new Date().toISOString(),
            resolvedBy: approverName,
            principalRemarks: principalRemarks.trim() || 'Approved and synchronized with Vidyalaya Staff Directory & Teacher Diary.'
          };
        }
        return r;
      });
      await db.set('profile:change_requests', updatedRequests);

      // 6. Dispatch Events
      window.dispatchEvent(new CustomEvent('kvs-profile-request-resolved', { detail: { id: selectedReq.id, status: 'approved' } }));
      window.dispatchEvent(new CustomEvent('kvs-auth-changed', { detail: null }));
      window.dispatchEvent(new CustomEvent('kvs-active-teacher-changed', { detail: null }));
      window.dispatchEvent(new CustomEvent('kvs-timetable-updated', { detail: null }));
      window.dispatchEvent(new CustomEvent('kvs-portfolios-updated', { detail: null }));

      setMsg({ type: 'success', text: `Approved and merged profile update for ${selectedReq.teacherName}!` });
      await loadRequests();
      if (onRequestResolved) onRequestResolved();
      setTimeout(() => setMsg(null), 3500);
    } catch (err) {
      console.error('Error approving request:', err);
      setMsg({ type: 'error', text: 'Failed to approve update request.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    if (!principalRemarks.trim()) {
      alert('Please provide Principal remarks or reason before returning/rejecting the request.');
      return;
    }

    setProcessing(true);
    setMsg(null);

    try {
      const user = await getCurrentUser();
      const approverName = user?.name ? `${user.name} (${user.role === 'admin' ? 'Principal I/c' : 'Data Entry Manager'})` : 'Principal / Checking Authority';

      // Update Request Status in IndexedDB
      const allRequests = (await db.get<ProfileChangeRequest[]>('profile:change_requests')) || [];
      const updatedRequests = allRequests.map(r => {
        if (r.id === selectedReq.id) {
          return {
            ...r,
            status: 'rejected' as const,
            resolvedAt: new Date().toISOString(),
            resolvedBy: approverName,
            principalRemarks: principalRemarks.trim()
          };
        }
        return r;
      });
      await db.set('profile:change_requests', updatedRequests);

      // Dispatch Event
      window.dispatchEvent(new CustomEvent('kvs-profile-request-resolved', { detail: { id: selectedReq.id, status: 'rejected' } }));

      setMsg({ type: 'success', text: `Returned update request for ${selectedReq.teacherName} with remarks.` });
      await loadRequests();
      if (onRequestResolved) onRequestResolved();
      setTimeout(() => setMsg(null), 3500);
    } catch (err) {
      console.error('Error rejecting request:', err);
      setMsg({ type: 'error', text: 'Failed to return update request.' });
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter(r => filterStatus === 'all' || r.status === filterStatus);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shadow-sm">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  Teacher Profile Update Requests &amp; Principal Approval
                </h3>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 animate-pulse">
                    {pendingCount} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Review proposed faculty bio-data updates before synchronizing into Vidyalaya Master Directory.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast Notification */}
        {msg && (
          <div
            className={`p-3 text-xs font-bold text-center border-b flex items-center justify-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-950 text-emerald-200 border-emerald-500/50'
                : 'bg-rose-950 text-rose-200 border-rose-500/50'
            }`}
          >
            {msg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Left Column: Request List & Filter */}
          <div className="p-4 space-y-3 overflow-y-auto max-h-[400px] md:max-h-[calc(90vh-140px)] bg-slate-950/40">
            {/* Filter Tabs */}
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setFilterStatus('pending')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'approved' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilterStatus('all')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  filterStatus === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
            </div>

            {/* List */}
            {filteredRequests.length === 0 ? (
              <div className="p-6 text-center text-slate-500 italic text-xs">
                No profile change requests found for status "{filterStatus}".
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRequests.map(req => {
                  const isSelected = selectedReq?.id === req.id;
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';

                  return (
                    <button
                      key={req.id}
                      onClick={() => {
                        setSelectedReq(req);
                        setPrincipalRemarks(req.principalRemarks || '');
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-slate-850 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-white truncate max-w-[130px]">
                          {req.teacherName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            isPending
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : isApproved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-purple-300">#{req.employeeCode}</span>
                        <span className="text-slate-500">{req.designation}</span>
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <span>{req.changedFields.length} field(s) modified</span>
                        <span>{new Date(req.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Detailed Diff & Approval Action */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)] col-span-2 bg-slate-900/60">
            {selectedReq ? (
              <div className="space-y-6">
                {/* Request Header Summary */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white">{selectedReq.teacherName}</h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        {selectedReq.designation}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 pt-0.5">
                      Emp Code: <strong className="text-white font-mono">{selectedReq.employeeCode}</strong> · Submitted:{' '}
                      <span className="text-amber-300 font-medium">{new Date(selectedReq.submittedAt).toLocaleString()}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                        selectedReq.status === 'pending'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                          : selectedReq.status === 'approved'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {selectedReq.status === 'pending' ? <Clock className="w-3.5 h-3.5" /> : selectedReq.status === 'approved' ? <CheckCheck className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span className="capitalize">{selectedReq.status} Request</span>
                    </span>
                  </div>
                </div>

                {/* Proposed Changes Diff Table */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Proposed Modifications ({selectedReq.changedFields.length}):</span>
                  </h5>

                  {selectedReq.changedFields.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950 text-slate-400 text-xs italic">
                      No specific field diffs detected (full profile structure submitted).
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                          <tr>
                            <th className="p-3 w-1/4">Field Attribute</th>
                            <th className="p-3 w-3/8 text-slate-400">Current Official Value</th>
                            <th className="p-3 w-3/8 text-emerald-300 bg-emerald-950/20">Proposed New Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-medium">
                          {selectedReq.changedFields.map(diff => (
                            <tr key={diff.fieldKey} className="hover:bg-slate-850/40">
                              <td className="p-3 font-bold text-slate-300">{diff.fieldLabel}</td>
                              <td className="p-3 text-slate-400 font-mono text-[11px] line-through decoration-rose-500/60">
                                {diff.currentValue || <span className="text-slate-600 italic">(Empty)</span>}
                              </td>
                              <td className="p-3 text-emerald-300 font-mono text-[11px] font-bold bg-emerald-950/10">
                                {diff.proposedValue || <span className="text-slate-600 italic">(Cleared)</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Principal Remarks & Action Box */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <label className="block text-xs font-bold text-slate-300">
                    Principal Verification Remarks &amp; Suggestions:
                  </label>
                  <textarea
                    rows={2}
                    value={principalRemarks}
                    onChange={e => setPrincipalRemarks(e.target.value)}
                    placeholder="Enter Principal remarks or verification endorsement notes..."
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all resize-none"
                  />

                  {selectedReq.status === 'pending' ? (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={processing}
                        className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Return / Reject with Remarks</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={processing}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-200" />
                        <span>{processing ? 'Merging...' : '✅ Approve & Merge into Official Roster'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-900 text-xs text-slate-400 flex items-center justify-between">
                      <span>
                        Resolved by: <strong className="text-white">{selectedReq.resolvedBy || 'Principal'}</strong> on{' '}
                        {selectedReq.resolvedAt ? new Date(selectedReq.resolvedAt).toLocaleString() : 'N/A'}
                      </span>
                      <span className="font-bold text-amber-300">{selectedReq.status.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                Select a profile change request from the left list to review.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
