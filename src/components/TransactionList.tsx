import React from 'react';
import { Transaction } from '../types';
import { CATEGORY_CONFIG } from '../constants';
import { format } from 'date-fns';
import { Trash2, RefreshCw, Pencil } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onEdit }) => {
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const groupedTransactions = sortedTransactions.reduce((acc, t) => {
    const month = format(new Date(t.date), 'MMMM yyyy');
    if (!acc[month]) acc[month] = [];
    acc[month].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const months = Object.keys(groupedTransactions);

  return (
    <div className="flex flex-col gap-3 px-5 pb-32">
      <h3 className="text-xl font-bold mb-1">Recent Activity</h3>
      {sortedTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300">
          <p className="text-gray-400">No transactions yet.</p>
        </div>
      ) : (
        months.map((month) => (
          <div key={month} className="flex flex-col gap-3 mt-8 first:mt-0">
            <div className="flex items-center gap-2 px-1 mb-1">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{month}</h4>
              <div className="flex-1 h-[1px] bg-gray-200/50" />
            </div>
            {groupedTransactions[month].map((t) => {
              const config = CATEGORY_CONFIG[t.category];
              return (
                <div 
                  key={t.id} 
                  className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm group hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div 
                      className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: config.color }}
                    >
                      {config.icon}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <h4 className="font-bold text-gray-900 leading-tight truncate">{t.description}</h4>
                        {t.subscriptionId && <RefreshCw size={10} className="text-blue-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-blue-500 font-bold mt-0.5 truncate uppercase tracking-tighter">
                        {t.vendor}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {format(new Date(t.date), 'MMMM d, yyyy')} • {t.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-gray-900 mr-2">-${t.amount.toFixed(2)}</span>
                    <div className="flex items-center">
                      <button 
                        onClick={() => onEdit(t)}
                        aria-label="Edit transaction"
                        className="p-2 text-gray-300 hover:text-blue-500 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => onDelete(t.id)}
                        aria-label="Delete transaction"
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
};

export default TransactionList;