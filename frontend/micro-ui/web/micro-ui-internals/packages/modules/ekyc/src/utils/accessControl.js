import { EKYC_PERMISSIONS, ROLE_PERMISSIONS } from "../config/accessControl";

export const getUserRoles = () => {
  const user = Digit.SessionStorage.get("User");

  return user?.info?.roles?.map((role) => role.code) || [];
};

export const hasRole = (role) => {
  return getUserRoles().includes(role);
};

export const getUserPermissions = () => {
  const roles = getUserRoles();
  
  return [
    ...new Set(
      roles.flatMap((role) => ROLE_PERMISSIONS[role] || [])
    ),
  ];
};

export const hasPermission = (permission) => {
  if (!permission) return false;

  const roles = getUserRoles();

  if (permission === EKYC_PERMISSIONS.APPLICATION_STATUS_VIEW) {
    return roles.includes("CITIZEN") &&
      !roles.some((role) =>
        ["EKYC_SURVEYOR", "EKYC_SUPERVISOR", "EKYC_VENDOR"].includes(role)
      );
  }

  return getUserPermissions().includes(permission);
};

export const hasAnyPermission = (permissions = []) => {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }

  return permissions.some((permission) => hasPermission(permission));
};

export const hasAllPermissions = (permissions = []) => {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }

  return permissions.every((permission) => hasPermission(permission));
};