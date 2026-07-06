import React, { useMemo } from 'react';

/** معاينة العجلة للوحة الإدارة — بدون حركة، ألوان فقط على القطاعات. */
const WheelPreview = ({ segments = [], size = 260 }) => {
  const gradient = useMemo(() => {
    const total = segments.reduce((s, x) => s + (Number(x.displayWeight) || 1), 0) || 1;
    let acc = 0;
    const parts = segments.map((seg) => {
      const pct = ((Number(seg.displayWeight) || 1) / total) * 100;
      const start = acc;
      acc += pct;
      return `${seg.color || '#6366f1'} ${start}% ${acc}%`;
    });
    return `conic-gradient(from -90deg, ${parts.join(', ')})`;
  }, [segments]);

  if (!segments.length) {
    return (
      <div
        className="rounded-full border-4 border-dashed border-border-color flex items-center justify-center text-muted text-sm font-bold"
        style={{ width: size, height: size }}
      >
        أضف جوائز
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute -top-1 z-20 left-1/2 -translate-x-1/2">
        <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-red-500" />
      </div>
      <div
        className="rounded-full border-[5px] border-gray-900 shadow-2xl relative overflow-hidden"
        style={{ width: size, height: size, background: gradient }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent pointer-events-none" />
      </div>
      <div className="absolute w-12 h-12 rounded-full bg-gray-900 border-4 border-white flex items-center justify-center shadow-lg z-10 text-lg">
        🎯
      </div>
    </div>
  );
};

export default WheelPreview;
