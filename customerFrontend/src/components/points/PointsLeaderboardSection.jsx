import React from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const RANK_BADGES = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

function avatarUrl(user, name) {
  if (user?.avatar) return user.avatar;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'User')}`;
}

function LeaderboardRow({ entry, highlight = false, badge }) {
  const name = entry?.name || 'مستخدم';
  const rank = entry?.rank ?? '—';
  const pts = entry?.points ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`points-lb-row ${highlight ? 'points-lb-row--me' : ''}`}
    >
      <span className="points-lb-row__badge">{badge}</span>
      <img
        src={avatarUrl(entry, name)}
        alt=""
        loading="lazy"
        className="points-lb-row__avatar"
      />
      <div className="points-lb-row__meta">
        <span className="points-lb-row__name">{name}</span>
        <span className="points-lb-row__rank">المركز #{rank}</span>
      </div>
      <span className="points-lb-row__dots" aria-hidden />
      <span className="points-lb-row__points tabular-nums">{pts.toLocaleString('en-US')}</span>
    </motion.div>
  );
}

export default function PointsLeaderboardSection({
  top = [],
  myRank = null,
  currentUser = null,
  isLoading = false,
  currentUserId = null,
}) {
  const meInTop = top.some((e) => String(e.id) === String(currentUserId));
  const showMeRow = !meInTop && myRank != null && currentUser;

  return (
    <section className="points-lb-section">
      <h3 className="points-lb-section__title">
        <Trophy size={18} className="text-amber-500" />
        أفضل المتصدرين
      </h3>

      {isLoading && (
        <div className="points-lb-section__loading">
          <Loader2 size={22} className="animate-spin text-violet-500" />
        </div>
      )}

      {!isLoading && top.length === 0 && (
        <p className="points-lb-section__empty">لا تتوفر بيانات المتصدرين حالياً</p>
      )}

      {!isLoading && top.length > 0 && (
        <div className="points-lb-section__list">
          {top.map((entry, i) => (
            <LeaderboardRow
              key={entry.id || i}
              entry={entry}
              badge={RANK_BADGES[i] || `${i + 1}`}
              highlight={String(entry.id) === String(currentUserId)}
            />
          ))}

          {showMeRow && (
            <>
              <div className="points-lb-section__divider" />
              <p className="points-lb-section__me-label">أنت في المركز #{myRank}</p>
              <LeaderboardRow
                entry={{
                  ...currentUser,
                  rank: myRank,
                  points: currentUser.points ?? 0,
                }}
                highlight
                badge="⭐"
              />
            </>
          )}
        </div>
      )}
    </section>
  );
}
