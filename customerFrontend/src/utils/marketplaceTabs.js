import React from 'react';
import {
  ShoppingCart, RefreshCw, Home, Megaphone, Heart, ClipboardList,
} from 'lucide-react';

export const MARKETPLACE_TAB_CONFIG = {
  buy: {
    id: 'buy',
    icon: ShoppingCart,
    label: 'شراء',
    types: ['buy'],
  },
  sellExchange: {
    id: 'sellExchange',
    icon: RefreshCw,
    label: 'بيع / بدل',
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
    types: ['wanted', 'custom'],
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

export const BROWSE_TAB_IDS = ['buy', 'sellExchange', 'rent', 'wanted'];

export const listingMatchesTab = (listing, tabId) => {
  const types = MARKETPLACE_TAB_CONFIG[tabId]?.types;
  if (!types) return false;
  return types.includes(listing.transactionType);
};
