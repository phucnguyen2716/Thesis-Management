import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { thesisService } from '../../services/api';
import { getAdminUsers } from '../../utils/adminStore';

const CATEGORY_MAP = {
  project: { code: 'Project', title: 'Quản lý đồ án' },
  topic:   { code: 'Topic',   title: 'Quản lý chuyên đề' },
  thesis:  { code: 'Thesis',  title: 'Quản lý khóa luận' },
};

const MAJOR_DISPLAY = {
  ai:         'Trí tuệ nhân tạo',
  networking: 'Mạng máy tính',
  systems:    'Hệ thống thông tin DN',
  security:   'An toàn không gian mạng',
};

// Danh sách môn học theo chuyên ngành (chỉ dùng cho Đồ án)
const SUBJECTS_BY_MAJOR = {
  ai: [
    { name: 'Máy học',                                        code: 'ITE1173E' },
    { name: 'Phát triển ứng dụng trí tuệ nhân tạo',          code: 'ITE1174E' },
    { name: 'Đồ án chuyên ngành trí tuệ nhân tạo',           code: 'ITE1491'  },
    { name: 'Khai thác dữ liệu và ứng dụng',                 code: 'ITE1176E' },
    { name: 'Thị giác máy tính',                              code: 'ITE1181E' },
  ],
  networking: [
    { name: 'Mạng máy tính nâng cao',                        code: 'ITE1235E' },
    { name: 'Thiết kế mạng máy tính',                        code: 'ITE1267E' },
    { name: 'Lập trình mạng máy tính',                       code: 'ITE1255E' },
    { name: 'Quản trị mạng',                                  code: 'ITE1241E' },
    { name: 'Đồ án chuyên ngành mạng máy tính',              code: 'ITE1489'  },
  ],
  systems: [
    { name: 'Cơ sở dữ liệu nâng cao',                        code: 'ITE1224E' },
    { name: 'Hoạch định nguồn nhân lực doanh nghiệp',        code: 'ITE1285E' },
    { name: 'Hệ thống thông tin quản lý',                    code: 'ITE1129E' },
    { name: 'Phân tích nghiệp vụ kinh doanh',                code: 'ITE1284E' },
    { name: 'Đồ án chuyên ngành hệ thống thông tin DN',      code: 'ITE1488'  },
  ],
  security: [
    { name: 'An toàn thông tin cho ứng dụng web',            code: 'ITE1268E' },
    { name: 'An toàn hệ thống mạng máy tính',                code: 'ITE1232E' },
    { name: 'Phân tích và đánh giá an toàn thông tin',       code: 'ITE1239E' },
    { name: 'Điều tra số',                                    code: 'ITE1258E' },
    { name: 'Đồ án chuyên ngành an toàn không gian mạng',    code: 'ITE1490'  },
  ],
};

const STATUS_BADGES = {
  Pending:    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  InProgress: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  Submitted:  'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  Approved:   'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  Rejected:   'bg-red-500/20 text-red-400 border border-red-500/30',
  Revision:   'bg-orange-500/20 text-orange-400 border border-orange-500/30',
};

const emptyForm = (categoryCode) => ({
  title: '',
  description: '',
  major: 'ai',
  subject: '',
  subjectCode: '',
  category: categoryCode,
  studentId: '',
  advisorId: '',
  status: 'Pending',
});

// ─── Drive Sync Progress Popup ────────────────────────────────────────────────
const DriveSyncModal = ({ steps, onClose }) => {
  const allDone = steps.length > 0 && steps.every(s => s.done || s.error);
  const hasError = steps.some(s => s.error);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${allDone && !hasError ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
            <span className={`material-symbols-outlined text-lg ${allDone && !hasError ? 'text-emerald-400' : 'text-amber-400'} ${!allDone ? 'animate-spin' : ''}`}>
              {allDone && !hasError ? 'cloud_done' : allDone && hasError ? 'error' : 'cloud_sync'}
            </span>
          </div>
          <div>
            <p className="text-sm font-black text-white uppercase tracking-wider">Đồng bộ Google Drive</p>
            <p className="text-[10px] text-slate-400">
              {allDone && !hasError ? 'Hoàn thành!' : allDone && hasError ? 'Có lỗi xảy ra' : 'Đang xử lý...'}
            </p>
          </div>
        </div>
        {/* Steps */}
        <div className="px-6 py-5 space-y-3 max-h-80 overflow-y-auto">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                step.error ? 'bg-red-500/20' : step.done ? 'bg-emerald-500/20' : 'bg-slate-700'
              }`}>
                {step.error ? (
                  <span className="material-symbols-outlined text-xs text-red-400">close</span>
                ) : step.done ? (
                  <span className="material-symbols-outlined text-xs text-emerald-400">check</span>
                ) : step.active ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold leading-snug ${
                  step.error ? 'text-red-400' : step.done ? 'text-emerald-300' : step.active ? 'text-white' : 'text-slate-500'
                }`}>{step.label}</p>
                {step.detail && (
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">{step.detail}</p>
                )}
              </div>
            </div>
          ))}
          {steps.length === 0 && (
            <div className="py-4 text-center">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Đang kết nối Google Drive...</p>
            </div>
          )}
        </div>
        {allDone && (
          <div className="px-6 py-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-colors"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminThesesPage = () => {
  const { category } = useParams();
  const catConfig = CATEGORY_MAP[category] || CATEGORY_MAP.project;
  const isProject = catConfig.code === 'Project';

  const [theses, setTheses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('all');

  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm(catConfig.code));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Drive sync popup
  const [driveModal, setDriveModal] = useState(false);
  const [driveSteps, setDriveSteps] = useState([]);

  const MAJORS_SYNC = [
    { name: 'Trí tuệ nhân tạo',       subjects: 5 },
    { name: 'Mạng máy tính',           subjects: 5 },
    { name: 'Hệ thống thông tin DN',   subjects: 5 },
    { name: 'An toàn không gian mạng', subjects: 5 },
  ];

  const handleSyncDrive = async () => {
    setDriveSteps([]);
    setDriveModal(true);
    try {
      // Bước 1: Kết nối
      setDriveSteps([{ label: 'Kết nối Google Drive API...', detail: 'Xác thực service account credentials', active: true, done: false, error: false }]);
      await new Promise(r => setTimeout(r, 400));

      // Bước 2: Root folder
      setDriveSteps(prev => [
        ...prev.map((s, i) => i === 0 ? { ...s, done: true, active: false } : s),
        { label: 'Kiểm tra thư mục gốc CourseProjectStorage...', detail: 'Tạo nếu chưa tồn tại', active: true, done: false, error: false },
      ]);
      await new Promise(r => setTimeout(r, 300));

      // Gọi API backend — tạo toàn bộ 4 chuyên ngành × 5 học phần
      const syncPromise = thesisService.syncDrive(catConfig.code);

      // Hiển thị progress từng chuyên ngành trong khi chờ
      setDriveSteps(prev => prev.map((s, i) => i === 1 ? { ...s, done: true, active: false } : s));
      for (const major of MAJORS_SYNC) {
        setDriveSteps(prev => [
          ...prev,
          { label: `📁 ${major.name}`, detail: `Tạo ${major.subjects} thư mục học phần...`, active: true, done: false, error: false },
        ]);
        await new Promise(r => setTimeout(r, 350));
        setDriveSteps(prev => prev.map((s, i) => i === prev.length - 1 ? { ...s, done: true, active: false } : s));
      }

      // Chờ backend hoàn tất thực sự
      await syncPromise;

      setDriveSteps(prev => [
        ...prev,
        { label: '✅ Đồng bộ hoàn tất!', detail: '20 thư mục học phần đã được tạo/kiểm tra trên Drive', active: false, done: true, error: false },
      ]);
      loadTheses();
    } catch (err) {
      console.error('Error syncing Drive:', err);
      setDriveSteps(prev => [
        ...prev,
        { label: 'Lỗi đồng bộ', detail: err.response?.data?.message || err.message || 'Lỗi kết nối', active: false, done: false, error: true },
      ]);
    }
  };

  const students = useMemo(() => Array.isArray(users) ? users.filter(u => u.role === 'Student') : [], [users]);
  const advisors = useMemo(() => Array.isArray(users) ? users.filter(u => u.role === 'Advisor') : [], [users]);

  // Subjects available based on currently selected major (only for Project)
  const subjectsForMajor = useMemo(() => SUBJECTS_BY_MAJOR[form.major] || [], [form.major]);

  const loadUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    }
  };

  const loadTheses = async () => {
    setLoading(true);
    try {
      const res = await thesisService.getAll({
        page,
        pageSize,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: catConfig.code,
      });
      let items = res.data.items || [];
      if (majorFilter !== 'all') items = items.filter(t => t.major === majorFilter);
      setTheses(items);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error('Error loading theses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { setPage(1); loadTheses(); }, [category, search, statusFilter, majorFilter]);
  useEffect(() => { loadTheses(); }, [page]);

  const handleOpenCreate = () => {
    setForm(emptyForm(catConfig.code));
    setError('');
    setModal({ mode: 'create' });
  };

  const handleOpenEdit = (thesis) => {
    setForm({
      title:       thesis.title,
      description: thesis.description || '',
      major:       thesis.major || 'ai',
      subject:     thesis.subject || '',
      subjectCode: thesis.subjectCode || '',
      category:    thesis.category || catConfig.code,
      studentId:   thesis.studentId,
      studentName: thesis.studentName || '',
      advisorId:   thesis.advisorId || '',
      status:      thesis.status || 'Pending',
    });
    setError('');
    setModal({ mode: 'edit', id: thesis.id });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Tiêu đề không được để trống.'); return; }
    if (!form.studentId)    { setError('Vui lòng chọn sinh viên thực hiện.'); return; }
    if (isProject && !form.subject) { setError('Vui lòng chọn học phần.'); return; }

    setSaving(true);
    try {
      const payload = {
        title:       form.title,
        description: form.description,
        major:       form.major,
        subject:     isProject ? form.subject : '',
        subjectCode: isProject ? form.subjectCode : '',
        category:    form.category,
        studentId:   parseInt(form.studentId),
        advisorId:   form.advisorId ? parseInt(form.advisorId) : null,
        status:      form.status,
      };
      if (modal.mode === 'create') {
        await thesisService.create(payload);
      } else {
        await thesisService.update(modal.id, payload);
      }
      setModal(null);
      loadTheses();
    } catch (err) {
      console.error('Error saving thesis:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu đề tài.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đề tài này?')) return;
    try {
      await thesisService.delete(id);
      loadTheses();
    } catch (err) {
      console.error('Error deleting thesis:', err);
      alert('Không thể xóa đề tài này.');
    }
  };

  const setFormField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // When major changes in Project form, reset subject
  const handleMajorChange = (newMajor) => {
    setForm(prev => ({ ...prev, major: newMajor, subject: '', subjectCode: '' }));
  };

  // When subject selected in Project form, auto-fill name + code
  const handleSubjectSelect = (subjectName) => {
    const found = subjectsForMajor.find(s => s.name === subjectName);
    setForm(prev => ({
      ...prev,
      subject:     subjectName,
      subjectCode: found ? found.code : '',
    }));
  };

  return (
    <div className="max-w-6xl space-y-5">
      {/* Drive Sync Progress Modal */}
      {driveModal && <DriveSyncModal steps={driveSteps} onClose={() => setDriveModal(false)} />}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{catConfig.title}</h1>
          <p className="text-slate-400 text-sm">
            Quản lý danh sách, phân công giảng viên & trạng thái duyệt đề tài
          </p>
        </div>
        <div className="flex gap-2">
          {isProject && (
            <button
              type="button"
              onClick={handleSyncDrive}
              className="px-4 py-2 rounded-lg border border-emerald-700/50 hover:bg-emerald-900/30 text-emerald-400 hover:text-emerald-300 text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">cloud_sync</span>
              Lưu Drive
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase transition-colors"
          >
            + Thêm đề tài mới
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400">{error}</div>
      )}

      {/* Filter panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900">
        <label className="text-[10px] font-bold text-slate-500 uppercase sm:col-span-2 lg:col-span-1">
          Tìm kiếm
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tên đề tài, tên sinh viên..."
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
          />
        </label>
  
        <label className="text-[10px] font-bold text-slate-500 uppercase">
          Chuyên ngành
          <select value={majorFilter} onChange={e => setMajorFilter(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none">
            <option value="all">Tất cả ngành</option>
            {Object.entries(MAJOR_DISPLAY).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button type="button"
            onClick={() => { setSearch(''); setStatusFilter('all'); setMajorFilter('all'); }}
            className="w-full py-2 rounded-lg border border-slate-600 hover:border-slate-500 text-slate-300 text-xs font-bold transition-colors">
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Đang tải danh sách...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="text-left p-4">Thông tin đề tài</th>
                  <th className="text-left p-4">Sinh viên thực hiện</th>
                  <th className="text-left p-4">GV Hướng dẫn</th>
                  <th className="text-left p-4">Ngành / Học phần</th>
                  <th className="text-left p-4">Trạng thái</th>
                  <th className="text-right p-4">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {theses.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 max-w-sm">
                      <div className="font-bold text-white leading-snug">{t.title}</div>
                      {t.description && <div className="text-xs text-slate-400 mt-1 line-clamp-1">{t.description}</div>}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{t.studentName}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{t.studentCode || '—'}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{t.advisorName || '—'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-300 font-semibold">{MAJOR_DISPLAY[t.major] || t.major}</div>
                      {t.subject && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {t.subject} {t.subjectCode && `(${t.subjectCode})`}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${STATUS_BADGES[t.status] || 'bg-slate-700 text-slate-300'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1 whitespace-nowrap">
                      <button type="button" onClick={() => handleOpenEdit(t)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors">
                        Sửa
                      </button>
                      <button type="button" onClick={() => handleDelete(t.id)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-red-950/40 hover:bg-red-900/30 text-red-400 transition-colors">
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {theses.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-semibold">Không tìm thấy đề tài nào phù hợp.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">Hiển thị {theses.length} / {totalCount} kết quả</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-50">
              Trang trước
            </button>
            <button disabled={page * pageSize >= totalCount} onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-50">
              Trang sau
            </button>
          </div>
        </div>
      )}

      {/* Modal create/edit */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form onSubmit={handleSave}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto text-left shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-base font-black uppercase tracking-wider text-amber-400">
                {modal.mode === 'create' ? 'Tạo đề tài mới' : 'Chỉnh sửa đề tài'}
              </h2>
              <button type="button" onClick={() => setModal(null)}
                className="material-symbols-outlined text-slate-400 hover:text-white">close</button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400">{error}</div>
            )}

            <div className="space-y-4">
              {/* Tiêu đề */}
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Tên đề tài *
                <input required value={form.title} onChange={e => setFormField('title', e.target.value)}
                  placeholder="Nhập tiêu đề đầy đủ..."
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500" />
              </label>

              {/* Mô tả */}
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Tóm tắt & mô tả
                <textarea rows={3} value={form.description} onChange={e => setFormField('description', e.target.value)}
                  placeholder="Tóm tắt ngắn gọn nội dung..."
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500 resize-none" />
              </label>

              {/* Sinh viên + Giảng viên */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Sinh viên thực hiện *
                  {modal.mode === 'edit' ? (
                    <div className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 text-xs cursor-not-allowed">
                      {form.studentName || `ID: ${form.studentId}`}
                      <span className="ml-2 text-[10px] text-slate-500">(không thay đổi)</span>
                    </div>
                  ) : (
                    <select required value={form.studentId} onChange={e => setFormField('studentId', e.target.value)}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                      <option value="">-- Chọn sinh viên --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.fullName} ({s.studentId || s.email})</option>
                      ))}
                    </select>
                  )}
                </label>

                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Giảng viên hướng dẫn
                  <select value={form.advisorId} onChange={e => setFormField('advisorId', e.target.value)}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                    <option value="">-- Chưa chỉ định --</option>
                    {advisors.map(a => (
                      <option key={a.id} value={a.id}>{a.fullName}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Chuyên ngành */}
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Chuyên ngành
                <select value={form.major} onChange={e => handleMajorChange(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                  {Object.entries(MAJOR_DISPLAY).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>

              {/* Học phần — CHỈ HIỆN VỚI ĐỒ ÁN */}
              {isProject && (
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-400/80 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">menu_book</span>
                    Học phần *
                  </p>
                  <select
                    required={isProject}
                    value={form.subject}
                    onChange={e => handleSubjectSelect(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Chọn học phần --</option>
                    {subjectsForMajor.map(s => (
                      <option key={s.code} value={s.name}>{s.name} — {s.code}</option>
                    ))}
                  </select>
                  {form.subjectCode && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Mã học phần:</span>
                      <span className="text-[11px] font-black font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        {form.subjectCode}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button type="submit" disabled={saving}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-wider text-xs transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
                {saving ? 'Đang lưu...' : 'Lưu lại'}
              </button>
              <button type="button" onClick={() => setModal(null)}
                className="flex-1 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-black uppercase tracking-wider text-xs transition-colors">
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminThesesPage;
