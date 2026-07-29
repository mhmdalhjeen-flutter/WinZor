import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight, Heart, MessageCircle, Phone, Loader2, Truck,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../context/AuthGateContext';
import { AUTH_GATE_MESSAGES } from '../utils/authGateMessages';
import { useToast } from '../shared/Toast';
import ErrorState from '../shared/ErrorState';
import { CONDITION_LABELS, TYPE_LABELS, regionLabel } from '../shared/BazaarListingCard';
import { getCategoryLabel } from '../utils/bazaarCategories';
import { formatListingPrice } from '../utils/currency';
import HorizontalSwipe from '../components/ui/HorizontalSwipe';
import PhoneDisplay from '../components/PhoneDisplay';
import { getPhoneCarrier } from '../utils/phoneValidation';
import { queryClient, queryKeys } from '../lib/queryClient';
import { resolveImageUrl, cloudinarySrcSet } from '../utils/mediaUrl';
import { recordRecentlyViewed } from '../utils/recentlyViewed';

const BazaarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuth, user } = useAuth();
  const { runWithAuth } = useAuthGate();
  const { toast } = useToast();
  const [activeImage, setActiveImage] = React.useState(0);
  const [favLoading, setFavLoading] = React.useState(false);

  const {
    data: listing,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: queryKeys.bazaarDetail(id),
    queryFn: async () => {
      const { data } = await api.get(`/bazaar/${id}`);
      return data.listing;
    },
    staleTime: 60 * 1000,
  });

  React.useEffect(() => {
    if (listing?.mainImageIndex != null) {
      setActiveImage(listing.mainImageIndex);
    }
  }, [listing?._id, listing?.mainImageIndex]);

  React.useEffect(() => {
    if (!listing?._id) return;
    const thumb = listing.mainImage || listing.images?.[0] || '';
    recordRecentlyViewed({
      type: 'bazaar',
      id: listing._id,
      title: listing.title,
      image: thumb,
      price: formatListingPrice(listing),
    });
  }, [listing?._id, listing?.title, listing?.mainImage, listing?.images]);

  const error = queryError?.response?.data?.message || (queryError ? 'تعذّر التحميل' : '');

  const toggleFavorite = async () => {
    runWithAuth(async () => {
      setFavLoading(true);
      try {
        const { data } = await api.post(`/bazaar/${id}/favorite`);
        queryClient.setQueryData(queryKeys.bazaarDetail(id), (prev) => (
          prev ? { ...prev, isFavorited: data.favorited } : prev
        ));
        toast(data.message, 'success');
      } catch (err) {
        toast(err.response?.data?.message || 'تعذّر التحديث', 'error');
      } finally {
        setFavLoading(false);
      }
    }, AUTH_GATE_MESSAGES.favorites);
  };

  const contact = () => {
    runWithAuth(() => {
      const sellerId = listing?.seller?._id || listing?.seller;
      if (!sellerId) {
        toast('لا يمكن التواصل', 'error');
        return;
      }
      if (String(sellerId) === String(user?._id || user?.id)) {
        toast('هذا إعلانك', 'error');
        return;
      }
    const img = listing.images?.[listing.mainImageIndex || 0] || listing.images?.[0];
    localStorage.setItem('chatContext', JSON.stringify({
      recipientId: sellerId,
      context: {
        itemId: listing._id,
        itemType: 'BazaarListing',
        itemName: listing.title,
        itemImage: img ? resolveImageUrl(img, { width: 300 }) : img,
        itemUrl: `/marketplace/${listing._id}`,
      },
    }));
    navigate('/chat');
    }, AUTH_GATE_MESSAGES.contact);
  };

  if (isLoading) return null;
  if (error || !listing) return <ErrorState message={error || 'الإعلان غير موجود'} onRetry={() => navigate('/marketplace')} />;

  const images = listing.images?.length ? listing.images : [];

  return (
    <div className="pb-24 space-y-5 text-right" dir="rtl">
      <button
        type="button"
        onClick={() => navigate('/marketplace')}
        className="flex items-center gap-1 text-gray-500 font-bold text-sm"
      >
        <ChevronRight size={18} /> اعرض غراضك
      </button>

      {/* Gallery */}
      <div className="bg-white rounded-[28px] overflow-hidden border border-gray-100 shadow-sm">
        <div className="aspect-square sm:aspect-video bg-gray-100">
          {images[activeImage] ? (
            <img
              src={resolveImageUrl(images[activeImage], { width: 800 })}
              srcSet={cloudinarySrcSet(images[activeImage], [600, 800])}
              sizes="(max-width: 640px) 100vw, 800px"
              alt={listing.title}
              className="w-full h-full object-contain bg-gray-50"
            />
          ) : listing.transactionType === 'custom' ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
              <span className="text-2xl font-black text-orange-500">مطلوب</span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">بدون صورة</div>
          )}
        </div>
        {images.length > 1 && (
          <HorizontalSwipe spaceBetween={8} className="p-3">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(idx)}
                className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 ${
                  activeImage === idx ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img
                  src={resolveImageUrl(img, { width: 300 })}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </HorizontalSwipe>
        )}
      </div>

      <div className="bg-white rounded-[28px] p-5 border border-gray-100 space-y-4">
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-1">اعرض غراضك</p>
            <h1 className="text-xl font-black text-gray-900">{listing.title}</h1>
          </div>
          <span className="text-lg font-black text-primary shrink-0">{formatListingPrice(listing)}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'الحالة', value: listing.condition ? CONDITION_LABELS[listing.condition] : '—', hide: listing.transactionType === 'custom' },
            { label: 'النوع', value: TYPE_LABELS[listing.transactionType] },
            { label: 'الفئة', value: listing.category ? getCategoryLabel(listing.category) : '—', hide: !listing.category },
            { label: 'المنطقة', value: regionLabel(listing) },
            { label: 'التوصيل', value: listing.freeDelivery ? 'مجاني' : 'غير متاح', hide: listing.transactionType === 'custom' },
          ].filter((item) => !item.hide).map((item) => (
            <div key={item.label} className="bg-gray-50 p-3 rounded-2xl text-center">
              <span className="text-[10px] font-black text-gray-400 block">{item.label}</span>
              <span className="text-xs font-black text-gray-800">{item.value}</span>
            </div>
          ))}
        </div>

        {listing.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {listing.keywords.map((kw) => (
              <span key={kw} className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">{kw}</span>
            ))}
          </div>
        )}

        {listing.description && (
          <div>
            <h4 className="font-black text-gray-900 mb-1">الوصف</h4>
            <p className="text-sm text-gray-600 leading-relaxed font-bold">{listing.description}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={contact}
            className="flex-1 bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} /> تواصل
          </button>
          {listing.contactPhone && (
          <a
            href={`tel:${listing.contactPhone}`}
            className={`flex-1 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 ${
              getPhoneCarrier(listing.contactPhone) === 'wataniya'
                ? 'bg-red-500'
                : 'bg-green-500'
            }`}
          >
            <Phone size={20} />
            <PhoneDisplay phone={listing.contactPhone} showBadge={false} inheritColor className="text-white" />
          </a>
          )}
          {isAuth && (
            <button
              type="button"
              disabled={favLoading}
              onClick={toggleFavorite}
              className={`py-4 px-5 rounded-2xl font-black flex items-center justify-center gap-2 border ${
                listing.isFavorited ? 'border-red-300 bg-red-50 text-red-500' : 'border-gray-200 text-gray-600'
              }`}
            >
              {favLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <Heart size={20} fill={listing.isFavorited ? 'currentColor' : 'none'} />
              )}
              مفضلة
            </button>
          )}
        </div>

        {listing.freeDelivery && (
          <p className="text-xs font-bold text-green-600 flex items-center gap-1 justify-center">
            <Truck size={14} /> التوصيل مجاني
          </p>
        )}
      </div>
    </div>
  );
};

export default BazaarDetail;
