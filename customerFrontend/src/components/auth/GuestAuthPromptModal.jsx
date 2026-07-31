import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Loader2 } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';
import FacebookSignInButton from './FacebookSignInButton';
import PhoneAuthFlow from './PhoneAuthFlow';
import { useSocialAuth } from '../../hooks/useSocialAuth';
import { isGoogleAuthAvailable, isFacebookAuthAvailable } from '../../services/authService';

const GuestAuthPromptModal = ({
  open,
  message,
  onLater,
}) => {
  const [phoneFlowOpen, setPhoneFlowOpen] = useState(false);
  const showGoogle = isGoogleAuthAvailable();
  const showFacebook = isFacebookAuthAvailable();

  const { socialLoading, startSocialLoading, handleSocialSuccess, handleSocialError } = useSocialAuth({
    successMessage: 'تم تسجيل الدخول بنجاح',
  });

  const busy = socialLoading;

  useEffect(() => {
    if (!open) {
      setPhoneFlowOpen(false);
    }
  }, [open]);

  const handlePhoneSuccess = () => {
    /* AuthGateContext picks up isAuth change and resumes pending action */
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={onLater}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-auth-title"
        >
          <motion.div
            initial={{ y: 48, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-[28px] bg-white text-right shadow-2xl"
            dir="rtl"
          >
            <div className="relative bg-gradient-to-br from-[#1e1b4b] via-primary to-orange-500 px-5 pb-6 pt-5 text-white">
              <button
                type="button"
                onClick={onLater}
                className="absolute left-4 top-4 rounded-full bg-white/15 p-2 text-white/80 hover:bg-white/25"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
              <h3 id="guest-auth-title" className="text-center text-base font-black leading-snug sm:text-lg">
                {phoneFlowOpen ? (message || 'المتابعة برقم الهاتف') : message}
              </h3>
            </div>

            <div className="px-5 py-4">
              <AnimatePresence mode="wait">
                {phoneFlowOpen ? (
                  <motion.div
                    key="phone-flow"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PhoneAuthFlow
                      onBack={() => setPhoneFlowOpen(false)}
                      onSuccess={handlePhoneSuccess}
                      busy={busy}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="auth-options"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {showGoogle && (
                      <div className="[&_button]:min-h-[48px] [&_button]:rounded-xl [&_button]:py-3.5 [&_button]:text-sm [&_button]:font-black [&_p]:hidden">
                        <GoogleSignInButton
                          label="المتابعة باستخدام Google"
                          onSuccess={handleSocialSuccess}
                          onStart={startSocialLoading}
                          onError={handleSocialError}
                          disabled={busy}
                          loading={busy}
                        />
                      </div>
                    )}

                    {showFacebook && (
                      <div className="[&_button]:min-h-[48px] [&_button]:rounded-xl [&_button]:py-3.5 [&_button]:text-sm [&_button]:font-black">
                        <FacebookSignInButton
                          label="المتابعة باستخدام Facebook"
                          onSuccess={handleSocialSuccess}
                          onStart={startSocialLoading}
                          onError={handleSocialError}
                          disabled={busy}
                          loading={busy}
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setPhoneFlowOpen(true)}
                      disabled={busy}
                      className="flex w-full min-h-[48px] items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white py-3.5 text-sm font-black text-gray-800 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      {busy ? <Loader2 size={18} className="animate-spin" /> : <Phone size={18} />}
                      المتابعة برقم الهاتف
                    </button>

                    <button
                      type="button"
                      onClick={onLater}
                      disabled={busy}
                      className="w-full min-h-[44px] rounded-xl border border-gray-100 py-3 text-sm font-black text-gray-500 transition hover:bg-gray-50"
                    >
                      لاحقاً
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GuestAuthPromptModal;
