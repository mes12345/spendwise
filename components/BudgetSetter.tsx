
import React, { useState } from 'react';
import { Target, Check } from 'lucide-react';

interface BudgetSetterProps {
  currentBudget: number;
  onUpdate: (val: number) => void;
  onClose: () => void;
}

const BudgetSetter: React.FC<BudgetSetterProps> = ({ currentBudget, onUpdate, onClose }) => {
  const [val, setVal] = useState(currentBudget.toString());

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 ios-blur flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <Target size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Monthly Budget</h2>
        </div>
        
        <p className="text-gray-500 mb-6 font-medium">Set a target limit for your monthly spending. We'll help you stay on track.</p>
        
        <div className="relative mb-8">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-300">$</span>
          <input 
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full bg-gray-50 rounded-2xl py-6 pl-14 pr-6 text-4xl font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => onUpdate(parseFloat(val) || 0)}
            className="w-full bg-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Check size={20} />
            Save Budget
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetSetter;
