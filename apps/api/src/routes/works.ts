import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
import { Prisma, CreativeWork, CreativeProduct } from '@prisma/client';
import { requireAuth } from '../middlewares/auth.js';
import { AppError } from '../middlewares/error.js';
import { getLinkedCreativeProfile } from '../middlewares/ownership.js';
import { formatCreatorContact } from '../utils/whatsapp.js';

export const worksRouter = Router();
export const creatorWorksRouter = Router();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseImages(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------------
// PUBLIC WORKS ENDPOINTS
// -----------------------------------------------------------------------------

// GET /works
worksRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 12));
    const search = req.query.search as string;
    const categorySlug = req.query.category as string;
    const creatorSlug = req.query.creator as string;
    const motif = req.query.motif as string;
    const technique = req.query.technique as string;

    const where: any = {
      status: 'PUBLISHED',
      creativeProfile: {
        status: 'PUBLISHED',
      },
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { motif: { contains: search } },
        { technique: { contains: search } },
      ];
    }

    if (categorySlug) {
      where.category = { slug: categorySlug, isActive: true };
    }

    if (creatorSlug) {
      where.creativeProfile = { ...where.creativeProfile, slug: creatorSlug };
    }

    if (motif) {
      where.motif = { contains: motif };
    }

    if (technique) {
      where.technique = { contains: technique };
    }

    const total = await prisma.creativeWork.count({ where });
    const works = await prisma.creativeWork.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        imagePaths: true,
        technique: true,
        motif: true,
        year: true,
        publishedAt: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
        creativeProfile: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            district: true,
            imagePath: true,
            whatsappNumber: true,
            instagramHandle: true,
            websiteUrl: true,
          },
        },
      },
    });

    const formatted = works.map((w) => {
      const images = parseImages(w.imagePaths);
      return {
        id: w.id,
        title: w.title,
        slug: w.slug,
        description: w.description,
        coverImage: images[0] || null,
        images,
        technique: w.technique,
        motif: w.motif,
        year: w.year,
        publishedAt: w.publishedAt,
        category: w.category,
        creator: {
          id: w.creativeProfile.id,
          name: w.creativeProfile.name,
          slug: w.creativeProfile.slug,
          city: w.creativeProfile.city,
          district: w.creativeProfile.district,
          imagePath: w.creativeProfile.imagePath,
          contact: formatCreatorContact(w.creativeProfile, w.title, w.slug, 'work'),
        },
      };
    });

    return res.json({
      data: formatted,
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

// GET /works/:slug
worksRouter.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const work = await prisma.creativeWork.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        creativeProfile: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            district: true,
            imagePath: true,
            status: true,
            whatsappNumber: true,
            instagramHandle: true,
            websiteUrl: true,
          },
        },
        products: {
          where: { status: 'PUBLISHED' },
          select: {
            id: true,
            title: true,
            slug: true,
            priceMin: true,
            priceMax: true,
            priceUnit: true,
            availability: true,
            imagePaths: true,
          },
        },
      },
    });

    // Rule: Public item only if work is PUBLISHED AND creator profile is PUBLISHED
    if (!work || work.status !== 'PUBLISHED' || work.creativeProfile.status !== 'PUBLISHED') {
      throw new AppError({
        code: 'NOT_FOUND',
        message: 'Karya tidak ditemukan atau belum dipublikasikan.',
        status: 404,
      });
    }

    const images = parseImages(work.imagePaths);
    const formatted = {
      id: work.id,
      title: work.title,
      slug: work.slug,
      description: work.description,
      coverImage: images[0] || null,
      images,
      technique: work.technique,
      motif: work.motif,
      year: work.year,
      publishedAt: work.publishedAt,
      category: work.category,
      creator: {
        id: work.creativeProfile.id,
        name: work.creativeProfile.name,
        slug: work.creativeProfile.slug,
        city: work.creativeProfile.city,
        district: work.creativeProfile.district,
        imagePath: work.creativeProfile.imagePath,
        contact: formatCreatorContact(work.creativeProfile, work.title, work.slug, 'work'),
      },
      products: work.products.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        priceUnit: p.priceUnit,
        availability: p.availability,
        coverImage: parseImages(p.imagePaths)[0] || null,
      })),
    };

    return res.json({ data: formatted });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// CREATOR WORKS ENDPOINTS (/me/works)
// -----------------------------------------------------------------------------

// GET /me/works
creatorWorksRouter.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await getLinkedCreativeProfile(req.user!.id, req.user!.role);
    const works = await prisma.creativeWork.findMany({
      where: { creativeProfileId: profile.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        category: true,
      },
    });

    const formatted = works.map((w) => ({
      ...w,
      images: parseImages(w.imagePaths),
    }));

    return res.json({ data: formatted, profile });
  } catch (err) {
    next(err);
  }
});

// POST /me/works
creatorWorksRouter.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, slug, description, imagePaths, images, technique, motif, year, categoryId, targetProfileId } = req.body;

    const profile = await getLinkedCreativeProfile(req.user!.id, req.user!.role, targetProfileId);

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError({
        code: 'VALIDATION_FAILED',
        message: 'Judul karya wajib diisi.',
        status: 422,
      });
    }

    if (!description || typeof description !== 'string') {
      throw new AppError({
        code: 'VALIDATION_FAILED',
        message: 'Deskripsi karya wajib diisi.',
        status: 422,
      });
    }

    const inputImages = imagePaths !== undefined ? imagePaths : images;
    const imagesArray = Array.isArray(inputImages) ? inputImages : [];
    if (imagesArray.length > 5) {
      throw new AppError({
        code: 'VALIDATION_FAILED',
        message: 'Maksimal 5 gambar per karya (K-05).',
        status: 422,
      });
    }

    const finalSlug = slug ? slugify(slug) : slugify(title);
    const existingSlug = await prisma.creativeWork.findUnique({ where: { slug: finalSlug } });
    if (existingSlug) {
      throw new AppError({
        code: 'CONFLICT',
        message: `Slug "${finalSlug}" sudah digunakan oleh karya lain.`,
        status: 409,
      });
    }

    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!cat || cat.kind !== 'WORK_CATEGORY' || !cat.isActive) {
        throw new AppError({
          code: 'VALIDATION_FAILED',
          message: 'Kategori karya tidak valid atau tidak aktif.',
          status: 422,
        });
      }
    }

    const created = await prisma.creativeWork.create({
      data: {
        creativeProfileId: profile.id,
        title: title.trim(),
        slug: finalSlug,
        description: description.trim(),
        imagePaths: JSON.stringify(imagesArray),
        technique: technique ? technique.trim() : null,
        motif: motif ? motif.trim() : null,
        year: year ? parseInt(year, 10) : null,
        categoryId: categoryId || null,
        status: 'DRAFT',
        createdById: req.user!.id,
      },
      include: {
        category: true,
      },
    });

    return res.status(201).json({
      data: {
        ...created,
        images: parseImages(created.imagePaths),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /me/works/:id
creatorWorksRouter.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const work = await prisma.creativeWork.findUnique({
      where: { id },
      include: { category: true, creativeProfile: true },
    });

    if (!work) {
      throw new AppError({ code: 'NOT_FOUND', message: 'Karya tidak ditemukan.', status: 404 });
    }

    // Anti-IDOR check
    const profile = await getLinkedCreativeProfile(req.user!.id, req.user!.role, work.creativeProfileId);
    if (req.user!.role !== 'ADMIN' && work.creativeProfileId !== profile.id) {
      throw new AppError({ code: 'FORBIDDEN', message: 'Anda tidak memiliki hak akses atas karya ini.', status: 403 });
    }

    return res.json({
      data: {
        ...work,
        images: parseImages(work.imagePaths),
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /me/works/:id
creatorWorksRouter.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, slug, description, imagePaths, images, technique, motif, year, categoryId } = req.body;

    const work = await prisma.creativeWork.findUnique({ where: { id } });
    if (!work) {
      throw new AppError({ code: 'NOT_FOUND', message: 'Karya tidak ditemukan.', status: 404 });
    }

    const profile = await getLinkedCreativeProfile(req.user!.id, req.user!.role, work.creativeProfileId);
    if (req.user!.role !== 'ADMIN' && work.creativeProfileId !== profile.id) {
      throw new AppError({ code: 'FORBIDDEN', message: 'Anda tidak memiliki hak akses atas karya ini.', status: 403 });
    }

    const finalSlug = slug ? slugify(slug) : undefined;
    if (finalSlug && finalSlug !== work.slug) {
      const existingSlug = await prisma.creativeWork.findUnique({ where: { slug: finalSlug } });
      if (existingSlug) {
        throw new AppError({
          code: 'CONFLICT',
          message: `Slug "${finalSlug}" sudah digunakan oleh karya lain.`,
          status: 409,
        });
      }
    }

    let imagesString: string | undefined = undefined;
    const inputImages = imagePaths !== undefined ? imagePaths : images;
    if (inputImages !== undefined) {
      if (!Array.isArray(inputImages) || inputImages.length > 5) {
        throw new AppError({
          code: 'VALIDATION_FAILED',
          message: 'Gambar harus berupa array maksimal 5 gambar (K-05).',
          status: 422,
        });
      }
      imagesString = JSON.stringify(inputImages);
    }

    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!cat || cat.kind !== 'WORK_CATEGORY' || !cat.isActive) {
        throw new AppError({
          code: 'VALIDATION_FAILED',
          message: 'Kategori karya tidak valid atau tidak aktif.',
          status: 422,
        });
      }
    }

    // Rule K-03: If creator edits an item that is currently PUBLISHED, revert to PENDING_REVIEW!
    let nextStatus = work.status;
    let reviewNotice: string | undefined = undefined;
    if (req.user!.role !== 'ADMIN' && work.status === 'PUBLISHED') {
      nextStatus = 'PENDING_REVIEW';
      reviewNotice = 'Perubahan pada karya yang sudah terbit telah disimpan dan dikirim kembali untuk peninjauan moderasi (K-03).';
    }

    const updated = await prisma.creativeWork.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        slug: finalSlug,
        description: description !== undefined ? description.trim() : undefined,
        imagePaths: imagesString,
        technique: technique !== undefined ? (technique ? technique.trim() : null) : undefined,
        motif: motif !== undefined ? (motif ? motif.trim() : null) : undefined,
        year: year !== undefined ? (year ? parseInt(year, 10) : null) : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        status: nextStatus,
        updatedById: req.user!.id,
      },
      include: { category: true },
    });

    return res.json({
      data: {
        ...updated,
        images: parseImages(updated.imagePaths),
      },
      notice: reviewNotice,
    });
  } catch (err) {
    next(err);
  }
});

// POST /me/works/:id/submit (DRAFT / NEEDS_REVISION / REJECTED -> PENDING_REVIEW)
creatorWorksRouter.post('/:id/submit', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const work = await prisma.creativeWork.findUnique({ where: { id } });
    if (!work) {
      throw new AppError({ code: 'NOT_FOUND', message: 'Karya tidak ditemukan.', status: 404 });
    }

    const profile = await getLinkedCreativeProfile(req.user!.id, req.user!.role, work.creativeProfileId);
    if (req.user!.role !== 'ADMIN' && work.creativeProfileId !== profile.id) {
      throw new AppError({ code: 'FORBIDDEN', message: 'Anda tidak memiliki hak akses atas karya ini.', status: 403 });
    }

    const allowedFrom = ['DRAFT', 'NEEDS_REVISION', 'REJECTED'];
    if (!allowedFrom.includes(work.status)) {
      throw new AppError({
        code: 'INVALID_STATE_TRANSITION',
        message: `Tidak dapat mengajukan moderasi dari status "${work.status}". Hanya diizinkan dari status DRAFT, NEEDS_REVISION, atau REJECTED.`,
        status: 409,
      });
    }

    // Validation rules before submit
    const images = parseImages(work.imagePaths);
    if (!work.title || work.title.trim().length === 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Judul karya wajib diisi sebelum diajukan.', status: 422 });
    }
    if (images.length === 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Minimal 1 foto karya wajib diunggah sebelum diajukan.', status: 422 });
    }
    if (!work.description || work.description.trim().length === 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Deskripsi karya wajib diisi sebelum diajukan.', status: 422 });
    }

    const updated = await prisma.creativeWork.update({
      where: { id },
      data: {
        status: 'PENDING_REVIEW',
        submittedAt: new Date(),
        updatedById: req.user!.id,
      },
      include: { category: true },
    });

    return res.json({
      data: {
        ...updated,
        images: parseImages(updated.imagePaths),
      },
      message: 'Karya berhasil diajukan untuk peninjauan moderasi Administrator.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /me/works/:id/archive (Any status -> ARCHIVED)
creatorWorksRouter.post('/:id/archive', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const work = await prisma.creativeWork.findUnique({ where: { id } });
    if (!work) {
      throw new AppError({ code: 'NOT_FOUND', message: 'Karya tidak ditemukan.', status: 404 });
    }

    const profile = await getLinkedCreativeProfile(req.user!.id, req.user!.role, work.creativeProfileId);
    if (req.user!.role !== 'ADMIN' && work.creativeProfileId !== profile.id) {
      throw new AppError({ code: 'FORBIDDEN', message: 'Anda tidak memiliki hak akses atas karya ini.', status: 403 });
    }

    if (work.status === 'ARCHIVED') {
      throw new AppError({
        code: 'INVALID_STATE_TRANSITION',
        message: 'Karya sudah dalam status ARCHIVED.',
        status: 409,
      });
    }

    const updated = await prisma.creativeWork.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        updatedById: req.user!.id,
      },
    });

    return res.json({
      data: updated,
      message: 'Karya berhasil diarsipkan.',
    });
  } catch (err) {
    next(err);
  }
});
