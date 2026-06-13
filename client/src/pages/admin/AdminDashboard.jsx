import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminUsers, getLoginAudit, ensureAdminSeed } from '../../utils/adminStore';
import { getAllSocialPosts, ensureContentSeed } from '../../utils/adminContentStore';
import { thesisService } from '../../services/api';
import AdminOverviewCharts from '../../components/admin/AdminOverviewCharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    advisors: 0,
    admins: 0,
    loginsToday: 0,
    socialPosts: 0,
    projects: 0,
    topics: 0,
    theses: 0,
  });
  
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      ensureAdminSeed();
      ensureContentSeed();
      
      const fetchedUsers = await getAdminUsers();
      const fetchedLogs = await getLoginAudit();
      setUsers(fetchedUsers);
      setLogs(fetchedLogs);
      
      const today = new Date().toDateString();
      
      // Fetch thesis counts from backend
      let projectsCount = 0;
      let topicsCount = 0;
      let thesesCount = 0;
      try {
        const res = await thesisService.getAll({ page: 1, pageSize: 1000 });
        const items = res.data.items || [];
        projectsCount = items.filter(t => t.category === 'Project').length;
        topicsCount = items.filter(t => t.category === 'Topic').length;
        thesesCount = items.filter(t => t.category === 'Thesis').length;
      } catch (err) {
        console.error("Failed to load theses stats for dashboard", err);
      }

      setStats({
        students: fetchedUsers.filter(u => u.role === 'Student' && u.isActive).length,
        advisors: fetchedUsers.filter(u => u.role === 'Advisor' && u.isActive).length,
        admins: fetchedUsers.filter(u => u.role === 'Admin' && u.isActive).length,
        loginsToday: fetchedLogs.filter(l => new Date(l.at).toDateString() === today).length,
        socialPosts: getAllSocialPosts().filter(p => p.published !== false).length,
        projects: projectsCount,
        topics: topicsCount,
        theses: thesesCount,
      });
    } catch (err) {
      console.error("Dashboard refresh error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    { label: 'Đồ án', val: stats.projects, icon: 'folder_special', to: '/admin/theses/project' },
    { label: 'Chuyên đề', val: stats.topics, icon: 'topic', to: '/admin/theses/topic' },
    { label: 'Khóa luận', val: stats.theses, icon: 'workspace_premium', to: '/admin/theses/thesis' },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Tổng quan hệ thống</h1>
          <p className="text-slate-400 text-sm mt-1">Biểu đồ người dùng & audit đăng nhập</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm animate-spin-slow">refresh</span>
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      <AdminOverviewCharts users={users} logs={logs} />
    </div>
  );
};

export default AdminDashboard;
