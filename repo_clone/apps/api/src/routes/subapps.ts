import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
import { Prisma, SubAppCategory } from '@prisma/client';
import { requireAdmin } from '../middlewares/auth.js';
import { AppError } from '../middlewares/error.js';

export const subAppsRouter = Router();
export const adminSubAppsRouter = Router();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function validateUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) {
    throw new AppError({
      code: 'VALIDATION_FAILED',
      message: 'Field externalUrl harus berupa URL HTTP atau HTTPS yang valid.',
      status: 422,
    });
  }
}

// Public: GET /sub-apps
subAppsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 12));
    const search = req.query.search as string;
    const categorySlug = req.query.category as string;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { tagline: { contains: search } },
      ];
    }

    if (categorySlug) {
      where.categories = {
        some: {
          category: {
            slug: categorySlug,
            isActive: true,
          },
        },
      };
    }

    const total = await prisma.subApp.count({ where });
    const subApps = await prisma.subApp.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { publishedAt: 'desc' },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    return res.json({
      data: subApps,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Public: GET /sub-apps/:slug
subAppsRouter.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const subApp = await prisma.subApp.findUnique({
      where: { slug },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    if (!subApp || subApp.status !== 'PUBLISHED') {
      throw new AppError({
        code: 'NOT_FOUND',
        message: 'Sub-App tidak ditemukan atau belum dipublikasikan.',
        status: 404,
      });
    }

    return res.json({ data: subApp });
  } catch (err) {
    next(err);
  }
});

// Admin: GET /admin/sub-apps
adminSubAppsRouter.get('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 12));
    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const total = await prisma.subApp.count({ where });
    const subApps = await prisma.subApp.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    return res.json({
      data: subApps,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Admin: GET /admin/sub-apps/:id
adminSubAppsRouter.get('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const subApp = await prisma.subApp.findUnique({
      where: { id },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    if (!subApp) {
      throw new AppError({
        code: 'NOT_FOUND',
        message: 'Sub-App tidak ditemukan.',
        status: 404,
      });
    }

    return res.json({ data: subApp });
  } catch (err) {
    next(err);
  }
});

// Admin: POST /admin/sub-apps
adminSubAppsRouter.post('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, tagline, description, externalUrl, imagePath, categoryIds } = req.body;

    if (!name || !tagline || !description || !externalUrl) {
      throw new AppError({
        code: 'VALIDATION_FAILED',
        message: 'Nama, tagline, deskripsi, dan externalUrl wajib diisi.',
        status: 422,
      });
    }

    validateUrl(externalUrl);

    const finalSlug = slug ? slugify(slug) : slugify(name);
    const existing = await prisma.subApp.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      throw new AppError({
        code: 'CONFLICT',
        message: `Slug "${finalSlug}" sudah digunakan oleh Sub-App lain.`,
        status: 409,
      });
    }

    // Validate category IDs if provided
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      const activeCats = await prisma.category.findMany({
        where: { id: { in: categoryIds }, kind: 'SUBAPP_TYPE', isActive: true },
      });
      if (activeCats.length !== categoryIds.length) {
        throw new AppError({
          code: 'VALIDATION_FAILED',
          message: 'Kategori harus berupa SUBAPP_TYPE yang aktif.',
          status: 422,
        });
      }
    }

    const created = await prisma.subApp.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        tagline: tagline.trim(),
        description: description.trim(),
        externalUrl: externalUrl.trim(),
        imagePath: imagePath ? imagePath.trim() : null,
        status: 'DRAFT', // Always DRAFT when created
        createdById: req.user!.id,
        categories: categoryIds && Array.isArray(categoryIds)
          ? {
              create: categoryIds.map((catId: string) => ({
                category: { connect: { id: catId } },
              })),
            }
          : undefined,
      },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    return res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
});

// Admin: PATCH /admin/sub-apps/:id
adminSubAppsRouter.patch('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, slug, tagline, description, externalUrl, imagePath, categoryIds } = req.body;

    const subApp = await prisma.subApp.findUnique({ where: { id } });
    if (!subApp) {
      throw new AppError({
        code: 'NOT_FOUND',
        message: 'Sub-App tidak ditemukan.',
        status: 404,
      });
    }

    if (externalUrl !== undefined) {
      validateUrl(externalUrl);
    }

    const finalSlug = slug !== undefined ? slugify(slug) : undefined;
    if (finalSlug && finalSlug !== subApp.slug) {
      const existing = await prisma.subApp.findUnique({ where: { slug: finalSlug } });
      if (existing) {
        throw new AppError({
          code: 'CONFLICT',
          message: `Slug "${finalSlug}" sudah digunakan oleh Sub-App lain.`,
          status: 409,
        });
      }
    }

    if (categoryIds !== undefined && Array.isArray(categoryIds)) {
      if (categoryIds.length > 0) {
        const activeCats = await prisma.category.findMany({
          where: { id: { in: categoryIds }, kind: 'SUBAPP_TYPE', isActive: true },
        });
        if (activeCats.length !== categoryIds.length) {
          throw new AppError({
            code: 'VALIDATION_FAILED',
            message: 'Kategori harus berupa SUBAPP_TYPE yang aktif.',
            status: 422,
          });
        }
      }
    }

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (categoryIds !== undefined && Array.isArray(categoryIds)) {
        await tx.subAppCategory.deleteMany({ where: { subAppId: id } });
        if (categoryIds.length > 0) {
          await tx.subAppCategory.createMany({
            data: categoryIds.map((catId: string) => ({
              subAppId: id,
              categoryId: catId,
            })),
          });
        }
      }

      return tx.subApp.update({
        where: { id },
        data: {
          name: name !== undefined ? name.trim() : undefined,
          slug: finalSlug,
          tagline: tagline !== undefined ? tagline.trim() : undefined,
          description: description !== undefined ? description.trim() : undefined,
          externalUrl: externalUrl !== undefined ? externalUrl.trim() : undefined,
          imagePath: imagePath !== undefined ? (imagePath ? imagePath.trim() : null) : undefined,
          updatedById: req.user!.id,
        },
        include: {
          categories: {
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

// Admin: Lifecycle State Machine Transitions

// POST /admin/sub-apps/:id/publish (DRAFT -> PUBLISHED)
adminSubAppsRouter.post('/:id/publish', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const subApp = await prisma.subApp.findUnique({
      where: { id },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    if (!subApp) {
      throw new AppError({ code: 'NOT_FOUND', message: 'Sub-App tidak ditemukan.', status: 404 });
    }

    if (subApp.status !== 'DRAFT') {
      throw new AppError({
        code: 'INVALID_STATE_TRANSITION',
        message: `Tidak dapat mempublikasikan dari status "${subApp.status}". Publikasi hanya valid dari status DRAFT.`,
        status: 409,
      });
    }

    // Must have at least one active category to publish
    const hasActiveCategory = subApp.categories.some((c) => (c as { category: { isActive: boolean } }).category.isActive);
    if (!hasActiveCategory) {
      throw new AppError({
        code: 'INVALID_STATE_TRANSITION',
        message: 'Sub-App wajib memiliki setidaknya satu kategori aktif sebelum dipublikasikan.',
        status: 409,
      });
    }

    const updated = await prisma.subApp.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedById: req.user!.id,
      },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /admin/sub-apps/:id/unpublish (PUBLISHED -> DRAFT)
adminSubAppsRouter.post('/:id/unpublish', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const subApp = await prisma.subApp.findUnique({ where: { id } });
    if (!subApp) {
      throw new AppError({ code: 'NOT_FOUND', message: 'Sub-App tidak ditemukan.', status: 404 });
    }

    if (subApp.status !== 'PUBLISHED') {
      throw new AppError({
        code: 'INVALID_STATE_TRANSITION',
        message: `Tidak dapat membatalkan publikasi dari status "${subApp.status}".`,
        status: 409,
      });
    }

    const updated = await prisma.subApp.update({
      where: { id },
      data: {
        status: 'DRAFT',
        updatedById: req.user!.id,
      },
    });

    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /admin/sub-apps/:id/archive (DRAFT or PUBLISHED -> ARCHIVED)
adminSubAppsRouter.post('/:id/archive', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const subApp = await prisma.subApp.findUnique({ where: { id } });
    if (!subApp) {
      throw new AppError({ code: 'NOT_FOUND', message: 'Sub-App tidak ditemukan.', status: 404 });
    }

    if (subApp.status === 'ARCHIVED') {
      throw new AppError({
        code: 'INVALID_STATE_TRANSITION',
        message: 'Sub-App sudah berada dalam status ARCHIVED.',
        status: 409,
      });
    }

    const updated = await prisma.subApp.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        updatedById: req.user!.id,
      },
    });

    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /admin/sub-apps/:id/restore (ARCHIVED -> DRAFT)
adminSubAppsRouter.post('/:id/restore', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const subApp = await prisma.subApp.findUnique({ where: { id } });
    if (!subApp) {
      throw new AppError({ code: 'NOT_FOUND', message: 'Sub-App tidak ditemukan.', status: 404 });
    }

    if (subApp.status !== 'ARCHIVED') {
      throw new AppError({
        code: 'INVALID_STATE_TRANSITION',
        message: `Hanya Sub-App berstatus ARCHIVED yang dapat dipulihkan ke DRAFT.`,
        status: 409,
      });
    }

    const updated = await prisma.subApp.update({
      where: { id },
      data: {
        status: 'DRAFT',
        updatedById: req.user!.id,
      },
    });

    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});
