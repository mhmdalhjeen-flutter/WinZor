import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import useCartSummary from '../../hooks/useCartSummary';
import { useCheckout } from '../../context/CheckoutContext';
import { useAuthGate } from '../../context/AuthGateContext';
import { AUTH_GATE_MESSAGES } from '../../utils/authGateMessages';
import {
  resolveCheckoutContainers,
  getPrimaryStoreId,
  getCheckoutPaths,
} from '../../utils/checkoutHelpers';
import { PAYMENT_METHODS } from '../../utils/checkoutConstants';
import { getStorePaymentInfo } from '../../utils/storePaymentHelpers';
import { queryKeys } from '../../lib/queryClient';
import api from '../../api/axios';
import CheckoutPageShell from '../../components/checkout/CheckoutPageShell';
import CheckoutFixedBar from '../../components/checkout/CheckoutFixedBar';
import PaymentMethodSection from '../../components/checkout/PaymentMethodSection';
import '../../styles/checkout.css';

const DIGITAL_METHODS = [
  PAYMENT_METHODS.BANK_PALESTINE,
  PAYMENT_METHODS.PALPAY,
  PAYMENT_METHODS.JAWWAL_PAY,
];

export default function CheckoutPayment() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { runWithAuth } = useAuthGate();
  const { data: cartStats, isLoading } = useCartSummary();
  const { getDraft, updateDraft, checkoutMode, activeStoreIds } = useCheckout();

  const { isAllMode, containers } = useMemo(
    () => resolveCheckoutContainers({ cartStats, storeId, checkoutMode, activeStoreIds }),
    [cartStats, storeId, checkoutMode, activeStoreIds],
  );

  const primaryStoreId = getPrimaryStoreId(containers, storeId, isAllMode);
  const draft = getDraft(primaryStoreId, containers[0]?.customerNotes || '');
  const paths = getCheckoutPaths(storeId, isAllMode);

  const { data: storeData } = useQuery({
    queryKey: queryKeys.storeDetail(primaryStoreId),
    queryFn: async () => {
      const { data } = await api.get(`/stores/${primaryStoreId}`);
      return data?.store || data;
    },
    enabled: Boolean(primaryStoreId) && !isAllMode,
    staleTime: 5 * 60 * 1000,
  });

  const unavailableDigitalMethods = useMemo(() => {
    if (isAllMode || !storeData) return DIGITAL_METHODS;
    return DIGITAL_METHODS.filter((methodId) => {
      const info = getStorePaymentInfo(storeData, methodId);
      return !info?.configured || !info?.enabled;
    });
  }, [storeData, isAllMode]);

  useEffect(() => {
    if (!isLoading && containers.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [isLoading, containers.length, navigate]);

  const handleContinue = () => {
    navigate(paths.paymentDetails);
  };

  return (
    <CheckoutPageShell
      title="طريقة الدفع"
      subtitle="اختر الطريقة المناسبة لإتمام طلبك"
      currentStep={3}
      backTo={paths.review}
      loading={isLoading}
      footer={!isLoading && containers.length > 0 && (
        <CheckoutFixedBar
          label="متابعة"
          icon={ArrowLeft}
          onClick={() => runWithAuth(handleContinue, AUTH_GATE_MESSAGES.orderConfirm)}
        />
      )}
    >
      {containers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        >
          <PaymentMethodSection
            value={draft.paymentMethod}
            onChange={(method) => updateDraft(primaryStoreId, { paymentMethod: method })}
            disableDigital={isAllMode}
            unavailableMethods={unavailableDigitalMethods}
          />
        </motion.div>
      )}
    </CheckoutPageShell>
  );
}
