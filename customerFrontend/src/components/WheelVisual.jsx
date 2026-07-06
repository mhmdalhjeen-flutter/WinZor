import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * عجلة SVG/conic — الألوان فقط على القطاعات (بدون أسماء داخل العجلة).
 * segments: [{ color, displayWeight, locked? }]
 */
const WheelVisual = ({ segments = [], rotation = 0, size = 280, spinning = false }) => {
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

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* مؤشر */}
      <div className="absolute -top-1 z-20 left-1/2 -translate-x-1/2">
        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-lg" />
      </div>

      <motion.div
        animate={{ rotate: rotation }}
        transition={spinning ? { duration: 7, ease: [0.12, 0.85, 0.22, 1] } : { duration: 0 }}
        className="rounded-full border-[6px] border-gray-900 shadow-2xl relative overflow-hidden"
        style={{
          width: size,
          height: size,
          background: gradient,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent pointer-events-none" />
        {/* خطوط فاصلة خفيفة */}
        {segments.length > 1 && (
          <div className="absolute inset-0 rounded-full" style={{
            background: `repeating-conic-gradient(from -90deg, transparent 0deg ${360 / segments.length - 0.5}deg, rgba(0,0,0,0.15) ${360 / segments.length - 0.5}deg ${360 / segments.length}deg)`,
          }} />
        )}
      </motion.div>

      {/* المركز */}
      <div
        className="absolute w-14 h-14 rounded-full bg-gray-900 border-4 border-white flex items-center justify-center shadow-lg z-10 text-xl"
        style={{ pointerEvents: 'none' }}
      >
        🎡
      </div>
    </div>
  );
};

export default WheelVisual;
