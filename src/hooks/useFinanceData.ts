
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
  updateDoc,
  collectionGroup,
  where,
  getDoc,
  getDocs,
  limit,
  arrayUnion
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { Transaction, Subscription, Category, RecurrenceType, UserProfile, Household } from '../types';
import { isSameMonth, getWeeksInMonth, getWeekOfMonth, getDay, getDate, format, differenceInMonths } from 'date-fns';
import { User } from 'firebase/auth';

export type ViewScope = 'User' | 'Household';

export function getRecurrenceLabel(date: Date) {
  const dayName = format(date, 'EEEE');
  const dayOfMonth = getDate(date);
  const weekIndex = Math.ceil(dayOfMonth / 7);
  const weekNames = ['first', 'second', 'third', 'fourth', 'fifth'];
  
  // Check if it's the last one
  const nextWeekSameDay = new Date(date);
  nextWeekSameDay.setDate(dayOfMonth + 7);
  const isLast = nextWeekSameDay.getMonth() !== date.getMonth();
  
  const ordinal = isLast ? 'last' : weekNames[weekIndex - 1];
  return {
    dayLabel: `${dayOfMonth}${getOrdinalSuffix(dayOfMonth)} of every month`,
    weekLabel: `the ${ordinal} ${dayName} of every month`,
    weekIndex: isLast ? -1 : weekIndex,
    dayOfWeek: getDay(date)
  };
}

function getOrdinalSuffix(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function useFinanceData(user: User | null) {
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

    // Sync Profile & Household
    const userDocRef = doc(db, 'users', userId);
    const unsubUser = onSnapshot(userDocRef, async (snapshot) => {
      if (snapshot.exists()) {
        const profileData = snapshot.data() as UserProfile;
        setProfile(profileData);
        
        // Fetch/Initialize Household
        if (profileData.householdId) {
          const hhRef = doc(db, 'households', profileData.householdId);
          const hhSnap = await getDoc(hhRef);
          if (hhSnap.exists()) {
            setHousehold({ id: hhSnap.id, ...hhSnap.data() } as Household);
          } else {
            // Household document missing, create one
            const householdId = profileData.householdId;
            await setDoc(doc(db, 'households', householdId), {
              name: `${user.displayName || 'My'} Home`,
              memberUids: [userId],
              ownerUid: userId,
              createdAt: new Date().toISOString()
            });
          }
        } else {
          // Retrofit for existing users without householdId
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
        // Initialize new user profile and household
        const batch = writeBatch(db);
        const householdId = userId; // Default household ID same as UID
        
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

    return () => {
      unsubUser();
    };
  }, [user]);

  // Sync Data based on scope
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

  const saveTransaction = async (
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
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    const trans = transactions.find(t => t.id === id);
    if (!trans) return;

    try {
      // Subcollection delete
      await deleteDoc(doc(db, 'users', trans.userId, 'transactions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${trans.userId}/transactions/${id}`);
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

  const addMemberToHousehold = async (email: string) => {
    if (!user || !profile || !household) return;
    
    // 1. Find user by email
    const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()), limit(1));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      throw new Error("User not found with that email.");
    }
    
    const targetUser = snap.docs[0];
    const targetUid = targetUser.id;
    
    if (household.memberUids.includes(targetUid)) {
      throw new Error("User already in household.");
    }

    const batch = writeBatch(db);
    
    // 2. Update household members
    batch.update(doc(db, 'households', household.id), {
      memberUids: arrayUnion(targetUid)
    });
    
    // 3. Update target user's householdId
    batch.update(doc(db, 'users', targetUid), {
      householdId: household.id
    });
    
    await batch.commit();
  };

  const importData = async (data: { transactions: any[], subscriptions?: any[] }) => {
    if (!user || !profile) return;
    const userId = user.uid;
    const householdId = profile.householdId;
    const batch = writeBatch(db);

    // Import Transactions
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

    // Import Subscriptions if present
    if (data.subscriptions && Array.isArray(data.subscriptions)) {
      data.subscriptions.forEach(s => {
        const subId = doc(collection(db, 'placeholder')).id;
        batch.set(doc(db, 'users', userId, 'subscriptions', subId), {
          ...s,
          userId,
          householdId,
        });
      });
    }

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/import`);
    }
  };

  const proposedSubscriptions = useMemo(() => {
    const now = new Date();
    return subscriptions.filter(sub => {
      if (!sub.active) return false;

      const latestTransaction = [...transactions]
        .filter(t => t.subscriptionId === sub.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (!latestTransaction) {
        return true;
      }

      const monthsSince = differenceInMonths(now, new Date(latestTransaction.date));
      const isDueFrequency = monthsSince >= (sub.frequency || 1);
      const isAlreadyLoggedThisMonth = isSameMonth(new Date(latestTransaction.date), now);

      return isDueFrequency && !isAlreadyLoggedThisMonth;
    });
  }, [subscriptions, transactions]);

  const householdBudget = useMemo(() => {
    // Household budget might be sum of member limits or fixed. 
    // Let's assume sum for now if we know member limits, but we only have current user.
    // For MVP, just return user's or a default.
    return profile?.monthlyLimit || 2000;
  }, [profile]);

  return {
    transactions,
    subscriptions,
    budget: viewScope === 'Household' ? householdBudget : (profile?.monthlyLimit || 2000),
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
}
