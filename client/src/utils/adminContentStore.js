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
    desc: 'Hội đồng chuyên môn Khoa học và Công nghệ nhà trường đã hoàn tất công tác đánh giá, chấm điểm và chính thức công bố danh sách 10 sáng kiến tiêu biểu nhất trong học kỳ 1 năm học 2024 - 2025. Các đề tài đạt giải năm nay trải rộng trên nhiều lĩnh vực mũi nhọn như Trí tuệ nhân tạo, Công nghệ mạng thế hệ mới, Hệ thống nhúng và IoT, mở ra nhiều hướng phát triển thực tiễn đầy triển vọng.',
    content: 'Sau hơn 2 tháng làm việc nghiêm túc, khách quan và chuyên nghiệp, Hội đồng chuyên môn Khoa học và Công nghệ nhà trường đã hoàn tất việc đánh giá toàn diện hơn 80 đề tài nộp về từ các Khoa thành viên. Ban tổ chức xin chúc mừng 10 sáng kiến tiêu biểu nhất đã xuất sắc vượt qua các vòng phản biện gắt gao để đạt chứng nhận cấp Trường. Các đề tài đạt giải không chỉ thể hiện sự đầu tư bài bản về mặt học thuật mà còn giải quyết trực tiếp nhiều bài toán thực tế của doanh nghiệp và xã hội. Những nghiên cứu tiêu biểu bao gồm dự án phát hiện vi phạm giao thông bằng AI của nhóm sinh viên CNTT, và giải pháp tối ưu hệ thống IoT trong nông nghiệp công nghệ cao của sinh viên Điện tử. Nhà trường sẽ hỗ trợ kinh phí và thủ tục bảo hộ quyền tác giả cho các nhóm đạt giải cao để tiếp tục phát triển dự án thành các sản phẩm thương mại.',
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
    desc: 'Để hỗ trợ sinh viên trong quá trình học tập, nghiên cứu và làm đồ án tốt nghiệp, Ban Thư viện phối hợp cùng Khoa CNTT xây dựng tài liệu hướng dẫn tra cứu kho dữ liệu số hóa. Hệ thống mới tích hợp công cụ tìm kiếm thông minh theo từ khóa, ngành học và mã số giảng viên hướng dẫn, giúp việc tiếp cận kho tri thức số hóa trở nên dễ dàng và nhanh chóng hơn bao giờ hết.',
    content: 'Nhằm nâng cao chất lượng tự học và thúc đẩy phong trào nghiên cứu khoa học trong sinh viên, Thư viện số chính thức giới thiệu cẩm nang hướng dẫn sử dụng kho dữ liệu sáng kiến học thuật số hóa. Sinh viên có thể truy cập hệ thống trực tuyến thông qua tài khoản sinh viên được cấp. Quy trình tra cứu gồm 4 bước đơn giản: 1. Đăng nhập hệ thống; 2. Sử dụng thanh tìm kiếm thông minh kết hợp các bộ lọc chuyên sâu (Lĩnh vực, Học kỳ, Giảng viên); 3. Đọc tóm tắt và đánh giá mức độ tương quan của đề tài; 4. Đăng ký mượn bản PDF đầy đủ hoặc tham khảo trực tuyến qua trình đọc sách tương tác. Ban quản lý cũng lưu ý sinh viên tuân thủ nghiêm ngặt các quy định về trích dẫn tài liệu tham khảo để tránh các vi phạm liên quan đến quyền tác giả và đạo văn trong nghiên cứu khoa học.',
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
    desc: 'Nhà trường chính thức đưa vào thử nghiệm hệ thống Trí tuệ nhân tạo (AI) tích hợp mô hình ngôn ngữ lớn Gemini của Google. Hệ thống mới này sẽ hỗ trợ sinh viên tóm tắt các tài liệu nghiên cứu dày hàng trăm trang, phân tích xu hướng đề tài tự động, đồng thời cung cấp giao diện chấm điểm cấu trúc bài viết và kiểm tra mức độ trùng lặp nội dung theo thời gian thực.',
    content: 'Nằm trong chiến lược xây dựng Đại học Thông minh và Chuyển đổi số toàn diện, hệ thống eThesis chính thức tích hợp trợ lý học thuật AI Gemini. Trợ lý AI này cung cấp 3 tính năng cốt lõi cho sinh viên và giảng viên: Thứ nhất là \'Tóm tắt thông minh\', giúp trích xuất các luận điểm, phương pháp và kết quả chính của một bài nghiên cứu dài chỉ trong vài giây; Thứ hai là \'Kiểm tra cấu trúc\', AI sẽ đối chiếu bản thảo của sinh viên với các tiêu chuẩn trình bày khóa luận tốt nghiệp để đưa ra nhận xét định dạng, từ ngữ và lỗi ngữ pháp; Thứ giúp \'Gợi ý tài liệu liên quan\', dựa trên ngữ nghĩa của bản thảo để đề xuất các bài báo khoa học liên quan trực tiếp. Việc ứng dụng công nghệ này hứa hẹn sẽ nâng cao hiệu quả làm việc nhóm, rút ngắn thời gian chuẩn bị tài liệu và nâng tầm chất lượng khoa học của các công trình nghiên cứu trong nhà trường.',
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
    content: payload.content || '',
    sourceLink: payload.sourceLink || '',   // link gốc từ đề xuất giảng viên
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
