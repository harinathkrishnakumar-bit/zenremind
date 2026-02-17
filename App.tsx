import React, { useState, useEffect, useMemo } from 'react';
import { Reminder, ViewType, Priority, RecurrenceType, Habit, VaultItem } from './types';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import ReminderCard from './components/ReminderCard';
import ReminderModal from './components/ReminderModal';
import HabitTracker from './components/HabitTracker';
import VaultView from './components/VaultView';
import { Icon } from './components/Icon';
import { isToday, isThisWeek, isThisMonth } from './utils/dateUtils';
import { getOccurrencesInRange } from './utils/recurrenceUtils';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { fetchReminders, saveReminder, deleteReminder, fetchHabits, saveHabit, deleteHabit, fetchVaultItems, saveVaultItem, deleteVaultItem } from './services/database';

const DASHBOARD_INTERVAL = 15000;
const STANDARD_INTERVAL = 8000;

const getIntervalForView = (view: ViewType) => {
  return view === ViewType.DASHBOARD ? DASHBOARD_INTERVAL : STANDARD_INTERVAL;
};

const App: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [activeView, setActiveView] = useState<ViewType>(ViewType.DASHBOARD);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [timeLeft, setTimeLeft] = useState(getIntervalForView(ViewType.DASHBOARD));
  const [isPaused, setIsPaused] = useState(false);

  // Authentication state
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth and load data
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data when user changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [reminderData, habitData, vaultData] = await Promise.all([
          fetchReminders(user?.id || null),
          fetchHabits(user?.id || null),
          fetchVaultItems(user?.id || null),
        ]);
        setReminders(reminderData);
        setHabits(habitData);
        setVaultItems(vaultData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Auto-rotation timer
  useEffect(() => {
    if (isModalOpen || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          const views = [ViewType.DASHBOARD, ViewType.TODAY, ViewType.WORKS, ViewType.RENEWALS];
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

  // Authentication handlers
  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setAuthError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      setAuthLoading(false);
      if (error) {
        setAuthError(error.message);
      } else if (data.user && !data.session) {
        // Email confirmation is still on in Supabase — tell the user
        setAuthSuccess('Account created! Check your email to confirm, then sign in.');
        setAuthMode('signin');
        setPassword('');
      } else {
        // Email confirmation is off — user is signed in immediately
        setAuthSuccess('Account created! You are now signed in.');
        setPassword('');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setAuthLoading(false);
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setAuthError('Please confirm your email first, then sign in. Check your inbox.');
        } else {
          setAuthError('Invalid email or password. If you haven\'t created an account yet, switch to "Create Account".');
        }
      } else {
        setEmail('');
        setPassword('');
        setAuthError('');
        setAuthSuccess('');
      }
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
  };

  const stats = useMemo(() => ({
    today: reminders.filter(r => isToday(r.dueDate) && !r.completed).length,
    week: reminders.filter(r => isThisWeek(r.dueDate) && !r.completed).length,
    month: reminders.filter(r => isThisMonth(r.dueDate) && !r.completed).length,
    works: reminders.filter(r => r.category.toLowerCase() === 'work' && !r.completed).length,
    shopping: reminders.filter(r => (r.category.toLowerCase() === 'shopping' || r.category.toLowerCase() === 'things to buy') && !r.completed).length,
    habits: habits.length,
    outstanding: reminders.filter(r => r.category.toLowerCase() === 'birthday' && !r.completed).length,
    renewals: reminders.filter(r => r.category.toLowerCase() === 'renewal' && !r.completed).length,
  }), [reminders, habits]);

  const dashboardData = useMemo(() => {
    const now = new Date();
    const futureYear = new Date();
    futureYear.setFullYear(now.getFullYear() + 1);

    let birthdayEvents: Reminder[] = [];
    reminders.filter(r => r.category.toLowerCase() === 'birthday' && !r.completed).forEach(r => {
      const occurrences = getOccurrencesInRange(r, now, futureYear);
      birthdayEvents = [...birthdayEvents, ...occurrences];
    });
    const upcomingBirthdays = birthdayEvents.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 3);

    let renewalEvents: Reminder[] = [];
    reminders.filter(r => r.category.toLowerCase() === 'renewal' && !r.completed).forEach(r => {
      const occurrences = getOccurrencesInRange(r, now, futureYear);
      renewalEvents = [...renewalEvents, ...occurrences];
    });
    const upcomingRenewals = renewalEvents.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 3);

    const highPriorityItems = reminders
      .filter(r => r.priority === Priority.HIGH && !r.completed)
      .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);

    return { upcomingBirthdays, highPriorityItems, upcomingRenewals };
  }, [reminders]);

  const displayReminders = useMemo(() => {
    if (activeView === ViewType.DASHBOARD || activeView === ViewType.HABITS) return [];
    const baseReminders = reminders.filter(r => !r.completed);

    if (activeView === ViewType.OUTSTANDING) {
      return baseReminders.filter(r => r.category.toLowerCase() === 'birthday');
    }
    if (activeView === ViewType.RENEWALS) {
      return baseReminders.filter(r => r.category.toLowerCase() === 'renewal' || r.category.toLowerCase() === 'policy');
    }
    if (activeView === ViewType.SHOPPING) {
      return baseReminders.filter(r => r.category.toLowerCase() === 'shopping' || r.category.toLowerCase() === 'things to buy');
    }
    if (activeView === ViewType.WORKS) {
      return baseReminders.filter(r => r.category.toLowerCase() === 'work');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let rangeStart = new Date(today);
    let rangeEnd = new Date(today);
    rangeEnd.setHours(23, 59, 59, 999);

    if (activeView === ViewType.WEEK) rangeEnd.setDate(today.getDate() + 7);
    else if (activeView === ViewType.MONTH) rangeEnd.setMonth(today.getMonth() + 1);

    let expanded: Reminder[] = [];
    baseReminders.filter(r =>
      r.category.toLowerCase() !== 'shopping' &&
      r.category.toLowerCase() !== 'things to buy' &&
      r.category.toLowerCase() !== 'work' &&
      r.category.toLowerCase() !== 'renewal'
    ).forEach(r => {
      const instances = getOccurrencesInRange(r, rangeStart, rangeEnd);
      const filteredInstances = instances.filter(inst => !r.completedInstances?.includes(inst.id));
      expanded = [...expanded, ...filteredInstances];
    });

    return expanded.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [reminders, activeView]);

  const handleToggleComplete = async (id: string) => {
    const isRecurring = id.includes('::');
    const baseId = isRecurring ? id.split('::')[0] : id;

    if (!isRecurring) {
      await deleteReminder(user?.id || null, baseId);
      setReminders(prev => prev.filter(r => r.id !== baseId));
    } else {
      const updated = reminders.map(r =>
        r.id === baseId ? { ...r, completedInstances: [...(r.completedInstances || []), id] } : r
      );
      setReminders(updated);
      const reminder = updated.find(r => r.id === baseId);
      if (reminder) await saveReminder(user?.id || null, reminder);
    }
  };

  const handleSaveReminder = async (data: any) => {
    let reminder: Reminder;

    if (data.id) {
      // Update existing
      reminder = { ...reminders.find(r => r.id === data.id)!, ...data } as Reminder;
      setReminders(prev => prev.map(r => r.id === data.id ? reminder : r));
    } else {
      // Create new
      reminder = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        completed: false,
        completedInstances: []
      };
      setReminders(prev => [...prev, reminder]);
    }

    await saveReminder(user?.id || null, reminder);
    setIsModalOpen(false);
  };

  const handleDeleteReminder = async (id: string) => {
    await deleteReminder(user?.id || null, id);
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleAddHabit = async (title: string) => {
    const habit: Habit = {
      id: Date.now().toString(),
      title,
      completedDates: [],
      createdAt: new Date().toISOString()
    };
    await saveHabit(user?.id || null, habit);
    setHabits(prev => [...prev, habit]);
  };

  const handleToggleHabitDate = async (id: string, dateStr: string) => {
    const updated = habits.map(h =>
      h.id === id
        ? { ...h, completedDates: h.completedDates.includes(dateStr)
            ? h.completedDates.filter(d => d !== dateStr)
            : [...h.completedDates, dateStr]
          }
        : h
    );
    setHabits(updated);
    const habit = updated.find(h => h.id === id);
    if (habit) await saveHabit(user?.id || null, habit);
  };

  const handleDeleteHabit = async (id: string) => {
    await deleteHabit(user?.id || null, id);
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // Vault handlers
  const handleAddVaultItem = async (item: VaultItem) => {
    setVaultItems(prev => [item, ...prev]);
    try {
      await saveVaultItem(user?.id || null, item);
    } catch (error) {
      console.error('Failed to save vault item:', error);
    }
  };

  const handleUpdateVaultItem = async (item: VaultItem) => {
    setVaultItems(prev => prev.map(v => v.id === item.id ? item : v));
    try {
      await saveVaultItem(user?.id || null, item);
    } catch (error) {
      console.error('Failed to update vault item:', error);
    }
  };

  const handleDeleteVaultItem = async (id: string) => {
    setVaultItems(prev => prev.filter(v => v.id !== id));
    try {
      await deleteVaultItem(user?.id || null, id);
    } catch (error) {
      console.error('Failed to delete vault item:', error);
    }
  };

  // Today's events for dashboard
  const todayEvents = useMemo(() => {
    const now = new Date();
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    let events: Reminder[] = [];
    reminders
      .filter(r => !r.completed && r.category.toLowerCase() !== 'shopping' && r.category.toLowerCase() !== 'things to buy' && r.category.toLowerCase() !== 'work' && r.category.toLowerCase() !== 'renewal')
      .forEach(r => {
        const occ = getOccurrencesInRange(r, start, end);
        events = [...events, ...occ.filter(o => !r.completedInstances?.includes(o.id))];
      });
    return events.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [reminders]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-600 to-orange-500">
        <div className="text-white text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl font-bold">Loading ZenRemind...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden flex-col md:flex-row">
      <div className="hidden md:flex h-full">
        <Sidebar activeView={activeView} onViewChange={(v) => { setActiveView(v); setTimeLeft(getIntervalForView(v)); }} stats={stats} isOpen={true} onClose={()=>{}} />
      </div>

      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 h-full overflow-hidden" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-lg font-black text-gray-800 tracking-tight truncate">
              {activeView === ViewType.SHOPPING ? 'Buy List' : activeView === ViewType.WORKS ? 'Works' : activeView === ViewType.RENEWALS ? 'Policies & Renewals' : activeView === ViewType.TODAY ? "Timeline" : activeView.replace(/_/g, ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end">
                <span className={`text-[9px] font-black uppercase tracking-widest ${isPaused ? 'text-blue-500' : 'text-orange-500'}`}>
                   {isPaused ? 'Paused' : `Auto-Cycle: ${Math.ceil(timeLeft / 1000)}s`}
                </span>
                <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                   <div className={`h-full transition-all duration-100 linear ${isPaused ? 'bg-blue-400' : 'bg-orange-500'}`} style={{ width: `${(timeLeft / getIntervalForView(activeView)) * 100}%` }} />
                </div>
             </div>
             <button onClick={() => { setEditingReminder(null); setIsModalOpen(true); }} className="btn-primary px-4 py-2 rounded-xl flex items-center justify-center gap-2">
                <Icon name="plus" className="w-5 h-5" />
                <span className="hidden md:inline font-black text-xs uppercase tracking-widest">New Entry</span>
             </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8">
            {activeView === ViewType.DASHBOARD ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Pending', val: stats.today + stats.works, color: 'orange', icon: 'clock' },
                    { label: 'Habits', val: stats.habits, color: 'gray', icon: 'star' },
                    { label: 'Renewals', val: stats.renewals, color: 'emerald', icon: 'calendar' },
                    { label: 'Shopping', val: stats.shopping, color: 'blue', icon: 'list' }
                  ].map(s => (
                    <div key={s.label} className={`p-5 bg-${s.color === 'gray' ? 'gray-800' : s.color + '-50'} border border-${s.color === 'gray' ? 'gray-900' : s.color + '-100'} rounded-3xl flex flex-col justify-center`}>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${s.color === 'gray' ? 'text-gray-400' : 'text-' + s.color + '-600'}`}>{s.label}</span>
                       <span className={`text-3xl font-black ${s.color === 'gray' ? 'text-white' : 'text-' + s.color + '-700'}`}>{s.val}</span>
                    </div>
                  ))}
                </div>

                {/* Auth Card */}
                {isSupabaseConfigured() && (
                  <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <h3 className="text-xl font-black text-gray-900 mb-1">☁️ Cloud Sync</h3>
                    <p className="text-gray-500 text-xs mb-4">Sync your data across all devices</p>

                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      {authLoading ? (
                        <p className="text-xs text-gray-500">Checking login status...</p>
                      ) : user ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">✓ Synced</p>
                            <p className="text-sm font-black text-gray-800 truncate">{user.email}</p>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                            <button
                              onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthSuccess(''); }}
                              className={`flex-1 py-1.5 text-xs font-black rounded-md transition-all ${authMode === 'signin' ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}
                            >Sign In</button>
                            <button
                              onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}
                              className={`flex-1 py-1.5 text-xs font-black rounded-md transition-all ${authMode === 'signup' ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}
                            >Create Account</button>
                          </div>
                          <input
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-orange-400"
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                          />
                          <input
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-orange-400"
                            type="password"
                            placeholder="Password (min 6 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                          />
                          {authError && <p className="text-[10px] text-red-500 font-bold">{authError}</p>}
                          {authSuccess && <p className="text-[10px] text-emerald-600 font-bold">{authSuccess}</p>}
                          <button
                            onClick={handleAuth}
                            disabled={authLoading}
                            className="py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
                          >
                            {authLoading ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
                          </button>
                          <p className="text-[10px] text-gray-400 text-center">Use the same email + password on all devices</p>
                        </div>
                      )}
                      {!user && <span />}
                    </div>
                  </div>
                )}

                {/* Today's Events */}
                <div className="bg-white border-2 border-blue-50 rounded-[2.5rem] shadow-xl shadow-blue-500/5 overflow-hidden border-t-blue-500 border-t-8">
                  <div className="px-8 py-5 border-b border-gray-100 bg-blue-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon name="clock" className="w-5 h-5 text-blue-500" />
                      <h2 className="text-xs font-black text-blue-700 uppercase tracking-widest">Today's Events</h2>
                    </div>
                    <span className="text-[10px] font-black text-blue-400 uppercase">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="p-6 space-y-3">
                    {todayEvents.length === 0 ? (
                      <p className="text-center text-xs font-bold text-gray-300 uppercase tracking-widest py-6">Nothing scheduled for today</p>
                    ) : todayEvents.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-gray-800 truncate">{item.title}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                            {item.category} {item.dueDate ? `• ${new Date(item.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </span>
                        </div>
                        <button onClick={() => handleToggleComplete(item.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-xl border border-gray-200 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm shrink-0 ml-3">
                          <Icon name="check" className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* High Priority */}
                  <div className="space-y-4">
                    <div className="bg-white border-2 border-red-50 rounded-[2.5rem] shadow-xl shadow-red-500/5 overflow-hidden border-t-red-500 border-t-8">
                      <div className="px-8 py-6 border-b border-gray-100 bg-red-50/30 flex items-center gap-3">
                        <Icon name="alert" className="w-5 h-5 text-red-500" />
                        <h2 className="text-xs font-black text-red-700 uppercase tracking-widest">High Priority Action Required</h2>
                      </div>
                      <div className="p-8 space-y-4">
                        {dashboardData.highPriorityItems.length > 0 ? dashboardData.highPriorityItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-red-200 transition-all hover:translate-x-1">
                            <div className="flex flex-col min-w-0">
                               <span className="text-sm font-black text-gray-800 truncate">{item.title}</span>
                               <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{item.category} • {new Date(item.dueDate).toLocaleDateString()}</span>
                            </div>
                            <button onClick={() => handleToggleComplete(item.id)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-gray-200 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                               <Icon name="check" className="w-5 h-5" />
                            </button>
                          </div>
                        )) : (
                          <div className="text-center py-10">
                             <p className="text-xs font-bold text-gray-300 uppercase tracking-widest italic">All clear for now</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Renewals */}
                  <div className="space-y-4">
                    <div className="bg-white border-2 border-emerald-50 rounded-[2.5rem] shadow-xl shadow-emerald-500/5 overflow-hidden border-t-emerald-500 border-t-8 h-full">
                      <div className="px-8 py-6 border-b border-gray-100 bg-emerald-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon name="calendar" className="w-5 h-5 text-emerald-600" />
                          <h2 className="text-xs font-black text-emerald-800 uppercase tracking-widest">Next Renewals</h2>
                        </div>
                        <button onClick={() => setActiveView(ViewType.RENEWALS)} className="text-[10px] font-black text-emerald-600 hover:underline tracking-widest uppercase">Policies</button>
                      </div>
                      <div className="p-8 space-y-6">
                         {dashboardData.upcomingRenewals.length > 0 ? dashboardData.upcomingRenewals.map(e => (
                           <div key={e.id} className="flex gap-5 items-center p-4 rounded-[2rem] hover:bg-emerald-50/30 transition-all group">
                              <div className="w-14 h-14 rounded-2xl bg-white border-2 border-emerald-100 flex flex-col items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                                 <span className="text-[10px] font-black text-emerald-600 uppercase mb-0.5">{new Date(e.dueDate).toLocaleString('default', { month: 'short' })}</span>
                                 <span className="text-2xl font-black text-emerald-800 leading-none">{new Date(e.dueDate).getDate()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-base font-black text-gray-800 truncate">{e.title}</p>
                                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tight">
                                    Expires in {Math.ceil((new Date(e.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                                 </p>
                              </div>
                           </div>
                         )) : (
                           <div className="flex flex-col items-center justify-center py-20 opacity-20">
                              <Icon name="calendar" className="w-12 h-12 mb-4" />
                              <p className="text-xs font-black uppercase tracking-widest text-center">No upcoming renewals tracked</p>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Birthdays */}
                {dashboardData.upcomingBirthdays.length > 0 && (
                  <div className="bg-white border-2 border-pink-50 rounded-[2.5rem] shadow-xl shadow-pink-500/5 overflow-hidden border-t-pink-400 border-t-8">
                    <div className="px-8 py-6 border-b border-gray-100 bg-pink-50/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🎂</span>
                        <h2 className="text-xs font-black text-pink-700 uppercase tracking-widest">Upcoming Birthdays</h2>
                      </div>
                      <button onClick={() => setActiveView(ViewType.OUTSTANDING)} className="text-[10px] font-black text-pink-600 hover:underline tracking-widest uppercase">All Birthdays</button>
                    </div>
                    <div className="p-8">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {dashboardData.upcomingBirthdays.map(b => {
                          const daysUntil = Math.ceil((new Date(b.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          const isToday = daysUntil === 0;
                          const isSoon = daysUntil <= 7;
                          return (
                            <div key={b.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isToday ? 'bg-pink-50 border-pink-300' : isSoon ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
                              <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-md ${isToday ? 'bg-pink-500' : isSoon ? 'bg-orange-400' : 'bg-white border-2 border-gray-200'}`}>
                                <span className={`text-[10px] font-black uppercase ${isToday || isSoon ? 'text-white' : 'text-gray-400'}`}>{new Date(b.dueDate).toLocaleString('default', { month: 'short' })}</span>
                                <span className={`text-lg font-black leading-none ${isToday || isSoon ? 'text-white' : 'text-gray-700'}`}>{new Date(b.dueDate).getDate()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-gray-800 truncate">{b.title}</p>
                                <p className={`text-[10px] font-black uppercase tracking-tight ${isToday ? 'text-pink-500' : isSoon ? 'text-orange-500' : 'text-gray-400'}`}>
                                  {isToday ? '🎉 Today!' : `In ${daysUntil} day${daysUntil === 1 ? '' : 's'}`}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Habits */}
                <HabitTracker
                  habits={habits}
                  onAddHabit={handleAddHabit}
                  onDeleteHabit={handleDeleteHabit}
                  onToggleDate={handleToggleHabitDate}
                />
              </div>
            ) : activeView === ViewType.RENEWALS ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                   <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Policies & Essentials</h1>
                   <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Critical Documentation & Deadlines</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Key Policy Details</h2>
                      {displayReminders.filter(r => r.category.toLowerCase() === 'policy' || r.description.length > 0).length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-8 text-center opacity-50">
                           <p className="text-xs font-bold text-gray-400 uppercase">No active policies stored</p>
                        </div>
                      ) : (
                        displayReminders.map(r => (
                          <div key={r.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                             <div className="flex justify-between items-start mb-3">
                                <h3 className="text-base font-black text-gray-800 tracking-tight">{r.title}</h3>
                                <div className="flex gap-2">
                                  <button onClick={() => { setEditingReminder(r); setIsModalOpen(true); }} className="p-1.5 text-gray-300 hover:text-gray-600"><Icon name="edit" className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteReminder(r.id)} className="p-1.5 text-gray-300 hover:text-red-500"><Icon name="trash" className="w-4 h-4" /></button>
                                </div>
                             </div>
                             <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                   <span className="text-gray-400 font-bold uppercase tracking-widest">Due</span>
                                   <span className="text-emerald-600 font-black">{new Date(r.dueDate).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-600 font-medium whitespace-pre-wrap leading-relaxed">{r.description || "No specific details added."}</p>
                             </div>
                          </div>
                        ))
                      )}
                   </div>

                   <div className="space-y-4">
                      <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Upcoming Renewals</h2>
                      {displayReminders.filter(r => r.category.toLowerCase() === 'renewal').length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-8 text-center opacity-50">
                           <p className="text-xs font-bold text-gray-400 uppercase">No renewal alerts set</p>
                        </div>
                      ) : (
                        displayReminders.filter(r => r.category.toLowerCase() === 'renewal').map(r => (
                           <ReminderCard key={r.id} reminder={r} onToggleComplete={handleToggleComplete} onDelete={handleDeleteReminder} onEdit={(rem) => { setEditingReminder(rem); setIsModalOpen(true); }} />
                        ))
                      )}
                   </div>
                </div>
              </div>
            ) : activeView === ViewType.WORKS ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                   <div>
                      <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Work Backlog</h1>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Productivity Value Stream</p>
                   </div>
                   <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl shadow-emerald-200">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Potential</span>
                      <p className="text-2xl font-black leading-none mt-1">${displayReminders.reduce((acc, r) => acc + (r.cost || 0), 0).toFixed(2)}</p>
                   </div>
                </div>
                {displayReminders.length === 0 ? (
                  <div className="text-center py-32 bg-white border-2 border-dashed border-gray-100 rounded-[3rem]">
                    <Icon name="edit" className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                    <p className="text-gray-400 text-sm font-black uppercase tracking-widest">Backlog is empty</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {displayReminders.map(r => (
                      <ReminderCard key={r.id} reminder={r} onToggleComplete={handleToggleComplete} onDelete={handleDeleteReminder} onEdit={(rem) => { setEditingReminder(rem); setIsModalOpen(true); }} />
                    ))}
                  </div>
                )}
              </div>
            ) : activeView === ViewType.VAULT ? (
              <VaultView
                items={vaultItems}
                onAdd={handleAddVaultItem}
                onUpdate={handleUpdateVaultItem}
                onDelete={handleDeleteVaultItem}
              />
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {displayReminders.length === 0 ? (
                   <div className="text-center py-32 bg-white border-2 border-dashed border-gray-100 rounded-[3rem]">
                     <Icon name="clock" className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                     <p className="text-gray-400 text-sm font-black uppercase tracking-widest">Nothing scheduled here</p>
                   </div>
                 ) : (
                   displayReminders.map(r => (
                     <ReminderCard key={r.id} reminder={r} onToggleComplete={handleToggleComplete} onDelete={handleDeleteReminder} onEdit={(rem) => { setEditingReminder(rem); setIsModalOpen(true); }} isCompact={activeView === ViewType.SHOPPING} />
                   ))
                 )}
              </div>
            )}
          </div>
        </section>

        <BottomNav activeView={activeView} onViewChange={(v) => { setActiveView(v); setTimeLeft(getIntervalForView(v)); }} stats={stats} />
      </main>

      {isModalOpen && <ReminderModal reminder={editingReminder} prefillCategory={activeView === ViewType.SHOPPING ? 'Things to Buy' : activeView === ViewType.WORKS ? 'Work' : activeView === ViewType.RENEWALS ? 'Renewal' : undefined} onClose={() => { setIsModalOpen(false); setEditingReminder(null); }} onSave={handleSaveReminder} />}
    </div>
  );
};

export default App;
