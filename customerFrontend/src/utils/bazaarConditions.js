export const BAZAAR_CONDITIONS = [
  { value: 'new', label: 'جديد' },
  { value: 'like_new', label: 'مستعمل كالجديد' },
  { value: 'good', label: 'مستعمل بحالة جيدة' },
  { value: 'used', label: 'مستعمل' },
];

export const BAZAAR_CONDITION_VALUES = BAZAAR_CONDITIONS.map((c) => c.value);

export const CONDITION_LABELS = Object.fromEntries(
  BAZAAR_CONDITIONS.map((c) => [c.value, c.label])
);

export const getConditionStyle = (condition) => {
  switch (condition) {
    case 'new':
      return { bg: 'bg-emerald-500', text: 'text-white', soft: 'text-emerald-700 bg-emerald-50' };
    case 'like_new':
      return { bg: 'bg-teal-500', text: 'text-white', soft: 'text-teal-700 bg-teal-50' };
    case 'good':
      return { bg: 'bg-amber-500', text: 'text-white', soft: 'text-amber-700 bg-amber-50' };
    default:
      return { bg: 'bg-orange-500', text: 'text-white', soft: 'text-orange-700 bg-orange-50' };
  }
};
