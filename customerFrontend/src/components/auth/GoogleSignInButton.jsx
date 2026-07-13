import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { googleAuth, isGoogleAuthAvailable } from '../../services/authService';
import { getAuthErrorMessage } from '../../utils/authValidation';

const GOOGLE_SDK_TIMEOUT_MS = 8000;
const HIDDEN_BTN_ID = 'google-hidden-signin';
const HIDDEN_BTN_READY_MS = 3000;

const waitForHiddenGoogleButton = (root, timeoutMs = HIDDEN_BTN_READY_MS) =>
  new Promise((resolve) => {
    const find = () => root?.querySelector('div[role="button"]') || null;

    const existing = find();
    if (existing) {
      resolve(existing);
      return undefined;
    }

    let settled = false;
    const finish = (btn) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearInterval(poll);
      clearTimeout(timer);
      resolve(btn);
    };

    const observer = new MutationObserver(() => {
      const btn = find();
      if (btn) finish(btn);
    });

    if (root) {
      observer.observe(root, { childList: true, subtree: true });
    }

    const poll = setInterval(() => {
      const btn = find();
      if (btn) finish(btn);
    }, 50);

    const timer = setTimeout(() => finish(find()), timeoutMs);

    return () => finish(null);
  });

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.63 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

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

const GoogleSignInButton = ({
  label,
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
  const hiddenHostRef = useRef(null);
  const hiddenBtnRef = useRef(null);

  const handleGoogleCredential = useCallback(async (response) => {
    try {
      const data = await googleAuth(response.credential);
      onSuccessRef.current?.(data);
    } catch (err) {
      onErrorRef.current?.(getAuthErrorMessage(err, 'تعذّر تسجيل الدخول عبر Google'));
    }
  }, []);

  useEffect(() => {
    if (!isGoogleAuthAvailable() || disabled) {
      setReady(false);
      setLoadFailed(false);
      return undefined;
    }

    setLoadFailed(false);

    let cancelled = false;
    const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

    loadGoogleSdk()
      .then(async () => {
        if (cancelled || !window.google?.accounts?.id || !clientId) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const host = hiddenHostRef.current;
        hiddenBtnRef.current = null;
        if (host) {
          host.innerHTML = '';
          const mount = document.createElement('div');
          mount.id = HIDDEN_BTN_ID;
          host.appendChild(mount);
          window.google.accounts.id.renderButton(mount, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'signin_with',
            width: 320,
          });

          const hiddenBtn = await waitForHiddenGoogleButton(mount);
          if (cancelled) return;
          hiddenBtnRef.current = hiddenBtn;
          if (hiddenBtn) setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReady(false);
          setLoadFailed(true);
        }
      });

    return () => {
      cancelled = true;
      hiddenBtnRef.current = null;
      setReady(false);
    };
  }, [disabled, handleGoogleCredential]);

  const handleClick = () => {
    if (disabled || loading || !ready) return;
    onStartRef.current?.();

    const hiddenBtn = hiddenBtnRef.current
      || document.getElementById(HIDDEN_BTN_ID)?.querySelector('div[role="button"]');

    if (hiddenBtn) {
      hiddenBtn.click();
      return;
    }

    onErrorRef.current?.('Google غير جاهز — حاول مجدداً');
  };

  if (!isGoogleAuthAvailable() || loadFailed) return null;

  const busy = disabled || loading || !ready;

  return (
    <div className="relative space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        dir="ltr"
        className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-[#dadce0] bg-white px-4 py-4 text-sm font-bold text-[#1f1f1f] shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:bg-[#f8f9fa] hover:shadow-[0_10px_28px_rgba(0,0,0,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={label}
      >
        {loading ? (
          <Loader2 className="animate-spin text-[#4285F4]" size={20} />
        ) : (
          <GoogleLogo />
        )}
        <span className="text-center leading-snug">{label}</span>
      </button>

      <p className="text-center text-[10px] font-bold text-white/45">الأسرع والأكثر أمانًا</p>

      <div
        ref={hiddenHostRef}
        className="pointer-events-none absolute -left-[9999px] top-0 h-12 w-[320px] overflow-hidden opacity-0"
        aria-hidden="true"
      />
    </div>
  );
};

export default GoogleSignInButton;
