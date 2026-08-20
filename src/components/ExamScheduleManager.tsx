import React, { useState, useEffect } from 'react';
import { ExamSchedule } from '../types/academic';
import { db, DEFAULT_EXAMS } from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import { FileText, Plus, Edit2, Trash2, Save, RotateCcw, CheckCircle, AlertCircle, Award } from 'lucide-react';

interface ExamScheduleManagerProps {
  devMode: boolean;
  onSaved?: () => void;
}

export const ExamScheduleManager: React.FC<ExamScheduleManagerProps> = ({ devMode, onSaved }) => {
  const [exams, setExams] = useState<ExamSchedule[]>(DEFAULT_EXAMS);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editExam, setEditExam] = useState<ExamSchedule>({
    id: '',
    examName: 'Periodic Test 1 (PT-1)',
    classLevel: 'Classes IX & X',
    subjectName: 'Mathematics (041)',
    examDate: '2025-07-21',
    maxMarks: 40,
    passingMarks: 14,
    instructions: 'Covers Chapters 1 to 3.'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const saved = await db.get<ExamSchedule[]>('setup:exams');
    if (saved) setExams(saved);
    setLoading(false);
  };

  const handleSaveExam = async () => {
    if (!editExam.examName.trim() || !editExam.subjectName.trim()) {
      alert('Exam name and Subject are required.');
      return;
    }

    let updated = [...exams];
    if (editExam.id) {
      updated = updated.map(e => (e.id === editExam.id ? editExam : e));
    } else {
      updated.push({ ...editExam, id: `ex-${Date.now()}` });
    }

    setExams(updated);
    await db.set('setup:exams', updated);
    setIsModalOpen(false);
    setMsg({ type: 'success', text: 'Exam schedule updated successfully.' });
    if (onSaved) onSaved();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDeleteExam = async (id: string) => {
    if (window.confirm('Delete this examination schedule?')) {
      const updated = exams.filter(e => e.id !== id);
      setExams(updated);
      await db.set('setup:exams', updated);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset examination schedule to KVS standard assessment structure?')) {
      setExams(DEFAULT_EXAMS);
      await db.set('setup:exams', DEFAULT_EXAMS);
      setMsg({ type: 'success', text: 'Reset to standard KVS exam schedule.' });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-purple-300">Loading Examination Schedules...</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {devMode && (
        <DevModeBadge
          pages={[22, 24, 26, 27, 28]}
          title="Digitizes Template Pages 22-28: Section 17 Scholastic Assessment Structures & Exam Schedules"
          fieldCount={exams.length}
        />
      )}

      {msg && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
            msg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="td-card">
        <div className="td-card-head">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3>Examination & Scholastic Assessment Planner</h3>
              <p className="text-xs text-[var(--text-dim)] m-0">
                PT-1, PT-2, Half Yearly, Pre-Boards, and Annual CBSE Board Exam schedules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="td-btn-ghost text-xs py-2">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Auto-Fill KVS Exams</span>
            </button>
            <button
              onClick={() => {
                setEditExam({
                  id: '',
                  examName: 'Periodic Test 1 (PT-1)',
                  classLevel: 'Classes IX & X',
                  subjectName: 'Mathematics (041)',
                  examDate: '2025-07-21',
                  maxMarks: 40,
                  passingMarks: 14,
                  instructions: ''
                });
                setIsModalOpen(true);
              }}
              className="td-add-btn text-xs py-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Exam Schedule</span>
            </button>
          </div>
        </div>

        {/* Exams Table */}
        <div className="overflow-x-auto">
          <table className="td-tt">
            <thead>
              <tr>
                <th className="text-left">Examination Title</th>
                <th>Class Level</th>
                <th className="text-left">Subject</th>
                <th className="w-32">Exam Date</th>
                <th>Max Marks</th>
                <th>Passing Marks</th>
                <th className="text-left">Assessment Guidelines</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(ex => (
                <tr key={ex.id}>
                  <td className="text-left font-semibold text-[var(--text-main)]">
                    {ex.examName}
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30">
                      {ex.classLevel}
                    </span>
                  </td>
                  <td className="text-left font-medium text-purple-200">{ex.subjectName}</td>
                  <td className="font-mono text-xs text-purple-300">{ex.examDate}</td>
                  <td className="font-mono font-bold text-[var(--text-main)]">{ex.maxMarks}</td>
                  <td className="font-mono font-bold text-emerald-400">{ex.passingMarks}</td>
                  <td className="text-left text-xs text-[var(--text-dim)]">{ex.instructions}</td>
                  <td>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditExam(ex);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-200"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExam(ex.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="td-modal">
          <div className="td-modal-body">
            <div className="td-modal-head">
              <h2>{editExam.id ? 'Edit Exam Schedule' : 'Add Exam Schedule'}</h2>
              <button onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div className="p-8 td-form">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Examination Name</label>
                  <select
                    value={editExam.examName}
                    onChange={e => setEditExam({ ...editExam, examName: e.target.value })}
                  >
                    <option value="Periodic Test 1 (PT-1)">Periodic Test 1 (PT-1)</option>
                    <option value="Periodic Test 2 (PT-2)">Periodic Test 2 (PT-2)</option>
                    <option value="Half Yearly Examination">Half Yearly Examination</option>
                    <option value="Periodic Test 3 (PT-3)">Periodic Test 3 (PT-3)</option>
                    <option value="Pre-Board 1 (PB-1)">Pre-Board 1 (PB-1)</option>
                    <option value="Pre-Board 2 (PB-2)">Pre-Board 2 (PB-2)</option>
                    <option value="AISSE / Board Exam (Class X)">AISSE / Board Exam (Class X)</option>
                    <option value="AISSCE / Board Exam (Class XII)">AISSCE / Board Exam (Class XII)</option>
                  </select>
                </div>
                <div>
                  <label>Class Level</label>
                  <input
                    type="text"
                    value={editExam.classLevel}
                    onChange={e => setEditExam({ ...editExam, classLevel: e.target.value })}
                    placeholder="e.g. Classes IX & X"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Subject</label>
                  <input
                    type="text"
                    value={editExam.subjectName}
                    onChange={e => setEditExam({ ...editExam, subjectName: e.target.value })}
                    placeholder="e.g. Mathematics (041)"
                  />
                </div>
                <div>
                  <label>Exam Date</label>
                  <input
                    type="date"
                    value={editExam.examDate}
                    onChange={e => setEditExam({ ...editExam, examDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Maximum Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={editExam.maxMarks}
                    onChange={e => setEditExam({ ...editExam, maxMarks: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div>
                  <label>Passing Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={editExam.passingMarks}
                    onChange={e => setEditExam({ ...editExam, passingMarks: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label>Assessment Guidelines / Instructions</label>
                <textarea
                  rows={2}
                  value={editExam.instructions || ''}
                  onChange={e => setEditExam({ ...editExam, instructions: e.target.value })}
                  placeholder="e.g. Written Test (40) + Subject Enrichment (5) + Portfolio (5)..."
                />
              </div>
            </div>
            <div className="td-modal-foot">
              <button onClick={() => setIsModalOpen(false)} className="td-btn-ghost">
                Cancel
              </button>
              <button onClick={handleSaveExam} className="td-add-btn">
                <Save className="w-4 h-4" />
                <span>Save Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
