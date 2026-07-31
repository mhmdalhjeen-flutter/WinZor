import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Loader2,
  Lock,
  RotateCw,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../shared/Toast';
import {
  loginCustomer,
  registerCustomer,
  sendRegistrationOtp,
  verifyRegistrationOtp,
} from '../../services/authService';
import { getAuthErrorMessage } from '../../utils/authValidation';
import { getLocalPhoneError } from '../../utils/phoneValidation';
import { getReferralCode, clearReferralSession } from '../../utils/referralStorage';
import PalestinianPhoneInput from '../PalestinianPhoneInput';

const RESEND_COOLDOWN_SEC = 60;

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -24 : 24, opacity: 0 }),
};

function PasswordField({ value, onChange, placeholder, disabled, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="group relative">
      <Lock
        size={16}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-emerald-600"
      />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        minLength={6}
        className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pr-10 pl-10 text-sm font-bold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15 disabled:opacity-50"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((v) => !v)}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        aria-label={show ? 'إخفاء' : 'إظهار'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function ModeSwitchLink({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mb-3 w-full text-center text-[11px] font-bold leading-relaxed text-gray-500 transition hover:text-gray-700 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

const PhoneAuthFlow = ({ onBack, onSuccess, busy: externalBusy = false }) => {
  const [mode, setMode] = useState('signup');
  const [step, setStep] = useState('info');
  const [direction, setDirection] = useState(1);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  const { login } = useAuth();
  const { toast } = useToast();
  const referralCode = getReferralCode();
  const busy = loading || externalBusy;

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const goToStep = useCallback((nextStep, dir = 1) => {
    setDirection(dir);
    setStep(nextStep);
    setError('');
  }, []);

  const switchMode = useCallback((nextMode) => {
    setMode(nextMode);
    setStep('info');
    setError('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setOtpSent(false);
    setResendSeconds(0);
  }, []);

  const validateSignupInfo = () => {
    if (!name.trim()) return 'أدخل الاسم الكامل';
    const phoneErr = getLocalPhoneError(phone);
    if (phoneErr) return phoneErr;
    return null;
  };

  const validateSignupOtp = () => {
    if (!otp.trim()) return 'أدخل رمز التحقق';
    if (!password) return 'أدخل كلمة المرور';
    if (password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    if (password !== confirmPassword) return 'كلمتا المرور غير متطابقتين';
    return null;
  };

  const validateLogin = () => {
    const phoneErr = getLocalPhoneError(phone);
    if (phoneErr) return phoneErr;
    if (!password) return 'أدخل كلمة المرور';
    if (password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    return null;
  };

  const handleSendOtp = async () => {
    const validationError = validateSignupInfo();
    if (validationError) {
      setError(validationError);
      toast(validationError, 'error');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await sendRegistrationOtp(phone);
      setOtpSent(true);
      setResendSeconds(RESEND_COOLDOWN_SEC);
      toast(data.message || 'تم إرسال رمز التحقق', 'success');
      goToStep('otp', 1);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'تعذّر إرسال رمز التحقق'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (busy || resendSeconds > 0) return;
    setLoading(true);
    setError('');
    try {
      const data = await sendRegistrationOtp(phone);
      setResendSeconds(RESEND_COOLDOWN_SEC);
      toast(data.message || 'تم إعادة إرسال الرمز', 'success');
    } catch (err) {
      setError(getAuthErrorMessage(err, 'تعذّر إعادة الإرسال'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    const validationError = validateSignupOtp();
    if (validationError) {
      setError(validationError);
      toast(validationError, 'error');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await verifyRegistrationOtp(phone, otp.trim());

      const data = await registerCustomer({
        name: name.trim(),
        phone,
        password,
        referralCode: referralCode || undefined,
      });

      login(data.user, data.token, {
        refreshToken: data.refreshToken,
        deviceId: data.deviceId,
      });
      clearReferralSession();
      toast(data.message || 'تم إنشاء حسابك بنجاح', 'success');
      onSuccess?.();
    } catch (err) {
      setError(getAuthErrorMessage(err, 'رمز غير صحيح أو فشل إنشاء الحساب'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    const validationError = validateLogin();
    if (validationError) {
      setError(validationError);
      toast(validationError, 'error');
      return;
    }

    setLoading(true);
    setError('');
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
      onSuccess?.();
    } catch (err) {
      setError(getAuthErrorMessage(err, 'خطأ في تسجيل الدخول'));
    } finally {
      setLoading(false);
    }
  };

  const renderSignupInfo = () => (
    <div className="space-y-4">
      <ModeSwitchLink onClick={() => switchMode('login')} disabled={busy}>
        لديك حساب بالفعل؟{' '}
        <span className="font-black text-emerald-600 underline-offset-2 hover:underline">
          سجّل دخولك
        </span>
      </ModeSwitchLink>

      <div className="space-y-1">
        <label className="text-xs font-black text-gray-600">الاسم الكامل</label>
        <div className="group relative">
          <User
            size={16}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-emerald-600"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="اسمك الكامل"
            disabled={busy}
            autoComplete="name"
            className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pr-10 pl-4 text-sm font-bold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-black text-gray-600">رقم الهاتف</label>
        <PalestinianPhoneInput
          name="phone"
          variant="light"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (error) setError('');
          }}
          disabled={busy}
          required
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowRight size={16} />
          رجوع
        </button>
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={busy}
          className="flex min-h-[48px] flex-[1.4] items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-emerald-600 to-emerald-500 text-sm font-black text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'إرسال رمز التحقق'}
        </button>
      </div>
    </div>
  );

  const renderSignupOtp = () => (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h4 className="text-base font-black text-gray-900">التحقق من رقم الهاتف</h4>
        <p className="text-xs font-bold leading-relaxed text-gray-500">
          أرسلنا رمز التحقق إلى
          {phone ? (
            <>
              {' '}
              <span className="font-mono text-emerald-600" dir="ltr">{phone}</span>
            </>
          ) : null}
        </p>
      </div>

      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="رمز التحقق"
        value={otp}
        onChange={(e) => {
          setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
          if (error) setError('');
        }}
        disabled={busy}
        className="w-full rounded-xl border border-gray-200 bg-white py-3.5 text-center text-xl font-black tracking-[0.3em] text-gray-900 outline-none transition placeholder:text-sm placeholder:tracking-normal placeholder:font-bold placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15 disabled:opacity-50"
        dir="ltr"
      />

      <div className="space-y-1">
        <label className="text-xs font-black text-gray-600">كلمة المرور</label>
        <PasswordField
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError('');
          }}
          placeholder="6 أحرف على الأقل"
          disabled={busy}
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-black text-gray-600">تأكيد كلمة المرور</label>
        <PasswordField
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (error) setError('');
          }}
          placeholder="أعد إدخال كلمة المرور"
          disabled={busy}
          autoComplete="new-password"
        />
      </div>

      <button
        type="button"
        onClick={handleVerifyAndRegister}
        disabled={busy || !otp.trim()}
        className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-emerald-600 to-emerald-500 text-sm font-black text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : 'تأكيد وإنشاء الحساب'}
      </button>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => goToStep('info', -1)}
          disabled={busy}
          className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 disabled:opacity-50"
        >
          <ArrowRight size={14} />
          تعديل البيانات
        </button>
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={busy || resendSeconds > 0 || !otpSent}
          className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 disabled:opacity-40"
        >
          <RotateCw size={14} />
          {resendSeconds > 0 ? `إعادة الإرسال (${resendSeconds})` : 'إعادة إرسال الرمز'}
        </button>
      </div>
    </div>
  );

  const renderLogin = () => (
    <form onSubmit={handleLogin} className="space-y-4" noValidate>
      <ModeSwitchLink onClick={() => switchMode('signup')} disabled={busy}>
        مستخدم جديد؟{' '}
        <span className="font-black text-emerald-600 underline-offset-2 hover:underline">
          أنشئ حساباً
        </span>
      </ModeSwitchLink>

      <div className="space-y-1">
        <label className="text-xs font-black text-gray-600">رقم الهاتف</label>
        <PalestinianPhoneInput
          name="phone"
          variant="light"
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
        <label className="text-xs font-black text-gray-600">كلمة المرور</label>
        <PasswordField
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError('');
          }}
          placeholder="كلمة المرور"
          disabled={busy}
          autoComplete="current-password"
        />
      </div>

      <div className="text-left">
        <Link
          to="/forgot-password"
          className="text-xs font-bold text-emerald-600 hover:underline"
        >
          نسيت كلمة المرور؟
        </Link>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowRight size={16} />
          رجوع
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex min-h-[48px] flex-[1.4] items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-emerald-600 to-emerald-500 text-sm font-black text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'تسجيل الدخول'}
        </button>
      </div>
    </form>
  );

  const contentKey = mode === 'login' ? 'login' : step;

  return (
    <div className="space-y-3">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700"
        >
          {error}
        </div>
      )}

      {referralCode && mode === 'signup' && step === 'info' && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-center text-[11px] font-black text-amber-800">
          مرحباً بك عبر دعوة صديق — ستبدأ بمزايا إضافية
        </div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={contentKey}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {mode === 'login' && renderLogin()}
          {mode === 'signup' && step === 'info' && renderSignupInfo()}
          {mode === 'signup' && step === 'otp' && renderSignupOtp()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PhoneAuthFlow;
