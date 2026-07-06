const REFERRAL_CODE_KEY = 'referralCode';
const REFERRAL_INTRO_SEEN_KEY = 'referralIntroSeen';

export function normalizeReferralCode(code) {
  return (code || '').trim().toUpperCase();
}

export function saveReferralCode(code) {
  const normalized = normalizeReferralCode(code);
  if (normalized) sessionStorage.setItem(REFERRAL_CODE_KEY, normalized);
  return normalized;
}

export function getReferralCode() {
  return sessionStorage.getItem(REFERRAL_CODE_KEY) || '';
}

export function markReferralIntroSeen() {
  sessionStorage.setItem(REFERRAL_INTRO_SEEN_KEY, 'true');
}

export function hasSeenReferralIntro() {
  return sessionStorage.getItem(REFERRAL_INTRO_SEEN_KEY) === 'true';
}

export function clearReferralSession() {
  sessionStorage.removeItem(REFERRAL_CODE_KEY);
  sessionStorage.removeItem(REFERRAL_INTRO_SEEN_KEY);
}

export function registerPathWithRef(code) {
  const ref = normalizeReferralCode(code) || getReferralCode();
  return ref ? `/register?ref=${encodeURIComponent(ref)}` : '/register';
}

export function loginPathWithRef(code) {
  const ref = normalizeReferralCode(code) || getReferralCode();
  return ref ? `/login?ref=${encodeURIComponent(ref)}` : '/login';
}
