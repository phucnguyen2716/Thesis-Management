const STORAGE_KEY = 'studentProfile';

const DEFAULT = {
  fullName: '',
  email: '',
  studentId: '',
  faculty: '',
  phone: '',
  bio: '',
  avatarUrl: '',
};

export const loadStudentProfile = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return {
    ...DEFAULT,
    fullName: user.fullName || '',
    email: user.email || '',
    studentId: user.studentId || user.id ? `UEF-${String(user.id).padStart(4, '0')}` : '',
    faculty: user.faculty || 'Khoa Công nghệ thông tin',
    phone: user.phone || '',
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
  };
};

export const saveStudentProfile = profile => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  localStorage.setItem(
    'user',
    JSON.stringify({
      ...user,
      role: user.role || 'Student',
      fullName: profile.fullName || user.fullName,
      email: profile.email,
      studentId: profile.studentId,
      faculty: profile.faculty,
      phone: profile.phone,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
    })
  );
  window.dispatchEvent(new Event('student-profile-updated'));
};
