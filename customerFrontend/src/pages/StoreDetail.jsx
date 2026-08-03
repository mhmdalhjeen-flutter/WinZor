import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight, MapPin, Phone, MessageCircle, Bell,
  Search, X, ArrowDown, ArrowUp,
} from 'lucide-react';
import api from '../api/axios';
import { logActivity } from '../utils/activity';
import StarRating from '../components/StarRating';
import VerifiedBadge from '../components/marketplace/VerifiedBadge';
import StoreCatalogCard from '../components/store/StoreCatalogCard';
import LightLoadingHint from '../shared/LightLoadingHint';
import ErrorState from '../shared/ErrorState';
import { useToast } from '../shared/Toast';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../context/AuthGateContext';
import { AUTH_GATE_MESSAGES } from '../utils/authGateMessages';
import { resolveStoreCover, resolveStoreLogo, storeLogoPlaceholder, resolveOfferImage, resolveProductImage, cloudinarySrcSet } from '../utils/mediaUrl';
import { clearStoreNotifyOptOut, isStoreNotifyOptedOut } from '../utils/giftActivationFlow';
import { queryKeys } from '../lib/queryClient';
import { recordVisitedStore } from '../utils/visitedStores';
import { warmStoreDetailImages } from '../utils/cacheImages';
import { formatPriceWithUnit } from '../utils/currency';
import { getOfferPricing } from '../components/OfferPriceDisplay';
import '../styles/storeDetail.css';

/** Match item by store-specific category id */
function matchesItemCategory(item, categoryId) {
  if (categoryId === 'all') return true;
  const catId = item.storeItemCategory?._id || item.storeItemCategory;
  return catId && String(catId) === String(categoryId);
}

function matchesSearch(text, query) {
  if (!query.trim()) return true;
  return (text || '').toLowerCase().includes(query.trim().toLowerCase());
}

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuth, user } = useAuth();
  const { runWithAuth } = useAuthGate();

  const [joining, setJoining] = useState(false);
  const [enablingNotify, setEnablingNotify] = useState(false);
  const [notifyOptOut, setNotifyOptOut] = useState(() => isStoreNotifyOptedOut(id));
  const [loggedVisit, setLoggedVisit] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOffersJump, setShowOffersJump] = useState(false);

  const offersSectionRef = useRef(null);
  const productsSectionRef = useRef(null);
  const searchInputRef = useRef(null);

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
    setNotifyOptOut(isStoreNotifyOptedOut(id));
    setLoggedVisit(false);
    setActiveCategory('all');
    setSearchQuery('');
    setSearchOpen(false);
  }, [id]);

  useEffect(() => {
    if (!searchOpen) return undefined;
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [searchOpen]);

  useEffect(() => {
    const el = productsSectionRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setShowOffersJump(entry.isIntersecting),
      { root: null, rootMargin: '-80px 0px -40% 0px', threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [data?.store]);

  const scrollToSection = useCallback((ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

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

  const openWhatsApp = () => {
    const phone = data?.store?.whatsapp || data?.store?.phone;
    if (!phone) {
      toast('رقم الواتساب غير متاح', 'error');
      return;
    }
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
  };

  const filteredOffers = useMemo(() => {
    const list = data?.offers || [];
    return list.filter(
      (o) => matchesItemCategory(o, activeCategory) && matchesSearch(o.title, searchQuery),
    );
  }, [data?.offers, activeCategory, searchQuery]);

  const filteredProducts = useMemo(() => {
    const list = data?.products || [];
    return list.filter(
      (p) => matchesItemCategory(p, activeCategory) && matchesSearch(p.name, searchQuery),
    );
  }, [data?.products, activeCategory, searchQuery]);

  const categoryChips = useMemo(() => {
    const fromApi = (data?.itemCategories || []).map((c) => ({
      id: c._id,
      label: c.name,
    }));
    return [{ id: 'all', label: 'الكل' }, ...fromApi];
  }, [data?.itemCategories]);

  if (isLoading && !data) return <LightLoadingHint label="جاري تحميل المتجر..." />;

  const error = queryError?.response?.data?.message || (queryError && !data ? 'تعذّر التحميل' : '');
  if (error && !data?.store) return <ErrorState message={error || 'المتجر غير موجود'} onRetry={() => refetch()} />;
  if (!data?.store) return <ErrorState message="المتجر غير موجود" />;

  const { store, membershipStatus } = data;
  const coverSrc = resolveStoreCover(store, { width: 800 });
  const logoSrc = resolveStoreLogo(store, { width: 160 }) || storeLogoPlaceholder(store);
  const isMember = membershipStatus === 'member';
  const isPending = membershipStatus === 'pending';
  const isOwner = isAuth && user && String(store.owner?._id || store.owner) === String(user._id || user.id);
  const locationLabel = [store.region, store.subRegion].filter(Boolean).join(' · ');

  return (
    <div className="store-detail-page" dir="rtl">
      <div className="store-detail-page__inner">
        {isFetching && data && (
          <p className="store-detail-fetching">جاري التحديث...</p>
        )}

        {/* Unified store profile card */}
        <article className="store-profile-card">
          <div className="store-profile-card__cover">
            {coverSrc && <img src={coverSrc} alt="" />}
            <div className="store-profile-card__cover-overlay" aria-hidden />
            <button
              type="button"
              className="store-profile-card__back"
              onClick={() => navigate(-1)}
              aria-label="رجوع"
            >
              <ChevronRight size={22} strokeWidth={2.2} />
            </button>
          </div>

          <div className="store-profile-card__body">
            <div className="store-profile-card__logo-wrap">
              <img src={logoSrc} alt="" className="store-profile-card__logo" />
              {isMember && (
                <span className="store-profile-card__member-badge">عضو ✓</span>
              )}
            </div>

            <h1 className="store-profile-card__name">{store.name}</h1>
            {store.isVerifiedStore && <VerifiedBadge className="mb-1" />}
            {locationLabel && (
              <p className="store-profile-card__location">
                <MapPin size={14} strokeWidth={2.2} />
                {locationLabel}
              </p>
            )}
            <StarRating
              targetType="store"
              targetId={store._id}
              ratingAvg={store.ratingAvg}
              ratingCount={store.ratingCount}
              compact
              className="store-profile-card__rating"
            />
            {store.description && (
              <p className="store-profile-card__desc">{store.description}</p>
            )}

            <div className="store-profile-card__actions">
              {!isMember && (
                <button
                  type="button"
                  onClick={joinStore}
                  disabled={joining}
                  className={`store-profile-card__join${isPending ? ' store-profile-card__join--pending' : ''}`}
                >
                  {joining ? '...' : isPending ? 'قيد الانتظار — أدخل كوداً' : 'انضم للمتجر'}
                </button>
              )}

              {isMember && notifyOptOut && (
                <button
                  type="button"
                  onClick={enableStoreNotifications}
                  disabled={enablingNotify}
                  className="store-profile-card__notify"
                >
                  {enablingNotify ? '...' : (
                    <>
                      <Bell size={16} />
                      متابعة الإشعارات
                    </>
                  )}
                </button>
              )}

              <div className="store-profile-card__contacts">
                <button type="button" className="store-profile-card__contact-btn" onClick={contact} title="محادثة" aria-label="محادثة">
                  <MessageCircle size={20} strokeWidth={2} />
                </button>
                {store.phone && (
                  <a href={`tel:${store.phone}`} className="store-profile-card__contact-btn" title="اتصال" aria-label="اتصال">
                    <Phone size={20} strokeWidth={2} />
                  </a>
                )}
                {(store.whatsapp || store.phone) && (
                  <button
                    type="button"
                    className="store-profile-card__contact-btn store-profile-card__contact-btn--wa"
                    onClick={openWhatsApp}
                    title="واتساب"
                    aria-label="واتساب"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </button>
                )}
                {isOwner && (
                  <button
                    type="button"
                    className="store-profile-card__contact-btn"
                    onClick={() => navigate('/center')}
                    title="إعدادات المتجر"
                    aria-label="إعدادات المتجر"
                  >
                    ✎
                  </button>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Expandable search */}
        <div className="store-detail-search">
          {searchOpen ? (
            <div className="store-detail-search__bar">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="search"
                className="store-detail-search__input"
                placeholder="ابحث في العروض والعناصر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className="store-detail-search__close"
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                aria-label="إغلاق البحث"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="store-detail-search__toggle"
              onClick={() => setSearchOpen(true)}
              aria-label="بحث"
            >
              <Search size={20} strokeWidth={2.2} />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="store-category-chips" aria-label="تصنيفات العناصر">
          <div className="store-category-chips__track">
            {categoryChips.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`store-category-chip${activeCategory === cat.id ? ' is-active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Offers section */}
        <section className="store-detail-section" ref={offersSectionRef} id="store-offers">
          <div className="store-detail-section__head">
            <h2 className="store-detail-section__title">عروض المتجر</h2>
          </div>
          <div className="store-detail-grid store-detail-grid--offers">
            {filteredOffers.length === 0 ? (
              <p className="store-detail-empty">لا عروض حالياً</p>
            ) : (
              filteredOffers.map((offer) => {
                const pricing = getOfferPricing(offer);
                const priceLabel = pricing?.displayNew
                  || (pricing?.finalPrice != null
                    ? formatPriceWithUnit(pricing.finalPrice, pricing.currency || offer.currency, pricing.priceUnit)
                    : pricing?.badge || null);
                const imageSrc = resolveOfferImage(offer, { width: 400 });
                return (
                  <StoreCatalogCard
                    key={offer._id}
                    item={offer}
                    itemType="offer"
                    title={offer.title}
                    priceLabel={priceLabel}
                    imageSrc={imageSrc}
                    imageSrcSet={cloudinarySrcSet(offer?.image, [400, 800])}
                    detailPath={`/offer/${offer._id}`}
                    unavailable={offer.isActive === false}
                  />
                );
              })
            )}
          </div>
        </section>

        {/* Jump to products */}
        <div className="store-detail-section__head">
          <span />
          <button
            type="button"
            className="store-detail-jump"
            onClick={() => scrollToSection(productsSectionRef)}
          >
            العناصر
            <ArrowDown size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Products section */}
        <section className="store-detail-section" ref={productsSectionRef} id="store-products">
          <div className="store-detail-section__head">
            <h2 className="store-detail-section__title">عناصر المتجر</h2>
          </div>
          <div className="store-detail-grid">
            {filteredProducts.length === 0 ? (
              <p className="store-detail-empty">لا عناصر في هذا التصنيف</p>
            ) : (
              filteredProducts.map((product) => {
                const imageSrc = resolveProductImage(product, { width: 400 });
                return (
                  <StoreCatalogCard
                    key={product._id}
                    item={product}
                    itemType="product"
                    title={product.name}
                    priceLabel={formatPriceWithUnit(product.price, product.currency, product.priceUnit)}
                    imageSrc={imageSrc}
                    imageSrcSet={cloudinarySrcSet(product?.image, [400, 800])}
                    detailPath={`/product/${product._id}`}
                    unavailable={product.isActive === false}
                  />
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Floating jump back to offers */}
      {showOffersJump && (
        <button
          type="button"
          className="store-detail-jump store-detail-jump--floating"
          onClick={() => scrollToSection(offersSectionRef)}
        >
          العروض
          <ArrowUp size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default StoreDetail;
