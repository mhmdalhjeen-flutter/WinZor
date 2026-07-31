import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { createDefaultCheckoutDraft } from '../utils/checkoutConstants';

const CheckoutContext = createContext(null);

export function CheckoutProvider({ children }) {
  const [draftsByStore, setDraftsByStore] = useState({});
  const [checkoutMode, setCheckoutMode] = useState('single');
  const [activeStoreIds, setActiveStoreIds] = useState([]);
  const [submitResult, setSubmitResult] = useState(null);

  const getDraft = useCallback(
    (storeId, customerNotes = '') => {
      if (draftsByStore[storeId]) return draftsByStore[storeId];
      return createDefaultCheckoutDraft(customerNotes);
    },
    [draftsByStore],
  );

  const updateDraft = useCallback((storeId, patch) => {
    setDraftsByStore((prev) => ({
      ...prev,
      [storeId]: {
        ...(prev[storeId] || createDefaultCheckoutDraft()),
        ...patch,
      },
    }));
  }, []);

  const startCheckout = useCallback(({ mode = 'single', storeIds = [], notesByStore = {} }) => {
    setCheckoutMode(mode);
    setActiveStoreIds(storeIds);
    setSubmitResult(null);

    setDraftsByStore((prev) => {
      const next = { ...prev };
      storeIds.forEach((storeId) => {
        if (!next[storeId]) {
          next[storeId] = createDefaultCheckoutDraft(notesByStore[storeId] || '');
        } else if (notesByStore[storeId] && !next[storeId].customerNotes) {
          next[storeId] = { ...next[storeId], customerNotes: notesByStore[storeId] };
        }
      });
      return next;
    });
  }, []);

  const clearCheckout = useCallback(() => {
    setCheckoutMode('single');
    setActiveStoreIds([]);
    setSubmitResult(null);
  }, []);

  const value = useMemo(
    () => ({
      draftsByStore,
      checkoutMode,
      activeStoreIds,
      submitResult,
      getDraft,
      updateDraft,
      startCheckout,
      setSubmitResult,
      clearCheckout,
    }),
    [
      draftsByStore,
      checkoutMode,
      activeStoreIds,
      submitResult,
      getDraft,
      updateDraft,
      startCheckout,
      clearCheckout,
    ],
  );

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) {
    throw new Error('useCheckout must be used within CheckoutProvider');
  }
  return ctx;
}
