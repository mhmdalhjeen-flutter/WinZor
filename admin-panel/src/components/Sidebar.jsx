import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Ticket, 
  Settings, 
  LogOut, 
  Layers, 
  Trophy, 
  Activity 
} from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    const menuItems = [
        { name: 'نظرة عامة', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'إدارة المتاجر', icon: <Store size={20} />, path: '/stores' },
        { name: 'أكواد التفعيل', icon: <Ticket size={20} />, path: '/promo-codes' },
        { name: 'أنواع المتاجر', icon: <Layers size={20} />, path: '/categories' },
        { name: 'إدارة السحوبات', icon: <Trophy size={20} />, path: '/draws' },
        { name: 'سجل النشاطات', icon: <Activity size={20} />, path: '/activity' },
        { name: 'الإعدادات', icon: <Settings size={20} />, path: '/settings' },
    ];

    return (
        <div className="h-screen w-64 bg-gray-900 border-l border-gray-800 flex flex-col fixed right-0 top-0">
            <div className="p-6 flex items-center gap-3 border-b border-gray-800">
                <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-white font-bold text-xl">ع</span>
                </div>
                <h1 className="text-white font-bold text-xl">عروض تك</h1>
            </div>

            <nav className="flex-1 p-4 space-y-2 mt-4">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                            ${isActive 
                                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                        `}
                    >
                        {item.icon}
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200"
                >
                    <LogOut size={20} />
                    <span className="font-medium">تسجيل الخروج</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
