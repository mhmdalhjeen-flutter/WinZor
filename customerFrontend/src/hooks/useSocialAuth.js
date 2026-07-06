import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../shared/Toast';
import useTikTokOAuthCallback from './useTikTokOAuthCallback';

/**
 * منطق تسجيل الدخول الاجتماعي المشترك بين Login و Register.
 * @param {{ onAuthenticated?: (user: object) => void, successMessage?: string }} options
 */
export const useSocialAuth = ({ onAuthenticated, successMessage = 'تم تسجيل الدخول بنجاح' } = {}) => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [socialLoading, setSocialLoading] = useState(false);

  const handleSocialSuccess = useCallback(
    (data) => {
      if (!data?.user || !data?.token) {
        toast('استجابة غير صالحة من مزود الدخول', 'error');
        setSocialLoading(false);
        return;
      }
      login(data.user, data.token, {
        refreshToken: data.refreshToken,
        deviceId: data.deviceId,
      });
      toast(successMessage, 'success');
      setSocialLoading(false);
      onAuthenticated?.(data.user);
    },
    [login, toast, successMessage, onAuthenticated]
  );

  const handleSocialError = useCallback(
    (message) => {
      setSocialLoading(false);
      toast(message || 'تعذّر تسجيل الدخول', 'error');
    },
    [toast]
  );

  useTikTokOAuthCallback(
    handleSocialSuccess,
    handleSocialError,
    () => setSocialLoading(true)
  );

  return {
    socialLoading,
    handleSocialSuccess,
    handleSocialError,
  };
};

export default useSocialAuth;
