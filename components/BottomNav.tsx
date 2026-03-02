
import React from 'react';
import { ViewType } from '../types';
import { Icon } from './Icon';

interface BottomNavProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  stats: Record<string, number>;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onViewChange, stats }) => {
  const items = [
    { id: ViewType.DASHBOARD, icon: 'sparkles' as const, label: 'Dash' },
    { id: ViewType.TODAY, icon: 'clock' as const, label: 'Today', count: stats.today },
    { id: ViewType.WEEK, icon: 'calendar' as const, label: 'Upcoming', count: stats.week },
    { id: ViewType.WORKS, icon: 'edit' as const, label: 'Works', count: stats.works },
    { id: ViewType.RENEWALS, icon: 'calendar' as const, label: 'Policy', count: stats.renewals },
    { id: ViewType.SHOPPING, icon: 'list' as const, label: 'Buy List', count: stats.shopping },
    { id: ViewType.OUTSTANDING, icon: 'cake' as const, label: 'Birthdays', count: stats.outstanding },
    { id: ViewType.HABITS, icon: 'star' as const, label: 'Habits', count: stats.habits },
    { id: ViewType.VAULT, icon: 'alert' as const, label: 'Vault' },
    { id: ViewType.PURCHASES, icon: 'list' as const, label: 'Purchases' },
    { id: ViewType.HOMEWORK, icon: 'edit' as const, label: 'HW' },
    { id: ViewType.GARDEN, icon: 'leaf' as const, label: 'Garden' },
    { id: ViewType.HOLIDAY_CHECKLIST, icon: 'gift' as const, label: 'Holidays' },
    { id: ViewType.IMMEDIATE_BUY, icon: 'shopping-cart' as const, label: 'Buy Now' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50">
      <div className="flex overflow-x-auto no-scrollbar px-1 pt-2 pb-safe-area gap-1">
        {items.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center gap-1 shrink-0 px-3 py-1 rounded-xl transition-all ${isActive ? 'text-orange-600 bg-orange-50' : 'text-gray-400'}`}
            >
              <div className="relative">
                <Icon name={item.icon} className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
                {item.count ? (
                  <span className="absolute -top-1 -right-1.5 bg-orange-500 text-white text-[8px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white">
                    {item.count}
                  </span>
                ) : null}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${isActive ? 'text-orange-600' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
