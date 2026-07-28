import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../profile/data/models/levels.dart';
import '../../data/models/points_leaderboard_model.dart';
import '../providers/honor_providers.dart';
import '../../../../core/widgets/smooth_overlay.dart';
import 'points_leaderboard_section.dart';

const _gemMilestones = [10, 50, 200, 500];
const _gemColors = [
  Color(0xFFE5E7EB),
  Color(0xFFEF4444),
  Color(0xFFFBBF24),
  Color(0xFF1E1B4B),
];

Future<void> showPointsBalanceSheet(BuildContext context) {
  return showInstantOverlay(
    context: context,
    alignment: Alignment.bottomCenter,
    child: const _PointsBalanceSheet(),
  );
}

class _PointsBalanceSheet extends ConsumerWidget {
  const _PointsBalanceSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final points = int.tryParse(auth.user?['points']?.toString() ?? '') ?? 0;
    final userId = (auth.user?['_id'] ?? auth.user?['id'])?.toString();
    final lbAsync = ref.watch(pointsLeaderboardProvider);
    final level = LevelProgress.fromPoints(points);
    final bottomInset = MediaQuery.of(context).padding.bottom;

    return Material(
      color: Colors.transparent,
      child: Container(
        width: MediaQuery.of(context).size.width,
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.82,
        ),
        padding: EdgeInsets.fromLTRB(20, 12, 20, 20 + bottomInset),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: ListView(
          shrinkWrap: true,
          padding: EdgeInsets.zero,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE5E7EB),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(LucideIcons.x, size: 20),
              ),
            ),
            const Text(
              'عدد النقاط',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                fontFamily: 'Cairo',
                color: Color(0xFF6B7280),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  LucideIcons.star,
                  size: 28,
                  color: Color(0xFFF59E0B),
                  fill: 1,
                ),
                const SizedBox(width: 8),
                Text(
                  points.toString(),
                  style: const TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                    color: Color(0xFF111827),
                  ),
                ),
                const SizedBox(width: 6),
                const Text(
                  'Points',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF9CA3AF),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'المستوى: ${level.stage.label}',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                fontFamily: 'Cairo',
                color: Color(level.stage.color.value),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(_gemMilestones.length, (i) {
                final unlocked = points >= _gemMilestones[i];
                return Column(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: unlocked
                            ? _gemColors[i].withOpacity(0.2)
                            : const Color(0xFFF3F4F6),
                        border: Border.all(
                          color: unlocked
                              ? _gemColors[i]
                              : const Color(0xFFE5E7EB),
                          width: 2,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '💎',
                        style: TextStyle(
                          fontSize: 18,
                          color: unlocked ? null : Colors.grey,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_gemMilestones[i]}',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'Cairo',
                        color: unlocked
                            ? const Color(0xFF111827)
                            : const Color(0xFF9CA3AF),
                      ),
                    ),
                  ],
                );
              }),
            ),
            const SizedBox(height: 22),
            lbAsync.when(
              loading: () => PointsLeaderboardSection(
                top: const [],
                isLoading: true,
                currentUserId: userId,
              ),
              error: (_, __) => PointsLeaderboardSection(
                top: const [],
                isError: true,
                currentUserId: userId,
              ),
              data: (lb) {
                final me = lb.me;
                return PointsLeaderboardSection(
                  top: lb.top,
                  myRank: lb.myRank,
                  currentUserId: userId,
                  currentUser: me ??
                      (auth.user != null
                          ? LeaderboardEntry(
                              id: userId ?? '',
                              name: auth.user?['name']?.toString() ?? 'مستخدم',
                              avatar: auth.user?['avatar']?.toString(),
                              rank: lb.myRank ?? 0,
                              points: points,
                            )
                          : null),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
