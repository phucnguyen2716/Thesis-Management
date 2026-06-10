import { MAJORS, SUBMISSIONS } from '../data/lecturerMockData';
import { computeExemplaryScore } from './lecturerRanking';

const STATUS_LABELS = {
  acceptable: 'Đạt chuẩn',
  review: 'Cần xem xét',
  flagged: 'Cảnh báo',
};

export function getSubmissionsByMajorChart() {
  return MAJORS.map(m => {
    const items = SUBMISSIONS.filter(s => s.majorId === m.id);
    const avgSim =
      items.length > 0
        ? Math.round(items.reduce((a, s) => a + s.similarity, 0) / items.length)
        : 0;
    const avgAi =
      items.length > 0
        ? Math.round(items.reduce((a, s) => a + s.aiPercent, 0) / items.length)
        : 0;
    const avgExemplary =
      items.length > 0
        ? Math.round(
            items.reduce((a, s) => a + computeExemplaryScore(s), 0) / items.length
          )
        : 0;
    return {
      name: m.short,
      fullName: m.label,
      count: items.length,
      avgSimilarity: avgSim,
      avgAi: avgAi,
      avgExemplary: avgExemplary,
    };
  });
}

export function getStatusPieChart() {
  const counts = { acceptable: 0, review: 0, flagged: 0 };
  SUBMISSIONS.forEach(s => {
    if (counts[s.status] !== undefined) counts[s.status]++;
  });
  return Object.entries(counts).map(([key, value]) => ({
    name: STATUS_LABELS[key] || key,
    value,
    key,
  }));
}

export function getSimilarityTrendChart() {
  return SUBMISSIONS.map(s => ({
    name: s.student.split(' ').pop(),
    title: s.title.length > 20 ? `${s.title.slice(0, 20)}…` : s.title,
    similarity: s.similarity,
    ai: s.aiPercent,
    major: MAJORS.find(m => m.id === s.majorId)?.short ?? '—',
  }));
}

export const CHART_COLORS = {
  teal: '#0f766e',
  cyan: '#0891b2',
  amber: '#d97706',
  red: '#dc2626',
  slate: '#64748b',
  pie: ['#0f766e', '#0891b2', '#d97706', '#6366f1', '#db2777'],
  status: {
    acceptable: '#059669',
    review: '#d97706',
    flagged: '#dc2626',
  },
};
