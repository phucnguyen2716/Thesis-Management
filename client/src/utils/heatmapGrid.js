/** Sinh lưới 10×6 cho heatmap (giống mockup Plagiarism Check) */
const OPACITIES = [5, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70];

export function buildHeatmapGrid(sectionScores = [2, 5, 8, 4, 1], seed = 0) {
  const cells = [];
  const colsPerSection = 2;
  let n = seed;
  const rand = () => {
    n = (n * 9301 + 49297) % 233280;
    return n / 233280;
  };

  for (let s = 0; s < 5; s++) {
    const intensity = Math.min(1, (sectionScores[s] || 0) / 20);
    for (let c = 0; c < colsPerSection; c++) {
      for (let r = 0; r < 6; r++) {
        const roll = rand();
        let opacity = 5;
        if (roll < intensity * 0.35) opacity = OPACITIES[6 + Math.floor(rand() * 4)];
        else if (roll < intensity * 0.7) opacity = OPACITIES[3 + Math.floor(rand() * 3)];
        else if (roll < intensity) opacity = OPACITIES[1 + Math.floor(rand() * 2)];
        cells.push(opacity);
      }
    }
  }
  while (cells.length < 60) cells.push(5);
  return cells.slice(0, 60);
}
