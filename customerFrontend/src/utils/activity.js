import api from '../api/axios';

// تسجيل نشاط بصمت (fire-and-forget) — لا يعطّل الواجهة عند الفشل.
export const logActivity = (type, payload = {}) => {
  try {
    api.post('/activity', { type, ...payload }).catch(() => {});
  } catch {
    /* تجاهل */
  }
};

export const toggleFavorite = (offerId) =>
  api.post(`/activity/favorites/${offerId}/toggle`);

export const getFavorites = () => api.get('/activity/favorites');

export const getRecommendations = () => api.get('/activity/recommendations');
