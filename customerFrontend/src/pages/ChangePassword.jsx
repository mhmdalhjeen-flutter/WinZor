import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import { changePassword } from '../services/passwordService';
import { validatePasswordChange } from '../utils/passwordValidation';
import { useToast } from '../shared/Toast';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validationError = validatePasswordChange(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      const { data } = await changePassword(form);
      toast(data.message || 'تم تغيير كلمة المرور', 'success');
      navigate('/center');
    } catch (err) {
      setError(err.response?.data?.message || 'تعذّر تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto space-y-5 text-right" dir="rtl">
      <button type="button" onClick={() => navigate(-1)} className="text-sm font-bold text-gray-500 flex items-center gap-1">
        <ArrowRight size={16} /> رجوع
      </button>

      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Lock className="text-primary" size={26} /> تغيير كلمة المرور
        </h1>
        <p className="text-sm text-gray-500 font-bold mt-1">أدخل كلمة المرور الحالية ثم الجديدة</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[24px] border border-gray-100 p-5 space-y-4 shadow-sm">
        {error && <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

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
                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pr-10 pl-3 text-sm font-bold outline-none focus:border-primary/40"
                minLength={6}
                required
              />
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3.5 rounded-2xl font-black disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'حفظ كلمة المرور'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
