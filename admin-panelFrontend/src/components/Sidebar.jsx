import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { ADMIN_NAV_GROUPS } from '../config/adminNav';
import useAdminChatUnread from '../hooks/useAdminChatUnread';
import { adminLogout } from '../utils/adminLogout';
import { usePwaInstall } from '../context/PwaInstallContext';
import { BRAND_LOGO_64, BRAND_NAME, BRAND_TAGLINE } from '../utils/brandAssets';

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { count: chatUnread } = useAdminChatUnread();
  const { canInstall, openInstallCard } = usePwaInstall();

  const handleLogout = () => {
    onClose?.();
    adminLogout(navigate);
  };

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <>
      {open && (
        <button
          type="button"
          className="admin-sidebar-backdrop lg:hidden"
          aria-label="إغلاق القائمة"
          onClick={onClose}
        />
      )}

      <aside className={`admin-sidebar${open ? ' admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar-brand">
          <img src={BRAND_LOGO_64} alt={BRAND_NAME} width={48} height={48} className="admin-sidebar-brand__logo" />
          <div>
            <p className="admin-sidebar-brand__title">{BRAND_NAME}</p>
            <p className="admin-sidebar-brand__tagline">{BRAND_TAGLINE}</p>
          </div>
        </div>

        <nav className="admin-sidebar-nav custom-scrollbar">
          <NavLink
            to="/dashboard"
            end
            onClick={handleNavClick}
            className={({ isActive }) => `
              admin-sidebar-link admin-sidebar-link--home
              ${isActive
                ? 'admin-sidebar-link--active'
                : 'admin-sidebar-link--idle'}
            `}
          >
            <span className="text-lg">🏠</span>
            <span className="text-[13px]">الرئيسية — Dashboard</span>
          </NavLink>

          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.id} className="admin-sidebar-group">
              <h3
                className="admin-sidebar-group__title"
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
                    onClick={handleNavClick}
                    className={({ isActive }) => `
                      admin-sidebar-link group
                      ${isActive ? 'admin-sidebar-link--active' : 'admin-sidebar-link--idle'}
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

        <div className="admin-sidebar-footer">
          {canInstall && (
            <button
              type="button"
              onClick={() => {
                onClose?.();
                openInstallCard();
              }}
              className="admin-sidebar-install"
            >
              📲 <span>تثبيت التطبيق</span>
            </button>
          )}

          <button type="button" onClick={handleLogout} className="admin-sidebar-logout">
            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            <span>خروج من النظام</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
