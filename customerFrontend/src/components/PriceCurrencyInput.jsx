import React from 'react';
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from '../utils/currency';

export default function PriceCurrencyInput({
  price,
  currency = DEFAULT_CURRENCY,
  onPriceChange,
  onCurrencyChange,
  pricePlaceholder = 'السعر',
  required = false,
  inputClassName = 'w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold',
  selectClassName = 'bg-gray-50 rounded-2xl p-4 text-sm font-bold min-w-[110px]',
  className = 'grid grid-cols-[1fr_auto] gap-2',
  inputProps = {},
}) {
  return (
    <div className={className}>
      <input
        type="number"
        min="0"
        step="any"
        required={required}
        value={price}
        onChange={(e) => onPriceChange(e.target.value)}
        placeholder={pricePlaceholder}
        className={inputClassName}
        {...inputProps}
      />
      <select
        value={currency || DEFAULT_CURRENCY}
        onChange={(e) => onCurrencyChange(e.target.value)}
        className={selectClassName}
        aria-label="العملة"
      >
        {CURRENCY_OPTIONS.map((item) => (
          <option key={item.code} value={item.code}>{item.label}</option>
        ))}
      </select>
    </div>
  );
}
