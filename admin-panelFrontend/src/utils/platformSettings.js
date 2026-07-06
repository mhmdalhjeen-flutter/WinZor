export const SETTING_KEYS = {
  referralPoints: 'referral_reward_points',
  referralEnabled: 'referral_program_enabled',
  storeCompetitions: 'store_competitions_enabled',
  marketplace: 'marketplace_enabled',
  draws: 'draws_enabled',
  wheelEnabled: 'wheel_enabled',
  wheelSpinCost: 'wheel_spin_cost',
  wheelSpinInterval: 'wheel_spin_interval_ms',
  wheelPlacements: 'wheel_placements',
  storeOwnerCart: 'store_owner_cart_enabled',
  storeOwnerCompetitions: 'store_owner_competitions_enabled',
  storeOwnerMemberPrizes: 'store_owner_member_prizes_enabled',
  storeOwnerWarehouses: 'store_owner_warehouses_enabled',
  maintenanceMode: 'maintenance_mode_enabled',
};

export function parseSettingsList(list = []) {
  const map = Object.fromEntries(list.map((s) => [s.key, s.value]));
  const maintenance = map[SETTING_KEYS.maintenanceMode] || {};
  return {
    maintenanceEnabled: maintenance.enabled === true,
    maintenanceMessage:
      maintenance.message ||
      'الموقع تحت الصيانة حالياً. نعمل على تحسين تجربتكم ونعود قريباً.',
    referralPoints: map[SETTING_KEYS.referralPoints]?.points ?? 3,
    referralEnabled: map[SETTING_KEYS.referralEnabled]?.enabled !== false,
    storeCompetitions: map[SETTING_KEYS.storeCompetitions]?.enabled !== false,
    marketplace: map[SETTING_KEYS.marketplace]?.enabled !== false,
    draws: map[SETTING_KEYS.draws]?.enabled !== false,
    wheelEnabled: map[SETTING_KEYS.wheelEnabled]?.enabled !== false,
    wheelSpinCost: map[SETTING_KEYS.wheelSpinCost]?.cost ?? 5,
    wheelSpinInterval: map[SETTING_KEYS.wheelSpinInterval]?.ms ?? 3000,
    wheelPlacements: {
      header: map[SETTING_KEYS.wheelPlacements]?.header !== false,
      userCenter: map[SETTING_KEYS.wheelPlacements]?.userCenter !== false,
      inventory: map[SETTING_KEYS.wheelPlacements]?.inventory !== false,
    },
    storeOwnerPages: {
      cart: map[SETTING_KEYS.storeOwnerCart]?.enabled !== false,
      competitions: map[SETTING_KEYS.storeOwnerCompetitions]?.enabled !== false,
      memberPrizes: map[SETTING_KEYS.storeOwnerMemberPrizes]?.enabled !== false,
      warehouses: map[SETTING_KEYS.storeOwnerWarehouses]?.enabled !== false,
    },
  };
}
