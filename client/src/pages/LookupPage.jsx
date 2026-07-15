import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { thesisService, API_URL, resolveFileUrl } from '../services/api';
import useLanguage from '../hooks/useLanguage';
import { getMajorDefaultImage } from '../utils/majorImages';

// ─── Type config (colours + filters) ────────────────────────────────────────
const getTypeConfig = (lang) => {
  const isEn = lang === 'en';
  return {
    'do-an': {
      label: isEn ? 'Course Project' : 'Đồ Án Môn Học',
      icon: 'engineering',
      desc: isEn ? 'Practice & Application' : 'Thực hành & Ứng dụng',
      filterLabel: isEn ? 'Filter by Major' : 'Lọc theo Chuyên ngành',
      filterIcon: 'account_tree',
      // Very faint blobs — no glare
      blob1: 'bg-blue-300/6',
      blob2: 'bg-sky-300/5',
      // Badge (top of page)
      badgeBg: 'bg-blue-50 border-blue-100 text-blue-600',
      badgeIcon: 'text-blue-500',
      // H1 accent — use softer shade
      accentText: 'text-blue-500',
      // Banner card (replaces gradient strip)
      accentBorder: 'border-blue-100',
      bannerCard: 'bg-blue-50 border border-blue-200',
      bannerIconBg: 'bg-blue-500',
      bannerLabel: 'text-blue-800',
      bannerDesc: 'text-blue-500',
      // Filter section divider
      divider: 'bg-blue-200',
      // Chips — muted, no shadow
      chipActive: 'bg-blue-500 text-white',
      chipIdle: 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50 hover:border-blue-300',
      // Card top accent line
      cardAccent: 'from-blue-200/20 via-blue-400/30 to-blue-200/20',
      countColor: 'text-blue-500',
      filters: [
        { label: isEn ? 'All' : 'Tất cả', value: null, icon: 'apps' },
        { label: isEn ? 'Artificial Intelligence' : 'Trí tuệ nhân tạo', value: 'ai', icon: 'smart_toy' },
        { label: isEn ? 'Computer Networks' : 'Mạng máy tính', value: 'networking', icon: 'lan' },
        { label: isEn ? 'Enterprise Info Systems' : 'Hệ thống thông tin DN', value: 'is', icon: 'account_tree' },
        { label: isEn ? 'Cyber Security' : 'An toàn không gian mạng', value: 'security', icon: 'security' },
        { label: isEn ? 'Programming Techniques' : 'Kỹ thuật lập trình', value: 'programming', icon: 'code' },
      ],
    },
    'khoa-luan': {
      label: isEn ? 'Graduation Thesis' : 'Khóa luận (Tốt nghiệp)',
      icon: 'school',
      desc: isEn ? 'In-depth Research' : 'Nghiên cứu chuyên sâu',
      filterLabel: isEn ? 'Filter by Major' : 'Lọc theo Chuyên ngành',
      filterIcon: 'account_tree',
      blob1: 'bg-violet-300/6',
      blob2: 'bg-purple-300/5',
      badgeBg: 'bg-violet-50 border-violet-100 text-violet-600',
      badgeIcon: 'text-violet-500',
      accentText: 'text-violet-500',
      bannerCard: 'bg-violet-50 border border-violet-200',
      bannerIconBg: 'bg-violet-500',
      bannerLabel: 'text-violet-800',
      bannerDesc: 'text-violet-500',
      divider: 'bg-violet-200',
      chipActive: 'bg-violet-500 text-white',
      chipIdle: 'bg-white text-violet-600 border border-violet-100 hover:bg-violet-50 hover:border-violet-300',
      cardAccent: 'from-violet-200/20 via-violet-400/30 to-violet-200/20',
      countColor: 'text-violet-500',
      filters: [
        { label: isEn ? 'All' : 'Tất cả', value: null, icon: 'apps' },
        { label: isEn ? 'Software Engineering' : 'Công nghệ phần mềm', value: 'software-engineering', icon: 'code', sub: 'SE' },
        { label: isEn ? 'Computer Networks' : 'Mạng máy tính', value: 'networking', icon: 'lan', sub: 'CN' },
        { label: isEn ? 'Cyber Security' : 'An toàn không gian mạng', value: 'security', icon: 'shield', sub: 'Cyber' },
        { label: isEn ? 'Artificial Intelligence' : 'Trí tuệ nhân tạo', value: 'ai', icon: 'smart_toy', sub: 'AI' },
        { label: isEn ? 'Information Systems' : 'Hệ thống thông tin', value: 'is', icon: 'account_tree', sub: 'IS' },
        { label: isEn ? 'Programming Techniques' : 'Kỹ thuật lập trình', value: 'programming', icon: 'code', sub: 'Prog' },
      ],
    },
    'chuyen-de': {
      label: isEn ? 'Special Topic' : 'Chuyên Đề',
      icon: 'lightbulb',
      desc: isEn ? 'Specialized Subject' : 'Chủ đề chuyên biệt',
      filterLabel: isEn ? 'Filter by Major' : 'Lọc theo Chuyên ngành',
      filterIcon: 'account_tree',
      blob1: 'bg-amber-300/6',
      blob2: 'bg-orange-300/5',
      badgeBg: 'bg-amber-50 border-amber-100 text-amber-700',
      badgeIcon: 'text-amber-600',
      accentText: 'text-amber-700',
      bannerCard: 'bg-amber-50 border border-amber-200',
      bannerIconBg: 'bg-amber-500',
      bannerLabel: 'text-amber-900',
      bannerDesc: 'text-amber-600',
      divider: 'bg-amber-200',
      chipActive: 'bg-amber-600 text-white',
      chipIdle: 'bg-white text-amber-700 border border-amber-100 hover:bg-amber-50 hover:border-amber-300',
      cardAccent: 'from-amber-200/20 via-amber-400/30 to-amber-200/20',
      countColor: 'text-amber-600',
      filters: [
        { label: isEn ? 'All' : 'Tất cả', value: null, icon: 'apps' },
        { label: isEn ? 'Software Engineering' : 'Công nghệ phần mềm', value: 'software-engineering', icon: 'code', sub: 'SE' },
        { label: isEn ? 'Computer Networks' : 'Mạng máy tính', value: 'networking', icon: 'lan', sub: 'CN' },
        { label: isEn ? 'Cyber Security' : 'An toàn không gian mạng', value: 'security', icon: 'shield', sub: 'Cyber' },
        { label: isEn ? 'Artificial Intelligence' : 'Trí tuệ nhân tạo', value: 'ai', icon: 'smart_toy', sub: 'AI' },
        { label: isEn ? 'Information Systems' : 'Hệ thống thông tin', value: 'is', icon: 'account_tree', sub: 'IS' },
        { label: isEn ? 'Programming Techniques' : 'Kỹ thuật lập trình', value: 'programming', icon: 'code', sub: 'Prog' },
      ],
    },
  };
};

const getDoAnMajors = (lang) => {
  const isEn = lang === 'en';
  return {
    'ai': {
      label: isEn ? 'Artificial Intelligence' : 'Trí tuệ nhân tạo',
      icon: 'smart_toy',
      subjects: [
        { name: isEn ? 'Machine Learning' : 'Máy học', code: 'ITE1173E' },
        { name: isEn ? 'AI Application Development' : 'Phát triển ứng dụng trí tuệ nhân tạo', code: 'ITE1174E' },
        { name: isEn ? 'AI Major Project' : 'Đồ án chuyên ngành trí tuệ nhân tạo', code: 'ITE1491' },
        { name: isEn ? 'Data Mining & Applications' : 'Khai thác dữ liệu và ứng dụng', code: 'ITE1176E' },
        { name: isEn ? 'Computer Vision' : 'Thị giác máy tính', code: 'ITE1181E' }
      ]
    },
    'networking': {
      label: isEn ? 'Computer Networks' : 'Mạng máy tính',
      icon: 'lan',
      subjects: [
        { name: isEn ? 'Advanced Computer Networks' : 'Mạng máy tính nâng cao', code: 'ITE1235E' },
        { name: isEn ? 'Computer Network Design' : 'Thiết kế mạng máy tính', code: 'ITE1267E' },
        { name: isEn ? 'Computer Network Programming' : 'Lập trình mạng máy tính', code: 'ITE1255E' },
        { name: isEn ? 'Network Administration' : 'Quản trị mạng', code: 'ITE1241E' },
        { name: isEn ? 'Computer Networks Major Project' : 'Đồ án chuyên ngành mạng máy tính', code: 'ITE1489' }
      ]
    },
    'is': {
      label: isEn ? 'Enterprise Info Systems' : 'Hệ thống thông tin DN',
      icon: 'account_tree',
      subjects: [
        { name: isEn ? 'Advanced Database Systems' : 'Cơ sở dữ liệu nâng cao', code: 'ITE1224E' },
        { name: isEn ? 'Enterprise Resource Planning' : 'Hoạch định nguồn nhân lực doanh nghiệp', code: 'ITE1285E' },
        { name: isEn ? 'Management Information Systems' : 'Hệ thống thông tin quản lý', code: 'ITE1129E' },
        { name: isEn ? 'Business Analysis' : 'Phân tích nghiệp vụ kinh doanh', code: 'ITE1284E' },
        { name: isEn ? 'EIS Major Project' : 'Đồ án chuyên ngành hệ thống thông tin DN', code: 'ITE1488' }
      ]
    },
    'security': {
      label: isEn ? 'Cyber Security' : 'An toàn không gian mạng',
      icon: 'security',
      subjects: [
        { name: isEn ? 'Web Application Security' : 'An toàn thông tin cho ứng dụng web', code: 'ITE1268E' },
        { name: isEn ? 'Computer Network Security' : 'An toàn hệ thống mạng máy tính', code: 'ITE1232E' },
        { name: isEn ? 'Information Security Analysis' : 'Phân tích và đánh giá an toàn thông tin', code: 'ITE1239E' },
        { name: isEn ? 'Digital Forensics' : 'Điều tra số', code: 'ITE1258E' },
        { name: isEn ? 'Cyber Security Major Project' : 'Đồ án chuyên ngành an toàn không gian mạng', code: 'ITE1490' }
      ]
    },
    'programming': {
      label: isEn ? 'Programming Techniques' : 'Kỹ thuật lập trình',
      icon: 'code',
      subjects: [
        { name: isEn ? 'Front-End Programming' : 'Lập trình Front-End', code: 'SWE1208E' },
        { name: isEn ? 'Computer Networks & Security' : 'Mạng máy tính và bảo mật thông tin', code: 'SWE1204E' },
        { name: isEn ? 'Software Analysis & Design' : 'Phân tích và thiết kế phần mềm', code: 'SWE1107E' },
        { name: isEn ? 'Application Programming' : 'Lập trình ứng dụng', code: 'SWE1205E' },
        { name: isEn ? 'Full-Stack App Development' : 'Phát triển ứng dụng Full-Stack', code: 'SWE1209E' },
        { name: isEn ? 'Application Development Tools' : 'Công cụ phát triển ứng dụng', code: 'SWE1210E' },
        { name: isEn ? 'Software Engineering Project' : 'Đồ án kỹ thuật phần mềm', code: 'SWE1422' },
        { name: isEn ? 'Software Quality Assurance' : 'Đảm bảo chất lượng phần mềm', code: 'SWE1111E' },
        { name: isEn ? 'Software Testing' : 'Kiểm thử phần mềm', code: 'SWE1212E' },
        { name: isEn ? 'Testing Project Management' : 'Quản lý dự án kiểm thử', code: 'SWE1114E' },
        { name: isEn ? 'Automated Testing Tools' : 'Công cụ và kỹ thuật kiểm thử tự động', code: 'SWE1213E' },
        { name: isEn ? 'Software Testing Major Project' : 'Đồ án chuyên ngành kiểm thử phần mềm', code: 'SWE1415' },
        { name: isEn ? 'Cross-Platform App Development' : 'Phát triển ứng dụng đa nền tảng', code: 'SWE1216E' },
        { name: isEn ? 'Game Development' : 'Phát triển Game', code: 'ITE1279E' },
        { name: isEn ? 'IT System Dev & Operations' : 'Phát triển và vận hành hệ thống công nghệ thông tin', code: 'SWE1219E' },
        { name: isEn ? 'Advanced Web App Development' : 'Phát triển ứng dụng web nâng cao', code: 'SWE1218E' },
        { name: isEn ? 'Application Development Project' : 'Đồ án chuyên ngành phát triển ứng dụng', code: 'SWE1420' }
      ]
    }
  };
};


const ALL_RESULTS = [];

// ─── Main Component ──────────────────────────────────────────────────────────
const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'pdf') return { icon: 'picture_as_pdf', color: 'text-red-500' };
  if (['doc', 'docx'].includes(ext)) return { icon: 'description', color: 'text-blue-500' };
  if (['xls', 'xlsx'].includes(ext)) return { icon: 'table_chart', color: 'text-emerald-500' };
  if (['ppt', 'pptx'].includes(ext)) return { icon: 'slideshow', color: 'text-amber-500' };
  if (['mp4', 'mkv', 'avi'].includes(ext)) return { icon: 'video_file', color: 'text-violet-500' };
  return { icon: 'insert_drive_file', color: 'text-gray-500' };
};

const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
};

const LookupPage = () => {
  const { lang } = useLanguage();
  const TYPE_CONFIG = getTypeConfig(lang);
  const DO_AN_MAJORS = getDoAnMajors(lang);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [previewThesis, setPreviewThesis] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [dbTheses, setDbTheses] = useState([]);
  const [documentViewMode, setDocumentViewMode] = useState(() => localStorage.getItem('documentViewPreference') || '3d');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [convertingFile, setConvertingFile] = useState(null);
  const itemsPerPage = 6;

  const showToastMessage = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDownload = async (filePath, fileName) => {
    if (filePath.startsWith('http')) {
      window.open(filePath, '_blank');
      showToastMessage('success', `Đang mở liên kết: ${fileName}`);
      return;
    }

    const fileUrl = filePath.startsWith('http') ? filePath : `${API_URL}${filePath}`;
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
      window.open(fileUrl, '_blank');
      showToastMessage('success', `Đã mở tải xuống cho: ${fileName}`);
    }
  };

  const handleReadFile3D = async (sub) => {
    const ext = sub.fileName.split('.').pop().toLowerCase();
    const isDocOrXls = ['docx', 'doc', 'xlsx', 'xls'].includes(ext);

    if (isDocOrXls) {
      setConvertingFile(sub.id || sub.fileName);
      showToastMessage('success', 'Đang chuyển đổi tài liệu sang PDF...');
      try {
        const res = await thesisService.convertDriveFile(resolveFileUrl(sub.filePath));
        if (res.data && res.data.success) {
          const convertedPath = res.data.localPath;
          showToastMessage('success', 'Chuyển đổi thành công! Đang mở sách 3D...');
          window.open(`/theses/${previewThesis.id}/flipbook?file=${encodeURIComponent(resolveFileUrl(convertedPath))}`, '_blank');
        } else {
          throw new Error('Chuyển đổi thất bại');
        }
      } catch (err) {
        console.error(err);
        showToastMessage('error', 'Chuyển đổi lỗi. Đang mở tệp tin gốc...');
        window.open(resolveFileUrl(sub.filePath), '_blank');
      } finally {
        setConvertingFile(null);
      }
    } else if (ext === 'pdf') {
      window.open(`/theses/${previewThesis.id}/flipbook?file=${encodeURIComponent(resolveFileUrl(sub.filePath))}`, '_blank');
    } else {
      handleDownload(resolveFileUrl(sub.filePath), sub.fileName);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchParams]);

  const handleSetViewMode = (mode) => {
    setDocumentViewMode(mode);
    localStorage.setItem('documentViewPreference', mode);
  };

  useEffect(() => {
    const fetchDbTheses = async () => {
      try {
        const { data } = await thesisService.getAll({ page: 1, pageSize: 1000 });
        if (data && data.items) {
          const mapped = data.items.map(t => ({
            id: t.id,
            type: t.category === 'Project' ? 'do-an' : t.category === 'Thesis' ? 'khoa-luan' : 'chuyen-de',
            major: t.major || '',
            subjectCode: t.subjectCode || '',
            title: t.title,
            student: t.studentName || 'Sinh viên',
            advisor: t.advisorName || 'Chưa phân công',
            year: t.createdAt ? new Date(t.createdAt).getFullYear().toString() : '2026',
            department: t.department || 'Khoa học Công nghệ',
            similarity: t.latestScore ? `${Math.round(t.latestScore * 3)}%` : '10%',
            similarityLevel: 'safe',
            desc: t.description || 'Chưa có mô tả chi tiết cho đề tài này.',
            tags: t.major ? [`#${t.major}`] : ['#research'],
            pdfUrl: t.filePath || '/Document%20Detail.pdf',
            submissions: t.submissions || [],
            batch: t.batch || 1
          }));
          setDbTheses(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch database theses in LookupPage", err);
      }
    };

    fetchDbTheses();
    const interval = setInterval(fetchDbTheses, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenPreview = (thesis) => {
    setPreviewThesis({
      id: thesis.id,
      title: thesis.title,
      studentName: thesis.student || thesis.studentName,
      advisorName: thesis.advisor || thesis.advisorName,
      year: thesis.year || "2024",
      department: thesis.department || "IT Department",
      similarity: thesis.similarity || "10%",
      similarityLevel: thesis.similarityLevel || "safe",
      description: thesis.description || thesis.desc || "Chưa có mô tả chi tiết.",
      tags: thesis.tags || ["#research"],
      submissions: thesis.submissions || [],
      batch: thesis.batch || 1
    });
    setShowPreviewModal(true);
  };

  const thesisType  = searchParams.get('type');
  const activeFilter = searchParams.get('filter');
  const activeSubject = searchParams.get('subject');
  const activeBatch = searchParams.get('batch');
  const activeYear = searchParams.get('year');
  const tc = thesisType ? TYPE_CONFIG[thesisType] : null;

  const [tempFilter, setTempFilter] = useState(activeFilter || '');
  const [tempBatch, setTempBatch] = useState(activeBatch || '');
  const [tempYear, setTempYear] = useState(activeYear || '');

  useEffect(() => {
    setTempFilter(activeFilter || '');
    setTempBatch(activeBatch || '');
    setTempYear(activeYear || '');
  }, [activeFilter, activeBatch, activeYear]);

  const handleApplyFilters = () => {
    const p = new URLSearchParams(searchParams);
    if (tempFilter) p.set('filter', tempFilter); else p.delete('filter');
    if (tempBatch) p.set('batch', tempBatch); else p.delete('batch');
    if (tempYear) p.set('year', tempYear); else p.delete('year');
    p.delete('subject'); // Reset subject when major changes
    setSearchParams(p);
  };

  const setFilter = (value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set('filter', value); else p.delete('filter');
    p.delete('subject'); // Reset subject when major changes
    setSearchParams(p);
  };

  const setSubject = (value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set('subject', value); else p.delete('subject');
    setSearchParams(p);
  };

  const setBatch = (value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set('batch', value); else p.delete('batch');
    setSearchParams(p);
  };

  const clearType = () => setSearchParams({});

  const combinedResults = [...dbTheses, ...ALL_RESULTS];

  const availableYears = useMemo(() => {
    const yearsSet = new Set(combinedResults.map(item => item.year).filter(Boolean));
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [combinedResults]);

  // We have 2 batches to divide/reorganize
  const displayBatches = [1, 2];

  const allSpecializations = [
    { label: 'Tất cả chuyên ngành', value: '' },
    { label: 'Công nghệ phần mềm', value: 'software-engineering' },
    { label: 'Mạng máy tính', value: 'networking' },
    { label: 'An toàn không gian mạng', value: 'security' },
    { label: 'Trí tuệ nhân tạo', value: 'ai' },
    { label: 'Hệ thống thông tin', value: 'is' },
    { label: 'Kỹ thuật lập trình', value: 'programming' }
  ];

  const specOptions = tc
    ? [
        { label: 'Tất cả chuyên ngành', value: '' },
        ...tc.filters.filter(f => f.value !== null).map(f => ({ label: f.label, value: f.value }))
      ]
    : allSpecializations;

  const filteredResults = combinedResults.filter(item => {
    // 1. Filter by thesisType
    if (thesisType && item.type !== thesisType) {
      return false;
    }
    // 2. Filter by major (activeFilter)
    if (activeFilter) {
      if (item.major !== activeFilter) {
        return false;
      }
    }
    // 2.5 Filter by batch (activeBatch)
    if (activeBatch) {
      if (item.batch?.toString() !== activeBatch) {
        return false;
      }
    }
    // 2.6 Filter by publication year (activeYear)
    if (activeYear) {
      if (item.year?.toString() !== activeYear) {
        return false;
      }
    }
    // 3. Filter by subjectCode (activeSubject)
    if (thesisType === 'do-an' && activeSubject) {
      if (item.subjectCode !== activeSubject) {
        return false;
      }
    }
    // 4. Filter by searchQuery
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = item.title.toLowerCase().includes(q);
      const studentMatch = item.student.toLowerCase().includes(q);
      const advisorMatch = item.advisor.toLowerCase().includes(q);
      const codeMatch = item.subjectCode ? item.subjectCode.toLowerCase().includes(q) : false;
      const descMatch = item.desc ? item.desc.toLowerCase().includes(q) : false;
      const tagsMatch = item.tags ? item.tags.some(tag => tag.toLowerCase().includes(q)) : false;
      
      if (!titleMatch && !studentMatch && !advisorMatch && codeMatch === false && !descMatch && !tagsMatch) {
        return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const displayedResults = filteredResults.slice(indexOfFirstItem, indexOfLastItem);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 3;
      }
      if (currentPage >= totalPages - 1) {
        start = totalPages - 2;
      }
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-surface-bright relative overflow-hidden">

      {/* ── Background blobs (change colour per type) ─────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={`absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[130px] transition-all duration-700 ${tc ? tc.blob1 : 'bg-primary/10'}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[110px] transition-all duration-700 ${tc ? tc.blob2 : 'bg-blue-400/10'}`} />
      </div>

      <div className="relative z-10 py-2 md:py-4 max-w-[1400px] mx-auto px-4 md:px-8">

        {/* ── Page Header ──────────────────────────────────────── */}
        <header className="text-center mb-6 md:mb-8 mt-2 md:mt-4">
          {/* H1 */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-on-surface mb-3 tracking-tighter leading-none">
            {tc ? (
              <>Tra Cứu <span className={`transition-colors duration-500 ${tc.accentText}`}>{tc.label}</span></>
            ) : (
              <>Tra Cứu <span className="text-primary/70">Đề Tài</span></>
            )}
          </h1>
          <p className="text-on-surface-variant font-medium opacity-65 max-w-2xl mx-auto leading-relaxed text-xs md:text-sm">
            {tc
              ? tc.desc + ' — Tìm kiếm và khám phá các đề tài xuất sắc của sinh viên UEF.'
              : 'Khám phá hàng nghìn đề tài nghiên cứu, đồ án, khóa luận và chuyên đề xuất sắc từ sinh viên và giảng viên qua các thế hệ.'}
          </p>
        </header>





        {/* ── Subject chips row (Only for Đồ Án and when a major is selected) ── */}
        {thesisType === 'do-an' && activeFilter && DO_AN_MAJORS[activeFilter] && (
          <div className="mb-7 mt-[-10px] pl-4 animate-in slide-in-from-top-2 duration-300">
            {/* Section label */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-1 h-3 rounded-full bg-blue-300" />
              <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[11px]">menu_book</span>
                Môn học thuộc chuyên ngành
              </span>
            </div>

            {/* Scrollable subject chip row */}
            <div
              className="flex gap-2 overflow-x-auto pb-2 px-1"
              style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* "Tất cả môn học" chip */}
              <button
                onClick={() => setSubject(null)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-black whitespace-nowrap transition-all duration-200 shrink-0 uppercase tracking-wider ${
                  !activeSubject 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50/50'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">apps</span>
                <span>Tất cả môn học</span>
              </button>

              {/* Individual subject chips */}
              {DO_AN_MAJORS[activeFilter].subjects.map((sub) => {
                const isSubActive = activeSubject === sub.code;
                return (
                  <button
                    key={sub.code}
                    onClick={() => setSubject(sub.code)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-black whitespace-nowrap transition-all duration-200 shrink-0 uppercase tracking-wider ${
                      isSubActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">book</span>
                    <span>{sub.name} — {sub.code}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Category Segmented Tabs ───────────────────────────── */}
        <div className="flex justify-center mb-4 md:mb-5 animate-in fade-in duration-500">
          <div className="inline-flex p-1 bg-surface-container-low rounded-2xl md:rounded-3xl border border-outline-variant/30 shadow-sm overflow-x-auto max-w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {[
              { key: null, label: 'Tất cả đề tài', icon: 'apps', colorCls: 'text-primary' },
              { key: 'do-an', label: 'Đồ án', icon: 'engineering', colorCls: 'text-blue-500' },
              { key: 'chuyen-de', label: 'Chuyên đề', icon: 'lightbulb', colorCls: 'text-amber-600' },
              { key: 'khoa-luan', label: 'Tốt nghiệp', icon: 'school', colorCls: 'text-violet-500' },
            ].map((tab) => {
              const isActive = (tab.key === null && !thesisType) || thesisType === tab.key;
              return (
                <button
                  key={tab.key ?? 'all'}
                  onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    if (tab.key) {
                      p.set('type', tab.key);
                    } else {
                      p.delete('type');
                    }
                    p.delete('filter'); // Clear sub-filter when switching category
                    p.delete('subject'); // Clear subject when switching category
                    setSearchParams(p);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'bg-white shadow-sm text-on-surface border border-outline-variant/10' 
                      : 'text-on-surface-variant/70 hover:text-on-surface hover:bg-white/40 border border-transparent'
                  }`}
                >
                  <span className={`material-symbols-outlined text-sm md:text-base ${isActive ? tab.colorCls : 'text-on-surface-variant/50'}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Search Bar ───────────────────────────────────────── */}
        <div className="max-w-[1000px] mx-auto mb-5 md:mb-7">
          <div className="bg-white p-1.5 md:p-2 rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-outline-variant hover:border-outline transition-all flex flex-col md:flex-row items-center gap-2 group">
            <div className="flex-1 flex items-center gap-2 md:gap-4 px-3 md:px-6 w-full">
              <span className={`material-symbols-outlined text-lg md:text-xl transition-transform group-focus-within:scale-110 ${tc ? tc.accentText : 'text-primary'}`}>search</span>
              <input
                type="text"
                placeholder={tc ? `Tìm kiếm ${tc.label.toLowerCase()}...` : 'Nhập tên đề tài, tác giả hoặc từ khóa...'}
                className="w-full bg-transparent border-none outline-none text-xs md:text-sm font-bold py-2.5 md:py-3 text-on-surface placeholder:text-on-surface-variant/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Always neutral dark button — no bright colour */}
            <button className="w-full md:w-auto px-6 md:px-9 py-2.5 md:py-3.5 rounded-[1.8rem] md:rounded-[2.5rem] font-black uppercase tracking-widest text-[10px] bg-on-surface hover:bg-primary text-white transition-all shadow-md active:scale-95">
              Tìm kiếm ngay
            </button>
          </div>

          {/* Trending tags */}
          <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
            <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest py-1.5 px-2">Phổ biến:</span>
            {['#Blockchain', '#AI_Gemini', '#Marketing_Số', '#Kinh_tế_xanh'].map((tag) => (
              <button key={tag} className="px-3 py-1.5 bg-surface-container-low rounded-full text-[10px] font-bold text-on-surface-variant hover:text-primary transition-all border border-transparent hover:border-primary/20">
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ── Advanced Filters ─────────────────────────────────── */}
        <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-outline-variant shadow-sm mb-8 md:mb-12 flex flex-wrap items-end gap-4 md:gap-6">
          <div className="flex-1 min-w-[160px] flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 ml-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">account_tree</span> Chuyên ngành
            </label>
            <div className="relative">
              <select 
                value={tempFilter}
                onChange={(e) => setTempFilter(e.target.value)}
                className="w-full px-4 md:px-6 py-3 md:py-3.5 bg-surface-container-lowest rounded-xl md:rounded-2xl outline-none border border-outline-variant focus:border-primary transition-all font-bold text-xs appearance-none cursor-pointer"
              >
                {specOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none text-sm">expand_more</span>
            </div>
          </div>

          <div className="flex-1 min-w-[160px] flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 ml-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">calendar_today</span> Đợt
            </label>
            <div className="relative">
              <select 
                value={tempBatch}
                onChange={(e) => setTempBatch(e.target.value)}
                className="w-full px-4 md:px-6 py-3 md:py-3.5 bg-surface-container-lowest rounded-xl md:rounded-2xl outline-none border border-outline-variant focus:border-primary transition-all font-bold text-xs appearance-none cursor-pointer"
              >
                <option value="">Tất cả các đợt</option>
                <option value="1">Đợt 1</option>
                <option value="2">Đợt 2</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none text-sm">expand_more</span>
            </div>
          </div>

          <div className="flex-1 min-w-[160px] flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 ml-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">event</span> Năm xuất bản
            </label>
            <div className="relative">
              <select 
                value={tempYear}
                onChange={(e) => setTempYear(e.target.value)}
                className="w-full px-4 md:px-6 py-3 md:py-3.5 bg-surface-container-lowest rounded-xl md:rounded-2xl outline-none border border-outline-variant focus:border-primary transition-all font-bold text-xs appearance-none cursor-pointer"
              >
                <option value="">Tất cả các năm</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>Năm {yr}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none text-sm">expand_more</span>
            </div>
          </div>

          <button 
            onClick={handleApplyFilters}
            className="px-6 md:px-8 py-3 md:py-3.5 bg-on-surface text-white rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95 whitespace-nowrap"
          >
            LỌC KẾT QUẢ
          </button>
        </div>

        {/* ── Results ──────────────────────────────────────────── */}
        <main>
          {/* Results header */}
          <div className="flex flex-wrap justify-between items-center mb-6 md:mb-8 gap-3 px-1">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${tc ? tc.divider : 'bg-primary'}`} />
              <p className="text-xs font-bold text-on-surface-variant">
                Hiển thị <span className="text-on-surface font-black">{filteredResults.length}</span> đề tài
                {tc && <span className={`ml-2 font-black ${tc.accentText}`}>· {tc.label}</span>}
                {activeFilter && tc && (() => {
                  const f = tc.filters.find((x) => x.value === activeFilter);
                  return f ? <span className="ml-1 opacity-60">· {f.label}</span> : null;
                })()}
                {activeSubject && thesisType === 'do-an' && activeFilter && DO_AN_MAJORS[activeFilter] && (() => {
                  const subObj = DO_AN_MAJORS[activeFilter].subjects.find(s => s.code === activeSubject);
                  return subObj ? <span className="ml-1 opacity-60 font-black text-blue-600">· Môn: {subObj.name} ({subObj.code})</span> : null;
                })()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Sắp xếp:</span>
              <div className="relative min-w-[120px] md:min-w-[140px]">
                <select className="w-full px-2 py-1 bg-transparent border-b border-outline-variant outline-none font-black text-[10px] uppercase tracking-widest cursor-pointer appearance-none">
                  <option>Độ liên quan</option>
                  <option>Mới nhất</option>
                </select>
                <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-40">expand_more</span>
              </div>
            </div>
          </div>

          {/* Cards grid / Empty state */}
          {filteredResults.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-outline-variant shadow-sm flex flex-col items-center justify-center gap-4">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 animate-bounce">search_off</span>
              <h3 className="text-lg font-black text-on-surface">Không tìm thấy đề tài nào</h3>
              <p className="text-xs text-on-surface-variant max-w-sm">Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc chuyên ngành/môn học khác.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
              {displayedResults.map((r, idx) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-outline-variant shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.07)] transition-all duration-500 group relative flex flex-col h-full overflow-hidden"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* Top accent line — type-coloured */}
                  <div className={`h-1.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-500 ${tc ? tc.cardAccent : 'from-primary/20 via-primary to-primary/20'}`} />

                  {/* Card Cover Image */}
                  <div className="h-40 w-full overflow-hidden relative">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" 
                      src={getMajorDefaultImage(r.major, r.id)} 
                      alt="" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                  </div>

                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-[8px] font-black uppercase tracking-widest rounded-md">#{r.id}</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        {r.batch && (
                          <span className="text-[8px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Đợt {r.batch}</span>
                        )}
                        {r.subjectCode && (
                          <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{r.subjectCode}</span>
                        )}
                      </div>
                    </div>

                    <h2
                      onClick={() => navigate(`/theses/${r.id}`, { state: r })}
                      className={`text-base md:text-lg font-black text-on-surface mb-4 tracking-tight transition-colors leading-snug line-clamp-2 min-h-[52px] cursor-pointer ${tc ? 'group-hover:' + tc.accentText : 'group-hover:text-primary'}`}
                    >
                      {r.title}
                    </h2>

                    <div className="space-y-2.5 mb-5">
                      {[
                        { icon: 'person', label: 'Sinh viên', value: r.student },
                        { icon: 'psychology', label: 'GV Hướng dẫn', value: r.advisor },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className={`w-7 h-7 md:w-8 md:h-8 bg-surface-container-low rounded-lg md:rounded-xl flex items-center justify-center transition-all ${tc ? 'group-hover:' + tc.bannerBg + ' group-hover:text-white' : 'group-hover:bg-primary group-hover:text-white'} text-primary/60`}>
                            <span className="material-symbols-outlined text-[14px] md:text-[16px]">{item.icon}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-0.5">{item.label}</span>
                            <span className="text-[11px] md:text-xs font-bold text-on-surface line-clamp-1">{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                        <button
                          onClick={() => navigate(`/theses/${r.id}`, { state: r })}
                          className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline transition-all ${tc ? tc.accentText : 'text-primary'}`}
                        >
                          Chi tiết <span className="material-symbols-outlined text-sm">east</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPreview(r);
                            }}
                            className="w-7 h-7 rounded-lg bg-surface-container-high hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all cursor-pointer"
                            title="Xem nhanh"
                          >
                            <span className="material-symbols-outlined text-base">visibility</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/theses/${r.id}/flipbook`, '_blank');
                            }}
                            className="w-7 h-7 rounded-lg bg-surface-container-high hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all cursor-pointer"
                            title="Đọc sách 3D"
                          >
                            <span className="material-symbols-outlined text-base">menu_book</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-12 md:mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-outline-variant/10 pt-8 animate-in fade-in duration-300">
              <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">
                Hiển thị <span className="text-on-surface font-black">{indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredResults.length)}</span> trên tổng số <span className="text-on-surface font-black">{filteredResults.length}</span> đề tài
              </span>
              
              <div className="flex items-center gap-2">
                {/* Previous Page Button */}
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white border border-outline-variant/60 flex items-center justify-center transition-all ${
                    currentPage === 1 
                      ? 'opacity-40 cursor-not-allowed pointer-events-none' 
                      : `cursor-pointer ${
                          tc 
                            ? (thesisType === 'do-an' ? 'hover:border-blue-500 hover:text-blue-500' : thesisType === 'khoa-luan' ? 'hover:border-violet-500 hover:text-violet-500' : 'hover:border-amber-600 hover:text-amber-600')
                            : 'hover:border-primary hover:text-primary'
                        }`
                  }`}
                  title="Trang trước"
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, index) => {
                  if (page === '...') {
                    return (
                      <span key={`dots-${index}`} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-xs font-bold text-on-surface-variant/40">
                        ...
                      </span>
                    );
                  }
                  
                  const isActive = currentPage === page;
                  return (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                        isActive 
                          ? `${tc ? tc.chipActive : 'bg-primary text-white'} border-transparent shadow-sm scale-105` 
                          : `bg-white border-outline-variant/60 text-on-surface ${
                              tc 
                                ? (thesisType === 'do-an' ? 'hover:border-blue-500 hover:text-blue-500' : thesisType === 'khoa-luan' ? 'hover:border-violet-500 hover:text-violet-500' : 'hover:border-amber-600 hover:text-amber-600')
                                : 'hover:border-primary hover:text-primary'
                            }`
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                {/* Next Page Button */}
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white border border-outline-variant/60 flex items-center justify-center transition-all ${
                    currentPage === totalPages 
                      ? 'opacity-40 cursor-not-allowed pointer-events-none' 
                      : `cursor-pointer ${
                          tc 
                            ? (thesisType === 'do-an' ? 'hover:border-blue-500 hover:text-blue-500' : thesisType === 'khoa-luan' ? 'hover:border-violet-500 hover:text-violet-500' : 'hover:border-amber-600 hover:text-amber-600')
                            : 'hover:border-primary hover:text-primary'
                        }`
                  }`}
                  title="Trang tiếp theo"
                >
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Quick Preview Modal (Glassmorphic UEF Style) */}
      {showPreviewModal && previewThesis && (() => {
        const submissionsList = (previewThesis.submissions && previewThesis.submissions.length > 0)
          ? previewThesis.submissions
          : [{ id: 'main', fileName: 'Báo cáo chính.pdf', filePath: previewThesis.filePath || previewThesis.pdfUrl, fileSize: 0 }];

        return (
          <div className="fixed top-[72px] bottom-0 left-0 md:left-[280px] right-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="min-h-full flex items-center justify-center w-full p-4 sm:p-6 md:p-8 py-8 sm:py-12">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-outline-variant/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-w-xl w-full p-4 sm:p-5 relative flex flex-col gap-2.5 animate-in slide-in-from-bottom-8 duration-300">
              

              {/* Close Button */}
              <button
                onClick={() => setShowPreviewModal(false)}
                className="absolute right-4 top-4 w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center transition-all cursor-pointer text-on-surface-variant border-none bg-transparent"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>

              {/* Header */}
              <div className="pt-0.5 pr-8">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 bg-surface-container-high text-[8px] font-black uppercase tracking-widest rounded border border-outline-variant/30">
                    #{previewThesis.id}
                  </span>
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded">
                    {previewThesis.department}
                  </span>
                  <span className="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest bg-surface-container-low px-2 py-0.5 rounded ml-auto">
                    Niên khóa: {previewThesis.year}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-on-surface leading-tight">
                  {previewThesis.title}
                </h3>
              </div>

              {/* Content Details Grid */}
              <div className="grid sm:grid-cols-2 gap-2 py-0">
                <div className="flex items-center gap-2.5 p-2 bg-surface-container-lowest border border-outline-variant/35 rounded-lg hover:border-primary/25 hover:shadow-sm transition-all">
                  <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center border border-primary/20 shrink-0">
                    <span className="material-symbols-outlined text-base">person</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-1">Sinh viên</p>
                    <p className="text-xs font-black text-on-surface truncate">{previewThesis.studentName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-surface-container-lowest border border-outline-variant/35 rounded-lg hover:border-primary/25 hover:shadow-sm transition-all">
                  <div className="w-7 h-7 bg-secondary-container/20 text-secondary rounded-lg flex items-center justify-center border border-secondary/20 shrink-0">
                    <span className="material-symbols-outlined text-base">psychology</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-1">Giảng viên HD</p>
                    <p className="text-xs font-black text-on-surface truncate">{previewThesis.advisorName}</p>
                  </div>
                </div>
              </div>

              {/* Abstract */}
              <div className="space-y-1 p-2.5 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-outline-variant/20">
                <h4 className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs">segment</span> Tóm tắt nội dung
                </h4>
                <p className="text-[10px] text-slate-700 leading-normal font-semibold italic pl-1">
                  "{previewThesis.description}"
                </p>
              </div>

              {/* Similarity Badge */}
              <div className="flex items-center justify-between p-2 bg-surface-container-low rounded-lg border border-outline-variant/25">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    parseFloat(previewThesis.similarity) > 20 ? 'bg-red-50 text-error' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    <span className="material-symbols-outlined text-xs">speed</span>
                  </div>
                  <div>
                    <p className="text-[7px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-0.5">Chỉ số trùng lắp</p>
                    <p className="text-xs font-black text-on-surface">Mức độ tương đồng: {previewThesis.similarity}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded ${
                  parseFloat(previewThesis.similarity) > 20 ? 'bg-red-100 text-error' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {parseFloat(previewThesis.similarity) > 20 ? 'Nguy cơ cao' : 'An toàn'}
                </span>
              </div>

              {/* Attached files and documents list */}
              <div className="space-y-1.5">
                <h4 className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                  <span className="material-symbols-outlined text-xs">folder_open</span> Danh sách tài liệu đính kèm ({submissionsList.length})
                </h4>
                
                <div className="space-y-1.5">
                  {submissionsList.map((sub, idx) => {
                    const ext = sub.fileName.split('.').pop().toLowerCase();
                    const fileIconInfo = getFileIcon(sub.fileName);
                    const isDocument = ['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext);
                    const isConverting = convertingFile === (sub.id || sub.fileName);

                    return (
                      <div 
                        key={sub.id || idx}
                        className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/35 flex items-center justify-between gap-3 hover:border-primary/20 hover:shadow-sm transition-all flex-wrap sm:flex-nowrap"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-7 h-7 bg-surface-container rounded-lg flex items-center justify-center border border-outline-variant/10 shrink-0">
                            <span className={`material-symbols-outlined text-base ${fileIconInfo.color}`}>
                              {fileIconInfo.icon}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-[10px] font-black text-on-surface truncate max-w-[240px]" title={sub.fileName}>
                              {sub.fileName}
                            </h5>
                            <p className="text-[8px] text-on-surface-variant opacity-60 font-semibold mt-0.5">
                              {sub.fileSize > 0 ? `Dung lượng: ${formatSize(sub.fileSize)}` : 'Tài liệu chính'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto justify-end">
                          {isDocument && (
                            <button
                              type="button"
                              disabled={isConverting || convertingFile !== null}
                              onClick={() => handleReadFile3D(sub)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[8px] font-black uppercase tracking-wider rounded-md transition-all flex items-center gap-1 shadow-sm border-none cursor-pointer"
                            >
                              {isConverting ? (
                                <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span className="material-symbols-outlined text-[10px]">menu_book</span>
                              )}
                              {isConverting ? 'Đang chuyển...' : 'Đọc 3D'}
                            </button>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => handleDownload(sub.filePath, sub.fileName)}
                            className="px-2 py-1 bg-on-surface hover:bg-primary text-white text-[8px] font-black uppercase tracking-wider rounded-md transition-all flex items-center gap-1 shadow-sm border-none cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[10px]">download</span>
                            Tải về
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-2 mt-0.5 justify-end border-t border-outline-variant/10 pt-2.5">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    navigate(`/theses/${previewThesis.id}`, { state: previewThesis });
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg font-bold uppercase tracking-widest text-[9px] shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  Chi tiết đầy đủ <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-3.5 py-2 bg-transparent border-2 border-outline-variant/50 hover:border-primary text-on-surface hover:text-primary rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Đóng
                </button>
              </div>

            </div>
          </div>
        </div>
      );
      })()}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] p-4 rounded-2xl border flex items-center gap-3 shadow-xl bg-white border-outline-variant/60 text-on-surface animate-fade-in transition-all">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <span className={`material-symbols-outlined text-lg ${toast.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
          </div>
          <span className="text-xs font-black text-on-surface tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default LookupPage;
