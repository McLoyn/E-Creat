import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { prisma } from './db.js';
import { requestIdMiddleware, errorHandler, AppError } from './middlewares/error.js';
import { authenticate } from './middlewares/auth.js';
import { envConfig } from './utils/env.js';
import { authRouter } from './routes/auth.js';
import { profileRouter } from './routes/profile.js';
import { uploadsRouter } from './routes/uploads.js';
import { categoriesRouter, adminCategoriesRouter } from './routes/categories.js';
import { subAppsRouter, adminSubAppsRouter } from './routes/subapps.js';
import { creativeProfilesRouter, adminCreativeProfilesRouter } from './routes/creatives.js';
import { worksRouter, creatorWorksRouter } from './routes/works.js';
import { productsRouter, creatorProductsRouter } from './routes/products.js';
import { adminModerationRouter } from './routes/moderation.js';
import { adminRouter } from './routes/admin.js';

export const app = express();

// 1. Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false, // SPA handles frontend scripts/styles
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. Strict CORS Allowlist
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile native apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Check against explicit allowlist
      if (envConfig.webOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Localhost allowed in development only
      if (!envConfig.isProduction && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
        return callback(null, true);
      }

      return callback(
        new AppError({
          code: 'CORS_REJECTED',
          message: `Akses dari origin ${origin} ditolak oleh kebijakan keamanan CORS.`,
          status: 403,
        })
      );
    },
    credentials: true,
  })
);

// 3. Rate Limiting for Authentication Endpoints (Brute-Force & Credential Stuffing Defense)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new AppError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Terlalu banyak percobaan autentikasi. Silakan tunggu 15 menit sebelum mencoba kembali.',
        status: 429,
      })
    );
  },
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/google', authLimiter);

// 4. Body Parsers & Request Context
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(requestIdMiddleware);
app.use(authenticate);

// 5. Local static uploaded files (fallback for dev)
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// 6. Health check endpoint (verifies DB connectivity & env status)
app.get('/api/v1/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      status: 'ok',
      database: 'connected',
      environment: envConfig.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      error: err.message,
      environment: envConfig.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  }
});

// 7. Mount Application Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/me/profile', profileRouter);
app.use('/api/v1/uploads', uploadsRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/sub-apps', subAppsRouter);
app.use('/api/v1/creative-profiles', creativeProfilesRouter);
app.use('/api/v1/works', worksRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/me/works', creatorWorksRouter);
app.use('/api/v1/me/products', creatorProductsRouter);

// 8. Admin Routes
app.use('/api/v1/admin/categories', adminCategoriesRouter);
app.use('/api/v1/admin/sub-apps', adminSubAppsRouter);
app.use('/api/v1/admin/creative-profiles', adminCreativeProfilesRouter);
app.use('/api/v1/admin', adminModerationRouter);
app.use('/api/v1/admin', adminRouter);

// 9. Serve Web Frontend SPA if built
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDistPath = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

// 10. 404 Route Handler for unmatched API endpoints
app.use((_req, _res, next) => {
  next(
    new AppError({
      code: 'NOT_FOUND',
      message: 'Endpoint API tidak ditemukan.',
      status: 404,
    })
  );
});

// 11. Centralized Error Handler
app.use(errorHandler);

export default app;
