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
} from 'lucide-react';

export const CreativeDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [creative, setCreative] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        to="/creative"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Direktori Pelaku Kreatif</span>
      </Link>

      {/* Main Content Card */}
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

        <div className="p-6 sm:p-10 space-y-6">
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

          <hr className="border-slate-100" />

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Deskripsi & Profil Karya
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
      </div>
    </div>
  );
};
