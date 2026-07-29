import '../styles/marketplacePage.css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Loader2, Gift, AlertCircle, Trash2, Edit3,
  RefreshCw, Clock, CheckCircle2, XCircle, Plus,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../context/AuthGateContext';
import { AUTH_GATE_MESSAGES } from '../utils/authGateMessages';
import { useVerificationGate } from '../context/VerificationGateContext';
import { useToast } from '../shared/Toast';
import BazaarListingCard, { regionLabel } from '../shared/BazaarListingCard';
import { formatListingPrice } from '../utils/currency';
import ReferralCardsModal from '../components/ReferralCardsModal';
import RegionPickerBox from '../components/RegionPickerBox';
import PalestinianPhoneInput from '../components/PalestinianPhoneInput';
import { unwrapList } from '../utils/unwrapList';
import EmptyState from '../shared/EmptyState';
import { queryClient, queryKeys } from '../lib/queryClient';
import MarketplaceTabNav from '../components/marketplace/MarketplaceTabNav';
import MarketplaceOnboardingTourHost from '../components/onboarding/MarketplaceOnboardingTourHost';
import MarketplaceFilters from '../components/marketplace/MarketplaceFilters';
import PublishBottomSheet from '../components/marketplace/PublishBottomSheet';
import MarketplaceImagePicker from '../components/marketplace/MarketplaceImagePicker';
import { BROWSE_TAB_IDS, listingMatchesTab } from '../utils/marketplaceTabs';
import { useRegionTree } from '../hooks/useRegionTree';
import { getLocalPhoneError, normalizeLocalPhone } from '../utils/phoneValidation';
import { resolveImageUrl } from '../utils/mediaUrl';
import {
  getEffectiveRegionId,
  pathFromRegionIds,
  pathStillValid,
  regionPathToListingIds,
} from '../utils/regionTree';
import { uploadImages } from '../utils/imageUpload';
import PriceCurrencyInput from '../components/PriceCurrencyInput';
import { DEFAULT_CURRENCY } from '../utils/currency';
import { BAZAAR_CATEGORIES } from '../utils/bazaarCategories';
import { BAZAAR_CONDITIONS } from '../utils/bazaarConditions';
import { getRecentlyViewed } from '../utils/recentlyViewed';

const EMPTY_FORM = {
  title: '',
  condition: 'used',
  category: '',
  price: '',
  currency: DEFAULT_CURRENCY,
  description: '',
  contactPhone: '',
  freeDelivery: false,
  transactionType: 'sell',
  keywords: '',
  regionId: '',
  subRegionId: '',
};

const STATUS_LABELS = {
  pending: { text: 'بانتظار الموافقة', color: 'text-amber-600 bg-amber-50' },
  approved: { text: 'نشط', color: 'text-green-600 bg-green-50' },
  rejected: { text: 'مرفوض', color: 'text-red-600 bg-red-50' },
  expired: { text: 'منتهٍ', color: 'text-gray-500 bg-gray-100' },
};

const PUBLISH_TITLES = {
  sell: 'نشر عنصر للبيع',
  exchange: 'نشر للبيع أو البدل',
  rent: 'نشر للإيجار',
  custom: 'نشر طلب (مطلوب)',
};

const readImages = async (files, existing = []) => {
  const slots = 3 - existing.length;
  const picked = Array.from(files).slice(0, slots);
  if (!picked.length) return existing;

  const urls = await uploadImages(picked);
  return [...existing, ...urls].slice(0, 3);
};

const isRequestListing = (type) => type === 'custom';

const formatPublishAge = (dateStr) => {
  if (!dateStr) return '';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'منذ يوم';
  return `منذ ${days} يوماً`;
};

const Marketplace = () => {
  const navigate = useNavigate();
  const { isAuth, user, updateUser } = useAuth();
  const { runWithAuth } = useAuthGate();
  const { toast } = useToast();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();

  const [activeTab, setActiveTab] = useState('sellExchange');
  const [showPublish, setShowPublish] = useState(false);
  const [publishSheetOpen, setPublishSheetOpen] = useState(false);
  const [favOverrides, setFavOverrides] = useState({});
  const [favPulseId, setFavPulseId] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [meta, setMeta] = useState({ pointsCost: 3, listingDays: 7, pointsAvailable: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);

  const [regionPath, setRegionPath] = useState([]);
  const [filterCondition, setFilterCondition] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const {
    data: regionTree = [],
    isLoading: regionsLoading,
    isError: regionsError,
    refetch: refetchRegions,
  } = useRegionTree();

  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [editingId, setEditingId] = useState(null);

  const filterRegionId = getEffectiveRegionId(regionPath);
  const formRegionPath = pathFromRegionIds(form.regionId, form.subRegionId, regionTree);
  const browseFilters = { filterRegionId, filterCondition, filterCategory };
  const recentlyViewedBazaar = useMemo(() => getRecentlyViewed('bazaar'), []);

  const {
    data: browseListings = [],
    isLoading: browseLoading,
  } = useQuery({
    queryKey: queryKeys.bazaarBrowse(browseFilters),
    queryFn: async () => {
      const params = {};
      if (filterRegionId) params.regionId = filterRegionId;
      if (filterCondition) params.condition = filterCondition;
      if (filterCategory) params.category = filterCategory;
      const { data } = await api.get('/bazaar', { params });
      return unwrapList(data, ['listings']);
    },
    enabled: BROWSE_TAB_IDS.includes(activeTab),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const {
    data: favoriteListings = [],
    isLoading: favoritesLoading,
  } = useQuery({
    queryKey: queryKeys.bazaarFavorites,
    queryFn: async () => {
      const { data } = await api.get('/bazaar/favorites');
      return unwrapList(data, ['listings']);
    },
    enabled: activeTab === 'favorites' && isAuth,
    staleTime: 60 * 1000,
  });

  const handleFormRegionChange = (path) => {
    const { regionId, subRegionId } = regionPathToListingIds(path);
    setForm((f) => ({ ...f, regionId, subRegionId }));
  };

  useEffect(() => {
    if (!regionPath.length || !regionTree.length) return;
    if (!pathStillValid(regionTree, regionPath)) setRegionPath([]);
  }, [regionTree, regionPath]);

  const loadMy = useCallback(async () => {
    if (!isAuth) return;
    try {
      const { data } = await api.get('/bazaar/my');
      setMyListings(unwrapList(data, ['listings']));
    } catch {
      /* ignore */
    }
  }, [isAuth]);

  const loadMeta = useCallback(async () => {
    try {
      const { data } = await api.get('/bazaar/meta');
      setMeta(data);
      if (isAuth && data.pointsAvailable != null) {
        updateUser({ points: data.pointsAvailable });
      }
    } catch {
      /* ignore */
    }
  }, [isAuth, updateUser]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (activeTab === 'mine') loadMy();
  }, [activeTab, loadMy]);

  const isFavorited = useCallback((listing) => {
    const id = String(listing._id);
    if (id in favOverrides) return favOverrides[id];
    return !!listing.isFavorited;
  }, [favOverrides]);

  const handleToggleFavorite = async (listing) => {
    runWithAuth(async () => {
      const id = String(listing._id);
      const nextFav = !isFavorited(listing);
      setFavOverrides((prev) => ({ ...prev, [id]: nextFav }));
      setFavPulseId(id);
      setTimeout(() => setFavPulseId(null), 300);
      try {
        const { data } = await api.post(`/bazaar/${listing._id}/favorite`);
        setFavOverrides((prev) => ({ ...prev, [id]: data.favorited }));
        queryClient.invalidateQueries({ queryKey: queryKeys.bazaarFavorites });
        queryClient.invalidateQueries({ queryKey: ['bazaar', 'browse'] });
      } catch (err) {
        setFavOverrides((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        toast(err.response?.data?.message || 'تعذّر التحديث', 'error');
      }
    }, AUTH_GATE_MESSAGES.favorites);
  };

  const handleTabChange = (tab) => {
    if (tab === 'mine' || tab === 'favorites') {
      runWithAuth(() => {
        setShowPublish(false);
        setActiveTab(tab);
      }, AUTH_GATE_MESSAGES.marketplace);
      return;
    }
    setShowPublish(false);
    setActiveTab(tab);
  };

  const resetForm = (transactionType = 'sell') => {
    setForm({ ...EMPTY_FORM, transactionType });
    setImages([]);
    setMainImageIndex(0);
    setEditingId(null);
  };

  const openPublishSheet = () => {
    runWithAuth(() => runWithVerification(() => setPublishSheetOpen(true)), AUTH_GATE_MESSAGES.marketplace);
  };

  const handlePublishTypeSelect = (transactionType) => {
    setPublishSheetOpen(false);
    setActiveTab('mine');
    setShowPublish(true);
    if (!editingId) resetForm(transactionType);
    else setForm((f) => ({ ...f, transactionType }));
  };

  const tabListings = browseListings.filter((item) => listingMatchesTab(item, activeTab));

  const hasBrowseFilters = Boolean(filterRegionId || filterCondition || filterCategory);

  const clearBrowseFilters = () => {
    setRegionPath([]);
    setFilterCondition('');
    setFilterCategory('');
  };

  const cancelPublish = () => {
    setShowPublish(false);
    if (editingId) resetForm();
  };

  const handleImagePick = async (e) => {
    try {
      const next = await readImages(e.target.files, images);
      setImages(next);
      if (mainImageIndex >= next.length) setMainImageIndex(0);
    } catch (err) {
      toast(err.message, 'error');
    }
    e.target.value = '';
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (mainImageIndex >= idx && mainImageIndex > 0) setMainImageIndex(mainImageIndex - 1);
  };

  const startEdit = (listing) => {
    setEditingId(listing._id);
    setForm({
      title: listing.title,
      condition: listing.condition || 'used',
      category: listing.category || '',
      price: String(listing.price),
      currency: listing.currency || DEFAULT_CURRENCY,
      description: listing.description || '',
      contactPhone: listing.contactPhone,
      freeDelivery: listing.freeDelivery,
      transactionType: listing.transactionType,
      keywords: (listing.keywords || []).join(', '),
      regionId: listing.regionId?._id || listing.regionId || '',
      subRegionId: listing.subRegionId?._id || listing.subRegionId || '',
    });
    setImages(listing.images || []);
    setMainImageIndex(listing.mainImageIndex || 0);
    setActiveTab('mine');
    setShowPublish(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    runWithAuth(async () => {
    const requestListing = isRequestListing(form.transactionType);
    if (!form.title.trim()) {
      toast(form.transactionType === 'rent' ? 'أدخل عنوان العقار أو الأصل' : 'أدخل اسم العنصر', 'error');
      return;
    }
    if (!requestListing && images.length === 0) {
      toast('أضف صورة واحدة على الأقل', 'error');
      return;
    }
    if (form.contactPhone.trim()) {
      const phoneErr = getLocalPhoneError(form.contactPhone);
      if (phoneErr) {
        toast(phoneErr, 'error');
        return;
      }
    }
    if (!requestListing && form.price === '') {
      toast('أدخل السعر', 'error');
      return;
    }
    if (!requestListing && !form.category) {
      toast('اختر الفئة', 'error');
      return;
    }
    if ((meta.pointsAvailable ?? user?.points ?? 0) < meta.pointsCost && !editingId) {
      toast(`تحتاج ${meta.pointsCost} نقاط لنشر الإعلان`, 'error');
      setReferralOpen(true);
      return;
    }

    const submitListing = async () => {
      setSubmitting(true);
      try {
        const payload = {
          title: form.title.trim(),
          transactionType: form.transactionType,
          price: form.price === '' ? 0 : Number(form.price),
          currency: form.currency || DEFAULT_CURRENCY,
          description: form.description,
          images,
          mainImageIndex,
          contactPhone: form.contactPhone.trim()
            ? normalizeLocalPhone(form.contactPhone)
            : '',
          regionId: form.regionId || undefined,
          subRegionId: form.subRegionId || undefined,
          freeDelivery: form.freeDelivery,
        };

        if (!requestListing) {
          payload.condition = form.condition;
          payload.category = form.category;
          payload.keywords = form.keywords;
        } else if (form.category) {
          payload.category = form.category;
        }

        if (editingId) {
          await api.patch(`/bazaar/${editingId}`, payload);
          toast('تم حفظ التعديل', 'success');
        } else {
          const { data } = await api.post('/bazaar', payload);
          toast(data.message || 'تم إرسال الإعلان', 'success');
          if (data.pointsRemaining != null) updateUser({ points: data.pointsRemaining });
        }
        resetForm();
        setShowPublish(false);
        setActiveTab('mine');
        loadMy();
        loadMeta();
      } catch (err) {
        if (handleApiVerificationError(err, submitListing)) return;
        if (err.response?.status === 402 || err.response?.data?.needsPoints) {
          toast(err.response?.data?.message || 'نقاط غير كافية', 'error');
          setReferralOpen(true);
        } else {
          toast(err.response?.data?.message || 'فشل النشر', 'error');
        }
      } finally {
        setSubmitting(false);
      }
    };

    if (editingId) {
      submitListing();
    } else {
      runWithVerification(submitListing);
    }
    }, AUTH_GATE_MESSAGES.marketplace);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('حذف هذا الإعلان؟')) return;
    try {
      await api.delete(`/bazaar/${id}`);
      toast('تم الحذف', 'success');
      loadMy();
    } catch (err) {
      toast(err.response?.data?.message || 'تعذّر الحذف', 'error');
    }
  };

  const handleRenew = async (id) => {
    const renewListing = async () => {
      if ((meta.pointsAvailable ?? user?.points ?? 0) < meta.pointsCost) {
        toast(`تحتاج ${meta.pointsCost} نقاط للتجديد`, 'error');
        setReferralOpen(true);
        return;
      }
      try {
        const { data } = await api.post(`/bazaar/${id}/renew`);
        toast(data.message, 'success');
        if (data.pointsRemaining != null) updateUser({ points: data.pointsRemaining });
        loadMy();
        loadMeta();
      } catch (err) {
        if (handleApiVerificationError(err, () => renewListing())) return;
        if (err.response?.status === 402) setReferralOpen(true);
        toast(err.response?.data?.message || 'تعذّر التجديد', 'error');
      }
    };
    runWithVerification(renewListing);
  };

  const visibleFavorites = favoriteListings.filter((item) => {
    const id = String(item._id);
    if (id in favOverrides) return favOverrides[id];
    return true;
  });

  const pointsAvailable = meta.pointsAvailable ?? user?.points ?? 0;
  const requestListing = isRequestListing(form.transactionType);
  const isRent = form.transactionType === 'rent';

  const titlePlaceholder = isRent
    ? 'عنوان العقار أو الأصل'
    : requestListing
      ? 'ما الذي تبحث عنه؟'
      : 'اسم العنصر';

  const renderListingList = (listings) => (
    <div className="marketplace-listings">
      {listings.map((item, index) => (
        <React.Fragment key={item._id}>
          {index > 0 && <div className="marketplace-list-divider" aria-hidden />}
          <BazaarListingCard
            listing={item}
            favorited={isFavorited(item)}
            isPulsing={favPulseId === String(item._id)}
            onToggleFavorite={handleToggleFavorite}
            onClick={(l) => navigate(`/marketplace/${l._id}`)}
          />
        </React.Fragment>
      ))}
    </div>
  );

  const showPublishCta = !showPublish && activeTab !== 'mine';

  const renderPublishForm = () => (
    <div className="marketplace-publish-page fixed inset-0 z-[70] bg-gray-50 overflow-y-auto text-right" dir="rtl">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <h2 className="text-base font-black text-gray-900 font-cairo">
          {editingId ? 'تعديل الإعلان' : (PUBLISH_TITLES[form.transactionType] || 'بيع / نشر')}
        </h2>
        <button
          type="button"
          onClick={cancelPublish}
          className="text-sm font-black text-gray-600 px-4 py-2 rounded-xl bg-gray-100 active:scale-[0.98] transition-transform"
        >
          إلغاء
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] space-y-3.5">
        <div className={`rounded-2xl p-3 flex items-start gap-3 ${pointsAvailable >= meta.pointsCost ? 'bg-green-50' : 'bg-amber-50'}`}>
          {pointsAvailable >= meta.pointsCost ? (
            <CheckCircle2 className="text-green-600 shrink-0" size={22} />
          ) : (
            <AlertCircle className="text-amber-600 shrink-0" size={22} />
          )}
          <div className="flex-1">
            <p className="text-sm font-black text-gray-800">
              رصيدك: {pointsAvailable} نقطة — النشر يكلف {meta.pointsCost} نقاط
            </p>
            {pointsAvailable < meta.pointsCost && (
              <>
                <p className="text-xs text-gray-600 mt-1">
                  احصل على نقاط عبر مشاركة رابط الإحالة أو دعوة صديق.
                </p>
                <button
                  type="button"
                  onClick={() => setReferralOpen(true)}
                  className="mt-2 text-xs font-black text-primary flex items-center gap-1"
                >
                  <Gift size={14} /> احصل على نقاط
                </button>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 space-y-3.5">
          <MarketplaceImagePicker
            images={images}
            mainImageIndex={mainImageIndex}
            onPick={handleImagePick}
            onMainImageChange={setMainImageIndex}
            onRemoveImage={removeImage}
            optional={requestListing}
            wantedMode={requestListing}
          />

          <div className="space-y-1">
            <label className="text-xs font-black text-gray-500">
              {isRent ? 'عنوان العقار أو الأصل' : 'اسم العنصر'}
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={titlePlaceholder}
              className="w-full bg-gray-50 rounded-xl p-3.5 text-sm font-bold border border-transparent focus:border-primary/20 focus:outline-none"
            />
          </div>

          {!requestListing && (
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-500">السعر</label>
              <PriceCurrencyInput
                price={form.price}
                currency={form.currency}
                onPriceChange={(value) => setForm({ ...form, price: value })}
                onCurrencyChange={(value) => setForm({ ...form, currency: value })}
                required
                pricePlaceholder="السعر"
              />
            </div>
          )}

          {!requestListing && (
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-500">الفئة</label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-gray-50 rounded-xl p-3.5 text-sm font-bold border border-transparent focus:border-primary/20 focus:outline-none"
              >
                <option value="">اختر الفئة</option>
                {BAZAAR_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          )}

          {!requestListing && (
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-500">الحالة</label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full bg-gray-50 rounded-xl p-3.5 text-sm font-bold border border-transparent focus:border-primary/20 focus:outline-none"
              >
                {BAZAAR_CONDITIONS.map((cond) => (
                  <option key={cond.value} value={cond.value}>{cond.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-black text-gray-500">الوصف</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="وصف مختصر للعنصر..."
              className="w-full bg-gray-50 rounded-xl p-3.5 text-sm font-bold border border-transparent focus:border-primary/20 focus:outline-none resize-none"
            />
          </div>

          {!requestListing && (
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-500">الكلمات المفتاحية</label>
              <input
                required
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="2–5 كلمات مفصولة بفاصلة — تساعد في البحث"
                className="w-full bg-gray-50 rounded-xl p-3.5 text-sm font-bold border border-transparent focus:border-primary/20 focus:outline-none"
              />
            </div>
          )}

          <RegionPickerBox
            tree={regionTree}
            pathIds={formRegionPath}
            onPathChange={handleFormRegionChange}
            loading={regionsLoading}
            error={regionsError}
            onRetry={refetchRegions}
          />

          <div className="space-y-1">
            <label className="text-xs font-black text-gray-500">رقم الهاتف (اختياري)</label>
            <PalestinianPhoneInput
              value={form.contactPhone}
              onValueChange={(v) => setForm({ ...form, contactPhone: v })}
            />
          </div>

          {!requestListing && (
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.freeDelivery}
                onChange={(e) => setForm({ ...form, freeDelivery: e.target.checked })}
                className="rounded"
              />
              التوصيل مجاني
            </label>
          )}

          <div className="flex gap-2 pt-1">
            {editingId && (
              <button type="button" onClick={() => resetForm()} className="flex-1 py-3.5 rounded-xl border font-black text-sm">
                إلغاء
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary text-white py-3.5 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-60 text-sm"
            >
              {submitting ? <Loader2 className="animate-spin" size={20} /> : (
                <>{editingId ? 'حفظ التعديل' : 'نشر الإعلان'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="pb-20 bg-gray-50 min-h-screen text-right marketplace-page" dir="rtl">
      <MarketplaceOnboardingTourHost activePage />
      <div className="px-2 pt-3 pb-2 text-center" data-onboarding="mp-main">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug font-cairo">
          السوق العام
        </h1>
        <p className="marketplace-subtitle mt-2.5 text-[13px] sm:text-sm text-gray-600 leading-relaxed max-w-lg mx-auto px-1">
          هنا يمكنك بيع أغراضك، شراء ما تبحث عنه، عرض أو استئجار العقارات والمركبات، ونشر طلباتك، كل ذلك في مكان واحد.
        </p>
      </div>

      {showPublishCta && (
        <div className="px-2 pb-2">
          <button
            type="button"
            data-onboarding="mp-sell"
            onClick={openPublishSheet}
            className="marketplace-publish-cta w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white shadow-lg shadow-primary/25 active:scale-[0.99] transition-transform"
          >
            <Plus size={20} strokeWidth={2.5} />
            بيع أو نشر
          </button>
        </div>
      )}

      <MarketplaceTabNav activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="px-1.5 sm:px-2 py-2">
        {BROWSE_TAB_IDS.includes(activeTab) && (
          <div className="space-y-3">
            {recentlyViewedBazaar.length > 0 && !hasBrowseFilters && (
              <section className="rounded-2xl border border-gray-100 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                  <span className="text-xs font-black text-gray-800">شاهدت مؤخراً</span>
                  <span className="text-[10px] font-bold text-gray-400">محفوظ محلياً</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {recentlyViewedBazaar.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(`/marketplace/${item.id}`)}
                      className="shrink-0 w-[7.5rem] rounded-xl border border-gray-100 bg-gray-50 text-right active:scale-[0.98] transition-transform"
                    >
                      {item.image ? (
                        <img
                          src={resolveImageUrl(item.image, { width: 240 })}
                          alt=""
                          className="h-20 w-full rounded-t-xl object-cover bg-gray-100"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="h-20 w-full rounded-t-xl bg-gray-100" />
                      )}
                      <div className="p-2">
                        <p className="line-clamp-2 text-[10px] font-black text-gray-800">{item.title || 'إعلان'}</p>
                        {item.price && (
                          <p className="mt-1 truncate text-[10px] font-bold text-primary">{item.price}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="flex items-center justify-between gap-2 px-0.5">
              <span className="text-xs font-bold text-gray-500">تصفية الإعلانات</span>
              {hasBrowseFilters && (
                <button
                  type="button"
                  onClick={clearBrowseFilters}
                  className="shrink-0 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold text-violet-600 bg-violet-50 border border-violet-100 active:scale-[0.98] transition-transform"
                >
                  إلغاء التصفية
                </button>
              )}
            </div>

            <MarketplaceFilters
              regionTree={regionTree}
              regionPath={regionPath}
              onRegionPathChange={setRegionPath}
              regionsLoading={regionsLoading}
              regionsError={regionsError}
              onRegionsRetry={refetchRegions}
              filterCondition={filterCondition}
              onFilterConditionChange={setFilterCondition}
              filterCategory={filterCategory}
              onFilterCategoryChange={setFilterCategory}
            />

            {browseLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            )}

            {!browseLoading && tabListings.length === 0 && (
              <EmptyState title="لا إعلانات" description="جرّب تغيير المنطقة أو الفلاتر" />
            )}

            {!browseLoading && tabListings.length > 0 && renderListingList(tabListings)}
          </div>
        )}

        {activeTab === 'mine' && isAuth && !showPublish && (
          <div className="space-y-3">
            <h2 className="text-base font-black text-gray-900 font-cairo px-0.5">منشوراتي</h2>

            {myListings.length === 0 && (
              <EmptyState title="لا منشورات بعد" description="انتقل إلى تبويب آخر واضغط «بيع أو نشر» لنشر إعلانك الأول" />
            )}
            {myListings.map((item) => {
              const st = STATUS_LABELS[item.status] || STATUS_LABELS.pending;
              const canRenew = ['approved', 'expired'].includes(item.status);
              const expiringSoon = item.expiresAt && new Date(item.expiresAt) - Date.now() < 2 * 86400000;
              const thumb = item.mainImage || item.images?.[0];
              const isWanted = isRequestListing(item.transactionType);

              return (
                <div key={item._id} className="bg-white rounded-2xl p-3 border border-gray-100 flex gap-3">
                  {thumb ? (
                    <img
                      src={resolveImageUrl(thumb, { width: 300 })}
                      alt=""
                      className="w-[4.5rem] h-[4.5rem] rounded-xl object-cover bg-gray-100 shrink-0"
                    />
                  ) : isWanted ? (
                    <div className="w-[4.5rem] h-[4.5rem] rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
                      <span className="text-sm font-black text-orange-500">مطلوب</span>
                    </div>
                  ) : (
                    <div className="w-[4.5rem] h-[4.5rem] rounded-xl bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-black text-sm truncate">{item.title}</h3>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${st.color}`}>{st.text}</span>
                    </div>
                    <p className="text-primary font-black text-sm">
                      {isWanted && !item.price ? 'بدون سعر' : formatListingPrice(item)}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold">{regionLabel(item)}</p>
                    {item.createdAt && (
                      <p className="text-[10px] text-gray-400 font-bold">
                        نُشر {formatPublishAge(item.createdAt)}
                      </p>
                    )}
                    {item.expiresAt && item.status === 'approved' && (
                      <p className={`text-[10px] font-bold flex items-center gap-1 mt-1 ${expiringSoon ? 'text-amber-600' : 'text-gray-400'}`}>
                        <Clock size={12} />
                        {expiringSoon ? 'ينتهي قريباً — هل تريد التجديد؟' : `ينتهي ${new Date(item.expiresAt).toLocaleDateString('ar-IQ')}`}
                      </p>
                    )}
                    {item.adminReview?.note && item.status === 'rejected' && (
                      <p className="text-[10px] text-red-500 mt-1">{item.adminReview.note}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <button type="button" onClick={() => startEdit(item)} className="text-xs font-black text-primary flex items-center gap-1">
                        <Edit3 size={12} /> تعديل
                      </button>
                      <button type="button" onClick={() => handleDelete(item._id)} className="text-xs font-black text-red-500 flex items-center gap-1">
                        <Trash2 size={12} /> حذف
                      </button>
                      {canRenew && (
                        <button type="button" onClick={() => handleRenew(item._id)} className="text-xs font-black text-green-600 flex items-center gap-1">
                          <RefreshCw size={12} /> تجديد ({meta.pointsCost} نقاط)
                        </button>
                      )}
                      {item.status === 'approved' && item.isVisible && (
                        <button type="button" onClick={() => navigate(`/marketplace/${item._id}`)} className="text-xs font-black text-gray-600">
                          عرض
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'favorites' && isAuth && (
          <div className="space-y-3">
            {favoritesLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            )}

            {!favoritesLoading && visibleFavorites.length === 0 && (
              <EmptyState
                title="لا مفضّلات بعد"
                description="اضغط على القلب في أي إعلان لحفظه هنا"
              />
            )}

            {!favoritesLoading && visibleFavorites.length > 0 && renderListingList(visibleFavorites)}
          </div>
        )}
      </div>

      <PublishBottomSheet
        open={publishSheetOpen}
        onClose={() => setPublishSheetOpen(false)}
        onSelect={handlePublishTypeSelect}
      />

      {showPublish && renderPublishForm()}

      <ReferralCardsModal open={referralOpen} onClose={() => setReferralOpen(false)} />
    </div>
  );
};

export default Marketplace;
