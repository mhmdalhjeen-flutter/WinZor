import React, { useMemo } from 'react';

const BarChartPanel = ({ title, subtitle, data, valueKey = 'count', color = '#6366f1' }) => {
  const max = useMemo(
    () => Math.max(...(data || []).map((d) => d[valueKey] ?? 0), 1),
    [data, valueKey]
  );

  return (
    <div className="admin-card h-full">
      <div className="mb-4">
        <h3 className="text-base font-bold text-main">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
      </div>
      {!data?.length ? (
        <p className="py-10 text-center text-sm text-muted">لا توجد بيانات في هذه الفترة</p>
      ) : (
        <div className="flex h-[220px] items-end gap-1 overflow-x-auto pb-2 sm:h-[260px] sm:gap-1.5">
          {data.map((row) => {
            const val = row[valueKey] ?? 0;
            const h = Math.max(4, (val / max) * 100);
            return (
              <div
                key={row.date || row.month || row.label}
                className="flex min-w-[18px] flex-1 flex-col items-center justify-end gap-1"
                title={`${row.label}: ${val.toLocaleString('ar')}`}
              >
                <span className="text-[9px] font-bold text-muted">{val > 0 ? val : ''}</span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{ height: `${h}%`, backgroundColor: color, minHeight: val ? '4px' : '2px' }}
                />
                <span className="truncate text-[8px] text-muted sm:text-[9px]">{row.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BarChartPanel;
