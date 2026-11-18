import React, { useState, useEffect, useRef } from 'react';
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

  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on route change
  useEffect(() => {
    if (drawerOpen) {
      setDrawerOpen(false);
    }
  }, [location.pathname]);

  // Handle drawer open/close focus management and keyboard handling
  useEffect(() => {
    if (drawerOpen) {
      // Focus close button on open
      const timer = setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setDrawerOpen(false);
          triggerRef.current?.focus();
          return;
        }

        // Trap focus inside drawer
        if (e.key === 'Tab' && drawerRef.current) {
          const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Restore focus to trigger button after closing
      if (document.activeElement === closeBtnRef.current) {
        triggerRef.current?.focus();
      }
    }
  }, [drawerOpen]);

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
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-line transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Hamburger Button (Desktop & Mobile) + Brand Logo */}
            <div className="flex items-center gap-3">
              <button
                ref={triggerRef}
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-tk-md text-ink hover:text-ink hover:bg-canvas border border-line transition-colors"
                aria-label="Buka Menu Navigasi"
                aria-haspopup="dialog"
                aria-expanded={drawerOpen}
                aria-controls="mobile-nav-drawer"
                title="Buka Menu Navigasi (Desktop & Mobile)"
              >
                <Menu className="w-5 h-5 text-ink" />
                <span className="hidden md:inline text-xs font-semibold text-ink">Menu</span>
              </button>

              <Link
                to="/"
                className="flex items-center gap-2.5 font-bold text-xl text-ink group focus:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded-tk-md"
              >
                <div className="w-9 h-9 rounded-tk-md bg-forest flex items-center justify-center text-gold shadow-sm group-hover:scale-105 motion-reduce:transform-none transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="leading-tight tracking-tight text-ink font-display text-lg">
                    Ekraf <span className="text-terracotta-600 font-extrabold font-sans">HUB</span>
                  </span>
                  <span className="text-[10px] text-ink-soft font-medium tracking-wider uppercase">
                    Tuban Creative Hub
                  </span>
                </div>
              </Link>
            </div>

            {/* Center: Desktop Quick Nav Links */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Navigasi Utama">
              <Link
                to="/"
                className={`px-3.5 py-2 rounded-tk-md text-sm font-medium transition-colors ${
                  isActive('/') && location.pathname === '/'
                    ? 'bg-canvas text-forest font-semibold'
                    : 'text-ink-soft hover:text-ink hover:bg-canvas/70'
                }`}
              >
                Beranda
              </Link>
              <Link
                to="/sub-apps"
                className={`px-3.5 py-2 rounded-tk-md text-sm font-medium transition-colors ${
                  isActive('/sub-apps')
                    ? 'bg-canvas text-forest font-semibold'
                    : 'text-ink-soft hover:text-ink hover:bg-canvas/70'
                }`}
              >
                Sub-App
              </Link>
              <Link
                to="/creative"
                className={`px-3.5 py-2 rounded-tk-md text-sm font-medium transition-colors ${
                  isActive('/creative')
                    ? 'bg-canvas text-forest font-semibold'
                    : 'text-ink-soft hover:text-ink hover:bg-canvas/70'
                }`}
              >
                Pelaku Kreatif
              </Link>
              <Link
                to="/showcase"
                className={`px-3.5 py-2 rounded-tk-md text-sm font-medium transition-colors ${
                  isActive('/showcase')
                    ? 'bg-canvas text-forest font-semibold'
                    : 'text-ink-soft hover:text-ink hover:bg-canvas/70'
                }`}
              >
                Showcase
              </Link>
              <Link
                to="/pasar"
                className={`px-3.5 py-2 rounded-tk-md text-sm font-medium transition-colors ${
                  isActive('/pasar')
                    ? 'bg-canvas text-forest font-semibold'
                    : 'text-ink-soft hover:text-ink hover:bg-canvas/70'
                }`}
              >
                Pasar Ekraf
              </Link>

              {user && (
                <Link
                  to="/dashboard/kreator"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-tk-md text-xs font-semibold transition-colors ${
                    isActive('/dashboard/kreator')
                      ? 'bg-terracotta-600/10 text-terracotta-600 font-bold'
                      : 'text-terracotta-600 bg-canvas hover:bg-terracotta-600/10'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Kreator</span>
                </Link>
              )}

              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-tk-md text-xs font-semibold transition-colors ${
                    isActive('/admin')
                      ? 'bg-forest text-surface font-bold'
                      : 'text-forest hover:bg-canvas'
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
                    className="flex items-center gap-2 px-3 py-1.5 rounded-tk-md border border-line hover:bg-canvas transition text-xs font-semibold text-ink"
                  >
                    <div className="w-6 h-6 rounded-full bg-forest text-gold flex items-center justify-center font-bold text-xs">
                      {user.profile?.displayName ? user.profile.displayName[0].toUpperCase() : 'U'}
                    </div>
                    <span className="max-w-[120px] truncate hidden sm:inline">
                      {user.profile?.displayName || user.email}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Keluar"
                    className="p-2 text-ink-soft hover:text-danger rounded-tk-md hover:bg-danger/10 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-2 text-xs font-semibold text-ink hover:text-terracotta-600 transition"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-xs font-semibold text-surface bg-terracotta-600 hover:bg-terracotta rounded-tk-md shadow-sm transition motion-reduce:transform-none"
                  >
                    Mulai Bergabung
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Slide-over Left Navigation Drawer (Desktop & Mobile) */}
      {drawerOpen && (
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu Navigasi"
          ref={drawerRef}
          className="fixed inset-0 z-50 overflow-hidden"
        >
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
            <div className="w-screen max-w-xs sm:max-w-sm bg-surface shadow-2xl flex flex-col justify-between border-r border-line">
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between p-5 border-b border-line bg-canvas">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-tk-md bg-forest flex items-center justify-center text-gold shadow-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-ink">Ekraf HUB Tuban</h3>
                      <p className="text-[10px] text-terracotta-600 font-bold uppercase tracking-wider">
                        Menu Navigasi
                      </p>
                    </div>
                  </div>
                  <button
                    ref={closeBtnRef}
                    onClick={() => {
                      setDrawerOpen(false);
                      triggerRef.current?.focus();
                    }}
                    className="p-2 rounded-tk-md text-ink-soft hover:text-ink hover:bg-line/40 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
                    aria-label="Tutup Menu Navigasi"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body Nav Links */}
                <div className="p-5 space-y-6 overflow-y-auto max-h-[calc(100vh-190px)]">
                  {/* Utama */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider px-3 block mb-1">
                      Menu Utama
                    </span>

                    <Link
                      to="/"
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-tk-md text-sm font-semibold transition ${
                        isActive('/') && location.pathname === '/'
                          ? 'bg-canvas text-forest font-bold'
                          : 'text-ink hover:bg-canvas/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Compass className="w-4 h-4 text-forest" />
                        <span>Beranda Ekosistem</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-ink-soft" />
                    </Link>

                    <Link
                      to="/sub-apps"
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-tk-md text-sm font-semibold transition ${
                        isActive('/sub-apps')
                          ? 'bg-canvas text-forest font-bold'
                          : 'text-ink hover:bg-canvas/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Grid className="w-4 h-4 text-forest" />
                        <span>Direktori Sub-Aplikasi</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-ink-soft" />
                    </Link>

                    <Link
                      to="/creative"
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-tk-md text-sm font-semibold transition ${
                        isActive('/creative')
                          ? 'bg-canvas text-forest font-bold'
                          : 'text-ink hover:bg-canvas/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-forest" />
                        <span>Direktori Pelaku Kreatif</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-ink-soft" />
                    </Link>

                    <Link
                      to="/showcase"
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-tk-md text-sm font-semibold transition ${
                        isActive('/showcase')
                          ? 'bg-canvas text-forest font-bold'
                          : 'text-ink hover:bg-canvas/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-gold" />
                        <span>Showcase Karya Seni</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-ink-soft" />
                    </Link>

                    <Link
                      to="/pasar"
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-tk-md text-sm font-semibold transition ${
                        isActive('/pasar')
                          ? 'bg-canvas text-forest font-bold'
                          : 'text-ink hover:bg-canvas/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4 text-terracotta-600" />
                        <span>Pasar Ekraf Tuban</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-ink-soft" />
                    </Link>
                  </div>

                  {/* Kreator Section if logged in */}
                  {user && (
                    <div className="space-y-1 pt-3 border-t border-line">
                      <span className="text-[11px] font-bold text-terracotta-600 uppercase tracking-wider px-3 block mb-1">
                        Studio Kreator
                      </span>

                      <Link
                        to="/dashboard/kreator"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-tk-md text-xs font-semibold text-ink hover:bg-canvas transition"
                      >
                        <Palette className="w-4 h-4 text-terracotta-600" />
                        <span>Dasbor Karya & Produk</span>
                      </Link>
                      <Link
                        to="/dashboard/kreator/works"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-tk-md text-xs font-semibold text-ink hover:bg-canvas transition"
                      >
                        <Sparkles className="w-4 h-4 text-gold" />
                        <span>Kelola Karya Showcase</span>
                      </Link>
                      <Link
                        to="/dashboard/kreator/products"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-tk-md text-xs font-semibold text-ink hover:bg-canvas transition"
                      >
                        <ShoppingBag className="w-4 h-4 text-forest" />
                        <span>Kelola Produk Pasar</span>
                      </Link>
                    </div>
                  )}

                  {/* Admin section if ADMIN */}
                  {user?.role === 'ADMIN' && (
                    <div className="space-y-1 pt-3 border-t border-line">
                      <span className="text-[11px] font-bold text-forest uppercase tracking-wider px-3 block mb-1">
                        Panel Administrator
                      </span>

                      <Link
                        to="/admin"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-tk-md text-xs font-semibold text-ink hover:bg-canvas transition"
                      >
                        <Shield className="w-4 h-4 text-forest" />
                        <span>Ringkasan Metrik</span>
                      </Link>
                      <Link
                        to="/admin/moderation"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-tk-md text-xs font-semibold text-ink hover:bg-canvas transition"
                      >
                        <CheckCircle className="w-4 h-4 text-forest" />
                        <span>Moderasi Karya & Produk</span>
                      </Link>
                      <Link
                        to="/admin/sub-apps"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-tk-md text-xs font-semibold text-ink hover:bg-canvas transition"
                      >
                        <Grid className="w-4 h-4 text-forest" />
                        <span>Kelola Sub-Aplikasi</span>
                      </Link>
                      <Link
                        to="/admin/creative-profiles"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-tk-md text-xs font-semibold text-ink hover:bg-canvas transition"
                      >
                        <Users className="w-4 h-4 text-forest" />
                        <span>Kelola Pelaku Kreatif</span>
                      </Link>
                      <Link
                        to="/admin/categories"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 rounded-tk-md text-xs font-semibold text-ink hover:bg-canvas transition"
                      >
                        <Tag className="w-4 h-4 text-forest" />
                        <span>Kelola Kategori</span>
                      </Link>
                    </div>
                  )}

                  {/* Akun */}
                  <div className="space-y-2 pt-3 border-t border-line">
                    <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider px-3 block mb-1">
                      Akses Akun
                    </span>
                    {user ? (
                      <div className="space-y-2">
                        <Link
                          to="/dashboard/profile"
                          onClick={() => setDrawerOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-tk-md bg-canvas hover:bg-line/40 transition border border-line"
                        >
                          <div className="w-9 h-9 rounded-tk-md bg-forest text-gold flex items-center justify-center font-bold text-xs shrink-0">
                            {user.profile?.displayName ? user.profile.displayName[0].toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-ink truncate">
                              {user.profile?.displayName || 'Pengguna'}
                            </div>
                            <div className="text-[11px] text-ink-soft truncate">{user.email}</div>
                          </div>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-tk-md text-xs font-semibold text-danger hover:bg-danger/10 text-left transition"
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
                          className="text-center py-2.5 rounded-tk-md border border-line text-xs font-semibold text-ink hover:bg-canvas transition"
                        >
                          Masuk
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setDrawerOpen(false)}
                          className="text-center py-2.5 rounded-tk-md bg-terracotta-600 text-surface text-xs font-semibold shadow-sm hover:bg-terracotta transition"
                        >
                          Bergabung
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Notice */}
              <div className="p-5 border-t border-line bg-canvas text-[11px] text-ink-soft space-y-1.5">
                <div className="font-bold text-ink flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-forest" />
                  <span>Tuban Creative Hub</span>
                </div>
                <p className="leading-relaxed text-ink-soft text-[10px]">
                  Inisiatif komunitas mandiri untuk mendorong konektivitas dan pertumbuhan ekonomi kreatif Kabupaten Tuban.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
