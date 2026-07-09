import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { unwrapList } from '../../utils/unwrapList';
import CompetitionCardItem from '../CompetitionCardItem';

export default function FeaturedCompetitions() {
  const [competitions, setCompetitions] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
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

        const points = featuredRes.data?.userPoints || 0;
        const primary = featuredRes.data?.competition;
        const list = unwrapList(listRes.data, ['competitions']);
        const featuredFromList = list.filter((c) => c?.isFeatured);

        const seen = new Set();
        const merged = [];

        if (primary?._id) {
          merged.push(primary);
          seen.add(String(primary._id));
        }

        for (const comp of featuredFromList) {
          if (merged.length >= 2) break;
          if (!seen.has(String(comp._id))) {
            merged.push(comp);
            seen.add(String(comp._id));
          }
        }

        setCompetitions(merged.slice(0, 2));
        setUserPoints(points);
      } catch {
        if (!cancelled) {
          setCompetitions([]);
          setUserPoints(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-32 rounded-[24px] bg-white border border-gray-100 shadow-sm animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!competitions.length) return null;

  return (
    <section className="max-w-6xl mx-auto px-4">
      <div className={`grid gap-3 items-stretch ${competitions.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'}`}>
        {competitions.map((comp) => (
          <CompetitionCardItem
            key={comp._id}
            competition={comp}
            userPoints={userPoints}
            embedded
          />
        ))}
      </div>
    </section>
  );
}
