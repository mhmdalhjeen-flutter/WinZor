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
  const rank = entry?.rank ?? entry?.position ?? index + 1;
  return {
    id: String(user?._id || user?.id || entry?._id || entry?.id || index),
    name,
    avatar: avatarFor(user, name),
    rank: Number(rank),
    points: entry?.points ?? user?.points ?? 0,
  };
}

function extractTopList(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  return data.top
    || data.topUsers
    || data.leaderboard
    || data.users
    || data.items
    || [];
}

function resolveMyRank(data, top, currentUserId) {
  const fromApi = data?.myRank ?? data?.currentUserRank ?? data?.me?.rank;
  if (fromApi != null && !Number.isNaN(Number(fromApi))) {
    return Number(fromApi);
  }

  if (currentUserId) {
    const inTop = top.find((e) => String(e.id) === String(currentUserId));
    if (inTop?.rank != null) return Number(inTop.rank);
  }

  return null;
}

export function normalizeLeaderboard(data, currentUserId = null) {
  const topRaw = extractTopList(data);
  const top = topRaw.slice(0, 5).map((entry, index) => normalizeEntry(entry, index));

  const meRaw = data?.me || data?.currentUser || data?.user;
  const myRank = resolveMyRank(data, top, currentUserId);

  const me = meRaw
    ? normalizeEntry({
      ...meRaw,
      user: meRaw.user || meRaw,
      rank: myRank,
      points: meRaw.points ?? data?.myPoints ?? meRaw.user?.points,
    })
    : null;

  return { top, myRank, me };
}

async function fetchLeaderboard(currentUserId) {
  const { data } = await api.get('/users/points-leaderboard');
  return normalizeLeaderboard(data, currentUserId);
}

export function usePointsLeaderboard(enabled = false, currentUserId = null) {
  return useQuery({
    queryKey: [...queryKeys.pointsLeaderboard, currentUserId],
    queryFn: () => fetchLeaderboard(currentUserId),
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
