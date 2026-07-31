import React from 'react';
import { formatPrice } from '../../utils/currency';
import { getDeliveryMethodLabel, getPaymentMethodLabel } from '../../utils/checkoutConstants';
import { isDigitalPaymentMethod, isSimplePaymentMethod, getStorePaymentInfo } from '../../utils/storePaymentHelpers';
import StorePaymentInfoCard from './StorePaymentInfoCard';
import TransferVerificationSection from './TransferVerificationSection';

function OrderSummaryCard({ containers, draft, grandTotal }) {
  return (
    <div className="checkout-summary-card">
      <h3>ملخص الطلب</h3>
      <div className="checkout-summary-card__row">
        <span>عدد المتاجر</span>
        <strong>{containers.length}</strong>
      </div>
      <div className="checkout-summary-card__row">
        <span>طريقة الاستلام</span>
        <strong>{getDeliveryMethodLabel(draft.deliveryMethod)}</strong>
      </div>
      <div className="checkout-summary-card__row">
        <span>طريقة الدفع</span>
        <strong>{getPaymentMethodLabel(draft.paymentMethod)}</strong>
      </div>
      {draft.locationDetails && (
        <div className="checkout-summary-card__row checkout-summary-card__row--stack">
          <span>تفاصيل الموقع</span>
          <p>{draft.locationDetails}</p>
        </div>
      )}
      <div className="checkout-summary-card__row checkout-summary-card__row--total">
        <span>الإجمالي</span>
        <strong>{formatPrice(grandTotal, 'ILS')}</strong>
      </div>
    </div>
  );
}

function OptionalNotesField({ value, onChange }) {
  return (
    <label className="checkout-notes-field">
      <span>ملاحظات إضافية</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="مثال: تواصل معي قبل الوصول، تعليمات خاصة..."
        rows={3}
      />
    </label>
  );
}

export default function PaymentDetailsContent({
  draft,
  containers,
  grandTotal,
  store,
  onDraftChange,
  validationErrors = {},
}) {
  const method = draft.paymentMethod;

  if (isSimplePaymentMethod(method)) {
    return (
      <div className="checkout-content">
        <OrderSummaryCard containers={containers} draft={draft} grandTotal={grandTotal} />
        <div className="checkout-section">
          <OptionalNotesField
            value={draft.paymentNotes}
            onChange={(val) => onDraftChange({ paymentNotes: val })}
          />
        </div>
      </div>
    );
  }

  if (isDigitalPaymentMethod(method)) {
    const paymentInfo = getStorePaymentInfo(store, method);
    const methodLabel = getPaymentMethodLabel(method);

    return (
      <div className="checkout-content">
        <OrderSummaryCard containers={containers} draft={draft} grandTotal={grandTotal} />
        <StorePaymentInfoCard paymentInfo={paymentInfo} methodLabel={methodLabel} />
        <TransferVerificationSection
          draft={draft}
          onChange={onDraftChange}
          errors={validationErrors}
        />
      </div>
    );
  }

  return (
    <div className="checkout-content">
      <OrderSummaryCard containers={containers} draft={draft} grandTotal={grandTotal} />
    </div>
  );
}
