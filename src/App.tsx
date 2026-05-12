
import React, { useState, useMemo, useCallback } from 'react';
import { LayoutGrid, PlusCircle, Wallet, Settings, Check, X, LogOut, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

import TopHeader from './components/TopHeader';
import Dashboard from './components/Dashboard';
import TransactionInput from './components/TransactionInput';
import TransactionList from './components/TransactionList';
import SettingsModal from './components/SettingsModal';
import ProposedSubscriptions from './components/ProposedSubscriptions';
import Login from './components/Login';

import { Transaction, Timeframe, Subscription } from './types';
import { useAuth } from './components/FirebaseProvider';
import { useFinanceData } from './hooks/useFinanceData';

type Tab = 'Dashboard' | 'Add' | 'Transactions';

const App: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { 
    transactions, 
    budget, 
    loading: dataLoading, 
    proposedSubscriptions, 
    saveTransaction, 
    deleteTransaction, 
    updateBudget 
  } = useFinanceData(user);

  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [timeframe, setTimeframe] = useState<Timeframe>('Month');
  const [showSettings, setShowSettings] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleSaveTransaction = async (t: Omit<Transaction, 'id' | 'date'>, date: string, isRecurring: boolean) => {
    await saveTransaction(t, date, isRecurring, editingTransaction?.id);
    setEditingTransaction(null);
    if (!editingTransaction) {
      setActiveTab('Transactions');
    }
  };

  const handleDoneClick = useCallback(() => {
    const formId = editingTransaction ? "edit-transaction-form" : "add-transaction-form";
    const form = document.getElementById(formId) as HTMLFormElement;
    if (form) form.requestSubmit();
  }, [editingTransaction]);

  const rightHeaderElement = useMemo(() => {
    if (activeTab === 'Add' || editingTransaction) {
      return (
        <button 
          onClick={handleDoneClick}
          className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold shadow-lg shadow-indigo-200 active:scale-95 transition-all"
        >
          Done
        </button>
      );
    }
    return (
      <button 
        onClick={() => setShowSettings(true)}
        className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
      >
        <Settings size={20} />
      </button>
    );
  }, [activeTab, editingTransaction, handleDoneClick]);

  if (authLoading || (user && dataLoading)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"
        />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Encrypting Bank-Grade Data...</p>
      </div>
    );
  }

  if (!user) return <Login />;

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pb-32 space-y-6"
          >
            <ProposedSubscriptions 
              proposals={proposedSubscriptions} 
              onAccept={async (sub) => {
                const now = new Date();
                const date = new Date(now.getFullYear(), now.getMonth(), sub.dayOfMonth).toISOString();
                await saveTransaction({
                  description: sub.description,
                  vendor: sub.vendor,
                  amount: sub.amount,
                  category: sub.category,
                }, date, true);
              }}
              onDismiss={() => {}}
              onDelete={() => {}}
            />
            <Dashboard 
              transactions={transactions} 
              budget={budget} 
              timeframe={timeframe} 
              onTimeframeChange={setTimeframe} 
            />
          </motion.div>
        );
      case 'Add':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-6 pt-6 pb-32"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Add Expense</h2>
              <p className="text-slate-500 text-sm mt-1">Record your spending for better insights.</p>
            </div>
            <TransactionInput 
              onAddTransaction={handleSaveTransaction} 
              onCancel={() => setActiveTab('Dashboard')}
            />
          </motion.div>
        );
      case 'Transactions':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pb-32"
          >
            <TransactionList 
              transactions={transactions} 
              onDelete={deleteTransaction} 
              onEdit={(t) => setEditingTransaction(t)}
            />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-50 flex flex-col relative shadow-2xl overflow-hidden border-x border-slate-200">
      <TopHeader 
        title={activeTab === 'Add' ? 'Add Expense' : activeTab === 'Transactions' ? 'Activity' : 'SpendWise'} 
        rightElement={rightHeaderElement}
      />
      
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-white relative z-0">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      <nav className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] px-10 flex justify-between items-center border-t border-slate-100 z-50">
        {[
          { id: 'Dashboard', icon: LayoutGrid, label: 'Overview' },
          { id: 'Add', icon: PlusCircle, label: 'Add', isLarge: true },
          { id: 'Transactions', icon: Wallet, label: 'Activity' },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`flex flex-col items-center gap-1.5 transition-all group ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive && !item.isLarge ? 'bg-indigo-50' : ''}`}>
                <Icon size={item.isLarge ? 32 : 24} className={item.isLarge ? 'text-indigo-600' : ''} />
              </div>
              <span className="text-[10px] font-bold tracking-tight uppercase opacity-80">{item.label}</span>
              {isActive && (
                <motion.div layoutId="tab-indicator" className="w-1 h-1 bg-indigo-600 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>

      {showSettings && (
        <SettingsModal 
          currentBudget={budget} 
          onUpdateBudget={async (val) => {
            await updateBudget(val);
            setShowSettings(false);
          }}
          onExport={() => {}}
          onImport={() => {}}
          onClose={() => setShowSettings(false)}
        />
      )}

      <AnimatePresence>
        {editingTransaction && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex flex-col justify-end"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-h-[90vh] rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="px-6 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 leading-none">Edit Transaction</h2>
                  <p className="text-slate-400 text-xs mt-1 font-medium italic">Adjusting historical data</p>
                </div>
                <button 
                  onClick={() => setEditingTransaction(null)}
                  className="p-2 bg-slate-50 text-slate-400 rounded-full hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
                <TransactionInput 
                  initialData={editingTransaction} 
                  onAddTransaction={handleSaveTransaction} 
                  onCancel={() => setEditingTransaction(null)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
