const STORAGE_KEY = 'adminSensitiveToken';

export const getSensitiveToken = () => sessionStorage.getItem(STORAGE_KEY);
export const setSensitiveToken = (token) => sessionStorage.setItem(STORAGE_KEY, token);
export const clearSensitiveToken = () => {
  sessionStorage.removeItem(STORAGE_KEY);
};
