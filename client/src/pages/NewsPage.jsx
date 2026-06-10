import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocialPosts } from '../utils/adminContentStore';

const NewsPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [allNewsItems, setAllNewsItems] = useState([]);

  const categories = ['All', 'Tin mới', 'Hướng dẫn', 'Tính năng', 'Báo chí'];

  useEffect(() => {
    const load = () => setAllNewsItems(getSocialPosts());
    load();
    window.addEventListener('admin-content-updated', load);
    return () => window.removeEventListener('admin-content-updated', load);
  }, []);

  const filteredNews = filter === 'All' 
    ? allNewsItems 
    : allNewsItems.filter(item => item.category === filter);

  return (
    <div className="flex flex-col min-h-screen bg-surface-bright overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Hero Featured Section */}
      <section className="relative pt-24 pb-12 px-8 md:px-16 lg:px-24 z-10">
        <div className="max-w-[1300px] mx-auto">
          <div className="relative h-[450px] rounded-[3rem] overflow-hidden group cursor-pointer shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=2000" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]"
              alt="Featured"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-10 md:p-16 text-white max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary rounded-lg text-[10px] font-black uppercase tracking-widest mb-6">
                <span className="material-symbols-outlined text-xs">star</span>
                Tiêu điểm
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tighter">
                Hành trình số hóa <br/> Sáng kiến học thuật UEF 2024
              </h1>
              <p className="text-lg opacity-80 mb-8 line-clamp-2 font-medium">
                Khám phá cách chúng tôi áp dụng trí tuệ nhân tạo để thay đổi cách sinh viên tiếp cận và thực hiện các đề tài nghiên cứu khoa học.
              </p>
              <button className="px-8 py-4 bg-white text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all">
                Đọc bài viết đầy đủ
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="py-12 px-8 md:px-16 lg:px-24 z-10">
        <div className="max-w-[1300px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-black text-on-surface mb-2">Dòng chảy tin tức</h2>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      filter === cat 
                      ? 'bg-on-surface text-white' 
                      : 'bg-white text-on-surface-variant border border-outline-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredNews.map((news, idx) => (
              <div 
                key={news.id} 
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/news/${news.id}`)}
                onKeyDown={e => e.key === 'Enter' && navigate(`/news/${news.id}`)}
                className="group cursor-pointer animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden mb-6 shadow-lg">
                  <img src={news.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={news.title} />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute top-6 left-6">
                    <span className={`${news.badgeClass} text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-md`}>
                      {news.category}
                    </span>
                  </div>
                </div>
                <div className="px-4">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">{news.date}</span>
                  <h3 className="text-xl font-black text-on-surface mb-3 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {news.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant font-medium opacity-60 line-clamp-2">
                    {news.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Special Press Highlights - Vertical Layout */}
          <div className="mt-24">
            <div className="flex items-center gap-4 mb-12">
              <span className="text-5xl font-black text-primary/20">01</span>
              <h2 className="text-3xl font-black text-on-surface">Điểm tin Báo chí</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              {allNewsItems.filter(n => n.category === 'Báo chí').map((news, idx) => (
                <div 
                  key={news.id}
                  className="bg-white rounded-[3rem] p-4 flex flex-col md:flex-row gap-8 hover:shadow-2xl transition-all border border-outline-variant/50 group"
                >
                  <div className="w-full md:w-[400px] h-[250px] rounded-[2.5rem] overflow-hidden">
                    <img src={news.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center py-6 pr-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-10 h-[2px] bg-primary"></span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{news.date}</span>
                    </div>
                    <h3 className="text-2xl font-black text-on-surface mb-4 group-hover:text-primary transition-colors leading-tight">
                      {news.title}
                    </h3>
                    <p className="text-on-surface-variant font-medium opacity-70 mb-8 leading-relaxed max-w-2xl">
                      {news.desc}
                    </p>
                    <div className="flex items-center gap-4">
                      <button className="px-6 py-3 bg-on-surface text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                        Xem bài gốc
                      </button>
                      <button className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                        Chia sẻ <span className="material-symbols-outlined text-sm">share</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
          {filteredNews.length === 0 && (
            <div className="py-20 text-center animate-fade-in relative z-10">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4">search_off</span>
              <p className="text-on-surface-variant font-medium">Không tìm thấy tin tức nào trong danh mục này.</p>
            </div>
          )}
    </div>
  );
};

export default NewsPage;
