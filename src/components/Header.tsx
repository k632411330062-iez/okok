import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useFinanceStore } from "../store/useFinanceStore";
import { format, addMonths, subMonths } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "../lib/utils";

interface HeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  hideFilter?: boolean;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, icon, hideFilter = false, children }: HeaderProps) {
  const { selectedPeriod, selectedDate, startDate, endDate, setPeriod, setDate, setCustomRange, resetCustomRange } = useFinanceStore();
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
    if (selectedPeriod === 'custom') return;
    setDate(subMonths(selectedDate, selectedPeriod === 'year' ? 12 : selectedPeriod === 'quarter' ? 3 : 1));
  };
  
  const handleNext = () => {
    if (selectedPeriod === 'custom') return;
    setDate(addMonths(selectedDate, selectedPeriod === 'year' ? 12 : selectedPeriod === 'quarter' ? 3 : 1));
  };

  let dateLabel = "";
  if (selectedPeriod === "month") {
    dateLabel = `Tháng ${format(selectedDate, "M/yyyy")}`;
  } else if (selectedPeriod === "year") {
    dateLabel = `Năm ${format(selectedDate, "yyyy")}`;
  } else if (selectedPeriod === "quarter") {
    const quarter = Math.floor(selectedDate.getMonth() / 3) + 1;
    dateLabel = `Quý ${quarter}/${format(selectedDate, "yyyy")}`;
  } else if (selectedPeriod === "custom") {
    if (startDate && endDate) {
      dateLabel = `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;
    } else {
      dateLabel = format(selectedDate, "dd/MM/yyyy");
    }
  }

  return (
    <div className="sticky top-0 z-40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 -mx-4 md:-mx-8 px-4 md:px-8 py-3 md:py-4 bg-[#020410]/95 backdrop-blur-xl border-b border-white/[0.05]">
      <div className="flex-shrink-0">
        <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-2">
          {icon && <span className="text-indigo-400">{icon}</span>}
          {title}
          {title === 'Thu nhập' && <span className="text-white/30 text-[8px] self-start mt-1 md:mt-1.2">✦</span>}
        </h1>
        {subtitle && <p className="text-slate-500 text-[8px] md:text-[9px] mt-0.5 font-medium leading-none uppercase tracking-wider">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 md:gap-2.5 lg:gap-3 flex-nowrap">
        {!hideFilter && (
          <>
            <div className="flex items-center bg-slate-900/40 p-1 rounded-xl border border-white/5 backdrop-blur-md">
              <div className="flex items-center">
                {(["month", "quarter", "year", "custom"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold transition-all duration-200 whitespace-nowrap",
                      selectedPeriod === p
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {p === "month"
                      ? "Tháng"
                      : p === "quarter"
                      ? "Quý"
                      : p === "year"
                      ? "Năm"
                      : "Tùy chỉnh"}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative group">
              <div className="flex items-center bg-slate-900/40 p-1 rounded-xl border border-white/5 backdrop-blur-md h-[36px] md:h-9">
                <div className="flex items-center gap-1">
                  {selectedPeriod !== 'custom' ? (
                    <>
                      <button 
                        onClick={handlePrev} 
                        className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <div className="flex items-center gap-2 px-2 text-[10px] md:text-[11px] font-bold text-white min-w-[90px] md:min-w-[100px] justify-center">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        {dateLabel}
                      </div>
                      <button 
                        onClick={handleNext} 
                        className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </>
                  ) : (
                    <div 
                      onClick={handleShowPicker}
                      className="flex items-center gap-3 px-3 h-full cursor-pointer hover:bg-white/5 rounded-lg transition-all"
                    >
                      <div className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold text-white transition-all">
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="tabular-nums">{startDate ? format(startDate, 'dd/MM/yyyy') : '--/--/----'}</span>
                      </div>
                      <div className="text-slate-600 px-0.5 select-none">-</div>
                      <div className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold text-white transition-all">
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="tabular-nums">{endDate ? format(endDate, 'dd/MM/yyyy') : '--/--/----'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Range Picker Overlay */}
              {selectedPeriod === 'custom' && showDatePicker && (
                <div className="absolute top-full mt-2 right-0 bg-slate-950 border border-white/10 rounded-2xl p-4 shadow-2xl z-[100] min-w-[280px] backdrop-blur-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest px-2">Tìm kiếm theo ngày</span>
                    <button onClick={() => setShowDatePicker(false)} className="text-slate-500 hover:text-white p-1">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-bold ml-1">Bắt đầu</label>
                      <input 
                        type="date" 
                        value={tempStart}
                        onChange={(e) => setTempStart(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-2 text-[11px] text-white focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-bold ml-1">Kết thúc</label>
                      <input 
                        type="date" 
                        value={tempEnd}
                        onChange={(e) => setTempEnd(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-2 text-[11px] text-white focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button onClick={handleReset} className="bg-white/5 hover:bg-white/10 text-slate-400 font-bold py-2 rounded-xl text-[10px] transition-all">Đặt lại</button>
                    <button onClick={handleApply} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-[10px] transition-all shadow-lg shadow-indigo-600/20">Áp dụng</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {children}
      </div>
    </div>
  );
}
