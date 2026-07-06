import { isValidEmail, getLocalPhoneError } from './authValidation';

export const emptyFieldErrors = () => ({});

export function hasFieldErrors(errors) {
  return Object.values(errors || {}).some(Boolean);
}

export function pickFirstFieldError(errors) {
  return Object.values(errors || {}).find(Boolean) || null;
}

export function clearFieldError(setErrors, field) {
  setErrors((prev) => {
    if (!prev[field]) return prev;
    const next = { ...prev };
    delete next[field];
    return next;
  });
}

export function validateLoginFields({ identifier, password }) {
  const errors = {};
  const trimmed = String(identifier || '').trim();

  if (!trimmed) {
    errors.identifier = 'أدخل البريد الإلكتروني أو رقم الهاتف';
  } else if (trimmed.includes('@')) {
    if (!isValidEmail(trimmed)) errors.identifier = 'صيغة البريد الإلكتروني غير صحيحة';
  } else {
    const phoneErr = getLocalPhoneError(trimmed);
    if (phoneErr && phoneErr !== 'أدخل رقم الهاتف') errors.identifier = 'الرقم غير صحيح';
  }

  if (!password) errors.password = 'أدخل كلمة المرور';
  else if (password.length < 6) errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';

  return errors;
}

export function validateRegisterFields({ name, email, phone, password, signupMode }) {
  const errors = {};
  const trimmedName = String(name || '').trim();

  if (!trimmedName || trimmedName.length < 2) {
    errors.name = 'أدخل اسماً صالحاً (حرفان على الأقل)';
  }
  if (!password) errors.password = 'أدخل كلمة المرور';
  else if (password.length < 6) errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';

  if (signupMode === 'email') {
    const trimmedEmail = String(email || '').trim().toLowerCase();
    if (!trimmedEmail) errors.email = 'أدخل البريد الإلكتروني';
    else if (!isValidEmail(trimmedEmail)) errors.email = 'صيغة البريد الإلكتروني غير صحيحة';
  } else {
    const phoneErr = getLocalPhoneError(phone);
    if (phoneErr) errors.phone = phoneErr === 'أدخل رقم الهاتف' ? 'أدخل رقم الهاتف' : 'الرقم غير صحيح';
  }

  return errors;
}

/** توزيع رسالة API على الحقل المناسب */
export function mapAuthApiError(message, fallback = 'حدث خطأ') {
  const msg = message || fallback;
  const lower = msg.toLowerCase();

  if (/كلمة المرور|password|credentials|غير صحيح/i.test(msg) && /كلمة|password/i.test(lower)) {
    return { fieldErrors: { password: msg }, formError: '' };
  }
  if (/هاتف|phone|بريد|email|مستخدم|حساب|identifier|غير موجود/i.test(msg)) {
    return { fieldErrors: { identifier: msg }, formError: '' };
  }
  return { fieldErrors: {}, formError: msg };
}
