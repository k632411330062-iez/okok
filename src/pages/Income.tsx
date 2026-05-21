import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "../components/Header";
import { useFilteredData, formatCurrency, useTrends } from "../hooks/useMetrics";
import { useFinanceStore, Transaction } from "../store/useFinanceStore";
import { 
  Plus, Search, Trash2, Edit2, Download, 
  TrendingUp, TrendingDown, Wallet, Target, 
  Star, Activity, Layers, Bot, Filter, 
  ArrowRight, Briefcase, Coffee, ShoppingBag, 
  PiggyBank, Bus, Gamepad2, MoreHorizontal,
  ChevronDown, Calendar, ArrowUpRight, Sparkles,
  ShieldCheck, Smartphone, Landmark, CreditCard,
  Gamepad, BrainCircuit, Lightbulb, Zap, Rocket,
  X, Check, ChevronLeft, ChevronRight
} from "lucide-react";
import { format, parseISO, getMonth, differenceInDays, startOfMonth, subMonths, isWithinInterval, endOfMonth } from "date-fns";
import { cn } from "../lib/utils";
import { Pagination } from "../components/Pagination";
import { TransactionModal } from "../components/TransactionModal";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid
} from "recharts";
import { motion, AnimatePresence } from "motion/react";

const getTxStyle = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('lương')) return { icon: Briefcase, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/20' };
  if (cat.includes('freelance') || cat.includes('dự án')) return { icon: TrendingUp, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20' };
  if (cat.includes('đầu tư')) return { icon: Wallet, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20' };
  if (cat.includes('kinh doanh')) return { icon: ShoppingBag, colorClass: 'text-orange-400', bgClass: 'bg-orange-500/10', borderClass: 'border-orange-500/20' };
  if (cat.includes('thưởng')) return { icon: Star, colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/20' };
  return { icon: Layers, colorClass: 'text-indigo-400', bgClass: 'bg-indigo-500/10', borderClass: 'border-indigo-500/20' };
};

export default function Income() {
  const navigate = useNavigate();
  const { filteredTransactions, totalIncome } = useFilteredData();
  const { transactions, deleteTransaction, startDate, endDate, selectedPeriod, incomeGoal, setIncomeGoal } = useFinanceStore();
  const { incomeGrowth, dailyIncomeGrowth } = useTrends();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [timeRange, setTimeRange] = useState('Theo tháng');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('Tất cả phương thức');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(incomeGoal.toString());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  
  const comparisonLabel = useMemo(() => {
    switch (selectedPeriod) {
      case 'month': return 'tháng trước';
      case 'quarter': return 'quý trước';
      case 'year': return 'năm trước';
      default: return 'kỳ trước';
    }
  }, [selectedPeriod]);

  const incomeTxs = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'income').sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
    [filteredTransactions]
  );

  const categories = ['Lương chính', 'Freelance', 'Đầu tư', 'Thưởng', 'Khác'];
  const paymentMethods = ['Tất cả phương thức', 'Chuyển khoản', 'Tiền mặt', 'Ví điện tử', 'Thẻ'];

  const filteredList = useMemo(() => 
    incomeTxs.filter(t => {
      const predefinedCategories = ['Lương chính', 'Freelance', 'Đầu tư', 'Thưởng'];
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(t.category) ||
        (selectedCategories.includes('Khác') && !predefinedCategories.includes(t.category));
      const matchesMethod = selectedMethod === 'Tất cả phương thức' || t.paymentMethod === selectedMethod;
      
      return matchesSearch && matchesCategory && matchesMethod;
    }),
    [incomeTxs, searchTerm, selectedCategories, selectedMethod]
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategories, selectedMethod, incomeTxs]);

  // Paginate list
  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goalForPeriod = useMemo(() => {
    if (selectedPeriod === 'month') return incomeGoal;
    if (selectedPeriod === 'quarter') return incomeGoal * 3;
    if (selectedPeriod === 'year') return incomeGoal * 12;
    return incomeGoal; // default for custom for now
  }, [selectedPeriod, incomeGoal]);

  const goalLabel = useMemo(() => {
    if (selectedPeriod === 'month') return 'Mục tiêu tháng';
    if (selectedPeriod === 'quarter') return 'Mục tiêu quý';
    if (selectedPeriod === 'year') return 'Mục tiêu năm';
    return 'Mục tiêu';
  }, [selectedPeriod]);

  const percentageReached = Math.min(100, Math.round((totalIncome / goalForPeriod) * 100)) || 0;
  const remainingGoal = Math.max(0, goalForPeriod - totalIncome);

  const daysDiff = useMemo(() => Math.max(1, differenceInDays(endDate, startDate) + 1), [startDate, endDate]);
  const dailyAverage = totalIncome / daysDiff;
  
  const incomeByCategory = useMemo(() => {
    const groups: Record<string, number> = {};
    incomeTxs.forEach(tx => {
      groups[tx.category] = (groups[tx.category] || 0) + tx.amount;
    });
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [incomeTxs]);

  const currentTotalIncome = useMemo(() => 
    incomeByCategory.reduce((sum, item) => sum + item.value, 0),
    [incomeByCategory]
  );

  const maxIncomeDay = useMemo(() => {
    const dailyTotals: Record<string, number> = {};
    incomeTxs.forEach(tx => {
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
  }, [incomeTxs]);

  const minIncomeTx = useMemo(() => 
    incomeTxs.length > 0 ? [...incomeTxs].sort((a, b) => a.amount - b.amount)[0] : null
  , [incomeTxs]);

  const passiveIncome = useMemo(() => 
    incomeTxs.filter(tx => tx.category.toLowerCase().includes('đầu tư') || tx.category.toLowerCase().includes('tiết kiệm')).reduce((acc, tx) => acc + tx.amount, 0)
  , [incomeTxs]);

  const chartData = useMemo(() => {
    const txs = filteredTransactions.filter(t => t.type === 'income');
    if (txs.length === 0) return [];

    const data = [];
    
    // Helper to get start and end of current filtered range
    const minDate = Math.min(...txs.map(tx => parseISO(tx.date).getTime()));
    const maxDate = Math.max(...txs.map(tx => parseISO(tx.date).getTime()));
    const startRange = new Date(minDate);
    const endRange = new Date(maxDate);

    if (selectedPeriod === 'month') {
      // Group by weeks
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const end = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
      let current = new Date(start);
      let weekIdx = 1;
      
      while (current <= end) {
        let weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > end) weekEnd = end;
        
        const weekTxs = txs.filter(tx => {
          const date = parseISO(tx.date);
          return date >= current && date <= weekEnd;
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
        const quarterTxs = txs.filter(tx => {
          const m = getMonth(parseISO(tx.date));
          return Math.floor(m / 3) + 1 === q;
        });
        
        data.push({
          name: `Quý ${q}`,
          value: quarterTxs.reduce((s,t) => s + t.amount, 0)
        });
      }
    } else if (selectedPeriod === 'year') {
      // Group by months T1-T12
      for (let i = 0; i < 12; i++) {
        const monthTxs = txs.filter(tx => getMonth(parseISO(tx.date)) === i);
        data.push({
          name: `T${i + 1}`,
          value: monthTxs.reduce((s,t) => s + t.amount, 0)
        });
      }
    } else { // custom
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 60) {
        let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const end = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);

        while (current <= end) {
          const monthIndex = current.getMonth();
          const year = current.getFullYear();
          const monthTxs = txs.filter(tx => {
            const d = parseISO(tx.date);
            return d.getMonth() === monthIndex && d.getFullYear() === year;
          });
          
          data.push({
            name: `T${monthIndex + 1}/${year.toString().slice(-2)}`,
            value: monthTxs.reduce((s,t) => s + t.amount, 0)
          });
          
          current.setMonth(current.getMonth() + 1);
        }
      } else {
        let current = new Date(startDate);
        let weekIdx = 1;
        while (current <= endDate) {
          let weekEnd = new Date(current);
          weekEnd.setDate(weekEnd.getDate() + 6);
          if (weekEnd > endDate) weekEnd = new Date(endDate);
          
          const weekTxs = txs.filter(tx => {
            const date = parseISO(tx.date);
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const currentOnly = new Date(current.getFullYear(), current.getMonth(), current.getDate());
            const weekEndOnly = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59);
            return dateOnly >= currentOnly && date <= weekEndOnly;
          });

          data.push({
            name: `Đợt ${weekIdx}`, // "Khoảng" translated to "Đợt" or keep consistent
            value: weekTxs.reduce((s,t) => s + t.amount, 0)
          });
          
          current.setDate(current.getDate() + 7);
          weekIdx++;
        }
      }
    }
    
    return data;
  }, [filteredTransactions, selectedPeriod, startDate, endDate]);

  const growthAnalysis = useMemo(() => {
    if (chartData.length < 2) return { name: 'Chưa đủ dữ liệu', growth: 0 };
    
    // Calculate category-wise growth comparing last month vs month before
    const now = new Date();
    const lastMonth = startOfMonth(subMonths(now, 1));
    const prevMonth = startOfMonth(subMonths(now, 2));
    
    const lastMonthTxs = incomeTxs.filter(tx => {
      const d = parseISO(tx.date);
      return d >= lastMonth && d < startOfMonth(now);
    });
    
    const prevMonthTxs = incomeTxs.filter(tx => {
      const d = parseISO(tx.date);
      return d >= prevMonth && d < lastMonth;
    });

    const categories = Array.from(new Set(incomeTxs.map(tx => tx.category)));
    let maxGrowth = -Infinity;
    let topCategory = categories[0] || 'Chưa có';

    categories.forEach(cat => {
      const lastAmount = lastMonthTxs.filter(tx => tx.category === cat).reduce((s, t) => s + t.amount, 0);
      const prevAmount = prevMonthTxs.filter(tx => tx.category === cat).reduce((s, t) => s + t.amount, 0);
      
      if (prevAmount > 0) {
        const growth = ((lastAmount - prevAmount) / prevAmount) * 100;
        if (growth > maxGrowth) {
          maxGrowth = growth;
          topCategory = cat;
        }
      } else if (lastAmount > 0 && prevAmount === 0) {
        if (100 > maxGrowth) {
          maxGrowth = 100;
          topCategory = cat;
        }
      }
    });

    return { 
      name: topCategory, 
      growth: maxGrowth === -Infinity ? 0 : Math.round(maxGrowth)
    };
  }, [incomeTxs, chartData]);

  const aiForecast = useMemo(() => {
    if (chartData.length === 0) return { amount: 0, trend: "0.0" };
    
    // Average of active history points
    const meaningfulData = chartData.filter(d => d.value > 0);
    const avg = meaningfulData.length > 0 
      ? meaningfulData.reduce((s, d) => s + d.value, 0) / meaningfulData.length 
      : 0;
    
    // Trend compared to last point
    const lastVal = chartData[chartData.length - 1]?.value || 0;
    const trend = lastVal > 0 ? ((avg - lastVal) / lastVal) * 100 : 0;
    
    return { amount: Math.round(avg), trend: trend.toFixed(1) };
  }, [chartData]);

  const getCategoryBadgeStyles = (category: string) => {
    const cat = category.toLowerCase();
    
    // Vibrant Rainbow Palette - Extremely Distinct
    if (cat.includes('lương')) 
      return "bg-blue-600/25 border-blue-400/40 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:bg-blue-600/40";
    
    if (cat.includes('freelance') || cat.includes('dự án')) 
      return "bg-amber-600/25 border-amber-400/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:bg-amber-600/40";
    
    if (cat.includes('đầu tư')) 
      return "bg-emerald-600/25 border-emerald-400/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:bg-emerald-600/40";
    
    if (cat.includes('kinh doanh')) 
      return "bg-orange-600/25 border-orange-400/40 text-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.2)] group-hover:bg-orange-600/40";
    
    if (cat.includes('thưởng')) 
      return "bg-purple-600/25 border-purple-400/40 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)] group-hover:bg-purple-600/40";
    
    if (cat.includes('quà'))
      return "bg-rose-600/25 border-rose-400/40 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.2)] group-hover:bg-rose-600/40";

    if (cat.includes('khác'))
      return "bg-indigo-600/25 border-indigo-400/40 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:bg-indigo-600/40";

    return "bg-slate-700/50 border-white/20 text-slate-200 group-hover:border-indigo-500/40 group-hover:text-white";
  };

  // Handle scroll to history if hash is present
  const location = useLocation();
  useEffect(() => {
    if (location.hash === '#income-history') {
      const element = document.getElementById('income-history');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    }
  }, [location.hash]);

  const incomeAdvice = useMemo(() => {
    if (totalIncome >= goalForPeriod) return "Tuyệt vời! Bạn đã vượt mục tiêu thu nhập tháng này. Hãy cân nhắc tiết kiệm hoặc đầu tư thêm số thặng dư.";
    return `Bạn cần thêm ${formatCurrency(remainingGoal)} để đạt mục tiêu tháng này. Hãy tiếp tục cố gắng, bạn đang đi đúng hướng!`;
  }, [totalIncome, goalForPeriod, remainingGoal]);

  return (
    <div className="space-y-8 pb-12">
      <Header 
        title="Thu nhập" 
        subtitle="Quản lý chi tiết các khoản thu nhập của bạn."
        icon={<TrendingUp className="h-7 w-7 text-emerald-400" />}
      >
        <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 md:px-3 h-[36px] md:h-9 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 text-[10px] md:text-[11px] whitespace-nowrap"
        >
            <Plus className="w-3.5 h-3.5" /> 
            Thêm thu nhập
            <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
        </button>
      </Header>

      {/* Top 5 Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng thu nhập', value: totalIncome, trend: `${incomeGrowth >= 0 ? '+' : '-'}${Math.abs(incomeGrowth)}% so với ${comparisonLabel}`, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10', chartColor: '#10b981' },
          { label: 'Thu nhập trung bình / ngày', value: Math.round(dailyAverage), trend: `${dailyIncomeGrowth >= 0 ? '+' : '-'}${Math.abs(dailyIncomeGrowth)}% so với ${comparisonLabel}`, icon: Activity, color: 'text-sky-400', bg: 'bg-sky-500/10', chartColor: '#38bdf8' },
          { label: 'Nguồn thu nhập', value: incomeByCategory.length, suffix: ' mục', trend: '', icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10', chartColor: '#f59e0b' },
          { label: 'Ngày thu nhiều nhất', value: maxIncomeDay.amount || 0, trend: maxIncomeDay.date ? format(parseISO(maxIncomeDay.date), 'dd/MM/yyyy') : 'Chưa có dữ liệu', icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10', chartColor: '#a855f7' },
        ].map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
             className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-3 relative z-10">
              <span className="text-[13px] font-medium text-slate-400">{card.label}</span>
              <div className={cn("p-2 rounded-xl", card.bg)}>
                <card.icon className={cn("w-4 h-4", card.color)} />
              </div>
            </div>
            <div className="mb-2 relative z-10">
                <span className="text-xl font-bold text-white">
                    {card.suffix ? `${card.value}${card.suffix}` : formatCurrency(card.value)}
                </span>
            </div>
            <p className={cn("text-[11px] font-medium relative z-10", (i === 0 && incomeGrowth >= 0) || (i === 1 && dailyIncomeGrowth >= 0) || i === 4 ? "text-emerald-400" : (i === 0 && incomeGrowth < 0) || (i === 1 && dailyIncomeGrowth < 0) ? "text-rose-400" : "text-slate-500")}>
                {i === 0 ? (
                  incomeGrowth >= 0 ? <TrendingUp className="inline w-3 h-3 mr-1 mb-0.5" /> : <TrendingDown className="inline w-3 h-3 mr-1 mb-0.5" />
                ) : i === 1 ? (
                  dailyIncomeGrowth >= 0 ? <TrendingUp className="inline w-3 h-3 mr-1 mb-0.5" /> : <TrendingDown className="inline w-3 h-3 mr-1 mb-0.5" />
                ) : i === 4 ? <TrendingUp className="inline w-3 h-3 mr-1 mb-0.5" /> : null}
                {card.trend}
            </p>

            {/* Micro Chart */}
            <div className="absolute bottom-0 left-0 right-0 h-10 opacity-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <filter id={`micro-glow-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="1" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={card.chartColor} stopOpacity={0.4}/>
                      <stop offset="100%" stopColor={card.chartColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={card.chartColor}
                    strokeWidth={0.8}
                    fill={`url(#gradient-${i})`}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                    filter={`url(#micro-glow-${i})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-6 bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="text-[15px] font-bold text-white tracking-tight">Thu nhập theo thời gian</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 bg-slate-900 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-2 text-[10px] font-bold">
                        <Download className="w-3.5 h-3.5" /> Xuất báo cáo
                    </button>
                </div>
            </div>

            <div className="flex-1 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#475569', fontSize: 10, fontWeight: 'medium'}} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#475569', fontSize: 10, fontWeight: 'medium'}}
                            tickFormatter={(v) => v >= 1000000 ? `${v/1000000}tr` : v}
                        />
                        <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                            itemStyle={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
                            formatter={(v: any) => [`${formatCurrency(v)}`, 'Thu nhập']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#10b981" 
                            strokeWidth={4} 
                            fill="url(#chartGradient)" 
                            dot={false}
                            activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Thống kê nhanh Column */}
        <div className="lg:col-span-4 bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300">
            <h3 className="text-[13px] font-bold text-white mb-6">Thống kê nhanh</h3>
            <div className="space-y-5">
                {[
                    { label: 'Giao dịch thu nhập', value: `${incomeTxs.length} giao dịch`, icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                    { label: 'Ngày thu nhiều nhất', value: formatCurrency(maxIncomeDay.amount || 0), subtitle: maxIncomeDay.date ? format(parseISO(maxIncomeDay.date), 'dd/MM/yyyy') : 'Chưa có dữ liệu', icon: Rocket, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Giao dịch nhỏ nhất', value: formatCurrency(minIncomeTx?.amount || 0), subtitle: minIncomeTx?.description, icon: Zap, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                    { label: 'Thu nhập thụ động', value: formatCurrency(passiveIncome), subtitle: 'Đầu tư & Tiết kiệm', icon: PiggyBank, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-xl", item.bg)}>
                            <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                        </div>
                        <div className="flex-1 flex justify-between items-center text-[11px]">
                            <div>
                                <p className="text-slate-400 font-medium leading-none">{item.label}</p>
                                {item.subtitle && <p className="text-[9px] text-slate-500 mt-1">{item.subtitle}</p>}
                            </div>
                            <p className={cn("font-bold", i === 1 ? "text-emerald-400" : "text-white whitespace-nowrap")}>{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Row of Insights: Source Structure & Income Goal */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Nguồn thu nhập Card */}
        <div className="lg:col-span-6 bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[32px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col relative overflow-hidden group">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />
            
            <h3 className="text-sm font-bold text-white mb-6 tracking-tight flex items-center gap-2.5 relative z-10">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <Target className="w-4 h-4 text-emerald-400" />
                </div>
                Cơ cấu nguồn thu
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center flex-1 relative z-10">
                <div className="h-[180px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <defs>
                                {incomeByCategory.map((_, index) => (
                                    <filter key={`glow-source-${index}`} id={`glow-source-${index}`} x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                ))}
                            </defs>
                            <Pie
                                data={incomeByCategory}
                                cx="50%"
                                cy="50%"
                                innerRadius="55%"
                                outerRadius="75%"
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                                animationBegin={0}
                                animationDuration={1000}
                            >
                                {incomeByCategory.map((entry, index) => {
                                    const style = getTxStyle(entry.name);
                                    const color = style.colorClass === 'text-blue-400' ? '#60a5fa' :
                                                 style.colorClass === 'text-amber-400' ? '#fbbf24' :
                                                 style.colorClass === 'text-emerald-400' ? '#34d399' :
                                                 style.colorClass === 'text-orange-400' ? '#fb923c' :
                                                 style.colorClass === 'text-purple-400' ? '#a78bfa' : '#818cf8';
                                    return (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={color}
                                            filter={`url(#glow-source-${index})`}
                                            className="outline-none"
                                        />
                                    );
                                })}
                            </Pie>
                            <RechartsTooltip 
                                contentStyle={{ 
                                    backgroundColor: '#0f172a', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    borderRadius: '12px'
                                }}
                                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                formatter={(v: any) => [formatCurrency(v), 'Thu nhập']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-black text-white">{formatCurrency(currentTotalIncome)}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {incomeByCategory.slice(0, 4).map((source, idx) => {
                        const style = getTxStyle(source.name);
                        const percentage = currentTotalIncome > 0 ? (source.value / currentTotalIncome) * 100 : 0;
                        return (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", style.bgClass.replace('/10', ''))} />
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-white uppercase tracking-wide">{source.name}</span>
                                        <span className="text-[9px] text-slate-500 font-medium">{percentage.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <span className="text-[11px] font-black text-slate-300">{formatCurrency(source.value)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Goal Card */}
        <div className="lg:col-span-4 bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[32px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col relative overflow-hidden group">
            <h3 className="text-sm font-bold text-white mb-6 tracking-tight flex justify-between items-center relative z-10">
                Mục tiêu thu nhập
                <button 
                  onClick={() => {
                    setTempGoal(incomeGoal.toString());
                    setIsEditingGoal(true);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
            </h3>
            
            <div className="flex items-center gap-6 flex-1 relative z-10">
                <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={[{ value: percentageReached }, { value: Math.max(0, 100 - percentageReached) }]} 
                                cx="50%"
                                cy="50%"
                                innerRadius="70%" 
                                outerRadius="90%" 
                                paddingAngle={0} 
                                dataKey="value" 
                                startAngle={90} 
                                endAngle={-270}
                                isAnimationActive={false}
                                stroke="none"
                            >
                                <Cell fill="#10b981" />
                                <Cell fill="rgba(255,255,255,0.05)" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-black text-white">{percentageReached}%</span>
                    </div>
                </div>

                <div className="flex-1 space-y-2.5">
                    <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{goalLabel}</span>
                        <span className="text-[11px] text-white font-bold">{formatCurrency(goalForPeriod)}</span>
                    </div>
                    <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Đã đạt được</span>
                        <span className="text-[11px] text-emerald-400 font-bold">{formatCurrency(totalIncome)}</span>
                    </div>
                </div>
            </div>

            <AnimatePresence>
              {isEditingGoal && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-[#080d19]/95 backdrop-blur-md flex flex-col p-6 items-center justify-center"
                >
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] mb-4">Mục tiêu thu nhập (tháng)</p>
                  <input 
                    autoFocus
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-500/20 rounded-2xl py-3 px-4 text-white text-lg focus:outline-none focus:border-emerald-500 transition-all font-black text-center mb-6"
                  />
                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setIsEditingGoal(false)}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[11px] font-bold transition-all"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={() => {
                        setIncomeGoal(parseFloat(tempGoal) || 0);
                        setIsEditingGoal(false);
                      }}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold transition-all"
                    >
                      Xác nhận
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </div>

      {/* Row of 3 Cards: Growth, Prediction, AI Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strong Growth Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 relative overflow-hidden group">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 relative z-10">Tăng mạnh nhất</h3>
            <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                    <h4 className="text-[14px] font-bold text-white tracking-tight">{growthAnalysis.name}</h4>
                    <div className="flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3 text-emerald-400 stroke-[3px]" />
                        <span className="text-[16px] font-black text-emerald-400">+{growthAnalysis.growth}%</span>
                    </div>
                </div>
            </div>
            
            {/* Minimal Sparkline */}
            <div className="h-10 -mx-5 -mb-5 relative opacity-30 group-hover:opacity-60 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                        { v: 30 }, { v: 25 }, { v: 45 }, { v: 40 }, { v: 75 }, { v: 70 }, { v: 95 }
                    ]}>
                        <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Prediction Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 relative overflow-hidden group">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 relative z-10">Dự đoán kỳ tới</h3>
            <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                    <h4 className="text-[14px] font-bold text-white tracking-tight">Kỳ vọng trung bình</h4>
                    <div className="flex items-center gap-1">
                        <span className="text-[16px] font-black text-indigo-400">{formatCurrency(aiForecast.amount)}</span>
                        <span className={cn("text-[10px] font-bold ml-1", parseFloat(aiForecast.trend) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {parseFloat(aiForecast.trend) >= 0 ? '+' : ''}{aiForecast.trend}%
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="h-10 -mx-5 -mb-5 relative opacity-30 group-hover:opacity-60 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                        { v: 50 }, { v: 60 }, { v: 55 }, { v: 80 }, { v: 75 }, { v: 90 }, { v: 85 }
                    ]}>
                        <Area type="monotone" dataKey="v" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* AI Tip Card */}
        <div className="bg-indigo-600/5 backdrop-blur-xl border border-indigo-500/20 rounded-[24px] p-5 shadow-xl relative overflow-hidden group transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-indigo-400" />
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Mẹo AI</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium line-clamp-3">
                {incomeAdvice}
            </p>
            <button 
                onClick={() => navigate('/app/ai-advisor')}
                className="mt-3 text-[10px] font-bold text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors uppercase tracking-widest">
                Phân tích sâu <ArrowRight className="w-3 h-3" />
            </button>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-12 h-12 text-white" />
            </div>
        </div>
      </div>


      <div id="income-history" className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[32px] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.35)] transition-all duration-300 relative group scroll-mt-24">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative z-30">
              <h3 className="text-lg font-bold text-white tracking-tight shrink-0">Lịch sử thu nhập</h3>
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto relative z-40">
                  <div className="relative flex-1 lg:flex-none min-w-[200px] group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input 
                          type="text" 
                          placeholder="Tìm kiếm giao dịch..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[12px] text-white focus:outline-none focus:border-indigo-500/50 w-full transition-all"
                      />
                  </div>
                  <div className="relative shrink-0 z-50">
                      <button 
                          onClick={() => setIsFilterOpen(!isFilterOpen)}
                          className={cn(
                              "flex items-center gap-2.5 px-6 py-3 bg-slate-900 border rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-lg cursor-pointer",
                              isFilterOpen || selectedCategories.length > 0 || selectedMethod !== 'Tất cả phương thức'
                                  ? "bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/20"
                                  : "border-white/5 text-slate-400 hover:text-white"
                          )}
                      >
                          <Filter className="w-4 h-4" /> Bộ lọc
                          {(selectedCategories.length > 0 || selectedMethod !== 'Tất cả phương thức') && (
                              <span className="ml-1 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">
                                  {(selectedCategories.length > 0 ? 1 : 0) + (selectedMethod !== 'Tất cả phương thức' ? 1 : 0)}
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
                                                      setSelectedMethod('Tất cả phương thức');
                                                  }}
                                                  className="text-[10px] font-black text-indigo-500 uppercase hover:underline cursor-pointer"
                                              >
                                                  Xóa tất cả
                                              </button>
                                          </div>
                                          <div>
                                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Danh mục</p>
                                              <div className="space-y-2">
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
                                                              <span className={cn("text-[13px] font-medium transition-colors", selectedCategories.includes(cat) ? "text-white" : "text-slate-300 group-hover:text-white")}>{cat}</span>
                                                          </div>
                                                      </label>
                                                  ))}
                                              </div>
                                          </div>

                                          <div>
                                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Phương thức thanh toán</p>
                                              <div className="space-y-2">
                                                  {paymentMethods.map(method => (
                                                      <label key={method} className="flex items-center justify-between cursor-pointer group">
                                                          <div className="flex items-center gap-3">
                                                              <div className={cn(
                                                                  "w-4 h-4 rounded-full border transition-all flex items-center justify-center",
                                                                  selectedMethod === method ? "bg-indigo-500 border-indigo-500" : "border-white/10 group-hover:border-white/20"
                                                              )}>
                                                                  <input 
                                                                      type="radio" 
                                                                      name="paymentMethod"
                                                                      className="hidden"
                                                                      checked={selectedMethod === method}
                                                                      onChange={() => setSelectedMethod(method)}
                                                                  />
                                                                  {selectedMethod === method && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                              </div>
                                                              <span className={cn("text-[13px] font-medium transition-colors", selectedMethod === method ? "text-white" : "text-slate-300 group-hover:text-white")}>{method}</span>
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
                  <button className="p-3 bg-slate-900/50 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all hover:bg-slate-900">
                      <Download className="w-4 h-4" />
                  </button>
              </div>
          </div>

          <div className="overflow-x-auto -mx-1 px-1 relative z-0">
              <table className="w-full text-left text-[12px] whitespace-nowrap">
                  <thead className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-white/5">
                      <tr>
                          <th className="pb-5 font-bold">Ngày</th>
                          <th className="pb-5 font-bold">Nguồn thu</th>
                          <th className="pb-5 font-bold">Danh mục</th>
                          <th className="pb-5 font-bold text-right">Số tiền</th>
                          <th className="pb-5 font-bold px-8">Phương thức</th>
                          <th className="pb-5 font-bold text-center">Thao tác</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                      <AnimatePresence mode="popLayout">
                          {paginatedList.map((tx, idx) => (
                              <motion.tr 
                                  key={tx.id || idx} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.2 }}
                                  className="group hover:bg-white/[0.01] transition-colors"
                              >
                                  <td className="py-5 font-medium text-slate-500 tracking-tight">{format(parseISO(tx.date), 'dd/MM/yyyy')}</td>
                                  <td className="py-5 font-bold text-white text-[13px]">{tx.description}</td>
                                  <td className="py-5">
                                      <span className={cn(
                                        "border px-3 py-1 rounded-xl text-[9px] font-black transition-all uppercase tracking-wider text-center inline-block min-w-[80px]",
                                        getCategoryBadgeStyles(tx.category)
                                      )}>
                                        {tx.category}
                                      </span>
                                  </td>
                                  <td className="py-5 font-bold text-emerald-400 text-[14px] text-right">{formatCurrency(tx.amount)}</td>
                                  <td className="py-5 text-slate-400 font-medium px-8">{tx.paymentMethod}</td>
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
                              </motion.tr>
                          ))}
                      </AnimatePresence>
                  </tbody>
              </table>
          </div>

          <div className="relative z-10">
            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(items) => {
                    setItemsPerPage(items);
                    setCurrentPage(1);
                }}
                layoutId="activePageIncome"
            />
          </div>
      </div>

      
      <IncomeModal 
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

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

function IncomeModal({ isOpen, onClose, editingTransaction }: IncomeModalProps) {
  const { addTransaction, updateTransaction } = useFinanceStore();
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    category: 'Lương',
    paymentMethod: 'Chuyển khoản',
    amount: ''
  });
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      const isCustom = !['Lương', 'Freelance', 'Đầu tư', 'Kinh doanh'].includes(editingTransaction.category);
      setFormData({
        date: editingTransaction.date,
        description: editingTransaction.description,
        category: isCustom ? 'Khác' : editingTransaction.category,
        paymentMethod: editingTransaction.paymentMethod,
        amount: editingTransaction.amount.toString()
      });
      if (isCustom) setCustomCategory(editingTransaction.category);
    } else if (isOpen) {
        setFormData({
            date: format(new Date(), 'yyyy-MM-dd'),
            description: '',
            category: 'Lương',
            paymentMethod: 'Chuyển khoản',
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
      type: 'income' as const
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
            className="relative w-full max-w-[380px] bg-[#0f172a] border border-white/10 rounded-[24px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
                <h2 className="text-lg font-bold text-white tracking-tight">{editingTransaction ? 'Sửa' : 'Thêm'} thu nhập</h2>
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
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                        <input 
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <label className="text-[12px] font-bold text-slate-400 ml-1">Tiêu đề</label>
                    <input 
                        type="text"
                        required
                        placeholder="Nhập tiêu đề thu nhập..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
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
                              className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-medium appearance-none cursor-pointer"
                          >
                              <option value="Lương">Lương</option>
                              <option value="Freelance">Freelance</option>
                              <option value="Đầu tư">Đầu tư</option>
                              <option value="Kinh doanh">Kinh doanh</option>
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
                              className="w-full bg-slate-900/50 border border-emerald-500/30 rounded-xl py-3 px-5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                            />
                          )}
                        </div>
                    </div>

            {/* Method */}
            <div className="space-y-2 col-span-1">
                <label className="text-[12px] font-bold text-slate-400 ml-1">Phương thức</label>
                <select 
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-medium appearance-none cursor-pointer"
                >
                            <option value="Chuyển khoản">Chuyển khoản</option>
                            <option value="Tiền mặt">Tiền mặt</option>
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
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 px-5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
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
                        className="py-3 bg-emerald-500 hover:bg-emerald-400 text-[#0f172a] rounded-xl font-black transition-all active:scale-95 text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
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
