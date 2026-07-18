import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { thesisService, plagiarismService, resolveFileUrl } from '../../services/api';
import { getAdminUsers } from '../../utils/adminStore';
import PlagiarismScanResultPanel from '../../components/lecturer/PlagiarismScanResultPanel';

const CATEGORY_MAP = {
  project: { code: 'Project', title: 'Quản lý đồ án' },
  topic:   { code: 'Topic',   title: 'Quản lý chuyên đề' },
  thesis:  { code: 'Thesis',  title: 'Quản lý khóa luận' },
};

const MAJOR_DISPLAY = {
  ai:         'Trí tuệ nhân tạo',
  networking: 'Mạng máy tính',
  systems:    'Hệ thống thông tin DN',
  security:   'An toàn không gian mạng',
  programming: 'Kỹ thuật lập trình',
};

// Danh sách môn học theo chuyên ngành (chỉ dùng cho Đồ án)
const SUBJECTS_BY_MAJOR = {
  ai: [
    { name: 'Máy học',                                        code: 'ITE1173E' },
    { name: 'Phát triển ứng dụng trí tuệ nhân tạo',          code: 'ITE1174E' },
    { name: 'Đồ án chuyên ngành trí tuệ nhân tạo',           code: 'ITE1491'  },
    { name: 'Khai thác dữ liệu và ứng dụng',                 code: 'ITE1176E' },
    { name: 'Thị giác máy tính',                              code: 'ITE1181E' },
  ],
  networking: [
    { name: 'Mạng máy tính nâng cao',                        code: 'ITE1235E' },
    { name: 'Thiết kế mạng máy tính',                        code: 'ITE1267E' },
    { name: 'Lập trình mạng máy tính',                       code: 'ITE1255E' },
    { name: 'Quản trị mạng',                                  code: 'ITE1241E' },
    { name: 'Đồ án chuyên ngành mạng máy tính',              code: 'ITE1489'  },
  ],
  systems: [
    { name: 'Cơ sở dữ liệu nâng cao',                        code: 'ITE1224E' },
    { name: 'Hoạch định nguồn nhân lực doanh nghiệp',        code: 'ITE1285E' },
    { name: 'Hệ thống thông tin quản lý',                    code: 'ITE1129E' },
    { name: 'Phân tích nghiệp vụ kinh doanh',                code: 'ITE1284E' },
    { name: 'Đồ án chuyên ngành hệ thống thông tin DN',      code: 'ITE1488'  },
  ],
  security: [
    { name: 'An toàn thông tin cho ứng dụng web',            code: 'ITE1268E' },
    { name: 'An toàn hệ thống mạng máy tính',                code: 'ITE1232E' },
    { name: 'Phân tích và đánh giá an toàn thông tin',       code: 'ITE1239E' },
    { name: 'Điều tra số',                                    code: 'ITE1258E' },
    { name: 'Đồ án chuyên ngành an toàn không gian mạng',    code: 'ITE1490'  },
  ],
  programming: [
    { name: 'Lập trình Front-End',                          code: 'SWE1208E' },
    { name: 'Mạng máy tính và bảo mật thông tin',             code: 'SWE1204E' },
    { name: 'Phân tích và thiết kế phần mềm',                code: 'SWE1107E' },
    { name: 'Lập trình ứng dụng',                            code: 'SWE1205E' },
    { name: 'Phát triển ứng dụng Full-Stack',                code: 'SWE1209E' },
    { name: 'Công cụ phát triển ứng dụng',                    code: 'SWE1210E' },
    { name: 'Đồ án kỹ thuật phần mềm',                        code: 'SWE1422'  },
    { name: 'Đảm bảo chất lượng phần mềm',                   code: 'SWE1111E' },
    { name: 'Kiểm thử phần mềm',                             code: 'SWE1212E' },
    { name: 'Quản lý dự án kiểm thử',                        code: 'SWE1114E' },
    { name: 'Công cụ và kỹ thuật kiểm thử tự động',            code: 'SWE1213E' },
    { name: 'Đồ án chuyên ngành kiểm thử phần mềm',           code: 'SWE1415'  },
    { name: 'Phát triển ứng dụng đa nền tảng',                code: 'SWE1216E' },
    { name: 'Phát triển Game',                               code: 'ITE1279E' },
    { name: 'Phát triển và vận hành hệ thống công nghệ thông tin', code: 'SWE1219E' },
    { name: 'Phát triển ứng dụng web nâng cao',              code: 'SWE1218E' },
    { name: 'Đồ án chuyên ngành phát triển ứng dụng',         code: 'SWE1420'  },
  ],
};

const STATUS_BADGES = {
  Pending:    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  InProgress: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  Submitted:  'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  Approved:   'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  Rejected:   'bg-red-500/20 text-red-400 border border-red-500/30',
  Revision:   'bg-orange-500/20 text-orange-400 border border-orange-500/30',
};

const emptyForm = (categoryCode) => ({
  title: '',
  description: '',
  major: 'ai',
  subject: '',
  subjectCode: '',
  category: categoryCode,
  studentId: '',
  advisorId: '',
  status: 'Pending',
  batch: 1,
  filePath: '',
  submissions: [],
});

// ─── Google Drive + Lookup panel (Hangfire tự đồng bộ) ───────────────────────
const DriveLookupPanel = ({ status, onRefresh, onTestConnection, testingConnection }) => (
  <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 space-y-3">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-emerald-400">cloud_sync</span>
        </div>
        <div>
          <p className="text-sm font-black text-emerald-300 uppercase tracking-wider">Google Drive → Lookup</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tự seed khi khởi động backend · Hangfire sync mỗi 1 phút · Tra cứu tại <span className="text-emerald-400/80">/lookup?type=do-an</span>
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button type="button" onClick={onTestConnection} disabled={testingConnection}
          className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-[10px] font-bold uppercase transition-colors shrink-0 flex items-center gap-1.5">
          {testingConnection && <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
          Test Connection
        </button>
        <button type="button" onClick={onRefresh}
          className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-[10px] font-bold uppercase transition-colors shrink-0">
          Làm mới
        </button>
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {[
        { label: 'File trên Drive', value: status?.driveFileCount ?? '—', icon: 'folder' },
        { label: 'Đã sync vào DB', value: status?.dbRecordCount ?? '—', icon: 'database' },
        { label: 'Chu kỳ sync', value: status?.hangfireInterval ?? '1 phút', icon: 'schedule' },
        { label: 'Cập nhật gần nhất', value: status?.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString('vi-VN') : 'Chưa có', icon: 'history' },
      ].map(item => (
        <div key={item.label} className="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2">
          <div className="flex items-center gap-1 text-[9px] text-slate-500 uppercase font-bold">
            <span className="material-symbols-outlined text-[12px]">{item.icon}</span>
            {item.label}
          </div>
          <p className="text-xs font-bold text-white mt-1 truncate">{item.value}</p>
        </div>
      ))}
    </div>
    <p className="text-[10px] text-slate-500 leading-relaxed">
      Cấu trúc: <code className="text-emerald-400/80">CourseProjectStorage / Kỹ thuật lập trình / Phát triển Game (ITE1279E) / Nhom01_Game2D_SVxxxx / files</code>
      {' '}— Word tự chuyển PDF qua LibreOffice vào <code className="text-emerald-400/80">temporary_pdf/</code>
    </p>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminThesesPage = () => {
  const { category } = useParams();
  const catConfig = CATEGORY_MAP[category] || CATEGORY_MAP.project;
  const isProject = catConfig.code === 'Project';

  const [theses, setTheses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');

  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm(catConfig.code));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [driveStatus, setDriveStatus] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [selectedThesisForScan, setSelectedThesisForScan] = useState(null);
  const [scanVisible, setScanVisible] = useState(false);
  const [reviewsVisible, setReviewsVisible] = useState(false);
  const [selectedThesisForReviews, setSelectedThesisForReviews] = useState(null);
  const [thesisReviews, setThesisReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [updateStatusVal, setUpdateStatusVal] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [plagiarismRequests, setPlagiarismRequests] = useState([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  const showToastMessage = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ message, onConfirm });
  };

  const handleDownload = async (filePath, fileName) => {
    if (!filePath) {
      showToastMessage('error', 'Đường dẫn tệp tin không hợp lệ.');
      return;
    }

    const isMockUrl = filePath.toLowerCase().includes('/mock') || 
                      filePath.toLowerCase().includes('mock-') || 
                      filePath.toLowerCase().includes('id=mock') ||
                      filePath.toLowerCase().includes('google.com/file/d/mock');

    if (isMockUrl) {
      const mockFileUrl = '/Document%20Detail.pdf';
      try {
        const response = await fetch(mockFileUrl);
        if (!response.ok) throw new Error('Không thể tải tệp tin mẫu');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.endsWith('.pdf') ? fileName : `${fileName.split('.')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToastMessage('success', `Đã tải xuống thành công tài liệu mẫu: ${fileName}!`);
      } catch (error) {
        console.error('Lỗi khi tải file mẫu:', error);
        window.open(mockFileUrl, '_blank');
      }
      return;
    }

    const fileUrl = resolveFileUrl(filePath);
    
    if (fileUrl.startsWith('http') && !fileUrl.includes(window.location.hostname) && !fileUrl.includes('localhost') && !fileUrl.includes('onrender.com')) {
      window.open(fileUrl, '_blank');
      showToastMessage('success', `Đang mở liên kết: ${fileName}`);
      return;
    }

    showToastMessage('success', `Đang chuẩn bị tải xuống: ${fileName}...`);

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Không thể tải tệp tin');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToastMessage('success', `Đã tải xuống thành công: ${fileName}!`);
    } catch (error) {
      console.error('Lỗi khi tải file:', error);
      // Fallback
      window.open(fileUrl, '_blank');
      showToastMessage('success', `Đã mở tải xuống cho: ${fileName}`);
    }
  };

  const openPlagiarismModal = async (thesis) => {
    setSelectedThesisForScan(thesis);
    setScanResult(null);
    setScanVisible(true);
    setScanning(true);
    
    try {
      const res = await plagiarismService.getStatus(thesis.id);
      if (res.data && res.data.status === 'Completed') {
        const report = res.data.report;
        setScanResult({
          similarity: report.similarityPercentage,
          aiPercent: report.aiPercent ?? Math.round(report.similarityPercentage * 0.4),
          report,
          matches: report.matches ? report.matches.map((m, idx) => ({
            label: `Nguồn #${idx + 1}`,
            excerpt: m.studentExcerpt ?? m.text ?? '',
            sourceTitle: m.sourceName ?? m.sourceTitle ?? 'Tài liệu tham khảo',
            sourceMeta: m.detectedBy ? (Array.isArray(m.detectedBy) ? m.detectedBy.join(', ') : m.detectedBy) : 'Nguồn Internet',
            url: m.sourceUrl ?? m.url ?? '#',
            percent: m.similarity ?? m.similarityScore ?? 0,
          })) : [],
          sources: report.sources ? report.sources.map((src, idx) => ({
            id: idx + 1,
            name: src.title ?? src.name ?? 'Nguồn Web',
            url: src.id ?? src.url ?? '#',
            percent: src.matchingPercentage ?? src.percent ?? 0,
            type: 'plagiarism'
          })) : [],
          sourceCount: report.sources ? report.sources.length : 0
        });
      }
    } catch (err) {
      console.warn('No existing plagiarism report found, or backend offline.');
    } finally {
      setScanning(false);
    }
  };

  const runAdminRecheck = async () => {
    if (!selectedThesisForScan) return;
    const thesis = selectedThesisForScan;
    setScanning(true);
    setScanProgress(0);
    setShowProgressModal(true);

    /* 1. Try backend mechanism */
    try {
      await plagiarismService.check(thesis.id);
      let pollAttempts = 0;
      const maxAttempts = 20;
      const intervalId = setInterval(async () => {
        pollAttempts++;
        try {
          const statusRes = await plagiarismService.getStatus(thesis.id);
          const statusData = statusRes.data;

          if (statusData.status === 'Completed') {
            clearInterval(intervalId);
            const report = statusData.report;

            // Safe map backend report matches to React expected fields
            if (report.matches) {
              report.matches = report.matches.map(m => ({
                similarity: m.similarity ?? m.similarityScore ?? 0,
                studentExcerpt: m.studentExcerpt ?? m.text ?? '',
                matchPhrase: m.matchPhrase ?? (m.text ? m.text.split(' ').slice(3, 8).join(' ') : ''),
                sourceExcerpt: m.sourceExcerpt ?? '',
                sourceName: m.sourceName ?? m.sourceTitle ?? 'Web source',
                sourceUrl: m.sourceUrl ?? '#',
                detectedBy: m.detectedBy ?? ['BM25', 'N-Gram']
              }));
            }

            const newSim = report.similarityPercentage;
            setScanProgress(100);
            setTimeout(() => {
              setShowProgressModal(false);
              setScanResult({
                similarity: newSim,
                aiPercent: report.aiPercent ?? Math.round(newSim * 0.4),
                report,
                matches: report.matches ? report.matches.map((m, idx) => ({
                  label: `Nguồn #${idx + 1}`,
                  excerpt: m.studentExcerpt ?? m.text ?? '',
                  sourceTitle: m.sourceName ?? m.sourceTitle ?? 'Tài liệu tham khảo',
                  sourceMeta: m.detectedBy ? (Array.isArray(m.detectedBy) ? m.detectedBy.join(', ') : m.detectedBy) : 'Nguồn Internet',
                  url: m.sourceUrl ?? m.url ?? '#',
                  percent: m.similarity ?? m.similarityScore ?? 0,
                })) : [],
                sources: report.sources ? report.sources.map((src, idx) => ({
                  id: idx + 1,
                  name: src.title ?? src.name ?? 'Nguồn Web',
                  url: src.id ?? src.url ?? '#',
                  percent: src.matchingPercentage ?? src.percent ?? 0,
                  type: 'plagiarism'
                })) : [],
                sourceCount: report.sources ? report.sources.length : 0
              });
              setScanning(false);
            }, 300);
          } else if (statusData.status === 'Pending') {
            const simulatedProgress = Math.min(95, Math.round((pollAttempts / maxAttempts) * 100));
            setScanProgress(simulatedProgress);
          } else if (pollAttempts >= maxAttempts) {
            clearInterval(intervalId);
            setScanning(false);
            setShowProgressModal(false);
            showToastMessage('error', 'Hết thời gian chờ phản hồi từ hệ thống kiểm tra đạo văn.');
          }
        } catch (pollErr) {
          clearInterval(intervalId);
          setScanning(false);
          setShowProgressModal(false);
        }
      }, 1500);
      return;
    } catch (backendErr) {
      console.error(backendErr);
      setScanning(false);
      setShowProgressModal(false);
      showToastMessage('error', 'Không thể kết nối đến máy chủ backend để thực hiện quét đạo văn.');
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const { data } = await thesisService.testDriveConnection();
      setTestResult({
        success: data.success,
        message: data.message,
        driveFileName: data.driveFileName,
        driveFileId: data.driveFileId,
        webViewLink: data.webViewLink,
        relativePath: data.relativePath
      });
    } catch (err) {
      console.error(err);
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message
      });
    } finally {
      setTestingConnection(false);
      loadDriveStatus();
    }
  };

  const loadDriveStatus = async () => {
    try {
      const { data } = await thesisService.getDriveStatus();
      setDriveStatus(data);
    } catch (err) {
      console.error('Error loading drive status:', err);
    }
  };

  const openReviewsModal = async (thesis) => {
    setSelectedThesisForReviews(thesis);
    setUpdateStatusVal(thesis.status || 'Pending');
    setThesisReviews([]);
    setReviewsVisible(true);
    setLoadingReviews(true);
    try {
      const res = await thesisService.getReviews(thesis.id);
      setThesisReviews(res.data || []);
    } catch (err) {
      console.error('Error loading reviews:', err);
      showToastMessage('error', 'Không thể tải ý kiến đánh giá từ giảng viên.');
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedThesisForReviews) return;
    setUpdatingStatus(true);
    try {
      const payload = {
        title:       selectedThesisForReviews.title,
        description: selectedThesisForReviews.description,
        major:       selectedThesisForReviews.major,
        subject:     selectedThesisForReviews.subject,
        subjectCode: selectedThesisForReviews.subjectCode,
        category:    selectedThesisForReviews.category,
        studentId:   selectedThesisForReviews.studentId,
        advisorId:   selectedThesisForReviews.advisorId,
        status:      updateStatusVal,
        batch:       selectedThesisForReviews.batch || 1,
        filePath:    selectedThesisForReviews.filePath,
      };
      await thesisService.update(selectedThesisForReviews.id, payload);
      showToastMessage('success', 'Cập nhật trạng thái đề tài thành công!');
      // Update local state
      setTheses(prev => prev.map(t => t.id === selectedThesisForReviews.id ? { ...t, status: updateStatusVal } : t));
      setSelectedThesisForReviews(prev => ({ ...prev, status: updateStatusVal }));
    } catch (err) {
      console.error('Error updating status:', err);
      showToastMessage('error', 'Lỗi khi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const students = useMemo(() => Array.isArray(users) ? users.filter(u => u.role === 'Student') : [], [users]);
  const advisors = useMemo(() => Array.isArray(users) ? users.filter(u => u.role === 'Advisor') : [], [users]);

  // Subjects available based on currently selected major (only for Project)
  const subjectsForMajor = useMemo(() => SUBJECTS_BY_MAJOR[form.major] || [], [form.major]);

  const loadUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    }
  };

  const loadTheses = async () => {
    setLoading(true);
    try {
      const res = await thesisService.getAll({
        page,
        pageSize,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: catConfig.code,
        batch: batchFilter !== 'all' ? parseInt(batchFilter) : undefined,
      });
      let items = res.data.items || [];
      if (majorFilter !== 'all') items = items.filter(t => t.major === majorFilter);
      setTheses(items);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error('Error loading theses:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlagiarismRequests = () => {
    try {
      const list = JSON.parse(localStorage.getItem('lecturer_plagiarism_requests') || '[]');
      setPlagiarismRequests(list.filter(r => !r.isProcessed));
    } catch (e) {
      console.error(e);
      setPlagiarismRequests([]);
    }
  };

  const handleProcessRequest = async (request, decision) => {
    try {
      let thesisId = null;
      const thesis = theses.find(t => 
        t.title.toLowerCase().trim() === request.title.toLowerCase().trim() ||
        t.id === request.submissionId ||
        `sub-${t.id}` === request.submissionId
      );
      
      if (thesis) {
        thesisId = thesis.id;
      } else {
        const rawId = request.submissionId;
        if (typeof rawId === 'string') {
          const match = rawId.match(/\d+/);
          if (match) {
            thesisId = parseInt(match[0], 10);
          }
        } else if (typeof rawId === 'number') {
          thesisId = rawId;
        }
      }

      if (thesisId) {
        const payload = {
          title:       thesis ? thesis.title : request.title,
          description: thesis ? thesis.description : '',
          major:       thesis ? thesis.major : 'ai',
          subject:     thesis ? thesis.subject : '',
          subjectCode: thesis ? thesis.subjectCode : '',
          category:    thesis ? thesis.category : catConfig.code,
          studentId:   thesis ? thesis.studentId : 1,
          advisorId:   thesis ? thesis.advisorId : null,
          status:      decision,
          batch:       thesis ? thesis.batch : 1,
          filePath:    thesis ? thesis.filePath : '',
        };
        await thesisService.update(thesisId, payload);
      }

      const list = JSON.parse(localStorage.getItem('lecturer_plagiarism_requests') || '[]');
      const updatedList = list.map(r => r.id === request.id ? { ...r, isProcessed: true, decision: decision } : r);
      localStorage.setItem('lecturer_plagiarism_requests', JSON.stringify(updatedList));
      
      showToastMessage('success', `Đã xử lý yêu cầu đạo văn thành công (Kết quả: ${decision === 'Approved' ? 'Thông qua' : decision === 'Revision' ? 'Sửa đổi' : 'Hủy bỏ'})!`);
      loadPlagiarismRequests();
      loadTheses();
      
      window.dispatchEvent(new Event('admin-content-updated'));
    } catch (err) {
      console.error('Error processing request:', err);
      showToastMessage('error', 'Lỗi khi xử lý yêu cầu.');
    }
  };

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { setPage(1); loadTheses(); }, [category, search, statusFilter, majorFilter, batchFilter]);
  useEffect(() => { loadTheses(); }, [page]);

  useEffect(() => {
    loadPlagiarismRequests();
    const handleSync = () => {
      loadPlagiarismRequests();
    };
    window.addEventListener('admin-content-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('admin-content-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  useEffect(() => {
    if (isProject) {
      loadDriveStatus();
      const t = setInterval(loadDriveStatus, 60_000);
      return () => clearInterval(t);
    }
  }, [isProject]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleConnected = params.get('google_connected');
    const oauthError = params.get('error');

    if (googleConnected === 'true') {
      showToastMessage('success', 'Kết nối Google Drive thành công! Dung lượng lưu trữ của bạn hiện đã được áp dụng.');
      window.history.replaceState({}, document.title, window.location.pathname);
      loadDriveStatus();
    } else if (googleConnected === 'false') {
      showToastMessage('error', `Kết nối Google Drive thất bại: ${oauthError || 'Unknown error'}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleOpenCreate = () => {
    setForm(emptyForm(catConfig.code));
    setError('');
    setModal({ mode: 'create' });
  };

  const handleOpenEdit = (thesis) => {
    setForm({
      title:       thesis.title,
      description: thesis.description || '',
      major:       thesis.major || 'ai',
      subject:     thesis.subject || '',
      subjectCode: thesis.subjectCode || '',
      category:    thesis.category || catConfig.code,
      studentId:   thesis.studentId,
      studentName: thesis.studentName || '',
      advisorId:   thesis.advisorId || '',
      status:      thesis.status || 'Pending',
      batch:       thesis.batch || 1,
      filePath:    thesis.filePath || '',
      submissions: thesis.submissions || [],
    });
    setError('');
    setModal({ mode: 'edit', id: thesis.id });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Tiêu đề không được để trống.'); return; }
    if (!form.studentId)    { setError('Vui lòng chọn sinh viên thực hiện.'); return; }
    if (isProject && !form.subject) { setError('Vui lòng chọn học phần.'); return; }

    setSaving(true);
    try {
      const payload = {
        title:       form.title,
        description: form.description,
        major:       form.major,
        subject:     isProject ? form.subject : '',
        subjectCode: isProject ? form.subjectCode : '',
        category:    form.category,
        studentId:   parseInt(form.studentId),
        advisorId:   form.advisorId ? parseInt(form.advisorId) : null,
        status:      form.status,
        batch:       parseInt(form.batch) || 1,
        filePath:    form.filePath,
      };
      if (modal.mode === 'create') {
        await thesisService.create(payload);
      } else {
        await thesisService.update(modal.id, payload);
      }
      setModal(null);
      loadTheses();
    } catch (err) {
      console.error('Error saving thesis:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu đề tài.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm('Bạn có chắc muốn xóa đề tài này?', async () => {
      try {
        await thesisService.delete(id);
        loadTheses();
        showToastMessage('success', 'Đã xóa đề tài thành công!');
      } catch (err) {
        console.error('Error deleting thesis:', err);
        showToastMessage('error', 'Không thể xóa đề tài này.');
      }
    });
  };

  const setFormField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // When major changes in Project form, reset subject
  const handleMajorChange = (newMajor) => {
    setForm(prev => ({ ...prev, major: newMajor, subject: '', subjectCode: '' }));
  };

  // When subject selected in Project form, auto-fill name + code
  const handleSubjectSelect = (subjectName) => {
    const found = subjectsForMajor.find(s => s.name === subjectName);
    setForm(prev => ({
      ...prev,
      subject:     subjectName,
      subjectCode: found ? found.code : '',
    }));
  };

  return (
    <div className="w-full space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">{catConfig.title}</h1>
          <p className="text-slate-400 text-sm">
            Quản lý danh sách, phân công giảng viên & trạng thái duyệt đề tài
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {plagiarismRequests.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRequestsModal(true)}
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase transition-all flex items-center gap-1.5 animate-pulse cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-[16px]">notifications_active</span>
              Yêu cầu Đạo văn ({plagiarismRequests.length})
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase transition-colors"
          >
            + Thêm đề tài mới
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400">{error}</div>
      )}

      {isProject && (
        <DriveLookupPanel 
          status={driveStatus} 
          onRefresh={loadDriveStatus} 
          onTestConnection={handleTestConnection}
          testingConnection={testingConnection}
        />
      )}

      {/* Filter panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900">
        <label className="text-[10px] font-bold text-slate-500 uppercase sm:col-span-2 lg:col-span-1">
          Tìm kiếm
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tên đề tài, tên sinh viên..."
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
          />
        </label>
  
        <label className="text-[10px] font-bold text-slate-500 uppercase">
          Chuyên ngành
          <select value={majorFilter} onChange={e => setMajorFilter(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none">
            <option value="all">Tất cả ngành</option>
            {Object.entries(MAJOR_DISPLAY).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>

        <label className="text-[10px] font-bold text-slate-500 uppercase">
          Đợt đăng ký
          <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none">
            <option value="all">Tất cả đợt</option>
            <option value="1">Đợt 1</option>
            <option value="2">Đợt 2</option>
          </select>
        </label>

        <div className="flex items-end">
          <button type="button"
            onClick={() => { setSearch(''); setStatusFilter('all'); setMajorFilter('all'); setBatchFilter('all'); }}
            className="w-full py-2 rounded-lg border border-slate-600 hover:border-slate-500 text-slate-300 text-xs font-bold transition-colors">
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Đang tải danh sách...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="text-left p-4 w-[45%] min-w-[340px]">Thông tin đề tài</th>
                  <th className="text-left p-4 w-[18%] min-w-[150px]">Sinh viên thực hiện</th>
                  <th className="text-left p-4 w-[15%] min-w-[140px]">GV Hướng dẫn</th>
                  <th className="text-left p-4 w-[12%] min-w-[100px]">Trạng thái</th>
                  <th className="text-right p-4 w-[10%] min-w-[160px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {theses.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 w-[45%] min-w-[340px]">
                      <div className="space-y-1.5">
                        <div className="font-bold text-white leading-snug flex items-start gap-2">
                          <span className="text-slate-100 hover:text-amber-400 transition-colors cursor-pointer">{t.title}</span>
                          <span className="shrink-0 text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25 mt-0.5">
                            Đợt {t.batch || 1}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[9px] mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-850 text-slate-350 font-semibold border border-slate-800">
                            {MAJOR_DISPLAY[t.major] || t.major}
                          </span>
                          {t.subject && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-850/50 text-slate-400 border border-slate-800/30">
                              {t.subject} {t.subjectCode && `(${t.subjectCode})`}
                            </span>
                          )}
                        </div>
                        {t.description ? (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed" title={t.description}>
                            {t.description}
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-600 italic">Không có mô tả chi tiết.</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 w-[18%] min-w-[150px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                          {t.studentName ? t.studentName.split(' ').pop().charAt(0) : '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200 leading-none">{t.studentName}</div>
                          <div className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-wider">{t.studentCode || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 w-[15%] min-w-[140px]">
                      {t.advisorName ? (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[15px] text-slate-400">person</span>
                          <span className="font-semibold text-slate-200">{t.advisorName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Chưa chỉ định</span>
                      )}
                    </td>
                    <td className="p-4 w-[12%] min-w-[130px]">
                      <div className="flex flex-col gap-1.5 items-start">
                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full ${STATUS_BADGES[t.status] || 'bg-slate-700/20 text-slate-400 border border-slate-700/30'}`}>
                          <span className={`w-1 h-1 rounded-full ${
                            t.status === 'Approved' ? 'bg-emerald-400' :
                            t.status === 'Rejected' ? 'bg-red-400' :
                            t.status === 'Revision' ? 'bg-orange-400' :
                            t.status === 'Submitted' ? 'bg-purple-400' :
                            t.status === 'InProgress' ? 'bg-blue-400' : 'bg-yellow-400'
                          }`} />
                          {t.status}
                        </span>

                        {/* Plagiarism Badge */}
                        {t.plagiarismSimilarity !== undefined && t.plagiarismSimilarity !== null ? (
                          <span className={`inline-flex items-center gap-1 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                            t.plagiarismSimilarity >= 50 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                              : t.plagiarismSimilarity >= 25 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' 
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          }`}>
                            <span className="material-symbols-outlined text-[11px] shrink-0">radar</span>
                            Đạo văn: {t.plagiarismSimilarity}%
                          </span>
                        ) : (
                          t.status === 'UnderReview' ? (
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded border bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse uppercase">
                              <span className="material-symbols-outlined text-[11px] shrink-0">sync</span>
                              Đang quét...
                            </span>
                          ) : null
                        )}

                        {/* Plagiarism Request Pending Badge */}
                        {(() => {
                          const list = JSON.parse(localStorage.getItem('lecturer_plagiarism_requests') || '[]');
                          const req = list.find(r => !r.isProcessed && (r.submissionId === t.id || r.title === t.title));
                          if (req) {
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowRequestsModal(true);
                                }}
                                className="inline-flex items-center gap-1 text-[9.5px] font-black px-1.5 py-0.5 rounded border bg-orange-600 hover:bg-orange-500 text-white border-orange-500 animate-pulse uppercase cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[11px] shrink-0">notifications_active</span>
                                Chờ duyệt đạo văn
                              </button>
                            );
                          }
                          return null;
                        })()}

                        {/* Review Score Badge */}
                        {t.reviewCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/25 uppercase">
                            <span className="material-symbols-outlined text-[11px] shrink-0">rate_review</span>
                            Điểm: {t.latestScore !== null && t.latestScore !== undefined ? t.latestScore : '—'} ({t.reviewCount} GV)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap w-[10%] min-w-[160px]">
                      <button type="button" onClick={() => openReviewsModal(t)} title="Ý kiến GV & Phê duyệt"
                        className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 transition-all inline-flex items-center justify-center cursor-pointer">
                        <span className="material-symbols-outlined text-[16px]">rate_review</span>
                      </button>
                      <button type="button" onClick={() => openPlagiarismModal(t)} title="Kiểm tra Đạo văn"
                        className="p-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 hover:border-teal-500/40 transition-all inline-flex items-center justify-center cursor-pointer">
                        <span className="material-symbols-outlined text-[16px]">radar</span>
                      </button>
                      <button type="button" onClick={() => handleOpenEdit(t)} title="Chỉnh sửa đề tài"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white border border-slate-700 hover:border-slate-600 transition-all inline-flex items-center justify-center cursor-pointer">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button type="button" onClick={() => handleDelete(t.id)} title="Xóa đề tài"
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/45 transition-all inline-flex items-center justify-center cursor-pointer">
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {theses.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-semibold">Không tìm thấy đề tài nào phù hợp.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">Hiển thị {theses.length} / {totalCount} kết quả</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-50">
              Trang trước
            </button>
            <button disabled={page * pageSize >= totalCount} onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-50">
              Trang sau
            </button>
          </div>
        </div>
      )}

      {/* Modal Connection Test Result */}
      {testResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 text-left shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-base font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <span className="material-symbols-outlined">
                  {testResult.success ? 'check_circle' : 'error'}
                </span>
                Kết quả kiểm tra Drive
              </h2>
              <button type="button" onClick={() => setTestResult(null)}
                className="material-symbols-outlined text-slate-400 hover:text-white">close</button>
            </div>

            <div className="space-y-3">
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                testResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                <span className="material-symbols-outlined shrink-0 mt-0.5">
                  {testResult.success ? 'cloud_done' : 'cloud_off'}
                </span>
                <div>
                  <p className="font-bold text-sm">
                    {testResult.success ? 'Kết nối thành công!' : 'Kết nối thất bại!'}
                  </p>
                  <p className="text-xs mt-1 text-slate-300 text-left whitespace-pre-wrap break-words">
                    {testResult.message}
                  </p>
                </div>
              </div>

              {testResult.success && (
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Tên file test:</span>
                      <span className="text-slate-300 font-mono select-all truncate max-w-[200px]" title={testResult.driveFileName}>
                        {testResult.driveFileName}
                      </span>
                    </div>
                    {testResult.driveFileId && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Drive File ID:</span>
                        <span className="text-slate-300 font-mono select-all truncate max-w-[200px]" title={testResult.driveFileId}>
                          {testResult.driveFileId}
                        </span>
                      </div>
                    )}
                    {testResult.relativePath && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Đường dẫn:</span>
                        <span className="text-slate-300 select-all truncate max-w-[200px]" title={testResult.relativePath}>
                          {testResult.relativePath}
                        </span>
                      </div>
                    )}
                  </div>

                  {testResult.webViewLink && (
                    <a 
                      href={testResult.webViewLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md text-center"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      Mở file trên Google Drive
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setTestResult(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal create/edit */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form onSubmit={handleSave}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto text-left shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-base font-black uppercase tracking-wider text-amber-400">
                {modal.mode === 'create' ? 'Tạo đề tài mới' : 'Chỉnh sửa đề tài'}
              </h2>
              <button type="button" onClick={() => setModal(null)}
                className="material-symbols-outlined text-slate-400 hover:text-white">close</button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400">{error}</div>
            )}

            <div className="space-y-4">
              {/* Tiêu đề */}
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Tên đề tài *
                <input required value={form.title} onChange={e => setFormField('title', e.target.value)}
                  placeholder="Nhập tiêu đề đầy đủ..."
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500" />
              </label>

              {/* Mô tả */}
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Tóm tắt & mô tả
                <textarea rows={3} value={form.description} onChange={e => setFormField('description', e.target.value)}
                  placeholder="Tóm tắt ngắn gọn nội dung..."
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500 resize-none" />
              </label>

              {/* Sinh viên + Giảng viên */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Sinh viên thực hiện *
                  {modal.mode === 'edit' ? (
                    <div className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 text-xs cursor-not-allowed">
                      {form.studentName || `ID: ${form.studentId}`}
                      <span className="ml-2 text-[10px] text-slate-500">(không thay đổi)</span>
                    </div>
                  ) : (
                    <select required value={form.studentId} onChange={e => setFormField('studentId', e.target.value)}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                      <option value="">-- Chọn sinh viên --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.fullName} ({s.studentId || s.email})</option>
                      ))}
                    </select>
                  )}
                </label>

                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Giảng viên hướng dẫn
                  <select value={form.advisorId} onChange={e => setFormField('advisorId', e.target.value)}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                    <option value="">-- Chưa chỉ định --</option>
                    {advisors.map(a => (
                      <option key={a.id} value={a.id}>{a.fullName}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Chuyên ngành + Đợt đăng ký */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Chuyên ngành
                  <select value={form.major} onChange={e => handleMajorChange(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                    {Object.entries(MAJOR_DISPLAY).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Đợt đăng ký
                  <select value={form.batch} onChange={e => setFormField('batch', parseInt(e.target.value))}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                    <option value="1">Đợt 1</option>
                    <option value="2">Đợt 2</option>
                  </select>
                </label>
              </div>

              {/* Trạng thái đề tài */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Trạng thái đề tài
                  <select value={form.status} onChange={e => setFormField('status', e.target.value)}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                    <option value="Pending">Pending (Chờ duyệt)</option>
                    <option value="InProgress">InProgress (Đang thực hiện)</option>
                    <option value="Submitted">Submitted (Đã nộp báo cáo)</option>
                    <option value="Approved">Approved (Đã thông qua)</option>
                    <option value="Rejected">Rejected (Bị từ chối)</option>
                    <option value="Revision">Revision (Yêu cầu chỉnh sửa)</option>
                  </select>
                </label>
              </div>

              {/* Học phần — CHỈ HIỆN VỚI ĐỒ ÁN */}
              {isProject && (
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-400/80 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">menu_book</span>
                    Học phần *
                  </p>
                  <select
                    required={isProject}
                    value={form.subject}
                    onChange={e => handleSubjectSelect(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Chọn học phần --</option>
                    {subjectsForMajor.map(s => (
                      <option key={s.code} value={s.name}>{s.name} — {s.code}</option>
                    ))}
                  </select>
                  {form.subjectCode && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Mã học phần:</span>
                      <span className="text-[11px] font-black font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        {form.subjectCode}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Danh sách tài liệu đính kèm (Submissions) */}
              {modal.mode === 'edit' && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">folder_open</span>
                    Danh sách tài liệu đính kèm ({form.submissions?.length || 0})
                  </p>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {form.submissions && form.submissions.length > 0 ? (
                      form.submissions.map((sub, idx) => (
                        <div key={sub.id || idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`material-symbols-outlined text-lg shrink-0 ${
                              sub.fileName.toLowerCase().endsWith('.pdf') ? 'text-red-400' :
                              sub.fileName.toLowerCase().endsWith('.xlsx') || sub.fileName.toLowerCase().endsWith('.xls') ? 'text-emerald-400' :
                              sub.fileName.toLowerCase().endsWith('.mp4') || sub.fileName.toLowerCase().endsWith('.mkv') ? 'text-blue-400' : 'text-slate-400'
                            }`}>
                              {sub.fileName.toLowerCase().endsWith('.pdf') ? 'description' :
                               sub.fileName.toLowerCase().endsWith('.xlsx') || sub.fileName.toLowerCase().endsWith('.xls') ? 'table_chart' :
                               sub.fileName.toLowerCase().endsWith('.mp4') || sub.fileName.toLowerCase().endsWith('.mkv') ? 'video_file' : 'draft'}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-200 truncate max-w-[200px]" title={sub.fileName}>
                                {sub.fileName}
                              </p>
                              <p className="text-[9px] text-slate-500 mt-0.5">
                                {(sub.fileSize / 1024).toFixed(1)} KB · {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleDownload(sub.filePath, sub.fileName)}
                            className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors shrink-0 cursor-pointer border-none"
                          >
                            <span className="material-symbols-outlined text-[11px]">download</span>
                            Tải về
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 border-dashed text-center text-slate-500 text-xs py-4">
                        Chưa có tài liệu đính kèm.
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tải lên tài liệu mới (PDF, Excel, Video, ...)</p>
                    <input
                      type="file"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        try {
                          const res = await thesisService.upload(modal.id, file);
                          // Refresh thesis to get updated submissions list
                          const detailRes = await thesisService.getById(modal.id);
                          const updatedThesis = detailRes.data;
                          setFormField('filePath', updatedThesis.filePath);
                          setFormField('submissions', updatedThesis.submissions || []);
                          showToastMessage('success', 'Tải lên tài liệu thành công!');
                        } catch (err) {
                          console.error(err);
                          showToastMessage('error', 'Tải lên thất bại: ' + (err.response?.data?.message || err.message));
                        }
                      }}
                      className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button type="submit" disabled={saving}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-wider text-xs transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
                {saving ? 'Đang lưu...' : 'Lưu lại'}
              </button>
              <button type="button" onClick={() => setModal(null)}
                className="flex-1 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-black uppercase tracking-wider text-xs transition-colors">
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      )}

      {scanVisible && selectedThesisForScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 text-left shadow-2xl my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-amber-400">Phân tích tương đồng & Đạo văn (Admin)</h2>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">Đề tài: {selectedThesisForScan.title}</p>
              </div>
              <button type="button" onClick={() => { setScanVisible(false); setSelectedThesisForScan(null); }}
                className="material-symbols-outlined text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">close</button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950/40">
                <div>
                  <p className="text-xs font-bold text-slate-300">Sinh viên thực hiện: {selectedThesisForScan.studentName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Sinh viên ID: {selectedThesisForScan.studentCode || '—'} · Trạng thái: {selectedThesisForScan.status}</p>
                </div>
                <button
                  type="button"
                  onClick={runAdminRecheck}
                  disabled={scanning}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm ${
                    scanning
                      ? 'bg-slate-800 text-slate-500 cursor-wait'
                      : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  }`}
                >
                  <span className={`material-symbols-outlined text-base ${scanning ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  {scanning ? 'Đang chạy...' : 'Quét / Quét lại'}
                </button>
              </div>

              {scanning && !showProgressModal ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-wider">Đang kết nối cơ sở dữ liệu...</span>
                </div>
              ) : !scanResult ? (
                <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20 text-slate-500 space-y-2">
                  <span className="material-symbols-outlined text-4xl text-slate-700">document_scanner</span>
                  <p className="text-sm font-bold">Chưa có kết quả phân tích đạo văn</p>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">Vui lòng nhấn nút "Quét / Quét lại" ở góc trên bên phải để bắt đầu chạy kiểm tra tương đồng bằng các thuật toán.</p>
                </div>
              ) : (
                <div className="bg-slate-950/30 rounded-xl p-3 border border-slate-800 text-slate-800">
                  <PlagiarismScanResultPanel
                    submission={{ ...selectedThesisForScan, ...(scanResult || {}) }}
                    visible={true}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => { setScanVisible(false); setSelectedThesisForScan(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {showProgressModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-400 animate-bounce">
              <span className="material-symbols-outlined text-2xl">radar</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Đang quét đạo văn...</h3>
              <p className="text-[11px] text-slate-400 mt-1">Đang phân tích cấu trúc, đối chiếu các nguồn dữ liệu & thuật toán.</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>Tiến độ</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-750">
                <div 
                  className="h-full rounded-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
            <p className="text-[9px] text-slate-500 font-medium">Hệ thống đang chạy các thuật toán BM25, N-Gram, TF-IDF + Cosine, Rule-Based.</p>
          </div>
        </div>
      )}

      {reviewsVisible && selectedThesisForReviews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto text-left shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-amber-400">
                  Ý kiến đánh giá & Trạng thái phê duyệt
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Đề tài: {selectedThesisForReviews.title}
                </p>
              </div>
              <button type="button" onClick={() => { setReviewsVisible(false); setSelectedThesisForReviews(null); }}
                className="material-symbols-outlined text-slate-400 hover:text-white">close</button>
            </div>

            <div className="space-y-4">
              {/* Thesis Info summary */}
              <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Sinh viên thực hiện:</span>
                  <p className="font-bold text-slate-200 mt-0.5">{selectedThesisForReviews.studentName} ({selectedThesisForReviews.studentCode || '—'})</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Giảng viên hướng dẫn:</span>
                  <p className="font-bold text-slate-200 mt-0.5">{selectedThesisForReviews.advisorName || '—'}</p>
                </div>
              </div>

              {/* Plagiarism Request Notice inside Reviews Modal */}
              {(() => {
                const list = JSON.parse(localStorage.getItem('lecturer_plagiarism_requests') || '[]');
                const req = list.find(r => !r.isProcessed && (r.submissionId === selectedThesisForReviews.id || r.title === selectedThesisForReviews.title));
                if (req) {
                  return (
                    <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/30 text-xs space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-1.5 text-orange-400 font-bold uppercase tracking-wider text-[10px]">
                          <span className="material-symbols-outlined text-sm animate-pulse">notifications_active</span>
                          Yêu cầu giải trình đạo văn đang chờ duyệt
                        </div>
                        {req.isUrgent && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-[8px] font-black uppercase tracking-widest animate-pulse">
                            Khẩn cấp
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-950/30 p-2.5 rounded-lg border border-slate-800 text-[10px]">
                        <div>
                          <span className="text-slate-500 uppercase font-semibold">Tỷ lệ trùng lặp:</span>
                          <span className="text-red-400 font-bold ml-1">{req.similarity}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase font-semibold">AI tạo:</span>
                          <span className="text-sky-400 font-bold ml-1">{req.aiPercent}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase font-semibold">Tình huống:</span>
                          <span className="text-amber-400 font-bold ml-1">
                            {req.caseType === 'ignore' ? 'Đặc cách bỏ qua' : req.caseType === 'deep' ? 'Đối chiếu sâu' : 'Kỷ luật/Hủy'}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950/15 border border-slate-850/50">
                        <span className="text-slate-500 font-semibold block text-[9px] uppercase">Lý do giải trình của Giảng viên:</span>
                        <p className="text-xs text-slate-300 italic mt-0.5">"{req.customNote || 'Không có ghi chú.'}"</p>
                      </div>

                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setReviewsVisible(false);
                            handleProcessRequest(req, 'Approved');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          Duyệt thông qua
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewsVisible(false);
                            handleProcessRequest(req, 'Revision');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">edit_note</span>
                          Yêu cầu sửa đổi
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* List of Lecturer Reviews */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">rate_review</span>
                  Ý kiến đánh giá từ Giảng viên ({thesisReviews.length})
                </p>

                {loadingReviews ? (
                  <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span>Đang tải đánh giá từ database...</span>
                  </div>
                ) : thesisReviews.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {thesisReviews.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-200">{rev.reviewerName}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">
                              Đã đánh giá: {new Date(rev.reviewedAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              rev.decision === 'Approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              rev.decision === 'Rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            }`}>
                              {rev.decision}
                            </span>
                            {rev.score !== null && (
                              <span className="text-xs font-black text-amber-400 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-800">
                                {rev.score} / 10
                              </span>
                            )}
                          </div>
                        </div>

                        {rev.comments ? (
                          <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-850/60 leading-relaxed whitespace-pre-line">
                            {rev.comments}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">Không có nhận xét bằng văn bản.</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 border-dashed text-center text-xs text-slate-500">
                    Chưa có đánh giá hoặc ý kiến phản hồi nào được ghi nhận cho đề tài này.
                  </div>
                )}
              </div>

              {/* Submissions Section */}
              {selectedThesisForReviews.submissions && selectedThesisForReviews.submissions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">drafts</span>
                    Tài liệu đính kèm ({selectedThesisForReviews.submissions.length})
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedThesisForReviews.submissions.map((sub, idx) => (
                      <div key={sub.id || idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-slate-400">description</span>
                          <p className="text-xs font-semibold text-slate-300 truncate max-w-[300px]">{sub.fileName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownload(sub.filePath, sub.fileName)}
                          className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors border-none cursor-pointer"
                        >
                          Tải về
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin decision/status update */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">gavel</span>
                  Cập nhật trạng thái phê duyệt (Admin)
                </p>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <select
                      value={updateStatusVal}
                      onChange={(e) => setUpdateStatusVal(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="Pending">Pending (Chờ duyệt)</option>
                      <option value="InProgress">InProgress (Đang thực hiện)</option>
                      <option value="Submitted">Submitted (Đã nộp báo cáo)</option>
                      <option value="Approved">Approved (Đã thông qua)</option>
                      <option value="Rejected">Rejected (Bị từ chối)</option>
                      <option value="Revision">Revision (Yêu cầu chỉnh sửa)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-1"
                  >
                    {updatingStatus && <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
                    Cập nhật
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => { setReviewsVisible(false); setSelectedThesisForReviews(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase rounded-lg transition-colors border-none cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] p-4 rounded-xl border flex items-center gap-3 shadow-2xl animate-in slide-in-from-bottom-5 duration-300 bg-slate-900 border-slate-800">
          <span className={`material-symbols-outlined ${toast.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-xs font-semibold text-slate-200">{toast.message}</span>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-[2rem] shadow-2xl max-w-sm w-full p-6 animate-in scale-in-95 duration-200 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <span className="material-symbols-outlined text-2xl">
                warning
              </span>
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
              Xác nhận hành động
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold mb-6">
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all shadow"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plagiarism Requests Modal */}
      {showRequestsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowRequestsModal(false)} />
          <div className="relative w-full max-w-2xl bg-[#16161c] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-800/80 bg-gradient-to-r from-orange-950/30 to-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black uppercase tracking-widest text-orange-400">Yêu cầu Đạo văn từ Giảng viên</h3>
                  <p className="text-[10px] text-slate-400 uppercase mt-0.5 tracking-wider">Danh sách yêu cầu phê duyệt đặc cách hoặc đối chiếu sâu</p>
                </div>
              </div>
              <button onClick={() => setShowRequestsModal(false)} className="material-symbols-outlined text-slate-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent">
                close
              </button>
            </div>

            {/* List */}
            <div className="p-6 max-h-[450px] overflow-y-auto space-y-4">
              {plagiarismRequests.map((req) => (
                <div key={req.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-4">
                  {/* Top line info */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-white leading-snug">{req.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Sinh viên: <span className="text-slate-350 font-bold">{req.student}</span> · Giảng viên gửi: <span className="text-orange-400 font-bold">{req.lecturer}</span>
                      </p>
                    </div>
                    {req.isUrgent && (
                      <span className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/20 text-red-400 text-[8px] font-black uppercase tracking-widest animate-pulse shrink-0">
                        Khẩn cấp
                      </span>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2.5 bg-slate-950/40 p-3 rounded-xl border border-slate-900/60 text-left">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Trùng lặp</span>
                      <span className="text-xs font-extrabold text-red-400">{req.similarity}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">AI tạo</span>
                      <span className="text-xs font-extrabold text-sky-400">{req.aiPercent}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase font-bold">Loại yêu cầu</span>
                      <span className="text-[9.5px] font-extrabold text-amber-400 uppercase tracking-wider truncate block">
                        {req.caseType === 'ignore' ? 'Đặc cách bỏ qua' : req.caseType === 'deep' ? 'Đối chiếu sâu' : 'Kỷ luật/Hủy'}
                      </span>
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-850/60 text-left">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold mb-1">Ý kiến / Giải trình của giảng viên</span>
                    <p className="text-xs text-slate-300 italic font-medium leading-relaxed">
                      "{req.customNote || 'Không có ghi chú chi tiết.'}"
                    </p>
                    <p className="text-[9px] text-slate-500 text-right mt-2 font-bold uppercase">{req.timestamp}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                    <button
                      type="button"
                      onClick={() => handleProcessRequest(req, 'Approved')}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border-none"
                    >
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      Duyệt thông qua
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProcessRequest(req, 'Revision')}
                      className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border-none"
                    >
                      <span className="material-symbols-outlined text-xs">edit_note</span>
                      Yêu cầu Sửa đổi
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProcessRequest(req, 'Rejected')}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/25 hover:border-rose-500/40 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">cancel</span>
                      Từ chối / Hủy
                    </button>
                  </div>
                </div>
              ))}
              {plagiarismRequests.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <span className="material-symbols-outlined text-4xl opacity-30 block mb-2">task_alt</span>
                  <p className="text-sm font-semibold">Tất cả yêu cầu đã được xử lý xong!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminThesesPage;
