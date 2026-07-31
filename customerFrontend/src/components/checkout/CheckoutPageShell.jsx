import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import CheckoutStepIndicator from './CheckoutStepIndicator';

export default function CheckoutPageShell({
  title,
  subtitle,
  currentStep = 1,
  backTo,
  onBack,
  children,
  footer,
  loading = false,
  error = null,
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (backTo) {
      navigate(backTo);
      return;
    }
    navigate(-1);
  };

  return (
    <div className="checkout-page" dir="rtl">
      <header className="checkout-page__head">
        <button
          type="button"
          className="checkout-page__back"
          onClick={handleBack}
          aria-label="رجوع"
        >
          <ArrowRight size={20} strokeWidth={2.5} />
        </button>
        <div className="checkout-page__titles">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>

      <CheckoutStepIndicator currentStep={currentStep} />

      {loading && (
        <div className="checkout-page__loading" role="status" aria-live="polite">
          <Loader2 size={28} className="animate-spin" />
          <span>جاري التحميل...</span>
        </div>
      )}

      {!loading && error && (
        <div className="checkout-page__error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && children}

      {footer && (
        <div className="checkout-page__footer">
          {footer}
        </div>
      )}
    </div>
  );
}
