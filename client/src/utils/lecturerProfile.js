const STORAGE_KEY = 'lecturerProfile';

export const loadLecturerProfile = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return {
    fullName: user.fullName || '',
    email: user.email || '',
    faculty: user.faculty || '',
    academicTitle: user.academicTitle || 'Giảng viên',
    phone: user.phone || '',
    employeeId: user.employeeId || '',
    bio: user.bio || '',
    expertise: user.expertise || '',
    avatarUrl: user.avatarUrl || '',
    majorIds: user.majorIds || [],
  };
};

export const saveLecturerProfile = profile => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  localStorage.setItem(
    'user',
    JSON.stringify({
      ...user,
      role: 'Advisor',
      fullName: profile.fullName || user.fullName,
      email: profile.email,
      faculty: profile.faculty,
      academicTitle: profile.academicTitle,
      phone: profile.phone,
      employeeId: profile.employeeId,
      bio: profile.bio,
      expertise: profile.expertise,
      avatarUrl: profile.avatarUrl,
      majorIds: profile.majorIds,
    })
  );
  window.dispatchEvent(new Event('lecturer-profile-updated'));
};
