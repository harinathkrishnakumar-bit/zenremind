import React, { useState, useMemo } from 'react';
import { HomeworkItem, HomeworkSubject, CurriculumTopic } from '../types';
import { Icon } from './Icon';

interface HomeworkPlannerProps {
  items: HomeworkItem[];
  onSave: (item: HomeworkItem) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  curriculumTopics: CurriculumTopic[];
  onSaveCurriculum: (topic: CurriculumTopic) => void;
  onDeleteCurriculum: (id: string) => void;
  onToggleCurriculum: (id: string) => void;
}

const SUBJECTS: HomeworkSubject[] = ['Math', 'English', 'Science', 'History', 'Geography', 'Art', 'PE', 'French', 'ICT', 'Other'];

const SUBJECT_COLORS: Record<HomeworkSubject, { bg: string; text: string; dot: string }> = {
  Math:      { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: '#3b82f6' },
  English:   { bg: 'bg-purple-100', text: 'text-purple-700', dot: '#a855f7' },
  Science:   { bg: 'bg-green-100',  text: 'text-green-700',  dot: '#22c55e' },
  History:   { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: '#f59e0b' },
  Geography: { bg: 'bg-teal-100',   text: 'text-teal-700',   dot: '#14b8a6' },
  Art:       { bg: 'bg-pink-100',   text: 'text-pink-700',   dot: '#ec4899' },
  PE:        { bg: 'bg-orange-100', text: 'text-orange-700', dot: '#f97316' },
  French:    { bg: 'bg-red-100',    text: 'text-red-700',    dot: '#ef4444' },
  ICT:       { bg: 'bg-cyan-100',   text: 'text-cyan-700',   dot: '#06b6d4' },
  Other:     { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: '#6b7280' },
};

const todayStr = () => new Date().toISOString().split('T')[0];

const daysUntil = (dateStr: string): number => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const HomeworkPlanner: React.FC<HomeworkPlannerProps> = ({
  items, onSave, onDelete, onToggleComplete,
  curriculumTopics, onSaveCurriculum, onDeleteCurriculum, onToggleCurriculum
}) => {
  const [activeTab, setActiveTab] = useState<'homework' | 'curriculum'>('homework');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<HomeworkSubject>('Math');
  const [dueDate, setDueDate] = useState(todayStr());
  const [notes, setNotes] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  // Curriculum form state
  const [showCurriculumForm, setShowCurriculumForm] = useState(false);
  const [editingCurriculumId, setEditingCurriculumId] = useState<string | null>(null);
  const [curriculumTitle, setCurriculumTitle] = useState('');
  const [curriculumSubject, setCurriculumSubject] = useState<HomeworkSubject>('Math');
  const [curriculumDueDate, setCurriculumDueDate] = useState('');
  const [curriculumNotes, setCurriculumNotes] = useState('');

  const resetForm = () => {
    setTitle(''); setSubject('Math'); setDueDate(todayStr()); setNotes('');
    setEditingId(null); setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const item: HomeworkItem = {
      id: editingId || Date.now().toString(),
      title: title.trim(),
      subject,
      dueDate,
      notes: notes.trim() || undefined,
      completed: false,
      createdAt: editingId ? (items.find(i => i.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };
    onSave(item);
    resetForm();
  };

  const startEdit = (item: HomeworkItem) => {
    setTitle(item.title); setSubject(item.subject); setDueDate(item.dueDate);
    setNotes(item.notes || ''); setEditingId(item.id); setShowForm(true);
  };

  // Curriculum handlers
  const resetCurriculumForm = () => {
    setCurriculumTitle(''); setCurriculumSubject('Math'); setCurriculumDueDate(''); setCurriculumNotes('');
    setEditingCurriculumId(null); setShowCurriculumForm(false);
  };

  const handleCurriculumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!curriculumTitle.trim()) return;
    const topic: CurriculumTopic = {
      id: editingCurriculumId || Date.now().toString(),
      title: curriculumTitle.trim(),
      subject: curriculumSubject,
      completed: false,
      dueDate: curriculumDueDate || undefined,
      notes: curriculumNotes.trim() || undefined,
      createdAt: editingCurriculumId
        ? (curriculumTopics.find(t => t.id === editingCurriculumId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
    };
    onSaveCurriculum(topic);
    resetCurriculumForm();
  };

  const startEditCurriculum = (topic: CurriculumTopic) => {
    setCurriculumTitle(topic.title); setCurriculumSubject(topic.subject);
    setCurriculumDueDate(topic.dueDate || ''); setCurriculumNotes(topic.notes || '');
    setEditingCurriculumId(topic.id); setShowCurriculumForm(true);
  };

  const pending = useMemo(() => items.filter(i => !i.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [items]);
  const completed = useMemo(() => items.filter(i => i.completed).sort((a, b) => b.dueDate.localeCompare(a.dueDate)), [items]);

  const overdue    = pending.filter(i => daysUntil(i.dueDate) < 0);
  const dueToday   = pending.filter(i => daysUntil(i.dueDate) === 0);
  const thisWeek   = pending.filter(i => daysUntil(i.dueDate) >= 1 && daysUntil(i.dueDate) <= 6);
  const upcoming   = pending.filter(i => daysUntil(i.dueDate) > 6);

  // Stats
  const stats = {
    total: pending.length,
    overdue: overdue.length,
    today: dueToday.length,
    week: thisWeek.length,
  };

  // Curriculum data grouped by subject
  const curriculumBySubject = useMemo(() => {
    const grouped: Record<HomeworkSubject, CurriculumTopic[]> = {} as any;
    SUBJECTS.forEach(s => { grouped[s] = []; });
    curriculumTopics.forEach(topic => {
      if (!grouped[topic.subject]) grouped[topic.subject] = [];
      grouped[topic.subject].push(topic);
    });
    // Sort topics within each subject: incomplete first, then by due date
    Object.keys(grouped).forEach(s => {
      grouped[s as HomeworkSubject].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return a.title.localeCompare(b.title);
      });
    });
    return grouped;
  }, [curriculumTopics]);

  const curriculumStats = {
    total: curriculumTopics.length,
    completed: curriculumTopics.filter(t => t.completed).length,
    subjects: Object.keys(curriculumBySubject).filter(s => curriculumBySubject[s as HomeworkSubject].length > 0).length,
  };

  const HomeworkCard: React.FC<{ item: HomeworkItem }> = ({ item }) => {
    const days = daysUntil(item.dueDate);
    const col = SUBJECT_COLORS[item.subject];
    const urgencyBorder = item.completed ? 'border-gray-100' : days < 0 ? 'border-red-300' : days === 0 ? 'border-orange-300' : 'border-gray-100';

    return (
      <div className={`bg-white rounded-2xl border-2 ${urgencyBorder} p-4 group transition-all hover:shadow-md ${item.completed ? 'opacity-60' : ''}`}>
        <div className="flex items-start gap-3">
          {/* Complete button */}
          <button
            onClick={() => onToggleComplete(item.id)}
            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'
            }`}
          >
            {item.completed && <Icon name="check" className="w-3 h-3 text-white" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm font-black text-gray-800 leading-snug ${item.completed ? 'line-through text-gray-400' : ''}`}>{item.title}</p>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {!item.completed && (
                  <button onClick={() => startEdit(item)} className="p-1 text-gray-300 hover:text-gray-600 transition-colors">
                    <Icon name="edit" className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => onDelete(item.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                  <Icon name="trash" className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>
                {item.subject}
              </span>
              <span className={`text-[10px] font-bold ${
                item.completed ? 'text-gray-400' : days < 0 ? 'text-red-600' : days === 0 ? 'text-orange-600' : 'text-gray-400'
              }`}>
                {item.completed
                  ? `Done · ${formatDate(item.dueDate)}`
                  : days < 0
                    ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`
                    : days === 0
                      ? 'Due today'
                      : `Due ${formatDate(item.dueDate)} · ${days} days`
                }
              </span>
            </div>

            {item.notes && (
              <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">{item.notes}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SectionHeader: React.FC<{ label: string; count: number; color: string }> = ({ label, count, color }) => (
    <div className="flex items-center gap-2 mb-2">
      <span className={`text-[9px] font-black uppercase tracking-widest ${color}`}>{label}</span>
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500`}>{count}</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Riya's Homework</h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Planner & tracker</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'homework') {
              resetForm();
              setShowForm(true);
            } else {
              resetCurriculumForm();
              setShowCurriculumForm(true);
            }
          }}
          className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm self-start sm:self-auto"
        >
          <Icon name="plus" className="w-4 h-4" />
          {activeTab === 'homework' ? 'Add Homework' : 'Add Topic'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('homework')}
          className={`px-4 py-2.5 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'homework'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Homework
        </button>
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`px-4 py-2.5 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'curriculum'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Study Planner
        </button>
      </div>

      {/* Homework Tab Content */}
      {activeTab === 'homework' && (
        <>
          {/* Stats */}
          {items.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Pending', val: stats.total, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-100' },
            { label: 'Overdue', val: stats.overdue, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
            { label: 'Today', val: stats.today, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
            { label: 'This Week', val: stats.week, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-2xl p-3 text-center`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white border-2 border-orange-100 rounded-3xl p-6 shadow-lg shadow-orange-50">
          <h3 className="text-base font-black text-gray-800 mb-4">{editingId ? 'Edit Homework' : 'Add New Homework'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Subject selector */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map(s => (
                  <button key={s} type="button" onClick={() => setSubject(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      subject === s
                        ? `${SUBJECT_COLORS[s].bg} ${SUBJECT_COLORS[s].text} border-transparent shadow-sm`
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Homework Title</label>
                <input
                  type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 3 worksheet"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none"
                  required autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Due Date</label>
                <input
                  type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Notes (optional)</label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Page numbers, instructions, reminders..."
                rows={2}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={resetForm}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 shadow-md">
                {editingId ? 'Save Changes' : 'Add Homework'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No homework yet</p>
          <p className="text-gray-300 text-xs mt-1">Tap "Add Homework" to get started</p>
        </div>
      )}

      {/* Planner sections */}
      {pending.length > 0 && (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <div>
              <SectionHeader label="Overdue" count={overdue.length} color="text-red-600" />
              <div className="space-y-2">
                {overdue.map(item => <HomeworkCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {dueToday.length > 0 && (
            <div>
              <SectionHeader label="Due Today" count={dueToday.length} color="text-orange-600" />
              <div className="space-y-2">
                {dueToday.map(item => <HomeworkCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {thisWeek.length > 0 && (
            <div>
              <SectionHeader label="This Week" count={thisWeek.length} color="text-blue-600" />
              <div className="space-y-2">
                {thisWeek.map(item => <HomeworkCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <SectionHeader label="Upcoming" count={upcoming.length} color="text-gray-400" />
              <div className="space-y-2">
                {upcoming.map(item => <HomeworkCard key={item.id} item={item} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weekly calendar view */}
      {pending.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">This Week at a Glance</p>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(); d.setDate(d.getDate() + i);
              const ds = d.toISOString().split('T')[0];
              const dayItems = pending.filter(item => item.dueDate === ds);
              const isToday = i === 0;
              return (
                <div key={i} className={`rounded-xl p-2 text-center min-h-[64px] ${isToday ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                  <p className={`text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-orange-600' : 'text-gray-400'}`}>
                    {d.toLocaleDateString('en-GB', { weekday: 'short' })}
                  </p>
                  <p className={`text-base font-black ${isToday ? 'text-orange-700' : 'text-gray-600'}`}>{d.getDate()}</p>
                  <div className="mt-1 space-y-0.5">
                    {dayItems.map(item => (
                      <div key={item.id} className="w-full h-1.5 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[item.subject].dot }} title={item.title} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {[...new Set(pending.map(i => i.subject))].map(s => (
              <div key={s} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[s].dot }} />
                <span className="text-[9px] font-bold text-gray-500">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(p => !p)}
            className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 hover:text-gray-600 transition-colors"
          >
            <Icon name={showCompleted ? 'check' : 'plus'} className="w-3 h-3" />
            {showCompleted ? 'Hide' : 'Show'} Completed ({completed.length})
          </button>
          {showCompleted && (
            <div className="space-y-2">
              {completed.map(item => <HomeworkCard key={item.id} item={item} />)}
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Curriculum Tab Content */}
      {activeTab === 'curriculum' && (
        <>
          {/* Stats */}
          {curriculumTopics.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-blue-600">{curriculumStats.total}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Topics</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-emerald-600">{curriculumStats.completed}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Completed</p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-purple-600">{curriculumStats.subjects}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Subjects</p>
              </div>
            </div>
          )}

          {/* Add / Edit Form */}
          {showCurriculumForm && (
            <div className="bg-white border-2 border-orange-100 rounded-3xl p-6 shadow-lg shadow-orange-50">
              <h3 className="text-base font-black text-gray-800 mb-4">{editingCurriculumId ? 'Edit Topic' : 'Add Curriculum Topic'}</h3>
              <form onSubmit={handleCurriculumSubmit} className="space-y-4">
                {/* Subject selector */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject</label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map(s => (
                      <button key={s} type="button" onClick={() => setCurriculumSubject(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          curriculumSubject === s
                            ? `${SUBJECT_COLORS[s].bg} ${SUBJECT_COLORS[s].text} border-transparent shadow-sm`
                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Topic Title</label>
                    <input
                      type="text" value={curriculumTitle} onChange={e => setCurriculumTitle(e.target.value)}
                      placeholder="e.g. Algebra equations"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none"
                      required autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Due Date (optional)</label>
                    <input
                      type="date" value={curriculumDueDate} onChange={e => setCurriculumDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Notes (optional)</label>
                  <textarea
                    value={curriculumNotes} onChange={e => setCurriculumNotes(e.target.value)}
                    placeholder="Learning objectives, resources, etc."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={resetCurriculumForm}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 shadow-md">
                    {editingCurriculumId ? 'Save Changes' : 'Add Topic'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Empty state */}
          {curriculumTopics.length === 0 && !showCurriculumForm && (
            <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
              <div className="text-5xl mb-4">📖</div>
              <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No curriculum topics yet</p>
              <p className="text-gray-300 text-xs mt-1">Tap "Add Topic" to start building your study plan</p>
            </div>
          )}

          {/* Topics grouped by subject */}
          {curriculumTopics.length > 0 && (
            <div className="space-y-6">
              {SUBJECTS.map(subject => {
                const topics = curriculumBySubject[subject];
                if (topics.length === 0) return null;
                const col = SUBJECT_COLORS[subject];
                const completed = topics.filter(t => t.completed).length;
                const progress = Math.round((completed / topics.length) * 100);

                return (
                  <div key={subject} className="space-y-3">
                    {/* Subject header with progress */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${col.bg} ${col.text}`}>
                          {subject}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">
                          {completed}/{topics.length} completed
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: col.dot }} />
                        </div>
                        <span className="text-[10px] font-black" style={{ color: col.dot }}>{progress}%</span>
                      </div>
                    </div>

                    {/* Topic cards */}
                    <div className="grid grid-cols-1 gap-2">
                      {topics.map(topic => (
                        <div key={topic.id} className={`bg-white rounded-xl border-l-4 border-y border-r border-gray-200 p-3 group transition-all hover:shadow-sm ${topic.completed ? 'opacity-60' : ''}`}
                          style={{ borderLeftColor: col.dot }}>
                          <div className="flex items-start gap-3">
                            {/* Complete checkbox */}
                            <button
                              onClick={() => onToggleCurriculum(topic.id)}
                              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                topic.completed ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 hover:border-emerald-400'
                              }`}
                            >
                              {topic.completed && <Icon name="check" className="w-3 h-3 text-white" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm font-bold text-gray-800 ${topic.completed ? 'line-through text-gray-400' : ''}`}>
                                  {topic.title}
                                </p>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  {!topic.completed && (
                                    <button onClick={() => startEditCurriculum(topic)} className="p-1 text-gray-300 hover:text-gray-600 transition-colors">
                                      <Icon name="edit" className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button onClick={() => onDeleteCurriculum(topic.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                                    <Icon name="trash" className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {(topic.dueDate || topic.notes) && (
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  {topic.dueDate && (
                                    <span className="text-[10px] font-bold text-gray-400">
                                      Due {formatDate(topic.dueDate)}
                                    </span>
                                  )}
                                  {topic.notes && (
                                    <p className="text-[11px] text-gray-400 leading-relaxed">{topic.notes}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HomeworkPlanner;
