import React, { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import { CheckCircle2, History } from 'lucide-react';

import { useCheckout } from '../../context/CheckoutContext';

import OrderVerificationDialog from '../../components/orders/OrderVerificationDialog';

import '../../styles/checkout.css';



export default function CheckoutPending() {

  const navigate = useNavigate();

  const { submitResult, clearCheckout } = useCheckout();

  const [showCodes, setShowCodes] = React.useState(false);



  useEffect(() => {

    if (!submitResult) {

      navigate('/cart', { replace: true });

    }

  }, [submitResult, navigate]);



  if (!submitResult) return null;



  const { message, verificationCodes = [] } = submitResult;



  const handleViewHistory = () => {

    clearCheckout();

    navigate('/orders/history');

  };



  return (

    <>

      <div className="checkout-page checkout-page--success" dir="rtl">

        <motion.div

          className="checkout-success"

          initial={{ opacity: 0, scale: 0.94, y: 20 }}

          animate={{ opacity: 1, scale: 1, y: 0 }}

          transition={{ type: 'spring', stiffness: 400, damping: 32 }}

        >

          <div className="checkout-success__icon">

            <CheckCircle2 size={48} strokeWidth={2} />

          </div>



          <h1 className="checkout-success__title">تم إرسال طلبك بنجاح</h1>

          <p className="checkout-success__message">{message}</p>



          {verificationCodes.length > 0 && (

            <button

              type="button"

              className="checkout-success__codes-btn"

              onClick={() => setShowCodes(true)}

            >

              عرض رمز التحقق

            </button>

          )}



          <button

            type="button"

            className="checkout-success__primary"

            onClick={handleViewHistory}

          >

            <History size={20} />

            طلباتي السابقة

          </button>

        </motion.div>

      </div>



      <OrderVerificationDialog

        open={showCodes}

        codes={verificationCodes}

        onClose={() => setShowCodes(false)}

      />

    </>

  );

}

