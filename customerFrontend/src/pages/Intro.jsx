import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Sparkles, ChevronLeft } from 'lucide-react';
import {
  saveReferralCode,
  getReferralCode,
  markReferralIntroSeen,
  loginPathWithRef,
  registerPathWithRef,
} from '../utils/referralStorage';
import { BRAND_NAME } from '../utils/brandAssets';
import IntroMarketingContent from '../components/intro/IntroMarketingContent';

const Intro = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = (searchParams.get('ref') || '').trim().toUpperCase();

  useEffect(() => {
    if (refCode) saveReferralCode(refCode);
  }, [refCode]);

  const goToLogin = () => {
    localStorage.setItem('firstVisit', 'false');
    const ref = refCode || getReferralCode();
    if (ref) saveReferralCode(ref);
    markReferralIntroSeen();
    navigate(loginPathWithRef(ref));
  };

  const handleStart = () => {
    localStorage.setItem('firstVisit', 'false');
    const ref = refCode || getReferralCode();
    if (ref) saveReferralCode(ref);
    markReferralIntroSeen();
    navigate(registerPathWithRef(ref));
  };

  const headerBanner = (
    <div className="relative z-20 flex items-center justify-between px-4 pt-5 sm:px-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 shadow-sm backdrop-blur-md">
        <Sparkles size={14} className="text-amber-500" />
        <span className="text-[11px] font-black text-gray-800">{BRAND_NAME}</span>
      </div>
      <button
        type="button"
        onClick={goToLogin}
        className="rounded-full border border-gray-200/80 bg-white/80 px-4 py-2 text-xs font-black text-gray-700 shadow-sm backdrop-blur-md transition hover:bg-white"
      >
        لدي حساب
      </button>
    </div>
  );

  return (
    <>
      <IntroMarketingContent
        headerBanner={(
          <>
            {headerBanner}
            {refCode && (
              <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 -mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-4 py-1.5 text-[10px] font-black text-amber-800 border border-amber-200/80">
                  <Gift size={12} />
                  دعوة من صديق — اكتشف المنصة ثم أنشئ حسابك
                </span>
              </div>
            )}
          </>
        )}
        footerNote="انضم الآن — مجاني · بدون التزام · جوائز داخل البلد"
        className="pb-36"
      />

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200/80 bg-white/90 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg flex-col gap-2 sm:max-w-xl">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            className="group relative w-full overflow-hidden rounded-[22px] bg-gradient-to-l from-red-600 via-red-500 to-amber-500 py-4 font-black text-white shadow-[0_12px_40px_rgba(220,38,38,0.45)]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-base sm:text-lg">
              ابدأ مجاناً — أنشئ حسابك
              <ChevronLeft size={20} className="transition group-hover:-translate-x-1" />
            </span>
          </motion.button>
          <button
            type="button"
            onClick={goToLogin}
            className="w-full py-2 text-center text-xs font-bold text-gray-500 transition hover:text-gray-800"
          >
            لدي حساب بالفعل — تسجيل الدخول
          </button>
        </div>
      </div>
    </>
  );
};

export default Intro;
