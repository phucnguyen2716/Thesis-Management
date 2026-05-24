import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GAME_OVERLAY_CLASS, GAME_PANEL_CLASS } from '../../../hooks/useGameResponsive';
import SoundMuteToggle from '../../SoundMuteToggle';

const QUESTIONS = [
  {
    q: 'Trích dẫn APA yêu cầu gì khi paraphrase?',
    choices: ['Không cần nguồn', 'Vẫn ghi nguồn', 'Chỉ khi >50% giống', 'Chỉ sách giáo khoa'],
    correct: 1,
  },
  {
    q: 'Similarity 35% thường được xử lý thế nào?',
    choices: ['Bỏ qua', 'Xem xét / yêu cầu sửa', 'Tự động đậu', 'Chỉ cảnh báo email'],
    correct: 1,
  },
  {
    q: 'Đoạn do AI viết 90% nên ghi nhận ra sao?',
    choices: ['Không ảnh hưởng', 'Theo quy chế AI của trường', 'Luôn đạo văn', 'Chỉ phạt nếu copy PDF'],
    correct: 1,
  },
  {
    q: 'Giảng viên nên làm gì khi nghi ngờ đạo văn?',
    choices: ['Chấm luôn', 'Mở báo cáo so khớp + phản hồi', 'Hủy đồ án', 'Đăng mạng xã hội'],
    correct: 1,
  },
];

const CitationQuizGame = ({ onClose }) => {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[idx];

  const choose = i => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correct) setScore(s => s + 1);
    setTimeout(() => {
      if (idx + 1 >= QUESTIONS.length) setDone(true);
      else {
        setIdx(x => x + 1);
        setPicked(null);
      }
    }, 900);
  };

  return (
    <div className={GAME_OVERLAY_CLASS}>
      <div className={`${GAME_PANEL_CLASS} max-w-md border-teal-200 shadow-[0_0_60px_rgba(13,148,136,0.45)] ring-2 ring-teal-400/30`}>
        <div className="flex justify-between items-center p-4 border-b border-teal-100 bg-teal-900 text-white rounded-t-2xl">
          <div>
            <h2 className="font-black text-lg">Quiz Đạo văn GV</h2>
            <p className="text-xs text-teal-200">Mini-game dành giảng viên</p>
          </div>
          <div className="flex gap-2">
            <SoundMuteToggle className="!text-white" />
            <button type="button" onClick={onClose} className="material-symbols-outlined hover:bg-white/10 rounded-lg p-1">
              close
            </button>
          </div>
        </div>
        <div className="p-6">
          {done ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-4"
            >
              <motion.span
                animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 0.6 }}
                className="material-symbols-outlined text-6xl text-amber-500 block"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </motion.span>
              <p className="text-3xl font-black bg-gradient-to-r from-teal-800 to-cyan-600 bg-clip-text text-transparent">
                {score}/{QUESTIONS.length} đúng
              </p>
              <button type="button" onClick={onClose} className="w-full py-3 bg-teal-900 text-white rounded-xl font-bold">
                Đóng
              </button>
            </motion.div>
          ) : (
            <>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                Câu {idx + 1}/{QUESTIONS.length}
              </p>
              <p className="text-base font-bold text-slate-900 mb-4">{q.q}</p>
              <div className="space-y-2">
                {q.choices.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => choose(i)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      picked === null
                        ? 'border-slate-200 hover:border-teal-400 hover:bg-teal-50'
                        : i === q.correct
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : picked === i
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : 'border-slate-100 opacity-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitationQuizGame;
