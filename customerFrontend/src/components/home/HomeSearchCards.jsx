import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Tag, Search, X, Loader2, Store, Package, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import HierarchySelect from '../HierarchySelect';
import { getEffectiveCategoryId } from '../../utils/categoryTree';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import api from '../../api/axios';

const SEARCH_MODES = [
  {
    id: 'region',
    label: 'فلترة حسب المنطقة',
    icon: MapPin,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    activeRing: 'ring-emerald-400/50',
  },
  {
    id: 'offer',
    label: 'فلترة حسب الموقع',
    icon: Tag,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    activeRing: 'ring-violet-400/50',
  },
];

const SEARCH_PLACEHOLDER =
  'ابحث عن عروض، منتجات، متاجر، مناطق، أو تصنيفات...';

function flattenBrowseStores(data, limit = 5) {
  const stores = [];
  const seen = new Set();

  const add = (store) => {
    if (!store?._id || seen.has(String(store._id)) || stores.length >= limit) return;
    seen.add(String(store._id));
    stores.push(store);
  };

  for (const group of data?.parentGroups || []) {
    for (const section of group.sections || []) {
      for (const store of section.stores || []) add(store);
    }
  }

  for (const group of data?.groups || []) {
    for (const store of group.stores || []) add(store);
  }

  return stores;
}

function SearchResultGroup({ title, icon: Icon, items, renderItem }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 px-1 text-[10px] font-black text-gray-400">
        <Icon size={12} />
        {title}
      </p>
      <div className="space-y-1">{items.map(renderItem)}</div>
    </div>
  );
}

function SearchResultItem({ label, meta, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-right px-3 py-2 rounded-xl bg-gray-50/90 hover:bg-violet-50 border border-transparent hover:border-violet-100 transition-colors"
    >
      <p className="text-xs font-black text-gray-900 line-clamp-1">{label}</p>
      {meta ? <p className="text-[10px] font-bold text-gray-400 mt-0.5 line-clamp-1">{meta}</p> : null}
    </button>
  );
}

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
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [activeMode, setActiveMode] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQ = useDebouncedValue(searchQuery.trim(), 350);

  useEffect(() => {
    if (!searchOpen) return undefined;
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [searchOpen]);

  const toggleMode = (id) => {
    setActiveMode((prev) => (prev === id ? null : id));
    setSearchOpen(false);
  };

  const openSearch = () => {
    setActiveMode(null);
    setSearchOpen(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleRegionSearch = () => {
    setActiveMode(null);
    scrollToOffers();
  };

  const handleOfferSearch = () => {
    setActiveMode(null);
    scrollToOffers();
  };

  const { data: searchResults, isFetching: searchLoading } = useQuery({
    queryKey: ['homeUniversalSearch', debouncedQ],
    queryFn: async () => {
      const [offersRes, productsRes, storesRes] = await Promise.all([
        api.get('/offers/feed', { params: { q: debouncedQ, limit: 5 } }),
        api.get('/products/search', { params: { q: debouncedQ } }),
        api.get('/stores/browse', { params: { q: debouncedQ } }),
      ]);

      return {
        offers: offersRes.data?.items || [],
        products: (productsRes.data?.products || []).slice(0, 5),
        stores: flattenBrowseStores(storesRes.data, 5),
      };
    },
    enabled: searchOpen && debouncedQ.length >= 2,
    staleTime: 30 * 1000,
  });

  const hasResults = Boolean(
    searchResults?.offers?.length
    || searchResults?.products?.length
    || searchResults?.stores?.length
  );

  return (
    <section className="max-w-6xl mx-auto px-1.5 sm:px-2" dir="rtl">
      <div className="flex items-stretch gap-2">
        <div className="flex items-stretch gap-2 flex-1 min-w-0" data-onboarding="filters">
          {SEARCH_MODES.map((mode) => {
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => toggleMode(mode.id)}
                className={`home-search-card flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[2.75rem] rounded-lg sm:rounded-xl bg-white border border-gray-100 shadow-sm active:scale-[0.99] transition-all whitespace-nowrap ${
                  isActive ? `ring-2 ${mode.activeRing} border-transparent` : ''
                }`}
              >
                <span className={`flex items-center justify-center w-5 h-5 rounded-md shrink-0 ${mode.iconBg}`}>
                  <mode.icon size={12} className={mode.iconColor} strokeWidth={2.2} />
                </span>
                <span className="text-[11px] sm:text-xs font-black text-gray-800 leading-none">
                  {mode.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={searchOpen ? closeSearch : openSearch}
          className={`home-search-card flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-h-[3.5rem] sm:min-h-[3.75rem] w-[3.25rem] sm:w-[3.75rem] shrink-0 rounded-lg sm:rounded-xl border shadow-sm active:scale-[0.99] transition-all ${
            searchOpen
              ? 'bg-violet-600 border-violet-600 text-white ring-2 ring-violet-400/40'
              : 'bg-white border-gray-100 text-gray-800'
          }`}
          aria-label={searchOpen ? 'إغلاق البحث' : 'بحث'}
          aria-expanded={searchOpen}
        >
          {searchOpen ? (
            <X size={18} strokeWidth={2.4} />
          ) : (
            <Search size={18} strokeWidth={2.4} className="text-violet-600" />
          )}
          <span className="text-[9px] sm:text-[10px] font-black leading-none">بحث</span>
        </button>
      </div>

      {searchOpen && (
          <div
            key="home-search-panel"
            className="home-search-expand mt-2.5 overflow-hidden"
          >
            <div className="rounded-2xl border border-violet-100/80 bg-white shadow-md shadow-violet-100/30 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100/80 bg-gradient-to-l from-violet-50/80 to-white">
                <Search size={16} className="text-violet-500 shrink-0" />
                <input
                  ref={inputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={SEARCH_PLACEHOLDER}
                  className="flex-1 min-w-0 bg-transparent text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  enterKeyHint="search"
                />
                {searchLoading && <Loader2 size={16} className="animate-spin text-violet-400 shrink-0" />}
              </div>

              {debouncedQ.length >= 2 && (
                <div className="home-search-results p-2.5 space-y-3">
                  {!searchLoading && !hasResults && (
                    <p className="text-center text-xs font-bold text-gray-400 py-4">
                      لا توجد نتائج مطابقة
                    </p>
                  )}

                  <SearchResultGroup
                    title="عروض"
                    icon={Sparkles}
                    items={searchResults?.offers}
                    renderItem={(offer) => (
                      <SearchResultItem
                        key={offer._id}
                        label={offer.title}
                        meta={offer.store?.name}
                        onClick={() => {
                          closeSearch();
                          navigate(`/offer/${offer._id}`);
                        }}
                      />
                    )}
                  />

                  <SearchResultGroup
                    title="منتجات"
                    icon={Package}
                    items={searchResults?.products}
                    renderItem={(product) => (
                      <SearchResultItem
                        key={product._id}
                        label={product.name}
                        meta="منتج"
                        onClick={() => {
                          closeSearch();
                          navigate(`/product/${product._id}`);
                        }}
                      />
                    )}
                  />

                  <SearchResultGroup
                    title="متاجر"
                    icon={Store}
                    items={searchResults?.stores}
                    renderItem={(store) => (
                      <SearchResultItem
                        key={store._id}
                        label={store.name}
                        meta={[store.region, store.category].filter(Boolean).join(' · ')}
                        onClick={() => {
                          closeSearch();
                          navigate(`/store/${store._id}`);
                        }}
                      />
                    )}
                  />
                </div>
              )}

              {debouncedQ.length < 2 && searchQuery.trim().length > 0 && (
                <p className="px-3 py-3 text-[11px] font-bold text-gray-400 text-center">
                  اكتب حرفين على الأقل للبحث
                </p>
              )}
            </div>
          </div>
      )}

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
