import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ChevronLeft, LayoutGrid } from 'lucide-react';
import { ADMIN_NAV_GROUPS } from '../../config/adminNav';

export default function AdminQuickNav() {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(() =>
    Object.fromEntries(ADMIN_NAV_GROUPS.map((g) => [g.id, true]))
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ADMIN_NAV_GROUPS;

    return ADMIN_NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.name.toLowerCase().includes(q)
          || item.desc?.toLowerCase().includes(q)
          || group.title.toLowerCase().includes(q)
      ),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const toggleGroup = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="admin-card mb-8 overflow-hidden" dir="rtl">
      <div className="flex flex-col gap-4 border-b border-border-color/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/15 p-3 text-primary">
            <LayoutGrid size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">مركز الوصول السريع</h2>
            <p className="text-xs text-muted font-bold">انتقل لأي صفحة من مكان واحد — بدون البحث في القائمة</p>
          </div>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            className="admin-input w-full pr-9"
            placeholder="ابحث عن صفحة..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 space-y-6">
        {filteredGroups.length === 0 ? (
          <p className="py-8 text-center text-sm font-bold text-muted">لا توجد صفحات مطابقة</p>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.id}>
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="mb-3 flex w-full items-center justify-between rounded-xl px-2 py-1 text-right transition hover:bg-white/5"
              >
                <span
                  className="text-[11px] font-black uppercase tracking-wider"
                  style={{ color: group.color }}
                >
                  {group.title}
                </span>
                <ChevronLeft
                  size={16}
                  className={`text-muted transition-transform ${expanded[group.id] ? '-rotate-90' : ''}`}
                />
              </button>

              {expanded[group.id] && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path
                      || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`group flex items-start gap-3 rounded-2xl border p-3 transition-all duration-200 sm:p-4 ${
                          active
                            ? 'border-primary/50 bg-primary/10 shadow-lg shadow-primary/10'
                            : 'border-border-color/40 bg-dark/20 hover:border-primary/30 hover:bg-dark/40 hover:translate-x-[-2px]'
                        }`}
                      >
                        <div
                          className="shrink-0 rounded-xl p-2.5 transition group-hover:scale-105"
                          style={{ backgroundColor: `${group.color}20`, color: group.color }}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-black truncate ${active ? 'text-primary' : 'text-white'}`}>
                            {item.name}
                          </p>
                          {item.desc && (
                            <p className="mt-0.5 text-[11px] text-muted line-clamp-2">{item.desc}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
