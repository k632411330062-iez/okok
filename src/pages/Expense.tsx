import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useFilteredData, formatCurrency, useTrends } from "../hooks/useMetrics";
import { useFinanceStore } from "../store/useFinanceStore";
import { Header } from "../components/Header";
import { 
  Plus, Search, Download, CreditCard, TrendingDown, Activity, 
  ShieldCheck, Eye, Calendar, Zap, Droplets, Globe, 
  Clock, ArrowDownRight, AlertCircle, ThumbsUp, 
  Smartphone, Wallet, Trash2, Edit2, Filter, 
  Tv, Music, Palette, Youtube, Lightbulb, Bot, Sparkles,
  ChevronRight, ArrowRight, MoreHorizontal, Layers, Rocket, PiggyBank,
  Check, ChevronLeft, ChevronDown, X
} from "lucide-react";
import { format, parseISO, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getMonth } from "date-fns";
import { cn } from "../lib/utils";
import { TransactionModal } from "../components/TransactionModal";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area, CartesianGrid
} from "recharts";
import { motion, AnimatePresence } from "motion/react";

import { Pagination } from "../components/Pagination";

export default function Expense() {
  const location = useLocation();
  const { filteredTransactions, totalExpense } = useFilteredData();
  const { transactions, deleteTransaction, selectedPeriod, setPeriod, startDate, endDate } = useFinanceStore();
  const { expenseGrowth, dailyExpenseGrowth } = useTrends();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('Tất cả phương thức');
  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>([]);
  const [tempSelectedMethod, setTempSelectedMethod] = useState<string>('Tất cả phương thức');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { expenseLimit, setExpenseLimit } = useFinanceStore();
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(expenseLimit.toString());

  useEffect(() => {
     setTempLimit(expenseLimit.toString());
  }, [expenseLimit]);

  const comparisonLabel = useMemo(() => {
    switch (selectedPeriod) {
      case 'month': return 'tháng trước';
      case 'quarter': return 'quý trước';
      case 'year': return 'năm trước';
      default: return 'kỳ trước';
    }
  }, [selectedPeriod]);

  const expenseTxs = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'expense').sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
    [filteredTransactions]
  );

  // Top Metrics Logic
  const avgDailyExpense = totalExpense / Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const categoryCount = new Set(expenseTxs.map(t => t.category)).size;
  const budgetLimit = expenseLimit;
  const budgetUsage = Math.min(100, Math.round((totalExpense / budgetLimit) * 100)) || 0;
  const remainingBudget = Math.max(0, budgetLimit - totalExpense);

  // Donut Chart Logic (Categories)
  const categoryData = useMemo(() => {
    const predefinedCategories = ['Ăn uống', 'Đi lại', 'Mua sắm', 'Nhà ở', 'Giải trí'];
    const data: Record<string, number> = {};
    predefinedCategories.forEach(c => data[c] = 0);
    data['Khác'] = 0;

    let hasData = false;
    expenseTxs.forEach(tx => {
      hasData = true;
      if (predefinedCategories.includes(tx.category)) {
        data[tx.category] += tx.amount;
      } else {
        data['Khác'] += tx.amount;
      }
    });

    if (!hasData) {
      return [
        { name: 'Ăn uống', value: 3000000 },
        { name: 'Nhà ở', value: 2500000 },
        { name: 'Đi lại', value: 1500000 },
        { name: 'Mua sắm', value: 1000000 },
        { name: 'Giải trí', value: 800000 },
        { name: 'Khác', value: 700000 },
      ];
    }

    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [expenseTxs]);

  const COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#38bdf8', '#a855f7'];

  const filteredList = useMemo(() => 
    expenseTxs.filter(t => {
      const predefinedCategories = ['Ăn uống', 'Đi lại', 'Mua sắm', 'Nhà ở', 'Giải trí'];
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(t.category) ||
        (selectedCategories.includes('Khác') && !predefinedCategories.includes(t.category));
      const matchesMethod = selectedMethod === 'Tất cả phương thức' || t.paymentMethod === selectedMethod;
      
      return matchesSearch && matchesCategory && matchesMethod;
    }),
    [expenseTxs, searchTerm, selectedCategories, selectedMethod]
  );

  // Pagination logic
  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, searchTerm, selectedCategories, selectedMethod]);

  const currentTotalExpense = totalExpense || 0;

  const categoryOptions = ['Ăn uống', 'Đi lại', 'Mua sắm', 'Nhà ở', 'Giải trí', 'Khác'];
  const methodOptions = ['Tất cả phương thức', 'Tiền mặt', 'Chuyển khoản', 'Ví điện tử', 'Thẻ'];

  const paymentMethodData = useMemo(() => {
    const predefinedMethods = ['Tiền mặt', 'Chuyển khoản', 'Ví điện tử', 'Thẻ'];
    const colors = ['#f59e0b', '#6366f1', '#10b981', '#38bdf8'];
    const bgColors = ['bg-amber-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-sky-500'];
    
    let total = 0;
    const totalsByMethod: Record<string, number> = {};
    predefinedMethods.forEach(m => totalsByMethod[m] = 0);

    expenseTxs.forEach(tx => {
      if (tx.paymentMethod && predefinedMethods.includes(tx.paymentMethod)) {
        totalsByMethod[tx.paymentMethod] += tx.amount;
        total += tx.amount;
      } else {
        totalsByMethod['Khác'] = (totalsByMethod['Khác'] || 0) + tx.amount;
        total += tx.amount;
      }
    });

    const result = predefinedMethods.map((name, index) => {
      const value = totalsByMethod[name];
      return {
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        colorClass: bgColors[index % bgColors.length],
        fill: colors[index % colors.length]
      };
    });
    
    if (totalsByMethod['Khác'] > 0) {
        result.push({
            name: 'Khác',
            value: totalsByMethod['Khác'],
            percentage: Math.round((totalsByMethod['Khác'] / total) * 100),
            colorClass: 'bg-slate-500',
            fill: '#64748b'
        });
    }

    return { total, data: result.filter(r => r.value > 0) };
  }, [expenseTxs]);

  const maxExpenseTx = useMemo(() => 
    expenseTxs.length > 0 ? [...expenseTxs].sort((a, b) => b.amount - a.amount)[0] : null
  , [expenseTxs]);

  const minExpenseTx = useMemo(() => 
    expenseTxs.length > 0 ? [...expenseTxs].sort((a, b) => a.amount - b.amount)[0] : null
  , [expenseTxs]);

  const recurringExpense = useMemo(() => 
    expenseTxs.filter(tx => tx.category.toLowerCase().includes('nhà ở') || tx.category.toLowerCase().includes('cố định')).reduce((acc, tx) => acc + tx.amount, 0)
  , [expenseTxs]);

  const maxSpendingDay = useMemo(() => {
    const dailyTotals: Record<string, number> = {};
    expenseTxs.forEach(tx => {
      const dateStr = format(parseISO(tx.date), 'yyyy-MM-dd');
      dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + tx.amount;
    });
    
    let maxDay = "";
    let maxAmount = 0;
    
    Object.entries(dailyTotals).forEach(([day, total]) => {
      if (total > maxAmount) {
        maxAmount = total;
        maxDay = day;
      }
    });
    
    return { date: maxDay, amount: maxAmount };
  }, [expenseTxs]);

  const fixedFlexibleData = useMemo(() => {
    const fixedCategoriesList = ['nhà ở', 'cố định', 'tiền thuê', 'điện nước', 'internet', 'bảo hiểm'];
    
    let fixedTotal = 0;
    let flexibleTotal = 0;
    
    expenseTxs.forEach(tx => {
      const cat = tx.category.toLowerCase();
      const desc = tx.description.toLowerCase();
      
      const isFixed = fixedCategoriesList.some(f => cat.includes(f) || desc.includes(f));
      
      if (isFixed) {
        fixedTotal += tx.amount;
      } else {
        flexibleTotal += tx.amount;
      }
    });
    
    const total = fixedTotal + flexibleTotal;
    if (total === 0) return { fixed: 0, flexible: 0, fixedAmount: 0, flexibleAmount: 0 };
    
    return {
      fixed: Math.round((fixedTotal / total) * 100),
      flexible: Math.round((flexibleTotal / total) * 100),
      fixedAmount: fixedTotal,
      flexibleAmount: flexibleTotal
    };
  }, [expenseTxs]);

  // Time Chart Data calculation
  const timeChartData = useMemo(() => {
    const data: { name: string; value: number }[] = [];
    
    if (selectedPeriod === 'month') {
      const start = startOfMonth(startDate);
      const end = endOfMonth(startDate);
      let current = new Date(start);
      let weekIdx = 1;
      
      while (current <= end) {
        let weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > end) weekEnd = end;
        
        const weekTxs = expenseTxs.filter(tx => {
          const d = parseISO(tx.date);
          return d >= current && d <= weekEnd;
        });
        
        data.push({
          name: `Tuần ${weekIdx}`,
          value: weekTxs.reduce((s,t) => s + t.amount, 0)
        });
        current.setDate(current.getDate() + 7);
        weekIdx++;
      }
    } else if (selectedPeriod === 'quarter') {
      // Group by Quarters Q1-Q4
      for (let q = 1; q <= 4; q++) {
        const quarterTxs = expenseTxs.filter(tx => {
          const m = getMonth(parseISO(tx.date));
          return Math.floor(m / 3) + 1 === q;
        });
        data.push({ 
          name: `Quý ${q}`, 
          value: quarterTxs.reduce((s, t) => s + t.amount, 0) 
        });
      }
    } else {
      // Group by months for year/custom
      for (let i = 0; i < 12; i++) {
        const monthTxs = expenseTxs.filter(tx => getMonth(parseISO(tx.date)) === i);
        data.push({ name: `T${i+1}`, value: monthTxs.reduce((s,t) => s + t.amount, 0) });
      }
    }
    return data;
  }, [expenseTxs, selectedPeriod, startDate, endDate]);

  const aiForecast = useMemo(() => {
    if (timeChartData.length === 0) return { amount: 0, trend: "0.0" };
    const values = timeChartData.map(d => d.value).filter(v => v > 0);
    const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    const last = values[values.length - 1] || 0;
    const diff = last > 0 ? ((avg - last) / last) * 100 : 0;
    
    return {
      amount: Math.round(avg),
      trend: diff.toFixed(1)
    };
  }, [timeChartData]);

  // Handle scroll to history if hash is present
  useEffect(() => {
    if (location.hash === '#expense-history') {
      const element = document.getElementById('expense-history');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    }
  }, [location.hash]);

  const getCategoryStyles = (category: string) => {
    const cat = category.toLowerCase();
    
    // Vibrant Rainbow Palette - Extremely Distinct
    if (cat.includes('ăn uống') || cat.includes('cà phê')) 
      return "bg-rose-600/25 border-rose-400/40 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.2)] group-hover:bg-rose-600/40";
    
    if (cat.includes('đi lại') || cat.includes('di chuyển')) 
      return "bg-sky-600/25 border-sky-400/40 text-sky-200 shadow-[0_0_15px_rgba(14,165,233,0.2)] group-hover:bg-sky-600/40";
    
    if (cat.includes('mua sắm')) 
      return "bg-amber-600/25 border-amber-400/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:bg-amber-600/40";
    
    if (cat.includes('nhà ở') || cat.includes('tiện ích')) 
      return "bg-emerald-600/25 border-emerald-400/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:bg-emerald-600/40";
    
    if (cat.includes('giải trí')) 
      return "bg-indigo-600/25 border-indigo-400/40 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:bg-indigo-600/40";

    if (cat.includes('giáo dục') || cat.includes('học tập'))
      return "bg-violet-600/25 border-violet-400/40 text-violet-200 shadow-[0_0_15px_rgba(139,92,246,0.2)] group-hover:bg-violet-600/40";

    if (cat.includes('sức khỏe'))
      return "bg-teal-600/25 border-teal-400/40 text-teal-200 shadow-[0_0_15px_rgba(20,184,166,0.2)] group-hover:bg-teal-600/40";
    
    return "bg-slate-700/50 border-white/20 text-slate-200 group-hover:border-indigo-500/40 group-hover:text-white";
  };

  return (
    <div className="space-y-6 pb-12">
      <Header 
        title="Chi phí" 
        subtitle="Quản lý và theo dõi chi tiêu của bạn."
        icon={<TrendingDown className="h-7 w-7 text-rose-500" />}
      >
        <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-2.5 md:px-3 h-[36px] md:h-9 rounded-xl font-bold shadow-lg shadow-rose-600/20 transition-all active:scale-95 text-[10px] md:text-[11px] whitespace-nowrap"
        >
            <Plus className="w-3.5 h-3.5" /> 
            Thêm chi phí
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
        </button>
      </Header>

      {/* Top 4 Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng chi tiêu', value: totalExpense, trend: `${expenseGrowth >= 0 ? '+' : '-'}${Math.abs(expenseGrowth)}%`, comparison: `so với ${comparisonLabel}`, color: 'text-rose-500', icon: TrendingDown, trendColor: expenseGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400', baseline: totalExpense, sparklineColor: '#f43f5e' },
          { label: 'Trung bình / ngày', value: avgDailyExpense, trend: `${dailyExpenseGrowth >= 0 ? '+' : '-'}${Math.abs(dailyExpenseGrowth)}%`, comparison: `so với ${comparisonLabel}`, color: 'text-rose-400', icon: Activity, trendColor: dailyExpenseGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400', baseline: avgDailyExpense, sparklineColor: '#f43f5e' },
          { label: 'Danh mục', value: categoryCount, suffix: ' danh mục', trend: ``, comparison: `Dựa trên ${selectedPeriod === 'month' ? 'tháng' : selectedPeriod === 'quarter' ? 'quý' : selectedPeriod === 'year' ? 'năm' : 'kỳ'} này`, color: 'text-amber-500', icon: ShieldCheck, trendColor: 'text-amber-400', baseline: categoryCount, sparklineColor: '#f59e0b' },
          { 
            label: 'Ngày chi nhiều nhất', 
            value: maxSpendingDay.amount, 
            comparison: maxSpendingDay.date ? format(parseISO(maxSpendingDay.date), 'dd/MM/yyyy') : 'Chưa có dữ liệu', 
            color: 'text-indigo-400', 
            icon: Calendar, 
            trendColor: 'text-slate-400', 
            baseline: maxSpendingDay.amount, 
            sparklineColor: '#6366f1' 
          },
        ].map((m, i) => (
          <div key={i} className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</p>
                {m.icon && (
                  <div className={cn("p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors", m.color)}>
                    <m.icon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <p className="text-[18px] font-black text-white tracking-tight">
                {m.label === 'Danh mục' 
                  ? `${m.value} mục` 
                  : (m as any).isProgress 
                    ? `${m.value}${(m as any).suffix}` 
                    : formatCurrency(m.value as number)}
              </p>
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {m.trend && (
                  <span className={cn("text-[9px] font-bold", m.trendColor)}>
                    {m.trend}
                  </span>
                )}
                <span className="text-[9px] font-bold text-slate-400">{m.comparison}</span>
              </div>
            </div>
            
            <div className="absolute right-[-5%] bottom-[-10%] w-[70%] h-[50%] opacity-20 group-hover:opacity-40 transition-all duration-500 pointer-events-none z-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={Array.from({length: 12}).map((_, j) => ({v: 10 + Math.sin(j/2)*5 + Math.random()*5}))}>
                  <defs>
                    <linearGradient id={`glow-exp-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={m.sparklineColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={m.sparklineColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="v" 
                    stroke={m.sparklineColor} 
                    fill={`url(#glow-exp-${i})`} 
                    strokeWidth={0.8} 
                    dot={false} 
                    isAnimationActive={false} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Deep Analysis (Category & Time) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Donut */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[32px] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col">
          <div className="flex justify-between items-center w-full mb-8">
            <h3 className="text-[14px] font-bold text-white tracking-tight uppercase tracking-widest">Phân bổ theo danh mục</h3>
            <button className="p-2 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-12 flex-1">
            <div className="relative w-52 h-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Tổng</span>
                <span className="text-xl font-black text-white">{formatCurrency(currentTotalExpense).split(' ')[0]}</span>
                <span className="text-[9px] font-bold text-slate-600 mt-1 uppercase">VND</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              {categoryData.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[12px] font-bold text-slate-400 group-hover:text-white transition-colors tracking-tight uppercase">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] font-black text-white w-10 text-right">{Math.round((item.value / currentTotalExpense) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Time Bar Chart */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[32px] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col">
          <div className="flex justify-between items-center w-full mb-8">
            <h3 className="text-[14px] font-bold text-white tracking-tight uppercase tracking-widest">Chi tiêu theo thời gian</h3>
          </div>
          <div className="w-full flex-1 min-h-[240px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={timeChartData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                 <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                  />
                 <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#475569', fontSize: 10, fontWeight: 'medium'}}
                    tickFormatter={(v) => v >= 1000000 ? `${v/1000000}tr` : v}
                 />
                 <RechartsTooltip 
                    cursor={{ fill: 'rgba(244, 63, 94, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0f172a]/95 border border-white/10 p-3 rounded-2xl shadow-2xl backdrop-blur-xl">
                            <p className="text-[10px] font-bold text-slate-500 mb-1 tracking-widest uppercase">{payload[0].payload.name}</p>
                            <p className="text-[14px] font-black text-rose-500">{formatCurrency(payload[0].value as number)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                 />
                 <Bar dataKey="value" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={32} />
               </BarChart>
             </ResponsiveContainer>
          </div>

        </div>
      </div>

      {/* Row 2: Quick Stats & Distribution (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thống kê nhanh block */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[32px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col h-full">
          <h3 className="text-[12px] font-bold text-white mb-6 uppercase tracking-widest">Thống kê nhanh</h3>
          <div className="space-y-5 flex-1">
            {[
              { label: 'Giao dịch chi tiêu', value: `${expenseTxs.length} giao dịch`, icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'Ngày chi nhiều nhất', value: formatCurrency(maxSpendingDay.amount || 0), subtitle: maxSpendingDay.date ? format(parseISO(maxSpendingDay.date), 'dd/MM/yyyy') : 'Chưa có dữ liệu', icon: Rocket, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Giao dịch nhỏ nhất', value: formatCurrency(minExpenseTx?.amount || 10000), subtitle: minExpenseTx?.description || 'Gửi xe', icon: Zap, color: 'text-rose-400', bg: 'bg-rose-500/10' },
              { label: 'Chi tiêu định kỳ', value: formatCurrency(recurringExpense || 4500000), subtitle: 'Nhà ở & Tiện ích', icon: PiggyBank, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", item.bg)}>
                  <item.icon className={cn("w-4 h-4", item.color)} />
                </div>
                <div className="flex-1 flex justify-between items-center text-[10px]">
                  <div>
                    <p className="text-slate-400 font-bold tracking-tight uppercase leading-none mb-1">{item.label}</p>
                    {item.subtitle && <p className="text-[9px] text-slate-500 font-medium tracking-tight truncate max-w-[120px]">{item.subtitle}</p>}
                  </div>
                  <p className={cn("font-black text-[12px] transition-colors group-hover:text-white", i === 1 ? "text-rose-500" : "text-white whitespace-nowrap")}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[32px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col items-center h-full">
          <h3 className="text-[12px] font-bold text-white tracking-tight w-full mb-6 uppercase tracking-widest text-center">Phương thức thanh toán</h3>
          <div className="relative w-full h-40 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethodData.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1 text-center">Tổng</span>
              <span className="text-[14px] font-black text-white">{formatCurrency(paymentMethodData.total).replace(' đ', '')}</span>
            </div>
          </div>
          <div className="w-full space-y-3.5">
            {paymentMethodData.data.map((m, i) => (
              <div key={i} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", m.colorClass)} />
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors tracking-tight">{m.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-white">{m.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Budget Limit, Fixed vs Flexible & AI Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Limit */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[32px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col items-center relative overflow-hidden group">
          <h3 className="text-[12px] font-bold text-white w-full mb-4 flex justify-between items-center relative z-10">
            Giới hạn ngân sách
            <button 
              onClick={() => setIsEditingLimit(true)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </h3>
          <div className="relative w-36 h-36 mb-4 relative z-10 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <Pie 
                        data={[{ value: budgetUsage }, { value: Math.max(0, 100 - budgetUsage) }]} 
                        cx="50%"
                        cy="50%"
                        innerRadius="75%" 
                        outerRadius="95%" 
                        paddingAngle={0} 
                        dataKey="value" 
                        startAngle={90} 
                        endAngle={-270}
                        isAnimationActive={false}
                        stroke="none"
                    >
                        <Cell fill="#f43f5e" />
                        <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white">{budgetUsage}%</span>
            </div>
          </div>
          
          <div className="w-full text-[10px] space-y-2 mt-auto relative z-10">
              <div className="flex justify-between items-center p-2 bg-white/[0.02] rounded-lg">
                  <span className="text-slate-500 font-semibold">Ngân sách tháng</span>
                  <span className="text-white font-bold">{formatCurrency(budgetLimit)}</span>
              </div>
              <div className="flex justify-between items-center p-2">
                  <span className="text-slate-500 font-semibold">Đã chi tiêu</span>
                  <span className="text-rose-400 font-bold">{formatCurrency(totalExpense)}</span>
              </div>
              <div className="flex justify-between items-center p-2 border-t border-white/5">
                  <span className="text-slate-500 font-semibold">Còn lại</span>
                  <span className="text-white font-bold">{formatCurrency(remainingBudget)}</span>
              </div>
              {totalExpense > budgetLimit && (
                  <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[10px] font-bold">Vượt ngân sách {formatCurrency(totalExpense - budgetLimit)}</span>
                  </div>
              )}
          </div>

          <AnimatePresence>
            {isEditingLimit && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-20 bg-[#0f172a]/95 backdrop-blur-md rounded-[32px] flex flex-col p-6 border border-rose-500/30"
              >
                <p className="text-[12px] font-bold text-rose-400 uppercase tracking-widest mb-4">Sửa giới hạn ngân sách</p>
                <input 
                  autoFocus
                  type="number"
                  value={tempLimit}
                  onChange={(e) => setTempLimit(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-rose-500 transition-all font-bold mb-5"
                />
                <div className="flex gap-3 mt-auto">
                  <button 
                    onClick={() => setIsEditingLimit(false)}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[11px] font-bold transition-all"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={() => {
                      const val = parseInt(tempLimit);
                      if (!isNaN(val) && val >= 0) {
                        setExpenseLimit(val);
                      }
                      setIsEditingLimit(false);
                    }}
                    className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-[11px] font-bold transition-all"
                  >
                    Lưu
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fixed vs Flexible */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[32px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col items-center relative overflow-hidden">
          <h3 className="text-[12px] font-bold text-white tracking-tight w-full mb-6 uppercase tracking-widest text-center">Chi tiêu Cố định vs Linh hoạt</h3>
          <div className="relative w-full h-[180px] flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Cố định', value: fixedFlexibleData.fixed || (fixedFlexibleData.fixedAmount === 0 && fixedFlexibleData.flexibleAmount === 0 ? 50 : 0) },
                    { name: 'Linh hoạt', value: fixedFlexibleData.flexible || (fixedFlexibleData.fixedAmount === 0 && fixedFlexibleData.flexibleAmount === 0 ? 50 : 0) },
                  ]}
                  cx="50%"
                  cy="90%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={75}
                  outerRadius={115}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#f43f5e" />
                  <Cell fill="#4f46e5" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-[80px] left-1/2 -translate-x-1/2 flex gap-10 text-center pointer-events-none w-full justify-center">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} key={`fixed-${fixedFlexibleData.fixed}`}>
                <p className="text-xl font-black text-white tracking-tighter shrink-0">{fixedFlexibleData.fixed}%</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Cố định</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} key={`flex-${fixedFlexibleData.flexible}`}>
                <p className="text-xl font-black text-white tracking-tighter shrink-0">{fixedFlexibleData.flexible}%</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Linh hoạt</p>
              </motion.div>
            </div>
          </div>
          <div className="w-full mt-2 flex justify-between px-6">
             <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">{formatCurrency(fixedFlexibleData.fixedAmount)}</span>
                <span className="text-[8px] text-slate-600 font-bold uppercase">Bắt buộc</span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{formatCurrency(fixedFlexibleData.flexibleAmount)}</span>
                <span className="text-[8px] text-slate-600 font-bold uppercase">Tự do</span>
             </div>
          </div>
        </div>

        {/* AI Forecast */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[32px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-center mb-5 relative z-10">
            <h3 className="text-[12px] font-bold text-white tracking-tight flex items-center gap-2 uppercase tracking-widest">
                Dự báo chi tiêu <span className="text-[10px] font-black px-1.5 py-0.5 bg-indigo-500 text-white rounded-md uppercase tracking-widest">AI</span>
            </h3>
            <Bot className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="relative z-10 mb-3 flex justify-between items-end">
            <div>
              <p className="text-xl font-black text-white tracking-tighter mb-1">{formatCurrency(aiForecast.amount)}</p>
              <p className="text-[9px] text-slate-500 font-bold tracking-tight uppercase">Dự kiến tháng {getMonth(new Date()) + 1}</p>
            </div>
            <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg">
              <TrendingDown className={cn("w-3 h-3", parseFloat(aiForecast.trend) <= 0 ? "text-emerald-400" : "text-rose-400")} />
              <span className={cn("text-[9px] font-black", parseFloat(aiForecast.trend) <= 0 ? "text-emerald-400" : "text-rose-400")}>
                {parseFloat(aiForecast.trend) > 0 ? '+' : ''}{aiForecast.trend}%
              </span>
            </div>
          </div>
          
          <div className="flex-1 min-h-[160px] relative mt-4">
            <div className="absolute inset-0 opacity-10 blur-2xl bg-indigo-500/10 rounded-full scale-110 -z-10" />
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={[
                  { name: 'T3', current: 6500000, forecast: 6200000 },
                  { name: 'T4', current: 7200000, forecast: 6800000 },
                  { name: 'T5', current: 6800000, forecast: 7100000 },
                  { name: 'T6', forecast: 7500000 },
                  { name: 'T7', forecast: 8200000 },
                  { name: 'T8', forecast: 9500000 },
                  { name: 'T9', forecast: 11500000 }
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 9 }}
                  tickFormatter={(v) => v >= 1000000 ? `${v/1000000}tr` : v}
                />
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0f172a]/95 border border-white/10 p-2.5 rounded-xl shadow-2xl backdrop-blur-md">
                          <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase items-center flex gap-2">
                            <Bot className="w-3 h-3" /> {payload[0].payload.name}
                          </p>
                          {payload.map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between gap-4 mt-1">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                <span className="text-[9px] text-slate-400 font-bold uppercase">{p.name === 'current' ? 'Thực tế' : 'Dự báo'}</span>
                              </div>
                              <p className="text-[11px] font-black text-white">{formatCurrency(p.value as number)}</p>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#f43f5e" 
                  fill="url(#colorCurrent)" 
                  strokeWidth={3} 
                  dot={false}
                  name="current"
                />
                <Area 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#6366f1" 
                  strokeDasharray="5 5" 
                  fill="url(#colorForecast)" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: '#6366f1', strokeWidth: 1, stroke: '#080d19' }}
                  name="forecast"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Final Row: History Section */}
      <div id="expense-history" className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[32px] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col relative group scroll-mt-24">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 relative z-30">
          <h3 className="text-xl font-bold text-white tracking-tight">Lịch sử chi tiêu</h3>
            <div className="flex flex-wrap items-center gap-3 relative z-40">
              <div className="relative w-full sm:w-auto min-w-[240px] group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm giao dịch..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-900 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[12px] text-white focus:outline-none focus:border-indigo-500/50 w-full transition-all"
                />
              </div>
              <div className="relative">
                <button 
                  onClick={() => {
                      setTempSelectedCategories(selectedCategories);
                      setTempSelectedMethod(selectedMethod);
                      setIsFilterOpen(!isFilterOpen);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 bg-slate-900 border rounded-2xl text-[12px] font-bold transition-all",
                    isFilterOpen || selectedCategories.length > 0 || selectedMethod !== 'Tất cả phương thức'
                      ? "border-indigo-500/50 text-indigo-400"
                      : "border-white/5 text-slate-400 hover:text-white"
                  )}
                >
                  <Filter className="w-4 h-4" /> Bộ lọc
                  {(selectedCategories.length > 0 || selectedMethod !== 'Tất cả phương thức') && (
                    <span className="w-2 h-2 bg-indigo-500 rounded-full ml-1" />
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
                          className="absolute right-0 top-full mt-2 w-72 bg-[#0b1120] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden"
                      >
                          <div className="p-4 border-b border-white/5 flex items-center justify-between">
                              <h4 className="text-white font-bold text-sm">Bộ lọc giao dịch</h4>
                              <button 
                                  onClick={() => {
                                      setTempSelectedCategories([]);
                                      setTempSelectedMethod('Tất cả phương thức');
                                  }}
                                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] font-medium transition-colors"
                              >
                                  <X className="w-3 h-3" /> Đặt lại
                              </button>
                          </div>
                          <div className="p-5 space-y-6">
                              <div>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Danh mục</p>
                                  <div className="space-y-3">
                                      {categoryOptions.map((cat, idx) => {
                                          const predefinedCategories = ['Ăn uống', 'Đi lại', 'Mua sắm', 'Nhà ở', 'Giải trí'];
                                          const catCount = cat === 'Khác' 
                                              ? expenseTxs.filter(tx => !predefinedCategories.includes(tx.category)).length
                                              : expenseTxs.filter(tx => tx.category === cat).length;
                                          return (
                                          <label key={cat} className="flex items-center justify-between cursor-pointer group">
                                              <div className="flex items-center gap-3">
                                                  <input 
                                                      type="checkbox" 
                                                      className="hidden"
                                                      checked={tempSelectedCategories.includes(cat)}
                                                      onChange={(e) => {
                                                          if (e.target.checked) setTempSelectedCategories([...tempSelectedCategories, cat]);
                                                          else setTempSelectedCategories(tempSelectedCategories.filter(c => c !== cat));
                                                      }}
                                                  />
                                                  <div className={cn(
                                                      "w-4 h-4 rounded-[4px] border transition-all flex items-center justify-center",
                                                      tempSelectedCategories.includes(cat) ? "bg-rose-500 border-rose-500" : "bg-slate-900 border-white/10 group-hover:border-white/20"
                                                  )}>
                                                      {tempSelectedCategories.includes(cat) && <Check className="w-2.5 h-2.5 text-white" />}
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                      <span className={cn("text-[13px] font-semibold transition-colors", tempSelectedCategories.includes(cat) ? "text-white" : "text-slate-300 group-hover:text-white")}>{cat}</span>
                                                  </div>
                                              </div>
                                              <span className="text-[12px] font-medium text-slate-500">{catCount}</span>
                                          </label>
                                      )})}
                                  </div>
                              </div>

                              <div>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Phương thức thanh toán</p>
                                  <div className="relative">
                                      <select
                                          value={tempSelectedMethod}
                                          onChange={(e) => setTempSelectedMethod(e.target.value)}
                                          className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-[13px] font-semibold text-white appearance-none focus:outline-none focus:border-rose-500/50 transition-all cursor-pointer"
                                      >
                                          {methodOptions.map(method => (
                                              <option key={method} value={method}>{method}</option>
                                          ))}
                                      </select>
                                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                  </div>
                              </div>
                          </div>
                          
                          <div className="p-4 border-t border-white/5 flex items-center gap-3">
                              <button 
                                  onClick={() => {
                                      setTempSelectedCategories([]);
                                      setTempSelectedMethod('Tất cả phương thức');
                                      setSelectedCategories([]);
                                      setSelectedMethod('Tất cả phương thức');
                                      setIsFilterOpen(false);
                                  }}
                                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[12px] font-bold text-white transition-all"
                              >
                                  Đặt lại
                              </button>
                              <button 
                                  onClick={() => {
                                      setSelectedCategories(tempSelectedCategories);
                                      setSelectedMethod(tempSelectedMethod);
                                      setIsFilterOpen(false);
                                  }}
                                  className="flex-1 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-xl text-[12px] font-bold text-white transition-all"
                              >
                                  Áp dụng
                              </button>
                          </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <button className="p-3 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto -mx-1 px-1 relative z-0">
            <table className="w-full text-left text-[12px] whitespace-nowrap">
              <thead className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-white/5">
                <tr>
                  <th className="pb-5 font-bold">Ngày</th>
                  <th className="pb-5 font-bold">Nội dung</th>
                  <th className="pb-5 font-bold">Danh mục</th>
                  <th className="pb-5 font-bold text-right">Số tiền</th>
                  <th className="pb-5 font-bold px-8">Phương thức</th>
                  <th className="pb-5 font-bold text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {paginatedList.map((tx, idx) => (
                  <tr key={tx.id || idx} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="py-5 font-medium text-slate-500 tracking-tight">{format(parseISO(tx.date), 'dd/MM/yyyy')}</td>
                    <td className="py-5 font-bold text-white text-[13px]">{tx.description}</td>
                    <td className="py-5">
                      <span className={cn(
                        "border px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all text-center inline-block min-w-[80px]",
                        getCategoryStyles(tx.category)
                      )}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-5 font-bold text-rose-500 text-[14px] text-right">{formatCurrency(tx.amount)}</td>
                    <td className="py-5 text-slate-400 font-medium px-8">{tx.paymentMethod || '-'}</td>
                    <td className="py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setEditingTransaction(tx)}
                          className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredList.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(items) => {
              setItemsPerPage(items);
              setCurrentPage(1);
            }}
            layoutId="activePageExpense"
          />
      </div>

      <ExpenseModal 
        isOpen={isAdding || !!editingTransaction} 
        onClose={() => {
          setIsAdding(false);
          setEditingTransaction(null);
        }} 
        editingTransaction={editingTransaction}
      />
    </div>
  );
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: any | null;
}

function ExpenseModal({ isOpen, onClose, editingTransaction }: ExpenseModalProps) {
  const { addTransaction, updateTransaction } = useFinanceStore();
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    category: 'Ăn uống',
    paymentMethod: 'Tiền mặt',
    amount: ''
  });
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      const isCustom = !['Ăn uống', 'Đi lại', 'Mua sắm', 'Nhà ở', 'Giải trí'].includes(editingTransaction.category);
      setFormData({
        date: editingTransaction.date,
        description: editingTransaction.description,
        category: isCustom ? 'Khác' : editingTransaction.category,
        paymentMethod: editingTransaction.paymentMethod || 'Tiền mặt',
        amount: editingTransaction.amount.toString()
      });
      if (isCustom) setCustomCategory(editingTransaction.category);
    } else if (isOpen) {
        setFormData({
            date: format(new Date(), 'yyyy-MM-dd'),
            description: '',
            category: 'Ăn uống',
            paymentMethod: 'Tiền mặt',
            amount: ''
          });
        setCustomCategory('');
    }
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      category: formData.category === 'Khác' ? customCategory : formData.category,
      amount: parseFloat(formData.amount),
      type: 'expense' as const
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, data);
    } else {
      addTransaction(data);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[420px] bg-[#0f172a] border border-white/10 rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
                <h2 className="text-lg font-bold text-white tracking-tight">{editingTransaction ? 'Sửa' : 'Thêm'} chi phí</h2>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto scrollbar-hide">
                {/* Date */}
                <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 ml-1">Ngày</label>
                    <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
                        <input 
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 ml-1">Tiêu đề</label>
                    <input 
                        type="text"
                        required
                        placeholder="Nhập tiêu đề chi phí..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-5 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-all font-medium"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div className={cn("space-y-2 transition-all duration-300", formData.category === 'Khác' ? "col-span-2" : "col-span-1")}>
                        <label className="text-[12px] font-bold text-slate-400 ml-1">Danh mục</label>
                        <div className="flex flex-col gap-2">
                          <select 
                              value={formData.category}
                              onChange={(e) => setFormData({...formData, category: e.target.value})}
                              className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-5 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-all font-medium appearance-none cursor-pointer"
                          >
                              <option value="Ăn uống">Ăn uống</option>
                              <option value="Đi lại">Đi lại</option>
                              <option value="Mua sắm">Mua sắm</option>
                              <option value="Nhà ở">Nhà ở</option>
                              <option value="Giải trí">Giải trí</option>
                              <option value="Khác">Khác</option>
                          </select>
                          {formData.category === 'Khác' && (
                            <motion.input 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              type="text"
                              required
                              placeholder="Nhập danh mục khác..."
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              className="w-full bg-slate-900/50 border border-rose-500/30 rounded-xl py-3 px-5 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-all font-medium"
                            />
                          )}
                        </div>
                    </div>

                    {/* Method */}
                    <div className={cn("space-y-2 transition-all duration-300", formData.category === 'Khác' ? "col-span-2" : "col-span-1")}>
                        <label className="text-[12px] font-bold text-slate-400 ml-1">Phương thức</label>
                        <select 
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-5 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-all font-medium appearance-none cursor-pointer"
                        >
                            <option value="Tiền mặt">Tiền mặt</option>
                            <option value="Chuyển khoản">Chuyển khoản</option>
                            <option value="Ví điện tử">Ví điện tử</option>
                            <option value="Thẻ">Thẻ</option>
                        </select>
                    </div>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 ml-1">Số tiền (VNĐ)</label>
                    <input 
                        type="number"
                        required
                        placeholder="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-5 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-all font-medium"
                    />
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all active:scale-95 text-sm"
                    >
                        Hủy
                    </button>
                    <button 
                        type="submit"
                        className="py-3 bg-rose-500 hover:bg-rose-400 text-[#0f172a] rounded-xl font-black transition-all active:scale-95 text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30"
                    >
                        <Check className="w-5 h-5 flex-shrink-0" /> Lưu
                    </button>
                </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
