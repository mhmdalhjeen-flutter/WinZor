const crypto = require("crypto");

const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function isEmailVerificationAvailable() {
  return require("../services/email.service").isEmailConfigured();
}

function isPhoneVerificationAvailable() {
  return require("../services/sms.service").isSmsConfigured();
}

/** When neither SMTP nor SMS is configured, verification gates are disabled. */
function isAccountVerificationEnforced() {
  return isEmailVerificationAvailable() || isPhoneVerificationAvailable();
}

function getVerificationPolicy() {
  const enforced = isAccountVerificationEnforced();
  return {
    enforced,
    emailAvailable: isEmailVerificationAvailable(),
    phoneAvailable: isPhoneVerificationAvailable(),
  };
}

function isUserVerified(user) {
  if (!user) return false;
  if (!isAccountVerificationEnforced()) return true;
  if (user.isVerified) return true;
  return Boolean(
    (user.email && user.emailVerified) ||
    (user.phone && user.phoneVerified)
  );
}

function syncVerifiedFlag(user) {
  user.isVerified = isUserVerified(user);
}

function generateVerifyCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateLinkToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashVerificationSecret(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function verifyVerificationSecret(input, storedHash) {
  if (!input || !storedHash) return false;
  const inputHash = hashVerificationSecret(input);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(inputHash, "hex"),
      Buffer.from(storedHash, "hex")
    );
  } catch {
    return false;
  }
}

async function awardVerificationBonus(user) {
  syncVerifiedFlag(user);
  let bonusPoints = 0;
  if (user.isVerified && !user.verificationBonusAwarded) {
    user.verificationBonusAwarded = true;
    bonusPoints = 5;
    user.points = (user.points || 0) + bonusPoints;
  }
  await user.save();

  if (user.isVerified) {
    const { tryCompleteReferralReward } = require("../services/referral.service");
    await tryCompleteReferralReward(user._id);
  }

  return bonusPoints;
}

module.exports = {
  VERIFICATION_CODE_TTL_MS,
  RESEND_COOLDOWN_MS,
  isEmailVerificationAvailable,
  isPhoneVerificationAvailable,
  isAccountVerificationEnforced,
  getVerificationPolicy,
  isUserVerified,
  syncVerifiedFlag,
  awardVerificationBonus,
  generateVerifyCode,
  generateLinkToken,
  hashVerificationSecret,
  verifyVerificationSecret,
};
