import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Store, Ticket, Settings, LogOut, 
  Layers, Trophy, Activity, Users, ShieldAlert, 
  Gift, Award, CreditCard, Package
} from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    const navGroups = [
        {
            title: "الرئيسية",
            items: [
                { name: 'نظرة عامة', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
                { name: 'إدارة المستخدمين', icon: <Users size={20} />, path: '/users' },
            ]
        },
        {
            title: "المتاجر والعروض",
            items: [
                { name: 'إدارة المتاجر', icon: <Store size={20} />, path: '/stores' },
                { name: 'تصنيفات المتاجر', icon: <Layers size={20} />, path: '/categories' },
                { name: 'توليد الأكواد', icon: <Ticket size={20} />, path: '/promo-codes' },
            ]
        },
        {
            title: "المكافآت والفعاليات",
            items: [
                { name: 'صناديق الكنز', icon: <Package size={20} />, path: '/boxes' },
                { name: 'إدارة البطاقات', icon: <CreditCard size={20} />, path: '/cards' },
                { name: 'جوائز الصندوق', icon: <Gift size={20} />, path: '/prizes' },
                { name: 'إدارة الفعاليات', icon: <Trophy size={20} />, path: '/draws' },
                { name: 'لوحة الشرف', icon: <Award size={20} />, path: '/honor' },
            ]
        },
        {
            title: "الأمان والنظام",
            items: [
                { name: 'سجل النشاطات', icon: <Activity size={20} />, path: '/activity' },
                { name: 'سجل الأمان', icon: <ShieldAlert size={20} />, path: '/security' },
                { name: 'إعدادات المنصة', icon: <Settings size={20} />, path: '/settings' },
            ]
        }
    ];

    return (
        /* 
           - top-[105px]: ليبدأ السايد بار من تحت الهيدر.
           - h-[calc(100vh-105px)]: ليكون ارتفاعه مناسباً للمساحة المتبقية.
           - z-40: ليكون تحت الهيدر (z-9999).
        */
        <div className="w-64 bg-card border-l border-border-color/50 flex flex-col fixed right-0 top-[105px] h-[calc(100vh-105px)] z-40">
            
            {/* تم إزالة قسم الشعار من هنا لعدم التكرار مع الهيدر */}

            {/* Navigation Section */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
                {navGroups.map((group, idx) => (
                    <div key={idx} className="space-y-2">
                        <h3 className="text-[11px] font-bold text-muted/60 uppercase tracking-[2px] px-4 mb-3">
                            {group.title}
                        </h3>
                        {group.items.map((item) => (
                            <NavLink
                                key={item.path}
                                title={item.name}
                                to={item.path}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                                    ${isActive 
                                        ? 'bg-primary text-white shadow-xl shadow-primary/20 font-bold translate-x-[-4px]' 
                                        : 'text-muted hover:bg-dark/50 hover:text-white'}
                                `}
                            >
                                <span className="transition-transform group-hover:scale-110">
                                    {item.icon}
                                </span>
                                <span className="text-[13px]">{item.name}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-border-color/30 bg-dark/20">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-danger/80 hover:text-danger hover:bg-danger/10 rounded-xl transition-all duration-300 font-bold text-sm group"
                >
                    <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                    <span>خروج من النظام</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
