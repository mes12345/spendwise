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
  Other = 'Other'
}

export type Timeframe = 'Month' | '6 Months' | '12 Months' | 'YTD';

export interface Transaction {
  id: string;
  description: string;
  vendor: string;
  amount: number;
  category: Category;
  date: string; // ISO string
  subscriptionId?: string; // Links to a subscription if recurring
}

export interface Subscription {
  id: string;
  description: string;
  vendor: string;
  amount: number;
  category: Category;
  dayOfMonth: number;
  active: boolean;
}

export interface Budget {
  monthlyLimit: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}