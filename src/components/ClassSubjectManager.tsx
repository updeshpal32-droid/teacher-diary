import React, { useState, useEffect } from 'react';
import { ClassSection, SubjectItem } from '../types/academic';
import { db, DEFAULT_CLASSES, DEFAULT_SUBJECTS } from '../lib/storage';
import { DevModeBadge } from './DevModeBadge';
import { BookOpen, Users, Plus, Edit2, Trash2, Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

interface ClassSubjectManagerProps {
  devMode: boolean;
  onSaved?: () => void;
}

export const ClassSubjectManager: React.FC<ClassSubjectManagerProps> = ({ devMode, onSaved }) => {
  const [classes, setClasses] = useState<ClassSection[]>(DEFAULT_CLASSES);
  const [subjects, setSubjects] = useState<SubjectItem[]>(DEFAULT_SUBJECTS);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editClass, setEditClass] = useState<ClassSection>({
    id: '',
    className: 'X',
    section: 'A',
    classTeacherName: '',
    totalStudents: 40
  });

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<SubjectItem>({
    id: '',
    subjectName: 'Mathematics',
    subjectCode: '041',
    classLevel: 'IX & X',
    targetPassRate: 100,
    targetA1Count: 15
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const savedCls = await db.get<ClassSection[]>('setup:classes');
    if (savedCls) setClasses(savedCls);

    const savedSbj = await db.get<SubjectItem[]>('setup:subjects');
    if (savedSbj) setSubjects(savedSbj);
    setLoading(false);
  };

  const handleSaveClass = async () => {
    if (!editClass.className.trim() || !editClass.section.trim()) {
      alert('Class name and Section are required.');
      return;
    }

    let updated = [...classes];
    if (editClass.id) {
      updated = updated.map(c => (c.id === editClass.id ? editClass : c));
    } else {
      updated.push({ ...editClass, id: `cls-${Date.now()}` });
    }

    setClasses(updated);
    await db.set('setup:classes', updated);
    setIsClassModalOpen(false);
    setMsg({ type: 'success', text: 'Class & Section updated.' });
    if (onSaved) onSaved();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDeleteClass = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this class section?')) {
      const updated = classes.filter(c => c.id !== id);
      setClasses(updated);
      await db.set('setup:classes', updated);
    }
  };

  const handleSaveSubject = async () => {
    if (!editSubject.subjectName.trim() || !editSubject.subjectCode.trim()) {
      alert('Subject Name and CBSE Subject Code are required.');
      return;
    }

    let updated = [...subjects];
    if (editSubject.id) {
      updated = updated.map(s => (s.id === editSubject.id ? editSubject : s));
    } else {
      updated.push({ ...editSubject, id: `sbj-${Date.now()}` });
    }

    setSubjects(updated);
    await db.set('setup:subjects', updated);
    setIsSubjectModalOpen(false);
    setMsg({ type: 'success', text: 'Subject item saved successfully.' });
    if (onSaved) onSaved();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDeleteSubject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      const updated = subjects.filter(s => s.id !== id);
      setSubjects(updated);
      await db.set('setup:subjects', updated);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset Classes and Subjects to default KVS template setup?')) {
      setClasses(DEFAULT_CLASSES);
      setSubjects(DEFAULT_SUBJECTS);
      await db.set('setup:classes', DEFAULT_CLASSES);
      await db.set('setup:subjects', DEFAULT_SUBJECTS);
      setMsg({ type: 'success', text: 'Reset to default KVS setup.' });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-purple-300">Loading Classes & Subjects...</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {devMode && (
        <DevModeBadge
          pages={[4, 12, 21, 22, 24, 26, 27, 28]}
          title="Digitizes Template Pages 21-28 Student Directories & Assessment Subject Structures"
          fieldCount={12}
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

      {/* Classes & Sections Section */}
      <div className="td-card">
        <div className="td-card-head">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3>Class & Section Directory</h3>
              <p className="text-xs text-[var(--text-dim)] m-0">
                Managed class rosters, assigned class teachers, and roll strengths
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="td-btn-ghost text-xs py-2">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={() => {
                setEditClass({
                  id: '',
                  className: 'VIII',
                  section: 'A',
                  classTeacherName: '',
                  totalStudents: 40
                });
                setIsClassModalOpen(true);
              }}
              className="td-add-btn text-xs py-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class Section</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {classes.map(cls => (
            <div
              key={cls.id}
              className="p-5 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] hover:border-purple-500/40 transition-all space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-bold">
                    Class & Sec
                  </span>
                  <div className="font-serif text-2xl font-bold text-[var(--text-main)]">
                    {cls.className} - {cls.section}
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
                  {cls.totalStudents} Students
                </div>
              </div>

              <div className="text-xs text-[var(--text-dim)] font-mono space-y-1">
                <div>Class Teacher:</div>
                <div className="text-[var(--text-main)] font-semibold truncate">
                  {cls.classTeacherName || 'Unassigned'}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--glass-border)]">
                <button
                  onClick={() => {
                    setEditClass(cls);
                    setIsClassModalOpen(true);
                  }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-purple-200 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteClass(cls.id)}
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subjects Catalog */}
      <div className="td-card">
        <div className="td-card-head">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3>CBSE Subject Catalog & Pass Targets</h3>
              <p className="text-xs text-[var(--text-dim)] m-0">
                Subject codes, class level mappings, and academic target benchmarks
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditSubject({
                id: '',
                subjectName: 'Mathematics',
                subjectCode: '041',
                classLevel: 'IX & X',
                targetPassRate: 100,
                targetA1Count: 15
              });
              setIsSubjectModalOpen(true);
            }}
            className="td-add-btn text-xs py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Subject</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="td-tt">
            <thead>
              <tr>
                <th className="text-left">Subject Name</th>
                <th>CBSE Code</th>
                <th>Class Level</th>
                <th>Target Pass %</th>
                <th>Target A1 Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(sbj => (
                <tr key={sbj.id}>
                  <td className="text-left font-semibold text-[var(--text-main)]">
                    {sbj.subjectName}
                  </td>
                  <td className="font-mono text-purple-300">{sbj.subjectCode}</td>
                  <td className="text-[var(--text-dim)]">{sbj.classLevel}</td>
                  <td className="font-mono text-emerald-400 font-bold">{sbj.targetPassRate}%</td>
                  <td className="font-mono text-purple-300 font-bold">{sbj.targetA1Count}</td>
                  <td>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditSubject(sbj);
                          setIsSubjectModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-200 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(sbj.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors"
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

      {/* Class Modal */}
      {isClassModalOpen && (
        <div className="td-modal">
          <div className="td-modal-body">
            <div className="td-modal-head">
              <h2>{editClass.id ? 'Edit Class & Section' : 'Add Class & Section'}</h2>
              <button onClick={() => setIsClassModalOpen(false)}>✕</button>
            </div>
            <div className="p-8 td-form">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Class Name</label>
                  <select
                    value={editClass.className}
                    onChange={e => setEditClass({ ...editClass, className: e.target.value })}
                  >
                    <option value="VI">Class VI</option>
                    <option value="VII">Class VII</option>
                    <option value="VIII">Class VIII</option>
                    <option value="IX">Class IX</option>
                    <option value="X">Class X</option>
                    <option value="XI">Class XI</option>
                    <option value="XII">Class XII</option>
                  </select>
                </div>

                <div>
                  <label>Section</label>
                  <input
                    type="text"
                    value={editClass.section}
                    onChange={e => setEditClass({ ...editClass, section: e.target.value })}
                    placeholder="e.g. A, B, C"
                  />
                </div>
              </div>

              <div>
                <label>Class Teacher Name</label>
                <input
                  type="text"
                  value={editClass.classTeacherName}
                  onChange={e => setEditClass({ ...editClass, classTeacherName: e.target.value })}
                  placeholder="Mrs. Ananya Patnaik"
                />
              </div>

              <div>
                <label>Total Student Strength</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={editClass.totalStudents}
                  onChange={e => setEditClass({ ...editClass, totalStudents: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
            <div className="td-modal-foot">
              <button onClick={() => setIsClassModalOpen(false)} className="td-btn-ghost">
                Cancel
              </button>
              <button onClick={handleSaveClass} className="td-add-btn">
                <Save className="w-4 h-4" />
                <span>Save Class Section</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {isSubjectModalOpen && (
        <div className="td-modal">
          <div className="td-modal-body">
            <div className="td-modal-head">
              <h2>{editSubject.id ? 'Edit Subject Item' : 'Add Subject Item'}</h2>
              <button onClick={() => setIsSubjectModalOpen(false)}>✕</button>
            </div>
            <div className="p-8 td-form">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Subject Name</label>
                  <input
                    type="text"
                    value={editSubject.subjectName}
                    onChange={e => setEditSubject({ ...editSubject, subjectName: e.target.value })}
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div>
                  <label>CBSE Subject Code</label>
                  <input
                    type="text"
                    value={editSubject.subjectCode}
                    onChange={e => setEditSubject({ ...editSubject, subjectCode: e.target.value })}
                    placeholder="e.g. 041"
                  />
                </div>
              </div>

              <div>
                <label>Applicable Class Level</label>
                <input
                  type="text"
                  value={editSubject.classLevel}
                  onChange={e => setEditSubject({ ...editSubject, classLevel: e.target.value })}
                  placeholder="e.g. IX & X or XI & XII"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Target Pass Rate %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editSubject.targetPassRate}
                    onChange={e => setEditSubject({ ...editSubject, targetPassRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label>Target A1 Grade Count</label>
                  <input
                    type="number"
                    min="0"
                    value={editSubject.targetA1Count}
                    onChange={e => setEditSubject({ ...editSubject, targetA1Count: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>
            </div>
            <div className="td-modal-foot">
              <button onClick={() => setIsSubjectModalOpen(false)} className="td-btn-ghost">
                Cancel
              </button>
              <button onClick={handleSaveSubject} className="td-add-btn">
                <Save className="w-4 h-4" />
                <span>Save Subject</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
