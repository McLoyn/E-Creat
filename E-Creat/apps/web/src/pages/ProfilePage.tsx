import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { apiFetch } from '../api/client.js';
import { User, MapPin, Tag, Check, AlertCircle, Loader2, Upload } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [locationText, setLocationText] = useState('');
  const [bio, setBio] = useState('');
  const [photoPath, setPhotoPath] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const catRes = await apiFetch<{ data: any[] }>('/categories?kind=SUBSECTOR');
        setCategories(catRes.data || []);

        const profRes = await apiFetch<{ data: any }>('/me/profile');
        const p = profRes.data;
        if (p) {
          setDisplayName(p.displayName || '');
          setLocationText(p.locationText || '');
          setBio(p.bio || '');
          setPhotoPath(p.photoPath || '');
          setSelectedInterests(p.interests?.map((i: any) => i.categoryId) || []);
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
      }
    }
    loadData();
  }, []);

  const handleInterestToggle = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== id));
    } else {
      if (selectedInterests.length >= 5) {
        setMessage({ type: 'error', text: 'Maksimal 5 subsektor minat yang dapat dipilih.' });
        return;
      }
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran foto maksimal 2MB.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setMessage(null);
    try {
      const res = await apiFetch<{ data: { path: string } }>('/uploads/images', {
        method: 'POST',
        body: formData,
      });
      setPhotoPath(res.data.path);
      setMessage({ type: 'success', text: 'Foto berhasil diunggah! Jangan lupa simpan profil.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengunggah foto.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await apiFetch('/me/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName,
          locationText,
          bio,
          photoPath,
          interestCategoryIds: selectedInterests,
        }),
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Profil Anda berhasil diperbarui.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal memperbarui profil.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Profil Pengguna
        </h1>
        <p className="text-slate-500 text-sm">
          Kelola informasi identitas akun, lokasi, dan preferensi minat subsektor kreatif Anda.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        {/* Photo Avatar Row */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center overflow-hidden shrink-0">
            {photoPath ? (
              <img src={photoPath} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-amber-700" />
            )}
          </div>
          <div className="space-y-1.5">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Mengunggah...' : 'Pilih Foto Profil (Max 2MB)'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-slate-400">Format yang didukung: JPG, PNG, WebP.</p>
          </div>
        </div>

        {/* Readonly Account Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Email Akun (Terkunci)</label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-sm cursor-not-allowed"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Peran Sistem</label>
            <input
              type="text"
              disabled
              value={user?.role || 'USER'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-sm cursor-not-allowed font-mono"
            />
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Nama Tampilan</label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
          />
        </div>

        {/* Location Text */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Lokasi / Asal Kecamatan</label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="Contoh: Kec. Semanding, Tuban"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-700">Bio Singkat</label>
            <span className="text-[10px] text-slate-400">{bio.length}/500 karakter</span>
          </div>
          <textarea
            rows={3}
            maxLength={500}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ceritakan latar belakang karya atau ketertarikan Anda..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
          />
        </div>

        {/* Interest Subsectors (Max 5) */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Minat Subsektor Kreatif (Maksimal 5)</span>
            </label>
            <span className="text-xs font-bold text-amber-700">
              {selectedInterests.length}/5 dipilih
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {categories.map((cat) => {
              const isSelected = selectedInterests.includes(cat.id);
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => handleInterestToggle(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
};
