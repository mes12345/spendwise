import React from 'react';
import { 
  ShoppingBag, 
  Dumbbell, 
  Utensils, 
  ShoppingCart, 
  Car, 
  Plane, 
  HeartPulse, 
  Ticket, 
  Zap, 
  MoreHorizontal,
  Baby,
  GraduationCap
} from 'lucide-react';
import { Category, Transaction } from './types';

export const CATEGORY_CONFIG: Record<Category, { icon: React.ReactNode; color: string }> = {
  [Category.Shopping]: { icon: <ShoppingBag size={18} />, color: '#FF2D55' },
  [Category.Fitness]: { icon: <Dumbbell size={18} />, color: '#5856D6' },
  [Category.Dining]: { icon: <Utensils size={18} />, color: '#FF9500' },
  [Category.Groceries]: { icon: <ShoppingCart size={18} />, color: '#4CD964' },
  [Category.Automotive]: { icon: <Car size={18} />, color: '#8E8E93' },
  [Category.Travel]: { icon: <Plane size={18} />, color: '#5AC8FA' },
  [Category.Health]: { icon: <HeartPulse size={18} />, color: '#FF3B30' },
  [Category.Entertainment]: { icon: <Ticket size={18} />, color: '#AF52DE' },
  [Category.Utilities]: { icon: <Zap size={18} />, color: '#FFCC00' },
  [Category.BabyItems]: { icon: <Baby size={18} />, color: '#1AC2E6' },
  [Category.Education]: { icon: <GraduationCap size={18} />, color: '#007AFF' },
  [Category.Other]: { icon: <MoreHorizontal size={18} />, color: '#C7C7CC' },
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Dark Wash Denim', vendor: 'Abercrombie', amount: 50.99, category: Category.Shopping, date: new Date().toISOString() },
  { id: '2', description: 'Weekly Groceries', vendor: 'Whole Foods', amount: 84.20, category: Category.Groceries, date: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', description: 'Monthly Gym Fee', vendor: 'Equinox', amount: 220.00, category: Category.Fitness, date: new Date(Date.now() - 172800000).toISOString() },
];