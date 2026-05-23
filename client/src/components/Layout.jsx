import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{"role": "Student", "fullName": "Người dùng Demo"}');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
    } catch {
      return true;
    }
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: "Xin chào! Tôi có thể hỗ trợ gì cho bạn về hệ thống sáng kiến?", sender: "system", time: "10:00" }
  ]);

  const getNavItems = () => {
    const baseItems = [
      { label: 'Trang chủ', icon: 'home', path: '/' },
      { label: 'Tra cứu sáng kiến', icon: 'search', path: '/lookup' },
    ];

    if (user.role === 'Advisor') {
      return [
        ...baseItems,
        { label: 'Portal giảng viên', icon: 'supervisor_account', path: '/lecturer' },
        { label: 'Chấm điểm sáng kiến', icon: 'fact_check', path: '/theses' },
        { label: 'Lịch hội đồng', icon: 'calendar_month', path: '/schedule' },
      ];
    }

    if (user.role === 'Admin') {
      return [
        ...baseItems,
        { label: 'Quản lý hệ thống', icon: 'settings', path: '/admin/management' },
        { label: 'Người dùng', icon: 'group', path: '/admin/users' },
      ];
    }

    return [
      ...baseItems,
      { label: 'Sáng kiến yêu thích', icon: 'bookmark', path: '/favorites' },
      { label: 'Hướng dẫn tra cứu', icon: 'menu_book', path: '/guidelines' },
    ];
  };

  const navItems = getNavItems();

  const getBottomNavItems = () => {
    const items = [
      { label: 'Trang chủ', icon: 'home', path: '/' },
    ];
    
    if (user.role === 'Advisor') {
      items.push(
        { label: 'Giảng viên', icon: 'supervisor_account', path: '/lecturer' },
        { label: 'Chấm điểm', icon: 'fact_check', path: '/theses' },
        { label: 'Lịch học', icon: 'calendar_month', path: '/schedule' }
      );
    } else if (user.role === 'Admin') {
      items.push(
        { label: 'Tra cứu', icon: 'search', path: '/lookup' },
        { label: 'Quản lý', icon: 'settings', path: '/admin/management' }
      );
    } else {
      items.push(
        { label: 'Tra cứu', icon: 'search', path: '/lookup' },
        { label: 'Gemini AI', icon: 'auto_awesome', path: '/analysis' }
      );
    }
    
    items.push({ label: 'Tài khoản', icon: 'person', path: '/profile' });
    return items;
  };

  const bottomNavItems = getBottomNavItems();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: chatMessage,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setChatMessage('');

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "Cảm ơn bạn đã nhắn tin. Chúng tôi sẽ phản hồi sớm nhất có thể!",
        sender: "system",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-on-background relative pb-16 md:pb-0">
      {/* TopAppBar - Not Sticky/Fixed (does not scroll with page) */}
      <header className="flex justify-between items-center h-[72px] px-4 md:px-10 w-full bg-primary shadow-[0_4px_20px_rgba(140,0,14,0.15)] border-b border-white/10 relative z-50">
        <div className="flex items-center gap-3 md:gap-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="material-symbols-outlined text-on-primary p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-90"
          >
            {isSidebarOpen ? 'menu_open' : 'menu'}
          </button>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-primary text-xl md:text-2xl font-bold">school</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base md:text-xl font-extrabold text-on-primary tracking-tight leading-none uppercase">UEF Portal</span>
              <span className="text-[8px] md:text-[9px] font-black text-on-primary/60 uppercase tracking-[0.2em] mt-1 md:mt-1.5">Hệ thống Sáng kiến</span>
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
                      { title: 'Sáng kiến mới', desc: 'Nguyễn Văn A vừa nộp sáng kiến AI Chatbot', time: '10 phút trước', icon: 'description', color: 'text-blue-600', bg: 'bg-blue-50' },
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
            <span className="w-[1px] h-6 bg-white/10 mx-2"></span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white text-on-primary hover:text-primary rounded-xl transition-all font-black text-[11px] uppercase tracking-widest shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Mobile Header Icons */}
        <div className="lg:hidden flex items-center gap-3">
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
                    { title: 'Sáng kiến mới', time: '10 phút trước' },
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
            className="md:hidden fixed top-[72px] bottom-16 inset-x-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity duration-300"
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

            <div className="p-6 mt-auto">
              <div className="bg-surface-container p-6 rounded-[2rem] border border-outline-variant relative overflow-hidden group">
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-5 group-hover:scale-110 transition-transform">info</span>
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3">
                  {user.role === 'Advisor' ? 'Hỗ trợ giảng viên' : 'Hỗ trợ sinh viên'}
                </p>
                <p className="text-[10px] font-medium leading-relaxed opacity-70">
                  {user.role === 'Advisor'
                    ? 'Chấm điểm, kiểm tra đạo văn và báo cáo BM25 — liên hệ phòng QLKH khi cần.'
                    : 'Mọi thắc mắc về sáng kiến, vui lòng liên hệ phòng Quản lý Khoa học.'}
                </p>
                <button
                  onClick={() => {
                    navigate('/support');
                    window.innerWidth < 768 && setIsSidebarOpen(false);
                  }}
                  className="mt-4 w-full py-2.5 bg-on-surface text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-sm"
                >
                  Liên hệ ngay
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
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Hệ thống Quản lý Sáng kiến Học thuật</p>
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
                <span className="text-xs md:text-sm font-bold leading-tight">Hỗ trợ UEF</span>
                <span className="text-[9px] md:text-[10px] font-medium opacity-70 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Trực tuyến
                </span>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="material-symbols-outlined opacity-60 hover:opacity-100 transition-opacity">close</button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-surface-container-lowest">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3.5 md:p-4 rounded-2xl text-[12px] md:text-[13px] font-medium leading-relaxed shadow-sm ${msg.sender === 'user'
                  ? 'bg-primary text-on-primary rounded-tr-none'
                  : 'bg-surface-container-high text-on-surface rounded-tl-none'
                  }`}>
                  {msg.text}
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
              placeholder="Nhập tin nhắn..."
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
