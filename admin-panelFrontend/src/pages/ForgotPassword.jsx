import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, KeyRound } from 'lucide-react';
import { BRAND_LOGO_128, BRAND_NAME } from '../utils/brandAssets';
import { requestPasswordReset, resetPassword, validatePasswordReset } from '../services/passwordService';
import '../style/login.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');

  const sendCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) {
      setError('أدخل البريد الإلكتروني');
      return;
    }
    setLoading(true);
    try {
      const { data } = await requestPasswordReset(identifier.trim());
      if (data.devCode) setDevCode(data.devCode);
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
      await resetPassword({
        identifier: identifier.trim(),
        code: code.trim(),
        newPassword,
        confirmPassword,
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر إعادة التعيين');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="flex justify-center mb-4">
            <img
              src={BRAND_LOGO_128}
              alt={BRAND_NAME}
              width={80}
              height={80}
              className="w-20 h-20 rounded-2xl object-contain shadow-lg"
            />
          </div>
          <h2>استعادة كلمة المرور</h2>
          <p className="text-muted text-sm mt-2">لوحة التحكم الإدارية</p>
        </div>

        <form className="login-form" onSubmit={step === 1 ? sendCode : handleReset}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs mb-4 text-center font-bold">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="form-group">
              <label>البريد الإلكتروني</label>
              <div className="login-input-wrapper">
                <Mail size={18} />
                <input
                  type="email"
                  className="login-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <>
              {devCode && (
                <p className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-2 mb-3 text-center">
                  رمز التطوير: {devCode}
                </p>
              )}
              {[
                { label: 'رمز OTP', value: code, set: setCode, type: 'text', icon: KeyRound },
                { label: 'كلمة المرور الجديدة', value: newPassword, set: setNewPassword, type: 'password', icon: Lock },
                { label: 'تأكيد كلمة المرور', value: confirmPassword, set: setConfirmPassword, type: 'password', icon: Lock },
              ].map((field) => (
                <div className="form-group" key={field.label}>
                  <label>{field.label}</label>
                  <div className="login-input-wrapper">
                    <field.icon size={18} />
                    <input
                      type={field.type}
                      className="login-input"
                      value={field.value}
                      onChange={(e) => field.set(e.target.value)}
                      minLength={field.type === 'password' ? 8 : undefined}
                      required
                    />
                  </div>
                </div>
              ))}
            </>
          )}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : step === 1 ? 'إرسال رمز OTP' : 'تعيين كلمة المرور'}
          </button>

          <p className="text-center text-xs mt-4">
            <Link to="/login" className="text-primary font-bold">العودة لتسجيل الدخول</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
