import React from 'react';
import { Link } from 'react-router-dom';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';
import LecturerProfileForm from '../../components/lecturer/LecturerProfileForm';

const LecturerProfilePage = () => (
  <div className="w-full max-w-full min-w-0 animate-in fade-in duration-300 space-y-6">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center text-teal-900 border border-teal-100 shrink-0">
        <span className="material-symbols-outlined text-2xl">{LECTURER_ICONS.profile}</span>
      </div>
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900">Hồ sơ giảng viên</h1>
        <p className="text-xs text-slate-500">
          Thông tin & kho tài liệu ·{' '}
          <Link to="/lecturer" className="text-teal-800 hover:underline">
            Trang chủ
          </Link>
        </p>
      </div>
    </div>
    <LecturerProfileForm />
  </div>
);

export default LecturerProfilePage;
