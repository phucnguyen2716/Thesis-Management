/**
 * Điểm tiêu biểu: chất lượng học thuật + độ nguyên gốc (ít đạo văn / AI).
 * Thay bằng API / rubric thật sau.
 */
export function computeExemplaryScore(submission) {
  const rubric = submission.rubric || {};
  const rubricAvg =
    Object.values(rubric).reduce((sum, v) => sum + Number(v || 0), 0) /
    Math.max(Object.keys(rubric).length, 1);

  const gradePart =
    submission.grade != null && submission.grade > 0
      ? Number(submission.grade) * 10
      : rubricAvg > 0
        ? rubricAvg * 10
        : 55;

  const integrityPart = Math.max(0, 100 - submission.similarity * 1.8 - submission.aiPercent * 1.2);
  const statusBonus =
    submission.status === 'acceptable' ? 12 : submission.status === 'review' ? 4 : -8;

  return Math.min(100, Math.max(0, Math.round(gradePart * 0.42 + integrityPart * 0.43 + statusBonus)));
}

export function getRankedSubmissions(submissions, majorFilter = 'all') {
  const filtered =
    majorFilter === 'all'
      ? submissions
      : submissions.filter(s => s.majorId === majorFilter);

  return [...filtered]
    .map(s => ({ ...s, exemplaryScore: computeExemplaryScore(s) }))
    .sort((a, b) => b.exemplaryScore - a.exemplaryScore);
}

export function getMajorStats(submissions, majors) {
  return majors.map(major => {
    const inMajor = submissions.filter(s => s.majorId === major.id);
    const ranked = getRankedSubmissions(inMajor, major.id);
    return {
      ...major,
      count: inMajor.length,
      topThesis: ranked[0] || null,
      avgScore:
        ranked.length > 0
          ? Math.round(ranked.reduce((s, t) => s + t.exemplaryScore, 0) / ranked.length)
          : 0,
    };
  });
}
