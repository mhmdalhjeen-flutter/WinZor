import React from 'react';
import { motion } from 'framer-motion';

const waveMotion = (duration, delay = 0) => ({
  animate: {
    x: [0, 28, -18, 0],
    y: [0, -22, 14, 0],
    scale: [1, 1.08, 0.96, 1],
  },
  transition: {
    duration,
    delay,
    repeat: Infinity,
    ease: 'easeInOut',
  },
});

/** Premium animated background for Intro / Register / Login */
const AuthExperienceBackground = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden bg-[#07070f]" aria-hidden>
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(165deg, #0a0a14 0%, #0f0a18 38%, #0a1018 72%, #08080f 100%)',
      }}
    />

    <motion.div
      className="absolute -top-[18%] -right-[12%] h-[58%] w-[78%] rounded-full opacity-[0.22] blur-[90px]"
      style={{ background: 'radial-gradient(circle, #ef4444 0%, transparent 68%)' }}
      {...waveMotion(22)}
    />
    <motion.div
      className="absolute top-[32%] -left-[20%] h-[52%] w-[72%] rounded-full opacity-[0.18] blur-[100px]"
      style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
      {...waveMotion(26, 2)}
    />
    <motion.div
      className="absolute -bottom-[14%] right-[8%] h-[48%] w-[68%] rounded-full opacity-[0.16] blur-[95px]"
      style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 72%)' }}
      {...waveMotion(24, 4)}
    />

    <motion.div
      className="absolute top-[12%] left-[18%] h-[36%] w-[44%] rounded-full opacity-[0.1] blur-[80px]"
      style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
      {...waveMotion(20, 1)}
    />

    <div
      className="absolute inset-0 opacity-[0.035]"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '26px 26px',
      }}
    />

    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 55%)',
      }}
    />
  </div>
);

export default AuthExperienceBackground;
