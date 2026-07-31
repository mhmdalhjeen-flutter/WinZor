import React from 'react';
import { Copy, QrCode } from 'lucide-react';
import { useToast } from '../../shared/Toast';

export default function StorePaymentInfoCard({ paymentInfo, methodLabel }) {
  const { toast } = useToast();

  if (!paymentInfo?.configured) {
    return (
      <div className="store-payment-info store-payment-info--empty">
        <QrCode size={32} strokeWidth={1.5} />
        <p>لم يُضبط المتجر معلومات الدفع عبر {methodLabel} بعد</p>
        <span>تواصل مع المتجر أو اختر طريقة دفع أخرى</span>
      </div>
    );
  }

  const copyNumber = async () => {
    if (!paymentInfo.accountNumber) {
      toast('لا يوجد رقم للنسخ', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(paymentInfo.accountNumber);
      toast('تم نسخ الرقم', 'success');
    } catch {
      toast('تعذّر النسخ', 'error');
    }
  };

  return (
    <div className="store-payment-info">
      <h4 className="store-payment-info__title">معلومات الدفع — {methodLabel}</h4>

      {paymentInfo.qrCodeUrl && (
        <div className="store-payment-info__qr-wrap">
          <img
            src={paymentInfo.qrCodeUrl}
            alt={`رمز QR للدفع عبر ${methodLabel}`}
            className="store-payment-info__qr"
          />
        </div>
      )}

      <div className="store-payment-info__fields">
        {paymentInfo.accountOwnerName && (
          <div className="store-payment-info__field">
            <span>اسم صاحب الحساب</span>
            <strong>{paymentInfo.accountOwnerName}</strong>
          </div>
        )}

        {paymentInfo.accountNumber && (
          <div className="store-payment-info__field store-payment-info__field--number">
            <span>رقم الحساب / التحويل</span>
            <div className="store-payment-info__number-row">
              <strong dir="ltr">{paymentInfo.accountNumber}</strong>
              <button
                type="button"
                className="store-payment-info__copy"
                onClick={copyNumber}
              >
                <Copy size={16} />
                نسخ الرقم
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
