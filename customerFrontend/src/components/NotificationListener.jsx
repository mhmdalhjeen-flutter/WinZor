import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../shared/Toast';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';
import { IMPORTANT_NOTIFICATION_TYPES } from '../lib/cacheConfig';

const STORAGE_KEY = 'seenImportantNotifIds';

const POINT_NOTIF_TYPES = new Set(['order_point_gift', 'referral_batch', 'reward', 'prize']);

function loadSeenIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveSeenIds(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set].slice(-60)));
  } catch {
    /* ignore */
  }
}

function isImportantNotification(notification) {
  if (!notification?.type) return false;
  if (IMPORTANT_NOTIFICATION_TYPES.has(notification.type)) return true;

  const haystack = `${notification.type} ${notification.title || ''} ${notification.body || ''}`.toLowerCase();
  if (/message|chat|order|competition|reward|prize|membership/.test(haystack)) return true;
  if (/offer/.test(haystack) && /(store|follow|member|متجر)/.test(haystack)) return true;
  return false;
}

export default function NotificationListener() {
  const { isAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const seenRef = useRef(loadSeenIds());

  useEffect(() => {
    if (!isAuth) return undefined;

    const poll = async () => {
      try {
        const { data } = await api.get('/notifications', {
          params: { unread: 'true', limit: 15 },
        });
        const list = (data.notifications || []).filter(isImportantNotification);
        let hasNewPoint = false;
        let hasImportant = false;

        for (const n of list) {
          if (seenRef.current.has(n._id)) continue;
          seenRef.current.add(n._id);
          hasImportant = true;

          if (POINT_NOTIF_TYPES.has(n.type)) {
            toast(n.body || n.title, 'success');
            hasNewPoint = true;
          } else {
            toast(n.title || n.body, 'info');
          }
        }

        if (hasImportant) {
          saveSeenIds(seenRef.current);
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
          queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotifications });
        }

        if (hasNewPoint) {
          queryClient.invalidateQueries({ queryKey: queryKeys.me });
          queryClient.invalidateQueries({ queryKey: queryKeys.userCenter });
        }
      } catch {
        /* تجاهل أخطاء الشبكة — البيانات المخزّنة تبقى ظاهرة */
      }
    };

    poll();
    return undefined;
  }, [isAuth, toast, queryClient]);

  return null;
}
