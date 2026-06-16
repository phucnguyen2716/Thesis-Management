import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { socialService } from '../../services/api';

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
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null); // 'create' | 'edit'
  const [form, setForm] = useState(emptyEvent());
  const [editId, setEditId] = useState(null);
  const [viewEvent, setViewEvent] = useState(null);

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
      } else {
        await socialService.update(editId, payload);
      }
      setModal(null);
      load();
    } catch (err) {
      console.error("Failed to save event", err);
      alert("Đã xảy ra lỗi khi lưu sự kiện.");
    }
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700 flex items-center justify-center">
                      {ev.imageUrl ? (
                        <img src={ev.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-slate-600 text-sm">image</span>
                      )}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setViewEvent(ev)}
                        className="text-left hover:text-amber-400 transition-colors font-bold text-white leading-tight"
                      >
                        {ev.title}
                      </button>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] text-slate-500">{ev.organizer || '—'}</span>
                        {ev.imageUrl && (
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border ${
                            ev.cloudinaryStatus === 'Uploaded' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : ev.cloudinaryStatus === 'Pending' 
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse' 
                              : ev.cloudinaryStatus === 'Failed' 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                              : 'bg-slate-700/50 text-slate-400 border-slate-700'
                          }`}>
                            <span className="material-symbols-outlined text-[8px]">{
                              ev.cloudinaryStatus === 'Uploaded' ? 'cloud_done' : ev.cloudinaryStatus === 'Pending' ? 'sync' : ev.cloudinaryStatus === 'Failed' ? 'cloud_off' : 'cloud'
                            }</span>
                            {ev.cloudinaryStatus === 'Uploaded' ? 'Cloudinary' : ev.cloudinaryStatus === 'Pending' ? 'Đang đẩy...' : ev.cloudinaryStatus === 'Failed' ? 'Lỗi đẩy' : 'Chưa đẩy'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 hidden md:table-cell">
                  <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-1 rounded-md whitespace-nowrap">
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
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${STATUS_MAP[ev.status]?.cls || 'bg-slate-100 text-slate-600'}`}>
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
