import React, { useMemo, useRef, useEffect } from 'react';
import { buildSectorLayout } from '../utils/wheelRotation';

/**
 * SVG/conic wheel — sector sizes from displayWeight only.
 * segments: [{ color, displayWeight, locked?, _id }]
 */
const WheelVisual = ({
  segments = [],
  rotation = 0,
  size = 280,
  spinning = false,
  decelerating = false,
  spinIntensity = 0,
}) => {
  const discRef = useRef(null);

  const gradient = useMemo(() => {
    const total = segments.reduce((s, x) => s + (x.displayWeight || 1), 0) || 1;
    let acc = 0;
    const parts = segments.map((seg) => {
      const pct = ((seg.displayWeight || 1) / total) * 100;
      const start = acc;
      acc += pct;
      const color = seg.locked ? `${seg.color}88` : seg.color;
      return `${color} ${start}% ${acc}%`;
    });
    return `conic-gradient(from -90deg, ${parts.join(', ')})`;
  }, [segments]);

  const dividerGradient = useMemo(() => {
    const layout = buildSectorLayout(segments);
    if (layout.length <= 1) return null;
    const stops = [];
    layout.forEach((s, i) => {
      if (i === 0) return;
      const deg = s.start;
      stops.push(`transparent ${(deg - 0.4).toFixed(2)}deg`);
      stops.push(`rgba(0,0,0,0.18) ${deg.toFixed(2)}deg`);
      stops.push(`transparent ${(deg + 0.4).toFixed(2)}deg`);
    });
    return `conic-gradient(from -90deg, ${stops.join(', ')})`;
  }, [segments]);

  useEffect(() => {
    const el = discRef.current;
    if (!el) return;
    el.style.transform = `rotate3d(0, 0, 1, ${rotation}deg)`;
  }, [rotation]);

  useEffect(() => {
    const el = discRef.current;
    if (!el) return;
    if (decelerating) {
      el.style.transition = 'transform 5.5s cubic-bezier(0.12, 0.85, 0.22, 1)';
    } else if (spinning) {
      el.style.transition = 'none';
    } else {
      el.style.transition = 'transform 0.2s ease-out';
    }
  }, [spinning, decelerating]);

  const glow = spinIntensity;
  const borderColor = glow > 0.05
    ? `rgb(${Math.round(17 + (245 - 17) * glow)}, ${Math.round(24 + (158 - 24) * glow)}, ${Math.round(39 + (11 - 39) * glow)})`
    : '#111827';

  return (
    <div
      className="relative flex items-center justify-center wheel-visual-root"
      style={{ width: size, height: size }}
    >
      <div className="absolute -top-1 z-20 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-lg" />
      </div>

      <div
        ref={discRef}
        className="wheel-disc rounded-full relative overflow-hidden"
        style={{
          width: size,
          height: size,
          background: gradient,
          borderWidth: 6,
          borderStyle: 'solid',
          borderColor,
          boxShadow: glow > 0.05
            ? `0 0 ${12 + glow * 28}px rgba(251, 191, 36, ${0.25 + glow * 0.45}), 0 0 ${24 + glow * 40}px rgba(245, 158, 11, ${glow * 0.25}), 0 10px 30px rgba(0,0,0,0.2)`
            : '0 10px 30px rgba(0,0,0,0.2)',
          filter: glow > 0.35 ? `blur(${(glow - 0.35) * 0.8}px)` : 'none',
          willChange: spinning || decelerating ? 'transform' : 'auto',
          contain: 'layout style paint',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent pointer-events-none" />
        {dividerGradient && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: dividerGradient }}
          />
        )}
        {glow > 0.15 && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none wheel-disc-shine"
            style={{ opacity: Math.min(glow * 1.1, 1) }}
          />
        )}
      </div>

      <div
        className="absolute w-14 h-14 rounded-full bg-gray-900 border-4 border-white flex items-center justify-center shadow-lg z-10 text-xl pointer-events-none"
      >
        🎡
      </div>
    </div>
  );
};

export default WheelVisual;
