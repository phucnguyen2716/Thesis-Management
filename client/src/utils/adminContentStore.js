/** Admin: social media (tin/bài đăng) + cấu hình flow kiểm tra đạo văn */

const SOCIAL_KEY = 'adminSocialPosts';
const PLAGIARISM_KEY = 'adminPlagiarismFlow';

const DEFAULT_SOCIAL = [
  {
    id: 'n1',
    title: 'Công bố danh sách các sáng kiến tiêu biểu học kỳ 1 năm 2024',
    date: '20/10/2024',
    category: 'Tin mới',
    badgeClass: 'bg-primary text-on-primary',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDVaKckFBO6OahgQhL5POM9HkyyecIPbbQpO1dWLvQHUSBcj49wyeR69ByLr8G1HshrXjAzidE5A-wOT6RA7V7eLvC33ch_y8-bNDvNRg1HwmmnaJTAcz8NBYG9tH7A-4q9Aydwy8_z9zEL6dgejrSFafcXOHrBluNSxzC-1l68EVFbA93qGEExIzjN4r7IEyBbD-vnEDCAtJDWdRszsVJdArxh12IA2eUzDBOvizUG5zZuFjD1jL69T8qDOK5VDX_pqXpNUf76mRsk',
    desc: 'Hội đồng chuyên môn đã hoàn tất việc chấm điểm và lựa chọn ra 10 sáng kiến xuất sắc nhất.',
    published: true,
    channels: ['portal', 'facebook'],
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'n2',
    title: 'Hướng dẫn tra cứu và tham khảo kho dữ liệu sáng kiến học thuật',
    date: '18/10/2024',
    category: 'Hướng dẫn',
    badgeClass: 'bg-blue-600 text-white',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9CBcdVbi_lVPZdj1fMXkDrm6UXNpgAQzAbT5BzIzcVc1wXGTHcmwvFTTaIEgcFm1wFyYIkxuYp8LKwSkizyelJ4bjIqymKLSgFfukFSODI8QlHCdYgYlzoIpXWPGJ6pwNFnkIc54kH5CFyy19WYTo0HdQ9cSVQ1CNsuV41pZn1z5hhO7krZslwN6YtBpL_fRpzCvXn5HpiOcH4ntw_v0VI8GftCgk9T6IiQz7ikPDYxY5Gr4t4CGGG3_-YsRIM4rMsyCMlTMvyufS',
    desc: 'Sinh viên có thể sử dụng công cụ tìm kiếm thông minh để truy cập tài liệu nghiên cứu.',
    published: true,
    channels: ['portal'],
    createdAt: Date.now() - 86400000 * 28,
  },
  {
    id: 'n3',
    title: 'Hệ thống AI Gemini hỗ trợ phân tích và tóm tắt sáng kiến',
    date: '15/10/2024',
    category: 'Tính năng',
    badgeClass: 'bg-purple-600 text-white',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuANxGO4D6ojuZlYk7MEhtq_38tsfUs324mV9MOXepahz-7q_MfJXjqjvHbgLt27PAjQquIgxNbU4l8TFLxxTqokf9fiaJRq8mxeZIqQU-_fhU1ho_Omjv4xl_49kl_cJIIr3tyg5-3Lu3GYiLPM2N3psKIdMJtF-p6DcwYjflkXf24kayQ57904JAS0eyc8PMffw-nv4NNzDqKse0KbLJ4YWmW0Hqys7UoOYciK4A2BTM_k2g3B1Slq6NwqcMgwtqtuEWUyLaQ7lH_W',
    desc: 'Tích hợp Gemini giúp sinh viên nắm bắt nội dung cốt lõi của đề tài phức tạp.',
    published: true,
    channels: ['portal', 'linkedin'],
    createdAt: Date.now() - 86400000 * 25,
  },
];

export const SOCIAL_CATEGORIES = ['Tin mới', 'Hướng dẫn', 'Tính năng', 'Báo chí'];
export const SOCIAL_CHANNELS = ['portal', 'facebook', 'linkedin', 'zalo'];

const DEFAULT_PLAGIARISM_FLOW = {
  enabled: true,
  policyText:
    'Sinh viên nộp đồ án → hệ thống xếp hàng đợi → quét BM25/Elasticsearch → heatmap & so khớp song song → phát hiện AI → giảng viên chấm và phản hồi. Vượt ngưỡng sẽ chuyển trạng thái cảnh báo hoặc flagged.',
  steps: [
    { id: 'submit', order: 1, label: 'Nộp bài', desc: 'Sinh viên upload PDF/DOCX', icon: 'upload_file', active: true },
    { id: 'queue', order: 2, label: 'Hàng đợi', desc: 'GV chọn bài trong queue', icon: 'inbox', active: true },
    { id: 'scan', order: 3, label: 'BM25 / ES', desc: 'So khớp kho tài liệu & đồ án', icon: 'document_scanner', active: true },
    { id: 'heatmap', order: 4, label: 'Heatmap', desc: 'Lưới 10×6 mức trùng lặp', icon: 'grid_on', active: true },
    { id: 'compare', order: 5, label: 'So khớp', desc: 'Song song nguồn trích dẫn', icon: 'compare', active: true },
    { id: 'ai', order: 6, label: 'AI detect', desc: 'Ước lượng % nội dung AI', icon: 'cognition', active: true },
    { id: 'grade', order: 7, label: 'Chấm điểm', desc: 'Rubric + nhận xét GV', icon: 'rate_review', active: true },
  ],
  thresholds: {
    similarityReview: 25,
    similarityFlag: 40,
    aiReview: 35,
    aiFlag: 60,
  },
  engines: {
    bm25: true,
    elasticsearch: true,
    heatmap: true,
    sideBySide: true,
    autoRecheckHours: 24,
  },
  statusRules: [
    { status: 'pending', label: 'Chờ quét', maxSimilarity: null },
    { status: 'review', label: 'Cần xem xét', maxSimilarity: 25 },
    { status: 'flagged', label: 'Cảnh báo', maxSimilarity: 40 },
    { status: 'approved', label: 'Đã duyệt', maxSimilarity: null },
  ],
};

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return fallback;
};

const write = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event('admin-content-updated'));
};

export const ensureContentSeed = () => {
  if (!localStorage.getItem(SOCIAL_KEY)) write(SOCIAL_KEY, DEFAULT_SOCIAL);
  if (!localStorage.getItem(PLAGIARISM_KEY)) write(PLAGIARISM_KEY, DEFAULT_PLAGIARISM_FLOW);
};

/** Bài đăng social — chỉ published hiển thị portal SV */
export const getSocialPosts = (opts = {}) => {
  ensureContentSeed();
  let posts = read(SOCIAL_KEY, DEFAULT_SOCIAL);
  if (opts.publishedOnly !== false) posts = posts.filter(p => p.published !== false);
  return posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};

export const getAllSocialPosts = () => {
  ensureContentSeed();
  return read(SOCIAL_KEY, DEFAULT_SOCIAL);
};

export const saveSocialPosts = posts => write(SOCIAL_KEY, posts);

export const createSocialPost = payload => {
  const posts = getAllSocialPosts();
  const post = {
    id: `n${Date.now()}`,
    title: payload.title || '',
    date: payload.date || new Date().toLocaleDateString('vi-VN'),
    category: payload.category || 'Tin mới',
    badgeClass: payload.badgeClass || 'bg-primary text-on-primary',
    image: payload.image || '',
    desc: payload.desc || '',
    published: payload.published !== false,
    channels: payload.channels || ['portal'],
    createdAt: Date.now(),
  };
  posts.unshift(post);
  saveSocialPosts(posts);
  return post;
};

export const updateSocialPost = (id, payload) => {
  const posts = getAllSocialPosts().map(p => (p.id === id ? { ...p, ...payload } : p));
  saveSocialPosts(posts);
};

export const deleteSocialPost = id => {
  saveSocialPosts(getAllSocialPosts().filter(p => p.id !== id));
};

export const getPlagiarismFlow = () => {
  ensureContentSeed();
  return read(PLAGIARISM_KEY, DEFAULT_PLAGIARISM_FLOW);
};

export const savePlagiarismFlow = config => write(PLAGIARISM_KEY, config);

/** Ngưỡng dùng chung portal GV (đọc từ cấu hình admin) */
export const getPlagiarismThresholds = () => {
  const { thresholds, enabled, engines } = getPlagiarismFlow();
  return { ...thresholds, enabled, engines };
};
