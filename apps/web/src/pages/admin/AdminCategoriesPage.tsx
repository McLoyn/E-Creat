import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Badge } from '../../components/Badge.js';
import {
  Plus,
  Tag,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'SUBSECTOR' | 'SUBAPP_TYPE'>('SUBSECTOR');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await apiFetch<{ data: any[] }>('/admin/categories');
      setCategories(res.data || []);
    } catch (err: any) {
      setActionError(err.message || 'Gagal memuat kategori.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = categories.filter((c) => c.kind === activeTab);

  const openCreateModal = () => {
    setEditingCat(null);
    setName('');
    setSlug('');
    setDescription('');
    setSortOrder(filteredCategories.length);
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setSortOrder(cat.sortOrder || 0);
    setIsActive(cat.isActive);
    setFormError(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingCat) {
        await apiFetch(`/admin/categories/${editingCat.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            slug: slug || undefined,
            description: description || null,
            sortOrder,
            isActive,
          }),
        });
      } else {
        await apiFetch('/admin/categories', {
          method: 'POST',
          body: JSON.stringify({
            kind: activeTab,
            name,
            slug: slug || undefined,
            description: description || null,
            sortOrder,
            isActive,
          }),
        });
      }
      setModalOpen(false);
      await loadCategories();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan kategori.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: any) => {
    if (!confirm(`Hapus kategori "${cat.name}"? Jika sedang digunakan, sistem akan menolak penghapusan.`)) {
      return;
    }
    setActionError(null);
    try {
      await apiFetch(`/admin/categories/${cat.id}`, { method: 'DELETE' });
      await loadCategories();
    } catch (err: any) {
      setActionError(err.message || 'Gagal menghapus kategori.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Taksonomi Kategori & Subsektor</h2>
          <p className="text-xs text-slate-500">
            Kelola pembagian subsektor ekonomi kreatif dan klasifikasi jenis sub-aplikasi.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori Baru</span>
        </button>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Peringatan:</strong>
            {actionError}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('SUBSECTOR')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'SUBSECTOR'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Subsektor Ekonomi Kreatif ({categories.filter((c) => c.kind === 'SUBSECTOR').length})
        </button>
        <button
          onClick={() => setActiveTab('SUBAPP_TYPE')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'SUBAPP_TYPE'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Jenis Sub-Aplikasi ({categories.filter((c) => c.kind === 'SUBAPP_TYPE').length})
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm font-medium">Memuat data kategori...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-3">
          <Tag className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Belum ada kategori</h3>
          <p className="text-xs text-slate-500">Klik tombol di atas untuk membuat kategori baru.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Urutan</th>
                <th className="px-6 py-4">Nama & Slug</th>
                <th className="px-6 py-4">Deskripsi</th>
                <th className="px-6 py-4">Status Aktif</th>
                <th className="px-6 py-4">Penggunaan Terkait</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.map((cat) => {
                const totalUsed =
                  (cat._count?.subApps || 0) +
                  (cat._count?.creativeProfiles || 0) +
                  (cat._count?.userInterests || 0);

                return (
                  <tr key={cat.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-400">{cat.sortOrder}</td>
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="font-bold text-slate-900 text-sm">{cat.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">slug: {cat.slug}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs text-slate-500 truncate">
                      {cat.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {cat.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                          <Check className="w-3.5 h-3.5" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-xs">
                          <X className="w-3.5 h-3.5" />
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] ${
                          totalUsed > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {totalUsed} data terhubung
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          title="Edit Kategori"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 rounded-lg border border-slate-200 text-red-500 hover:bg-red-50"
                          title="Hapus Kategori (hanya jika belum terhubung)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Create / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCat ? 'Edit Kategori' : `Tambah Kategori (${activeTab})`}
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
                <label className="text-xs font-semibold text-slate-700">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kriya Kayu & Ukir"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Slug (Opsional)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="kriya-kayu-ukir"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan cakupan subsektor atau jenis..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Urutan Tampilan</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="pt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="catActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="catActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Kategori Aktif
                  </label>
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
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
