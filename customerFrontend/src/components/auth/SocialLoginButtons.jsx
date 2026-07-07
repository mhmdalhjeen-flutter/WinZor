import React, { useCallback, useEffect, useRef, useState } from 'react';
import { facebookAuth, getEnabledSocialProviders, googleAuth } from '../../services/authService';
import { getAuthErrorMessage } from '../../utils/authValidation';

const GOOGLE_SDK_TIMEOUT_MS = 8000;

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
      setTimeout(() => clearInterval(wait), 8000);
      return;
    }

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://connect.facebook.net/ar_AR/sdk.js';
    script.onerror = reject;
    document.body.appendChild(script);
  });

const loadGoogleSdk = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      const wait = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(wait);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(wait);
        if (window.google?.accounts?.id) resolve();
        else reject(new Error('Google SDK timeout'));
      }, GOOGLE_SDK_TIMEOUT_MS);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const wait = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(wait);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(wait);
        if (window.google?.accounts?.id) resolve();
        else reject(new Error('Google SDK unavailable'));
      }, GOOGLE_SDK_TIMEOUT_MS);
    };
    script.onerror = () => reject(new Error('Google SDK failed to load'));
    document.body.appendChild(script);
  });

const SocialLoginButtons = ({ onSuccess, onError, googleBtnId = 'googleBtn', disabled = false, hideGoogle = false }) => {
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const providers = getEnabledSocialProviders();
  const [googleReady, setGoogleReady] = useState(false);

  const reportError = useCallback((err, fallback) => {
    onErrorRef.current?.(getAuthErrorMessage(err, fallback));
  }, []);

  const handleGoogle = useCallback(async (response) => {
    try {
      const data = await googleAuth(response.credential);
      onSuccessRef.current?.(data);
    } catch (err) {
      reportError(err, 'تعذّر تسجيل الدخول عبر Google');
    }
  }, [reportError]);

  useEffect(() => {
    if (!providers.google || disabled || hideGoogle) {
      setGoogleReady(false);
      return undefined;
    }

    let cancelled = false;

    loadGoogleSdk()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogle,
        });

        const el = document.getElementById(googleBtnId);
        if (el) {
          el.innerHTML = '';
          const width = el.offsetWidth > 0 ? el.offsetWidth : 280;
          window.google.accounts.id.renderButton(el, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            width: Math.min(320, width),
            text: 'continue_with',
            locale: 'ar',
          });
        }

        if (!cancelled) setGoogleReady(true);
      })
      .catch(() => {
        if (!cancelled) setGoogleReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, [googleBtnId, handleGoogle, disabled, hideGoogle, providers.google]);

  useEffect(() => {
    if (!providers.facebook || disabled) return;
    loadFacebookSdk(import.meta.env.VITE_FACEBOOK_APP_ID).catch(() => {});
  }, [disabled, providers.facebook]);

  const handleFacebook = () => {
    if (disabled) return;
    if (!window.FB) {
      onErrorRef.current?.('جاري تحميل Facebook — انتظر ثانية وحاول مجدداً');
      return;
    }
    window.FB.login(
      (res) => {
        if (!res.authResponse?.accessToken) return;
        facebookAuth(res.authResponse.accessToken)
          .then((data) => onSuccessRef.current?.(data))
          .catch((err) => reportError(err, 'تعذّر تسجيل الدخول عبر Facebook'));
      },
      { scope: 'email,public_profile' }
    );
  };

  const handleTikTok = () => {
    if (disabled) return;
    const clientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY;
    const redirectUri =
      import.meta.env.VITE_TIKTOK_REDIRECT_URI || `${window.location.origin}${window.location.pathname}`;
    if (!clientKey) {
      onErrorRef.current?.('TikTok غير مفعّل — أضف VITE_TIKTOK_CLIENT_KEY');
      return;
    }
    const state = Math.random().toString(36).slice(2);
    sessionStorage.setItem('tiktok_oauth_state', state);
    window.location.href = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  };

  const showGoogle = providers.google && googleReady && !hideGoogle;
  const showDivider = showGoogle || providers.facebook || providers.tiktok;

  if (!showDivider) return null;

  return (
    <div className="space-y-3">
      {showDivider && (
        <div className="relative flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-bold text-white/35">أو سجّل عبر</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      )}

      {providers.google && (
        <div
          className={`flex min-h-[44px] justify-center ${disabled || !googleReady ? 'pointer-events-none opacity-50' : ''}`}
          id={googleBtnId}
        />
      )}

      {providers.facebook && (
        <button
          type="button"
          onClick={handleFacebook}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1877F2] py-3.5 text-sm font-black text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          متابعة عبر Facebook
        </button>
      )}

      {providers.tiktok && (
        <button
          type="button"
          onClick={handleTikTok}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-black py-3.5 text-sm font-black text-white transition hover:bg-white/5 disabled:opacity-50"
        >
          <span aria-hidden>♪</span>
          متابعة عبر TikTok
        </button>
      )}
    </div>
  );
};

export default SocialLoginButtons;
