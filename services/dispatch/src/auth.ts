import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { UserJwtPayload, UserRole } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'orbit_super_secret_jwt_key_2026_production_ready';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'orbit_super_secret_refresh_jwt_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: UserJwtPayload;
}

export interface AuthenticatedSocket extends Socket {
  user?: UserJwtPayload;
}

export function generateAccessToken(payload: Omit<UserJwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function generateRefreshToken(payload: Omit<UserJwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyAccessToken(token: string): UserJwtPayload {
  return jwt.verify(token, JWT_SECRET) as UserJwtPayload;
}

export function verifyRefreshToken(token: string): UserJwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as UserJwtPayload;
}

export function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
  }
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated user' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions for this resource' });
    }
    next();
  };
}

export function socketAuthMiddleware(socket: AuthenticatedSocket, next: (err?: Error) => void) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }

    const decoded = verifyAccessToken(token as string);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid or expired token'));
  }
}
