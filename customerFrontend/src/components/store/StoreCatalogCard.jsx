import React, { useState, useCallback } from 'react';
import { Plus, Minus, Eye, Loader2, ImageOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../shared/Toast';
import { useVerificationGate } from '../../context/VerificationGateContext';
import { useAuth } from '../../context/AuthContext';
import useCartSummary from '../../hooks/useCartSummary';
import { addItemToCart, updateCartItemQty } from '../../utils/cartActions';
import { cartItemMatches } from '../../utils/cartHelpers';
import { CART_VERIFICATION } from '../../utils/verificationGateConfig';

function getCartQuantity(cartStats, itemId, itemType) {
  for (const container of cartStats?.containers || []) {
    for (const row of container.items || []) {
      if (cartItemMatches(row, itemId, itemType)) {
        return row.quantity || 0;
      }
    }
  }
  return 0;
}

export default function StoreCatalogCard({
  item,
  itemType,
  title,
  priceLabel,
  imageSrc,
  imageSrcSet,
  detailPath,
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const { isAuth } = useAuth();
  const { data: cartStats } = useCartSummary();
  const [busy, setBusy] = useState(false);

  const qty = getCartQuantity(cartStats, item._id, itemType);

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

  const changeQty = (e, nextQty) => {
    e.stopPropagation();
    if (busy) return;

    const apply = async () => {
      if (nextQty <= 0) {
        await updateCartItemQty({ itemId: item._id, itemType, quantity: 0, isAuth });
      } else if (qty === 0) {
        await addItemToCart({ item: item, itemType, quantity: nextQty, isAuth });
      } else {
        await updateCartItemQty({ itemId: item._id, itemType, quantity: nextQty, isAuth });
      }
    };

    if (!isAuth) {
      runCartAction(apply);
      return;
    }
    runWithVerification(() => runCartAction(apply), CART_VERIFICATION);
  };

  const addFirst = (e) => changeQty(e, 1);

  return (
    <article
      className="store-catalog-card"
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

        <div className="store-catalog-card__actions">
          <button
            type="button"
            className="store-catalog-card__details"
            onClick={(e) => { e.stopPropagation(); navigate(detailPath); }}
          >
            <Eye size={14} strokeWidth={2.2} />
            تفاصيل
          </button>

          {qty > 0 ? (
            <div className="store-catalog-card__qty" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="store-catalog-card__qty-btn"
                disabled={busy}
                onClick={(e) => changeQty(e, qty - 1)}
                aria-label="تقليل"
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <span className="store-catalog-card__qty-value">
                {busy ? <Loader2 size={14} className="animate-spin" /> : qty}
              </span>
              <button
                type="button"
                className="store-catalog-card__qty-btn"
                disabled={busy || qty >= 99}
                onClick={(e) => changeQty(e, qty + 1)}
                aria-label="زيادة"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="store-catalog-card__add"
              disabled={busy}
              onClick={addFirst}
              aria-label="إضافة للسلة"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={2.5} />}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}