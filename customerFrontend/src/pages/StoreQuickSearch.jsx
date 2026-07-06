import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../api/axios';
import StoreCard from '../shared/StoreCard';
import QuickSearchPanel from '../components/QuickSearchPanel';
import StoreRegionSuggestion from '../components/StoreRegionSuggestion';
import { useRegionTree } from '../hooks/useRegionTree';
import { useCategoryTree } from '../hooks/useCategories';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getEffectiveRegionId, pathStillValid } from '../utils/regionTree';
import { getEffectiveCategoryId, pathStillValid as categoryPathStillValid } from '../utils/categoryTree';
import { queryKeys } from '../lib/queryClient';
import ErrorState from '../shared/ErrorState';

const HorizontalSwipe = lazy(() => import('../components/ui/HorizontalSwipe'));

const StoreQuickSearch = () => {
  const navigate = useNavigate();
  const [regionPath, setRegionPath] = useState([]);
  const [categoryPath, setCategoryPath] = useState([]);
  const [productQuery, setProductQuery] = useState('');
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

  const { data, isLoading, isError, error: queryError, refetch } = useQuery({
    queryKey: queryKeys.storesByRegions(searchParams),
    queryFn: async () => {
      const params = {};
      if (debouncedQ) params.q = debouncedQ;
      if (regionId) params.regionId = regionId;
      if (categoryId) params.categoryId = categoryId;
      const { data: response } = await api.get('/stores/by-regions', { params });
      return response;
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const error = queryError?.response?.data?.message || (queryError ? 'تعذّر تحميل المتاجر' : '');

  const hasVisibleStores = data?.regions?.some(
    (block) =>
      block.stores?.length > 0 ||
      block.subRegions?.some((sub) => sub.stores?.length > 0)
  );

  return (
    <div className="space-y-4 pb-24 text-right" dir="rtl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white border border-gray-100">
          <ChevronRight size={20} />
        </button>
        <h1 className="text-lg font-black text-gray-900">البحث السريع عن متجر</h1>
      </div>

      <QuickSearchPanel
        showCategories
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
        productQuery={productQuery}
        onProductQueryChange={setProductQuery}
        productPlaceholder="اسم المتجر..."
      />

      {!isLoading && isError && (
        <ErrorState message={error} onRetry={refetch} />
      )}

      {!isLoading && !isError && data?.suggestion && !hasVisibleStores && (
        <StoreRegionSuggestion
          suggestion={data.suggestion}
          onApply={(id) => setRegionPath([String(id)])}
        />
      )}

      {!isLoading && !isError && !hasVisibleStores && !data?.suggestion && (
        <p className="text-center text-gray-400 font-bold py-8">لا متاجر مطابقة — جرّب تغيير المنطقة أو نوع المتجر</p>
      )}

      {data?.regions?.length > 0 && (
        <div className="space-y-4">
          {data.regions.map((block) => (
            <section key={block.region._id} className="space-y-3">
              <h2 className="font-black text-gray-800 flex items-center gap-2 px-1">
                {block.region.name}
              </h2>
              {block.stores?.length > 0 && (
                <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100 rounded-2xl" />}>
                  <HorizontalSwipe spaceBetween={12} className="pb-1">
                    {block.stores.map((s) => <StoreCard key={s._id} store={s} />)}
                  </HorizontalSwipe>
                </Suspense>
              )}
              {block.subRegions?.map((sub) => sub.stores?.length > 0 && (
                <div key={sub.region._id} className="mr-4 space-y-2">
                  <h3 className="text-sm font-black text-gray-500">{sub.region.name}</h3>
                  <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100 rounded-2xl" />}>
                    <HorizontalSwipe spaceBetween={12} className="pb-1">
                      {sub.stores.map((s) => <StoreCard key={s._id} store={s} />)}
                    </HorizontalSwipe>
                  </Suspense>
                </div>
              ))}
              {!block.stores?.length && !block.subRegions?.some((s) => s.stores?.length) && (
                <p className="text-xs text-gray-400 px-2">لا متاجر في هذه المنطقة</p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreQuickSearch;
