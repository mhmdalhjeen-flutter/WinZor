import React from 'react';
import { Loader2 } from 'lucide-react';

export default function CheckoutFixedBar({
  label,
  onClick,
  disabled = false,
  loading = false,
  icon: Icon = null,
  hint = null,
}) {
  return (
    <div className="checkout-fixed-bar">
      {hint && <p className="checkout-fixed-bar__hint">{hint}</p>}
      <button
        type="button"
        className="checkout-fixed-bar__btn"
        onClick={onClick}
        disabled={disabled || loading}
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : Icon ? (
          <Icon size={20} strokeWidth={2.2} />
        ) : null}
        {label}
      </button>
    </div>
  );
}
