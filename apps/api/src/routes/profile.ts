import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';
import { AppError } from '../middlewares/error.js';

export const profileRouter = Router();

// GET /me/profile
profileRouter.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: req.user!.id },
      include: {
        interests: {
          include: { category: true },
        },
      },
    });

    if (!profile) {
      throw new AppError({
        code: 'NOT_FOUND',
        message: 'Profil pengguna tidak ditemukan.',
        status: 404,
      });
    }

    return res.json({ data: profile });
  } catch (err) {
    next(err);
  }
});

// PATCH /me/profile
profileRouter.patch('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { displayName, locationText, photoPath, bio, interestCategoryIds } = req.body;

    if (displayName !== undefined && (typeof displayName !== 'string' || displayName.trim().length === 0)) {
      throw new AppError({
        code: 'VALIDATION_FAILED',
        message: 'Nama tampilan (displayName) tidak boleh kosong.',
        status: 422,
      });
    }

    if (bio !== undefined && typeof bio === 'string' && bio.length > 500) {
      throw new AppError({
        code: 'VALIDATION_FAILED',
        message: 'Bio tidak boleh lebih dari 500 karakter.',
        status: 422,
      });
    }

    // Validate interest categories if provided
    if (interestCategoryIds !== undefined) {
      if (!Array.isArray(interestCategoryIds)) {
        throw new AppError({
          code: 'VALIDATION_FAILED',
          message: 'interestCategoryIds harus berupa array string ID kategori.',
          status: 422,
        });
      }

      if (interestCategoryIds.length > 5) {
        throw new AppError({
          code: 'VALIDATION_FAILED',
          message: 'Maksimal minat yang dapat dipilih adalah 5 subsektor.',
          status: 422,
        });
      }

      if (interestCategoryIds.length > 0) {
        const found = await prisma.category.findMany({
          where: {
            id: { in: interestCategoryIds },
            kind: 'SUBSECTOR',
            isActive: true,
          },
        });

        if (found.length !== interestCategoryIds.length) {
          throw new AppError({
            code: 'VALIDATION_FAILED',
            message: 'Satu atau lebih kategori minat tidak valid, bukan SUBSECTOR, atau sedang tidak aktif.',
            status: 422,
          });
        }
      }
    }

    const currentProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!currentProfile) {
      throw new AppError({
        code: 'NOT_FOUND',
        message: 'Profil pengguna tidak ditemukan.',
        status: 404,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (interestCategoryIds !== undefined) {
        await tx.userProfileInterest.deleteMany({
          where: { userProfileId: currentProfile.id },
        });

        if (interestCategoryIds.length > 0) {
          await tx.userProfileInterest.createMany({
            data: interestCategoryIds.map((catId: string) => ({
              userProfileId: currentProfile.id,
              categoryId: catId,
            })),
          });
        }
      }

      return tx.userProfile.update({
        where: { id: currentProfile.id },
        data: {
          displayName: displayName !== undefined ? displayName.trim() : undefined,
          locationText: locationText !== undefined ? (locationText ? locationText.trim() : null) : undefined,
          photoPath: photoPath !== undefined ? (photoPath ? photoPath.trim() : null) : undefined,
          bio: bio !== undefined ? (bio ? bio.trim() : null) : undefined,
        },
        include: {
          interests: {
            include: { category: true },
          },
        },
      });
    });

    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});
