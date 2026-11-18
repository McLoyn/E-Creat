import React from 'react';
import { Link } from 'react-router-dom';
import { Grid, Sparkles, ShoppingBag, Users, ArrowUpRight } from 'lucide-react';

const ECOSYSTEM_ITEMS = [
  {
    title: 'Direktori Sub-Aplikasi',
    category: 'Layanan Digital',
    description: 'Menghubungkan platform dan inisiatif digital komunitas kreatif Tuban dalam satu ekosistem terpadu.',
    href: '/sub-apps',
    icon: Grid,
    badgeText: 'Katalog Inisiatif',
  },
  {
    title: 'Showcase Karya Seni',
    category: 'Eksplorasi Karya',
    description: 'Galeri kurasi wastra tenun gedog, kriya tradisional, dan karya visual representasi budaya Tuban.',
    href: '/showcase',
    icon: Sparkles,
    badgeText: 'Galeri Komunitas',
  },
  {
    title: 'Pasar Ekraf Tuban',
    category: 'Komersialisasi',
    description: 'Etalase produk jadi dan karya kriya siap pakai, menghubungkan penikmat karya langsung dengan kreator.',
    href: '/pasar',
    icon: ShoppingBag,
    badgeText: 'Etalase Produk',
  },
  {
    title: 'Direktori Pelaku Kreatif',
    category: 'Jejaring Talenta',
    description: 'Pemetaan profil kreator, pengrajin, dan studio kreatif di seluruh kecamatan Kabupaten Tuban.',
    href: '/creative',
    icon: Users,
    badgeText: 'Profil Kreator',
  },
];

export const EcosystemSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-surface border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 sm:mb-14">
          <span className="text-xs font-bold text-terracotta-600 uppercase tracking-wider">
            Struktur Ekosistem
          </span>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-ink">
            Jelajahi Pilar Ekosistem Ekraf
          </h2>
          <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
            Pusat terintegrasi untuk mendukung pertumbuhan, promosi karya, dan jejaring kolaboratif pelaku kreatif di Kabupaten Tuban.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ECOSYSTEM_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.href}
                className="group flex flex-col justify-between p-6 rounded-tk-lg bg-canvas border border-line shadow-2xs hover:shadow-md hover:border-forest/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-11 h-11 rounded-tk-md bg-surface border border-line flex items-center justify-center text-forest group-hover:bg-forest group-hover:text-gold transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold text-forest bg-surface px-2.5 py-0.5 rounded-full border border-line">
                      {item.badgeText}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-terracotta-600 uppercase tracking-wide block mb-1">
                    {item.category}
                  </span>
                  <h3 className="font-display font-bold text-lg text-ink group-hover:text-forest transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-line/80 flex items-center justify-between text-xs font-semibold text-ink group-hover:text-forest transition-colors">
                  <span>Buka Direktori</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
