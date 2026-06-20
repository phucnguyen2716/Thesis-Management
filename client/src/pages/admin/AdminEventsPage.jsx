import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { socialService } from '../../services/api';

const SOCIAL_CATEGORIES = ['Tin mới', 'Hướng dẫn', 'Tính năng', 'Báo chí'];
const SOCIAL_CHANNELS = ['portal', 'facebook', 'linkedin', 'zalo'];

const emptyNewsPost = () => ({
  title: '',
  category: 'Tin mới',
  badgeClass: 'bg-primary text-on-primary',
  image: '',
  desc: '',
  content: '',
  published: true,
  channels: ['portal'],
});

const EVENT_TYPES = [
  'Hội thảo',
  'Seminar',
  'Workshop',
  'Cuộc thi',
  'Tuyển dụng',
  'Ngoại khóa',
  'Khác',
];

const STATUS_MAP = {
  upcoming:  { label: 'Sắp diễn ra', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  ongoing:   { label: 'Đang diễn ra', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  completed: { label: 'Đã kết thúc', cls: 'bg-slate-800 text-slate-400 border-slate-700' },
  cancelled: { label: 'Đã hủy',      cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const emptyEvent = () => ({
  title: '',
  description: '',
  eventType: 'Hội thảo',
  location: '',
  startDate: '',
  endDate: '',
  organizer: '',
  contactPhone: '',
  contactEmail: '',
  maxParticipants: '',
  imageUrl: '',
  link: '',
  status: 'upcoming',
  published: true,
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
// Seed data
// ─────────────────────────────────────────────────────────────
const SEED_EVENTS = [
  {
    id: 'evt-1',
    title: 'Hội thảo: Hướng dẫn viết bài báo khoa học và Công bố quốc tế 2025',
    description: 'Hội thảo chuyên đề giúp sinh viên nắm vững phương pháp viết bài báo khoa học, cách lập luận và trình bày kết quả nghiên cứu chuẩn Scopus/ISI.',
    eventType: 'Hội thảo',
    location: 'Hội trường A, Cơ sở 1 - UEF',
    startDate: '2025-07-15',
    endDate: '2025-07-15',
    organizer: 'Khoa Công nghệ thông tin',
    contactPhone: '0901234567',
    contactEmail: 'cntt@uef.edu.vn',
    maxParticipants: '250',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
    link: 'https://uef.edu.vn/scientific-writing-2025',
    status: 'upcoming',
    published: true,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'evt-2',
    title: 'Workshop: Kỹ năng nghiên cứu khoa học và Khai thác cơ sở dữ liệu',
    description: 'Workshop thực hành giúp sinh viên làm quen với các công cụ tìm kiếm bài báo khoa học, quản lý trích dẫn tài liệu tham khảo (Mendeley/Zotero).',
    eventType: 'Workshop',
    location: 'Phòng Lab 301, Tòa nhà B',
    startDate: '2025-06-20',
    endDate: '2025-06-20',
    organizer: 'PGS.TS. Nguyễn Văn An',
    contactPhone: '0901234567',
    contactEmail: 'nguyen.van.an@uef.edu.vn',
    maxParticipants: '60',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
    link: '',
    status: 'ongoing',
    published: true,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'evt-3',
    title: 'Seminar: Quy chuẩn viết báo cáo Nghiên cứu khoa học sinh viên cấp Trường',
    description: 'Seminar chuyên đề chia sẻ quy chuẩn trình bày khóa luận, báo cáo khoa học cấp trường, định dạng theo chuẩn IEEE/APA và quy trình phản biện.',
    eventType: 'Seminar',
    location: 'Online - Microsoft Teams',
    startDate: '2025-05-25',
    endDate: '2025-05-25',
    organizer: 'TS. Trần Thị Bích Ngọc',
    contactPhone: '0912345678',
    contactEmail: 'tran.bich.ngoc@uef.edu.vn',
    maxParticipants: '300',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    link: 'https://teams.microsoft.com/seminar-research-standard',
    status: 'completed',
    published: true,
    createdAt: Date.now() - 86400000 * 20,
  },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
const AdminEventsPage = () => {
  const [tab, setTab] = useState('events');

  // Proposals states
  const [proposals, setProposals] = useState([]);
  const [propStatusFilter, setPropStatusFilter] = useState('all');
  const [rejectModal, setRejectModal] = useState(null); // { id }
  const [rejectNote, setRejectNote] = useState('');
  const [approveModal, setApproveModal] = useState(null); // { prop }
  const [approveNote, setApproveNote] = useState('');
  const [approvingProposalId, setApprovingProposalId] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null); // 'create' | 'edit'
  const [form, setForm] = useState(emptyEvent());
  const [editId, setEditId] = useState(null);
  const [viewEvent, setViewEvent] = useState(null);

  // ── News tab state ──
  const [newsPosts, setNewsPosts] = useState([]);
  const [newsSearch, setNewsSearch] = useState('');
  const [newsCatFilter, setNewsCatFilter] = useState('all');
  const [newsModal, setNewsModal] = useState(null); // { mode: 'create'|'edit', id? }
  const [newsForm, setNewsForm] = useState(emptyNewsPost());

  const refreshBadge = useCallback(() => {
    setPendingCount(loadProposals().filter(p => p.status === 'pending').length);
  }, []);

  const reloadProposals = useCallback(() => {
    setProposals(loadProposals().sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  useEffect(() => {
    refreshBadge();
    reloadProposals();
    window.addEventListener('storage', refreshBadge);
    window.addEventListener('storage', reloadProposals);
    window.addEventListener('lecturer-proposals-updated', refreshBadge);
    window.addEventListener('lecturer-proposals-updated', reloadProposals);
    return () => {
      window.removeEventListener('storage', refreshBadge);
      window.removeEventListener('storage', reloadProposals);
      window.removeEventListener('lecturer-proposals-updated', refreshBadge);
      window.removeEventListener('lecturer-proposals-updated', reloadProposals);
    };
  }, [refreshBadge, reloadProposals]);

  const filteredProposals = useMemo(() => {
    if (propStatusFilter === 'all') return proposals;
    return proposals.filter(p => p.status === propStatusFilter);
  }, [proposals, propStatusFilter]);

  const load = useCallback(async () => {
    try {
      const { data } = await socialService.getAll(false);
      let list = data
        .filter(p => p.category === 'Sự kiện')
        .map(p => {
          let extra = {};
          try {
            extra = JSON.parse(p.content);
          } catch {
            extra = {};
          }
          return {
            id: p.id,
            title: p.title,
            description: p.desc,
            imageUrl: p.image,
            published: p.published,
            createdAt: new Date(p.createdAt).getTime(),
            cloudinaryStatus: p.cloudinaryStatus,
            eventType: extra.eventType || 'Hội thảo',
            location: extra.location || '',
            startDate: extra.startDate || '',
            endDate: extra.endDate || '',
            organizer: extra.organizer || '',
            contactPhone: extra.contactPhone || '',
            contactEmail: extra.contactEmail || '',
            maxParticipants: extra.maxParticipants || '',
            link: extra.link || '',
            status: extra.status || 'upcoming',
          };
        });

      // Force re-seed if we find old non-academic events (like Hackathon or Tuyển dụng)
      const hasOldEvents = list.some(e => e.title.includes("Hackathon") || e.title.includes("Tuyển dụng") || e.title.includes("Job Fair"));
      if (hasOldEvents) {
        for (const ev of list) {
          try {
            await socialService.delete(ev.id);
          } catch (e) {
            console.error("Failed to delete old event", ev.id, e);
          }
        }
        list = [];
      }

      // Nếu chưa có sự kiện nào trong DB, tự động seed lên DB
      if (list.length === 0) {
        for (const seed of SEED_EVENTS) {
          const payload = {
            title: seed.title,
            category: 'Sự kiện',
            badgeClass: 'bg-amber-500 text-white',
            image: seed.imageUrl,
            desc: seed.description,
            content: JSON.stringify({
              eventType: seed.eventType,
              location: seed.location,
              startDate: seed.startDate,
              endDate: seed.endDate,
              organizer: seed.organizer,
              contactPhone: seed.contactPhone,
              contactEmail: seed.contactEmail,
              maxParticipants: seed.maxParticipants,
              link: seed.link,
              status: seed.status,
            }),
            published: seed.published,
          };
          await socialService.create(payload);
        }
        const res = await socialService.getAll(false);
        list = res.data
          .filter(p => p.category === 'Sự kiện')
          .map(p => {
            let extra = {};
            try { extra = JSON.parse(p.content); } catch { extra = {}; }
            return {
              id: p.id,
              title: p.title,
              description: p.desc,
              imageUrl: p.image,
              published: p.published,
              createdAt: new Date(p.createdAt).getTime(),
              cloudinaryStatus: p.cloudinaryStatus,
              eventType: extra.eventType || 'Hội thảo',
              location: extra.location || '',
              startDate: extra.startDate || '',
              endDate: extra.endDate || '',
              organizer: extra.organizer || '',
              contactPhone: extra.contactPhone || '',
              contactEmail: extra.contactEmail || '',
              maxParticipants: extra.maxParticipants || '',
              link: extra.link || '',
              status: extra.status || 'upcoming',
            };
          });
      }

      setEvents(list.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error("Failed to load events from backend", err);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener('admin-events-updated', load);
    window.addEventListener('admin-content-updated', load);
    return () => {
      window.removeEventListener('admin-events-updated', load);
      window.removeEventListener('admin-content-updated', load);
    };
  }, [load]);

  const filtered = useMemo(() => {
    return events.filter(ev => {
      const matchSearch = !search ||
        ev.title.toLowerCase().includes(search.toLowerCase()) ||
        ev.organizer?.toLowerCase().includes(search.toLowerCase()) ||
        ev.location?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || ev.eventType === typeFilter;
      const matchStatus = statusFilter === 'all' || ev.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [events, search, typeFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: events.length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    ongoing: events.filter(e => e.status === 'ongoing').length,
    completed: events.filter(e => e.status === 'completed').length,
  }), [events]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const openCreate = () => {
    setForm(emptyEvent());
    setEditId(null);
    setModal('create');
  };

  const openEdit = (ev) => {
    setForm({ ...ev });
    setEditId(ev.id);
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setApprovingProposalId(null);
    setApproveNote('');
  };

  const startApproveProposal = (prop) => {
    setForm({
      title: prop.title,
      description: `Sự kiện ngoài trường được đề xuất bởi ${prop.lecturerName}. ${prop.note || ''}`.trim(),
      eventType: 'Hội thảo',
      location: '',
      startDate: '',
      endDate: '',
      organizer: prop.lecturerName || '',
      contactPhone: '',
      contactEmail: '',
      maxParticipants: '100',
      imageUrl: prop.imageUrl || '',
      link: prop.link || '',
      status: 'upcoming',
      published: true,
    });
    setEditId(null);
    setModal('create');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        category: 'Sự kiện',
        badgeClass: 'bg-amber-500 text-white',
        image: form.imageUrl,
        desc: form.description,
        content: JSON.stringify({
          eventType: form.eventType,
          location: form.location,
          startDate: form.startDate,
          endDate: form.endDate,
          organizer: form.organizer,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          maxParticipants: form.maxParticipants,
          link: form.link,
          status: form.status,
        }),
        published: form.published,
      };

      if (modal === 'create') {
        await socialService.create(payload);
        if (approvingProposalId) {
          const list = loadProposals().map(p => 
            p.id === approvingProposalId 
              ? { ...p, status: 'approved', adminNote: approveNote.trim() || 'Đã duyệt và tạo sự kiện.' } 
              : p
          );
          saveProposals(list);
          setApprovingProposalId(null);
          setApproveNote('');
          reloadProposals();
        }
      } else {
        await socialService.update(editId, payload);
      }
      setModal(null);
      setApprovingProposalId(null);
      setApproveNote('');
      load();
    } catch (err) {
      console.error("Failed to save event", err);
      alert("Đã xảy ra lỗi khi lưu sự kiện.");
    }
  };

  const handleReject = () => {
    if (!rejectModal) return;
    const list = loadProposals().map(p => 
      p.id === rejectModal.id 
        ? { ...p, status: 'rejected', adminNote: rejectNote.trim() || 'Không phù hợp với chính sách hiện tại.' } 
        : p
    );
    saveProposals(list);
    setRejectModal(null);
    setRejectNote('');
    reloadProposals();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sự kiện này?')) return;
    try {
      await socialService.delete(id);
      load();
    } catch (err) {
      console.error("Failed to delete event", err);
      alert("Đã xảy ra lỗi khi xóa sự kiện.");
    }
  };

  const handleTogglePublish = async (id) => {
    const ev = events.find(item => item.id === id);
    if (!ev) return;
    try {
      const payload = {
        title: ev.title,
        category: 'Sự kiện',
        badgeClass: 'bg-amber-500 text-white',
        image: ev.imageUrl,
        desc: ev.description,
        content: JSON.stringify({
          eventType: ev.eventType,
          location: ev.location,
          startDate: ev.startDate,
          endDate: ev.endDate,
          organizer: ev.organizer,
          contactPhone: ev.contactPhone,
          contactEmail: ev.contactEmail,
          maxParticipants: ev.maxParticipants,
          link: ev.link,
          status: ev.status,
        }),
        published: !ev.published,
      };
      await socialService.update(id, payload);
      load();
    } catch (err) {
      console.error("Failed to toggle publish status", err);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return d; }
  };

  // ── News CRUD ──
  const loadNews = useCallback(async () => {
    try {
      const { data } = await socialService.getAll(false);
      setNewsPosts(data.filter(p => p.category !== 'Sự kiện').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error('Failed to load news posts', err);
    }
  }, []);

  useEffect(() => { loadNews(); }, [loadNews]);

  const filteredNews = useMemo(() => {
    const q = newsSearch.trim().toLowerCase();
    return newsPosts.filter(p => {
      if (newsCatFilter !== 'all' && p.category !== newsCatFilter) return false;
      if (!q) return true;
      return p.title?.toLowerCase().includes(q) || p.desc?.toLowerCase().includes(q);
    });
  }, [newsPosts, newsSearch, newsCatFilter]);

  const openCreateNews = () => { setNewsForm(emptyNewsPost()); setNewsModal({ mode: 'create' }); };
  const openEditNews = p => { setNewsForm({ ...p }); setNewsModal({ mode: 'edit', id: p.id }); };
  const handleSaveNews = async e => {
    e.preventDefault();
    if (!newsForm.title?.trim()) return;
    try {
      if (newsModal.mode === 'create') {
        await socialService.create(newsForm);
      } else {
        await socialService.update(newsModal.id, newsForm);
      }
      setNewsModal(null);
      loadNews();
    } catch (err) { console.error('Failed to save news post', err); }
  };
  const handleDeleteNews = async id => {
    if (!window.confirm('Xóa bài đăng này?')) return;
    try { await socialService.delete(id); loadNews(); } catch (err) { console.error(err); }
  };

  const TABS = [
    { key: 'news',      label: 'Tin tức',                 icon: 'newspaper' },
    { key: 'events',    label: 'Sự kiện',                icon: 'event' },
    { key: 'proposals', label: 'Đề xuất từ giảng viên', icon: 'campaign', badge: pendingCount },
  ];

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
          <h1 className="text-2xl font-black text-white">Tin tức &amp; Sự kiện</h1>
          {tab === 'news' ? (
            <p className="text-slate-400 text-sm">{newsPosts.length} bài tin tức · {filteredNews.length} hiển thị</p>
          ) : tab === 'events' ? (
            <p className="text-slate-400 text-sm">Tổng cộng {events.length} sự kiện · {filtered.length} hiển thị</p>
          ) : (
            <p className="text-slate-400 text-sm">Xem link sự kiện, duyệt hoặc từ chối — bài được duyệt sẽ mở form tạo sự kiện</p>
          )}
        </div>
        {tab === 'events' && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold uppercase hover:bg-amber-400 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Thêm sự kiện
          </button>
        )}
        {tab === 'news' && (
          <button
            type="button"
            onClick={openCreateNews}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold uppercase hover:bg-amber-400 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Đăng bài mới
          </button>
        )}
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

      {/* ─── Tab: Tin tức ─── */}
      {tab === 'news' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900">
            <input
              value={newsSearch}
              onChange={e => setNewsSearch(e.target.value)}
              placeholder="Tìm tiêu đề, mô tả..."
              className="sm:col-span-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            />
            <select
              value={newsCatFilter}
              onChange={e => setNewsCatFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            >
              <option value="all">Tất cả danh mục</option>
              {SOCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNews.length === 0 && (
              <div className="col-span-2 py-16 text-center border border-slate-800 rounded-xl bg-slate-900/50 space-y-3">
                <span className="material-symbols-outlined text-5xl text-slate-600">newspaper</span>
                <p className="text-slate-500 text-sm font-bold">Chưa có bài tin tức nào</p>
              </div>
            )}
            {filteredNews.map(p => (
              <article key={p.id} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col">
                {p.image && (
                  <div className="h-36 bg-slate-800 overflow-hidden">
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
                          {p.cloudinaryStatus === 'Uploaded' ? 'Cloud' : p.cloudinaryStatus === 'Pending' ? 'Đẩy...' : p.cloudinaryStatus === 'Failed' ? 'Lỗi' : 'Chưa'}
                        </span>
                      )}
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                        {p.published ? 'Đã đăng' : 'Nháp'}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white line-clamp-2">{p.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 flex-1">{p.desc}</p>
                  <p className="text-[10px] text-slate-500 mt-2">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : ''}</p>
                  <div className="flex gap-2 mt-3">
                    <button type="button" onClick={() => openEditNews(p)} className="flex-1 py-1.5 rounded-lg bg-slate-700 text-xs font-bold text-white hover:bg-slate-600 transition-colors">Sửa</button>
                    <button type="button" onClick={() => handleDeleteNews(p.id)} className="px-3 py-1.5 rounded-lg bg-red-900/40 text-xs font-bold text-red-300 hover:bg-red-900/60 transition-colors">Xóa</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* News Create/Edit Modal */}
      {newsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <form onSubmit={handleSaveNews} className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-700 p-5 space-y-3 my-4">
            <h2 className="text-lg font-bold text-white">{newsModal.mode === 'create' ? 'Đăng bài mới' : 'Sửa bài đăng'}</h2>
            <label className="block text-xs text-slate-400">
              Tiêu đề *
              <input required value={newsForm.title} onChange={e => setNewsForm(f => ({ ...f, title: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white" />
            </label>
            <label className="block text-xs text-slate-400">
              Mô tả ngắn
              <textarea value={newsForm.desc || ''} onChange={e => setNewsForm(f => ({ ...f, desc: e.target.value }))} rows={2} className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white" />
            </label>
            <label className="block text-xs text-slate-400">
              Nội dung chi tiết (tuỳ chọn)
              <textarea value={newsForm.content || ''} onChange={e => setNewsForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="Nội dung đầy đủ, link nguồn, hướng dẫn đăng ký..." className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs leading-relaxed" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-slate-400">
                Danh mục
                <select value={newsForm.category} onChange={e => setNewsForm(f => ({ ...f, category: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white">
                  {SOCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="block text-xs text-slate-400">
                URL ảnh bìa
                <input value={newsForm.image || ''} onChange={e => setNewsForm(f => ({ ...f, image: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white" placeholder="https://..." />
              </label>
            </div>
            {newsForm.image && (
              <div className="rounded-xl overflow-hidden border border-slate-700 h-40">
                <img src={newsForm.image} alt="preview" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={newsForm.published} onChange={e => setNewsForm(f => ({ ...f, published: e.target.checked }))} />
              Xuất bản lên portal
            </label>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold">Lưu</button>
              <button type="button" onClick={() => setNewsModal(null)} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 font-bold">Hủy</button>
            </div>
          </form>
        </div>
      )}

      {tab === 'events' && (

        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Tổng sự kiện', value: stats.total, icon: 'event', color: 'text-amber-400' },
              { label: 'Sắp diễn ra', value: stats.upcoming, icon: 'schedule', color: 'text-blue-400' },
              { label: 'Đang diễn ra', value: stats.ongoing, icon: 'play_circle', color: 'text-emerald-400' },
              { label: 'Đã kết thúc', value: stats.completed, icon: 'check_circle', color: 'text-slate-400' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
                <div>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Tìm kiếm
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tên sự kiện, địa điểm, tổ chức..."
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Loại sự kiện
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
              >
                <option value="all">Tất cả</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Trạng thái
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
              >
                <option value="all">Tất cả</option>
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3">Sự kiện</th>
                  <th className="text-left p-3 hidden md:table-cell">Loại</th>
                  <th className="text-left p-3 hidden lg:table-cell">Địa điểm</th>
                  <th className="text-left p-3">Thời gian</th>
                  <th className="text-center p-3">Trạng thái</th>
                  <th className="text-center p-3">Công khai</th>
                  <th className="text-right p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <span className="material-symbols-outlined text-4xl block mb-2">event_busy</span>
                      Không có sự kiện nào
                    </td>
                  </tr>
                )}
                {filtered.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {ev.imageUrl && (
                          <img src={ev.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg border border-slate-755" />
                        )}
                        <div>
                          <p className="font-bold text-white max-w-xs truncate">{ev.title}</p>
                          <p className="text-[10px] text-slate-500 font-medium">Tổ chức: {ev.organizer || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase">{ev.eventType}</span>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-slate-400 text-xs">{ev.location || '—'}</td>
                    <td className="p-3 text-slate-300 text-xs">
                      <div>{formatDate(ev.startDate)}</div>
                      {ev.endDate && ev.endDate !== ev.startDate && (
                        <div className="text-[10px] text-slate-500">đến {formatDate(ev.endDate)}</div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border whitespace-nowrap ${STATUS_MAP[ev.status]?.cls}`}>
                        {STATUS_MAP[ev.status]?.label}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(ev.id)}
                        className={`material-symbols-outlined text-base transition-colors ${ev.published ? 'text-emerald-400 hover:text-emerald-500' : 'text-slate-600 hover:text-slate-400'}`}
                      >
                        {ev.published ? 'visibility' : 'visibility_off'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ev.imageUrl && (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                            ev.cloudinaryStatus === 'Uploaded' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : ev.cloudinaryStatus === 'Pending' 
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse' 
                              : ev.cloudinaryStatus === 'Failed' 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                              : 'bg-slate-700/50 text-slate-400 border-slate-700'
                          }`}>
                            <span className="material-symbols-outlined text-[10px]">{
                              ev.cloudinaryStatus === 'Uploaded' ? 'cloud_done' : ev.cloudinaryStatus === 'Pending' ? 'sync' : ev.cloudinaryStatus === 'Failed' ? 'cloud_off' : 'cloud'
                            }</span>
                            {ev.cloudinaryStatus === 'Uploaded' ? 'Cloud' : ev.cloudinaryStatus === 'Pending' ? 'Đẩy...' : ev.cloudinaryStatus === 'Failed' ? 'Lỗi' : 'Chưa'}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setViewEvent(ev)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white material-symbols-outlined text-sm"
                          title="Xem chi tiết"
                        >
                          info
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(ev)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white material-symbols-outlined text-sm"
                          title="Chỉnh sửa"
                        >
                          edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ev.id)}
                          className="p-1 rounded hover:bg-red-950/40 text-slate-500 hover:text-red-400 material-symbols-outlined text-sm"
                          title="Xóa"
                        >
                          delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'proposals' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 items-start sm:items-center">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Đề xuất sự kiện từ Giảng viên
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 bg-yellow-500 text-slate-950 rounded-full text-[10px] font-black">{pendingCount} chờ duyệt</span>
                )}
              </h2>
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPropStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${propStatusFilter === s ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {s === 'all' ? 'Tất cả' : PROPOSAL_STATUS[s]?.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredProposals.length === 0 ? (
              <div className="py-16 text-center space-y-3 border border-slate-800 rounded-xl bg-slate-900/50">
                <span className="material-symbols-outlined text-5xl text-slate-600">campaign</span>
                <p className="text-slate-500 text-sm font-bold">Chưa có đề xuất nào</p>
              </div>
            ) : filteredProposals.map(prop => {
              const s = PROPOSAL_STATUS[prop.status] || PROPOSAL_STATUS.pending;
              return (
                <div key={prop.id} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden space-y-0">
                  {/* Image from lecturer (optional) */}
                  {prop.imageUrl && (
                    <div className="h-36 bg-slate-800 overflow-hidden">
                      <img
                        src={prop.imageUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-90"
                        onError={e => { e.target.parentElement.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
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
                            onClick={() => { setApprovingProposalId(prop.id); startApproveProposal(prop); }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-lg flex items-center gap-1 transition-all"
                          >
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            Duyệt &amp; đăng tin
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reject Proposal Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-red-800/50 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-400 text-xl">cancel</span>
              <h2 className="text-base font-black text-white">Từ chối đề xuất</h2>
            </div>
            <p className="text-sm text-slate-400">Nhập lý do từ chối để giảng viên biết:</p>
            <textarea
              rows={3}
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="VD: Nội dung không phù hợp với chính sách hiện tại..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReject}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-lg transition-colors"
              >
                Xác nhận từ chối
              </button>
              <button
                type="button"
                onClick={() => { setRejectModal(null); setRejectNote(''); }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-lg transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewEvent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setViewEvent(null)}>
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-black text-white">Chi tiết sự kiện</h2>
              <button type="button" onClick={() => setViewEvent(null)} className="material-symbols-outlined text-slate-500 hover:text-white p-1">close</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Tên sự kiện</p>
                <p className="text-white font-bold">{viewEvent.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Loại</p>
                  <p className="text-slate-300 text-sm">{viewEvent.eventType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Trạng thái</p>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_MAP[viewEvent.status]?.cls}`}>
                    {STATUS_MAP[viewEvent.status]?.label}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Mô tả</p>
                <p className="text-slate-300 text-sm leading-relaxed">{viewEvent.description || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Bắt đầu</p>
                  <p className="text-slate-300 text-sm">{formatDate(viewEvent.startDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Kết thúc</p>
                  <p className="text-slate-300 text-sm">{formatDate(viewEvent.endDate)}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Địa điểm</p>
                <p className="text-slate-300 text-sm">{viewEvent.location || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Đơn vị tổ chức</p>
                  <p className="text-slate-300 text-sm">{viewEvent.organizer || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Số lượng tối đa</p>
                  <p className="text-slate-300 text-sm">{viewEvent.maxParticipants || '—'}</p>
                </div>
              </div>
              {(viewEvent.contactPhone || viewEvent.contactEmail) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">SĐT liên hệ</p>
                    <p className="text-slate-300 text-sm">{viewEvent.contactPhone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Email liên hệ</p>
                    <p className="text-slate-300 text-sm">{viewEvent.contactEmail || '—'}</p>
                  </div>
                </div>
              )}
              {viewEvent.link && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Link</p>
                  <a href={viewEvent.link} target="_blank" rel="noopener noreferrer" className="text-amber-400 text-sm hover:underline break-all">
                    {viewEvent.link}
                  </a>
                </div>
              )}
              {viewEvent.imageUrl?.trim() && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Hình ảnh</p>
                  <img
                    src={viewEvent.imageUrl}
                    alt={viewEvent.title}
                    className="w-full h-48 object-cover rounded-xl border border-slate-700"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => { setViewEvent(null); openEdit(viewEvent); }}
                className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold uppercase rounded-lg hover:bg-amber-400 transition-colors"
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => setViewEvent(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase rounded-lg hover:bg-slate-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeModal}>
          <form
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-black text-white">
                {modal === 'create' ? (approvingProposalId ? 'Duyệt & Tạo sự kiện mới' : 'Thêm sự kiện mới') : 'Chỉnh sửa sự kiện'}
              </h2>
              <button type="button" onClick={closeModal} className="material-symbols-outlined text-slate-500 hover:text-white p-1">close</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Approve note when approving proposal */}
              {approvingProposalId && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <p className="text-[10px] font-black text-amber-400 uppercase">Đang duyệt đề xuất — điền thông tin sự kiện bên dưới</p>
                  <label className="block">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Ghi chú phản hồi tới giảng viên (tuỳ chọn)</span>
                    <input
                      value={approveNote}
                      onChange={e => setApproveNote(e.target.value)}
                      placeholder="VD: Đã duyệt và đăng sự kiện lên Portal..."
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-amber-500/30 text-white text-sm"
                    />
                  </label>
                </div>
              )}
              {/* Title */}
              <label className="block">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tên sự kiện *</span>
                <input
                  required
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="VD: Hội thảo Khoa học Công nghệ 2025"
                />
              </label>

              {/* Type + Status */}
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Loại sự kiện</span>
                  <select
                    value={form.eventType}
                    onChange={e => set('eventType', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Trạng thái</span>
                  <select
                    value={form.status}
                    onChange={e => set('status', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  >
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </label>
              </div>

              {/* Description */}
              <label className="block">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Mô tả</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm resize-none"
                  placeholder="Mô tả chi tiết về sự kiện..."
                />
              </label>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Ngày bắt đầu *</span>
                  <input
                    required
                    type="date"
                    value={form.startDate}
                    onChange={e => set('startDate', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Ngày kết thúc</span>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => set('endDate', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  />
                </label>
              </div>

              {/* Location */}
              <label className="block">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Địa điểm</span>
                <input
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="VD: Hội trường A, Cơ sở 1 - UEF"
                />
              </label>

              {/* Organizer + Max */}
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Đơn vị tổ chức</span>
                  <input
                    value={form.organizer}
                    onChange={e => set('organizer', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="VD: Khoa CNTT"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Số lượng tối đa</span>
                  <input
                    type="number"
                    value={form.maxParticipants}
                    onChange={e => set('maxParticipants', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="VD: 200"
                  />
                </label>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">SĐT liên hệ</span>
                  <input
                    value={form.contactPhone}
                    onChange={e => set('contactPhone', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="VD: 0901234567"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Email liên hệ</span>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={e => set('contactEmail', e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    placeholder="VD: event@uef.edu.vn"
                  />
                </label>
              </div>

              {/* Link */}
              <label className="block">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Link sự kiện</span>
                <input
                  value={form.link}
                  onChange={e => set('link', e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="https://..."
                />
              </label>

              {/* Image */}
              <label className="block">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Hình ảnh sự kiện (URL)</span>
                <input
                  value={form.imageUrl}
                  onChange={e => set('imageUrl', e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                  placeholder="https://example.com/event-image.jpg"
                />
              </label>
              {form.imageUrl?.trim() && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => set('imageUrl', '')}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors"
                    title="Xóa hình"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}

              {/* Published */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={e => set('published', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 accent-amber-500"
                />
                <span className="text-sm text-slate-300 font-semibold">Hiển thị công khai trên Portal</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 p-5 border-t border-slate-800">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase rounded-lg hover:bg-slate-700 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-amber-500 text-slate-950 text-xs font-bold uppercase rounded-lg hover:bg-amber-400 transition-colors"
              >
                {modal === 'create' ? 'Tạo sự kiện' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminEventsPage;
