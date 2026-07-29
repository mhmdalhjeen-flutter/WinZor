import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { AUTH_GATE_MESSAGES } from '../utils/authGateMessages';
import { mergeGuestCartToServer } from '../utils/cartActions';
import { completePendingGiftActivation } from '../utils/giftActivationFlow';
import { completePendingPwaAction } from '../pwa/pwaShortcutActions';

const GuestAuthPromptModal = lazy(() => import('../components/auth/GuestAuthPromptModal'));

const AuthGateContext = createContext(null);

const AUTH_RETURN_PATH_KEY = 'winzor_auth_return_path';

export const AuthGateProvider = ({ children }) => {
  const { isAuth } = useAuth();
  const navigate = useNavigate();
  const pendingRef = useRef(null);
  const wasAuthedRef = useRef(isAuth);
  const [promptOpen, setPromptOpen] = useState(false);
  const [message, setMessage] = useState(AUTH_GATE_MESSAGES.generic);

  const closePrompt = useCallback(() => {
    setPromptOpen(false);
  }, []);

  const cancel = useCallback(() => {
    pendingRef.current = null;
    closePrompt();
  }, [closePrompt]);

  const resumePending = useCallback(() => {
    const action = pendingRef.current;
    pendingRef.current = null;
    if (action) {
      window.setTimeout(() => action(), 80);
    }
  }, []);

  const hasPendingAction = useCallback(() => pendingRef.current != null, []);

  const onAuthenticated = useCallback(async () => {
    closePrompt();
    try {
      await mergeGuestCartToServer();
    } catch {
      /* cart merge is best-effort */
    }

    let returnPath = '';
    try {
      returnPath = sessionStorage.getItem(AUTH_RETURN_PATH_KEY) || '';
      sessionStorage.removeItem(AUTH_RETURN_PATH_KEY);
    } catch {
      /* ignore */
    }

    if (returnPath && returnPath !== '/login' && returnPath !== '/register') {
      navigate(returnPath, { replace: true });
    }

    resumePending();
  }, [closePrompt, navigate, resumePending]);

  const runWithAuth = useCallback(
    (action, msg = AUTH_GATE_MESSAGES.generic) => {
      if (isAuth) {
        action?.();
        return true;
      }
      pendingRef.current = action || null;
      setMessage(msg);
      setPromptOpen(true);
      return false;
    },
    [isAuth],
  );

  const handlePhoneLogin = useCallback(() => {
    try {
      sessionStorage.setItem(AUTH_RETURN_PATH_KEY, window.location.pathname + window.location.search);
    } catch {
      /* ignore */
    }
    closePrompt();
    navigate('/login?phone=1');
  }, [closePrompt, navigate]);

  useEffect(() => {
    if (!wasAuthedRef.current && isAuth) {
      wasAuthedRef.current = true;
      if (completePendingGiftActivation(navigate)) return;
      if (completePendingPwaAction(navigate)) return;
      onAuthenticated();
      return;
    }
    wasAuthedRef.current = isAuth;
  }, [isAuth, navigate, onAuthenticated]);

  return (
    <AuthGateContext.Provider
      value={{
        runWithAuth,
        onAuthenticated,
        cancel,
        closePrompt,
        promptOpen,
        message,
        hasPendingAction,
      }}
    >
      {children}
      {promptOpen && (
        <Suspense fallback={null}>
          <GuestAuthPromptModal
            open={promptOpen}
            message={message}
            onPhoneLogin={handlePhoneLogin}
            onLater={cancel}
          />
        </Suspense>
      )}
    </AuthGateContext.Provider>
  );
};

export const useAuthGate = () => {
  const ctx = useContext(AuthGateContext);
  if (!ctx) {
    throw new Error('useAuthGate must be used within AuthGateProvider');
  }
  return ctx;
};

export default AuthGateContext;
