import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Reminder, Habit } from '../types';

const STORAGE_KEY_REMINDERS = 'zenremind_pro_v3_final_renewals';
const STORAGE_KEY_HABITS = 'zenremind_habits_pro_v3_final_renewals';

// ============================================================================
// REMINDERS
// ============================================================================

export const fetchReminders = async (userId: string | null): Promise<Reminder[]> => {
  if (!isSupabaseConfigured() || !userId) {
    // Fallback to localStorage
    const saved = localStorage.getItem(STORAGE_KEY_REMINDERS);
    return saved ? JSON.parse(saved) : [];
  }

  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching reminders:', error);
    // Fallback to localStorage
    const saved = localStorage.getItem(STORAGE_KEY_REMINDERS);
    return saved ? JSON.parse(saved) : [];
  }
};

export const saveReminder = async (userId: string | null, reminder: Reminder): Promise<void> => {
  if (!isSupabaseConfigured() || !userId) {
    // Fallback to localStorage
    const reminders = await fetchReminders(null);
    const existing = reminders.find(r => r.id === reminder.id);
    const updated = existing
      ? reminders.map(r => r.id === reminder.id ? reminder : r)
      : [...reminders, reminder];
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(updated));
    return;
  }

  try {
    const dbReminder = {
      id: reminder.id,
      user_id: userId,
      title: reminder.title,
      description: reminder.description,
      due_date: reminder.dueDate,
      priority: reminder.priority,
      category: reminder.category,
      completed: reminder.completed,
      completed_instances: reminder.completedInstances || [],
      created_at: reminder.createdAt,
      cost: reminder.cost || null,
      recurrence: reminder.recurrence || null,
      policy_number: reminder.policyNumber || null,
      provider: reminder.provider || null,
    };

    const { error } = await supabase
      .from('reminders')
      .upsert(dbReminder, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving reminder:', error);
    throw error;
  }
};

export const deleteReminder = async (userId: string | null, reminderId: string): Promise<void> => {
  if (!isSupabaseConfigured() || !userId) {
    // Fallback to localStorage
    const reminders = await fetchReminders(null);
    const updated = reminders.filter(r => r.id !== reminderId);
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(updated));
    return;
  }

  try {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw error;
  }
};

// ============================================================================
// HABITS
// ============================================================================

export const fetchHabits = async (userId: string | null): Promise<Habit[]> => {
  if (!isSupabaseConfigured() || !userId) {
    // Fallback to localStorage
    const saved = localStorage.getItem(STORAGE_KEY_HABITS);
    return saved ? JSON.parse(saved) : [];
  }

  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching habits:', error);
    // Fallback to localStorage
    const saved = localStorage.getItem(STORAGE_KEY_HABITS);
    return saved ? JSON.parse(saved) : [];
  }
};

export const saveHabit = async (userId: string | null, habit: Habit): Promise<void> => {
  if (!isSupabaseConfigured() || !userId) {
    // Fallback to localStorage
    const habits = await fetchHabits(null);
    const existing = habits.find(h => h.id === habit.id);
    const updated = existing
      ? habits.map(h => h.id === habit.id ? habit : h)
      : [...habits, habit];
    localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(updated));
    return;
  }

  try {
    const dbHabit = {
      id: habit.id,
      user_id: userId,
      title: habit.title,
      completed_dates: habit.completedDates,
      created_at: habit.createdAt,
    };

    const { error } = await supabase
      .from('habits')
      .upsert(dbHabit, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving habit:', error);
    throw error;
  }
};

export const deleteHabit = async (userId: string | null, habitId: string): Promise<void> => {
  if (!isSupabaseConfigured() || !userId) {
    // Fallback to localStorage
    const habits = await fetchHabits(null);
    const updated = habits.filter(h => h.id !== habitId);
    localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(updated));
    return;
  }

  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
};
