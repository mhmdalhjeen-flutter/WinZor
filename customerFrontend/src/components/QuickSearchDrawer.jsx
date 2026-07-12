import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, SlidersHorizontal } from 'lucide-react';
import QuickSearchPanel from './QuickSearchPanel';

export default function QuickSearchDrawer({
  open,
  onClose,
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
  const activeFilterCount = (regionPath?.length ? 1 : 0) + (categoryPath?.length ? 1 : 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm"
            aria-label="إغلاق الفلاتر"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[71] bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 px-4 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] max-w-lg mx-auto max-h-[85vh] overflow-y-auto"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pt-1 pb-2 z-10">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <SlidersHorizontal size={18} />
                </span>
                <div>
                  <h2 className="text-base font-black text-gray-900">بحث سريع</h2>
                  <p className="text-[10px] font-bold text-gray-400">
                    {activeFilterCount ? `${activeFilterCount} فلتر نشط` : 'اختر المنطقة أو نوع المتجر'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            <QuickSearchPanel
              showCategories
              showProducts={false}
              regionTree={regionTree}
              regionPath={regionPath}
              onRegionPathChange={onRegionPathChange}
              regionsLoading={regionsLoading}
              regionsError={regionsError}
              onRegionsRetry={onRegionsRetry}
              categoryTree={categoryTree}
              categoryPath={categoryPath}
              onCategoryPathChange={onCategoryPathChange}
              categoriesLoading={categoriesLoading}
              categoriesError={categoriesError}
              onCategoriesRetry={onCategoriesRetry}
              compact
            />

            <button
              type="button"
              onClick={onClose}
              className="w-full mt-4 py-3 rounded-2xl bg-primary text-white text-sm font-black"
            >
              تطبيق الفلاتر
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
