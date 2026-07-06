import React from 'react';
import { buildHierarchyRows, setHierarchyPath, pathToLabels } from '../utils/hierarchyTree';

const styles = {
  dark: {
    select: 'w-full border border-white/10 bg-white/10 text-white rounded-xl py-2.5 px-3 text-sm font-bold outline-none focus:border-primary/50 appearance-none',
    hint: 'text-white/50',
    path: 'text-primary-light bg-white/5',
    error: 'bg-red-500/10 border-red-500/20 text-red-200',
    retry: 'text-white bg-red-500/30',
  },
  light: {
    select: 'w-full border border-gray-200 bg-gray-50 text-gray-900 rounded-xl py-2.5 px-3 text-sm font-bold outline-none focus:border-primary/30 appearance-none',
    hint: 'text-gray-400',
    path: 'text-primary bg-primary/5',
    error: 'bg-red-50 border-red-100 text-red-600',
    retry: 'text-red-700 bg-red-100',
  },
};

/**
 * قوائم منسدلة هرمية — تُبنى ديناميكياً من شجرة الأدمن.
 * للبحث: المستوى الأول يمكن أن يكون «الكل»؛ المستويات التالية اختيارية.
 */
export default function HierarchySelect({
  tree,
  pathIds = [],
  onPathChange,
  loading = false,
  error = null,
  onRetry,
  variant = 'light',
  allowAllAtRoot = true,
  firstPlaceholder = 'الكل',
  optionalPlaceholder = 'اختياري — مستوى أدق',
  showPath = true,
  className = '',
}) {
  const s = styles[variant] || styles.light;
  const rows = buildHierarchyRows(tree, pathIds);
  const labels = pathToLabels(tree, pathIds);

  const handleSelect = (level, value) => {
    if (level === 0 && !value && allowAllAtRoot) {
      onPathChange([]);
      return;
    }
    onPathChange(setHierarchyPath(pathIds, level, value || null));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={`h-10 rounded-xl animate-pulse ${variant === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${s.error}`}>
          <span>تعذّر التحميل</span>
          {onRetry && (
            <button type="button" onClick={onRetry} className={`px-2 py-1 rounded-lg font-black ${s.retry}`}>
              إعادة
            </button>
          )}
        </div>
      )}

      {!loading && !error && !tree?.length && (
        <p className={`text-xs font-bold ${s.hint}`}>لا توجد خيارات متاحة</p>
      )}

      {!loading && !error && rows.map((row) => (
        <select
          key={row.level}
          className={s.select}
          value={row.selectedId || ''}
          onChange={(e) => handleSelect(row.level, e.target.value)}
        >
          <option value="">
            {row.level === 0 && allowAllAtRoot ? firstPlaceholder : optionalPlaceholder}
          </option>
          {row.items.map((item) => (
            <option key={item._id} value={item._id}>
              {item.icon ? `${item.icon} ` : ''}{item.name}
            </option>
          ))}
        </select>
      ))}

      {showPath && labels.length > 0 && (
        <p className={`text-[10px] font-bold px-2 py-1.5 rounded-lg ${s.path}`}>
          المسار: {labels.join(' › ')}
        </p>
      )}
    </div>
  );
}
