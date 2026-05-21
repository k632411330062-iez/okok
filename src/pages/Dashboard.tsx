import { Header } from "../components/Header";
import { useFilteredData, formatCurrency, useTrends } from "../hooks/useMetrics";
import { Wallet, TrendingUp, TrendingDown, ArrowRightLeft, Bot, Plus, PieChart as LucidePieChart, Search, Filter, ArrowRight, Briefcase, Coffee, ShoppingBag, PiggyBank, Bus, Gamepad2, LayoutDashboard, BarChart3, History, WalletMinimal, Check, ChevronRight } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { useFinanceStore, TransactionType } from "../store/useFinanceStore";
import { TransactionModal } from "../components/TransactionModal";
import { format, parseISO, getMonth, isAfter, subDays } from "date-fns";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const COLORS = ['#00f5ff', '#00ff9d', '#ff3068', '#ffd700', '#8b5cf6', '#f59e0b'];

const getTxStyle = (category: string, type: 'income' | 'expense') => {
  const cat = category.toLowerCase();
  if (type === 'income') {
    if (cat.includes('lương')) return { icon: Briefcase, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20', dotClass: 'bg-emerald-400' };
    if (cat.includes('freelance') || cat.includes('dự án')) return { icon: TrendingUp, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20', dotClass: 'bg-emerald-400' };
    return { icon: Wallet, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20', dotClass: 'bg-emerald-400' };
  } else {
    if (cat.includes('ăn uống') || cat.includes('cà phê')) return { icon: Coffee, colorClass: 'text-rose-400', bgClass: 'bg-rose-500/10', borderClass: 'border-rose-500/20', dotClass: 'bg-rose-400' };
    if (cat.includes('mua sắm')) return { icon: ShoppingBag, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/20', dotClass: 'bg-blue-400' };
    if (cat.includes('tiết kiệm')) return { icon: PiggyBank, colorClass: 'text-indigo-400', bgClass: 'bg-indigo-500/10', borderClass: 'border-indigo-500/20', dotClass: 'bg-indigo-400' };
    if (cat.includes('đi lại')) return { icon: Bus, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20', dotClass: 'bg-amber-400' };
    if (cat.includes('giải trí')) return { icon: Gamepad2, colorClass: 'text-fuchsia-400', bgClass: 'bg-fuchsia-500/10', borderClass: 'border-fuchsia-500/20', dotClass: 'bg-fuchsia-400' };
    return { icon: TrendingDown, colorClass: 'text-rose-400', bgClass: 'bg-rose-500/10', borderClass: 'border-rose-500/20', dotClass: 'bg-rose-400' };
  }
};



export default function Dashboard() {
  const { filteredTransactions, totalIncome, totalExpense, netCashFlow, totalAssets } = useFilteredData();
  const { transactions, selectedPeriod, endDate } = useFinanceStore();
  const { incomeGrowth, expenseGrowth, cashflowGrowth, assetsGrowth } = useTrends();
  const [modalType, setModalType] = useState<TransactionType | null>(null);
  const [activeIncomeName, setActiveIncomeName] = useState<string | null>(null);
  const [activeExpenseName, setActiveExpenseName] = useState<string | null>(null);
  const [recentTxType, setRecentTxType] = useState<'all' | 'income' | 'expense'>('all');
  const [recentTxSearch, setRecentTxSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'assets' | 'income' | 'expense' | 'cashflow' | null>(null);
  const navigate = useNavigate();

  const categories = useMemo(() => Array.from(new Set(filteredTransactions.map(t => t.category))), [filteredTransactions]);
  const paymentMethods = useMemo(() => Array.from(new Set(filteredTransactions.map(t => t.paymentMethod))), [filteredTransactions]);

  const trends = useMemo(() => {
    return {
      assets: assetsGrowth,
      income: incomeGrowth,
      expense: expenseGrowth,
      cashflow: cashflowGrowth
    };
  }, [assetsGrowth, incomeGrowth, expenseGrowth, cashflowGrowth]);

  // Prepare Bar chart data based on filtered transactions
  const chartData = useMemo(() => {
    const transactions = filteredTransactions;
    if (transactions.length === 0) return [];

    const data = [];
    
    // Helper to get start and end of current filtered range
    // Assume transactions are already filtered by period
    const minDate = Math.min(...transactions.map(tx => parseISO(tx.date).getTime()));
    const maxDate = Math.max(...transactions.map(tx => parseISO(tx.date).getTime()));
    const startRange = new Date(minDate);
    const endRange = new Date(maxDate);

    if (selectedPeriod === 'month') {
      // Group by weeks
      // Simplified: Find number of weeks in month
      const start = new Date(startRange.getFullYear(), startRange.getMonth(), 1);
      const end = new Date(startRange.getFullYear(), startRange.getMonth() + 1, 0);
      
      let current = new Date(start);
      let weekIdx = 1;
      
      while (current <= end) {
        let weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > end) weekEnd = end;
        
        const weekTxs = transactions.filter(tx => {
          const date = parseISO(tx.date);
          return date >= current && date <= weekEnd;
        });

        const income = weekTxs.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
        const expense = weekTxs.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
        data.push({
          name: `Tuần ${weekIdx}`,
          income: income,
          expense: expense,
          net: income - expense
        });
        
        current.setDate(current.getDate() + 7);
        weekIdx++;
      }
    } else if (selectedPeriod === 'quarter') {
      // Group by months
      let current = new Date(startRange.getFullYear(), Math.floor(startRange.getMonth() / 3) * 3, 1);
      const end = new Date(current.getFullYear(), current.getMonth() + 3, 0);

      while (current <= end) {
        const monthIndex = current.getMonth();
        const year = current.getFullYear();
        const monthTxs = transactions.filter(tx => {
          const d = parseISO(tx.date);
          return d.getMonth() === monthIndex && d.getFullYear() === year;
        });
        
        const income = monthTxs.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
        const expense = monthTxs.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
        data.push({
          name: `Tháng ${monthIndex + 1}`,
          income: income,
          expense: expense,
          net: income - expense
        });
        
        current.setMonth(current.getMonth() + 1);
      }
    } else if (selectedPeriod === 'year') {
      // Group by months T1-T12 for the selected year
      const targetYear = startRange.getFullYear();
      for (let i = 0; i < 12; i++) {
        const monthTxs = transactions.filter(tx => {
          const d = parseISO(tx.date);
          return d.getMonth() === i && d.getFullYear() === targetYear;
        });
        const income = monthTxs.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
        const expense = monthTxs.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
        data.push({
          name: `T${i + 1}`,
          income: income,
          expense: expense,
          net: income - expense
        });
      }
    } else { // custom
      // For custom, if range is > 60 days, group by month. Otherwise group by week.
      const diffTime = Math.abs(endRange.getTime() - startRange.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 60) {
        // Group by month
        let current = new Date(startRange.getFullYear(), startRange.getMonth(), 1);
        const end = new Date(endRange.getFullYear(), endRange.getMonth() + 1, 0);

        while (current <= end) {
          const monthIndex = current.getMonth();
          const year = current.getFullYear();
          const monthTxs = transactions.filter(tx => {
            const d = parseISO(tx.date);
            return d.getMonth() === monthIndex && d.getFullYear() === year;
          });
          
          const income = monthTxs.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
          const expense = monthTxs.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
          data.push({
            name: `T${monthIndex + 1}/${year.toString().slice(-2)}`,
            income: income,
            expense: expense,
            net: income - expense
          });
          
          current.setMonth(current.getMonth() + 1);
        }
      } else {
        // Group by week
        let current = new Date(startRange);
        
        let weekIdx = 1;
        while (current <= endRange) {
          let weekEnd = new Date(current);
          weekEnd.setDate(weekEnd.getDate() + 6);
          if (weekEnd > endRange) weekEnd = new Date(endRange);
          
          const weekTxs = transactions.filter(tx => {
            const date = parseISO(tx.date);
            // Ensure date is at midnight for accurate comparison
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const currentOnly = new Date(current.getFullYear(), current.getMonth(), current.getDate());
            const weekEndOnly = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59);
            return dateOnly >= currentOnly && date <= weekEndOnly;
          });

          const income = weekTxs.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
          const expense = weekTxs.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
          data.push({
            name: `Khoảng ${weekIdx}`,
            income: income,
            expense: expense,
            net: income - expense
          });
          
          current.setDate(current.getDate() + 7);
          weekIdx++;
        }
      }
    }
    
    return data;
  }, [filteredTransactions, selectedPeriod]);

  // Prepare Pie chart data for current filter
  const expenseByCategory = useMemo(() => filteredTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>), [filteredTransactions]);

  const pieData = useMemo(() => Object.entries(expenseByCategory).map(([name, value]) => ({ name, value: value as number })).sort((a,b) => b.value - a.value), [expenseByCategory]);

  const incomeByCategory = useMemo(() => filteredTransactions
    .filter(tx => tx.type === 'income')
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>), [filteredTransactions]);
    
  const incomeData = useMemo(() => Object.entries(incomeByCategory).map(([name, value]) => ({ name, value: value as number })).sort((a,b) => b.value - a.value), [incomeByCategory]);

  const comparisonLabel = useMemo(() => {
    switch (selectedPeriod) {
      case 'month': return 'tháng trước';
      case 'quarter': return 'quý trước';
      case 'year': return 'năm trước';
      default: return 'kỳ trước';
    }
  }, [selectedPeriod]);

  const activeIncomeItem = incomeData.find(d => d.name === activeIncomeName);
  const activeExpenseItem = pieData.find(d => d.name === activeExpenseName);

  const filteredRecentTransactions = useMemo(() => {
    return filteredTransactions.filter(tx => {
      if (recentTxType !== 'all' && tx.type !== recentTxType) return false;
      
      const matchesSearch = !recentTxSearch.trim() || 
                           tx.description.toLowerCase().includes(recentTxSearch.toLowerCase()) || 
                           tx.category.toLowerCase().includes(recentTxSearch.toLowerCase());
      
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(tx.category);
      const matchesMethod = selectedMethods.length === 0 || selectedMethods.includes(tx.paymentMethod);
      
      return matchesSearch && matchesCategory && matchesMethod;
    });
  }, [filteredTransactions, recentTxType, recentTxSearch, selectedCategories, selectedMethods]);

  const limitedTransactions = useMemo(() => {
    return filteredRecentTransactions.slice(0, 7);
  }, [filteredRecentTransactions]);

  const getCategoryBadgeStyles = (category: string) => {
    const cat = category.toLowerCase();
    
    // Vibrant Rainbow Palette - Extremely Distinct
    if (cat.includes('lương')) 
      return "bg-blue-600/25 border-blue-400/40 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.15)]";
    if (cat.includes('freelance') || cat.includes('dự án')) 
      return "bg-amber-600/25 border-amber-400/40 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
    if (cat.includes('đầu tư')) 
      return "bg-emerald-600/25 border-emerald-400/40 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
    if (cat.includes('kinh doanh')) 
      return "bg-orange-600/25 border-orange-400/40 text-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.15)]";
    if (cat.includes('thưởng')) 
      return "bg-purple-600/25 border-purple-400/40 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.15)]";
    if (cat.includes('ăn uống') || cat.includes('cà phê')) 
      return "bg-rose-600/25 border-rose-400/40 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.15)]";
    if (cat.includes('đi lại') || cat.includes('di chuyển')) 
      return "bg-sky-600/25 border-sky-400/40 text-sky-200 shadow-[0_0_10px_rgba(14,165,233,0.15)]";
    if (cat.includes('mua sắm')) 
      return "bg-amber-600/25 border-amber-400/40 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
    if (cat.includes('nhà ở') || cat.includes('tiện ích')) 
      return "bg-emerald-600/25 border-emerald-400/40 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
    if (cat.includes('giải trí')) 
      return "bg-indigo-600/25 border-indigo-400/40 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.15)]";
    
    return "bg-slate-700/50 border-white/10 text-slate-200";
  };

  return (
    <div className="space-y-6">
      <Header 
        title="Tổng quan" 
        subtitle="Chào mừng trở lại! Đây là tổng quan tài chính của bạn." 
        icon={<LayoutDashboard className="h-7 w-7" />}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tổng tài sản */}
        <div 
          onClick={() => setSelectedMetric(selectedMetric === 'assets' ? null : 'assets')}
          className={cn(
            "bg-slate-900/50 backdrop-blur-xl border rounded-[24px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[160px] group cursor-pointer",
            selectedMetric === 'assets' 
              ? "border-[#00f5ff]/50 shadow-[0_15px_40px_rgba(0,245,255,0.15)] ring-1 ring-[#00f5ff]/20" 
              : "border-[#00f5ff]/10 hover:border-[#00f5ff]/30"
          )}
        >
          {/* Bottom Glow */}
          <AnimatePresence>
            {selectedMetric === 'assets' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-40 h-16 bg-[#00f5ff]/20 blur-[40px] pointer-events-none z-0"
              />
            )}
          </AnimatePresence>

          <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#00f5ff]/10 rounded-full blur-2xl group-hover:bg-[#00f5ff]/20 transition-colors duration-500" />
          <div className="flex items-center gap-3 mb-1 relative z-10">
            <div className="p-2 bg-[#00f5ff]/20 rounded-xl border border-[#00f5ff]/20">
              <Wallet className="h-5 w-5 text-[#00f5ff]" />
            </div>
            <h3 className="text-[13px] font-semibold text-white/80 whitespace-nowrap truncate shrink-0">Tổng tài sản</h3>
          </div>
          <AnimatePresence mode="wait">
            <motion.div 
              key={totalAssets}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold text-[#00f5ff] mb-1 relative z-10 tabular-nums truncate"
            >
              {formatCurrency(totalAssets)}
            </motion.div>
          </AnimatePresence>
          <div className="flex items-end justify-between relative z-10 gap-2">
            <div className={cn(
              "text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap truncate",
              trends.assets >= 0 ? "text-[#00ff9d]" : "text-[#ff3068]"
            )}>
               {trends.assets >= 0 ? '+' : '-'}{Math.abs(trends.assets)}% <span className="text-slate-400">so với {comparisonLabel}</span>
            </div>
          </div>
          {/* Sparkline Background */}
          <div className="absolute right-[-10%] bottom-[-10%] w-[70%] h-[60%] opacity-20 group-hover:opacity-40 transition-all duration-500 pointer-events-none z-0">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <filter id="glow0" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path 
                d="M0,35 Q15,25 30,30 T60,20 T100,5" 
                fill="none" 
                stroke="#00f5ff" 
                strokeWidth="0.8" 
                strokeLinecap="round" 
                filter="url(#glow0)"
                className="drop-shadow-[0_0_8px_#00f5ff]"
              />
            </svg>
          </div>
        </div>

        {/* Thu nhập */}
        <div 
          onClick={() => setSelectedMetric(selectedMetric === 'income' ? null : 'income')}
          className={cn(
            "bg-slate-900/50 backdrop-blur-xl border rounded-[24px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[160px] group cursor-pointer",
            selectedMetric === 'income' 
              ? "border-[#00ff9d]/50 shadow-[0_15px_40px_rgba(0,255,157,0.15)] ring-1 ring-[#00ff9d]/20" 
              : "border-[#00ff9d]/10 hover:border-[#00ff9d]/30"
          )}
        >
          {/* Bottom Glow */}
          <AnimatePresence>
            {selectedMetric === 'income' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-40 h-16 bg-[#00ff9d]/20 blur-[40px] pointer-events-none z-0"
              />
            )}
          </AnimatePresence>

          <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#00ff9d]/10 rounded-full blur-2xl group-hover:bg-[#00ff9d]/20 transition-colors duration-500" />
          <div className="flex items-center gap-3 mb-1 relative z-10">
            <div className="p-2 bg-[#00ff9d]/20 rounded-xl border border-[#00ff9d]/20">
              <TrendingUp className="h-5 w-5 text-[#00ff9d]" />
            </div>
            <h3 className="text-[13px] font-semibold text-white/80 whitespace-nowrap truncate shrink-0">Thu nhập</h3>
            <button onClick={() => navigate('/app/income#income-history')} className="ml-auto text-[10px] font-bold text-[#00ff9d] hover:text-[#00ff9d]/80 transition-colors underline whitespace-nowrap shrink-0">
              Chi tiết
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div 
              key={totalIncome}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold text-[#00ff9d] mb-1 relative z-10 tabular-nums truncate"
            >
              {formatCurrency(totalIncome)}
            </motion.div>
          </AnimatePresence>
          <div className="flex items-end justify-between relative z-10 gap-2">
            <div className={cn(
              "text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap truncate",
              trends.income >= 0 ? "text-[#00ff9d]" : "text-[#ff3068]"
            )}>
               {trends.income >= 0 ? '+' : '-'}{Math.abs(trends.income)}% <span className="text-slate-400">so với {comparisonLabel}</span>
            </div>
          </div>
          {/* Sparkline Background */}
          <div className="absolute right-[-10%] bottom-[-10%] w-[70%] h-[60%] opacity-20 group-hover:opacity-40 transition-all duration-500 pointer-events-none z-0">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <filter id="glow1" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path 
                d="M0,30 Q20,35 40,20 T80,15 T100,0" 
                fill="none" 
                stroke="#00ff9d" 
                strokeWidth="0.8" 
                strokeLinecap="round" 
                filter="url(#glow1)"
                className="drop-shadow-[0_0_8px_#00ff9d]"
              />
            </svg>
          </div>
        </div>

        {/* Chi tiêu */}
        <div 
          onClick={() => setSelectedMetric(selectedMetric === 'expense' ? null : 'expense')}
          className={cn(
            "bg-slate-900/50 backdrop-blur-xl border rounded-[24px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[160px] group cursor-pointer",
            selectedMetric === 'expense' 
              ? "border-[#ff3068]/50 shadow-[0_15px_40px_rgba(255,48,104,0.15)] ring-1 ring-[#ff3068]/20" 
              : "border-[#ff3068]/10 hover:border-[#ff3068]/30"
          )}
        >
          {/* Bottom Glow */}
          <AnimatePresence>
            {selectedMetric === 'expense' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-40 h-16 bg-[#ff3068]/20 blur-[40px] pointer-events-none z-0"
              />
            )}
          </AnimatePresence>

          <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#ff3068]/10 rounded-full blur-2xl group-hover:bg-[#ff3068]/20 transition-colors duration-500" />
          <div className="flex items-center gap-3 mb-1 relative z-10">
            <div className="p-2 bg-[#ff3068]/20 rounded-xl border border-[#ff3068]/20">
              <TrendingDown className="h-5 w-5 text-[#ff3068]" />
            </div>
            <h3 className="text-[13px] font-semibold text-white/80 whitespace-nowrap truncate shrink-0">Chi tiêu</h3>
            <button onClick={() => navigate('/app/expense#expense-history')} className="ml-auto text-[10px] font-bold text-[#ff3068] hover:text-[#ff3068]/80 transition-colors underline whitespace-nowrap shrink-0">
              Chi tiết
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div 
              key={totalExpense}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold text-[#ff3068] mb-1 relative z-10 tabular-nums truncate"
            >
              {formatCurrency(totalExpense)}
            </motion.div>
          </AnimatePresence>
          <div className="flex items-end justify-between relative z-10 gap-2">
            <div className={cn(
              "text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap truncate",
              trends.expense >= 0 ? "text-[#00ff9d]" : "text-[#ff3068]"
            )}>
               {trends.expense >= 0 ? '+' : '-'}{Math.abs(trends.expense)}% <span className="text-slate-400">so với {comparisonLabel}</span>
            </div>
          </div>
          {/* Sparkline Background */}
          <div className="absolute right-[-10%] bottom-[-10%] w-[70%] h-[60%] opacity-20 group-hover:opacity-40 transition-all duration-500 pointer-events-none z-0">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <filter id="glow2" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path 
                d="M0,10 Q25,0 45,20 T75,15 T100,35" 
                fill="none" 
                stroke="#ff3068" 
                strokeWidth="0.8" 
                strokeLinecap="round" 
                filter="url(#glow2)"
                className="drop-shadow-[0_0_8px_#ff3068]"
              />
            </svg>
          </div>
        </div>

        {/* Dòng tiền ròng */}
        <div 
          onClick={() => setSelectedMetric(selectedMetric === 'cashflow' ? null : 'cashflow')}
          className={cn(
            "bg-slate-900/50 backdrop-blur-xl border rounded-[24px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[160px] group cursor-pointer",
            selectedMetric === 'cashflow' 
              ? "border-[#ffd700]/50 shadow-[0_15px_40px_rgba(255,215,0,0.15)] ring-1 ring-[#ffd700]/20" 
              : "border-[#ffd700]/10 hover:border-[#ffd700]/30"
          )}
        >
          {/* Bottom Glow */}
          <AnimatePresence>
            {selectedMetric === 'cashflow' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-40 h-16 bg-[#ffd700]/20 blur-[40px] pointer-events-none z-0"
              />
            )}
          </AnimatePresence>

          <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#ffd700]/10 rounded-full blur-2xl group-hover:bg-[#ffd700]/20 transition-colors duration-500" />
          <div className="flex items-center gap-3 mb-1 relative z-10">
            <div className="p-2 bg-[#ffd700]/20 rounded-xl border border-[#ffd700]/20">
              <ArrowRightLeft className="h-5 w-5 text-[#ffd700]" />
            </div>
            <h3 className="text-[13px] font-semibold text-white/80 whitespace-nowrap truncate shrink-0">Dòng tiền ròng</h3>
            <button onClick={() => navigate('/app/cashflow#transaction-history')} className="ml-auto text-[10px] font-bold text-[#ffd700] hover:text-[#ffd700]/80 transition-colors underline whitespace-nowrap shrink-0">
              Chi tiết
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div 
              key={netCashFlow}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold text-[#ffd700] mb-1 relative z-10 tabular-nums truncate"
            >
              {netCashFlow > 0 ? '+' : ''}{formatCurrency(netCashFlow)}
            </motion.div>
          </AnimatePresence>
          <div className="flex items-end justify-between relative z-10 gap-2">
             <div className={cn(
               "text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap truncate",
               trends.cashflow >= 0 ? "text-[#ffd700]" : "text-[#ff3068]"
             )}>
               {trends.cashflow >= 0 ? '+' : '-'}{Math.abs(trends.cashflow)}% <span className="text-slate-400">so với {comparisonLabel}</span>
            </div>
          </div>
          {/* Sparkline Background */}
          <div className="absolute right-[-10%] bottom-[-10%] w-[70%] h-[60%] opacity-20 group-hover:opacity-40 transition-all duration-500 pointer-events-none z-0">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <filter id="glow3" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path 
                d="M0,35 Q15,40 35,20 T70,10 T100,5" 
                fill="none" 
                stroke="#ffd700" 
                strokeWidth="0.8" 
                strokeLinecap="round" 
                filter="url(#glow3)"
                className="drop-shadow-[0_0_8px_#ffd700]"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="mb-8">
        {/* Main Chart */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight leading-tight flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-400/70" />
                Dòng tiền theo thời gian
              </h3>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}M`} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-slate-200 p-3.5 rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-[100] min-w-[200px]">
                          <p className="text-[14px] font-bold text-slate-800 mb-2">{label}</p>
                          <div className="space-y-2">
                            {payload.map((entry, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-[13px] font-medium text-slate-600">{entry.name}:</span>
                                <span className="text-[13px] font-bold text-slate-800 ml-auto">{formatCurrency(entry.value as number)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top"
                  content={(props) => {
                    const { payload } = props;
                    return (
                      <div className="flex items-center justify-center gap-6 pb-6">
                        {payload?.map((entry, index) => {
                          const isLine = entry.type === 'line' || entry.value === 'Dòng tiền ròng';
                          return (
                            <div key={`item-${index}`} className="flex items-center gap-2">
                              {isLine ? (
                                <div className="flex items-center gap-0.5">
                                  <div className="w-2.5 h-[2px]" style={{ backgroundColor: entry.color }} />
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <div className="w-2.5 h-[2px]" style={{ backgroundColor: entry.color }} />
                                </div>
                              ) : (
                                <div className="w-4 h-2 rounded-[2px]" style={{ backgroundColor: entry.color }} />
                              )}
                              <span className="text-[13px] font-semibold text-slate-100">{entry.value}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="income" name="Thu" fill="#10b981" barSize={16} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Chi" fill="#f43f5e" barSize={16} radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="net" name="Dòng tiền ròng" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6', stroke: '#3b82f6' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white tracking-tight leading-tight flex items-center gap-2">
                <WalletMinimal className="h-5 w-5 text-[#00ff9d]/70" />
                Nguồn thu nhập
              </h3>
            </div>
            <button onClick={() => navigate('/app/income#income-history')} className="text-[10px] font-bold text-[#00ff9d] hover:text-[#00ff9d]/80 transition-colors underline whitespace-nowrap">
              Chi tiết
            </button>
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-center flex-1 py-2 lg:py-6">
            <div className="relative flex justify-center items-center w-[220px] h-[220px] shrink-0">
              {incomeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <RechartsTooltip 
                      wrapperStyle={{ zIndex: 100 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#0f172a] border border-white/20 p-2.5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-[100]">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{payload[0].name}</p>
                              <p className="text-sm font-bold text-white">{formatCurrency(payload[0].value as number)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={incomeData}
                      innerRadius={75}
                      outerRadius={100}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                      onClick={(data) => setActiveIncomeName(activeIncomeName === data.name ? null : data.name)}
                      className="cursor-pointer outline-none focus:outline-none"
                    >
                      {incomeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke={activeIncomeName === entry.name ? '#ffffff' : 'none'}
                          strokeWidth={activeIncomeName === entry.name ? 2 : 0}
                          style={{
                            filter: activeIncomeName === entry.name ? `drop-shadow(0px 0px 8px ${COLORS[index % COLORS.length]}80)` : 'none',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-500 text-sm font-medium">Chưa có dữ liệu</div>
              )}
              {incomeData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1 z-0">
                  <span className="text-xs font-semibold text-slate-400 text-center px-4 leading-tight">
                    {activeIncomeItem ? activeIncomeItem.name : "Tổng thu nhập"}
                  </span>
                  <span className="text-2xl font-bold text-white mt-0.5">
                    {activeIncomeItem 
                      ? formatCurrency(activeIncomeItem.value)
                      : formatCurrency(totalIncome)}
                  </span>
                  {!activeIncomeItem && (
                    <span className="text-[9px] font-medium text-[#00ff9d]/80 mt-1.5 bg-[#00ff9d]/10 px-2 py-0.5 rounded-full border border-[#00ff9d]/20">
                      Chạm để xem
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-1 w-full space-y-4 lg:space-y-5">
              {incomeData.length > 0 && incomeData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-300 text-right">
                    {((item.value / (totalIncome || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories Pie */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white tracking-tight leading-tight flex items-center gap-2">
                <LucidePieChart className="h-5 w-5 text-[#ff3068]/70" />
                Cơ cấu chi tiêu
              </h3>
            </div>
            <button onClick={() => navigate('/app/expense#expense-history')} className="text-[10px] font-bold text-[#ff3068] hover:text-[#ff3068]/80 transition-colors underline whitespace-nowrap">
              Chi tiết
            </button>
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-center flex-1 py-2 lg:py-6">
            <div className="relative flex justify-center items-center w-[220px] h-[220px] shrink-0">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <RechartsTooltip 
                      wrapperStyle={{ zIndex: 100 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#0f172a] border border-white/20 p-2.5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-[100]">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{payload[0].name}</p>
                              <p className="text-sm font-bold text-white">{formatCurrency(payload[0].value as number)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={pieData}
                      innerRadius={75}
                      outerRadius={100}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                      onClick={(data) => setActiveExpenseName(activeExpenseName === data.name ? null : data.name)}
                      className="cursor-pointer outline-none focus:outline-none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke={activeExpenseName === entry.name ? '#ffffff' : 'none'}
                          strokeWidth={activeExpenseName === entry.name ? 2 : 0}
                          style={{
                            filter: activeExpenseName === entry.name ? `drop-shadow(0px 0px 8px ${COLORS[index % COLORS.length]}80)` : 'none',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
               <div className="text-slate-500 text-sm font-medium">Chưa có dữ liệu</div>
              )}
              {pieData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1 z-0">
                  <span className="text-2xl font-bold text-white mt-0.5">
                    {activeExpenseItem
                      ? formatCurrency(activeExpenseItem.value)
                      : formatCurrency(totalExpense)}
                  </span>
                  {!activeExpenseItem && (
                    <span className="text-[9px] font-medium text-[#ff3068]/80 mt-1.5 bg-[#ff3068]/10 px-2 py-0.5 rounded-full border border-[#ff3068]/20">
                      Chạm để xem
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 w-full space-y-4 lg:space-y-5">
              {pieData.length > 0 && pieData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-300 text-right">
                    {((item.value / (totalExpense || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Recent Transactions */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 relative overflow-hidden flex flex-col">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-white tracking-tight leading-tight whitespace-nowrap flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-400/70" />
              Giao dịch gần đây
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
              {/* Pills */}
              <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 shrink-0 self-start sm:self-auto">
                <button 
                  onClick={() => setRecentTxType('all')}
                  className={cn("px-4 py-2 rounded-xl text-[13px] font-semibold transition-all", recentTxType === 'all' ? "bg-indigo-600/30 text-indigo-300" : "text-slate-400 hover:text-slate-200")}
                >
                  Tất cả
                </button>
                <button 
                  onClick={() => setRecentTxType('income')}
                  className={cn("px-4 py-2 rounded-xl text-[13px] font-semibold transition-all", recentTxType === 'income' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-slate-200 border border-transparent")}
                >
                  Thu nhập
                </button>
                <button 
                  onClick={() => setRecentTxType('expense')}
                  className={cn("px-4 py-2 rounded-xl text-[13px] font-semibold transition-all", recentTxType === 'expense' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "text-slate-400 hover:text-slate-200 border border-transparent")}
                >
                  Chi tiêu
                </button>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Tìm giao dịch..." 
                    value={recentTxSearch}
                    onChange={(e) => setRecentTxSearch(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-[20px] text-sm font-bold transition-all border cursor-pointer",
                      isFilterOpen || selectedCategories.length > 0 || selectedMethods.length > 0
                        ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-[#111827] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                    )}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Bộ lọc</span>
                    {(selectedCategories.length > 0 || selectedMethods.length > 0) && (
                      <span className="ml-1 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">
                        {(selectedCategories.length > 0 ? 1 : 0) + (selectedMethods.length > 0 ? 1 : 0)}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isFilterOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 top-full mt-3 w-80 bg-[#0f172a] border border-white/10 rounded-[32px] shadow-2xl p-6 z-20 backdrop-blur-xl"
                        >
                          <div className="space-y-8">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-black text-white uppercase tracking-widest">Bộ lọc nâng cao</h4>
                              <button 
                                onClick={() => {
                                  setSelectedCategories([]);
                                  setSelectedMethods([]);
                                }}
                                className="text-[10px] font-black text-indigo-500 uppercase hover:underline cursor-pointer"
                              >
                                Xóa tất cả
                              </button>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-left">Danh mục</p>
                              <div className="max-h-40 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                {categories.map(cat => (
                                  <label key={cat} className="flex items-center justify-between cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "w-4 h-4 rounded border transition-all flex items-center justify-center",
                                        selectedCategories.includes(cat) ? "bg-indigo-500 border-indigo-500" : "border-white/10 group-hover:border-white/20"
                                      )}>
                                        <input 
                                          type="checkbox" 
                                          className="hidden"
                                          checked={selectedCategories.includes(cat)}
                                          onChange={(e) => {
                                            if (e.target.checked) setSelectedCategories([...selectedCategories, cat]);
                                            else setSelectedCategories(selectedCategories.filter(c => c !== cat));
                                          }}
                                        />
                                        {selectedCategories.includes(cat) && <Check className="w-2.5 h-2.5 text-white" />}
                                      </div>
                                      <span className={cn("text-[13px] font-medium transition-colors", selectedCategories.includes(cat) ? "text-white" : "text-slate-400 group-hover:text-slate-300")}>{cat}</span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-left">Phương thức</p>
                              <div className="space-y-2">
                                {paymentMethods.map(method => (
                                  <label key={method} className="flex items-center justify-between cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "w-4 h-4 rounded border transition-all flex items-center justify-center",
                                        selectedMethods.includes(method) ? "bg-indigo-500 border-indigo-500" : "border-white/10 group-hover:border-white/20"
                                      )}>
                                        <input 
                                          type="checkbox" 
                                          className="hidden"
                                          checked={selectedMethods.includes(method)}
                                          onChange={(e) => {
                                            if (e.target.checked) setSelectedMethods([...selectedMethods, method]);
                                            else setSelectedMethods(selectedMethods.filter(m => m !== method));
                                          }}
                                        />
                                        {selectedMethods.includes(method) && <Check className="w-2.5 h-2.5 text-white" />}
                                      </div>
                                      <span className={cn("text-[13px] font-medium transition-colors", selectedMethods.includes(method) ? "text-white" : "text-slate-400 group-hover:text-slate-300")}>{method}</span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          <div className="relative pl-3 mt-4 space-y-0 relative z-10 min-h-[400px]">
            {/* The vertical line */}
            <div className="absolute left-4 top-4 bottom-4 w-[2px] bg-slate-700/50 z-0"></div>

            <AnimatePresence mode="popLayout">
              {limitedTransactions.map((tx, i) => {
                const styleProps = getTxStyle(tx.category, tx.type);
                const TxIcon = styleProps.icon;
                return (
                  <motion.div 
                    key={tx.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="relative z-10 flex items-center gap-4 group cursor-pointer"
                  >
                    {/* Dot */}
                    <div className={cn("w-2.5 h-2.5 rounded-full absolute -left-[5px] top-1/2 -translate-y-1/2 outline outline-4 outline-slate-800", styleProps.dotClass)}></div>

                    <div className="flex-1 ml-6 flex justify-between items-center py-4 border-b border-white/[0.04] group-last:border-none">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2.5 rounded-xl border shadow-inner", styleProps.bgClass, styleProps.borderClass)}>
                          <TxIcon className={cn("w-[22px] h-[22px]", styleProps.colorClass)} />
                        </div>
                        <div>
                          <p className="text-sm md:text-[15px] font-bold text-white tracking-tight leading-tight mb-2">{tx.description}</p>
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm text-center inline-block min-w-[70px]",
                            getCategoryBadgeStyles(tx.category)
                          )}>
                            {tx.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm md:text-base font-bold tracking-tight", tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400')}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                        <p className="text-[13px] font-medium text-slate-500 mt-1">{format(parseISO(tx.date), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {limitedTransactions.length === 0 && (
              <div className="py-8 text-center bg-slate-900/30 rounded-2xl border border-white/5 ml-6 relative z-10">
                <p className="text-sm font-medium text-slate-500">Không tìm thấy giao dịch nào.</p>
              </div>
            )}
          </div>
          
          {/* View Details Button */}
          <div className="mt-6 flex justify-center border-t border-white/5 pt-6">
              <button 
                onClick={() => {
                  if (recentTxType === 'all') navigate('/app/cashflow#transaction-history');
                  else if (recentTxType === 'income') navigate('/app/income#income-history');
                  else navigate('/app/expense#expense-history');
                }}
                className="flex items-center gap-2 group px-6 py-2.5 bg-slate-900 border border-white/5 hover:bg-slate-800 rounded-xl transition-all font-bold text-sm text-slate-300 hover:text-white"
              >
                Xem chi tiết
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </button>
            </div>
        </div>
      </div>

      <TransactionModal isOpen={!!modalType} onClose={() => setModalType(null)} type={modalType || 'income'} />
    </div>
  );
}
