import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import { Badge } from '../components/Badge.js';
import { Search, Users, MapPin, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

const TUBAN_DISTRICTS = [
  'Bancar', 'Bangilan', 'Grabagan', 'Jatirogo', 'Jenu', 'Kenduruan',
  'Kerek', 'Merakurak', 'Montong', 'Palang', 'Plumpang', 'Rengel',
  'Semanding', 'Senori', 'Singgahan', 'Soko', 'Tambakboyo', 'Tuban Kota',
  'Widang'
];

export const CreativesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [creatives, setCreatives] = useState<any[]>([]);
  const [subsectors, setSubsectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentSearch = searchParams.get('search') || '';
  const currentSubsector = searchParams.get('subsector') || '';
  const currentDistrict = searchParams.get('district') || '';
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    async function loadSubsectors() {
      try {
        const res = await apiFetch<{ data: any[] }>('/categories?kind=SUBSECTOR');
        setSubsectors(res.data || []);
      } catch (err) {
        console.error('Failed to load subsectors:', err);
      }
    }
    loadSubsectors();
  }, []);

  useEffect(() => {
    async function loadCreatives() {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (currentSearch) query.set('search', currentSearch);
        if (currentSubsector) query.set('subsector', currentSubsector);
        if (currentDistrict) query.set('district', currentDistrict);
        query.set('pageSize', '24');

        const res = await apiFetch<{ data: any[]; meta: any }>(`/creative-profiles?${query.toString()}`);
        setCreatives(res.data || []);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat profil pelaku kreatif.');
      } finally {
        setLoading(false);
      }
    }
    loadCreatives();
  }, [currentSearch, currentSubsector, currentDistrict]);

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

  const handleSubsectorSelect = (slug: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (currentSubsector === slug) {
      newParams.delete('subsector');
    } else {
      newParams.set('subsector', slug);
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newParams.set('district', e.target.value);
    } else {
      newParams.delete('district');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
          <Users className="w-3.5 h-3.5" />
          <span>DIREKTORI TALENTA & KARYA</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Pelaku Ekonomi Kreatif Tuban
        </h1>
        <p className="text-slate-600 max-w-2xl text-sm sm:text-base leading-relaxed">
          Eksplorasi profil perajin batik gedog, pelaku kuliner pesisir, perancang grafis, fotografer, dan wirausaha kreatif di 20 kecamatan Kabupaten Tuban.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama pelaku, karya, atau ringkasan..."
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

          {/* District Dropdown Filter */}
          <div className="w-full sm:w-56">
            <select
              value={currentDistrict}
              onChange={handleDistrictChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white text-slate-700"
            >
              <option value="">Semua Kecamatan (Tuban)</option>
              {TUBAN_DISTRICTS.map((dist) => (
                <option key={dist} value={dist}>
                  Kec. {dist}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subsector Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => handleSubsectorSelect('')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              !currentSubsector
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Semua Subsektor
          </button>
          {subsectors.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSubsectorSelect(cat.slug)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                currentSubsector === cat.slug
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
          <p className="text-sm font-medium">Memuat profil pelaku kreatif...</p>
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
      ) : creatives.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200/80 p-8 space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada Pelaku Kreatif ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tidak ada profil yang sesuai dengan filter subsektor atau kecamatan yang dipilih.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {creatives.map((c) => (
            <div
              key={c.id}
              className="group flex flex-col justify-between rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition overflow-hidden"
            >
              {c.imagePath ? (
                <div className="h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={c.imagePath}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
              ) : (
                <div className="h-48 w-full bg-gradient-to-tr from-amber-100 to-amber-50 flex items-center justify-center text-amber-700 font-bold text-3xl">
                  {c.name[0]}
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {c.categories?.map((cat: any) => (
                      <Badge key={cat.category.id}>{cat.category.name}</Badge>
                    ))}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition mb-1">
                    <Link to={`/creative/${c.slug}`}>{c.name}</Link>
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {c.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1 truncate font-medium">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{c.district ? `Kec. ${c.district}` : c.city}</span>
                  </span>
                  <Link
                    to={`/creative/${c.slug}`}
                    className="inline-flex items-center gap-1 font-semibold text-amber-600 hover:text-amber-700"
                  >
                    <span>Profil</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
