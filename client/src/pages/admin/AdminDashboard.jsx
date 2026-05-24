import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminUsers, getLoginAudit, ensureAdminSeed } from '../../utils/adminStore';
import { getAllSocialPosts, getPlagiarismFlow, ensureContentSeed } from '../../utils/adminContentStore';
import AdminOverviewCharts from '../../components/admin/AdminOverviewCharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    advisors: 0,
    admins: 0,
    loginsToday: 0,
    socialPosts: 0,
    plagiarismOn: false,
  });

  useEffect(() => {
    ensureAdminSeed();
    ensureContentSeed();
    const refresh = () => {
      const users = getAdminUsers();
      const logs = getLoginAudit();
      const today = new Date().toDateString();
      const flow = getPlagiarismFlow();
      setStats({
        students: users.filter(u => u.role === 'Student' && u.isActive).length,
        advisors: users.filter(u => u.role === 'Advisor' && u.isActive).length,
        admins: users.filter(u => u.role === 'Admin' && u.isActive).length,
        loginsToday: logs.filter(l => new Date(l.at).toDateString() === today).length,
        socialPosts: getAllSocialPosts().filter(p => p.published !== false).length,
        plagiarismOn: flow.enabled,
      });
    };
    refresh();
    window.addEventListener('admin-store-updated', refresh);
    window.addEventListener('admin-content-updated', refresh);
    return () => {
      window.removeEventListener('admin-store-updated', refresh);
      window.removeEventListener('admin-content-updated', refresh);
    };
  }, []);

  const cards = [
    { label: 'Sinh viên', val: stats.students, icon: 'school', to: '/admin/students' },
    { label: 'Giảng viên', val: stats.advisors, icon: 'co_present', to: '/admin/advisors' },
    { label: 'Admin', val: stats.admins, icon: 'admin_panel_settings', to: '/admin/users?tab=Admin' },
    { label: 'Đăng nhập hôm nay', val: stats.loginsToday, icon: 'login', to: '/admin/audit' },
    { label: 'Bài social đã đăng', val: stats.socialPosts, icon: 'campaign', to: '/admin/social' },
    {
      label: 'Kiểm tra đạo văn',
      val: stats.plagiarismOn ? 'Bật' : 'Tắt',
      icon: 'policy',
      to: '/admin/plagiarism',
    },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Tổng quan hệ thống</h1>
        <p className="text-slate-400 text-sm mt-1">Biểu đồ người dùng & audit đăng nhập</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-amber-500/40 transition-colors"
          >
            <span className="material-symbols-outlined text-amber-400 text-2xl">{c.icon}</span>
            <p className="text-2xl font-black text-white mt-2">{c.val}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{c.label}</p>
          </Link>
        ))}
      </div>

      <AdminOverviewCharts />
    </div>
  );
};

export default AdminDashboard;
