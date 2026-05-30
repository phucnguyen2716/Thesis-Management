import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MAJORS, SUBMISSIONS } from '../../data/lecturerMockData';
import { getMajorStats, getRankedSubmissions } from '../../utils/lecturerRanking';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';

const PODIUM_META = [
  {
    place: 1,
    label: 'Vô địch',
    medal: 'emoji_events',
    podiumH: 'h-16 sm:h-28 md:h-44',
    card: 'bg-gradient-to-b from-amber-50 via-white to-amber-50/30 border-amber-300/60 shadow-[0_12px_40px_-12px_rgba(245,158,11,0.45)]',
    ring: 'ring-2 ring-amber-400/80',
    badge: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950',
    score: 'text-amber-700',
    bar: 'from-amber-400 to-yellow-300',
    order: 'order-2',
    z: 'z-20 -mt-3 sm:-mt-6',
  },
  {
    place: 2,
    label: 'Á quân',
    medal: 'military_tech',
    podiumH: 'h-10 sm:h-20 md:h-32',
    card: 'bg-gradient-to-b from-slate-100 via-white to-slate-50 border-slate-300/70 shadow-lg',
    ring: 'ring-2 ring-slate-300',
    badge: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
    score: 'text-slate-700',
    bar: 'from-slate-300 to-slate-400',
    order: 'order-1',
    z: 'z-10 mt-3 sm:mt-4',
  },
  {
    place: 3,
    label: 'Hạng 3',
    medal: 'workspace_premium',
    podiumH: 'h-8 sm:h-16 md:h-28',
    card: 'bg-gradient-to-b from-orange-50 via-white to-amber-50/20 border-orange-200/80 shadow-md',
    ring: 'ring-2 ring-orange-300/70',
    badge: 'bg-gradient-to-r from-orange-600 to-amber-700 text-white',
    score: 'text-orange-800',
    bar: 'from-orange-400 to-amber-600',
    order: 'order-3',
    z: 'z-10 mt-4 sm:mt-6',
  },
];

const MAJOR_GRADIENTS = {
  cntt: 'from-cyan-600 to-teal-800',
  qtkd: 'from-violet-600 to-indigo-800',
  tcnh: 'from-emerald-600 to-teal-900',
  marketing: 'from-pink-600 to-rose-800',
  luat: 'from-slate-600 to-slate-900',
};

const ScoreRing = ({ score, max = 100, className = '' }) => {
  const pct = Math.min(100, (score / max) * 100);
  const deg = pct * 3.6;
  return (
    <div className={`relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 ${className}`}>
      <div
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: `conic-gradient(#0f766e ${deg}deg, #e2e8f0 ${deg}deg)`,
        }}
      />
      <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center shadow-inner">
        <span className="text-xs sm:text-sm font-black text-teal-900">{score}</span>
      </div>
    </div>
  );
};

const PodiumCard = ({ item, meta, maxScore }) => {
  const major = MAJORS.find(m => m.id === item.majorId);
  const barPct = maxScore > 0 ? (item.exemplaryScore / maxScore) * 100 : 0;

  return (
    <div className={`flex flex-col items-center min-w-0 w-full ${meta.order} ${meta.z}`}>
      <article
        className={`relative w-full rounded-2xl border p-2 sm:p-5 ${meta.card} ${meta.ring} transition-transform hover:scale-[1.02] duration-300`}
      >
        {meta.place === 1 && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 text-[8px] sm:text-[10px] font-black uppercase tracking-wider shadow-lg animate-pulse whitespace-nowrap">
            <span className="material-symbols-outlined" style={{ fontSize: '11px', fontVariationSettings: "'FILL' 1" }}>
              crown
            </span>
            Tiêu biểu
          </span>
        )}
        {/* Badge hạng — mobile chỉ hiện icon, sm+ hiện text */}
        <div className="flex items-start justify-between gap-1 mt-1">
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase ${meta.badge}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>
              {meta.medal}
            </span>
            <span className="hidden xs:inline sm:inline">{meta.label}</span>
          </span>
          {/* ScoreRing: ẩn ở mobile, hiện từ sm+ */}
          <ScoreRing score={item.exemplaryScore} className="hidden sm:flex" />
        </div>
        <h3 className="text-[10px] sm:text-sm font-bold text-slate-900 mt-1.5 line-clamp-2 leading-snug">
          {item.title}
        </h3>
        <p className="text-[9px] text-slate-600 mt-0.5 truncate font-medium">{item.student}</p>
        <p className="text-[8px] sm:text-[9px] font-bold text-teal-800 mt-0.5 uppercase tracking-wide">{major?.short}</p>
        <div className="mt-1.5 h-1 sm:h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${meta.bar} transition-all duration-700`}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <p className={`text-xl sm:text-3xl font-black mt-1 tabular-nums ${meta.score}`}>{item.exemplaryScore}</p>
        <p className="text-[8px] sm:text-[9px] text-slate-400 font-semibold uppercase tracking-widest">điểm tb</p>
        <Link
          to={`/lecturer/controller/${item.id}`}
          className="mt-1.5 flex items-center justify-center gap-0.5 w-full py-1 sm:py-1.5 rounded-xl bg-teal-900/90 hover:bg-teal-950 text-white text-[9px] sm:text-[10px] font-bold transition-colors"
        >
          Xem chi tiết
          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>arrow_forward</span>
        </Link>
      </article>
      <div
        className={`w-full mt-2 rounded-t-xl bg-gradient-to-t ${meta.bar} opacity-90 ${meta.podiumH} flex items-end justify-center pb-2`}
      >
        <span className="text-2xl sm:text-4xl font-black text-white/90 drop-shadow-md">{meta.place}</span>
      </div>
    </div>
  );
};

const RankListItem = ({ item, index, maxScore, majorFilter }) => {
  const major = MAJORS.find(m => m.id === item.majorId);
  const barWidth = maxScore > 0 ? (item.exemplaryScore / maxScore) * 100 : 0;
  const isTop = index === 0 && majorFilter !== 'all';
  const tier =
    index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : index < 5 ? 'elite' : 'default';

  const tierStyles = {
    gold: 'border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-50/80 to-white',
    silver: 'border-l-4 border-l-slate-400 bg-gradient-to-r from-slate-50/80 to-white',
    bronze: 'border-l-4 border-l-orange-400 bg-gradient-to-r from-orange-50/60 to-white',
    elite: 'border-l-4 border-l-teal-500 bg-gradient-to-r from-teal-50/40 to-white',
    default: 'border-l-4 border-l-transparent bg-white',
  };

  return (
    <li
      className={`relative rounded-xl border border-slate-200/80 overflow-hidden hover:shadow-md transition-all duration-200 ${tierStyles[tier]}`}
    >
      <div
        className="absolute inset-y-0 left-0 bg-teal-500/10 pointer-events-none transition-all duration-500"
        style={{ width: `${barWidth}%` }}
      />
      <div className="relative flex flex-col gap-3 p-4 min-w-0">
        {/* Top row: icon + title info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            {index < 3 ? (
              <span
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md ${
                  index === 0
                    ? 'bg-gradient-to-br from-amber-400 to-yellow-600'
                    : index === 1
                      ? 'bg-gradient-to-br from-slate-400 to-slate-600'
                      : 'bg-gradient-to-br from-orange-500 to-amber-700'
                }`}
              >
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {index === 0 ? 'emoji_events' : index === 1 ? 'military_tech' : 'workspace_premium'}
                </span>
              </span>
            ) : (
              <span className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 font-black text-lg flex items-center justify-center border border-slate-200">
                {index + 1}
              </span>
            )}
            {index === 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-slate-900 line-clamp-2">{item.title}</p>
              {isTop && (
                <span className="text-[9px] font-black uppercase bg-gradient-to-r from-amber-200 to-yellow-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300/50">
                  ★ Ngành
                </span>
              )}
              {index < 3 && (
                <span className="text-[9px] font-bold text-slate-500 uppercase">Top {index + 1}</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {item.student} · <span className="font-semibold text-teal-800">{major?.short}</span>
            </p>
          </div>
        </div>
        {/* Bottom row: tags + score + link */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
              Trùng {item.similarity}%
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700">
              AI {item.aiPercent}%
            </span>
            {item.grade != null && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800">
                GV {item.grade}/10
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <div className="text-right">
              <p className="text-2xl font-black text-teal-900 tabular-nums">{item.exemplaryScore}</p>
              <div className="w-20 h-1 rounded-full bg-slate-200 mt-1 ml-auto overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-600 to-cyan-500 rounded-full"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
            <Link
              to={`/lecturer/controller/${item.id}`}
              className="p-2 rounded-xl bg-teal-900 text-white hover:bg-teal-950 transition-colors"
              title="Xem phân tích"
            >
              <span className="material-symbols-outlined text-lg">visibility</span>
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
};

const MajorThesisRanking = () => {
  const [majorFilter, setMajorFilter] = useState('all');

  const ranked = useMemo(
    () => getRankedSubmissions(SUBMISSIONS, majorFilter),
    [majorFilter]
  );

  const majorStats = useMemo(() => getMajorStats(SUBMISSIONS, MAJORS), []);

  const filterLabel =
    majorFilter === 'all'
      ? 'Tất cả ngành'
      : MAJORS.find(m => m.id === majorFilter)?.label ?? '';

  const maxScore = ranked[0]?.exemplaryScore ?? 100;
  const top3 = ranked.slice(0, 3);
  const podiumSlots = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <section className="relative rounded-2xl overflow-hidden w-full min-w-0 border border-teal-200/50 shadow-[0_8px_40px_-12px_rgba(15,118,110,0.2)]">
      {/* Nền trang trí */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-950/[0.03] via-white to-cyan-50/50 pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-300/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-4 sm:p-6 border-b border-teal-100/80 bg-gradient-to-r from-teal-900 via-teal-800 to-cyan-900 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
              <span
                className="material-symbols-outlined text-3xl text-amber-300"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {LECTURER_ICONS.ranking}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-teal-200/90">Hall of Fame</p>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Bảng vàng đồ án tiêu biểu</h2>
              <p className="text-xs text-teal-100/80 mt-1">Xếp hạng theo ngành · chất lượng & độ nguyên gốc</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-3xl font-black text-amber-300 tabular-nums">{ranked.length}</span>
            <span className="text-[10px] font-bold uppercase leading-tight text-teal-200 max-w-[80px]">
              đồ án đua top
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setMajorFilter('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              majorFilter === 'all'
                ? 'bg-white text-teal-900 shadow-lg scale-105'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
            }`}
          >
            Tất cả ngành
          </button>
          {MAJORS.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMajorFilter(m.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                majorFilter === m.id
                  ? 'bg-white text-teal-900 shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
              }`}
            >
              {m.short}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-teal-200/70 mt-2 font-medium">Đang xem: {filterLabel}</p>
      </div>

      {/* Podium Top 3 */}
      {top3.length > 0 && (
        <div className="relative px-2 sm:px-8 pt-8 pb-4 bg-gradient-to-b from-slate-100/80 to-white overflow-hidden">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">
            — Bục vinh quang —
          </p>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4 items-end max-w-4xl mx-auto">
            {podiumSlots.map(item => {
              const actualRank = top3.indexOf(item);
              const meta = PODIUM_META[actualRank];
              if (!item || actualRank < 0 || !meta) return null;
              return <PodiumCard key={item.id} item={item} meta={meta} maxScore={maxScore} />;
            })}
          </div>
        </div>
      )}

      {/* Danh sách còn lại */}
      <div className="relative p-4 sm:p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-700">format_list_numbered</span>
            Bảng xếp hạng đầy đủ
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {ranked.length} mục
          </span>
        </div>
        <ul className="space-y-3">
          {ranked.map((item, index) => (
            <RankListItem
              key={item.id}
              item={item}
              index={index}
              maxScore={maxScore}
              majorFilter={majorFilter}
            />
          ))}
        </ul>
        {ranked.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-12">Chưa có đồ án trong ngành này.</p>
        )}
      </div>

      {/* Ngành — hall of fame mini */}
      {majorFilter === 'all' && (
        <div className="relative px-4 sm:px-6 pb-6 pt-2 bg-slate-50/80 border-t border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">category</span>
            Nhà vô địch từng ngành
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {majorStats.map(stat => {
              const grad = MAJOR_GRADIENTS[stat.id] || 'from-teal-600 to-teal-900';
              return (
                <button
                  key={stat.id}
                  type="button"
                  onClick={() => setMajorFilter(stat.id)}
                  className={`group text-left rounded-xl overflow-hidden border border-white/20 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 min-w-0`}
                >
                  <div className={`bg-gradient-to-br ${grad} p-4 text-white relative overflow-hidden`}>
                    <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-6xl text-white/10">
                      emoji_events
                    </span>
                    <p className="text-lg font-black">{stat.short}</p>
                    <p className="text-[10px] text-white/70 font-medium">{stat.count} đồ án thi đua</p>
                    {stat.topThesis && (
                      <p className="text-xs font-semibold mt-2 line-clamp-2 text-white/95 group-hover:text-white">
                        {stat.topThesis.title}
                      </p>
                    )}
                    <p className="text-2xl font-black mt-2 text-amber-200 tabular-nums">
                      {stat.topThesis?.exemplaryScore ?? '—'}
                      <span className="text-[10px] font-bold text-white/60 ml-1">điểm</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default MajorThesisRanking;
