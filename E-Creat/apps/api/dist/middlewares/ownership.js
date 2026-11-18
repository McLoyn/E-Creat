import { prisma } from '../db.js';
import { AppError } from './error.js';
export async function getLinkedCreativeProfile(userId, role, targetProfileId) {
    // If ADMIN and targetProfileId is provided, allow acting on behalf of profile (K-07)
    if (role === 'ADMIN' && targetProfileId) {
        const profile = await prisma.creativeProfile.findUnique({
            where: { id: targetProfileId },
        });
        if (!profile) {
            throw new AppError({
                code: 'NOT_FOUND',
                message: 'Profil pelaku kreatif target tidak ditemukan.',
                status: 404,
            });
        }
        return profile;
    }
    // Look up ownership link
    const ownerLink = await prisma.creativeProfileOwner.findUnique({
        where: { userId },
        include: { creativeProfile: true },
    });
    if (!ownerLink || !ownerLink.creativeProfile) {
        throw new AppError({
            code: 'FORBIDDEN',
            message: 'Akun Anda belum ditautkan ke Profil Pelaku Kreatif oleh Administrator.',
            status: 403,
        });
    }
    return ownerLink.creativeProfile;
}
