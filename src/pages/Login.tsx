import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, ArrowRight, Chrome } from "lucide-react";
import React, { useState } from "react";
import { useFinanceStore } from "../store/useFinanceStore";
import { loginWithGoogle } from "../lib/firebase";

export default function Login() {
  const navigate = useNavigate();
  const setAppMode = useFinanceStore(state => state.setAppMode);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setErrorMsg("");
    try {
      await loginWithGoogle();
      navigate("/app");
    } catch (error: any) {
      if (error?.code !== 'auth/cancelled-popup-request' && error?.code !== 'auth/popup-closed-by-user') {
        console.error("Login Error:", error);
        if (error?.code === 'auth/unauthorized-domain') {
          setErrorMsg("Domain này chưa được cấp phép. Vui lòng thêm domain vào Authorized Domains trong Firebase Console.");
        } else {
          setErrorMsg("Đăng nhập thất bại. Hoặc bạn đã đóng popup. Vui lòng thử lại.");
        }
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoMode = () => {
    setAppMode('demo');
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="finvest-grad-login" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path d="M12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22Z" fill="url(#finvest-grad-login)" />
              <path d="M19.5 8.5C19.5 6.567 17.933 5 16 5C17.933 5 19.5 3.433 19.5 1.5C19.5 3.433 21.067 5 23 5C21.067 5 19.5 6.567 19.5 8.5Z" fill="#06b6d4" />
              <path d="M4.5 22.5C4.5 20.567 2.933 19 1 19C2.933 19 4.5 17.433 4.5 15.5C4.5 17.433 6.067 19 8 19C6.067 19 4.5 20.567 4.5 22.5Z" fill="#a855f7" />
            </svg>
            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#a855f7] via-[#3b82f6] to-[#06b6d4] tracking-tight">
              FinVest
            </span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-3">Chào mừng trở lại</h2>
          <p className="text-slate-400">Chọn phương thức để bắt đầu hành trình tài chính của bạn</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 shadow-2xl space-y-4">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl text-center">
              {errorMsg}
            </div>
          )}
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className={`w-full bg-white text-slate-950 hover:bg-slate-100 rounded-2xl py-4 font-bold transition-all flex items-center justify-center gap-3 group ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <div className="bg-slate-100 p-1 rounded-lg group-hover:bg-white transition-colors">
              <Chrome className={`h-5 w-5 ${isLoggingIn ? 'animate-pulse' : ''}`} />
            </div>
            {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
          </button>
          
          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-white/5 flex-1" />
            <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">Hoặc trải nghiệm</span>
            <div className="h-px bg-white/5 flex-1" />
          </div>

          <button 
            onClick={handleDemoMode}
            className="w-full bg-slate-800/50 hover:bg-slate-800 text-white border border-white/5 rounded-2xl py-4 font-bold transition-all flex items-center justify-center gap-2"
          >
            Dùng thử Demo
            <ArrowRight className="h-4 w-4 text-slate-500" />
          </button>

          <p className="text-center text-slate-500 text-sm pt-4">
            Bằng cách tiếp tục, bạn đồng ý với Điều khoản và Chính sách bảo mật của FinVest.
          </p>
        </div>
      </div>
    </div>
  );
}
