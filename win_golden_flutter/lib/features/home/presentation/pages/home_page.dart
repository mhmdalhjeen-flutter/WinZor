import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../providers/home_providers.dart';
import '../../../../core/widgets/startup_splash_gate.dart';
import '../../../competitions/presentation/providers/competitions_providers.dart';
import '../widgets/home_hero.dart';
import '../widgets/featured_competitions.dart';
import '../widgets/home_search_cards.dart';
import '../widgets/progressive_category_reels.dart';
import '../../../../core/onboarding/onboarding_target.dart';
import '../../../../core/onboarding/onboarding_targets.dart';
import '../../../../core/utils/hierarchy_path.dart';
import '../../../../core/widgets/filter_title_header.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final splashDone = ref.watch(startupSplashDoneProvider);

    if (!splashDone) {
      return const Scaffold(
        backgroundColor: Color(0xFFF7F5F2),
        body: SizedBox.shrink(),
      );
    }

    final regionsAsync = ref.watch(regionsProvider);
    final categoriesAsync = ref.watch(storeCategoriesProvider);
    final reelsAsync = ref.watch(reelsProvider);

    final regionPath = ref.watch(regionPathProvider);
    final categoryPath = ref.watch(categoryPathProvider);

    final hasActiveFilters = regionPath.isNotEmpty || categoryPath.isNotEmpty;
    final regionLabels = resolveHierarchyLabels(
      regionsAsync.asData?.value ?? [],
      regionPath,
    );
    final categoryLabels = resolveHierarchyLabels(
      categoriesAsync.asData?.value ?? [],
      categoryPath,
    );
    final filterSummary = [
      ...regionLabels,
      ...categoryLabels,
    ];

    return Scaffold(
      body: Stack(
        children: [
          // Background color/gradient
          Positioned.fill(
            child: Container(color: const Color(0xFFF7F5F2)),
          ),
          RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(regionsProvider);
              ref.invalidate(storeCategoriesProvider);
              ref.invalidate(reelsProvider);
              ref.invalidate(featuredCompetitionsProvider);
            },
            child: CustomScrollView(
              slivers: [
                const SliverToBoxAdapter(child: SizedBox(height: 12)),
                const SliverToBoxAdapter(child: HomeHero()),
                const SliverToBoxAdapter(child: SizedBox(height: 16)),
                SliverToBoxAdapter(
                  child: OnboardingTarget(
                    targetKey: OnboardingTargets.prizeDraw,
                    child: const FeaturedCompetitions(),
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 16)),
                SliverToBoxAdapter(
                  child: HomeSearchCards(
                    regionTree: regionsAsync.asData?.value ?? [],
                    regionPath: regionPath,
                    onRegionPathChange: (path) => ref.read(regionPathProvider.notifier).state = path,
                    regionsLoading: regionsAsync.isLoading,
                    categoryTree: categoriesAsync.asData?.value ?? [],
                    categoryPath: categoryPath,
                    onCategoryPathChange: (path) => ref.read(categoryPathProvider.notifier).state = path,
                    categoriesLoading: categoriesAsync.isLoading,
                    onSearchTriggered: () {
                      // Handled by providers watching the paths
                    },
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 20)),

                reelsAsync.when(
                  data: (reels) {
                    return SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      sliver: SliverToBoxAdapter(
                        child: OnboardingTarget(
                          targetKey: OnboardingTargets.home,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              FilterTitleHeader(
                                title: 'العروض',
                                icon: Icons.auto_awesome,
                                iconColor: const Color(0xFFB91C1C),
                                filterLabels: filterSummary,
                                onClear: hasActiveFilters
                                    ? () {
                                        ref.read(regionPathProvider.notifier).state = [];
                                        ref.read(categoryPathProvider.notifier).state = [];
                                      }
                                    : null,
                              ),
                              const SizedBox(height: 12),
                              if (reels.isEmpty)
                                const Padding(
                                  padding: EdgeInsets.symmetric(vertical: 48),
                                  child: Center(
                                    child: Text(
                                      'لا توجد عروض مطابقة حالياً',
                                      style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                )
                              else
                                OnboardingTarget(
                                  targetKey: OnboardingTargets.reelViewer,
                                  child: ProgressiveCategoryReels(reels: reels),
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                  loading: () => const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(20.0),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  ),
                  error: (err, stack) => SliverToBoxAdapter(
                    child: Container(
                      padding: const EdgeInsets.all(24),
                      child: Center(
                        child: Column(
                          children: [
                            const Icon(Icons.cloud_off, size: 48, color: Colors.grey),
                            const SizedBox(height: 12),
                            Text(
                              err is DioException && (err.type == DioExceptionType.receiveTimeout || err.type == DioExceptionType.connectionTimeout)
                                  ? 'السيرفر يستغرق وقتاً طويلاً للاستيقاظ. يرجى سحب الصفحة للأسفل للتحديث.'
                                  : 'حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.',
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: Colors.grey, fontFamily: 'Cairo'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                
                const SliverToBoxAdapter(child: SizedBox(height: 80)), // Space for bottom nav
              ],
            ),
          ),
        ],
      ),
    );
  }
}
