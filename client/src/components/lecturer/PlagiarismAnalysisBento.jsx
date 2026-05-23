import React from 'react';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';
import { STATUS_CONFIG } from '../../data/lecturerMockData';

const ACCENT = '#115e59';
const ACCENT_LIGHT = '#e6fffa';

const SimilarityRing = ({ percent }) => {
  const deg = Math.min(100, Math.max(0, percent)) * 3.6;
  return (
    <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
      <div
        className="absolute inset-0 rounded-full opacity-25"
        style={{
          background: `conic-gradient(from 180deg at 50% 50%, ${ACCENT} 0deg, ${ACCENT} ${deg}deg, ${ACCENT_LIGHT} ${deg}deg, ${ACCENT_LIGHT} 360deg)`,
        }}
      />
      <div className="w-[85%] h-[85%] rounded-full bg-white flex flex-col items-center justify-center border-4 border-teal-800 shadow-inner">
        <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-teal-800">{percent}%</span>
        <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
          Similarity
        </span>
      </div>
    </div>
  );
};

const HeatmapGrid = ({ cells, sections }) => (
  <section className="col-span-full xl:col-span-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200/80 flex flex-col w-full min-w-0">
    <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
      <h3 className="text-base sm:text-lg font-semibold text-slate-900">AI Similarity Heatmap</h3>
      <span className="material-symbols-outlined text-sky-600 shrink-0">{LECTURER_ICONS.ai}</span>
    </div>
    <div className="w-full aspect-[5/3] sm:aspect-auto sm:min-h-[140px] grid grid-cols-10 grid-rows-6 gap-1">
      {cells.map((opacity, i) => (
        <div
          key={i}
          className="rounded-sm min-h-0"
          style={{ backgroundColor: `rgba(17, 94, 89, ${opacity / 100})` }}
        />
      ))}
    </div>
    <div className="mt-3 flex justify-between text-[10px] sm:text-[11px] font-medium text-slate-500 gap-2">
      <span className="truncate">{sections[0]}</span>
      <span className="truncate text-right">{sections[sections.length - 1]}</span>
    </div>
  </section>
);

const highlightStudentText = (text, excerpt) => {
  const needle = (excerpt || '').replace(/^\.+|\.+$/g, '').slice(0, 80).trim();
  if (!needle || needle.length < 15) {
    return text.split('\n\n').map((p, i) => (
      <p key={i} className="mb-4 sm:mb-6 text-sm leading-relaxed text-slate-800">
        {p}
      </p>
    ));
  }
  const idx = text.toLowerCase().indexOf(needle.slice(0, 40).toLowerCase());
  if (idx === -1) {
    return text.split('\n\n').map((p, i) => (
      <p key={i} className="mb-4 sm:mb-6 text-sm leading-relaxed text-slate-800">
        {p}
      </p>
    ));
  }
  const before = text.slice(0, idx);
  const matchLen = Math.min(280, text.length - idx);
  const matched = text.slice(idx, idx + matchLen);
  const after = text.slice(idx + matchLen);
  return (
    <>
      {before && <p className="mb-4 sm:mb-6 text-sm leading-relaxed text-slate-800">{before}</p>}
      <p className="mb-4 sm:mb-6 text-sm leading-relaxed text-slate-800">
        <mark className="bg-teal-100 text-teal-900 border-b-2 border-teal-700 px-1 rounded-sm break-words">
          {matched}
        </mark>
      </p>
      {after && <p className="text-sm leading-relaxed text-slate-800">{after}</p>}
    </>
  );
};

const statusBadgeClass = status => {
  if (status === 'acceptable') {
    return 'bg-emerald-600 text-white shadow-sm ring-2 sm:ring-4 ring-emerald-100';
  }
  if (status === 'flagged') {
    return 'bg-red-600 text-white shadow-sm ring-2 sm:ring-4 ring-red-100';
  }
  return 'bg-amber-500 text-white shadow-sm ring-2 sm:ring-4 ring-amber-100';
};

const PlagiarismAnalysisBento = ({ submission, zoom = 100, onZoomIn, onZoomOut }) => {
  const statusCfg = STATUS_CONFIG[submission.status] || STATUS_CONFIG.review;
  const cells = submission.heatmapGrid || [];

  return (
    <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 [&>*]:min-w-0">
      {/* Summary — col-span-full = 100% width; xl:col-span-8 = 2/3 row */}
      <section className="col-span-full xl:col-span-8 w-full min-w-0 bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6 lg:gap-8 w-full">
          <SimilarityRing percent={submission.similarity} />
          <div className="flex-1 w-full min-w-0 space-y-4">
            <div className="flex flex-col gap-3">
              <div className="w-full min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 leading-snug break-words">
                  {submission.title}
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1.5 break-words">
                  Bản nộp #{submission.submissionNum} · {submission.checkedAgo} · {submission.student}
                </p>
              </div>
              <span
                className={`self-start inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold ${statusBadgeClass(submission.status)}`}
              >
                <span className="material-symbols-outlined text-xs">verified</span>
                <span className="whitespace-normal sm:whitespace-nowrap">{statusCfg.label}</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-3 border-t border-slate-100 w-full">
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 block truncate">
                  Words Checked
                </span>
                <span className="text-base sm:text-xl font-semibold text-slate-900">
                  {submission.words.toLocaleString()}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 block truncate">
                  AI Generated
                </span>
                <span className="text-base sm:text-xl font-semibold text-sky-600">{submission.aiPercent}%</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 block truncate">
                  Sources Found
                </span>
                <span className="text-base sm:text-xl font-semibold text-slate-900">
                  {submission.sourceCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HeatmapGrid cells={cells} sections={submission.sections} />

      {/* Comparison */}
      <section className="col-span-full xl:col-span-8 w-full min-w-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden w-full">
          <div className="flex flex-wrap border-b border-slate-200 p-3 sm:p-4 justify-between items-center gap-2 bg-slate-50/80">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 bg-teal-800/10 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-teal-800 text-sm font-bold">
                  {LECTURER_ICONS.analysis}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-800 tracking-wide uppercase truncate">
                Plagiarism Analysis View
              </span>
            </div>
            <div className="flex gap-1 bg-white/80 p-1 rounded-full border border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={onZoomOut}
                className="material-symbols-outlined text-slate-500 hover:text-teal-800 p-1 text-xl"
              >
                zoom_out
              </button>
              <span className="text-[10px] font-bold text-slate-400 self-center px-1 min-w-[2.5rem] text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={onZoomIn}
                className="material-symbols-outlined text-slate-500 hover:text-teal-800 p-1 text-xl"
              >
                zoom_in
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[240px] sm:min-h-[320px] lg:min-h-[420px] max-h-[50vh] sm:max-h-[55vh] lg:max-h-[520px]">
            <div
              className="p-4 sm:p-6 overflow-y-auto text-sm leading-relaxed text-slate-800 min-h-[200px] md:min-h-0"
              style={{ fontSize: `${zoom}%` }}
            >
              {highlightStudentText(submission.studentText, submission.match.excerpt)}
            </div>
            <div
              className="p-4 sm:p-6 overflow-y-auto text-sm leading-relaxed bg-slate-50/50 min-h-[200px] md:min-h-0"
              style={{ fontSize: `${zoom}%` }}
            >
              <div className="mb-3 sm:mb-4 p-2 bg-teal-50 rounded border-l-4 border-teal-800">
                <span className="text-xs text-teal-900 font-bold break-words">
                  MATCH FOUND: {submission.match.label}
                </span>
              </div>
              <p className="italic text-slate-600 mb-4 sm:mb-6 leading-relaxed break-words">
                {submission.match.excerpt}
              </p>
              <div className="p-3 sm:p-4 border border-slate-200 rounded-lg bg-white">
                <h4 className="text-xs font-bold text-slate-800 mb-2">Source Information</h4>
                <p className="text-xs text-slate-700 break-words">{submission.match.sourceTitle}</p>
                <p className="text-xs text-slate-500 mt-1 break-words">{submission.match.sourceMeta}</p>
                {submission.match.url && (
                  <a
                    href={submission.match.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 text-xs flex items-center gap-1 mt-3 hover:underline font-medium"
                  >
                    View Original Document
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sources + AI */}
      <section className="col-span-full xl:col-span-4 w-full min-w-0 space-y-4 sm:space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200/80 w-full">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Top Match Sources</h3>
          <div className="space-y-2 sm:space-y-3">
            {submission.sources.map((src, i) => (
              <div
                key={src.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors min-w-0 ${
                  i === 0 ? 'border-teal-800/20 bg-teal-50/50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                    i === 0 ? 'bg-teal-800 text-white' : 'bg-sky-600 text-white'
                  }`}
                >
                  <span className="text-[10px] sm:text-xs font-bold">{src.percent}%</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{src.name}</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">{src.url}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="w-full mt-4 sm:mt-5 py-2.5 border border-sky-600 text-sky-600 text-xs font-semibold hover:bg-sky-50 rounded-lg flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">{LECTURER_ICONS.download}</span>
            Download Full Report (PDF)
          </button>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200/80 bg-gradient-to-br from-white to-sky-50/80 w-full">
          <h3 className="text-xs font-bold text-sky-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <span className="material-symbols-outlined text-sm">{LECTURER_ICONS.suggestion}</span>
            AI Suggestions
          </h3>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            {submission.similarity > 25
              ? 'Nhiều đoạn trùng khớp với nguồn đã xuất bản. Yêu cầu sinh viên trích dẫn hoặc diễn đạt lại trước khi chốt điểm.'
              : 'Hai đoạn có cấu trúc tương tự tài liệu tham khảo. Cân nhắc thêm trích dẫn trực tiếp để tránh bị gắn cờ.'}
          </p>
          <button
            type="button"
            className="bg-sky-600 text-white px-4 py-2.5 text-xs rounded-full w-full font-bold hover:shadow-md transition-shadow"
          >
            Auto-Citation Tool
          </button>
        </div>
      </section>
    </div>
  );
};

export default PlagiarismAnalysisBento;
