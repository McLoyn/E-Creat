import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Badge } from '../../components/Badge.js';
import {
  Plus,
  Grid,
  CheckCircle,
  FileEdit,
  Archive,
  RotateCcw,
  ExternalLink,
  Loader2,
  X,
  AlertCircle,
  Upload,
} from 'lucide-react';

export const AdminSubAppsPage: React.FC = () => {
  const [subApps, setSubApps] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appRes, catRes] = await Promise.all([
        apiFetch<{ data: any[] }>('/admin/sub-apps?pageSize=50'),
        apiFetch<{ data: any[] }>('/categories?kind=SUBAPP_TYPE'),
      ]);
      setSubApps(appRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Failed to load sub-apps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingApp(null);
    setName('');
    setSlug('');
    setTagline('');
    setDescription('');
    setExternalUrl('');
    setImagePath('');
    setSelectedCategories([]);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (app: any) => {
    setEditingApp(app);
    setName(app.name);
    setSlug(app.slug);
    setTagline(app.tagline);
    setDescription(app.description);
    setExternalUrl(app.externalUrl);
    setImagePath(app.imagePath || '');
    setSelectedCategories(app.categories?.map((c: any) => c.category.id) || []);
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
      if (editingApp) {
        await apiFetch(`/admin/sub-apps/${editingApp.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            slug: slug || undefined,
            tagline,
            description,
            externalUrl,
            imagePath: imagePath || null,
            categoryIds: selectedCategories,
          }),
        });
      } else {
        await apiFetch('/admin/sub-apps', {
          method: 'POST',
          body: JSON.stringify({
            name,
            slug: slug || undefined,
            tagline,
            description,
            externalUrl,
            imagePath: imagePath || null,
            categoryIds: selectedCategories,
          }),
        });
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan Sub-App.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (id: string, action: 'publish' | 'unpublish' | 'archive' | 'restore') => {
    setActionLoadingId(id);
    try {
      await apiFetch(`/admin/sub-apps/${id}/${action}`, { method: 'POST' });
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
          <h2 className="text-xl font-bold text-slate-900">Manajemen Sub-Aplikasi</h2>
          <p className="text-xs text-slate-500">
            Daftar seluruh platform ekosistem dengan kontrol publikasi (DRAFT → PUBLISHED → ARCHIVED).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Sub-App Baru</span>
        </button>
      </div>

      {/* Table Container */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          <p className="text-sm font-medium">Memuat data Sub-App...</p>
        </div>
      ) : subApps.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
          <Grid className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Belum ada Sub-App</h3>
          <p className="text-xs text-slate-500">Klik tombol di atas untuk mendaftarkan platform pertama.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nama & Tagline</th>
                  <th className="px-6 py-4">Tipe Kategori</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tautan Eksternal</th>
                  <th className="px-6 py-4 text-right">Aksi & Publikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 space-y-1">
                      <div className="font-bold text-slate-900 text-sm">{app.name}</div>
                      <div className="text-[11px] text-amber-700 truncate max-w-xs">{app.tagline}</div>
                      <div className="text-[10px] text-slate-400 font-mono">slug: {app.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {app.categories?.map((c: any) => (
                          <Badge key={c.category.id}>{c.category.name}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          app.status === 'PUBLISHED'
                            ? 'published'
                            : app.status === 'DRAFT'
                            ? 'draft'
                            : 'archived'
                        }
                      >
                        {app.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={app.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-amber-600 font-mono text-[11px]"
                      >
                        <span className="truncate max-w-[140px]">{app.externalUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => openEditModal(app)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px]"
                        >
                          Edit
                        </button>

                        {/* Lifecycle action buttons */}
                        {app.status === 'DRAFT' && (
                          <button
                            disabled={actionLoadingId === app.id}
                            onClick={() => handleTransition(app.id, 'publish')}
                            title="Publikasikan ke direktori publik"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 transition"
                          >
                            Rilis
                          </button>
                        )}

                        {app.status === 'PUBLISHED' && (
                          <button
                            disabled={actionLoadingId === app.id}
                            onClick={() => handleTransition(app.id, 'unpublish')}
                            title="Tarik kembali ke status Draft"
                            className="px-2.5 py-1.5 rounded-lg bg-amber-600 text-white font-semibold text-[11px] hover:bg-amber-700 transition"
                          >
                            Batal Rilis
                          </button>
                        )}

                        {app.status !== 'ARCHIVED' && (
                          <button
                            disabled={actionLoadingId === app.id}
                            onClick={() => handleTransition(app.id, 'archive')}
                            title="Arsipkan platform ini"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {app.status === 'ARCHIVED' && (
                          <button
                            disabled={actionLoadingId === app.id}
                            onClick={() => handleTransition(app.id, 'restore')}
                            title="Pulihkan kembali ke Draft"
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingApp ? 'Edit Sub-Aplikasi' : 'Tambah Sub-Aplikasi Baru'}
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
                <label className="text-xs font-semibold text-slate-700">Nama Sub-App *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Tuban Creative Directory"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Slug URL (Opsional)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="tuban-creative-directory"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tagline Singkat *</label>
                <input
                  type="text"
                  required
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Katalog terpadu profil kreator se-Kabupaten Tuban"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tautan Aplikasi Eksternal (URL) *</label>
                <input
                  type="url"
                  required
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://directory.example.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Gambar Cover (URL atau Unggah)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imagePath}
                    onChange={(e) => setImagePath(e.target.value)}
                    placeholder="https://... atau /uploads/..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                  />
                  <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Deskripsi Lengkap *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan tujuan dan fungsi platform ini..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Category selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Tipe Kategori Sub-App (Wajib untuk Rilis)</label>
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
                            ? 'bg-amber-600 text-white'
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
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
