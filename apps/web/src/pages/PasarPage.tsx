import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import { Badge } from '../components/Badge.js';
import {
  ShoppingBag,
  Search,
  Filter,
  Phone,
  ExternalLink,
  Loader2,
  MapPin,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  material: string | null;
  dimensions: string | null;
  priceMin: number | null;
  priceMax: number | null;
  priceUnit: string | null;
  availability: 'AVAILABLE' | 'READY_STOCK' | 'MADE_TO_ORDER' | 'UNAVAILABLE';
  productType: { id: string; name: string; slug: string } | null;
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

export const PasarPage: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function loadTypes() {
      try {
        const res = await apiFetch<{ data: any[] }>('/categories?kind=PRODUCT_TYPE');
        setTypes(res.data);
      } catch (err) {
        console.error('Gagal memuat jenis produk:', err);
      }
    }
    loadTypes();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.append('search', search.trim());
        if (selectedType) params.append('type', selectedType);
        if (selectedAvailability) params.append('availability', selectedAvailability);

        const res = await apiFetch<{ data: ProductItem[]; meta: { total: number } }>(
          `/products?${params.toString()}`
        );
        setProducts(res.data);
        setTotalCount(res.meta?.total || res.data.length);
      } catch (err) {
        console.error('Gagal memuat katalog produk:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadProducts();
    }, 200);

    return () => clearTimeout(timer);
  }, [search, selectedType, selectedAvailability]);

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

  const getAvailabilityBadge = (status: string) => {
    if (status === 'AVAILABLE' || status === 'READY_STOCK') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold shadow-sm">
          <CheckCircle2 className="w-3 h-3" />
          <span>Ready Stock</span>
        </span>
      );
    }
    if (status === 'MADE_TO_ORDER') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-600/90 backdrop-blur-md text-white text-[10px] font-bold shadow-sm">
          <Clock className="w-3 h-3" />
          <span>Pre-Order</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-600/90 backdrop-blur-md text-white text-[10px] font-bold shadow-sm">
        <span>Habis</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-8 sm:p-12 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Katalog Produk & Wastra Kreatif Tuban</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Pasar Ekraf Tuban
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Katalog etalase produk kerajinan tangan, kain tenun gedhog, sarung etnik, dan busana siap
            pakai dari perajin asli Tuban. Terhubung langsung dengan kontak WhatsApp resmi pembuat
            tanpa biaya perantara.
          </p>

          <div className="pt-2 flex items-center gap-2 text-xs text-emerald-200/80">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Tuban Creative Hub — Hubungan transaksi langsung transparan antara pembeli dan perajin.
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk, bahan (cth: kapas, tenun, pewarna alam)..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          >
            <option value="">Semua Jenis Produk</option>
            {types.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          >
            <option value="">Semua Ketersediaan</option>
            <option value="AVAILABLE">Ready Stock</option>
            <option value="MADE_TO_ORDER">Pre-Order / Pesan Dahulu</option>
          </select>

          {(search || selectedType || selectedAvailability) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedType('');
                setSelectedAvailability('');
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Menampilkan <strong className="text-slate-800">{products.length}</strong> dari{' '}
          <strong className="text-slate-800">{totalCount}</strong> produk terpublikasi
        </span>
      </div>

      {/* Grid of Products */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">Memuat etalase pasar...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white border border-slate-200 p-8 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak ada produk yang cocok</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau bersihkan filter jenis dan ketersediaan produk.
          </p>
          {(search || selectedType || selectedAvailability) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedType('');
                setSelectedAvailability('');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
            >
              Tampilkan Semua Produk
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200 transition overflow-hidden"
            >
              {/* Product Cover Image */}
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ShoppingBag className="w-12 h-12" />
                  </div>
                )}

                {/* Availability Badge */}
                <div className="absolute top-3 left-3">
                  {getAvailabilityBadge(item.availability)}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    {item.productType && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {item.productType.name}
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition line-clamp-2">
                    {item.title}
                  </h3>

                  {/* Price Tag */}
                  <div className="text-base font-extrabold text-emerald-700">
                    {formatPrice(item)}
                  </div>

                  {item.material && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 line-clamp-1">
                      <strong className="text-slate-700">Bahan:</strong> {item.material}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Creator & Contact Row */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/creative/${item.creator.slug}`}
                      className="flex items-center gap-2 min-w-0 group/creator"
                      title={`Lihat profil ${item.creator.name}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden shrink-0">
                        {item.creator.imagePath ? (
                          <img
                            src={item.creator.imagePath}
                            alt={item.creator.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-[9px] text-slate-600">
                            {item.creator.name[0]}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate group-hover/creator:text-emerald-600 transition">
                        {item.creator.name}
                      </span>
                    </Link>

                    <Link
                      to={`/pasar/${item.slug}`}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                    >
                      Detail &rarr;
                    </Link>
                  </div>

                  {/* WhatsApp CTA */}
                  {item.creator.contact?.whatsappUrl ? (
                    <a
                      href={item.creator.contact.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Tanya / Pesan via WhatsApp</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link
                      to={`/pasar/${item.slug}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    >
                      <span>Lihat Kontak Perajin</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
