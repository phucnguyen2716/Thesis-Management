import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SUBMISSIONS, STATUS_CONFIG } from '../../data/lecturerMockData';
import PlagiarismAnalysisBento from '../../components/lecturer/PlagiarismAnalysisBento';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';
import { getPlagiarismFlow } from '../../utils/adminContentStore';

const LecturerControllerPage = () => {
  const [submissions, setSubmissions] = useState(SUBMISSIONS);
  const [selectedId, setSelectedId] = useState(SUBMISSIONS[0].id);
  const [filter, setFilter] = useState('all');
  const [zoom, setZoom] = useState(100);
  const [flowConfig, setFlowConfig] = useState(null);

  useEffect(() => {
    const load = () => setFlowConfig(getPlagiarismFlow());
    load();
    window.addEventListener('admin-content-updated', load);
    return () => window.removeEventListener('admin-content-updated', load);
  }, []);

  const selected = useMemo(
    () => submissions.find(s => s.id === selectedId) || submissions[0],
    [submissions, selectedId]
  );

  const [grades, setGrades] = useState(selected.rubric);
  const [feedback, setFeedback] = useState(selected.feedback || '');
  const [finalScore, setFinalScore] = useState(selected.grade ?? '');

  useEffect(() => {
    setGrades(selected.rubric);
    setFeedback(selected.feedback || '');
    setFinalScore(selected.grade ?? '');
  }, [selected.id, selected.rubric, selected.feedback, selected.grade]);

  const filtered = submissions.filter(s => filter === 'all' || s.status === filter);

  const saveGrade = () => {
    const rubricAvg = Object.values(grades).reduce((a, b) => a + Number(b || 0), 0) / 4;
    const score = finalScore || Math.round(rubricAvg * 10) / 10;
    setSubmissions(prev =>
      prev.map(s =>
        s.id === selected.id ? { ...s, grade: score, feedback, rubric: { ...grades } } : s
      )
    );
  };

  const runRecheck = () => {
    setSubmissions(prev =>
      prev.map(s => (s.id === selected.id ? { ...s, checkedAgo: 'Vừa xong' } : s))
    );
  };

  return (
    <div className="w-full max-w-full min-w-0 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-teal-700 uppercase tracking-[0.2em] mb-1">
            Kiểm tra đạo văn
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Plagiarism Check</h1>
          <p className="text-xs text-slate-500 mt-1 break-words">
            <Link to="/lecturer" className="text-teal-800 hover:underline font-medium">
              Trang chủ GV
            </Link>
            <span className="text-slate-300 mx-1">/</span>
            <span>Phân tích BM25 & AI</span>
          </p>
        </div>
        <button
          type="button"
          onClick={runRecheck}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-teal-800 text-white text-xs font-bold uppercase tracking-wide hover:bg-teal-900 shadow-sm"
        >
          <span className="material-symbols-outlined text-base">{LECTURER_ICONS.recheck}</span>
          Quét lại
        </button>
      </div>

      {flowConfig?.enabled && (
        <div className="mb-4 p-3 sm:p-4 rounded-xl bg-teal-50 border border-teal-200/80 text-xs text-teal-900">
          <p className="font-bold mb-1">Quy trình kiểm tra (cấu hình Admin)</p>
          <p className="text-teal-800/90 leading-relaxed">{flowConfig.policyText}</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-teal-700">
            Ngưỡng: trùng lặp xem xét ≥{flowConfig.thresholds.similarityReview}% · flagged ≥
            {flowConfig.thresholds.similarityFlag}% · AI xem xét ≥{flowConfig.thresholds.aiReview}% · AI flagged ≥
            {flowConfig.thresholds.aiFlag}%
            {flowConfig.engines.bm25 && ' · BM25'}
            {flowConfig.engines.elasticsearch && ' · ES'}
          </p>
        </div>
      )}

      {/* Mobile / tablet: horizontal queue */}
      <div className="xl:hidden w-full mb-4 sm:mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 shadow-sm w-full">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-teal-800 text-lg shrink-0">
                {LECTURER_ICONS.queue}
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide truncate">
                Hàng đợi chấm
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'acceptable', label: 'Đạt' },
              { key: 'review', label: 'Xem xét' },
              { key: 'flagged', label: 'Cảnh báo' },
            ].map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  filter === f.key ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
            {filtered.map(sub => {
              const cfg = STATUS_CONFIG[sub.status];
              const active = sub.id === selectedId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedId(sub.id)}
                  className={`snap-start shrink-0 w-[min(100%,260px)] sm:w-[240px] text-left p-3 rounded-lg border transition-all ${
                    active
                      ? 'border-teal-800 bg-teal-50/80 shadow-sm ring-2 ring-teal-800/20'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800 line-clamp-2">{sub.title}</p>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">{sub.student}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-[10px] font-bold ${
                        sub.similarity > 25 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {sub.similarity}%
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
                      {cfg.label.split(' ')[0]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 w-full min-w-0">
        {/* Desktop queue */}
        <aside className="hidden xl:block w-[260px] shrink-0">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-teal-800 text-xl">{LECTURER_ICONS.queue}</span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Hàng đợi chấm</h2>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'acceptable', label: 'Đạt' },
                { key: 'review', label: 'Xem xét' },
                { key: 'flagged', label: 'Cảnh báo' },
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    filter === f.key ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-teal-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto">
              {filtered.map(sub => {
                const cfg = STATUS_CONFIG[sub.status];
                const active = sub.id === selectedId;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedId(sub.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      active
                        ? 'border-teal-800 bg-teal-50/80 shadow-sm border-r-4'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-800 line-clamp-2">{sub.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{sub.student}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold ${
                          sub.similarity > 25 ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {sub.similarity}%
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
                        {cfg.label.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="flex-1 w-full min-w-0 space-y-4 sm:space-y-6">
          <PlagiarismAnalysisBento
            submission={selected}
            zoom={zoom}
            onZoomIn={() => setZoom(z => Math.min(120, z + 10))}
            onZoomOut={() => setZoom(z => Math.max(80, z - 10))}
          />

          <section className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-sm w-full">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <span className="material-symbols-outlined text-teal-800">{LECTURER_ICONS.grade}</span>
              Chấm điểm đồ án
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
              {[
                { key: 'content', label: 'Nội dung' },
                { key: 'method', label: 'Phương pháp' },
                { key: 'originality', label: 'Tính mới' },
                { key: 'presentation', label: 'Trình bày' },
              ].map(r => (
                <div key={r.key} className="min-w-0">
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">{r.label}</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={grades[r.key] || ''}
                    onChange={e => setGrades(g => ({ ...g, [r.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nhận xét</label>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20"
                placeholder="Ghi chú cho sinh viên..."
              />
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 sm:gap-4">
              <div className="w-full sm:w-28">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Điểm tổng</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={finalScore}
                  onChange={e => setFinalScore(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-800/20"
                />
              </div>
              <button
                type="button"
                onClick={saveGrade}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-teal-800 text-white text-xs font-bold uppercase tracking-widest hover:bg-teal-900"
              >
                Lưu điểm
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LecturerControllerPage;
