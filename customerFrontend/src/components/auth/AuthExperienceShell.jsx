import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import AuthExperienceBackground from './AuthExperienceBackground';
import AuthExperienceBranding from './AuthExperienceBranding';

const AuthExperienceShell = ({
  children,
  footer,
  backTo = '/intro',
  backLabel = 'العودة للترحيب',
}) => (
  <div className="relative min-h-screen overflow-x-hidden font-['Cairo'] text-white" dir="rtl">
    <AuthExperienceBackground />

    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-5 pb-8 sm:max-w-xl sm:px-6">
      <div className="mb-5 flex items-center justify-start">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-2 text-[11px] font-bold text-white/75 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
      </div>

      <AuthExperienceBranding className="mb-6" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="rounded-[28px] border border-white/12 bg-white/[0.07] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7"
      >
        {children}
      </motion.div>

      {footer && (
        <div className="mt-6 text-center text-sm font-bold text-white/55">{footer}</div>
      )}
    </div>
  </div>
);

export default AuthExperienceShell;
