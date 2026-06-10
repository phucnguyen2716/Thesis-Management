import React from 'react';
import { useNavigate } from 'react-router-dom';

const GuidelinesPage = () => {
  const navigate = useNavigate();

  const steps = [
    {
      step: "01",
      title: "Khởi động hành trình",
      desc: "Truy cập vào kho tri thức thông qua mục 'Tra cứu' trên thanh điều hướng hoặc nút 'Khám phá' tại trang chủ.",
      icon: "explore",
      color: "from-[#4F46E5] to-[#7C3AED]",
      shadow: "shadow-indigo-200"
    },
    {
      step: "02",
      title: "Định vị mục tiêu",
      desc: "Sử dụng các từ khóa chuyên ngành, tên sinh viên hoặc giảng viên để thu hẹp phạm vi tìm kiếm của bạn.",
      icon: "ads_click",
      color: "from-[#059669] to-[#10B981]",
      shadow: "shadow-emerald-200"
    },
    {
      step: "03",
      title: "Lọc thông tin thông minh",
      desc: "Tận dụng bộ lọc Khoa và Chuyên ngành để tìm thấy những đề tài sát thực nhất với nhu cầu nghiên cứu.",
      icon: "tune",
      color: "from-[#EA580C] to-[#F97316]",
      shadow: "shadow-orange-200"
    },
    {
      step: "04",
      title: "Khai phá tài liệu",
      desc: "Mở toàn văn sáng kiến hoặc tải các tài liệu đính kèm để nghiên cứu chuyên sâu về phương pháp và kết quả.",
      icon: "menu_book",
      color: "from-[#0284C7] to-[#0EA5E9]",
      shadow: "shadow-sky-200"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center animate-in fade-in duration-700">
      {/* Enhanced Modern Hero Header */}
      <section className="w-full relative py-16 md:py-24 px-4 sm:px-8 md:px-16 overflow-hidden bg-black rounded-b-[1.5rem] md:rounded-b-[3rem] mb-8 md:mb-12 shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
            alt="UEF Background"
            className="w-full h-full object-cover opacity-60"
          />
          {/* Simple dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent pointer-events-none"></div>

          {/* Decorative Glowing Orbs */}
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-white/15 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-[-30%] right-[-10%] w-[400px] h-[400px] bg-black/30 rounded-full blur-[100px] pointer-events-none"></div>
        </div>

        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 relative z-10 text-white">
          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-xl rounded-full border border-white/15 mb-4 md:mb-6 shadow-lg shadow-black/10 transition-all hover:scale-105 hover:border-amber-400/30 hover:shadow-amber-500/5 group/badge cursor-default">
              <span className="material-symbols-outlined text-[16px] bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent group-hover/badge:animate-pulse">school</span>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-100/90 group-hover/badge:text-white transition-colors">Cẩm nang học thuật</span>
            </div>
            <h1 className="text-3xl md:text-6xl font-black leading-tight tracking-tighter drop-shadow-xl mb-4 md:mb-6">
              Làm chủ hệ thống <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                Tra cứu Sáng kiến
              </span>
            </h1>
            <p className="text-sm md:text-lg text-white/90 max-w-lg font-medium leading-relaxed drop-shadow mx-auto md:mx-0">
              Quy trình tra cứu tối ưu giúp bạn tiếp cận kho tàng nghiên cứu của UEF một cách nhanh chóng và chính xác.
            </p>
          </div>

          {/* Decorative 3D-like Icon Block */}
          <div className="hidden md:flex relative shrink-0 w-56 h-56 bg-gradient-to-br from-white/15 via-white/5 to-transparent backdrop-blur-2xl rounded-[3.5rem] border border-white/20 hover:border-amber-400/40 items-center justify-center shadow-[0_25px_60px_rgba(0,0,0,0.45)] hover:shadow-[0_25px_60px_rgba(245,158,11,0.25)] rotate-3 hover:-rotate-3 hover:scale-105 transition-all duration-500 group cursor-default">
            {/* Glowing Backdrop Orb */}
            <div className="absolute w-36 h-36 bg-gradient-to-tr from-amber-500/25 to-yellow-500/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
            
            {/* Glass Inner Ring */}
            <div className="absolute inset-4 rounded-[2.8rem] border border-white/5 pointer-events-none group-hover:border-white/10 transition-colors" />

            {/* Glowing Sparkle */}
            <span className="absolute top-5 right-5 material-symbols-outlined text-amber-300 text-lg opacity-40 group-hover:opacity-100 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 pointer-events-none">
              auto_awesome
            </span>

            {/* Main Premium Icon */}
            <span className="material-symbols-outlined text-[112px] bg-gradient-to-br from-white via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_8px_24px_rgba(245,158,11,0.35)] group-hover:scale-105 transition-all duration-500 select-none">
              local_library
            </span>
          </div>
        </div>
      </section>

      {/* Modern Journey Section - Fixed & Aligned */}
      <section className="max-w-[900px] w-full px-4 sm:px-8 py-10 md:py-20 relative">
        <div className="space-y-8 md:space-y-12">
          {steps.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4 sm:gap-8 md:gap-16 group">
              {/* Visual Part - Left Aligned for better focus */}
              <div className="shrink-0 relative">
                {/* Connecting line between steps */}
                {idx !== steps.length - 1 && (
                  <div className="absolute top-14 sm:top-20 bottom-[-32px] sm:bottom-[-48px] left-1/2 w-[2px] bg-outline-variant/30 -translate-x-1/2"></div>
                )}

                <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-white to-[#F1F5F9] shadow-xl border border-outline-variant/50 flex items-center justify-center relative transition-all duration-500 group-hover:shadow-2xl">
                  <div className={`absolute inset-1.5 rounded-[1rem] sm:rounded-[1.6rem] bg-gradient-to-br ${item.color} opacity-90 shadow-inner`}></div>
                  <div className="relative z-10 scale-[1.2] sm:scale-[1.8] md:scale-[2.5] transition-transform duration-500 group-hover:scale-[2.8] flex items-center justify-center">
                    <span className="material-symbols-outlined text-white drop-shadow-md leading-none select-none">{item.icon}</span>
                  </div>

                  {/* Step Number Badge */}
                  <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-white text-on-surface rounded-lg sm:rounded-xl flex items-center justify-center text-[8px] sm:text-[10px] font-black shadow-lg border border-outline-variant">
                    {item.step}
                  </div>
                </div>
              </div>

              {/* Text Part - Clean & Aligned */}
              <div className="flex-1 pt-1 sm:pt-2 md:pt-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className={`w-4 sm:w-6 h-1 rounded-full bg-gradient-to-r ${item.color}`}></div>
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">Giai đoạn {item.step}</span>
                </div>
                <h3 className="text-base sm:text-xl md:text-2xl font-black text-on-surface mb-2 tracking-tight group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-xs sm:text-[13px] md:text-sm text-on-surface-variant font-medium leading-relaxed sm:leading-loose opacity-70 max-w-2xl">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Minimalist Search Tips */}
      <section className="w-full max-w-[1000px] px-4 sm:px-8 py-12 md:py-20 border-t border-outline-variant/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Toán tử thông minh", icon: "terminal", desc: "Sử dụng ngoặc kép \" \" cho kết quả chính xác tuyệt đối." },
            { title: "Bộ lọc chuyên sâu", icon: "filter_alt", desc: "Giới hạn theo Khoa quản lý để tìm kiếm đúng trọng tâm." },
            { title: "Khai phá tóm tắt", icon: "find_in_page", desc: "Đọc kỹ phần tóm tắt trước khi quyết định tải tài liệu." }
          ].map((tip, idx) => (
            <div key={idx} className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-outline-variant/50 hover:border-primary/20 hover:shadow-xl transition-all">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-4 sm:mb-5">
                <span className="material-symbols-outlined text-xl">{tip.icon}</span>
              </div>
              <h4 className="text-sm font-black mb-2">{tip.title}</h4>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed opacity-70">{tip.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ & CTA Compact */}
      <section className="max-w-[1000px] w-full px-4 sm:px-8 pb-20 md:pb-32">
        <div className="bg-white border border-outline-variant/50 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3rem] p-5 sm:p-10 md:p-14 mb-8 md:mb-12 shadow-sm">
          <h3 className="text-xl sm:text-2xl font-black text-center mb-6 sm:mb-10">Giải đáp nhanh</h3>
          <div className="space-y-4 md:space-y-6">
            {[
              {
                q: "Làm thế nào để tìm được các nghiên cứu có độ tin cậy cao nhất?",
                a: "Tất cả các nghiên cứu xuất hiện trên hệ thống đều đã qua vòng sơ khảo. Tuy nhiên, để tìm các bài đạt giải cao hoặc được đánh giá xuất sắc, bạn có thể lọc theo 'Năm học' gần nhất hoặc tìm kiếm các đề tài có sự tham gia hướng dẫn của các Chuyên gia đầu ngành trong bộ lọc Giảng viên."
              },
              {
                q: "Tôi có thể liên hệ với tác giả của sáng kiến để trao đổi thêm không?",
                a: "Hệ thống khuyến khích sự kết nối học thuật. Thông tin tác giả và email UEF thường được đính kèm trong phần 'Tài liệu' hoặc trang chi tiết sáng kiến. Bạn có thể gửi email trao đổi chuyên môn, tuy nhiên hãy đảm bảo tuân thủ các quy tắc lịch sự và tôn trọng bản quyền tác giả."
              },
              {
                q: "Làm sao để biết một sáng kiến đã được hội đồng chuyên môn phê duyệt?",
                a: "Mỗi sáng kiến được hiển thị công khai trên kho dữ liệu 'Academic Repository Search' đều đã trải qua quy trình kiểm định nghiêm ngặt từ Hội đồng Khoa học UEF. Các đề tài đang trong quá trình chấm điểm hoặc chưa được phê duyệt sẽ chỉ nằm trong danh mục cá nhân và không xuất hiện khi bạn tra cứu chung."
              }
            ].map((faq, idx) => (
              <div key={idx} className="group">
                <details className="overflow-hidden transition-all duration-500 border-b border-outline-variant/30 group-last:border-none">
                  <summary className="font-bold text-sm sm:text-base cursor-pointer list-none flex justify-between items-center py-4 sm:py-6 group-hover:text-primary transition-all select-none">
                    {faq.q}
                    <span className="material-symbols-outlined text-xl group-open:rotate-180 transition-transform duration-300">expand_more</span>
                  </summary>
                  <div className="text-xs sm:text-sm text-on-surface-variant pb-6 sm:pb-8 leading-relaxed opacity-90 animate-in slide-in-from-top-2 fade-in duration-500">
                    {faq.a}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>

        {/* Video Tutorial Section */}
        <div className="bg-white border border-outline-variant/50 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3rem] p-5 sm:p-10 md:p-14 mb-8 md:mb-12 shadow-sm flex flex-col md:flex-row gap-6 md:gap-10 items-center">
          <div className="flex-1 space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest">
              <span className="material-symbols-outlined text-xs">play_circle</span>
              Video hướng dẫn
            </div>
            <h3 className="text-xl md:text-3xl font-black text-on-surface">Khám phá qua video trực quan</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium leading-relaxed opacity-85">
              Chưa quen với hệ thống? Hãy xem đoạn video ngắn dưới đây để nắm bắt toàn bộ các thao tác cơ bản từ tìm kiếm, lọc dữ liệu cho đến tải tài liệu về máy.
            </p>
          </div>
          <div className="flex-1 w-full relative group cursor-pointer">
            <div className="aspect-video bg-surface-container-highest rounded-[1rem] sm:rounded-[2rem] overflow-hidden border border-outline-variant shadow-lg relative">
              <img 
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Video Thumbnail" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 sm:w-16 h-16 bg-white/90 backdrop-blur-md text-primary rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl ml-1">play_arrow</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-primary px-6 sm:px-8 py-8 sm:py-10 rounded-[1.5rem] sm:rounded-[2.5rem] text-center text-on-primary relative overflow-hidden group shadow-2xl shadow-primary/20">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <h2 className="text-lg md:text-2xl font-black mb-1">Bạn đã nắm vững quy trình?</h2>
              <p className="text-[10px] opacity-70 font-medium tracking-wide">Bắt đầu khám phá kho tri thức ngay bây giờ.</p>
            </div>
            <button
              onClick={() => navigate('/lookup')}
              className="shrink-0 px-6 py-3 bg-white text-primary rounded-xl font-black uppercase tracking-widest text-[9px] hover:scale-105 active:scale-95 transition-all"
            >
              Bắt đầu Tra cứu
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GuidelinesPage;
