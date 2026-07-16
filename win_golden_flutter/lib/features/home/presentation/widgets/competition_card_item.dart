import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_image.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../competitions/data/models/competition_model.dart';
import '../../../competitions/presentation/widgets/competition_join_sheet.dart';

class CompetitionCardItem extends ConsumerWidget {
  final CompetitionModel competition;
  final bool embedded;
  final VoidCallback? onUpdated;

  const CompetitionCardItem({
    super.key,
    required this.competition,
    this.embedded = false,
    this.onUpdated,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userPoints =
        (ref.watch(authProvider).user?['points'] as num?)?.toInt() ?? 0;
    final hasEnded = competition.ended;
    final progress = competition.progress;
    final eligible = userPoints >= competition.minPoints;
    final missingPoints = (competition.minPoints - userPoints).clamp(0, 1 << 30);

    if (hasEnded) {
      return _EndedCard(competition: competition);
    }

    final remaining = competition.endDate?.difference(DateTime.now());

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E1638), Color(0xFF2A1545), Color(0xFF7F1D1D)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.15)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E1638).withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      color: Colors.white.withOpacity(0.25), width: 2),
                  color: Colors.white.withOpacity(0.05),
                ),
                clipBehavior: Clip.antiAlias,
                child: competition.image != null
                    ? AppImage(src: competition.image, fit: BoxFit.cover)
                    : const Icon(Icons.emoji_events,
                        color: Colors.amber, size: 32),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      competition.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Cairo',
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 8,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: FractionallySizedBox(
                              alignment: Alignment.centerRight,
                              widthFactor: progress,
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Colors.amber, AppColors.primary],
                                  ),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${(progress * 100).toInt()}%',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 12,
                      children: [
                        _stat(
                          LucideIcons.users,
                          '${competition.participantsCount}${competition.requiredParticipants > 0 ? " / ${competition.requiredParticipants}" : ""}',
                          AppColors.sky, // تم التصحيح هنا من Colors.sky
                        ),
                        _stat(
                          LucideIcons.coins,
                          '${competition.minPoints}+ نقطة',
                          Colors.amber,
                        ),
                      ],
                    ),
                    if (competition.joined) ...[
                      const SizedBox(height: 8),
                      Text(
                        'مشاركاتك: ${competition.myEntries}',
                        style: const TextStyle(
                          color: Color(0xFF6EE7B7),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (remaining != null && !remaining.isNegative)
                _Countdown(remaining: remaining),
            ],
          ),
          const SizedBox(height: 14),
          if (eligible)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  await showCompetitionJoinSheet(
                    context: context,
                    ref: ref,
                    competition: competition,
                  );
                  onUpdated?.call();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 4,
                  shadowColor: AppColors.primary.withOpacity(0.25),
                ),
                child: Text(
                  competition.joined ? 'زيادة المشاركات' : 'أريد المشاركة',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.amber.withOpacity(0.25)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.alertTriangle,
                      color: Colors.amber, size: 14),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'تحتاج $missingPoints نقطة إضافية',
                      style: const TextStyle(
                        color: Color(0xFFFDE68A),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _stat(IconData icon, String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 12),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 11,
            fontWeight: FontWeight.bold,
            fontFamily: 'Cairo',
          ),
        ),
      ],
    );
  }
}

class _Countdown extends StatelessWidget {
  final Duration remaining;

  const _Countdown({required this.remaining});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.15)),
      ),
      child: Column(
        children: [
          Text(
            '${remaining.inDays}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w900,
            ),
          ),
          const Text(
            'يوم',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.clock, color: Colors.amber, size: 11),
              const SizedBox(width: 2),
              Text(
                '${remaining.inHours % 24}س',
                style: const TextStyle(
                  color: Colors.amber,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EndedCard extends StatelessWidget {
  final CompetitionModel competition;

  const _EndedCard({required this.competition});

  @override
  Widget build(BuildContext context) {
    final prizeImage = competition.prizeImage ?? competition.image;
    final prizeName = competition.prizeName ?? competition.title;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.yellow.shade500.withOpacity(0.2),
            Colors.amber.shade600.withOpacity(0.25),
            Colors.purple.shade900.withOpacity(0.5),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: Colors.yellow.shade400.withOpacity(0.7),
          width: 2,
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.yellow.shade300.withOpacity(0.8),
                width: 2,
              ),
            ),
            clipBehavior: Clip.antiAlias,
            child: prizeImage != null
                ? AppImage(src: prizeImage, fit: BoxFit.cover)
                : const Icon(Icons.emoji_events, color: Colors.amber, size: 36),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.yellow.shade400.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.yellow.shade400.withOpacity(0.3)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.auto_awesome, color: Colors.yellow, size: 12),
                SizedBox(width: 4),
                Text(
                  'تم إعلان الفائز',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            prizeName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
              fontFamily: 'Cairo',
            ),
            textAlign: TextAlign.center,
          ),
          if (competition.drawLink != null &&
              competition.drawLink!.isNotEmpty) ...[
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () => launchUrl(
                Uri.parse(competition.drawLink!),
                mode: LaunchMode.externalApplication,
              ),
              icon: const Icon(LucideIcons.externalLink, size: 16),
              label: const Text(
                'مشاهدة السحب',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFBBF24),
                foregroundColor: const Color(0xFF111827),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
