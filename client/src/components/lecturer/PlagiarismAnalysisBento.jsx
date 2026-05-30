import React, { useState } from 'react';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';
import { STATUS_CONFIG } from '../../data/lecturerMockData';
import { getPlagiarismThresholds } from '../../utils/adminContentStore';

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
          Trùng lặp
        </span>
      </div>
    </div>
  );
};

const HeatmapGrid = ({ cells, sections }) => (
  <section className="col-span-full xl:col-span-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200/80 flex flex-col w-full min-w-0">
    <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
      <h3 className="text-base sm:text-lg font-semibold text-slate-900">Bản đồ nhiệt Đạo văn</h3>
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
  const thresholds = getPlagiarismThresholds();

  // State for request to admin
  const [submittedRequests, setSubmittedRequests] = useState(() => {
    try {
      const list = JSON.parse(localStorage.getItem('lecturer_plagiarism_requests') || '[]');
      const mapping = {};
      list.forEach(r => {
        mapping[r.submissionId] = r;
      });
      return mapping;
    } catch {
      return {};
    }
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState('ignore');
  const [customNote, setCustomNote] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [toast, setToast] = useState(null);

  const handleOpenModal = () => {
    setSelectedCase('ignore');
    setCustomNote('');
    setIsUrgent(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{"fullName": "TS. Nguyễn Minh Trí"}');
    const newRequest = {
      id: `req-${Date.now()}`,
      submissionId: submission.id,
      title: submission.title,
      student: submission.student,
      lecturer: user.fullName || 'TS. Nguyễn Minh Trí',
      caseType: selectedCase,
      customNote: customNote,
      isUrgent,
      timestamp: new Date().toLocaleString('vi-VN'),
      isRead: false,
      similarity: submission.similarity,
      aiPercent: submission.aiPercent,
      words: submission.words,
      sourceCount: submission.sourceCount,
      topSource: submission.match ? submission.match.sourceTitle : 'Không rõ nguồn',
      topSourcePercent: submission.match ? submission.match.percent : 0,
      matchExcerpt: submission.match ? submission.match.excerpt : ''
    };

    const currentRequests = JSON.parse(localStorage.getItem('lecturer_plagiarism_requests') || '[]');
    currentRequests.push(newRequest);
    localStorage.setItem('lecturer_plagiarism_requests', JSON.stringify(currentRequests));

    setSubmittedRequests(prev => ({
      ...prev,
      [submission.id]: newRequest
    }));
    setIsModalOpen(false);

    // Dispatch event to sync state immediately
    window.dispatchEvent(new Event('admin-content-updated'));

    setToast({
      message: 'Đã gửi yêu cầu đối chiếu & xử lý đạo văn tới Admin!',
      type: 'success'
    });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  return (
    <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 [&>*]:min-w-0 animate-in fade-in duration-500">
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
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap ${statusBadgeClass(submission.status)}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>verified</span>
                  <span>{statusCfg.label}</span>
                </span>

                {/* Send Request to Admin Button */}
                {(submission.status === 'review' || submission.status === 'flagged') && (
                  submittedRequests[submission.id] ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-500 shadow-sm">
                      <span className="material-symbols-outlined text-[12px] text-slate-400 animate-pulse">hourglass_empty</span>
                      Đang chờ Admin duyệt
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenModal}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px]">admin_panel_settings</span>
                      Gửi yêu cầu Admin
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-3 border-t border-slate-100 w-full">
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 block truncate">
                  Số từ đã quét
                </span>
                <span className="text-base sm:text-xl font-semibold text-slate-900">
                  {submission.words.toLocaleString()}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 block truncate">
                  Văn bản do AI tạo
                </span>
                <span className="text-base sm:text-xl font-semibold text-sky-600">{submission.aiPercent}%</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  Ngưỡng admin: {thresholds.aiReview}% / {thresholds.aiFlag}%
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 block truncate">
                  Nguồn trùng khớp
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
                Chi tiết Phân tích Đạo văn
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
                  PHÁT HIỆN TRÙNG KHỚP: {submission.match.label}
                </span>
              </div>
              <p className="italic text-slate-600 mb-4 sm:mb-6 leading-relaxed break-words">
                {submission.match.excerpt}
              </p>
              <div className="p-3 sm:p-4 border border-slate-200 rounded-lg bg-white">
                <h4 className="text-xs font-bold text-slate-800 mb-2">Thông tin nguồn tham chiếu</h4>
                <p className="text-xs text-slate-700 break-words">{submission.match.sourceTitle}</p>
                <p className="text-xs text-slate-500 mt-1 break-words">{submission.match.sourceMeta}</p>
                {submission.match.url && (
                  <a
                    href={submission.match.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 text-xs flex items-center gap-1 mt-3 hover:underline font-medium"
                  >
                    Xem tài liệu gốc
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
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Danh sách nguồn trùng khớp chính</h3>
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
            Tải báo cáo chi tiết (PDF)
          </button>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200/80 bg-gradient-to-br from-white to-sky-50/80 w-full">
          <h3 className="text-xs font-bold text-sky-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <span className="material-symbols-outlined text-sm">{LECTURER_ICONS.suggestion}</span>
            Gợi ý từ AI
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
            Công cụ tự động Trích dẫn
          </button>
        </div>
      </section>

      {/* ── Admin Request Modal ───────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleCloseModal}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-teal-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-800/80 border border-teal-700/50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-teal-300 text-xl">admin_panel_settings</span>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-teal-300">Yêu cầu Admin xét duyệt</h3>
                  <p className="text-[10px] text-white/50 uppercase mt-0.5 tracking-wider">Đối chiếu chéo &amp; Phê duyệt đặc cách</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleCloseModal} 
                className="material-symbols-outlined text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                close
              </button>
            </div>
            
            <form onSubmit={handleSubmitRequest} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tên Đồ án / Khóa luận</label>
                <p className="text-xs font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">
                  {submission.title}
                </p>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Chọn tình huống cần hỗ trợ</label>
                <div className="space-y-2">
                  {[
                    {
                      value: 'ignore',
                      label: 'Bỏ qua & Phê duyệt đặc cách',
                      desc: 'Hệ thống nhận diện trùng lặp sai nguồn, hoặc tài liệu nghiên cứu đặc thù được UEF cấp phép đặc cách.',
                      icon: 'check_circle',
                      colorCls: 'text-emerald-600',
                      bgCls: 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50',
                      activeCls: 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50'
                    },
                    {
                      value: 'deep',
                      label: 'Yêu cầu đối chiếu sâu (Deep scan)',
                      desc: 'Cần đối chiếu nâng cao với các dữ liệu offline, bài nộp cũ hoặc lưu trữ nội bộ chưa được số hóa trực tuyến.',
                      icon: 'database',
                      colorCls: 'text-blue-600',
                      bgCls: 'bg-blue-50/50 border-blue-100 hover:bg-blue-50',
                      activeCls: 'border-blue-500 ring-2 ring-blue-500/10 bg-blue-50'
                    },
                    {
                      value: 'discipline',
                      label: 'Báo cáo vi phạm / Hội đồng kỷ luật',
                      desc: 'Đạo văn nghiêm trọng vượt mức giới hạn cho phép sửa chữa, chuyển hội đồng khoa học xử lý đình chỉ đề tài.',
                      icon: 'gavel',
                      colorCls: 'text-rose-600',
                      bgCls: 'bg-rose-50/50 border-rose-100 hover:bg-rose-50',
                      activeCls: 'border-rose-500 ring-2 ring-rose-500/10 bg-rose-50'
                    }
                  ].map((item) => {
                    const isSelected = selectedCase === item.value;
                    return (
                      <div
                        key={item.value}
                        onClick={() => setSelectedCase(item.value)}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isSelected ? item.activeCls : item.bgCls
                        }`}
                      >
                        <span className={`material-symbols-outlined mt-0.5 ${item.colorCls}`}>
                          {item.icon}
                        </span>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-xs font-black text-slate-800">{item.label}</p>
                          <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{item.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'border-teal-800 bg-teal-800' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Lý do / Ghi chú lý giải</label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800 focus:bg-white transition-all resize-none"
                  placeholder="Nhập lý giải chi tiết cho Admin..."
                />
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider leading-none">Độ ưu tiên xử lý</span>
                  <span className="text-[9px] text-slate-400 mt-1">Chọn nếu cần Admin xử lý gấp trong 24h</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md active:scale-95 cursor-pointer"
                >
                  Xác nhận gửi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast Notification ─────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-24 right-4 md:right-8 z-[1000] flex items-center gap-3 px-5 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-white/10 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-none">{toast.message}</span>
            <span className="text-[9px] text-white/50 uppercase tracking-widest mt-1">Hệ thống đã ghi nhận thành công</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlagiarismAnalysisBento;
