import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/client.js';
import {
  Grid,
  Users,
  Tag,
  UserCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  FileEdit,
  Archive,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await apiFetch<{ data: any }>('/admin/overview');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-sm font-medium">Memuat metrik ringkasan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Sub-Apps Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sub-App</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Grid className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats?.subApps?.total ?? 0}</div>
          <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
            <span className="text-emerald-700 font-semibold">{stats?.subApps?.published ?? 0} Rilis</span>
            <span>•</span>
            <span className="text-amber-700 font-semibold">{stats?.subApps?.draft ?? 0} Draft</span>
            <span>•</span>
            <span className="text-slate-600 font-semibold">{stats?.subApps?.archived ?? 0} Arsip</span>
          </div>
        </div>

        {/* Creatives Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pelaku Kreatif</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats?.creatives?.total ?? 0}</div>
          <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
            <span className="text-emerald-700 font-semibold">{stats?.creatives?.published ?? 0} Rilis</span>
            <span>•</span>
            <span className="text-amber-700 font-semibold">{stats?.creatives?.draft ?? 0} Draft</span>
            <span>•</span>
            <span className="text-slate-600 font-semibold">{stats?.creatives?.archived ?? 0} Arsip</span>
          </div>
        </div>

        {/* Categories Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Taksonomi Kategori</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats?.categories?.total ?? 0}</div>
          <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
            <span className="text-purple-700 font-semibold">{stats?.categories?.subsectors ?? 0} Subsektor</span>
            <span>•</span>
            <span className="text-slate-700 font-semibold">{stats?.categories?.subappTypes ?? 0} Tipe App</span>
          </div>
        </div>

        {/* Users Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Akun Terdaftar</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats?.users?.total ?? 0}</div>
          <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100">
            Pengguna aktif dalam database
          </div>
        </div>

        {/* Works Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Karya Showcase</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats?.works?.total ?? 0}</div>
          <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
            <span className="text-emerald-700 font-semibold">{stats?.works?.published ?? 0} Rilis</span>
            <span>•</span>
            <span className="text-amber-700 font-semibold">{stats?.works?.pending ?? 0} Review</span>
          </div>
        </div>

        {/* Products Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Produk Pasar</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats?.products?.total ?? 0}</div>
          <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
            <span className="text-emerald-700 font-semibold">{stats?.products?.published ?? 0} Rilis</span>
            <span>•</span>
            <span className="text-amber-700 font-semibold">{stats?.products?.pending ?? 0} Review</span>
          </div>
        </div>
      </div>

      {/* Quick Access Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/admin/moderation"
          className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition">
            Moderasi Karya & Produk
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tinjau kurasi karya seni dan produk baru yang diajukan para kreator sebelum tayang publik.
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 pt-2">
            <span>Buka Antrean Moderasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
        <Link
          to="/admin/sub-apps"
          className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Grid className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition">
            Kelola Sub-Aplikasi
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tambah platform baru, publikasikan draft, arsipkan layanan tidak aktif, atau perbarui tautan eksternal.
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 pt-2">
            <span>Buka Manajemen Sub-App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/admin/creative-profiles"
          className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition">
            Kelola Pelaku Kreatif
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Kurasi profil perajin, kelola kontak WhatsApp/Instagram bisnis, dan validasi subsektor karya.
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 pt-2">
            <span>Buka Manajemen Pelaku</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/admin/categories"
          className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition">
            Kelola Kategori
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Kelola taksonomi 17 subsektor ekonomi kreatif dan jenis sub-app untuk klasifikasi data.
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 pt-2">
            <span>Buka Manajemen Kategori</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
};
