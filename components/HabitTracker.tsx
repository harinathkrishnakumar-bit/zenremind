
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Habit } from '../types';
import { Icon } from './Icon';

interface HabitTrackerProps {
  habits: Habit[];
  onToggleDate: (habitId: string, dateStr: string) => void;
  onAddHabit: (title: string) => void;
  onDeleteHabit: (id: string) => void;
}

const HabitTracker: React.FC<HabitTrackerProps> = ({ habits, onToggleDate, onAddHabit, onDeleteHabit }) => {
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const scrollContainerRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Show a 14-day window ending today
  const habitTimeline = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i)); 
      const dateStr = d.toISOString().split('T')[0];
      return {
        full: dateStr,
        weekday: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        date: d.getDate(),
        isToday: dateStr === new Date().toISOString().split('T')[0],
      };
    });
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitTitle.trim()) {
      onAddHabit(newHabitTitle.trim());
      setNewHabitTitle('');
    }
  };

  const calculateProgress = (completedDates: string[]) => {
    const windowDates = habitTimeline.map(d => d.full);
    const completedInWindow = completedDates.filter(d => windowDates.includes(d)).length;
    return Math.round((completedInWindow / habitTimeline.length) * 100);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Consistency Tracker</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Build high-performance daily routines</p>
        </div>
        
        <form onSubmit={handleAdd} className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm w-full sm:w-auto">
          <input
            type="text"
            value={newHabitTitle}
            onChange={(e) => setNewHabitTitle(e.target.value)}
            placeholder="New habit name..."
            className="flex-1 px-4 py-2 bg-transparent outline-none text-gray-800 text-sm font-medium min-w-[150px]"
          />
          <button 
            type="submit" 
            disabled={!newHabitTitle.trim()} 
            className="p-2 bg-orange-500 text-white rounded-xl disabled:opacity-30 transition-all hover:bg-orange-600 shadow-md shadow-orange-100"
          >
            <Icon name="plus" className="w-5 h-5" />
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {habits.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-10 text-center">
             <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="star" className="text-gray-200 w-6 h-6" />
             </div>
             <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No habits tracked yet</p>
          </div>
        ) : habits.map((habit, idx) => {
          const progress = calculateProgress(habit.completedDates);
          return (
            <div key={habit.id} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-5">
                <div className="flex flex-col">
                  <h3 className="text-base font-black text-gray-800 tracking-tight">{habit.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-orange-500 uppercase">{progress}% Rate</span>
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteHabit(habit.id)} 
                  className="p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Icon name="trash" className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-2xl">
                {habitTimeline.map(day => (
                  <div key={day.full} className="flex flex-col items-center gap-1.5">
                    <span className={`text-[8px] font-black uppercase tracking-tighter ${day.isToday ? 'text-orange-500' : 'text-gray-300'}`}>
                      {day.isToday ? 'TOD' : day.weekday}
                    </span>
                    <button
                      onClick={() => onToggleDate(habit.id, day.full)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all border-2 ${
                        habit.completedDates.includes(day.full) 
                          ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-100 scale-110' 
                          : day.isToday 
                            ? 'border-orange-400 bg-white text-orange-500' 
                            : 'bg-white border-gray-100 text-gray-200 hover:border-orange-200'
                      }`}
                    >
                      <span className="text-[10px] font-black">{day.date}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HabitTracker;
