import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, MessageCircle, ShoppingCart, LayoutGrid, CircleDot, Medal,
  BarChart3, Settings, LogOut, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PointsModal from './PointsModal';
import PointsBadge from './PointsBadge';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';
import usePlatformSettings from '../hooks/usePlatformSettings';
import { POINTS_FLOAT_EVENT } from '../utils/pointsAnimation';

const HeaderIconBtn = ({ icon: Icon, label, onClick, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl active:scale-95 transition-transform shrink-0"
    aria-label={label}
  >
    <Icon size={20} className="text-gray-800 sm:hidden" strokeWidth={2.1} />
    <Icon size={24} className="text-gray-800 hidden sm:block" strokeWidth={2.1} />
    {badge > 0 && (
      <span className="absolute top-0.5 left-0.5 min-w-[16px] h-[16px] px-1 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </button>
);

function MoreMenuSheet({ open, onClose, items }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            aria-label="إغلاق القائمة"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 px-4 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] max-w-lg mx-auto"
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const Header = () => {
  const navigate = useNavigate();
  const { isAuth, user, updateUser, logout } = useAuth();
  const [pointsOpen, setPointsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [pointsPulse, setPointsPulse] = useState(null);
  const lastMeSyncAt = useRef(0);
  const userRef = useRef(user);
  userRef.current = user;

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
    if (pts != null && userRef.current?.points !== pts) patch.points = pts;
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

  const moreItems = [
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
      icon: Settings,
      label: 'الإعدادات',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      onClick: () => navigate('/center'),
    },
    {
      icon: LogOut,
      label: 'تسجيل الخروج',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      danger: true,
      onClick: () => logout(),
    },
  ].filter(Boolean);

  return (
    <>
      <header
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/70 shadow-sm"
        dir="rtl"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-lg mx-auto w-full px-2 sm:px-3 py-1 flex justify-between items-center gap-1 sm:gap-2 min-w-0">
          {isAuth ? (
            <PointsBadge
              points={points}
              pulse={pointsPulse}
              onClick={() => setPointsOpen(true)}
            />
          ) : (
            <button
              type="button"
              className="flex items-center gap-2 min-w-0 active:scale-[0.98] transition-transform"
              onClick={() => navigate('/')}
              aria-label="الرئيسية"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-red-700 rounded-lg flex items-center justify-center shadow-md shrink-0">
                <span className="text-white text-[11px] font-black tracking-tight">WZ</span>
              </div>
              <span className="text-[15px] font-black text-gray-900 tracking-tight truncate">Winzor</span>
            </button>
          )}

          {isAuth && (
            <div className="flex items-center gap-0 sm:gap-0.5 shrink-0 min-w-0">
              <HeaderIconBtn
                icon={Bell}
                label="إشعارات"
                badge={notifCount}
                onClick={() => navigate('/notifications')}
              />
              <HeaderIconBtn
                icon={ShoppingCart}
                label="طلباتي"
                onClick={() => navigate('/cart', { state: { tab: 'orders' } })}
              />
              <HeaderIconBtn
                icon={MessageCircle}
                label="رسائل"
                badge={unreadCount}
                onClick={() => navigate('/chat')}
              />
              <HeaderIconBtn
                icon={LayoutGrid}
                label="المزيد"
                onClick={() => setMoreOpen(true)}
              />
            </div>
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
          onClose={() => setMoreOpen(false)}
          items={moreItems}
        />
      )}

      <PointsModal open={pointsOpen} onClose={() => setPointsOpen(false)} userName={user?.name} points={points} />
    </>
  );
};

export default Header;
