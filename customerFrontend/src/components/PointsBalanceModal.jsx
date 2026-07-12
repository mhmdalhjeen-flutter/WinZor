import React from 'react';
import { Sparkles, X } from 'lucide-react';

export default function PointsBalanceModal({ open, onClose, points = 0 }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-sm bg-gradient-to-b from-[#1a1033] to-[#0b1220] rounded-t-[32px] sm:rounded-[32px] p-8 text-center shadow-2xl border border-white/10"
        dir="rtl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 text-white/50 hover:text-white"
          aria-label="إغلاق"
        >
          <X size={22} />
        </button>

        <Sparkles className="mx-auto text-yellow-300 mb-4" size={32} />
        <p className="text-5xl font-black text-primary-light tabular-nums">{points}</p>
        <p className="text-sm font-black text-white/70 mt-2">نقطة</p>
      </div>
    </div>
  );
}
