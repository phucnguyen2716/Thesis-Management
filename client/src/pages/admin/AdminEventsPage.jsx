import React, { useEffect, useMemo, useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────
const STORAGE_KEY = 'adminEvents';

const loadEvents = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveEvents = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('admin-events-updated'));
};

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
  upcoming:  { label: 'Sắp diễn ra', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  ongoing:   { label: 'Đang diễn ra', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  completed: { label: 'Đã kết thúc', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  cancelled: { label: 'Đã hủy',      cls: 'bg-red-100 text-red-800 border-red-200' },
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

// ─────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────
const SEED_EVENTS = [
  {
    id: 'evt-1',
    title: 'Hội thảo Trí tuệ Nhân tạo trong Giáo dục 2025',
    description: 'Hội thảo quốc tế về ứng dụng AI trong đổi mới phương pháp giảng dạy đại học, với sự tham gia của các chuyên gia hàng đầu.',
    eventType: 'Hội thảo',
    location: 'Hội trường A, Cơ sở 1 - UEF',
    startDate: '2025-07-15',
    endDate: '2025-07-16',
    organizer: 'Khoa Công nghệ thông tin',
    contactPhone: '0901234567',
    contactEmail: 'cntt@uef.edu.vn',
    maxParticipants: '200',
    imageUrl: '',
    link: 'https://uef.edu.vn/events/ai-education-2025',
    status: 'upcoming',
    published: true,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'evt-2',
    title: 'Workshop: Kỹ năng viết luận văn khoa học',
    description: 'Hướng dẫn sinh viên phương pháp nghiên cứu, trích dẫn và trình bày luận văn theo chuẩn quốc tế APA/IEEE.',
    eventType: 'Workshop',
    location: 'Phòng Lab 301, Tòa nhà B',
    startDate: '2025-06-20',
    endDate: '2025-06-20',
    organizer: 'PGS.TS. Nguyễn Văn An',
    contactPhone: '0901234567',
    contactEmail: 'nguyen.van.an@uef.edu.vn',
    maxParticipants: '50',
    imageUrl: '',
    link: '',
    status: 'ongoing',
    published: true,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'evt-3',
    title: 'Cuộc thi Lập trình UEF Hackathon 2025',
    description: 'Cuộc thi lập trình 48h dành cho sinh viên toàn trường, với chủ đề "Giải pháp công nghệ cho cộng đồng".',
    eventType: 'Cuộc thi',
    location: 'Sảnh lớn, Cơ sở 2 - UEF',
    startDate: '2025-08-10',
    endDate: '2025-08-12',
    organizer: 'CLB IT & Khoa CNTT',
    contactPhone: '0923456789',
    contactEmail: 'hackathon@uef.edu.vn',
    maxParticipants: '120',
    imageUrl: '',
    link: 'https://uef.edu.vn/hackathon2025',
    status: 'upcoming',
    published: true,
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'evt-4',
    title: 'Seminar: Blockchain và Tương lai Tài chính số',
    description: 'Chuyên đề về công nghệ Blockchain, DeFi và ứng dụng trong ngành tài chính - ngân hàng.',
    eventType: 'Seminar',
    location: 'Online - Microsoft Teams',
    startDate: '2025-05-25',
    endDate: '2025-05-25',
    organizer: 'TS. Trần Thị Bích Ngọc',
    contactPhone: '0912345678',
    contactEmail: 'tran.bich.ngoc@uef.edu.vn',
    maxParticipants: '300',
    imageUrl: '',
    link: 'https://teams.microsoft.com/seminar-blockchain',
    status: 'completed',
    published: true,
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'evt-5',
    title: 'Ngày hội Tuyển dụng UEF Job Fair 2025',
    description: 'Kết nối sinh viên với hơn 50 doanh nghiệp hàng đầu trong lĩnh vực CNTT, Kinh tế và Luật.',
    eventType: 'Tuyển dụng',
    location: 'Sân trường, Cơ sở 1 - UEF',
    startDate: '2025-09-05',
    endDate: '2025-09-05',
    organizer: 'Phòng Quan hệ Doanh nghiệp',
    contactPhone: '0956789012',
    contactEmail: 'career@uef.edu.vn',
    maxParticipants: '500',
    imageUrl: '',
    link: 'https://uef.edu.vn/jobfair2025',
    status: 'upcoming',
    published: true,
    createdAt: Date.now() - 86400000 * 2,
  },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
const AdminEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null); // 'create' | 'edit'
  const [form, setForm] = useState(emptyEvent());
  const [editId, setEditId] = useState(null);
  const [viewEvent, setViewEvent] = useState(null);

  const load = useCallback(() => {
    let list = loadEvents();
    if (list.length === 0) {
      saveEvents(SEED_EVENTS);
      list = SEED_EVENTS;
    }
    setEvents(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
  }, []);

  useEffect(() => {
    load();
    window.addEventListener('admin-events-updated', load);
    return () => window.removeEventListener('admin-events-updated', load);
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

  const handleSave = (e) => {
    e.preventDefault();
    const list = loadEvents();
    if (modal === 'create') {
      const newEvent = {
        ...form,
        id: `evt-${Date.now()}`,
        createdAt: Date.now(),
      };
      list.unshift(newEvent);
    } else {
      const idx = list.findIndex(ev => ev.id === editId);
      if (idx >= 0) list[idx] = { ...list[idx], ...form };
    }
    saveEvents(list);
    setModal(null);
    load();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sự kiện này?')) return;
    const list = loadEvents().filter(ev => ev.id !== id);
    saveEvents(list);
    load();
  };

  const handleTogglePublish = (id) => {
    const list = loadEvents().map(ev =>
      ev.id === id ? { ...ev, published: !ev.published } : ev
    );
    saveEvents(list);
    load();
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return d; }
  };

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Quản lý Sự kiện</h1>
          <p className="text-slate-400 text-sm">
            Tổng cộng {events.length} sự kiện · {filtered.length} hiển thị
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold uppercase hover:bg-amber-400 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Thêm sự kiện
        </button>
      </div>

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
                  <button
                    type="button"
                    onClick={() => setViewEvent(ev)}
                    className="text-left hover:text-amber-400 transition-colors"
                  >
                    <p className="font-bold text-white leading-tight">{ev.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{ev.organizer || '—'}</p>
                  </button>
                </td>
                <td className="p-3 hidden md:table-cell">
                  <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-1 rounded-md">
                    {ev.eventType}
                  </span>
                </td>
                <td className="p-3 hidden lg:table-cell text-slate-400 text-xs">{ev.location || '—'}</td>
                <td className="p-3 text-xs text-slate-400">
                  <p>{formatDate(ev.startDate)}</p>
                  {ev.endDate && ev.endDate !== ev.startDate && (
                    <p className="text-slate-600">→ {formatDate(ev.endDate)}</p>
                  )}
                </td>
                <td className="p-3 text-center">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_MAP[ev.status]?.cls || 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_MAP[ev.status]?.label || ev.status}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(ev.id)}
                    className={`material-symbols-outlined text-lg transition-colors ${ev.published ? 'text-emerald-400' : 'text-slate-600'}`}
                    title={ev.published ? 'Đang hiển thị' : 'Đang ẩn'}
                  >
                    {ev.published ? 'visibility' : 'visibility_off'}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setViewEvent(ev)}
                      className="material-symbols-outlined text-slate-500 hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-lg"
                      title="Xem chi tiết"
                    >
                      visibility
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(ev)}
                      className="material-symbols-outlined text-slate-500 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-lg"
                      title="Chỉnh sửa"
                    >
                      edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ev.id)}
                      className="material-symbols-outlined text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-lg"
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setModal(null)}>
          <form
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-black text-white">
                {modal === 'create' ? 'Thêm sự kiện mới' : 'Chỉnh sửa sự kiện'}
              </h2>
              <button type="button" onClick={() => setModal(null)} className="material-symbols-outlined text-slate-500 hover:text-white p-1">close</button>
            </div>

            <div className="p-5 space-y-4">
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
                onClick={() => setModal(null)}
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
