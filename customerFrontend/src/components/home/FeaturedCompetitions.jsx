import React, { useMemo } from 'react';
import CompetitionCardItem from '../CompetitionCardItem';
import { useAuth } from '../../context/AuthContext';
import { useCompetitionsList } from '../../hooks/useCompetitionsList';
import { useFeaturedCompetitions } from '../../hooks/useFeaturedCompetitions';

function mergeFeaturedCompetitions(fromFeatured, list) {
  const featuredFromList = list.filter((c) => c?.isFeatured);
  const seen = new Set();
  const merged = [];

  for (const comp of fromFeatured) {
    if (!comp?._id || merged.length >= 2) break;
    merged.push(comp);
    seen.add(String(comp._id));
  }

  for (const comp of featuredFromList) {
    if (merged.length >= 2) break;
    if (!seen.has(String(comp._id))) {
      merged.push(comp);
      seen.add(String(comp._id));
    }
  }

  return merged.slice(0, 2);
}

export default function FeaturedCompetitions() {
  const { user, updateUser } = useAuth();
  const { data: fromFeatured = [], isLoading: featuredLoading } = useFeaturedCompetitions();
  const { data: list = [], isLoading: listLoading } = useCompetitionsList();

  const competitions = useMemo(
    () => mergeFeaturedCompetitions(fromFeatured, list),
    [fromFeatured, list],
  );

  const loading = (featuredLoading || listLoading) && !competitions.length;

  const handleCompetitionUpdate = (updatedComp, userPoints) => {
    if (userPoints != null) updateUser({ points: userPoints });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-1.5 sm:px-2 grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        <div className="h-36 sm:h-40 rounded-[20px] sm:rounded-[24px] bg-white border border-gray-100 shadow-sm animate-pulse" />
        <div className="h-36 sm:h-40 rounded-[20px] sm:rounded-[24px] bg-white border border-gray-100 shadow-sm animate-pulse hidden md:block" />
      </div>
    );
  }

  if (!competitions.length) return null;

  const userPoints = user?.points ?? 0;

  return (
    <section className="max-w-6xl mx-auto px-1.5 sm:px-2">
      <div className={`grid gap-2.5 sm:gap-3 items-stretch ${competitions.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'}`}>
        {competitions.map((comp) => (
          <CompetitionCardItem
            key={comp._id}
            competition={comp}
            userPoints={userPoints}
            embedded
            onUpdate={handleCompetitionUpdate}
          />
        ))}
      </div>
    </section>
  );
}
