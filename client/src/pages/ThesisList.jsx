import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { thesisService } from '../services/api';

const StatusBadge = ({ status }) => {
  const styles = {
    'Pending': 'bg-surface-container-high text-on-surface',
    'InProgress': 'bg-secondary-container text-on-secondary-container',
    'Submitted': 'bg-primary-container text-on-primary-container',
    'Approved': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    'Rejected': 'bg-error-container text-on-error-container',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
};

const ThesisList = () => {
  const [theses, setTheses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [previewThesis, setPreviewThesis] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleOpenPreview = (thesis) => {
    setPreviewThesis({
      id: thesis.id,
      title: thesis.title,
      studentName: thesis.studentName || thesis.student || "Sinh viên",
      advisorName: thesis.advisorName || thesis.advisor || "Chưa phân công",
      year: thesis.year || "2024",
      department: thesis.department || "Khoa học Công nghệ",
      similarity: thesis.similarity || "12%",
      similarityLevel: thesis.similarityLevel || (parseFloat(thesis.similarity) > 20 ? "high" : "safe"),
      description: thesis.description || thesis.desc || "Chưa có mô tả chi tiết.",
      tags: thesis.tags || ["#research"]
    });
    setShowPreviewModal(true);
  };

  const user = JSON.parse(localStorage.getItem('user') || '{"role": "Student"}');

  useEffect(() => {
    fetchTheses();
  }, [statusFilter]);

  const fetchTheses = async () => {
    setLoading(true);
    try {
      const { data } = await thesisService.getAll({ 
        search, 
        status: statusFilter || undefined 
      });
      setTheses(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header section matching UEF style */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            <span>Kho lưu trữ dữ liệu</span>
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Danh sách Sáng kiến</h1>
          <p className="text-on-surface-variant font-medium mt-1">Tra cứu và quản lý các đề tài sáng kiến học thuật tại UEF.</p>
        </div>
        {user.role === 'Admin' && (
          <button className="px-8 py-3.5 bg-primary text-on-primary font-black rounded-xl shadow-xl shadow-primary/20 flex items-center gap-2 hover:bg-primary-container transition-all active:scale-95 uppercase tracking-wider text-sm">
            <span className="material-symbols-outlined">add</span>
            Tạo sáng kiến mới
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            type="text" 
            placeholder="Tìm kiếm tiêu đề, tác giả hoặc lĩnh vực..." 
            className="w-full pl-12 pr-6 py-3 bg-surface-container-low border-none rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchTheses()}
          />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select 
            className="flex-1 lg:w-56 px-5 py-3 bg-surface-container-low border-none rounded-xl outline-none text-sm font-bold text-on-surface-variant focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Approved">Đã thông qua</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="Rejected">Không đạt</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Thông tin Sáng kiến</th>
                <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Lĩnh vực</th>
                <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Hội đồng</th>
                <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Trạng thái</th>
                <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Đánh giá</th>
                <th className="px-8 py-5 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : theses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-on-surface-variant font-bold uppercase tracking-widest text-xs">
                    Hiện chưa có sáng kiến nào trong kho lưu trữ.
                  </td>
                </tr>
              ) : theses.map((thesis) => (
                <tr key={thesis.id} className="hover:bg-primary/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-surface-container-high rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all shadow-sm">
                        <span className="material-symbols-outlined text-2xl">description</span>
                      </div>
                      <div>
                        <p className="text-base font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{thesis.title}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                          <span>ID: {thesis.id.toString().padStart(4, '0')}</span>
                          <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                          <span>{thesis.studentName}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider bg-surface-container px-2 py-1 rounded">
                      {thesis.department}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-on-surface-variant italic">
                      {thesis.advisorName || 'Chưa phân công'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <StatusBadge status={thesis.status} />
                  </td>
                  <td className="px-8 py-6">
                    {thesis.latestScore ? (
                      <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm border border-primary/10">
                        {thesis.latestScore.toFixed(1)}
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-outline-variant uppercase tracking-widest">--</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/theses/${thesis.id}`}
                        className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2 w-fit shrink-0"
                      >
                        Chi tiết
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                      <button
                        onClick={() => handleOpenPreview(thesis)}
                        className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all cursor-pointer border-none"
                        title="Xem nhanh"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span>
                      </button>
                      <button
                        onClick={() => window.open(`/theses/${thesis.id}/flipbook`, '_blank')}
                        className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all cursor-pointer border-none"
                        title="Đọc sách 3D"
                      >
                        <span className="material-symbols-outlined text-base">menu_book</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Preview Modal (Glassmorphic UEF Style) */}
      {showPreviewModal && previewThesis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-outline-variant shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-10 relative flex flex-col gap-6">
            
            {/* Close Button */}
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute right-6 top-6 w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-all cursor-pointer text-on-surface-variant border-none bg-transparent"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-surface-container-high text-[8px] font-black uppercase tracking-widest rounded border border-outline-variant/30">
                  #{previewThesis.id}
                </span>
                <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded">
                  {previewThesis.department}
                </span>
                <span className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest bg-surface-container-low px-2 py-0.5 rounded ml-auto">
                  Niên khóa: {previewThesis.year}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-on-surface leading-snug">
                {previewThesis.title}
              </h3>
            </div>

            {/* Content Details Grid */}
            <div className="grid sm:grid-cols-2 gap-4 py-4 border-t border-b border-outline-variant/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/5 text-primary rounded-xl flex items-center justify-center border border-primary/10">
                  <span className="material-symbols-outlined text-base">person</span>
                </div>
                <div>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-0.5">Sinh viên</p>
                  <p className="text-xs font-black text-on-surface">{previewThesis.studentName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-secondary-container/10 text-primary rounded-xl flex items-center justify-center border border-outline-variant/30">
                  <span className="material-symbols-outlined text-base">psychology</span>
                </div>
                <div>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-0.5">Giảng viên HD</p>
                  <p className="text-xs font-black text-on-surface">{previewThesis.advisorName}</p>
                </div>
              </div>
            </div>

            {/* Abstract */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">segment</span> Tóm tắt nội dung
              </h4>
              <p className="text-xs text-on-surface leading-relaxed font-bold italic border-l-2 border-primary/20 pl-3">
                "{previewThesis.description}"
              </p>
            </div>

            {/* Similarity Badge */}
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/25">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  parseFloat(previewThesis.similarity) > 20 ? 'bg-red-50 text-error' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  <span className="material-symbols-outlined text-sm">speed</span>
                </div>
                <div>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-0.5">Chỉ số trùng lắp</p>
                  <p className="text-xs font-black text-on-surface font-sans">Mức độ tương đồng: {previewThesis.similarity}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-md ${
                parseFloat(previewThesis.similarity) > 20 ? 'bg-red-100 text-error' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {parseFloat(previewThesis.similarity) > 20 ? 'Nguy cơ cao' : 'An toàn'}
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 mt-2 flex-col sm:flex-row">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  window.open(`/theses/${previewThesis.id}/flipbook`, '_blank');
                }}
                className="flex-1 py-3.5 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <span className="material-symbols-outlined text-base">menu_book</span>
                Đọc Sách 3D (Flipbook)
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  navigate(`/theses/${previewThesis.id}`, { state: previewThesis });
                }}
                className="py-3.5 px-6 bg-on-surface hover:bg-on-surface-variant text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                Chi tiết đầy đủ
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ThesisList;
