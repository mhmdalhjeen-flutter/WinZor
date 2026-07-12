import React, { useEffect, useState } from 'react';
import { Search, Loader2, MapPin, ChevronRight } from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../api/axios';
import EmptyState from '../shared/EmptyState';
import ErrorState from '../shared/ErrorState';
import PointsStoreCard from '../components/stores/PointsStoreCard';
import HierarchySelect from '../components/HierarchySelect';
import { useRegionTree } from '../hooks/useRegionTree';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { getEffectiveRegionId, pathStillValid } from '../utils/regionTree';
import { queryKeys } from '../lib/queryClient';

const PointsProgramStores = () => {
  const [search, setSearch] = useState('');
  const [regionPath, setRegionPath] = useState([]);
  const debouncedQ = useDebouncedValue(search.trim(), 350);
  const regionId = getEffectiveRegionId(regionPath);

  const {
    data: regionTree = [],
    isLoading: regionsLoading,
    isError: regionsError,
    refetch: refetchRegions,
  } = useRegionTree();

  useEffect(() => {
    if (!regionPath.length || !regionTree.length) return;
    if (!pathStillValid(regionTree, regionPath)) setRegionPath([]);
  }, [regionTree, regionPath]);

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.pointsProgramStores({ debouncedQ, regionId }),
    queryFn: async () => {
      const params = {};
      if (debouncedQ) params.q = debouncedQ;
      if (regionId) params.regionId = regionId;
      const { data: response } = await api.get('/stores/points-program', { params });
      return {
        total: response?.total || 0,
        regions: response?.regions || [],
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const regions = data?.regions || [];
  const total = data?.total || 0;
  const error = queryError?.response?.data?.message || (queryError ? 'تعذّر تحميل المتاجر' : '');

  return (
    <div className="pb-24 space-y-5 text-right" dir="rtl">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-gray-900">
          المتاجر المشاركة في برنامج النقاط
        </h1>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          اعثر على جميع المتاجر التي تمنح نقاطاً عند الشراء.
        </p>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المتجر..."
            className="w-full bg-gray-50 rounded-2xl py-3 pr-11 pl-4 text-sm font-bold"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-black text-gray-500 flex items-center gap-1">
            <MapPin size={13} /> فلترة حسب المنطقة
          </p>
          <HierarchySelect
            tree={regionTree}
            pathIds={regionPath}
            onPathChange={setRegionPath}
            loading={regionsLoading}
            error={regionsError}
            onRetry={refetchRegions}
            variant="light"
            allowAllAtRoot
            firstPlaceholder="كل المناطق"
            optionalPlaceholder="منطقة أدق (اختياري)"
            showPath={false}
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      )}

      {error && !isLoading && (
        <ErrorState message={error} onRetry={refetch} />
      )}

      {!isLoading && !error && total === 0 && (
        <EmptyState
          title="لا متاجر مطابقة"
          description="جرّب تغيير البحث أو المنطقة"
        />
      )}

      {!isLoading && !error && regions.length > 0 && (
        <div className="space-y-8">
          {regions.map((regionBlock) => (
            <section key={regionBlock.regionId} className="space-y-4">
              <div className="flex items-center gap-2">
                <ChevronRight size={18} className="text-primary rotate-180" />
                <h2 className="text-lg font-black text-gray-900">{regionBlock.regionName}</h2>
              </div>

              {regionBlock.parentGroups?.map((group) => (
                <div key={group.parentCategoryId || group.parentCategory} className="space-y-4 pr-2">
                  <h3 className="text-base font-black text-gray-800 border-r-4 border-primary/30 pr-3">
                    {group.parentCategory}
                  </h3>

                  {group.sections?.map((section) => (
                    <div key={section.categoryId || section.categoryName} className="space-y-3 pr-2">
                      {!section.isParentFallback && section.categoryName !== group.parentCategory && (
                        <h4 className="text-sm font-black text-gray-600">{section.categoryName}</h4>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(section.stores || []).map((store) => (
                          <PointsStoreCard key={store._id} store={store} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default PointsProgramStores;
