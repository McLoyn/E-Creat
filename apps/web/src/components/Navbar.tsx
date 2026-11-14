import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  Compass,
  Grid,
  Users,
  Shield,
  LogOut,
  Menu,
  X,
  Sparkles,
  Tag,
  ChevronRight,
  Info,
  ShoppingBag,
  Palette,
  CheckCircle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setDrawerOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Hamburger Button (Desktop & Mobile) + Brand Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition"
                aria-label="Buka Menu Navigasi"
                title="Buka Menu Navigasi (Desktop & Mobile)"
              >
                <Menu className="w-5 h-5 text-slate-800" />
                <span className="hidden md:inline text-xs font-bold text-slate-700">Menu</span>
              </button>

              <Link
                to="/"
                className="flex items-center gap-2.5 font-bold text-xl text-slate-900 group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="leading-tight tracking-tight text-amber-900">
                    Ekraf <span className="text-amber-600 font-extrabold">HUB</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                    TUBAN CREATIVE HUB
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Desktop Quick Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/') && location.pathname === '/'
                    ? 'bg-amber-50 text-amber-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Beranda
              </Link>
              <Link
                to="/sub-apps"
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/sub-apps')
                    ? 'bg-amber-50 text-amber-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Sub-App
              </Link>
              <Link
                to="/creative"
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  isActive('/creative')
                    ? 'bg-amber-50 text-amber-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Pelaku Kreatif
              </Link>
              <Link
                to="/showcase"
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  isActive('/showcase')
                    ? 'bg-amber-50 text-amber-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Showcase
              </Link>
              <Link
                to="/pasar"
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  isActive('/pasar')
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Pasar Ekraf
              </Link>

              {user && (
                <Link
                  to="/dashboard/kreator"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive('/dashboard/kreator')
                      ? 'bg-amber-100 text-amber-800'
                      : 'text-amber-800 bg-amber-50 hover:bg-amber-100/70'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-amber-700" />
                  <span>Kreator</span>
                </Link>
              )}

              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive('/admin')
                      ? 'bg-purple-100 text-purple-800'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Panel
                </Link>
              )}
            </nav>

            {/* Right: User Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-xs font-semibold text-slate-700"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                      {user.profile?.displayName ? user.profile.displayName[0].toUpperCase() : 'U'}
                    </div>
                    <span className="max-w-[120px] truncate hidden sm:inline">
                      {user.profile?.displayName || user.email}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Keluar"
                    className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition shadow-amber-600/20"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Slide-over Left Navigation Drawer (Desktop & Mobile) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
            <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col justify-between border-r border-slate-200">
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Ekraf HUB Tuban</h3>
                      <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                        Menu Navigasi
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                    aria-label="Tutup Menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body Nav Links */}
                <div className="p-5 space-y-6 overflow-y-auto max-h-[calc(100vh-190px)]">
                  {/* Utama */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-1">
                      Menu Utama
                    </span>

                    <Link
                      to="/"
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                        isActive('/') && location.pathname === '/'
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Compass className="w-4 h-4 text-amber-600" />
                        <span>Beranda Ekosistem</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>

                    <Link
                      to="/sub-apps"
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                        isActive('/sub-apps')
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Grid className="w-4 h-4 text-amber-600" />
                        <span>Direktori Sub-Aplikasi</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>

                    <Link
                      to="/creative"
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                        isActive('/creative')
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-amber-600" />
                        <span>Direktori Pelaku Kreatif</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>

                    <Link
                      to="/showcase"
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                        isActive('/showcase')
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Showcase Karya Seni</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>

                    <Link
                      to="/pasar"
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                        isActive('/pasar')
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        <span>Pasar Ekraf Tuban</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </div>

                  {/* Kreator Section if logged in */}
                  {user && (
                    <div className="space-y-1 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider px-3 block mb-1">
                        Studio Kreator
                      </span>

                      <Link
                        to="/dashboard/kreator"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition"
                      >
                        <Palette className="w-4 h-4 text-amber-600" />
                        <span>Dasbor Karya & Produk</span>
                      </Link>
                      <Link
                        to="/dashboard/kreator/works"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition"
                      >
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Kelola Karya Showcase</span>
                      </Link>
                      <Link
                        to="/dashboard/kreator/products"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition"
                      >
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        <span>Kelola Produk Pasar</span>
                      </Link>
                    </div>
                  )}

                  {/* Admin section if ADMIN */}
                  {user?.role === 'ADMIN' && (
                    <div className="space-y-1 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider px-3 block mb-1">
                        Panel Administrator
                      </span>

                      <Link
                        to="/admin"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-800 transition"
                      >
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span>Ringkasan Metrik</span>
                      </Link>
                      <Link
                        to="/admin/moderation"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-800 transition"
                      >
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                        <span>Moderasi Karya & Produk</span>
                      </Link>
                      <Link
                        to="/admin/sub-apps"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-800 transition"
                      >
                        <Grid className="w-4 h-4 text-purple-600" />
                        <span>Kelola Sub-Aplikasi</span>
                      </Link>
                      <Link
                        to="/admin/creative-profiles"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-800 transition"
                      >
                        <Users className="w-4 h-4 text-purple-600" />
                        <span>Kelola Pelaku Kreatif</span>
                      </Link>
                      <Link
                        to="/admin/categories"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-800 transition"
                      >
                        <Tag className="w-4 h-4 text-purple-600" />
                        <span>Kelola Kategori</span>
                      </Link>
                    </div>
                  )}

                  {/* Akun */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-1">
                      Akses Akun
                    </span>
                    {user ? (
                      <div className="space-y-2">
                        <Link
                          to="/dashboard/profile"
                          onClick={() => setDrawerOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200/60"
                        >
                          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {user.profile?.displayName ? user.profile.displayName[0].toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-slate-900 truncate">
                              {user.profile?.displayName || 'Pengguna'}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                          </div>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 text-left transition"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Keluar dari Akun</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Link
                          to="/login"
                          onClick={() => setDrawerOpen(false)}
                          className="text-center py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Masuk
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setDrawerOpen(false)}
                          className="text-center py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-sm hover:bg-amber-700 transition"
                        >
                          Daftar
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Notice */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tuban Creative Hub</span>
                </div>
                <p className="leading-relaxed text-slate-500 text-[10px]">
                  Inisiatif komunitas mandiri untuk mendorong konektivitas dan pertumbuhan ekonomi kreatif Tuban.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
