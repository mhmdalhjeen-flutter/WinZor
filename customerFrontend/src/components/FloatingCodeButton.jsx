import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Loader2, CheckCircle2, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useVerificationGate } from '../context/VerificationGateContext';
import { useToast } from '../shared/Toast';
import { queryClient, queryKeys } from '../lib/queryClient';
import { setPointsFloatOrigin, commitPointsUpdate } from '../utils/pointsAnimation';
import {
  ENTER_CARD_EVENT,
} from '../utils/pointsGuideEvents';
import { overlayFade, sheetSpring } from '../utils/motionPresets';
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

const WHATSAPP_NUMBER = '970592090288';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

function WhatsAppIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function PremiumFloatingButton({
  onClick,
  label,
  icon: Icon,
  iconNode,
  tone = 'primary',
  buttonRef,
}) {
  const tones = {
    primary: {
      gradient: 'from-[#c41f1f] via-primary to-[#991b1b]',
      glow: 'rgba(185, 28, 28, 0.38)',
      ring: 'ring-red-100/80',
    },
    amber: {
      gradient: 'from-amber-400 via-amber-500 to-orange-600',
      glow: 'rgba(245, 158, 11, 0.38)',
      ring: 'ring-amber-100/80',
    },
    emerald: {
      gradient: 'from-emerald-500 via-green-500 to-teal-600',
      glow: 'rgba(16, 185, 129, 0.38)',
      ring: 'ring-emerald-100/80',
    },
  };

  const t = tones[tone] || tones.primary;

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      className={`floating-action-btn group relative flex h-[3.65rem] w-[3.65rem] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[1.125rem] text-white ring-1 ${t.ring}`}
      style={{
        boxShadow: `0 10px 28px -8px ${t.glow}, 0 4px 12px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255,255,255,0.28)`,
      }}
    >
      <span className={`absolute inset-0 bg-gradient-to-br ${t.gradient}`} aria-hidden />
      <span
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.22), transparent 55%)' }}
        aria-hidden
      />
      <span className="relative z-[1] flex items-center justify-center">
        {iconNode || (Icon ? <Icon size={20} strokeWidth={2.25} /> : null)}
      </span>
      <span className="relative z-[1] px-1 text-center font-cairo text-[8.5px] font-black leading-[1.05] tracking-tight">
        {label}
      </span>
    </motion.button>
  );
}

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
    const openGiftActivation = (event) => {
      const detail = event.detail || {};
      openCodeModal(detail.code || '', detail.giftFlow !== false);
    };

    window.addEventListener(ENTER_CARD_EVENT, openCodeFromGuide);
    window.addEventListener(OPEN_GIFT_ACTIVATION_EVENT, openGiftActivation);
    return () => {
      window.removeEventListener(ENTER_CARD_EVENT, openCodeFromGuide);
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
          <PremiumFloatingButton
            tone="primary"
            buttonRef={codeBtnRef}
            label={<>ادخل<br />الكود</>}
            icon={Zap}
            onClick={() => openCodeModal('', false)}
          />
          <PremiumFloatingButton
            tone="emerald"
            label={<>واتس<br />اب</>}
            iconNode={<WhatsAppIcon size={21} />}
            onClick={() => window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer')}
          />
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={overlayFade}
              onClick={() => !loading && setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={sheetSpring}
              className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[40px] p-6 sm:p-8 relative z-10 shadow-2xl text-right max-h-[92vh] overflow-y-auto will-change-transform"
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
