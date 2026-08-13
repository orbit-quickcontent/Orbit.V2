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

export function requireAuth(allowedRoles?: UserRole | UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentication token required" });
      return;
    }

    const token = authHeader.slice(7).trim();
    const payload: JWTPayload | null = verifyToken(token);

    if (!payload || payload.type !== "access") {
      res.status(401).json({ error: "Invalid or expired access token" });
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
      const isSuperAdmin = userRole === "SUPER_ADMIN";
      if (!isSuperAdmin && !rolesArray.includes(userRole)) {
        res.status(403).json({
          error: "Forbidden: insufficient permissions for this operation",
          requiredRole: rolesArray,
          userRole,
        });
        return;
      }
    }

    next();
  };
}
