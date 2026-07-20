import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, Trophy, ChevronLeft } from 'lucide-react';
import api from '../api/axios';
import { computeTimelineLayout } from '../utils/achievementTimeline';
import { resolveImageUrl } from '../utils/mediaUrl';
import HorizontalSwipe from './ui/HorizontalSwipe';
const MilestoneNode = ({ milestone, unlocked, isNext, onMarkSeen }) => {
  const { _id, name, icon, image, pointsRequired, animationSeen } = milestone;
  const imageSrc = resolveImageUrl(image, { width: 128 });

  return (
    <motion.div
      layout
      className="flex flex-col items-center w-[88px] shrink-0"
      animate={unlocked ? { y: [0, -6, 0] } : { y: 0 }}
      transition={unlocked && !animationSeen ? { duration: 0.55, ease: 'easeOut' } : { duration: 0.2 }}
    >
      <div className="relative mb-2">
        <motion.div
          className={`relative w-[68px] h-[68px] rounded-[22px] border-2 flex items-center justify-center overflow-hidden ${
            unlocked
              ? 'border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 shadow-lg shadow-amber-200/60'
              : 'border-slate-200 bg-slate-100/80'
          }`}
          animate={{
            scale: unlocked ? 1 : 0.94,
            filter: unlocked ? 'grayscale(0) brightness(1)' : 'grayscale(1) brightness(0.72)',
            opacity: unlocked ? 1 : 0.55,
          }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {unlocked && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-amber-300/30 to-transparent pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0.35] }}
              transition={{ duration: 1.2 }}
            />
          )}

          {imageSrc ? (
            <img src={imageSrc} alt="" className="w-11 h-11 object-contain relative z-10" loading="lazy" />
          ) : (
            <span className="text-3xl relative z-10 select-none">{icon || '🏆'}</span>
          )}

          <AnimatePresence>
            {!unlocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.4, rotate: 12 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/25 backdrop-blur-[1px] rounded-[20px]"
              >
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md"
                >
                  <Lock size={14} className="text-slate-500" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {isNext && !unlocked && (
          <motion.span
            className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-violet-500 ring-4 ring-violet-200"
            animate={{ scale: [1, 1.35, 1], opacity: [1, 0.65, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
          />
        )}
      </div>

      <p
        className={`text-[10px] font-black text-center leading-tight line-clamp-2 min-h-[1.75rem] px-1 ${
          unlocked ? 'text-slate-800' : 'text-slate-400'
        }`}
      >
        {name}
      </p>

      <motion.span
        className={`mt-1 text-[11px] font-black tabular-nums px-2.5 py-0.5 rounded-full ${
          unlocked
            ? 'bg-gradient-to-l from-amber-400 to-orange-400 text-white shadow-sm'
            : 'bg-slate-200/80 text-slate-500'
        }`}
        animate={{ scale: unlocked ? [1, 1.08, 1] : 1 }}
        transition={{ duration: 0.4 }}
      >
        {pointsRequired}
      </motion.span>

      {unlocked && !animationSeen && (
        <button
          type="button"
          onClick={() => onMarkSeen(_id)}
          className="mt-1.5 text-[9px] font-black text-amber-600 underline underline-offset-2"
        >
          رائع!
        </button>
      )}
    </motion.div>
  );
};

const AchievementRoad = ({ points = 0, onUnlock }) => {
  const [road, setRoad] = useState([]);
  const [celebrate, setCelebrate] = useState(null);
  const swiperRef = useRef(null);
  const prevPointsRef = useRef(points);
  const seenCelebrationsRef = useRef(new Set());

  const load = async () => {
    try {
      const { data } = await api.get('/achievements/my');
      setRoad(data.road || []);

      if (data.newlyUnlocked?.length) {
        const first = data.newlyUnlocked[0];
        if (!seenCelebrationsRef.current.has(first._id)) {
          seenCelebrationsRef.current.add(first._id);
          setCelebrate(first);
          onUnlock?.(first);
        }
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
  }, [points]);

  const sortedRoad = useMemo(
    () => [...road].sort((a, b) => (a.pointsRequired || 0) - (b.pointsRequired || 0)),
    [road]
  );

  const layout = useMemo(() => computeTimelineLayout(sortedRoad), [sortedRoad]);
  const progressPct = layout.innerWidth > 0 ? (layout.userPx(points) / layout.innerWidth) * 100 : 0;
  const userMarkerPx = useMemo(() => layout.userPx(points), [layout, points]);
  const canScroll = layout.width > 320;

  const nextMilestoneId = useMemo(() => {
    const next = sortedRoad.find((m) => points < (m.pointsRequired || 0));
    return next?._id || null;
  }, [sortedRoad, points]);

  useEffect(() => {
    const prev = prevPointsRef.current;
    if (points > prev && road.length) {
      const crossed = road.filter(
        (m) => points >= m.pointsRequired && prev < m.pointsRequired && !m.animationSeen
      );
      const latest = crossed[crossed.length - 1];
      if (latest && !seenCelebrationsRef.current.has(latest._id)) {
        seenCelebrationsRef.current.add(latest._id);
        setCelebrate(latest);
        onUnlock?.(latest);
      }
    }
    prevPointsRef.current = points;
  }, [points, road, onUnlock]);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper || !layout.innerWidth || layout.width <= swiper.width) return;
    const markerPx = layout.userPx(points);
    const viewW = swiper.width;
    const centerOffset = markerPx - viewW / 2;
    const maxShift = layout.width - viewW;
    const shift = Math.max(0, Math.min(maxShift, centerOffset));
    swiper.slideTo(0, 0);
    swiper.setTranslate(-shift);
    swiper.updateProgress();
    swiper.updateActiveIndex();
  }, [layout, points]);

  const markSeen = async (id) => {
    try {
      await api.post(`/achievements/${id}/seen`);
      setRoad((prev) =>
        prev.map((m) => (m._id === id ? { ...m, animationSeen: true } : m))
      );
    } catch {
      /* ignore */
    }
  };

  const closeCelebrate = () => {
    if (celebrate?._id) markSeen(celebrate._id);
    setCelebrate(null);
  };

  if (!road.length) {
    return (
      <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="h-28 rounded-2xl bg-slate-50 animate-pulse" />
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-slate-100 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="font-black text-slate-900 flex items-center gap-2 text-base">
            <Sparkles className="text-amber-500" size={20} />
            مسار الجوائز
          </h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
            {canScroll ? 'اسحب أفقيًا لاستكشاف جميع الجوائز' : 'تقدّم في الرحلة وافتح الجوائز حسب نقاطك الحالية'}
          </p>
        </div>
        <div className="text-left shrink-0">
          <p className="text-xl font-black text-violet-600 tabular-nums">{points}</p>
          <p className="text-[9px] font-bold text-slate-400">نقطة الآن</p>
        </div>
      </div>

      <HorizontalSwipe
        pan
        contentWidth={layout.width}
        className="pb-1"
        onSwiper={(sw) => { swiperRef.current = sw; }}
      >
        <div className="relative pt-2 pb-6" style={{ width: layout.width, minHeight: 188 }} dir="rtl">
          <div
            data-progress-track
            className="absolute top-[86px] h-3 rounded-full bg-slate-200/90 overflow-hidden shadow-inner"
            style={{ right: layout.edgePad, left: layout.edgePad }}
          >
            <motion.div
              className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-violet-500 via-fuchsia-500 to-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="absolute inset-y-0 right-0 rounded-full opacity-40 bg-gradient-to-l from-white/70 to-transparent"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <motion.div
            data-user-marker
            className="absolute z-30 flex flex-col items-center pointer-events-none"
            style={{
              top: 72,
              right: layout.edgePad + userMarkerPx,
              transform: 'translateX(50%)',
            }}
            animate={{ right: layout.edgePad + userMarkerPx }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="relative"
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <span className="absolute inset-0 rounded-full bg-amber-400/40 blur-md scale-150" />
              <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 ring-4 ring-white shadow-lg shadow-amber-300/50">
                <ChevronLeft size={11} className="text-white -mr-px" />
              </span>
            </motion.div>
            <span className="mt-1 text-[9px] font-black text-amber-600 bg-white/90 px-1.5 py-0.5 rounded-full shadow-sm tabular-nums">
              {points}
            </span>
          </motion.div>

          {layout.items.map(({ milestone: m, px }) => {
            const unlocked = points >= (m.pointsRequired || 0);
            return (
              <div
                key={m._id}
                className="absolute z-10 flex flex-col items-center"
                style={{
                  top: 0,
                  right: layout.edgePad + px,
                  transform: 'translateX(50%)',
                }}
              >
                <div
                  className={`absolute top-[84px] w-3 h-3 rounded-full border-2 -translate-y-1/2 ${
                    unlocked
                      ? 'bg-amber-400 border-white shadow-md shadow-amber-200'
                      : 'bg-slate-300 border-slate-100'
                  }`}
                />
                <MilestoneNode
                  milestone={{ ...m, unlocked }}
                  unlocked={unlocked}
                  isNext={m._id === nextMilestoneId}
                  onMarkSeen={markSeen}
                />
              </div>
            );
          })}
        </div>
      </HorizontalSwipe>

      <AnimatePresence>
        {celebrate && (() => {
          const celebrateImg = resolveImageUrl(celebrate.image, { width: 128 });
          return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4"
            onClick={closeCelebrate}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 p-[1px] shadow-2xl"
            >
              <div className="rounded-[31px] bg-gradient-to-b from-[#1a1033] to-[#120a24] px-8 py-10 text-center text-white">
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.12, 1] }}
                  transition={{ repeat: 2, duration: 0.55 }}
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[24px] bg-white/10 text-5xl"
                >
                  {celebrateImg ? (
                    <img src={celebrateImg} alt="" className="h-14 w-14 object-contain" />
                  ) : (
                    celebrate.icon || '🏆'
                  )}
                </motion.div>
                <div className="mb-2 flex items-center justify-center gap-1 text-amber-300">
                  <Trophy size={16} />
                  <span className="text-xs font-black">جائزة جديدة!</span>
                </div>
                <h4 className="text-xl font-black">{celebrate.name}</h4>
                <p className="mt-2 text-sm text-white/75">وصلت إلى {celebrate.pointsRequired} نقطة — الجائزة مفتوحة الآن</p>
                <button
                  type="button"
                  onClick={closeCelebrate}
                  className="mt-6 w-full rounded-2xl bg-gradient-to-l from-amber-400 to-orange-400 py-3.5 text-sm font-black text-slate-900 shadow-lg"
                >
                  استمر في الرحلة 🚀
                </button>
              </div>
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>
    </section>
  );
};

export default AchievementRoad;
