import React from 'react';
import {
  formatLocalPhoneDisplay,
  getPhoneCarrier,
  getPhoneCarrierTheme,
} from '../utils/phoneValidation';

/** عرض رقم هاتف ملوّن حسب الشركة (059 أخضر | 056 أحمر) */
export default function PhoneDisplay({
  phone,
  variant = 'light',
  showBadge = true,
  className = '',
  inheritColor = false,
}) {
  if (!phone) return null;

  const carrier = getPhoneCarrier(phone);
  const theme = getPhoneCarrierTheme(carrier, variant);

  const numberClass = inheritColor
    ? ''
    : carrier === 'jawwal'
      ? 'text-green-600'
      : carrier === 'wataniya'
        ? 'text-red-600'
        : '';

  return (
    <span className={`inline-flex items-center gap-2 font-black dir-ltr ${className}`}>
      {showBadge && carrier && theme.label && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${theme.badge}`}>
          {theme.label}
        </span>
      )}
      <span className={numberClass}>{formatLocalPhoneDisplay(phone)}</span>
    </span>
  );
}
