import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Badge } from '../../components/Badge.js';
import {
  Plus,
  Users,
  Archive,
  RotateCcw,
  Loader2,
  X,
  AlertCircle,
  Upload,
  MapPin,
  UserCheck,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

const TUBAN_DISTRICTS = [
  'Bancar', 'Bangilan', 'Grabagan', 'Jatirogo', 'Jenu', 'Kenduruan',
  'Kerek', 'Merakurak', 'Montong', 'Palang', 'Plumpang', 'Rengel',
  'Semanding', 'Senori', 'Singgahan', 'Soko', 'Tambakboyo', 'Tuban Kota',
  'Widang'
];

export const AdminCreativesPage: React.FC = () => {
  const [creatives, setCreatives] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Tuban');
  const [district, setDistrict] = useState('Tuban Kota');
  const [imagePath, setImagePath] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Owner linking states (K-01)
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [profileForOwner, setProfileForOwner] = useState<any | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedOwnerUserId, setSelectedOwnerUserId] = useState('');
  const [ownerSubmitting, setOwnerSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [crRes, catRes] = await Promise.all([
        apiFetch<{ data: any[] }>('/admin/creative-profiles?pageSize=50'),
        apiFetch<{ data: any[] }>('/categories?kind=SUBSECTOR'),
      ]);
      setCreatives(crRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Failed to load creatives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProfile(null);
    setName('');
    setSlug('');
    setSummary('');
    setDescription('');
    setCity('Tuban');
    setDistrict('Tuban Kota');
    setImagePath('');
    setWebsiteUrl('');
    setInstagramHandle('');
    setWhatsappNumber('');
    setSelectedCategories([]);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (profile: any) => {
    setEditingProfile(profile);
    setName(profile.name);
    setSlug(profile.slug);
    setSummary(profile.summary);
    setDescription(profile.description);
    setCity(profile.city || 'Tuban');
    setDistrict(profile.district || 'Tuban Kota');
    setImagePath(profile.imagePath || '');
    setWebsiteUrl(profile.websiteUrl || '');
    setInstagramHandle(profile.instagramHandle || '');
    setWhatsappNumber(profile.whatsappNumber || '');
    setSelectedCategories(profile.categories?.map((c: any) => c.category.id) || []);
    setFormError(null);
    setModalOpen(true);
  };

  const openOwnerModal = async (profile: any) => {
    setProfileForOwner(profile);
    setSelectedOwnerUserId(profile.owner?.user?.id || '');
    setOwnerModalOpen(true);
    try {
      const res = await apiFetch<{ data: any[] }>('/admin/users');
      setUsersList(res.data);
    } catch (err) {
      console.error('Failed to load users for owner linking:', err);
    }
  };

  const handleSaveOwner = async (userId: string | null) => {
    if (!profileForOwner) return;
    setOwnerSubmitting(true);
    try {
      await apiFetch(`/admin/creative-profiles/${profileForOwner.id}/owner`, {
        method: 'PUT',
        body: JSON.stringify({ userId }),
      });
      setOwnerModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengatur pemilik profil.');
    } finally {
      setOwnerSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiFetch<{ data: { path: string } }>('/uploads/images', {
        method: 'POST',
        body: formData,
      });
      setImagePath(res.data.path);
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengunggah gambar.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingProfile) {
        await apiFetch(`/admin/creative-profiles/${editingProfile.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            slug: slug || undefined,
            summary,
            description,
            city,
            district,
            imagePath: imagePath || null,
            websiteUrl: websiteUrl || null,
            instagramHandle: instagramHandle || null,
            whatsappNumber: whatsappNumber || null,
            categoryIds: selectedCategories,
          }),
        });
      } else {
        await apiFetch('/admin/creative-profiles', {
          method: 'POST',
          body: JSON.stringify({
            name,
            slug: slug || undefined,
            summary,
            description,
            city,
            district,
            imagePath: imagePath || null,
            websiteUrl: websiteUrl || null,
            instagramHandle: instagramHandle || null,
            whatsappNumber: whatsappNumber || null,
            categoryIds: selectedCategories,
          }),
        });
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan profil.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (id: string, action: 'publish' | 'unpublish' | 'archive' | 'restore') => {
    setActionLoadingId(id);
    try {
      await apiFetch(`/admin/creative-profiles/${id}/${action}`, { method: 'POST' });
      await loadData();
    } catch (err: any) {
      alert(`Gagal mengubah status: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pelaku Kreatif Tuban</h2>
          <p className="text-xs text-slate-500">
            Kelola profil talenta, direktori brand, serta penautan akun pemilik perajin (K-01).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelaku Kreatif</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">Memuat data pelaku kreatif...</p>
        </div>
      ) : creatives.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Belum ada Pelaku Kreatif</h3>
          <p className="text-xs text-slate-500">Klik tombol di atas untuk menambahkan profil baru.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nama & Lokasi</th>
                  <th className="px-6 py-4">Pemilik Akun (K-01)</th>
                  <th className="px-6 py-4">Subsektor</th>
                  <th className="px-6 py-4">Status & Item</th>
                  <th className="px-6 py-4">Kontak</th>
                  <th className="px-6 py-4 text-right">Aksi & Publikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creatives.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 space-y-1">
                      <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>Kec. {c.district}, {c.city}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">slug: {c.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      {c.owner?.user ? (
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold">
                            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                            <span>{c.owner.user.email}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {c.owner.user.profile?.displayName || 'Pengguna Komunitas'}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-medium border border-slate-200">
                          Belum Ditautkan
                        </span>
                      )}
                      <div className="mt-1">
                        <button
                          onClick={() => openOwnerModal(c)}
                          className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline"
                        >
                          {c.owner?.user ? 'Ubah Pemilik' : 'Tautkan Akun'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {c.categories?.map((cat: any) => (
                          <Badge key={cat.category.id}>{cat.category.name}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1.5">
                      <Badge
                        variant={
                          c.status === 'PUBLISHED'
                            ? 'published'
                            : c.status === 'DRAFT'
                            ? 'draft'
                            : 'archived'
                        }
                      >
                        {c.status}
                      </Badge>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1 text-amber-700">
                          <Sparkles className="w-3 h-3" />
                          <span>{c._count?.works || 0} karya</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-emerald-700">
                          <ShoppingBag className="w-3 h-3" />
                          <span>{c._count?.products || 0} produk</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-0.5 font-mono text-[11px]">
                      {c.whatsappNumber && <div>WA: {c.whatsappNumber}</div>}
                      {c.instagramHandle && <div className="text-rose-600">{c.instagramHandle}</div>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => openEditModal(c)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px]"
                        >
                          Edit
                        </button>

                        {c.status === 'DRAFT' && (
                          <button
                            disabled={actionLoadingId === c.id}
                            onClick={() => handleTransition(c.id, 'publish')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 transition"
                          >
                            Rilis
                          </button>
                        )}

                        {c.status === 'PUBLISHED' && (
                          <button
                            disabled={actionLoadingId === c.id}
                            onClick={() => handleTransition(c.id, 'unpublish')}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-600 text-white font-semibold text-[11px] hover:bg-amber-700 transition"
                          >
                            Batal Rilis
                          </button>
                        )}

                        {c.status !== 'ARCHIVED' && (
                          <button
                            disabled={actionLoadingId === c.id}
                            onClick={() => handleTransition(c.id, 'archive')}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {c.status === 'ARCHIVED' && (
                          <button
                            disabled={actionLoadingId === c.id}
                            onClick={() => handleTransition(c.id, 'restore')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700 text-white font-semibold text-[11px] hover:bg-slate-800 transition"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Pulihkan</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingProfile ? 'Edit Pelaku Kreatif' : 'Tambah Pelaku Kreatif Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nama Pelaku / Usaha *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tenun Gedog Sekar Wangi"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Slug URL (Opsional)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="tenun-gedog-sekar-wangi"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Kota / Kab *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Kecamatan (Tuban) *</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {TUBAN_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        Kec. {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Ringkasan Singkat (Summary) *</label>
                <input
                  type="text"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Perajin kain tenun gedog pewarna alam tradisional Kerek..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Deskripsi Lengkap *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan sejarah, produk unggulan, dan keunikan karya..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">WhatsApp (contoh: 628123456780)</label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="628123456789"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Instagram Handle</label>
                  <input
                    type="text"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    placeholder="@nama_studio"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Website / Portofolio (URL)</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Foto Profil / Logo Brand</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imagePath}
                    onChange={(e) => setImagePath(e.target.value)}
                    placeholder="https://... atau upload"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer flex items-center gap-1 font-semibold">
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Subsektor Ekraf (Multi-select)</label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 bg-white max-h-36 overflow-y-auto">
                  {categories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCategories(selectedCategories.filter((id) => id !== cat.id));
                          } else {
                            setSelectedCategories([...selectedCategories, cat.id]);
                          }
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Owner Assignment Modal (K-01) */}
      {ownerModalOpen && profileForOwner && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                  <span>Tautkan Akun Pemilik (K-01)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Profil: <strong>{profileForOwner.name}</strong>
                </p>
              </div>
              <button onClick={() => setOwnerModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <strong className="block font-bold">Ketentuan Kepemilikan Profil (K-01):</strong>
                <p className="text-amber-800 leading-relaxed">
                  Menetapkan akun pengguna sebagai pemilik akan memberikan hak akses ke Studio Kreator
                  untuk menambah, mengedit, dan mengajukan moderasi karya Showcase serta produk Pasar atas nama profil ini.
                </p>
              </div>

              {profileForOwner.owner?.user && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-400 block">Pemilik Saat Ini:</span>
                    <strong className="text-slate-800">{profileForOwner.owner.user.email}</strong>
                  </div>
                  <button
                    disabled={ownerSubmitting}
                    onClick={() => handleSaveOwner(null)}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200"
                  >
                    Cabut Tautan
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Pilih Akun Pengguna</label>
                <select
                  value={selectedOwnerUserId}
                  onChange={(e) => setSelectedOwnerUserId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Pilih Akun Terdaftar --</option>
                  {usersList.map((u) => {
                    const isAlreadyLinkedOther =
                      u.creatorOwnership && u.creatorOwnership.creativeProfileId !== profileForOwner.id;
                    return (
                      <option key={u.id} value={u.id} disabled={isAlreadyLinkedOther}>
                        {u.email} ({u.profile?.displayName || 'User'})
                        {isAlreadyLinkedOther ? ` - (Sudah tertaut: ${u.creatorOwnership.creativeProfile.name})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOwnerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={ownerSubmitting || !selectedOwnerUserId}
                  onClick={() => handleSaveOwner(selectedOwnerUserId)}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {ownerSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Tautkan Akun'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
