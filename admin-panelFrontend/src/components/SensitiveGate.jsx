import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { getSensitiveToken, setSensitiveToken, clearSensitiveToken } from '../utils/sensitiveToken';
import { Shield, Lock, Loader2, KeyRound } from 'lucide-react';

const SensitiveGate = ({ children, title = 'منطقة حساسة' }) => {
  const [configured, setConfigured] = useState(null);
  const [unlocked, setUnlocked] = useState(!!getSensitiveToken());
  const [mode, setMode] = useState('login');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirm, setNewConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const loadStatus = () =>
    axios.get('/admin/sensitive/status')
      .then(({ data }) => setConfigured(!!data.configured))
      .catch((err) => {
        setConfigured(false);
        setError(err.response?.data?.message || 'تعذر التحقق من حالة كلمة المرور');
      });

  useEffect(() => { loadStatus(); }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await axios.post('/admin/sensitive/verify', { password });
      setSensitiveToken(data.sensitiveToken);
      setUnlocked(true);
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'فشل التحقق');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/admin/sensitive/setup', { password, confirmPassword: confirm });
      setMode('login');
      setConfirm('');
      setPassword('');
      await loadStatus();
      setSuccess('تم التعيين — أدخل كلمة المرور للدخول');
    } catch (err) {
      setError(err.response?.data?.message || 'فشل التعيين');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/admin/sensitive/change', {
        currentPassword,
        newPassword,
        confirmPassword: newConfirm,
      });
      clearSensitiveToken();
      setUnlocked(false);
      setMode('login');
      setCurrentPassword('');
      setNewPassword('');
      setNewConfirm('');
      setSuccess('تم تغيير كلمة المرور — أدخل الكلمة الجديدة');
    } catch (err) {
      setError(err.response?.data?.message || 'فشل التغيير');
    } finally {
      setLoading(false);
    }
  };

  if (configured === null) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (unlocked) return children;

  return (
    <div className="admin-page-container max-w-md mx-auto py-16" dir="rtl">
      <div className="admin-card p-8 space-y-6 text-center">
        <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-2xl flex items-center justify-center">
          <Shield className="text-amber-400" size={32} />
        </div>
        <h2 className="text-xl font-black text-white">{title}</h2>
        <p className="text-sm text-muted">كلمة مرور واحدة للصفحات الحساسة</p>

        {success && <p className="text-sm text-green-400 font-bold">{success}</p>}

        {!configured ? (
          <form onSubmit={handleSetup} className="space-y-4 text-right">
            <p className="text-xs text-muted text-center">التعيين لمرة واحدة فقط</p>
            <input type="password" className="admin-input w-full" placeholder="كلمة مرور جديدة (6+)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <input type="password" className="admin-input w-full" placeholder="تأكيد كلمة المرور" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            {error && <p className="text-danger text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? '...' : 'تعيين كلمة المرور'}</button>
          </form>
        ) : mode === 'change' ? (
          <form onSubmit={handleChange} className="space-y-4 text-right">
            <input type="password" className="admin-input w-full" placeholder="كلمة المرور الحالية" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            <input type="password" className="admin-input w-full" placeholder="كلمة المرور الجديدة" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            <input type="password" className="admin-input w-full" placeholder="تأكيد الجديدة" value={newConfirm} onChange={(e) => setNewConfirm(e.target.value)} required />
            {error && <p className="text-danger text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? '...' : 'حفظ التغيير'}</button>
            <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-xs text-muted underline w-full">رجوع للدخول</button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4 text-right">
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input type="password" className="admin-input w-full pr-10" placeholder="كلمة المرور الإضافية" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-danger text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? '...' : 'دخول'}</button>
            <button type="button" onClick={() => { setMode('change'); setError(''); setSuccess(''); }} className="text-xs text-muted flex items-center justify-center gap-1 w-full">
              <KeyRound size={12} /> تغيير كلمة المرور
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SensitiveGate;
