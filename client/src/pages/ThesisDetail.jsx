import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { thesisService } from '../services/api';

const ThesisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [thesis, setThesis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const user = JSON.parse(localStorage.getItem('user') || '{"role": "Student"}');

  useEffect(() => {
    fetchThesis();
  }, [id]);

  const fetchThesis = async () => {
    try {
      const { data } = await thesisService.getById(id);
      setThesis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px]">Đang tải chi tiết sáng kiến...</p>
    </div>
  );

  if (!thesis) return <div className="p-8">Không tìm thấy sáng kiến.</div>;

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
        <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Home</button>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <button onClick={() => navigate('/theses')} className="hover:text-primary transition-colors">Danh sách sáng kiến</button>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary">Chi tiết sáng kiến</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Details */}
        <div className="flex-1 space-y-8">
          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant shadow-sm relative overflow-hidden">
             {/* Status Header */}
            <div className="absolute top-0 right-0 px-6 py-2 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest rounded-bl-2xl shadow-md">
              {thesis.status}
            </div>

            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl">description</span>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-black text-on-surface leading-tight mb-2">{thesis.title}</h1>
                <div className="flex flex-wrap gap-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">person</span>
                    {thesis.studentName}
                  </div>
                  <span className="w-1 h-1 bg-outline-variant rounded-full mt-1.5"></span>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">business</span>
                    {thesis.department}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-outline-variant/30">
              <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-4">Mô tả sáng kiến</h3>
              <p className="text-on-surface leading-relaxed whitespace-pre-wrap font-medium">
                {thesis.description || "Chưa có mô tả chi tiết cho sáng kiến này."}
              </p>
            </div>
          </div>

          {/* Gemini AI Analysis Section */}
          <div className="bg-surface-container-low rounded-3xl p-8 border border-primary/20 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-primary">auto_awesome</span>
            </div>
            
            <div className="flex items-center gap-2 text-primary mb-6">
              <span className="material-symbols-outlined">auto_awesome</span>
              <h2 className="text-sm font-black uppercase tracking-[0.2em]">Phân tích thông minh bởi Gemini AI</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 relative z-10">
              <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-primary/5">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Tóm tắt nội dung</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Dựa trên bản thảo, Gemini nhận thấy sáng kiến này tập trung vào việc tối ưu hóa quy trình quản lý bằng cách sử dụng các thuật toán máy học hiện đại. Đề tài có tính ứng dụng cao trong môi trường giáo dục đại học.
                </p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-primary/5">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Điểm mạnh & Gợi ý</h4>
                <ul className="text-xs text-on-surface-variant space-y-2">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span> 
                    Sử dụng tập dữ liệu thực tế tại UEF.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span> 
                    Gợi ý: Cần bổ sung thêm phần so sánh với các phương pháp truyền thống.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Grading Card (For Advisors) */}
          {user.role === 'Advisor' && (
            <div className="bg-surface-container-highest rounded-3xl p-6 border border-primary/20 shadow-lg">
              <h3 className="text-sm font-black text-on-surface uppercase tracking-widest mb-4">Hành động chuyên môn</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl border border-outline-variant">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Điểm số hiện tại</label>
                  <div className="text-3xl font-black text-primary">
                    {thesis.latestScore?.toFixed(1) || '--'}
                  </div>
                </div>
                <button className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                  Nhập điểm & Nhận xét
                </button>
                <button className="w-full py-4 bg-white text-on-surface border border-outline-variant rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-surface-container-low transition-all">
                  Yêu cầu chỉnh sửa
                </button>
              </div>
            </div>
          )}

          {/* Student Info Card */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant shadow-sm">
            <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4">Thông tin tác giả</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-surface-container-high rounded-full overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${thesis.studentName}&background=8c000e&color=fff`} alt="student" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">{thesis.studentName}</p>
                <p className="text-[10px] text-on-surface-variant font-medium uppercase">{thesis.studentId || 'MS-2024-X'}</p>
              </div>
            </div>
            <button className="w-full py-3 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary/5 rounded-xl border border-primary/10 transition-all">
              Xem trang cá nhân
            </button>
          </div>

          {/* Timeline */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant shadow-sm">
            <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4">Tiến độ xử lý</h3>
            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/30">
              <div className="flex gap-4 relative">
                <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center relative z-10 shadow-md">
                  <span className="material-symbols-outlined text-xs">done</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">Đã gửi bản thảo</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">10/10/2024</p>
                </div>
              </div>
              <div className="flex gap-4 relative">
                <div className="w-6 h-6 rounded-full bg-outline-variant text-on-surface-variant flex items-center justify-center relative z-10">
                  <span className="material-symbols-outlined text-xs">pending</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant">Hội đồng đang đánh giá</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">Đang thực hiện</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThesisDetail;
