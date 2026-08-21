import React, { useState } from 'react';
import {
  Briefcase,
  Send,
  BookOpenCheck,
  CreditCard,
  Package,
  ShieldAlert,
  FileText,
  CheckCircle2,
  Clock,
  Plus
} from 'lucide-react';

interface OfficeModuleProps {
  devMode: boolean;
}

export type OfficeSubTab = 'dak' | 'service_book' | 'ubi_fee' | 'stock' | 'rti';

export const OfficeModule: React.FC<OfficeModuleProps> = ({ devMode }) => {
  const [activeTab, setActiveTab] = useState<OfficeSubTab>('dak');

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/10 light:border-slate-200">
        <button
          onClick={() => setActiveTab('dak')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'dak'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Dispatch & Dak Register</span>
        </button>

        <button
          onClick={() => setActiveTab('service_book')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'service_book'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <BookOpenCheck className="w-3.5 h-3.5" />
          <span>Service Books & Leave Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('ubi_fee')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ubi_fee'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>UBI Fee Portal Sync</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'stock'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Stock & Inventory</span>
        </button>

        <button
          onClick={() => setActiveTab('rti')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rti'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>RTI & Grievance Desk</span>
        </button>
      </div>

      {/* 1. Dispatch & Dak Register */}
      {activeTab === 'dak' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
              <span className="text-xs text-slate-400">Inward Dak (Received)</span>
              <div className="text-2xl font-bold text-slate-100 light:text-slate-900 mt-1">128 Letters</div>
              <span className="text-[10px] text-indigo-400">RO Bhubaneswar, KVS HQ, CBSE</span>
            </div>
            <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
              <span className="text-xs text-slate-400">Outward Dispatch</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">94 Dispatches</div>
              <span className="text-[10px] text-emerald-300">All registered post / email</span>
            </div>
            <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
              <span className="text-xs text-slate-400">Pending Action Memos</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">2 Pending</div>
              <span className="text-[10px] text-amber-300">UBI quarterly report submission</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Service Books & Leave Ledger */}
      {activeTab === 'service_book' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
            <h3 className="text-sm font-bold text-slate-200 light:text-slate-800 mb-1">
              Digital Service Book & Leave Credit Ledger
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Annual physical verification, increment dates, GPF/PRAN records, and biometric leave ledger.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-slate-400">Casual Leave (CL)</span>
                <p className="text-base font-bold text-purple-300 mt-1">8 Days / Year</p>
              </div>
              <div className="p-3 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-slate-400">Half Pay Leave (HPL)</span>
                <p className="text-base font-bold text-purple-300 mt-1">20 Days / Year</p>
              </div>
              <div className="p-3 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-slate-400">Earned Leave (EL)</span>
                <p className="text-base font-bold text-purple-300 mt-1">10 Days / Year (Vacation Staff)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. UBI Fee Portal Sync */}
      {activeTab === 'ubi_fee' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
            <h3 className="text-sm font-bold text-slate-200 light:text-slate-800 mb-1">
              Union Bank of India (UBI) Fee Sync
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Quarterly student fee generation, challan verification, and concession tracking (RTE / BPL / SGC).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-[11px] text-slate-400">Q-2 Fee Collection Rate</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">98.4% Collected</div>
              </div>
              <div className="p-3.5 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-[11px] text-slate-400">UBI Student IDs Synced</span>
                <div className="text-xl font-bold text-indigo-400 mt-1">742 / 742 Active</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Stock & Inventory */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
            <h3 className="text-sm font-bold text-slate-200 light:text-slate-800 mb-1">
              Stock Register & Physical Verification
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Consumable / Non-consumable registers, science lab equipment, sports kits, and IT lab stock.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-slate-400">IT & Smart Classrooms</span>
                <p className="text-base font-bold text-emerald-400 mt-1">24 Systems Active</p>
              </div>
              <div className="p-3 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-slate-400">Science Lab Equipment</span>
                <p className="text-base font-bold text-slate-200 light:text-slate-800 mt-1">Phys / Chem / Bio Kit</p>
              </div>
              <div className="p-3 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-slate-400">Physical Verification</span>
                <p className="text-base font-bold text-emerald-400 mt-1">Completed March 2026</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. RTI & Grievance Desk */}
      {activeTab === 'rti' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
            <h3 className="text-sm font-bold text-slate-200 light:text-slate-800 mb-1">
              RTI & Public Grievance Tracking
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Statutory 30-day RTI response timeline and CPGRAMS online portal compliance.
            </p>
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 light:bg-emerald-50">
              <span className="text-xs font-bold text-emerald-400 light:text-emerald-800">
                Zero Pending RTI or CPGRAMS Grievances
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">All 6 queries answered within timeline this session.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
