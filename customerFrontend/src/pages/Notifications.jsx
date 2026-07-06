import React from 'react';
import { Bell, Gift, UserPlus, Trophy } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markRead, markAllRead } from '../services/notificationService';
import { queryKeys } from '../lib/queryClient';
import LightLoadingHint from '../shared/LightLoadingHint';

const typeIcon = (type) => {
  if (type === 'order_point_gift') return Gift;
  if (type === 'referral_batch') return UserPlus;
  if (type === 'competition_draw') return Trophy;
  return Bell;
};

export default function Notifications() {
  const qc = useQueryClient();

  const { data: items = [], isLoading, error: queryError } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const { data } = await getNotifications();
      return data.notifications || [];
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
    <div className="max-w-lg mx-auto pb-8" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Bell size={22} className="text-primary" /> الإشعارات
        </h1>
        {items.some((n) => !n.read) && (
          <button
            type="button"
            onClick={handleMarkAll}
            className="text-xs font-bold text-primary bg-primary/10 px-3 py-2 rounded-xl"
          >
            تعليم الكل كمقروء
          </button>
        )}
      </div>

      {isLoading && items.length === 0 && (
        <LightLoadingHint label="جاري تحميل الإشعارات..." />
      )}

      {!isLoading && error && (
        <p className="text-center text-red-500 font-bold py-10">{error}</p>
      )}

      {!isLoading && !error && items.length === 0 && (
        <p className="text-center text-gray-400 font-bold py-16">لا توجد إشعارات بعد</p>
      )}

      <div className="space-y-3">
        {items.map((n) => {
          const Icon = typeIcon(n.type);
          return (
            <button
              key={n._id}
              type="button"
              onClick={() => handleClick(n)}
              className={`w-full text-right flex gap-3 items-start p-4 rounded-2xl border transition-colors ${
                n.read ? 'bg-white border-gray-100' : 'bg-amber-50/80 border-amber-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.read ? 'bg-gray-100' : 'bg-amber-100'}`}>
                <Icon size={18} className={n.read ? 'text-gray-500' : 'text-amber-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <strong className="text-sm text-gray-900">{n.title}</strong>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </div>
                <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                <small className="text-[11px] text-gray-400 mt-1 block">
                  {new Date(n.createdAt).toLocaleString('ar')}
                </small>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
