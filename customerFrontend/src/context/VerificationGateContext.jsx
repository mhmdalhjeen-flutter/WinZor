import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { isVerifiedUser } from '../hooks/useVerification';
import { useAuth } from './AuthContext';
import VerificationPromptModal from '../components/auth/VerificationPromptModal';
import VerifyAccountModal from '../components/auth/VerifyAccountModal';

const VerificationGateContext = createContext(null);

export const VerificationGateProvider = ({ children }) => {
  const { user } = useAuth();
  const verified = isVerifiedUser(user);
  const pendingRef = useRef(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [promptConfig, setPromptConfig] = useState({});

  const openVerificationPrompt = useCallback((afterVerify, config = {}) => {
    pendingRef.current = afterVerify || null;
    setPromptConfig(config);
    setPromptOpen(true);
  }, []);

  const runWithVerification = useCallback(
    (action, config = {}) => {
      if (isVerifiedUser(user)) {
        action?.();
        return true;
      }
      openVerificationPrompt(action, config);
      return false;
    },
    [user, openVerificationPrompt]
  );

  const handleVerifyNow = () => {
    setPromptOpen(false);
    setVerifyOpen(true);
  };

  const handleLater = () => {
    setPromptOpen(false);
    setPromptConfig({});
    pendingRef.current = null;
  };

  const handleVerified = () => {
    setVerifyOpen(false);
    const fn = pendingRef.current;
    pendingRef.current = null;
    // تنفيذ الإجراء المحجوز بعد تحديث حالة المستخدم — بدون إعادة تسجيل دخول
    window.setTimeout(() => fn?.(), 80);
  };

  const handleApiVerificationError = useCallback(
    (err, retryAction, config = {}) => {
      if (err?.response?.data?.code === 'VERIFICATION_REQUIRED') {
        openVerificationPrompt(retryAction, config);
        return true;
      }
      return false;
    },
    [openVerificationPrompt]
  );

  return (
    <VerificationGateContext.Provider
      value={{
        verified,
        runWithVerification,
        openVerificationPrompt,
        handleApiVerificationError,
      }}
    >
      {children}
      <VerificationPromptModal
        open={promptOpen}
        config={promptConfig}
        onVerifyNow={handleVerifyNow}
        onLater={handleLater}
      />
      <VerifyAccountModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onVerified={handleVerified}
      />
    </VerificationGateContext.Provider>
  );
};

export const useVerificationGate = () => {
  const ctx = useContext(VerificationGateContext);
  if (!ctx) {
    throw new Error('useVerificationGate must be used within VerificationGateProvider');
  }
  return ctx;
};

export default VerificationGateContext;
