import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SUBMISSIONS, STATUS_CONFIG } from '../../data/lecturerMockData';
import PlagiarismAnalysisBento from '../../components/lecturer/PlagiarismAnalysisBento';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';
import { getPlagiarismFlow } from '../../utils/adminContentStore';

const AISummaryCard = ({ selected }) => {
  const summaryData = useMemo(() => {
    const defaultSummary = {
      overview: `Đề tài "${selected.title}" thực hiện nghiên cứu chuyên sâu về lĩnh vực chuyên môn của khoa ${selected.faculty || 'Đào tạo'}. Bài viết đề xuất giải pháp kỹ thuật cụ thể và đánh giá thực nghiệm thực tiễn.`,
      strengths: [
        "Cấu trúc các chương rõ ràng, tuân thủ barem quy chuẩn.",
        "Sử dụng nhiều từ vựng chuyên ngành có độ chính xác học thuật cao.",
        "Hình thức trình bày chỉn chu, căn lề và định dạng phông chữ chuẩn."
      ],
      weaknesses: [
        "Cần bổ sung thêm phần đối chiếu số liệu chi tiết hơn ở chương thực nghiệm.",
        "Một số đoạn trích dẫn lý thuyết nên diễn đạt lại theo văn phong cá nhân để tăng tính nguyên bản."
      ],
      recommendation: "Khuyên dùng mức điểm: 8.0 - 8.5. Thích hợp lưu trữ tham khảo tại Thư viện khoa."
    };

    if (selected.id === 'sub-001') {
      return {
        overview: "Nghiên cứu khảo sát toàn diện tác động của Trí tuệ nhân tạo (AI) đối với mô hình giáo dục đại học, tập trung phân tích hệ thống gia sư thông minh và chấm điểm tự động.",
        strengths: [
          "Phương pháp luận vững chắc, kết hợp phân tích định tính từ các đại học tiên tiến tại Âu Mỹ.",
          "Tính nguyên bản cực cao (Chỉ số trùng lặp chỉ 12%), các nguồn trích dẫn học thuật uy tín.",
          "Cấu trúc 5 chương hoàn thiện rất chặt chẽ."
        ],
        weaknesses: [
          "Nên phân tích sâu hơn về rào cản chi phí khi triển khai hệ thống AI tại Việt Nam.",
          "Cần làm rõ hơn quy trình hậu kiểm chất lượng đối với công cụ chấm điểm tự động."
        ],
        recommendation: "Khuyên dùng mức điểm: 8.5 - 9.0. Đề xuất làm tài liệu định hướng chính sách chuyển đổi số."
      };
    }
    
    if (selected.id === 'sub-002') {
      return {
        overview: "Đề tài đề xuất ứng dụng công nghệ sổ cái phân tán Blockchain (Smart Contract Ethereum) để quản lý, cấp phát và xác thực bảng điểm trực tuyến của sinh viên.",
        strengths: [
          "Giải pháp kỹ thuật mang tính thực tiễn cao, mô hình phi tập trung rõ ràng.",
          "Trình bày thuật toán smart contract chi tiết, có sơ đồ luồng dữ liệu minh họa."
        ],
        weaknesses: [
          "Mức độ trùng lặp nội dung tương đối cao (28%), phát hiện một số đoạn sao chép nguyên bản từ tài liệu IEEE 2022.",
          "Phần đánh giá hiệu năng hệ thống còn sơ sài, chưa đo lường chi phí gas thực tế."
        ],
        recommendation: "Khuyên dùng mức điểm: 7.0 - 7.5. Yêu cầu diễn đạt lại các đoạn trùng lặp trước khi hội đồng công nhận."
      };
    }

    if (selected.id === 'sub-003') {
      return {
        overview: "Nghiên cứu ứng dụng mô hình học sâu PhoBERT tiếng Việt để phân tích sắc thái cảm xúc (Sentiment Analysis) của người dùng mạng xã hội về thương hiệu UEF.",
        strengths: [
          "Ý tưởng nghiên cứu tốt, bắt kịp xu hướng công nghệ xử lý ngôn ngữ tự nhiên (NLP).",
          "Tập dữ liệu khảo sát thực tế dồi dào (15,000 bài đăng từ Facebook và TikTok)."
        ],
        weaknesses: [
          "Cảnh báo đạo văn mức độ cao (45% trùng lặp), cấu trúc câu sao chép tỷ lệ lớn từ Đồ án tốt nghiệp UEF 2023.",
          "Chỉ số văn bản do AI tạo ra (AI-generated) chiếm tới 22%, thể hiện sự lạm dụng Chatbot dịch thuật/viết hộ."
        ],
        recommendation: "Khuyên dùng mức điểm: 5.5 - 6.0. Đề nghị SV viết lại toàn bộ phần Tổng quan lý thuyết và trích dẫn nguồn đầy đủ."
      };
    }

    return defaultSummary;
  }, [selected]);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 text-white rounded-2xl border border-teal-800/50 p-6 md:p-8 shadow-xl relative overflow-hidden animate-in fade-in duration-500">
      {/* Background glowing orb effect */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -left-20 -top-20 w-60 h-60 bg-sky-500/5 rounded-full blur-[60px] pointer-events-none" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800/80 border border-teal-700/50 flex items-center justify-center shadow-lg shadow-teal-950/50">
              <span className="material-symbols-outlined text-teal-300 text-2xl animate-pulse">auto_awesome</span>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-teal-300">Tóm tắt phân tích bằng Gemini AI</h3>
              <p className="text-[10px] text-white/50 uppercase mt-0.5 tracking-wider">Báo cáo tổng hợp chất lượng đồ án tự động</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-full text-[10px] font-black tracking-widest uppercase">
            Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Cột trái: Overview & Đề xuất */}
          <div className="md:col-span-6 space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-400">Tóm tắt nội dung</span>
              <p className="text-xs text-white/85 leading-relaxed font-medium">
                {summaryData.overview}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/10 space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">recommend</span>
                Khuyến nghị của AI
              </span>
              <p className="text-xs text-white/90 font-semibold leading-relaxed">
                {summaryData.recommendation}
              </p>
            </div>
          </div>

          {/* Cột phải: Ưu điểm & Điểm yếu */}
          <div className="md:col-span-6 space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-emerald-400">check_circle</span>
                Ưu điểm & Điểm cộng học thuật
              </span>
              <ul className="space-y-1.5 pl-1.5">
                {summaryData.strengths.map((str, idx) => (
                  <li key={idx} className="text-xs text-white/80 leading-relaxed flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5 shrink-0">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-rose-400">warning</span>
                Hạn chế & Điểm cần cải thiện
              </span>
              <ul className="space-y-1.5 pl-1.5">
                {summaryData.weaknesses.map((weak, idx) => (
                  <li key={idx} className="text-xs text-white/80 leading-relaxed flex items-start gap-2">
                    <span className="text-rose-400 font-bold mt-0.5 shrink-0">!</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  const generateAiFeedback = () => {
    const defaultText = `Đồ án "${selected.title}" của sinh viên ${selected.student} trình bày cấu trúc rõ ràng. Các chỉ số trùng lặp đạt yêu cầu học thuật. Khuyến nghị giảng viên xem xét cho điểm từ 8.0 - 8.5 dựa trên tính thực tiễn cao của đề tài.`;
    
    const feedbackMap = {
      'sub-001': "Nghiên cứu có tính học thuật cao, khảo sát sâu sắc tác động của AI đến giáo dục đại học. Các luận điểm đưa ra thuyết phục, lập luận chặt chẽ. Chỉ số trùng lặp rất thấp (12%), trích dẫn nguồn cực kỳ uy tín và rõ ràng. Khuyên dùng mức điểm xuất sắc (8.5 - 9.0).",
      'sub-002': "Đề tài ứng dụng Blockchain vào bảng điểm mang tính thực tiễn rất cao. Tuy nhiên, nội dung còn trùng lặp một số đoạn từ nguồn IEEE (Similarity 28%), sinh viên cần chỉnh sửa diễn đạt lại để tăng tính cá nhân hóa trước khi bảo vệ trước Hội đồng. Khuyên dùng mức điểm 7.0 - 7.5.",
      'sub-003': "Đề tài Sentiment Analysis sử dụng PhoBERT có cấu trúc tốt, dữ liệu phong phú. Tuy nhiên, chỉ số trùng lặp (45%) và dấu hiệu viết bằng AI (22%) ở mức cảnh báo nghiêm trọng. Đề nghị sinh viên viết lại toàn bộ chương 1 lý thuyết và trích dẫn chuẩn hóa lại tài liệu tham khảo. Khuyên dùng điểm trung bình khá (5.5 - 6.0) nếu chưa sửa."
    };
    
    setFeedback(feedbackMap[selected.id] || defaultText);
  };

  return (
    <div className="w-full max-w-full min-w-0 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-teal-700 uppercase tracking-[0.2em] mb-1">
            Phân tích & Đánh giá đồ án
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Thesis Analysis & Evaluation</h1>
          <p className="text-xs text-slate-500 mt-1 break-words">
            <Link to="/lecturer" className="text-teal-800 hover:underline font-medium">
              Trang chủ GV
            </Link>
            <span className="text-slate-300 mx-1">/</span>
            <span>Phân tích AI, Đạo văn & Điểm số</span>
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
          <AISummaryCard selected={selected} />
          
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
            <div className="mb-4 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-500 block">Nhận xét</label>
                <button
                  type="button"
                  onClick={generateAiFeedback}
                  className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-teal-800 to-cyan-800 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm hover:brightness-110 active:scale-95 transition-all"
                  title="Gemini AI tự động soạn thảo tóm tắt và nhận xét"
                >
                  <span className="material-symbols-outlined text-[12px] animate-pulse">auto_awesome</span>
                  Gemini AI gợi ý nhận xét
                </button>
              </div>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={3}
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
