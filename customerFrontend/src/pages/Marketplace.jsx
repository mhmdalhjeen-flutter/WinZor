import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Search, PlusCircle, Camera, Loader2, Gift, AlertCircle, Trash2, Edit3,
  RefreshCw, Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useVerificationGate } from '../context/VerificationGateContext';
import { useToast } from '../shared/Toast';
import BazaarListingCard, { formatPrice, regionLabel } from '../shared/BazaarListingCard';
import ReferralCardsModal from '../components/ReferralCardsModal';
import QuickSearchPanel from '../components/QuickSearchPanel';
import RegionPickerBox from '../components/RegionPickerBox';
import PalestinianPhoneInput from '../components/PalestinianPhoneInput';
import { unwrapList } from '../utils/unwrapList';
import EmptyState from '../shared/EmptyState';
import { queryKeys } from '../lib/queryClient';
import { useRegionTree } from '../hooks/useRegionTree';
import { getLocalPhoneError, normalizeLocalPhone } from '../utils/phoneValidation';
import {
  getEffectiveRegionId,
  pathFromRegionIds,
  pathStillValid,
  regionPathToListingIds,
  listingMatchesRegionFilter,
} from '../utils/regionTree';
import { fileToOptimizedDataUrl } from '../utils/imageUpload';

const EMPTY_FORM = {
  title: '',
  condition: 'used',
  price: '',
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

const readImages = async (files, existing = []) => {
  const slots = 3 - existing.length;
  const picked = Array.from(files).slice(0, slots);
  if (!picked.length) return existing;

  const optimized = [];
  for (const file of picked) {
    optimized.push(await fileToOptimizedDataUrl(file));
  }
  return [...existing, ...optimized].slice(0, 3);
};

const Marketplace = () => {
  const navigate = useNavigate();
  const { isAuth, user, updateUser } = useAuth();
  const { toast } = useToast();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();

  const [activeTab, setActiveTab] = useState('browse');
  const [postMode, setPostMode] = useState('create');
  const [myListings, setMyListings] = useState([]);
  const [meta, setMeta] = useState({ pointsCost: 3, listingDays: 7, pointsAvailable: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);

  const [regionPath, setRegionPath] = useState([]);
  const [filterCondition, setFilterCondition] = useState('');
  const [filterTransaction, setFilterTransaction] = useState('');

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
  const browseFilters = { filterRegionId, filterCondition, filterTransaction };

  const {
    data: browseListings = [],
    isLoading: browseLoading,
  } = useQuery({
    queryKey: queryKeys.bazaarBrowse(browseFilters),
    queryFn: async () => {
      const params = {};
      if (filterRegionId) params.regionId = filterRegionId;
      if (filterCondition) params.condition = filterCondition;
      if (filterTransaction) params.transactionType = filterTransaction;
      const { data } = await api.get('/bazaar', { params });
      return unwrapList(data, ['listings']);
    },
    enabled: activeTab === 'browse',
    placeholderData: keepPreviousData,
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
    if (activeTab === 'post' && postMode === 'mine') loadMy();
  }, [activeTab, postMode, loadMy]);

  const filteredMyListings = myListings.filter((item) => {
    if (!listingMatchesRegionFilter(item, filterRegionId, regionTree)) return false;
    if (filterCondition && item.condition !== filterCondition) return false;
    if (filterTransaction && item.transactionType !== filterTransaction) return false;
    return true;
  });

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
      condition: listing.condition,
      price: String(listing.price),
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
    setPostMode('create');
    setActiveTab('post');
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImages([]);
    setMainImageIndex(0);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuth) {
      navigate('/login');
      return;
    }
    if (images.length === 0) {
      toast('أضف صورة واحدة على الأقل', 'error');
      return;
    }
    if (!form.regionId) {
      toast('اختر المنطقة من مربع المناطق', 'error');
      return;
    }
    const phoneErr = getLocalPhoneError(form.contactPhone);
    if (phoneErr) {
      toast(phoneErr, 'error');
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
          ...form,
          price: Number(form.price),
          images,
          mainImageIndex,
          contactPhone: normalizeLocalPhone(form.contactPhone),
          regionId: form.regionId || undefined,
          subRegionId: form.subRegionId || undefined,
        };

        if (editingId) {
          await api.patch(`/bazaar/${editingId}`, payload);
          toast('تم تحديث الإعلان — بانتظار الموافقة', 'success');
        } else {
          const { data } = await api.post('/bazaar', payload);
          toast(data.message || 'تم إرسال الإعلان', 'success');
          if (data.pointsRemaining != null) updateUser({ points: data.pointsRemaining });
        }
        resetForm();
        setPostMode('mine');
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

  const pointsAvailable = meta.pointsAvailable ?? user?.points ?? 0;

  return (
    <div className="pb-20 bg-gray-50 min-h-screen text-right" dir="rtl">
      <div className="px-4 pt-2 pb-3">
        <h1 className="text-2xl font-black text-gray-900">اعرض غراضك</h1>
        <p className="text-xs text-gray-500 font-bold">بيع وشراء وبدل بين الزبائن فقط — منفصل عن عروض المتاجر</p>
      </div>

      <div className="sticky top-0 z-30 bg-white shadow-sm px-4 py-3 flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('browse')}
          className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 ${
            activeTab === 'browse' ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-500'
          }`}
        >
          <Search size={18} /> تصفح الإعلانات
        </button>
        <button
          type="button"
          onClick={() => {
            if (!isAuth) {
              navigate('/login');
              return;
            }
            runWithVerification(() => setActiveTab('post'));
          }}
          className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 ${
            activeTab === 'post' ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-500'
          }`}
        >
          <PlusCircle size={18} /> أضف إعلان
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'browse' && (
          <div className="space-y-4">
            <QuickSearchPanel
              regionTree={regionTree}
              regionPath={regionPath}
              onRegionPathChange={setRegionPath}
              regionsLoading={regionsLoading}
              regionsError={regionsError}
              onRegionsRetry={refetchRegions}
              showProducts={false}
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold"
              >
                <option value="">كل الحالات</option>
                <option value="new">جديد</option>
                <option value="used">مستعمل</option>
              </select>
              <select
                value={filterTransaction}
                onChange={(e) => setFilterTransaction(e.target.value)}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold"
              >
                <option value="">كل الأنواع</option>
                <option value="sell">بيع</option>
                <option value="buy">شراء</option>
                <option value="exchange">بدل</option>
                <option value="custom">حسب الطلب</option>
              </select>
            </div>

            {!browseLoading && browseListings.length === 0 && (
              <EmptyState title="لا إعلانات" description="جرّب تغيير المنطقة أو الفلاتر" />
            )}

            {browseListings.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {browseListings.map((item) => (
                  <BazaarListingCard
                    key={item._id}
                    listing={item}
                    onClick={(l) => navigate(`/marketplace/${l._id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'post' && isAuth && (
          <div className="space-y-4">
            <div className="flex gap-2 bg-white p-1 rounded-2xl border border-gray-100">
              <button
                type="button"
                onClick={() => { setPostMode('create'); if (!editingId) resetForm(); }}
                className={`flex-1 py-2 rounded-xl text-sm font-black ${postMode === 'create' ? 'bg-primary text-white' : 'text-gray-500'}`}
              >
                {editingId ? 'تعديل إعلان' : 'نشر جديد'}
              </button>
              <button
                type="button"
                onClick={() => { setPostMode('mine'); loadMy(); }}
                className={`flex-1 py-2 rounded-xl text-sm font-black ${postMode === 'mine' ? 'bg-primary text-white' : 'text-gray-500'}`}
              >
                إعلاناتي
              </button>
            </div>

            {postMode === 'create' && (
              <>
                <div className={`rounded-2xl p-4 flex items-start gap-3 ${pointsAvailable >= meta.pointsCost ? 'bg-green-50' : 'bg-amber-50'}`}>
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
                      <p className="text-xs text-gray-600 mt-1">
                        احصل على نقاط عبر مشاركة رابط الإحالة أو دعوة صديق.
                      </p>
                    )}
                    {pointsAvailable < meta.pointsCost && (
                      <button
                        type="button"
                        onClick={() => setReferralOpen(true)}
                        className="mt-2 text-xs font-black text-primary flex items-center gap-1"
                      >
                        <Gift size={14} /> احصل على نقاط
                      </button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-4">
                  <h2 className="text-lg font-black text-gray-900">
                    {editingId ? 'تعديل الإعلان' : 'إعلان جديد'}
                  </h2>

                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="اسم المنتج / العنصر"
                    className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="السعر (د.ع)"
                      className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold"
                    />
                    <select
                      value={form.condition}
                      onChange={(e) => setForm({ ...form, condition: e.target.value })}
                      className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold"
                    >
                      <option value="new">جديد</option>
                      <option value="used">مستعمل</option>
                    </select>
                  </div>

                  <select
                    value={form.transactionType}
                    onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
                    className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold"
                  >
                    <option value="sell">بيع</option>
                    <option value="buy">شراء</option>
                    <option value="exchange">بدل</option>
                    <option value="custom">حسب الطلب</option>
                  </select>

                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    placeholder="وصف مختصر..."
                    className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold"
                  />

                  <RegionPickerBox
                    tree={regionTree}
                    pathIds={formRegionPath}
                    onPathChange={handleFormRegionChange}
                    loading={regionsLoading}
                    error={regionsError}
                    onRetry={refetchRegions}
                  />

                  <input
                    required
                    value={form.keywords}
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    placeholder="كلمات مفتاحية (2–5) مفصولة بفاصلة"
                    className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold"
                  />

                  <PalestinianPhoneInput
                    value={form.contactPhone}
                    onValueChange={(v) => setForm({ ...form, contactPhone: v })}
                    required
                  />

                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.freeDelivery}
                      onChange={(e) => setForm({ ...form, freeDelivery: e.target.checked })}
                      className="rounded"
                    />
                    التوصيل مجاني
                  </label>

                  <div>
                    <p className="text-sm font-black text-gray-700 mb-2">الصور (حتى 3 — اختر الرئيسية)</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <button
                            type="button"
                            onClick={() => setMainImageIndex(idx)}
                            className={`w-20 h-20 rounded-xl overflow-hidden border-2 ${mainImageIndex === idx ? 'border-primary' : 'border-gray-200'}`}
                          >
                            <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {images.length < 3 && (
                      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl p-6 cursor-pointer text-gray-500 hover:text-primary">
                        <Camera size={22} />
                        <span className="text-xs font-black">إضافة صورة</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                      </label>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {editingId && (
                      <button type="button" onClick={resetForm} className="flex-1 py-4 rounded-2xl border font-black text-sm">
                        إلغاء
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {submitting ? <Loader2 className="animate-spin" size={20} /> : (
                        <>{editingId ? 'حفظ التعديل' : 'نشر الإعلان'}</>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {postMode === 'mine' && (
              <div className="space-y-4">
                <QuickSearchPanel
                  regionTree={regionTree}
                  regionPath={regionPath}
                  onRegionPathChange={setRegionPath}
                  regionsLoading={regionsLoading}
                  regionsError={regionsError}
                  onRegionsRetry={refetchRegions}
                  showProducts={false}
                  compact
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filterCondition}
                    onChange={(e) => setFilterCondition(e.target.value)}
                    className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold"
                  >
                    <option value="">كل الحالات</option>
                    <option value="new">جديد</option>
                    <option value="used">مستعمل</option>
                  </select>
                  <select
                    value={filterTransaction}
                    onChange={(e) => setFilterTransaction(e.target.value)}
                    className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold"
                  >
                    <option value="">كل الأنواع</option>
                    <option value="sell">بيع</option>
                    <option value="buy">شراء</option>
                    <option value="exchange">بدل</option>
                    <option value="custom">حسب الطلب</option>
                  </select>
                </div>

                {myListings.length === 0 && (
                  <EmptyState title="لا إعلانات بعد" description="انشر إعلانك الأول من تبويب نشر جديد" />
                )}
                {myListings.length > 0 && filteredMyListings.length === 0 && (
                  <EmptyState title="لا نتائج" description="جرّب تغيير المنطقة أو الفلاتر" />
                )}
                {filteredMyListings.map((item) => {
                  const st = STATUS_LABELS[item.status] || STATUS_LABELS.pending;
                  const canRenew = ['approved', 'expired'].includes(item.status);
                  const expiringSoon = item.expiresAt && new Date(item.expiresAt) - Date.now() < 2 * 86400000;

                  return (
                    <div key={item._id} className="bg-white rounded-2xl p-4 border border-gray-100 flex gap-3">
                      <img
                        src={item.mainImage || item.images?.[0]}
                        alt=""
                        className="w-20 h-20 rounded-xl object-cover bg-gray-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-black text-sm truncate">{item.title}</h3>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${st.color}`}>{st.text}</span>
                        </div>
                        <p className="text-primary font-black text-sm">{formatPrice(item.price)}</p>
                        <p className="text-[10px] text-gray-500 font-bold">{regionLabel(item)}</p>
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
                          {['pending', 'rejected'].includes(item.status) && (
                            <button type="button" onClick={() => startEdit(item)} className="text-xs font-black text-primary flex items-center gap-1">
                              <Edit3 size={12} /> تعديل
                            </button>
                          )}
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
          </div>
        )}
      </div>

      <ReferralCardsModal open={referralOpen} onClose={() => setReferralOpen(false)} />
    </div>
  );
};

export default Marketplace;
