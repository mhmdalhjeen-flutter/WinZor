import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/store_card.dart'; // Placeholder if needed
import '../providers/marketplace_providers.dart';
import '../widgets/marketplace_tab_nav.dart';
import '../widgets/marketplace_filters.dart';
import '../widgets/bazaar_listing_card.dart';
import '../widgets/publish_bottom_sheet.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../home/presentation/providers/home_providers.dart';

class MarketplacePage extends ConsumerWidget {
  const MarketplacePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeTab = ref.watch(marketplaceActiveTabProvider);
    final isAuth = ref.watch(authProvider).isAuth;
    final regionsAsync = ref.watch(regionsProvider);
    
    // Data providers
    final browseAsync = ref.watch(bazaarBrowseProvider);
    final myAsync = ref.watch(myBazaarListingsProvider);
    final favoritesAsync = ref.watch(favoriteBazaarListingsProvider);
    final metaAsync = ref.watch(bazaarMetaProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Column(
          children: [
            // Header
            _buildHeader(),
            
            // Publish CTA
            if (activeTab != 'mine')
              _buildPublishCta(context, isAuth),

            // Tab Navigation
            MarketplaceTabNav(
              activeTab: activeTab,
              onTabChange: (tab) {
                if ((tab == 'mine' || tab == 'favorites') && !isAuth) {
                  context.push('/login');
                  return;
                }
                ref.read(marketplaceActiveTabProvider.notifier).state = tab;
              },
            ),

            // Main Content
            Expanded(
              child: _buildTabContent(
                context,
                ref,
                activeTab,
                browseAsync,
                myAsync,
                favoritesAsync,
                regionsAsync,
                metaAsync,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      child: const Column(
        children: [
          Text(
            'السوق المفتوح',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Color(0xFF111827),
              fontFamily: 'Cairo',
            ),
          ),
          SizedBox(height: 8),
          Text(
            'هنا يمكنك بيع أغراضك، شراء ما تبحث عنه، عرض أو استئجار العقارات والمركبات، ونشر طلباتك، كل ذلك في مكان واحد.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: Color(0xFF4B5563),
              height: 1.5,
              fontWeight: FontWeight.w500,
              fontFamily: 'Tajawal',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPublishCta(BuildContext context, bool isAuth) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: SizedBox(
        width: double.infinity,
        height: 54,
        child: ElevatedButton(
          onPressed: () {
            if (!isAuth) {
              context.push('/login');
              return;
            }
            PublishBottomSheet.show(context, (type) {
              // Open Publish Form Step (Will implement in next sub-step)
            });
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 4,
            shadowColor: AppColors.primary.withOpacity(0.3),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.plus, size: 20),
              SizedBox(width: 8),
              Text('بيع أو نشر', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabContent(
    BuildContext context,
    WidgetRef ref,
    String activeTab,
    AsyncValue browseAsync,
    AsyncValue myAsync,
    AsyncValue favoritesAsync,
    AsyncValue regionsAsync,
    AsyncValue metaAsync,
  ) {
    if (activeTab == 'mine') {
      return myAsync.when(
        data: (listings) => _buildList(listings, isMine: true),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
      );
    }

    if (activeTab == 'favorites') {
      return favoritesAsync.when(
        data: (listings) => _buildList(listings),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
      );
    }

    // Default: Browse tabs (sellExchange, rent, wanted)
    return Column(
      children: [
        // Filters
        Padding(
          padding: const EdgeInsets.all(16),
          child: MarketplaceFilters(
            regionTree: regionsAsync.value ?? [],
            regionPath: ref.watch(marketplaceRegionPathProvider),
            onRegionPathChange: (path) => ref.read(marketplaceRegionPathProvider.notifier).state = path,
            regionsLoading: regionsAsync.isLoading,
            filterCondition: ref.watch(marketplaceConditionProvider),
            onFilterConditionChange: (val) => ref.read(marketplaceConditionProvider.notifier).state = val,
            filterCategory: ref.watch(marketplaceCategoryProvider),
            onFilterCategoryChange: (val) => ref.read(marketplaceCategoryProvider.notifier).state = val,
          ),
        ),

        // Result List
        Expanded(
          child: browseAsync.when(
            data: (listings) {
              // Filter locally if needed based on tab types
              final tabConfig = marketplaceTabs[activeTab];
              final filtered = listings.where((l) => tabConfig?.types?.contains(l.transactionType) ?? false).toList();
              
              if (filtered.isEmpty) {
                return const Center(child: Text('لا توجد إعلانات حالياً', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)));
              }

              return _buildList(filtered);
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, _) => Center(child: Text('Error: $err')),
          ),
        ),
      ],
    );
  }

  Widget _buildList(List listings, {bool isMine = false}) {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      itemCount: listings.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = listings[index];
        return BazaarListingCard(
          listing: item,
          onClick: () {
            // Navigate to /marketplace/${item.id}
          },
          onToggleFavorite: (l) {
            // Toggle favorite logic
          },
        );
      },
    );
  }
}
