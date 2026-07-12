import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import PointsGuideModal from '../PointsGuideModal';

export default function HomeHero() {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <>
      <section className="home-hero max-w-6xl mx-auto px-3 sm:px-4" dir="rtl">
        <div className="home-hero__inner">
          <div className="home-hero__glow home-hero__glow--violet" aria-hidden />
          <div className="home-hero__glow home-hero__glow--amber" aria-hidden />

          <div className="relative z-10 home-hero__content py-3 sm:py-3.5 px-3 sm:px-4">
            <p className="home-hero__message text-xs sm:text-sm font-black text-gray-900 leading-snug text-center">
              اطلب نقاطك من المتاجر التي هنا
            </p>

            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="home-hero__cta mx-auto mt-2.5 inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold text-white shadow-sm shadow-primary/20 active:scale-[0.98] transition-transform"
            >
              <BookOpen size={12} />
              دليل النقاط
            </button>
          </div>
        </div>
      </section>

      <PointsGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
