import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocialPosts } from '../utils/adminContentStore';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{"role": "Student"}');
  const [newsItems, setNewsItems] = useState([]);

  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'vi');

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'vi');
    window.addEventListener('language-changed', handleLangChange);
    return () => window.removeEventListener('language-changed', handleLangChange);
  }, []);

  const t = {
    vi: {
      heroBadge: "Hỗ trợ bởi Gemini AI",
      heroTitlePart1: "Kho tàng",
      heroTitlePart2: "Sáng kiến UEF",
      heroDesc: "Nền tảng tập trung giúp sinh viên tra cứu, giảng viên đánh giá và AI hỗ trợ phân tích chuyên sâu các công trình nghiên cứu tiêu biểu.",
      heroBtnSearch: "Bắt đầu tra cứu",
      heroBtnGuide: "Xem hướng dẫn",
      cardSearchTitle: "Tra cứu",
      cardSearchDesc: "Tìm kiếm và khai thác kho dữ liệu sáng kiến học thuật khổng lồ.",
      cardSearchAction: "Khám phá",
      cardGradeTitle: "Chấm điểm",
      cardGradeDesc: "Hội đồng chuyên môn thực hiện đánh giá và xếp loại sáng kiến.",
      cardGradeAction: "Danh sách",
      cardAiTitle: "Gemini AI",
      cardAiDesc: "Sử dụng trí tuệ nhân tạo để tóm tắt nội dung sáng kiến đa phương tiện.",
      cardAiAction: "Trải nghiệm",
      cardAdminTitle: "Quản trị",
      cardAdminDesc: "Quản lý cơ sở dữ liệu, người dùng và báo cáo hệ thống tổng thể.",
      cardAdminAction: "Bảng điều khiển",
      newsTitle: "Tin tức & Thông báo",
      newsSubtitle: "Cập nhật mới nhất",
      newsBtnAll: "Tất cả",
      newsBtnMore: "Chi tiết"
    },
    en: {
      heroBadge: "Powered by Gemini AI",
      heroTitlePart1: "Academic",
      heroTitlePart2: "UEF Initiatives",
      heroDesc: "A centralized platform helping students search, advisors grade, and AI analyze outstanding academic research works in-depth.",
      heroBtnSearch: "Start Searching",
      heroBtnGuide: "View Guidelines",
      cardSearchTitle: "Search",
      cardSearchDesc: "Search and explore the vast database of academic innovations.",
      cardSearchAction: "Explore",
      cardGradeTitle: "Grading",
      cardGradeDesc: "The academic committee conducts evaluations and grades initiatives.",
      cardGradeAction: "List Theses",
      cardAiTitle: "Gemini AI",
      cardAiDesc: "Utilize artificial intelligence to summarize multimedia research content.",
      cardAiAction: "Try AI Now",
      cardAdminTitle: "Administration",
      cardAdminDesc: "Manage the database, users, and overall system reports.",
      cardAdminAction: "Dashboard",
      newsTitle: "News & Announcements",
      newsSubtitle: "Latest Updates",
      newsBtnAll: "View All",
      newsBtnMore: "Details"
    }
  }[lang];

  useEffect(() => {
    const load = () =>
      setNewsItems(
        getSocialPosts()
          .slice(0, 3)
          .map(p => ({
            id: p.id,
            title: p.title,
            date: p.date,
            badge: p.category,
            badgeClass: p.badgeClass || 'bg-primary text-on-primary',
            image: p.image,
            desc: p.desc,
          }))
      );
    load();
    window.addEventListener('admin-content-updated', load);
    return () => window.removeEventListener('admin-content-updated', load);
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Banner Section - Refined */}
      <section className="relative w-full min-h-[480px] md:h-[500px] py-16 md:py-0 flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover scale-105" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNDlUX0ZxPtd9FFEvx2RuM_AJUf4MmXTm_fDHRIp4RA357uwWGW4cu7ET1A93aGbwTJ8rcmsH_P_jXgQij4gW-zrCc1_f8EGbw_lC8DxXe_dkF_Iqe9A-XHs2ASrlDKr9kBWZyl6LELtWERGbngkXMot1w8T3nqUHWQLB0VLwli7MP7lWHmuvFWUAkPuiQyMxGAAoYL_cTlaHgrIUM-xBzsSIG9p5wwm0ToTuZZ26Jju_-GhpX4FO8ceC_8tnDy0sO06U5ui1d2tEs" 
            alt="UEF Library"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent"></div>
        </div>
        <div className="relative z-10 px-6 sm:px-12 md:px-16 lg:px-24 max-w-[1400px] mx-auto w-full text-on-primary">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 mb-6 md:mb-8 animate-bounce-subtle">
            <span className="material-symbols-outlined text-base text-yellow-400">auto_awesome</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t.heroBadge}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black max-w-3xl mb-6 md:mb-8 leading-[1.1] md:leading-[1] tracking-tighter">
            {t.heroTitlePart1} <br/> <span className="text-white/70">{t.heroTitlePart2}</span>
          </h1>
          <p className="text-sm sm:text-lg md:text-xl max-w-2xl mb-8 md:mb-12 opacity-90 leading-relaxed font-medium">
            {t.heroDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full sm:w-auto">
            <button 
              onClick={() => navigate('/lookup')}
              className="px-6 py-3.5 sm:px-12 sm:py-5 bg-white text-primary rounded-xl sm:rounded-2xl font-black hover:bg-surface-container-low transition-all shadow-[0_20px_50px_rgba(255,255,255,0.15)] active:scale-95 uppercase tracking-wider sm:tracking-widest text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto whitespace-nowrap"
            >
              {t.heroBtnSearch}
              <span className="material-symbols-outlined">search</span>
            </button>
            <button 
              onClick={() => navigate('/guidelines')}
              className="px-6 py-3.5 sm:px-12 sm:py-5 border-2 border-white/30 text-white rounded-xl sm:rounded-2xl font-black hover:bg-white/10 transition-all backdrop-blur-sm active:scale-95 uppercase tracking-wider sm:tracking-widest text-xs sm:text-sm text-center w-full sm:w-auto whitespace-nowrap"
            >
              {t.heroBtnGuide}
            </button>
          </div>
        </div>
      </section>

      {/* Bento Quick Action Cards - Compact & Balanced */}
      <section className="py-12 px-4 md:px-8 xl:px-10 max-w-[1400px] mx-auto w-full animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
          {/* Action: Tra cứu - Red Theme */}
          <div 
            onClick={() => navigate('/lookup')}
            className="bg-surface-container-lowest p-5 rounded-[1.75rem] border border-outline-variant hover:border-red-400/50 hover:shadow-[0_15px_40px_rgba(239,68,68,0.08)] transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[235px]"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div>
              <div className="w-12 h-12 bg-red-50 flex items-center justify-center rounded-xl mb-4 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined text-xl">manage_search</span>
              </div>
              <h3 className="text-lg font-black mb-1.5 text-on-surface">{t.cardSearchTitle}</h3>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed line-clamp-3 opacity-80">{t.cardSearchDesc}</p>
            </div>
            <div className="text-red-600 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
              {t.cardSearchAction} <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          </div>


          {/* Action: Gemini - Purple Theme */}
          <div 
            onClick={() => navigate('/analysis')}
            className="bg-surface-container-lowest p-5 rounded-[1.75rem] border border-outline-variant hover:border-purple-400/50 hover:shadow-[0_15px_40px_rgba(168,85,247,0.08)] transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[235px]"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div>
              <div className="w-12 h-12 bg-purple-50 flex items-center justify-center rounded-xl mb-4 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined text-xl">auto_awesome</span>
              </div>
              <h3 className="text-lg font-black mb-1.5 text-on-surface">{t.cardAiTitle}</h3>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed line-clamp-3 opacity-80">{t.cardAiDesc}</p>
            </div>
            <div className="text-purple-600 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
              {t.cardAiAction} <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          </div>

          {/* Action: Admin - Dark Theme */}
          <div 
            onClick={() => navigate('/settings')}
            className="bg-surface-container-lowest p-5 rounded-[1.75rem] border border-outline-variant hover:border-on-surface/30 hover:shadow-[0_15px_40px_rgba(0,0,0,0.04)] transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[235px]"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-surface-container-high rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div>
              <div className="w-12 h-12 bg-surface-container-high flex items-center justify-center rounded-xl mb-4 text-on-surface group-hover:bg-on-surface group-hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
              </div>
              <h3 className="text-lg font-black mb-1.5 text-on-surface">{t.cardAdminTitle}</h3>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed line-clamp-3 opacity-80">{t.cardAdminDesc}</p>
            </div>
            <div className="text-on-surface font-black text-[9px] uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
              {t.cardAdminAction} <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          </div>
        </div>

        {/* News Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 bg-primary rounded-full"></div>
            <div>
              <h2 className="text-2xl font-black text-on-surface tracking-tight leading-none mb-1">{t.newsTitle}</h2>
              <p className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em]">{t.newsSubtitle}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/news')}
            className="px-5 py-2 text-primary font-black text-[9px] uppercase tracking-widest border border-primary/20 rounded-lg hover:bg-primary/5 transition-all flex items-center gap-2"
          >
            {t.newsBtnAll}
            <span className="material-symbols-outlined text-xs">east</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsItems.map(news => (
            <div 
              key={news.id} 
              onClick={() => navigate(`/news/${news.id}`)}
              className="bg-surface-container-lowest rounded-[1.5rem] overflow-hidden border border-outline-variant group hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 cursor-pointer flex flex-col"
            >
              <div className="h-40 overflow-hidden relative">
                <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" src={news.image} alt={news.title} />
                <div className="absolute top-4 left-4">
                  <span className={`${news.badgeClass} text-[8px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-md shadow-xl backdrop-blur-md`}>{news.badge}</span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <span className="text-on-surface-variant text-[9px] font-black uppercase tracking-widest mb-2 opacity-40">{news.date}</span>
                <h4 className="text-base font-black text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">{news.title}</h4>
                <p className="text-[12px] text-on-surface-variant line-clamp-2 leading-relaxed font-medium mb-4 opacity-60">{news.desc}</p>
                <div className="mt-auto pt-4 border-t border-outline-variant/10 text-primary font-black text-[8px] uppercase tracking-[0.2em] flex items-center gap-2 group-hover:gap-3 transition-all">
                  {t.newsBtnMore}
                  <span className="material-symbols-outlined text-sm">east</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
