
import React, { useState, useEffect, useMemo } from 'react';
import { Reminder, ViewType, Priority, RecurrenceType, VaultField, Habit } from './types';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import ReminderCard from './components/ReminderCard';
import ReminderModal from './components/ReminderModal';
import HabitTracker from './components/HabitTracker';
import { Icon } from './components/Icon';
import { isToday, isThisWeek, isThisMonth, formatNiceDate } from './utils/dateUtils';
import { getOccurrencesInRange } from './utils/recurrenceUtils';

const STORAGE_KEY = 'zenremind_pro_v2';
const VAULT_STORAGE_KEY = 'zenremind_vault_pro_v2';
const HABITS_STORAGE_KEY = 'zenremind_habits_pro_v2';

const DASHBOARD_INTERVAL = 10000;
const STANDARD_INTERVAL = 8000;

const getIntervalForView = (view: ViewType) => {
  return view === ViewType.DASHBOARD ? DASHBOARD_INTERVAL : STANDARD_INTERVAL;
};

const App: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  const [vaultFields, setVaultFields] = useState<VaultField[]>(() => {
    try {
      const saved = localStorage.getItem(VAULT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [
        { id: '1', label: 'Identity/ID', value: '' },
        { id: '2', label: 'Safety Code', value: '' }
      ];
    } catch (e) { return []; }
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(HABITS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [activeView, setActiveView] = useState<ViewType>(ViewType.DASHBOARD);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [timeLeft, setTimeLeft] = useState(getIntervalForView(ViewType.DASHBOARD));
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders)), [reminders]);
  useEffect(() => localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vaultFields)), [vaultFields]);
  useEffect(() => localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits)), [habits]);

  useEffect(() => {
    if (isModalOpen || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          const views = [ViewType.DASHBOARD, ViewType.TODAY, ViewType.WORKS, ViewType.SHOPPING];
          const currentIndex = views.indexOf(activeView);
          const nextView = views[(currentIndex + 1) % views.length];
          setActiveView(nextView);
          return getIntervalForView(nextView);
        }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [isModalOpen, isPaused, activeView]);

  const exportData = () => {
    const data = { reminders, vaultFields, habits };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenremind_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.reminders) setReminders(data.reminders);
        if (data.vaultFields) setVaultFields(data.vaultFields);
        if (data.habits) setHabits(data.habits);
        alert('Data imported successfully!');
      } catch (err) { alert('Invalid backup file'); }
    };
    reader.readAsText(file);
  };

  const displayReminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (activeView === ViewType.DASHBOARD || activeView === ViewType.HABITS) return [];
    
    const baseReminders = reminders.filter(r => !r.completed);

    if (activeView === ViewType.OUTSTANDING) {
      return baseReminders.filter(r => r.recurrence && r.recurrence.type === RecurrenceType.YEARLY);
    }
    if (activeView === ViewType.SHOPPING) {
      return baseReminders.filter(r => r.category.toLowerCase() === 'shopping' || r.category.toLowerCase() === 'things to buy');
    }
    if (activeView === ViewType.WORKS) {
      return baseReminders.filter(r => r.category.toLowerCase() === 'work');
    }

    // Default: Today's Timeline
    let rangeStart = new Date(today);
    let rangeEnd = new Date(today);
    rangeEnd.setHours(23, 59, 59, 999);

    let expanded: Reminder[] = [];
    baseReminders.filter(r => r.category.toLowerCase() !== 'shopping' && r.category.toLowerCase() !== 'things to buy' && r.category.toLowerCase() !== 'work').forEach(r => { 
      const instances = getOccurrencesInRange(r, rangeStart, rangeEnd);
      const filteredInstances = instances.filter(inst => !r.completedInstances?.includes(inst.id));
      expanded = [...expanded, ...filteredInstances]; 
    });
      
    return expanded.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [reminders, activeView]);

  const stats = useMemo(() => ({
    today: reminders.filter(r => isToday(r.dueDate) && !r.completed).length,
    week: reminders.filter(r => isThisWeek(r.dueDate) && !r.completed).length,
    works: reminders.filter(r => r.category.toLowerCase() === 'work' && !r.completed).length,
    shopping: reminders.filter(r => (r.category.toLowerCase() === 'shopping' || r.category.toLowerCase() === 'things to buy') && !r.completed).length,
    habits: habits.length,
    outstanding: reminders.filter(r => r.recurrence?.type === RecurrenceType.YEARLY && !r.completed).length
  }), [reminders, habits]);

  const handleToggleComplete = (id: string) => {
    const isRecurring = id.includes('::');
    const baseId = isRecurring ? id.split('::')[0] : id;
    setReminders(prev => {
      if (!isRecurring) return prev.filter(r => r.id !== baseId);
      return prev.map(r => r.id === baseId ? { ...r, completedInstances: [...(r.completedInstances || []), id] } : r);
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden flex-col md:flex-row">
      <div className="hidden md:flex h-full">
        <Sidebar activeView={activeView} onViewChange={(v) => { setActiveView(v); setTimeLeft(getIntervalForView(v)); }} stats={stats} isOpen={true} onClose={()=>{}} />
      </div>

      <main 
        className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 h-full overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20">
          <div className="flex items-center gap-2">
            <div className="md:hidden w-8 h-8 bg-orange-500 rounded flex items-center justify-center shadow-sm">
               <Icon name="check" className="text-white w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-lg font-bold text-gray-800 tracking-tight truncate">
              {activeView === ViewType.SHOPPING ? 'Buy List' : activeView === ViewType.WORKS ? 'Works to do' : activeView === ViewType.TODAY ? "Today's Timeline" : activeView.replace(/_/g, ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end">
                <span className={`text-[9px] font-black uppercase tracking-widest ${isPaused ? 'text-blue-500' : 'text-orange-500'}`}>
                   {isPaused ? 'Paused' : `Cycle: ${Math.ceil(timeLeft / 1000)}s`}
                </span>
                <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                   <div className={`h-full transition-all duration-100 linear ${isPaused ? 'bg-blue-400' : 'bg-orange-500'}`} style={{ width: `${(timeLeft / getIntervalForView(activeView)) * 100}%` }} />
                </div>
             </div>
             <button onClick={() => { setEditingReminder(null); setIsModalOpen(true); }} className="btn-primary w-10 h-10 md:w-auto md:px-4 md:py-2 rounded-xl flex items-center justify-center gap-2">
                <Icon name="plus" className="w-5 h-5" />
                <span className="hidden md:inline font-bold text-sm">New Task</span>
             </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8">
            {activeView === ViewType.DASHBOARD ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <h1 className="text-xl font-black text-gray-900 mb-1">Device Control</h1>
                    <p className="text-gray-500 text-xs mb-4">Sync data between your iPad and Phone.</p>
                    <div className="flex gap-2">
                      <button onClick={exportData} className="flex-1 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">Export Backup</button>
                      <label className="flex-1 py-2 bg-orange-50 border border-orange-200 rounded-lg text-xs font-bold text-orange-600 text-center cursor-pointer hover:bg-orange-100 transition-colors">
                        Import
                        <input type="file" className="hidden" accept=".json" onChange={importData} />
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col justify-center">
                       <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Active</span>
                       <span className="text-2xl font-black text-orange-700">{stats.today + stats.works}</span>
                    </div>
                    <div className="p-4 bg-gray-800 border border-gray-900 rounded-2xl flex flex-col justify-center text-white">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Habits</span>
                       <span className="text-2xl font-black">{stats.habits}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">Encrypted Identity Vault</h2>
                    <button onClick={() => setVaultFields([...vaultFields, { id: Date.now().toString(), label: 'New Field', value: '' }])} className="text-orange-600 text-[10px] font-bold">Add Field</button>
                  </div>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vaultFields.map(f => (
                      <div key={f.id} className="space-y-1.5">
                        <input className="text-[9px] font-black uppercase text-gray-400 w-full bg-transparent outline-none" value={f.label} onChange={(e) => setVaultFields(v => v.map(x => x.id === f.id ? { ...x, label: e.target.value } : x))} />
                        <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-mono focus:border-orange-300 outline-none" value={f.value} onChange={(e) => setVaultFields(v => v.map(x => x.id === f.id ? { ...x, value: e.target.value } : x))} />
                      </div>
                    ))}
                  </div>
                </div>

                <HabitTracker habits={habits} onAddHabit={(t) => setHabits(p => [...p, { id: Date.now().toString(), title: t, completedDates: [], createdAt: new Date().toISOString() }])} onDeleteHabit={(id) => setHabits(p => p.filter(h => h.id !== id))} onToggleDate={(id, d) => setHabits(p => p.map(h => h.id === id ? { ...h, completedDates: h.completedDates.includes(d) ? h.completedDates.filter(x => x !== d) : [...h.completedDates, d] } : h))} />
              </div>
            ) : activeView === ViewType.WORKS ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end mb-6">
                   <h1 className="text-2xl font-black text-gray-900 tracking-tight">Project Backlog</h1>
                   <div className="text-right">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Work Value</span>
                      <p className="text-xl font-black text-emerald-600">${displayReminders.reduce((acc, r) => acc + (r.cost || 0), 0).toFixed(2)}</p>
                   </div>
                </div>
                {displayReminders.length === 0 ? (
                  <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl">
                    <Icon name="edit" className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm font-medium">No pending works.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {displayReminders.map(r => (
                      <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all group relative">
                         <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col">
                               <h3 className="text-lg font-bold text-gray-800 leading-tight">{r.title}</h3>
                               <div className="flex gap-2 mt-1">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${r.priority === Priority.HIGH ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>{r.priority}</span>
                                  <span className="text-[10px] font-bold text-emerald-600">${(r.cost || 0).toFixed(2)}</span>
                               </div>
                            </div>
                            <button onClick={() => handleToggleComplete(r.id)} className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold hover:bg-emerald-100 flex items-center gap-2">
                               <Icon name="check" className="w-4 h-4" /> Complete
                            </button>
                         </div>
                         <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{r.description || "No description provided."}</p>
                         <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all absolute right-4 bottom-4">
                            <button onClick={() => { setEditingReminder(r); setIsModalOpen(true); }} className="p-2 text-gray-300 hover:text-gray-600"><Icon name="edit" className="w-4 h-4" /></button>
                            <button onClick={() => setReminders(p => p.filter(x => x.id !== r.id))} className="p-2 text-gray-300 hover:text-red-500"><Icon name="trash" className="w-4 h-4" /></button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {displayReminders.length === 0 ? (
                   <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl">
                     <Icon name="clock" className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                     <p className="text-gray-400 text-sm font-medium">Timeline clear.</p>
                   </div>
                 ) : (
                   displayReminders.map(r => (
                     <ReminderCard key={r.id} reminder={r} onToggleComplete={handleToggleComplete} onDelete={(id) => setReminders(p => p.filter(x => x.id !== id))} onEdit={(rem) => { setEditingReminder(rem); setIsModalOpen(true); }} isCompact={activeView === ViewType.SHOPPING} />
                   ))
                 )}
              </div>
            )}
          </div>
        </section>

        <BottomNav activeView={activeView} onViewChange={(v) => { setActiveView(v); setTimeLeft(getIntervalForView(v)); }} stats={stats} />
      </main>

      {isModalOpen && <ReminderModal reminder={editingReminder} prefillCategory={activeView === ViewType.SHOPPING ? 'Things to Buy' : activeView === ViewType.WORKS ? 'Work' : undefined} onClose={() => { setIsModalOpen(false); setEditingReminder(null); }} onSave={(data) => { if(data.id) setReminders(p => p.map(x => x.id === data.id ? { ...x, ...data } as Reminder : x)); else setReminders(p => [...p, { ...data, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), completed: false, completedInstances: [] }]); setIsModalOpen(false); }} />}
    </div>
  );
};

export default App;
