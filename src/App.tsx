
import React, { useState, useMemo, useCallback } from 'react';
import { LayoutGrid, PlusCircle, Wallet, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

import Dashboard from './components/Dashboard';
import TransactionInput from './components/TransactionInput';
import TransactionList from './components/TransactionList';
import SettingsModal from './components/SettingsModal';
import ProposedSubscriptions from './components/ProposedSubscriptions';
import Login from './components/Login';
import AccessDenied from './components/AccessDenied';
import Layout from './components/Layout';
import ActivityFilters from './components/ActivityFilters';

import { Transaction, Timeframe, RecurrenceType, Category } from './types';
import { useAuth } from './components/FirebaseProvider';
import { useFinance } from './contexts/FinanceContext';
import { useFilteredTransactions } from './hooks/useFilteredTransactions';

type Tab = 'Dashboard' | 'Add' | 'Transactions';

const ALLOWED_EMAILS = [
  'mathew.e.spencer@gmail.com',
  'cvondeisenroth@gmail.com'
];

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
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
  } = useFinance();

  // Navigation State
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Filters State
  const [dashboardTimeframe, setDashboardTimeframe] = useState<Timeframe>('Month');
  const [activitySearch, setActivitySearch] = useState('');
  const [activityCategory, setActivityCategory] = useState<Category | 'All'>('All');
  const [activitySortField, setActivitySortField] = useState<'date' | 'amount'>('date');
  const [activitySortDirection, setActivitySortDirection] = useState<'asc' | 'desc'>('desc');
  const [activityStartDate, setActivityStartDate] = useState<string>('');
  const [activityEndDate, setActivityEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Logic
  const isAllowed = useMemo(() => {
    if (!user || !user.email) return false;
    return ALLOWED_EMAILS.includes(user.email.toLowerCase());
  }, [user]);

  const filteredTransactions = useFilteredTransactions(transactions, {
    startDate: activityStartDate,
    endDate: activityEndDate,
    search: activitySearch,
    category: activityCategory,
    sortField: activitySortField,
    sortDirection: activitySortDirection
  });

  const uniqueMerchants = useMemo(() => {
    const merchants = transactions.map(t => t.vendor);
    return Array.from(new Set(merchants)).filter(m => !!m);
  }, [transactions]);

  // Handlers
  const handleSaveTransaction = async (
    t: Omit<Transaction, 'id' | 'date' | 'userId' | 'householdId'>, 
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

  const handleExport = useCallback(() => {
    const data = { transactions, subscriptions, budget, exportDate: new Date().toISOString(), app: 'SpendWise' };
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

  // Sub-renderers
  const rightHeaderElement = useMemo(() => {
    if (activeTab === 'Add' || editingTransaction) {
      return (
        <button onClick={handleDoneClick} className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold shadow-lg shadow-indigo-200 active:scale-95 transition-all">
          Done
        </button>
      );
    }
    return (
      <button onClick={() => setShowSettings(true)} className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 active:scale-95 transition-all">
        <Settings size={20} />
      </button>
    );
  }, [activeTab, editingTransaction, handleDoneClick]);

  const bottomNavElement = useMemo(() => {
    const items = [
      { id: 'Dashboard', icon: LayoutGrid, label: 'Overview' },
      { id: 'Add', icon: PlusCircle, label: 'Add', isLarge: true },
      { id: 'Transactions', icon: Wallet, label: 'Activity' },
    ];
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = activeTab === item.id;
      return (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id as Tab)}
          className={`flex flex-col items-center gap-1.5 transition-all group ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <div className={`p-1 rounded-xl transition-all ${isActive && !item.isLarge ? 'bg-indigo-50' : ''}`}>
            <Icon size={item.isLarge ? 32 : 24} className={item.isLarge ? 'text-indigo-600' : ''} />
          </div>
          <span className="text-[10px] font-bold tracking-tight uppercase opacity-80">{item.label}</span>
          {isActive && <motion.div layoutId="tab-indicator" className="w-1 h-1 bg-indigo-600 rounded-full mt-0.5" />}
        </button>
      );
    });
  }, [activeTab]);

  const viewToggleElement = useMemo(() => {
    if (!household || household.memberUids.length <= 1) return null;
    return (
      <div className="px-6 py-2 bg-white border-b border-slate-100 flex justify-center">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full max-w-[280px]">
          <button onClick={() => setViewScope('User')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewScope === 'User' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
            Me
          </button>
          <button onClick={() => setViewScope('Household')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewScope === 'Household' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
            {household.name || 'Home'}
          </button>
        </div>
      </div>
    );
  }, [household, viewScope, setViewScope]);

  if (authLoading || (user && dataLoading)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4" />
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-32 space-y-6">
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
              onCategoryClick={(category, range) => {
                setActivityCategory(category);
                setActivityStartDate(format(range.start, 'yyyy-MM-dd'));
                setActivityEndDate(format(range.end, 'yyyy-MM-dd'));
                setActiveTab('Transactions');
              }}
            />
          </motion.div>
        );
      case 'Add':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-6 pt-6 pb-32">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Add Expense</h2>
              <p className="text-slate-500 text-sm mt-1">Record your spending for better insights.</p>
            </div>
            <TransactionInput onAddTransaction={handleSaveTransaction} existingMerchants={uniqueMerchants} onCancel={() => setActiveTab('Dashboard')} />
          </motion.div>
        );
      case 'Transactions':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pb-32">
            <ActivityFilters 
              search={activitySearch} onSearchChange={setActivitySearch}
              category={activityCategory} onCategoryChange={setActivityCategory}
              sortField={activitySortField} onSortFieldChange={setActivitySortField}
              sortDirection={activitySortDirection} onSortDirectionChange={setActivitySortDirection}
              startDate={activityStartDate} onStartDateChange={setActivityStartDate}
              endDate={activityEndDate} onEndDateChange={setActivityEndDate}
              onResetDates={() => {
                setActivityStartDate('');
                setActivityEndDate(format(new Date(), 'yyyy-MM-dd'));
              }}
            />
            <TransactionList transactions={filteredTransactions} onDelete={deleteTransaction} onEdit={(t) => setEditingTransaction(t)} showGroups={activitySortField === 'date'} />
          </motion.div>
        );
    }
  };

  return (
    <>
      <Layout 
        title={activeTab === 'Add' ? 'Add Expense' : activeTab === 'Transactions' ? 'Activity' : (viewScope === 'Household' ? 'Household' : 'SpendWise')} 
        rightHeaderElement={rightHeaderElement}
        viewToggleElement={viewToggleElement}
        bottomNavElement={<>{bottomNavElement}</>}
      >
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </Layout>

      {showSettings && (
        <SettingsModal 
          currentBudget={budget} household={household}
          onUpdateBudget={async (val) => { await updateBudget(val); setShowSettings(false); }}
          onAddMember={addMemberToHousehold} onExport={handleExport} onImport={handleImport} onClose={() => setShowSettings(false)}
        />
      )}

      <AnimatePresence>
        {editingTransaction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex flex-col justify-end">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-white w-full max-h-[90vh] rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col">
              <div className="px-6 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 leading-none">Edit Transaction</h2>
                  <p className="text-slate-400 text-xs mt-1 font-medium italic">Adjusting historical data</p>
                </div>
                <button onClick={() => setEditingTransaction(null)} className="p-2 bg-slate-50 text-slate-400 rounded-full hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
                <TransactionInput initialData={editingTransaction} existingMerchants={uniqueMerchants} onAddTransaction={handleSaveTransaction} onCancel={() => setEditingTransaction(null)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
