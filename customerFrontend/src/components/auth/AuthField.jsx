import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const AuthField = ({ icon: Icon, type = 'text', ...props }) => {
  const isPassword = type === 'password';
  const [show, setShow] = useState(false);

  return (
    <div className="group relative">
      {Icon && (
        <Icon
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition group-focus-within:text-amber-300"
        />
      )}
      <input
        {...props}
        type={isPassword && show ? 'text' : type}
        className={`w-full rounded-2xl border border-white/10 bg-white/[0.07] py-4 text-sm font-bold text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50 focus:bg-white/[0.1] focus:ring-2 focus:ring-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50 ${
          Icon ? 'pr-12 pl-4' : 'px-4'
        } ${isPassword ? 'pl-12' : ''} ${props.className || ''}`}
      />
      {isPassword && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-amber-300"
          aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
};

export default AuthField;
