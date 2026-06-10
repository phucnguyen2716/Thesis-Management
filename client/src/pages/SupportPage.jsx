import React from 'react';

const SupportPage = () => {
  const faqs = [
    {
      q: "Làm thế nào để đăng ký một sáng kiến mới?",
      a: "Bạn có thể đăng ký thông qua cổng Portal vào đầu mỗi học kỳ. Vui lòng theo dõi thông báo tại trang chủ hoặc liên hệ thư ký khoa để nhận biểu mẫu."
    },
    {
      q: "Thời hạn nộp báo cáo kết quả sáng kiến là khi nào?",
      a: "Thông thường, báo cáo cần được nộp trước ít nhất 2 tuần tính đến ngày bảo vệ trước hội đồng khoa học."
    },
    {
      q: "Tôi có thể thay đổi giảng viên hướng dẫn sau khi đã đăng ký không?",
      a: "Có, nhưng bạn cần nộp đơn xin thay đổi có chữ ký xác nhận của cả giảng viên cũ và giảng viên mới gửi về Phòng Quản lý Khoa học."
    }
  ];

  return (
    <div className="min-h-screen bg-surface-bright pb-20 animate-fade-in">
      {/* Support Hero Section */}
      <section className="pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-8 md:px-16 lg:px-24 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        ></div>
        <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]"></div>
        <div className="max-w-[1440px] mx-auto relative z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white font-black text-[10px] uppercase tracking-widest mb-6 md:mb-8 border border-white/10 backdrop-blur-md">
            <span className="material-symbols-outlined text-sm">support_agent</span>
            Trung tâm hỗ trợ UEF
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white mb-4 md:mb-6 tracking-tighter leading-none drop-shadow-lg">
            Chúng tôi có thể <br /><span className="opacity-80 text-white/80">giúp gì cho bạn?</span>
          </h1>
          <p className="text-white/80 font-medium max-w-xl leading-relaxed text-sm sm:text-lg italic drop-shadow-md">
            Phòng Quản lý Khoa học luôn sẵn sàng đồng hành cùng các bạn sinh viên trong hành trình nghiên cứu và sáng tạo.
          </p>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 -mt-16 md:-mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Contact Card: Phone */}
          <div className="bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border border-outline-variant shadow-xl hover:translate-y-[-5px] transition-all group text-center">
            <div className="w-12 h-12 sm:w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 sm:mb-6 group-hover:bg-primary group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-2xl sm:text-3xl">call</span>
            </div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-on-surface mb-2">Điện thoại</h3>
            <p className="text-xs sm:text-sm font-bold text-on-surface-variant mb-1">(028) 5422 6666</p>
            <p className="text-[10px] sm:text-xs text-on-surface-variant/60 font-medium italic">Máy lẻ: 222</p>
          </div>

          {/* Contact Card: Email */}
          <div className="bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border border-outline-variant shadow-xl hover:translate-y-[-5px] transition-all group text-center">
            <div className="w-12 h-12 sm:w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4 sm:mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-2xl sm:text-3xl">mail</span>
            </div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-on-surface mb-2">Email</h3>
            <p className="text-xs sm:text-sm font-bold text-on-surface-variant mb-1">qlkh@uef.edu.vn</p>
            <p className="text-[10px] sm:text-xs text-on-surface-variant/60 font-medium italic">Phản hồi trong 24h</p>
          </div>

          {/* Contact Card: Office */}
          <div className="bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border border-outline-variant shadow-xl hover:translate-y-[-5px] transition-all group text-center">
            <div className="w-12 h-12 sm:w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-4 sm:mb-6 group-hover:bg-green-600 group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-2xl sm:text-3xl">location_on</span>
            </div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-on-surface mb-2">Văn phòng</h3>
            <p className="text-xs sm:text-sm font-bold text-on-surface-variant mb-1">Trung tâm hỗ trợ học vụ</p>
            <p className="text-[10px] sm:text-xs text-on-surface-variant/60 font-medium italic">Tầng 4, Trụ sở chính</p>
          </div>
        </div>

        <div className="mt-12 md:mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* FAQ Section */}
          <div>
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="w-1.5 h-6 md:h-8 bg-primary rounded-full"></div>
              <h2 className="text-xl sm:text-3xl font-black text-on-surface tracking-tight uppercase">Câu hỏi thường gặp</h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-outline-variant hover:border-primary/20 transition-all group">
                  <h4 className="text-sm sm:text-base font-black text-on-surface mb-2 sm:mb-3 flex items-start gap-3 sm:gap-4">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 text-primary rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 text-[10px] sm:text-xs mt-0.5 font-bold">Q</span>
                    {faq.q}
                  </h4>
                  <p className="text-xs sm:text-sm text-on-surface-variant/80 leading-relaxed font-medium pl-10 sm:pl-12">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Support Form Section */}
          <div className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-outline-variant shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="w-1.5 h-6 md:h-8 bg-primary rounded-full"></div>
              <h2 className="text-xl sm:text-3xl font-black text-on-surface tracking-tight uppercase">Gửi yêu cầu</h2>
            </div>
            <form className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 ml-1">Họ và tên</label>
                  <input type="text" placeholder="Nguyễn Văn A" className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-surface-container-low rounded-xl sm:rounded-2xl outline-none border border-transparent focus:border-primary/20 focus:bg-white transition-all font-bold text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 ml-1">Mã số sinh viên</label>
                  <input type="text" placeholder="2150xxxxx" className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-surface-container-low rounded-xl sm:rounded-2xl outline-none border border-transparent focus:border-primary/20 focus:bg-white transition-all font-bold text-xs" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 ml-1">Chủ đề cần hỗ trợ</label>
                <select className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-surface-container-low rounded-xl sm:rounded-2xl outline-none border border-transparent focus:border-primary/20 focus:bg-white transition-all font-bold text-xs appearance-none">
                  <option>Đăng ký sáng kiến mới</option>
                  <option>Thay đổi giảng viên hướng dẫn</option>
                  <option>Gia hạn thời gian thực hiện</option>
                  <option>Vấn đề khác</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 ml-1">Nội dung chi tiết</label>
                <textarea rows="4" placeholder="Nhập thắc mắc của bạn tại đây..." className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-surface-container-low rounded-xl sm:rounded-2xl outline-none border border-transparent focus:border-primary/20 focus:bg-white transition-all font-bold text-xs resize-none"></textarea>
              </div>
              <button className="w-full py-4 sm:py-5 bg-primary text-on-primary rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-on-surface transition-all active:scale-95">
                GỬI YÊU CẦU NGAY
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 md:mt-24 animate-fade-in pb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-8 md:mb-10">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-1.5 h-6 md:h-8 bg-primary rounded-full"></div>
              <h2 className="text-xl sm:text-3xl font-black text-on-surface tracking-tight uppercase">Vị trí & Chỉ đường</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
            {/* Left Column (Wider): Real Building Image with Merged Info Card */}
            <div className="lg:col-span-3 relative group rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden h-[380px] border border-outline-variant">
              {/* Real Building Image */}
              <img
                src="/uef_real.jpg"
                className="w-full h-full object-cover object-[80%_center] group-hover:scale-105 transition-transform duration-[20s] ease-out"
                alt="UEF Building Real"
              />

              {/* Gradient Overlay for Info Card Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-transparent xl:bg-gradient-to-r xl:from-white/95 xl:via-white/70 xl:to-transparent pointer-events-none"></div>

              {/* Floating Info Card: Small Square Overlay */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 w-[180px] sm:w-[220px]">
                <div className="bg-white/80 backdrop-blur-xl p-4 sm:p-5 rounded-[1rem] sm:rounded-[1.5rem] border border-white/40 shadow-2xl">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <span className="w-1 h-3 bg-primary rounded-full"></span>
                    <span className="text-[8px] font-black text-primary uppercase tracking-widest">Thông tin</span>
                  </div>

                  <h3 className="text-[10px] sm:text-[11px] font-black text-on-surface mb-2 sm:mb-3 leading-tight">
                    Tầng 4 <br />
                    <span className="text-primary">Trụ sở chính UEF</span>
                  </h3>

                  <div className="space-y-2 border-t border-on-surface/5 pt-2 sm:pt-3">
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <span className="material-symbols-outlined text-primary text-[12px] sm:text-[14px]">location_on</span>
                      <p className="text-[8px] sm:text-[9px] font-bold text-on-surface-variant/90 leading-tight">141 Điện Biên Phủ, P. 15, Q. Bình Thạnh</p>
                    </div>
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <span className="material-symbols-outlined text-primary text-[12px] sm:text-[14px]">schedule</span>
                      <div className="text-[8px] sm:text-[9px] font-bold text-on-surface-variant/90 leading-tight">
                        <p>T2-6: 07:30-16:30</p>
                        <p>T7: 07:30-11:30</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Targeted Marker: Office A.02.05 on the Right Building */}
              <div className="absolute top-[8%] right-[10%] xl:right-[26%] z-20 group/marker">
                <div className="relative">
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full border-4 border-white shadow-[0_0_15px_rgba(0,0,0,0.2)] flex items-center justify-center cursor-pointer hover:scale-110 transition-all">
                    <span className="material-symbols-outlined text-white text-base sm:text-lg">location_on</span>
                  </div>

                  {/* Interactive Popup */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/marker:opacity-100 transition-all duration-300 translate-y-2 group-hover/marker:translate-y-0 pointer-events-none">
                    <div className="bg-white p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] shadow-2xl border border-outline-variant min-w-[200px] sm:min-w-[240px]">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center text-white shrink-0">
                          <span className="material-symbols-outlined text-base sm:text-[20px]">meeting_room</span>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-black text-on-surface leading-none mb-1">A.02.05</p>
                          <p className="text-[7px] sm:text-[8px] font-bold text-on-surface-variant opacity-80 uppercase tracking-wider">PHÒNG QUẢN LÝ KHOA HỌC</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-white rotate-45 mx-auto -mt-1.5 border-r border-b border-outline-variant"></div>
                  </div>
                </div>
              </div>

              {/* Entrance Indicator Arrow */}
              <div className="absolute bottom-[5%] left-[55%] z-20 flex flex-col items-center group/entrance animate-bounce cursor-pointer">
                <div className="bg-primary text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 border-white shadow-xl shadow-primary/40 group-hover:bg-on-surface transition-colors">
                  <span className="material-symbols-outlined text-xs sm:text-sm">arrow_downward</span>
                </div>
                <div className="mt-1 bg-white/90 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-primary/20 shadow-lg">
                  <p className="text-[7px] sm:text-[8px] font-black text-primary uppercase tracking-[0.2em] whitespace-nowrap">Lối vào chính</p>
                </div>
              </div>
            </div>

            {/* Right Column: Google Maps Navigation */}
            <div className="lg:col-span-2 bg-white p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3.5rem] border border-outline-variant shadow-xl overflow-hidden h-[380px] group relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.180467498935!2d106.70105507441968!3d10.797486089352542!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f315d625c89%3A0x73084dd08a9fe5a4!2zxJDhuqFpIEjhu41jIEtpbmggVOG6vyBUw6BpIENow61uaCBUTPCUAkhDTSAoFVFRikgQ1MgMTQx!5e0!3m2!1svi!2s!4v1778859727178!5m2!1svi!2s"
                className="w-full h-full rounded-[1rem] sm:rounded-[2.5rem] border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
