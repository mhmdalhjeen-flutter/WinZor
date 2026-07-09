import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X, Heart, MessageCircle, ArrowUpRight, Eye,
  ImageOff, ChevronUp, ShoppingBag,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { logActivity } from '../../utils/activity';
import { recordOfferView, recordOfferShare } from '../../utils/offerAnalytics';
import { getOfferBadge } from '../OfferCard';
import OfferPriceDisplay from '../OfferPriceDisplay';
import VerifiedBadge from './VerifiedBadge';
import SwipeTutorial from './SwipeTutorial';
import DirectOrderModal from './DirectOrderModal';

function OfferSlideImage({ src, alt, isActive }) {
  if (!src) {
    return (
      <div className="offer-reel-slide__placeholder">
        <ImageOff size={48} />
      </div>
    );
  }

  return (
    <>
      <img
        src={src}
        alt=""
        aria-hidden
        className="offer-reel-slide__bg-blur"
        loading={isActive ? 'eager' : 'lazy'}
        decoding="async"
      />
      <div className="offer-reel-slide__bg-darken" aria-hidden />
      <img
        src={src}
        alt={alt}
        className="offer-reel-slide__image"
        loading={isActive ? 'eager' : 'lazy'}
        decoding="async"
      />
    </>
  );
}

function formatCount(n) {
  const v = Number(n) || 0;
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
}

function OfferSlide({
  offer,
  isActive,
  onShare,
  onChat,
  viewCount,
}) {
  const [orderOpen, setOrderOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);

  const store = offer?.store;
  const displayViews = viewCount ?? offer?.views ?? 0;

  const handleLike = () => {
    setLiked((v) => !v);
    logActivity('like_offer', {
      targetType: 'Offer',
      targetId: offer._id,
    });
  };

  const handleChat = async () => {
    if (chatBusy) return;
    setChatBusy(true);
    try {
      await onChat?.(offer);
    } finally {
      setChatBusy(false);
    }
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
      await onShare?.(offer._id);
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
        <OfferSlideImage src={offer.image} alt={offer.title} isActive={isActive} />
      </div>

      <header className="offer-reel-slide__top-store">
        <div className="offer-reel-slide__top-store-row">
          {store?.logo && (
            <img src={store.logo} alt="" className="offer-reel-slide__store-logo" />
          )}
          <div className="offer-reel-slide__store-text">
            <p className="offer-reel-slide__store-name">{store?.name || 'متجر'}</p>
            {store?.isVerifiedStore && <VerifiedBadge className="mt-0.5" />}
          </div>
        </div>
        <h2 className="offer-reel-slide__offer-title">{offer.title}</h2>
      </header>

      <div className="offer-reel-slide__content">
        <div className="offer-reel-slide__meta">
          <span className="offer-reel-slide__discount-badge">{getOfferBadge(offer)}</span>
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

        <button
          type="button"
          onClick={() => setOrderOpen(true)}
          className="offer-reel-slide__order-btn"
        >
          <ShoppingBag size={18} />
          <span>اطلب الآن</span>
        </button>
      </div>

      <aside className="offer-reel-actions" aria-label="إجراءات العرض">
        <ActionBtn
          icon={Heart}
          label="إعجاب"
          active={liked}
          onClick={handleLike}
          fill={liked}
        />
        <ActionBtn icon={MessageCircle} label="محادثة" onClick={handleChat} busy={chatBusy} />
        <ActionBtn icon={ArrowUpRight} label="مشاركة" onClick={handleShare} busy={shareBusy} />
        <div className="offer-reel-actions__stat" aria-label={`${displayViews} مشاهدة`}>
          <span className="offer-reel-actions__icon-wrap">
            <Eye size={24} />
          </span>
          <span>{formatCount(displayViews)}</span>
        </div>
      </aside>

      <DirectOrderModal
        offer={offer}
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
      />
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
      <span className="offer-reel-actions__icon-wrap">
        <Icon size={24} fill={fill ? 'currentColor' : 'none'} />
      </span>
      <span>{label}</span>
    </button>
  );
}

function CategoryTransitionOverlay({ message, visible }) {
  if (!visible || !message) return null;
  return (
    <div className="offer-reel-category-transition" role="status" aria-live="polite">
      <div className="offer-reel-category-transition__pill">{message}</div>
    </div>
  );
}

export default function OfferReelViewer({
  offers = [],
  boundaries = [],
  initialIndex = 0,
  multiCategory = false,
  onClose,
  favoriteIds: _favoriteIds,
  onToggleFavorite: _onToggleFavorite,
}) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [viewCounts, setViewCounts] = useState({});
  const [showTutorial, setShowTutorial] = useState(true);
  const [categoryTransition, setCategoryTransition] = useState(null);
  const viewedRef = useRef(new Set());
  const prevIndexRef = useRef(initialIndex);
  const historyPushedRef = useRef(false);
  const closingRef = useRef(false);

  const preloadRange = useCallback((index) => {
    [index - 1, index, index + 1]
      .filter((i) => i >= 0 && i < offers.length)
      .forEach((i) => {
        const img = offers[i]?.image;
        if (img) {
          const el = new Image();
          el.src = img;
        }
      });
  }, [offers]);

  const closeViewer = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    document.body.classList.remove('offer-viewer-open');
    onClose?.();
  }, [onClose]);

  const resolveOwnerAndOpenChat = useCallback(async (offer) => {
    let ownerId = offer?.store?.owner?._id || offer?.store?.owner;

    if (!ownerId) {
      const { data } = await api.get(`/offers/${offer._id}`);
      ownerId = data?.offer?.store?.owner?._id || data?.offer?.store?.owner;
    }

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

    closeViewer();
    navigate('/chat');
  }, [navigate, closeViewer]);

  const handleCloseClick = useCallback(() => {
    if (historyPushedRef.current) {
      window.history.back();
    } else {
      closeViewer();
    }
  }, [closeViewer]);

  useEffect(() => {
    document.body.classList.add('offer-viewer-open');
    window.history.pushState({ offerViewer: true }, '');
    historyPushedRef.current = true;

    const onPopState = () => {
      historyPushedRef.current = false;
      closeViewer();
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      document.body.classList.remove('offer-viewer-open');
    };
  }, [closeViewer]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !offers.length) return;

    const slide = el.querySelector(`[data-offer-id="${offers[initialIndex]?._id}"]`);
    if (slide) {
      el.scrollTop = slide.offsetTop;
    }
    preloadRange(initialIndex);
  }, [initialIndex, offers, preloadRange]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const slides = el.querySelectorAll('.offer-reel-slide');
      const scrollTop = el.scrollTop;
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
    if (!multiCategory || offers.length < 2) return;

    const prev = prevIndexRef.current;
    if (prev === activeIndex) return;

    const prevOffer = offers[prev];
    const currOffer = offers[activeIndex];
    const prevCat = prevOffer?.__categoryId ?? prevOffer?.__categoryName;
    const currCat = currOffer?.__categoryId ?? currOffer?.__categoryName;

    if (prevCat && currCat && prevCat !== currCat && activeIndex > prev) {
      const name = currOffer?.__categoryName || 'القسم التالي';
      setCategoryTransition(`الانتقال إلى قسم ${name}`);
      const timer = setTimeout(() => setCategoryTransition(null), 2200);
      prevIndexRef.current = activeIndex;
      return () => clearTimeout(timer);
    }

    prevIndexRef.current = activeIndex;
  }, [activeIndex, offers, multiCategory]);

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

  const handleShare = (offerId) => recordOfferShare(offerId);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="offer-reel-viewer" role="dialog" aria-modal="true" aria-label="عارض العروض">
      <button
        type="button"
        onClick={handleCloseClick}
        className="offer-reel-viewer__close"
        aria-label="إغلاق"
      >
        <X size={24} />
      </button>

      {showTutorial && <SwipeTutorial onComplete={() => setShowTutorial(false)} />}

      <CategoryTransitionOverlay message={categoryTransition} visible={!!categoryTransition} />

      <div ref={containerRef} className="offer-reel-viewer__scroll">
        {offers.map((offer, i) => (
          <OfferSlide
            key={offer._id}
            offer={offer}
            isActive={i === activeIndex}
            onShare={handleShare}
            onChat={resolveOwnerAndOpenChat}
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
