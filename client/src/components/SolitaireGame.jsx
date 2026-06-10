import React, { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import { X, RefreshCw, Trophy, Zap, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  primeAudio,
  solitaireFlip,
  solitairePlace,
  solitaireFoundation,
  solitaireWin,
  solitaireInvalid,
} from '../utils/sounds';
import SoundMuteToggle from './SoundMuteToggle';
import { useGameMusic } from '../hooks/useGameMusic';
import { GAME_OVERLAY_CLASS, GAME_PANEL_CLASS, useGameResponsive } from '../hooks/useGameResponsive';

const CardLayoutContext = createContext({ cardW: 52, cardH: 74, stackOff: 19 });

// ─── Constants ──────────────────────────────────────────────────────────────────
const SUITS   = ['♠', '♥', '♦', '♣'];
const RANKS   = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const RED     = new Set(['♥','♦']);
const isRed   = s => RED.has(s);
const rankVal = r => RANKS.indexOf(r);

// ─── Deck helpers ────────────────────────────────────────────────────────────────
function makeDeck() {
  return SUITS.flatMap(s => RANKS.map(r => ({ suit: s, rank: r, faceUp: false, id: `${r}${s}` })));
}
function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function deal() {
  const deck = shuffle(makeDeck());
  const tableau = Array.from({ length: 7 }, () => []);
  let i = 0;
  for (let c = 0; c < 7; c++)
    for (let r = 0; r <= c; r++)
      tableau[c].push({ ...deck[i++], faceUp: r === c });
  return { tableau, stock: deck.slice(i).map(c => ({ ...c, faceUp: false })), waste: [], foundations: [[], [], [], []] };
}

// ─── Logic ───────────────────────────────────────────────────────────────────────
const canFoundation = (card, f) =>
  f.length === 0 ? card.rank === 'A' : f[f.length-1].suit === card.suit && rankVal(card.rank) === rankVal(f[f.length-1].rank) + 1;

const canTableau = (card, col) => {
  if (col.length === 0) return card.rank === 'K';
  const top = col[col.length-1];
  return top.faceUp && isRed(card.suit) !== isRed(top.suit) && rankVal(card.rank) === rankVal(top.rank) - 1;
};
const isWon = fs => fs.every(f => f.length === 13);

// helper: remove cards from source
function removeCards(g, area, col, idx, count) {
  if (area === 'tableau')     g.tableau[col].splice(idx, count);
  else if (area === 'foundation') g.foundations[col].pop();
  else if (area === 'waste')  g.waste.pop();
}

// ─── Confetti particle ────────────────────────────────────────────────────────────
const Confetto = ({ delay }) => {
  const colors = ['#facc15','#22c55e','#3b82f6','#f43f5e','#a855f7','#fb923c'];
  const color  = colors[Math.floor(Math.random() * colors.length)];
  const x      = Math.random() * 100;
  const rot    = Math.random() * 720 - 360;
  const size   = 6 + Math.random() * 8;
  return (
    <motion.div
      initial={{ opacity: 1, y: -20, x: `${x}vw`, rotate: 0, scale: 1 }}
      animate={{ opacity: 0, y: '110vh', rotate: rot, scale: 0.4 }}
      transition={{ duration: 2.5 + Math.random() * 1.5, delay, ease: 'easeIn' }}
      style={{
        position: 'fixed', top: 0, left: 0, width: size, height: size,
        borderRadius: Math.random() > 0.5 ? '50%' : 2,
        background: color, zIndex: 9999, pointerEvents: 'none',
      }}
    />
  );
};

// ─── Card visuals ────────────────────────────────────────────────────────────────
const CardFace = ({ card }) => {
  const red = isRed(card.suit);
  const col = red ? '#dc2626' : '#1e1e1e';
  return (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'3px 4px', boxSizing:'border-box', userSelect:'none' }}>
      <div style={{ fontSize: card.rank === '10' ? 9 : 10, fontWeight: 900, color: col, lineHeight: 1.1 }}>
        <div>{card.rank}</div>
        <div style={{ fontSize: 10 }}>{card.suit}</div>
      </div>
      <div style={{ textAlign:'center', fontSize: 20, color: col, lineHeight: 1 }}>{card.suit}</div>
      <div style={{ fontSize: card.rank === '10' ? 9 : 10, fontWeight: 900, color: col, lineHeight: 1.1, transform:'rotate(180deg)', textAlign:'left' }}>
        <div>{card.rank}</div>
        <div style={{ fontSize: 10 }}>{card.suit}</div>
      </div>
    </div>
  );
};

const CardBack = () => (
  <div style={{
    width:'100%', height:'100%', borderRadius: 4, overflow:'hidden',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1d4ed8 100%)',
  }}>
    <div style={{
      width:'100%', height:'100%',
      backgroundImage:'repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0, rgba(255,255,255,0.12) 2px, transparent 2px, transparent 8px)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <div style={{ fontSize:14, opacity:0.5, color: '#93c5fd', fontWeight: 900 }}>✦</div>
    </div>
  </div>
);

// ─── Animated Card ───────────────────────────────────────────────────────────────
const AnimCard = ({ card, selected, glow, onClick, onDragStart, draggable, style = {}, className = '', noLayoutId }) => {
  const { cardW, cardH } = useContext(CardLayoutContext);
  const border = selected
    ? '2px solid #facc15'
    : glow
      ? '2px solid rgba(250,204,21,0.5)'
      : '1.5px solid rgba(0,0,0,0.18)';
  const shadow = selected
    ? '0 0 0 2px #facc15, 0 6px 20px rgba(0,0,0,0.45)'
    : '0 3px 10px rgba(0,0,0,0.3)';

  return (
    <motion.div
      layoutId={noLayoutId ? undefined : card.id}
      layout="position"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 23 }}
      onClick={onClick}
      draggable={draggable && card.faceUp}
      onDragStart={onDragStart}
      whileHover={card.faceUp ? { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' } : {}}
      whileTap={card.faceUp ? { scale: 0.97 } : {}}
      style={{
        width: cardW, height: cardH, borderRadius: 6,
        border, boxShadow: shadow,
        background: card.faceUp ? '#fff' : undefined,
        cursor: card.faceUp ? (draggable ? 'grab' : 'pointer') : 'default',
        userSelect: 'none', flexShrink: 0,
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      {card.faceUp ? <CardFace card={card} /> : <CardBack />}
    </motion.div>
  );
};

// ─── Flip Wrapper (3D card reveal) ───────────────────────────────────────────────
const FlipCard = ({ card, ...props }) => {
  const { cardW, cardH } = useContext(CardLayoutContext);
  const [flipped, setFlipped] = useState(false);
  const prevFaceUp = useRef(card.faceUp);

  useEffect(() => {
    if (!prevFaceUp.current && card.faceUp) setFlipped(true);
    prevFaceUp.current = card.faceUp;
  }, [card.faceUp]);

  return (
    <motion.div
      layoutId={card.id}
      layout="position"
      style={{ perspective: 600, width: cardW, height: cardH }}
      animate={flipped ? { rotateY: [0, 90, 0] } : {}}
      transition={{ duration: 0.35, times: [0, 0.5, 1] }}
      onAnimationComplete={() => setFlipped(false)}
    >
      <AnimCard card={card} noLayoutId {...props} />
    </motion.div>
  );
};

// ─── Empty Slot ───────────────────────────────────────────────────────────────────
const EmptySlot = ({ label, onClick, onDragOver, onDrop, highlight }) => {
  const { cardW, cardH } = useContext(CardLayoutContext);
  return (
  <motion.div
    animate={highlight ? { borderColor: '#facc15', background: 'rgba(250,204,21,0.1)' } : { borderColor: 'rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.04)' }}
    onClick={onClick}
    onDragOver={onDragOver}
    onDrop={onDrop}
    style={{
      width: cardW, height: cardH, borderRadius: 6,
      border: '1.5px dashed rgba(255,255,255,0.22)',
      display:'flex', alignItems:'center', justifyContent:'center',
      cursor:'pointer', flexShrink:0,
    }}
  >
    {label && <span style={{ color:'rgba(255,255,255,0.28)', fontSize: Math.max(10, cardW * 0.22), fontWeight:900 }}>{label}</span>}
  </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────────
const SolitaireGame = ({ onClose }) => {
  const { cardW, cardH, cardStackOffset, isMobile } = useGameResponsive();
  useGameMusic('solitaire');
  const cardLayout = { cardW, cardH, stackOff: cardStackOffset };

  const [game, setGame]       = useState(() => deal());
  const [sel, setSel]         = useState(null);   // { area, col, idx, cards }
  const [dragSrc, setDragSrc] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [moves, setMoves]     = useState(0);
  const [secs, setSecs]       = useState(0);
  const [score, setScore]     = useState(0);
  const [won, setWon]         = useState(false);
  const [confetti, setConfetti] = useState([]);
  const timerRef = useRef(null);

  // Timer
  useEffect(() => {
    if (!won) timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [won]);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const checkWin = useCallback(fs => {
    if (isWon(fs)) {
      clearInterval(timerRef.current);
      setWon(true);
      setConfetti(Array.from({ length: 60 }, (_, i) => i));
      solitaireWin();
    }
  }, []);

  // ─── State mutation helper ──────────────────────────────────────────────────
  const commit = useCallback((fn, pts = 0, sfx = 'place') => {
    if (sfx === 'foundation') solitaireFoundation();
    else if (sfx === 'place') solitairePlace();
    setGame(prev => {
      const next = fn(JSON.parse(JSON.stringify(prev)));
      next.tableau.forEach(col => {
        if (col.length > 0 && !col[col.length-1].faceUp) col[col.length-1].faceUp = true;
      });
      checkWin(next.foundations);
      return next;
    });
    setMoves(m => m + 1);
    if (pts) setScore(s => s + pts);
    setSel(null);
  }, [checkWin]);

  useEffect(() => { primeAudio(); }, []);

  // ─── Stock click ────────────────────────────────────────────────────────────
  const clickStock = useCallback(() => {
    solitaireFlip();
    setGame(prev => {
      const g = JSON.parse(JSON.stringify(prev));
      if (g.stock.length === 0) {
        g.stock = [...g.waste].reverse().map(c => ({ ...c, faceUp: false }));
        g.waste = [];
      } else {
        const c = g.stock.pop();
        c.faceUp = true;
        g.waste.push(c);
      }
      return g;
    });
    setMoves(m => m + 1);
    setSel(null);
  }, []);

  // ─── Auto-move to foundation ─────────────────────────────────────────────────
  const autoFoundation = useCallback((cards, fromArea, fromCol, fromIdx) => {
    if (cards.length !== 1) return false;
    const card = cards[0];
    let targetFi = -1;
    for (let fi = 0; fi < 4; fi++) {
      if (canFoundation(card, game.foundations[fi])) {
        targetFi = fi;
        break;
      }
    }
    if (targetFi === -1) return false;
    solitaireFoundation();
    setGame(prev => {
      const g = JSON.parse(JSON.stringify(prev));
      removeCards(g, fromArea, fromCol, fromIdx, 1);
      g.foundations[targetFi].push(card);
      g.tableau.forEach(col => {
        if (col.length > 0 && !col[col.length-1].faceUp) col[col.length-1].faceUp = true;
      });
      checkWin(g.foundations);
      return g;
    });
    setMoves(m => m + 1);
    setScore(s => s + 10);
    setSel(null);
    return true;
  }, [game, checkWin]);

  // ─── Click a card ─────────────────────────────────────────────────────────────
  const clickCard = useCallback((area, col, idx, card, cards) => {
    if (!card.faceUp) return;
    if (!sel) {
      setSel({ area, col, idx, cards });
      return;
    }
    const src = sel;

    if (area === 'foundation' && src.cards.length === 1 && canFoundation(src.cards[0], game.foundations[col])) {
      commit(g => { removeCards(g, src.area, src.col, src.idx, src.cards.length); g.foundations[col].push(src.cards[0]); return g; }, 10, 'foundation');
      return;
    }
    if (area === 'tableau') {
      const tc = game.tableau[col];
      if (canTableau(src.cards[0], tc)) {
        commit(g => { removeCards(g, src.area, src.col, src.idx, src.cards.length); g.tableau[col].push(...src.cards); return g; }, 5, 'place');
        return;
      }
      solitaireInvalid();
      return;
    }
    if (area === 'foundation' && src.cards.length === 1) {
      solitaireInvalid();
      return;
    }
    // reselect or deselect
    if (area === src.area && col === src.col && idx === src.idx) setSel(null);
    else setSel({ area, col, idx, cards });
  }, [sel, game, commit]);

  const clickEmptyTab = useCallback(col => {
    if (!sel || sel.cards[0].rank !== 'K') { if (sel) solitaireInvalid(); setSel(null); return; }
    commit(g => { removeCards(g, sel.area, sel.col, sel.idx, sel.cards.length); g.tableau[col].push(...sel.cards); return g; }, 5, 'place');
  }, [sel, commit]);

  const clickEmptyFound = useCallback(fi => {
    if (!sel || sel.cards.length !== 1 || sel.cards[0].rank !== 'A') { if (sel) solitaireInvalid(); setSel(null); return; }
    commit(g => { removeCards(g, sel.area, sel.col, sel.idx, 1); g.foundations[fi].push(sel.cards[0]); return g; }, 10, 'foundation');
  }, [sel, commit]);

  // ─── Drag & Drop ─────────────────────────────────────────────────────────────
  const onDragStartHandler = useCallback((area, col, idx, cards) => {
    setDragSrc({ area, col, idx, cards }); setSel(null);
  }, []);

  const onDropHandler = useCallback((toArea, toCol) => {
    if (!dragSrc) return;
    setDragOver(null);
    const src = dragSrc;
    let moved = false;
    if (toArea === 'foundation' && src.cards.length === 1 && canFoundation(src.cards[0], game.foundations[toCol])) {
      commit(g => { removeCards(g, src.area, src.col, src.idx, src.cards.length); g.foundations[toCol].push(src.cards[0]); return g; }, 10, 'foundation');
      moved = true;
    } else if (toArea === 'tableau') {
      const tc = game.tableau[toCol];
      if (canTableau(src.cards[0], tc) || (tc.length === 0 && src.cards[0].rank === 'K')) {
        commit(g => { removeCards(g, src.area, src.col, src.idx, src.cards.length); g.tableau[toCol].push(...src.cards); return g; }, 5, 'place');
        moved = true;
      }
    }
    if (!moved) solitaireInvalid();
    setDragSrc(null);
  }, [dragSrc, game, commit]);

  const onDragOverHandler = useCallback((e, area, col) => { e.preventDefault(); setDragOver({ area, col }); }, []);

  // ─── New game ─────────────────────────────────────────────────────────────────
  const newGame = useCallback(() => {
    clearInterval(timerRef.current);
    setGame(deal()); setSel(null); setMoves(0); setSecs(0); setScore(0);
    setWon(false); setConfetti([]); setDragSrc(null); setDragOver(null);
  }, []);

  // ─── Render helpers ───────────────────────────────────────────────────────────
  const { tableau, stock, waste, foundations } = game;
  const wasteTop   = waste.length > 0 ? waste[waste.length-1] : null;
  const isSel      = (area, col, idx) => sel && sel.area === area && sel.col === col && sel.idx === idx;
  const isInSel    = (col, idx) => sel?.area === 'tableau' && sel.col === col && idx >= sel.idx;
  const isDO       = (area, col) => dragOver && dragOver.area === area && dragOver.col === col;

  // ─── Card row in tableau (click selects whole stack) ─────────────────────────
  const makeTabCards = (col, ci) =>
    col.map((card, idx) => {
      const isTop    = idx === col.length - 1;
      const cards    = col.slice(idx);
      const OFFSET   = card.faceUp ? cardStackOffset : Math.round(cardStackOffset * 0.58);
      const selThis  = isSel('tableau', ci, idx) || (isInSel(ci, idx) && card.faceUp);

      return (
        <div key={card.id} style={{ marginTop: idx === 0 ? 0 : -74 + OFFSET, zIndex: idx, position: 'relative' }}>
          <FlipCard
            card={card}
            selected={selThis}
            glow={isDO('tableau', ci) && isTop}
            draggable={card.faceUp}
            onClick={() => {
              if (!card.faceUp) return;
              if (!sel) {
                if (isTop && autoFoundation([card], 'tableau', ci, idx)) return;
                setSel({ area:'tableau', col:ci, idx, cards });
              } else {
                clickCard('tableau', ci, idx, card, cards);
              }
            }}
            onDragStart={() => card.faceUp && onDragStartHandler('tableau', ci, idx, cards)}
          />
        </div>
      );
    });

  return (
    <div
      className={GAME_OVERLAY_CLASS}
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Confetti */}
      <AnimatePresence>
        {confetti.map(i => <Confetto key={i} delay={i * 0.04} />)}
      </AnimatePresence>

      {/* Modal */}
      <CardLayoutContext.Provider value={cardLayout}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className={GAME_PANEL_CLASS}
        style={{
          background: 'linear-gradient(160deg, #14532d 0%, #166534 55%, #15803d 100%)',
          border: '1.5px solid rgba(255,255,255,0.12)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-4 py-3.5 shrink-0"
          style={{ background:'rgba(0,0,0,0.3)', borderBottom:'1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate:[0, -10, 10, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, repeatDelay: 3 }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <span className="material-symbols-outlined text-green-300" style={{ fontSize: 18 }}>playing_cards</span>
            </motion.div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide">Solitaire</h3>
              <p className="text-[8px] text-green-300/70 font-bold uppercase tracking-widest">Klondike</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Stat pills */}
            <div className={`${isMobile ? 'hidden' : 'flex'} items-center gap-2.5`}>
            {[
              { label:'Điểm', val: score, icon: <Trophy className="w-3.5 h-3.5 text-amber-400" />, cls:'text-amber-300', border: 'border-amber-500/20 bg-amber-500/5 shadow-amber-950/20' },
              { label:'Nước đi', val: moves, icon: <Zap className="w-3.5 h-3.5 text-blue-400" />, cls:'text-blue-300', border: 'border-blue-500/20 bg-blue-500/5 shadow-blue-950/20' },
              { label:'Thời gian', val: fmt(secs), icon: <Timer className="w-3.5 h-3.5 text-emerald-400" />, cls:'text-emerald-300 font-mono', border: 'border-emerald-500/20 bg-emerald-500/5 shadow-emerald-950/20' },
            ].map(s => (
              <div 
                key={s.label} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border backdrop-blur-md shadow-lg transition-all ${s.border}`}
              >
                {s.icon}
                <div className="text-left leading-none">
                  <div className="text-[8px] text-white/50 font-black uppercase tracking-wider mb-0.5">{s.label}</div>
                  <motion.div
                    key={s.val}
                    initial={{ scale: 1.15, filter: 'brightness(1.3)' }}
                    animate={{ scale: 1, filter: 'brightness(1)' }}
                    className={`text-[12px] font-black tracking-wide ${s.cls}`}
                  >
                    {s.val}
                  </motion.div>
                </div>
              </div>
            ))}
            </div>
            {isMobile && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black text-amber-300" style={{ background: 'rgba(0,0,0,0.25)' }}>
                <Trophy className="w-3 h-3" />{score}
              </div>
            )}
            <SoundMuteToggle className="hover:bg-white/10" iconClass="text-white/70" />
            <button onClick={newGame} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-all shrink-0" style={{ color:'rgba(255,255,255,0.7)' }}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-all shrink-0" style={{ color:'rgba(255,255,255,0.7)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Game Area ── */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-2 sm:p-3 min-h-0" style={{ overscrollBehavior:'contain', WebkitOverflowScrolling: 'touch' }}>

          {/* Top Row */}
          <div className="flex items-start gap-1 sm:gap-1.5 mb-3 min-w-[min(100%,340px)]">

            {/* Stock */}
            <motion.div whileTap={{ scale: 0.93 }} onClick={clickStock} style={{ cursor:'pointer' }}>
              {stock.length > 0
                ? <AnimCard card={{ ...stock[stock.length - 1], faceUp: false }} />
                : <EmptySlot label="↩" onDragOver={e => e.preventDefault()} onClick={clickStock} />
              }
            </motion.div>

            {/* Waste */}
            <div style={{ width: cardW, height: cardH, position:'relative', flexShrink: 0 }}>
              <AnimatePresence>
                {wasteTop ? (
                  <AnimCard
                    key={wasteTop.id}
                    card={wasteTop}
                    draggable
                    selected={sel?.area === 'waste'}
                    onClick={() => {
                      if (!sel) {
                        if (autoFoundation([wasteTop], 'waste', -1, waste.length-1)) return;
                        setSel({ area:'waste', col:-1, idx:waste.length-1, cards:[wasteTop] });
                      } else {
                        clickCard('waste', -1, waste.length-1, wasteTop, [wasteTop]);
                      }
                    }}
                    onDragStart={() => onDragStartHandler('waste', -1, waste.length-1, [wasteTop])}
                    style={{ position:'absolute', top:0, left:0 }}
                  />
                ) : (
                  <EmptySlot label="Waste" />
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1" />

            {/* Foundations */}
            {foundations.map((f, fi) => {
              const top  = f.length > 0 ? f[f.length-1] : null;
              const over = isDO('foundation', fi);
              return (
                <div
                  key={fi}
                  onDragOver={e => onDragOverHandler(e, 'foundation', fi)}
                  onDrop={() => onDropHandler('foundation', fi)}
                >
                  <AnimatePresence>
                    {top ? (
                      <AnimCard
                        key={top.id}
                        card={top}
                        draggable
                        selected={isSel('foundation', fi, f.length-1)}
                        glow={over}
                        onClick={() => {
                          if (!sel) setSel({ area:'foundation', col:fi, idx:f.length-1, cards:[top] });
                          else clickCard('foundation', fi, f.length-1, top, [top]);
                        }}
                        onDragStart={() => onDragStartHandler('foundation', fi, f.length-1, [top])}
                      />
                    ) : (
                      <EmptySlot
                        key={`ef-${fi}`}
                        label={SUITS[fi]}
                        highlight={over || (sel?.cards?.[0]?.rank === 'A')}
                        onClick={() => clickEmptyFound(fi)}
                        onDragOver={e => onDragOverHandler(e, 'foundation', fi)}
                        onDrop={() => onDropHandler('foundation', fi)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Tableau */}
          <div className="flex gap-0.5 sm:gap-1.5 items-start min-w-[min(100%,340px)]">
            {tableau.map((col, ci) => (
              <div
                key={ci}
                className="flex-1 flex flex-col min-w-0"
                style={{ minHeight: cardH }}
                onDragOver={e => onDragOverHandler(e, 'tableau', ci)}
                onDrop={() => onDropHandler('tableau', ci)}
              >
                {col.length === 0 ? (
                  <EmptySlot
                    highlight={isDO('tableau', ci) || (sel?.cards?.[0]?.rank === 'K')}
                    onClick={() => clickEmptyTab(ci)}
                  />
                ) : (
                  makeTabCards(col, ci)
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Win Overlay ── */}
        <AnimatePresence>
          {won && (
            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              exit={{ opacity:0 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md"
              style={{ background:'rgba(5,40,20,0.92)' }}
            >
              <motion.div
                initial={{ scale:0.7, y:30, opacity:0 }}
                animate={{ scale:1, y:0, opacity:1 }}
                transition={{ type:'spring', stiffness:280, damping:20, delay:0.1 }}
                className="w-full max-w-[300px] p-8 rounded-2xl flex flex-col items-center text-center"
                style={{
                  background:'linear-gradient(135deg,#14532d,#0d3d1f)',
                  border:'1.5px solid rgba(134,239,172,0.5)',
                  boxShadow:'0 0 50px rgba(134,239,172,0.25)',
                }}
              >
                <motion.div
                  animate={{ y:[0,-12,0], rotate:[0,8,-8,0] }}
                  transition={{ repeat:Infinity, duration:2, ease:'easeInOut' }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                  style={{ background: 'rgba(134,239,172,0.15)', border: '2px solid #86efac' }}
                >
                  <Trophy className="w-8 h-8 text-green-300" />
                </motion.div>

                <motion.h4
                  initial={{ opacity:0, y:-10 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay:0.25 }}
                  className="text-2xl font-black text-green-300 tracking-widest mb-1"
                >THẮNG RỒI!</motion.h4>

                <motion.p
                  initial={{ opacity:0 }}
                  animate={{ opacity:1 }}
                  transition={{ delay:0.35 }}
                  className="text-green-200/60 text-xs font-semibold mb-5"
                >Bạn đã hoàn thành Solitaire Klondike!</motion.p>

                <motion.div
                  initial={{ opacity:0, y:10 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay:0.45 }}
                  className="flex gap-3 mb-6 w-full"
                >
                  {[
                    { label:'Điểm', val: score, cls:'text-yellow-300' },
                    { label:'Thời gian', val: fmt(secs), cls:'text-white font-mono' },
                    { label:'Nước đi', val: moves, cls:'text-white' },
                  ].map(s => (
                    <div key={s.label} className="flex-1 text-center p-3 rounded-xl" style={{ background:'rgba(0,0,0,0.35)' }}>
                      <div className={`font-black text-lg ${s.cls}`}>{s.val}</div>
                      <div className="text-green-300/55 text-[9px] uppercase font-black mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </motion.div>

                <motion.button
                  initial={{ opacity:0, y:10 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay:0.55 }}
                  whileHover={{ scale:1.03 }}
                  whileTap={{ scale:0.96 }}
                  onClick={newGame}
                  className="w-full py-3 font-black uppercase tracking-widest text-sm rounded-xl"
                  style={{ background:'#22c55e', color:'#052e16' }}
                >
                  Chơi ván mới
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      </CardLayoutContext.Provider>
    </div>
  );
};

export default SolitaireGame;
