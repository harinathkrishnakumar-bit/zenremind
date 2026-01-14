
import React from 'react';
import { ViewType } from '../types';
import { Icon } from './Icon';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen: boolean; // Keep prop for interface compatibility but ignore for layout
  onClose: () => void;
  stats: Record<string, number>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, stats }) => {
  const navItems = [
    { id: ViewType.DASHBOARD, label: 'Overview', icon: 'sparkles' as const },
    { id: ViewType.TODAY, label: 'Today', icon: 'clock' as const, count: stats.today },
    { id: ViewType.WEEK, label: 'Upcoming', icon: 'calendar' as const, count: stats.week },
    { id: ViewType.MONTH, label: 'Monthly', icon: 'target' as const, count: stats.month },
    { id: ViewType.WORKS, label: 'Works to do', icon: 'edit' as const, count: stats.works },
    { id: ViewType.SHOPPING, label: 'Buy List', icon: 'list' as const, count: stats.shopping },
    { id: ViewType.OUTSTANDING, label: 'Events', icon: 'cake' as const, count: stats.outstanding },
    { id: ViewType.HABITS, label: 'Habits', icon: 'star' as const, count: stats.habits },
  ];

  return (
    <aside className="w-20 sm:w-64 flex flex-col h-full bg-white border-r border-gray-200 shrink-0 z-30 shadow-xl sm:shadow-none">
      <div className="flex flex-col h-full p-3 sm:p-6">
        <div className="flex items-center gap-3 mb-8 sm:mb-10 px-1 sm:px-2">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center shadow-lg shadow-orange-100 flex-shrink-0">
            <Icon name="check" className="text-white w-5 h-5" />
          </div>
          <span className="hidden sm:inline text-xl font-extrabold text-gray-900 tracking-tight">ZenRemind</span>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-center sm:justify-between px-2 sm:px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                activeView === item.id 
                  ? `bg-orange-50 text-orange-600 shadow-sm` 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name={item.icon} className={`w-4 h-4 ${activeView === item.id ? 'text-orange-500' : 'text-gray-400'}`} />
                <span className="hidden sm:inline">{item.label}</span>
              </div>
              {item.count !== undefined ? (
                <span className={`hidden sm:flex min-w-[18px] h-5 px-1.5 items-center justify-center rounded-md text-[10px] font-bold ${
                  activeView === item.id ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {item.count}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 hidden sm:block">
           <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
              <p className="text-[10px] text-gray-600 font-medium">Auto-Cycle Active</p>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
