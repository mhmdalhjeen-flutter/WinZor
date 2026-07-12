import React, { useState } from 'react';
import { Sparkles, X, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PointsModal from '../PointsModal';

export default function HomeHero() {
  const { user } = useAuth();
  const [pointsOpen, setPointsOpen] = useState(false);
  const points = user?.points ?? 0;

  return (
    <>
      <section className="home-hero max-w-6xl mx-auto px-3 sm:px-4" dir="rtl">
        <div className="home-hero__inner">
          <div className="home-hero__glow home-hero__glow--violet" aria-hidden />
          <div className="home-hero__glow home-hero__glow--amber" aria-hidden />

          <div className="relative z-10 home-hero__row py-2.5 sm:py-3 px-3 sm:px-4">
            <p className="home-hero__message text-xs sm:text-sm font-black text-gray-900 leading-snug">
              اطلب نقاطك من كل عملية شراء من هذه المتاجر
            </p>

            <button
              type="button"
              onClick={() => setPointsOpen(true)}
              className="home-hero__cta inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold text-white shadow-sm shadow-primary/20 active:scale-[0.98] transition-transform shrink-0"
            >
              <BookOpen size={11} className="sm:hidden" />
              <BookOpen size={12} className="hidden sm:block" />
              دليل النقاط
            </button>
          </div>
        </div>
      </section>

      <PointsModal
        open={pointsOpen}
        onClose={() => setPointsOpen(false)}
        userName={user?.name}
        points={points}
      />
    </>
  );
}
