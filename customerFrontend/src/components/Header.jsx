import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import {
  MessageCircle, CircleDot, Medal, ShoppingBag,
  BarChart3, Settings, LogOut, X, Heart, Store, Download, Gift,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import PointsBadge from './PointsBadge';
import NotificationDropdown from './NotificationDropdown';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';
import usePlatformSettings from '../hooks/usePlatformSettings';
import { POINTS_FLOAT_EVENT } from '../utils/pointsAnimation';
import { BRAND_LOGO_64, BRAND_NAME } from '../utils/brandAssets';
import { usePwaInstall } from '../context/PwaInstallContext';
import ReferralCardsModal from './ReferralCardsModal';
import { REFERRAL_CARDS_EVENT } from '../utils/pointsGuideEvents';
import useCartSummary from '../hooks/useCartSummary';
import '../styles/HeaderActions.css';

const PointsBalanceModal = lazy(() => import('./PointsBalanceModal'));

function HeaderBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="header-badge" aria-label={`${count} غير مقروء`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

const MoreMenuBtn = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="relative flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl active:scale-95 transition-transform shrink-0 bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200/70 shadow-sm"
    aria-label="المزيد"
  >
    <span className="text-[11px] sm:text-xs font-black text-gray-800 tracking-tight">المزيد</span>
    <span className="flex items-center justify-center w-[18px] h-[18px] sm:w-5 sm:h-5 rounded-[5px] sm:rounded-md bg-gradient-to-br from-gray-800 to-gray-950 text-white shadow-sm">
      <span className="text-[13px] sm:text-sm font-bold leading-none">+</span>
    </span>
  </button>
);

function MoreMenuSheet({ open, onClose, items }) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]"
        aria-label="إغلاق القائمة"
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-[61] bg-gradient-to-b from-white to-gray-50/90 rounded-t-[1.75rem] shadow-[0_-8px_40px_rgba(15,23,42,0.12)] border-t border-gray-100/80 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] max-w-lg mx-auto animate-[slideUp_0.24s_ease-out]"
        dir="rtl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200/80" aria-hidden />
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="text-[15px] font-black text-gray-800">المزيد</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100/90 flex items-center justify-center text-gray-500 active:scale-95 transition-transform"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => { item.onClick(); onClose(); }}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition active:scale-[0.97] ${
                item.danger
                  ? 'border-red-100/80 bg-red-50/60 hover:bg-red-50'
                  : 'border-gray-100/90 bg-white/80 hover:bg-white shadow-sm shadow-gray-100/50'
              }`}
            >
              <span className={`flex items-center justify-center w-10 h-10 rounded-xl ${item.iconBg} ring-1 ring-black/[0.03]`}>
                <item.icon size={20} className={item.iconColor} strokeWidth={2} />
              </span>
              <span className={`text-[11px] font-black leading-tight text-center ${item.danger ? 'text-red-600' : 'text-gray-700'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

const Header = () => {
  const navigate = useNavigate();
  const { isAuth, user, updateUser, logout } = useAuth();
  const [pointsOpen, setPointsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [pointsPulse, setPointsPulse] = useState(null);
  const lastMeSyncAt = useRef(0);
  const hasSyncedPointsFromMe = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!isAuth) {
      hasSyncedPointsFromMe.current = false;
      lastMeSyncAt.current = 0;
    }
  }, [isAuth]);

  const { data: unreadData } = useQuery({
    queryKey: queryKeys.unreadChat,
    queryFn: async () => (await api.get('/chats/unread-count')).data,
    enabled: isAuth,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: notifData } = useQuery({
    queryKey: queryKeys.unreadNotifications,
    queryFn: async () => (await api.get('/notifications/unread-count')).data,
    enabled: isAuth,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: meData, dataUpdatedAt: meUpdatedAt } = useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => (await api.get('/users/me')).data,
    enabled: isAuth,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: platformSettings } = usePlatformSettings();
  const features = platformSettings?.features || {};
  const wheelPlacements = platformSettings?.wheel?.placements || {};
  const showWheel = features.wheel !== false && wheelPlacements.header !== false;
  const showCompetitions = features.storeCompetitions !== false;

  const { data: cartStats } = useCartSummary({ enabled: isAuth });
  const cartItemCount = cartStats?.itemCount ?? 0;
  const unreadCount = unreadData?.count || 0;
  const notifCountRemote = notifData?.count || 0;

  useEffect(() => {
    setNotifCount(notifCountRemote);
  }, [notifCountRemote]);
  const points = user?.points ?? meData?.points ?? meData?.user?.points ?? 0;

  useEffect(() => {
    if (!meUpdatedAt || meUpdatedAt === lastMeSyncAt.current) return;
    lastMeSyncAt.current = meUpdatedAt;

    const pts = meData?.points ?? meData?.user?.points;
    const energy = meData?.energy ?? meData?.user?.energy;
    if (pts == null && energy == null) return;

    const patch = {};
    // Hydrate points once from /users/me — never overwrite action-driven updates (e.g. competition join).
    if (pts != null && !hasSyncedPointsFromMe.current) {
      patch.points = pts;
      hasSyncedPointsFromMe.current = true;
    }
    if (energy != null && userRef.current?.energy !== energy) patch.energy = energy;
    if (Object.keys(patch).length) updateUser(patch);
  }, [meData, meUpdatedAt, updateUser]);

  useEffect(() => {
    let clearPulse = null;
    const handler = (e) => {
      if (clearPulse) window.clearTimeout(clearPulse);
      const delta = Number(e.detail?.delta);
      if (!delta || Number.isNaN(delta)) return;
      setPointsPulse(delta > 0 ? 'up' : 'down');
      clearPulse = window.setTimeout(() => setPointsPulse(null), 900);
    };

    window.addEventListener(POINTS_FLOAT_EVENT, handler);
    return () => {
      window.removeEventListener(POINTS_FLOAT_EVENT, handler);
      if (clearPulse) window.clearTimeout(clearPulse);
    };
  }, []);

  useEffect(() => {
    const openReferral = () => setReferralOpen(true);
    window.addEventListener(REFERRAL_CARDS_EVENT, openReferral);
    return () => window.removeEventListener(REFERRAL_CARDS_EVENT, openReferral);
  }, []);

  const { canInstall, openInstallCard } = usePwaInstall();

  const moreItems = useMemo(() => [
    {
      icon: Heart,
      label: 'المفضلة',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
      onClick: () => navigate('/favorites'),
    },
    {
      icon: Gift,
      label: 'كروت مجانية',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      onClick: () => setReferralOpen(true),
    },
    showWheel && {
      icon: CircleDot,
      label: 'عجلة الحظ',
      iconBg: 'bg-pink-50',
      iconColor: 'text-pink-500',
      onClick: () => navigate('/wheel'),
    },
    showCompetitions && {
      icon: Medal,
      label: 'مسابقات',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-500',
      onClick: () => navigate('/competitions'),
    },
    {
      icon: BarChart3,
      label: 'لوحة الشرف',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      onClick: () => navigate('/honor'),
    },
    {
      icon: Store,
      label: 'متاجر النقاط',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-500',
      onClick: () => navigate('/stores/points'),
    },
    {
      icon: Settings,
      label: 'الإعدادات',
      iconBg: 'bg-slate-50',
      iconColor: 'text-slate-600',
      onClick: () => navigate('/center'),
    },
    canInstall && {
      icon: Download,
      label: 'تثبيت التطبيق',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-500',
      onClick: () => openInstallCard(),
    },
    {
      icon: LogOut,
      label: 'تسجيل الخروج',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      danger: true,
      onClick: () => logout(),
    },
  ].filter(Boolean), [showWheel, showCompetitions, navigate, logout, canInstall, openInstallCard]);

  const openPoints = useCallback(() => setPointsOpen(true), []);
  const closePoints = useCallback(() => setPointsOpen(false), []);
  const closeMore = useCallback(() => setMoreOpen(false), []);

  return (
    <>
      <header
        className="app-header fixed top-0 left-0 right-0 z-40 border-b border-emerald-200/40 shadow-sm"
        dir="rtl"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="app-header__gradient" aria-hidden />
        <div className="relative z-[1] max-w-lg mx-auto w-full px-2 sm:px-3 py-1.5 sm:py-2 flex justify-between items-center gap-1 sm:gap-2 min-w-0">
          {isAuth ? (
            <>
              <img
                src={BRAND_LOGO_64}
                alt=""
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-contain shadow-sm shrink-0"
                width={44}
                height={44}
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
              <div
                data-onboarding="header-icons"
                className="header-actions shrink-0 min-w-0"
              >
                <PointsBadge
                  points={points}
                  pulse={pointsPulse}
                  onClick={openPoints}
                />
                <NotificationDropdown
                  count={notifCount}
                  onCountChange={setNotifCount}
                />
                <button
                  type="button"
                  className="header-icon-btn"
                  title="السلة"
                  aria-label="السلة"
                  onClick={() => navigate('/cart')}
                >
                  <ShoppingBag size={22} strokeWidth={2} />
                  <HeaderBadge count={cartItemCount} />
                </button>
                <button
                  type="button"
                  className="header-icon-btn"
                  title="الرسائل"
                  aria-label="الرسائل"
                  onClick={() => navigate('/chat')}
                >
                  <MessageCircle size={22} strokeWidth={2} />
                  <HeaderBadge count={unreadCount} />
                </button>
                <MoreMenuBtn onClick={() => setMoreOpen(true)} />
              </div>
            </>
          ) : (
            <button
              type="button"
              className="flex items-center gap-2 min-w-0 active:scale-[0.98] transition-transform"
              onClick={() => navigate('/')}
              aria-label="الرئيسية"
            >
              <img
                src={BRAND_LOGO_64}
                alt=""
                className="w-11 h-11 rounded-xl object-contain shadow-md shrink-0"
                width={44}
                height={44}
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
              <span className="text-[15px] font-black text-gray-900 tracking-tight truncate">{BRAND_NAME}</span>
            </button>
          )}

          {!isAuth && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-black text-gray-700 transition hover:bg-gray-100"
              >
                إنشاء حساب
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="bg-primary text-white px-4 py-1.5 rounded-xl text-xs font-black"
              >
                دخول
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="app-header-spacer" aria-hidden />

      {isAuth && (
        <MoreMenuSheet
          open={moreOpen}
          onClose={closeMore}
          items={moreItems}
        />
      )}

      <ReferralCardsModal open={referralOpen} onClose={() => setReferralOpen(false)} />

      {pointsOpen && (
        <Suspense fallback={null}>
          <PointsBalanceModal
            open={pointsOpen}
            onClose={closePoints}
            points={points}
            user={user || meData}
          />
        </Suspense>
      )}
    </>
  );
};

export default React.memo(Header);
