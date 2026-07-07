/** Default when /settings/public has not loaded yet — do not block until policy is known */
export const DEFAULT_VERIFICATION_POLICY = {
  enforced: false,
  emailAvailable: false,
  phoneAvailable: false,
};

/**
 * FROZEN — must stay in sync with backend VERIFICATION_FEATURE_FROZEN.
 * Customer verification code remains in the repo but must not gate any feature.
 */
export const VERIFICATION_FEATURE_FROZEN = true;

export const normalizeVerificationPolicy = (input) => {
  if (VERIFICATION_FEATURE_FROZEN) {
    return { enforced: false, emailAvailable: false, phoneAvailable: false };
  }
  return {
    enforced: input?.enforced === true,
    emailAvailable: input?.emailAvailable === true,
    phoneAvailable: input?.phoneAvailable === true,
  };
};

export const isVerifiedUser = (user, policy = DEFAULT_VERIFICATION_POLICY) => {
  if (VERIFICATION_FEATURE_FROZEN) return true;
  if (policy.enforced === false) return true;
  return Boolean(
    user?.isVerified ||
    (user?.email && user?.emailVerified) ||
    (user?.phone && user?.phoneVerified)
  );
};

export default isVerifiedUser;
