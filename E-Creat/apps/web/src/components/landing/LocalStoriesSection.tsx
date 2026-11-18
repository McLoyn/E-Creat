import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';

const STORIES = [
  {
    id: 'gedog-tradisi',
    tag: 'Wastra Tradisi',
    title: 'Tenun Gedog Kerek: Dedikasi Tenun Manual di Atas Serat Kapas Murni',
    excerpt:
      'Dari pemintalan benang kapas di ladang sendiri hingga penenunan dengan alat gedog kayu berirama khas, setiap helai kain merangkum doa dan sejarah leluhur Tuban.',
    href: '/showcase',
    readTime: 'Sorotan Warisan Budaya',
  },
  {
    id: 'kriya-pesisir',
    tag: 'Eksplorasi Kriya',
    title: 'Menyusuri Jejak Gerabah dan Ukir Pesisir yang Beradaptasi Zaman',
    excerpt:
      'Komunitas perajin pesisir Tuban memadukan teknik cetak tanah liat dan ukiran kayu tradisional dengan pendekatan desain fungsional untuk kebutuhan dekorasi masa kini.',
    href: '/showcase',
    readTime: 'Narasi Kreatif',
  },
  {
    id: 'jejaring-komunitas',
    tag: 'Kolaborasi Lokal',
    title: 'Membangun Ruang Kolektif bagi Talenta Muda Tuban',
    excerpt:
      'Bagaimana inisiatif independen menjadi ruang temu antargenerasi: menghubungkan perajin sepuh dengan kreator digital untuk melestarikan dan merevitalisasi nilai lokal.',
    href: '/showcase',
    readTime: 'Inisiatif Mandiri',
  },
];

export const LocalStoriesSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-canvas border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div className="space-y-2">
            <span className="text-xs font-bold text-terracotta-600 uppercase tracking-wider">
              Khazanah Budaya &amp; Narasi
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-ink">
              Cerita &amp; Potensi Lokal Tuban
            </h2>
            <p className="text-sm sm:text-base text-ink-soft max-w-xl">
              Menyelami filosofi wastra, kearifan kriya pesisir, dan semangat inovasi karya komunitas yang hidup di Bumi Ronggolawe.
            </p>
          </div>

          <Link
            to="/showcase"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta-600 hover:text-terracotta transition shrink-0 self-start sm:self-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded-xs"
          >
            <span>Eksplorasi Showcase Karya</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STORIES.map((story) => (
            <article
              key={story.id}
              className="flex flex-col justify-between p-6 sm:p-7 rounded-tk-lg bg-surface border border-line shadow-2xs hover:shadow-md hover:border-terracotta/40 transition group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-ink-soft">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-canvas text-forest font-semibold border border-line text-[11px]">
                    {story.tag}
                  </span>
                  <span className="text-[11px] text-ink-soft">{story.readTime}</span>
                </div>

                <h3 className="font-display font-bold text-lg sm:text-xl text-ink group-hover:text-terracotta-600 transition-colors leading-snug">
                  <Link
                    to={story.href}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded-xs"
                  >
                    {story.title}
                  </Link>
                </h3>

                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  {story.excerpt}
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-line flex items-center justify-between text-xs font-semibold text-forest group-hover:text-terracotta-600 transition-colors">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>Buka di Showcase</span>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 motion-reduce:transform-none transition-transform" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
