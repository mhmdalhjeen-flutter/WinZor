import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import IntroMarketingContent from '../components/intro/IntroMarketingContent';
import { BRAND_NAME } from '../utils/brandAssets';

export default function AboutApp() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const headerBanner = (
    <div className="relative z-20 flex items-center justify-between px-4 pt-5 sm:px-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 shadow-sm backdrop-blur-md">
        <Sparkles size={14} className="text-amber-500" />
        <span className="text-[11px] font-black text-gray-800">{BRAND_NAME}</span>
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 rounded-full border border-gray-200/80 bg-white/80 px-4 py-2 text-xs font-black text-gray-700 shadow-sm backdrop-blur-md transition hover:bg-white"
      >
        <ChevronRight size={16} strokeWidth={2.2} />
        رجوع
      </motion.button>
    </div>
  );

  return (
    <IntroMarketingContent
      headerBanner={headerBanner}
      footerNote="منصة تسويقية تربط العملاء بالمتاجر — نقاط، عروض، وجوائز داخل البلد"
      className="pb-28"
    />
  );
}
