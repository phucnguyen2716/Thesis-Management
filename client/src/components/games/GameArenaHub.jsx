import React from 'react';
import { motion } from 'framer-motion';

const studentPalette = {
  hero: 'from-indigo-600 via-violet-600 to-fuchsia-600',
  glow: 'shadow-[0_0_40px_rgba(99,102,241,0.35)]',
  cardHover: 'hover:shadow-[0_12px_40px_rgba(99,102,241,0.25)]',
  badge: 'bg-amber-400 text-amber-950',
  play: 'from-white/20 to-white/5',
};

const lecturerPalette = {
  hero: 'from-teal-800 via-cyan-700 to-emerald-600',
  glow: 'shadow-[0_0_40px_rgba(13,148,136,0.4)]',
  cardHover: 'hover:shadow-[0_12px_40px_rgba(13,148,136,0.3)]',
  badge: 'bg-amber-300 text-amber-950',
  play: 'from-white/25 to-white/5',
};

const GameArenaHub = ({
  theme = 'student',
  title,
  subtitle,
  games,
  onPlay,
  activeId,
  compact = false,
  vertical = false,
}) => {
  const p = theme === 'lecturer' ? lecturerPalette : studentPalette;

  return (
    <section className={`relative overflow-hidden border border-white/10 h-full ${compact ? 'rounded-2xl' : 'rounded-[2rem]'}`}>
      <div className={`relative bg-gradient-to-br ${p.hero} text-white h-full ${compact ? 'p-3 sm:p-4' : 'p-5 sm:p-7'}`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20 blur-2xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 left-1/4 w-56 h-56 rounded-full bg-fuchsia-400/30 blur-3xl"
            animate={{ x: [0, 30, 0], opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className={`relative z-10 flex flex-wrap items-end justify-between gap-2 ${compact ? 'mb-3' : 'mb-5'}`}>
          <div className="min-w-0">
            {!compact && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-black uppercase tracking-[0.35em] text-white/70"
              >
                Arena Mode
              </motion.p>
            )}
            <h2 className={`font-black tracking-tight ${compact ? 'text-sm' : 'text-xl sm:text-2xl mt-1'}`}>{title}</h2>
            {subtitle && !compact && <p className="text-xs text-white/80 mt-1 max-w-md">{subtitle}</p>}
          </div>
          <div className={`shrink-0 px-2 py-1 rounded-full text-[9px] font-black uppercase ${p.badge} ${compact ? '' : 'animate-pulse'}`}>
            +XP
          </div>
        </div>

        <div
          className={`relative z-10 grid gap-2 ${
            vertical ? 'grid-cols-1' : compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 gap-3'
          }`}
        >
          {games.map((game, i) => {
            const isActive = activeId === game.id;
            return (
              <motion.button
                key={game.id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: vertical ? 1.01 : 1.03, y: vertical ? 0 : -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPlay(game.id)}
                className={`group text-left rounded-xl border border-white/25 bg-gradient-to-br ${p.play} backdrop-blur-md transition-shadow ${p.cardHover} ${isActive ? p.glow + ' ring-2 ring-white/60' : ''} ${
                  vertical ? 'flex items-center gap-3 p-2.5' : compact ? 'p-2.5' : 'p-4 rounded-2xl'
                }`}
              >
                <div
                  className={`rounded-lg bg-gradient-to-br ${game.accent} flex items-center justify-center shadow-lg shrink-0 group-hover:rotate-6 transition-transform ${
                    vertical ? 'w-9 h-9' : compact ? 'w-8 h-8' : 'w-12 h-12 rounded-xl'
                  }`}
                >
                  <span className={`material-symbols-outlined text-white ${vertical || compact ? 'text-lg' : 'text-2xl'}`}>
                    {game.icon}
                  </span>
                </div>
                <div className={`min-w-0 flex-1 ${vertical ? 'text-left' : ''}`}>
                  <div className="flex items-center justify-between gap-1">
                    <p className={`font-black ${vertical ? 'text-xs' : compact ? 'text-[10px] mt-1.5 leading-tight' : 'text-sm mt-3'}`}>
                      {game.title}
                    </p>
                    {game.tag && (
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-white/20 shrink-0">
                        {game.tag}
                      </span>
                    )}
                  </div>
                  {(vertical || !compact) && (
                    <p className={`text-white/75 leading-snug ${vertical ? 'text-[10px] mt-0.5 line-clamp-1' : 'text-[11px] mt-1'}`}>
                      {game.desc}
                    </p>
                  )}
                </div>
                {vertical && (
                  <span className="material-symbols-outlined text-white/70 text-xl shrink-0 group-hover:translate-x-0.5 transition-transform">
                    chevron_right
                  </span>
                )}
                {!vertical && !compact && (
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/90">
                    <span className="material-symbols-outlined text-base group-hover:animate-pulse">play_circle</span>
                    Chơi ngay
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default GameArenaHub;
