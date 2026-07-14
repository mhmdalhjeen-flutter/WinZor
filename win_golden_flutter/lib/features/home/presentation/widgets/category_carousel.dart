import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import 'marketplace_offer_card.dart';

class CategoryCarousel extends StatelessWidget {
  final Map<String, dynamic> reel;
  final int totalOffersCount;
  final int totalProductsCount;
  final bool hideHeader;

  const CategoryCarousel({
    super.key,
    required this.reel,
    required this.totalOffersCount,
    required this.totalProductsCount,
    this.hideHeader = false,
  });

  @override
  Widget build(BuildContext context) {
    final List offers = reel['offers'] ?? [];
    final List products = reel['products'] ?? [];
    final String categoryName = reel['categoryName'] ?? 'تصنيف';
    final String? categoryIcon = reel['categoryIcon'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (!hideHeader)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                if (categoryIcon != null)
                  Text(categoryIcon, style: const TextStyle(fontSize: 18))
                else
                  const Icon(Icons.auto_awesome, color: AppColors.primary, size: 18),
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
                  ),
                ),
                Text(
                  products.isNotEmpty
                      ? '$totalOffersCount عرض · $totalProductsCount منتج'
                      : '$totalOffersCount عرض',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.chevron_right, color: Colors.grey, size: 16),
              ],
            ),
          ),
        SizedBox(
          height: 240, // Height to accommodate MarketplaceOfferCard
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: offers.length + (products.isNotEmpty ? 1 : 0) + products.length,
            itemBuilder: (context, index) {
              if (index < offers.length) {
                return MarketplaceOfferCard(
                  item: offers[index],
                  onTap: () {
                    // Navigate to offer detail or viewer
                  },
                );
              }
              
              if (products.isNotEmpty && index == offers.length) {
                return Container(
                  width: 40,
                  alignment: Alignment.center,
                  child: Container(
                    width: 1,
                    height: 100,
                    color: Colors.grey.withOpacity(0.2),
                  ),
                );
              }

              final productIndex = products.isNotEmpty ? index - offers.length - 1 : index - offers.length;
              if (productIndex >= 0 && productIndex < products.length) {
                final product = products[productIndex];
                // Map product to card format
                final mappedProduct = {
                  ...product,
                  'title': product['name'],
                  'pricing': {
                    'finalPrice': product['price'],
                    'currency': product['currency'],
                  }
                };
                return MarketplaceOfferCard(
                  item: mappedProduct,
                  topBadge: '🛍️ للتسوق',
                  onTap: () {
                    // Navigate to product detail
                  },
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
