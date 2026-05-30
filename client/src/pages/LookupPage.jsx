import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// ─── Type config (colours + filters) ────────────────────────────────────────
const TYPE_CONFIG = {
  'do-an': {
    label: 'Đồ Án',
    icon: 'engineering',
    desc: 'Thực hành & Ứng dụng',
    filterLabel: 'Lọc theo Môn học',
    filterIcon: 'menu_book',
    // Very faint blobs — no glare
    blob1: 'bg-blue-300/6',
    blob2: 'bg-sky-300/5',
    // Badge (top of page)
    badgeBg: 'bg-blue-50 border-blue-100 text-blue-600',
    badgeIcon: 'text-blue-500',
    // H1 accent — use softer shade
    accentText: 'text-blue-500',
    // Banner card (replaces gradient strip)
    bannerCard: 'bg-blue-50 border border-blue-200',
    bannerIconBg: 'bg-blue-500',
    bannerLabel: 'text-blue-800',
    bannerDesc: 'text-blue-500',
    // Filter section divider
    divider: 'bg-blue-200',
    // Chips — muted, no shadow
    chipActive: 'bg-blue-500 text-white',
    chipIdle: 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50 hover:border-blue-300',
    // Card top accent line
    cardAccent: 'from-blue-200/20 via-blue-400/30 to-blue-200/20',
    countColor: 'text-blue-500',
    filters: [
      { label: 'Tất cả', value: null, icon: 'apps' },
      { label: 'Lập trình Web', value: 'web-dev', icon: 'language' },
      { label: 'Lập trình Mobile', value: 'mobile-dev', icon: 'phone_android' },
      { label: 'Cơ sở dữ liệu', value: 'database', icon: 'storage' },
      { label: 'Mạng máy tính', value: 'networking', icon: 'lan' },
      { label: 'Trí tuệ nhân tạo', value: 'ai', icon: 'smart_toy' },
      { label: 'An toàn thông tin', value: 'security', icon: 'security' },
    ],
  },
  'khoa-luan': {
    label: 'Khóa luận (Tốt nghiệp)',
    icon: 'school',
    desc: 'Nghiên cứu chuyên sâu',
    filterLabel: 'Lọc theo Chuyên ngành',
    filterIcon: 'account_tree',
    blob1: 'bg-violet-300/6',
    blob2: 'bg-purple-300/5',
    badgeBg: 'bg-violet-50 border-violet-100 text-violet-600',
    badgeIcon: 'text-violet-500',
    accentText: 'text-violet-500',
    bannerCard: 'bg-violet-50 border border-violet-200',
    bannerIconBg: 'bg-violet-500',
    bannerLabel: 'text-violet-800',
    bannerDesc: 'text-violet-500',
    divider: 'bg-violet-200',
    chipActive: 'bg-violet-500 text-white',
    chipIdle: 'bg-white text-violet-600 border border-violet-100 hover:bg-violet-50 hover:border-violet-300',
    cardAccent: 'from-violet-200/20 via-violet-400/30 to-violet-200/20',
    countColor: 'text-violet-500',
    filters: [
      { label: 'Tất cả', value: null, icon: 'apps' },
      { label: 'Công nghệ phần mềm', value: 'software-engineering', icon: 'code', sub: 'SE' },
      { label: 'Mạng máy tính', value: 'computer-networks', icon: 'lan', sub: 'CN' },
      { label: 'An toàn không gian mạng', value: 'cybersecurity', icon: 'shield', sub: 'Cyber' },
      { label: 'Trí tuệ nhân tạo', value: 'ai', icon: 'smart_toy', sub: 'AI' },
      { label: 'Hệ thống thông tin', value: 'information-systems', icon: 'account_tree', sub: 'IS' },
    ],
  },
  'chuyen-de': {
    label: 'Chuyên Đề',
    icon: 'lightbulb',
    desc: 'Chủ đề chuyên biệt',
    filterLabel: 'Lọc theo Chuyên ngành',
    filterIcon: 'account_tree',
    blob1: 'bg-amber-300/6',
    blob2: 'bg-orange-300/5',
    badgeBg: 'bg-amber-50 border-amber-100 text-amber-700',
    badgeIcon: 'text-amber-600',
    accentText: 'text-amber-700',
    bannerCard: 'bg-amber-50 border border-amber-200',
    bannerIconBg: 'bg-amber-500',
    bannerLabel: 'text-amber-900',
    bannerDesc: 'text-amber-600',
    divider: 'bg-amber-200',
    chipActive: 'bg-amber-600 text-white',
    chipIdle: 'bg-white text-amber-700 border border-amber-100 hover:bg-amber-50 hover:border-amber-300',
    cardAccent: 'from-amber-200/20 via-amber-400/30 to-amber-200/20',
    countColor: 'text-amber-600',
    filters: [
      { label: 'Tất cả', value: null, icon: 'apps' },
      { label: 'Công nghệ phần mềm', value: 'software-engineering', icon: 'code', sub: 'SE' },
      { label: 'Mạng máy tính', value: 'computer-networks', icon: 'lan', sub: 'CN' },
      { label: 'An toàn không gian mạng', value: 'cybersecurity', icon: 'shield', sub: 'Cyber' },
      { label: 'Trí tuệ nhân tạo', value: 'ai', icon: 'smart_toy', sub: 'AI' },
      { label: 'Hệ thống thông tin', value: 'information-systems', icon: 'account_tree', sub: 'IS' },
    ],
  },
};

const ALL_RESULTS = [
  { id: 1, title: 'Impact of Blockchain on Supply Chain Transparency in Emerging Markets', student: 'Trần Ngọc Bảo Hân', advisor: 'TS. Nguyễn Minh Trí', year: '2023', department: 'CNTT', similarity: '8%', similarityLevel: 'safe', desc: 'Khám phá việc triển khai Hyperledger Fabric trong theo dõi sản phẩm nông nghiệp từ nông trại đến tay người tiêu dùng tại Đông Nam Á...', tags: ['blockchain', 'supplychain', 'transparency'] },
  { id: 2, title: 'Economic Shifts in Post-Pandemic Retail: A Comparative Study', student: 'Lê Quốc Anh', advisor: 'GS. Sarah Jenkins', year: '2022', department: 'Kinh tế', similarity: '32%', similarityLevel: 'high', desc: 'Nghiên cứu sự chuyển đổi từ bán lẻ truyền thống sang omnichannel trong ngành may mặc giai đoạn 2020-2022...', tags: ['retail', 'economics'] },
  { id: 3, title: 'Artificial Intelligence in Modern Portfolio Management', student: 'Phạm Minh Tú', advisor: 'TS. Hoàng Vũ', year: '2024', department: 'Tài chính', similarity: '12%', similarityLevel: 'safe', desc: 'Phát triển mô hình học máy dựa trên mạng nơ-ron hồi tiếp (RNN) để dự đoán biến động thị trường chứng khoán...', tags: ['AI', 'fintech', 'ML'] },
];

// ─── Main Component ──────────────────────────────────────────────────────────
const LookupPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  const thesisType  = searchParams.get('type');
  const activeFilter = searchParams.get('filter');
  const tc = thesisType ? TYPE_CONFIG[thesisType] : null;

  const setFilter = (value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set('filter', value); else p.delete('filter');
    setSearchParams(p);
  };

  const clearType = () => setSearchParams({});

  return (
    <div className="min-h-screen bg-surface-bright relative overflow-hidden">

      {/* ── Background blobs (change colour per type) ─────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={`absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[130px] transition-all duration-700 ${tc ? tc.blob1 : 'bg-primary/10'}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[110px] transition-all duration-700 ${tc ? tc.blob2 : 'bg-blue-400/10'}`} />
      </div>

      <div className="relative z-10 py-4 md:py-8 max-w-[1400px] mx-auto px-4 md:px-8">

        {/* ── Page Header ──────────────────────────────────────── */}
        <header className="text-center mb-8 md:mb-12">
          {/* Top badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest mb-5 border transition-all duration-500 ${tc ? tc.badgeBg : 'bg-primary/5 border-primary/10 text-primary'}`}>
            <span className={`material-symbols-outlined text-sm ${tc ? tc.badgeIcon : 'text-primary'}`}>
              {tc ? tc.icon : 'database'}
            </span>
            {tc ? tc.label : 'Kho lưu trữ học thuật UEF'}
          </div>

          {/* H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-on-surface mb-4 tracking-tighter leading-none">
            {tc ? (
              <>Tra Cứu <span className={`transition-colors duration-500 ${tc.accentText}`}>{tc.label}</span></>
            ) : (
              <>Tra Cứu <span className="text-primary/70">Đề Tài</span></>
            )}
          </h1>
          <p className="text-on-surface-variant font-medium opacity-60 max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
            {tc
              ? tc.desc + ' — Tìm kiếm và khám phá các đề tài xuất sắc của sinh viên UEF.'
              : 'Khám phá hàng nghìn đề tài nghiên cứu, đồ án, khóa luận và chuyên đề xuất sắc từ sinh viên và giảng viên qua các thế hệ.'}
          </p>
        </header>

        {/* ── Type banner (soft card, no gradient) ─────────────── */}
        {tc && (
          <div className={`${tc.bannerCard} rounded-2xl p-4 md:p-5 mb-5 flex items-center gap-3`}>
            {/* Colored icon */}
            <div className={`w-9 h-9 md:w-10 md:h-10 ${tc.bannerIconBg} rounded-xl flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-white text-lg">{tc.icon}</span>
            </div>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={`${tc.bannerLabel} font-black text-xs uppercase tracking-widest leading-none`}>{tc.label}</p>
              <p className={`${tc.bannerDesc} text-[10px] font-medium mt-1 opacity-80`}>{tc.desc}</p>
            </div>
            {/* Close */}
            <button
              onClick={clearType}
              title="Xem tất cả"
              className="shrink-0 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined text-sm text-on-surface-variant">close</span>
            </button>
          </div>
        )}

        {/* ── Filter chips row (horizontal scroll, mobile-friendly) ── */}
        {tc && (
          <div className="mb-7">
            {/* Section label */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`w-1 h-4 rounded-full ${tc.divider}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">{tc.filterIcon}</span>
                {tc.filterLabel}
              </span>
            </div>

            {/* Scrollable chip row — works on mobile + desktop */}
            <div
              className="flex gap-2 overflow-x-auto pb-2 px-1"
              style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {tc.filters.map((f) => {
                const isActive = (f.value === null && !activeFilter) || f.value === activeFilter;
                return (
                  <button
                    key={f.value ?? 'all'}
                    onClick={() => setFilter(f.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 rounded-full text-[11px] md:text-xs font-black whitespace-nowrap transition-all duration-200 shrink-0 ${
                      isActive ? tc.chipActive : tc.chipIdle
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px] md:text-[15px]">{f.icon}</span>
                    <span>{f.label}</span>
                    {f.sub && !isActive && (
                      <span className="opacity-50 text-[9px]">({f.sub})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Category Segmented Tabs ───────────────────────────── */}
        <div className="flex justify-center mb-6 md:mb-8 animate-in fade-in duration-500">
          <div className="inline-flex p-1.5 bg-surface-container-low rounded-2xl md:rounded-3xl border border-outline-variant/30 shadow-sm overflow-x-auto max-w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {[
              { key: null, label: 'Tất cả đề tài', icon: 'apps', colorCls: 'text-primary' },
              { key: 'do-an', label: 'Đồ án', icon: 'engineering', colorCls: 'text-blue-500' },
              { key: 'chuyen-de', label: 'Chuyên đề', icon: 'lightbulb', colorCls: 'text-amber-600' },
              { key: 'khoa-luan', label: 'Tốt nghiệp', icon: 'school', colorCls: 'text-violet-500' },
            ].map((tab) => {
              const isActive = (tab.key === null && !thesisType) || thesisType === tab.key;
              return (
                <button
                  key={tab.key ?? 'all'}
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    if (tab.key) {
                      p.set('type', tab.key);
                    } else {
                      p.delete('type');
                    }
                    p.delete('filter'); // Clear sub-filter when switching category
                    setSearchParams(p);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3.5 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'bg-white shadow-sm text-on-surface border border-outline-variant/10' 
                      : 'text-on-surface-variant/70 hover:text-on-surface hover:bg-white/40 border border-transparent'
                  }`}
                >
                  <span className={`material-symbols-outlined text-sm md:text-base ${isActive ? tab.colorCls : 'text-on-surface-variant/50'}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Search Bar ───────────────────────────────────────── */}
        <div className="max-w-[1000px] mx-auto mb-8 md:mb-14">
          <div className="bg-white p-2 md:p-3 rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-outline-variant hover:border-outline transition-all flex flex-col md:flex-row items-center gap-2 group">
            <div className="flex-1 flex items-center gap-3 md:gap-5 px-4 md:px-8 w-full">
              <span className={`material-symbols-outlined text-xl md:text-2xl transition-transform group-focus-within:scale-110 ${tc ? tc.accentText : 'text-primary'}`}>search</span>
              <input
                type="text"
                placeholder={tc ? `Tìm kiếm ${tc.label.toLowerCase()}...` : 'Nhập tên đề tài, tác giả hoặc từ khóa...'}
                className="w-full bg-transparent border-none outline-none text-sm md:text-base font-bold py-3 md:py-4 text-on-surface placeholder:text-on-surface-variant/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Always neutral dark button — no bright colour */}
            <button className="w-full md:w-auto px-8 md:px-12 py-3.5 md:py-5 rounded-[1.8rem] md:rounded-[2.5rem] font-black uppercase tracking-widest text-xs bg-on-surface hover:bg-primary text-white transition-all shadow-md active:scale-95">
              Tìm kiếm ngay
            </button>
          </div>

          {/* Trending tags */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest py-1.5 px-2">Phổ biến:</span>
            {['#Blockchain', '#AI_Gemini', '#Marketing_Số', '#Kinh_tế_xanh'].map((tag) => (
              <button key={tag} className="px-3 py-1.5 bg-surface-container-low rounded-full text-[10px] font-bold text-on-surface-variant hover:text-primary transition-all border border-transparent hover:border-primary/20">
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ── Advanced Filters ─────────────────────────────────── */}
        <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-outline-variant shadow-sm mb-8 md:mb-12 flex flex-wrap items-end gap-4 md:gap-6">
          <div className="flex-1 min-w-[160px] flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 ml-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">account_balance</span> Khoa / Viện
            </label>
            <div className="relative">
              <select className="w-full px-4 md:px-6 py-3 md:py-3.5 bg-surface-container-lowest rounded-xl md:rounded-2xl outline-none border border-outline-variant focus:border-primary transition-all font-bold text-xs appearance-none cursor-pointer">
                <option>Tất cả các khoa</option>
                <option>Công nghệ thông tin</option>
                <option>Kinh tế - Quản trị</option>
                <option>Tài chính - Ngân hàng</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none text-sm">expand_more</span>
            </div>
          </div>

          <div className="flex-1 min-w-[160px] flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 ml-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">event</span> Năm học
            </label>
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Từ" className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl outline-none border border-outline-variant focus:border-primary transition-all font-bold text-xs" />
              <input type="text" placeholder="Đến" className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl outline-none border border-outline-variant focus:border-primary transition-all font-bold text-xs" />
            </div>
          </div>


          <button className="px-6 md:px-8 py-3 md:py-3.5 bg-on-surface text-white rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95 whitespace-nowrap">
            LỌC KẾT QUẢ
          </button>
        </div>

        {/* ── Results ──────────────────────────────────────────── */}
        <main>
          {/* Results header */}
          <div className="flex flex-wrap justify-between items-center mb-6 md:mb-8 gap-3 px-1">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${tc ? tc.divider : 'bg-primary'}`} />
              <p className="text-xs font-bold text-on-surface-variant">
                Hiển thị <span className="text-on-surface font-black">128</span> đề tài
                {tc && <span className={`ml-2 font-black ${tc.accentText}`}>· {tc.label}</span>}
                {activeFilter && tc && (() => {
                  const f = tc.filters.find((x) => x.value === activeFilter);
                  return f ? <span className="ml-1 opacity-60">· {f.label}</span> : null;
                })()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Sắp xếp:</span>
              <div className="relative min-w-[120px] md:min-w-[140px]">
                <select className="w-full px-2 py-1 bg-transparent border-b border-outline-variant outline-none font-black text-[10px] uppercase tracking-widest cursor-pointer appearance-none">
                  <option>Độ liên quan</option>
                  <option>Mới nhất</option>
                </select>
                <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-40">expand_more</span>
              </div>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            {ALL_RESULTS.map((r, idx) => (
              <div
                key={r.id}
                className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-outline-variant shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.07)] transition-all duration-500 group relative flex flex-col h-full overflow-hidden"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Top accent line — type-coloured */}
                <div className={`h-1.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-500 ${tc ? tc.cardAccent : 'from-primary/20 via-primary to-primary/20'}`} />

                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-[8px] font-black uppercase tracking-widest rounded-md">#{r.id}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${tc ? tc.accentText : 'text-primary'}`}>{r.department}</span>
                  </div>

                  <h2
                    onClick={() => navigate(`/theses/${r.id}`, { state: r })}
                    className={`text-base md:text-lg font-black text-on-surface mb-4 tracking-tight transition-colors leading-snug line-clamp-2 min-h-[52px] cursor-pointer ${tc ? 'group-hover:' + tc.accentText : 'group-hover:text-primary'}`}
                  >
                    {r.title}
                  </h2>

                  <div className="space-y-2.5 mb-5">
                    {[
                      { icon: 'person', label: 'Sinh viên', value: r.student },
                      { icon: 'psychology', label: 'GV Hướng dẫn', value: r.advisor },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={`w-7 h-7 md:w-8 md:h-8 bg-surface-container-low rounded-lg md:rounded-xl flex items-center justify-center transition-all ${tc ? 'group-hover:' + tc.bannerBg + ' group-hover:text-white' : 'group-hover:bg-primary group-hover:text-white'} text-primary/60`}>
                          <span className="material-symbols-outlined text-[14px] md:text-[16px]">{item.icon}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-0.5">{item.label}</span>
                          <span className="text-[11px] md:text-xs font-bold text-on-surface line-clamp-1">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium mb-4 opacity-60 line-clamp-2 italic">"{r.desc}"</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {r.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[8px] font-black text-on-surface-variant/30 uppercase tracking-widest">#{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                      <button
                        onClick={() => navigate(`/theses/${r.id}`, { state: r })}
                        className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 group-hover:gap-2.5 transition-all ${tc ? tc.accentText : 'text-primary'}`}
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

          <div className="mt-12 md:mt-16 flex justify-center">
            <button className="px-8 md:px-10 py-3.5 md:py-4 bg-white border-2 border-outline-variant/50 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:border-primary hover:text-primary transition-all shadow-sm">
              XEM THÊM KẾT QUẢ
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LookupPage;
