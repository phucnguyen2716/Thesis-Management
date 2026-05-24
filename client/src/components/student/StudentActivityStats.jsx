import React, { useCallback, useEffect, useState } from 'react';
import { fetchStudentActivityStats, logStudentActivity } from '../../utils/studentActivityStats';

const StudentActivityStats = ({ className = '' }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(() => new Date().getFullYear());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStudentActivityStats();
      setStats(data);
      setYear(data.year);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    logStudentActivity('visit', { page: 'profile' });
    load();
    const onUpdate = () => load();
    window.addEventListener('student-activity-updated', onUpdate);
    window.addEventListener('student-profile-updated', onUpdate);
    window.addEventListener('profile-files-updated', onUpdate);
    return () => {
      window.removeEventListener('student-activity-updated', onUpdate);
      window.removeEventListener('student-profile-updated', onUpdate);
      window.removeEventListener('profile-files-updated', onUpdate);
    };
  }, [load]);

  const monthly = stats?.monthly || [];
  const max = stats?.maxMonth || 1;
  const s = stats?.summary || { visits: 0, files: 0, theses: 0, games: 0 };

  return (
    <div
      className={`bg-white rounded-2xl p-4 sm:p-5 border border-outline-variant shadow-sm flex flex-col h-full min-h-[280px] ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-5 bg-emerald-500 rounded-full shrink-0" />
          <h3 className="text-sm sm:text-base font-bold text-on-surface truncate">Thống kê hoạt động</h3>
        </div>
        <span className="shrink-0 bg-surface-container px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
          {year}
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-xs text-on-surface-variant">Đang tải...</div>
      ) : (
        <>
          <div className="flex items-end gap-1 sm:gap-1.5 w-full h-[7rem] sm:h-[8rem] mb-4">
            {monthly.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full min-w-0">
                <div className="w-full flex items-end justify-center h-full bg-surface-container rounded-t-md">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all"
                    style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
                    title={`${d.count} hoạt động`}
                  />
                </div>
                <span className="text-[8px] font-black text-on-surface-variant">{d.month}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-outline-variant/30 mt-auto">
            {[
              { val: s.visits, label: 'Truy cập', cls: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
              { val: s.files, label: 'Tài liệu', cls: 'bg-blue-50 border-blue-100 text-blue-700' },
              { val: s.theses, label: 'Đồ án', cls: 'bg-orange-50 border-orange-100 text-orange-700' },
            ].map((item, i) => (
              <div key={i} className={`${item.cls} p-2 rounded-xl text-center border`}>
                <div className="text-lg font-black">{item.val}</div>
                <div className="text-[8px] font-black uppercase tracking-wide opacity-70">{item.label}</div>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-on-surface-variant mt-2 text-center">
            Dữ liệu từ kho file, đồ án & nhật ký hoạt động trên máy bạn
          </p>
        </>
      )}
    </div>
  );
};

export default StudentActivityStats;
