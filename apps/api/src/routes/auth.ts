import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto, { randomUUID } from 'crypto';
import { prisma } from '../db.js';
import { AppError } from '../middlewares/error.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, requireAuth } from '../middlewares/auth.js';

export const authRouter = Router();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isSecure = process.env.COOKIE_SECURE === 'true';

  res.cookie('ekraf_at', accessToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie('ekraf_rt', refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookies(res: Response) {
  const isSecure = process.env.COOKIE_SECURE === 'true';
  res.clearCookie('ekraf_at', { httpOnly: true, secure: isSecure, sameSite: 'lax' });
  res.clearCookie('ekraf_rt', { httpOnly: true, secure: isSecure, sameSite: 'lax', path: '/api/v1/auth' });
}

// POST /register
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, displayName } = req.body;

    // Reject unknown properties (like role) -> 422
    if ('role' in req.body) {
      throw new AppError({
        code: 'VALIDATION_FAILED',
        message: 'Field "role" tidak diizinkan pada pendaftaran publik.',
        status: 422,
      });
    }

    if (!email || !password || !displayName) {
      throw new AppError({
        code: 'VALIDATION_FAILED',
        message: 'Email, kata sandi, dan nama lengkap wajib diisi.',
        status: 422,
      });
    }

    if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
      throw new AppError({
        code: 'VALIDATION_FAILED',
        message: 'Kata sandi harus terdiri dari 10 hingga 128 karakter.',
        status: 422,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new AppError({
        code: 'CONFLICT',
        message: 'Alamat email sudah terdaftar dalam sistem.',
        status: 409,
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const familyId = randomUUID();

    // Atomic transaction for User + UserProfile + initial AuthSession
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: 'USER',
          profile: {
            create: {
              displayName: displayName.trim(),
            },
          },
        },
        include: {
          profile: true,
        },
      });

      const tempId = randomUUID();
      const rawRefreshToken = randomUUID() + '.' + Date.now();
      const tokenHash = hashToken(rawRefreshToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const session = await tx.authSession.create({
        data: {
          id: tempId,
          userId: user.id,
          familyId,
          refreshTokenHash: tokenHash,
          expiresAt,
          userAgent: req.headers['user-agent'],
        },
      });

      const accessToken = signAccessToken({ userId: user.id, role: user.role });
      const refreshToken = signRefreshToken({ userId: user.id, sessionId: session.id, familyId });

      return { user, accessToken, refreshToken };
    });

    setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.status(201).json({
      data: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        profile: result.user.profile,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError({
        code: 'VALIDATION_FAILED',
        message: 'Email dan kata sandi wajib diisi.',
        status: 422,
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    // Timing attack defense with dummy hash
    const dummyHash = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';
    const hashToCompare = user ? user.passwordHash : dummyHash;
    const isValid = await bcrypt.compare(String(password), hashToCompare);

    if (!user || !isValid || !user.isActive) {
      throw new AppError({
        code: 'UNAUTHENTICATED',
        message: 'Email atau kata sandi tidak valid.',
        status: 401,
      });
    }

    // Create new AuthSession
    const familyId = randomUUID();
    const sessionId = randomUUID();
    const rawRefreshToken = randomUUID() + '.' + Date.now();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        familyId,
        refreshTokenHash: tokenHash,
        expiresAt,
        userAgent: req.headers['user-agent'],
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, sessionId, familyId });

    setAuthCookies(res, accessToken, refreshToken);

    return res.json({
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /refresh
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawToken = req.cookies?.ekraf_rt;
    if (!rawToken) {
      throw new AppError({
        code: 'UNAUTHENTICATED',
        message: 'Token refresh tidak ditemukan.',
        status: 401,
      });
    }

    let payload: { userId: string; sessionId: string; familyId: string };
    try {
      payload = verifyRefreshToken(rawToken);
    } catch {
      throw new AppError({
        code: 'UNAUTHENTICATED',
        message: 'Token refresh tidak valid atau kedaluwarsa.',
        status: 401,
      });
    }

    const session = await prisma.authSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) {
      throw new AppError({
        code: 'UNAUTHENTICATED',
        message: 'Sesi tidak ditemukan.',
        status: 401,
      });
    }

    // Reuse detection: If session was already revoked or replaced, revoke entire family
    if (session.revokedAt || session.replacedBySessionId) {
      await prisma.authSession.updateMany({
        where: { familyId: payload.familyId },
        data: { revokedAt: new Date() },
      });
      clearAuthCookies(res);
      throw new AppError({
        code: 'UNAUTHENTICATED',
        message: 'Deteksi penggunaan token berulang. Seluruh sesi telah dicabut demi keamanan.',
        status: 401,
      });
    }

    // Normal rotation: create new session and mark old session replaced
    const newSessionId = randomUUID();
    const newRawRefreshToken = randomUUID() + '.' + Date.now();
    const newHash = hashToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.authSession.update({
        where: { id: session.id },
        data: {
          revokedAt: new Date(),
          replacedBySessionId: newSessionId,
        },
      }),
      prisma.authSession.create({
        data: {
          id: newSessionId,
          userId: payload.userId,
          familyId: payload.familyId,
          refreshTokenHash: newHash,
          expiresAt,
          userAgent: req.headers['user-agent'],
        },
      }),
    ]);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { profile: true },
    });

    if (!user || !user.isActive) {
      throw new AppError({
        code: 'UNAUTHENTICATED',
        message: 'Pengguna dinonaktifkan.',
        status: 401,
      });
    }

    const newAccessToken = signAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = signRefreshToken({ userId: user.id, sessionId: newSessionId, familyId: payload.familyId });

    setAuthCookies(res, newAccessToken, newRefreshToken);

    return res.json({
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /logout
authRouter.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawToken = req.cookies?.ekraf_rt;
    if (rawToken) {
      try {
        const payload = verifyRefreshToken(rawToken);
        await prisma.authSession.updateMany({
          where: { id: payload.sessionId },
          data: { revokedAt: new Date() },
        });
      } catch {
        // Idempotent: ignore decode error
      }
    }
    clearAuthCookies(res);
    return res.json({
      data: {
        message: 'Berhasil keluar (logout).',
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /me
authRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.json({ data: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: {
          include: {
            interests: {
              include: { category: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.json({ data: null });
    }

    return res.json({
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (err) {
    next(err);
  }
});
