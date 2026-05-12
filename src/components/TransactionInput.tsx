
import React, { useState, useEffect } from 'react';
import { Calendar, Tag, User, AlignLeft, RefreshCw, Check, X, Wand2, Sparkles, Building2 } from 'lucide-react';
import { Transaction, Category } from '../types';
import { CATEGORY_CONFIG, getCategoryConfig } from '../constants';
import { format, parse } from 'date-fns';
import { parseNaturalLanguageTransaction } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

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
        setAiError("I couldn't quite catch that. Try adding more detail!");
      }
    } catch (err) {
      setAiError("The magic failed. Please try again or enter manually.");
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.vendor) return;

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

  const rowClass = "flex justify-between items-center py-5 border-b border-slate-100 last:border-0 group";
  const labelClass = "flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest shrink-0 transition-colors group-focus-within:text-indigo-600";
  const inputClass = "w-full bg-transparent text-right font-bold focus:outline-none text-slate-900 placeholder-slate-200 text-sm";

  return (
    <div className="w-full">
      {!initialData && (
        <section className="mb-8">
          <div className="bg-slate-900 rounded-[32px] p-5 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10 group">
             <div className="flex items-center gap-2 mb-4 relative z-10">
               <div className="p-1.5 bg-indigo-500 rounded-lg">
                 <Sparkles size={12} className="text-white" />
               </div>
               <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300">Magic Entry</h3>
             </div>
             <div className="relative z-10">
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="e.g. Spent $65 on dinner at Carbone tonight"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:outline-none focus:bg-white/10 transition-all text-sm min-h-[100px] resize-none leading-relaxed"
                />
                <button
                  type="button"
                  onClick={handleAiParse}
                  disabled={isAiParsing || !aiInput.trim()}
                  className="absolute bottom-3 right-3 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-900 active:scale-95 transition-all disabled:opacity-30"
                >
                  {isAiParsing ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-3 h-3 border-2 border-white border-t-transparent rounded-full" 
                    />
                  ) : (
                    <>
                      <Wand2 size={12} />
                      Enchant
                    </>
                  )}
                </button>
             </div>
             {aiError && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-rose-400 text-[10px] mt-3 font-bold uppercase tracking-tight italic px-1"
              >
                {aiError}
              </motion.p>
             )}
             {/* Decorative blobs */}
             <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
          </div>
        </section>
      )}
      
      <form 
        id={initialData ? "edit-transaction-form" : "add-transaction-form"}
        onSubmit={handleSubmit} 
        className="space-y-6"
      >
        {/* Large Amount Input */}
        <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm text-center relative">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-20 pointer-events-none">
            <CreditCard size={10} className="text-slate-900" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-900">transaction value</span>
          </div>
          <div className="flex items-center justify-center text-6xl font-black text-slate-900 mt-4 tabular-nums">
            <span className="text-slate-200 mr-2 select-none">$</span>
            <input 
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="w-full bg-transparent focus:outline-none text-center placeholder-slate-100 caret-indigo-600"
              required
            />
          </div>
        </section>

        <section className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm divide-y divide-slate-50">
          <div className={rowClass}>
            <label className={labelClass}>
              <AlignLeft size={16} />
              <span>Detail</span>
            </label>
            <input 
              type="text"
              placeholder="e.g. Grocery Run"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className={inputClass}
              required
            />
          </div>

          <div className={rowClass}>
            <label className={labelClass}>
              <Building2 size={16} />
              <span>Merchant</span>
            </label>
            <input 
              type="text"
              placeholder="e.g. Whole Foods"
              value={formData.vendor}
              onChange={(e) => setFormData({...formData, vendor: e.target.value})}
              className={inputClass}
              required
            />
          </div>

          <div className={rowClass}>
            <label className={labelClass}>
              <Tag size={16} />
              <span>Category</span>
            </label>
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ backgroundColor: getCategoryConfig(formData.category).color }}
                className="w-2 h-2 rounded-full ring-4 ring-slate-50"
              />
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value as Category})}
                className="bg-transparent font-bold appearance-none focus:outline-none text-indigo-600 text-right cursor-pointer text-sm"
              >
                {Object.values(Category).map(cat => (
                  <option key={`opt-${cat}`} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={rowClass}>
            <label className={labelClass}>
              <Calendar size={16} />
              <span>Date</span>
            </label>
            <input 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className={inputClass}
              required
            />
          </div>

          <div className={rowClass}>
            <label className={labelClass}>
              <RefreshCw size={16} />
              <span>Recurring</span>
            </label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isRecurring: !prev.isRecurring }))}
              className={`w-11 h-6 rounded-full transition-all relative ${formData.isRecurring ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <motion.div 
                animate={{ x: formData.isRecurring ? 22 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
              />
            </button>
          </div>
        </section>

        {!initialData && (
          <div className="flex gap-4 items-center">
            <button
              type="submit"
              className="flex-1 bg-slate-900 text-white font-black py-5 rounded-3xl shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[11px]"
            >
              <Check size={16} />
              Commit Expense
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="p-5 bg-slate-100 text-slate-500 rounded-3xl hover:bg-slate-200 transition-all active:scale-95"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

import { CreditCard } from 'lucide-react';

export default TransactionInput;
