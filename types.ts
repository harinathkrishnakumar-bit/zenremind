
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  TODO = 'TODO',
  SHOPPING = 'SHOPPING',
  OUTSTANDING = 'OUTSTANDING',
  HABITS = 'HABITS',
  WORKS = 'WORKS',
  RENEWALS = 'RENEWALS',
  VAULT = 'VAULT',
  PURCHASES = 'PURCHASES',
  HOMEWORK = 'HOMEWORK',
  GARDEN = 'GARDEN',
  HOLIDAY_CHECKLIST = 'HOLIDAY_CHECKLIST',
  IMMEDIATE_BUY = 'IMMEDIATE_BUY'
}

export enum RecurrenceType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM'
}

export interface RecurrenceConfig {
  type: RecurrenceType;
  daysOfWeek?: number[];
  endDate?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  category: string;
  completed: boolean;
  completedInstances?: string[]; 
  createdAt: string;
  cost?: number;
  recurrence?: RecurrenceConfig;
  policyNumber?: string; // Additional field for policy details
  provider?: string;    // Additional field for policy details
}

export interface Habit {
  id: string;
  title: string;
  completedDates: string[]; 
  createdAt: string;
}

export interface VaultItem {
  id: string;
  label: string;
  value: string;
  category: string;
  createdAt: string;
}

export type GroceryCategory = 'Food' | 'Household' | 'Toys' | 'Personal Care' | 'Electronics' | 'Other';
export type FoodType = 'Fresh' | 'Processed' | 'Ultraprocessed';

export interface GroceryItem {
  id: string;
  name: string;
  category: GroceryCategory;
  foodType?: FoodType;
  price?: number;
  quantity: number;
  store?: string;
  purchasedAt: string;
  createdAt: string;
}

export type HomeworkSubject = 'Math' | 'English' | 'Science' | 'History' | 'Geography' | 'Art' | 'PE' | 'French' | 'ICT' | 'Other';

export interface HomeworkItem {
  id: string;
  title: string;
  subject: HomeworkSubject;
  dueDate: string; // YYYY-MM-DD
  notes?: string;
  completed: boolean;
  createdAt: string;
}

export interface CurriculumTopic {
  id: string;
  subject: HomeworkSubject;
  title: string;
  completed: boolean;
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface SmartReminderResponse {
  title: string;
  description: string;
  dueDate?: string;
  priority: Priority;
  category: string;
  cost?: number;
}

export type GardenStatus = 'ToBuy' | 'Sowing' | 'PlantOut' | 'Growing' | 'Harvesting' | 'Complete';
export type PlantCategory = 'Vegetable' | 'Herb' | 'Flower' | 'Fruit' | 'Tree' | 'Shrub' | 'Other';

export interface GardenPlant {
  id: string;
  name: string;
  variety?: string;
  category: PlantCategory;
  status: GardenStatus;
  quantity?: number;
  sowDate?: string; // YYYY-MM-DD
  plantOutDate?: string; // YYYY-MM-DD
  harvestDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface GardenTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  completed: boolean;
  recurrence?: RecurrenceConfig;
  createdAt: string;
}

export type HolidayCategory = 'Shopping' | 'Planning' | 'Cooking' | 'Decorating' | 'Travel' | 'Gifts' | 'Other';

export interface HolidayChecklistItem {
  id: string;
  holiday: string; // e.g., "Christmas 2026"
  task: string;
  category: HolidayCategory;
  completed: boolean;
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface ImmediateBuyItem {
  id: string;
  item: string;
  quantity?: number;
  store?: string;
  priority: Priority;
  completed: boolean;
  cost?: number;
  createdAt: string;
}
