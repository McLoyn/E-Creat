import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middlewares/auth.js';
import { AppError } from '../middlewares/error.js';

export const categoriesRouter = Router();
export const adminCategoriesRouter = Router();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Public: GET /categories?kind=
categoriesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kind = req.query.kind as string;
    const where: any = { isActive: true };
    if (kind) {
      if (!['SUBSECTOR', 'SUBAPP_TYPE'].includes(kind.toUpperCase())) {
        throw new AppError({
          code: 'VALIDATION_FAILED',
          message: 'Parameter kind harus bernilai SUBSECTOR atau SUBAPP_TYPE.',
          status: 422,
        });
      }
      where.kind = kind.toUpperCase();
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return res.json({ data: categories });
  } catch (err) {
    next(err);
  }
});

// Admin: GET /admin/categories
adminCategoriesRouter.get('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kind = req.query.kind as string;
    const where: any = {};
    if (kind) {
      where.kind = kind.toUpperCase();
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            subApps: true,
            creativeProfiles: true,
            userInterests: true,
          },
        },
      },
    });

    return res.json({ data: categories });
  } catch (err) {
    next(err);
  }
});

// Admin: POST /admin/categories
adminCategoriesRouter.post('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { kind, name, slug, description, sortOrder, isActive } = req.body;

    if (!kind || !['SUBSECTOR', 'SUBAPP_TYPE'].includes(kind.toUpperCase())) {
      throw new AppError({
        code: 'VALIDATION_FAILED',
        message: 'Field kind wajib diisi dengan SUBSECTOR atau SUBAPP_TYPE.',
        status: 422,
      });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new AppError({
        code: 'VALIDATION_FAILED',
        message: 'Nama kategori wajib diisi.',
        status: 422,
      });
    }

    const finalSlug = slug ? slugify(slug) : slugify(name);
    const finalKind = kind.toUpperCase();

    // Check unique (kind, slug) and (kind, name)
    const existingSlug = await prisma.category.findUnique({
      where: { kind_slug: { kind: finalKind, slug: finalSlug } },
    });
    if (existingSlug) {
      throw new AppError({
        code: 'CONFLICT',
        message: `Slug "${finalSlug}" sudah digunakan pada tipe kategori ${finalKind}.`,
        status: 409,
      });
    }

    const existingName = await prisma.category.findUnique({
      where: { kind_name: { kind: finalKind, name: name.trim() } },
    });
    if (existingName) {
      throw new AppError({
        code: 'CONFLICT',
        message: `Kategori dengan nama "${name.trim()}" sudah ada pada tipe ${finalKind}.`,
        status: 409,
      });
    }

    const created = await prisma.category.create({
      data: {
        kind: finalKind,
        name: name.trim(),
        slug: finalSlug,
        description: description ? description.trim() : null,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        createdById: req.user!.id,
      },
    });

    return res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
});

// Admin: PATCH /admin/categories/:id
adminCategoriesRouter.patch('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, slug, description, sortOrder, isActive } = req.body;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new AppError({
        code: 'NOT_FOUND',
        message: 'Kategori tidak ditemukan.',
        status: 404,
      });
    }

    const finalSlug = slug !== undefined ? slugify(slug) : undefined;
    const finalName = name !== undefined ? name.trim() : undefined;

    if (finalSlug && finalSlug !== category.slug) {
      const existing = await prisma.category.findUnique({
        where: { kind_slug: { kind: category.kind, slug: finalSlug } },
      });
      if (existing) {
        throw new AppError({
          code: 'CONFLICT',
          message: `Slug "${finalSlug}" sudah digunakan pada jenis kategori ${category.kind}.`,
          status: 409,
        });
      }
    }

    if (finalName && finalName !== category.name) {
      const existing = await prisma.category.findUnique({
        where: { kind_name: { kind: category.kind, name: finalName } },
      });
      if (existing) {
        throw new AppError({
          code: 'CONFLICT',
          message: `Nama kategori "${finalName}" sudah terdaftar pada jenis ${category.kind}.`,
          status: 409,
        });
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: finalName,
        slug: finalSlug,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
        isActive: typeof isActive === 'boolean' ? isActive : undefined,
        updatedById: req.user!.id,
      },
    });

    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// Admin: DELETE /admin/categories/:id
// AC-CAT-1: Deleting a used category gives 409 with data intact.
adminCategoriesRouter.delete('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subApps: true,
            creativeProfiles: true,
            userInterests: true,
          },
        },
      },
    });

    if (!category) {
      throw new AppError({
        code: 'NOT_FOUND',
        message: 'Kategori tidak ditemukan.',
        status: 404,
      });
    }

    const totalUsage = category._count.subApps + category._count.creativeProfiles + category._count.userInterests;
    if (totalUsage > 0) {
      throw new AppError({
        code: 'CONFLICT',
        message: `Kategori sedang digunakan oleh ${totalUsage} data terkait. Tidak dapat dihapus. Nonaktifkan kategori sebagai alternatif.`,
        status: 409,
      });
    }

    await prisma.category.delete({ where: { id } });
    return res.json({ data: { message: 'Kategori berhasil dihapus.', id } });
  } catch (err) {
    next(err);
  }
});
