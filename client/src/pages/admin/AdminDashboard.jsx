import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const PIE_COLORS = ['#34d399', '#f59e0b', '#f87171', '#ef4444'];

const tooltipStyle = {
  borderRadius: '8px',
  border: '1px solid #334155',
  background: '#0f172a',
  color: '#f8fafc',
  fontSize: '12px',
};

const CustomXAxisTick = ({ x, y, payload }) => {
  let value = payload.value || '';
  // Clean up display by replacing dashes with spaces for presentation
  value = value.replace(/-/g, ' ');
  const words = value.split(' ');
  const splitIdx = Math.ceil(words.length / 2);
  const line1 = words.slice(0, splitIdx).join(' ');
  const line2 = words.slice(splitIdx).join(' ');

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#94a3b8" fontSize={9} fontWeight="bold">
        <tspan x={0} dy={0}>{line1}</tspan>
        {line2 && <tspan x={0} dy={11}>{line2}</tspan>}
      </text>
    </g>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'plagiarism' | 'search' | 'system'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await adminService.getDashboardStats();
      setData(res.data);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thống kê dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <i className="bi bi-arrow-clockwise text-4xl text-amber-500 animate-spin"></i>
        <p className="text-slate-400 text-sm font-semibold">Đang tải dữ liệu PostgreSQL...</p>
      </div>
    );
  }

  // Pre-process data for plagiarism pie chart
  const plagiarismPieData = [
    { name: 'Tương đồng thấp (0-20%)', value: data.plagiarism.distribution.range0To20 },
    { name: 'Tương đồng vừa (21-40%)', value: data.plagiarism.distribution.range21To40 },
    { name: 'Tương đồng cao (41-60%)', value: data.plagiarism.distribution.range41To60 },
    { name: 'Cảnh báo đỏ (>60%)', value: data.plagiarism.distribution.rangeAbove60 },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <i className="bi bi-speedometer2 text-amber-500 text-3xl"></i>
            Admin Dashboard
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Hệ thống phân tích & giám sát học thuật thời gian thực dựa trên PostgreSQL
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850 text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <i className="bi bi-arrow-clockwise text-sm"></i>
          Làm mới dữ liệu
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-1">
        {[
          { id: 'overview', label: '📊 Tổng quan hệ thống', icon: 'bi bi-grid-1x2-fill', desc: 'Thống kê đề tài, sinh viên, khoa ngành' },
          { id: 'plagiarism', label: '🛡️ Kiểm tra tương đồng', icon: 'bi bi-shield-check', desc: 'Giám sát đạo văn, cảnh báo tương đồng' },
          { id: 'search', label: '🔍 Tìm kiếm học thuật', icon: 'bi bi-search', desc: 'Thống kê từ khóa, lượt tìm kiếm' },
          { id: 'system', label: '🟢 Vận hành hệ thống', icon: 'bi bi-cpu', desc: 'Docker, Postgres, ES, RabbitMQ status' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex flex-col items-start gap-0.5 shrink-0 ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <i className={tab.icon}></i>
              {tab.label.substring(2)}
            </span>
            <span className="text-[9px] font-normal lowercase text-slate-500 tracking-normal hidden md:inline">
              {tab.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { label: 'Khóa luận', val: data.overview.totalTheses, icon: 'bi bi-award-fill', color: 'text-emerald-400' },
              { label: 'Đồ án', val: data.overview.totalProjects, icon: 'bi bi-folder-fill', color: 'text-blue-400' },
              { label: 'Sinh viên', val: data.overview.totalStudents, icon: 'bi bi-mortarboard-fill', color: 'text-purple-400' },
              { label: 'Giảng viên', val: data.overview.totalAdvisors, icon: 'bi bi-person-video3', color: 'text-pink-400' },
              { label: 'Tổng số khoa', val: data.overview.totalDepartments, icon: 'bi bi-bank', color: 'text-teal-400' },
              { label: 'Tổng số ngành', val: data.overview.totalMajors, icon: 'bi bi-tags-fill', color: 'text-amber-400' },
            ].map((c, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-4 relative overflow-hidden">
                <i className={`${c.icon} absolute right-2 top-2 opacity-10 text-4xl`}></i>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{c.label}</p>
                <p className={`text-2xl font-black ${c.color} mt-2`}>{c.val}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Submissions */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <i className="bi bi-graph-up text-sm"></i>
                Số lượng khóa luận nộp theo tháng
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.monthlySubmissions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" name="Số bài nộp" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Department stats */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <i className="bi bi-bar-chart-line-fill text-sm"></i>
                Thống kê theo chuyên ngành / khoa
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="departmentName" stroke="#94a3b8" tick={<CustomXAxisTick />} interval={0} height={45} />
                  <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Số tài liệu" fill="#10b981" radius={[4, 4, 0, 0]}>
                    {data.departmentStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Documents formatting stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-1">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <i className="bi bi-file-earmark-text-fill text-sm"></i>
                Phân loại định dạng tài liệu
              </h3>
              <div className="space-y-4 py-2">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-file-earmark-pdf-fill text-red-500"></i>
                    <span className="text-xs font-bold">Tài liệu PDF</span>
                  </div>
                  <span className="text-sm font-black text-white bg-slate-800 px-2 py-0.5 rounded">{data.documents.pdfCount}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-file-earmark-word-fill text-blue-500"></i>
                    <span className="text-xs font-bold">Tài liệu Word (DOCX/DOC)</span>
                  </div>
                  <span className="text-sm font-black text-white bg-slate-800 px-2 py-0.5 rounded">{data.documents.docxCount}</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-[10px] text-slate-500">Tải lên theo năm học (2025-2026):</span>
                  <span className="text-xs font-bold text-emerald-400">{data.yearlyUploads.find(y => y.schoolYear === '2025-2026')?.Count || 0} files</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <i className="bi bi-check2-square text-sm"></i>
                Trạng thái duyệt tài liệu trên hệ thống
              </h3>
              <div className="grid grid-cols-3 gap-4 py-4 text-center">
                <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-3">
                  <i className="bi bi-patch-check-fill text-emerald-400 text-2xl"></i>
                  <p className="text-lg font-black text-emerald-400 mt-1">{data.documents.approvedCount}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Đã duyệt</p>
                </div>
                <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-3">
                  <i className="bi bi-hourglass-split text-amber-400 text-2xl"></i>
                  <p className="text-lg font-black text-amber-400 mt-1">{data.documents.pendingCount}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Chờ duyệt / Sửa đổi</p>
                </div>
                <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-3">
                  <i className="bi bi-x-circle-fill text-rose-400 text-2xl"></i>
                  <p className="text-lg font-black text-rose-400 mt-1">{data.documents.rejectedCount}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bị từ chối</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Plagiarism */}
      {activeTab === 'plagiarism' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Similarity distribution */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-col">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <i className="bi bi-pie-chart-fill text-sm"></i>
                Phân bố tỷ lệ tương đồng
              </h3>
              <div className="flex-1 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={plagiarismPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {plagiarismPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 w-full text-[10px] text-slate-400 px-2 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#34d399]"></span>
                    <span>Tương đồng thấp (0-20%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#f59e0b]"></span>
                    <span>Tương đồng vừa (21-40%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#f87171]"></span>
                    <span>Tương đồng cao (41-60%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#ef4444]"></span>
                    <span>Cảnh báo đỏ (&gt;60%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top High Plagiarism */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2 flex flex-col">
              <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <i className="bi bi-exclamation-triangle-fill text-sm"></i>
                Top tài liệu có độ tương đồng cao nhất
              </h3>
              <div className="flex-1 space-y-3">
                {data.plagiarism.topSimilarDocuments.map((doc, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-xs font-bold text-white truncate">{doc.documentName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">ID tài liệu: #{doc.thesisId}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${
                      doc.similarityPercentage > 60 
                        ? 'bg-rose-950/40 text-rose-400 border border-rose-900/50' 
                        : 'bg-amber-950/40 text-amber-400 border border-amber-900/50'
                    }`}>
                      {doc.similarityPercentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Plagiarism checks table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <i className="bi bi-clipboard-data-fill text-sm"></i>
              Tài liệu kiểm tra tương đồng gần đây
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Tên tài liệu</th>
                    <th className="py-2.5 px-3">Sinh viên</th>
                    <th className="py-2.5 px-3 text-center">Tỷ lệ tương đồng</th>
                    <th className="py-2.5 px-3 text-right">Thời gian kiểm tra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {data.plagiarism.recentChecks.map((check, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-200 max-w-xs truncate">{check.documentName}</td>
                      <td className="py-3 px-3 text-slate-400">{check.studentName}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          check.similarityPercentage > 60
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : check.similarityPercentage > 20
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {check.similarityPercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        {new Date(check.checkedAt).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Search */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Search keywords list */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <i className="bi bi-graph-up-arrow text-sm"></i>
                Top từ khóa được tìm kiếm nhiều nhất
              </h3>
              <div className="space-y-3">
                {data.search.topKeywords.map((k, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-slate-800/85">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-amber-500">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{k.keyword}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <span>{k.count}</span>
                      <span className="text-[9px] font-normal text-slate-500">lượt tìm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Search counts stats */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <i className="bi bi-bar-chart-line-fill text-sm"></i>
                  Số lượt tìm kiếm học thuật
                </h3>
                <div className="space-y-4">
                  <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Hôm nay</span>
                    <span className="text-lg font-black text-sky-400">{data.search.searchCounts.today}</span>
                  </div>
                  <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Tuần này</span>
                    <span className="text-lg font-black text-amber-400">{data.search.searchCounts.thisWeek}</span>
                  </div>
                  <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Tháng này</span>
                    <span className="text-lg font-black text-emerald-400">{data.search.searchCounts.thisMonth}</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 italic mt-4">
                * Dữ liệu thống kê được tổng hợp định kỳ từ máy chủ tìm kiếm Elasticsearch
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: System Operations */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status online/offline */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <i className="bi bi-hdd-network-fill text-sm"></i>
                Trạng thái các dịch vụ hệ thống (Dockerized)
              </h3>
              <div className="space-y-3.5">
                {[
                  { name: 'PostgreSQL Database Server', status: data.systemStatus.postgres, desc: 'Dữ liệu hệ thống chính' },
                  { name: 'Elasticsearch Index Server', status: data.systemStatus.elasticsearch, desc: 'Tìm kiếm học thuật thông minh' },
                  { name: 'RabbitMQ Message Queue', status: data.systemStatus.rabbitMQ || data.systemStatus.rabbitmq, desc: 'Hàng đợi xử lý tiến trình ngầm' },
                ].map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-950/30 p-3 rounded-lg border border-slate-800/80">
                    <div>
                      <p className="text-xs font-bold text-white">{s.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{s.desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${s.status === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
                      <span className={`text-xs font-black uppercase ${s.status === 'Online' ? 'text-emerald-400' : 'text-rose-500'}`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Queues and background processing */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <i className="bi bi-hourglass-split text-sm"></i>
                Hàng đợi xử lý nền (RabbitMQ Worker)
              </h3>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-200">Tài liệu đang phân tích cấu trúc AI</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Trích xuất bố cục tự động</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    (data.systemStatus.processingQueue?.analyzing || 0) > 0
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {data.systemStatus.processingQueue?.analyzing || 0} đang chạy
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-200">Tài liệu chờ lập chỉ mục Elasticsearch</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Đồng bộ tìm kiếm toàn văn</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    (data.systemStatus.processingQueue?.indexing || 0) > 0
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {data.systemStatus.processingQueue?.indexing || 0} hàng đợi
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-slate-200">Tài liệu đang quét kiểm tra tương đồng (Plagiarism)</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Quét qua API Gemini Pro</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    (data.systemStatus.processingQueue?.plagiarismChecking || 0) > 0
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {data.systemStatus.processingQueue?.plagiarismChecking || 0} đang quét
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
