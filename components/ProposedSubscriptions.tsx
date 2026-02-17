import React from 'react';
import { Subscription } from '../types.ts';
import { CATEGORY_CONFIG } from '../constants.tsx';
import { RefreshCw, Check, X, Trash2 } from 'lucide-react';

interface ProposedSubscriptionsProps {
  proposals: Subscription[];
  onAccept: (sub: Subscription) => void;
  onDismiss: (sub: Subscription) => void;
  onDelete: (id: string) => void;
}

const ProposedSubscriptions: React.FC<ProposedSubscriptionsProps> = ({ proposals, onAccept, onDismiss, onDelete }) => {
  if (proposals.length === 0) return null;

  return (
    <div className="px-5 mt-4 animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw size={16} className="text-blue-500" />
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Recurring Payments</h3>
      </div>
      
      <div className="flex flex-col gap-3">
        {proposals.map((sub) => {
          const config = CATEGORY_CONFIG[sub.category];
          return (
            <div 
              key={sub.id} 
              className="bg-blue-50/80 border border-blue-100 p-4 rounded-3xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div 
                  className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: config.color }}
                >
                  {config.icon}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-gray-900 leading-tight truncate">{sub.vendor}</h4>
                  <p className="text-xs text-blue-600 font-medium mt-0.5 truncate uppercase">
                    ${sub.amount.toFixed(2)} • Monthly
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onAccept(sub)}
                  className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm active:scale-90 transition-all"
                  title="Accept for this month"
                >
                  <Check size={18} />
                </button>
                <button 
                  onClick={() => onDelete(sub.id)}
                  className="w-8 h-8 rounded-full bg-white text-red-500 flex items-center justify-center border border-red-100 shadow-sm active:scale-90 transition-all"
                  title="Subscription no longer exists"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProposedSubscriptions;