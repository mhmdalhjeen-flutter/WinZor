import React, { useMemo } from 'react';

const SPARKLE_COUNT = 14;

export default function PointsCelebrationBackground() {
  const sparkles = useMemo(
    () => Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
      id: i,
      left: `${6 + ((i * 17) % 88)}%`,
      top: `${8 + ((i * 23) % 84)}%`,
      delay: `${(i * 0.35) % 4}s`,
      size: 3 + (i % 3),
    })),
    []
  );

  return (
    <div className="points-celebration-bg" aria-hidden>
      <div className="points-celebration-bg__gradient" />
      <div className="points-celebration-bg__waves" />
      <div className="points-celebration-bg__rays" />
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="points-celebration-bg__sparkle"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}
