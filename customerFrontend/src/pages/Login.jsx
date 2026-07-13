import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../shared/Toast';
import { loginCustomer, isGoogleAuthAvailable } from '../services/authService';
import { getAuthErrorMessage } from '../utils/authValidation';
import { getLocalPhoneError } from '../utils/phoneValidation';
import { useSocialAuth } from '../hooks/useSocialAuth';
import AuthExperienceShell from '../components/auth/AuthExperienceShell';
import AuthField from '../components/auth/AuthField';
import AuthPrimaryButton from '../components/auth/AuthPrimaryButton';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import AuthOrDivider from '../components/auth/AuthOrDivider';
import PalestinianPhoneInput from '../components/PalestinianPhoneInput';
import { registerPathWithRef, saveReferralCode } from '../utils/referralStorage';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();
  const showGoogle = isGoogleAuthAvailable();

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

  const { socialLoading, startSocialLoading, handleSocialSuccess, handleSocialError } = useSocialAuth({
    onAuthenticated: (user) => redirectByRole(user.role),
  });

  const validateForm = () => {
    const phoneErr = getLocalPhoneError(phone);
    if (phoneErr) return phoneErr;
    if (!password) return 'أدخل كلمة المرور';
    if (password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    return null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast(validationError, 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await loginCustomer(phone, password);
      if (!data?.token || !data?.user) {
        throw new Error('استجابة غير صالحة من الخادم');
      }
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
    <AuthExperienceShell
      footer={
        <>
          لا تملك حساب؟{' '}
          <Link to={registerPathWithRef()} className="font-black text-amber-300 underline-offset-4 hover:underline">
            أنشئ حساباً مجاناً
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-200"
          >
            {error}
          </div>
        )}

        {showGoogle && (
          <>
            <GoogleSignInButton
              label="المتابعة باستخدام Google"
              onSuccess={handleSocialSuccess}
              onStart={startSocialLoading}
              onError={(msg) => {
                setError(msg);
                handleSocialError(msg);
              }}
              disabled={busy}
              loading={socialLoading}
            />
            <AuthOrDivider />
          </>
        )}

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label className="text-xs font-black text-white/70">رقم الهاتف</label>
            <PalestinianPhoneInput
              name="phone"
              variant="auth"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError('');
              }}
              disabled={busy}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-white/70">كلمة المرور</label>
            <AuthField
              icon={Lock}
              type="password"
              placeholder="كلمة المرور"
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
          </div>

          <div className="text-left">
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-amber-300/90 hover:text-amber-200 underline-offset-2 hover:underline"
            >
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
      </div>
    </AuthExperienceShell>
  );
};

export default Login;
