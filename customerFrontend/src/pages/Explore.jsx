import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { Search, SlidersHorizontal, ChevronLeft, Store as StoreIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../api/axios';
import StoreCard from '../shared/StoreCard';
import EmptyState from '../shared/EmptyState';
import ErrorState from '../shared/ErrorState';
import QuickSearchDrawer from '../components/QuickSearchDrawer';
import StoreRegionSuggestion from '../components/StoreRegionSuggestion';
import { useRegionTree } from '../hooks/useRegionTree';
import { useCategoryTree } from '../hooks/useCategories';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getEffectiveRegionId, pathStillValid } from '../utils/regionTree';
import { getEffectiveCategoryId, pathStillValid as categoryPathStillValid } from '../utils/categoryTree';
import { queryKeys } from '../lib/queryClient';
import { normalizeStoreParentGroups } from '../utils/categoryDisplay';
import LightLoadingHint from '../shared/LightLoadingHint';

const HorizontalSwipe = lazy(() => import('../components/ui/HorizontalSwipe'));

const Explore = () => {
  const navigate = useNavigate();
  const [regionPath, setRegionPath] = useState([]);
  const [categoryPath, setCategoryPath] = useState([]);
  const [productQuery, setProductQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedQ = useDebouncedValue(productQuery.trim(), 400);

  const {
    data: regionTree = [],
    isLoading: regionsLoading,
    isError: regionsError,
    refetch: refetchRegions,
  } = useRegionTree();

  const {
    data: categoryTree = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useCategoryTree('store');

  const regionId = getEffectiveRegionId(regionPath);
  const categoryId = getEffectiveCategoryId(categoryPath);
  const searchParams = { debouncedQ, regionId, categoryId };

  useEffect(() => {
    if (!regionPath.length || !regionTree.length) return;
    if (!pathStillValid(regionTree, regionPath)) setRegionPath([]);
  }, [regionTree, regionPath]);

  useEffect(() => {
    if (!categoryPath.length || !categoryTree.length) return;
    if (!categoryPathStillValid(categoryTree, categoryPath)) setCategoryPath([]);
  }, [categoryTree, categoryPath]);

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.storesBrowse(searchParams),
    queryFn: async () => {
      const params = {};
      if (debouncedQ) params.q = debouncedQ;
      if (regionId) params.regionId = regionId;
      if (categoryId) params.categoryId = categoryId;
      const { data: response } = await api.get('/stores/browse', { params });
      return {
        groups: response.groups || [],
        parentGroups: response.parentGroups || [],
        total: response.total || 0,
        suggestion: response.suggestion || null,
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const rawParentGroups = useMemo(() => (
    data?.parentGroups?.length
      ? data.parentGroups
      : (data?.groups || []).reduce((acc, group) => {
        const parentKey = group.parentCategoryId || group.parentCategory || group.category;
        let parentGroup = acc.find((item) => item.parentCategoryId === parentKey);
        if (!parentGroup) {
          parentGroup = {
            parentCategoryId: parentKey,
            parentCategory: group.parentCategory || group.category,
            sections: [],
          };
          acc.push(parentGroup);
        }
        parentGroup.sections.push({
          category: group.category,
          categoryId: group.categoryId,
          isParentFallback: group.isParentFallback,
          stores: group.stores || [],
        });
        return acc;
      }, [])
  ), [data?.parentGroups, data?.groups]);

  const parentGroups = useMemo(
    () => normalizeStoreParentGroups(rawParentGroups, categoryTree),
    [rawParentGroups, categoryTree]
  );
  const total = data?.total || 0;
  const suggestion = data?.suggestion || null;
  const error = queryError?.response?.data?.message || (queryError ? 'تعذّر تحميل المتاجر' : '');
  const hasActiveSearch = Boolean(debouncedQ || regionPath.length || categoryPath.length);

  const clearSearch = () => {
    setProductQuery('');
    setRegionPath([]);
    setCategoryPath([]);
  };

  return (
    <div className="space-y-5 pb-28 text-right" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">المتاجر</h1>
          <p className="text-xs text-gray-400 font-bold">{total} متجر نشط</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="search"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            placeholder="ابحث عن متجر..."
            className="w-full border border-gray-200 bg-white rounded-2xl py-3.5 pr-10 pl-4 text-sm font-bold text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 shadow-sm"
          />
        </div>
        {hasActiveSearch ? (
          <button
            type="button"
            onClick={clearSearch}
            className="shrink-0 inline-flex items-center gap-2 px-4 rounded-2xl border border-violet-100 bg-violet-50 text-sm font-black text-violet-700 shadow-sm hover:bg-violet-100 transition-colors"
          >
            إلغاء البحث
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="relative shrink-0 inline-flex items-center gap-2 px-4 rounded-2xl border border-gray-200 bg-white text-sm font-black text-gray-800 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal size={18} className="text-primary" />
            <span className="hidden sm:inline">بحث سريع</span>
          </button>
        )}
      </div>

      <QuickSearchDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        regionTree={regionTree}
        regionPath={regionPath}
        onRegionPathChange={setRegionPath}
        regionsLoading={regionsLoading}
        regionsError={regionsError}
        onRegionsRetry={refetchRegions}
        categoryTree={categoryTree}
        categoryPath={categoryPath}
        onCategoryPathChange={setCategoryPath}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        onCategoriesRetry={refetchCategories}
      />

      {isLoading && parentGroups.length === 0 && !error && (
        <LightLoadingHint label="جاري تحميل المتاجر..." />
      )}

      {!isLoading && suggestion && total === 0 && (
        <StoreRegionSuggestion
          suggestion={suggestion}
          onApply={(id) => setRegionPath([String(id)])}
        />
      )}

      {!isLoading && error && <ErrorState message={error} onRetry={refetch} />}
      {!isLoading && !error && total === 0 && !suggestion && (
        <EmptyState title="لا متاجر مطابقة" description="جرّب تغيير المنطقة أو نوع المتجر" />
      )}

      {!error && parentGroups.length > 0 && (
        <div className="space-y-8">
          {parentGroups.map((parentGroup) => (
            <div key={parentGroup.parentCategoryId || parentGroup.parentCategory} className="space-y-5">
              <h2 className="text-xl font-black text-gray-900 px-1 flex items-center gap-2">
                <StoreIcon size={20} className="text-primary" />
                {parentGroup.parentCategory}
              </h2>

              <div className="space-y-6">
                {parentGroup.sections.map((section) => {
                  const showChildTitle =
                    !section.isParentFallback
                    && section.category
                    && section.category !== parentGroup.parentCategory;

                  return (
                    <section
                      key={section.categoryId || section.category}
                      className="space-y-3"
                    >
                      {showChildTitle && (
                        <div className="flex items-center justify-between px-1">
                          <h3 className="font-black text-gray-800">{section.category}</h3>
                          <button
                            type="button"
                            onClick={() => navigate('/stores/search')}
                            className="text-[10px] font-black text-primary flex items-center gap-1"
                          >
                            المزيد <ChevronLeft size={14} />
                          </button>
                        </div>
                      )}

                      {!showChildTitle && (
                        <div className="flex items-center justify-end px-1">
                          <button
                            type="button"
                            onClick={() => navigate('/stores/search')}
                            className="text-[10px] font-black text-primary flex items-center gap-1"
                          >
                            المزيد <ChevronLeft size={14} />
                          </button>
                        </div>
                      )}

                      <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100 rounded-2xl" />}>
                        <HorizontalSwipe spaceBetween={14} className="!px-1">
                          {section.stores.map((store) => (
                            <StoreCard
                              key={store._id}
                              store={store}
                              membershipStatus={store.membershipStatus}
                            />
                          ))}
                        </HorizontalSwipe>
                      </Suspense>
                    </section>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
