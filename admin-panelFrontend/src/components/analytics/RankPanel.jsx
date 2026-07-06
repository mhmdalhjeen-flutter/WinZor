import React from 'react';

const RankPanel = ({ title, subtitle, rows, labelKey, valueKey, valueLabel, emptyText }) => (
  <div className="admin-card h-full">
    <div className="mb-4">
      <h3 className="text-base font-bold text-main">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
    </div>
    {!rows?.length ? (
      <p className="py-8 text-center text-sm text-muted">{emptyText || 'لا توجد بيانات'}</p>
    ) : (
      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li
            key={row._id || row.key || index}
            className="flex items-center gap-3 rounded-xl border border-border-color/50 bg-dark/30 px-3 py-2.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-black text-primary">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-main">{row[labelKey] || '—'}</p>
              {row.region && <p className="text-[10px] text-muted">{row.region}</p>}
            </div>
            <span className="shrink-0 text-sm font-black text-secondary">
              {(row[valueKey] ?? 0).toLocaleString('ar')} {valueLabel || ''}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default RankPanel;
