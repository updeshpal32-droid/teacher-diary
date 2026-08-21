import React, { useState } from 'react';
import {
  UserCheck,
  FileCheck2,
  Heart,
  Layers,
  ListOrdered,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface AdmissionModuleProps {
  devMode: boolean;
}

export type AdmissionSubTab = 'verification' | 'rte' | 'sgc' | 'quotas' | 'merit';

export const AdmissionModule: React.FC<AdmissionModuleProps> = ({ devMode }) => {
  const [activeTab, setActiveTab] = useState<AdmissionSubTab>('verification');

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/10 light:border-slate-200">
        <button
          onClick={() => setActiveTab('verification')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'verification'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Admission Verification</span>
        </button>

        <button
          onClick={() => setActiveTab('rte')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rte'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>RTE 25% Quota</span>
        </button>

        <button
          onClick={() => setActiveTab('sgc')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sgc'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Single Girl Child (SGC)</span>
        </button>

        <button
          onClick={() => setActiveTab('quotas')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'quotas'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Category-wise Quotas</span>
        </button>

        <button
          onClick={() => setActiveTab('merit')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'merit'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Merit Lists & Enrolment</span>
        </button>
      </div>

      {/* 1. Admission Verification Desk */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
              <span className="text-xs text-slate-400">Total Applications Received</span>
              <div className="text-2xl font-bold text-slate-100 light:text-slate-900 mt-1">342</div>
              <span className="text-[10px] text-indigo-400">Class I: 210 • Classes II-IX: 132</span>
            </div>
            <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
              <span className="text-xs text-slate-400">Documents Verified</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">298</div>
              <span className="text-[10px] text-emerald-300">87.1% Verification Completed</span>
            </div>
            <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
              <span className="text-xs text-slate-400">Pending Review</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">44</div>
              <span className="text-[10px] text-amber-300">Service certs / RTE distance checks</span>
            </div>
            <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
              <span className="text-xs text-slate-400">Total Seats Sanctioned</span>
              <div className="text-2xl font-bold text-purple-300 mt-1">160</div>
              <span className="text-[10px] text-purple-200">40 Seats / Section</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-200 light:text-slate-800">
                Recent Verification Queue
              </h3>
              <span className="text-xs text-slate-400">Session 2026-27</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 light:border-slate-200 text-slate-400">
                    <th className="py-2.5 px-3">App ID</th>
                    <th className="py-2.5 px-3">Candidate Name</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Service Priority</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 light:divide-slate-100 text-slate-200 light:text-slate-800">
                  <tr>
                    <td className="py-2.5 px-3 font-mono text-purple-300">KVS-26-0012</td>
                    <td className="py-2.5 px-3 font-semibold">Aarav Nayak</td>
                    <td className="py-2.5 px-3">Class I</td>
                    <td className="py-2.5 px-3">General</td>
                    <td className="py-2.5 px-3">Cat-1 (Defense / CRPF)</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">Verified</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono text-purple-300">KVS-26-0045</td>
                    <td className="py-2.5 px-3 font-semibold">Pooja Mohanty</td>
                    <td className="py-2.5 px-3">Class I</td>
                    <td className="py-2.5 px-3">RTE / SC</td>
                    <td className="py-2.5 px-3">Cat-5 (Private / Others)</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">Verified</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono text-purple-300">KVS-26-0089</td>
                    <td className="py-2.5 px-3 font-semibold">Sneha Kerketta</td>
                    <td className="py-2.5 px-3">Class I</td>
                    <td className="py-2.5 px-3">SGC / ST</td>
                    <td className="py-2.5 px-3">Cat-3 (State Govt)</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-bold">Pending Affidavit</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. RTE 25% Quota */}
      {activeTab === 'rte' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
            <h3 className="text-sm font-bold text-slate-200 light:text-slate-800 mb-1">
              Right to Education (RTE) 25% Seat Allocation
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              10 seats per section in Class I reserved under RTE Act with zero tuition fee and free textbook grant.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-[11px] text-slate-400">Total RTE Reserved Seats</span>
                <div className="text-xl font-bold text-indigo-400 mt-1">10 Seats / Section</div>
              </div>
              <div className="p-3.5 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-[11px] text-slate-400">RTE Eligible Radius</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">&lt; 5 KM (Urban / Semi-Urban)</div>
              </div>
              <div className="p-3.5 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-[11px] text-slate-400">Fee Exemption Status</span>
                <div className="text-xl font-bold text-purple-300 mt-1">100% Waived</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Single Girl Child (SGC) */}
      {activeTab === 'sgc' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
            <h3 className="text-sm font-bold text-slate-200 light:text-slate-800 mb-1">
              Single Girl Child (SGC) Special Quota
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              2 seats per section reserved in Class I with VVN fee exemption from Class VI onwards.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-[11px] text-slate-400">SGC Quota Seats</span>
                <div className="text-lg font-bold text-purple-300 mt-1">2 Seats / Section</div>
              </div>
              <div className="p-3.5 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-[11px] text-slate-400">Mandatory Verification</span>
                <div className="text-lg font-bold text-emerald-400 mt-1">SDM / First Class Magistrate Affidavit</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Category-wise Quotas */}
      {activeTab === 'quotas' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
            <h3 className="text-sm font-bold text-slate-200 light:text-slate-800 mb-3">
              Constitutional & Service Priority Quotas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-slate-400">SC Reservation</span>
                <p className="text-lg font-bold text-slate-200 light:text-slate-800 mt-1">15.0%</p>
              </div>
              <div className="p-3 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-slate-400">ST Reservation</span>
                <p className="text-lg font-bold text-slate-200 light:text-slate-800 mt-1">7.5%</p>
              </div>
              <div className="p-3 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-slate-400">OBC (NCL)</span>
                <p className="text-lg font-bold text-slate-200 light:text-slate-800 mt-1">27.0%</p>
              </div>
              <div className="p-3 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-slate-400">Divyang (PwD)</span>
                <p className="text-lg font-bold text-slate-200 light:text-slate-800 mt-1">3.0% (Horiz.)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Merit Lists & Enrolment */}
      {activeTab === 'merit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
            <h3 className="text-sm font-bold text-slate-200 light:text-slate-800 mb-1">
              Class-wise Selection & Merit Lists
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Generate lottery result sheets, waiting lists, and admission registration register.
            </p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer">
                Generate Class I Lottery List
              </button>
              <button className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer">
                Export PDF Merit Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
