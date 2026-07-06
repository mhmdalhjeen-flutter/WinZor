export const STAGES = [
  { id: 'bronze', label: 'برونزي', min: 0, max: 99, color: '#cd7f32', stars: 1 },
  { id: 'silver', label: 'فضّي', min: 100, max: 299, color: '#94a3b8', stars: 2 },
  { id: 'gold', label: 'ذهبي', min: 300, max: 599, color: '#eab308', stars: 3 },
  { id: 'platinum', label: 'بلاتيني', min: 600, max: Infinity, color: '#a78bfa', stars: 4 },
];

export const getStage = (points = 0) =>
  STAGES.find((s) => points >= s.min && points <= s.max) || STAGES[0];

export const getProgress = (points = 0) => {
  const stage = getStage(points);
  const next = STAGES[STAGES.indexOf(stage) + 1];
  if (!next) return { stage, next: null, progress: 100, pointsToNext: 0 };
  return {
    stage,
    next,
    progress: Math.min(100, ((points - stage.min) / (next.min - stage.min)) * 100),
    pointsToNext: next.min - points,
  };
};
