import 'package:flutter/material.dart';
import 'category_carousel.dart';

/// Home category rails — all offers & products visible (matches React).
class ProgressiveCategoryReels extends StatelessWidget {
  final List<dynamic> reels;

  const ProgressiveCategoryReels({
    super.key,
    required this.reels,
  });

  @override
  Widget build(BuildContext context) {
    if (reels.isEmpty) return const SizedBox.shrink();

    return Column(
      children: [
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: reels.length,
          separatorBuilder: (context, index) =>
              const Divider(height: 32, color: Colors.transparent),
          itemBuilder: (context, index) {
            final reel = reels[index] is Map
                ? Map<String, dynamic>.from(reels[index] as Map)
                : <String, dynamic>{};
            final List allOffers = reel['offers'] ?? [];
            final List allProducts = reel['products'] ?? [];

            return CategoryCarousel(
              reel: reel,
              allReels: reels,
              totalOffersCount: allOffers.length,
              totalProductsCount: allProducts.length,
              hideHeader: reel['isParentFallback'] == true,
            );
          },
        ),
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 20),
          child: Text(
            '— انتهت العروض —',
            style: TextStyle(
              color: Colors.grey,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              fontFamily: 'Cairo',
            ),
          ),
        ),
      ],
    );
  }
}
