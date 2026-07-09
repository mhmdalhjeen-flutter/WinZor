import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X, Heart, Bookmark, MessageCircle, Share2, Eye, ShoppingCart,
  Check, Loader2, ImageOff, ChevronUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { logActivity, toggleFavorite } from '../../utils/activity';
import { recordOfferView, recordOfferShare } from '../../utils/offerAnalytics';
import { useVerificationGate } from '../../context/VerificationGateContext';
import { queryClient, queryKeys } from '../../lib/queryClient';
import { CART_VERIFICATION } from '../../utils/verificationGateConfig';
import { getOfferBadge } from '../OfferCard';
import OfferPriceDisplay from '../OfferPriceDisplay';
import VerifiedBadge from './VerifiedBadge';
import SwipeTutorial from './SwipeTutorial';

function OfferSlide({
  offer,
  isActive,
  favorited,
  onToggleFavorite,
  onShare,
  viewCount,
}) {
  const navigate = useNavigate();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);

  const store = offer?.store;
  const displayViews = viewCount ?? offer?.views ?? 0;

  const handleFav = async () => {
    if (favBusy) return;
    setFavBusy(true);
    try {
      await onToggleFavorite?.(offer);
    } finally {
      setFavBusy(false);
    }
  };

  const performAdd = async () => {
    setAdding(true);
    try {
      await api.post('/cart/add', { itemId: offer._id, itemType: 'offer', quantity: 1 });
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      handleApiVerificationError(err, performAdd, CART_VERIFICATION);
    } finally {
      setAdding(false);
    }
  };

  const handleBuy = () => {
    if (adding || added) return;
    runWithVerification(performAdd, CART_VERIFICATION);
  };

  const handleChat = () => {
    const ownerId = store?.owner?._id || store?.owner;
    if (!ownerId) return;
    localStorage.setItem('chatContext', JSON.stringify({
      recipientId: ownerId,
      context: {
        itemId: offer._id,
        itemType: 'Offer',
        itemName: offer.title,
        itemImage: offer.image || '',
        itemUrl: `/offer/${offer._id}`,
      },
    }));
    navigate('/chat');
  };

  const handleShare = async () => {
    if (shareBusy) return;
    setShareBusy(true);
    const url = `${window.location.origin}/offer/${offer._id}`;
    const text = `${offer.title} — ${store?.name || 'عرض مميز'}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: offer.title, text, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      const result = await onShare?.(offer._id);
      if (result?.shareCount != null) {
        /* parent updates count */
      }
    } catch {
      /* user cancelled share */
    } finally {
      setShareBusy(false);
    }
  };

  return (
    <section
      className="offer-reel-slide"
      data-offer-id={offer._id}
      aria-hidden={!isActive}
    >
      <div className="offer-reel-slide__media">
        {offer.image ? (
          <img
            src={offer.image}
            alt={offer.title}
            className="offer-reel-slide__image"
            loading={isActive ? 'eager' : 'lazy'}
            decoding="async"
          />
        ) : (
          <div className="offer-reel-slide__placeholder">
            <ImageOff size={48} />
          </div>
        )}
        <div className="offer-reel-slide__gradient" aria-hidden />
      </div>

      <div className="offer-reel-slide__content">
        <div className="offer-reel-slide__meta">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {store?.logo && (
              <img src={store.logo} alt="" className="offer-reel-slide__store-logo" />
            )}
            <div>
              <p className="offer-reel-slide__store-name">{store?.name || 'متجر'}</p>
              {store?.isVerifiedStore && <VerifiedBadge className="mt-1" />}
            </div>
          </div>
          <span className="offer-reel-slide__discount-badge">{getOfferBadge(offer)}</span>
          <h2 className="offer-reel-slide__title">{offer.title}</h2>
          <OfferPriceDisplay
            offer={offer}
            oldClassName="offer-reel-slide__old-price"
            newClassName="offer-reel-slide__new-price"
            badgeClassName="hidden"
          />
          {offer.description && (
            <p className="offer-reel-slide__desc">{offer.description}</p>
          )}
        </div>
      </div>

      <aside className="offer-reel-actions" aria-label="إجراءات العرض">
        <ActionBtn
          icon={Heart}
          label="إعجاب"
          active={favorited}
          onClick={handleFav}
          fill={favorited}
        />
        <ActionBtn
          icon={Bookmark}
          label="حفظ"
          active={favorited}
          onClick={handleFav}
          fill={favorited}
        />
        <ActionBtn icon={MessageCircle} label="محادثة" onClick={handleChat} />
        <ActionBtn icon={Share2} label="مشاركة" onClick={handleShare} busy={shareBusy} />
        <div className="offer-reel-actions__stat" aria-label={`${displayViews} مشاهدة`}>
          <Eye size={22} />
          <span>{formatCount(displayViews)}</span>
        </div>
        <button
          type="button"
          onClick={handleBuy}
          disabled={adding}
          className="offer-reel-actions__buy"
        >
          {adding ? (
            <Loader2 size={22} className="animate-spin" />
          ) : added ? (
            <Check size={22} />
          ) : (
            <ShoppingCart size={22} />
          )}
          <span>{added ? 'تم' : 'اشتري الآن'}</span>
        </button>
      </aside>
    </section>
  );
}

function ActionBtn({ icon: Icon, label, onClick, active, fill, busy }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`offer-reel-actions__btn ${active ? 'offer-reel-actions__btn--active' : ''}`}
      aria-label={label}
    >
      <Icon size={22} fill={fill ? 'currentColor' : 'none'} />
      <span>{label}</span>
    </button>
  );
}

function formatCount(n) {
  const v = Number(n) || 0;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
}

export default function OfferReelViewer({
  offers = [],
  initialIndex = 0,
  onClose,
  favoriteIds = new Set(),
  onToggleFavorite,
}) {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [viewCounts, setViewCounts] = useState({});
  const [showTutorial, setShowTutorial] = useState(true);
  const viewedRef = useRef(new Set());
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const preloadRange = useCallback((index) => {
    const indices = [index - 1, index, index + 1].filter(
      (i) => i >= 0 && i < offers.length
    );
    indices.forEach((i) => {
      const img = offers[i]?.image;
      if (img) {
        const el = new Image();
        el.src = img;
      }
    });
  }, [offers]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !offers.length) return;

    const scrollToIndex = (idx) => {
      const slide = el.querySelector(`[data-offer-id="${offers[idx]?._id}"]`);
      if (slide) {
        if (reducedMotion.current) {
          el.scrollTop = slide.offsetTop;
        } else {
          slide.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    scrollToIndex(initialIndex);
    preloadRange(initialIndex);
  }, [initialIndex, offers, preloadRange]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const slides = el.querySelectorAll('.offer-reel-slide');
      const scrollTop = el.scrollTop;
      const vh = el.clientHeight;
      let best = 0;
      let bestDist = Infinity;

      slides.forEach((slide, i) => {
        const dist = Math.abs(slide.offsetTop - scrollTop);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });

      if (best !== activeIndex) {
        setActiveIndex(best);
        preloadRange(best);
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [activeIndex, preloadRange]);

  useEffect(() => {
    const offer = offers[activeIndex];
    if (!offer) return;

    const id = String(offer._id);
    if (viewedRef.current.has(id)) return;

    const timer = setTimeout(async () => {
      const result = await recordOfferView(offer._id);
      viewedRef.current.add(id);
      if (result?.views != null) {
        setViewCounts((prev) => ({ ...prev, [id]: result.views }));
      }
      logActivity('open_offer', {
        targetType: 'Offer',
        targetId: offer._id,
        meta: {
          category: offer.store?.category,
          region: offer.store?.region,
        },
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeIndex, offers]);

  const handleShare = async (offerId) => {
    return recordOfferShare(offerId);
  };

  const handleToggleFav = async (offer) => {
    await onToggleFavorite?.(offer);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="offer-reel-viewer" role="dialog" aria-modal="true" aria-label="عارض العروض">
      <button
        type="button"
        onClick={onClose}
        className="offer-reel-viewer__close"
        aria-label="إغلاق"
      >
        <X size={24} />
      </button>

      {showTutorial && <SwipeTutorial onComplete={() => setShowTutorial(false)} />}

      <div
        ref={containerRef}
        className="offer-reel-viewer__scroll"
      >
        {offers.map((offer, i) => (
          <OfferSlide
            key={offer._id}
            offer={offer}
            isActive={i === activeIndex}
            favorited={favoriteIds.has(String(offer._id))}
            onToggleFavorite={handleToggleFav}
            onShare={handleShare}
            viewCount={viewCounts[String(offer._id)] ?? offer.views}
          />
        ))}
      </div>

      {offers.length > 1 && activeIndex < offers.length - 1 && !showTutorial && (
        <div className="offer-reel-viewer__hint" aria-hidden>
          <ChevronUp size={18} />
        </div>
      )}
    </div>
  );
}
