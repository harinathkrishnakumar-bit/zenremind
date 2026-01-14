
import React from 'react';
import { Reminder, Priority } from '../types';
import { Icon } from './Icon';
import { formatNiceDate } from '../utils/dateUtils';

interface ReminderCardProps {
  reminder: Reminder;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (reminder: Reminder) => void;
  isCompact?: boolean;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onToggleComplete,
  onDelete,
  onEdit,
  isCompact = false
}) => {
  if (isCompact) {
    return (
      <div className={`group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-all ${reminder.completed ? 'opacity-50 bg-gray-50/30' : ''}`}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button 
            onClick={() => onToggleComplete(reminder.id)}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-emerald-100 transition-all flex-shrink-0"
          >
            <Icon name="check" className="w-3.5 h-3.5" /> 
            <span>Complete</span>
          </button>
          <div className="flex flex-1 justify-between items-center pr-4">
            <span className={`text-sm font-semibold truncate ${reminder.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {reminder.title}
            </span>
            {reminder.cost !== undefined && (
              <span className="text-sm font-bold text-orange-600 ml-4">
                ${reminder.cost.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onDelete(reminder.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
            <Icon name="trash" className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const themes = {
    [Priority.HIGH]: 'border-l-red-500',
    [Priority.MEDIUM]: 'border-l-orange-500',
    [Priority.LOW]: 'border-l-emerald-500',
  };

  const theme = themes[reminder.priority];

  return (
    <div className={`group relative rounded-xl border-l-4 border-y border-r border-gray-200 bg-white p-5 transition-all shadow-sm hover:shadow-md ${theme} ${
      reminder.completed ? 'opacity-50' : ''
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-4 items-center min-w-0 flex-1">
          <button 
            onClick={() => onToggleComplete(reminder.id)}
            className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-all flex-shrink-0"
          >
            <Icon name="check" className="w-4 h-4" />
            <span>Complete</span>
          </button>
          
          <div className="min-w-0">
            <h3 className={`text-base font-bold tracking-tight truncate ${reminder.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {reminder.title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <Icon name="clock" className="w-3 h-3" /> {formatNiceDate(reminder.dueDate)}
              </div>
              <div className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase">
                {reminder.category}
              </div>
              {reminder.cost !== undefined && (
                <div className="text-[10px] font-bold text-orange-600">
                  ${reminder.cost.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(reminder)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
            <Icon name="edit" className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(reminder.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all">
            <Icon name="trash" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderCard;
