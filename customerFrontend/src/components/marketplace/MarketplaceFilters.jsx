import React from 'react';
import { MapPin, Sparkles, FolderOpen } from 'lucide-react';
import HierarchySelect from '../HierarchySelect';
import { BAZAAR_CATEGORIES } from '../../utils/bazaarCategories';
import { BAZAAR_CONDITIONS } from '../../utils/bazaarConditions';

const FILTER_MODES = [
  {
    id: 'region',
    label: 'المنطقة',
    icon: MapPin,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    activeRing: 'ring-emerald-400/50',
  },
  {
    id: 'condition',
    label: 'جديد / مستعمل',
    icon: Sparkles,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    activeRing: 'ring-amber-400/50',
  },
  {
    id: 'category',
    label: 'الفئة',
    icon: FolderOpen,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    activeRing: 'ring-violet-400/50',
  },
];

export default function MarketplaceFilters({
  regionTree,
  regionPath,
  onRegionPathChange,
  regionsLoading,
  regionsError,
  onRegionsRetry,
  filterCondition,
  onFilterConditionChange,
  filterCategory,
  onFilterCategoryChange,
}) {
  const [activeMode, setActiveMode] = React.useState(null);

  const toggleMode = (id) => {
    setActiveMode((prev) => (prev === id ? null : id));
  };

  const activeConditionLabel = BAZAAR_CONDITIONS.find((c) => c.value === filterCondition)?.label;
  const activeCategoryLabel = BAZAAR_CATEGORIES.find((c) => c.value === filterCategory)?.label;

  return (
    <section dir="rtl">
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {FILTER_MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          const hasValue = (
            (mode.id === 'region' && regionPath?.length > 0)
            || (mode.id === 'condition' && filterCondition)
            || (mode.id === 'category' && filterCategory)
          );
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => toggleMode(mode.id)}
              className={`home-search-card marketplace-filter-card flex flex-col items-center justify-center gap-1 px-1.5 py-2 min-h-[4rem] rounded-xl bg-white border shadow-sm active:scale-[0.99] transition-all text-center ${
                isActive || hasValue ? `ring-2 ${mode.activeRing} border-transparent` : 'border-gray-100'
              }`}
            >
              <span className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${mode.iconBg}`}>
                <mode.icon size={15} className={mode.iconColor} strokeWidth={2.2} />
              </span>
              <span className="text-[10px] font-black text-gray-800 leading-tight line-clamp-2">
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>

      {activeMode === 'region' && (
        <div className="mt-2 p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm space-y-2">
          <HierarchySelect
            tree={regionTree}
            pathIds={regionPath}
            onPathChange={onRegionPathChange}
            loading={regionsLoading}
            error={regionsError}
            onRetry={onRegionsRetry}
            variant="light"
            allowAllAtRoot
            firstPlaceholder="كل المناطق"
            optionalPlaceholder="اختياري — منطقة أدق"
            showPath={false}
          />
          {regionPath?.length > 0 && (
            <button
              type="button"
              onClick={() => onRegionPathChange([])}
              className="w-full py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-black"
            >
              مسح المنطقة
            </button>
          )}
        </div>
      )}

      {activeMode === 'condition' && (
        <div className="mt-2 p-2 rounded-xl bg-white border border-gray-100 shadow-sm">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => { onFilterConditionChange(''); setActiveMode(null); }}
              className={`py-2.5 px-2 rounded-xl text-xs font-black transition-colors ${
                !filterCondition ? 'bg-amber-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-amber-50'
              }`}
            >
              الكل
            </button>
            {BAZAAR_CONDITIONS.map((cond) => (
              <button
                key={cond.value}
                type="button"
                onClick={() => { onFilterConditionChange(cond.value); setActiveMode(null); }}
                className={`py-2.5 px-2 rounded-xl text-xs font-black transition-colors ${
                  filterCondition === cond.value ? 'bg-amber-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-amber-50'
                }`}
              >
                {cond.label}
              </button>
            ))}
          </div>
          {activeConditionLabel && (
            <p className="text-[10px] font-bold text-amber-600 text-center mt-2">
              مفعّل: {activeConditionLabel}
            </p>
          )}
        </div>
      )}

      {activeMode === 'category' && (
        <div className="mt-2 p-2 rounded-xl bg-white border border-gray-100 shadow-sm max-h-52 overflow-y-auto">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => { onFilterCategoryChange(''); setActiveMode(null); }}
              className={`py-2 px-2 rounded-xl text-[11px] font-black transition-colors ${
                !filterCategory ? 'bg-violet-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-violet-50'
              }`}
            >
              كل الفئات
            </button>
            {BAZAAR_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => { onFilterCategoryChange(cat.value); setActiveMode(null); }}
                className={`py-2 px-2 rounded-xl text-[11px] font-black transition-colors ${
                  filterCategory === cat.value ? 'bg-violet-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-violet-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {activeCategoryLabel && (
            <p className="text-[10px] font-bold text-violet-600 text-center mt-2 sticky bottom-0 bg-white py-1">
              مفعّل: {activeCategoryLabel}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
