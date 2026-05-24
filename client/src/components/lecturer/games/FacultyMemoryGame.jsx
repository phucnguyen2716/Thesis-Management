import React, { useState, useEffect } from 'react';
import { GAME_OVERLAY_CLASS, GAME_PANEL_CLASS } from '../../../hooks/useGameResponsive';
import SoundMuteToggle from '../../SoundMuteToggle';

const PAIRS = [
  { id: 'a', term: 'BM25', def: 'So khớp văn bản' },
  { id: 'b', term: 'Rubric', def: 'Thang chấm điểm' },
  { id: 'c', term: 'Turnitin', def: 'Kiểm tra trùng' },
  { id: 'd', term: 'Heatmap', def: 'Bản đồ AI' },
  { id: 'e', term: 'Paraphrase', def: 'Diễn đạt lại' },
  { id: 'f', term: 'Citation', def: 'Trích dẫn nguồn' },
];

const buildDeck = () => {
  const cards = [];
  PAIRS.forEach(p => {
    cards.push({ uid: `${p.id}-t`, pairId: p.id, text: p.term, kind: 'term' });
    cards.push({ uid: `${p.id}-d`, pairId: p.id, text: p.def, kind: 'def' });
  });
  return cards.sort(() => Math.random() - 0.5);
};

const FacultyMemoryGame = ({ onClose }) => {
  const [deck, setDeck] = useState(buildDeck);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [lock, setLock] = useState(false);
  const [moves, setMoves] = useState(0);

  const flip = uid => {
    if (lock || flipped.includes(uid) || matched.includes(deck.find(c => c.uid === uid)?.pairId)) return;
    const next = [...flipped, uid];
    setFlipped(next);
    if (next.length === 2) {
      setMoves(m => m + 1);
      setLock(true);
      const [a, b] = next.map(id => deck.find(c => c.uid === id));
      if (a.pairId === b.pairId) {
        setMatched(m => [...m, a.pairId]);
        setFlipped([]);
        setLock(false);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setLock(false);
        }, 800);
      }
    }
  };

  const won = matched.length === PAIRS.length;

  useEffect(() => {
    if (won) setDeck(buildDeck());
  }, []);

  const reset = () => {
    setDeck(buildDeck());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  };

  return (
    <div className={GAME_OVERLAY_CLASS}>
      <div className={`${GAME_PANEL_CLASS} max-w-lg border-teal-200`}>
        <div className="flex justify-between items-center p-4 border-b bg-teal-900 text-white rounded-t-2xl">
          <h2 className="font-black">Thuật ngữ GV</h2>
          <div className="flex gap-2">
            <span className="text-xs font-bold">{moves} lượt</span>
            <SoundMuteToggle className="!text-white" />
            <button type="button" onClick={onClose} className="material-symbols-outlined">close</button>
          </div>
        </div>
        <div className="p-4">
          {won ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-xl font-black text-teal-900">Hoàn thành!</p>
              <p className="text-sm text-slate-500">{moves} lượt lật</p>
              <button type="button" onClick={reset} className="px-6 py-2 bg-teal-900 text-white rounded-xl font-bold">
                Chơi lại
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {deck.map(card => {
                const isFlipped = flipped.includes(card.uid) || matched.includes(card.pairId);
                return (
                  <button
                    key={card.uid}
                    type="button"
                    onClick={() => flip(card.uid)}
                    className={`aspect-[4/3] rounded-lg text-[10px] sm:text-xs font-bold p-1 transition-all ${
                      isFlipped
                        ? 'bg-teal-100 border-2 border-teal-700 text-teal-900'
                        : 'bg-slate-700 border-slate-800 text-transparent hover:bg-slate-600'
                    }`}
                  >
                    {isFlipped ? card.text : '?'}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyMemoryGame;
