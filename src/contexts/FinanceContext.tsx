
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy,
  updateDoc,
  collectionGroup,
  where,
  getDoc,
  getDocs,
  limit,
  arrayUnion
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { Transaction, Subscription, Category, RecurrenceType, UserProfile, Household } from '../types';
import { useAuth } from '../components/FirebaseProvider';
import { differenceInMonths, isSameMonth } from 'date-fns';

export type ViewScope = 'User' | 'Household';

interface FinanceContextType {
  transactions: Transaction[];
  subscriptions: Subscription[];
  budget: number;
  loading: boolean;
  proposedSubscriptions: Subscription[];
  viewScope: ViewScope;
  setViewScope: (scope: ViewScope) => void;
  profile: UserProfile | null;
  household: Household | null;
  saveTransaction: (
    t: Omit<Transaction, 'id' | 'date' | 'userId' | 'householdId'>, 
    date: string, 
    isRecurring: boolean, 
    editingId?: string,
    recurringOptions?: {
      frequency: number;
      recurrenceType: RecurrenceType;
      weekdayConfig?: { weekIndex: number; dayOfWeek: number };
    }
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateBudget: (val: number) => Promise<void>;
  addMemberToHousehold: (email: string) => Promise<void>;
  importData: (data: { transactions: any[], subscriptions?: any[] }) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewScope, setViewScope] = useState<ViewScope>('User');

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setHousehold(null);
      setTransactions([]);
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userId = user.uid;

    const userDocRef = doc(db, 'users', userId);
    const unsubUser = onSnapshot(userDocRef, async (snapshot) => {
      if (snapshot.exists()) {
        const profileData = snapshot.data() as UserProfile;
        setProfile(profileData);
        
        if (profileData.householdId) {
          const hhRef = doc(db, 'households', profileData.householdId);
          const hhSnap = await getDoc(hhRef);
          if (hhSnap.exists()) {
            setHousehold({ id: hhSnap.id, ...hhSnap.data() } as Household);
          } else {
            const householdId = profileData.householdId;
            await setDoc(doc(db, 'households', householdId), {
              name: `${user.displayName || 'My'} Home`,
              memberUids: [userId],
              ownerUid: userId,
              createdAt: new Date().toISOString()
            });
          }
        } else {
          const householdId = userId;
          const batch = writeBatch(db);
          batch.update(userDocRef, { householdId });
          batch.set(doc(db, 'households', householdId), {
            name: `${user.displayName || 'My'} Home`,
            memberUids: [userId],
            ownerUid: userId,
            createdAt: new Date().toISOString()
          });
          await batch.commit();
        }
      } else {
        const batch = writeBatch(db);
        const householdId = userId;
        const newProfile = {
          email: user.email || '',
          monthlyLimit: 2000,
          householdId: householdId,
          createdAt: new Date().toISOString()
        };
        batch.set(userDocRef, newProfile);
        batch.set(doc(db, 'households', householdId), {
          name: `${user.displayName || 'My'} Home`,
          memberUids: [userId],
          ownerUid: userId,
          createdAt: new Date().toISOString()
        });
        await batch.commit();
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${userId}`));

    return () => unsubUser();
  }, [user]);

  useEffect(() => {
    if (!user || !profile) return;

    let transQuery;
    let subsQuery;

    if (viewScope === 'Household' && profile.householdId) {
      transQuery = query(collectionGroup(db, 'transactions'), where('householdId', '==', profile.householdId), orderBy('date', 'desc'));
      subsQuery = query(collectionGroup(db, 'subscriptions'), where('householdId', '==', profile.householdId));
    } else {
      transQuery = query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
      subsQuery = collection(db, 'users', user.uid, 'subscriptions');
    }

    const unsubTrans = onSnapshot(transQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(list);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    const unsubSub = onSnapshot(subsQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subscription));
      setSubscriptions(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'subscriptions'));

    return () => {
      unsubTrans();
      unsubSub();
    };
  }, [user, profile, viewScope]);

  const saveTransaction = useCallback(async (
    t: Omit<Transaction, 'id' | 'date' | 'userId' | 'householdId'>, 
    date: string, 
    isRecurring: boolean, 
    editingId?: string,
    recurringOptions?: {
      frequency: number;
      recurrenceType: RecurrenceType;
      weekdayConfig?: { weekIndex: number; dayOfWeek: number };
    }
  ) => {
    if (!user || !profile) return;
    const userId = user.uid;
    const batch = writeBatch(db);

    try {
      let subId: string | undefined;
      const transDate = new Date(date);

      const subData: any = {
        description: t.description,
        vendor: t.vendor,
        amount: t.amount,
        category: t.category,
        active: true,
        frequency: recurringOptions?.frequency || 1,
        recurrenceType: recurringOptions?.recurrenceType || RecurrenceType.MonthDay,
        userId: userId,
        householdId: profile.householdId
      };

      if (subData.recurrenceType === RecurrenceType.MonthDay) {
        subData.dayOfMonth = transDate.getDate();
      } else if (recurringOptions?.weekdayConfig) {
        subData.weekdayConfig = recurringOptions.weekdayConfig;
      }

      const transactionPayload = {
        ...t,
        date,
        userId,
        householdId: profile.householdId
      };

      if (editingId) {
        const existingTrans = transactions.find(tr => tr.id === editingId);
        if (!existingTrans) throw new Error("Transaction not found");
        subId = existingTrans.subscriptionId;

        if (isRecurring && !subId) {
          subId = doc(collection(db, 'placeholder')).id;
          const subRef = doc(db, 'users', userId, 'subscriptions', subId);
          batch.set(subRef, subData);
        } else if (!isRecurring && subId) {
          batch.delete(doc(db, 'users', userId, 'subscriptions', subId));
          subId = undefined;
        } else if (isRecurring && subId) {
          batch.update(doc(db, 'users', userId, 'subscriptions', subId), subData);
        }

        batch.update(doc(db, 'users', userId, 'transactions', editingId), { 
          ...transactionPayload, 
          subscriptionId: subId || null 
        });
      } else {
        const transId = doc(collection(db, 'placeholder')).id;
        const newSubId = isRecurring ? doc(collection(db, 'placeholder')).id : undefined;

        batch.set(doc(db, 'users', userId, 'transactions', transId), {
          ...transactionPayload,
          subscriptionId: newSubId || null
        });

        if (isRecurring && newSubId) {
          batch.set(doc(db, 'users', userId, 'subscriptions', newSubId), subData);
        }
      }

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/transactions`);
    }
  }, [user, profile, transactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) return;
    const trans = transactions.find(t => t.id === id);
    if (!trans) return;

    try {
      await deleteDoc(doc(db, 'users', trans.userId, 'transactions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${trans.userId}/transactions/${id}`);
    }
  }, [user, transactions]);

  const updateBudget = useCallback(async (val: number) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { monthlyLimit: val });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  }, [user]);

  const addMemberToHousehold = useCallback(async (email: string) => {
    if (!user || !profile || !household) return;
    const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("User not found with that email.");
    const targetUser = snap.docs[0];
    const targetUid = targetUser.id;
    if (household.memberUids.includes(targetUid)) throw new Error("User already in household.");
    const batch = writeBatch(db);
    batch.update(doc(db, 'households', household.id), { memberUids: arrayUnion(targetUid) });
    batch.update(doc(db, 'users', targetUid), { householdId: household.id });
    await batch.commit();
  }, [user, profile, household]);

  const importData = useCallback(async (data: { transactions: any[], subscriptions?: any[] }) => {
    if (!user || !profile) return;
    const userId = user.uid;
    const householdId = profile.householdId;
    const batch = writeBatch(db);
    if (data.transactions && Array.isArray(data.transactions)) {
      data.transactions.forEach(t => {
        const transId = doc(collection(db, 'placeholder')).id;
        batch.set(doc(db, 'users', userId, 'transactions', transId), {
          description: t.description || 'Imported Transaction',
          vendor: t.vendor || 'Unknown',
          amount: Number(t.amount) || 0,
          category: t.category || Category.Other,
          date: t.date || new Date().toISOString(),
          userId,
          householdId,
          subscriptionId: t.subscriptionId || null
        });
      });
    }
    if (data.subscriptions && Array.isArray(data.subscriptions)) {
      data.subscriptions.forEach(s => {
        const subId = doc(collection(db, 'placeholder')).id;
        batch.set(doc(db, 'users', userId, 'subscriptions', subId), { ...s, userId, householdId });
      });
    }
    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/import`);
    }
  }, [user, profile]);

  const proposedSubscriptions = useMemo(() => {
    const now = new Date();
    return subscriptions.filter(sub => {
      if (!sub.active) return false;
      const latestTransaction = [...transactions]
        .filter(t => t.subscriptionId === sub.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (!latestTransaction) return true;
      const monthsSince = differenceInMonths(now, new Date(latestTransaction.date));
      const isDueFrequency = monthsSince >= (sub.frequency || 1);
      const isAlreadyLoggedThisMonth = isSameMonth(new Date(latestTransaction.date), now);
      return isDueFrequency && !isAlreadyLoggedThisMonth;
    });
  }, [subscriptions, transactions]);

  const currentBudget = useMemo(() => {
    return profile?.monthlyLimit || 2000;
  }, [profile]);

  const value = {
    transactions,
    subscriptions,
    budget: currentBudget,
    loading,
    proposedSubscriptions,
    viewScope,
    setViewScope,
    profile,
    household,
    saveTransaction,
    deleteTransaction,
    updateBudget,
    addMemberToHousehold,
    importData
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};
