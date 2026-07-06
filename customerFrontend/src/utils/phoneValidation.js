/** رقم محلي فلسطيني: 059 (جوال) أو 056 (وطنية) + 7 أرقام = 10 */
const LOCAL_PHONE_REGEX = /^05(9|6)\d{7}$/;

/** واتساب: +9705 أو +9725 + (6|9) + 7 أرقام */
const WHATSAPP_REGEX = /^\+97[02]5[69]\d{7}$/;

export const LOCAL_PHONE_PLACEHOLDER = '0592222222';
export const WHATSAPP_PLACEHOLDER = '+970592222222';

export const LOCAL_PHONE_MESSAGE =
  'رقم فلسطيني فقط: 059 (جوال) أو 056 (وطنية) ثم 7 أرقام — 10 أرقام بالمجموع';

export const WHATSAPP_MESSAGE =
  'واتساب: +9705 أو +9725 ثم 6 أو 9 و7 أرقام — مثل +970592222222 أو +972562222222';

export const PHONE_CARRIER_LABELS = {
  jawwal: 'جوال (059)',
  wataniya: 'وطنية (056)',
};

const strip = (value) => String(value || '').trim().replace(/[\s\-()]/g, '');

export function normalizeLocalPhone(value) {
  let p = strip(value);
  if (!p) return '';

  if (p.startsWith('+')) {
    if (/^\+9705[69]\d{7}$/.test(p)) return `0${p.slice(4)}`;
    if (/^\+9725[69]\d{7}$/.test(p)) return `0${p.slice(4)}`;
    return p;
  }

  if (/^009705[69]\d{7}$/.test(p)) return `0${p.slice(5)}`;
  if (/^009725[69]\d{7}$/.test(p)) return `0${p.slice(5)}`;
  if (/^9705[69]\d{7}$/.test(p)) return `0${p.slice(3)}`;
  if (/^9725[69]\d{7}$/.test(p)) return `0${p.slice(3)}`;
  if (/^5[69]\d{7}$/.test(p)) return `0${p}`;

  return p;
}

export function isValidLocalPhone(value) {
  return LOCAL_PHONE_REGEX.test(normalizeLocalPhone(value));
}

/** جوال 059 = أخضر | وطنية 056 = أحمر */
export function getPhoneCarrier(value) {
  const p = normalizeLocalPhone(value);
  if (p.startsWith('059')) return 'jawwal';
  if (p.startsWith('056')) return 'wataniya';
  if (p.length >= 3) {
    if (p[2] === '9') return 'jawwal';
    if (p[2] === '6') return 'wataniya';
  }
  return null;
}

/** يمنع أي أرقام غير فلسطينية أثناء الكتابة */
export function sanitizeLocalPhoneInput(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('009705') || digits.startsWith('009725')) {
    digits = `0${digits.slice(5)}`;
  } else if (digits.startsWith('9705') || digits.startsWith('9725')) {
    digits = `0${digits.slice(3)}`;
  }

  if (digits[0] !== '0') return '';
  if (digits.length >= 2 && digits[1] !== '5') return '0';
  if (digits.length >= 3 && digits[2] !== '6' && digits[2] !== '9') return digits.slice(0, 2);

  return digits.slice(0, 10);
}

export function getPhoneCarrierTheme(carrier, variant = 'light') {
  if (carrier === 'jawwal') {
    return variant === 'auth'
      ? {
          input: 'border-green-500/60 text-green-300 bg-green-500/10 focus:border-green-400 focus:ring-green-400/20',
          badge: 'bg-green-500/20 text-green-300',
          label: PHONE_CARRIER_LABELS.jawwal,
          hint: 'text-green-300/80',
        }
      : {
          input: 'border-green-500 text-green-700 bg-green-50 focus:border-green-600 focus:ring-green-500/20',
          badge: 'bg-green-100 text-green-700',
          label: PHONE_CARRIER_LABELS.jawwal,
          hint: 'text-green-600',
        };
  }

  if (carrier === 'wataniya') {
    return variant === 'auth'
      ? {
          input: 'border-red-500/60 text-red-300 bg-red-500/10 focus:border-red-400 focus:ring-red-400/20',
          badge: 'bg-red-500/20 text-red-300',
          label: PHONE_CARRIER_LABELS.wataniya,
          hint: 'text-red-300/80',
        }
      : {
          input: 'border-red-500 text-red-700 bg-red-50 focus:border-red-600 focus:ring-red-500/20',
          badge: 'bg-red-100 text-red-700',
          label: PHONE_CARRIER_LABELS.wataniya,
          hint: 'text-red-600',
        };
  }

  return variant === 'auth'
    ? {
        input: 'border-white/10 text-white bg-white/[0.07] focus:border-amber-400/50 focus:ring-amber-400/20',
        badge: 'bg-white/10 text-white/50',
        label: null,
        hint: 'text-white/40',
      }
    : {
        input: 'border-gray-200 text-gray-900 bg-gray-50 focus:border-primary/30 focus:ring-primary/10',
        badge: 'bg-gray-100 text-gray-500',
        label: null,
        hint: 'text-gray-400',
      };
}

export function formatLocalPhoneDisplay(value) {
  const p = normalizeLocalPhone(value);
  if (p.length <= 3) return p;
  return `${p.slice(0, 3)} ${p.slice(3)}`;
}

export function normalizeWhatsApp(value, { defaultCountry = '970' } = {}) {
  let p = strip(value);
  if (!p) return '';

  if (/^05[69]\d{7}$/.test(p)) {
    return `+${defaultCountry}${p.slice(1)}`;
  }

  if (/^5[69]\d{7}$/.test(p)) {
    return `+${defaultCountry}5${p.slice(1)}`;
  }

  if (/^009705[69]\d{7}$/.test(p)) return `+9705${p.slice(6)}`;
  if (/^009725[69]\d{7}$/.test(p)) return `+9725${p.slice(6)}`;
  if (/^9705[69]\d{7}$/.test(p)) return `+${p}`;
  if (/^9725[69]\d{7}$/.test(p)) return `+${p}`;

  if (!p.startsWith('+')) p = `+${p}`;

  if (/^\+9705[69]\d{7}$/.test(p) || /^\+9725[69]\d{7}$/.test(p)) return p;

  return p;
}

export function isValidWhatsApp(value) {
  return WHATSAPP_REGEX.test(normalizeWhatsApp(value));
}

/** @deprecated استخدم normalizeLocalPhone */
export const normalizePhone = normalizeLocalPhone;

/** @deprecated استخدم isValidLocalPhone */
export const isValidPhone = isValidLocalPhone;

export function getLocalPhoneError(value) {
  if (!strip(value)) return 'أدخل رقم الهاتف';
  if (!isValidLocalPhone(value)) return LOCAL_PHONE_MESSAGE;
  return null;
}

export function getWhatsAppError(value) {
  if (!strip(value)) return 'أدخل رقم الواتساب';
  if (!isValidWhatsApp(value)) return WHATSAPP_MESSAGE;
  return null;
}
