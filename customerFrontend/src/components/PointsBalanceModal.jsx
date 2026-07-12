import React, { useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountUpOnOpen } from '../hooks/useCountUpOnOpen';
import { usePointsLeaderboard } from '../hooks/usePointsLeaderboard';
import PointsCelebrationBackground from './points/PointsCelebrationBackground';
import AchievementGems from './points/AchievementGems';
import PointsLeaderboardSection from './points/PointsLeaderboardSection';

export default function PointsBalanceModal({ open, onClose, points = 0, user = null }) {
  const displayPoints = useCountUpOnOpen(points, open, 1200);
  const { data: leaderboard, isLoading: lbLoading } = usePointsLeaderboard(open);

  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add('points-balance-open');
    return () => document.body.classList.remove('points-balance-open');
  }, [open]);

  const currentUserId = user?._id || user?.id;
  const currentUser = leaderboard?.me || (user ? {
    id: currentUserId,
    name: user.name,
    avatar: user.avatar,
    points: user.points ?? points,
  } : null);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="points-balance-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            className="points-balance-overlay__backdrop"
            aria-label="إغلاق"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="points-balance-title"
            className="points-balance-modal"
            dir="rtl"
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          >
            <PointsCelebrationBackground />

            <button
              type="button"
              onClick={onClose}
              className="points-balance-modal__close"
              aria-label="إغلاق"
            >
              <X size={20} />
            </button>

            <div className="points-balance-modal__content">
              {/* 1 — Total points */}
              <header className="points-balance-hero">
                <p id="points-balance-title" className="points-balance-hero__label">
                  عدد النقاط
                </p>
                <motion.div
                  className="points-balance-hero__value-wrap"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08, duration: 0.45, ease: 'easeOut' }}
                >
                  <Star className="points-balance-hero__star" size={28} fill="currentColor" />
                  <span className="points-balance-hero__value tabular-nums">
                    {displayPoints.toLocaleString('en-US')}
                  </span>
                  <span className="points-balance-hero__unit">Points</span>
                </motion.div>
              </header>

              {/* 2 — Achievement gems */}
              <AchievementGems points={points} active={open} />

              {/* 3 — Leaderboard */}
              <PointsLeaderboardSection
                top={leaderboard?.top || []}
                myRank={leaderboard?.myRank}
                currentUser={currentUser}
                currentUserId={currentUserId}
                isLoading={lbLoading}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
