import { useState } from "react";
import { useFinanceStore } from "../store/useFinanceStore";
import { addMonths, subMonths, addQuarters, subQuarters, addYears, subYears, format } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "../lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  showFilter?: boolean;
}

export function PageHeader({ title, subtitle, showFilter = true }: PageHeaderProps) {
  const { selectedPeriod: period, selectedDate: date, startDate, endDate, setPeriod, setDate, setCustomRange, resetCustomRange } = useFinanceStore();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStart, setTempStart] = useState<string>(startDate ? format(startDate, 'yyyy-MM-dd') : '');
  const [tempEnd, setTempEnd] = useState<string>(endDate ? format(endDate, 'yyyy-MM-dd') : '');
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    if (!tempStart || !tempEnd) {
      setError("Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.");
      return;
    }
    const start = new Date(tempStart);
    const end = new Date(tempEnd);
    if (start > end) {
      setError("Ngày bắt đầu không thể lớn hơn ngày kết thúc.");
      return;
    }
    setError(null);
    setCustomRange(start, end);
    setShowDatePicker(false);
  };

  const handleReset = () => {
    resetCustomRange();
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 1);
    setTempStart(format(start, 'yyyy-MM-dd'));
    setTempEnd(format(today, 'yyyy-MM-dd'));
    setError(null);
  };

  const handleShowPicker = () => {
    setTempStart(startDate ? format(startDate, 'yyyy-MM-dd') : '');
    setTempEnd(endDate ? format(endDate, 'yyyy-MM-dd') : '');
    setError(null);
    setShowDatePicker(!showDatePicker);
  };

  const handlePrev = () => {
    switch (period) {
      case 'month': setDate(subMonths(date, 1)); break;
      case 'quarter': setDate(subQuarters(date, 1)); break;
      case 'year': setDate(subYears(date, 1)); break;
    }
  };

  const handleNext = () => {
    switch (period) {
      case 'month': setDate(addMonths(date, 1)); break;
      case 'quarter': setDate(addQuarters(date, 1)); break;
      case 'year': setDate(addYears(date, 1)); break;
    }
  };

  const getFormatDate = () => {
    switch (period) {
      case 'month': return `Tháng ${format(date, 'M/yyyy')}`;
      case 'quarter': return `Quý ${Math.floor(date.getMonth() / 3) + 1}/${format(date, 'yyyy')}`;
      case 'year': return `Năm ${format(date, 'yyyy')}`;
      case 'custom': 
        if (startDate && endDate) {
          return `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`;
        }
        return format(date, 'dd/MM/yyyy');
    }
  };

  return (
    <div className="sticky top-0 z-40 flex flex-col xl:flex-row xl:items-start justify-between gap-4 mb-6 -mx-4 md:-mx-8 px-4 md:px-8 py-3 md:py-4 bg-[#020410]/95 backdrop-blur-xl border-b border-white/[0.05]">
      <div>
        <h1 className="text-[28px] font-bold font-sans text-white mb-0.5 tracking-tight">{title}</h1>
        <p className="text-[10px] md:text-[12px] text-slate-500 font-sans font-medium">{subtitle}</p>
      </div>

      {showFilter && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-slate-900/80 border border-white/5 rounded-xl p-1 backdrop-blur-md">
            {(['month', 'quarter', 'year', 'custom'] as const).map((p) => {
              const labels: Record<string, string> = { month: 'Tháng', quarter: 'Quý', year: 'Năm', custom: 'Tùy chỉnh' };
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                    period === p
                      ? p === 'custom'
                        ? "bg-gradient-to-r from-cyan-400 to-purple-400 text-slate-900 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                        : "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  )}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          {/* Date Selector */}
          <div className="relative">
            <div className="flex items-center gap-1 bg-slate-900/80 border border-white/5 rounded-xl backdrop-blur-md p-1 h-10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              {period !== 'custom' ? (
                <>
                  <button 
                    onClick={handlePrev} 
                    className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2 px-3 text-sm font-medium text-white min-w-[120px] justify-center">
                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                    <span>{getFormatDate()}</span>
                  </div>
                  <button 
                    onClick={handleNext} 
                    className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div 
                  onClick={handleShowPicker}
                  className="flex items-center gap-4 px-4 h-full cursor-pointer hover:bg-white/5 rounded-lg transition-all"
                >
                  <div className="flex items-center gap-3 text-sm font-medium text-white transition-all hover:scale-105 active:scale-95">
                    <CalendarIcon className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    <span className="tabular-nums">{startDate ? format(startDate, 'MM/dd/yyyy') : '--/--/----'}</span>
                  </div>
                  <div className="text-slate-600 px-1 select-none">-</div>
                  <div className="flex items-center gap-3 text-sm font-medium text-white transition-all hover:scale-105 active:scale-95">
                    <CalendarIcon className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    <span className="tabular-nums">{endDate ? format(endDate, 'MM/dd/yyyy') : '--/--/----'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Range Picker Overlay */}
            {period === 'custom' && showDatePicker && (
              <div className="absolute top-full mt-2 right-0 bg-slate-900 border border-white/10 rounded-xl p-4 shadow-2xl z-[100] min-w-[300px] backdrop-blur-xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Chọn khoảng thời gian</span>
                  <button onClick={() => setShowDatePicker(false)} className="text-slate-500 hover:text-white p-1">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Từ ngày</label>
                    <input 
                      type="date" 
                      value={tempStart}
                      onChange={(e) => setTempStart(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Đến ngày</label>
                    <input 
                      type="date" 
                      value={tempEnd}
                      onChange={(e) => setTempEnd(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-3 text-[10px] text-rose-400 bg-rose-400/10 px-2 py-1.5 rounded-lg border border-rose-400/20 italic">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button 
                    onClick={handleReset}
                    className="bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-2 rounded-lg text-xs transition-all"
                  >
                    Đặt lại
                  </button>
                  <button 
                    onClick={handleApply}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition-all shadow-[0_4px_10px_rgba(37,99,235,0.3)]"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
