export const ENTER_CARD_EVENT = 'points-guide-enter-card';
export const REFERRAL_CARDS_EVENT = 'points-guide-referral-cards';

export function dispatchAfterGuideClose(eventName) {
  window.requestAnimationFrame(() => {
    window.dispatchEvent(new CustomEvent(eventName));
  });
}
