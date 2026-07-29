import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Loader2 } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';
import FacebookSignInButton from './FacebookSignInButton';
import { useSocialAuth } from '../../hooks/useSocialAuth';
import { isGoogleAuthAvailable, isFacebookAuthAvailable } from '../../services/authService';

const GuestAuthPromptModal = ({
  open,
  message,
  onPhoneLogin,
  onLater,
}) => {
  const showGoogle = isGoogleAuthAvailable();
  const showFacebook = isFacebookAuthAvailable();

  const { socialLoading, startSocialLoading, handleSocialSuccess, handleSocialError } = useSocialAuth({
    successMessage: 'تم تسجيل الدخول بنجاح',
  });

  const busy = socialLoading;

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
            className="w-full max-w-md overflow-hidden rounded-[32px] bg-white text-right shadow-2xl"
            dir="rtl"
          >
            <div className="relative bg-gradient-to-br from-[#1e1b4b] via-primary to-orange-500 px-6 pb-7 pt-6 text-white">
              <button
                type="button"
                onClick={onLater}
                className="absolute left-4 top-4 rounded-full bg-white/15 p-2 text-white/80 hover:bg-white/25"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
              <h3 id="guest-auth-title" className="text-center text-lg font-black leading-snug">
                {message}
              </h3>
            </div>

            <div className="space-y-3 px-6 py-5">
              {showGoogle && (
                <div className="[&_button]:rounded-2xl [&_button]:py-3.5 [&_button]:text-sm [&_button]:font-black [&_p]:hidden">
                  <GoogleSignInButton
                    label="تسجيل الدخول بواسطة Google"
                    onSuccess={handleSocialSuccess}
                    onStart={startSocialLoading}
                    onError={handleSocialError}
                    disabled={busy}
                    loading={busy}
                  />
                </div>
              )}

              {showFacebook && (
                <FacebookSignInButton
                  label="تسجيل الدخول بواسطة Facebook"
                  onSuccess={handleSocialSuccess}
                  onStart={startSocialLoading}
                  onError={handleSocialError}
                  disabled={busy}
                  loading={busy}
                />
              )}

              <button
                type="button"
                onClick={onPhoneLogin}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-gray-200 bg-white py-3.5 text-sm font-black text-gray-800 transition hover:bg-gray-50 disabled:opacity-50"
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : <Phone size={18} />}
                تسجيل الدخول بواسطة رقم الهاتف
              </button>

              <button
                type="button"
                onClick={onLater}
                disabled={busy}
                className="w-full rounded-2xl border-2 border-gray-100 py-3 text-sm font-black text-gray-500 transition hover:bg-gray-50"
              >
                لاحقاً
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GuestAuthPromptModal;
