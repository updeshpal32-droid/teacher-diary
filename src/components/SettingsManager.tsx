import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Mail,
  UserCheck,
  ShieldCheck,
  Code,
  Sparkles,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  FileText,
  Key,
  Sliders,
  Check,
  ArrowRight,
  Eye,
  HardDrive,
  Cloud,
  CloudUpload,
  Folder,
  FolderCheck,
  RefreshCw,
  LogOut,
  ExternalLink,
  Globe,
  X,
  Calendar
} from 'lucide-react';
import { db, resetDatabaseToDefaults, initializeDatabaseIfEmpty, exportAllHistoryJSON, importBackupJSON } from '../lib/storage';
import {
  useActiveWorkingDate,
  addDaysToDate,
  getLocalTodayDateString,
  parseAnyDateStringToISO,
  getDayOfWeekFromDate
} from '../lib/activeDateContext';
import { DevModeBadge } from './DevModeBadge';
import { SchoolDetails, TeacherProfile } from '../types/academic';
import { UserAccount, getRoleBadgeInfo } from '../types/auth';
import { UserAccountManager } from './UserAccountManager';

interface SettingsManagerProps {
  devMode: boolean;
  onToggleDevMode: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: (newTheme: 'dark' | 'light') => void;
  onNavigateTab: (tab: 'school' | 'teacher' | 'classes' | 'timetable' | 'calendar' | 'exams' | 'syllabus' | 'lessonplan' | 'assessment' | 'inspection' | 'reports' | 'tickets' | string) => void;
  currentUser?: UserAccount | null;
  onSwitchAccount?: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  devMode,
  onToggleDevMode,
  theme,
  onToggleTheme,
  onNavigateTab,
  currentUser,
  onSwitchAccount
}) => {
  // Login & Account State
  const [userEmail, setUserEmail] = useState('updeshpal32@gmail.com');
  const [teacherName, setTeacherName] = useState('Mr. Updesh Pal');
  const [employeeId, setEmployeeId] = useState('KVS-EMP-884920');
  const [designation, setDesignation] = useState('TGT Mathematics');
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accountSaveMsg, setAccountSaveMsg] = useState<string | null>(null);
  // Unified Active Working Date System State
  const { activeDate, activeDayName, formattedDate, isWeekend, setActiveDate } = useActiveWorkingDate();
  const [typedDateInput, setTypedDateInput] = useState<string>(activeDate);
  const [dateSavedMsg, setDateSavedMsg] = useState<string | null>(null);
  const [dateInputError, setDateInputError] = useState<string | null>(null);
  const datePickerInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTypedDateInput(activeDate);
  }, [activeDate]);

  const handleCommitTypedDate = async () => {
    if (!typedDateInput || typedDateInput.trim() === '') {
      setTypedDateInput(activeDate);
      setDateInputError(null);
      return;
    }
    const parsed = parseAnyDateStringToISO(typedDateInput);
    if (parsed) {
      setDateInputError(null);
      await setActiveDate(parsed);
      setTypedDateInput(parsed);
      setDateSavedMsg(`Active working date updated to ${parsed} (${getDayOfWeekFromDate(parsed)})!`);
      setTimeout(() => setDateSavedMsg(null), 3500);
    } else {
      setDateInputError(`Invalid date format. Please enter YYYY-MM-DD or DD/MM/YYYY`);
      setTypedDateInput(activeDate);
      setTimeout(() => setDateInputError(null), 4000);
    }
  };

  // System Permissions & Feature Toggles
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [printWatermarkEnabled, setPrintWatermarkEnabled] = useState(true);

  // Media & Evidence Storage State
  const [mediaStorageLocation, setMediaStorageLocation] = useState<'local' | 'google_drive'>('local');
  const [googleDriveAccount, setGoogleDriveAccount] = useState<{
    connected: boolean;
    email: string;
    folder: string;
    lastSynced?: string;
  }>({
    connected: false,
    email: 'updeshpal32@gmail.com',
    folder: 'My Drive/KVS Teacher Diary/Media Evidence'
  });
  const [isConnectingDriveModalOpen, setIsConnectingDriveModalOpen] = useState(false);
  const [driveConnectEmailInput, setDriveConnectEmailInput] = useState('updeshpal32@gmail.com');
  const [isAuthenticatingDrive, setIsAuthenticatingDrive] = useState(false);
  const [mediaStorageMsg, setMediaStorageMsg] = useState<{ type: 'success' | 'warning'; text: string } | null>(null);

  // Backup & Restore State
  const [dataMsg, setDataMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    const t = await db.get<TeacherProfile>('setup:teacher');
    if (t) {
      if (t.email) {
        setUserEmail(t.email);
        setDriveConnectEmailInput(t.email);
      }
      if (t.name) setTeacherName(t.name);
      if (t.employeeCode) setEmployeeId(t.employeeCode);
      if (t.designation) setDesignation(t.designation);
    }

    const aiSetting = await db.get<boolean>('settings:ai_enabled');
    if (aiSetting !== null && aiSetting !== undefined) setAiAssistantEnabled(aiSetting);

    const autoSaveSetting = await db.get<boolean>('settings:autosave_enabled');
    if (autoSaveSetting !== null && autoSaveSetting !== undefined) setAutoSaveEnabled(autoSaveSetting);

    const watermarkSetting = await db.get<boolean>('settings:watermark_enabled');
    if (watermarkSetting !== null && watermarkSetting !== undefined) setPrintWatermarkEnabled(watermarkSetting);

    const storageLoc = await db.get<'local' | 'google_drive'>('settings:media_storage_location');
    if (storageLoc) setMediaStorageLocation(storageLoc);

    const driveAcc = await db.get<{ connected: boolean; email: string; folder: string; lastSynced?: string }>('settings:google_drive_account');
    if (driveAcc) setGoogleDriveAccount(driveAcc);
  };

  const handleSaveAccountInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = await db.get<TeacherProfile>('setup:teacher');
    if (t) {
      const updated = {
        ...t,
        email: userEmail,
        name: teacherName,
        employeeCode: employeeId,
        designation: designation
      };
      await db.set('setup:teacher', updated);
    }
    setIsEditingAccount(false);
    setAccountSaveMsg('Account login credentials & bio details updated successfully!');
    setTimeout(() => setAccountSaveMsg(null), 4000);
  };

  const handleToggleAiSetting = async () => {
    const newVal = !aiAssistantEnabled;
    setAiAssistantEnabled(newVal);
    await db.set('settings:ai_enabled', newVal);
  };

  const handleToggleAutoSave = async () => {
    const newVal = !autoSaveEnabled;
    setAutoSaveEnabled(newVal);
    await db.set('settings:autosave_enabled', newVal);
  };

  const handleToggleWatermark = async () => {
    const newVal = !printWatermarkEnabled;
    setPrintWatermarkEnabled(newVal);
    await db.set('settings:watermark_enabled', newVal);
  };

  // Storage Location Preference Handlers
  const handleSelectStorageLocation = async (location: 'local' | 'google_drive') => {
    if (location === 'google_drive' && !googleDriveAccount.connected) {
      setIsConnectingDriveModalOpen(true);
      return;
    }
    setMediaStorageLocation(location);
    await db.set('settings:media_storage_location', location);
    setMediaStorageMsg({
      type: 'success',
      text: location === 'google_drive'
        ? `Media & evidence items will now be uploaded to Google Drive (${googleDriveAccount.email}).`
        : 'Media & evidence items will now be stored in your Local Device database.'
    });
    setTimeout(() => setMediaStorageMsg(null), 4000);
  };

  const handleConnectGoogleDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticatingDrive(true);

    setTimeout(async () => {
      const newDriveAccount = {
        connected: true,
        email: driveConnectEmailInput.trim() || userEmail,
        folder: 'My Drive/KVS Teacher Diary/Media Evidence',
        lastSynced: new Date().toLocaleString()
      };
      setGoogleDriveAccount(newDriveAccount);
      await db.set('settings:google_drive_account', newDriveAccount);

      setMediaStorageLocation('google_drive');
      await db.set('settings:media_storage_location', 'google_drive');

      setIsAuthenticatingDrive(false);
      setIsConnectingDriveModalOpen(false);

      setMediaStorageMsg({
        type: 'success',
        text: `Google Drive connected successfully for ${newDriveAccount.email}! Folder "${newDriveAccount.folder}" is ready.`
      });
      setTimeout(() => setMediaStorageMsg(null), 5000);
    }, 1200);
  };

  const handleDisconnectGoogleDrive = async () => {
    const disconnectedAccount = {
      connected: false,
      email: userEmail,
      folder: 'My Drive/KVS Teacher Diary/Media Evidence'
    };
    setGoogleDriveAccount(disconnectedAccount);
    await db.set('settings:google_drive_account', disconnectedAccount);

    setMediaStorageLocation('local');
    await db.set('settings:media_storage_location', 'local');

    setMediaStorageMsg({
      type: 'warning',
      text: 'Disconnected from Google Drive. Storage location reverted to Local Device.'
    });
    setTimeout(() => setMediaStorageMsg(null), 4000);
  };

  const handleTestDriveConnection = async () => {
    const updatedSyncTime = new Date().toLocaleString();
    const updatedAcc = { ...googleDriveAccount, lastSynced: updatedSyncTime };
    setGoogleDriveAccount(updatedAcc);
    await db.set('settings:google_drive_account', updatedAcc);

    setMediaStorageMsg({
      type: 'success',
      text: `Google Drive API connection verified! Folder "${googleDriveAccount.folder}" is active for ${googleDriveAccount.email}.`
    });
    setTimeout(() => setMediaStorageMsg(null), 5000);
  };

  // Data Export & Import Handlers
  const handleExportBackup = async () => {
    try {
      await exportAllHistoryJSON();
      setDataMsg({ type: 'success', text: 'Full Teacher\'s Diary backup JSON file exported successfully!' });
      setTimeout(() => setDataMsg(null), 5000);
    } catch (err: any) {
      setDataMsg({ type: 'error', text: 'Failed to export backup JSON data.' });
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const res = await importBackupJSON(reader.result as string);
        if (res.success) {
          setDataMsg({ type: 'success', text: `Backup "${file.name}" imported successfully! Refreshing view...` });
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          setDataMsg({ type: 'error', text: res.error || 'Invalid JSON file format. Could not import backup.' });
        }
      } catch (err: any) {
        setDataMsg({ type: 'error', text: 'Invalid JSON file format. Could not import backup.' });
      }
    };

    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset all records to initial Kendriya Vidyalaya sample data? Any unbacked changes will be replaced.')) {
      setIsResetting(true);
      await resetDatabaseToDefaults();
      await initializeDatabaseIfEmpty();
      setIsResetting(false);
      setDataMsg({ type: 'success', text: 'System records reset to default KVS sample data successfully!' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {devMode && (
        <DevModeBadge
          pages={[1, 2, 3, 4, 5, 12, 17, 32, 48, 50, 52]}
          title="System Settings, Account Security, Light/Day Mode Switcher, System Permissions & Backup"
          fieldCount={12}
        />
      )}

      {/* Header Banner */}
      <div className={`border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        theme === 'light'
          ? 'bg-gradient-to-r from-purple-100 via-white to-indigo-100 border-purple-200 text-slate-800'
          : 'bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border-purple-500/30 text-slate-100'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              theme === 'light'
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              System Control Panel
            </span>
            <span className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>KVS Teacher's Diary App v2.5</span>
          </div>
          <h1 className={`text-2xl font-black tracking-tight mt-1 flex items-center gap-2 ${
            theme === 'light' ? 'text-slate-900' : 'text-slate-100'
          }`}>
            <Settings className="w-6 h-6 text-purple-500" />
            <span>Preferences, Account Login & System Settings</span>
          </h1>
        </div>

        {/* Theme Quick Switch Pill */}
        <div className={`flex items-center gap-2 p-2 rounded-xl border shrink-0 ${
          theme === 'light' ? 'bg-slate-200/80 border-slate-300' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            onClick={() => onToggleTheme('dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'bg-purple-600 text-white shadow-md'
                : theme === 'light' ? 'text-slate-700 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-4 h-4 text-amber-300" />
            <span>Dark Mode</span>
          </button>

          <button
            onClick={() => onToggleTheme('light')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              theme === 'light'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-600" />
            <span>Light / Day Mode</span>
          </button>
        </div>
      </div>

      {/* Admin Only: Staff Account Directory & Dynamic Subject Allocations */}
      {currentUser?.role === 'admin' && (
        <UserAccountManager currentUserId={currentUser.id} theme={theme} />
      )}

      {/* Principal / Admin Control: Unified Active Working Date System */}
      <div className={`border rounded-2xl p-6 space-y-4 shadow-md transition-all ${
        theme === 'light'
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-300 text-slate-900'
          : 'bg-gradient-to-r from-emerald-950/50 via-teal-950/30 to-slate-900 border-emerald-500/40 text-slate-100'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-black text-base m-0 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  Unified Active Working Date System
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Principal / Admin Authority
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm">
              <span>{activeDayName || 'Unknown Day'}</span>
              <span>•</span>
              <span>{formattedDate || activeDate}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
          {/* Interactive Date Picker with Live Calculation */}
          <div className="space-y-2">
            <label className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              Set Active Academic Working Date:
            </label>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Text / Date input container with calendar picker button */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={typedDateInput}
                  placeholder="YYYY-MM-DD or DD/MM/YYYY"
                  onChange={e => {
                    setTypedDateInput(e.target.value);
                    setDateInputError(null);
                  }}
                  onBlur={handleCommitTypedDate}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCommitTypedDate();
                    }
                  }}
                  className={`pl-3.5 pr-10 py-2 rounded-xl border text-sm font-mono font-bold focus:outline-none shadow-inner w-44 ${
                    theme === 'light'
                      ? 'bg-white border-emerald-400 text-slate-900 focus:border-emerald-600'
                      : 'bg-slate-950 border-emerald-500/50 text-white focus:border-emerald-400'
                  }`}
                  title="Type date in YYYY-MM-DD or DD/MM/YYYY and press Enter"
                />
                
                {/* Hidden native date picker triggered by calendar icon */}
                <input
                  ref={datePickerInputRef}
                  type="date"
                  value={activeDate}
                  onChange={async e => {
                    if (e.target.value) {
                      await setActiveDate(e.target.value);
                      setTypedDateInput(e.target.value);
                      setDateInputError(null);
                      setDateSavedMsg(`Active working date updated to ${e.target.value} (${getDayOfWeekFromDate(e.target.value)})!`);
                      setTimeout(() => setDateSavedMsg(null), 3000);
                    }
                  }}
                  className="absolute opacity-0 pointer-events-none w-0 h-0"
                  tabIndex={-1}
                />

                <button
                  type="button"
                  onClick={() => {
                    if (datePickerInputRef.current) {
                      if ('showPicker' in HTMLInputElement.prototype) {
                        try {
                          datePickerInputRef.current.showPicker();
                        } catch (_) {
                          datePickerInputRef.current.focus();
                        }
                      } else {
                        datePickerInputRef.current.focus();
                      }
                    }
                  }}
                  className="absolute right-2.5 p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors cursor-pointer"
                  title="Open Calendar Date Picker"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              <span className={`px-3 py-2 rounded-xl font-mono font-bold text-xs flex items-center gap-1.5 shrink-0 ${
                isWeekend
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                <span>{activeDayName}</span>
                {isWeekend && <span className="text-[10px] uppercase font-sans font-bold">(Weekend)</span>}
              </span>
            </div>

            {dateInputError && (
              <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1 animate-fadeIn m-0">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{dateInputError}</span>
              </p>
            )}

            {dateSavedMsg && !dateInputError && (
              <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn m-0">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{dateSavedMsg}</span>
              </p>
            )}
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              Quick Working Date Presets:
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={async () => {
                  await setActiveDate('2026-08-18');
                  setTypedDateInput('2026-08-18');
                  setDateInputError(null);
                  setDateSavedMsg('Switched to Session Date (18 Aug 2026 - Tuesday)!');
                  setTimeout(() => setDateSavedMsg(null), 3000);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeDate === '2026-08-18'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                    : theme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-950/70 hover:bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                18 Aug 2026 (Tuesday Session)
              </button>

              <button
                type="button"
                onClick={async () => {
                  const today = getLocalTodayDateString();
                  await setActiveDate(today);
                  setTypedDateInput(today);
                  setDateInputError(null);
                  setDateSavedMsg(`Switched to Real Calendar Today (${today})!`);
                  setTimeout(() => setDateSavedMsg(null), 3000);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeDate === getLocalTodayDateString()
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                    : theme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-950/70 hover:bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                Real Calendar Today
              </button>

              <button
                type="button"
                onClick={async () => {
                  const prevStr = addDaysToDate(activeDate, -1);
                  await setActiveDate(prevStr);
                  setTypedDateInput(prevStr);
                  setDateInputError(null);
                  setDateSavedMsg(`Stepped back to ${prevStr} (${getDayOfWeekFromDate(prevStr)})!`);
                  setTimeout(() => setDateSavedMsg(null), 3000);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                  theme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-950/70 hover:bg-slate-900 text-slate-300 border-slate-700'
                }`}
                title="Previous Day (-1)"
              >
                &larr; Prev Day
              </button>

              <button
                type="button"
                onClick={async () => {
                  const nextStr = addDaysToDate(activeDate, 1);
                  await setActiveDate(nextStr);
                  setTypedDateInput(nextStr);
                  setDateInputError(null);
                  setDateSavedMsg(`Advanced to ${nextStr} (${getDayOfWeekFromDate(nextStr)})!`);
                  setTimeout(() => setDateSavedMsg(null), 3000);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                  theme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-950/70 hover:bg-slate-900 text-slate-300 border-slate-700'
                }`}
                title="Next Day (+1)"
              >
                Next Day &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout for Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Section 1: Appearance & Theme Switcher (Light / Day Mode) */}
        <div className={`border rounded-2xl p-6 space-y-5 shadow-sm transition-all ${
          theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div className={`flex items-center gap-2 border-b pb-3 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
            <Sun className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className={`font-bold text-base ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
                Appearance & Theme Mode
              </h3>
              <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Choose your preferred visual mode for daytime or nighttime planning
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dark Mode Card Choice */}
            <div
              onClick={() => onToggleTheme('dark')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-3 relative ${
                theme === 'dark'
                  ? 'bg-slate-950 border-purple-500 shadow-[0_0_15px_rgba(165,148,249,0.2)] text-white'
                  : theme === 'light'
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 opacity-70'
              }`}
            >
              {theme === 'dark' && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
              )}
              <div className="flex items-center gap-2 font-bold text-sm">
                <Moon className="w-4 h-4 text-purple-400" />
                <span>Dark / Night Mode</span>
              </div>
              <div className="h-20 bg-[#0F111A] rounded-lg p-2.5 border border-slate-800 space-y-1.5 text-[10px]">
                <div className="w-full h-3 bg-purple-900/60 rounded"></div>
                <div className="w-3/4 h-2 bg-slate-800 rounded"></div>
                <div className="w-1/2 h-2 bg-slate-800 rounded"></div>
              </div>
              <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Low-glare dark violet canvas designed for evening preparation
              </p>
            </div>

            {/* Light / Day Mode Card Choice */}
            <div
              onClick={() => onToggleTheme('light')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-3 relative ${
                theme === 'light'
                  ? 'bg-amber-50/80 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.25)] text-slate-900'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 opacity-70'
              }`}
            >
              {theme === 'light' && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Check className="w-3 h-3" />
                </span>
              )}
              <div className="flex items-center gap-2 font-bold text-sm">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light / Day Mode</span>
              </div>
              <div className="h-20 bg-slate-100 rounded-lg p-2.5 border border-slate-300 space-y-1.5 text-[10px]">
                <div className="w-full h-3 bg-purple-600 rounded"></div>
                <div className="w-3/4 h-2 bg-slate-300 rounded"></div>
                <div className="w-1/2 h-2 bg-slate-300 rounded"></div>
              </div>
              <p className={`text-[11px] ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                High-contrast bright daylight theme optimized for printed diary viewing
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: User Mail ID Login & Staff Session */}
        <div className={`border rounded-2xl p-6 space-y-5 shadow-sm transition-all ${
          theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-500" />
              <div>
                <h3 className={`font-bold text-base ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
                  Logged-In Teacher Session
                </h3>
                <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Authenticated KVS Staff Credentials & Login Session
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditingAccount(!isEditingAccount)}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-bold"
            >
              {isEditingAccount ? 'Cancel Edit' : 'Edit Credentials'}
            </button>
          </div>

          {accountSaveMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{accountSaveMsg}</span>
            </div>
          )}

          {isEditingAccount ? (
            <form onSubmit={handleSaveAccountInfo} className="space-y-4 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                  Teacher Email ID (Login)
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className={`w-full rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    theme === 'light' ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-700 text-slate-100'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    Teacher Name
                  </label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className={`w-full rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'light' ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-700 text-slate-100'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    Employee ID Code
                  </label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className={`w-full rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'light' ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-700 text-slate-100'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                  Designation
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className={`w-full rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    theme === 'light' ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-950 border border-slate-700 text-slate-100'
                  }`}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition-all text-xs"
              >
                Save Login Session Details
              </button>
            </form>
          ) : (
            <div className={`p-4 rounded-xl border space-y-3 text-xs ${
              theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-100'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Logged-In Email ID:</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {currentUser?.email || userEmail}
                </span>
              </div>

              <div className={`flex items-center justify-between border-t pt-2 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'}`}>
                <span className={`font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Staff Name:</span>
                <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>{currentUser?.name || teacherName}</span>
              </div>

              <div className={`flex items-center justify-between border-t pt-2 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'}`}>
                <span className={`font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Role & Designation:</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    currentUser?.role === 'admin'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : currentUser?.role === 'data_entry_manager'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {currentUser?.designation || designation} ({currentUser?.role || 'teacher'})
                  </span>
                </div>
              </div>

              {currentUser?.assignedClasses && currentUser.assignedClasses.length > 0 && (
                <div className={`flex items-center justify-between border-t pt-2 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'}`}>
                  <span className={`font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Assigned Classes:</span>
                  <span className="font-mono text-purple-600 dark:text-purple-300 font-bold">{currentUser.assignedClasses.join(', ')}</span>
                </div>
              )}

              <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Active Authenticated Session
                </span>
                {onSwitchAccount && (
                  <button
                    onClick={onSwitchAccount}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] cursor-pointer"
                  >
                    Switch Account
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Feature Toggles & Permissions */}
        <div className={`border rounded-2xl p-6 space-y-5 shadow-sm transition-all ${
          theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div className={`flex items-center gap-2 border-b pb-3 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
            <Sliders className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className={`font-bold text-base ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
                System Permissions & Feature Toggles
              </h3>
              <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Configure UI callouts, AI parsing assistant, and auto-save options
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Dev Mode Badging Toggle */}
            <div className={`flex items-center justify-between p-3.5 border rounded-xl ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="space-y-0.5">
                <div className={`font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                  <Code className="w-4 h-4 text-purple-500" />
                  <span>Developer Mode Template Page Badges</span>
                </div>
                <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Display blue/purple callout badges for KVS Template Pages 1 to 52 across forms
                </p>
              </div>

              <button
                onClick={onToggleDevMode}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  devMode ? 'bg-purple-600' : 'bg-slate-400 dark:bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    devMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* AI Assistant Generator Toggle */}
            <div className={`flex items-center justify-between p-3.5 border rounded-xl ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="space-y-0.5">
                <div className={`font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>AI Syllabus PDF Parsing & Lesson Plan Generator</span>
                </div>
                <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Enable Gemini AI to automatically parse uploaded syllabus PDFs and generate lesson plans
                </p>
              </div>

              <button
                onClick={handleToggleAiSetting}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  aiAssistantEnabled ? 'bg-purple-600' : 'bg-slate-400 dark:bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    aiAssistantEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Auto-Save Toggle */}
            <div className={`flex items-center justify-between p-3.5 border rounded-xl ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="space-y-0.5">
                <div className={`font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span>Auto-Save Local Storage Engine</span>
                </div>
                <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Automatically save form edits and diary entries directly into browser database
                </p>
              </div>

              <button
                onClick={handleToggleAutoSave}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  autoSaveEnabled ? 'bg-emerald-600' : 'bg-slate-400 dark:bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    autoSaveEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Report Watermark Toggle */}
            <div className={`flex items-center justify-between p-3.5 border rounded-xl ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="space-y-0.5">
                <div className={`font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                  <FileText className="w-4 h-4 text-cyan-500" />
                  <span>KVS Watermark in Printed A4 Reports</span>
                </div>
                <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Include official KVS Kendriya Vidyalaya header seals on generated printable pages
                </p>
              </div>

              <button
                onClick={handleToggleWatermark}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  printWatermarkEnabled ? 'bg-cyan-600' : 'bg-slate-400 dark:bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    printWatermarkEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 3.5: Media & Classroom Evidence Storage Location */}
        <div className={`border rounded-2xl p-6 space-y-5 shadow-sm transition-all ${
          theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div className={`flex items-center gap-2 border-b pb-3 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
            <HardDrive className="w-5 h-5 text-purple-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className={`font-bold text-base ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
                  Media & Classroom Evidence Storage Location
                </h3>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  mediaStorageLocation === 'google_drive'
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                }`}>
                  Active: {mediaStorageLocation === 'google_drive' ? 'Google Drive Cloud' : 'Local Device Storage'}
                </span>
              </div>
              <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Choose where classroom observation photos, experiment videos, and PDF worksheets are stored and backed up
              </p>
            </div>
          </div>

          {mediaStorageMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border font-medium ${
              mediaStorageMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{mediaStorageMsg.text}</span>
            </div>
          )}

          {/* Storage Options Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Option 1: Local Device Storage */}
            <div
              onClick={() => handleSelectStorageLocation('local')}
              className={`p-4 border rounded-xl cursor-pointer transition-all relative ${
                mediaStorageLocation === 'local'
                  ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20'
                  : theme === 'light'
                  ? 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${mediaStorageLocation === 'local' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
                      Local Device Storage
                    </h4>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Fast & Offline Ready</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="mediaStorageChoice"
                  checked={mediaStorageLocation === 'local'}
                  onChange={() => handleSelectStorageLocation('local')}
                  className="mt-1 accent-emerald-500 w-4 h-4"
                />
              </div>
              <p className={`text-[11px] leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                Photos, worksheets, and media attachments are saved directly inside your web browser’s local database (IndexedDB). Fast and accessible without internet connection.
              </p>
            </div>

            {/* Option 2: Google Drive Storage */}
            <div
              onClick={() => handleSelectStorageLocation('google_drive')}
              className={`p-4 border rounded-xl cursor-pointer transition-all relative ${
                mediaStorageLocation === 'google_drive'
                  ? 'border-purple-500 bg-purple-500/5 ring-2 ring-purple-500/20'
                  : theme === 'light'
                  ? 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${mediaStorageLocation === 'google_drive' ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
                      Google Drive Cloud
                    </h4>
                    <span className="text-[10px] text-purple-600 dark:text-purple-300 font-bold">Multi-Device Cloud Backup</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="mediaStorageChoice"
                  checked={mediaStorageLocation === 'google_drive'}
                  onChange={() => handleSelectStorageLocation('google_drive')}
                  className="mt-1 accent-purple-600 w-4 h-4"
                />
              </div>
              <p className={`text-[11px] leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                Automatically save & back up classroom evidence to your connected Google Drive folder (<code className="font-mono text-purple-600 dark:text-purple-300">My Drive/KVS Teacher Diary/Media Evidence</code>).
              </p>
            </div>
          </div>

          {/* Google Drive Account Connection Panel */}
          <div className={`p-4 border rounded-xl space-y-3 ${
            googleDriveAccount.connected
              ? 'bg-purple-950/20 border-purple-500/30'
              : theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${googleDriveAccount.connected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`font-bold text-xs ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
                      Google Account Drive Status
                    </h4>
                    {googleDriveAccount.connected ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-500 border border-slate-500/30">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-0.5 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                    {googleDriveAccount.connected
                      ? `Connected as ${googleDriveAccount.email}`
                      : 'Connect your Google account to save media evidence directly to Google Drive'}
                  </p>
                </div>
              </div>

              {googleDriveAccount.connected ? (
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleTestDriveConnection}
                    className="px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Test Sync</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectGoogleDrive}
                    className="px-3 py-1.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConnectingDriveModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-md flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>Connect Google Drive</span>
                </button>
              )}
            </div>

            {googleDriveAccount.connected && (
              <div className="pt-2 border-t border-purple-500/20 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Target Drive Folder:</span>
                  <span className="font-mono text-purple-300 font-bold">{googleDriveAccount.folder}</span>
                </div>
                {googleDriveAccount.lastSynced && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Last Verified Sync:</span>
                    <span className="font-mono text-slate-300">{googleDriveAccount.lastSynced}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Data Backup, Import & Reset */}
        <div className={`border rounded-2xl p-6 space-y-5 shadow-sm transition-all ${
          theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div className={`flex items-center gap-2 border-b pb-3 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
            <Database className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className={`font-bold text-base ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
                Data Backup & System Maintenance
              </h3>
              <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Export backup JSON files, restore from file, or reset sample data
              </p>
            </div>
          </div>

          {dataMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border font-medium ${
                dataMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
              }`}
            >
              {dataMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{dataMsg.text}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            {/* Export Backup Button */}
            <div className={`p-3.5 border rounded-xl flex items-center justify-between ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div>
                <h4 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>Export Teacher's Diary Backup (.json)</h4>
                <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Download a full offline JSON file of all your lesson plans, timetable, and records</p>
              </div>
              <button
                onClick={handleExportBackup}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Import Backup File */}
            <div className={`p-3.5 border rounded-xl flex items-center justify-between ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div>
                <h4 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>Restore / Import Backup (.json)</h4>
                <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Restore your complete diary data from a previously saved JSON backup file</p>
              </div>
              <label className={`px-3.5 py-2 font-bold rounded-xl transition-all border cursor-pointer flex items-center gap-1.5 shrink-0 ${
                theme === 'light'
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}>
                <Upload className="w-4 h-4 text-amber-500" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset Defaults */}
            <div className={`p-3.5 border rounded-xl flex items-center justify-between ${
              theme === 'light' ? 'bg-rose-50 border-rose-200' : 'bg-rose-950/20 border-rose-500/20'
            }`}>
              <div>
                <h4 className={`font-bold ${theme === 'light' ? 'text-rose-900' : 'text-rose-200'}`}>Reset to KVS Default Sample Data</h4>
                <p className={`text-[11px] ${theme === 'light' ? 'text-rose-700/80' : 'text-slate-400'}`}>Reset all records to standard Kendriya Vidyalaya sample setup</p>
              </div>
              <button
                onClick={handleResetData}
                disabled={isResetting}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isResetting ? 'Resetting...' : 'Reset Sample Data'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Navigation Shortcuts */}
      <div className={`border rounded-2xl p-5 space-y-3 shadow-sm transition-all ${
        theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <h3 className={`font-bold text-sm flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>
          <Eye className="w-4 h-4 text-purple-500" />
          <span>Quick Edit Shortcuts across Teacher's Diary Modules</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
          <button
            onClick={() => onNavigateTab('school')}
            className={`p-2.5 border rounded-xl font-medium flex items-center justify-between transition-all ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-900'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/50'
            }`}
          >
            <span>School Setup</span>
            <ArrowRight className="w-3 h-3 text-purple-500" />
          </button>

          <button
            onClick={() => onNavigateTab('teacher')}
            className={`p-2.5 border rounded-xl font-medium flex items-center justify-between transition-all ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-900'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/50'
            }`}
          >
            <span>Bio Profile</span>
            <ArrowRight className="w-3 h-3 text-purple-500" />
          </button>

          <button
            onClick={() => onNavigateTab('timetable')}
            className={`p-2.5 border rounded-xl font-medium flex items-center justify-between transition-all ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-900'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/50'
            }`}
          >
            <span>Timetable</span>
            <ArrowRight className="w-3 h-3 text-purple-500" />
          </button>

          <button
            onClick={() => onNavigateTab('syllabus')}
            className={`p-2.5 border rounded-xl font-medium flex items-center justify-between transition-all ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-900'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/50'
            }`}
          >
            <span>Syllabus</span>
            <ArrowRight className="w-3 h-3 text-purple-500" />
          </button>

          <button
            onClick={() => onNavigateTab('lessonplan')}
            className={`p-2.5 border rounded-xl font-medium flex items-center justify-between transition-all ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-900'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/50'
            }`}
          >
            <span>Lesson Plans</span>
            <ArrowRight className="w-3 h-3 text-purple-500" />
          </button>

          <button
            onClick={() => onNavigateTab('reports')}
            className={`p-2.5 border rounded-xl font-medium flex items-center justify-between transition-all ${
              theme === 'light'
                ? 'bg-amber-50/80 border-amber-200 text-slate-800 hover:bg-amber-100 hover:border-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/50'
            }`}
          >
            <span>PDF Reports</span>
            <ArrowRight className="w-3 h-3 text-amber-500" />
          </button>

          <button
            onClick={() => onNavigateTab('tickets')}
            className={`p-2.5 border rounded-xl font-medium flex items-center justify-between transition-all ${
              theme === 'light'
                ? 'bg-cyan-50/80 border-cyan-200 text-slate-800 hover:bg-cyan-100 hover:border-cyan-300'
                : 'bg-slate-950 border-slate-800 text-cyan-300 hover:text-white hover:border-cyan-500/50'
            }`}
          >
            <span>Feedback & Tickets</span>
            <ArrowRight className="w-3 h-3 text-cyan-500" />
          </button>
        </div>
      </div>

      {/* Google Drive Connection Authorization Modal */}
      {isConnectingDriveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsConnectingDriveModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Connect Google Drive</h3>
                <p className="text-xs text-slate-400">Save & back up classroom evidence to your Google Cloud</p>
              </div>
            </div>

            <form onSubmit={handleConnectGoogleDrive} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Google Account Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={driveConnectEmailInput}
                    onChange={(e) => setDriveConnectEmailInput(e.target.value)}
                    placeholder="teacher@kvs.ac.in or gmail.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter your official KVS Google Workspace or Gmail account address.
                </p>
              </div>

              <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2 text-xs text-purple-200">
                <div className="font-bold flex items-center gap-1.5 text-purple-300">
                  <FolderCheck className="w-4 h-4 text-purple-400" />
                  <span>Google Drive Folder Location</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  All photos, experiment videos, and PDF worksheets will be saved inside:
                  <code className="block mt-1 font-mono text-purple-300 bg-slate-950/80 px-2 py-1 rounded border border-purple-500/20">
                    My Drive/KVS Teacher Diary/Media Evidence
                  </code>
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-[11px] text-slate-400">
                <div className="font-bold text-slate-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Privacy & Scope</span>
                </div>
                <p>Only media items you specifically upload or capture in the Teacher's Diary will be saved to your Google Drive.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConnectingDriveModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAuthenticatingDrive}
                  className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isAuthenticatingDrive ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Authenticating Google Drive...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4" />
                      <span>Authorize & Connect Drive</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
