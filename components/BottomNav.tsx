
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
    { id: ViewType.WORKS, icon: 'edit' as const, label: 'Works', count: stats.works },
    { id: ViewType.SHOPPING, icon: 'list' as const, label: 'List', count: stats.shopping },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 px-2 pt-2 pb-safe-area flex justify-around z-50">
      {items.map((item) => {
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${isActive ? 'text-orange-600 scale-110' : 'text-gray-400'}`}
          >
            <div className="relative">
              <Icon name={item.icon} className={`w-6 h-6 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
              {item.count ? (
                <span className="absolute -top-1 -right-1.5 bg-orange-500 text-white text-[8px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white">
                  {item.count}
                </span>
              ) : null}
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
