import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { BRAND_LOGO_128, BRAND_NAME } from '../../utils/brandAssets';
import WelcomeBackground from './WelcomeBackground';

const AuthShell = ({
  title,
  subtitle,
  badge,
  children,
  footer,
  backTo = '/intro',
  backLabel = 'العودة للترحيب',
  highlights = [],
}) => (
  <div className="relative min-h-screen overflow-hidden bg-[#07070f] font-['Cairo'] text-white" dir="rtl">
    <WelcomeBackground />

    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-6 pb-8 sm:max-w-xl sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-white/70 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-red-600/20 px-3 py-1.5 text-[10px] font-black text-red-200">
          <Sparkles size={12} className="text-amber-300" />
          {BRAND_NAME}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-5 text-center"
      >
        <div className="mb-4 flex justify-center">
          <img
            src={BRAND_LOGO_128}
            alt={BRAND_NAME}
            className="h-20 w-20 object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.35)] sm:h-24 sm:w-24"
            width={96}
            height={96}
            loading="eager"
            decoding="async"
          />
        </div>
        {badge && (
          <span className="mb-3 inline-block rounded-full bg-amber-400/15 px-4 py-1.5 text-[10px] font-black tracking-wide text-amber-200">
            {badge}
          </span>
        )}
        <h1 className="text-3xl font-black leading-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm font-bold text-white/55 sm:text-base">{subtitle}</p>}
        {highlights.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {highlights.map((h) => (
              <span
                key={h}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black text-white/60"
              >
                {h}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7"
      >
        {children}
      </motion.div>

      {footer && <div className="mt-6 text-center text-sm font-bold text-white/55">{footer}</div>}
    </div>
  </div>
);

export default AuthShell;
