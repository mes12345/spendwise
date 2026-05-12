
import React, { useState, useEffect } from 'react';
import { Calendar, Tag, User, AlignLeft, RefreshCw, Check, X, Wand2, Sparkles } from 'lucide-react';
import { Transaction, Category } from '../types';
import { CATEGORY_CONFIG } from '../constants';
import { format, parse } from 'date-fns';
import { parseNaturalLanguageTransaction } from '../services/geminiService';

interface TransactionInputProps {
  onAddTransaction: (t: Omit<Transaction, 'id' | 'date'>, date: string, isRecurring: boolean) => void;
  initialData?: Transaction;
  onCancel?: () => void;
}

const TransactionInput: React.FC<TransactionInputProps> = ({ onAddTransaction, initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
    vendor: '',
    amount: '',
    category: Category.Other,
    date: format(new Date(), 'yyyy-MM-dd'),
    isRecurring: false
  });

  const [aiInput, setAiInput] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setIsAiParsing(true);
    setAiError(null);

    try {
      const result = await parseNaturalLanguageTransaction(aiInput);
      if (result) {
        setFormData({
          description: result.description || '',
          vendor: result.vendor || '',
          amount: result.amount?.toString() || '',
          category: (result.category as Category) || Category.Other,
          date: result.date || format(new Date(), 'yyyy-MM-dd'),
          isRecurring: !!result.isRecurring
        });
        setAiInput('');
      } else {
        setAiError("Could not parse. Try being more specific!");
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Error connecting to AI");
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.vendor) {
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
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[24px] p-4 mb-6 shadow-lg shadow-indigo-100">
           <div className="flex items-center gap-2 mb-3">
             <Sparkles size={16} className="text-white/80" />
             <h3 className="text-white font-bold text-sm tracking-tight">Magic Add</h3>
           </div>
           <div className="relative">
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="e.g. Spent $45 on groceries at Whole Foods..."
                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/40 focus:outline-none focus:bg-white/20 transition-all text-sm min-h-[80px] resize-none"
              />
              <button
                type="button"
                onClick={handleAiParse}
                disabled={isAiParsing || !aiInput.trim()}
                className="absolute bottom-2 right-2 p-2 bg-white rounded-lg text-indigo-600 shadow-sm active:scale-90 transition-all disabled:opacity-50"
              >
                {isAiParsing ? (
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Wand2 size={16} />
                )}
              </button>
           </div>
           {aiError && <p className="text-white/80 text-[10px] mt-2 font-medium">{aiError}</p>}
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
              onClick={() => setFormData(prev => ({ ...prev, isRecurring: !prev.isRecurring }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${formData.isRecurring ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isRecurring ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-10">
          <button
            type="submit"
            className={`w-full font-bold py-5 rounded-[20px] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${initialData ? 'bg-blue-500 text-white' : 'bg-black text-white hover:bg-gray-900'}`}
          >
            <Check size={20} />
            {initialData ? 'Save Changes' : 'Confirm Transaction'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <X size={18} />
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TransactionInput;
