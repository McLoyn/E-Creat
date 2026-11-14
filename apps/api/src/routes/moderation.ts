import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middlewares/auth.js';
import { AppError } from '../middlewares/error.js';

export const adminModerationRouter = Router();

function parseImages(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------------
// GET /admin/moderation (Unified Moderation Queue)
// -----------------------------------------------------------------------------
adminModerationRouter.get('/moderation', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = (req.query.type as string) || 'all'; // 'all', 'works', 'products'
    const status = (req.query.status as string) || 'PENDING_REVIEW';
    const creatorSlug = req.query.creator as string;

    const worksWhere: any = {};
    const prodsWhere: any = {};

    if (status !== 'ALL') {
      worksWhere.status = status;
      prodsWhere.status = status;
    }

    if (creatorSlug) {
      worksWhere.creativeProfile = { slug: creatorSlug };
      prodsWhere.creativeProfile = { slug: creatorSlug };
    }

    let works: any[] = [];
    let products: any[] = [];

    if (type === 'all' || type === 'works') {
      works = await prisma.creativeWork.findMany({
        where: worksWhere,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: true,
          creativeProfile: {
            select: { id: true, name: true, slug: true, city: true, district: true },
          },
        },
      });
    }

    if (type === 'all' || type === 'products') {
      products = await prisma.creativeProduct.findMany({
        where: prodsWhere,
        orderBy: { updatedAt: 'desc' },
        include: {
          productType: true,
          creativeProfile: {
            select: { id: true, name: true, slug: true, city: true, district: true },
          },
        },
      });
    }

    const queue = [
      ...works.map((w) => ({
        id: w.id,
        itemType: 'work' as const,
        title: w.title,
        slug: w.slug,
        description: w.description,
        status: w.status,
        reviewNote: w.reviewNote,
        submittedAt: w.submittedAt,
        reviewedAt: w.reviewedAt,
        updatedAt: w.updatedAt,
        categoryName: w.category?.name || 'Tanpa Kategori',
        coverImage: parseImages(w.imagePaths)[0] || null,
        creator: w.creativeProfile,
      })),
      ...products.map((p) => ({
        id: p.id,
        itemType: 'product' as const,
        title: p.title,
        slug: p.slug,
        description: p.description,
        status: p.status,
        reviewNote: p.reviewNote,
        submittedAt: p.submittedAt,
        reviewedAt: p.reviewedAt,
        updatedAt: p.updatedAt,
        categoryName: p.productType?.name || '-',
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        priceUnit: p.priceUnit,
        availability: p.availability,
        coverImage: parseImages(p.imagePaths)[0] || null,
        creator: p.creativeProfile,
      })),
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return res.json({
      data: queue,
      meta: {
        total: queue.length,
        worksCount: works.length,
        productsCount: products.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// ADMIN MODERATION ACTIONS FOR WORKS
// -----------------------------------------------------------------------------

// POST /admin/works/:id/approve
adminModerationRouter.post('/works/:id/approve', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const work = await prisma.creativeWork.findUnique({ where: { id } });
    if (!work) throw new AppError({ code: 'NOT_FOUND', message: 'Karya tidak ditemukan.', status: 404 });

    const updated = await prisma.creativeWork.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
        updatedById: req.user!.id,
      },
    });
    return res.json({ data: updated, message: 'Karya berhasil disetujui dan dipublikasikan.' });
  } catch (err) {
    next(err);
  }
});

// POST /admin/works/:id/reject
adminModerationRouter.post('/works/:id/reject', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const reviewNote = (req.body.reviewNote || req.body.note) as string | undefined;
    if (!reviewNote || typeof reviewNote !== 'string' || reviewNote.trim().length === 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Catatan penolakan (reviewNote) wajib diisi.', status: 422 });
    }

    const updated = await prisma.creativeWork.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewNote: reviewNote.trim(),
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
        updatedById: req.user!.id,
      },
    });
    return res.json({ data: updated, message: 'Karya ditolak dengan catatan evaluasi.' });
  } catch (err) {
    next(err);
  }
});

// POST /admin/works/:id/request-revision
adminModerationRouter.post('/works/:id/request-revision', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const reviewNote = (req.body.reviewNote || req.body.note) as string | undefined;
    if (!reviewNote || typeof reviewNote !== 'string' || reviewNote.trim().length === 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Catatan revisi (reviewNote) wajib diisi.', status: 422 });
    }

    const updated = await prisma.creativeWork.update({
      where: { id },
      data: {
        status: 'NEEDS_REVISION',
        reviewNote: reviewNote.trim(),
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
        updatedById: req.user!.id,
      },
    });
    return res.json({ data: updated, message: 'Permintaan revisi dikirimkan kepada kreator.' });
  } catch (err) {
    next(err);
  }
});

// POST /admin/works/:id/unpublish
adminModerationRouter.post('/works/:id/unpublish', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await prisma.creativeWork.update({
      where: { id },
      data: {
        status: 'DRAFT',
        updatedById: req.user!.id,
      },
    });
    return res.json({ data: updated, message: 'Publikasi karya ditarik kembali ke DRAFT.' });
  } catch (err) {
    next(err);
  }
});

// POST /admin/works/:id/archive
adminModerationRouter.post('/works/:id/archive', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await prisma.creativeWork.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        updatedById: req.user!.id,
      },
    });
    return res.json({ data: updated, message: 'Karya berhasil diarsipkan.' });
  } catch (err) {
    next(err);
  }
});

// POST /admin/works/:id/restore
adminModerationRouter.post('/works/:id/restore', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await prisma.creativeWork.update({
      where: { id },
      data: {
        status: 'DRAFT',
        updatedById: req.user!.id,
      },
    });
    return res.json({ data: updated, message: 'Karya dipulihkan ke status DRAFT.' });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// ADMIN MODERATION ACTIONS FOR PRODUCTS
// -----------------------------------------------------------------------------

// POST /admin/products/:id/approve
adminModerationRouter.post('/products/:id/approve', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await prisma.creativeProduct.findUnique({ where: { id } });
    if (!product) throw new AppError({ code: 'NOT_FOUND', message: 'Produk tidak ditemukan.', status: 404 });

    const updated = await prisma.creativeProduct.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
        updatedById: req.user!.id,
      },
    });
    return res.json({ data: updated, message: 'Produk berhasil disetujui dan dipublikasikan.' });
  } catch (err) {
    next(err);
  }
});

// POST /admin/products/:id/reject
adminModerationRouter.post('/products/:id/reject', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const reviewNote = (req.body.reviewNote || req.body.note) as string | undefined;
    if (!reviewNote || typeof reviewNote !== 'string' || reviewNote.trim().length === 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Catatan penolakan (reviewNote) wajib diisi.', status: 422 });
    }

    const updated = await prisma.creativeProduct.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewNote: reviewNote.trim(),
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
        updatedById: req.user!.id,
      },
    });
    return res.json({ data: updated, message: 'Produk ditolak dengan catatan evaluasi.' });
  } catch (err) {
    next(err);
  }
});

// POST /admin/products/:id/request-revision
adminModerationRouter.post('/products/:id/request-revision', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const reviewNote = (req.body.reviewNote || req.body.note) as string | undefined;
    if (!reviewNote || typeof reviewNote !== 'string' || reviewNote.trim().length === 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Catatan revisi (reviewNote) wajib diisi.', status: 422 });
    }

    const updated = await prisma.creativeProduct.update({
      where: { id },
      data: {
        status: 'NEEDS_REVISION',
        reviewNote: reviewNote.trim(),
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
        updatedById: req.user!.id,
      },
    });
    return res.json({ data: updated, message: 'Permintaan revisi produk dikirimkan kepada kreator.' });
  } catch (err) {
    next(err);
  }
});

// POST /admin/products/:id/unpublish
adminModerationRouter.post('/products/:id/unpublish', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await prisma.creativeProduct.update({
      where: { id },
      data: {
        status: 'DRAFT',
        updatedById: req.user!.id,
      },
    });
    return res.json({ data: updated, message: 'Publikasi produk ditarik kembali ke DRAFT.' });
  } catch (err) {
    next(err);
  }
});

// POST /admin/products/:id/archive
adminModerationRouter.post('/products/:id/archive', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await prisma.creativeProduct.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        updatedById: req.user!.id,
      },
    });
    return res.json({ data: updated, message: 'Produk berhasil diarsipkan.' });
  } catch (err) {
    next(err);
  }
});

// POST /admin/products/:id/restore
adminModerationRouter.post('/products/:id/restore', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await prisma.creativeProduct.update({
      where: { id },
      data: {
        status: 'DRAFT',
        updatedById: req.user!.id,
      },
    });
    return res.json({ data: updated, message: 'Produk dipulihkan ke status DRAFT.' });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// K-01: ADMIN ASSIGN OWNER LINK (PUT /admin/creative-profiles/:id/owner)
// -----------------------------------------------------------------------------
adminModerationRouter.put('/creative-profiles/:id/owner', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: profileId } = req.params;
    let { userId, email } = req.body;

    const profile = await prisma.creativeProfile.findUnique({ where: { id: profileId } });
    if (!profile) {
      throw new AppError({ code: 'NOT_FOUND', message: 'Profil Pelaku Kreatif tidak ditemukan.', status: 404 });
    }

    // Unlink if neither userId nor email is provided
    if (!userId && !email) {
      await prisma.creativeProfileOwner.deleteMany({ where: { creativeProfileId: profileId } });
      return res.json({
        data: null,
        message: `Tautan kepemilikan akun untuk profil "${profile.name}" berhasil dicabut.`,
      });
    }

    let user: any = null;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
    } else if (email) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { profile: true },
      });
      if (user) userId = user.id;
    }

    if (!user) {
      throw new AppError({ code: 'NOT_FOUND', message: 'Akun pengguna yang dipilih tidak ditemukan.', status: 404 });
    }

    // Check if user is already owner of another profile
    const existingUserOwnership = await prisma.creativeProfileOwner.findUnique({
      where: { userId },
      include: { creativeProfile: true },
    });

    if (existingUserOwnership && existingUserOwnership.creativeProfileId !== profileId) {
      throw new AppError({
        code: 'CONFLICT',
        message: `Akun ini sudah ditautkan ke profil kreator "${existingUserOwnership.creativeProfile.name}". Dalam versi saat ini, 1 akun hanya dapat memiliki 1 profil.`,
        status: 409,
      });
    }

    const link = await prisma.creativeProfileOwner.upsert({
      where: { creativeProfileId: profileId },
      update: {
        userId,
        assignedById: req.user!.id,
      },
      create: {
        creativeProfileId: profileId,
        userId,
        assignedById: req.user!.id,
      },
      include: {
        creativeProfile: true,
        user: { select: { id: true, email: true, profile: true } },
      },
    });

    return res.json({
      data: link,
      message: `Akun ${user.email} (${user.profile?.displayName || 'Kreator'}) berhasil ditautkan sebagai pemilik profil "${profile.name}".`,
    });
  } catch (err) {
    next(err);
  }
});
