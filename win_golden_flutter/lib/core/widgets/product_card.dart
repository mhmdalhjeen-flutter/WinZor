import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../utils/currency_utils.dart';
import '../utils/media_url.dart';
import 'app_image.dart';

class ProductCard extends StatelessWidget {
  final Map<String, dynamic> product;

  const ProductCard({
    super.key,
    required this.product,
  });

  @override
  Widget build(BuildContext context) {
    final String? image = resolveProductImage(product);
    final String name = product['name'] ?? '';
    final double price = (product['price'] ?? 0).toDouble();
    final String currency = product['currency'] ?? 'ILS';
    final double ratingAvg = (product['ratingAvg'] ?? 0).toDouble();
    final id = (product['_id'] ?? product['id'] ?? '').toString();

    return GestureDetector(
      onTap: id.isEmpty ? null : () => context.push('/product/$id'),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF3F4F6)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (image != null && image.isNotEmpty)
                    AppImage(
                      src: image,
                      fit: BoxFit.cover,
                    )
                  else
                    Container(
                      color: const Color(0xFFF9FAFB),
                      child: const Center(
                        child: Text(
                          'بدون صورة',
                          style: TextStyle(
                            color: Colors.grey,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                      fontFamily: 'Cairo',
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    CurrencyUtils.formatPrice(price, currency),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900, // تصحيح من black إلى w900
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(LucideIcons.star, size: 10, color: Colors.amber, fill: 1.0),
                      const SizedBox(width: 4),
                      Text(
                        ratingAvg.toStringAsFixed(1),
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.amber,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
