
import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Area, CartesianGrid, Line, ComposedChart 
} from 'recharts';
import { Transaction, Timeframe, Category } from '../types';
import { CATEGORY_CONFIG } from '../constants';
import { 
  format, isWithinInterval, startOfMonth, endOfMonth, 
  subMonths, startOfYear, eachDayOfInterval, isSameDay,
  parseISO, eachMonthOfInterval, min, max, isSameMonth
} from 'date-fns';
import { ChevronDown, Calendar } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  budget: number;
  timeframe: Timeframe;
  onTimeframeChange: (t: Timeframe) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, budget, timeframe, onTimeframeChange }) => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));

  // Get range of months available in transactions for the dropdown
  const availableMonths = useMemo(() => {
    const now = new Date();
    if (transactions.length === 0) return [startOfMonth(now)];

    const transactionDates = transactions.map(t => new Date(t.date));
    const firstDate = min(transactionDates);
    const lastDate = max([now, max(transactionDates)]);

    // Generate list of months from first transaction to now
    const months = eachMonthOfInterval({
      start: startOfMonth(firstDate),
      end: startOfMonth(lastDate)
    }).reverse(); // Most recent first

    return months;
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
    return transactions.filter(t => 
      isWithinInterval(new Date(t.date), dateRange)
    );
  }, [transactions, dateRange]);

  const currentMonthSpent = useMemo(() => {
    // This is the spending for the specific range being viewed
    return filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredTransactions]);

  // Generate Time Series Data
  const timeSeriesData = useMemo(() => {
    const days = eachDayOfInterval(dateRange);
    const totalDays = days.length;
    
    let budgetMultiplier = 1;
    if (timeframe === '6 Months') budgetMultiplier = 6;
    if (timeframe === '12 Months') budgetMultiplier = 12;
    if (timeframe === 'YTD') budgetMultiplier = (new Date().getMonth() + 1);

    const totalTargetBudget = budget * budgetMultiplier;
    const idealDailyStep = totalTargetBudget / (totalDays - 1 || 1);

    let cumulativeActual = 0;
    const result = [];
    
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const dailySum = filteredTransactions
        .filter(t => isSameDay(new Date(t.date), day))
        .reduce((acc, t) => acc + t.amount, 0);
      
      cumulativeActual += dailySum;
      result.push({
        date: format(day, totalDays > 31 ? 'MMM d' : 'd'),
        actual: cumulativeActual,
        ideal: idealDailyStep * i,
      });
    }
    return result;
  }, [dateRange, filteredTransactions, budget, timeframe]);

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });

    return Object.entries(totals).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_CONFIG[name as Category]?.color || '#8E8E93'
    })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const onTrackPercent = Math.min(Math.round((currentMonthSpent / budget) * 100), 100);
  const isOverBudget = currentMonthSpent > budget;

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = new Date(e.target.value);
    setSelectedMonth(date);
    onTimeframeChange('Month');
  };

  return (
    <div className="flex flex-col gap-6 px-5 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Timeframe Selector & Month Picker */}
      <div className="flex flex-col gap-3 mt-4">
        <div className="flex bg-gray-200/50 p-1 rounded-xl" role="group" aria-label="Timeframe selection">
          {(['Month', '6 Months', '12 Months', 'YTD'] as Timeframe[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                if (t === 'Month') setSelectedMonth(startOfMonth(new Date()));
                onTimeframeChange(t);
              }}
              aria-pressed={timeframe === t}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                timeframe === t ? 'bg-white shadow-sm text-black' : 'text-gray-500'
              }`}
            >
              {t === 'Month' ? 'Current' : t}
            </button>
          ))}
        </div>

        <div className="relative">
          <select
            value={selectedMonth.toISOString()}
            onChange={handleMonthSelect}
            className="w-full bg-white border border-gray-100 py-3 px-4 pr-10 rounded-2xl text-sm font-bold text-gray-700 shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
          >
            {availableMonths.map((m) => (
              <option key={m.toISOString()} value={m.toISOString()}>
                {format(m, 'MMMM yyyy')} {isSameMonth(m, new Date()) ? '(Current)' : ''}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown size={18} />
          </div>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500/30">
            <Calendar size={14} />
          </div>
          <style>{`select { padding-left: 2.5rem; }`}</style>
        </div>
      </div>

      {/* Monthly Summary Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">
          {timeframe === 'Month' ? format(selectedMonth, 'MMMM yyyy') : timeframe} Spending
        </p>
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-4xl font-bold text-black">${currentMonthSpent.toFixed(2)}</h2>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isOverBudget ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            Goal: ${budget}
          </span>
        </div>
        
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-2">
          <div 
            className={`h-full transition-all duration-1000 ease-out rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${onTrackPercent}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">
          {isOverBudget 
            ? `You're $${(currentMonthSpent - budget).toFixed(2)} over limit.` 
            : `You've used ${onTrackPercent}% of your target.`}
        </p>
      </div>

      {/* Spending Trend (Composed Chart) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Spending Trend</h3>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1">
               <div className="w-2 h-2 rounded-full bg-blue-500" />
               <span className="text-[10px] font-bold text-gray-400">ACTUAL</span>
             </div>
             <div className="flex items-center gap-1">
               <div className="w-2 h-0.5 bg-gray-300" />
               <span className="text-[10px] font-bold text-gray-400">TARGET</span>
             </div>
          </div>
        </div>
        <div className="h-[200px] w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeSeriesData}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F3F4F6" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                minTickGap={20}
              />
              <YAxis hide domain={[0, 'auto']} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`]}
              />
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorActual)" 
                animationDuration={2000}
                isAnimationActive={true}
              />
              <Line 
                type="monotone" 
                dataKey="ideal" 
                stroke="#D1D5DB" 
                strokeWidth={1.5} 
                strokeDasharray="5 5" 
                dot={false}
                animationDuration={2000}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4">Category Breakdown</h3>
        <div className="h-[240px] w-full flex items-center justify-center">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-400 text-sm italic">No data for this selection</div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {categoryData.slice(0, 6).map((data) => (
            <div key={`legend-${data.name}`} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-800">{data.name}</span>
                <span className="text-[10px] text-gray-400">${data.value.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
