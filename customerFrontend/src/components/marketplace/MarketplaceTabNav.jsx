import React from 'react';
import { ShoppingCart, Plus, ClipboardList, Heart } from 'lucide-react';

const TABS = [
  { id: 'browse', icon: ShoppingCart, label: 'شراء' },
  { id: 'sell', icon: Plus, label: 'بيع' },
  { id: 'mine', icon: ClipboardList, label: 'منشوراتي' },
  { id: 'favorites', icon: Heart, label: 'المفضلة' },
];

const MarketplaceTabNav = ({ activeTab, onTabChange }) => (
  <nav
    className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm px-2 py-3"
    aria-label="تنقل السوق"
  >
    <div className="grid grid-cols-4 gap-1 max-w-lg mx-auto">
      {TABS.map(({ id, icon: Icon, label }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-2xl transition-all duration-200 ${
              active
                ? 'bg-amber-50 text-amber-600 shadow-sm ring-1 ring-amber-200/80'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span
              className={`flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 ${
                active ? 'bg-white shadow-sm' : 'bg-gray-50'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.25 : 1.75}
                className={active ? 'text-amber-500' : undefined}
                fill={id === 'favorites' && active ? 'currentColor' : 'none'}
              />
            </span>
            <span className={`text-[11px] font-black leading-tight ${active ? 'text-amber-700' : ''}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default MarketplaceTabNav;
