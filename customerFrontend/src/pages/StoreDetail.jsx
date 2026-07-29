import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight, MapPin, Phone, MessageCircle, Gift, Trophy, Bell,
} from 'lucide-react';
import api from '../api/axios';
import { logActivity } from '../utils/activity';
import StarRating from '../components/StarRating';
import VerifiedBadge from '../components/marketplace/VerifiedBadge';
import OfferCard from '../components/OfferCard';
import ProductCard from '../shared/ProductCard';
import LightLoadingHint from '../shared/LightLoadingHint';
import ErrorState from '../shared/ErrorState';
import { useToast } from '../shared/Toast';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../context/AuthGateContext';
import { AUTH_GATE_MESSAGES } from '../utils/authGateMessages';
import { resolveStoreCover, resolveStoreLogo, storeLogoPlaceholder } from '../utils/mediaUrl';
import { clearStoreNotifyOptOut, isStoreNotifyOptedOut } from '../utils/giftActivationFlow';
import { queryKeys } from '../lib/queryClient';
import { recordVisitedStore } from '../utils/visitedStores';
import { warmStoreDetailImages } from '../utils/cacheImages';

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuth } = useAuth();
  const { runWithAuth } = useAuthGate();
  const [tab, setTab] = useState('offers');
  const [prizes, setPrizes] = useState([]);
  const [joining, setJoining] = useState(false);
  const [enablingNotify, setEnablingNotify] = useState(false);
  const [notifyOptOut, setNotifyOptOut] = useState(() => isStoreNotifyOptedOut(id));
  const [loggedVisit, setLoggedVisit] = useState(false);

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.storeDetail(id),
    queryFn: async () => {
      const { data: d } = await api.get(`/stores/${id}`);
      recordVisitedStore(id);
      warmStoreDetailImages(d);
      return d;
    },
    staleTime: 5 * 60 * 1000,
    networkMode: 'offlineFirst',
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!data?.store || loggedVisit) return;
    logActivity('visit_store', {
      targetType: 'Store',
      targetId: id,
      meta: { category: data.store?.category, region: data.store?.region },
    });
    setLoggedVisit(true);
  }, [data, id, loggedVisit]);

  useEffect(() => {
    let mounted = true;
    api.get(`/stores/${id}/member-prizes`)
      .then(({ data: p }) => mounted && setPrizes(p.prizes || []))
      .catch(() => {});
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    setNotifyOptOut(isStoreNotifyOptedOut(id));
    setLoggedVisit(false);
  }, [id]);

  const enableStoreNotifications = async () => {
    runWithAuth(async () => {
      setEnablingNotify(true);
      try {
        clearStoreNotifyOptOut(id);
        const { data: res } = await api.post(`/stores/${id}/follow`);
        toast(res.message || 'تمت متابعة الإشعارات', 'success');
        setNotifyOptOut(false);
      } catch (err) {
        toast(err.response?.data?.message || 'تعذّر تفعيل الإشعارات', 'error');
      } finally {
        setEnablingNotify(false);
      }
    }, AUTH_GATE_MESSAGES.generic);
  };

  const joinStore = async () => {
    runWithAuth(async () => {
      setJoining(true);
      try {
        const { data: res } = await api.post(`/stores/${id}/join`);
        toast(res.message, 'success');
        refetch();
      } catch (err) {
        toast(err.response?.data?.message || 'فشل الانضمام', 'error');
      } finally {
        setJoining(false);
      }
    }, AUTH_GATE_MESSAGES.generic);
  };

  const contact = () => {
    const owner = data?.store?.owner;
    const ownerId = owner?._id || owner;
    if (!ownerId) { toast('لا يمكن التواصل حالياً', 'error'); return; }
    localStorage.setItem('chatContext', JSON.stringify({
      recipientId: ownerId,
      context: { type: 'store', storeId: id, storeName: data.store.name },
    }));
    navigate('/chat');
  };

  if (isLoading && !data) return <LightLoadingHint label="جاري تحميل المتجر..." />;
  const error = queryError?.response?.data?.message || (queryError && !data ? 'تعذّر التحميل' : '');
  if (error && !data?.store) return <ErrorState message={error || 'المتجر غير موجود'} onRetry={() => refetch()} />;
  if (!data?.store) return <ErrorState message="المتجر غير موجود" />;

  const { store, offers = [], products = [], membershipStatus, storeCompetitionsEnabled } = data;
  const coverSrc = resolveStoreCover(store, { width: 800 });
  const logoSrc = resolveStoreLogo(store, { width: 160 }) || storeLogoPlaceholder(store);
  const isMember = membershipStatus === 'member';
  const isPending = membershipStatus === 'pending';

  return (
    <div className="pb-28 -mt-4 text-right" dir="rtl">
      <div className="relative isolate">
        <div className="relative h-40 w-full overflow-hidden rounded-b-[32px]">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt=""
              className="absolute inset-0 z-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary to-purple-700" />
          )}
          <div className="absolute inset-0 z-[1] bg-black/20" aria-hidden />
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 z-[2] bg-white/20 backdrop-blur p-2 rounded-xl text-white"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        <div className="relative z-20 -mt-10 flex justify-center">
          <img
            src={logoSrc}
            alt=""
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg bg-white"
          />
        </div>
      </div>

      <div className="px-4 pt-6 space-y-4">
        {isFetching && data && (
          <p className="text-[11px] text-center text-primary/70 font-bold animate-pulse">جاري التحديث...</p>
        )}
        <div className="bg-white rounded-[28px] p-4 shadow-lg border border-gray-50 text-center">
          <h1 className="text-lg font-black text-gray-900 truncate">{store.name}</h1>
          {store.isVerifiedStore && <VerifiedBadge className="mt-1 justify-center" />}
          <p className="text-[10px] text-gray-400 font-bold flex items-center justify-center gap-1 mt-1">
            <MapPin size={11} /> {store.region}{store.subRegion ? ` · ${store.subRegion}` : ''}
          </p>
          <StarRating targetType="store" targetId={store._id} ratingAvg={store.ratingAvg} ratingCount={store.ratingCount} compact className="mt-1 justify-center" />
        </div>

        <div className="flex flex-wrap gap-2">
          {!isMember && (
            <button type="button" onClick={joinStore} disabled={joining} className="flex-1 min-w-[140px] bg-primary text-white py-3 rounded-2xl font-black text-sm disabled:opacity-50">
              {joining ? '...' : isPending ? 'قيد الانتظار — أدخل كوداً' : 'انضم للمتجر'}
            </button>
          )}
          {isMember && notifyOptOut && (
            <button
              type="button"
              onClick={enableStoreNotifications}
              disabled={enablingNotify}
              className="flex-1 min-w-[140px] bg-amber-500 text-white py-3 rounded-2xl font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {enablingNotify ? '...' : (
                <>
                  <Bell size={16} />
                  متابعة الإشعارات
                </>
              )}
            </button>
          )}
          {isMember && !notifyOptOut && (
            <span className="flex-1 text-center py-3 rounded-2xl bg-green-50 text-green-700 font-black text-sm border border-green-100">عضو فعلي ✓</span>
          )}
          <button type="button" onClick={contact} className="px-4 py-3 rounded-2xl border border-gray-200 text-gray-700">
            <MessageCircle size={20} />
          </button>
          {store.phone && (
            <a href={`tel:${store.phone}`} className="px-4 py-3 rounded-2xl border border-gray-200 text-gray-700">
              <Phone size={20} />
            </a>
          )}
        </div>

        {store.description && (
          <p className="text-sm text-gray-600 bg-white p-4 rounded-2xl border border-gray-100">{store.description}</p>
        )}

        {isMember && prizes.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2">
            <h3 className="font-black text-amber-800 flex items-center gap-2"><Gift size={18} /> جوائز الأعضاء</h3>
            {prizes.map((p) => (
              <div key={p._id} className="bg-white rounded-xl p-3 text-sm">
                <span className="text-lg">{p.icon}</span> <strong>{p.title}</strong>
                {p.description && <p className="text-xs text-gray-500 mt-1">{p.description}</p>}
              </div>
            ))}
          </div>
        )}

        {storeCompetitionsEnabled && isMember && (
          <button type="button" className="w-full py-3 rounded-2xl bg-purple-50 text-purple-700 font-black text-sm flex items-center justify-center gap-2 border border-purple-100">
            <Trophy size={18} /> مسابقات المتجر (قريباً)
          </button>
        )}

        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          {['offers', 'products'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-black ${tab === t ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
            >
              {t === 'offers' ? 'العروض' : 'المنتجات'}
            </button>
          ))}
        </div>

        {tab === 'offers' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {offers.length === 0 ? <p className="text-sm text-gray-400 col-span-full text-center py-8">لا عروض حالياً</p> : offers.map((o) => (
              <OfferCard key={o._id} offer={{ ...o, store }} />
            ))}
          </div>
        )}

        {tab === 'products' && (
          <div className="grid grid-cols-2 gap-3">
            {products.length === 0 ? <p className="text-sm text-gray-400 col-span-full text-center py-8">لا منتجات</p> : products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreDetail;
