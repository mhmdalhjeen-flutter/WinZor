import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tiktokAuth } from '../services/authService';
import { getAuthErrorMessage } from '../utils/authValidation';

/** يعالج redirect TikTok OAuth عند العودة بـ ?code= — مرة واحدة فقط */
export const useTikTokOAuthCallback = (onSuccess, onError, onStart) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onStartRef = useRef(onStart);
  const processedRef = useRef(false);

  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  onStartRef.current = onStart;

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code || processedRef.current) return;

    processedRef.current = true;
    onStartRef.current?.();

    const saved = sessionStorage.getItem('tiktok_oauth_state');
    if (state && saved && state !== saved) {
      onErrorRef.current?.('انتهت صلاحية جلسة TikTok — أعد المحاولة');
      setSearchParams({}, { replace: true });
      return;
    }
    sessionStorage.removeItem('tiktok_oauth_state');

    const redirectUri =
      import.meta.env.VITE_TIKTOK_REDIRECT_URI || `${window.location.origin}${window.location.pathname}`;

    tiktokAuth({ code, redirectUri })
      .then((data) => onSuccessRef.current?.(data))
      .catch((err) =>
        onErrorRef.current?.(getAuthErrorMessage(err, 'فشل تسجيل الدخول عبر TikTok'))
      )
      .finally(() => setSearchParams({}, { replace: true }));
  }, [searchParams, setSearchParams]);
};

export default useTikTokOAuthCallback;
