import { listProfileFiles, PROFILE_PORTALS } from './profileFileStorage';
import { thesisService } from '../services/api';

const LOG_KEY = 'studentActivityLog';

const MONTH_LABELS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

const readLog = () => {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeLog = entries => {
  localStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(-800)));
};

/** Ghi nhận hoạt động sinh viên (visit, lookup, file_upload, game_play, ...) */
export const logStudentActivity = (type, meta = {}) => {
  const entry = { type, at: Date.now(), ...meta };
  writeLog([...readLog(), entry]);
  window.dispatchEvent(new CustomEvent('student-activity-updated'));
};

export const getStudentActivityLog = () => readLog();

const countByMonth = (entries, year) =>
  MONTH_LABELS.map((month, i) => ({
    month,
    count: entries.filter(e => {
      const d = new Date(e.at);
      return d.getFullYear() === year && d.getMonth() === i;
    }).length,
  }));

/** Tổng hợp số liệu thật từ log, kho file, API đồ án */
export const fetchStudentActivityStats = async () => {
  const log = readLog();
  const year = new Date().getFullYear();
  const monthly = countByMonth(log, year);

  let files = [];
  try {
    files = await listProfileFiles(PROFILE_PORTALS.student);
  } catch {
    files = [];
  }

  let thesisCount = 0;
  try {
    const { data } = await thesisService.getAll({});
    thesisCount = (data?.items || data || []).length;
  } catch {
    thesisCount = log.filter(e => e.type === 'thesis_view').length;
  }

  const visits = log.filter(e => e.type === 'visit' || e.type === 'page_view').length;
  const lookups = log.filter(e => e.type === 'lookup' || e.type === 'search').length;
  const gamePlays = log.filter(e => e.type === 'game_play').length;
  const uploads = Math.max(files.length, log.filter(e => e.type === 'file_upload').length);

  let favorites = 0;
  try {
    const raw = localStorage.getItem('studentFavorites');
    if (raw) favorites = JSON.parse(raw).length;
  } catch {
    favorites = log.filter(e => e.type === 'favorite').length;
  }

  return {
    year,
    monthly,
    maxMonth: Math.max(1, ...monthly.map(m => m.count)),
    summary: {
      visits: visits + lookups,
      files: uploads,
      theses: thesisCount,
      games: gamePlays,
      favorites,
    },
  };
};
