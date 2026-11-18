import React from 'react';
import { HeroSection } from '../components/landing/HeroSection.js';
import { EcosystemSection } from '../components/landing/EcosystemSection.js';
import { FeaturedProductsSection } from '../components/landing/FeaturedProductsSection.js';
import { FeaturedCreatorsSection } from '../components/landing/FeaturedCreatorsSection.js';
import { LocalStoriesSection } from '../components/landing/LocalStoriesSection.js';
import { JoinCtaSection } from '../components/landing/JoinCtaSection.js';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col bg-canvas text-ink">
      {/* 1. Hero Editorial */}
      <HeroSection />

      {/* 2. Jelajahi Pilar Ekosistem */}
      <EcosystemSection />

      {/* 3. Produk Pilihan Komunitas */}
      <FeaturedProductsSection />

      {/* 4. Pelaku Kreatif Unggulan */}
      <FeaturedCreatorsSection />

      {/* 5. Cerita & Potensi Lokal Tuban */}
      <LocalStoriesSection />

      {/* 6. CTA Bergabung */}
      <JoinCtaSection />
    </div>
  );
};
