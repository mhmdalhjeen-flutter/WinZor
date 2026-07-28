const STORAGE_KEY = 'win-gold-notification-prefs-v1';

export const NOTIFICATION_PREF_ITEMS = [
  { id: 'orders', label: 'الطلبات' },
  { id: 'orderStatus', label: 'حالة الطلب' },
  { id: 'offers', label: 'العروض' },
  { id: 'storeAnnouncements', label: 'إعلانات المتاجر' },
  { id: 'marketplace', label: 'السوق العام' },
  { id: 'points', label: 'النقاط' },
  { id: 'competitions', label: 'المسابقات' },
  { id: 'rewards', label: 'المكافآت' },
  { id: 'general', label: 'إشعارات عامة' },
];

export const DEFAULT_NOTIFICATION_PREFS = Object.fromEntries(
  NOTIFICATION_PREF_ITEMS.map((item) => [item.id, true]),
);

export function loadNotificationPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_NOTIFICATION_PREFS, ...parsed };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export function saveNotificationPreferences(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
