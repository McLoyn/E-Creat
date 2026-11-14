import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../api/client.js';
import { Badge } from '../../components/Badge.js';
import {
  Sparkles,
  Plus,
  ArrowLeft,
  Edit2,
  Send,
  Archive,
  AlertCircle,
  Clock,
  CheckCircle,
  X,
  Upload,
  Loader2,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';

interface WorkItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  imagePaths: string;
  images?: string[];
  technique: string | null;
  motif: string | null;
  year: number | null;
  status: string;
  reviewNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
}

export const ManageWorksPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingWork, setEditingWork] = useState<WorkItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formMotif, setFormMotif] = useState('');
  const [formTechnique, setFormTechnique] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [worksRes, catsRes] = await Promise.all([
        apiFetch<{ data: WorkItem[] }>('/me/works'),
        apiFetch<{ data: any[] }>('/categories?kind=WORK_CATEGORY'),
      ]);
      setWorks(worksRes.data);
      setCategories(catsRes.data);

      if (searchParams.get('action') === 'new') {
        openCreateModal();
        searchParams.delete('action');
        setSearchParams(searchParams);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal memuat data karya.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingWork(null);
    setFormTitle('');
    setFormSlug('');
    setFormDescription('');
    setFormCategoryId('');
    setFormMotif('');
    setFormTechnique('');
    setFormYear(new Date().getFullYear().toString());
    setFormImages([]);
    setImageUrlInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (w: WorkItem) => {
    setEditingWork(w);
    setFormTitle(w.title);
    setFormSlug(w.slug);
    setFormDescription(w.description);
    setFormCategoryId(w.categoryId || '');
    setFormMotif(w.motif || '');
    setFormTechnique(w.technique || '');
    setFormYear(w.year ? w.year.toString() : '');

    let parsedImages: string[] = [];
    try {
      parsedImages = Array.isArray(w.images) ? w.images : JSON.parse(w.imagePaths);
    } catch {
      parsedImages = [];
    }
    setFormImages(parsedImages);
    setImageUrlInput('');
    setIsModalOpen(true);
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (formImages.length >= 5) {
      alert('Maksimal 5 foto per karya (K-05).');
      return;
    }
    setFormImages([...formImages, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (formImages.length >= 5) {
      alert('Maksimal 5 foto per karya (K-05).');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/uploads/images', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gagal mengunggah foto.');

      setFormImages([...formImages, data.data.path]);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah gambar.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormImages(formImages.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Judul dan Deskripsi karya wajib diisi.');
      return;
    }

    setSaving(true);
    setActionMessage(null);

    const payload = {
      title: formTitle.trim(),
      slug: formSlug.trim() || undefined,
      description: formDescription.trim(),
      categoryId: formCategoryId || undefined,
      motif: formMotif.trim() || undefined,
      technique: formTechnique.trim() || undefined,
      year: formYear ? parseInt(formYear, 10) : undefined,
      imagePaths: formImages,
    };

    try {
      if (editingWork) {
        await apiFetch(`/me/works/${editingWork.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setActionMessage({
          type: 'success',
          text: editingWork.status === 'PUBLISHED'
            ? 'Karya berhasil diperbarui! Karena berstatus PUBLISHED, karya dialihkan ke PENDING_REVIEW (K-03).'
            : 'Perubahan karya berhasil disimpan.',
        });
      } else {
        await apiFetch('/me/works', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setActionMessage({ type: 'success', text: 'Karya baru berhasil dibuat dalam status DRAFT.' });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal menyimpan karya.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async (id: string, title: string) => {
    if (!confirm(`Ajukan karya "${title}" untuk peninjauan moderasi Administrator?`)) return;

    setActionMessage(null);
    try {
      await apiFetch(`/me/works/${id}/submit`, { method: 'POST' });
      setActionMessage({ type: 'success', text: `Karya "${title}" berhasil diajukan untuk peninjauan moderasi.` });
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal mengajukan karya.' });
    }
  };

  const handleArchive = async (id: string, title: string) => {
    if (!confirm(`Arsipkan karya "${title}"? Karya ini tidak akan ditampilkan lagi secara publik.`)) return;

    setActionMessage(null);
    try {
      await apiFetch(`/me/works/${id}/archive`, { method: 'POST' });
      setActionMessage({ type: 'success', text: `Karya "${title}" berhasil diarsipkan.` });
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal mengarsipkan karya.' });
    }
  };

  const getStatusBadgeVariant = (status: string): any => {
    switch (status) {
      case 'PUBLISHED':
        return 'published';
      case 'PENDING_REVIEW':
        return 'pending';
      case 'NEEDS_REVISION':
        return 'revision';
      case 'REJECTED':
        return 'rejected';
      case 'ARCHIVED':
        return 'archived';
      case 'DRAFT':
      default:
        return 'draft';
    }
  };

  const filteredWorks = works.filter((w) => {
    if (statusFilter === 'ALL') return true;
    return w.status === statusFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/dashboard/kreator"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dasbor Kreator</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-600" />
            <span>Kelola Karya Showcase</span>
          </h1>
          <p className="text-xs text-slate-500">
            Daftar karya seni, wastra tenun, dan motif otentik milik profil kreator Anda.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-600/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Karya Baru</span>
        </button>
      </div>

      {/* Alert Message Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {['ALL', 'DRAFT', 'PENDING_REVIEW', 'NEEDS_REVISION', 'PUBLISHED', 'ARCHIVED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === st
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st === 'ALL'
              ? 'Semua Status'
              : st === 'PENDING_REVIEW'
              ? 'Menunggu Review'
              : st === 'NEEDS_REVISION'
              ? 'Perlu Revisi'
              : st}
          </button>
        ))}
      </div>

      {/* Works List Table / Cards */}
      {loading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : filteredWorks.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white border border-slate-200 p-8 space-y-3">
          <Sparkles className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">Tidak ada karya yang sesuai filter</h3>
          <p className="text-xs text-slate-500">Mulai dengan menambahkan karya seni pertama Anda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorks.map((work) => {
            let images: string[] = [];
            try {
              images = Array.isArray(work.images) ? work.images : JSON.parse(work.imagePaths);
            } catch {
              images = [];
            }
            const cover = images[0] || null;

            return (
              <div
                key={work.id}
                className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-amber-200 transition"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {cover ? (
                      <img src={cover} alt={work.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(work.status)}>
                        {work.status}
                      </Badge>
                      {work.category && (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {work.category.name}
                        </span>
                      )}
                      {work.year && (
                        <span className="text-[11px] text-slate-400 font-medium">Tahun {work.year}</span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 truncate">
                      {work.title}
                    </h3>

                    {work.motif && (
                      <div className="text-xs text-amber-800 font-medium">
                        Motif: <strong>{work.motif}</strong>
                      </div>
                    )}

                    {/* Review Note Display */}
                    {(work.status === 'NEEDS_REVISION' || work.status === 'REJECTED') && work.reviewNote && (
                      <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-900 mt-2 space-y-0.5">
                        <strong className="block font-bold">Catatan Evaluasi Kurator:</strong>
                        <p>{work.reviewNote}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Button Group */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                  {work.status === 'PUBLISHED' && (
                    <Link
                      to={`/showcase/${work.slug}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1"
                    >
                      <span>Lihat Publik</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}

                  <button
                    onClick={() => openEditModal(work)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {(work.status === 'DRAFT' || work.status === 'NEEDS_REVISION' || work.status === 'REJECTED') && (
                    <button
                      onClick={() => handleSubmitForReview(work.id, work.title)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ajukan Moderasi</span>
                    </button>
                  )}

                  {work.status !== 'ARCHIVED' && (
                    <button
                      onClick={() => handleArchive(work.id, work.title)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Arsipkan Karya"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingWork ? 'Edit Karya Showcase' : 'Tambah Karya Showcase Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingWork ? `ID Karya: ${editingWork.id}` : 'Daftarkan karya baru dalam status DRAFT'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* K-03 Invariant Alert for editing published work */}
              {editingWork?.status === 'PUBLISHED' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Perhatian Kebijakan K-03</span>
                  </div>
                  <p className="text-amber-800">
                    Karya ini saat ini berstatus <strong>PUBLISHED</strong>. Menyimpan perubahan akan
                    mengembalikan status karya ke <strong>PENDING_REVIEW</strong> untuk ditinjau ulang
                    oleh kurator Administrator sebelum tayang kembali.
                  </p>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Judul Karya <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Kain Gedhog Motif Ganggang Sari Pewarna Alami"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* Category & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kategori Karya</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Pilih Kategori Karya</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tahun Pembuatan</label>
                  <input
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    placeholder="Contoh: 2024"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Motif & Technique */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Ragam Motif</label>
                  <input
                    type="text"
                    value={formMotif}
                    onChange={(e) => setFormMotif(e.target.value)}
                    placeholder="Contoh: Ganggang Sari, Kijing Miring, Lok Can"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Teknik & Pewarnaan</label>
                  <input
                    type="text"
                    value={formTechnique}
                    onChange={(e) => setFormTechnique(e.target.value)}
                    placeholder="Contoh: Batik Tulis Canting Tangan di atas Tenun Gedhog"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Images Section (Max 5) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Dokumentasi Foto Karya (Maksimal 5) <span className="text-rose-500">*</span></span>
                  <span className="text-slate-400 font-normal">{formImages.length}/5 Foto</span>
                </label>

                {/* Thumbnails row */}
                <div className="flex flex-wrap gap-2.5">
                  {formImages.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                      <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {formImages.length < 5 && (
                    <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-400 flex flex-col items-center justify-center text-slate-400 hover:text-amber-600 cursor-pointer transition">
                      {uploadingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mb-0.5" />
                          <span className="text-[9px] font-bold">Upload</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploadingImage} />
                    </label>
                  )}
                </div>

                {/* Add by URL input */}
                {formImages.length < 5 && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Atau masukkan URL gambar langsung (https://...)"
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                    >
                      Tambah URL
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Deskripsi & Narasi Filosofi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ceritakan latar belakang, makna simbolis motif, proses pengerjaan, dan keunikan karya ini..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingWork ? 'Simpan Perubahan' : 'Buat Karya (Draft)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
