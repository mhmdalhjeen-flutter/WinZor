import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../context/AuthGateContext';
import { AUTH_GATE_MESSAGES } from '../utils/authGateMessages';

const ProtectedRoute = ({ children, message = AUTH_GATE_MESSAGES.generic }) => {
  const { isAuth } = useAuth();
  const { runWithAuth } = useAuthGate();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuth) {
      runWithAuth(null, message);
    }
  }, [isAuth, message, runWithAuth]);

  if (!isAuth) {
    return (
      <div className="py-16 text-center text-gray-400 font-bold" dir="rtl">
        <p>يلزم تسجيل الدخول للوصول إلى هذه الصفحة</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 text-primary font-black text-sm"
        >
          رجوع
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
