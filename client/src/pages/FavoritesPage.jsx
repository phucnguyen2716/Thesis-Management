import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FavoritesPage = () => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState("fav-1");

  const favoriteItems = [
    {
      id: "fav-1",
      title: "Ứng dụng Machine Learning trong việc tối ưu hóa năng lượng tòa nhà",
      student: "Nguyễn Văn A",
      advisor: "TS. Trần Thị B",
      year: "2024",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
      description: "Đề tài tập trung vào việc xây dựng mô hình dự báo tiêu thụ năng lượng dựa trên dữ liệu lịch sử và các yếu tố môi trường, giúp giảm thiểu 20% chi phí vận hành cho các tòa nhà thông minh tại Việt Nam.",
      stats: { views: "1.2k", downloads: "450", rating: "4.9" },
      tags: ["#SmartCity", "#AI", "#GreenTech"],
      notes: "Cần tham khảo phần thuật toán tối ưu hóa cho đồ án sắp tới."
    },
    {
      id: "fav-2",
      title: "Phát triển hệ thống Blockchain cho truy xuất nguồn gốc nông sản",
      student: "Lê Thị C",
      advisor: "ThS. Hoàng Văn D",
      year: "2023",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1200",
      description: "Giải pháp sử dụng nền tảng Hyperledger Fabric để minh bạch hóa chuỗi cung ứng trái cây xuất khẩu, đảm bảo thông tin từ nông trại đến tay người tiêu dùng không thể bị thay đổi.",
      stats: { views: "2.5k", downloads: "890", rating: "4.8" },
      tags: ["#Blockchain", "#AgriTech", "#Export"],
      notes: "Mô hình chuỗi cung ứng rất chi tiết."
    },
    {
      id: "fav-3",
      title: "Thiết kế trải nghiệm người dùng (UX) cho ứng dụng hỗ trợ người khiếm thị",
      student: "Phạm Minh E",
      advisor: "TS. Ngô Bảo F",
      year: "2024",
      image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=1200",
      description: "Nghiên cứu về các giao diện âm thanh và phản hồi xúc giác nhằm cải thiện khả năng tiếp cận công nghệ cho cộng đồng người yếu thế trong xã hội số.",
      stats: { views: "3.1k", downloads: "1.2k", rating: "5.0" },
      tags: ["#UXUI", "#Accessibility", "#SocialImpact"],
      notes: "Phần khảo sát người dùng rất chuyên nghiệp."
    }
  ];

  const currentItem = favoriteItems.find(item => item.id === selectedId) || favoriteItems[0];

  return (
    <div className="min-h-screen bg-surface-bright pb-20 overflow-hidden">
      {/* Featured Hero Slider with Thumbnail Navigation */}
      <section className="relative h-[400px] sm:h-[550px] w-full bg-[#0a0a0a] overflow-hidden group">
        {favoriteItems.map((item, idx) => (
          <div 
            key={item.id}
            className={`absolute inset-0 transition-all duration-[1s] ease-in-out ${
              selectedId === item.id ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
            }`}
          >
            {/* Backdrop Image */}
            <img src={item.image} className="w-full h-full object-cover opacity-40 transition-transform duration-[8s] group-hover:scale-110" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent"></div>
            
            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-center px-4 sm:px-8 md:px-20 pb-12 sm:pb-20">
              <div className={`max-w-2xl transition-all duration-700 delay-200 ${
                selectedId === item.id ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
              }`}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/20 backdrop-blur-xl rounded-lg text-primary font-black text-[9px] uppercase tracking-[0.3em] mb-4 sm:mb-6 border border-primary/30">
                  <span className="material-symbols-outlined text-sm">stars</span>
                  Tiêu biểu
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 leading-[1.1] tracking-tighter line-clamp-3">
                  {item.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center text-white border border-white/10">
                      <span className="material-symbols-outlined text-lg sm:text-xl">person</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Sinh viên</span>
                      <span className="text-[10px] sm:text-xs font-bold text-white/90">{item.student}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center text-white border border-white/10">
                      <span className="material-symbols-outlined text-lg sm:text-xl">school</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Hướng dẫn</span>
                      <span className="text-[10px] sm:text-xs font-bold text-white/90">{item.advisor}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => navigate(`/theses/${item.id}`, { state: item })}
                    className="px-6 sm:px-8 py-2.5 sm:py-3.5 bg-primary text-on-primary rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-primary transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                  >
                    XEM CHI TIẾT
                    <span className="material-symbols-outlined text-base">arrow_right_alt</span>
                  </button>
                  <button className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-all">
                    <span className="material-symbols-outlined text-base sm:text-lg">bookmark_remove</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Compact Thumbnail Navigation */}
        <div className="absolute bottom-10 right-8 md:right-20 z-30 hidden sm:flex items-end gap-3">
           {favoriteItems.map((item, idx) => (
             <button 
               key={item.id}
               onClick={() => setSelectedId(item.id)}
               className={`relative transition-all duration-500 ease-out ${
                 selectedId === item.id 
                 ? 'w-[140px] h-[80px] ring-2 ring-primary ring-offset-2 ring-offset-[#0a0a0a]' 
                 : 'w-[100px] h-[60px] opacity-30 hover:opacity-100'
               } rounded-xl overflow-hidden shadow-xl`}
             >
               <img src={item.image} className="w-full h-full object-cover" alt="" />
               <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>
               <div className="absolute bottom-2 left-2 right-2 text-left">
                  <p className="text-[8px] font-bold text-white truncate uppercase tracking-tight">{item.title}</p>
               </div>
             </button>
           ))}
        </div>

        {/* Minimal Progress Indicator */}
        <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
           {favoriteItems.map(item => (
             <div 
               key={item.id}
               className={`w-0.5 transition-all duration-500 rounded-full ${selectedId === item.id ? 'h-6 sm:h-8 bg-primary' : 'h-1.5 sm:h-2 bg-white/10'}`}
             />
           ))}
        </div>
      </section>

      {/* Grid Content Section */}
      <section className="pt-6 sm:pt-10 px-0 max-w-[1300px] mx-auto w-full">
        <div className="flex items-center gap-4 mb-8 sm:mb-12 animate-fade-in">
          <div className="w-1.5 h-8 bg-primary rounded-full"></div>
          <h2 className="text-xl sm:text-3xl font-black text-on-surface tracking-tight uppercase">Tất cả yêu thích</h2>
          <span className="px-3 py-1 bg-surface-container-high rounded-lg text-[10px] font-black text-on-surface-variant">{favoriteItems.length}</span>
        </div>

        <div className="flex flex-col gap-6">
          {favoriteItems.map((item, idx) => (
            <div 
              key={item.id} 
              className="bg-white rounded-[2rem] border border-outline-variant group hover:shadow-[0_20px_60px_rgba(0,0,0,0.05)] transition-all duration-500 cursor-pointer flex flex-col sm:flex-row relative overflow-hidden animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Card Ribbon */}
              <div className="absolute top-0 right-6 w-8 h-12 bg-primary flex items-center justify-center rounded-b-lg shadow-lg z-10 group-hover:h-14 transition-all">
                <span className="material-symbols-outlined text-on-primary text-base">bookmark</span>
              </div>

              {/* Card Image */}
              <div className="w-full sm:w-[280px] h-48 sm:h-auto shrink-0 overflow-hidden relative">
                <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" src={item.image} alt={item.title} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10"></div>
              </div>

              {/* Card Content */}
              <div className="p-5 sm:p-6 md:p-8 flex-1 flex flex-col justify-center">
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2">Niên khóa {item.year}</span>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-on-surface mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors tracking-tight">
                  {item.title}
                </h3>
                
                <div className="flex flex-wrap items-center gap-6 mb-6 text-[12px] font-bold text-on-surface-variant/70">
                   <div className="flex items-center gap-2">
                     <span className="material-symbols-outlined text-lg">person</span>
                     {item.student}
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="material-symbols-outlined text-lg">stars</span>
                     {item.stats.rating}
                   </div>
                </div>

                <div className="mt-auto pt-5 flex items-center justify-between border-t border-outline-variant/30">
                  <button 
                    onClick={() => navigate(`/theses/${item.id}`, { state: item })}
                    className="text-[10px] font-black text-on-surface uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all"
                  >
                    Xem bài viết <span className="material-symbols-outlined text-base">east</span>
                  </button>
                  <button title="Gỡ bỏ" className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-all">
                    <span className="material-symbols-outlined">delete_sweep</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {favoriteItems.length === 0 && (
          <div className="py-32 text-center animate-fade-in">
            <span className="material-symbols-outlined text-7xl text-on-surface-variant/20 mb-6">bookmark_add</span>
            <h3 className="text-xl font-black text-on-surface mb-2">Chưa có sáng kiến yêu thích</h3>
            <p className="text-on-surface-variant font-medium">Hãy nhấn biểu tượng lưu khi tra cứu để đưa các đề tài vào danh sách này.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default FavoritesPage;
