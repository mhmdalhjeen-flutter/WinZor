import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, Camera, LayoutGrid, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useVerificationGate } from '../context/VerificationGateContext';
import { useToast } from '../shared/Toast';
import { queryClient, queryKeys } from '../lib/queryClient';
import { setPointsFloatOrigin, commitPointsUpdate } from '../utils/pointsAnimation';
import usePlatformSettings from '../hooks/usePlatformSettings';
import ReferralCardsModal from './ReferralCardsModal';
import QuickAccessSheet from './QuickAccessSheet';
import {
  ENTER_CARD_EVENT,
  REFERRAL_CARDS_EVENT,
} from '../utils/pointsGuideEvents';
import {
  OPEN_GIFT_ACTIVATION_EVENT,
  GIFT_POST_FLOW_EVENT,
  parseGiftCodeFromPayload,
  isGiftActivationFlowActive,
  isLikelyGiftCode,
  markGiftPostFlowPending,
  clearGiftActivationFlow,
} from '../utils/giftActivationFlow';
import StoreFollowChoiceModal from './giftActivation/StoreFollowChoiceModal';

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
  const [giftFlow, setGiftFlow] = useState(false);
  const [followChoice, setFollowChoice] = useState(null);
  const codeBtnRef = useRef(null);
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const { toast } = useToast();
  const { data: platformSettings } = usePlatformSettings();
  const features = platformSettings?.features || {};
  const showMarketplace = features.marketplace !== false;
  const [quickAccessOpen, setQuickAccessOpen] = useState(false);
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
          const parsed = parseGiftCodeFromPayload(decoded);
          if (parsed) {
            setCode(parsed);
            setGiftFlow(isLikelyGiftCode(parsed) || isGiftActivationFlowActive());
          }
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
                const parsed = parseGiftCodeFromPayload(codes[0].rawValue);
                if (parsed) {
                  setCode(parsed);
                  setGiftFlow(isLikelyGiftCode(parsed) || isGiftActivationFlowActive());
                }
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

      window.setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setCode('');

        if (giftFlow && data.storeId) {
          setFollowChoice({
            storeId: data.storeId,
            storeName: data.storeName || 'المتجر',
          });
          return;
        }

        clearGiftActivationFlow();
        if (data.storeId) {
          navigate(`/store/${data.storeId}`);
        }
      }, giftFlow ? 1600 : 2200);
    } catch (err) {
      if (handleApiVerificationError(err, handleRedeem)) return;
      toast(err.response?.data?.message || 'فشل تفعيل الكود', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCodeModal = useCallback((prefillCode = '', fromGiftFlow = false) => {
    runWithVerification(() => {
      if (prefillCode) setCode(prefillCode);
      setGiftFlow(fromGiftFlow || isGiftActivationFlowActive());
      setIsOpen(true);
    });
  }, [runWithVerification]);

  useEffect(() => {
    const openCodeFromGuide = () => openCodeModal('', false);
    const openReferralFromGuide = () => setReferralOpen(true);
    const openGiftActivation = (event) => {
      const detail = event.detail || {};
      openCodeModal(detail.code || '', detail.giftFlow !== false);
    };

    window.addEventListener(ENTER_CARD_EVENT, openCodeFromGuide);
    window.addEventListener(REFERRAL_CARDS_EVENT, openReferralFromGuide);
    window.addEventListener(OPEN_GIFT_ACTIVATION_EVENT, openGiftActivation);
    return () => {
      window.removeEventListener(ENTER_CARD_EVENT, openCodeFromGuide);
      window.removeEventListener(REFERRAL_CARDS_EVENT, openReferralFromGuide);
      window.removeEventListener(OPEN_GIFT_ACTIVATION_EVENT, openGiftActivation);
    };
  }, [openCodeModal]);

  const finishFollowChoice = () => {
    const choice = followChoice;
    setFollowChoice(null);
    markGiftPostFlowPending();
    window.dispatchEvent(new CustomEvent(GIFT_POST_FLOW_EVENT));
    if (choice?.storeId) {
      navigate(`/store/${choice.storeId}`);
    }
  };

  if (viewerOpen) return null;

  return (
    <>
      {!guideOpen && (
        <div className="floating-actions-stack">
          <motion.button
            ref={codeBtnRef}
            type="button"
            onClick={() => setQuickAccessOpen(true)}
            whileHover={{ y: -2, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className="floating-action-btn group relative flex h-[3.65rem] w-[3.65rem] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[1.125rem] text-white ring-1 ring-red-100/80"
            style={{
              boxShadow: '0 10px 28px -8px rgba(185, 28, 28, 0.38), 0 4px 12px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255,255,255,0.28)',
            }}
            aria-label="الوصول السريع"
          >
            <span className="absolute inset-0 bg-gradient-to-br from-[#c41f1f] via-primary to-[#991b1b]" aria-hidden />
            <span
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.22), transparent 55%)' }}
              aria-hidden
            />
            <span className="relative z-[1] flex items-center justify-center">
              <LayoutGrid size={20} strokeWidth={2.25} />
            </span>
            <span className="relative z-[1] px-1 text-center font-cairo text-[8.5px] font-black leading-[1.05] tracking-tight">
              وصول<br />سريع
            </span>
          </motion.button>
        </div>
      )}

      <QuickAccessSheet
        open={quickAccessOpen}
        onClose={() => setQuickAccessOpen(false)}
        showMarketplace={showMarketplace}
        onEnterCode={() => openCodeModal('', false)}
        onMarketplace={() => navigate('/marketplace')}
        onPoints={() => navigate('/center')}
      />

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
                  <QrCode size={28} className="text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-gray-900">
                    {giftFlow ? 'إدخال الكود' : 'شحن سريع للنقاط'}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-bold px-2">
                    {giftFlow
                      ? 'الكود جاهز — اضغط تفعيل الكود للحصول على نقاطك'
                      : 'امسح QR أو أدخل الكود من المتجر'}
                  </p>
                </div>

                {!success && (
                  <div className="w-full space-y-3">
                    {!giftFlow && (
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
                    )}

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
                      {loading ? <Loader2 className="animate-spin" size={18} /> : (giftFlow ? 'تفعيل الكود' : 'تفعيل الكود الآن')}
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
                    <p className="font-black text-green-600">
                      {giftFlow ? 'تم تفعيل الكود بنجاح!' : 'تم شحن نقاطك بنجاح!'}
                    </p>
                    {rewardPoints > 0 && (
                      <p className="text-sm text-amber-600 font-black">
                        {giftFlow ? `احصل على ${rewardPoints} نقطة` : `+${rewardPoints} نقطة`}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400">
                      {giftFlow ? 'جاري إعداد تجربتك...' : 'جاري الانتقال للمتجر...'}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <StoreFollowChoiceModal
        open={Boolean(followChoice)}
        storeId={followChoice?.storeId}
        storeName={followChoice?.storeName}
        onComplete={finishFollowChoice}
      />
    </>
  );
};

export default FloatingCodeButton;
