import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { chatbotService } from '../services/api';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{"role": "Student", "fullName": "Người dùng Demo"}');

  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'vi');

  useEffect(() => {
    const handleLangChange = () => {
      setLang(localStorage.getItem('lang') || 'vi');
    };
    window.addEventListener('language-changed', handleLangChange);
    return () => window.removeEventListener('language-changed', handleLangChange);
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === 'vi' ? 'en' : 'vi';
    localStorage.setItem('lang', newLang);
    window.dispatchEvent(new Event('language-changed'));
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
    } catch {
      return true;
    }
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [expandedThesisType, setExpandedThesisType] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: lang === 'vi' ? "Xin chào! Tôi có thể hỗ trợ gì cho bạn về hệ thống đề tài?" : "Hello! How can I assist you with the academic thesis system?", sender: "system", time: "10:00" }
  ]);

  useEffect(() => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === 1) {
        return {
          ...msg,
          text: lang === 'vi' 
            ? "Xin chào! Tôi có thể hỗ trợ gì cho bạn về hệ thống đề tài?"
            : "Hello! How can I assist you with the academic thesis system?"
        };
      }
      return msg;
    }));
  }, [lang]);

  const formatTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "10:00";
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await chatbotService.getHistory();
      const historyData = res.data || [];
      const sortedHistory = [...historyData].reverse();
      
      const loadedMessages = [
        { 
          id: 1, 
          text: lang === 'vi' 
            ? "Xin chào! Tôi có thể hỗ trợ gì cho bạn về hệ thống đề tài?" 
            : "Hello! How can I assist you with the academic thesis system?", 
          sender: "system", 
          time: "10:00" 
        }
      ];
      
      sortedHistory.forEach(item => {
        if (item.prompt) {
          loadedMessages.push({
            id: `${item.id}-prompt`,
            text: item.prompt,
            sender: "user",
            time: formatTime(item.createdAt)
          });
        }
        if (item.message) {
          loadedMessages.push({
            id: `${item.id}-msg`,
            text: item.message,
            sender: "system",
            time: formatTime(item.createdAt)
          });
        }
      });
      
      setMessages(loadedMessages);
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      fetchChatHistory();
    }
  }, [isChatOpen]);

  const getNavItems = () => {
    const baseItems = [
      { label: lang === 'vi' ? 'Trang chủ' : 'Home', icon: 'home', path: '/' },
      { label: lang === 'vi' ? 'Tra cứu đề tài' : 'Thesis Search', icon: 'search', path: '/lookup' },
    ];

    if (user.role === 'Advisor') {
      return [
        ...baseItems,
        { label: lang === 'vi' ? 'Portal giảng viên' : 'Advisor Portal', icon: 'supervisor_account', path: '/lecturer' },
        { label: lang === 'vi' ? 'Lịch hội đồng' : 'Committee Schedule', icon: 'calendar_month', path: '/schedule' },
      ];
    }


    return [
      ...baseItems,
      { label: lang === 'vi' ? 'Luyện đồ án' : 'Thesis Practice', icon: 'edit_document', path: '/practice' },
      { label: lang === 'vi' ? 'Đề tài yêu thích' : 'Favorite Theses', icon: 'bookmark', path: '/favorites' },
      { label: lang === 'vi' ? 'Hướng dẫn tra cứu' : 'Search Guidelines', icon: 'menu_book', path: '/guidelines' },
    ];
  };

  const navItems = getNavItems();

  const getBottomNavItems = () => {
    const items = [
      { label: lang === 'vi' ? 'Trang chủ' : 'Home', icon: 'home', path: '/' },
    ];
    
    if (user.role === 'Advisor') {
      items.push(
        { label: lang === 'vi' ? 'Giảng viên' : 'Advisor', icon: 'supervisor_account', path: '/lecturer' },
        { label: lang === 'vi' ? 'Lịch học' : 'Schedule', icon: 'calendar_month', path: '/schedule' }
      );
    } else if (user.role === 'Admin') {
      items.push(
        { label: 'Admin', icon: 'admin_panel_settings', path: '/admin' },
        { label: lang === 'vi' ? 'SV' : 'Students', icon: 'school', path: '/admin/students' }
      );
    } else {
      items.push(
        { label: lang === 'vi' ? 'Luyện đồ án' : 'Practice', icon: 'edit_document', path: '/practice' },
        { label: lang === 'vi' ? 'Đề tài' : 'Search', icon: 'search', path: '/lookup' }
      );
    }
    
    items.push({ label: lang === 'vi' ? 'Hồ sơ' : 'Profile', icon: 'person', path: '/profile' });
    return items;
  };

  const bottomNavItems = getBottomNavItems();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userPrompt = chatMessage;
    const newMessage = {
      id: Date.now(),
      text: userPrompt,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setChatMessage('');

    // Pre-insert a "thinking" bubble
    const thinkingId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: thinkingId,
      text: lang === 'vi' ? "Đang kết nối AI..." : "Connecting to AI...",
      sender: "system",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    try {
      const res = await chatbotService.chat(userPrompt);
      const data = res.data;

      setMessages(prev => prev.map(m => m.id === thinkingId ? {
        ...m,
        text: data.message || (lang === 'vi' ? "Không thể tải phản hồi." : "Failed to load response.")
      } : m));
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === thinkingId ? {
        ...m,
        text: lang === 'vi' ? "Không thể kết nối đến máy chủ AI. Vui lòng thử lại!" : "Unable to connect to the AI server. Please try again!"
      } : m));
    }
  };

  const renderMessageText = (text, sender) => {
    if (!text) return null;

    // Regex to match either [THESIS_CARD:id=...|title=...|student=...] OR standard markdown [Label](url)
    const tokenRegex = /(\[THESIS_CARD:id=[^|]+\|title=[^|]+\|student=[^\]]+\]|\[[^\]]+\]\([^)]+\))/g;
    const parts = text.split(tokenRegex);

    const linkClass = sender === 'user'
      ? "underline font-black text-yellow-300 hover:text-yellow-100 transition-colors"
      : "underline font-black text-primary hover:text-[#8C000E] transition-colors";

    return parts.map((part, index) => {
      if (!part) return null;

      // 1. Check if it's a THESIS_CARD
      if (part.startsWith('[THESIS_CARD:')) {
        const cardRegex = /\[THESIS_CARD:id=([^|]+)\|title=([^|]+)\|student=([^\]]+)\]/;
        const match = cardRegex.exec(part);
        if (match) {
          const cardId = match[1];
          const cardTitle = match[2];
          const cardStudent = match[3];

          return (
            <div 
              key={`card-${cardId}-${index}`} 
              className="my-3 flex gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 bg-white rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-all group max-w-full text-on-surface"
            >
              {/* Left: Beautiful CSS book cover (vertical rectangle) */}
              <div className="w-[60px] h-[85px] shrink-0 rounded-lg bg-gradient-to-br from-[#A30010] to-[#60000A] p-1.5 flex flex-col justify-between text-white relative shadow-sm border border-[#A30010]/20 overflow-hidden select-none">
                {/* Book spine shadow */}
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-r from-black/30 to-transparent" />
                {/* Gold trim lines */}
                <div className="absolute inset-1 border border-yellow-500/20 rounded-md pointer-events-none" />
                
                <div className="flex justify-between items-start z-10">
                  <span className="text-[7px] font-black tracking-widest text-yellow-400 opacity-80 uppercase leading-none">UEF</span>
                  <span className="material-symbols-outlined text-[10px] text-yellow-400">school</span>
                </div>
                
                <div className="flex flex-col items-center justify-center flex-1 my-1 z-10 text-center">
                  <span className="text-[8px] font-black text-yellow-400 leading-none">ID</span>
                  <span className="text-[12px] font-black leading-none mt-0.5 tracking-tight text-white">{cardId}</span>
                </div>
                
                <div className="text-center z-10">
                  <p className="text-[5px] font-black uppercase tracking-[0.1em] text-yellow-500/80 leading-none">Thesis</p>
                </div>
              </div>

              {/* Right: Details & Nav links */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] md:text-[12px] font-extrabold text-on-surface line-clamp-2 leading-tight group-hover:text-primary transition-colors" title={cardTitle}>
                    {cardTitle}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1.5 text-on-surface-variant/70">
                    <span className="material-symbols-outlined text-[12px] shrink-0">person</span>
                    <span className="text-[9.5px] md:text-[10px] font-bold truncate">{cardStudent}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-black/5">
                  <Link 
                    to={`/theses/${cardId}`} 
                    onClick={() => setIsChatOpen(false)}
                    className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-primary hover:text-[#8C000E] hover:underline transition-colors"
                  >
                    <span className="material-symbols-outlined text-[12px] shrink-0">info</span>
                    Chi tiết đề tài
                  </Link>
                  <Link 
                    to={`/theses/${cardId}/flipbook`} 
                    onClick={() => setIsChatOpen(false)}
                    className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-primary hover:text-[#8C000E] hover:underline transition-colors"
                  >
                    <span className="material-symbols-outlined text-[12px] shrink-0">menu_book</span>
                    Đọc sách 3D
                  </Link>
                </div>
              </div>
            </div>
          );
        }
      }

      // 2. Check if it's a Markdown Link
      if (part.startsWith('[') && part.includes('](')) {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
        const match = linkRegex.exec(part);
        if (match) {
          const label = match[1];
          const url = match[2];
          const isInternal = url.startsWith('/');

          if (isInternal) {
            return (
              <Link 
                key={`link-${index}`} 
                to={url} 
                onClick={() => setIsChatOpen(false)}
                className={linkClass}
              >
                {label}
              </Link>
            );
          } else {
            return (
              <a 
                key={`link-${index}`} 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={linkClass}
              >
                {label}
              </a>
            );
          }
        }
      }

      // 3. Otherwise, it is text. Parse bold (**text**) and line breaks/bullets.
      const lineRegex = /\r?\n/;
      const lines = part.split(lineRegex);

      return lines.map((line, lineIdx) => {
        // Parse list bullet markers at the start of a line
        let cleanLine = line;
        let isBullet = false;
        if (/^\s*[•*\-]\s+/.test(line)) {
          cleanLine = line.replace(/^\s*[•*\-]\s+/, '');
          isBullet = true;
        }

        // Parse bold markdown **text**
        const boldRegex = /(\*\*[^*]+\*\*)/g;
        const boldParts = cleanLine.split(boldRegex);

        const renderedLine = boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith('**') && bPart.endsWith('**')) {
            const boldText = bPart.substring(2, bPart.length - 2);
            return (
              <strong 
                key={`bold-${bIdx}`} 
                className={sender === 'user' ? "font-extrabold text-yellow-200" : "font-extrabold text-primary"}
              >
                {boldText}
              </strong>
            );
          }
          return bPart;
        });

        return (
          <React.Fragment key={`line-${lineIdx}`}>
            {isBullet ? (
              <span className="flex items-start gap-2 my-1.5 pl-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 select-none ${
                  sender === 'user' ? 'bg-yellow-300' : 'bg-primary/60'
                }`} />
                <span className="flex-1">{renderedLine}</span>
              </span>
            ) : (
              renderedLine
            )}
            {lineIdx < lines.length - 1 && <br />}
          </React.Fragment>
        );
      });
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-on-background relative pb-16 md:pb-0">
      {/* TopAppBar - Not Sticky/Fixed (does not scroll with page) */}
      <header className="sticky top-0 flex justify-between items-center h-[72px] px-4 md:px-10 w-full bg-primary shadow-[0_4px_20px_rgba(140,0,14,0.15)] border-b border-white/10 relative z-50">
        <div className="flex items-center gap-3 md:gap-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="material-symbols-outlined text-on-primary p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-90"
          >
            {isSidebarOpen ? 'menu_open' : 'menu'}
          </button>
          <div className="flex items-center gap-1.5 md:gap-3">
            <div className="hidden sm:flex w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-primary text-xl md:text-2xl font-bold">school</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base md:text-xl font-extrabold text-on-primary tracking-tight leading-none uppercase">UEF Portal</span>
              <span className="hidden md:block text-[8px] md:text-[9px] font-black text-on-primary/60 uppercase tracking-[0.2em] mt-1 md:mt-1.5">{lang === 'vi' ? 'Hệ thống Đề tài' : 'Thesis Portal'}</span>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-4 py-1.5 pl-1.5 pr-4 bg-white/10 hover:bg-white/15 rounded-full border border-white/10 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-on-primary/30 group-hover:border-on-primary transition-colors">
              <img
                alt="User profile avatar"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-primary leading-none">{user.fullName}</span>
              <span className="text-[9px] font-black text-on-primary/50 uppercase tracking-widest mt-1">{user.role}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/analysis')}
              title="Gemini AI Analysis"
              className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white text-on-primary hover:text-primary rounded-xl transition-all font-black text-[11px] uppercase tracking-widest shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              Gemini AI
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                title="Notifications" 
                className={`material-symbols-outlined text-on-primary p-2.5 rounded-full transition-all relative ${isNotifOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
              >
                notifications
                <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full border border-primary animate-pulse"></span>
              </button>

              {isNotifOpen && (
                <div className="absolute top-full right-0 mt-3 w-80 bg-white/90 backdrop-blur-2xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="p-4 bg-gradient-to-r from-primary to-[#8C000E] text-on-primary flex justify-between items-center shadow-md">
                    <h3 className="font-black text-[11px] uppercase tracking-[0.15em]">Thông báo mới</h3>
                    <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-md">3 chưa đọc</span>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {[
                      { title: 'Đề tài mới', desc: 'Nguyễn Văn A vừa nộp đề tài AI Chatbot', time: '10 phút trước', icon: 'description', color: 'text-blue-600', bg: 'bg-blue-50' },
                      { title: 'Lịch bảo trì', desc: 'Bảo trì máy chủ UEF Portal lúc 00:00.', time: '2 giờ trước', icon: 'settings', color: 'text-orange-600', bg: 'bg-orange-50' },
                      { title: 'Đánh giá hoàn tất', desc: 'Đồ án của bạn đã được Giảng viên chấm điểm.', time: '1 ngày trước', icon: 'fact_check', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    ].map((n, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 border-b border-black/5 hover:bg-black/[0.02] transition-colors cursor-pointer group">
                        <div className={`w-11 h-11 rounded-full ${n.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-black/5`}>
                          <span className={`material-symbols-outlined text-xl ${n.color}`}>{n.icon}</span>
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-primary transition-colors">{n.title}</p>
                          <p className="text-[12px] font-medium text-gray-500 mt-1 leading-snug line-clamp-2">{n.desc}</p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center bg-gray-50/80 hover:bg-gray-100 transition-colors cursor-pointer border-t border-black/5 backdrop-blur-md">
                    <span className="text-[11px] font-black uppercase tracking-widest text-primary">Xem tất cả thông báo</span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-on-primary rounded-xl border border-white/10 transition-all font-black text-[11px] uppercase tracking-widest shadow-sm active:scale-95"
              title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            >
              <span className="material-symbols-outlined text-base">translate</span>
              <span>{lang === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}</span>
            </button>
            <span className="w-[1px] h-6 bg-white/10 mx-1"></span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white text-on-primary hover:text-primary rounded-xl transition-all font-black text-[11px] uppercase tracking-widest shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              {lang === 'vi' ? 'Đăng xuất' : 'Log Out'}
            </button>
          </div>
        </div>

        {/* Mobile Header Icons */}
        <div className="lg:hidden flex items-center gap-1.5">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-0.5 px-2 py-1 bg-white/10 hover:bg-white/20 text-on-primary rounded-lg border border-white/10 transition-all font-black text-[9px] uppercase tracking-widest shadow-sm active:scale-95"
            title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          >
            <span className="material-symbols-outlined text-xs">translate</span>
            <span>{lang === 'vi' ? 'VI' : 'EN'}</span>
          </button>
          <button 
            onClick={() => navigate('/analysis')}
            title="Gemini AI"
            className="material-symbols-outlined text-on-primary p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            auto_awesome
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              title="Notifications" 
              className="material-symbols-outlined text-on-primary p-2 hover:bg-white/10 rounded-full transition-colors relative"
            >
              notifications
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-primary animate-pulse"></span>
            </button>
            
            {isNotifOpen && (
              <div className="absolute top-full right-0 mt-3 w-72 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-300">
                <div className="p-3 bg-primary text-on-primary flex justify-between items-center text-xs font-bold">
                  <span>THÔNG BÁO</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full">3 mới</span>
                </div>
                <div className="max-h-[240px] overflow-y-auto">
                  {[
                    { title: 'Đề tài mới', time: '10 phút trước' },
                    { title: 'Lịch bảo trì hệ thống', time: '2 giờ trước' },
                    { title: 'Đánh giá hoàn tất', time: '1 ngày trước' }
                  ].map((n, i) => (
                    <div key={i} className="p-3 border-b border-black/5 hover:bg-black/[0.02] cursor-pointer">
                      <p className="text-xs font-bold text-gray-800 leading-tight">{n.title}</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-semibold">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full overflow-hidden border border-white/20 active:scale-95 transition-all"
          >
            <img
              alt="Avatar"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
            />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrop overlay for mobile drawer */}
        {isSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 top-[72px] bottom-16 bg-black/50 z-40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* SideNavBar - Slide out on mobile, Collapsible on desktop */}
        <aside
          className={`fixed md:relative top-[72px] md:top-0 bottom-16 md:bottom-0 left-0 z-45 md:z-auto shrink-0 flex flex-col bg-surface-container-lowest border-r border-outline-variant shadow-2xl md:shadow-sm transition-transform md:transition-all duration-300 ease-in-out ${
            isSidebarOpen 
              ? 'translate-x-0 w-[280px]' 
              : '-translate-x-full md:translate-x-0 md:w-0'
          } overflow-hidden`}
        >
          <div className="w-[280px] h-full flex flex-col overflow-y-auto">
            <div className="p-8">
              <h2 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-4">Danh mục chính</h2>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                  return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                    className={isActive
                      ? "flex items-center gap-4 px-5 py-4 bg-primary text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all"
                      : "flex items-center gap-4 px-5 py-4 text-on-surface-variant hover:bg-surface-container-low hover:text-primary rounded-2xl transition-all font-bold"}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="text-[12px] uppercase tracking-widest">{item.label}</span>
                  </Link>
                  );
                })}
              </nav>
            </div>

            {/* Thesis Type Section - Student only */}
            {user.role !== 'Advisor' && user.role !== 'Admin' && (
              <div className="px-6 pb-4">
                <h2 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-3 px-2">Loại đề tài</h2>
                <div className="space-y-2">
                  {[
                    {
                      key: 'do-an',
                      label: 'Đồ án',
                      icon: 'engineering',
                      desc: 'Thực hành & Ứng dụng',
                      badge: 'Theo môn học',
                      directNav: '/lookup?type=do-an', // ← filters live on the page, not sidebar
                      activeBg: 'bg-blue-50 border-blue-200 shadow-blue-100',
                      activeText: 'text-blue-700',
                      iconActiveBg: 'bg-blue-500',
                      iconIdleBg: 'bg-blue-100',
                      iconActiveColor: 'text-white',
                      iconIdleColor: 'text-blue-500',
                      badgeCls: 'bg-blue-100 text-blue-600',
                      subItems: [],
                    },
                    {
                      key: 'khoa-luan',
                      label: 'Khóa luận (Tốt nghiệp)',
                      icon: 'school',
                      desc: 'Nghiên cứu chuyên sâu',
                      badge: '5 chuyên ngành',
                      activeBg: 'bg-violet-50 border-violet-200 shadow-violet-100',
                      activeText: 'text-violet-700',
                      iconActiveBg: 'bg-violet-500',
                      iconIdleBg: 'bg-violet-100',
                      iconActiveColor: 'text-white',
                      iconIdleColor: 'text-violet-500',
                      badgeCls: 'bg-violet-100 text-violet-600',
                      subAccentBorder: 'border-violet-400',
                      subHoverBg: 'hover:bg-violet-50',
                      subHoverText: 'hover:text-violet-700',
                      subItems: [
                        { label: 'Công nghệ phần mềm', sublabel: 'Software Engineering', filter: 'software-engineering' },
                        { label: 'Mạng máy tính', sublabel: 'Computer Networks', filter: 'computer-networks' },
                        { label: 'An toàn không gian mạng', sublabel: 'Cybersecurity', filter: 'cybersecurity' },
                        { label: 'Trí tuệ nhân tạo', sublabel: 'AI', filter: 'ai' },
                        { label: 'Hệ thống thông tin', sublabel: 'Information Systems', filter: 'information-systems' },
                      ],
                    },
                    {
                      key: 'chuyen-de',
                      label: 'Chuyên đề',
                      icon: 'lightbulb',
                      desc: 'Chủ đề chuyên biệt',
                      badge: '5 chuyên ngành',
                      activeBg: 'bg-amber-50 border-amber-200 shadow-amber-100',
                      activeText: 'text-amber-700',
                      iconActiveBg: 'bg-amber-500',
                      iconIdleBg: 'bg-amber-100',
                      iconActiveColor: 'text-white',
                      iconIdleColor: 'text-amber-500',
                      badgeCls: 'bg-amber-100 text-amber-600',
                      subAccentBorder: 'border-amber-400',
                      subHoverBg: 'hover:bg-amber-50',
                      subHoverText: 'hover:text-amber-700',
                      subItems: [
                        { label: 'Công nghệ phần mềm', sublabel: 'Software Engineering', filter: 'software-engineering' },
                        { label: 'Mạng máy tính', sublabel: 'Computer Networks', filter: 'computer-networks' },
                        { label: 'An toàn không gian mạng', sublabel: 'Cybersecurity', filter: 'cybersecurity' },
                        { label: 'Trí tuệ nhân tạo', sublabel: 'AI', filter: 'ai' },
                        { label: 'Hệ thống thông tin', sublabel: 'Information Systems', filter: 'information-systems' },
                      ],
                    },
                  ].map((type) => {
                    const isExp = expandedThesisType === type.key;
                    const isDirectNavActive = type.directNav && location.pathname + location.search === type.directNav;
                    return (
                      <div key={type.key}>
                        {/* Type button */}
                        <button
                          onClick={() => {
                            if (type.directNav) {
                              navigate(type.directNav);
                              window.innerWidth < 768 && setIsSidebarOpen(false);
                            } else {
                              setExpandedThesisType(isExp ? null : type.key);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl border transition-all duration-200 font-bold group ${
                            isDirectNavActive || isExp
                              ? `${type.activeBg} shadow-md`
                              : 'border-transparent hover:bg-surface-container-low'
                          }`}
                        >
                          {/* Colored icon badge */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                            isDirectNavActive || isExp ? type.iconActiveBg : type.iconIdleBg
                          }`}>
                            <span className={`material-symbols-outlined text-xl transition-colors ${
                              isDirectNavActive || isExp ? type.iconActiveColor : type.iconIdleColor
                            }`}>{type.icon}</span>
                          </div>

                          {/* Label + description */}
                          <div className="flex-1 text-left min-w-0 pr-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className={`text-[11px] font-black uppercase tracking-wide leading-tight transition-colors ${
                                isDirectNavActive || isExp ? type.activeText : 'text-on-surface-variant group-hover:text-on-surface'
                              }`}>{type.label}</p>
                              <span className={`text-[7px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${type.badgeCls}`}>
                                {type.badge}
                              </span>
                            </div>
                            <p className="text-[9px] font-medium text-on-surface-variant opacity-50 mt-1 leading-none">{type.desc}</p>
                          </div>

                          {/* Action icon only */}
                          <div className="shrink-0 flex items-center justify-center">
                            {type.directNav ? (
                              <span className="material-symbols-outlined text-sm opacity-40 group-hover:opacity-80 transition-opacity">east</span>
                            ) : (
                              <span className={`material-symbols-outlined text-sm opacity-40 transition-transform duration-300 ${isExp ? 'rotate-180' : ''}`}>
                                expand_more
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Sub-items dropdown (only for non-directNav types) */}
                        {!type.directNav && isExp && type.subItems.length > 0 && (
                          <div className="ml-3 mt-1.5 mb-1 space-y-1 pl-1">
                            {type.subItems.map((sub) => (
                              <button
                                key={sub.filter}
                                onClick={() => {
                                  navigate(`/lookup?type=${type.key}&filter=${sub.filter}`);
                                  window.innerWidth < 768 && setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left border-l-2 border-outline-variant ${type.subHoverBg} ${type.subHoverText} group/sub`}
                              >
                                {sub.icon && (
                                  <span className={`material-symbols-outlined text-[16px] opacity-40 group-hover/sub:opacity-80 transition-opacity ${type.iconIdleColor}`}>
                                    {sub.icon}
                                  </span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="text-[11px] font-bold text-on-surface-variant block leading-tight">{sub.label}</span>
                                  {sub.sublabel && (
                                    <span className="text-[9px] font-medium opacity-40 block mt-0.5">{sub.sublabel}</span>
                                  )}
                                </div>
                                <span className="material-symbols-outlined text-sm opacity-0 group-hover/sub:opacity-40 transition-opacity">chevron_right</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-6 mt-auto">
              <div className="bg-surface-container p-6 rounded-[2rem] border border-outline-variant relative overflow-hidden group">
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-5 group-hover:scale-110 transition-transform">info</span>
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3">
                  {user.role === 'Advisor' ? (lang === 'vi' ? 'Hỗ trợ giảng viên' : 'Advisor Support') : (lang === 'vi' ? 'Hỗ trợ sinh viên' : 'Student Support')}
                </p>
                <p className="text-[10px] font-medium leading-relaxed opacity-70">
                  {user.role === 'Advisor'
                    ? (lang === 'vi' ? 'Chấm điểm, kiểm tra đạo văn và báo cáo BM25 — liên hệ phòng QLKH khi cần.' : 'Grading, plagiarism checker, and BM25 reports — contact QLKH department when needed.')
                    : (lang === 'vi' ? 'Mọi thắc mắc về đề tài, vui lòng liên hệ phòng Quản lý Khoa học.' : 'For all questions regarding thesis topics, please contact the Office of Science Management.')}
                </p>
                <button
                  onClick={() => {
                    navigate('/support');
                    window.innerWidth < 768 && setIsSidebarOpen(false);
                  }}
                  className="mt-4 w-full py-2.5 bg-on-surface text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-sm"
                >
                  {lang === 'vi' ? 'Liên hệ ngay' : 'Contact Now'}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-background overflow-y-auto pb-20 md:pb-0">
          <div className="min-h-[calc(100vh-72px)] p-4 md:p-8">
            <Outlet />
          </div>

          <footer className="w-full py-10 px-8 lg:px-16 flex flex-col md:flex-row justify-between items-center bg-surface-container-low border-t border-outline-variant">
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-xs font-bold">school</span>
                </div>
                <span className="text-sm font-black text-on-surface uppercase tracking-widest">UEF Portal</span>
              </div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Hệ thống Quản lý Đề tài Học thuật</p>
              <p className="text-[10px] text-on-surface-variant mt-2 font-medium">© {new Date().getFullYear()} University of Economics and Finance. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8 mt-4 md:mt-0">
              <a className="text-[10px] font-black text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors" href="#">Trang chủ UEF</a>
              <a className="text-[10px] font-black text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors" href="#">Thư viện</a>
              <a className="text-[10px] font-black text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors" href="#">Liên hệ hỗ trợ</a>
            </div>
          </footer>
        </main>
      </div>

      {/* Elegant Bottom Navigation Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-t border-outline-variant z-50 flex items-center justify-around px-2 shadow-[0_-4px_25px_rgba(0,0,0,0.06)]">
        {bottomNavItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-300 relative ${
                isActive 
                  ? 'text-primary font-black scale-105' 
                  : 'text-on-surface-variant/60 hover:text-primary'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] transition-transform ${isActive ? 'scale-110 font-bold' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[8px] uppercase tracking-widest font-black leading-none mt-0.5">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-5 h-0.75 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-primary text-on-primary rounded-full shadow-[0_10px_30px_rgba(140,0,14,0.3)] flex items-center justify-center z-[100] hover:scale-110 active:scale-95 transition-all group"
      >
        <span className="material-symbols-outlined text-2xl md:text-3xl group-hover:rotate-12 transition-transform">
          {isChatOpen ? 'close' : 'chat'}
        </span>
        {!isChatOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-yellow-400 text-primary text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">1</span>
        )}
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-36 md:bottom-28 right-4 md:right-8 w-[calc(100vw-32px)] sm:w-[380px] h-[480px] md:h-[550px] bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] z-[99] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300 border border-outline-variant">
          {/* Chat Header */}
          <div className="bg-primary p-5 md:p-6 text-on-primary flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined">support_agent</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs md:text-sm font-bold leading-tight">{lang === 'vi' ? 'Hỗ trợ UEF' : 'UEF Support'}</span>
                <span className="text-[9px] md:text-[10px] font-medium opacity-70 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> {lang === 'vi' ? 'Trực tuyến' : 'Online'}
                </span>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="material-symbols-outlined opacity-60 hover:opacity-100 transition-opacity">close</button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-surface-container-lowest">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[80%] p-2.5 sm:p-3.5 md:p-4 rounded-2xl text-[12px] md:text-[13px] font-medium leading-relaxed shadow-sm ${msg.sender === 'user'
                  ? 'bg-primary text-on-primary rounded-tr-none'
                  : 'bg-surface-container-high text-on-surface rounded-tl-none'
                  }`}>
                  {renderMessageText(msg.text, msg.sender)}
                  <div className={`text-[8px] md:text-[9px] mt-1 opacity-60 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                     {msg.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 md:p-4 bg-white border-t border-outline-variant flex items-center gap-3">
            <button type="button" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">add_circle</button>
            <input
              type="text"
              placeholder={lang === 'vi' ? "Nhập tin nhắn..." : "Type a message..."}
              className="flex-1 bg-surface-container-low px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-medium outline-none border border-transparent focus:border-primary/20 focus:bg-white transition-all"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
            />
            <button
              type="submit"
              className="w-8 h-8 md:w-10 md:h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
              disabled={!chatMessage.trim()}
            >
              <span className="material-symbols-outlined text-sm md:text-base">send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Layout;
