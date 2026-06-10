import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Trophy, Zap, ChevronUp } from 'lucide-react';
import {
  primeAudio,
  tetrisMove,
  tetrisRotate,
  tetrisLock,
  tetrisHardDrop,
  tetrisClear,
  tetrisLevelUp,
  tetrisGameOver,
} from '../utils/sounds';
import SoundMuteToggle from './SoundMuteToggle';
import { useGameMusic } from '../hooks/useGameMusic';
import { GAME_OVERLAY_CLASS, GAME_PANEL_CLASS, useGameResponsive } from '../hooks/useGameResponsive';

// ─── Constants ────────────────────────────────────────────────────────────────
const BOARD_W = 10;
const BOARD_H = 20;

const TETROMINOES = {
  I: { shape: [[1,1,1,1]], color: '#00CFCF' },
  O: { shape: [[1,1],[1,1]], color: '#F7D308' },
  T: { shape: [[0,1,0],[1,1,1]], color: '#AD00E8' },
  S: { shape: [[0,1,1],[1,1,0]], color: '#12C726' },
  Z: { shape: [[1,1,0],[0,1,1]], color: '#EF3B3B' },
  J: { shape: [[1,0,0],[1,1,1]], color: '#2563EB' },
  L: { shape: [[0,0,1],[1,1,1]], color: '#FF8800' },
};

const PIECE_NAMES = Object.keys(TETROMINOES);

const COLORS = {
  '#00CFCF': { light: '#5FF3F3', dark: '#008A8A', border: '#00AAAA' },
  '#F7D308': { light: '#FFE96B', dark: '#A99000', border: '#CDB100' },
  '#AD00E8': { light: '#D56AFF', dark: '#7200A0', border: '#9500CC' },
  '#12C726': { light: '#58F06B', dark: '#0A8519', border: '#0FA81F' },
  '#EF3B3B': { light: '#FF8A8A', dark: '#A51F1F', border: '#CC2E2E' },
  '#2563EB': { light: '#7BADFF', dark: '#1740A0', border: '#1E50CC' },
  '#FF8800': { light: '#FFBA66', dark: '#AE5D00', border: '#CC6E00' },
};

const POINTS = [0, 100, 300, 500, 800]; // 0,1,2,3,4 lines
const SPEED_BY_LEVEL = [800, 700, 600, 500, 400, 320, 250, 190, 140, 100];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const emptyBoard = () => Array.from({ length: BOARD_H }, () => Array(BOARD_W).fill(null));

const randomPiece = () => {
  const name = PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
  return { name, shape: TETROMINOES[name].shape, color: TETROMINOES[name].color, x: 3, y: 0 };
};

const rotate = (shape) => {
  const rows = shape.length, cols = shape[0].length;
  return Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (_, r) => shape[rows - 1 - r][c])
  );
};

const collides = (board, piece, dx = 0, dy = 0, shape = null) => {
  const s = shape || piece.shape;
  for (let r = 0; r < s.length; r++) {
    for (let c = 0; c < s[r].length; c++) {
      if (!s[r][c]) continue;
      const nx = piece.x + c + dx;
      const ny = piece.y + r + dy;
      if (nx < 0 || nx >= BOARD_W || ny >= BOARD_H) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
};

const getGhostY = (board, piece) => {
  let dy = 0;
  while (!collides(board, piece, 0, dy + 1)) dy++;
  return piece.y + dy;
};

const placePiece = (board, piece) => {
  const b = board.map(r => [...r]);
  piece.shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) {
        const ny = piece.y + r;
        const nx = piece.x + c;
        if (ny >= 0) b[ny][nx] = piece.color;
      }
    });
  });
  return b;
};

const clearLines = (board) => {
  const remaining = board.filter(row => row.some(cell => !cell));
  const cleared = BOARD_H - remaining.length;
  const newRows = Array.from({ length: cleared }, () => Array(BOARD_W).fill(null));
  return { board: [...newRows, ...remaining], cleared };
};

const wallKick = (board, piece, newShape) => {
  const kicks = [0, 1, -1, 2, -2];
  for (const dx of kicks) {
    if (!collides(board, piece, dx, 0, newShape)) {
      return dx;
    }
  }
  return null;
};

// ─── Mini board renderer (for Next / Hold) ────────────────────────────────────
const MiniBoard = ({ piece, size = 3 }) => {
  if (!piece) return (
    <div style={{ width: size * 4 * 8, height: size * 2 * 8 }} className="flex items-center justify-center">
      <span className="text-white/20 text-xs font-bold">—</span>
    </div>
  );
  const s = piece.shape;
  const cols = s[0].length;
  const rows = s.length;
  const cellSize = Math.min(Math.floor(68 / Math.max(cols, rows)), 18);
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 1 }}>
      {s.map((row, r) => (
        <div key={r} style={{ display: 'flex', gap: 1 }}>
          {row.map((cell, c) => {
            const color = cell ? piece.color : null;
            const shades = color ? COLORS[color] : null;
            return (
              <div
                key={c}
                style={{
                  width: cellSize, height: cellSize,
                  borderRadius: 2,
                  background: color
                    ? `linear-gradient(135deg, ${shades.light} 0%, ${color} 50%, ${shades.dark} 100%)`
                    : 'transparent',
                  border: color ? `1px solid ${shades.border}` : 'none',
                  boxShadow: color ? `inset 1px 1px 2px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.5)` : 'none',
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ─── Cell ─────────────────────────────────────────────────────────────────────
const Cell = React.memo(({ color, ghost, cellSize }) => {
  if (!color && !ghost) return (
    <div style={{
      width: cellSize, height: cellSize,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.04)',
    }} />
  );
  const shades = color ? COLORS[color] : null;
  return (
    <div style={{
      width: cellSize, height: cellSize,
      borderRadius: 2,
      background: ghost
        ? 'transparent'
        : `linear-gradient(135deg, ${shades.light} 0%, ${color} 40%, ${shades.dark} 100%)`,
      border: ghost
        ? `1.5px dashed rgba(255,255,255,0.22)`
        : `1px solid ${shades.border}`,
      boxShadow: color
        ? `inset 1px 1px 3px rgba(255,255,255,0.35), inset -1px -1px 3px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.6)`
        : 'none',
      opacity: ghost ? 0.4 : 1,
      transition: 'background 0.05s',
    }} />
  );
});

// ─── Board ────────────────────────────────────────────────────────────────────
const Board = ({ board, current, ghostY, clearingLines, cellSize }) => {
  // Build render matrix
  const matrix = board.map(row => [...row]);

  // Draw ghost
  if (current && ghostY !== null) {
    current.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell) return;
        const ny = ghostY + r, nx = current.x + c;
        if (ny >= 0 && ny < BOARD_H && nx >= 0 && nx < BOARD_W && !matrix[ny][nx]) {
          matrix[ny][nx] = '__ghost__';
        }
      });
    });
  }

  // Draw current piece
  if (current) {
    current.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell) return;
        const ny = current.y + r, nx = current.x + c;
        if (ny >= 0 && ny < BOARD_H && nx >= 0 && nx < BOARD_W) {
          matrix[ny][nx] = current.color;
        }
      });
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {matrix.map((row, r) => (
        <motion.div
          key={r}
          animate={clearingLines.includes(r) ? { scaleX: [1, 1.05, 0], opacity: [1, 1, 0] } : { scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.25, ease: 'easeIn' }}
          style={{ display: 'flex', gap: 1 }}
        >
          {row.map((cell, c) => (
            <Cell
              key={c}
              color={cell === '__ghost__' ? null : cell}
              ghost={cell === '__ghost__'}
              cellSize={cellSize}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TetrisGame = ({ onClose }) => {
  const { tetrisCellSize, isMobile } = useGameResponsive();
  useGameMusic('tetris');

  const [board, setBoard] = useState(emptyBoard);
  const [current, setCurrent] = useState(null);
  const [next, setNext] = useState(null);
  const [hold, setHold] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState('idle'); // idle | playing | paused | over
  const [clearingLines, setClearingLines] = useState([]);
  const [lastClear, setLastClear] = useState(null); // for bonus display
  const [combo, setCombo] = useState(0);

  // Refs for use inside callbacks/intervals
  const boardRef = useRef(board);
  const currentRef = useRef(current);
  const nextRef = useRef(next);
  const gameStateRef = useRef(gameState);
  const levelRef = useRef(level);
  const linesRef = useRef(lines);
  const scoreRef = useRef(score);
  const canHoldRef = useRef(canHold);
  const holdRef = useRef(hold);
  const comboRef = useRef(combo);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => { nextRef.current = next; }, [next]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { linesRef.current = lines; }, [lines]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { canHoldRef.current = canHold; }, [canHold]);
  useEffect(() => { holdRef.current = hold; }, [hold]);
  useEffect(() => { comboRef.current = combo; }, [combo]);

  const spawnPiece = useCallback((nextPiece, board) => {
    const piece = nextPiece || randomPiece();
    const newNext = randomPiece();
    if (collides(board, piece)) {
      setGameState('over');
      tetrisGameOver();
      return false;
    }
    setCurrent(piece);
    setNext(newNext);
    setCanHold(true);
    return true;
  }, []);

  const lockPiece = useCallback((pieceToLock, boardToUse) => {
    const newBoard = placePiece(boardToUse, pieceToLock);
    const { board: clearedBoard, cleared } = clearLines(newBoard);

    if (cleared > 0) {
      tetrisClear(cleared);
      // Detect which rows were cleared
      const newRows = [];
      newBoard.forEach((row, i) => {
        if (row.every(cell => cell)) newRows.push(i);
      });
      setClearingLines(newRows);

      const newCombo = comboRef.current + 1;
      setCombo(newCombo);

      // Calculate score
      const basePoints = POINTS[cleared] * levelRef.current;
      const comboBonus = newCombo > 1 ? (newCombo - 1) * 50 * levelRef.current : 0;
      const pts = basePoints + comboBonus;

      setLastClear({ cleared, pts, combo: newCombo });

      setTimeout(() => {
        const newLines = linesRef.current + cleared;
        const newLevel = Math.floor(newLines / 10) + 1;
        if (newLevel > levelRef.current) tetrisLevelUp();
        setLines(newLines);
        setLevel(Math.min(newLevel, 10));
        setScore(s => s + pts);
        setBoard(clearedBoard);
        boardRef.current = clearedBoard;
        setClearingLines([]);
        spawnPiece(nextRef.current, clearedBoard);
        setTimeout(() => setLastClear(null), 1500);
      }, 280);
    } else {
      tetrisLock();
      setCombo(0);
      setBoard(newBoard);
      boardRef.current = newBoard;
      spawnPiece(nextRef.current, newBoard);
    }
  }, [spawnPiece]);

  // Drop timer
  const dropRef = useRef(null);
  const scheduleDrop = useCallback(() => {
    clearInterval(dropRef.current);
    dropRef.current = setInterval(() => {
      if (gameStateRef.current !== 'playing') return;
      const piece = currentRef.current;
      if (!piece) return;
      if (!collides(boardRef.current, piece, 0, 1)) {
        setCurrent(p => p ? { ...p, y: p.y + 1 } : p);
      } else {
        lockPiece(piece, boardRef.current);
      }
    }, SPEED_BY_LEVEL[Math.min(levelRef.current - 1, 9)]);
  }, [lockPiece]);

  // Restart drop on level change
  useEffect(() => {
    if (gameState === 'playing') scheduleDrop();
    return () => clearInterval(dropRef.current);
  }, [gameState, level, scheduleDrop]);

  const startGame = useCallback(() => {
    const b = emptyBoard();
    setBoard(b);
    boardRef.current = b;
    setScore(0);
    setLines(0);
    setLevel(1);
    setHold(null);
    setCanHold(true);
    setCombo(0);
    setLastClear(null);
    setClearingLines([]);
    const first = randomPiece();
    const nxt = randomPiece();
    setCurrent(first);
    setNext(nxt);
    currentRef.current = first;
    nextRef.current = nxt;
    setGameState('playing');
  }, []);

  const doHold = useCallback(() => {
    if (!canHoldRef.current || !currentRef.current) return;
    const curr = currentRef.current;
    const heldPiece = holdRef.current;
    const newHeld = { name: curr.name, shape: TETROMINOES[curr.name].shape, color: curr.color };
    setHold(newHeld);
    setCanHold(false);
    if (heldPiece) {
      const spawn = { ...heldPiece, x: 3, y: 0 };
      if (!collides(boardRef.current, spawn)) {
        setCurrent(spawn);
      } else {
        setGameState('over');
        tetrisGameOver();
      }
    } else {
      spawnPiece(nextRef.current, boardRef.current);
    }
    tetrisRotate();
  }, [spawnPiece]);

  const hardDrop = useCallback(() => {
    const piece = currentRef.current;
    if (!piece) return;
    let dy = 0;
    while (!collides(boardRef.current, piece, 0, dy + 1)) dy++;
    const dropped = { ...piece, y: piece.y + dy };
    setScore(s => s + dy * 2);
    tetrisHardDrop();
    lockPiece(dropped, boardRef.current);
  }, [lockPiece]);

  const softDrop = useCallback(() => {
    const piece = currentRef.current;
    if (!piece) return;
    if (!collides(boardRef.current, piece, 0, 1)) {
      setCurrent(p => p ? { ...p, y: p.y + 1 } : p);
      setScore(s => s + 1);
      tetrisMove();
    }
  }, []);

  const moveLeft = useCallback(() => {
    const p = currentRef.current;
    if (p && !collides(boardRef.current, p, -1, 0)) {
      setCurrent({ ...p, x: p.x - 1 });
      tetrisMove();
    }
  }, []);

  const moveRight = useCallback(() => {
    const p = currentRef.current;
    if (p && !collides(boardRef.current, p, 1, 0)) {
      setCurrent({ ...p, x: p.x + 1 });
      tetrisMove();
    }
  }, []);

  const rotatePiece = useCallback(() => {
    const p = currentRef.current;
    if (!p) return;
    const newShape = rotate(p.shape);
    const kick = wallKick(boardRef.current, p, newShape);
    if (kick !== null) {
      setCurrent({ ...p, shape: newShape, x: p.x + kick });
      tetrisRotate();
    }
  }, []);

  useEffect(() => { primeAudio(); }, []);

  // Keyboard
  useEffect(() => {
    if (gameState !== 'playing') return;
    const onKey = (e) => {
      if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' ','c','C'].includes(e.key)) {
        e.preventDefault();
      }
      switch (e.key) {
        case 'ArrowLeft':  moveLeft(); break;
        case 'ArrowRight': moveRight(); break;
        case 'ArrowDown':  softDrop(); break;
        case 'ArrowUp':    rotatePiece(); break;
        case ' ':          hardDrop(); break;
        case 'c': case 'C': doHold(); break;
        case 'Escape': setGameState('paused'); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState, moveLeft, moveRight, softDrop, rotatePiece, hardDrop, doHold]);

  // Ghost Y
  const ghostY = current && gameState === 'playing'
    ? getGhostY(board, current)
    : null;

  const cellSize = tetrisCellSize;

  // DAS (Delayed Auto Shift) for held arrow keys
  const dasRef = useRef(null);
  const arrRef = useRef(null);
  const onKeyDown = useCallback((e) => {
    if (gameState !== 'playing') return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const fn = e.key === 'ArrowLeft' ? moveLeft : moveRight;
      fn();
      clearTimeout(dasRef.current);
      clearInterval(arrRef.current);
      dasRef.current = setTimeout(() => {
        arrRef.current = setInterval(fn, 50);
      }, 160);
    }
  }, [gameState, moveLeft, moveRight]);

  const onKeyUp = useCallback((e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      clearTimeout(dasRef.current);
      clearInterval(arrRef.current);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  const clearLabels = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS!'];
  const clearColors = ['', '#60A5FA', '#34D399', '#FBBF24', '#F43F5E'];

  return (
    <div
      className={GAME_OVERLAY_CLASS}
      style={{ background: 'rgba(0,0,0,0.9)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className={`${GAME_PANEL_CLASS} select-none`}
        style={{
          background: 'linear-gradient(160deg, #0f0c29 0%, #1a1040 50%, #0f0c29 100%)',
          border: '1.5px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-3 shrink-0 gap-1 sm:gap-2"
          style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)' }}
            >
              <span className="text-purple-300 text-sm sm:text-base font-black">T</span>
            </motion.div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-white tracking-wide leading-tight">
                Tetris
                <span className="sm:hidden text-purple-300/80 font-bold ml-1">· C{level}</span>
              </h3>
              <p className="text-[7px] sm:text-[8px] text-purple-300/70 font-bold uppercase tracking-widest hidden sm:block">Cấp {level}</p>
            </div>
            {isMobile && (
              <div className="flex items-center gap-2 sm:hidden ml-1">
                <div className="flex flex-col items-center">
                  <span className="text-[6px] text-white/35 font-black">GIỮ</span>
                  <MiniBoard piece={hold} size={2} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[6px] text-white/35 font-black">TIẾP</span>
                  <MiniBoard piece={next} size={2} />
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            {[
              { label: 'Điểm', val: score.toLocaleString(), icon: <Trophy className="w-3 h-3 text-yellow-400" />, cls: 'text-yellow-300' },
              { label: 'Dòng', val: lines, icon: <Zap className="w-3 h-3 text-blue-400" />, cls: 'text-blue-300' },
            ].map(s => (
              <div
                key={s.label}
                className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl ${isMobile ? 'min-w-[2.5rem] justify-center' : ''}`}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                title={s.label}
              >
                {s.icon}
                <div className={`leading-none ${isMobile ? 'hidden sm:block' : ''}`}>
                  <div className="text-[7px] text-white/40 font-black uppercase tracking-wider">{s.label}</div>
                  <div className={`text-[11px] font-black ${s.cls}`}>{s.val}</div>
                </div>
                {isMobile && <div className={`text-[10px] font-black sm:hidden ${s.cls}`}>{s.val}</div>}
              </div>
            ))}
            {gameState === 'playing' && (
              <button
                onClick={() => setGameState('paused')}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                <span className="material-symbols-outlined text-base">pause</span>
              </button>
            )}
            <SoundMuteToggle className="hover:bg-white/10" iconClass="text-white/60" />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game area — mobile: không cuộn, bàn cờ co theo chiều cao màn hình */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 px-1 py-1 sm:p-3 flex-1 min-h-0 overflow-hidden justify-center items-center sm:items-stretch">
          {/* Left panel — desktop */}
          <div className="hidden sm:flex flex-col gap-3 w-20 shrink-0">
            {/* Hold */}
            <div
              className="rounded-2xl p-2 flex flex-col items-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Giữ (C)</p>
              <div
                className="w-full flex items-center justify-center rounded-xl p-1.5 min-h-[44px] transition-all"
                style={{
                  background: canHold ? 'rgba(255,255,255,0.04)' : 'rgba(255,0,0,0.05)',
                  border: `1px solid ${canHold ? 'rgba(255,255,255,0.08)' : 'rgba(255,100,100,0.2)'}`,
                }}
              >
                <MiniBoard piece={hold} />
              </div>
            </div>

            {/* Controls hint */}
            <div
              className="rounded-2xl p-2.5 flex flex-col gap-1.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Phím</p>
              {[
                ['←→', 'Di chuyển'],
                ['↑', 'Xoay'],
                ['↓', 'Hạ chậm'],
                ['Space', 'Thả ngay'],
                ['C', 'Giữ'],
                ['Esc', 'Dừng'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-1">
                  <span
                    className="text-[7px] font-black text-purple-300 px-1 py-0.5 rounded"
                    style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}
                  >{k}</span>
                  <span className="text-[7px] text-white/30 font-medium leading-tight text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Board */}
          <div className="relative shrink-0">
            <div
              style={{
                background: 'rgba(0,0,0,0.5)',
                border: '2px solid rgba(139,92,246,0.3)',
                borderRadius: 8,
                padding: 3,
                boxShadow: '0 0 30px rgba(139,92,246,0.15), inset 0 0 20px rgba(0,0,0,0.5)',
              }}
            >
              <Board
                board={board}
                current={gameState === 'playing' ? current : null}
                ghostY={ghostY}
                clearingLines={clearingLines}
                cellSize={cellSize}
              />
            </div>

            {/* Clear label pop */}
            <AnimatePresence>
              {lastClear && (
                <motion.div
                  key="clear"
                  initial={{ opacity: 0, scale: 0.6, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: -10 }}
                  exit={{ opacity: 0, scale: 0.8, y: -30 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 text-center"
                >
                  <div
                    className="font-black text-xl tracking-widest px-4 py-2 rounded-xl"
                    style={{
                      color: clearColors[lastClear.cleared],
                      background: `${clearColors[lastClear.cleared]}22`,
                      border: `1.5px solid ${clearColors[lastClear.cleared]}66`,
                      textShadow: `0 0 20px ${clearColors[lastClear.cleared]}`,
                    }}
                  >
                    {clearLabels[lastClear.cleared]}
                    {lastClear.combo > 1 && (
                      <div className="text-[11px] font-black text-white/70 mt-1">
                        COMBO x{lastClear.combo}
                      </div>
                    )}
                    <div className="text-sm font-black text-white mt-0.5">+{lastClear.pts}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Overlays */}
            <AnimatePresence>
              {gameState === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm z-40"
                  style={{ background: 'rgba(10,8,30,0.92)' }}
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="text-4xl mb-4"
                  >🟪</motion.div>
                  <h4 className="text-lg font-black text-white mb-1 tracking-wide">TETRIS</h4>
                  <p className="text-xs text-white/40 font-medium mb-6 text-center px-4">Sắp xếp các khối để ghi điểm</p>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={startGame}
                    className="px-8 py-2.5 font-black uppercase tracking-widest text-xs rounded-xl text-white"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #9333EA)' }}
                  >
                    Bắt đầu
                  </motion.button>
                </motion.div>
              )}

              {gameState === 'paused' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm z-40"
                  style={{ background: 'rgba(10,8,30,0.94)' }}
                >
                  <span className="text-3xl mb-4">⏸️</span>
                  <h4 className="text-base font-black text-white mb-5 tracking-widest">TẠM DỪNG</h4>
                  <div className="flex flex-col gap-2 w-36">
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => setGameState('playing')}
                      className="py-2 font-black uppercase tracking-widest text-[10px] rounded-xl text-white"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #9333EA)' }}
                    >
                      Tiếp tục
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={startGame}
                      className="py-2 font-black uppercase tracking-widest text-[10px] rounded-xl text-white/70"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      Chơi lại
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {gameState === 'over' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm z-40"
                  style={{ background: 'rgba(10,8,30,0.95)' }}
                >
                  <motion.div
                    initial={{ scale: 0.7, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                    className="flex flex-col items-center text-center px-4"
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                      style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid #EF4444' }}
                    >
                      <Trophy className="w-7 h-7 text-red-400" />
                    </motion.div>
                    <h4 className="text-xl font-black text-white tracking-widest mb-1">KẾT THÚC</h4>
                    <p className="text-xs text-white/40 mb-5">Thử lại để phá kỷ lục!</p>
                    <div className="flex gap-3 mb-5 w-full">
                      {[
                        { label: 'Điểm', val: score.toLocaleString(), cls: 'text-yellow-300' },
                        { label: 'Dòng', val: lines, cls: 'text-blue-300' },
                        { label: 'Cấp', val: level, cls: 'text-purple-300' },
                      ].map(s => (
                        <div
                          key={s.label}
                          className="flex-1 p-2 rounded-xl text-center"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                        >
                          <div className={`font-black text-base ${s.cls}`}>{s.val}</div>
                          <div className="text-[8px] text-white/30 uppercase font-black mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={startGame}
                      className="w-full py-2.5 font-black uppercase tracking-widest text-xs rounded-xl text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #9333EA)' }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Chơi lại
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right panel — desktop */}
          <div className="hidden sm:flex flex-col gap-3 w-20 shrink-0">
            {/* Next piece */}
            <div
              className="rounded-2xl p-2 flex flex-col items-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Tiếp theo</p>
              <div
                className="w-full flex items-center justify-center rounded-xl p-1.5 min-h-[44px]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <MiniBoard piece={next} />
              </div>
            </div>

            {/* Level progress */}
            <div
              className="rounded-2xl p-2.5 flex flex-col gap-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Cấp độ</p>
              <div className="text-center">
                <span className="text-2xl font-black text-purple-300">{level}</span>
              </div>
              {/* Lines to next level */}
              <div>
                <div className="text-[7px] text-white/30 font-bold mb-1">Dòng còn lại</div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #7C3AED, #9333EA)' }}
                    animate={{ width: `${(lines % 10) * 10}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  />
                </div>
                <div className="text-[7px] text-white/30 font-bold mt-1 text-right">{10 - (lines % 10)}</div>
              </div>
            </div>

            {/* Action button */}
            {(gameState === 'playing' || gameState === 'paused') && (
              <button
                onClick={startGame}
                className="w-full py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all hover:brightness-110"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                <RefreshCw className="w-3 h-3" />
                <span className="text-[8px] font-black uppercase tracking-widest">Mới</span>
              </button>
            )}

            {/* Speed indicator */}
            <div
              className="rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Tốc độ</p>
              <div className="flex flex-col gap-1">
                {[...Array(Math.min(level, 10))].map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-1 rounded-full"
                    style={{
                      background: i < level
                        ? `hsl(${270 - i * 15}, 80%, 60%)`
                        : 'rgba(255,255,255,0.05)',
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.04 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Touch controls — mobile */}
        <div
          className="flex sm:hidden items-center justify-between px-2 py-1.5 gap-1.5 shrink-0 touch-manipulation"
          style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onPointerDown={() => { if(gameState==='playing') { moveLeft(); dasRef.current=setTimeout(()=>{arrRef.current=setInterval(moveLeft,50)},160); }}}
            onPointerUp={() => { clearTimeout(dasRef.current); clearInterval(arrRef.current); }}
            onPointerLeave={() => { clearTimeout(dasRef.current); clearInterval(arrRef.current); }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <button
            onPointerDown={() => gameState==='playing' && rotatePiece()}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition-all"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            <span className="material-symbols-outlined text-lg">rotate_right</span>
          </button>
          <button
            onPointerDown={() => gameState==='playing' && softDrop()}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span className="material-symbols-outlined text-lg">keyboard_arrow_down</span>
          </button>
          <button
            onPointerDown={() => gameState==='playing' && hardDrop()}
            className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1 text-white/60 hover:text-white active:scale-95 transition-all font-black text-[8px] uppercase tracking-widest"
            style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.35)' }}
          >
            <ChevronUp className="w-3 h-3" />
            THẢ
          </button>
          <button
            onPointerDown={() => { if(gameState==='playing') { moveRight(); dasRef.current=setTimeout(()=>{arrRef.current=setInterval(moveRight,50)},160); }}}
            onPointerUp={() => { clearTimeout(dasRef.current); clearInterval(arrRef.current); }}
            onPointerLeave={() => { clearTimeout(dasRef.current); clearInterval(arrRef.current); }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
        <p className="hidden sm:block text-center text-[7px] text-white/25 font-bold uppercase tracking-widest pb-2 shrink-0">
          Phím ← → ↑ ↓ · Space · C · Esc
        </p>
      </motion.div>
    </div>
  );
};

export default TetrisGame;
