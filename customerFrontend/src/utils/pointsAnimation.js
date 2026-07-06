/** موضع اختياري لبدء أنيميشن النقاط (يُستهلك مع updateUser التالي) */
let pendingOrigin = null;

export function setPointsFloatOrigin(origin) {
  pendingOrigin = origin;
}

export function consumePointsFloatOrigin() {
  const origin = pendingOrigin;
  pendingOrigin = null;
  return origin;
}

export function getPointsAnchorRect() {
  const el = document.getElementById('points-header-anchor');
  if (!el) {
    return { x: window.innerWidth * 0.78, y: 28, width: 110, height: 44 };
  }
  const r = el.getBoundingClientRect();
  return {
    x: r.left + r.width / 2,
    y: r.top + r.height / 2,
    width: r.width,
    height: r.height,
  };
}

export const POINTS_FLOAT_EVENT = 'points:float';

export function dispatchPointsFloat(detail) {
  const delta = Number(detail?.delta);
  if (!delta || Number.isNaN(delta)) return;
  window.dispatchEvent(new CustomEvent(POINTS_FLOAT_EVENT, {
    detail: {
      delta,
      origin: detail?.origin ?? null,
      direction: delta > 0 ? 'gain' : 'loss',
    },
  }));
}

/**
 * تحديث النقاط من استجابة API مع animation بالاتجاه الصحيح فقط.
 */
export function commitPointsUpdate(updateUser, nextPoints, options = {}) {
  if (options.origin) setPointsFloatOrigin(options.origin);
  const patch = {};
  if (nextPoints != null) patch.points = nextPoints;
  if (options.energy != null) patch.energy = options.energy;
  if (Object.keys(patch).length) updateUser(patch);
}
