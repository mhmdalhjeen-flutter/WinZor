import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Ticket, Trophy, User } from 'lucide-react';

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-3xl max-w-md mx-auto">
      <NavLink 
        to="/" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}
      >
        <Home size={24} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-bold">الرئيسية</span>
      </NavLink>

      <NavLink 
        to="/wallet" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}
      >
        <Ticket size={24} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-bold">محفظتي</span>
      </NavLink>

      <NavLink 
        to="/draws" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}
      >
        <Trophy size={24} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-bold">السحوبات</span>
      </NavLink>

      <NavLink 
        to="/profile" 
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}
      >
        <User size={24} strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-bold">حسابي</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
