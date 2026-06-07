import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
const COLORS = ['#f59e0b', '#38bdf8', '#a78bfa', '#34d399', '#f87171'];

const tooltipStyle = {
  borderRadius: '8px',
  border: '1px solid #334155',
  background: '#0f172a',
  color: '#f8fafc',
  fontSize: '12px',
};

const AdminOverviewCharts = ({ users = [], logs = [] }) => {
  const rolePie = useMemo(
    () => [
      { name: 'Sinh viên', value: users.filter(u => u.role === 'Student').length },
      { name: 'Giảng viên', value: users.filter(u => u.role === 'Advisor').length },
      { name: 'Admin', value: users.filter(u => u.role === 'Admin').length },
    ],
    [users]
  );

  const loginBars = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const label = d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit' });
      const count = logs.filter(l => new Date(l.at).toDateString() === key).length;
      const ok = logs.filter(
        l => new Date(l.at).toDateString() === key && l.success
      ).length;
      days.push({ label, total: count, success: ok, fail: count - ok });
    }
    return days;
  }, [logs]);

  const activeVsInactive = useMemo(
    () => [
      { name: 'Đang hoạt động', value: users.filter(u => u.isActive).length },
      { name: 'Tắt', value: users.filter(u => !u.isActive).length },
    ],
    [users]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
          Phân bổ vai trò
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={rolePie}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
            >
              {rolePie.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
          Trạng thái tài khoản
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={activeVsInactive} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#64748b" fontSize={10} />
            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={90} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
          Đăng nhập 7 ngày gần nhất
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={loginBars}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
            <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="success" name="Thành công" fill="#34d399" stackId="a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="fail" name="Thất bại" fill="#f87171" stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminOverviewCharts;
