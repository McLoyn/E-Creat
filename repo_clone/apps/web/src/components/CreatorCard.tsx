import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Badge } from './Badge.js';

export interface CreatorCardData {
  id: string;
  name: string;
  slug: string;
  summary?: string | null;
  imagePath?: string | null;
  city?: string;
  district?: string | null;
  categories?: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}

interface CreatorCardProps {
  creator: CreatorCardData;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({ creator }) => {
  const locationText = [creator.district, creator.city || 'Tuban'].filter(Boolean).join(', ');

  return (
    <article className="group flex flex-col justify-between rounded-tk-lg bg-surface border border-line shadow-sm hover:shadow-md hover:border-forest/40 transition overflow-hidden">
      <div>
        {/* Creator Image with fixed aspect-ratio box */}
        <Link
          to={`/creative/${creator.slug}`}
          className="relative block aspect-[16/10] bg-canvas overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
          tabIndex={-1}
          aria-hidden="true"
        >
          {creator.imagePath ? (
            <img
              src={creator.imagePath}
              alt={creator.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 motion-reduce:transform-none transition duration-500"
            />
          ) : (
            <div className="w-full h-full bg-canvas flex items-center justify-center text-forest font-display font-bold text-3xl">
              {creator.name[0] || 'K'}
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3">
          {creator.categories && creator.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {creator.categories.slice(0, 2).map((item) => (
                <Badge key={item.category.id}>{item.category.name}</Badge>
              ))}
            </div>
          )}

          <div>
            <h3 className="font-display font-bold text-lg text-ink group-hover:text-forest transition-colors line-clamp-1">
              <Link
                to={`/creative/${creator.slug}`}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded-xs"
              >
                {creator.name}
              </Link>
            </h3>

            {creator.summary && (
              <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed mt-1.5">
                {creator.summary}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Location & Profile Link */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-ink-soft">
          <span className="flex items-center gap-1 truncate" title={locationText}>
            <MapPin className="w-3.5 h-3.5 text-forest shrink-0" />
            <span className="truncate">{locationText || 'Kabupaten Tuban'}</span>
          </span>

          <Link
            to={`/creative/${creator.slug}`}
            className="inline-flex items-center gap-1 font-semibold text-terracotta-600 hover:text-terracotta transition shrink-0 ml-2"
            aria-label={`Lihat profil ${creator.name}`}
          >
            <span>Profil</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  );
};
