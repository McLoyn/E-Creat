import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import { Badge } from '../components/Badge.js';
import { ArrowLeft, ExternalLink, Globe, Calendar, Layers, Loader2 } from 'lucide-react';

export const SubAppDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [subApp, setSubApp] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      try {
        const res = await apiFetch<{ data: any }>(`/sub-apps/${slug}`);
        setSubApp(res.data);
      } catch (err: any) {
        setError(err.message || 'Sub-App tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm font-medium">Memuat detail Sub-App...</p>
      </div>
    );
  }

  if (error || !subApp) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 text-center rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Sub-App Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">{error || 'Data yang Anda cari tidak tersedia atau belum dipublikasikan.'}</p>
        <Link
          to="/sub-apps"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Direktori</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        to="/sub-apps"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Katalog Sub-App</span>
      </Link>

      {/* Main Content Card */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        {subApp.imagePath && (
          <div className="h-64 sm:h-80 w-full overflow-hidden bg-slate-100">
            <img
              src={subApp.imagePath}
              alt={subApp.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-10 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {subApp.categories?.map((c: any) => (
                <Badge key={c.category.id} variant="category">
                  {c.category.name}
                </Badge>
              ))}
              <Badge variant="published">PUBLISHED</Badge>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {subApp.name}
            </h1>

            <p className="text-base sm:text-lg font-medium text-amber-700 leading-snug">
              {subApp.tagline}
            </p>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <a
              href={subApp.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition"
            >
              <span>Buka Aplikasi Langsung</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">{subApp.externalUrl}</span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Description Body */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Tentang Sub-Aplikasi
            </h3>
            <div className="text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
              {subApp.description}
            </div>
          </div>

          {/* Metadata Footer */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-6 text-xs text-slate-500">
            {subApp.publishedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Dipublikasikan: {new Date(subApp.publishedAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Slug URL: {subApp.slug}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
