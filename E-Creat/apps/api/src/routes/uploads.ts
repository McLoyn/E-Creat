import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { requireAuth } from '../middlewares/auth.js';
import { AppError } from '../middlewares/error.js';

export const uploadsRouter = Router();

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const filename = `${randomUUID()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(
        new AppError({
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Hanya format gambar JPEG, PNG, dan WebP yang didukung.',
          status: 415,
        })
      );
    }
    cb(null, true);
  },
});

uploadsRouter.post(
  '/images',
  requireAuth,
  upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError({
          code: 'VALIDATION_FAILED',
          message: 'File gambar wajib diunggah.',
          status: 422,
        });
      }

      const relativePath = `/uploads/${req.file.filename}`;
      return res.status(201).json({
        data: {
          path: relativePath,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
