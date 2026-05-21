import { db, OperationType, handleFirestoreError } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { Transaction } from '../store/useFinanceStore';
import { generateMockTransactions } from './mockData';

export interface AppData {
  transactions: Transaction[];
  incomeGoal: number;
  expenseLimit: number;
  simBalances: Record<string, number>;
  simInvestments: Record<string, {amount: number, month: number}[]>;
  simMonth: number;
}

const DEMO_STORAGE_KEY = 'finvest-demo-data';

const getInitialDemoData = (): AppData => {
  return {
    transactions: generateMockTransactions(),
    incomeGoal: 32000000,
    expenseLimit: 22000000,
    simBalances: {
      stock: 0,
      gold: 0,
      savings: 0,
      usd: 0,
      cash: 50000000, // example initial cash
    },
    simInvestments: {
      cash: [{ amount: 50000000, month: 0 }],
      stock: [],
      gold: [],
      savings: [],
      usd: []
    },
    simMonth: 0
  };
};

const getEmptyRealData = (): AppData => ({
  transactions: [],
  incomeGoal: 0,
  expenseLimit: 0,
  simBalances: {
    stock: 0,
    gold: 0,
    savings: 0,
    usd: 0,
    cash: 0
  },
  simInvestments: {
    cash: [],
    stock: [],
    gold: [],
    savings: [],
    usd: []
  },
  simMonth: 0
});

export const demoProvider = {
  async getData(): Promise<AppData> {
    const stored = sessionStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    const initial = getInitialDemoData();
    sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  },
  async saveData(data: AppData) {
    sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
  },
  async updateData(partial: Partial<AppData>) {
    const current = await this.getData();
    const updated = { ...current, ...partial };
    sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(updated));
  },
  async resetData() {
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
  }
};

export const firebaseProvider = {
  async getData(userId: string): Promise<AppData> {
    const path = `users/${userId}`;
    try {
      const userDoc = await getDoc(doc(db, path));
      
      const transactionsPath = `users/${userId}/transactions`;
      const txSnapshot = await getDocs(collection(db, transactionsPath));
      const transactions = txSnapshot.docs.map(d => ({ ...d.data(), id: d.id } as Transaction));

      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          transactions,
          incomeGoal: data.incomeGoal || 0,
          expenseLimit: data.expenseLimit || 0,
          simBalances: data.simBalances || {},
          simInvestments: data.simInvestments || {},
          simMonth: data.simMonth || 0
        };
      } else {
        const empty = getEmptyRealData();
        // Initialize the user doc
        await setDoc(doc(db, path), {
          incomeGoal: empty.incomeGoal,
          expenseLimit: empty.expenseLimit,
          simBalances: empty.simBalances,
          simInvestments: empty.simInvestments,
          simMonth: empty.simMonth
        });
        return empty;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      throw error;
    }
  },

  async saveData(userId: string, data: AppData) {
    const path = `users/${userId}`;
    try {
      // For simplicity in this demo, we'll save the settings doc
      await setDoc(doc(db, path), {
        incomeGoal: data.incomeGoal,
        expenseLimit: data.expenseLimit,
        simBalances: data.simBalances,
        simInvestments: data.simInvestments,
        simMonth: data.simMonth
      });
      
      // Transactions are usually managed individually via add/update actions
      // but if we need a full save:
      // (This is expensive, usually we'd only sync changed items)
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateTransaction(userId: string, transaction: Transaction) {
    const path = `users/${userId}/transactions/${transaction.id}`;
    try {
      await setDoc(doc(db, path), transaction);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteTransaction(userId: string, transactionId: string) {
    const path = `users/${userId}/transactions/${transactionId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
