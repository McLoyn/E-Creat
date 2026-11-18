import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-forest text-surface/85 mt-auto border-t border-forest-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-surface font-bold text-lg">
              <div className="w-8 h-8 rounded-tk-md bg-gold flex items-center justify-center text-forest shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-display text-xl tracking-wide">Ekraf HUB Tuban</span>
            </div>
            <p className="text-sm leading-relaxed text-surface/75 max-w-md">
              Pusat ekosistem digital untuk memetakan, menghubungkan, dan mempercepat pertumbuhan talenta kreatif, UMKM karya, dan sub-aplikasi komunitas di Kabupaten Tuban.
            </p>
            <div className="p-4 rounded-tk-md bg-forest-800/80 border border-surface/10 text-xs text-surface/80 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 text-gold font-semibold">
                <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                <span>Pemberitahuan Independensi Komunitas</span>
              </div>
              <p>
                Ekraf HUB merupakan inisiatif komunitas independen yang digagas oleh <strong>Tuban Creative Hub</strong>. Platform ini tidak berafiliasi resmi, didanai, atau bertindak atas mandat instansi/lembaga pemerintahan mana pun.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gold font-semibold text-xs uppercase tracking-wider mb-4">Navigasi Utama</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-gold transition-colors">Beranda</Link>
              </li>
              <li>
                <Link to="/sub-apps" className="hover:text-gold transition-colors">Direktori Sub-App</Link>
              </li>
              <li>
                <Link to="/creative" className="hover:text-gold transition-colors">Direktori Pelaku Kreatif</Link>
              </li>
              <li>
                <Link to="/showcase" className="hover:text-gold transition-colors">Showcase Karya</Link>
              </li>
              <li>
                <Link to="/pasar" className="hover:text-gold transition-colors">Pasar Ekraf</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-gold transition-colors">Masuk Akun Kreator</Link>
              </li>
            </ul>
          </div>

          {/* Ecosystem Exploration */}
          <div>
            <h4 className="text-gold font-semibold text-xs uppercase tracking-wider mb-4">Jelajahi Ekosistem</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/sub-apps" className="hover:text-gold transition-colors">
                  Katalog Layanan Digital
                </Link>
              </li>
              <li>
                <Link to="/showcase" className="hover:text-gold transition-colors">
                  Galeri Karya Komunitas
                </Link>
              </li>
              <li>
                <Link to="/pasar" className="hover:text-gold transition-colors">
                  Produk Kriya &amp; Wastra
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-gold transition-colors">
                  Pendaftaran Akun Kreator
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-forest-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface/60">
          <p>© {new Date().getFullYear()} Ekraf HUB — Inisiatif Komunitas Tuban Creative Hub. Seluruh hak cipta dilindungi.</p>
          <p className="text-surface/50">Dibangun untuk pemberdayaan ekonomi kreatif lokal Tuban.</p>
        </div>
      </div>
    </footer>
  );
};
