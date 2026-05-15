
import React from 'react';
import { Search, X, Filter, ArrowUpDown } from 'lucide-react';
import { Category } from '../types';

interface ActivityFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: Category | 'All';
  onCategoryChange: (val: Category | 'All') => void;
  sortField: 'date' | 'amount';
  onSortFieldChange: (val: 'date' | 'amount') => void;
  sortDirection: 'asc' | 'desc';
  onSortDirectionChange: (val: 'asc' | 'desc') => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  onResetDates: () => void;
}

const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  search, onSearchChange,
  category, onCategoryChange,
  sortField, onSortFieldChange,
  sortDirection, onSortDirectionChange,
  startDate, onStartDateChange,
  endDate, onEndDateChange,
  onResetDates
}) => {
  return (
    <div className="bg-white sticky top-0 z-20 border-b border-slate-50">
      <div className="px-6 py-4 space-y-3">
        {/* Search Bar */}
        <div className="relative group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by vendor or description..."
            className="w-full bg-slate-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 focus:outline-none transition-all"
          />
          {search && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <div className="flex-1 relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select 
              value={category}
              onChange={(e) => onCategoryChange(e.target.value as any)}
              className="w-full bg-slate-50 border border-transparent rounded-xl py-2.5 pl-9 pr-4 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-100 appearance-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {Object.values(Category).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (sortField === 'date') {
                  onSortDirectionChange(sortDirection === 'desc' ? 'asc' : 'desc');
                } else {
                  onSortFieldChange('date');
                  onSortDirectionChange('desc');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                sortField === 'date' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              <ArrowUpDown size={12} className={sortField === 'date' ? 'opacity-100' : 'opacity-40'} />
              <span>Date {sortField === 'date' && (sortDirection === 'desc' ? '↓' : '↑')}</span>
            </button>

            <button 
              onClick={() => {
                if (sortField === 'amount') {
                  onSortDirectionChange(sortDirection === 'desc' ? 'asc' : 'desc');
                } else {
                  onSortFieldChange('amount');
                  onSortDirectionChange('desc');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                sortField === 'amount' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              <ArrowUpDown size={12} className={sortField === 'amount' ? 'opacity-100' : 'opacity-40'} />
              <span>Price {sortField === 'amount' && (sortDirection === 'desc' ? '↓' : '↑')}</span>
            </button>
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="flex bg-slate-50 p-2 rounded-2xl gap-2 items-center">
          <div className="flex-1 text-center">
            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">From</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full bg-white rounded-xl py-2 px-3 text-[10px] font-bold text-slate-600 focus:outline-none border border-slate-100 shadow-sm"
            />
          </div>
          <div className="flex-1 text-center">
            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">To</label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full bg-white rounded-xl py-2 px-3 text-[10px] font-bold text-slate-600 focus:outline-none border border-slate-100 shadow-sm"
            />
          </div>
          <div className="self-end pb-0.5">
            {(startDate || endDate) && (
              <button 
                onClick={onResetDates}
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Reset Date Range"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityFilters;
