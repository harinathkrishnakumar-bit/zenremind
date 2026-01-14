
import React, { useState, useEffect, useMemo } from 'react';
import { Reminder, ViewType, Priority, RecurrenceType, VaultField, Habit } from './types';
import Sidebar from './components/Sidebar';
import ReminderCard from './components/ReminderCard';
import ReminderModal from './components/ReminderModal';
import HabitTracker from './components/HabitTracker';
import { Icon } from './components/Icon';
import { isToday, isThisWeek, isThisMonth, formatNiceDate } from './utils/dateUtils';
import { getOccurrencesInRange } from './utils/recurrenceUtils';

const STORAGE_KEY = 'zenremind_pro_v1';
const VAULT_STORAGE_KEY = 'zenremind_vault_pro_v1';
const HABITS_STORAGE_KEY = 'zenremind_habits_pro_v1';

// Dynamic intervals
const DASHBOARD_INTERVAL = 10000; // 10 seconds
const STANDARD_INTERVAL = 8000;   // 8 seconds

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
        { id: '1', label: 'License ID', value: '' },
        { id: '2', label: 'Membership No', value: '' }
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
          const views = [ViewType.DASHBOARD, ViewType.TODAY, ViewType.WEEK, ViewType.MONTH, ViewType.WORKS, ViewType.SHOPPING, ViewType.OUTSTANDING, ViewType.HABITS];
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

  const displayReminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (activeView === ViewType.DASHBOARD || activeView === ViewType.HABITS) return [];
    
    // Base filter: Only show uncompleted items
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

    let rangeStart = new Date(today);
    let rangeEnd = new Date(today);
    switch (activeView) {
      case ViewType.TODAY: rangeEnd.setHours(23, 59, 59, 999); break;
      case ViewType.WEEK: rangeEnd.setDate(today.getDate() + 7); break;
      case ViewType.MONTH: rangeEnd.setMonth(today.getMonth() + 1); break;
    }

    let expanded: Reminder[] = [];
    baseReminders.filter(r => r.category.toLowerCase() !== 'shopping' && r.category.toLowerCase() !== 'things to buy' && r.category.toLowerCase() !== 'work').forEach(r => { 
      const instances = getOccurrencesInRange(r, rangeStart, rangeEnd);
      // Filter out completed recurring instances
      const filteredInstances = instances.filter(inst => !r.completedInstances?.includes(inst.id));
      expanded = [...expanded, ...filteredInstances]; 
    });
      
    return expanded.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [reminders, activeView]);

  const stats = useMemo(() => ({
    today: reminders.filter(r => isToday(r.dueDate) && !r.completed).length,
    week: reminders.filter(r => isThisWeek(r.dueDate) && !r.completed).length,
    month: reminders.filter(r => isThisMonth(r.dueDate) && !r.completed).length,
    shopping: reminders.filter(r => (r.category.toLowerCase() === 'shopping' || r.category.toLowerCase() === 'things to buy') && !r.completed).length,
    works: reminders.filter(r => r.category.toLowerCase() === 'work' && !r.completed).length,
    outstanding: reminders.filter(r => r.recurrence && r.recurrence.type === RecurrenceType.YEARLY && !r.completed).length,
    habits: habits.length
  }), [reminders, habits]);

  const upcomingBirthdays = useMemo(() => {
    const now = new Date();
    const rangeEnd = new Date();
    rangeEnd.setMonth(now.getMonth() + 3); 
    
    let birthdays: Reminder[] = [];
    reminders.filter(r => r.category.toLowerCase() === 'birthday' && !r.completed).forEach(r => {
      birthdays = [...birthdays, ...getOccurrencesInRange(r, now, rangeEnd)];
    });
    return birthdays.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 3);
  }, [reminders]);

  const importantEvents = useMemo(() => {
    return reminders
      .filter(r => (r.priority === Priority.HIGH || r.category.toLowerCase() === 'event' || r.category.toLowerCase() === 'classes') && !r.completed)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);
  }, [reminders]);

  const updateVaultField = (id: string, updates: Partial<VaultField>) => setVaultFields(v => v.map(f => f.id === id ? { ...f, ...updates } : f));
  const addVaultField = () => setVaultFields([...vaultFields, { id: Date.now().toString(), label: 'Label Name', value: '' }]);
  const removeVaultField = (id: string) => setVaultFields(v => v.filter(f => f.id !== id));

  const toggleComplete = (instanceId: string) => {
    const isRecurringInstance = instanceId.includes('::');
    const baseId = isRecurringInstance ? instanceId.split('::')[0] : instanceId;
    
    setReminders(prev => {
      if (!isRecurringInstance) {
        // For non-recurring, completion means deletion
        return prev.filter(r => r.id !== baseId);
      }

      // For recurring, add to completed instances to hide this specific one
      return prev.map(r => {
        if (r.id !== baseId) return r;
        const completedInstances = r.completedInstances || [];
        return {
          ...r,
          completedInstances: [...completedInstances, instanceId]
        };
      });
    });
  };

  const deleteReminder = (id: string) => {
    const baseId = id.includes('::') ? id.split('::')[0] : id;
    setReminders(prev => prev.filter(r => r.id !== baseId));
  };

  const handleSaveReminder = (data: Omit<Reminder, 'id' | 'createdAt'> & { id?: string }) => {
    if (data.id) setReminders(prev => prev.map(r => r.id === data.id ? { ...r, ...data } as Reminder : r));
    else setReminders(prev => [...prev, { ...data, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), completed: false, completedInstances: [] }]);
    setIsModalOpen(false);
    setEditingReminder(null);
  };

  const handleViewChange = (v: ViewType) => {
    setActiveView(v);
    setTimeLeft(getIntervalForView(v));
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        onViewChange={handleViewChange} 
        isOpen={true}
        onClose={() => {}}
        stats={stats} 
      />

      <main 
        className="flex-1 flex flex-col min-w-0"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-sm sm:text-lg font-bold text-gray-800 tracking-tight truncate">
              {activeView === ViewType.SHOPPING ? 'Things to Buy' : activeView === ViewType.WORKS ? 'Works to do' : activeView.replace(/_/g, ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isPaused ? 'text-blue-500' : 'text-orange-500'}`}>
                  {isPaused ? 'Paused' : `Next in: ${Math.ceil(timeLeft / 1000)}s`}
                </span>
                <div className="w-16 sm:w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-100 linear ${isPaused ? 'bg-blue-400' : 'bg-orange-500'}`} 
                    style={{ width: `${(timeLeft / getIntervalForView(activeView)) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
            <button 
              onClick={() => { 
                setEditingReminder(null); 
                setIsModalOpen(true); 
              }} 
              className="btn-primary p-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
              <Icon name="plus" className="w-4 h-4" /> <span className="hidden sm:inline">New Entry</span>
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-4xl mx-auto">
            {activeView === ViewType.HABITS ? (
              <HabitTracker 
                habits={habits} 
                onAddHabit={(t) => setHabits(p => [...p, { id: Date.now().toString(), title: t, completedDates: [], createdAt: new Date().toISOString() }])} 
                onDeleteHabit={(id) => setHabits(p => p.filter(h => h.id !== id))} 
                onToggleDate={(id, d) => setHabits(p => p.map(h => h.id === id ? { ...h, completedDates: h.completedDates.includes(d) ? h.completedDates.filter(x => x !== d) : [...h.completedDates, d] } : h))} 
              />
            ) : activeView === ViewType.DASHBOARD ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 sm:p-8 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Executive Dashboard</h1>
                    <p className="text-gray-500 text-xs sm:text-sm">Welcome. You have {stats.today} tasks for today.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 sm:p-6 bg-orange-50 border border-orange-100 rounded-2xl">
                      <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Weekly</span>
                      <p className="text-xl sm:text-2xl font-black text-orange-700">{stats.week}</p>
                    </div>
                    <div className="p-4 sm:p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Events</span>
                      <p className="text-xl sm:text-2xl font-black text-gray-800">{stats.outstanding}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                       <Icon name="cake" className="w-4 h-4 text-orange-500" />
                       <h2 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Upcoming Birthdays</h2>
                    </div>
                    <div className="p-6 flex-1 space-y-4">
                      {upcomingBirthdays.length > 0 ? upcomingBirthdays.map(b => (
                        <div key={b.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0">
                          <span className="font-semibold text-gray-800">{b.title}</span>
                          <span className="text-gray-400 text-[10px]">{formatNiceDate(b.dueDate).split(',')[0]}</span>
                        </div>
                      )) : (
                        <p className="text-xs text-gray-400 italic py-4">No birthdays soon.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                       <Icon name="target" className="w-4 h-4 text-blue-500" />
                       <h2 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Important Events & Classes</h2>
                    </div>
                    <div className="p-6 flex-1 space-y-4">
                      {importantEvents.length > 0 ? importantEvents.map(e => (
                        <div key={e.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0">
                          <div className="flex flex-col">
                             <span className="font-semibold text-gray-800 truncate max-w-[120px] sm:max-w-none">{e.title}</span>
                             <span className="text-[9px] text-gray-400 uppercase font-bold">{e.category}</span>
                          </div>
                          <span className="text-gray-400 text-[10px]">{formatNiceDate(e.dueDate)}</span>
                        </div>
                      )) : (
                        <p className="text-xs text-gray-400 italic py-4">No major events scheduled.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <Icon name="target" className="text-orange-500 w-5 h-5" />
                      <h2 className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wider">Identity Vault</h2>
                    </div>
                    <button onClick={addVaultField} className="text-[10px] font-bold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1">
                      <Icon name="plus" className="w-3 h-3" /> Add Secure Field
                    </button>
                  </div>
                  <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {vaultFields.map(field => (
                      <div key={field.id} className="space-y-3 group">
                        <div className="flex justify-between items-center">
                           <input 
                             className="text-[11px] font-black text-gray-800 uppercase tracking-widest bg-white border border-gray-100 rounded px-2 py-1 outline-none focus:border-orange-300 w-full"
                             value={field.label}
                             placeholder="Field Label"
                             onChange={(e) => updateVaultField(field.id, { label: e.target.value })}
                           />
                           <button onClick={() => removeVaultField(field.id)} className="opacity-0 group-hover:opacity-100 ml-2 text-gray-300 hover:text-red-500 transition-all">
                             <Icon name="trash" className="w-3 h-3" />
                           </button>
                        </div>
                        <input 
                          type="text" 
                          value={field.value} 
                          placeholder="Secret Value"
                          onChange={(e) => updateVaultField(field.id, { value: e.target.value })} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-gray-700 focus:border-orange-500 outline-none transition-all font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 sm:mb-8 flex justify-between items-end">
                   <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight capitalize">
                      {activeView === ViewType.SHOPPING ? 'Things to Buy' : activeView === ViewType.WORKS ? 'Works to do' : activeView.replace(/_/g, ' ')}
                   </h1>
                   {(activeView === ViewType.SHOPPING || activeView === ViewType.WORKS) && (
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Est. Total</span>
                        <p className="text-lg sm:text-xl font-black text-orange-600">${displayReminders.reduce((acc, r) => acc + (r.cost || 0), 0).toFixed(2)}</p>
                      </div>
                   )}
                </div>
                {displayReminders.length === 0 ? (
                  <div className="text-center py-24 sm:py-32 bg-white border border-gray-200 rounded-2xl">
                    <Icon name="check" className="w-10 h-10 sm:w-12 sm:h-12 text-gray-100 mx-auto mb-4" />
                    <p className="text-gray-400 text-xs sm:text-sm font-medium">Clear for now.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4">
                    {displayReminders.map(reminder => (
                      activeView === ViewType.WORKS ? (
                        <div key={reminder.id} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-3 group relative shadow-sm hover:shadow-md transition-all">
                           <div className="flex justify-between items-start">
                              <h3 className="text-lg font-bold text-gray-900 tracking-tight">{reminder.title}</h3>
                              <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                reminder.priority === Priority.HIGH ? 'bg-red-50 text-red-600 border border-red-100' :
                                reminder.priority === Priority.MEDIUM ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              }`}>
                                {reminder.priority}
                              </div>
                           </div>
                           <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                              {reminder.description || "No description provided."}
                           </p>
                           <div className="flex justify-between items-center mt-2 border-t border-gray-50 pt-3">
                              <div className="text-lg font-black text-orange-600">
                                 ${(reminder.cost || 0).toFixed(2)}
                              </div>
                              <div className="flex gap-2 items-center">
                                <button 
                                  onClick={() => toggleComplete(reminder.id)}
                                  className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-all"
                                >
                                  <Icon name="check" className="w-3.5 h-3.5" /> Complete
                                </button>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                  <button onClick={() => setEditingReminder(reminder) || setIsModalOpen(true)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-all">
                                    <Icon name="edit" className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => deleteReminder(reminder.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-all">
                                    <Icon name="trash" className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                           </div>
                        </div>
                      ) : (
                        <ReminderCard 
                          key={reminder.id} 
                          reminder={reminder} 
                          onToggleComplete={toggleComplete} 
                          onDelete={deleteReminder} 
                          onEdit={(r) => { setEditingReminder(r); setIsModalOpen(true); }}
                          isCompact={activeView === ViewType.SHOPPING}
                        />
                      )
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {isModalOpen && (
        <ReminderModal 
          reminder={editingReminder} 
          prefillCategory={activeView === ViewType.SHOPPING ? 'Things to Buy' : activeView === ViewType.WORKS ? 'Work' : undefined}
          onClose={() => { setIsModalOpen(false); setEditingReminder(null); }} 
          onSave={handleSaveReminder} 
        />
      )}
    </div>
  );
};

export default App;
