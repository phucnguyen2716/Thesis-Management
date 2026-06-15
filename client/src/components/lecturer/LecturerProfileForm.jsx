import React, { useState, useEffect } from 'react';
import { MAJORS } from '../../data/lecturerMockData';
import { loadLecturerProfile, saveLecturerProfile } from '../../utils/lecturerProfile';
import ProfileFileVault from '../profile/ProfileFileVault';
import AvatarUpload from '../profile/AvatarUpload';
import { PROFILE_PORTALS } from '../../utils/profileFileStorage';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';

const ViewField = ({ label, value, icon, className = '' }) => (
  <div className={`flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0 ${className}`}>
    {icon && (
      <span className="material-symbols-outlined text-teal-800 text-base shrink-0 mt-0.5">{icon}</span>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words leading-snug">
        {value?.trim() ? value : <span className="text-slate-300 font-normal italic">Chưa cập nhật</span>}
      </p>
    </div>
  </div>
);

const LecturerProfileForm = ({ onSaved }) => {
  const [form, setForm] = useState(loadLecturerProfile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const refresh = () => setForm(loadLecturerProfile());
    refresh();
    window.addEventListener('lecturer-profile-updated', refresh);
    return () => window.removeEventListener('lecturer-profile-updated', refresh);
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
    if (!form.fullName?.trim()) { setError('Vui lòng nhập họ tên.'); return; }
    if (!form.email?.trim()) { setError('Vui lòng nhập email UEF.'); return; }
    setError('');
    saveLecturerProfile(form);
    setSaved(true);
    setIsEditing(false);
    onSaved?.(form);
    setTimeout(() => setSaved(false), 3000);
  };

  const cancelEdit = () => {
    setForm(loadLecturerProfile());
    setError('');
    setIsEditing(false);
  };

  const avatarSrc = form.avatarUrl?.trim() || DEFAULT_AVATAR;
  const inputCls =
    'mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800 bg-white';
  const labelCls = 'text-[11px] font-semibold text-slate-600';

  const majorLabels = (form.majorIds || [])
    .map(id => MAJORS.find(m => m.id === id)?.short)
    .filter(Boolean)
    .join(', ');

  return (
    <section
      id="lecturer-profile"
      className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden w-full min-w-0 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-800">
              {isEditing ? 'edit' : 'person'}
            </span>
            {isEditing ? 'Chỉnh sửa hồ sơ giảng viên' : 'Hồ sơ giảng viên'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isEditing ? 'Cập nhật thông tin và bấm Lưu' : 'Lưu trên trình duyệt · Hiển thị trên header portal GV'}
          </p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-lg bg-teal-900 text-white text-xs font-bold uppercase tracking-wide hover:bg-teal-950 transition-colors"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex-1 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="shrink-0 mx-auto sm:mx-0">
            {isEditing ? (
              <AvatarUpload
                theme="lecturer"
                value={form.avatarUrl}
                onChange={v => {
                  const next = { ...form, avatarUrl: v };
                  setForm(next);
                  saveLecturerProfile(next);
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-teal-200 shadow-md cursor-pointer hover:opacity-90 transition-opacity relative group"
                  onClick={() => setIsEditing(true)}
                  title="Bấm để thay ảnh"
                >
                  <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Ảnh đại diện</p>
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="flex-1 w-full min-w-0">
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`${labelCls} sm:col-span-2`}>
                  Họ và tên <span className="text-red-500">*</span>
                  <input
                    required
                    value={form.fullName || ''}
                    onChange={e => set('fullName', e.target.value)}
                    className={`${inputCls} font-medium`}
                    placeholder="TS. Nguyễn Văn A"
                  />
                </label>
                <label className={labelCls}>
                  Email UEF <span className="text-red-500">*</span>
                  <input
                    required
                    type="email"
                    value={form.email || ''}
                    onChange={e => set('email', e.target.value)}
                    className={inputCls}
                    placeholder="gv@uef.edu.vn"
                  />
                </label>
                <label className={labelCls}>
                  Số điện thoại
                  <input
                    value={form.phone || ''}
                    onChange={e => set('phone', e.target.value)}
                    className={inputCls}
                    placeholder="09xx xxx xxx"
                  />
                </label>
                <label className={labelCls}>
                  Mã giảng viên
                  <input
                    value={form.employeeId || ''}
                    onChange={e => set('employeeId', e.target.value)}
                    className={inputCls}
                    placeholder="GV-2024-001"
                  />
                </label>
                <label className={labelCls}>
                  Chức danh
                  <select
                    value={form.academicTitle || 'Giảng viên'}
                    onChange={e => set('academicTitle', e.target.value)}
                    className={`${inputCls} bg-white`}
                  >
                    <option>Giảng viên</option>
                    <option>Giảng viên chính</option>
                    <option>Phó Giáo sư</option>
                    <option>Giáo sư</option>
                    <option>Trợ giảng</option>
                  </select>
                </label>
                <label className={`${labelCls} sm:col-span-2`}>
                  Khoa / Đơn vị công tác
                  <input
                    value={form.faculty || ''}
                    onChange={e => set('faculty', e.target.value)}
                    className={inputCls}
                    placeholder="Khoa Công nghệ thông tin"
                  />
                </label>
                <label className={`${labelCls} sm:col-span-2`}>
                  Lĩnh vực chuyên môn
                  <input
                    value={form.expertise || ''}
                    onChange={e => set('expertise', e.target.value)}
                    className={inputCls}
                    placeholder="AI, Đạo văn, Quản trị đồ án..."
                  />
                </label>
                <label className={`${labelCls} sm:col-span-2`}>
                  Giới thiệu ngắn
                  <textarea
                    value={form.bio || ''}
                    onChange={e => set('bio', e.target.value)}
                    rows={3}
                    className={`${inputCls} resize-y`}
                    placeholder="Kinh nghiệm giảng dạy, hướng dẫn đồ án..."
                  />
                </label>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                <ViewField icon="badge" label="Họ và tên" value={form.fullName} />
                <ViewField icon="work" label="Chức danh" value={form.academicTitle} />
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  <ViewField icon="mail" label="Email UEF" value={form.email} />
                  <ViewField icon="call" label="Số điện thoại" value={form.phone} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  <ViewField icon="corporate_fare" label="Khoa / Đơn vị" value={form.faculty} />
                  <ViewField icon="tag" label="Mã giảng viên" value={form.employeeId} />
                </div>
                <ViewField icon="psychology" label="Lĩnh vực chuyên môn" value={form.expertise} />
                {majorLabels && (
                  <ViewField icon="school" label="Ngành phụ trách" value={majorLabels} />
                )}
                <div className="py-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Giới thiệu</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {form.bio?.trim() || <span className="text-slate-300 font-normal italic">Chưa có mô tả.</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Major selector (edit mode only) */}
        {isEditing && (
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
                      active ? 'bg-teal-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-teal-50'
                    }`}
                  >
                    {m.short}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
        {saved && (
          <p className="text-sm text-emerald-700 font-medium bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Đã lưu hồ sơ giảng viên.
          </p>
        )}

        {isEditing && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100 mt-auto">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-teal-900 text-white text-sm font-bold hover:bg-teal-950 transition-colors"
            >
              Lưu hồ sơ
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        )}
      </form>

      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        <ProfileFileVault portal={PROFILE_PORTALS.lecturer} theme="lecturer" />
      </div>
    </section>
  );
};

export default LecturerProfileForm;
