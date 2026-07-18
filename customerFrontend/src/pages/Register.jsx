import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowLeft, RotateCw, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../shared/Toast';
import { registerCustomer, isGoogleAuthAvailable } from '../services/authService';
import { getAuthErrorMessage } from '../utils/authValidation';
import { getLocalPhoneError } from '../utils/phoneValidation';
import { useSocialAuth } from '../hooks/useSocialAuth';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import PalestinianPhoneInput from '../components/PalestinianPhoneInput';
import api from '../api/axios';
import { BRAND_LOGO_256, BRAND_NAME } from '../utils/brandAssets';
import AuthWelcomeBackground from '../components/auth/AuthWelcomeBackground';
import {
  getReferralCode,
  saveReferralCode,
  hasSeenReferralIntro,
  clearReferralSession,
  loginPathWithRef,
} from '../utils/referralStorage';

const RESEND_COOLDOWN_SEC = 60;

function RegisterLightField({
  icon: Icon,
  type = 'text',
  className = '',
  ...props
}) {
  const isPassword = type === 'password';
  const [show, setShow] = useState(false);

  return (
    <div className="group relative">
      {Icon && (
        <Icon
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-blue-500"
        />
      )}
      <input
        {...props}
        type={isPassword && show ? 'text' : type}
        className={`w-full rounded-2xl border border-gray-200/90 bg-white/90 py-4 text-sm font-bold text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/15 disabled:cursor-not-allowed disabled:opacity-50 ${
          Icon ? 'pr-12 pl-4' : 'px-4'
        } ${isPassword ? 'pl-12' : ''} ${className}`}
      />
      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
          aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}

function PhoneVerificationStep({ phone, onVerified, onBack }) {
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
        <h2 className="text-xl font-black text-gray-900">تفعيل الحساب</h2>
        <p className="text-sm font-bold leading-relaxed text-gray-600">
          لقد أرسلنا رمز التحقق إلى رقم هاتفك
          {phone ? (
            <>
              <br />
              <span className="text-blue-600 font-mono" dir="ltr">{phone}</span>
            </>
          ) : null}
        </p>
        <p className="text-xs font-bold text-gray-500">
          Please enter the code to activate your account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700"
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
        className="w-full rounded-2xl border border-gray-200 bg-white py-4 text-center text-2xl font-black tracking-[0.35em] text-gray-900 shadow-sm outline-none transition placeholder:text-sm placeholder:tracking-normal placeholder:font-bold placeholder:text-gray-400 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/15 disabled:opacity-50"
        dir="ltr"
      />

      <button
        type="button"
        onClick={confirmCode}
        disabled={loading || !code.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-red-600 via-red-500 to-amber-500 py-4 text-sm font-black text-white shadow-[0_12px_32px_rgba(220,38,38,0.28)] transition hover:brightness-105 disabled:opacity-60"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : 'تأكيد وتفعيل الحساب'}
      </button>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="text-xs font-bold text-gray-500 hover:text-gray-800 transition disabled:opacity-50"
        >
          تعديل البيانات
        </button>
        <button
          type="button"
          onClick={resendCode}
          disabled={loading || resendSeconds > 0}
          className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 disabled:opacity-40"
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
  const [phoneOpen, setPhoneOpen] = useState(false);
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
    <div className="relative min-h-screen overflow-x-hidden bg-[#fff9f5] font-['Cairo'] text-gray-900" dir="rtl">
      <AuthWelcomeBackground />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-6 pb-8 sm:max-w-xl sm:px-6">
        <div className="mb-5 flex items-center justify-start">
          <Link
            to="/intro"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/75 px-3 py-2 text-[11px] font-bold text-gray-700 shadow-sm backdrop-blur-md transition hover:bg-white"
          >
            <ArrowLeft size={14} />
            العودة للترحيب
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex justify-center"
        >
          <div className="relative flex items-center justify-center">
            <div
              className="absolute inset-0 scale-110 rounded-[2rem] bg-gradient-to-br from-red-200/40 via-blue-200/35 to-emerald-200/40 blur-2xl"
              aria-hidden
            />
            <img
              src={BRAND_LOGO_256}
              alt={BRAND_NAME}
              className="relative z-[1] h-[7.5rem] w-[7.5rem] object-contain drop-shadow-[0_18px_40px_rgba(15,23,42,0.14)] sm:h-[9rem] sm:w-[9rem]"
              width={144}
              height={144}
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7"
        >
          {step === 'verify' ? (
            <PhoneVerificationStep
              phone={formData.phone}
              onVerified={() => navigate('/')}
              onBack={() => setStep('form')}
            />
          ) : (
            <div className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700"
                >
                  {error}
                </div>
              )}

              {refCode && (
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-2.5 text-center text-[11px] font-black text-amber-800">
                  مرحباً بك عبر دعوة صديق — ستبدأ بمزايا إضافية
                </div>
              )}

              <div className="space-y-3">
                {showGoogle && (
                  <div className="relative register-premium-google [&_button]:relative [&_button]:z-[1] [&_button]:min-h-[4.35rem] [&_button]:rounded-[1.35rem] [&_button]:border-2 [&_button]:border-white [&_button]:px-5 [&_button]:py-5 [&_button]:text-base [&_button]:font-black [&_button]:shadow-[0_14px_36px_rgba(66,133,244,0.22),0_6px_18px_rgba(15,23,42,0.08)] [&_button]:ring-2 [&_button]:ring-blue-100 [&_svg]:h-9 [&_svg]:w-9 [&_p]:hidden">
                    <div className="pointer-events-none absolute -inset-0.5 rounded-[1.4rem] bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#34A853] opacity-25 blur-[2px]" aria-hidden />
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
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setPhoneOpen((open) => !open)}
                  disabled={busy}
                  className={`group flex w-full items-center justify-center gap-3 rounded-[1.35rem] border-2 px-5 py-5 text-base font-black transition-all duration-300 disabled:opacity-60 ${
                    phoneOpen
                      ? 'border-blue-300 bg-blue-50 text-blue-800 shadow-inner'
                      : 'border-gray-200 bg-white text-gray-800 shadow-[0_10px_28px_rgba(15,23,42,0.07)] hover:border-blue-200 hover:shadow-[0_14px_32px_rgba(59,130,246,0.12)]'
                  }`}
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    phoneOpen ? 'bg-blue-500 text-white' : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
                  }`}>
                    <Phone size={22} strokeWidth={2.25} />
                  </span>
                  <span>المتابعة برقم الهاتف</span>
                </button>
              </div>

              <AnimatePresence initial={false}>
                {phoneOpen && (
                  <motion.div
                    key="phone-form"
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleRegister} className="space-y-4 border-t border-gray-100 pt-4">
                      <div className="space-y-1">
                        <label className="text-xs font-black text-gray-600">رقم الهاتف</label>
                        <PalestinianPhoneInput
                          name="phone"
                          variant="light"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={busy}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-gray-600">كلمة المرور</label>
                        <RegisterLightField
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
                        <label className="text-xs font-black text-gray-600">تأكيد كلمة المرور</label>
                        <RegisterLightField
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

                      <button
                        type="submit"
                        disabled={busy || formData.password.length < 6}
                        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-red-600 via-red-500 to-amber-500 py-4 text-sm font-black text-white shadow-[0_12px_32px_rgba(220,38,38,0.28)] transition hover:brightness-105 disabled:opacity-60"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <>
                            إنشاء حساب
                            <ArrowLeft size={18} className="transition group-hover:-translate-x-0.5" />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {step === 'form' && (
          <div className="mt-6 text-center text-sm font-bold text-gray-600">
            لديك حساب؟{' '}
            <Link to={loginPathWithRef(refCode)} className="font-black text-blue-600 underline-offset-4 hover:underline">
              سجّل دخولك
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
