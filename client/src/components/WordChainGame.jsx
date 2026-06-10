import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ChevronRight, RotateCcw, Trophy, Sparkles, Lock, Check, Star, Zap, ArrowLeft, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  primeAudio,
  wordSelect,
  wordCorrect,
  wordWrong,
  wordTimeout,
  wordWin,
} from '../utils/sounds';
import SoundMuteToggle from './SoundMuteToggle';
import { useGameMusic } from '../hooks/useGameMusic';
import { GAME_OVERLAY_CLASS, GAME_PANEL_CLASS, useGameResponsive } from '../hooks/useGameResponsive';

// ─── Level Data ───────────────────────────────────────────────────────────────
const WORD_LEVELS = [
  // 🟢 Cơ bản (Levels 1 - 9)
  { id: 1, category: 'Cơ bản', hint: 'Hành vi sao chép ý tưởng hoặc tác phẩm của người khác mà không trích dẫn nguồn', answer: ['đạo', 'văn'], extras: ['đào', 'vạn', 'vần'] },
  { id: 2, category: 'Cơ bản', hint: 'Người đưa ra ý kiến đánh giá, phản bác hoặc góp ý cho luận văn tốt nghiệp', answer: ['phản', 'biện'], extras: ['phân', 'viện', 'biến'] },
  { id: 3, category: 'Cơ bản', hint: 'Giai đoạn làm việc thực tế tại doanh nghiệp để học hỏi kinh nghiệm trước khi tốt nghiệp', answer: ['thực', 'tập'], extras: ['thức', 'tạp', 'thập'] },
  { id: 4, category: 'Cơ bản', hint: 'Văn bản tóm tắt ý tưởng, mục tiêu và kế hoạch nghiên cứu khoa học đề xuất ban đầu', answer: ['đề', 'cương'], extras: ['để', 'cường', 'đê'] },
  { id: 5, category: 'Cơ bản', hint: 'Bài báo hay công trình nghiên cứu khoa học đã được duyệt chấp nhận đăng chính thức', answer: ['công', 'bố'], extras: ['cộng', 'bộ', 'bảo'] },
  { id: 6, category: 'Cơ bản', hint: 'Bài báo cáo khoa học ngắn gọn sâu chuỗi về một khía cạnh kiến thức chuyên môn hẹp', answer: ['chuyên', 'đề'], extras: ['chuyền', 'đế', 'chuyện'] },
  { id: 7, category: 'Cơ bản', hint: 'Tập hợp các bài báo khoa học được chọn lọc xuất bản sau một hội thảo hay hội nghị chuyên đề', answer: ['kỷ', 'yếu'], extras: ['ký', 'yêu', 'kỹ'] },
  { id: 8, category: 'Cơ bản', hint: 'Vấn đề khoa học cụ thể mang tính cấp thiết được lựa chọn để tiến hành nghiên cứu sâu', answer: ['đề', 'tài'], extras: ['để', 'tái', 'đê'] },
  { id: 9, category: 'Cơ bản', hint: 'Bài viết ngắn thể hiện nghiên cứu và quan điểm của bản thân về một chủ đề môn học', answer: ['tiểu', 'luận'], extras: ['tiếu', 'luân', 'tiêu'] },
  
  // 🔵 Trung bình (Levels 10 - 18)
  { id: 10, category: 'Trung bình', hint: 'Phương pháp kiểm thử phần mềm dựa trên việc nắm rõ cấu trúc mã nguồn bên trong của chương trình', answer: ['kiểm', 'thử', 'hộp', 'trắng'], extras: ['kiếm', 'thư', 'họp', 'trăng'] },
  { id: 11, category: 'Trung bình', hint: 'Phần nghiên cứu, tổng hợp và đánh giá các công trình khoa học đã có trước đây liên quan đến đề tài', answer: ['tổng', 'quan', 'tài', 'liệu'], extras: ['tông', 'quán', 'tại', 'liêu'] },
  { id: 12, category: 'Trung bình', hint: 'Nhóm các nhà khoa học, giảng viên chịu trách nhiệm chấm điểm và đánh giá đề tài tốt nghiệp', answer: ['hội', 'đồng', 'đánh', 'giá'], extras: ['hối', 'đông', 'đành', 'giả'] },
  { id: 13, category: 'Trung bình', hint: 'Chỉ số đo lường tần suất trích dẫn trung bình phản ánh sức ảnh hưởng của một tạp chí khoa học', answer: ['chỉ', 'số', 'ảnh', 'hưởng'], extras: ['chí', 'sổ', 'ánh', 'hướng'] },
  { id: 14, category: 'Trung bình', hint: 'Hành động ghi nhận rõ ràng nguồn gốc của các thông tin, dữ liệu sử dụng trong bài viết học thuật', answer: ['trích', 'dẫn', 'khoa', 'học'], extras: ['trịch', 'dân', 'khóa', 'hộc'] },
  { id: 15, category: 'Trung bình', hint: 'Nhận định mang tính giả định và dự đoán ban đầu cần được kiểm chứng qua thực nghiệm', answer: ['giả', 'thuyết', 'nghiên', 'cứu'], extras: ['giá', 'thuyết', 'nghiệm', 'cửu'] },
  { id: 16, category: 'Trung bình', hint: 'Quá trình thu thập, đo lường và hệ thống hóa các thông tin thực tế phục vụ nghiên cứu', answer: ['thu', 'thập', 'dữ', 'liệu'], extras: ['thù', 'tập', 'dự', 'liêu'] },
  { id: 17, category: 'Trung bình', hint: 'Cách tiếp cận phát triển dự án phần mềm linh động, thích ứng cao và phản hồi nhanh', answer: ['phương', 'pháp', 'linh', 'hoạt'], extras: ['phướng', 'phép', 'lính', 'hoát'] },
  { id: 18, category: 'Trung bình', hint: 'Tập hợp các quy tắc và công cụ cho phép các chương trình máy tính tương tác qua lại (API)', answer: ['giao', 'diện', 'lập', 'trình'], extras: ['giáo', 'diên', 'lắp', 'trịnh'] },
  
  // 🟡 Nâng cao (Levels 19 - 27)
  { id: 19, category: 'Nâng cao', hint: 'Phương pháp lập trình tổ chức cấu trúc code xoay quanh các đối tượng dữ liệu và lớp', answer: ['lập', 'trình', 'hướng', 'đối', 'tượng'], extras: ['lắp', 'trịnh', 'hưởng', 'đổi', 'tướng'] },
  { id: 20, category: 'Nâng cao', hint: 'Các hệ thống AI tiên tiến có khả năng tự động sinh ra nội dung mới như văn bản, hình ảnh, âm thanh', answer: ['trí', 'tuệ', 'nhân', 'tạo', 'tạo', 'sinh'], extras: ['trị', 'nhẫn', 'tạp', 'sính'] },
  { id: 21, category: 'Nâng cao', hint: 'Quá trình tối ưu cấu trúc code bên trong mà không hề làm thay đổi hành vi bên ngoài của phần mềm', answer: ['tái', 'cấu', 'trúc', 'mã', 'nguồn'], extras: ['tài', 'cầu', 'trục', 'má', 'ngốn'] },
  { id: 22, category: 'Nâng cao', hint: 'Giải pháp kiến trúc phần mềm chia nhỏ hệ thống thành các dịch vụ nhỏ chạy độc lập', answer: ['kiến', 'trúc', 'hướng', 'dịch', 'vụ'], extras: ['kiền', 'trục', 'hưởng', 'dịp', 'vù'] },
  { id: 23, category: 'Nâng cao', hint: 'Phương thức bảo mật sử dụng một cặp khóa: khóa công khai để mã hóa và khóa bí mật để giải mã', answer: ['mật', 'mã', 'hóa', 'khóa', 'công', 'khai'], extras: ['mất', 'má', 'họa', 'khoa', 'cộng', 'khải'] },
  { id: 24, category: 'Nâng cao', hint: 'Sử dụng các công cụ phần mềm chuyên dụng để tự động thực thi các ca kiểm thử hệ thống', answer: ['kiểm', 'thử', 'tự', 'động'], extras: ['kiếm', 'thư', 'tứ', 'đông'] },
  { id: 25, category: 'Nâng cao', hint: 'Mô hình phát triển phần mềm truyền thống mang tính tuần tự nghiêm ngặt qua các bước cố định', answer: ['mô', 'hình', 'thác', 'nước'], extras: ['mỏ', 'hính', 'thạc', 'nước'] },
  { id: 26, category: 'Nâng cao', hint: 'Nơi lưu trữ tập trung toàn bộ mã nguồn của dự án cùng lịch sử biến động các phiên bản', answer: ['kho', 'lưu', 'trữ', 'mã', 'nguồn'], extras: ['khó', 'lựu', 'trứ', 'má', 'ngốn'] },
  { id: 27, category: 'Nâng cao', hint: 'Hệ thống lưu trữ và tổ chức thông tin dưới dạng các bảng dữ liệu có liên kết logic chặt chẽ', answer: ['cơ', 'sở', 'dữ', 'liệu', 'quan', 'hệ'], extras: ['cờ', 'sổ', 'dự', 'liêu', 'quán', 'hế'] },
  
  // 🔴 Chuyên gia (Levels 28 - 36)
  { id: 28, category: 'Chuyên gia', hint: 'Tập hợp các chương trình phần mềm hỗ trợ định nghĩa, tạo lập, lưu trữ và khai thác cơ sở dữ liệu', answer: ['hệ', 'quản', 'trị', 'cơ', 'sở', 'dữ', 'liệu'], extras: ['hế', 'quán', 'trí', 'cờ', 'sổ', 'dự', 'liêu'] },
  { id: 29, category: 'Chuyên gia', hint: 'Mô hình tính toán phỏng sinh học mô phỏng cách thức hoạt động của mạng lưới thần kinh trong não bộ', answer: ['mạng', 'thần', 'kinh', 'nhân', 'tạo', 'sâu'], extras: ['máng', 'thận', 'kính', 'nhẫn', 'tạp', 'sầu'] },
  { id: 30, category: 'Chuyên gia', hint: 'Mô hình AI lớn có khả năng hiểu và xử lý đồng thời nhiều loại dữ liệu như văn bản, ảnh, video, âm thanh', answer: ['mô', 'hình', 'ngôn', 'ngữ', 'lớn', 'đa', 'phương', 'thức'], extras: ['mỏ', 'hính', 'ngôn', 'ngừ', 'lợn', 'đà', 'phướng', 'thực'] },
  { id: 31, category: 'Chuyên gia', hint: 'Môi trường điện toán kết hợp chặt chẽ giữa đám mây dùng riêng tại chỗ và các dịch vụ đám mây công cộng', answer: ['hạ', 'tầng', 'điện', 'toán', 'đám', 'mây', 'lai'], extras: ['hả', 'tâng', 'điền', 'toán', 'đàm', 'mấy', 'lải'] },
  { id: 32, category: 'Chuyên gia', hint: 'Phương pháp tự động hóa tích hợp mã nguồn liên tục kết hợp với việc kiểm thử và triển khai ứng dụng tự động', answer: ['tích', 'hợp', 'và', 'triển', 'khai', 'liên', 'tục'], extras: ['tịch', 'hớp', 'va', 'triên', 'khái', 'liền', 'túc'] },
  { id: 33, category: 'Chuyên gia', hint: 'Công nghệ sổ cái lưu trữ dữ liệu an toàn dưới dạng các khối mật mã phân tán phi trung tâm', answer: ['chuỗi', 'khối', 'phi', 'tập', 'trung'], extras: ['chuôi', 'khôi', 'phí', 'tạp', 'trùng'] },
  { id: 34, category: 'Chuyên gia', hint: 'Phương pháp AI tự học hỏi cấu trúc hoặc đặc trưng ẩn sâu trong tập dữ liệu đầu vào chưa gắn nhãn', answer: ['học', 'máy', 'không', 'giám', 'sát'], extras: ['hộc', 'mẩy', 'khống', 'giảm', 'sạt'] },
  { id: 35, category: 'Chuyên gia', hint: 'Quy trình thực thi và triển khai các điều khoản thỏa thuận hoàn toàn tự động dựa trên Blockchain', answer: ['giao', 'dịch', 'hợp', 'đồng', 'thông', 'minh'], extras: ['giáo', 'dịp', 'hớp', 'đông', 'thống', 'mình'] },
  { id: 36, category: 'Chuyên gia', hint: 'Phương pháp phân tích, đánh giá chất lượng và phát hiện lỗ hổng của mã nguồn mà không cần chạy thử', answer: ['kiểm', 'thử', 'tĩnh', 'mã', 'nguồn'], extras: ['kiếm', 'thư', 'tinh', 'má', 'ngốn'] },
];

const CATEGORY_COLORS = {
  'Cơ bản':     { color:'#22C55E', bg:'rgba(34,197,94,0.1)',  border:'rgba(34,197,94,0.3)',  badge:'#15803D' },
  'Trung bình': { color:'#3B82F6', bg:'rgba(59,130,246,0.1)', border:'rgba(59,130,246,0.3)', badge:'#1D4ED8' },
  'Nâng cao':   { color:'#F59E0B', bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.3)', badge:'#B45309' },
  'Chuyên gia': { color:'#EF4444', bg:'rgba(239,68,68,0.1)',  border:'rgba(239,68,68,0.3)',  badge:'#B91C1C' },
};

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Word Chain Modal ─────────────────────────────────────────────────────────
const WordChainModal = ({ onClose }) => {
  const { isMobile, isSmall } = useGameResponsive();
  useGameMusic('word');

  const [screen, setScreen] = useState('levels'); // 'levels' | 'playing'
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selected, setSelected] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [result, setResult] = useState(null); // 'correct' | 'wrong' | null
  const [completedLevels, setCompletedLevels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wordchain_completed') || '[]'); } catch { return []; }
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [shake, setShake] = useState(false);

  const level = WORD_LEVELS[currentLevel];
  const maxUnlocked = completedLevels.length > 0 ? Math.max(...completedLevels) + 1 : 0;

  const initLevel = useCallback((idx) => {
    const lv = WORD_LEVELS[idx];
    const allTiles = [...lv.answer, ...lv.extras].map((word, i) => ({ id: i, word, used: false }));
    setTiles(shuffleArray(allTiles));
    setSelected([]);
    setResult(null);
    setTimeLeft(lv.answer.length <= 2 ? 20 : lv.answer.length <= 4 ? 30 : 40);
    setCurrentLevel(idx);
    setScreen('playing');
  }, []);

  useEffect(() => { primeAudio(); }, []);

  // Timer
  useEffect(() => {
    if (screen !== 'playing' || result) return;
    if (timeLeft <= 0) {
      setResult('wrong');
      wordTimeout();
      return;
    }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [screen, result, timeLeft]);

  const selectTile = (tile) => {
    if (result || tile.used) return;
    wordSelect();
    const newTiles = tiles.map(t => t.id === tile.id ? { ...t, used: true } : t);
    const newSelected = [...selected, tile];
    setTiles(newTiles);
    setSelected(newSelected);

    // Check if complete
    if (newSelected.length === level.answer.length) {
      const isCorrect = newSelected.every((s, i) => s.word === level.answer[i]);
      if (isCorrect) {
        setResult('correct');
        wordCorrect();
        const newCompleted = [...new Set([...completedLevels, level.id])];
        setCompletedLevels(newCompleted);
        localStorage.setItem('wordchain_completed', JSON.stringify(newCompleted));
      } else {
        setResult('wrong');
        wordWrong();
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    }
  };

  const deselectTile = (tile) => {
    if (result) return;
    wordSelect();
    setSelected(selected.filter(s => s.id !== tile.id));
    setTiles(tiles.map(t => t.id === tile.id ? { ...t, used: false } : t));
  };

  const resetLevel = () => initLevel(currentLevel);

  const nextLevel = () => {
    if (currentLevel < WORD_LEVELS.length - 1) initLevel(currentLevel + 1);
    else {
      wordWin();
      setScreen('levels');
    }
  };

  const catColors = CATEGORY_COLORS[level?.category] || CATEGORY_COLORS['Cơ bản'];

  // ─── Level Select Screen ─────────────────────────────────────────
  if (screen === 'levels') {
    return (
      <div
        className={GAME_OVERLAY_CLASS}
        style={{ background: 'rgba(0,0,0,0.82)' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div className={`${GAME_PANEL_CLASS}`} style={{ background: '#0A0F1E' }}>
          {/* Header */}
          <div className="flex items-center justify-between w-full px-5 py-3" style={{ background: '#111833' }}>
            <div className="flex items-center gap-3">
              <Type className="w-5 h-5 text-blue-300" />
              <div>
                <h3 className="text-sm font-black text-blue-100 tracking-wide">Nối Chữ</h3>
                <p className="text-[9px] text-blue-400/70 font-medium uppercase tracking-widest">{WORD_LEVELS.length} Cấp độ</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SoundMuteToggle size="sm" className="hover:bg-white/10" iconClass="text-blue-300/90" />
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-all" style={{ color: '#6B8AFF' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Level Grid */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0">
            <p className="text-center text-blue-200/60 text-[9px] font-bold uppercase tracking-widest mb-4">
              Hoàn thành: {completedLevels.length}/{WORD_LEVELS.length}
            </p>
            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-white/5 mb-5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)' }}
                initial={{ width: 0 }}
                animate={{ width: `${(completedLevels.length / WORD_LEVELS.length) * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>

            <div className={`grid ${isSmall ? 'grid-cols-3' : 'grid-cols-4 sm:grid-cols-5 md:grid-cols-4'} gap-2 sm:gap-2.5`}>
              {WORD_LEVELS.map((lv, idx) => {
                const done = completedLevels.includes(lv.id);
                const unlocked = idx <= maxUnlocked || done;
                const cc = CATEGORY_COLORS[lv.category];
                return (
                  <button
                    key={lv.id}
                    disabled={!unlocked}
                    onClick={() => unlocked && initLevel(idx)}
                    className="relative flex flex-col items-center justify-center py-3 rounded-xl border transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                    style={{
                      background: done ? cc.bg : 'rgba(255,255,255,0.03)',
                      borderColor: done ? cc.border : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    {done && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: cc.badge }}>
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    {!unlocked && <Lock className="w-3.5 h-3.5 text-white/20 absolute top-1 right-1" />}
                    <span className="text-lg font-black" style={{ color: done ? cc.color : unlocked ? '#CBD5E1' : '#334155' }}>{lv.id}</span>
                    <span className="text-[7px] font-bold uppercase tracking-wider mt-0.5" style={{ color: done ? cc.color : '#475569' }}>{lv.category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Playing Screen ───────────────────────────────────────────────
  return (
    <div
      className={GAME_OVERLAY_CLASS}
      style={{ background: 'rgba(0,0,0,0.82)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className={`${GAME_PANEL_CLASS} ${shake ? 'animate-shake' : ''}`}
        style={{ background: '#0A0F1E' }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        key={currentLevel}
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full px-5 py-3" style={{ background: '#111833' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setScreen('levels')} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-all" style={{ color: '#6B8AFF' }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-sm font-black text-blue-100 tracking-wide">Level {level.id}</h3>
              <p className="text-[9px] font-medium uppercase tracking-widest" style={{ color: catColors.color }}>{level.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SoundMuteToggle size="sm" className="hover:bg-white/10" iconClass="text-blue-300/90" />
            <button onClick={resetLevel} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-all" style={{ color: '#6B8AFF' }}>
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-all" style={{ color: '#6B8AFF' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timer & Hint */}
        <div className="px-5 py-4 space-y-4" style={{ background: '#0D1225', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          {/* Timer Header */}
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all duration-300 backdrop-blur-md ${
                timeLeft <= 5 
                  ? 'border-red-500/30 bg-red-500/5 shadow-lg shadow-red-950/20 text-red-400' 
                  : 'border-blue-500/20 bg-blue-500/5 shadow-lg shadow-blue-950/20 text-blue-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <div className="text-left leading-none">
                <div className="text-[8px] text-white/50 font-black uppercase tracking-wider mb-0.5">THỜI GIAN</div>
                <div className="text-[12px] font-mono font-black tracking-wide">
                  {timeLeft}s
                </div>
              </div>
            </div>

            {/* Word Progress Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-white/5 bg-white/5 text-slate-300 shadow-md">
              <Type className="w-3.5 h-3.5 text-blue-400" />
              <div className="text-left leading-none">
                <div className="text-[8px] text-white/50 font-black uppercase tracking-wider mb-0.5">TIẾN TRÌNH</div>
                <div className="text-[12px] font-black tracking-wide">
                  {selected.length}/{level.answer.length} từ
                </div>
              </div>
            </div>
          </div>

          {/* Timer progress bar with glow */}
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden relative">
            <motion.div
              className="h-full rounded-full transition-colors relative"
              style={{
                background: timeLeft <= 5 ? '#EF4444' : 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                width: `${(timeLeft / (level.answer.length <= 2 ? 20 : level.answer.length <= 4 ? 30 : 40)) * 100}%`,
              }}
            />
          </div>

          {/* Hint */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}>
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-200/80 font-semibold leading-relaxed">{level.hint}</p>
          </div>
        </div>

        {/* Answer Slots */}
        <div className="px-5 py-4">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-[48px] flex-wrap px-1">
            {level.answer.map((_, i) => {
              const sel = selected[i];
              const isCorrectSlot = result === 'correct';
              const isWrongSlot = result === 'wrong' && sel;
              return (
                <motion.div
                  key={i}
                  layout
                  className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 border-dashed min-w-[52px] sm:min-w-[60px] text-center cursor-pointer transition-all"
                  style={{
                    borderColor: isCorrectSlot ? '#22C55E' : isWrongSlot ? '#EF4444' : sel ? '#6B8AFF' : 'rgba(255,255,255,0.1)',
                    background: isCorrectSlot ? 'rgba(34,197,94,0.1)' : isWrongSlot ? 'rgba(239,68,68,0.1)' : sel ? 'rgba(107,138,255,0.08)' : 'transparent',
                  }}
                  onClick={() => sel && deselectTile(sel)}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-sm font-black" style={{
                    color: isCorrectSlot ? '#22C55E' : isWrongSlot ? '#EF4444' : sel ? '#A5B4FC' : 'rgba(255,255,255,0.15)',
                  }}>
                    {sel ? sel.word : '?'}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Tile Pool */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex-1 overflow-y-auto min-h-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            {tiles.map(tile => (
              <motion.button
                key={tile.id}
                disabled={tile.used || !!result}
                onClick={() => selectTile(tile)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all disabled:opacity-20 disabled:cursor-default touch-manipulation"
                style={{
                  background: tile.used ? 'transparent' : 'rgba(255,255,255,0.06)',
                  color: tile.used ? 'transparent' : '#E2E8F0',
                  border: tile.used ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(255,255,255,0.1)',
                }}
                whileHover={!tile.used && !result ? { scale: 1.08, background: 'rgba(107,138,255,0.15)' } : {}}
                whileTap={!tile.used && !result ? { scale: 0.92 } : {}}
              >
                {tile.word}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Result Overlay */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md"
              style={{ background: 'rgba(10, 15, 30, 0.94)' }}
            >
              <motion.div
                initial={{ scale: 0.8, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-full max-w-[300px] p-7 rounded-2xl border flex flex-col items-center text-center shadow-2xl"
                style={{
                  background: result === 'correct'
                    ? 'linear-gradient(135deg, #0A1628 0%, #071020 100%)'
                    : 'linear-gradient(135deg, #1E0808 0%, #150303 100%)',
                  borderColor: result === 'correct' ? '#3B82F6' : '#EF4444',
                }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                  style={{
                    background: result === 'correct' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `2px solid ${result === 'correct' ? '#3B82F6' : '#EF4444'}`,
                  }}
                >
                  {result === 'correct'
                    ? <Trophy className="w-8 h-8" style={{ color: '#3B82F6' }} />
                    : <X className="w-8 h-8" style={{ color: '#EF4444' }} />
                  }
                </motion.div>

                <h4 className="text-xl font-black tracking-widest mb-1" style={{ color: result === 'correct' ? '#60A5FA' : '#F87171' }}>
                  {result === 'correct' ? 'CHÍNH XÁC!' : 'SAI RỒI!'}
                </h4>
                <p className="text-[10px] text-white/50 font-medium mb-2">
                  Đáp án: <span className="text-white/80 font-bold">{level.answer.join(' ')}</span>
                </p>

                <div className="flex flex-col gap-2 w-full mt-4">
                  {result === 'correct' && currentLevel < WORD_LEVELS.length - 1 && (
                    <button onClick={nextLevel} className="w-full py-2 font-black uppercase tracking-widest text-[9px] rounded-lg transition-all hover:brightness-110 active:scale-95 text-white" style={{ background: '#3B82F6' }}>
                      Level tiếp theo
                    </button>
                  )}
                  {result === 'correct' && currentLevel === WORD_LEVELS.length - 1 && (
                    <button onClick={() => setScreen('levels')} className="w-full py-2 font-black uppercase tracking-widest text-[9px] rounded-lg transition-all hover:brightness-110 active:scale-95 text-white flex items-center justify-center gap-1.5" style={{ background: '#8B5CF6' }}>
                      <span>Hoàn thành tất cả!</span>
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                    </button>
                  )}
                  <button onClick={resetLevel} className="w-full py-2 font-black uppercase tracking-widest text-[9px] rounded-lg transition-all hover:brightness-110 active:scale-95" style={{ background: '#1E293B', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Thử lại
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default WordChainModal;
