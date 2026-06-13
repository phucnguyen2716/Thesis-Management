import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { thesisService } from '../services/api';
import { logStudentActivity } from '../utils/studentActivityStats';
import { getMajorDefaultImage } from '../utils/majorImages';

const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'pdf') return { icon: 'picture_as_pdf', color: 'text-red-500' };
  if (['doc', 'docx'].includes(ext)) return { icon: 'description', color: 'text-blue-500' };
  if (['xls', 'xlsx'].includes(ext)) return { icon: 'table_chart', color: 'text-emerald-500' };
  if (['ppt', 'pptx'].includes(ext)) return { icon: 'slideshow', color: 'text-amber-500' };
  return { icon: 'insert_drive_file', color: 'text-gray-500' };
};

const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const ThesisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{"role": "Student"}');

  const handleBack = () => {
    if (window.opener) {
      try {
        window.close();
        return;
      } catch (e) {
        console.error(e);
      }
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/theses');
    }
  };

  const combinedMocks = [
    // Mock items from Lookup
    {
      id: 1,
      title: "Impact of Blockchain on Supply Chain Transparency in Emerging Markets",
      studentName: "Tran Ngoc Bao Han",
      studentId: "UEF2023001",
      advisorName: "Dr. Nguyen Minh Tri",
      year: "2023",
      department: "IT Department",
      similarity: "8%",
      similarityLevel: "safe",
      description: "This thesis explores the implementation of Hyperledger Fabric in tracking agricultural products from farm to consumer in Southeast Asia. The study utilizes qualitative research methods to analyze cost-benefit variables, systemic integration hurdles, and regulatory alignment in emerging markets.",
      tags: ["#blockchain", "#supplychain", "#transparency"],
      status: "Approved",
      latestScore: 9.0,
      pdfUrl: "/Document%20Detail.pdf"
    },
    {
      id: 2,
      title: "Economic Shifts in Post-Pandemic Retail: A Comparative Study",
      studentName: "Le Quoc Anh",
      studentId: "UEF2022045",
      advisorName: "Prof. Sarah Jenkins",
      year: "2022",
      department: "Economics Dept.",
      similarity: "32%",
      similarityLevel: "high",
      description: "Researching the transition from brick-and-mortar to omnichannel strategies in the apparel industry during 2020-2022. The paper analyzes consumer behavior changes, logistical challenges, and the digital transformation of brick-and-mortar business models.",
      tags: ["#retail", "#economics"],
      status: "Rejected",
      latestScore: 5.5,
      pdfUrl: "/Document%20Detail.pdf"
    },
    {
      id: 3,
      title: "Artificial Intelligence in Modern Portfolio Management",
      studentName: "Pham Minh Tu",
      studentId: "UEF2024108",
      advisorName: "Dr. Hoang Vu",
      year: "2024",
      department: "Finance Department",
      similarity: "12%",
      similarityLevel: "safe",
      description: "This quantitative research develops a machine learning model based on recurrent neural networks (RNN) to predict stock market volatility. Comparing the AI-driven approach with traditional models, the study highlights the efficacy of deep learning in multi-asset portfolio optimization.",
      tags: ["#AI", "#fintech", "#ML"],
      status: "Approved",
      latestScore: 8.8,
      pdfUrl: "/Document%20Detail.pdf"
    },
    // Mock items from Favorites
    {
      id: "fav-1",
      title: "Ứng dụng Machine Learning trong việc tối ưu hóa năng lượng tòa nhà",
      studentName: "Nguyễn Văn A",
      studentId: "UEF2024099",
      advisorName: "TS. Trần Thị B",
      year: "2024",
      department: "Khoa CNTT",
      similarity: "6%",
      similarityLevel: "safe",
      description: "Đề tài tập trung vào việc xây dựng mô hình dự báo tiêu thụ năng lượng dựa trên dữ liệu lịch sử và các yếu tố môi trường, giúp giảm thiểu 20% chi phí vận hành cho các tòa nhà thông minh tại Việt Nam.",
      tags: ["#SmartCity", "#AI", "#GreenTech"],
      status: "Approved",
      latestScore: 9.5
    },
    {
      id: "fav-2",
      title: "Phát triển hệ thống Blockchain cho truy xuất nguồn gốc nông sản",
      studentName: "Lê Thị C",
      studentId: "UEF2023055",
      advisorName: "ThS. Hoàng Văn D",
      year: "2023",
      department: "Khoa CNTT",
      similarity: "14%",
      similarityLevel: "safe",
      description: "Giải pháp sử dụng nền tảng Hyperledger Fabric để minh bạch hóa chuỗi cung ứng trái cây xuất khẩu, đảm bảo thông tin từ nông trại đến tay người tiêu dùng không thể bị thay đổi.",
      tags: ["#Blockchain", "#AgriTech", "#Export"],
      status: "Approved",
      latestScore: 9.0
    },
    {
      id: "fav-3",
      title: "Thiết kế trải nghiệm người dùng (UX) cho ứng dụng hỗ trợ người khiếm thị",
      studentName: "Phạm Minh E",
      studentId: "UEF2024201",
      advisorName: "TS. Ngô Bảo F",
      year: "2024",
      department: "Khoa CNTT",
      similarity: "18%",
      similarityLevel: "safe",
      description: "Nghiên cứu về các giao diện âm thanh và phản hồi xúc giác nhằm cải thiện khả năng tiếp cận công nghệ cho cộng đồng người yếu thế trong xã hội số.",
      tags: ["#UXUI", "#Accessibility", "#SocialImpact"],
      status: "Approved",
      latestScore: 9.8
    }
  ];

  // Try parsing state if passed during navigate
  const getInitialState = () => {
    if (location.state) {
      const s = location.state;
      return {
        id: s.id,
        title: s.title,
        studentName: s.student || s.studentName,
        studentId: s.studentId || `UEF-${s.id}-X`,
        advisorName: s.advisor || s.advisorName,
        year: s.year || "2024",
        department: s.department || "IT Department",
        major: s.major || s.department || "",
        subjectCode: s.subjectCode || "",
        similarity: s.similarity || "10%",
        similarityLevel: s.similarityLevel || "safe",
        description: s.description || s.desc || "Chưa có mô tả chi tiết.",
        tags: s.tags || ["#research"],
        status: s.status || "Approved",
        latestScore: s.latestScore || 8.5,
        pdfUrl: s.pdfUrl || "/Document%20Detail.pdf",
        submissions: s.submissions || []
      };
    }
    return null;
  };

  const [thesis, setThesis] = useState(getInitialState());
  const [loading, setLoading] = useState(!thesis);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [citationFormat, setCitationFormat] = useState('APA');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!thesis) {
      fetchRealThesis();
    }
  }, [id, thesis]);

  useEffect(() => {
    if (thesis) {
      logStudentActivity('thesis_view', { 
        id: thesis.id, 
        major: thesis.major || thesis.department, 
        tags: thesis.tags 
      });
      try {
        const favs = JSON.parse(localStorage.getItem('studentFavorites') || '[]');
        const exists = favs.some(f => f.id.toString() === thesis.id.toString());
        setIsFavorite(exists);
      } catch (e) {
        setIsFavorite(false);
      }
    }
  }, [thesis]);

  const fetchRealThesis = async () => {
    try {
      const res = await thesisService.getById(id);
      if (res.data) {
        setThesis({
          id: res.data.id,
          title: res.data.title,
          studentName: res.data.studentName,
          studentId: res.data.studentId || `UEF-${res.data.id}-X`,
          advisorName: res.data.advisorName || "Chưa phân công",
          year: res.data.year || "2024",
          department: res.data.department || "Khoa học Công nghệ",
          major: res.data.major || "",
          subjectCode: res.data.subjectCode || "",
          similarity: res.data.similarity || "10%",
          similarityLevel: parseFloat(res.data.similarity) > 20 ? "high" : "safe",
          description: res.data.description || "Chưa có mô tả chi tiết cho sáng kiến này.",
          tags: res.data.tags || ["#research", "#uef"],
          status: res.data.status || "Pending",
          latestScore: res.data.latestScore || null,
          pdfUrl: res.data.pdfUrl || "/Document%20Detail.pdf",
          submissions: res.data.submissions || []
        });
      } else {
        const foundMock = combinedMocks.find(item => item.id.toString() === id.toString());
        if (foundMock) setThesis({ ...foundMock, submissions: foundMock.submissions || [] });
        else setError("Không tìm thấy thông tin sáng kiến.");
      }
    } catch (err) {
      console.error(err);
      const foundMock = combinedMocks.find(item => item.id.toString() === id.toString());
      if (foundMock) {
        setThesis({ ...foundMock, submissions: foundMock.submissions || [] });
      } else {
        setError("Không thể tải thông tin chi tiết từ hệ thống.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getCitationText = () => {
    if (!thesis) return '';
    const nameParts = thesis.studentName.split(' ');
    const lastName = nameParts.pop() || '';
    const initials = nameParts.map(n => n[0]).join('. ');
    
    switch (citationFormat) {
      case 'APA':
        return `${lastName}, ${initials}. (${thesis.year}). ${thesis.title}. UEF Academic Repository.`;
      case 'MLA':
        return `${lastName}, ${thesis.studentName}. "${thesis.title}." UEF Academic Repository, ${thesis.year}.`;
      case 'Chicago':
        return `${lastName}, ${thesis.studentName}. "${thesis.title}." UEF Academic Repository, ${thesis.year}.`;
      default:
        return '';
    }
  };

  const copyCitation = () => {
    navigator.clipboard.writeText(getCitationText());
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px]">Đang truy xuất thông tin lưu trữ...</p>
    </div>
  );

  if (error || !thesis) return (
    <div className="p-12 text-center max-w-lg mx-auto">
      <span className="material-symbols-outlined text-error text-6xl mb-4">warning</span>
      <h2 className="text-2xl font-black text-on-surface mb-2">Đã xảy ra lỗi</h2>
      <p className="text-on-surface-variant mb-6 font-medium text-sm">{error || "Không tìm thấy sáng kiến được yêu cầu."}</p>
      <button 
        onClick={() => navigate('/')} 
        className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-[10px]"
      >
        Về trang chủ
      </button>
    </div>
  );

  const isSimilarityHigh = thesis.similarityLevel === 'high' || parseFloat(thesis.similarity) > 20;

  return (
    <div className="min-h-screen bg-surface-bright relative overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-25">
        <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 py-2 md:py-4 max-w-[1400px] mx-auto animate-fade-in space-y-6 md:space-y-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-[10px] font-black text-on-surface-variant/50 uppercase tracking-[0.15em] mb-4">
          <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Trang chủ</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <button onClick={() => navigate('/theses')} className="hover:text-primary transition-colors">Kho sáng kiến</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-primary font-black">Chi tiết sáng kiến</span>
        </div>

        {/* Main Details Panel */}
        <div className="flex flex-col xl:flex-row gap-6 md:gap-8 items-start">
          
          {/* Main Info Block */}
          <div className="flex-1 w-full space-y-8">
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 md:p-10 border border-outline-variant shadow-sm relative overflow-hidden">
              
              {/* Cover Banner Image */}
              <div className="h-48 sm:h-64 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 md:-mx-10 md:-mt-10 mb-8 overflow-hidden relative">
                <img 
                  src={getMajorDefaultImage(thesis.major || thesis.department)} 
                  alt="" 
                  className="w-full h-full object-cover opacity-90 transition-transform duration-500 hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/25"></div>
              </div>
              
              {/* Top Row Badges */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-[9px] font-black uppercase tracking-widest rounded-md border border-outline-variant/30">
                    MÃ SỐ: #{thesis.id}
                  </span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-md">
                    {thesis.department}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest bg-surface-container-low px-4 py-1 rounded-full border border-outline-variant/10">
                    Niên khóa: {thesis.year}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    thesis.status === 'Approved' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {thesis.status}
                  </span>
                </div>
              </div>

              {/* Title and Authors */}
              <div className="space-y-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-on-surface leading-tight tracking-tight">
                  {thesis.title}
                </h1>

                <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-outline-variant/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center border border-primary/10 shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-xl">person</span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-1">Tác giả (Sinh viên)</p>
                      <p className="text-base font-black text-on-surface line-clamp-1">{thesis.studentName}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium opacity-60">MSSV: {thesis.studentId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary-container/10 text-primary rounded-2xl flex items-center justify-center border border-outline-variant/30 shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-xl">psychology</span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-1">Giảng viên hướng dẫn</p>
                      <p className="text-base font-black text-on-surface line-clamp-1">{thesis.advisorName}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium opacity-60">Cố vấn học thuật</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Tabs */}
            <div className="flex border-b border-outline-variant/50 gap-6 overflow-x-auto whitespace-nowrap scrollbar-none">
              {[
                { id: 'overview', label: 'Tóm tắt & Lĩnh vực', icon: 'subject' },
                { id: 'document', label: 'Bản thảo tài liệu', icon: 'article' },
                { id: 'gemini', label: 'Gemini AI Đánh giá', icon: 'auto_awesome' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-4 font-black text-xs uppercase tracking-widest border-b-2 transition-all relative px-1 ${
                    activeTab === tab.id 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-on-surface-variant opacity-50 hover:opacity-80'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  {tab.label}
                  {tab.id === 'gemini' && (
                    <span className="absolute -top-1.5 -right-3 w-2 h-2 bg-primary rounded-full animate-ping"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="animate-fade-in duration-300">
              
              {/* Tab: Overview */}
              {activeTab === 'overview' && (
                <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-outline-variant shadow-sm space-y-6">
                  <div>
                    <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">segment</span>
                      Tóm tắt đề tài sáng kiến
                    </h3>
                    <p className="text-on-surface leading-relaxed text-sm font-medium whitespace-pre-wrap italic pl-4 border-l-4 border-primary/20">
                      "{thesis.description}"
                    </p>
                  </div>

                  <div className="pt-6 border-t border-outline-variant/20 space-y-4">
                    <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Từ khóa khoa học</h3>
                    <div className="flex flex-wrap gap-2">
                      {thesis.tags.map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="px-4 py-2 bg-surface-container-low text-xs font-bold text-on-surface-variant rounded-xl border border-outline-variant/30 hover:border-primary/20 hover:text-primary transition-all cursor-pointer"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Document Draft */}
              {activeTab === 'document' && (
                <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-outline-variant shadow-sm space-y-6">
                  <div>
                    <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">folder_open</span>
                      Tài liệu và tệp tin liên quan ({thesis.submissions?.length || 0})
                    </h3>
                  </div>

                  {!thesis.submissions || thesis.submissions.length === 0 ? (
                    <div className="text-center py-12 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
                      <span className="material-symbols-outlined text-on-surface-variant/40 text-5xl mb-3">folder_zip</span>
                      <p className="text-sm font-black text-on-surface">Chưa có tài liệu sáng kiến</p>
                      <p className="text-xs text-on-surface-variant opacity-75 max-w-xs mx-auto mt-1">
                        Hiện tại chưa có tệp tin hoặc tài liệu nào được đồng bộ từ thư mục Drive cho sáng kiến này.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {thesis.submissions.map((sub, idx) => {
                        const fileInfo = getFileIcon(sub.fileName);
                        const isPdf = sub.fileName.toLowerCase().endsWith('.pdf') || sub.filePath.toLowerCase().endsWith('.pdf');
                        return (
                          <div 
                            key={sub.id || idx}
                            className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl hover:border-primary/20 hover:shadow-md transition-all flex-wrap gap-4"
                          >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center border border-outline-variant/10 shrink-0">
                                <span className={`material-symbols-outlined text-2xl ${fileInfo.color}`}>
                                  {fileInfo.icon}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-black text-on-surface truncate" title={sub.fileName}>
                                  {sub.fileName}
                                </h4>
                                <p className="text-[10px] text-on-surface-variant opacity-60 font-medium">
                                  Dung lượng: {formatSize(sub.fileSize)} | Ngày đồng bộ: {formatDate(sub.submittedAt)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Keep 3D Flipbook viewer for converted PDF files */}
                              {isPdf && (
                                <button 
                                  onClick={() => {
                                    logStudentActivity('thesis_download', { 
                                      id: thesis.id, 
                                      major: thesis.major || thesis.department, 
                                      tags: thesis.tags 
                                    });
                                    window.open(`/theses/${thesis.id}/flipbook?file=${encodeURIComponent(sub.filePath)}`, '_blank');
                                  }}
                                  className="px-5 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/95 transition-all flex items-center gap-2 shadow-sm border-none cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm">menu_book</span> Đọc sách 3D
                                </button>
                              )}
                              
                              {/* View / Download button depending on whether it's local or drive url */}
                              <button 
                                onClick={() => {
                                  logStudentActivity('thesis_download', { 
                                    id: thesis.id, 
                                    major: thesis.major || thesis.department, 
                                    tags: thesis.tags 
                                  });
                                  if (sub.filePath.startsWith('http')) {
                                    window.open(sub.filePath, '_blank');
                                  } else {
                                    window.open(`http://localhost:5145${sub.filePath}`, '_blank');
                                  }
                                }}
                                className="px-5 py-2.5 bg-on-surface text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all flex items-center gap-2 shadow-sm border-none cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  {sub.filePath.startsWith('http') ? 'open_in_new' : 'download'}
                                </span>
                                {sub.filePath.startsWith('http') ? 'Mở trên Drive' : 'Tải xuống'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Gemini AI */}
              {activeTab === 'gemini' && (
                <div className="bg-gradient-to-br from-surface-container-low to-primary/5 rounded-[2.5rem] p-6 sm:p-8 border border-primary/20 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="material-symbols-outlined text-7xl text-primary animate-pulse">auto_awesome</span>
                  </div>

                  <div className="flex items-center gap-2 text-primary mb-6">
                    <span className="material-symbols-outlined animate-spin-slow">auto_awesome</span>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em]">Phân tích thông minh bởi Gemini AI</h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 relative z-10">
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-primary/10 shadow-sm">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs">emoji_objects</span> Điểm độc đáo & Đóng góp
                      </h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed font-bold">
                        Đề tài giải quyết trực quan các bài toán tối ưu thực tiễn bằng việc phối hợp linh hoạt các công nghệ tiên tiến (AI, Machine Learning, Blockchain). Khung lý thuyết xây dựng tỉ mỉ và cấu trúc thực chứng chặt chẽ.
                      </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-primary/10 shadow-sm">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs">query_stats</span> Đánh giá khoa học
                      </h4>
                      <ul className="text-xs text-on-surface-variant space-y-2.5 font-bold">
                        <li className="flex gap-2">
                          <span className="text-primary">•</span> Điểm số chuyên môn ước lượng: Đánh giá Xuất sắc (9.0/10).
                        </li>
                        <li className="flex gap-2">
                          <span className="text-primary">•</span> Cơ hội mở rộng: Hoàn toàn đủ tiềm lực chuyển đổi sang các đề tài ứng dụng thực tế hoặc công bố khoa học.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Similarity Audit Panel */}
          <div className="w-full xl:w-[350px] space-y-6 shrink-0">
            
            {/* Plagiarism Similarity Check */}
            <div className={`bg-white rounded-[2.5rem] p-6 border ${isSimilarityHigh ? 'border-red-200' : 'border-emerald-200'} shadow-sm relative overflow-hidden`}>
              
              {/* Subtle top indicator bar */}
              <div className={`absolute top-0 inset-x-0 h-1.5 ${isSimilarityHigh ? 'bg-error' : 'bg-emerald-500'}`}></div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">
                  Chỉ số trùng lắp
                </span>
                <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md ${
                  isSimilarityHigh ? 'bg-red-50 text-error border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {isSimilarityHigh ? 'HIGH RISK' : 'SAFE INDEX'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 mb-6">
                {/* Gauge visualization */}
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="32" 
                      stroke="#f1f3f4" 
                      strokeWidth="6" 
                      fill="transparent" 
                    />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="32" 
                      stroke={isSimilarityHigh ? '#d32f2f' : '#10b981'} 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - parseFloat(thesis.similarity) / 100)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base font-black text-on-surface leading-none">{thesis.similarity}</span>
                    <span className="text-[7px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">trùng</span>
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <h4 className="text-xs font-black text-on-surface">Kiểm trùng: {thesis.similarity}</h4>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed opacity-75 font-medium">
                    {isSimilarityHigh 
                      ? 'Cảnh báo: Chỉ số trùng lắp vượt giới hạn cho phép (20%). Cần hiệu chỉnh lại tài liệu.' 
                      : 'Nằm trong ngưỡng an toàn cho phép theo quy chế đào tạo học thuật tại UEF.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Academic Citation Generator */}
            <div className="bg-white rounded-[2.5rem] p-6 border border-outline-variant shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-lg">format_quote</span>
                <h3 className="text-xs font-black uppercase tracking-widest">Trích dẫn tài liệu khoa học</h3>
              </div>

              {/* Citation Selector Tabs */}
              <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl border border-outline-variant/30">
                {['APA', 'MLA', 'Chicago'].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setCitationFormat(fmt)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      citationFormat === fmt 
                        ? 'bg-white text-primary shadow-sm border border-outline-variant/20' 
                        : 'text-on-surface-variant opacity-60 hover:opacity-100'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {/* Citation Area */}
              <div className="relative group bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 min-h-[72px] flex items-center">
                <p className="text-[11px] font-bold text-on-surface leading-normal select-all pr-8 break-words italic">
                  {getCitationText()}
                </p>
                <button
                  onClick={copyCitation}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center transition-all text-on-surface-variant"
                  title="Sao chép trích dẫn"
                >
                  <span className="material-symbols-outlined text-base">
                    {copiedCitation ? 'done' : 'content_copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Actions Quick Card */}
            <div className="bg-white rounded-[2.5rem] p-6 border border-outline-variant shadow-sm space-y-3">
              {thesis.latestScore && (
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Điểm số bảo vệ</span>
                  <span className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm shadow-md">
                    {thesis.latestScore.toFixed(1)}
                  </span>
                </div>
              )}
              
              {user.role === 'Advisor' && (
                <button className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">edit_note</span> Nhập điểm & Nhận xét
                </button>
              )}

              <button 
                onClick={() => {
                  try {
                    const favs = JSON.parse(localStorage.getItem('studentFavorites') || '[]');
                    if (isFavorite) {
                      const updated = favs.filter(f => f.id.toString() !== thesis.id.toString());
                      localStorage.setItem('studentFavorites', JSON.stringify(updated));
                      setIsFavorite(false);
                    } else {
                      const newFav = {
                        id: thesis.id,
                        title: thesis.title,
                        student: thesis.studentName,
                        advisor: thesis.advisorName,
                        year: thesis.year,
                        major: thesis.major || thesis.department,
                        tags: thesis.tags || ['#research'],
                        stats: { views: "1.0k", downloads: "200", rating: "4.8" },
                        description: thesis.description,
                        pdfUrl: thesis.pdfUrl
                      };
                      favs.push(newFav);
                      localStorage.setItem('studentFavorites', JSON.stringify(favs));
                      setIsFavorite(true);
                      logStudentActivity('thesis_favorite', { 
                        id: thesis.id, 
                        major: thesis.major || thesis.department, 
                        tags: thesis.tags 
                      });
                    }
                    window.dispatchEvent(new Event('student-favorites-updated'));
                  } catch (e) {
                    console.error("Failed to toggle favorite", e);
                  }
                }}
                className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                  isFavorite 
                    ? 'bg-slate-200 text-on-surface-variant hover:bg-red-50 hover:text-red-600 border border-outline-variant/30' 
                    : 'bg-on-surface text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {isFavorite ? 'bookmark_remove' : 'bookmark'}
                </span>
                {isFavorite ? 'Xóa khỏi thư viện' : 'Lưu vào thư viện'}
              </button>
              
              <button 
                onClick={handleBack}
                className="w-full py-3.5 bg-transparent border-2 border-outline-variant/50 text-on-surface rounded-xl font-bold uppercase tracking-widest text-[10px] hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span> Quay lại danh sách
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ThesisDetail;
