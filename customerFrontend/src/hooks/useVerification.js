import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import usePlatformSettings from './usePlatformSettings';
import {
  DEFAULT_VERIFICATION_POLICY,
  isVerifiedUser as checkVerified,
  normalizeVerificationPolicy,
} from '../utils/verificationPolicy';

export { isVerifiedUser } from '../utils/verificationPolicy';

export const useVerificationPolicy = () => {
  const { data: settings } = usePlatformSettings();
  return useMemo(
    () => normalizeVerificationPolicy(settings?.verification ?? DEFAULT_VERIFICATION_POLICY),
    [settings?.verification]
  );
};

export const useVerification = () => {
  const policy = useVerificationPolicy();
  const { user } = useAuth();
  const verified = checkVerified(user, policy);

  const requireVerification = (onBlocked) => {
    if (!verified) {
      onBlocked?.();
      return false;
    }
    return true;
  };

  return { verified, requireVerification, policy };
};

export default useVerification;
