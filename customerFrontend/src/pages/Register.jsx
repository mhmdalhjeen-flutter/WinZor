import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../shared/Toast';
import { registerCustomer } from '../services/authService';
import { getAuthErrorMessage, validateRegisterForm } from '../utils/authValidation';
import { useSocialAuth } from '../hooks/useSocialAuth';
import AuthShell from '../components/auth/AuthShell';
import AuthField from '../components/auth/AuthField';
import AuthPrimaryButton from '../components/auth/AuthPrimaryButton';
import SocialAuthSection from '../components/auth/SocialAuthSection';
import PalestinianPhoneInput from '../components/PalestinianPhoneInput';
import {
  getReferralCode,
  saveReferralCode,
  hasSeenReferralIntro,
  clearReferralSession,
  registerPathWithRef,
  loginPathWithRef,
} from '../utils/referralStorage';

const Register = () => {
  const [signupMode, setSignupMode] = useState('email');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();
  const refFromUrl = (searchParams.get('ref') || '').trim().toUpperCase();
  const refCode = refFromUrl || getReferralCode();

  useEffect(() => {
    const code = refFromUrl || getReferralCode();
    if (!code) return;
    if (refFromUrl) saveReferralCode(refFromUrl);
    if (hasSeenReferralIntro()) return;
    navigate(`/intro?ref=${encodeURIComponent(code)}`, { replace: true });
  }, [refFromUrl, navigate]);

  const { socialLoading, handleSocialSuccess, handleSocialError } = useSocialAuth({
    successMessage: 'تم إنشاء حسابك بنجاح',
    onAuthenticated: () => navigate('/'),
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const email = signupMode === 'email' ? formData.email.trim().toLowerCase() : '';
    const phone = signupMode === 'phone' ? formData.phone : '';

    const validationError = validateRegisterForm({
      name: formData.name,
      email,
      phone,
      password: formData.password,
      signupMode,
    });

    if (validationError) {
      setError(validationError);
      toast(validationError, 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await registerCustomer({
        name: formData.name.trim(),
        email: email || undefined,
        phone: phone || undefined,
        password: formData.password,
        referralCode: refCode || undefined,
      });

      login(data.user, data.token, {
        refreshToken: data.refreshToken,
        deviceId: data.deviceId,
      });
      clearReferralSession();
      toast(data.message || 'تم إنشاء حسابك بنجاح', 'success');
      navigate('/', { state: { suggestVerify: true } });
    } catch (err) {
      const message = getAuthErrorMessage(err, 'حدث خطأ أثناء إنشاء الحساب');
      setError(message);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || socialLoading;

  return (
    <AuthShell
      badge={refCode ? '🎉 دعوة من صديق' : 'ابدأ رحلتك'}
      title="أنشئ حسابك"
      subtitle="سجّل بالبريد الإلكتروني أو الهاتف مع كلمة مرور"
      highlights={['دقيقة واحدة', 'مجاني', 'ابدأ فوراً']}
      footer={
        <>
          لديك حساب؟{' '}
          <Link to={loginPathWithRef(refCode)} className="font-black text-amber-300 underline-offset-4 hover:underline">
            سجّل دخولك
          </Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-200"
          >
            {error}
          </div>
        )}

        {refCode && (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-center text-[11px] font-black text-amber-100">
            مرحباً بك عبر دعوة صديق — ستبدأ بمزايا إضافية
          </div>
        )}

        <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-xs font-black text-amber-200">
            1
          </span>
          <div>
            <p className="text-xs font-black text-white/90">بياناتك الأساسية</p>
            <p className="text-[10px] font-bold text-white/40">
              اسم + {signupMode === 'email' ? 'بريد' : 'هاتف'} + كلمة مرور
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
          <button
            type="button"
            onClick={() => {
              setSignupMode('email');
              setError('');
            }}
            disabled={busy}
            className={`rounded-xl py-2.5 text-xs font-black transition ${
              signupMode === 'email' ? 'bg-white text-gray-900 shadow' : 'text-white/60'
            }`}
          >
            بالبريد
          </button>
          <button
            type="button"
            onClick={() => {
              setSignupMode('phone');
              setError('');
            }}
            disabled={busy}
            className={`rounded-xl py-2.5 text-xs font-black transition ${
              signupMode === 'phone' ? 'bg-white text-gray-900 shadow' : 'text-white/60'
            }`}
          >
            بالهاتف
          </button>
        </div>

        <div className="space-y-3">
          <AuthField
            icon={User}
            name="name"
            type="text"
            placeholder="الاسم الكامل"
            value={formData.name}
            onChange={handleChange}
            disabled={busy}
            required
            minLength={2}
          />

          {signupMode === 'email' ? (
            <AuthField
              icon={Mail}
              name="email"
              type="email"
              placeholder="البريد الإلكتروني"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={busy}
              required
            />
          ) : (
            <PalestinianPhoneInput
              name="phone"
              variant="auth"
              value={formData.phone}
              onChange={handleChange}
              disabled={busy}
              required
            />
          )}

          <AuthField
            icon={Lock}
            name="password"
            type="password"
            placeholder="كلمة المرور (6 أحرف على الأقل)"
            value={formData.password}
            onChange={handleChange}
            minLength={6}
            autoComplete="new-password"
            disabled={busy}
            required
          />
        </div>

        <AuthPrimaryButton
          type="submit"
          loading={loading}
          disabled={busy || formData.password.length < 6}
        >
          {!loading && (
            <>
              إنشاء الحساب
              <ArrowLeft size={18} className="transition group-hover:-translate-x-0.5" />
            </>
          )}
        </AuthPrimaryButton>
      </form>

      <SocialAuthSection
        googleBtnId="googleBtnRegister"
        onSuccess={handleSocialSuccess}
        onError={(msg) => {
          setError(msg);
          handleSocialError(msg);
        }}
        disabled={busy}
        loading={socialLoading}
        loadingLabel="جاري إكمال التسجيل..."
      />
    </AuthShell>
  );
};

export default Register;
