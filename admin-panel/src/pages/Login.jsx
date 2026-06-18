import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/auth/login', { email, password });
            
            // التأكد من أن المستخدم هو أدمن
            if (response.data.user.role !== 'admin') {
                setError('عذراً، هذه اللوحة مخصصة للمسؤولين فقط.');
                setLoading(false);
                return;
            }

            localStorage.setItem('adminToken', response.data.token);
            localStorage.setItem('adminUser', JSON.stringify(response.data.user));
            
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'خطأ في تسجيل الدخول. تأكد من البيانات.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4" dir="rtl">
            <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-2xl shadow-2xl border border-gray-700">
                <div>
                    <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                        <Lock className="text-white h-8 w-8" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        لوحة تحكم الأدمن
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        سجل الدخول للوصول إلى مركز القيادة
                    </p>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 animate-pulse">
                        <AlertCircle size={20} />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div className="relative">
                            <Mail className="absolute right-3 top-3 text-gray-500" size={20} />
                            <input
                                type="email"
                                required
                                className="appearance-none relative block w-full px-10 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="البريد الإلكتروني"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute right-3 top-3 text-gray-500" size={20} />
                            <input
                                type="password"
                                required
                                className="appearance-none relative block w-full px-10 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="كلمة المرور"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'جاري التحقق...' : 'دخول للمركز'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
