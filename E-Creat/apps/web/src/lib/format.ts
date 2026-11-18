/**
 * Utility pemformatan mata uang dan teks harga untuk Ekraf HUB
 */

export function formatPrice(price: number | null | undefined, unit?: string | null): string {
  if (price === null || price === undefined || isNaN(price)) {
    return 'Tanyakan harga';
  }
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price);

  return unit ? `${formatted} / ${unit}` : formatted;
}

export function formatPriceRange(
  minPrice: number | null | undefined,
  maxPrice: number | null | undefined,
  unit?: string | null
): string {
  if ((minPrice === null || minPrice === undefined) && (maxPrice === null || maxPrice === undefined)) {
    return 'Tanyakan harga';
  }
  if (minPrice != null && (maxPrice == null || minPrice === maxPrice)) {
    return formatPrice(minPrice, unit);
  }
  if (minPrice != null && maxPrice != null) {
    const fMin = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(minPrice);
    const fMax = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(maxPrice);
    return unit ? `${fMin} – ${fMax} / ${unit}` : `${fMin} – ${fMax}`;
  }
  return formatPrice(maxPrice, unit);
}
