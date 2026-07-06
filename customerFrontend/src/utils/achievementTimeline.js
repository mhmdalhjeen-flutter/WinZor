const NODE_WIDTH = 88;
const MIN_CENTER_GAP = 108;
const TRACK_PAD = 28;
const MIN_TIMELINE_WIDTH = 320;
const PX_PER_POINT = 0.4;

/**
 * يوزّع الجوائز على محور أفقي:
 * - أول جائزة عند البداية، آخر جائزة (أعلى نقاط) عند النهاية
 * - مواقع وسيطة نسبية للنقاط مع حد أدنى للمسافة لمنع التداخل
 */
export function computeTimelineLayout(milestones) {
  const sorted = [...milestones].sort((a, b) => (a.pointsRequired || 0) - (b.pointsRequired || 0));
  const n = sorted.length;

  if (n === 0) {
    return {
      width: MIN_TIMELINE_WIDTH,
      innerWidth: 0,
      edgePad: TRACK_PAD + NODE_WIDTH / 2,
      minPoints: 0,
      maxPoints: 1,
      items: [],
      userPx: () => 0,
    };
  }

  const pts = sorted.map((m) => m.pointsRequired || 0);
  const minPoints = pts[0];
  const maxPoints = pts[n - 1];
  const range = maxPoints - minPoints || 1;
  const edgePad = TRACK_PAD + NODE_WIDTH / 2;

  if (n === 1) {
    return {
      width: MIN_TIMELINE_WIDTH,
      innerWidth: 0,
      edgePad,
      minPoints,
      maxPoints,
      items: [{ milestone: sorted[0], px: 0 }],
      userPx: () => 0,
    };
  }

  const minInner = (n - 1) * MIN_CENTER_GAP;
  const propInner = Math.max(minInner, range * PX_PER_POINT);
  let innerWidth = propInner;

  const px = pts.map((p) => ((p - minPoints) / range) * innerWidth);

  for (let i = 1; i < n; i++) {
    px[i] = Math.max(px[i], px[i - 1] + MIN_CENTER_GAP);
  }

  innerWidth = Math.max(innerWidth, px[n - 1]);
  px[0] = 0;
  px[n - 1] = innerWidth;

  for (let pass = 0; pass < 4; pass++) {
    for (let i = 1; i < n - 1; i++) {
      const target = ((pts[i] - minPoints) / range) * innerWidth;
      px[i] = Math.min(
        Math.max(target, px[i - 1] + MIN_CENTER_GAP),
        px[i + 1] - MIN_CENTER_GAP
      );
    }
    for (let i = 1; i < n; i++) {
      px[i] = Math.max(px[i], px[i - 1] + MIN_CENTER_GAP);
    }
    for (let i = n - 2; i >= 0; i--) {
      px[i] = Math.min(px[i], px[i + 1] - MIN_CENTER_GAP);
    }
    px[0] = 0;
    px[n - 1] = innerWidth;
  }

  const width = Math.max(MIN_TIMELINE_WIDTH, innerWidth + edgePad * 2);

  const items = sorted.map((milestone, i) => ({
    milestone,
    px: px[i],
  }));

  const userPx = (userPoints) => {
    if (userPoints <= minPoints) return px[0];
    if (userPoints >= maxPoints) return px[n - 1];

    for (let i = 0; i < n - 1; i++) {
      if (userPoints >= pts[i] && userPoints <= pts[i + 1]) {
        const t = (userPoints - pts[i]) / (pts[i + 1] - pts[i] || 1);
        return px[i] + t * (px[i + 1] - px[i]);
      }
    }
    return px[n - 1];
  };

  return {
    width,
    innerWidth,
    edgePad,
    minPoints,
    maxPoints,
    items,
    userPx,
  };
}
