
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

  const habitTimeline = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (24 - i)); 
      return {
        full: d.toISOString().split('T')[0],
        weekday: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        date: d.getDate(),
        isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
      };
    });
  }, []);

  const scrollToRight = () => {
    setTimeout(() => {
        scrollContainerRefs.current.forEach(container => {
          if (container) container.scrollLeft = container.scrollWidth;
        });
    }, 100);
  };

  useEffect(() => { scrollToRight(); }, [habits.length]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Consistency Tracking</h1>
          <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-widest text-[10px]">Track your high-performance habits.</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if(newHabitTitle.trim()) { onAddHabit(newHabitTitle); setNewHabitTitle(''); } }} className="flex gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
        <input
          type="text"
          value={newHabitTitle}
          onChange={(e) => setNewHabitTitle(e.target.value)}
          placeholder="Enter a new habit to monitor..."
          className="flex-1 px-4 py-2 bg-transparent outline-none text-gray-800 text-sm"
        />
        <button type="submit" disabled={!newHabitTitle.trim()} className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold disabled:opacity-50">
          Add
        </button>
      </form>

      <div className="grid grid-cols-1 gap-6 pb-20">
        {habits.map((habit, idx) => (
          <div key={habit.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">{habit.title}</h3>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Streak: {habit.completedDates.length}</span>
                <button onClick={() => onDeleteHabit(habit.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Icon name="trash" className="w-4 h-4" /></button>
              </div>
            </div>
            
            <div ref={el => scrollContainerRefs.current[idx] = el} className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {habitTimeline.map(day => (
                <div key={day.full} className="flex flex-col items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold ${day.isToday ? 'text-orange-500' : 'text-gray-300'}`}>{day.weekday}</span>
                  <button
                    onClick={() => onToggleDate(habit.id, day.full)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border ${
                      habit.completedDates.includes(day.full) 
                        ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-100' 
                        : day.isToday ? 'border-orange-500 text-orange-500 bg-orange-50' : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}
                  >
                    <span className="text-xs font-bold">{day.date}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitTracker;
