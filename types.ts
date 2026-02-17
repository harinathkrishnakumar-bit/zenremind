
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
  PURCHASES = 'PURCHASES'
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

export interface SmartReminderResponse {
  title: string;
  description: string;
  dueDate?: string;
  priority: Priority;
  category: string;
  cost?: number;
}
