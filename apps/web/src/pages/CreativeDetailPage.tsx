import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import { Badge } from '../components/Badge.js';
import {
  ArrowLeft,
  MapPin,
  Globe,
  Instagram,
  Phone,
  Calendar,
  Layers,
  Loader2,
  ExternalLink,
  Sparkles,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

export const CreativeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [creative, setCreative] = useState<any | null>(null);
  const [works, setWorks] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'about' | 'works' | 'products'>('about');
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      try {
        const res = await apiFetch<{ data: any }>(`/creative-profiles/${slug}`);
        setCreative(res.data);
      } catch (err: any) {
        setError(err.message || 'Profil Pelaku Kreatif tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [slug]);

  // Load works and products for this creator
  useEffect(() => {
    if (!creative) return;

    async function loadTabsData() {
      setTabLoading(true);
      try {
        const [worksRes, prodsRes] = await Promise.all([
          apiFetch<{ data: any[] }>(`/creative-profiles/${slug}/works`).catch(() => ({ data: [] })),
          apiFetch<{ data: any[] }>(`/creative-profiles/${slug}/products`).catch(() => ({ data: [] })),
        ]);
        setWorks(worksRes.data);
        setProducts(prodsRes.data);
      } catch (err) {
        console.error('Gagal memuat data karya/produk kreator:', err);
      } finally {
        setTabLoading(false);
      }
    }

    loadTabsData();
  }, [creative, slug]);

  const formatPrice = (p: { priceMin: number | null; priceMax: number | null; priceUnit: string | null }) => {
    const unit = p.priceUnit ? ` / ${p.priceUnit}` : '';
    if (p.priceMin === null && p.priceMax === null) return 'Hubungi Penjual';
    if (p.priceMin !== null && p.priceMax !== null && p.priceMin === p.priceMax) {
      return `Rp ${p.priceMin.toLocaleString('id-ID')}${unit}`;
    }
    if (p.priceMin !== null && p.priceMax !== null) {
      return `Rp ${p.priceMin.toLocaleString('id-ID')} - Rp ${p.priceMax.toLocaleString('id-ID')}${unit}`;
    }
    if (p.priceMin !== null) return `Mulai Rp ${p.priceMin.toLocaleString('id-ID')}${unit}`;
    return `Maks. Rp ${p.priceMax?.toLocaleString('id-ID')}${unit}`;
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm font-medium">Memuat profil pelaku kreatif...</p>
      </div>
    );
  }

  if (error || !creative) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 text-center rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Profil Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">{error || 'Data yang Anda cari tidak tersedia.'}</p>
        <Link
          to="/creative"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Direktori</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        to="/creative"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Direktori Pelaku Kreatif</span>
      </Link>

      {/* Main Content Card Header */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        {creative.imagePath && (
          <div className="h-64 sm:h-80 w-full overflow-hidden bg-slate-100">
            <img
              src={creative.imagePath}
              alt={creative.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {creative.categories?.map((c: any) => (
                <Badge key={c.category.id} variant="category">
                  {c.category.name}
                </Badge>
              ))}
              <Badge variant="published">PUBLISHED</Badge>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {creative.name}
            </h1>

            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>
                {creative.district ? `Kecamatan ${creative.district}, ` : ''}Kabupaten {creative.city}
              </span>
            </div>

            <p className="text-base font-medium text-slate-700 leading-relaxed bg-amber-50/60 p-4 rounded-xl border border-amber-100">
              {creative.summary}
            </p>
          </div>

          {/* Contact Row */}
          <div className="pt-2 flex flex-wrap gap-3 items-center">
            {creative.whatsappNumber && (
              <a
                href={`https://wa.me/${creative.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
              >
                <Phone className="w-4 h-4" />
                <span>Hubungi via WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {creative.instagramHandle && (
              <a
                href={`https://instagram.com/${creative.instagramHandle.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-600 hover:opacity-90 text-white font-semibold text-xs shadow-sm transition"
              >
                <Instagram className="w-4 h-4" />
                <span>{creative.instagramHandle}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {creative.websiteUrl && (
              <a
                href={creative.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition"
              >
                <Globe className="w-4 h-4 text-slate-500" />
                <span>Kunjungi Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Tabbed Navigation Bar */}
        <div className="px-6 sm:px-8 border-t border-slate-200 bg-slate-50/70 flex gap-2 sm:gap-4">
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === 'about'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tentang Profil
          </button>

          <button
            onClick={() => setActiveTab('works')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'works'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Showcase Karya ({works.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'products'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>Pasar & Produk ({products.length})</span>
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="p-6 sm:p-8">
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Deskripsi Lengkap
                </h3>
                <div className="text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                  {creative.description}
                </div>
              </div>

              {/* Metadata Footer */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-6 text-xs text-slate-500">
                {creative.publishedAt && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Terdaftar sejak: {new Date(creative.publishedAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>Slug: {creative.slug}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'works' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Showcase Karya Adiluhung</h3>
                  <p className="text-xs text-slate-500">Koleksi karya seni, motif tenun pusaka, dan batik tulis.</p>
                </div>
                <Link to="/showcase" className="text-xs font-bold text-amber-600 hover:text-amber-700">
                  Lihat Semua Showcase &rarr;
                </Link>
              </div>

              {tabLoading ? (
                <div className="py-12 flex justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                </div>
              ) : works.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Belum ada karya terpublikasi dari kreator ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {works.map((w) => (
                    <Link
                      key={w.id}
                      to={`/showcase/${w.slug}`}
                      className="group rounded-2xl border border-slate-200 bg-white hover:border-amber-300 hover:shadow-md transition overflow-hidden flex flex-col"
                    >
                      <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                        {w.coverImage ? (
                          <img src={w.coverImage} alt={w.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Sparkles className="w-8 h-8" />
                          </div>
                        )}
                        {w.motif && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[9px] font-bold">
                            {w.motif}
                          </span>
                        )}
                      </div>
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition line-clamp-1">
                            {w.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {w.technique || w.description}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                          <span>Kisah Karya</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Etalase Produk Kreatif</h3>
                  <p className="text-xs text-slate-500">Produk yang dapat dibeli atau dipesan langsung kepada perajin.</p>
                </div>
                <Link to="/pasar" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                  Lihat Semua Pasar Ekraf &rarr;
                </Link>
              </div>

              {tabLoading ? (
                <div className="py-12 flex justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Belum ada produk terpublikasi dari kreator ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      to={`/pasar/${p.slug}`}
                      className="group rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition overflow-hidden flex flex-col"
                    >
                      <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                        {p.coverImage ? (
                          <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[9px] font-bold">
                          {p.availability === 'AVAILABLE' || p.availability === 'READY_STOCK' ? 'Ready' : 'Pre-Order'}
                        </span>
                      </div>
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition line-clamp-1">
                            {p.title}
                          </h4>
                          <div className="text-xs font-black text-emerald-700">
                            {formatPrice(p)}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          <span>Pesan Produk</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
