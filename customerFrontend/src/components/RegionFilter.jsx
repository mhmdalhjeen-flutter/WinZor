import React from 'react';
import HierarchySelect from './HierarchySelect';

/** فلاتر مناطق — قوائم منسدلة هرمية (نفس منطق التسجيل) */
export default function RegionFilter(props) {
  return (
    <HierarchySelect
      {...props}
      allowAllAtRoot
      firstPlaceholder="الكل — أي منطقة"
      optionalPlaceholder="اختياري — منطقة أدق"
    />
  );
}
