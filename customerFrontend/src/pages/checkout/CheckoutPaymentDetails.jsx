import React, { useEffect, useMemo, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { motion } from 'framer-motion';

import { CheckCircle2 } from 'lucide-react';

import useCartSummary from '../../hooks/useCartSummary';

import { useCheckout } from '../../context/CheckoutContext';

import { useAuthGate } from '../../context/AuthGateContext';

import { useToast } from '../../shared/Toast';

import { AUTH_GATE_MESSAGES } from '../../utils/authGateMessages';

import {

  resolveCheckoutContainers,

  getPrimaryStoreId,

  getCheckoutPaths,

} from '../../utils/checkoutHelpers';

import {

  submitStoreOrder,

  submitAllOrders,

  buildVerificationEntriesFromConfirm,

  buildVerificationEntriesFromCheckout,

} from '../../utils/checkoutActions';

import { validatePaymentDraft } from '../../utils/storePaymentHelpers';

import { queryKeys } from '../../lib/queryClient';

import api from '../../api/axios';

import CheckoutPageShell from '../../components/checkout/CheckoutPageShell';

import CheckoutFixedBar from '../../components/checkout/CheckoutFixedBar';

import PaymentDetailsContent from '../../components/checkout/PaymentDetailsContent';

import '../../styles/checkout.css';



export default function CheckoutPaymentDetails() {

  const { storeId } = useParams();

  const navigate = useNavigate();

  const qc = useQueryClient();

  const { toast } = useToast();

  const { runWithAuth } = useAuthGate();

  const { data: cartStats, isLoading: cartLoading } = useCartSummary();

  const {

    getDraft,

    updateDraft,

    checkoutMode,

    activeStoreIds,

    setSubmitResult,

  } = useCheckout();

  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState(null);

  const [validationErrors, setValidationErrors] = useState({});



  const { isAllMode, containers } = useMemo(

    () => resolveCheckoutContainers({ cartStats, storeId, checkoutMode, activeStoreIds }),

    [cartStats, storeId, checkoutMode, activeStoreIds],

  );



  const primaryStoreId = getPrimaryStoreId(containers, storeId, isAllMode);

  const draft = getDraft(primaryStoreId, containers[0]?.customerNotes || '');

  const paths = getCheckoutPaths(storeId, isAllMode);

  const grandTotal = containers.reduce((sum, c) => sum + (c.total || 0), 0);



  const { data: storeData, isLoading: storeLoading } = useQuery({

    queryKey: queryKeys.storeDetail(primaryStoreId),

    queryFn: async () => {

      const { data } = await api.get(`/stores/${primaryStoreId}`);

      return data?.store || data;

    },

    enabled: Boolean(primaryStoreId) && !isAllMode,

    staleTime: 5 * 60 * 1000,

  });



  const store = storeData || containers[0]?.store || null;

  const isLoading = cartLoading || (!isAllMode && storeLoading);



  useEffect(() => {

    if (!cartLoading && containers.length === 0) {

      navigate('/cart', { replace: true });

    }

  }, [cartLoading, containers.length, navigate]);



  const handleDraftChange = (patch) => {

    updateDraft(primaryStoreId, patch);

    setValidationErrors({});

    setSubmitError(null);

  };



  const doSubmit = async () => {

    const validation = validatePaymentDraft(draft);

    if (!validation.valid) {

      setValidationErrors({ general: validation.message });

      setSubmitError(validation.message);

      toast(validation.message, 'error');

      return;

    }



    setSubmitting(true);

    setSubmitError(null);

    setValidationErrors({});



    try {

      let data;

      let verificationCodes = [];



      if (isAllMode) {

        data = await submitAllOrders();

        verificationCodes = buildVerificationEntriesFromCheckout(data, containers);

      } else {

        const storeName = containers[0]?.storeName || containers[0]?.store?.name;

        data = await submitStoreOrder(storeId, draft);

        verificationCodes = buildVerificationEntriesFromConfirm(data, storeName);

      }



      await qc.invalidateQueries({ queryKey: queryKeys.cart });

      await qc.invalidateQueries({ queryKey: queryKeys.myOrders });



      setSubmitResult({

        message: 'سيتم مراجعة طلبك من المتجر وسيصلك إشعار عند تأكيده',

        verificationCodes,

        storeCount: containers.length,

        grandTotal,

      });



      navigate('/checkout/pending', { replace: true });

    } catch (err) {

      const msg = err.response?.data?.message || 'تعذّر إرسال الطلب. حاول مجدداً.';

      setSubmitError(msg);

      toast(msg, 'error');

    } finally {

      setSubmitting(false);

    }

  };



  const handleSubmit = () => {

    runWithAuth(doSubmit, AUTH_GATE_MESSAGES.orderConfirm);

  };



  return (

    <CheckoutPageShell

      title="تفاصيل الدفع"

      subtitle="أكمل معلومات الدفع لتأكيد طلبك"

      currentStep={4}

      backTo={paths.payment}

      loading={isLoading}

      footer={!isLoading && containers.length > 0 && (

        <CheckoutFixedBar

          label="تأكيد الطلب"

          icon={CheckCircle2}

          onClick={handleSubmit}

          loading={submitting}

          hint={submitError}

        />

      )}

    >

      {!isLoading && containers.length > 0 && (

        <motion.div

          initial={{ opacity: 0, y: 16 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ type: 'spring', stiffness: 400, damping: 32 }}

        >

          <PaymentDetailsContent

            draft={draft}

            containers={containers}

            grandTotal={grandTotal}

            store={store}

            onDraftChange={handleDraftChange}

            validationErrors={validationErrors}

          />

        </motion.div>

      )}

    </CheckoutPageShell>

  );

}

