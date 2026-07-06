import React from 'react';
import { MapPin } from 'lucide-react';
import HierarchySelect from './HierarchySelect';

/**
 * مربّع اختيار منطقة هرمي — للنماذج (إضافة/تعديل إعلان).
 */
export default function RegionPickerBox({
  tree,
  pathIds,
  onPathChange,
  loading,
  error,
  onRetry,
  variant = 'light',
  hint = 'اختر المنطقة — كل مستوى يظهر بعد اختيار الذي قبله',
  requireFirstLevel = false,
}) {
  const boxClass = variant === 'dark'
    ? 'bg-white/5 border-white/10'
    : 'bg-gray-50 border-gray-100';

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${boxClass}`}>
      <h3 className={`text-sm font-black flex items-center gap-2 ${variant === 'dark' ? 'text-white/90' : 'text-gray-900'}`}>
        <MapPin size={16} className="text-primary shrink-0" /> المنطقة
      </h3>
      <HierarchySelect
        tree={tree}
        pathIds={pathIds}
        onPathChange={onPathChange}
        loading={loading}
        error={error}
        onRetry={onRetry}
        variant={variant}
        allowAllAtRoot={!requireFirstLevel}
        firstPlaceholder={requireFirstLevel ? 'اختر المنطقة...' : 'الكل — أي منطقة'}
        optionalPlaceholder="اختياري — منطقة أدق"
      />
      {hint && (
        <p className={`text-[10px] font-bold ${variant === 'dark' ? 'text-white/50' : 'text-gray-400'}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
