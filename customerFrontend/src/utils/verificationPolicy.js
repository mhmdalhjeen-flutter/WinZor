/** Default when /settings/public has not loaded yet — do not block until policy is known */
export const DEFAULT_VERIFICATION_POLICY = {
  enforced: false,
  emailAvailable: false,
  phoneAvailable: false,
};

export const normalizeVerificationPolicy = (input) => ({
  enforced: input?.enforced === true,
  emailAvailable: input?.emailAvailable === true,
  phoneAvailable: input?.phoneAvailable === true,
});

export const isVerifiedUser = (user, policy = DEFAULT_VERIFICATION_POLICY) => {
  if (policy.enforced === false) return true;
  return Boolean(
    user?.isVerified ||
    (user?.email && user?.emailVerified) ||
    (user?.phone && user?.phoneVerified)
  );
};

export default isVerifiedUser;
