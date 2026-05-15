
import { useMemo } from 'react';
import { Transaction, Category } from '../types';
import { format } from 'date-fns';

interface FilterOptions {
  startDate: string;
  endDate: string;
  search: string;
  category: Category | 'All';
  sortField: 'date' | 'amount';
  sortDirection: 'asc' | 'desc';
}

export function useFilteredTransactions(transactions: Transaction[], options: FilterOptions) {
  const filtered = useMemo(() => {
    let result = transactions.filter(t => {
      const transDateStr = format(new Date(t.date), 'yyyy-MM-dd');
      
      if (options.startDate && transDateStr < options.startDate) return false;
      if (options.endDate && transDateStr > options.endDate) return false;

      if (options.search) {
        const search = options.search.toLowerCase();
        const matchesDescription = t.description.toLowerCase().includes(search);
        const matchesVendor = t.vendor.toLowerCase().includes(search);
        if (!matchesDescription && !matchesVendor) return false;
      }

      if (options.category !== 'All' && t.category !== options.category) {
        return false;
      }
      
      return true;
    });

    result = [...result].sort((a, b) => {
      if (options.sortField === 'date') {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return options.sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
      } else {
        return options.sortDirection === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
    });

    return result.slice(0, 100);
  }, [transactions, options]);

  return filtered;
}
