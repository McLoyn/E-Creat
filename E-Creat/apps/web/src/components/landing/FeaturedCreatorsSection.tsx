import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { apiFetch } from '../../api/client.js';
import { CreatorCard, CreatorCardData } from '../CreatorCard.js';
import { StateMessage } from '../StateMessage.js';

export const FeaturedCreatorsSection: React.FC = () => {
  const [creators, setCreators] = useState<CreatorCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: CreatorCardData[] }>('/creative-profiles?pageSize=3');
      setCreators(res.data || []);
    } catch (err: any) {
      console.error('Error fetching featured creators:', err);
      setError('Gagal memuat profil kreator pilihan. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-surface border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div className="space-y-2">
            <span className="text-xs font-bold text-forest uppercase tracking-wider">
              Talenta Daerah
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-ink">
              Pelaku Kreatif Unggulan
            </h2>
            <p className="text-sm sm:text-base text-ink-soft max-w-xl">
              Kenali perajin wastra, pegiat kriya, seniman visual, dan inovator karya yang berdedikasi di Kabupaten Tuban.
            </p>
          </div>

          <Link
            to="/creative"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-800 transition shrink-0 self-start sm:self-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded-xs"
          >
            <span>Lihat Seluruh Direktori</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* State Handling: Loading, Error, Empty, Success */}
        {loading ? (
          <StateMessage type="loading" message="Memuat pelaku kreatif..." />
        ) : error ? (
          <StateMessage
            type="error"
            title="Direktori Kreator Tidak Dapat Dimuat"
            message={error}
            onRetry={fetchCreators}
          />
        ) : creators.length === 0 ? (
          <StateMessage
            type="empty"
            title="Belum Ada Pelaku Terdaftar"
            message="Saat ini belum ada profil kreator yang diterbitkan di direktori."
            actionText="Daftarkan Profil Anda"
            actionHref="/register"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
