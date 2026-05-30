import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminUsers, getLoginAudit, ensureAdminSeed } from '../../utils/adminStore';
import { getAllSocialPosts, getPlagiarismFlow, ensureContentSeed } from '../../utils/adminContentStore';
import AdminOverviewCharts from '../../components/admin/AdminOverviewCharts';

const ensureRequestSeed = () => {
  if (!localStorage.getItem('lecturer_plagiarism_requests')) {
    const mockRequests = [
      {
        id: 'req-1',
        submissionId: 'sub-002',
        title: 'Ứng dụng Blockchain trong quản lý hồ sơ sinh viên',
        student: 'Trần Hoàng Bảo (UEF-2021088)',
        lecturer: 'TS. Nguyễn Minh Trí',
        caseType: 'deep',
        customNote: 'Cần Admin đối chiếu chéo cơ sở dữ liệu khóa luận giấy năm 2021 do nghi ngờ cấu trúc trùng khớp với bài của sinh viên khóa trước.',
        isUrgent: true,
        timestamp: '30/05/2026, 10:15:30',
        isRead: false,
        similarity: 28,
        aiPercent: 11,
        words: 9850,
        sourceCount: 24,
        topSource: 'Blockchain for Academic Records — IEEE 2022',
        topSourcePercent: 14,
        matchExcerpt: '...sử dụng smart contract trên nền tảng Ethereum để xác thực bảng điểm. Các node được vận hành bởi phòng đào tạo...'
      },
      {
        id: 'req-2',
        submissionId: 'sub-003',
        title: 'Phân tích sentiment mạng xã hội về thương hiệu UEF',
        student: 'Lê Thị Cẩm (UEF-2021156)',
        lecturer: 'ThS. Lê Văn Nam',
        caseType: 'ignore',
        customNote: 'Sinh viên trích dẫn đúng biểu đồ và số liệu từ UEF Report 2023 nhưng công cụ đánh dấu trùng lặp, đề nghị phê duyệt đặc cách bỏ qua cảnh báo.',
        isUrgent: false,
        timestamp: '29/05/2026, 16:40:12',
        isRead: true,
        similarity: 45,
        aiPercent: 22,
        words: 11200,
        sourceCount: 31,
        topSource: 'Vietnamese Sentiment Analysis with PhoBERT',
        topSourcePercent: 19,
        matchExcerpt: '...Mô hình PhoBERT được fine-tune trên tập dữ liệu tiếng Việt để phân loại cảm xúc tích cực, trung tính và tiêu cực...'
      }
    ];
    localStorage.setItem('lecturer_plagiarism_requests', JSON.stringify(mockRequests));
  }
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    advisors: 0,
    admins: 0,
    loginsToday: 0,
    socialPosts: 0,
    plagiarismOn: false,
  });
  
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const refresh = () => {
    ensureAdminSeed();
    ensureContentSeed();
    ensureRequestSeed();
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

    const reqs = JSON.parse(localStorage.getItem('lecturer_plagiarism_requests') || '[]');
    // Sort: urgent first, then by read status (unread first), then by id descending
    reqs.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      if (!a.isRead && b.isRead) return -1;
      if (a.isRead && !b.isRead) return 1;
      return b.id.localeCompare(a.id);
    });
    setRequests(reqs);
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

  const handleConfirmRead = (reqId) => {
    const list = JSON.parse(localStorage.getItem('lecturer_plagiarism_requests') || '[]');
    const updated = list.map(r => r.id === reqId ? { ...r, isRead: true } : r);
    localStorage.setItem('lecturer_plagiarism_requests', JSON.stringify(updated));
    refresh();
  };

  const handleViewDetails = (req) => {
    setSelectedRequest(req);
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
  };

  const handlePopupConfirmRead = (reqId) => {
    handleConfirmRead(reqId);
    setSelectedRequest(prev => prev ? { ...prev, isRead: true } : null);
  };

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

      {/* ── Lecturer Plagiarism Requests Section ─────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl space-y-4 animate-in fade-in duration-500">
        <div className="flex justify-between items-center gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-2xl">notifications_active</span>
            <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wider">Yêu cầu xét duyệt Đạo văn từ Giảng viên</h2>
          </div>
          <span className="bg-slate-800 text-amber-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-slate-700">
            {requests.filter(r => !r.isRead).length} Mới
          </span>
        </div>
        
        {requests.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-8 font-medium">Chưa có yêu cầu xét duyệt nào được gửi từ giảng viên.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 font-bold uppercase tracking-wider text-[8px] sm:text-[9px]">
                  <th className="pb-3 pr-2">Thông tin đề tài / Sinh viên</th>
                  <th className="pb-3 px-2">Giảng viên nộp</th>
                  <th className="pb-3 px-2">Loại xử lý</th>
                  <th className="pb-3 px-2">Thông báo</th>
                  <th className="pb-3 pl-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {requests.map(req => (
                  <tr key={req.id} className={`hover:bg-white/[0.01] transition-colors ${!req.isRead ? 'bg-white/[0.02] font-bold' : ''}`}>
                    <td className="py-3.5 pr-2">
                      <div className="flex flex-col max-w-[240px] md:max-w-[340px]">
                        <span className="text-slate-100 font-bold leading-normal truncate block" title={req.title}>{req.title}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Mã SV / Tên: {req.student}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-slate-350">{req.lecturer}</td>
                    <td className="py-3.5 px-2">
                      <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${
                        req.caseType === 'ignore' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        req.caseType === 'deep' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {req.caseType === 'ignore' ? 'Đặc cách' :
                         req.caseType === 'deep' ? 'Quét sâu' : 'Kỷ luật'}
                      </span>
                      {req.isUrgent && (
                        <span className="ml-1.5 px-2 py-0.5 rounded-full text-[7px] font-black uppercase bg-orange-600 text-white animate-pulse">GẤP</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2">
                      {req.isRead ? (
                        <span className="text-slate-500 flex items-center gap-1 text-[10px] font-medium">
                          <span className="material-symbols-outlined text-[13px] text-slate-500">check_circle</span>
                          Đã xác nhận nhận
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold flex items-center gap-1 text-[10px] animate-pulse">
                          <span className="material-symbols-outlined text-[13px] text-amber-400">notifications_active</span>
                          Chưa nhận
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pl-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(req)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Chi tiết
                        </button>
                        
                        {!req.isRead && (
                          <button
                            type="button"
                            onClick={() => handleConfirmRead(req.id)}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            Xác nhận nhận
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminOverviewCharts />

      {/* ── Request Details Modal ─────────────────────────────── */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleCloseDetails}
          />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-300 text-white">
            <div className="p-6 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-400 text-xl">admin_panel_settings</span>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-amber-400">Chi tiết Yêu cầu Đạo văn</h3>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5 tracking-wider">Từ Giảng viên UEF Portal</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleCloseDetails} 
                className="material-symbols-outlined text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                close
              </button>
            </div>
            
            <div className="p-6 space-y-5 text-left">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Tên Đề tài / Đồ án</label>
                <p className="text-xs font-bold text-slate-100 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed">
                  {selectedRequest.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Giảng viên gửi</label>
                  <p className="text-xs font-bold text-slate-200">{selectedRequest.lecturer}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Sinh viên thực hiện</label>
                  <p className="text-xs font-bold text-slate-200">{selectedRequest.student}</p>
                </div>
              </div>

              {/* ── System Plagiarism Details ────────────────────────── */}
              {selectedRequest.similarity !== undefined && (
                <div className="space-y-2 pt-3 border-t border-slate-800/40 animate-in fade-in duration-300">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Thông số Đạo văn &amp; AI hệ thống ghi nhận</label>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-850 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/50 flex flex-col items-center justify-center">
                        <span className={`text-base font-extrabold ${selectedRequest.similarity > 25 ? 'text-red-500' : 'text-amber-500'}`}>
                          {selectedRequest.similarity}%
                        </span>
                        <span className="text-[7px] text-slate-500 uppercase tracking-wider mt-1 font-bold">Trùng lặp (Similarity)</span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/50 flex flex-col items-center justify-center">
                        <span className="text-base font-extrabold text-sky-400">
                          {selectedRequest.aiPercent}%
                        </span>
                        <span className="text-[7px] text-slate-500 uppercase tracking-wider mt-1 font-bold">Do AI tạo (AI-Gen)</span>
                      </div>
                      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/50 flex flex-col items-center justify-center">
                        <span className="text-xs font-extrabold text-slate-300">
                          {selectedRequest.words?.toLocaleString()}
                        </span>
                        <span className="text-[7px] text-slate-500 uppercase tracking-wider mt-1 font-bold">Số từ đã quét</span>
                      </div>
                    </div>
                    
                    <div className="text-[11px] leading-relaxed text-slate-400 space-y-1.5 pt-1.5 border-t border-slate-900">
                      <p><span className="font-bold text-slate-500">Nguồn trùng khớp cao nhất:</span> <span className="text-slate-350 font-semibold">{selectedRequest.topSource}</span> (Trùng {selectedRequest.topSourcePercent}%)</p>
                      {selectedRequest.matchExcerpt && (
                        <div className="mt-2 p-2.5 bg-slate-900/30 border border-slate-800/40 rounded-lg text-[10px] leading-normal text-slate-400 italic">
                          <span className="font-bold text-slate-500 block not-italic mb-1 text-[8px] uppercase tracking-wider">Đoạn văn trùng khớp mẫu:</span>
                          "{selectedRequest.matchExcerpt}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/40">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Thời gian gửi</label>
                  <p className="text-xs font-bold text-slate-300">{selectedRequest.timestamp}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Mức ưu tiên</label>
                  <div>
                    {selectedRequest.isUrgent ? (
                      <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-black bg-rose-600 text-white uppercase tracking-wider">HỎA TỐC / GẤP</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-black bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">Thường</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-800/40">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Tình huống xử lý yêu cầu</label>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                    selectedRequest.caseType === 'ignore' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    selectedRequest.caseType === 'deep' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {selectedRequest.caseType === 'ignore' ? 'Phê duyệt đặc cách (Bỏ qua đạo văn)' :
                     selectedRequest.caseType === 'deep' ? 'Yêu cầu đối chiếu sâu (Deep scan)' : 
                     'Chuyển hội đồng kỷ luật trường'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-800/40">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Lý do &amp; Ghi chú lý giải</label>
                <p className="text-xs text-slate-300 bg-slate-950/30 p-3 rounded-xl border border-slate-800/50 leading-relaxed italic">
                  "{selectedRequest.customNote || 'Không có ghi chú thêm từ giảng viên.'}"
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-bold hover:bg-slate-850 hover:text-white transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                {!selectedRequest.isRead && (
                  <button
                    type="button"
                    onClick={() => handlePopupConfirmRead(selectedRequest.id)}
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md active:scale-95 cursor-pointer"
                  >
                    Xác nhận đã nhận thông báo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
