import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';

function avatarFor(user, name = 'User') {
  if (user?.avatar) return user.avatar;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

function normalizeEntry(entry, index) {
  const user = entry?.user || entry;
  const name = user?.name || entry?.name || 'مستخدم';
  return {
    id: String(user?._id || user?.id || entry?._id || entry?.id || index),
    name,
    avatar: avatarFor(user, name),
    rank: entry?.rank ?? index + 1,
    points: entry?.points ?? user?.points ?? 0,
  };
}

function normalizeLeaderboard(data) {
  if (!data) return null;

  const topRaw = data.top
    || data.topUsers
    || data.leaderboard
    || data.users
    || data.items
    || [];

  const top = (Array.isArray(topRaw) ? topRaw : []).slice(0, 5).map(normalizeEntry);

  const meRaw = data.me || data.currentUser || data.user;
  const myRank = data.myRank
    ?? data.currentUserRank
    ?? data.rank
    ?? meRaw?.rank
    ?? null;

  const me = meRaw
    ? normalizeEntry({ ...meRaw, rank: myRank, points: meRaw.points ?? data.myPoints })
    : null;

  return { top, myRank: myRank != null ? Number(myRank) : null, me };
}

async function fetchLeaderboard() {
  const paths = ['/users/points-leaderboard', '/users/leaderboard/points'];

  for (const path of paths) {
    try {
      const { data } = await api.get(path);
      const normalized = normalizeLeaderboard(data);
      if (normalized?.top?.length) return normalized;
    } catch {
      /* try next */
    }
  }

  return null;
}

export function usePointsLeaderboard(enabled = false) {
  return useQuery({
    queryKey: queryKeys.pointsLeaderboard,
    queryFn: fetchLeaderboard,
    enabled,
    staleTime: 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
