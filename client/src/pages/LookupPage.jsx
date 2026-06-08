import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { thesisService } from '../services/api';

// ─── Type config (colours + filters) ────────────────────────────────────────
const TYPE_CONFIG = {
  'do-an': {
    label: 'Đồ Án Môn Học',
    icon: 'engineering',
    desc: 'Thực hành & Ứng dụng',
    filterLabel: 'Lọc theo Chuyên ngành',
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
      { label: 'Tất cả', value: null, icon: 'apps' },
      { label: 'Trí tuệ nhân tạo', value: 'ai', icon: 'smart_toy' },
      { label: 'Mạng máy tính', value: 'networking', icon: 'lan' },
      { label: 'Hệ thống thông tin DN', value: 'is', icon: 'account_tree' },
      { label: 'An toàn không gian mạng', value: 'security', icon: 'security' },
      { label: 'Kỹ thuật lập trình', value: 'programming', icon: 'code' },
    ],
  },
  'khoa-luan': {
    label: 'Khóa luận (Tốt nghiệp)',
    icon: 'school',
    desc: 'Nghiên cứu chuyên sâu',
    filterLabel: 'Lọc theo Chuyên ngành',
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
      { label: 'Tất cả', value: null, icon: 'apps' },
      { label: 'Công nghệ phần mềm', value: 'software-engineering', icon: 'code', sub: 'SE' },
      { label: 'Mạng máy tính', value: 'computer-networks', icon: 'lan', sub: 'CN' },
      { label: 'An toàn không gian mạng', value: 'cybersecurity', icon: 'shield', sub: 'Cyber' },
      { label: 'Trí tuệ nhân tạo', value: 'ai', icon: 'smart_toy', sub: 'AI' },
      { label: 'Hệ thống thông tin', value: 'information-systems', icon: 'account_tree', sub: 'IS' },
      { label: 'Kỹ thuật lập trình', value: 'programming', icon: 'code', sub: 'Prog' },
    ],
  },
  'chuyen-de': {
    label: 'Chuyên Đề',
    icon: 'lightbulb',
    desc: 'Chủ đề chuyên biệt',
    filterLabel: 'Lọc theo Chuyên ngành',
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
      { label: 'Tất cả', value: null, icon: 'apps' },
      { label: 'Công nghệ phần mềm', value: 'software-engineering', icon: 'code', sub: 'SE' },
      { label: 'Mạng máy tính', value: 'computer-networks', icon: 'lan', sub: 'CN' },
      { label: 'An toàn không gian mạng', value: 'cybersecurity', icon: 'shield', sub: 'Cyber' },
      { label: 'Trí tuệ nhân tạo', value: 'ai', icon: 'smart_toy', sub: 'AI' },
      { label: 'Hệ thống thông tin', value: 'information-systems', icon: 'account_tree', sub: 'IS' },
      { label: 'Kỹ thuật lập trình', value: 'programming', icon: 'code', sub: 'Prog' },
    ],
  },
};

const DO_AN_MAJORS = {
  'ai': {
    label: 'Trí tuệ nhân tạo',
    icon: 'smart_toy',
    subjects: [
      { name: 'Máy học', code: 'ITE1173E' },
      { name: 'Phát triển ứng dụng trí tuệ nhân tạo', code: 'ITE1174E' },
      { name: 'Đồ án chuyên ngành trí tuệ nhân tạo', code: 'ITE1491' },
      { name: 'Khai thác dữ liệu và ứng dụng', code: 'ITE1176E' },
      { name: 'Thị giác máy tính', code: 'ITE1181E' }
    ]
  },
  'networking': {
    label: 'Mạng máy tính',
    icon: 'lan',
    subjects: [
      { name: 'Mạng máy tính nâng cao', code: 'ITE1235E' },
      { name: 'Thiết kế mạng máy tính', code: 'ITE1267E' },
      { name: 'Lập trình mạng máy tính', code: 'ITE1255E' },
      { name: 'Quản trị mạng', code: 'ITE1241E' },
      { name: 'Đồ án chuyên ngành mạng máy tính', code: 'ITE1489' }
    ]
  },
  'is': {
    label: 'Hệ thống thông tin DN',
    icon: 'account_tree',
    subjects: [
      { name: 'Cơ sở dữ liệu nâng cao', code: 'ITE1224E' },
      { name: 'Hoạch định nguồn nhân lực doanh nghiệp', code: 'ITE1285E' },
      { name: 'Hệ thống thông tin quản lý', code: 'ITE1129E' },
      { name: 'Phân tích nghiệp vụ kinh doanh', code: 'ITE1284E' },
      { name: 'Đồ án chuyên ngành hệ thống thông tin DN', code: 'ITE1488' }
    ]
  },
  'security': {
    label: 'An toàn không gian mạng',
    icon: 'security',
    subjects: [
      { name: 'An toàn thông tin cho ứng dụng web', code: 'ITE1268E' },
      { name: 'An toàn hệ thống mạng máy tính', code: 'ITE1232E' },
      { name: 'Phân tích và đánh giá an toàn thông tin', code: 'ITE1239E' },
      { name: 'Điều tra số', code: 'ITE1258E' },
      { name: 'Đồ án chuyên ngành an toàn không gian mạng', code: 'ITE1490' }
    ]
  },
  'programming': {
    label: 'Kỹ thuật lập trình',
    icon: 'code',
    subjects: [
      { name: 'Lập trình Front-End', code: 'SWE1208E' },
      { name: 'Mạng máy tính và bảo mật thông tin', code: 'SWE1204E' },
      { name: 'Phân tích và thiết kế phần mềm', code: 'SWE1107E' },
      { name: 'Lập trình ứng dụng', code: 'SWE1205E' },
      { name: 'Phát triển ứng dụng Full-Stack', code: 'SWE1209E' },
      { name: 'Công cụ phát triển ứng dụng', code: 'SWE1210E' },
      { name: 'Đồ án kỹ thuật phần mềm', code: 'SWE1422' },
      { name: 'Đảm bảo chất lượng phần mềm', code: 'SWE1111E' },
      { name: 'Kiểm thử phần mềm', code: 'SWE1212E' },
      { name: 'Quản lý dự án kiểm thử', code: 'SWE1114E' },
      { name: 'Công cụ và kỹ thuật kiểm thử tự động', code: 'SWE1213E' },
      { name: 'Đồ án chuyên ngành kiểm thử phần mềm', code: 'SWE1415' },
      { name: 'Phát triển ứng dụng đa nền tảng', code: 'SWE1216E' },
      { name: 'Phát triển Game', code: 'ITE1279E' },
      { name: 'Phát triển và vận hành hệ thống công nghệ thông tin', code: 'SWE1219E' },
      { name: 'Phát triển ứng dụng web nâng cao', code: 'SWE1218E' },
      { name: 'Đồ án chuyên ngành phát triển ứng dụng', code: 'SWE1420' }
    ]
  }
};

const ALL_RESULTS = [
  // ── ĐỒ ÁN (type: 'do-an') ──────────────────────────────────────────────────
  {
    id: 101,
    type: 'do-an',
    major: 'ai',
    subjectCode: 'ITE1173E',
    title: 'Phát hiện bất thường giao dịch tài chính sử dụng thuật toán Random Forest',
    student: 'Nguyễn Thanh Tùng',
    advisor: 'TS. Trần Minh Triết',
    year: '2025',
    department: 'Trí tuệ nhân tạo',
    similarity: '12%',
    similarityLevel: 'safe',
    desc: 'Đồ án thực hành môn Máy học (ITE1173E). Xây dựng mô hình Random Forest để phân loại các giao dịch thẻ tín dụng có dấu hiệu gian lận với độ chính xác cao.',
    tags: ['machinelearning', 'finance', 'fraud-detection']
  },
  {
    id: 102,
    type: 'do-an',
    major: 'ai',
    subjectCode: 'ITE1174E',
    title: 'Ứng dụng AI hỗ trợ phân loại rác thải tự động tại nguồn',
    student: 'Lê Hoài Nam',
    advisor: 'ThS. Nguyễn Thị Minh Thư',
    year: '2025',
    department: 'Trí tuệ nhân tạo',
    similarity: '15%',
    similarityLevel: 'safe',
    desc: 'Đồ án môn Phát triển ứng dụng trí tuệ nhân tạo (ITE1174E). Tích hợp mô hình YOLOv8 trên thiết bị di động để nhận diện và phân loại rác hữu cơ, vô cơ.',
    tags: ['ai-application', 'yolov8', 'environment']
  },
  {
    id: 103,
    type: 'do-an',
    major: 'ai',
    subjectCode: 'ITE1491',
    title: 'Hệ thống khuyến nghị phòng trọ thông minh dựa trên hành vi sinh viên',
    student: 'Phạm Minh Quân',
    advisor: 'TS. Hoàng Văn Đức',
    year: '2025',
    department: 'Trí tuệ nhân tạo',
    similarity: '9%',
    similarityLevel: 'safe',
    desc: 'Đồ án chuyên ngành trí tuệ nhân tạo (ITE1491). Sử dụng thuật toán lọc cộng tác (Collaborative Filtering) để đề xuất phòng trọ phù hợp nhất cho sinh viên.',
    tags: ['recommendation-system', 'ai-project', 'uef']
  },
  {
    id: 104,
    type: 'do-an',
    major: 'ai',
    subjectCode: 'ITE1176E',
    title: 'Phân tích xu hướng tiêu dùng điện tử từ dữ liệu mạng xã hội',
    student: 'Đỗ Thị Lan Anh',
    advisor: 'TS. Nguyễn Khắc Nhật',
    year: '2025',
    department: 'Trí tuệ nhân tạo',
    similarity: '24%',
    similarityLevel: 'high',
    desc: 'Đồ án môn Khai thác dữ liệu và ứng dụng (ITE1176E). Cào dữ liệu từ Facebook/TikTok và thực hiện phân tích cảm xúc (Sentiment Analysis) về các dòng smartphone mới.',
    tags: ['datamining', 'nlp', 'sentiment-analysis']
  },
  {
    id: 105,
    type: 'do-an',
    major: 'ai',
    subjectCode: 'ITE1181E',
    title: 'Hệ thống điểm danh lớp học bằng nhận diện khuôn mặt thời gian thực',
    student: 'Trương Quốc Bảo',
    advisor: 'TS. Bùi Hải Hưng',
    year: '2024',
    department: 'Trí tuệ nhân tạo',
    similarity: '14%',
    similarityLevel: 'safe',
    desc: 'Đồ án môn Thị giác máy tính (ITE1181E). Nhận diện khuôn mặt sinh viên uef qua camera IP và tự động cập nhật trạng thái điểm danh lên hệ thống.',
    tags: ['computervision', 'face-recognition', 'realtime']
  },
  {
    id: 106,
    type: 'do-an',
    major: 'networking',
    subjectCode: 'ITE1235E',
    title: 'Thiết kế mạng WAN kết nối đa chi nhánh bảo mật bằng IPSec VPN',
    student: 'Vũ Minh Khang',
    advisor: 'ThS. Lê Văn Lộc',
    year: '2025',
    department: 'Mạng máy tính',
    similarity: '11%',
    similarityLevel: 'safe',
    desc: 'Đồ án môn Mạng máy tính nâng cao (ITE1235E). Giả lập mô hình kết nối an toàn cho doanh nghiệp 3 chi nhánh trên nền tảng Cisco Packet Tracer.',
    tags: ['networking', 'ipsec-vpn', 'wan']
  },
  {
    id: 107,
    type: 'do-an',
    major: 'networking',
    subjectCode: 'ITE1255E',
    title: 'Xây dựng ứng dụng truyền tải file đa luồng qua Socket TCP/IP',
    student: 'Hoàng Tiến Đạt',
    advisor: 'TS. Đỗ Thanh Nghị',
    year: '2025',
    department: 'Mạng máy tính',
    similarity: '7%',
    similarityLevel: 'safe',
    desc: 'Đồ án môn Lập trình mạng máy tính (ITE1255E). Viết ứng dụng client-server bằng C# cho phép chia nhỏ file để tải song song và kiểm tra checksum tự động.',
    tags: ['socket-programming', 'multithreading', 'csharp']
  },
  {
    id: 108,
    type: 'do-an',
    major: 'is',
    subjectCode: 'ITE1224E',
    title: 'Phân hoạch và tối ưu hóa hiệu năng cơ sở dữ liệu bán lẻ',
    student: 'Trần Thị Mỹ Duyên',
    advisor: 'TS. Nguyễn Gia Trí',
    year: '2024',
    department: 'Hệ thống thông tin DN',
    similarity: '18%',
    similarityLevel: 'safe',
    desc: 'Đồ án môn Cơ sở dữ liệu nâng cao (ITE1224E). Thiết kế partition và tối ưu hóa index trên bảng lịch sử giao dịch chứa hơn 10 triệu bản ghi SQL Server.',
    tags: ['database-optimization', 'partitioning', 'sqlserver']
  },
  {
    id: 109,
    type: 'do-an',
    major: 'security',
    subjectCode: 'ITE1268E',
    title: 'Đánh giá an toàn thông tin và khai thác thử nghiệm SQL Injection',
    student: 'Nguyễn Duy Mạnh',
    advisor: 'TS. Lâm Quang Vinh',
    year: '2025',
    department: 'An toàn không gian mạng',
    similarity: '28%',
    similarityLevel: 'high',
    desc: 'Đồ án môn An toàn thông tin cho ứng dụng web (ITE1268E). Nghiên cứu các kỹ thuật SQL Injection, kiểm thử xâm nhập trang web demo và đề xuất giải pháp vá lỗ hổng.',
    tags: ['security', 'pentesting', 'sqli']
  },

  // ── KHÓA LUẬN (type: 'khoa-luan') ──────────────────────────────────────────
  {
    id: 201,
    type: 'khoa-luan',
    major: 'ai',
    title: 'Nghiên cứu mô hình ngôn ngữ lớn (LLM) hỗ trợ tư vấn học vụ tiếng Việt',
    student: 'Trần Ngọc Bảo Hân',
    advisor: 'TS. Nguyễn Minh Trí',
    year: '2025',
    department: 'Công nghệ thông tin',
    similarity: '8%',
    similarityLevel: 'safe',
    desc: 'Khóa luận tốt nghiệp chuyên ngành Trí tuệ nhân tạo. Tinh chỉnh (fine-tune) mô hình LLaMA-3 trên bộ dữ liệu quy chế học vụ UEF để trả lời tự động cho sinh viên.',
    tags: ['llm', 'nlp', 'vietnamese-chatbot']
  },
  {
    id: 202,
    type: 'khoa-luan',
    major: 'cybersecurity',
    title: 'Hệ thống phát hiện mã độc Ransomware dựa trên phân tích hành vi học sâu',
    student: 'Trịnh Gia Huy',
    advisor: 'TS. Đặng Minh Tuấn',
    year: '2025',
    department: 'An toàn thông tin',
    similarity: '12%',
    similarityLevel: 'safe',
    desc: 'Khóa luận tốt nghiệp chuyên ngành An toàn không gian mạng. Đề xuất kiến trúc CNN-LSTM phân tích chuỗi API call của các tiến trình để cô lập ransomware trước khi mã hóa file.',
    tags: ['ransomware', 'deeplearning', 'intrusion-detection']
  },
  {
    id: 203,
    type: 'khoa-luan',
    major: 'computer-networks',
    title: 'Nghiên cứu định tuyến tối ưu trong mạng phần mềm định nghĩa (SDN)',
    student: 'Bùi Văn Hùng',
    advisor: 'TS. Ngô Minh Hồng',
    year: '2024',
    department: 'Mạng máy tính',
    similarity: '15%',
    similarityLevel: 'safe',
    desc: 'Khóa luận tốt nghiệp chuyên ngành Mạng máy tính. Triển khai bộ điều khiển Ryu Controller để phân bổ băng thông động dựa trên thuật toán Dijkstra cải tiến.',
    tags: ['sdn', 'routing', 'ryu-controller']
  },

  // ── CHUYÊN ĐỀ (type: 'chuyen-de') ──────────────────────────────────────────
  {
    id: 301,
    type: 'chuyen-de',
    major: 'software-engineering',
    title: 'Thiết kế hệ thống vi dịch vụ (Microservices) chịu tải cao với Spring Boot',
    student: 'Vương Chí Cường',
    advisor: 'TS. Hoàng Minh Khải',
    year: '2025',
    department: 'Công nghệ phần mềm',
    similarity: '10%',
    similarityLevel: 'safe',
    desc: 'Chuyên đề nghiên cứu chuyên sâu về xây dựng cổng dịch vụ (API Gateway), Service Discovery, và Circuit Breaker để tăng khả năng chống chịu lỗi của hệ thống e-commerce.',
    tags: ['microservices', 'springboot', 'system-design']
  },
  {
    id: 302,
    type: 'chuyen-de',
    major: 'information-systems',
    title: 'Ứng dụng giải pháp ERP trong quản trị chuỗi cung ứng doanh nghiệp sản xuất',
    student: 'Nguyễn Thị Mai',
    advisor: 'TS. Phạm Hoàng Anh',
    year: '2025',
    department: 'Hệ thống thông tin',
    similarity: '31%',
    similarityLevel: 'high',
    desc: 'Chuyên đề nghiên cứu ứng dụng thực tế phân hệ cung ứng vật tư của SAP ERP cho quy trình vận hành tại một nhà máy chế biến thực phẩm.',
    tags: ['erp', 'sap', 'supplychain']
  }
];

// ─── Main Component ──────────────────────────────────────────────────────────
const LookupPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [previewThesis, setPreviewThesis] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [dbTheses, setDbTheses] = useState([]);
  const [driveFiles, setDriveFiles] = useState([]);

  useEffect(() => {
    const fetchDbTheses = async () => {
      try {
        const { data } = await thesisService.getAll({ page: 1, pageSize: 100 });
        if (data && data.items) {
          const mapped = data.items.map(t => ({
            id: t.id,
            type: t.category === 'Thesis' ? 'khoa-luan' : t.category === 'Topic' ? 'chuyen-de' : 'do-an',
            major: t.major,
            subjectCode: t.subjectCode,
            title: t.title,
            student: t.studentName,
            advisor: t.advisorName || 'Chưa phân công',
            year: t.createdAt ? new Date(t.createdAt).getFullYear().toString() : '2026',
            department: t.department || 'Khoa học Công nghệ',
            similarity: t.latestScore ? `${Math.round(t.latestScore * 3)}%` : '10%',
            similarityLevel: 'safe',
            desc: t.description || 'Chưa có mô tả chi tiết cho đề tài này.',
            tags: t.major ? [`#${t.major}`] : ['#research'],
            pdfUrl: t.filePath || '/Document%20Detail.pdf'
          }));
          setDbTheses(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch database theses in LookupPage", err);
      }
    };

    const fetchDriveFiles = async () => {
      try {
        const { data } = await thesisService.getDriveFiles('Temporary_PDF', 'Project');
        if (data && data.length > 0) {
          const mapped = data.map((f, idx) => ({
            id: `drive-${f.id || idx}`,
            type: 'do-an',
            major: '',
            subjectCode: '',
            title: f.name ? f.name.replace(/\.(pdf|docx?|xlsx?)$/i, '') : `Drive File ${idx + 1}`,
            student: 'Google Drive',
            advisor: 'Imported',
            year: f.modifiedTime ? new Date(f.modifiedTime).getFullYear().toString() : '2026',
            department: 'Temporary_PDF',
            similarity: '—',
            similarityLevel: 'safe',
            desc: `File từ Google Drive • ${f.mimeType || 'document'} • ${f.size ? (f.size / 1024 / 1024).toFixed(1) + ' MB' : 'N/A'}`,
            tags: ['#drive', '#imported'],
            pdfUrl: f.webViewLink || f.webContentLink || '#',
            isDriveFile: true
          }));
          setDriveFiles(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch Drive files in LookupPage", err);
      }
    };

    fetchDbTheses();
    fetchDriveFiles();
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
      tags: thesis.tags || ["#research"]
    });
    setShowPreviewModal(true);
  };

  const thesisType  = searchParams.get('type');
  const activeFilter = searchParams.get('filter');
  const activeSubject = searchParams.get('subject');
  const tc = thesisType ? TYPE_CONFIG[thesisType] : null;

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

  const clearType = () => setSearchParams({});

  const combinedResults = [...dbTheses, ...driveFiles, ...ALL_RESULTS];
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

  return (
    <div className="min-h-screen bg-surface-bright relative overflow-hidden">

      {/* ── Background blobs (change colour per type) ─────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={`absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[130px] transition-all duration-700 ${tc ? tc.blob1 : 'bg-primary/10'}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[110px] transition-all duration-700 ${tc ? tc.blob2 : 'bg-blue-400/10'}`} />
      </div>

      <div className="relative z-10 py-4 md:py-8 max-w-[1400px] mx-auto px-4 md:px-8">

        {/* ── Page Header ──────────────────────────────────────── */}
        <header className="text-center mb-8 md:mb-12">
          {/* Top badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest mb-5 border transition-all duration-500 ${tc ? tc.badgeBg : 'bg-primary/5 border-primary/10 text-primary'}`}>
            <span className={`material-symbols-outlined text-sm ${tc ? tc.badgeIcon : 'text-primary'}`}>
              {tc ? tc.icon : 'database'}
            </span>
            {tc ? tc.label : 'Kho lưu trữ học thuật UEF'}
          </div>

          {/* H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-on-surface mb-4 tracking-tighter leading-none">
            {tc ? (
              <>Tra Cứu <span className={`transition-colors duration-500 ${tc.accentText}`}>{tc.label}</span></>
            ) : (
              <>Tra Cứu <span className="text-primary/70">Đề Tài</span></>
            )}
          </h1>
          <p className="text-on-surface-variant font-medium opacity-60 max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
            {tc
              ? tc.desc + ' — Tìm kiếm và khám phá các đề tài xuất sắc của sinh viên UEF.'
              : 'Khám phá hàng nghìn đề tài nghiên cứu, đồ án, khóa luận và chuyên đề xuất sắc từ sinh viên và giảng viên qua các thế hệ.'}
          </p>
        </header>

        {/* ── Type banner (soft card, no gradient) ─────────────── */}
        {tc && (
          <div className={`${tc.bannerCard} rounded-2xl p-4 md:p-5 mb-5 flex items-center gap-3`}>
            {/* Colored icon */}
            <div className={`w-9 h-9 md:w-10 md:h-10 ${tc.bannerIconBg} rounded-xl flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-white text-lg">{tc.icon}</span>
            </div>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={`${tc.bannerLabel} font-black text-xs uppercase tracking-widest leading-none`}>{tc.label}</p>
              <p className={`${tc.bannerDesc} text-[10px] font-medium mt-1 opacity-80`}>{tc.desc}</p>
            </div>
            {/* Close */}
            <button
              onClick={clearType}
              title="Xem tất cả"
              className="shrink-0 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined text-sm text-on-surface-variant">close</span>
            </button>
          </div>
        )}

        {/* ── Filter chips row (horizontal scroll, mobile-friendly) ── */}
        {tc && (
          <div className="mb-7">
            {/* Section label */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`w-1 h-4 rounded-full ${tc.divider}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">{tc.filterIcon}</span>
                {tc.filterLabel}
              </span>
            </div>

            {/* Scrollable chip row — works on mobile + desktop */}
            <div
              className="flex gap-2 overflow-x-auto pb-2 px-1"
              style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {tc.filters.map((f) => {
                const isActive = (f.value === null && !activeFilter) || f.value === activeFilter;
                return (
                  <button
                    key={f.value ?? 'all'}
                    onClick={() => setFilter(f.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 rounded-full text-[11px] md:text-xs font-black whitespace-nowrap transition-all duration-200 shrink-0 ${
                      isActive ? tc.chipActive : tc.chipIdle
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px] md:text-[15px]">{f.icon}</span>
                    <span>{f.label}</span>
                    {f.sub && !isActive && (
                      <span className="opacity-50 text-[9px]">({f.sub})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
        <div className="flex justify-center mb-6 md:mb-8 animate-in fade-in duration-500">
          <div className="inline-flex p-1.5 bg-surface-container-low rounded-2xl md:rounded-3xl border border-outline-variant/30 shadow-sm overflow-x-auto max-w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                  className={`flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3.5 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 cursor-pointer ${
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
        <div className="max-w-[1000px] mx-auto mb-8 md:mb-14">
          <div className="bg-white p-2 md:p-3 rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-outline-variant hover:border-outline transition-all flex flex-col md:flex-row items-center gap-2 group">
            <div className="flex-1 flex items-center gap-3 md:gap-5 px-4 md:px-8 w-full">
              <span className={`material-symbols-outlined text-xl md:text-2xl transition-transform group-focus-within:scale-110 ${tc ? tc.accentText : 'text-primary'}`}>search</span>
              <input
                type="text"
                placeholder={tc ? `Tìm kiếm ${tc.label.toLowerCase()}...` : 'Nhập tên đề tài, tác giả hoặc từ khóa...'}
                className="w-full bg-transparent border-none outline-none text-sm md:text-base font-bold py-3 md:py-4 text-on-surface placeholder:text-on-surface-variant/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Always neutral dark button — no bright colour */}
            <button className="w-full md:w-auto px-8 md:px-12 py-3.5 md:py-5 rounded-[1.8rem] md:rounded-[2.5rem] font-black uppercase tracking-widest text-xs bg-on-surface hover:bg-primary text-white transition-all shadow-md active:scale-95">
              Tìm kiếm ngay
            </button>
          </div>

          {/* Trending tags */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
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
              <span className="material-symbols-outlined text-xs">account_balance</span> Khoa / Viện
            </label>
            <div className="relative">
              <select className="w-full px-4 md:px-6 py-3 md:py-3.5 bg-surface-container-lowest rounded-xl md:rounded-2xl outline-none border border-outline-variant focus:border-primary transition-all font-bold text-xs appearance-none cursor-pointer">
                <option>Tất cả các khoa</option>
                <option>Công nghệ thông tin</option>
                <option>Kinh tế - Quản trị</option>
                <option>Tài chính - Ngân hàng</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none text-sm">expand_more</span>
            </div>
          </div>

          <div className="flex-1 min-w-[160px] flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 ml-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">event</span> Năm học
            </label>
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Từ" className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl outline-none border border-outline-variant focus:border-primary transition-all font-bold text-xs" />
              <input type="text" placeholder="Đến" className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl outline-none border border-outline-variant focus:border-primary transition-all font-bold text-xs" />
            </div>
          </div>


          <button className="px-6 md:px-8 py-3 md:py-3.5 bg-on-surface text-white rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95 whitespace-nowrap">
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
            <div className="text-center py-20 bg-white rounded-[2rem] md:rounded-[2.5rem] border border-outline-variant shadow-sm flex flex-col items-center justify-center gap-4">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 animate-bounce">search_off</span>
              <h3 className="text-lg font-black text-on-surface">Không tìm thấy đề tài nào</h3>
              <p className="text-xs text-on-surface-variant max-w-sm">Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc chuyên ngành/môn học khác.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
              {filteredResults.map((r, idx) => (
                <div
                  key={r.id}
                  className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-outline-variant shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.07)] transition-all duration-500 group relative flex flex-col h-full overflow-hidden"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* Top accent line — type-coloured */}
                  <div className={`h-1.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-500 ${tc ? tc.cardAccent : 'from-primary/20 via-primary to-primary/20'}`} />

                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-[8px] font-black uppercase tracking-widest rounded-md">#{r.id}</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${tc ? tc.accentText : 'text-primary'}`}>{r.department}</span>
                      {r.subjectCode && (
                        <span className="ml-auto text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{r.subjectCode}</span>
                      )}
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
                      <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium mb-4 opacity-60 line-clamp-2 italic">"{r.desc}"</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {r.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-[8px] font-black text-on-surface-variant/30 uppercase tracking-widest">#{tag}</span>
                        ))}
                      </div>
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

          <div className="mt-12 md:mt-16 flex justify-center">
            <button className="px-8 md:px-10 py-3.5 md:py-4 bg-white border-2 border-outline-variant/50 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:border-primary hover:text-primary transition-all shadow-sm">
              XEM THÊM KẾT QUẢ
            </button>
          </div>
        </main>
      </div>

      {/* Quick Preview Modal (Glassmorphic UEF Style) */}
      {showPreviewModal && previewThesis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-outline-variant shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-10 relative flex flex-col gap-6">
            
            {/* Close Button */}
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute right-6 top-6 w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-all cursor-pointer text-on-surface-variant border-none bg-transparent"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
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
              <h3 className="text-xl sm:text-2xl font-black text-on-surface leading-snug">
                {previewThesis.title}
              </h3>
            </div>

            {/* Content Details Grid */}
            <div className="grid sm:grid-cols-2 gap-4 py-4 border-t border-b border-outline-variant/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/5 text-primary rounded-xl flex items-center justify-center border border-primary/10">
                  <span className="material-symbols-outlined text-base">person</span>
                </div>
                <div>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-0.5">Sinh viên</p>
                  <p className="text-xs font-black text-on-surface">{previewThesis.studentName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-secondary-container/10 text-primary rounded-xl flex items-center justify-center border border-outline-variant/30">
                  <span className="material-symbols-outlined text-base">psychology</span>
                </div>
                <div>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-0.5">Giảng viên HD</p>
                  <p className="text-xs font-black text-on-surface">{previewThesis.advisorName}</p>
                </div>
              </div>
            </div>

            {/* Abstract */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">segment</span> Tóm tắt nội dung
              </h4>
              <p className="text-xs text-on-surface leading-relaxed font-bold italic border-l-2 border-primary/20 pl-3">
                "{previewThesis.description}"
              </p>
            </div>

            {/* Similarity Badge */}
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/25">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  parseFloat(previewThesis.similarity) > 20 ? 'bg-red-50 text-error' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  <span className="material-symbols-outlined text-sm">speed</span>
                </div>
                <div>
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-0.5">Chỉ số trùng lắp</p>
                  <p className="text-xs font-black text-on-surface">Mức độ tương đồng: {previewThesis.similarity}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-md ${
                parseFloat(previewThesis.similarity) > 20 ? 'bg-red-100 text-error' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {parseFloat(previewThesis.similarity) > 20 ? 'Nguy cơ cao' : 'An toàn'}
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 mt-2 flex-col sm:flex-row">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  window.open(`/theses/${previewThesis.id}/flipbook`, '_blank');
                }}
                className="flex-1 py-3.5 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <span className="material-symbols-outlined text-base">menu_book</span>
                Đọc Sách 3D (Flipbook)
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  navigate(`/theses/${previewThesis.id}`, { state: previewThesis });
                }}
                className="py-3.5 px-6 bg-on-surface hover:bg-on-surface-variant text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                Chi tiết đầy đủ
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default LookupPage;
