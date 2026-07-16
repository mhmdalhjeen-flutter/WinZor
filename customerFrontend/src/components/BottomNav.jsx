import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Store, Gift, ShoppingBag } from 'lucide-react';
import usePlatformSettings from '../hooks/usePlatformSettings';

function RewardsNavIcon({ size = 24, active = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={active ? 'drop-shadow-[0_2px_6px_rgba(245,158,11,0.45)]' : 'opacity-90'}
    >
      <circle cx="12" cy="12" r="9.25" fill={active ? 'url(#rewardsNavBg)' : '#f8fafc'} stroke={active ? '#fbbf24' : '#cbd5e1'} strokeWidth="1.2" />
      <path
        d="M12 4.5l1.45 3.35 3.65.28-2.78 2.35.86 3.56L12 12.35 8.82 14.04l.86-3.56-2.78-2.35 3.65-.28L12 4.5z"
        fill={active ? '#fbbf24' : '#f59e0b'}
        stroke={active ? '#fde68a' : '#d97706'}
        strokeWidth="0.5"
      />
      <path
        d="M7.25 16.25h9.5"
        stroke={active ? '#3b82f6' : '#64748b'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8.25" cy="17.75" r="1.15" fill={active ? '#ef4444' : '#94a3b8'} />
      <circle cx="15.75" cy="17.75" r="1.15" fill={active ? '#3b82f6' : '#94a3b8'} />
      <defs>
        <linearGradient id="rewardsNavBg" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="0.55" stopColor="#dc2626" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const BottomNav = () => {
  const { data: settings } = usePlatformSettings();
  const features = settings?.features || {};

  const navItems = [
    { to: '/', icon: Home, label: 'الرئيسية', show: true },
    { to: '/explore', icon: Store, label: 'المتاجر', show: true },
    { to: '/marketplace', icon: ShoppingBag, label: 'السوق المفتوح', show: features.marketplace !== false },
    { to: '/draws', icon: Gift, label: 'الجوائز', show: features.draws !== false },
    { to: '/center', label: 'نقاطي', customIcon: 'rewards', show: true },
  ].filter((item) => item.show);

  return (
    <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 px-1 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.06)] max-w-2xl mx-auto">
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to} className="flex-1 max-w-[5rem]">
          {({ isActive }) => (
            <div
              className={`app-bottom-nav__item flex flex-col items-center justify-center gap-0.5 py-0.5 px-1 rounded-2xl transition-all duration-200 ${
                isActive ? 'scale-[1.03]' : ''
              }`}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
                  item.customIcon === 'rewards' && isActive
                    ? 'bg-gradient-to-br from-violet-100 via-amber-50 to-red-50 shadow-sm ring-1 ring-amber-200/60'
                    : isActive
                      ? 'bg-primary/10 shadow-sm'
                      : 'bg-transparent'
                }`}
              >
                {item.customIcon === 'rewards' ? (
                  <RewardsNavIcon size={24} active={isActive} />
                ) : (
                  <item.icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? 'text-primary' : 'text-gray-600'}
                  />
                )}
              </div>

              <span
                className={`font-cairo text-[10px] font-black leading-none text-center ${
                  isActive ? 'text-primary' : 'text-gray-600'
                }`}
              >
                {item.label}
              </span>

              {isActive && (
                <div className="h-0.5 w-4 bg-primary rounded-full mt-0.5" />
              )}
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
