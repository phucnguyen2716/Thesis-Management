import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  ensureAdminSeed,
} from '../../utils/adminStore';

const emptyForm = role => ({
  fullName: '',
  email: '',
  role,
  studentId: '',
  department: '',
  phone: '',
  isActive: true,
});

const AdminUsersPage = ({ fixedRole }) => {
  const [searchParams] = useSearchParams();
  const tab = fixedRole || searchParams.get('tab') || 'Student';
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm(tab));

  // Custom alert/confirm/toast states
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const showToastMessage = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ message, onConfirm });
  };
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  const isStudent = tab === 'Student';
  const isAdvisor = tab === 'Advisor';
  const pageTitle = isStudent ? 'Quản lý sinh viên' : isAdvisor ? 'Quản lý giảng viên' : 'Quản lý admin';

  const load = async () => {
    const data = await getAdminUsers();
    setUsers(data);
  };
  useEffect(() => {
    load();
    window.addEventListener('admin-store-updated', load);
    return () => window.removeEventListener('admin-store-updated', load);
  }, []);

  useEffect(() => {
    setForm(emptyForm(tab));
    setSearch('');
    setStatusFilter('all');
    setDeptFilter('all');
  }, [tab]);

  const departments = useMemo(() => {
    const set = new Set(
      users.filter(u => u.role === tab && u.department).map(u => u.department.trim())
    );
    return ['all', ...Array.from(set).sort()];
  }, [users, tab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      if (u.role !== tab) return false;
      if (statusFilter === 'active' && !u.isActive) return false;
      if (statusFilter === 'inactive' && u.isActive) return false;
      if (deptFilter !== 'all' && (u.department || '') !== deptFilter) return false;
      if (!q) return true;
      return (
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.studentId || '').toLowerCase().includes(q)
      );
    });
  }, [users, tab, search, statusFilter, deptFilter]);

  const openCreate = () => {
    setForm(emptyForm(tab));
    setModal({ mode: 'create' });
  };

  const openEdit = user => {
    setForm({ ...user });
    setModal({ mode: 'edit', id: user.id });
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.fullName?.trim() || !form.email?.trim()) return;
    try {
      if (modal.mode === 'create') {
        await createAdminUser({ ...form, role: tab });
        showToastMessage("success", "Đã thêm người dùng thành công!");
      } else {
        await updateAdminUser(modal.id, form);
        showToastMessage("success", "Đã cập nhật người dùng thành công!");
      }
      setModal(null);
      load();
    } catch (err) {
      console.error(err);
      showToastMessage("error", "Đã xảy ra lỗi khi lưu thông tin.");
    }
  };

  const handleDelete = id => {
    showConfirm('Bạn có chắc muốn xóa người dùng này?', async () => {
      try {
        await deleteAdminUser(id);
        load();
        showToastMessage("success", "Đã xóa người dùng thành công!");
      } catch (err) {
        console.error(err);
        showToastMessage("error", "Đã xảy ra lỗi khi xóa người dùng.");
      }
    });
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{pageTitle}</h1>
          <p className="text-slate-400 text-sm">
            Quản lý · {filtered.length}/{users.filter(u => u.role === tab).length} hiển thị
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold uppercase"
        >
          + Thêm mới
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900">
        <label className="text-[10px] font-bold text-slate-500 uppercase sm:col-span-2 lg:col-span-1">
          Tìm kiếm
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tên, email, mã SV..."
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
          />
        </label>
        <label className="text-[10px] font-bold text-slate-500 uppercase">
          Trạng thái
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã tắt</option>
          </select>
        </label>
        <label className="text-[10px] font-bold text-slate-500 uppercase">
          {isAdvisor ? 'Chức vụ / Chuyên môn' : 'Khoa / Đơn vị'}
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
          >
            {departments.map(d => (
              <option key={d} value={d}>
                {d === 'all' ? (isAdvisor ? 'Tất cả chức vụ' : 'Tất cả khoa') : d}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setDeptFilter('all');
            }}
            className="w-full py-2 rounded-lg border border-slate-600 text-slate-300 text-xs font-bold"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-500 text-[10px] uppercase">
            <tr>
              <th className="text-left p-3">Họ tên</th>
              <th className="text-left p-3">Email</th>
              {isStudent && <th className="text-left p-3">Mã SV</th>}
              <th className="text-left p-3">{isAdvisor ? 'Chức vụ / Chuyên môn' : 'Khoa'}</th>
              <th className="text-left p-3">SĐT</th>
              <th className="text-left p-3">TT</th>
              <th className="text-right p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-800/50">
                <td className="p-3 font-semibold text-white">{u.fullName}</td>
                <td className="p-3 text-slate-300">{u.email}</td>
                {isStudent && <td className="p-3 text-slate-400">{u.studentId || '—'}</td>}
                <td className="p-3 text-slate-400">{u.department || '—'}</td>
                <td className="p-3 text-slate-400">{u.phone || '—'}</td>
                <td className="p-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Off'}
                  </span>
                </td>
                <td className="p-3 text-right space-x-1">
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-slate-700 text-white"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(u.id)}
                    className="px-2 py-1 rounded text-[10px] font-bold bg-red-900/50 text-red-300"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Không có kết quả phù hợp bộ lọc
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-bold text-white">
              {modal.mode === 'create' ? 'Thêm mới' : 'Chỉnh sửa'}
            </h2>
            <label className="block text-xs font-semibold text-slate-400">
              Họ tên *
              <input
                required
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-400">
              Email *
              <input
                required
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </label>
            {isStudent && (
              <label className="block text-xs font-semibold text-slate-400">
                Mã sinh viên
                <input
                  value={form.studentId}
                  onChange={e => set('studentId', e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </label>
            )}
            <label className="block text-xs font-semibold text-slate-400">
              {isAdvisor ? 'Chức vụ / Chuyên môn' : 'Khoa / Đơn vị'}
              <input
                value={form.department}
                onChange={e => set('department', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-400">
              Số điện thoại
              <input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => set('isActive', e.target.checked)}
              />
              Đang hoạt động
            </label>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold">
                Lưu
              </button>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 font-bold"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] p-4 rounded-2xl border flex items-center gap-3 shadow-xl bg-slate-900 border-slate-800 text-white animate-fade-in transition-all">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <span className={`material-symbols-outlined text-lg ${toast.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
          </div>
          <span className="text-xs font-black text-white tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-[2rem] shadow-2xl max-w-sm w-full p-6 animate-in scale-in-95 duration-200 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <span className="material-symbols-outlined text-2xl">
                warning
              </span>
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
              Xác nhận hành động
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold mb-6">
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all shadow"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
