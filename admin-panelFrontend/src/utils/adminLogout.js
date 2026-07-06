import axios from '../api/axios';
import { clearSensitiveToken } from './sensitiveToken';
import { clearDeviceId, getDeviceId } from './deviceId';

/** مسح كامل للجلسة الإدارية + إبطال التوكنات على الخادم */
export async function adminLogout(navigate) {
  const token = localStorage.getItem('adminToken');
  if (token) {
    try {
      await axios.post('/auth/logout', {}, {
        headers: { 'x-device-id': getDeviceId() },
      });
    } catch {
      /* تجاهل — سنمسح محلياً على أي حال */
    }
  }

  clearSensitiveToken();
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminRefreshToken');
  localStorage.removeItem('adminUser');
  clearDeviceId();

  if (typeof navigate === 'function') {
    navigate('/login');
  }
}
