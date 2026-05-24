import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStudentActivityStats, getStudentActivityLog } from '../../utils/studentActivityStats';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';

const InfoLine = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 py-2 border-b border-outline-variant/20 last:border-0">
    <span className="material-symbols-outlined text-primary text-base shrink-0">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">{label}</p>
      <p className="text-xs font-semibold text-on-surface break-words leading-snug">{value || '—'}</p>
    </div>
  </div>
);

const calcCompletion = profile => {
  const fields = ['fullName', 'email', 'studentId', 'faculty', 'phone', 'bio', 'avatarUrl'];
  const filled = fields.filter(k => String(profile[k] || '').trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
};

const StudentProfileSummaryCard = ({ profile, user }) => {
  const [stats, setStats] = useState(null);
  const [lastActivity, setLastActivity] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchStudentActivityStats();
      if (!cancelled) setStats(data);
      const log = getStudentActivityLog();
      if (!cancelled) setLastActivity(log.length ? log[log.length - 1] : null);
    };
    load();
    const refresh = () => load();
    window.addEventListener('student-activity-updated', refresh);
    window.addEventListener('student-profile-updated', refresh);
    window.addEventListener('profile-files-updated', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('student-activity-updated', refresh);
      window.removeEventListener('student-profile-updated', refresh);
      window.removeEventListener('profile-files-updated', refresh);
    };
  }, [profile]);

  const avatarSrc = profile.avatarUrl?.trim() || DEFAULT_AVATAR;
  const studentId = profile.studentId || (user.id ? `UEF-${String(user.id).padStart(4, '0')}` : '—');
  const completion = useMemo(() => calcCompletion(profile), [profile]);
  const s = stats?.summary;

  return (
    <section className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden w-full h-full flex flex-col">
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md shrink-0">
            <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-on-surface line-clamp-2 leading-tight">
              {profile.fullName || user.fullName || 'Sinh viên UEF'}
            </h2>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="px-2 py-0.5 bg-primary text-on-primary text-[8px] font-black rounded-full uppercase">
                {user.role || 'Student'}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black rounded-full border border-emerald-100">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">
              Hoàn thiện hồ sơ
            </span>
            <span className="text-xs font-black text-primary">{completion}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-outline-variant/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant/40 px-3 flex-1">
          <InfoLine icon="badge" label="Mã SV" value={studentId} />
          <InfoLine icon="mail" label="Email" value={profile.email || user.email} />
          <InfoLine icon="call" label="SĐT" value={profile.phone} />
          <InfoLine icon="corporate_fare" label="Khoa" value={profile.faculty} />
        </div>

        <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">Giới thiệu</p>
          <p className="text-[11px] text-on-surface leading-relaxed line-clamp-3">
            {profile.bio?.trim() || 'Chưa có mô tả.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { val: s?.visits ?? 0, label: 'Truy cập', icon: 'visibility' },
            { val: s?.files ?? 0, label: 'File', icon: 'folder' },
            { val: s?.games ?? 0, label: 'Game', icon: 'sports_esports' },
          ].map(item => (
            <div
              key={item.label}
              className="text-center py-2 rounded-lg bg-surface-container border border-outline-variant/25"
            >
              <span className="material-symbols-outlined text-primary text-sm">{item.icon}</span>
              <p className="text-sm font-black text-on-surface">{item.val}</p>
              <p className="text-[7px] font-bold text-on-surface-variant uppercase">{item.label}</p>
            </div>
          ))}
        </div>

        {lastActivity && (
          <p className="text-[10px] text-on-surface-variant bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
            <span className="font-bold text-amber-800">Gần đây:</span>{' '}
            {lastActivity.type === 'visit' ? 'Truy cập hồ sơ' : lastActivity.type}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 mt-auto pt-1">
          <Link
            to="/lookup"
            className="text-center py-2 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/15"
          >
            Tra cứu
          </Link>
          <Link
            to="/guidelines"
            className="text-center py-2 rounded-lg border border-outline-variant text-[10px] font-bold hover:bg-surface-container"
          >
            Hướng dẫn
          </Link>
        </div>
      </div>
    </section>
  );
};

export default StudentProfileSummaryCard;
