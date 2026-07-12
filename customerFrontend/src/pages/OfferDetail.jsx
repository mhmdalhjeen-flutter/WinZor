import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight, MapPin, Clock, Tag, Store as StoreIcon,
  MessageCircle, ShoppingCart, Check, Loader2, ImageOff, Heart
} from 'lucide-react';
import axios from '../api/axios';
import { logActivity, toggleFavorite } from '../utils/activity';
import { recordOfferView } from '../utils/offerAnalytics';
import StarRating from '../components/StarRating';
import OfferPriceDisplay from '../components/OfferPriceDisplay';
import { useVerificationGate } from '../context/VerificationGateContext';
import { queryClient, queryKeys } from '../lib/queryClient';
import { CART_VERIFICATION } from '../utils/verificationGateConfig';
import { resolveOfferImage, resolveStoreLogo, storeLogoPlaceholder } from '../utils/mediaUrl';

const badge = (offer) => {
  switch (offer?.offerType) {
    case 'discount': return offer.value ? `خصم ${offer.value}%` : 'خصم';
    case 'fixed_price': return offer.value != null ? `${offer.value} ₪` : 'سعر خاص';
    case 'free_item': return 'مجاني';
    case 'bogo': return '1+1';
    default: return 'عرض';
  }
};

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  const { data: favoriteData } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: async () => {
      const { data } = await axios.get('/activity/favorites');
      return {
        favorites: data?.favorites || [],
        favoriteIds: (data?.favoriteIds || []).map(String),
      };
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    let mounted = true;
    const fetchOffer = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await axios.get(`/offers/${id}`);
        if (!mounted) return;
        setOffer(data.offer);
        recordOfferView(data.offer?._id);
        logActivity('open_offer', {
          targetType: 'Offer',
          targetId: data.offer?._id,
          meta: {
            category: data.offer?.store?.category,
            region: data.offer?.store?.region,
          },
        });
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || 'تعذّر تحميل العرض');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchOffer();
    return () => { mounted = false; };
  }, [id]);

  // معرفة حالة المفضّلة الحالية من cache React Query
  useEffect(() => {
    if (favoriteData) {
      setFavorited((favoriteData?.favoriteIds || []).map(String).includes(String(id)));
    }
  }, [favoriteData, id]);

  const handleFavorite = async () => {
    if (favBusy) return;
    setFavBusy(true);
    setFavorited((v) => !v);
    try {
      await toggleFavorite(id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
    } catch {
      setFavorited((v) => !v);
    } finally {
      setFavBusy(false);
    }
  };

  const performAdd = async () => {
    setAdding(true);
    try {
      await axios.post('/cart/add', { itemId: offer._id, itemType: 'offer', quantity: 1 });
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      if (handleApiVerificationError(err, performAdd, CART_VERIFICATION)) return;
      alert(err.response?.data?.message || 'تعذّر إضافة العرض للسلة');
    } finally {
      setAdding(false);
    }
  };

  const addToCart = () => {
    if (adding || added) return;
    runWithVerification(performAdd, CART_VERIFICATION);
  };

  // فتح المحادثة مع صاحب المتجر — العرض كرسالة مرجعية (context banner).
  const contactStore = () => {
    const owner = offer?.store?.owner;
    const ownerId = owner?._id || owner;
    if (!ownerId) {
      alert('معلومات المتجر غير متوفّرة للتواصل');
      return;
    }
    localStorage.setItem('chatContext', JSON.stringify({
      recipientId: ownerId,
      context: {
        itemId: offer._id,
        itemType: 'Offer',
        itemName: offer.title,
        itemImage: resolveOfferImage(offer) || '',
        itemUrl: `/offer/${offer._id}`,
      },
    }));
    navigate('/chat');
  };

  if (loading) {
    return <div className="p-10 text-center font-black text-gray-500">جاري تحميل التفاصيل...</div>;
  }
  if (error || !offer) {
    return <div className="p-10 text-center font-black text-red-500">{error || 'العرض غير موجود'}</div>;
  }

  const offerImageSrc = resolveOfferImage(offer);
  const storeLogoSrc = resolveStoreLogo(offer?.store) || storeLogoPlaceholder(offer?.store);

  return (
    <div className="space-y-6 pb-24 text-right" dir="rtl">
      {/* رأس الصفحة مع صورة العرض */}
      <div className="relative h-72 w-full bg-gray-100">
        {offerImageSrc ? (
          <img src={offerImageSrc} className="w-full h-full object-cover rounded-b-[40px]" alt={offer.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 rounded-b-[40px]">
            <ImageOff size={48} />
          </div>
        )}
        <div className="absolute top-4 inset-x-4 flex justify-between">
          <button onClick={() => navigate(-1)} className="bg-white/30 backdrop-blur-md p-2 rounded-xl text-white">
            <ChevronRight size={24} />
          </button>
          <div className="flex items-center gap-2 self-start">
            <button
              onClick={handleFavorite}
              aria-label="إضافة للمفضّلة"
              className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                favorited ? 'bg-red-500 text-white' : 'bg-white/30 text-white'
              }`}
            >
              <Heart size={20} fill={favorited ? 'currentColor' : 'none'} />
            </button>
            <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-black">
              {badge(offer)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <h1 className="text-2xl font-black text-gray-900 leading-tight">{offer.title}</h1>

        <OfferPriceDisplay offer={offer} className="text-gray-900" />

        <StarRating
          targetType="offer"
          targetId={offer._id}
          ratingAvg={offer.ratingAvg}
          ratingCount={offer.ratingCount}
        />

        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400">
          {offer.expiresAt && (
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-primary" /> ينتهي في {new Date(offer.expiresAt).toLocaleDateString('ar')}
            </div>
          )}
          {offer.store?.region && (
            <div className="flex items-center gap-1">
              <MapPin size={14} className="text-primary" /> {offer.store.region}{offer.store.subRegion ? ` - ${offer.store.subRegion}` : ''}
            </div>
          )}
          <div className="flex items-center gap-1"><Tag size={14} className="text-primary" /> {badge(offer)}</div>
        </div>

        {offer.description && (
          <p className="text-sm text-gray-600 leading-relaxed font-medium bg-white p-4 rounded-2xl border border-gray-100">
            {offer.description}
          </p>
        )}

        {/* كرت المتجر */}
        <div className="space-y-3 pt-2">
          <h3 className="font-black text-gray-800 text-lg">المتجر المقدّم للعرض</h3>
          <div
            onClick={() => offer.store?._id && navigate(`/store/${offer.store._id}`)}
            className="bg-white p-4 rounded-[30px] border border-gray-100 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <img
                src={storeLogoSrc}
                className="w-14 h-14 rounded-2xl bg-gray-50 object-cover"
                alt=""
              />
              <div>
                <h4 className="font-black text-gray-900">{offer.store?.name || 'متجر'}</h4>
                <p className="text-[10px] text-gray-400 font-bold">{offer.store?.category || ''}</p>
                {offer.store?.isVerifiedStore && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 mt-1">
                    ✔ متجر موثق
                  </span>
                )}
                {offer.store?._id && (
                  <StarRating
                    targetType="store"
                    targetId={offer.store._id}
                    ratingAvg={offer.store.ratingAvg}
                    ratingCount={offer.store.ratingCount}
                    compact
                    className="mt-1"
                  />
                )}
              </div>
            </div>
            <div className="bg-primary/10 p-2 rounded-xl text-primary"><StoreIcon size={20} /></div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={addToCart}
            disabled={adding}
            className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {adding ? <Loader2 size={20} className="animate-spin" /> : added ? <Check size={20} /> : <ShoppingCart size={20} />}
            {added ? 'تمت الإضافة للسلة' : 'إضافة للسلة'}
          </button>
          <button
            onClick={contactStore}
            className="flex-1 bg-white border-2 border-gray-100 text-gray-700 py-4 rounded-2xl flex items-center justify-center gap-2 font-black"
          >
            <MessageCircle size={22} />
            تواصل
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferDetail;
