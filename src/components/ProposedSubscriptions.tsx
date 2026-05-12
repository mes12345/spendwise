
import React from 'react';
import { Subscription } from '../types';
import { CATEGORY_CONFIG } from '../constants';
import { RefreshCw, Check, X, Trash2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProposedSubscriptionsProps {
  proposals: Subscription[];
  onAccept: (sub: Subscription) => void;
  onDismiss: (sub: Subscription) => void;
  onDelete: (id: string) => void;
}

const ProposedSubscriptions: React.FC<ProposedSubscriptionsProps> = ({ proposals, onAccept, onDismiss, onDelete }) => {
  if (proposals.length === 0) return null;

  return (
    <div className="px-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1 px-2 bg-indigo-50 rounded-full flex items-center gap-1.5 border border-indigo-100">
           <Zap size={10} className="text-indigo-600 fill-indigo-600" />
           <h3 className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">Recurring Bills Due</h3>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {proposals.map((sub, idx) => {
            const config = CATEGORY_CONFIG[sub.category];
            return (
              <motion.div 
                key={sub.id} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-indigo-100 p-4 rounded-[24px] flex items-center justify-between shadow-sm shadow-indigo-50/50"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div 
                    className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: config.color }}
                  >
                    {config.icon}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-slate-900 leading-tight truncate text-sm">{sub.vendor}</h4>
                    <p className="text-[10px] text-indigo-500 font-black mt-0.5 truncate uppercase tracking-widest">
                      ${sub.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} • Monthly
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onAccept(sub)}
                    className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 active:scale-90 transition-all font-bold"
                    aria-label="Approve billing"
                  >
                    <Check size={18} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => onDelete(sub.id)}
                    className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100 active:scale-90 transition-all"
                    aria-label="Remove subscription"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProposedSubscriptions;
