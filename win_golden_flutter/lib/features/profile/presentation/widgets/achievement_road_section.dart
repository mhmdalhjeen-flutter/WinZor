import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../data/models/user_center_models.dart';
import '../providers/user_center_providers.dart';

class AchievementRoadSection extends ConsumerWidget {
  final int points;
  final VoidCallback onUnlock;

  const AchievementRoadSection({
    super.key,
    required this.points,
    required this.onUnlock,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roadAsync = ref.watch(achievementsProvider);

    return roadAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
      ),
      error: (_, __) => const SizedBox.shrink(),
      data: (road) {
        if (road.isEmpty) return const SizedBox.shrink();
        final sorted = [...road]..sort((a, b) => a.pointsRequired.compareTo(b.pointsRequired));
        String? nextId;
        for (final m in sorted) {
          if (points < m.pointsRequired) {
            nextId = m.id;
            break;
          }
        }

        return Container(
          margin: const EdgeInsets.only(top: 4),
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFF3F4F6)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Icon(LucideIcons.trophy, size: 16, color: Color(0xFFD97706)),
                    SizedBox(width: 8),
                    Text(
                      'طريق الإنجازات',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                height: 150,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: sorted.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final m = sorted[index];
                    final unlocked = m.unlocked || points >= m.pointsRequired;
                    final isNext = m.id == nextId;
                    return _MilestoneNode(
                      milestone: m,
                      unlocked: unlocked,
                      isNext: isNext,
                      onMarkSeen: () async {
                        try {
                          await ref
                              .read(userCenterRepositoryProvider)
                              .markAchievementSeen(m.id);
                          ref.invalidate(achievementsProvider);
                          onUnlock();
                        } catch (_) {}
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _MilestoneNode extends StatelessWidget {
  final AchievementMilestone milestone;
  final bool unlocked;
  final bool isNext;
  final VoidCallback onMarkSeen;

  const _MilestoneNode({
    required this.milestone,
    required this.unlocked,
    required this.isNext,
    required this.onMarkSeen,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 88,
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(
                    width: 2,
                    color: unlocked ? const Color(0xFFFCD34D) : const Color(0xFFE2E8F0),
                  ),
                  gradient: unlocked
                      ? const LinearGradient(
                          colors: [Color(0xFFFFFBEB), Color(0xFFFFEDD5), Color(0xFFFEF9C3)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : null,
                  color: unlocked ? null : const Color(0xFFF1F5F9),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (milestone.image != null &&
                        milestone.image!.isNotEmpty &&
                        milestone.image!.startsWith('http'))
                      CachedNetworkImage(
                        imageUrl: milestone.image!,
                        width: 44,
                        height: 44,
                        fit: BoxFit.contain,
                      )
                    else
                      Text(
                        milestone.icon?.isNotEmpty == true ? milestone.icon! : '🏆',
                        style: const TextStyle(fontSize: 28),
                      ),
                    if (!unlocked)
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.25),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Center(
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(LucideIcons.lock, size: 14, color: Color(0xFF64748B)),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              if (isNext && !unlocked)
                Positioned(
                  top: -2,
                  left: -2,
                  child: Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: const Color(0xFF8B5CF6),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFDDD6FE), width: 3),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            milestone.name,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              fontFamily: 'Cairo',
              color: unlocked ? const Color(0xFF1E293B) : const Color(0xFF94A3B8),
            ),
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              gradient: unlocked
                  ? const LinearGradient(colors: [Color(0xFFFBBF24), Color(0xFFFB923C)])
                  : null,
              color: unlocked ? null : const Color(0xFFE2E8F0),
            ),
            child: Text(
              '${milestone.pointsRequired}',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w900,
                fontFamily: 'Cairo',
                color: unlocked ? Colors.white : const Color(0xFF64748B),
              ),
            ),
          ),
          if (unlocked && !milestone.animationSeen)
            GestureDetector(
              onTap: onMarkSeen,
              child: const Padding(
                padding: EdgeInsets.only(top: 4),
                child: Text(
                  'رائع!',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFFD97706),
                    decoration: TextDecoration.underline,
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
