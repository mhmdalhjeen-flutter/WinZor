/// Mirrors React `utils/verificationPolicy.js` + backend `VERIFICATION_FEATURE_FROZEN`.

const DEFAULT_VERIFICATION_POLICY = VerificationPolicy(
  enforced: false,
  emailAvailable: false,
  phoneAvailable: false,
);

/// FROZEN — must stay in sync with backend `VERIFICATION_FEATURE_FROZEN`.
/// Customer verification code remains in the app but must not gate any feature
/// until product explicitly unfreezes.
const VERIFICATION_FEATURE_FROZEN = true;

class VerificationPolicy {
  final bool enforced;
  final bool emailAvailable;
  final bool phoneAvailable;

  const VerificationPolicy({
    required this.enforced,
    required this.emailAvailable,
    required this.phoneAvailable,
  });
}

VerificationPolicy normalizeVerificationPolicy(Map<String, dynamic>? input) {
  if (VERIFICATION_FEATURE_FROZEN) {
    return DEFAULT_VERIFICATION_POLICY;
  }
  return VerificationPolicy(
    enforced: input?['enforced'] == true,
    emailAvailable: input?['emailAvailable'] == true,
    phoneAvailable: input?['phoneAvailable'] == true,
  );
}

bool isVerifiedUser(
  Map<String, dynamic>? user, [
  VerificationPolicy policy = DEFAULT_VERIFICATION_POLICY,
]) {
  if (VERIFICATION_FEATURE_FROZEN) return true;
  if (policy.enforced == false) return true;
  if (user == null) return false;
  if (user['isVerified'] == true) return true;
  final email = user['email']?.toString();
  final phone = user['phone']?.toString();
  return (email != null &&
          email.isNotEmpty &&
          user['emailVerified'] == true) ||
      (phone != null && phone.isNotEmpty && user['phoneVerified'] == true);
}
