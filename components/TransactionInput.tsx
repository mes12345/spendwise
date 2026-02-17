
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Tag, User, AlignLeft, RefreshCw, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { Transaction, Category } from '../types';
import { CATEGORY_CONFIG } from '../constants';
import { format, parse } from 'date-fns';
import { parseTransaction } from '../services/geminiService';

interface TransactionInputProps {
  onAddTransaction: (t: Omit<Transaction, 'id' | 'date'>, date: string, isRecurring: boolean) => void;
  initialData?: Transaction;
  onCancel?: () => void;
}

const TransactionInput: React.FC<TransactionInputProps> = ({ onAddTransaction, initialData, onCancel }) => {
  const [magicText, setMagicText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    vendor: '',
    amount: '',
    category: Category.Other,
    date: format(new Date(), 'yyyy-MM-dd'),
    isRecurring: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        description: initialData.description,
        vendor: initialData.vendor,
        amount: initialData.amount.toString(),
        category: initialData.category,
        date: format(new Date(initialData.date), 'yyyy-MM-dd'),
        isRecurring: !!initialData.subscriptionId
      });
    }
  }, [initialData]);

  const handleMagicParse = async () => {
    if (!magicText.trim()) return;
    
    setIsParsing(true);
    try {
      const result = await parseTransaction(magicText);
      setFormData(prev => ({
        ...prev,
        description: result.description || prev.description,
        amount: result.amount ? result.amount.toString() : prev.amount,
        category: (result.category as Category) || prev.category,
        vendor: result.vendor || result.description || prev.vendor // AI usually puts store in description or vendor
      }));
      setMagicText(''); // Clear magic input after successful parse
    } catch (error) {
      console.error("Magic parse failed", error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.vendor) {
      alert("Please fill in all required fields (Amount, Description, Vendor)");
      return;
    }

    const finalDate = parse(formData.date, 'yyyy-MM-dd', new Date());
    const now = new Date();
    finalDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    onAddTransaction({
      description: formData.description,
      vendor: formData.vendor,
      amount: parseFloat(formData.amount) || 0,
      category: formData.category
    }, finalDate.toISOString(), formData.isRecurring);

    if (!initialData) {
      setFormData({
        description: '',
        vendor: '',
        amount: '',
        category: Category.Other,
        date: format(new Date(), 'yyyy-MM-dd'),
        isRecurring: false
      });
    }
  };

  const inputClass = "w-full bg-transparent text-right font-semibold focus:outline-none text-blue-600 placeholder-gray-200";
  const rowClass = "flex justify-between items-center py-4 border-b border-gray-100 last:border-0";
  const labelClass = "flex items-center gap-2 text-gray-500 font-medium shrink-0";

  return (
    <div className={`w-full ${!initialData ? 'animate-in fade-in slide-in-from-bottom-2 duration-300' : ''}`}>
      
      {!initialData && (
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-5 mb-6 shadow-lg shadow-blue-100">
          <label className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest mb-3">
            <Sparkles size={12} />
            Magic AI Entry
          </label>
          <div className="relative">
            <textarea 
              rows={2}
              placeholder="e.g., 'Spent $50.99 on Abercrombie jeans'..."
              value={magicText}
              onChange={(e) => setMagicText(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none font-medium"
            />
            <button 
              onClick={handleMagicParse}
              disabled={isParsing || !magicText.trim()}
              className="absolute right-3 bottom-3 bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isParsing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isParsing ? 'Thinking...' : 'Parse'}
            </button>
          </div>
        </div>
      )}

      <form 
        id={initialData ? "edit-transaction-form" : "add-transaction-form"}
        onSubmit={handleSubmit} 
        className={`${initialData ? '' : 'bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden'}`}
      >
        {/* Large Amount Input */}
        <div className="text-center mb-8 pt-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Amount</label>
          <div className="flex items-center justify-center text-5xl font-black text-black">
            <span className="text-gray-200 mr-1">$</span>
            <input 
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="w-48 bg-transparent focus:outline-none text-center placeholder-gray-100"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className={rowClass}>
            <div className={labelClass}>
              <AlignLeft size={18} className="text-gray-300" />
              <span>Description</span>
            </div>
            <input 
              type="text"
              placeholder="e.g. Jeans"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className={inputClass}
              required
            />
          </div>

          <div className={rowClass}>
            <div className={labelClass}>
              <User size={18} className="text-gray-300" />
              <span>Vendor</span>
            </div>
            <input 
              type="text"
              placeholder="e.g. Abercrombie"
              value={formData.vendor}
              onChange={(e) => setFormData({...formData, vendor: e.target.value})}
              className={inputClass}
              required
            />
          </div>

          <div className={rowClass}>
            <div className={labelClass}>
              <Tag size={18} className="text-gray-300" />
              <span>Category</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_CONFIG[formData.category].color }} />
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value as Category})}
                className="bg-transparent font-bold appearance-none focus:outline-none text-blue-600 text-right cursor-pointer"
              >
                {Object.values(Category).map(cat => (
                  <option key={`opt-${cat}`} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={rowClass}>
            <div className={labelClass}>
              <Calendar size={18} className="text-gray-300" />
              <span>Date</span>
            </div>
            <input 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className={inputClass}
              required
            />
          </div>

          <div className={rowClass}>
            <div className={labelClass}>
              <RefreshCw size={18} className={formData.isRecurring ? "text-blue-500" : "text-gray-300"} />
              <span>Recurring</span>
            </div>
            <button
              type="button"
              disabled={!!initialData} 
              onClick={() => setFormData(prev => ({ ...prev, isRecurring: !prev.isRecurring }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${formData.isRecurring ? 'bg-blue-500' : 'bg-gray-200'} ${initialData ? 'opacity-50' : ''}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isRecurring ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {!onCancel ? (
          <button
            type="submit"
            className="w-full mt-10 bg-black text-white font-bold py-5 rounded-[20px] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-gray-900"
          >
            <Check size={20} />
            Confirm Transaction
          </button>
        ) : (
          <div className="flex flex-col gap-3 mt-10">
            <button
              type="submit"
              className="w-full bg-blue-500 text-white font-bold py-5 rounded-[20px] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Save Changes
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-all flex items-center justify-center gap-2"
            >
              <X size={18} />
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default TransactionInput;
