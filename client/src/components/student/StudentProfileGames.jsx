import React, { useState } from 'react';
import WordChainModal from '../WordChainGame';
import SolitaireGame from '../SolitaireGame';
import TetrisGame from '../TetrisGame';
import GameArenaHub from '../games/GameArenaHub';
import { ChessModal } from '../../pages/Profile';
import {
  primeAudio,
  gameOpenChess,
  gameOpenWord,
  gameOpenSolitaire,
  gameOpenTetris,
} from '../../utils/sounds';
import { startGameMusic } from '../../utils/gameMusic';
import { logStudentActivity } from '../../utils/studentActivityStats';

const GAMES = [
  {
    id: 'chess',
    title: 'Cờ Vua vs AI',
    desc: '3 độ khó · phản xạ chiến thuật',
    icon: 'strategy',
    accent: 'from-amber-500 to-orange-600',
    tag: 'HOT',
  },
  {
    id: 'word',
    title: 'Nối Chữ',
    desc: '20 cấp · từ vựng học thuật',
    icon: 'abc',
    accent: 'from-sky-500 to-blue-700',
    tag: 'NEW',
  },
  {
    id: 'solitaire',
    title: 'Solitaire',
    desc: 'Klondike classic · chill mode',
    icon: 'playing_cards',
    accent: 'from-emerald-500 to-teal-700',
    tag: 'RELAX',
  },
  {
    id: 'tetris',
    title: 'Tetris Blitz',
    desc: '10 cấp · tốc độ & combo',
    icon: 'view_quilt',
    accent: 'from-fuchsia-500 to-purple-700',
    tag: 'BLITZ',
  },
];

const StudentProfileGames = ({ className = '', compact = false, vertical = false }) => {
  const [active, setActive] = useState(null);

  const launch = id => {
    logStudentActivity('game_play', { game: id });
    if (id === 'chess') {
      primeAudio().then(() => startGameMusic('chess'));
      gameOpenChess();
    } else if (id === 'word') {
      primeAudio();
      gameOpenWord();
    } else if (id === 'solitaire') {
      primeAudio();
      gameOpenSolitaire();
    } else if (id === 'tetris') {
      primeAudio();
      gameOpenTetris();
    }
    setActive(id);
  };

  return (
    <div className={className}>
      <GameArenaHub
        theme="student"
        compact={compact}
        vertical={vertical}
        title="Mini-game"
        subtitle={compact ? undefined : 'Giải trí sau giờ học — mở full màn hình, có nhạc & hiệu ứng'}
        games={GAMES}
        activeId={active}
        onPlay={launch}
      />
      {active === 'chess' && <ChessModal onClose={() => setActive(null)} />}
      {active === 'word' && <WordChainModal onClose={() => setActive(null)} />}
      {active === 'solitaire' && <SolitaireGame onClose={() => setActive(null)} />}
      {active === 'tetris' && <TetrisGame onClose={() => setActive(null)} />}
    </div>
  );
};

export default StudentProfileGames;
