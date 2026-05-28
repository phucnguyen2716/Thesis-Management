import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LookupPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const results = [
    {
      id: 1,
      title: "Impact of Blockchain on Supply Chain Transparency in Emerging Markets",
      student: "Tran Ngoc Bao Han",
      advisor: "Dr. Nguyen Minh Tri",
      year: "2023",
      department: "IT Department",
      similarity: "8%",
      similarityLevel: "safe",
      desc: "This thesis explores the implementation of Hyperledger Fabric in tracking agricultural products from farm to consumer in Southeast Asia. The study utilizes qualitative research methods to analyze cost-benefit...",
      tags: ["#blockchain", "#supplychain", "#transparency"]
    },
    {
      id: 2,
      title: "Economic Shifts in Post-Pandemic Retail: A Comparative Study",
      student: "Le Quoc Anh",
      advisor: "Prof. Sarah Jenkins",
      year: "2022",
      department: "Economics Dept.",
      similarity: "32%",
      similarityLevel: "high",
      desc: "Researching the transition from brick-and-mortar to omnichannel strategies in the apparel industry during 2020-2022. The paper analyzes consumer behavior changes and logistical challenges...",
      tags: ["#retail", "#economics"]
    },
    {
      id: 3,
      title: "Artificial Intelligence in Modern Portfolio Management",
      student: "Pham Minh Tu",
      advisor: "Dr. Hoang Vu",
      year: "2024",
      department: "Finance Department",
      similarity: "12%",
      similarityLevel: "safe",
      desc: "This quantitative research develops a machine learning model based on recurrent neural networks (RNN) to predict stock market volatility. Comparing the AI-driven approach with traditional models...",
      tags: ["#AI", "#fintech", "#ML"]
    }
  ];

  return (
    <div className="min-h-screen bg-surface-bright relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 py-4 md:py-6 max-w-[1400px] mx-auto animate-fade-in">
        {/* Page Header - Artistic Style */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full text-primary font-black text-[10px] uppercase tracking-widest mb-6 border border-primary/10">
            <span className="material-symbols-outlined text-sm">database</span>
            Kho lưu trữ học thuật UEF
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-on-surface mb-6 tracking-tighter leading-none">
            Tra cứu <span className="text-primary/70">Sáng kiến</span>
          </h1>
          <p className="text-on-surface-variant font-medium opacity-60 max-w-2xl mx-auto leading-relaxed">
            Khám phá hàng nghìn đề tài nghiên cứu, sáng kiến và đồ án xuất sắc từ sinh viên và giảng viên qua các thế hệ.
          </p>
        </header>

        {/* Dynamic Search Bar Section */}
        <div className="max-w-[1000px] mx-auto mb-20">
          <div className="bg-white p-3 rounded-[3rem] shadow-[0_30px_70px_rgba(0,0,0,0.08)] border border-outline-variant flex flex-col md:flex-row items-center gap-2 group transition-all hover:border-primary/30">
            <div className="flex-1 flex items-center gap-5 px-8 w-full">
              <span className="material-symbols-outlined text-primary text-2xl group-focus-within:scale-110 transition-transform">search</span>
              <input 
                type="text" 
                placeholder="Nhập tên đề tài, tác giả hoặc từ khóa để tìm kiếm..."
                className="w-full bg-transparent border-none outline-none text-base font-bold py-4 text-on-surface placeholder:text-on-surface-variant/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="w-full md:w-auto px-12 py-5 bg-on-surface text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-primary transition-all shadow-xl active:scale-95">
              TÌM KIẾM NGAY
            </button>
          </div>
          
          {/* Trending Tags */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest py-1.5 px-3">Phổ biến:</span>
            {["#Blockchain", "#AI_Gemini", "#Marketing_Số", "#Kinh_tế_xanh"].map(tag => (
              <button key={tag} className="px-4 py-1.5 bg-surface-container-low rounded-full text-[10px] font-bold text-on-surface-variant hover:text-primary transition-all border border-transparent hover:border-primary/20">{tag}</button>
            ))}
          </div>
        </div>

        {/* Horizontal Filters Section */}
        <div className="bg-white p-8 rounded-[3rem] border border-outline-variant shadow-sm mb-12 flex flex-wrap items-end gap-6 animate-fade-in delay-200">
          <div className="flex-1 min-w-[200px] flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 ml-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">account_balance</span> Khoa / Viện
            </label>
            <div className="relative">
              <select className="w-full px-6 py-3.5 bg-surface-container-lowest rounded-2xl outline-none border border-outline-variant focus:border-primary transition-all font-bold text-xs appearance-none cursor-pointer">
                <option>Tất cả các khoa</option>
                <option>Công nghệ thông tin</option>
                <option>Kinh tế - Quản trị</option>
                <option>Tài chính - Ngân hàng</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="flex-1 min-w-[200px] flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 ml-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">event</span> Năm học
            </label>
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Từ" className="w-full px-6 py-3.5 bg-surface-container-lowest rounded-2xl outline-none border border-outline-variant focus:border-primary transition-all font-bold text-xs" />
              <input type="text" placeholder="Đến" className="w-full px-6 py-3.5 bg-surface-container-lowest rounded-2xl outline-none border border-outline-variant focus:border-primary transition-all font-bold text-xs" />
            </div>
          </div>

          <div className="flex-1 min-w-[200px] flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 ml-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">school</span> Giảng viên
            </label>
            <input type="text" placeholder="Tên giảng viên..." className="w-full px-6 py-3.5 bg-surface-container-lowest rounded-2xl outline-none border border-outline-variant focus:border-primary transition-all font-bold text-xs" />
          </div>

          <button className="px-8 py-3.5 bg-on-surface text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95 whitespace-nowrap">
            LỌC KẾT QUẢ
          </button>
        </div>

        {/* Results Section - 3x3 Grid Style */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-8 px-4">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <p className="text-xs font-bold text-on-surface-variant">Hiển thị <span className="text-on-surface">128</span> sáng kiến</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Sắp xếp:</span>
              <div className="relative min-w-[140px]">
                <select className="w-full px-2 py-1 bg-transparent border-b border-outline-variant outline-none font-black text-[10px] uppercase tracking-widest cursor-pointer appearance-none">
                  <option>Độ liên quan</option>
                  <option>Mới nhất</option>
                </select>
                <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-40">expand_more</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((r, idx) => (
              <div 
                key={r.id} 
                className="bg-white rounded-[2.5rem] border border-outline-variant shadow-sm hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] transition-all duration-500 group relative animate-fade-in flex flex-col h-full overflow-hidden"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Card Header Decoration */}
                <div className="h-2 bg-gradient-to-r from-primary/20 via-primary to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-[8px] font-black uppercase tracking-widest rounded-md">ID: #{r.id}</span>
                    <span className="text-[8px] font-black text-primary uppercase tracking-widest">{r.department}</span>
                  </div>

                  <h2
                    onClick={() => navigate(`/theses/${r.id}`, { state: r })}
                    className="text-lg font-black text-on-surface mb-4 tracking-tight group-hover:text-primary transition-colors leading-snug line-clamp-2 min-h-[56px] cursor-pointer"
                  >
                    {r.title}
                  </h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-surface-container-low rounded-xl flex items-center justify-center text-primary/60 group-hover:bg-primary group-hover:text-white transition-all">
                        <span className="material-symbols-outlined text-[16px]">person</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-1">Sinh viên</span>
                        <span className="text-xs font-bold text-on-surface line-clamp-1">{r.student}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-surface-container-low rounded-xl flex items-center justify-center text-primary/60 group-hover:bg-primary group-hover:text-white transition-all">
                        <span className="material-symbols-outlined text-[16px]">psychology</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-1">GV Hướng dẫn</span>
                        <span className="text-xs font-bold text-on-surface line-clamp-1">{r.advisor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <p className="text-[12px] text-on-surface-variant leading-relaxed font-medium mb-6 opacity-60 line-clamp-2 italic">"{r.desc}"</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {r.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-[8px] font-black text-on-surface-variant/30 uppercase tracking-widest">#{tag.replace('#','')}</span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
                      <button
                        onClick={() => navigate(`/theses/${r.id}`, { state: r })}
                        className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all hover:underline"
                      >
                        Chi tiết <span className="material-symbols-outlined text-sm">east</span>
                      </button>
                      <span className="text-[10px] font-black text-on-surface-variant opacity-40 uppercase tracking-widest">{r.year}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <button className="px-10 py-4 bg-white border-2 border-outline-variant/50 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:border-primary hover:text-primary transition-all shadow-sm">
              XEM THÊM KẾT QUẢ
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LookupPage;
