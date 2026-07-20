/**
 * Wheel sector layout from appearance weights (displayWeight).
 * Independent from backend winWeight / winning probability.
 */

export function buildSectorLayout(segments = []) {
  const total = segments.reduce((s, x) => s + (x.displayWeight || 1), 0) || 1;
  let acc = 0;
  return segments.map((seg, index) => {
    const sweep = ((seg.displayWeight || 1) / total) * 360;
    const start = acc;
    const end = acc + sweep;
    acc = end;
    return {
      index,
      id: seg._id,
      start,
      end,
      sweep,
      center: start + sweep / 2,
    };
  });
}

/** All visual sectors that represent the winning prize (by id or index). */
export function findSectorsForPrize(segments, prizeId, segmentIndex) {
  const layout = buildSectorLayout(segments);
  if (prizeId != null) {
    const idStr = String(prizeId);
    const byId = layout.filter((s) => String(segments[s.index]?._id) === idStr);
    if (byId.length) return byId;
  }
  if (segmentIndex >= 0 && segmentIndex < layout.length) {
    return [layout[segmentIndex]];
  }
  return layout.length ? [layout[0]] : [];
}

/**
 * Pick a random landing point inside one of the prize sectors (avoid edges).
 * Returns rotation (deg) so the fixed top pointer lands on that point.
 */
export function calcStopRotation(segments, prizeId, segmentIndex, currentRotation) {
  const candidates = findSectorsForPrize(segments, prizeId, segmentIndex);
  if (!candidates.length) return currentRotation;

  const sector = candidates[Math.floor(Math.random() * candidates.length)];
  const margin = Math.min(sector.sweep * 0.12, 6);
  const usable = Math.max(sector.sweep - margin * 2, sector.sweep * 0.4);
  const landingAngle = sector.start + margin + Math.random() * usable;

  // Pointer at top (12 o'clock): rotate wheel so landingAngle aligns with top.
  const targetMod = (360 - landingAngle + 360) % 360;
  const fullSpins = 6 + Math.floor(Math.random() * 3);
  const base = ((currentRotation % 360) + 360) % 360;
  const delta = (targetMod - base + 360) % 360;
  return currentRotation + fullSpins * 360 + delta;
}
