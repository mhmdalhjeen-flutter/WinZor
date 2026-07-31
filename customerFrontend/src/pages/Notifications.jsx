import { Bell, Clock, AlertCircle, RefreshCw, Tag, Gift, UserPlus, Trophy, MessageCircle, CheckCircle2, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markRead, markAllRead } from '../services/notificationService';
import { queryKeys } from '../lib/queryClient';
import { cleanupNotifications } from '../utils/notificationCleanup';
import { handleOrderNotificationClick } from '../components/NotificationListener';
import LightLoadingHint from '../shared/LightLoadingHint';
import '../styles/Notifications.css';

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

export default function Notifications() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: items = [], isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const { data } = await getNotifications();
      return cleanupNotifications(data.notifications || []);
    },
    staleTime: 30 * 1000,
  });

  const error = queryError?.response?.data?.message || (queryError ? 'تعذّر تحميل الإشعارات' : '');

  const patchItems = (updater) => {
    qc.setQueryData(queryKeys.notifications, (prev = []) => updater(prev));
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      patchItems((prev) => prev.map((n) => ({ ...n, read: true })));
      qc.invalidateQueries({ queryKey: queryKeys.unreadNotifications });
    } catch {
      /* تجاهل */
    }
  };

  const handleClick = async (n) => {
    const link = n.data?.drawLink || n.data?.url;
    if (n.type === 'competition_draw' && link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
    if (handleOrderNotificationClick(navigate, n)) {
      if (!n.read) {
        try {
          await markRead(n._id);
          patchItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
          qc.invalidateQueries({ queryKey: queryKeys.unreadNotifications });
        } catch {
          /* ignore */
        }
      }
      return;
    }
    if (n.read) return;
    try {
      await markRead(n._id);
      patchItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      qc.invalidateQueries({ queryKey: queryKeys.unreadNotifications });
    } catch {
      /* تجاهل */
    }
  };

  return (
    <div className="notifications-page" dir="rtl">
      <div className="notifications-page__head">
        <div>
          <h2 className="notifications-page__title">
            <Bell size={24} strokeWidth={2.2} />
            الإشعارات
          </h2>
          <p className="notifications-page__sub">كل التنبيهات والتحديثات في مكان واحد</p>
        </div>
        {items.some((n) => !n.read) && (
          <button type="button" className="notifications-mark-all" onClick={handleMarkAll}>
            تعليم الكل كمقروء
          </button>
        )}
      </div>

      {isLoading && items.length === 0 && (
        <LightLoadingHint label="جاري تحميل الإشعارات..." />
      )}

      {error && <p className="notifications-error">{error}</p>}
      {!isLoading && !error && items.length === 0 && (
        <div className="notifications-empty">
          <Bell size={40} strokeWidth={1.5} />
          <p>لا توجد إشعارات</p>
        </div>
      )}

      <div className="notifications-list">
        {items.map((n) => {
          const { Icon, tone } = typeMeta(n.type);
          return (
            <article
              key={n._id}
              className={`notif-full-card${n.read ? '' : ' notif-full-card--unread'}`}
              onClick={() => handleClick(n)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleClick(n)}
            >
              <span className={`notif-card__icon notif-card__icon--${tone}`}>
                <Icon size={22} strokeWidth={2} />
              </span>
              <div className="notif-full-card__body">
                <div className="notif-full-card__row">
                  <strong>{n.title}</strong>
                  {!n.read && <span className="notif-card__dot" />}
                </div>
                {n.body && <p>{n.body}</p>}
                {n.type === 'order_rejected' && n.data?.rejectionReason && (
                  <p className="notif-rejection-reason">السبب: {n.data.rejectionReason}</p>
                )}
                <time>{new Date(n.createdAt).toLocaleString('ar-EG')}</time>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
