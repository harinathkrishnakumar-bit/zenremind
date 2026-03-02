import React, { useState, useMemo } from 'react';
import { HolidayChecklistItem, HolidayCategory } from '../types';
import { Icon } from './Icon';

interface HolidayChecklistProps {
  items: HolidayChecklistItem[];
  onSave: (item: HolidayChecklistItem) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

const CATEGORIES: HolidayCategory[] = ['Shopping', 'Planning', 'Cooking', 'Decorating', 'Travel', 'Gifts', 'Other'];

const CATEGORY_COLORS: Record<HolidayCategory, { bg: string; text: string; dot: string }> = {
  Shopping:   { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: '#3b82f6' },
  Planning:   { bg: 'bg-purple-100', text: 'text-purple-700', dot: '#a855f7' },
  Cooking:    { bg: 'bg-orange-100', text: 'text-orange-700', dot: '#f97316' },
  Decorating: { bg: 'bg-pink-100',   text: 'text-pink-700',   dot: '#ec4899' },
  Travel:     { bg: 'bg-cyan-100',   text: 'text-cyan-700',   dot: '#06b6d4' },
  Gifts:      { bg: 'bg-red-100',    text: 'text-red-700',    dot: '#ef4444' },
  Other:      { bg: 'bg-gray-100',   text: 'text-gray-700',   dot: '#6b7280' },
};

const todayStr = () => new Date().toISOString().split('T')[0];

const HolidayChecklist: React.FC<HolidayChecklistProps> = ({ items, onSave, onDelete, onToggleComplete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [holiday, setHoliday] = useState('');
  const [task, setTask] = useState('');
  const [category, setCategory] = useState<HolidayCategory>('Shopping');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedHoliday, setSelectedHoliday] = useState<string>('All');

  const holidays = useMemo(() => {
    const unique = Array.from(new Set(items.map(i => i.holiday))).sort();
    return ['All', ...unique];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedHoliday === 'All') return items;
    return items.filter(i => i.holiday === selectedHoliday);
  }, [items, selectedHoliday]);

  const groupedByHoliday = useMemo(() => {
    const grouped: Record<string, HolidayChecklistItem[]> = {};
    filteredItems.forEach(item => {
      if (!grouped[item.holiday]) grouped[item.holiday] = [];
      grouped[item.holiday].push(item);
    });
    // Sort within each holiday: pending first, then by due date
    Object.keys(grouped).forEach(h => {
      grouped[h].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return a.task.localeCompare(b.task);
      });
    });
    return grouped;
  }, [filteredItems]);

  const stats = useMemo(() => {
    const total = filteredItems.length;
    const completed = filteredItems.filter(i => i.completed).length;
    const pending = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, progress };
  }, [filteredItems]);

  const resetForm = () => {
    setHoliday(''); setTask(''); setCategory('Shopping'); setDueDate(''); setNotes('');
    setEditingId(null); setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holiday.trim() || !task.trim()) return;
    const item: HolidayChecklistItem = {
      id: editingId || Date.now().toString(),
      holiday: holiday.trim(),
      task: task.trim(),
      category,
      completed: false,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      createdAt: editingId
        ? (items.find(i => i.id === editingId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
    };
    onSave(item);
    resetForm();
  };

  const startEdit = (item: HolidayChecklistItem) => {
    setHoliday(item.holiday); setTask(item.task); setCategory(item.category);
    setDueDate(item.dueDate || ''); setNotes(item.notes || '');
    setEditingId(item.id); setShowForm(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Holiday Checklist</h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Plan & prepare for celebrations</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm self-start sm:self-auto"
        >
          <Icon name="plus" className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Holiday Filter Pills */}
      {holidays.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {holidays.map(h => (
            <button
              key={h}
              onClick={() => setSelectedHoliday(h)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                selectedHoliday === h
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-300'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-gray-700">{stats.total}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Total</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-orange-600">{stats.pending}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Pending</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-emerald-600">{stats.completed}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Done</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-blue-600">{stats.progress}%</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Progress</p>
          </div>
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white border-2 border-orange-100 rounded-3xl p-6 shadow-lg shadow-orange-50">
          <h3 className="text-base font-black text-gray-800 mb-4">{editingId ? 'Edit Task' : 'Add Holiday Task'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Holiday</label>
                <input
                  type="text" value={holiday} onChange={e => setHoliday(e.target.value)}
                  placeholder="e.g., Christmas 2026"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none"
                  required autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Due Date (optional)</label>
                <input
                  type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none"
                />
              </div>
            </div>

            {/* Category selector */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button key={c} type="button" onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      category === c
                        ? `${CATEGORY_COLORS[c].bg} ${CATEGORY_COLORS[c].text} border-transparent shadow-sm`
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Task</label>
              <input
                type="text" value={task} onChange={e => setTask(e.target.value)}
                placeholder="e.g., Buy decorations"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-orange-400 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Notes (optional)</label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Additional details..."
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
                {editingId ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="text-center py-24 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No holiday tasks yet</p>
          <p className="text-gray-300 text-xs mt-1">Add tasks to plan your holiday celebrations</p>
        </div>
      )}

      {/* Tasks grouped by holiday */}
      {items.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedByHoliday).sort((a, b) => a[0].localeCompare(b[0])).map(([holidayName, tasks]) => {
            const holidayCompleted = tasks.filter(t => t.completed).length;
            const holidayProgress = Math.round((holidayCompleted / tasks.length) * 100);

            return (
              <div key={holidayName} className="space-y-3">
                {/* Holiday header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="gift" className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-black text-gray-900">{holidayName}</h2>
                    <span className="text-[10px] font-bold text-gray-400">
                      {holidayCompleted}/{tasks.length} completed
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${holidayProgress}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-orange-500">{holidayProgress}%</span>
                  </div>
                </div>

                {/* Task cards */}
                <div className="grid grid-cols-1 gap-2">
                  {tasks.map(item => {
                    const col = CATEGORY_COLORS[item.category];
                    return (
                      <div key={item.id} className={`bg-white rounded-xl border-l-4 border-y border-r border-gray-200 p-3 group transition-all hover:shadow-sm ${item.completed ? 'opacity-60' : ''}`}
                        style={{ borderLeftColor: col.dot }}>
                        <div className="flex items-start gap-3">
                          {/* Complete checkbox */}
                          <button
                            onClick={() => onToggleComplete(item.id)}
                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              item.completed ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 hover:border-emerald-400'
                            }`}
                          >
                            {item.completed && <Icon name="check" className="w-3 h-3 text-white" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className={`text-sm font-bold text-gray-800 ${item.completed ? 'line-through text-gray-400' : ''}`}>
                                  {item.task}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${col.bg} ${col.text} uppercase tracking-wider`}>
                                    {item.category}
                                  </span>
                                  {item.dueDate && (
                                    <span className="text-[10px] font-bold text-gray-400">
                                      Due {new Date(item.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </span>
                                  )}
                                </div>
                                {item.notes && (
                                  <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">{item.notes}</p>
                                )}
                              </div>
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
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HolidayChecklist;
