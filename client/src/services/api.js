import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5145/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
  getReviews: (id) => api.get(`/thesis/${id}/reviews`),
  addReview: (id, data) => api.post(`/thesis/${id}/reviews`, data),
  getComments: (id) => api.get(`/thesis/${id}/comments`),
  addComment: (id, data) => api.post(`/thesis/${id}/comments`, data),
};

export const chatbotService = {
  chat: (prompt) => api.post('/chatbot/chat', { prompt }),
  getHistory: () => api.get('/chatbot/history'),
};

export const plagiarismService = {
  check: (thesisId) => api.post(`/plagiarism/check/${thesisId}`),
  seed: () => api.post('/plagiarism/seed'),
};

export const adminService = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAuditLogs: () => api.get('/admin/audit-logs'),
};

export default api;
