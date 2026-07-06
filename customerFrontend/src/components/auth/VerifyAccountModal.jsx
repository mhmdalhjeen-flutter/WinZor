import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Phone, X, Loader2, RotateCw } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../shared/Toast';
import { useVerificationGate } from '../../context/VerificationGateContext';
import { queryClient, queryKeys } from '../../lib/queryClient';
import VerificationCelebration from './VerificationCelebration';

const RESEND_COOLDOWN_SEC = 60;

const parseWaitSeconds = (message) => {
  const match = String(message || '').match(/(\d+)\s*ثانية/);
  return match ? Number(match[1]) : RESEND_COOLDOWN_SEC;
};

const VerifyAccountModal = ({ open, onClose, onVerified }) => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const { policy } = useVerificationGate();
  const [channel, setChannel] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const [bonus, setBonus] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (!open) {
      setChannel(null);
      setCode('');
      setError('');
      setCelebrate(false);
      setBonus(0);
      setResendSeconds(0);
    }
  }, [open]);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const finishVerification = (data) => {
    onVerified?.(data);
    onClose?.();
  };

  const sendVerificationCode = async (ch, { isResend = false } = {}) => {
    setLoading(true);
    setError('');
    if (!isResend) setChannel(ch);

    try {
      const { data } = await api.post('/auth/verify/request', { channel: ch });
      if (!isResend) setCode('');
      setResendSeconds(RESEND_COOLDOWN_SEC);
      toast(isResend ? 'تم إعادة إرسال الرمز' : (data.message || 'تم إرسال الرمز'), 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل إرسال الرمز';
      setError(msg);
      if (err.response?.status === 429) {
        setResendSeconds(parseWaitSeconds(msg));
      }
      if (!isResend) setChannel(null);
    } finally {
      setLoading(false);
    }
  };

  const requestCode = (ch) => sendVerificationCode(ch);

  const resendCode = () => {
    if (!channel || loading || resendSeconds > 0) return;
    sendVerificationCode(channel, { isResend: true });
  };

  const confirmCode = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify/confirm', { channel, code });
      const bonusPoints = data.bonusPoints || 0;
      updateUser({
        ...data.user,
        points: data.points,
        isVerified: true,
        emailVerified: data.user?.emailVerified,
        phoneVerified: data.user?.phoneVerified,
        verificationBonusAwarded: bonusPoints > 0 || user?.verificationBonusAwarded,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.competitionsList });
      window.dispatchEvent(
        new CustomEvent('user:verified', {
          detail: { bonusPoints, points: data.points },
        })
      );
      if (bonusPoints > 0) {
        toast(`تم التوثيق — +${bonusPoints} نقاط هدية!`, 'success');
      } else {
        toast(data.message || 'تم توثيق حسابك', 'success');
      }
      setBonus(bonusPoints);
      setCelebrate(true);
    } catch (err) {
      setError(err.response?.data?.message || 'رمز غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const canVerifyEmail = policy.emailAvailable && user?.email;
  const canVerifyPhone = policy.phoneAvailable && user?.phone;
  const hasVerificationChannel = canVerifyEmail || canVerifyPhone;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
        onClick={celebrate ? undefined : onClose}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-[32px] bg-white p-6 text-right shadow-2xl"
          dir="rtl"
        >
          {!celebrate ? (
            <>
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-black text-gray-900">
                    <ShieldCheck className="text-primary" size={22} /> وثّق حسابك
                  </h3>
                  <p className="mt-1 text-xs font-bold text-gray-500">
                    سيتم إرسال رمز حقيقي إلى بريدك أو SMS إلى هاتفك — السلة والأكواد والمسابقات تحتاج توثيق
                  </p>
                </div>
                <button type="button" onClick={onClose}>
                  <X size={22} className="text-gray-400" />
                </button>
              </div>

              {!channel ? (
                <div className="space-y-3">
                  {!hasVerificationChannel ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-center">
                      <p className="text-sm font-black text-amber-900">التوثيق غير متاح حالياً</p>
                      <p className="mt-2 text-xs font-bold text-amber-700/80">
                        {policy.enforced
                          ? 'خدمة البريد أو SMS غير مهيّأة بعد — يمكنك استخدام المنصة بدون توثيق.'
                          : 'يمكنك استخدام المنصة بدون توثيق حتى يتم تفعيل خدمة البريد أو SMS.'}
                      </p>
                    </div>
                  ) : !user?.email && !user?.phone ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-center">
                      <p className="text-sm font-black text-amber-900">لا يوجد بريد أو هاتف مرتبط</p>
                      <p className="mt-2 text-xs font-bold text-amber-700/80">
                        أضف بريداً أو رقم هاتف من مركز المستخدم ثم عد للتوثيق.
                      </p>
                    </div>
                  ) : (
                    <>
                      {canVerifyEmail && (
                    <button
                      type="button"
                      onClick={() => requestCode('email')}
                      disabled={loading}
                      className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-sm font-black hover:border-primary/30"
                    >
                      <Mail size={20} className="text-primary" />
                      <div className="text-right">
                        <p>توثيق البريد</p>
                        <p className="text-[10px] font-bold text-gray-400">{user.email}</p>
                      </div>
                    </button>
                  )}
                  {canVerifyPhone && (
                    <button
                      type="button"
                      onClick={() => requestCode('phone')}
                      disabled={loading}
                      className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-sm font-black hover:border-primary/30"
                    >
                      <Phone size={20} className="text-primary" />
                      <div className="text-right">
                        <p>توثيق الهاتف</p>
                        <p className="text-[10px] font-bold text-gray-400" dir="ltr">
                          {user.phone}
                        </p>
                      </div>
                    </button>
                  )}
                  <p className="rounded-xl bg-amber-50 py-2 text-center text-[10px] font-black text-amber-600">
                    🎁 +5 نقاط مجانية بعد التوثيق!
                  </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-center text-[10px] font-bold text-gray-400">
                    {channel === 'email'
                      ? 'تحقق من بريدك — قد يستغرق دقيقة. راجع مجلد Spam.'
                      : 'تحقق من رسائل SMS على هاتفك'}
                  </p>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6 أرقام"
                    maxLength={6}
                    className="w-full rounded-2xl border-2 border-gray-100 py-4 text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={confirmCode}
                    disabled={loading || code.length < 6}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-black text-white disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'تأكيد التوثيق'}
                  </button>
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={loading || resendSeconds > 0}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 py-3 text-sm font-black text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
                    {resendSeconds > 0
                      ? `إعادة الإرسال بعد ${resendSeconds} ث`
                      : 'إعادة إرسال الرمز'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChannel(null);
                      setResendSeconds(0);
                      setCode('');
                      setError('');
                    }}
                    className="w-full text-xs font-bold text-gray-400"
                  >
                    رجوع
                  </button>
                </div>
              )}

              {error && <p className="mt-3 text-center text-xs font-bold text-red-500">{error}</p>}
            </>
          ) : (
            <VerificationCelebration
              bonus={bonus}
              onDone={() => finishVerification({ bonusPoints: bonus, verified: true })}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VerifyAccountModal;
