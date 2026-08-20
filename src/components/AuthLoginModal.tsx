import React, { useState, useEffect } from 'react';
import { UserAccount, getRoleBadgeInfo } from '../types/auth';
import { getUserAccounts, setCurrentUser } from '../lib/storage';
import {
  ShieldCheck,
  User,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Sparkles,
  Building2,
  ChevronRight,
  BookOpen,
  Layers,
  ArrowRight,
  X,
  ArrowLeft
} from 'lucide-react';

interface AuthLoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: UserAccount) => void;
  onClose?: () => void;
}

export function AuthLoginModal({ isOpen, onLoginSuccess, onClose }: AuthLoginModalProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [emailOrCode, setEmailOrCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemoUser, setSelectedDemoUser] = useState<UserAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState<'all' | 'admin' | 'data_entry_manager' | 'teacher'>('all');

  useEffect(() => {
    loadAccounts();
  }, []);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadAccounts = async () => {
    const list = await getUserAccounts();
    setUsers(list);
    if (list.length > 0) {
      setSelectedDemoUser(list[0]);
      setEmailOrCode(list[0].email);
      setPassword(list[0].password || 'admin');
    }
  };

  if (!isOpen) return null;

  const handleSelectQuickAccount = (user: UserAccount) => {
    setSelectedDemoUser(user);
    setEmailOrCode(user.email);
    setPassword(user.password || (user.role === 'admin' ? 'admin' : user.role === 'data_entry_manager' ? 'data' : 'teacher'));
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const cleanInput = emailOrCode.trim().toLowerCase();
      const targetUser = users.find(
        u => u.email.toLowerCase() === cleanInput || u.employeeCode.toLowerCase() === cleanInput || u.name.toLowerCase().includes(cleanInput)
      );

      if (!targetUser) {
        setErrorMsg('No staff account found matching this Email or Employee Code.');
        setIsLoading(false);
        return;
      }

      if (!targetUser.isActive) {
        setErrorMsg('This staff account has been deactivated by the Administrator.');
        setIsLoading(false);
        return;
      }

      // Password Check (allows configured password, role password, 'kvs@123', or employee code)
      const validPasswords = [
        targetUser.password,
        targetUser.employeeCode,
        'kvs@123',
        targetUser.role === 'admin' ? 'admin' : targetUser.role === 'data_entry_manager' ? 'data' : 'teacher'
      ].filter(Boolean);

      if (password && !validPasswords.includes(password) && password !== 'admin' && password !== 'teacher' && password !== 'data') {
        setErrorMsg('Invalid password. Default passwords: admin / data / teacher / kvs@123.');
        setIsLoading(false);
        return;
      }

      // Update last login
      const updatedUser: UserAccount = {
        ...targetUser,
        lastLoginAt: new Date().toISOString()
      };
      await setCurrentUser(updatedUser);

      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(updatedUser);
      }, 250);
    } catch (err: any) {
      setErrorMsg('Login failed: ' + (err.message || 'Unknown error'));
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (activeRoleFilter !== 'all' && u.role !== activeRoleFilter) {
      return false;
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.employeeCode.toLowerCase().includes(q) ||
      u.designation.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto cursor-pointer"
      onClick={e => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      title={onClose ? "Click outside to close dialog" : undefined}
    >
      <div
        className="w-full max-w-4xl bg-slate-900 border border-[var(--glass-border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-8 animate-fadeIn relative cursor-default"
        onClick={e => e.stopPropagation()}
      >
        {/* Top-Right Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 hover:bg-rose-600/30 text-slate-400 hover:text-white border border-slate-700/70 hover:border-rose-500/50 transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center"
            title="Close / Back to Diary (Esc)"
            aria-label="Close modal dialog"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Left Side: School Branding & Portal Highlights */}
        <div className="md:w-5/12 bg-gradient-to-br from-purple-950/80 via-slate-900 to-indigo-950 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[var(--glass-border)] relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-serif text-white font-black text-xl shadow-lg shadow-purple-600/30">
                KV
              </div>
              <div>
                <h1 className="text-lg font-serif font-bold text-white tracking-wide">Kendriya Vidyalaya Kutra</h1>
                <p className="text-xs text-purple-300 font-medium">Official Digital Teacher's Diary (2026-27)</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>3-Tier Role Authentication</span>
              </div>
              <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
                Log in to access your role-specific modules, class timetables, daily lesson plan creator, practical registers, and marks entry.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5 text-gray-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-base leading-none">👑</span>
                <div>
                  <strong className="text-amber-300">Principal (Admin):</strong>
                  <div className="text-[11px] text-white">Sh. Hemananda Barik (Principal I/c)</div>
                  <div className="text-[10px] text-slate-400">Pass: <code className="text-amber-400">admin</code></div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-gray-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-base leading-none">📊</span>
                <div>
                  <strong className="text-cyan-300">Data Entry Manager:</strong>
                  <div className="text-[11px] text-white">Updesh Singh Pal (TGT P&HE)</div>
                  <div className="text-[10px] text-slate-400">Pass: <code className="text-cyan-400">data</code></div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-gray-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-base leading-none">👩‍🏫</span>
                <div>
                  <strong className="text-purple-300">Faculty Members (19 Teachers):</strong>
                  <div className="text-[11px] text-slate-300">All Regular & Contractual Staff</div>
                  <div className="text-[10px] text-slate-400">Pass: <code className="text-purple-300">teacher</code> or Emp Code</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-4 border-t border-purple-500/20 text-[10px] text-[var(--text-dim)] flex items-center justify-between">
            <span>KV Kutra • Code: 2218</span>
            <span>Academic Session 2026–27</span>
          </div>
        </div>

        {/* Right Side: Login Form & 1-Click Role Switcher */}
        <div className="md:w-7/12 p-6 md:p-8 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-white">Staff Login</h2>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">
                Select your name below or enter your Email / Employee ID:
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold animate-fadeIn flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-purple-200 mb-1">
                  Email ID or Employee Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={emailOrCode}
                    onChange={e => setEmailOrCode(e.target.value)}
                    placeholder="e.g. hemanandabarik18@gmail.com or 108894"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-purple-200">
                    Password
                  </label>
                  <span className="text-[10px] text-purple-400">Auto-filled on selection</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 rounded-xl bg-purple-950/40 border border-[var(--glass-border)] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-[var(--text-dim)] hover:text-white">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-purple-500/40 bg-purple-950/60 text-purple-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Remember session</span>
                </label>
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isLoading || !emailOrCode.trim()}
                  className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    isLoading || !emailOrCode.trim()
                      ? 'bg-purple-800/50 cursor-not-allowed text-gray-400'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30 active:scale-[0.99]'
                  }`}
                >
                  <span>{isLoading ? 'Authenticating...' : 'Sign In to Teacher\'s Diary'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 px-4 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Cancel & Return to Previous Screen</span>
                  </button>
                )}
              </div>
            </form>

            {/* Quick 1-Click Staff Switcher */}
            <div className="pt-3 space-y-2 border-t border-[var(--glass-border)]">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                  Select Staff Member ({users.length} Total):
                </span>
                {/* Role Filter Pills */}
                <div className="flex items-center gap-1">
                  {(['all', 'admin', 'data_entry_manager', 'teacher'] as const).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setActiveRoleFilter(role)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        activeRoleFilter === role
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {role === 'all' ? 'All' : role === 'admin' ? 'Principal' : role === 'data_entry_manager' ? 'DEM' : 'Teachers'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Staff Search Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, code, or designation..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-sans"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                {filteredUsers.map(u => {
                  const isSelected = selectedDemoUser?.id === u.id;
                  const badge = getRoleBadgeInfo(u.role, u.designation);

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectQuickAccount(u)}
                      className={`p-2 rounded-xl text-left text-xs border transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                        isSelected
                          ? 'bg-purple-950/80 border-purple-400 shadow-md ring-1 ring-purple-400'
                          : 'bg-purple-950/20 hover:bg-purple-950/40 border-[var(--glass-border)] hover:border-purple-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-white truncate text-xs">{u.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${badge.bg} ${badge.text} border ${badge.border} shrink-0`}>
                          {badge.icon} {badge.label}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 truncate flex items-center justify-between">
                        <span>{u.designation}</span>
                        <span className="font-mono text-purple-300">#{u.employeeCode}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2 text-center text-[10px] text-[var(--text-dim)]">
            Kendriya Vidyalaya Kutra • Session 2026-27 • NEP 2020 &amp; NCF-SE Compliant
          </div>
        </div>

      </div>
    </div>
  );
}
