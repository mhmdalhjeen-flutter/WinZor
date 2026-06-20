import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// إضافة التوكن لكل طلب
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// التعامل مع الأخطاء القادمة من الباك إند
instance.interceptors.response.use(
    (response) => response,

    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');

            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default instance;