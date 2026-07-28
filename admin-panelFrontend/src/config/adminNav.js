import {
  LayoutDashboard, Store, Ticket, Settings, Layers, Trophy, Activity, Users, ShieldAlert,
  Award, Medal, MapPin, CircleDot, ShoppingBag, Route, Lightbulb, BarChart3, Flame, KeyRound,
  MessageCircle, ArrowUpDown, ClipboardList,
} from 'lucide-react';

/** مصدر واحد لتنظيم صفحات لوحة الأدمن — Sidebar + Dashboard */
export const ADMIN_NAV_GROUPS = [
  {
    id: 'orders',
    title: 'الطلبات',
    color: '#14b8a6',
    items: [
      { name: 'سجل الطلبات', path: '/order-history', icon: ClipboardList, desc: 'بحث وتصدير الطلبات' },
    ],
  },
  {
    id: 'reports',
    title: 'التقارير والإحصائيات',
    color: '#6366f1',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, desc: 'نظرة عامة على المنصة' },
      { name: 'Analytics', path: '/analytics', icon: BarChart3, desc: 'تحليلات ونمو' },
      { name: 'Heat Maps', path: '/heatmaps', icon: Flame, desc: 'خرائط الحرارة' },
    ],
  },
  {
    id: 'users',
    title: 'إدارة المستخدمين',
    color: '#818cf8',
    items: [
      { name: 'الزبائن والمستخدمون', path: '/users', icon: Users, desc: 'إدارة الحسابات' },
      { name: 'مركز التواصل', path: '/chats', icon: MessageCircle, desc: 'محادثات الأدمن مع المستخدمين' },
      { name: 'اقتراحات المستخدمين', path: '/suggestions', icon: Lightbulb, desc: 'مراجعة الاقتراحات' },
    ],
  },
  {
    id: 'stores',
    title: 'أصحاب المتاجر والتجار',
    color: '#22c55e',
    items: [
      { name: 'إدارة المتاجر', path: '/stores', icon: Store, desc: 'متاجر وتجار' },
      { name: 'موافقة «اعرض غراضك»', path: '/bazaar-approvals', icon: ShoppingBag, desc: 'إعلانات السوق' },
      { name: 'تصنيفات المتاجر', path: '/categories', icon: Layers, desc: 'شجرة التصنيفات' },
      { name: 'أولويات العرض', path: '/display-priority', icon: ArrowUpDown, desc: 'ترتيب التصنيفات والمتاجر والعروض' },
      { name: 'المناطق', path: '/regions', icon: MapPin, desc: 'المناطق الجغرافية' },
    ],
  },
  {
    id: 'content',
    title: 'إدارة المحتوى',
    color: '#a855f7',
    items: [
      { name: 'المسابقات', path: '/competitions', icon: Medal, desc: 'إنشاء وإدارة' },
      { name: 'لوحة الشرف', path: '/honor', icon: Award, desc: 'الشرف والتصنيف' },
      { name: 'مسار الإنجازات', path: '/achievements', icon: Route, desc: 'مراحل الإنجاز' },
      { name: 'فائزو العجلة', path: '/wheel-winners', icon: Trophy, desc: 'جوائز العجلة' },
    ],
  },
  {
    id: 'codes',
    title: 'إدارة الأكواد',
    color: '#0ea5e9',
    items: [
      { name: 'Promo Codes', path: '/promo-codes', icon: Ticket, desc: 'أكواد ترويجية' },
      { name: 'Code Generator', path: '/code-generator', icon: KeyRound, desc: 'مفاتيح التفعيل' },
    ],
  },
  {
    id: 'platform',
    title: 'إعدادات المنصة',
    color: '#f59e0b',
    items: [
      { name: 'Platform Settings', path: '/settings', icon: Settings, desc: 'إعدادات عامة' },
      { name: 'Wheel Management', path: '/wheel-management', icon: CircleDot, desc: 'جوائز العجلة' },
    ],
  },
  {
    id: 'security',
    title: 'الأمان والسجلات',
    color: '#ef4444',
    items: [
      { name: 'سجل النشاطات', path: '/activity', icon: Activity, desc: 'تدقيق العمليات' },
      { name: 'مركز الأمان', path: '/security', icon: ShieldAlert, desc: 'دخول وتنبيهات' },
    ],
  },
];

export const ALL_ADMIN_PAGES = ADMIN_NAV_GROUPS.flatMap((g) =>
  g.items.map((item) => ({ ...item, groupTitle: g.title, groupColor: g.color }))
);
