import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import CompetitionCardItem from './CompetitionCardItem';

const CompetitionCard = () => {
  const [competition, setCompetition] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFeatured = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/competitions/featured');
      setCompetition(data.competition || null);
      setUserPoints(data.userPoints || 0);
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
      userPoints={userPoints}
    />
  );
};

export default CompetitionCard;
