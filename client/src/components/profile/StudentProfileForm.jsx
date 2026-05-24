import React, { useState, useEffect } from 'react';
import { loadStudentProfile, saveStudentProfile } from '../../utils/studentProfile';
import ProfileFileVault from './ProfileFileVault';
import AvatarUpload from './AvatarUpload';
import { PROFILE_PORTALS } from '../../utils/profileFileStorage';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';

const ViewField = ({ label, value, className = '' }) => (
  <div className={className}>
    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{label}</p>
    <p className="text-sm font-semibold text-on-surface mt-1 break-words">{value?.trim() ? value : '—'}</p>
  </div>
);

const StudentProfileForm = ({ showHeader = true, showVault = true }) => {
  const [form, setForm] = useState(loadStudentProfile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const refresh = () => setForm(loadStudentProfile());

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener('student-profile-updated', onUpdate);
    return () => window.removeEventListener('student-profile-updated', onUpdate);
  }, []);

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
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
    saveStudentProfile(form);
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const cancelEdit = () => {
    refresh();
    setError('');
    setIsEditing(false);
  };

  const avatarSrc = form.avatarUrl?.trim() || DEFAULT_AVATAR;
  const inputCls =
    'mt-1 w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-surface-container disabled:text-on-surface-variant';
  const labelCls = 'text-[11px] font-semibold text-on-surface-variant';

  return (
    <section className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden w-full min-w-0 h-full flex flex-col">
      {showHeader && (
        <div className="p-4 sm:p-6 border-b border-outline-variant/40 bg-gradient-to-r from-primary/5 to-white flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                {isEditing ? 'edit' : 'visibility'}
              </span>
              {isEditing ? 'Chỉnh sửa hồ sơ' : 'Chi tiết hồ sơ'}
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              {isEditing ? 'Sửa và bấm Lưu' : 'Chế độ xem — bấm Chỉnh sửa để thay đổi'}
            </p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold uppercase tracking-wide hover:opacity-90"
            >
              Chỉnh sửa
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex-1 flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start flex-1">
          <div className="shrink-0 mx-auto lg:mx-0">
            {isEditing ? (
              <AvatarUpload
                theme="student"
                size="md"
                value={form.avatarUrl}
                onChange={v => {
                  set('avatarUrl', v);
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md">
                  <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-on-surface-variant font-medium">Ảnh đại diện</p>
              </div>
            )}
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
            {isEditing ? (
              <>
                <label className={`${labelCls} sm:col-span-2`}>
                  Họ và tên <span className="text-red-500">*</span>
                  <input
                    required
                    value={form.fullName || ''}
                    onChange={e => set('fullName', e.target.value)}
                    className={`${inputCls} font-medium`}
                    placeholder="Nguyễn Văn A"
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
                    placeholder="student@uef.edu.vn"
                  />
                </label>
                <label className={labelCls}>
                  Mã sinh viên
                  <input
                    value={form.studentId || ''}
                    onChange={e => set('studentId', e.target.value)}
                    className={inputCls}
                    placeholder="SV001"
                  />
                </label>
                <label className={`${labelCls} sm:col-span-2`}>
                  Khoa / Phòng ban
                  <input
                    value={form.faculty || ''}
                    onChange={e => set('faculty', e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className={labelCls}>
                  Số điện thoại
                  <input
                    value={form.phone || ''}
                    onChange={e => set('phone', e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className={`${labelCls} sm:col-span-2`}>
                  Giới thiệu
                  <textarea
                    value={form.bio || ''}
                    onChange={e => set('bio', e.target.value)}
                    rows={3}
                    className={`${inputCls} resize-y`}
                  />
                </label>
              </>
            ) : (
              <>
                <ViewField label="Họ và tên" value={form.fullName} className="sm:col-span-2" />
                <ViewField label="Email UEF" value={form.email} />
                <ViewField label="Mã sinh viên" value={form.studentId} />
                <ViewField label="Khoa / Phòng ban" value={form.faculty} className="sm:col-span-2" />
                <ViewField label="Số điện thoại" value={form.phone} />
                <ViewField label="Giới thiệu" value={form.bio} className="sm:col-span-2" />
              </>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
        {saved && (
          <p className="text-sm text-emerald-700 font-medium bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Đã lưu hồ sơ.
          </p>
        )}

        {isEditing && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-outline-variant/30 mt-auto">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-bold hover:opacity-90"
            >
              Lưu hồ sơ
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-container"
            >
              Hủy
            </button>
          </div>
        )}
      </form>

      {showVault && (
        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          <ProfileFileVault portal={PROFILE_PORTALS.student} theme="student" />
        </div>
      )}
    </section>
  );
};

export default StudentProfileForm;
