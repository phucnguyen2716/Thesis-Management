import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const NAV = [
  { label: 'Tổng quan', icon: 'dashboard', path: '/admin' },
  { label: 'Sinh viên', icon: 'school', path: '/admin/students' },
  { label: 'Giảng viên', icon: 'co_present', path: '/admin/advisors' },
  { label: 'Social media', icon: 'campaign', path: '/admin/social' },
  { label: 'Thư viện', icon: 'local_library', path: '/admin/library' },
  { label: 'Flow đạo văn', icon: 'policy', path: '/admin/plagiarism' },
  { label: 'Audit login', icon: 'history', path: '/admin/audit' },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = path =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="material-symbols-outlined p-2 rounded-lg hover:bg-slate-800"
          >
            menu
          </button>
          <span className="font-black text-sm tracking-wide text-amber-400">UEF Admin Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800"
          >
            Portal SV
          </button>
          <button
            type="button"
            onClick={logout}
            className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {sidebarOpen && (
          <aside className="w-56 border-r border-slate-800 bg-slate-900 p-3 shrink-0 hidden md:block">
            <nav className="space-y-1">
              {NAV.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive(item.path) ? 'bg-amber-500/15 text-amber-400' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        )}

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <nav className="md:hidden border-t border-slate-800 bg-slate-900 flex justify-around py-2">
        {NAV.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center text-[9px] font-bold uppercase ${
              isActive(item.path) ? 'text-amber-400' : 'text-slate-500'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            {item.label.split(' ')[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default AdminLayout;
