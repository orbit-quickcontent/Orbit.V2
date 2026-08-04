import { UserRole } from "../admin/types";

export const securityService = {
  hasRoleAccess: (currentRole: UserRole, allowedRoles: UserRole[]): boolean => {
    return allowedRoles.includes(currentRole);
  },
  hasPermission: (userPermissions: string[], requiredPermission: string): boolean => {
    if (userPermissions.includes("*") || userPermissions.includes("client:*")) {
      return true;
    }
    return userPermissions.includes(requiredPermission);
  }
};
