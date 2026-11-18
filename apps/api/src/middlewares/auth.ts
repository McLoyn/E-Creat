import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { AppError } from './error.js';
import { envConfig } from '../utils/env.js';

export interface TokenPayload {
  userId: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  familyId: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, envConfig.jwtAccessSecret, {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, envConfig.jwtRefreshSecret, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, envConfig.jwtAccessSecret, {
    algorithms: ['HS256'],
  }) as TokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, envConfig.jwtRefreshSecret, {
    algorithms: ['HS256'],
  }) as RefreshTokenPayload;
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
  } catch (_err) {
    // Expired or invalid token: continue as guest
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
