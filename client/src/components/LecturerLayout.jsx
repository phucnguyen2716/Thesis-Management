import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LECTURER_ICONS } from '../constants/lecturerIcons';
import { loadLecturerProfile } from '../utils/lecturerProfile';

const NAV_ITEMS = [
  { label: 'Trang chủ', icon: LECTURER_ICONS.home, path: '/lecturer' },
  { label: 'Danh sách đồ án', icon: LECTURER_ICONS.theses, path: '/lecturer/theses' },
  { label: 'Đề xuất sự kiện', icon: 'campaign', path: '/lecturer/propose-event' },
  { label: 'Báo cáo', icon: LECTURER_ICONS.reports, path: '/lecturer/reports' },
  { label: 'Hồ sơ', icon: LECTURER_ICONS.profile, path: '/lecturer/profile' },
  { label: 'Thư viện', icon: LECTURER_ICONS.library, path: '/lecturer/library' },
];

const BOTTOM_NAV = [
  { label: 'Trang chủ', icon: LECTURER_ICONS.home, path: '/lecturer', short: 'Trang chủ' },
  { label: 'Đồ án', icon: LECTURER_ICONS.theses, path: '/lecturer/theses', short: 'Đồ án' },
  { label: 'Sự kiện', icon: 'campaign', path: '/lecturer/propose-event', short: 'Sự kiện' },
  { label: 'Thư viện', icon: LECTURER_ICONS.library, path: '/lecturer/library', short: 'Thư viện' },
  { label: 'Hồ sơ', icon: LECTURER_ICONS.profile, path: '/lecturer/profile', short: 'Hồ sơ' },
  { label: 'Báo cáo', icon: LECTURER_ICONS.reports, path: '/lecturer/reports', short: 'Báo cáo' },
];

const isPathActive = (pathname, path) => {
  if (path === '/lecturer') return pathname === '/lecturer' || pathname === '/lecturer/';
  return pathname === path || pathname.startsWith(`${path}/`);
};

const LecturerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => loadLecturerProfile());
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const refresh = () => setProfile(loadLecturerProfile());
    refresh();
    window.addEventListener('lecturer-profile-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('lecturer-profile-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [location.pathname]);

  const displayName = profile.fullName?.trim() || 'Giảng viên';
  const displayTitle = profile.academicTitle || 'Giảng viên';
  const avatarSrc =
    profile.avatarUrl?.trim() ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7fb] font-sans text-[#111c2d] relative pb-16 md:pb-0">
      <header className="flex justify-between items-center h-16 md:h-[72px] px-4 md:px-8 w-full bg-teal-900 shadow-md border-b border-teal-950/20 sticky top-0 z-50 md:z-[110]">
        <div className="flex items-center gap-3 md:gap-5">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="material-symbols-outlined text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isSidebarOpen ? 'menu_open' : 'menu'}
          </button>
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
            <span
              className="material-symbols-outlined text-white text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {LECTURER_ICONS.brand}
            </span>
            <span className="font-extrabold text-white tracking-tight text-lg">UEF</span>
          </div>
          <div className="hidden sm:block h-6 w-px bg-white/25" />
          <span className="hidden sm:block text-xs font-semibold text-white/90 uppercase tracking-wider">
            Lecturer Portal
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-white/90 hover:bg-white/10 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
          >
            <span className="material-symbols-outlined text-lg">{LECTURER_ICONS.studentPortal}</span>
            Portal sinh viên
          </button>
          <div className="flex items-center gap-2 py-1 pl-1 pr-3 bg-white/10 rounded-full border border-white/10">
            <Link to="/lecturer/profile" className="flex items-center gap-2 hover:opacity-90">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30">
                <img alt="Avatar" className="w-full h-full object-cover" src={avatarSrc} />
              </div>
              <div className="hidden xl:block text-left">
                <span className="text-xs font-bold text-white block leading-tight">{displayName}</span>
                <span className="text-[9px] text-teal-200 font-medium">{displayTitle}</span>
              </div>
            </Link>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white text-white hover:text-teal-900 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Đăng xuất
          </button>
        </div>

        <div className="lg:hidden flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="material-symbols-outlined text-white p-2"
            title="Portal sinh viên"
          >
            {LECTURER_ICONS.studentPortal}
          </button>
          <button type="button" onClick={handleLogout} className="material-symbols-outlined text-white p-2">
            logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 w-full min-w-0 overflow-hidden relative">
        {isSidebarOpen && (
          <div
            className="md:hidden fixed top-16 bottom-16 inset-x-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden
          />
        )}

        <aside
          className={`fixed md:relative top-16 md:top-0 bottom-16 md:bottom-auto left-0 z-45 md:z-[105] flex flex-col bg-white shadow-xl md:shadow-sm transition-[width,transform] duration-300 ease-in-out overflow-hidden ${
            isSidebarOpen
              ? 'translate-x-0 w-[260px] md:min-w-[260px] border-r border-slate-200'
              : '-translate-x-full w-0 min-w-0 md:translate-x-0 md:w-0 md:min-w-0 border-r-0'
          }`}
        >
          <div className="w-[260px] h-full flex flex-col overflow-y-auto shrink-0">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="bg-teal-900 p-1.5 rounded-lg shadow-sm">
                  <span
                    className="material-symbols-outlined text-white text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {LECTURER_ICONS.brand}
                  </span>
                </div>
                <h2 className="text-lg font-black text-teal-900 tracking-tight uppercase">UEF</h2>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 opacity-80">
                Thesis Manager
              </p>
              <p className="text-[10px] text-slate-400">Giảng viên · UEF</p>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-0.5">
              {NAV_ITEMS.map(item => {
                const active = isPathActive(location.pathname, item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                    className={
                      active
                        ? 'flex items-center gap-3 px-4 py-3 bg-teal-50 text-teal-900 font-bold border-r-4 border-teal-800 translate-x-0.5 text-[13px]'
                        : 'flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 font-semibold text-[13px] transition-colors'
                    }
                  >
                    <span
                      className="material-symbols-outlined text-xl"
                      style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 mt-auto">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative overflow-hidden">
                <span className="material-symbols-outlined absolute -right-3 -bottom-3 text-7xl text-teal-900/5">
                  {LECTURER_ICONS.support}
                </span>
                <p className="text-[10px] font-bold text-teal-900 uppercase tracking-widest mb-2">Hỗ trợ</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  BM25, heatmap AI và chấm điểm. Liên hệ phòng QLKH khi cần.
                </p>
                <Link
                  to="/support"
                  onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                  className="mt-3 block text-center w-full py-2 bg-teal-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-teal-950"
                >
                  Liên hệ
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 basis-0 w-full min-w-0 overflow-x-hidden overflow-y-auto pb-20 md:pb-0 bg-[#f4f7fb]">
          <div className="min-h-[calc(100vh-4rem)] w-full px-3 py-4 sm:px-5 md:px-6 lg:px-8 box-border">
            <Outlet />
          </div>

          <footer className="w-full py-8 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center bg-white border-t border-slate-200">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <span className="text-xs font-bold text-slate-600">
                © {new Date().getFullYear()} University of Economics and Finance.
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/lecturer" className="text-[11px] font-semibold text-slate-500 hover:text-teal-800">
                Trang chủ GV
              </Link>
              <Link to="/" className="text-[11px] font-semibold text-slate-500 hover:text-teal-800">
                Portal sinh viên
              </Link>
              <a href="#" className="text-[11px] font-semibold text-slate-500 hover:text-teal-800">
                Liên hệ hỗ trợ
              </a>
            </div>
          </footer>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur border-t border-slate-200 z-50 flex items-center justify-around shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        {BOTTOM_NAV.map(item => {
          const active = isPathActive(location.pathname, item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative ${
                active ? 'text-teal-900 font-bold' : 'text-slate-400'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[7px] uppercase tracking-wide font-bold">
                {item.short || item.label.split(' ')[0]}
              </span>
              {active && <span className="absolute bottom-1 w-5 h-0.5 bg-teal-800 rounded-full" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default LecturerLayout;
