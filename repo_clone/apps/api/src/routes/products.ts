import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
import { Prisma, CreativeProduct } from '@prisma/client';
import { requireAuth } from '../middlewares/auth.js';
import { AppError } from '../middlewares/error.js';
import { getLinkedCreativeProfile } from '../middlewares/ownership.js';
import { formatCreatorContact } from '../utils/whatsapp.js';

export const productsRouter = Router();
export const creatorProductsRouter = Router();

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
// PUBLIC PRODUCTS ENDPOINTS
// -----------------------------------------------------------------------------

// GET /products
productsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 12));
    const search = req.query.search as string;
    const typeSlug = req.query.type as string;
    const availability = req.query.availability as string;
    const creatorSlug = req.query.creator as string;

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
        { material: { contains: search } },
      ];
    }

    if (typeSlug) {
      where.productType = { slug: typeSlug, isActive: true };
    }

    if (availability) {
      where.availability = availability.toUpperCase();
    }

    if (creatorSlug) {
      where.creativeProfile = { ...where.creativeProfile, slug: creatorSlug };
    }

    const total = await prisma.creativeProduct.count({ where });
    const products = await prisma.creativeProduct.findMany({
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
        material: true,
        dimensions: true,
        priceMin: true,
        priceMax: true,
        priceUnit: true,
        availability: true,
        publishedAt: true,
        productType: {
          select: { id: true, name: true, slug: true },
        },
        work: {
          select: { id: true, title: true, slug: true },
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

    const formatted = products.map((p) => {
      const images = parseImages(p.imagePaths);
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        coverImage: images[0] || null,
        images,
        material: p.material,
        dimensions: p.dimensions,
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        priceUnit: p.priceUnit,
        availability: p.availability,
        publishedAt: p.publishedAt,
        productType: p.productType,
        work: p.work,
        creator: {
          id: p.creativeProfile.id,
          name: p.creativeProfile.name,
          slug: p.creativeProfile.slug,
          city: p.creativeProfile.city,
          district: p.creativeProfile.district,
          imagePath: p.creativeProfile.imagePath,
          contact: formatCreatorContact(p.creativeProfile, p.title, p.slug, 'product'),
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

// GET /products/:slug
productsRouter.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const product = await prisma.creativeProduct.findUnique({
      where: { slug },
      include: {
        productType: {
          select: { id: true, name: true, slug: true },
        },
        work: {
          select: { id: true, title: true, slug: true, imagePaths: true },
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
      },
    });

    if (!product || product.status !== 'PUBLISHED' || product.creativeProfile.status !== 'PUBLISHED') {
      throw new AppError({
        code: 'NOT_FOUND',
        message: 'Produk tidak ditemukan atau belum dipublikasikan.',
        status: 404,
      });
    }

    const images = parseImages(product.imagePaths);
    const formatted = {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      coverImage: images[0] || null,
      images,
      material: product.material,
      dimensions: product.dimensions,
      priceMin: product.priceMin,
      priceMax: product.priceMax,
      priceUnit: product.priceUnit,
      availability: product.availability,
      publishedAt: product.publishedAt,
      productType: product.productType,
      work: product.work ? {
        id: product.work.id,
        title: product.work.title,
        slug: product.work.slug,
        coverImage: parseImages(product.work.imagePaths)[0] || null,
      } : null,
      creator: {
        id: product.creativeProfile.id,
        name: product.creativeProfile.name,
        slug: product.creativeProfile.slug,
        city: product.creativeProfile.city,
        district: product.creativeProfile.district,
        imagePath: product.creativeProfile.imagePath,
        contact: formatCreatorContact(product.creativeProfile, product.title, product.slug, 'product'),
      },
    };

    return res.json({ data: formatted });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// CREATOR PRODUCTS ENDPOINTS (/me/products)
// -----------------------------------------------------------------------------

// GET /me/products
creatorProductsRouter.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await getLinkedCreativeProfile(req.user!.id, req.user!.role);
    const products = await prisma.creativeProduct.findMany({
      where: { creativeProfileId: profile.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        productType: true,
        work: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    const formatted = products.map((p) => ({
      ...p,
      images: parseImages(p.imagePaths),
    }));

    return res.json({ data: formatted, profile });
  } catch (err) {
    next(err);
  }
});

// POST /me/products
creatorProductsRouter.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      slug,
      description,
      imagePaths,
      images,
      productTypeId,
      workId,
      material,
      dimensions,
      priceMin,
      priceMax,
      priceUnit,
      availability,
      targetProfileId,
    } = req.body;

    const profile = await getLinkedCreativeProfile(req.user!.id, req.user!.role, targetProfileId);

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Nama produk wajib diisi.', status: 422 });
    }

    if (!description || typeof description !== 'string') {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Deskripsi produk wajib diisi.', status: 422 });
    }

    if (!productTypeId) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Jenis produk (productTypeId) wajib dipilih.', status: 422 });
    }

    const typeCat = await prisma.category.findUnique({ where: { id: productTypeId } });
    if (!typeCat || typeCat.kind !== 'PRODUCT_TYPE' || !typeCat.isActive) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Jenis produk tidak valid atau tidak aktif.', status: 422 });
    }

    // Optional workId must belong to the SAME creative profile
    if (workId) {
      const linkedWork = await prisma.creativeWork.findUnique({ where: { id: workId } });
      if (!linkedWork || linkedWork.creativeProfileId !== profile.id) {
        throw new AppError({
          code: 'VALIDATION_FAILED',
          message: 'Karya yang ditautkan harus merupakan milik profil kreator yang sama.',
          status: 422,
        });
      }
    }

    const inputImages = imagePaths !== undefined ? imagePaths : images;
    const imagesArray = Array.isArray(inputImages) ? inputImages : [];
    if (imagesArray.length > 5) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Maksimal 5 foto per produk (K-05).', status: 422 });
    }

    // Price validation
    const pMin = priceMin !== undefined && priceMin !== null ? parseInt(priceMin, 10) : null;
    const pMax = priceMax !== undefined && priceMax !== null ? parseInt(priceMax, 10) : null;
    if (pMin !== null && pMin < 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Harga minimal tidak boleh negatif.', status: 422 });
    }
    if (pMax !== null && pMax < 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Harga maksimal tidak boleh negatif.', status: 422 });
    }
    if (pMin !== null && pMax !== null && pMax < pMin) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Harga maksimal harus lebih besar atau sama dengan harga minimal.', status: 422 });
    }

    const finalSlug = slug ? slugify(slug) : slugify(title);
    const existingSlug = await prisma.creativeProduct.findUnique({ where: { slug: finalSlug } });
    if (existingSlug) {
      throw new AppError({ code: 'CONFLICT', message: `Slug "${finalSlug}" sudah digunakan oleh produk lain.`, status: 409 });
    }

    const validAvailability = ['AVAILABLE', 'MADE_TO_ORDER', 'UNAVAILABLE'].includes(availability)
      ? availability
      : 'AVAILABLE';

    const created = await prisma.creativeProduct.create({
      data: {
        creativeProfileId: profile.id,
        workId: workId || null,
        title: title.trim(),
        slug: finalSlug,
        description: description.trim(),
        imagePaths: JSON.stringify(imagesArray),
        productTypeId,
        material: material ? material.trim() : null,
        dimensions: dimensions ? dimensions.trim() : null,
        priceMin: pMin,
        priceMax: pMax,
        priceUnit: priceUnit ? priceUnit.trim().substring(0, 30) : null,
        availability: validAvailability,
        status: 'DRAFT',
        createdById: req.user!.id,
      },
      include: {
        productType: true,
        work: true,
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

// GET /me/products/:id
creatorProductsRouter.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await prisma.creativeProduct.findUnique({
      where: { id },
      include: { productType: true, work: true, creativeProfile: true },
    });

    if (!product) {
      throw new AppError({ code: 'NOT_FOUND', message: 'Produk tidak ditemukan.', status: 404 });
    }

    const profile = await getLinkedCreativeProfile(req.user!.id, req.user!.role, product.creativeProfileId);
    if (req.user!.role !== 'ADMIN' && product.creativeProfileId !== profile.id) {
      throw new AppError({ code: 'FORBIDDEN', message: 'Anda tidak memiliki hak akses atas produk ini.', status: 403 });
    }

    return res.json({
      data: {
        ...product,
        images: parseImages(product.imagePaths),
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /me/products/:id
creatorProductsRouter.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      description,
      imagePaths,
      images,
      productTypeId,
      workId,
      material,
      dimensions,
      priceMin,
      priceMax,
      priceUnit,
      availability,
    } = req.body;

    const product = await prisma.creativeProduct.findUnique({ where: { id } });
    if (!product) {
      throw new AppError({ code: 'NOT_FOUND', message: 'Produk tidak ditemukan.', status: 404 });
    }

    const profile = await getLinkedCreativeProfile(req.user!.id, req.user!.role, product.creativeProfileId);
    if (req.user!.role !== 'ADMIN' && product.creativeProfileId !== profile.id) {
      throw new AppError({ code: 'FORBIDDEN', message: 'Anda tidak memiliki hak akses atas produk ini.', status: 403 });
    }

    const finalSlug = slug ? slugify(slug) : undefined;
    if (finalSlug && finalSlug !== product.slug) {
      const existingSlug = await prisma.creativeProduct.findUnique({ where: { slug: finalSlug } });
      if (existingSlug) {
        throw new AppError({ code: 'CONFLICT', message: `Slug "${finalSlug}" sudah digunakan oleh produk lain.`, status: 409 });
      }
    }

    if (productTypeId) {
      const typeCat = await prisma.category.findUnique({ where: { id: productTypeId } });
      if (!typeCat || typeCat.kind !== 'PRODUCT_TYPE' || !typeCat.isActive) {
        throw new AppError({ code: 'VALIDATION_FAILED', message: 'Jenis produk tidak valid atau tidak aktif.', status: 422 });
      }
    }

    if (workId) {
      const linkedWork = await prisma.creativeWork.findUnique({ where: { id: workId } });
      if (!linkedWork || linkedWork.creativeProfileId !== profile.id) {
        throw new AppError({
          code: 'VALIDATION_FAILED',
          message: 'Karya yang ditautkan harus merupakan milik profil kreator yang sama.',
          status: 422,
        });
      }
    }

    let imagesString: string | undefined = undefined;
    const inputImages = imagePaths !== undefined ? imagePaths : images;
    if (inputImages !== undefined) {
      if (!Array.isArray(inputImages) || inputImages.length > 5) {
        throw new AppError({ code: 'VALIDATION_FAILED', message: 'Gambar harus berupa array maksimal 5 gambar (K-05).', status: 422 });
      }
      imagesString = JSON.stringify(inputImages);
    }

    // Price validation
    const pMin = priceMin !== undefined ? (priceMin !== null ? parseInt(priceMin, 10) : null) : product.priceMin;
    const pMax = priceMax !== undefined ? (priceMax !== null ? parseInt(priceMax, 10) : null) : product.priceMax;
    if (pMin !== null && pMin < 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Harga minimal tidak boleh negatif.', status: 422 });
    }
    if (pMax !== null && pMax < 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Harga maksimal tidak boleh negatif.', status: 422 });
    }
    if (pMin !== null && pMax !== null && pMax < pMin) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Harga maksimal harus lebih besar atau sama dengan harga minimal.', status: 422 });
    }

    // Rule K-03: Revert to PENDING_REVIEW if edited by creator while PUBLISHED
    let nextStatus = product.status;
    let reviewNotice: string | undefined = undefined;
    if (req.user!.role !== 'ADMIN' && product.status === 'PUBLISHED') {
      nextStatus = 'PENDING_REVIEW';
      reviewNotice = 'Perubahan pada produk yang sudah terbit telah disimpan dan dikirim kembali untuk peninjauan moderasi (K-03).';
    }

    const updated = await prisma.creativeProduct.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        slug: finalSlug,
        description: description !== undefined ? description.trim() : undefined,
        imagePaths: imagesString,
        productTypeId: productTypeId !== undefined ? productTypeId : undefined,
        workId: workId !== undefined ? (workId || null) : undefined,
        material: material !== undefined ? (material ? material.trim() : null) : undefined,
        dimensions: dimensions !== undefined ? (dimensions ? dimensions.trim() : null) : undefined,
        priceMin: pMin,
        priceMax: pMax,
        priceUnit: priceUnit !== undefined ? (priceUnit ? priceUnit.trim().substring(0, 30) : null) : undefined,
        availability: availability !== undefined ? availability : undefined,
        status: nextStatus,
        updatedById: req.user!.id,
      },
      include: {
        productType: true,
        work: true,
      },
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

// POST /me/products/:id/submit
creatorProductsRouter.post('/:id/submit', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await prisma.creativeProduct.findUnique({ where: { id } });
    if (!product) {
      throw new AppError({ code: 'NOT_FOUND', message: 'Produk tidak ditemukan.', status: 404 });
    }

    const profile = await getLinkedCreativeProfile(req.user!.id, req.user!.role, product.creativeProfileId);
    if (req.user!.role !== 'ADMIN' && product.creativeProfileId !== profile.id) {
      throw new AppError({ code: 'FORBIDDEN', message: 'Anda tidak memiliki hak akses atas produk ini.', status: 403 });
    }

    const allowedFrom = ['DRAFT', 'NEEDS_REVISION', 'REJECTED'];
    if (!allowedFrom.includes(product.status)) {
      throw new AppError({
        code: 'INVALID_STATE_TRANSITION',
        message: `Tidak dapat mengajukan moderasi dari status "${product.status}". Hanya diizinkan dari status DRAFT, NEEDS_REVISION, atau REJECTED.`,
        status: 409,
      });
    }

    const images = parseImages(product.imagePaths);
    if (!product.title || product.title.trim().length === 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Nama produk wajib diisi sebelum diajukan.', status: 422 });
    }
    if (images.length === 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Minimal 1 foto produk wajib diunggah sebelum diajukan.', status: 422 });
    }
    if (!product.description || product.description.trim().length === 0) {
      throw new AppError({ code: 'VALIDATION_FAILED', message: 'Deskripsi produk wajib diisi sebelum diajukan.', status: 422 });
    }

    const updated = await prisma.creativeProduct.update({
      where: { id },
      data: {
        status: 'PENDING_REVIEW',
        submittedAt: new Date(),
        updatedById: req.user!.id,
      },
      include: { productType: true },
    });

    return res.json({
      data: {
        ...updated,
        images: parseImages(updated.imagePaths),
      },
      message: 'Produk berhasil diajukan untuk peninjauan moderasi Administrator.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /me/products/:id/archive
creatorProductsRouter.post('/:id/archive', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await prisma.creativeProduct.findUnique({ where: { id } });
    if (!product) {
      throw new AppError({ code: 'NOT_FOUND', message: 'Produk tidak ditemukan.', status: 404 });
    }

    const profile = await getLinkedCreativeProfile(req.user!.id, req.user!.role, product.creativeProfileId);
    if (req.user!.role !== 'ADMIN' && product.creativeProfileId !== profile.id) {
      throw new AppError({ code: 'FORBIDDEN', message: 'Anda tidak memiliki hak akses atas produk ini.', status: 403 });
    }

    if (product.status === 'ARCHIVED') {
      throw new AppError({ code: 'INVALID_STATE_TRANSITION', message: 'Produk sudah dalam status ARCHIVED.', status: 409 });
    }

    const updated = await prisma.creativeProduct.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        updatedById: req.user!.id,
      },
    });

    return res.json({
      data: updated,
      message: 'Produk berhasil diarsipkan.',
    });
  } catch (err) {
    next(err);
  }
});
