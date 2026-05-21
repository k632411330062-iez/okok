import { ReactNode, useMemo, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Bot,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "./FirebaseProvider";
import { logout } from "../lib/firebase";
import { useFinanceStore } from "../store/useFinanceStore";

interface SidebarProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const appMode = useFinanceStore(state => state.appMode);
  const setAppMode = useFinanceStore(state => state.setAppMode);

  const handleLogout = async () => {
    if (appMode === 'real') {
       await logout();
    }
    setAppMode('landing');
    navigate('/');
  };

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const stars = useMemo(() => {
    return [...Array(50)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      bottom: `-${Math.random() * 20}px`,
      width: `${2 + Math.random() * 6}px`, // Larger stars
      duration: `${10 + Math.random() * 25}s`, // Slightly faster for more movement
      delay: `${Math.random() * 20}s`,
      isLegacy: i < 15, // More bright stars
    }));
  }, []);

  const binaryBits = useMemo(() => {
    return [...Array(12)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${25 + Math.random() * 35}s`,
      delay: `${Math.random() * 15}s`,
      content: Math.random() > 0.5 ? '1' : '0',
    }));
  }, []);

  const mainNav = [
    { name: "Tổng quan", path: "/app", icon: LayoutDashboard },
    { name: "Thu nhập", path: "/app/income", icon: ArrowUpRight },
    { name: "Chi phí", path: "/app/expense", icon: ArrowDownLeft },
    { name: "Dòng tiền", path: "/app/cashflow", icon: Wallet },
  ];

  const toolsNav = [
    { name: "Mô phỏng đầu tư", path: "/app/investment", icon: TrendingUp },
    { name: "Phân tích tài chính", path: "/app/analysis", icon: BarChart3 },
    { name: "Cố vấn AI", path: "/app/ai-advisor", icon: Bot },
  ];

  return (
    <div className="flex h-screen bg-[#020410] text-white overflow-hidden font-sans relative">
      {/* Universal Cosmic Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* User Provided Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen" 
          style={{ backgroundImage: `url('/input_file_0.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020410]/40 via-transparent to-[#020410]/60" />
        
        {/* Star Field & Digital Layer */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.1] scale-150 rotate-12" />
          
          {binaryBits.map((bit) => (
            <div 
              key={bit.id}
              className="absolute animate-float-binary text-[10px] font-mono text-cyan-400/20 select-none"
              style={{
                left: bit.left,
                animationDuration: bit.duration,
                animationDelay: bit.delay,
              }}
            >
              {bit.content}
            </div>
          ))}

          {stars.map((star) => (
            <div 
              key={star.id}
              className="absolute animate-flying-stars bg-white rounded-full"
              style={{
                left: star.left,
                bottom: star.bottom,
                width: star.width,
                height: star.width,
                animationDuration: star.duration,
                animationDelay: star.delay,
                boxShadow: star.isLegacy ? '0 0-10px #fff, 0 0 20px #60a5fa' : '0 0 5px #fff',
                opacity: star.isLegacy ? 0.8 : 0.4,
              }}
            />
          ))}
        </div>

        {/* Digital Grid & HUD */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_40%,#000_60%,transparent_100%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-[900px] h-[900px] border border-cyan-500/5 rounded-full animate-pulse-soft" />
          <div className="absolute w-[600px] h-[600px] border border-blue-500/5 rounded-full animate-pulse-soft" style={{ animationDelay: '1s' }} />
          <div className="absolute w-[1200px] h-[1200px] border border-indigo-500/5 rounded-full animate-pulse-soft" style={{ animationDelay: '2s' }} />
        </div>

        {/* Nebulae */}
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/40 backdrop-blur-2xl border-r border-white/5 flex flex-col justify-between hidden md:flex h-full relative z-20">
        <div>
          <div className="p-6">
            <Link to="/app" className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="finvest-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <path d="M12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22Z" fill="url(#finvest-grad)" />
                <path d="M19.5 8.5C19.5 6.567 17.933 5 16 5C17.933 5 19.5 3.433 19.5 1.5C19.5 3.433 21.067 5 23 5C21.067 5 19.5 6.567 19.5 8.5Z" fill="#06b6d4" />
                <path d="M4.5 22.5C4.5 20.567 2.933 19 1 19C2.933 19 4.5 17.433 4.5 15.5C4.5 17.433 6.067 19 8 19C6.067 19 4.5 20.567 4.5 22.5Z" fill="#a855f7" />
              </svg>
              <span className="text-[22px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#a855f7] via-[#3b82f6] to-[#06b6d4] tracking-tight">
                FinVest
              </span>
            </Link>

            {/* Mode indicators as shown in the mockup image */}
            <div className="mt-3.5 flex">
              {appMode === 'real' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold tracking-wider uppercase select-none">
                  <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  REAL MODE
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-bold tracking-wider uppercase select-none">
                  <svg className="h-3.5 w-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  DEMO MODE
                </div>
              )}
            </div>
          </div>

          <nav className="px-4 space-y-1">
            
            {mainNav.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                    active
                      ? "bg-white/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.05)] backdrop-blur-sm"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      active ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-400",
                      active && "scale-110"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}

            
            {toolsNav.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                    active
                      ? "bg-white/10 text-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.05)] backdrop-blur-sm"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      active ? "text-purple-400" : "text-slate-500 group-hover:text-purple-400",
                      active && "scale-110"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="space-y-2">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white w-full rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <LogOut className="h-5 w-5 text-slate-500" />
              {appMode === 'demo' ? 'Thoát khỏi demo' : 'Đăng xuất'}
            </button>
          </div>
          
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-10 w-10 rounded-full bg-slate-800/40 border border-white/10 flex items-center justify-center backdrop-blur-sm overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
              ) : (
                <span className="font-semibold text-sm">
                  {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : (appMode === 'demo' ? 'DM' : 'G')}
                </span>
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-slate-200 truncate">{user?.displayName || (appMode === 'demo' ? 'Demo User' : 'Guest')}</span>
              <span className="text-xs text-slate-500 truncate">{user?.email || (appMode === 'demo' ? 'demo@finvest.vn' : '')}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden z-10">
        


        
        <div ref={mainRef} className="flex-1 overflow-y-auto no-scrollbar relative z-10 pt-0 px-4 md:px-8 pb-4 md:pb-8">
            {children}
        </div>
      </main>
    </div>
  );
}
