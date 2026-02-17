
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

  return (
    <div className="flex flex-col gap-3 px-5 pb-32">
      <h3 className="text-xl font-bold mb-1">Recent Activity</h3>
      {sortedTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300">
          <p className="text-gray-400">No transactions yet.</p>
        </div>
      ) : (
        sortedTransactions.map((t) => {
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
                    {format(new Date(t.date), 'MMM d, h:mm a')} • {t.category}
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
        })
      )}
    </div>
  );
};

export default TransactionList;
