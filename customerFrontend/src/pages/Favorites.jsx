import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import OfferCard from '../components/OfferCard';
import { getFavorites, toggleFavorite } from '../utils/activity';
import { queryKeys } from '../lib/queryClient';
import LightLoadingHint from '../shared/LightLoadingHint';
import ErrorState from '../shared/ErrorState';

const Favorites = () => {
  const qc = useQueryClient();
  const [favoriteIds, setFavoriteIds] = useState(null);

  const {
    data,
    isLoading,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: async () => {
      const { data: response } = await getFavorites();
      return {
        favorites: response?.favorites || [],
        favoriteIds: (response?.favoriteIds || []).map(String),
      };
    },
    staleTime: 60 * 1000,
  });

  const offers = data?.favorites ?? [];
  const ids = favoriteIds ?? new Set(data?.favoriteIds ?? []);
  const error = queryError?.response?.data?.message || (queryError ? 'تعذّر تحميل المفضّلة' : '');

  const handleToggleFavorite = async (offer) => {
    const id = String(offer._id);
    setFavoriteIds((prev) => {
      const base = prev ?? new Set(data?.favoriteIds ?? []);
      const next = new Set(base);
      next.delete(id);
      return next;
    });
    qc.setQueryData(queryKeys.favorites, (prev) => {
      if (!prev) return prev;
      return {
        favorites: (prev.favorites || []).filter((o) => String(o._id) !== id),
        favoriteIds: (prev.favoriteIds || []).filter((fid) => String(fid) !== id),
      };
    });
    try {
      await toggleFavorite(offer._id);
    } catch {
      setFavoriteIds(null);
      refetch();
    }
  };

  return (
    <div className="space-y-5 pb-24 text-right" dir="rtl">
      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
        <Heart className="text-red-500" size={24} fill="currentColor" /> المفضّلة
      </h1>

      {isLoading && offers.length === 0 && (
        <LightLoadingHint label="جاري تحميل المفضّلة..." />
      )}

      {isError && !isLoading && (
        <ErrorState message={error} onRetry={refetch} />
      )}

      {!isLoading && !isError && offers.length === 0 && (
        <div className="text-center py-16 text-gray-400 font-bold">
          لا توجد عروض في المفضّلة بعد
        </div>
      )}

      {!isError && offers.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {offers.map((offer) => (
            <OfferCard
              key={offer._id}
              offer={offer}
              favorited={ids.has(String(offer._id))}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
