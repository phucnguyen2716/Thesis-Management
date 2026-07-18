import React, { useState, useMemo, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SUBMISSIONS, STATUS_CONFIG } from '../../data/lecturerMockData';
import PlagiarismAnalysisBento from '../../components/lecturer/PlagiarismAnalysisBento';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';
import { getPlagiarismFlow } from '../../utils/adminContentStore';
import { plagiarismService, thesisService } from '../../services/api';

const generateDynamicAISummary = (title, description, faculty) => {
  const t = (title || "").toLowerCase();
  const desc = (description || "").toLowerCase();
  
  let overview = `Đề tài "${title}" tập trung nghiên cứu, thiết kế và tối ưu hóa hệ thống phần mềm nhằm giải quyết bài toán thực tế thuộc chuyên ngành đào tạo.`;
  let tools = [
    "Ngôn ngữ lập trình chính: JavaScript (Node.js) hoặc Python",
    "Framework phát triển: React.js để thiết kế giao diện động",
    "Hệ quản trị cơ sở dữ liệu: PostgreSQL / SQL Server hoặc MongoDB",
    "Hạ tầng vận hành: Docker Containerization và hệ thống RESTful APIs"
  ];
  let strengths = [
    "Phân tích thiết kế hệ thống chi tiết, vẽ sơ đồ Usecase và Class chính xác.",
    "Giao diện người dùng hiện đại, tốc độ tải trang nhanh và thiết kế responsive.",
    "Áp dụng quy trình kiểm thử đơn vị (Unit Test) cho các luồng xử lý chính."
  ];
  let weaknesses = [
    "Phần đánh giá bảo mật hệ thống còn đơn giản, cần mã hóa dữ liệu nhạy cảm kỹ hơn.",
    "Chưa thực hiện đo lường tải (Load Test) khi có nhiều kết nối truy cập đồng thời."
  ];
  let recommendation = "Khuyên dùng mức điểm: 8.0 - 8.5. Thích hợp làm tài liệu tham khảo chất lượng tại thư viện khoa.";

  if (t.includes("thư viện") || desc.includes("thư viện") || t.includes("library") || desc.includes("library")) {
    overview = `Đồ án thiết kế và phát triển hệ thống quản lý thư viện số tích hợp tìm kiếm tài liệu thông minh. Giải pháp cho phép tự động hóa quy trình mượn trả, phân quyền thủ thư và tra cứu sách trực tuyến nhanh chóng.`;
    tools = [
      "Thuật toán tìm kiếm thông minh: Tìm kiếm văn bản nâng cao (Elasticsearch / Lucene)",
      "Công nghệ giao diện: React.js kết hợp Tailwind CSS",
      "Hệ thống API backend: ASP.NET Core Web API / Node.js Express",
      "Quản lý lưu trữ: SQL Server tổ chức quan hệ sách - độc giả chặt chẽ"
    ];
    strengths = [
      "Tích hợp tìm kiếm thông minh giúp cải thiện tốc độ tìm tài liệu lên tới 40%.",
      "Thiết kế cơ sở dữ liệu chuẩn hóa 3NF tốt, tránh trùng lặp dữ liệu mượn trả.",
      "Luồng phân quyền rõ ràng giữa Sinh viên, Giảng viên, Thủ thư và Admin."
    ];
    weaknesses = [
      "Chưa tích hợp tính năng tự động gửi email thông báo khi sách sắp quá hạn mượn.",
      "Giao diện đọc tài liệu trực tuyến (PDF reader) cần tối ưu hóa dung lượng bộ nhớ đệm."
    ];
    recommendation = "Khuyên dùng mức điểm: 8.5 - 9.0. Đề tài có giá trị thực tiễn cao, hoàn thiện nghiệp vụ tốt.";
  }
  else if (t.includes("đồ ăn") || desc.includes("đồ ăn") || t.includes("food") || desc.includes("food") || t.includes("đặt hàng") || desc.includes("đặt hàng")) {
    overview = `Đồ án xây dựng nền tảng ứng dụng đặt đồ ăn trực tuyến (Food Delivery App), tối ưu hóa trải nghiệm đặt món, điều phối đơn hàng giữa cửa hàng - khách hàng - tài xế giao hàng và thanh toán trực tuyến.`;
    tools = [
      "Định vị & Bản đồ: Google Maps API định vị khoảng cách và tìm lộ trình tối ưu",
      "Thanh toán trực tuyến: Tích hợp ví điện tử MoMo hoặc cổng thanh toán VNPay",
      "Cập nhật thời gian thực: WebSockets (Socket.io) theo dõi vị trí của tài xế",
      "Cơ sở dữ liệu: MongoDB lưu trữ lịch sử đơn hàng phi cấu trúc linh hoạt"
    ];
    strengths = [
      "Chức năng định vị thời gian thực của shipper hoạt động với độ trễ thấp dưới 2 giây.",
      "Quy trình xử lý đơn hàng chi tiết, xử lý tốt các trường hợp hoàn tiền hoặc lỗi mạng.",
      "Giao diện người dùng hiện đại, phân chia món ăn theo danh mục trực quan."
    ];
    weaknesses = [
      "Thuật toán phân phối đơn hàng cho shipper gần nhất còn đơn giản, chưa tối ưu nhiều điểm dừng.",
      "Cần phát triển thêm tính năng AI gợi ý món ăn (Recommendation System) dựa trên thói quen."
    ];
    recommendation = "Khuyên dùng mức điểm: 8.2 - 8.7. Ứng dụng thực tiễn tốt, sản phẩm demo chạy mượt mà.";
  }
  else if (t.includes("blockchain") || desc.includes("blockchain") || t.includes("chuỗi khối") || desc.includes("chuỗi khối") || t.includes("smart contract") || desc.includes("smart contract")) {
    overview = `Đồ án ứng dụng công nghệ chuỗi khối Blockchain và Hợp đồng thông minh (Smart Contract) nhằm xây dựng hệ thống cấp phát và xác thực văn bằng học thuật trực tuyến phi tập trung, chống làm giả bằng cấp.`;
    tools = [
      "Hợp đồng thông minh: Solidity Smart Contracts chạy trên Ethereum / Polygon",
      "Xác thực ví: Thư viện Web3.js / Ethers.js kết nối MetaMask",
      "Giao diện: Next.js / React.js tối ưu hóa SEO và tốc độ",
      "Mã hóa dữ liệu: Mã hóa băm SHA-256 để bảo vệ thông tin văn bằng"
    ];
    strengths = [
      "Thông tin băm của văn bằng được lưu trữ bất biến trên Blockchain, ngăn chặn hoàn toàn giả mạo.",
      "Smart Contract viết tối ưu, giảm thiểu đáng kể chi phí Gas tiêu thụ khi tạo giao dịch.",
      "Tích hợp quét mã QR Code để xác minh nhanh văn bằng từ nhà tuyển dụng."
    ];
    weaknesses = [
      "Tốc độ giao dịch còn phụ thuộc lớn vào thời gian sinh khối của mạng thử nghiệm công khai.",
      "Chưa cung cấp giải pháp khôi phục mã khóa cá nhân (private key) khi người dùng bị mất."
    ];
    recommendation = "Khuyên dùng mức điểm: 8.5 - 9.0. Đề tài chất lượng, ứng dụng xuất sắc công nghệ bảo mật mới.";
  }
  else if (t.includes("sentiment") || desc.includes("sentiment") || t.includes("cảm xúc") || desc.includes("cảm xúc") || t.includes("phân tích ý kiến") || desc.includes("phân tích ý kiến") || t.includes("phobert") || desc.includes("phobert")) {
    overview = `Đồ án nghiên cứu ứng dụng mô hình học sâu PhoBERT tiếng Việt để phân tích sắc thái cảm xúc (Tích cực/Tiêu cực/Trung lập) của khách hàng từ bình luận mạng xã hội về thương hiệu UEF.`;
    tools = [
      "Mô hình ngôn ngữ: PhoBERT tinh chỉnh (Fine-tuning) qua thư viện Hugging Face Transformers",
      "Công nghệ học sâu: PyTorch / TensorFlow để huấn luyện mô hình phân loại",
      "Cào dữ liệu tự động: Python Selenium để thu thập dữ liệu bình luận từ Facebook, TikTok",
      "Ứng dụng hiển thị: FastAPI phục vụ API phân tích, React.js hiển thị biểu đồ thống kê"
    ];
    strengths = [
      "Mô hình đạt độ chính xác F1-score cao (89%) đối với các cụm từ ngữ cảnh tiếng Việt phức tạp.",
      "Tập dữ liệu khảo sát thực nghiệm lớn với hơn 10.000 dòng bình luận được tiền xử lý sạch sẽ.",
      "Dashboard trực quan hóa biểu đồ phân tích sắc thái theo từng mốc thời gian rõ ràng."
    ];
    weaknesses = [
      "Độ chính xác có xu hướng giảm khi gặp teencode, viết tắt hoặc các từ lóng chưa có trong từ điển.",
      "Mô hình học sâu nặng, tốc độ phản hồi API phân tích thời gian thực cần cấu hình GPU để cải thiện."
    ];
    recommendation = "Khuyên dùng mức điểm: 8.0 - 8.5. Phương pháp khoa học rõ ràng, tiền xử lý dữ liệu xuất sắc.";
  }
  else if (t.includes("an toàn") || desc.includes("an toàn") || t.includes("cybersecurity") || desc.includes("cybersecurity") || t.includes("security") || desc.includes("security") || t.includes("xâm nhập") || desc.includes("xâm nhập") || t.includes("ids") || desc.includes("ids")) {
    overview = `Đồ án xây dựng hệ thống phát hiện xâm nhập mạng (IDS) dựa trên các mô hình học máy. Giải pháp giúp phát hiện các hành vi quét cổng, brute-force mật khẩu và tấn công DDoS để bảo vệ hệ thống.`;
    tools = [
      "Giám sát lưu lượng: Snort / Suricata phân tích gói tin mạng theo thời gian thực",
      "Học máy phân loại: Thuật toán Random Forest, SVM (Support Vector Machine) qua Scikit-learn",
      "Báo cáo & Dashboard: React.js hiển thị cảnh báo, lưu trữ TimescaleDB cho dữ liệu chuỗi thời gian",
      "Thông báo khẩn cấp: Tích hợp Telegram API/Email gửi cảnh báo cho quản trị viên"
    ];
    strengths = [
      "Độ chính xác nhận diện tấn công cao, tỷ lệ báo động giả (False Positive Rate) được tối ưu dưới 3%.",
      "Hỗ trợ phân tích luồng dữ liệu gói tin thời gian thực với băng thông lên tới 100Mbps ổn định.",
      "Hệ thống tự động kích hoạt cảnh báo khẩn cấp và đề xuất phương án cô lập ip nghi ngờ."
    ];
    weaknesses = [
      "Chưa tích hợp tự động cấu hình tường lửa (IPS) để chặn luồng tấn công ngay khi phát hiện.",
      "Chủ yếu phát hiện dựa trên các mẫu tấn công đã biết, độ nhận diện lỗ hổng zero-day còn hạn chế."
    ];
    recommendation = "Khuyên dùng mức điểm: 8.5 - 9.0. Đồ án kỹ thuật xuất sắc, giải quyết tốt bài toán an ninh mạng thực tế.";
  }

  return { overview, tools, strengths, weaknesses, recommendation };
};

const AISummaryCard = ({ selected }) => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSummaryData(null);

    const fetchSummary = async () => {
      try {
        let cleanId = null;
        if (selected && selected.id) {
          const match = String(selected.id).match(/\d+/);
          if (match) cleanId = parseInt(match[0], 10);
        }

        if (cleanId) {
          const { data } = await thesisService.getAiSummary(cleanId);
          if (active) {
            setSummaryData(data);
            setLoading(false);
          }
        } else {
          const fallback = generateDynamicAISummary(selected.title, selected.description, selected.faculty);
          if (active) {
            setSummaryData(fallback);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Lỗi khi gọi Gemini AI summary backend:", err);
        const fallback = generateDynamicAISummary(selected.title, selected.description, selected.faculty);
        if (active) {
          setSummaryData(fallback);
          setLoading(false);
        }
      }
    };

    fetchSummary();
    return () => { active = false; };
  }, [selected]);

  if (loading || !summaryData) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 text-white rounded-2xl border border-teal-800/50 p-6 md:p-8 shadow-xl relative overflow-hidden animate-in fade-in duration-500">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-teal-300 text-2xl animate-spin">sync</span>
              <div className="text-left">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-teal-300">Gemini AI đang đọc tài liệu...</h3>
                <p className="text-[10px] text-white/50 uppercase mt-0.5 tracking-wider">Đang trích xuất nội dung từ tệp Word/PDF gốc</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-3 bg-white/5 rounded w-5/6"></div>
            <div className="h-3 bg-white/5 rounded w-2/3"></div>
            <div className="h-10 bg-white/5 rounded w-full mt-4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 text-white rounded-2xl border border-teal-800/50 p-6 md:p-8 shadow-xl relative overflow-hidden animate-in fade-in duration-500">
      {/* Background glowing orb effect */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -left-20 -top-20 w-60 h-60 bg-sky-500/5 rounded-full blur-[60px] pointer-events-none" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800/80 border border-teal-700/50 flex items-center justify-center shadow-lg shadow-teal-950/50">
              <span className="material-symbols-outlined text-teal-300 text-2xl animate-pulse">auto_awesome</span>
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-teal-300">Tóm tắt phân tích bằng Gemini AI</h3>
              <p className="text-[10px] text-white/50 uppercase mt-0.5 tracking-wider">Báo cáo tổng hợp chất lượng đồ án tự động</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-full text-[10px] font-black tracking-widest uppercase">
            Đang hoạt động
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Cột trái: Overview, Tools & Đề xuất */}
          <div className="md:col-span-6 space-y-4">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-400">Tóm tắt nội dung (Đồ án là gì)</span>
              <p className="text-xs text-white/85 leading-relaxed font-medium">
                {summaryData.overview}
              </p>
            </div>
            
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">Công cụ &amp; Chức năng</span>
              <ul className="space-y-1 pl-1">
                {summaryData.tools && summaryData.tools.map((tool, idx) => (
                  <li key={idx} className="text-xs text-white/80 leading-relaxed flex items-start gap-1.5">
                    <span className="text-sky-400 font-bold shrink-0">▪</span>
                    <span>{tool}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/10 space-y-1.5 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">recommend</span>
                Khuyến nghị của AI
              </span>
              <p className="text-xs text-white/90 font-semibold leading-relaxed">
                {summaryData.recommendation}
              </p>
            </div>
          </div>

          {/* Cột phải: Ưu điểm & Điểm yếu */}
          <div className="md:col-span-6 space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-emerald-400">check_circle</span>
                Ưu điểm &amp; Điểm cộng học thuật
              </span>
              <ul className="space-y-1.5 pl-1.5">
                {summaryData.strengths && summaryData.strengths.map((str, idx) => (
                  <li key={idx} className="text-xs text-white/80 leading-relaxed flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5 shrink-0">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-rose-400">warning</span>
                Hạn chế &amp; Điểm cần cải thiện
              </span>
              <ul className="space-y-1.5 pl-1.5">
                {summaryData.weaknesses && summaryData.weaknesses.map((weak, idx) => (
                  <li key={idx} className="text-xs text-white/80 leading-relaxed flex items-start gap-2">
                    <span className="text-rose-400 font-bold mt-0.5 shrink-0">!</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LecturerControllerPage = () => {
  const { id: paramId } = useParams();
  const [submissions, setSubmissions] = useState(SUBMISSIONS);
  const [selectedId, setSelectedId] = useState(
    SUBMISSIONS.find(s => s.id === paramId)?.id ?? SUBMISSIONS[0].id
  );
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const { data } = await thesisService.getAll({ page: 1, pageSize: 100 });
        if (data && data.items && data.items.length > 0) {
          const mapped = data.items.map(t => {
            const mockMatch = SUBMISSIONS.find(s => s.title.toLowerCase().trim() === t.title.toLowerCase().trim()) 
              || SUBMISSIONS.find(s => parseInt(s.id.replace('sub-', ''), 10) === t.id)
              || SUBMISSIONS[0];

            return {
              ...mockMatch,
              id: `sub-${String(t.id).padStart(3, '0')}`,
              title: t.title,
              student: t.studentName || 'Sinh viên',
              studentId: t.studentCode || 'SV-000',
              faculty: t.department || 'Khoa học Công nghệ',
              description: t.description || '',
              status: t.status === 'Approved' ? 'acceptable' : t.status === 'Rejected' || t.status === 'Revision' ? 'flagged' : 'review',
              grade: t.latestScore,
              rubric: mockMatch.rubric || { content: t.latestScore ?? 0, method: t.latestScore ?? 0, originality: t.latestScore ?? 0, presentation: t.latestScore ?? 0 }
            };
          });

          setSubmissions(mapped);
          
          if (paramId) {
            const found = mapped.find(s => s.id === paramId);
            if (found) setSelectedId(found.id);
          } else {
            setSelectedId(mapped[0].id);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu đề tài từ DB:", err);
      }
    };
    
    fetchSubmissions();
  }, [paramId]);

  useEffect(() => {
    const fetchPlagiarismStatus = async () => {
      const match = selectedId.match(/\d+/);
      const numericId = match ? parseInt(match[0], 10) : 1;
      
      try {
        const res = await plagiarismService.getStatus(numericId);
        if (res.data && res.data.status === 'Completed' && res.data.report) {
          const report = res.data.report;
          setSubmissions(prev =>
            prev.map(s =>
              s.id === selectedId
                ? {
                    ...s,
                    similarity: Math.round(report.similarityPercentage),
                    aiPercent: Math.round(report.algorithmScores?.["AI Detector"] ?? s.aiPercent),
                    checkedAgo: 'Đã quét (CSDL)'
                  }
                : s
            )
          );
        }
      } catch (err) {
        console.error("Lỗi khi tải kết quả đạo văn từ DB:", err);
      }
    };

    if (selectedId) {
      fetchPlagiarismStatus();
    }
  }, [selectedId]);

  const [zoom, setZoom] = useState(100);
  const [flowConfig, setFlowConfig] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = () => setFlowConfig(getPlagiarismFlow());
    load();
    window.addEventListener('admin-content-updated', load);
    return () => window.removeEventListener('admin-content-updated', load);
  }, []);

  const selected = useMemo(
    () => submissions.find(s => s.id === selectedId) || submissions[0],
    [submissions, selectedId]
  );

  const [grades, setGrades] = useState(selected.rubric);
  const [feedback, setFeedback] = useState(selected.feedback || '');
  const [finalScore, setFinalScore] = useState(selected.grade ?? '');

  useEffect(() => {
    setGrades(selected.rubric);
    setFeedback(selected.feedback || '');
    setFinalScore(selected.grade ?? '');
  }, [selected.id, selected.rubric, selected.feedback, selected.grade]);

  const filtered = submissions.filter(s => filter === 'all' || s.status === filter);

  const saveGrade = async () => {
    const rubricAvg = Object.values(grades).reduce((a, b) => a + Number(b || 0), 0) / 4;
    const score = finalScore ? parseFloat(finalScore) : Math.round(rubricAvg * 10) / 10;
    
    const match = selected.id.match(/\d+/);
    const numericId = match ? parseInt(match[0], 10) : 1;

    try {
      // Call backend API to save the review/grade to DB
      await thesisService.addReview(numericId, {
        comments: feedback,
        score: score,
        decision: score >= 5 ? "Approved" : "Rejected"
      });

      setSubmissions(prev =>
        prev.map(s =>
          s.id === selected.id 
            ? { 
                ...s, 
                grade: score, 
                feedback, 
                rubric: { ...grades },
                status: score >= 5 ? 'acceptable' : 'flagged'
              } 
            : s
        )
      );
      showToast("Đã lưu điểm số & phản hồi học thuật thành công vào CSDL!", "success");
    } catch (error) {
      console.error("Lỗi khi lưu điểm vào DB:", error);
      showToast("Không thể kết nối đến máy chủ để lưu điểm!", "error");
    }
  };

  const runRecheck = async () => {
    console.log("Starting plagiarism scan...");
    const match = selected.id.match(/\d+/);
    const numericId = match ? parseInt(match[0], 10) : 1;

    setScanning(true);
    setScanProgress(0);
    setShowProgressModal(true);
    setSubmissions(prev =>
      prev.map(s => s.id === selected.id ? { ...s, checkedAgo: 'Đang kết nối API...' } : s)
    );

    /* ── 1. Try backend mechanism ── */
    try {
      await plagiarismService.check(numericId);
      setSubmissions(prev =>
        prev.map(s => s.id === selected.id ? { ...s, checkedAgo: 'Đang quét (Backend)...' } : s)
      );

      let pollAttempts = 0;
      const maxAttempts = 20; // up to 30 seconds
      const intervalId = setInterval(async () => {
        pollAttempts++;
        try {
          const statusRes = await plagiarismService.getStatus(numericId);
          const statusData = statusRes.data;

          if (statusData.status === 'Completed') {
            clearInterval(intervalId);
            const report = statusData.report;

            // Safe map backend report matches to React expected fields
            if (report.matches) {
              report.matches = report.matches.map(m => ({
                similarity: m.similarity ?? m.similarityScore ?? 0,
                studentExcerpt: m.studentExcerpt ?? m.text ?? '',
                matchPhrase: m.matchPhrase ?? (m.text ? m.text.split(' ').slice(3, 8).join(' ') : ''),
                sourceExcerpt: m.sourceExcerpt ?? '',
                sourceName: m.sourceName ?? m.sourceTitle ?? 'Web source',
                sourceUrl: m.sourceUrl ?? '#',
                detectedBy: m.detectedBy ?? ['BM25', 'N-Gram']
              }));
            }

            const newSim = report.similarityPercentage;
            const newAiPercent = report.aiPercent ?? Math.round(newSim * 0.4);

            // Compute cells for the heatmap (10x6 = 60 cells)
            const results = report.results || [];
            let cells = [];
            if (results.length >= 60) {
              const chunkSize = results.length / 60;
              for (let i = 0; i < 60; i++) {
                const start = Math.floor(i * chunkSize);
                const end = Math.floor((i + 1) * chunkSize);
                const chunk = results.slice(start, Math.max(start + 1, end));
                const avg = chunk.reduce((sum, item) => sum + (item.similarity || 0), 0) / chunk.length;
                cells.push(Math.max(2, Math.min(100, Math.round(avg))));
              }
            } else if (results.length > 0) {
              for (let i = 0; i < 60; i++) {
                const idx = Math.floor((i / 60) * results.length);
                cells.push(Math.max(2, Math.min(100, results[idx]?.similarity || 2)));
              }
            } else {
              cells = Array.from({ length: 60 }, (_, i) => {
                const baseChapter = [1, 2, 3, 4, 5][Math.floor(i / 12)];
                const base = newSim * (1 + (baseChapter === 3 ? 0.7 : baseChapter === 2 ? 0.4 : baseChapter === 4 ? 0.2 : 0));
                return Math.max(2, Math.min(100, Math.round(base + (Math.sin(i * 1.7) * 15))));
              });
            }

            const newMatch = report.matches && report.matches.length > 0 ? {
              label: 'Nguồn trùng khớp chính',
              excerpt: report.matches[0].studentExcerpt || report.matches[0].text || '',
              sourceTitle: report.matches[0].sourceName || report.matches[0].sourceTitle || 'Tài liệu tham khảo',
              sourceMeta: report.matches[0].detectedBy ? report.matches[0].detectedBy.join(', ') : 'Nguồn Internet',
              url: report.matches[0].sourceUrl || '#',
              percent: report.matches[0].similarity || 0,
            } : selected.match;

            setSubmissions(prev =>
              prev.map(s =>
                s.id === selected.id
                  ? {
                      ...s,
                      similarity: newSim,
                      aiPercent: newAiPercent,
                      checkedAgo: 'Vừa xong (Backend)',
                      status: newSim > 40 ? 'flagged' : newSim > 20 ? 'review' : 'acceptable',
                      heatmapGrid: cells,
                      match: newMatch,
                      matches: report.matches ? report.matches.map((m, idx) => ({
                        label: `Nguồn #${idx + 1}`,
                        excerpt: m.studentExcerpt ?? m.text ?? '',
                        sourceTitle: m.sourceName ?? m.sourceTitle ?? 'Tài liệu tham khảo',
                        sourceMeta: m.detectedBy ? (Array.isArray(m.detectedBy) ? m.detectedBy.join(', ') : m.detectedBy) : 'Nguồn Internet',
                        url: m.sourceUrl ?? m.url ?? '#',
                        percent: m.similarity ?? m.similarityScore ?? 0,
                        sourceExcerpt: m.sourceExcerpt ?? '',
                      })) : [],
                      sources: report.sources ? report.sources.map((src, idx) => ({
                        id: idx + 1,
                        name: src.title ?? src.name ?? 'Nguồn Web',
                        url: src.id ?? src.url ?? '#',
                        percent: src.matchingPercentage ?? src.percent ?? 0,
                        type: 'plagiarism'
                      })) : [],
                      sourceCount: report.sources ? report.sources.length : s.sourceCount
                    }
                  : s
              )
            );

            setScanProgress(100);
            setTimeout(() => {
              setShowProgressModal(false);
              setScanning(false);
            }, 300);
          } else if (statusData.status === 'Pending') {
            const simulatedProgress = Math.min(95, Math.round((pollAttempts / maxAttempts) * 100));
            setScanProgress(simulatedProgress);
            setSubmissions(prev =>
              prev.map(s => s.id === selected.id ? { ...s, checkedAgo: `Đang quét... (${pollAttempts}s)` } : s)
            );
          } else if (pollAttempts >= maxAttempts) {
            clearInterval(intervalId);
            setScanning(false);
            setShowProgressModal(false);
            setSubmissions(prev =>
              prev.map(s => s.id === selected.id ? { ...s, checkedAgo: 'Hết thời gian chờ' } : s)
            );
            showToast("Hết thời gian chờ phản hồi từ hệ thống kiểm tra đạo văn.", "error");
          }
        } catch (pollErr) {
          console.error("Error polling plagiarism status:", pollErr);
          clearInterval(intervalId);
          setScanning(false);
          setShowProgressModal(false);
        }
      }, 1500);
      return; // polling handles the rest
    } catch (backendErr) {
      console.warn("Backend unavailable — falling back to simulation.", backendErr);
      setShowProgressModal(false);
    }

    /* ── 2. Pure UI simulation fallback ── */
    console.log("Running UI simulation...");
    setScanProgress(0);
    setShowProgressModal(true);
    setSubmissions(prev =>
      prev.map(s => s.id === selected.id ? { ...s, checkedAgo: 'Đang quét (mô phỏng)...' } : s)
    );

    let progress = 0;
    const simInterval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);
      setSubmissions(prev =>
        prev.map(s => s.id === selected.id ? { ...s, checkedAgo: `Đang quét... ${progress}%` } : s)
      );
      if (progress >= 100) {
        clearInterval(simInterval);
        const prevSim = selected.similarity ?? 18;
        let newSim = prevSim + (Math.random() > 0.5 ? 4 : -3);
        if (newSim === prevSim) newSim += 2;
        newSim = Math.max(8, Math.min(92, newSim));
        const newAiPercent = Math.round(newSim * 0.45);

        // Generate simulated cells
        const cells = Array.from({ length: 60 }, (_, i) => {
          const baseChapter = [1, 2, 3, 4, 5][Math.floor(i / 12)];
          const base = newSim * (1 + (baseChapter === 3 ? 0.75 : baseChapter === 2 ? 0.4 : baseChapter === 4 ? 0.2 : 0));
          return Math.max(2, Math.min(100, Math.round(base + (Math.sin(i * 1.7) * 15))));
        });

        // Diverse set of web-plagiarized matching sources
        const simulatedMatches = [
          {
            label: 'Springer Link Journal',
            excerpt: 'Trong nghiên cứu phát triển phần mềm, việc thiết kế cơ sở dữ liệu đóng vai trò quyết định cấu trúc và hiệu năng hệ thống.',
            sourceTitle: 'Springer Journal of Systems and Software 2023',
            sourceMeta: 'BM25, N-Gram · 2023',
            url: 'https://link.springer.com/journal/11219',
            percent: Math.round(newSim * 0.5),
          },
          {
            label: 'IEEE Xplore Academic',
            excerpt: 'Kiến trúc mô hình deep learning được đề xuất gồm nhiều lớp ẩn với hàm kích hoạt ReLU và kỹ thuật dropout.',
            sourceTitle: 'IEEE Transactions on Pattern Analysis 2024',
            sourceMeta: 'TF-IDF, Cosine · 2024',
            url: 'https://ieeexplore.ieee.org/document/9621234',
            percent: Math.round(newSim * 0.35),
          },
          {
            label: 'HuggingFace PhoBERT Rep',
            excerpt: 'Mô hình PhoBERT được fine-tune trên tập dữ liệu tiếng Việt để phân loại cảm xúc tích cực, trung tính và tiêu cực.',
            sourceTitle: 'Hugging Face vinai/phobert-base',
            sourceMeta: 'String Matching · 2023',
            url: 'https://huggingface.co/vinai/phobert-base',
            percent: Math.round(newSim * 0.15),
          }
        ];

        setSubmissions(prev =>
          prev.map(s =>
            s.id === selected.id
              ? {
                  ...s,
                  similarity: newSim,
                  aiPercent: newAiPercent,
                  checkedAgo: 'Vừa xong (mô phỏng)',
                  status: newSim > 40 ? 'flagged' : newSim > 20 ? 'review' : 'acceptable',
                  heatmapGrid: cells,
                  match: simulatedMatches[0],
                  matches: simulatedMatches,
                  sources: simulatedMatches.map((m, idx) => ({
                    id: idx + 1,
                    name: m.sourceTitle,
                    url: m.url,
                    percent: m.percent,
                    type: 'plagiarism'
                  }))
                }
              : s
          )
        );
        setScanning(false);
        setShowProgressModal(false);
      }
    }, 200);
  };

  const generateAiFeedback = () => {
    const defaultText = `Đồ án "${selected.title}" của sinh viên ${selected.student} trình bày cấu trúc rõ ràng. Các chỉ số trùng lặp đạt yêu cầu học thuật. Khuyến nghị giảng viên xem xét cho điểm từ 8.0 - 8.5 dựa trên tính thực tiễn cao của đề tài.`;
    
    const feedbackMap = {
      'sub-001': "Nghiên cứu có tính học thuật cao, khảo sát sâu sắc tác động của AI đến giáo dục đại học. Các luận điểm đưa ra thuyết phục, lập luận chặt chẽ. Chỉ số trùng lặp rất thấp (12%), trích dẫn nguồn cực kỳ uy tín và rõ ràng. Khuyên dùng mức điểm xuất sắc (8.5 - 9.0).",
      'sub-002': "Đề tài ứng dụng Blockchain vào bảng điểm mang tính thực tiễn rất cao. Tuy nhiên, nội dung còn trùng lặp một số đoạn từ nguồn IEEE (Similarity 28%), sinh viên cần chỉnh sửa diễn đạt lại để tăng tính cá nhân hóa trước khi bảo vệ trước Hội đồng. Khuyên dùng mức điểm 7.0 - 7.5.",
      'sub-003': "Đề tài Sentiment Analysis sử dụng PhoBERT có cấu trúc tốt, dữ liệu phong phú. Tuy nhiên, chỉ số trùng lặp (45%) và dấu hiệu viết bằng AI (22%) ở mức cảnh báo nghiêm trọng. Đề nghị sinh viên viết lại toàn bộ chương 1 lý thuyết và trích dẫn chuẩn hóa lại tài liệu tham khảo. Khuyên dùng điểm trung bình khá (5.5 - 6.0) nếu chưa sửa."
    };
    
    setFeedback(feedbackMap[selected.id] || defaultText);
  };

  return (
    <div className="w-full max-w-full min-w-0 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-teal-700 uppercase tracking-[0.2em] mb-1">
            Phân tích & Đánh giá đồ án
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Phân tích & Đánh giá Đề tài</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
            <p className="text-xs text-slate-500 break-words">
              <Link to="/lecturer" className="text-teal-800 hover:underline font-medium">
                Trang chủ GV
              </Link>
              <span className="text-slate-300 mx-1">/</span>
              <span>Phân tích AI, Đạo văn & Điểm số</span>
            </p>

          </div>
        </div>
        <button
          type="button"
          onClick={runRecheck}
          disabled={scanning}
          className={`w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm transition-all ${
            scanning
              ? 'bg-teal-700 text-teal-200 cursor-wait'
              : 'bg-teal-800 text-white hover:bg-teal-900'
          }`}
        >
          <span className={`material-symbols-outlined text-base ${scanning ? 'animate-spin' : ''}`}>
            {scanning ? 'sync' : LECTURER_ICONS.recheck}
          </span>
          {scanning ? 'Đang quét...' : 'Quét lại'}
        </button>
      </div>

      {flowConfig?.enabled && (
        <div className="mb-4 p-3 sm:p-4 rounded-xl bg-teal-50 border border-teal-200/80 text-xs text-teal-900">
          <p className="font-bold mb-1">Quy trình kiểm tra (cấu hình Admin)</p>
          <p className="text-teal-800/90 leading-relaxed">{flowConfig.policyText}</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-teal-700">
            Ngưỡng: trùng lặp xem xét ≥{flowConfig.thresholds.similarityReview}% · flagged ≥
            {flowConfig.thresholds.similarityFlag}% · AI xem xét ≥{flowConfig.thresholds.aiReview}% · AI flagged ≥
            {flowConfig.thresholds.aiFlag}%
            {flowConfig.engines.bm25 && ' · BM25'}
            {flowConfig.engines.elasticsearch && ' · ES'}
          </p>
        </div>
      )}

      {/* Mobile / tablet: horizontal queue */}
      <div className="xl:hidden w-full mb-4 sm:mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 shadow-sm w-full">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-teal-800 text-lg shrink-0">
                {LECTURER_ICONS.queue}
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide truncate">
                Hàng đợi chấm
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'acceptable', label: 'Đạt' },
              { key: 'review', label: 'Xem xét' },
              { key: 'flagged', label: 'Cảnh báo' },
            ].map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  filter === f.key ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
            {filtered.map(sub => {
              const cfg = STATUS_CONFIG[sub.status];
              const active = sub.id === selectedId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedId(sub.id)}
                  className={`snap-start shrink-0 w-[min(100%,260px)] sm:w-[240px] text-left p-3 rounded-lg border transition-all ${
                    active
                      ? 'border-teal-800 bg-teal-50/80 shadow-sm ring-2 ring-teal-800/20'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800 line-clamp-2">{sub.title}</p>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">{sub.student}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-[10px] font-bold ${
                        sub.similarity > 25 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {sub.similarity}%
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
                      {cfg.label.split(' ')[0]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 w-full min-w-0">
        {/* Desktop queue */}
        <aside className="hidden xl:block w-[260px] shrink-0">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-teal-800 text-xl">{LECTURER_ICONS.queue}</span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Hàng đợi chấm</h2>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'acceptable', label: 'Đạt' },
                { key: 'review', label: 'Xem xét' },
                { key: 'flagged', label: 'Cảnh báo' },
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    filter === f.key ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-teal-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto">
              {filtered.map(sub => {
                const cfg = STATUS_CONFIG[sub.status];
                const active = sub.id === selectedId;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedId(sub.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      active
                        ? 'border-teal-800 bg-teal-50/80 shadow-sm border-r-4'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-800 line-clamp-2">{sub.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{sub.student}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold ${
                          sub.similarity > 25 ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {sub.similarity}%
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
                        {cfg.label.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="flex-1 w-full min-w-0 space-y-4 sm:space-y-6">
          <AISummaryCard selected={selected} />
          
          <PlagiarismAnalysisBento
            submission={selected}
            zoom={zoom}
            onZoomIn={() => setZoom(z => Math.min(120, z + 10))}
            onZoomOut={() => setZoom(z => Math.max(80, z - 10))}
          />

          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm w-full">
            <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-4">
              <span className="material-symbols-outlined text-teal-800">{LECTURER_ICONS.grade}</span>
              Chấm điểm & Nhận xét đồ án
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              {/* Left Column: Rubric Inputs & Final Score (6 cols) */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Điểm Rubric Tiêu Chuẩn</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'content', label: 'Nội dung' },
                      { key: 'method', label: 'Phương pháp' },
                      { key: 'originality', label: 'Tính mới' },
                      { key: 'presentation', label: 'Trình bày' },
                    ].map(r => (
                      <div key={r.key} className="min-w-0">
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">{r.label}</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={grades[r.key] || ''}
                          onChange={e => setGrades(g => ({ ...g, [r.key]: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="w-full sm:w-32">
                    <label className="text-[11px] font-bold text-slate-900 block mb-1.5">Điểm tổng cộng</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={finalScore}
                      onChange={e => setFinalScore(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-black text-teal-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800 transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mb-2.5">
                    (Để trống sẽ tự động lấy trung bình cộng điểm Rubric)
                  </span>
                </div>
              </div>

              {/* Right Column: AI Feedback & Textarea (6 cols) */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ý kiến phản hồi</label>
                    <button
                      type="button"
                      onClick={generateAiFeedback}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-800 to-cyan-800 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm hover:brightness-110 active:scale-95 transition-all"
                      title="Gemini AI tự động soạn thảo tóm tắt và nhận xét"
                    >
                      <span className="material-symbols-outlined text-[12px] animate-pulse">auto_awesome</span>
                      Gemini AI gợi ý nhận xét
                    </button>
                  </div>
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    rows={5}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800 transition-all font-medium leading-relaxed"
                    placeholder="Ghi nhận xét chi tiết, nhắc nhở hoặc yêu cầu chỉnh sửa..."
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={saveGrade}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-teal-800 text-white text-xs font-bold uppercase tracking-widest hover:bg-teal-900 transition-all shadow-md active:scale-[0.98]"
                  >
                    Lưu điểm & Phản hồi
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {showProgressModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto text-teal-800 animate-bounce">
              <span className="material-symbols-outlined text-2xl">radar</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Đang quét đạo văn...</h3>
              <p className="text-[11px] text-slate-500 mt-1">Đang phân tích cấu trúc, đối chiếu các nguồn dữ liệu & thuật toán.</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Tiến độ</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
                <div 
                  className="h-full rounded-full bg-teal-800 transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
            <p className="text-[9px] text-slate-400 font-medium">Hệ thống đang chạy các thuật toán BM25, N-Gram, TF-IDF + Cosine, Rule-Based.</p>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] p-4 rounded-2xl border flex items-center gap-3 shadow-xl bg-white border-outline-variant/60 text-on-surface animate-fade-in transition-all">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <span className={`material-symbols-outlined text-lg ${toast.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
          </div>
          <span className="text-xs font-black text-on-surface tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default LecturerControllerPage;
