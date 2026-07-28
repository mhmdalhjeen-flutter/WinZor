import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function OrderVerificationBadge({ code, className = '' }) {
  if (!code) return null;

  return (
    <div
      className={`mt-2 flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-2 ${className}`}
    >
      <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
      <span className="text-[11px] font-bold text-gray-500">رمز التحقق:</span>
      <span className="text-[13px] font-black tracking-wider text-emerald-700">{code}</span>
    </div>
  );
}
