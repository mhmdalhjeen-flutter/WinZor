import React from 'react';

const PERIOD_LABELS = {
  day: 'اليوم',
  week: 'آخر 7 أيام',
  month: 'آخر 30 يوماً',
  year: 'آخر 12 شهراً',
};

const DistributionBars = ({ regions, metric = 'combined', title }) => {
  const max = Math.max(...regions.map((r) => r.intensity?.[metric] ?? 0), 1);

  return (
    <div className="admin-card">
      <h3 className="mb-4 font-bold">{title}</h3>
      <div className="space-y-3">
        {regions.slice(0, 10).map((region) => {
          const val = region.intensity?.[metric] ?? 0;
          const width = Math.max(4, (val / max) * 100);
          return (
            <div key={region.key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-bold text-main">{region.name}</span>
                <span className="text-muted">{val}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-dark">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-primary to-secondary transition-all"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DistributionBars;
export { PERIOD_LABELS };
