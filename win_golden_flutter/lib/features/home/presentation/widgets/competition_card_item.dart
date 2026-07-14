import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../home/data/models/competition_model.dart';

class CompetitionCardItem extends StatelessWidget {
  final CompetitionModel competition;
  final int userPoints;
  final bool embedded;

  const CompetitionCardItem({
    super.key,
    required this.competition,
    required this.userPoints,
    this.embedded = false,
  });

  @override
  Widget build(BuildContext context) {
    final bool hasEnded = competition.status == 'ended';
    final double progress = competition.requiredParticipants > 0
        ? (competition.participantsCount / competition.requiredParticipants).clamp(0.0, 1.0)
        : 0.0;

    final bool eligible = userPoints >= competition.minPoints;
    final int missingPoints = (competition.minPoints - userPoints).clamp(0, 999999);

    if (hasEnded) {
      return _buildEndedCard();
    }

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
              // Image
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withOpacity(0.25), width: 2),
                  color: Colors.white.withOpacity(0.05),
                ),
                clipBehavior: Clip.antiAlias,
                child: competition.image != null
                    ? CachedNetworkImage(
                        imageUrl: competition.image!,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(color: Colors.white10),
                        errorWidget: (context, url, error) => const Icon(Icons.trophy, color: Colors.amber, size: 32),
                      )
                    : const Icon(Icons.trophy, color: Colors.amber, size: 32),
              ),
              const SizedBox(width: 12),
              // Info
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
                    // Progress
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
                    // Stats
                    Wrap(
                      spacing: 12,
                      children: [
                        _buildStat(Icons.people_outline, '${competition.participantsCount}${competition.requiredParticipants > 0 ? " / ${competition.requiredParticipants}" : ""}', Colors.skyBlue),
                        _buildStat(Icons.stars, '${competition.minPoints}+ نقطة', Colors.amber),
                      ],
                    ),
                  ],
                ),
              ),
              // Countdown Placeholder
              if (competition.endDate != null)
                _buildCountdown(competition.endDate!),
            ],
          ),
          const SizedBox(height: 14),
          // Action Button
          if (eligible)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 4,
                  shadowColor: AppColors.primary.withOpacity(0.25),
                ),
                child: const Text(
                  'أريد المشاركة',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
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
                  const Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 14),
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

  Widget _buildStat(IconData icon, String label, Color color) {
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

  Widget _buildCountdown(DateTime endDate) {
    final diff = endDate.difference(DateTime.now());
    if (diff.isNegative) return const SizedBox.shrink();
    
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
            '${diff.inDays}',
            style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.black),
          ),
          const Text(
            'يوم',
            style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.access_time, color: Colors.amber, size: 11),
              const SizedBox(width: 2),
              Text(
                '${diff.inHours % 24}س',
                style: const TextStyle(color: Colors.amber, fontSize: 12, fontWeight: FontWeight.black),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEndedCard() {
    return Container(
       padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.yellow.shade500.withOpacity(0.2), Colors.amber.shade600.withOpacity(0.25), Colors.purple.shade900.withOpacity(0.5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.yellow.shade400.withOpacity(0.7), width: 2),
      ),
      child: Column(
        children: [
           Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.yellow.shade300.withOpacity(0.8), width: 2),
            ),
            clipBehavior: Clip.antiAlias,
            child: competition.prizeImage != null || competition.image != null
                ? CachedNetworkImage(
                    imageUrl: (competition.prizeImage ?? competition.image)!,
                    fit: BoxFit.cover,
                  )
                : const Icon(Icons.trophy, color: Colors.amber, size: 36),
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
                Text('تم إعلان الفائز', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.black)),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            competition.prizeName ?? competition.title,
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.black),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
