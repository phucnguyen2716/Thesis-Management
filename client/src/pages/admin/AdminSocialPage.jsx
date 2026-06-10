import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  getAllSocialPosts,
  createSocialPost,
  updateSocialPost,
  deleteSocialPost,
  SOCIAL_CATEGORIES,
  SOCIAL_CHANNELS,
  ensureContentSeed,
} from '../../utils/adminContentStore';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const emptyPost = () => ({
  title: '',
  date: new Date().toLocaleDateString('vi-VN'),
  category: 'Tin mới',
  badgeClass: 'bg-primary text-on-primary',
  image: '',
  desc: '',
  content: '',
  published: true,
  channels: ['portal'],
});

const PROPOSAL_STATUS = {
  pending:  { label: 'Chờ duyệt',  cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  approved: { label: 'Đã duyệt',   cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Từ chối',    cls: 'bg-red-100 text-red-800 border-red-200' },
};

function loadProposals() {
  try {
    const raw = localStorage.getItem('lecturerEventProposals');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveProposals(list) {
  localStorage.setItem('lecturerEventProposals', JSON.stringify(list));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('lecturer-proposals-updated'));
}

// ─────────────────────────────────────────────────────────────
// Tab: News Posts
// ─────────────────────────────────────────────────────────────
function NewsTab() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyPost());

  const load = useCallback(() => setPosts(getAllSocialPosts()), []);
  useEffect(() => {
    ensureContentSeed();
    load();
    window.addEventListener('admin-content-updated', load);
    return () => window.removeEventListener('admin-content-updated', load);
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter(p => {
      if (catFilter !== 'all' && p.category !== catFilter) return false;
      if (!q) return true;
      return p.title?.toLowerCase().includes(q) || p.desc?.toLowerCase().includes(q);
    });
  }, [posts, search, catFilter]);

  const openCreate = (prefill = {}) => {
    setForm({ ...emptyPost(), ...prefill });
    setModal({ mode: 'create' });
  };
  const openEdit = p => {
    setForm({ ...p, channels: [...(p.channels || [])] });
    setModal({ mode: 'edit', id: p.id });
  };
  const toggleChannel = ch => {
    setForm(prev => {
      const chs = prev.channels || [];
      return { ...prev, channels: chs.includes(ch) ? chs.filter(c => c !== ch) : [...chs, ch] };
    });
  };
  const handleSave = e => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    if (modal.mode === 'create') createSocialPost(form);
    else updateSocialPost(modal.id, form);
    setModal(null);
    load();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Danh sách bài đăng</h2>
          <p className="text-slate-400 text-xs">Tin/bài hiển thị trên portal sinh viên (/news)</p>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold uppercase shrink-0"
        >
          + Đăng bài mới
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm tiêu đề, mô tả..."
          className="sm:col-span-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
        >
          <option value="all">Tất cả danh mục</option>
          {SOCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(p => (
          <article key={p.id} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col">
            {p.image && (
              <div className="h-32 bg-slate-800">
                <img src={p.image} alt="" className="w-full h-full object-cover opacity-90" />
              </div>
            )}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase">{p.category}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  {p.published ? 'Đã đăng' : 'Nháp'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white line-clamp-2">{p.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 flex-1">{p.desc}</p>
              <p className="text-[10px] text-slate-500 mt-2">{p.date} · {(p.channels || []).join(', ')}</p>
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => openEdit(p)} className="flex-1 py-1.5 rounded-lg bg-slate-700 text-xs font-bold text-white">Sửa</button>
                <button type="button" onClick={() => { if (window.confirm('Xóa bài đăng?')) { deleteSocialPost(p.id); load(); } }} className="px-3 py-1.5 rounded-lg bg-red-900/40 text-xs font-bold text-red-300">Xóa</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <form onSubmit={handleSave} className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-700 p-5 space-y-3 my-4">
            <h2 className="text-lg font-bold text-white">{modal.mode === 'create' ? 'Đăng bài mới' : 'Sửa bài đăng'}</h2>
            <label className="block text-xs text-slate-400">
              Tiêu đề *
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white" />
            </label>
            <label className="block text-xs text-slate-400">
              Mô tả ngắn
              <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={2} className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white" />
            </label>
            <label className="block text-xs text-slate-400">
              Nội dung chi tiết (tùy chọn)
              <textarea value={form.content || ''} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="Nội dung đầy đủ, link nguồn, hướng dẫn đăng ký..." className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs leading-relaxed" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-slate-400">
                Ngày hiển thị
                <input value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white" />
              </label>
              <label className="block text-xs text-slate-400">
                Danh mục
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white">
                  {SOCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </div>
            <label className="block text-xs text-slate-400">
              URL ảnh bìa
              <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white" />
            </label>
            <div>
              <p className="text-xs text-slate-400 mb-2">Kênh đăng</p>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_CHANNELS.map(ch => (
                  <button key={ch} type="button" onClick={() => toggleChannel(ch)} className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${(form.channels || []).includes(ch) ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>{ch}</button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
              Xuất bản lên portal
            </label>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold">Lưu</button>
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 font-bold">Hủy</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab: Lecturer Event Proposals
// ─────────────────────────────────────────────────────────────
function ProposalsTab() {
  const [proposals, setProposals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectModal, setRejectModal] = useState(null); // { id }
  const [rejectNote, setRejectNote] = useState('');
  const [approveModal, setApproveModal] = useState(null); // { prop }
  const [approveNote, setApproveNote] = useState('');

  const reload = () => setProposals(loadProposals().sort((a, b) => b.createdAt - a.createdAt));
  useEffect(() => {
    reload();
    window.addEventListener('storage', reload);
    window.addEventListener('lecturer-proposals-updated', reload);
    return () => {
      window.removeEventListener('storage', reload);
      window.removeEventListener('lecturer-proposals-updated', reload);
    };
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return proposals;
    return proposals.filter(p => p.status === statusFilter);
  }, [proposals, statusFilter]);

  const pendingCount = proposals.filter(p => p.status === 'pending').length;

  const updateStatus = (id, status, adminNote = '') => {
    const list = loadProposals().map(p => p.id === id ? { ...p, status, adminNote } : p);
    saveProposals(list);
    reload();
  };

  const handleApprove = (prop) => {
    // approve the proposal
    updateStatus(prop.id, 'approved', approveNote.trim() || 'Đã duyệt và đăng tin lên Portal.');
    // auto-create a news post from this proposal
    createSocialPost({
      title: prop.title,
      date: new Date().toLocaleDateString('vi-VN'),
      category: 'Sự kiện',
      badgeClass: 'bg-primary text-on-primary',
      image: '',
      desc: `Sự kiện ngoài trường được đề xuất bởi ${prop.lecturerName}. ${prop.note || ''}`.trim(),
      content: `Xem thông tin chi tiết tại: ${prop.link}\n\n${prop.note || ''}`.trim(),
      published: true,
      channels: ['portal'],
      sourceLink: prop.link,
    });
    setApproveModal(null);
    setApproveNote('');
    reload();
  };

  const handleReject = () => {
    if (!rejectModal) return;
    updateStatus(rejectModal.id, 'rejected', rejectNote.trim() || 'Không phù hợp với chính sách hiện tại.');
    setRejectModal(null);
    setRejectNote('');
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3 items-start sm:items-center">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            Đề xuất sự kiện từ Giảng viên
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-yellow-500 text-slate-950 rounded-full text-[10px] font-black">{pendingCount} chờ duyệt</span>
            )}
          </h2>
          <p className="text-slate-400 text-xs">Xem link sự kiện, duyệt hoặc từ chối — bài được duyệt sẽ tự động đăng lên Portal</p>
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${statusFilter === s ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {s === 'all' ? 'Tất cả' : PROPOSAL_STATUS[s]?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3 border border-slate-800 rounded-xl bg-slate-900/50">
            <span className="material-symbols-outlined text-5xl text-slate-600">campaign</span>
            <p className="text-slate-500 text-sm font-bold">Chưa có đề xuất nào</p>
          </div>
        ) : filtered.map(prop => {
          const s = PROPOSAL_STATUS[prop.status] || PROPOSAL_STATUS.pending;
          return (
            <div key={prop.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              {/* Row 1: title + badge */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-amber-400 uppercase mb-0.5">{prop.lecturerName}</p>
                  <h3 className="text-sm font-extrabold text-white leading-snug">{prop.title}</h3>
                </div>
                <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${s.cls}`}>{s.label}</span>
              </div>

              {/* Row 2: link */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800 border border-slate-700">
                <span className="material-symbols-outlined text-teal-400 text-base shrink-0">link</span>
                <a
                  href={prop.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-400 text-xs font-bold hover:underline break-all"
                >
                  {prop.link}
                </a>
              </div>

              {/* Row 3: note from lecturer */}
              {prop.note && (
                <p className="text-[11px] text-slate-400 font-medium italic border-l-2 border-slate-700 pl-3 leading-relaxed">
                  "{prop.note}"
                </p>
              )}

              {/* Admin reply */}
              {prop.adminNote && (
                <div className={`p-2.5 rounded-lg border text-[11px] font-bold flex items-start gap-1.5
                  ${prop.status === 'approved' ? 'bg-emerald-900/20 border-emerald-800/50 text-emerald-400' : 'bg-red-900/20 border-red-800/50 text-red-400'}`}>
                  <span className="material-symbols-outlined text-[13px] mt-0.5 shrink-0">admin_panel_settings</span>
                  Phản hồi: {prop.adminNote}
                </div>
              )}

              {/* Meta + actions */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[10px] text-slate-500 font-medium">
                  Gửi lúc {new Date(prop.createdAt).toLocaleString('vi-VN')}
                </p>
                {prop.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setApproveModal(prop); setApproveNote(''); }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-lg flex items-center gap-1 transition-all"
                    >
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      Duyệt & đăng tin
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRejectModal({ id: prop.id }); setRejectNote(''); }}
                      className="px-3 py-1.5 bg-red-900/40 hover:bg-red-800/60 text-red-300 text-[10px] font-black rounded-lg flex items-center gap-1 transition-all"
                    >
                      <span className="material-symbols-outlined text-[13px]">cancel</span>
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Approve modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 p-5 space-y-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              Duyệt và đăng tin
            </h2>
            <div className="p-3 bg-slate-800 rounded-lg space-y-1.5">
              <p className="text-xs font-bold text-white">{approveModal.title}</p>
              <a href={approveModal.link} target="_blank" rel="noreferrer" className="text-[11px] text-teal-400 font-bold hover:underline break-all flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                {approveModal.link}
              </a>
            </div>
            <div className="text-[11px] text-emerald-400 font-bold bg-emerald-900/20 border border-emerald-800/40 rounded-lg p-3">
              ✓ Bài tin mới sẽ được tự động tạo và đăng lên Portal sinh viên.
            </div>
            <label className="block text-xs text-slate-400">
              Ghi chú phản hồi cho giảng viên (tuỳ chọn)
              <textarea
                value={approveNote}
                onChange={e => setApproveNote(e.target.value)}
                rows={2}
                placeholder="VD: Đã duyệt, tin sẽ xuất hiện trên portal trong vòng 1 ngày..."
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleApprove(approveModal)} className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all">
                Xác nhận duyệt & đăng
              </button>
              <button type="button" onClick={() => setApproveModal(null)} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-xs font-bold">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 p-5 space-y-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-red-400">cancel</span>
              Từ chối đề xuất
            </h2>
            <label className="block text-xs text-slate-400">
              Lý do từ chối (sẽ gửi tới giảng viên)
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                rows={3}
                placeholder="VD: Nội dung không phù hợp với chính sách hiện tại của trường..."
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={handleReject} className="flex-1 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-black transition-all">
                Xác nhận từ chối
              </button>
              <button type="button" onClick={() => setRejectModal(null)} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-xs font-bold">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
const AdminSocialPage = () => {
  const [tab, setTab] = useState('news');

  // Count pending proposals for badge
  const [pendingCount, setPendingCount] = useState(0);
  const refreshBadge = useCallback(() => {
    setPendingCount(loadProposals().filter(p => p.status === 'pending').length);
  }, []);
  useEffect(() => {
    refreshBadge();
    window.addEventListener('storage', refreshBadge);
    window.addEventListener('lecturer-proposals-updated', refreshBadge);
    return () => {
      window.removeEventListener('storage', refreshBadge);
      window.removeEventListener('lecturer-proposals-updated', refreshBadge);
    };
  }, [refreshBadge]);

  const TABS = [
    { key: 'news',      label: 'Bài đăng',               icon: 'newspaper' },
    { key: 'proposals', label: 'Đề xuất sự kiện',         icon: 'campaign',  badge: pendingCount },
  ];

  return (
    <div className="max-w-6xl space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-white">Quản lý Social Media</h1>
        <p className="text-slate-400 text-sm">Tin/bài đăng hiển thị trên portal sinh viên · kênh portal, Facebook, LinkedIn…</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all relative
              ${tab === t.key ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
            {t.badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] font-black flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-5">
        {tab === 'news' && <NewsTab />}
        {tab === 'proposals' && <ProposalsTab />}
      </div>
    </div>
  );
};

export default AdminSocialPage;
