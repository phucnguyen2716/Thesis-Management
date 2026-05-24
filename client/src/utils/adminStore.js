const USERS_KEY = 'adminPortalUsers';
const AUDIT_KEY = 'adminLoginAudit';

const DEFAULT_USERS = [
  {
    id: 'u1',
    fullName: 'Admin User',
    email: 'admin@ethesis.edu.vn',
    role: 'Admin',
    studentId: '',
    department: 'Phòng CNTT',
    phone: '',
    isActive: true,
    createdAt: Date.now() - 86400000 * 120,
  },
  {
    id: 'u2',
    fullName: 'Dr. Nguyen Van A',
    email: 'advisor@ethesis.edu.vn',
    role: 'Advisor',
    studentId: '',
    department: 'Khoa Công nghệ thông tin',
    phone: '0901000001',
    isActive: true,
    createdAt: Date.now() - 86400000 * 90,
  },
  {
    id: 'u3',
    fullName: 'Tran Thi B',
    email: 'student@ethesis.edu.vn',
    role: 'Student',
    studentId: 'SV001',
    department: 'Khoa Công nghệ thông tin',
    phone: '0902000002',
    isActive: true,
    createdAt: Date.now() - 86400000 * 60,
  },
  {
    id: 'u4',
    fullName: 'Le Van C',
    email: 'student2@ethesis.edu.vn',
    role: 'Student',
    studentId: 'SV002',
    department: 'Khoa Quản trị kinh doanh',
    phone: '',
    isActive: true,
    createdAt: Date.now() - 86400000 * 30,
  },
];

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return fallback;
};

const writeJson = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event('admin-store-updated'));
};

export const ensureAdminSeed = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    writeJson(USERS_KEY, DEFAULT_USERS);
  }
};

export const getAdminUsers = () => {
  ensureAdminSeed();
  return readJson(USERS_KEY, DEFAULT_USERS);
};

export const saveAdminUsers = users => writeJson(USERS_KEY, users);

export const createAdminUser = payload => {
  const users = getAdminUsers();
  const user = {
    id: `u${Date.now()}`,
    fullName: payload.fullName?.trim() || '',
    email: payload.email?.trim().toLowerCase() || '',
    role: payload.role || 'Student',
    studentId: payload.studentId?.trim() || '',
    department: payload.department?.trim() || '',
    phone: payload.phone?.trim() || '',
    isActive: payload.isActive !== false,
    createdAt: Date.now(),
  };
  users.push(user);
  saveAdminUsers(users);
  return user;
};

export const updateAdminUser = (id, payload) => {
  const users = getAdminUsers().map(u =>
    u.id === id
      ? {
          ...u,
          ...payload,
          email: payload.email ? payload.email.trim().toLowerCase() : u.email,
        }
      : u
  );
  saveAdminUsers(users);
  return users.find(u => u.id === id);
};

export const deleteAdminUser = id => {
  const users = getAdminUsers().filter(u => u.id !== id);
  saveAdminUsers(users);
};

export const getLoginAudit = () => readJson(AUDIT_KEY, []);

export const logLoginAttempt = ({
  email,
  role,
  success,
  message = '',
  userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '',
}) => {
  const entry = {
    id: `log${Date.now()}`,
    email: email || '—',
    role: role || '—',
    success: !!success,
    message,
    userAgent: userAgent.slice(0, 120),
    at: Date.now(),
  };
  const logs = getLoginAudit();
  writeJson(AUDIT_KEY, [entry, ...logs].slice(0, 500));
  return entry;
};

export const findUserByEmail = email => {
  const norm = (email || '').trim().toLowerCase();
  return getAdminUsers().find(u => u.email.toLowerCase() === norm && u.isActive);
};
