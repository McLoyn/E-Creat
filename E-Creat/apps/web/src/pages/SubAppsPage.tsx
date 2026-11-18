import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import { Badge } from '../components/Badge.js';
import { Search, Grid, ExternalLink, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

export const SubAppsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [subApps, setSubApps] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || '';
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiFetch<{ data: any[] }>('/categories?kind=SUBAPP_TYPE');
        setCategories(res.data || []);
      } catch (err) {
        console.error('Failed to load sub-app categories:', err);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function loadSubApps() {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (currentSearch) query.set('search', currentSearch);
        if (currentCategory) query.set('category', currentCategory);
        query.set('pageSize', '24');

        const res = await apiFetch<{ data: any[]; meta: any }>(`/sub-apps?${query.toString()}`);
        setSubApps(res.data || []);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat daftar Sub-App.');
      } finally {
        setLoading(false);
      }
    }
    loadSubApps();
  }, [currentSearch, currentCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newParams.set('search', searchInput.trim());
    } else {
      newParams.delete('search');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleCategorySelect = (slug: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (currentCategory === slug) {
      newParams.delete('category');
    } else {
      newParams.set('category', slug);
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
          <Grid className="w-3.5 h-3.5" />
          <span>DIREKTORI PLATFORM DIGITAL</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Sub-Aplikasi Ekosistem Ekraf Tuban
        </h1>
        <p className="text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed">
          Temukan ragam platform digital, etalase online, dan portal layanan kreatif yang terintegrasi di bawah payung inisiatif Tuban Creative Hub.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama atau deskripsi Sub-App..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 transition"
          >
            Cari
          </button>
        </form>

        {/* Categories Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => handleCategorySelect('')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              !currentCategory
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Semua Jenis
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                currentCategory === cat.slug
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* States: Loading, Error, Empty, List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          <p className="text-sm font-medium">Memuat katalog Sub-App...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-2xl bg-red-50 border border-red-200 text-red-700 space-y-3">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={() => setSearchParams({})}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      ) : subApps.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200/80 p-8 space-y-3">
          <Grid className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada Sub-App ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tidak ada sub-aplikasi yang cocok dengan kata kunci atau filter yang Anda pilih.
          </p>
          <button
            onClick={() => {
              setSearchInput('');
              setSearchParams({});
            }}
            className="text-xs font-semibold text-amber-600 hover:underline pt-2 block mx-auto"
          >
            Hapus semua filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subApps.map((app) => (
            <div
              key={app.id}
              className="group flex flex-col justify-between rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition overflow-hidden"
            >
              {app.imagePath && (
                <div className="h-44 w-full overflow-hidden bg-slate-100">
                  <img
                    src={app.imagePath}
                    alt={app.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {app.categories?.map((c: any) => (
                      <Badge key={c.category.id}>{c.category.name}</Badge>
                    ))}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition mb-1">
                    <Link to={`/sub-apps/${app.slug}`}>{app.name}</Link>
                  </h3>
                  <p className="text-xs text-amber-700 font-medium mb-2">{app.tagline}</p>
                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {app.description}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/sub-apps/${app.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-amber-600"
                  >
                    <span>Detail</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <a
                    href={app.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 transition"
                  >
                    <span>Buka Sub-App</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
