import api from '../api/axios';

const APP_TYPE = 'customer';

export const changePassword = (payload) =>
  api.post('/auth/password/change', payload);

export const requestPasswordReset = (identifier) =>
  api.post('/auth/password/forgot', { identifier, appType: APP_TYPE });

export const resetPassword = (payload) =>
  api.post('/auth/password/reset', { ...payload, appType: APP_TYPE });
