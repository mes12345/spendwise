
import React, { useState, useMemo, useCallback } from 'react';
import { LayoutGrid, PlusCircle, Wallet, Settings, Check, X, LogOut, ChevronRight, Search, Filter, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, startOfMonth, startOfYear, isAfter } from 'date-fns';

import TopHeader from './components/TopHeader';
import Dashboard from './components/Dashboard';
import TransactionInput from './components/TransactionInput';
import TransactionList from './components/TransactionList';
import SettingsModal from './components/SettingsModal';
import ProposedSubscriptions from './components/ProposedSubscriptions';
import Login from './components/Login';
import AccessDenied from './components/AccessDenied';

import { Transaction, Timeframe, Subscription, RecurrenceType, Category } from './types';
import { useAuth } from './components/FirebaseProvider';
import { useFinanceData } from './hooks/useFinanceData';

type Tab = 'Dashboard' | 'Add' | 'Transactions';

const ALLOWED_EMAILS = [
  'mathew.e.spencer@gmail.com',
  'cvondeisenroth@gmail.com'
];

const App: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  
  const isAllowed = useMemo(() => {
    if (!user || !user.email) return false;
    return ALLOWED_EMAILS.includes(user.email.toLowerCase());
  }, [user]);

  const { 
    transactions, 
    subscriptions,
    budget, 
    loading: dataLoading, 
    proposedSubscriptions, 
    saveTransaction, 
    deleteTransaction, 
    updateBudget,
    viewScope,
    setViewScope,
    household,
    addMemberToHousehold,
    importData
  } = useFinanceData(user);

  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [dashboardTimeframe, setDashboardTimeframe] = useState<Timeframe>('Month');
  const [activityStartDate, setActivityStartDate] = useState<string>('');
  const [activityEndDate, setActivityEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [activitySearch, setActivitySearch] = useState('');
  const [activityCategory, setActivityCategory] = useState<Category | 'All'>('All');
  const [activitySortField, setActivitySortField] = useState<'date' | 'amount'>('date');
  const [activitySortDirection, setActivitySortDirection] = useState<'asc' | 'desc'>('desc');
  const [showSettings, setShowSettings] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => {
      const transDate = new Date(t.date);
      const start = activityStartDate ? new Date(activityStartDate) : null;
      const end = activityEndDate ? new Date(activityEndDate) : null;
      
      if (start) {
        const startOfDay = new Date(start);
        startOfDay.setHours(0, 0, 0, 0);
        if (transDate < startOfDay) return false;
      }
      
      if (end) {
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);
        if (transDate > endOfDay) return false;
      }

      if (activitySearch) {
        const search = activitySearch.toLowerCase();
        const matchesDescription = t.description.toLowerCase().includes(search);
        const matchesVendor = t.vendor.toLowerCase().includes(search);
        if (!matchesDescription && !matchesVendor) return false;
      }

      if (activityCategory !== 'All' && t.category !== activityCategory) {
        return false;
      }
      
      return true;
    });

    // Handle Sorting
    result = [...result].sort((a, b) => {
      if (activitySortField === 'date') {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return activitySortDirection === 'desc' ? timeB - timeA : timeA - timeB;
      } else {
        return activitySortDirection === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
    });

    return result.slice(0, 100); // Limit to 100 for performance
  }, [transactions, activityStartDate, activityEndDate, activitySearch, activityCategory, activitySortField, activitySortDirection]);

  const handleExport = useCallback(() => {
    const data = {
      transactions,
      subscriptions,
      budget,
      exportDate: new Date().toISOString(),
      app: 'SpendWise'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    document.body.appendChild(a);
    a.href = url;
    a.download = `spendwise_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [transactions, subscriptions, budget]);

  const handleImport = useCallback(async (data: any) => {
    if (!data || (!data.transactions && !data.expenses)) {
      alert("Invalid backup file format. Expected a SpendWise JSON backup.");
      return;
    }
    
    // Normalize data (handle both "transactions" and "expenses" if the schema varied)
    const normalizedData = {
      transactions: data.transactions || data.expenses || [],
      subscriptions: data.subscriptions || []
    };

    try {
      await importData(normalizedData);
      alert("Data imported successfully!");
      setShowSettings(false);
    } catch (err) {
      console.error("Import failed", err);
      alert("Import failed. Please check the file format.");
    }
  }, [importData]);

  const handleSaveTransaction = async (
    t: Omit<Transaction, 'id' | 'date'>, 
    date: string, 
    isRecurring: boolean,
    recurringOptions?: {
      frequency: number;
      recurrenceType: RecurrenceType;
      weekdayConfig?: { weekIndex: number; dayOfWeek: number };
    }
  ) => {
    await saveTransaction(t, date, isRecurring, editingTransaction?.id, recurringOptions);
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

  if (!isAllowed) return <AccessDenied />;

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
              timeframe={dashboardTimeframe} 
              onTimeframeChange={setDashboardTimeframe} 
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
            {/* Activity Header Controls */}
            <div className="bg-white sticky top-0 z-20 border-b border-slate-50">
              <div className="px-6 py-4 space-y-3">
                {/* Search Bar */}
                <div className="relative group">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    type="text"
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    placeholder="Search by vendor or description..."
                    className="w-full bg-slate-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 focus:outline-none transition-all"
                  />
                  {activitySearch && (
                    <button 
                      onClick={() => setActivitySearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Category Filter */}
                  <div className="flex-1 relative">
                    <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select 
                      value={activityCategory}
                      onChange={(e) => setActivityCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-transparent rounded-xl py-2.5 pl-9 pr-4 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-100 appearance-none cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      {Object.values(Category).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Controls */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        if (activitySortField === 'date') {
                          setActivitySortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                        } else {
                          setActivitySortField('date');
                          setActivitySortDirection('desc');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activitySortField === 'date' 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <ArrowUpDown size={12} className={activitySortField === 'date' ? 'opacity-100' : 'opacity-40'} />
                      <span>Date {activitySortField === 'date' && (activitySortDirection === 'desc' ? '↓' : '↑')}</span>
                    </button>

                    <button 
                      onClick={() => {
                        if (activitySortField === 'amount') {
                          setActivitySortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                        } else {
                          setActivitySortField('amount');
                          setActivitySortDirection('desc');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activitySortField === 'amount' 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <ArrowUpDown size={12} className={activitySortField === 'amount' ? 'opacity-100' : 'opacity-40'} />
                      <span>Price {activitySortField === 'amount' && (activitySortDirection === 'desc' ? '↓' : '↑')}</span>
                    </button>
                  </div>
                </div>

                {/* Date Range Filters (Always Visible) */}
                <div className="flex bg-slate-50 p-2 rounded-2xl gap-2 items-center">
                  <div className="flex-1 text-center">
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">From</label>
                    <input 
                      type="date"
                      value={activityStartDate}
                      onChange={(e) => setActivityStartDate(e.target.value)}
                      className="w-full bg-white rounded-xl py-2 px-3 text-[10px] font-bold text-slate-600 focus:outline-none border border-slate-100 shadow-sm"
                    />
                  </div>
                  <div className="flex-1 text-center">
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">To</label>
                    <input 
                      type="date"
                      value={activityEndDate}
                      onChange={(e) => setActivityEndDate(e.target.value)}
                      className="w-full bg-white rounded-xl py-2 px-3 text-[10px] font-bold text-slate-600 focus:outline-none border border-slate-100 shadow-sm"
                    />
                  </div>
                  <div className="self-end pb-0.5">
                    {(activityStartDate || activityEndDate) && (
                      <button 
                        onClick={() => {
                          setActivityStartDate('');
                          setActivityEndDate(format(new Date(), 'yyyy-MM-dd'));
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Reset Date Range"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <TransactionList 
              transactions={filteredTransactions} 
              onDelete={deleteTransaction} 
              onEdit={(t) => setEditingTransaction(t)}
              showGroups={activitySortField === 'date'}
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
        title={activeTab === 'Add' ? 'Add Expense' : activeTab === 'Transactions' ? 'Activity' : (viewScope === 'Household' ? 'Household' : 'SpendWise')} 
        rightElement={rightHeaderElement}
      />
      
      {/* View Toggle */}
      {household && household.memberUids.length > 1 && (
        <div className="px-6 py-2 bg-white border-b border-slate-100 flex justify-center">
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full max-w-[280px]">
            <button 
              onClick={() => setViewScope('User')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewScope === 'User' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              Me
            </button>
            <button 
              onClick={() => setViewScope('Household')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewScope === 'Household' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              {household.name || 'Home'}
            </button>
          </div>
        </div>
      )}
      
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
          household={household}
          onUpdateBudget={async (val) => {
            await updateBudget(val);
            setShowSettings(false);
          }}
          onAddMember={addMemberToHousehold}
          onExport={handleExport}
          onImport={handleImport}
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
