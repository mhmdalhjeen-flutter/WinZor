import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../offers/models/reel_viewer_item.dart';
import 'marketplace_offer_card.dart';

class CategoryCarousel extends StatelessWidget {
  final Map<String, dynamic> reel;
  final List<dynamic> allReels;
  final int totalOffersCount;
  final int totalProductsCount;
  final bool hideHeader;

  const CategoryCarousel({
    super.key,
    required this.reel,
    required this.allReels,
    required this.totalOffersCount,
    required this.totalProductsCount,
    this.hideHeader = false,
  });

  void _openViewer(BuildContext context, {required int offerIndex, int? productIndex}) {
    final reelIndex = findReelIndex(allReels, reel);
    final state = buildMultiCategoryViewerState(
      allReels,
      reelIndex: reelIndex >= 0 ? reelIndex : 0,
      offerIndex: offerIndex,
      productIndex: productIndex,
    );
    if (state.items.isEmpty) return;

    context.push('/reels', extra: {
      'items': state.items,
      'initialIndex': state.initialIndex,
    });
  }

  @override
  Widget build(BuildContext context) {
    final List offers = reel['offers'] ?? [];
    final List products = reel['products'] ?? [];
    final String categoryName = reel['categoryName'] ?? 'تصنيف';
    final String? categoryIcon = reel['categoryIcon'];

    final screenW = MediaQuery.sizeOf(context).width;
    final cardW = ((screenW - 5 - 12) / 1.5).clamp(180.0, 280.0);
    const railPaddingV = 16.0;
    final railHeight = cardW / MarketplaceOfferCard.aspectRatio + railPaddingV;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (!hideHeader)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
            child: Row(
              children: [
                if (categoryIcon != null)
                  Text(categoryIcon, style: const TextStyle(fontSize: 18))
                else
                  const Icon(Icons.auto_awesome,
                      color: AppColors.primary, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    categoryName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                      fontFamily: 'Cairo',
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Flexible(
                  child: Text(
                    products.isNotEmpty
                        ? '$totalOffersCount عرض · $totalProductsCount منتج'
                        : '$totalOffersCount عرض',
                    textAlign: TextAlign.end,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.chevron_right, color: Colors.grey, size: 16),
              ],
            ),
          ),
        SizedBox(
          height: railHeight,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            itemCount:
                offers.length + (products.isNotEmpty ? 1 : 0) + products.length,
            itemBuilder: (context, index) {
              if (index < offers.length) {
                return MarketplaceOfferCard(
                  item: offers[index],
                  preferredWidth: cardW,
                  onTap: () => _openViewer(context, offerIndex: index),
                );
              }

              if (products.isNotEmpty && index == offers.length) {
                return const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: VerticalDivider(
                    width: 1,
                    thickness: 1,
                    color: Color(0x33000000),
                  ),
                );
              }

              final productIndex = products.isNotEmpty
                  ? index - offers.length - 1
                  : index - offers.length;
              if (productIndex >= 0 && productIndex < products.length) {
                final product = products[productIndex];
                final productMap = product is Map
                    ? Map<String, dynamic>.from(product)
                    : <String, dynamic>{};
                final mappedProduct = {
                  ...productMap,
                  'title': productMap['name'],
                  'pricing': {
                    'finalPrice': productMap['price'],
                    'currency': productMap['currency'],
                  },
                };
                return MarketplaceOfferCard(
                  item: mappedProduct,
                  preferredWidth: cardW,
                  topBadge: '🛍️ للتسوق',
                  onTap: () => _openViewer(
                    context,
                    offerIndex: 0,
                    productIndex: productIndex,
                  ),
                );
              }

              return const SizedBox.shrink();
            },
          ),
        ),
      ],
    );
  }
}
