import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, Wallet, PieChart, Bot, BarChart3, ArrowRight, Sparkles, LineChart, Target, Mail, Phone, MapPin, Github, Facebook, Linkedin } from "lucide-react";
import dashboardPreview from "../assets/images/regenerated_image_1778320330869.png";
import { useFinanceStore } from "../store/useFinanceStore";
import { loginWithGoogle } from "../lib/firebase";

export default function Landing() {
  const navigate = useNavigate();
  const setAppMode = useFinanceStore(state => state.setAppMode);

  const handleStartDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    setAppMode('demo');
    navigate('/app');
  };

  const handleStartReal = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await loginWithGoogle();
      // AppMode will be set by FirebaseProvider's auth listener
      navigate('/app');
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const scrollToSection = (id: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: id === '#contact' ? 'start' : 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-[#020410] text-white font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* User Provided Cosmic Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center pointer-events-none opacity-50 contrast-125 saturate-150 mix-blend-screen" 
        style={{ backgroundImage: `url('/input_file_0.png')` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#020410]/95 via-[#020410]/40 to-[#020410]/90 pointer-events-none" />
      
      <nav className="border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between backdrop-blur-md fixed w-full top-0 z-50 bg-[#020617]/80">
        <div className="flex items-center gap-2">
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
        </div>
        <div className="hidden md:flex items-center gap-8 text-[15px] font-medium text-slate-300">
          <a href="#features" onClick={(e) => scrollToSection('#features', e)} className="hover:text-white transition-colors cursor-pointer">Tính năng</a>
          <a href="#how-it-works" onClick={(e) => scrollToSection('#how-it-works', e)} className="hover:text-white transition-colors cursor-pointer">Cách hoạt động</a>
          <a href="#reviews" onClick={(e) => scrollToSection('#reviews', e)} className="hover:text-white transition-colors cursor-pointer">Đánh giá</a>
          <a href="#contact" onClick={(e) => scrollToSection('#contact', e)} className="hover:text-white transition-colors cursor-pointer">Liên hệ</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleStartReal} className="hidden sm:block text-[15px] font-semibold text-white bg-slate-900 border border-white/10 hover:bg-slate-800 px-6 py-2.5 rounded-[14px] transition-all cursor-pointer">
            Đăng nhập
          </button>
          <button onClick={handleStartReal} className="bg-gradient-to-r from-indigo-400 to-cyan-400 hover:from-indigo-300 hover:to-cyan-300 text-white px-6 py-2.5 rounded-[14px] text-[15px] font-semibold transition-all cursor-pointer">
            Đăng ký
          </button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-32 px-6 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-white/10 mb-8">
                <Target className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-300 pr-2">Nền tảng quản lý tài chính cá nhân #1</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-[55px] font-bold tracking-tight mb-8 leading-[1.15]">
                Kiểm soát tài chính <br className="hidden md:block"/>
                cá nhân. <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">Tối ưu đầu tư.</span><br className="hidden md:block"/>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">Xây dựng tương lai vững chắc.</span>
              </h1>
              <p className="text-lg text-slate-400 mb-10 max-w-xl">
                FinVest giúp bạn quản lý thu nhập, chi phí, dòng tiền và mô phỏng đầu tư trong một nền tảng trực quan, hiện đại.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button onClick={handleStartReal} className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white rounded-xl text-[15px] font-semibold transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] w-full sm:w-auto text-center cursor-pointer">
                  Bắt đầu miễn phí
                </button>
                <button onClick={handleStartDemo} className="px-8 py-3.5 bg-transparent border border-white/20 hover:bg-white/5 text-white rounded-xl text-[15px] font-semibold transition-all w-full sm:w-auto text-center cursor-pointer">
                  Xem demo
                </button>
              </div>
            </div>
            
            {/* Right Content - Image */}
            <div className="relative">
              <div className="border border-[#020617] rounded-2xl p-2 bg-[#020617]/50 backdrop-blur-xl shadow-2xl relative z-10 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
                <img src={dashboardPreview} alt="Dashboard Preview" className="rounded-xl border border-[#020617] opacity-90 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/80 via-transparent to-transparent pointer-events-none rounded-2xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-6 border-y border-white/5 relative z-10 scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-[40px] font-bold text-center mb-4 tracking-tight">Mọi thứ bạn cần để làm chủ tài chính</h2>
            <p className="text-center text-slate-400 mb-16 text-[17px] max-w-2xl mx-auto">Bộ công cụ toàn diện được thiết kế cho người Việt hiện đại.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {[
                { icon: Wallet, title: "Quản lý thu nhập\nvà chi phí", desc: "Theo dõi thu nhập, chi phí chi tiết theo từng danh mục." },
                { icon: BarChart3, title: "Theo dõi dòng tiền", desc: "Tự động tính toán dòng tiền ròng và tỷ lệ tiết kiệm." },
                { icon: TrendingUp, title: "Mô phỏng đầu tư\n30 năm", desc: "Dự báo tài sản tương lai với biểu đồ trực quan." },
                { icon: PieChart, title: "Phân bổ danh mục\ncổ phiếu", desc: "Tối ưu danh mục đầu tư hiệu quả và linh hoạt." },
                { icon: Sparkles, title: "Cố vấn AI tài chính", desc: "AI phân tích và đề xuất chiến lược tài chính phù hợp." },
                { icon: LineChart, title: "Báo cáo & biểu đồ\ntrực quan", desc: "Hiểu rõ sức khỏe tài chính qua các báo cáo trực quan." }
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-[24px] bg-slate-900 border border-white/5 hover:bg-slate-800 transition-colors group flex flex-col items-start h-full">
                  <div className="h-14 w-14 rounded-2xl bg-[#1e1b4b] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                    <f.icon className="h-6 w-6 text-purple-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[17px] font-bold mb-3 leading-snug whitespace-pre-line text-slate-100">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mt-auto">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24 px-6 relative scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-[40px] font-bold text-center mb-4 tracking-tight">Cách FinVest hoạt động</h2>
            <p className="text-center text-slate-400 mb-16 text-[17px] max-w-2xl mx-auto">Ba bước đơn giản để bắt đầu hành trình tài chính.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: "01", title: "Tạo tài khoản", desc: "Đăng ký miễn phí trong 30 giây và thiết lập hồ sơ tài chính." },
                { step: "02", title: "Kết nối dữ liệu", desc: "Nhập thu nhập, chi tiêu hoặc đồng bộ từ ngân hàng." },
                { step: "03", title: "Nhận insight", desc: "FinVest phân tích, đưa ra khuyến nghị và mô phỏng đầu tư." }
              ].map((f, i) => (
                <div key={i} className="p-8 rounded-[24px] bg-slate-900 border border-white/5 hover:bg-slate-800 transition-colors group flex flex-col items-start h-full">
                  <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-6 group-hover:scale-105 transition-transform">
                    {f.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-100">{f.title}</h3>
                  <p className="text-slate-400 text-[15px] leading-relaxed mt-auto">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Statistics & Reviews */}
        <section id="reviews" className="py-24 px-6 relative border-y border-white/5 z-10 scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {[
                { value: "120K+", label: "Người dùng tin tưởng", color: "from-blue-400 to-indigo-400" },
                { value: "98%", label: "Hài lòng dịch vụ", color: "from-blue-400 to-indigo-400" },
                { value: "24/7", label: "Hỗ trợ khách hàng", color: "from-blue-400 to-indigo-400" }
              ].map((stat, i) => (
                <div key={i} className="p-8 rounded-[24px] bg-[#0f172a] border border-white/5 flex flex-col items-center justify-center text-center">
                  <div className={`text-4xl md:text-[42px] font-bold bg-clip-text text-transparent bg-gradient-to-r ${stat.color} mb-3 filter drop-shadow-md`}>
                    <span>{stat.value}</span>
                  </div>
                  <div className="text-slate-400 text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Testimonials */}
            <div className="flex flex-col items-center mb-8">
              <h2 className="text-3xl md:text-[40px] font-bold text-center tracking-tight">Người dùng nói gì về FinVest</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "\"FinVest giúp tôi nhìn rõ dòng tiền và lên kế hoạch đầu tư dài hạn cực kỳ trực quan.\"",
                  name: "Minh Quân",
                  role: "Software Engineer",
                  avatarColor: "bg-blue-500",
                  initial: "M"
                },
                {
                  quote: "\"Giao diện đẹp, dễ dùng. Lần đầu tiên tôi thấy việc quản lý chi tiêu thú vị.\"",
                  name: "Thu Hà",
                  role: "Marketing Lead",
                  avatarColor: "bg-indigo-500",
                  initial: "T"
                },
                {
                  quote: "\"Mô phỏng 30 năm và cố vấn AI là tính năng tôi không thấy ở app nào khác.\"",
                  name: "Đức Anh",
                  role: "Founder",
                  avatarColor: "bg-blue-600",
                  initial: "Đ"
                }
              ].map((review, i) => (
                <div key={i} className="p-8 rounded-[24px] bg-[#0f172a] border border-white/5 flex flex-col h-full">
                  <div className="flex gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-slate-200 text-[15px] leading-relaxed mb-8 flex-grow">{review.quote}</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${review.avatarColor}`}>
                      {review.initial}
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{review.name}</div>
                      <div className="text-slate-500 text-xs">{review.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </section>

        {/* CTA Section */}
        <section className="pt-8 pb-12 px-6 relative">
          <div className="max-w-4xl mx-auto text-center border-t border-white/5 pt-8">
            <h2 className="text-3xl md:text-[40px] font-bold mb-6 tracking-tight">Sẵn sàng bắt đầu cùng FinVest?</h2>
            <p className="text-slate-400 mb-12 text-[17px] max-w-2xl mx-auto leading-relaxed">
              Đăng ký ngay hôm nay để trải nghiệm công cụ quản lý tài chính và đầu tư thông minh dành riêng cho bạn.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all transform hover:-translate-y-1 group">
              Đăng ký ngay
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-12 px-6 relative z-10 scroll-mt-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-[40px] font-bold mb-6 tracking-tight">Liên hệ với chúng tôi</h2>
            <p className="text-slate-400 mb-8 text-[17px] max-w-3xl mx-auto leading-relaxed">
              Bạn có câu hỏi, góp ý hoặc muốn tìm hiểu thêm về FinVest? Hãy liên hệ với chúng tôi. <br className="hidden md:block" />
              Chúng tôi luôn sẵn sàng hỗ trợ bạn trên hành trình quản lý tài chính và đầu tư hiệu quả hơn.
            </p>
            
          </div>
        </section>

        {/* Footer / Contact Section */}
        <footer className="py-12 px-6 border-t border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
              
              {/* Brand & Description */}
              <div className="lg:col-span-4">
                <div className="text-slate-400 text-[14px] leading-relaxed mb-8 max-w-sm space-y-2">
                  <p className="font-bold text-slate-300 uppercase tracking-tight">Công ty TNHH Ví Mỏng Nhưng Mơ Lớn</p>
                  <p className="flex items-start gap-1.5">
                    <span className="shrink-0">Trụ sở</span>
                    <MapPin className="h-3.5 w-3.5 text-slate-500 mt-1 shrink-0" />
                    <span>Ghế nhà A Trường Đại học Ngoại thương - 91 Chùa Láng, Phường Láng, TP Hà Nội</span>
                  </p>
                </div>
                <p className="text-slate-500 text-sm">
                  © 2026 FinVest. Quản lý tài chính cho mọi người.
                </p>
              </div>

              {/* Links Sections */}
              <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                  <h4 className="text-blue-500 font-semibold mb-6 text-sm uppercase tracking-wider">Sản phẩm</h4>
                  <ul className="space-y-4">
                    {[
                      { name: "Tính năng", id: "#features" },
                      { name: "Cách hoạt động", id: "#how-it-works" },
                      { name: "Đánh giá", id: "#reviews" },
                      { name: "Liên hệ", id: "#contact" }
                    ].map((item) => (
                      <li key={item.name}>
                        <a href={item.id} className="text-slate-400 hover:text-white transition-colors text-[15px]">{item.name}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-indigo-500 font-semibold mb-6 text-sm uppercase tracking-wider">Hỗ trợ</h4>
                  <ul className="space-y-4">
                    {[
                      { name: "Trung tâm trợ giúp", id: "#" },
                      { name: "Hướng dẫn sử dụng", id: "#" },
                      { name: "Câu hỏi thường gặp", id: "#" },
                      { name: "Liên hệ", id: "#contact" }
                    ].map((item) => (
                      <li key={item.name}>
                        <a href={item.id} className="text-slate-400 hover:text-white transition-colors text-[15px]">{item.name}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-purple-500 font-semibold mb-6 text-sm uppercase tracking-wider">Về chúng tôi</h4>
                  <ul className="space-y-4">
                    {["Giới thiệu", "Điều khoản sử dụng", "Chính sách bảo mật", "Blog"].map((item) => (
                      <li key={item}>
                        <a href="#" className="text-slate-400 hover:text-white transition-colors text-[15px]">{item}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Social Links */}
              <div className="lg:col-span-2">
                <h4 className="text-blue-400 font-semibold mb-6 text-sm uppercase tracking-wider">Thông tin liên hệ</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Mail className="h-4 w-4 text-blue-400" />
                    <span className="text-sm">Email: <span className="text-slate-200">support@finvest.vn</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <Phone className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm">Điện thoại: <span className="text-slate-200">(+84) 123 456 789</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
