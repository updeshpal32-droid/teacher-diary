import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  CalendarDays,
  GraduationCap,
  ArrowLeftRight,
  Briefcase,
  Layers,
  Award,
  CheckCircle2,
  Clock,
  Plus,
  FileCheck,
  AlertCircle,
  FileText,
  Search,
  BookOpen
} from 'lucide-react';
import { StaffDetailsManager } from '../StaffDetailsManager';
import { TeacherAttendanceManager } from '../TeacherAttendanceManager';
import { TeacherProfileForm } from '../TeacherProfileForm';
import StaffMeetingManager from '../StaffMeetingManager';
import { UserAccount } from '../../types/auth';
import { isAdminOrDataManager } from '../../lib/permissions';

interface StaffModuleProps {
  devMode: boolean;
  currentUser: UserAccount | null;
}

export type StaffSubTab =
  | 'directory'
  | 'profile'
  | 'attendance'
  | 'vacancy'
  | 'transfer'
  | 'samvida'
  | 'training'
  | 'meetings';

export const StaffModule: React.FC<StaffModuleProps> = ({ devMode, currentUser }) => {
  const [activeTab, setActiveTab] = useState<StaffSubTab>('directory');
  const isPrincipal = currentUser?.role === 'admin';
  const isStaffAdmin = isAdminOrDataManager(currentUser);

  // Training Sub-state
  const [trainingView, setTrainingView] = useState<string>(
    isPrincipal ? 'pending' : 'course_details'
  );

  return (
    <div className="space-y-4">
      {/* Staff Module Top Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/10 light:border-slate-200">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'directory'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Employee Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>My Profile (P-3 & 4)</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Teacher Attendance & Leave</span>
        </button>

        {isStaffAdmin && (
          <>
            <button
              onClick={() => setActiveTab('vacancy')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'vacancy'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Clear Vacancy</span>
            </button>

            <button
              onClick={() => setActiveTab('transfer')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'transfer'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>

            <button
              onClick={() => setActiveTab('samvida')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'samvida'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Samvida Sathi</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('training')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'training'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Training (CPD)</span>
        </button>

        <button
          onClick={() => setActiveTab('meetings')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'meetings'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-white/5 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-white/10'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Staff Meetings</span>
        </button>
      </div>

      {/* 1. Employee Directory */}
      {activeTab === 'directory' && <StaffDetailsManager devMode={devMode} currentUser={currentUser} />}

      {/* 2. My Profile */}
      {activeTab === 'profile' && <TeacherProfileForm devMode={devMode} />}

      {/* 3. Teacher Attendance & Leave */}
      {activeTab === 'attendance' && <TeacherAttendanceManager devMode={devMode} />}

      {/* 4. Clear Vacancy Hub */}
      {activeTab === 'vacancy' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
              <span className="text-xs text-slate-400">Total Sanctioned Posts</span>
              <div className="text-2xl font-bold text-slate-100 light:text-slate-900 mt-1">24</div>
              <span className="text-[10px] text-indigo-400">Teaching: 19 • Non-Teaching: 5</span>
            </div>
            <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
              <span className="text-xs text-slate-400">In-Position Staff</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">21</div>
              <span className="text-[10px] text-emerald-300">Regular: 18 • Contractual: 3</span>
            </div>
            <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
              <span className="text-xs text-slate-400">Clear Vacancies</span>
              <div className="text-2xl font-bold text-rose-400 mt-1">3</div>
              <span className="text-[10px] text-rose-300">TGT English, PRT Music, Lab Attendant</span>
            </div>
            <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
              <span className="text-xs text-slate-400">Portal Sync Status</span>
              <div className="text-sm font-bold text-purple-300 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>KVS e-PRAMAAN Synced</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
            <h3 className="text-sm font-bold text-slate-200 light:text-slate-800 mb-3">
              Cadre-wise Vacancy Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 light:border-slate-200 text-slate-400">
                    <th className="py-2.5 px-3">Cadre / Designation</th>
                    <th className="py-2.5 px-3 text-center">Sanctioned</th>
                    <th className="py-2.5 px-3 text-center">In-Position</th>
                    <th className="py-2.5 px-3 text-center">Vacant</th>
                    <th className="py-2.5 px-3">Subject / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 light:divide-slate-100 text-slate-200 light:text-slate-800">
                  <tr>
                    <td className="py-2 px-3 font-semibold">Principal I/c</td>
                    <td className="py-2 px-3 text-center">1</td>
                    <td className="py-2 px-3 text-center text-emerald-400">1</td>
                    <td className="py-2 px-3 text-center text-slate-400">0</td>
                    <td className="py-2 px-3 text-slate-400">Shri Hemananda Barik</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">PGT (Commerce/Sci/Humanities)</td>
                    <td className="py-2 px-3 text-center">6</td>
                    <td className="py-2 px-3 text-center text-emerald-400">6</td>
                    <td className="py-2 px-3 text-center text-slate-400">0</td>
                    <td className="py-2 px-3 text-emerald-400">All Filled</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">TGT (Trained Graduate Teacher)</td>
                    <td className="py-2 px-3 text-center">7</td>
                    <td className="py-2 px-3 text-center text-emerald-400">6</td>
                    <td className="py-2 px-3 text-center text-rose-400 font-bold">1</td>
                    <td className="py-2 px-3 text-rose-300">Vacant (TGT English)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">PRT (Primary Teacher)</td>
                    <td className="py-2 px-3 text-center">6</td>
                    <td className="py-2 px-3 text-center text-emerald-400">5</td>
                    <td className="py-2 px-3 text-center text-rose-400 font-bold">1</td>
                    <td className="py-2 px-3 text-rose-300">Vacant (PRT Music)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Non-Teaching Staff</td>
                    <td className="py-2 px-3 text-center">4</td>
                    <td className="py-2 px-3 text-center text-emerald-400">3</td>
                    <td className="py-2 px-3 text-center text-rose-400 font-bold">1</td>
                    <td className="py-2 px-3 text-rose-300">Vacant (Lab Attendant)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Transfer Management */}
      {activeTab === 'transfer' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
            <h3 className="text-sm font-bold text-slate-200 light:text-slate-800 mb-1">
              KVS Annual Transfer Cycle 2026
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Transfer application eligibility, displacement points, and regional cadre seniority.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-[11px] text-slate-400">Transfer Portal Status</span>
                <p className="text-sm font-bold text-emerald-400 mt-1">Application Window Open</p>
                <p className="text-[10px] text-slate-400 mt-1">Deadline: 15 Sept 2026</p>
              </div>
              <div className="p-3.5 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-[11px] text-slate-400">Eligible Faculty Count</span>
                <p className="text-sm font-bold text-purple-300 mt-1">8 Teachers (3+ Yrs at Station)</p>
                <p className="text-[10px] text-slate-400 mt-1">Station Priority: Hard / Very Hard (Kutra)</p>
              </div>
              <div className="p-3.5 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-[11px] text-slate-400">Relieving & Joining Ledger</span>
                <p className="text-sm font-bold text-slate-200 light:text-slate-800 mt-1">0 Pending Relievings</p>
                <p className="text-[10px] text-slate-400 mt-1">No LPC discrepancies reported</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Samvida Sathi (Contractual Teachers) */}
      {activeTab === 'samvida' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 light:text-slate-800">
                  Samvida Sathi • Contractual Faculty Management
                </h3>
                <p className="text-xs text-slate-400">
                  Ad-hoc / Contractual panel engagement, substitute billing, and daily duty log.
                </p>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contractual Teacher</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-[11px] text-slate-400">Active Contractual Staff</span>
                <div className="text-lg font-bold text-indigo-400 mt-0.5">3 Teachers</div>
              </div>
              <div className="p-3 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-[11px] text-slate-400">Daily Remuneration Rate</span>
                <div className="text-lg font-bold text-slate-200 light:text-slate-800 mt-0.5">₹1,050 / Day (TGT)</div>
              </div>
              <div className="p-3 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                <span className="text-[11px] text-slate-400">Monthly Billing Status</span>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">Verified & Processed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Training (CPD) Structure */}
      {activeTab === 'training' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-white/5 dark:bg-white/5 light:bg-white border-white/10 light:border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 light:border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  <span>Continuous Professional Development (CPD 50-Hours)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {isPrincipal ? 'Principal Oversight & Verification Portal' : 'Teacher Mandatory 50-Hour Annual CPD Portfolio'}
                </p>
              </div>

              {/* Sub-view Switcher */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-200">
                {!isPrincipal ? (
                  <>
                    <button
                      onClick={() => setTrainingView('course_details')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        trainingView === 'course_details'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white light:text-slate-600'
                      }`}
                    >
                      Course Details
                    </button>
                    <button
                      onClick={() => setTrainingView('add_course')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        trainingView === 'add_course'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white light:text-slate-600'
                      }`}
                    >
                      Add Course
                    </button>
                    <button
                      onClick={() => setTrainingView('cpd_certificate')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        trainingView === 'cpd_certificate'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white light:text-slate-600'
                      }`}
                    >
                      CPD Certificate
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setTrainingView('pending')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        trainingView === 'pending'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white light:text-slate-600'
                      }`}
                    >
                      Pending Approvals
                    </button>
                    <button
                      onClick={() => setTrainingView('approved')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        trainingView === 'approved'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white light:text-slate-600'
                      }`}
                    >
                      Approved Courses
                    </button>
                    <button
                      onClick={() => setTrainingView('summary')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        trainingView === 'summary'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white light:text-slate-600'
                      }`}
                    >
                      All Employees Summary
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Teacher View: Course Details */}
            {trainingView === 'course_details' && (
              <div className="mt-4 space-y-3">
                <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 light:bg-indigo-50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-300 light:text-indigo-900">
                      Annual CPD Progress: 38 / 50 Hours Completed (76%)
                    </span>
                    <p className="text-[11px] text-slate-400">12 hours remaining for NEP-2020 annual compliance.</p>
                  </div>
                  <div className="w-24 h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[76%]"></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">NISHTHA 3.0 (FLN Modules)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">Approved</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Conducted by NCERT / DIKSHA • 18 Hours</p>
                    <p className="text-[10px] text-slate-500 mt-2">Completed on 12 June 2026</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">KVS ZIET In-Service Workshop</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">Approved</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Conducted by ZIET Bhubaneswar • 20 Hours</p>
                    <p className="text-[10px] text-slate-500 mt-2">Completed on 04 July 2026</p>
                  </div>
                </div>
              </div>
            )}

            {/* Teacher View: Add Course Form Placeholder */}
            {trainingView === 'add_course' && (
              <div className="mt-4 p-4 rounded-xl border border-white/10 light:border-slate-200 bg-white/5 light:bg-slate-50 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 light:text-slate-800">Submit New Training Record</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Course / Workshop Title</label>
                    <input
                      type="text"
                      placeholder="e.g. CBSE Experiential Learning Course"
                      className="w-full px-3 py-2 rounded-xl bg-black/20 light:bg-white border border-white/10 light:border-slate-300 text-slate-200 light:text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Conducting Agency</label>
                    <input
                      type="text"
                      placeholder="e.g. NCERT / DIKSHA / KVS ZIET / CBSE"
                      className="w-full px-3 py-2 rounded-xl bg-black/20 light:bg-white border border-white/10 light:border-slate-300 text-slate-200 light:text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Duration (Hours)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      className="w-full px-3 py-2 rounded-xl bg-black/20 light:bg-white border border-white/10 light:border-slate-300 text-slate-200 light:text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Date of Certificate</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-xl bg-black/20 light:bg-white border border-white/10 light:border-slate-300 text-slate-200 light:text-slate-900"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                >
                  Submit for Principal Approval
                </button>
              </div>
            )}

            {/* Teacher View: CPD Certificate */}
            {trainingView === 'cpd_certificate' && (
              <div className="mt-4 p-8 text-center rounded-xl border border-dashed border-white/20 light:border-slate-300 bg-white/5 light:bg-slate-50 space-y-2">
                <FileCheck className="w-8 h-8 mx-auto text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-200 light:text-slate-800">Upload Digital CPD Certificates</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Drag & drop your DIKSHA / CBSE course PDF or PNG certificates for instant archiving.
                </p>
              </div>
            )}

            {/* Principal View: Pending Approvals */}
            {trainingView === 'pending' && (
              <div className="mt-4 space-y-2">
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 light:bg-amber-50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-300 light:text-amber-900">
                      Mrs. Ananya Patnaik • NEP-2020 Pedagogical Leadership (10 Hours)
                    </span>
                    <p className="text-[11px] text-slate-400">Submitted 2 days ago • DIKSHA Certificate Attached</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white cursor-pointer">
                      Approve
                    </button>
                    <button className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-700 text-slate-300 cursor-pointer">
                      Review
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Principal View: Approved Courses */}
            {trainingView === 'approved' && (
              <div className="mt-4 text-xs text-slate-400 p-4 rounded-xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200">
                18 Verified Faculty Training Submissions this academic session.
              </div>
            )}

            {/* Principal View: All Employees Summary */}
            {trainingView === 'summary' && (
              <div className="mt-4 p-4 rounded-xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 light:text-slate-800">Vidyalaya Faculty 50-Hour CPD Compliance</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span>Mrs. Ananya Patnaik (TGT)</span>
                    <span className="font-bold text-emerald-400">38 / 50 Hrs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shri Updesh Kumar (PGT)</span>
                    <span className="font-bold text-emerald-400">42 / 50 Hrs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Mrs. Sunita Verma (TGT)</span>
                    <span className="font-bold text-amber-400">28 / 50 Hrs</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Staff Meetings */}
      {activeTab === 'meetings' && <StaffMeetingManager devMode={devMode} />}
    </div>
  );
};
