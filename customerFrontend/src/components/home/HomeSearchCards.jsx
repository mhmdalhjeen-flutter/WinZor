import React, { useState } from 'react';
import { MapPin, Tag } from 'lucide-react';
import HierarchySelect from '../HierarchySelect';
import { getEffectiveCategoryId } from '../../utils/categoryTree';

const SEARCH_MODES = [
  {
    id: 'region',
    label: 'فلترة العروض (حسب المنطقة)',
    labelMobile: 'فلترة العروض (حسب المنطقة)',
    icon: MapPin,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    activeRing: 'ring-emerald-400/50',
  },
  {
    id: 'offer',
    label: 'تصنيف العروض (حسب النوع)',
    labelMobile: 'تصنيف العروض (حسب النوع)',
    icon: Tag,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    activeRing: 'ring-violet-400/50',
  },
];

function scrollToOffers() {
  document.getElementById('home-offers')?.scrollIntoView({ behavior: 'smooth' });
}

export default function HomeSearchCards({
  regionTree,
  regionPath,
  onRegionPathChange,
  regionsLoading,
  regionsError,
  onRegionsRetry,
  categoryTree,
  categoryPath,
  onCategoryPathChange,
  categoriesLoading,
  categoriesError,
  onCategoriesRetry,
}) {
  const [activeMode, setActiveMode] = useState(null);

  const toggleMode = (id) => {
    setActiveMode((prev) => (prev === id ? null : id));
  };

  const handleRegionSearch = () => {
    setActiveMode(null);
    scrollToOffers();
  };

  const handleOfferSearch = () => {
    setActiveMode(null);
    scrollToOffers();
  };

  return (
    <section className="max-w-6xl mx-auto px-3 sm:px-4" dir="rtl">
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {SEARCH_MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => toggleMode(mode.id)}
              className={`home-search-card flex flex-col items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 min-h-[4.25rem] sm:min-h-0 rounded-xl sm:rounded-2xl bg-white border border-gray-100 shadow-sm active:scale-[0.99] transition-all text-center ${
                isActive ? `ring-2 ${mode.activeRing} border-transparent` : ''
              }`}
            >
              <span className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl shrink-0 ${mode.iconBg}`}>
                <mode.icon size={15} className={`${mode.iconColor} sm:hidden`} strokeWidth={2.2} />
                <mode.icon size={16} className={`${mode.iconColor} hidden sm:block`} strokeWidth={2.2} />
              </span>
              <span className="text-[10px] sm:text-xs font-black text-gray-800 leading-tight line-clamp-2">
                <span className="sm:hidden">{mode.labelMobile}</span>
                <span className="hidden sm:inline">{mode.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {activeMode === 'region' && (
        <div className="mt-2 sm:mt-2.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-gray-100 shadow-sm space-y-2">
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
          <button
            type="button"
            onClick={handleRegionSearch}
            className="w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-black active:scale-[0.99] transition-transform"
          >
            عرض العروض
          </button>
        </div>
      )}

      {activeMode === 'offer' && (
        <div className="mt-2 sm:mt-2.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-gray-100 shadow-sm space-y-2">
          <HierarchySelect
            tree={categoryTree}
            pathIds={categoryPath}
            onPathChange={onCategoryPathChange}
            loading={categoriesLoading}
            error={categoriesError}
            onRetry={onCategoriesRetry}
            variant="light"
            allowAllAtRoot
            firstPlaceholder="كل التصنيفات"
            optionalPlaceholder="اختياري — تصنيف فرعي"
            showPath={false}
          />
          {getEffectiveCategoryId(categoryPath) && (
            <button
              type="button"
              onClick={handleOfferSearch}
              className="w-full py-2 rounded-xl bg-violet-600 text-white text-xs font-black active:scale-[0.99] transition-transform"
            >
              عرض العروض
            </button>
          )}
        </div>
      )}
    </section>
  );
}
