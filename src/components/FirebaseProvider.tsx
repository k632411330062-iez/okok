import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useFinanceStore } from '../store/useFinanceStore';
import { firebaseProvider, demoProvider } from '../lib/dataProvider';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { 
    appMode, 
    setAppMode, 
    setTransactions, 
    setGoals, 
    setSimulationState,
    transactions,
    incomeGoal,
    expenseLimit,
    simBalances,
    simInvestments,
    simMonth
  } = useFinanceStore();

  // 1. Handle Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      
      if (u) {
        setAppMode('real');
      } else {
        // Clear demo data on start/logout to ensure fresh demo every time
        demoProvider.resetData();
        setAppMode('landing');
      }
    });
    return unsubscribe;
  }, [setAppMode]);

  // 2. Load Initial Data when Mode changes
  useEffect(() => {
    const loadData = async () => {
      if (appMode === 'demo') {
        const data = await demoProvider.getData();
        setTransactions(data.transactions);
        setGoals(data.incomeGoal, data.expenseLimit);
        setSimulationState(data.simBalances, data.simInvestments, data.simMonth);
      } else if (appMode === 'real' && user) {
        const data = await firebaseProvider.getData(user.uid);
        setTransactions(data.transactions);
        setGoals(data.incomeGoal, data.expenseLimit);
        setSimulationState(data.simBalances, data.simInvestments, data.simMonth);
      }
    };
    
    if (appMode !== 'landing') {
      loadData();
    }
  }, [appMode, user, setTransactions, setGoals, setSimulationState]);

  // 3. Sync changes back to providers
  // We should be careful about which triggers what.
  // Ideally, actions in the store should trigger the provider updates.
  // But for the sake of strict data layer separation requested, 
  // we can use effects or wrap the store actions.
  
  // Actually, let's wrap the store actions in useFinanceStore to also call providers.
  // But for now, let's just make sure the landing page triggers the correct initial load.

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
