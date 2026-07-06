import api from '../api/axios';
import { normalizePhone } from '../utils/phoneValidation';
import { getDeviceId, clearDeviceId } from '../utils/deviceId';

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
  const { data } = await api.post('/auth/google', {
    credential,
    deviceId: getDeviceId(),
  }, {
    headers: { 'x-device-id': getDeviceId() },
  });
  return data;
};

export const facebookAuth = async (accessToken) => {
  const { data } = await api.post('/auth/facebook', {
    accessToken,
    deviceId: getDeviceId(),
  }, {
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

/** المزودون المفعّلون عبر متغيرات VITE_* — Google معطّل في الإنتاج ما لم يُفعَّل صراحةً */
export const getEnabledSocialProviders = () => {
  const googleId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const googleExplicitlyOff = import.meta.env.VITE_ENABLE_GOOGLE === 'false';
  const googleExplicitlyOn = import.meta.env.VITE_ENABLE_GOOGLE === 'true';
  const googleEnabled = !!googleId
    && !googleExplicitlyOff
    && (!import.meta.env.PROD || googleExplicitlyOn);

  return {
    google: googleEnabled,
    facebook: !!import.meta.env.VITE_FACEBOOK_APP_ID,
    tiktok: !!import.meta.env.VITE_TIKTOK_CLIENT_KEY,
  };
};

export const hasAnySocialProvider = () =>
  Object.values(getEnabledSocialProviders()).some(Boolean);
