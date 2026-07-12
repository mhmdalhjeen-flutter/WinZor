import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X, Heart, MessageCircle, ArrowUpRight, Eye,
  ImageOff, ChevronUp, ShoppingBag, ShoppingCart,
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
import { useToast } from '../../shared/Toast';
import { useVerificationGate } from '../../context/VerificationGateContext';
import { queryClient, queryKeys } from '../../lib/queryClient';
import { CART_VERIFICATION } from '../../utils/verificationGateConfig';

const CATEGORY_TRANSITION_MS = 1000;

function isProductItem(item) {
  return item?.__itemType === 'product';
}

function getItemTitle(item) {
  return isProductItem(item) ? item.name : item.title;
}

function getItemImage(item) {
  return item?.image || null;
}

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

function ViewerTopbar({ item, onClose }) {
  const store = item?.store;

  return (
    <header className="offer-reel-viewer__topbar">
      <button
        type="button"
        onClick={onClose}
        className="offer-reel-viewer__close"
        aria-label="إغلاق"
      >
        <X size={24} />
      </button>
      <div className="offer-reel-viewer__topbar-info">
        <div className="offer-reel-viewer__topbar-row">
          {store?.logo && (
            <img src={store.logo} alt="" className="offer-reel-slide__store-logo" />
          )}
          <div className="offer-reel-slide__store-text">
            <p className="offer-reel-slide__store-name">{store?.name || 'متجر'}</p>
            {store?.isVerifiedStore && <VerifiedBadge className="mt-0.5" />}
          </div>
        </div>
        <h2 className="offer-reel-slide__offer-title">{getItemTitle(item)}</h2>
        {isProductItem(item) && (
          <span className="offer-reel-slide__product-badge">منتج</span>
        )}
      </div>
    </header>
  );
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
      data-reel-item-id={offer._id}
      aria-hidden={!isActive}
    >
      <div className="offer-reel-slide__media">
        <OfferSlideImage src={offer.image} alt={offer.title} isActive={isActive} />
      </div>

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

function ProductSlide({
  product,
  isActive,
  onChat,
  onCloseViewer,
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const [liked, setLiked] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);

  const store = product?.store;

  const handleLike = () => {
    setLiked((v) => !v);
    logActivity('like_product', {
      targetType: 'Product',
      targetId: product._id,
    });
  };

  const handleChat = async () => {
    if (chatBusy) return;
    setChatBusy(true);
    try {
      await onChat?.(product);
    } finally {
      setChatBusy(false);
    }
  };

  const handleShare = async () => {
    if (shareBusy) return;
    setShareBusy(true);
    const url = `${window.location.origin}/product/${product._id}`;
    const text = `${product.name} — ${store?.name || 'منتج'}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user cancelled share */
    } finally {
      setShareBusy(false);
    }
  };

  const performAddToCart = async () => {
    setCartBusy(true);
    try {
      await api.post('/cart/add', { itemId: product._id, itemType: 'product', quantity: 1 });
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      toast('تمت الإضافة للسلة', 'success');
    } catch (err) {
      if (handleApiVerificationError(err, performAddToCart, CART_VERIFICATION)) return;
      toast(err.response?.data?.message || 'تعذّر الإضافة', 'error');
    } finally {
      setCartBusy(false);
    }
  };

  const handleAddToCart = () => {
    if (cartBusy) return;
    runWithVerification(performAddToCart, CART_VERIFICATION);
  };

  const handleViewProduct = () => {
    onCloseViewer?.();
    navigate(`/product/${product._id}`);
  };

  return (
    <section
      className="offer-reel-slide"
      data-reel-item-id={product._id}
      aria-hidden={!isActive}
    >
      <div className="offer-reel-slide__media">
        <OfferSlideImage src={product.image} alt={product.name} isActive={isActive} />
      </div>

      <div className="offer-reel-slide__content">
        <div className="offer-reel-slide__meta">
          <p className="offer-reel-slide__new-price">{product.price} ₪</p>
          {product.description && (
            <p className="offer-reel-slide__desc">{product.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={cartBusy}
            className="offer-reel-slide__order-btn"
          >
            <ShoppingCart size={18} />
            <span>{cartBusy ? 'جاري الإضافة...' : 'أضف للسلة'}</span>
          </button>
          <button
            type="button"
            onClick={handleViewProduct}
            className="offer-reel-slide__order-btn !bg-white/15 !shadow-none border border-white/20"
          >
            <Eye size={18} />
            <span>عرض المنتج</span>
          </button>
        </div>
      </div>

      <aside className="offer-reel-actions" aria-label="إجراءات المنتج">
        <ActionBtn
          icon={Heart}
          label="إعجاب"
          active={liked}
          onClick={handleLike}
          fill={liked}
        />
        <ActionBtn icon={MessageCircle} label="محادثة" onClick={handleChat} busy={chatBusy} />
        <ActionBtn icon={ArrowUpRight} label="مشاركة" onClick={handleShare} busy={shareBusy} />
      </aside>
    </section>
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

function findCategoryBoundary(boundaries, index) {
  return boundaries.find((b) => b.startIndex === index);
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

  const activeItem = offers[activeIndex];

  const preloadRange = useCallback((index) => {
    [index - 1, index, index + 1]
      .filter((i) => i >= 0 && i < offers.length)
      .forEach((i) => {
        const img = getItemImage(offers[i]);
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

  const resolveOwnerAndOpenChat = useCallback(async (item) => {
    const isProduct = isProductItem(item);
    let ownerId = item?.store?.owner?._id || item?.store?.owner;

    if (!ownerId) {
      const endpoint = isProduct ? `/products/${item._id}` : `/offers/${item._id}`;
      const { data } = await api.get(endpoint);
      const payload = isProduct ? data?.product : data?.offer;
      ownerId = payload?.store?.owner?._id || payload?.store?.owner;
    }

    if (!ownerId) return;

    localStorage.setItem('chatContext', JSON.stringify({
      recipientId: ownerId,
      context: {
        itemId: item._id,
        itemType: isProduct ? 'Product' : 'Offer',
        itemName: getItemTitle(item),
        itemImage: getItemImage(item) || '',
        itemUrl: isProduct ? `/product/${item._id}` : `/offer/${item._id}`,
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

    const slide = el.querySelector(`[data-reel-item-id="${offers[initialIndex]?._id}"]`);
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

    if (activeIndex > prev) {
      const boundary = findCategoryBoundary(boundaries, activeIndex);
      if (boundary && activeIndex !== initialIndex) {
        const name = boundary.categoryName || 'القسم التالي';
        setCategoryTransition(`الانتقال إلى قسم ${name}`);
        const timer = setTimeout(() => setCategoryTransition(null), CATEGORY_TRANSITION_MS);
        prevIndexRef.current = activeIndex;
        return () => clearTimeout(timer);
      }
    }

    prevIndexRef.current = activeIndex;
  }, [activeIndex, offers, multiCategory, boundaries, initialIndex]);

  useEffect(() => {
    const offer = offers[activeIndex];
    if (!offer || isProductItem(offer)) return;

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
      {activeItem && (
        <ViewerTopbar item={activeItem} onClose={handleCloseClick} />
      )}

      {showTutorial && <SwipeTutorial onComplete={() => setShowTutorial(false)} />}

      <CategoryTransitionOverlay message={categoryTransition} visible={!!categoryTransition} />

      <div ref={containerRef} className="offer-reel-viewer__scroll">
        {offers.map((item, i) => (
          isProductItem(item) ? (
            <ProductSlide
              key={`product-${item._id}`}
              product={item}
              isActive={i === activeIndex}
              onChat={resolveOwnerAndOpenChat}
              onCloseViewer={closeViewer}
            />
          ) : (
            <OfferSlide
              key={`offer-${item._id}`}
              offer={item}
              isActive={i === activeIndex}
              onShare={handleShare}
              onChat={resolveOwnerAndOpenChat}
              viewCount={viewCounts[String(item._id)] ?? item.views}
            />
          )
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
