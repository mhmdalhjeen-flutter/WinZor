import React from 'react';
import {
  Banknote, Handshake, Landmark, Smartphone, Wallet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PAYMENT_METHOD_OPTIONS, PAYMENT_METHODS } from '../../utils/checkoutConstants';

const ICONS = {
  [PAYMENT_METHODS.CASH_ON_DELIVERY]: Banknote,
  [PAYMENT_METHODS.SELLER_AGREEMENT]: Handshake,
  [PAYMENT_METHODS.BANK_PALESTINE]: Landmark,
  [PAYMENT_METHODS.PALPAY]: Wallet,
  [PAYMENT_METHODS.JAWWAL_PAY]: Smartphone,
};

const ICON_VARIANTS = {
  [PAYMENT_METHODS.CASH_ON_DELIVERY]: 'checkout-option__icon--cash',
  [PAYMENT_METHODS.SELLER_AGREEMENT]: 'checkout-option__icon--agreement',
  [PAYMENT_METHODS.BANK_PALESTINE]: 'checkout-option__icon--bank',
  [PAYMENT_METHODS.PALPAY]: 'checkout-option__icon--palpay',
  [PAYMENT_METHODS.JAWWAL_PAY]: 'checkout-option__icon--jawwal',
};

export default function PaymentMethodSection({
  value,
  onChange,
  disableDigital = false,
  unavailableMethods = [],
}) {
  return (
    <section className="checkout-section checkout-section--payment" aria-labelledby="payment-method-title">
      <div className="checkout-options checkout-options--payment">
        <AnimatePresence initial={false}>
          {PAYMENT_METHOD_OPTIONS.map((option, index) => {
            const Icon = ICONS[option.id] || Banknote;
            const selected = value === option.id;
            const disabled = !option.available
              || (disableDigital && option.digital)
              || unavailableMethods.includes(option.id);

            return (
              <motion.div
                key={option.id}
                className="checkout-options__wrap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, type: 'spring', stiffness: 420, damping: 32 }}
              >
                <button
                  type="button"
                  className={[
                    'checkout-option checkout-option--payment-card',
                    selected && 'checkout-option--selected',
                    disabled && 'checkout-option--disabled',
                  ].filter(Boolean).join(' ')}
                  onClick={() => !disabled && onChange(option.id)}
                  disabled={disabled}
                  aria-pressed={selected}
                >
                  <div className={`checkout-option__icon ${ICON_VARIANTS[option.id] || ''}`}>
                    <Icon size={22} strokeWidth={2.2} />
                  </div>
                  <div className="checkout-option__text">
                    <span className="checkout-option__label">{option.label}</span>
                    <span className="checkout-option__desc">{option.description}</span>
                  </div>
                  <div className={[
                    'checkout-option__radio',
                    selected && 'checkout-option__radio--checked',
                  ].filter(Boolean).join(' ')} />
                </button>

                {disableDigital && option.digital && (
                  <p className="checkout-option__hint">
                    متاح عند طلب متجر واحد فقط
                  </p>
                )}
                {!disableDigital && unavailableMethods.includes(option.id) && (
                  <p className="checkout-option__hint">
                    غير متاح — لم يُفعّل المتجر هذا الخيار
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
