import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, MessageCircle, LayoutDashboard } from 'lucide-react';

function BadgeCount({ count, pulse = false }) {
  if (!count || count <= 0) return null;
  return (
    <span className={`notification-badge${pulse ? ' notification-badge--dot' : ''}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function AdminHeaderAlerts({ chatUnread = 0, hasAlerts = false }) {
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () => [
      {
        key: 'chats',
        icon: MessageCircle,
        label: 'مركز التواصل',
        path: '/chats',
        count: chatUnread,
        isNav: true,
      },
      {
        key: 'alerts',
        icon: Bell,
        label: 'التنبيهات',
        path: null,
        count: hasAlerts ? 1 : 0,
        pulse: hasAlerts && !chatUnread,
        isNav: false,
      },
    ],
    [chatUnread, hasAlerts]
  );

  const totalCount = chatUnread + (hasAlerts ? 1 : 0);

  return (
    <div className={`admin-header-alerts${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="action-btn dashboard-alerts-toggle"
        title={open ? 'إخفاء لوحة التنبيهات' : 'عرض لوحة التنبيهات'}
        aria-label={open ? 'إخفاء لوحة التنبيهات' : 'عرض لوحة التنبيهات'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <LayoutDashboard size={20} />
        {!open && <BadgeCount count={totalCount} pulse={hasAlerts && !chatUnread} />}
      </button>

      {open && (
        <div className="admin-header-alerts__panel">
          {items.map(({ key, icon: Icon, label, path, count, pulse, isNav }) => {
            if (isNav) {
              return (
                <NavLink
                  key={key}
                  to={path}
                  className={({ isActive }) =>
                    `action-btn chat-header-btn ${isActive ? 'is-active' : ''}`
                  }
                  title={label}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={20} />
                  <BadgeCount count={count} />
                </NavLink>
              );
            }

            return (
              <button
                key={key}
                type="button"
                className="action-btn notification-btn"
                title={label}
                aria-label={label}
                onClick={() => setOpen(false)}
              >
                <Icon size={20} />
                <BadgeCount count={count} pulse={pulse} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
