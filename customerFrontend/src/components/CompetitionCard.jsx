import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useFeaturedCompetitions } from '../hooks/useFeaturedCompetitions';
import CompetitionCardItem from './CompetitionCardItem';

const CompetitionCard = () => {
  const { user, updateUser } = useAuth();
  const { data: featured = [], isLoading: loading } = useFeaturedCompetitions();
  const competition = featured[0] || null;

  if (loading && !competition) {
    return (
      <div className="max-w-4xl mx-auto h-40 rounded-[32px] bg-white/5 border border-white/10 animate-pulse" />
    );
  }

  if (!competition) return null;

  return (
    <CompetitionCardItem
      competition={competition}
      userPoints={user?.points ?? 0}
      onUpdate={(updated, pts) => {
        if (pts != null) updateUser({ points: pts });
      }}
    />
  );
};

export default CompetitionCard;
