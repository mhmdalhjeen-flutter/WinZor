import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { unwrapList } from '../../utils/unwrapList';
import CompetitionCardItem from '../CompetitionCardItem';
import { useAuth } from '../../context/AuthContext';

export default function FeaturedCompetitions() {
  const { user, updateUser } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [featuredRes, listRes] = await Promise.all([
          api.get('/competitions/featured'),
          api.get('/competitions'),
        ]);

        if (cancelled) return;

        const fromFeatured = featuredRes.data?.competitions
          || (featuredRes.data?.competition ? [featuredRes.data.competition] : []);
        const list = unwrapList(listRes.data, ['competitions']);
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

        setCompetitions(merged.slice(0, 2));
      } catch {
        if (!cancelled) {
          setCompetitions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCompetitionUpdate = (updatedComp, userPoints) => {
    if (updatedComp?._id) {
      setCompetitions((prev) => prev.map((c) => (
        String(c._id) === String(updatedComp._id) ? updatedComp : c
      )));
    }
    if (userPoints != null) updateUser({ points: userPoints });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4 grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        <div className="h-28 sm:h-32 rounded-[20px] sm:rounded-[24px] bg-white border border-gray-100 shadow-sm animate-pulse" />
        <div className="h-28 sm:h-32 rounded-[20px] sm:rounded-[24px] bg-white border border-gray-100 shadow-sm animate-pulse hidden md:block" />
      </div>
    );
  }

  if (!competitions.length) return null;

  const userPoints = user?.points ?? 0;

  return (
    <section className="max-w-6xl mx-auto px-3 sm:px-4">
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
