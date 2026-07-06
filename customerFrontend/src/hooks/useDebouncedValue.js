import { useEffect, useState } from 'react';

/** يؤخّر تحديث القيمة لتقليل استعلامات البحث/إعادة الفلترة */
export function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebouncedValue;
