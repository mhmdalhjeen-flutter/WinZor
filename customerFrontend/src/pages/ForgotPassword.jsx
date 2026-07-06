import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowLeft, Loader2 } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import AuthField from '../components/auth/AuthField';
import AuthPrimaryButton from '../components/auth/AuthPrimaryButton';
import { requestPasswordReset, resetPassword } from '../services/passwordService';
import { validatePasswordReset } from '../utils/passwordValidation';
import { useToast } from '../shared/Toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) {
      setError('أدخل البريد أو رقم الهاتف');
      return;
    }
    setLoading(true);
    try {
      const { data } = await requestPasswordReset(identifier.trim());
      toast(data.message || 'تم إرسال الرمز', 'success');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر إرسال الرمز');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    const validationError = validatePasswordReset({ code, newPassword, confirmPassword });
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      const { data } = await resetPassword({
        identifier: identifier.trim(),
        code: code.trim(),
        newPassword,
        confirmPassword,
      });
      toast(data.message || 'تم تعيين كلمة المرور', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر إعادة التعيين');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="استعادة الحساب"
      title="نسيت كلمة المرور؟"
      subtitle={step === 1 ? 'أدخل بريدك أو هاتفك لإرسال رمز OTP' : 'أدخل الرمز وكلمة المرور الجديدة'}
      footer={
        <Link to="/login" className="font-black text-amber-300 underline-offset-4 hover:underline">
          العودة لتسجيل الدخول
        </Link>
      }
    >
      {step === 1 ? (
        <form onSubmit={sendCode} className="space-y-4">
          {error && <p className="text-xs font-bold text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
          <AuthField
            icon={Mail}
            type="text"
            placeholder="0592222222 أو البريد الإلكتروني"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <AuthPrimaryButton type="submit" loading={loading}>
            {!loading && <>إرسال رمز التحقق <ArrowLeft size={18} /></>}
          </AuthPrimaryButton>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          {error && <p className="text-xs font-bold text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
          <AuthField icon={KeyRound} type="text" placeholder="رمز OTP (6 أرقام)" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required />
          <AuthField icon={Lock} type="password" placeholder="كلمة المرور الجديدة" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
          <AuthField icon={Lock} type="password" placeholder="تأكيد كلمة المرور" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
          <AuthPrimaryButton type="submit" loading={loading} disabled={loading}>
            {!loading && <>تعيين كلمة المرور <ArrowLeft size={18} /></>}
          </AuthPrimaryButton>
          <button type="button" onClick={() => setStep(1)} className="w-full text-xs font-bold text-white/50 hover:text-white/80">
            إعادة إرسال الرمز
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
