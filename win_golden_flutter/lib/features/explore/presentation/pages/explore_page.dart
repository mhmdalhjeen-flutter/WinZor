import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/explore_providers.dart';
import '../widgets/quick_search_drawer.dart';
import '../widgets/store_region_suggestion.dart';
import '../../../../core/widgets/store_card.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/store_model.dart';

class ExplorePage extends ConsumerWidget {
  const ExplorePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final browseAsync = ref.watch(storeBrowseProvider);
    final regionsAsync = ref.watch(exploreRegionsProvider);
    final categoriesAsync = ref.watch(exploreCategoriesProvider);
    
    final regionPath = ref.watch(exploreRegionPathProvider);
    final categoryPath = ref.watch(exploreCategoryPathProvider);
    final searchQuery = ref.watch(exploreSearchQueryProvider);

    final hasActiveSearch = searchQuery.isNotEmpty || regionPath.isNotEmpty || categoryPath.isNotEmpty;

    return Scaffold(
      backgroundColor: const Color(0xFFF7F5F2),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(storeBrowseProvider);
          },
          child: CustomScrollView(
            slivers: [
              // Header
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'المتاجر',
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                      ),
                      browseAsync.when(
                        data: (data) => Text(
                          '${data['total'] ?? 0} متجر نشط',
                          style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                        ),
                        loading: () => const SizedBox.shrink(),
                        error: (_, __) => const SizedBox.shrink(),
                      ),
                    ],
                  ),
                ),
              ),

              // Search Bar & Filter Button
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverToBoxAdapter(
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          onChanged: (val) => ref.read(exploreSearchQueryProvider.notifier).state = val,
                          decoration: InputDecoration(
                            hintText: 'ابحث عن متجر...',
                            prefixIcon: const Icon(LucideIcons.search, size: 18),
                            contentPadding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      if (hasActiveSearch)
                        _buildClearSearchButton(ref)
                      else
                        _buildQuickSearchButton(context, ref, regionsAsync, categoriesAsync),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 24)),

              // Main Content
              browseAsync.when(
                data: (data) {
                  final List parentGroups = data['parentGroups'] ?? [];
                  final List groups = data['groups'] ?? [];
                  final suggestion = data['suggestion'];
                  final int total = data['total'] ?? 0;

                  if (total == 0 && suggestion != null) {
                    return SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      sliver: SliverToBoxAdapter(
                        child: StoreRegionSuggestion(
                          suggestion: suggestion,
                          onApply: (id) => ref.read(exploreRegionPathProvider.notifier).state = [id],
                        ),
                      ),
                    );
                  }

                  if (total == 0) {
                    return const SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Text(
                          'لا توجد متاجر مطابقة حالياً',
                          style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                        ),
                      ),
                    );
                  }

                  // If parentGroups is empty, we derive them from groups like in React
                  final List finalParentGroups = parentGroups.isNotEmpty 
                    ? parentGroups 
                    : _deriveParentGroups(groups);

                  return SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final parentGroup = finalParentGroups[index];
                        return _buildParentGroupSection(parentGroup);
                      },
                      childCount: finalParentGroups.length,
                    ),
                  );
                },
                loading: () => const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (err, stack) => SliverFillRemaining(
                  child: Center(child: Text('Error: $err')),
                ),
              ),
              
              const SliverToBoxAdapter(child: SizedBox(height: 80)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildClearSearchButton(WidgetRef ref) {
    return ElevatedButton(
      onPressed: () {
        ref.read(exploreSearchQueryProvider.notifier).state = '';
        ref.read(exploreRegionPathProvider.notifier).state = [];
        ref.read(exploreCategoryPathProvider.notifier).state = [];
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFF5F3FF),
        foregroundColor: const Color(0xFF7C3AED),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFDDD6FE))),
      ),
      child: const Text('إلغاء البحث', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
    );
  }

  Widget _buildQuickSearchButton(BuildContext context, WidgetRef ref, AsyncValue regions, AsyncValue categories) {
    return ElevatedButton(
      onPressed: () {
        QuickSearchDrawer.show(
          context,
          QuickSearchDrawer(
            regionTree: regions.value ?? [],
            regionPath: ref.read(exploreRegionPathProvider),
            onRegionPathChange: (path) => ref.read(exploreRegionPathProvider.notifier).state = path,
            regionsLoading: regions.isLoading,
            categoryTree: categories.value ?? [],
            categoryPath: ref.read(exploreCategoryPathProvider),
            onCategoryPathChange: (path) => ref.read(exploreCategoryPathProvider.notifier).state = path,
            categoriesLoading: categories.isLoading,
            onApply: () {},
          ),
        );
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFE5E7EB))),
      ),
      child: const Row(
        children: [
          Icon(LucideIcons.slidersHorizontal, size: 18, color: AppColors.primary),
          SizedBox(width: 8),
          Text('بحث سريع', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
        ],
      ),
    );
  }

  List _deriveParentGroups(List groups) {
    final Map<String, dynamic> derived = {};
    for (var group in groups) {
      final String parentKey = group['parentCategoryId'] ?? group['parentCategory'] ?? group['category'];
      if (!derived.containsKey(parentKey)) {
        derived[parentKey] = {
          'parentCategoryId': parentKey,
          'parentCategory': group['parentCategory'] ?? group['category'],
          'sections': [],
        };
      }
      derived[parentKey]['sections'].add({
        'category': group['category'],
        'categoryId': group['categoryId'],
        'isParentFallback': group['isParentFallback'],
        'stores': group['stores'] ?? [],
      });
    }
    return derived.values.toList();
  }

  Widget _buildParentGroupSection(dynamic parentGroup) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              children: [
                const Icon(LucideIcons.store, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                Text(
                  parentGroup['parentCategory'] ?? '',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          ...((parentGroup['sections'] as List).map((section) => _buildSection(section, parentGroup['parentCategory']))),
        ],
      ),
    );
  }

  Widget _buildSection(dynamic section, String? parentCategory) {
    final bool showChildTitle = section['isParentFallback'] != true && 
                                section['category'] != null && 
                                section['category'] != parentCategory;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (showChildTitle)
                  Text(
                    section['category'],
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF374151), fontFamily: 'Cairo'),
                  )
                else
                  const SizedBox.shrink(),
                TextButton(
                  onPressed: () {}, // Navigate to search
                  child: const Row(
                    children: [
                      Text('المزيد', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.primary, fontFamily: 'Cairo')),
                      Icon(LucideIcons.chevronLeft, size: 14, color: AppColors.primary),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 240,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: (section['stores'] as List).length,
              itemBuilder: (context, index) {
                final storeJson = section['stores'][index];
                return StoreCard(
                  store: StoreModel.fromJson(storeJson),
                  membershipStatus: storeJson['membershipStatus'],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
