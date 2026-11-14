import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import {
  ArrowLeft,
  ShoppingBag,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  Instagram,
  Globe,
  ExternalLink,
  Loader2,
  Sparkles,
  Info,
  ArrowRight,
} from 'lucide-react';

interface ProductDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  images: string[];
  material: string | null;
  dimensions: string | null;
  priceMin: number | null;
  priceMax: number | null;
  priceUnit: string | null;
  availability: 'AVAILABLE' | 'READY_STOCK' | 'MADE_TO_ORDER' | 'UNAVAILABLE';
  leadTimeDays?: number | null;
  publishedAt: string | null;
  productType: { id: string; name: string; slug: string } | null;
  work?: {
    id: string;
    title: string;
    slug: string;
    coverImage?: string | null;
  } | null;
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
}

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await apiFetch<{ data: ProductDetail }>(`/products/${slug}`);
        setProduct(res.data);
      } catch (err: any) {
        setError(err.message || 'Produk tidak ditemukan atau belum dipublikasikan.');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  const formatPrice = (p: { priceMin: number | null; priceMax: number | null; priceUnit: string | null }) => {
    const unit = p.priceUnit ? ` / ${p.priceUnit}` : '';
    if (p.priceMin === null && p.priceMax === null) {
      return 'Hubungi Penjual';
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Memuat detail produk...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Produk Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">{error || 'Data produk yang Anda cari tidak tersedia.'}</p>
        <Link
          to="/pasar"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pasar Ekraf</span>
        </Link>
      </div>
    );
  }

  const currentImage = product.images[activeImageIndex] || product.coverImage;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/pasar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Pasar Ekraf</span>
        </Link>

        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          Katalog Produk Komunitas Tuban
        </span>
      </div>

      {/* Main Grid: Gallery on left, product details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Preview Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="aspect-[4/3] rounded-3xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm relative">
            {currentImage ? (
              <img
                src={currentImage}
                alt={product.title}
                className="w-full h-full object-cover transition-all duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <ShoppingBag className="w-16 h-16" />
              </div>
            )}

            {/* Availability Badge */}
            <div className="absolute top-3 left-3">
              {product.availability === 'AVAILABLE' || product.availability === 'READY_STOCK' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/95 backdrop-blur-md text-white text-xs font-bold shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready Stock</span>
                </span>
              ) : product.availability === 'MADE_TO_ORDER' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-600/95 backdrop-blur-md text-white text-xs font-bold shadow-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pre-Order</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-700/95 backdrop-blur-md text-white text-xs font-bold shadow-sm">
                  <span>Stok Habis</span>
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails if multiple images (up to 5) */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                    activeImageIndex === idx ? 'border-emerald-600 shadow-md scale-95' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Order CTA (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.productType && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {product.productType.name}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
              {product.title}
            </h1>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-800">
                {formatPrice(product)}
              </span>
            </div>
          </div>

          {/* Product Specifications Box */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Spesifikasi Produk
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {product.material && (
                <div>
                  <span className="text-slate-500 block">Bahan & Serat:</span>
                  <span className="font-semibold text-slate-800">{product.material}</span>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <span className="text-slate-500 block">Dimensi / Ukuran:</span>
                  <span className="font-semibold text-slate-800">{product.dimensions}</span>
                </div>
              )}
              {product.availability === 'MADE_TO_ORDER' && product.leadTimeDays && (
                <div>
                  <span className="text-slate-500 block">Estimasi Pengerjaan:</span>
                  <span className="font-semibold text-slate-800">{product.leadTimeDays} Hari Kerja</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Deskripsi Produk
            </h3>
            <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>

          {/* Creator Profile & Direct Contact Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Link
                to={`/creative/${product.creator.slug}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                  {product.creator.imagePath ? (
                    <img
                      src={product.creator.imagePath}
                      alt={product.creator.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-base text-slate-600">
                      {product.creator.name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Perajin / Toko Resmi</div>
                  <div className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-600 transition">
                    {product.creator.name}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>{product.creator.district ? `Kec. ${product.creator.district}, ` : ''}{product.creator.city}</span>
                  </div>
                </div>
              </Link>

              <Link
                to={`/creative/${product.creator.slug}`}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 shrink-0"
              >
                Lihat Profil &rarr;
              </Link>
            </div>

            {/* Prominent WhatsApp Order Action Button */}
            {product.creator.contact?.whatsappUrl ? (
              <a
                href={product.creator.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 transition active:scale-[0.99]"
              >
                <Phone className="w-5 h-5" />
                <span>Pesan / Tanya Stok via WhatsApp</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <div className="p-3 text-center text-xs text-slate-500 bg-slate-100 rounded-xl">
                Nomor WhatsApp perajin belum tersedia untuk kontak langsung.
              </div>
            )}

            {/* Secondary Contacts */}
            <div className="flex flex-wrap gap-2 items-center pt-1">
              {product.creator.contact?.instagramUrl && (
                <a
                  href={product.creator.contact.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  <Instagram className="w-3.5 h-3.5 text-rose-600" />
                  <span>Instagram Perajin</span>
                </a>
              )}

              {product.creator.contact?.websiteUrl && (
                <a
                  href={product.creator.contact.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>Website Resmi</span>
                </a>
              )}
            </div>

            {/* K-08 Independent Initiative Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Bebas Biaya Perantara:</strong> Platform ini tidak memfasilitasi transaksi pembayaran otomatis atau jasa ekspedisi. Pembelian dilakukan melalui kesepakatan langsung antara Anda dan perajin lokal Tuban.
              </span>
            </div>
          </div>

          {/* Linked Work Section (If linked to a Showcase item) */}
          {product.work && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Karya Induk (Showcase)</span>
                  <div className="text-xs font-bold text-slate-900 truncate">{product.work.title}</div>
                </div>
              </div>
              <Link
                to={`/showcase/${product.work.slug}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 shrink-0"
              >
                <span>Lihat Narasi Karya</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
