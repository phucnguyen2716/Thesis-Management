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

export const getInterestProfile = () => {
  const log = readLog();
  const majorPoints = {};
  const tagPoints = {};

  log.forEach(entry => {
    let pts = 0;
    if (entry.type === 'thesis_view') pts = 1;
    else if (entry.type === 'thesis_download') pts = 3;
    else if (entry.type === 'thesis_favorite') pts = 5;

    if (pts > 0) {
      if (entry.major) {
        const key = entry.major.trim().toLowerCase();
        majorPoints[key] = (majorPoints[key] || 0) + pts;
      }
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => {
          const cleanTag = tag.trim().toLowerCase();
          tagPoints[cleanTag] = (tagPoints[cleanTag] || 0) + pts;
        });
      }
    }
  });

  return { majorPoints, tagPoints };
};

export const getRecommendedTheses = (allTheses, favoritesList = [], limit = 6) => {
  const { majorPoints, tagPoints } = getInterestProfile();
  const favIds = new Set(favoritesList.map(f => f.id.toString()));

  const scored = allTheses.map(thesis => {
    if (favIds.has(thesis.id.toString())) {
      return { thesis, score: -1 };
    }

    let score = 0;
    if (thesis.major) {
      const key = thesis.major.trim().toLowerCase();
      score += majorPoints[key] || 0;
    }
    if (thesis.tags && Array.isArray(thesis.tags)) {
      thesis.tags.forEach(tag => {
        const cleanTag = tag.trim().toLowerCase();
        score += tagPoints[cleanTag] || 0;
      });
    }

    return { thesis, score };
  });

  const recommended = scored
    .filter(item => item.score >= 0)
    .sort((a, b) => b.score - a.score || b.thesis.id - a.thesis.id)
    .map(item => item.thesis);

  return recommended.slice(0, limit);
};

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

