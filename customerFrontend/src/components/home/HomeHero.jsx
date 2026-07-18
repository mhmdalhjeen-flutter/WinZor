import React, { useState, lazy, Suspense } from 'react';
import { BookOpen, Play, X } from 'lucide-react';

const PointsGuideModal = lazy(() => import('../PointsGuideModal'));

const INTRO_VIDEO =
  import.meta.env.VITE_INTRO_VIDEO_URL ||
  'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1';

const heroBtnClass =
  'home-hero__cta flex-1 min-w-[9.5rem] max-w-[11.5rem] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] sm:text-[11px] font-bold text-white shadow-sm shadow-primary/20 active:scale-[0.98] transition-transform';

function SiteVideoModal({ open, onClose }) {
  const [playing, setPlaying] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setPlaying(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-t-[28px] sm:rounded-[28px] bg-gray-950 border border-white/10 shadow-2xl"
        dir="rtl"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-white"
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>

        <div className="relative aspect-video bg-black">
          {playing ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`${INTRO_VIDEO}${INTRO_VIDEO.includes('?') ? '&' : '?'}autoplay=1`}
              title="فيديو يوضح الموقع"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#1a0a0a] via-[#120818] to-[#0a0a12]"
              aria-label="تشغيل الفيديو"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-2 ring-amber-400/40 backdrop-blur transition group-hover:bg-white/20">
                <Play size={28} className="mr-[-3px] text-amber-300" fill="currentColor" />
              </span>
              <span className="text-sm font-black text-white/90">فيديو يوضح الموقع</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomeHero() {
  const [guideOpen, setGuideOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <>
      <section className="home-hero max-w-6xl mx-auto px-1.5 sm:px-2" dir="rtl">
        <div className="home-hero__inner">
          <div className="home-hero__glow home-hero__glow--violet" aria-hidden />
          <div className="home-hero__glow home-hero__glow--amber" aria-hidden />

          <div className="relative z-10 home-hero__content py-3.5 sm:py-4 px-3 sm:px-4">
            <p className="home-hero__message text-sm sm:text-base font-black text-gray-900 leading-snug text-center">
              اجمع نقاطك من المتاجر المعتمدة
            </p>

            <div className="home-hero__actions mt-3 w-full">
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className={heroBtnClass}
              >
                <BookOpen size={12} />
                أسئلة حول النقاط؟
              </button>
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                className={heroBtnClass}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 ring-1 ring-white/30">
                  <Play size={8} fill="currentColor" className="mr-[-1px]" />
                </span>
                فيديو يوضح الموقع
              </button>
            </div>
          </div>
        </div>
      </section>

      {guideOpen && (
        <Suspense fallback={null}>
          <PointsGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
        </Suspense>
      )}
      <SiteVideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
    </>
  );
}
