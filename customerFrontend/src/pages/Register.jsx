import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, RotateCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../shared/Toast';
import { registerCustomer, isGoogleAuthAvailable } from '../services/authService';
import { getAuthErrorMessage } from '../utils/authValidation';
import { getLocalPhoneError } from '../utils/phoneValidation';
import { useSocialAuth } from '../hooks/useSocialAuth';
import AuthExperienceShell from '../components/auth/AuthExperienceShell';
import AuthField from '../components/auth/AuthField';
import AuthPrimaryButton from '../components/auth/AuthPrimaryButton';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import AuthOrDivider from '../components/auth/AuthOrDivider';
import PalestinianPhoneInput from '../components/PalestinianPhoneInput';
import api from '../api/axios';
import {
  getReferralCode,
  saveReferralCode,
  hasSeenReferralIntro,
  clearReferralSession,
  registerPathWithRef,
  loginPathWithRef,
} from '../utils/referralStorage';

const RESEND_COOLDOWN_SEC = 60;

function PhoneVerificationStep({
  phone,
  onVerified,
  onBack,
}) {
  const { toast } = useToast();
  const { updateUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSeconds, setResendSeconds] = useState(RESEND_COOLDOWN_SEC);
  const [initialSent, setInitialSent] = useState(false);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  useEffect(() => {
    if (initialSent) return undefined;
    let cancelled = false;

    const sendCode = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.post('/auth/verify/request', { channel: 'phone' });
        if (!cancelled) {
          setInitialSent(true);
          setResendSeconds(RESEND_COOLDOWN_SEC);
          toast(data.message || 'تم إرسال رمز التحقق', 'success');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'تعذّر إرسال رمز التحقق');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    sendCode();
    return () => { cancelled = true; };
  }, [initialSent, toast]);

  const resendCode = async () => {
    if (loading || resendSeconds > 0) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify/request', { channel: 'phone' });
      setResendSeconds(RESEND_COOLDOWN_SEC);
      toast(data.message || 'تم إعادة إرسال الرمز', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر إعادة الإرسال');
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    if (!code.trim()) {
      setError('أدخل رمز التحقق');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify/confirm', { channel: 'phone', code: code.trim() });
      updateUser({
        ...data.user,
        points: data.points,
        isVerified: true,
        phoneVerified: data.user?.phoneVerified,
      });
      toast(data.message || 'تم تفعيل حسابك', 'success');
      onVerified?.();
    } catch (err) {
      setError(err.response?.data?.message || 'رمز غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-black text-white">تفعيل الحساب</h2>
        <p className="text-sm font-bold leading-relaxed text-white/60">
          لقد أرسلنا رمز التحقق إلى رقم هاتفك
          {phone ? (
            <>
              <br />
              <span className="text-amber-200/90 font-mono" dir="ltr">{phone}</span>
            </>
          ) : null}
        </p>
        <p className="text-xs font-bold text-white/45">
          Please enter the code to activate your account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-200"
        >
          {error}
        </div>
      )}

      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="رمز التحقق"
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
          if (error) setError('');
        }}
        disabled={loading}
        className="w-full rounded-2xl border border-white/12 bg-white/[0.08] py-4 text-center text-2xl font-black tracking-[0.35em] text-white outline-none transition placeholder:text-sm placeholder:tracking-normal placeholder:font-bold placeholder:text-white/30 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 disabled:opacity-50"
        dir="ltr"
      />

      <AuthPrimaryButton type="button" onClick={confirmCode} loading={loading} disabled={loading || !code.trim()}>
        {!loading && 'تأكيد وتفعيل الحساب'}
      </AuthPrimaryButton>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="text-xs font-bold text-white/50 hover:text-white/80 transition disabled:opacity-50"
        >
          تعديل البيانات
        </button>
        <button
          type="button"
          onClick={resendCode}
          disabled={loading || resendSeconds > 0}
          className="inline-flex items-center gap-1.5 text-xs font-black text-amber-300/90 disabled:opacity-40"
        >
          <RotateCw size={14} />
          {resendSeconds > 0 ? `إعادة الإرسال (${resendSeconds})` : 'إعادة إرسال الرمز'}
        </button>
      </div>
    </div>
  );
}

const Register = () => {
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();
  const refFromUrl = (searchParams.get('ref') || '').trim().toUpperCase();
  const refCode = refFromUrl || getReferralCode();
  const showGoogle = isGoogleAuthAvailable();

  useEffect(() => {
    const code = refFromUrl || getReferralCode();
    if (!code) return;
    if (refFromUrl) saveReferralCode(refFromUrl);
    if (hasSeenReferralIntro()) return;
    navigate(`/intro?ref=${encodeURIComponent(code)}`, { replace: true });
  }, [refFromUrl, navigate]);

  const { socialLoading, startSocialLoading, handleSocialSuccess, handleSocialError } = useSocialAuth({
    successMessage: 'تم إنشاء حسابك بنجاح',
    onAuthenticated: () => {
      clearReferralSession();
      navigate('/');
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateForm = () => {
    const phoneErr = getLocalPhoneError(formData.phone);
    if (phoneErr) return phoneErr;
    if (!formData.password) return 'أدخل كلمة المرور';
    if (formData.password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    if (formData.password !== formData.confirmPassword) return 'كلمتا المرور غير متطابقتين';
    return null;
  };

  const handleRegister = async (e) => {
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
      const data = await registerCustomer({
        name: 'مستخدم جديد',
        phone: formData.phone,
        password: formData.password,
        referralCode: refCode || undefined,
      });

      login(data.user, data.token, {
        refreshToken: data.refreshToken,
        deviceId: data.deviceId,
      });
      clearReferralSession();
      setStep('verify');
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
    <AuthExperienceShell
      footer={
        step === 'form' ? (
          <>
            لديك حساب؟{' '}
            <Link to={loginPathWithRef(refCode)} className="font-black text-amber-300 underline-offset-4 hover:underline">
              سجّل دخولك
            </Link>
          </>
        ) : null
      }
    >
      {step === 'verify' ? (
        <PhoneVerificationStep
          phone={formData.phone}
          onVerified={() => navigate('/')}
          onBack={() => setStep('form')}
        />
      ) : (
        <div className="space-y-5">
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

          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <div className="space-y-1">
              <label className="text-xs font-black text-white/70">رقم الهاتف</label>
              <PalestinianPhoneInput
                name="phone"
                variant="auth"
                value={formData.phone}
                onChange={handleChange}
                disabled={busy}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-white/70">كلمة المرور</label>
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

            <div className="space-y-1">
              <label className="text-xs font-black text-white/70">تأكيد كلمة المرور</label>
              <AuthField
                icon={Lock}
                name="confirmPassword"
                type="password"
                placeholder="أعد إدخال كلمة المرور"
                value={formData.confirmPassword}
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
                  إنشاء حساب
                  <ArrowLeft size={18} className="transition group-hover:-translate-x-0.5" />
                </>
              )}
            </AuthPrimaryButton>
          </form>
        </div>
      )}
    </AuthExperienceShell>
  );
};

export default Register;
