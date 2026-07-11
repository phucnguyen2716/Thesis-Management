import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock, Server, ExternalLink, Activity, Info, RefreshCw } from 'lucide-react';
import { API_URL } from '../../services/api';

const AdminHangfirePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
      setIsAdmin(userData.role === 'Admin');
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const handleOpenDashboard = () => {
    const token = localStorage.getItem('token') || '';
    const dashboardUrl = `${API_URL}/hangfire?token=${encodeURIComponent(token)}`;
    window.open(dashboardUrl, '_blank');
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="text-center max-w-md mx-auto px-6">
          {/* Animated Shield Icon */}
          <div className="relative mx-auto w-28 h-28 mb-8">
            <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-20" />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 flex items-center justify-center shadow-lg">
              <ShieldAlert size={48} className="text-red-500" />
            </div>
          </div>

          {/* Error Code */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 border border-red-200 rounded-full mb-5">
            <Lock size={12} className="text-red-500" />
            <span className="text-[11px] font-black text-red-600 uppercase tracking-widest">403 — Forbidden</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
            Truy cập bị từ chối
          </h1>

          {/* Description */}
          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-2">
            Trang <span className="font-bold text-slate-700">Hangfire Dashboard</span> chỉ dành cho <span className="font-bold text-red-600">Quản trị viên (Admin)</span>.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed mb-8">
            Tài khoản <span className="font-semibold text-slate-600">{user?.fullName || 'của bạn'}</span> ({user?.role || 'Unknown'}) không có quyền truy cập vào khu vực quản trị hệ thống này.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <ArrowLeft size={14} />
              Quay lại
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-[#8C000E] transition-all shadow-md"
            >
              Về Trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-slate-100 bg-white shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
            <Server size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight">Hangfire Server Manager</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Background Job Processing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-bold text-emerald-700 shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Server Active
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col justify-center animate-fadeIn">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8 md:p-10 text-center relative overflow-hidden">
          {/* Decorative background grid */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10">
            {/* Server Pulse Icon */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-25" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 flex items-center justify-center shadow-md">
                <Activity size={40} className="text-emerald-600" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
              Bảng điều khiển tác vụ ngầm Hangfire
            </h1>
            <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed mb-8">
              Hangfire quản lý và giám sát toàn bộ các tác vụ xử lý nền thời gian thực của hệ thống eThesis (Đồng bộ Google Drive, Phân tích đạo văn, và convert tài liệu).
            </p>

            {/* Launch Button */}
            <button
              onClick={handleOpenDashboard}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
            >
              <ExternalLink size={16} />
              Mở Hangfire Dashboard (Tab mới)
            </button>

            {/* Notice block */}
            <div className="mt-8 flex gap-3 p-4 bg-amber-50/60 border border-amber-100 rounded-2xl text-left max-w-xl mx-auto">
              <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-800">Lưu ý về Bảo mật & Cookie:</h4>
                <p className="text-[11px] text-amber-700/90 mt-1 leading-relaxed">
                  Để tuân thủ các chính sách bảo mật mới của trình duyệt Chrome/Edge (chặn Cookie bên thứ ba trong iframe), Hangfire Dashboard cần được mở trong tab mới để lưu giữ phiên đăng nhập của Quản trị viên ổn định và an toàn.
                </p>
              </div>
            </div>

            {/* Job details grid */}
            <div className="mt-10 pt-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                  <RefreshCw size={16} className="text-blue-500" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">Đồng bộ Drive</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Quét và đồng bộ tài liệu từ các thư mục Google Drive về Database của Portal tự động mỗi 1 phút.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
                  <ShieldAlert size={16} className="text-purple-500" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">Kiểm tra đạo văn</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Tự động phân tích ngữ nghĩa văn bản, so khớp cơ sở dữ liệu lớn và trả về kết quả đạo văn.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
                  <Server size={16} className="text-amber-500" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">Media Processing</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Chuyển đổi các định dạng văn bản (Word, Excel) sang PDF chất lượng cao phục vụ đọc trực tuyến.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHangfirePage;
