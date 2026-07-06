import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../shared/Toast';
import { loginCustomer } from '../services/authService';
import { getAuthErrorMessage, validateLoginForm } from '../utils/authValidation';
import { useSocialAuth } from '../hooks/useSocialAuth';
import AuthShell from '../components/auth/AuthShell';
import AuthField from '../components/auth/AuthField';
import AuthPrimaryButton from '../components/auth/AuthPrimaryButton';
import { registerPathWithRef, saveReferralCode } from '../utils/referralStorage';
import SocialAuthSection from '../components/auth/SocialAuthSection';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const refFromUrl = (searchParams.get('ref') || '').trim();
    if (refFromUrl) saveReferralCode(refFromUrl);
  }, [searchParams]);

  const redirectByRole = useCallback((role) => {
    const routes = {
      admin: '/admin',
      store: '/store-dashboard',
      supplier: '/supplier-dashboard',
      customer: '/',
    };
    navigate(routes[role] || '/');
  }, [navigate]);

  const { socialLoading, handleSocialSuccess, handleSocialError } = useSocialAuth({
    onAuthenticated: (user) => redirectByRole(user.role),
  });

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (token && user?.role) {
        redirectByRole(user.role);
      }
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, [redirectByRole]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateLoginForm({ identifier, password });
    if (validationError) {
      setError(validationError);
      toast(validationError, 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await loginCustomer(identifier, password);
      login(data.user, data.token, {
        refreshToken: data.refreshToken,
        deviceId: data.deviceId,
      });
      toast(data.message || 'تم تسجيل الدخول بنجاح', 'success');
      redirectByRole(data.user.role);
    } catch (err) {
      const message = getAuthErrorMessage(err, 'خطأ في تسجيل الدخول');
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || socialLoading;

  return (
    <AuthShell
      badge="مرحباً بعودتك"
      title="سجّل دخولك"
      subtitle="بالبريد الإلكتروني أو رقم الهاتف وكلمة المرور"
      highlights={['دخول سريع', 'آمن', 'مجاني']}
      footer={
        <>
          لا تملك حساب؟{' '}
          <Link to={registerPathWithRef()} className="font-black text-amber-300 underline-offset-4 hover:underline">
            أنشئ حساباً مجاناً
          </Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-200"
          >
            {error}
          </div>
        )}

        <AuthField
          icon={Mail}
          type="text"
          placeholder="0592222222 أو البريد الإلكتروني"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (error) setError('');
          }}
          autoComplete="username"
          disabled={busy}
          required
        />

        <AuthField
          icon={Lock}
          type="password"
          placeholder="كلمة المرور (6 أحرف على الأقل)"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError('');
          }}
          minLength={6}
          autoComplete="current-password"
          disabled={busy}
          required
        />

        <div className="text-left">
          <Link to="/forgot-password" className="text-xs font-bold text-amber-300/90 hover:text-amber-200 underline-offset-2 hover:underline">
            نسيت كلمة المرور؟
          </Link>
        </div>

        <AuthPrimaryButton type="submit" loading={loading} disabled={busy || password.length < 6}>
          {!loading && (
            <>
              دخول
              <ArrowLeft size={18} className="transition group-hover:-translate-x-0.5" />
            </>
          )}
        </AuthPrimaryButton>
      </form>

      <SocialAuthSection
        googleBtnId="googleBtnLogin"
        onSuccess={handleSocialSuccess}
        onError={(msg) => {
          setError(msg);
          handleSocialError(msg);
        }}
        disabled={busy}
        loading={socialLoading}
        loadingLabel="جاري إكمال تسجيل الدخول..."
      />
    </AuthShell>
  );
};

export default Login;
