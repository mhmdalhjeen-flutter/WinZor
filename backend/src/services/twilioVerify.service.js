const { getTwilioClient, getVerifyServiceSid, isTwilioVerifyConfigured } = require("../config/twilio");
const { toE164Palestine } = require("./sms.service");
const { normalizeLocalPhone, isValidLocalPhone, LOCAL_PHONE_MESSAGE } = require("../utils/phone.util");
const { maskIdentifier, safeLog } = require("../utils/logSanitize.util");

function normalizeVerifyPhone(phone) {
  const local = normalizeLocalPhone(phone);
  if (!local || !isValidLocalPhone(local)) {
    const err = new Error(LOCAL_PHONE_MESSAGE);
    err.status = 400;
    err.code = "INVALID_PHONE";
    throw err;
  }
  return toE164Palestine(local);
}

function mapTwilioError(error) {
  const code = error?.code;
  const status = error?.status;

  if (code === 60200 || code === 21211 || code === 21614) {
    return Object.assign(new Error("رقم الهاتف غير صحيح"), {
      status: 400,
      code: "INVALID_PHONE",
    });
  }

  if (code === 60202 || code === 60203 || code === 20429) {
    return Object.assign(new Error("محاولات كثيرة — يرجى الانتظار قبل إعادة المحاولة"), {
      status: 429,
      code: "TOO_MANY_ATTEMPTS",
    });
  }

  if (code === 20404 || code === 60204) {
    return Object.assign(new Error("رمز التحقق منتهٍ أو غير صالح — اطلب رمزاً جديداً"), {
      status: 400,
      code: "OTP_EXPIRED",
    });
  }

  if (status === 404) {
    return Object.assign(new Error("لا يوجد طلب تحقق نشط لهذا الرقم"), {
      status: 400,
      code: "OTP_NOT_FOUND",
    });
  }

  safeLog("error", "twilio_verify_error", {
    code,
    status,
    message: error?.message,
  });

  return Object.assign(new Error("فشل إرسال رمز التحقق — حاول لاحقاً"), {
    status: 502,
    code: "TWILIO_ERROR",
  });
}

function assertTwilioConfigured() {
  if (!isTwilioVerifyConfigured()) {
    const err = new Error("خدمة التحقق عبر SMS غير مهيّأة");
    err.status = 503;
    err.code = "OTP_SERVICE_UNAVAILABLE";
    throw err;
  }
}

async function sendRegistrationOtp(phone) {
  assertTwilioConfigured();

  const e164 = normalizeVerifyPhone(phone);
  const client = getTwilioClient();
  const serviceSid = getVerifyServiceSid();

  try {
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: e164, channel: "sms" });

    safeLog("info", "twilio_verify_sent", { to: maskIdentifier(e164), status: verification.status });

    return {
      phone: e164,
      localPhone: normalizeLocalPhone(e164),
      status: verification.status,
    };
  } catch (error) {
    throw mapTwilioError(error);
  }
}

async function verifyRegistrationOtp(phone, code) {
  assertTwilioConfigured();

  const e164 = normalizeVerifyPhone(phone);
  const client = getTwilioClient();
  const serviceSid = getVerifyServiceSid();

  try {
    const check = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: e164, code: String(code).trim() });

    if (check.status !== "approved") {
      const err = new Error("رمز التحقق غير صحيح");
      err.status = 400;
      err.code = "OTP_INVALID";
      throw err;
    }

    safeLog("info", "twilio_verify_approved", { to: maskIdentifier(e164) });

    return {
      phone: e164,
      localPhone: normalizeLocalPhone(e164),
      verified: true,
    };
  } catch (error) {
    if (error.code === "OTP_INVALID") throw error;
    throw mapTwilioError(error);
  }
}

module.exports = {
  normalizeVerifyPhone,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  isTwilioVerifyConfigured,
};
