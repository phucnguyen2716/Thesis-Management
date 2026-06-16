import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socialService } from '../services/api';

const NewsDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await socialService.getAll(false);
        const found = data.find(p => p.id === id || String(p.id) === String(id));
        setPost(found);
      } catch (err) {
        console.error("Failed to load post detail", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-on-surface-variant font-medium">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
        <span className="ml-2">Đang tải chi tiết bài viết...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-on-surface-variant p-6">
        <span className="material-symbols-outlined text-6xl text-red-500 mb-4 font-black">error</span>
        <h2 className="text-2xl font-black text-on-surface mb-2">Không tìm thấy bài viết</h2>
        <p className="mb-6 opacity-60">Bài viết hoặc sự kiện này không tồn tại hoặc đã bị xóa.</p>
        <button onClick={() => navigate('/news')} className="px-6 py-3 bg-primary text-on-primary rounded-xl font-black text-xs uppercase tracking-widest">
          Quay lại Tin tức
        </button>
      </div>
    );
  }

  let extra = {};
  if (post.category === 'Sự kiện') {
    try {
      extra = JSON.parse(post.content);
    } catch {
      // Fallback
    }
  }

  const newsDetail = {
    title: post.title || '',
    date: post.date || (post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : ''),
    author: extra.organizer || 'Ban Tổ chức',
    category: post.category || 'Tin tức',
    image: post.image || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
    content: post.category === 'Sự kiện' 
      ? `
        <div class="space-y-4">
          <p class="mb-6 font-bold text-lg text-primary flex items-center gap-2">
            <span class="material-symbols-outlined">event_note</span>
            Sự kiện: ${extra.eventType || 'Hội thảo'}
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-2xl bg-surface-container border border-outline-variant/50">
            <p><strong>Bắt đầu:</strong> ${extra.startDate ? new Date(extra.startDate).toLocaleDateString('vi-VN') : '—'}</p>
            <p><strong>Kết thúc:</strong> ${extra.endDate ? new Date(extra.endDate).toLocaleDateString('vi-VN') : '—'}</p>
            <p><strong>Địa điểm:</strong> ${extra.location || 'Trực tuyến'}</p>
            <p><strong>Số lượng tối đa:</strong> ${extra.maxParticipants || 'Không giới hạn'} người</p>
          </div>
          <p class="mt-6 font-medium text-slate-700 leading-relaxed">${post.desc || ''}</p>
        </div>
      `
      : (post.content || post.desc || ''),
    link: extra.link || '',
    isEvent: post.category === 'Sự kiện',
    extra
  };

  return (
    <div className="flex flex-col bg-background min-h-screen animate-in fade-in duration-500">
      {/* Hero Header */}
      <section className="relative w-full h-[500px] overflow-hidden">
        <img 
          src={newsDetail.image} 
          alt={newsDetail.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 lg:p-24 max-w-[1000px] mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center gap-2 text-on-surface/60 hover:text-primary transition-colors font-black text-[10px] uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Quay lại
          </button>
          <div className="flex items-center gap-4 mb-6">
            <span className="px-4 py-1.5 bg-primary text-on-primary text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">{newsDetail.category}</span>
            <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest opacity-60">{newsDetail.date}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-on-surface leading-[1.1] tracking-tight mb-4">
            {newsDetail.title}
          </h1>
          <p className="text-on-surface-variant font-bold text-sm uppercase tracking-widest">Tác giả: {newsDetail.author}</p>
        </div>
      </section>

      {/* Content Section */}
      <section className="px-8 md:px-16 lg:px-24 py-16 max-w-[1000px] mx-auto w-full">
        <div className="prose prose-lg max-w-none text-on-surface-variant leading-loose font-medium mb-12">
          {/* Using dangerouslySetInnerHTML to simulate rich content for mock */}
          <div dangerouslySetInnerHTML={{ __html: newsDetail.content }} />
        </div>

        {/* External Link Section */}
        {newsDetail.link && (
          <div className="mb-16 p-8 bg-surface-container rounded-[2rem] border border-outline-variant flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                   <span className="material-symbols-outlined">link</span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-on-surface">Tham khảo bài viết gốc</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium">Xem chi tiết tại website chính thức.</p>
                </div>
             </div>
             <a href={newsDetail.link} target="_blank" rel="noreferrer" className="px-8 py-3 bg-white text-primary rounded-xl font-black text-[10px] uppercase tracking-widest border border-outline-variant hover:bg-primary hover:text-on-primary transition-all">Truy cập ngay</a>
          </div>
        )}

        {/* Google Form Registration Section */}
        {newsDetail.isEvent && (
          <div className="mb-16 bg-gradient-to-br from-primary to-primary-container rounded-[3rem] p-12 text-on-primary shadow-2xl relative overflow-hidden group">
             <span className="material-symbols-outlined absolute -right-8 -top-8 text-[12rem] opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700">assignment</span>
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6 border border-white/20">
                     <span className="material-symbols-outlined text-sm">edit_note</span>
                     <span className="text-[10px] font-black uppercase tracking-widest">Đăng ký trực tuyến</span>
                  </div>
                  <h3 className="text-3xl font-black mb-4 tracking-tight">Sẵn sàng tham gia?</h3>
                  <p className="text-sm font-medium opacity-80 leading-relaxed max-w-md">
                     Vui lòng đăng ký tham gia sự kiện trực tuyến bằng cách nhấn nút bên dưới.
                  </p>
                </div>
                <a 
                  href={newsDetail.link || "#"} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="shrink-0 px-12 py-5 bg-white text-primary rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  Mở Link Đăng Ký
                  <span className="material-symbols-outlined text-lg">open_in_new</span>
                </a>
             </div>
          </div>
        )}

        {/* Share & Actions */}
        <div className="mt-16 pt-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Chia sẻ bài viết:</span>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all shadow-sm">
                  <span className="material-symbols-outlined text-sm">share</span>
                </button>
                <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all shadow-sm">
                  <span className="material-symbols-outlined text-sm">link</span>
                </button>
              </div>
           </div>
           <div className="flex gap-4">
             <button className="px-8 py-3 bg-primary text-on-primary rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Lưu bài viết</button>
             <button className="px-8 py-3 border border-outline-variant rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-container-low transition-all">Tải bản PDF</button>
           </div>
        </div>
      </section>

      {/* Related News Suggestion */}
      <section className="bg-surface-container-lowest py-20 px-8 md:px-16 lg:px-24">
        <div className="max-w-[1000px] mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-1 h-8 bg-primary rounded-full"></div>
            <h3 className="text-2xl font-black text-on-surface tracking-tight">Bài viết liên quan</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-6 items-center p-4 bg-white rounded-[2rem] border border-outline-variant hover:shadow-xl transition-all cursor-pointer group">
              <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9CBcdVbi_lVPZdj1fMXkDrm6UXNpgAQzAbT5BzIzcVc1wXGTHcmwvFTTaIEgcFm1wFyYIkxuYp8LKwSkizyelJ4bjIqymKLSgFfukFSODI8QlHCdYgYlzoIpXWPGJ6pwNFnkIc54kH5CFyy19WYTo0HdQ9cSVQ1CNsuV41pZn1z5hhO7krZslwN6YtBpL_fRpzCvXn5HpiOcH4ntw_v0VI8GftCgk9T6IiQz7ikPDYxY5Gr4t4CGGG3_-YsRIM4rMsyCMlTMvyufS" alt="Related" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h4 className="text-sm font-black mb-2 line-clamp-2">Hướng dẫn tra cứu sáng kiến học thuật</h4>
                <p className="text-[10px] text-on-surface-variant font-bold opacity-60 uppercase tracking-widest">18/10/2024</p>
              </div>
            </div>
            <div className="flex gap-6 items-center p-4 bg-white rounded-[2rem] border border-outline-variant hover:shadow-xl transition-all cursor-pointer group">
              <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuANxGO4D6ojuZlYk7MEhtq_38tsfUs324mV9MOXepahz-7q_MfJXjqjvHbgLt27PAjQquIgxNbU4l8TFLxxTqokf9fiaJRq8mxeZIqQU-_fhU1ho_Omjv4xl_49kl_cJIIr3tyg5-3Lu3GYiLPM2N3psKIdMJtF-p6DcwYjflkXf24kayQ57904JAS0eyc8PMffw-nv4NNzDqKse0KbLJ4YWmW0Hqys7UoOYciK4A2BTM_k2g3B1Slq6NwqcMgwtqtuEWUyLaQ7lH_W" alt="Related" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h4 className="text-sm font-black mb-2 line-clamp-2">Hệ thống AI Gemini hỗ trợ phân tích</h4>
                <p className="text-[10px] text-on-surface-variant font-bold opacity-60 uppercase tracking-widest">15/10/2024</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewsDetailPage;
