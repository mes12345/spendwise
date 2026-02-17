
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, PlusCircle, Settings, Wallet, Check, X } from 'lucide-react';
import TopHeader from './components/TopHeader.tsx';
import Dashboard from './components/Dashboard.tsx';
import TransactionInput from './components/TransactionInput.tsx';
import TransactionList from './components/TransactionList.tsx';
import BudgetSetter from './components/BudgetSetter.tsx';
import ProposedSubscriptions from './components/ProposedSubscriptions.tsx';
import { Transaction, Timeframe, Subscription } from './types.ts';
import { INITIAL_TRANSACTIONS } from './constants.tsx';
import { isSameMonth } from 'date-fns';

type Tab = 'Dashboard' | 'Add' | 'Transactions' | 'Budget';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('spendwise_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('spendwise_subscriptions');
    return saved ? JSON.parse(saved) : [];
  });
  const [budget, setBudget] = useState<number>(() => {
    const saved = localStorage.getItem('spendwise_budget');
    return saved ? parseFloat(saved) : 2000;
  });
  const [timeframe, setTimeframe] = useState<Timeframe>('Month');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    localStorage.setItem('spendwise_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('spendwise_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('spendwise_budget', budget.toString());
  }, [budget]);

  const handleSaveTransaction = (t: Omit<Transaction, 'id' | 'date'>, date: string, isRecurring: boolean) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(item => 
        item.id === editingTransaction.id 
          ? { ...item, ...t, date } 
          : item
      ));
      setEditingTransaction(null);
    } else {
      const subId = isRecurring ? Math.random().toString(36).substr(2, 9) : undefined;
      
      const newTransaction: Transaction = {
        ...t,
        id: Math.random().toString(36).substr(2, 9),
        date: date,
        subscriptionId: subId
      };

      if (isRecurring) {
        const newSub: Subscription = {
          id: subId!,
          description: t.description,
          vendor: t.vendor,
          amount: t.amount,
          category: t.category,
          dayOfMonth: new Date(date).getDate(),
          active: true
        };
        setSubscriptions(prev => [...prev, newSub]);
      }

      setTransactions(prev => [newTransaction, ...prev]);
      setActiveTab('Transactions');
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const acceptProposedSubscription = (sub: Subscription) => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), sub.dayOfMonth);
    
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      description: sub.description,
      vendor: sub.vendor,
      amount: sub.amount,
      category: sub.category,
      date: date.toISOString(),
      subscriptionId: sub.id
    };

    setTransactions(prev => [newTransaction, ...prev]);
  };

  const proposedSubscriptions = useMemo(() => {
    const now = new Date();
    return subscriptions.filter(sub => {
      const existsThisMonth = transactions.some(t => 
        t.subscriptionId === sub.id && isSameMonth(new Date(t.date), now)
      );
      return !existsThisMonth && sub.active;
    });
  }, [subscriptions, transactions]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <div className="pb-32">
            <ProposedSubscriptions 
              proposals={proposedSubscriptions} 
              onAccept={acceptProposedSubscription}
              onDismiss={() => {}}
              onDelete={deleteSubscription}
            />
            <Dashboard 
              transactions={transactions} 
              budget={budget} 
              timeframe={timeframe} 
              onTimeframeChange={setTimeframe} 
            />
          </div>
        );
      case 'Add':
        return (
          <div className="px-5 pt-8 pb-32 animate-in slide-in-from-bottom-4 duration-400">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">New Transaction</h2>
            <TransactionInput onAddTransaction={handleSaveTransaction} />
          </div>
        );
      case 'Transactions':
        return (
          <div className="animate-in slide-in-from-bottom-4 duration-400 mt-4 pb-32">
             <TransactionList 
               transactions={transactions} 
               onDelete={deleteTransaction} 
               onEdit={(t) => setEditingTransaction(t)}
             />
          </div>
        );
      default:
        return null;
    }
  };

  const rightHeaderElement = useMemo(() => {
    if (activeTab === 'Add') {
      return (
        <button 
          form="add-transaction-form"
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-bold shadow-md active:scale-95 transition-all"
        >
          <Check size={16} />
          Done
        </button>
      );
    }
    return (
      <button 
        onClick={() => setShowBudgetModal(true)}
        aria-label="Open settings"
        className="p-2 bg-gray-200/50 rounded-full text-gray-600 hover:bg-gray-200 active:scale-95 transition-all"
      >
        <Settings size={20} />
      </button>
    );
  }, [activeTab]);

  const tabItems = [
    { id: 'Dashboard', icon: <LayoutGrid size={24} />, label: 'Overview' },
    { id: 'Add', icon: <PlusCircle size={28} className="text-blue-500" />, label: 'Add' },
    { id: 'Transactions', icon: <Wallet size={24} />, label: 'History' },
  ];

  return (
    <div className="max-w-md mx-auto h-full bg-[#F2F2F7] flex flex-col relative shadow-2xl overflow-hidden border-x border-gray-200">
      <TopHeader 
        title={activeTab === 'Add' ? 'Add' : activeTab === 'Transactions' ? 'History' : 'Overview'} 
        rightElement={rightHeaderElement}
      />
      
      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {renderContent()}
      </main>

      {/* Bottom Tab Bar with Safe Area support */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/90 ios-blur pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] px-8 flex justify-between items-center border-t border-gray-200 z-50">
        {tabItems.map((item) => (
          <button
            key={`tab-${item.id}`}
            onClick={() => setActiveTab(item.id as Tab)}
            aria-label={`Go to ${item.label}`}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${
              activeTab === item.id ? 'text-blue-500 scale-110' : 'text-gray-400'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      {showBudgetModal && (
        <BudgetSetter 
          currentBudget={budget} 
          onUpdate={(val) => {
            setBudget(val);
            setShowBudgetModal(false);
          }}
          onClose={() => setShowBudgetModal(false)}
        />
      )}

      {editingTransaction && (
        <div className="fixed inset-0 z-[110] bg-black/40 ios-blur flex flex-col justify-end animate-in fade-in duration-300">
          <div className="bg-[#F2F2F7] w-full max-h-[95vh] rounded-t-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 pb-[env(safe-area-inset-bottom,0px)]">
            <div className="px-6 py-6 border-b border-gray-100 bg-white flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Edit Transaction</h2>
              <button 
                onClick={() => setEditingTransaction(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-88px)]">
              <TransactionInput 
                initialData={editingTransaction} 
                onAddTransaction={handleSaveTransaction} 
                onCancel={() => setEditingTransaction(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
