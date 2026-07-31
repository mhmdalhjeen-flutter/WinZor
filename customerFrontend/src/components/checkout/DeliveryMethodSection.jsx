import React from 'react';
import { MapPin, Store, Truck, Clock } from 'lucide-react';
import { DELIVERY_METHOD_OPTIONS, DELIVERY_METHODS } from '../../utils/checkoutConstants';

const ICONS = {
  [DELIVERY_METHODS.NEARBY]: MapPin,
  [DELIVERY_METHODS.PICKUP]: Store,
  [DELIVERY_METHODS.DELIVERY]: Truck,
};

export default function DeliveryMethodSection({
  value,
  locationDetails,
  onChange,
  onLocationChange,
  error = null,
}) {
  return (
    <section className="checkout-section" aria-labelledby="delivery-method-title">
      <h3 id="delivery-method-title" className="checkout-section__title">
        طريقة الاستلام
      </h3>

      <div className="checkout-options">
        {DELIVERY_METHOD_OPTIONS.map((option) => {
          const Icon = ICONS[option.id] || MapPin;
          const selected = value === option.id;
          const disabled = !option.available;

          return (
            <div key={option.id} className="checkout-options__wrap">
              <button
                type="button"
                className={[
                  'checkout-option',
                  selected && 'checkout-option--selected',
                  disabled && 'checkout-option--disabled',
                ].filter(Boolean).join(' ')}
                onClick={() => !disabled && onChange(option.id)}
                disabled={disabled}
                aria-pressed={selected}
              >
                <div className="checkout-option__icon">
                  <Icon size={20} strokeWidth={2.2} />
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

              {option.id === DELIVERY_METHODS.DELIVERY && disabled && (
                <div className="checkout-option__soon">
                  <Clock size={14} />
                  <span>ستتوفر الخدمة قريباً</span>
                </div>
              )}

              {selected && option.requiresLocation && (
                <div className="checkout-location">
                  <label htmlFor="location-details">
                    <span>تفاصيل الموقع</span>
                    <textarea
                      id="location-details"
                      value={locationDetails}
                      onChange={(e) => onLocationChange(e.target.value)}
                      placeholder="مثال: شارع الرئيسي، حي النزهة، بجانب مسجد..."
                      rows={3}
                    />
                  </label>
                  {error && <p className="checkout-location__error">{error}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
