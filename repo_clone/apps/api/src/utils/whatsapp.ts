export interface ContactInfo {
  whatsappNumber: string | null;
  whatsappUrl: string | null;
  instagramHandle: string | null;
  websiteUrl: string | null;
}

/**
 * Normalizes WhatsApp phone number to standard international format without leading '+'
 * Rules:
 * - Strip all non-digit characters
 * - If starts with '0', replace with '62' (Indonesia country code)
 * - If starts with '8', prefix with '62'
 * - Length must be between 9 and 15 digits
 * - Returns normalized string or null if invalid
 */
export function normalizeWhatsappNumber(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;

  let cleaned = raw.replace(/\D/g, '');
  if (!cleaned) return null;

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }

  if (cleaned.length < 9 || cleaned.length > 15) {
    return null;
  }

  return cleaned;
}

/**
 * Builds pre-filled WhatsApp message URL
 */
export function buildWhatsappUrl(
  phone: string | null,
  itemTitle?: string,
  pageUrl?: string
): string | null {
  if (!phone) return null;

  let text = 'Halo, saya tertarik dengan karya/produk Anda di Ekraf HUB Tuban.';
  if (itemTitle) {
    text = `Halo, saya tertarik dengan "${itemTitle}" di Ekraf HUB Tuban.`;
  }
  if (pageUrl) {
    text += ` Tautan: ${pageUrl}`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Formats full contact response object
 */
export function formatCreatorContact(
  profile: {
    whatsappNumber?: string | null;
    instagramHandle?: string | null;
    websiteUrl?: string | null;
  },
  itemTitle?: string,
  itemSlug?: string,
  itemType: 'work' | 'product' = 'product'
): ContactInfo {
  const normalizedPhone = normalizeWhatsappNumber(profile.whatsappNumber);
  const pageUrl = itemSlug ? `https://ekraftuban.id/${itemType === 'work' ? 'showcase' : 'pasar'}/${itemSlug}` : undefined;
  const whatsappUrl = buildWhatsappUrl(normalizedPhone, itemTitle, pageUrl);

  return {
    whatsappNumber: normalizedPhone,
    whatsappUrl,
    instagramHandle: profile.instagramHandle || null,
    websiteUrl: profile.websiteUrl || null,
  };
}
