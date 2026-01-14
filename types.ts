
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
  WORKS = 'WORKS'
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
  completedInstances?: string[]; // Stores IDs of specific completed occurrences (e.g. "baseId::timestamp")
  createdAt: string;
  cost?: number;
  recurrence?: RecurrenceConfig;
}

export interface Habit {
  id: string;
  title: string;
  completedDates: string[]; 
  createdAt: string;
}

export interface VaultField {
  id: string;
  label: string;
  value: string;
}

export interface SmartReminderResponse {
  title: string;
  description: string;
  dueDate?: string;
  priority: Priority;
  category: string;
  cost?: number;
}
