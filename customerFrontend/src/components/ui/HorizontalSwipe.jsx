import React from 'react';
import clsx from 'clsx';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css/free-mode';

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
};

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
  if (pan) {
    return (
      <Swiper
        {...BASE_PROPS}
        dir={rtl ? 'rtl' : 'ltr'}
        spaceBetween={0}
        onSwiper={onSwiper}
        className={clsx('horizontal-swipe horizontal-swipe--pan', className)}
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
      dir={rtl ? 'rtl' : 'ltr'}
      spaceBetween={spaceBetween}
      onSwiper={onSwiper}
      className={clsx('horizontal-swipe', className)}
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
