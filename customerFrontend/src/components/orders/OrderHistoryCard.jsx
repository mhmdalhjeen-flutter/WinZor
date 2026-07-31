import { ChevronLeft } from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import {
  getOrderStoreName,
  getOrderTotal,
  formatOrderDate,
  summarizeOrderItems,
  getOrderPaymentMethodLabel,
} from '../../utils/orderHelpers';
import OrderStatusBadge from './OrderStatusBadge';

export default function OrderHistoryCard({ order, onClick }) {
  const storeName = getOrderStoreName(order);
  const { preview, itemCount } = summarizeOrderItems(order.items || []);
  const paymentLabel = getOrderPaymentMethodLabel(order);

  return (
    <button type="button" className="order-card" onClick={onClick}>
      <div className="order-card__header">
        <div className="order-card__meta">
          {order.orderNumber && (
            <p className="order-card__number">#{order.orderNumber}</p>
          )}
          <p className="order-card__store">{storeName}</p>
          <p className="order-card__date">{formatOrderDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="order-card__products">
        <p className="order-card__products-label">المنتجات</p>
        <p className="order-card__products-text">{preview}</p>
        {itemCount > 0 && (
          <p className="order-card__products-count">{itemCount} قطعة</p>
        )}
      </div>

      <div className="order-card__footer">
        <div>
          <p className="order-card__payment">{paymentLabel}</p>
          <p className="order-card__total">{formatPrice(getOrderTotal(order), order.currency)}</p>
        </div>
        <ChevronLeft size={18} className="order-card__chevron" aria-hidden />
      </div>
    </button>
  );
}
