import React, { useId, useMemo } from 'react';

const CHART_H = 200;
const PAD = { top: 12, right: 8, bottom: 28, left: 40 };

const GrowthChart = ({ title, subtitle, data, color, gradientId: gradientIdProp }) => {
  const autoId = useId().replace(/:/g, '');
  const gradientId = gradientIdProp || `grad-${autoId}`;

  const { points, areaPath, linePath, labels, latest, delta, maxY } = useMemo(() => {
    const rows = data?.length ? data : [{ total: 0, label: '—' }];
    const latestVal = rows[rows.length - 1]?.total ?? 0;
    const firstVal = rows[0]?.total ?? 0;
    const max = Math.max(...rows.map((r) => r.total ?? 0), 1);

    const innerW = 100 - PAD.left - PAD.right;
    const innerH = CHART_H - PAD.top - PAD.bottom;

    const pts = rows.map((row, i) => {
      const x = PAD.left + (rows.length <= 1 ? innerW / 2 : (i / (rows.length - 1)) * innerW);
      const y = PAD.top + innerH - ((row.total ?? 0) / max) * innerH;
      return { x, y, ...row };
    });

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area =
      pts.length > 0
        ? `${line} L ${pts[pts.length - 1].x} ${PAD.top + innerH} L ${pts[0].x} ${PAD.top + innerH} Z`
        : '';

    const tickLabels = rows.filter((_, i) => i === 0 || i === rows.length - 1 || i % 7 === 0);

    return {
      points: pts,
      areaPath: area,
      linePath: line,
      labels: tickLabels,
      latest: latestVal,
      delta: latestVal - firstVal,
      maxY: max,
    };
  }, [data]);

  return (
    <div className="admin-card h-full">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-main">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
        </div>
        <div className="text-left">
          <p className="text-2xl font-extrabold" style={{ color }}>
            {latest.toLocaleString('ar')}
          </p>
          <p className={`text-xs font-bold ${delta >= 0 ? 'text-success' : 'text-danger'}`}>
            {delta >= 0 ? '+' : ''}
            {delta.toLocaleString('ar')} خلال الفترة
          </p>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 100 ${CHART_H}`} className="h-[220px] w-full sm:h-[260px]" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = PAD.top + (CHART_H - PAD.top - PAD.bottom) * (1 - t);
            return (
              <line
                key={t}
                x1={PAD.left}
                x2={100 - PAD.right}
                y1={y}
                y2={y}
                stroke="#334155"
                strokeWidth="0.15"
                strokeDasharray="1 1"
              />
            );
          })}

          <text x={PAD.left - 2} y={PAD.top + 4} fill="#94a3b8" fontSize="3" textAnchor="end">
            {maxY >= 1000 ? `${Math.round(maxY / 1000)}k` : maxY}
          </text>
          <text x={PAD.left - 2} y={CHART_H - PAD.bottom} fill="#94a3b8" fontSize="3" textAnchor="end">
            0
          </text>

          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
          {linePath && (
            <path d={linePath} fill="none" stroke={color} strokeWidth="0.6" strokeLinejoin="round" />
          )}

          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="1.2"
              fill={color}
              stroke="#fff"
              strokeWidth="0.3"
            />
          )}

          {labels.map((row) => {
            const idx = data.indexOf(row);
            const p = points[idx];
            if (!p) return null;
            return (
              <text key={row.date || idx} x={p.x} y={CHART_H - 6} fill="#94a3b8" fontSize="2.8" textAnchor="middle">
                {row.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default GrowthChart;
