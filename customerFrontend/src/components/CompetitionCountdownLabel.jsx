export const COMPETITION_COUNTDOWN_LABEL = 'متبقي';

const pad2 = (value) => String(value).padStart(2, '0');

function formatDaysArabic(days) {
  if (days <= 0) return '';
  if (days === 1) return 'يوم';
  if (days === 2) return 'يومان';
  if (days >= 3 && days <= 10) return `${days} أيام`;
  return `${days} يوم`;
}

/** Presentation-only — days + hours:minutes (not total hours). */
export function formatCompetitionCountdown(endDate) {
  if (!endDate) return '—';
  const diff = new Date(endDate) - Date.now();
  if (diff <= 0) return 'انتهت';

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const clock = `${pad2(hours)}:${pad2(minutes)}`;

  if (days > 0) {
    return `${formatDaysArabic(days)} و ${clock}`;
  }

  return clock;
}

/** @deprecated Use formatCompetitionCountdown */
export function formatCompetitionCountdownClock(endDate) {
  return formatCompetitionCountdown(endDate);
}

const DEFAULT_LABEL_CLASS = 'text-[10px] font-bold text-amber-600/90 leading-tight';
const DEFAULT_TIME_CLASS = 'text-sm font-black text-amber-700 tabular-nums leading-none tracking-wide';
const DEFAULT_INLINE_LABEL_CLASS = 'text-[9px] font-bold text-amber-600/85';
const DEFAULT_INLINE_TIME_CLASS = 'text-[11px] font-black text-amber-800 tabular-nums';

export default function CompetitionCountdownLabel({
  time,
  className = '',
  labelClassName = '',
  timeClassName = '',
  inline = false,
  variant = 'light',
}) {
  const isDark = variant === 'dark';
  const resolvedLabelClass = labelClassName || (
    inline
      ? (isDark ? 'text-[9px] sm:text-[10px] font-bold text-amber-200/90 leading-tight' : DEFAULT_INLINE_LABEL_CLASS)
      : (isDark ? 'text-[9px] sm:text-[10px] font-bold text-amber-200/90 leading-tight mb-1' : `${DEFAULT_LABEL_CLASS} mb-0.5`)
  );
  const resolvedTimeClass = timeClassName || (
    inline
      ? (isDark ? 'text-[11px] sm:text-sm font-black text-amber-50 tabular-nums' : DEFAULT_INLINE_TIME_CLASS)
      : (isDark ? 'text-sm sm:text-base font-black text-amber-50 tabular-nums leading-none tracking-wide' : DEFAULT_TIME_CLASS)
  );

  if (inline) {
    return (
      <span className={`inline-flex flex-col items-start leading-tight ${className}`}>
        <span className={resolvedLabelClass}>{COMPETITION_COUNTDOWN_LABEL}</span>
        <span className={resolvedTimeClass}>{time}</span>
      </span>
    );
  }

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <span className={resolvedLabelClass}>{COMPETITION_COUNTDOWN_LABEL}</span>
      <span className={resolvedTimeClass}>{time}</span>
    </div>
  );
}
