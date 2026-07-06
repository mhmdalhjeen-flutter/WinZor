import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVerificationGate } from '../../context/VerificationGateContext';
import { useAuth } from '../../context/AuthContext';
import { isVerifiedUser } from '../../hooks/useVerification';

/** يفتح نافذة التوثيق بعد التسجيل عند الحاجة */
const AuthWelcomeEffects = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openVerificationPrompt, policy } = useVerificationGate();

  useEffect(() => {
    if (!policy.enforced || !location.state?.suggestVerify || isVerifiedUser(user, policy)) return;
    const t = window.setTimeout(() => {
      openVerificationPrompt();
      navigate(location.pathname, { replace: true, state: {} });
    }, 600);
    return () => clearTimeout(t);
  }, [location.state?.suggestVerify, location.pathname, navigate, openVerificationPrompt, policy, user]);

  return null;
};

export default AuthWelcomeEffects;
