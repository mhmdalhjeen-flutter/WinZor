import React from 'react';
import { Phone } from 'lucide-react';
import {
  getPhoneCarrier,
  getPhoneCarrierTheme,
  LOCAL_PHONE_PLACEHOLDER,
  LOCAL_PHONE_MESSAGE,
  sanitizeLocalPhoneInput,
  isValidLocalPhone,
} from '../utils/phoneValidation';

/**
 * حقل هاتف فلسطيني: 059 (أخضر) | 056 (أحمر) — 10 أرقام.
 */
export default function PalestinianPhoneInput({
  value,
  onValueChange,
  onChange,
  name,
  variant = 'light',
  disabled = false,
  required = false,
  className = '',
  showHint = true,
  icon: Icon = Phone,
}) {
  const carrier = getPhoneCarrier(value);
  const theme = getPhoneCarrierTheme(carrier, variant);
  const complete = isValidLocalPhone(value);
  const showCarrierBadge = Boolean(carrier && theme.label);

  const emitChange = (next) => {
    if (onValueChange) onValueChange(next);
    if (onChange) {
      onChange({ target: { name, value: next } });
    }
  };

  const handleChange = (e) => {
    emitChange(sanitizeLocalPhoneInput(e.target.value));
  };

  const baseInput = variant === 'auth'
    ? `w-full rounded-2xl border py-4 text-sm font-bold outline-none transition placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-50 focus:ring-2 ${theme.input}`
    : `w-full rounded-2xl border py-3 text-sm font-bold outline-none transition disabled:opacity-50 focus:ring-2 ${theme.input}`;

  const inputPadding = (() => {
    if (Icon && variant === 'auth') {
      return showCarrierBadge ? 'pr-12 pl-[5.75rem]' : 'pr-12 pl-4';
    }
    return showCarrierBadge ? 'px-4 pl-[5.75rem]' : 'px-4';
  })();

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className={variant === 'auth' ? 'group relative' : 'relative'}>
        {Icon && variant === 'auth' && (
          <Icon
            size={18}
            className={`pointer-events-none absolute right-4 top-1/2 z-[1] -translate-y-1/2 transition ${
              carrier === 'jawwal' ? 'text-green-400' : carrier === 'wataniya' ? 'text-red-400' : 'text-white/35 group-focus-within:text-amber-300'
            }`}
          />
        )}
        <input
          type="tel"
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={LOCAL_PHONE_PLACEHOLDER}
          dir="ltr"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          pattern="05(6|9)[0-9]{7}"
          required={required}
          disabled={disabled}
          className={`${baseInput} text-left ${inputPadding}`}
        />
        {showCarrierBadge && (
          <span
            className={`pointer-events-none absolute left-3 top-1/2 z-[1] max-w-[5.25rem] -translate-y-1/2 truncate text-[10px] font-black px-2 py-0.5 rounded-full ${theme.badge}`}
          >
            {carrier === 'jawwal' ? 'جوال' : 'وطنية'}
          </span>
        )}
      </div>
      {showHint && (
        <p className={`text-[10px] font-bold ${theme.hint}`}>
          {complete
            ? `✓ ${theme.label || 'رقم صالح'} — 10 أرقام`
            : LOCAL_PHONE_MESSAGE}
        </p>
      )}
    </div>
  );
}
