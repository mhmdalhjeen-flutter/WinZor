import React from 'react';

const BADGE_TONES = {
  region: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  category: 'bg-violet-50 text-violet-800 border-violet-200/80',
  search: 'bg-sky-50 text-sky-800 border-sky-200/80',
};

export function buildPathFilterBadges(pathIds, tree, findNode, tone) {
  return pathIds
    .map((id) => {
      const node = findNode(tree, id);
      return node?.name ? { key: `${tone}-${id}`, label: node.name, tone } : null;
    })
    .filter(Boolean);
}

export default function FilterSectionHeader({
  title,
  icon: Icon,
  badges = [],
  onClear,
  clearLabel = 'إلغاء الفلترة',
}) {
  const hasFilters = badges.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {hasFilters ? (
            <div className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-black text-gray-600 flex items-center gap-1.5">
                {Icon && <Icon className="text-primary w-4 h-4 shrink-0" strokeWidth={2.5} />}
                <span>{title} في:</span>
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {badges.map((badge, idx) => (
                  <React.Fragment key={badge.key}>
                    {idx > 0 && (
                      <span className="text-gray-300 font-black text-xs select-none" aria-hidden>—</span>
                    )}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black border ${BADGE_TONES[badge.tone] || BADGE_TONES.category}`}
                    >
                      {badge.label}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : (
            <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
              {Icon && <Icon className="text-primary w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />}
              {title}
            </h3>
          )}
        </div>
        {hasFilters && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black text-violet-700 bg-violet-50 border border-violet-200/80 active:scale-[0.98] transition-transform hover:bg-violet-100/80"
          >
            {clearLabel}
          </button>
        )}
      </div>
    </div>
  );
}
