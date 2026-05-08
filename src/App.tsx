
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, PlusCircle, Settings, Wallet, Check, X } from 'lucide-react';

console.info("SpendWise: App.tsx module loading...");
import TopHeader from './components/TopHeader';
import Dashboard from './components/Dashboard';
import TransactionInput from './components/TransactionInput';
import TransactionList from './components/TransactionList';
import SettingsModal from './components/SettingsModal';
import ProposedSubscriptions from './components/ProposedSubscriptions';
import Login from './components/Login';
import { Transaction, Timeframe, Subscription } from './types';
import { INITIAL_TRANSACTIONS } from './constants';
import { isSameMonth, format } from 'date-fns';
import { useAuth } from './components/FirebaseProvider';
import { db, handleFirestoreError, OperationType } from './services/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy,
  getDoc
} from 'firebase/firestore';

type Tab = 'Dashboard' | 'Add' | 'Transactions';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [budget, setBudget] = useState<number>(2000);
  const [dataLoading, setDataLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('Month');
  const [showSettings, setShowSettings] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Sync with Firestore
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setSubscriptions([]);
      setBudget(2000);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    const userId = user.uid;

    // 1. Sync User Profile (Budget)
    const userDocRef = doc(db, 'users', userId);
    const unsubUser = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setBudget(snapshot.data().monthlyLimit || 2000);
      } else {
        // Initialize user doc if it doesn't exist
        setDoc(userDocRef, { 
          monthlyLimit: 2000, 
          email: user.email,
          createdAt: new Date().toISOString()
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}`));

    // 2. Sync Transactions
    const transRef = collection(db, 'users', userId, 'transactions');
    const qTrans = query(transRef, orderBy('date', 'desc'));
    const unsubTrans = onSnapshot(qTrans, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(list);
      setDataLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/transactions`));

    // 3. Sync Subscriptions
    const subRef = collection(db, 'users', userId, 'subscriptions');
    const unsubSub = onSnapshot(subRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subscription));
      setSubscriptions(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/subscriptions`));

    return () => {
      unsubUser();
      unsubTrans();
      unsubSub();
    };
  }, [user]);

  const handleSaveTransaction = async (t: Omit<Transaction, 'id' | 'date'>, date: string, isRecurring: boolean) => {
    if (!user) return;
    const userId = user.uid;
    const batch = writeBatch(db);

    try {
      if (editingTransaction) {
        let subId = editingTransaction.subscriptionId;
        
        // If turned on recurring and didn't have one before
        if (isRecurring && !subId) {
          subId = doc(collection(db, 'placeholder')).id;
          const subRef = doc(db, 'users', userId, 'subscriptions', subId);
          batch.set(subRef, {
            description: t.description,
            vendor: t.vendor,
            amount: t.amount,
            category: t.category,
            dayOfMonth: new Date(date).getDate(),
            active: true
          });
        } 
        // If turned off recurring
        else if (!isRecurring && subId) {
          const subRef = doc(db, 'users', userId, 'subscriptions', subId);
          batch.delete(subRef);
          subId = undefined;
        }
        // If it's still recurring, update the subscription details
        else if (isRecurring && subId) {
          const subRef = doc(db, 'users', userId, 'subscriptions', subId);
          batch.update(subRef, { 
            description: t.description, 
            vendor: t.vendor, 
            amount: t.amount, 
            category: t.category,
            dayOfMonth: new Date(date).getDate()
          });
        }

        const transRef = doc(db, 'users', userId, 'transactions', editingTransaction.id);
        batch.update(transRef, { ...t, date, subscriptionId: subId || null });
        
        await batch.commit();
        setEditingTransaction(null);
      } else {
        const transId = doc(collection(db, 'placeholder')).id;
        const subId = isRecurring ? doc(collection(db, 'placeholder')).id : undefined;
        
        const transRef = doc(db, 'users', userId, 'transactions', transId);
        batch.set(transRef, {
          ...t,
          date: date,
          subscriptionId: subId || null
        });

        if (isRecurring && subId) {
          const subRef = doc(db, 'users', userId, 'subscriptions', subId);
          batch.set(subRef, {
            description: t.description,
            vendor: t.vendor,
            amount: t.amount,
            category: t.category,
            dayOfMonth: new Date(date).getDate(),
            active: true
          });
        }

        await batch.commit();
        setActiveTab('Transactions');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/transactions/${id}`);
    }
  };

  const deleteSubscription = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'subscriptions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/subscriptions/${id}`);
    }
  };

  const acceptProposedSubscription = async (sub: Subscription) => {
    if (!user) return;
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), sub.dayOfMonth);
    
    try {
      const transId = doc(collection(db, 'placeholder')).id;
      await setDoc(doc(db, 'users', user.uid, 'transactions', transId), {
        description: sub.description,
        vendor: sub.vendor,
        amount: sub.amount,
        category: sub.category,
        date: date.toISOString(),
        subscriptionId: sub.id
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/transactions`);
    }
  };

  const handleUpdateBudget = async (val: number) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { monthlyLimit: val }, { merge: true });
      setShowSettings(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
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

  const handleDoneClick = React.useCallback(() => {
    const form = document.getElementById('add-transaction-form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  }, []);

  const rightHeaderElement = useMemo(() => {
    if (activeTab === 'Add') {
      return (
        <button 
          onClick={handleDoneClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-bold shadow-md active:scale-95 transition-all"
        >
          <Check size={16} />
          Done
        </button>
      );
    }
    return (
      <button 
        onClick={() => setShowSettings(true)}
        aria-label="Open settings"
        className="p-2 bg-gray-200/50 rounded-full text-gray-600 hover:bg-gray-200 active:scale-95 transition-all"
      >
        <Settings size={20} />
      </button>
    );
  }, [activeTab, handleDoneClick]);

  if (authLoading || (user && dataLoading)) {
    return (
      <div className="max-w-md mx-auto h-full bg-white flex flex-col items-center justify-center p-10">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Syncing with Cloud...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto h-full">
        <Login />
      </div>
    );
  }

  const handleExportData = () => {
    const exportData = {
      transactions,
      subscriptions,
      budget,
      exportDate: new Date().toISOString(),
      app: 'SpendWise'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spendwise_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (data: any) => {
    if (data.app === 'SpendWise' && data.transactions) {
      const userId = user.uid;
      const batch = writeBatch(db);
      
      data.transactions.forEach((t: any) => {
        const ref = doc(collection(db, 'users', userId, 'transactions'));
        batch.set(ref, t);
      });
      
      if (data.subscriptions) {
        data.subscriptions.forEach((s: any) => {
          const ref = doc(db, 'users', userId, 'subscriptions', s.id);
          batch.set(ref, s);
        });
      }

      if (data.budget) {
        batch.update(doc(db, 'users', userId), { monthlyLimit: data.budget });
      }

      batch.commit().then(() => {
        setShowSettings(false);
      }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
    }
  };

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
            <TransactionInput 
              onAddTransaction={handleSaveTransaction} 
              onCancel={() => setActiveTab('Dashboard')}
            />
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
      
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-white relative z-0">
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

      {showSettings && (
        <SettingsModal 
          currentBudget={budget} 
          onUpdateBudget={handleUpdateBudget}
          onExport={handleExportData}
          onImport={handleImportData}
          onClose={() => setShowSettings(false)}
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
