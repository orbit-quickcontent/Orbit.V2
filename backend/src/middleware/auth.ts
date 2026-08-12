import { Request, Response, NextFunction } from "express";
import { verifyToken, UserRole, normalizeRole, JWTPayload } from "../lib/security-auth";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

/**
 * Authentication and Role-Based Access Control (RBAC) Middleware.
 *
 * @param allowedRoles Single role or array of allowed roles. If omitted, any valid authenticated user is allowed.
 */
export function requireAuth(allowedRoles?: UserRole | UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentication token required" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const payload: JWTPayload | null = verifyToken(token);

    if (!payload) {
      res.status(401).json({ error: "Invalid or expired authentication token" });
      return;
    }

    const userRole = normalizeRole(payload.role);
    const user: AuthenticatedUser = {
      id: payload.id,
      email: payload.email,
      role: userRole,
      name: payload.name,
    };

    req.user = user;

    if (allowedRoles) {
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // SUPER_ADMIN override: super admins can access any role-protected route
      const isSuperAdmin = userRole === "SUPER_ADMIN";
      const isAllowed = isSuperAdmin || rolesArray.includes(userRole);

      if (!isAllowed) {
        res.status(403).json({
          error: "Forbidden: insufficient permissions for this operation",
          requiredRole: rolesArray,
          userRole: userRole,
        });
        return;
      }
    }

    next();
  };
}
