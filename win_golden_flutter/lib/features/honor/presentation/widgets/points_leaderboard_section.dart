import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../../core/utils/media_url.dart';
import '../../data/models/points_leaderboard_model.dart';

const _rankBadges = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

String _avatarFallback(String name) {
  final seed = Uri.encodeComponent(name.isEmpty ? 'User' : name);
  return 'https://api.dicebear.com/7.x/avataaars/svg?seed=$seed';
}

String _resolveAvatar(String? avatar, String name) {
  final resolved = resolveImageUrl(avatar);
  if (resolved != null && resolved.isNotEmpty) return resolved;
  return _avatarFallback(name);
}

/// React `PointsLeaderboardSection.jsx`
class PointsLeaderboardSection extends StatelessWidget {
  final List<LeaderboardEntry> top;
  final int? myRank;
  final LeaderboardEntry? currentUser;
  final String? currentUserId;
  final bool isLoading;
  final bool isError;

  const PointsLeaderboardSection({
    super.key,
    required this.top,
    this.myRank,
    this.currentUser,
    this.currentUserId,
    this.isLoading = false,
    this.isError = false,
  });

  @override
  Widget build(BuildContext context) {
    final meInTop = currentUserId != null &&
        top.any((e) => e.id == currentUserId);
    final showMeRow = !meInTop && myRank != null && currentUser != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.emoji_events, size: 18, color: Color(0xFFF59E0B)),
            SizedBox(width: 8),
            Text(
              'أفضل المتصدرين',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w900,
                fontFamily: 'Cairo',
                color: Color(0xFF1F2937),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (isLoading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          )
        else if (isError || top.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Text(
              'لا تتوفر بيانات المتصدرين حالياً',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontWeight: FontWeight.w700,
                color: Color(0xFF9CA3AF),
                fontSize: 12,
              ),
            ),
          )
        else ...[
          ...List.generate(top.length, (i) {
            final entry = top[i];
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _LeaderboardRow(
                entry: entry,
                badge: i < _rankBadges.length ? _rankBadges[i] : '${i + 1}',
                highlight: currentUserId != null && entry.id == currentUserId,
              ),
            );
          }),
          if (showMeRow) ...[
            const Divider(height: 24),
            Text(
              'أنت في المركز #$myRank',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                fontFamily: 'Cairo',
                color: Color(0xFF6B7280),
              ),
            ),
            const SizedBox(height: 8),
            _LeaderboardRow(
              entry: LeaderboardEntry(
                id: currentUser!.id,
                name: currentUser!.name,
                avatar: currentUser!.avatar,
                rank: myRank!,
                points: currentUser!.points,
              ),
              badge: '⭐',
              highlight: true,
            ),
          ],
        ],
      ],
    );
  }
}

class _LeaderboardRow extends StatelessWidget {
  final LeaderboardEntry entry;
  final String badge;
  final bool highlight;

  const _LeaderboardRow({
    required this.entry,
    required this.badge,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    final avatar = _resolveAvatar(entry.avatar, entry.name);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: highlight ? const Color(0xFFF5F3FF) : const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: highlight ? const Color(0xFFDDD6FE) : const Color(0xFFF3F4F6),
        ),
      ),
      child: Row(
        children: [
          Text(badge, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: CachedNetworkImage(
              imageUrl: avatar,
              width: 36,
              height: 36,
              fit: BoxFit.cover,
              errorWidget: (_, __, ___) => Container(
                width: 36,
                height: 36,
                color: const Color(0xFFE5E7EB),
                alignment: Alignment.center,
                child: Text(entry.name.isNotEmpty ? entry.name[0] : '?'),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                    color: Color(0xFF111827),
                  ),
                ),
                Text(
                  'المركز #${entry.rank}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Cairo',
                    color: Color(0xFF9CA3AF),
                  ),
                ),
              ],
            ),
          ),
          Text(
            entry.points.toString(),
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              fontFamily: 'Cairo',
              color: highlight ? const Color(0xFF7C3AED) : const Color(0xFF1F2937),
            ),
          ),
        ],
      ),
    );
  }
}
