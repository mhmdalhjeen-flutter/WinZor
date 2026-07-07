import React from 'react';
import { Loader2 } from 'lucide-react';
import SocialLoginButtons from './SocialLoginButtons';
import { getEnabledSocialProviders } from '../../services/authService';

const SocialAuthSection = ({
  googleBtnId,
  onSuccess,
  onError,
  disabled = false,
  loading = false,
  loadingLabel = 'جاري إكمال تسجيل الدخول...',
  hideGoogle = false,
}) => {
  const providers = getEnabledSocialProviders();
  const showFacebook = providers.facebook;
  const showTiktok = providers.tiktok;
  const showGoogle = providers.google && !hideGoogle;

  if (!showGoogle && !showFacebook && !showTiktok) return null;

  return (
    <div className="mt-2">
      {loading && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-white/5 py-3 text-xs font-bold text-amber-200">
          <Loader2 className="animate-spin" size={16} />
          {loadingLabel}
        </div>
      )}
      <SocialLoginButtons
        googleBtnId={googleBtnId}
        onSuccess={onSuccess}
        onError={onError}
        disabled={disabled || loading}
        hideGoogle={hideGoogle}
      />
    </div>
  );
};

export default SocialAuthSection;
