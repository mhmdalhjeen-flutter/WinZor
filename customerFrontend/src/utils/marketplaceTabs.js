import { ShoppingCart, Home, Megaphone, Heart, ClipboardList } from 'lucide-react';

export const MARKETPLACE_TAB_CONFIG = {
  sellExchange: {
    id: 'sellExchange',
    icon: ShoppingCart,
    label: 'شراء / بدل',
    types: ['sell', 'exchange'],
    color: {
      active: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
      icon: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      iconBgActive: 'bg-white shadow-sm',
    },
  },
  rent: {
    id: 'rent',
    icon: Home,
    label: 'إيجار',
    types: ['rent'],
    color: {
      active: 'bg-blue-50 text-blue-700 ring-blue-200/80',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100',
      iconBgActive: 'bg-white shadow-sm',
    },
  },
  wanted: {
    id: 'wanted',
    icon: Megaphone,
    label: 'مطلوب',
    types: ['custom'],
    color: {
      active: 'bg-orange-50 text-orange-700 ring-orange-200/80',
      icon: 'text-orange-600',
      iconBg: 'bg-orange-100',
      iconBgActive: 'bg-white shadow-sm',
    },
  },
  favorites: {
    id: 'favorites',
    icon: Heart,
    label: 'المفضلة',
    types: null,
    color: {
      active: 'bg-rose-50 text-rose-700 ring-rose-200/80',
      icon: 'text-rose-500',
      iconBg: 'bg-rose-100',
      iconBgActive: 'bg-white shadow-sm',
    },
  },
  mine: {
    id: 'mine',
    icon: ClipboardList,
    label: 'منشوراتي',
    types: null,
    color: {
      active: 'bg-violet-50 text-violet-700 ring-violet-200/80',
      icon: 'text-violet-600',
      iconBg: 'bg-violet-100',
      iconBgActive: 'bg-white shadow-sm',
    },
  },
};

export const MARKETPLACE_TABS = Object.values(MARKETPLACE_TAB_CONFIG);

export const BROWSE_TAB_IDS = ['sellExchange', 'rent', 'wanted'];

export const listingMatchesTab = (listing, tabId) => {
  const types = MARKETPLACE_TAB_CONFIG[tabId]?.types;
  if (!types) return false;
  return types.includes(listing.transactionType);
};

export const PUBLISH_OPTIONS = [
  {
    id: 'sell',
    transactionType: 'sell',
    label: 'نشر عنصر للبيع',
    description: 'بيع منتج أو غرض مباشرة',
    icon: 'tag',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    id: 'exchange',
    transactionType: 'exchange',
    label: 'نشر عنصر للبيع أو البدل',
    description: 'متاح للبيع أو المقايضة',
    icon: 'repeat',
    color: 'bg-teal-100 text-teal-600',
  },
  {
    id: 'rent',
    transactionType: 'rent',
    label: 'نشر عنصر للإيجار',
    description: 'عقار، مركبة أو أي أصل للإيجار',
    icon: 'home',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'wanted',
    transactionType: 'custom',
    label: 'نشر طلب (مطلوب)',
    description: 'أبحث عن منتج أو خدمة',
    icon: 'megaphone',
    color: 'bg-orange-100 text-orange-600',
  },
];
