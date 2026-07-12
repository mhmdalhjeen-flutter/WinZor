import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CompetitionCardItem from './CompetitionCardItem';

const CompetitionCard = () => {
  const { user, updateUser } = useAuth();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFeatured = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/competitions/featured');
      const featured = data.competitions?.[0] || data.competition || null;
      setCompetition(featured);
    } catch {
      setCompetition(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeatured(); }, []);

  if (loading) {
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
        if (updated) setCompetition(updated);
        if (pts != null) updateUser({ points: pts });
      }}
    />
  );
};

export default CompetitionCard;
