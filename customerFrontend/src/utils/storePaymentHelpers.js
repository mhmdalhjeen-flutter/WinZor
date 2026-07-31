import { PAYMENT_METHODS } from './checkoutConstants';

const PAYMENT_SETTING_KEYS = {
  [PAYMENT_METHODS.BANK_PALESTINE]: 'bankPalestine',
  [PAYMENT_METHODS.PALPAY]: 'palPay',
  [PAYMENT_METHODS.JAWWAL_PAY]: 'jawwalPay',
};

/** Whether the payment method requires digital transfer verification. */
export function isDigitalPaymentMethod(methodId) {
  return [
    PAYMENT_METHODS.BANK_PALESTINE,
    PAYMENT_METHODS.PALPAY,
    PAYMENT_METHODS.JAWWAL_PAY,
  ].includes(methodId);
}

/** Whether the payment method uses optional notes only (no transfer proof). */
export function isSimplePaymentMethod(methodId) {
  return [
    PAYMENT_METHODS.CASH_ON_DELIVERY,
    PAYMENT_METHODS.SELLER_AGREEMENT,
  ].includes(methodId);
}

/**
 * Extract seller payment details from store settings.
 * Supports future backend shape: store.paymentSettings.{bankPalestine|palPay|jawwalPay}
 */
export function getStorePaymentInfo(store, paymentMethodId) {
  const settingsKey = PAYMENT_SETTING_KEYS[paymentMethodId];
  if (!settingsKey) return null;

  const root = store?.paymentSettings || store?.payment || {};
  const info = root[settingsKey] || root[paymentMethodId] || {};

  const hasData = Boolean(
    info.qrCodeUrl || info.qrCode || info.qrImage || info.qr
    || info.accountOwnerName || info.ownerName || info.accountName
    || info.accountNumber || info.transferNumber || info.phoneNumber,
  );

  if (!hasData) {
    return {
      qrCodeUrl: '',
      accountOwnerName: '',
      accountNumber: '',
      enabled: false,
      configured: false,
    };
  }

  return {
    qrCodeUrl: info.qrCodeUrl || info.qrCode || info.qrImage || info.qr || '',
    accountOwnerName: info.accountOwnerName || info.ownerName || info.accountName || info.name || '',
    accountNumber: info.accountNumber || info.transferNumber || info.phoneNumber || info.number || '',
    enabled: info.enabled !== false,
    configured: Boolean(
      info.qrCodeUrl || info.qrCode || info.qrImage || info.qr
      || info.accountOwnerName || info.ownerName || info.accountName
      || info.accountNumber || info.transferNumber || info.phoneNumber,
    ),
  };
}

export function validatePaymentDraft(draft) {
  const method = draft.paymentMethod;

  if (isSimplePaymentMethod(method)) {
    return { valid: true };
  }

  if (!isDigitalPaymentMethod(method)) {
    return { valid: true };
  }

  const hasReceipt = Boolean(draft.transferProofUrl);
  const hasManualDetails = Boolean(
    draft.transferSenderName?.trim()
    && draft.transferContactNumber?.trim(),
  );

  if (hasReceipt || hasManualDetails) {
    return { valid: true };
  }

  return {
    valid: false,
    message: 'يرجى رفع إيصال التحويل أو إدخال اسم المحول ورقم التواصل',
  };
}
