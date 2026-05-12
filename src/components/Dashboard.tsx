
import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Area, CartesianGrid, Line, ComposedChart 
} from 'recharts';
import { motion } from 'motion/react';
import { Transaction, Timeframe, Category } from '../types';
import { CATEGORY_CONFIG, getCategoryConfig } from '../constants';
import { 
  format, isWithinInterval, startOfMonth, endOfMonth, 
  subMonths, startOfYear, eachDayOfInterval, isSameDay,
  eachMonthOfInterval, min, max, isSameMonth,
  isAfter, startOfDay
} from 'date-fns';
import { ChevronDown, Calendar, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  budget: number;
  timeframe: Timeframe;
  onTimeframeChange: (t: Timeframe) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, budget, timeframe, onTimeframeChange }) => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));

  const availableMonths = useMemo(() => {
    const now = new Date();
    if (transactions.length === 0) return [startOfMonth(now)];
    const transactionDates = transactions.map(t => new Date(t.date));
    const firstDate = min(transactionDates);
    const lastDate = max([now, max(transactionDates)]);
    return eachMonthOfInterval({
      start: startOfMonth(firstDate),
      end: startOfMonth(lastDate)
    }).reverse();
  }, [transactions]);

  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (timeframe) {
      case 'Month':
        start = startOfMonth(selectedMonth);
        end = endOfMonth(selectedMonth);
        break;
      case '6 Months':
        start = startOfMonth(subMonths(now, 5));
        break;
      case '12 Months':
        start = startOfMonth(subMonths(now, 11));
        break;
      case 'YTD':
        start = startOfYear(now);
        break;
      default:
        start = startOfMonth(now);
    }
    return { start, end };
  }, [timeframe, selectedMonth]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => isWithinInterval(new Date(t.date), dateRange));
  }, [transactions, dateRange]);

  const currentSpending = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredTransactions]);

  const timeframeBudget = useMemo(() => {
    if (timeframe === 'Month') return budget;
    const now = new Date();
    if (timeframe === '6 Months') return budget * 6;
    if (timeframe === '12 Months') return budget * 12;
    if (timeframe === 'YTD') return budget * (now.getMonth() + 1);
    return budget;
  }, [timeframe, budget]);

  const timeSeriesData = useMemo(() => {
    const days = eachDayOfInterval(dateRange);
    const totalDays = days.length;
    let cumulative = 0;
    const result = [];
    const today = startOfDay(new Date());
    
    // Calculate a daily target budget for the pacing line
    const dailyTarget = timeframeBudget / totalDays;

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const isFuture = isAfter(startOfDay(day), today);
      const dailyTotal = filteredTransactions
        .filter(t => isSameDay(new Date(t.date), day))
        .reduce((acc, t) => acc + t.amount, 0);
      
      cumulative += dailyTotal;
      
      const dataPoint: any = {
        date: format(day, totalDays > 31 ? 'MMM d' : 'd'),
        fullDate: format(day, 'MMMM d'),
        target: dailyTarget * (i + 1),
      };

      if (!isFuture) {
        dataPoint.spent = cumulative;
      }
      result.push(dataPoint);
    }
    return result;
  }, [dateRange, filteredTransactions, timeframeBudget]);

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });

    return Object.entries(totals).map(([name, value]) => ({
      name,
      value,
      color: getCategoryConfig(name as Category).color
    })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const percentOfBudget = Math.min(Math.round((currentSpending / timeframeBudget) * 100), 100);
  const isOverBudget = currentSpending > timeframeBudget;

  return (
    <div className="flex flex-col gap-6 px-6 pb-24">
      
      {/* Header Cards */}
      <section className="grid grid-cols-1 gap-4 mt-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-indigo-600 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Total Spending</span>
              <CreditCard size={16} className="opacity-70" />
            </div>
            <div className="text-4xl font-bold tracking-tight mb-4">${currentSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider">
                <span className="opacity-70">Budget Utilization</span>
                <span>{percentOfBudget}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentOfBudget}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                />
              </div>
              <p className="text-[10px] opacity-60 font-medium italic">
                {isOverBudget ? `Exceeded by $${(currentSpending - timeframeBudget).toFixed(2)}` : `$${(timeframeBudget - currentSpending).toFixed(2)} remaining this period`}
              </p>
            </div>
          </div>
          {/* Abstract background shapes */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-500/30 rounded-full blur-3xl" />
        </motion.div>
      </section>

      {/* Selectors */}
      <section className="flex flex-col gap-3">
        <div className="flex bg-slate-100 p-1 rounded-2xl" role="group">
          {(['Month', '6 Months', '12 Months', 'YTD'] as Timeframe[]).map((t) => (
            <button
              key={t}
              onClick={() => onTimeframeChange(t)}
              className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all uppercase tracking-wider ${
                timeframe === t ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative">
          <select
            value={selectedMonth.toISOString()}
            onChange={(e) => {
              setSelectedMonth(new Date(e.target.value));
              onTimeframeChange('Month');
            }}
            className="w-full bg-white border border-slate-200 py-3.5 px-12 rounded-2xl text-sm font-semibold text-slate-700 shadow-sm appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
          >
            {availableMonths.map((m) => (
              <option key={m.toISOString()} value={m.toISOString()}>
                {format(m, 'MMMM yyyy')} {isSameMonth(m, new Date()) ? '(Current)' : ''}
              </option>
            ))}
          </select>
          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500/40" />
          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </section>

      {/* Main Insights Chart */}
      <section className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest leading-none">Spending Flow</h3>
          </div>
        </div>
        <div className="h-[220px] w-full -ml-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeSeriesData}>
              <defs>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="4 4" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }} 
                minTickGap={30}
              />
              <YAxis hide domain={[0, (dataMax: number) => Math.max(dataMax * 1.1, timeframeBudget)]} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-slate-800 space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.fullDate}</p>
                        {payload.map((entry: any) => (
                          <div key={entry.name} className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-bold uppercase text-slate-400">{entry.name}:</span>
                            <span className="text-xs font-black">${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                name="Spent"
                type="monotone" 
                dataKey="spent" 
                stroke="#4F46E5" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorSpent)" 
                animationDuration={1500}
                isAnimationActive={true}
              />
              <Line 
                name="Budget"
                type="monotone" 
                dataKey="target" 
                stroke="#94A3B8" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                dot={false}
                animationDuration={1500}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Category Grid */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categories</h3>
          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full lowercase italic">distribution</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {categoryData.slice(0, 4).map((cat, i) => (
            <motion.div 
              key={cat.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-indigo-100 transition-all cursor-default"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: cat.color }}
                >
                  {getCategoryConfig(cat.name as Category).icon}
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight truncate flex-1">{cat.name}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-lg font-black text-slate-900">${cat.value.toFixed(0)}</div>
                <div className="text-[9px] font-bold text-slate-400">{Math.round((cat.value / currentSpending) * 100)}%</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
};

// Dashboard component
export default Dashboard;
