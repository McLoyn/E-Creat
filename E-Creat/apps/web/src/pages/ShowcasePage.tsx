import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import { Badge } from '../components/Badge.js';
import {
  Sparkles,
  Search,
  Filter,
  Eye,
  Loader2,
  Info,
  MapPin,
  ArrowRight,
} from 'lucide-react';

interface WorkItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
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
  };
}

export const ShowcasePage: React.FC = () => {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiFetch<{ data: any[] }>('/categories?kind=WORK_CATEGORY');
        setCategories(res.data);
      } catch (err) {
        console.error('Gagal memuat kategori karya:', err);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function loadWorks() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.append('search', search.trim());
        if (selectedCategory) params.append('category', selectedCategory);

        const res = await apiFetch<{ data: WorkItem[]; meta: { total: number } }>(
          `/works?${params.toString()}`
        );
        setWorks(res.data);
        setTotalCount(res.meta?.total || res.data.length);
      } catch (err) {
        console.error('Gagal memuat galeri karya:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadWorks();
    }, 200);

    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 p-8 sm:p-12 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-600/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pilot Kriya & Wastra — Tenun Gedhog & Batik Tulis Tuban</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Showcase Karya Kreatif
          </h1>

          <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed">
            Galeri kurasi karya seni, wastra tenun gedhog pusaka, dan batik tulis canting karya para
            empu dan maestro ekonomi kreatif Tuban. Menghubungkan apresiasi budaya dengan narasi
            filosofis asli pesisiran.
          </p>

          <div className="pt-2 flex items-center gap-2 text-xs text-amber-200/80">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Tuban Creative Hub — Inisiatif independen pemetaan & apresiasi karya budaya lokal.
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari karya, motif (cth: Ganggang, Lok Can), teknik..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
          >
            <option value="">Semua Kategori Karya</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {(search || selectedCategory) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
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
          Menampilkan <strong className="text-slate-800">{works.length}</strong> dari{' '}
          <strong className="text-slate-800">{totalCount}</strong> karya terpublikasi
        </span>
      </div>

      {/* Grid of Works */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          <p className="text-sm font-medium">Memuat galeri karya...</p>
        </div>
      ) : works.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white border border-slate-200 p-8 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak ada karya yang ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Coba gunakan kata kunci pencarian lain atau pilih kategori karya yang berbeda.
          </p>
          {(search || selectedCategory) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition"
            >
              Tampilkan Semua Karya
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {works.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-200 transition overflow-hidden"
            >
              {/* Cover Image */}
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Sparkles className="w-12 h-12" />
                  </div>
                )}

                {/* Motif & Year Overlay Badge */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  {item.motif && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold tracking-wide shadow-sm">
                      Motif: {item.motif}
                    </span>
                  )}
                  {item.year && (
                    <span className="px-2 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold shadow-sm">
                      {item.year}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  {item.category && (
                    <Badge variant="category">{item.category.name}</Badge>
                  )}

                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-amber-700 transition line-clamp-2">
                    {item.title}
                  </h3>

                  {item.technique && (
                    <p className="text-xs font-semibold text-amber-800 bg-amber-50/70 p-2 rounded-xl border border-amber-100/60 line-clamp-2">
                      {item.technique}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Card Footer: Creator info & CTA */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Link
                    to={`/creative/${item.creator.slug}`}
                    className="flex items-center gap-2 min-w-0 group/creator"
                    title={`Lihat profil ${item.creator.name}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0">
                      {item.creator.imagePath ? (
                        <img
                          src={item.creator.imagePath}
                          alt={item.creator.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-slate-600">
                          {item.creator.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate group-hover/creator:text-amber-600 transition">
                        {item.creator.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{item.creator.district || item.creator.city}</span>
                      </div>
                    </div>
                  </Link>

                  <Link
                    to={`/showcase/${item.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition shrink-0 shadow-sm shadow-amber-600/20"
                  >
                    <span>Detail</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
