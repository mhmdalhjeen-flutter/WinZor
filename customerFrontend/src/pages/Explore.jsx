import React, { useState, useEffect, Suspense, lazy } from 'react';
import { MapPin, ChevronLeft, Store as StoreIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../api/axios';
import StoreCard from '../shared/StoreCard';
import EmptyState from '../shared/EmptyState';
import ErrorState from '../shared/ErrorState';
import QuickSearchPanel from '../components/QuickSearchPanel';
import StoreRegionSuggestion from '../components/StoreRegionSuggestion';
import { useRegionTree } from '../hooks/useRegionTree';
import { useCategoryTree } from '../hooks/useCategories';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getEffectiveRegionId, pathStillValid } from '../utils/regionTree';
import { getEffectiveCategoryId, pathStillValid as categoryPathStillValid } from '../utils/categoryTree';
import { queryKeys } from '../lib/queryClient';
import LightLoadingHint from '../shared/LightLoadingHint';

const HorizontalSwipe = lazy(() => import('../components/ui/HorizontalSwipe'));

const Explore = () => {
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
        total: response.total || 0,
        suggestion: response.suggestion || null,
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const groups = data?.groups || [];
  const total = data?.total || 0;
  const suggestion = data?.suggestion || null;
  const error = queryError?.response?.data?.message || (queryError ? 'تعذّر تحميل المتاجر' : '');

  return (
    <div className="space-y-6 pb-28 text-right" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">المتاجر</h1>
          <p className="text-xs text-gray-400 font-bold">{total} متجر نشط</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/stores/search')}
          className="text-xs font-black bg-primary/10 text-primary px-3 py-2 rounded-xl flex items-center gap-1"
        >
          <MapPin size={14} /> البحث السريع
        </button>
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
        productPlaceholder="ابحث عن متجر..."
      />

      {isLoading && groups.length === 0 && !error && (
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

      {!error && groups.length > 0 && (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.category} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-black text-gray-800 flex items-center gap-2">
                  <StoreIcon size={18} className="text-primary" />
                  {group.category}
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/stores/search')}
                  className="text-[10px] font-black text-primary flex items-center gap-1"
                >
                  المزيد <ChevronLeft size={14} />
                </button>
              </div>
              <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100 rounded-2xl" />}>
                <HorizontalSwipe spaceBetween={12} className="!px-1">
                  {group.stores.map((store) => (
                    <StoreCard key={store._id} store={store} membershipStatus={store.membershipStatus} />
                  ))}
                </HorizontalSwipe>
              </Suspense>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
