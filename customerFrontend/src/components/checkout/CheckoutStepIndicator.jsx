import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'مراجعة' },
  { id: 2, label: 'الاستلام' },
  { id: 3, label: 'الدفع' },
  { id: 4, label: 'التفاصيل' },
  { id: 5, label: 'التأكيد' },
];

export default function CheckoutStepIndicator({ currentStep = 1 }) {
  return (
    <nav className="checkout-steps" aria-label="خطوات إتمام الطلب">
      {STEPS.map((step, index) => {
        const done = step.id < currentStep;
        const active = step.id === currentStep;
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.id} className="checkout-steps__item">
            <div className="checkout-steps__node-wrap">
              <div
                className={[
                  'checkout-steps__node',
                  done && 'checkout-steps__node--done',
                  active && 'checkout-steps__node--active',
                ].filter(Boolean).join(' ')}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check size={12} strokeWidth={3} /> : step.id}
              </div>
              {!isLast && (
                <div
                  className={[
                    'checkout-steps__line',
                    done && 'checkout-steps__line--done',
                  ].filter(Boolean).join(' ')}
                />
              )}
            </div>
            <span
              className={[
                'checkout-steps__label',
                active && 'checkout-steps__label--active',
              ].filter(Boolean).join(' ')}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
