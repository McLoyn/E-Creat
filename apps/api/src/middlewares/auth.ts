import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { AppError } from './error.js';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'ekraf_access_secret_super_secure_key_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'ekraf_refresh_secret_super_secure_key_67890';

export interface TokenPayload {
  userId: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(payload: { userId: string; sessionId: string; familyId: string }): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): { userId: string; sessionId: string; familyId: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string; sessionId: string; familyId: string };
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        isActive: boolean;
      };
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.ekraf_at;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch (err) {
    // Expired or invalid token, continue without user
    next();
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw new AppError({
      code: 'UNAUTHENTICATED',
      message: 'Akses memerlukan autentikasi login.',
      status: 401,
    });
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw new AppError({
      code: 'UNAUTHENTICATED',
      message: 'Akses memerlukan autentikasi login.',
      status: 401,
    });
  }
  if (req.user.role !== 'ADMIN') {
    throw new AppError({
      code: 'FORBIDDEN',
      message: 'Akses ditolak. Endpoint hanya diperuntukkan bagi Administrator.',
      status: 403,
    });
  }
  next();
}
