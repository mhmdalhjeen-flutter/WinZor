import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import {
  Search, CheckCircle, XCircle, MapPin, Tag, Eye, EyeOff,
  Package, Gift, Trash2, Loader2, Store, MessageCircle, BadgeCheck,
} from 'lucide-react';
import '../style/stores.css';
import { queryKeys } from '../lib/queryClient';
import { unwrapList } from '../utils/unwrapList';
import LightLoadingHint from '../shared/LightLoadingHint';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

export default function AdminStores() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch]       = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [category, setCategory]   = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [toast, setToast]         = useState('');

  const [expandedStore, setExpandedStore] = useState(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const [storeOffers, setStoreOffers]     = useState([]);
  const [detailTab, setDetailTab]         = useState('products');
  const [detailLoading, setDetailLoading] = useState(false);
  const [priorityDrafts, setPriorityDrafts] = useState({});
  const [storePriorityDrafts, setStorePriorityDrafts] = useState({});

  const { data: stores = [], isLoading } = useQuery({
    queryKey: queryKeys.adminStores,
    queryFn: async () => {
      const res = await axios.get('/admin/stores');
      return unwrapList(res.data, ['stores']);
    },
    staleTime: 60 * 1000,
  });

  const refreshStores = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminStores });
  };

  const toggleStatus = async (storeId) => {
    try {
      const res = await axios.patch(`/admin/stores/${storeId}/toggle`);
      queryClient.setQueryData(queryKeys.adminStores, (prev = []) =>
        prev.map((s) =>
          s._id === storeId ? { ...s, isActive: res.data.isActive } : s
        )
      );
      showToast(res.data.message || 'تم تغيير الحالة');
    } catch (err) {
      showToast(err.response?.data?.message || 'حدث خطأ');
    }
  };

  const toggleVerify = async (storeId, current) => {
    try {
      const res = await axios.patch(`/admin/stores/${storeId}/verify`, {
        isVerifiedStore: !current,
      });
      queryClient.setQueryData(queryKeys.adminStores, (prev = []) =>
        prev.map((s) =>
          s._id === storeId ? { ...s, isVerifiedStore: res.data.isVerifiedStore } : s
        )
      );
      showToast(res.data.message || 'تم تحديث التوثيق');
    } catch (err) {
      showToast(err.response?.data?.message || 'حدث خطأ');
    }
  };

  const saveFeaturedPriority = async (offerId) => {
    const raw = priorityDrafts[offerId];
    try {
      const res = await axios.patch(`/admin/offers/${offerId}/display-priority`, {
        displayPriority: raw === '' || raw === undefined ? null : Number(raw),
      });
      setStoreOffers((prev) =>
        prev.map((o) =>
          o._id === offerId
            ? { ...o, displayPriority: res.data.displayPriority, featuredPriority: res.data.featuredPriority }
            : o
        )
      );
      showToast('تم تحديث أولوية عرض العرض');
    } catch (err) {
      showToast(err.response?.data?.message || 'حدث خطأ');
    }
  };

  const saveStoreDisplayPriority = async (storeId) => {
    const raw = storePriorityDrafts[storeId];
    try {
      const res = await axios.patch(`/admin/stores/${storeId}/display-priority`, {
        displayPriority: raw === '' || raw === undefined ? null : Number(raw),
      });
      queryClient.setQueryData(queryKeys.adminStores, (prev = []) =>
        prev.map((s) =>
          s._id === storeId ? { ...s, displayPriority: res.data.displayPriority } : s
        )
      );
      showToast('تم تحديث أولوية عرض المتجر');
    } catch (err) {
      showToast(err.response?.data?.message || 'حدث خطأ');
    }
  };

  const deleteStore = async (storeId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المتجر؟')) return;
    try {
      await axios.delete(`/admin/stores/${storeId}`);
      queryClient.setQueryData(queryKeys.adminStores, (prev = []) =>
        prev.filter((s) => s._id !== storeId)
      );
      showToast('تم حذف المتجر بنجاح');
    } catch (err) {
      showToast(err.response?.data?.message || 'تعذّر الحذف');
    }
  };

  const openStoreDetails = async (storeId) => {
    if (expandedStore === storeId) {
      setExpandedStore(null);
      return;
    }
    setExpandedStore(storeId);
    setDetailLoading(true);
    try {
      const [prodRes, offerRes] = await Promise.all([
        axios.get(`/admin/stores/${storeId}/products`),
        axios.get(`/admin/stores/${storeId}/offers`)
      ]);
      setStoreProducts(
        Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.products || []
      );
      setStoreOffers(
        Array.isArray(offerRes.data) ? offerRes.data : offerRes.data.offers || []
      );
    } catch (err) {
      showToast('تعذّر تحميل تفاصيل المتجر');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleProduct = async (productId) => {
    try {
      const res = await axios.patch(`/admin/products/${productId}/toggle`);
      setStoreProducts((prev) =>
        prev.map((p) =>
          p._id === productId ? { ...p, isActive: res.data.isActive } : p
        )
      );
      showToast(res.data.isActive ? 'تم إظهار المنتج' : 'تم إخفاء المنتج');
    } catch (err) {
      showToast('حدث خطأ');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('هل تريد حذف هذا المنتج؟')) return;
    try {
      await axios.delete(`/admin/products/${productId}`);
      setStoreProducts((prev) => prev.filter((p) => p._id !== productId));
      showToast('تم حذف المنتج');
    } catch (err) {
      showToast('تعذّر الحذف');
    }
  };

  const toggleOffer = async (offerId) => {
    try {
      const res = await axios.patch(`/admin/offers/${offerId}/toggle`);
      setStoreOffers((prev) =>
        prev.map((o) =>
          o._id === offerId ? { ...o, isActive: res.data.isActive } : o
        )
      );
      showToast(res.data.isActive ? 'تم إظهار العرض' : 'تم إخفاء العرض');
    } catch (err) {
      showToast('حدث خطأ');
    }
  };

  const deleteOffer = async (offerId) => {
    if (!window.confirm('هل تريد حذف هذا العرض؟')) return;
    try {
      await axios.delete(`/admin/offers/${offerId}`);
      setStoreOffers((prev) => prev.filter((o) => o._id !== offerId));
      showToast('تم حذف العرض');
    } catch (err) {
      showToast('تعذّر الحذف');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const openStoreOwnerChat = (store) => {
    const ownerId = store.owner?._id || store.owner;
    if (!ownerId) {
      showToast('لا يوجد مالك مرتبط بهذا المتجر');
      return;
    }
    const isSupplier = store.owner?.role === 'supplier';
    navigate(`/chats/user/${ownerId}`, {
      state: {
        userName: store.owner?.name,
        context: {
          itemType: 'Support',
          itemName: `${isSupplier ? 'مستودع' : 'متجر'}: ${store.name}`,
          itemId: store._id,
        },
      },
    });
  };

  const filtered = stores.filter((s) => {
    const ownerRole = s.owner?.role || s.ownerRole || '';
    const matchRole =
      roleFilter === 'all' ||
      (roleFilter === 'supplier' && ownerRole === 'supplier') ||
      (roleFilter === 'store'    && ownerRole === 'store');

    const matchSearch =
      !debouncedSearch ||
      s.name?.includes(debouncedSearch) ||
      s.region?.includes(debouncedSearch) ||
      s.category?.includes(debouncedSearch);

    const matchCat = !category || s.category === category;

    return matchRole && matchSearch && matchCat;
  });

  const uniqueCategories = [...new Set(stores.map((s) => s.category).filter(Boolean))];

  const stats = [
    { label: 'إجمالي السجلات', value: stores.length, accent: '#6366f1' },
    { label: 'نشط', value: stores.filter((s) => s.isActive).length, accent: '#22c55e' },
    { label: 'متوقف', value: stores.filter((s) => !s.isActive).length, accent: '#ef4444' },
    { label: 'مستودعات', value: stores.filter((s) => s.owner?.role === 'supplier').length, accent: '#f59e0b' },
  ];

  return (
    <div className="admin-page-container" dir="rtl">
      {toast && <div className="catalog-toast">{toast}</div>}

      <div className="admin-header">
        <div className="admin-title">
          <h1>إدارة المتاجر والمستودعات</h1>
          <p>تحكم في المتاجر المسجلة، حالتها، منتجاتها وعروضها</p>
        </div>
      </div>

      <div className="catalog-toolbar">
        <div className="search-wrap">
          <Search size={18} />
          <input
            type="text"
            placeholder="ابحث بالاسم أو المنطقة أو التصنيف..."
            className="admin-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="admin-input"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">الكل (متاجر + مستودعات)</option>
          <option value="store">متاجر فقط</option>
          <option value="supplier">مستودعات فقط</option>
        </select>
        <select
          className="admin-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">كل التصنيفات</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {isLoading && stores.length === 0 && (
        <LightLoadingHint label="جاري تحميل المتاجر..." />
      )}

      {!isLoading && stores.length > 0 && (
        <div className="catalog-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="catalog-stat" style={{ '--accent': stat.accent }}>
              <div className="catalog-stat-value">{stat.value}</div>
              <div className="catalog-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 ? (
        <div className="admin-card catalog-empty">
          <div className="catalog-empty-icon">🏪</div>
          <p className="font-bold text-main mb-2">
            {stores.length === 0 ? 'لا توجد متاجر مسجلة' : 'لا توجد نتائج للبحث'}
          </p>
          <p className="text-sm">
            {stores.length === 0
              ? 'ستظهر المتاجر هنا عند تسجيلها من التطبيق'
              : 'جرّب تغيير الفلاتر أو كلمة البحث'}
          </p>
        </div>
      ) : (
        <div className="stores-grid">
          {filtered.map((store) => {
            const isSupplier = store.owner?.role === 'supplier';
            const isExpanded = expandedStore === store._id;
            const detailItems = detailTab === 'products' ? storeProducts : storeOffers;

            return (
              <div key={store._id} className="store-card">
                <div className="store-card-badges">
                  <span className={`badge ${isSupplier ? 'badge-type-supplier' : 'badge-type-store'}`}>
                    {isSupplier ? '🏢 مستودع' : '🏪 متجر'}
                  </span>
                  <span className={`badge ${store.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {store.isActive ? 'نشط' : 'متوقف'}
                  </span>
                  {store.isVerifiedStore && (
                    <span className="badge badge-success">✔ موثق</span>
                  )}
                </div>

                <div className="store-card-header">
                  <div className="store-logo-wrapper">
                    {store.logo
                      ? <img src={store.logo} alt={store.name} />
                      : (store.name?.[0] || <Store size={22} />)
                    }
                  </div>
                  <div className="store-info">
                    <h3>{store.name}</h3>
                    <p className="flex items-center gap-1">
                      <MapPin size={12} />
                      {store.region}
                      {store.subRegion ? ` — ${store.subRegion}` : ''}
                    </p>
                  </div>
                </div>

                <div className="store-card-body">
                  <div className="store-stats">
                    <div className="stat-item">
                      <span className="label">التصنيف</span>
                      <span className="value flex items-center justify-center gap-1">
                        <Tag size={12} /> {store.category || '—'}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="label">المالك</span>
                      <span className="value">{store.owner?.name || '—'}</span>
                    </div>
                  </div>
                  <div className="store-status-line">
                    {store.isActive
                      ? <CheckCircle size={14} className="text-success" />
                      : <XCircle size={14} className="text-danger" />
                    }
                    <span>{store.isActive ? 'مفعّل ويظهر للعامة' : 'موقوف ومخفي'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <label className="text-xs font-bold text-muted">أولوية العرض:</label>
                    <input
                      type="number"
                      min="1"
                      className="admin-input"
                      style={{ width: '4.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      placeholder="فارغ"
                      value={
                        storePriorityDrafts[store._id] !== undefined
                          ? storePriorityDrafts[store._id]
                          : (store.displayPriority ?? '')
                      }
                      onChange={(e) =>
                        setStorePriorityDrafts((prev) => ({
                          ...prev,
                          [store._id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="btn-primary py-1 px-2 text-xs"
                      onClick={() => saveStoreDisplayPriority(store._id)}
                    >
                      حفظ
                    </button>
                  </div>
                </div>

                <div className="store-actions">
                  <button
                    type="button"
                    className={`btn-toggle ${store.isVerifiedStore ? 'active' : 'inactive'}`}
                    onClick={() => toggleVerify(store._id, store.isVerifiedStore)}
                    title={store.isVerifiedStore ? 'إلغاء التوثيق' : 'توثيق المتجر'}
                  >
                    <BadgeCheck size={14} />
                    {store.isVerifiedStore ? 'موثق' : 'توثيق'}
                  </button>
                  <button
                    type="button"
                    className={`btn-toggle ${store.isActive ? 'active' : 'inactive'}`}
                    onClick={() => toggleStatus(store._id)}
                    title={store.isActive ? 'إيقاف المتجر' : 'تفعيل المتجر'}
                  >
                    {store.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    {store.isActive ? 'إيقاف' : 'تفعيل'}
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn chat-action"
                    title="تواصل مع المالك"
                    onClick={() => openStoreOwnerChat(store)}
                  >
                    <MessageCircle size={16} />
                  </button>
                  <button
                    type="button"
                    className={`icon-action-btn ${isExpanded ? 'is-expanded' : ''}`}
                    title="عرض المنتجات والعروض"
                    onClick={() => openStoreDetails(store._id)}
                  >
                    <Package size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn"
                    title="حذف المتجر"
                    onClick={() => deleteStore(store._id)}
                  >
                    <Trash2 size={16} className="text-danger" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="store-detail-panel">
                    <div className="store-detail-chat-bar">
                      <span>
                        المالك: <strong>{store.owner?.name || '—'}</strong>
                      </span>
                      <button
                        type="button"
                        className="btn-primary py-2 px-3 text-sm flex items-center gap-2"
                        onClick={() => openStoreOwnerChat(store)}
                      >
                        <MessageCircle size={15} /> تواصل مع المالك
                      </button>
                    </div>
                    <div className="store-detail-tabs">
                      <button
                        type="button"
                        className={`store-detail-tab ${detailTab === 'products' ? 'is-active' : ''}`}
                        onClick={() => setDetailTab('products')}
                      >
                        <Package size={14} className="inline ml-1" />
                        المنتجات ({storeProducts.length})
                      </button>
                      <button
                        type="button"
                        className={`store-detail-tab ${detailTab === 'offers' ? 'is-active' : ''}`}
                        onClick={() => setDetailTab('offers')}
                      >
                        <Gift size={14} className="inline ml-1" />
                        العروض ({storeOffers.length})
                      </button>
                    </div>

                    {detailLoading ? null : detailItems.length === 0 ? (
                      <div className="store-detail-empty">
                        لا يوجد {detailTab === 'products' ? 'منتجات' : 'عروض'} لهذا المتجر
                      </div>
                    ) : (
                      <div className="store-detail-list">
                        {detailItems.map((item) => (
                          <div
                            key={item._id}
                            className={`store-detail-item ${item.isActive === false ? 'is-hidden' : ''}`}
                          >
                            {(item.image || item.images?.[0]) && (
                              <img src={item.image || item.images[0]} alt={item.name} />
                            )}
                            <div className="store-detail-item-info">
                              <p className="store-detail-item-name">{item.title || item.name}</p>
                              {item.price !== undefined && (
                                <p className="store-detail-item-meta">
                                  {item.price} ₪
                                  {detailTab === 'offers' && item.discountPercentage
                                    ? ` — خصم ${item.discountPercentage}%`
                                    : ''}
                                </p>
                              )}
                              {detailTab === 'offers' && (
                                <div className="flex items-center gap-2 mt-2">
                                  <label className="text-xs font-bold text-muted">أولوية العرض:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    className="admin-input"
                                    style={{ width: '4.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                    placeholder="فارغ"
                                    value={
                                      priorityDrafts[item._id] !== undefined
                                        ? priorityDrafts[item._id]
                                        : (item.displayPriority ?? item.featuredPriority ?? '')
                                    }
                                    onChange={(e) =>
                                      setPriorityDrafts((prev) => ({
                                        ...prev,
                                        [item._id]: e.target.value,
                                      }))
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="btn-primary py-1 px-2 text-xs"
                                    onClick={() => saveFeaturedPriority(item._id)}
                                  >
                                    حفظ
                                  </button>
                                </div>
                              )}
                            </div>
                            <span className={`badge ${item.isActive === false ? 'badge-danger' : 'badge-success'}`}>
                              {item.isActive === false ? 'مخفي' : 'ظاهر'}
                            </span>
                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={() =>
                                detailTab === 'products'
                                  ? toggleProduct(item._id)
                                  : toggleOffer(item._id)
                              }
                              title={item.isActive === false ? 'إظهار' : 'إخفاء'}
                            >
                              {item.isActive === false ? <Eye size={15} /> : <EyeOff size={15} />}
                            </button>
                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={() =>
                                detailTab === 'products'
                                  ? deleteProduct(item._id)
                                  : deleteOffer(item._id)
                              }
                              title="حذف"
                            >
                              <Trash2 size={15} className="text-danger" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
