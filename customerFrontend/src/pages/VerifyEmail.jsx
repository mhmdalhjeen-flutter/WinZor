import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { queryClient, queryKeys } from '../lib/queryClient';

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isAuth, updateUser } = useAuth();
  const [state, setState] = useState({ status: 'loading', message: '' });

  useEffect(() => {
    const token = params.get('token');
    const uid = params.get('uid');

    if (!token || !uid) {
      setState({ status: 'error', message: 'رابط التفعيل غير مكتمل' });
      return;
    }

    api
      .get('/auth/verify/email-link', { params: { token, uid } })
      .then(({ data }) => {
        if (isAuth && data.user) {
          updateUser({
            ...data.user,
            points: data.points,
            isVerified: data.user?.isVerified,
          });
          queryClient.invalidateQueries({ queryKey: queryKeys.me });
        }
        setState({
          status: 'success',
          message: data.message || 'تم توثيق بريدك الإلكتروني',
          bonusPoints: data.bonusPoints || 0,
        });
      })
      .catch((err) => {
        setState({
          status: 'error',
          message: err.response?.data?.message || 'تعذّر تفعيل البريد',
        });
      });
  }, [params, isAuth, updateUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070f] p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[32px] bg-white p-8 text-center shadow-2xl"
      >
        {state.status === 'loading' && (
          <>
            <Loader2 className="mx-auto mb-4 animate-spin text-primary" size={40} />
            <p className="font-black text-gray-800">جاري تأكيد بريدك...</p>
          </>
        )}

        {state.status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 text-green-500" size={48} />
            <h1 className="text-xl font-black text-gray-900">تم التوثيق</h1>
            <p className="mt-2 text-sm font-bold text-gray-600">{state.message}</p>
            {state.bonusPoints > 0 && (
              <p className="mt-2 text-xs font-black text-amber-600">+{state.bonusPoints} نقاط هدية!</p>
            )}
            <button
              type="button"
              onClick={() => navigate(isAuth ? '/' : '/login')}
              className="mt-6 w-full rounded-2xl bg-primary py-4 font-black text-white"
            >
              {isAuth ? 'متابعة' : 'تسجيل الدخول'}
            </button>
          </>
        )}

        {state.status === 'error' && (
          <>
            <XCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h1 className="text-xl font-black text-gray-900">تعذّر التفعيل</h1>
            <p className="mt-2 text-sm font-bold text-gray-600">{state.message}</p>
            <Link
              to={isAuth ? '/center' : '/login'}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 py-4 font-black text-gray-700"
            >
              <ShieldCheck size={18} /> {isAuth ? 'مركز المستخدم' : 'تسجيل الدخول'}
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
