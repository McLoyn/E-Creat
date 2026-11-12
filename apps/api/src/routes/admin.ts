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
        users: {
          total: totalUsers,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});
