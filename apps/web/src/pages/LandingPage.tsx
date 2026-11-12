import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import { Badge } from '../components/Badge.js';
import {
  Sparkles,
  ArrowRight,
  Compass,
  Grid,
  Users,
  Layers,
  MapPin,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [subApps, setSubApps] = useState<any[]>([]);
  const [creatives, setCreatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [appRes, creativeRes] = await Promise.all([
          apiFetch<{ data: any[] }>('/sub-apps?pageSize=3'),
          apiFetch<{ data: any[] }>('/creative-profiles?pageSize=4'),
        ]);
        setSubApps(appRes.data || []);
        setCreatives(creativeRes.data || []);
      } catch (err) {
        console.error('Failed to load landing data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent pt-12 pb-16 border-b border-amber-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MEGA EKOSISTEM EKONOMI KREATIF TUBAN V0.1</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Pusat Eksplorasi & Pemberdayaan <span className="text-amber-600">Ekraf Tuban</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              [Teks Placeholder] Hubungkan karya lokal, jelajahi sub-aplikasi komunitas, dan temukan ratusan talenta kreatif di Kabupaten Tuban dalam satu pintu ekosistem terpadu.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/creative"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-600/20 transition"
              >
                <span>Jelajahi Pelaku Kreatif</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/sub-apps"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200 shadow-sm transition"
              >
                <Grid className="w-4 h-4 text-amber-600" />
                <span>Lihat Sub-App</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Concept Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-amber-300 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Integrasi Sub-App</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Memayungi berbagai platform digital khusus komunitas ekraf—mulai dari showcase tenun gedog, kalender pameran seni, hingga modul pembelajaran.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-amber-300 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Direktori Talenta</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Pusat profil resmi bagi perajin kriya, pegiat kuliner, perancang busana, dan seniman lokal yang tersebar di seluruh kecamatan Kabupaten Tuban.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-amber-300 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Inisiatif Independen</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Dikelola secara terbuka oleh Tuban Creative Hub guna menjembatani jejaring kolaborasi tanpa sekat dan mendorong kemandirian pelaku ekraf.
            </p>
          </div>
        </div>
      </section>

      {/* Sub-Apps Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
              Katalog Ekosistem
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sub-App Kreatif Tuban
            </h2>
          </div>
          <Link
            to="/sub-apps"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-800"
          >
            <span>Lihat Semua Sub-App</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : subApps.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-500">
            Belum ada Sub-App publik yang dipublikasikan.
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
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition mb-1.5">
                      <Link to={`/sub-apps/${app.slug}`}>{app.name}</Link>
                    </h3>
                    <p className="text-xs text-amber-700 font-medium mb-2.5">{app.tagline}</p>
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {app.description}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={`/sub-apps/${app.slug}`}
                      className="text-xs font-semibold text-slate-700 hover:text-amber-600"
                    >
                      Detail Aplikasi
                    </Link>
                    <a
                      href={app.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
                    >
                      <span>Buka Aplikasi</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Creative Profiles Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
              Jejaring Pelaku
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pelaku & Brand Kreatif Tuban
            </h2>
          </div>
          <Link
            to="/creative"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-800"
          >
            <span>Lihat Semua Pelaku Kreatif</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : creatives.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-500">
            Belum ada profil pelaku kreatif publik.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {creatives.map((c) => (
              <div
                key={c.id}
                className="group flex flex-col rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition overflow-hidden"
              >
                {c.imagePath ? (
                  <div className="h-40 w-full overflow-hidden bg-slate-100">
                    <img
                      src={c.imagePath}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-40 w-full bg-gradient-to-tr from-amber-100 to-amber-50 flex items-center justify-center text-amber-700 font-bold text-2xl">
                    {c.name[0]}
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {c.categories?.map((cat: any) => (
                        <Badge key={cat.category.id}>{cat.category.name}</Badge>
                      ))}
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition mb-1 text-base">
                      <Link to={`/creative/${c.slug}`}>{c.name}</Link>
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {c.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{c.district ? `Kec. ${c.district}` : c.city}</span>
                    </span>
                    <Link
                      to={`/creative/${c.slug}`}
                      className="font-semibold text-amber-600 hover:text-amber-700"
                    >
                      Lihat Profil
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-amber-600 to-amber-700 p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bergabung dengan Ekosistem Ekraf Tuban
            </h3>
            <p className="text-amber-100 text-sm sm:text-base leading-relaxed">
              Daftarkan diri Anda sebagai pelaku atau antusiasme kreatif untuk mengelola preferensi minat subsektor dan terhubung dalam inisiatif Tuban Creative Hub.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-white text-amber-800 font-bold text-sm shadow hover:bg-amber-50 transition"
            >
              Daftar Sekarang
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-amber-800/80 text-white font-semibold text-sm hover:bg-amber-800 transition border border-amber-500"
            >
              Masuk Akun
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
