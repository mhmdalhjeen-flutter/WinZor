import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { ADMIN_NAV_GROUPS } from '../config/adminNav';
import useAdminChatUnread from '../hooks/useAdminChatUnread';
import { adminLogout } from '../utils/adminLogout';

const Sidebar = () => {
    const navigate = useNavigate();
    const { count: chatUnread } = useAdminChatUnread();

    const handleLogout = () => {
        adminLogout(navigate);
    };

    return (
        <div className="w-64 bg-card border-l border-border-color/50 flex flex-col fixed right-0 top-[105px] h-[calc(100vh-105px)] z-40">
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
                <NavLink
                    to="/dashboard"
                    end
                    className={({ isActive }) => `
                        flex items-center gap-3 px-4 py-3 mb-2 rounded-xl transition-all duration-300
                        ${isActive
                            ? 'bg-primary/20 text-primary border border-primary/30 font-black'
                            : 'text-muted hover:bg-dark/50 hover:text-white border border-transparent'}
                    `}
                >
                    <span className="text-lg">🏠</span>
                    <span className="text-[13px]">الرئيسية — Dashboard</span>
                </NavLink>

                {ADMIN_NAV_GROUPS.map((group) => (
                    <div key={group.id} className="space-y-2">
                        <h3
                            className="text-[11px] font-bold uppercase tracking-[2px] px-4 mb-3"
                            style={{ color: `${group.color}99` }}
                        >
                            {group.title}
                        </h3>
                        {group.items.filter((item) => item.path !== '/dashboard').map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path}
                                    title={item.desc || item.name}
                                    to={item.path}
                                    end={item.path === '/dashboard'}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative
                                        ${isActive
                                            ? 'bg-primary text-white shadow-xl shadow-primary/20 font-bold translate-x-[-4px]'
                                            : 'text-muted hover:bg-dark/50 hover:text-white'}
                                    `}
                                >
                                    <span className="transition-transform group-hover:scale-110">
                                        <Icon size={20} />
                                    </span>
                                    <span className="text-[13px] flex-1">{item.name}</span>
                                    {item.path === '/chats' && chatUnread > 0 && (
                                        <span className="admin-nav-unread-pill">
                                            {chatUnread > 99 ? '99+' : chatUnread}
                                        </span>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-border-color/30 bg-dark/20">
                <button
                    type="button"
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
