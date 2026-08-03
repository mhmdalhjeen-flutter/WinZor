import React from 'react';
import { Package } from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import { formatOrderLineMeta } from '../../utils/purchaseMode';
import { getCartRowName, getCartRowImage } from '../../utils/cartHelpers';

function InvoiceItemRow({ row }) {
  const name = getCartRowName(row);
  const image = getCartRowImage(row);
  const purchaseMethod = row.purchaseMethod || 'quantity';
  const unitPrice = row.unitPrice ?? row.item?.price ?? row.item?.finalPrice ?? 0;
  const lineTotal = row.lineTotal ?? (purchaseMethod === 'price' ? (row.requestedAmount ?? unitPrice) : unitPrice * row.quantity);
  const currency = row.item?.currency || 'ILS';

  return (
    <div className="checkout-invoice-item">
      <div className="checkout-invoice-item__media">
        {image ? (
          <img src={image} alt="" />
        ) : (
          <div className="checkout-invoice-item__placeholder">
            <Package size={16} />
          </div>
        )}
      </div>
      <div className="checkout-invoice-item__body">
        <p className="checkout-invoice-item__name">{name}</p>
        <div className="checkout-invoice-item__meta">
          <span>{formatOrderLineMeta(row, currency)}</span>
        </div>
      </div>
      <strong className="checkout-invoice-item__total">
        {formatPrice(lineTotal, currency)}
      </strong>
    </div>
  );
}

function getStoreLogo(container) {
  return container?.store?.logo
    || container?.items?.[0]?.item?.store?.logo
    || '';
}

function getStoreInitial(name) {
  return (name || 'م').charAt(0).toUpperCase();
}

export default function CheckoutInvoiceCard({ container }) {
  const storeName = container.storeName || container?.store?.name || 'متجر';
  const logo = getStoreLogo(container);
  const items = container.items || [];
  const subtotal = container.total ?? items.reduce((sum, row) => {
    const method = row.purchaseMethod || 'quantity';
    const line = row.lineTotal ?? (method === 'price'
      ? (row.requestedAmount ?? row.unitPrice ?? 0)
      : (row.unitPrice ?? 0) * row.quantity);
    return sum + line;
  }, 0);

  return (
    <article className="checkout-invoice">
      <header className="checkout-invoice__store">
        {logo ? (
          <img src={logo} alt="" className="checkout-invoice__logo" />
        ) : (
          <div className="checkout-invoice__logo checkout-invoice__logo--fallback">
            {getStoreInitial(storeName)}
          </div>
        )}
        <div>
          <span className="checkout-invoice__store-label">المتجر</span>
          <h2>{storeName}</h2>
        </div>
      </header>

      <div className="checkout-invoice__divider" />

      <div className="checkout-invoice__items">
        {items.map((row) => (
          <InvoiceItemRow
            key={`${row.item?._id || row.item?.id}-${row.itemType}-${row.purchaseMethod || 'quantity'}`}
            row={row}
          />
        ))}
      </div>

      <footer className="checkout-invoice__totals">
        <div className="checkout-invoice__row">
          <span>المجموع الفرعي</span>
          <strong>{formatPrice(subtotal, 'ILS')}</strong>
        </div>
        <div className="checkout-invoice__row checkout-invoice__row--final">
          <span>الإجمالي النهائي</span>
          <strong>{formatPrice(subtotal, 'ILS')}</strong>
        </div>
      </footer>
    </article>
  );
}
