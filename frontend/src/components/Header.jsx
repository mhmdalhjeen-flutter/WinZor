import React from 'react';
import { Bell, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-6 py-4 flex justify-between items-center max-w-md mx-auto">
      <div className="flex items-center gap-2" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-white font-black text-xl">ع</span>
        </div>
        <div>
          <h1 className="text-lg font-black text-gray-900 leading-none">عروض تك</h1>
          <p className="text-[10px] text-primary font-bold tracking-widest">OFFERS TECH</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* زر صناديق الكنز - يوجه للصفحة الجديدة المدهشة */}
        <button 
          onClick={() => navigate('/chests')}
          className="relative group active:scale-90 transition-transform"
        >
          <div className="animate-bounce bg-yellow-400 p-2 rounded-xl shadow-lg shadow-yellow-200 hover:bg-yellow-500 transition-colors">
            <Gift className="text-white" size={24} />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
          </span>
        </button>

        <button className="p-2 text-gray-400 hover:text-primary transition-colors">
          <Bell size={24} />
        </button>
      </div>
    </header>
  );
};

export default Header;
