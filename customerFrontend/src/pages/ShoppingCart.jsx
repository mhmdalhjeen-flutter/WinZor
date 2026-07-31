import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Loader2, Minus, Plus, Trash2, CheckCircle2, Package, ClipboardList,
} from 'lucide-react';
import { queryKeys } from '../lib/queryClient';
import { formatPrice } from '../utils/currency';
import {
  getCartRowId, getCartRowName, getCartRowImage, getStoreIdFromContainer, normalizeCartItemType,
} from '../utils/cartHelpers';
import useCartSummary from '../hooks/useCartSummary';
import { useToast } from '../shared/Toast';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../context/AuthGateContext';
import { useCheckout } from '../context/CheckoutContext';
import { AUTH_GATE_MESSAGES } from '../utils/authGateMessages';
import { updateCartItemQty, removeCartItem } from '../utils/cartActions';
import '../styles/shoppingCart.css';

function getStoreLogo(container) {
  return container?.store?.logo
    || container?.items?.[0]?.item?.store?.logo
    || '';
}

function getStoreInitial(name) {
  return (name || 'م').charAt(0).toUpperCase();
}

function CartItemRow({ row, busy, onUpdateQty, onRemove }) {
  const name = getCartRowName(row);
  const image = getCartRowImage(row);
  const unitPrice = row.unitPrice ?? row.item?.price ?? row.item?.finalPrice ?? 0;
  const lineTotal = row.lineTotal ?? unitPrice * row.quantity;
  const currency = row.item?.currency || 'ILS';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
      transition={{ type: 'spring', stiffness: 480, damping: 34 }}
      className="cart-item-row"
    >
      <div className="cart-item-row__media">
        {image ? (
          <img src={image} alt="" />
        ) : (
          <div className="cart-item-row__placeholder"><Package size={18} /></div>
        )}
      </div>

      <div className="cart-item-row__body">
        <p className="cart-item-row__name">{name}</p>
        <p className="cart-item-row__math">
          <span>{row.quantity} × {formatPrice(unitPrice, currency)}</span>
          <span className="cart-item-row__equals">= {formatPrice(lineTotal, currency)}</span>
        </p>
        <div className="cart-item-row__controls">
          <button
            type="button"
            className="cart-qty-btn"
            disabled={busy}
            onClick={() => onUpdateQty(row, row.quantity - 1)}
            aria-label="تقليل"
          >
            <Minus size={14} />
          </button>
          <span className="cart-qty-value">{row.quantity}</span>
          <button
            type="button"
            className="cart-qty-btn"
            disabled={busy || row.quantity >= 99}
            onClick={() => onUpdateQty(row, row.quantity + 1)}
            aria-label="زيادة"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            className="cart-remove-btn"
            disabled={busy}
            onClick={() => onRemove(row)}
            aria-label="حذف"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StoreContainerCard({
  container,
  index,
  proceeding,
  deleting,
  notes,
  onNotesChange,
  onUpdateQty,
  onRemove,
  onProceed,
  onDeleteContainer,
  busyItemId,
}) {
  const storeId = getStoreIdFromContainer(container);
  const storeName = container.storeName || container.store?.name || 'متجر';
  const logo = getStoreLogo(container);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, height: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32, delay: index * 0.04 }}
      className="store-container-card"
    >
      <header className="store-container-card__head">
        <div className="store-container-card__store">
          {logo ? (
            <img src={logo} alt="" className="store-container-card__logo" />
          ) : (
            <div className="store-container-card__logo store-container-card__logo--fallback">
              {getStoreInitial(storeName)}
            </div>
          )}
          <div className="store-container-card__store-text">
            <span className="store-container-card__store-label">🏪</span>
            <h3>{storeName}</h3>
          </div>
        </div>
        <button
          type="button"
          className="store-container-card__delete"
          disabled={deleting || proceeding}
          onClick={() => onDeleteContainer(storeId, storeName, container.items || [])}
        >
          <Trash2 size={14} />
          حذف السلة
        </button>
      </header>

      <div className="store-container-card__divider" />

      <div className="store-container-card__items">
        <AnimatePresence initial={false}>
          {(container.items || []).map((row) => (
            <CartItemRow
              key={`${getCartRowId(row)}-${normalizeCartItemType(row.itemType)}`}
              row={row}
              busy={busyItemId === getCartRowId(row)}
              onUpdateQty={onUpdateQty}
              onRemove={onRemove}
            />
          ))}
        </AnimatePresence>
      </div>

      <label className="store-container-card__notes">
        <span>ملاحظات للمتجر (اختياري)</span>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(storeId, e.target.value)}
          placeholder="مثال: بدون بصل، التوصيل بعد المغرب..."
          rows={2}
        />
      </label>

      <footer className="store-container-card__foot">
        <div className="store-container-card__total-block">
          <span className="store-container-card__total-label">إجمالي المتجر</span>
          <strong className="store-container-card__total-value">
            {formatPrice(container.total, 'ILS')}
          </strong>
        </div>
        <button
          type="button"
          className="store-container-card__confirm"
          disabled={proceeding || deleting}
          onClick={() => onProceed(storeId, storeName)}
        >
          {proceeding ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
          تأكيد الطلب
        </button>
      </footer>
    </motion.article>
  );
}

export default function ShoppingCart() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { isAuth } = useAuth();
  const { runWithAuth } = useAuthGate();
  const { startCheckout } = useCheckout();
  const { data: cartStats, isLoading } = useCartSummary();
  const [busyItemId, setBusyItemId] = useState(null);
  const [proceedingStoreId, setProceedingStoreId] = useState(null);
  const [deletingStoreId, setDeletingStoreId] = useState(null);
  const [proceedingAll, setProceedingAll] = useState(false);
  const [notesByStore, setNotesByStore] = useState({});

  const containers = cartStats?.containers || [];
  const grandTotal = cartStats?.grandTotal ?? 0;
  const storeCount = cartStats?.storeCount ?? 0;
  const itemCount = cartStats?.itemCount ?? 0;

  const updateNotes = (storeId, value) => {
    setNotesByStore((prev) => ({ ...prev, [storeId]: value }));
  };

  const refreshCart = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: queryKeys.cart });
  }, [qc]);

  const updateQty = async (row, newQty) => {
    const itemId = getCartRowId(row);
    const itemType = normalizeCartItemType(row.itemType);

    if (newQty <= 0) {
      await removeItem(row);
      return;
    }

    setBusyItemId(itemId);
    try {
      await updateCartItemQty({ itemId, itemType, quantity: newQty, isAuth });
      await refreshCart();
    } catch (err) {
      toast(err.response?.data?.message || 'تعذّر تحديث الكمية', 'error');
      await refreshCart();
    } finally {
      setBusyItemId(null);
    }
  };

  const removeItem = async (row) => {
    const itemId = getCartRowId(row);
    const itemType = normalizeCartItemType(row.itemType);
    setBusyItemId(itemId);
    try {
      await removeCartItem({ itemId, itemType, isAuth });
      await refreshCart();
    } catch (err) {
      toast(err.response?.data?.message || 'تعذّر الحذف', 'error');
    } finally {
      setBusyItemId(null);
    }
  };

  const deleteContainer = async (storeId, storeName, items) => {
    if (!window.confirm(`حذف سلة «${storeName}» وجميع منتجاتها؟`)) return;
    setDeletingStoreId(storeId);
    try {
      await Promise.all(
        items.map((row) => removeCartItem({
          itemId: getCartRowId(row),
          itemType: normalizeCartItemType(row.itemType),
          isAuth,
        })),
      );
      toast('تم حذف سلة المتجر', 'info');
      await refreshCart();
    } catch (err) {
      toast(err.response?.data?.message || 'تعذّر حذف السلة', 'error');
      await refreshCart();
    } finally {
      setDeletingStoreId(null);
    }
  };

  const proceedToCheckout = (storeId, storeName) => {
    setProceedingStoreId(storeId);
    startCheckout({
      mode: 'single',
      storeIds: [String(storeId)],
      notesByStore: { [storeId]: notesByStore[storeId] || '' },
    });
    navigate(`/checkout/review/${storeId}`);
    setProceedingStoreId(null);
  };

  const proceedStore = (storeId, storeName) => {
    runWithAuth(
      () => proceedToCheckout(storeId, storeName),
      AUTH_GATE_MESSAGES.orderConfirm,
    );
  };

  const proceedAllToCheckout = () => {
    setProceedingAll(true);
    const storeIds = containers.map((c) => String(getStoreIdFromContainer(c)));
    startCheckout({ mode: 'all', storeIds, notesByStore });
    navigate('/checkout/review/all');
    setProceedingAll(false);
  };

  const proceedAll = () => {
    runWithAuth(proceedAllToCheckout, AUTH_GATE_MESSAGES.orderConfirm);
  };

  return (
    <div className="shopping-cart-page" dir="rtl">
      <header className="shopping-cart-page__head">
        <div>
          <h1 className="shopping-cart-page__title">
            <ShoppingCart size={26} strokeWidth={2.2} />
            سلة المشتريات
          </h1>
          <p className="shopping-cart-page__lead">
            كل متجر له سلة مستقلة — Talabat-style
          </p>
        </div>
        <button
          type="button"
          className="shopping-cart-page__pending-orders"
          onClick={() => runWithAuth(() => navigate('/orders'), AUTH_GATE_MESSAGES.orderConfirm)}
        >
          <ClipboardList size={22} strokeWidth={2.2} />
          الطلبات قيد الانتظار
        </button>
      </header>

      {isLoading && (
        <div className="shopping-cart-page__loading">
          <Loader2 className="animate-spin" size={28} />
        </div>
      )}

      {!isLoading && storeCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="shopping-cart-page__empty"
        >
          <ShoppingCart size={52} strokeWidth={1.2} />
          <p>سلتك فارغة</p>
          <span>اضغط «اطلب الآن» على أي منتج أو عرض لإضافته هنا</span>
          <button type="button" onClick={() => navigate('/explore')} className="shopping-cart-page__cta">
            تصفّح المتاجر
          </button>
        </motion.div>
      )}

      {!isLoading && storeCount > 0 && (
        <>
          <div className="shopping-cart-page__containers">
            <AnimatePresence initial={false}>
              {containers.map((container, index) => {
                const storeId = getStoreIdFromContainer(container);
                return (
                  <StoreContainerCard
                    key={storeId || container.id}
                    container={container}
                    index={index}
                    proceeding={proceedingStoreId === storeId}
                    deleting={deletingStoreId === storeId}
                    notes={notesByStore[storeId] ?? container.customerNotes ?? ''}
                    onNotesChange={updateNotes}
                    onUpdateQty={updateQty}
                    onRemove={removeItem}
                    onProceed={proceedStore}
                    onDeleteContainer={deleteContainer}
                    busyItemId={busyItemId}
                  />
                );
              })}
            </AnimatePresence>
          </div>

          <motion.footer
            layout
            className="cart-grand-summary"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="cart-grand-summary__stats">
              <div className="cart-grand-summary__stat">
                <span>عدد المتاجر</span>
                <strong>{storeCount}</strong>
              </div>
              <div className="cart-grand-summary__stat">
                <span>عدد المنتجات</span>
                <strong>{itemCount}</strong>
              </div>
              <div className="cart-grand-summary__stat cart-grand-summary__stat--total">
                <span>الإجمالي الكلي</span>
                <strong>{formatPrice(grandTotal, 'ILS')}</strong>
              </div>
            </div>
            <button
              type="button"
              className="cart-grand-summary__confirm-all"
              disabled={proceedingAll || Boolean(proceedingStoreId) || Boolean(deletingStoreId)}
              onClick={proceedAll}
            >
              {proceedingAll ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              تأكيد جميع الطلبات
            </button>
          </motion.footer>
        </>
      )}

    </div>
  );
}
