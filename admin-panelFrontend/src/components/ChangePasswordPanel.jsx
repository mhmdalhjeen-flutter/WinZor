import React, { useState } from 'react';
import { Lock, KeyRound, Loader2 } from 'lucide-react';
import { changePassword, validatePasswordChange } from '../services/passwordService';

const ChangePasswordPanel = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    const validationError = validatePasswordChange(form, 8);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      const { data } = await changePassword(form);
      setMsg(data.message || 'تم تغيير كلمة المرور');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-card p-6 max-w-lg" dir="rtl">
      <h2 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
        <Lock size={20} className="text-primary" /> تغيير كلمة المرور
      </h2>
      <p className="text-xs text-gray-500 mb-4">كلمة مرور حساب الأدمن (8 أحرف على الأقل)</p>

      {msg && <p className="text-sm font-bold text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2 mb-3">{msg}</p>}
      {error && <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: 'currentPassword', label: 'كلمة المرور الحالية', icon: Lock },
          { key: 'newPassword', label: 'كلمة المرور الجديدة', icon: KeyRound },
          { key: 'confirmPassword', label: 'تأكيد كلمة المرور', icon: KeyRound },
        ].map(({ key, label, icon: Icon }) => (
          <div key={key}>
            <label className="text-xs font-black text-gray-600 mb-1 block">{label}</label>
            <div className="relative">
              <Icon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="admin-input w-full pr-10"
                minLength={8}
                required
              />
            </div>
          </div>
        ))}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'حفظ كلمة المرور'}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordPanel;
