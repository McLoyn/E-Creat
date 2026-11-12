import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-lg">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Ekraf HUB Tuban</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-md">
              Pusat ekosistem digital untuk memetakan, menghubungkan, dan mempercepat pertumbuhan talenta kreatif, UMKM karya, dan sub-aplikasi komunitas di Kabupaten Tuban.
            </p>
            <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-400 font-semibold block mb-0.5">Pemberitahuan Independensi:</strong>
              Ekraf HUB merupakan inisiatif komunitas independen yang digagas oleh <strong>Tuban Creative Hub</strong>. Platform ini tidak berafiliasi resmi, didanai, atau bertindak atas mandat instansi/lembaga pemerintahan mana pun.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Navigasi Utama</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-amber-400 transition">Beranda</Link>
              </li>
              <li>
                <Link to="/sub-apps" className="hover:text-amber-400 transition">Direktori Sub-App</Link>
              </li>
              <li>
                <Link to="/creative" className="hover:text-amber-400 transition">Direktori Pelaku Kreatif</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-amber-400 transition">Masuk Akun Kreator</Link>
              </li>
            </ul>
          </div>

          {/* Ecosystem Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Mega Ekosistem</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://example.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-amber-400 transition"
                >
                  Tuban Creative Hub <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <Link to="/sub-apps" className="hover:text-amber-400 transition">
                  Katalog Layanan Digital
                </Link>
              </li>
              <li>
                <span className="text-slate-600 text-xs">Versi Prototipe V0.1</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Ekraf HUB — Inisiatif Komunitas Tuban Creative Hub. Seluruh hak cipta dilindungi.</p>
          <p className="text-slate-500">Dibangun untuk pemberdayaan ekonomi kreatif lokal.</p>
        </div>
      </div>
    </footer>
  );
};
