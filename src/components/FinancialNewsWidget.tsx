import { useState, useEffect, useMemo } from 'react';
import { Newspaper, Loader2, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import newsBanner from '../assets/images/regenerated_image_1778774708997.png';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  thumbnail?: string;
  description?: string;
  source: string;
}

const FALLBACK_NEWS: NewsItem[] = [
  { title: "Thị trường chứng khoán biến động nhẹ", link: "#", pubDate: new Date().toISOString(), source: "VnExpress", description: "Các chỉ số chính có sự điều chỉnh nhẹ trong phiên sáng..." },
  { title: "Giá vàng trong nước ổn định", link: "#", pubDate: new Date().toISOString(), source: "VnExpress", description: "Giá vàng SJC giữ mức ổn định so với phiên hôm trước..." },
];

export const FinancialNewsWidget = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const cached = localStorage.getItem('financial_news_cache_v2');
      const cacheTime = localStorage.getItem('financial_news_time_v2');
      
      if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 15 * 60 * 1000) {
        setNews(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://vnexpress.net/rss/kinh-doanh.rss');
      if (!response.ok) throw new Error('Failed to fetch news');
      const data = await response.json();
      
      const keywords = ['cổ phiếu', 'vàng', 'usd'];
      let filteredItems = data.items.filter((item: any) => {
        const title = item.title ? item.title.toLowerCase() : "";
        const description = item.description ? item.description.toLowerCase() : "";
        const text = title + " " + description;
        return keywords.some(keyword => text.includes(keyword));
      });
      
      // Ensure we always have at least 2 items if available
      if (filteredItems.length < 2 && data.items && data.items.length > 0) {
        const additional = data.items.filter((item: any) => !filteredItems.includes(item));
        filteredItems = [...filteredItems, ...additional];
      }
      
      const formattedNews: NewsItem[] = filteredItems.slice(0, 2).map((item: any) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        thumbnail: item.enclosure?.link || item.thumbnail,
        description: item.description ? item.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + "..." : "",
        source: 'VnExpress'
      }));

      setNews(formattedNews);
      localStorage.setItem('financial_news_cache_v2', JSON.stringify(formattedNews));
      localStorage.setItem('financial_news_time_v2', Date.now().toString());
    } catch (err) {
      console.error(err);
      setError('Không thể tải tin tức. Sử dụng dữ liệu mẫu.');
      setNews(FALLBACK_NEWS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="relative flex flex-col h-full bg-[#0a1128] rounded-3xl border border-indigo-500/20 shadow-2xl overflow-hidden">
      {/* Background Subtle Grid / Layering */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />

      <div className="relative z-10 p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Newspaper className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white uppercase tracking-tight">Tin tức hôm nay</span>
            <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Cập nhật từ VnExpress</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-amber-500 text-xs mb-4 bg-amber-500/10 p-3 rounded-xl border border-amber-500/10">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex flex-col gap-5 flex-grow">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-800/50 rounded-2xl h-16" />
            ))
          ) : (
            <div className="flex flex-col gap-5">
              <AnimatePresence mode="popLayout">
                {news.map((item, i) => (
                  <motion.a
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-3 items-start"
                  >
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                    <div className="flex flex-col gap-1">
                      <h4 className="text-xs font-medium text-slate-200 leading-snug group-hover:text-cyan-300 transition-colors line-clamp-2">{item.title}</h4>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                        <Newspaper className="w-3 h-3" />
                        {item.source}
                      </div>
                    </div>
                  </motion.a>
                ))}
              </AnimatePresence>
              
              <a 
                href="https://vnexpress.net/kinh-doanh" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 hover:text-cyan-300 transition-all underline underline-offset-4 w-fit"
              >
                Đọc thêm
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Banner Section - Flush to bottom */}
      <div className="relative w-full h-[145px] flex-shrink-0">
        <img 
          src={newsBanner} 
          alt="FinTech Banner" 
          className="w-full h-full object-cover" 
        />
      </div>
    </div>
  );
};
