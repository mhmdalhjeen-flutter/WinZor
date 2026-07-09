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
      <section className="home-hero max-w-6xl mx-auto px-3 sm:px-4">
        <div className="home-hero__inner">
          <div className="home-hero__glow home-hero__glow--violet" aria-hidden />
          <div className="home-hero__glow home-hero__glow--amber" aria-hidden />

          <div className="relative z-10 text-center space-y-2.5 sm:space-y-3 py-3 sm:py-4 px-3 sm:px-4">
            <h1 className="text-sm sm:text-lg font-black text-gray-900 leading-snug">
              Earn your points with every purchase
              <br />
              <span className="text-primary">From trusted stores</span>
            </h1>

            <button
              type="button"
              onClick={() => setPointsOpen(true)}
              className="home-hero__cta inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black text-white shadow-md shadow-primary/25 active:scale-[0.98] transition-transform"
            >
              <Sparkles size={14} className="sm:hidden" />
              <Sparkles size={16} className="hidden sm:block" />
              What are the points?
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
