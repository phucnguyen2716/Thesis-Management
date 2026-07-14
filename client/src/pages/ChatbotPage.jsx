import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { chatbotService } from '../services/api';
import useLanguage from '../hooks/useLanguage';
import { ArrowLeft, Plus, Send, LogOut, ChevronDown, BookOpen, FileText, MessageSquare, Pencil, Trash2, Check, X } from 'lucide-react';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80';

const ChatbotPage = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  
  const loadUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{"role": "Student", "fullName": "Sinh viên"}');
    } catch { 
      return { role: 'Student', fullName: 'Sinh viên' }; 
    }
  };
  const [user] = useState(loadUser);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const [chatMessage, setChatMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: lang === 'vi' ? "Xin chào! Tôi có thể hỗ trợ gì cho bạn về hệ thống đề tài?" : "Hello! How can I assist you with the academic thesis system?", sender: "system", time: "10:00" }
  ]);
  const [chatHistory, setChatHistory] = useState([]);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await chatbotService.getHistory();
      const historyData = res.data || [];
      const sortedHistory = [...historyData].reverse();

      // Store history items for sidebar display
      setChatHistory(sortedHistory);
      
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim() || loading) return;

    const userPrompt = chatMessage;
    const userMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newUserMessage = {
      id: Date.now(),
      text: userPrompt,
      sender: "user",
      time: userMsgTime
    };

    setMessages(prev => [...prev, newUserMessage]);
    setChatMessage('');
    setLoading(true);

    try {
      const res = await chatbotService.chat(userPrompt);
      const data = res.data;

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: data.message || (lang === 'vi' ? "Không thể tải phản hồi." : "Failed to load response."),
        sender: "system",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: lang === 'vi' ? "Không thể kết nối đến máy chủ AI. Vui lòng thử lại!" : "Unable to connect to the AI server. Please try again!",
        sender: "system",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = async (text) => {
    if (loading) return;

    const userMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newUserMessage = {
      id: Date.now(),
      text: text,
      sender: "user",
      time: userMsgTime
    };

    setMessages(prev => [...prev, newUserMessage]);
    setChatMessage('');
    setLoading(true);

    try {
      const res = await chatbotService.chat(text);
      const data = res.data;

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: data.message || (lang === 'vi' ? "Không thể tải phản hồi." : "Failed to load response."),
        sender: "system",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: lang === 'vi' ? "Không thể kết nối đến máy chủ AI. Vui lòng thử lại!" : "Unable to connect to the AI server. Please try again!",
        sender: "system",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([
      { id: 1, text: lang === 'vi' ? "Xin chào! Tôi có thể hỗ trợ gì cho bạn về hệ thống đề tài?" : "Hello! How can I assist you with the academic thesis system?", sender: "system", time: "10:00" }
    ]);
  };

  const scrollToMessage = (itemId) => {
    const promptEl = document.getElementById(`msg-${itemId}-prompt`);
    if (promptEl) {
      promptEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      promptEl.classList.add('bg-yellow-50');
      setTimeout(() => promptEl.classList.remove('bg-yellow-50'), 2000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const startEditMessage = (msg) => {
    setEditingMsgId(msg.id);
    setEditText(msg.text);
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
    setEditText('');
  };

  const saveEditMessage = async (msgId) => {
    if (!editText.trim()) return;
    // Update local state
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: editText } : m));
    setEditingMsgId(null);

    // Try to update in backend (extract real history id from msg id like "abc123-prompt")
    const realId = String(msgId).split('-prompt')[0].split('-msg')[0];
    try {
      await chatbotService.updateHistory(realId, { prompt: editText });
      // Also update sidebar history
      setChatHistory(prev => prev.map(h => h.id === realId ? { ...h, prompt: editText } : h));
    } catch (err) {
      console.error('Failed to update message on server', err);
    }
    setEditText('');
  };

  const handleDeleteMessage = async (msgId) => {
    // Remove from local messages (remove both prompt and response)
    const realId = String(msgId).split('-prompt')[0].split('-msg')[0];
    setMessages(prev => prev.filter(m => {
      const mRealId = String(m.id).split('-prompt')[0].split('-msg')[0];
      return mRealId !== realId || m.id === 1;
    }));

    // Remove from backend
    try {
      await chatbotService.deleteHistory(realId);
      setChatHistory(prev => prev.filter(h => h.id !== realId));
    } catch (err) {
      console.error('Failed to delete message on server', err);
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
              className="my-3 flex gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group max-w-full text-slate-800"
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
                  <h4 className="text-[11px] md:text-[12px] font-extrabold text-slate-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors" title={cardTitle}>
                    {cardTitle}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1.5 text-slate-500/80">
                    <span className="material-symbols-outlined text-[12px] shrink-0">person</span>
                    <span className="text-[9.5px] md:text-[10px] font-bold truncate">{cardStudent}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-black/5">
                  <Link 
                    to={`/theses/${cardId}`} 
                    className="flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider text-primary hover:text-[#8C000E] hover:underline transition-colors"
                  >
                    <span className="material-symbols-outlined text-[12px] shrink-0">info</span>
                    Chi tiết đề tài
                  </Link>
                  <Link 
                    to={`/theses/${cardId}/flipbook`} 
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

      // 2. Check if it's a standard markdown link
      if (part.startsWith('[')) {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
        const match = linkRegex.exec(part);
        if (match) {
          const label = match[1];
          const url = match[2];
          const isExternal = url.startsWith('http');
          
          if (isExternal) {
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
          } else {
            return (
              <Link 
                key={`link-${index}`} 
                to={url} 
                className={linkClass}
              >
                {label}
              </Link>
            );
          }
        }
      }

      // 3. Render plain text with markdown formatting (bold, newlines, bullets)
      return (
        <span key={`text-${index}`}>
          {part.split('\n').map((line, lineIdx) => {
            // Render bold **text** 
            const renderBold = (str) => {
              const boldParts = str.split(/(\*\*[^*]+\*\*)/g);
              return boldParts.map((bp, bpIdx) => {
                if (bp.startsWith('**') && bp.endsWith('**')) {
                  return <strong key={bpIdx} className="font-extrabold">{bp.slice(2, -2)}</strong>;
                }
                return bp;
              });
            };

            const trimmedLine = line.trim();
            const isBullet = trimmedLine.startsWith('•') || trimmedLine.startsWith('- ');
            const isNumbered = /^\d+\.\s/.test(trimmedLine);

            return (
              <span key={lineIdx}>
                {lineIdx > 0 && <br />}
                {isBullet ? (
                  <span className="flex gap-1.5 ml-2 mt-0.5">
                    <span className="text-primary shrink-0">•</span>
                    <span>{renderBold(trimmedLine.replace(/^[•\-]\s*/, ''))}</span>
                  </span>
                ) : isNumbered ? (
                  <span className="flex gap-1.5 mt-1.5 font-bold">
                    {renderBold(trimmedLine)}
                  </span>
                ) : (
                  <span>{renderBold(line)}</span>
                )}
              </span>
            );
          })}
        </span>
      );
    });
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 font-sans overflow-hidden relative">
      
      {/* Backdrop overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/45 z-35 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`fixed md:relative top-0 bottom-0 left-0 z-40 w-[280px] bg-white border-r border-slate-100 flex flex-col p-5 shrink-0 h-full transition-transform duration-300 md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        <div className="flex flex-col gap-4">
          {/* Logo capsule - redirects back to home */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center justify-center bg-white px-3 py-2.5 rounded-xl shadow-md border border-slate-100 h-14 cursor-pointer hover:scale-[1.02] active:scale-98 transition-all duration-300"
            title="Quay về Trang chủ"
          >
            <img 
              src="/uploads/logo-uef-qs-01.svg" 
              alt="UEF QS Stars Anniversary Logo" 
              className="h-full w-auto object-contain select-none"
            />
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              startNewChat();
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-[#8C000E] text-white rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 text-[11px] font-extrabold uppercase tracking-wider"
            title={lang === 'vi' ? 'Cuộc trò chuyện mới' : 'New chat'}
          >
            <Plus size={14} />
            <span>{lang === 'vi' ? 'Trò chuyện mới' : 'New Chat'}</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto mt-4 -mx-2 px-2 space-y-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
            {lang === 'vi' ? 'Lịch sử trò chuyện' : 'Chat History'}
          </p>
          {chatHistory.length === 0 ? (
            <p className="text-[10px] text-slate-400 text-center py-6 italic">
              {lang === 'vi' ? 'Chưa có cuộc trò chuyện nào' : 'No conversations yet'}
            </p>
          ) : (
            chatHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  scrollToMessage(item.id);
                  setIsSidebarOpen(false);
                }}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                title={item.prompt}
              >
                <MessageSquare size={13} className="text-slate-400 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-slate-700 truncate group-hover:text-primary transition-colors">{item.prompt}</p>
                  <p className="text-[8px] text-slate-400 mt-0.5">{formatTime(item.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick manuals / manuals at bottom-left */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              handleQuickQuestion("Xem cẩm nang hỗ trợ học vụ");
              setIsSidebarOpen(false);
            }}
            className="w-full py-3 px-4 bg-primary hover:bg-[#8C000E] text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all"
          >
            <BookOpen size={14} />
            <span>{lang === 'vi' ? 'Cẩm nang hỗ trợ học vụ' : 'Cẩm nang hỗ trợ học vụ'}</span>
          </button>
          
          <button
            onClick={() => {
              handleQuickQuestion("Xem sổ tay sinh viên");
              setIsSidebarOpen(false);
            }}
            className="w-full py-3 px-4 bg-primary hover:bg-[#8C000E] text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all"
          >
            <FileText size={14} />
            <span>{lang === 'vi' ? 'Sổ tay sinh viên' : 'Sổ tay sinh viên'}</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
        
        {/* Header Bar */}
        <header className="h-[72px] px-4 md:px-8 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all active:scale-95"
              title="Quay lại"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">{lang === 'vi' ? 'Quay lại' : 'Back'}</span>
            </button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all active:scale-95"
              title={lang === 'vi' ? 'Lịch sử' : 'History'}
            >
              <MessageSquare size={14} />
              <span>{lang === 'vi' ? 'Lịch sử' : 'History'}</span>
            </button>
          </div>

          {/* User Account Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-100 rounded-xl transition-all cursor-pointer font-bold text-xs select-none"
            >
              <img
                alt="User profile avatar"
                className="w-6 h-6 rounded-full object-cover border border-slate-200"
                src={user.avatarUrl?.trim() || DEFAULT_AVATAR}
              />
              <span className="text-slate-700 font-extrabold hidden sm:inline">{lang === 'vi' ? `Xin chào, ${user.fullName}!` : `Hello, ${user.fullName}!`}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full px-4 py-3 text-left text-xs text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  {lang === 'vi' ? 'Trang cá nhân' : 'My Profile'}
                </button>
                <div className="h-px bg-slate-100"></div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-xs text-red-600 hover:bg-red-50 font-bold flex items-center gap-2"
                >
                  <LogOut size={14} />
                  {lang === 'vi' ? 'Đăng xuất' : 'Log Out'}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-white">
          {messages.length <= 1 && !loading ? (
            /* Welcome / Mascot Landing Screen */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto animate-fade-in">
              <div className="w-48 h-48 md:w-56 md:h-56 mb-6 select-none flex items-center justify-center">
                <img 
                  src="/uploads/chatbot.png" 
                  alt="UEF Robot Mascot"
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
                {lang === 'vi' ? 'Trợ lý sinh viên UEF' : 'UEF Student Assistant'}
              </h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed opacity-90">
                {lang === 'vi' 
                  ? 'Khám phá mọi thông tin về UEF, từ tuyển sinh, chương trình đào tạo đến đời sống sinh viên. Hãy bắt đầu cuộc trò chuyện!'
                  : 'Explore all information about UEF, from admission, training programs to student life. Let\'s start a conversation!'}
              </p>
            </div>
          ) : (
            /* Conversation Messages List */
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} id={`msg-${msg.id}`} className={`group/msg flex items-start gap-3 transition-colors duration-500 rounded-xl ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender !== 'user' && (
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100 shrink-0 shadow-sm bg-white">
                      <img 
                        src="/uploads/boticon.png" 
                        alt="Bot Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}

                  {/* Edit/Delete buttons - appear on hover, before user bubble */}
                  {msg.sender === 'user' && msg.id !== 1 && editingMsgId !== msg.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 shrink-0 self-center">
                      <button
                        onClick={() => startEditMessage(msg)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-all"
                        title={lang === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                        title={lang === 'vi' ? 'Xóa' : 'Delete'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}

                  <div className={`max-w-[75%] p-3 px-4 rounded-2xl text-[12px] font-medium leading-relaxed shadow-sm ${msg.sender === 'user'
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}>
                    {editingMsgId === msg.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-white/20 border border-white/30 rounded-lg p-2 text-[12px] text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/50 resize-none min-w-[200px]"
                          rows={Math.max(2, editText.split('\n').length)}
                          autoFocus
                        />
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white/80 transition-all"
                            title={lang === 'vi' ? 'Hủy' : 'Cancel'}
                          >
                            <X size={14} />
                          </button>
                          <button
                            onClick={() => saveEditMessage(msg.id)}
                            className="p-1 rounded-md bg-white/20 hover:bg-white/30 text-white transition-all"
                            title={lang === 'vi' ? 'Lưu' : 'Save'}
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>{renderMessageText(msg.text, msg.sender)}</>
                    )}
                    <div className={`text-[9px] mt-1.5 opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.time}
                    </div>
                  </div>

                  {/* Edit/Delete buttons for bot messages - appear after bubble */}
                  {msg.sender !== 'user' && msg.id !== 1 && (
                    <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 shrink-0 self-center">
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                        title={lang === 'vi' ? 'Xóa' : 'Delete'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing/Loading Indicator */}
              {loading && (
                <div className="flex items-start gap-3 justify-start animate-pulse">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100 shrink-0 shadow-sm bg-white">
                    <img 
                      src="/uploads/boticon.png" 
                      alt="Bot Avatar" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="bg-white text-slate-500 border border-slate-100 rounded-2xl rounded-tl-none p-3.5 px-5 shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Form and Input Area */}
          <div className="p-5 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 bg-slate-50/80 px-4 py-3 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:border-primary/20 focus-within:shadow-md focus-within:shadow-slate-100 transition-all duration-300">
                <input
                  id="chatbot-input-field"
                  type="text"
                  placeholder={lang === 'vi' ? "Nhập câu hỏi của bạn ở đây..." : "Type your question here..."}
                  className="flex-1 bg-transparent text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="w-11 h-11 bg-primary hover:bg-[#8C000E] text-white rounded-2xl flex items-center justify-center hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shrink-0"
                disabled={!chatMessage.trim() || loading}
              >
                <Send size={16} />
              </button>
            </form>
            <p className="text-[10px] text-slate-400 text-center mt-3 font-semibold">
              {lang === 'vi' 
                ? 'Nội dung tạo bằng AI. Hãy cân nhắc kiểm tra những thông tin quan trọng.' 
                : 'Content generated by AI. Please consider checking important information.'}
            </p>
          </div>
        </div>

      </main>

    </div>
  );
};

export default ChatbotPage;
