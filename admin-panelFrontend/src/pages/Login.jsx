import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { getDeviceId } from '../utils/deviceId';
import '../style/login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data } = await api.post('/auth/login', {
                identifier: email,
                password: password,
                appType: 'admin',
                deviceId: getDeviceId(),
            }, {
                headers: { 'x-device-id': getDeviceId() },
            });

            if (data.user && data.token) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.user));
                if (data.refreshToken) localStorage.setItem('adminRefreshToken', data.refreshToken);
                if (data.deviceId) localStorage.setItem('adminDeviceId', data.deviceId);
                navigate('/dashboard');
            } else {
                setError('عذراً، لا تملك صلاحيات الوصول للوحة التحكم');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'تعذر الاتصال بالخادم. تأكد من تشغيل الـ Backend');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                            <ShieldCheck size={32} color="white" />
                        </div>
                    </div>
                    <h2>عروض<span> تك</span></h2>
                    <p className="text-muted text-sm mt-2">لوحة التحكم الإدارية المركزية</p>
                </div>

                <form className="login-form" onSubmit={handleLogin}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs mb-4 text-center font-bold">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label>البريد الإلكتروني</label>
                        <div className="login-input-wrapper">
                            <Mail size={18} />
                            <input 
                                type="email" 
                                className="login-input" 
                                placeholder="admin@offers.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>كلمة المرور</label>
                        <div className="login-input-wrapper">
                            <Lock size={18} />
                            <input 
                                type="password" 
                                className="login-input" 
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <p className="text-center text-xs mt-3">
                        <Link to="/forgot-password" className="text-primary font-bold hover:underline">
                            نسيت كلمة المرور؟
                        </Link>
                    </p>

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? (
                            <Loader2 className="animate-spin mx-auto" size={20} />
                        ) : (
                            'دخول لوحة التحكم'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-muted">جميع الحقوق محفوظة &copy; {new Date().getFullYear()}</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
