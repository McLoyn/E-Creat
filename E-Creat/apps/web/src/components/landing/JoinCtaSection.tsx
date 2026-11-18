import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Sparkles, ArrowRight, ShieldCheck, Palette } from 'lucide-react';

export const JoinCtaSection: React.FC = () => {
  const { user } = useAuth();

  return (
    <section className="py-14 sm:py-20 bg-forest text-surface relative overflow-hidden">
      {/* Editorial Decorative Background Elements */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gold/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-terracotta/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-800 border border-surface/15 text-gold text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ruang Pemberdayaan Talenta Tuban</span>
        </div>

        {user ? (
          /* User is already logged in */
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-surface leading-tight">
              Kembangkan Karya Anda di Ekosistem Ekraf HUB
            </h2>
            <p className="text-sm sm:text-base text-surface/80 leading-relaxed">
              Halo, <strong>{user.profile?.displayName || user.email}</strong>. Anda dapat mengunggah karya ke Showcase atau memublikasikan produk kriya Anda di Pasar Ekraf melalui studio kreator.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/dashboard/kreator"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-tk-md bg-gold hover:bg-gold/90 text-forest font-bold text-sm shadow-md transition"
              >
                <Palette className="w-4 h-4 text-forest" />
                <span>Buka Dasbor Kreator</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Guest visitor: honest registration flow */
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-surface leading-tight">
              Mari Tumbuh Bersama Ekosistem Kreatif Tuban
            </h2>
            <p className="text-sm sm:text-base text-surface/80 leading-relaxed">
              Daftarkan akun Anda untuk mempublikasikan portofolio karya dan produk lokal. Akun kreator akan diverifikasi dan diaktifkan oleh admin/kurator setelah pendaftaran selesai.
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-tk-md bg-terracotta-600 hover:bg-terracotta text-surface font-semibold text-sm shadow-md transition motion-reduce:transform-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <span>Mulai Bergabung Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-tk-md bg-forest-800 hover:bg-forest-900 text-surface/90 font-semibold text-sm border border-surface/20 transition"
              >
                <span>Sudah Punya Akun? Masuk</span>
              </Link>
            </div>

            <div className="pt-4 flex items-center justify-center gap-2 text-xs text-surface/70">
              <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
              <span>Aktivasi profil kreator diverifikasi oleh kurator komunitas</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
