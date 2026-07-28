/** Shared motion presets for bottom sheets and modals. */
export const overlayFade = { duration: 0.12, ease: 'easeOut' };

export const sheetSpring = {
  type: 'spring',
  stiffness: 520,
  damping: 34,
  mass: 0.65,
};

export const modalSpring = {
  type: 'spring',
  stiffness: 480,
  damping: 32,
  mass: 0.7,
};
