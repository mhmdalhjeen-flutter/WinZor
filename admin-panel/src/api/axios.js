import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:5000/api', // رابط الباك اند الخاص بك
});

// إضافة التوكن تلقائياً لكل طلب إذا كان موجوداً
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default instance;
