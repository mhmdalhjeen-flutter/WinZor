import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Zap, Loader2, CheckCircle2, Camera, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useVerificationGate } from '../context/VerificationGateContext';
import { useToast } from '../shared/Toast';
import { queryClient, queryKeys } from '../lib/queryClient';
import { setPointsFloatOrigin, commitPointsUpdate } from '../utils/pointsAnimation';
import ReferralCardsModal from './ReferralCardsModal';
import {
  ENTER_CARD_EVENT,
  REFERRAL_CARDS_EVENT,
} from '../utils/pointsGuideEvents';

const FloatingCodeButton = () => {
  const [viewerOpen, setViewerOpen] = useState(
    () => typeof document !== 'undefined' && document.body.classList.contains('offer-viewer-open')
  );
  const [guideOpen, setGuideOpen] = useState(
    () => typeof document !== 'undefined' && document.body.classList.contains('points-guide-open')
  );

  useEffect(() => {
    const sync = () => {
      setViewerOpen(document.body.classList.contains('offer-viewer-open'));
      setGuideOpen(document.body.classList.contains('points-guide-open'));
    };
    const obs = new MutationObserver(sync);
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [rewardPoints, setRewardPoints] = useState(0);
  const codeBtnRef = useRef(null);
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const { toast } = useToast();
  const [referralOpen, setReferralOpen] = useState(false);
  const scannerRef = useRef(null);
  const html5Ref = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopScanner = useCallback(async () => {
    setScanning(false);
    setScanError('');
    if (html5Ref.current) {
      try {
        await html5Ref.current.stop();
        html5Ref.current.clear();
      } catch { /* ignore */ }
      html5Ref.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) stopScanner();
    return () => { stopScanner(); };
  }, [isOpen, stopScanner]);

  const startScanner = async () => {
    setScanError('');
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader-inline');
      html5Ref.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 200, height: 200 } },
        (decoded) => {
          setCode(String(decoded).trim().toUpperCase());
          stopScanner();
        },
        () => {}
      );
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if ('BarcodeDetector' in window) {
          const detector = new BarcodeDetector({ formats: ['qr_code'] });
          const tick = async () => {
            if (!streamRef.current || !videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes[0]?.rawValue) {
                setCode(String(codes[0].rawValue).trim().toUpperCase());
                stopScanner();
                return;
              }
            } catch { /* ignore */ }
            if (streamRef.current) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        } else {
          setScanError('الكamera متاحة — أدخل الكود يدوياً أو ثبّت html5-qrcode');
        }
      } catch {
        setScanError('تعذّر فتح الكamera — استخدم الإدخال اليدوي');
        setScanning(false);
      }
    }
  };

  const handleRedeem = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    try {
      const { data } = await api.post('/promo/redeem', { code: code.trim() });
      const pts = data.rewards?.points || 0;
      setRewardPoints(pts);
      const btn = codeBtnRef.current;
      if (btn) {
        const r = btn.getBoundingClientRect();
        setPointsFloatOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }
      commitPointsUpdate(updateUser, data.userPoints, { energy: data.userEnergy, queryClient });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      setSuccess(true);

      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setCode('');
        if (data.storeId) {
          navigate(`/store/${data.storeId}`);
        }
      }, 2200);
    } catch (err) {
      if (handleApiVerificationError(err, handleRedeem)) return;
      toast(err.response?.data?.message || 'فشل تفعيل الكود', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const openCodeFromGuide = () => runWithVerification(() => setIsOpen(true));
    const openReferralFromGuide = () => setReferralOpen(true);
    window.addEventListener(ENTER_CARD_EVENT, openCodeFromGuide);
    window.addEventListener(REFERRAL_CARDS_EVENT, openReferralFromGuide);
    return () => {
      window.removeEventListener(ENTER_CARD_EVENT, openCodeFromGuide);
      window.removeEventListener(REFERRAL_CARDS_EVENT, openReferralFromGuide);
    };
  }, [runWithVerification]);

  if (viewerOpen) return null;

  return (
    <>
      {!guideOpen && (
        <>
          <button
            type="button"
            onClick={() => setReferralOpen(true)}
            className="fixed bottom-[8.5rem] left-6 z-50 w-16 h-16 flex items-center justify-center rounded-full bg-amber-500 text-white shadow-lg border-2 border-white hover:scale-110 active:scale-95 transition-all text-[9px] font-black text-center leading-tight"
          >
            كروت<br />مجانية
          </button>

          <button
            ref={codeBtnRef}
            type="button"
            onClick={() => runWithVerification(() => setIsOpen(true))}
            className="fixed bottom-[5.75rem] left-6 z-50 w-16 h-16 flex items-center justify-center rounded-full bg-primary text-white shadow-[0_0_22px_rgba(99,102,241,0.6)] border-2 border-white hover:scale-110 active:scale-95 transition-all duration-300 text-[10px] font-black text-center leading-tight"
          >
            ادخل<br />الكود
          </button>
        </>
      )}

      <ReferralCardsModal open={referralOpen} onClose={() => setReferralOpen(false)} />

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 24 }}
              className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[40px] p-6 sm:p-8 relative z-10 shadow-2xl text-right max-h-[92vh] overflow-y-auto"
              dir="rtl"
            >
              <button type="button" onClick={() => setIsOpen(false)} className="absolute top-5 left-5 text-gray-400 p-2">
                <X size={20} />
              </button>

              <div className="flex flex-col items-center gap-3">
                <div className="bg-primary/10 w-14 h-14 rounded-[20px] flex items-center justify-center">
                  <Zap size={28} className="text-primary fill-primary" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-gray-900">شحن سريع للنقاط</h3>
                  <p className="text-[11px] text-gray-400 font-bold px-2">امسح QR أو أدخل الكود من المتجر</p>
                </div>

                {!success && (
                  <div className="w-full space-y-3">
                    <div className="rounded-2xl overflow-hidden bg-gray-900 relative min-h-[160px]">
                      {scanning ? (
                        <>
                          <div id="qr-reader-inline" ref={scannerRef} className="w-full" />
                          <video ref={videoRef} className="w-full h-40 object-cover hidden" muted playsInline />
                        </>
                      ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-gray-400 gap-2">
                          <Camera size={32} />
                          <button
                            type="button"
                            onClick={startScanner}
                            className="text-xs font-black text-primary underline"
                          >
                            فتح ماسح QR
                          </button>
                        </div>
                      )}
                      {scanError && <p className="text-[10px] text-amber-600 p-2 text-center font-bold">{scanError}</p>}
                      {scanning && (
                        <button type="button" onClick={stopScanner} className="absolute top-2 left-2 text-white text-[10px] bg-black/50 px-2 py-1 rounded-lg">
                          إيقاف
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="PREFIX-XXXXXX"
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl py-3.5 px-5 text-center text-base font-black tracking-widest outline-none uppercase"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                    />
                    <button
                      type="button"
                      onClick={() => runWithVerification(handleRedeem)}
                      disabled={loading || !code.trim()}
                      className="w-full bg-primary text-white py-3.5 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : 'تفعيل الكود الآن'}
                    </button>
                  </div>
                )}

                {success && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-3 py-6"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6 }}
                    >
                      <CheckCircle2 size={56} className="text-green-500" />
                    </motion.div>
                    <p className="font-black text-green-600">تم شحن نقاطك بنجاح!</p>
                    {rewardPoints > 0 && (
                      <p className="text-sm text-amber-600 font-black">+{rewardPoints} نقطة</p>
                    )}
                    <p className="text-[10px] text-gray-400">جاري الانتقال للمتجر...</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingCodeButton;
