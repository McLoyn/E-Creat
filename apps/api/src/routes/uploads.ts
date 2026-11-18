import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth.js';
import { AppError } from '../middlewares/error.js';
import { uploadImage } from '../utils/storage.js';

export const uploadsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file || !req.file.buffer) {
        throw new AppError({
          code: 'VALIDATION_FAILED',
          message: 'File gambar wajib diunggah.',
          status: 422,
        });
      }

      const folderParam = (req.query.folder as string) || 'general';
      const folder = ['profiles', 'works', 'products'].includes(folderParam)
        ? (folderParam as 'profiles' | 'works' | 'products')
        : 'general';

      const result = await uploadImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        folder
      );

      return res.status(201).json({
        data: {
          path: result.path,
          filename: result.filename,
          size: result.size,
          mimetype: result.mimetype,
          provider: result.storageProvider,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
