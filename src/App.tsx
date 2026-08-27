import React, { useState, useEffect } from 'react';
import { db, initializeDatabaseIfEmpty, initCloudSync, TEMPLATE_PAGES_MAP, TEMPLATE_PAGES_MAP_FOUNDATIONAL } from './lib/storage';
import { LeftSidebar } from './components/navigation/LeftSidebar';
import { TopHeader } from './components/navigation/TopHeader';
import { TopModuleKey } from './components/navigation/TopNavBar';

// 12 Top-Level Modules
import { TeacherDashboard } from './components/TeacherDashboard';
import { SchoolModule } from './components/modules/SchoolModule';
import { StaffModule } from './components/modules/StaffModule';
import { StudentsModule } from './components/modules/StudentsModule';
import { RolesModule } from './components/modules/RolesModule';
import { TeacherDiaryModule } from './components/modules/TeacherDiaryModule';
import { TimetableModule } from './components/modules/TimetableModule';
import { AdmissionModule } from './components/modules/AdmissionModule';
import { OfficeModule } from './components/modules/OfficeModule';
import { TasksModule } from './components/modules/TasksModule';
import { TicketsModule } from './components/modules/TicketsModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { KvsCalendarManager } from './components/KvsCalendarManager';

// Shared Modals & Context Providers
import { ErrorBoundary } from './components/ErrorBoundary';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { TemplateMappingDrawer } from './components/TemplateMappingDrawer';
import { AdminTeacherContextBar } from './components/AdminTeacherContextBar';
import { RoleAssignmentModal, RoleAssignmentAction } from './components/RoleAssignmentModal';
import { AuthLoginModal } from './components/AuthLoginModal';
import { FloatingTicketButton } from './components/FloatingTicketButton';

import { getActiveInspectedTeacher, getTeacherScopedStorageKey } from './lib/teacherContext';
import { StaffDetailRecord, TeacherProfile, SchoolDetails } from './types/academic';
import { UserAccount } from './types/auth';
import { getCurrentUser, setCurrentUser, DEFAULT_SCHOOL } from './lib/storage';
import { KvsLogo } from './components/common/KvsLogo';
import { Sparkles } from 'lucide-react';

export type DiaryMode = 'middle-secondary' | 'foundational-preparatory';
export type TabKey = string;

export default function App() {
  const [activeModule, setActiveModuleState] = useState<TopModuleKey>('dashboard');
  const [historyStack, setHistoryStack] = useState<TopModuleKey[]>(['dashboard']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const setActiveModule = (newModule: TopModuleKey) => {
    setActiveModuleState(current => {
      if (newModule === current) return current;
      setHistoryStack(prev => {
        const trimmed = prev.slice(0, historyIndex + 1);
        return [...trimmed, newModule];
      });
      setHistoryIndex(prev => prev + 1);
      return newModule;
    });
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setActiveModuleState(historyStack[prevIdx]);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setActiveModuleState(historyStack[nextIdx]);
    }
  };

  // Environment & UI Preferences
  const [devMode, setDevMode] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Authentication & RBAC User State
  const [currentUser, setCurrentUserAccount] = useState<UserAccount | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [activeInspectedTeacher, setActiveInspectedTeacherState] = useState<StaffDetailRecord | null>(null);
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails>(DEFAULT_SCHOOL);

  // KVS Samagam Assign Roles Dropdown & Modal State (Admin Only)
  const [isAssignRolesModalOpen, setIsAssignRolesModalOpen] = useState<boolean>(false);
  const [assignRoleInitialAction, setAssignRoleInitialAction] = useState<RoleAssignmentAction>('class_teacher');
  const [assignRoleTargetRoleId, setAssignRoleTargetRoleId] = useState<string | undefined>(undefined);

  // Keyboard navigation shortcuts (Alt + ArrowLeft for Back, Alt + ArrowRight for Forward)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGoBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleGoForward();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, historyStack]);

  useEffect(() => {
    initApp();

    const handleSchoolUpdate = async (e?: any) => {
      if (e?.detail) {
        setSchoolDetails(e.detail);
      } else {
        const savedSchool = await db.get<SchoolDetails>('setup:school');
        if (savedSchool) setSchoolDetails(savedSchool);
      }

      const user = await getCurrentUser();
      if (user) {
        if (user.employeeCode) {
          const scopedKey = getTeacherScopedStorageKey('setup:teacher', user.employeeCode);
          const scopedTeacher = await db.get<TeacherProfile>(scopedKey);
          const staffList = (await db.get<StaffDetailRecord[]>('setup:staff_details')) || [];
          const stf = staffList.find(s => s.employeeCode === user.employeeCode);
          if (scopedTeacher?.name || stf?.name) {
            user.name = scopedTeacher?.name || stf?.name || user.name;
          }
          if (scopedTeacher?.designation || stf?.designation) {
            user.designation = scopedTeacher?.designation || stf?.designation || user.designation;
          }
        }
        setCurrentUserAccount({ ...user });
      }
    };

    const handleTeacherChanged = (e: any) => {
      setActiveInspectedTeacherState(e.detail as StaffDetailRecord | null);
    };

    const handleOpenCommittees = () => {
      setIsAssignRolesModalOpen(false);
      setActiveModule('roles');
    };

    window.addEventListener('kvs-school-updated', handleSchoolUpdate);
    window.addEventListener('kvs-auth-changed', handleSchoolUpdate);
    window.addEventListener('kvs-profile-request-resolved', handleSchoolUpdate);
    window.addEventListener('kvs-portfolios-updated', handleSchoolUpdate);
    window.addEventListener('kvs-timetable-updated', handleSchoolUpdate);
    window.addEventListener('kvs-active-teacher-changed', handleTeacherChanged);
    window.addEventListener('open-committees-directory', handleOpenCommittees);

    return () => {
      window.removeEventListener('kvs-school-updated', handleSchoolUpdate);
      window.removeEventListener('kvs-auth-changed', handleSchoolUpdate);
      window.removeEventListener('kvs-profile-request-resolved', handleSchoolUpdate);
      window.removeEventListener('kvs-portfolios-updated', handleSchoolUpdate);
      window.removeEventListener('kvs-timetable-updated', handleSchoolUpdate);
      window.removeEventListener('kvs-active-teacher-changed', handleTeacherChanged);
      window.removeEventListener('open-committees-directory', handleOpenCommittees);
    };
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const initApp = async () => {
    await initCloudSync();
    await initializeDatabaseIfEmpty();
    const savedTheme = await db.get<'dark' | 'light'>('settings:theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }

    const [user, inspectedTeacher, savedSchool] = await Promise.all([
      getCurrentUser(),
      getActiveInspectedTeacher(),
      db.get<SchoolDetails>('setup:school')
    ]);

    if (savedSchool) {
      setSchoolDetails(savedSchool);
    }

    if (user) {
      const savedPersona = await db.get<'teacher' | 'data_entry_manager' | 'admin'>(`settings:active_persona:${user.employeeCode || user.id}`);
      if (savedPersona) {
        user.activePersona = savedPersona;
      } else if (user.role === 'data_entry_manager') {
        user.activePersona = 'teacher';
      }
      const userDevMode = await db.get<boolean>(`settings:dev_mode:${user.employeeCode || user.id}`);
      setDevMode(userDevMode ?? false);
    } else {
      const guestDevMode = await db.get<boolean>('settings:dev_mode:guest');
      setDevMode(guestDevMode ?? false);
    }

    setCurrentUserAccount(user);

    if (inspectedTeacher && user?.role === 'admin') {
      setActiveInspectedTeacherState(inspectedTeacher);
    }
    if (!user) {
      setIsLoginModalOpen(true);
    }

    setInitialized(true);
  };

  const handleLoginSuccess = async (user: UserAccount) => {
    const savedPersona = await db.get<'teacher' | 'data_entry_manager' | 'admin'>(`settings:active_persona:${user.employeeCode || user.id}`);
    if (savedPersona) {
      user.activePersona = savedPersona;
    } else if (user.role === 'data_entry_manager') {
      user.activePersona = 'teacher';
    }

    setCurrentUserAccount(user);
    setIsLoginModalOpen(false);

    if (user.role !== 'admin') {
      setActiveInspectedTeacherState(null);
    }

    const userDevMode = await db.get<boolean>(`settings:dev_mode:${user.employeeCode || user.id}`);
    setDevMode(userDevMode ?? false);

    window.dispatchEvent(new CustomEvent('kvs-auth-changed', { detail: user }));
    window.dispatchEvent(new CustomEvent('kvs-active-teacher-changed', { detail: user.role === 'admin' ? activeInspectedTeacher : null }));

    setActiveModule('dashboard');
  };

  const handleSwitchPersona = async (persona: 'teacher' | 'data_entry_manager' | 'admin') => {
    if (!currentUser) return;
    const updatedUser: UserAccount = {
      ...currentUser,
      activePersona: persona
    };
    setCurrentUserAccount(updatedUser);
    await setCurrentUser(updatedUser);
    await db.set(`settings:active_persona:${currentUser.employeeCode || currentUser.id}`, persona);
    window.dispatchEvent(new CustomEvent('kvs-auth-changed', { detail: updatedUser }));
  };

  const handleToggleDevMode = async () => {
    const nextVal = !devMode;
    setDevMode(nextVal);
    if (currentUser) {
      await db.set(`settings:dev_mode:${currentUser.employeeCode || currentUser.id}`, nextVal);
    } else {
      await db.set('settings:dev_mode:guest', nextVal);
    }
  };

  const handleLogout = async () => {
    await setCurrentUser(null);
    setCurrentUserAccount(null);
    setIsLoginModalOpen(true);
  };

  const handleToggleTheme = async (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    await db.set('settings:theme', newTheme);
  };

  /**
   * Intelligent mapper for legacy child tab navigations
   */
  const handleLegacyNavigation = (target: string) => {
    if (['dashboard'].includes(target)) {
      setActiveModule('dashboard');
    } else if (['school', 'sessions', 'calendar', 'classes'].includes(target)) {
      setActiveModule('school');
    } else if (['staff', 'teacher', 'attendance', 'teacher_attendance'].includes(target)) {
      setActiveModule('staff');
    } else if (['students', 'student_enrollment', 'student_observations', 'remedial_exemplary_20_21', 'remedial_teaching_20', 'exemplary_21'].includes(target)) {
      setActiveModule('students');
    } else if (['portfolios', 'my_portfolios', 'roles', 'subject_meeting'].includes(target)) {
      setActiveModule('roles');
    } else if (['diary', 'syllabus', 'lessonplan', 'assessment', 'exams', 'result_analysis_vi_xii', 'result_analysis_vi_x', 'result_analysis_xi_xii', 'pedagogical_28_30', 'inspection', 'reports', 'monitoring', 'nipun', 'scholastic_1_2', 'notebook_3_5', 'sea_3_5', 'scholastic_3_5_t1', 'scholastic_3_5_t2', 'result_analysis', 'orf_tara', 'ptm_meeting'].includes(target)) {
      setActiveModule('diary');
    } else if (['timetable', 'workload', 'duty_proxy'].includes(target)) {
      setActiveModule('timetable');
    } else if (['admission'].includes(target)) {
      setActiveModule('admission');
    } else if (['office'].includes(target)) {
      setActiveModule('office');
    } else if (['tasks', 'taskmanager'].includes(target)) {
      setActiveModule('tasks');
    } else if (['settings', 'tickets'].includes(target)) {
      setActiveModule('settings');
    } else {
      setActiveModule('dashboard');
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#0B0D14] flex flex-col items-center justify-center relative overflow-hidden select-none">
        {/* Ambient atmospheric glows */}
        <div className="absolute w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse pointer-events-none -top-10 -left-10" />
        <div className="absolute w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse pointer-events-none -bottom-10 -right-10" style={{ animationDelay: '1s' }} />

        {/* Central Animated Orbital Emblem with KVS / School Logo */}
        <div className="relative flex items-center justify-center">
          {/* Outer glowing aura */}
          <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-indigo-500/30 via-purple-500/30 to-amber-500/30 blur-xl animate-pulse" />
          
          {/* Outer Spinning Dashed Orbit Ring */}
          <div className="absolute w-32 h-32 rounded-full border-2 border-dashed border-purple-500/40 animate-spin" style={{ animationDuration: '6s' }} />

          {/* Reverse Spinning Gradient Arc Ring */}
          <div className="absolute w-24 h-24 rounded-full border-2 border-t-indigo-400 border-r-transparent border-b-purple-400 border-l-transparent animate-spin" style={{ animationDuration: '2.2s', animationDirection: 'reverse' }} />

          {/* Core Floating Glowing Icon Card */}
          <div className="relative p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 border border-purple-500/40 transform animate-bounce" style={{ animationDuration: '2.5s' }}>
            <KvsLogo logoUrl={schoolDetails.logoUrl} size="lg" isDark={true} />
          </div>
        </div>

        {/* Dynamic 3-Dot Wave Pulse (No text) */}
        <div className="mt-8 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  const isDark = theme !== 'light';

  return (
    <div className={`min-h-screen font-sans flex selection:bg-indigo-500 selection:text-white transition-colors duration-200 ${
      isDark ? 'bg-[#0B0D14] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* 1. Modern Collapsible Left Sidebar (Desktop + Mobile Slide-in Drawer) */}
      <LeftSidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onNavigateTab={handleLegacyNavigation}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={() => handleToggleTheme(theme === 'dark' ? 'light' : 'dark')}
        onOpenVersionHistory={() => setIsVersionModalOpen(true)}
        onOpenInspector={() => setIsInspectorOpen(true)}
        devMode={devMode}
        onToggleDevMode={handleToggleDevMode}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Content Column (TopHeader + Dynamic Content Area) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <TopHeader
          activeModule={activeModule}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          theme={theme}
          onToggleTheme={() => handleToggleTheme(theme === 'dark' ? 'light' : 'dark')}
          currentUser={currentUser}
          onOpenVersionHistory={() => setIsVersionModalOpen(true)}
          onOpenInspector={() => setIsInspectorOpen(true)}
          devMode={devMode}
          onToggleDevMode={handleToggleDevMode}
          onNavigateTab={handleLegacyNavigation}
        />

        {/* Admin Inspecting Teacher Context Bar */}
        {currentUser?.role === 'admin' && (
          <AdminTeacherContextBar
            activeTeacher={activeInspectedTeacher}
            onSelectTeacher={setActiveInspectedTeacherState}
            onNavigateTab={handleLegacyNavigation}
            activeTab={activeModule}
            onOpenRoleAssignment={(action, roleId) => {
              setAssignRoleInitialAction(action);
              setAssignRoleTargetRoleId(roleId);
              setIsAssignRolesModalOpen(true);
            }}
          />
        )}

        {/* Main Workspace Container */}
        <main className="flex-1 w-full max-w-[1720px] mx-auto px-3 sm:px-6 py-4 min-w-0">
          <ErrorBoundary fallbackTitle="Module View Error">
            {activeModule === 'dashboard' && (
              <TeacherDashboard
                key={`${currentUser?.id || 'guest'}-${currentUser?.activePersona || 'default'}`}
                currentUser={currentUser}
                devMode={devMode}
                onNavigateTab={handleLegacyNavigation}
                onSwitchPersona={handleSwitchPersona}
              />
            )}

            {activeModule === 'school' && <SchoolModule devMode={devMode} theme={theme} />}

            {activeModule === 'calendar' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 m-0">
                      <span>📅 KVS Academic Calendar 2026-27</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">View-Only</span>
                    </h3>
                    <p className="text-xs text-slate-400 m-0">
                      Official Kendriya Vidyalaya Sangathan academic schedule, holidays, exam dates & celebrations.
                    </p>
                  </div>
                </div>
                <KvsCalendarManager devMode={devMode} />
              </div>
            )}

            {activeModule === 'staff' && (
              <StaffModule
                devMode={devMode}
                currentUser={currentUser}
              />
            )}

            {activeModule === 'students' && (
              <StudentsModule
                devMode={devMode}
                currentUser={currentUser}
              />
            )}

            {activeModule === 'roles' && (
              <RolesModule
                devMode={devMode}
                currentUser={currentUser}
                onOpenAssignModal={() => setIsAssignRolesModalOpen(true)}
              />
            )}

            {activeModule === 'diary' && (
              <TeacherDiaryModule
                devMode={devMode}
                theme={theme}
                currentUser={currentUser}
                activeInspectedTeacher={activeInspectedTeacher}
                onOpenReportGenerator={() => setActiveModule('diary')}
              />
            )}

            {activeModule === 'timetable' && (
              <TimetableModule
                devMode={devMode}
                currentUser={currentUser}
              />
            )}

            {activeModule === 'admission' && <AdmissionModule devMode={devMode} />}

            {activeModule === 'office' && <OfficeModule devMode={devMode} />}

            {activeModule === 'tasks' && <TasksModule devMode={devMode} currentUser={currentUser} />}

            {activeModule === 'settings' && (
              <SettingsModule
                devMode={devMode}
                onToggleDevMode={handleToggleDevMode}
                theme={theme}
                onToggleTheme={handleToggleTheme}
                currentUser={currentUser}
                onSwitchAccount={() => setIsLoginModalOpen(true)}
                onNavigateTab={handleLegacyNavigation}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* 4. Global Modals & Utilities */}
      <TemplateMappingDrawer
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        diaryMode="middle-secondary"
        templatePages={TEMPLATE_PAGES_MAP}
      />

      <VersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        onDataRestored={() => initApp()}
      />

      <AuthLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <RoleAssignmentModal
        isOpen={isAssignRolesModalOpen}
        onClose={() => setIsAssignRolesModalOpen(false)}
        initialAction={assignRoleInitialAction}
        targetRoleId={assignRoleTargetRoleId}
        onOpenCommitteesDirectory={() => {
          setIsAssignRolesModalOpen(false);
          setActiveModule('roles');
        }}
      />

      <FloatingTicketButton
        currentUser={currentUser}
        currentTab={activeModule}
        onNavigateTab={handleLegacyNavigation}
      />
    </div>
  );
}
