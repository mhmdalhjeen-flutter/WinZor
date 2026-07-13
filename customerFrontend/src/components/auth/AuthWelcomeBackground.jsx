import React from 'react';
import { motion } from 'framer-motion';

const waveMotion = (duration, delay = 0) => ({
  animate: {
    x: [0, 24, -16, 0],
    y: [0, -18, 12, 0],
    scale: [1, 1.08, 0.96, 1],
  },
  transition: {
    duration,
    delay,
    repeat: Infinity,
    ease: 'easeInOut',
  },
});

export default function AuthWelcomeBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(165deg, #fff8f0 0%, #ffe8f5 22%, #e8f4ff 48%, #ecfdf5 72%, #fffbeb 88%, #ffffff 100%)',
        }}
      />
      <motion.div
        className="absolute -top-[14%] -right-[8%] h-[58%] w-[78%] rounded-full opacity-[0.38] blur-[80px]"
        style={{ background: 'radial-gradient(circle, #fb7185 0%, #fda4af 40%, transparent 72%)' }}
        {...waveMotion(22)}
      />
      <motion.div
        className="absolute top-[22%] -left-[16%] h-[52%] w-[72%] rounded-full opacity-[0.34] blur-[88px]"
        style={{ background: 'radial-gradient(circle, #60a5fa 0%, #93c5fd 42%, transparent 74%)' }}
        {...waveMotion(26, 1.5)}
      />
      <motion.div
        className="absolute -bottom-[10%] right-[4%] h-[48%] w-[68%] rounded-full opacity-[0.32] blur-[84px]"
        style={{ background: 'radial-gradient(circle, #4ade80 0%, #86efac 40%, transparent 74%)' }}
        {...waveMotion(24, 3)}
      />
      <motion.div
        className="absolute top-[48%] left-[28%] h-[38%] w-[52%] rounded-full opacity-[0.28] blur-[76px]"
        style={{ background: 'radial-gradient(circle, #fbbf24 0%, #fde68a 45%, transparent 72%)' }}
        {...waveMotion(20, 5)}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 50% at 50% -6%, rgba(255,255,255,0.72) 0%, transparent 55%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.85) 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
      />
    </div>
  );
}
