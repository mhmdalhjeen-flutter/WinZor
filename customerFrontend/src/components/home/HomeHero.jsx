import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
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

          <div className="relative z-10 text-center space-y-2 py-2.5 sm:py-3 px-3 sm:px-4">
            <h1 className="text-xs sm:text-base font-black text-gray-900 leading-snug">
              اكسب نقاطاً من كل عملية شراء.
            </h1>

            <button
              type="button"
              onClick={() => setPointsOpen(true)}
              className="home-hero__cta inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold text-white shadow-sm shadow-primary/20 active:scale-[0.98] transition-transform"
            >
              <Sparkles size={11} className="sm:hidden" />
              <Sparkles size={12} className="hidden sm:block" />
              كيف أستخدم نقاطي؟
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
