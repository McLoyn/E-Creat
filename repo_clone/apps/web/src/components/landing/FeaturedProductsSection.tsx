import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { apiFetch } from '../../api/client.js';
import { ProductCard, ProductCardData } from '../ProductCard.js';
import { StateMessage } from '../StateMessage.js';

export const FeaturedProductsSection: React.FC = () => {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: ProductCardData[] }>('/products?pageSize=4');
      setProducts(res.data || []);
    } catch (err: any) {
      console.error('Error fetching featured products:', err);
      setError('Gagal memuat produk pilihan. Pastikan koneksi server tersedia.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-canvas border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div className="space-y-2">
            <span className="text-xs font-bold text-terracotta-600 uppercase tracking-wider">
              Etalase Karya
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-ink">
              Produk Pilihan Komunitas
            </h2>
            <p className="text-sm sm:text-base text-ink-soft max-w-xl">
              Koleksi wastra tenun gedog, busana siap pakai, dan kerajinan khas ciptaan pelaku kreatif Tuban.
            </p>
          </div>

          <Link
            to="/pasar"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta-600 hover:text-terracotta transition shrink-0 self-start sm:self-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded-xs"
          >
            <span>Lihat Semua di Pasar Ekraf</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* State Handling: Loading, Error, Empty, Success */}
        {loading ? (
          <StateMessage type="loading" message="Memuat produk pilihan..." />
        ) : error ? (
          <StateMessage
            type="error"
            title="Katalog Produk Tidak Dapat Dimuat"
            message={error}
            onRetry={fetchProducts}
          />
        ) : products.length === 0 ? (
          <StateMessage
            type="empty"
            title="Belum Ada Produk Terbit"
            message="Saat ini belum ada produk yang diterbitkan di Pasar Ekraf."
            actionText="Jelajahi Direktori Pelaku"
            actionHref="/creative"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
