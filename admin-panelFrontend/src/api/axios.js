import axios from 'axios';
import { getSensitiveToken, clearSensitiveToken } from '../utils/sensitiveToken';
import { API_URL } from '../lib/apiUrl';
import { getDeviceId } from '../utils/deviceId';

const instance = axios.create({
    baseURL: API_URL,
    timeout: 15_000,
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['x-device-id'] = getDeviceId();

    const sensitiveToken = getSensitiveToken();
    if (sensitiveToken) {
        config.headers['x-sensitive-token'] = sensitiveToken;
    }

    return config;
});

instance.interceptors.response.use(
    (response) => response,

    async (error) => {
        const data = error.response?.data;
        if (data?.sensitiveExpired || data?.sensitiveRequired) {
            clearSensitiveToken();
        }

        const original = error.config;
        const code = data?.code;
        const canRefresh = code === 'TOKEN_EXPIRED';

        if (error.response?.status === 401 && canRefresh && !original?._retry) {
            const refreshToken = localStorage.getItem('adminRefreshToken');
            if (refreshToken) {
                original._retry = true;
                try {
                    const { data: refreshed } = await axios.post(`${API_URL}/auth/refresh`, {
                        refreshToken,
                        deviceId: getDeviceId(),
                    }, {
                        headers: { 'x-device-id': getDeviceId() },
                    });
                    localStorage.setItem('adminToken', refreshed.token);
                    if (refreshed.refreshToken) localStorage.setItem('adminRefreshToken', refreshed.refreshToken);
                    if (refreshed.deviceId) localStorage.setItem('adminDeviceId', refreshed.deviceId);
                    original.headers.Authorization = `Bearer ${refreshed.token}`;
                    return instance(original);
                } catch {
                    /* fall through */
                }
            }
        }

        if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
            clearSensitiveToken();
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminRefreshToken');
            localStorage.removeItem('adminUser');

            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default instance;
