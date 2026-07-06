import React from 'react';

const PERIODS = [
  { id: 'day', label: 'اليوم' },
  { id: 'week', label: 'الأسبوع' },
  { id: 'month', label: 'الشهر' },
  { id: 'year', label: 'السنة' },
];

const PeriodFilter = ({ value, onChange, disabled = false }) => (
  <div className="flex flex-wrap gap-2">
    {PERIODS.map((p) => (
      <button
        key={p.id}
        type="button"
        disabled={disabled}
        onClick={() => onChange(p.id)}
        className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
          value === p.id
            ? 'bg-primary text-white shadow-lg shadow-primary/25'
            : 'border border-border-color bg-dark/40 text-muted hover:text-white'
        }`}
      >
        {p.label}
      </button>
    ))}
  </div>
);

export default PeriodFilter;
