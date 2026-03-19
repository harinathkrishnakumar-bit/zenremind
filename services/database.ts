import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Reminder, Habit, VaultItem, GroceryItem, HomeworkItem, CurriculumTopic, GardenPlant, GardenTask, HolidayChecklistItem, ImmediateBuyItem } from '../types';

const STORAGE_KEY_REMINDERS = 'zenremind_pro_v3_final_renewals';
const STORAGE_KEY_HABITS = 'zenremind_habits_pro_v3_final_renewals';
const STORAGE_KEY_VAULT = 'zenremind_vault_pro_v3';
const STORAGE_KEY_HOLIDAY = 'zenremind_holiday_v1';
const STORAGE_KEY_IMMEDIATE_BUY = 'zenremind_immediate_buy_v1';

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
    return (data || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      dueDate: d.due_date,
      priority: d.priority,
      category: d.category,
      completed: d.completed,
      completedInstances: d.completed_instances || [],
      createdAt: d.created_at,
      cost: d.cost ?? undefined,
      recurrence: d.recurrence ?? undefined,
      policyNumber: d.policy_number ?? undefined,
      provider: d.provider ?? undefined,
    }));
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
    return (data || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      completedDates: d.completed_dates || [],
      createdAt: d.created_at,
    }));
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

// ============================================================================
// VAULT ITEMS
// ============================================================================

const localVaultGet = (): VaultItem[] => {
  const saved = localStorage.getItem(STORAGE_KEY_VAULT);
  return saved ? JSON.parse(saved) : [];
};

const localVaultSet = (items: VaultItem[]) => {
  localStorage.setItem(STORAGE_KEY_VAULT, JSON.stringify(items));
};

export const fetchVaultItems = async (userId: string | null): Promise<VaultItem[]> => {
  if (!isSupabaseConfigured() || !userId) {
    return localVaultGet();
  }

  try {
    const { data, error } = await supabase
      .from('vault_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const items = (data || []).map((d: any) => ({
      id: d.id,
      label: d.label,
      value: d.value,
      category: d.category,
      createdAt: d.created_at,
    }));
    // Update local cache with cloud data
    localVaultSet(items);
    return items;
  } catch (error) {
    console.error('Error fetching vault items:', error);
    // Fall back to local cache
    return localVaultGet();
  }
};

export const saveVaultItem = async (userId: string | null, item: VaultItem): Promise<void> => {
  // Always update local cache first
  const local = localVaultGet();
  const existing = local.find(i => i.id === item.id);
  localVaultSet(existing ? local.map(i => i.id === item.id ? item : i) : [item, ...local]);

  if (!isSupabaseConfigured() || !userId) return;

  try {
    const { error } = await supabase.from('vault_items').upsert({
      id: item.id,
      user_id: userId,
      label: item.label,
      value: item.value,
      category: item.category,
      created_at: item.createdAt,
    }, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving vault item to Supabase:', error);
    throw error; // Re-throw so caller can show sync warning
  }
};

export const deleteVaultItem = async (userId: string | null, itemId: string): Promise<void> => {
  // Always update local cache first
  localVaultSet(localVaultGet().filter(i => i.id !== itemId));

  if (!isSupabaseConfigured() || !userId) return;

  try {
    const { error } = await supabase
      .from('vault_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting vault item from Supabase:', error);
    throw error;
  }
};

// ============================================================================
// GROCERY / PURCHASE ITEMS
// ============================================================================

const STORAGE_KEY_GROCERY = 'zenremind_grocery_v1';

export const fetchGroceryItems = async (userId: string | null): Promise<GroceryItem[]> => {
  if (!isSupabaseConfigured() || !userId) {
    const saved = localStorage.getItem(STORAGE_KEY_GROCERY);
    return saved ? JSON.parse(saved) : [];
  }
  try {
    const { data, error } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false });
    if (error) throw error;
    const items = (data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      foodType: d.food_type ?? undefined,
      price: d.price ?? undefined,
      quantity: d.quantity,
      store: d.store ?? undefined,
      purchasedAt: d.purchased_at,
      createdAt: d.created_at,
    }));
    localStorage.setItem(STORAGE_KEY_GROCERY, JSON.stringify(items));
    return items;
  } catch (error) {
    console.error('Error fetching grocery items:', error);
    const saved = localStorage.getItem(STORAGE_KEY_GROCERY);
    return saved ? JSON.parse(saved) : [];
  }
};

export const saveGroceryItem = async (userId: string | null, item: GroceryItem): Promise<void> => {
  // Always save locally first
  const local: GroceryItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY_GROCERY) || '[]');
  const exists = local.find(i => i.id === item.id);
  localStorage.setItem(STORAGE_KEY_GROCERY, JSON.stringify(
    exists ? local.map(i => i.id === item.id ? item : i) : [item, ...local]
  ));

  if (!isSupabaseConfigured() || !userId) return;
  try {
    const { error } = await supabase.from('grocery_items').upsert({
      id: item.id,
      user_id: userId,
      name: item.name,
      category: item.category,
      food_type: item.foodType ?? null,
      price: item.price ?? null,
      quantity: item.quantity,
      store: item.store ?? null,
      purchased_at: item.purchasedAt,
      created_at: item.createdAt,
    }, { onConflict: 'id' });
    if (error) throw error;
  } catch (error) {
    console.error('Error saving grocery item:', error);
    throw error;
  }
};

export const deleteGroceryItem = async (userId: string | null, itemId: string): Promise<void> => {
  const local: GroceryItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY_GROCERY) || '[]');
  localStorage.setItem(STORAGE_KEY_GROCERY, JSON.stringify(local.filter(i => i.id !== itemId)));

  if (!isSupabaseConfigured() || !userId) return;
  try {
    const { error } = await supabase.from('grocery_items').delete().eq('id', itemId).eq('user_id', userId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting grocery item:', error);
  }
};

// ============================================================================
// HOMEWORK
// ============================================================================

const STORAGE_KEY_HOMEWORK = 'zenremind_homework_v1';

export const fetchHomeworkItems = async (userId: string | null): Promise<HomeworkItem[]> => {
  if (!isSupabaseConfigured() || !userId) {
    const saved = localStorage.getItem(STORAGE_KEY_HOMEWORK);
    return saved ? JSON.parse(saved) : [];
  }
  try {
    const { data, error } = await supabase
      .from('homework_items')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    const items = (data || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      subject: d.subject,
      dueDate: d.due_date,
      notes: d.notes ?? undefined,
      completed: d.completed,
      createdAt: d.created_at,
    }));
    localStorage.setItem(STORAGE_KEY_HOMEWORK, JSON.stringify(items));
    return items;
  } catch (error) {
    console.error('Error fetching homework items:', error);
    const saved = localStorage.getItem(STORAGE_KEY_HOMEWORK);
    return saved ? JSON.parse(saved) : [];
  }
};

export const saveHomeworkItem = async (userId: string | null, item: HomeworkItem): Promise<void> => {
  const local: HomeworkItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY_HOMEWORK) || '[]');
  const exists = local.find(i => i.id === item.id);
  localStorage.setItem(STORAGE_KEY_HOMEWORK, JSON.stringify(
    exists ? local.map(i => i.id === item.id ? item : i) : [item, ...local]
  ));
  if (!isSupabaseConfigured() || !userId) return;
  try {
    const { error } = await supabase.from('homework_items').upsert({
      id: item.id,
      user_id: userId,
      title: item.title,
      subject: item.subject,
      due_date: item.dueDate,
      notes: item.notes ?? null,
      completed: item.completed,
      created_at: item.createdAt,
    }, { onConflict: 'id' });
    if (error) throw error;
  } catch (error) {
    console.error('Error saving homework item:', error);
  }
};

export const deleteHomeworkItem = async (userId: string | null, itemId: string): Promise<void> => {
  const local: HomeworkItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY_HOMEWORK) || '[]');
  localStorage.setItem(STORAGE_KEY_HOMEWORK, JSON.stringify(local.filter(i => i.id !== itemId)));
  if (!isSupabaseConfigured() || !userId) return;
  try {
    const { error } = await supabase.from('homework_items').delete().eq('id', itemId).eq('user_id', userId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting homework item:', error);
  }
};

// ============================================================================
// CURRICULUM TOPICS
// ============================================================================

const STORAGE_KEY_CURRICULUM = 'zenremind_curriculum_v1';

export const fetchCurriculumTopics = async (userId: string | null): Promise<CurriculumTopic[]> => {
  if (!isSupabaseConfigured() || !userId) {
    const saved = localStorage.getItem(STORAGE_KEY_CURRICULUM);
    return saved ? JSON.parse(saved) : [];
  }
  try {
    const { data, error } = await supabase
      .from('curriculum_topics')
      .select('*')
      .eq('user_id', userId)
      .order('subject', { ascending: true });
    if (error) throw error;
    const topics = (data || []).map((d: any) => ({
      id: d.id,
      subject: d.subject,
      title: d.title,
      completed: d.completed,
      dueDate: d.due_date ?? undefined,
      notes: d.notes ?? undefined,
      createdAt: d.created_at,
    }));
    localStorage.setItem(STORAGE_KEY_CURRICULUM, JSON.stringify(topics));
    return topics;
  } catch (error) {
    console.error('Error fetching curriculum topics:', error);
    const saved = localStorage.getItem(STORAGE_KEY_CURRICULUM);
    return saved ? JSON.parse(saved) : [];
  }
};

export const saveCurriculumTopic = async (userId: string | null, topic: CurriculumTopic): Promise<void> => {
  const local: CurriculumTopic[] = JSON.parse(localStorage.getItem(STORAGE_KEY_CURRICULUM) || '[]');
  const exists = local.find(t => t.id === topic.id);
  localStorage.setItem(STORAGE_KEY_CURRICULUM, JSON.stringify(
    exists ? local.map(t => t.id === topic.id ? topic : t) : [topic, ...local]
  ));
  if (!isSupabaseConfigured() || !userId) return;
  try {
    const { error } = await supabase.from('curriculum_topics').upsert({
      id: topic.id,
      user_id: userId,
      subject: topic.subject,
      title: topic.title,
      completed: topic.completed,
      due_date: topic.dueDate ?? null,
      notes: topic.notes ?? null,
      created_at: topic.createdAt,
    }, { onConflict: 'id' });
    if (error) throw error;
  } catch (error) {
    console.error('Error saving curriculum topic:', error);
  }
};

export const deleteCurriculumTopic = async (userId: string | null, topicId: string): Promise<void> => {
  const local: CurriculumTopic[] = JSON.parse(localStorage.getItem(STORAGE_KEY_CURRICULUM) || '[]');
  localStorage.setItem(STORAGE_KEY_CURRICULUM, JSON.stringify(local.filter(t => t.id !== topicId)));
  if (!isSupabaseConfigured() || !userId) return;
  try {
    const { error } = await supabase.from('curriculum_topics').delete().eq('id', topicId).eq('user_id', userId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting curriculum topic:', error);
  }
};

// ============================================================================
// GARDEN PLANTS
// ============================================================================

const STORAGE_KEY_GARDEN_PLANTS = 'zenremind_garden_plants_v1';

export const fetchGardenPlants = async (userId: string | null): Promise<GardenPlant[]> => {
  if (!isSupabaseConfigured() || !userId) {
    const saved = localStorage.getItem(STORAGE_KEY_GARDEN_PLANTS);
    return saved ? JSON.parse(saved) : [];
  }
  try {
    const { data, error } = await supabase
      .from('garden_plants')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const plants = (data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      variety: d.variety ?? undefined,
      category: d.category,
      status: d.status,
      quantity: d.quantity ?? undefined,
      sowDate: d.sow_date ?? undefined,
      plantOutDate: d.plant_out_date ?? undefined,
      harvestDate: d.harvest_date ?? undefined,
      notes: d.notes ?? undefined,
      createdAt: d.created_at,
    }));
    localStorage.setItem(STORAGE_KEY_GARDEN_PLANTS, JSON.stringify(plants));
    return plants;
  } catch (error) {
    console.error('Error fetching garden plants:', error);
    const saved = localStorage.getItem(STORAGE_KEY_GARDEN_PLANTS);
    return saved ? JSON.parse(saved) : [];
  }
};

export const saveGardenPlant = async (userId: string | null, plant: GardenPlant): Promise<void> => {
  const local: GardenPlant[] = JSON.parse(localStorage.getItem(STORAGE_KEY_GARDEN_PLANTS) || '[]');
  const exists = local.find(p => p.id === plant.id);
  localStorage.setItem(STORAGE_KEY_GARDEN_PLANTS, JSON.stringify(
    exists ? local.map(p => p.id === plant.id ? plant : p) : [plant, ...local]
  ));
  if (!isSupabaseConfigured() || !userId) return;
  try {
    const { error } = await supabase.from('garden_plants').upsert({
      id: plant.id,
      user_id: userId,
      name: plant.name,
      variety: plant.variety ?? null,
      category: plant.category,
      status: plant.status,
      quantity: plant.quantity ?? null,
      sow_date: plant.sowDate ?? null,
      plant_out_date: plant.plantOutDate ?? null,
      harvest_date: plant.harvestDate ?? null,
      notes: plant.notes ?? null,
      created_at: plant.createdAt,
    }, { onConflict: 'id' });
    if (error) throw error;
  } catch (error) {
    console.error('Error saving garden plant:', error);
  }
};

export const deleteGardenPlant = async (userId: string | null, plantId: string): Promise<void> => {
  const local: GardenPlant[] = JSON.parse(localStorage.getItem(STORAGE_KEY_GARDEN_PLANTS) || '[]');
  localStorage.setItem(STORAGE_KEY_GARDEN_PLANTS, JSON.stringify(local.filter(p => p.id !== plantId)));
  if (!isSupabaseConfigured() || !userId) return;
  try {
    const { error } = await supabase.from('garden_plants').delete().eq('id', plantId).eq('user_id', userId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting garden plant:', error);
  }
};

// ============================================================================
// GARDEN TASKS
// ============================================================================

const STORAGE_KEY_GARDEN_TASKS = 'zenremind_garden_tasks_v1';

export const fetchGardenTasks = async (userId: string | null): Promise<GardenTask[]> => {
  if (!isSupabaseConfigured() || !userId) {
    const saved = localStorage.getItem(STORAGE_KEY_GARDEN_TASKS);
    return saved ? JSON.parse(saved) : [];
  }
  try {
    const { data, error } = await supabase
      .from('garden_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true, nullsFirst: false });
    if (error) throw error;
    const tasks = (data || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      description: d.description ?? undefined,
      dueDate: d.due_date ?? undefined,
      completed: d.completed,
      recurrence: d.recurrence ?? undefined,
      createdAt: d.created_at,
    }));
    localStorage.setItem(STORAGE_KEY_GARDEN_TASKS, JSON.stringify(tasks));
    return tasks;
  } catch (error) {
    console.error('Error fetching garden tasks:', error);
    const saved = localStorage.getItem(STORAGE_KEY_GARDEN_TASKS);
    return saved ? JSON.parse(saved) : [];
  }
};

export const saveGardenTask = async (userId: string | null, task: GardenTask): Promise<void> => {
  const local: GardenTask[] = JSON.parse(localStorage.getItem(STORAGE_KEY_GARDEN_TASKS) || '[]');
  const exists = local.find(t => t.id === task.id);
  localStorage.setItem(STORAGE_KEY_GARDEN_TASKS, JSON.stringify(
    exists ? local.map(t => t.id === task.id ? task : t) : [task, ...local]
  ));
  if (!isSupabaseConfigured() || !userId) return;
  try {
    const { error } = await supabase.from('garden_tasks').upsert({
      id: task.id,
      user_id: userId,
      title: task.title,
      description: task.description ?? null,
      due_date: task.dueDate ?? null,
      completed: task.completed,
      recurrence: task.recurrence ?? null,
      created_at: task.createdAt,
    }, { onConflict: 'id' });
    if (error) throw error;
  } catch (error) {
    console.error('Error saving garden task:', error);
  }
};

export const deleteGardenTask = async (userId: string | null, taskId: string): Promise<void> => {
  const local: GardenTask[] = JSON.parse(localStorage.getItem(STORAGE_KEY_GARDEN_TASKS) || '[]');
  localStorage.setItem(STORAGE_KEY_GARDEN_TASKS, JSON.stringify(local.filter(t => t.id !== taskId)));
  if (!isSupabaseConfigured() || !userId) return;
  try {
    const { error } = await supabase.from('garden_tasks').delete().eq('id', taskId).eq('user_id', userId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting garden task:', error);
  }
};

// ============================================================================
// HOLIDAY CHECKLIST
// ============================================================================

export const fetchHolidayItems = async (userId: string | null): Promise<HolidayChecklistItem[]> => {
  if (!isSupabaseConfigured() || !userId) {
    const saved = localStorage.getItem(STORAGE_KEY_HOLIDAY);
    return saved ? JSON.parse(saved) : [];
  }
  try {
    const { data, error } = await supabase
      .from('holiday_checklist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const items = (data || []).map((d: any) => ({
      id: d.id,
      holiday: d.holiday,
      task: d.task,
      category: d.category,
      completed: d.completed,
      dueDate: d.due_date ?? undefined,
      notes: d.notes ?? undefined,
      createdAt: d.created_at,
    }));
    localStorage.setItem(STORAGE_KEY_HOLIDAY, JSON.stringify(items));
    return items;
  } catch (error) {
    console.error('Error fetching holiday items:', error);
    const saved = localStorage.getItem(STORAGE_KEY_HOLIDAY);
    return saved ? JSON.parse(saved) : [];
  }
};

export const saveHolidayItem = async (userId: string | null, item: HolidayChecklistItem): Promise<void> => {
  const local: HolidayChecklistItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY_HOLIDAY) || '[]');
  const exists = local.find(i => i.id === item.id);
  localStorage.setItem(STORAGE_KEY_HOLIDAY, JSON.stringify(
    exists ? local.map(i => i.id === item.id ? item : i) : [item, ...local]
  ));
  if (!isSupabaseConfigured() || !userId) return;
  try {
    const { error } = await supabase.from('holiday_checklist').upsert({
      id: item.id,
      user_id: userId,
      holiday: item.holiday,
      task: item.task,
      category: item.category,
      completed: item.completed,
      due_date: item.dueDate ?? null,
      notes: item.notes ?? null,
      created_at: item.createdAt,
    }, { onConflict: 'id' });
    if (error) throw error;
  } catch (error) {
    console.error('Error saving holiday item:', error);
  }
};

export const deleteHolidayItem = async (userId: string | null, itemId: string): Promise<void> => {
  const local: HolidayChecklistItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY_HOLIDAY) || '[]');
  localStorage.setItem(STORAGE_KEY_HOLIDAY, JSON.stringify(local.filter(i => i.id !== itemId)));
  if (!isSupabaseConfigured() || !userId) return;
  try {
    const { error } = await supabase.from('holiday_checklist').delete().eq('id', itemId).eq('user_id', userId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting holiday item:', error);
  }
};

// ============================================================================
// IMMEDIATE BUY LIST
// ============================================================================

export const fetchImmediateBuyItems = async (userId: string | null): Promise<ImmediateBuyItem[]> => {
  if (!isSupabaseConfigured() || !userId) {
    const saved = localStorage.getItem(STORAGE_KEY_IMMEDIATE_BUY);
    return saved ? JSON.parse(saved) : [];
  }
  try {
    const { data, error } = await supabase
      .from('immediate_buy_list')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const items = (data || []).map((d: any) => ({
      id: d.id,
      item: d.item,
      quantity: d.quantity ?? undefined,
      store: d.store ?? undefined,
      priority: d.priority,
      completed: d.completed,
      cost: d.cost ?? undefined,
      createdAt: d.created_at,
    }));
    localStorage.setItem(STORAGE_KEY_IMMEDIATE_BUY, JSON.stringify(items));
    return items;
  } catch (error) {
    console.error('Error fetching immediate buy items:', error);
    const saved = localStorage.getItem(STORAGE_KEY_IMMEDIATE_BUY);
    return saved ? JSON.parse(saved) : [];
  }
};

export const saveImmediateBuyItem = async (userId: string | null, item: ImmediateBuyItem): Promise<void> => {
  const local: ImmediateBuyItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY_IMMEDIATE_BUY) || '[]');
  const exists = local.find(i => i.id === item.id);
  localStorage.setItem(STORAGE_KEY_IMMEDIATE_BUY, JSON.stringify(
    exists ? local.map(i => i.id === item.id ? item : i) : [item, ...local]
  ));
  if (!isSupabaseConfigured() || !userId) return;
  try {
    const { error } = await supabase.from('immediate_buy_list').upsert({
      id: item.id,
      user_id: userId,
      item: item.item,
      quantity: item.quantity ?? null,
      store: item.store ?? null,
      priority: item.priority,
      completed: item.completed,
      cost: item.cost ?? null,
      created_at: item.createdAt,
    }, { onConflict: 'id' });
    if (error) throw error;
  } catch (error) {
    console.error('Error saving immediate buy item:', error);
  }
};

export const deleteImmediateBuyItem = async (userId: string | null, itemId: string): Promise<void> => {
  const local: ImmediateBuyItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY_IMMEDIATE_BUY) || '[]');
  localStorage.setItem(STORAGE_KEY_IMMEDIATE_BUY, JSON.stringify(local.filter(i => i.id !== itemId)));
  if (!isSupabaseConfigured() || !userId) return;
  try {
    const { error } = await supabase.from('immediate_buy_list').delete().eq('id', itemId).eq('user_id', userId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting immediate buy item:', error);
  }
};
