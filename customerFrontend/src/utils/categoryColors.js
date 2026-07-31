/** Distinct palette for offer category badges — keyed by normalized name or stable hash. */
const CATEGORY_PALETTE = [
  { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', accent: '#f59e0b' }, // amber — ذهب
  { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4', accent: '#ec4899' }, // pink — ملابس
  { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', accent: '#3b82f6' }, // blue
  { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7', accent: '#10b981' }, // emerald
  { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd', accent: '#8b5cf6' }, // violet
  { bg: '#ffedd5', text: '#9a3412', border: '#fdba74', accent: '#f97316' }, // orange
  { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc', accent: '#6366f1' }, // indigo
  { bg: '#ccfbf1', text: '#115e59', border: '#5eead4', accent: '#14b8a6' }, // teal
  { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', accent: '#ef4444' }, // red
  { bg: '#ecfccb', text: '#3f6212', border: '#bef264', accent: '#84cc16' }, // lime
];

const NAMED_OVERRIDES = {
  'ذهب': 0,
  'ذهب ومجوهرات': 0,
  'مجوهرات': 0,
  'ملابس': 1,
  'أحذية': 2,
  'إلكترونيات': 3,
  'مطاعم': 4,
  'مأكولات': 4,
  'صحة': 5,
  'جمال': 6,
  'عطور': 6,
  'منزل': 7,
  'أثاث': 7,
  'رياضة': 8,
  'ألعاب': 9,
};

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns color tokens for a category badge.
 * @param {string} categoryName
 * @param {string} [categoryId]
 */
export function getCategoryColors(categoryName, categoryId) {
  const normalized = (categoryName || '').trim();
  const lower = normalized.toLowerCase();

  for (const [key, idx] of Object.entries(NAMED_OVERRIDES)) {
    if (lower.includes(key.toLowerCase())) {
      return CATEGORY_PALETTE[idx];
    }
  }

  const seed = categoryId || normalized || 'default';
  const idx = hashString(String(seed)) % CATEGORY_PALETTE.length;
  return CATEGORY_PALETTE[idx];
}
