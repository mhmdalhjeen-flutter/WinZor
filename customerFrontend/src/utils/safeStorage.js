/** JSON.parse آمن لـ localStorage — لا يرمي عند بيانات تالفة */
export function parseStoredJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === '') return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function getStoredUser(fallback = null) {
  return parseStoredJson('user', fallback);
}
