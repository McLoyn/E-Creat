import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middlewares/auth.js';

export const adminRouter = Router();

// GET /admin/overview
adminRouter.get('/overview', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalSubApps,
      publishedSubApps,
      draftSubApps,
      archivedSubApps,
      totalCreatives,
      publishedCreatives,
      draftCreatives,
      archivedCreatives,
      totalCategories,
      subsectorCount,
      subappTypeCount,
      totalUsers,
      totalWorks,
      pendingWorks,
      publishedWorks,
      totalProducts,
      pendingProducts,
      publishedProducts,
    ] = await Promise.all([
      prisma.subApp.count(),
      prisma.subApp.count({ where: { status: 'PUBLISHED' } }),
      prisma.subApp.count({ where: { status: 'DRAFT' } }),
      prisma.subApp.count({ where: { status: 'ARCHIVED' } }),
      prisma.creativeProfile.count(),
      prisma.creativeProfile.count({ where: { status: 'PUBLISHED' } }),
      prisma.creativeProfile.count({ where: { status: 'DRAFT' } }),
      prisma.creativeProfile.count({ where: { status: 'ARCHIVED' } }),
      prisma.category.count(),
      prisma.category.count({ where: { kind: 'SUBSECTOR' } }),
      prisma.category.count({ where: { kind: 'SUBAPP_TYPE' } }),
      prisma.user.count(),
      prisma.creativeWork.count(),
      prisma.creativeWork.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.creativeWork.count({ where: { status: 'PUBLISHED' } }),
      prisma.creativeProduct.count(),
      prisma.creativeProduct.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.creativeProduct.count({ where: { status: 'PUBLISHED' } }),
    ]);

    return res.json({
      data: {
        subApps: {
          total: totalSubApps,
          published: publishedSubApps,
          draft: draftSubApps,
          archived: archivedSubApps,
        },
        creatives: {
          total: totalCreatives,
          published: publishedCreatives,
          draft: draftCreatives,
          archived: archivedCreatives,
        },
        categories: {
          total: totalCategories,
          subsectors: subsectorCount,
          subappTypes: subappTypeCount,
        },
        works: {
          total: totalWorks,
          pending: pendingWorks,
          published: publishedWorks,
        },
        products: {
          total: totalProducts,
          pending: pendingProducts,
          published: publishedProducts,
        },
        users: {
          total: totalUsers,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/users
adminRouter.get('/users', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: { displayName: true },
        },
        creatorOwnership: {
          select: {
            creativeProfileId: true,
            creativeProfile: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    return res.json({ data: users });
  } catch (err) {
    next(err);
  }
});
