import React from 'react';
import HierarchySelect from './HierarchySelect';

/** فلاتر تصنيفات — قوائم منسدلة هرمية */
export default function CategoryFilter({
  tree,
  pathIds,
  onPathChange,
  loading,
  error,
  onRetry,
  variant = 'dark',
}) {
  return (
    <HierarchySelect
      tree={tree}
      pathIds={pathIds}
      onPathChange={onPathChange}
      loading={loading}
      error={error}
      onRetry={onRetry}
      variant={variant}
      allowAllAtRoot
      firstPlaceholder="الكل — أي نوع"
      optionalPlaceholder="اختياري — تصنيف أدق"
    />
  );
}
