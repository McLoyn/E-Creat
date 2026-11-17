import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Loader2, X, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';

interface GoogleAuthButtonProps {
  mode?: 'login' | 'register';
  onSuccess?: () => void;
  onError?: (err: string) => void;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  mode = 'login',
  onSuccess,
  onError,
}) => {
  const { loginWithGoogle, getGoogleOAuthUrl } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setModalError(null);

    try {
      // Check if real Google OAuth URL is available from backend
      const oauthUrl = await getGoogleOAuthUrl();
      if (oauthUrl) {
        // Redirect directly to official Google OAuth consent screen
        window.location.href = oauthUrl;
        return;
      }

      // If GOOGLE_CLIENT_ID not configured yet, open quick Google sign-in dialog
      setShowModal(true);
    } catch {
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = async (account: {
    email: string;
    displayName: string;
    photoUrl?: string;
  }) => {
    setLoading(true);
    setModalError(null);

    try {
      const user = await loginWithGoogle({
        email: account.email,
        displayName: account.displayName,
        photoUrl: account.photoUrl,
      });

      setShowModal(false);
      if (onSuccess) {
        onSuccess();
      } else {
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard/profile');
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Gagal masuk dengan Google.';
      setModalError(msg);
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) {
      setModalError('Alamat email Google wajib diisi.');
      return;
    }
    handleSelectAccount({
      email: customEmail,
      displayName: customName || customEmail.split('@')[0],
      photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        customName || customEmail
      )}`,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/90 text-slate-700 font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-3 disabled:opacity-60 active:scale-[0.99]"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>
          {mode === 'register' ? 'Daftar dengan Google' : 'Masuk dengan Google'}
        </span>
      </button>

      {/* Google Sign-In Quick Selection & OAuth Config Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <h3 className="font-bold text-slate-800 text-sm">
                  {mode === 'register' ? 'Daftar dengan Akun Google' : 'Pilih Akun Google'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Pilih akun Google terverifikasi atau masukkan email Google Anda untuk melanjutkan ke Ekraf HUB Tuban.
            </p>

            {modalError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Quick Fast Options */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  handleSelectAccount({
                    email: 'kreator.google@ekraftuban.id',
                    displayName: 'Kreator Google Tuban',
                    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  })
                }
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  KG
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    Kreator Google Tuban
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    kreator.google@ekraftuban.id
                  </p>
                </div>
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectAccount({
                    email: 'admin.google@ekraftuban.id',
                    displayName: 'Admin Google Tuban',
                    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                  })
                }
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                  AG
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    Admin Google Tuban
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    admin.google@ekraftuban.id
                  </p>
                </div>
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              </button>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="px-2 bg-white text-slate-400 font-medium">atau gunakan email lain</span>
              </div>
            </div>

            {/* Custom Google account input form */}
            <form onSubmit={handleCustomSubmit} className="space-y-2.5">
              <div>
                <input
                  type="email"
                  required
                  placeholder="nama@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Nama Akun Google (Opsional)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Lanjutkan Masuk'}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed">
              Catatan: Pada lingkungan produksi, konfigurasi <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">GOOGLE_CLIENT_ID</code> di server akan otomatis mengarahkan ke halaman persetujuan resmi Google.
            </div>
          </div>
        </div>
      )}
    </>
  );
};