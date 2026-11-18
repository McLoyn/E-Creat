import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShoppingBag, Users, ArrowRight } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-canvas border-b border-line pt-8 pb-14 sm:pt-12 sm:pb-20 lg:py-24">
      {/* Subtle decorative editorial backdrop circle */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gold/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-forest/5 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-line shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-terracotta-600 animate-pulse motion-reduce:animate-none" />
              <span className="text-[11px] font-semibold tracking-wider text-ink uppercase">
                Inisiatif Komunitas Kreatif Tuban
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-display font-bold text-ink tracking-tight leading-[1.15]">
              Pusat Eksplorasi &amp; Pemberdayaan{' '}
              <span className="text-forest italic">Ekonomi Kreatif</span>{' '}
              <span className="text-terracotta-600">Tuban</span>
            </h1>

            <p className="text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl">
              Hubungkan ragam karya wastra dan kriya lokal, jelajahi inovasi talenta komunitas, serta temukan produk kreatif Kabupaten Tuban dalam satu pintu ekosistem terpadu.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/showcase"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-tk-md bg-terracotta-600 hover:bg-terracotta text-surface font-semibold text-sm shadow-sm transition motion-reduce:transform-none focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              >
                <Sparkles className="w-4 h-4 text-gold" />
                <span>Jelajahi Showcase</span>
              </Link>
              <Link
                to="/pasar"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-tk-md bg-forest hover:bg-forest-800 text-surface font-semibold text-sm shadow-sm transition motion-reduce:transform-none focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
              >
                <ShoppingBag className="w-4 h-4 text-gold" />
                <span>Pasar Ekraf</span>
              </Link>
              <Link
                to="/creative"
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-tk-md bg-surface hover:bg-canvas text-ink font-semibold text-sm border border-line shadow-2xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
              >
                <Users className="w-4 h-4 text-forest" />
                <span>Direktori Pelaku</span>
                <ArrowRight className="w-4 h-4 text-ink-soft" />
              </Link>
            </div>

            {/* Micro editorial metadata notes */}
            <div className="pt-4 border-t border-line/80 flex flex-wrap items-center gap-6 text-xs text-ink-soft">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                <span>Wastra Tenun Gedog</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta-600" />
                <span>Kriya Tradisi &amp; Modern</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span>Ruang Kolaborasi</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Visual Block with Illustrative Craft Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Forest Architectural Offset Block */}
              <div
                className="absolute -inset-2 sm:-inset-3 rounded-tk-xl bg-forest/10 transform rotate-1 hidden sm:block pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative rounded-tk-xl overflow-hidden border border-line bg-surface shadow-lg">
                <img
                  src="/images/hero-art.svg"
                  alt="Komposisi karya seni kriya dan wastra tenun gedog Tuban"
                  width={800}
                  height={1000}
                  fetchPriority="high"
                  className="w-full h-auto aspect-[4/5] object-cover"
                />

                {/* Floating caption card */}
                <div className="p-4 sm:p-5 bg-surface/95 backdrop-blur-sm border-t border-line flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-ink truncate">
                      Kearifan Tenun &amp; Kriya Lokal
                    </p>
                    <p className="text-[11px] text-ink-soft truncate">
                      Kabupaten Tuban, Jawa Timur
                    </p>
                  </div>
                  <span className="inline-block px-2.5 py-1 rounded-tk-sm bg-canvas border border-line text-[10px] font-semibold text-ink-soft shrink-0">
                    Foto ilustratif
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
