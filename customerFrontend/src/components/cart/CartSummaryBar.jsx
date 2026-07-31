import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import useCartSummary from '../../hooks/useCartSummary';
import { formatPrice } from '../../utils/currency';
import '../../styles/cartSummaryBar.css';

export default function CartSummaryBar({ hidden = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: cartStats } = useCartSummary();

  const onCartPage = location.pathname === '/cart';
  const onCheckoutPage = location.pathname.startsWith('/checkout');
  const show = !hidden
    && !onCartPage
    && !onCheckoutPage
    && cartStats
    && !cartStats.isEmpty
    && cartStats.itemCount > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          className="cart-summary-bar"
          onClick={() => navigate('/cart')}
          aria-label="عرض السلة"
          initial={{ y: 80, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 80, opacity: 0, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="cart-summary-bar__icon-wrap">
            <ShoppingCart size={22} strokeWidth={2.2} />
          </span>
          <span className="cart-summary-bar__text">
            <strong>🛒 عرض السلة</strong>
            <span className="cart-summary-bar__meta">
              عدد العناصر: {cartStats.itemCount}
              <span className="cart-summary-bar__dot">·</span>
              الإجمالي: {formatPrice(cartStats.grandTotal, 'ILS')}
            </span>
          </span>
          <span className="cart-summary-bar__chevron" aria-hidden>‹</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
