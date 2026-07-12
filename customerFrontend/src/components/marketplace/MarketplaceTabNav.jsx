import React from 'react';
import { MARKETPLACE_TABS } from '../../utils/marketplaceTabs';

const MarketplaceTabNav = ({ activeTab, onTabChange }) => (
  <nav
    className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
    aria-label="تنقل السوق"
  >
    <div className="flex gap-1 overflow-x-auto px-2 py-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {MARKETPLACE_TABS.map(({ id, icon: Icon, label }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-1.5 py-2 px-2.5 min-w-[4.5rem] rounded-2xl transition-all duration-200 snap-start shrink-0 ${
              active
                ? 'bg-amber-50 text-amber-600 shadow-sm ring-1 ring-amber-200/80'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span
              className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200 ${
                active ? 'bg-white shadow-sm' : 'bg-gray-50'
              }`}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.25 : 1.75}
                className={active ? 'text-amber-500' : undefined}
                fill={id === 'favorites' && active ? 'currentColor' : 'none'}
              />
            </span>
            <span className={`text-[10px] font-black leading-tight text-center whitespace-nowrap ${active ? 'text-amber-700' : ''}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default MarketplaceTabNav;
