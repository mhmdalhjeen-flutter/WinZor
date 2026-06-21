import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, Trophy, User, CreditCard } from 'lucide-react';

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[32px] max-w-md mx-auto">

      {/* الرئيسية */}
      <NavLink to="/">
        {({ isActive }) => (
          <div className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}>
            <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[9px] font-bold">الرئيسية</span>
          </div>
        )}
      </NavLink>

      {/* المخزن */}
      <NavLink to="/inventory">
        {({ isActive }) => (
          <div className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}>
            <CreditCard size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[9px] font-bold">مخزني</span>
          </div>
        )}
      </NavLink>

      {/* الصناديق (زر مميز) */}
      <NavLink to="/chests">
        {({ isActive }) => (
          <div className="flex flex-col items-center gap-1 -mt-8">
            
            <div className={`p-3 rounded-2xl shadow-lg transition-all ${
              isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              <Package size={26} strokeWidth={2.5} />
            </div>

            <span className={`text-[9px] font-black mt-1 ${
              isActive ? 'text-primary' : 'text-gray-400'
            }`}>
              الصناديق
            </span>

          </div>
        )}
      </NavLink>

      {/* السحوبات */}
      <NavLink to="/draws">
        {({ isActive }) => (
          <div className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}>
            <Trophy size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[9px] font-bold">السحوبات</span>
          </div>
        )}
      </NavLink>

      {/* الحساب */}
      <NavLink to="/profile">
        {({ isActive }) => (
          <div className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}>
            <User size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[9px] font-bold">حسابي</span>
          </div>
        )}
      </NavLink>

    </nav>
  );
};

export default BottomNav;