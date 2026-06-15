import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { thesisService } from '../services/api';
import { getInterestProfile, getRecommendedTheses, logStudentActivity } from '../utils/studentActivityStats';
import { getMajorDefaultImage } from '../utils/majorImages';

// Fallback seed data if user favorites list is empty on first load
const SEED_FAVORITES = [
  {
    id: "fav-1",
    title: "Ứng dụng Machine Learning trong việc tối ưu hóa năng lượng tòa nhà",
    student: "Nguyễn Văn A",
    advisor: "TS. Trần Thị B",
    year: "2024",
    major: "ai",
    department: "Khoa CNTT",
    description: "Đề tài tập trung vào việc xây dựng mô hình dự báo tiêu thụ năng lượng dựa trên dữ liệu lịch sử và các yếu tố môi trường, giúp giảm thiểu 20% chi phí vận hành cho các tòa nhà thông minh tại Việt Nam.",
    stats: { views: "1.2k", downloads: "450", rating: "4.9" },
    tags: ["#SmartCity", "#AI", "#GreenTech"],
    notes: "Cần tham khảo phần thuật toán tối ưu hóa cho đồ án sắp tới.",
    pdfUrl: "/Document%20Detail.pdf"
  },
  {
    id: "fav-2",
    title: "Phát triển hệ thống Blockchain cho truy xuất nguồn gốc nông sản",
    student: "Lê Thị C",
    advisor: "ThS. Hoàng Văn D",
    year: "2023",
    major: "security",
    department: "Khoa CNTT",
    description: "Giải pháp sử dụng nền tảng Hyperledger Fabric để minh bạch hóa chuỗi cung ứng trái cây xuất khẩu, đảm bảo thông tin từ nông trại đến tay người tiêu dùng không thể bị thay đổi.",
    stats: { views: "2.5k", downloads: "890", rating: "4.8" },
    tags: ["#Blockchain", "#AgriTech", "#Export"],
    notes: "Mô hình chuỗi cung ứng rất chi tiết.",
    pdfUrl: "/Document%20Detail.pdf"
  },
  {
    id: "fav-3",
    title: "Thiết kế trải nghiệm người dùng (UX) cho ứng dụng hỗ trợ người khiếm thị",
    student: "Phạm Minh E",
    advisor: "TS. Ngô Bảo F",
    year: "2024",
    major: "programming",
    department: "Khoa CNTT",
    description: "Nghiên cứu về các giao diện âm thanh và phản hồi xúc giác nhằm cải thiện khả năng tiếp cận công nghệ cho cộng đồng người yếu thế trong xã hội số.",
    stats: { views: "3.1k", downloads: "1.2k", rating: "5.0" },
    tags: ["#UXUI", "#Accessibility", "#SocialImpact"],
    notes: "Phần khảo sát người dùng rất chuyên nghiệp.",
    pdfUrl: "/Document%20Detail.pdf"
  }
];

const MOCK_DB_THESES = [
  {
    id: "mock-1",
    title: "Tối ưu hóa thuật toán lập lịch trong môi trường Cloud Computing",
    student: "Lê Minh Quốc",
    advisor: "TS. Nguyễn An",
    year: "2024",
    major: "programming",
    department: "Khoa CNTT",
    description: "Đề tài nghiên cứu và phát triển giải pháp tối ưu hóa việc phân bổ tài nguyên ảo hóa (Virtual Machines) trên các trung tâm dữ liệu đám mây, giúp tiết kiệm 15% năng lượng tiêu hao.",
    stats: { views: "820", downloads: "190", rating: "4.7" },
    tags: ["#Cloud", "#Programming", "#Scheduling"],
    pdfUrl: "/Document%20Detail.pdf"
  },
  {
    id: "mock-2",
    title: "Phát hiện mã độc Ransomware bằng học sâu (Deep Learning)",
    student: "Nguyễn Hoàng Nam",
    advisor: "TS. Vũ Hải",
    year: "2024",
    major: "security",
    department: "Khoa CNTT",
    description: "Xây dựng hệ thống phân tích hành vi động của các tiến trình để phát hiện và ngăn chặn hoạt động mã hóa file của Ransomware sử dụng mô hình LSTM và CNN.",
    stats: { views: "1.5k", downloads: "410", rating: "4.9" },
    tags: ["#Security", "#DeepLearning", "#Malware"],
    pdfUrl: "/Document%20Detail.pdf"
  },
  {
    id: "mock-3",
    title: "Xây dựng hệ thống nhà thông minh IoT tích hợp điều khiển giọng nói tiếng Việt",
    student: "Trần Văn Phú",
    advisor: "ThS. Lê Thị Hà",
    year: "2023",
    major: "ai",
    department: "Khoa CNTT",
    description: "Thiết kế và thi công mô hình nhà thông minh kết nối qua giao thức MQTT, sử dụng xử lý ngôn ngữ tự nhiên (NLP) để nhận diện lệnh thoại tiếng Việt ngoại tuyến.",
    stats: { views: "980", downloads: "320", rating: "4.6" },
    tags: ["#IoT", "#AI", "#SmartHome"],
    pdfUrl: "/Document%20Detail.pdf"
  },
  {
    id: "mock-4",
    title: "Nghiên cứu hiệu năng mạng 5G và thiết kế mạng lõi doanh nghiệp",
    student: "Hoàng Gia Bảo",
    advisor: "TS. Phạm Đức",
    year: "2024",
    major: "networking",
    department: "Khoa CNTT",
    description: "Mô phỏng hiệu năng truyền dữ liệu băng thông rộng của mạng 5G và đề xuất kiến trúc mạng lõi an toàn, độ trễ thấp cho các khu công nghiệp thông minh.",
    stats: { views: "650", downloads: "150", rating: "4.5" },
    tags: ["#5G", "#Networking", "#Enterprise"],
    pdfUrl: "/Document%20Detail.pdf"
  },
  {
    id: "mock-5",
    title: "Phân tích dữ liệu lớn (Big Data) hỗ trợ ra quyết định trong bán lẻ",
    student: "Phạm Thùy Linh",
    advisor: "PGS.TS. Trần Quân",
    year: "2024",
    major: "is",
    department: "Khoa CNTT",
    description: "Ứng dụng các thuật toán khai phá luật kết hợp và phân cụm khách hàng trên cơ sở dữ liệu hóa đơn lớn để tối ưu hóa vị trí sản phẩm và chiến dịch khuyến mãi.",
    stats: { views: "1.1k", downloads: "280", rating: "4.8" },
    tags: ["#BigData", "#BusinessIntelligence", "#Analytics"],
    pdfUrl: "/Document%20Detail.pdf"
  },
  {
    id: "mock-6",
    title: "Phát triển ứng dụng Web học trực tuyến tương tác cao (E-Learning)",
    student: "Đặng Hồng Hải",
    advisor: "ThS. Nguyễn Thị Minh",
    year: "2024",
    major: "software-engineering",
    department: "Khoa CNTT",
    description: "Thiết kế hệ thống học trực tuyến hỗ trợ gọi video thời gian thực, bảng trắng tương tác và phòng thảo luận nhóm nhỏ sử dụng WebRTC và Socket.io.",
    stats: { views: "1.3k", downloads: "560", rating: "4.7" },
    tags: ["#WebRTC", "#Elearning", "#WebDev"],
    pdfUrl: "/Document%20Detail.pdf"
  }
];

const MAJOR_LABELS = {
  ai: 'Trí tuệ nhân tạo (AI)',
  networking: 'Mạng máy tính',
  'computer-networks': 'Mạng máy tính',
  is: 'Hệ thống thông tin',
  'information-systems': 'Hệ thống thông tin',
  security: 'An toàn thông tin',
  cybersecurity: 'An toàn thông tin',
  'software-engineering': 'Công nghệ phần mềm',
  programming: 'Kỹ thuật lập trình'
};

const FavoritesPage = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [dbTheses, setDbTheses] = useState([]);
  const [profilePoints, setProfilePoints] = useState({ majorPoints: {}, tagPoints: {} });

  const loadData = useCallback(() => {
    // 1. Load favorites from LocalStorage
    let favList = [];
    try {
      const raw = localStorage.getItem('studentFavorites');
      if (raw) {
        favList = JSON.parse(raw);
        let modified = false;
        favList = favList.map(item => {
          if (item.id && item.id.startsWith('fav-') && item.image && item.image.includes('unsplash.com')) {
            const { image, ...rest } = item;
            modified = true;
            return rest;
          }
          return item;
        });
        if (modified) {
          localStorage.setItem('studentFavorites', JSON.stringify(favList));
        }
      } else {
        // First-time seeding
        localStorage.setItem('studentFavorites', JSON.stringify(SEED_FAVORITES));
        favList = SEED_FAVORITES;
      }
    } catch {
      favList = SEED_FAVORITES;
    }
    setFavorites(favList);
    if (favList.length > 0 && !selectedId) {
      setSelectedId(favList[0].id);
    } else if (favList.length === 0) {
      setSelectedId("");
    }

    // 2. Load Interest Profile points
    setProfilePoints(getInterestProfile());
  }, [selectedId]);

  const fetchTheses = useCallback(async () => {
    try {
      const { data } = await thesisService.getAll({ page: 1, pageSize: 1000 });
      if (data && data.items && data.items.length > 0) {
        const mapped = data.items.map(t => ({
          id: t.id,
          title: t.title,
          student: t.studentName || 'Sinh viên',
          advisor: t.advisorName || 'Chưa phân công',
          year: t.createdAt ? new Date(t.createdAt).getFullYear().toString() : '2026',
          major: t.major || '',
          department: t.department || 'Khoa học Công nghệ',
          description: t.description || 'Chưa có mô tả chi tiết cho đề tài này.',
          stats: { views: "240", downloads: "45", rating: "4.5" },
          tags: t.major ? [`#${t.major}`] : ['#research'],
          pdfUrl: t.filePath || '/Document%20Detail.pdf'
        }));
        setDbTheses(mapped);
      } else {
        setDbTheses(MOCK_DB_THESES);
      }
    } catch (err) {
      console.error("Failed to load theses", err);
      setDbTheses(MOCK_DB_THESES);
    }
  }, []);

  useEffect(() => {
    loadData();
    fetchTheses();

    const handleFavUpdate = () => loadData();
    const handleActUpdate = () => setProfilePoints(getInterestProfile());

    window.addEventListener('student-favorites-updated', handleFavUpdate);
    window.addEventListener('student-activity-updated', handleActUpdate);

    return () => {
      window.removeEventListener('student-favorites-updated', handleFavUpdate);
      window.removeEventListener('student-activity-updated', handleActUpdate);
    };
  }, [loadData, fetchTheses]);

  // Compute recommendations dynamically
  const recommendations = useMemo(() => {
    const combined = [...dbTheses];
    // Exclude mock theses if they are already favorited
    return getRecommendedTheses(combined, favorites, 3);
  }, [dbTheses, favorites]);

  // Sort preferred tags by score descending
  const sortedTags = useMemo(() => {
    const tags = profilePoints.tagPoints || {};
    return Object.entries(tags)
      .map(([name, pts]) => ({ name, pts }))
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 10);
  }, [profilePoints]);

  // Sort preferred majors by score descending
  const sortedMajors = useMemo(() => {
    const majors = profilePoints.majorPoints || {};
    const defaultList = ['ai', 'networking', 'is', 'security', 'software-engineering', 'programming'];
    
    // Add default majors to list so they always display
    const allKeys = Array.from(new Set([...Object.keys(majors), ...defaultList]));
    
    return allKeys
      .map(key => ({
        key,
        label: MAJOR_LABELS[key] || key.toUpperCase(),
        pts: majors[key] || 0
      }))
      .sort((a, b) => b.pts - a.pts);
  }, [profilePoints]);

  const currentItem = useMemo(() => {
    return favorites.find(item => item.id.toString() === selectedId.toString()) || favorites[0];
  }, [favorites, selectedId]);

  const handleRemoveFavorite = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Gỡ bỏ đề tài này khỏi mục yêu thích?")) {
      const updated = favorites.filter(f => f.id.toString() !== id.toString());
      localStorage.setItem('studentFavorites', JSON.stringify(updated));
      setFavorites(updated);
      if (selectedId.toString() === id.toString()) {
        setSelectedId(updated.length > 0 ? updated[0].id : "");
      }
      window.dispatchEvent(new Event('student-favorites-updated'));
    }
  };

  return (
    <div className="min-h-screen bg-surface-bright pb-20 overflow-hidden">
      
      {/* ─── Hero Slider ─── */}
      {favorites.length > 0 && currentItem && (
        <section className="relative h-[400px] sm:h-[550px] w-full bg-[#0a0a0a] overflow-hidden group">
          <div className="absolute inset-0 transition-all duration-[1s] ease-in-out">
            {/* Cover image backdrop */}
            <img 
              src={currentItem.image || getMajorDefaultImage(currentItem.major, currentItem.id)} 
              className="w-full h-full object-cover opacity-45 transition-transform duration-[8s] group-hover:scale-105" 
              alt="" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent"></div>
            
            {/* Hero text */}
            <div className="absolute inset-0 flex items-center px-4 sm:px-8 md:px-20 pb-12 sm:pb-20">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/20 backdrop-blur-xl rounded-lg text-primary font-black text-[9px] uppercase tracking-[0.3em] mb-4 sm:mb-6 border border-primary/30">
                  <span className="material-symbols-outlined text-sm">stars</span>
                  Thư viện cá nhân
                </div>
                
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 leading-[1.1] tracking-tighter line-clamp-3">
                  {currentItem.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center text-white border border-white/10">
                      <span className="material-symbols-outlined text-lg sm:text-xl">person</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Sinh viên</span>
                      <span className="text-[10px] sm:text-xs font-bold text-white/90">{currentItem.student}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center text-white border border-white/10">
                      <span className="material-symbols-outlined text-lg sm:text-xl">school</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Hướng dẫn</span>
                      <span className="text-[10px] sm:text-xs font-bold text-white/90">{currentItem.advisor}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      logStudentActivity('thesis_view', { id: currentItem.id, major: currentItem.major, tags: currentItem.tags });
                      navigate(`/theses/${currentItem.id}`, { state: currentItem });
                    }}
                    className="px-6 sm:px-8 py-2.5 sm:py-3.5 bg-primary text-on-primary rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-primary transition-all shadow-xl shadow-primary/20 flex items-center gap-2 border-none cursor-pointer"
                  >
                    XEM CHI TIẾT
                    <span className="material-symbols-outlined text-base">arrow_right_alt</span>
                  </button>
                  <button 
                    onClick={(e) => handleRemoveFavorite(e, currentItem.id)}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-red-500/20 hover:text-red-400 transition-all cursor-pointer"
                    title="Gỡ khỏi yêu thích"
                  >
                    <span className="material-symbols-outlined text-base sm:text-lg">bookmark_remove</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Thumbnail Navigation */}
          <div className="absolute bottom-10 right-8 md:right-20 z-30 hidden sm:flex items-end gap-3">
            {favorites.map((item) => (
              <button 
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`relative transition-all duration-500 ease-out ${
                  selectedId.toString() === item.id.toString() 
                  ? 'w-[140px] h-[80px] ring-2 ring-primary ring-offset-2 ring-offset-[#0a0a0a]' 
                  : 'w-[100px] h-[60px] opacity-30 hover:opacity-100'
                } rounded-xl overflow-hidden shadow-xl border-none cursor-pointer`}
              >
                <img src={item.image || getMajorDefaultImage(item.major, item.id)} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-black/40 hover:bg-transparent transition-colors"></div>
                <div className="absolute bottom-2 left-2 right-2 text-left">
                  <p className="text-[8px] font-bold text-white truncate uppercase tracking-tight">{item.title}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
            {favorites.map(item => (
              <div 
                key={item.id}
                className={`w-0.5 transition-all duration-500 rounded-full ${selectedId.toString() === item.id.toString() ? 'h-6 sm:h-8 bg-primary' : 'h-1.5 sm:h-2 bg-white/10'}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Interest Profile Dashboard ─── */}
      <section className="pt-10 max-w-[1300px] mx-auto px-4 md:px-0 w-full">
        <div className="bg-white rounded-[2.5rem] border border-outline-variant p-6 sm:p-8 md:p-10 shadow-sm relative overflow-hidden">
          
          {/* Decorative backdrop glow */}
          <div className="absolute top-[-50%] right-[-30%] w-[60%] h-[100%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-on-surface tracking-tight uppercase leading-none">Hồ sơ sở thích khoa học</h2>
              <p className="text-xs text-on-surface-variant font-medium mt-1">Hồ sơ phản ánh mức độ quan tâm học thuật được phân tích từ hành vi nghiên cứu của bạn.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 relative z-10">
            
            {/* Major Points Progress Bars */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">bar_chart</span>
                Độ quan tâm Chuyên ngành
              </h3>
              
              <div className="space-y-3">
                {sortedMajors.slice(0, 5).map(item => {
                  const maxPts = Math.max(1, sortedMajors[0].pts);
                  const percent = Math.min(100, Math.round((item.pts / maxPts) * 100));
                  return (
                    <div key={item.key} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-on-surface">
                        <span>{item.label}</span>
                        <span className="text-primary">{item.pts > 0 ? `${percent}%` : '0%'}</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-1000"
                          style={{ width: `${item.pts > 0 ? percent : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tag Cloud with dynamic sizing based on scores */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">tag</span>
                Chủ đề nghiên cứu quan tâm hàng đầu
              </h3>
              
              {sortedTags.length === 0 ? (
                <div className="py-8 text-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/60 flex flex-col items-center">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant/30 mb-2">bookmark_add</span>
                  <p className="text-[11px] font-bold text-on-surface-variant/60">Chưa ghi nhận thẻ sở thích</p>
                  <p className="text-[9px] text-on-surface-variant/40 mt-0.5">Tương tác xem, tải xuống, lưu đề tài để kích hoạt phân tích.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-2">
                  {sortedTags.map(tag => {
                    const maxTagPts = Math.max(1, sortedTags[0].pts);
                    const weight = tag.pts / maxTagPts; // ratio 0 to 1
                    
                    // Style matching weight
                    const bgClass = weight > 0.7 
                      ? 'bg-primary text-on-primary font-black shadow-md shadow-primary/10'
                      : weight > 0.4
                      ? 'bg-primary/20 text-primary font-black border border-primary/30'
                      : 'bg-surface-container text-on-surface-variant font-bold border border-outline-variant/30';

                    return (
                      <span 
                        key={tag.name} 
                        className={`px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-1 ${bgClass}`}
                      >
                        {tag.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ─── Favorites List Grid ─── */}
      <section className="pt-10 max-w-[1300px] mx-auto px-4 md:px-0 w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-1.5 h-8 bg-primary rounded-full"></div>
          <h2 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight uppercase">Tất cả bài lưu trữ yêu thích</h2>
          <span className="px-3 py-1 bg-surface-container-high rounded-lg text-[10px] font-black text-on-surface-variant">{favorites.length}</span>
        </div>

        {favorites.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2rem] border border-outline-variant shadow-sm flex flex-col items-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4 animate-pulse">bookmark_add</span>
            <h3 className="text-lg font-black text-on-surface mb-2">Chưa lưu sáng kiến nào</h3>
            <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">Hãy click nút "Lưu vào thư viện" tại trang chi tiết đề tài để đồng bộ danh sách này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            {favorites.map((item, idx) => (
              <div 
                key={item.id} 
                className="bg-white rounded-[2.5rem] border border-outline-variant group hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-500 cursor-pointer flex flex-col relative overflow-hidden"
                style={{ animationDelay: `${idx * 100}ms` }}
                onClick={() => {
                  logStudentActivity('thesis_view', { id: item.id, major: item.major, tags: item.tags });
                  navigate(`/theses/${item.id}`, { state: item });
                }}
              >
                {/* Accent line */}
                <div className="h-1 bg-primary/20 group-hover:bg-primary transition-all duration-500" />
                
                {/* Image Cover */}
                <div className="h-44 w-full overflow-hidden relative">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" 
                    src={getMajorDefaultImage(item.major, item.id)} 
                    alt={item.title} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                  
                  {/* Bookmark ribbon */}
                  <div 
                    onClick={(e) => handleRemoveFavorite(e, item.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-xl border border-white/25 flex items-center justify-center text-white hover:bg-red-500 hover:text-white transition-all shadow-md cursor-pointer"
                    title="Gỡ lưu trữ"
                  >
                    <span className="material-symbols-outlined text-sm">bookmark_remove</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 bg-surface-container-high text-[8px] font-black rounded text-on-surface-variant uppercase">Niên khóa {item.year}</span>
                      {item.major && (
                        <span className="text-[8px] font-black text-primary uppercase tracking-wider">{MAJOR_LABELS[item.major] || item.major.toUpperCase()}</span>
                      )}
                    </div>
                    
                    <h3 className="text-base md:text-lg font-black text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors tracking-tight mb-4 min-h-[48px]">
                      {item.title}
                    </h3>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center text-[10px] font-black uppercase text-on-surface-variant/60">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">person</span>
                      {item.student}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        logStudentActivity('thesis_view', { id: item.id, major: item.major, tags: item.tags });
                        navigate(`/theses/${item.id}`, { state: item });
                      }}
                      className="text-[9px] font-black text-primary uppercase flex items-center gap-1.5 hover:underline border-none bg-transparent cursor-pointer"
                    >
                      ĐỌC NGAY <span className="material-symbols-outlined text-sm">east</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Personalized Recommendations (ES Mock Boosting) ─── */}
      <section className="pt-16 max-w-[1300px] mx-auto px-4 md:px-0 w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight uppercase leading-none">Đề xuất cá nhân hóa cho bạn</h2>
            <p className="text-[10px] text-on-surface-variant font-medium mt-1">Sử dụng thuật toán so khớp điểm Elasticsearch để gợi ý các đề tài phù hợp nhất.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 animate-fade-in">
          {recommendations.map((item, idx) => (
            <div 
              key={item.id} 
              className="bg-white rounded-[2.5rem] border border-outline-variant group hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-500 cursor-pointer flex flex-col relative overflow-hidden"
              style={{ animationDelay: `${idx * 100}ms` }}
              onClick={() => {
                logStudentActivity('thesis_view', { id: item.id, major: item.major, tags: item.tags });
                navigate(`/theses/${item.id}`, { state: item });
              }}
            >
              {/* Highlight gradient ribbon */}
              <div className="h-1 bg-gradient-to-r from-amber-400 to-primary group-hover:h-1.5 transition-all" />
              
              {/* Image Cover */}
              <div className="h-44 w-full overflow-hidden relative">
                <img 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" 
                  src={getMajorDefaultImage(item.major, item.id)} 
                  alt={item.title} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                
                {/* Auto recommendation badge */}
                <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full shadow flex items-center gap-1 border border-amber-400/20">
                  <span className="material-symbols-outlined text-[10px] animate-pulse">auto_awesome</span>
                  RECOMMENDED
                </div>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-surface-container-high text-[8px] font-black rounded text-on-surface-variant uppercase">Niên khóa {item.year}</span>
                    {item.major && (
                      <span className="text-[8px] font-black text-amber-600 uppercase tracking-wider">{MAJOR_LABELS[item.major] || item.major.toUpperCase()}</span>
                    )}
                  </div>
                  
                  <h3 className="text-base md:text-lg font-black text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors tracking-tight mb-4 min-h-[48px]">
                    {item.title}
                  </h3>
                </div>

                <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center text-[10px] font-black uppercase text-on-surface-variant/60">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">person</span>
                    {item.student}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      logStudentActivity('thesis_view', { id: item.id, major: item.major, tags: item.tags });
                      navigate(`/theses/${item.id}`, { state: item });
                    }}
                    className="text-[9px] font-black text-amber-600 uppercase flex items-center gap-1.5 hover:underline border-none bg-transparent cursor-pointer"
                  >
                    KHÁM PHÁ <span className="material-symbols-outlined text-sm">east</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default FavoritesPage;
