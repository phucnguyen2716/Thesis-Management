import React, { useState } from 'react';
import CitationQuizGame from './games/CitationQuizGame';
import GradingRushGame from './games/GradingRushGame';
import FacultyMemoryGame from './games/FacultyMemoryGame';
import GameArenaHub from '../games/GameArenaHub';
import { primeAudio } from '../../utils/sounds';

const GAMES = [
  {
    id: 'quiz',
    title: 'Quiz Đạo văn',
    desc: 'Trích dẫn · AI · quy trình xử lý — 4 câu sprint',
    icon: 'gavel',
    accent: 'from-teal-600 to-cyan-600',
    tag: 'PRO',
  },
  {
    id: 'rush',
    title: 'Grading Rush',
    desc: '30 giây chấm điểm — phản xạ tối đa',
    icon: 'bolt',
    accent: 'from-amber-500 to-orange-600',
    tag: 'RUSH',
  },
  {
    id: 'memory',
    title: 'Thuật ngữ GV',
    desc: 'Lật thẻ ghép cặp học thuật',
    icon: 'psychology',
    accent: 'from-indigo-600 to-violet-600',
    tag: 'BRAIN',
  },
];

const LecturerMiniGameHub = () => {
  const [activeGame, setActiveGame] = useState(null);

  const launch = id => {
    primeAudio();
    setActiveGame(id);
  };

  return (
    <>
      <GameArenaHub
        theme="lecturer"
        title="Faculty Game Lab"
        subtitle="Mini-game riêng portal GV — không trùng sinh viên"
        games={GAMES}
        activeId={activeGame}
        onPlay={launch}
      />
      {activeGame === 'quiz' && <CitationQuizGame onClose={() => setActiveGame(null)} />}
      {activeGame === 'rush' && <GradingRushGame onClose={() => setActiveGame(null)} />}
      {activeGame === 'memory' && <FacultyMemoryGame onClose={() => setActiveGame(null)} />}
    </>
  );
};

export default LecturerMiniGameHub;
