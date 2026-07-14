import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/home_providers.dart';
import '../widgets/home_hero.dart';
import '../widgets/featured_competitions.dart';
import '../widgets/home_search_cards.dart';
import '../widgets/progressive_category_reels.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                  child: HomeSearchCards(
                    regionTree: regionsAsync.value ?? [],
                    regionPath: regionPath,
                    onRegionPathChange: (path) => ref.read(regionPathProvider.notifier).state = path,
                    regionsLoading: regionsAsync.isLoading,
                    categoryTree: categoriesAsync.value ?? [],
                    categoryPath: categoryPath,
                    onCategoryPathChange: (path) => ref.read(categoryPathProvider.notifier).state = path,
                    categoriesLoading: categoriesAsync.isLoading,
                    onSearchTriggered: () {
                      // Handled by providers watching the paths
                    },
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 20)),
                
                // Offers Header
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverToBoxAdapter(
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
                      child: ProgressiveCategoryReels(reels: reels),
                    );
                  },
                  loading: () => const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(20.0),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  ),
                  error: (err, stack) => SliverToBoxAdapter(
                    child: Center(child: Text('Error: $err')),
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
