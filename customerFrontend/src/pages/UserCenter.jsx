import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera, Star, Trophy, Users, Store, Ticket, Gift, LogOut, Copy, Check,
  MessageCircle, Lightbulb, Shield, Sliders, Pencil, Phone, Mail, X,
  ChevronLeft, Sparkles, Medal, Image as ImageIcon, Lock
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useVerificationGate } from '../context/VerificationGateContext';
import { useCategoryTree } from '../hooks/useCategories';
import { getLocalPhoneError, normalizeLocalPhone } from '../utils/phoneValidation';
import PalestinianPhoneInput from '../components/PalestinianPhoneInput';
import PhoneDisplay from '../components/PhoneDisplay';
import { flattenCategoryTree } from '../utils/categoryTree';
import AchievementRoad from '../components/AchievementRoad';
import { getProgress } from '../shared/levels';
import usePlatformSettings from '../hooks/usePlatformSettings';
import { queryKeys } from '../lib/queryClient';
import LightLoadingHint from '../shared/LightLoadingHint';
import { fileToOptimizedDataUrl } from '../utils/imageUpload';

const toBase64 = (file) => fileToOptimizedDataUrl(file, { maxWidth: 400 });

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

  const { data: platformSettings } = usePlatformSettings();
  const showWheelBtn = platformSettings?.features?.wheel !== false
    && platformSettings?.wheel?.placements?.userCenter !== false;
  const showCompetitionsBtn = platformSettings?.features?.storeCompetitions !== false;

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
      const avatar = await toBase64(file);
      const { data } = await api.patch('/users/me/profile', { avatar });
      updateUser({ avatar: data.user.avatar });
      setShowAvatar(false);
      showToast('تم تحديث الصورة');
      refreshCenter();
    } catch (err) {
      showToast(err.response?.data?.message || 'فشل رفع الصورة');
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

  if (isLoading && !center) {
    return (
      <div className="pb-28 text-right" dir="rtl">
        <LightLoadingHint label="جاري تحميل مركزك..." />
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
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1e1b4b] via-primary to-orange-500 p-5 text-white shadow-2xl"
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
        <div className="relative flex items-start gap-4">
          <button type="button" onClick={() => setShowAvatar(true)} className="relative shrink-0">
            <div className="w-20 h-20 rounded-[24px] p-0.5 bg-white/30 backdrop-blur">
              <img
                src={center?.user?.avatar || user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                alt=""
                className="w-full h-full rounded-[22px] object-cover bg-white"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-white text-primary p-1.5 rounded-xl shadow">
              <Camera size={14} />
            </span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold opacity-80 flex items-center gap-1">
              <Sparkles size={12} /> مركز المستخدم
            </p>
            {editName ? (
              <div className="flex gap-2 mt-1">
                <input
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  className="flex-1 rounded-xl px-3 py-1.5 text-gray-900 text-sm font-bold"
                />
                <button type="button" onClick={saveName} className="bg-white/20 px-3 rounded-xl text-xs font-black">حفظ</button>
                <button type="button" onClick={() => setEditName(false)} className="p-1"><X size={16} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-xl font-black truncate">{center?.user?.name || user?.name}</h1>
                <button type="button" onClick={() => setEditName(true)} className="opacity-80 hover:opacity-100">
                  <Pencil size={14} />
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
              <span className="flex items-center gap-1 bg-white/15 px-2 py-1 rounded-full">
                <Mail size={10} /> {center?.user?.email || '—'}
              </span>
              <button
                type="button"
                onClick={() => setPhoneStep('request')}
                className="flex items-center gap-1 bg-white/15 px-2 py-1 rounded-full hover:bg-white/25"
              >
                <Phone size={10} />{' '}
                {center?.user?.phone ? (
                  <PhoneDisplay phone={center.user.phone} className="text-[10px]" />
                ) : (
                  'أضف هاتف'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Level progress */}
        <div className="relative mt-5 bg-black/20 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-[10px] opacity-80">المستوى</p>
              <p className="font-black text-lg" style={{ color: progress.stage?.color }}>
                {progress.stage?.label}
                <span className="text-white/80 text-xs mr-2">
                  {'★'.repeat(progress.stage?.stars || 1)}
                </span>
              </p>
            </div>
            <div className="text-left">
              <p className="text-2xl font-black">{points}</p>
              <p className="text-[9px] opacity-70">نقطة</p>
            </div>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progress.progress ?? 0))}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-l from-amber-300 to-yellow-400"
            />
          </div>
          {progress.next && (
            <p className="text-[9px] mt-2 opacity-80">
              {progress.pointsToNext} نقطة للمستوى {progress.next.label}
            </p>
          )}
        </div>
      </motion.div>

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

      {/* Quick actions */}
      <section className={`grid gap-3 ${showCompetitionsBtn && showWheelBtn ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {showCompetitionsBtn && (
          <button
            type="button"
            onClick={() => navigate('/competitions')}
            className="flex items-center gap-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-4 rounded-[22px] font-black text-sm shadow-lg"
          >
            <Trophy size={22} /> المسابقات
          </button>
        )}
        {showWheelBtn && (
          <button
            type="button"
            onClick={() => navigate('/wheel')}
            className="flex items-center gap-3 bg-gradient-to-br from-amber-400 to-orange-500 text-white p-4 rounded-[22px] font-black text-sm shadow-lg"
          >
            <Sparkles size={22} /> عجلة الحظ
          </button>
        )}
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

      {/* Action icons row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Sliders, label: 'تفضيلات', onClick: () => setShowPrefs(true), color: 'bg-violet-100 text-violet-600' },
          { icon: Lightbulb, label: 'اقتراح', onClick: () => setShowSuggest(true), color: 'bg-amber-100 text-amber-600' },
          { icon: MessageCircle, label: 'إدارة', onClick: contactAdmin, color: 'bg-blue-100 text-blue-600' },
          { icon: Shield, label: 'قانوني', onClick: () => setShowLegal(true), color: 'bg-gray-100 text-gray-600' },
        ].map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className="flex flex-col items-center gap-1.5 p-3 rounded-[20px] bg-white border border-gray-100"
          >
            <div className={`p-2.5 rounded-xl ${a.color}`}>
              <a.icon size={18} />
            </div>
            <span className="text-[9px] font-black text-gray-600">{a.label}</span>
          </button>
        ))}
      </div>

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
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleAvatarFile(e.target.files?.[0])} />
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarFile(e.target.files?.[0])} />
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
                <h3 className="font-black">إخلاء المسؤولية</h3>
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
              <p className="mt-4 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl font-bold">
                المنصة تسويقية فقط. الجوائز داخل البلد ولا تُرسل خارج البلد.
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
