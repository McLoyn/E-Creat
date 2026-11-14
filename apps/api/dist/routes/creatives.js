import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middlewares/auth.js';
import { AppError } from '../middlewares/error.js';
export const creativeProfilesRouter = Router();
export const adminCreativeProfilesRouter = Router();
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
// Public: GET /creative-profiles
creativeProfilesRouter.get('/', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 12));
        const search = req.query.search;
        const subsectorSlug = req.query.subsector;
        const city = req.query.city;
        const district = req.query.district;
        const where = {
            status: 'PUBLISHED',
        };
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { summary: { contains: search } },
                { description: { contains: search } },
            ];
        }
        if (subsectorSlug) {
            where.categories = {
                some: {
                    category: {
                        slug: subsectorSlug,
                        isActive: true,
                    },
                },
            };
        }
        if (city) {
            where.city = { contains: city };
        }
        if (district) {
            where.district = { contains: district };
        }
        const total = await prisma.creativeProfile.count({ where });
        const profiles = await prisma.creativeProfile.findMany({
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
            data: profiles,
            meta: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize) || 1,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// Public: GET /creative-profiles/:slug
creativeProfilesRouter.get('/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const profile = await prisma.creativeProfile.findUnique({
            where: { slug },
            include: {
                categories: {
                    include: { category: true },
                },
            },
        });
        if (!profile || profile.status !== 'PUBLISHED') {
            throw new AppError({
                code: 'NOT_FOUND',
                message: 'Profil Pelaku Kreatif tidak ditemukan atau belum dipublikasikan.',
                status: 404,
            });
        }
        return res.json({ data: profile });
    }
    catch (err) {
        next(err);
    }
});
// Public: GET /creative-profiles/:slug/works
creativeProfilesRouter.get('/:slug/works', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const profile = await prisma.creativeProfile.findUnique({
            where: { slug },
            select: { id: true, status: true },
        });
        if (!profile || profile.status !== 'PUBLISHED') {
            throw new AppError({ code: 'NOT_FOUND', message: 'Profil Pelaku Kreatif tidak ditemukan atau belum dipublikasikan.', status: 404 });
        }
        const works = await prisma.creativeWork.findMany({
            where: { creativeProfileId: profile.id, status: 'PUBLISHED' },
            orderBy: { publishedAt: 'desc' },
            include: { category: true },
        });
        const formatted = works.map((w) => {
            let images = [];
            try {
                images = JSON.parse(w.imagePaths);
            }
            catch { }
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
            };
        });
        return res.json({ data: formatted });
    }
    catch (err) {
        next(err);
    }
});
// Public: GET /creative-profiles/:slug/products
creativeProfilesRouter.get('/:slug/products', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const profile = await prisma.creativeProfile.findUnique({
            where: { slug },
            select: { id: true, status: true },
        });
        if (!profile || profile.status !== 'PUBLISHED') {
            throw new AppError({ code: 'NOT_FOUND', message: 'Profil Pelaku Kreatif tidak ditemukan atau belum dipublikasikan.', status: 404 });
        }
        const products = await prisma.creativeProduct.findMany({
            where: { creativeProfileId: profile.id, status: 'PUBLISHED' },
            orderBy: { publishedAt: 'desc' },
            include: { productType: true, work: true },
        });
        const formatted = products.map((p) => {
            let images = [];
            try {
                images = JSON.parse(p.imagePaths);
            }
            catch { }
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
            };
        });
        return res.json({ data: formatted });
    }
    catch (err) {
        next(err);
    }
});
// Admin: GET /admin/creative-profiles
adminCreativeProfilesRouter.get('/', requireAdmin, async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 12));
        const status = req.query.status;
        const search = req.query.search;
        const where = {};
        if (status) {
            where.status = status.toUpperCase();
        }
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { summary: { contains: search } },
            ];
        }
        const total = await prisma.creativeProfile.count({ where });
        const profiles = await prisma.creativeProfile.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: {
                categories: {
                    include: { category: true },
                },
                owner: {
                    include: {
                        user: { select: { id: true, email: true, profile: true } },
                    },
                },
                _count: {
                    select: { works: true, products: true },
                },
            },
        });
        return res.json({
            data: profiles,
            meta: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize) || 1,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// Admin: GET /admin/creative-profiles/:id
adminCreativeProfilesRouter.get('/:id', requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const profile = await prisma.creativeProfile.findUnique({
            where: { id },
            include: {
                categories: {
                    include: { category: true },
                },
                owner: {
                    include: {
                        user: { select: { id: true, email: true, profile: true } },
                    },
                },
                _count: {
                    select: { works: true, products: true },
                },
            },
        });
        if (!profile) {
            throw new AppError({
                code: 'NOT_FOUND',
                message: 'Profil Pelaku Kreatif tidak ditemukan.',
                status: 404,
            });
        }
        return res.json({ data: profile });
    }
    catch (err) {
        next(err);
    }
});
// Admin: POST /admin/creative-profiles
adminCreativeProfilesRouter.post('/', requireAdmin, async (req, res, next) => {
    try {
        const { name, slug, summary, description, city, district, imagePath, websiteUrl, instagramHandle, whatsappNumber, categoryIds, } = req.body;
        if (!name || !summary || !description || !city) {
            throw new AppError({
                code: 'VALIDATION_FAILED',
                message: 'Nama, ringkasan, deskripsi, dan kota/kabupaten wajib diisi.',
                status: 422,
            });
        }
        const finalSlug = slug ? slugify(slug) : slugify(name);
        const existing = await prisma.creativeProfile.findUnique({ where: { slug: finalSlug } });
        if (existing) {
            throw new AppError({
                code: 'CONFLICT',
                message: `Slug "${finalSlug}" sudah digunakan oleh Pelaku Kreatif lain.`,
                status: 409,
            });
        }
        if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
            const activeCats = await prisma.category.findMany({
                where: { id: { in: categoryIds }, kind: 'SUBSECTOR', isActive: true },
            });
            if (activeCats.length !== categoryIds.length) {
                throw new AppError({
                    code: 'VALIDATION_FAILED',
                    message: 'Kategori harus berupa SUBSECTOR yang aktif.',
                    status: 422,
                });
            }
        }
        const created = await prisma.creativeProfile.create({
            data: {
                name: name.trim(),
                slug: finalSlug,
                summary: summary.trim(),
                description: description.trim(),
                city: city.trim(),
                district: district ? district.trim() : null,
                imagePath: imagePath ? imagePath.trim() : null,
                websiteUrl: websiteUrl ? websiteUrl.trim() : null,
                instagramHandle: instagramHandle ? instagramHandle.trim() : null,
                whatsappNumber: whatsappNumber ? whatsappNumber.trim() : null,
                status: 'DRAFT',
                createdById: req.user.id,
                categories: categoryIds && Array.isArray(categoryIds)
                    ? {
                        create: categoryIds.map((catId) => ({
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
    }
    catch (err) {
        next(err);
    }
});
// Admin: PATCH /admin/creative-profiles/:id
adminCreativeProfilesRouter.patch('/:id', requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, summary, description, city, district, imagePath, websiteUrl, instagramHandle, whatsappNumber, categoryIds, } = req.body;
        const profile = await prisma.creativeProfile.findUnique({ where: { id } });
        if (!profile) {
            throw new AppError({
                code: 'NOT_FOUND',
                message: 'Profil Pelaku Kreatif tidak ditemukan.',
                status: 404,
            });
        }
        const finalSlug = slug !== undefined ? slugify(slug) : undefined;
        if (finalSlug && finalSlug !== profile.slug) {
            const existing = await prisma.creativeProfile.findUnique({ where: { slug: finalSlug } });
            if (existing) {
                throw new AppError({
                    code: 'CONFLICT',
                    message: `Slug "${finalSlug}" sudah digunakan oleh Pelaku Kreatif lain.`,
                    status: 409,
                });
            }
        }
        if (categoryIds !== undefined && Array.isArray(categoryIds) && categoryIds.length > 0) {
            const activeCats = await prisma.category.findMany({
                where: { id: { in: categoryIds }, kind: 'SUBSECTOR', isActive: true },
            });
            if (activeCats.length !== categoryIds.length) {
                throw new AppError({
                    code: 'VALIDATION_FAILED',
                    message: 'Kategori harus berupa SUBSECTOR yang aktif.',
                    status: 422,
                });
            }
        }
        const updated = await prisma.$transaction(async (tx) => {
            if (categoryIds !== undefined && Array.isArray(categoryIds)) {
                await tx.creativeProfileCategory.deleteMany({ where: { creativeProfileId: id } });
                if (categoryIds.length > 0) {
                    await tx.creativeProfileCategory.createMany({
                        data: categoryIds.map((catId) => ({
                            creativeProfileId: id,
                            categoryId: catId,
                        })),
                    });
                }
            }
            return tx.creativeProfile.update({
                where: { id },
                data: {
                    name: name !== undefined ? name.trim() : undefined,
                    slug: finalSlug,
                    summary: summary !== undefined ? summary.trim() : undefined,
                    description: description !== undefined ? description.trim() : undefined,
                    city: city !== undefined ? city.trim() : undefined,
                    district: district !== undefined ? (district ? district.trim() : null) : undefined,
                    imagePath: imagePath !== undefined ? (imagePath ? imagePath.trim() : null) : undefined,
                    websiteUrl: websiteUrl !== undefined ? (websiteUrl ? websiteUrl.trim() : null) : undefined,
                    instagramHandle: instagramHandle !== undefined ? (instagramHandle ? instagramHandle.trim() : null) : undefined,
                    whatsappNumber: whatsappNumber !== undefined ? (whatsappNumber ? whatsappNumber.trim() : null) : undefined,
                    updatedById: req.user.id,
                },
                include: {
                    categories: {
                        include: { category: true },
                    },
                },
            });
        });
        return res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
// Admin: Lifecycle State Machine
// POST /admin/creative-profiles/:id/publish (DRAFT -> PUBLISHED)
adminCreativeProfilesRouter.post('/:id/publish', requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const profile = await prisma.creativeProfile.findUnique({
            where: { id },
            include: {
                categories: {
                    include: { category: true },
                },
            },
        });
        if (!profile) {
            throw new AppError({ code: 'NOT_FOUND', message: 'Profil Pelaku Kreatif tidak ditemukan.', status: 404 });
        }
        if (profile.status !== 'DRAFT') {
            throw new AppError({
                code: 'INVALID_STATE_TRANSITION',
                message: `Tidak dapat mempublikasikan dari status "${profile.status}". Publikasi hanya valid dari status DRAFT.`,
                status: 409,
            });
        }
        const hasActiveCategory = profile.categories.some((c) => c.category.isActive);
        if (!hasActiveCategory) {
            throw new AppError({
                code: 'INVALID_STATE_TRANSITION',
                message: 'Profil Pelaku Kreatif wajib memiliki setidaknya satu subsektor aktif sebelum dipublikasikan.',
                status: 409,
            });
        }
        const updated = await prisma.creativeProfile.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
                updatedById: req.user.id,
            },
            include: {
                categories: {
                    include: { category: true },
                },
            },
        });
        return res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
// POST /admin/creative-profiles/:id/unpublish (PUBLISHED -> DRAFT)
adminCreativeProfilesRouter.post('/:id/unpublish', requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const profile = await prisma.creativeProfile.findUnique({ where: { id } });
        if (!profile) {
            throw new AppError({ code: 'NOT_FOUND', message: 'Profil Pelaku Kreatif tidak ditemukan.', status: 404 });
        }
        if (profile.status !== 'PUBLISHED') {
            throw new AppError({
                code: 'INVALID_STATE_TRANSITION',
                message: `Tidak dapat membatalkan publikasi dari status "${profile.status}".`,
                status: 409,
            });
        }
        const updated = await prisma.creativeProfile.update({
            where: { id },
            data: {
                status: 'DRAFT',
                updatedById: req.user.id,
            },
        });
        return res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
// POST /admin/creative-profiles/:id/archive (DRAFT or PUBLISHED -> ARCHIVED)
adminCreativeProfilesRouter.post('/:id/archive', requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const profile = await prisma.creativeProfile.findUnique({ where: { id } });
        if (!profile) {
            throw new AppError({ code: 'NOT_FOUND', message: 'Profil Pelaku Kreatif tidak ditemukan.', status: 404 });
        }
        if (profile.status === 'ARCHIVED') {
            throw new AppError({
                code: 'INVALID_STATE_TRANSITION',
                message: 'Profil Pelaku Kreatif sudah berstatus ARCHIVED.',
                status: 409,
            });
        }
        const updated = await prisma.creativeProfile.update({
            where: { id },
            data: {
                status: 'ARCHIVED',
                archivedAt: new Date(),
                updatedById: req.user.id,
            },
        });
        return res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
// POST /admin/creative-profiles/:id/restore (ARCHIVED -> DRAFT)
adminCreativeProfilesRouter.post('/:id/restore', requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const profile = await prisma.creativeProfile.findUnique({ where: { id } });
        if (!profile) {
            throw new AppError({ code: 'NOT_FOUND', message: 'Profil Pelaku Kreatif tidak ditemukan.', status: 404 });
        }
        if (profile.status !== 'ARCHIVED') {
            throw new AppError({
                code: 'INVALID_STATE_TRANSITION',
                message: 'Hanya item berstatus ARCHIVED yang dapat dipulihkan ke DRAFT.',
                status: 409,
            });
        }
        const updated = await prisma.creativeProfile.update({
            where: { id },
            data: {
                status: 'DRAFT',
                updatedById: req.user.id,
            },
        });
        return res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
