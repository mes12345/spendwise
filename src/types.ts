export enum Category {
  Shopping = 'Shopping',
  Fitness = 'Fitness',
  Dining = 'Dining',
  Groceries = 'Groceries',
  Automotive = 'Automotive',
  Travel = 'Travel',
  Health = 'Health',
  Entertainment = 'Entertainment',
  Utilities = 'Utilities',
  BabyItems = 'Baby Items',
  Education = 'Education',
  Household = 'Household',
  Other = 'Other'
}

export type Timeframe = 'All' | '30 Days' | 'Month' | '6 Months' | '12 Months' | 'YTD';

export interface Transaction {
  id: string;
  description: string;
  vendor: string;
  amount: number;
  category: Category;
  date: string; // ISO string
  subscriptionId?: string; // Links to a subscription if recurring
  userId: string;
  householdId: string;
}

export enum RecurrenceType {
  MonthDay = 'month-day',
  Weekday = 'weekday'
}

export interface Subscription {
  id: string;
  description: string;
  vendor: string;
  amount: number;
  category: Category;
  active: boolean;
  frequency: number; // Every X months
  recurrenceType: RecurrenceType;
  dayOfMonth?: number; // Used for MonthDay
  weekdayConfig?: { // Used for Weekday
    weekIndex: number; // 1, 2, 3, 4, or -1 for last
    dayOfWeek: number; // 0-6 (Sun-Sat)
  };
  userId: string;
  householdId: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  monthlyLimit: number;
  householdId: string;
  createdAt: string;
}

export interface Household {
  id: string;
  name: string;
  memberUids: string[];
  ownerUid: string;
  createdAt: string;
}

export interface Budget {
  monthlyLimit: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}