import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { prisma } from './db.js';
import { requestIdMiddleware, errorHandler, AppError } from './middlewares/error.js';
import { authenticate } from './middlewares/auth.js';
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

// Validate required env vars at startup
if (!process.env.JWT_ACCESS_SECRET) {
  console.error('Missing JWT_ACCESS_SECRET env var');
  process.exit(1);
}
if (!process.env.JWT_REFRESH_SECRET) {
  console.error('Missing JWT_REFRESH_SECRET env var');
  process.exit(1);
}
if (!process.env.GOOGLE_CLIENT_ID) {
  console.error('Missing GOOGLE_CLIENT_ID env var');
  process.exit(1);
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.error('Missing GOOGLE_CLIENT_SECRET env var');
  process.exit(1);
}
if (!process.env.GOOGLE_REDIRECT_URI) {
  console.error('Missing GOOGLE_REDIRECT_URI env var');
  process.exit(1);
}
if (!process.env.WEB_ORIGIN) {
  console.error('Missing WEB_ORIGIN env var');
  process.exit(1);
}


app.use(
  cors({
    origin: (origin, callback) => {
      // Allow only the configured web origin
      if (!origin || origin === process.env.WEB_ORIGIN) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'), false);
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(requestIdMiddleware);
app.use(authenticate);

// Serve static uploaded files
const uploadDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

// Health check endpoint
app.get('/api/v1/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Mount Routes
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

// Admin Routes
app.use('/api/v1/admin/categories', adminCategoriesRouter);
app.use('/api/v1/admin/sub-apps', adminSubAppsRouter);
app.use('/api/v1/admin/creative-profiles', adminCreativeProfilesRouter);
app.use('/api/v1/admin', adminModerationRouter);
app.use('/api/v1/admin', adminRouter);

// Serve Web Frontend SPA if built
import fs from 'fs';
import { fileURLToPath } from 'url';
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

// 404 Route Handler for unmatched API endpoints
app.use((_req, _res, next) => {
  next(
    new AppError({
      code: 'NOT_FOUND',
      message: 'Endpoint API tidak ditemukan.',
      status: 404,
    })
  );
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
