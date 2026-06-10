import React, { useState, useEffect, useCallback } from 'react';
import { GAME_OVERLAY_CLASS, GAME_PANEL_CLASS } from '../../../hooks/useGameResponsive';
import SoundMuteToggle from '../../SoundMuteToggle';

const GradingRushGame = ({ onClose }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targets, setTargets] = useState([]);
  const [running, setRunning] = useState(false);
  const [ended, setEnded] = useState(false);

  const spawn = useCallback(() => {
    setTargets(prev => [
      ...prev.slice(-8),
      {
        id: Date.now() + Math.random(),
        x: 10 + Math.random() * 75,
        y: 10 + Math.random() * 55,
        label: ['Đạt', 'Sửa', 'Chấm'][Math.floor(Math.random() * 3)],
      },
    ]);
  }, []);

  useEffect(() => {
    if (!running || ended) return;
    const t = setInterval(() => setTimeLeft(x => x - 1), 1000);
    return () => clearInterval(t);
  }, [running, ended]);

  useEffect(() => {
    if (timeLeft <= 0 && running) {
      setRunning(false);
      setEnded(true);
    }
  }, [timeLeft, running]);

  useEffect(() => {
    if (!running || ended) return;
    const s = setInterval(spawn, 700);
    return () => clearInterval(s);
  }, [running, ended, spawn]);

  const start = () => {
    setScore(0);
    setTimeLeft(30);
    setTargets([]);
    setEnded(false);
    setRunning(true);
    spawn();
  };

  const tap = id => {
    setScore(s => s + 1);
    setTargets(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className={GAME_OVERLAY_CLASS}>
      <div className={`${GAME_PANEL_CLASS} max-w-lg border-teal-200`}>
        <div className="flex justify-between items-center p-4 border-b bg-teal-900 text-white rounded-t-2xl">
          <h2 className="font-black">Grading Rush</h2>
          <div className="flex gap-2 items-center">
            <span className="text-sm font-bold tabular-nums">{timeLeft}s · {score}đ</span>
            <SoundMuteToggle className="!text-white" />
            <button type="button" onClick={onClose} className="material-symbols-outlined">close</button>
          </div>
        </div>
        <div className="p-4">
          {!running && !ended && (
            <div className="text-center py-8 space-y-4">
              <p className="text-sm text-slate-600">Chạm nhanh các nhãn chấm điểm trong 30 giây!</p>
              <button type="button" onClick={start} className="px-8 py-3 bg-teal-900 text-white rounded-xl font-bold">
                Bắt đầu
              </button>
            </div>
          )}
          {ended && (
            <div className="text-center py-8 space-y-4">
              <p className="text-3xl font-black text-teal-900">{score} điểm</p>
              <button type="button" onClick={start} className="mr-2 px-6 py-2 border border-teal-800 text-teal-900 rounded-xl font-bold">
                Chơi lại
              </button>
              <button type="button" onClick={onClose} className="px-6 py-2 bg-teal-900 text-white rounded-xl font-bold">
                Đóng
              </button>
            </div>
          )}
          {running && (
            <div className="relative h-[320px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              {targets.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => tap(t.id)}
                  className="absolute px-3 py-2 bg-white border-2 border-teal-700 rounded-lg text-xs font-black text-teal-900 shadow-md hover:scale-105 active:scale-95"
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradingRushGame;
