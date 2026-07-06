import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import api from '../api/axios';

/**
 * تقييم 5 نجوم — مرة واحدة لكل مستخدم مع إمكانية التعديل.
 */
const StarRating = ({
  targetType,
  targetId,
  ratingAvg = 0,
  ratingCount = 0,
  compact = false,
  className = '',
}) => {
  const [myStars, setMyStars] = useState(null);
  const [avg, setAvg] = useState(ratingAvg);
  const [count, setCount] = useState(ratingCount);
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAvg(ratingAvg);
    setCount(ratingCount);
  }, [ratingAvg, ratingCount]);

  useEffect(() => {
    if (!targetId) return;
    api.get('/ratings/mine', { params: { targetType, targetId } })
      .then(({ data }) => {
        setMyStars(data.myStars);
        if (data.ratingAvg != null) setAvg(data.ratingAvg);
        if (data.ratingCount != null) setCount(data.ratingCount);
      })
      .catch(() => {});
  }, [targetType, targetId]);

  const submit = async (stars) => {
    if (saving) return;
    setSaving(true);
    try {
      const { data } = await api.post('/ratings', { targetType, targetId, stars });
      setMyStars(stars);
      setAvg(data.ratingAvg);
      setCount(data.ratingCount);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const display = hover || myStars || 0;

  return (
    <div className={`flex flex-col gap-1 ${className}`} dir="rtl">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={saving}
              onMouseEnter={() => setHover(n)}
              onClick={() => submit(n)}
              className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
              aria-label={`${n} نجوم`}
            >
              <Star
                size={compact ? 16 : 22}
                className={n <= display ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
              />
            </button>
          ))}
        </div>
        {!compact && (
          <span className="text-xs font-bold text-gray-500">
            {avg > 0 ? avg.toFixed(1) : '—'} ({count})
          </span>
        )}
      </div>
      {!compact && myStars && (
        <p className="text-[10px] text-gray-400 font-bold">تقييمك: {myStars} — اضغط لتغييره</p>
      )}
    </div>
  );
};

export default StarRating;
