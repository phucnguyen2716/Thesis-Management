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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-slate-100 bg-white shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
            <Server size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight">Hangfire Dashboard</h2>
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

      {/* Hangfire iframe */}
      <iframe
        src={`${API_URL}/hangfire?token=${encodeURIComponent(localStorage.getItem('token') || '')}`}
        className="flex-1 w-full border-0"
        title="Hangfire Dashboard"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
    </div>
  );
};

export default AdminHangfirePage;
