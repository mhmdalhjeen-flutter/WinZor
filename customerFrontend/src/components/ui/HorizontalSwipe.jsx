import React, { useRef } from 'react';
import clsx from 'clsx';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';

const MOVE_THRESHOLD = 6;
const VERTICAL_RATIO = 1.15;

const BASE_PROPS = {
  modules: [FreeMode],
  freeMode: {
    enabled: true,
    momentum: true,
    momentumRatio: 0.72,
    momentumVelocityRatio: 0.85,
    momentumBounce: true,
  },
  grabCursor: true,
  simulateTouch: true,
  touchStartPreventDefault: false,
  passiveListeners: true,
  resistance: true,
  resistanceRatio: 0.65,
  watchOverflow: true,
  slidesPerView: 'auto',
  speed: 380,
  threshold: 8,
  touchAngle: 35,
};

/** Allow parent page vertical scroll when the user drags mostly vertically. */
function useSwiperVerticalScrollPassthrough() {
  const gestureRef = useRef(null);

  const onTouchStart = (_swiper, e) => {
    if (!e.touches?.[0]) return;
    gestureRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      locked: null,
    };
  };

  const onTouchMove = (swiper, e) => {
    const g = gestureRef.current;
    if (!g || !e.touches?.[0]) return;

    if (g.locked === 'vertical') {
      swiper.allowTouchMove = false;
      return;
    }

    const dx = e.touches[0].clientX - g.startX;
    const dy = e.touches[0].clientY - g.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX < MOVE_THRESHOLD && absY < MOVE_THRESHOLD) return;

    if (absY > absX * VERTICAL_RATIO) {
      g.locked = 'vertical';
      swiper.allowTouchMove = false;
    } else {
      swiper.allowTouchMove = true;
    }
  };

  const onTouchEnd = (swiper) => {
    gestureRef.current = null;
    swiper.allowTouchMove = true;
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

/**
 * شريط أفقي موحّد: سحب باللمس/الماوس بدون شريط تمرير ظاهر.
 * @param {boolean} pan - محتوى عريض واحد (مثل مسار الجوائز)
 * @param {number} contentWidth - عرض المحتوى في وضع pan
 */
export default function HorizontalSwipe({
  children,
  className,
  slideClassName,
  spaceBetween = 12,
  rtl = true,
  pan = false,
  contentWidth,
  onSwiper,
}) {
  const passthrough = useSwiperVerticalScrollPassthrough();
  const swiperHandlers = {
    onTouchStart: passthrough.onTouchStart,
    onTouchMove: passthrough.onTouchMove,
    onTouchEnd: passthrough.onTouchEnd,
  };

  if (pan) {
    return (
      <Swiper
        {...BASE_PROPS}
        {...swiperHandlers}
        dir={rtl ? 'rtl' : 'ltr'}
        spaceBetween={0}
        onSwiper={onSwiper}
        className={clsx('horizontal-swipe horizontal-swipe--pan touch-scroll-smart', className)}
      >
        <SwiperSlide
          className={clsx('!w-auto', slideClassName)}
          style={contentWidth != null ? { width: contentWidth } : undefined}
        >
          {children}
        </SwiperSlide>
      </Swiper>
    );
  }

  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <Swiper
      {...BASE_PROPS}
      {...swiperHandlers}
      dir={rtl ? 'rtl' : 'ltr'}
      spaceBetween={spaceBetween}
      onSwiper={onSwiper}
      className={clsx('horizontal-swipe touch-scroll-smart', className)}
    >
      {items.map((child, i) => (
        <SwiperSlide
          key={child.key ?? `hsw-${i}`}
          className={clsx('!w-auto h-auto', slideClassName)}
        >
          {child}
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
