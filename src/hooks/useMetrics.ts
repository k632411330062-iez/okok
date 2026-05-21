import { useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { 
  isWithinInterval, startOfDay, endOfDay, parseISO,
  subMonths, subQuarters, subYears, 
  startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear,
  differenceInDays
} from 'date-fns';

export function useFilteredData() {
  const { transactions, startDate, endDate } = useFinanceStore();

  const filteredTransactions = useMemo(() => {
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    
    return transactions.filter(tx => {
      const txDate = parseISO(tx.date);
      return isWithinInterval(txDate, { start, end });
    });
  }, [transactions, startDate, endDate]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactions]);

  const netCashFlow = totalIncome - totalExpense;
  
  const totalAssets = useMemo(() => {
    // Assets are cumulative total income - total expense from the beginning of recorded transactions
    // up to the end of the currently selected period.
    return transactions
      .filter(tx => parseISO(tx.date) <= endOfDay(endDate))
      .reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
  }, [transactions, endDate]);

  return {
    filteredTransactions,
    totalIncome,
    totalExpense,
    netCashFlow,
    totalAssets,
  };
}

export function useTrends() {
  const { transactions, startDate, endDate, selectedPeriod, selectedDate } = useFinanceStore();

  return useMemo(() => {
    // Current period
    const currentStart = startOfDay(startDate);
    const currentEnd = endOfDay(endDate);
    const currentTxs = transactions.filter(tx => {
      const d = parseISO(tx.date);
      return isWithinInterval(d, { start: currentStart, end: currentEnd });
    });

    const currentIncome = currentTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const currentExpense = currentTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const currentNet = currentIncome - currentExpense;

    // Previous period determination
    let prevStart: Date;
    let prevEnd: Date;

    if (selectedPeriod === 'month') {
      prevStart = startOfMonth(subMonths(selectedDate, 1));
      prevEnd = endOfMonth(subMonths(selectedDate, 1));
    } else if (selectedPeriod === 'quarter') {
      prevStart = startOfQuarter(subQuarters(selectedDate, 1));
      prevEnd = endOfQuarter(subQuarters(selectedDate, 1));
    } else if (selectedPeriod === 'year') {
      prevStart = startOfYear(subYears(selectedDate, 1));
      prevEnd = endOfYear(subYears(selectedDate, 1));
    } else {
      const duration = currentEnd.getTime() - currentStart.getTime();
      prevEnd = new Date(currentStart.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - duration);
    }

    const prevTxs = transactions.filter(tx => {
      const d = parseISO(tx.date);
      return isWithinInterval(d, { start: prevStart, end: prevEnd });
    });

    const prevIncome = prevTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const prevExpense = prevTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const prevNet = prevIncome - prevExpense;

    const calcGrowth = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return ((current - prev) / prev) * 100;
    };

    const daysInCurrent = Math.max(1, differenceInDays(currentEnd, currentStart) + 1);
    const daysInPrev = Math.max(1, differenceInDays(prevEnd, prevStart) + 1);

    const currentDailyIncome = currentIncome / daysInCurrent;
    const prevDailyIncome = prevIncome / daysInPrev;
    const currentDailyExpense = currentExpense / daysInCurrent;
    const prevDailyExpense = prevExpense / daysInPrev;

    // Asset Growth (Cumulative through time)
    const currentAssets = transactions
      .filter(tx => parseISO(tx.date) <= currentEnd)
      .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    const prevAssets = transactions
      .filter(tx => parseISO(tx.date) <= prevEnd)
      .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

    return {
      currentTxs,
      prevTxs,
      currentIncome,
      currentExpense,
      currentNet,
      prevIncome,
      prevExpense,
      prevNet,
      incomeGrowth: parseFloat(calcGrowth(currentIncome, prevIncome).toFixed(1)),
      expenseGrowth: parseFloat(calcGrowth(currentExpense, prevExpense).toFixed(1)),
      cashflowGrowth: parseFloat(calcGrowth(currentNet, prevNet).toFixed(1)),
      dailyIncomeGrowth: parseFloat(calcGrowth(currentDailyIncome, prevDailyIncome).toFixed(1)),
      dailyExpenseGrowth: parseFloat(calcGrowth(currentDailyExpense, prevDailyExpense).toFixed(1)),
      assetsGrowth: parseFloat(calcGrowth(currentAssets, prevAssets).toFixed(1)),
      remainingGoal: 32000000 - currentIncome
    };
  }, [transactions, startDate, endDate, selectedPeriod, selectedDate]);
}

export function formatCurrency(amount: number) {
  const formatOptions = { minimumFractionDigits: 0, maximumFractionDigits: 2 };
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toLocaleString('vi-VN', formatOptions)} tỷ VNĐ`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toLocaleString('vi-VN', formatOptions)} triệu VNĐ`;
  }
  return amount.toLocaleString('vi-VN', formatOptions) + ' VNĐ';
}
