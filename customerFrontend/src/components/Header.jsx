import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import {
  Bell, MessageCircle, ShoppingCart, CircleDot, Medal,
  BarChart3, Settings, LogOut, X, Heart, Store, Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import PointsBadge from './PointsBadge';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';
import usePlatformSettings from '../hooks/usePlatformSettings';
import { POINTS_FLOAT_EVENT } from '../utils/pointsAnimation';
import { BRAND_LOGO_64, BRAND_NAME } from '../utils/brandAssets';
import { usePwaInstall } from '../context/PwaInstallContext';

const PointsBalanceModal = lazy(() => import('./PointsBalanceModal'));

const HEADER_ICON_THEMES = {
  bell: {
    wrap: 'bg-gradient-to-br from-rose-50 to-red-100/80',
    icon: 'text-red-600',
  },
  cart: {
    wrap: 'bg-gradient-to-br from-amber-50 to-orange-100/80',
    icon: 'text-amber-600',
  },
  message: {
    wrap: 'bg-gradient-to-br from-sky-50 to-blue-100/80',
    icon: 'text-blue-600',
  },
};

const HeaderIconBtn = ({ icon: Icon, label, onClick, badge, theme, onboardingId }) => {
  const t = HEADER_ICON_THEMES[theme];
  return (
    <button
      type="button"
      onClick={onClick}
      data-onboarding={onboardingId}
      className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl active:scale-95 transition-transform shrink-0"
      aria-label={label}
    >
      <span className={`absolute inset-1 rounded-lg ${t.wrap} border border-white/60 shadow-sm`} aria-hidden />
      <Icon size={22} className={`relative z-[1] ${t.icon} sm:hidden`} strokeWidth={2.2} fill="currentColor" fillOpacity={0.2} />
      <Icon size={26} className={`relative z-[1] ${t.icon} hidden sm:block`} strokeWidth={2.2} fill="currentColor" fillOpacity={0.2} />
      {badge > 0 && (
        <span className="absolute top-0 left-0 z-[2] min-w-[17px] h-[17px] px-1 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none ring-2 ring-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
};

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
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        aria-label="إغلاق القائمة"
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-[61] bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 px-4 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] max-w-lg mx-auto animate-[slideUp_0.28s_ease-out]"
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-gray-900">المزيد</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => { item.onClick(); onClose(); }}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition active:scale-95 ${
                item.danger
                  ? 'border-red-100 bg-red-50 hover:bg-red-100/80'
                  : 'border-gray-100 bg-gray-50 hover:bg-gray-100/80'
              }`}
            >
              <span className={`flex items-center justify-center w-12 h-12 rounded-2xl ${item.iconBg}`}>
                <item.icon size={26} className={item.iconColor} strokeWidth={2} />
              </span>
              <span className={`text-xs font-black leading-tight text-center ${item.danger ? 'text-red-700' : 'text-gray-800'}`}>
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

  const unreadCount = unreadData?.count || 0;
  const notifCount = notifData?.count || 0;
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

  const { canInstall, openInstallCard } = usePwaInstall();

  const moreItems = useMemo(() => [
    {
      icon: Heart,
      label: 'المفضلة',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      onClick: () => navigate('/favorites'),
    },
    showWheel && {
      icon: CircleDot,
      label: 'عجلة الحظ',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      onClick: () => navigate('/wheel'),
    },
    showCompetitions && {
      icon: Medal,
      label: 'مسابقات',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      onClick: () => navigate('/competitions'),
    },
    {
      icon: BarChart3,
      label: 'لوحة الشرف',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      onClick: () => navigate('/honor'),
    },
    {
      icon: Store,
      label: 'متاجر النقاط',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      onClick: () => navigate('/stores/points'),
    },
    {
      icon: Settings,
      label: 'الإعدادات',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      onClick: () => navigate('/center'),
    },
    canInstall && {
      icon: Download,
      label: 'تثبيت التطبيق',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      onClick: () => openInstallCard(),
    },
    {
      icon: LogOut,
      label: 'تسجيل الخروج',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
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
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/70 shadow-sm"
        dir="rtl"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-lg mx-auto w-full px-2 sm:px-3 py-1.5 sm:py-2 flex justify-between items-center gap-1 sm:gap-2 min-w-0">
          {isAuth ? (
            <>
              <img
                src={BRAND_LOGO_64}
                alt=""
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-contain shadow-sm shrink-0"
                width={36}
                height={36}
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
              <div
                data-onboarding="header-icons"
                className="flex items-center gap-0 sm:gap-0.5 shrink-0 min-w-0"
              >
                <PointsBadge
                  points={points}
                  pulse={pointsPulse}
                  onClick={openPoints}
                />
                <HeaderIconBtn
                  icon={Bell}
                  label="إشعارات"
                  theme="bell"
                  badge={notifCount}
                  onClick={() => navigate('/notifications')}
                />
                <HeaderIconBtn
                  icon={ShoppingCart}
                  label="طلباتي"
                  theme="cart"
                  onClick={() => navigate('/cart', { state: { tab: 'orders' } })}
                />
                <HeaderIconBtn
                  icon={MessageCircle}
                  label="رسائل"
                  theme="message"
                  badge={unreadCount}
                  onClick={() => navigate('/chat')}
                />
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
                className="w-9 h-9 rounded-lg object-contain shadow-md shrink-0"
                width={36}
                height={36}
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

      {isAuth && (
        <MoreMenuSheet
          open={moreOpen}
          onClose={closeMore}
          items={moreItems}
        />
      )}

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
