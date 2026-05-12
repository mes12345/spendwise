
import React from 'react';
import { Transaction } from '../types';
import { CATEGORY_CONFIG, getCategoryConfig } from '../constants';
import { format, isToday, isYesterday } from 'date-fns';
import { Trash2, RefreshCw, Pencil, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';

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
    const date = new Date(t.date);
    let dayLabel: string;
    
    if (isToday(date)) dayLabel = 'Today';
    else if (isYesterday(date)) dayLabel = 'Yesterday';
    else dayLabel = format(date, 'EEEE, MMM d');

    if (!acc[dayLabel]) acc[dayLabel] = [];
    acc[dayLabel].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const dayLabels = Object.keys(groupedTransactions);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
          <MoreVertical className="text-slate-200 rotate-90" size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No activity yet</h3>
        <p className="text-sm text-slate-400 mt-2">Any spending you record will appear here in chronological order.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 px-6 pt-4 pb-32">
      {dayLabels.map((dayLabel, dayIdx) => (
        <section key={dayLabel} className="space-y-3">
          <h4 className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{dayLabel}</h4>
          <div className="space-y-0.5 rounded-[24px] overflow-hidden border border-slate-100 bg-slate-50/50">
            {groupedTransactions[dayLabel].map((t, tIdx) => {
              const config = getCategoryConfig(t.category);
              return (
                <motion.div 
                  key={t.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (dayIdx * 0.1) + (tIdx * 0.05) }}
                  className="bg-white p-4 flex items-center justify-between group active:bg-slate-50 transition-colors cursor-pointer relative"
                  onClick={() => onEdit(t)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div 
                      className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-lg"
                      style={{ backgroundColor: config.color }}
                    >
                      {config.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 leading-tight truncate text-sm">{t.vendor}</h4>
                        {t.subscriptionId && (
                          <div className="bg-indigo-50 p-0.5 rounded-full">
                            <RefreshCw size={8} className="text-indigo-500 animate-spin-slow" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate uppercase tracking-widest">
                        {t.description || t.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-black text-slate-900 text-sm">-${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{format(new Date(t.date), 'h:mm a')}</div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(t.id);
                      }}
                      className="p-2 text-slate-200 hover:text-rose-500 transition-colors active:scale-110"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      ))}
      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TransactionList;
