import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const GEM_MILESTONES = [
  {
    id: 'crystal',
    threshold: 10,
    activeClass: 'points-gem--crystal',
    glow: 'rgba(255,255,255,0.95)',
  },
  {
    id: 'ruby',
    threshold: 50,
    activeClass: 'points-gem--ruby',
    glow: 'rgba(239, 68, 68, 0.85)',
  },
  {
    id: 'gold',
    threshold: 200,
    activeClass: 'points-gem--gold',
    glow: 'rgba(251, 191, 36, 0.9)',
  },
  {
    id: 'obsidian',
    threshold: 500,
    activeClass: 'points-gem--obsidian',
    glow: 'rgba(30, 27, 75, 0.95)',
  },
];

function GemNode({ gem, unlocked, animateUnlock }) {
  return (
    <div className="points-gem-col">
      <motion.div
        className={`points-gem ${unlocked ? gem.activeClass : 'points-gem--locked'}`}
        initial={false}
        animate={
          unlocked
            ? {
              scale: animateUnlock ? [0.88, 1.14, 1] : 1,
              filter: 'grayscale(0) brightness(1)',
              opacity: 1,
            }
            : { scale: 0.94, filter: 'grayscale(1) brightness(0.75)', opacity: 0.45 }
        }
        transition={{ duration: animateUnlock ? 0.65 : 0.35, ease: 'easeOut' }}
      >
        {unlocked && (
          <>
            <span className="points-gem__shine" />
            {animateUnlock && (
              <>
                <span className="points-gem__burst" />
                <span className="points-gem__burst points-gem__burst--delay" />
              </>
            )}
          </>
        )}
        <span className="points-gem__facet" aria-hidden>💎</span>
      </motion.div>
      <span className={`points-gem__threshold ${unlocked ? 'is-active' : ''}`}>
        {gem.threshold}
      </span>
    </div>
  );
}

export default function AchievementGems({ points = 0, active = false }) {
  const prevPointsRef = useRef(points);
  const unlockAnimRef = useRef(new Set());

  useEffect(() => {
    if (!active) {
      unlockAnimRef.current = new Set();
      prevPointsRef.current = points;
      return;
    }

    GEM_MILESTONES.forEach((gem) => {
      const wasUnlocked = prevPointsRef.current >= gem.threshold;
      const isUnlocked = points >= gem.threshold;
      if (isUnlocked && !wasUnlocked) {
        unlockAnimRef.current.add(gem.id);
      }
    });

    prevPointsRef.current = points;
  }, [points, active]);

  return (
    <div className="points-gems-row">
      {GEM_MILESTONES.map((gem) => {
        const unlocked = points >= gem.threshold;
        const animateUnlock = active && unlockAnimRef.current.has(gem.id);
        return (
          <GemNode
            key={gem.id}
            gem={gem}
            unlocked={unlocked}
            animateUnlock={animateUnlock}
          />
        );
      })}
    </div>
  );
}
