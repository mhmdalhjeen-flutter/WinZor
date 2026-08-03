import React, { useState, useCallback } from 'react';
import { Eye, ImageOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../shared/Toast';
import { useVerificationGate } from '../../context/VerificationGateContext';
import { useAuth } from '../../context/AuthContext';
import useCartSummary from '../../hooks/useCartSummary';
import { addItemToCart, updateCartItemQty } from '../../utils/cartActions';
import { findCartRow } from '../../utils/cartHelpers';
import { CART_VERIFICATION } from '../../utils/verificationGateConfig';
import { normalizePurchaseMode, getDefaultPurchaseMethod } from '../../utils/purchaseMode';
import ItemPurchaseControls from '../purchase/ItemPurchaseControls';

export default function StoreCatalogCard({
  item,
  itemType,
  title,
  priceLabel,
  imageSrc,
  imageSrcSet,
  detailPath,
  unavailable = false,
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const { isAuth } = useAuth();
  const { data: cartStats } = useCartSummary();
  const [busy, setBusy] = useState(false);

  const purchaseMode = itemType === 'product' ? normalizePurchaseMode(item?.purchaseMode) : 'quantity';
  const defaultMethod = getDefaultPurchaseMethod(purchaseMode);
  const qtyRow = findCartRow(cartStats, item._id, itemType, 'quantity');
  const priceRow = findCartRow(cartStats, item._id, itemType, 'price');
  const currentQty = qtyRow?.quantity || 0;
  const currentAmount = priceRow?.requestedAmount ?? priceRow?.lineTotal ?? 0;

  const runCartAction = useCallback(async (action) => {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      if (handleApiVerificationError(err, action, CART_VERIFICATION)) return;
      toast(err.response?.data?.message || 'تعذّر تحديث السلة', 'error');
    } finally {
      setBusy(false);
    }
  }, [handleApiVerificationError, toast]);

  const wrapAction = (action) => {
    if (!isAuth) {
      runCartAction(action);
      return;
    }
    runWithVerification(() => runCartAction(action), CART_VERIFICATION);
  };

  const handleAdd = ({ purchaseMethod, quantity, requestedAmount }) => {
    wrapAction(() => addItemToCart({
      item,
      itemType,
      quantity,
      purchaseMethod,
      requestedAmount,
      isAuth,
    }));
  };

  const handleUpdate = ({ purchaseMethod, quantity, requestedAmount }) => {
    wrapAction(() => updateCartItemQty({
      itemId: item._id,
      itemType,
      quantity: quantity ?? 0,
      purchaseMethod,
      requestedAmount,
      isAuth,
    }));
  };

  return (
    <article
      className={`store-catalog-card${unavailable ? ' store-catalog-card--unavailable' : ''}`}
      onClick={() => navigate(detailPath)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(detailPath); }}
    >
      <div className="store-catalog-card__media">
        {imageSrc ? (
          <img
            src={imageSrc}
            srcSet={imageSrcSet}
            sizes="(max-width: 640px) 50vw, 220px"
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="store-catalog-card__placeholder">
            <ImageOff size={28} strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="store-catalog-card__body">
        <h4 className="store-catalog-card__title">{title}</h4>
        {priceLabel && (
          <p className="store-catalog-card__price">{priceLabel}</p>
        )}

        {unavailable ? (
          <p className="store-catalog-card__unavailable">غير متوفر حالياً</p>
        ) : (
        <div className="store-catalog-card__actions">
          <button
            type="button"
            className="store-catalog-card__details"
            onClick={(e) => { e.stopPropagation(); navigate(detailPath); }}
          >
            <Eye size={14} strokeWidth={2.2} />
            تفاصيل
          </button>

          <ItemPurchaseControls
            item={item}
            itemType={itemType}
            currency={item?.currency}
            compact
            busy={busy}
            currentQty={currentQty}
            currentAmount={currentAmount}
            currentMethod={defaultMethod}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
          />
        </div>
        )}
      </div>
    </article>
  );
}
