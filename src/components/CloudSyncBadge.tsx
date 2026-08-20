import React, { useEffect, useState } from 'react';
import { Cloud, CloudCheck, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { subscribeSyncStatus, CloudSyncStatus } from '../lib/firebase';
import { syncAllToCloud, syncAllFromCloud } from '../lib/storage';

interface CloudSyncBadgeProps {
  theme?: 'dark' | 'light';
  isFoundational?: boolean;
}

export const CloudSyncBadge: React.FC<CloudSyncBadgeProps> = ({
  theme = 'dark',
  isFoundational = false
}) => {
  const [status, setStatus] = useState<CloudSyncStatus>('synced');
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((newStatus, time) => {
      setStatus(newStatus);
      if (time) setLastSync(time);
    });
    return unsubscribe;
  }, []);

  const handleManualPushToCloud = async () => {
    setIsManualSyncing(true);
    setSyncMsg('Pushing local data to Firebase Cloud...');
    try {
      const res = await syncAllToCloud();
      if (res.success) {
        setSyncMsg(`Successfully uploaded ${res.count} records to Cloud Firestore!`);
      } else {
        setSyncMsg('Failed to sync. Please check network.');
      }
    } catch (err: any) {
      setSyncMsg(err?.message || 'Sync failed');
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  const handleManualPullFromCloud = async () => {
    setIsManualSyncing(true);
    setSyncMsg('Pulling latest updates from Firebase Cloud...');
    try {
      const res = await syncAllFromCloud();
      if (res.success) {
        setSyncMsg(`Updated ${res.updatedCount} records from Cloud! Reloading...`);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setSyncMsg('Failed to pull from cloud.');
      }
    } catch (err: any) {
      setSyncMsg(err?.message || 'Pull failed');
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPopup(!showPopup)}
        className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer shrink-0 ${
          status === 'syncing' || isManualSyncing
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 animate-pulse'
            : status === 'offline' || status === 'error'
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            : isFoundational
            ? 'bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-200 border-emerald-500/40'
            : 'bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-200 border-emerald-500/40'
        }`}
        title="Firebase Cloud Firestore Sync Status (Click to manage sync)"
        aria-label="Cloud Sync Status"
      >
        {status === 'syncing' || isManualSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
        ) : status === 'offline' || status === 'error' ? (
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
        ) : (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}

        <Cloud className="w-3.5 h-3.5 text-emerald-300 hidden md:inline" />
        <span className="hidden sm:inline">
          {status === 'syncing' || isManualSyncing
            ? 'Syncing...'
            : status === 'offline'
            ? 'Offline'
            : status === 'error'
            ? 'Sync Error'
            : 'Cloud Live'}
        </span>
      </button>

      {/* Sync Management Dropdown */}
      {showPopup && (
        <div
          className={`absolute right-0 mt-2 w-72 p-4 rounded-2xl shadow-2xl border z-50 backdrop-blur-xl ${
            theme === 'light'
              ? 'bg-white/95 border-slate-200 text-slate-800'
              : 'bg-[#131722]/95 border-slate-800 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Cloud className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Firebase Cloud Sync</h4>
                <p className="text-[10px] text-slate-400">OmniSchool Central DB</p>
              </div>
            </div>
            <button
              onClick={() => setShowPopup(false)}
              className="text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5"
            >
              ✕
            </button>
          </div>

          <div className="py-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Status:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Real-Time Auto Sync
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Last Synced:</span>
              <span className="font-mono text-[10px] text-slate-300">
                {lastSync ? lastSync.toLocaleTimeString() : 'Just now'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">School ID:</span>
              <span className="font-mono text-[10px] text-purple-300">kv_kutra_2218</span>
            </div>
          </div>

          {syncMsg && (
            <div className="p-2 mb-2 rounded-lg bg-purple-950/60 border border-purple-500/40 text-[11px] text-purple-200">
              {syncMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/40">
            <button
              type="button"
              disabled={isManualSyncing}
              onClick={handleManualPushToCloud}
              className="px-2 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 text-center"
              title="Push your local timetable, staff list, and records to Firebase"
            >
              ⬆️ Push to Cloud
            </button>
            <button
              type="button"
              disabled={isManualSyncing}
              onClick={handleManualPullFromCloud}
              className="px-2 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 text-center"
              title="Pull latest updates from Firebase to this device"
            >
              ⬇️ Pull Updates
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
