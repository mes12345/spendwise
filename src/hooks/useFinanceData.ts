
import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { Transaction, Subscription, Category } from '../types';
import { isSameMonth } from 'date-fns';
import { User } from 'firebase/auth';

export function useFinanceData(user: User | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [budget, setBudget] = useState<number>(2000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setSubscriptions([]);
      setBudget(2000);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userId = user.uid;

    // Sync Budget
    const userDocRef = doc(db, 'users', userId);
    const unsubUser = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setBudget(snapshot.data().monthlyLimit || 2000);
      } else {
        setDoc(userDocRef, { 
          monthlyLimit: 2000, 
          email: user.email,
          createdAt: new Date().toISOString()
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}`));

    // Sync Transactions
    const transRef = collection(db, 'users', userId, 'transactions');
    const qTrans = query(transRef, orderBy('date', 'desc'));
    const unsubTrans = onSnapshot(qTrans, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(list);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/transactions`));

    // Sync Subscriptions
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

  const saveTransaction = async (t: Omit<Transaction, 'id' | 'date'>, date: string, isRecurring: boolean, editingId?: string) => {
    if (!user) return;
    const userId = user.uid;
    const batch = writeBatch(db);

    try {
      let subId: string | undefined;

      if (editingId) {
        const existingTrans = transactions.find(tr => tr.id === editingId);
        subId = existingTrans?.subscriptionId;

        // Update existing
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
        } else if (!isRecurring && subId) {
          batch.delete(doc(db, 'users', userId, 'subscriptions', subId));
          subId = undefined;
        } else if (isRecurring && subId) {
          batch.update(doc(db, 'users', userId, 'subscriptions', subId), {
            description: t.description,
            vendor: t.vendor,
            amount: t.amount,
            category: t.category,
            dayOfMonth: new Date(date).getDate()
          });
        }

        batch.update(doc(db, 'users', userId, 'transactions', editingId), { 
          ...t, 
          date, 
          subscriptionId: subId || null 
        });
      } else {
        // Create new
        const transId = doc(collection(db, 'placeholder')).id;
        const newSubId = isRecurring ? doc(collection(db, 'placeholder')).id : undefined;

        batch.set(doc(db, 'users', userId, 'transactions', transId), {
          ...t,
          date,
          subscriptionId: newSubId || null
        });

        if (isRecurring && newSubId) {
          batch.set(doc(db, 'users', userId, 'subscriptions', newSubId), {
            description: t.description,
            vendor: t.vendor,
            amount: t.amount,
            category: t.category,
            dayOfMonth: new Date(date).getDate(),
            active: true
          });
        }
      }

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/transactions`);
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

  const updateBudget = async (val: number) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { monthlyLimit: val });
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

  return {
    transactions,
    subscriptions,
    budget,
    loading,
    proposedSubscriptions,
    saveTransaction,
    deleteTransaction,
    updateBudget
  };
}
