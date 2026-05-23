import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{"role": "Student"}');

  const newsItems = [
    {
      title: "Công bố danh sách các sáng kiến tiêu biểu học kỳ 1 năm 2024",
      date: "20/10/2024",
      badge: "Tin mới",
      badgeClass: "bg-primary text-on-primary",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVaKckFBO6OahgQhL5POM9HkyyecIPbbQpO1dWLvQHUSBcj49wyeR69ByLr8G1HshrXjAzidE5A-wOT6RA7V7eLvC33ch_y8-bNDvNRg1HwmmnaJTAcz8NBYG9tH7A-4q9Aydwy8_z9zEL6dgejrSFafcXOHrBluNSxzC-1l68EVFbA93qGEExIzjN4r7IEyBbD-vnEDCAtJDWdRszsVJdArxh12IA2eUzDBOvizUG5zZuFjD1jL69T8qDOK5VDX_pqXpNUf76mRsk",
      desc: "Hội đồng chuyên môn đã hoàn tất việc chấm điểm và lựa chọn ra 10 sáng kiến xuất sắc nhất để triển khai thực tế..."
    },
    {
      title: "Hướng dẫn tra cứu và tham khảo kho dữ liệu sáng kiến học thuật",
      date: "18/10/2024",
      badge: "Hướng dẫn",
      badgeClass: "bg-secondary-container text-on-secondary-container",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9CBcdVbi_lVPZdj1fMXkDrm6UXNpgAQzAbT5BzIzcVc1wXGTHcmwvFTTaIEgcFm1wFyYIkxuYp8LKwSkizyelJ4bjIqymKLSgFfukFSODI8QlHCdYgYlzoIpXWPGJ6pwNFnkIc54kH5CFyy19WYTo0HdQ9cSVQ1CNsuV41pZn1z5hhO7krZslwN6YtBpL_fRpzCvXn5HpiOcH4ntw_v0VI8GftCgk9T6IiQz7ikPDYxY5Gr4t4CGGG3_-YsRIM4rMsyCMlTMvyufS",
      desc: "Sinh viên có thể sử dụng công cụ tìm kiếm thông minh để truy cập hàng nghìn tài liệu nghiên cứu và sáng kiến qua các năm..."
    },
    {
      title: "Hệ thống AI Gemini hỗ trợ phân tích và tóm tắt sáng kiến",
      date: "15/10/2024",
      badge: "Tính năng",
      badgeClass: "bg-surface-container-high text-on-surface",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuANxGO4D6ojuZlYk7MEhtq_38tsfUs324mV9MOXepahz-7q_MfJXjqjvHbgLt27PAjQquIgxNbU4l8TFLxxTqokf9fiaJRq8mxeZIqQU-_fhU1ho_Omjv4xl_49kl_cJIIr3tyg5-3Lu3GYiLPM2N3psKIdMJtF-p6DcwYjflkXf24kayQ57904JAS0eyc8PMffw-nv4NNzDqKse0KbLJ4YWmW0Hqys7UoOYciK4A2BTM_k2g3B1Slq6NwqcMgwtqtuEWUyLaQ7lH_W",
      desc: "Tích hợp trí tuệ nhân tạo Gemini giúp sinh viên nhanh chóng nắm bắt nội dung cốt lõi của các đề tài nghiên cứu phức tạp..."
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Banner Section - Refined */}
      <section className="relative w-full h-[500px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover scale-105" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNDlUX0ZxPtd9FFEvx2RuM_AJUf4MmXTm_fDHRIp4RA357uwWGW4cu7ET1A93aGbwTJ8rcmsH_P_jXgQij4gW-zrCc1_f8EGbw_lC8DxXe_dkF_Iqe9A-XHs2ASrlDKr9kBWZyl6LELtWERGbngkXMot1w8T3nqUHWQLB0VLwli7MP7lWHmuvFWUAkPuiQyMxGAAoYL_cTlaHgrIUM-xBzsSIG9p5wwm0ToTuZZ26Jju_-GhpX4FO8ceC_8tnDy0sO06U5ui1d2tEs" 
            alt="UEF Library"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent"></div>
        </div>
        <div className="relative z-10 px-8 md:px-16 lg:px-24 max-w-[1400px] mx-auto w-full text-on-primary">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 mb-8 animate-bounce-subtle">
            <span className="material-symbols-outlined text-base text-yellow-400">auto_awesome</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Hỗ trợ bởi Gemini AI</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black max-w-3xl mb-8 leading-[1] tracking-tighter">
            Kho tàng <br/> <span className="text-white/70">Sáng kiến UEF</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-12 opacity-90 leading-relaxed font-medium">
            Nền tảng tập trung giúp sinh viên tra cứu, giảng viên đánh giá và AI hỗ trợ phân tích chuyên sâu các công trình nghiên cứu tiêu biểu.
          </p>
          <div className="flex flex-wrap gap-5">
            <button 
              onClick={() => navigate('/lookup')}
              className="px-12 py-5 bg-white text-primary rounded-2xl font-black hover:bg-surface-container-low transition-all shadow-[0_20px_50px_rgba(255,255,255,0.3)] active:scale-95 uppercase tracking-widest text-sm flex items-center gap-3"
            >
              Bắt đầu tra cứu
              <span className="material-symbols-outlined">search</span>
            </button>
            <button 
              onClick={() => navigate('/guidelines')}
              className="px-12 py-5 border-2 border-white/30 text-white rounded-2xl font-black hover:bg-white/10 transition-all backdrop-blur-sm active:scale-95 uppercase tracking-widest text-sm"
            >
              Xem hướng dẫn
            </button>
          </div>
        </div>
      </section>

      {/* Bento Quick Action Cards - Compact & Balanced */}
      <section className="py-12 px-8 md:px-16 lg:px-24 max-w-[1300px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {/* Action: Tra cứu - Red Theme */}
          <div 
            onClick={() => navigate('/lookup')}
            className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant hover:border-red-400/50 hover:shadow-[0_15px_40px_rgba(239,68,68,0.08)] transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[280px]"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div>
              <div className="w-12 h-12 bg-red-50 flex items-center justify-center rounded-xl mb-4 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined text-xl">manage_search</span>
              </div>
              <h3 className="text-lg font-black mb-1.5 text-on-surface">Tra cứu</h3>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed line-clamp-3 opacity-80">Tìm kiếm và khai thác kho dữ liệu sáng kiến học thuật khổng lồ.</p>
            </div>
            <div className="text-red-600 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
              Khám phá <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          </div>

          {/* Action: Chấm điểm - Blue Theme */}
          <div 
            onClick={() => navigate('/theses')}
            className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant hover:border-blue-400/50 hover:shadow-[0_15px_40px_rgba(59,130,246,0.08)] transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[280px]"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div>
              <div className="w-12 h-12 bg-blue-50 flex items-center justify-center rounded-xl mb-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined text-xl">fact_check</span>
              </div>
              <h3 className="text-lg font-black mb-1.5 text-on-surface">Chấm điểm</h3>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed line-clamp-3 opacity-80">Hội đồng chuyên môn thực hiện đánh giá và xếp loại sáng kiến.</p>
            </div>
            <div className="text-blue-600 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
              Danh sách <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          </div>

          {/* Action: Gemini - Purple Theme */}
          <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant hover:border-purple-400/50 hover:shadow-[0_15px_40px_rgba(168,85,247,0.08)] transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[280px]">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div>
              <div className="w-12 h-12 bg-purple-50 flex items-center justify-center rounded-xl mb-4 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined text-xl">auto_awesome</span>
              </div>
              <h3 className="text-lg font-black mb-1.5 text-on-surface">Gemini AI</h3>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed line-clamp-3 opacity-80">Sử dụng trí tuệ nhân tạo để tóm tắt nội dung sáng kiến đa phương tiện.</p>
            </div>
            <div className="text-purple-600 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
              Trải nghiệm <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          </div>

          {/* Action: Admin - Dark Theme */}
          <div 
            onClick={() => navigate('/settings')}
            className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant hover:border-on-surface/30 hover:shadow-[0_15px_40px_rgba(0,0,0,0.04)] transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[280px]"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-surface-container-high rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div>
              <div className="w-12 h-12 bg-surface-container-high flex items-center justify-center rounded-xl mb-4 text-on-surface group-hover:bg-on-surface group-hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
              </div>
              <h3 className="text-lg font-black mb-1.5 text-on-surface">Quản trị</h3>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed line-clamp-3 opacity-80">Quản lý cơ sở dữ liệu, người dùng và báo cáo hệ thống tổng thể.</p>
            </div>
            <div className="text-on-surface font-black text-[9px] uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
              Bảng điều khiển <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          </div>
        </div>

        {/* News Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 bg-primary rounded-full"></div>
            <div>
              <h2 className="text-2xl font-black text-on-surface tracking-tight leading-none mb-1">Tin tức & Thông báo</h2>
              <p className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em]">Cập nhật mới nhất</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/news')}
            className="px-5 py-2 text-primary font-black text-[9px] uppercase tracking-widest border border-primary/20 rounded-lg hover:bg-primary/5 transition-all flex items-center gap-2"
          >
            Tất cả
            <span className="material-symbols-outlined text-xs">east</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsItems.map((news, idx) => (
            <div 
              key={idx} 
              onClick={() => navigate(`/news/${idx + 1}`)}
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
                  Chi tiết
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
