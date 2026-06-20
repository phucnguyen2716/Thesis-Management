import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STATUS_MAP = {
  pending:  { label: 'Chờ duyệt',  bg: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  approved: { label: 'Đã duyệt',   bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Từ chối',    bg: 'bg-red-100 text-red-800 border-red-200' },
};

const LecturerEventProposalPage = () => {
  const [proposals, setProposals] = useState([]);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [note, setNote] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const lecturerName = currentUser.fullName || 'Giảng viên Demo';

  const loadProposals = () => {
    try {
      const raw = localStorage.getItem('lecturerEventProposals');
      const list = raw ? JSON.parse(raw) : [];
      setProposals(
        list
          .filter(p => p.lecturerName === lecturerName)
          .sort((a, b) => b.createdAt - a.createdAt)
      );
    } catch {
      setProposals([]);
    }
  };

  useEffect(() => {
    loadProposals();
    const handler = () => loadProposals();
    window.addEventListener('storage', handler);
    window.addEventListener('lecturer-proposals-updated', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('lecturer-proposals-updated', handler);
    };
  }, []);

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Vui lòng nhập tên sự kiện';
    if (!link.trim()) {
      errs.link = 'Vui lòng nhập đường link';
    } else {
      try { new URL(link.trim()); } catch {
        errs.link = 'URL không hợp lệ. Phải bắt đầu bằng https://';
      }
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setIsLoading(true);

    const newProposal = {
      id: `prop-${Date.now()}`,
      title: title.trim(),
      link: link.trim(),
      imageUrl: imageUrl.trim(),
      note: note.trim(),
      lecturerName,
      status: 'pending',
      adminNote: '',
      createdAt: Date.now(),
    };

    try {
      const raw = localStorage.getItem('lecturerEventProposals');
      const currentList = raw ? JSON.parse(raw) : [];
      localStorage.setItem('lecturerEventProposals', JSON.stringify([newProposal, ...currentList]));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('lecturer-proposals-updated'));
    } catch (err) {
      console.error(err);
    }

    setTitle('');
    setLink('');
    setImageUrl('');
    setNote('');
    setIsLoading(false);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 5000);
    loadProposals();
  };

  return (
    <div className="w-full max-w-full min-w-0 animate-in fade-in duration-300 space-y-6">

      {/* ── Header ── */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 bg-teal-50 rounded-2xl flex items-center justify-center border border-teal-100 shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-2xl text-teal-900">campaign</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Đề xuất sự kiện ngoài trường</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gửi tên sự kiện kèm link cho Admin xem xét và đăng lên Portal sinh viên ·{' '}
              <Link to="/lecturer" className="text-teal-800 font-bold hover:underline">Trang chủ</Link>
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 border border-teal-100 rounded-xl text-[11px] font-bold text-teal-800">
          <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
          Admin sẽ duyệt và đăng tin
        </div>
      </div>

      {/* ── Success toast ── */}
      {isSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
          <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
          Đề xuất đã gửi thành công! Ban quản trị sẽ xem xét và phản hồi sớm.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Form ── */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="material-symbols-outlined text-teal-800 text-base">add_circle</span>
            <h2 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Gửi đề xuất mới</h2>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Event name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Tên sự kiện <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="VD: Hội thảo Khởi nghiệp sáng tạo 2026"
                className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all bg-slate-50/40
                  ${errors.title ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-teal-700 focus:ring-teal-100'}`}
              />
              {errors.title && <p className="text-[10px] text-red-500 font-bold">{errors.title}</p>}
            </div>

            {/* Event link */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Đường link sự kiện <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">link</span>
                <input
                  type="url"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  placeholder="https://example.com/su-kien"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all bg-slate-50/40
                    ${errors.link ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-teal-700 focus:ring-teal-100'}`}
                />
              </div>
              {errors.link
                ? <p className="text-[10px] text-red-500 font-bold">{errors.link}</p>
                : <p className="text-[10px] text-slate-400 font-medium">Website, fanpage, form đăng ký... của sự kiện</p>
              }
            </div>

            {/* Optional image URL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                URL hình ảnh sự kiện <span className="text-slate-300 font-medium">(tuỳ chọn)</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">image</span>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 transition-all bg-slate-50/40"
                />
              </div>
              {imageUrl && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 h-24">
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                </div>
              )}
              <p className="text-[10px] text-slate-400 font-medium">Ảnh đại diện cho sự kiện (nếu có)</p>
            </div>

            {/* Optional note */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Ghi chú cho Admin <span className="text-slate-300 font-medium">(tuỳ chọn)</span>
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Lý do đề xuất, đối tượng SV phù hợp, lợi ích tham gia..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 transition-all bg-slate-50/40 resize-none font-sans leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-teal-900 text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-teal-950 transition-all shadow shadow-teal-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              Gửi đề xuất tới Admin
            </button>
          </form>

          {/* How-it-works */}
          <div className="p-4 bg-blue-50/80 border border-blue-100 rounded-xl space-y-2 text-[11px] text-blue-800">
            <p className="font-black flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-blue-600">tips_and_updates</span>
              Quy trình duyệt sự kiện
            </p>
            <ol className="space-y-1 font-medium text-blue-700 pl-4 list-decimal">
              <li>Giảng viên gửi tên + link sự kiện</li>
              <li>Admin kiểm tra link và xem xét nội dung</li>
              <li>Nếu duyệt → Admin đăng tin lên Portal SV</li>
              <li>Trạng thái hiển thị ngay trong lịch sử</li>
            </ol>
          </div>
        </div>

        {/* ── History ── */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 text-base">history</span>
              <h2 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Lịch sử đề xuất</h2>
            </div>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black">
              {proposals.length} đề xuất
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-0.5">
            {proposals.length > 0 ? proposals.map(prop => {
              const s = STATUS_MAP[prop.status] || STATUS_MAP.pending;
              return (
                <div key={prop.id} className="rounded-xl border border-slate-100 bg-slate-50/60 overflow-hidden hover:border-slate-200 transition-all">
                  {/* Image thumbnail if provided */}
                  {prop.imageUrl && (
                    <div className="h-32 overflow-hidden">
                      <img src={prop.imageUrl} alt="" className="w-full h-full object-cover" onError={e => { e.target.parentElement.style.display = 'none'; }} />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    {/* Title + badge */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-extrabold text-sm text-slate-800 leading-snug flex-1">{prop.title}</h3>
                      <span className={`shrink-0 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase border ${s.bg}`}>
                        {s.label}
                      </span>
                    </div>

                    {/* Link */}
                    <a
                      href={prop.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-teal-700 font-bold hover:underline break-all"
                    >
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      {prop.link}
                    </a>

                    {/* Lecturer note */}
                    {prop.note && (
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic border-l-2 border-slate-200 pl-2">
                        {prop.note}
                      </p>
                    )}

                    {/* Admin reply */}
                    {prop.adminNote && (
                      <div className={`text-[10px] font-bold p-2.5 rounded-lg border flex items-start gap-1.5
                        ${prop.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                        <span className="material-symbols-outlined text-[13px] mt-0.5 shrink-0">admin_panel_settings</span>
                        <span>Admin: {prop.adminNote}</span>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 font-medium">
                      Gửi lúc: {new Date(prop.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center space-y-3">
                <span className="material-symbols-outlined text-5xl text-slate-300">campaign</span>
                <p className="text-sm font-bold text-slate-500">Chưa có đề xuất nào</p>
                <p className="text-xs text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                  Điền tên sự kiện và đường link ở bên trái để gửi đề xuất đầu tiên.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LecturerEventProposalPage;
