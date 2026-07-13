import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
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
import DirectOrderModal from './DirectOrderModal';
import SwipeTutorial from './SwipeTutorial';
import { resolveOfferImage, resolveProductImage, resolveStoreLogo, storeLogoPlaceholder } from '../../utils/mediaUrl';
import { formatPrice } from '../../utils/currency';

const CATEGORY_TRANSITION_MS = 1000;
const RESUME_STORAGE_KEY = 'offerReelViewerResume';

let resumeRoot = null;
let resumeContainer = null;

function clearResumeState() {
  try {
    sessionStorage.removeItem(RESUME_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function saveResumeState(state) {
  try {
    sessionStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function readResumeState() {
  try {
    const raw = sessionStorage.getItem(RESUME_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function dismissResumedViewer() {
  clearResumeState();
  resumeRoot?.unmount();
  resumeRoot = null;
  resumeContainer?.remove();
  resumeContainer = null;
}

function getStoreLogoSrc(store) {
  return resolveStoreLogo(store) || storeLogoPlaceholder(store);
}

function isProductItem(item) {
  return item?.__itemType === 'product';
}

function isCategoryItem(item) {
  return item?.__itemType === 'category';
}

function getItemTitle(item) {
  if (isCategoryItem(item)) return item.__categoryName;
  return isProductItem(item) ? item.name : item.title;
}

function getItemImage(item) {
  if (isCategoryItem(item)) return null;
  if (isProductItem(item)) return resolveProductImage(item);
  return resolveOfferImage(item);
}

function ViewerBackdrop({ src }) {
  return (
    <div
      className={`offer-reel-viewer__backdrop${src ? '' : ' offer-reel-viewer__backdrop--empty'}`}
      aria-hidden
    >
      {src && <img src={src} alt="" className="offer-reel-viewer__backdrop-img" />}
      <div className="offer-reel-viewer__backdrop-shade" />
    </div>
  );
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

function DescriptionBlock({ text }) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  useEffect(() => {
    const el = textRef.current;
    if (!el || !text) {
      setCanExpand(false);
      return undefined;
    }

    const measure = () => {
      setCanExpand(el.scrollHeight > el.clientHeight + 1 || text.length > 72);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [text]);

  if (!text) return null;

  return (
    <div className={`offer-reel-slide__desc-wrap ${expanded ? 'offer-reel-slide__desc-wrap--expanded' : ''}`}>
      <p
        ref={textRef}
        className={`offer-reel-slide__desc ${expanded ? 'offer-reel-slide__desc--expanded' : 'offer-reel-slide__desc--clamped'}`}
      >
        {text}
      </p>
      {canExpand && (
        <button
          type="button"
          className="offer-reel-slide__desc-toggle"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? 'إخفاء التفاصيل' : 'اقرأ المزيد'}
        </button>
      )}
    </div>
  );
}

function ViewerTopbar({ item, onClose, onStoreClick }) {
  const store = item?.store;
  const storeId = store?._id;

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
        <button
          type="button"
          className="offer-reel-viewer__store-link"
          onClick={() => storeId && onStoreClick?.(storeId)}
          disabled={!storeId}
          aria-label={store?.name ? `زيارة متجر ${store.name}` : 'زيارة المتجر'}
        >
          <span className="offer-reel-viewer__topbar-row">
            <img
              src={getStoreLogoSrc(store)}
              alt=""
              className="offer-reel-slide__store-logo"
            />
            <span className="offer-reel-slide__store-text">
              <span className="offer-reel-slide__store-name">{store?.name || 'متجر'}</span>
              {store?.isVerifiedStore && <VerifiedBadge className="mt-0.5" />}
            </span>
          </span>
        </button>
        <h2 className="offer-reel-slide__offer-title">{getItemTitle(item)}</h2>
      </div>
    </header>
  );
}

function CategoryIntroSlide({ item, isActive }) {
  return (
    <section
      className="offer-reel-slide offer-reel-slide--category"
      data-reel-item-id={item._id}
      aria-hidden={!isActive}
    >
      <div className="offer-reel-slide__media offer-reel-slide__media--category">
        <div className="offer-reel-slide__bg-darken offer-reel-slide__bg-darken--category" aria-hidden />
        <div className="offer-reel-category-intro">
          {item.__categoryIcon && (
            <span className="offer-reel-category-intro__icon" aria-hidden>
              {item.__categoryIcon}
            </span>
          )}
          <h2 className="offer-reel-category-intro__title">{item.__categoryName}</h2>
        </div>
      </div>
    </section>
  );
}

function ReelSlide({
  item,
  isActive,
  onShare,
  onChat,
  viewCount,
}) {
  const [orderOpen, setOrderOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);

  const isProduct = isProductItem(item);
  const store = item?.store;
  const title = getItemTitle(item);
  const displayViews = viewCount ?? item?.views ?? 0;

  const handleLike = () => {
    setLiked((v) => !v);
    logActivity(isProduct ? 'like_product' : 'like_offer', {
      targetType: isProduct ? 'Product' : 'Offer',
      targetId: item._id,
    });
  };

  const handleChat = async () => {
    if (chatBusy) return;
    setChatBusy(true);
    try {
      await onChat?.(item);
    } finally {
      setChatBusy(false);
    }
  };

  const handleShare = async () => {
    if (shareBusy) return;
    setShareBusy(true);
    const path = isProduct ? `/product/${item._id}` : `/offer/${item._id}`;
    const url = `${window.location.origin}${path}`;
    const text = `${title} — ${store?.name || (isProduct ? 'منتج' : 'عرض مميز')}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      if (!isProduct) await onShare?.(item._id);
    } catch {
      /* user cancelled share */
    } finally {
      setShareBusy(false);
    }
  };

  const handleOrderClick = () => {
    setOrderOpen(true);
  };

  return (
    <section
      className="offer-reel-slide"
      data-reel-item-id={item._id}
      aria-hidden={!isActive}
    >
      <div className="offer-reel-slide__media">
        <OfferSlideImage src={isProduct ? resolveProductImage(item) : resolveOfferImage(item)} alt={title} isActive={isActive} />
      </div>

      <div className="offer-reel-slide__content">
        <div className="offer-reel-slide__meta">
          {!isProduct && (
            <span className="offer-reel-slide__discount-badge">{getOfferBadge(item)}</span>
          )}
          {isProduct ? (
            <span className="offer-reel-slide__new-price">{formatPrice(item.price, item.currency)}</span>
          ) : (
            <OfferPriceDisplay
              offer={item}
              oldClassName="offer-reel-slide__old-price"
              newClassName="offer-reel-slide__new-price"
              badgeClassName="hidden"
            />
          )}
          {item.description && (
            <DescriptionBlock text={item.description} />
          )}
        </div>

        <button
          type="button"
          onClick={handleOrderClick}
          className="offer-reel-slide__order-btn"
        >
          <ShoppingBag size={18} />
          <span>اطلب الآن</span>
        </button>
      </div>

      <aside className="offer-reel-actions" aria-label={isProduct ? 'إجراءات المنتج' : 'إجراءات العرض'}>
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
        offer={item}
        itemType={isProduct ? 'product' : 'offer'}
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
      />
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
  const scrollLockYRef = useRef(0);

  const activeItem = offers[activeIndex];
  const backdropSrc = activeItem && !isCategoryItem(activeItem) ? getItemImage(activeItem) : null;
  const firstCategoryIntroIndex = boundaries[0]?.startIndex ?? 0;

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
    clearResumeState();
    if (historyPushedRef.current) {
      window.history.back();
    } else {
      closeViewer();
    }
  }, [closeViewer]);

  const handleStoreClick = useCallback((storeId) => {
    saveResumeState({
      offers,
      boundaries,
      initialIndex: activeIndex,
      multiCategory,
    });
    navigate(`/stores/${storeId}`);
  }, [navigate, offers, boundaries, activeIndex, multiCategory]);

  useEffect(() => {
    if (!resumeContainer) {
      clearResumeState();
    }
  }, []);

  useEffect(() => {
    scrollLockYRef.current = window.scrollY;
    document.body.classList.add('offer-viewer-open');
    document.body.style.top = `-${scrollLockYRef.current}px`;
    if (!window.history.state?.offerViewer) {
      window.history.pushState({ offerViewer: true }, '');
    }
    historyPushedRef.current = true;

    const onPopState = () => {
      historyPushedRef.current = false;
      closeViewer();
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      document.body.classList.remove('offer-viewer-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollLockYRef.current);
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

    const curr = offers[activeIndex];

    if (activeIndex > prev && isCategoryItem(curr) && activeIndex !== initialIndex) {
      const name = curr.__categoryName || 'القسم التالي';
      const message = activeIndex === firstCategoryIntroIndex
        ? name
        : `الانتقال إلى قسم ${name}`;
      setCategoryTransition(message);
      const timer = setTimeout(() => setCategoryTransition(null), CATEGORY_TRANSITION_MS);
      prevIndexRef.current = activeIndex;
      return () => clearTimeout(timer);
    }

    prevIndexRef.current = activeIndex;
  }, [activeIndex, offers, multiCategory, initialIndex, firstCategoryIntroIndex]);

  useEffect(() => {
    const item = offers[activeIndex];
    if (!item || isProductItem(item) || isCategoryItem(item)) return;

    const id = String(item._id);
    if (viewedRef.current.has(id)) return;

    const timer = setTimeout(async () => {
      const result = await recordOfferView(item._id);
      viewedRef.current.add(id);
      if (result?.views != null) {
        setViewCounts((prev) => ({ ...prev, [id]: result.views }));
      }
      logActivity('open_offer', {
        targetType: 'Offer',
        targetId: item._id,
        meta: {
          category: item.store?.category,
          region: item.store?.region,
        },
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeIndex, offers]);

  const handleShare = (offerId) => recordOfferShare(offerId);

  const renderSlide = (item, i) => {
    if (isCategoryItem(item)) {
      return (
        <CategoryIntroSlide
          key={item._id}
          item={item}
          isActive={i === activeIndex}
        />
      );
    }

    return (
      <ReelSlide
        key={`${item.__itemType}-${item._id}`}
        item={item}
        isActive={i === activeIndex}
        onShare={handleShare}
        onChat={resolveOwnerAndOpenChat}
        viewCount={viewCounts[String(item._id)] ?? item.views}
      />
    );
  };

  return createPortal(
    <div className="offer-reel-viewer" role="dialog" aria-modal="true" aria-label="عارض العروض">
      <ViewerBackdrop src={backdropSrc} />

      {activeItem && !isCategoryItem(activeItem) && (
        <ViewerTopbar
          item={activeItem}
          onClose={handleCloseClick}
          onStoreClick={handleStoreClick}
        />
      )}

      {activeItem && isCategoryItem(activeItem) && (
        <header className="offer-reel-viewer__topbar offer-reel-viewer__topbar--category-only">
          <button
            type="button"
            onClick={handleCloseClick}
            className="offer-reel-viewer__close"
            aria-label="إغلاق"
          >
            <X size={24} />
          </button>
        </header>
      )}

      {showTutorial && <SwipeTutorial onComplete={() => setShowTutorial(false)} />}

      <CategoryTransitionOverlay message={categoryTransition} visible={!!categoryTransition} />

      <div ref={containerRef} className="offer-reel-viewer__scroll">
        {offers.map(renderSlide)}
      </div>

      {offers.length > 1 && activeIndex < offers.length - 1 && !showTutorial && (
        <div className="offer-reel-viewer__hint" aria-hidden>
          <ChevronUp size={18} />
        </div>
      )}
    </div>,
    document.body
  );
}

function tryResumeViewer() {
  if (document.body.classList.contains('offer-viewer-open')) return;
  if (window.location.pathname.match(/^\/stores?\//)) return;

  const state = readResumeState();
  if (!state?.offers?.length) return;

  dismissResumedViewer();
  resumeContainer = document.createElement('div');
  resumeContainer.id = 'offer-reel-viewer-resume-host';
  document.body.appendChild(resumeContainer);
  resumeRoot = createRoot(resumeContainer);
  resumeRoot.render(
    <OfferReelViewer
      offers={state.offers}
      boundaries={state.boundaries ?? []}
      initialIndex={state.initialIndex ?? 0}
      multiCategory={!!state.multiCategory}
      onClose={dismissResumedViewer}
    />
  );
}

if (typeof window !== 'undefined' && !window.__offerReelResumeInit) {
  window.__offerReelResumeInit = true;
  window.addEventListener('popstate', () => {
    window.setTimeout(tryResumeViewer, 0);
  });
}
