import React from 'react';
import { Link } from 'react-router-dom';
import { MAJORS, SUBMISSIONS } from '../../data/lecturerMockData';
import { getRankedSubmissions } from '../../utils/lecturerRanking';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';
import MajorThesisRanking from '../../components/lecturer/MajorThesisRanking';

const LecturerDashboard = () => {
  const topOverall = getRankedSubmissions(SUBMISSIONS, 'all')[0];
  const majorCount = MAJORS.length;

  const cards = [
    {
      title: 'Danh sách đồ án',
      desc: 'Xem bài nộp và mở phân tích chi tiết.',
      icon: LECTURER_ICONS.theses,
      path: '/lecturer/theses',
      accent: 'bg-slate-700',
    },
    {
      title: 'Báo cáo thống kê',
      desc: 'Biểu đồ thống kê đồ án theo ngành.',
      icon: LECTURER_ICONS.reports,
      path: '/lecturer/reports',
      accent: 'bg-cyan-700',
    },
    {
      title: 'Hồ sơ giảng viên',
      desc: 'Cập nhật thông tin và kho tài liệu.',
      icon: LECTURER_ICONS.profile,
      path: '/lecturer/profile',
      accent: 'bg-teal-700',
    },

  ];

  return (
    <div className="w-full max-w-full min-w-0 animate-in fade-in duration-500 space-y-8">
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 text-white p-6 sm:p-8 md:p-10 shadow-lg">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-teal-200/90 mb-2">
            UEF Lecturer Portal
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Xin chào, Giảng viên</h1>
          <p className="text-sm text-teal-100/90 max-w-lg leading-relaxed">
            Theo dõi đồ án tiêu biểu theo từng ngành và mở phân tích đạo văn khi cần.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 border border-white/15 min-w-[120px]">
              <p className="text-2xl font-bold">{SUBMISSIONS.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-200">Tổng đồ án</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 border border-white/15 min-w-[120px]">
              <p className="text-2xl font-bold">{majorCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-200">Ngành</p>
            </div>
            {topOverall && (
              <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 border border-white/15 min-w-[140px] flex-1 sm:flex-none">
                <p className="text-lg font-bold line-clamp-1">{topOverall.exemplaryScore} điểm</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-200">
                  Tiêu biểu toàn trường
                </p>
              </div>
            )}
          </div>
        </div>
        <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-[100px] sm:text-[120px] text-white/5 pointer-events-none">
          {LECTURER_ICONS.ranking}
        </span>
      </section>

      <MajorThesisRanking />

      <div>
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4">Chức năng</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map(c => (
            <Link
              key={c.path}
              to={c.path}
              className="group bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition-all"
            >
              <div
                className={`w-11 h-11 rounded-xl ${c.accent} flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform`}
              >
                <span className="material-symbols-outlined text-2xl">{c.icon}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">{c.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
              <span className="inline-flex items-center gap-1 mt-4 text-teal-800 text-[10px] font-bold uppercase tracking-wider">
                Mở
                <span className="material-symbols-outlined text-sm">east</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
