import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { ArrowDown, Loader2, Store, Tag, Package } from 'lucide-react';
import PriorityDragList from '../components/PriorityDragList';
import LightLoadingHint from '../shared/LightLoadingHint';
import { queryKeys } from '../lib/queryClient';

const SectionCard = ({ step, title, hint, children, visible = true }) => {
  if (!visible) return null;
  return (
    <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="space-y-1">
        <p className="text-[11px] font-black text-primary">الخطوة {step}</p>
        <h2 className="text-lg font-black text-gray-900">{title}</h2>
        {hint && <p className="text-xs font-bold text-gray-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
};

const PriorityManagement = () => {
  const queryClient = useQueryClient();
  const [selectedMainId, setSelectedMainId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [savingSection, setSavingSection] = useState('');

  const { data: mainCategories = [], isLoading: mainLoading } = useQuery({
    queryKey: queryKeys.displayPriorityMain,
    queryFn: async () => {
      const { data } = await axios.get('/admin/display-priority/main-categories');
      return data.categories || [];
    },
  });

  const selectedMain = mainCategories.find((c) => String(c._id) === String(selectedMainId));

  const { data: secondLevels = [], isLoading: secondLoading } = useQuery({
    queryKey: queryKeys.displayPrioritySecond(selectedMainId),
    queryFn: async () => {
      const { data } = await axios.get('/admin/display-priority/second-levels', {
        params: { parentId: selectedMainId },
      });
      return data.categories || [];
    },
    enabled: Boolean(selectedMainId && selectedMain?.hasChildren),
  });

  const storeCategoryId = useMemo(() => {
    if (!selectedMainId) return null;
    if (selectedMain?.hasChildren) return selectedLevelId || null;
    return selectedMainId;
  }, [selectedMainId, selectedMain, selectedLevelId]);

  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: queryKeys.displayPriorityStores(storeCategoryId),
    queryFn: async () => {
      const { data } = await axios.get('/admin/display-priority/stores', {
        params: { categoryId: storeCategoryId },
      });
      return data.stores || [];
    },
    enabled: Boolean(storeCategoryId),
  });

  const { data: catalogData, isLoading: catalogLoading } = useQuery({
    queryKey: queryKeys.displayPriorityCatalog(selectedStoreId),
    queryFn: async () => {
      const { data } = await axios.get(`/admin/display-priority/stores/${selectedStoreId}/catalog`);
      return data;
    },
    enabled: Boolean(selectedStoreId),
  });

  useEffect(() => {
    setSelectedLevelId('');
    setSelectedStoreId('');
  }, [selectedMainId]);

  useEffect(() => {
    setSelectedStoreId('');
  }, [selectedLevelId, storeCategoryId]);

  const saveReorder = async (section, request) => {
    setSavingSection(section);
    try {
      await request();
      await queryClient.invalidateQueries({ queryKey: ['admin', 'display-priority'] });
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر حفظ الترتيب');
    } finally {
      setSavingSection('');
    }
  };

  if (mainLoading) return <LightLoadingHint />;

  return (
    <div className="space-y-6 pb-16 text-right" dir="rtl">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-gray-900">إدارة أولويات العرض</h1>
        <p className="text-sm font-bold text-gray-500 leading-relaxed max-w-3xl">
          اسحب العناصر لترتيبها. يتم حفظ الأولويات تلقائياً (1، 2، 3…).
          العناصر بدون أولوية تبقى على الترتيب التلقائي الحالي.
        </p>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5 space-y-2">
        <label className="text-xs font-black text-gray-500">سياق الترتيب — التصنيف الرئيسي</label>
        <select
          value={selectedMainId}
          onChange={(e) => setSelectedMainId(e.target.value)}
          className="w-full border border-gray-200 bg-gray-50 rounded-xl py-2.5 px-3 text-sm font-bold"
        >
          <option value="">اختر التصنيف الرئيسي…</option>
          {mainCategories.map((item) => (
            <option key={item._id} value={item._id}>
              {item.icon ? `${item.icon} ` : ''}{item.name}
            </option>
          ))}
        </select>
      </div>

      <SectionCard
        step={1}
        title="التصنيفات الرئيسية"
        hint="اسحب لإعادة ترتيب التصنيفات الرئيسية في الواجهة"
      >
        <PriorityDragList
          items={mainCategories}
          saving={savingSection === 'main'}
          onReorder={(orderedIds) => saveReorder('main', () =>
            axios.patch('/admin/display-priority/categories/reorder', {
              orderedIds,
              parentId: null,
            })
          )}
          renderItem={(item) => (
            <div className="flex items-center gap-2">
              <span className="text-lg">{item.icon || '🏷️'}</span>
              <div>
                <p className="font-black text-gray-900">{item.name}</p>
                {item.displayPriority != null && (
                  <p className="text-[10px] font-bold text-gray-400">أولوية: {item.displayPriority}</p>
                )}
              </div>
            </div>
          )}
        />
      </SectionCard>

      <div className="flex justify-center text-gray-300"><ArrowDown size={20} /></div>

      <SectionCard
        step={2}
        title="المستوى الثاني"
        hint={
          !selectedMainId
            ? 'اختر تصنيفاً رئيسياً أولاً'
            : selectedMain?.hasChildren
              ? `اسحب لإعادة ترتيب المستويات الفرعية ضمن «${selectedMain.name}»`
              : `«${selectedMain.name}» بدون مستويات فرعية — انتقل للمتاجر`
        }
        visible={Boolean(selectedMainId)}
      >
        {selectedMain?.hasChildren ? (
          secondLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-primary" size={22} />
            </div>
          ) : (
            <>
              <select
                value={selectedLevelId}
                onChange={(e) => setSelectedLevelId(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl py-2.5 px-3 text-sm font-bold"
              >
                <option value="">اختر المستوى الثاني لعرض المتاجر…</option>
                {secondLevels.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.icon ? `${item.icon} ` : ''}{item.name}
                  </option>
                ))}
              </select>

              <PriorityDragList
                items={secondLevels}
                saving={savingSection === 'second'}
                emptyMessage="لا مستويات فرعية في هذا التصنيف"
                onReorder={(orderedIds) => saveReorder('second', () =>
                  axios.patch('/admin/display-priority/categories/reorder', {
                    orderedIds,
                    parentId: selectedMainId,
                  })
                )}
                renderItem={(item) => (
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-primary shrink-0" />
                    <div>
                      <p className="font-black text-gray-900">{item.name}</p>
                      {item.displayPriority != null && (
                        <p className="text-[10px] font-bold text-gray-400">أولوية: {item.displayPriority}</p>
                      )}
                    </div>
                  </div>
                )}
              />
            </>
          )
        ) : (
          <p className="text-sm font-bold text-gray-500 bg-gray-50 rounded-2xl p-4 border border-gray-100">
            هذا التصنيف لا يحتوي مستويات فرعية — يمكنك ترتيب المتاجر مباشرة في الخطوة التالية.
          </p>
        )}
      </SectionCard>

      <div className="flex justify-center text-gray-300"><ArrowDown size={20} /></div>

      <SectionCard
        step={3}
        title="المتاجر"
        hint={storeCategoryId ? 'اسحب لإعادة ترتيب المتاجر ضمن التصنيف المحدد' : 'اختر المستوى المناسب أولاً'}
        visible={Boolean(storeCategoryId)}
      >
        {storesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={22} />
          </div>
        ) : (
          <>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 rounded-xl py-2.5 px-3 text-sm font-bold"
            >
              <option value="">اختر متجراً لترتيب عروضه ومنتجاته…</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>{store.name}</option>
              ))}
            </select>

            <PriorityDragList
              items={stores}
              saving={savingSection === 'stores'}
              emptyMessage="لا متاجر في هذا التصنيف"
              onReorder={(orderedIds) => saveReorder('stores', () =>
                axios.patch('/admin/display-priority/stores/reorder', { orderedIds })
              )}
              renderItem={(store) => (
                <div className="flex items-center gap-2">
                  <Store size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-black text-gray-900">{store.name}</p>
                    <p className="text-[10px] font-bold text-gray-400">{store.category}</p>
                  </div>
                </div>
              )}
            />
          </>
        )}
      </SectionCard>

      <div className="flex justify-center text-gray-300"><ArrowDown size={20} /></div>

      <SectionCard
        step={4}
        title="العروض والمنتجات"
        hint={selectedStoreId ? `ترتيب محتوى «${catalogData?.store?.name || ''}»` : 'اختر متجراً أولاً'}
        visible={Boolean(selectedStoreId)}
      >
        {catalogLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={22} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-1">
                <Tag size={15} /> العروض
              </h3>
              <PriorityDragList
                items={catalogData?.offers || []}
                saving={savingSection === 'offers'}
                emptyMessage="لا عروض نشطة في هذا المتجر"
                onReorder={(orderedIds) => saveReorder('offers', () =>
                  axios.patch('/admin/display-priority/offers/reorder', {
                    orderedIds,
                    storeId: selectedStoreId,
                  })
                )}
                renderItem={(offer) => (
                  <p className="font-black text-gray-900 truncate">{offer.title}</p>
                )}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-1">
                <Package size={15} /> المنتجات
              </h3>
              <PriorityDragList
                items={catalogData?.products || []}
                saving={savingSection === 'products'}
                emptyMessage="لا منتجات نشطة في هذا المتجر"
                onReorder={(orderedIds) => saveReorder('products', () =>
                  axios.patch('/admin/display-priority/products/reorder', {
                    orderedIds,
                    storeId: selectedStoreId,
                  })
                )}
                renderItem={(product) => (
                  <p className="font-black text-gray-900 truncate">{product.name}</p>
                )}
              />
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default PriorityManagement;
