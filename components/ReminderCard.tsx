
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
      <div className={`group px-4 py-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-all ${reminder.completed ? 'opacity-50 bg-gray-50/30' : ''}`}>
        {/* Row 1: title + Done + delete */}
        <div className="flex items-center gap-2">
          <span className={`flex-1 text-sm font-semibold truncate ${reminder.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
            {reminder.title}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onDelete(reminder.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
              <Icon name="trash" className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleComplete(reminder.id)}
              className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-emerald-100 transition-all"
            >
              <Icon name="check" className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>
        </div>
        {/* Row 2: cost (if present) */}
        {reminder.cost !== undefined && (
          <div className="mt-1 text-[10px] font-bold text-orange-600">
            ${reminder.cost.toFixed(2)}
          </div>
        )}
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
    <div className={`group relative rounded-xl border-l-4 border-y border-r border-gray-200 bg-white px-4 py-3 transition-all shadow-sm hover:shadow-md ${theme} ${
      reminder.completed ? 'opacity-50' : ''
    }`}>
      {/* Row 1: title + actions + complete button */}
      <div className="flex items-center gap-2">
        <h3 className={`flex-1 text-sm font-bold tracking-tight truncate ${reminder.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {reminder.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(reminder)} className="p-1.5 text-gray-300 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100">
            <Icon name="edit" className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(reminder.id)} className="p-1.5 text-gray-300 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
            <Icon name="trash" className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggleComplete(reminder.id)}
            className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-emerald-100 transition-all"
          >
            <Icon name="check" className="w-3.5 h-3.5" />
            <span>Done</span>
          </button>
        </div>
      </div>

      {/* Row 2: metadata */}
      <div className="flex flex-wrap items-center gap-2 mt-1.5">
        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
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
  );
};

export default ReminderCard;
