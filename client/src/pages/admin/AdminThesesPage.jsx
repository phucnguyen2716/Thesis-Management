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
  programming: 'Kỹ thuật lập trình',
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
  programming: [
    { name: 'Lập trình Front-End',                          code: 'SWE1208E' },
    { name: 'Mạng máy tính và bảo mật thông tin',             code: 'SWE1204E' },
    { name: 'Phân tích và thiết kế phần mềm',                code: 'SWE1107E' },
    { name: 'Lập trình ứng dụng',                            code: 'SWE1205E' },
    { name: 'Phát triển ứng dụng Full-Stack',                code: 'SWE1209E' },
    { name: 'Công cụ phát triển ứng dụng',                    code: 'SWE1210E' },
    { name: 'Đồ án kỹ thuật phần mềm',                        code: 'SWE1422'  },
    { name: 'Đảm bảo chất lượng phần mềm',                   code: 'SWE1111E' },
    { name: 'Kiểm thử phần mềm',                             code: 'SWE1212E' },
    { name: 'Quản lý dự án kiểm thử',                        code: 'SWE1114E' },
    { name: 'Công cụ và kỹ thuật kiểm thử tự động',            code: 'SWE1213E' },
    { name: 'Đồ án chuyên ngành kiểm thử phần mềm',           code: 'SWE1415'  },
    { name: 'Phát triển ứng dụng đa nền tảng',                code: 'SWE1216E' },
    { name: 'Phát triển Game',                               code: 'ITE1279E' },
    { name: 'Phát triển và vận hành hệ thống công nghệ thông tin', code: 'SWE1219E' },
    { name: 'Phát triển ứng dụng web nâng cao',              code: 'SWE1218E' },
    { name: 'Đồ án chuyên ngành phát triển ứng dụng',         code: 'SWE1420'  },
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

// ─── Google Drive + Lookup panel (Hangfire tự đồng bộ) ───────────────────────
const DriveLookupPanel = ({ status, onRefresh, onTestConnection, testingConnection }) => (
  <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 space-y-3">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-emerald-400">cloud_sync</span>
        </div>
        <div>
          <p className="text-sm font-black text-emerald-300 uppercase tracking-wider">Google Drive → Lookup</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tự seed khi khởi động backend · Hangfire sync mỗi 1 phút · Tra cứu tại <span className="text-emerald-400/80">/lookup?type=do-an</span>
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button type="button" onClick={onTestConnection} disabled={testingConnection}
          className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-[10px] font-bold uppercase transition-colors shrink-0 flex items-center gap-1.5">
          {testingConnection && <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
          Test Connection
        </button>
        <button type="button" onClick={onRefresh}
          className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-[10px] font-bold uppercase transition-colors shrink-0">
          Làm mới
        </button>
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {[
        { label: 'File trên Drive', value: status?.driveFileCount ?? '—', icon: 'folder' },
        { label: 'Đã sync vào DB', value: status?.dbRecordCount ?? '—', icon: 'database' },
        { label: 'Chu kỳ sync', value: status?.hangfireInterval ?? '1 phút', icon: 'schedule' },
        { label: 'Cập nhật gần nhất', value: status?.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString('vi-VN') : 'Chưa có', icon: 'history' },
      ].map(item => (
        <div key={item.label} className="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2">
          <div className="flex items-center gap-1 text-[9px] text-slate-500 uppercase font-bold">
            <span className="material-symbols-outlined text-[12px]">{item.icon}</span>
            {item.label}
          </div>
          <p className="text-xs font-bold text-white mt-1 truncate">{item.value}</p>
        </div>
      ))}
    </div>
    <p className="text-[10px] text-slate-500 leading-relaxed">
      Cấu trúc: <code className="text-emerald-400/80">CourseProjectStorage / Kỹ thuật lập trình / Phát triển Game (ITE1279E) / Nhom01_Game2D_SVxxxx / files</code>
      {' '}— Word tự chuyển PDF qua LibreOffice vào <code className="text-emerald-400/80">temporary_pdf/</code>
    </p>
  </div>
);

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

  const [driveStatus, setDriveStatus] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const { data } = await thesisService.testDriveConnection();
      setTestResult({
        success: data.success,
        message: data.message,
        driveFileName: data.driveFileName,
        driveFileId: data.driveFileId,
        webViewLink: data.webViewLink,
        relativePath: data.relativePath
      });
    } catch (err) {
      console.error(err);
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message
      });
    } finally {
      setTestingConnection(false);
      loadDriveStatus();
    }
  };

  const loadDriveStatus = async () => {
    try {
      const { data } = await thesisService.getDriveStatus();
      setDriveStatus(data);
    } catch (err) {
      console.error('Error loading drive status:', err);
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
  useEffect(() => {
    if (isProject) {
      loadDriveStatus();
      const t = setInterval(loadDriveStatus, 60_000);
      return () => clearInterval(t);
    }
  }, [isProject]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleConnected = params.get('google_connected');
    const oauthError = params.get('error');

    if (googleConnected === 'true') {
      alert('Kết nối Google Drive thành công! Dung lượng lưu trữ của bạn hiện đã được áp dụng.');
      window.history.replaceState({}, document.title, window.location.pathname);
      loadDriveStatus();
    } else if (googleConnected === 'false') {
      alert(`Kết nối Google Drive thất bại: ${oauthError || 'Unknown error'}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
    <div className="w-full space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{catConfig.title}</h1>
          <p className="text-slate-400 text-sm">
            Quản lý danh sách, phân công giảng viên & trạng thái duyệt đề tài
          </p>
        </div>
        <div className="flex gap-2">
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

      {isProject && (
        <DriveLookupPanel 
          status={driveStatus} 
          onRefresh={loadDriveStatus} 
          onTestConnection={handleTestConnection}
          testingConnection={testingConnection}
        />
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

      {/* Modal Connection Test Result */}
      {testResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 text-left shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-base font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <span className="material-symbols-outlined">
                  {testResult.success ? 'check_circle' : 'error'}
                </span>
                Kết quả kiểm tra Drive
              </h2>
              <button type="button" onClick={() => setTestResult(null)}
                className="material-symbols-outlined text-slate-400 hover:text-white">close</button>
            </div>

            <div className="space-y-3">
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                testResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                <span className="material-symbols-outlined shrink-0 mt-0.5">
                  {testResult.success ? 'cloud_done' : 'cloud_off'}
                </span>
                <div>
                  <p className="font-bold text-sm">
                    {testResult.success ? 'Kết nối thành công!' : 'Kết nối thất bại!'}
                  </p>
                  <p className="text-xs mt-1 text-slate-300 text-left whitespace-pre-wrap break-words">
                    {testResult.message}
                  </p>
                </div>
              </div>

              {testResult.success && (
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Tên file test:</span>
                      <span className="text-slate-300 font-mono select-all truncate max-w-[200px]" title={testResult.driveFileName}>
                        {testResult.driveFileName}
                      </span>
                    </div>
                    {testResult.driveFileId && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Drive File ID:</span>
                        <span className="text-slate-300 font-mono select-all truncate max-w-[200px]" title={testResult.driveFileId}>
                          {testResult.driveFileId}
                        </span>
                      </div>
                    )}
                    {testResult.relativePath && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Đường dẫn:</span>
                        <span className="text-slate-300 select-all truncate max-w-[200px]" title={testResult.relativePath}>
                          {testResult.relativePath}
                        </span>
                      </div>
                    )}
                  </div>

                  {testResult.webViewLink && (
                    <a 
                      href={testResult.webViewLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md text-center"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      Mở file trên Google Drive
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setTestResult(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
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
