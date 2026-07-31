import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Clock, Tag, AlertCircle, RefreshCw, Gift, UserPlus, Trophy, MessageCircle, CheckCircle2, Package } from 'lucide-react';
import { getNotifications, markRead, markAllRead } from '../services/notificationService';
import { queryKeys } from '../lib/queryClient';
import { cleanupNotifications } from '../utils/notificationCleanup';
import { handleOrderNotificationClick } from './NotificationListener';
import '../styles/NotificationDropdown.css';

const PREVIEW_LIMIT = 6;

function typeMeta(type) {
  switch (type) {
    case 'offer_expiring':
      return { Icon: Clock, tone: 'warning' };
    case 'offer_expired':
      return { Icon: AlertCircle, tone: 'danger' };
    case 'offer_renewed':
      return { Icon: RefreshCw, tone: 'info' };
    case 'order_confirmed':
      return { Icon: CheckCircle2, tone: 'info' };
    case 'order_rejected':
      return { Icon: AlertCircle, tone: 'danger' };
    case 'order_status':
    case 'order':
      return { Icon: Package, tone: 'info' };
    case 'order_point_gift':
      return { Icon: Gift, tone: 'info' };
    case 'referral_batch':
      return { Icon: UserPlus, tone: 'info' };
    case 'competition_draw':
      return { Icon: Trophy, tone: 'warning' };
    case 'chat_message':
      return { Icon: MessageCircle, tone: 'info' };
    default:
      return { Icon: Tag, tone: 'default' };
  }
}

function formatWhen(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso);
  if (diff < 60000) return 'الآن';
  if (diff < 3600000) return `منذ ${Math.floor(diff / 60000)} د`;
  if (diff < 86400000) return `منذ ${Math.floor(diff / 3600000)} س`;
  return new Date(iso).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
}

export default function NotificationDropdown({ count, onCountChange, viewAllPath = '/notifications' }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const panelRef = useRef(null);
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const { data } = await getNotifications();
      return cleanupNotifications(data.notifications || []);
    },
    enabled: open,
    staleTime: 20 * 1000,
  });

  const preview = items.slice(0, PREVIEW_LIMIT);
  const unreadPreview = preview.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (panelRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const patchItems = (updater) => {
    qc.setQueryData(queryKeys.notifications, (prev = []) => updater(prev));
  };

  const syncUnread = (next) => {
    onCountChange?.(next);
    qc.setQueryData(queryKeys.unreadNotifications, (prev) => ({ ...(prev || {}), count: next }));
  };

  const handleItemClick = async (n) => {
    const link = n.data?.drawLink || n.data?.url;
    if (n.type === 'competition_draw' && link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
    if (handleOrderNotificationClick(navigate, n)) {
      if (!n.read) {
        try {
          await markRead(n._id);
          patchItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
          syncUnread(Math.max(0, count - 1));
        } catch {
          /* ignore */
        }
      }
      setOpen(false);
      return;
    }
    if (!n.read) {
      try {
        await markRead(n._id);
        patchItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
        syncUnread(Math.max(0, count - 1));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      patchItems((prev) => prev.map((n) => ({ ...n, read: true })));
      syncUnread(0);
    } catch {
      /* ignore */
    }
  };

  const viewAll = () => {
    setOpen(false);
    navigate(viewAllPath);
  };

  return (
    <div className="notif-dropdown-wrap">
      <button
        ref={btnRef}
        type="button"
        className={`header-icon-btn notif-bell-btn${open ? ' is-open' : ''}`}
        title="الإشعارات"
        aria-label="الإشعارات"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={22} strokeWidth={2} />
        {count > 0 && (
          <span className="header-badge" aria-label={`${count} غير مقروء`}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <AnimatePresence mode="wait">
      {open && (
        <motion.div
          ref={panelRef}
          role="menu"
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.65 }}
          className="notif-dropdown-panel notif-dropdown-panel--animated"
        >
          <div className="notif-dropdown-head">
            <div>
              <h3>الإشعارات</h3>
              {unreadPreview > 0 && (
                <span className="notif-dropdown-sub">{unreadPreview} جديد</span>
              )}
            </div>
            {items.some((n) => !n.read) && (
              <button type="button" className="notif-mark-all" onClick={handleMarkAll}>
                تعليم الكل
              </button>
            )}
          </div>

          <div className="notif-dropdown-list">
            {preview.length === 0 ? (
              <div className="notif-dropdown-empty">
                <Bell size={28} strokeWidth={1.5} />
                <p>لا توجد إشعارات</p>
              </div>
            ) : (
              preview.map((n) => {
                const { Icon, tone } = typeMeta(n.type);
                return (
                  <button
                    key={n._id}
                    type="button"
                    className={`notif-dropdown-item${n.read ? '' : ' is-unread'}`}
                    onClick={() => handleItemClick(n)}
                  >
                    <span className={`notif-item-icon notif-item-icon--${tone}`}>
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <span className="notif-item-body">
                      <span className="notif-item-title">{n.title}</span>
                      {n.body && <span className="notif-item-text">{n.body}</span>}
                      <span className="notif-item-time">{formatWhen(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="notif-unread-dot" aria-hidden />}
                  </button>
                );
              })
            )}
          </div>

          {items.length > 0 && (
            <button type="button" className="notif-view-all" onClick={viewAll}>
              عرض الكل
            </button>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
