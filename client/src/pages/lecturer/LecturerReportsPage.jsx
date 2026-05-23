import React from 'react';
import { Link } from 'react-router-dom';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';
import LecturerReportCharts from '../../components/lecturer/LecturerReportCharts';
import LecturerProfileForm from '../../components/lecturer/LecturerProfileForm';

const LecturerReportsPage = () => {
  return (
    <div className="w-full max-w-full min-w-0 animate-in fade-in duration-300 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center text-teal-900 border border-teal-100 shrink-0">
            <span className="material-symbols-outlined text-2xl">{LECTURER_ICONS.reports}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900">Báo cáo thống kê</h1>
            <p className="text-xs text-slate-500">
              Biểu đồ đồ án & hồ sơ giảng viên ·{' '}
              <Link to="/lecturer" className="text-teal-800 hover:underline">
                Trang chủ
              </Link>
            </p>
          </div>
        </div>
        <a
          href="#lecturer-profile"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-teal-200 text-teal-900 text-xs font-bold hover:bg-teal-50 transition-colors"
        >
          <span className="material-symbols-outlined text-base">person</span>
          Tạo hồ sơ
        </a>
      </div>

      <LecturerReportCharts />

      <LecturerProfileForm />
    </div>
  );
};

export default LecturerReportsPage;
