import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Loader2, Send, CheckCircle2, ImageOff } from 'lucide-react';
import api from '../../api/axios';
import { formatPrice } from '../../utils/currency';
import { queryClient, queryKeys } from '../../lib/queryClient';
import { CART_VERIFICATION } from '../../utils/verificationGateConfig';
import { useVerificationGate } from '../../context/VerificationGateContext';
import { getOfferPricing } from '../OfferPriceDisplay';
import { resolveOfferImage } from '../../utils/mediaUrl';

export default function DirectOrderModal({ offer, open, onClose }) {
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const store = offer?.store;
  const offerImageSrc = resolveOfferImage(offer);
  const pricing = getOfferPricing(offer);
  const unitPrice = pricing?.finalPrice ?? 0;
  const totalPrice = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);

  const clampQty = (val) => Math.max(1, Math.min(99, val));

  const handleQtyChange = (val) => {
    const n = parseInt(val, 10);
    if (!Number.isFinite(n)) return;
    setQuantity(clampQty(n));
  };

  const performSubmit = async () => {
    setSubmitting(true);
    try {
      const cartData = queryClient.getQueryData(queryKeys.cart);
      const existing = (cartData?.items || []).find(
        (row) => String(row.item?._id) === String(offer._id) && row.itemType === 'offer'
      );

      if (existing) {
        await api.patch('/cart/update', { itemId: offer._id, itemType: 'offer', quantity });
      } else {
        await api.post('/cart/add', { itemId: offer._id, itemType: 'offer', quantity });
      }

      await api.post('/cart/checkout');
      queryClient.setQueryData(queryKeys.cart, { items: [], total: 0 });
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      await queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setQuantity(1);
        onClose?.();
      }, 2200);
    } catch (err) {
      if (!handleApiVerificationError(err, performSubmit, CART_VERIFICATION)) {
        alert(err.response?.data?.message || 'تعذّر إرسال الطلب');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (submitting || success) return;
    runWithVerification(performSubmit, CART_VERIFICATION);
  };

  const handleClose = () => {
    if (submitting) return;
    setQuantity(1);
    setSuccess(false);
    onClose?.();
  };

  if (!offer) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="direct-order-modal" role="dialog" aria-modal="true" aria-label="طلب مباشر">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="direct-order-modal__backdrop"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: 48, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="direct-order-modal__panel"
            dir="rtl"
          >
            <button
              type="button"
              onClick={handleClose}
              className="direct-order-modal__close"
              aria-label="إغلاق"
              disabled={submitting}
            >
              <X size={20} />
            </button>

            {success ? (
              <div className="direct-order-modal__success">
                <CheckCircle2 size={48} className="text-green-500" />
                <p className="font-black text-gray-900 text-lg mt-3">تم إرسال الطلب</p>
                <p className="text-sm text-gray-500 font-bold mt-1">بانتظار تأكيد المحل</p>
              </div>
            ) : (
              <>
                <div className="direct-order-modal__product">
                  <div className="direct-order-modal__image-wrap">
                    {offerImageSrc ? (
                      <img src={offerImageSrc} alt="" className="direct-order-modal__image" />
                    ) : (
                      <div className="direct-order-modal__image-placeholder">
                        <ImageOff size={32} />
                      </div>
                    )}
                  </div>
                  <div className="direct-order-modal__details">
                    <h3 className="direct-order-modal__title">{offer.title}</h3>
                    <p className="direct-order-modal__store">{store?.name || 'متجر'}</p>
                    <p className="direct-order-modal__unit-price">
                      {pricing?.displayNew || formatPrice(unitPrice, pricing?.currency || offer?.currency)}
                      <span className="direct-order-modal__unit-label"> / للوحدة</span>
                    </p>
                  </div>
                </div>

                <div className="direct-order-modal__qty-row">
                  <span className="direct-order-modal__qty-label">الكمية</span>
                  <div className="direct-order-modal__qty-controls">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => clampQty(q - 1))}
                      disabled={quantity <= 1 || submitting}
                      className="direct-order-modal__qty-btn"
                      aria-label="تقليل الكمية"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={quantity}
                      onChange={(e) => handleQtyChange(e.target.value)}
                      disabled={submitting}
                      className="direct-order-modal__qty-input"
                      aria-label="الكمية"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => clampQty(q + 1))}
                      disabled={quantity >= 99 || submitting}
                      className="direct-order-modal__qty-btn"
                      aria-label="زيادة الكمية"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="direct-order-modal__total">
                  <span className="direct-order-modal__total-label">الإجمالي</span>
                  <span className="direct-order-modal__total-value">{formatPrice(totalPrice, pricing?.currency || offer?.currency)}</span>
                </div>

                <div className="direct-order-modal__actions">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="direct-order-modal__submit"
                  >
                    {submitting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                    إرسال الطلب
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="direct-order-modal__cancel"
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
