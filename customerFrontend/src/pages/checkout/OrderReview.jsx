import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import useCartSummary from '../../hooks/useCartSummary';
import { useCheckout } from '../../context/CheckoutContext';
import { useAuthGate } from '../../context/AuthGateContext';
import { AUTH_GATE_MESSAGES } from '../../utils/authGateMessages';
import { getStoreIdFromContainer } from '../../utils/cartHelpers';
import { DELIVERY_METHODS } from '../../utils/checkoutConstants';
import CheckoutPageShell from '../../components/checkout/CheckoutPageShell';
import CheckoutFixedBar from '../../components/checkout/CheckoutFixedBar';
import CheckoutInvoiceCard from '../../components/checkout/CheckoutInvoiceCard';
import DeliveryMethodSection from '../../components/checkout/DeliveryMethodSection';
import '../../styles/checkout.css';

export default function OrderReview() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { runWithAuth } = useAuthGate();
  const { data: cartStats, isLoading, isError, refetch } = useCartSummary();
  const { getDraft, updateDraft, checkoutMode, activeStoreIds } = useCheckout();
  const [locationError, setLocationError] = useState(null);

  const isAllMode = storeId === 'all' || checkoutMode === 'all';

  const containers = useMemo(() => {
    const all = cartStats?.containers || [];
    if (isAllMode) {
      if (activeStoreIds.length) {
        return all.filter((c) => activeStoreIds.includes(String(getStoreIdFromContainer(c))));
      }
      return all;
    }
    return all.filter((c) => String(getStoreIdFromContainer(c)) === String(storeId));
  }, [cartStats, storeId, isAllMode, activeStoreIds]);

  const primaryStoreId = isAllMode
    ? String(getStoreIdFromContainer(containers[0]))
    : String(storeId);

  const draft = getDraft(primaryStoreId, containers[0]?.customerNotes || '');

  useEffect(() => {
    if (!isLoading && containers.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [isLoading, containers.length, navigate]);

  const handleDeliveryChange = (method) => {
    updateDraft(primaryStoreId, { deliveryMethod: method });
    if (method !== DELIVERY_METHODS.NEARBY) {
      setLocationError(null);
    }
  };

  const handleContinue = () => {
    if (
      draft.deliveryMethod === DELIVERY_METHODS.NEARBY
      && !draft.locationDetails?.trim()
    ) {
      setLocationError('يرجى إضافة تفاصيل موقعك لمساعدة المتجر في الوصول إليك');
      return;
    }
    setLocationError(null);

    const paymentPath = isAllMode
      ? '/checkout/payment/all'
      : `/checkout/payment/${storeId}`;
    navigate(paymentPath);
  };

  const emptyMessage = isError
    ? 'تعذّر تحميل السلة. تحقق من الاتصال وحاول مجدداً.'
    : null;

  return (
    <CheckoutPageShell
      title="مراجعة الطلب"
      subtitle="تأكد من تفاصيل طلبك قبل المتابعة"
      currentStep={1}
      backTo="/cart"
      loading={isLoading}
      error={emptyMessage}
      footer={!isLoading && containers.length > 0 && (
        <CheckoutFixedBar
          label="متابعة الدفع"
          icon={CreditCard}
          onClick={() => runWithAuth(handleContinue, AUTH_GATE_MESSAGES.orderConfirm)}
        />
      )}
    >
      {containers.length > 0 && (
        <motion.div
          className="checkout-content"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        >
          {containers.map((container) => (
            <CheckoutInvoiceCard
              key={getStoreIdFromContainer(container)}
              container={container}
            />
          ))}

          <DeliveryMethodSection
            value={draft.deliveryMethod}
            locationDetails={draft.locationDetails}
            onChange={handleDeliveryChange}
            onLocationChange={(val) => {
              updateDraft(primaryStoreId, { locationDetails: val });
              if (val.trim()) setLocationError(null);
            }}
            error={locationError}
          />

          {isError && (
            <button
              type="button"
              className="checkout-retry-btn"
              onClick={() => refetch()}
            >
              إعادة المحاولة
            </button>
          )}
        </motion.div>
      )}

      {!isLoading && !isError && containers.length === 0 && (
        <div className="checkout-empty">
          <p>لا توجد منتجات للمراجعة</p>
          <button type="button" onClick={() => navigate('/cart')}>
            العودة للسلة
          </button>
        </div>
      )}
    </CheckoutPageShell>
  );
}
