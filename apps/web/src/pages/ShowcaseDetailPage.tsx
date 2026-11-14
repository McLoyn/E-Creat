import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import { Badge } from '../components/Badge.js';
import {
  ArrowLeft,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  Phone,
  Instagram,
  Globe,
  ExternalLink,
  Loader2,
  Tag,
  ShoppingBag,
  Info,
} from 'lucide-react';

interface WorkDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  images: string[];
  technique: string | null;
  motif: string | null;
  year: number | null;
  publishedAt: string | null;
  category: { id: string; name: string; slug: string } | null;
  creator: {
    id: string;
    name: string;
    slug: string;
    city: string;
    district: string | null;
    imagePath: string | null;
    contact: {
      whatsappUrl: string | null;
      whatsappNumberFormatted: string | null;
      instagramUrl: string | null;
      websiteUrl: string | null;
      primaryChannel: 'whatsapp' | 'instagram' | 'website' | 'profile';
      primaryUrl: string;
      primaryLabel: string;
    };
  };
  products: {
    id: string;
    title: string;
    slug: string;
    priceMin: number | null;
    priceMax: number | null;
    priceUnit: string | null;
    availability: string;
    coverImage: string | null;
  }[];
}

export const ShowcaseDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [work, setWork] = useState<WorkDetail | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWork() {
      try {
        const res = await apiFetch<{ data: WorkDetail }>(`/works/${slug}`);
        setWork(res.data);
      } catch (err: any) {
        setError(err.message || 'Karya tidak ditemukan atau belum dipublikasikan.');
      } finally {
        setLoading(false);
      }
    }
    loadWork();
  }, [slug]);

  const formatPrice = (p: { priceMin: number | null; priceMax: number | null; priceUnit: string | null }) => {
    const unit = p.priceUnit ? ` / ${p.priceUnit}` : '';
    if (p.priceMin === null && p.priceMax === null) {
      return 'Hubungi Perajin';
    }
    if (p.priceMin !== null && p.priceMax !== null && p.priceMin === p.priceMax) {
      return `Rp ${p.priceMin.toLocaleString('id-ID')}${unit}`;
    }
    if (p.priceMin !== null && p.priceMax !== null) {
      return `Rp ${p.priceMin.toLocaleString('id-ID')} - Rp ${p.priceMax.toLocaleString('id-ID')}${unit}`;
    }
    if (p.priceMin !== null) {
      return `Mulai Rp ${p.priceMin.toLocaleString('id-ID')}${unit}`;
    }
    return `Maks. Rp ${p.priceMax?.toLocaleString('id-ID')}${unit}`;
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm font-medium">Memuat detail karya...</p>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Karya Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">{error || 'Data karya yang Anda cari tidak tersedia.'}</p>
        <Link
          to="/showcase"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Galeri Showcase</span>
        </Link>
      </div>
    );
  }

  const currentImage = work.images[activeImageIndex] || work.coverImage;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/showcase"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Galeri Showcase</span>
        </Link>

        <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
          Pilot Kriya / Wastra Tuban
        </span>
      </div>

      {/* Main Grid: Gallery on left, details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Preview Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="aspect-[4/3] rounded-3xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm relative">
            {currentImage ? (
              <img
                src={currentImage}
                alt={work.title}
                className="w-full h-full object-cover transition-all duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Sparkles className="w-16 h-16" />
              </div>
            )}

            {work.motif && (
              <div className="absolute top-3 left-3">
                <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold shadow-sm">
                  Motif: {work.motif}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails if multiple images (up to 5) */}
          {work.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {work.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                    activeImageIndex === idx ? 'border-amber-600 shadow-md scale-95' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Work Info & Narrative (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {work.category && <Badge variant="category">{work.category.name}</Badge>}
              {work.year && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  <Calendar className="w-3 h-3 text-amber-600" />
                  <span>Tahun {work.year}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
              {work.title}
            </h1>
          </div>

          {/* Technique & Spec Box */}
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200/70 p-4 space-y-2.5">
            <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
              Spesifikasi & Teknik Pembuatan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Teknik:</span>
                <span className="font-semibold text-slate-800">{work.technique || 'Tradisional Gedhog Tuban'}</span>
              </div>
              {work.motif && (
                <div>
                  <span className="text-slate-500 block">Ragam Motif:</span>
                  <span className="font-semibold text-slate-800">{work.motif}</span>
                </div>
              )}
            </div>
          </div>

          {/* Narrative / Story Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Narasi & Filosofi Karya
            </h3>
            <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {work.description}
            </div>
          </div>

          {/* Creator Profile & Direct Contact Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Link
                to={`/creative/${work.creator.slug}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                  {work.creator.imagePath ? (
                    <img
                      src={work.creator.imagePath}
                      alt={work.creator.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-base text-slate-600">
                      {work.creator.name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Perajin / Kreator</div>
                  <div className="text-sm font-extrabold text-slate-900 group-hover:text-amber-600 transition">
                    {work.creator.name}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-600" />
                    <span>{work.creator.district ? `Kec. ${work.creator.district}, ` : ''}{work.creator.city}</span>
                  </div>
                </div>
              </Link>

              <Link
                to={`/creative/${work.creator.slug}`}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 shrink-0"
              >
                Lihat Profil Lengkap &rarr;
              </Link>
            </div>

            {/* Direct Contact Buttons */}
            <div className="pt-2 flex flex-wrap gap-2.5 items-center">
              {work.creator.contact?.whatsappUrl && (
                <a
                  href={work.creator.contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                >
                  <Phone className="w-4 h-4" />
                  <span>Apresiasi / Kontak via WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {work.creator.contact?.instagramUrl && (
                <a
                  href={work.creator.contact.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  <Instagram className="w-3.5 h-3.5 text-rose-600" />
                  <span>Instagram</span>
                </a>
              )}

              {work.creator.contact?.websiteUrl && (
                <a
                  href={work.creator.contact.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>Website</span>
                </a>
              )}
            </div>

            {/* K-08 Independent Initiative Notice */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Inisiatif Komunitas:</strong> Ekraf HUB merupakan portal publik nirlaba untuk apresiasi dan promosi talenta kreatif Kabupaten Tuban. Komunikasi dan pemesanan dilakukan langsung ke kontak resmi perajin tanpa perantara.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section (If this work has commercially available products) */}
      {work.products && work.products.length > 0 && (
        <div className="pt-8 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <span>Produk Terkait di Pasar Ekraf</span>
              </h3>
              <p className="text-xs text-slate-500">
                Produk turunan atau edisi busana yang terinspirasi dari karya wastra ini.
              </p>
            </div>
            <Link
              to="/pasar"
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              Jelajahi Pasar Ekraf &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {work.products.map((prod) => (
              <Link
                key={prod.id}
                to={`/pasar/${prod.slug}`}
                className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md transition flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                  {prod.coverImage ? (
                    <img src={prod.coverImage} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition truncate">
                    {prod.title}
                  </h4>
                  <div className="text-xs font-extrabold text-amber-700">
                    {formatPrice(prod)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {prod.availability === 'READY_STOCK' || prod.availability === 'AVAILABLE' ? 'Ready Stock' : 'Dibuat berdasarkan pesanan'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
