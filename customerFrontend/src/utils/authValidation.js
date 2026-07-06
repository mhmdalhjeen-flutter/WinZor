export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim().toLowerCase());

export {
  normalizeLocalPhone,
  normalizePhone,
  isValidLocalPhone,
  isValidPhone,
  getLocalPhoneError,
  LOCAL_PHONE_MESSAGE,
  LOCAL_PHONE_PLACEHOLDER,
} from './phoneValidation';

import { getLocalPhoneError } from './phoneValidation';

export const validateLoginForm = ({ identifier, password }) => {
  const trimmed = String(identifier || '').trim();
  if (!trimmed) return 'أدخل البريد الإلكتروني أو رقم الهاتف';
  if (!password) return 'أدخل كلمة المرور';
  if (password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  if (trimmed.includes('@') && !isValidEmail(trimmed)) {
    return 'صيغة البريد الإلكتروني غير صحيحة';
  }
  if (!trimmed.includes('@')) {
    const phoneErr = getLocalPhoneError(trimmed);
    if (phoneErr && phoneErr !== 'أدخل رقم الهاتف') return phoneErr;
  }
  return null;
};

export const validateRegisterForm = ({ name, email, phone, password, signupMode }) => {
  const trimmedName = String(name || '').trim();
  if (!trimmedName || trimmedName.length < 2) {
    return 'أدخل اسماً صالحاً (حرفان على الأقل)';
  }
  if (!password) return 'أدخل كلمة المرور';
  if (password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';

  if (signupMode === 'email') {
    const trimmedEmail = String(email || '').trim().toLowerCase();
    if (!trimmedEmail) return 'أدخل البريد الإلكتروني';
    if (!isValidEmail(trimmedEmail)) return 'صيغة البريد الإلكتروني غير صحيحة';
    return null;
  }

  return getLocalPhoneError(phone);
};

export const getAuthErrorMessage = (err, fallback) => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ERR_NETWORK' || !err?.response) {
    return 'تعذّر الاتصال بالخادم. تحقق من الاتصال أو حاول لاحقاً.';
  }
  return err?.message || fallback;
};
