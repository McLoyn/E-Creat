import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Badge } from '../../components/Badge.js';
import {
  Palette,
  Sparkles,
  ShoppingBag,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  ArrowRight,
  Loader2,
  Building2,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export const CreatorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [works, setWorks] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlinked, setUnlinked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCreatorData() {
      setLoading(true);
      setError(null);
      setUnlinked(false);

      try {
        // Fetch creator's works and products
        const [worksRes, prodsRes] = await Promise.all([
          apiFetch<{ data: any[] }>('/me/works'),
          apiFetch<{ data: any[] }>('/me/products'),
        ]);

        setWorks(worksRes.data);
        setProducts(prodsRes.data);

        // Deduce profile from one of the returned items or fetch first available
        if (worksRes.data.length > 0) {
          setProfile(worksRes.data[0].creativeProfile || null);
        } else if (prodsRes.data.length > 0) {
          setProfile(prodsRes.data[0].creativeProfile || null);
        }
      } catch (err: any) {
        if (err.status === 403 || err.message?.includes('tidak memiliki profil pelaku kreatif') || err.message?.includes('belum ditautkan')) {
          setUnlinked(true);
        } else {
          setError(err.message || 'Gagal memuat dasbor kreator.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadCreatorData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm font-medium">Memuat dasbor kreator...</p>
      </div>
    );
  }

  if (unlinked) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              Akun Belum Ditautkan ke Profil Pelaku Kreatif
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Untuk mengelola karya seni (Showcase) dan produk (Pasar), akun Anda (
              <strong>{user?.email}</strong>) harus ditetapkan sebagai pemilik profil terverifikasi
              oleh Administrator Ekraf HUB sesuai kebijakan K-01.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1">
            <span className="font-bold text-slate-800 block">Panduan Aktivasi Kreator:</span>
            <p>1. Hubungi Administrator Ekraf HUB di Tuban Creative Center.</p>
            <p>2. Informasikan nama profil brand/studio kreatif Anda di direktori.</p>
            <p>3. Setelah tautan profil ditetapkan, menu kelola karya dan produk akan aktif otomatis.</p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/creative"
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Lihat Direktori Pelaku
            </Link>
            <Link
              to="/"
              className="px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Count stats
  const publishedWorks = works.filter((w) => w.status === 'PUBLISHED').length;
  const pendingWorks = works.filter((w) => w.status === 'PENDING_REVIEW').length;
  const revisionWorks = works.filter((w) => w.status === 'NEEDS_REVISION').length;

  const publishedProducts = products.filter((p) => p.status === 'PUBLISHED').length;
  const pendingProducts = products.filter((p) => p.status === 'PENDING_REVIEW').length;
  const revisionProducts = products.filter((p) => p.status === 'NEEDS_REVISION').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner Header */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950 to-slate-950 p-8 sm:p-10 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <Palette className="w-3.5 h-3.5" />
              <span>Studio Pengelolaan Kreator Ekraf HUB</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Dasbor Kreator & Karya
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Kelola portofolio karya seni Showcase dan etalase produk Pasar Ekraf Anda. Seluruh perubahan
              dimoderasi transparan untuk menjaga orisinalitas wastra & kriya Tuban.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/dashboard/kreator/works"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Kelola Showcase</span>
            </Link>
            <Link
              to="/dashboard/kreator/products"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Kelola Produk</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Action Alerts for Revision/Feedback */}
      {(revisionWorks > 0 || revisionProducts > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <strong className="font-bold">Perhatian: Ada item yang membutuhkan revisi!</strong>
            <p className="text-amber-800">
              Terdapat {revisionWorks} karya atau {revisionProducts} produk dengan status NEEDS_REVISION.
              Silakan periksa catatan dari Administrator dan lakukan perbaikan sebelum mengajukan ulang.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Showcase Works */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Karya Showcase</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{works.length}</div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-bold">{publishedWorks} Publik</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{pendingWorks} Review</span>
          </div>
        </div>

        {/* Pasar Products */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Produk Pasar</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{products.length}</div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-bold">{publishedProducts} Publik</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{pendingProducts} Review</span>
          </div>
        </div>

        {/* Needs Revision */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Butuh Revisi</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-3xl font-black text-orange-600">{revisionWorks + revisionProducts}</div>
          <div className="text-xs text-slate-500">Catatan perbaikan dari kurator</div>
        </div>

        {/* Invariant Policy (K-03) */}
        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/70 shadow-sm space-y-2">
          <div className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">
            Kebijakan Kurasi (K-03)
          </div>
          <p className="text-[11px] text-amber-900/80 leading-relaxed">
            Pengeditan karya atau produk yang sudah <strong>PUBLISHED</strong> akan otomatis dialihkan
            kembali ke <strong>PENDING_REVIEW</strong> untuk verifikasi ulang integritas data.
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Showcase Management Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <Link
              to="/dashboard/kreator/works"
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>Buka Manajemen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900">Kelola Karya Showcase</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Arsipkan kain tenun gedhog pusaka, batik tulis canting, dan karya kriya adiluhung Anda lengkap dengan narasi motif dan dokumentasi foto.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500">{works.length} Total Karya Terdaftar</span>
            <Link
              to="/dashboard/kreator/works?action=new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Karya Baru</span>
            </Link>
          </div>
        </div>

        {/* Pasar Management Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <Link
              to="/dashboard/kreator/products"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Buka Manajemen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900">Kelola Produk Pasar Ekraf</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Daftarkan kain panjang, sarung tenun, scarf, atau busana siap pakai Anda untuk dipasarkan langsung dengan integrasi WhatsApp.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500">{products.length} Total Produk Terdaftar</span>
            <Link
              to="/dashboard/kreator/products?action=new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Produk Baru</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
