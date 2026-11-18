import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto, { randomUUID } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db.js';
import { Prisma } from '@prisma/client';
import { AppError } from '../middlewares/error.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../middlewares/auth.js';
import { envConfig } from '../utils/env.js';

export const authRouter = Router();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('ekraf_at', accessToken, {
    httpOnly: true,
    secure: envConfig.cookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie('ekraf_rt', refreshToken, {
    httpOnly: true,
    secure: envConfig.cookieSecure,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('ekraf_at', {
    httpOnly: true,
    secure: envConfig.cookieSecure,
    sameSite: 'lax',
    path: '/',
  });
  res.clearCookie('ekraf_rt', {
    httpOnly: true,
    secure: envConfig.cookieSecure,
    sameSite: 'lax',
    path: '/api/v1/auth',
  });
}

async function createSessionAndSetCookies(
  res: Response,
  user: { id: string; role: string },
  userAgent?: string
) {
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
      userAgent,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, sessionId, familyId });

  setAuthCookies(res, accessToken, refreshToken);
  return { accessToken, refreshToken };
}

// POST /register
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, displayName } = req.body;

    // Strict protection: Reject unknown privilege fields
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

    const normalizedEmail = String(email).trim().toLowerCase();
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
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: 'USER',
          profile: {
            create: {
              displayName: String(displayName).trim(),
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

    await createSessionAndSetCookies(res, user, req.headers['user-agent']);

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

// GET /google/config
authRouter.get('/google/config', (_req: Request, res: Response) => {
  const clientId = envConfig.googleClientId || null;
  res.json({
    data: {
      clientId,
      isConfigured: Boolean(clientId),
    },
  });
});

// GET /google/url (AUTH-01, AUTH-02, AUTH-03)
authRouter.get('/google/url', (_req: Request, res: Response) => {
  const clientId = envConfig.googleClientId;
  const redirectUri = envConfig.googleRedirectUri;

  if (!clientId || !redirectUri) {
    return res.status(503).json({
      data: {
        url: null,
        isConfigured: false,
        message: 'Google OAuth belum dikonfigurasi lengkap di server environment (GOOGLE_CLIENT_ID atau GOOGLE_REDIRECT_URI).',
      },
    });
  }

  // Cryptographically secure state with browser cookie binding (anti-replay & anti-CSRF)
  const state = crypto.randomBytes(32).toString('hex');

  res.cookie('ekraf_oauth_state', state, {
    httpOnly: true,
    secure: envConfig.cookieSecure,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: 5 * 60 * 1000, // 5 minutes TTL
  });

  const scope = encodeURIComponent('openid email profile');
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account&state=${encodeURIComponent(
    state
  )}`;

  return res.json({
    data: {
      url,
      redirectUri,
      isConfigured: true,
    },
  });
});

// Helper function to cryptographically verify Google ID Token
export async function verifyGoogleIdToken(idToken: string): Promise<{
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}> {
  const clientId = envConfig.googleClientId;
  if (!clientId) {
    throw new AppError({
      code: 'SERVICE_UNAVAILABLE',
      message: 'GOOGLE_CLIENT_ID belum dikonfigurasi di server.',
      status: 503,
    });
  }

  const client = new OAuth2Client(clientId);
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
  } catch (err: any) {
    throw new AppError({
      code: 'UNAUTHENTICATED',
      message: `Verifikasi cryptographic Google ID token gagal: ${err.message}`,
      status: 401,
    });
  }

  const payload = ticket.getPayload();
  if (!payload) {
    throw new AppError({
      code: 'UNAUTHENTICATED',
      message: 'Payload Google ID token kosong.',
      status: 401,
    });
  }

  // Validate audience
  if (payload.aud !== clientId) {
    throw new AppError({
      code: 'UNAUTHENTICATED',
      message: 'Audience Google token tidak cocok.',
      status: 401,
    });
  }

  // Validate issuer
  const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
  if (!payload.iss || !validIssuers.includes(payload.iss)) {
    throw new AppError({
      code: 'UNAUTHENTICATED',
      message: 'Issuer Google token tidak valid.',
      status: 401,
    });
  }

  // Validate expiry
  const nowInSec = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowInSec) {
    throw new AppError({
      code: 'UNAUTHENTICATED',
      message: 'Google token telah kedaluwarsa.',
      status: 401,
    });
  }

  // Validate email verified (AUTH-13)
  if (!payload.email_verified) {
    throw new AppError({
      code: 'UNAUTHENTICATED',
      message: 'Alamat email Google belum diverifikasi oleh Google.',
      status: 401,
    });
  }

  if (!payload.email) {
    throw new AppError({
      code: 'UNAUTHENTICATED',
      message: 'Email tidak ditemukan dalam klaim Google ID token.',
      status: 401,
    });
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}

// GET /google/callback (AUTH-04 to AUTH-16)
authRouter.get('/google/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.query.code as string;
    const error = req.query.error as string;
    const state = req.query.state as string;

    const clientId = envConfig.googleClientId;
    const clientSecret = envConfig.googleClientSecret;
    const redirectUri = envConfig.googleRedirectUri;

    // Check configuration
    if (!clientId || !clientSecret || !redirectUri) {
      return res.redirect('/login?error=Google+OAuth+belum+dikonfigurasi+lengkap+di+server');
    }

    if (error || !code) {
      return res.redirect(`/login?error=${encodeURIComponent(error || 'Autentikasi Google dibatalkan.')}`);
    }

    // Validate state from cookie (AUTH-05, AUTH-06, AUTH-07)
    const storedState = req.cookies?.ekraf_oauth_state;

    // Immediately clear state cookie (single use, anti-replay)
    res.clearCookie('ekraf_oauth_state', {
      httpOnly: true,
      secure: envConfig.cookieSecure,
      sameSite: 'lax',
      path: '/api/v1/auth',
    });

    if (!storedState || !state || storedState !== state) {
      return res.redirect('/login?error=Sesi+OAuth+state+tidak+valid+atau+kedaluwarsa');
    }

    // Exchange authorization code for tokens
    const client = new OAuth2Client(clientId, clientSecret, redirectUri);
    let idToken: string | null = null;

    try {
      const { tokens } = await client.getToken(code);
      idToken = tokens.id_token || null;
    } catch (_err) {
      return res.redirect('/login?error=Gagal+menukar+kode+otorisasi+Google');
    }

    if (!idToken) {
      return res.redirect('/login?error=ID+token+Google+tidak+ditemukan');
    }

    // Cryptographically verify ID token
    const verifiedUser = await verifyGoogleIdToken(idToken);
    const normalizedEmail = verifiedUser.email.trim().toLowerCase();

    // Account Lookup & Creation (AUTH-14, AUTH-15, AUTH-16)
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (!user) {
      // New user gets USER role (AUTH-14)
      const dummyHash = await bcrypt.hash(randomUUID() + Date.now(), 10);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: dummyHash,
          role: 'USER',
          profile: {
            create: {
              displayName: verifiedUser.name || normalizedEmail.split('@')[0],
              photoPath: verifiedUser.picture || null,
            },
          },
        },
        include: { profile: true },
      });
    } else {
      // Existing user: check if inactive (AUTH-16)
      if (!user.isActive) {
        return res.redirect('/login?error=Akun+pengguna+telah+dinonaktifkan');
      }

      // Existing role is preserved! (AUTH-15: admin remains admin, user remains user)
      if (!user.profile) {
        await prisma.userProfile.create({
          data: {
            userId: user.id,
            displayName: verifiedUser.name || user.email.split('@')[0],
            photoPath: verifiedUser.picture || null,
          },
        });
        user = await prisma.user.findUnique({
          where: { id: user.id },
          include: { profile: true },
        });
      }
    }

    await createSessionAndSetCookies(res, user!, req.headers['user-agent']);
    return res.redirect(user!.role === 'ADMIN' ? '/admin' : '/dashboard/profile');
  } catch (err: any) {
    const errorMsg = err?.message || 'Terjadi kesalahan saat memproses login Google';
    return res.redirect(`/login?error=${encodeURIComponent(errorMsg)}`);
  }
});

// POST /google (AUTH-09 to AUTH-17: Strict cryptographic ID token verification only, rejects arbitrary client body identity)
authRouter.post('/google', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential, idToken } = req.body;
    const tokenToVerify = credential || idToken;

    if (!tokenToVerify || typeof tokenToVerify !== 'string') {
      throw new AppError({
        code: 'VALIDATION_FAILED',
        message: 'Kredensial ID token Google wajib disediakan dalam request body.',
        status: 422,
      });
    }

    // Cryptographically verify ID token
    const verifiedUser = await verifyGoogleIdToken(tokenToVerify);
    const normalizedEmail = verifiedUser.email.trim().toLowerCase();

    // Look up or create account
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (!user) {
      // New user: role must be USER (AUTH-14)
      const dummyHash = await bcrypt.hash(randomUUID() + Date.now(), 10);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: dummyHash,
          role: 'USER',
          profile: {
            create: {
              displayName: verifiedUser.name || normalizedEmail.split('@')[0],
              photoPath: verifiedUser.picture || null,
            },
          },
        },
        include: { profile: true },
      });
    } else {
      if (!user.isActive) {
        throw new AppError({
          code: 'UNAUTHENTICATED',
          message: 'Akun pengguna telah dinonaktifkan.',
          status: 401,
        });
      }

      // Existing role is preserved (AUTH-15)
      if (!user.profile) {
        await prisma.userProfile.create({
          data: {
            userId: user.id,
            displayName: verifiedUser.name || user.email.split('@')[0],
            photoPath: verifiedUser.picture || null,
          },
        });
        user = await prisma.user.findUnique({
          where: { id: user.id },
          include: { profile: true },
        });
      }
    }

    await createSessionAndSetCookies(res, user!, req.headers['user-agent']);

    return res.json({
      data: {
        id: user!.id,
        email: user!.email,
        role: user!.role,
        profile: user!.profile,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /refresh (Atomic rotation & reuse detection)
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawToken = req.cookies?.ekraf_rt;
    if (!rawToken) {
      throw new AppError({
        code: 'UNAUTHENTICATED',
        message: 'Token refresh tidak ditemukan dalam cookie.',
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
        message: 'Deteksi penggunaan token berulang (token reuse). Seluruh sesi telah dicabut demi keamanan.',
        status: 401,
      });
    }

    // Normal rotation: atomic transaction
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
    const newRefreshToken = signRefreshToken({
      userId: user.id,
      sessionId: newSessionId,
      familyId: payload.familyId,
    });

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
