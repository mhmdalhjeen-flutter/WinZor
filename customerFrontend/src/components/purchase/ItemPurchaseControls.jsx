import { useState } from 'react';
import { Plus, Minus, Loader2 } from 'lucide-react';
import {
  normalizePurchaseMode,
  getDefaultPurchaseMethod,
  supportsQuantity,
  supportsPrice,
} from '../../utils/purchaseMode';
import { formatPrice } from '../../utils/currency';
import '../../styles/itemPurchase.css';

/**
 * Inline purchase controls for catalog cards and product detail.
 * compact = true for grid cards; false for detail page.
 */
export default function ItemPurchaseControls({
  item,
  itemType = 'product',
  currency = 'ILS',
  compact = true,
  busy = false,
  onAdd,
  onUpdate,
  currentQty = 0,
  currentAmount = 0,
  currentMethod,
}) {
  const purchaseMode = normalizePurchaseMode(item?.purchaseMode);
  const showQty = supportsQuantity(purchaseMode);
  const showPrice = supportsPrice(purchaseMode);
  const showToggle = purchaseMode === 'both';

  const [method, setMethod] = useState(
    () => currentMethod || getDefaultPurchaseMethod(purchaseMode),
  );
  const [amountInput, setAmountInput] = useState(
    () => (currentAmount > 0 ? String(currentAmount) : ''),
  );

  const activeMethod = showToggle ? method : (showPrice && !showQty ? 'price' : 'quantity');
  const inCart = activeMethod === 'price' ? currentAmount > 0 : currentQty > 0;

  const handleMethodChange = (next) => {
    setMethod(next);
    if (onUpdate && inCart) {
      if (next === 'price' && amountInput) {
        onUpdate({ purchaseMethod: 'price', requestedAmount: amountInput, quantity: 1 });
      } else if (next === 'quantity' && currentQty > 0) {
        onUpdate({ purchaseMethod: 'quantity', quantity: currentQty });
      }
    }
  };

  const addByQty = (e, qty) => {
    e?.stopPropagation?.();
    if (busy) return;
    onAdd?.({ purchaseMethod: 'quantity', quantity: qty });
  };

  const addByPrice = (e) => {
    e?.stopPropagation?.();
    if (busy) return;
    const val = parseFloat(String(amountInput).replace(',', '.'));
    if (!Number.isFinite(val) || val <= 0) return;
    onAdd?.({ purchaseMethod: 'price', requestedAmount: val, quantity: 1 });
  };

  const changeQty = (e, nextQty) => {
    e?.stopPropagation?.();
    if (busy) return;
    onUpdate?.({ purchaseMethod: 'quantity', quantity: nextQty });
  };

  const changeAmount = (e) => {
    e?.stopPropagation?.();
    if (busy) return;
    const val = parseFloat(String(amountInput).replace(',', '.'));
    if (!Number.isFinite(val) || val <= 0) {
      onUpdate?.({ purchaseMethod: 'price', quantity: 0 });
      return;
    }
    onUpdate?.({ purchaseMethod: 'price', requestedAmount: val, quantity: 1 });
  };

  if (itemType !== 'product' || (!showQty && !showPrice)) {
    return (
      <div className={`item-purchase${compact ? ' item-purchase--compact' : ''}`} onClick={(e) => e.stopPropagation()}>
        {inCart ? (
          <div className="item-purchase__qty">
            <button type="button" className="item-purchase__qty-btn" disabled={busy} onClick={(e) => changeQty(e, currentQty - 1)}>
              <Minus size={16} />
            </button>
            <span className="item-purchase__qty-value">{busy ? <Loader2 size={14} className="animate-spin" /> : currentQty}</span>
            <button type="button" className="item-purchase__qty-btn" disabled={busy || currentQty >= 99} onClick={(e) => changeQty(e, currentQty + 1)}>
              <Plus size={16} />
            </button>
          </div>
        ) : (
          <button type="button" className="item-purchase__add" disabled={busy} onClick={(e) => addByQty(e, 1)}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`item-purchase${compact ? ' item-purchase--compact' : ''}`} onClick={(e) => e.stopPropagation()}>
      {showToggle && (
        <div className="item-purchase__toggle">
          <button
            type="button"
            className={activeMethod === 'quantity' ? 'active' : ''}
            onClick={() => handleMethodChange('quantity')}
          >
            بالكمية
          </button>
          <button
            type="button"
            className={activeMethod === 'price' ? 'active' : ''}
            onClick={() => handleMethodChange('price')}
          >
            بالقيمة
          </button>
        </div>
      )}

      {activeMethod === 'price' ? (
        <div className="item-purchase__price-row">
          <input
            type="text"
            inputMode="decimal"
            className="item-purchase__price-input"
            placeholder="أدخل القيمة المطلوبة"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value.replace(/[^\d.,]/g, ''))}
            onKeyDown={(e) => { if (e.key === 'Enter') addByPrice(e); }}
            aria-label="القيمة المطلوبة"
          />
          <span className="item-purchase__currency">{formatPrice(0, currency).replace(/[\d.,\s]/g, '').trim() || '₪'}</span>
          {inCart ? (
            <button type="button" className="item-purchase__confirm" disabled={busy} onClick={changeAmount}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : 'تحديث'}
            </button>
          ) : (
            <button type="button" className="item-purchase__confirm" disabled={busy || !amountInput} onClick={addByPrice}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : 'إضافة'}
            </button>
          )}
        </div>
      ) : inCart ? (
        <div className="item-purchase__qty">
          <button type="button" className="item-purchase__qty-btn" disabled={busy} onClick={(e) => changeQty(e, currentQty - 1)}>
            <Minus size={16} />
          </button>
          <span className="item-purchase__qty-value">{busy ? <Loader2 size={14} className="animate-spin" /> : currentQty}</span>
          <button type="button" className="item-purchase__qty-btn" disabled={busy || currentQty >= 99} onClick={(e) => changeQty(e, currentQty + 1)}>
            <Plus size={16} />
          </button>
        </div>
      ) : (
        <button type="button" className="item-purchase__add" disabled={busy} onClick={(e) => addByQty(e, 1)}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        </button>
      )}
    </div>
  );
}
