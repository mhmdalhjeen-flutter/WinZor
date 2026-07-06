/** API base — set VITE_API_URL in .env (backend root, e.g. https://winzor.onrender.com) */
const raw = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_URL = raw ? (/\/api$/i.test(raw) ? raw : `${raw}/api`) : '';

export default API_URL;
