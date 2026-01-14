
import React, { useState, useEffect } from 'react';
import { Reminder, Priority, RecurrenceType, RecurrenceConfig } from '../types';
import { Icon } from './Icon';
import { parseSmartReminder } from '../services/gemini';

interface ReminderModalProps {
  reminder?: Reminder | null;
  prefillCategory?: string;
  onClose: () => void;
  onSave: (reminder: Omit<Reminder, 'id' | 'createdAt'> & { id?: string }) => void;
}

const CATEGORIES = [
  { id: 'Personal', icon: 'sparkles' },
  { id: 'Birthday', icon: 'cake' },
  { id: 'Renewal', icon: 'clock' },
  { id: 'Things to Buy', icon: 'list' },
  { id: 'Classes', icon: 'target' },
  { id: 'Work', icon: 'calendar' },
  { id: 'Health', icon: 'alert' },
  { id: 'Finance', icon: 'star' }
];

const TIMELESS_CATEGORIES = ['Personal', 'Things to Buy', 'Work', 'Health', 'Finance'];

const ReminderModal: React.FC<ReminderModalProps> = ({ reminder, prefillCategory, onClose, onSave }) => {
  const [title, setTitle] = useState(reminder?.title || '');
  const [description, setDescription] = useState(reminder?.description || '');
  const [dueDate, setDueDate] = useState(reminder?.dueDate ? reminder.dueDate.slice(0, 16) : '');
  const [priority, setPriority] = useState<Priority>(reminder?.priority || Priority.MEDIUM);
  const [category, setCategory] = useState(reminder?.category || prefillCategory || 'Personal');
  const [cost, setCost] = useState<string>(reminder?.cost?.toString() || '');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(reminder?.recurrence?.type || RecurrenceType.NONE);

  const isTimeless = TIMELESS_CATEGORIES.includes(category);

  const handleAiSmartFill = async () => {
    if (!title) return;
    setIsAiLoading(true);
    const result = await parseSmartReminder(title);
    if (result.title) setTitle(result.title);
    if (result.description) setDescription(result.description);
    if (result.dueDate && !TIMELESS_CATEGORIES.includes(result.category || category)) {
      setDueDate(new Date(result.dueDate).toISOString().slice(0, 16));
    }
    if (result.priority) setPriority(result.priority);
    if (result.category) setCategory(result.category);
    if (result.cost !== undefined) setCost(result.cost.toString());
    setIsAiLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If timeless and no date provided, use current time
    const finalDate = (isTimeless && !dueDate) 
      ? new Date().toISOString() 
      : new Date(dueDate || new Date()).toISOString();

    onSave({
      id: reminder?.id,
      title,
      description,
      dueDate: finalDate,
      priority,
      category,
      completed: reminder?.completed || false,
      cost: cost ? parseFloat(cost) : undefined,
      recurrence: recurrenceType !== RecurrenceType.NONE ? { type: recurrenceType } : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-800">
            {reminder ? 'Edit Entry' : 'Add New Task'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
             <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-gray-900">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Task Title</label>
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-orange-500 outline-none transition-all pr-12 text-sm font-medium"
                placeholder="What needs to be done?"
                required
              />
              <button
                type="button"
                onClick={handleAiSmartFill}
                disabled={isAiLoading || !title}
                className="absolute right-2 top-2 p-1.5 text-orange-500 hover:bg-orange-50 rounded-md transition-all disabled:opacity-50"
                title="AI Smart Fill"
              >
                {isAiLoading ? <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /> : <Icon name="sparkles" className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">Category Selection</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-bold uppercase tracking-tight transition-all ${
                    category === cat.id
                      ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-100 scale-105'
                      : 'bg-white border-gray-100 text-gray-500 hover:border-orange-200 hover:bg-orange-50/30'
                  }`}
                >
                  <Icon name={cat.icon as any} className="w-4 h-4" />
                  <span className="truncate w-full text-center">{cat.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {!isTimeless && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">When</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-orange-500 outline-none transition-all text-sm font-medium"
                  required={!isTimeless}
                />
              </div>
            )}
            <div className={isTimeless ? "col-span-2" : ""}>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Value / Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-orange-500 outline-none transition-all text-sm font-medium"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Priority Level</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-orange-500">
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Repeat Pattern</label>
              <select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-orange-500">
                <option value={RecurrenceType.NONE}>None</option>
                <option value={RecurrenceType.DAILY}>Daily</option>
                <option value={RecurrenceType.WEEKLY}>Weekly</option>
                <option value={RecurrenceType.MONTHLY}>Monthly</option>
                <option value={RecurrenceType.YEARLY}>Yearly</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-600 transition-all shadow-md shadow-orange-200">
              Confirm Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;
