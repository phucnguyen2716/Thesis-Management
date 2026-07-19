import axios from 'axios';

let resolvedApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5145';
if (window.location.hostname === 'ethesis-frontend-portal.onrender.com') {
  resolvedApiUrl = 'https://ethesis-backend-api.onrender.com';
}
export const API_URL = resolvedApiUrl;

let resolvedNotificationUrl = import.meta.env.VITE_NOTIFICATION_URL || 'http://localhost:5145';
if (window.location.hostname === 'ethesis-frontend-portal.onrender.com') {
  resolvedNotificationUrl = 'https://ethesis-backend-api.onrender.com';
}
export const NOTIFICATION_URL = resolvedNotificationUrl;
export const resolveFileUrl = (url) => {
  if (!url) return '';
  let cleanedUrl = url;
  if (cleanedUrl.startsWith('http://localhost:5145') || cleanedUrl.startsWith('https://localhost:5145')) {
    cleanedUrl = cleanedUrl.replace(/^https?:\/\/localhost:5145/, '');
  }
  // Check if it's the mock frontend PDF file, which should be served from frontend static path
  if (cleanedUrl.includes('Document%20Detail.pdf') || cleanedUrl.includes('Document Detail.pdf')) {
    return cleanedUrl.startsWith('/') ? cleanedUrl : `/${cleanedUrl}`;
  }
  if (cleanedUrl.startsWith('/')) {
    return `${API_URL}${cleanedUrl}`;
  }
  return cleanedUrl;
};
const PLAGIARISM_API_URL = import.meta.env.VITE_PLAGIARISM_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const geminiKey = localStorage.getItem('gemini_api_key');
  if (geminiKey) {
    config.headers['X-Gemini-API-Key'] = geminiKey;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  googleLogin: (token) => api.post('/auth/google-login', { token }),
};

export const thesisService = {
  getAll: (params) => api.get('/thesis', { params }),
  getById: (id) => api.get(`/thesis/${id}`),
  convertDriveFile: (filePath) => api.post('/drive/convert', null, { params: { filePath } }),
  create: (data) => api.post('/thesis', data),
  update: (id, data) => api.put(`/thesis/${id}`, data),
  delete: (id) => api.delete(`/thesis/${id}`),
  submit: (id) => api.post(`/thesis/${id}/submit`),
  assignAdvisor: (id, data) => api.post(`/thesis/${id}/assign-advisor`, data),
  approve: (id) => api.post(`/thesis/${id}/approve`),
  reject: (id, reason) => api.post(`/thesis/${id}/reject`, reason),
  upload: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/thesis/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getStats: () => api.get('/thesis/stats'),
  getDriveFiles: (folder = 'all', category = 'Project') => api.get('/drive/files', { params: { folder, category } }),
  getDriveStatus: () => api.get('/drive/status'),
  getAuthorizeUrl: (from) => api.get('/drive/authorize-url', { params: { from } }),
  testDriveConnection: () => api.post('/drive/test-connection'),
  getReviews: (id) => api.get(`/thesis/${id}/reviews`),
  addReview: (id, data) => api.post(`/thesis/${id}/reviews`, data),
  getComments: (id) => api.get(`/thesis/${id}/comments`),
  addComment: (id, data) => api.post(`/thesis/${id}/comments`, data),
  evaluatePractice: (data) => api.post('/thesis/practice/evaluate', data),
  getAiSummary: (id) => api.get(`/thesis/${id}/ai-summary`),
};

export const chatbotService = {
  chat: (prompt) => api.post('/chatbot/chat', { prompt }),
  getHistory: () => api.get('/chatbot/history'),
  updateHistory: (id, data) => api.put(`/chatbot/history/${id}`, data),
  deleteHistory: (id) => api.delete(`/chatbot/history/${id}`),
};

export const geminiService = {
  analyze: (prompt) => api.post('/chatbot/chat', { prompt }),
};



export const plagiarismService = {
  check: (thesisId) => api.post(`/plagiarism/check/${thesisId}`),
  getStatus: (thesisId) => api.get(`/plagiarism/status/${thesisId}`),
  seed: () => api.post('/plagiarism/seed'),
};

/**
 * Gọi trực tiếp Check-plagarism-repo server (port 5000) với streaming NDJSON.
 * @param {string} text - Văn bản cần kiểm tra
 * @param {(progress: number) => void} onProgress - Callback tiến độ 0-100
 * @returns {Promise<object>} - Kết quả cuối: { overallScore, plagiarismPercentage, totalSentences, plagiarizedSentences, results }
 */
export const realPlagiarismCheck = async (text, onProgress) => {
  const response = await fetch(`${PLAGIARISM_API_URL}/api/plagiarism-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Plagiarism server error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.type === 'progress' && onProgress) {
          onProgress(msg.progress);
        } else if (msg.type === 'complete') {
          finalResult = msg.result;
        }
      } catch { /* ignore malformed line */ }
    }
  }

  if (!finalResult) throw new Error('Không nhận được kết quả từ máy chủ kiểm tra đạo văn.');
  return finalResult;
};

export const socialService = {
  getAll: (publishedOnly = false) => api.get('/social/posts', { params: { publishedOnly } }),
  create: (data) => api.post('/social/posts', data),
  update: (id, data) => api.put(`/social/posts/${id}`, data),
  delete: (id) => api.delete(`/social/posts/${id}`),
};

export const adminService = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAuditLogs: () => api.get('/admin/audit-logs'),
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
};

export default api;
