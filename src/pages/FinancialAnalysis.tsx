import { 
  TrendingUp, Wallet, Target, Lightbulb, 
  AlertTriangle, Shield, CheckCircle2, 
  PieChart as PieChartIcon, Zap, Info, 
  Utensils, Car, ShoppingBag, ArrowRight, User,
  Calendar, Clock, BarChart3, Loader2
} from "lucide-react";
import { Header } from "../components/Header";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip as RechartsTooltip
} from "recharts";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { generateFinancialAnalysis, AIAnalysis, analyzeExpenseVariance } from "../utils/financialAnalysisEngine";
import { formatCurrency, useFilteredData, useTrends } from "../hooks/useMetrics";
import { useFinanceStore } from "../store/useFinanceStore";
import { useMemo, useState, useEffect } from "react";
import { parseISO, format, getHours, isWeekend, differenceInMonths } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function FinancialAnalysis() {
  const navigate = useNavigate();
  const { filteredTransactions, totalIncome, totalExpense, netCashFlow, totalAssets } = useFilteredData();
  const { simBalances, simMonth, selectedPeriod, incomeGoal, expenseLimit, startDate, endDate } = useFinanceStore();
  const { currentTxs, prevTxs, expenseGrowth, prevExpense } = useTrends();
  
  const [aiData, setAiData] = useState<AIAnalysis | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const simulationAllocations = useMemo(() => {
    const total = Object.values(simBalances).reduce((s, b) => s + b, 0);
    const weights: Record<string, number> = {};
    if (total > 0) {
      Object.entries(simBalances).forEach(([k, v]) => {
        weights[k] = v / total;
      });
    }
    return weights;
  }, [simBalances]);

  const simulationInitialBalance = useMemo(() => {
    return Object.values(simBalances).reduce((s, b) => s + b, 0);
  }, [simBalances]);

  const comparisonLabel = useMemo(() => {
    switch (selectedPeriod) {
      case 'month': return 'tháng trước';
      case 'quarter': return 'quý trước';
      case 'year': return 'năm trước';
      default: return 'kỳ trước';
    }
  }, [selectedPeriod]);

  const varianceAnalysis = useMemo(() => {
    const currentCats = currentTxs.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    const prevCats = prevTxs.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return analyzeExpenseVariance(
      totalExpense,
      prevExpense,
      Object.entries(currentCats).map(([name, amount]) => ({ name, amount })),
      Object.entries(prevCats).map(([name, amount]) => ({ name, amount }))
    );
  }, [currentTxs, prevTxs, totalExpense, prevExpense]);

  // Derived Metrics
  const savingsRate = totalIncome > 0 ? (netCashFlow / totalIncome) : 0;
  
  const monthsInPeriod = useMemo(() => {
    if (selectedPeriod === 'month') return 1;
    if (selectedPeriod === 'quarter') return 3;
    if (selectedPeriod === 'year') return 12;
    const diff = differenceInMonths(endDate, startDate);
    return Math.max(1, diff);
  }, [selectedPeriod, startDate, endDate]);

  const avgMonthlyExpense = totalExpense / monthsInPeriod || 1;

  const investmentMonthlyAmount = useMemo(() => {
    const sumAlloc = Object.values(simulationAllocations).reduce((sum, a) => sum + (a || 0), 0);
    const monthlyNetCashFlow = netCashFlow / monthsInPeriod;
    return Math.max(0, monthlyNetCashFlow) * sumAlloc;
  }, [netCashFlow, monthsInPeriod, simulationAllocations]);

  const investmentRate = totalIncome > 0 ? (investmentMonthlyAmount / (totalIncome / monthsInPeriod)) : 0;
  
  const liquidAssets = useMemo(() => {
    const monthlyNetCashFlow = netCashFlow / monthsInPeriod;
    const monthlyCashAlloc = Math.max(0, monthlyNetCashFlow) * (simulationAllocations['cash'] || 0);
    const monthlySavingsAlloc = Math.max(0, monthlyNetCashFlow) * (simulationAllocations['savings'] || 0);
    
    return (monthlyCashAlloc + monthlySavingsAlloc) * monthsInPeriod;
  }, [netCashFlow, monthsInPeriod, simulationAllocations]);

  const safetyMonths = liquidAssets / avgMonthlyExpense;

  // Debug Log based on requirement
  useEffect(() => {
    console.log("Financial Health Score Debug Data:", {
      monthlyInvestmentAmount: investmentMonthlyAmount,
      totalIncome,
      investmentRate: investmentRate * 100,
      cashAllocationCurrentValue: simulationInitialBalance * (simulationAllocations['cash'] || 0),
      savingsAllocationCurrentValue: simulationInitialBalance * (simulationAllocations['savings'] || 0),
      liquidAssets,
      averageMonthlyExpense: avgMonthlyExpense,
      emergencyFundMonths: safetyMonths,
      // scores will be calculated below
    });
  }, [investmentMonthlyAmount, totalIncome, investmentRate, simulationInitialBalance, simulationAllocations, liquidAssets, avgMonthlyExpense, safetyMonths]);

  // Health Score Calculation based on user requirements
  const healthMetrics = useMemo(() => {
    if (totalIncome === 0) return { total: 0, cashFlow: 0, savings: 0, investment: 0, safety: 0, rating: "Chưa đủ dữ liệu", components: { cashFlow: { score: 0, label: "Yếu" }, savings: { score: 0, label: "Yếu" }, investment: { score: 0, label: "Yếu" }, safety: { score: 0, label: "Yếu" } } };

    // 1. Dòng tiền (Cash Flow Score) - 30%
    const cashFlowRatio = (netCashFlow / totalIncome) * 100;
    let cashFlowScore = 20;
    if (cashFlowRatio >= 40) cashFlowScore = 100;
    else if (cashFlowRatio >= 30) cashFlowScore = 90;
    else if (cashFlowRatio >= 20) cashFlowScore = 80;
    else if (cashFlowRatio >= 10) cashFlowScore = 65;
    else if (cashFlowRatio >= 0) cashFlowScore = 50;

    // 2. Tỷ lệ tích lũy (Savings Rate Score) - 25%
    const savingsRatio = (netCashFlow / totalIncome) * 100;
    let savingsScore = 0;
    if (savingsRatio >= 30) savingsScore = 100;
    else if (savingsRatio >= 20) savingsScore = 85;
    else if (savingsRatio >= 10) savingsScore = 65;
    else if (savingsRatio >= 0) savingsScore = 40;

    // 3. Điểm đầu tư (Investment Score) - 25%. Target 30%+
    const monthlyIncome = totalIncome / monthsInPeriod;
    const investmentRatio = monthlyIncome > 0 ? (investmentMonthlyAmount / monthlyIncome) * 100 : 0;
    let investmentScore = 0;
    if (investmentRatio >= 30) investmentScore = 100;
    else if (investmentRatio >= 20) investmentScore = 90;
    else if (investmentRatio >= 15) investmentScore = 80;
    else if (investmentRatio >= 10) investmentScore = 70;
    else if (investmentRatio >= 5) investmentScore = 50;
    else if (investmentRatio >= 1) investmentScore = 30;

    // 4. Quỹ an toàn (Safety Score) - 20%. Target 12 months+
    const emergencyFundMonths = avgMonthlyExpense > 0 ? liquidAssets / avgMonthlyExpense : 0;
    let safetyScore = 20;
    if (liquidAssets === 0) safetyScore = 0;
    else if (emergencyFundMonths >= 12) safetyScore = 100;
    else if (emergencyFundMonths >= 6) safetyScore = 90;
    else if (emergencyFundMonths >= 3) safetyScore = 70;
    else if (emergencyFundMonths >= 1) safetyScore = 40;

    const totalScore = Math.round(
      0.30 * cashFlowScore + 
      0.25 * savingsScore + 
      0.25 * investmentScore + 
      0.20 * safetyScore
    );

    const getLabel = (score: number) => {
      if (score >= 85) return "Tốt";
      if (score >= 60) return "Khá";
      if (score >= 40) return "Trung bình";
      return "Yếu";
    };

    return {
      total: totalScore,
      rating: totalScore >= 90 ? "Xuất sắc" : totalScore >= 80 ? "Rất tốt" : totalScore >= 65 ? "Tốt" : totalScore >= 50 ? "Trung bình" : "Cần cải thiện",
      components: {
        cashFlow: { score: cashFlowScore, label: getLabel(cashFlowScore) },
        savings: { score: savingsScore, label: getLabel(savingsScore) },
        investment: { score: investmentScore, label: getLabel(investmentScore) },
        safety: { score: safetyScore, label: getLabel(safetyScore) },
      },
      safetyMonths: emergencyFundMonths.toFixed(1)
    };
  }, [netCashFlow, totalIncome, investmentMonthlyAmount, avgMonthlyExpense, liquidAssets, monthsInPeriod]);

  const healthStatusColor = useMemo(() => {
    switch (healthMetrics.rating) {
      case "Xuất sắc": return "text-emerald-400";
      case "Rất tốt": return "text-blue-400";
      case "Tốt": return "text-indigo-400";
      case "Trung bình": return "text-amber-400";
      default: return "text-rose-400";
    }
  }, [healthMetrics.rating]);

  // Behavior Analysis
  const behaviors = useMemo(() => {
    if (filteredTransactions.length === 0) return [];
    
    const insights = [];
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    
    // 2. CHI TIÊU CUỐI TUẦN
    const weekendExpense = expenses.filter(t => isWeekend(parseISO(t.date))).reduce((s, t) => s + t.amount, 0);
    const weekendSpendingRatio = totalExpense > 0 ? Math.round((weekendExpense / totalExpense) * 100) : 0;
    if (weekendSpendingRatio > 0) {
      insights.push({
        title: "Chi tiêu cuối tuần",
        description: `Có ${weekendSpendingRatio}% tổng chi tiêu phát sinh vào cuối tuần. Điều này cho thấy nhu cầu giải trí và tiêu dùng tăng mạnh trong thời gian nghỉ ngơi. Đây là một trong những nguyên nhân phổ biến khiến ngân sách vượt kế hoạch.`,
        color: "text-purple-400",
        icon: ShoppingBag
      });
    }

    // 3. DANH MỤC CHI TIÊU LỚN NHẤT
    const cats: Record<string, number> = {};
    expenses.forEach(t => { cats[t.category] = (cats[t.category] || 0) + t.amount; });
    const topCat = Object.entries(cats).sort((a,b) => b[1] - a[1])[0];
    if (topCat && totalExpense > 0 && topCat[1] > 0) {
      const percent = Math.round((topCat[1] / totalExpense) * 100);
      insights.push({
        title: "Danh mục chi tiêu lớn nhất",
        description: `Danh mục ${topCat[0]} chiếm ${percent}% tổng chi tiêu với số tiền ${formatCurrency(topCat[1])}. Điều này cho thấy đây là khoản chi ảnh hưởng lớn nhất đến ngân sách. Chỉ cần tối ưu nhẹ danh mục này cũng có thể tạo ra mức tiết kiệm đáng kể.`,
        color: "text-rose-400",
        icon: PieChartIcon
      });
    }

    // 4. XU HƯỚNG CHI TIÊU
    if (varianceAnalysis && varianceAnalysis.changePercent > 0) {
      const topDriver = varianceAnalysis.topDrivers[0];
      if (topDriver) {
         insights.push({
           title: "Xu hướng chi tiêu",
           description: `So với kỳ trước, chi tiêu tăng ${Math.abs(varianceAnalysis.changePercent).toFixed(1)}%. Mức tăng chủ yếu đến từ danh mục ${topDriver.category}. Điều này cho thấy ngân sách đang chịu áp lực từ một số danh mục cụ thể.`,
           color: "text-rose-400",
           icon: TrendingUp
         });
      }
    }

    return insights;
  }, [filteredTransactions, totalExpense, totalIncome, varianceAnalysis]);

  // Risk Assessment
  const risks = useMemo(() => {
    if (filteredTransactions.length === 0) return [];
    const r = [];

    // 1. RỦI RO PHỤ THUỘC THU NHẬP
    const incomeSources: Record<string, number> = {};
    const incomes = filteredTransactions.filter(t => t.type === 'income');
    incomes.forEach(t => {
       incomeSources[t.category] = (incomeSources[t.category] || 0) + t.amount;
    });
    const topIncome = Object.entries(incomeSources).sort((a,b) => b[1] - a[1])[0];
    if (topIncome && totalIncome > 0 && topIncome[1] > 0) {
       const percent = Math.round((topIncome[1] / totalIncome) * 100);
       let severity = "Low";
       if (percent > 80) severity = "Critical";
       else if (percent >= 60) severity = "High";
       else if (percent >= 40) severity = "Medium";

       r.push({
         title: "Phụ thuộc thu nhập",
         description: `${percent}% thu nhập đến từ danh mục ${topIncome[0]}. Điều này cho thấy mức độ phụ thuộc cao vào một nguồn thu chính. Nếu nguồn thu này bị gián đoạn, dòng tiền hàng tháng sẽ chịu ảnh hưởng đáng kể.`,
         severity
       });
    }

    // 2. RỦI RO QUỸ KHẨN CẤP
    let efSeverity = "Low";
    let comparison = "ở mức an toàn";
    if (safetyMonths < 1) { efSeverity = "Critical"; comparison = "ở mức rất thấp"; }
    else if (safetyMonths < 3) { efSeverity = "High"; comparison = "dưới ngưỡng an toàn"; }
    else if (safetyMonths < 6) { efSeverity = "Medium"; comparison = "ở mức chấp nhận được"; }

    r.push({
      title: "Quỹ khẩn cấp",
      description: `Quỹ an toàn hiện tương đương ${safetyMonths.toFixed(1)} tháng chi tiêu. Mức này ${comparison}. Trong trường hợp mất thu nhập đột ngột, khả năng duy trì tài chính sẽ bị hạn chế.`,
      severity: efSeverity
    });

    return r;
  }, [filteredTransactions, totalIncome, totalExpense, safetyMonths, varianceAnalysis, simulationAllocations]);

  // AI Analysis Trigger
  useEffect(() => {
    const runAnalysis = async () => {
      if (filteredTransactions.length === 0) return;
      
      setIsLoadingAI(true);
      setAiError(null);
      
      const topExpenseCategories = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc: Record<string, number>, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {});

      const topCats = Object.entries(topExpenseCategories)
        .sort((a, b) => b[1] - a[1])
        .map(([name, amount]) => ({ name, amount, ratio: (amount / (totalExpense || 1)) * 100 }));

      const incomeSources: Record<string, number> = {};
      filteredTransactions.filter(t => t.type === 'income').forEach(t => {
         incomeSources[t.category] = (incomeSources[t.category] || 0) + t.amount;
      });
      const topIncomeVal = Object.values(incomeSources).sort((a,b) => b-a)[0] || 0;
      const incomeDepPercent = totalIncome > 0 ? (topIncomeVal / totalIncome) * 100 : 0;

      try {
        const analysisData = {
          healthMetrics,
          totalIncome,
          totalExpense,
          savingsRate,
          investmentRate,
          safetyMonths: parseFloat(healthMetrics.safetyMonths),
          topCategories: topCats,
          varianceChange: varianceAnalysis?.changePercent,
          incomeDependency: incomeDepPercent
        };

        const response = await fetch("/api/gen-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysisData })
        });

        if (!response.ok) {
           const bodyText = await response.text();
           console.error("[Analysis Debug] Error response:", bodyText.substring(0, 100));
           
           if (bodyText.includes("<!doctype html>") || bodyText.includes("<title>Starting Server</title>")) {
             throw new Error("Máy chủ đang khởi động. Vui lòng chờ 10 giây rồi tải lại trang.");
           }
           
           const errData = await response.json().catch(() => ({}));
           throw new Error(errData.error || `Lỗi kết nối API: ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
           const bodyText = await response.text();
           if (bodyText.includes("<!doctype html>") || bodyText.includes("<title>Starting Server</title>")) {
             throw new Error("Máy chủ đang khởi động. Vui lòng chờ 10 giây rồi thử lại.");
           }
           throw new Error("Phản hồi từ máy chủ không hợp lệ. Hãy thử tải lại trang.");
        }

        const result = await response.json();
        
        if (result.error) {
          // Fallback to local analysis if API fails/no key
          const fallback = generateFinancialAnalysis(
            healthMetrics,
            totalIncome,
            totalExpense,
            savingsRate,
            investmentRate,
            parseFloat(healthMetrics.safetyMonths),
            topCats,
            varianceAnalysis?.changePercent,
            incomeDepPercent
          );
          setAiData(fallback);
        } else {
          setAiData(result);
        }
      } catch (err: any) {
        console.error("AI Analysis Fetch Error:", err);
        
        let errorTxt = "Có lỗi xảy ra khi kết nối với AI Advisor. Đang sử dụng phân tích ngoại tuyến.";
        if (err.message?.includes('503') || err.message?.includes('quá tải')) {
           errorTxt = "Hệ thống AI hiện đang quá tải. Đang sử dụng phân tích dự phòng.";
        }
        
        setAiError(errorTxt);
        
        // Fallback to local analysis in catch block too
        const fallback = generateFinancialAnalysis(
            healthMetrics,
            totalIncome,
            totalExpense,
            savingsRate,
            investmentRate,
            parseFloat(healthMetrics.safetyMonths),
            topCats,
            varianceAnalysis?.changePercent,
            incomeDepPercent
        );
        setAiData(fallback);

        // Clear error text after 3 seconds to reveal fallback
        setTimeout(() => setAiError(null), 3000);
      } finally {
        setIsLoadingAI(false);
      }
    };

    runAnalysis();
  }, [totalIncome, totalExpense, netCashFlow, savingsRate, investmentRate, healthMetrics.safetyMonths, filteredTransactions.length]);

  // UI Components
  if (filteredTransactions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Info className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-bold">Chưa đủ dữ liệu để phân tích</p>
          <button onClick={() => navigate('/app/transactions')} className="text-indigo-400 text-sm underline">Thêm giao dịch ngay</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 animate-in fade-in duration-700">
      <Header 
        title="Phân tích tài chính" 
        subtitle="AI phân tích chuyên sâu tình hình tài chính thực tế"
        icon={<BarChart3 className="w-7 h-7 text-indigo-500" />}
      />

      <div className="relative z-10 space-y-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          
          {/* 1. SỨC KHỎE TÀI CHÍNH TỔNG THỂ */}
          <section className="glass-panel rounded-3xl p-8 bg-gradient-to-br from-indigo-500/[0.05] to-blue-500/[0.05]">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-10">Sức khỏe tài chính tổng thể</h3>
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex flex-col items-center justify-center space-y-4 lg:pr-12 lg:min-w-[240px]">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="80" cy="80" r="74" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                    <circle 
                      cx="80" cy="80" r="74" fill="transparent" stroke="url(#health-grad)" strokeWidth="12" 
                      strokeDasharray={464.95} strokeDashoffset={464.95 * (1 - healthMetrics.total / 100)} strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="health-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-black text-white tracking-tighter">{healthMetrics.total}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Score</span>
                  </div>
                </div>
                <p className={cn("text-xl font-black uppercase tracking-widest", healthStatusColor)}>{healthMetrics.rating}</p>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Dòng tiền", data: healthMetrics.components.cashFlow, icon: Wallet, color: "#10b981" },
                  { label: "Tỷ lệ tích lũy", data: healthMetrics.components.savings, icon: Target, color: "#f59e0b" },
                  { label: "Điểm đầu tư", data: healthMetrics.components.investment, icon: TrendingUp, color: "#8b5cf6" },
                  { label: "Quỹ an toàn", data: healthMetrics.components.safety, icon: Shield, color: "#0ea5e9" },
                ].map((kpi) => (
                  <div key={kpi.label} className="flex flex-col items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15` }}>
                      <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-500 mb-1">{kpi.label}</p>
                      <p className="text-lg font-black text-white">{kpi.data.score}</p>
                    </div>
                    <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${kpi.data.score}%`, backgroundColor: kpi.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 2. BIẾN ĐỘNG CHI TIÊU */}
            <div className="glass-panel rounded-3xl p-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Biến động chi tiêu</h3>
              <div className="mb-6">
                <p className={cn("text-3xl font-black tracking-tighter", varianceAnalysis.direction === "increase" ? "text-rose-400" : varianceAnalysis.direction === "decrease" ? "text-emerald-400" : "text-slate-400")}>
                  {varianceAnalysis.direction === "increase" ? '+' : varianceAnalysis.direction === "decrease" ? '-' : ''}
                  {Math.abs(varianceAnalysis.changePercent).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%
                </p>
                <div className="text-xs text-slate-500 mt-1 flex justify-between items-center">
                  <span>so với {comparisonLabel}</span>
                  <span className={cn("font-bold", varianceAnalysis.direction === "increase" ? "text-rose-400/50" : varianceAnalysis.direction === "decrease" ? "text-emerald-400/50" : "text-slate-500")}>
                     {varianceAnalysis.direction === "increase" ? '+' : varianceAnalysis.direction === "decrease" ? '-' : ''}{formatCurrency(Math.abs(varianceAnalysis.changeAmount))}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-indigo-500/30 pl-3">
                  "{varianceAnalysis.summary}"
                </p>
              </div>

              {varianceAnalysis.topDrivers.length > 0 && (
                <div className="space-y-3 mt-4">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Nguyên nhân chính</p>
                  <div className="space-y-2">
                    {varianceAnalysis.topDrivers.map((driver, i) => (
                      <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-xs text-slate-300 font-medium">{driver.category}</span>
                        <div className="text-right">
                          <span className={cn("text-xs font-bold block", driver.change > 0 ? "text-rose-400" : "text-emerald-400")}>
                            {driver.change > 0 ? '+' : ''}{formatCurrency(driver.change)}
                          </span>
                          <span className="text-[10px] text-slate-500">{Math.round(driver.contribution)}% biến động</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 6. TỐI ƯU HÓA TÀI CHÍNH */}
            <div className="glass-panel rounded-3xl p-5 bg-gradient-to-br from-indigo-500/[0.02] to-transparent flex flex-col">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Tối ưu hóa tài chính</h3>
                  <Lightbulb className="w-4 h-4 text-emerald-500" />
               </div>
               <div className="mb-5 flex flex-col items-center text-center p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tiết kiệm tiềm năng</p>
                  <p className="text-3xl font-black text-emerald-400 tracking-tighter">
                    {formatCurrency(totalExpense * 0.15)}
                  </p>
               </div>
               <div className="space-y-2 mt-auto">
                  {[
                    { label: "Tiết kiệm ăn uống (15%)", val: totalExpense * 0.05, icon: Utensils },
                    { label: "Giảm mua sắm (10%)", val: totalExpense * 0.07, icon: ShoppingBag },
                    { label: "Tối ưu hóa đi lại", val: totalExpense * 0.03, icon: Car },
                  ].map((item, i) => (
                    <div key={i} className="px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-indigo-500/10">
                            <item.icon className="w-3.5 h-3.5 text-indigo-400" />
                          </div>
                          <span className="text-xs font-bold text-slate-300">{item.label}</span>
                      </div>
                      <span className="text-xs text-emerald-400 font-bold">+{formatCurrency(item.val)}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* 3. HÀNH VI NỔI BẬT */}
            <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-emerald-500/[0.02] to-transparent">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Hành vi nổi bật</h3>
              <div className="space-y-6">
                {behaviors.map((b, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 h-fit mt-1"><b.icon className={cn("w-4 h-4", b.color)} /></div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-300">{b.title}</p>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-sm">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. RỦI RO TÀI CHÍNH */}
            <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-amber-500/[0.02] to-transparent">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Rủi ro tài chính</h3>
              <div className="space-y-6">
                {risks.map((r, i) => {
                  const iconColor = r.severity === 'Critical' ? 'text-rose-400' :
                                    r.severity === 'High' ? 'text-orange-400' :
                                    r.severity === 'Medium' ? 'text-amber-400' : 'text-emerald-400';
                  const badgeColor = r.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/20' :
                                     r.severity === 'High' ? 'bg-orange-500/20 text-orange-300 border-orange-500/20' :
                                     r.severity === 'Medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/20' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20';
                  
                  return (
                    <div key={i} className="flex gap-4 group">
                      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 h-fit mt-1">
                        <AlertTriangle className={cn("w-4 h-4", iconColor)} />
                      </div>
                      <div className="space-y-1.5 flex-1 max-w-sm">
                        <div className="flex justify-between items-start lg:items-center flex-col lg:flex-row gap-2">
                          <p className="text-sm font-bold text-slate-300">{r.title}</p>
                          <span className={cn("text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border", badgeColor)}>
                            {r.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7. PHÂN TÍCH CHUYÊN SÂU (IMAGE MATCHED) */}
            <div className="glass-panel rounded-3xl p-8 bg-slate-950/40 border border-white/5 lg:col-span-2">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-purple-500 fill-purple-500/20" />
                    <h3 className="text-lg font-black text-white uppercase tracking-[0.2em]">Phân tích chuyên sâu</h3>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                    <Zap className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Cached</span>
                  </div>
               </div>

               {isLoadingAI ? (
                 <div className="flex flex-col items-center justify-center py-20 space-y-4">
                   <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                   <p className="text-sm text-slate-500 italic">AI đang phân tích dữ liệu chuyên sâu...</p>
                 </div>
               ) : aiError ? (
                 <div className="flex items-center justify-center py-20">
                   <p className="text-rose-400 font-bold">{aiError}</p>
                 </div>
               ) : aiData ? (
                 <div className="space-y-6">
                    {/* Overall Assessment Block */}
                    <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/[0.03]">
                       <div className="flex items-center gap-3 mb-4">
                          <BarChart3 className="w-5 h-5 text-indigo-400" />
                          <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.15em]">Đánh giá tổng quan</h4>
                       </div>
                       <p className="text-sm text-slate-300 leading-relaxed font-medium mb-8">
                          {aiData.deepAnalysis?.overallAnalysis}
                       </p>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-4">
                             <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">Điểm mạnh</h5>
                             <div className="space-y-3">
                                {aiData.deepAnalysis?.strengths?.map((s, i) => (
                                   <div key={i} className="flex items-start gap-3">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                      <p className="text-xs text-slate-400 font-medium">{s}</p>
                                   </div>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-4 lg:border-l border-white/5 lg:pl-12">
                             <h5 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">Rủi ro & hạn chế</h5>
                             <div className="space-y-3">
                                {aiData.deepAnalysis.risks?.map((r, i) => (
                                   <div key={i} className="flex items-start gap-3">
                                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                                      <p className="text-xs text-slate-400 font-medium">{r}</p>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Bottom Split Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                       {/* Left: Ngữ cảnh */}
                       <div className="lg:col-span-4 space-y-4">
                          <div className="flex items-center gap-3 mb-2 px-2">
                             <Lightbulb className="w-4 h-4 text-emerald-400" />
                             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ngữ cảnh</h4>
                          </div>
                          {aiData.deepAnalysis.contextualInsights?.map((insight, i) => {
                             const Icon = insight.type === 'savings' ? PieChartIcon : insight.type === 'emergency' ? Shield : TrendingUp;
                             const color = insight.type === 'savings' ? 'text-emerald-400' : insight.type === 'emergency' ? 'text-emerald-500' : 'text-emerald-600';
                             return (
                                <div key={i} className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.03] flex items-start gap-4">
                                   <div className={cn("w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0", color)}>
                                      <Icon className="w-5 h-5" />
                                   </div>
                                   <p className="text-[11px] text-slate-400 leading-relaxed">{insight.text}</p>
                                </div>
                             );
                          })}
                       </div>

                       {/* Right: Tối ưu phân bổ */}
                       <div className="lg:col-span-8 p-8 rounded-[2rem] bg-white/[0.01] border border-white/[0.03]">
                          <div className="flex items-center gap-3 mb-6">
                             <Wallet className="w-5 h-5 text-blue-400" />
                             <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.15em]">Tối ưu phân bổ</h4>
                          </div>
                          <div className="space-y-6">
                             <p className="text-sm text-slate-300 leading-relaxed">
                                {aiData.deepAnalysis?.investmentAnalysis}
                             </p>
                             <p className="text-sm text-slate-300 leading-relaxed">
                                {aiData.deepAnalysis?.optimizationAnalysis}
                             </p>
                             <div className="pt-6 border-t border-white/5 space-y-4">
                                <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Cơ hội</h5>
                                <div className="space-y-2">
                                   {aiData.deepAnalysis?.opportunities?.map((o, i) => (
                                      <div key={i} className="flex items-center gap-3">
                                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                         <p className="text-xs text-slate-400 font-medium">{o}</p>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               ) : (
                  <div className="py-20 text-center">
                    <p className="text-slate-500 italic">Dữ liệu phân tích sẽ xuất hiện sau khi AI xử lý xong.</p>
                  </div>
               )}
            </div>
          </div>

          {/* 8. CHIẾN LƯỢC TÀI CHÍNH */}
          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="glass-panel rounded-3xl overflow-hidden bg-slate-900/40 relative">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-4">
                   Chiến lược tài chính
                  <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 italic tracking-widest">AI strategic recommendation</span>
               </h3>
            </div>
            
            {isLoadingAI ? (
               <div className="p-20 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  <p className="text-sm text-slate-500">Đang thiết kế lộ trình cải thiện...</p>
               </div>
            ) : aiData ? (
              <div className="p-8 space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Priority Actions */}
                  <div className="space-y-6">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">3 ưu tiên hàng đầu</p>
                    <div className="space-y-4">
                      {aiData.strategy?.priorityActions?.map((text, i) => (
                        <div key={i} className="flex gap-4 items-center">
                          <span className="text-xl font-black text-slate-700">{i + 1}</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-medium">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expense Controls */}
                  <div className="space-y-6 lg:border-l border-white/5 lg:px-8">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Chi phí cần kiểm soát</p>
                    <div className="space-y-4">
                      {aiData.strategy?.expenseControls?.map((text, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <p className="text-xs text-slate-300 font-medium">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Income Opportunities */}
                  <div className="space-y-6 lg:border-l border-white/5 lg:px-8">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Nguồn thu tiềm năng</p>
                    <div className="space-y-4">
                      {aiData.strategy?.incomeOpportunities?.map((text, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Zap className="w-4 h-4 text-emerald-400/40 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-300 font-medium">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plan 90 Days */}
                  <div className="space-y-6 lg:border-l border-white/5 lg:pl-8">
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                       <Calendar className="w-3 h-3" /> Lộ trình 3 tháng
                     </p>
                     <div className="space-y-2">
                       {aiData.strategy?.plan90Days?.map((goal, i) => (
                         <p key={i} className="text-[10px] text-slate-400 bg-blue-500/5 px-3 py-2 rounded-lg border border-blue-500/10">• {goal}</p>
                       ))}
                     </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-20 text-center">
                <p className="text-slate-500 italic">Dữ liệu chiến lược sẽ xuất hiện sau khi AI phân tích xong.</p>
              </div>
            )}

            <div className="p-8 pt-4 pb-12 bg-slate-950/20 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5">
               <p className="text-[11px] text-slate-500 italic">AI phân tích đa chiều: Dòng tiền, Tiết kiệm, Đầu tư và Rủi ro.</p>
               <button 
                  onClick={() => navigate('/app/ai-advisor')}
                  className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-xs font-black text-white uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)]"
               >
                  Tư vấn cùng AI <ArrowRight className="w-4 h-4" />
               </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
