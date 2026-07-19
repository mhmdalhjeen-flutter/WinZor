import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera, Star, Trophy, Users, Store, Ticket, Gift, LogOut, Copy, Check,
  Lightbulb, Pencil, Phone, Mail, X, Headphones, ScrollText, Tags,
  Medal, Image as ImageIcon, Lock, ChevronLeft, CircleDot, Compass,
  Coins, Clock, CheckCircle2, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVerificationGate } from '../context/VerificationGateContext';
import { useCategoryTree } from '../hooks/useCategories';
import { getLocalPhoneError, normalizeLocalPhone } from '../utils/phoneValidation';
import PalestinianPhoneInput from '../components/PalestinianPhoneInput';
import PhoneDisplay from '../components/PhoneDisplay';
import { flattenCategoryTree } from '../utils/categoryTree';
import AchievementRoad from '../components/AchievementRoad';
import ReferralCardsModal from '../components/ReferralCardsModal';
import { getProgress } from '../shared/levels';
import usePlatformSettings from '../hooks/usePlatformSettings';
import { useCompetitionsList } from '../hooks/useCompetitionsList';
import { useSecondTick } from '../hooks/useSecondTick';
import { useRecentPointSources } from '../hooks/useRecentPointSources';
import { CompetitionModal, timeLeft } from './Competitions';
import CompetitionCountdownLabel from '../components/CompetitionCountdownLabel';
import { queryKeys } from '../lib/queryClient';
import LightLoadingHint from '../shared/LightLoadingHint';
import { uploadImage } from '../utils/imageUpload';
import { resolveImageUrl } from '../utils/mediaUrl';
import { resetAllOnboardingTours, ONBOARDING_RESET_EVENT } from '../utils/onboardingTour';
import api from '../api/axios';
import { BRAND_NAME } from '../utils/brandAssets';

function useAnimatedCounter(target, duration = 700) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef(null);

  useEffect(() => {
    if (target === fromRef.current) return undefined;

    const from = fromRef.current;
    const to = target;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return display;
}

const UserCenter = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const queryClient = useQueryClient();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const [copied, setCopied] = useState(false);

  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [showAvatar, setShowAvatar] = useState(false);

  const [phoneStep, setPhoneStep] = useState('idle');
  const [newPhone, setNewPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({ regionId: '', interests: [], storeTypes: [], productInterests: [] });

  const { data: storeCategoryTree = [] } = useCategoryTree('store');
  const { data: productCategoryTree = [] } = useCategoryTree('product');
  const storeCategoryOptions = flattenCategoryTree(storeCategoryTree);
  const productCategoryOptions = flattenCategoryTree(productCategoryTree);

  const [showLegal, setShowLegal] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');

  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [toast, setToast] = useState('');
  const [referralOpen, setReferralOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  const { data: platformSettings } = usePlatformSettings();
  const showWheelBtn = platformSettings?.features?.wheel !== false
    && platformSettings?.wheel?.placements?.userCenter !== false;
  const showCompetitionsBtn = platformSettings?.features?.storeCompetitions !== false;
  const showReferralEarn = platformSettings?.features?.referralProgram !== false;

  const {
    data: competitionsList = [],
    isLoading: competitionsLoading,
    isError: competitionsError,
    refetch: refetchCompetitions,
  } = useCompetitionsList({ enabled: showCompetitionsBtn });

  useSecondTick(
    showCompetitionsBtn && competitionsList.some((c) => c?.endDate && !c?.hasEnded),
  );

  const {
    data: recentPointSources = [],
    isLoading: pointSourcesLoading,
  } = useRecentPointSources(3);

  const {
    data: center,
    isLoading,
    refetch: refetchCenter,
  } = useQuery({
    queryKey: queryKeys.userCenter,
    queryFn: async () => {
      const { data } = await api.get('/users/me/center');
      updateUser({
        name: data.user?.name,
        avatar: data.user?.avatar,
        points: data.user?.points,
        codesUsed: data.user?.codesUsed,
      });
      return data;
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!center) return;
    setNameVal(center.user?.name || '');
    setPrefs({
      regionId: center.user?.preferences?.regionId?._id || center.user?.preferences?.regionId || '',
      interests: center.user?.preferences?.interests || [],
      storeTypes: center.user?.preferences?.storeTypes || [],
      productInterests: center.user?.preferences?.productInterests || [],
    });
  }, [center]);

  const refreshCenter = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.userCenter });
    queryClient.invalidateQueries({ queryKey: ['pointSources'] });
  }, [queryClient]);

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    enabled: showPrefs,
    queryFn: async () => {
      const { data } = await api.get('/regions');
      return Array.isArray(data) ? data : data.regions || [];
    },
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const points = center?.stats?.points ?? user?.points ?? 0;
  const displayPoints = useAnimatedCounter(points);
  const progress = center?.level || getProgress(points) || { stage: { label: '—', color: '#94a3b8', stars: 1 }, progress: 0, next: null, pointsToNext: 0 };
  const stats = center?.stats || {};
  const legal = center?.legal || {};

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(user?.referralCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveName = async () => {
    try {
      const { data } = await api.patch('/users/me/profile', { name: nameVal });
      updateUser({ name: data.user.name });
      setEditName(false);
      showToast('تم تحديث الاسم');
      refreshCenter();
    } catch (err) {
      showToast(err.response?.data?.message || 'فشل التحديث');
    }
  };

  const handleAvatarFile = async (file) => {
    if (!file) return;
    try {
      const avatar = await uploadImage(file);
      const { data } = await api.patch('/users/me/profile', { avatar });
      updateUser({ avatar: data.user.avatar });
      setShowAvatar(false);
      showToast('تم تحديث الصورة');
      refreshCenter();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'فشل رفع الصورة');
    }
  };

  const requestPhone = async () => {
    const err = getLocalPhoneError(newPhone);
    if (err) return showToast(err);
    try {
      const { data } = await api.post('/users/me/phone/request', {
        newPhone: normalizeLocalPhone(newPhone),
      });
      setPhoneStep('verify');
      showToast(data.message || 'تم إرسال رمز التحقق عبر SMS');
    } catch (err) {
      showToast(err.response?.data?.message || 'فشل الطلب');
    }
  };

  const verifyPhone = async () => {
    try {
      const { data } = await api.post('/users/me/phone/verify', { code: verifyCode });
      updateUser({ phone: data.phone });
      setPhoneStep('idle');
      setVerifyCode('');
      showToast('تم تحديث الهاتف');
      refreshCenter();
    } catch (err) {
      showToast(err.response?.data?.message || 'رمز غير صحيح');
    }
  };

  const savePreferences = async () => {
    const save = async () => {
      try {
        const { data } = await api.patch('/users/me/preferences', prefs);
        if (data.points != null) updateUser({ points: data.points, isVerified: true });
        setShowPrefs(false);
        showToast(data.message || 'تم الحفظ');
        refreshCenter();
      } catch (err) {
        if (handleApiVerificationError(err, save)) return;
        showToast(err.response?.data?.message || 'فشل الحفظ');
      }
    };
    runWithVerification(save);
  };

  const submitSuggestion = async () => {
    const send = async () => {
      try {
        await api.post('/users/me/suggestions', { message: suggestion });
        setSuggestion('');
        setShowSuggest(false);
        showToast('شكراً — وصل اقتراحك للإدارة');
      } catch (err) {
        if (handleApiVerificationError(err, send)) return;
        showToast(err.response?.data?.message || 'فشل الإرسال');
      }
    };
    runWithVerification(send);
  };

  const contactAdmin = async () => {
    try {
      const { data } = await api.get('/users/me/admin-contact');
      localStorage.setItem('chatContext', JSON.stringify({
        recipientId: data.adminId,
        context: { itemType: 'Support', itemName: 'تواصل مع الإدارة' },
        prefillText: 'مرحباً، أحتاج مساعدة من الإدارة.',
      }));
      navigate('/chat');
    } catch {
      showToast('تعذّر فتح المحادثة');
    }
  };

  const toggleArr = (key, val) => {
    setPrefs((p) => {
      const current = Array.isArray(p[key]) ? p[key] : [];
      return {
        ...p,
        [key]: current.includes(val) ? current.filter((x) => x !== val) : [...current, val],
      };
    });
  };

  const activeCompetitions = competitionsList.filter((comp) => {
    const ended = comp.hasEnded || (comp.endDate && new Date(comp.endDate) <= Date.now());
    return !ended;
  });

  if (isLoading && !center) {
    return (
      <div className="pb-28 text-right" dir="rtl">
        <LightLoadingHint label="جاري تحميل نقاطك..." />
      </div>
    );
  }

  if (!center) {
    return (
      <div className="pb-28 text-center text-gray-500 font-bold" dir="rtl">
        <p className="py-12">تعذّر تحميل مركز المستخدم</p>
        <button type="button" onClick={() => refetchCenter()} className="text-primary font-black">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-28 text-right" dir="rtl">
      {/* Profile & points hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="user-points-hero relative overflow-hidden rounded-[2rem] border border-white/20 p-5 text-white shadow-[0_20px_50px_-12px_rgba(88,28,135,0.45),0_8px_24px_-8px_rgba(220,38,38,0.35)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e0a3c] via-[#6d28d9] via-40% to-[#c41f1f]" aria-hidden />
        <div className="absolute -top-10 -right-8 h-36 w-36 rounded-full bg-amber-400/25 blur-3xl" aria-hidden />
        <div className="absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.22),transparent_42%)]" aria-hidden />

        <div className="relative">
          <div className="mb-4 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-black backdrop-blur-sm">
              <Trophy size={13} className="text-amber-300" />
              نقاطي
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/15 px-2.5 py-1 text-[10px] font-bold text-white/85">
              <Mail size={10} />
              {center?.user?.email || '—'}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <button type="button" onClick={() => setShowAvatar(true)} className="relative shrink-0">
              <div className="h-20 w-20 rounded-[1.35rem] bg-gradient-to-br from-amber-300 via-white to-violet-200 p-[3px] shadow-lg shadow-black/20">
                <img
                  src={center?.user?.avatar || user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                  alt=""
                  className="h-full w-full rounded-[1.2rem] bg-white object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 rounded-xl bg-white p-1.5 text-primary shadow-md">
                <Camera size={14} />
              </span>
            </button>

            <div className="min-w-0 flex-1">
              {editName ? (
                <div className="mt-1 flex gap-2">
                  <input
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    className="flex-1 rounded-xl px-3 py-1.5 text-sm font-bold text-gray-900"
                  />
                  <button type="button" onClick={saveName} className="rounded-xl bg-white/20 px-3 text-xs font-black">حفظ</button>
                  <button type="button" onClick={() => setEditName(false)} className="p-1"><X size={16} /></button>
                </div>
              ) : (
                <div className="mt-0.5 flex items-center gap-2">
                  <h1 className="truncate text-xl font-black">{center?.user?.name || user?.name}</h1>
                  <button type="button" onClick={() => setEditName(true)} className="opacity-85 hover:opacity-100">
                    <Pencil size={14} />
                  </button>
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/15 px-2.5 py-1 text-[11px] font-black"
                  style={{ color: progress.stage?.color }}
                >
                  <Medal size={12} className="text-amber-300" />
                  {progress.stage?.label}
                  <span className="text-white/85">
                    {'★'.repeat(progress.stage?.stars || 1)}
                  </span>
                </span>
                {center?.user?.phone && (
                  <button
                    type="button"
                    onClick={() => setPhoneStep('request')}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold hover:bg-white/20"
                  >
                    <Phone size={10} />
                    <PhoneDisplay phone={center.user.phone} className="text-[10px]" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="user-points-hero__focus relative mt-5 rounded-[1.35rem] border border-white/20 bg-black/20 px-4 py-5 text-center backdrop-blur-md">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" aria-hidden />
            <p className="text-sm font-bold text-amber-100/95">عدد النقاط</p>
            <motion.p
              key={displayPoints}
              initial={{ scale: 0.96, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="user-points-hero__value mt-1 font-cairo text-5xl font-black tabular-nums tracking-tight sm:text-[3.25rem]"
            >
              {displayPoints.toLocaleString('en-US')}
            </motion.p>
            <p className="mt-1 text-[11px] font-bold text-white/70">نقطة مكافأة جاهزة للاستخدام</p>
          </div>

          {!center?.user?.phone && phoneStep === 'idle' && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setPhoneStep('request')}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-amber-300 via-amber-200 to-yellow-100 px-4 py-3.5 text-sm font-black text-amber-950 shadow-[0_10px_28px_-8px_rgba(251,191,36,0.65)] ring-2 ring-white/50 transition-transform active:scale-[0.98]"
            >
              <Phone size={18} strokeWidth={2.4} />
              إضافة رقم الهاتف
            </motion.button>
          )}

          <div className="relative mt-5 rounded-2xl border border-white/15 bg-black/15 p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-white/80">تقدّم المستوى</p>
              {progress.next && (
                <p className="text-[10px] font-bold text-white/65">
                  {progress.pointsToNext} نقطة → {progress.next.label}
                </p>
              )}
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/15">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, progress.progress ?? 0))}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-l from-amber-300 via-yellow-300 to-orange-400 shadow-[0_0_12px_rgba(251,191,36,0.45)]"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Ways to earn points */}
      {(showWheelBtn || showReferralEarn) && (
        <section className={`grid gap-3 ${showWheelBtn && showReferralEarn ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {showWheelBtn && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/wheel')}
              className="user-earn-card group relative overflow-hidden rounded-[1.35rem] border border-white/50 p-4 text-right text-white shadow-[0_12px_32px_-10px_rgba(124,58,237,0.55)] transition-shadow hover:shadow-[0_16px_40px_-10px_rgba(124,58,237,0.65)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-primary" aria-hidden />
              <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl" aria-hidden />
              <div className="relative flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl ring-1 ring-white/25 backdrop-blur-sm">
                  🎡
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-cairo text-sm font-black leading-snug">احصل على نقاط من عجلة الحظ</p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-white/75">
                    <CircleDot size={12} className="text-amber-200" />
                    لف واربح نقاطاً فورية
                  </p>
                </div>
                <ChevronLeft size={18} className="shrink-0 text-white/70 transition-transform group-hover:-translate-x-0.5" />
              </div>
            </motion.button>
          )}

          {showReferralEarn && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setReferralOpen(true)}
              className="user-earn-card group relative overflow-hidden rounded-[1.35rem] border border-white/50 p-4 text-right text-white shadow-[0_12px_32px_-10px_rgba(37,99,235,0.45)] transition-shadow hover:shadow-[0_16px_40px_-10px_rgba(37,99,235,0.55)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-500" aria-hidden />
              <div className="absolute -right-4 -bottom-6 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl" aria-hidden />
              <div className="relative flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl ring-1 ring-white/25 backdrop-blur-sm">
                  👥
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-cairo text-sm font-black leading-snug">اكسب نقاط مجانية من دعوة أصدقائك</p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-white/75">
                    <Users size={12} className="text-amber-200" />
                    شارك كودك واكسب مكافآت
                  </p>
                </div>
                <ChevronLeft size={18} className="shrink-0 text-white/70 transition-transform group-hover:-translate-x-0.5" />
              </div>
            </motion.button>
          )}
        </section>
      )}

      {/* Latest point sources */}
      <section className="space-y-3">
        <h2 className="px-0.5 font-cairo text-base font-black text-gray-900">آخر مصادر حصولك على النقاط</h2>

        {pointSourcesLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-primary" size={20} />
          </div>
        )}

        {!pointSourcesLoading && recentPointSources.length === 0 && (
          <p className="rounded-2xl border border-gray-100 bg-white px-4 py-6 text-center text-sm font-bold text-gray-400">
            لم تحصل على نقاط بعد — جرّب عجلة الحظ أو تسوّق من المتاجر المعتمدة
          </p>
        )}

        {!pointSourcesLoading && recentPointSources.length > 0 && (
          <div className="point-sources-list overflow-hidden rounded-[1.35rem] border border-gray-100 bg-white shadow-sm">
            {recentPointSources.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 px-4 py-3.5 ${
                  index < recentPointSources.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-gray-800">{item.label}</span>
                <span className="point-sources-list__value shrink-0 font-cairo text-base font-black tabular-nums text-emerald-600">
                  +{item.points.toLocaleString('en-US')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Available competitions */}
      {showCompetitionsBtn && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-0.5">
            <h2 className="font-cairo text-base font-black text-gray-900">المسابقات المتاحة</h2>
            <button
              type="button"
              onClick={() => navigate('/competitions')}
              className="text-[11px] font-black text-primary"
            >
              عرض الكل
            </button>
          </div>

          {competitionsLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}

          {competitionsError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center">
              <p className="text-sm font-bold text-red-600">تعذّر تحميل المسابقات</p>
              <button type="button" onClick={() => refetchCompetitions()} className="mt-2 text-xs font-black text-primary underline">
                إعادة المحاولة
              </button>
            </div>
          )}

          {!competitionsLoading && !competitionsError && activeCompetitions.length === 0 && (
            <p className="rounded-2xl border border-gray-100 bg-white px-4 py-8 text-center text-sm font-bold text-gray-400">
              لا مسابقات متاحة حالياً
            </p>
          )}

          {!competitionsLoading && !competitionsError && activeCompetitions.length > 0 && (
            <div className="space-y-3">
              {activeCompetitions.map((comp) => {
                const minPts = comp.minPoints || 0;
                const eligible = points >= minPts;
                const missingPts = Math.max(0, minPts - points);

                return (
                  <div
                    key={comp._id}
                    className="overflow-hidden rounded-[1.35rem] border border-gray-100 bg-white shadow-sm"
                  >
                    <div className="flex items-stretch gap-3 p-3.5">
                      <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 ring-1 ring-gray-100">
                        {resolveImageUrl(comp.image, { width: 300 }) ? (
                          <img
                            src={resolveImageUrl(comp.image, { width: 300 })}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl">🏆</div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 font-cairo text-[15px] font-black leading-snug text-gray-900">
                          {comp.title}
                        </h3>
                        {comp.description && (
                          <p className="mt-1 line-clamp-2 text-[11px] font-medium text-gray-500">{comp.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-xl bg-violet-50 px-2 py-1 text-[10px] font-black text-violet-700">
                            <Coins size={11} />
                            {minPts}+ نقطة
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 px-2 py-1 text-[10px] font-black text-amber-800">
                            <Clock size={11} className="text-amber-600 shrink-0" />
                            <CompetitionCountdownLabel
                              time={timeLeft(comp.endDate)}
                              inline
                            />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 bg-gray-50/80 px-3.5 py-3">
                      {!eligible ? (
                        <p className="text-center text-xs font-black text-amber-700">
                          تحتاج إلى {missingPts} نقطة للمشاركة
                        </p>
                      ) : (
                        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-center text-xs font-black text-emerald-700 sm:text-right">
                            يمكنك المشاركة الآن
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedCompetition(comp)}
                            className="rounded-xl bg-gradient-to-l from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-purple-500/25 transition-transform active:scale-[0.98]"
                          >
                            {comp.joined || comp.hasJoined ? 'زيادة المشاركات' : 'أريد المشاركة'}
                          </button>
                        </div>
                      )}
                      {(comp.joined || comp.hasJoined) && eligible && (
                        <p className="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold text-green-700 sm:justify-start">
                          <CheckCircle2 size={12} />
                          لديك {comp.myEntries || 0} مشاركة
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <ReferralCardsModal open={referralOpen} onClose={() => setReferralOpen(false)} />

      <AnimatePresence>
        {selectedCompetition && (
          <CompetitionModal
            competition={selectedCompetition}
            userPoints={points}
            onClose={() => setSelectedCompetition(null)}
            onJoined={(updated) => {
              setSelectedCompetition(updated || null);
              refreshCenter();
            }}
          />
        )}
      </AnimatePresence>

      {/* Achievement Road */}
      <AchievementRoad points={points} onUnlock={() => refreshCenter()} />

      {/* Stats grid */}
      <section className="grid grid-cols-2 gap-3">
        {[
          { icon: Medal, label: 'مسابقات', val: stats.competitionsJoined ?? 0, color: 'text-purple-500' },
          { icon: Gift, label: 'جوائز', val: stats.prizesWon ?? 0, color: 'text-amber-500' },
          { icon: Users, label: 'دعوات', val: stats.referralsCount ?? 0, color: 'text-blue-500' },
          { icon: Store, label: 'متاجر', val: stats.membershipsCount ?? 0, color: 'text-emerald-500' },
          { icon: Ticket, label: 'أكواد', val: stats.codesUsed ?? 0, color: 'text-rose-500' },
          { icon: Star, label: 'آخر جائزة', val: stats.lastPrize?.name?.slice(0, 12) || '—', color: 'text-yellow-500', small: true },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-[22px] p-4 border border-gray-100 shadow-sm"
          >
            <s.icon size={18} className={`${s.color} mb-2`} />
            <p className="text-[9px] text-gray-400 font-bold">{s.label}</p>
            <p className={`font-black text-gray-800 ${s.small ? 'text-xs truncate' : 'text-lg'}`}>{s.val}</p>
          </motion.div>
        ))}
      </section>

      {/* Referral */}
      <div className="bg-white rounded-[24px] p-4 border border-gray-100 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-gray-800">كود الدعوة</p>
          <p className="text-primary font-mono font-bold">{user?.referralCode || '—'}</p>
        </div>
        <button type="button" onClick={handleCopyReferral} className="bg-primary/10 text-primary p-3 rounded-2xl">
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>

      {/* Premium bottom options */}
      <section className="user-center-options">
        <div className="user-center-options__grid">
          {[
            {
              id: 'suggest',
              label: 'قدم اقتراحات',
              hint: 'شاركنا أفكارك لتحسين المنصة',
              icon: Lightbulb,
              onClick: () => setShowSuggest(true),
              tone: 'amber',
            },
            {
              id: 'support',
              label: 'الدعم الفني',
              hint: 'تواصل مع فريق المساعدة',
              icon: Headphones,
              onClick: contactAdmin,
              tone: 'sky',
            },
            {
              id: 'legal',
              label: 'الشروط والأحكام',
              hint: 'الخصوصية وإخلاء المسؤولية',
              icon: ScrollText,
              onClick: () => setShowLegal(true),
              tone: 'slate',
            },
            {
              id: 'prefs',
              label: 'تخصيص أفضل العروض',
              hint: 'اضبط اهتماماتك وتفضيلاتك',
              icon: Tags,
              onClick: () => setShowPrefs(true),
              tone: 'violet',
            },
            {
              id: 'onboarding',
              label: 'جولة التعريف',
              hint: 'إعادة عرض دليل استخدام التطبيق',
              icon: Compass,
              onClick: () => {
                resetAllOnboardingTours();
                window.dispatchEvent(new Event(ONBOARDING_RESET_EVENT));
                navigate('/');
              },
              tone: 'violet',
            },
          ].map((option, index) => (
            <motion.button
              key={option.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={option.onClick}
              className={`user-center-option-card user-center-option-card--${option.tone} group`}
            >
              <span className={`user-center-option-card__icon user-center-option-card__icon--${option.tone}`} aria-hidden>
                <option.icon size={22} strokeWidth={2.2} />
              </span>
              <span className="user-center-option-card__copy">
                <span className="user-center-option-card__label">{option.label}</span>
                <span className="user-center-option-card__hint">{option.hint}</span>
              </span>
              <ChevronLeft
                size={18}
                className="user-center-option-card__chevron shrink-0 text-gray-300 transition-transform group-hover:-translate-x-0.5 group-active:translate-x-0"
                aria-hidden
              />
            </motion.button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => navigate('/change-password')}
        className="w-full flex items-center justify-center gap-2 py-4 text-primary font-black bg-primary/5 rounded-[22px] border border-primary/15"
      >
        <Lock size={18} /> تغيير كلمة المرور
      </button>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-black bg-red-50 rounded-[22px] border border-red-100"
      >
        <LogOut size={18} /> تسجيل الخروج
      </button>

      {/* Avatar picker modal */}
      <AnimatePresence>
        {showAvatar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center p-4"
            onClick={() => setShowAvatar(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] p-6 w-full max-w-md space-y-3"
            >
              <h3 className="font-black text-lg">تغيير الصورة</h3>
              <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => handleAvatarFile(e.target.files?.[0])} />
              <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleAvatarFile(e.target.files?.[0])} />
              <button type="button" onClick={() => cameraRef.current?.click()} className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-2xl font-bold">
                <Camera size={20} /> الكاميرا
              </button>
              <button type="button" onClick={() => galleryRef.current?.click()} className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-2xl font-bold">
                <ImageIcon size={20} /> المعرض
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone modal */}
      <AnimatePresence>
        {phoneStep !== 'idle' && (
          <motion.div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-[28px] p-6 w-full max-w-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-black">تغيير الهاتف</h3>
                <button type="button" onClick={() => { setPhoneStep('idle'); setVerifyCode(''); setNewPhone(''); }}><X size={20} /></button>
              </div>
              {phoneStep === 'request' && (
                <>
                  <PalestinianPhoneInput
                    value={newPhone}
                    onValueChange={setNewPhone}
                    required
                  />
                  <button type="button" onClick={requestPhone} className="w-full bg-primary text-white py-3 rounded-2xl font-black">إرسال رمز التحقق</button>
                </>
              )}
              {phoneStep === 'verify' && (
                <>
                  <p className="text-xs text-gray-500 font-bold text-center">تحقق من رسائل SMS على هاتفك</p>
                  <input
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="6 أرقام"
                    className="w-full border rounded-2xl px-4 py-3 font-bold text-center tracking-widest"
                    maxLength={6}
                  />
                  <button type="button" onClick={verifyPhone} className="w-full bg-primary text-white py-3 rounded-2xl font-black">تأكيد</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences modal */}
      <AnimatePresence>
        {showPrefs && (
          <motion.div className="fixed inset-0 z-[60] bg-black/50 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white mt-auto max-h-[90vh] overflow-y-auto rounded-t-[32px] p-6 space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-lg">تفضيلاتك</h3>
                <button type="button" onClick={() => setShowPrefs(false)}><X size={22} /></button>
              </div>
              <p className="text-xs text-gray-500">لتحسين ترتيب العروض فقط — وليس للتتبع.</p>

              <div>
                <p className="text-sm font-black mb-2">منطقتك</p>
                <select
                  value={prefs.regionId}
                  onChange={(e) => setPrefs((p) => ({ ...p, regionId: e.target.value }))}
                  className="w-full border rounded-2xl px-4 py-3 font-bold bg-gray-50"
                >
                  <option value="">اختر المنطقة</option>
                  {regions.map((r) => (
                    <option key={r._id} value={r._id}>{r.name ?? '—'}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-sm font-black mb-2">اهتماماتك (تصنيفات العروض)</p>
                <div className="flex flex-wrap gap-2">
                  {storeCategoryOptions.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => toggleArr('interests', c.name)}
                      className={`px-4 py-2 rounded-full text-xs font-black border-2 ${(prefs.interests || []).includes(c.name) ? 'bg-primary border-primary text-white' : 'border-gray-100 text-gray-400'}`}
                    >
                      {c.icon ? `${c.icon} ` : ''}{c.name}
                    </button>
                  ))}
                  {storeCategoryOptions.length === 0 && (
                    <p className="text-xs text-gray-400">لا توجد تصنيفات بعد — يضيفها الأدمن من لوحة التحكم</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-black mb-2">أنواع المتاجر</p>
                <div className="flex flex-wrap gap-2">
                  {storeCategoryOptions.map((c) => (
                    <button
                      key={`store-${c._id}`}
                      type="button"
                      onClick={() => toggleArr('storeTypes', c.name)}
                      className={`px-4 py-2 rounded-full text-xs font-black border-2 ${(prefs.storeTypes || []).includes(c.name) ? 'bg-primary border-primary text-white' : 'border-gray-100 text-gray-400'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-black mb-2">منتجات تهمك</p>
                <div className="flex flex-wrap gap-2">
                  {productCategoryOptions.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => toggleArr('productInterests', c.name)}
                      className={`px-4 py-2 rounded-full text-xs font-black border-2 ${(prefs.productInterests || []).includes(c.name) ? 'bg-primary border-primary text-white' : 'border-gray-100 text-gray-400'}`}
                    >
                      {c.icon ? `${c.icon} ` : ''}{c.name}
                    </button>
                  ))}
                  {productCategoryOptions.length === 0 && (
                    <p className="text-xs text-gray-400">لا توجد تصنيفات منتجات بعد</p>
                  )}
                </div>
              </div>

              <button type="button" onClick={savePreferences} className="w-full bg-primary text-white py-4 rounded-2xl font-black">
                حفظ التفضيلات
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legal modal */}
      <AnimatePresence>
        {showLegal && (
          <motion.div className="fixed inset-0 z-[60] bg-black/50 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white mt-auto max-h-[85vh] overflow-y-auto rounded-t-[32px] p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black">الشروط والأحكام</h3>
                <button type="button" onClick={() => setShowLegal(false)}><X size={22} /></button>
              </div>
              <div className="flex gap-2 mb-4">
                {[
                  { id: 'terms', label: 'الشروط' },
                  { id: 'privacy', label: 'الخصوصية' },
                  { id: 'disclaimer', label: 'إخلاء' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setLegalTab(t.id)}
                    className={`px-4 py-2 rounded-full text-xs font-black ${legalTab === t.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{legal[legalTab] || '—'}</p>
              <p className="mt-4 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl font-bold leading-relaxed">
                {BRAND_NAME} منصة تسويقية تربط العملاء بالمتاجر. الجوائز والمكافآت تُقدَّم ضمن البلد فقط ولا تُرسل خارج البلد.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestion modal */}
      <AnimatePresence>
        {showSuggest && (
          <motion.div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-[28px] p-6 w-full max-w-md space-y-4">
              <h3 className="font-black">اقتراح للإدارة</h3>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                rows={4}
                placeholder="اكتب اقتراحك..."
                className="w-full border rounded-2xl px-4 py-3 font-bold resize-none"
              />
              <button type="button" onClick={submitSuggestion} disabled={!suggestion.trim()} className="w-full bg-primary text-white py-3 rounded-2xl font-black disabled:opacity-50">
                إرسال
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-28 left-4 right-4 z-[80] bg-gray-900 text-white text-center py-3 px-4 rounded-2xl text-sm font-bold shadow-xl max-w-md mx-auto"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserCenter;
