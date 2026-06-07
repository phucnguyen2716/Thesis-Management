import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { thesisService } from '../services/api';

const FlipbookPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [thesis, setThesis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const combinedMocks = [
    {
      id: 1,
      title: "Impact of Blockchain on Supply Chain Transparency in Emerging Markets",
      studentName: "Tran Ngoc Bảo Hân",
      advisorName: "Dr. Nguyễn Minh Trí",
      year: "2023",
      department: "IT Department"
    },
    {
      id: 2,
      title: "Economic Shifts in Post-Pandemic Retail: A Comparative Study",
      studentName: "Lê Quốc Anh",
      advisorName: "Prof. Sarah Jenkins",
      year: "2022",
      department: "Economics Dept."
    },
    {
      id: 3,
      title: "Artificial Intelligence in Modern Portfolio Management",
      studentName: "Phạm Minh Tú",
      advisorName: "Dr. Hoàng Vũ",
      year: "2024",
      department: "Finance Department"
    },
    {
      id: "fav-1",
      title: "Ứng dụng Machine Learning trong việc tối ưu hóa năng lượng tòa nhà",
      studentName: "Nguyễn Văn A",
      advisorName: "TS. Trần Thị B",
      year: "2024",
      department: "Khoa CNTT"
    },
    {
      id: "fav-2",
      title: "Phát triển hệ thống Blockchain cho truy xuất nguồn gốc nông sản",
      studentName: "Lê Thị C",
      advisorName: "ThS. Hoàng Văn D",
      year: "2023",
      department: "Khoa CNTT"
    },
    {
      id: "fav-3",
      title: "Thiết kế trải nghiệm người dùng (UX) cho ứng dụng hỗ trợ người khiếm thị",
      studentName: "Phạm Minh E",
      advisorName: "TS. Ngô Bảo F",
      year: "2024",
      department: "Khoa CNTT"
    }
  ];

  useEffect(() => {
    // 1. Try to load from navigation state
    if (location.state) {
      setThesis({
        ...location.state,
        pdfUrl: location.state.filePath || location.state.pdfUrl || "/Document%20Detail.pdf"
      });
      setLoading(false);
      return;
    }

    // 2. Fetch from service or mock fallback
    const fetchThesis = async () => {
      try {
        const res = await thesisService.getById(id);
        if (res.data) {
          setThesis({
            ...res.data,
            pdfUrl: res.data.filePath || "/Document%20Detail.pdf"
          });
        } else {
          const mock = combinedMocks.find(m => m.id.toString() === id.toString());
          setThesis(mock || { id, title: "Đề tài nghiên cứu học thuật", studentName: "Sinh viên UEF", pdfUrl: "/Document%20Detail.pdf" });
        }
      } catch (err) {
        console.error(err);
        const mock = combinedMocks.find(m => m.id.toString() === id.toString());
        setThesis(mock || { id, title: "Đề tài nghiên cứu học thuật", studentName: "Sinh viên UEF", pdfUrl: "/Document%20Detail.pdf" });
      } finally {
        setLoading(false);
      }
    };

    fetchThesis();
  }, [id, location.state]);

  // Initialize the DearFlip viewer programmatically when loaded
  useEffect(() => {
    if (loading || !thesis) return;

    const initFlipbook = () => {
      const container = document.getElementById("flipbookContainer");
      if (container) {
        container.innerHTML = "";
        
        const flipNode = document.createElement("div");
        flipNode.className = "_df_book";
        flipNode.setAttribute("height", "100%");
        flipNode.setAttribute("webgl", "true");
        flipNode.setAttribute("backgroundcolor", "#111115");
        
        // Set element attributes as fallback
        flipNode.setAttribute("pagemode", isMobile ? "1" : "auto");
        flipNode.setAttribute("singlepagemode", "1");

        // Define JS configuration options for the book ID
        window.option_df_manual_book = {
          pageMode: isMobile ? 1 : 0, // 1 = SINGLE, 0 = AUTO (detect device)
          singlePageMode: 1, // 1 = ZOOM
          webgl: true,
          backgroundColor: "#111115"
        };
        
        // Using the PDF source from thesis data dynamically
        const pdfSource = thesis.pdfUrl || "/Document%20Detail.pdf";
        flipNode.setAttribute("source", pdfSource);
        flipNode.setAttribute("id", "df_manual_book");
        
        container.appendChild(flipNode);

        // Force dFlip to parse the new declarative node
        if (window.DFLIP && window.DFLIP.parseBooks) {
          window.DFLIP.parseBooks();
        } else {
          // If script is loading slow, try again in 500ms
          setTimeout(() => {
            if (window.DFLIP && window.DFLIP.parseBooks) {
              window.DFLIP.parseBooks();
            }
          }, 500);
        }
      }
    };

    // Small delay to ensure react has committed the container to DOM
    const timer = setTimeout(initFlipbook, 150);
    return () => clearTimeout(timer);
  }, [loading, thesis, isMobile]);

  return (
    <div className="w-full h-screen bg-[#111115] text-white flex flex-col overflow-hidden select-none">
      {/* Immersive 3D Book Layout Style Overrides */}
      <style>{`
        .df-container {
          min-height: 100% !important;
          height: 100% !important;
          background-color: #111115 !important;
        }
        .df-book-stage {
          padding: 15px 15px 70px !important;
        }
        .df-container .df-ui-controls {
          background-color: rgba(22, 22, 28, 0.95) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(10px) !important;
        }
        @media (max-width: 768px) {
          .df-book-stage {
            padding: 5px 2px 60px !important;
          }
          .df-container .df-ui-btn {
            width: 32px !important;
            padding: 12px 2px !important;
          }
        }
      `}</style>
      {/* Immersive Header */}
      <header className="h-16 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between bg-[#16161c]/80 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-grow mr-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider text-gray-300 border border-white/5 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span className="hidden sm:inline">Quay lại</span>
          </button>
          <div className="h-6 w-[1px] bg-white/10 shrink-0"></div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm md:text-base font-black tracking-tight text-white truncate" title={thesis?.title}>
              {loading ? "Đang tải tài liệu..." : thesis?.title}
            </h1>
            <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 truncate whitespace-nowrap">
              {loading ? "" : `${thesis?.studentName || 'Sinh viên'} · Năm ${thesis?.year || '2024'}`}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 bg-primary/20 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-widest rounded-md hidden md:inline-block">
            3D Flipbook Reader
          </span>
          <span className="px-2.5 py-1 bg-white/5 text-gray-400 border border-white/5 text-[9px] font-black uppercase tracking-widest rounded-md">
            UEF Academic
          </span>
        </div>
      </header>

      {/* Flipbook Container Viewport */}
      <div className="flex-1 w-full bg-[#111115] relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Đang tạo cấu trúc sách 3D...</p>
          </div>
        ) : (
          <div id="flipbookContainer" className="w-full h-full"></div>
        )}
      </div>
    </div>
  );
};

export default FlipbookPage;
