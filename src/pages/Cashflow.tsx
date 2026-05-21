import { useState, useMemo, useEffect } from "react";
import { Header } from "../components/Header";
import { useFilteredData, formatCurrency, useTrends } from "../hooks/useMetrics";
import { useFinanceStore } from "../store/useFinanceStore";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowRightLeft, Wallet, 
  Search,
  ArrowUp, ArrowDown, Activity, Filter, TrendingUp, TrendingDown,
  Check, Calculator, Download, ChevronDown, X
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, CartesianGrid, Legend, LineChart, Line
} from "recharts";
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { Pagination } from "../components/Pagination";

export default function Cashflow() {
  const navigate = useNavigate();
  const { totalIncome, totalExpense, netCashFlow, filteredTransactions } = useFilteredData();
  const { transactions, selectedPeriod, selectedDate } = useFinanceStore();
  const { incomeGrowth, expenseGrowth, cashflowGrowth } = useTrends();

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('Tất cả phương thức');

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

  const chartData = useMemo(() => {
    let buckets: { name: string; income: number; expense: number; net: number; match: (date: Date) => boolean }[] = [];

    if (selectedPeriod === 'month') {
      buckets = [
        { name: 'Tuần 1', income: 0, expense: 0, net: 0, match: (d) => d.getDate() <= 7 },
        { name: 'Tuần 2', income: 0, expense: 0, net: 0, match: (d) => d.getDate() > 7 && d.getDate() <= 14 },
        { name: 'Tuần 3', income: 0, expense: 0, net: 0, match: (d) => d.getDate() > 14 && d.getDate() <= 21 },
        { name: 'Tuần 4', income: 0, expense: 0, net: 0, match: (d) => d.getDate() > 21 && d.getDate() <= 28 },
        { name: 'Tuần 5', income: 0, expense: 0, net: 0, match: (d) => d.getDate() > 28 },
      ];
    } else if (selectedPeriod === 'quarter') {
      buckets = [1, 2, 3, 4].map(q => ({
        name: `Quý ${q}`,
        income: 0, expense: 0, net: 0,
        match: (d) => Math.floor(d.getMonth() / 3) + 1 === q
      }));
    } else if (selectedPeriod === 'year') {
      buckets = Array.from({ length: 12 }).map((_, i) => ({
        name: `T${i + 1}`,
        income: 0, expense: 0, net: 0,
        match: (d) => d.getMonth() === i
      }));
    } else {
      buckets = Array.from({ length: 12 }).map((_, i) => ({
        name: `T${i + 1}`,
        income: 0, expense: 0, net: 0,
        match: (d) => d.getMonth() === i
      }));
    }

    filteredTransactions.forEach(tx => {
      const d = parseISO(tx.date);
      const bucket = buckets.find(b => b.match(d));
      if (bucket) {
        if (tx.type === 'income') {
          bucket.income += tx.amount;
        } else {
          bucket.expense += tx.amount;
        }
        bucket.net = bucket.income - bucket.expense;
      }
    });

    return buckets;
  }, [filteredTransactions, selectedPeriod, selectedDate]);

  const categories = ['Lương chính', 'Freelance', 'Đầu tư', 'Thưởng', 'Ăn uống', 'Đi lại', 'Mua sắm', 'Nhà ở', 'Giải trí', 'Khác'];

  const paymentMethods = useMemo(() => {
    return ['Tất cả phương thức', 'Tiền mặt', 'Chuyển khoản', 'Ví điện tử', 'Thẻ'];
  }, []);

  const filteredList = useMemo(() => 
    filteredTransactions.filter(t => {
      const predefinedCategories = ['Lương chính', 'Freelance', 'Đầu tư', 'Thưởng', 'Ăn uống', 'Đi lại', 'Mua sắm', 'Nhà ở', 'Giải trí'];
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(t.category) ||
        (selectedCategories.includes('Khác') && !predefinedCategories.includes(t.category));
      const matchesMethod = selectedMethod === 'Tất cả phương thức' || t.paymentMethod === selectedMethod;
      const matchesTab = activeTab === 'all' || t.type === activeTab;
      
      return matchesSearch && matchesCategory && matchesMethod && matchesTab;
    }).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
    [filteredTransactions, searchTerm, selectedCategories, selectedMethod, activeTab]
  );

  // Reset pagination when filters or tabs change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategories, selectedMethod, filteredTransactions, activeTab]);

  // Paginate list
  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#38bdf8', '#a855f7'];

  const getTxStyle = (category: string, type: 'income' | 'expense') => {
    const cat = category.toLowerCase();
    if (type === 'income') return { icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (cat.includes('ăn uống')) return { icon: Activity, color: 'text-rose-400', bg: 'bg-rose-500/10' };
    if (cat.includes('di chuyển')) return { icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' };
    return { icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10' };
  };

  const summaryData = useMemo(() => {
    return [0, 1, 2].map(i => {
      const date = subMonths(new Date(), i);
      const label = `Tháng ${format(date, 'M/yyyy')}`;
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthlyTxs = transactions.filter(tx => {
        const d = parseISO(tx.date);
        return isWithinInterval(d, { start, end });
      });

      const income = monthlyTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = monthlyTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const net = income - expense;

      return { label, income, expense, net };
    });
  }, [transactions]);

  // Handle scroll to history if hash is present
  const location = useLocation();
  useEffect(() => {
    if (location.hash === '#transaction-history') {
      const element = document.getElementById('transaction-history');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    }
  }, [location.hash]);

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
    
    return "bg-slate-700/50 border-white/20 text-slate-200 group-hover:border-indigo-500/40 group-hover:text-white";
  };

  return (
    <div className="space-y-6 pb-20">
      <Header 
        title="Dòng tiền" 
        subtitle="Phân tích tình hình thu chi và thặng dư tài chính." 
        icon={<ArrowRightLeft className="h-7 w-7 text-amber-400" />} 
      />

      {/* Formula Header Section */}
      <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-[24px] p-3 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
                  <Calculator className="w-4 h-4" />
              </div>
              <span className="text-[12px] font-bold text-slate-300 uppercase tracking-widest leading-none">Công thức:</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 font-black text-sm md:text-base">
              <span className="text-white">Dòng tiền ròng</span>
              <span className="text-slate-500">=</span>
              <span className="text-emerald-400">Tổng thu nhập</span>
              <span className="text-slate-500">-</span>
              <span className="text-rose-400">Tổng chi tiêu</span>
          </div>
      </div>

      {/* Row 1: Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Income */}
        <div className="bg-[#0f172a]/80 border border-white/10 rounded-[32px] p-6 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="text-[10px] font-black uppercase tracking-widest">Tổng thu nhập</span>
              </div>
              <p className="text-2xl font-black text-white tracking-tighter">
                {formatCurrency(totalIncome)}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                {incomeGrowth >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-[#00ff9d]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#ff3068]" />}
                <span className={cn(incomeGrowth >= 0 ? "text-[#00ff9d]" : "text-[#ff3068]")}>
                  {incomeGrowth >= 0 ? '+' : '-'}{Math.abs(incomeGrowth)}% <span className="text-slate-500 font-medium whitespace-nowrap">so với {comparisonLabel}</span>
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)] group-hover:scale-110 transition-transform">
              <ArrowUp className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-[#0f172a]/80 border border-white/10 rounded-[32px] p-6 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="text-[10px] font-black uppercase tracking-widest">Tổng chi tiêu</span>
              </div>
              <p className="text-2xl font-black text-white tracking-tighter">
                {formatCurrency(totalExpense)}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                {expenseGrowth >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-[#00ff9d]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#ff3068]" />}
                <span className={cn(expenseGrowth >= 0 ? "text-[#00ff9d]" : "text-[#ff3068]")}>
                  {expenseGrowth >= 0 ? '+' : '-'}{Math.abs(expenseGrowth)}% <span className="text-slate-500 font-medium whitespace-nowrap">so với {comparisonLabel}</span>
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)] group-hover:scale-110 transition-transform">
              <ArrowDown className="w-6 h-6 text-rose-400" />
            </div>
          </div>
        </div>

        {/* Net Cashflow */}
        <div className="bg-[#0f172a]/80 border border-white/10 rounded-[32px] p-6 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="text-[10px] font-black uppercase tracking-widest">Dòng tiền ròng</span>
              </div>
              <p className="text-2xl font-black text-indigo-400 tracking-tighter">
                {formatCurrency(netCashFlow)}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                {cashflowGrowth >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-[#00ff9d]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#ff3068]" />}
                <span className={cn(cashflowGrowth >= 0 ? "text-[#00ff9d]" : "text-[#ff3068]")}>
                  {cashflowGrowth >= 0 ? '+' : '-'}{Math.abs(cashflowGrowth)}% <span className="text-slate-500 font-medium whitespace-nowrap">so với {comparisonLabel}</span>
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)] group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Thu vs Chi - BarChart */}
        <div className="bg-[#0f172a]/80 border border-white/10 rounded-[32px] p-6 shadow-2xl flex flex-col hover:border-white/20 transition-all">
           <h3 className="text-[15px] font-bold text-white mb-6 uppercase tracking-widest">Thu vs Chi</h3>
           <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}tr`} />
                    <RechartsTooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                      formatter={(val: number) => formatCurrency(val)}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '24px', fontWeight: 500, color: '#e2e8f0' }} />
                    <Bar dataKey="expense" name="Chi tiêu" fill="#ff3068" radius={[4, 4, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="income" name="Thu nhập" fill="#00ff9d" radius={[4, 4, 0, 0]} maxBarSize={20} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Chart 2: Dòng tiền ròng - LineChart */}
        <div className="bg-[#0f172a]/80 border border-white/10 rounded-[32px] p-6 shadow-2xl flex flex-col hover:border-white/20 transition-all">
           <h3 className="text-[15px] font-bold text-white mb-6 uppercase tracking-widest">Dòng tiền ròng</h3>
           <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}tr`} />
                    <RechartsTooltip 
                      cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                      formatter={(val: number) => formatCurrency(val)}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '24px', fontWeight: 500, color: '#e2e8f0' }} />
                    <Line type="monotone" dataKey="net" name="Dòng tiền ròng" stroke="#00ff9d" strokeWidth={3} dot={{ r: 4, fill: '#00ff9d', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6, fill: '#0f172a', stroke: '#00ff9d', strokeWidth: 2 }} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Row 3: Summary Table */}
      <div className="bg-[#0f172a]/80 border border-white/10 rounded-[32px] p-8 shadow-2xl flex flex-col hover:border-white/20 transition-all">
        <h3 className="text-[14px] font-bold text-white mb-8 tracking-tight flex items-center gap-3 uppercase tracking-widest">
          Bảng tổng hợp
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] border-b border-white/5 italic">
                <th className="pb-6 px-4">KỲ</th>
                <th className="pb-6 px-4 text-center">TỔNG THU</th>
                <th className="pb-6 px-4 text-center">TỔNG CHI</th>
                <th className="pb-6 px-4 text-right">DÒNG TIỀN RÒNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {summaryData.map((row, i) => (
                <tr key={i} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="py-6 px-4 font-bold text-white text-[13px]">{row.label}</td>
                  <td className="py-6 px-4 text-center">
                    <span className="text-[13px] font-bold text-sky-400">+{formatCurrency(row.income)}</span>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span className="text-[13px] font-bold text-rose-500">-{formatCurrency(row.expense)}</span>
                  </td>
                  <td className="py-6 px-4 text-right">
                    <span className={cn("text-[13px] font-black", row.net >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {row.net >= 0 ? '+' : ''}{formatCurrency(row.net)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Transaction History Section */}
      <div id="transaction-history" className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-[32px] p-8 shadow-xl scroll-mt-24">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative z-30">
                <div className="space-y-4 shrink-0">
                    <h3 className="text-xl font-bold text-white tracking-tight uppercase tracking-widest">Lịch sử giao dịch</h3>
                    <div className="flex p-1 bg-slate-900 rounded-xl border border-white/5 w-fit">
                        {[
                            { id: 'all', label: 'Tất cả' },
                            { id: 'income', label: 'Thu nhập' },
                            { id: 'expense', label: 'Chi tiêu' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === tab.id 
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto relative z-50">
                    <div className="relative flex-1 lg:flex-none min-w-[240px] group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm giao dịch trong hệ thống..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[12px] text-white focus:outline-none focus:border-indigo-500/50 w-full transition-all placeholder:text-slate-600 font-medium"
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
                                                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                                    {categories.map((cat, idx) => {
                                                        return (
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
                                                    )})}
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
                    <button className="p-3 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all shadow-lg shadow-black/20">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto -mx-1 px-1 custom-scrollbar relative z-0">
                <table className="w-full text-left text-[12px] whitespace-nowrap">
                    <thead className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] border-b border-white/5 italic">
                        <tr>
                            <th className="pb-6 font-bold px-4">Ngày</th>
                            <th className="pb-6 font-bold px-4">Nội dung</th>
                            <th className="pb-6 font-bold px-4">Danh mục</th>
                            <th className="pb-6 font-bold px-4 text-center">Loại</th>
                            <th className="pb-6 font-bold px-4 text-center">Phương thức</th>
                            <th className="pb-6 font-bold px-8 text-right">Số tiền</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        <AnimatePresence mode="popLayout">
                            {paginatedList.map((tx, idx) => {
                                const style = getTxStyle(tx.category, tx.type);
                                const TxIcon = style.icon;
                                return (
                                    <motion.tr 
                                        key={tx.id || idx} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: (idx % itemsPerPage) * 0.05 }}
                                        className="group hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="py-5 font-bold text-slate-500 tracking-tight px-4">{format(parseISO(tx.date), 'dd/MM/yyyy')}</td>
                                        <td className="py-5 px-4">
                                           <div className="flex items-center gap-4">
                                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 transition-transform group-hover:scale-110", style.bg)}>
                                                 <TxIcon className={cn("w-5 h-5", style.color)} />
                                              </div>
                                              <p className="font-bold text-white text-[13px] tracking-tight">{tx.description}</p>
                                           </div>
                                        </td>
                                        <td className="py-5 px-4">
                                            <span className={cn(
                                                "px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border transition-all text-center inline-block min-w-[80px]",
                                                getCategoryBadgeStyles(tx.category)
                                            )}>
                                               {tx.category}
                                            </span>
                                        </td>
                                        <td className="py-5 px-4 text-center">
                                           <div className={cn(
                                              "w-8 h-8 rounded-full inline-flex items-center justify-center border",
                                              tx.type === 'income' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                           )}>
                                              {tx.type === 'income' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                           </div>
                                        </td>
                                        <td className="py-5 text-slate-400 font-bold px-4 uppercase tracking-widest text-[11px] text-center">{tx.paymentMethod}</td>
                                        <td className={cn(
                                           "py-5 px-4 font-black transition-all group-hover:scale-105 origin-right",
                                           tx.type === 'income' ? "text-emerald-400" : "text-rose-400"
                                        )}>
                                           <div className="text-right">
                                              <p className="text-[14px] leading-none mb-1">{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}</p>
                                           </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                            {paginatedList.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                       <div className="flex flex-col items-center gap-4 text-slate-600">
                                          <Search className="w-12 h-12 opacity-20" />
                                          <p className="text-[13px] font-bold uppercase tracking-widest">Không tìm thấy giao dịch nào phù hợp</p>
                                          <button onClick={() => {setSearchTerm(""); setSelectedCategories([]); setSelectedMethod('Tất cả phương thức');}} className="text-xs text-indigo-500 font-black uppercase hover:underline">Thiết lập lại bộ lọc</button>
                                       </div>
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
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
                    layoutId="activePageCashflow"
                />
            </div>
        </div>
    </div>
  );
}
