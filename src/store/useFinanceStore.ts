import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { getDateRange, TimePeriod } from '../lib/dateUtils';
import { generateMockTransactions } from '../lib/mockData';
import { demoProvider, firebaseProvider } from '../lib/dataProvider';
import { auth } from '../lib/firebase';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  paymentMethod: string;
}

interface FinanceState {
  appMode: 'landing' | 'demo' | 'real';
  setAppMode: (mode: 'landing' | 'demo' | 'real') => void;
  setTransactions: (transactions: Transaction[]) => void;
  setGoals: (income: number, expense: number) => void;
  setSimulationState: (balances: Record<string, number>, investments: Record<string, {amount: number, month: number}[]>, month: number) => void;
  
  transactions: Transaction[];
  selectedPeriod: TimePeriod;
  selectedDate: Date; // base date for month/quarter/year
  startDate: Date;
  endDate: Date;
  
  // Actions
  setPeriod: (period: TimePeriod) => void;
  setDate: (date: Date) => void;
  setCustomRange: (start: Date, end: Date) => void;
  resetCustomRange: () => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  incomeGoal: number;
  setIncomeGoal: (goal: number) => void;
  expenseLimit: number;
  setExpenseLimit: (limit: number) => void;

  // Simulation state
  simBalances: Record<string, number>;
  simInvestments: Record<string, {amount: number, month: number}[]>;
  simMonth: number;
  setSimBalances: (balances: Record<string, number>) => void;
  updateSimBalance: (key: string, amount: number) => void;
  incrementSimMonth: (cashFlow: number) => void;
  withdrawAsset: (key: string, currentValue: number) => void;
  addCash: (amount: number) => void;
  resetSim: (initialAssets: number) => void;
}

const mockTransactions: Transaction[] = generateMockTransactions();

const syncToProvider = async (state: FinanceState, partial: any = {}) => {
  const { appMode } = state;
  const data = {
    transactions: state.transactions,
    incomeGoal: state.incomeGoal,
    expenseLimit: state.expenseLimit,
    simBalances: state.simBalances,
    simInvestments: state.simInvestments,
    simMonth: state.simMonth,
    ...partial
  };

  if (appMode === 'demo') {
    await demoProvider.saveData(data);
  } else if (appMode === 'real' && auth.currentUser) {
    await firebaseProvider.saveData(auth.currentUser.uid, data);
  }
};

const adjustSimBalancesAndInvestments = (
  balances: Record<string, number>,
  investments: Record<string, {amount: number, month: number}[]>,
  transactions: Transaction[],
  simMonth: number
) => {
  if (simMonth !== 0) return { balances, investments };

  const endOfMay2026 = '2026-05-31';
  const totalAssets = transactions
    .filter(tx => tx.date <= endOfMay2026)
    .reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

  const otherAssets = (balances.stock || 0) + (balances.gold || 0) + (balances.savings || 0) + (balances.usd || 0);
  const correctedCash = Math.max(0, totalAssets - otherAssets);

  const nextBalances = {
    ...balances,
    cash: correctedCash
  };

  const nextInvestments = { ...investments };
  if (!nextInvestments.cash || nextInvestments.cash.length <= 1) {
    nextInvestments.cash = [{ amount: correctedCash, month: 0 }];
  }

  return { balances: nextBalances, investments: nextInvestments };
};

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      appMode: 'landing',
      setAppMode: (mode) => set({ appMode: mode }),
      setTransactions: (transactions) => set((state) => {
        const { balances, investments } = adjustSimBalancesAndInvestments(
          state.simBalances,
          state.simInvestments,
          transactions,
          state.simMonth
        );
        return { 
          transactions,
          simBalances: balances,
          simInvestments: investments
        };
      }),
      setGoals: (income, expense) => set({ incomeGoal: income, expenseLimit: expense }),
      setSimulationState: (balances, investments, month) => set((state) => {
        const adjusted = adjustSimBalancesAndInvestments(
          balances,
          investments,
          state.transactions,
          month
        );
        return {
          simBalances: adjusted.balances,
          simInvestments: adjusted.investments,
          simMonth: month
        };
      }),

      transactions: [], // Initialize empty
      selectedPeriod: 'month',
      selectedDate: new Date(2026, 4, 1),
      startDate: getDateRange('month', new Date(2026, 4, 1)).start,
      endDate: getDateRange('month', new Date(2026, 4, 1)).end,
      
      setPeriod: (period) => {
        const { selectedDate, startDate, endDate } = get();
        const newRange = getDateRange(period, selectedDate, startDate, endDate);
        set({ selectedPeriod: period, startDate: newRange.start, endDate: newRange.end });
      },
      
      setDate: (date) => {
        const { selectedPeriod } = get();
        const newRange = getDateRange(selectedPeriod, date);
        set({ selectedDate: date, startDate: newRange.start, endDate: newRange.end });
      },
      
      setCustomRange: (start, end) => {
        set({ startDate: start, endDate: end, selectedPeriod: 'custom' });
      },

      resetCustomRange: () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 1);
        set({ startDate: start, endDate: today, selectedPeriod: 'custom' });
      },
      
      addTransaction: (transaction) => {
        const newTx = { ...transaction, id: uuidv4() };
        set((state) => {
          const nextTransactions = [newTx, ...state.transactions];
          const { balances, investments } = adjustSimBalancesAndInvestments(
            state.simBalances,
            state.simInvestments,
            nextTransactions,
            state.simMonth
          );
          const newState = { 
            transactions: nextTransactions,
            simBalances: balances,
            simInvestments: investments
          };
          syncToProvider({ ...state, ...newState });
          if (state.appMode === 'real' && auth.currentUser) {
             firebaseProvider.updateTransaction(auth.currentUser.uid, newTx);
          }
          return newState;
        });
      },
      
      updateTransaction: (id, updatedTx) => {
        set((state) => {
          const newTransactions = state.transactions.map(tx => tx.id === id ? { ...tx, ...updatedTx } : tx);
          const { balances, investments } = adjustSimBalancesAndInvestments(
            state.simBalances,
            state.simInvestments,
            newTransactions,
            state.simMonth
          );
          const newState = { 
            transactions: newTransactions,
            simBalances: balances,
            simInvestments: investments
          };
          syncToProvider({ ...state, ...newState });
          if (state.appMode === 'real' && auth.currentUser) {
             const tx = newTransactions.find(t => t.id === id);
             if (tx) firebaseProvider.updateTransaction(auth.currentUser.uid, tx);
          }
          return newState;
        });
      },
      
      deleteTransaction: (id) => {
        set((state) => {
          const newTransactions = state.transactions.filter(tx => tx.id !== id);
          const { balances, investments } = adjustSimBalancesAndInvestments(
            state.simBalances,
            state.simInvestments,
            newTransactions,
            state.simMonth
          );
          const newState = { 
            transactions: newTransactions,
            simBalances: balances,
            simInvestments: investments
          };
          syncToProvider({ ...state, ...newState });
          if (state.appMode === 'real' && auth.currentUser) {
             firebaseProvider.deleteTransaction(auth.currentUser.uid, id);
          }
          return newState;
        });
      },
      incomeGoal: 32000000,
      setIncomeGoal: (goal) => {
        set({ incomeGoal: goal });
        syncToProvider(get(), { incomeGoal: goal });
      },
      expenseLimit: 22000000,
      setExpenseLimit: (limit) => {
        set({ expenseLimit: limit });
        syncToProvider(get(), { expenseLimit: limit });
      },

      // Simulation implementation
      simBalances: {},
      simInvestments: {},
      simMonth: 0,
      setSimBalances: (balances) => {
        set((state) => {
          const adjusted = adjustSimBalancesAndInvestments(
            balances,
            state.simInvestments,
            state.transactions,
            state.simMonth
          );
          const newState = { 
            simBalances: adjusted.balances,
            simInvestments: adjusted.investments
          };
          syncToProvider(state, newState);
          return newState;
        });
      },
      updateSimBalance: (key, amount) => set((state) => {
        const currentAmount = state.simBalances[key] || 0;
        const currentCash = state.simBalances.cash || 0;
        
        let actualAmount = Math.max(0, amount);
        let diff = actualAmount - currentAmount;
        
        // Cannot allocate more than available cash
        if (diff > currentCash) {
            diff = currentCash;
            actualAmount = currentAmount + diff;
        }

        const newInvestments = { ...state.simInvestments };
        
        // Track the transfer from cash to category
        if (diff !== 0) {
           newInvestments['cash'] = [...(newInvestments['cash'] || []), { amount: -diff, month: state.simMonth }];
           newInvestments[key] = [...(newInvestments[key] || []), { amount: diff, month: state.simMonth }];
        }
        
        const nextBalances = {
            ...state.simBalances,
            [key]: actualAmount,
            cash: currentCash - diff
        };
        
        const adjusted = adjustSimBalancesAndInvestments(
          nextBalances,
          newInvestments,
          state.transactions,
          state.simMonth
        );
        
        const newState = {
            simBalances: adjusted.balances,
            simInvestments: adjusted.investments
        };
        
        syncToProvider({ ...state, ...newState });
        return newState;
      }),
      incrementSimMonth: (cashFlow) => set((state) => {
        const newBalances = { ...state.simBalances };
        newBalances.cash = (newBalances.cash || 0) + cashFlow;
        
        const newInvestments = { ...state.simInvestments };
        newInvestments['cash'] = [...(newInvestments['cash'] || []), { amount: cashFlow, month: state.simMonth }];

        const newState = {
            simBalances: newBalances,
            simInvestments: newInvestments,
            simMonth: state.simMonth + 1
        };
        syncToProvider({ ...state, ...newState });
        return newState;
      }),
      withdrawAsset: (key, currentValue) => set((state) => {
        const newBalances = { ...state.simBalances };
        const newInvestments = { ...state.simInvestments };
        
        // 1. Reset the asset in balances
        newBalances[key] = 0;
        
        // 2. Add the current value to cash balance
        newBalances.cash = (newBalances.cash || 0) + currentValue;
        
        // 3. Reset the asset's investment history
        newInvestments[key] = [];
        
        // 4. Record the cash inflow in cash history at the current simulation month
        newInvestments['cash'] = [...(newInvestments['cash'] || []), { amount: currentValue, month: state.simMonth }];
        
        const newState = {
          simBalances: newBalances,
          simInvestments: newInvestments
        };
        syncToProvider({ ...state, ...newState });
        return newState;
      }),
      addCash: (amount) => set((state) => {
        const newBalances = { ...state.simBalances };
        const newInvestments = { ...state.simInvestments };
        
        newBalances.cash = (newBalances.cash || 0) + amount;
        newInvestments['cash'] = [...(newInvestments['cash'] || []), { amount, month: state.simMonth }];
        
        const newState = {
          simBalances: newBalances,
          simInvestments: newInvestments
        };
        syncToProvider({ ...state, ...newState });
        return newState;
      }),
      resetSim: (initialAssets) => {
        set((state) => {
          const endOfMay2026 = '2026-05-31';
          const accurateAssets = state.transactions
            .filter(tx => tx.date <= endOfMay2026)
            .reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
          const initial: Record<string, number> = {
            stock: 0,
            gold: 0,
            savings: 0,
            usd: 0,
            cash: accurateAssets,
          };
          const initialInvs: Record<string, {amount: number, month: number}[]> = {
            cash: [{ amount: accurateAssets, month: 0 }],
            stock: [],
            gold: [],
            savings: [],
            usd: []
          };
          const newState = { simBalances: initial, simInvestments: initialInvs, simMonth: 0 };
          syncToProvider(state, newState);
          return newState;
        });
      },
    }),
    {
      name: 'finvest-storage-v6',
      // Serialize/Deserialize dates
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          if (data.state) {
            data.state.selectedDate = new Date(data.state.selectedDate);
            data.state.startDate = new Date(data.state.startDate);
            data.state.endDate = new Date(data.state.endDate);
          }
          return data;
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => {
        const { appMode, ...rest } = state;
        // Don't persist appMode, it should always start at landing or be recovered from auth
        return rest as any;
      },
    }
  )
);

