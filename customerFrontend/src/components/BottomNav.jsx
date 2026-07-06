import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Store, Gift, Sparkles, ShoppingBag } from 'lucide-react';
import usePlatformSettings from '../hooks/usePlatformSettings';

const BottomNav = () => {
  const { data: settings } = usePlatformSettings();
  const features = settings?.features || {};

  const navItems = [
    { to: '/', icon: Home, label: 'الرئيسية', show: true },
    { to: '/explore', icon: Store, label: 'المتاجر', show: true },
    { to: '/marketplace', icon: ShoppingBag, label: 'غراضي', show: features.marketplace !== false },
    { to: '/draws', icon: Gift, label: 'الجوائز', show: features.draws !== false },
    { to: '/center', icon: Sparkles, label: 'مركزي', show: true },
  ].filter((item) => item.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1220]/90 backdrop-blur-2xl border-t border-white/10 px-2 py-3 flex justify-around items-center z-50 shadow-[0_-15px_35px_rgba(0,0,0,0.45)] rounded-t-[30px] max-w-2xl mx-auto">
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to}>
          {({ isActive }) => (
            <div
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-red-400 scale-110' : 'text-white/40'
              }`}
            >
              <item.icon
                size={20}
                strokeWidth={isActive ? 2.6 : 1.8}
                className={
                  isActive
                    ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.7)]'
                    : 'text-white/40'
                }
              />

              <span
                className={`text-[8px] font-black ${
                  isActive ? 'opacity-100 text-white' : 'opacity-60 text-white/50'
                }`}
              >
                {item.label}
              </span>

              {isActive && (
                <div className="h-1 w-1 bg-cyan-300 rounded-full mt-0.5 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
              )}
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
