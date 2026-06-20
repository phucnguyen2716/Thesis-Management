import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { socialService } from '../../services/api';
import {
  SOCIAL_CATEGORIES,
  SOCIAL_CHANNELS,
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



// ─────────────────────────────────────────────────────────────
// Tab: News Posts
// ─────────────────────────────────────────────────────────────
function NewsTab() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyPost());

  const load = useCallback(async () => {
    try {
      const { data } = await socialService.getAll(false);
      setPosts(data);
    } catch (err) {
      console.error("Failed to load social posts from backend", err);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter(p => {
      if (p.category === 'Sự kiện') return false;
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
  const handleSave = async e => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    try {
      if (modal.mode === 'create') {
        await socialService.create(form);
      } else {
        await socialService.update(modal.id, form);
      }
      setModal(null);
      load();
    } catch (err) {
      console.error("Failed to save post", err);
    }
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
                <div className="flex items-center gap-1.5">
                  {p.image && (
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                      p.cloudinaryStatus === 'Uploaded' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : p.cloudinaryStatus === 'Pending' 
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse' 
                        : p.cloudinaryStatus === 'Failed' 
                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                        : 'bg-slate-700/50 text-slate-400 border-slate-700'
                    }`}>
                      <span className="material-symbols-outlined text-[10px]">{
                        p.cloudinaryStatus === 'Uploaded' ? 'cloud_done' : p.cloudinaryStatus === 'Pending' ? 'sync' : p.cloudinaryStatus === 'Failed' ? 'cloud_off' : 'cloud'
                      }</span>
                      {p.cloudinaryStatus === 'Uploaded' ? 'Cloudinary' : p.cloudinaryStatus === 'Pending' ? 'Đang đẩy...' : p.cloudinaryStatus === 'Failed' ? 'Lỗi đẩy' : 'Chưa đẩy'}
                    </span>
                  )}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                    {p.published ? 'Đã đăng' : 'Nháp'}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-bold text-white line-clamp-2">{p.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 flex-1">{p.desc}</p>
              <p className="text-[10px] text-slate-500 mt-2">{p.date || new Date(p.createdAt).toLocaleDateString('vi-VN')} · {(p.channels || []).join(', ')}</p>
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => openEdit(p)} className="flex-1 py-1.5 rounded-lg bg-slate-700 text-xs font-bold text-white">Sửa</button>
                <button type="button" onClick={async () => { if (window.confirm('Xóa bài đăng?')) { try { await socialService.delete(p.id); load(); } catch(e){} } }} className="px-3 py-1.5 rounded-lg bg-red-900/40 text-xs font-bold text-red-300">Xóa</button>
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
// Main page
// ─────────────────────────────────────────────────────────────
const AdminSocialPage = () => {
  return (
    <div className="w-full space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-white">Quản lý Social Media</h1>
        <p className="text-slate-400 text-sm">Tin/bài đăng hiển thị trên portal sinh viên · kênh portal, Facebook, LinkedIn…</p>
      </div>

      {/* Content */}
      <div className="space-y-5">
        <NewsTab />
      </div>
    </div>
  );
};

export default AdminSocialPage;
