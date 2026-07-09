const STORAGE_KEY = 'winzor_client_id';

export function getClientId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `c_${Date.now()}`;
  }
}
