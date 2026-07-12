import { ShoppingCart, Home, Megaphone, Heart, ClipboardList } from 'lucide-react';

export const MARKETPLACE_TAB_CONFIG = {
  sellExchange: {
    id: 'sellExchange',
    icon: ShoppingCart,
    label: 'شراء / بدل',
    types: ['sell', 'exchange'],
  },
  rent: {
    id: 'rent',
    icon: Home,
    label: 'للإيجار',
    types: ['rent'],
  },
  wanted: {
    id: 'wanted',
    icon: Megaphone,
    label: 'مطلوب',
    types: ['custom'],
  },
  favorites: {
    id: 'favorites',
    icon: Heart,
    label: 'المفضلة',
    types: null,
  },
  mine: {
    id: 'mine',
    icon: ClipboardList,
    label: 'منشوراتي',
    types: null,
  },
};

export const MARKETPLACE_TABS = Object.values(MARKETPLACE_TAB_CONFIG);

export const BROWSE_TAB_IDS = ['sellExchange', 'rent', 'wanted'];

export const listingMatchesTab = (listing, tabId) => {
  const types = MARKETPLACE_TAB_CONFIG[tabId]?.types;
  if (!types) return false;
  return types.includes(listing.transactionType);
};
