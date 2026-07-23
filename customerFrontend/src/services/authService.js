import api from '../api/axios';
import { normalizePhone, normalizeLocalPhone, normalizeWhatsApp } from '../utils/phoneValidation';
import { getDeviceId, clearDeviceId } from '../utils/deviceId';
import { getReferralCode } from '../utils/referralStorage';

function toRegistrationPhone(phone) {
  return normalizeWhatsApp(normalizeLocalPhone(phone));
}

export const loginCustomer = async (identifier, password) => {
  const { data } = await api.post('/auth/login', {
    identifier: String(identifier).trim(),
    password,
    appType: 'customer',
    deviceId: getDeviceId(),
  }, {
    headers: { 'x-device-id': getDeviceId() },
  });
  return data;
};

export const registerCustomer = async ({ name, email, phone, password, referralCode }) => {
  const payload = {
    name: String(name).trim(),
    password,
    deviceId: getDeviceId(),
  };

  if (email) payload.email = String(email).trim().toLowerCase();
  if (phone) payload.phone = normalizePhone(phone);
  if (referralCode?.trim()) payload.referralCode = referralCode.trim();

  const { data } = await api.post('/auth/register-customer', payload, {
    headers: { 'x-device-id': getDeviceId() },
  });
  return data;
};

export const sendRegistrationOtp = async (phone) => {
  const { data } = await api.post('/auth/send-otp', {
    phone: toRegistrationPhone(phone),
  });
  return data;
};

export const verifyRegistrationOtp = async (phone, code) => {
  const { data } = await api.post('/auth/verify-otp', {
    phone: toRegistrationPhone(phone),
    code: String(code).trim(),
  });
  return data;
};

export const logout = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      await api.post('/auth/logout', {}, {
        headers: { 'x-device-id': getDeviceId() },
      });
    } catch {
      /* مسح محلي حتى لو فشل الخادم */
    }
  }

  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  clearDeviceId();
};

export const googleAuth = async (credential) => {
  const referralCode = getReferralCode();
  const payload = {
    credential,
    deviceId: getDeviceId(),
  };
  if (referralCode?.trim()) payload.referralCode = referralCode.trim();

  const { data } = await api.post('/auth/google', payload, {
    headers: { 'x-device-id': getDeviceId() },
  });
  return data;
};

export const facebookAuth = async (accessToken) => {
  const referralCode = getReferralCode();
  const payload = {
    accessToken,
    deviceId: getDeviceId(),
  };
  if (referralCode?.trim()) payload.referralCode = referralCode.trim();

  const { data } = await api.post('/auth/facebook', payload, {
    headers: { 'x-device-id': getDeviceId() },
  });
  return data;
};

export const tiktokAuth = async ({ code, redirectUri }) => {
  const { data } = await api.post('/auth/tiktok', {
    code,
    redirectUri,
    deviceId: getDeviceId(),
  }, {
    headers: { 'x-device-id': getDeviceId() },
  });
  return data;
};

/** Google Sign-In متاح عند وجود Client ID (يُخفى تلقائياً إن غاب) */
export const isGoogleAuthAvailable = () => {
  const googleId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  return !!googleId && import.meta.env.VITE_ENABLE_GOOGLE !== 'false';
};

/** Facebook Login متاح عند وجود App ID */
export const isFacebookAuthAvailable = () => {
  const appId = String(import.meta.env.VITE_FACEBOOK_APP_ID || '').trim();
  return !!appId && import.meta.env.VITE_ENABLE_FACEBOOK !== 'false';
};

/** المزودون المفعّلون عبر متغيرات VITE_* */
export const getEnabledSocialProviders = () => {
  const googleEnabled = isGoogleAuthAvailable();

  return {
    google: googleEnabled,
    facebook: isFacebookAuthAvailable(),
    tiktok: !!import.meta.env.VITE_TIKTOK_CLIENT_KEY,
  };
};

export const hasAnySocialProvider = () =>
  Object.values(getEnabledSocialProviders()).some(Boolean);
