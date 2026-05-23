import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getSimilarityTrendChart,
  getStatusPieChart,
  getSubmissionsByMajorChart,
  CHART_COLORS,
} from '../../utils/lecturerReportData';
import { SUBMISSIONS } from '../../data/lecturerMockData';
import { LECTURER_ICONS } from '../../constants/lecturerIcons';

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  fontSize: '12px',
};

const LecturerReportCharts = () => {
  const byMajor = useMemo(() => getSubmissionsByMajorChart(), []);
  const statusPie = useMemo(() => getStatusPieChart(), []);
  const trend = useMemo(() => getSimilarityTrendChart(), []);

  const gradedCount = SUBMISSIONS.filter(s => s.grade != null && s.grade > 0).length;
  const avgSimilarity = Math.round(
    SUBMISSIONS.reduce((a, s) => a + s.similarity, 0) / SUBMISSIONS.length
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tổng đồ án', val: SUBMISSIONS.length, icon: 'inventory_2' },
          { label: 'Đã chấm', val: gradedCount, icon: 'rate_review' },
          { label: 'TB trùng lặp', val: `${avgSimilarity}%`, icon: 'content_copy' },
          { label: 'Cảnh báo', val: statusPie.find(s => s.key === 'flagged')?.value ?? 0, icon: 'warning' },
        ].map(s => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-800">
              <span className="material-symbols-outlined">{s.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">{s.label}</p>
              <p className="text-xl font-black text-slate-900">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-700 text-lg">bar_chart</span>
            Số đồ án theo ngành
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">Khối lượng bài nộp từng khoa</p>
          <div className="h-[260px] w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMajor} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Đồ án" fill={CHART_COLORS.teal} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-700 text-lg">donut_large</span>
            Trạng thái đạo văn
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">Phân bố Acceptable / Review / Flagged</p>
          <div className="h-[260px] w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {statusPie.map(entry => (
                    <Cell
                      key={entry.key}
                      fill={CHART_COLORS.status[entry.key] || CHART_COLORS.slate}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-sm min-w-0 xl:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-700 text-lg">
              {LECTURER_ICONS.reports}
            </span>
            Trung bình trùng lặp & AI theo ngành
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">So sánh chất lượng học thuật giữa các ngành</p>
          <div className="h-[280px] w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMajor} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="avgSimilarity" name="Trùng lặp TB" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgAi" name="AI TB" fill={CHART_COLORS.cyan} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-sm min-w-0 xl:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-700 text-lg">leaderboard</span>
            Điểm tiêu biểu trung bình theo ngành
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">Thang điểm tổng hợp chất lượng & nguyên gốc</p>
          <div className="h-[260px] w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMajor} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={48} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avgExemplary" name="Điểm TB" fill={CHART_COLORS.teal} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-sm min-w-0">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-teal-700 text-lg">show_chart</span>
          Trùng lặp từng bài nộp
        </h3>
        <p className="text-[11px] text-slate-500 mb-4">Theo sinh viên (mẫu hiện tại)</p>
        <div className="h-[300px] w-full min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 8, right: 8, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [`${value}%`, name]}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.title ? payload[0].payload.title : ''
                }
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="similarity" name="Trùng lặp" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} />
              <Bar dataKey="ai" name="AI" fill={CHART_COLORS.cyan} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LecturerReportCharts;
