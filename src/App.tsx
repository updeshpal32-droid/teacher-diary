import React, { useState, useEffect } from 'react';
import { db, initializeDatabaseIfEmpty, initCloudSync, TEMPLATE_PAGES_MAP, TEMPLATE_PAGES_MAP_FOUNDATIONAL } from './lib/storage';
import { TopNavBar, TopModuleKey } from './components/navigation/TopNavBar';
import { MobileSidebar } from './components/navigation/MobileSidebar';

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
import { StaffDetailRecord, TeacherProfile } from './types/academic';
import { UserAccount } from './types/auth';
import { getCurrentUser, setCurrentUser } from './lib/storage';
import { Sparkles, Loader2 } from 'lucide-react';

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

    const handleSchoolUpdate = async () => {
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

    const [user, inspectedTeacher] = await Promise.all([
      getCurrentUser(),
      getActiveInspectedTeacher()
    ]);

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
    } else if (['tickets'].includes(target)) {
      setActiveModule('tickets');
    } else if (['settings'].includes(target)) {
      setActiveModule('settings');
    } else {
      setActiveModule('dashboard');
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#0F111A] flex items-center justify-center text-purple-300 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Loading KVS Teacher Diary...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-100 dark:text-slate-100 light:text-slate-900 bg-[#0F111A] dark:bg-[#0B0D14] light:bg-[#F8FAFC] flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* 1. Desktop & Mobile New Navigation Shell */}
      <TopNavBar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        theme={theme}
        onToggleTheme={() => handleToggleTheme(theme === 'dark' ? 'light' : 'dark')}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onQuickTasksClick={() => setActiveModule('tasks')}
        onOpenVersionHistory={() => setIsVersionModalOpen(true)}
        onOpenInspector={() => setIsInspectorOpen(true)}
        devMode={devMode}
        onToggleDevMode={handleToggleDevMode}
      />

      {/* Mobile Drawer (12 Top Modules) */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        theme={theme}
      />

      {/* 2. Admin Inspecting Teacher Context Bar */}
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

      {/* 3. Main Workspace Container */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-3 sm:px-5 py-4 min-w-0">
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

          {activeModule === 'school' && <SchoolModule devMode={devMode} />}

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

          {activeModule === 'tasks' && <TasksModule devMode={devMode} />}

          {activeModule === 'tickets' && <TicketsModule devMode={devMode} />}

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
