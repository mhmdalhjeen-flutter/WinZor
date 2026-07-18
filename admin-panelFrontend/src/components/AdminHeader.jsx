import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, Bell, MessageCircle, LogOut, Menu, X } from 'lucide-react';
import useAdminChatUnread from '../hooks/useAdminChatUnread';
import { adminLogout } from '../utils/adminLogout';
import { BRAND_LOGO_64, BRAND_NAME, BRAND_TAGLINE } from '../utils/brandAssets';

import '../style/adminHeader.css';

function BadgeCount({ count, pulse = false }) {
  if (!count || count <= 0) return null;
  return (
    <span className={`notification-badge${pulse ? ' notification-badge--dot' : ''}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

const AdminHeader = ({ menuOpen, onToggleMenu }) => {
  const navigate = useNavigate();
  const { count: chatUnread } = useAdminChatUnread();
  const hasAlerts = true;

  const handleLogout = () => {
    if (window.confirm('هل تريد تسجيل الخروج؟')) {
      adminLogout(navigate);
    }
  };

  return (
    <header className="main-admin-navbar" dir="rtl">
      <div className="admin-header-container">
        <div className="brand-section">
          <button
            type="button"
            className="admin-menu-toggle"
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={menuOpen}
            onClick={onToggleMenu}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="brand-logo">
            <img src={BRAND_LOGO_64} alt={BRAND_NAME} width={45} height={45} />
          </div>

          <div className="brand-texts">
            <h1 className="brand-title">{BRAND_NAME}</h1>
            <p className="brand-subtitle">{BRAND_TAGLINE}</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="action-btn notification-btn"
            title="التنبيهات"
            aria-label="التنبيهات"
          >
            <Bell size={20} />
            <BadgeCount count={hasAlerts ? 1 : 0} pulse={hasAlerts && !chatUnread} />
          </button>

          <NavLink
            to="/chats"
            className={({ isActive }) =>
              `action-btn chat-header-btn${isActive ? ' is-active' : ''}`
            }
            title="مركز التواصل"
            aria-label="مركز التواصل"
          >
            <MessageCircle size={20} />
            <BadgeCount count={chatUnread} />
          </NavLink>

          <div className="profile-card">
            <div className="profile-info">
              <p className="profile-name">أدمن النظام</p>
              <p className="profile-role">Administrator</p>
            </div>
            <div className="profile-avatar">
              <User size={20} />
            </div>
          </div>

          <button
            type="button"
            className="action-btn logout-btn"
            onClick={handleLogout}
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="header-status-bar">
        <div className="status-left">
          <span className="status-indicator" />
          <span className="status-text">النظام يعمل بكفاءة</span>
          <span className="last-login">
            آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
          </span>
        </div>
        <div className="status-right">Offers-Tech v6.0.1</div>
      </div>
    </header>
  );
};

export default AdminHeader;
