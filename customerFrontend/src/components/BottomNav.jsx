import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Store, Gift, User, ShoppingBag } from 'lucide-react';
import usePlatformSettings from '../hooks/usePlatformSettings';

const BottomNav = () => {
  const { data: settings } = usePlatformSettings();
  const features = settings?.features || {};

  const navItems = [
    { to: '/', icon: Home, label: 'الرئيسية', show: true },
    { to: '/explore', icon: Store, label: 'المتاجر', show: true },
    { to: '/marketplace', icon: ShoppingBag, label: 'سوق الماهر', show: features.marketplace !== false },
    { to: '/draws', icon: Gift, label: 'الجوائز', show: features.draws !== false },
    { to: '/center', icon: User, label: 'حسابي', show: true },
  ].filter((item) => item.show);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 px-1 pt-2 flex justify-around items-center shadow-[0_-4px_24px_rgba(0,0,0,0.08)] max-w-2xl mx-auto"
      style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to} className="flex-1 max-w-[5rem]">
          {({ isActive }) => (
            <div
              className={`flex flex-col items-center gap-1 py-1 px-1 rounded-2xl transition-all duration-200 ${
                isActive ? 'scale-105' : ''
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 shadow-sm'
                    : 'bg-transparent'
                }`}
              >
                <item.icon
                  size={26}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-primary' : 'text-gray-500'}
                />
              </div>

              <span
                className={`text-[10px] font-black leading-none text-center ${
                  isActive ? 'text-primary' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>

              {isActive && (
                <div className="h-1 w-5 bg-primary rounded-full mt-0.5" />
              )}
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
