import React from 'react';
import { motion } from 'framer-motion';
import logoImg from '../../assets/logo/win-goldenstore-logo.png';

const AuthExperienceBranding = ({ size = 'default', className = '' }) => {
  const isLarge = size === 'large';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center text-center ${className}`}
    >
      <div
        className={`relative flex items-center justify-center rounded-[1.35rem] border border-white/20 bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.28)] overflow-hidden ${
          isLarge ? 'h-[5.5rem] w-[5.5rem] sm:h-[6.25rem] sm:w-[6.25rem]' : 'h-[4.75rem] w-[4.75rem] sm:h-[5.25rem] sm:w-[5.25rem]'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50/30 to-violet-50/40" aria-hidden />
        <img
          src={logoImg}
          alt=""
          className="relative z-[1] h-[78%] w-[78%] object-contain"
          width={isLarge ? 80 : 64}
          height={isLarge ? 80 : 64}
          decoding="async"
          style={{ imageRendering: '-webkit-optimize-contrast' }}
        />
      </div>

      <p
        className={`mt-3 font-black tracking-tight bg-gradient-to-l from-amber-200 via-white to-red-300 bg-clip-text text-transparent ${
          isLarge ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
        }`}
      >
        WinGoldenStore
      </p>
    </motion.div>
  );
};

export default AuthExperienceBranding;
