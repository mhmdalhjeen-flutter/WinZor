import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/marketplace_providers.dart';
import '../widgets/marketplace_tab_nav.dart';
import '../widgets/marketplace_filters.dart';
import '../widgets/bazaar_listing_card.dart';
import '../widgets/publish_bottom_sheet.dart';
import '../widgets/bazaar_constants.dart';
import '../models/bazaar_listing_model.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../../verification/presentation/providers/verification_gate_provider.dart';

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
              _buildPublishCta(context, ref, isAuth),

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
              child: RefreshIndicator(
                onRefresh: () async {
                  if (activeTab == 'mine') {
                    ref.invalidate(myBazaarListingsProvider);
                  } else if (activeTab == 'favorites') {
                    ref.invalidate(favoriteBazaarListingsProvider);
                  } else {
                    ref.invalidate(bazaarBrowseProvider);
                  }
                  ref.invalidate(bazaarMetaProvider);
                },
                child: _buildTabContent(
                  context,
                  ref,
                  activeTab,
                  browseAsync,
                  myAsync,
                  favoritesAsync,
                  regionsAsync,
                  metaAsync,
                  isAuth,
                ),
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

  Widget _buildPublishCta(BuildContext context, WidgetRef ref, bool isAuth) {
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
            ref.read(verificationGateProvider.notifier).runWithVerification(() {
              PublishBottomSheet.show(context, (type) {
                context.push('/marketplace/publish', extra: {'type': type});
              });
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
    AsyncValue<List<BazaarListingModel>> browseAsync,
    AsyncValue<List<BazaarListingModel>> myAsync,
    AsyncValue<List<BazaarListingModel>> favoritesAsync,
    AsyncValue<dynamic> regionsAsync,
    AsyncValue<Map<String, dynamic>> metaAsync,
    bool isAuth,
  ) {
    if (activeTab == 'mine') {
      return myAsync.when(
        data: (listings) => listings.isEmpty 
          ? _buildEmptyState('لا منشورات بعد', 'انتقل إلى تبويب آخر واضغط «بيع أو نشر» لنشر إعلانك الأول')
          : _buildMyListings(context, ref, listings, metaAsync.value?['pointsCost'] ?? 3),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
      );
    }

    if (activeTab == 'favorites') {
      return favoritesAsync.when(
        data: (listings) => listings.isEmpty
          ? _buildEmptyState('لا مفضّلات بعد', 'اضغط على القلب في أي إعلان لحفظه هنا')
          : _buildListingList(context, ref, listings),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
      );
    }

    // Default: Browse tabs
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
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
        const SizedBox(height: 12),
        Expanded(
          child: browseAsync.when(
            data: (listings) {
              final tabConfig = marketplaceTabs[activeTab];
              final filtered = listings.where((l) => tabConfig?.types?.contains(l.transactionType) ?? false).toList();
              
              if (filtered.isEmpty) {
                return _buildEmptyState('لا إعلانات', 'جرّب تغيير المنطقة أو الفلاتر');
              }

              return _buildListingList(context, ref, filtered);
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, _) => Center(child: Text('Error: $err')),
          ),
        ),
      ],
    );
  }

  Widget _buildListingList(BuildContext context, WidgetRef ref, List<BazaarListingModel> listings) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: listings.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = listings[index];
        return BazaarListingCard(
          listing: item,
          favorited: item.isFavorited, // Note: Need pulse logic or local overrides if matching React 100%
          onClick: () => context.push('/marketplace/${item.id}'),
          onToggleFavorite: (l) async {
            try {
              await ref.read(marketplaceRepositoryProvider).toggleFavorite(l.id);
              ref.invalidate(favoriteBazaarListingsProvider);
              ref.invalidate(bazaarBrowseProvider);
            } catch (_) {}
          },
        );
      },
    );
  }

  Widget _buildMyListings(BuildContext context, WidgetRef ref, List<BazaarListingModel> listings, int pointsCost) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: listings.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = listings[index];
        final bool expiringSoon = item.expiresAt != null && item.expiresAt!.difference(DateTime.now()).inDays < 2;
        final bool canRenew = ['approved', 'expired'].contains(item.status);

        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFF3F4F6)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Thumbnail
              _buildMyListingThumb(item),
              const SizedBox(width: 12),
              
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(child: Text(item.title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis)),
                        _buildStatusBadge(item.status),
                      ],
                    ),
                    Text(
                      item.transactionType == 'custom' && item.price == 0 
                          ? 'بدون سعر' 
                          : CurrencyUtils.formatPrice(item.price, item.currency),
                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    // Actions
                    Wrap(
                      spacing: 12,
                      children: [
                        _buildInlineAction(LucideIcons.edit3, 'تعديل', () {
                          context.push('/marketplace/publish', extra: {
                            'type': item.transactionType,
                            'editingListing': item,
                          });
                        }),
                        _buildInlineAction(LucideIcons.trash2, 'حذف', () async {
                          final confirmed = await _showDeleteConfirm(context);
                          if (confirmed == true) {
                            await ref.read(marketplaceRepositoryProvider).deleteListing(item.id);
                            ref.invalidate(myBazaarListingsProvider);
                          }
                        }, color: Colors.red),
                        if (canRenew)
                          _buildInlineAction(LucideIcons.refreshCw, 'تجديد ($pointsCost نقاط)', () {
                            ref.read(verificationGateProvider.notifier).runWithVerification(() async {
                              try {
                                await ref.read(marketplaceRepositoryProvider).renewListing(item.id);
                                ref.invalidate(myBazaarListingsProvider);
                                ref.invalidate(bazaarMetaProvider);
                              } catch (e) {
                                final gate = ref.read(verificationGateProvider.notifier);
                                if (gate.handleApiVerificationError(e, () {
                                  // retry same renew
                                  ref.read(marketplaceRepositoryProvider).renewListing(item.id).then((_) {
                                    ref.invalidate(myBazaarListingsProvider);
                                    ref.invalidate(bazaarMetaProvider);
                                  });
                                })) {
                                  return;
                                }
                                // Soft ignore non-verification failures mirrors prior silent catch
                              }
                            });
                          }, color: Colors.green),
                      ],
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

  Widget _buildMyListingThumb(BazaarListingModel item) {
    final String? thumb = item.images.isNotEmpty ? item.images[item.mainImageIndex] : null;
    return Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: const Color(0xFFF3F4F6),
      ),
      clipBehavior: Clip.antiAlias,
      child: thumb != null 
        ? CachedNetworkImage(imageUrl: thumb, fit: BoxFit.cover)
        : item.transactionType == 'custom'
          ? const Center(child: Text('مطلوب', style: TextStyle(fontSize: 12, fontWeight: FontWeight.black, color: Colors.orange)))
          : const SizedBox.shrink(),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    Color bg;
    String label;

    switch (status) {
      case 'approved':
        color = const Color(0xFF059669);
        bg = const Color(0xFFDCFCE7);
        label = 'نشط';
        break;
      case 'rejected':
        color = const Color(0xFFDC2626);
        bg = const Color(0xFFFEF2F2);
        label = 'مرفوض';
        break;
      case 'expired':
        color = Colors.grey;
        bg = const Color(0xFFF3F4F6);
        label = 'منتهٍ';
        break;
      default:
        color = const Color(0xFFD97706);
        bg = const Color(0xFFFFFBEB);
        label = 'بانتظار الموافقة';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(100)),
      child: Text(label, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.black, fontFamily: 'Cairo')),
    );
  }

  Widget _buildInlineAction(IconData icon, String label, VoidCallback onTap, {Color color = AppColors.primary}) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String title, String description) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.package, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
            const SizedBox(height: 8),
            Text(description, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.bold, fontFamily: 'Tajawal')),
          ],
        ),
      ),
    );
  }

  Future<bool?> _showDeleteConfirm(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('حذف الإعلان؟', textAlign: TextAlign.right),
        content: const Text('سيتم حذف هذا المنشور بشكل نهائي.', textAlign: TextAlign.right),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('حذف', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
  }
}
