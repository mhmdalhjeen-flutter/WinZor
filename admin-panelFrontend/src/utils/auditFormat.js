export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatRelativeTime(date) {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} ي`;
}

export const OPERATION_LABELS = {
  create: 'إضافة',
  update: 'تعديل',
  delete: 'حذف',
  enable: 'تفعيل',
  disable: 'تعطيل',
  login: 'دخول',
  logout: 'خروج',
  access: 'وصول',
  export: 'تصدير',
  other: 'أخرى',
};

export const SEVERITY_LABELS = {
  info: 'عادي',
  warning: 'تحذير',
  danger: 'خطر',
};

export const CATEGORY_LABELS = {
  admin_login: 'دخول الأدمن',
  admin_audit: 'نشاط إداري',
  security: 'أمني',
  platform: 'منصة',
};
