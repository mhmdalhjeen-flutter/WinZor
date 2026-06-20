import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, Trophy, User, CreditCard } from 'lucide-react';

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[32px] max-w-md mx-auto">
      <NavLink 
        to="/" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}
      >
        <Home size={22} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[9px] font-bold">الرئيسية</span>
      </NavLink>

      <NavLink 
        to="/inventory" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}
      >
        <CreditCard size={22} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[9px] font-bold">مخزني</span>
      </NavLink>

      {/* زر الصناديق - مميز في المنتصف */}
      <NavLink 
        to="/chests" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-all -mt-8 bg-white p-3 rounded-full shadow-lg ${isActive ? 'text-primary' : 'text-gray-400'}`}
      >
        <div className={`p-3 rounded-2xl ${isActive ? 'bg-primary text-white' : 'bg-gray-100'}`}>
          <Package size={26} strokeWidth={2.5} />
        </div>
        <span className="text-[9px] font-black mt-1">الصناديق</span>
      </NavLink>

      <NavLink 
        to="/draws" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}
      >
        <Trophy size={22} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[9px] font-bold">السحوبات</span>
      </NavLink>

      <NavLink 
        to="/profile" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}
      >
        <User size={22} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[9px] font-bold">حسابي</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
