import { useState, useMemo, useEffect, useRef } from "react";
import { Header } from "../components/Header";
import { formatCurrency } from "../hooks/useMetrics";
import { 
  startOfMonth, 
  endOfMonth, 
  parseISO, 
  isWithinInterval 
} from 'date-fns';
import { useFinanceStore } from "../store/useFinanceStore";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from "recharts";
import { Calculator, TrendingUp, Wallet, Landmark, Banknote, 
  Coins, DollarSign, Layers, Info, History, Save, 
  ArrowRightLeft, Sparkles, Star,
  Activity, BarChart2, X, Plus, Search, Loader2, AlertCircle } from "lucide-react";
import { FinancialNewsWidget } from "../components/FinancialNewsWidget";

const formatVNPrice = (price: number | undefined, isIndex = false) => {
    if (price === undefined) return "---";
    return price.toLocaleString('vi-VN', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2 
    });
};

const formatVNVolume = (vol: number | undefined) => {
    if (vol === undefined) return "---";
    const opts = { minimumFractionDigits: 0, maximumFractionDigits: 2 };
    if (vol >= 1_000_000) return (vol / 1_000_000).toLocaleString('vi-VN', opts) + " triệu cổ phiếu";
    if (vol >= 1_000) return (vol / 1_000).toLocaleString('vi-VN', opts) + " nghìn cổ phiếu";
    return vol.toLocaleString('vi-VN', opts) + " cổ phiếu";
};

const formatVNValue = (val: number | undefined) => {
    if (val === undefined) return "---";
    const opts = { minimumFractionDigits: 0, maximumFractionDigits: 2 };
    if (val >= 1_000_000_000) return (val / 1_000_000_000).toLocaleString('vi-VN', opts) + " tỷ VNĐ";
    if (val >= 1_000_000) return (val / 1_000_000).toLocaleString('vi-VN', opts) + " triệu VNĐ";
    return val.toLocaleString('vi-VN', opts) + " VNĐ";
};

const formatCurrencyExact = (amount: number | undefined) => {
    if (amount === undefined || amount === 0) return "0 VNĐ";
    return amount.toLocaleString('vi-VN', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    }) + " VNĐ";
};

// Asset Configuration
const VN_STOCKS: Record<string, string> = {
  // VN30
  'VCB': 'Vietcombank',
  'VIC': 'Vingroup',
  'VHM': 'Vinhomes',
  'VRE': 'Vincom Retail',
  'GAS': 'PV GAS',
  'VNM': 'Vinamilk',
  'HPG': 'Hòa Phát',
  'FPT': 'FPT Corporation',
  'MSN': 'Masan Group',
  'MWG': 'Thế Giới Di Động',
  'TCB': 'Techcombank',
  'VPB': 'VPBank',
  'MBB': 'MB Bank',
  'ACB': 'ACB Bank',
  'STB': 'Sacombank',
  'HDB': 'HDBank',
  'VIB': 'VIB Bank',
  'TPB': 'TPBank',
  'CTG': 'VietinBank',
  'BID': 'BIDV',
  'BVH': 'Bảo Việt',
  'POW': 'PV Power',
  'PLX': 'Petrolimex',
  'SAB': 'Sabeco',
  'SSI': 'SSI Securities',
  'VJC': 'Vietjet Air',
  'GVR': 'VRG',
  'BCM': 'Becamex',
  'SSB': 'SeABank',
  'SHB': 'SHB Bank',
  // VN70 & Significant others in VN100
  'PNJ': 'Vàng bạc Đá quý Phú Nhuận',
  'REE': 'Cơ điện lạnh REE',
  'VND': 'VNDirect',
  'PDR': 'Phát Đạt',
  'KDH': 'Khang Điền',
  'NLG': 'Nam Long',
  'DIG': 'DIC Corp',
  'DXG': 'Đất Xanh',
  'GEX': 'Gelex',
  'KBC': 'Kinh Bắc City',
  'HSG': 'Hoa Sen Group',
  'DCM': 'Đạm Cà Mau',
  'DPM': 'Đạm Phú Mỹ',
  'VGC': 'Viglacera',
  'PC1': 'Tập đoàn PC1',
  'ASM': 'Tập đoàn Sao Mai',
  'ANV': 'Nam Việt',
  'DBC': 'Dabaco',
  'FRT': 'FPT Retail',
  'DGW': 'Digiworld',
  'VHC': 'Vĩnh Hoàn',
  'MPC': 'Minh Phú',
  'PAN': 'The PAN Group',
  'TCH': 'Hoàng Huy',
  'AAA': 'Nhựa An Phát Xanh',
  'BCG': 'Bamboo Capital',
  'BSI': 'Chứng khoán BSC',
  'CTS': 'Chứng khoán Vietinbank',
  'DGC': 'Hóa chất Đức Giang',
  'EIB': 'Eximbank',
  'FTS': 'Chứng khoán FPT',
  'GMD': 'Gemadept',
  'HCM': 'Chứng khoán HSC',
  'IDV': 'IDICO',
  'ITA': 'Itaco',
  'LPB': 'LPBank',
  'MSB': 'MSB Bank',
  'NKG': 'Thép Nam Kim',
  'OCB': 'OCB Bank',
  'SBT': 'Thành Thành Công',
  'SCS': 'Sài Gòn Cargo',
  'STG': 'Sotrans',
  'SZC': 'Sonadezi Châu Đức',
  'VCI': 'Chứng khoán Vietcap',
  'VCS': 'Viconship',
  'VPI': 'Văn Phú - Invest'
};

const DEFAULT_ALLOCATION = [
  { name: 'Chứng khoán', key: 'stock', weight: 0.5, icon: TrendingUp, color: '#3b82f6', defaultRate: 18 },
  { name: 'Vàng', key: 'gold', weight: 0.1, icon: Coins, color: '#eab308', defaultRate: 8 },
  { name: 'Tiền gửi tiết kiệm', key: 'savings', weight: 0.1, icon: Landmark, color: '#f97316', defaultRate: 6 },
  { name: 'USD', key: 'usd', weight: 0.1, icon: DollarSign, color: '#10b981', defaultRate: 3 },
  { name: 'Tiền mặt', key: 'cash', weight: 0.2, icon: Banknote, color: '#ec4899', defaultRate: 0 },
];

const STOCK_PORTFOLIO = [
  { symbol: 'VNM', name: 'Vinamilk', weight: 0.2, rate: 18 },
  { symbol: 'FPT', name: 'FPT Corporation', weight: 0.2, rate: 18 },
  { symbol: 'HPG', name: 'Hòa Phát', weight: 0.2, rate: 18 },
  { symbol: 'MWG', name: 'Thế Giới Di Động', weight: 0.2, rate: 18 },
  { symbol: 'ACB', name: 'ACB Bank', weight: 0.2, rate: 18 },
];

// Calculation helper
const calculateFV = (PV: number, PMT: number, annualRate: number, years: number) => {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return PV + (PMT * n);
  const compoundedPV = PV * Math.pow(1 + r, n);
  const compoundedPMT = PMT * ((Math.pow(1 + r, n) - 1) / r);
  return compoundedPV + compoundedPMT;
};

function RealTimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatOutput = (d: Date) => {
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const mo = (d.getMonth() + 1).toString().padStart(2, '0');
    const yy = d.getFullYear();
    return `${hh}:${mm} - ${dd}/${mo}/${yy}`;
  };

  return (
    <div className="flex flex-col items-end justify-center bg-slate-900/40 p-1.5 md:p-2.5 rounded-xl border border-white/5 backdrop-blur-md h-[36px] md:h-11">
      <div className="text-[7.5px] text-slate-500 uppercase tracking-[0.2em] font-black leading-none mb-1 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
        Thời điểm hiện tại
      </div>
      <div className="text-[12px] font-bold text-slate-200 tabular-nums leading-none tracking-tight">
        {formatOutput(time)}
      </div>
    </div>
  );
}

export default function InvestmentSimulation() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { transactions, simBalances, simInvestments, simMonth, updateSimBalance, incrementSimMonth, withdrawAsset, addCash, resetSim } = useFinanceStore();

  // Metrics specifically for the "current month" (May 2026) regardless of the global store selection
  const currentMetrics = useMemo(() => {
    // Current month is fixed at May 2026 for this application
    const now = new Date(2026, 4, 1); 
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    // Filter transactions for this specific month
    const monthTxs = transactions.filter(tx => {
      const txDate = parseISO(tx.date);
      return isWithinInterval(txDate, { start, end });
    });
    
    const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const cashFlow = income - expense;
    
    // Total assets up to the end of currently defined "real" month
    const assets = transactions
      .filter(tx => parseISO(tx.date) <= end)
      .reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

    return { income, expense, cashFlow, assets };
  }, [transactions]);

  const { totalIncome, totalExpense, netCashFlow, totalAssets } = {
    totalIncome: currentMetrics.income,
    totalExpense: currentMetrics.expense,
    netCashFlow: currentMetrics.cashFlow,
    totalAssets: currentMetrics.assets
  };
  
  const [withdrawConfirm, setWithdrawConfirm] = useState<{key: string, name: string, value: number, isStock?: boolean, symbol?: string} | null>(null);

  const [addModes, setAddModes] = useState<Record<string, boolean>>({});
  const [addAmounts, setAddAmounts] = useState<Record<string, string>>({});
  const [addErrors, setAddErrors] = useState<Record<string, string | undefined>>({});

  const [stockAddModes, setStockAddModes] = useState<Record<string, boolean>>({});
  const [stockAddAmounts, setStockAddAmounts] = useState<Record<string, string>>({});
  const [stockAddErrors, setStockAddErrors] = useState<Record<string, string | undefined>>({});

  const handleAddAllocation = (key: string) => {
    const addValStr = addAmounts[key];
    if (!addValStr) return;
    const addVal = Number(addValStr) * 1000000;
    if (addVal === 0) return;
    
    // Only moving from cash is allowed in positive numbers, or to cash in negative numbers
    const currentCash = simBalances['cash'] || 0;
    if (addVal > currentCash) {
        setAddErrors(prev => ({...prev, [key]: 'Không đủ tiền mặt để phân bổ.'}));
        return;
    }
    
    // Handle negative values moving back to cash
    const currentAmount = simBalances[key] || 0;
    if (addVal < 0 && Math.abs(addVal) > currentAmount) {
         setAddErrors(prev => ({...prev, [key]: 'Số tiền rút vượt quá số dư hiện tại.'}));
         return;
    }

    updateSimBalance(key, currentAmount + addVal);
    
    setAddAmounts(prev => ({...prev, [key]: ''}));
    setAddModes(prev => ({...prev, [key]: false}));
    setAddErrors(prev => ({...prev, [key]: undefined}));
  };
  
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('finvest-simulation-rates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const initialRates: Record<string, number> = {};
    DEFAULT_ALLOCATION.forEach(a => initialRates[a.key] = a.defaultRate);
    return initialRates;
  });

  // Derived weights (allocations)
  const totalBalance = useMemo(() => {
    const values = Object.values(simBalances);
    if (values.length === 0) return totalAssets;
    return values.reduce((sum, b) => sum + b, 0);
  }, [simBalances, totalAssets]);

  const allocations = useMemo(() => {
    const weights: Record<string, number> = {};
    DEFAULT_ALLOCATION.forEach(a => {
      weights[a.key] = totalBalance > 0 ? (simBalances[a.key] || 0) / totalBalance : 0;
    });
    return weights;
  }, [simBalances, totalBalance]);

  // Initial balance dist if empty
  useEffect(() => {
    if (Object.keys(simBalances).length === 0 && totalAssets > 0) {
      resetSim(totalAssets);
    }
  }, [totalAssets]);

  useEffect(() => {
    localStorage.setItem('finvest-simulation-rates', JSON.stringify(rates));
    window.dispatchEvent(new Event('finvest-simulation-update'));
  }, [rates]);

  const updateBalance = (key: string, value: number) => {
    updateSimBalance(key, value);
  };

  const nextMonth = () => {
    incrementSimMonth(netCashFlow);
  };

  const resetBalances = () => {
    resetSim(totalAssets);
    
    // Reset stock portfolio to default
    setStockPortfolio(STOCK_PORTFOLIO);
    
    // Reset rates to default
    const initialRates: Record<string, number> = {};
    DEFAULT_ALLOCATION.forEach(a => {
        if (a.key !== 'stock') initialRates[a.key] = a.defaultRate;
    });
    setRates(prev => ({ ...prev, ...initialRates, stock: 18 }));
    
    // Reset chart period
    setChartPeriod(10);
    
    // Clear all UI states
    setAddModes({});
    setAddAmounts({});
    setAddErrors({});
    setStockAddModes({});
    setStockAddAmounts({});
    setStockAddErrors({});
    setNewStockSymbol('');
    setExpandedStock(null);
  };

  const [stockPortfolio, setStockPortfolio] = useState(() => {
    const saved = localStorage.getItem('finvest-simulation-stock-portfolio');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return STOCK_PORTFOLIO;
  });

  const [newStockSymbol, setNewStockSymbol] = useState('');
  const [expandedStock, setExpandedStock] = useState<string | null>('MWG');
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [loadingStocks, setLoadingStocks] = useState<Record<string, boolean>>({});
  const [errorStocks, setErrorStocks] = useState<Record<string, boolean>>({});
  const [stockCharts, setStockCharts] = useState<Record<string, any[]>>({});

  const marketDataCache = useRef<Record<string, {data: any, timestamp: number}>>({});

  const isTradingHour = () => {
    const vnTime = new Date(Date.now() + 7 * 3600 * 1000);
    const day = vnTime.getUTCDay();
    const hour = vnTime.getUTCHours();
    const min = vnTime.getUTCMinutes();
    
    if (day === 0 || day === 6) return false;
    const time = hour * 60 + min;
    return time >= 9 * 60 && time <= 14 * 60 + 45;
  };

  const fetchStockData = async (symbol: string, force = false) => {
    const cache = marketDataCache.current[symbol];
    if (!force && cache && Date.now() - cache.timestamp < 15000) {
      setMarketData(prev => ({ ...prev, [symbol]: cache.data }));
      return;
    }

    setLoadingStocks(prev => ({ ...prev, [symbol]: true }));
    try {
      const res = await fetch(`/api/stock/${symbol}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      marketDataCache.current[symbol] = { data, timestamp: Date.now() };
      setMarketData(prev => ({ ...prev, [symbol]: data }));
      setErrorStocks(prev => ({ ...prev, [symbol]: false }));
    } catch (e) {
      if (!cache) {
        setErrorStocks(prev => ({ ...prev, [symbol]: true }));
      }
    } finally {
      setLoadingStocks(prev => ({ ...prev, [symbol]: false }));
    }
  };

  const fetchStockChart = async (symbol: string) => {
    try {
      const res = await fetch(`/api/stock/${symbol}/chart`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      // DNSE chart data is often in candles or points
      // We expect data.points or similar. 
      // For simplicity, we just take what it gives and format if it's an array
      if (Array.isArray(data)) {
        setStockCharts(prev => ({ ...prev, [symbol]: data }));
      } else if (data.data && Array.isArray(data.data)) {
        setStockCharts(prev => ({ ...prev, [symbol]: data.data }));
      }
    } catch (e) {
      console.error("Chart fetch failed", e);
    }
  };

  // Initial fetch and refresh timer
  useEffect(() => {
    const symbolsToFetch = ['VNINDEX', ...stockPortfolio.map(s => s.symbol)];
    symbolsToFetch.forEach(s => fetchStockData(s));
  }, [stockPortfolio]);

  useEffect(() => {
    const timer = setInterval(() => {
      // Pause if tab is inactive
      if (document.hidden) return;
      // Pause if outside trading hours
      if (!isTradingHour()) return;

      // Only refresh VNINDEX and expanded stock
      fetchStockData('VNINDEX', true);
      if (expandedStock) {
        fetchStockData(expandedStock, true);
        fetchStockChart(expandedStock);
      }
    }, 15000); // 15 seconds polling

    return () => clearInterval(timer);
  }, [expandedStock]);

  // Fetch chart when expanded
  useEffect(() => {
    if (expandedStock) {
      fetchStockData(expandedStock);
      fetchStockChart(expandedStock);
    }
  }, [expandedStock]);

  const [chartPeriod, setChartPeriod] = useState<number>(() => {
    const saved = localStorage.getItem('finvest-simulation-chart-period');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return 30;
  });

  useEffect(() => {
    localStorage.setItem('finvest-simulation-stock-portfolio', JSON.stringify(stockPortfolio));
  }, [stockPortfolio]);

  useEffect(() => {
    localStorage.setItem('finvest-simulation-chart-period', JSON.stringify(chartPeriod));
  }, [chartPeriod]);

  // Initial fetch and refresh timer
  useEffect(() => {
    // We already moved this to the new useEffect below
  }, []);

  // Handle rate changes
  const updateRate = (key: string, value: number) => {
    setRates(prev => ({ ...prev, [key]: value }));
  };

  const addStock = () => {
    if (!newStockSymbol.trim() || stockPortfolio.length >= 5) return;
    const symbol = newStockSymbol.toUpperCase();
    
    if (!VN_STOCKS[symbol]) return;

    if (stockPortfolio.find(s => s.symbol === symbol)) {
      setNewStockSymbol('');
      return;
    }
    
    const name = VN_STOCKS[symbol];
    const newStock = { symbol, name, weight: 0, amount: 0, rate: rates['stock'] || 18, investments: [] };
    const updatedPortfolio = [...stockPortfolio, newStock];
    
    const totalAmount = updatedPortfolio.reduce((sum, s) => sum + (s.amount || 0), 0);
    setStockPortfolio(updatedPortfolio.map(s => {
       const sAmt = s.amount || 0;
       return { ...s, amount: sAmt, weight: totalAmount > 0 ? sAmt / totalAmount : 0 };
    }));
    setNewStockSymbol('');
  };

  const handleWithdrawAll = (key: string, name: string, value: number, isStock = false, symbol?: string) => {
    if (value <= 0) return;
    setWithdrawConfirm({ key, name, value, isStock, symbol });
  };

  const executeWithdraw = () => {
    if (!withdrawConfirm) return;
    
    const { key, value, isStock, symbol } = withdrawConfirm;
    
    if (key === 'stock' && !isStock) {
       // Withdraw entire stock category
       withdrawAsset('stock', value);
       setStockPortfolio(prev => prev.map(s => ({ ...s, amount: 0, weight: 0, investments: [] })));
    } else if (isStock && symbol) {
       // Withdraw individual stock
       const stock = stockPortfolio.find(s => s.symbol === symbol);
       if (stock) {
           const principal = stock.amount || 0;
           
           // 1. Update stock category principal in store (without moving to cash yet)
           const currentStockPrincipal = simBalances['stock'] || 0;
           // We use setSimBalances here or just call updateSimBalance with a clever value.
           // Actually, the simplest is to just subtract principal from simBalances['stock'] 
           // and add FV (value) to cash pool.
           
           // We'll use a sequence of updates or a custom logic. 
           // Let's just decrease simBalances['stock'] by the principal.
           // Since updateSimBalance('stock', newAmt) moves the DIFF back to cash principal, 
           // but it doesn't account for GROWTH.
           
           // Let's do this:
           // Subtract principal from stock principal (this moves principal back to cash as unallocated)
           updateSimBalance('stock', Math.max(0, currentStockPrincipal - principal));
           
           // Now add the GROWTH (interest) to cash (since updateSimBalance only handled principal)
           const growth = value - principal;
           if (growth > 0) {
               addCash(growth);
           }
           
           // 2. Reset the individual stock in local portfolio
           setStockPortfolio(prev => {
               const updated = prev.map(s => s.symbol === symbol ? { ...s, amount: 0, weight: 0, investments: [] } : s);
               const totalAmount = updated.reduce((sum, s) => sum + (s.amount || 0), 0);
               return updated.map(s => ({
                   ...s,
                   weight: totalAmount > 0 ? (s.amount || 0) / totalAmount : 0
               }));
           });
       }
    } else {
       // Normal categories (Savings, Gold, USD)
       withdrawAsset(key, value);
    }
    
    setWithdrawConfirm(null);
  };

  const updateStockRate = (symbol: string, rate: number) => {
    setStockPortfolio(prev => {
        const found = prev.find(s => s.symbol === symbol);
        return Math.abs((found?.rate ?? 0) - rate) < 0.01 ? prev : prev.map(s => s.symbol === symbol ? { ...s, rate } : s);
    });
  };

  const updateStockAmount = (symbol: string, amount: number, existingInvs?: any[]) => {
    setStockPortfolio(prev => {
       const mapped = prev.map(s => {
           if (s.symbol === symbol) {
               return { ...s, amount, investments: amount > 0 ? (existingInvs || [{ amount, month: simMonth }]) : [] };
           }
           return s;
       });
       const totalAmount = mapped.reduce((sum, s) => sum + (s.amount || 0), 0);
       return mapped.map(s => {
           const sAmt = s.amount || 0;
           return { ...s, amount: sAmt > 0 ? sAmt : 0, weight: (totalAmount > 0 && sAmt > 0) ? sAmt / totalAmount : 0 };
       });
    });
  };

  const handleAddStockAllocation = (symbol: string) => {
    const addValStr = stockAddAmounts[symbol];
    if (!addValStr) return;
    const addVal = Number(addValStr) * 1000000;
    if (addVal === 0) return;

    const currentStock = stockPortfolio.find(s => s.symbol === symbol);
    const existingVal = currentStock?.amount || 0;
    
    const invs = currentStock?.investments ? [...currentStock.investments] : [{ amount: existingVal, month: 0 }];
    invs.push({ amount: addVal, month: simMonth });
    
    updateStockAmount(symbol, existingVal + addVal, invs);
    
    setStockAddModes(prev => ({ ...prev, [symbol]: false }));
    setStockAddAmounts(prev => ({ ...prev, [symbol]: '' }));
    setStockAddErrors(prev => ({ ...prev, [symbol]: undefined }));
  };

  const removeStock = (symbol: string) => {
    const updatedPortfolio = stockPortfolio.filter(s => s.symbol !== symbol);
    if (updatedPortfolio.length === 0) {
        setStockPortfolio([]);
        return;
    }
    const totalAmount = updatedPortfolio.reduce((sum, s) => sum + (s.amount || 0), 0);
    setStockPortfolio(updatedPortfolio.map(s => {
       const sAmt = s.amount || 0;
       return { ...s, amount: sAmt, weight: totalAmount > 0 ? sAmt / totalAmount : 0 };
    }));
  };

  // Simulation Calculations
  const simulation = useMemo(() => {
    const monthsToSimulate = Math.max(30, chartPeriod) * 12;
    const monthlyContribution = Math.max(0, netCashFlow);
    const avgStockRate = stockPortfolio.length > 0 
      ? stockPortfolio.reduce((acc, s) => acc + (s.rate ?? 18) * s.weight, 0)
      : (rates['stock'] || 18);

    // Initial state
    let currentBalances: Record<string, number> = { ...simBalances };
    let currentStockBalances: Record<string, number> = stockPortfolio.reduce((acc, s) => {
        const amt = s.amount || 0;
        acc[s.symbol] = amt;
        return acc;
    }, {} as Record<string, number>);

    // snapshots storage
    const snapshots: any[] = [];
    const initialTotal = Object.values(currentBalances).reduce((a, b) => a + b, 0);
    
    snapshots.push({
        month: 0,
        year: 0,
        balances: { ...currentBalances },
        stocks: { ...currentStockBalances },
        total: initialTotal,
        vested: initialTotal
    });

    let totalVested = initialTotal;

    for (let m = 1; m <= monthsToSimulate; m++) {
        const available = (currentBalances['cash'] || 0) + monthlyContribution;
        totalVested += monthlyContribution;
        
        const nextBalances: Record<string, number> = {};
        const nextStockBalances: Record<string, number> = {};
        
        // Update all categories
        DEFAULT_ALLOCATION.forEach(a => {
            const weight = allocations[a.key] || 0;
            const pmt = available * weight;
            
            if (a.key === 'cash') {
                nextBalances['cash'] = pmt;
            } else if (a.key === 'stock') {
                let totalStockVal = 0;
                stockPortfolio.forEach(s => {
                    const sRate = (s.rate ?? 18) / 100 / 12;
                    const sPMT = pmt * s.weight;
                    const oldVal = currentStockBalances[s.symbol] || 0;
                    const newVal = oldVal * (1 + sRate) + sPMT;
                    nextStockBalances[s.symbol] = newVal;
                    totalStockVal += newVal;
                });
                nextBalances['stock'] = totalStockVal;
            } else {
                const rate = (rates[a.key] || 0) / 100 / 12;
                nextBalances[a.key] = (currentBalances[a.key] || 0) * (1 + rate) + pmt;
            }
        });

        currentBalances = nextBalances;
        currentStockBalances = nextStockBalances;

        if (m % 12 === 0) {
            snapshots.push({
                month: m,
                year: m / 12,
                balances: { ...currentBalances },
                stocks: { ...currentStockBalances },
                total: Object.values(currentBalances).reduce((a, b) => a + b, 0),
                vested: totalVested
            });
        }
    }

    // Map snapshots to timeline
    const timeline = snapshots.filter(s => s.year <= chartPeriod).map(s => {
        const step: any = { 
            year: `Năm ${s.year}`, 
            yearNum: s.year,
            value: s.total,
            vested: s.vested,
            'Tổng danh mục': s.total
        };
        DEFAULT_ALLOCATION.forEach(a => {
            step[a.name] = s.balances[a.key];
        });
        return step;
    });

    const allocationData = DEFAULT_ALLOCATION.map(a => {
        const fv10 = snapshots.find(s => s.year === 10)?.balances[a.key] || 0;
        const fv20 = snapshots.find(s => s.year === 20)?.balances[a.key] || 0;
        const fv30 = snapshots.find(s => s.year === 30)?.balances[a.key] || 0;
        return {
            ...a,
            weight: allocations[a.key] || 0,
            pv: simBalances[a.key] || 0,
            monthly: monthlyContribution * (allocations[a.key] || 0),
            rate: a.key === 'stock' ? avgStockRate : (rates[a.key] || 0),
            fv10, fv20, fv30
        };
    });

    const forecastResults = [10, 20, 30].map(y => {
        const s = snapshots.find(snap => snap.year === y);
        return {
            years: y,
            total: s?.total || 0,
            ...s?.balances
        };
    });

    const stockDetails = stockPortfolio.map(s => {
        const snap10 = snapshots.find(snap => snap.year === 10);
        const snap20 = snapshots.find(snap => snap.year === 20);
        const snap30 = snapshots.find(snap => snap.year === 30);
        return {
            ...s,
            monthly: monthlyContribution * (allocations['stock'] || 0) * s.weight,
            pv: s.amount || 0,
            fv10: snap10?.stocks[s.symbol] || 0,
            fv20: snap20?.stocks[s.symbol] || 0,
            fv30: snap30?.stocks[s.symbol] || 0,
        };
    });

    const stockTimeline = snapshots.filter(s => s.year <= chartPeriod).map(s => {
        const step: any = { 
            year: s.year, 
            yearLabel: `Năm ${s.year}`,
            'Tổng danh mục': s.balances['stock']
        };
        stockPortfolio.forEach(stock => {
            step[stock.symbol] = s.stocks[stock.symbol];
        });
        return step;
    });

    const xAxisTicks = [];
    const tickStep = chartPeriod === 30 ? 5 : (chartPeriod === 20 ? 2 : 1);
    for (let i = 0; i <= chartPeriod; i += tickStep) {
        xAxisTicks.push(i);
    }

    // Mock Indices for global view (preserving current logic)
    const indices = [
      { name: 'VN Index', symbol: 'VNI', sub: 'Chỉ số chính HOSE', change: marketData['VNINDEX']?.percentChange || -1.04, isUp: (marketData['VNINDEX']?.percentChange || 0) >= 0, value: marketData['VNINDEX']?.close || 1280, type: 'index' },
    ];

    const portfolioMarketData = stockPortfolio.map(s => {
      const data = marketData[s.symbol];
      return {
        name: s.symbol,
        symbol: s.symbol,
        sub: s.name,
        change: data?.percentChange || 0,
        isUp: (data?.percentChange || 0) >= 0,
        value: data?.close || 0,
        type: 'stock'
      };
    });

    const marketSnapshot = [...indices, ...portfolioMarketData];

    const stockForecast = [10, 20, 30].map(y => {
      const s = snapshots.find(snap => snap.year === y);
      const vested = (simBalances['stock'] || 0) + (monthlyContribution * (allocations['stock'] || 0) * y * 12);
      const total = s?.balances['stock'] || 0;
      return {
        year: y,
        vested,
        total,
        profit: total - vested
      };
    });

    const finalSnapshot = snapshots.find(s => s.year === 30);
    const growthRatio = (finalSnapshot?.vested || 1) > 0 ? (finalSnapshot!.total / finalSnapshot!.vested).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '0';

    return {
      monthlyInvestment: monthlyContribution,
      allocationData,
      forecastResults,
      timeline,
      stockDetails,
      stockForecast,
      stockTimeline,
      xAxisTicks,
      marketSnapshot,
      avgStockRate,
      summary: {
        vested: finalSnapshot?.vested || 0,
        final: finalSnapshot?.total || 0,
        profit: (finalSnapshot?.total || 0) - (finalSnapshot?.vested || 0),
        growth: growthRatio
      }
    };
  }, [netCashFlow, totalBalance, rates, allocations, simBalances, stockPortfolio, marketData, chartPeriod]);

  const formatCurrencyExact = (val: number) => {
    const formatOptions = { minimumFractionDigits: 0, maximumFractionDigits: 2 };
    if (val >= 1000000) {
      return (val / 1000000).toLocaleString('vi-VN', formatOptions) + ' triệu VNĐ';
    }
    return val.toLocaleString('vi-VN', formatOptions) + ' VNĐ';
  };

  const calculatedFV = useMemo(() => {
    const result: Record<string, number> = {};
    let totalStockFV = 0;

    // 1. Portfolio Stocks
    stockPortfolio.forEach(stock => {
        const rateMonthly = (stock.rate ?? 18) / 100 / 12;
        let fv = 0;

        const investments = stock.investments && stock.investments.length > 0
            ? stock.investments
            : [{ amount: stock.amount || 0, month: 0 }];

        investments.forEach(inv => {
            const growthMonths = Math.max(0, simMonth - inv.month);
            fv += inv.amount * Math.pow(1 + rateMonthly, growthMonths);
        });

        result[stock.symbol] = fv;
        totalStockFV += fv;
    });

    result['TOTAL_STOCK'] = totalStockFV;
    
    let overallFV = 0;
    DEFAULT_ALLOCATION.forEach(a => {
        if (a.key === 'stock') {
            result[a.key] = totalStockFV;
        } else {
            const rateYearly = rates[a.key] || 0;
            const rateMonthly = rateYearly / 100 / 12;
            let currentFVValue = 0;
            
            const history = simInvestments[a.key] || [];
            if (history.length > 0) {
                history.forEach(inv => {
                    const growthMonths = Math.max(0, simMonth - inv.month);
                    currentFVValue += inv.amount * Math.pow(1 + rateMonthly, growthMonths);
                });
            } else {
                // Initial assets case
                const principal = simBalances[a.key] || 0;
                currentFVValue = principal * Math.pow(1 + rateMonthly, simMonth);
            }
            
            result[a.key] = currentFVValue;
        }
        overallFV += result[a.key];
    });
    
    result['TOTAL_ALL'] = overallFV;

    return result;
  }, [stockPortfolio, simInvestments, simBalances, simMonth, rates]);

  return (
    <div className="space-y-6 pb-20">
      <Header 
        title="Mô phỏng đầu tư" 
        subtitle="Dự báo tăng trưởng tài sản dựa trên dòng tiền ròng hàng tháng với chiến lược đầu tư khoa học." 
        hideFilter 
        icon={<Calculator className="h-7 w-7 text-blue-400" />}
      >
        <RealTimeClock />
      </Header>

      {/* Confirmation Modal for Withdrawal */}
      {withdrawConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass-panel w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border-white/10 animate-in zoom-in-95 duration-300">
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4 text-amber-500">
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight">Xác nhận rút tiền</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Giao dịch chuyển đổi tài sản</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">Tài sản nguồn:</span>
                            <span className="text-[11px] text-white font-bold">{withdrawConfirm.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">Giá trị rút:</span>
                            <span className="text-sm text-emerald-400 font-black">{formatCurrency(withdrawConfirm.value)}</span>
                        </div>
                        <div className="h-px bg-white/5" />
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">Chuyển về:</span>
                            <span className="text-[11px] text-amber-400 font-bold uppercase">Tiền mặt (Cash)</span>
                        </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 italic leading-relaxed text-center px-2">
                        Sau khi rút, toàn bộ dữ liệu (tỷ trọng, số tiền đầu tư, giá trị hiện thời) của danh mục này sẽ được reset về 0. Tổng tài sản không thay đổi.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setWithdrawConfirm(null)}
                            className="px-4 py-3 rounded-2xl border border-white/10 text-[11px] font-bold text-slate-400 hover:bg-white/5 transition-all"
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            onClick={executeWithdraw}
                            className="px-4 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold shadow-lg shadow-amber-900/20 transition-all"
                        >
                            Xác nhận rút
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Tổng tài sản hiện tại', value: formatCurrency(calculatedFV['TOTAL_ALL'] || totalBalance), sub: simMonth > 0 ? `Sau ${simMonth} tháng tích lũy` : 'Tính từ thời điểm hiện tại', icon: Wallet, color: 'text-[#ffd700]', bg: 'bg-[#ffd700]/10' },
          { label: 'Dòng tiền nạp hàng tháng', value: formatCurrency(netCashFlow), sub: 'Tự động nạp vào Tiền mặt', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Tổng vốn sau 30 năm', value: formatCurrency(simulation.summary.vested), sub: 'Tổng vốn đầu tư định kỳ', icon: Banknote, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Dự báo tài sản (30 năm)', value: formatCurrency(simulation.summary.final), sub: '(Bao gồm lãi kép)', icon: Activity, color: 'text-[#00f5ff]', bg: 'bg-[#00f5ff]/10' },
          { label: 'Lợi nhuận dự kiến (30 năm)', value: formatCurrency(simulation.summary.profit), sub: 'Lợi nhuận ròng', icon: Sparkles, color: 'text-[#00ff9d]', bg: 'bg-[#00ff9d]/10' },
        ].map((card, i) => (
          <div key={i} className="glass-panel p-3.5 rounded-2xl border-white/5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-12 h-12 ${card.bg} rounded-bl-full opacity-50 group-hover:scale-110 transition-transform`} />
            <card.icon className={`h-4 w-4 ${card.color} mb-2.5`} />
            <div className={`text-[9px] ${card.color} opacity-80 uppercase tracking-wider mb-1 font-bold`}>{card.label}</div>
            <div className={`text-lg font-black ${card.color} mb-0.5 whitespace-nowrap truncate`}>{card.value}</div>
            <div className="text-[9px] text-slate-500 truncate">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="space-y-8">
        
        {/* Section 1: Overview Allocation */}
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                  1. Phân bổ tài sản hiện tại
              </h2>
              <p className="text-[10px] text-slate-500 italic">Tháng mô phỏng: {simMonth} | Tổng vốn đầu tư: {formatCurrency(totalBalance)} | Giá trị hiện thời: {formatCurrency(calculatedFV['TOTAL_ALL'])}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={resetBalances}
                className="px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-bold text-slate-400 hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <History className="w-3 h-3" />
                Đặt lại
              </button>
              <button 
                onClick={nextMonth}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <ArrowRightLeft className="w-3 h-3" />
                Sang tháng mới (+{formatCurrency(netCashFlow)})
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
             {/* Left: Donut */}
             <div className="lg:col-span-2 xl:col-span-2 p-2 flex flex-col items-center justify-center border-r border-white/5 relative">
                <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={simulation.allocationData.filter(d => d.weight > 0)}
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="weight"
                                labelLine={false}
                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(null)}
                                onClick={(_, index) => setActiveIndex(index)}
                                stroke="none"
                            >
                                {simulation.allocationData.filter(d => d.weight > 0).map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.color} 
                                        stroke="none"
                                        style={{ 
                                            filter: activeIndex === index ? `drop-shadow(0 0 8px ${entry.color}80)` : 'none',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer'
                                        }}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1 text-center px-4">
                    {activeIndex !== null && simulation.allocationData.filter(d => d.weight > 0)[activeIndex] ? (
                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-1 opacity-60" style={{ color: simulation.allocationData.filter(d => d.weight > 0)[activeIndex].color }}>
                                {simulation.allocationData.filter(d => d.weight > 0)[activeIndex].name}
                            </span>
                            <span className="text-xl font-black text-white leading-none">
                                {(simulation.allocationData.filter(d => d.weight > 0)[activeIndex].weight * 100).toFixed(0)}%
                            </span>
                            <span className="text-[7px] text-emerald-400 font-mono font-bold tracking-tighter mt-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                {formatCurrency(simulation.allocationData.filter(d => d.weight > 0)[activeIndex].monthly)}
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-black text-white tracking-tighter leading-none">
                                {(simulation.allocationData.reduce((sum, item) => sum + item.weight, 0) * 100).toFixed(0)}%
                            </span>
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold leading-none mt-1.5">
                                Phân bổ tổng
                            </span>
                        </div>
                    )}
                </div>
             </div>
             {/* Right: Table */}
             <div className="lg:col-span-10 xl:col-span-10 p-0 overflow-x-hidden border-l border-white/5">
                <table className="w-full text-left text-[10px] whitespace-nowrap border-collapse">
                    <thead>
                        <tr className="text-slate-500 uppercase text-[8px] tracking-widest border-b border-white/5">
                            <th rowSpan={2} className="px-4 py-3 font-bold border-r border-white/5" style={{ minWidth: '200px' }}>Danh mục</th>
                            <th colSpan={2} className="px-2 py-1 font-bold text-center border-r border-white/5 bg-white/[0.02]">Mục tiêu</th>
                            <th colSpan={3} className="px-2 py-1 font-bold text-center border-r border-white/5 bg-indigo-500/5">Thực tế</th>
                            <th rowSpan={2} className="px-4 py-3 font-bold text-center border-b border-white/5" style={{ minWidth: '120px' }}>Lãi suất kì vọng</th>
                        </tr>
                        <tr className="text-slate-500 uppercase text-[7px] tracking-widest border-b border-white/5">
                            <th className="px-2 py-2 font-bold text-center border-r border-white/5 bg-white/[0.02]" style={{ width: '100px' }}>Tỷ trọng</th>
                            <th className="px-2 py-2 font-bold text-center border-r border-white/5 bg-white/[0.02]" style={{ width: '140px' }}>Số tiền đầu tư</th>
                            <th className="px-2 py-2 font-bold text-center border-r border-white/5 bg-indigo-500/5" style={{ width: '100px' }}>Tỷ trọng</th>
                            <th className="px-2 py-2 font-bold text-center border-r border-white/5 bg-indigo-500/5" style={{ width: '140px', minWidth: '140px' }}>Số tiền đầu tư</th>
                            <th className="px-2 py-2 font-bold text-center border-r border-white/5 bg-indigo-500/5" style={{ width: '140px', minWidth: '140px' }}>Giá trị hiện thời</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {simulation.allocationData.map((item, i) => {
                            const targetWeight = DEFAULT_ALLOCATION.find(a => a.key === item.key)?.weight || 0;
                            const targetAmount = totalBalance * targetWeight;
                            return (
                                <tr key={i} className="group hover:bg-white/[0.01] transition-colors">
                                    <td className="px-1.5 py-2 border-r border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="p-1 rounded-md bg-slate-900 border border-white/5 shrink-0">
                                                <item.icon className="w-2.5 h-2.5" style={{ color: item.color }} />
                                            </div>
                                            <span className="font-bold text-slate-200 text-[10px]">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-1.5 py-2 font-medium text-white text-[10px] text-center border-r border-white/5 bg-white/[0.01]">
                                        {(targetWeight * 100).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}%
                                    </td>
                                    <td className="px-1.5 py-2 font-sans text-purple-400 text-[10px] text-center border-r border-white/5 bg-white/[0.01]">
                                        {formatCurrency(targetAmount)}
                                    </td>
                                    <td className="px-1.5 py-2 font-sans font-bold text-[10px] text-center border-r border-white/5" style={{ backgroundColor: `${item.color}05`, color: item.color }}>
                                        {(item.weight * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%
                                    </td>
                                    <td className="px-1.5 py-2 border-r border-white/5 align-top" style={{ backgroundColor: `${item.color}05` }}>
                                                <div className="flex flex-col gap-1 px-1">
                                                    <div className="relative flex-1 group">
                                                        <input 
                                                            type="number"
                                                            value={simBalances[item.key] !== undefined ? Number((simBalances[item.key] / 1000000)) : ''}
                                                            disabled={true}
                                                            className={`w-full bg-[#1e293b]/50 border border-white/20 rounded-lg pl-2 ${item.key === 'cash' ? 'pr-2 text-center' : 'pr-[85px]'} py-1.5 text-[10px] text-white font-mono transition-all`}
                                                            style={{ width: '127.333px' }}
                                                        />
                                                        {item.key !== 'cash' && (
                                                          <>
                                                            <div className="absolute right-7 top-1/2 -translate-y-1/2 text-[8px] text-slate-500 font-bold pointer-events-none">triệu VNĐ</div>
                                                            <button 
                                                                onClick={() => {
                                                                    setAddModes(prev => ({...prev, [item.key]: !prev[item.key]}));
                                                                    setAddErrors(prev => ({...prev, [item.key]: undefined}));
                                                                }}
                                                                className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white transition-colors"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                          </>
                                                        )}
                                                    </div>
                                                    {addModes[item.key] && (
                                                        <div className="flex flex-col gap-1 mt-1">
                                                            <div className="flex items-center gap-1 border border-indigo-500/30 rounded p-1 bg-white/[0.03] shadow-inner">
                                                                <div className="text-[10px] text-indigo-400 font-bold pl-1">+</div>
                                                                <input 
                                                                    type="number"
                                                                    placeholder="Thêm (triệu VNĐ)"
                                                                    value={addAmounts[item.key] || ''}
                                                                    onChange={e => {
                                                                        setAddAmounts(prev => ({...prev, [item.key]: e.target.value}));
                                                                        setAddErrors(prev => ({...prev, [item.key]: undefined}));
                                                                    }}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') handleAddAllocation(item.key);
                                                                    }}
                                                                    className="flex-1 bg-transparent w-full min-w-0 px-1 py-0.5 text-[10px] text-white font-mono focus:outline-none"
                                                                />
                                                                <button
                                                                    onClick={() => handleAddAllocation(item.key)}
                                                                    className="px-2 py-0.5 bg-indigo-600 rounded-sm text-[9px] text-white hover:bg-indigo-500"
                                                                >
                                                                    Lưu
                                                                </button>
                                                            </div>
                                                            {addErrors[item.key] && (
                                                                <span className="text-[9px] text-red-400 font-medium">{addErrors[item.key]}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                    </td>
                                    <td className="px-1.5 py-2 font-mono text-[10px] text-center border-r border-white/5 font-bold" style={{ color: '#00ff9d' }}>
                                        <div className="flex flex-col items-center justify-center gap-1">
                                            <span>{formatCurrency(calculatedFV[item.key]) || '0 VNĐ'}</span>
                                            {item.key === 'savings' && calculatedFV[item.key] > 0 && (
                                                <button 
                                                    onClick={() => handleWithdrawAll(item.key, item.name, calculatedFV[item.key])}
                                                    className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-tighter border border-amber-500/20 transition-all cursor-pointer"
                                                >
                                                    Rút
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-1.5 py-2 text-center border-r border-white/5">
                                        <div className="flex items-center justify-center gap-1">
                                            <input 
                                                type="number"
                                                step="0.1"
                                                value={item.key === 'stock' ? simulation.avgStockRate.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : rates[item.key]}
                                                disabled={item.key === 'stock'}
                                                onChange={(e) => updateRate(item.key, Number(e.target.value))}
                                                className={`w-[60px] bg-slate-950 border border-white/10 rounded-md px-0.5 py-0.5 text-center transition-all font-sans text-[10px] ${item.key === 'stock' ? 'text-emerald-400 font-bold border-emerald-500/30 cursor-not-allowed' : 'text-white focus:border-cyan-500 focus:outline-none'}`}
                                            />
                                            <span className="text-slate-600 text-[9px]">%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-900/40 font-bold border-t border-white/10 text-white">
                            <td className="px-1.5 py-3 border-r border-white/5 text-[9px] uppercase font-black tracking-widest" style={{ paddingLeft: '39px' }}>Tổng cộng</td>
                            <td className="px-1.5 py-3 text-[10px] text-center border-r border-white/5 bg-white/[0.02] text-white">100%</td>
                            <td className="px-1.5 py-3 font-sans text-[10px] text-center border-r border-white/5 bg-white/[0.02]" style={{ color: '#e2dee6' }}>{formatCurrency(totalBalance)}</td>
                            <td className="px-1.5 py-3 text-[10px] text-center border-r border-white/5 bg-indigo-500/5">
                                {(allocations ? Object.values(allocations).reduce((s, w) => s + w, 0) * 100 : 0).toFixed(0)}%
                            </td>
                            <td className="px-1.5 py-3 font-sans text-[10px] text-center border-r border-white/5 bg-indigo-500/5">
                                {formatCurrency(totalBalance)}
                            </td>
                            <td className="px-1.5 py-3 font-mono text-[11px] text-center border-r border-white/5 bg-indigo-500/5 font-bold" style={{ color: '#00ff9d' }}>
                                {formatCurrency(calculatedFV['TOTAL_ALL']) || '0 VNĐ'}
                            </td>
                            <td className="bg-slate-900/40 border-r border-white/5"></td>
                        </tr>
                    </tfoot>
                </table>
             </div>
          </div>
        </div>

        {/* Section 2: Unified Stock Investment Container */}
        <div className="space-y-8">
            {/* Header / Summary */}
            <div className="glass-panel rounded-3xl overflow-hidden p-8 bg-white/[0.01]">
                <div className="space-y-6">
                    <h2 className="text-sm font-bold text-[#ec4899] uppercase tracking-[0.2em] flex items-center gap-2">
                        2. Chi tiết đầu tư cổ phiếu
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-900/60 border border-white/10 rounded-2xl shadow-xl shadow-black/20">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <BarChart2 className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Tổng đầu tư / tháng</div>
                                <div className="text-base font-bold text-cyan-400">{formatCurrency(simBalances['stock'] || 0)}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-900/60 border border-white/10 rounded-2xl shadow-xl shadow-black/20">
                            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Số mã cổ phiếu</div>
                                <div className="text-base font-bold text-cyan-400">{stockPortfolio.length} mã</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-900/60 border border-white/10 rounded-2xl shadow-xl shadow-black/20">
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Lãi suất kỳ vọng</div>
                                <div className="text-base font-bold text-emerald-400">{simulation.avgStockRate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% /năm</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stock List Panel - Full Width */}
                    <div className="flex flex-col glass-panel rounded-3xl overflow-hidden">
                        {/* Custom Selection Bar */}
                        <div className="p-4 bg-slate-900/40 border-b border-white/5 flex flex-col gap-3 px-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 shadow-inner">
                                    <span className="text-[11px] text-slate-300 whitespace-nowrap">Đã chọn: <span className="text-emerald-400 font-black">{stockPortfolio.length}</span> / 5 mã</span>
                                </div>
                                
                                <div className="flex-1 flex items-center gap-2 relative">
                                    <div className="relative flex-1 group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#ec4899] transition-colors">
                                            <Search className="w-3.5 h-3.5" />
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="Tìm mã hoặc tên cổ phiếu..."
                                            value={newStockSymbol}
                                            onChange={(e) => setNewStockSymbol(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => e.key === 'Enter' && addStock()}
                                            disabled={stockPortfolio.length >= 5}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[11px] text-white focus:border-[#ec4899] focus:outline-none transition-all placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        {newStockSymbol && (
                                            <div className="absolute left-0 top-full mt-1 w-full z-50">
                                                {VN_STOCKS[newStockSymbol.toUpperCase()] ? (
                                                    stockPortfolio.find(s => s.symbol === newStockSymbol.toUpperCase()) ? (
                                                        <div className="w-full bg-slate-900 border border-amber-500/30 rounded-xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-1">
                                                            <div className="text-[8px] text-amber-500 font-bold uppercase tracking-wider mb-0.5">Trạng thái:</div>
                                                            <div className="text-[10px] font-bold text-amber-400">Mã này đã có trong danh mục</div>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => addStock()}
                                                            className="w-full text-left bg-slate-900 border border-emerald-500/30 rounded-xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-1 hover:bg-slate-800 transition-all group"
                                                        >
                                                            <div className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Phát hiện mã hợp lệ:</div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-[10px] font-bold text-white uppercase">{VN_STOCKS[newStockSymbol.toUpperCase()]}</div>
                                                                <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <span>Click để thêm</span>
                                                                    <Plus className="w-3 h-3" />
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )
                                                ) : (
                                                    <div className="w-full bg-slate-900 border border-rose-500/30 rounded-xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-1">
                                                        <div className="text-[8px] text-rose-500 font-bold uppercase tracking-wider mb-0.5">Cảnh báo:</div>
                                                        <div className="text-[10px] font-bold text-rose-400 italic">Mã không hợp lệ hoặc không thuộc VN100</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={addStock}
                                        disabled={!newStockSymbol.trim() || stockPortfolio.length >= 5}
                                        className="p-2 bg-gradient-to-br from-[#ec4899] to-[#8b5cf6] hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-white rounded-xl shadow-lg shadow-pink-500/20 transition-all active:scale-95 shrink-0"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Target weight info line */}
                            <div className="flex items-center gap-3 px-1 text-[10px] font-bold">
                                <div className="flex items-center gap-1.5 opacity-80">
                                    <span className="text-slate-500 uppercase tracking-wider">Tỷ trọng mục tiêu (mỗi mã):</span>
                                    <span className="text-[#ec4899]">20%</span>
                                </div>
                                <div className="w-1 h-1 bg-slate-700 rounded-full" />
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500 uppercase tracking-wider">Lãi suất kì vọng:</span>
                                    <span className="text-cyan-400 font-black">{simulation.avgStockRate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar min-w-0 pb-2">
                            <table className="w-full max-w-4xl mx-auto text-left text-[11px] whitespace-nowrap border-collapse">
                                <thead>
                                    <tr className="text-slate-500 uppercase text-[9px] tracking-widest bg-white/[0.02] border-b border-white/5">
                                        <th className="px-1 py-3 font-bold border-r border-white/5 text-center min-w-[60px] w-[60px]">Mã</th>
                                        <th className="px-1 py-3 font-bold border-r border-white/5 text-center min-w-[100px] w-auto">Tên Công Ty</th>
                                        <th className="px-1 py-3 font-bold text-center border-r border-white/5 min-w-[70px] w-[70px]">Lãi suất (%)</th>
                                        <th className="px-1 py-3 font-bold border-r border-white/5 text-center min-w-[100px] w-[110px]">Số tiền đầu tư (Triệu)</th>
                                        <th className="px-1 py-3 font-bold text-center border-r border-white/5 bg-indigo-500/10 min-w-[60px] w-[60px]">Tỷ trọng</th>
                                        <th className="px-1 py-3 font-bold border-r border-white/5 text-center relative group/slcp min-w-[70px] w-[80px]">
                                            <div className="flex items-center justify-center gap-1">
                                                <span>SL CP</span>
                                                <Info className="w-2.5 h-2.5 opacity-40 ml-0.5" />
                                            </div>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-white/10 rounded-lg shadow-2xl opacity-0 group-hover/slcp:opacity-100 pointer-events-none transition-all z-50">
                                                <div className="text-[8px] text-slate-400 font-bold uppercase mb-1">Công thức tính:</div>
                                                <div className="text-[9px] text-white font-mono">SL CP = Đầu tư ÷ Giá hiện tại</div>
                                            </div>
                                        </th>
                                        <th className="px-1 py-3 font-bold border-r border-white/5 text-center min-w-[100px] w-[110px]">Giá trị hiện thời</th>
                                        <th className="px-1 py-3 font-bold text-center min-w-[40px] w-[40px]">Xóa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {simulation.stockDetails.map((stock: any, i: number) => {
                                        const colors = ['#00d1ff', '#ff9900', '#00ff94', '#ffcc00', '#8b5cf6'];
                                        const bgColor = colors[i % colors.length];
                                        const marketItem = marketData[stock.symbol];
                                        const currentPrice = marketItem?.price || marketItem?.close || 0;
                                        const percentChange = marketItem?.percentChange || 0;
                                        const stockAmountActual = stock.amount || 0;
                                        const slcp = (currentPrice > 0 && stockAmountActual > 0) ? Math.floor(stockAmountActual / (currentPrice * 1000)) : 0;
                                        
                                        return (
                                            <tr key={i} className="hover:bg-white/[0.03] transition-colors group">
                                                <td className="px-2 py-2 border-r border-white/5">
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <div className="w-6 h-6 rounded-lg border border-white/10 flex items-center justify-center bg-slate-950 shrink-0 relative overflow-hidden group-hover:border-white/20 transition-all">
                                                            <div className="absolute inset-0 opacity-20" style={{ backgroundColor: bgColor }} />
                                                            <span className="text-[7px] font-black relative z-10" style={{ color: bgColor }}>{stock.symbol.substring(0, 3)}</span>
                                                        </div>
                                                        <span className="font-bold tracking-widest text-[11px]" style={{ color: bgColor }}>{stock.symbol}</span>
                                                    </div>
                                                </td>
                                                <td className="truncate max-w-[120px] border-r border-white/5 text-[10px] px-2 py-2 text-center font-bold" style={{ color: bgColor }}>{stock.name}</td>
                                                <td className="px-2 py-2 text-center border-r border-white/5">
                                                    <div className="flex items-center justify-center gap-0.5">
                                                        <input 
                                                            type="number"
                                                            step="0.1"
                                                            value={stock.rate ?? 18}
                                                            onChange={(e) => updateStockRate(stock.symbol, Number(e.target.value))}
                                                            className="w-12 bg-slate-950 border border-white/10 rounded-md px-1 py-0.5 text-center text-white text-[11px] font-bold focus:border-pink-500 focus:outline-none transition-all"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 text-center border-r border-white/5 bg-white/[0.01]">
                                                    <div className="flex flex-col items-center relative">
                                                        <div className="flex items-center justify-center gap-1 relative w-full max-w-[120px] mx-auto">
                                                            <input 
                                                                type="number"
                                                                step="0.1"
                                                                value={stockAmountActual > 0 ? Number((stockAmountActual / 1000000).toFixed(2)) : ''}
                                                                placeholder="0"
                                                                onChange={(e) => updateStockAmount(stock.symbol, Number(e.target.value) * 1000000)}
                                                                className="w-full bg-slate-950 border border-white/10 rounded-md pl-2 pr-12 py-1 text-center text-emerald-400 text-[11px] font-bold focus:border-cyan-500 focus:outline-none transition-all"
                                                            />
                                                            <span className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none">triệu</span>
                                                            <button 
                                                                onClick={() => {
                                                                    setStockAddModes(prev => ({...prev, [stock.symbol]: !prev[stock.symbol]}));
                                                                    setStockAddErrors(prev => ({...prev, [stock.symbol]: undefined}));
                                                                }}
                                                                className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white transition-colors"
                                                                title="Thêm số tiền"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        
                                                        {stockAddModes[stock.symbol] && (
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-20 w-[140px]">
                                                                <div className="flex items-center gap-1 border border-indigo-500 rounded p-1 bg-indigo-950 shadow-xl">
                                                                    <div className="text-[10px] text-indigo-400 font-bold pl-1">+</div>
                                                                    <input 
                                                                        type="number"
                                                                        placeholder="Thêm (triệu)"
                                                                        value={stockAddAmounts[stock.symbol] || ''}
                                                                        onChange={e => {
                                                                            setStockAddAmounts(prev => ({...prev, [stock.symbol]: e.target.value}));
                                                                            setStockAddErrors(prev => ({...prev, [stock.symbol]: undefined}));
                                                                        }}
                                                                        onKeyDown={e => {
                                                                            if (e.key === 'Enter') handleAddStockAllocation(stock.symbol);
                                                                        }}
                                                                        className="flex-1 bg-transparent w-full min-w-0 px-1 py-0.5 text-[10px] text-white font-mono focus:outline-none placeholder:text-indigo-400/50"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleAddStockAllocation(stock.symbol)}
                                                                        className="px-2 py-0.5 bg-indigo-600 rounded-sm text-[9px] text-white hover:bg-indigo-500 font-bold"
                                                                    >
                                                                        OK
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 font-mono border-r border-white/5 text-[11px] text-center font-bold" style={{ color: bgColor + 'cc' }}>
                                                    {(stock.weight * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%
                                                </td>
                                                <td className="px-3 py-2 border-r border-white/5 text-center align-middle">
                                                    <div className={`flex flex-col items-center justify-center transition-all duration-500 ${percentChange < 0 ? 'scale-105' : 'scale-100'}`}>
                                                        <span 
                                                            className={`text-[13px] font-bold font-mono tracking-tight transition-all duration-500 tabular-nums shadow-sm`}
                                                            style={{ 
                                                                fontVariantNumeric: 'tabular-nums',
                                                                color: bgColor,
                                                                textShadow: percentChange < 0 ? `0 0 10px ${bgColor}66` : 'none'
                                                            }}
                                                        >
                                                            {slcp === 0 ? "---" : slcp.toLocaleString('vi-VN')}
                                                        </span>
                                                        <span className={`text-[8px] font-bold uppercase tracking-tighter opacity-60 mt-0.5`} style={{ color: bgColor }}>
                                                            Cổ Phiếu
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 font-mono text-[11px] font-bold text-center border-r border-white/5" style={{ color: '#00ff9d' }}>
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        <span>{calculatedFV[stock.symbol] > 0 ? formatCurrencyExact(calculatedFV[stock.symbol]) : "---"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 text-center">
                                                    <button 
                                                        onClick={() => removeStock(stock.symbol)}
                                                        className="p-1.5 hover:bg-rose-500/20 text-slate-600 hover:text-rose-400 rounded-md transition-colors inline-flex items-center justify-center"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {stockPortfolio.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-8 text-center text-slate-500 italic text-[11px]">
                                                Chưa có cổ phiếu nào được chọn.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-900/40 font-bold border-t border-white/10">
                                        <td colSpan={2} className="px-3 py-3 text-white font-bold uppercase text-[10px] tracking-widest border-r border-white/5 text-right pr-6">Tổng cộng</td>
                                        <td className="px-3 py-3 text-cyan-400 font-mono tracking-tight border-r border-white/5 text-[12px] text-center font-bold">
                                            {simulation.avgStockRate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%
                                        </td>
                                        <td className="px-3 py-3 text-white font-mono tracking-tight border-r border-white/5 text-[12px] text-center font-bold">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <span className={stockPortfolio.reduce((acc, s) => acc + (s.amount || 0), 0) > (simBalances['stock'] || 0) ? 'text-rose-400' : 'text-emerald-400'}>
                                                    {formatCurrency(stockPortfolio.reduce((acc, s) => acc + (s.amount || 0), 0))}
                                                </span>
                                                {stockPortfolio.reduce((acc, s) => acc + (s.amount || 0), 0) > (simBalances['stock'] || 0) && (
                                                    <span className="text-[8px] text-rose-500 font-bold leading-tight max-w-[120px] text-center">Không đủ tiền để đầu tư. Tối đa: {formatCurrency(simBalances['stock'] || 0)}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`px-2 py-3 font-black text-center border-r border-white/5 text-[12px] ${
                                            stockPortfolio.reduce((acc, s) => acc + s.weight, 0) * 100 > 100 ? 'text-rose-400' : 'text-cyan-400'
                                        }`}>
                                            {(stockPortfolio.reduce((acc, s) => acc + s.weight, 0) * 100).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}%
                                        </td>
                                        <td className="px-3 py-3 border-r border-white/5"></td>
                                        <td className="px-3 py-3 font-mono text-[11px] font-bold text-center border-r border-white/5" style={{ color: '#00ff9d' }}>
                                            {calculatedFV['TOTAL_STOCK'] > 0 ? formatCurrencyExact(calculatedFV['TOTAL_STOCK']) : "---"}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch">
                        {/* Stock growth chart for the selected portfolio */}
                        <div className="lg:col-span-6 glass-panel rounded-3xl flex flex-col p-8 bg-slate-900/40 relative overflow-hidden">
                            {/* Futuristic Background accents */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

                            <div className="mb-8 relative z-10 space-y-4">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    <h3 className="text-sm font-black text-[#47bff9] uppercase tracking-[0.2em] flex items-center gap-2 drop-shadow-md">
                                        <Activity className="w-5 h-5 text-cyan-400" /> BIỂU ĐỒ MÔ PHỎNG TĂNG TRƯỞNG
                                    </h3>
                                    <div className="flex bg-[#0f172a] rounded-xl p-1.5 border border-white/10 shadow-inner shrink-0 relative z-20">
                                        {[10, 20, 30].map(period => (
                                            <button
                                                key={period}
                                                onClick={() => setChartPeriod(period)}
                                                className={`px-5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-300 ${chartPeriod === period ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                            >
                                                {period} NĂM
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-[12px] text-[#f5f7f9] font-mono flex items-center overflow-x-auto custom-scrollbar pb-1">
                                    <span className="flex items-center whitespace-nowrap">
                                        FV = PV(1+r)<sup className="mx-0.5">n</sup> + 
                                        <span className="inline-flex flex-col items-center justify-center px-1 align-middle mx-1">
                                            <span className="text-[8px] leading-none font-bold" style={{ color: '#f5f9f9' }}>n</span>
                                            <span className="text-lg leading-none font-serif">&sum;</span>
                                            <span className="text-[8px] leading-none font-bold" style={{ color: '#ffffff', height: '9px', paddingTop: '1px' }}>k=1</span>
                                        </span>
                                        [(Cash<sub className="bottom-0">k-1</sub> + Contribution<sub className="bottom-0">k</sub>)w](1+r)<sup className="mx-0.5">n-k</sup>
                                    </span>
                                </p>
                            </div>

                            <div className="flex-1 min-h-[450px] w-full relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={simulation.stockTimeline} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis 
                                            dataKey="year" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            ticks={simulation.xAxisTicks}
                                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tickCount={10}
                                            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }}
                                            tickFormatter={(v) => v >= 1000000000 ? `${(v/1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tỷ` : `${(v/1000000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} Tr`}
                                            width={50}
                                        />
                                        <Tooltip 
                                            labelFormatter={(label) => `Năm ${label}`}
                                            contentStyle={{ 
                                                backgroundColor: 'rgba(15, 23, 42, 0.85)', 
                                                backdropFilter: 'blur(16px)',
                                                border: '1px solid rgba(255,255,255,0.1)', 
                                                borderRadius: '16px',
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                                                padding: '16px'
                                            }}
                                            labelStyle={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}
                                            itemStyle={{ fontSize: '13px', padding: '4px 0', fontFamily: 'monospace', fontWeight: 600 }}
                                            formatter={(v: number, name: string) => [
                                                formatCurrency(v),
                                                name
                                            ]}
                                            itemSorter={(item: any) => {
                                                if (item.dataKey === 'Tổng danh mục') return -1;
                                                return 1;
                                            }}
                                        />
                                        <Legend 
                                            verticalAlign="top" 
                                            align="center" 
                                            iconType="circle" 
                                            iconSize={6} 
                                            wrapperStyle={{ fontSize: '11px', paddingBottom: '30px', fontWeight: 600, color: '#94a3b8' }} 
                                        />
                                        
                                        <Line 
                                            type="monotone" 
                                            dataKey="Tổng danh mục" 
                                            name="Tổng Danh Mục"
                                            stroke="#06b6d4" 
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                                            style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.6))' }}
                                        />
                                        {stockPortfolio.map((stock: any, i: number) => {
                                            const colors = ['#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
                                            const color = colors[i % colors.length];
                                            return (
                                                <Line 
                                                    key={stock.symbol}
                                                    type="monotone" 
                                                    dataKey={stock.symbol} 
                                                    name={stock.symbol}
                                                    stroke={color} 
                                                    strokeWidth={2}
                                                    strokeDasharray="4 4"
                                                    dot={false}
                                                    activeDot={{ r: 5, fill: color, stroke: '#0f172a', strokeWidth: 2 }}
                                                    style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}
                                                />
                                            );
                                        })}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            
                            {/* Line overlap hint */}
                            {stockPortfolio.some((s1, i, arr) => arr.some((s2, j) => i !== j && s1.rate === s2.rate && s1.weight === s2.weight)) && (
                                <div className="mt-2 text-center text-[10px] text-amber-500/70 italic flex items-center justify-center gap-1.5">
                                    <Info className="w-3 h-3" />
                                    <span>Lưu ý: Các mã có kỳ vọng và tỷ trọng bằng nhau sẽ có đường tăng trưởng trùng lặp.</span>
                                </div>
                            )}
                        </div>

                        {/* Market Snapshot Column */}
                        <div className="lg:col-span-4 flex flex-col gap-6 glass-panel border-white/10 bg-[#0f172a]/40 p-6 rounded-[2.5rem] overflow-hidden">
                            {/* Header Section */}
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-[30px] h-[30px] bg-[#00d1ff] rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                                    <Activity className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-[13px] font-black text-white uppercase tracking-tight">THỊ TRƯỜNG & TIN TỨC</h2>
                                        <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
                                    </div>
                                    <div className="flex items-center gap-2 opacity-60">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">DỮ LIỆU TRADINGVIEW</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* VN INDEX Special Card */}
                        <a 
                            href="https://vn.tradingview.com/symbols/HOSE-VNINDEX/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass-panel border-white/10 bg-[#0f172a]/60 p-4 rounded-3xl flex items-center justify-between group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-bold text-white tracking-widest truncate">VN INDEX</span>
                                <span className="text-[8px] text-slate-500 font-medium truncate">Chỉ số chính HOSE</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {loadingStocks['VNINDEX'] && !marketData['VNINDEX'] ? (
                                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                                ) : errorStocks['VNINDEX'] ? (
                                    <span className="text-[8px] text-rose-500 italic">Lỗi</span>
                                ) : (
                                    <div className="flex flex-col items-end">
                                        <span className={`text-[9px] font-bold font-mono ${(marketData['VNINDEX']?.percentChange || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {(marketData['VNINDEX']?.percentChange || 0) >= 0 ? '+' : ''}{(marketData['VNINDEX']?.percentChange || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%
                                        </span>
                                        <span className="text-sm font-bold text-white font-mono tracking-tight tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                            {formatVNPrice(marketData['VNINDEX']?.close || marketData['VNINDEX']?.price, true)}
                                        </span>
                                    </div>
                                )}
                                <ArrowRightLeft className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors rotate-90 shrink-0" />
                            </div>
                        </a>

                        {/* Selected Stocks List */}
                        <div className="space-y-2">
                            {stockPortfolio.map((stock: any) => {
                                const isExpanded = expandedStock === stock.symbol;
                                const data = marketData[stock.symbol];
                                const isLoading = loadingStocks[stock.symbol] && !data;
                                const isError = errorStocks[stock.symbol];
                                
                                const price = data?.price || data?.close || 0;
                                const change = data?.percentChange || 0;
                                const isUp = change > 0;
                                const isDown = change < 0;
                                const colorClass = isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-amber-500';

                                // Use real chart data if available, otherwise mock a flat line
                                const chartPoints = stockCharts[stock.symbol] || [];
                                const chartData = chartPoints.length > 0 ? chartPoints.map((p: any, idx: number) => ({
                                    time: p.time || idx.toString(),
                                    price: p.close || p.price || price
                                })) : [
                                    { time: '09:00', price: price * 0.99 },
                                    { time: '14:45', price: price },
                                ];

                                return (
                                    <div 
                                        key={stock.symbol}
                                        className={`glass-panel transition-all duration-300 overflow-hidden rounded-3xl ${isExpanded ? 'border-amber-500/50 bg-[#0f172a]/80 ring-1 ring-amber-500/20 shadow-2xl shadow-amber-500/5' : 'border-white/5 bg-[#0f172a]/40 hover:bg-white/5'}`}
                                    >
                                        {/* Card Header */}
                                        <div 
                                            className="p-3 flex items-center justify-between cursor-pointer"
                                            onClick={() => setExpandedStock(isExpanded ? null : stock.symbol)}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] shadow-inner shadow-black/40 transition-colors shrink-0 ${isExpanded ? 'bg-amber-500 text-slate-900 font-black' : 'bg-indigo-600/40 text-indigo-100 uppercase'}`}>
                                                    {stock.symbol.substring(0, 3)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs font-black text-white tracking-widest truncate">{stock.symbol}</span>
                                                        {isLoading && <Loader2 className="w-2 h-2 text-cyan-400 animate-spin shrink-0" />}
                                                    </div>
                                                    <span className="text-[9px] text-slate-500 font-medium truncate">{stock.name}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 shrink-0">
                                                {!isExpanded ? (
                                                    <div className="flex items-center gap-2">
                                                        {isError ? (
                                                            <AlertCircle className="w-3 h-3 text-rose-500" />
                                                        ) : (
                                                            <div className="flex flex-col items-end">
                                                                <span className={`text-[9px] font-black font-mono leading-none ${colorClass}`}>
                                                                    {isUp ? '+' : ''}{change.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%
                                                                </span>
                                                                <span className="text-[11px] font-bold text-white font-mono mt-0.5 tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                                    {formatVNPrice(price)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600 rotate-90" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex flex-col items-end">
                                                            <span className={`text-xl font-black font-mono tracking-tighter leading-none tabular-nums animate-in fade-in duration-500 ${colorClass}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                                {formatVNPrice(price)}
                                                            </span>
                                                            <span className={`text-[10px] font-bold mt-1 ${colorClass}`}>
                                                                {isUp ? '+' : ''}{change.toFixed(2)}%
                                                            </span>
                                                        </div>
                                                        <button className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                                            <X className="w-4 h-4 text-slate-500 hover:text-white" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded Content */}
                                        {isExpanded && (
                                            <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
                                                    {/* Mini Chart */}
                                                    <div className="h-32 relative">
                                                        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[8px] text-slate-600 font-mono py-1 pointer-events-none">
                                                            <span>{formatVNPrice(data?.high || price * 1.01)}</span>
                                                            <span>{formatVNPrice(data?.low || price * 0.99)}</span>
                                                        </div>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={chartData}>
                                                                <defs>
                                                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity={0.3}/>
                                                                        <stop offset="95%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                                                                    </linearGradient>
                                                                </defs>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                                <Area 
                                                                    type="monotone" 
                                                                    dataKey="price" 
                                                                    stroke={isUp ? "#10b981" : "#f43f5e"} 
                                                                    strokeWidth={2} 
                                                                    fill="url(#chartGradient)"
                                                                    animationDuration={1000}
                                                                />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                        <div className="flex justify-between text-[8px] text-slate-600 font-mono mt-1 px-1">
                                                            <span>09:00</span>
                                                            <span>{data?.lastTime || '14:45'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Stats Grid */}
                                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                                        {[
                                                            { label: 'Tham chiếu', value: formatVNPrice(data?.basicPrice), color: 'text-amber-500' },
                                                            { label: 'Mở cửa', value: formatVNPrice(data?.open), color: 'text-emerald-400' },
                                                            { label: 'Cao nhất', value: formatVNPrice(data?.high), color: 'text-emerald-400' },
                                                            { label: 'Thấp nhất', value: formatVNPrice(data?.low), color: 'text-rose-400' },
                                                            { label: 'Khối lượng', value: formatVNVolume(data?.accumulatedVol), color: 'text-white' },
                                                            { label: 'Giá trị', value: formatVNValue(data?.accumulatedVol ? price * 1000 * data.accumulatedVol : undefined), color: 'text-white' },
                                                        ].map((stat, idx) => (
                                                            <div key={idx} className="flex flex-col border-b border-white/5 pb-1">
                                                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter mb-0.5">{stat.label}</span>
                                                                <span className={`text-[11px] font-bold font-mono tracking-tight tabular-nums ${stat.color}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{stat.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mt-6">
                                                    <button className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-white/10 hover:bg-amber-500/10 hover:border-amber-500/30 text-[10px] text-white font-black uppercase tracking-tight transition-all">
                                                        <Star className="w-3.5 h-3.5 text-amber-500" /> Thêm theo dõi
                                                    </button>
                                                    <a 
                                                        href={`https://vn.tradingview.com/symbols/HOSE-${stock.symbol}/`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-[10px] text-white font-black uppercase tracking-tight transition-all"
                                                    >
                                                        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Xem chi tiết
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 mt-2 opacity-40">
                             <Info className="w-3 h-3 text-white" />
                             <span className="text-[9px] text-white font-medium italic">Nhấn vào mã cổ phiếu để xem giá hiện tại</span>
                        </div>
                    </div>
                </div>

                {/* Simulation Table Request (BẢNG MÔ PHỎNG) */}
                {stockPortfolio.length > 0 && (
                    <div className="glass-panel rounded-[2.5rem] overflow-hidden relative bg-[#0f172a]">
                        <div className="p-8">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 drop-shadow-md mb-6">
                                <Layers className="w-5 h-5 text-purple-400" /> BẢNG TỔNG HỢP MÔ PHỎNG KỲ VỌNG
                            </h3>
                            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#060b14] shadow-2xl">
                                <table className="w-full text-center text-[11px] border-collapse font-bold">
                                    <thead>
                                        <tr className="text-slate-500 uppercase text-[9px] tracking-widest bg-white/[0.03] border-b border-white/10 font-bold">
                                            <th className="px-4 py-5 font-bold">Mã</th>
                                            <th className="px-4 py-5 font-bold border-l border-white/5 flex flex-col items-center justify-center"><span className="text-emerald-400">Lãi suất</span><span>(kỳ vọng)</span></th>
                                            <th className="px-4 py-5 font-bold border-l border-white/5">Đầu tư/tháng</th>
                                            <th className="px-4 py-5 font-bold border-l border-white/5">Sau 10 năm</th>
                                            <th className="px-4 py-5 font-bold border-l border-white/5">Sau 20 năm</th>
                                            <th className="px-4 py-5 font-bold border-l border-white/5">Sau 30 năm</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {simulation.stockDetails.map((stock: any, i: number) => {
                                            const colors = ['#00d1ff', '#ff9900', '#00ff94', '#ffcc00', '#8b5cf6'];
                                            const rowColor = colors[i % colors.length];
                                            const fvFormatter = (v: number) => {
                                                if (!v || v <= 0) return "---";
                                                const formatOptions = { minimumFractionDigits: 0, maximumFractionDigits: 2 };
                                                return v >= 1_000_000_000 ? `${(v/1_000_000_000).toLocaleString('vi-VN', formatOptions)} tỷ VNĐ` : `${(v/1_000_000).toLocaleString('vi-VN', formatOptions)} triệu VNĐ`;
                                            };
                                            return (
                                                <tr key={i} className="hover:bg-white/[0.04] transition-colors group">
                                                    <td className="px-4 py-4 font-bold tracking-widest text-[12px]" style={{ color: rowColor }}>{stock.symbol}</td>
                                                    <td className="px-4 py-4 font-mono font-bold text-emerald-400 border-l border-white/5 text-[12px]">{stock.rate ?? 18}%</td>
                                                    <td className="px-4 py-4 font-mono font-bold text-slate-200 border-l border-white/5 text-[12px]">{formatCurrency(stock.monthly)}</td>
                                                    <td className="px-4 py-4 font-mono font-bold border-l border-white/5 text-[12px]" style={{ color: `${rowColor}dd` }}>{fvFormatter(stock.fv10)}</td>
                                                    <td className="px-4 py-4 font-mono font-bold border-l border-white/5 text-[12px]" style={{ color: `${rowColor}ee` }}>{fvFormatter(stock.fv20)}</td>
                                                    <td className="px-4 py-4 font-mono font-bold border-l border-white/5 text-[12px]" style={{ color: rowColor }}>{fvFormatter(stock.fv30)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="border-t border-white/20 bg-[#0f172a]/80">
                                        <tr>
                                            <td className="px-4 py-5 font-black uppercase tracking-widest text-cyan-400 text-[10px]">Tổng danh mục</td>
                                            <td className="px-4 py-5 font-mono text-emerald-400 font-bold border-l border-white/5 text-[11px]">
                                                {simulation.avgStockRate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%
                                            </td>
                                            <td className="px-4 py-5 font-mono text-white font-bold border-l border-white/5 text-[11px]">
                                                {formatCurrency(simulation.monthlyInvestment * (simulation.allocationData.find(a => a.key === 'stock')?.weight || 0))}
                                            </td>
                                            {(() => {
                                                let total10 = 0, total20 = 0, total30 = 0;
                                                simulation.stockDetails.forEach((s: any) => { total10 += s.fv10; total20 += s.fv20; total30 += s.fv30; });
                                            const fvFormatter = (v: number) => {
                                                    if (!v || v <= 0) return "---";
                                                    const formatOptions = { minimumFractionDigits: 0, maximumFractionDigits: 2 };
                                                    return v >= 1_000_000_000 ? `${(v/1_000_000_000).toLocaleString('vi-VN', formatOptions)} tỷ VNĐ` : `${(v/1_000_000).toLocaleString('vi-VN', formatOptions)} triệu VNĐ`;
                                                };
                                                return (
                                                    <>
                                                        <td className="px-4 py-5 font-mono text-cyan-400 font-bold border-l border-white/5 text-[11px]">{fvFormatter(total10)}</td>
                                                        <td className="px-4 py-5 font-mono text-amber-400 font-bold border-l border-white/5 text-[11px]">{fvFormatter(total20)}</td>
                                                        <td className="px-4 py-5 font-mono text-purple-400 font-black border-l border-white/5 text-[12px] scale-105 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">{fvFormatter(total30)}</td>
                                                    </>
                                                );
                                            })()}
                                        </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Section 3: Aggregate Growth */}
        <div className="space-y-6">
            <div className="glass-panel rounded-3xl overflow-hidden">
                 <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                        3. Tổng hợp đầu tư
                    </h2>
                </div>
                 {/* Line Chart */}
                 <div className="p-6">
                    <div className="mb-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-cyan-400" /> Biểu đồ tăng trưởng tài sản
                            </h3>
                            <div className="flex bg-slate-900/50 rounded-lg p-1 border border-white/5 shrink-0">
                                {[10, 20, 30].map(period => (
                                    <button
                                        key={period}
                                        onClick={() => setChartPeriod(period)}
                                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${chartPeriod === period ? 'bg-cyan-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {period} Năm
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-[12px] text-[#f5f7f9] font-mono ml-7 flex items-center overflow-x-auto custom-scrollbar pb-1">
                            <span className="shrink-0">Công thức:</span>
                            <span className="ml-2 flex items-center whitespace-nowrap">
                                FV = PV(1+r)<sup className="mx-0.5">n</sup> + 
                                <span className="inline-flex flex-col items-center justify-center px-1 align-middle mx-1">
                                    <span className="text-[8px] leading-none font-bold" style={{ color: '#f5f9f9' }}>n</span>
                                    <span className="text-lg leading-none font-serif">&sum;</span>
                                    <span className="text-[8px] leading-none font-bold" style={{ color: '#ffffff', height: '9px', paddingTop: '1px' }}>k=1</span>
                                </span>
                                [(Cash<sub className="bottom-0">k-1</sub> + Contribution<sub className="bottom-0">k</sub>)w](1+r)<sup className="mx-0.5">n-k</sup>
                            </span>
                        </p>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={simulation.timeline} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => v >= 1000000000 ? `${(v/1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ VNĐ` : `${(v/1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu VNĐ`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', padding: '12px' }}
                                    itemStyle={{ fontSize: '13px', padding: '4px 0' }}
                                    labelStyle={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                    formatter={(v: number) => formatCurrency(v)}
                                    itemSorter={(item: any) => {
                                        if (!item) return 99;
                                        const order = ['Tổng danh mục', 'Chứng khoán', 'Vàng', 'Tiền gửi tiết kiệm', 'USD', 'Tiền mặt'];
                                        const index = order.indexOf(item.name || item.dataKey);
                                        return index !== -1 ? index : 99;
                                    }}
                                />
                                <Legend 
                                    {...({
                                        payload: [
                                            { value: 'Tổng danh mục', type: 'circle', id: 'Tổng danh mục', color: '#06b6d4' },
                                            ...DEFAULT_ALLOCATION.map(a => ({ value: a.name, type: 'circle', id: a.name, color: a.color }))
                                        ]
                                    } as any)}
                                    verticalAlign="top" 
                                    wrapperStyle={{ fontSize: '11px', paddingBottom: '20px' }} 
                                    iconType="circle" 
                                    iconSize={6} 
                                />
                                <Line type="monotone" dataKey="Tổng danh mục" stroke="#06b6d4" strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 2 }} />
                                {DEFAULT_ALLOCATION.map((a, i) => (
                                    <Line key={i} type="monotone" dataKey={a.name} stroke={a.color} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: a.color, stroke: '#0f172a', strokeWidth: 2 }} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
            </div>
            
            {/* Grid for Forecast Table & News */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ width: '964px' }}>
                 <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden w-full" style={{ height: '414.333px', width: '654px' }}>
                    <table className="w-full text-left text-[12px] border-collapse">
                            <thead>
                                <tr className="text-slate-500 uppercase text-[9px] tracking-widest border-b border-white/5" style={{ height: '53px' }}>
                                    <th className="px-5 py-0 font-bold">Tài sản</th>
                                    <th className="px-5 py-0 font-bold">Lãi suất</th>
                                    <th className="px-5 py-0 font-bold">Tỷ trọng</th>
                                    <th className="px-5 py-0 font-bold">10 Năm</th>
                                    <th className="px-5 py-0 font-bold">20 Năm</th>
                                    <th className="px-5 py-0 font-bold">30 Năm</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {simulation.allocationData.map((a, i) => {
                                    const formatFV = (v: number) => {
                                        if (!v || v <= 0) return "---";
                                        const formatOptions = { minimumFractionDigits: 0, maximumFractionDigits: 2 };
                                        return v >= 1_000_000_000 ? `${(v / 1_000_000_000).toLocaleString('vi-VN', formatOptions)} tỷ VNĐ` : `${(v / 1_000_000).toLocaleString('vi-VN', formatOptions)} triệu VNĐ`;
                                    };
                                    return (
                                        <tr key={i} className="hover:bg-white/[0.01] group" style={{ height: '53px' }}>
                                            <td className="px-5 py-0">
                                                <div className="flex items-center gap-2.5 pl-1">
                                                    <div className="w-1.5 h-3.5 rounded-full" style={{ backgroundColor: a.color }} />
                                                    <span className="font-bold text-slate-200 tracking-tight text-[12px]">{a.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-0 text-white text-[11px] font-bold">{a.rate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%/năm</td>
                                            <td className="px-5 py-0 text-white text-[11px]">{(a.weight * 100).toFixed(0)}%</td>
                                            <td className="px-5 py-0 font-sans text-[12px] font-bold text-white group-hover:text-cyan-400 transition-colors" style={i === 1 ? { width: '105.5104px' } : {}}>{formatFV(a.fv10)}</td>
                                            <td className="px-5 py-0 font-sans text-[12px] font-bold text-white group-hover:text-emerald-400 transition-colors" style={i === 4 ? { width: '104.9479px' } : {}}>{formatFV(a.fv20)}</td>
                                            <td className="px-5 py-0 font-sans text-[12px] font-bold text-white group-hover:text-amber-400 transition-colors" style={i === 4 ? { width: '104.9375px' } : {}}>{formatFV(a.fv30)}</td>
                                        </tr>
                                    )
                                })}
                                <tr className="bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors group border-t border-white/10" style={{ height: '53px' }}>
                                    <td className="px-5 py-0">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-1.5 h-4 rounded-full bg-cyan-400" />
                                            <span className="font-black text-cyan-400 tracking-tight uppercase text-[12px]" style={{ width: '102.125px', fontSize: '12px' }}>Tổng danh mục</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-0 text-white font-bold text-[10px]"></td>
                                    <td className="px-5 py-0 text-white font-bold text-[11px]">{(simulation.allocationData.reduce((sum, item) => sum + item.weight, 0) * 100).toFixed(0)}%</td>
                                    {(() => {
                                        const formatFV = (v: number) => {
                                            if (!v || v <= 0) return "---";
                                            const formatOptions = { minimumFractionDigits: 0, maximumFractionDigits: 2 };
                                            return v >= 1_000_000_000 ? `${(v / 1_000_000_000).toLocaleString('vi-VN', formatOptions)} tỷ VNĐ` : `${(v / 1_000_000).toLocaleString('vi-VN', formatOptions)} triệu VNĐ`;
                                        };
                                        return (
                                            <>
                                                <td className="px-5 py-0 font-sans text-[12px] text-white font-bold">{formatFV(simulation.forecastResults[0].total)}</td>
                                                <td className="px-5 py-0 font-sans text-[12px] text-white font-bold">{formatFV(simulation.forecastResults[1].total)}</td>
                                                <td className="px-5 py-0 font-sans text-[12px] text-white font-bold">{formatFV(simulation.forecastResults[2].total)}</td>
                                            </>
                                        )
                                    })()}
                                </tr>
                            </tbody>
                            <tfoot className="bg-slate-900/80 border-t border-white/10 text-[11px] italic text-[#f6f180]">
                                <tr style={{ height: '53px' }}>
                                    <td colSpan={6} className="px-6 py-0 text-center">* Dự báo dựa trên lãi suất kỳ vọng cố định và tái đầu tư lợi nhuận.</td>
                                </tr>
                            </tfoot>
                        </table>
                </div>
                <div className="lg:col-span-1" style={{ height: '414.333px' }}>
                    <FinancialNewsWidget />
                </div>
            </div>
        </div>

        {/* Section 4: Visual Asset Growth Simulation (User Requested Image) */}
        <div className="glass-panel rounded-3xl overflow-hidden mt-8">
            <div className="p-8 bg-[#0a0f1e]">
                <h2 className="text-lg font-black text-white uppercase tracking-widest mb-8 border-l-4 border-indigo-500 pl-4">
                    MÔ PHỎNG TĂNG TRƯỞNG TÀI SẢN
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left: Controls & Metrics */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="flex bg-[#161b2e] rounded-xl p-1 border border-white/5 w-fit">
                            {[10, 20, 30].map(period => (
                                <button
                                    key={period}
                                    onClick={() => setChartPeriod(period)}
                                    className={`px-6 py-2 text-xs font-black uppercase rounded-lg transition-all ${chartPeriod === period ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {period} NĂM
                                </button>
                            ))}
                        </div>

        <div className="space-y-6">
                            {(() => {
                                const years = chartPeriod;
                                const snap = simulation.forecastResults.find(f => f.years === years);
                                const totalVested = snap?.total !== undefined ? simulation.timeline.find(t => t.yearNum === years)?.vested || 0 : 0;
                                const portfolioValue = snap?.total || 0;
                                
                                const netProfit = portfolioValue - totalVested;
                                const roi = totalVested > 0 ? (netProfit / totalVested) * 100 : 0;

                                return (
                                    <>
                                        <div className="flex items-center justify-between text-[11px] py-2 border-b border-white/5">
                                            <span className="text-slate-500 font-bold uppercase tracking-widest">Tổng vốn đầu tư</span>
                                            <span className="text-white font-black">{formatCurrency(totalVested)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] py-2 border-b border-white/5">
                                            <span className="text-slate-500 font-bold uppercase tracking-widest">Giá trị sau {years} năm</span>
                                            <span className="text-white font-black">{formatCurrency(portfolioValue)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] py-2 border-b border-white/5">
                                            <span className="text-slate-500 font-bold uppercase tracking-widest"> Lợi nhuận ròng</span>
                                            <span className="text-emerald-400 font-black">{formatCurrency(netProfit)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] py-2">
                                            <span className="text-slate-500 font-bold uppercase tracking-widest">ROI</span>
                                            <span className="text-purple-400 font-black text-sm">{roi.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Right: Chart Area */}
                    <div className="lg:col-span-8 h-[400px] relative">
                         <div className="absolute top-0 right-0 flex items-center gap-6 z-10 text-[10px] font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-1 bg-blue-500 rounded-full" />
                                <span className="text-slate-300">Tổng vốn đã đầu tư</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-1 bg-purple-500 rounded-full" />
                                <span className="text-slate-300">Giá trị danh mục</span>
                            </div>
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                                data={simulation.timeline}
                                margin={{ top: 40, right: 10, left: 10, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis 
                                    dataKey="year" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    tickFormatter={(v) => v >= 1000000000 ? `${(v/1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}B` : `${(v/1000000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}M`}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}
                                    labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}
                                    itemStyle={{ padding: '2px 0' }}
                                    formatter={(v: number) => Math.round(v).toLocaleString() + ' đ'}
                                />
                                <Line 
                                    type="monotone" 
                                    name="Tổng vốn đã đầu tư"
                                    dataKey="vested" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3} 
                                    dot={{ r: 4, fill: '#3b82f6' }} 
                                    activeDot={{ r: 6 }} 
                                />
                                <Line 
                                    type="monotone" 
                                    name="Giá trị danh mục"
                                    dataKey="value" 
                                    stroke="#a855f7" 
                                    strokeWidth={4} 
                                    dot={{ r: 5, fill: '#a855f7' }} 
                                    activeDot={{ r: 8 }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="mt-12 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <Info className="w-5 h-5 text-indigo-400" />
                    </div>
                    <p className="text-xs text-slate-400">
                        {(() => {
                           const currentFV = simulation.forecastResults.find(f => f.years === chartPeriod)?.total || 0;
                           const currentVested = totalBalance + (simulation.monthlyInvestment * 12 * chartPeriod);
                           const currentCAGR = currentVested > 0 ? (Math.pow(currentFV / currentVested, 1 / chartPeriod) - 1) * 100 : 0;
                           return (
                             <>
                               Kết quả mô phỏng dựa trên đóng góp hàng tháng <span className="text-indigo-400 font-bold">{formatCurrency(simulation.monthlyInvestment)}</span> đều đặn trong {chartPeriod} năm.
                             </>
                           );
                        })()}
                    </p>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-900/50 border border-white/5 rounded-2xl text-[10px] italic text-[#f1ed8e]">
            <Info className="w-4 h-4 shrink-0 text-[#f1ed8e]/80" />
            Lưu ý: Mô phỏng dựa trên công thức toán học và lãi suất bạn cài đặt. Hiệu quả đầu tư thực tế phụ thuộc vào biến động thị trường và không được bảo đảm. Các hệ số tăng trưởng mang tính chất tham khảo cho kế hoạch dài hạn.
        </div>
      </div>
    </div>
  );
}

