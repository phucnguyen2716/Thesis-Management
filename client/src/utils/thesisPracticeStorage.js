const DRAFT_KEY = 'thesisPracticeDraft';

export const loadPracticeDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { title: 'Đồ án luyện tập', html: '', updatedAt: null };
};

export const savePracticeDraft = ({ title, html }) => {
  const data = { title, html, updatedAt: Date.now() };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  return data;
};

export const countWords = html => {
  const text = (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 0;
  return text.split(' ').filter(Boolean).length;
};
