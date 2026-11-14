import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../api/client.js';
import { Badge } from '../../components/Badge.js';
import {
  ShoppingBag,
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
  Sparkles,
} from 'lucide-react';

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  imagePaths: string;
  images?: string[];
  productTypeId: string;
  productType: { id: string; name: string; slug: string } | null;
  workId: string | null;
  work?: { id: string; title: string; slug: string } | null;
  material: string | null;
  dimensions: string | null;
  priceMin: number | null;
  priceMax: number | null;
  priceUnit: string | null;
  availability: 'AVAILABLE' | 'MADE_TO_ORDER' | 'UNAVAILABLE';
  leadTimeDays?: number | null;
  status: string;
  reviewNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
}

export const ManageProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [myWorks, setMyWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formProductTypeId, setFormProductTypeId] = useState('');
  const [formWorkId, setFormWorkId] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formDimensions, setFormDimensions] = useState('');
  const [formPriceMode, setFormPriceMode] = useState<'FIXED' | 'RANGE' | 'CONTACT'>('FIXED');
  const [formPriceMin, setFormPriceMin] = useState('');
  const [formPriceMax, setFormPriceMax] = useState('');
  const [formPriceUnit, setFormPriceUnit] = useState('pcs');
  const [formAvailability, setFormAvailability] = useState<'AVAILABLE' | 'MADE_TO_ORDER' | 'UNAVAILABLE'>('AVAILABLE');
  const [formLeadTime, setFormLeadTime] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsRes, typesRes, worksRes] = await Promise.all([
        apiFetch<{ data: ProductItem[] }>('/me/products'),
        apiFetch<{ data: any[] }>('/categories?kind=PRODUCT_TYPE'),
        apiFetch<{ data: any[] }>('/me/works'),
      ]);
      setProducts(prodsRes.data);
      setProductTypes(typesRes.data);
      setMyWorks(worksRes.data);

      if (searchParams.get('action') === 'new') {
        openCreateModal();
        searchParams.delete('action');
        setSearchParams(searchParams);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal memuat data produk.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormSlug('');
    setFormDescription('');
    setFormProductTypeId(productTypes[0]?.id || '');
    setFormWorkId('');
    setFormMaterial('');
    setFormDimensions('');
    setFormPriceMode('FIXED');
    setFormPriceMin('');
    setFormPriceMax('');
    setFormPriceUnit('pcs');
    setFormAvailability('AVAILABLE');
    setFormLeadTime('');
    setFormImages([]);
    setImageUrlInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setFormTitle(p.title);
    setFormSlug(p.slug);
    setFormDescription(p.description);
    setFormProductTypeId(p.productTypeId);
    setFormWorkId(p.workId || '');
    setFormMaterial(p.material || '');
    setFormDimensions(p.dimensions || '');

    if (p.priceMin === null && p.priceMax === null) {
      setFormPriceMode('CONTACT');
      setFormPriceMin('');
      setFormPriceMax('');
    } else if (p.priceMin !== null && p.priceMax !== null && p.priceMin !== p.priceMax) {
      setFormPriceMode('RANGE');
      setFormPriceMin(p.priceMin.toString());
      setFormPriceMax(p.priceMax.toString());
    } else {
      setFormPriceMode('FIXED');
      setFormPriceMin(p.priceMin ? p.priceMin.toString() : '');
      setFormPriceMax('');
    }

    setFormPriceUnit(p.priceUnit || 'pcs');
    setFormAvailability(p.availability);
    setFormLeadTime(p.leadTimeDays ? p.leadTimeDays.toString() : '');

    let parsedImages: string[] = [];
    try {
      parsedImages = Array.isArray(p.images) ? p.images : JSON.parse(p.imagePaths);
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
      alert('Maksimal 5 foto per produk (K-05).');
      return;
    }
    setFormImages([...formImages, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (formImages.length >= 5) {
      alert('Maksimal 5 foto per produk (K-05).');
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
    if (!formTitle.trim() || !formDescription.trim() || !formProductTypeId) {
      alert('Nama produk, deskripsi, dan jenis produk wajib diisi.');
      return;
    }

    setSaving(true);
    setActionMessage(null);

    let calculatedMin: number | null = null;
    let calculatedMax: number | null = null;

    if (formPriceMode === 'FIXED') {
      const val = parseInt(formPriceMin, 10);
      calculatedMin = isNaN(val) ? null : val;
      calculatedMax = calculatedMin;
    } else if (formPriceMode === 'RANGE') {
      const min = parseInt(formPriceMin, 10);
      const max = parseInt(formPriceMax, 10);
      calculatedMin = isNaN(min) ? null : min;
      calculatedMax = isNaN(max) ? null : max;
    }

    const payload = {
      title: formTitle.trim(),
      slug: formSlug.trim() || undefined,
      description: formDescription.trim(),
      productTypeId: formProductTypeId,
      workId: formWorkId || null,
      material: formMaterial.trim() || undefined,
      dimensions: formDimensions.trim() || undefined,
      priceMin: calculatedMin,
      priceMax: calculatedMax,
      priceUnit: formPriceUnit.trim() || 'pcs',
      availability: formAvailability,
      leadTimeDays: formAvailability === 'MADE_TO_ORDER' && formLeadTime ? parseInt(formLeadTime, 10) : null,
      imagePaths: formImages,
    };

    try {
      if (editingProduct) {
        await apiFetch(`/me/products/${editingProduct.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setActionMessage({
          type: 'success',
          text: editingProduct.status === 'PUBLISHED'
            ? 'Produk berhasil diperbarui! Karena berstatus PUBLISHED, produk dialihkan ke PENDING_REVIEW (K-03).'
            : 'Perubahan produk berhasil disimpan.',
        });
      } else {
        await apiFetch('/me/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setActionMessage({ type: 'success', text: 'Produk baru berhasil dibuat dalam status DRAFT.' });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal menyimpan produk.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async (id: string, title: string) => {
    if (!confirm(`Ajukan produk "${title}" untuk peninjauan moderasi Administrator?`)) return;

    setActionMessage(null);
    try {
      await apiFetch(`/me/products/${id}/submit`, { method: 'POST' });
      setActionMessage({ type: 'success', text: `Produk "${title}" berhasil diajukan untuk peninjauan moderasi.` });
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal mengajukan produk.' });
    }
  };

  const handleArchive = async (id: string, title: string) => {
    if (!confirm(`Arsipkan produk "${title}"? Produk ini tidak akan ditampilkan lagi di katalog publik.`)) return;

    setActionMessage(null);
    try {
      await apiFetch(`/me/products/${id}/archive`, { method: 'POST' });
      setActionMessage({ type: 'success', text: `Produk "${title}" berhasil diarsipkan.` });
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Gagal mengarsipkan produk.' });
    }
  };

  const formatPriceDisplay = (p: ProductItem) => {
    const unit = p.priceUnit ? ` / ${p.priceUnit}` : '';
    if (p.priceMin === null && p.priceMax === null) return 'Hubungi Penjual';
    if (p.priceMin !== null && p.priceMax !== null && p.priceMin === p.priceMax) {
      return `Rp ${p.priceMin.toLocaleString('id-ID')}${unit}`;
    }
    if (p.priceMin !== null && p.priceMax !== null) {
      return `Rp ${p.priceMin.toLocaleString('id-ID')} - Rp ${p.priceMax.toLocaleString('id-ID')}${unit}`;
    }
    if (p.priceMin !== null) return `Mulai Rp ${p.priceMin.toLocaleString('id-ID')}${unit}`;
    return `Maks. Rp ${p.priceMax?.toLocaleString('id-ID')}${unit}`;
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

  const filteredProducts = products.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
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
            <ShoppingBag className="w-6 h-6 text-emerald-600" />
            <span>Kelola Produk Pasar Ekraf</span>
          </h1>
          <p className="text-xs text-slate-500">
            Daftar produk komersial, kain tenun gedhog, sarung, dan busana yang terhubung ke kontak pembeli.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk Baru</span>
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
                ? 'bg-emerald-600 text-white shadow-sm'
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

      {/* Products List */}
      {loading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white border border-slate-200 p-8 space-y-3">
          <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">Tidak ada produk yang sesuai filter</h3>
          <p className="text-xs text-slate-500">Mulai dengan menambahkan produk kreatif pertama Anda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((prod) => {
            let images: string[] = [];
            try {
              images = Array.isArray(prod.images) ? prod.images : JSON.parse(prod.imagePaths);
            } catch {
              images = [];
            }
            const cover = images[0] || null;

            return (
              <div
                key={prod.id}
                className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-emerald-200 transition"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {cover ? (
                      <img src={cover} alt={prod.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(prod.status)}>
                        {prod.status}
                      </Badge>
                      {prod.productType && (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {prod.productType.name}
                        </span>
                      )}
                      <span className="text-[11px] font-medium text-slate-400">
                        {prod.availability === 'AVAILABLE' ? 'Ready Stock' : prod.availability === 'MADE_TO_ORDER' ? 'Pre-Order' : 'Habis'}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 truncate">
                      {prod.title}
                    </h3>

                    <div className="text-sm font-black text-emerald-700">
                      {formatPriceDisplay(prod)}
                    </div>

                    {/* Review Note Display */}
                    {(prod.status === 'NEEDS_REVISION' || prod.status === 'REJECTED') && prod.reviewNote && (
                      <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-900 mt-2 space-y-0.5">
                        <strong className="block font-bold">Catatan Evaluasi Kurator:</strong>
                        <p>{prod.reviewNote}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Button Group */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                  {prod.status === 'PUBLISHED' && (
                    <Link
                      to={`/pasar/${prod.slug}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1"
                    >
                      <span>Lihat Publik</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}

                  <button
                    onClick={() => openEditModal(prod)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {(prod.status === 'DRAFT' || prod.status === 'NEEDS_REVISION' || prod.status === 'REJECTED') && (
                    <button
                      onClick={() => handleSubmitForReview(prod.id, prod.title)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ajukan Moderasi</span>
                    </button>
                  )}

                  {prod.status !== 'ARCHIVED' && (
                    <button
                      onClick={() => handleArchive(prod.id, prod.title)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Arsipkan Produk"
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
                  {editingProduct ? 'Edit Produk Pasar Ekraf' : 'Tambah Produk Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingProduct ? `ID Produk: ${editingProduct.id}` : 'Daftarkan produk komersial dalam status DRAFT'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* K-03 Invariant Alert for editing published product */}
              {editingProduct?.status === 'PUBLISHED' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Perhatian Kebijakan K-03</span>
                  </div>
                  <p className="text-amber-800">
                    Produk ini saat ini berstatus <strong>PUBLISHED</strong>. Menyimpan perubahan akan
                    mengembalikan status ke <strong>PENDING_REVIEW</strong> untuk dimoderasi ulang.
                  </p>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Sarung Tenun Gedhog Pewarna Alami Sogan Tuban"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Product Type & Linked Work */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Jenis Produk <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formProductTypeId}
                    onChange={(e) => setFormProductTypeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Pilih Jenis Produk</option>
                    {productTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tautkan Karya Induk (Showcase)</label>
                  <select
                    value={formWorkId}
                    onChange={(e) => setFormWorkId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Tidak Ditautkan ke Karya</option>
                    {myWorks.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.title} ({w.motif || w.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Material & Dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Bahan & Komposisi Serat</label>
                  <input
                    type="text"
                    value={formMaterial}
                    onChange={(e) => setFormMaterial(e.target.value)}
                    placeholder="Contoh: 100% Kapas Tenun Gedhog Kerek Halus"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Dimensi / Ukuran Produk</label>
                  <input
                    type="text"
                    value={formDimensions}
                    onChange={(e) => setFormDimensions(e.target.value)}
                    placeholder="Contoh: 210 x 110 cm / Ukuran S, M, L"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Pricing Section (K-06) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">
                    Skema Penentuan Harga (K-06)
                  </label>
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="priceMode"
                        checked={formPriceMode === 'FIXED'}
                        onChange={() => setFormPriceMode('FIXED')}
                      />
                      <span>Harga Tetap</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="priceMode"
                        checked={formPriceMode === 'RANGE'}
                        onChange={() => setFormPriceMode('RANGE')}
                      />
                      <span>Rentang Harga</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="priceMode"
                        checked={formPriceMode === 'CONTACT'}
                        onChange={() => setFormPriceMode('CONTACT')}
                      />
                      <span>Tanya Penjual</span>
                    </label>
                  </div>
                </div>

                {formPriceMode === 'FIXED' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 font-semibold">Nominal Harga (Rp)</label>
                      <input
                        type="number"
                        required
                        value={formPriceMin}
                        onChange={(e) => setFormPriceMin(e.target.value)}
                        placeholder="Contoh: 850000"
                        className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 font-semibold">Satuan</label>
                      <input
                        type="text"
                        value={formPriceUnit}
                        onChange={(e) => setFormPriceUnit(e.target.value)}
                        placeholder="pcs / lembar"
                        className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>
                )}

                {formPriceMode === 'RANGE' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 font-semibold">Harga Minimum (Rp)</label>
                      <input
                        type="number"
                        required
                        value={formPriceMin}
                        onChange={(e) => setFormPriceMin(e.target.value)}
                        placeholder="1200000"
                        className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 font-semibold">Harga Maksimum (Rp)</label>
                      <input
                        type="number"
                        required
                        value={formPriceMax}
                        onChange={(e) => setFormPriceMax(e.target.value)}
                        placeholder="1500000"
                        className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 font-semibold">Satuan</label>
                      <input
                        type="text"
                        value={formPriceUnit}
                        onChange={(e) => setFormPriceUnit(e.target.value)}
                        placeholder="pcs / lembar"
                        className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>
                )}

                {formPriceMode === 'CONTACT' && (
                  <p className="text-xs text-slate-500 italic">
                    Harga tidak ditampilkan secara publik; pembeli akan menghubungi perajin langsung via WhatsApp untuk penawaran harga custom.
                  </p>
                )}
              </div>

              {/* Availability & Lead Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Status Ketersediaan</label>
                  <select
                    value={formAvailability}
                    onChange={(e) => setFormAvailability(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="AVAILABLE">Ready Stock (Tersedia Langsung)</option>
                    <option value="MADE_TO_ORDER">Made to Order (Pre-Order / Dibuat Berdasarkan Pesanan)</option>
                    <option value="UNAVAILABLE">Stok Habis / Belum Tersedia</option>
                  </select>
                </div>

                {formAvailability === 'MADE_TO_ORDER' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Estimasi Pembuatan (Hari)</label>
                    <input
                      type="number"
                      value={formLeadTime}
                      onChange={(e) => setFormLeadTime(e.target.value)}
                      placeholder="Contoh: 14"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* Images Section (Max 5) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Foto Produk (Maksimal 5) <span className="text-rose-500">*</span></span>
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
                    <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 cursor-pointer transition">
                      {uploadingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
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
                  Deskripsi & Keunggulan Produk <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Jelaskan kualitas kain tenun, kenyamanan pemakaian, petunjuk perawatan, dan spesifikasi pesanan..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProduct ? 'Simpan Perubahan' : 'Buat Produk (Draft)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
