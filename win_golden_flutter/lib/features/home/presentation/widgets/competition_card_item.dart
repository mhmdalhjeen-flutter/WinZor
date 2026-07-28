import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
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
    final eligible = userPoints >= competition.minPoints;
    final missingPoints =
        (competition.minPoints - userPoints).clamp(0, 1 << 30);

    if (hasEnded) {
      return _EndedCard(competition: competition);
    }

    final remaining = competition.endDate?.difference(DateTime.now());
    final prizeImage = competition.prizeImage ?? competition.image;

    return LayoutBuilder(
      builder: (context, constraints) {
        final imageWidth = (constraints.maxWidth * 0.2).clamp(48.0, 72.0);

        return Container(
          padding: const EdgeInsets.all(9),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1E1638), Color(0xFF2A1545), Color(0xFF7F1D1D)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: Colors.white.withOpacity(0.15)),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1E1638).withOpacity(0.18),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: imageWidth,
                      child: AspectRatio(
                        aspectRatio: 0.85,
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(11),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.25),
                              width: 1.5,
                            ),
                            color: Colors.white.withOpacity(0.05),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: prizeImage != null
                              ? AppImage(src: prizeImage, fit: BoxFit.cover)
                              : const Icon(
                                  Icons.emoji_events,
                                  color: Colors.amber,
                                  size: 22,
                                ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            competition.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Cairo',
                              height: 1.2,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Expanded(
                                child: Row(
                                  children: [
                                    const Icon(
                                      LucideIcons.coins,
                                      color: Colors.amber,
                                      size: 10,
                                    ),
                                    const SizedBox(width: 3),
                                    Flexible(
                                      child: Text(
                                        '${competition.minPoints} نقطة / فرصة',
                                        style: const TextStyle(
                                          color: Colors.white70,
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.bold,
                                          fontFamily: 'Cairo',
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (remaining != null && !remaining.isNegative)
                                _CompactCountdown(remaining: remaining),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              if (eligible)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SizedBox(
                      width: double.infinity,
                      height: 32,
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
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(9),
                          ),
                          elevation: 2,
                        ),
                        child: Text(
                          competition.joined ? 'زيادة الفرصة' : 'الدخول للسحب',
                          style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ),
                    ),
                    if (competition.joined) ...[
                      const SizedBox(height: 4),
                      Text(
                        'عدد الفرص الحالية: ${competition.myEntries}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Color(0xFF6EE7B7),
                          fontSize: 9.5,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ],
                  ],
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(9),
                    border: Border.all(color: Colors.amber.withOpacity(0.25)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        LucideIcons.alertTriangle,
                        color: Colors.amber,
                        size: 11,
                      ),
                      const SizedBox(width: 5),
                      Expanded(
                        child: Text(
                          'تحتاج $missingPoints نقطة إضافية',
                          style: const TextStyle(
                            color: Color(0xFFFDE68A),
                            fontSize: 10,
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
      },
    );
  }
}

class _CompactCountdown extends StatelessWidget {
  final Duration remaining;

  const _CompactCountdown({required this.remaining});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withOpacity(0.15)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '${remaining.inDays} ي',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(width: 4),
          const Icon(LucideIcons.clock, color: Colors.amber, size: 10),
          const SizedBox(width: 2),
          Text(
            '${remaining.inHours % 24} س',
            style: const TextStyle(
              color: Colors.amber,
              fontSize: 11,
              fontWeight: FontWeight.w900,
            ),
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
      padding: const EdgeInsets.all(12),
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
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.yellow.shade400.withOpacity(0.7),
          width: 1.5,
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.yellow.shade300.withOpacity(0.8),
                width: 1.5,
              ),
            ),
            clipBehavior: Clip.antiAlias,
            child: prizeImage != null
                ? AppImage(src: prizeImage, fit: BoxFit.cover)
                : const Icon(Icons.emoji_events, color: Colors.amber, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            prizeName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w900,
              fontFamily: 'Cairo',
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (competition.drawLink != null &&
              competition.drawLink!.isNotEmpty) ...[
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: () => launchUrl(
                Uri.parse(competition.drawLink!),
                mode: LaunchMode.externalApplication,
              ),
              icon: const Icon(LucideIcons.externalLink, size: 14),
              label: const Text(
                'مشاهدة السحب',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                  fontSize: 11,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFBBF24),
                foregroundColor: const Color(0xFF111827),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                minimumSize: const Size(0, 32),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
