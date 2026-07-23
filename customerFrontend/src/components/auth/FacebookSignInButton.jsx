import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { facebookAuth, isFacebookAuthAvailable } from '../../services/authService';
import { getAuthErrorMessage } from '../../utils/authValidation';

const FB_SDK_TIMEOUT_MS = 8000;

const loadFacebookSdk = (appId) =>
  new Promise((resolve, reject) => {
    if (window.FB) {
      resolve(window.FB);
      return;
    }

    const init = () => {
      window.FB.init({ appId, cookie: true, xfbml: false, version: 'v19.0' });
      resolve(window.FB);
    };

    if (window.fbAsyncInit) {
      const prev = window.fbAsyncInit;
      window.fbAsyncInit = () => {
        prev();
        init();
      };
    } else {
      window.fbAsyncInit = init;
    }

    const existing = document.getElementById('facebook-jssdk');
    if (existing) {
      const wait = setInterval(() => {
        if (window.FB) {
          clearInterval(wait);
          resolve(window.FB);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(wait);
        if (window.FB) resolve(window.FB);
        else reject(new Error('Facebook SDK timeout'));
      }, FB_SDK_TIMEOUT_MS);
      return;
    }

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://connect.facebook.net/ar_AR/sdk.js';
    script.onerror = () => reject(new Error('Facebook SDK failed to load'));
    document.body.appendChild(script);
  });

const FacebookLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const FacebookSignInButton = ({
  label = 'المتابعة باستخدام Facebook',
  onSuccess,
  onError,
  onStart,
  disabled = false,
  loading = false,
}) => {
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onStartRef = useRef(onStart);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  onStartRef.current = onStart;

  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!isFacebookAuthAvailable()) {
      setReady(false);
      setLoadFailed(false);
      return undefined;
    }

    setLoadFailed(false);
    let cancelled = false;
    let idleId;
    let timeoutId;
    const appId = String(import.meta.env.VITE_FACEBOOK_APP_ID || '').trim();

    const startSdk = () => {
      if (cancelled) return;
      loadFacebookSdk(appId)
        .then(() => {
          if (!cancelled) setReady(true);
        })
        .catch(() => {
          if (!cancelled) {
            setReady(false);
            setLoadFailed(true);
          }
        });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(startSdk, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(startSdk, 1);
    }

    return () => {
      cancelled = true;
      if (idleId != null && window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (disabled || loading || !ready) return;

    if (!window.FB) {
      onErrorRef.current?.('Facebook غير جاهز — حاول مجدداً');
      return;
    }

    onStartRef.current?.();

    window.FB.login(
      (response) => {
        if (!response?.authResponse?.accessToken) {
          if (response?.status === 'unknown') {
            onErrorRef.current?.('تعذّر إكمال تسجيل الدخول عبر Facebook — أعد المحاولة');
          }
          return;
        }

        facebookAuth(response.authResponse.accessToken)
          .then((data) => onSuccessRef.current?.(data))
          .catch((err) => {
            onErrorRef.current?.(getAuthErrorMessage(err, 'تعذّر تسجيل الدخول عبر Facebook'));
          });
      },
      { scope: 'email,public_profile' }
    );
  }, [disabled, loading, ready]);

  if (!isFacebookAuthAvailable() || loadFailed) return null;

  const busy = disabled || loading || !ready;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      dir="ltr"
      className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1877F2] px-4 py-4 text-sm font-bold text-white shadow-[0_8px_24px_rgba(24,119,242,0.35)] transition hover:brightness-110 hover:shadow-[0_10px_28px_rgba(24,119,242,0.42)] disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={label}
    >
      {loading ? (
        <Loader2 className="animate-spin text-white" size={20} />
      ) : (
        <FacebookLogo />
      )}
      <span className="text-center leading-snug">{label}</span>
    </button>
  );
};

export default FacebookSignInButton;
