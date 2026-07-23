const { getTwilioClient, getVerifyServiceSid, isTwilioVerifyConfigured } = require("../config/twilio");
const { resolveRegistrationPhone } = require("../utils/phone.util");
const { maskIdentifier, safeLog } = require("../utils/logSanitize.util");

function normalizeVerifyPhone(phone) {
  return resolveRegistrationPhone(phone);
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

  const { localPhone, e164Phone } = resolveRegistrationPhone(phone);
  const client = getTwilioClient();
  const serviceSid = getVerifyServiceSid();

  try {
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: e164Phone, channel: "sms" });

    safeLog("info", "twilio_verify_sent", { to: maskIdentifier(e164Phone), status: verification.status });

    return {
      phone: e164Phone,
      localPhone,
      status: verification.status,
    };
  } catch (error) {
    throw mapTwilioError(error);
  }
}

async function verifyRegistrationOtp(phone, code) {
  assertTwilioConfigured();

  const { localPhone, e164Phone } = resolveRegistrationPhone(phone);
  const client = getTwilioClient();
  const serviceSid = getVerifyServiceSid();

  try {
    const check = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: e164Phone, code: String(code).trim() });

    if (check.status !== "approved") {
      const err = new Error("رمز التحقق غير صحيح");
      err.status = 400;
      err.code = "OTP_INVALID";
      throw err;
    }

    safeLog("info", "twilio_verify_approved", { to: maskIdentifier(e164Phone) });

    return {
      phone: e164Phone,
      localPhone,
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
