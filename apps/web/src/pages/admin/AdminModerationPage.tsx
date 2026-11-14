import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Badge } from '../../components/Badge.js';
import {
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  MessageSquare,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Filter,
} from 'lucide-react';

interface QueueItem {
  id: string;
  itemType: 'work' | 'product';
  title: string;
  slug: string;
  description: string;
  status: string;
  reviewNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  updatedAt: string;
  categoryName: string;
  coverImage: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  priceUnit?: string | null;
  availability?: string;
  creator: {
    id: string;
    name: string;
    slug: string;
    city: string;
    district: string | null;
  };
}

export const AdminModerationPage: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'works' | 'products'>('all');
  const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');
  const [meta, setMeta] = useState<{ total: number; worksCount: number; productsCount: number }>({
    total: 0,
    worksCount: 0,
    productsCount: 0,
  });

  // Modal Note State (For revision or rejection)
  const [noteModalItem, setNoteModalItem] = useState<{ item: QueueItem; action: 'REVISION' | 'REJECT' } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      params.append('status', statusFilter);

      const res = await apiFetch<{
        data: QueueItem[];
        meta: { total: number; worksCount: number; productsCount: number };
      }>(`/admin/moderation?${params.toString()}`);

      setQueue(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err.message || 'Gagal memuat antrean moderasi.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [typeFilter, statusFilter]);

  const handleApprove = async (item: QueueItem) => {
    if (!confirm(`Setujui dan publikasikan ${item.itemType === 'work' ? 'karya' : 'produk'} "${item.title}"?`)) return;

    setSubmittingAction(true);
    setBannerMessage(null);
    try {
      const endpoint = item.itemType === 'work' ? `/admin/works/${item.id}/approve` : `/admin/products/${item.id}/approve`;
      await apiFetch(endpoint, { method: 'POST' });
      setBannerMessage({ type: 'success', text: `Berhasil menyetujui "${item.title}". Status telah menjadi PUBLISHED.` });
      await loadQueue();
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err.message || 'Gagal menyetujui item.' });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUnpublish = async (item: QueueItem) => {
    if (!confirm(`Tarik publikasi "${item.title}" kembali ke status DRAFT?`)) return;

    setSubmittingAction(true);
    setBannerMessage(null);
    try {
      const endpoint = item.itemType === 'work' ? `/admin/works/${item.id}/unpublish` : `/admin/products/${item.id}/unpublish`;
      await apiFetch(endpoint, { method: 'POST' });
      setBannerMessage({ type: 'success', text: `Publikasi "${item.title}" ditarik kembali ke DRAFT.` });
      await loadQueue();
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err.message || 'Gagal menarik publikasi.' });
    } finally {
      setSubmittingAction(false);
    }
  };

  const openNoteModal = (item: QueueItem, action: 'REVISION' | 'REJECT') => {
    setNoteModalItem({ item, action });
    setNoteText('');
  };

  const handleConfirmNoteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteModalItem || !noteText.trim()) {
      alert('Catatan evaluasi wajib diisi.');
      return;
    }

    setSubmittingAction(true);
    setBannerMessage(null);

    const { item, action } = noteModalItem;
    const base = item.itemType === 'work' ? '/admin/works' : '/admin/products';
    const endpoint = action === 'REVISION' ? `${base}/${item.id}/request-revision` : `${base}/${item.id}/reject`;

    try {
      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ reviewNote: noteText.trim() }),
      });
      setBannerMessage({
        type: 'success',
        text: action === 'REVISION'
          ? `Permintaan revisi untuk "${item.title}" berhasil dikirimkan kepada kreator.`
          : `Item "${item.title}" ditolak dengan catatan evaluasi.`,
      });
      setNoteModalItem(null);
      await loadQueue();
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err.message || 'Gagal memproses aksi moderasi.' });
    } finally {
      setSubmittingAction(false);
    }
  };

  const formatPrice = (p: QueueItem) => {
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

  return (
    <div className="space-y-6">
      {/* Page Title & Queue Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-purple-700" />
            <span>Moderasi Karya & Produk</span>
          </h2>
          <p className="text-xs text-slate-500">
            Verifikasi kelayakan konten wastra tenun, narasi karya, dan etalase produk sebelum ditayangkan secara publik.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 font-bold border border-purple-200">
            {meta.worksCount} Karya
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
            {meta.productsCount} Produk
          </span>
        </div>
      </div>

      {/* Banner Notification */}
      {bannerMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{bannerMessage.text}</span>
          <button onClick={() => setBannerMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200">
        {/* Type Filter */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              typeFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua Tipe
          </button>
          <button
            onClick={() => setTypeFilter('works')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              typeFilter === 'works' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Karya Showcase</span>
          </button>
          <button
            onClick={() => setTypeFilter('products')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              typeFilter === 'products' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Produk Pasar</span>
          </button>
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            <option value="PENDING_REVIEW">Menunggu Review (PENDING)</option>
            <option value="NEEDS_REVISION">Membutuhkan Revisi</option>
            <option value="PUBLISHED">Sudah Dipublikasikan</option>
            <option value="REJECTED">Ditolak (REJECTED)</option>
            <option value="ALL">Semua Status</option>
          </select>
        </div>
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : queue.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white border border-slate-200 p-8 space-y-3">
          <CheckCircle className="w-12 h-12 mx-auto text-emerald-500" />
          <h3 className="text-base font-bold text-slate-800">Antrean Moderasi Bersih</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tidak ada karya atau produk yang membutuhkan tindakan pada filter status ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <div
              key={`${item.itemType}-${item.id}`}
              className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:border-purple-200 transition"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  {item.coverImage ? (
                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      {item.itemType === 'work' ? <Sparkles className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.itemType === 'work'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      {item.itemType === 'work' ? 'Showcase' : 'Pasar'}
                    </span>

                    <Badge
                      variant={
                        item.status === 'PUBLISHED'
                          ? 'published'
                          : item.status === 'PENDING_REVIEW'
                          ? 'pending'
                          : item.status === 'NEEDS_REVISION'
                          ? 'revision'
                          : item.status === 'REJECTED'
                          ? 'rejected'
                          : 'draft'
                      }
                    >
                      {item.status}
                    </Badge>

                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {item.categoryName}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 truncate">
                    {item.title}
                  </h3>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      Kreator: <strong className="text-slate-800">{item.creator.name}</strong> ({item.creator.district || item.creator.city})
                    </span>
                    {item.itemType === 'product' && (
                      <span className="font-extrabold text-emerald-700">
                        {formatPrice(item)}
                      </span>
                    )}
                    {item.submittedAt && (
                      <span className="text-[11px] text-slate-400">
                        Diajukan: {new Date(item.submittedAt).toLocaleDateString('id-ID')}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
                    {item.description}
                  </p>

                  {item.reviewNote && (
                    <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-900 mt-2 space-y-0.5">
                      <strong className="block font-bold">Catatan Peninjau Terakhir:</strong>
                      <p>{item.reviewNote}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                {/* Approve Button */}
                {item.status !== 'PUBLISHED' && (
                  <button
                    disabled={submittingAction}
                    onClick={() => handleApprove(item)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>Setujui</span>
                  </button>
                )}

                {/* Request Revision Button */}
                {item.status !== 'NEEDS_REVISION' && (
                  <button
                    disabled={submittingAction}
                    onClick={() => openNoteModal(item, 'REVISION')}
                    className="px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Minta Revisi</span>
                  </button>
                )}

                {/* Reject Button */}
                {item.status !== 'REJECTED' && (
                  <button
                    disabled={submittingAction}
                    onClick={() => openNoteModal(item, 'REJECT')}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Tolak</span>
                  </button>
                )}

                {/* Unpublish Button if currently published */}
                {item.status === 'PUBLISHED' && (
                  <button
                    disabled={submittingAction}
                    onClick={() => handleUnpublish(item)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                    title="Tarik kembali ke status DRAFT"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Tarik Publikasi</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mandatory Note Modal for Revision / Rejection */}
      {noteModalItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  {noteModalItem.action === 'REVISION' ? (
                    <>
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span>Kirim Permintaan Revisi</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-600" />
                      <span>Tolak Item</span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  Target: <strong>{noteModalItem.item.title}</strong>
                </p>
              </div>
              <button onClick={() => setNoteModalItem(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmNoteAction} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Catatan Evaluasi Kurator <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={
                    noteModalItem.action === 'REVISION'
                      ? 'Tuliskan secara jelas poin perbaikan yang dibutuhkan (contoh: mohon tambahkan foto detail tenunan, lengkapi narasi motif...)'
                      : 'Tuliskan alasan penolakan secara santun dan konstruktif...'
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNoteModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition flex items-center gap-2 ${
                    noteModalItem.action === 'REVISION'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{noteModalItem.action === 'REVISION' ? 'Kirim Permintaan Revisi' : 'Konfirmasi Penolakan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
