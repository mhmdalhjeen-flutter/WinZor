import {
  Store,
  Package,
  Truck,
  CreditCard,
  MessageSquare,
  Clock,
  ShieldCheck,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import {
  getOrderStoreName,
  getOrderStoreImage,
  getOrderItemName,
  getOrderItemImage,
  getOrderItemSubtotal,
  getOrderTotal,
  getOrderSubtotal,
  getOrderPaymentMethodLabel,
  getOrderDeliveryMethodLabel,
  getOrderDeliveryAddress,
  getOrderCustomerNotes,
  getOrderPaymentProof,
  getOrderTransferInfo,
  formatOrderDateTime,
  getOrderLastUpdate,
} from '../../utils/orderHelpers';
import { orderStatusLabel } from '../../utils/orderStatus';
import OrderStatusBadge from './OrderStatusBadge';
import OrderVerificationBadge from './OrderVerificationBadge';
import { useToast } from '../../shared/Toast';

export default function OrderInvoiceDetails({ order, showTimeline = true }) {
  const { toast } = useToast();
  if (!order) return null;

  const storeName = getOrderStoreName(order);
  const storeImage = getOrderStoreImage(order);
  const transfer = getOrderTransferInfo(order);
  const paymentProof = getOrderPaymentProof(order);
  const timeline = Array.isArray(order.statusTimeline) ? order.statusTimeline : [];
  const lastUpdate = getOrderLastUpdate(order);

  const copyVerificationCode = async () => {
    if (!order.verificationCode) return;
    try {
      await navigator.clipboard.writeText(order.verificationCode);
      toast('تم نسخ الرمز', 'success');
    } catch {
      toast('تعذّر النسخ', 'error');
    }
  };

  return (
    <div className="order-invoice">
      <div className="order-details__status-bar">
        <OrderStatusBadge status={order.status} />
        <p className="order-details__last-update">
          <Clock size={13} className="inline ml-1" />
          آخر تحديث: {formatOrderDateTime(lastUpdate)}
        </p>
      </div>

      {order.rejectionReason && (
        <div className="order-details__rejection">
          <p className="order-details__rejection-title">سبب الرفض</p>
          <p className="order-details__rejection-text">{order.rejectionReason}</p>
        </div>
      )}

      <section className="order-details__hero">
        {storeImage ? (
          <img src={storeImage} alt="" className="order-details__store-image" loading="lazy" />
        ) : (
          <span className="order-details__store-placeholder" aria-hidden>
            <Store size={22} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-gray-900">{storeName}</p>
          {order.orderNumber && (
            <p className="mt-0.5 text-xs font-bold text-gray-500">#{order.orderNumber}</p>
          )}
          <p className="mt-1 text-xs font-bold text-gray-500">{formatOrderDateTime(order.createdAt)}</p>
        </div>
      </section>

      {order.verificationCode && (
        <section className="order-details__section">
          <p className="order-details__section-title">
            <ShieldCheck size={16} /> رمز التحقق
          </p>
          <div className="flex items-center gap-2">
            <p className="flex-1 text-center text-xl font-black tracking-[0.15em] text-emerald-700">
              {order.verificationCode}
            </p>
            <button
              type="button"
              onClick={copyVerificationCode}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"
              aria-label="نسخ رمز التحقق"
            >
              <Copy size={16} />
            </button>
          </div>
          <OrderVerificationBadge code={order.verificationCode} className="mt-2 justify-center" />
        </section>
      )}

      <section className="order-details__section">
        <h3 className="order-details__section-title">
          <Package size={16} /> المنتجات
        </h3>
        {(order.items || []).map((item, idx) => {
          const image = getOrderItemImage(item);
          return (
            <div key={`${item.item || item.productId}-${idx}`} className="order-details__item">
              {image ? (
                <img src={image} alt="" className="order-details__item-image" loading="lazy" />
              ) : (
                <span className="order-details__item-placeholder" aria-hidden>
                  <Package size={16} />
                </span>
              )}
              <div className="order-details__item-body">
                <p className="order-details__item-name">{getOrderItemName(item)}</p>
                <p className="order-details__item-qty">الكمية: {item.quantity ?? 0}</p>
              </div>
              <div className="order-details__item-price">
                <p className="order-details__item-subtotal">
                  {formatPrice(getOrderItemSubtotal(item), order.currency)}
                </p>
                <p className="order-details__item-unit">
                  {formatPrice(item.price ?? 0, order.currency)} / قطعة
                </p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="order-details__section">
        <h3 className="order-details__section-title">الإجماليات</h3>
        <div className="order-details__row">
          <span className="order-details__row-label">المجموع الفرعي</span>
          <span className="order-details__row-value">{formatPrice(getOrderSubtotal(order), order.currency)}</span>
        </div>
        <div className="order-details__row">
          <span className="order-details__row-label">الإجمالي النهائي</span>
          <span className="order-details__row-value order-details__row-value--total">
            {formatPrice(getOrderTotal(order), order.currency)}
          </span>
        </div>
      </section>

      <section className="order-details__section">
        <h3 className="order-details__section-title">
          <Truck size={16} /> التوصيل
        </h3>
        <div className="order-details__row">
          <span className="order-details__row-label">طريقة التوصيل</span>
          <span className="order-details__row-value">{getOrderDeliveryMethodLabel(order)}</span>
        </div>
        {getOrderDeliveryAddress(order) && (
          <div className="order-details__row">
            <span className="order-details__row-label">العنوان / الموقع</span>
            <span className="order-details__row-value">{getOrderDeliveryAddress(order)}</span>
          </div>
        )}
      </section>

      <section className="order-details__section">
        <h3 className="order-details__section-title">
          <CreditCard size={16} /> الدفع
        </h3>
        <div className="order-details__row">
          <span className="order-details__row-label">طريقة الدفع</span>
          <span className="order-details__row-value">{getOrderPaymentMethodLabel(order)}</span>
        </div>
        {(transfer.name || transfer.phone || transfer.reference) && (
          <>
            {transfer.name && (
              <div className="order-details__row">
                <span className="order-details__row-label">اسم المحوّل</span>
                <span className="order-details__row-value">{transfer.name}</span>
              </div>
            )}
            {transfer.phone && (
              <div className="order-details__row">
                <span className="order-details__row-label">رقم الهاتف</span>
                <span className="order-details__row-value">{transfer.phone}</span>
              </div>
            )}
            {transfer.reference && (
              <div className="order-details__row">
                <span className="order-details__row-label">رقم المرجع</span>
                <span className="order-details__row-value">{transfer.reference}</span>
              </div>
            )}
          </>
        )}
        {transfer.notes && (
          <p className="order-details__note mt-2">{transfer.notes}</p>
        )}
        {paymentProof && (
          <a
            href={paymentProof}
            target="_blank"
            rel="noreferrer"
            className="order-details__proof-link"
          >
            <ExternalLink size={14} />
            عرض إثبات الدفع
          </a>
        )}
      </section>

      {getOrderCustomerNotes(order) && (
        <section className="order-details__section">
          <h3 className="order-details__section-title">
            <MessageSquare size={16} /> ملاحظاتك
          </h3>
          <p className="order-details__note">{getOrderCustomerNotes(order)}</p>
        </section>
      )}

      {showTimeline && timeline.length > 0 && (
        <section className="order-details__section">
          <h3 className="order-details__section-title">
            <Clock size={16} /> مسار الطلب
          </h3>
          <ol className="space-y-2 border-r-2 border-gray-100 pr-3">
            {timeline.map((entry, idx) => (
              <li key={`${entry.status}-${idx}`} className="relative">
                <span className="absolute -right-[calc(0.75rem+1px)] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white" />
                <p className="text-sm font-bold text-gray-900">{orderStatusLabel(entry.status)}</p>
                <p className="text-[11px] text-gray-500">{formatOrderDateTime(entry.at)}</p>
                {entry.note && <p className="text-xs text-gray-600">{entry.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
