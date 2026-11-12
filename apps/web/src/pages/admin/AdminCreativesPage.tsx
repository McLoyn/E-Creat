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
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Manajemen Pelaku Kreatif</h2>
          <p className="text-xs text-slate-500">
            Kurasi dan validasi data profil perajin, jenama lokal, dan seniman se-Kabupaten Tuban.
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

      {/* Table */}
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
                  <th className="px-6 py-4">Subsektor</th>
                  <th className="px-6 py-4">Status</th>
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
                      <div className="flex flex-wrap gap-1">
                        {c.categories?.map((cat: any) => (
                          <Badge key={cat.category.id}>{cat.category.name}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
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

      {/* Modal Create / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProfile ? 'Edit Pelaku Kreatif' : 'Tambah Pelaku Kreatif Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nama Pelaku / Studio *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Tenun Gedog Sekar Wangi"
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
                <label className="text-xs font-semibold text-slate-700">Foto Karya / Profil</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imagePath}
                    onChange={(e) => setImagePath(e.target.value)}
                    placeholder="https://... atau /uploads/..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Subsector selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Subsektor Ekraf (Wajib untuk Rilis)</label>
                <div className="flex flex-wrap gap-1.5">
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
    </div>
  );
};
