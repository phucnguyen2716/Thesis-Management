import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Smile, Swords, Trophy, RotateCcw, X, Sliders, ChevronRight, Settings, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WordChainModal from '../components/WordChainGame';
import SolitaireGame from '../components/SolitaireGame';
import TetrisGame from '../components/TetrisGame';
import SoundMuteToggle from '../components/SoundMuteToggle';
import { useGameMusic } from '../hooks/useGameMusic';
import { GAME_OVERLAY_CLASS, GAME_PANEL_CLASS, useGameResponsive } from '../hooks/useGameResponsive';
import {
  primeAudio,
  gameOpenChess,
  gameOpenWord,
  gameOpenSolitaire,
  gameOpenTetris,
  chessMove,
  chessCapture,
  chessCheck,
  chessWin,
  chessLose,
} from '../utils/sounds';
import { startGameMusic } from '../utils/gameMusic';

// ─── Piece SVG Unicode map ────────────────────────────────────────────────────
const PIECE_UNICODE = {
  wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
  bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟'
};

// ─── Custom Chess Board ───────────────────────────────────────────────────────
const LIGHT_SQ = '#F0D9B5';
const DARK_SQ  = '#B58863';
const SEL_SQ   = '#F6F669';
const HINT_DARK = '#CDD26A';
const HINT_LIGHT = '#AAD26A';

const ChessBoard = ({ game, selected, highlights, onSquareClick }) => {
  const files = ['a','b','c','d','e','f','g','h'];
  const ranks = [8,7,6,5,4,3,2,1];

  return (
    <div className="w-full select-none" style={{ fontFamily: 'serif' }}>
      {ranks.map(rank => (
        <div key={rank} className="flex">
          {/* Rank label */}
          <div
            className="flex items-center justify-center text-[8px] sm:text-[10px] font-bold shrink-0 w-4 sm:w-5"
            style={{ color: '#8B7355', background: '#2C1810' }}
          >{rank}</div>

          {files.map((file, fi) => {
            const sq = `${file}${rank}`;
            const isDark = (fi + (8 - rank)) % 2 === 1;
            const piece = game.get(sq);
            const pieceKey = piece ? `${piece.color}${piece.type.toUpperCase()}` : null;
            const isSelected = selected === sq;
            const isHighlighted = !!highlights[sq];
            const isCapture = isHighlighted && !!piece;

            let bg = isDark ? DARK_SQ : LIGHT_SQ;
            if (isSelected)               bg = SEL_SQ;
            else if (isHighlighted && !isCapture) bg = isDark ? HINT_DARK : HINT_LIGHT;

            return (
              <div
                key={sq}
                onClick={() => onSquareClick(sq)}
                style={{ background: bg, cursor: 'pointer', aspectRatio: '1' }}
                className="flex-1 flex items-center justify-center relative"
              >
                {/* Capture ring */}
                {isCapture && (
                  <div className="absolute inset-[6%] rounded-full border-[3px] border-black/50 pointer-events-none z-10" />
                )}
                {/* Move dot */}
                {isHighlighted && !isCapture && (
                  <div className="absolute w-[32%] h-[32%] rounded-full bg-black/30 pointer-events-none z-10" />
                )}
                {/* Piece */}
                {pieceKey && (
                  <span
                    className="z-20 leading-none pointer-events-none"
                    style={{
                      fontSize: 'clamp(20px, 5vw, 40px)',
                      color: piece.color === 'w' ? '#FFFDF0' : '#1A1A1A',
                      textShadow: piece.color === 'w'
                        ? '0 1px 0 #999, 0 2px 4px rgba(0,0,0,0.7)'
                        : '0 1px 0 #888, 0 1px 3px rgba(255,255,255,0.2)',
                    }}
                  >
                    {PIECE_UNICODE[pieceKey]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
      {/* File labels */}
      <div className="flex" style={{ background: '#2C1810' }}>
        <div className="w-4 sm:w-5 shrink-0" />
        {files.map(f => (
          <div key={f} className="flex-1 text-center text-[8px] sm:text-[10px] font-bold py-0.5" style={{ color: '#8B7355' }}>{f}</div>
        ))}
      </div>
    </div>
  );
};

// ─── AI Logic ─────────────────────────────────────────────────────────────────
const PIECE_VALUE = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
function evalBoard(g) {
  let score = 0;
  g.board().forEach(row => row.forEach(sq => {
    if (sq) score += (sq.color === 'b' ? 1 : -1) * PIECE_VALUE[sq.type];
  }));
  return score;
}
function minimax(g, depth, isMax) {
  if (depth === 0 || g.isGameOver()) return evalBoard(g);
  const moves = g.moves();
  let best = isMax ? -Infinity : Infinity;
  for (const m of moves) {
    try { g.move(m); } catch { continue; }
    const s = minimax(g, depth - 1, !isMax);
    g.undo();
    best = isMax ? Math.max(best, s) : Math.min(best, s);
  }
  return best;
}
function getBotMove(g, level) {
  const moves = g.moves();
  if (!moves.length) return null;
  if (level === 'easy') return moves[Math.floor(Math.random() * moves.length)];
  
  let bestScore = -Infinity;
  let bestMoves = [];
  const depth = level === 'hard' ? 1 : 0;
  
  for (const m of moves) {
    try { g.move(m); } catch { continue; }
    // Black wants to MAXIMIZE score, so no negative signs!
    const score = level === 'medium' ? evalBoard(g) : minimax(g, depth, false);
    g.undo();
    
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [m];
    } else if (score === bestScore) {
      bestMoves.push(m);
    }
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)] || moves[0];
}

// ─── Difficulty Options ───────────────────────────────────────────────────────
const DIFFICULTY_OPTIONS = [
  {
    key: 'easy',
    label: 'Dễ',
    sublabel: 'Nhập môn',
    desc: 'Bot đi ngẫu nhiên. Lý tưởng để học cơ bản và làm quen luật chơi.',
    icon: Smile,
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.4)',
    badgeBg: '#15803D',
  },
  {
    key: 'medium',
    label: 'Khó',
    sublabel: 'Trung cấp',
    desc: 'Bot ưu tiên ăn quân có giá trị cao. Đòi hỏi chiến thuật thực sự.',
    icon: Swords,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.4)',
    badgeBg: '#B45309',
  },
  {
    key: 'hard',
    label: 'Chuyên nghiệp',
    sublabel: 'Nâng cao',
    desc: 'Bot tính trước 2 nước bằng Minimax. Gần như không thể thắng.',
    icon: Brain,
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.4)',
    badgeBg: '#B91C1C',
  },
];

// ─── Chess Modal ──────────────────────────────────────────────────────────────
const ChessModal = ({ onClose }) => {
  const { isMobile } = useGameResponsive();
  useGameMusic('chess');

  const [difficulty, setDifficulty] = useState(null);
  const difficultyRef = useRef(null); // avoid stale closure
  const gameRef = useRef(new Chess());
  const [, forceUpdate] = useState(0);
  const [status, setStatus] = useState('Lượt bạn (Trắng) ♟️');
  const [selected, setSelected] = useState(null);
  const [highlights, setHighlights] = useState({});
  const [gameResult, setGameResult] = useState(null); // 'win' | 'lose' | 'draw' | null
  const [playerTime, setPlayerTime] = useState(900); // 15 minutes = 900 seconds

  useEffect(() => { primeAudio(); }, []);

  // Countdown timer hook
  useEffect(() => {
    if (!difficulty || gameResult) return;
    const interval = setInterval(() => {
      const g = gameRef.current;
      if (g.isGameOver()) return;
      if (g.turn() === 'w') {
        setPlayerTime(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameResult('lose');
            setStatus('Hết giờ! Bạn đã thua cuộc');
            chessLose();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [difficulty, gameResult]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const refresh = () => {
    forceUpdate(n => n + 1);
    const g = gameRef.current;
    if (g.isCheckmate()) {
      const winner = g.turn() === 'b' ? 'w' : 'b';
      setStatus(`Chiếu hết! ${winner === 'w' ? 'Bạn' : 'Máy'} thắng`);
      setGameResult(winner === 'w' ? 'win' : 'lose');
      if (winner === 'w') chessWin();
      else chessLose();
    } else if (g.isDraw()) {
      setStatus('Cờ hòa!');
      setGameResult('draw');
    } else {
      if (g.isCheck())     setStatus(g.turn()==='w' ? 'Bạn đang bị chiếu!' : 'Máy bị chiếu!');
      else if (g.turn()==='w')  setStatus('Lượt bạn (Trắng)');
      else                      setStatus('Máy đang nghĩ...');
    }
  };

  const doAI = () => {
    const g = gameRef.current;
    if (g.isGameOver()) return;
    const move = getBotMove(g, difficultyRef.current);
    if (!move) return;
    let result;
    try { result = g.move(move); } catch { return; }
    if (result?.captured) chessCapture();
    else chessMove();
    refresh();
    if (g.isCheck() && !g.isGameOver()) chessCheck();
  };

  const selectSquare = (sq) => {
    const g = gameRef.current;
    let moves = [];
    try { moves = g.moves({ square: sq, verbose: true }); } catch { return false; }
    if (!moves.length) return false;

    const h = { [sq]: true };
    moves.forEach(m => { h[m.to] = true; });
    setSelected(sq);
    setHighlights(h);
    return true;
  };

  const doMove = (from, to) => {
    const g = gameRef.current;
    try {
      const result = g.move({ from, to, promotion: 'q' });
      if (!result) return false;
      if (result.captured) chessCapture();
      else chessMove();
    } catch { return false; }
    setSelected(null);
    setHighlights({});
    refresh();
    if (g.isCheck() && !g.isGameOver()) chessCheck();
    setTimeout(doAI, 450);
    return true;
  };

  const onSquareClick = useCallback((sq) => {
    const g = gameRef.current;
    if (g.isGameOver() || g.turn() !== 'w') return;

    // nothing selected
    if (!selected) {
      const p = g.get(sq);
      if (!p || p.color !== 'w') return;
      selectSquare(sq);
      return;
    }

    // click same square → deselect
    if (sq === selected) { setSelected(null); setHighlights({}); return; }

    // click a highlighted target → move
    if (highlights[sq]) { doMove(selected, sq); return; }

    // click another white piece → reselect
    const p = g.get(sq);
    if (p && p.color === 'w') { selectSquare(sq); return; }

    // click elsewhere → deselect
    setSelected(null); setHighlights({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, highlights]);

  const reset = () => {
    gameRef.current = new Chess();
    setSelected(null); setHighlights({});
    setGameResult(null);
    setPlayerTime(900);
    setStatus('Lượt bạn (Trắng)');
    forceUpdate(n => n + 1);
  };

  const startGame = (level) => {
    difficultyRef.current = level;
    gameRef.current = new Chess();
    setSelected(null); setHighlights({});
    setGameResult(null);
    setPlayerTime(900);
    setStatus('Lượt bạn (Trắng)');
    forceUpdate(n => n + 1);
    setDifficulty(level);
    primeAudio().then(() => startGameMusic('chess'));
  };

  const g = gameRef.current;

  return (
    <div
      className={GAME_OVERLAY_CLASS}
      style={{ background: 'rgba(0,0,0,0.82)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`${GAME_PANEL_CLASS} items-center`}
        style={{ background: '#1A1008' }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between w-full px-5 py-3" style={{ background: '#2C1810' }}>
          <div className="flex items-center gap-3">
            <Swords className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="text-sm font-black text-amber-100 tracking-wide">Cờ Vua vs AI</h3>
              <p className="text-[9px] text-amber-400/70 font-medium uppercase tracking-widest">
                {difficulty ? DIFFICULTY_OPTIONS.find(d=>d.key===difficulty)?.label : 'Chọn độ khó'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SoundMuteToggle className="hover:bg-white/10" iconClass="text-amber-300/90" />
            {difficulty && (
              <button
                onClick={() => setDifficulty(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
                style={{ color: '#C4A26B' }}
                title="Đổi độ khó"
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
              style={{ color: '#C4A26B' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PICKER SCREEN */}
        {!difficulty ? (
          <div className="w-full px-4 sm:px-5 py-4 sm:py-6 space-y-3 flex-1 overflow-y-auto min-h-0">
            <p className="text-center text-amber-200/70 text-[10px] font-bold uppercase tracking-widest mb-4">Chọn mức độ của bạn</p>
            {DIFFICULTY_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => startGame(opt.key)}
                className="w-full flex items-center gap-4 p-3.5 rounded-2xl text-left transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: opt.bg, border: `1.5px solid ${opt.border}` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: opt.badgeBg }}
                >
                  <opt.icon className="text-white w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-black" style={{ color: opt.color }}>{opt.label}</span>
                    <span
                      className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: opt.badgeBg }}
                    >{opt.sublabel}</span>
                  </div>
                  <p className="text-[10px] text-amber-100/60 font-medium leading-relaxed">{opt.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: opt.color }} />
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Status bar */}
            <div
              className="w-full text-center py-1.5 text-[10px] font-black uppercase tracking-widest"
              style={{ background: '#3D2314', color: '#E8C97E', letterSpacing: '0.15em' }}
            >
              {status}
            </div>

            {/* Timers Bar */}
            <div className={`w-full flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'} px-4 sm:px-6 py-2.5 sm:py-3 border-b border-amber-950/40`} style={{ background: '#1e0f07' }}>
              {/* Bot Status Badge */}
              <div
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-300"
                style={{
                  background: g.turn() === 'b' && !gameResult ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: g.turn() === 'b' && !gameResult ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: g.turn() === 'b' && !gameResult ? '0 0 16px rgba(245, 158, 11, 0.15)' : 'none',
                }}
              >
                <div className="relative flex h-2 w-2">
                  {g.turn() === 'b' && !gameResult && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${g.turn() === 'b' && !gameResult ? 'bg-amber-500' : 'bg-neutral-600'}`}></span>
                </div>
                <div className="text-left leading-none">
                  <div className="text-[8px] font-black uppercase text-amber-400/70 tracking-wider mb-0.5">MÁY AI</div>
                  <div className="text-[12px] font-extrabold text-amber-100">
                    {g.turn() === 'b' && !gameResult ? 'Đang nghĩ...' : 'Đang chờ...'}
                  </div>
                </div>
              </div>

              {/* Player timer */}
              <div
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-300"
                style={{
                  background: g.turn() === 'w' && !gameResult ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: g.turn() === 'w' && !gameResult ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: g.turn() === 'w' && !gameResult ? '0 0 16px rgba(34, 197, 94, 0.15)' : 'none',
                }}
              >
                <div className="relative flex h-2 w-2">
                  {g.turn() === 'w' && !gameResult && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${g.turn() === 'w' && !gameResult ? 'bg-emerald-500' : 'bg-neutral-600'}`}></span>
                </div>
                <div className="text-left leading-none">
                  <div className="text-[8px] font-black uppercase text-emerald-400/70 tracking-wider mb-0.5">BẠN CHƠI</div>
                  <div className="text-[12px] font-mono font-extrabold text-emerald-200">
                    {formatTime(playerTime)}
                  </div>
                </div>
              </div>
            </div>

            {/* Board */}
            <div className="w-full flex-1 min-h-0 overflow-y-auto" style={{ padding: '6px 8px', background: '#2C1810' }}>
              <div className="w-full max-w-[min(100vw-2rem,400px)] mx-auto overflow-hidden" style={{ borderRadius: 6, border: '3px solid #6B4423', boxShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>
                <ChessBoard
                  game={g}
                  selected={selected}
                  highlights={highlights}
                  onSquareClick={onSquareClick}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 sm:gap-3 pb-4 px-4 sm:px-5 w-full shrink-0" style={{ background: '#2C1810', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <button
                onClick={reset}
                className="flex-1 py-2 font-black uppercase tracking-widest text-[9px] rounded-lg transition-all hover:brightness-110 active:scale-95"
                style={{ background: '#B58863', color: '#1A0E06', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
              >
                Ván mới
              </button>
              <button
                onClick={() => setDifficulty(null)}
                className="flex-1 py-2 font-black uppercase tracking-widest text-[9px] rounded-lg transition-all hover:brightness-110 active:scale-95"
                style={{ background: '#3D2314', color: '#C4A26B', border: '1px solid #6B4423' }}
              >
                Đổi độ khó
              </button>
            </div>
          </>
        )}

        {/* Game Over Animation Overlay */}
        <AnimatePresence>
          {gameResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md"
              style={{ background: 'rgba(10, 6, 4, 0.94)' }}
            >
              <motion.div
                initial={{ scale: 0.8, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: 20, opacity: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-full max-w-[340px] p-8 rounded-2xl border flex flex-col items-center text-center shadow-2xl"
                style={{
                  background: gameResult === 'win' ? 'linear-gradient(135deg, #2D1A04 0%, #170E02 100%)' :
                              gameResult === 'lose' ? 'linear-gradient(135deg, #2D0808 0%, #170303 100%)' :
                              'linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)',
                  borderColor: gameResult === 'win' ? '#E8C97E' :
                               gameResult === 'lose' ? '#EF4444' :
                               '#4B5563',
                  boxShadow: gameResult === 'win' ? '0 0 30px rgba(232, 201, 126, 0.25)' :
                             gameResult === 'lose' ? '0 0 30px rgba(239, 68, 68, 0.25)' :
                             '0 0 30px rgba(75, 85, 99, 0.25)'
                }}
              >
                {/* Floating Premium Icon */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg"
                  style={{
                    background: gameResult === 'win' ? 'rgba(232, 201, 126, 0.15)' :
                                gameResult === 'lose' ? 'rgba(239, 68, 68, 0.15)' :
                                'rgba(75, 85, 99, 0.15)',
                    border: `2px solid ${
                      gameResult === 'win' ? '#E8C97E' :
                      gameResult === 'lose' ? '#EF4444' :
                      '#4B5563'
                    }`
                  }}
                >
                  {gameResult === 'win' && <Trophy className="w-10 h-10" style={{ color: '#E8C97E' }} />}
                  {gameResult === 'lose' && <Swords className="w-10 h-10" style={{ color: '#EF4444' }} />}
                  {gameResult === 'draw' && <Smile className="w-10 h-10" style={{ color: '#9CA3AF' }} />}
                </motion.div>

                {/* Animated Text */}
                <motion.h4
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-black tracking-widest mb-2"
                  style={{
                    color: gameResult === 'win' ? '#E8C97E' :
                           gameResult === 'lose' ? '#EF4444' :
                           '#D1D5DB',
                    textShadow: gameResult === 'win' ? '0 2px 10px rgba(232,201,126,0.3)' : 'none'
                  }}
                >
                  {gameResult === 'win' ? 'CHIẾN THẮNG!' :
                   gameResult === 'lose' ? 'THẤT BẠI!' :
                   'CỜ HÒA!'}
                </motion.h4>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs font-semibold mb-8"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  {gameResult === 'win' ? 'Bạn đã đánh bại thành công Bot AI cờ vua!' :
                   gameResult === 'lose' ? 'Bot AI đã giành chiến thắng. Hãy thử lại để phục thù!' :
                   'Một trận đấu cân tài cân sức giữa bạn và Bot AI!'}
                </motion.p>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col gap-2 w-full"
                >
                  <button
                    onClick={reset}
                    className="w-full py-2.5 font-black uppercase tracking-widest text-[10px] rounded-lg transition-all hover:brightness-110 active:scale-95 text-white"
                    style={{
                      background: gameResult === 'win' ? '#E8C97E' :
                                  gameResult === 'lose' ? '#EF4444' :
                                  '#4B5563',
                      color: gameResult === 'win' ? '#1A0E06' : '#FFFFFF'
                    }}
                  >
                    Chơi ván mới
                  </button>
                  <button
                    onClick={() => setGameResult(null)}
                    className="w-full py-2.5 font-black uppercase tracking-widest text-[10px] rounded-lg transition-all hover:brightness-110 active:scale-95 text-amber-100/60 animate-pulse"
                    style={{ background: '#2C1810', border: '1px solid #6B4423' }}
                  >
                    Xem lại bàn cờ
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Activity Graph ───────────────────────────────────────────────────────────
const ActivityGraph = ({ className }) => {
  const [data] = useState(() =>
    ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'].map(m => ({
      month: m,
      count: Math.floor(Math.random() * 50) + 10,
    }))
  );
  return (
    <div className={`bg-white rounded-[2.5rem] p-6 border border-outline-variant shadow-sm flex flex-col justify-between ${className || ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
          <h3 className="text-xl font-bold text-on-surface">Thống kê hoạt động</h3>
        </div>
        <select className="bg-surface-container px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer">
          <option>Năm 2026</option>
          <option>Tháng này</option>
          <option>Tuần này</option>
        </select>
      </div>
      <div className="flex items-end gap-2.5 w-full flex-1 min-h-[8rem] max-h-[11rem] mb-5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full">
            <div className="w-full flex items-end justify-center h-full bg-surface-container rounded-t-lg">
              <div
                className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:opacity-75 transition-all rounded-t-lg"
                style={{ height: `${(d.count / 60) * 100}%` }}
              />
            </div>
            <span className="text-[9px] font-black text-on-surface-variant uppercase">{d.month}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 pt-4 border-t border-outline-variant/30">
        {[
          { val: 342, label: 'Lượt truy cập', cls: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
          { val: 45,  label: 'Tài liệu tải',  cls: 'bg-blue-50 border-blue-100 text-blue-600' },
          { val: 12,  label: 'Bình luận',      cls: 'bg-orange-50 border-orange-100 text-orange-600' },
        ].map((s, i) => (
          <div key={i} className={`flex-1 ${s.cls} p-3.5 rounded-2xl text-center border`}>
            <div className="text-2xl font-black">{s.val}</div>
            <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Profile Page ─────────────────────────────────────────────────────────────
const Profile = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{"role":"Student","fullName":"Người dùng Demo"}');
  const [showGame, setShowGame] = useState(false);
  const [showWordGame, setShowWordGame] = useState(false);
  const [showSolitaire, setShowSolitaire] = useState(false);
  const [showTetris, setShowTetris] = useState(false);

  const openChess = () => {
    primeAudio().then(() => startGameMusic('chess'));
    gameOpenChess();
    setShowGame(true);
  };
  const openWordGame = () => { primeAudio(); gameOpenWord(); setShowWordGame(true); };
  const openSolitaire = () => { primeAudio(); gameOpenSolitaire(); setShowSolitaire(true); };
  const openTetris = () => { primeAudio(); gameOpenTetris(); setShowTetris(true); };

  const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-center gap-4 p-4 bg-white/50 hover:bg-white transition-colors rounded-2xl border border-transparent hover:border-outline-variant/50 shadow-sm">
      <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-on-surface">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-on-surface-variant font-medium mt-2 text-sm">
            Quản lý thông tin tài khoản và thống kê hoạt động khoa học trên UEF Portal.
          </p>
        </div>
        <button className="shrink-0 px-8 py-3 bg-primary text-on-primary font-black rounded-xl hover:-translate-y-1 transition-all text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">
          Chỉnh sửa hồ sơ
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* ROW 1: Profile Details (left) & Info Card (right) */}
        {/* Profile Card */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] flex flex-col items-center text-center p-6 border border-outline-variant shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          <div className="relative w-24 h-24 rounded-full border-[4px] border-white shadow-lg overflow-hidden mb-3 z-10">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-black text-on-surface z-10">{user.fullName}</h2>
          <div className="mt-1.5 px-4 py-1 bg-primary text-on-primary text-[9px] font-black rounded-full uppercase tracking-widest z-10">
            {user.role}
          </div>
          <div className="mt-auto pt-4 border-t border-outline-variant/30 w-full space-y-2.5 z-10">
            <div className="flex justify-between items-center px-3.5 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Trạng thái</span>
              <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />Online
              </span>
            </div>
            <button className="w-full py-2 bg-red-50 border border-red-200 text-red-700 font-black rounded-xl hover:bg-red-100 transition-all text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">shield_person</span>
              Đổi mật khẩu
            </button>
          </div>
        </div>

        {/* Detailed Info Card */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-[2.5rem] p-8 border border-outline-variant shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-1.5 h-6 bg-primary rounded-full" />
            <h3 className="text-xl font-bold text-on-surface">Thông tin chi tiết</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon="mail"           label="Email Portal"    value={user.email || 'student@uef.edu.vn'} />
            <InfoRow icon="badge"          label="Mã định danh"    value={user.id ? `UEF-${String(user.id).padStart(4,'0')}` : 'UEF-0192'} />
            <InfoRow icon="corporate_fare" label="Khoa / Phòng ban" value="Khoa Công nghệ thông tin" />
            <InfoRow icon="calendar_month" label="Ngày tham gia"   value="14 Tháng 5, 2024" />
          </div>
        </div>

        {/* ROW 2: Mini-game Card (left) & Activity Graph (right) */}
        {/* Mini-game Card */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-4 sm:p-6 border border-outline-variant shadow-sm flex flex-col">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <span className="material-symbols-outlined text-on-surface text-xl shrink-0">sports_esports</span>
            <h3 className="text-base sm:text-lg font-bold text-on-surface">
              Mini-game giải trí
            </h3>
          </div>
          <div className="space-y-2.5">
            <button
              onClick={openChess}
              className="w-full flex items-center justify-between p-3 bg-indigo-50 rounded-2xl hover:bg-indigo-100 border border-indigo-100 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-lg">strategy</span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-indigo-900">Cờ Vua vs AI</p>
                  <p className="text-[9px] text-indigo-600/80 font-medium mt-0.5">Đánh cờ với AI • 3 độ khó</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-indigo-400 group-hover:text-indigo-600 transition-colors text-lg">open_in_new</span>
            </button>
            <button
              onClick={openWordGame}
              className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-2xl hover:bg-blue-100 border border-blue-100 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-lg">abc</span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-blue-900">Nối Chữ</p>
                  <p className="text-[9px] text-blue-600/80 font-medium mt-0.5">Ghép từ học thuật • 20 cấp độ</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-blue-400 group-hover:text-blue-600 transition-colors text-lg">open_in_new</span>
            </button>
            <button
              onClick={openSolitaire}
              className="w-full flex items-center justify-between p-3 bg-emerald-50 rounded-2xl hover:bg-emerald-100 border border-emerald-100 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-lg">playing_cards</span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-emerald-900">Solitaire</p>
                  <p className="text-[9px] text-emerald-600/80 font-medium mt-0.5">Klondike Card Game • Classic</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-emerald-400 group-hover:text-emerald-600 transition-colors text-lg">open_in_new</span>
            </button>
            <button
              onClick={openTetris}
              className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-2xl hover:bg-purple-100 border border-purple-100 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-lg">view_quilt</span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-purple-900">Tetris</p>
                  <p className="text-[9px] text-purple-600/80 font-medium mt-0.5">Xếp khối • 10 cấp độ</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-purple-400 group-hover:text-purple-600 transition-colors text-lg">open_in_new</span>
            </button>
          </div>
        </div>

        {/* Activity Graph */}
        <ActivityGraph className="lg:col-span-8" />
      </div>

      {showGame && <ChessModal onClose={() => setShowGame(false)} />}
      {showWordGame && <WordChainModal onClose={() => setShowWordGame(false)} />}
      {showSolitaire && <SolitaireGame onClose={() => setShowSolitaire(false)} />}
      {showTetris && <TetrisGame onClose={() => setShowTetris(false)} />}
    </div>
  );
};

export default Profile;
