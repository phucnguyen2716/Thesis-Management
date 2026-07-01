import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SUBMISSIONS, STATUS_CONFIG, MAJORS } from '../../data/lecturerMockData';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';
import { getRankedSubmissions } from '../../utils/lecturerRanking';
import { thesisService, plagiarismService } from '../../services/api';

const LecturerThesesPage = () => {
  const [majorFilter, setMajorFilter] = useState('all');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await thesisService.getAll({ page: 1, pageSize: 100 });
        if (data && data.items) {
          const dbItems = data.items.map((t, idx) => {
            const mockMatch = SUBMISSIONS.find(s => s.title.toLowerCase().trim() === t.title.toLowerCase().trim()) 
              || SUBMISSIONS.find(s => parseInt(s.id.replace('sub-', ''), 10) === t.id)
              || SUBMISSIONS[idx] || SUBMISSIONS[0];

            return {
              ...mockMatch,
              id: `sub-${String(t.id).padStart(3, '0')}`,
              title: t.title,
              student: t.studentName || 'Sinh viên',
              studentId: t.studentCode || 'SV-000',
              faculty: t.department || 'Khoa học Công nghệ',
              status: t.status === 'Approved' ? 'acceptable' : t.status === 'Rejected' || t.status === 'Revision' ? 'flagged' : 'review',
              grade: t.latestScore,
              exemplaryScore: t.latestScore ? Math.round(t.latestScore * 10) : mockMatch.exemplaryScore
            };
          });

          // Fetch plagiarism reports in parallel
          const itemsWithPlag = await Promise.all(dbItems.map(async item => {
            const numericId = parseInt(item.id.replace('sub-', ''), 10);
            try {
              const res = await plagiarismService.getStatus(numericId);
              if (res.data && res.data.status === 'Completed' && res.data.report) {
                return {
                  ...item,
                  similarity: Math.round(res.data.report.similarityPercentage)
                };
              }
            } catch (err) {
              console.error(`Lỗi khi lấy đạo văn cho ID ${numericId}:`, err);
            }
            return item;
          }));

          setSubmissions(itemsWithPlag);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách đồ án từ DB:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const list = useMemo(() => {
    const ranked = getRankedSubmissions(submissions, majorFilter);
    return ranked.map((s, i) => ({ ...s, rank: i + 1 }));
  }, [submissions, majorFilter]);

  return (
    <div className="w-full max-w-full min-w-0 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center text-teal-900 border border-teal-100">
          <span className="material-symbols-outlined text-2xl">{LECTURER_ICONS.theses}</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Danh sách đồ án</h1>
          <p className="text-xs text-slate-500">Sắp theo điểm tiêu biểu · lọc ngành</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMajorFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            majorFilter === 'all' ? 'bg-teal-900 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Tất cả
        </button>
        {MAJORS.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMajorFilter(m.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              majorFilter === m.id ? 'bg-teal-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {m.short}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="p-4 w-12">#</th>
              <th className="p-4">Sinh viên</th>
              <th className="p-4">Đề tài</th>
              <th className="p-4">Ngành</th>
              <th className="p-4">Tiêu biểu</th>
              <th className="p-4">Similarity</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {list.map(s => {
              const cfg = STATUS_CONFIG[s.status];
              const major = MAJORS.find(m => m.id === s.majorId);
              return (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-teal-50/30">
                  <td className="p-4 font-black text-teal-900">{s.rank}</td>
                  <td className="p-4 font-semibold text-slate-800">{s.student}</td>
                  <td className="p-4 text-slate-600 max-w-xs">
                    <span className="line-clamp-2">{s.title}</span>
                  </td>
                  <td className="p-4 text-xs text-slate-500">{major?.short}</td>
                  <td className="p-4 font-bold text-teal-800">{s.exemplaryScore}</td>
                  <td className={`p-4 font-bold ${s.similarity > 25 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {s.similarity}%
                  </td>
                  <td className="p-4">
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link
                      to={`/lecturer/controller/${s.id}`}
                      className="text-teal-800 text-xs font-bold uppercase hover:underline"
                    >
                      Phân tích →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LecturerThesesPage;
