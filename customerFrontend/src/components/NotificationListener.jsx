import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../shared/Toast';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';

const STORAGE_KEY = 'seenPointNotifIds';

const POINT_NOTIF_TYPES = new Set(['order_point_gift', 'referral_batch']);

function loadSeenIds() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveSeenIds(set) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set].slice(-80)));
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
        const { data } = await api.get('/notifications', { params: { unread: 'true', limit: 15 } });
        const list = data.notifications || [];
        let hasNewPoint = false;

        for (const n of list) {
          if (!POINT_NOTIF_TYPES.has(n.type) || seenRef.current.has(n._id)) continue;
          seenRef.current.add(n._id);
          toast(n.body || n.title, 'success');
          hasNewPoint = true;
        }

        if (hasNewPoint) {
          saveSeenIds(seenRef.current);
          queryClient.invalidateQueries({ queryKey: queryKeys.me });
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
          queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotifications });
        }
      } catch {
        /* تجاهل أخطاء الشبكة */
      }
    };

    poll();
  }, [isAuth, toast, queryClient]);

  return null;
}
