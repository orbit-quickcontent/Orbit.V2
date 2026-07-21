import { UserRole } from "./types";

export const securityService = {
  /**
   * Check if a given user role has access to specific routes/actions
   */
  hasRoleAccess: (currentRole: UserRole, allowedRoles: UserRole[]): boolean => {
    return allowedRoles.includes(currentRole);
  },

  /**
   * Check if user permissions allow a specific operation
   */
  hasPermission: (userPermissions: string[], requiredPermission: string): boolean => {
    if (userPermissions.includes("*") || userPermissions.includes("admin:*")) {
      return true;
    }
    return userPermissions.includes(requiredPermission);
  }
};
export type { UserRole };
