import React from 'react';

const AnalysisPage = () => {
  const steps = [
    {
      step: '01',
      title: 'Số hóa & Trích xuất thực thể',
      desc: 'Hệ thống sử dụng Gemini Pro để "đọc hiểu" toàn bộ văn bản. Không chỉ dừng lại ở việc nhận diện từ ngữ, AI còn phân tích ngữ nghĩa (semantic) để trích xuất các thực thể quan trọng như: Phương pháp nghiên cứu, Đối tượng khảo sát và Kết quả kỳ vọng.',
      icon: 'psychology_alt',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      step: '02',
      title: 'Xử lý Tệp & Đối soát BM25',
      desc: 'Khi tệp (PDF/Word) được tải lên, thuật toán BM25 sẽ "băm" nội dung thành các vector dữ liệu chuyên biệt. Nó thực hiện đối soát chéo đồng thời với hàng ngàn đồ án trong kho lưu trữ để phân tích rõ các đoạn văn có khả năng bị sao chép, chỉ ra chính xác nguồn gốc và mức độ trùng lặp dựa trên trọng số từ khóa đặc trưng.',
      icon: 'plagiarism',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      step: '03',
      title: 'Kiểm tra chéo đa chiều',
      desc: 'Hệ thống so sánh đề tài với kho dữ liệu đồ án UEF qua nhiều năm. Quá trình này kiểm tra sự trùng lặp không chỉ ở tên đề tài mà còn ở cấu trúc chương hồi, giả thuyết khoa học và tập dữ liệu mẫu để đảm bảo không có sự sao chép ý tưởng tinh vi.',
      icon: 'account_tree',
      color: 'bg-amber-50 text-amber-600'
    },
    {
      step: '04',
      title: 'Đánh giá tính mới & Đề xuất',
      desc: 'Dựa trên tổng điểm từ BM25 và phân tích của Gemini, hệ thống xuất báo cáo chi tiết về tính duy nhất. Nếu phát hiện trùng lặp cao, AI sẽ gợi ý các hướng phát triển mới hoặc các biến số khác để sinh viên có thể điều chỉnh đề tài theo hướng sáng tạo hơn.',
      icon: 'auto_awesome_motion',
      color: 'bg-green-50 text-green-600'
    }
  ];

  return (
    <div className="p-4 sm:p-8 md:p-12 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 md:mb-16">
        <div className="flex items-center gap-3 md:gap-4 mb-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-2xl md:text-3xl font-bold">query_stats</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight leading-tight">Cơ chế kiểm định Sáng kiến</h1>
        </div>
        <p className="text-xs md:text-sm text-on-surface-variant font-medium max-w-3xl leading-relaxed opacity-85">
          Hệ thống kết hợp sức mạnh của <span className="text-primary font-black uppercase">Trí tuệ nhân tạo tạo sinh (Generative AI)</span> và <span className="text-primary font-black uppercase">Thuật toán xếp hạng văn bản BM25</span> để đảm bảo mọi đồ án của sinh viên UEF đều mang giá trị nghiên cứu thực thụ và không bị trùng lặp.
        </p>
      </div>

      {/* Detailed Process Section */}
      <div className="space-y-6 md:space-y-8 mb-12 md:mb-20">
        {steps.map((s, i) => (
          <div key={i} className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-outline-variant shadow-sm hover:shadow-2xl transition-all group flex flex-col md:flex-row items-start gap-5 sm:gap-8">
            <div className={`w-14 h-14 sm:w-20 sm:h-20 shrink-0 ${s.color} rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
              <span className="material-symbols-outlined text-2xl sm:text-4xl font-bold">{s.icon}</span>
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <span className="text-primary font-black text-xs sm:text-sm tracking-widest">BƯỚC {s.step}</span>
                <div className="h-px flex-1 bg-gray-100"></div>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-on-surface mb-3 sm:mb-4 tracking-tight">{s.title}</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant font-medium leading-relaxed sm:leading-loose opacity-85">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Deep Dive BM25 Section */}
      <div className="mb-12 md:mb-20">
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10">
           <div className="w-1.5 h-6 md:h-8 bg-primary rounded-full"></div>
           <h2 className="text-xl md:text-2xl font-black tracking-tight">Phân tích chuyên sâu Thuật toán BM25</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
           <div className="bg-white p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3rem] border border-outline-variant hover:border-primary/20 transition-all">
              <div className="text-primary font-black text-3xl md:text-4xl mb-4 md:mb-6 opacity-20">01</div>
              <h4 className="text-base md:text-lg font-black mb-3 md:mb-4">TF (Term Frequency)</h4>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed opacity-75">
                Hệ thống tính toán tần suất xuất hiện của các từ khóa chuyên ngành trong tệp đồ án. Tuy nhiên, BM25 áp dụng cơ chế "bão hòa" để ngăn chặn việc lặp lại từ khóa ảo làm tăng điểm số một cách không công bằng.
              </p>
           </div>
           
           <div className="bg-white p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3rem] border border-outline-variant hover:border-primary/20 transition-all">
              <div className="text-primary font-black text-3xl md:text-4xl mb-4 md:mb-6 opacity-20">02</div>
              <h4 className="text-base md:text-lg font-black mb-3 md:mb-4">IDF (Inverse Doc Frequency)</h4>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed opacity-75">
                Đây là "trái tim" của việc phát hiện đạo văn. Những từ phổ biến (Stop-words) sẽ bị hạ trọng số, trong khi các thuật ngữ nghiên cứu đặc thù sẽ được đẩy trọng số cao để nhận diện chính xác các nguồn copy từ các đồ án cùng chuyên ngành.
              </p>
           </div>

           <div className="bg-white p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3rem] border border-outline-variant hover:border-primary/20 transition-all">
              <div className="text-primary font-black text-3xl md:text-4xl mb-4 md:mb-6 opacity-20">03</div>
              <h4 className="text-base md:text-lg font-black mb-3 md:mb-4">Length Normalization</h4>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed opacity-75">
                BM25 tự động điều chỉnh điểm số dựa trên độ dài của đồ án. Một đồ án dài 200 trang và một đồ án 50 trang sẽ được so khớp trên cùng một mặt bằng định lượng, đảm bảo tính khách quan tuyệt đối khi đánh giá sự trùng lặp.
              </p>
           </div>
        </div>

        <div className="mt-6 md:mt-8 bg-surface-container-lowest p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3rem] border border-outline-variant flex flex-col lg:flex-row items-center gap-6 md:gap-10">
           <div className="flex-1">
              <h4 className="text-lg md:text-xl font-black mb-3 md:mb-4">Phát hiện Đạo văn từng phân đoạn</h4>
              <p className="text-xs md:text-sm text-on-surface-variant font-medium leading-relaxed md:leading-loose opacity-75">
                Không chỉ so sánh tổng thể, BM25 còn băm nhỏ đồ án thành các "chunks" (đoạn văn). Hệ thống thực hiện truy vấn ID của từng đoạn văn trong Database khổng lồ của UEF. Nếu một đoạn văn đạt ngưỡng tương đồng cao (&gt;85%), hệ thống sẽ ngay lập tức trích xuất ID đồ án gốc, tên tác giả và năm công bố để giảng viên có thể đối chiếu trực tiếp.
              </p>
           </div>
           <div className="w-full lg:w-64 h-36 md:h-40 bg-primary/5 rounded-[1.5rem] md:rounded-[2rem] border border-primary/10 flex flex-col items-center justify-center p-6 text-center shrink-0">
              <span className="material-symbols-outlined text-3xl md:text-4xl text-primary mb-2 md:mb-3">source</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Truy xuất nguồn gốc</span>
              <span className="text-xs font-bold mt-1 text-on-surface opacity-60">Database: 50,000+ Sáng kiến</span>
           </div>
        </div>
      </div>

      {/* Technology Stack Footer */}
      <div className="bg-primary rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3rem] p-6 sm:p-10 md:p-12 text-on-primary shadow-2xl relative overflow-hidden group">
         <span className="material-symbols-outlined absolute -right-10 -bottom-10 text-[15rem] opacity-10 rotate-12 group-hover:scale-110 transition-transform">verified</span>
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h4 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 tracking-tight">Quy trình Công nghệ tích hợp</h4>
              <p className="text-xs md:text-sm opacity-80 leading-relaxed md:leading-loose mb-6 md:mb-8 font-medium">
                Sự kết hợp giữa <b>BM25</b> cho khả năng đối soát dữ liệu cứng và <b>Gemini AI</b> cho khả năng phân tích ngữ nghĩa mềm dẻo giúp UEF sở hữu hệ thống kiểm định sáng kiến hàng đầu Việt Nam.
              </p>
              <div className="flex flex-wrap gap-2 md:gap-3">
                 {['NLP Preprocessing', 'N-Gram Similarity', 'Rule-based AI', 'Vector Indexing'].map(t => (
                   <span key={t} className="px-3 py-1.5 md:px-4 md:py-2 bg-white/10 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-white/20">{t}</span>
                 ))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 border border-white/20">
               <div className="space-y-4 md:space-y-6">
                 <div>
                   <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">
                     <span>Độ chính xác Phát hiện copy</span>
                     <span>98.5%</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                     <div className="h-full w-[98.5%] bg-white rounded-full"></div>
                   </div>
                 </div>
                 <div>
                   <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">
                     <span>Tốc độ truy xuất Database</span>
                     <span>&lt; 0.8s</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                     <div className="h-full w-[95%] bg-white rounded-full"></div>
                   </div>
                 </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
