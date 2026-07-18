import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../providers/home_providers.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../competitions/presentation/providers/competitions_providers.dart';
import '../widgets/home_hero.dart';
import '../widgets/featured_competitions.dart';
import '../widgets/home_search_cards.dart';
import '../widgets/progressive_category_reels.dart';
import '../../../../core/onboarding/onboarding_target.dart';
import '../../../../core/onboarding/onboarding_targets.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    // React `/` → Intro when guest
    if (!auth.isLoading && !auth.isAuth) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go('/intro');
      });
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final regionsAsync = ref.watch(regionsProvider);
    final categoriesAsync = ref.watch(storeCategoriesProvider);
    final reelsAsync = ref.watch(reelsProvider);

    final regionPath = ref.watch(regionPathProvider);
    final categoryPath = ref.watch(categoryPathProvider);

    final hasActiveFilters = regionPath.isNotEmpty || categoryPath.isNotEmpty;

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
                const SliverToBoxAdapter(child: FeaturedCompetitions()),
                const SliverToBoxAdapter(child: SizedBox(height: 16)),
                SliverToBoxAdapter(
                  child: OnboardingTarget(
                    targetKey: OnboardingTargets.search,
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
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 20)),

                // Offers Header
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverToBoxAdapter(
                    child: OnboardingTarget(
                      targetKey: OnboardingTargets.home,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.auto_awesome, color: Color(0xFFB91C1C), size: 18),
                              SizedBox(width: 8),
                              Text(
                                'العروض',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF111827),
                                  fontFamily: 'Cairo',
                                ),
                              ),
                            ],
                          ),
                          if (hasActiveFilters)
                            GestureDetector(
                              onTap: () {
                                ref.read(regionPathProvider.notifier).state = [];
                                ref.read(categoryPathProvider.notifier).state = [];
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF5F3FF),
                                  borderRadius: BorderRadius.circular(100),
                                  border: Border.all(color: const Color(0xFFDDD6FE)),
                                ),
                                child: const Text(
                                  'إلغاء التصفية',
                                  style: TextStyle(
                                    color: Color(0xFF7C3AED),
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
                
                const SliverToBoxAdapter(child: SizedBox(height: 12)),

                reelsAsync.when(
                  data: (reels) {
                    if (reels.isEmpty) {
                      return const SliverFillRemaining(
                        hasScrollBody: false,
                        child: Center(
                          child: Text(
                            'لا توجد عروض مطابقة حالياً',
                            style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
                          ),
                        ),
                      );
                    }
                    return SliverToBoxAdapter(
                      child: OnboardingTarget(
                        targetKey: OnboardingTargets.reelViewer,
                        child: ProgressiveCategoryReels(reels: reels),
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
