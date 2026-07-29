import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera, Users, Gift, LogOut,
  Lightbulb, Headphones, ScrollText, Tags,
  Image as ImageIcon, Lock, ChevronLeft, Settings, Info, X,
  Coins, Loader2, History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthGate } from '../context/AuthGateContext';
import { AUTH_GATE_MESSAGES } from '../utils/authGateMessages';
import { useVerificationGate } from '../context/VerificationGateContext';
import { useCategoryTree } from '../hooks/useCategories';
import { flattenCategoryTree } from '../utils/categoryTree';
import ReferralCardsModal from '../components/ReferralCardsModal';
import SettingsSheet from '../components/userCenter/SettingsSheet';
import usePlatformSettings from '../hooks/usePlatformSettings';
import { useRecentPointSources } from '../hooks/useRecentPointSources';
import { queryKeys } from '../lib/queryClient';
import LightLoadingHint from '../shared/LightLoadingHint';
import { uploadImage } from '../utils/imageUpload';
import { BRAND_NAME } from '../utils/brandAssets';
import { overlayFade, sheetSpring } from '../utils/motionPresets';
import api from '../api/axios';

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
      if (t < 1) frameRef.current = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    frameRef.current = requestAnimationFrame(step);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return display;
}

const MENU_ITEMS = [
  { id: 'support', label: 'الدعم الفني', icon: Headphones, tone: 'sky' },
  { id: 'suggest', label: 'قدم اقتراحاً', icon: Lightbulb, tone: 'amber' },
  { id: 'prefs', label: 'تخصيص أفضل العروض', icon: Tags, tone: 'violet' },
  { id: 'settings', label: 'الإعدادات', icon: Settings, tone: 'emerald' },
  { id: 'about', label: 'عن التطبيق', icon: Info, tone: 'slate' },
];

const UserCenter = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser, isAuth } = useAuth();
  const { runWithAuth } = useAuthGate();
  const { runWithVerification, handleApiVerificationError } = useVerificationGate();
  const queryClient = useQueryClient();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const [showAvatar, setShowAvatar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({ regionId: '', interests: [], storeTypes: [], productInterests: [] });
  const [showLegal, setShowLegal] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [toast, setToast] = useState('');
  const [referralOpen, setReferralOpen] = useState(false);

  const { data: storeCategoryTree = [] } = useCategoryTree('store', { enabled: showPrefs });
  const { data: productCategoryTree = [] } = useCategoryTree('product', { enabled: showPrefs });
  const storeCategoryOptions = flattenCategoryTree(storeCategoryTree);
  const productCategoryOptions = flattenCategoryTree(productCategoryTree);

  const { data: platformSettings } = usePlatformSettings();
  const showReferralEarn = platformSettings?.features?.referralProgram !== false;

  const { data: recentPointSources = [], isLoading: pointSourcesLoading } = useRecentPointSources(5);

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
    enabled: isAuth,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!center) return;
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
    enabled: showSettings || showPrefs,
    queryFn: async () => {
      const { data } = await api.get('/regions');
      return Array.isArray(data) ? data : data.regions || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const points = center?.stats?.points ?? user?.points ?? 0;
  const displayPoints = useAnimatedCounter(points);
  const legal = center?.legal || {};
  const avatarSrc = center?.user?.avatar || user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
  const displayName = center?.user?.name || user?.name || 'مستخدم';

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleMenuClick = (id) => {
    switch (id) {
      case 'support':
        if (isAuth) contactAdmin();
        else runWithAuth(() => contactAdmin(), AUTH_GATE_MESSAGES.chat);
        break;
      case 'suggest':
        if (isAuth) setShowSuggest(true);
        else runWithAuth(() => setShowSuggest(true), AUTH_GATE_MESSAGES.generic);
        break;
      case 'prefs':
        if (isAuth) setShowPrefs(true);
        else runWithAuth(() => setShowPrefs(true), AUTH_GATE_MESSAGES.generic);
        break;
      case 'settings':
        if (isAuth) setShowSettings(true);
        else runWithAuth(() => setShowSettings(true), AUTH_GATE_MESSAGES.generic);
        break;
      case 'about':
        navigate('/intro');
        break;
      default:
        break;
    }
  };

  if (!isAuth) {
    return (
      <div className="space-y-4 pb-28 text-right" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[1.75rem] border border-emerald-100/80 shadow-[0_12px_40px_-12px_rgba(16,185,129,0.25)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-amber-50" aria-hidden />
          <div className="relative p-5 space-y-4 text-center">
            <h1 className="text-xl font-black text-gray-900">نقاطي</h1>
            <p className="text-sm font-bold text-gray-500 leading-relaxed">
              تصفّح برنامج النقاط والجوائز — سجّل الدخول لحفظ نقاطك والمشاركة في السحوبات
            </p>
            <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-4">
              <p className="text-xs font-black text-emerald-700/80">عدد النقاط</p>
              <p className="mt-1 font-cairo text-4xl font-black text-gray-300">—</p>
            </div>
          </div>
        </motion.div>

        {showReferralEarn && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => runWithAuth(() => setReferralOpen(true), AUTH_GATE_MESSAGES.referral)}
            className="group relative w-full overflow-hidden rounded-[1.35rem] border border-amber-100/80 p-4 text-right shadow-[0_8px_28px_-8px_rgba(245,158,11,0.35)]"
          >
            <div className="absolute inset-0 bg-gradient-to-l from-amber-400/90 via-amber-300/85 to-emerald-300/80" aria-hidden />
            <div className="relative flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/25 text-xl ring-1 ring-white/40">
                <Gift size={22} className="text-amber-900" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-amber-950 leading-snug">اكسب نقاط مجانية من دعوة أصدقائك</p>
                <p className="mt-0.5 text-[11px] font-bold text-amber-900/75 flex items-center gap-1">
                  <Users size={12} /> شارك كودك واكسب مكافآت
                </p>
              </div>
              <ChevronLeft size={18} className="shrink-0 text-amber-900/60" />
            </div>
          </motion.button>
        )}

        <section className="grid grid-cols-2 gap-2">
          {[
            { label: 'السحوبات', to: '/draws' },
            { label: 'عجلة الحظ', to: '/wheel' },
            { label: 'صناديق الكنز', to: '/chests' },
            { label: 'المسابقات', to: '/competitions' },
          ].map((link) => (
            <button
              key={link.to}
              type="button"
              onClick={() => navigate(link.to)}
              className="rounded-2xl border border-gray-100 bg-white px-3 py-4 text-sm font-black text-gray-800 shadow-sm"
            >
              {link.label}
            </button>
          ))}
        </section>

        <section className="rounded-[1.35rem] border border-gray-100 bg-white overflow-hidden shadow-sm divide-y divide-gray-100">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleMenuClick(item.id)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-right transition-colors hover:bg-gray-50/80 active:bg-gray-100/80"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl user-center-menu-icon--${item.tone}`}>
                <item.icon size={18} strokeWidth={2.2} />
              </span>
              <span className="flex-1 text-sm font-black text-gray-800">{item.label}</span>
              <ChevronLeft size={16} className="shrink-0 text-gray-300" />
            </button>
          ))}
        </section>
      </div>
    );
  }

  const saveProfileFromSettings = async ({ name, address }) => {
    const payload = {};
    if (name?.trim()) payload.name = name.trim();
    if (address?.trim()) payload.address = address.trim();
    if (!Object.keys(payload).length) return;
    const { data } = await api.patch('/users/me/profile', payload);
    updateUser({ name: data.user?.name || name });
    showToast('تم تحديث الملف الشخصي');
    refreshCenter();
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

  const savePreferences = async (nextPrefs = prefs) => {
    const save = async () => {
      try {
        const { data } = await api.patch('/users/me/preferences', nextPrefs);
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
    <div className="space-y-4 pb-28 text-right" dir="rtl">
      <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => handleAvatarFile(e.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleAvatarFile(e.target.files?.[0])} />

      {/* Premium profile + points header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[1.75rem] border border-emerald-100/80 shadow-[0_12px_40px_-12px_rgba(16,185,129,0.25)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-amber-50" aria-hidden />
        <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full bg-amber-200/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-10 -right-6 h-28 w-28 rounded-full bg-emerald-200/35 blur-3xl" aria-hidden />

        <div className="relative p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg sm:text-xl font-black text-gray-900">{displayName}</h1>
            </div>
            <button type="button" onClick={() => setShowSettings(true)} className="relative shrink-0">
              <img src={avatarSrc} alt="" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white shadow-md" />
              <span className="absolute -bottom-1 -left-1 rounded-lg bg-emerald-600 p-1 text-white shadow">
                <Camera size={11} />
              </span>
            </button>
          </div>

          <div className="rounded-2xl border border-emerald-100/90 bg-white/80 backdrop-blur-sm px-4 py-4 text-center shadow-sm">
            <p className="text-xs font-black text-emerald-700/80">عدد النقاط</p>
            <motion.p
              key={displayPoints}
              initial={{ scale: 0.97, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-1 font-cairo text-4xl sm:text-[2.75rem] font-black tabular-nums text-gray-900"
            >
              {displayPoints.toLocaleString('en-US')}
            </motion.p>
            <button
              type="button"
              onClick={() => navigate('/orders/history')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-700 shadow-sm"
            >
              <History size={14} />
              الطلبات السابقة
            </button>
          </div>
        </div>
      </motion.div>

      {/* Referral card */}
      {showReferralEarn && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => runWithAuth(() => setReferralOpen(true), AUTH_GATE_MESSAGES.referral)}
          className="group relative w-full overflow-hidden rounded-[1.35rem] border border-amber-100/80 p-4 text-right shadow-[0_8px_28px_-8px_rgba(245,158,11,0.35)]"
        >
          <div className="absolute inset-0 bg-gradient-to-l from-amber-400/90 via-amber-300/85 to-emerald-300/80" aria-hidden />
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/25 text-xl ring-1 ring-white/40">
              <Gift size={22} className="text-amber-900" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-amber-950 leading-snug">اكسب نقاط مجانية من دعوة أصدقائك</p>
              <p className="mt-0.5 text-[11px] font-bold text-amber-900/75 flex items-center gap-1">
                <Users size={12} /> شارك كودك واكسب مكافآت
              </p>
            </div>
            <ChevronLeft size={18} className="shrink-0 text-amber-900/60" />
          </div>
        </motion.button>
      )}

      {/* Activity timeline */}
      <section className="space-y-2.5">
        <h2 className="px-0.5 text-base font-black text-gray-900">آخر مصادر حصولك على النقاط</h2>

        {pointSourcesLoading && !recentPointSources.length && (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-emerald-600" size={20} />
          </div>
        )}

        {!pointSourcesLoading && recentPointSources.length === 0 && (
          <p className="rounded-2xl border border-gray-100 bg-white px-4 py-6 text-center text-sm font-bold text-gray-400">
            لم تحصل على نقاط بعد — تسوّق من المتاجر المعتمدة أو ادعُ أصدقاءك
          </p>
        )}

        {recentPointSources.length > 0 && (
          <div className="relative space-y-0">
            <div className="absolute top-3 bottom-3 right-[1.125rem] w-0.5 bg-gradient-to-b from-emerald-200 via-amber-200 to-transparent" aria-hidden />
            {recentPointSources.map((item, index) => (
              <div key={item.id} className="relative flex items-start gap-3 py-2.5">
                <span className={`relative z-[1] mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-[#f7f5f2] ${index === 0 ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-600 border border-emerald-100'}`}>
                  <Coins size={15} />
                </span>
                <div className="flex-1 min-w-0 rounded-2xl border border-gray-100 bg-white px-3.5 py-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-gray-800">{item.label}</p>
                    <span className="shrink-0 font-cairo text-sm font-black tabular-nums text-emerald-600">
                      +{item.points.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom menu */}
      <section className="rounded-[1.35rem] border border-gray-100 bg-white overflow-hidden shadow-sm divide-y divide-gray-100">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleMenuClick(item.id)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-right transition-colors hover:bg-gray-50/80 active:bg-gray-100/80"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl user-center-menu-icon--${item.tone}`}>
              <item.icon size={18} strokeWidth={2.2} />
            </span>
            <span className="flex-1 text-sm font-black text-gray-800">{item.label}</span>
            <ChevronLeft size={16} className="shrink-0 text-gray-300" />
          </button>
        ))}
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate('/change-password')}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-emerald-700 font-black bg-emerald-50 rounded-2xl border border-emerald-100 text-sm"
        >
          <Lock size={16} /> كلمة المرور
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-red-600 font-black bg-red-50 rounded-2xl border border-red-100 text-sm"
        >
          <LogOut size={16} /> خروج
        </button>
      </div>

      <ReferralCardsModal open={referralOpen} onClose={() => setReferralOpen(false)} />

      <SettingsSheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        center={center}
        regions={regions}
        prefs={prefs}
        onPrefsChange={setPrefs}
        onSaveProfile={saveProfileFromSettings}
        onSavePreferences={savePreferences}
        onAvatarPick={() => setShowAvatar(true)}
        cameraRef={cameraRef}
        galleryRef={galleryRef}
      />

      {/* Avatar picker */}
      <AnimatePresence>
        {showAvatar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayFade}
            className="fixed inset-0 z-[70] bg-black/45 flex items-end justify-center p-4"
            onClick={() => setShowAvatar(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.99 }}
              transition={sheetSpring}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[1.75rem] p-5 w-full max-w-md space-y-2"
            >
              <h3 className="font-black text-base mb-2">تغيير الصورة</h3>
              <button type="button" onClick={() => cameraRef.current?.click()} className="w-full flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl font-bold text-sm">
                <Camera size={18} /> الكاميرا
              </button>
              <button type="button" onClick={() => galleryRef.current?.click()} className="w-full flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl font-bold text-sm">
                <ImageIcon size={18} /> المعرض
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences modal */}
      <AnimatePresence>
        {showPrefs && (
          <motion.div
            className="fixed inset-0 z-[70] flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayFade}
          >
            <button type="button" className="absolute inset-0 bg-black/40" aria-label="إغلاق" onClick={() => setShowPrefs(false)} />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 28, opacity: 0 }}
              transition={sheetSpring}
              className="relative bg-white max-h-[90vh] overflow-y-auto rounded-t-[1.75rem] p-5 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-black text-base">تخصيص أفضل العروض</h3>
                <button type="button" onClick={() => setShowPrefs(false)}><X size={20} /></button>
              </div>

              <div>
                <p className="text-sm font-black mb-2">منطقتك</p>
                <select
                  value={prefs.regionId}
                  onChange={(e) => setPrefs((p) => ({ ...p, regionId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-bold bg-gray-50 text-sm"
                >
                  <option value="">اختر المنطقة</option>
                  {regions.map((r) => (
                    <option key={r._id} value={r._id}>{r.name ?? '—'}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-sm font-black mb-2">اهتماماتك</p>
                <div className="flex flex-wrap gap-2">
                  {storeCategoryOptions.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => toggleArr('interests', c.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-black border ${(prefs.interests || []).includes(c.name) ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-200 text-gray-500'}`}
                    >
                      {c.name}
                    </button>
                  ))}
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
                      className={`px-3 py-1.5 rounded-full text-xs font-black border ${(prefs.storeTypes || []).includes(c.name) ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-200 text-gray-500'}`}
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
                      className={`px-3 py-1.5 rounded-full text-xs font-black border ${(prefs.productInterests || []).includes(c.name) ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-200 text-gray-500'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={() => savePreferences()} className="w-full bg-emerald-600 text-white py-3.5 rounded-2xl font-black text-sm">
                حفظ التفضيلات
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About / legal */}
      <AnimatePresence>
        {showLegal && (
          <motion.div
            className="fixed inset-0 z-[70] flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayFade}
          >
            <button type="button" className="absolute inset-0 bg-black/40" aria-label="إغلاق" onClick={() => setShowLegal(false)} />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 28, opacity: 0 }}
              transition={sheetSpring}
              className="relative bg-white max-h-[85vh] overflow-y-auto rounded-t-[1.75rem] p-5"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black">عن التطبيق</h3>
                <button type="button" onClick={() => setShowLegal(false)}><X size={20} /></button>
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {[
                  { id: 'terms', label: 'الشروط' },
                  { id: 'privacy', label: 'الخصوصية' },
                  { id: 'disclaimer', label: 'إخلاء' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setLegalTab(t.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-black ${legalTab === t.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{legal[legalTab] || '—'}</p>
              <p className="mt-4 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl font-bold leading-relaxed">
                {BRAND_NAME} — منصة تسويقية تربط العملاء بالمتاجر. الجوائز والمكافآت تُقدَّم ضمن البلد فقط.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestion */}
      <AnimatePresence>
        {showSuggest && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayFade}
          >
            <button type="button" className="absolute inset-0 bg-black/40" aria-label="إغلاق" onClick={() => setShowSuggest(false)} />
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 6 }}
              transition={sheetSpring}
              className="relative bg-white rounded-[1.75rem] p-5 w-full max-w-md space-y-3"
            >
              <h3 className="font-black">قدم اقتراحاً</h3>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                rows={4}
                placeholder="اكتب اقتراحك..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-bold resize-none text-sm"
              />
              <button type="button" onClick={submitSuggestion} disabled={!suggestion.trim()} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black text-sm disabled:opacity-50">
                إرسال
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
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
