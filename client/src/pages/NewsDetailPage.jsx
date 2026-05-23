import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const NewsDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data for demonstration
  const newsDetail = {
    title: "Công bố danh sách các sáng kiến tiêu biểu học kỳ 1 năm 2024",
    date: "20/10/2024",
    author: "Phòng Quản lý Khoa học",
    category: "Tin mới",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVaKckFBO6OahgQhL5POM9HkyyecIPbbQpO1dWLvQHUSBcj49wyeR69ByLr8G1HshrXjAzidE5A-wOT6RA7V7eLvC33ch_y8-bNDvNRg1HwmmnaJTAcz8NBYG9tH7A-4q9Aydwy8_z9zEL6dgejrSFafcXOHrBluNSxzC-1l68EVFbA93qGEExIzjN4r7IEyBbD-vnEDCAtJDWdRszsVJdArxh12IA2eUzDBOvizUG5zZuFjD1jL69T8qDOK5VDX_pqXpNUf76mRsk",
    content: `
      <p className="mb-6">Hội đồng chuyên môn UEF vừa chính thức công bố danh sách 10 sáng kiến xuất sắc nhất trong học kỳ 1 năm 2024. Đây là những công trình nghiên cứu mang tính đột phá, có khả năng ứng dụng cao vào thực tiễn quản lý và giảng dạy tại trường.</p>
      <h3 className="text-2xl font-black text-on-surface mb-4">Tiêu chí lựa chọn</h3>
      <p className="mb-6">Các đề tài được đánh giá dựa trên 3 trụ cột chính: Tính mới (Novelty), Khả thi (Feasibility) và Tác động xã hội (Impact). Thuật toán AI Gemini cũng đã hỗ trợ hội đồng trong việc trích xuất các ý tưởng cốt lõi và kiểm tra tính nguyên bản của từng bài viết thông qua mô hình BM25.</p>
      <h3 className="text-2xl font-black text-on-surface mb-4">Các đề tài nổi bật</h3>
      <ul className="list-disc pl-6 mb-6 space-y-2">
        <li>Ứng dụng Blockchain trong quản lý văn bằng chứng chỉ.</li>
        <li>Hệ thống gợi ý học tập cá nhân hóa cho sinh viên khối ngành kinh tế.</li>
        <li>Giải pháp giảm thiểu rác thải nhựa trong khuôn viên đại học.</li>
      </ul>
      <p className="mb-6 font-medium">Nhà trường sẽ tổ chức buổi lễ vinh danh và trao giải cho các nhóm tác giả vào cuối tháng này tại Hội trường Liberty. Mời các bạn sinh viên và giảng viên cùng tham dự để giao lưu và học hỏi kinh nghiệm nghiên cứu.</p>
    `
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
        <div className="mb-16 p-8 bg-surface-container rounded-[2rem] border border-outline-variant flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                 <span className="material-symbols-outlined">link</span>
              </div>
              <div>
                <h4 className="text-sm font-black text-on-surface">Tham khảo bài viết gốc</h4>
                <p className="text-[10px] text-on-surface-variant font-medium">Xem chi tiết tại website chính thức của UEF.</p>
              </div>
           </div>
           <a href="https://uef.edu.vn" target="_blank" rel="noreferrer" className="px-8 py-3 bg-white text-primary rounded-xl font-black text-[10px] uppercase tracking-widest border border-outline-variant hover:bg-primary hover:text-on-primary transition-all">Truy cập ngay</a>
        </div>

        {/* Google Form Registration Section */}
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
                   Vui lòng điền thông tin vào biểu mẫu Google Form chính thức để chúng tôi có thể sắp xếp chỗ ngồi và tài liệu cho bạn tốt nhất.
                </p>
              </div>
              <a 
                href="https://forms.gle" 
                target="_blank" 
                rel="noreferrer" 
                className="shrink-0 px-12 py-5 bg-white text-primary rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                Mở Google Form
                <span className="material-symbols-outlined text-lg">open_in_new</span>
              </a>
           </div>
        </div>

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
