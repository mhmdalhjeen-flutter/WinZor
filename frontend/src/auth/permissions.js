export const PERMISSIONS = {
  customer: [
    "view_home",
    "follow_store",
    "view_wallet",
  ],

  store: [
    "view_dashboard",
    "manage_store",
    "create_offer",
  ],

  supplier: [
    "view_dashboard",
    "manage_supply",
  ],

  admin: [
    "all",
  ],
};

export const hasPermission = (role, permission) => {
  if (!role) return false;

  const rolePermissions = PERMISSIONS[role];

  if (!rolePermissions) return false;

  if (rolePermissions.includes("all")) return true;

  return rolePermissions.includes(permission);
};