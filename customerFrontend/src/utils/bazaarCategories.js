export const BAZAAR_CATEGORIES = [
  { value: 'cars', label: 'سيارات' },
  { value: 'bikes', label: 'دراجات' },
  { value: 'phones', label: 'هواتف' },
  { value: 'tablets', label: 'أجهزة لوحية' },
  { value: 'computers', label: 'حاسوب' },
  { value: 'electronics', label: 'إلكترونيات' },
  { value: 'home_appliances', label: 'أجهزة منزلية' },
  { value: 'furniture', label: 'أثاث' },
  { value: 'furnishings', label: 'مفروشات' },
  { value: 'real_estate', label: 'عقارات' },
  { value: 'land', label: 'أراضٍ' },
  { value: 'clothing', label: 'ملابس' },
  { value: 'shoes', label: 'أحذية' },
  { value: 'bags', label: 'حقائب' },
  { value: 'watches', label: 'ساعات' },
  { value: 'jewelry', label: 'ذهب ومجوهرات' },
  { value: 'kids_toys', label: 'ألعاب أطفال' },
  { value: 'kids_supplies', label: 'مستلزمات أطفال' },
  { value: 'sports', label: 'معدات رياضية' },
  { value: 'professional', label: 'معدات مهنية' },
  { value: 'animals', label: 'حيوانات' },
  { value: 'books', label: 'كتب' },
  { value: 'collectibles', label: 'مقتنيات' },
  { value: 'building_materials', label: 'مواد بناء' },
  { value: 'garden', label: 'حدائق وزراعة' },
  { value: 'other', label: 'أخرى' },
];

export const BAZAAR_CATEGORY_VALUES = BAZAAR_CATEGORIES.map((c) => c.value);

export const getCategoryLabel = (value) =>
  BAZAAR_CATEGORIES.find((c) => c.value === value)?.label || value || '—';
