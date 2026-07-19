import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { usePwaInstall } from '../../context/PwaInstallContext';
import {
  consumeGiftPostFlowPending,
  clearGiftActivationFlow,
  GIFT_POST_FLOW_EVENT,
} from '../../utils/giftActivationFlow';
import { isStandaloneDisplayMode } from '../../pwa/pwaStorage';
import { ONBOARDING_START_EVENT } from '../../utils/onboardingTour';

function OnboardingOfferModal({ open, onAccept, onDecline }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden />
      <div className="relative z-10 w-full max-w-sm rounded-[28px] bg-white p-6 text-right shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <Sparkles size={26} />
        </div>
        <h3 className="text-center text-lg font-black text-gray-900">هل تريد جولة تعريفية سريعة؟</h3>
        <p className="mt-2 text-center text-[11px] font-bold text-gray-500">
          نعرّفك على Win Gold في دقيقة واحدة.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-black text-gray-600"
          >
            لاحقاً
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 rounded-2xl bg-violet-600 py-3 text-sm font-black text-white"
          >
            ابدأ الجولة
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GiftActivationPostFlowHost() {
  const { canInstall, openInstallCard } = usePwaInstall();
  const [onboardingOfferOpen, setOnboardingOfferOpen] = useState(false);

  const runPostFlow = useCallback(() => {
    if (!consumeGiftPostFlowPending()) return;

    clearGiftActivationFlow();

    const showOnboardingOffer = () => {
      window.setTimeout(() => setOnboardingOfferOpen(true), 500);
    };

    if (!isStandaloneDisplayMode() && canInstall) {
      openInstallCard({
        title: 'ثبت Win Gold كتطبيق للوصول الأسرع',
        description: 'ثبّت التطبيق على شاشتك الرئيسية للوصول السريع بعد تفعيل هديتك.',
      });
      window.setTimeout(showOnboardingOffer, 1200);
      return;
    }

    showOnboardingOffer();
  }, [canInstall, openInstallCard]);

  useEffect(() => {
    runPostFlow();
    window.addEventListener(GIFT_POST_FLOW_EVENT, runPostFlow);
    return () => window.removeEventListener(GIFT_POST_FLOW_EVENT, runPostFlow);
  }, [runPostFlow]);

  return (
    <OnboardingOfferModal
      open={onboardingOfferOpen}
      onAccept={() => {
        setOnboardingOfferOpen(false);
        window.dispatchEvent(new CustomEvent(ONBOARDING_START_EVENT));
      }}
      onDecline={() => setOnboardingOfferOpen(false)}
    />
  );
}
