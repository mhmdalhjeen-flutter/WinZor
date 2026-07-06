import React from 'react';
import { Loader2 } from 'lucide-react';

const AuthPrimaryButton = ({
  children,
  loading = false,
  disabled = false,
  type = 'button',
  variant = 'primary',
  className = '',
  ...props
}) => {
  const variants = {
    primary:
      'bg-gradient-to-l from-red-600 via-red-500 to-amber-500 shadow-[0_12px_32px_rgba(220,38,38,0.35)] hover:brightness-110',
    secondary:
      'bg-white/10 border border-white/15 shadow-none hover:bg-white/15',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`group flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-white transition disabled:opacity-60 ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={20} /> : children}
    </button>
  );
};

export default AuthPrimaryButton;
