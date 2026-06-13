import React, { useEffect, useState } from 'react';
import { getLoginAudit, ensureAdminSeed } from '../../utils/adminStore';

const AdminLoginAuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      const data = await getLoginAudit();
      setLogs(data);
    };
    load();
    window.addEventListener('admin-store-updated', load);
    return () => window.removeEventListener('admin-store-updated', load);
  }, []);

  const shown =
    filter === 'all' ? logs : logs.filter(l => (filter === 'ok' ? l.success : !l.success));

  return (
    <div className="w-full space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Audit đăng nhập</h1>
        <p className="text-slate-400 text-sm">Lịch sử đăng nhập thành công / thất bại</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'ok', label: 'Thành công' },
          { key: 'fail', label: 'Thất bại' },
        ].map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
              filter === f.key ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-500 text-[10px] uppercase">
            <tr>
              <th className="text-left p-3">Thời gian</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Vai trò</th>
              <th className="text-left p-3">Kết quả</th>
              <th className="text-left p-3">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {shown.map(log => (
              <tr key={log.id}>
                <td className="p-3 text-slate-300 whitespace-nowrap">
                  {new Date(log.at).toLocaleString('vi-VN')}
                </td>
                <td className="p-3 text-white font-medium">{log.email}</td>
                <td className="p-3 text-slate-400">{log.role}</td>
                <td className="p-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      log.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {log.success ? 'OK' : 'FAIL'}
                  </span>
                </td>
                <td className="p-3 text-slate-500 text-xs max-w-[200px] truncate">{log.message || '—'}</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Chưa có bản ghi đăng nhập
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLoginAuditPage;
