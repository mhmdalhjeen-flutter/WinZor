import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../competitions/presentation/providers/competitions_providers.dart';
import 'competition_card_item.dart';

class FeaturedCompetitions extends ConsumerWidget {
  const FeaturedCompetitions({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final competitionsAsync = ref.watch(featuredCompetitionsProvider);

    return competitionsAsync.when(
      data: (competitions) {
        if (competitions.isEmpty) return const SizedBox.shrink();

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8.0),
          child: Column(
            children: [
              if (competitions.length > 1)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: CompetitionCardItem(
                        competition: competitions[0],
                        embedded: true,
                        onUpdated: () =>
                            ref.invalidate(featuredCompetitionsProvider),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: CompetitionCardItem(
                        competition: competitions[1],
                        embedded: true,
                        onUpdated: () =>
                            ref.invalidate(featuredCompetitionsProvider),
                      ),
                    ),
                  ],
                )
              else
                CompetitionCardItem(
                  competition: competitions[0],
                  embedded: true,
                  onUpdated: () =>
                      ref.invalidate(featuredCompetitionsProvider),
                ),
            ],
          ),
        );
      },
      loading: () => _buildLoadingSkeleton(),
      error: (err, stack) => const SizedBox.shrink(),
    );
  }

  Widget _buildLoadingSkeleton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8.0),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFF3F4F6)),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Container(
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFF3F4F6)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
