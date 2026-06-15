import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';
import LecturerProfileForm from '../../components/lecturer/LecturerProfileForm';
import { loadLecturerProfile } from '../../utils/lecturerProfile';
import { MAJORS } from '../../data/lecturerMockData';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';

const calcCompletion = profile => {
  const fields = ['fullName', 'email', 'phone', 'faculty', 'bio', 'avatarUrl', 'expertise', 'employeeId'];
  const filled = fields.filter(k => String(profile[k] || '').trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
};

const InfoLine = ({ icon, label, value }) => (
  <div className="flex items-center gap-2.5 py-2 border-b border-slate-100 last:border-0">
    <span className="material-symbols-outlined text-teal-800 text-base shrink-0">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-semibold text-slate-800 break-words leading-snug">{value || '—'}</p>
    </div>
  </div>
);

const LecturerSummaryCard = ({ profile }) => {
  const avatarSrc = profile.avatarUrl?.trim() || DEFAULT_AVATAR;
  const completion = calcCompletion(profile);
  const majorLabels = (profile.majorIds || [])
    .map(id => MAJORS.find(m => m.id === id)?.short)
    .filter(Boolean);

  return (
    <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden w-full h-full flex flex-col">
      {/* Avatar hero */}
      <div className="relative bg-gradient-to-br from-teal-900 to-teal-700 p-6 flex flex-col items-center gap-3">
        <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white/30 shadow-xl ring-2 ring-teal-400/20">
          <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-black text-white leading-tight line-clamp-2">
            {profile.fullName || 'Giảng viên UEF'}
          </h2>
          <p className="text-xs text-teal-200 mt-1 font-medium">
            {profile.academicTitle || 'Giảng viên'}
          </p>
          {profile.faculty && (
            <p className="text-[10px] text-teal-300/80 mt-0.5 line-clamp-1">{profile.faculty}</p>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap justify-center">
          <span className="px-2.5 py-1 bg-white/10 text-white text-[9px] font-black rounded-full uppercase tracking-wider border border-white/20">
            Giảng viên
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-400/20 text-emerald-200 text-[9px] font-black rounded-full border border-emerald-300/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Completion bar */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Hoàn thiện hồ sơ</span>
            <span className="text-xs font-black text-teal-800">{completion}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-700 to-emerald-500 transition-all duration-700"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        {/* Info lines */}
        <div className="rounded-xl border border-slate-100 px-3 flex-1">
          <InfoLine icon="mail" label="Email" value={profile.email} />
          <InfoLine icon="call" label="Số điện thoại" value={profile.phone} />
          <InfoLine icon="badge" label="Mã giảng viên" value={profile.employeeId} />
          <InfoLine icon="psychology" label="Chuyên môn" value={profile.expertise} />
        </div>

        {/* Bio */}
        {profile.bio?.trim() && (
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-100">
            <p className="text-[8px] font-black text-teal-700 uppercase tracking-widest mb-1.5">Giới thiệu</p>
            <p className="text-[11px] text-slate-700 leading-relaxed line-clamp-4">{profile.bio}</p>
          </div>
        )}

        {/* Major tags */}
        {majorLabels.length > 0 && (
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ngành phụ trách</p>
            <div className="flex flex-wrap gap-1.5">
              {majorLabels.map(m => (
                <span
                  key={m}
                  className="px-2 py-0.5 bg-teal-900 text-white text-[9px] font-bold rounded-full"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2 mt-auto pt-1">
          <Link
            to="/lecturer"
            className="text-center py-2 rounded-lg bg-teal-50 text-teal-800 text-[10px] font-bold hover:bg-teal-100 transition-colors"
          >
            Trang chủ
          </Link>
          <Link
            to="/lecturer/score"
            className="text-center py-2 rounded-lg border border-slate-200 text-[10px] font-bold hover:bg-slate-50 transition-colors"
          >
            Chấm điểm
          </Link>
        </div>
      </div>
    </section>
  );
};

const LecturerProfilePage = () => {
  const [profile, setProfile] = useState(() => loadLecturerProfile());

  useEffect(() => {
    const refresh = () => setProfile(loadLecturerProfile());
    window.addEventListener('lecturer-profile-updated', refresh);
    return () => window.removeEventListener('lecturer-profile-updated', refresh);
  }, []);

  return (
    <div className="w-full max-w-full min-w-0 animate-in fade-in duration-300 space-y-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center text-teal-900 border border-teal-100 shrink-0">
          <span className="material-symbols-outlined text-2xl">{LECTURER_ICONS.profile}</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900">Hồ sơ giảng viên</h1>
          <p className="text-xs text-slate-500">
            Thông tin cá nhân · Số điện thoại · Giới thiệu · Kho tài liệu ·{' '}
            <Link to="/lecturer" className="text-teal-800 hover:underline">
              Trang chủ
            </Link>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        <div className="lg:col-span-4 xl:col-span-3 min-w-0">
          <LecturerSummaryCard profile={profile} />
        </div>
        <div className="lg:col-span-8 xl:col-span-9 min-w-0">
          <LecturerProfileForm onSaved={() => setProfile(loadLecturerProfile())} />
        </div>
      </div>
    </div>
  );
};

export default LecturerProfilePage;
