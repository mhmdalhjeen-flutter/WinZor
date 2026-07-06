import axios from '../api/axios';

const APP_TYPE = 'admin';

export const changePassword = (payload) => axios.post('/auth/password/change', payload);

export const requestPasswordReset = (identifier) =>
  axios.post('/auth/password/forgot', { identifier, appType: APP_TYPE });

export const resetPassword = (payload) =>
  axios.post('/auth/password/reset', { ...payload, appType: APP_TYPE });

export const validatePasswordChange = ({ currentPassword, newPassword, confirmPassword }, minLen = 8) => {
  if (!currentPassword) return 'أدخل كلمة المرور الحالية';
  if (!newPassword) return 'أدخل كلمة المرور الجديدة';
  if (newPassword.length < minLen) return `كلمة المرور يجب أن تكون ${minLen} أحرف على الأقل`;
  if (newPassword !== confirmPassword) return 'كلمة المرور غير متطابقة';
  if (currentPassword === newPassword) return 'كلمة المرور الجديدة يجب أن تختلف عن الحالية';
  return null;
};

export const validatePasswordReset = ({ newPassword, confirmPassword, code }, minLen = 8) => {
  if (!code?.trim()) return 'أدخل رمز التحقق';
  if (!newPassword) return 'أدخل كلمة المرور الجديدة';
  if (newPassword.length < minLen) return `كلمة المرور يجب أن تكون ${minLen} أحرف على الأقل`;
  if (newPassword !== confirmPassword) return 'كلمة المرور غير متطابقة';
  return null;
};
