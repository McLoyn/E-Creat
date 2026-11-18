import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatPriceRange } from '../lib/format.js';

export interface ProductCardData {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage: string | null;
  priceMin: number | null;
  priceMax: number | null;
  priceUnit: string | null;
  availability?: string;
  productType?: { id: string; name: string; slug: string } | null;
  creator: {
    id: string;
    name: string;
    slug: string;
    city?: string;
    district?: string | null;
    imagePath?: string | null;
  };
}

interface ProductCardProps {
  product: ProductCardData;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const priceDisplay = formatPriceRange(product.priceMin, product.priceMax, product.priceUnit);

  return (
    <article className="group flex flex-col rounded-tk-lg bg-surface border border-line shadow-sm hover:shadow-md hover:border-terracotta/40 transition overflow-hidden">
      {/* Product Image with fixed aspect-ratio box */}
      <Link
        to={`/pasar/${product.slug}`}
        className="relative block aspect-[4/3] bg-canvas overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
        tabIndex={-1}
        aria-hidden="true"
      >
        {product.coverImage ? (
          <img
            src={product.coverImage}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 motion-reduce:transform-none transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-ink-soft bg-canvas">
            <ShoppingBag className="w-10 h-10 stroke-1 text-muted" />
            <span className="text-[11px] mt-1 text-ink-soft">Foto produk</span>
          </div>
        )}

        {product.productType && (
          <div className="absolute top-3 left-3">
            <span className="inline-block text-[11px] font-semibold text-forest bg-surface/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-line shadow-xs">
              {product.productType.name}
            </span>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <h3 className="font-display font-bold text-base text-ink group-hover:text-terracotta-600 transition-colors line-clamp-2">
            <Link
              to={`/pasar/${product.slug}`}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded-xs"
            >
              {product.title}
            </Link>
          </h3>

          <div className="text-sm sm:text-base font-bold text-forest">
            {priceDisplay}
          </div>

          {product.description && (
            <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Creator & Link */}
        <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
          <Link
            to={`/creative/${product.creator.slug}`}
            className="flex items-center gap-2 min-w-0 group/creator text-xs font-semibold text-ink-soft hover:text-ink transition truncate focus:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded-xs"
          >
            <div className="w-5 h-5 rounded-full bg-canvas border border-line overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold text-forest">
              {product.creator.imagePath ? (
                <img
                  src={product.creator.imagePath}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{product.creator.name[0] || 'K'}</span>
              )}
            </div>
            <span className="truncate">{product.creator.name}</span>
          </Link>

          <Link
            to={`/pasar/${product.slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta-600 hover:text-terracotta transition shrink-0"
            aria-label={`Lihat detail produk ${product.title}`}
          >
            <span>Detail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};
