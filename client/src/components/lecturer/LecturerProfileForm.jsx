import React, { useState, useEffect } from 'react';
import { MAJORS } from '../../data/lecturerMockData';
import { loadLecturerProfile, saveLecturerProfile } from '../../utils/lecturerProfile';
import ProfileFileVault from '../profile/ProfileFileVault';
import AvatarUpload from '../profile/AvatarUpload';
import { PROFILE_PORTALS } from '../../utils/profileFileStorage';

const LecturerProfileForm = ({ onSaved }) => {
  const [form, setForm] = useState(loadLecturerProfile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(loadLecturerProfile());
  }, []);

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const toggleMajor = id => {
    setForm(prev => {
      const ids = prev.majorIds || [];
      const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
      return { ...prev, majorIds: next };
    });
    setSaved(false);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.fullName?.trim()) {
      setError('Vui lòng nhập họ tên.');
      return;
    }
    if (!form.email?.trim()) {
      setError('Vui lòng nhập email UEF.');
      return;
    }
    setError('');
    saveLecturerProfile(form);
    setSaved(true);
    onSaved?.(form);
    setTimeout(() => setSaved(false), 3000);
  };

  const avatarSrc =
    form.avatarUrl?.trim() ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';

  return (
    <section
      id="lecturer-profile"
      className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden w-full min-w-0"
    >
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-teal-800">person_add</span>
          Tạo / Cập nhật hồ sơ giảng viên
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Lưu trên trình duyệt — hiển thị trên header portal GV
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <AvatarUpload
            theme="lecturer"
            value={form.avatarUrl}
            onChange={v => {
              const next = { ...form, avatarUrl: v };
              setForm(next);
              saveLecturerProfile(next);
            }}
          />

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
            <label className="text-[11px] font-semibold text-slate-600 sm:col-span-2">
              Họ và tên <span className="text-red-500">*</span>
              <input
                required
                value={form.fullName || ''}
                onChange={e => set('fullName', e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800"
                placeholder="TS. Nguyễn Văn A"
              />
            </label>
            <label className="text-[11px] font-semibold text-slate-600">
              Email UEF <span className="text-red-500">*</span>
              <input
                required
                type="email"
                value={form.email || ''}
                onChange={e => set('email', e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20"
                placeholder="gv@uef.edu.vn"
              />
            </label>
            <label className="text-[11px] font-semibold text-slate-600">
              Số điện thoại
              <input
                value={form.phone || ''}
                onChange={e => set('phone', e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20"
                placeholder="09xx xxx xxx"
              />
            </label>
            <label className="text-[11px] font-semibold text-slate-600">
              Mã giảng viên
              <input
                value={form.employeeId || ''}
                onChange={e => set('employeeId', e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20"
                placeholder="GV-2024-001"
              />
            </label>
            <label className="text-[11px] font-semibold text-slate-600">
              Chức danh
              <select
                value={form.academicTitle || 'Giảng viên'}
                onChange={e => set('academicTitle', e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20 bg-white"
              >
                <option>Giảng viên</option>
                <option>Giảng viên chính</option>
                <option>Phó Giáo sư</option>
                <option>Giáo sư</option>
                <option>Trợ giảng</option>
              </select>
            </label>
            <label className="text-[11px] font-semibold text-slate-600 sm:col-span-2">
              Khoa / Đơn vị công tác
              <input
                value={form.faculty || ''}
                onChange={e => set('faculty', e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20"
                placeholder="Khoa Công nghệ thông tin"
              />
            </label>
            <label className="text-[11px] font-semibold text-slate-600 sm:col-span-2">
              Lĩnh vực chuyên môn
              <input
                value={form.expertise || ''}
                onChange={e => set('expertise', e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20"
                placeholder="AI, Đạo văn, Quản trị đồ án..."
              />
            </label>
            <label className="text-[11px] font-semibold text-slate-600 sm:col-span-2">
              Giới thiệu ngắn
              <textarea
                value={form.bio || ''}
                onChange={e => set('bio', e.target.value)}
                rows={3}
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20 resize-y"
                placeholder="Kinh nghiệm giảng dạy, hướng dẫn đồ án..."
              />
            </label>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2">
            Ngành phụ trách chấm đồ án
          </p>
          <div className="flex flex-wrap gap-2">
            {MAJORS.map(m => {
              const active = (form.majorIds || []).includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMajor(m.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    active
                      ? 'bg-teal-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-teal-50'
                  }`}
                >
                  {m.short}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
        {saved && (
          <p className="text-sm text-emerald-700 font-medium bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Đã lưu hồ sơ giảng viên.
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-teal-900 text-white text-sm font-bold hover:bg-teal-950 transition-colors"
          >
            Lưu hồ sơ
          </button>
          <button
            type="button"
            onClick={() => setForm(loadLecturerProfile())}
            className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50"
          >
            Tải lại
          </button>
        </div>
      </form>
      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        <ProfileFileVault portal={PROFILE_PORTALS.lecturer} theme="lecturer" />
      </div>
    </section>
  );
};

export default LecturerProfileForm;
