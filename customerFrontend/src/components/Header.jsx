import React, { useState, useEffect, useRef } from 'react';
import {
  Crown, ShoppingCart, MessageCircle, Trophy, Medal, CircleDot, Bell,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PointsModal from './PointsModal';
import PointsBadge from './PointsBadge';
import HorizontalSwipe from './ui/HorizontalSwipe';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';
import usePlatformSettings from '../hooks/usePlatformSettings';
import { POINTS_FLOAT_EVENT } from '../utils/pointsAnimation';

const IconBtn = ({ icon: Icon, label, onClick, color, badge, pulse }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-center gap-0.5 min-w-[44px] py-1 px-1 rounded-xl active:scale-95 transition-transform relative"
    aria-label={label}
  >
    <Icon size={20} className={color} strokeWidth={2} />
    <span className="text-[7px] font-black text-white/80 leading-none">{label}</span>
    {badge > 0 && (
      <span className="absolute -top-0.5 -left-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
    {pulse && (
      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping opacity-75" />
    )}
  </button>
);

const Header = () => {
  const navigate = useNavigate();
  const { isAuth, user, updateUser } = useAuth();
  const [pointsOpen, setPointsOpen] = useState(false);
  const [pointsPulse, setPointsPulse] = useState(null);
  const lastMeSyncAt = useRef(0);
  const userRef = useRef(user);
  userRef.current = user;

  const { data: cartData } = useQuery({
    queryKey: queryKeys.cart,
    queryFn: async () => (await api.get('/cart')).data,
    enabled: isAuth,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

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

  const cartCount = (cartData?.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
  const unreadCount = unreadData?.count || 0;
  const notifCount = notifData?.count || 0;
  const points = user?.points ?? meData?.points ?? meData?.user?.points ?? 0;

  // مزامنة من الخادم فقط بعد fetch ناجح — لا تُستبدل القيمة المحلية ببيانات قديمة
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

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0b0b10]/95 backdrop-blur-lg border-b border-white/10 shadow-sm" dir="rtl">
        <div className="max-w-lg mx-auto w-full px-3 py-2 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 cursor-pointer min-w-0" onClick={() => navigate('/')}>
            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="w-9 h-9 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg shrink-0"
            >
              <Crown size={18} className="text-white" />
            </motion.div>
            <h1 className="text-[13px] font-black text-white leading-tight truncate">متعة التسوق والربح</h1>
          </div>
          {isAuth && (
            <PointsBadge
              points={points}
              pulse={pointsPulse}
              onClick={() => setPointsOpen(true)}
            />
          )}
          {!isAuth && (
            <button type="button" onClick={() => navigate('/login')} className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-black shrink-0">دخول</button>
          )}
        </div>

        {isAuth && (
          <HorizontalSwipe spaceBetween={4} className="max-w-lg mx-auto w-full px-1 pb-2">
            <IconBtn icon={ShoppingCart} label="السلة" color="text-emerald-300" badge={cartCount} onClick={() => navigate('/cart')} />
            <IconBtn icon={Bell} label="إشعارات" color="text-amber-300" badge={notifCount} onClick={() => navigate('/notifications')} />
            <IconBtn icon={MessageCircle} label="دردشة" color="text-blue-300" badge={unreadCount} onClick={() => navigate('/chat')} />
            {showCompetitions && (
              <IconBtn icon={Trophy} label="الشرف" color="text-yellow-300" onClick={() => navigate('/honor')} />
            )}
            {showCompetitions && (
              <IconBtn icon={Medal} label="مسابقات" color="text-purple-300" onClick={() => navigate('/competitions')} />
            )}
            {showWheel && (
              <IconBtn icon={CircleDot} label="العجلة" color="text-pink-300" pulse onClick={() => navigate('/wheel')} />
            )}
          </HorizontalSwipe>
        )}
      </header>

      <PointsModal open={pointsOpen} onClose={() => setPointsOpen(false)} userName={user?.name} points={points} />
    </>
  );
};

export default Header;
