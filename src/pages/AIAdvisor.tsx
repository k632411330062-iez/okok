import { Header } from "../components/Header";
import { useFilteredData, formatCurrency } from "../hooks/useMetrics";
import { Bot, Send, Sparkles, Target, Wallet, TrendingUp, Landmark, ShieldCheck, MessageSquare, Activity, Cpu, AlertCircle, BookOpen, Lightbulb, BarChart3 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import { cn } from "../lib/utils";

interface Message {
  role: 'user' | 'model';
  text: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'model',
    text: "Xin chào 👋\nTôi là trợ lý tài chính AI đồng hành cùng bạn trong việc quản lý dòng tiền, theo dõi chi tiêu và xây dựng kế hoạch tài chính cá nhân thông minh hơn.\n\nTôi có thể giúp bạn phân tích thu nhập, kiểm soát ngân sách, theo dõi mức tiết kiệm, đánh giá tình hình tài chính\nHãy bắt đầu bằng một câu hỏi nhé 🚀"
  }
];

export default function AIAdvisor() {
  const location = useLocation();
  const { totalIncome, totalExpense } = useFilteredData();
  const netCashFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;

  const formatSnapshotValue = (val: number, isCurrency: boolean = true) => {
    if (!isCurrency) return `${val.toFixed(1)}%`;
    const inMillions = Math.abs(val) / 1_000_000;
    const sign = val >= 0 ? '+' : '-';
    return `${sign}${inMillions.toFixed(1)} tr`;
  };

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup: Abort any pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort("unmount");
      }
    };
  }, []);

  useEffect(() => {
    if (location.state?.initialQuestion) {
      handleSend(location.state.initialQuestion);
      // Clear state to prevent re-triggering on refresh if possible
      window.history.replaceState({}, document.title);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const suggestedQuestions = [
    "Tôi nên phân bổ ngân sách như thế nào với mức thu nhập hiện tại?",
    "Làm thế nào để tăng tỷ lệ tiết kiệm của tôi?",
    "Tôi có nên đầu tư vào cổ phiếu hay gửi tiết kiệm ngân hàng?",
    "Tôi có thể nghỉ hưu sớm không? Cần tích lũy bao nhiêu?"
  ];

  const featureCards = [
    { title: "Lập ngân sách cá nhân", desc: "Cách phân bổ thu nhập theo quy tắc 50/30/20", icon: Wallet, color: "text-emerald-400" },
    { title: "Đầu tư cổ phiếu VN", desc: "Chiến lược DCA vào thị trường chứng khoán Việt Nam", icon: TrendingUp, color: "text-blue-400" },
    { title: "Mục tiêu tài chính", desc: "Thiết lập và đạt các mục tiêu tài chính dài hạn", icon: Target, color: "text-cyan-400" },
    { title: "Quỹ khẩn cấp", desc: "Xây dựng quỹ dự phòng khẩn cấp", icon: ShieldCheck, color: "text-amber-400" },
    { title: "Lãi suất & Vay nợ", desc: "Hiểu về lãi suất và quản lý vay nợ thông minh", icon: Landmark, color: "text-indigo-400" },
    { title: "Kiến thức tài chính", desc: "Các khái niệm tài chính cơ bản cần biết", icon: BookOpen, color: "text-teal-400" },
  ];

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    
    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("new_request");
    }

    const userMessage: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const timeoutId = setTimeout(() => controller.abort("timeout"), 120000); // 120s timeout

    const fetchWithRetry = async (retries = 2): Promise<any> => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messages || [],
            text: text,
            financialSummary: {
              income: totalIncome,
              expense: totalExpense,
              cashFlow: netCashFlow,
              savingsRate: savingsRate.toFixed(1)
            }
          }),
          signal: controller.signal
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Chat Debug] HTTP Error ${response.status}:`, errorText.substring(0, 200));
          
          if (errorText.includes("<!doctype html>") || errorText.includes("<title>Starting Server</title>")) {
            throw new Error("Máy chủ đang khởi động lại để cập nhật cấu hình. Vui lòng đợi trong giây lát (khoảng 10-20 giây) và thử lại.");
          }
          
          if (response.status === 503) {
            throw new Error("Hệ thống AI hiện đang quá tải. Tôi đã thử kết nối lại nhiều lần nhưng không thành công. Hãy thử lại sau ít phút.");
          }

          throw new Error(`Lỗi kết nối (${response.status}). Hãy thử tải lại trang.`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const bodyText = await response.text();
          console.error("[Chat Debug] Non-JSON response received:", bodyText.substring(0, 100));
          
          if (bodyText.includes("<!doctype html>") || bodyText.includes("<title>Starting Server</title>")) {
            throw new Error("Máy chủ đang khởi động. Vui lòng chờ 10 giây rồi gửi lại tin nhắn.");
          }
          
          throw new Error("Phản hồi từ máy chủ không hợp lệ. Hãy thử tải lại trang hoặc kiểm tra kết nối mạng.");
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data;
      } catch (e: any) {
        // Only retry if it's a network error or 503, NOT if it was aborted
        if (retries > 0 && e.name !== 'AbortError' && !controller.signal.aborted) {
          console.warn(`Retrying... (${retries} left)`);
          await new Promise(r => setTimeout(r, 1000));
          return fetchWithRetry(retries - 1);
        }
        throw e;
      }
    };

    try {
      const data = await fetchWithRetry();
      setMessages(prev => [...prev, { role: 'model', text: data?.text || "Tôi đã nhận được yêu cầu của bạn nhưng hiện tại chưa thể phản hồi cụ thể. Hãy thử lại một câu hỏi khác nhé." }]);
    } catch (e: any) {
      // Don't show error if it was a manual abort (new request or unmount)
      if (e.name === 'AbortError' && (controller.signal.reason === 'new_request' || controller.signal.reason === 'unmount')) {
        return;
      }

      console.error("Chat error:", e);
      let errorMsg = "Xin lỗi, tôi đang gặp chút khó khăn khi kết nối. Hãy đảm bảo bạn đã cấu hình GEMINI_API_KEY.";
      if (e.name === 'AbortError' || e.message?.includes('aborted')) {
        errorMsg = "Yêu cầu mất quá nhiều thời gian để xử lý (hết thời gian chờ). Vui lòng thử lại với câu hỏi ngắn gọn hơn.";
      } else if (e.message?.includes('503') || e.message?.includes('quá tải')) {
        errorMsg = "Hệ thống AI hiện đang quá tải do nhu cầu cao (503). Vui lòng thử lại sau vài phút.";
      }
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: errorMsg + " (Sử dụng trí tuệ dự phòng: Đừng quên đặt mục tiêu tài chính rõ ràng và kiểm soát chi tiêu không thiết yếu để tối ưu hóa dòng tiền của bạn!)" 
      }]);
    } finally {
      clearTimeout(timeoutId);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] space-y-4">
      <Header 
        title="Cố vấn AI" 
        subtitle="Phân tích tài chính dựa trên dữ liệu hiện tại của bạn."
        icon={<Sparkles className="h-6 w-6" />}
      />

      <div className="flex flex-col lg:flex-row gap-4 pb-4">
        {/* Chat Box - 70% */}
        <div className="flex-[7_7_0%] flex flex-col h-[680px] glass-panel rounded-2xl overflow-hidden shadow-2xl relative">
          {/* Subtle Glow Effect */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01] backdrop-blur-xl relative z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-400"><MessageSquare size={18}/></div>
              <div>
                <h2 className="font-bold text-sm text-white leading-none">Cố vấn tài chính AI</h2>
                <span className="text-[9px] text-emerald-400 opacity-80 flex items-center gap-1 mt-0.5"><Activity size={10}/> Trực tuyến</span>
              </div>
            </div>
            <button 
              onClick={() => setMessages(INITIAL_MESSAGES)}
              className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ShieldCheck size={12}/> Xóa nội dung
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 custom-scrollbar scroll-smooth">
            {(messages || []).map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "")}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5", m.role === 'user' ? "bg-purple-900" : "bg-sky-900")}>
                  {m.role === 'user' ? <Activity size={16} className="text-white" /> : <Bot size={16} className="text-sky-300" />}
                </div>
                <div className={cn("p-4 rounded-2xl text-sm leading-relaxed max-w-[90%] relative transition-all duration-300", 
                  m.role === 'user' 
                    ? "bg-indigo-600/70 text-white rounded-tr-none shadow-[0_4px_15px_rgba(79,70,229,0.2)] border border-indigo-400/20" 
                    : "bg-white/[0.02] backdrop-blur-xl text-slate-300 border border-white/10 rounded-tl-none shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
                )}>
                  {m.role === 'model' && (
                    <div className="absolute -left-1.5 top-0 w-3 h-3 bg-white/[0.02] border-l border-t border-white/10 transform rotate-[-45deg] origin-top-right"></div>
                  )}
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                  {m.role === 'model' && <div className="text-[9px] font-mono text-white/40 mt-2 text-right uppercase tracking-[0.2em] font-light">Received • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                </div>
              </div>
            ))}
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pt-6 relative z-10 mt-auto">
              {featureCards.map((c, i) => (
                <button key={i} onClick={() => handleSend(c.title)} className="p-3 bg-white/[0.01] hover:bg-white/[0.05] backdrop-blur-xl border border-white/5 hover:border-white/20 rounded-xl text-left flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group">
                  <div className={cn("p-2 rounded-lg bg-white/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300", c.color)}>
                    <c.icon size={18} />
                  </div>
                  <div className="font-bold text-slate-300 text-[10px] group-hover:text-white transition-colors text-center uppercase tracking-wider">{c.title}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-white/5 bg-transparent shrink-0">
            <div className="flex bg-slate-950/20 border border-white/10 rounded-xl px-4 py-3 items-center gap-2 backdrop-blur-xl">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="flex-1 bg-transparent text-sm focus:outline-none" placeholder="Nhập câu hỏi tài chính của bạn..." />
              <div className="text-[10px] text-slate-600 mr-2">{input.length}/1000</div>
              <button disabled={isLoading || !input.trim()} onClick={() => handleSend()} className="p-2 bg-indigo-600 rounded-lg disabled:opacity-50"><Send size={16} /></button>
            </div>
          </div>
        </div>

        {/* Snapshot + Topics - 30% */}
        <div className="flex-[3_3_0%] flex flex-col gap-4 min-h-0 pb-6 px-1 lg:max-w-[320px]">
          {/* Tình hình tài chính */}
          <div className="glass-panel rounded-3xl p-4 relative overflow-hidden bg-[#0d1425] border border-white/[0.05] shadow-2xl">
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                <BarChart3 className="text-indigo-400" size={18} />
              </div>
              <h2 className="font-bold text-white text-base tracking-tight">Tình hình tài chính</h2>
            </div>
            
            <div className="space-y-0 relative z-10">
              {[
                { label: "Thu nhập", value: formatSnapshotValue(totalIncome), color: "text-[#10b981]" },
                { label: "Chi tiêu", value: formatSnapshotValue(-totalExpense), color: "text-[#f43f5e]" },
                { label: "Dòng tiền ròng", value: formatSnapshotValue(netCashFlow), color: "text-[#0ea5e9]" },
                { label: "Tỷ lệ tiết kiệm", value: formatSnapshotValue(savingsRate, false), color: "text-[#10b981]" }
              ].map((item, idx) => (
                <div key={idx} className={cn(
                  "flex justify-between items-center py-2.5",
                  idx !== 3 && "border-b border-white/[0.05]"
                )}>
                  <span className="text-slate-500 text-xs font-medium">{item.label}</span>
                  <span className={cn("font-bold text-sm tracking-tight", item.color)}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Câu hỏi gợi ý */}
          <div className="glass-panel rounded-3xl p-4 bg-[#0d1425] border border-white/[0.05] shadow-2xl flex-1 flex flex-col min-h-0 overflow-hidden">
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-3 shrink-0">
              <Lightbulb size={18} className="text-amber-400 fill-amber-400/20" />
              Câu hỏi gợi ý
            </h3>
            <div className="flex-1 space-y-2 pr-1 overflow-y-auto custom-scrollbar scroll-smooth">
              {suggestedQuestions.map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSend(q)}
                  className="w-full p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/20 rounded-2xl text-[12px] leading-relaxed text-slate-400 hover:text-white text-left transition-all active:scale-[0.98] group"
                >
                  <p className="line-clamp-3 group-hover:translate-x-1 transition-transform">{q}</p>
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-[10px] text-slate-500 flex gap-2 p-3 glass-panel rounded-xl border-dashed mt-2 bg-white/[0.01]">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
              <AlertCircle size={16} className="text-amber-500" />
            </div>
            <p className="leading-tight opacity-70">Câu trả lời chỉ mang tính tham khảo, không phải tư vấn tài chính hoặc pháp lý chuyên nghiệp.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

