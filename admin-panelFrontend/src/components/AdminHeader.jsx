import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    User,
    Search,
    LayoutDashboard,
    Store,
    Ticket,
    LogOut,
    Activity,
    ShieldCheck,
    Users,
} from 'lucide-react';
import useAdminChatUnread from '../hooks/useAdminChatUnread';
import { adminLogout } from '../utils/adminLogout';
import AdminHeaderAlerts from './AdminHeaderAlerts';
import { BRAND_LOGO_64, BRAND_NAME, BRAND_TAGLINE } from '../utils/brandAssets';

import '../style/adminHeader.css';

const AdminHeader = () => {
    const [hasAlerts] = useState(true);
    const navigate = useNavigate();
    const { count: chatUnread } = useAdminChatUnread();

    const handleLogout = () => {
    if (window.confirm("هل تريد تسجيل الخروج؟")) {
        adminLogout(navigate);
    }
};

    const navItems = [
        { name: 'الرئيسية', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { name: 'المستخدمين', path: '/users', icon: <Users size={18} /> },
        { name: 'المتاجر', path: '/stores', icon: <Store size={18} /> },
        { name: 'الأكواد', path: '/promo-codes', icon: <Ticket size={18} /> },
        { name: 'الإعدادات', path: '/settings', icon: <ShieldCheck size={18} /> },
        { name: 'السجلات', path: '/activity', icon: <Activity size={18} /> },
    ];

    return (
        <header className="main-admin-navbar" dir="rtl">
            <div className="admin-header-container">

                {/* الشعار */}
                <div className="brand-section">
                    <div className="brand-logo">
                        <img src={BRAND_LOGO_64} alt={BRAND_NAME} width={45} height={45} />
                    </div>

                    <div className="brand-texts">
                        <h1 className="brand-title">{BRAND_NAME}</h1>
                        <p className="brand-subtitle">{BRAND_TAGLINE}</p>
                    </div>
                </div>

                {/* التنقل */}
                <nav className="admin-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                isActive ? 'nav-item active' : 'nav-item'
                            }
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* الإجراءات */}
                <div className="header-actions">

                    {/* البحث */}
                    <div className="search-wrapper">
                        <Search className="search-icon" size={18} />

                        <input
                            type="text"
                            className="search-input"
                            placeholder="بحث سريع..."
                        />
                    </div>

                    <AdminHeaderAlerts chatUnread={chatUnread} hasAlerts={hasAlerts} />

                    {/* الحساب */}
                    <div className="profile-card">
                        <div className="profile-info">
                            <p className="profile-name">
                                أدمن النظام
                            </p>

                            <p className="profile-role">
                                Administrator
                            </p>
                        </div>

                        <div className="profile-avatar">
                            <User size={20} />
                        </div>
                    </div>

                    {/* تسجيل الخروج */}
                    <button
                        className="action-btn logout-btn"
                        onClick={handleLogout}
                        title="تسجيل الخروج"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* الشريط السفلي */}
            <div className="header-status-bar">
                <div className="status-left">
                    <span className="status-indicator"></span>

                    <span className="status-text">
                        النظام يعمل بكفاءة
                    </span>

                    <span className="last-login">
                        آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
                    </span>
                </div>

                <div className="status-right">
                    Offers-Tech v6.0.1
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
