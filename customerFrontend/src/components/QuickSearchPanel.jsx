import React from 'react';
import { MapPin, Package, Search, Layers } from 'lucide-react';
import HierarchySelect from './HierarchySelect';

const boxStyles = {
  dark: {
    box: 'bg-white/5 border-white/10',
    title: 'text-white/90',
    icon: 'text-primary-light',
    input: 'bg-white/10 border-white/10 text-white placeholder-white/40 focus:border-primary/50',
    btn: 'bg-primary text-white hover:bg-primary/90',
  },
  light: {
    box: 'bg-white border-gray-100 shadow-sm',
    title: 'text-gray-900',
    icon: 'text-primary',
    input: 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary/30',
    btn: 'bg-primary text-white',
  },
};

/**
 * البحث السريع: مناطق (هرمي) + أنواع المتاجر (هرمي) + بحث نصي اختياري.
 */
export default function QuickSearchPanel({
  variant = 'light',
  regionTree,
  regionPath,
  onRegionPathChange,
  regionsLoading,
  regionsError,
  onRegionsRetry,
  showCategories = false,
  categoryTree,
  categoryPath,
  onCategoryPathChange,
  categoriesLoading,
  categoriesError,
  onCategoriesRetry,
  productQuery,
  onProductQueryChange,
  productPlaceholder = 'ابحث بالكلمات المفتاحية...',
  productMode = 'search',
  onSearch,
  showSearchButton = false,
  showProducts = true,
  compact = false,
}) {
  const s = boxStyles[variant] || boxStyles.light;
  const boxPad = compact ? 'p-3' : 'p-4';

  const filterCols = showCategories ? 2 : 1;
  const totalCols = filterCols + (showProducts ? 1 : 0);
  const gridClass =
    totalCols >= 3
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      : totalCols === 2
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1';

  return (
    <div className={`grid gap-3 ${gridClass}`}>
      <div className={`rounded-2xl border ${boxPad} space-y-3 ${s.box}`}>
        <h3 className={`text-sm font-black flex items-center gap-2 ${s.title}`}>
          <MapPin size={16} className={s.icon} /> المناطق
        </h3>
        <HierarchySelect
          tree={regionTree}
          pathIds={regionPath}
          onPathChange={onRegionPathChange}
          loading={regionsLoading}
          error={regionsError}
          onRetry={onRegionsRetry}
          variant={variant}
          allowAllAtRoot
          firstPlaceholder="الكل — أي منطقة"
          optionalPlaceholder="اختياري — منطقة أدق"
        />
      </div>

      {showCategories && (
        <div className={`rounded-2xl border ${boxPad} space-y-3 ${s.box}`}>
          <h3 className={`text-sm font-black flex items-center gap-2 ${s.title}`}>
            <Layers size={16} className={s.icon} /> نوع المتجر
          </h3>
          <HierarchySelect
            tree={categoryTree}
            pathIds={categoryPath}
            onPathChange={onCategoryPathChange}
            loading={categoriesLoading}
            error={categoriesError}
            onRetry={onCategoriesRetry}
            variant={variant}
            allowAllAtRoot
            firstPlaceholder="الكل — أي نوع"
            optionalPlaceholder="اختياري — تصنيف أدق"
          />
        </div>
      )}

      {showProducts && (
        <div className={`rounded-2xl border ${boxPad} space-y-3 ${s.box}`}>
          <h3 className={`text-sm font-black flex items-center gap-2 ${s.title}`}>
            <Package size={16} className={s.icon} /> {showCategories ? 'اسم المتجر' : 'المنتجات'}
          </h3>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${variant === 'dark' ? 'text-white/40' : 'text-gray-400'}`}
              />
              <input
                type={productMode === 'search' ? 'search' : 'text'}
                value={productQuery}
                onChange={(e) => onProductQueryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onSearch) onSearch();
                }}
                placeholder={productPlaceholder}
                className={`w-full border rounded-xl py-2.5 pr-9 pl-3 text-sm font-bold outline-none ${s.input}`}
              />
            </div>
            {showSearchButton && onSearch && (
              <button
                type="button"
                onClick={onSearch}
                className={`shrink-0 px-4 rounded-xl text-sm font-black ${s.btn}`}
              >
                بحث
              </button>
            )}
          </div>
          {productMode === 'keywords' && (
            <p className={`text-[10px] font-bold ${variant === 'dark' ? 'text-white/50' : 'text-gray-400'}`}>
              2–5 كلمات مفتاحية مفصولة بفاصلة
            </p>
          )}
        </div>
      )}
    </div>
  );
}
